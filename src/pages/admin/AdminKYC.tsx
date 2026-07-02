import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { 
  Wallet, 
  Check, 
  X, 
  Mail, 
  Phone, 
  MapPin, 
  Building2, 
  User, 
  FileText, 
  CreditCard, 
  ShieldCheck, 
  Lock, 
  ArrowLeft, 
  ArrowRight, 
  RefreshCcw, 
  AlertCircle,
  Building,
  CheckCircle2,
  FileCheck,
  ChevronRight
} from 'lucide-react';

export function AdminKYC() {
  const navigate = useNavigate();

  // Navigation / Stepper State
  const [step, setStep] = useState<1 | 2>(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal States
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otpTarget, setOtpTarget] = useState<'aadhaar' | 'phone'>('aadhaar');

  // Input Fields State - Step 1
  const [email] = useState('abc@gmail.com');
  const [phoneNumber] = useState('+91 9876543210');
  const [address, setAddress] = useState('abc flor, JMD megapolis, 630 Badshahpur Sohna Rd, Hwy, Sector 48');
  const [pincode, setPincode] = useState('123456');
  const [city, setCity] = useState('GURUGRAM');
  const [state, setState] = useState('HARYANA');
  const [businessType, setBusinessType] = useState<'INDIVIDUAL' | 'COMPANY' | null>(null);
  const [companyName, setCompanyName] = useState('QuickPost Logistics Pvt Ltd');
  const [gstin, setGstin] = useState('06AABCQ1234A1Z5');
  const [isGstinVerified, setIsGstinVerified] = useState(true);
  const [isGstinLoading, setIsGstinLoading] = useState(false);

  // Input Fields State - Step 2
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [isAadhaarVerified, setIsAadhaarVerified] = useState(false);
  const [aadhaarData, setAadhaarData] = useState({
    name: '',
    guardianName: '',
    address: '',
    state: '',
    city: ''
  });

  const [panNumber, setPanNumber] = useState('');
  const [isPanVerified, setIsPanVerified] = useState(false);
  const [isPanLoading, setIsPanLoading] = useState(false);
  const [panData, setPanData] = useState({
    panType: '',
    name: ''
  });

  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [isBankVerified, setIsBankVerified] = useState(false);
  const [isBankLoading, setIsBankLoading] = useState(false);
  const [bankData, setBankData] = useState({
    beneficiaryName: '',
    bankName: '',
    branchName: '',
    city: ''
  });

  // OTP Verification Code Inputs
  const [otpValues, setOtpValues] = useState(['', '', '', '']);
  const otpInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  // Auto-focus next input field for OTP digits
  const handleOtpChange = (index: number, value: string) => {
    // Only accept numeric inputs
    const cleanValue = value.replace(/\D/g, '');
    if (!cleanValue && value !== '') return;

    const newOtpValues = [...otpValues];
    newOtpValues[index] = cleanValue.slice(-1); // Only take last character
    setOtpValues(newOtpValues);

    // Auto focus next
    if (cleanValue !== '' && index < 3) {
      otpInputRefs[index + 1].current?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Auto focus previous on backspace
    if (e.key === 'Backspace' && otpValues[index] === '' && index > 0) {
      otpInputRefs[index - 1].current?.focus();
    }
  };

  // Resets the OTP modal states
  const closeOtpModal = () => {
    setIsOtpModalOpen(false);
    setOtpValues(['', '', '', '']);
  };

  // Verify OTP Action
  const handleVerifyOtp = () => {
    const enteredOtp = otpValues.join('');
    if (enteredOtp.length < 4) return;

    if (otpTarget === 'aadhaar') {
      setIsAadhaarVerified(true);
      setAadhaarData({
        name: 'Dinesh Tharwani',
        guardianName: 'Ram Tharwani',
        address: 'Flat 302, Galaxy Apartments, Sector 45',
        state: 'HARYANA',
        city: 'GURUGRAM'
      });
    }
    closeOtpModal();
  };

  // Auto-fill City & State on Pincode changes
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  useEffect(() => {
    if (pincode.length === 6) {
      if (pincode === '123456') {
        setCity('GURUGRAM');
        setState('HARYANA');
      } else if (pincode.startsWith('11')) {
        setCity('NEW DELHI');
        setState('DELHI');
      } else if (pincode.startsWith('40')) {
        setCity('MUMBAI');
        setState('MAHARASHTRA');
      }
    }
  }, [pincode]);

  // Handles inline PAN verification trigger
  const handleVerifyPan = () => {
    if (!panNumber || panNumber.length < 10) return;
    setIsPanLoading(true);
    setTimeout(() => {
      setIsPanVerified(true);
      setIsPanLoading(false);
      setPanData({
        panType: businessType === 'COMPANY' ? 'PRIVATE LIMITED' : 'INDIVIDUAL',
        name: 'DINESH THARWANI'
      });
    }, 1200);
  };

  // Handles inline Bank IFSC verification trigger
  const handleVerifyBank = () => {
    if (!accountNumber || !ifscCode || ifscCode.length < 11) return;
    setIsBankLoading(true);
    setTimeout(() => {
      setIsBankVerified(true);
      setIsBankLoading(false);
      setBankData({
        beneficiaryName: 'DINESH THARWANI',
        bankName: 'HDFC BANK',
        branchName: 'SOHNA ROAD BRANCH',
        city: 'GURUGRAM'
      });
    }, 1200);
  };

  // Submits the entire KYC application
  const handleKycSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAadhaarVerified || !isPanVerified || !isBankVerified) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 1800);
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto text-[#0F172A] pb-16 font-sans admin-kyc-wrapper" style={{ fontFamily: "'Roboto', sans-serif" }}>
        
        {/* Scoped CSS overrides for Roboto, 14px headings, and 13px fields */}
        <style dangerouslySetInnerHTML={{__html: `
          @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
          
          .admin-kyc-wrapper, .admin-kyc-wrapper * {
            font-family: 'Roboto', sans-serif !important;
          }
          
          /* Headings of each card/section: 14px */
          .admin-kyc-wrapper h3,
          .admin-kyc-wrapper .heading-14 {
            font-size: 14px !important;
          }
          
          /* Each field (labels, inputs, textareas, selects, option descriptions, button texts): 13px */
          .admin-kyc-wrapper label,
          .admin-kyc-wrapper input:not(.otp-box),
          .admin-kyc-wrapper textarea,
          .admin-kyc-wrapper select,
          .admin-kyc-wrapper button,
          .admin-kyc-wrapper p:not(.subtext),
          .admin-kyc-wrapper span:not(.heading-14) {
            font-size: 13px !important;
          }
        `}} />
        
        {/* Stepper Header */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {/* Step 1 Tab Indicator */}
          <div 
            onClick={() => !isSubmitted && setStep(1)}
            className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
              step === 1 
                ? 'bg-[#F0FDF4] border-[#00A86B]/30 shadow-sm' 
                : 'bg-white border-slate-100 hover:bg-slate-50'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              step === 1 || isAadhaarVerified ? 'bg-[#00A86B] text-white' : 'bg-slate-100 text-slate-400'
            }`}>
              {isAadhaarVerified ? <Check className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
            </div>
            <div className="text-left">
              <h3 className={`text-[14px] font-bold ${step === 1 ? 'text-[#0F172A]' : 'text-slate-500'} font-sans`}>Billing Information</h3>
              <p className="text-xs text-slate-400 font-normal leading-tight mt-1 font-sans subtext">Manage your billing details and payment methods here.</p>
            </div>
            {step === 2 && (
              <ChevronRight className="w-5 h-5 text-slate-400 ml-auto shrink-0" />
            )}
          </div>

          {/* Step 2 Tab Indicator */}
          <div 
            onClick={() => {
              if (!isSubmitted && businessType && address && pincode) {
                setStep(2);
              }
            }}
            className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
              businessType && address && pincode ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'
            } ${
              step === 2 
                ? 'bg-[#F0FDF4] border-[#00A86B]/30 shadow-sm' 
                : 'bg-white border-slate-100 hover:bg-slate-50'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              step === 2 ? 'bg-[#00A86B] text-white' : 'bg-slate-100 text-slate-400'
            }`}>
              <FileText className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h3 className={`text-[14px] font-bold ${step === 2 ? 'text-[#0F172A]' : 'text-slate-500'} font-sans`}>Document Verification</h3>
              <p className="text-xs text-slate-400 font-normal leading-tight mt-1 font-sans subtext">Verify documents quickly and securely to ensure authenticity.</p>
            </div>
          </div>
        </div>

        {/* Form Container */}
        <AnimatePresence mode="wait">
          {!isSubmitted ? (
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              {step === 1 ? (
                /* ── STEP 1: BUSINESS TYPE & BILLING INFORMATION ── */
                <div className="space-y-6">
                  
                  {/* Business Type Card - VISIBLE FIRST */}
                  <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-5 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[#00A86B]" /> Select Business Type <span className="text-red-500">*</span>
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Individual Option */}
                      <div 
                        onClick={() => setBusinessType('INDIVIDUAL')}
                        className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                          businessType === 'INDIVIDUAL' 
                            ? 'border-[#00A86B] bg-[#F0FDF4]/40' 
                            : 'border-slate-100 hover:border-slate-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2.5">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            businessType === 'INDIVIDUAL' ? 'border-[#00A86B]' : 'border-slate-300'
                          }`}>
                            {businessType === 'INDIVIDUAL' && <div className="w-2 h-2 rounded-full bg-[#00A86B]" />}
                          </div>
                          <span className="text-[14px] font-bold text-slate-800 uppercase tracking-wide font-sans heading-14">Individual</span>
                        </div>
                        <p className="text-xs text-slate-400 font-normal leading-relaxed font-sans">
                          A seller using online platforms without registering under the Companies Act
                        </p>
                      </div>

                      {/* Company Option */}
                      <div 
                        onClick={() => setBusinessType('COMPANY')}
                        className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                          businessType === 'COMPANY' 
                            ? 'border-[#00A86B] bg-[#F0FDF4]/40' 
                            : 'border-slate-100 hover:border-slate-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2.5">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            businessType === 'COMPANY' ? 'border-[#00A86B]' : 'border-slate-300'
                          }`}>
                            {businessType === 'COMPANY' && <div className="w-2 h-2 rounded-full bg-[#00A86B]" />}
                          </div>
                          <span className="text-[14px] font-bold text-slate-800 uppercase tracking-wide font-sans heading-14">Company</span>
                        </div>
                        <p className="text-xs text-slate-400 font-normal leading-relaxed font-sans">
                          (Registered as LLP, Private, Subsidiary, Holding, etc. under Companies Act 2013)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Fields Appear After Business Type Selection */}
                  <AnimatePresence>
                    {businessType && (
                      <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                      >
                        {/* If COMPANY is selected, show Company & GST Details Card */}
                        {businessType === 'COMPANY' && (
                          <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm">
                            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-5 flex items-center gap-2">
                              <Building className="w-4 h-4 text-[#00A86B]" /> Company Legal & GST Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                              <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Legal Company Name<span className="text-red-500">*</span></label>
                                <input
                                  type="text"
                                  value={companyName}
                                  onChange={(e) => setCompanyName(e.target.value)}
                                  placeholder="Enter Registered Company Name"
                                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-[#00A86B] font-bold"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5">GSTIN Number<span className="text-red-500">*</span></label>
                                <div className="relative flex items-center">
                                  <input
                                    type="text"
                                    maxLength={15}
                                    value={gstin}
                                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                                    disabled={isGstinVerified}
                                    placeholder="Enter 15-digit GSTIN"
                                    className="w-full h-11 px-4 pr-24 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-[#00A86B] font-bold uppercase"
                                  />
                                  {!isGstinVerified ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setIsGstinLoading(true);
                                        setTimeout(() => {
                                          setIsGstinVerified(true);
                                          setIsGstinLoading(false);
                                        }, 1000);
                                      }}
                                      disabled={isGstinLoading || gstin.length < 15}
                                      className="absolute right-3.5 text-xs font-bold text-[#00A86B] hover:text-[#009B63] select-none cursor-pointer focus:outline-none flex items-center gap-1.5 disabled:opacity-50"
                                    >
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

                        {/* Mandatory Information Card */}
                        <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm">
                          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-5 flex items-center gap-2">
                            <Lock className="w-4 h-4 text-[#00A86B]" /> Mandatory Information
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Email Field */}
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Email<span className="text-red-500">*</span></label>
                              <div className="relative flex items-center">
                                <input
                                  type="email"
                                  readOnly
                                  value={email}
                                  className="w-full h-11 pl-10 pr-24 rounded-xl border border-slate-200 text-slate-700 bg-slate-50 text-xs focus:outline-none font-bold"
                                />
                                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5" />
                                <span className="absolute right-3.5 flex items-center gap-1 text-[11px] font-bold text-[#00A86B] bg-[#00A86B]/5 border border-[#00A86B]/15 px-2 py-0.5 rounded-full">
                                  <Check className="w-3 h-3" /> Verified
                                </span>
                              </div>
                            </div>

                            {/* Phone Number Field */}
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Phone Number<span className="text-red-500">*</span></label>
                              <div className="relative flex items-center">
                                <input
                                  type="text"
                                  readOnly
                                  value={phoneNumber}
                                  className="w-full h-11 pl-10 pr-24 rounded-xl border border-slate-200 text-slate-700 bg-slate-50 text-xs focus:outline-none font-bold"
                                />
                                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5" />
                                <span className="absolute right-3.5 flex items-center gap-1 text-[11px] font-bold text-[#00A86B] bg-[#00A86B]/5 border border-[#00A86B]/15 px-2 py-0.5 rounded-full">
                                  <Check className="w-3 h-3" /> Verified
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Billing Details Card */}
                        <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm">
                          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-5 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-[#00A86B]" /> {businessType === 'COMPANY' ? 'Registered Office / Billing Address' : 'Billing Information'}
                          </h3>
                          
                          <div className="space-y-4">
                            {/* Address Textarea */}
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Address<span className="text-red-500">*</span></label>
                              <textarea
                                rows={2}
                                required
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="Enter your registered billing address"
                                className="w-full p-4 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B] font-medium leading-relaxed resize-none"
                              />
                            </div>

                            {/* Pincode, City, State Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {/* Pincode */}
                              <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Pincode<span className="text-red-500">*</span></label>
                                <input
                                  type="text"
                                  required
                                  maxLength={6}
                                  placeholder="Enter 6-digit Pincode"
                                  value={pincode}
                                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-[#00A86B] font-bold"
                                />
                              </div>

                              {/* City */}
                              <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5">City<span className="text-red-500">*</span></label>
                                <input
                                  type="text"
                                  required
                                  readOnly
                                  value={city}
                                  placeholder="Auto-filled via Pincode"
                                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-slate-700 bg-slate-50 text-xs focus:outline-none font-bold uppercase"
                                />
                              </div>

                              {/* State */}
                              <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5">State<span className="text-red-500">*</span></label>
                                <div className="relative flex items-center">
                                  <input
                                    type="text"
                                    required
                                    readOnly
                                    value={state}
                                    placeholder="Auto-filled via Pincode"
                                    className="w-full h-11 pl-4 pr-24 rounded-xl border border-slate-200 text-slate-700 bg-slate-50 text-xs focus:outline-none font-bold uppercase"
                                  />
                                  {city && state && (
                                    <span className="absolute right-3.5 flex items-center gap-1 text-[10px] font-bold text-[#00A86B] bg-[#00A86B]/5 border border-[#00A86B]/15 px-2 py-0.5 rounded-full select-none">
                                      <Check className="w-3 h-3" /> Submitted
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Actions Bar */}
                        <div className="flex justify-end pt-2">
                          <button
                            type="button"
                            disabled={!address || !pincode || (businessType === 'COMPANY' && (!companyName || !gstin))}
                            onClick={() => setStep(2)}
                            className="h-11 px-6 rounded-xl bg-[#00A86B] hover:bg-[#009B63] text-white text-xs font-bold shadow-lg shadow-[#00A86B]/25 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                          >
                            Next <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                /* ── STEP 2: DOCUMENT VERIFICATION ── */
                <form onSubmit={handleKycSubmit} className="space-y-6">
                  
                  {/* Aadhaar Verification Card */}
                  <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-5 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[#00A86B]" /> Aadhaar Verification
                    </h3>
                    
                    <div className="space-y-4">
                      {/* Aadhaar Input */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5">Aadhaar Number<span className="text-red-500">*</span></label>
                        <div className="relative flex items-center">
                          <input
                            type="text"
                            required
                            maxLength={12}
                            placeholder="Enter 12-digit Aadhaar Number"
                            value={aadhaarNumber}
                            onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, ''))}
                            disabled={isAadhaarVerified}
                            className="w-full h-11 px-4 pr-24 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-[#00A86B] font-bold"
                          />
                          {aadhaarNumber.length === 12 && !isAadhaarVerified && (
                            <button
                              type="button"
                              onClick={() => {
                                setOtpTarget('aadhaar');
                                setIsOtpModalOpen(true);
                              }}
                              className="absolute right-3.5 text-xs font-bold text-[#00A86B] hover:text-[#009B63] select-none cursor-pointer focus:outline-none"
                            >
                              Send OTP
                            </button>
                          )}
                          {isAadhaarVerified && (
                            <span className="absolute right-3.5 flex items-center gap-1 text-[11px] font-bold text-[#00A86B] bg-[#00A86B]/5 border border-[#00A86B]/15 px-2 py-0.5 rounded-full">
                              <Check className="w-3 h-3" /> Verified
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Auto-filled Aadhaar Data Fields */}
                      {isAadhaarVerified && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-dashed border-slate-100"
                        >
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-400 mb-1.5">Name</label>
                            <input type="text" readOnly value={aadhaarData.name} className="w-full h-10 px-3 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-600 font-bold" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-400 mb-1.5">Guardian Name</label>
                            <input type="text" readOnly value={aadhaarData.guardianName} className="w-full h-10 px-3 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-600 font-bold" />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-[10px] font-semibold text-slate-400 mb-1.5">Address</label>
                            <input type="text" readOnly value={aadhaarData.address} className="w-full h-10 px-3 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-600 font-bold" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-400 mb-1.5">State</label>
                            <input type="text" readOnly value={aadhaarData.state} className="w-full h-10 px-3 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-600 font-bold" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-400 mb-1.5">City</label>
                            <input type="text" readOnly value={aadhaarData.city} className="w-full h-10 px-3 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-600 font-bold" />
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* PAN Verification Card */}
                  <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-5 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#00A86B]" /> PAN Verification
                    </h3>
                    
                    <div className="space-y-4">
                      {/* PAN Number Input */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5">PAN Number<span className="text-red-500">*</span></label>
                        <div className="relative flex items-center">
                          <input
                            type="text"
                            required
                            maxLength={10}
                            placeholder="Enter 10-digit PAN Number (e.g. ABCDE1234F)"
                            value={panNumber}
                            onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                            disabled={isPanVerified}
                            className="w-full h-11 px-4 pr-24 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-[#00A86B] font-bold uppercase"
                          />
                          {panNumber.length === 10 && !isPanVerified && (
                            <button
                              type="button"
                              onClick={handleVerifyPan}
                              disabled={isPanLoading}
                              className="absolute right-3.5 text-xs font-bold text-[#00A86B] hover:text-[#009B63] select-none cursor-pointer focus:outline-none flex items-center gap-1.5"
                            >
                              {isPanLoading ? (
                                <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
                              ) : "Verify"}
                            </button>
                          )}
                          {isPanVerified && (
                            <span className="absolute right-3.5 flex items-center gap-1 text-[11px] font-bold text-[#00A86B] bg-[#00A86B]/5 border border-[#00A86B]/15 px-2 py-0.5 rounded-full">
                              <Check className="w-3 h-3" /> Verified
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Auto-filled PAN Data */}
                      {isPanVerified && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-dashed border-slate-100"
                        >
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-400 mb-1.5">PAN Type<span className="text-red-500">*</span></label>
                            <input type="text" readOnly value={panData.panType} className="w-full h-10 px-3 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-600 font-bold" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-400 mb-1.5">Name<span className="text-red-500">*</span></label>
                            <input type="text" readOnly value={panData.name} className="w-full h-10 px-3 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-600 font-bold" />
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Bank Details Card */}
                  <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-5 flex items-center gap-2">
                      <Building className="w-4 h-4 text-[#00A86B]" /> Bank Details
                    </h3>
                    
                    <div className="space-y-4">
                      {/* Account Number & IFSC Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Account Number */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1.5">Account Number<span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            required
                            placeholder="Enter bank account number"
                            value={accountNumber}
                            onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                            disabled={isBankVerified}
                            className="w-full h-11 px-4 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-[#00A86B] font-bold"
                          />
                        </div>

                        {/* IFSC Code */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1.5">IFSC Code<span className="text-red-500">*</span></label>
                          <div className="relative flex items-center">
                            <input
                              type="text"
                              required
                              maxLength={11}
                              placeholder="Enter 11-digit IFSC Code"
                              value={ifscCode}
                              onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                              disabled={isBankVerified}
                              className="w-full h-11 px-4 pr-24 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-[#00A86B] font-bold uppercase"
                            />
                            {ifscCode.length === 11 && accountNumber && !isBankVerified && (
                              <button
                                type="button"
                                onClick={handleVerifyBank}
                                disabled={isBankLoading}
                                className="absolute right-3.5 text-xs font-bold text-[#00A86B] hover:text-[#009B63] select-none cursor-pointer focus:outline-none flex items-center gap-1.5"
                              >
                                {isBankLoading ? (
                                  <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
                                ) : "Verify"}
                              </button>
                            )}
                            {isBankVerified && (
                              <span className="absolute right-3.5 flex items-center gap-1 text-[11px] font-bold text-[#00A86B] bg-[#00A86B]/5 border border-[#00A86B]/15 px-2 py-0.5 rounded-full">
                                <Check className="w-3 h-3" /> Verify
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Auto-filled Bank Fields */}
                      {isBankVerified && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-dashed border-slate-100"
                        >
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-400 mb-1.5">Beneficiary Name<span className="text-red-500">*</span></label>
                            <input type="text" readOnly value={bankData.beneficiaryName} className="w-full h-10 px-3 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-600 font-bold" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-400 mb-1.5">Bank Name<span className="text-red-500">*</span></label>
                            <input type="text" readOnly value={bankData.bankName} className="w-full h-10 px-3 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-600 font-bold" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-400 mb-1.5">Branch Name<span className="text-red-500">*</span></label>
                            <input type="text" readOnly value={bankData.branchName} className="w-full h-10 px-3 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-600 font-bold" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-400 mb-1.5">City<span className="text-red-500">*</span></label>
                            <input type="text" readOnly value={bankData.city} className="w-full h-10 px-3 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-600 font-bold" />
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex justify-between items-center pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="h-11 px-5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" /> Next
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting || !isAadhaarVerified || !isPanVerified || !isBankVerified}
                      className="h-11 px-6 rounded-xl bg-[#00A86B] hover:bg-[#009B63] text-white text-xs font-bold shadow-lg shadow-[#00A86B]/25 transition-all flex items-center justify-center disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <RefreshCcw className="w-4 h-4 animate-spin" /> Processing...
                        </span>
                      ) : "Submit KYC"}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          ) : (
            /* ── SUCCESS STATE ── */
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white rounded-2xl border border-slate-100 p-8 md:p-12 shadow-2xl text-center space-y-6"
            >
              <div className="w-20 h-20 rounded-full bg-emerald-50 border-4 border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
                <FileCheck className="w-10 h-10 text-[#00A86B]" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-slate-800">KYC Verification Under Review</h2>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Your Aadhaar, PAN Card, and Bank details have been successfully received. Our verification team is reviewining them. Usually, accounts are validated in less than 2 hours.
                </p>
              </div>
              <div className="bg-[#F8FAFC] border border-[#E2E8F0]/60 rounded-xl p-4 max-w-sm mx-auto text-left space-y-2.5">
                <div className="flex justify-between items-center text-[11px] font-bold text-slate-500">
                  <span>Aadhaar KYC Status:</span>
                  <span className="text-[#00A86B]">SUCCESS ✓</span>
                </div>
                <div className="flex justify-between items-center text-[11px] font-bold text-slate-500">
                  <span>PAN KYC Status:</span>
                  <span className="text-[#00A86B]">SUCCESS ✓</span>
                </div>
                <div className="flex justify-between items-center text-[11px] font-bold text-slate-500">
                  <span>Bank Account Status:</span>
                  <span className="text-[#00A86B]">VERIFIED ✓</span>
                </div>
              </div>
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="h-11 px-8 rounded-full bg-[#00A86B] hover:bg-[#009B63] text-white text-xs font-bold transition-all shadow-lg shadow-[#00A86B]/25 cursor-pointer inline-flex items-center justify-center focus:outline-none"
              >
                Back to Dashboard
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── OTP Verification Modal ── */}
        <AnimatePresence>
          {isOtpModalOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={closeOtpModal}
                className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm z-[200]"
              />

              {/* Modal Container */}
              <div className="fixed inset-0 flex items-center justify-center z-[201] p-4 pointer-events-none">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  transition={{ type: "spring", duration: 0.5 }}
                  className="w-full max-w-[360px] bg-white rounded-3xl shadow-[0_24px_48px_rgba(0,0,0,0.16)] p-6 relative pointer-events-auto border border-slate-100 text-center"
                >
                  {/* Center Top Overlapping Close Button */}
                  <button
                    type="button"
                    onClick={closeOtpModal}
                    className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:bg-slate-50 transition-colors border border-slate-100 cursor-pointer focus:outline-none"
                  >
                    <X className="w-4 h-4 text-slate-500" />
                  </button>

                  {/* Title & Subtitle */}
                  <div className="mt-2 mb-6">
                    <h2 className="text-lg font-bold text-slate-800 mb-1">Verify OTP</h2>
                    <p className="text-xs text-slate-500 leading-relaxed px-4">Verify your identity with the OTP sent to your phone!</p>
                  </div>

                  <div className="h-[1px] bg-slate-100 mb-6" />

                  {/* 4 Digit OTP Box Inputs */}
                  <div className="flex justify-center gap-3.5 mb-5">
                    {otpValues.map((value, idx) => (
                      <input
                        key={idx}
                        ref={otpInputRefs[idx]}
                        type="text"
                        maxLength={1}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={value}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className="w-16 h-16 rounded-xl border border-slate-200 text-center text-2xl font-bold text-[#00A86B] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B] bg-white shadow-sm otp-box"
                      />
                    ))}
                  </div>

                  {/* Resend OTP Link */}
                  <p className="text-xs text-slate-400 font-medium mb-6">
                    Didn’t get a code? <span className="text-[#00A86B] font-bold cursor-pointer hover:underline">Click to resend.</span>
                  </p>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={closeOtpModal}
                      className="flex-1 h-11 rounded-full border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all focus:outline-none cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={otpValues.join('').length < 4}
                      className="flex-1 h-11 rounded-full bg-[#00A86B] hover:bg-[#009B63] text-white text-xs font-bold shadow-lg shadow-[#00A86B]/25 transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer focus:outline-none"
                    >
                      Verify
                    </button>
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
