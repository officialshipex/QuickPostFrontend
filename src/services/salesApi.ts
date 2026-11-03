import type { AxiosRequestConfig } from 'axios';
import { apiClient } from './apiClient';

/* Sales module API (`${VITE_API_URL}/sales/...`, backend/sales). Goes through apiClient so it carries the same
   auth, panel and company headers as every other call.
     Sales person:      /me /overview /calls /sellers /performance /referral /tasks /earnings /rate-offers
                        /rate-suggest /rate-quote /sellers/:id/rate /sellers/:id/business /kyc/* /offer-letter
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

// Fetches a PDF and saves it. The reply is asked for as a file, so a backend error message arrives as a blob too.
async function savePdf(request: () => Promise<{ data: unknown }>, fileName: string, fallback: string) {
  let res;
  try {
    res = await request();
  } catch (e) {
    const data = (e as { response?: { data?: unknown } })?.response?.data;
    let message = fallback;
    if (data instanceof Blob) { try { message = JSON.parse(await data.text()).message || message; } catch { /* keep the general message */ } }
    throw new Error(message, { cause: e });
  }
  const url = URL.createObjectURL(res.data as Blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Downloads the offer letter PDF (own, or a sales person's when employeeId is given) */
export const downloadOfferLetter = (employeeId?: string) =>
  savePdf(() => salesApiClient.get('/offer-letter', { params: employeeId ? { employeeId } : {}, responseType: 'blob' }), 'Offer-Letter.pdf', 'Could not download the offer letter. Please try again.');

/** "Send rate": the same proposal emailed to the prospect (replies go to the sales person) */
export const sendRateQuote = (body: BusinessDetails & QuoteTarget & { prospectName?: string; email: string }) =>
  salesApiClient.post<{ success: boolean; message: string }>('/rate-quote/send', body).then(r => r.data);

/** "Fetch rate" proposal PDF for a prospect: their business details, the offer (or the suggested one), prices */
export const downloadRateQuote = (body: BusinessDetails & QuoteTarget & { prospectName?: string }, employeeId?: string) =>
  savePdf(() => salesApiClient.post('/rate-quote', body, { params: employeeId ? { employeeId } : {}, responseType: 'blob' }),
    `Rate-Proposal${body.prospectName ? `-${body.prospectName.replace(/[^\w-]+/g, '-').slice(0, 40)}` : ''}.pdf`, 'Could not create the proposal. Please try again.');

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
  /** This month's in-transit shipments against the Monthly Business Details target (0 = not set) */
  monthTarget?: { target: number; achieved: number };
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
  offer?: { letterNumber: string; issuedAt: string; downloadedAt?: string | null; ready?: boolean } | null;
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
export interface SlabPrice { key: string; label: string; zonePrices: Record<string, number | null>; weightedPrice: number }
export interface RateOffer { _id: string; name: string; planName: string; minMonthlyShipments: number; description?: string; preview?: SlabPrice[]; active?: boolean; sellers?: number; salesPersons?: { _id: string; fullName: string; employeeId: string }[] }
/** Monthly Business Details (sales person fills them for a seller or a prospect) */
export interface BusinessDetails {
  totalShipments: number; monthlyShippingBill: number; productCategory: string; productValue: number;
  averageWeight: number; rtoPercent: number; codPercent: number; topZone: string;
}
export const emptyBusiness = (): BusinessDetails => ({ totalShipments: 0, monthlyShippingBill: 0, productCategory: '', productValue: 0, averageWeight: 0.5, rtoPercent: 0, codPercent: 0, topZone: '' });
export interface BusinessEstimate {
  freightPerShipment: number; codPerShipment: number; rtoPerShipment: number; avgPerShipment: number;
  monthlyEstimate: number; savings: number | null; zonePrices: Record<string, number | null>; couriers: string[];
  /** e.g. the top zone has no price on this card and the average of the other zones was used */
  note?: string;
}
export interface RateSuggestion {
  business: BusinessDetails;
  recommendedOfferId: string | null;
  /** `problem`: why the row could not be priced (what the admin has to set up first) */
  offers: { offer: RateOffer; eligible: boolean; shipmentsShort: number; estimate: BusinessEstimate | null; problem?: string | null }[];
  /** The main rate cards priced for the same business (no commitment; recharge plans carry their amount) */
  plans?: { planName: string; minRecharge: number | null; estimate: BusinessEstimate | null; problem?: string | null }[];
  /** Why a list is empty: the step that has to be done first */
  offersEmptyReason?: string | null;
  plansEmptyReason?: string | null;
  zones: string[];
}
/** Which rate a proposal is for: a commitment offer, a main rate card, or (neither) the suggested offer */
export interface QuoteTarget { offerId?: string; planName?: string }
export interface SavedBusiness extends BusinessDetails {
  updatedAt?: string;
  suggestedOffer?: Pick<RateOffer, '_id' | 'name' | 'planName' | 'minMonthlyShipments'> | null;
  appliedOffer?: Pick<RateOffer, '_id' | 'name' | 'planName' | 'minMonthlyShipments'> | null;
  applyNote?: string;
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
