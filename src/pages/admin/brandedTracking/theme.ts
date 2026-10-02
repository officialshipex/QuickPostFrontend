import type { CSSProperties } from 'react';
import { RADIUS_PX } from './defaultConfig';
import type { Alignment, TrackingPageConfig } from './types';

/** Design tokens derived from the seller's branding — consumed by every renderer component. */
export interface ThemeTokens {
  primary: string;
  secondary: string;
  bg: string;
  text: string;
  button: string;
  surface: string;
  surfaceMuted: string;
  /** Hairline for dividers inside cards — cards themselves have no outline. */
  border: string;
  shadow: string;
  shadowRaised: string;
  muted: string;
  radius: number;
  radiusSm: number;
  font: string;
  isDark: boolean;
  buttonStyle: TrackingPageConfig['branding']['buttonStyle'];
}

export function buildTheme(config: TrackingPageConfig): ThemeTokens {
  const b = config.branding;
  const isDark = b.theme === 'dark';
  const radius = RADIUS_PX[b.borderRadius];
  return {
    primary: b.primaryColor,
    secondary: b.secondaryColor,
    bg: b.backgroundColor,
    text: b.textColor,
    button: b.buttonColor,
    surface: isDark ? `color-mix(in srgb, #FFFFFF 5%, ${b.backgroundColor})` : '#FFFFFF',
    surfaceMuted: `color-mix(in srgb, ${b.textColor} 4%, ${isDark ? b.backgroundColor : '#FFFFFF'})`,
    border: `color-mix(in srgb, ${b.textColor} ${isDark ? 10 : 7}%, transparent)`,
    shadow: isDark
      ? '0 1px 2px rgba(0,0,0,0.35)'
      : '0 1px 2px rgba(16,24,40,0.04), 0 2px 8px rgba(16,24,40,0.05)',
    shadowRaised: isDark
      ? '0 8px 24px rgba(0,0,0,0.45)'
      : '0 2px 4px rgba(16,24,40,0.04), 0 12px 32px rgba(16,24,40,0.10)',
    muted: `color-mix(in srgb, ${b.textColor} 62%, ${b.backgroundColor})`,
    radius,
    radiusSm: Math.round(radius * 0.66),
    font: `'${b.fontFamily}', system-ui, -apple-system, 'Segoe UI', sans-serif`,
    isDark,
    buttonStyle: b.buttonStyle,
  };
}

/** Readable foreground for a solid hex background (WCAG relative luminance). */
export function contrastText(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return '#FFFFFF';
  const n = parseInt(m[1], 16);
  const channel = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const lum = 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
  return lum > 0.45 ? '#0F172A' : '#FFFFFF';
}

export function buttonStyle(t: ThemeTokens, color = t.button, forceOutline = false): CSSProperties {
  const outline = forceOutline || t.buttonStyle === 'outline';
  const radius = t.buttonStyle === 'pill' ? 999 : t.radiusSm;
  return outline
    ? { background: 'transparent', color, border: `1.5px solid ${color}`, borderRadius: radius }
    : { background: color, color: contrastText(color), border: `1.5px solid ${color}`, borderRadius: radius };
}

/** Elevated surface: separated from the page by tone + soft shadow, never by an outline. */
export const cardStyle = (t: ThemeTokens): CSSProperties => ({
  background: t.surface,
  borderRadius: t.radius,
  boxShadow: t.shadow,
});

export const justifyFor = (a: Alignment) => (a === 'left' ? 'flex-start' : a === 'right' ? 'flex-end' : 'center');
export const textAlignFor = (a: Alignment) => a;

/** Normalise user-entered URLs; returns undefined when blank so links render inert in preview. */
export function safeUrl(url?: string): string | undefined {
  const v = (url || '').trim();
  if (!v) return undefined;
  if (/^(https?:|mailto:|tel:)/i.test(v)) return v;
  return `https://${v}`;
}

export const telUrl = (phone?: string) => (phone?.trim() ? `tel:${phone.replace(/[^\d+]/g, '')}` : undefined);
export const mailUrl = (email?: string) => (email?.trim() ? `mailto:${email.trim()}` : undefined);
export function whatsappUrl(number?: string, message?: string): string | undefined {
  const digits = (number || '').replace(/\D/g, '');
  if (!digits) return undefined;
  const full = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${full}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
}

const loadedFonts = new Set<string>(['Roboto']);

/** Lazily loads a Google Font the first time a page uses it. */
export function ensureFontLoaded(family: string) {
  if (typeof document === 'undefined' || loadedFonts.has(family)) return;
  loadedFonts.add(family);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, '+')}:wght@400;500;600;700;800&display=swap`;
  document.head.appendChild(link);
}
