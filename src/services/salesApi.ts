import type { AxiosRequestConfig } from 'axios';
import { apiClient } from './apiClient';

/* Sales module API (`${VITE_API_URL}/sales/...`, backend/sales). Goes through apiClient so it carries the same
   auth, panel and company headers as every other call.
     Sales person:      /me /overview /calls /sellers /performance /referral /tasks /earnings /rate-offers
                        /rate-suggest /sellers/:id/rate /kyc/* /offer-letter
     Owner (view-as):   the same with ?employeeId=<sales person>, plus /team
     Sales Management:  /admin/*  */

const prefix = (url: string) => `/sales${url}`;
export const salesApiClient = {
  get: <T = any>(url: string, config?: AxiosRequestConfig) => apiClient.get<T>(prefix(url), config), // eslint-disable-line @typescript-eslint/no-explicit-any
  post: <T = any>(url: string, data?: unknown, config?: AxiosRequestConfig) => apiClient.post<T>(prefix(url), data, config), // eslint-disable-line @typescript-eslint/no-explicit-any
  put: <T = any>(url: string, data?: unknown, config?: AxiosRequestConfig) => apiClient.put<T>(prefix(url), data, config), // eslint-disable-line @typescript-eslint/no-explicit-any
  patch: <T = any>(url: string, data?: unknown, config?: AxiosRequestConfig) => apiClient.patch<T>(prefix(url), data, config), // eslint-disable-line @typescript-eslint/no-explicit-any
  delete: <T = any>(url: string, config?: AxiosRequestConfig) => apiClient.delete<T>(prefix(url), config), // eslint-disable-line @typescript-eslint/no-explicit-any
};

/** Server error message, or a fallback */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const apiError = (e: any, fallback = 'Something went wrong. Please try again.') => e?.response?.data?.message || fallback;

/** Where sellers sign up with a sales person's referral code */
export const referralLinkFor = (code?: string) => (code ? `${window.location.origin}/register?ref=${encodeURIComponent(code)}` : '');

/** Downloads the offer letter PDF (own, or a sales person's when employeeId is given) */
export async function downloadOfferLetter(employeeId?: string) {
  const res = await salesApiClient.get('/offer-letter', { params: employeeId ? { employeeId } : {}, responseType: 'blob' });
  const url = URL.createObjectURL(res.data as Blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Offer-Letter.pdf';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// ── Types ─────────────────────────────────────────────────────────────────────
export type CallStatus = 'assigned' | 'pending' | 'completed' | 'follow_up' | 'unreachable';
export type CallOutcome = 'interested' | 'not_interested' | 'callback' | 'no_answer' | 'invalid_number' | 'onboarding_initiated';

export interface SalesCall {
  _id: string;
  leadName: string;
  businessName?: string;
  phone: string;
  email?: string;
  assignedAt: string;
  assignedBy?: 'admin' | 'self';
  status: CallStatus;
  outcome?: CallOutcome;
  lastNote?: string;
  followUpAt?: string;
  priority?: 'high' | 'medium' | 'low';
  city?: string;
  category?: string;
  stage?: LeadStage;
}

export type LeadStage = 'lead' | 'interested' | 'callback' | 'kyc_pending' | 'first_shipment_due' | 'onboarded';
export const LEAD_STAGE_LABEL: Record<LeadStage, string> = {
  lead: 'Lead', interested: 'Interested', callback: 'Callback', kyc_pending: 'KYC pending',
  first_shipment_due: 'First shipment due', onboarded: 'Onboarded',
};

export interface SellerRate { current: string; committed: string; committedShipments: number; nextReviewAt: string; autoAdjust: boolean }
export interface SellerBonus { status: 'earned' | 'paid' | 'pending' | 'expired'; amount?: number; deadline?: string }

export interface ReferredSeller {
  _id: string;
  userId?: number;
  name: string;
  businessName?: string;
  email?: string;
  phone: string;
  registeredAt: string;
  kycStatus: 'pending' | 'submitted' | 'verified' | 'rejected';
  onboardingStatus: 'registered' | 'in_progress' | 'completed';
  firstOrderAt?: string;
  totalOrders: number;
  lastOrderAt?: string;
  active: boolean;
  rate?: SellerRate | null;
  bonus?: SellerBonus | null;
}

export interface Target { target: number; achieved: number }
export interface SalesOverview {
  calls?: { assigned: number; completed: number; pending: number };
  followUps?: { dueToday: number; overdue: number };
  sellers?: { onboarded: number; active: number; firstOrder: number };
  orders?: { total: number; today: number; month: number; shipped: number; delivered: number; cancelled: number; rto: number };
  targets?: { daily?: Target; weekly?: Target; monthly?: Target };
  followUpList?: SalesCall[];
  /** Seller funnel counts for the range, stage by stage. */
  funnel?: Partial<Record<FunnelStage, number>>;
}

export type FunnelStage = 'leads' | 'called' | 'connected' | 'interested' | 'kyc' | 'onboarded' | 'firstShipment' | 'repeat';
export const FUNNEL_STAGES: { key: FunnelStage; label: string }[] = [
  { key: 'leads', label: 'Leads' }, { key: 'called', label: 'Called' }, { key: 'connected', label: 'Connected' },
  { key: 'interested', label: 'Interested' }, { key: 'kyc', label: 'KYC done' }, { key: 'onboarded', label: 'Onboarded' },
  { key: 'firstShipment', label: 'First shipment' }, { key: 'repeat', label: 'Repeat' },
];

export interface SalesPerformance {
  callsAssigned?: number; callsCompleted?: number;
  registrations?: number; onboarded?: number; firstOrders?: number;
  ordersGenerated?: number; delivered?: number;
  topSellers?: { name: string; orders: number }[];
  dormantSellers?: { name: string; lastOrderAt?: string }[];
}

export interface TeamMember {
  _id: string; name: string; email?: string; phone?: string; employeeId?: string; designation?: string; referralId: string; active?: boolean;
  kycStatus?: KycStatus; kycMethod?: 'ekyc' | 'manual' | null; offerIssued?: boolean;
  callsAssigned: number; callsCompleted: number; sellers?: number; onboarded: number; firstOrders: number; orders: number;
  monthlyTarget?: number;
  month?: { shipments: number; freight: number; badge: string; badgeColor: string; projected: number };
  unpaid?: number;
}

export const CALL_STATUS_LABEL: Record<CallStatus, string> = {
  assigned: 'Assigned', pending: 'Pending', completed: 'Completed', follow_up: 'Follow-up', unreachable: 'Unreachable',
};
export const CALL_OUTCOME_LABEL: Record<CallOutcome, string> = {
  interested: 'Interested', not_interested: 'Not interested', callback: 'Callback requested',
  no_answer: 'No answer', invalid_number: 'Invalid number', onboarding_initiated: 'Onboarding initiated',
};

// ── KYC / me ──────────────────────────────────────────────────────────────────
export type KycStatus = 'not_started' | 'pending' | 'verified' | 'rejected';
export interface SalesKyc {
  status: KycStatus;
  method: 'ekyc' | 'manual' | null;
  rejectionReason: string;
  submittedAt?: string | null;
  verifiedAt?: string | null;
  pan: { verified: boolean; number: string; name: string };
  aadhaar: { verified: boolean; number: string; name: string; otpSent: boolean };
  bank: { verified: boolean; accountNumber: string; holderName: string; bankName: string };
}
export interface SalesMe {
  viewer: 'self' | 'owner';
  employee?: { _id: string; fullName: string; email: string; contactNumber?: string; employeeId: string; role: string; referralCode?: string };
  kyc?: SalesKyc;
  offer?: { letterNumber: string; issuedAt: string } | null;
  referralId?: string;
}

// ── Earnings ──────────────────────────────────────────────────────────────────
export interface Slab { minShipments: number; maxShipments: number | null; ratePerShipment: number; badge: string; color?: string }
export interface OnboardingBonusRule { enabled: boolean; amount: number; minRecharge: number; minShipments?: number; withinDays: number; requireKyc: boolean }
export interface MonthIncentive {
  period: string; planName: string; sellers: number; shipments: number; freight: number; ratePerShipment: number;
  badge: string; badgeColor: string; amount: number;
  nextSlab: { minShipments: number; ratePerShipment: number; badge: string; needed: number } | null;
}
export interface SalesEarning {
  _id: string; type: 'onboarding_bonus' | 'monthly_incentive'; period: string; amount: number; status: 'unpaid' | 'paid'; earnedAt: string;
  details?: { planName?: string; shipments?: number; freight?: number; ratePerShipment?: number; percent?: number; badge?: string; sellers?: number; sellerName?: string; rechargeAmount?: number; rechargeAt?: string };
  payout?: { _id: string; utr: string; paidAt: string } | null;
  salesPerson?: { _id: string; fullName: string; employeeId: string };
}
export interface SalesPayout { _id: string; amount: number; utr: string; paidAt: string; note?: string; earnings: string[]; salesPerson?: { _id: string; fullName: string; employeeId: string } }
export interface SalesEarnings {
  current?: MonthIncentive;
  plan?: { name: string; slabs: Slab[]; onboardingBonus: OnboardingBonusRule };
  earnings?: SalesEarning[];
  payouts?: SalesPayout[];
  totals?: { earned: number; paid: number; unpaid: number };
}

// ── Rates ─────────────────────────────────────────────────────────────────────
export interface WeightSlab { key: string; label: string; grams: number }
export interface SlabPrice { key: string; label: string; zonePrices: Record<string, number | null>; weightedPrice: number }
export interface RateOffer { _id: string; name: string; planName: string; minMonthlyShipments: number; description?: string; preview?: SlabPrice[]; active?: boolean; sellers?: number; salesPersons?: { _id: string; fullName: string; employeeId: string }[] }
export interface RateRequirement {
  monthlyShipments: number; codPercent: number; avgCodValue: number; productCategory: string;
  weightMix: Record<string, number>; zoneMix: Record<string, number>;
}
export interface RateSuggestion {
  requirement: RateRequirement;
  recommendedOfferId: string | null;
  offers: { offer: RateOffer; eligible: boolean; shipmentsShort: number; estimate: { avgPerShipment: number; codPerShipment: number; monthlyEstimate: number; couriers: string[]; perSlab: SlabPrice[] } | null }[];
  weightSlabs: WeightSlab[];
  zones: string[];
}
export const ZONE_LABEL: Record<string, string> = { zoneA: 'Zone A', zoneB: 'Zone B', zoneC: 'Zone C', zoneD: 'Zone D', zoneE: 'Zone E' };

/** Safe percentage: numerator / denominator, 0 when the denominator is 0. */
export const pct = (num?: number, den?: number) => (den && den > 0 ? Math.round(((num || 0) / den) * 100) : 0);
/** How an incentive was worked out: "17,493 shipments × ₹1.25" (older records: "2% of ₹5,000") */
export const incentiveLine = (d?: SalesEarning['details']) => (d?.ratePerShipment != null
  ? `${(d.shipments ?? 0).toLocaleString('en-IN')} shipments × ${inr(d.ratePerShipment)}`
  : `${(d?.shipments ?? 0).toLocaleString('en-IN')} shipments · ${d?.percent ?? 0}% of ${inr(d?.freight)}`);
export const inr = (v?: number) => `₹${(v ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
export const periodLabel = (p?: string) => {
  if (!p) return '—';
  const [y, m] = p.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
};
