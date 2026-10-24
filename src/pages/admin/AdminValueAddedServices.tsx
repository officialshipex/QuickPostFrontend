import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { DesktopPreferred } from '../../components/ui/DesktopPreferred';
import { useToast } from '../../hooks/useToast';
import { Toast } from '../../components/ui/Toast';
import { TableLoader } from '../../components/ui/TableLoader';
import { ShineButton } from '../../components/ui/ShineButton';
import {
  ShieldCheck, Rocket, BellRing, PackageCheck,
  ChevronDown, CheckCircle2, Clock, Users, BadgeCheck, Wallet2, PlayCircle,
  ArrowRight, AlertTriangle, ShieldOff, Lock, Loader2, Zap, LayoutList, AlertCircle,
} from 'lucide-react';
import autoSecureHowItWorks from '../../assets/auto-secure-how-it-works.png';
import rtoScoreHowItWorks from '../../assets/rto-score-how-it-works.png';
import comingSoonIllustration from '../../assets/coming-soon.webp';
import { PlanModal } from './vas/PlanModal';
import { invalidateRtoScoreAccess } from '../../services/rtoScoreAccess';
import { SellerSecure } from './vas/secure/SellerSecure';
import { secureApi, type SecureRules, type SecureServiceInfo } from './vas/secure/secureApi';
import { useVasServices } from './vas/useVasServices';
import { apiCode, apiMessage, fmtDate, fmtMoney, planLabel, vasApi, type VasAccess, type VasPlan } from './vas/vasApi';

/* ── Left sub-nav — mirrors the sidebar's Value Added Services group ── */
const VAS_NAV = [
  { id: 'auto-secure', label: 'Auto-Secure Shipments', path: '/user/vas/auto-secure', icon: ShieldCheck },
  { id: 'delivery-boost', label: 'QuickBoost', path: '/user/vas/delivery-boost', icon: Rocket },
  // { id: 'secure-x', label: 'Secure X', path: '/user/vas/secure-x', icon: ShieldAlert },
  // { id: 'brand-boost', label: 'Brand Boost', path: '/user/vas/brand-boost', icon: Award },
  { id: 'notify', label: 'Notify', path: '/user/vas/notify', icon: BellRing },
  { id: 'shipsure', label: 'QuickSure', path: '/user/vas/shipsure', icon: PackageCheck, isNew: true },
];

function VasShell({ children, hideNav = true }: { children: React.ReactNode; hideNav?: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <AdminLayout>
      <div className={`max-w-[1400px] mx-auto pb-10 grid grid-cols-1 gap-6 ${hideNav ? '' : 'md:grid-cols-[240px_1fr]'}`}>
        {/* Left sub-nav — same pattern as the Seller Remittance nav */}
        {!hideNav && <aside className="md:sticky md:top-6 md:self-start">
          <p className="hidden md:block text-[11px] font-bold text-[#94A3B8] uppercase tracking-[0.08em] mb-2.5 px-3">Value Added Services</p>
          <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-1 md:pb-0">
            {VAS_NAV.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative shrink-0 md:w-full h-10 text-left px-3.5 md:pl-4 rounded-xl text-[13px] whitespace-nowrap flex items-center gap-2 transition-colors duration-200 ${
                    isActive
                      ? 'text-[#00A86B] font-bold'
                      : 'text-[#64748B] font-semibold hover:bg-[#F1F5F9]/80 hover:text-[#0F172A]'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="vas-nav-active"
                      transition={{ type: 'spring', stiffness: 520, damping: 42 }}
                      className="absolute inset-0 rounded-xl bg-[#F0FDF4] ring-1 ring-inset ring-[#00A86B]/10"
                    >
                      <span className="hidden md:block absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-r-full bg-[#00A86B]" />
                    </motion.span>
                  )}
                  <span className="relative truncate">{item.label}</span>
                  {item.isNew && <span className="relative ml-auto shrink-0 text-[9px] font-bold bg-[#00A86B] text-white px-1.5 py-0.5 rounded-md">New</span>}
                </button>
              );
            })}
          </nav>
        </aside>}

        {/* Content */}
        <div className="min-w-0">{children}</div>
      </div>
    </AdminLayout>
  );
}

/* ── Auto Secure ── */
interface SecureTerm {
  text: string;
  hasLink?: boolean;
}

interface SecurePlan {
  id: string;
  /** Backend service key (see /vas on the server). */
  key: string;
  title: string;
  terms: SecureTerm[];
}

const INITIAL_PLANS: SecurePlan[] = [
  {
    id: 'above-2500',
    key: 'auto-secure-above-2500',
    title: 'Auto Secure Shipments above ₹2500',
    terms: [
      { text: 'Secured lost or damaged shipments, eligible for max ₹4,75,000 refund.' },
      { text: 'The shipment must not be second-hand/refurbished, falling under dangerous/ restricted items as mentioned in the agreement, and a counterfeit or fraudulent product.' },
      { text: 'Adherence to packaging guidelines is required, with images for damaged shipments.', hasLink: true },
    ],
  },
  {
    id: 'india-post',
    key: 'auto-secure-india-post',
    title: 'Auto Secure India Post Shipment',
    terms: [
      { text: 'The shipment must not be second-hand/refurbished, falling under dangerous/ restricted items as mentioned in the agreement, and a counterfeit or fraudulent product.' },
      { text: 'Adherence to packaging guidelines is required, with images for damaged shipments.', hasLink: true },
    ],
  },
];

const HOW_IT_WORKS_STEPS = [
  { icon: PackageCheck, title: 'Secure Package', desc: "Activate Auto Secure and we'll calculate your premium by shipment value." },
  { icon: BadgeCheck, title: 'Submit Claims', desc: 'Submit a claim if the Shipment is lost or damaged.' },
  { icon: Wallet2, title: 'Receive Reimbursement', desc: 'Receive money in your account.' },
];

const STATS = [
  { icon: Users, value: '18,000+', label: 'Sellers monthly auto secure their shipment' },
  { icon: CheckCircle2, value: '99.8%', label: 'Claim settled ratio' },
  { icon: Wallet2, value: '200+ Crore', label: 'Monthly secured order value' },
];

const SECURE_KEYS = INITIAL_PLANS.map((p) => p.key);

/** The first terms of each plan come from the rules the admin set, so what the seller reads is what is applied. */
function ruleTerms(key: string, r: SecureRules): SecureTerm[] {
  const covered = key === 'auto-secure-india-post'
    ? `Covers lost or damaged India Post shipments, up to ${fmtMoney(r.maxCover)} per shipment.`
    : `Covers lost or damaged shipments worth above ${fmtMoney(r.threshold)}, up to ${fmtMoney(r.maxCover)} per shipment.`;
  return [
    { text: covered },
    { text: `Premium: ${r.premiumPercent}% of the shipment value (minimum ${fmtMoney(r.minPremium)}), taken from your wallet when a shipment is booked. If your wallet is too low at that moment, the shipment is not covered.` },
    { text: `File a claim within ${r.claimWindowDays} days. Lost-shipment claims open once the courier marks the shipment Lost; damage claims need photos. Approved claims are paid to your wallet.` },
  ];
}

function AutoSecurePanel() {
  const { toast, showToast, closeToast } = useToast();
  const { services, loading, error, put } = useVasServices(SECURE_KEYS);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [confirmingDeactivate, setConfirmingDeactivate] = useState<SecurePlan | null>(null);
  const [planFor, setPlanFor] = useState<SecurePlan | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const plans = INITIAL_PLANS;
  const [info, setInfo] = useState<Record<string, SecureServiceInfo>>({});
  useEffect(() => {
    secureApi.info().then((r) => setInfo(Object.fromEntries(r.services.map((x) => [x.key, x])))).catch(() => { /* static terms stay */ });
  }, []);
  const termsFor = (plan: SecurePlan): SecureTerm[] => {
    const rules = info[plan.key]?.rules;
    if (!rules) return plan.terms;
    // The static refund line of the first plan is replaced by the live rules; the eligibility lines stay.
    return [...ruleTerms(plan.key, rules), ...(plan.key === 'auto-secure-above-2500' ? plan.terms.slice(1) : plan.terms)];
  };

  const runActivate = async (plan: SecurePlan, months?: number) => {
    setBusyKey(plan.key);
    try {
      put(await vasApi.activate(plan.key, months));
      setPlanFor(null);
      showToast('success', `${plan.title} activated successfully!`);
    } catch (err) {
      if (apiCode(err) === 'PLAN_REQUIRED') setPlanFor(plan);
      else showToast('error', apiMessage(err));
    } finally {
      setBusyKey(null);
    }
  };

  const handleActivate = (plan: SecurePlan) => {
    const a = services[plan.key];
    if (a?.charged && !a.entitled) { setPlanFor(plan); return; }
    runActivate(plan);
  };

  const handleDeactivate = async () => {
    const plan = confirmingDeactivate;
    if (!plan) return;
    setConfirmingDeactivate(null);
    setBusyKey(plan.key);
    try {
      put(await vasApi.deactivate(plan.key));
      showToast('info', `${plan.title} has been deactivated.`);
    } catch (err) {
      showToast('error', apiMessage(err));
    } finally {
      setBusyKey(null);
    }
  };

  // Everything the seller did with these plans, newest first.
  const history = plans
    .flatMap((plan) => (services[plan.key]?.history || []).map((h) => ({ ...h, planTitle: plan.title })))
    .filter((h) => ['activated', 'deactivated', 'expired'].includes(h.action))
    .sort((a, b) => +new Date(b.at) - +new Date(a.at));
  const HISTORY_VERB: Record<string, string> = { activated: 'Activated', deactivated: 'Deactivated', expired: 'Expired' };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="relative w-20 h-20">
          <TableLoader />
        </div>
        <p className="text-[13px] font-semibold text-[#94A3B8]">Loading Auto Secure…</p>
      </div>
    );
  }

  if (error) {
    return <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8 text-center text-[13px] text-red-600 font-semibold">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[20px] font-bold text-[#0F172A]">Auto Secure</h1>
        <p className="text-[13px] text-[#64748B] mt-1">Automatically secure all your high order value shipments without any manual interventions.</p>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {plans.map((plan) => (
          <div key={plan.id} className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5 flex flex-col">
            <div className="flex items-center justify-between gap-3 pb-3.5 mb-4 border-b border-[#F1F5F9]">
              <h3 className="text-[14.5px] font-bold text-[#0F172A]">{plan.key === 'auto-secure-above-2500' && info[plan.key] ? `Auto Secure Shipments above ${fmtMoney(info[plan.key].rules.threshold)}` : plan.title}</h3>
              {services[plan.key]?.status === 'active' ? (
                <span className="flex items-center gap-1 text-[11px] font-bold text-[#16A34A] shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Activated
                </span>
              ) : services[plan.key]?.status === 'expired' ? (
                <span className="flex items-center gap-1 text-[11px] font-bold text-red-500 shrink-0">
                  <Clock className="w-3.5 h-3.5" /> Expired
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] font-bold text-[#94A3B8] shrink-0">
                  <Clock className="w-3.5 h-3.5" /> Inactive
                </span>
              )}
            </div>

            <ul className="space-y-3 flex-1">
              {termsFor(plan).map((term, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-[#F0FDF4] border border-[#00A86B]/30 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-2.5 h-2.5 text-[#00A86B]" />
                  </span>
                  <p className="text-[12.5px] text-[#475569] leading-relaxed">
                    {term.text}{' '}
                    {term.hasLink && (
                      <span className="text-[#6366F1] font-semibold underline underline-offset-2 cursor-pointer">View T&C</span>
                    )}
                  </p>
                </li>
              ))}
            </ul>

            <div className="mt-5 pt-1">
              {services[plan.key]?.charged && (
                <p className="text-[12px] text-[#64748B] mb-3">
                  {services[plan.key].status === 'active' && services[plan.key].entitledUntil
                    ? `Plan valid until ${fmtDate(services[plan.key].entitledUntil)}`
                    : `Plans from ${fmtMoney(Math.min(...services[plan.key].plans.map((p) => p.price)))}`}
                </p>
              )}
              {services[plan.key] && !services[plan.key].enabled ? (
                <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[#64748B]">
                  <Lock className="w-3.5 h-3.5" /> Not available for your account. Please contact support.
                </p>
              ) : services[plan.key]?.status === 'active' ? (
                <button
                  type="button"
                  onClick={() => setConfirmingDeactivate(plan)}
                  disabled={busyKey === plan.key}
                  className="text-[12.5px] font-bold text-red-600 hover:text-red-700 underline underline-offset-2 disabled:opacity-60"
                >
                  Deactivate
                </button>
              ) : (
                <ShineButton
                  type="button"
                  onClick={() => handleActivate(plan)}
                  disabled={busyKey === plan.key}
                  className="h-10 px-6 rounded-full bg-[#00A86B] hover:bg-[#009B63] text-white text-[13px] font-bold shadow-sm transition-colors disabled:opacity-60 inline-flex items-center gap-2"
                >
                  {busyKey === plan.key && <Loader2 className="w-4 h-4 animate-spin" />}
                  {services[plan.key]?.status === 'expired' ? 'Renew' : 'Activate'}
                </ShineButton>
              )}
            </div>
          </div>
        ))}
      </div>

      <SellerSecure notify={showToast} />

      {/* How it works */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6">
        <h3 className="text-[15px] font-bold text-[#0F172A] mb-4">How it Works?</h3>
        {/* Full illustrated banner (desktop) */}
        <img src={autoSecureHowItWorks} alt="How Auto Secure works: Secure Package, Submit Claims, Receive Reimbursement" className="hidden md:block w-full h-auto rounded-xl select-none" draggable={false} />
        {/* Compact fallback list (mobile, where the wide banner doesn't read well) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 md:hidden">
          {HOW_IT_WORKS_STEPS.map((step) => (
            <div key={step.title} className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#F0FDF4] flex items-center justify-center mx-auto mb-2.5">
                <step.icon className="w-6 h-6 text-[#00A86B]" />
              </div>
              <h4 className="text-[13px] font-bold text-[#0F172A] mb-1">{step.title}</h4>
              <p className="text-[11.5px] text-[#64748B] leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Activation History */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <button onClick={() => setIsHistoryOpen((o) => !o)} className="w-full flex items-center justify-between px-5 py-4">
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
                    <p className="text-[12.5px] font-semibold text-[#94A3B8]">No activity yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#F1F5F9]">
                    {history.map((row, i) => (
                      <div key={`${row.planTitle}-${row.at}-${i}`} className="flex items-center justify-between px-5 py-3.5">
                        <p className="text-[13px] font-bold text-[#0F172A]">{row.planTitle}</p>
                        <span className="flex items-center gap-1 text-[11px] font-bold text-[#94A3B8]">
                          {HISTORY_VERB[row.action]} on {fmtDate(row.at)}
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

      {/* Trust stats */}
      <div className="rounded-2xl border border-[#E2E8F0] bg-gradient-to-r from-[#F8FAFC] to-[#F0FDF4] px-6 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          {STATS.map((stat) => (
            <div key={stat.label}>
              <div className="w-10 h-10 rounded-full bg-white border border-[#E2E8F0] flex items-center justify-center mx-auto mb-2.5 shadow-sm">
                <stat.icon className="w-4.5 h-4.5 text-[#00A86B]" />
              </div>
              <p className="text-[22px] font-extrabold text-[#0F172A]">{stat.value}</p>
              <p className="text-[12px] text-[#64748B] font-medium mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Deactivate confirmation */}
      <AnimatePresence>
        {confirmingDeactivate && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setConfirmingDeactivate(null)} className="fixed inset-0 bg-[#0F172A]/50 backdrop-blur-sm z-[200]" />
            <div className="fixed inset-0 flex items-center justify-center z-[201] p-4 pointer-events-none">
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', duration: 0.4 }} className="w-full max-w-[400px] bg-white rounded-2xl shadow-2xl p-6 pointer-events-auto border border-[#E2E8F0]">
                <h2 className="text-[15px] font-bold text-[#0F172A] mb-1.5">Deactivate "{confirmingDeactivate.title}"?</h2>
                <p className="text-[13px] text-[#64748B] leading-relaxed mb-5">
                  Future shipments under this plan will no longer be covered against loss or damage. Existing approved claims are not affected.
                </p>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setConfirmingDeactivate(null)} className="flex-1 h-10 rounded-full border border-[#E2E8F0] text-[#64748B] hover:text-[#334155] hover:bg-[#F8FAFC] text-[13px] font-bold transition-all">
                    Keep Active
                  </button>
                  <button type="button" onClick={handleDeactivate} className="flex-1 h-10 rounded-full bg-red-600 hover:bg-red-700 text-white text-[13px] font-bold shadow-sm transition-all">
                    Deactivate
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      <PlanModal
        open={!!planFor}
        title={planFor ? `Choose a plan — ${planFor.title}` : 'Choose a plan'}
        confirmLabel="It is activated right after payment."
        plans={planFor ? services[planFor.key]?.plans || [] : []}
        busy={!!busyKey}
        onClose={() => setPlanFor(null)}
        onConfirm={(p: VasPlan) => planFor && runActivate(planFor, p.months)}
      />

      <Toast toast={toast} onClose={closeToast} />
    </div>
  );
}

/* ── RTO Score ── */
const RTO_HOW_IT_WORKS = [
  { title: 'Enable RTO Score', desc: 'Click on Enable RTO score button on top right corner' },
  { title: 'RTO Score Enabled', desc: 'RTO Score is enabled on your shipments' },
  { title: 'Confirmation with Buyer', desc: 'Confirmation with the Buyer' },
  { title: 'Ship with Confidence', desc: 'Ship Orders with no worries!!' },
];

const RTO_FAQS: { q: string; a: string }[] = [
  {
    q: 'What is the RTO score feature for you?',
    a: 'RTO Score checks every COD order before dispatch and tags it as High, Medium or Low risk, based on factors like the buyer’s delivery history, address quality and pincode performance.\n\nIt helps you spot risky orders early and suggests the next best action to reduce returns.',
  },
  {
    q: 'What is High or low RTO predicted order?',
    a: 'An order is tagged as High RTO when our analytical model identifies the buyer as risky based on multiple parameters like incorrect address, incorrect mobile number or past RTO history.\n\nOn the other hand, a Low RTO predicted order refers to an order where the buyer has a low chance of returning the order. This means that the buyer is a good buyer and you can ship any order value to the buyer.',
  },
  {
    q: 'What are the benefits of the RTO Score Feature?',
    a: 'RTO Score offers several benefits for your business.\n\nOne of the main benefits is that it helps to save on inventory and shipping costs by proactively alerting businesses against risky buyers.\n\nThe in-built Customer connect module helps you to connect with your customer to verify the order and address details, thereby reducing the risk and costs involved in RTO.\n\nOverall, the RTO Score Feature is a valuable tool for businesses looking to minimize costs and mitigate risks associated with online sales.',
  },
  {
    q: 'What action can I take on High & Low RTO?',
    a: 'For High RTO orders, it is recommended to connect with buyers through Customer connect and confirm the order and address details, before shipping.\n\nFor Low RTO orders, you can save on order confirmation costs and ship them without any worry.',
  },
  {
    q: 'How much will RTO Score cost me?',
    a: 'RTO Score feature will charge Rs. 3.49/- per order on all COD orders.',
  },
];

const RTO_OVERVIEW = [
  { label: 'Orders Scanned', icon: LayoutList, tone: 'bg-[#F0FDF4] text-[#00A86B]' },
  { label: 'High Risk', icon: AlertTriangle, tone: 'bg-red-50 text-red-600' },
  { label: 'Medium Risk', icon: AlertCircle, tone: 'bg-amber-50 text-amber-600' },
  { label: 'Low Risk', icon: ShieldCheck, tone: 'bg-[#F0FDF4] text-[#16A34A]' },
];

/* Illustrative preview: a laser line sweeps a sample order list and stamps each row with its risk. */
const SCAN_SAMPLE: { value: string; risk: 'Low' | 'Medium' | 'High' }[] = [
  { value: '₹2,780', risk: 'Medium' }, { value: '₹6,340', risk: 'Low' }, { value: '₹2,450', risk: 'Low' },
  { value: '₹1,299', risk: 'High' }, { value: '₹3,750', risk: 'Low' }, { value: '₹899', risk: 'Medium' },
  { value: '₹4,120', risk: 'Low' }, { value: '₹1,560', risk: 'High' },
];
const RISK_PILL = { Low: 'bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]', Medium: 'bg-amber-50 text-amber-700 border-amber-200', High: 'bg-red-50 text-red-600 border-red-200' };
const ROWS_VISIBLE = 5;
const ROW_H = 64;

function RtoScanPreview() {
  // `step` = how many rows have been scored. The window scrolls once the scan passes the visible rows.
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setStep(s => (s >= SCAN_SAMPLE.length + 2 ? 0 : s + 1)), 1100);
    return () => window.clearInterval(id);
  }, []);
  const offset = Math.max(0, Math.min(step, SCAN_SAMPLE.length) - (ROWS_VISIBLE - 2));
  const scanY = Math.min(step, SCAN_SAMPLE.length) - offset;
  const done = step >= SCAN_SAMPLE.length;

  return (
    <div className="rounded-2xl bg-white border border-[#E2E8F0] shadow-[0_20px_50px_-20px_rgba(15,23,42,0.25)] overflow-hidden" aria-hidden>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#F1F5F9]">
        <div className="flex gap-1.5"><span className="w-3 h-3 rounded-full bg-[#F87171]" /><span className="w-3 h-3 rounded-full bg-[#FBBF24]" /><span className="w-3 h-3 rounded-full bg-[#34D399]" /></div>
        <div className="flex-1 h-7 rounded-lg bg-[#F8FAFC] border border-[#F1F5F9] text-[11.5px] text-[#94A3B8] flex items-center justify-center">app.quickpost.in</div>
      </div>
      <div className="grid grid-cols-[1.6fr_1fr_1fr_0.9fr] px-5 py-2.5 text-[10.5px] font-bold tracking-wider text-[#94A3B8] uppercase border-b border-[#F1F5F9] bg-[#FAFBFC]">
        <span>Order</span><span>Value</span><span>Pincode</span><span>Risk</span>
      </div>
      <div className="relative overflow-hidden" style={{ height: ROWS_VISIBLE * ROW_H }}>
        <motion.div animate={{ y: -offset * ROW_H }} transition={{ duration: 0.6, ease: 'easeInOut' }}>
          {SCAN_SAMPLE.map((r, i) => (
            <div key={i} className="grid grid-cols-[1.6fr_1fr_1fr_0.9fr] items-center px-5 border-b border-[#F8FAFC] text-[13px]" style={{ height: ROW_H }}>
              <span className="font-semibold text-[#00A86B] truncate">#QP{(240518 + i).toString()}</span>
              <span className="text-[#334155] tabular-nums">{r.value}</span>
              <span className="text-[#334155] tabular-nums">{110001 + i * 37}</span>
              <span>
                <AnimatePresence mode="wait">
                  {i < step ? (
                    <motion.span key="pill" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 420, damping: 22 }}
                      className={`inline-flex px-2.5 py-0.5 rounded-full border text-[11.5px] font-bold ${RISK_PILL[r.risk]}`}>{r.risk}</motion.span>
                  ) : (
                    <motion.span key="dash" exit={{ opacity: 0 }} className="inline-block w-4 h-0.5 rounded bg-[#E2E8F0]" />
                  )}
                </AnimatePresence>
              </span>
            </div>
          ))}
        </motion.div>
        {!done && (
          <motion.div className="absolute inset-x-0 pointer-events-none" animate={{ top: scanY * ROW_H }} transition={{ duration: 0.6, ease: 'easeInOut' }}>
            <div className="h-[3px] bg-[#00A86B] shadow-[0_0_14px_2px_rgba(0,168,107,0.55)]" />
            <div className="h-12 bg-gradient-to-b from-[#00A86B]/15 to-transparent" />
          </motion.div>
        )}
      </div>
      <div className="px-5 py-3 border-t border-[#F1F5F9] bg-[#FAFBFC] flex items-center gap-2 text-[12.5px] font-semibold">
        <span className="relative flex w-2 h-2">
          <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${done ? '' : 'animate-ping'} bg-[#16A34A]`} />
          <span className="relative inline-flex w-2 h-2 rounded-full bg-[#16A34A]" />
        </span>
        <span className="text-[#16A34A]">{done ? 'All orders scored — ready to dispatch' : 'Scanning orders for delivery risk…'}</span>
      </div>
    </div>
  );
}

function RtoScorePanel() {
  const { toast, showToast, closeToast } = useToast();
  const { services, loading, error, put } = useVasServices(['rto-score']);
  const [isActivating, setIsActivating] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const rto: VasAccess | undefined = services['rto-score'];
  const isActive = rto?.status === 'active';
  const [confirmOff, setConfirmOff] = useState(false);

  const runDeactivate = async () => {
    setConfirmOff(false);
    setIsActivating(true);
    try {
      put(await vasApi.deactivate('rto-score'));
      invalidateRtoScoreAccess();
      showToast('info', 'RTO Score has been deactivated. RTO risk is no longer shown on your orders.');
    } catch (err) {
      showToast('error', apiMessage(err));
    } finally {
      setIsActivating(false);
    }
  };

  const runActivate = async (months?: number) => {
    if (isActivating) return;
    setIsActivating(true);
    try {
      put(await vasApi.activate('rto-score', months));
      invalidateRtoScoreAccess();
      setPlanOpen(false);
      showToast('success', 'RTO Score activated! It is now live on your shipments.');
    } catch (err) {
      if (apiCode(err) === 'PLAN_REQUIRED') setPlanOpen(true);
      else showToast('error', apiMessage(err));
    } finally {
      setIsActivating(false);
    }
  };

  const handleActivate = () => {
    if (rto?.charged && !rto.entitled) { setPlanOpen(true); return; }
    runActivate();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="relative w-20 h-20">
          <TableLoader />
        </div>
        <p className="text-[13px] font-semibold text-[#94A3B8]">Loading RTO Score…</p>
      </div>
    );
  }

  if (error) {
    return <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8 text-center text-[13px] text-red-600 font-semibold">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2.5">
        <div>
          <h1 className="text-[20px] font-bold text-[#0F172A]">RTO Score</h1>
          <p className="text-[13px] text-[#64748B] mt-0.5">See which orders may need your attention before dispatch.</p>
        </div>
        <span className="self-start inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-[#00A86B] text-white text-[12px] font-bold shadow-sm">
          <Zap className="w-3.5 h-3.5 fill-current" /> Reduce Delivery Failures
        </span>
      </div>

      {/* Overview */}
      <div className="relative overflow-hidden rounded-2xl border border-[#E2E8F0] bg-gradient-to-r from-[#00A86B] via-[#34D399] to-[#ECFDF5] p-4 md:p-5">
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-[16px] font-bold text-white">Overview</h2>
          <span className="text-[12.5px] font-medium text-[#334155]">Last 30 days</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {RTO_OVERVIEW.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="bg-white rounded-xl border border-white/60 px-3.5 py-3 md:px-4 md:py-3.5 flex items-center gap-3 shadow-[0_1px_2px_rgba(16,24,40,0.06)]">
              <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${s.tone}`}><s.icon className="w-[18px] h-[18px]" /></span>
              <span className="text-[13.5px] font-bold text-[#0F172A] truncate flex-1">{s.label}</span>
              <span className="text-[18px] font-extrabold text-[#00A86B] tabular-nums" title={isActive ? 'Counts appear as your COD orders are scored' : 'Activate RTO Score to start scoring orders'}>—</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Hero: pitch + pricing + live scan preview */}
      <div className="rounded-2xl border border-[#E2E8F0] bg-gradient-to-br from-[#F8FAFC] via-[#F0FDF4] to-[#F8FAFC] p-5 md:p-8">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-center">
          <div className="text-center">
            <h2 className="text-[30px] md:text-[40px] font-extrabold tracking-tight text-[#0F172A] leading-tight">
              Predict. <span className="text-[#00A86B]">Protect.</span> Deliver.
            </h2>
            <svg viewBox="0 0 240 20" className="w-[200px] md:w-[240px] h-4 mx-auto mt-1" aria-hidden>
              <motion.path d="M6 12 C 70 2, 170 2, 234 8" fill="none" stroke="#00A86B" strokeWidth="4" strokeLinecap="round"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, ease: 'easeOut' }} />
              <motion.path d="M60 17 C 110 11, 160 11, 200 14" fill="none" stroke="#00A86B" strokeWidth="3" strokeLinecap="round"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.7, delay: 0.5, ease: 'easeOut' }} />
            </svg>
            <p className="text-[13.5px] md:text-[15px] text-[#64748B] leading-relaxed mt-3 max-w-[560px] mx-auto">
              Identify high-risk COD shipments before dispatch. Reduce friction, expose intelligence, and secure your fulfillment metrics.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {['See the risk in every order', 'Focus on what needs attention', 'Track actual outcomes after shipping'].map(t => (
                <span key={t} className="px-3.5 py-1.5 rounded-full bg-white/80 border border-[#E2E8F0] text-[12.5px] font-semibold text-[#334155]">{t}</span>
              ))}
            </div>

            {/* Pricing / activation card */}
            <div className="relative mt-7 max-w-[480px] mx-auto">
              <div className="rounded-2xl border-2 border-[#00A86B] bg-white/90 backdrop-blur px-5 py-5 shadow-[0_10px_30px_-12px_rgba(0,168,107,0.30)]">
                {rto && !rto.charged && rto.enabled ? (
                  <p className="text-[15px] text-[#94A3B8]"><span className="line-through">₹3.49</span> <span className="text-[26px] font-extrabold text-[#16A34A] align-middle">Free</span> / order</p>
                ) : (
                  <p className="text-[15px] text-[#94A3B8]"><span className="text-[26px] font-extrabold text-[#0F172A] align-middle">₹3.49</span> + GST / COD order</p>
                )}
                <div className="mt-4">
                  {rto && !rto.enabled ? (
                    <div className="flex items-center justify-center gap-2 h-11 rounded-xl bg-[#F1F5F9] text-[#64748B] text-[13px] font-bold">
                      <Lock className="w-4 h-4" /> Not available for your account
                    </div>
                  ) : isActive ? (
                    <>
                      <div className="flex items-center justify-center gap-2 h-11 rounded-xl bg-[#F0FDF4] border border-[#16A34A]/30 text-[#16A34A] text-[13.5px] font-bold">
                        <CheckCircle2 className="w-4 h-4" /> Activated
                      </div>
                      <button type="button" onClick={() => setConfirmOff(true)} disabled={isActivating}
                        className="mt-2.5 text-[12.5px] font-semibold text-[#94A3B8] hover:text-red-600 transition-colors disabled:opacity-60">Deactivate</button>
                    </>
                  ) : (
                    <ShineButton type="button" onClick={handleActivate} disabled={isActivating}
                      className="w-full h-11 rounded-xl bg-[#00A86B] hover:bg-[#00965F] text-white text-[13.5px] font-bold shadow-sm transition-colors disabled:opacity-70 flex items-center justify-center gap-2">
                      {isActivating ? 'Activating…' : rto?.status === 'expired' ? 'Renew RTO Score' : 'Activate RTO Score'}
                    </ShineButton>
                  )}
                </div>
                <ul className="mt-3.5 space-y-1 text-left">
                  {rto?.charged && (
                    <li className="text-[11.5px] text-[#64748B]">• {isActive && rto.entitledUntil ? `Plan valid until ${fmtDate(rto.entitledUntil)}` : `Plans: ${rto.plans.map((p) => `${planLabel(p)} ${fmtMoney(p.price)}`).join(' · ')}`}</li>
                  )}
                  <li className="text-[11.5px] text-[#64748B]">• Charged only for High and Low predictions on COD orders, auto-deducted from wallet</li>
                </ul>
              </div>
            </div>
          </div>

          <RtoScanPreview />
        </div>
      </div>

      {/* How does it work */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-[15px] font-bold text-[#0F172A]">How does it work?</h3>
          <button type="button" className="text-[12.5px] font-semibold text-[#6366F1] hover:underline flex items-center gap-1">
            See Video <PlayCircle className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Full illustrated banner (desktop) */}
        <img src={rtoScoreHowItWorks} alt="How RTO Score works: Enable RTO Score, RTO Score Enabled, Confirmation with Buyer, Ship with Confidence" className="hidden md:block w-full h-auto rounded-xl select-none" draggable={false} />

        {/* Compact fallback list (mobile) */}
        <div className="grid grid-cols-2 gap-5 md:hidden">
          {RTO_HOW_IT_WORKS.map((step, i) => (
            <div key={step.title} className="text-center">
              <div className="w-12 h-12 rounded-full bg-[#EEF2FF] flex items-center justify-center mx-auto mb-2 text-[#6366F1] font-bold text-[13px]">
                {i + 1}
              </div>
              <h4 className="text-[12.5px] font-bold text-[#0F172A] mb-1">{step.title}</h4>
              <p className="text-[11px] text-[#64748B] leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQs */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6">
        <h3 className="text-[15px] font-bold text-[#0F172A] mb-3">Frequently Asked Questions</h3>
        <div className="divide-y divide-[#F1F5F9]">
          {RTO_FAQS.map((faq, i) => {
            const isOpen = openFaq === i;
            return (
              <div key={faq.q}>
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 py-3.5 text-left"
                >
                  <span className="text-[13px] font-semibold text-[#334155]">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-[#94A3B8] shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="pb-3.5 pr-8 space-y-2.5">
                        {faq.a.split('\n\n').map((para, pi) => (
                          <p key={pi} className="text-[12.5px] text-[#64748B] leading-relaxed">{para}</p>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* What to do for High/Low RTO */}
      <div>
        <h3 className="text-[15px] font-bold text-[#0F172A] mb-3">What to do for High or Low RTO score?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5 flex items-center gap-4">
            <span className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </span>
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold text-red-500 uppercase tracking-wide">High Risk</p>
              <p className="text-[12.5px] text-[#334155] font-medium flex items-center gap-1.5"><ArrowRight className="w-3.5 h-3.5 text-red-500 shrink-0" /> Take buyer confirmation before shipping</p>
              <p className="text-[12.5px] text-[#334155] font-medium flex items-center gap-1.5"><ArrowRight className="w-3.5 h-3.5 text-red-500 shrink-0" /> Take purchase confirmation before shipping</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5 flex items-center gap-4">
            <span className="w-14 h-14 rounded-full bg-[#F0FDF4] flex items-center justify-center shrink-0">
              <ShieldOff className="w-6 h-6 text-[#16A34A]" />
            </span>
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold text-[#16A34A] uppercase tracking-wide">Low Risk</p>
              <p className="text-[12.5px] text-[#334155] font-medium flex items-center gap-1.5"><ArrowRight className="w-3.5 h-3.5 text-[#16A34A] shrink-0" /> Ship order of any minimum value</p>
              <p className="text-[12.5px] text-[#334155] font-medium flex items-center gap-1.5"><ArrowRight className="w-3.5 h-3.5 text-[#16A34A] shrink-0" /> No pre-confirmation required</p>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {confirmOff && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setConfirmOff(false)} className="fixed inset-0 bg-[#0F172A]/50 backdrop-blur-sm z-[200]" />
            <div className="fixed inset-0 flex items-center justify-center z-[201] p-4 pointer-events-none">
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', duration: 0.4 }} className="w-full max-w-[400px] bg-white rounded-2xl shadow-2xl p-6 pointer-events-auto border border-[#E2E8F0]">
                <h2 className="text-[15px] font-bold text-[#0F172A] mb-1.5">Deactivate RTO Score?</h2>
                <p className="text-[13px] text-[#64748B] leading-relaxed mb-5">
                  RTO risk will no longer be shown on your orders.{rto?.charged ? ' Any plan you have paid for is not refunded.' : ''} You can activate it again anytime.
                </p>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setConfirmOff(false)} className="flex-1 h-10 rounded-full border border-[#E2E8F0] text-[#64748B] hover:text-[#334155] hover:bg-[#F8FAFC] text-[13px] font-bold transition-all">Keep Active</button>
                  <button type="button" onClick={runDeactivate} className="flex-1 h-10 rounded-full bg-red-600 hover:bg-red-700 text-white text-[13px] font-bold shadow-sm transition-all">Deactivate</button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      <PlanModal
        open={planOpen}
        title="Choose a plan — RTO Score"
        confirmLabel="It is activated right after payment."
        plans={rto?.plans || []}
        busy={isActivating}
        onClose={() => setPlanOpen(false)}
        onConfirm={(p: VasPlan) => runActivate(p.months)}
      />

      <Toast toast={toast} onClose={closeToast} />
    </div>
  );
}

/* ── Placeholder panels for the other VAS items — content to follow ── */
function VasComingSoonPanel({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[20px] font-bold text-[#0F172A]">{title}</h1>
        <p className="text-[13px] text-[#64748B] mt-1">{description}</p>
      </div>
      <div className="bg-white rounded-2xl shadow-[0_1px_2px_rgba(16,24,40,0.04),0_2px_8px_rgba(16,24,40,0.05)] px-6 py-10 md:py-14 flex flex-col items-center text-center">
        <img
          src={comingSoonIllustration}
          alt=""
          className="w-full max-w-[260px] md:max-w-[320px] h-auto select-none pointer-events-none"
          draggable={false}
        />
        <h2 className="text-[18px] md:text-[20px] font-bold text-[#0F172A] mt-6">{title} is coming soon</h2>
        <p className="text-[13px] md:text-[14px] text-[#64748B] leading-relaxed mt-2 max-w-[460px]">
          We're putting the finishing touches on {title}. It will be available in your QuickPost account shortly — no action is needed from your side.
        </p>
      </div>
    </div>
  );
}

export function AdminAutoSecure() {
  return (
    <VasShell>
      <DesktopPreferred title="Secure">
        <AutoSecurePanel />
      </DesktopPreferred>
    </VasShell>
  );
}

export function AdminRtoScore() {
  return (
    <VasShell hideNav>
      <RtoScorePanel />
    </VasShell>
  );
}

export function AdminDeliveryBoost() {
  return (
    <VasShell>
      <VasComingSoonPanel title="QuickBoost" description="Improve delivery speed and success rate across couriers." />
    </VasShell>
  );
}

// Commented out for now — re-enable when Secure X is ready to ship.
// export function AdminSecureX() {
//   return (
//     <VasShell>
//       <VasComingSoonPanel title="Secure X" description="Extended shipment protection for high-risk categories." />
//     </VasShell>
//   );
// }

// Commented out for now — re-enable when Brand Boost is ready to ship.
// export function AdminBrandBoost() {
//   return (
//     <VasShell>
//       <VasComingSoonPanel title="Brand Boost" description="Grow brand recall with custom packaging and tracking pages." />
//     </VasShell>
//   );
// }

export function AdminNotify() {
  return (
    <VasShell>
      <VasComingSoonPanel title="Notify" description="Automated order and delivery notifications for your customers." />
    </VasShell>
  );
}

export function AdminShipsure() {
  return (
    <VasShell>
      <VasComingSoonPanel title="QuickSure" description="End-to-end shipment assurance for your most valuable orders." />
    </VasShell>
  );
}
