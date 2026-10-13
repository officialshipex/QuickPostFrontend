import { apiClient } from '../../../../services/apiClient';
import type { VasAccess } from '../vasApi';

export interface SecureRules {
  threshold: number;
  courierMatch: string;
  premiumPercent: number;
  minPremium: number;
  maxCover: number;
  claimWindowDays: number;
}

export type ClaimStatus = 'submitted' | 'need_info' | 'paying' | 'paid' | 'rejected' | 'withdrawn';
export type ClaimType = 'lost' | 'damaged';
export type PolicyStatus = 'covered' | 'not_covered' | 'cancelled';

export interface Evidence { url: string; name?: string }

export interface ClaimSummary {
  _id: string;
  claimNo: string;
  status: ClaimStatus;
  type: ClaimType;
  claimedAmount: number;
  payoutAmount?: number;
}

export interface Policy {
  _id: string;
  userId: string;
  orderId?: number;
  awb: string;
  serviceKey: string;
  courierName: string;
  declaredValue: number;
  status: PolicyStatus;
  reason: string;
  premium: number;
  coverAmount: number;
  claimWindowDays: number;
  issuedAt: string;
  orderStatus?: string;
  claim?: ClaimSummary | null;
  claimable?: ClaimType | null;
  user?: SellerLite | null;
}

export interface SellerLite { _id: string; fullname: string; email: string; phoneNumber?: string; company?: string }

export interface HistoryItem { at: string; action: string; by: 'seller' | 'admin' | 'system'; note?: string }

export interface Claim {
  _id: string;
  claimNo: string;
  userId: string;
  policyId: string;
  orderId?: number;
  awb: string;
  serviceKey: string;
  type: ClaimType;
  description: string;
  claimedAmount: number;
  coverAmount: number;
  evidence: Evidence[];
  status: ClaimStatus;
  approvedAmount?: number;
  payoutAmount?: number;
  liabilityDeducted?: number;
  adminNote?: string;
  rejectionReason?: string;
  createdAt: string;
  decidedAt?: string;
  paidAt?: string;
  history?: HistoryItem[];
  user?: SellerLite | null;
}

export interface SecureServiceInfo {
  key: string;
  name: string;
  rules: SecureRules;
  access: VasAccess;
}

export interface SecureSummaryRow {
  key: string;
  covered: number;
  notCovered: number;
  cancelled: number;
  premiumCollected: number;
  coverInForce: number;
  claimsOpen: number;
  claimsAwaitingReview: number;
  claimsPaid: number;
  claimsRejected: number;
  paidOut: number;
  lossRatio: number | null;
}

export interface Paged<T> { rows: T[]; total: number; page: number; limit: number }

export const secureApi = {
  async info() {
    const { data } = await apiClient.get('/vas/secure/info');
    return data as { services: SecureServiceInfo[]; totals: { covered: number; premiumPaid: number; claimsPaid: number; claimsAmount: number } };
  },
  async policies(params: { status?: string; search?: string; page: number; limit: number }): Promise<Paged<Policy>> {
    const { data } = await apiClient.get('/vas/secure/policies', { params });
    return data;
  },
  async claims(params: { status?: string; page: number; limit: number }): Promise<Paged<Claim>> {
    const { data } = await apiClient.get('/vas/secure/claims', { params });
    return data;
  },
  async createClaim(body: { policyId: string; type: ClaimType; amount?: number; description: string; evidence: Evidence[] }): Promise<Claim> {
    const { data } = await apiClient.post('/vas/secure/claims', body);
    return data.claim;
  },
  async respond(id: string, body: { note: string; evidence: Evidence[] }): Promise<Claim> {
    const { data } = await apiClient.post(`/vas/secure/claims/${id}/respond`, body);
    return data.claim;
  },
  async withdraw(id: string): Promise<Claim> {
    const { data } = await apiClient.post(`/vas/secure/claims/${id}/withdraw`);
    return data.claim;
  },
  async upload(file: File): Promise<Evidence> {
    const form = new FormData();
    form.append('file', file);
    const { data } = await apiClient.post('/vas/secure/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    return { url: data.url, name: data.name };
  },
};

export interface ClaimDetail {
  claim: Claim;
  user: SellerLite | null;
  policy: Policy | null;
  order: {
    awb_number: string; orderId: number; status: string; courierName?: string; courierServiceName?: string;
    paymentDetails?: { amount?: number; method?: string }; receiverAddress?: { city?: string; state?: string };
    pickupAddress?: { city?: string }; shipmentCreatedAt?: string;
    tracking: { status?: string; Instructions?: string; StatusLocation?: string; StatusDateTime?: string }[];
  } | null;
  sellerHistory: { total: number; paid: number; rejected: number };
  liabilityCredited: number;
}

const admin = '/vas/admin';

export const secureAdminApi = {
  async summary(): Promise<SecureSummaryRow[]> {
    const { data } = await apiClient.get(`${admin}/secure/summary`);
    return data.services;
  },
  async rules(key: string): Promise<SecureRules> {
    const { data } = await apiClient.get(`${admin}/services/${key}/secure-rules`);
    return data.rules;
  },
  async saveRules(key: string, rules: SecureRules): Promise<SecureRules> {
    const { data } = await apiClient.put(`${admin}/services/${key}/secure-rules`, rules);
    return data.rules;
  },
  async policies(params: { serviceKey: string; status?: string; search?: string; page: number; limit: number }): Promise<Paged<Policy>> {
    const { data } = await apiClient.get(`${admin}/secure/policies`, { params });
    return data;
  },
  async claims(params: { serviceKey: string; status?: string; type?: string; search?: string; page: number; limit: number }): Promise<Paged<Claim>> {
    const { data } = await apiClient.get(`${admin}/secure/claims`, { params });
    return data;
  },
  async claim(id: string): Promise<ClaimDetail> {
    const { data } = await apiClient.get(`${admin}/secure/claims/${id}`);
    return data;
  },
  async approve(id: string, body: { approvedAmount: number; note: string }) {
    await apiClient.post(`${admin}/secure/claims/${id}/approve`, body);
  },
  async reject(id: string, reason: string) {
    await apiClient.post(`${admin}/secure/claims/${id}/reject`, { reason });
  },
  async requestInfo(id: string, note: string) {
    await apiClient.post(`${admin}/secure/claims/${id}/request-info`, { note });
  },
  async sweep() {
    const { data } = await apiClient.post(`${admin}/secure/sweep`);
    return data as { sellers: number; issued: number; refunded: number };
  },
};

export const CLAIM_STATUS_LABEL: Record<ClaimStatus, string> = {
  submitted: 'Under review',
  need_info: 'Details needed',
  paying: 'Paying',
  paid: 'Paid',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

export const CLAIM_STATUS_STYLE: Record<ClaimStatus, string> = {
  submitted: 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]',
  need_info: 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]',
  paying: 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]',
  paid: 'bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]',
  rejected: 'bg-[#FEF2F2] text-red-600 border-red-200',
  withdrawn: 'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]',
};
