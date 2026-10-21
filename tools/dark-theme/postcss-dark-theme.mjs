// PostCSS plugin: for every rule in the compiled CSS that paints something with a colour, add a twin rule that only applies
// under  :root[data-theme="dark"]  with the dark version of that colour (see colors.mjs).
//
// Because it works on the finished CSS, every variant Tailwind produced (hover:, focus:, md:, group-hover:, placeholder:,
// divide-, gradients, opacity modifiers like /10, third-party stylesheets ...) gets its dark twin automatically, and the
// source files do not need to change. Twins sit right after the rule they copy and are more specific, so the cascade
// between utilities is unchanged.
//
// Opt out: put  data-keep-light  on any element and everything inside it keeps the light colours.
import { isHexChar, mapToDark, parseFunction, parseHex } from './colors.mjs';

const ROOT = ':root[data-theme="dark"]';
const KEEP_LIGHT = ':not([data-keep-light] *)';
// pseudo-elements CSS still allows with a single colon (":before" = "::before"); the name must end there
const LEGACY_PSEUDO_ELEMENT = /^(before|after|first-line|first-letter)(?![\w-])/i;

const COLOR_FUNCTIONS = new Set(['rgb', 'rgba', 'hsl', 'hsla', 'oklch', 'oklab']);
const SKIP_AT_RULES = new Set(['keyframes', '-webkit-keyframes', 'font-face', 'property', 'counter-style']);

const isIdentChar = (ch) => (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || (ch >= '0' && ch <= '9') || ch === '-' || ch === '_';
const isAlnum = (ch) => ch !== undefined && ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || (ch >= '0' && ch <= '9'));

/** Which kind of paint a property is: a surface, text/icon, a border, or something we leave alone. */
function roleOf(prop) {
  const p = prop.toLowerCase();
  if (p.includes('shadow') || p === 'filter' || p === 'backdrop-filter') return null;
  if (p === 'background' || p === 'background-color' || p === 'background-image') return 'bg';
  if (p === '--tw-gradient-from' || p === '--tw-gradient-via' || p === '--tw-gradient-to') return 'gradient';
  if (p === 'color' || p === 'fill' || p === 'stroke' || p === 'caret-color' || p === '-webkit-text-fill-color') return 'text';
  if (p === 'text-decoration-color' || p === 'text-emphasis-color') return 'text';
  if (p === 'border' || p.startsWith('border-') && (p.endsWith('color') || p.endsWith('-top') || p.endsWith('-bottom') || p.endsWith('-left') || p.endsWith('-right'))) return 'border';
  if (p === 'outline' || p === 'outline-color' || p === 'column-rule-color' || p === 'scrollbar-color') return 'border';
  if (p === '--tw-ring-color' || p === '--tw-outline-color') return 'border';
  return null;
}

function matchParen(s, open) {
  let depth = 0;
  for (let i = open; i < s.length; i++) {
    if (s[i] === '(') depth++;
    else if (s[i] === ')' && --depth === 0) return i;
  }
  return -1;
}

/**
 * "40%" right after a colour INSIDE color-mix(in oklab, #fff 40%, transparent) -> 40: the share of that colour in the mix.
 * Anywhere else a "40%" after a colour is something different (a gradient stop position: rgba(...) 40%), so it must be ignored.
 */
function peekPercent(s, from, inMix) {
  if (!inMix) return 100;
  let i = from;
  while (s[i] === ' ') i++;
  let j = i;
  while ((s[j] >= '0' && s[j] <= '9') || s[j] === '.') j++;
  if (j > i && s[j] === '%') return parseFloat(s.slice(i, j));
  return 100;
}

/** Replace every colour in a declaration value. `change(color, pct)` returns the new text or null to keep the old. */
function replaceColors(value, change, vars, inMix = false) {
  let out = '';
  let i = 0;
  const n = value.length;
  while (i < n) {
    const ch = value[i];

    if (ch === '#') {
      let j = i + 1;
      while (j < n && isHexChar(value[j])) j++;
      const len = j - i - 1;
      if ((len === 3 || len === 4 || len === 6 || len === 8) && !isAlnum(value[j])) {
        const lit = value.slice(i, j);
        const color = parseHex(lit);
        const next = color ? change(color, peekPercent(value, j, inMix)) : null;
        out += next ?? lit;
        i = j;
        continue;
      }
    }

    const startsWord = (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z');
    if (startsWord && (i === 0 || !isIdentChar(value[i - 1]))) {
      let j = i;
      while (j < n && isIdentChar(value[j])) j++;
      const word = value.slice(i, j).toLowerCase();

      if (value[j] === '(') {
        const end = matchParen(value, j);
        if (end < 0) return value;
        const inner = value.slice(j + 1, end);
        if (word === 'url') {
          out += value.slice(i, end + 1); // never touch the inside of url(...) (embedded SVGs etc.)
        } else if (word === 'var') {
          const name = inner.split(',')[0].trim();
          const color = name.startsWith('--color-') ? vars.get(name) : undefined;
          const next = color ? change(color, peekPercent(value, end + 1, inMix)) : null;
          out += next ?? value.slice(i, end + 1);
        } else if (COLOR_FUNCTIONS.has(word)) {
          const color = parseFunction(word, inner);
          const next = color ? change(color, peekPercent(value, end + 1, inMix)) : null;
          out += next ?? value.slice(i, end + 1);
        } else {
          // linear-gradient(...), color-mix(...), calc(...): look inside
          out += value.slice(i, j + 1) + replaceColors(inner, change, vars, word === 'color-mix') + ')';
        }
        i = end + 1;
        continue;
      }

      if (word === 'white' || word === 'black') {
        const color = parseHex(word === 'white' ? '#ffffff' : '#000000');
        out += change(color, peekPercent(value, j, inMix)) ?? value.slice(i, j);
        i = j;
        continue;
      }
      out += value.slice(i, j);
      i = j;
      continue;
    }

    out += ch;
    i++;
  }
  return out;
}

/** Put the dark scope in front of every selector of a rule (and the keep-light guard on the element it targets). */
function darkSelector(selector) {
  const s = selector.trim();
  // the guard has to sit on the targeted element, i.e. before a trailing pseudo-element — written either
  // ::before or the legacy single-colon :before / :after / :first-line / :first-letter (Tailwind's preflight
  // uses ":after, :before"); nothing may follow a pseudo-element, or the CSS minifier rejects the selector
  let cut = s.length;
  let depth = 0;
  for (let i = 0; i < s.length - 1; i++) {
    if (s[i] === '(' || s[i] === '[') depth++;
    else if (s[i] === ')' || s[i] === ']') depth--;
    else if (depth === 0 && s[i] === ':' && s[i + 1] === ':') { cut = i; break; }
    else if (depth === 0 && s[i] === ':' && LEGACY_PSEUDO_ELEMENT.test(s.slice(i + 1))) { cut = i; break; }
  }
  const guarded = s.slice(0, cut) + KEEP_LIGHT + s.slice(cut);
  if (s === ':root' || s === 'html' || s.startsWith(':root,') || s.startsWith(':host')) return ROOT; // theme-variable blocks
  if (s.startsWith(':root ')) return `${ROOT} ${guarded.slice(6)}`;
  if (s.startsWith('html ')) return `${ROOT} ${guarded.slice(5)}`;
  return `${ROOT} ${guarded}`;
}

function insideSkipped(node) {
  for (let p = node.parent; p; p = p.parent) {
    if (p.type === 'atrule' && SKIP_AT_RULES.has(p.name.toLowerCase())) return true;
  }
  return false;
}

export default function darkTheme() {
  return {
    postcssPlugin: 'quickpost-dark-theme',
    Once(root) {
      // 1) the theme's named colours (--color-slate-500 ...) so var(--color-x) can be resolved per use
      const vars = new Map();
      root.walkDecls((decl) => {
        if (!decl.prop.startsWith('--color-')) return;
        const v = decl.value.trim();
        let color = null;
        if (v.startsWith('#')) color = parseHex(v);
        else {
          const open = v.indexOf('(');
          if (open > 0 && v.endsWith(')')) color = parseFunction(v.slice(0, open).toLowerCase(), v.slice(open + 1, -1));
        }
        if (color) vars.set(decl.prop, color);
      });

      // 2) a dark twin for every rule that paints with a colour
      const rules = [];
      root.walkRules((rule) => {
        if (insideSkipped(rule)) return;
        if (rule.selector.includes('[data-theme')) return; // hand-written dark rules
        rules.push(rule);
      });

      for (const rule of rules) {
        const twins = [];
        rule.each((decl) => {
          if (decl.type !== 'decl') return;
          const role = roleOf(decl.prop);
          if (!role) return;
          // EVERY colour-related declaration gets a twin, also the ones whose colour stays the same (a brand-green hover or focus
          // border). Otherwise the twin of a plain rule (more specific) would beat the unchanged hover:/focus:/md: rule that wins in light mode.
          const value = replaceColors(decl.value, (color, pct) => mapToDark(color, role, pct), vars);
          twins.push({ prop: decl.prop, value, important: decl.important });
        });
        if (!twins.length) continue;

        const selectors = rule.selectors.map(darkSelector);
        if (selectors.every((s) => s === ROOT)) continue; // variable blocks: nothing to override
        const twin = rule.clone({ selectors: [...new Set(selectors)] });
        twin.removeAll();
        for (const d of twins) twin.append({ prop: d.prop, value: d.value, important: d.important });
        rule.after(twin);
      }
    },
  };
}
darkTheme.postcss = true;
