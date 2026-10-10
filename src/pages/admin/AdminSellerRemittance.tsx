import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { useToast } from '../../hooks/useToast';
import { Toast } from '../../components/ui/Toast';
import { useTableLoader } from '../../hooks/useTableLoader';
import { apiClient } from '../../services/apiClient';
import { TableLoader } from '../../components/ui/TableLoader';
import { ShineButton } from '../../components/ui/ShineButton';
import { Zap, ChevronDown, CheckCircle2, Clock, Info, RefreshCcw, Check, Power, Ban, TrendingUp, AlertTriangle, ShieldCheck } from 'lucide-react';
import turnoffIllustration from '../../assets/postpaid-turnoff.png';

type SubTab = 'bank-details' | 'early-cod' | 'postpaid-plan';

const SUB_TABS: { id: SubTab; label: string }[] = [
  { id: 'bank-details', label: 'Bank Details' },
  { id: 'early-cod', label: 'Early COD Remittance' },
  { id: 'postpaid-plan', label: 'Postpaid Plan' },
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
  status: 'Active' | 'Replaced';
  isCustom?: boolean;
  remittanceDay?: string[];
}

// Backend plan names (CodPlan.planName) for each plan card
const planName = (plan: EcodPlan) => `D+${plan.days}`;

const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

function EarlyCodRemittancePanel() {
  const { toast, showToast, closeToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [activatingPlan, setActivatingPlan] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState('');
  const [isCustomPlan, setIsCustomPlan] = useState(false);
  const [history, setHistory] = useState<ActivationRecord[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // A custom (admin-set) plan has its own charges/days, so none of the standard cards is "active" then
  const activePlanId = isCustomPlan ? null : ECOD_PLANS.find((p) => planName(p) === currentPlan)?.id ?? null;

  const loadPlan = useCallback(async () => {
    try {
      const res = await apiClient.get('/cod/CheckCodplan');
      const d = res.data || {};
      const name = String(d.codplaneName || '');
      setCurrentPlan(name);
      setIsCustomPlan(!!d.isCustom);
      const rows: { planName: string; planCharges?: number; isCustom?: boolean; remittanceDay?: string[]; activatedAt?: string }[] = d.history || [];
      setHistory(
        [...rows].reverse().map((h, i) => ({
          id: `${h.planName}-${h.activatedAt}-${i}`,
          planDays: parseInt(String(h.planName).replace('D+', ''), 10) || 0,
          charge: Number(h.planCharges) || 0,
          activatedOn: fmtDate(h.activatedAt),
          status: i === 0 && h.planName === name ? 'Active' : 'Replaced',
          isCustom: h.isCustom === true,
          remittanceDay: h.remittanceDay || [],
        }))
      );
    } catch {
      showToast('error', 'Could not load your Early COD plan. Please refresh.');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => { loadPlan(); }, [loadPlan]);

  const handleActivate = async (plan: EcodPlan) => {
    if (activatingPlan || isCustomPlan) return;
    setActivatingPlan(plan.id);
    try {
      await apiClient.post('/cod/codPlanUpdate', { planName: planName(plan), codAmount: plan.charge });
      showToast('success', `${plan.days}-Day Early COD plan activated successfully!`);
      await loadPlan();
    } catch (e: any) {
      showToast('error', e?.response?.data?.error || 'Failed to activate plan. Please try again.');
    } finally {
      setActivatingPlan(null);
    }
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

      {isCustomPlan && (
        <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-2xl px-5 py-3 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
          <p className="text-[12.5px] text-[#1E3A8A]">A custom COD remittance plan is set on your account. Please contact support to change it.</p>
        </div>
      )}

      {/* Choose a plan */}
      <div>
        <h2 className="text-[15px] font-bold text-[#0F172A] mb-3">Choose a plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ECOD_PLANS.map((plan) => {
            const isActive = activePlanId === plan.id;
            const isActivating = activatingPlan === plan.id;
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

                <ShineButton
                  onClick={() => handleActivate(plan)}
                  disabled={isActivating || isActive || isCustomPlan}
                  className={`mt-auto h-10 rounded-full text-[13px] font-bold transition-colors flex items-center justify-center gap-2 ${
                    isActive
                      ? 'bg-[#F0FDF4] text-[#00A86B] border border-[#00A86B]/30 cursor-default'
                      : isCustomPlan
                      ? 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed'
                      : 'bg-[#00A86B] text-white hover:bg-[#009B63] shadow-sm'
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
                          <p className="text-[13px] font-bold text-[#0F172A]">{row.isCustom ? 'Custom ' : ''}{row.planDays}-Day Early COD Plan</p>
                          <p className="text-[11.5px] text-[#94A3B8] font-medium mt-0.5">
                            {row.isCustom ? 'Set by admin' : 'Activated'} on {row.activatedOn} · {row.charge.toFixed(2)}% charges
                            {row.isCustom && row.remittanceDay?.length ? ` · Remits on ${row.remittanceDay.join(', ')}` : ''}
                          </p>
                        </div>
                        <span className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${row.status === 'Active' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-[#64748B] bg-[#F1F5F9] border-[#E2E8F0]'}`}>
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

/* ── Bank Details — read-only. The account is verified once, during KYC; this
   page just shows those verified details (no re-entry / re-verification here). ── */
interface VerifiedBank {
  accountNumber: string;
  ifsc: string;
  nameAtBank?: string;
  bank?: string;
  branch?: string;
  city?: string;
  AccountStatus?: string;
}

const maskAccount = (n: string) => (n.length > 4 ? `${'X'.repeat(n.length - 4)}${n.slice(-4)}` : n);

function BankDetailRow({ label, value, mono = false }: { label: string; value?: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1.5">{label}</p>
      <div className={`h-11 px-4 rounded-full border border-[#E2E8F0] bg-[#F8FAFC] flex items-center text-[13.5px] font-medium text-[#0F172A] truncate ${mono ? 'tracking-wider' : ''}`}>
        <span className="truncate">{value || '—'}</span>
      </div>
    </div>
  );
}

function BankDetailsPanel() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [kycDone, setKycDone] = useState(false);
  const [bank, setBank] = useState<VerifiedBank | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [userRes, bankRes] = await Promise.allSettled([
        apiClient.get('/user/getUserDetails'),
        apiClient.get('/getKyc/getBankAccount'),
      ]);
      if (!alive) return;
      if (userRes.status === 'rejected' && bankRes.status === 'rejected') setLoadError(true);
      if (userRes.status === 'fulfilled') setKycDone(userRes.value.data?.user?.kycDone === true);
      // 204 (no bank account yet) comes back with an empty body
      if (bankRes.status === 'fulfilled' && bankRes.value.data?.accountNumber) setBank(bankRes.value.data);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="relative w-20 h-20">
          <TableLoader />
        </div>
        <p className="text-[13px] font-semibold text-[#94A3B8]">Loading Bank Details…</p>
      </div>
    );
  }

  const kycCta = (
    <Link to="/user/profile?tab=kyc" className="inline-flex items-center h-10 px-5 rounded-full bg-[#00A86B] hover:bg-[#009B63] text-white text-[13px] font-bold shadow-sm transition-colors shrink-0">
      Complete KYC
    </Link>
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[20px] font-bold text-[#0F172A]">Bank Details</h1>
        <p className="text-[13px] text-[#64748B] mt-1">The bank account where your COD is remitted. These details are verified during KYC.</p>
      </div>

      {loadError ? (
        <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-2xl px-5 py-4 text-[13px] text-[#991B1B]">
          Couldn&apos;t load your bank details. Please refresh the page.
        </div>
      ) : !kycDone ? (
        <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
          <span className="w-10 h-10 rounded-full bg-[#FEF3C7] flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-[#D97706]" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-bold text-[#92400E]">Complete your KYC to confirm your bank details</p>
            <p className="text-[12.5px] text-[#B45309] mt-0.5">Your bank account is verified as part of KYC. Once it&apos;s done, your details will appear here.</p>
          </div>
          {kycCta}
        </div>
      ) : !bank ? (
        <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
          <span className="w-10 h-10 rounded-full bg-[#FEF3C7] flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-[#D97706]" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-bold text-[#92400E]">No verified bank account found</p>
            <p className="text-[12.5px] text-[#B45309] mt-0.5">Add and verify your bank account in KYC to receive COD remittance.</p>
          </div>
          {kycCta}
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2.5 bg-[#DCFCE7] border border-emerald-200 rounded-xl px-4 py-3">
            <span className="w-5 h-5 rounded-full bg-[#16A34A] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-white" />
            </span>
            <p className="text-[13px] font-semibold text-[#166534]">Your bank account is verified.</p>
          </div>

          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
              <BankDetailRow label="Account Holder's Name" value={bank.nameAtBank} />
              <BankDetailRow label="Account Number" value={maskAccount(bank.accountNumber)} mono />
              <BankDetailRow label="IFSC Code" value={bank.ifsc} mono />
              <BankDetailRow label="Bank Name" value={bank.bank} />
              <BankDetailRow label="Branch Name" value={bank.branch} />
              <BankDetailRow label="City" value={bank.city} />
            </div>
            <p className="text-[12px] text-[#64748B] mt-5">These details are taken from your verified KYC and used for COD remittance.</p>
          </div>
        </>
      )}
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
      <div className="max-w-[1400px] mx-auto pb-10 grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
        {/* Left sub-nav — same pattern as the Value Added Services nav */}
        <aside className="md:sticky md:top-6 md:self-start">
          <p className="hidden md:block text-[11px] font-bold text-[#94A3B8] uppercase tracking-[0.08em] mb-2.5 px-3">Seller Remittance</p>
          <nav aria-label="Seller remittance" className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-1 md:pb-0">
            {SUB_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative shrink-0 md:w-full h-10 text-left px-3.5 md:pl-4 rounded-xl text-[13px] whitespace-nowrap transition-colors duration-200 ${
                    isActive
                      ? 'text-[#00A86B] font-bold'
                      : 'text-[#64748B] font-semibold hover:bg-[#F1F5F9]/80 hover:text-[#0F172A]'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="remittance-nav-active"
                      transition={{ type: 'spring', stiffness: 520, damping: 42 }}
                      className="absolute inset-0 rounded-xl bg-[#F0FDF4] ring-1 ring-inset ring-[#00A86B]/10"
                    >
                      <span className="hidden md:block absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-r-full bg-[#00A86B]" />
                    </motion.span>
                  )}
                  <span className="relative">{tab.label}</span>
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
