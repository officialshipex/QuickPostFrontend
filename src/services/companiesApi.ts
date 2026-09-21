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
  colors?: { primary?: string; secondary?: string; accent?: string };
  companyDisplayName?: string;
  supportEmail?: string;
  supportPhone?: string;
}

export interface CompanySummary {
  tenantKey: string;
  displayName: string;
  domains: CompanyDomain[];
  status: 'onboarding' | 'active' | 'suspended' | 'disabled';
  isDefaultTenant: boolean;
  branding?: CompanyBranding;
  requiredSetupComplete: boolean;
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

  configGroups: () => apiClient.get<{ success: boolean; groups: ConfigGroups; fields?: Record<string, ConfigFieldHint[]> }>('/platform-admin/companies/config-groups'),

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

  uploadBrandingAsset: (tenantKey: string, kind: 'logo' | 'favicon' | 'icon', file: File) => {
    const form = new FormData();
    form.append(kind, file);
    return apiClient.post<{ success: boolean; url: string }>(
      `/platform-admin/companies/${tenantKey}/branding/${kind}`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
  },
};
