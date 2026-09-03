import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { apiClient } from '../../services/apiClient';
import { useTableLoader } from '../../hooks/useTableLoader';
import { TableLoader } from '../../components/ui/TableLoader';
import { useToast } from '../../hooks/useToast';
import { Toast } from '../../components/ui/Toast';
import { ShineButton } from '../../components/ui/ShineButton';
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

/* ── FORM PANEL: consistent white card with header ── */
function Panel({ title, right, children, className = '' }: { title: React.ReactNode; right?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl md:rounded-2xl border border-[#E2E8F0] p-4 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-4 gap-2">
        <h3 className="text-[14px] md:text-[15px] font-bold text-[#0F172A]">{title}</h3>
        {right}
      </div>
      {children}
    </div>
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-[12px] md:text-[13px] font-semibold text-[#0F172A] mb-1.5">
      {children} {required && <span className="text-red-500">*</span>}
    </label>
  );
}

const inputCls = 'w-full h-11 px-4 rounded-full border border-[#E2E8F0] bg-white text-[13px] text-[#0F172A] font-medium focus:outline-none focus:border-[#00A86B] focus:ring-2 focus:ring-[#00A86B]/10 transition-all disabled:bg-[#F8FAFC] disabled:text-[#64748B]';

/* ── BUSINESS TYPE SELECTOR (shared by both flows) — module-level so it keeps
   a stable component identity across renders; when this was a function
   defined inside AdminKYC's body, React saw a brand-new component type on
   every keystroke and remounted the whole subtree, dropping input focus. ── */
function BusinessTypeSelector({
  businessType, setBusinessType, disabled,
}: {
  businessType: 'INDIVIDUAL' | 'COMPANY' | null;
  setBusinessType: (t: 'INDIVIDUAL' | 'COMPANY') => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-[16px] font-semibold text-[#0F172A] mb-1.5">Select Business Type</label>
      <div className="grid grid-cols-2 gap-2.5 max-w-sm">
        {(['INDIVIDUAL', 'COMPANY'] as const).map((t) => (
          <button
            key={t}
            type="button"
            disabled={disabled}
            onClick={() => setBusinessType(t)}
            className={`flex items-center gap-2 h-11 px-4 rounded-full border-2 transition-all text-left ${
              businessType === t
                ? 'border-[#00A86B] bg-[#F0FDF4] text-[#00A86B]'
                : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#0F172A] hover:border-[#CBD5E1]'
            } ${disabled ? 'opacity-70 cursor-default' : 'cursor-pointer'}`}
          >
            <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${businessType === t ? 'border-[#00A86B]' : 'border-[#CBD5E1]'}`}>
              {businessType === t && <span className="w-2 h-2 rounded-full bg-[#00A86B]" />}
            </span>
            <span className="text-[13px] font-bold">{t === 'INDIVIDUAL' ? 'Individual' : 'Company'}</span>
          </button>
        ))}
      </div>
    </div>
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

/* ── BANK DETAILS PANEL (shared) — Account Number + IFSC verify inline,
   matching the PAN/GSTIN pattern (no separate "Save" button, no Bank Type
   selector — neither existed in the original flow). ── */
function BankDetailsPanel({
  accountNumber, setAccountNumber,
  confirmAccountNumber, setConfirmAccountNumber,
  accountNumbersMatch,
  accountHolderName, setAccountHolderName,
  ifscCode, setIfscCode,
  bankName, setBankName,
  branchName, setBranchName,
  isBankVerified, isBankLoading,
  onVerify,
}: {
  accountNumber: string; setAccountNumber: (v: string) => void;
  confirmAccountNumber: string; setConfirmAccountNumber: (v: string) => void;
  accountNumbersMatch: boolean;
  accountHolderName: string; setAccountHolderName: (v: string) => void;
  ifscCode: string; setIfscCode: (v: string) => void;
  bankName: string; setBankName: (v: string) => void;
  branchName: string; setBranchName: (v: string) => void;
  isBankVerified: boolean; isBankLoading: boolean;
  onVerify: () => void;
}) {
  const canVerify = !!accountNumber && ifscCode.length === 11 && accountNumbersMatch;
  return (
    <Panel title="Bank Details">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <FieldLabel required>Account Number</FieldLabel>
          <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))} disabled={isBankVerified} placeholder="Enter account number" className={inputCls} />
        </div>
        <div>
          <FieldLabel required>Confirm Acc. Number</FieldLabel>
          <input type="text" value={confirmAccountNumber} onChange={(e) => setConfirmAccountNumber(e.target.value.replace(/\D/g, ''))} disabled={isBankVerified} placeholder="Re-enter account number" className={`${inputCls} ${confirmAccountNumber && !accountNumbersMatch ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : ''}`} />
          {confirmAccountNumber && !accountNumbersMatch && (
            <p className="text-[10.5px] font-semibold text-red-500 mt-1">Account numbers do not match</p>
          )}
        </div>
        <div>
          <FieldLabel required>Account Holder Name</FieldLabel>
          <input type="text" value={accountHolderName} onChange={(e) => setAccountHolderName(e.target.value)} disabled={isBankVerified} placeholder="Enter account holder name" className={inputCls} />
        </div>
        <div>
          <FieldLabel required>IFSC Code</FieldLabel>
          <div className="relative flex items-center">
            <input
              type="text"
              maxLength={11}
              value={ifscCode}
              onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
              disabled={isBankVerified}
              placeholder="Enter IFSC code"
              className={`${inputCls} pr-20 uppercase`}
            />
            {!isBankVerified ? (
              <button
                type="button"
                onClick={onVerify}
                disabled={isBankLoading || !canVerify}
                className="absolute right-1.5 h-8 px-3.5 rounded-full bg-[#334155] hover:bg-[#1E293B] text-white text-[11px] font-bold disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center gap-1.5"
              >
                {isBankLoading ? <RefreshCcw className="w-3 h-3 animate-spin" /> : 'Verify'}
              </button>
            ) : (
              <span className="absolute right-3 flex items-center gap-1 text-[11px] font-bold text-[#00A86B]">
                <Check className="w-3.5 h-3.5" /> Verified
              </span>
            )}
          </div>
        </div>
        <div>
          <FieldLabel required>Bank Name</FieldLabel>
          <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} disabled={isBankVerified} placeholder="Enter bank name" className={inputCls} />
        </div>
        <div>
          <FieldLabel>Branch Name</FieldLabel>
          <input type="text" value={branchName} onChange={(e) => setBranchName(e.target.value)} disabled={isBankVerified} placeholder="Enter branch name" className={inputCls} />
        </div>
      </div>

      {isBankVerified && (
        <div className="mt-4 flex items-center gap-1.5 text-[12px] font-bold text-[#00A86B] bg-[#F0FDF4] border border-[#00A86B]/20 rounded-lg px-3 py-2">
          <BadgeCheck className="w-4 h-4 shrink-0" /> Bank account verified
        </div>
      )}
    </Panel>
  );
}

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
      try {
        const [statusRes, userRes] = await Promise.allSettled([
          apiClient.get('/getKyc/getKycStatus'),
          apiClient.get('/user/getUserDetails'),
        ]);

        const userData = userRes.status === 'fulfilled' ? userRes.value.data?.user : null;
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

  /* ── FLOW STATE ── */
  const [method, setMethod] = useState<'EKYC' | 'MANUAL' | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<'EKYC' | 'MANUAL' | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showManualSuccess, setShowManualSuccess] = useState(false);

  const [businessType, setBusinessType] = useState<'INDIVIDUAL' | 'COMPANY' | null>(null);
  const [gstin, setGstin] = useState('');
  const [isGstinVerified, setIsGstinVerified] = useState(false);
  const [isGstinLoading, setIsGstinLoading] = useState(false);

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
    if (!accountNumber || !ifscCode || ifscCode.length < 11 || !accountNumbersMatch) return;
    setIsBankLoading(true);
    try {
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
      const res = await apiClient.post('/merchant/verfication/gstin', { GSTIN: gstin });
      if (res.data?.success) {
        setIsGstinVerified(true);
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
      await apiClient.post('/merchant/verfication/kyc', { payload });
      setIsSubmitted(true);
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'KYC submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualSubmit = () => {
    setShowManualSuccess(true);
  };

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

          <div className="bg-white rounded-xl md:rounded-2xl border border-[#E2E8F0] p-4 shadow-sm">
            <h2 className="text-[15px] md:text-base font-bold text-[#0F172A]">Complete Your KYC</h2>
            <p className="text-[12px] md:text-[13px] text-[#64748B] mt-1 mb-5">Choose your preferred method to verify your identity and unlock full access</p>

            <div className="flex flex-col sm:flex-row items-start gap-3.5 md:gap-4">
              <div className="w-full sm:w-[340px] shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedMethod('EKYC')}
                  className={`w-full group relative flex flex-col items-start gap-1.5 text-left p-4 md:p-5 rounded-xl border-2 transition-all duration-200 ${
                    selectedMethod === 'EKYC'
                      ? 'border-[#00A86B] bg-[#F0FDF4]/60 shadow-md'
                      : 'border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#00A86B]/40 hover:bg-[#F0FDF4]/40 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center gap-2.5 mb-1">
                    <span className={`w-5 h-5 rounded-full border-2 shrink-0 transition-colors flex items-center justify-center ${selectedMethod === 'EKYC' ? 'border-[#00A86B]' : 'border-[#CBD5E1] group-hover:border-[#00A86B]'}`}>
                      {selectedMethod === 'EKYC' && <span className="w-2.5 h-2.5 rounded-full bg-[#00A86B]" />}
                    </span>
                    <span className="text-[14px] font-bold text-[#0F172A]">E-KYC</span>
                  </div>
                  <p className="text-[12.5px] text-[#64748B]">Get KYC verified within a minute</p>
                </button>

                <ShineButton
                  type="button"
                  onClick={() => selectedMethod && setMethod(selectedMethod)}
                  disabled={!selectedMethod}
                  className="mt-4 h-11 px-6 rounded-full bg-[#009D64] hover:bg-[#008856] transition-colors text-white text-[13px] font-bold shadow-sm disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-1.5"
                >
                  Next <ArrowRight className="w-4 h-4" />
                </ShineButton>
              </div>

              <button
                type="button"
                onClick={() => setSelectedMethod('MANUAL')}
                className={`w-full sm:w-[340px] shrink-0 group relative flex flex-col items-start gap-1.5 text-left p-4 md:p-5 rounded-xl border-2 transition-all duration-200 ${
                  selectedMethod === 'MANUAL'
                    ? 'border-[#00A86B] bg-[#F0FDF4]/60 shadow-md'
                    : 'border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#00A86B]/40 hover:bg-[#F0FDF4]/40 hover:shadow-md'
                }`}
              >
                <div className="flex items-center gap-2.5 mb-1">
                  <span className={`w-5 h-5 rounded-full border-2 shrink-0 transition-colors flex items-center justify-center ${selectedMethod === 'MANUAL' ? 'border-[#00A86B]' : 'border-[#CBD5E1] group-hover:border-[#00A86B]'}`}>
                    {selectedMethod === 'MANUAL' && <span className="w-2.5 h-2.5 rounded-full bg-[#00A86B]" />}
                  </span>
                  <span className="text-[14px] font-bold text-[#0F172A]">Manual KYC</span>
                </div>
                <p className="text-[12.5px] text-[#64748B]">KYC verification might take 2-3 business days</p>
              </button>
            </div>
          </div>
        </div>
        <Toast toast={toast} onClose={closeToast} />
      </AdminLayout>
    );
  }

  /* ── E-KYC FLOW ── */
  if (method === 'EKYC') {
    return (
      <AdminLayout>
        <div className="mx-2 text-[#0F172A] pb-16">
          <h1 className="text-lg md:text-xl font-bold text-[#0F172A] mb-4 md:mb-6">KYC</h1>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-5 items-start">
            <div className="space-y-5">
              <Panel
                title={<span className="text-[20px] font-bold">e-KYC (Get KYC verified within a minute)</span>}
                right={
                  <button type="button" onClick={() => setMethod(null)} className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#64748B] hover:text-[#0F172A] px-3 h-8 rounded-lg hover:bg-[#F8FAFC] transition-colors">
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                  </button>
                }
              >
                <BusinessTypeSelector businessType={businessType} setBusinessType={setBusinessType} disabled={isGstinVerified} />
              </Panel>

              {businessType === 'COMPANY' && (
                <Panel title="GST Details">
                  <GstinField gstin={gstin} setGstin={setGstin} isGstinVerified={isGstinVerified} isGstinLoading={isGstinLoading} onVerify={handleVerifyGstin} />
                </Panel>
              )}

              {businessType === 'INDIVIDUAL' && (
                <Panel title="Billing Information">
                  <div className="space-y-4">
                    <div>
                      <FieldLabel required>Address</FieldLabel>
                      <textarea
                        rows={2}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Enter your registered billing address"
                        className={`${inputCls} !rounded-2xl h-auto py-3 resize-none`}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <FieldLabel required>Pincode</FieldLabel>
                        <input
                          type="text"
                          maxLength={6}
                          value={pincode}
                          onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                          placeholder="Enter 6-digit pincode"
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <FieldLabel>City</FieldLabel>
                        <input type="text" value={city} readOnly placeholder="Auto-filled" className={`${inputCls} uppercase`} />
                      </div>
                      <div>
                        <FieldLabel>State</FieldLabel>
                        <input type="text" value={state} readOnly placeholder="Auto-filled" className={`${inputCls} uppercase`} />
                      </div>
                    </div>
                  </div>
                </Panel>
              )}

              <Panel title="Aadhaar Verification">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel required>Aadhaar Number</FieldLabel>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        maxLength={12}
                        value={aadhaarNumber}
                        onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, ''))}
                        disabled={isAadhaarVerified}
                        placeholder="Enter 12 digit valid Aadhaar no."
                        className={`${inputCls} pr-20`}
                      />
                      {!isAadhaarVerified ? (
                        <button
                          type="button"
                          onClick={sendAadhaarOtpAndOpen}
                          disabled={sendingAadhaarOtp || aadhaarOtpTimer > 0 || aadhaarNumber.length < 12}
                          className="absolute right-1.5 h-8 px-3.5 rounded-full bg-[#334155] hover:bg-[#1E293B] text-white text-[11px] font-bold disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center gap-1.5"
                        >
                          {sendingAadhaarOtp ? <RefreshCcw className="w-3 h-3 animate-spin" /> : aadhaarOtpTimer > 0 ? `Resend in ${aadhaarOtpTimer}s` : 'Verify'}
                        </button>
                      ) : (
                        <span className="absolute right-3 flex items-center gap-1 text-[11px] font-bold text-[#00A86B]">
                          <Check className="w-3.5 h-3.5" /> Verified
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <FieldLabel required>PAN No.</FieldLabel>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        maxLength={10}
                        value={panNumber}
                        onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                        disabled={isPanVerified}
                        placeholder="Enter 10 chars valid PAN no."
                        className={`${inputCls} pr-20 uppercase`}
                      />
                      {!isPanVerified ? (
                        <button
                          type="button"
                          onClick={handleVerifyPan}
                          disabled={isPanLoading || panNumber.length < 10}
                          className="absolute right-1.5 h-8 px-3.5 rounded-full bg-[#334155] hover:bg-[#1E293B] text-white text-[11px] font-bold disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center gap-1.5"
                        >
                          {isPanLoading ? <RefreshCcw className="w-3 h-3 animate-spin" /> : 'Verify'}
                        </button>
                      ) : (
                        <span className="absolute right-3 flex items-center gap-1 text-[11px] font-bold text-[#00A86B]">
                          <Check className="w-3.5 h-3.5" /> Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {(isAadhaarVerified || isPanVerified) && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="mt-4 pt-4 border-t border-dashed border-[#E2E8F0] grid grid-cols-2 md:grid-cols-3 gap-3">
                        {isAadhaarVerified && (
                          <>
                            <div><span className="block text-[10px] font-semibold text-[#94A3B8] mb-1">Name</span><span className="text-[12.5px] font-bold text-[#0F172A]">{aadhaarData.name || '—'}</span></div>
                            <div><span className="block text-[10px] font-semibold text-[#94A3B8] mb-1">Guardian</span><span className="text-[12.5px] font-bold text-[#0F172A]">{aadhaarData.guardianName || '—'}</span></div>
                            <div><span className="block text-[10px] font-semibold text-[#94A3B8] mb-1">State</span><span className="text-[12.5px] font-bold text-[#0F172A]">{aadhaarData.state || '—'}</span></div>
                          </>
                        )}
                        {isPanVerified && (
                          <>
                            <div><span className="block text-[10px] font-semibold text-[#94A3B8] mb-1">Name</span><span className="text-[12.5px] font-bold text-[#0F172A]">{panData.name || '—'}</span></div>
                            <div><span className="block text-[10px] font-semibold text-[#94A3B8] mb-1">PAN Type</span><span className="text-[12.5px] font-bold text-[#0F172A]">{panData.panType || '—'}</span></div>
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Panel>

              <div className="flex justify-end">
                <ShineButton
                  type="button"
                  onClick={handleKycSubmit}
                  disabled={isSubmitting || !isAadhaarVerified || !isPanVerified || !isBankVerified || (businessType === 'COMPANY' && !isGstinVerified) || (businessType === 'INDIVIDUAL' && (!address || !pincode || !city || !state))}
                  className="h-11 px-6 rounded-full bg-[#009D64] hover:bg-[#008856] transition-colors text-white text-[13px] font-bold shadow-sm disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <><RefreshCcw className="w-4 h-4 animate-spin" /> Processing...</> : 'Submit KYC'}
                </ShineButton>
              </div>
            </div>

            <div className="lg:sticky lg:top-6">
              <BankDetailsPanel accountNumber={accountNumber} setAccountNumber={setAccountNumber} confirmAccountNumber={confirmAccountNumber} setConfirmAccountNumber={setConfirmAccountNumber} accountNumbersMatch={accountNumbersMatch} accountHolderName={accountHolderName} setAccountHolderName={setAccountHolderName} ifscCode={ifscCode} setIfscCode={setIfscCode} bankName={bankName} setBankName={setBankName} branchName={branchName} setBranchName={setBranchName} isBankVerified={isBankVerified} isBankLoading={isBankLoading} onVerify={handleVerifyBank} />
            </div>
          </div>
        </div>

        {/* Aadhaar OTP modal */}
        <AnimatePresence>
          {isAadhaarOtpModalOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeAadhaarOtpModal} className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm z-[200]" />
              <div className="fixed inset-0 flex items-center justify-center z-[201] p-4 pointer-events-none">
                <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', duration: 0.5 }} className="w-full max-w-[380px] bg-white rounded-2xl shadow-2xl p-6 relative pointer-events-auto border border-[#E2E8F0] text-center">
                  <button type="button" onClick={closeAadhaarOtpModal} className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-[#F8FAFC] transition-colors border border-[#E2E8F0] cursor-pointer focus:outline-none">
                    <X className="w-4 h-4 text-[#64748B]" />
                  </button>
                  <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.1 }} className="w-16 h-16 rounded-2xl bg-[#F0FDF4] flex items-center justify-center mx-auto mt-3 mb-4">
                    <ShieldCheck className="w-7 h-7 text-[#00A86B]" />
                  </motion.div>
                  <h2 className="text-base font-bold text-[#0F172A] mb-1.5">Verify Aadhaar OTP</h2>
                  <p className="text-[13px] text-[#64748B] leading-relaxed mb-5">Enter the OTP sent to your Aadhaar-linked mobile number.</p>

                  <div className="flex justify-center gap-2 mb-5">
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
                        className={`w-10 h-11 md:w-11 md:h-11 rounded-xl border text-center text-base md:text-lg font-bold text-[#00A86B] focus:outline-none focus:border-[#00A86B] focus:ring-2 focus:ring-[#00A86B]/15 transition-all ${value ? 'border-[#00A86B]/40 bg-[#F0FDF4]/40' : 'border-[#E2E8F0]'}`}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleVerifyAadhaarOtp}
                    disabled={verifyingAadhaarOtp || aadhaarOtpValues.join('').length !== 6}
                    className="w-full h-11 rounded-xl bg-[#00A86B] hover:bg-[#009B63] text-white text-[13px] font-bold shadow-sm disabled:opacity-50 disabled:pointer-events-none mb-3 cursor-pointer transition-all"
                  >
                    {verifyingAadhaarOtp ? <span className="flex items-center justify-center gap-2"><RefreshCcw className="w-3.5 h-3.5 animate-spin" /> Verifying...</span> : 'Verify OTP'}
                  </button>
                  <p className="text-xs text-[#94A3B8]">
                    {aadhaarOtpTimer > 0 ? `Resend in ${aadhaarOtpTimer}s` : <span className="text-[#00A86B] cursor-pointer font-bold hover:underline" onClick={sendAadhaarOtpAndOpen}>Resend OTP</span>}
                  </p>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>

        <Toast toast={toast} onClose={closeToast} />
      </AdminLayout>
    );
  }

  /* ── MANUAL KYC FLOW ── */
  return (
    <AdminLayout>
      <div className="mx-2 text-[#0F172A] pb-16">
        <h1 className="text-lg md:text-xl font-bold text-[#0F172A] mb-4 md:mb-6">KYC</h1>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-5 items-start">
          <div className="space-y-5">
            <Panel
              title={<span className="text-[20px] font-bold">Manual KYC (verification might take 2-3 business days)</span>}
              right={
                <button type="button" onClick={() => setMethod(null)} className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#64748B] hover:text-[#0F172A] px-3 h-8 rounded-lg hover:bg-[#F8FAFC] transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
              }
            >
              <BusinessTypeSelector businessType={businessType} setBusinessType={setBusinessType} />
            </Panel>

            {businessType === 'COMPANY' && (
              <Panel title="GST Details">
                <GstinField gstin={gstin} setGstin={setGstin} isGstinVerified={isGstinVerified} isGstinLoading={isGstinLoading} onVerify={handleVerifyGstin} />
              </Panel>
            )}

            <ShineButton
              type="button"
              onClick={handleManualSubmit}
              disabled={!businessType || (businessType === 'COMPANY' && !gstin)}
              className="h-11 px-6 rounded-full bg-[#009D64] hover:bg-[#008856] text-white text-[13px] font-bold shadow-sm transition-colors disabled:opacity-50 disabled:pointer-events-none"
            >
              Submit
            </ShineButton>
          </div>

          <div className="lg:sticky lg:top-6">
            <BankDetailsPanel accountNumber={accountNumber} setAccountNumber={setAccountNumber} confirmAccountNumber={confirmAccountNumber} setConfirmAccountNumber={setConfirmAccountNumber} accountNumbersMatch={accountNumbersMatch} accountHolderName={accountHolderName} setAccountHolderName={setAccountHolderName} ifscCode={ifscCode} setIfscCode={setIfscCode} bankName={bankName} setBankName={setBankName} branchName={branchName} setBranchName={setBranchName} isBankVerified={isBankVerified} isBankLoading={isBankLoading} onVerify={handleVerifyBank} />
          </div>
        </div>
      </div>

      {/* Manual KYC success popup */}
      <AnimatePresence>
        {showManualSuccess && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setShowManualSuccess(false); navigate('/user/dashboard'); }} className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm z-[200]" />
            <div className="fixed inset-0 flex items-center justify-center z-[201] p-4 pointer-events-none">
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', duration: 0.5 }} className="w-full max-w-[380px] bg-white rounded-2xl shadow-2xl p-6 relative pointer-events-auto border border-[#E2E8F0] text-center">
                <button type="button" onClick={() => { setShowManualSuccess(false); navigate('/user/dashboard'); }} className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-[#F8FAFC] transition-colors border border-[#E2E8F0] cursor-pointer focus:outline-none">
                  <X className="w-4 h-4 text-[#64748B]" />
                </button>
                <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.1 }} className="w-16 h-16 rounded-2xl bg-[#F0FDF4] flex items-center justify-center mx-auto mt-3 mb-4">
                  <CheckCircle2 className="w-7 h-7 text-[#00A86B]" />
                </motion.div>
                <h2 className="text-base font-bold text-[#0F172A] mb-1.5">Request Submitted Successfully</h2>
                <p className="text-[13px] text-[#64748B] leading-relaxed mb-5">Our agent will call you soon to complete your KYC verification.</p>
                <button
                  type="button"
                  onClick={() => { setShowManualSuccess(false); navigate('/user/dashboard'); }}
                  className="w-full h-11 rounded-xl bg-[#00A86B] hover:bg-[#009B63] text-white text-[13px] font-bold shadow-sm transition-all cursor-pointer"
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
