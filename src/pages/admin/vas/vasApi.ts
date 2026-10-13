import { apiClient } from '../../../services/apiClient';

export interface VasPlan { months: number; price: number }

export interface VasHistoryItem {
  action: string;
  at: string;
  by: 'user' | 'admin' | 'system';
  months?: number;
  amount?: number;
}

/** What the seller's screens know about one service for their account. */
export interface VasAccess {
  key: string;
  name: string;
  activation: 'publish' | 'toggle';
  enabled: boolean;
  charged: boolean;
  plans: VasPlan[];
  entitled: boolean;
  entitledUntil: string | null;
  status: 'none' | 'active' | 'inactive' | 'expired';
  activatedAt: string | null;
  deactivatedAt: string | null;
  history: VasHistoryItem[];
}

/** Error text from the API, falling back to a generic message. */
export function apiMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const e = err as { response?: { data?: { message?: string } } };
  return e?.response?.data?.message || fallback;
}

export function apiCode(err: unknown): string | undefined {
  return (err as { response?: { data?: { code?: string } } })?.response?.data?.code;
}

export const vasApi = {
  async mine(key: string): Promise<VasAccess> {
    const { data } = await apiClient.get(`/vas/my/${key}`);
    return data.service;
  },
  async purchase(key: string, months: number): Promise<VasAccess> {
    const { data } = await apiClient.post(`/vas/${key}/purchase`, { months });
    return data.service;
  },
  async activate(key: string, months?: number): Promise<VasAccess> {
    const { data } = await apiClient.post(`/vas/${key}/activate`, months ? { months } : {});
    return data.service;
  },
  async deactivate(key: string, reason?: string): Promise<VasAccess> {
    const { data } = await apiClient.post(`/vas/${key}/deactivate`, { reason });
    return data.service;
  },
};

export const fmtMoney = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
export const fmtDate = (v?: string | null) =>
  v ? new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
export const fmtDateTime = (v?: string | null) =>
  v ? new Date(v).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) : '—';
export const planLabel = (p: VasPlan) => `${p.months} month${p.months > 1 ? 's' : ''}`;
