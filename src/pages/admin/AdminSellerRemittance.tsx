import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { useToast } from '../../hooks/useToast';
import { Toast } from '../../components/ui/Toast';
import { useTableLoader } from '../../hooks/useTableLoader';
import { TableLoader } from '../../components/ui/TableLoader';
import { ShineButton } from '../../components/ui/ShineButton';
import { Landmark, Zap, FileClock, ChevronDown, CheckCircle2, Clock, Info, RefreshCcw, Pencil, ExternalLink, Check, Power, Ban, TrendingUp } from 'lucide-react';
import turnoffIllustration from '../../assets/postpaid-turnoff.png';

type SubTab = 'bank-details' | 'early-cod' | 'postpaid-plan';

const SUB_TABS: { id: SubTab; label: string; icon: typeof Landmark }[] = [
  { id: 'bank-details', label: 'Bank Details', icon: Landmark },
  { id: 'early-cod', label: 'Early COD Remittance', icon: Zap },
  { id: 'postpaid-plan', label: 'Postpaid Plan', icon: FileClock },
];

/* ── Early COD Remittance plan data ── */
interface EcodPlan {
  id: string;
  days: number;
  charge: number;
  popular?: boolean;
}

const ECOD_PLANS: EcodPlan[] = [
  { id: '2day', days: 2, charge: 0.99, popular: true },
  { id: '3day', days: 3, charge: 0.69 },
  { id: '4day', days: 4, charge: 0.49 },
];

const WHY_ACTIVATE = [
  'Get guaranteed remittance in just 2* days from the shipment delivered date.',
  'Grow your business by removing cash flow restrictions.',
  'Get full control over your remittance cycle and take better decisions for your business.',
];

interface ActivationRecord {
  id: string;
  planDays: number;
  charge: number;
  activatedOn: string;
  status: 'Active' | 'Deactivated';
}

function EarlyCodRemittancePanel() {
  const { toast, showToast, closeToast } = useToast();
  const { isLoading } = useTableLoader(700);
  const [agreedPlan, setAgreedPlan] = useState<Record<string, boolean>>({});
  const [activatingPlan, setActivatingPlan] = useState<string | null>(null);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [history, setHistory] = useState<ActivationRecord[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const toggleAgree = (planId: string) =>
    setAgreedPlan((prev) => ({ ...prev, [planId]: !prev[planId] }));

  const handleActivate = (plan: EcodPlan) => {
    if (!agreedPlan[plan.id] || activatingPlan) return;
    setActivatingPlan(plan.id);
    // Backend integration pending — simulate the activation round-trip locally.
    setTimeout(() => {
      setActivePlanId(plan.id);
      setActivatingPlan(null);
      setHistory((prev) => [
        {
          id: `${plan.id}-${Date.now()}`,
          planDays: plan.days,
          charge: plan.charge,
          activatedOn: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          status: 'Active',
        },
        ...prev,
      ]);
      showToast('success', `${plan.days}-Day Early COD plan activated successfully!`);
    }, 900);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="relative w-20 h-20">
          <TableLoader />
        </div>
        <p className="text-[13px] font-semibold text-[#94A3B8]">Loading Early COD Remittance plans…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[20px] font-bold text-[#0F172A]">Early COD Remittance</h1>
        <p className="text-[13px] text-[#64748B] mt-1">Get guaranteed remittance from the shipment delivered date.</p>
      </div>

      {/* Choose a plan */}
      <div>
        <h2 className="text-[15px] font-bold text-[#0F172A] mb-3">Choose a plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ECOD_PLANS.map((plan) => {
            const isActive = activePlanId === plan.id;
            const isActivating = activatingPlan === plan.id;
            const agreed = !!agreedPlan[plan.id];
            return (
              <div
                key={plan.id}
                className="relative bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm flex flex-col"
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-5 text-[10.5px] font-bold text-[#78350F] bg-[#FBBF24] px-3 py-1 rounded-md shadow-sm">
                    Most Popular Plan
                  </span>
                )}

                <p className="text-[13px] text-[#475569] font-medium mt-2">Get COD amount within</p>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-[32px] font-extrabold text-[#0F172A] leading-none">{plan.days} Days</span>
                </div>
                <p className="text-[12px] text-[#94A3B8] font-medium mt-1 mb-4">from the date of delivery</p>

                <div className="bg-[#EFF8FF] border border-[#DBEAFE] rounded-xl px-4 py-3 mb-4">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[22px] font-extrabold text-[#0F172A]">{plan.charge.toFixed(2)}%</span>
                    <span className="text-[11.5px] font-semibold text-[#475569]">Transaction Charges</span>
                  </div>
                  <p className="text-[11px] text-[#64748B] font-medium mt-0.5">of COD Amount (GST included)</p>
                </div>

                <label className="flex items-start gap-2 mb-4 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreed || isActive}
                    disabled={isActive}
                    onChange={() => toggleAgree(plan.id)}
                    className="w-4 h-4 mt-0.5 rounded border-[#CBD5E1] accent-[#00A86B] shrink-0"
                  />
                  <span className="text-[11.5px] text-[#475569] leading-snug">
                    I have read and agree to{' '}
                    <span className="text-[#00A86B] font-semibold underline underline-offset-2 cursor-pointer">
                      Terms and Conditions.
                    </span>{' '}
                    <span className="block text-[10.5px] text-[#94A3B8] mt-0.5">(Please agree to our T&C to activate the plan)</span>
                  </span>
                </label>

                <ShineButton
                  onClick={() => handleActivate(plan)}
                  disabled={!agreed || isActivating || isActive}
                  className={`mt-auto h-10 rounded-full text-[13px] font-bold transition-colors flex items-center justify-center gap-2 ${
                    isActive
                      ? 'bg-[#F0FDF4] text-[#00A86B] border border-[#00A86B]/30 cursor-default'
                      : agreed
                      ? 'bg-[#00A86B] text-white hover:bg-[#009B63] shadow-sm'
                      : 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed'
                  }`}
                >
                  {isActive ? (
                    <><CheckCircle2 className="w-4 h-4" /> Activated</>
                  ) : isActivating ? (
                    <><RefreshCcw className="w-4 h-4 animate-spin" /> Activating…</>
                  ) : (
                    'Activate'
                  )}
                </ShineButton>
              </div>
            );
          })}
        </div>
      </div>

      {/* Additional benefit banner */}
      <div className="bg-[#F0FDF4] border border-[#DCFCE7] rounded-2xl px-5 py-4 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-[#00A86B] shrink-0 mt-0.5" />
        <p className="text-[12.5px] text-[#166534] leading-relaxed">
          <span className="font-bold">Additional Benefit:</span> ECOD plan subscribers enjoy{' '}
          <span className="font-bold">free COD remittance processing with no handling charges</span>. Get your money faster AND save on fees — exclusively for ECOD users.
        </p>
      </div>

      {/* Activation History */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <button
          onClick={() => setIsHistoryOpen((o) => !o)}
          className="w-full flex items-center justify-between px-5 py-4"
        >
          <span className="text-[14px] font-bold text-[#0F172A]">Activation History</span>
          <ChevronDown className={`w-4 h-4 text-[#64748B] transition-transform ${isHistoryOpen ? 'rotate-180' : ''}`} />
        </button>
        <AnimatePresence>
          {isHistoryOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="border-t border-[#E2E8F0]">
                {history.length === 0 ? (
                  <div className="px-5 py-8 text-center">
                    <Clock className="w-6 h-6 text-[#CBD5E1] mx-auto mb-2" />
                    <p className="text-[12.5px] font-semibold text-[#94A3B8]">No activation history yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#F1F5F9]">
                    {history.map((row) => (
                      <div key={row.id} className="flex items-center justify-between px-5 py-3.5">
                        <div>
                          <p className="text-[13px] font-bold text-[#0F172A]">{row.planDays}-Day Early COD Plan</p>
                          <p className="text-[11.5px] text-[#94A3B8] font-medium mt-0.5">Activated on {row.activatedOn} · {row.charge.toFixed(2)}% charges</p>
                        </div>
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> {row.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Why activate */}
      <div className="bg-[#FEFCE8] border border-[#FEF08A] rounded-2xl p-5">
        <h3 className="text-[13.5px] font-bold text-[#713F12] mb-3">Why should you activate Early COD?</h3>
        <ul className="space-y-2">
          {WHY_ACTIVATE.map((line, i) => (
            <li key={i} className="flex items-start gap-2 text-[12.5px] text-[#854D0E] leading-relaxed">
              <span className="text-[#CA8A04] font-bold shrink-0">›</span> {line}
            </li>
          ))}
        </ul>
      </div>

      <Toast toast={toast} onClose={closeToast} />
    </div>
  );
}

/* ── Mock IFSC directory — stand-in for a real bank-lookup API. Backend
   integration pending; this simulates the penny-drop verification flow that
   auto-fills Bank Name / Branch Name once IFSC + Account Number are entered. ── */
const IFSC_DIRECTORY: Record<string, { bank: string; branch: string }> = {
  PYTM0123456: { bank: 'PAYTM PAYMENTS BANK LTD', branch: 'NOIDA BRANCH' },
  HDFC0001234: { bank: 'HDFC BANK', branch: 'ANDHERI WEST BRANCH' },
  ICIC0001234: { bank: 'ICICI BANK', branch: 'CONNAUGHT PLACE BRANCH' },
  SBIN0001234: { bank: 'STATE BANK OF INDIA', branch: 'KORAMANGALA BRANCH' },
};

const ACCOUNT_TYPES = ['Saving Account', 'Current Account'];

interface BankFormState {
  accountNumber: string;
  confirmAccountNumber: string;
  accountType: string;
  accountHolderName: string;
  ifscCode: string;
  bankName: string;
  branchName: string;
}

const EMPTY_BANK_FORM: BankFormState = {
  accountNumber: '',
  confirmAccountNumber: '',
  accountType: '',
  accountHolderName: '',
  ifscCode: '',
  bankName: '',
  branchName: '',
};

const bankFieldCls = 'w-full h-11 px-4 rounded-full border border-[#E2E8F0] bg-white text-[13.5px] text-[#0F172A] font-medium focus:outline-none focus:border-[#00A86B] focus:ring-2 focus:ring-[#00A86B]/10 transition-all disabled:bg-[#F1F5F9] disabled:text-[#334155] disabled:cursor-not-allowed';

function BankDetailsPanel() {
  const { toast, showToast, closeToast } = useToast();
  const { isLoading } = useTableLoader(700);
  const [form, setForm] = useState<BankFormState>(EMPTY_BANK_FORM);
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof BankFormState, string>>>({});

  const setField = (key: keyof BankFormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof BankFormState, string>> = {};
    if (!form.accountNumber || form.accountNumber.length < 6) next.accountNumber = 'Enter a valid account number';
    if (form.confirmAccountNumber !== form.accountNumber) next.confirmAccountNumber = 'Account numbers do not match';
    if (!form.accountType) next.accountType = 'Select an account type';
    if (!form.accountHolderName.trim()) next.accountHolderName = "Enter the account holder's name";
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(form.ifscCode)) next.ifscCode = 'Enter a valid 11-character IFSC code';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleVerify = () => {
    if (!validate() || isVerifying) return;
    setIsVerifying(true);
    // Backend integration pending — simulates a penny-drop verification call:
    // a ₹1 transfer is made to the account, and once it lands, the bank's
    // registered name/branch come back and the account is marked verified.
    setTimeout(() => {
      const match = IFSC_DIRECTORY[form.ifscCode];
      if (!match) {
        setIsVerifying(false);
        setErrors((prev) => ({ ...prev, ifscCode: 'IFSC not found. Please check and try again.' }));
        showToast('error', 'Bank verification failed — IFSC not recognized.');
        return;
      }
      setForm((prev) => ({ ...prev, bankName: match.bank, branchName: match.branch }));
      setIsVerifying(false);
      setIsVerified(true);
      showToast('success', 'Bank account verified successfully!');
    }, 1400);
  };

  const handleEdit = () => {
    setIsVerified(false);
    showToast('info', 'You can now update your bank details. Re-verify to save changes.');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="relative w-20 h-20">
          <TableLoader />
        </div>
        <p className="text-[13px] font-semibold text-[#94A3B8]">Loading Bank Details…</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[20px] font-bold text-[#0F172A]">Bank Details</h1>
        <p className="text-[13px] text-[#64748B] mt-1">Add bank account details where you want your COD to be remitted.</p>
      </div>

      {isVerified && (
        <div className="flex items-center gap-2.5 bg-[#DCFCE7] border border-emerald-200 rounded-xl px-4 py-3">
          <span className="w-5 h-5 rounded-full bg-[#16A34A] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
          </span>
          <p className="text-[13px] font-semibold text-[#166534]">Congrats ! Your Bank details have been verified.</p>
        </div>
      )}

      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3.5">
        <p className="text-[13px] font-bold text-[#0F172A] mb-1.5">Note:</p>
        <ol className="space-y-1">
          <li className="text-[12px] text-[#64748B] leading-relaxed">1. As a verification process, we will make a transaction of Rs. 1.0 to your bank account. Your account gets verified when the amount is credited successfully in your bank account.</li>
          <li className="text-[12px] text-[#64748B] leading-relaxed">2. Account holder's name should be the same as the name mentioned in the KYC document.</li>
        </ol>
      </div>

      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
          <div>
            <label className="block text-[12px] font-bold text-[#0F172A] mb-1.5">Account Number</label>
            <input
              type={isVerified ? 'password' : 'text'}
              value={form.accountNumber}
              onChange={(e) => setField('accountNumber', e.target.value.replace(/\D/g, ''))}
              disabled={isVerified}
              placeholder="Enter your bank account number"
              className={`${bankFieldCls} ${errors.accountNumber ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : ''}`}
            />
            {errors.accountNumber && <p className="text-[10.5px] font-semibold text-red-500 mt-1">{errors.accountNumber}</p>}
          </div>

          <div>
            <label className="block text-[12px] font-bold text-[#0F172A] mb-1.5">Confirm Account Number</label>
            <input
              type="text"
              value={form.confirmAccountNumber}
              onChange={(e) => setField('confirmAccountNumber', e.target.value.replace(/\D/g, ''))}
              disabled={isVerified}
              placeholder="Re-enter account number"
              className={`${bankFieldCls} ${errors.confirmAccountNumber ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : ''}`}
            />
            {errors.confirmAccountNumber && <p className="text-[10.5px] font-semibold text-red-500 mt-1">{errors.confirmAccountNumber}</p>}
          </div>

          <div>
            <label className="block text-[12px] font-bold text-[#0F172A] mb-1.5">Account Type</label>
            <div className="relative">
              <select
                value={form.accountType}
                onChange={(e) => setField('accountType', e.target.value)}
                disabled={isVerified}
                className={`${bankFieldCls} appearance-none pr-9 ${!form.accountType ? 'text-[#94A3B8]' : ''} ${errors.accountType ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : ''}`}
              >
                <option value="" disabled>Select account type</option>
                {ACCOUNT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <ChevronDown className="w-4 h-4 text-[#94A3B8] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            {errors.accountType && <p className="text-[10.5px] font-semibold text-red-500 mt-1">{errors.accountType}</p>}
          </div>

          <div>
            <label className="block text-[12px] font-bold text-[#0F172A] mb-1.5">Account Holder's Name</label>
            <input
              type="text"
              value={form.accountHolderName}
              onChange={(e) => setField('accountHolderName', e.target.value)}
              disabled={isVerified}
              placeholder="Enter account holder's name"
              className={`${bankFieldCls} ${errors.accountHolderName ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : ''}`}
            />
            {errors.accountHolderName && <p className="text-[10.5px] font-semibold text-red-500 mt-1">{errors.accountHolderName}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[12px] font-bold text-[#0F172A]">IFSC Code</label>
              <a href="https://www.google.com/search?q=find+ifsc+code" target="_blank" rel="noreferrer" className="text-[11px] font-semibold text-[#00A86B] hover:underline flex items-center gap-1">
                Find your bank IFSC Code <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="text"
              maxLength={11}
              value={form.ifscCode}
              onChange={(e) => setField('ifscCode', e.target.value.toUpperCase())}
              disabled={isVerified}
              placeholder="Enter 11-digit IFSC code"
              className={`${bankFieldCls} uppercase ${errors.ifscCode ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : ''}`}
            />
            {errors.ifscCode && <p className="text-[10.5px] font-semibold text-red-500 mt-1">{errors.ifscCode}</p>}
          </div>

          <div>
            <label className="block text-[12px] font-bold text-[#0F172A] mb-1.5">Bank Name</label>
            <input type="text" value={form.bankName} readOnly disabled placeholder="Auto-filled after verification" className={bankFieldCls} />
          </div>

          <div>
            <label className="block text-[12px] font-bold text-[#0F172A] mb-1.5">Branch Name</label>
            <input type="text" value={form.branchName} readOnly disabled placeholder="Auto-filled after verification" className={bankFieldCls} />
          </div>
        </div>

        <div className="flex justify-end mt-5">
          {isVerified ? (
            <button
              type="button"
              onClick={handleEdit}
              className="h-10 px-5 rounded-full border border-[#E2E8F0] text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC] text-[13px] font-bold transition-colors flex items-center gap-1.5"
            >
              <Pencil className="w-3.5 h-3.5" /> Edit Details
            </button>
          ) : (
            <button
              type="button"
              onClick={handleVerify}
              disabled={isVerifying}
              className="h-10 px-6 rounded-full bg-[#00A86B] hover:bg-[#009B63] text-white text-[13px] font-bold shadow-sm transition-colors disabled:opacity-60 disabled:pointer-events-none flex items-center gap-2"
            >
              {isVerifying ? <><RefreshCcw className="w-4 h-4 animate-spin" /> Verifying…</> : 'Verify & Save'}
            </button>
          )}
        </div>
      </div>

      <Toast toast={toast} onClose={closeToast} />
    </div>
  );
}

const POSTPAID_BENEFITS = [
  'Dynamic Shipping limit based on your risk profile at QuickPost',
  'Your shipping limit will change everyday at midnight to provide you with uninterrupted shipping',
  'Faster COD remittance every Monday, Wednesday, Friday (Will not be processed on bank holidays)',
];

function PostpaidPlanPanel() {
  const { toast, showToast, closeToast } = useToast();
  const { isLoading } = useTableLoader(700);
  const [isEnabled, setIsEnabled] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [confirmingDisable, setConfirmingDisable] = useState(false);

  const commitToggle = (next: boolean) => {
    setIsUpdating(true);
    // Backend integration pending — simulates the opt-in/opt-out API call.
    setTimeout(() => {
      setIsEnabled(next);
      setIsUpdating(false);
      showToast(
        'success',
        next
          ? 'Postpaid plan enabled. Your shipping limit will refresh at midnight.'
          : 'Postpaid plan disabled. You will move back to prepaid/wallet-based shipping.'
      );
    }, 800);
  };

  const handleToggle = () => {
    if (isUpdating) return;
    if (isEnabled) {
      // Disabling affects live shipping limits — confirm before committing.
      setConfirmingDisable(true);
      return;
    }
    commitToggle(true);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="relative w-20 h-20">
          <TableLoader />
        </div>
        <p className="text-[13px] font-semibold text-[#94A3B8]">Loading Postpaid Plan…</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[20px] font-bold text-[#0F172A]">Postpaid Plan</h1>
        <p className="text-[13px] text-[#64748B] mt-1">Convert your COD remittance into shipping credits for uninterrupted shipping experience.</p>
      </div>

      <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-2xl px-5 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="text-[14px] font-bold text-[#0F172A]">Opt-in for postpaid plan</span>
          <span className={`text-[9.5px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${isEnabled ? 'bg-[#DCFCE7] text-[#166534]' : 'bg-[#F1F5F9] text-[#64748B]'}`}>
            {isEnabled ? 'Enabled' : 'Disabled'}
          </span>
          {isUpdating && <RefreshCcw className="w-3.5 h-3.5 text-[#64748B] animate-spin" />}
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={isEnabled}
          onClick={handleToggle}
          disabled={isUpdating}
          className={`relative w-13 h-7 rounded-full shrink-0 transition-colors duration-300 ease-out disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
            isEnabled ? 'bg-[#16A34A] focus-visible:ring-[#16A34A]/40' : 'bg-[#CBD5E1] focus-visible:ring-[#94A3B8]/40'
          }`}
          style={{ width: 52, height: 28 }}
        >
          <motion.span
            layout
            transition={{ type: 'spring', stiffness: 500, damping: 32 }}
            className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center"
            style={{ left: isEnabled ? 24 : 2 }}
          >
            {isUpdating ? (
              <RefreshCcw className="w-3 h-3 text-[#94A3B8] animate-spin" />
            ) : isEnabled ? (
              <Check className="w-3 h-3 text-[#16A34A]" strokeWidth={3} />
            ) : (
              <span className="w-2.5 h-2.5 rounded-full bg-[#CBD5E1]" />
            )}
          </motion.span>
        </button>
      </div>

      <div className="bg-[#ECFEFF] border border-[#A5F3FC] rounded-2xl p-5">
        <h3 className="text-[13.5px] font-bold text-[#0F172A] mb-2.5">Benefits of using Postpaid</h3>
        <ul className="space-y-1.5 list-disc list-inside">
          {POSTPAID_BENEFITS.map((line, i) => (
            <li key={i} className="text-[12.5px] text-[#155E75] leading-relaxed">{line}</li>
          ))}
        </ul>
      </div>

      {/* Disable confirmation — postpaid controls live shipping limits, so this shouldn't be a silent flip */}
      <AnimatePresence>
        {confirmingDisable && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setConfirmingDisable(false)} className="fixed inset-0 bg-[#0F172A]/50 backdrop-blur-sm z-[200]" />
            <div className="fixed inset-0 flex items-center justify-center z-[201] p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', duration: 0.4 }}
                className="w-full max-w-[440px] bg-white rounded-2xl shadow-2xl pointer-events-auto border border-[#E2E8F0] overflow-hidden"
              >
                {/* Illustration banner */}
                <div className="relative bg-gradient-to-b from-[#F0FDF4] to-white px-6 pt-6 pb-3">
                  <img src={turnoffIllustration} alt="" className="w-full h-auto select-none pointer-events-none" draggable={false} />
                </div>

                <div className="px-6 pb-6">
                  <div className="flex items-start gap-3 mb-4">
                    <span className="w-9 h-9 rounded-full bg-red-50 border border-red-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Power className="w-4 h-4 text-red-600" />
                    </span>
                    <div>
                      <h2 className="text-[16px] font-bold text-[#0F172A]">Turn off Postpaid Plan?</h2>
                      <p className="text-[12.5px] text-[#64748B] leading-relaxed mt-1">
                        You'll move back to prepaid/wallet-based shipping. This won't affect any shipments already booked.
                      </p>
                    </div>
                  </div>

                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 mb-5">
                    <p className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider mb-2.5">You'll lose access to</p>
                    <ul className="space-y-2">
                      {[
                        { icon: TrendingUp, label: 'Dynamic shipping limits based on your risk profile' },
                        { icon: Zap, label: 'Faster COD remittance on Mon / Wed / Fri' },
                        { icon: RefreshCcw, label: 'Automated midnight limit updates' },
                      ].map((row) => (
                        <li key={row.label} className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-full bg-white border border-[#E2E8F0] flex items-center justify-center shrink-0">
                            <Ban className="w-3 h-3 text-[#CBD5E1]" />
                          </span>
                          <span className="text-[12.5px] text-[#475569] font-medium leading-snug">{row.label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex gap-3">
                    <button type="button" onClick={() => setConfirmingDisable(false)} className="flex-1 h-11 rounded-full border border-[#E2E8F0] text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC] text-[13px] font-bold transition-all">
                      Keep it On
                    </button>
                    <ShineButton
                      type="button"
                      onClick={() => { setConfirmingDisable(false); commitToggle(false); }}
                      className="flex-1 h-11 rounded-full bg-red-600 hover:bg-red-700 text-white text-[13px] font-bold shadow-sm transition-all flex items-center justify-center gap-1.5"
                    >
                      <Power className="w-3.5 h-3.5" /> Turn Off
                    </ShineButton>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      <Toast toast={toast} onClose={closeToast} />
    </div>
  );
}

export function AdminEarlyCodRemittance() {
  const [activeTab, setActiveTab] = useState<SubTab>('early-cod');

  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto pb-10 grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
        {/* Left sub-nav */}
        <aside className="md:sticky md:top-6 md:self-start">
          <p className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider mb-2 px-1">Seller Remittance</p>
          <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-1 md:pb-0">
            {SUB_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`shrink-0 md:w-full text-left px-3.5 py-2.5 rounded-xl text-[13px] transition-colors ${
                    isActive
                      ? 'bg-[#F0FDF4] text-[#00A86B] font-bold'
                      : 'text-[#475569] font-semibold hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content */}
        <div className="min-w-0">
          {activeTab === 'bank-details' && <BankDetailsPanel />}
          {activeTab === 'early-cod' && <EarlyCodRemittancePanel />}
          {activeTab === 'postpaid-plan' && <PostpaidPlanPanel />}
        </div>
      </div>
    </AdminLayout>
  );
}
