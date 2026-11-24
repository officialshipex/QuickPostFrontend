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
  /** NDR Follow-ups: charged per successful response instead of plans */
  billing?: 'usage';
  usagePrices?: UsagePrices;
  ndrMode?: NdrMode | null;
}

/** ₹ per WhatsApp delivered / per call answered (0 = free) */
export interface UsagePrices { whatsapp: number; call: number }
export type NdrMode = 'whatsapp' | 'calling' | 'both';

export type NdrWaStatus = 'none' | 'sending' | 'sent' | 'delivered' | 'failed' | 'unconfirmed' | 'skipped';
export type NdrCallStatus = 'none' | 'waiting' | 'placing' | 'placed' | 'answered' | 'unanswered' | 'failed' | 'not_needed' | 'no_result' | 'skipped';

export interface NdrFollowupRow {
  _id: string;
  userId: string;
  orderId?: number;
  awb: string;
  mode: NdrMode;
  createdAt: string;
  whatsapp: { status: NdrWaStatus; sentAt?: string; deliveredAt?: string; price: number; charged: boolean; chargedAmount: number; chargeError?: string; error?: string };
  call: { status: NdrCallStatus; dueAt?: string; placedAt?: string; resultAt?: string; customerResponse?: string; price: number; charged: boolean; chargedAmount: number; chargeError?: string; error?: string };
  user?: { fullname: string; email: string; company?: string; userId?: number } | null;
}

export interface NdrTotals { followups: number; waSent: number; waDelivered: number; callsPlaced: number; callsAnswered: number; charged: number }
export interface NdrActivity { rows: NdrFollowupRow[]; total: number; page: number; limit: number; totals30d: NdrTotals }
export interface NdrActivityParams { outcome?: string; search?: string; page: number; limit: number }

/** Error text from the API, falling back to a generic message. */
export function apiMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const e = err as { response?: { data?: { message?: string } } };
  return e?.response?.data?.message || fallback;
}

export function apiCode(err: unknown): string | undefined {
  return (err as { response?: { data?: { code?: string } } })?.response?.data?.code;
}

/** RTO Score page "Overview": the seller's COD orders of the last `days` days by risk level. */
export type RtoSummary =
  | { locked: true }
  | { locked: false; days: number; scanned: number; high: number; medium: number; low: number; capped: boolean };

export const vasApi = {
  async rtoSummary(): Promise<RtoSummary> {
    const { data } = await apiClient.get('/rtoRisk/summary');
    return data;
  },
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
  /** NDR Follow-ups: activate, or switch to another mode while active */
  async activateNdr(mode: NdrMode): Promise<VasAccess> {
    const { data } = await apiClient.post('/vas/ndr-followups/activate', { mode });
    return data.service;
  },
  async ndrActivity(params: NdrActivityParams): Promise<NdrActivity> {
    const { data } = await apiClient.get('/vas/ndr-followups/activity', { params });
    return data;
  },
};

export const NDR_WA_LABEL: Record<NdrWaStatus, string> = {
  none: '—', sending: 'Sending', sent: 'Sent, awaiting delivery', delivered: 'Delivered', failed: 'Failed',
  unconfirmed: 'Not confirmed', skipped: 'Not sent',
};
export const NDR_CALL_LABEL: Record<NdrCallStatus, string> = {
  none: '—', waiting: 'Scheduled', placing: 'Calling', placed: 'Called, awaiting result', answered: 'Answered',
  unanswered: 'Not answered', failed: 'Failed', not_needed: 'Not needed', no_result: 'No result', skipped: 'Not called',
};
export const NDR_MODE_LABEL: Record<NdrMode, string> = { whatsapp: 'WhatsApp', calling: 'Calling', both: 'WhatsApp + Calling' };

export const fmtMoney = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
export const fmtDate = (v?: string | null) =>
  v ? new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
export const fmtDateTime = (v?: string | null) =>
  v ? new Date(v).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) : '—';
export const planLabel = (p: VasPlan) => `${p.months} month${p.months > 1 ? 's' : ''}`;
