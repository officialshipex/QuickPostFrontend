import { salesApiClient, type KycStatus } from '../../../services/salesApi';

/* Shared styles and helpers for the Sales Management screens. */

export const card = 'bg-white rounded-2xl border border-[#EEF2F6] shadow-[0_1px_2px_rgba(16,24,40,0.04),0_2px_8px_rgba(16,24,40,0.05)]';
export const fieldCls = 'w-full h-10 px-3.5 rounded-xl border border-[#E2E8F0] text-[13px] text-[#0F172A] bg-white placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]';
export const labelCls = 'block text-[12px] font-semibold text-[#475569] mb-1.5';
export const primaryBtn = 'h-10 px-5 rounded-full bg-[#00A86B] hover:bg-[#009B63] text-white text-[13px] font-semibold disabled:opacity-50 inline-flex items-center justify-center gap-2';
export const ghostBtn = 'h-10 px-4 rounded-full border border-[#E2E8F0] text-[13px] font-semibold text-[#475569] hover:border-[#00A86B]/40 hover:text-[#00A86B] inline-flex items-center justify-center gap-2 disabled:opacity-50';
export const fmtDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

export interface PersonDetail {
  person: { _id: string; fullName: string; email: string; employeeId: string; role: string; referralCode?: string; contactNumber: string; isEmpActive: boolean };
  kyc: {
    status: KycStatus; method: 'ekyc' | 'manual' | null; submittedAt?: string; verifiedAt?: string; rejectionReason?: string;
    pan: { number?: string; name?: string; verified: boolean }; aadhaar: { number?: string; name?: string; dob?: string; address?: string; verified: boolean };
    bank: { accountNumber?: string; ifsc?: string; holderName?: string; bankName?: string; verified: boolean };
    documents: Record<string, string | null>;
  };
  offer: { letterNumber?: string; issuedAt?: string; joiningDate?: string; monthlyCtc?: number; location?: string };
  targets: { daily: number; weekly: number; monthly: number };
  plan: { _id: string; name: string; isDefault: boolean };
}

export const loadPerson = (id: string) => salesApiClient.get<PersonDetail>(`/admin/people/${id}`).then(r => r.data);
