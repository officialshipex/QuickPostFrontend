/* QuickPost Cargo — which seller-side sections are available in Cargo mode.
   Cargo reuses the B2C pages/UI as-is; only the paths listed here are reachable
   (sidebar items, flyouts and direct URLs). Anything else redirects to Home.
   Add/remove '/user/...' paths here as Cargo scope is finalised. Backend is wired later. */

export const CARGO_ALLOWED_PATHS: string[] = [
  '/user/home',
  '/user/wallet',
  '/user/profile',
  '/user/support',
  '/user/settings',
];

export const isCargoAllowedPath = (path: string) =>
  CARGO_ALLOWED_PATHS.some(p => path === p || path.startsWith(p + '/'));
