import axios, { AxiosError, type AxiosAdapter } from 'axios';
import { getToken, removeToken } from '../utils/session';

/* Sales module API (`${VITE_API_URL}/sales/...`). Until the backend ships, SALES_BACKEND_READY = false:
   GETs resolve with an empty body (screens show their empty / zero states) and writes are rejected
   with a clear message. Flip the flag once the endpoints are live — no page changes needed.

   Expected endpoints (all scoped server-side to the caller; sales admins may pass ?employeeId=):
     GET   /sales/overview?from&to           → SalesOverview
     GET   /sales/calls?status&q&page&limit   → { calls: SalesCall[], total }
     PATCH /sales/calls/:id                   → { status, outcome, note, followUpAt }
     GET   /sales/sellers?filter&q&page&limit → { sellers: ReferredSeller[], total }
     GET   /sales/referral                    → { referralId, referralLink }
     GET   /sales/performance?from&to         → SalesPerformance
     GET   /sales/team?from&to                → { members: TeamMember[] }   (sales admins only) */

export const SALES_BACKEND_READY = false;

const API_BASE = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000/api/v1';
const OFFLINE_MESSAGE = 'Sales backend is not connected yet.';

const offlineAdapter: AxiosAdapter = async (config) => {
  if ((config.method || 'get').toLowerCase() === 'get') return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
  throw new AxiosError(OFFLINE_MESSAGE, 'ERR_SALES_OFFLINE', config, null,
    { data: { message: OFFLINE_MESSAGE }, status: 503, statusText: 'Service Unavailable', headers: {}, config });
};

export const salesApiClient = axios.create({
  baseURL: `${API_BASE}/sales`,
  headers: { 'Content-Type': 'application/json' },
  ...(SALES_BACKEND_READY ? {} : { adapter: offlineAdapter }),
});

salesApiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
salesApiClient.interceptors.response.use((r) => r, (error) => {
  if (error.response?.status === 401) { removeToken(); window.location.href = '/login'; }
  return Promise.reject(error);
});

// ── Types ─────────────────────────────────────────────────────────────────────
export type CallStatus = 'assigned' | 'pending' | 'completed' | 'follow_up' | 'unreachable';
export type CallOutcome = 'interested' | 'not_interested' | 'callback' | 'no_answer' | 'invalid_number' | 'onboarding_initiated';

export interface SalesCall {
  _id: string;
  leadName: string;
  businessName?: string;
  phone: string;
  assignedAt: string;
  status: CallStatus;
  outcome?: CallOutcome;
  lastNote?: string;
  followUpAt?: string;
  priority?: 'high' | 'medium' | 'low';
}

export interface ReferredSeller {
  _id: string;
  name: string;
  businessName?: string;
  phone: string;
  registeredAt: string;
  kycStatus: 'pending' | 'submitted' | 'verified' | 'rejected';
  onboardingStatus: 'registered' | 'in_progress' | 'completed';
  firstOrderAt?: string;
  totalOrders: number;
  lastOrderAt?: string;
  active: boolean;
}

export interface Target { target: number; achieved: number }
export interface SalesOverview {
  calls?: { assigned: number; completed: number; pending: number };
  followUps?: { dueToday: number; overdue: number };
  sellers?: { onboarded: number; active: number; firstOrder: number };
  orders?: { total: number; today: number; month: number; shipped: number; delivered: number; cancelled: number; rto: number };
  targets?: { daily?: Target; weekly?: Target; monthly?: Target };
  followUpList?: SalesCall[];
}

export interface SalesPerformance {
  callsAssigned?: number; callsCompleted?: number;
  registrations?: number; onboarded?: number; firstOrders?: number;
  ordersGenerated?: number; delivered?: number;
  trend?: { label: string; calls: number; onboarded: number }[];
  topSellers?: { name: string; orders: number }[];
  dormantSellers?: { name: string; lastOrderAt?: string }[];
}

export interface TeamMember {
  _id: string; name: string; referralId: string;
  callsAssigned: number; callsCompleted: number; onboarded: number; firstOrders: number; orders: number;
  monthlyTarget?: number;
}

export const CALL_STATUS_LABEL: Record<CallStatus, string> = {
  assigned: 'Assigned', pending: 'Pending', completed: 'Completed', follow_up: 'Follow-up', unreachable: 'Unreachable',
};
export const CALL_OUTCOME_LABEL: Record<CallOutcome, string> = {
  interested: 'Interested', not_interested: 'Not interested', callback: 'Callback requested',
  no_answer: 'No answer', invalid_number: 'Invalid number', onboarding_initiated: 'Onboarding initiated',
};

/** Safe percentage: numerator / denominator, 0 when the denominator is 0. */
export const pct = (num?: number, den?: number) => (den && den > 0 ? Math.round(((num || 0) / den) * 100) : 0);
