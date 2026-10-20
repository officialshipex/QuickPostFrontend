# Dark mode

The signed-in panel (`/admin/*`, `/user/*`, `/internal-crm/*`, and the same under `/cargo`) has a light / dark switch in the
header. Public pages (landing, `/track`, login, a seller's branded tracking page) always stay light.

## How it works

- `html[data-theme="dark"]` turns it on. `AdminShell` sets it (`useApplyPanelTheme` in `src/context/ThemeContext.tsx`),
  and a small script in `index.html` sets it before the first paint so a reload never flashes white. It is removed while
  printing.
- The choice is stored in `localStorage` (`qp_theme`). With no saved choice the computer's light / dark setting decides.
- **The dark colours are generated at build time.** `postcss-dark-theme.mjs` (wired in `vite.config.ts`) goes through the
  compiled CSS and, for every rule that paints a colour, adds a twin under `:root[data-theme="dark"]` with the dark
  version (`colors.mjs`). Because it works on the finished CSS, hover:, focus:, md:, group-hover:, gradients, `/10`
  opacity modifiers and third-party stylesheets all get dark twins without touching the components.
- A colour is mapped by what it is used for (surface / text / border), in OKLCH. Brand and status colours (green button,
  red badge) keep their colour; pale tints (green-50 ...) become deep tinted surfaces; white text stays white.

## What you need to know when writing UI

- Use the normal colour classes. Nothing extra is needed for dark mode.
- Colours that are **not** classes are not covered: inline `style={{ background: '#fff' }}`, SVG `fill="#..."`,
  chart props. Prefer classes. Recharts is handled by hand in `src/index.css` (the "Charts" block).
- To keep something light in dark mode (a print preview, a customer-facing mock-up) put `data-keep-light` on it.
- Dark-mode-only fixes that cannot come from a colour value (e.g. the logo) live at the top of `src/index.css`.

## Tuning the palette

The curves are at the top of `colors.mjs` (`SURFACE_FROM_LIGHT`, `SURFACE_FROM_DARK`, `TEXT_INVERT`). Change a number,
restart the dev server (the plugin is loaded when Vite starts), and look at the result.
