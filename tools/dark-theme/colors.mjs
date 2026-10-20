// Colour maths and the light -> dark mapping used by the dark-theme PostCSS plugin.
//
// The app writes its colours straight into class names (bg-[#F8FAFC], text-slate-600, hover:bg-gray-50 ...), so
// instead of touching ~190 files the build creates a dark twin of every colour in the compiled CSS. A colour is mapped by
// WHAT IT IS USED FOR (a surface, text, or a border), not just by its value:
//   surface (background): light greys / white become layered dark surfaces; dark surfaces (buttons, tooltips) stay dark but
//                         are lifted so they still stand out from the page; brand/status colours stay as they are,
//                         pale tints (green-50, red-50 ...) become deep tinted surfaces.
//   text / icon (color, fill, stroke): dark greys become light greys; white text stays white (it sits on a coloured
//                         or dark surface); coloured text is lifted so it stays readable.
//   border: light greys become subtle dark lines; coloured borders keep their colour; tinted ones darken.
//
// All maths is in OKLCH so hue and perceived lightness behave. No backslashes in the regular expressions on purpose.

const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const fromLinear = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);

function rgbToOklch(r, g, b, a = 1) {
  const lr = toLinear(r), lg = toLinear(g), lb = toLinear(b);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const C = Math.hypot(A, B);
  let h = (Math.atan2(B, A) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { L, C, h: C < 1e-4 ? 0 : h, a };
}

function oklchToRgb(L, C, h) {
  const A = C * Math.cos((h * Math.PI) / 180);
  const B = C * Math.sin((h * Math.PI) / 180);
  const l = Math.pow(L + 0.3963377774 * A + 0.2158037573 * B, 3);
  const m = Math.pow(L - 0.1055613458 * A - 0.0638541728 * B, 3);
  const s = Math.pow(L - 0.0894841775 * A - 1.291485548 * B, 3);
  return [
    fromLinear(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    fromLinear(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    fromLinear(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}

const inGamut = (rgb) => rgb.every((v) => v >= -0.001 && v <= 1.001);

/** {L,C,h,a} -> "#rrggbb" or "rgb(r g b / a)". Chroma is reduced until the colour fits the sRGB screen. */
export function format({ L, C, h, a }) {
  let c = C;
  let rgb = oklchToRgb(L, c, h);
  for (let i = 0; i < 24 && !inGamut(rgb); i++) {
    c *= 0.92;
    rgb = oklchToRgb(L, c, h);
  }
  const [r, g, b] = rgb.map((v) => Math.round(clamp(v, 0, 1) * 255));
  if (a < 0.999) return `rgb(${r} ${g} ${b} / ${Math.round(a * 1000) / 1000})`;
  const hex = (n) => n.toString(16).padStart(2, '0');
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

/* ── parsing ─────────────────────────────────────────────────────────── */

const isHexChar = (ch) => (ch >= '0' && ch <= '9') || (ch >= 'a' && ch <= 'f') || (ch >= 'A' && ch <= 'F');

function splitArgs(inner) {
  // "0.5 0.1 200 / 40%" or "255, 0, 0, 0.5" -> ["0.5","0.1","200","40%"]
  return inner.replace(/[,/]/g, ' ').trim().split(' ').filter(Boolean);
}

const num = (s, pctScale = 1) => (s.endsWith('%') ? (parseFloat(s) / 100) * pctScale : parseFloat(s));
const alphaOf = (s) => (s === undefined || s === 'none' ? 1 : clamp(s.endsWith('%') ? parseFloat(s) / 100 : parseFloat(s), 0, 1));

export function parseHex(lit) {
  let h = lit.slice(1);
  if (h.length === 3 || h.length === 4) h = h.split('').map((c) => c + c).join('');
  if (h.length !== 6 && h.length !== 8) return null;
  const r = parseInt(h.slice(0, 2), 16) / 255, g = parseInt(h.slice(2, 4), 16) / 255, b = parseInt(h.slice(4, 6), 16) / 255;
  const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
  return rgbToOklch(r, g, b, a);
}

function hslToRgb(h, s, l) {
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0), f(8), f(4)];
}

/** Parse rgb()/rgba()/hsl()/hsla()/oklch()/oklab() text (name + args). Returns null when it cannot be understood. */
export function parseFunction(name, inner) {
  const p = splitArgs(inner);
  if (p.length < 3) return null;
  try {
    if (name === 'rgb' || name === 'rgba') {
      const [r, g, b] = p.slice(0, 3).map((v) => (v.endsWith('%') ? parseFloat(v) / 100 : parseFloat(v) / 255));
      if ([r, g, b].some(Number.isNaN)) return null;
      return rgbToOklch(r, g, b, alphaOf(p[3]));
    }
    if (name === 'hsl' || name === 'hsla') {
      const h = parseFloat(p[0]), s = num(p[1]), l = num(p[2]);
      if ([h, s, l].some(Number.isNaN)) return null;
      const [r, g, b] = hslToRgb(((h % 360) + 360) % 360, s > 1 ? s / 100 : s, l > 1 ? l / 100 : l);
      return rgbToOklch(r, g, b, alphaOf(p[3]));
    }
    if (name === 'oklch') {
      const L = p[0] === 'none' ? 0 : num(p[0]);
      const C = p[1] === 'none' ? 0 : num(p[1], 0.4);
      const h = p[2] === 'none' ? 0 : parseFloat(p[2]);
      if ([L, C, h].some(Number.isNaN)) return null;
      return { L, C, h, a: alphaOf(p[3]) };
    }
    if (name === 'oklab') {
      const L = num(p[0]), A = num(p[1], 0.4), B = num(p[2], 0.4);
      if ([L, A, B].some(Number.isNaN)) return null;
      const C = Math.hypot(A, B);
      let h = (Math.atan2(B, A) * 180) / Math.PI;
      if (h < 0) h += 360;
      return { L, C, h, a: alphaOf(p[3]) };
    }
  } catch {
    return null;
  }
  return null;
}

/* ── the light -> dark mapping ───────────────────────────────────────── */

/** Piecewise-linear lookup through [[x, y], ...] sorted by x ascending. */
function curve(points, x) {
  if (x <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) {
    const [x1, y1] = points[i];
    if (x <= x1) {
      const [x0, y0] = points[i - 1];
      return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
    }
  }
  return points[points.length - 1][1];
}

// Lightness of a LIGHT neutral surface (white, slate-50 ... slate-400) -> lightness of its dark counterpart.
// White (cards) is a step lighter than slate-50 (the page behind them), as in the light theme.
const SURFACE_FROM_LIGHT = [
  [0.7, 0.54], [0.711, 0.52], [0.8, 0.43], [0.869, 0.37], [0.929, 0.3], [0.968, 0.245], [0.984, 0.175], [1, 0.215],
];
// Lightness of a DARK neutral used as a surface (dark buttons, tooltips): stays dark, lifted so it stands off the page.
const SURFACE_FROM_DARK = [
  [0, 0.24], [0.208, 0.29], [0.279, 0.33], [0.372, 0.38], [0.446, 0.43], [0.554, 0.5], [0.7, 0.54],
];
// Neutral TEXT / icon lightness, inverted: slate-900 -> near white, slate-500 -> mid-light grey, slate-300 -> dim grey.
const TEXT_INVERT = [
  [0, 0.985], [0.208, 0.95], [0.279, 0.92], [0.372, 0.88], [0.446, 0.83], [0.554, 0.745], [0.711, 0.65], [0.8, 0.6], [0.869, 0.45], [0.93, 0.4],
];

// A "neutral" is white/black/grey/slate/zinc: no real hue. Pale tints (green-50, red-50) have a little chroma
// but a real hue, so they are NOT neutral.
function isNeutral({ C, h }) {
  if (C < 0.012) return true;
  return h >= 195 && h <= 300 && C < 0.055;
}

const NEUTRAL_HUE = 265; // slate blue: pure greys get a faint cool tint so the dark theme is not flat grey
function neutralOut(src, L, a) {
  const C = src.C < 0.012 ? 0.016 : Math.min(src.C * 0.7, 0.032);
  return { L, C, h: src.C < 0.012 ? NEUTRAL_HUE : src.h, a };
}

function tintOut(src, L, a) {
  // a pale tint (green-50 ...) becomes a deep surface that still reads as that colour
  return { L, C: clamp(src.C * 2.3, 0.03, 0.075), h: src.h, a };
}

/**
 * @param {{L:number,C:number,h:number,a:number}} c  the light-theme colour
 * @param {'bg'|'text'|'border'} role                 what it paints
 * @param {number} [pct=100]                          mix percentage when written as color-mix(in oklab, X 40%, transparent)
 * @returns {string|null}                             the dark colour, or null to leave it as is
 */
export function mapToDark(c, role, pct = 100) {
  const alpha = c.a * (pct / 100);
  const neutral = isNeutral(c);

  // Gradient stops: a pale stop (a white-to-slate-50 card sheen) becomes a dark surface, but dark and coloured stops stay
  // as they are. A gradient can also fill TEXT (bg-clip-text) or a dark hero, where lightening the stops would break it.
  if (role === 'gradient') {
    if (c.L < (neutral ? 0.7 : 0.78)) return null;
    role = 'bg';
  }

  if (role === 'bg') {
    // see-through overlays keep their job: a dark veil stays a dark veil, a white sheen stays a white sheen
    if (neutral && alpha <= 0.7 && c.L < 0.4) return null;
    if (neutral && alpha <= 0.35 && c.L > 0.97) return null;
    if (neutral) {
      const L = c.L >= 0.7 ? curve(SURFACE_FROM_LIGHT, c.L) : curve(SURFACE_FROM_DARK, c.L);
      return format(neutralOut(c, L, c.a));
    }
    if (c.L >= 0.9) return format(tintOut(c, curve(SURFACE_FROM_LIGHT, c.L) + 0.015, c.a));
    if (c.L >= 0.78) return format({ L: curve([[0.78, 0.42], [0.9, 0.31]], c.L), C: c.C, h: c.h, a: c.a });
    return null; // brand and status colours (green button, red badge) keep their colour
  }

  if (role === 'text') {
    if (neutral) {
      if (c.L >= 0.93) return null; // white / near-white text sits on a dark or coloured surface: keep it
      return format(neutralOut(c, curve(TEXT_INVERT, c.L), c.a));
    }
    if (c.L >= 0.93) return null;
    return format({ L: Math.max(c.L, 0.72), C: c.C * 0.92, h: c.h, a: c.a }); // coloured text: lift for contrast
  }

  // border
  if (neutral) {
    if (alpha <= 0.3 && c.L > 0.97) return null;
    const L = c.L >= 0.8 ? curve(SURFACE_FROM_LIGHT, c.L) : curve(TEXT_INVERT, c.L);
    return format(neutralOut(c, L, c.a));
  }
  if (c.L >= 0.85) return format(tintOut(c, curve([[0.85, 0.36], [1, 0.26]], c.L), c.a));
  return null;
}

export { isHexChar };
