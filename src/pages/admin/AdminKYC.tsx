import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { apiClient } from '../../services/apiClient';
import {
  Check,
  X,
  Mail,
  Phone,
  MapPin,
  Building2,
  FileText,
  CreditCard,
  ShieldCheck,
  Lock,
  ArrowLeft,
  ArrowRight,
  RefreshCcw,
  Building,
  CheckCircle2,
  FileCheck,
  ChevronRight,
  Clock,
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
    <div className={`bg-white rounded-2xl border ${verified ? 'border-[#00A86B]/30' : 'border-slate-200'} p-6 shadow-sm`}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${verified ? 'bg-[#F0FDF4]' : 'bg-amber-50'}`}>
            <Icon className={`w-4 h-4 ${verified ? 'text-[#00A86B]' : 'text-amber-500'}`} />
          </div>
          <h3 className="text-[13px] font-bold text-[#0F172A]">{title}</h3>
        </div>
        {verified ? (
          <span className="flex items-center gap-1 text-[10px] font-bold text-[#00A86B] bg-[#F0FDF4] border border-[#00A86B]/20 px-2.5 py-1 rounded-full select-none">
            <CheckCircle2 className="w-3 h-3" /> Verified
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full select-none">
            <Clock className="w-3 h-3" /> Pending
          </span>
        )}
      </div>
      <div className="space-y-3 divide-y divide-slate-50">{children}</div>
    </div>
  );
}

function KycField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-start gap-3 pt-3 first:pt-0">
      <span className="text-[11px] font-semibold text-[#94A3B8] w-[120px] shrink-0">{label}</span>
      <span className="text-[12px] font-semibold text-[#0F172A] break-all">{value || 'N/A'}</span>
    </div>
  );
}

/* ── MAIN COMPONENT ── */
export function AdminKYC() {
  const navigate = useNavigate();

  /* ── KYC STATUS CHECK ─────────────────────────────────────────────
     Same logic as old KYC.js:
       - Call all 4 endpoints, set data directly from response
       - Check field presence (not HTTP status codes) to determine verified state
       - If aadhaar + pan + bank all verified → show read-only view
  ── */
  const [kycLoading, setKycLoading] = useState(true);
  const [kycComplete, setKycComplete] = useState(false);
  const [fetchedAadhaar, setFetchedAadhaar] = useState<AadhaarData>({});
  const [fetchedPan, setFetchedPan] = useState<PanData>({});
  const [fetchedBank, setFetchedBank] = useState<BankData>({});
  const [fetchedGst, setFetchedGst] = useState<GstData>({});
  const [fetchedBilling, setFetchedBilling] = useState<BillingData>({});
  const [billingPreFilled, setBillingPreFilled] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        // Fetch KYC status + user profile in parallel
        const [statusRes, userRes] = await Promise.allSettled([
          apiClient.get('/getKyc/getKycStatus'),
          apiClient.get('/user/getUserDetails'),
        ]);

        // Always set real email + phone + verification status from user profile
        const userData = userRes.status === 'fulfilled' ? userRes.value.data?.user : null;
        if (userData?.email) setEmail(userData.email);
        if (userData?.phoneNumber) setPhoneNumber(userData.phoneNumber);
        if (userData?.isEmailVerified) setIsEmailVerified(true);
        if (userData?.isPhoneVerified) setIsPhoneVerified(true);

        const isVerified: boolean = userData?.kycDone === true;
        const companyCategory: string =
          statusRes.status === 'fulfilled' ? (statusRes.value.data?.companyCategory || 'individual') : 'individual';

        // Set business type from DB so the selector always shows the correct selection
        setBusinessType(companyCategory === 'company' ? 'COMPANY' : 'INDIVIDUAL');

        if (isVerified) {
          // KYC complete — fetch all display data in parallel
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
          // KYC not complete — fetch all existing data to resume where user left off
          const [billRes, aRes, pRes, bRes] = await Promise.allSettled([
            apiClient.get('/getKyc/getBillingInfo'),
            apiClient.get('/getKyc/getAadhaar'),
            apiClient.get('/getKyc/getPan'),
            apiClient.get('/getKyc/getBankAccount'),
          ]);

          // Pre-fill Step 1 billing fields if already submitted
          const bill = billRes.status === 'fulfilled' ? billRes.value.data : null;
          if (bill?.address) {
            setAddress(bill.address);
            setCity(bill.city || '');
            setState(bill.state || '');
            setPincode(bill.postalCode || '');
            setBillingPreFilled(true);
            // Auto-jump to Step 2 only when billing + phone + email are all verified
            if (userData?.isPhoneVerified && userData?.isEmailVerified) {
              setStep(2);
            }
          }

          // Pre-fill Step 2 Aadhaar if already in DB
          const a = aRes.status === 'fulfilled' ? (aRes.value.data?.data ?? {}) : {};
          if (a?.aadhaarNumber) {
            setAadhaarNumber(a.aadhaarNumber);
            setIsAadhaarVerified(true);
            setAadhaarData({ name: a.name || '', guardianName: a.sonOf || '', address: a.address || '', state: a.state || '', city: a.city || '' });
          }

          // Pre-fill Step 2 PAN if already in DB
          const p = pRes.status === 'fulfilled' ? (pRes.value.data ?? {}) : {};
          if (p?.pan) {
            setPanNumber(p.pan);
            setIsPanVerified(true);
            setPanData({ panType: p.panType || '', name: p.registeredName || '' });
          }

          // Pre-fill Step 2 Bank if already in DB
          const b = bRes.status === 'fulfilled' ? (bRes.value.data ?? {}) : {};
          if (b?.accountNumber && b?.ifsc) {
            setAccountNumber(b.accountNumber);
            setIfscCode(b.ifsc);
            setIsBankVerified(true);
            setBankData({ beneficiaryName: b.nameAtBank || '', bankName: b.bank || '', branchName: b.branch || '', city: '' });
          }
        }
      } catch {
        // Network error — fall through to wizard
      } finally {
        setKycLoading(false);
      }
    };
    fetchAll();
  }, []);

  /* ── WIZARD STATE ── */
  const [step, setStep] = useState<1 | 2>(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otpTarget, setOtpTarget] = useState<'aadhaar' | 'phone'>('aadhaar');

  // Step 1
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);

  // Phone OTP
  const [showPhoneOtpModal, setShowPhoneOtpModal] = useState(false);
  const [phoneOtpValues, setPhoneOtpValues] = useState<string[]>(Array(6).fill(''));
  const [phoneOtpTimer, setPhoneOtpTimer] = useState(0);
  const [loadingPhoneOtp, setLoadingPhoneOtp] = useState(false);
  const [verifyingPhoneOtp, setVerifyingPhoneOtp] = useState(false);

  // Email OTP
  const [showEmailOtpModal, setShowEmailOtpModal] = useState(false);
  const [emailOtpValues, setEmailOtpValues] = useState<string[]>(Array(6).fill(''));
  const [emailOtpTimer, setEmailOtpTimer] = useState(0);
  const [loadingEmailOtp, setLoadingEmailOtp] = useState(false);
  const [verifyingEmailOtp, setVerifyingEmailOtp] = useState(false);

  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [businessType, setBusinessType] = useState<'INDIVIDUAL' | 'COMPANY' | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [gstin, setGstin] = useState('');
  const [isGstinVerified, setIsGstinVerified] = useState(false);
  const [isGstinLoading, setIsGstinLoading] = useState(false);

  // Step 2
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [isAadhaarVerified, setIsAadhaarVerified] = useState(false);
  const [aadhaarData, setAadhaarData] = useState({ name: '', guardianName: '', address: '', state: '', city: '' });

  const [panNumber, setPanNumber] = useState('');
  const [isPanVerified, setIsPanVerified] = useState(false);
  const [isPanLoading, setIsPanLoading] = useState(false);
  const [panData, setPanData] = useState({ panType: '', name: '' });

  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [isBankVerified, setIsBankVerified] = useState(false);
  const [isBankLoading, setIsBankLoading] = useState(false);
  const [bankData, setBankData] = useState({ beneficiaryName: '', bankName: '', branchName: '', city: '' });

  const [otpValues, setOtpValues] = useState(['', '', '', '']);
  const otpInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const handleOtpChange = (index: number, value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    if (!cleanValue && value !== '') return;
    const newOtpValues = [...otpValues];
    newOtpValues[index] = cleanValue.slice(-1);
    setOtpValues(newOtpValues);
    if (cleanValue !== '' && index < 3) otpInputRefs[index + 1].current?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && otpValues[index] === '' && index > 0) {
      otpInputRefs[index - 1].current?.focus();
    }
  };

  const closeOtpModal = () => { setIsOtpModalOpen(false); setOtpValues(['', '', '', '']); };

  const handleVerifyOtp = () => {
    const enteredOtp = otpValues.join('');
    if (enteredOtp.length < 4) return;
    if (otpTarget === 'aadhaar') {
      setIsAadhaarVerified(true);
      setAadhaarData({ name: 'Dinesh Tharwani', guardianName: 'Ram Tharwani', address: 'Flat 302, Galaxy Apartments, Sector 45', state: 'HARYANA', city: 'GURUGRAM' });
    }
    closeOtpModal();
  };

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  useEffect(() => {
    if (pincode.length === 6) {
      if (pincode.startsWith('11')) { setCity('NEW DELHI'); setState('DELHI'); }
      else if (pincode.startsWith('40')) { setCity('MUMBAI'); setState('MAHARASHTRA'); }
    }
  }, [pincode]);

  useEffect(() => {
    if (phoneOtpTimer <= 0) return;
    const interval = setInterval(() => setPhoneOtpTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [phoneOtpTimer]);

  useEffect(() => {
    if (emailOtpTimer <= 0) return;
    const interval = setInterval(() => setEmailOtpTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [emailOtpTimer]);

  const handleVerifyPan = () => {
    if (!panNumber || panNumber.length < 10) return;
    setIsPanLoading(true);
    setTimeout(() => {
      setIsPanVerified(true);
      setIsPanLoading(false);
      setPanData({ panType: businessType === 'COMPANY' ? 'PRIVATE LIMITED' : 'INDIVIDUAL', name: 'DINESH THARWANI' });
    }, 1200);
  };

  const handleVerifyBank = () => {
    if (!accountNumber || !ifscCode || ifscCode.length < 11) return;
    setIsBankLoading(true);
    setTimeout(() => {
      setIsBankVerified(true);
      setIsBankLoading(false);
      setBankData({ beneficiaryName: 'DINESH THARWANI', bankName: 'HDFC BANK', branchName: 'SOHNA ROAD BRANCH', city: 'GURUGRAM' });
    }, 1200);
  };

  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAadhaarVerified || !isPanVerified || !isBankVerified) return;
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
        bankDetails: {
          ifsc: ifscCode,
          accountNumber: accountNumber,
        },
        isVerified: true,
      };
      await apiClient.post('/merchant/verfication/kyc', { payload });
      setIsSubmitted(true);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'KYC submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── PHONE OTP FUNCTIONS ── */
  const sendPhoneOtp = async () => {
    if (phoneOtpTimer > 0 || loadingPhoneOtp) return;
    const digits = phoneNumber.replace(/\D/g, '');
    if (digits.length !== 10) return;
    try {
      setLoadingPhoneOtp(true);
      await apiClient.post('/auth/send-otp', { phoneNumber: digits });
      setPhoneOtpValues(Array(6).fill(''));
      setPhoneOtpTimer(180);
      setShowPhoneOtpModal(true);
    } catch {
      // silent
    } finally {
      setLoadingPhoneOtp(false);
    }
  };

  const verifyPhoneOtp = async () => {
    const otp = phoneOtpValues.join('');
    if (otp.length !== 6) return;
    try {
      setVerifyingPhoneOtp(true);
      await apiClient.post('/auth/verify-otp', { phoneNumber: phoneNumber.replace(/\D/g, ''), otp });
      setIsPhoneVerified(true);
      setShowPhoneOtpModal(false);
    } catch {
      // silent
    } finally {
      setVerifyingPhoneOtp(false);
    }
  };

  /* ── EMAIL OTP FUNCTIONS ── */
  const sendEmailOtp = async () => {
    if (emailOtpTimer > 0 || loadingEmailOtp) return;
    if (!email || !email.includes('@')) return;
    try {
      setLoadingEmailOtp(true);
      await apiClient.post('/auth/send-email-otp', { email });
      setEmailOtpValues(Array(6).fill(''));
      setEmailOtpTimer(180);
      setShowEmailOtpModal(true);
    } catch {
      // silent
    } finally {
      setLoadingEmailOtp(false);
    }
  };

  const verifyEmailOtp = async () => {
    const otp = emailOtpValues.join('');
    if (otp.length !== 6) return;
    try {
      setVerifyingEmailOtp(true);
      await apiClient.post('/auth/verify-email-otp', { email, otp });
      setIsEmailVerified(true);
      setShowEmailOtpModal(false);
    } catch {
      // silent
    } finally {
      setVerifyingEmailOtp(false);
    }
  };

  /* ── LOADING ── */
  if (kycLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <RefreshCcw className="w-7 h-7 text-[#00A86B] animate-spin" />
            <p className="text-sm font-semibold text-[#64748B]">Checking KYC status...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  /* ── READ-ONLY VIEW (all required sections verified in backend) ── */
  if (kycComplete) {
    const isVerifiedG = !!fetchedGst?.gstin;
    return (
      <AdminLayout>
        <div className="max-w-4xl mx-auto pb-16">
          <div className="mb-6 flex items-center gap-3 p-4 bg-[#F0FDF4] rounded-2xl border border-[#00A86B]/20 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-[#00A86B] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#0F172A]">KYC Verification Complete</h2>
              <p className="text-[11px] text-[#64748B] mt-0.5">All your documents have been successfully verified. This information is read-only.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <KycCard title="Aadhaar Details" icon={CreditCard} verified={!!fetchedAadhaar?.aadhaarNumber}>
              <KycField label="Name" value={fetchedAadhaar?.name} />
              <KycField label="Aadhaar Number" value={fetchedAadhaar?.aadhaarNumber} />
              <KycField label="Guardian Name" value={fetchedAadhaar?.sonOf} />
              <KycField label="State" value={fetchedAadhaar?.state} />
              <KycField label="Address" value={fetchedAadhaar?.address} />
            </KycCard>

            <KycCard title="PAN Details" icon={FileText} verified={!!fetchedPan?.pan}>
              <KycField label="PAN Number" value={fetchedPan?.pan} />
              <KycField label="Registered Name" value={fetchedPan?.registeredName} />
              <KycField label="PAN Type" value={fetchedPan?.panType} />
              <KycField label="PAN Ref ID" value={fetchedPan?.panRefId} />
            </KycCard>

            <KycCard title="Bank Account Details" icon={Building} verified={!!(fetchedBank?.accountNumber && fetchedBank?.ifsc)}>
              <KycField label="Name at Bank" value={fetchedBank?.nameAtBank} />
              <KycField label="Bank" value={fetchedBank?.bank} />
              <KycField label="Account Number" value={fetchedBank?.accountNumber} />
              <KycField label="IFSC" value={fetchedBank?.ifsc} />
              <KycField label="Branch" value={fetchedBank?.branch} />
            </KycCard>

            <KycCard title={isVerifiedG ? 'GST Details' : 'Billing Details'} icon={FileCheck} verified={!!(fetchedBilling?.address || isVerifiedG)}>
              {isVerifiedG ? (
                <>
                  <KycField label="GSTIN" value={fetchedGst?.gstin} />
                  <KycField label="Business Name" value={fetchedGst?.nameOfBusiness} />
                  <KycField label="Legal Name" value={fetchedGst?.legalNameOfBusiness} />
                  <KycField label="Address" value={fetchedGst?.address} />
                  <KycField label="Pincode" value={fetchedGst?.pincode} />
                  <KycField label="City" value={fetchedGst?.city} />
                  <KycField label="State" value={fetchedGst?.state} />
                </>
              ) : (
                <>
                  <KycField label="Address" value={fetchedBilling?.address} />
                  <KycField label="City" value={fetchedBilling?.city} />
                  <KycField label="State" value={fetchedBilling?.state} />
                  <KycField label="Postal Code" value={fetchedBilling?.postalCode} />
                </>
              )}
            </KycCard>
          </div>
        </div>
      </AdminLayout>
    );
  }

  /* ── FORM WIZARD ── */
  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto text-[#0F172A] pb-16 font-sans admin-kyc-wrapper" style={{ fontFamily: "'Roboto', sans-serif" }}>

        <style dangerouslySetInnerHTML={{__html: `
          @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
          .admin-kyc-wrapper, .admin-kyc-wrapper * { font-family: 'Roboto', sans-serif !important; }
          .admin-kyc-wrapper h3, .admin-kyc-wrapper .heading-14 { font-size: 14px !important; }
          .admin-kyc-wrapper label, .admin-kyc-wrapper input:not(.otp-box), .admin-kyc-wrapper textarea,
          .admin-kyc-wrapper select, .admin-kyc-wrapper button, .admin-kyc-wrapper p:not(.subtext),
          .admin-kyc-wrapper span:not(.heading-14) { font-size: 13px !important; }
        `}} />

        {/* Stepper Header */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div onClick={() => !isSubmitted && setStep(1)} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${step === 1 ? 'bg-[#F0FDF4] border-[#00A86B]/30 shadow-sm' : billingPreFilled ? 'bg-[#F0FDF4]/50 border-[#00A86B]/20 hover:bg-[#F0FDF4]' : 'bg-white border-slate-100 hover:bg-slate-50'}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${billingPreFilled || step === 1 ? 'bg-[#00A86B] text-white' : 'bg-slate-100 text-slate-400'}`}>
              {billingPreFilled ? <Check className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
            </div>
            <div className="text-left">
              <h3 className={`text-[14px] font-bold ${step === 1 ? 'text-[#0F172A]' : billingPreFilled ? 'text-[#00A86B]' : 'text-slate-500'} font-sans`}>Billing Information</h3>
              <p className="text-xs text-slate-400 font-normal leading-tight mt-1 font-sans subtext">{billingPreFilled ? 'Already verified — read only.' : 'Manage your billing details and payment methods here.'}</p>
            </div>
            {billingPreFilled && step !== 1 && <span className="ml-auto text-[10px] font-bold text-[#00A86B] bg-[#F0FDF4] border border-[#00A86B]/20 px-2 py-0.5 rounded-full shrink-0">Done</span>}
            {!billingPreFilled && step === 2 && <ChevronRight className="w-5 h-5 text-slate-400 ml-auto shrink-0" />}
          </div>

          <div onClick={() => { if (!isSubmitted && (billingPreFilled || (businessType && address && pincode))) setStep(2); }} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${billingPreFilled || (businessType && address && pincode) ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'} ${step === 2 ? 'bg-[#F0FDF4] border-[#00A86B]/30 shadow-sm' : 'bg-white border-slate-100 hover:bg-slate-50'}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${step === 2 ? 'bg-[#00A86B] text-white' : 'bg-slate-100 text-slate-400'}`}>
              <FileText className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h3 className={`text-[14px] font-bold ${step === 2 ? 'text-[#0F172A]' : 'text-slate-500'} font-sans`}>Document Verification</h3>
              <p className="text-xs text-slate-400 font-normal leading-tight mt-1 font-sans subtext">Verify documents quickly and securely to ensure authenticity.</p>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!isSubmitted ? (
            <motion.div key={step} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.25 }}>
              {step === 1 ? (
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-5 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[#00A86B]" /> Select Business Type {!billingPreFilled && <span className="text-red-500">*</span>}
                    </h3>
                    {billingPreFilled && (
                      <div className="mb-4 flex items-center gap-2 text-[11px] font-semibold text-[#00A86B] bg-[#F0FDF4] border border-[#00A86B]/20 rounded-xl px-3 py-2">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Billing information already verified — these fields are read-only.
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div onClick={() => !billingPreFilled && setBusinessType('INDIVIDUAL')} className={`p-5 rounded-2xl border-2 transition-all ${billingPreFilled ? 'cursor-default' : 'cursor-pointer'} ${businessType === 'INDIVIDUAL' ? 'border-[#00A86B] bg-[#F0FDF4]/40' : 'border-slate-100 bg-white'} ${!billingPreFilled ? 'hover:border-slate-200' : ''}`}>
                        <div className="flex items-center gap-3 mb-2.5">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${businessType === 'INDIVIDUAL' ? 'border-[#00A86B]' : 'border-slate-300'}`}>
                            {businessType === 'INDIVIDUAL' && <div className="w-2 h-2 rounded-full bg-[#00A86B]" />}
                          </div>
                          <span className="text-[14px] font-bold text-slate-800 uppercase tracking-wide font-sans heading-14">Individual</span>
                        </div>
                        <p className="text-xs text-slate-400 font-normal leading-relaxed font-sans">A seller using online platforms without registering under the Companies Act</p>
                      </div>
                      <div onClick={() => !billingPreFilled && setBusinessType('COMPANY')} className={`p-5 rounded-2xl border-2 transition-all ${billingPreFilled ? 'cursor-default' : 'cursor-pointer'} ${businessType === 'COMPANY' ? 'border-[#00A86B] bg-[#F0FDF4]/40' : 'border-slate-100 bg-white'} ${!billingPreFilled ? 'hover:border-slate-200' : ''}`}>
                        <div className="flex items-center gap-3 mb-2.5">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${businessType === 'COMPANY' ? 'border-[#00A86B]' : 'border-slate-300'}`}>
                            {businessType === 'COMPANY' && <div className="w-2 h-2 rounded-full bg-[#00A86B]" />}
                          </div>
                          <span className="text-[14px] font-bold text-slate-800 uppercase tracking-wide font-sans heading-14">Company</span>
                        </div>
                        <p className="text-xs text-slate-400 font-normal leading-relaxed font-sans">(Registered as LLP, Private, Subsidiary, Holding, etc. under Companies Act 2013)</p>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {(businessType || billingPreFilled) && (
                      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3 }} className="space-y-6">
                        {!billingPreFilled && businessType === 'COMPANY' && (
                          <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm">
                            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-5 flex items-center gap-2">
                              <Building className="w-4 h-4 text-[#00A86B]" /> Company Legal & GST Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                              <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Legal Company Name<span className="text-red-500">*</span></label>
                                <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Enter Registered Company Name" className="w-full h-11 px-4 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-[#00A86B] font-bold" />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5">GSTIN Number<span className="text-red-500">*</span></label>
                                <div className="relative flex items-center">
                                  <input type="text" maxLength={15} value={gstin} onChange={(e) => setGstin(e.target.value.toUpperCase())} disabled={isGstinVerified} placeholder="Enter 15-digit GSTIN" className="w-full h-11 px-4 pr-24 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-[#00A86B] font-bold uppercase" />
                                  {!isGstinVerified ? (
                                    <button type="button" onClick={() => { setIsGstinLoading(true); setTimeout(() => { setIsGstinVerified(true); setIsGstinLoading(false); }, 1000); }} disabled={isGstinLoading || gstin.length < 15} className="absolute right-3.5 text-xs font-bold text-[#00A86B] hover:text-[#009B63] select-none cursor-pointer focus:outline-none flex items-center gap-1.5 disabled:opacity-50">
                                      {isGstinLoading ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : "Verify GST"}
                                    </button>
                                  ) : (
                                    <span className="absolute right-3.5 flex items-center gap-1 text-[11px] font-bold text-[#00A86B] bg-[#00A86B]/5 border border-[#00A86B]/15 px-2 py-0.5 rounded-full">
                                      <Check className="w-3 h-3" /> Verified
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm">
                          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-5 flex items-center gap-2">
                            <Lock className="w-4 h-4 text-[#00A86B]" /> Mandatory Information
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Email */}
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Email<span className="text-red-500">*</span></label>
                              <div className="relative flex items-center">
                                <input
                                  type="email"
                                  value={email}
                                  onChange={(e) => !isEmailVerified && !billingPreFilled && setEmail(e.target.value)}
                                  readOnly={isEmailVerified || billingPreFilled}
                                  placeholder="Enter your email"
                                  className={`w-full h-11 pl-10 pr-28 rounded-xl border text-xs focus:outline-none font-bold ${isEmailVerified || billingPreFilled ? 'border-slate-200 text-slate-700 bg-slate-50' : 'border-slate-200 text-slate-800 focus:border-[#00A86B]'}`}
                                />
                                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5" />
                                {isEmailVerified ? (
                                  <span className="absolute right-3.5 flex items-center gap-1 text-[11px] font-bold text-[#00A86B] bg-[#00A86B]/5 border border-[#00A86B]/15 px-2 py-0.5 rounded-full">
                                    <Check className="w-3 h-3" /> Verified
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={sendEmailOtp}
                                    disabled={emailOtpTimer > 0 || loadingEmailOtp || !email || !email.includes('@')}
                                    className="absolute right-3.5 text-[11px] font-bold text-[#00A86B] hover:text-[#009B63] disabled:opacity-40 disabled:pointer-events-none select-none focus:outline-none"
                                  >
                                    {loadingEmailOtp ? 'Sending...' : emailOtpTimer > 0 ? `Resend in ${emailOtpTimer}s` : 'Send OTP'}
                                  </button>
                                )}
                              </div>
                            </div>
                            {/* Phone */}
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Phone Number<span className="text-red-500">*</span></label>
                              <div className="relative flex items-center">
                                <input
                                  type="tel"
                                  value={phoneNumber}
                                  onChange={(e) => {
                                    if (!isPhoneVerified && !billingPreFilled) {
                                      let v = e.target.value.replace(/\D/g, '');
                                      if (v.length > 10) v = v.slice(0, 10);
                                      setPhoneNumber(v);
                                    }
                                  }}
                                  readOnly={isPhoneVerified || billingPreFilled}
                                  placeholder="Enter 10-digit mobile number"
                                  className={`w-full h-11 pl-10 pr-28 rounded-xl border text-xs focus:outline-none font-bold ${isPhoneVerified || billingPreFilled ? 'border-slate-200 text-slate-700 bg-slate-50' : 'border-slate-200 text-slate-800 focus:border-[#00A86B]'}`}
                                />
                                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5" />
                                {isPhoneVerified ? (
                                  <span className="absolute right-3.5 flex items-center gap-1 text-[11px] font-bold text-[#00A86B] bg-[#00A86B]/5 border border-[#00A86B]/15 px-2 py-0.5 rounded-full">
                                    <Check className="w-3 h-3" /> Verified
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={sendPhoneOtp}
                                    disabled={phoneOtpTimer > 0 || loadingPhoneOtp || phoneNumber.replace(/\D/g, '').length !== 10}
                                    className="absolute right-3.5 text-[11px] font-bold text-[#00A86B] hover:text-[#009B63] disabled:opacity-40 disabled:pointer-events-none select-none focus:outline-none"
                                  >
                                    {loadingPhoneOtp ? 'Sending...' : phoneOtpTimer > 0 ? `Resend in ${phoneOtpTimer}s` : 'Send OTP'}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm">
                          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-5 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-[#00A86B]" /> {businessType === 'COMPANY' ? 'Registered Office / Billing Address' : 'Billing Information'}
                          </h3>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Address<span className="text-red-500">*</span></label>
                              <textarea rows={2} required value={address} onChange={(e) => setAddress(e.target.value)} readOnly={billingPreFilled} placeholder="Enter your registered billing address" className={`w-full p-4 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none font-medium leading-relaxed resize-none ${billingPreFilled ? 'bg-slate-50 text-slate-600 cursor-default' : 'focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]'}`} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Pincode<span className="text-red-500">*</span></label>
                                <input type="text" required maxLength={6} placeholder="Enter 6-digit Pincode" value={pincode} onChange={(e) => !billingPreFilled && setPincode(e.target.value.replace(/\D/g, ''))} readOnly={billingPreFilled} className={`w-full h-11 px-4 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none font-bold ${billingPreFilled ? 'bg-slate-50 text-slate-600 cursor-default' : 'focus:border-[#00A86B]'}`} />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5">City<span className="text-red-500">*</span></label>
                                <input type="text" required readOnly value={city} placeholder="Auto-filled via Pincode" className="w-full h-11 px-4 rounded-xl border border-slate-200 text-slate-700 bg-slate-50 text-xs focus:outline-none font-bold uppercase" />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5">State<span className="text-red-500">*</span></label>
                                <div className="relative flex items-center">
                                  <input type="text" required readOnly value={state} placeholder="Auto-filled via Pincode" className="w-full h-11 pl-4 pr-24 rounded-xl border border-slate-200 text-slate-700 bg-slate-50 text-xs focus:outline-none font-bold uppercase" />
                                  {city && state && <span className="absolute right-3.5 flex items-center gap-1 text-[10px] font-bold text-[#00A86B] bg-[#00A86B]/5 border border-[#00A86B]/15 px-2 py-0.5 rounded-full select-none"><Check className="w-3 h-3" /> Submitted</span>}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end pt-2">
                          {billingPreFilled ? (
                            <button type="button" onClick={() => setStep(2)} className="h-11 px-6 rounded-xl bg-[#00A86B] hover:bg-[#009B63] text-white text-xs font-bold shadow-lg shadow-[#00A86B]/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                              Go to Documents <ArrowRight className="w-4 h-4" />
                            </button>
                          ) : (
                            <button type="button" disabled={!address || !pincode || (businessType === 'COMPANY' && (!companyName || !gstin))} onClick={() => setStep(2)} className="h-11 px-6 rounded-xl bg-[#00A86B] hover:bg-[#009B63] text-white text-xs font-bold shadow-lg shadow-[#00A86B]/25 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none cursor-pointer">
                              Next <ArrowRight className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <form onSubmit={handleKycSubmit} className="space-y-6">
                  {/* Aadhaar */}
                  <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-5 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[#00A86B]" /> Aadhaar Verification
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5">Aadhaar Number<span className="text-red-500">*</span></label>
                        <div className="relative flex items-center">
                          <input type="text" required maxLength={12} placeholder="Enter 12-digit Aadhaar Number" value={aadhaarNumber} onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, ''))} disabled={isAadhaarVerified} className="w-full h-11 px-4 pr-24 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-[#00A86B] font-bold" />
                          {aadhaarNumber.length === 12 && !isAadhaarVerified && (
                            <button type="button" onClick={() => { setOtpTarget('aadhaar'); setIsOtpModalOpen(true); }} className="absolute right-3.5 text-xs font-bold text-[#00A86B] hover:text-[#009B63] select-none cursor-pointer focus:outline-none">Send OTP</button>
                          )}
                          {isAadhaarVerified && <span className="absolute right-3.5 flex items-center gap-1 text-[11px] font-bold text-[#00A86B] bg-[#00A86B]/5 border border-[#00A86B]/15 px-2 py-0.5 rounded-full"><Check className="w-3 h-3" /> Verified</span>}
                        </div>
                      </div>
                      {isAadhaarVerified && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-dashed border-slate-100">
                          <div><label className="block text-[10px] font-semibold text-slate-400 mb-1.5">Name</label><input type="text" readOnly value={aadhaarData.name} className="w-full h-10 px-3 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-600 font-bold" /></div>
                          <div><label className="block text-[10px] font-semibold text-slate-400 mb-1.5">Guardian Name</label><input type="text" readOnly value={aadhaarData.guardianName} className="w-full h-10 px-3 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-600 font-bold" /></div>
                          <div className="md:col-span-2"><label className="block text-[10px] font-semibold text-slate-400 mb-1.5">Address</label><input type="text" readOnly value={aadhaarData.address} className="w-full h-10 px-3 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-600 font-bold" /></div>
                          <div><label className="block text-[10px] font-semibold text-slate-400 mb-1.5">State</label><input type="text" readOnly value={aadhaarData.state} className="w-full h-10 px-3 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-600 font-bold" /></div>
                          <div><label className="block text-[10px] font-semibold text-slate-400 mb-1.5">City</label><input type="text" readOnly value={aadhaarData.city} className="w-full h-10 px-3 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-600 font-bold" /></div>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* PAN */}
                  <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-5 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#00A86B]" /> PAN Verification
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5">PAN Number<span className="text-red-500">*</span></label>
                        <div className="relative flex items-center">
                          <input type="text" required maxLength={10} placeholder="Enter 10-digit PAN Number (e.g. ABCDE1234F)" value={panNumber} onChange={(e) => setPanNumber(e.target.value.toUpperCase())} disabled={isPanVerified} className="w-full h-11 px-4 pr-24 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-[#00A86B] font-bold uppercase" />
                          {panNumber.length === 10 && !isPanVerified && (
                            <button type="button" onClick={handleVerifyPan} disabled={isPanLoading} className="absolute right-3.5 text-xs font-bold text-[#00A86B] hover:text-[#009B63] select-none cursor-pointer focus:outline-none flex items-center gap-1.5">
                              {isPanLoading ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : "Verify"}
                            </button>
                          )}
                          {isPanVerified && <span className="absolute right-3.5 flex items-center gap-1 text-[11px] font-bold text-[#00A86B] bg-[#00A86B]/5 border border-[#00A86B]/15 px-2 py-0.5 rounded-full"><Check className="w-3 h-3" /> Verified</span>}
                        </div>
                      </div>
                      {isPanVerified && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-dashed border-slate-100">
                          <div><label className="block text-[10px] font-semibold text-slate-400 mb-1.5">PAN Type<span className="text-red-500">*</span></label><input type="text" readOnly value={panData.panType} className="w-full h-10 px-3 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-600 font-bold" /></div>
                          <div><label className="block text-[10px] font-semibold text-slate-400 mb-1.5">Name<span className="text-red-500">*</span></label><input type="text" readOnly value={panData.name} className="w-full h-10 px-3 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-600 font-bold" /></div>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Bank */}
                  <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-5 flex items-center gap-2">
                      <Building className="w-4 h-4 text-[#00A86B]" /> Bank Details
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1.5">Account Number<span className="text-red-500">*</span></label>
                          <input type="text" required placeholder="Enter bank account number" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))} disabled={isBankVerified} className="w-full h-11 px-4 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-[#00A86B] font-bold" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1.5">IFSC Code<span className="text-red-500">*</span></label>
                          <div className="relative flex items-center">
                            <input type="text" required maxLength={11} placeholder="Enter 11-digit IFSC Code" value={ifscCode} onChange={(e) => setIfscCode(e.target.value.toUpperCase())} disabled={isBankVerified} className="w-full h-11 px-4 pr-24 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-[#00A86B] font-bold uppercase" />
                            {ifscCode.length === 11 && accountNumber && !isBankVerified && (
                              <button type="button" onClick={handleVerifyBank} disabled={isBankLoading} className="absolute right-3.5 text-xs font-bold text-[#00A86B] hover:text-[#009B63] select-none cursor-pointer focus:outline-none flex items-center gap-1.5">
                                {isBankLoading ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : "Verify"}
                              </button>
                            )}
                            {isBankVerified && <span className="absolute right-3.5 flex items-center gap-1 text-[11px] font-bold text-[#00A86B] bg-[#00A86B]/5 border border-[#00A86B]/15 px-2 py-0.5 rounded-full"><Check className="w-3 h-3" /> Verified</span>}
                          </div>
                        </div>
                      </div>
                      {isBankVerified && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-dashed border-slate-100">
                          <div><label className="block text-[10px] font-semibold text-slate-400 mb-1.5">Beneficiary Name<span className="text-red-500">*</span></label><input type="text" readOnly value={bankData.beneficiaryName} className="w-full h-10 px-3 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-600 font-bold" /></div>
                          <div><label className="block text-[10px] font-semibold text-slate-400 mb-1.5">Bank Name<span className="text-red-500">*</span></label><input type="text" readOnly value={bankData.bankName} className="w-full h-10 px-3 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-600 font-bold" /></div>
                          <div><label className="block text-[10px] font-semibold text-slate-400 mb-1.5">Branch Name<span className="text-red-500">*</span></label><input type="text" readOnly value={bankData.branchName} className="w-full h-10 px-3 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-600 font-bold" /></div>
                          <div><label className="block text-[10px] font-semibold text-slate-400 mb-1.5">City<span className="text-red-500">*</span></label><input type="text" readOnly value={bankData.city} className="w-full h-10 px-3 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-600 font-bold" /></div>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <button type="button" onClick={() => setStep(1)} className="h-11 px-5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <button type="submit" disabled={isSubmitting || !isAadhaarVerified || !isPanVerified || !isBankVerified} className="h-11 px-6 rounded-xl bg-[#00A86B] hover:bg-[#009B63] text-white text-xs font-bold shadow-lg shadow-[#00A86B]/25 transition-all flex items-center justify-center disabled:opacity-50 disabled:pointer-events-none cursor-pointer">
                      {isSubmitting ? <span className="flex items-center gap-2"><RefreshCcw className="w-4 h-4 animate-spin" /> Processing...</span> : "Submit KYC"}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          ) : (
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", duration: 0.5 }} className="bg-white rounded-2xl border border-slate-100 p-8 md:p-12 shadow-2xl text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-emerald-50 border-4 border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
                <FileCheck className="w-10 h-10 text-[#00A86B]" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-slate-800">KYC Verification Under Review</h2>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">Your Aadhaar, PAN Card, and Bank details have been successfully received. Our verification team is reviewing them. Usually, accounts are validated in less than 2 hours.</p>
              </div>
              <div className="bg-[#F8FAFC] border border-[#E2E8F0]/60 rounded-xl p-4 max-w-sm mx-auto text-left space-y-2.5">
                <div className="flex justify-between items-center text-[11px] font-bold text-slate-500"><span>Aadhaar KYC Status:</span><span className="text-[#00A86B]">SUCCESS ✓</span></div>
                <div className="flex justify-between items-center text-[11px] font-bold text-slate-500"><span>PAN KYC Status:</span><span className="text-[#00A86B]">SUCCESS ✓</span></div>
                <div className="flex justify-between items-center text-[11px] font-bold text-slate-500"><span>Bank Account Status:</span><span className="text-[#00A86B]">VERIFIED ✓</span></div>
              </div>
              <button onClick={() => navigate('/admin/dashboard')} className="h-11 px-8 rounded-full bg-[#00A86B] hover:bg-[#009B63] text-white text-xs font-bold transition-all shadow-lg shadow-[#00A86B]/25 cursor-pointer inline-flex items-center justify-center focus:outline-none">
                Back to Dashboard
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phone OTP Modal */}
        <AnimatePresence>
          {showPhoneOtpModal && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPhoneOtpModal(false)} className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm z-[200]" />
              <div className="fixed inset-0 flex items-center justify-center z-[201] p-4 pointer-events-none">
                <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', duration: 0.5 }} className="w-full max-w-[360px] bg-white rounded-3xl shadow-[0_24px_48px_rgba(0,0,0,0.16)] p-6 relative pointer-events-auto border border-slate-100 text-center">
                  <button type="button" onClick={() => setShowPhoneOtpModal(false)} className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-slate-50 transition-colors border border-slate-100 cursor-pointer focus:outline-none">
                    <X className="w-4 h-4 text-slate-500" />
                  </button>
                  <div className="mt-2 mb-4">
                    <h2 className="text-base font-bold text-slate-800 mb-1">Verify Phone OTP</h2>
                    <p className="text-xs text-slate-500">OTP sent to +91 {phoneNumber}</p>
                  </div>
                  <div className="h-[1px] bg-slate-100 mb-5" />
                  <div className="flex justify-center gap-2 mb-4">
                    {phoneOtpValues.map((val, idx) => (
                      <input key={idx} type="tel" maxLength={1} inputMode="numeric" value={val}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/, '');
                          const next = [...phoneOtpValues]; next[idx] = v; setPhoneOtpValues(next);
                          if (v && idx < 5) (document.getElementById(`potp-${idx + 1}`) as HTMLInputElement)?.focus();
                        }}
                        onKeyDown={(e) => { if (e.key === 'Backspace' && !val && idx > 0) (document.getElementById(`potp-${idx - 1}`) as HTMLInputElement)?.focus(); }}
                        id={`potp-${idx}`}
                        className="w-11 h-11 rounded-xl border border-slate-200 text-center text-lg font-bold text-[#00A86B] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]"
                      />
                    ))}
                  </div>
                  <button type="button" onClick={verifyPhoneOtp} disabled={verifyingPhoneOtp || phoneOtpValues.join('').length !== 6} className="w-full h-10 rounded-full bg-[#00A86B] hover:bg-[#009B63] text-white text-xs font-bold disabled:opacity-50 disabled:pointer-events-none mb-3 cursor-pointer">
                    {verifyingPhoneOtp ? 'Verifying...' : 'Verify OTP'}
                  </button>
                  <p className="text-xs text-slate-400">
                    {phoneOtpTimer > 0 ? `Resend in ${phoneOtpTimer}s` : <span className="text-[#00A86B] cursor-pointer font-bold hover:underline" onClick={sendPhoneOtp}>Resend OTP</span>}
                  </p>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>

        {/* Email OTP Modal */}
        <AnimatePresence>
          {showEmailOtpModal && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowEmailOtpModal(false)} className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm z-[200]" />
              <div className="fixed inset-0 flex items-center justify-center z-[201] p-4 pointer-events-none">
                <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', duration: 0.5 }} className="w-full max-w-[360px] bg-white rounded-3xl shadow-[0_24px_48px_rgba(0,0,0,0.16)] p-6 relative pointer-events-auto border border-slate-100 text-center">
                  <button type="button" onClick={() => setShowEmailOtpModal(false)} className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-slate-50 transition-colors border border-slate-100 cursor-pointer focus:outline-none">
                    <X className="w-4 h-4 text-slate-500" />
                  </button>
                  <div className="mt-2 mb-4">
                    <h2 className="text-base font-bold text-slate-800 mb-1">Verify Email OTP</h2>
                    <p className="text-xs text-slate-500">OTP sent to {email}</p>
                  </div>
                  <div className="h-[1px] bg-slate-100 mb-5" />
                  <div className="flex justify-center gap-2 mb-4">
                    {emailOtpValues.map((val, idx) => (
                      <input key={idx} type="tel" maxLength={1} inputMode="numeric" value={val}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/, '');
                          const next = [...emailOtpValues]; next[idx] = v; setEmailOtpValues(next);
                          if (v && idx < 5) (document.getElementById(`eotp-${idx + 1}`) as HTMLInputElement)?.focus();
                        }}
                        onKeyDown={(e) => { if (e.key === 'Backspace' && !val && idx > 0) (document.getElementById(`eotp-${idx - 1}`) as HTMLInputElement)?.focus(); }}
                        id={`eotp-${idx}`}
                        className="w-11 h-11 rounded-xl border border-slate-200 text-center text-lg font-bold text-[#00A86B] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]"
                      />
                    ))}
                  </div>
                  <button type="button" onClick={verifyEmailOtp} disabled={verifyingEmailOtp || emailOtpValues.join('').length !== 6} className="w-full h-10 rounded-full bg-[#00A86B] hover:bg-[#009B63] text-white text-xs font-bold disabled:opacity-50 disabled:pointer-events-none mb-3 cursor-pointer">
                    {verifyingEmailOtp ? 'Verifying...' : 'Verify OTP'}
                  </button>
                  <p className="text-xs text-slate-400">
                    {emailOtpTimer > 0 ? `Resend in ${emailOtpTimer}s` : <span className="text-[#00A86B] cursor-pointer font-bold hover:underline" onClick={sendEmailOtp}>Resend OTP</span>}
                  </p>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>

        {/* Aadhaar OTP Modal */}
        <AnimatePresence>
          {isOtpModalOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeOtpModal} className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm z-[200]" />
              <div className="fixed inset-0 flex items-center justify-center z-[201] p-4 pointer-events-none">
                <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: "spring", duration: 0.5 }} className="w-full max-w-[360px] bg-white rounded-3xl shadow-[0_24px_48px_rgba(0,0,0,0.16)] p-6 relative pointer-events-auto border border-slate-100 text-center">
                  <button type="button" onClick={closeOtpModal} className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:bg-slate-50 transition-colors border border-slate-100 cursor-pointer focus:outline-none">
                    <X className="w-4 h-4 text-slate-500" />
                  </button>
                  <div className="mt-2 mb-6">
                    <h2 className="text-lg font-bold text-slate-800 mb-1">Verify OTP</h2>
                    <p className="text-xs text-slate-500 leading-relaxed px-4">Verify your identity with the OTP sent to your phone!</p>
                  </div>
                  <div className="h-[1px] bg-slate-100 mb-6" />
                  <div className="flex justify-center gap-3.5 mb-5">
                    {otpValues.map((value, idx) => (
                      <input key={idx} ref={otpInputRefs[idx]} type="text" maxLength={1} inputMode="numeric" pattern="[0-9]*" value={value} onChange={(e) => handleOtpChange(idx, e.target.value)} onKeyDown={(e) => handleOtpKeyDown(idx, e)} className="w-16 h-16 rounded-xl border border-slate-200 text-center text-2xl font-bold text-[#00A86B] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B] bg-white shadow-sm otp-box" />
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 font-medium mb-6">Didn't get a code? <span className="text-[#00A86B] font-bold cursor-pointer hover:underline">Click to resend.</span></p>
                  <div className="flex gap-3">
                    <button type="button" onClick={closeOtpModal} className="flex-1 h-11 rounded-full border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all focus:outline-none cursor-pointer">Cancel</button>
                    <button type="button" onClick={handleVerifyOtp} disabled={otpValues.join('').length < 4} className="flex-1 h-11 rounded-full bg-[#00A86B] hover:bg-[#009B63] text-white text-xs font-bold shadow-lg shadow-[#00A86B]/25 transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer focus:outline-none">Verify</button>
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
}
