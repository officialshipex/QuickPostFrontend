import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { apiClient } from '../../services/apiClient';
import { useTableLoader } from '../../hooks/useTableLoader';
import { TableLoader } from '../../components/ui/TableLoader';
import { useToast } from '../../hooks/useToast';
import { Toast } from '../../components/ui/Toast';
import { ShineButton } from '../../components/ui/ShineButton';
import aadhaarLogo from '../../assets/aadhaar-logo.png';
import { FieldLabel } from './kyc/kycUi';
import { cardShadow, GSTIN_RE, inputCls } from './kyc/kycStyles';
import { createManualKycData, type ManualKycData, type ManualStep } from './kyc/manualKycData';
import { DocumentUpload, ManualAadhaarStep, ManualBankStep, ManualPanStep, ManualReviewStep, ManualStepper } from './kyc/ManualKycSteps';
import {
  Check,
  X,
  MapPin,
  FileText,
  CreditCard,
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
  RefreshCcw,
  Building,
  CheckCircle2,
  Clock,
  Copy,
  BadgeCheck,
  Landmark,
  ReceiptText,
  ScanLine,
  User,
  Eye,
  EyeOff,
  Lock,
  Info,
} from 'lucide-react';

/* ── READ-ONLY KYC DATA TYPES ── */
interface AadhaarData { name?: string; aadhaarNumber?: string; sonOf?: string; state?: string; address?: string; city?: string; }
interface PanData { pan?: string; registeredName?: string; panType?: string; panRefId?: string; }
interface BankData { nameAtBank?: string; bank?: string; accountNumber?: string; ifsc?: string; branch?: string; }
interface GstData { gstin?: string; nameOfBusiness?: string; legalNameOfBusiness?: string; address?: string; pincode?: string; city?: string; state?: string; }
interface BillingData { address?: string; city?: string; state?: string; postalCode?: string; }

/* ── READ-ONLY HELPER COMPONENTS ── */
function KycCard({ title, icon: Icon, verified, children }: { title: string; icon: React.ElementType; verified: boolean; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl md:rounded-2xl border border-[#E2E8F0] p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3.5 md:mb-4 gap-2">
        <div className="flex items-center gap-2 md:gap-2.5 min-w-0">
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-[#F0FDF4] flex items-center justify-center shrink-0">
            <Icon className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#00A86B]" />
          </div>
          <h3 className="text-[13px] md:text-sm font-semibold md:font-bold text-[#0F172A] truncate">{title}</h3>
        </div>
        {verified ? (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 md:px-2.5 py-0.5 md:py-1 rounded-full select-none shrink-0">
            <CheckCircle2 className="w-3 h-3" /> Verified
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 md:px-2.5 py-0.5 md:py-1 rounded-full select-none shrink-0">
            <Clock className="w-3 h-3" /> Pending
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 md:gap-y-3.5">{children}</div>
    </div>
  );
}

function KycField({ label, value, wide, onCopy }: { label: string; value?: string | null; wide?: boolean; onCopy?: (v: string) => void }) {
  return (
    <div className={`group/field ${wide ? 'sm:col-span-2' : ''}`}>
      <span className="block text-[9.5px] md:text-[10px] font-semibold md:font-bold text-[#94A3B8] uppercase tracking-wider mb-1">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="text-[12.5px] md:text-[13px] font-semibold text-[#0F172A] break-all">{value || '—'}</span>
        {value && onCopy && (
          <button
            type="button"
            onClick={() => onCopy(value)}
            className="opacity-100 md:opacity-0 md:group-hover/field:opacity-100 transition-opacity shrink-0 text-[#CBD5E1] hover:text-[#00A86B] focus:outline-none"
          >
            <Copy className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}

/* ── BUSINESS TYPE SELECTOR (shared by both flows) — module-level so it keeps
   a stable component identity across renders; when this was a function
   defined inside AdminKYC's body, React saw a brand-new component type on
   every keystroke and remounted the whole subtree, dropping input focus. ── */
const BUSINESS_TYPES = [
  { id: 'INDIVIDUAL' as const, title: 'Individual', description: 'Proprietor or individual seller', icon: User },
  { id: 'COMPANY' as const, title: 'Company', description: 'Registered business with a GSTIN', icon: Building },
];

function BusinessTypeSelector({
  businessType, setBusinessType, disabled, hideLabel,
}: {
  businessType: 'INDIVIDUAL' | 'COMPANY' | null;
  setBusinessType: (t: 'INDIVIDUAL' | 'COMPANY') => void;
  disabled?: boolean;
  hideLabel?: boolean;
}) {
  return (
    <div>
      {!hideLabel && <label className="block text-[16px] font-semibold text-[#0F172A] mb-1.5">Select Business Type</label>}
      <div role="radiogroup" aria-label="Business type" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {BUSINESS_TYPES.map(({ id, title, description, icon: Icon }) => {
          const isSelected = businessType === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={disabled}
              onClick={() => setBusinessType(id)}
              className={`group flex items-center gap-3 text-left rounded-xl border p-3.5 transition-colors ${
                isSelected
                  ? 'border-[#00A86B] bg-[#F0FDF4]/50 ring-1 ring-[#00A86B]'
                  : 'border-[#E2E8F0] bg-white hover:border-[#00A86B]/50'
              } ${disabled ? 'opacity-70 cursor-default' : 'cursor-pointer'}`}
            >
              <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-[#00A86B] text-white' : 'bg-[#F1F5F9] text-[#475569]'}`}>
                <Icon className="w-[18px] h-[18px]" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[13.5px] font-bold text-[#0F172A]">{title}</span>
                <span className="block text-[12px] text-[#64748B] mt-0.5">{description}</span>
              </span>
              <span className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${isSelected ? 'border-[#00A86B]' : 'border-[#CBD5E1] group-hover:border-[#00A86B]'}`}>
                {isSelected && <span className="w-2.5 h-2.5 rounded-full bg-[#00A86B]" />}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── E-KYC SECTION: numbered block inside the single e-KYC card ── */
const REVEAL_EASE = [0.4, 0, 0.2, 1] as const; // Material standard curve

function KycSection({ step, title, description, children, done, show = true }: { step: number; title: string; description?: string; children: React.ReactNode; done?: boolean; show?: boolean }) {
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.section
          id={`kyc-step-${step}`}
          key={`kyc-step-${step}`}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1, transition: { height: { duration: 0.32, ease: REVEAL_EASE }, opacity: { duration: 0.24, delay: 0.1, ease: 'easeOut' } } }}
          exit={{ height: 0, opacity: 0, transition: { height: { duration: 0.22, ease: REVEAL_EASE }, opacity: { duration: 0.12 } } }}
          className="overflow-hidden border-b border-[#F1F5F9] scroll-mt-24"
        >
          <motion.div
            initial={{ y: 6 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.32, delay: 0.06, ease: REVEAL_EASE }}
            className="px-4 md:px-6 py-5 md:py-6"
          >
            <div className="flex items-start gap-3 mb-4">
              <span className={`w-6 h-6 rounded-full text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-px transition-colors duration-300 ${done ? 'bg-[#00A86B]' : 'bg-[#0F172A]'}`}>
                {done ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : step}
              </span>
              <div className="min-w-0">
                <h3 className="text-[14px] md:text-[15px] font-bold text-[#0F172A] leading-6">{title}</h3>
                {description && <p className="text-[12px] text-[#64748B] mt-0.5">{description}</p>}
              </div>
            </div>
            <div className="md:pl-9">{children}</div>
          </motion.div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}

/* ── GSTIN FIELD (company only) ── */
function GstinField({
  gstin, setGstin, isGstinVerified, isGstinLoading, onVerify, disabled,
}: {
  gstin: string;
  setGstin: (v: string) => void;
  isGstinVerified: boolean;
  isGstinLoading: boolean;
  onVerify: () => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <FieldLabel required>GSTIN No.</FieldLabel>
      <div className="relative flex items-center">
        <input
          type="text"
          maxLength={15}
          value={gstin}
          onChange={(e) => setGstin(e.target.value.toUpperCase())}
          disabled={isGstinVerified || disabled}
          placeholder="Enter 15 chars valid GSTIN no."
          className={`${inputCls} pr-24 uppercase`}
        />
        {!isGstinVerified ? (
          <button
            type="button"
            onClick={onVerify}
            disabled={isGstinLoading || gstin.length < 15 || disabled}
            className="absolute right-1.5 h-8 px-3.5 rounded-full bg-[#334155] hover:bg-[#1E293B] text-white text-[11px] font-bold disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center gap-1.5"
          >
            {isGstinLoading ? <RefreshCcw className="w-3 h-3 animate-spin" /> : 'Verify'}
          </button>
        ) : (
          <span className="absolute right-3 flex items-center gap-1 text-[11px] font-bold text-[#00A86B]">
            <Check className="w-3.5 h-3.5" /> Verified
          </span>
        )}
      </div>
    </div>
  );
}

/* ── PAN VERIFICATION MODAL ──
   Bottom-sheet containing a PAN-card-style flip card. Front = enter PAN +
   Verify (calls the existing handleVerifyPan — no new API logic). On success
   the card performs a 3D flip to reveal only the fields the backend actually
   returns (panData.name, panData.panType) plus the PAN number itself — no
   fabricated Father's Name/DOB/photo/signature, since the API doesn't supply
   them and this must never fake verification data. ── */
function PanVerificationModal({
  open, onClose,
  panNumber, setPanNumber,
  isPanVerified, isPanLoading,
  panData,
  onVerify,
  onContinue,
}: {
  open: boolean;
  onClose: () => void;
  panNumber: string; setPanNumber: (v: string) => void;
  isPanVerified: boolean; isPanLoading: boolean;
  panData: { panType: string; name: string };
  onVerify: () => void;
  onContinue?: () => void;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#0B1220]/80 backdrop-blur-md z-[230]"
          />
          <div className="fixed inset-0 z-[231] flex items-center justify-center p-4 pointer-events-none overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 24 }}
              transition={{ type: 'spring', stiffness: 260, damping: 24 }}
              className="w-full max-w-[520px] pointer-events-auto flex flex-col items-center py-6"
            >
              <div className="w-full flex items-center justify-between px-1 mb-6">
                <h3 className="text-[22px] sm:text-[24px] font-extrabold text-white tracking-tight">PAN Verification</h3>
                <button type="button" onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors shrink-0">
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* ── Flip card — physical PAN-card proportions, floating on the backdrop with an ambient glow ── */}
              <div className="relative [perspective:1800px] w-full max-w-[460px]">
                {/* ambient glow behind the card */}
                <div className="absolute -inset-6 rounded-[40px] bg-[#4A85C7]/35 blur-3xl pointer-events-none" />

                <motion.div
                  animate={{ rotateY: isPanVerified ? 180 : 0 }}
                  transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.75, ease: [0.4, 0.0, 0.2, 1] }}
                  className="relative w-full aspect-[1.586/1] [transform-style:preserve-3d]"
                >
                  {/* FRONT — entry state, styled after an actual PAN card */}
                  <div className="absolute inset-0 rounded-[26px] bg-gradient-to-br from-[#7FB3E8] via-[#4A85C7] to-[#254E85] p-5 sm:p-6 flex flex-col overflow-hidden [backface-visibility:hidden] shadow-[0_30px_70px_-20px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.25)] ring-1 ring-white/15">
                    {/* card-stock sheen + corner highlight */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/12 via-transparent to-white/8 pointer-events-none" />
                    <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />

                    <div className="relative flex items-start justify-between">
                      <div className="leading-tight">
                        <p className="text-[13px] sm:text-[14px] font-bold text-white">आयकर विभाग</p>
                        <p className="text-[9px] sm:text-[9.5px] font-semibold text-white/80 tracking-wide">INCOME TAX DEPARTMENT</p>
                      </div>
                      <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/15 border border-white/30 flex items-center justify-center shrink-0 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3)]">
                        <ShieldCheck className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-white" />
                      </span>
                      <div className="leading-tight text-right">
                        <p className="text-[13px] sm:text-[14px] font-bold text-white">भारत सरकार</p>
                        <p className="text-[9px] sm:text-[9.5px] font-semibold text-white/80 tracking-wide">GOVT. OF INDIA</p>
                      </div>
                    </div>

                    <div className="relative flex-1 flex items-center gap-4 sm:gap-5 mt-2">
                      <div className="flex-1 space-y-2.5">
                        <span className="block h-[4px] w-[85%] rounded-full bg-white/35" />
                        <span className="block h-[4px] w-[70%] rounded-full bg-white/35" />
                        <span className="block h-[4px] w-[55%] rounded-full bg-white/25" />
                      </div>
                      <span className="w-12 h-14 sm:w-14 sm:h-16 rounded-lg bg-white/15 border border-white/25 flex items-center justify-center shrink-0 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)]">
                        <User className="w-5 h-5 sm:w-6 sm:h-6 text-white/70" />
                      </span>
                    </div>

                    <p className="relative text-[9.5px] sm:text-[10px] font-medium text-white/70 text-center">Permanent Account Number Card</p>
                  </div>

                  {/* BACK — verified state (only real fields, no fabricated data) */}
                  <div className="absolute inset-0 rounded-[26px] bg-gradient-to-br from-white to-[#F0FDF4] p-5 sm:p-6 flex flex-col overflow-hidden [backface-visibility:hidden] [transform:rotateY(180deg)] shadow-[0_30px_70px_-20px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.6)] ring-1 ring-[#00A86B]/25">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] sm:text-[10.5px] font-bold text-[#64748B] uppercase tracking-wider">Income Tax Department</span>
                      <span className="flex items-center gap-1 text-[10px] sm:text-[10.5px] font-bold text-[#00A86B] uppercase tracking-wider">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                      </span>
                    </div>

                    <div className="flex-1 flex flex-col justify-center gap-2.5 py-2">
                      {isPanVerified && (
                        <>
                          <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4, duration: 0.25 }}>
                            <span className="block text-[9px] font-semibold text-[#94A3B8] uppercase tracking-wider">PAN Number</span>
                            <span className="text-[17px] sm:text-[18px] font-bold text-[#0F172A] tracking-[0.15em]">{panNumber}</span>
                          </motion.div>
                          <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5, duration: 0.25 }}>
                            <span className="block text-[9px] font-semibold text-[#94A3B8] uppercase tracking-wider">Name</span>
                            <span className="text-[15px] font-bold text-[#0F172A]">{panData.name || '—'}</span>
                          </motion.div>
                          <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6, duration: 0.25 }}>
                            <span className="block text-[9px] font-semibold text-[#94A3B8] uppercase tracking-wider">PAN Type</span>
                            <span className="text-[15px] font-bold text-[#0F172A]">{panData.panType || '—'}</span>
                          </motion.div>
                        </>
                      )}
                    </div>

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.7, duration: 0.25 }}
                      className="flex items-center justify-between pt-2.5 border-t border-dashed border-[#DCFCE7]"
                    >
                      <span className="text-[9.5px] text-[#94A3B8] font-medium">QuickPost KYC · Secure Verification</span>
                      <BadgeCheck className="w-4 h-4 text-[#00A86B]" />
                    </motion.div>
                  </div>
                </motion.div>
              </div>

              {/* ── PAN input — inset/pressed field, carved into a soft white surface ── */}
              {!isPanVerified && (
                <div className="w-full max-w-[460px] mt-7 space-y-3">
                  <div
                    className="relative rounded-[16px] px-5 pt-3 pb-3 transition-shadow duration-200 focus-within:shadow-[inset_2px_2px_6px_rgba(15,23,42,0.12),inset_-2px_-2px_5px_rgba(255,255,255,0.9),0_0_0_3px_rgba(0,157,100,0.18),0_0_16px_rgba(0,157,100,0.2)]"
                    style={{
                      background: 'linear-gradient(155deg, #eef1f5 0%, #f7f9fb 45%, #eef1f5 100%)',
                      boxShadow: 'inset 2px 2px 5px rgba(15,23,42,0.1), inset -2px -2px 4px rgba(255,255,255,0.85), 0 1px 0 rgba(255,255,255,0.6)',
                      border: '1px solid rgba(15,23,42,0.06)',
                    }}
                  >
                    <label htmlFor="pan-number-input" className="block text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-0.5">
                      PAN Number
                    </label>
                    <input
                      id="pan-number-input"
                      type="text"
                      maxLength={10}
                      value={panNumber}
                      onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                      disabled={isPanLoading}
                      placeholder="ABCDE1234F"
                      aria-label="PAN number"
                      className="w-full bg-transparent border-0 p-0 tracking-[0.2em] font-bold uppercase text-[17px] text-[#0F172A] placeholder:text-[#CBD5E1] placeholder:tracking-[0.2em] placeholder:font-bold focus:outline-none disabled:opacity-50"
                    />
                  </div>
                  <ShineButton
                    type="button"
                    onClick={onVerify}
                    disabled={isPanLoading || panNumber.length < 10}
                    className="relative w-full h-[52px] rounded-full bg-gradient-to-r from-[#00E08A] to-[#00C97B] hover:from-[#00C97B] hover:to-[#00B36D] disabled:opacity-40 disabled:pointer-events-none text-white text-[14px] font-extrabold shadow-[0_18px_45px_-14px_rgba(0,201,123,0.7)] transition-all overflow-hidden flex items-center justify-center gap-2"
                  >
                    {isPanLoading ? (
                      <>
                        <ScanLine className="w-4 h-4" />
                        Verifying
                        {!prefersReducedMotion && (
                          <motion.span
                            className="absolute inset-y-0 left-0 w-1/3 bg-black/10"
                            animate={{ x: ['-100%', '300%'] }}
                            transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
                          />
                        )}
                      </>
                    ) : (
                      'Verify PAN'
                    )}
                  </ShineButton>
                </div>
              )}

              {isPanVerified && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75, duration: 0.25 }} className="w-full max-w-[460px] mt-6">
                  <button
                    type="button"
                    onClick={onContinue || onClose}
                    className="w-full h-12 rounded-full bg-[#00C97B] hover:bg-[#00B36D] text-[#0B1220] text-[13.5px] font-bold shadow-[0_8px_24px_-8px_rgba(0,201,123,0.6)] transition-colors"
                  >
                    {onContinue ? 'Continue to Aadhaar Verification' : 'Done'}
                  </button>
                </motion.div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

function AadhaarVerificationModal({
  open, onClose,
  aadhaarNumber, setAadhaarNumber,
  isAadhaarVerified,
  sendingAadhaarOtp, aadhaarOtpTimer,
  aadhaarData,
  onSendOtp,
  onContinue,
}: {
  open: boolean;
  onClose: () => void;
  aadhaarNumber: string; setAadhaarNumber: (v: string) => void;
  isAadhaarVerified: boolean;
  sendingAadhaarOtp: boolean; aadhaarOtpTimer: number;
  aadhaarData: { name: string; guardianName: string; address: string; state: string; city: string };
  onSendOtp: () => void;
  onContinue?: () => void;
}) {
  const prefersReducedMotion = useReducedMotion();
  const maskedAadhaar = aadhaarNumber
    ? aadhaarNumber.replace(/\D/g, '').padEnd(12, 'X').replace(/(.{4})(.{4})(.{4})/, '$1 $2 $3')
    : 'XXXX XXXX XXXX';

  // Once verified, the card can be flipped back and forth by clicking it —
  // defaults to showing the back (verified details) right after verification.
  const [showBack, setShowBack] = useState(false);
  useEffect(() => {
    if (isAadhaarVerified) setShowBack(true);
  }, [isAadhaarVerified]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#0B1220]/80 backdrop-blur-md z-[230]"
          />
          <div className="fixed inset-0 z-[231] flex items-center justify-center p-4 pointer-events-none overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 24 }}
              transition={{ type: 'spring', stiffness: 260, damping: 24 }}
              className="w-full max-w-[560px] pointer-events-auto flex flex-col items-center py-6"
            >
              <div className="w-full flex items-center justify-between px-1 mb-6">
                <h3 className="text-[22px] sm:text-[24px] font-extrabold text-white tracking-tight">Aadhaar Verification</h3>
                <button type="button" onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors shrink-0">
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* ── Flip card — Aadhaar card proportions, floating on the backdrop ── */}
              <div className="relative [perspective:1800px] w-full max-w-[500px]">
                <div className="absolute -inset-6 rounded-[40px] bg-[#F4A24A]/30 blur-3xl pointer-events-none" />

                <motion.div
                  animate={{ rotateY: showBack ? 180 : 0 }}
                  transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.75, ease: [0.4, 0.0, 0.2, 1] }}
                  className={`relative w-full aspect-[1.586/1] [transform-style:preserve-3d] ${isAadhaarVerified ? 'cursor-pointer' : ''}`}
                  onClick={() => { if (isAadhaarVerified) setShowBack(v => !v); }}
                  title={isAadhaarVerified ? 'Tap to flip the card' : undefined}
                >
                  {/* FRONT — entry/verified state, styled after an actual Aadhaar card */}
                  <div className="absolute inset-0 rounded-[22px] bg-[#FAFAF9] p-4 sm:p-5 flex flex-col overflow-hidden [backface-visibility:hidden] shadow-[0_30px_70px_-20px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.6)] ring-1 ring-black/5">
                    <div className="flex flex-col items-center text-center">
                      {/* saffron + green hand-painted brush-stroke bands, like a printed ID card header */}
                      <svg viewBox="0 0 220 24" className="w-[62%] max-w-[190px] h-[16px] sm:h-[18px]" preserveAspectRatio="none">
                        <path d="M2 7 C 18 3, 36 8, 55 5 C 78 2, 100 7, 122 4 C 145 1.5, 168 6, 188 3 C 196 2, 202 4, 208 3 L 209 7 C 200 8.5, 190 6, 180 8 C 158 11, 136 6, 113 9 C 90 12, 66 7, 44 10 C 28 12, 14 9, 3 11 Z" fill="#FF9933" />
                        <path d="M4 15 C 20 12, 40 16, 60 13.5 C 82 11, 105 15, 128 12.5 C 150 10.5, 172 14, 192 11.5 C 199 10.7, 204 12, 209 11.3 L 209.5 15 C 201 16.3, 192 14.5, 182 16 C 160 19, 138 15, 115 17.5 C 92 20, 68 16, 46 18.5 C 30 20.3, 16 18, 5 19.5 Z" fill="#138808" />
                      </svg>
                      <p className="text-[11px] sm:text-[12.5px] font-bold text-[#1F2937] mt-1.5 leading-tight">भारत सरकार</p>
                      <p className="text-[10px] sm:text-[11px] font-semibold text-[#334155] leading-tight">Government of India</p>
                    </div>

                    <div className="relative flex-1 flex items-center gap-3 sm:gap-4 mt-2">
                      <span className="w-14 h-16 sm:w-16 sm:h-[72px] rounded-lg bg-[#E5E7EB] border border-black/5 flex items-center justify-center shrink-0 overflow-hidden">
                        <User className="w-6 h-6 sm:w-7 sm:h-7 text-[#9CA3AF]" />
                      </span>
                      {isAadhaarVerified ? (
                        <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }} className="flex-1 min-w-0 space-y-1 text-[#1F2937]">
                          <p className="text-[13px] sm:text-[14.5px] font-bold leading-tight truncate">{aadhaarData.name || '—'}</p>
                          {aadhaarData.guardianName && (
                            <p className="text-[10px] sm:text-[11px] font-medium text-[#334155] truncate">{aadhaarData.guardianName}</p>
                          )}
                        </motion.div>
                      ) : (
                        <div className="flex-1 space-y-2">
                          <span className="block h-[8px] w-[80%] rounded-full bg-[#D1D5DB]" />
                          <span className="block h-[8px] w-[60%] rounded-full bg-[#D1D5DB]" />
                          <span className="block h-[8px] w-[45%] rounded-full bg-[#E5E7EB]" />
                        </div>
                      )}
                      <span className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white border border-[#E2E8F0] p-2 shrink-0 self-center shadow-sm ml-3 sm:ml-4">
                        <img src={aadhaarLogo} alt="Aadhaar" className="w-full h-full object-contain" />
                      </span>
                    </div>

                    <p className="relative text-[15px] sm:text-[17px] font-bold text-[#1F2937] tracking-[0.25em] mt-2 text-center">{maskedAadhaar}</p>
                  </div>

                  {/* BACK — verified state, address only (only real fields, no fabricated data) */}
                  <div className="absolute inset-0 rounded-[22px] bg-[#FAFAF9] p-4 sm:p-5 flex flex-col overflow-hidden [backface-visibility:hidden] [transform:rotateY(180deg)] shadow-[0_30px_70px_-20px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.6)] ring-1 ring-[#00A86B]/25">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] sm:text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Unique Identification Authority of India</span>
                      <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold text-[#00A86B] uppercase tracking-wider shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                      </span>
                    </div>

                    <div className="flex-1 flex gap-3 sm:gap-4 py-2 min-h-0">
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        {isAadhaarVerified && (
                          <motion.div
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3, duration: 0.25 }}
                            className="text-[11px] sm:text-[12px] leading-[1.6] text-[#1F2937]"
                          >
                            <span className="font-bold uppercase tracking-wide text-[9px] text-[#94A3B8] block mb-0.5">Address</span>
                            <span className="block font-semibold line-clamp-4">
                              {aadhaarData.address || '—'}{aadhaarData.city ? `, ${aadhaarData.city}` : ''}{aadhaarData.state ? `, ${aadhaarData.state}` : ''}
                            </span>
                          </motion.div>
                        )}
                      </div>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4, duration: 0.25 }}
                        className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-xl bg-white border border-[#E2E8F0] p-2 shrink-0 self-center shadow-sm"
                      >
                        <img src={aadhaarLogo} alt="Aadhaar" className="w-full h-full object-contain" />
                      </motion.div>
                    </div>

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5, duration: 0.25 }}
                      className="flex items-center justify-between pt-2 border-t border-dashed border-[#E2E8F0]"
                    >
                      <span className="text-[9.5px] text-[#94A3B8] font-medium">QuickPost KYC · Secure Verification</span>
                      <BadgeCheck className="w-4 h-4 text-[#00A86B]" />
                    </motion.div>
                  </div>
                </motion.div>
              </div>

              {/* ── Aadhaar input — inset/pressed field, matches PAN modal styling ── */}
              {!isAadhaarVerified && (
                <div className="w-full max-w-[460px] mt-7 space-y-3">
                  <div
                    className="relative rounded-[16px] px-5 pt-3 pb-3 transition-shadow duration-200 focus-within:shadow-[inset_2px_2px_6px_rgba(15,23,42,0.12),inset_-2px_-2px_5px_rgba(255,255,255,0.9),0_0_0_3px_rgba(0,157,100,0.18),0_0_16px_rgba(0,157,100,0.2)]"
                    style={{
                      background: 'linear-gradient(155deg, #eef1f5 0%, #f7f9fb 45%, #eef1f5 100%)',
                      boxShadow: 'inset 2px 2px 5px rgba(15,23,42,0.1), inset -2px -2px 4px rgba(255,255,255,0.85), 0 1px 0 rgba(255,255,255,0.6)',
                      border: '1px solid rgba(15,23,42,0.06)',
                    }}
                  >
                    <label htmlFor="aadhaar-number-input" className="block text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-0.5">
                      Aadhaar Number
                    </label>
                    <input
                      id="aadhaar-number-input"
                      type="text"
                      maxLength={12}
                      value={aadhaarNumber}
                      onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, ''))}
                      disabled={sendingAadhaarOtp}
                      placeholder="XXXX XXXX XXXX"
                      aria-label="Aadhaar number"
                      className="w-full bg-transparent border-0 p-0 tracking-[0.2em] font-bold text-[17px] text-[#0F172A] placeholder:text-[#CBD5E1] placeholder:tracking-[0.2em] placeholder:font-bold focus:outline-none disabled:opacity-50"
                    />
                  </div>
                  <ShineButton
                    type="button"
                    onClick={onSendOtp}
                    disabled={sendingAadhaarOtp || aadhaarOtpTimer > 0 || aadhaarNumber.length < 12}
                    className="relative w-full h-[52px] rounded-full bg-gradient-to-r from-[#00E08A] to-[#00C97B] hover:from-[#00C97B] hover:to-[#00B36D] disabled:opacity-40 disabled:pointer-events-none text-white text-[14px] font-extrabold shadow-[0_18px_45px_-14px_rgba(0,201,123,0.7)] transition-all overflow-hidden flex items-center justify-center gap-2"
                  >
                    {sendingAadhaarOtp ? (
                      <>
                        <ScanLine className="w-4 h-4" />
                        Sending OTP
                        {!prefersReducedMotion && (
                          <motion.span
                            className="absolute inset-y-0 left-0 w-1/3 bg-black/10"
                            animate={{ x: ['-100%', '300%'] }}
                            transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
                          />
                        )}
                      </>
                    ) : aadhaarOtpTimer > 0 ? (
                      `Resend in ${aadhaarOtpTimer}s`
                    ) : (
                      'Send OTP to Verify'
                    )}
                  </ShineButton>
                </div>
              )}

              {isAadhaarVerified && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75, duration: 0.25 }} className="w-full max-w-[460px] mt-6">
                  <button
                    type="button"
                    onClick={onContinue || onClose}
                    className="w-full h-12 rounded-full bg-[#00C97B] hover:bg-[#00B36D] text-[#0B1220] text-[13.5px] font-bold shadow-[0_8px_24px_-8px_rgba(0,201,123,0.6)] transition-colors"
                  >
                    {onContinue ? 'Continue' : 'Done'}
                  </button>
                </motion.div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ── BANK VERIFICATION PAGE — full page (not a modal), styled like a
   real seller-onboarding "Add bank account" screen (Amazon Seller Central /
   Flipkart Seller Hub / Shiprocket pattern): sticky header with step context,
   a single clean form card, a trust/security strip, sticky footer CTA.
   Same fields as before (no field changes), reusing handleVerifyBank unchanged. ── */
function BankVerificationPage({
  open, onClose,
  accountNumber, setAccountNumber,
  confirmAccountNumber, setConfirmAccountNumber,
  accountNumbersMatch,
  accountHolderName,
  ifscCode, setIfscCode,
  bankName, branchName,
  isBankVerified, isBankLoading,
  onVerify, onContinue,
  isPanVerified, isAadhaarVerified, panName,
}: {
  open: boolean;
  onClose: () => void;
  accountNumber: string; setAccountNumber: (v: string) => void;
  confirmAccountNumber: string; setConfirmAccountNumber: (v: string) => void;
  accountNumbersMatch: boolean;
  accountHolderName: string;
  ifscCode: string; setIfscCode: (v: string) => void;
  bankName: string; branchName: string;
  isBankVerified: boolean; isBankLoading: boolean;
  onVerify: () => void;
  onContinue?: () => void;
  isPanVerified?: boolean; isAadhaarVerified?: boolean; panName?: string;
}) {
  const [showAccount, setShowAccount] = useState(false);
  const ifscValid = /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode);
  const ifscInvalid = ifscCode.length === 11 && !ifscValid;
  const accountLengthOk = accountNumber.length >= 9 && accountNumber.length <= 18;
  const canVerify = accountLengthOk && accountNumbersMatch && ifscValid;

  const steps = [
    { label: 'PAN', done: !!isPanVerified, current: false },
    { label: 'Aadhaar', done: !!isAadhaarVerified, current: false },
    { label: 'Bank Account', done: isBankVerified, current: !isBankVerified },
  ];

  const summaryRow = (label: string, value: React.ReactNode) => (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-[#F1F5F9] last:border-b-0">
      <span className="text-[12.5px] text-[#64748B]">{label}</span>
      <span className="text-[13px] font-semibold text-[#0F172A] text-right min-w-0 break-words">{value}</span>
    </div>
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
          className="fixed inset-0 z-[250] bg-[#F8FAFC] flex flex-col"
        >
          {/* Header — back, title, KYC progress */}
          <div className="bg-white border-b border-[#E2E8F0] shrink-0">
            <div className="max-w-5xl mx-auto px-4 md:px-8 h-16 flex items-center gap-3">
              <button type="button" onClick={onClose} aria-label="Back" className="w-9 h-9 -ml-2 flex items-center justify-center rounded-full hover:bg-[#F1F5F9] text-[#475569] shrink-0">
                <ArrowLeft className="w-[18px] h-[18px]" />
              </button>
              <div className="min-w-0 flex-1">
                <h2 className="text-[15px] md:text-[17px] font-bold text-[#0F172A] leading-tight">Bank Account Details</h2>
                <p className="text-[11.5px] md:text-[12px] text-[#64748B] truncate">Add the account where your COD remittance and payouts will be settled</p>
              </div>
              <ol className="hidden md:flex items-center gap-2 shrink-0" aria-label="KYC progress">
                {steps.map((st, i) => (
                  <li key={st.label} className="flex items-center gap-2">
                    <span className={`flex items-center gap-1.5 text-[12px] font-semibold ${st.done ? 'text-[#00A86B]' : st.current ? 'text-[#0F172A]' : 'text-[#94A3B8]'}`}>
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${st.done ? 'bg-[#00A86B] text-white' : st.current ? 'bg-[#0F172A] text-white' : 'bg-[#E2E8F0] text-[#64748B]'}`}>
                        {st.done ? <Check className="w-3 h-3" strokeWidth={3} /> : i + 1}
                      </span>
                      {st.label}
                    </span>
                    {i < steps.length - 1 && <span className={`w-8 h-px ${st.done ? 'bg-[#00A86B]' : 'bg-[#E2E8F0]'}`} />}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-8 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-5 md:gap-6 items-start">
              {/* Main card */}
              <div className="bg-white rounded-2xl shadow-[0_1px_2px_rgba(16,24,40,0.04),0_2px_8px_rgba(16,24,40,0.05)]">
                <div className="flex items-center gap-3 px-5 md:px-6 py-4 border-b border-[#F1F5F9]">
                  <span className="w-10 h-10 rounded-lg bg-[#F1F5F9] text-[#475569] flex items-center justify-center shrink-0">
                    <Landmark className="w-5 h-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-bold text-[#0F172A]">Settlement Account</p>
                    <p className="text-[12px] text-[#64748B]">{isBankVerified ? 'Verified with your bank' : 'Enter the details exactly as on your cheque book or passbook'}</p>
                  </div>
                  {isBankVerified && (
                    <span className="inline-flex items-center gap-1 h-6 px-2 rounded-md bg-[#F0FDF4] text-[11px] font-bold text-[#00A86B] shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                    </span>
                  )}
                </div>

                <AnimatePresence mode="wait" initial={false}>
                  {!isBankVerified ? (
                    <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="px-5 md:px-6 py-5 md:py-6 space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <FieldLabel required>Account Number</FieldLabel>
                          <div className="relative flex items-center">
                            <input
                              type={showAccount ? 'text' : 'password'}
                              inputMode="numeric"
                              autoComplete="off"
                              maxLength={18}
                              value={accountNumber}
                              onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                              disabled={isBankLoading}
                              placeholder="Enter account number"
                              className={`${inputCls} pr-11 tracking-wide`}
                            />
                            <button type="button" onClick={() => setShowAccount((v) => !v)} aria-label={showAccount ? 'Hide account number' : 'Show account number'} className="absolute right-3 text-[#94A3B8] hover:text-[#475569]">
                              {showAccount ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          {accountNumber && !accountLengthOk && (
                            <p className="text-[11px] text-[#94A3B8] mt-1.5">Account numbers are 9–18 digits</p>
                          )}
                        </div>
                        <div>
                          <FieldLabel required>Confirm Account Number</FieldLabel>
                          <div className="relative flex items-center">
                            <input
                              type="text"
                              inputMode="numeric"
                              autoComplete="off"
                              maxLength={18}
                              value={confirmAccountNumber}
                              onChange={(e) => setConfirmAccountNumber(e.target.value.replace(/\D/g, ''))}
                              onPaste={(e) => e.preventDefault()}
                              disabled={isBankLoading}
                              placeholder="Re-enter account number"
                              className={`${inputCls} pr-11 tracking-wide ${confirmAccountNumber && !accountNumbersMatch ? '!border-red-300 focus:!ring-red-100' : ''}`}
                            />
                            {confirmAccountNumber && accountNumbersMatch && (
                              <Check className="absolute right-3.5 w-4 h-4 text-[#00A86B]" strokeWidth={3} />
                            )}
                          </div>
                          {confirmAccountNumber && !accountNumbersMatch && (
                            <p className="text-[11px] font-medium text-red-500 mt-1.5">Account numbers do not match</p>
                          )}
                        </div>
                        <div>
                          <FieldLabel required>IFSC Code</FieldLabel>
                          <input
                            type="text"
                            maxLength={11}
                            autoComplete="off"
                            value={ifscCode}
                            onChange={(e) => setIfscCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                            disabled={isBankLoading}
                            placeholder="e.g. HDFC0001234"
                            className={`${inputCls} uppercase placeholder:normal-case tracking-wide ${ifscInvalid ? '!border-red-300 focus:!ring-red-100' : ''}`}
                          />
                          <p className={`text-[11px] mt-1.5 ${ifscInvalid ? 'font-medium text-red-500' : 'text-[#94A3B8]'}`}>
                            {ifscInvalid ? 'Enter a valid 11-character IFSC (e.g. HDFC0001234)' : 'Printed on your cheque book and passbook'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5 rounded-xl bg-[#F8FAFC] px-4 py-3">
                        <Info className="w-4 h-4 text-[#64748B] mt-0.5 shrink-0" />
                        <p className="text-[12px] text-[#475569] leading-relaxed">
                          The account holder name must match the name on your PAN{panName ? <> (<span className="font-semibold text-[#0F172A]">{panName}</span>)</> : ''} or your registered business name.
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div key="verified" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }} className="px-5 md:px-6 py-5 md:py-6">
                      <div className="flex items-center gap-3 rounded-xl bg-[#F8FAFC] px-4 py-3.5 mb-2">
                        <span className="w-10 h-10 rounded-full bg-white text-[#0F172A] text-[14px] font-bold flex items-center justify-center shrink-0 shadow-[0_1px_2px_rgba(16,24,40,0.08)]">
                          {(bankName || 'B').trim().charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[14px] font-bold text-[#0F172A] truncate">{bankName || 'Bank account'}</p>
                          <p className="text-[12px] text-[#64748B] truncate">{branchName ? (/branch/i.test(branchName) ? branchName : `${branchName} branch`) : ifscCode}</p>
                        </div>
                        <span className="ml-auto text-[13px] font-semibold text-[#0F172A] tracking-wider shrink-0">•••• {accountNumber.slice(-4)}</span>
                      </div>
                      {summaryRow('Account Holder', accountHolderName || '—')}
                      {summaryRow('Account Number', <span className="tracking-wider">•••• •••• {accountNumber.slice(-4)}</span>)}
                      {summaryRow('IFSC Code', <span className="tracking-wide">{ifscCode}</span>)}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Side panel — account requirements */}
              <aside className="space-y-4">
                <div className="bg-white rounded-2xl shadow-[0_1px_2px_rgba(16,24,40,0.04),0_2px_8px_rgba(16,24,40,0.05)] p-5">
                  <p className="text-[13px] font-bold text-[#0F172A] mb-3">Account requirements</p>
                  <ul className="space-y-2.5">
                    {[
                      'Current or savings account in your name or your business name',
                      'Holder name must match your PAN or GST registration',
                      'Wallets, NRE and loan accounts are not supported',
                    ].map((t) => (
                      <li key={t} className="flex items-start gap-2 text-[12.5px] text-[#475569] leading-snug">
                        <Check className="w-3.5 h-3.5 text-[#00A86B] mt-0.5 shrink-0" strokeWidth={2.75} />
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex items-start gap-2.5 px-1">
                  <Lock className="w-4 h-4 text-[#94A3B8] mt-0.5 shrink-0" />
                  <p className="text-[11.5px] text-[#64748B] leading-relaxed">Your bank details are encrypted and used only for settling your payouts. They are never shared with buyers or third parties.</p>
                </div>
              </aside>
            </div>
          </div>

          {/* Sticky footer */}
          <div className="bg-white border-t border-[#E2E8F0] shrink-0">
            <div className="max-w-5xl mx-auto px-4 md:px-8 py-3.5 md:py-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 h-11 border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC] text-[13px] font-bold rounded-full transition-colors shrink-0"
              >
                Back
              </button>
              {!isBankVerified ? (
                <ShineButton
                  type="button"
                  onClick={onVerify}
                  disabled={isBankLoading || !canVerify}
                  className="min-w-[180px] h-11 px-6 rounded-full bg-[#009D64] hover:bg-[#008856] disabled:opacity-40 disabled:pointer-events-none text-white text-[13px] font-bold shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                  {isBankLoading ? <><RefreshCcw className="w-4 h-4 animate-spin" /> Verifying…</> : 'Verify Bank Account'}
                </ShineButton>
              ) : (
                <ShineButton
                  type="button"
                  onClick={onContinue || onClose}
                  className="min-w-[180px] h-11 px-6 rounded-full bg-[#009D64] hover:bg-[#008856] transition-colors text-white text-[13px] font-bold shadow-sm flex items-center justify-center gap-2"
                >
                  {onContinue ? 'Review & Submit' : 'Done'} <ArrowRight className="w-4 h-4" />
                </ShineButton>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── KYC REVIEW PAGE — full-page (not a modal/drawer), slides up from the
   bottom and covers the screen, showing a read-only summary of every
   verified section. Submit KYC / Close live in a sticky bottom bar. ── */
function KycReviewPage({
  open, onClose,
  businessType,
  email, phoneNumber,
  address, pincode, city, state,
  aadhaarNumber, aadhaarData,
  panNumber, panData,
  gstin, isGstinVerified, gstData,
  accountNumber, ifscCode, accountHolderName, bankName, branchName,
  isSubmitting, onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  businessType: 'INDIVIDUAL' | 'COMPANY' | null;
  email: string; phoneNumber: string;
  address: string; pincode: string; city: string; state: string;
  aadhaarNumber: string; aadhaarData: { name: string; guardianName: string; address: string; state: string; city: string };
  panNumber: string; panData: { panType: string; name: string };
  gstin: string; isGstinVerified: boolean;
  gstData: { gstin?: string; nameOfBusiness?: string; legalNameOfBusiness?: string; address?: string; pincode?: string; city?: string; state?: string };
  accountNumber: string; ifscCode: string; accountHolderName: string; bankName: string; branchName: string;
  isSubmitting: boolean;
  onSubmit: () => void;
}) {
  const maskedAadhaar = aadhaarNumber ? aadhaarNumber.replace(/(.{4})(.{4})(.{4})/, '$1 $2 $3') : '—';
  const maskedAccount = accountNumber ? `•••• •••• ${accountNumber.slice(-4)}` : '—';

  const Row = ({ label, value }: { label: string; value: string }) => (
    <div>
      <span className="block text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">{label}</span>
      <span className="text-[13px] font-bold text-[#0F172A]">{value || '—'}</span>
    </div>
  );

  const SectionCard = ({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) => (
    <div className="bg-white rounded-2xl p-4 md:p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-16px_rgba(15,23,42,0.12)]">
      <div className="flex items-center gap-2.5 mb-4">
        <span className="w-9 h-9 rounded-xl bg-[#F0FDF4] flex items-center justify-center shrink-0">
          <Icon className="w-4.5 h-4.5 text-[#00A86B]" />
        </span>
        <h3 className="text-[14px] font-bold text-[#0F172A]">{title}</h3>
        <span className="ml-auto flex items-center gap-1 text-[10.5px] font-bold text-[#00A86B]">
          <CheckCircle2 className="w-3.5 h-3.5" /> Verified
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">{children}</div>
    </div>
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'tween', ease: [0.22, 1, 0.36, 1], duration: 0.35 }}
          className="fixed inset-0 z-[250] bg-[#F8FAFC] flex flex-col"
        >
          <div className="flex items-center justify-between px-4 md:px-8 h-16 border-b border-[#E2E8F0] bg-white shrink-0">
            <div>
              <h2 className="text-[15px] md:text-[17px] font-bold text-[#0F172A]">Review &amp; Submit KYC</h2>
              <p className="text-[11px] md:text-[12px] text-[#64748B]">Please review your details before submitting.</p>
            </div>
            <button type="button" onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#F1F5F9] text-[#64748B] shrink-0">
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
            <div className="max-w-3xl mx-auto space-y-4">
              <SectionCard icon={User} title="Mandatory Information">
                <Row label="Email" value={email} />
                <Row label="Phone Number" value={phoneNumber} />
              </SectionCard>

              <SectionCard icon={MapPin} title="Billing Information">
                <Row label="Business Type" value={businessType === 'COMPANY' ? 'Company' : 'Individual'} />
                <Row label="Pincode" value={pincode} />
                <Row label="City" value={city} />
                <Row label="State" value={state} />
                <div className="col-span-2 md:col-span-3"><Row label="Address" value={address} /></div>
              </SectionCard>

              <SectionCard icon={CreditCard} title="Aadhaar Details">
                <Row label="Aadhaar Number" value={maskedAadhaar} />
                <Row label="Name" value={aadhaarData.name} />
                <Row label="Guardian Name" value={aadhaarData.guardianName} />
                <div className="col-span-2 md:col-span-3"><Row label="Address" value={[aadhaarData.address, aadhaarData.city, aadhaarData.state].filter(Boolean).join(', ')} /></div>
              </SectionCard>

              <SectionCard icon={FileText} title="PAN Details">
                <Row label="PAN Number" value={panNumber} />
                <Row label="Name" value={panData.name} />
                <Row label="PAN Type" value={panData.panType} />
              </SectionCard>

              {businessType === 'COMPANY' && isGstinVerified && (
                <SectionCard icon={ReceiptText} title="GST Details">
                  <Row label="GSTIN" value={gstData.gstin || gstin} />
                  {gstData.nameOfBusiness && <Row label="Company Name" value={gstData.nameOfBusiness} />}
                  {gstData.pincode && <Row label="Pincode" value={gstData.pincode} />}
                  {gstData.city && <Row label="City" value={gstData.city} />}
                  {gstData.state && <Row label="State" value={gstData.state} />}
                  {gstData.address && <div className="col-span-2 md:col-span-3"><Row label="Company Address" value={gstData.address} /></div>}
                </SectionCard>
              )}

              <SectionCard icon={Landmark} title="Bank Details">
                <Row label="Account Number" value={maskedAccount} />
                <Row label="IFSC Code" value={ifscCode} />
                <Row label="Account Holder Name" value={accountHolderName} />
                <Row label="Bank Name" value={bankName} />
                <Row label="Branch Name" value={branchName} />
              </SectionCard>
            </div>
          </div>

          <div className="sticky bottom-0 bg-white border-t border-[#E2E8F0] px-4 md:px-8 py-4 shrink-0">
            <div className="max-w-3xl mx-auto flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 h-10 border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] text-[13px] font-bold rounded-full transition-colors shrink-0"
              >
                Close
              </button>
              <ShineButton
                type="button"
                onClick={onSubmit}
                disabled={isSubmitting}
                className="h-10 px-7 rounded-full bg-[#009D64] hover:bg-[#008856] transition-colors text-white text-[13px] font-bold shadow-sm disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 shrink-0"
              >
                {isSubmitting ? <><RefreshCcw className="w-3.5 h-3.5 animate-spin" /> Processing...</> : 'Submit KYC'}
              </ShineButton>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── LIVE MODE ───────────────────────────────────────────────────────────────
// Email and phone OTP verification are mandatory, and every KYC apiClient call
// below hits the real API. For offline UI work, flip all three:
//   EMAIL_VERIFICATION_MANDATORY = false, PHONE_VERIFICATION_MANDATORY = false,
//   KYC_USE_MOCK_API = true  (each call then uses its mock branch).
const EMAIL_VERIFICATION_MANDATORY = true;
const PHONE_VERIFICATION_MANDATORY = true;
const KYC_USE_MOCK_API = false;
const mockDelay = (ms = 700) => new Promise((resolve) => setTimeout(resolve, ms));

/* ── KYC METHOD OPTIONS (step 0) — requirements mirror what each flow asks for ── */
const KYC_METHODS: { id: 'EKYC' | 'MANUAL'; title: string; description: string; icon: typeof ScanLine; recommended?: boolean; requirements: string[] }[] = [
  {
    id: 'EKYC',
    title: 'E-KYC',
    description: 'Get KYC verified within a minute',
    icon: ScanLine,
    recommended: true,
    requirements: ['Aadhaar & PAN number', 'GSTIN (if registered)', 'Bank account details'],
  },
  {
    id: 'MANUAL',
    title: 'Manual KYC',
    description: 'KYC verification might take 2-3 business days',
    icon: FileText,
    requirements: ['Aadhaar & PAN card', 'GST certificate (if registered)', 'Cancelled cheque'],
  },
];

/* ── MAIN COMPONENT ── */
export function AdminKYC() {
  const navigate = useNavigate();
  const { toast, showToast, closeToast } = useToast();
  const [copyToast, setCopyToast] = useState(false);
  const copyValue = (v: string) => {
    navigator.clipboard.writeText(v);
    setCopyToast(true);
    setTimeout(() => setCopyToast(false), 1500);
  };

  /* ── KYC STATUS CHECK ── */
  const { isLoading: kycLoading, setIsLoading: setKycLoading } = useTableLoader(0);
  const [kycComplete, setKycComplete] = useState(false);
  const [fetchedAadhaar, setFetchedAadhaar] = useState<AadhaarData>({});
  const [fetchedPan, setFetchedPan] = useState<PanData>({});
  const [fetchedBank, setFetchedBank] = useState<BankData>({});
  const [fetchedGst, setFetchedGst] = useState<GstData>({});
  const [fetchedBilling, setFetchedBilling] = useState<BillingData>({});

  useEffect(() => {
    const fetchAll = async () => {
      // Mock mode: skip the real status/profile fetch entirely and start
      // from a clean, empty flow — there's no backend data to prefill from
      // while disconnected. Real call: apiClient.get('/getKyc/getKycStatus')
      // + apiClient.get('/user/getUserDetails').
      if (KYC_USE_MOCK_API) {
        setKycLoading(false);
        return;
      }
      try {
        const [statusRes, userRes] = await Promise.allSettled([
          apiClient.get('/getKyc/getKycStatus'),
          apiClient.get('/user/getUserDetails'),
        ]);

        const userData = userRes.status === 'fulfilled' ? userRes.value.data?.user : null;
        if (userData?.email) setEmail(userData.email);
        if (userData?.phoneNumber) setPhoneNumber(userData.phoneNumber);
        if (userData?.isEmailVerified) setIsEmailVerified(true);
        if (userData?.isPhoneVerified) setIsPhoneVerified(true);

        const isVerified: boolean = userData?.kycDone === true;
        const companyCategory: string =
          statusRes.status === 'fulfilled' ? (statusRes.value.data?.companyCategory || 'individual') : 'individual';

        setBusinessType(companyCategory === 'company' ? 'COMPANY' : 'INDIVIDUAL');

        if (isVerified) {
          const [aRes, pRes, bRes, gRes, billRes] = await Promise.allSettled([
            apiClient.get('/getKyc/getAadhaar'),
            apiClient.get('/getKyc/getPan'),
            apiClient.get('/getKyc/getBankAccount'),
            apiClient.get('/getKyc/getGST'),
            apiClient.get('/getKyc/getBillingInfo'),
          ]);

          if (aRes.status === 'fulfilled') setFetchedAadhaar(aRes.value.data?.data ?? {});
          if (pRes.status === 'fulfilled') setFetchedPan(pRes.value.data ?? {});
          if (bRes.status === 'fulfilled') setFetchedBank(bRes.value.data ?? {});
          if (gRes.status === 'fulfilled') setFetchedGst(gRes.value.data ?? {});
          if (billRes.status === 'fulfilled') setFetchedBilling(billRes.value.data ?? {});

          setKycComplete(true);
        } else {
          const [gstRes, aRes, pRes, bRes, billRes2] = await Promise.allSettled([
            apiClient.get('/getKyc/getGST'),
            apiClient.get('/getKyc/getAadhaar'),
            apiClient.get('/getKyc/getPan'),
            apiClient.get('/getKyc/getBankAccount'),
            apiClient.get('/getKyc/getBillingInfo'),
          ]);

          const g = gstRes.status === 'fulfilled' ? gstRes.value.data : null;
          if (g?.gstin) {
            setBusinessType('COMPANY');
            setGstin(g.gstin);
            setIsGstinVerified(true);
          }

          const bill = billRes2.status === 'fulfilled' ? billRes2.value.data : null;
          if (bill?.address) {
            setAddress(bill.address || '');
            setPincode(bill.postalCode || '');
            setCity((bill.city || '').toUpperCase());
            setState((bill.state || '').toUpperCase());
          }

          const a = aRes.status === 'fulfilled' ? (aRes.value.data?.data ?? {}) : {};
          if (a?.aadhaarNumber) {
            setAadhaarNumber(a.aadhaarNumber);
            setIsAadhaarVerified(true);
            setAadhaarData({ name: a.name || '', guardianName: a.sonOf || '', address: a.address || '', state: a.state || '', city: a.city || '' });
          }

          const p = pRes.status === 'fulfilled' ? (pRes.value.data ?? {}) : {};
          if (p?.pan) {
            setPanNumber(p.pan);
            setIsPanVerified(true);
            setPanData({ panType: p.panType || '', name: p.registeredName || '' });
          }

          const b = bRes.status === 'fulfilled' ? (bRes.value.data ?? {}) : {};
          if (b?.accountNumber && b?.ifsc) {
            setAccountNumber(b.accountNumber);
            setConfirmAccountNumber(b.accountNumber);
            setIfscCode(b.ifsc);
            setIsBankVerified(true);
            setBankData({ beneficiaryName: b.nameAtBank || '', bankName: b.bank || '', branchName: b.branch || '', city: '' });
          }
        }
      } catch {
        // Network error — fall through to method-choice screen
      } finally {
        setKycLoading(false);
      }
    };
    fetchAll();
  }, []);

  // Mandatory Information — email & phone, verified via OTP
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);

  const [showEmailOtpModal, setShowEmailOtpModal] = useState(false);
  const [emailOtpValues, setEmailOtpValues] = useState(['', '', '', '', '', '']);
  const [emailOtpTimer, setEmailOtpTimer] = useState(0);
  const [loadingEmailOtp, setLoadingEmailOtp] = useState(false);
  const [verifyingEmailOtp, setVerifyingEmailOtp] = useState(false);

  const [showPhoneOtpModal, setShowPhoneOtpModal] = useState(false);
  const [phoneOtpValues, setPhoneOtpValues] = useState(['', '', '', '', '', '']);
  const [phoneOtpTimer, setPhoneOtpTimer] = useState(0);
  const [loadingPhoneOtp, setLoadingPhoneOtp] = useState(false);
  const [verifyingPhoneOtp, setVerifyingPhoneOtp] = useState(false);

  useEffect(() => {
    if (emailOtpTimer <= 0) return;
    const interval = setInterval(() => setEmailOtpTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [emailOtpTimer]);

  useEffect(() => {
    if (phoneOtpTimer <= 0) return;
    const interval = setInterval(() => setPhoneOtpTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [phoneOtpTimer]);

  const sendEmailOtp = async () => {
    if (emailOtpTimer > 0 || loadingEmailOtp || !email || !email.includes('@')) return;
    setLoadingEmailOtp(true);
    try {
      if (KYC_USE_MOCK_API) {
        // Real call: apiClient.post('/auth/send-email-otp', { email })
        await mockDelay(500);
      } else {
        await apiClient.post('/auth/send-email-otp', { email });
      }
      setEmailOtpValues(['', '', '', '', '', '']);
      setEmailOtpTimer(180);
      setShowEmailOtpModal(true);
      if (KYC_USE_MOCK_API) showToast('success', 'Dev mode: use any 6-digit code to verify.');
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoadingEmailOtp(false);
    }
  };

  const verifyEmailOtp = async () => {
    const otp = emailOtpValues.join('');
    if (otp.length !== 6) return;
    setVerifyingEmailOtp(true);
    try {
      if (KYC_USE_MOCK_API) {
        // Real call: apiClient.post('/auth/verify-email-otp', { email, otp })
        await mockDelay(500);
      } else {
        await apiClient.post('/auth/verify-email-otp', { email, otp });
      }
      setIsEmailVerified(true);
      setShowEmailOtpModal(false);
      showToast('success', 'Email verified successfully!');
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'OTP verification failed');
    } finally {
      setVerifyingEmailOtp(false);
    }
  };

  const sendPhoneOtp = async () => {
    if (phoneOtpTimer > 0 || loadingPhoneOtp || phoneNumber.replace(/\D/g, '').length !== 10) return;
    setLoadingPhoneOtp(true);
    try {
      if (KYC_USE_MOCK_API) {
        // Real call: apiClient.post('/auth/send-otp', { phoneNumber })
        await mockDelay(500);
      } else {
        await apiClient.post('/auth/send-otp', { phoneNumber: phoneNumber.replace(/\D/g, '') });
      }
      setPhoneOtpValues(['', '', '', '', '', '']);
      setPhoneOtpTimer(180);
      setShowPhoneOtpModal(true);
      if (KYC_USE_MOCK_API) showToast('success', 'Dev mode: use any 6-digit code to verify.');
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoadingPhoneOtp(false);
    }
  };

  const verifyPhoneOtp = async () => {
    const otp = phoneOtpValues.join('');
    if (otp.length !== 6) return;
    setVerifyingPhoneOtp(true);
    try {
      if (KYC_USE_MOCK_API) {
        // Real call: apiClient.post('/auth/verify-otp', { phoneNumber, otp })
        await mockDelay(500);
      } else {
        await apiClient.post('/auth/verify-otp', { phoneNumber: phoneNumber.replace(/\D/g, ''), otp });
      }
      setIsPhoneVerified(true);
      setShowPhoneOtpModal(false);
      showToast('success', 'Phone verified successfully!');
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'OTP verification failed');
    } finally {
      setVerifyingPhoneOtp(false);
    }
  };

  /* ── FLOW STATE ── */
  const [method, setMethod] = useState<'EKYC' | 'MANUAL' | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<'EKYC' | 'MANUAL' | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showManualSuccess, setShowManualSuccess] = useState(false);
  const [manualStep, setManualStep] = useState<ManualStep>('details');
  const [manualData, setManualData] = useState<ManualKycData>(createManualKycData);
  const [isManualSubmitting, setIsManualSubmitting] = useState(false);
  const goToManualStep = (next: ManualStep) => {
    setManualStep(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  // E-KYC page 1 shows only Business Type + Billing/GST; the rest of the flow
  // (PAN -> Aadhaar -> GST [company only] -> Bank) opens as a chain of
  // centered modals, ending in the full-page KycReviewPage below.
  const [isPanModalOpen, setIsPanModalOpen] = useState(false);
  const [isAadhaarModalOpen, setIsAadhaarModalOpen] = useState(false);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [isReviewPageOpen, setIsReviewPageOpen] = useState(false);

  const [businessType, setBusinessType] = useState<'INDIVIDUAL' | 'COMPANY' | null>(null);
  const [gstin, setGstin] = useState('');
  const [isGstinVerified, setIsGstinVerified] = useState(false);
  const [isGstinLoading, setIsGstinLoading] = useState(false);
  const [gstData, setGstData] = useState<GstData>({});

  // Billing Information (individual only) — address + pincode, city/state auto-filled
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  useEffect(() => {
    if (pincode.length !== 6) { setCity(''); setState(''); return; }
    fetch(`https://api.postalpincode.in/pincode/${pincode}`)
      .then(r => r.json())
      .then(data => {
        const po = data?.[0]?.PostOffice?.[0];
        if (po) {
          setCity((po.District || po.Name || '').toUpperCase());
          setState((po.State || '').toUpperCase());
        }
      })
      .catch(() => {});
  }, [pincode]);

  // Aadhaar
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [isAadhaarVerified, setIsAadhaarVerified] = useState(false);
  const [aadhaarData, setAadhaarData] = useState({ name: '', guardianName: '', address: '', state: '', city: '' });
  const [sendingAadhaarOtp, setSendingAadhaarOtp] = useState(false);
  const [verifyingAadhaarOtp, setVerifyingAadhaarOtp] = useState(false);
  const [aadhaarRefId, setAadhaarRefId] = useState('');
  const [aadhaarOtpTimer, setAadhaarOtpTimer] = useState(0);
  const [isAadhaarOtpModalOpen, setIsAadhaarOtpModalOpen] = useState(false);
  const [aadhaarOtpValues, setAadhaarOtpValues] = useState(['', '', '', '', '', '']);

  // PAN
  const [panNumber, setPanNumber] = useState('');
  const [isPanVerified, setIsPanVerified] = useState(false);
  const [isPanLoading, setIsPanLoading] = useState(false);
  const [panData, setPanData] = useState({ panType: '', name: '' });

  // Bank
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [isBankVerified, setIsBankVerified] = useState(false);
  const [isBankLoading, setIsBankLoading] = useState(false);
  const [bankData, setBankData] = useState({ beneficiaryName: '', bankName: '', branchName: '', city: '' });

  useEffect(() => {
    if (bankData.bankName) setBankName(bankData.bankName);
    if (bankData.branchName) setBranchName(bankData.branchName);
    if (bankData.beneficiaryName) setAccountHolderName(bankData.beneficiaryName);
  }, [bankData]);

  const accountNumbersMatch = accountNumber.length > 0 && accountNumber === confirmAccountNumber;

  const handleVerifyPan = async () => {
    if (!panNumber || panNumber.length < 10) return;
    setIsPanLoading(true);
    try {
      if (KYC_USE_MOCK_API) {
        // Real call: apiClient.post('/merchant/verfication/pan', { pan: panNumber })
        await mockDelay(900);
        setIsPanVerified(true);
        setPanData({ panType: 'Individual', name: 'Test User (Dev Mode)' });
        showToast('success', 'PAN verified successfully! (mock)');
        return;
      }
      const res = await apiClient.post('/merchant/verfication/pan', { pan: panNumber });
      if (res.data?.success) {
        const d = res.data.data || {};
        setIsPanVerified(true);
        setPanData({ panType: d.panType || '', name: d.nameProvided || d.name || '' });
        showToast('success', 'PAN verified successfully!');
      } else {
        showToast('error', res.data?.message || 'PAN verification failed');
      }
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'PAN verification failed');
    } finally {
      setIsPanLoading(false);
    }
  };

  useEffect(() => {
    if (aadhaarOtpTimer <= 0) return;
    const interval = setInterval(() => setAadhaarOtpTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [aadhaarOtpTimer]);

  const sendAadhaarOtpAndOpen = async () => {
    if (!aadhaarNumber || aadhaarNumber.length < 12 || aadhaarOtpTimer > 0 || sendingAadhaarOtp) return;
    setSendingAadhaarOtp(true);
    try {
      if (KYC_USE_MOCK_API) {
        // Real call: apiClient.post('/merchant/verfication/generate-otp', { aadhaarNo: aadhaarNumber })
        await mockDelay(600);
        setAadhaarRefId('mock-ref-id');
        setAadhaarOtpValues(['', '', '', '', '', '']);
        setAadhaarOtpTimer(180);
        setIsAadhaarOtpModalOpen(true);
        showToast('success', 'Dev mode: use any 6-digit code to verify.');
        return;
      }
      const res = await apiClient.post('/merchant/verfication/generate-otp', { aadhaarNo: aadhaarNumber });
      if (res.data?.data?.ref_id) {
        setAadhaarRefId(res.data.data.ref_id);
        setAadhaarOtpValues(['', '', '', '', '', '']);
        setAadhaarOtpTimer(180);
        setIsAadhaarOtpModalOpen(true);
        showToast('success', res.data?.message || 'OTP sent to your Aadhaar-linked mobile');
      } else {
        showToast('error', res.data?.message || 'Failed to send OTP');
      }
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Failed to send OTP');
    } finally {
      setSendingAadhaarOtp(false);
    }
  };

  const closeAadhaarOtpModal = () => {
    setIsAadhaarOtpModalOpen(false);
    setAadhaarOtpValues(['', '', '', '', '', '']);
  };

  const handleVerifyAadhaarOtp = async () => {
    const otp = aadhaarOtpValues.join('');
    if (otp.length < 6) return;
    setVerifyingAadhaarOtp(true);
    try {
      if (KYC_USE_MOCK_API) {
        // Real call: apiClient.post('/merchant/verfication/verify-otp', { otp, aadhaarNo, refId })
        await mockDelay(900);
        setIsAadhaarVerified(true);
        setAadhaarData({
          name: 'Test User (Dev Mode)',
          guardianName: 'Dev Guardian',
          address: '123 Mock Street, Sample Layout',
          state: 'KARNATAKA',
          city: 'BENGALURU',
        });
        showToast('success', 'Aadhaar verified successfully! (mock)');
        closeAadhaarOtpModal();
        return;
      }
      const res = await apiClient.post('/merchant/verfication/verify-otp', { otp, aadhaarNo: aadhaarNumber, refId: aadhaarRefId });
      if (res.data?.success) {
        const d = res.data.data || {};
        setIsAadhaarVerified(true);
        setAadhaarData({ name: d.name || '', guardianName: d.sonOf || '', address: d.address || '', state: d.state || '', city: d.city || '' });
        showToast('success', 'Aadhaar verified successfully!');
        closeAadhaarOtpModal();
      } else {
        showToast('error', res.data?.message || 'OTP verification failed');
      }
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'OTP verification failed');
    } finally {
      setVerifyingAadhaarOtp(false);
    }
  };

  const handleVerifyBank = async () => {
    if (!accountNumber || !ifscCode || ifscCode.length < 11) return;
    if (!accountNumbersMatch) {
      showToast('error', 'Account numbers do not match');
      return;
    }
    setIsBankLoading(true);
    try {
      if (KYC_USE_MOCK_API) {
        // Real call: apiClient.post('/merchant/verfication/bank-account', { accountNo, ifsc })
        await mockDelay(900);
        setIsBankVerified(true);
        setBankData({ beneficiaryName: 'Test User (Dev Mode)', bankName: 'Mock Bank of India', branchName: 'Dev Branch', city: 'BENGALURU' });
        showToast('success', 'Bank account verified successfully! (mock)');
        return;
      }
      const res = await apiClient.post('/merchant/verfication/bank-account', { accountNo: accountNumber, ifsc: ifscCode });
      if (res.data?.success) {
        const d = res.data.data || {};
        setIsBankVerified(true);
        setBankData({ beneficiaryName: d.nameAtBank || '', bankName: d.bank || '', branchName: d.branch || '', city: d.city || '' });
        showToast('success', 'Bank account verified successfully!');
      } else {
        showToast('error', res.data?.message || 'Bank verification failed');
      }
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Bank verification failed');
    } finally {
      setIsBankLoading(false);
    }
  };

  const handleVerifyGstin = async () => {
    if (!gstin || gstin.length < 15) return;
    setIsGstinLoading(true);
    try {
      if (KYC_USE_MOCK_API) {
        // Real call: apiClient.post('/merchant/verfication/gstin', { GSTIN: gstin })
        await mockDelay(900);
        setIsGstinVerified(true);
        setGstData({
          gstin,
          nameOfBusiness: 'Test Enterprises (Dev Mode)',
          legalNameOfBusiness: 'Test Enterprises Private Limited',
          address: '221B, Business Park Road',
          pincode: '560001',
          city: 'BENGALURU',
          state: 'KARNATAKA',
        });
        showToast('success', 'GST verified successfully! (mock)');
        return;
      }
      const res = await apiClient.post('/merchant/verfication/gstin', { GSTIN: gstin });
      if (res.data?.success) {
        setIsGstinVerified(true);
        setGstData(res.data.data || {});
        showToast('success', 'GST verified successfully!');
      } else {
        showToast('error', res.data?.message || 'GST verification failed');
      }
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'GST verification failed');
    } finally {
      setIsGstinLoading(false);
    }
  };

  const handleKycSubmit = async () => {
    if ((EMAIL_VERIFICATION_MANDATORY && !isEmailVerified) || (PHONE_VERIFICATION_MANDATORY && !isPhoneVerified)) return;
    if (!isAadhaarVerified || !isPanVerified || !isBankVerified) return;
    if (businessType === 'COMPANY' && !isGstinVerified) return;
    if (businessType === 'INDIVIDUAL' && (!address || !pincode || !city || !state)) return;
    setIsSubmitting(true);
    try {
      const payload = {
        selectedType: businessType === 'COMPANY' ? 'company' : 'individual',
        documentDetails: {
          aadharNo: aadhaarNumber,
          pan: panNumber,
          panName: panData.name,
        },
        gstNumber: businessType === 'COMPANY' ? (gstin || null) : null,
        billingInfo: businessType === 'INDIVIDUAL' ? { address, pincode, city, state } : null,
        bankDetails: {
          ifsc: ifscCode,
          accountNumber: accountNumber,
        },
        isVerified: true,
      };
      if (KYC_USE_MOCK_API) {
        // Real call: apiClient.post('/merchant/verfication/kyc', { payload })
        await mockDelay(1000);
      } else {
        await apiClient.post('/merchant/verfication/kyc', { payload });
      }
      setIsSubmitted(true);
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'KYC submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualSubmit = async () => {
    if (isManualSubmitting) return;
    setIsManualSubmitting(true);
    try {
      // Real call (endpoint pending on backend):
      //   apiClient.post('/merchant/verfication/manual-kyc', buildManualKycFormData({ data: manualData, businessType, email, phoneNumber, billing: { address, pincode, city, state }, gstin }),
      //     { headers: { 'Content-Type': 'multipart/form-data' } })
      // Until that endpoint exists, manual KYC behaves as before: the request is
      // acknowledged in the UI and the verification team follows up.
      if (KYC_USE_MOCK_API) await mockDelay(900);
      setShowManualSuccess(true);
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showToast('error', message || 'Could not submit your KYC. Please try again.');
    } finally {
      setIsManualSubmitting(false);
    }
  };

  /* ── E-KYC PROGRESSIVE REVEAL ── sections open one at a time as the
     previous one is completed; once opened they stay open (no jumping). */
  const ekycStepDone = {
    1: businessType === 'INDIVIDUAL' || businessType === 'COMPANY',
    2: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())
      && (!EMAIL_VERIFICATION_MANDATORY || isEmailVerified)
      && phoneNumber.replace(/\D/g, '').length === 10
      && (!PHONE_VERIFICATION_MANDATORY || isPhoneVerified),
    3: !!(address.trim() && pincode.length === 6 && city && state),
    4: isGstinVerified,
  };
  const ekycTargetStep = !ekycStepDone[1] ? 1 : !ekycStepDone[2] ? 2 : !ekycStepDone[3] ? 3 : 4;
  const [ekycRevealedStep, setEkycRevealedStep] = useState(1);

  useEffect(() => {
    if (!method || ekycTargetStep <= ekycRevealedStep) return;
    // Short pause so a section doesn't pop open mid-keystroke.
    const t = setTimeout(() => {
      const jump = ekycTargetStep - ekycRevealedStep;
      setEkycRevealedStep(ekycTargetStep);
      if (jump === 1) {
        setTimeout(() => {
          document.getElementById(`kyc-step-${ekycTargetStep}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 120);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [method, ekycTargetStep, ekycRevealedStep]);

  /* ── LOADING ── */
  if (kycLoading) {
    return (
      <AdminLayout>
        <div className="max-w-4xl mx-auto px-4 md:px-0 pb-16">
          <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
            <div className="relative w-24 h-24 md:w-32 md:h-32">
              <TableLoader />
            </div>
            <p className="text-[13px] md:text-sm font-bold text-[#0F172A] text-center">Checking your KYC status</p>
            <p className="text-[11px] md:text-xs text-[#94A3B8] text-center px-6">Just a moment while we securely fetch your verification details…</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  /* ── READ-ONLY VIEW ── */
  if (kycComplete) {
    const isVerifiedG = !!fetchedGst?.gstin;
    return (
      <AdminLayout>
        <div className="max-w-5xl mx-auto px-4 md:px-0 pb-16">
          <div className="mb-4 md:mb-6 bg-[#F0FDF4] border border-emerald-200 rounded-xl md:rounded-2xl p-3.5 md:p-4 flex items-center gap-3 shadow-sm">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white flex items-center justify-center shrink-0 text-[#00A86B] shadow-sm">
              <ShieldCheck className="w-4.5 h-4.5 md:w-5 md:h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-[13px] md:text-sm font-bold text-[#0F172A]">KYC Verification Complete</h2>
              <p className="text-[11px] md:text-xs text-[#64748B] mt-0.5 leading-snug">All your documents have been successfully verified — this information is now read-only.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 md:gap-4">
            <KycCard title="Aadhaar Details" icon={CreditCard} verified={!!fetchedAadhaar?.aadhaarNumber}>
              <KycField label="Name" value={fetchedAadhaar?.name} wide onCopy={copyValue} />
              <KycField label="Aadhaar Number" value={fetchedAadhaar?.aadhaarNumber} onCopy={copyValue} />
              <KycField label="Guardian Name" value={fetchedAadhaar?.sonOf} />
              <KycField label="State" value={fetchedAadhaar?.state} />
              <KycField label="Address" value={fetchedAadhaar?.address} wide />
            </KycCard>

            <KycCard title="PAN Details" icon={FileText} verified={!!fetchedPan?.pan}>
              <KycField label="PAN Number" value={fetchedPan?.pan} onCopy={copyValue} />
              <KycField label="PAN Type" value={fetchedPan?.panType} />
              <KycField label="Registered Name" value={fetchedPan?.registeredName} wide />
              <KycField label="PAN Ref ID" value={fetchedPan?.panRefId} wide />
            </KycCard>

            <KycCard title="Bank Account Details" icon={Landmark} verified={!!(fetchedBank?.accountNumber && fetchedBank?.ifsc)}>
              <KycField label="Name at Bank" value={fetchedBank?.nameAtBank} wide />
              <KycField label="Bank" value={fetchedBank?.bank} />
              <KycField label="Branch" value={fetchedBank?.branch} />
              <KycField label="Account Number" value={fetchedBank?.accountNumber} onCopy={copyValue} />
              <KycField label="IFSC" value={fetchedBank?.ifsc} onCopy={copyValue} />
            </KycCard>

            <KycCard title={isVerifiedG ? 'GST Details' : 'Billing Details'} icon={isVerifiedG ? ReceiptText : MapPin} verified={!!(fetchedBilling?.address || isVerifiedG)}>
              {isVerifiedG ? (
                <>
                  <KycField label="GSTIN" value={fetchedGst?.gstin} onCopy={copyValue} />
                  <KycField label="Pincode" value={fetchedGst?.pincode} />
                  <KycField label="Business Name" value={fetchedGst?.nameOfBusiness} wide />
                  <KycField label="Legal Name" value={fetchedGst?.legalNameOfBusiness} wide />
                  <KycField label="Address" value={fetchedGst?.address} wide />
                  <KycField label="City" value={fetchedGst?.city} />
                  <KycField label="State" value={fetchedGst?.state} />
                </>
              ) : (
                <>
                  <KycField label="Address" value={fetchedBilling?.address} wide />
                  <KycField label="City" value={fetchedBilling?.city} />
                  <KycField label="State" value={fetchedBilling?.state} />
                  <KycField label="Postal Code" value={fetchedBilling?.postalCode} />
                </>
              )}
            </KycCard>
          </div>
        </div>

        <AnimatePresence>
          {copyToast && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed bottom-6 right-6 z-[300] bg-[#0F172A] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399]" /> Copied to clipboard
            </motion.div>
          )}
        </AnimatePresence>
      </AdminLayout>
    );
  }

  /* ── SUBMITTED (E-KYC under review) ── */
  if (isSubmitted) {
    return (
      <AdminLayout>
        <div className="max-w-4xl mx-auto px-4 md:px-0 text-[#0F172A] pb-16">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', duration: 0.5 }} className="relative bg-white rounded-xl md:rounded-2xl border border-[#E2E8F0] p-5 md:p-12 shadow-sm text-center space-y-4 md:space-y-6 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#00A86B] via-[#34D399] to-[#00A86B]" />
            <div className="absolute -top-20 -left-20 w-56 h-56 rounded-full bg-[#00A86B]/[0.04] blur-2xl" />
            <div className="absolute -bottom-20 -right-20 w-56 h-56 rounded-full bg-[#34D399]/[0.05] blur-2xl" />

            <div className="relative w-18 h-18 md:w-24 md:h-24 mx-auto flex items-center justify-center">
              <motion.div className="absolute inset-0 rounded-full border-2 border-[#00A86B]/25" animate={{ scale: [1, 1.5, 1.5], opacity: [0.7, 0, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }} />
              <motion.div className="absolute inset-0 rounded-full border-2 border-[#00A86B]/25" animate={{ scale: [1, 1.5, 1.5], opacity: [0.7, 0, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 0.6 }} />
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 15, delay: 0.15 }} className="relative w-15 h-15 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-[#00A86B] to-[#00c982] flex items-center justify-center shadow-lg shadow-[#00A86B]/30">
                <Check className="w-8 h-8 md:w-10 md:h-10 text-white" strokeWidth={3} />
              </motion.div>
            </div>

            <div className="relative space-y-1.5 md:space-y-2">
              <h2 className="text-base md:text-xl font-bold text-[#0F172A] px-2">KYC Verification Under Review</h2>
              <p className="text-[11.5px] md:text-xs text-[#64748B] max-w-md mx-auto leading-relaxed px-1">Your Aadhaar, PAN Card, and Bank details have been successfully received. Our verification team is reviewing them. Usually, accounts are validated in less than 2 hours.</p>
            </div>

            <div className="relative bg-gradient-to-b from-[#F8FAFC] to-white border border-[#E2E8F0]/60 rounded-xl md:rounded-2xl p-3.5 md:p-4 max-w-sm mx-auto text-left space-y-1">
              {[
                { label: 'Aadhaar KYC Status', value: 'SUCCESS' },
                { label: 'PAN KYC Status', value: 'SUCCESS' },
                { label: 'Bank Account Status', value: 'VERIFIED' },
              ].map((row, i) => (
                <motion.div key={row.label} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.1 }} className="flex justify-between items-center text-[10.5px] md:text-[11px] font-bold text-[#64748B] py-1.5">
                  <span>{row.label}</span>
                  <span className="flex items-center gap-1 text-[#00A86B]"><CheckCircle2 className="w-3.5 h-3.5" /> {row.value}</span>
                </motion.div>
              ))}
            </div>

            <button onClick={() => navigate('/user/dashboard')} className="relative w-full md:w-auto h-11 md:h-10 px-6 rounded-xl bg-[#00A86B] hover:bg-[#009B63] text-white text-[13px] md:text-xs font-bold transition-colors shadow-sm cursor-pointer inline-flex items-center justify-center gap-1.5 focus:outline-none">
              Back to Dashboard <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        </div>
      </AdminLayout>
    );
  }

  /* ── STEP 0: METHOD CHOICE ── */
  if (!method) {
    return (
      <AdminLayout>
        <div className="mx-2 text-[#0F172A] pb-16">
          <h1 className="text-lg md:text-xl font-bold text-[#0F172A] mb-4 md:mb-6">KYC</h1>

          <div className="bg-white rounded-xl md:rounded-2xl shadow-[0_1px_2px_rgba(16,24,40,0.04),0_2px_8px_rgba(16,24,40,0.05)]">
            <div className="px-4 md:px-6 py-4 md:py-5 border-b border-[#F1F5F9]">
              <h2 className="text-[15px] md:text-base font-bold text-[#0F172A]">Complete Your KYC</h2>
              <p className="text-[12px] md:text-[13px] text-[#64748B] mt-1">Choose your preferred method to verify your identity and unlock full access</p>
            </div>

            <div role="radiogroup" aria-label="KYC method" className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {KYC_METHODS.map((m) => {
                const isSelected = selectedMethod === m.id;
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setSelectedMethod(m.id)}
                    className={`group text-left rounded-xl border p-4 md:p-5 transition-colors ${
                      isSelected
                        ? 'border-[#00A86B] bg-[#F0FDF4]/50 ring-1 ring-[#00A86B]'
                        : 'border-[#E2E8F0] bg-white hover:border-[#00A86B]/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-[#00A86B] text-white' : 'bg-[#F1F5F9] text-[#475569]'}`}>
                        <Icon className="w-5 h-5" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[14px] font-bold text-[#0F172A]">{m.title}</span>
                          {m.recommended && (
                            <span className="text-[10px] font-bold uppercase tracking-wide text-[#00A86B] bg-[#E6F7F0] px-1.5 py-0.5 rounded">Recommended</span>
                          )}
                        </div>
                        <p className="text-[12.5px] text-[#64748B] mt-0.5">{m.description}</p>
                      </div>
                      <span className={`mt-0.5 w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${isSelected ? 'border-[#00A86B]' : 'border-[#CBD5E1] group-hover:border-[#00A86B]'}`}>
                        {isSelected && <span className="w-2.5 h-2.5 rounded-full bg-[#00A86B]" />}
                      </span>
                    </div>

                    <div className="mt-4 pt-3.5 border-t border-[#EEF2F6]">
                      <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wide mb-2">You'll need</p>
                      <ul className="space-y-1.5">
                        {m.requirements.map((r) => (
                          <li key={r} className="flex items-center gap-2 text-[12.5px] text-[#475569]">
                            <Check className="w-3.5 h-3.5 text-[#00A86B] shrink-0" strokeWidth={2.75} />
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="px-4 md:px-6 py-3.5 md:py-4 border-t border-[#F1F5F9] flex items-center justify-end">
              <ShineButton
                type="button"
                onClick={() => selectedMethod && setMethod(selectedMethod)}
                disabled={!selectedMethod}
                className="h-11 px-6 rounded-full bg-[#009D64] hover:bg-[#008856] transition-colors text-white text-[13px] font-bold shadow-sm disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-1.5"
              >
                Next <ArrowRight className="w-4 h-4" />
              </ShineButton>
            </div>
          </div>
        </div>
        <Toast toast={toast} onClose={closeToast} />
      </AdminLayout>
    );
  }

  /* Sections 1–3 (business type, mandatory info, billing) — shared by e-KYC and manual KYC */
  const detailSections = (
    <>
              <KycSection step={1} title="Business Type" description="Select how your business is registered" done={ekycStepDone[1]}>
                <BusinessTypeSelector businessType={businessType} setBusinessType={setBusinessType} disabled={isGstinVerified} hideLabel />
              </KycSection>

              <KycSection step={2} title="Mandatory Information" description="Used for account alerts and KYC communication" done={ekycStepDone[2]} show={ekycRevealedStep >= 2}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <FieldLabel required>Email</FieldLabel>
                        <div className="relative flex items-center">
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => !isEmailVerified && setEmail(e.target.value)}
                            disabled={isEmailVerified}
                            placeholder="Enter your email"
                            className={`${inputCls} pr-28`}
                          />
                          {!isEmailVerified ? (
                            <button
                              type="button"
                              onClick={sendEmailOtp}
                              disabled={loadingEmailOtp || emailOtpTimer > 0 || !email || !email.includes('@')}
                              className="absolute right-1.5 h-8 px-3.5 rounded-full bg-[#334155] hover:bg-[#1E293B] text-white text-[11px] font-bold disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center gap-1.5"
                            >
                              {loadingEmailOtp ? <RefreshCcw className="w-3 h-3 animate-spin" /> : emailOtpTimer > 0 ? `Resend in ${emailOtpTimer}s` : 'Send OTP'}
                            </button>
                          ) : (
                            <span className="absolute right-3 flex items-center gap-1 text-[11px] font-bold text-[#00A86B]">
                              <Check className="w-3.5 h-3.5" /> Verified
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <FieldLabel required>Phone Number</FieldLabel>
                        <div className="relative flex items-center">
                          <span className="absolute left-4 text-[13px] font-semibold text-[#64748B] pointer-events-none">+91</span>
                          <input
                            type="tel"
                            maxLength={10}
                            value={phoneNumber}
                            onChange={(e) => !isPhoneVerified && setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                            disabled={isPhoneVerified}
                            placeholder="Enter 10-digit mobile number"
                            className={`${inputCls} pl-12 pr-28`}
                          />
                          {!isPhoneVerified ? (
                            <button
                              type="button"
                              onClick={sendPhoneOtp}
                              disabled={loadingPhoneOtp || phoneOtpTimer > 0 || phoneNumber.replace(/\D/g, '').length !== 10}
                              className="absolute right-1.5 h-8 px-3.5 rounded-full bg-[#334155] hover:bg-[#1E293B] text-white text-[11px] font-bold disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center gap-1.5"
                            >
                              {loadingPhoneOtp ? <RefreshCcw className="w-3 h-3 animate-spin" /> : phoneOtpTimer > 0 ? `Resend in ${phoneOtpTimer}s` : 'Send OTP'}
                            </button>
                          ) : (
                            <span className="absolute right-3 flex items-center gap-1 text-[11px] font-bold text-[#00A86B]">
                              <Check className="w-3.5 h-3.5" /> Verified
                            </span>
                          )}
                        </div>
                      </div>
                </div>
              </KycSection>

              <KycSection step={3} title="Billing Information" description="Printed on your invoices" done={ekycStepDone[3]} show={ekycRevealedStep >= 3}>
                <div className="space-y-4">
                  <div>
                    <FieldLabel required>Address</FieldLabel>
                    <textarea
                      rows={2}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="House / building, street, area"
                      className={`${inputCls} !rounded-2xl h-auto py-3 resize-none`}
                    />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="col-span-2 sm:col-span-1">
                      <FieldLabel required>Pincode</FieldLabel>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                        placeholder="6-digit pincode"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <FieldLabel>City</FieldLabel>
                      <input type="text" value={city} readOnly tabIndex={-1} placeholder="Auto-filled" className={`${inputCls} uppercase placeholder:normal-case !bg-[#F8FAFC] !text-[#475569] cursor-default`} />
                    </div>
                    <div>
                      <FieldLabel>State</FieldLabel>
                      <input type="text" value={state} readOnly tabIndex={-1} placeholder="Auto-filled" className={`${inputCls} uppercase placeholder:normal-case !bg-[#F8FAFC] !text-[#475569] cursor-default`} />
                    </div>
                  </div>
                  <p className="text-[11.5px] text-[#94A3B8]">City and state are fetched from your pincode.</p>
                </div>
              </KycSection>
    </>
  );

  /* ── E-KYC FLOW ── */
  if (method === 'EKYC') {
    const emailOk = !EMAIL_VERIFICATION_MANDATORY || isEmailVerified;
    const phoneOk = !PHONE_VERIFICATION_MANDATORY || isPhoneVerified;
    const billingReady = (businessType === 'COMPANY' || businessType === 'INDIVIDUAL')
      && emailOk && phoneOk
      && !!(address && pincode && city && state)
      && (businessType !== 'COMPANY' || isGstinVerified);

    return (
      <AdminLayout>
        <div className="mx-2 text-[#0F172A] pb-16">
          <h1 className="text-lg md:text-xl font-bold text-[#0F172A] mb-4 md:mb-6">KYC</h1>

          <div className="max-w-3xl mx-auto bg-white rounded-xl md:rounded-2xl shadow-[0_1px_2px_rgba(16,24,40,0.04),0_2px_8px_rgba(16,24,40,0.05)]">
            {/* Header */}
            <div className="px-4 md:px-6 py-4 md:py-5 border-b border-[#F1F5F9] flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-[16px] md:text-[18px] font-bold text-[#0F172A]">e-KYC</h2>
                <p className="text-[12px] md:text-[13px] text-[#64748B] mt-0.5">Get KYC verified within a minute</p>
              </div>
              <button type="button" onClick={() => { setMethod(null); setEkycRevealedStep(1); }} className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#64748B] hover:text-[#0F172A] px-3 h-8 rounded-lg hover:bg-[#F8FAFC] transition-colors shrink-0">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
            </div>

            {detailSections}

            <KycSection step={4} title="GST Details" description="Required for registered businesses" done={ekycStepDone[4]} show={businessType === 'COMPANY' && ekycRevealedStep >= 4}>
                <div className="space-y-3">
                  <div className="sm:max-w-[420px]">
                    <GstinField gstin={gstin} setGstin={setGstin} isGstinVerified={isGstinVerified} isGstinLoading={isGstinLoading} onVerify={handleVerifyGstin} />
                  </div>
                  {isGstinVerified && (gstData.nameOfBusiness || gstData.legalNameOfBusiness || gstData.address) && (
                    <div className="rounded-xl bg-[#F8FAFC] p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(gstData.nameOfBusiness || gstData.legalNameOfBusiness) && (
                        <div className="sm:col-span-2">
                          <span className="block text-[11px] font-semibold text-[#94A3B8] mb-0.5">Business Name</span>
                          <span className="text-[13px] font-semibold text-[#0F172A]">{gstData.nameOfBusiness || gstData.legalNameOfBusiness}</span>
                        </div>
                      )}
                      {gstData.address && (
                        <div className="sm:col-span-2">
                          <span className="block text-[11px] font-semibold text-[#94A3B8] mb-0.5">Registered Address</span>
                          <span className="text-[13px] text-[#0F172A]">{[gstData.address, gstData.city, gstData.state, gstData.pincode].filter(Boolean).join(', ')}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
            </KycSection>

            {/* Footer — next step + Continue (PAN → Aadhaar → Bank → Review) */}
            <div className="px-4 md:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wide">Next step</p>
                <p className="text-[13px] font-semibold text-[#0F172A] mt-0.5">Identity &amp; Bank Verification</p>
                <p className="text-[12px] text-[#64748B]">Aadhaar, PAN and bank details — verified in one quick step.</p>
              </div>
              <ShineButton
                type="button"
                onClick={() => {
                  const allVerified = emailOk && phoneOk && isAadhaarVerified && isPanVerified && isBankVerified && (businessType !== 'COMPANY' || isGstinVerified);
                  if (allVerified) setIsReviewPageOpen(true);
                  else if (!isPanVerified) setIsPanModalOpen(true);
                  else if (!isAadhaarVerified) setIsAadhaarModalOpen(true);
                  else if (!isBankVerified) setIsBankModalOpen(true);
                  else setIsReviewPageOpen(true);
                }}
                disabled={!billingReady}
                className="h-11 px-6 rounded-full bg-[#009D64] hover:bg-[#008856] transition-colors text-white text-[13px] font-bold shadow-sm disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-1.5 shrink-0"
              >
                {emailOk && phoneOk && isAadhaarVerified && isPanVerified && isBankVerified && (businessType !== 'COMPANY' || isGstinVerified) ? 'Review & Submit' : 'Continue'} <ArrowRight className="w-4 h-4" />
              </ShineButton>
            </div>
          </div>
        </div>

        {/* Aadhaar OTP modal — premium, Aadhaar-branded, sits above the Aadhaar card modal */}
        <AnimatePresence>
          {isAadhaarOtpModalOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeAadhaarOtpModal} className="fixed inset-0 bg-[#0B1220]/80 backdrop-blur-md z-[240]" />
              <div className="fixed inset-0 flex items-center justify-center z-[241] p-4 pointer-events-none">
                <motion.div initial={{ opacity: 0, scale: 0.94, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 24 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }} className="w-full max-w-[400px] bg-white rounded-[28px] shadow-[0_40px_90px_-24px_rgba(0,0,0,0.55)] relative pointer-events-auto border border-black/5 text-center overflow-hidden">
                  {/* ── Header strip — Aadhaar brand identity ── */}
                  <div className="relative px-7 pt-7 pb-6 bg-gradient-to-b from-[#FFF8F0] to-white overflow-hidden">
                    <div className="absolute -top-16 -right-14 w-44 h-44 rounded-full bg-[#F4A24A]/20 blur-3xl pointer-events-none" />
                    <div className="absolute -top-10 -left-14 w-36 h-36 rounded-full bg-[#E11D48]/10 blur-3xl pointer-events-none" />

                    <button type="button" onClick={closeAadhaarOtpModal} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-white text-[#64748B] shadow-sm ring-1 ring-black/5 transition-colors cursor-pointer focus:outline-none">
                      <X className="w-4 h-4" />
                    </button>

                    <motion.div
                      initial={{ scale: 0.6, opacity: 0, y: -8 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.1 }}
                      className="relative w-20 h-20 rounded-[22px] bg-white flex items-center justify-center mx-auto mb-5 shadow-[0_14px_32px_-10px_rgba(225,29,72,0.3)] ring-1 ring-black/5"
                    >
                      <img src={aadhaarLogo} alt="Aadhaar" className="w-14 h-14 object-contain" />
                    </motion.div>

                    <h2 className="text-[18px] font-extrabold text-[#0F172A] mb-1 tracking-tight">Verify Aadhaar OTP</h2>
                    <p className="text-[12.5px] text-[#64748B] leading-relaxed px-3">
                      Enter the 6-digit OTP sent to the mobile number linked with
                      {aadhaarNumber ? (
                        <span className="font-bold text-[#0F172A]"> {aadhaarNumber.replace(/(.{4})(.{4})(.{4})/, '$1 $2 $3')}</span>
                      ) : ' your Aadhaar'}
                    </p>
                  </div>

                  {/* ── Body ── */}
                  <div className="px-7 pb-7 pt-1">
                    <div className="flex justify-center gap-2 mb-6">
                      {aadhaarOtpValues.map((value, idx) => (
                        <input
                          key={idx}
                          type="tel"
                          maxLength={1}
                          inputMode="numeric"
                          value={value}
                          onChange={(e) => {
                            const v = e.target.value.replace(/\D/, '');
                            const next = [...aadhaarOtpValues]; next[idx] = v; setAadhaarOtpValues(next);
                            if (v && idx < 5) (document.getElementById(`aotp-${idx + 1}`) as HTMLInputElement)?.focus();
                          }}
                          onKeyDown={(e) => { if (e.key === 'Backspace' && !value && idx > 0) (document.getElementById(`aotp-${idx - 1}`) as HTMLInputElement)?.focus(); }}
                          id={`aotp-${idx}`}
                          className={`w-10 h-12 md:w-11 md:h-12 rounded-[14px] text-center text-lg font-extrabold text-[#0F172A] focus:outline-none transition-all duration-200 ${value ? 'bg-[#FFF1F2] ring-2 ring-[#E11D48]/50' : 'bg-[#F8FAFC] ring-1 ring-[#E2E8F0]'} focus:ring-2 focus:ring-[#E11D48]/60`}
                          style={value ? { boxShadow: 'inset 0 1px 2px rgba(225,29,72,0.08)' } : { boxShadow: 'inset 1px 1px 3px rgba(15,23,42,0.06)' }}
                        />
                      ))}
                    </div>

                    <ShineButton
                      type="button"
                      onClick={handleVerifyAadhaarOtp}
                      disabled={verifyingAadhaarOtp || aadhaarOtpValues.join('').length !== 6}
                      className="w-full h-12 rounded-full bg-[#009D64] hover:bg-[#008856] text-white text-[13.5px] font-extrabold shadow-[0_16px_36px_-12px_rgba(0,157,100,0.45)] disabled:opacity-40 disabled:pointer-events-none mb-4 transition-all flex items-center justify-center gap-2"
                    >
                      {verifyingAadhaarOtp ? <><RefreshCcw className="w-3.5 h-3.5 animate-spin" /> Verifying...</> : 'Verify OTP'}
                    </ShineButton>

                    <div className="flex items-center justify-center gap-1.5 text-[11.5px] text-[#94A3B8]">
                      {aadhaarOtpTimer > 0 ? (
                        <span>Resend OTP in <span className="font-bold text-[#334155]">{aadhaarOtpTimer}s</span></span>
                      ) : (
                        <span className="text-[#E11D48] cursor-pointer font-bold hover:underline" onClick={sendAadhaarOtpAndOpen}>Resend OTP</span>
                      )}
                    </div>

                    <div className="flex items-center justify-center gap-1.5 mt-4 pt-4 border-t border-dashed border-[#E2E8F0] text-[10.5px] text-[#94A3B8] font-medium">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#00A86B]" /> Secured by UIDAI · QuickPost KYC
                    </div>
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>

        {/* Email OTP modal */}
        <AnimatePresence>
          {showEmailOtpModal && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowEmailOtpModal(false)} className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm z-[200]" />
              <div className="fixed inset-0 flex items-center justify-center z-[201] p-4 pointer-events-none">
                <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', duration: 0.5 }} className="w-full max-w-[380px] bg-white rounded-2xl shadow-2xl p-6 relative pointer-events-auto border border-[#E2E8F0] text-center">
                  <button type="button" onClick={() => setShowEmailOtpModal(false)} className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-[#F8FAFC] transition-colors border border-[#E2E8F0] cursor-pointer focus:outline-none">
                    <X className="w-4 h-4 text-[#64748B]" />
                  </button>
                  <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.1 }} className="w-16 h-16 rounded-2xl bg-[#F0FDF4] flex items-center justify-center mx-auto mt-3 mb-4">
                    <ShieldCheck className="w-7 h-7 text-[#00A86B]" />
                  </motion.div>
                  <h2 className="text-base font-bold text-[#0F172A] mb-1.5">Verify Email OTP</h2>
                  <p className="text-[13px] text-[#64748B] leading-relaxed mb-5">OTP sent to <span className="font-semibold text-[#334155]">{email}</span></p>

                  <div className="flex justify-center gap-2 mb-5">
                    {emailOtpValues.map((value, idx) => (
                      <input
                        key={idx}
                        type="tel"
                        maxLength={1}
                        inputMode="numeric"
                        value={value}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/, '');
                          const next = [...emailOtpValues]; next[idx] = v; setEmailOtpValues(next);
                          if (v && idx < 5) (document.getElementById(`eotp-${idx + 1}`) as HTMLInputElement)?.focus();
                        }}
                        onKeyDown={(e) => { if (e.key === 'Backspace' && !value && idx > 0) (document.getElementById(`eotp-${idx - 1}`) as HTMLInputElement)?.focus(); }}
                        id={`eotp-${idx}`}
                        className={`w-10 h-11 md:w-11 md:h-11 rounded-xl border text-center text-base md:text-lg font-bold text-[#00A86B] focus:outline-none focus:border-[#00A86B] focus:ring-2 focus:ring-[#00A86B]/15 transition-all ${value ? 'border-[#00A86B]/40 bg-[#F0FDF4]/40' : 'border-[#E2E8F0]'}`}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={verifyEmailOtp}
                    disabled={verifyingEmailOtp || emailOtpValues.join('').length !== 6}
                    className="w-full h-11 rounded-xl bg-[#00A86B] hover:bg-[#009B63] text-white text-[13px] font-bold shadow-sm disabled:opacity-50 disabled:pointer-events-none mb-3 cursor-pointer transition-all"
                  >
                    {verifyingEmailOtp ? <span className="flex items-center justify-center gap-2"><RefreshCcw className="w-3.5 h-3.5 animate-spin" /> Verifying...</span> : 'Verify OTP'}
                  </button>
                  <p className="text-xs text-[#94A3B8]">
                    {emailOtpTimer > 0 ? `Resend in ${emailOtpTimer}s` : <span className="text-[#00A86B] cursor-pointer font-bold hover:underline" onClick={sendEmailOtp}>Resend OTP</span>}
                  </p>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>

        {/* Phone OTP modal */}
        <AnimatePresence>
          {showPhoneOtpModal && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPhoneOtpModal(false)} className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm z-[200]" />
              <div className="fixed inset-0 flex items-center justify-center z-[201] p-4 pointer-events-none">
                <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', duration: 0.5 }} className="w-full max-w-[380px] bg-white rounded-2xl shadow-2xl p-6 relative pointer-events-auto border border-[#E2E8F0] text-center">
                  <button type="button" onClick={() => setShowPhoneOtpModal(false)} className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-[#F8FAFC] transition-colors border border-[#E2E8F0] cursor-pointer focus:outline-none">
                    <X className="w-4 h-4 text-[#64748B]" />
                  </button>
                  <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.1 }} className="w-16 h-16 rounded-2xl bg-[#F0FDF4] flex items-center justify-center mx-auto mt-3 mb-4">
                    <ShieldCheck className="w-7 h-7 text-[#00A86B]" />
                  </motion.div>
                  <h2 className="text-base font-bold text-[#0F172A] mb-1.5">Verify Phone OTP</h2>
                  <p className="text-[13px] text-[#64748B] leading-relaxed mb-5">OTP sent to <span className="font-semibold text-[#334155]">+91 {phoneNumber}</span></p>

                  <div className="flex justify-center gap-2 mb-5">
                    {phoneOtpValues.map((value, idx) => (
                      <input
                        key={idx}
                        type="tel"
                        maxLength={1}
                        inputMode="numeric"
                        value={value}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/, '');
                          const next = [...phoneOtpValues]; next[idx] = v; setPhoneOtpValues(next);
                          if (v && idx < 5) (document.getElementById(`potp-${idx + 1}`) as HTMLInputElement)?.focus();
                        }}
                        onKeyDown={(e) => { if (e.key === 'Backspace' && !value && idx > 0) (document.getElementById(`potp-${idx - 1}`) as HTMLInputElement)?.focus(); }}
                        id={`potp-${idx}`}
                        className={`w-10 h-11 md:w-11 md:h-11 rounded-xl border text-center text-base md:text-lg font-bold text-[#00A86B] focus:outline-none focus:border-[#00A86B] focus:ring-2 focus:ring-[#00A86B]/15 transition-all ${value ? 'border-[#00A86B]/40 bg-[#F0FDF4]/40' : 'border-[#E2E8F0]'}`}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={verifyPhoneOtp}
                    disabled={verifyingPhoneOtp || phoneOtpValues.join('').length !== 6}
                    className="w-full h-11 rounded-xl bg-[#00A86B] hover:bg-[#009B63] text-white text-[13px] font-bold shadow-sm disabled:opacity-50 disabled:pointer-events-none mb-3 cursor-pointer transition-all"
                  >
                    {verifyingPhoneOtp ? <span className="flex items-center justify-center gap-2"><RefreshCcw className="w-3.5 h-3.5 animate-spin" /> Verifying...</span> : 'Verify OTP'}
                  </button>
                  <p className="text-xs text-[#94A3B8]">
                    {phoneOtpTimer > 0 ? `Resend in ${phoneOtpTimer}s` : <span className="text-[#00A86B] cursor-pointer font-bold hover:underline" onClick={sendPhoneOtp}>Resend OTP</span>}
                  </p>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>

        <PanVerificationModal
          open={isPanModalOpen}
          onClose={() => setIsPanModalOpen(false)}
          panNumber={panNumber}
          setPanNumber={setPanNumber}
          isPanVerified={isPanVerified}
          isPanLoading={isPanLoading}
          panData={panData}
          onVerify={handleVerifyPan}
          onContinue={!isAadhaarVerified ? () => { setIsPanModalOpen(false); setIsAadhaarModalOpen(true); } : undefined}
        />

        <AadhaarVerificationModal
          open={isAadhaarModalOpen}
          onClose={() => setIsAadhaarModalOpen(false)}
          aadhaarNumber={aadhaarNumber}
          setAadhaarNumber={setAadhaarNumber}
          isAadhaarVerified={isAadhaarVerified}
          sendingAadhaarOtp={sendingAadhaarOtp}
          aadhaarOtpTimer={aadhaarOtpTimer}
          aadhaarData={aadhaarData}
          onSendOtp={sendAadhaarOtpAndOpen}
          onContinue={!isBankVerified ? () => { setIsAadhaarModalOpen(false); setIsBankModalOpen(true); } : undefined}
        />


        <BankVerificationPage
          open={isBankModalOpen}
          onClose={() => setIsBankModalOpen(false)}
          accountNumber={accountNumber}
          setAccountNumber={setAccountNumber}
          confirmAccountNumber={confirmAccountNumber}
          setConfirmAccountNumber={setConfirmAccountNumber}
          accountNumbersMatch={accountNumbersMatch}
          accountHolderName={accountHolderName}
          ifscCode={ifscCode}
          setIfscCode={setIfscCode}
          bankName={bankName}
          branchName={branchName}
          isBankVerified={isBankVerified}
          isBankLoading={isBankLoading}
          onVerify={handleVerifyBank}
          onContinue={() => { setIsBankModalOpen(false); setIsReviewPageOpen(true); }}
          isPanVerified={isPanVerified}
          isAadhaarVerified={isAadhaarVerified}
          panName={panData.name}
        />

        <KycReviewPage
          open={isReviewPageOpen}
          onClose={() => setIsReviewPageOpen(false)}
          businessType={businessType}
          email={email}
          phoneNumber={phoneNumber}
          address={address}
          pincode={pincode}
          city={city}
          state={state}
          aadhaarNumber={aadhaarNumber}
          aadhaarData={aadhaarData}
          panNumber={panNumber}
          panData={panData}
          gstin={gstin}
          isGstinVerified={isGstinVerified}
          gstData={gstData}
          accountNumber={accountNumber}
          ifscCode={ifscCode}
          accountHolderName={accountHolderName}
          bankName={bankName}
          branchName={branchName}
          isSubmitting={isSubmitting}
          onSubmit={handleKycSubmit}
        />

        <Toast toast={toast} onClose={closeToast} />
      </AdminLayout>
    );
  }

  /* ── MANUAL KYC FLOW ── page-wise: Business Details → PAN → Aadhaar → Bank → Review */
  const manualGstinInvalid = gstin.length === 15 && !GSTIN_RE.test(gstin);
  const manualDetailsReady = ekycStepDone[1] && ekycStepDone[2] && ekycStepDone[3]
    && (businessType !== 'COMPANY' || (GSTIN_RE.test(gstin) && !!manualData.gstCertificate));
  const leaveManual = () => { setMethod(null); setEkycRevealedStep(1); goToManualStep('details'); };

  return (
    <AdminLayout>
      <div className="mx-2 text-[#0F172A] pb-16">
        <h1 className="text-lg md:text-xl font-bold text-[#0F172A] mb-4 md:mb-6">KYC</h1>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={manualStep}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
          >
            {manualStep === 'details' && (
              <div className="max-w-5xl mx-auto">
                <ManualStepper current="details" />
                <div className={`bg-white rounded-xl md:rounded-2xl ${cardShadow}`}>
                  <div className="px-4 md:px-6 py-4 md:py-5 border-b border-[#F1F5F9] flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-[16px] md:text-[18px] font-bold text-[#0F172A]">Manual KYC</h2>
                      <p className="text-[12px] md:text-[13px] text-[#64748B] mt-0.5">Verification might take 2-3 business days</p>
                    </div>
                    <button type="button" onClick={leaveManual} className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#64748B] hover:text-[#0F172A] px-3 h-8 rounded-lg hover:bg-[#F8FAFC] transition-colors shrink-0">
                      <ArrowLeft className="w-3.5 h-3.5" /> Back
                    </button>
                  </div>

                  {detailSections}

                  <KycSection step={4} title="GST Details" description="Required for registered businesses" done={GSTIN_RE.test(gstin) && !!manualData.gstCertificate} show={businessType === 'COMPANY' && ekycRevealedStep >= 4}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <FieldLabel required>GSTIN No.</FieldLabel>
                        <input type="text" maxLength={15} value={gstin} onChange={(e) => setGstin(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} placeholder="15-character GSTIN" className={`${inputCls} uppercase placeholder:normal-case tracking-wide ${manualGstinInvalid ? '!border-red-300' : ''}`} />
                        {manualGstinInvalid && <p className="text-[11px] font-medium text-red-500 mt-1.5">Enter a valid GSTIN (e.g. 27AAPFU0939F1ZV)</p>}
                      </div>
                      <DocumentUpload label="GST Registration Certificate" value={manualData.gstCertificate} onChange={(gstCertificate) => setManualData((d) => ({ ...d, gstCertificate }))} onError={(m) => showToast('error', m)} />
                    </div>
                  </KycSection>

                  <div className="px-4 md:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wide">Next step</p>
                      <p className="text-[13px] font-semibold text-[#0F172A] mt-0.5">PAN, Aadhaar &amp; Bank Details</p>
                      <p className="text-[12px] text-[#64748B]">Enter the details and upload the supporting documents.</p>
                    </div>
                    <ShineButton
                      type="button"
                      onClick={() => goToManualStep('pan')}
                      disabled={!manualDetailsReady}
                      className="h-11 px-6 rounded-full bg-[#009D64] hover:bg-[#008856] transition-colors text-white text-[13px] font-bold shadow-sm disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-1.5 shrink-0"
                    >
                      Continue <ArrowRight className="w-4 h-4" />
                    </ShineButton>
                  </div>
                </div>
              </div>
            )}

            {manualStep === 'pan' && (
              <ManualPanStep
                value={manualData.pan}
                onChange={(patch) => setManualData((d) => ({ ...d, pan: { ...d.pan, ...patch } }))}
                businessType={businessType === 'COMPANY' ? 'COMPANY' : 'INDIVIDUAL'}
                onBack={() => goToManualStep('details')}
                onNext={() => goToManualStep('aadhaar')}
                onError={(m) => showToast('error', m)}
              />
            )}

            {manualStep === 'aadhaar' && (
              <ManualAadhaarStep
                value={manualData.aadhaar}
                onChange={(patch) => setManualData((d) => ({ ...d, aadhaar: { ...d.aadhaar, ...patch } }))}
                onBack={() => goToManualStep('pan')}
                onNext={() => goToManualStep('bank')}
                onError={(m) => showToast('error', m)}
              />
            )}

            {manualStep === 'bank' && (
              <ManualBankStep
                value={manualData.bank}
                onChange={(patch) => setManualData((d) => ({ ...d, bank: { ...d.bank, ...patch } }))}
                panName={manualData.pan.name}
                onBack={() => goToManualStep('aadhaar')}
                onNext={() => goToManualStep('review')}
                onError={(m) => showToast('error', m)}
              />
            )}

            {manualStep === 'review' && (
              <ManualReviewStep
                data={manualData}
                businessType={businessType === 'COMPANY' ? 'COMPANY' : 'INDIVIDUAL'}
                email={email}
                phoneNumber={phoneNumber}
                billing={{ address, pincode, city, state }}
                gstin={gstin}
                goTo={goToManualStep}
                onBack={() => goToManualStep('bank')}
                onSubmit={handleManualSubmit}
                submitting={isManualSubmitting}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Manual KYC success popup */}
      <AnimatePresence>
        {showManualSuccess && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setShowManualSuccess(false); navigate('/user/dashboard'); }} className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm z-[200]" />
            <div className="fixed inset-0 flex items-center justify-center z-[201] p-4 pointer-events-none">
              <motion.div initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 12 }} transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }} className={`w-full max-w-[400px] bg-white rounded-2xl ${cardShadow} p-6 pointer-events-auto text-center`}>
                <div className="w-14 h-14 rounded-full bg-[#F0FDF4] flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-7 h-7 text-[#00A86B]" />
                </div>
                <h2 className="text-[16px] font-bold text-[#0F172A] mb-1.5">KYC Submitted for Verification</h2>
                <p className="text-[13px] text-[#64748B] leading-relaxed mb-5">Our team will review your details and documents within 2–3 business days. You'll be notified by email and SMS once your KYC is verified.</p>
                <button
                  type="button"
                  onClick={() => { setShowManualSuccess(false); navigate('/user/dashboard'); }}
                  className="w-full h-11 rounded-full bg-[#009D64] hover:bg-[#008856] text-white text-[13px] font-bold shadow-sm transition-colors"
                >
                  Back to Dashboard
                </button>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
      <Toast toast={toast} onClose={closeToast} />
    </AdminLayout>
  );
}
