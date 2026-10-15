/* B2C ⇄ Cargo mode is part of the URL: Cargo runs the whole app under the `/cargo` prefix
   (e.g. /cargo/user/orders, /cargo/admin/dashboard), B2C keeps its normal paths.
   - The router uses `/cargo` as its basename in a Cargo tab, so every in-app link stays in Cargo.
   - Refresh, bookmarks and shared links keep the mode; switching modes is a full page navigation.
   - `?intro=1` on a freshly opened Cargo tab plays the branded switch animation once. */

export type ShippingMode = 'b2c' | 'cargo';

export const CARGO_BASE = '/cargo';
const INTRO_PARAM = 'intro';
let pendingIntro = false;

/** True when this tab is on a Cargo URL. */
export function isCargoUrl(pathname = window.location.pathname): boolean {
  return pathname === CARGO_BASE || pathname.startsWith(CARGO_BASE + '/');
}

/** The app path without the `/cargo` prefix — use instead of window.location.pathname for checks like `/user/…`. */
export function appPathname(pathname = window.location.pathname): string {
  return isCargoUrl(pathname) ? pathname.slice(CARGO_BASE.length) || '/' : pathname;
}

/** Picks up `?intro=1` from a freshly opened Cargo tab and strips it from the URL. */
function adoptIntroFromUrl() {
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get(INTRO_PARAM) !== '1') return;
    pendingIntro = true;
    url.searchParams.delete(INTRO_PARAM);
    window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
  } catch { /* ignore */ }
}

export function getShippingMode(): ShippingMode {
  adoptIntroFromUrl();
  return isCargoUrl() ? 'cargo' : 'b2c';
}

/** URL of a page in the given mode (path is an app path such as '/user/home'). */
export const modeUrl = (mode: ShippingMode, path: string) => (mode === 'cargo' ? `${CARGO_BASE}${path}` : path);

/** URL a new Cargo tab opens at — plays the switch animation on load. */
export const cargoTabUrl = (path = '/user/home') => `${modeUrl('cargo', path)}?${INTRO_PARAM}=1`;

/** True for a Cargo tab opened from the switch until its load animation finishes (safe to read twice). */
export function hasPendingIntro(): boolean {
  getShippingMode(); // make sure the URL has been read
  return pendingIntro;
}
export function clearIntro() { pendingIntro = false; }
