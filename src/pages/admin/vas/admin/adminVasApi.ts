import { apiClient } from '../../../../services/apiClient';
import type { VasPlan } from '../vasApi';

export type SubStatus = 'active' | 'inactive' | 'expired';
export type FollowUpStatus = 'none' | 'open' | 'contacted' | 'resolved';
export type AccessMode = 'default' | 'enabled' | 'disabled';
export type ChargeMode = 'default' | 'free' | 'custom';

export interface ServiceConfig {
  enabled: boolean;
  pricingEnabled: boolean;
  plans: VasPlan[];
  updatedAt: string | null;
  changeLog: { at: string; by: string; summary: string }[];
}

export interface ServiceStats {
  active: number;
  inactive: number;
  expired: number;
  everUsed: number;
  revenue: number;
  followUpOpen: number;
  overrides: number;
  disabledForUsers: number;
}

export interface AdminService {
  key: string;
  name: string;
  activation: 'publish' | 'toggle';
  description: string;
  config: ServiceConfig;
  stats: ServiceStats;
}

export interface SellerRef {
  _id: string;
  fullname: string;
  email: string;
  phoneNumber?: string;
  company?: string;
  userId?: number | string;
}

export interface PageInfo {
  slug: string | null;
  live: boolean;
  publishedAt?: string;
  views: number;
  lastViewedAt?: string;
}

export interface HistoryRow {
  action: string;
  at: string;
  by: 'user' | 'admin' | 'system';
  note?: string;
  months?: number;
  amount?: number;
}

export interface SubscriptionRow {
  _id: string;
  userId: string;
  serviceKey: string;
  status: SubStatus;
  everActivated: boolean;
  firstActivatedAt?: string;
  lastActivatedAt?: string;
  lastDeactivatedAt?: string;
  deactivatedBy?: 'user' | 'admin' | 'expiry' | null;
  activationCount: number;
  entitledUntil: string | null;
  lastPlanMonths?: number;
  lastPlanPrice?: number;
  totalPaid: number;
  followUp: { status: FollowUpStatus; note: string; updatedAt?: string };
  history?: HistoryRow[];
  user: SellerRef | null;
  enabledForUser: boolean;
  override: { access: AccessMode; chargeMode: ChargeMode; plans: VasPlan[]; note: string } | null;
  page: PageInfo | null;
}

export interface OverrideRow {
  _id: string;
  userId: string;
  access: AccessMode;
  chargeMode: ChargeMode;
  plans: VasPlan[];
  note: string;
  updatedAt: string;
  user: SellerRef | null;
}

const base = '/vas/admin';

export const adminVasApi = {
  async services(): Promise<AdminService[]> {
    const { data } = await apiClient.get(`${base}/services`);
    return data.services;
  },
  async updateService(key: string, body: { enabled?: boolean; pricingEnabled?: boolean; plans?: VasPlan[] }): Promise<ServiceConfig> {
    const { data } = await apiClient.put(`${base}/services/${key}`, body);
    return data.config;
  },
  async users(key: string, params: { status: string; search: string; page: number; limit: number }) {
    const { data } = await apiClient.get(`${base}/services/${key}/users`, { params });
    return data as { rows: SubscriptionRow[]; total: number; page: number; limit: number };
  },
  async userDetail(key: string, userId: string) {
    const { data } = await apiClient.get(`${base}/services/${key}/users/${userId}`);
    return data as {
      user: SellerRef;
      subscription: (Omit<SubscriptionRow, 'user' | 'enabledForUser' | 'override' | 'page'> & { history: HistoryRow[] }) | null;
      override: OverrideRow | null;
      page: PageInfo | null;
    };
  },
  async grant(key: string, userId: string, body: { months?: number; until?: string; amount?: number; note?: string }) {
    const { data } = await apiClient.post(`${base}/services/${key}/users/${userId}/grant`, body);
    return data.entitledUntil as string;
  },
  async deactivate(key: string, userId: string, note?: string) {
    await apiClient.post(`${base}/services/${key}/users/${userId}/deactivate`, { note });
  },
  async setFollowUp(key: string, userId: string, status: FollowUpStatus, note: string) {
    await apiClient.put(`${base}/services/${key}/users/${userId}/followup`, { status, note });
  },
  async overrides(key: string): Promise<OverrideRow[]> {
    const { data } = await apiClient.get(`${base}/services/${key}/overrides`);
    return data.overrides;
  },
  async setOverrides(key: string, body: { userIds: string[]; access: AccessMode; chargeMode: ChargeMode; plans: VasPlan[]; note: string }) {
    const { data } = await apiClient.put(`${base}/services/${key}/overrides`, body);
    return data.updated as number;
  },
  async clearOverride(key: string, userId: string) {
    await apiClient.delete(`${base}/services/${key}/overrides/${userId}`);
  },
  async expireFree(key: string, until: string) {
    const { data } = await apiClient.post(`${base}/services/${key}/expire-free`, { until });
    return data.updated as number;
  },
  async searchSellers(query: string): Promise<SellerRef[]> {
    const { data } = await apiClient.get('/admin/searchUser', { params: { query } });
    return data.users || [];
  },
};
