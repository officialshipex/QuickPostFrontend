/* QuickPost Cargo — which seller-side sections are available in Cargo mode.
   Cargo reuses the B2C pages/UI as-is; only the paths listed here are reachable
   (sidebar items, flyouts and direct URLs). Anything else redirects to Home.
   Add/remove '/user/...' paths here as Cargo scope is finalised.
   Dashboard / Orders / NDR / Weight Discrepancy render separate Cargo pages (pages/cargo/*)
   that read from cargoApiClient, never the B2C backend. */

export const CARGO_ALLOWED_PATHS: string[] = [
  '/user/home',
  '/user/dashboard',
  '/user/orders',
  '/user/ndr',
  '/user/weight-discrepancy',
  '/user/rate-calculator',
  // Pages reached from Orders (details, create/edit/clone, pickup manifest)
  '/user/order-tracking',
  '/user/add-order',
  '/user/pickup-manifest',
  '/user/wallet',
  '/user/profile',
  '/user/support',
  '/user/settings',
];

/* Cargo admin (/admin/*, /internal-crm/*) — Dashboard, CRM, Orders, NDR, Weight Discrepancy,
   Courier (Couriers, Rate Card), Tools → Announcements, Setup & Manage → Pickup Address.
   Dashboard / Orders / NDR / Weight Discrepancy reuse the Cargo pages above (they handle the admin view);
   the rest are separate Cargo admin pages in pages/cargo/*. */
export const CARGO_ADMIN_ALLOWED_PATHS: string[] = [
  '/admin/dashboard',
  '/internal-crm',
  '/admin/orders',
  '/admin/ndr',
  '/admin/weight-discrepancy',
  '/admin/couriers',
  '/admin/rate-card',
  '/admin/announcement',
  '/admin/settings/pickup-address',
  // Pages reached from Orders, and the admin's own profile
  '/admin/order-tracking',
  '/admin/add-order',
  '/admin/pickup-manifest',
  '/admin/profile',
];

export const isCargoAllowedPath = (path: string) =>
  [...CARGO_ALLOWED_PATHS, ...CARGO_ADMIN_ALLOWED_PATHS].some(p => path === p || path.startsWith(p + '/'));

/** True for routes that belong to the admin panel (Cargo admin redirects to its dashboard). */
export const isAdminPanelPath = (path: string) => path.startsWith('/admin/') || path.startsWith('/internal-crm');
