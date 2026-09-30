import { apiClient } from './apiClient';

export interface CompanyDomain {
  hostname: string;
  isPrimary: boolean;
  verified: boolean;
}

export interface CompanyBranding {
  logoUrl?: string;
  faviconUrl?: string;
  iconUrl?: string;
  emptyStateImageUrl?: string;
  colors?: { primary?: string; secondary?: string; accent?: string };
  companyDisplayName?: string;
  supportEmail?: string;
  supportPhone?: string;
}

export interface CompanyBillingDetails {
  companyName?: string;
  address?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  pan?: string;
  cin?: string;
  invoicePrefix?: string;
  bank?: {
    accountName?: string;
    accountNumber?: string;
    bankName?: string;
    ifsc?: string;
  };
}

export interface CompanySummary {
  tenantKey: string;
  displayName: string;
  domains: CompanyDomain[];
  status: 'onboarding' | 'active' | 'suspended' | 'disabled';
  isDefaultTenant: boolean;
  branding?: CompanyBranding;
  billingDetails?: CompanyBillingDetails;
  // The address this company's backend is reached at for callback/webhook URLs (couriers, Razorpay, AI calling);
  // unset = the platform's shared address. Absent from a backend that predates the setting.
  apiDomain?: string;
  // Which couriers this company's sellers may add. Undefined = every courier is allowed (the default, and every
  // company that predates this setting). Absent from a backend that predates the setting.
  enabledCouriers?: string[];
  requiredSetupComplete: boolean;
  // whether the scheduled jobs also run for this company; absent from a backend that predates the setting
  jobsEnabled?: boolean;
  createdAt: string;
}

export interface CompanyCreatePayload {
  displayName: string;
  tenantKey?: string;
  domain: string;
  mongoUri: string;
  logoUrl: string;
  faviconUrl?: string;
  primaryColor: string;
  secondaryColor?: string;
}

// One field of a settings group, as the backend defines it (courier groups: named exactly like
// the backend's env variables — see the backend's courierCredentialCatalog).
export interface ConfigFieldHint {
  key: string;
  label: string;
  secret?: boolean;
}

// One address a company registers with a courier or shop (or that the backend registers itself).
export interface WebhookAddress {
  label: string;
  url: string;
  automatic: boolean;
  authenticated: boolean;
  secretField: string | null;
  secretStatus: 'set' | 'unset' | null;
  settingsGroup: string | null;
  how: string;
}

export interface ConfigGroups {
  core: string[];
  couriers: string[];
  payments: string[];
  notifications: string[];
  storage: string[];
}

// Flat map keyed exactly as the backend's PATCH .../config/:groupKey route
// expects (e.g. "couriers.delhivery") — matches PlatformAdmin/companies.router.js.
export type GroupStatusMap = Record<string, 'set' | 'unset' | { jwtSecret: 'set' | 'unset'; sessionSecret: 'set' | 'unset' }>;

export const companiesApi = {
  list: () => apiClient.get<{ success: boolean; companies: CompanySummary[] }>('/platform-admin/companies'),

  // courierLabels: courier key -> ShipexFrontend's exact dropdown label (e.g. "shreeMaruti" -> "Shree Maruti"),
  // the single source of truth for display names now — covers all 16, including the 5 added after
  // GROUP_LABELS was last updated (ecomExpress, nimbus, losung360, vamaship, xpressbees).
  configGroups: () => apiClient.get<{ success: boolean; groups: ConfigGroups; fields?: Record<string, ConfigFieldHint[]>; courierLabels?: Record<string, string> }>('/platform-admin/companies/config-groups'),

  webhookUrls: (tenantKey: string) =>
    apiClient.get<{ success: boolean; tenantKey: string; baseUrl: string; urls: WebhookAddress[] }>(`/platform-admin/companies/${tenantKey}/webhook-urls`),

  create: (payload: CompanyCreatePayload) =>
    apiClient.post<{ success: boolean; company: { tenantKey: string; displayName: string } }>('/platform-admin/companies', payload),

  getOne: (tenantKey: string) =>
    apiClient.get<{ success: boolean; company: CompanySummary; groupStatus: GroupStatusMap }>(`/platform-admin/companies/${tenantKey}`),

  updateBasic: (tenantKey: string, payload: Record<string, unknown>) =>
    apiClient.patch(`/platform-admin/companies/${tenantKey}`, payload),

  updateConfigGroup: (tenantKey: string, groupKey: string, payload: Record<string, unknown>) =>
    apiClient.patch(`/platform-admin/companies/${tenantKey}/config/${groupKey}`, payload),

  // Used only during company creation, before a tenantKey exists to scope
  // an upload to — see the backend route's comment for why this is separate
  // from uploadBrandingAsset below.
  uploadPendingAsset: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient.post<{ success: boolean; url: string }>('/platform-admin/companies/upload-asset', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  uploadBrandingAsset: (tenantKey: string, kind: 'logo' | 'favicon' | 'icon' | 'emptyState', file: File) => {
    const form = new FormData();
    form.append(kind, file);
    return apiClient.post<{ success: boolean; url: string }>(
      `/platform-admin/companies/${tenantKey}/branding/${kind}`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
  },
};
