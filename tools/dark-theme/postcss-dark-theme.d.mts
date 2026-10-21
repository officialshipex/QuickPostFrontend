// Types for postcss-dark-theme.mjs (plain JS), so vite.config.ts type-checks under `tsc -b`.
// Kept self-contained (no import from 'postcss', which is not a direct dependency).

/** PostCSS plugin that generates the panel's dark theme at build time. */
export default function darkTheme(): { postcssPlugin: string; [hook: string]: unknown };
