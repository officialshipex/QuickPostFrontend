import { getToken } from './session';

/* B2C ⇄ Cargo mode, stored per browser tab (sessionStorage) and bound to the current login token:
   - Cargo opens in its own tab (`/user/home?mode=cargo`), so the B2C tab stays B2C.
   - Survives refreshes in that tab; a fresh login always starts in B2C.
   Read by ShippingModeProvider (UI). */

export type ShippingMode = 'b2c' | 'cargo';

const KEY = 'qp_shipping_mode';
const URL_PARAM = 'mode';
const INTRO_PARAM = 'intro';
let pendingIntro = false;
const tokenTag = () => (getToken() || '').slice(-16);

export function saveShippingMode(mode: ShippingMode) {
  try { sessionStorage.setItem(KEY, JSON.stringify({ t: tokenTag(), mode })); } catch { /* storage blocked */ }
}

/** Picks up `?mode=cargo` from a freshly opened Cargo tab, stores it, and strips it from the URL. */
function adoptModeFromUrl() {
  try {
    const url = new URL(window.location.href);
    const m = url.searchParams.get(URL_PARAM);
    if (m !== 'cargo' && m !== 'b2c') return;
    saveShippingMode(m);
    if (url.searchParams.get(INTRO_PARAM) === '1') pendingIntro = true;
    url.searchParams.delete(URL_PARAM);
    url.searchParams.delete(INTRO_PARAM);
    window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
  } catch { /* ignore */ }
}

export function getShippingMode(): ShippingMode {
  adoptModeFromUrl();
  try {
    const v = JSON.parse(sessionStorage.getItem(KEY) || 'null');
    return v?.t && v.t === tokenTag() && v.mode === 'cargo' ? 'cargo' : 'b2c';
  } catch { return 'b2c'; }
}

export const cargoTabUrl = () => `/user/home?${URL_PARAM}=cargo&${INTRO_PARAM}=1`;

/** True for a Cargo tab opened from the switch until its load animation finishes (safe to read twice). */
export function hasPendingIntro(): boolean {
  getShippingMode(); // make sure the URL has been read
  return pendingIntro;
}
export function clearIntro() { pendingIntro = false; }
