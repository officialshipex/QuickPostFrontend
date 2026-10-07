/* Shared KYC class strings — used by both the e-KYC and manual KYC flows. */

export const inputCls = 'w-full h-11 px-4 rounded-full border border-[#E2E8F0] bg-white text-[13px] text-[#0F172A] font-medium focus:outline-none focus:border-[#00A86B] focus:ring-2 focus:ring-[#00A86B]/10 transition-all disabled:bg-[#F8FAFC] disabled:text-[#64748B]';

export const cardShadow = 'shadow-[0_1px_2px_rgba(16,24,40,0.04),0_2px_8px_rgba(16,24,40,0.05)]';

/* ── Validation patterns ── */
export const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
export const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;
export const GSTIN_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
