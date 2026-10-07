// Single source of truth for employee permissions in QuickPost.
//
// An employee's `accessRights` is { [moduleKey]: { view, edit, delete } }.
//   - Every sidebar item has its own module key, so it can be granted on its own.
//   - `group` is the older, coarser key the same item used to live under (orders, finance, tools,
//     setupAndManage, courier, reports, support). An employee saved before the finer keys existed
//     keeps the access they had: a missing key falls back to its group.
//   - On save the group keys are written too (the OR of their children): the server's write guard
//     maps a route to the group module (see backend utils/employeeAccess.js).
//
// Two panels exist and an employee belongs to exactly one:
//   admin panel (created by an admin) / user panel (created by a merchant).

export type PanelType = 'admin' | 'user';
export type PermKey = 'view' | 'edit' | 'delete';
export type ModuleRights = Record<PermKey, boolean>;
export type AccessRights = Record<string, ModuleRights>;

export const PERM_TYPES: { key: PermKey; label: string }[] = [
  { key: 'view', label: 'View' },
  { key: 'edit', label: 'Edit' },
  { key: 'delete', label: 'Delete' },
];

export interface PermModule {
  key: string;
  label: string;
  desc: string;
  /** heading the module is listed under in the permission form */
  section: string;
  /** legacy coarse key this module inherits from when it has no rights of its own */
  group?: string;
}

export const ADMIN_MODULES: PermModule[] = [
  { key: 'orders', label: 'Orders', desc: 'View and manage all shipment orders', section: 'Operations' },
  { key: 'ndr', label: 'NDR', desc: 'Non-delivery reports and follow-ups', section: 'Operations' },
  { key: 'internalCrm', label: 'Internal CRM', desc: 'Shipments, sellers, leads and escalations (beta)', section: 'Operations' },
  { key: 'wallet', label: 'Wallet', desc: 'Seller wallets and transactions', section: 'Finance', group: 'finance' },
  { key: 'cod', label: 'COD', desc: 'COD remittance', section: 'Finance', group: 'finance' },
  { key: 'reportsHub', label: 'Reports', desc: 'View and download reports', section: 'Reports', group: 'reports' },
  { key: 'performance', label: 'Performance', desc: 'Courier and business performance', section: 'Reports', group: 'reports' },
  { key: 'weightDiscrepancy', label: 'Weight Discrepancy', desc: 'Review and resolve weight disputes', section: 'Tools', group: 'tools' },
  { key: 'notification', label: 'Notification', desc: 'Customer notification settings', section: 'Tools', group: 'tools' },
  { key: 'announcement', label: 'Announcements', desc: 'Publish announcements', section: 'Tools', group: 'tools' },
  { key: 'users', label: 'Users', desc: 'Seller accounts and KYC', section: 'Setup & Manage', group: 'setupAndManage' },
  { key: 'statusMap', label: 'Status Map', desc: 'Courier status mapping', section: 'Setup & Manage', group: 'setupAndManage' },
  { key: 'eddMapping', label: 'EDD Mapping', desc: 'Estimated delivery date rules', section: 'Setup & Manage', group: 'setupAndManage' },
  { key: 'epdMapping', label: 'EPD Mapping', desc: 'Estimated pickup date rules', section: 'Setup & Manage', group: 'setupAndManage' },
  { key: 'agreement', label: 'Agreement', desc: 'Seller agreements', section: 'Setup & Manage', group: 'setupAndManage' },
  { key: 'pickupAddress', label: 'Pickup Address', desc: 'Pickup locations', section: 'Setup & Manage', group: 'setupAndManage' },
  { key: 'couriers', label: 'Couriers', desc: 'Courier partners', section: 'Courier', group: 'courier' },
  { key: 'rateCard', label: 'Rate Card', desc: 'Rate cards', section: 'Courier', group: 'courier' },
  { key: 'support', label: 'Support Tickets', desc: 'Manage support tickets', section: 'Support' },
  { key: 'referral', label: 'Referral', desc: 'Referral programme', section: 'Support' },
];

export const USER_MODULES: PermModule[] = [
  { key: 'orders', label: 'Orders', desc: 'View and manage orders', section: 'Operations' },
  { key: 'ndr', label: 'NDR', desc: 'Non-delivery reports', section: 'Operations' },
  { key: 'wallet', label: 'Wallet', desc: 'Wallet and recharges', section: 'Finance', group: 'finance' },
  { key: 'cod', label: 'COD', desc: 'COD remittance', section: 'Finance', group: 'finance' },
  { key: 'sellerRemittance', label: 'Seller Remittance', desc: 'Early COD remittance', section: 'Finance' },
  { key: 'reportsHub', label: 'Reports', desc: 'View reports', section: 'Reports', group: 'reports' },
  { key: 'rateCalculator', label: 'Rate Calculator', desc: 'Shipping rate estimates', section: 'Tools', group: 'tools' },
  { key: 'weightDiscrepancy', label: 'Weight Discrepancy', desc: 'Weight disputes', section: 'Tools', group: 'tools' },
  { key: 'notification', label: 'Notification', desc: 'Customer notification settings', section: 'Tools', group: 'tools' },
  { key: 'vasSecure', label: 'Secure', desc: 'Shipment protection', section: 'Value Added Services' },
  { key: 'brandedTracking', label: 'Branded Tracking Page', desc: 'Custom tracking page', section: 'Value Added Services' },
  { key: 'pickupAddress', label: 'Pickup Address', desc: 'Pickup locations', section: 'Setup & Manage', group: 'setupAndManage' },
  { key: 'channels', label: 'Channels', desc: 'Store integrations', section: 'Setup & Manage', group: 'setupAndManage' },
  { key: 'courierSetup', label: 'Courier', desc: 'Courier preferences', section: 'Setup & Manage', group: 'setupAndManage' },
  { key: 'settings', label: 'Settings', desc: 'Account settings', section: 'Setup & Manage', group: 'setupAndManage' },
  { key: 'support', label: 'Support', desc: 'Support tickets', section: 'Support' },
];

export const modulesFor = (panel: PanelType): PermModule[] => (panel === 'admin' ? ADMIN_MODULES : USER_MODULES);

const GROUP_OF: Record<string, string | undefined> = {};
[...ADMIN_MODULES, ...USER_MODULES].forEach(m => { GROUP_OF[m.key] = m.group; });

const NONE: ModuleRights = { view: false, edit: false, delete: false };

const pick = (raw: any): ModuleRights => ({
  view: raw?.view === true,
  edit: raw?.edit === true,
  delete: raw?.delete === true,
});

// Rights for one module, falling back to its legacy group when it was never set explicitly.
export function getModuleRights(accessRights: Record<string, any> | undefined | null, key: string): ModuleRights {
  if (!accessRights) return NONE;
  if (accessRights[key] && typeof accessRights[key] === 'object') return pick(accessRights[key]);
  const group = GROUP_OF[key];
  if (group && accessRights[group] && typeof accessRights[group] === 'object') return pick(accessRights[group]);
  return NONE;
}

export function hasPermission(accessRights: Record<string, any> | undefined | null, key: string, perm: PermKey = 'view'): boolean {
  return getModuleRights(accessRights, key)[perm];
}

export function emptyAccessRights(panel: PanelType): AccessRights {
  const rights: AccessRights = {};
  modulesFor(panel).forEach(m => { rights[m.key] = { ...NONE }; });
  return rights;
}

// Stored rights -> form state (resolving legacy fallbacks so an old employee shows what they really have).
export function toFormRights(accessRights: Record<string, any> | undefined | null, panel: PanelType): AccessRights {
  const rights: AccessRights = {};
  modulesFor(panel).forEach(m => { rights[m.key] = { ...getModuleRights(accessRights, m.key) }; });
  return rights;
}

// Form state -> what is stored: every module, plus the coarse group keys the server's write guard reads.
export function toStoredRights(form: AccessRights, panel: PanelType): AccessRights {
  const stored: AccessRights = {};
  const groups: Record<string, ModuleRights> = {};
  modulesFor(panel).forEach(m => {
    const r = pick(form[m.key]);
    stored[m.key] = r;
    if (m.group) {
      const g = groups[m.group] || { ...NONE };
      groups[m.group] = { view: g.view || r.view, edit: g.edit || r.edit, delete: g.delete || r.delete };
    }
  });
  return { ...stored, ...groups };
}

// ─── Route -> module (used by the route guard) ────────────────────────────────────────────────────
// Longest prefix wins, after stripping the /admin or /user prefix. `null` = owner only: never open
// to employees. A path not listed is not restricted by employee rights.
const ROUTE_MODULES: [string, string | null][] = [
  ['/orders', 'orders'],
  ['/add-order', 'orders'],
  ['/order-tracking', 'orders'],
  ['/tracking', 'orders'],
  ['/pickup-manifest', 'orders'],
  ['/shipments', 'orders'],
  ['/ndr', 'ndr'],
  ['/wallet', 'wallet'],
  ['/cod', 'cod'],
  ['/seller-remittance', 'sellerRemittance'],
  ['/reports', 'reportsHub'],
  ['/performance', 'performance'],
  ['/weight-discrepancy', 'weightDiscrepancy'],
  ['/notification', 'notification'],
  ['/announcement', 'announcement'],
  ['/rate-calculator', 'rateCalculator'],
  ['/vas/auto-secure', 'vasSecure'],
  ['/vas/branded-tracking', 'brandedTracking'],
  ['/vas', null],
  ['/users', 'users'],
  ['/kyc-review', 'users'],
  ['/status-map', 'statusMap'],
  ['/edd-mapping', 'eddMapping'],
  ['/epd-mapping', 'epdMapping'],
  ['/agreement', 'agreement'],
  ['/settings/pickup-address', 'pickupAddress'],
  ['/settings', 'settings'],
  ['/channels', 'channels'],
  ['/courier-setup', 'courierSetup'],
  ['/couriers', 'couriers'],
  ['/vendors', 'couriers'],
  ['/rate-card', 'rateCard'],
  ['/support', 'support'],
  ['/referral', 'referral'],
  ['/internal-crm', 'internalCrm'],
  // Owner-managed: employees never open these (the backend is the real boundary for /companies)
  ['/kyc', null],
  ['/employees', null],
  ['/roles', null],
  ['/allocate-sellers', null],
  ['/accounts', null],
  ['/companies', null],
];

export type RouteRule = { restricted: false } | { restricted: true; module: string | null };

export function resolveRouteModule(pathname: string): RouteRule {
  const stripped = pathname.replace(/^\/(admin|user)(?=\/|$)/, '') || '/';
  let best: [string, string | null] | null = null;
  for (const entry of ROUTE_MODULES) {
    const prefix = entry[0];
    if ((stripped === prefix || stripped.startsWith(prefix + '/')) && (!best || prefix.length > best[0].length)) {
      best = entry;
    }
  }
  return best ? { restricted: true, module: best[1] } : { restricted: false };
}

export function canAccessRoute(accessRights: Record<string, any> | undefined | null, pathname: string): boolean {
  const rule = resolveRouteModule(pathname);
  if (!rule.restricted) return true;
  if (rule.module === null) return false;
  return hasPermission(accessRights, rule.module, 'view');
}

export const NO_ACCESS_MESSAGE = "You don't have access to this page. Please contact your administrator.";

// Opens the shell's "Access Restricted" popup (listened to in AdminShell).
export function showAccessDenied(message: string = NO_ACCESS_MESSAGE): void {
  window.dispatchEvent(new CustomEvent('access-denied', { detail: message }));
}
