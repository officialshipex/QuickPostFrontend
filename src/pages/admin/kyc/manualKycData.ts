/* ─────────────────────────────────────────────────────────────────────────
   Manual KYC — data model, per-step validation and submission payload.
   The fields mirror what e-KYC fetches from the backend (AadhaarData,
   PanData, BankData) so the verification team gets the same information,
   plus the supporting document uploads.
   ───────────────────────────────────────────────────────────────────────── */

import { IFSC_RE, PAN_RE } from './kycStyles';

/** A document already saved on the server (uploaded when it was chosen). */
export interface KycFile {
  name: string;
  size: number;
  url?: string | null;
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

/* ── Document rules (same as backend kyc/kycDocuments.js) ── */

export const MAX_DOCUMENT_MB = 5;

/** What is wrong with this document, or '' if it can be uploaded. A real PDF has "%PDF-" in its first 1024 bytes. */
export async function pdfProblem(file: File, label: string): Promise<string> {
  if (!/\.pdf$/i.test(file.name)) return `${label} must be a PDF file. "${file.name}" is not a PDF.`;
  if (!file.size) return `${label} is an empty file. Please choose it again.`;
  if (file.size > MAX_DOCUMENT_MB * 1024 * 1024) return `${label} is larger than ${MAX_DOCUMENT_MB} MB. Please upload a smaller PDF.`;
  const head = await file.slice(0, 1024).text();
  if (!head.includes('%PDF-')) return `${label} is not a valid PDF. "${file.name}" may have been renamed or damaged; please upload the original PDF.`;
  return '';
}

/** The specific reason a KYC submission failed, including failures that never reach our backend's own messages. */
export function kycSubmitError(err: unknown): string {
  const e = err as { response?: { status?: number; data?: { message?: unknown } } };
  const message = e.response?.data?.message;
  if (typeof message === 'string' && message) return message;
  const status = e.response?.status;
  if (status === 413) return `Your documents are too large to upload together. Please upload smaller PDFs (up to ${MAX_DOCUMENT_MB} MB each).`;
  if (status === 429) return 'Too many attempts. Please wait a minute and try again.';
  if (!e.response) return 'The upload could not finish. Please check your internet connection and try again. Nothing was submitted.';
  return 'We could not submit your KYC because of a problem on our side. Please try again in a few minutes.';
}

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
   Multipart body for the manual-KYC endpoint.
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
  // The documents are already on the server (the draft); the backend takes them from there.
  fd.append('selectedType', businessType === 'COMPANY' ? 'company' : 'individual');
  fd.append('email', email);
  fd.append('phoneNumber', phoneNumber);
  fd.append('billingInfo', JSON.stringify(billing));
  if (businessType === 'COMPANY') fd.append('gstNumber', gstin);
  fd.append('pan', JSON.stringify({ pan: data.pan.number, name: data.pan.name, date: data.pan.date }));
  const { front: _front, back: _back, ...aadhaar } = data.aadhaar;
  void _front; void _back;
  fd.append('aadhaar', JSON.stringify({ ...aadhaar, aadhaarNumber: aadhaar.number }));
  const { proof: _proof, confirmAccountNumber: _confirm, ...bank } = data.bank;
  void _proof; void _confirm;
  fd.append('bankDetails', JSON.stringify(bank));
  return fd;
}

/* ── Draft ── what is saved while the form is being filled, and how it comes back ── */
export function manualDraftSection(data: ManualKycData, step: ManualStep) {
  const { card: _c, ...pan } = data.pan;
  const { front: _f, back: _b, ...aadhaar } = data.aadhaar;
  const { proof: _p, ...bank } = data.bank;
  void _c; void _f; void _b; void _p;
  return { pan, aadhaar, bank, step };
}

export function restoreManualDraft(
  base: ManualKycData,
  manual: { pan?: Partial<ManualPan>; aadhaar?: Partial<ManualAadhaar>; bank?: Partial<ManualBank> },
  documents: Record<string, KycFile>,
): ManualKycData {
  return {
    gstCertificate: documents.gstCertificate ?? base.gstCertificate,
    pan: { ...base.pan, ...manual.pan, card: documents.panCard ?? base.pan.card },
    aadhaar: { ...base.aadhaar, ...manual.aadhaar, front: documents.aadhaarFront ?? base.aadhaar.front, back: documents.aadhaarBack ?? base.aadhaar.back },
    bank: { ...base.bank, ...manual.bank, proof: documents.bankProof ?? base.bank.proof },
  };
}
