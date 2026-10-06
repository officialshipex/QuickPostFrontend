/* ─────────────────────────────────────────────────────────────────────────
   Manual KYC — data model, per-step validation and submission payload.
   The fields mirror what e-KYC fetches from the backend (AadhaarData,
   PanData, BankData) so the verification team gets the same information,
   plus the supporting document uploads.
   ───────────────────────────────────────────────────────────────────────── */

import { IFSC_RE, PAN_RE } from './kycStyles';

export interface KycFile {
  file: File;
  /** Object URL for previews — revoke when the file is removed/replaced. */
  url: string;
}

export interface ManualPan {
  number: string;
  name: string;
  /** Date of birth (individual) or date of incorporation (company), yyyy-mm-dd. */
  date: string;
  card: KycFile | null;
}

export interface ManualAadhaar {
  number: string;
  name: string;
  guardianName: string;
  dob: string;
  address: string;
  pincode: string;
  city: string;
  state: string;
  front: KycFile | null;
  back: KycFile | null;
}

export type BankProofType = 'cheque' | 'statement';
export type BankAccountType = 'savings' | 'current';

export interface ManualBank {
  holderName: string;
  accountNumber: string;
  confirmAccountNumber: string;
  ifsc: string;
  bankName: string;
  branch: string;
  accountType: BankAccountType;
  proofType: BankProofType;
  proof: KycFile | null;
}

export interface ManualKycData {
  gstCertificate: KycFile | null;
  pan: ManualPan;
  aadhaar: ManualAadhaar;
  bank: ManualBank;
}

export type ManualStep = 'details' | 'pan' | 'aadhaar' | 'bank' | 'review';

export const MANUAL_STEPS: { id: ManualStep; label: string }[] = [
  { id: 'details', label: 'Business Details' },
  { id: 'pan', label: 'PAN' },
  { id: 'aadhaar', label: 'Aadhaar' },
  { id: 'bank', label: 'Bank Account' },
  { id: 'review', label: 'Review' },
];

export const createManualKycData = (): ManualKycData => ({
  gstCertificate: null,
  pan: { number: '', name: '', date: '', card: null },
  aadhaar: { number: '', name: '', guardianName: '', dob: '', address: '', pincode: '', city: '', state: '', front: null, back: null },
  bank: { holderName: '', accountNumber: '', confirmAccountNumber: '', ifsc: '', bankName: '', branch: '', accountType: 'current', proofType: 'cheque', proof: null },
});

/* ── Per-step completeness ── */

export const isPanComplete = (p: ManualPan) =>
  PAN_RE.test(p.number) && p.name.trim().length >= 2 && !!p.date && !!p.card;

export const isAadhaarComplete = (a: ManualAadhaar) =>
  /^\d{12}$/.test(a.number) && a.name.trim().length >= 2 && a.guardianName.trim().length >= 2 && !!a.dob
  && a.address.trim().length >= 5 && /^\d{6}$/.test(a.pincode) && !!a.city.trim() && !!a.state.trim()
  && !!a.front && !!a.back;

export const isBankAccountLengthOk = (n: string) => n.length >= 9 && n.length <= 18;

export const isBankComplete = (b: ManualBank) =>
  b.holderName.trim().length >= 2 && isBankAccountLengthOk(b.accountNumber) && b.accountNumber === b.confirmAccountNumber
  && IFSC_RE.test(b.ifsc) && !!b.bankName.trim() && !!b.branch.trim() && !!b.proof;

/* ── Display helpers ── */

export const formatAadhaar = (digits: string) => digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
export const maskTail = (value: string, visible = 4) => (value ? `•••• ${value.slice(-visible)}` : '—');
export const formatDate = (iso: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};
export const formatFileSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

/* ── Submission payload ──
   Multipart body for the manual-KYC endpoint once the backend exposes it.
   Field names follow the existing e-KYC payload where one exists. */
export function buildManualKycFormData(args: {
  data: ManualKycData;
  businessType: 'INDIVIDUAL' | 'COMPANY';
  email: string;
  phoneNumber: string;
  billing: { address: string; pincode: string; city: string; state: string };
  gstin: string;
}): FormData {
  const { data, businessType, email, phoneNumber, billing, gstin } = args;
  const fd = new FormData();
  fd.append('selectedType', businessType === 'COMPANY' ? 'company' : 'individual');
  fd.append('email', email);
  fd.append('phoneNumber', phoneNumber);
  fd.append('billingInfo', JSON.stringify(billing));
  if (businessType === 'COMPANY') {
    fd.append('gstNumber', gstin);
    if (data.gstCertificate) fd.append('gstCertificate', data.gstCertificate.file);
  }
  fd.append('pan', JSON.stringify({ pan: data.pan.number, name: data.pan.name, date: data.pan.date }));
  if (data.pan.card) fd.append('panCard', data.pan.card.file);
  const { front, back, ...aadhaar } = data.aadhaar;
  fd.append('aadhaar', JSON.stringify({ ...aadhaar, aadhaarNumber: aadhaar.number }));
  if (front) fd.append('aadhaarFront', front.file);
  if (back) fd.append('aadhaarBack', back.file);
  const { proof, confirmAccountNumber: _confirm, ...bank } = data.bank;
  void _confirm;
  fd.append('bankDetails', JSON.stringify(bank));
  if (proof) fd.append('bankProof', proof.file);
  return fd;
}
