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
  /** only View applies (e.g. a dashboard) — Edit/Delete are not offered */
  viewOnly?: boolean;
  /** View and Edit only — nothing can be deleted there, so Delete is not offered */
  noDelete?: boolean;
}

export const ADMIN_MODULES: PermModule[] = [
  { key: 'dashboard', label: 'Dashboard', desc: 'View the main admin dashboard and business overview', section: 'Overview', viewOnly: true },
  { key: 'orders', label: 'Orders', desc: 'View and manage all shipment orders', section: 'Operations' },
  { key: 'ndr', label: 'NDR', desc: 'Non-delivery reports and follow-ups', section: 'Operations' },
  { key: 'internalCrm', label: 'Internal CRM', desc: 'Shipments, sellers, leads and escalations (beta)', section: 'Operations' },
  { key: 'sales', label: 'Sales Dashboard', desc: 'Calls, referred sellers, follow-ups and targets', section: 'Sales' },
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
  // Backend: feedback/panelFeedback.router.js + contactRequest/contactRequest.router.js (utils/employeeAccess.requireModule)
  { key: 'sellerFeedback', label: 'Seller Feedback', desc: 'Read the feedback sellers give in the panel', section: 'Support', viewOnly: true },
  { key: 'callbackRequests', label: 'Callback Requests', desc: 'See Contact Us callback requests (View), mark them contacted / closed and add a note (Edit)', section: 'Support', noDelete: true },
  // Admin powers for e.g. HR. They can only give access they have themselves, can't change their own account or
  // anyone with more access than them, and everything they do is in the Audit Logs (backend rolesController).
  { key: 'employees', label: 'Employees', desc: 'See employees (View), add / change them and their access, activate / deactivate (Edit), remove them (Delete)', section: 'Employee Access' },
  // Sales Management: only these two parts (commission plans, rate offers, payouts, settings stay with the admin)
  { key: 'salesTeam', label: 'Team', desc: 'Sales team, each person\'s work (their panel, read-only), assign leads, targets (Edit)', section: 'Sales Management' },
  { key: 'salesKyc', label: 'KYC Review', desc: 'Sales people\'s KYC details and documents, approve / reject and correct them (Edit)', section: 'Sales Management' },
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

// ─── Sales people with admin-panel modules ────────────────────────────────────────────────────────
// A sales person always has their Sales Dashboard ('sales') and can also be given admin-panel modules
// (Orders, NDR, …). Managing employees and Sales Management are never given to them (backend: salesPersonRights).
export const SALES_NOT_GRANTABLE = ['employees', 'salesTeam', 'salesKyc'];

/** Does a sales person have any access besides their own Sales panel? (then the other modules open too) */
export function hasAccessBeyondSales(accessRights: Record<string, any> | undefined | null): boolean { // eslint-disable-line @typescript-eslint/no-explicit-any
  if (!accessRights) return false;
  return Object.entries(accessRights).some(([key, section]) =>
    key !== 'sales' && !!section && typeof section === 'object' &&
    Object.values(section).some(v => v === true || (!!v && typeof v === 'object' && Object.values(v).some(f => f === true))));
}

// ─── An employee managing employees (e.g. HR) ─────────────────────────────────────────────────────
// They can only give access they hold themselves, and can't change someone holding access they don't have
// (the backend enforces the same: utils/employeeAccess.rightsNotHeld).
/** The modules in `wanted` with a right `holder` does not have (labels) */
export function rightsBeyond(holder: Record<string, any> | undefined | null, wanted: Record<string, any> | undefined | null, panel: PanelType = 'admin'): string[] { // eslint-disable-line @typescript-eslint/no-explicit-any
  return modulesFor(panel)
    .filter(m => PERM_TYPES.some(p => getModuleRights(wanted, m.key)[p.key] && !getModuleRights(holder, m.key)[p.key]))
    .map(m => m.label);
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
  ['/seller-feedback', 'sellerFeedback'],
  ['/callback-requests', 'callbackRequests'],
  ['/internal-crm', 'internalCrm'],
  ['/sales', 'sales'],
  // either Sales Management part opens the page (it then shows only the tabs given)
  ['/sales-management', 'salesTeam|salesKyc'],
  ['/tasks', 'sales'],
  // Owner-managed: employees never open these (the backend is the real boundary for /companies)
  ['/kyc', null],
  ['/employees', null], // a merchant's own staff (user panel): the merchant only
  ['/roles', 'employees'], // the admin panel's employees: the admin, or an employee with "Employees"
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

/** View on any of "a|b" (a page several modules open) */
export function hasAnyView(accessRights: Record<string, any> | undefined | null, modules: string): boolean { // eslint-disable-line @typescript-eslint/no-explicit-any
  return modules.split('|').some(m => hasPermission(accessRights, m, 'view') || hasPermission(accessRights, m, 'edit'));
}

export function canAccessRoute(accessRights: Record<string, any> | undefined | null, pathname: string): boolean {
  const rule = resolveRouteModule(pathname);
  if (!rule.restricted) return true;
  if (rule.module === null) return false;
  return hasAnyView(accessRights, rule.module);
}

/** Landing page for an admin-panel employee: the first module they may view (main dashboard only if permitted).
 *  Not the Sales Dashboard: that is a sales person's own panel (the server refuses everyone else, so an
 *  operations employee holding an old "Sales Dashboard" right landed on "Access Restricted" + "Could not load the
 *  Sales panel"). Sales people are sent to it by their own rule (AdminShell). */
const ADMIN_LANDING: [string, string][] = [
  ['dashboard', '/admin/dashboard'], ['orders', '/admin/orders'], ['ndr', '/admin/ndr'],
  ['internalCrm', '/internal-crm/shipments'], ['wallet', '/admin/wallet'], ['cod', '/admin/cod'], ['reportsHub', '/admin/reports'],
  ['weightDiscrepancy', '/admin/weight-discrepancy'], ['users', '/admin/users'], ['couriers', '/admin/couriers'],
  ['rateCard', '/admin/rate-card'], ['support', '/admin/support'],
  ['employees', '/admin/roles'], ['salesTeam|salesKyc', '/admin/sales-management'],
  ['callbackRequests', '/admin/callback-requests'], ['sellerFeedback', '/admin/seller-feedback'],
];
export function adminEmployeeLanding(accessRights: Record<string, any> | undefined | null): string { // eslint-disable-line @typescript-eslint/no-explicit-any
  const hit = ADMIN_LANDING.find(([key]) => hasAnyView(accessRights, key));
  return hit ? hit[1] : '/admin/profile';
}

/** The Sales panel pages (a sales person's own Dashboard / Tasks / Rate Comparison). Besides the sales team, the
 *  server lets in only someone with Sales Management "Team" (to look at a sales person's work). */
export const SALES_PANEL_PATHS = ['/admin/sales', '/admin/tasks', '/admin/rate-comparison', '/admin/sales-tickets'];
export function canOpenSalesPanel(accessRights: Record<string, any> | undefined | null): boolean { // eslint-disable-line @typescript-eslint/no-explicit-any
  return hasAnyView(accessRights, 'salesTeam');
}

export const NO_ACCESS_MESSAGE = "You don't have access to this page. Please contact your administrator.";

// Opens the shell's "Access Restricted" popup (listened to in AdminShell).
export function showAccessDenied(message: string = NO_ACCESS_MESSAGE): void {
  window.dispatchEvent(new CustomEvent('access-denied', { detail: message }));
}
