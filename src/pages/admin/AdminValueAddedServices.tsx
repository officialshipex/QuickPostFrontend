import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { useToast } from '../../hooks/useToast';
import { Toast } from '../../components/ui/Toast';
import { useTableLoader } from '../../hooks/useTableLoader';
import { TableLoader } from '../../components/ui/TableLoader';
import { ShineButton } from '../../components/ui/ShineButton';
import {
  Gauge, ShieldCheck, Rocket, BellRing, PackageCheck,
  ChevronDown, CheckCircle2, Clock, Users, BadgeCheck, Wallet2, PlayCircle,
  ArrowRight, AlertTriangle, ShieldOff,
} from 'lucide-react';
import autoSecureHowItWorks from '../../assets/auto-secure-how-it-works.png';
import rtoScoreHowItWorks from '../../assets/rto-score-how-it-works.png';

/* ── Left sub-nav — mirrors the sidebar's Value Added Services group ── */
const VAS_NAV = [
  { id: 'rto-score', label: 'RTO Score', path: '/user/vas/rto-score', icon: Gauge },
  { id: 'auto-secure', label: 'Auto-Secure Shipments', path: '/user/vas/auto-secure', icon: ShieldCheck },
  { id: 'delivery-boost', label: 'Delivery Boost', path: '/user/vas/delivery-boost', icon: Rocket },
  // { id: 'secure-x', label: 'Secure X', path: '/user/vas/secure-x', icon: ShieldAlert },
  // { id: 'brand-boost', label: 'Brand Boost', path: '/user/vas/brand-boost', icon: Award },
  { id: 'notify', label: 'Notify', path: '/user/vas/notify', icon: BellRing },
  { id: 'shipsure', label: 'Shipsure', path: '/user/vas/shipsure', icon: PackageCheck, isNew: true },
];

function VasShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto pb-10 grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
        {/* Left sub-nav */}
        <aside className="md:sticky md:top-6 md:self-start">
          <p className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider mb-2 px-1">Value Added Services</p>
          <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-1 md:pb-0">
            {VAS_NAV.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className={`shrink-0 md:w-full text-left px-3.5 py-2.5 rounded-xl text-[13px] transition-colors flex items-center gap-2 ${
                    isActive
                      ? 'bg-[#F0FDF4] text-[#00A86B] font-bold'
                      : 'text-[#475569] font-semibold hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                  }`}
                >
                  <span className="truncate">{item.label}</span>
                  {item.isNew && <span className="ml-auto shrink-0 text-[9px] font-bold bg-[#00A86B] text-white px-1.5 py-0.5 rounded-md">New</span>}
                </button>
              );
            })}
          </nav>
        </aside>

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
  title: string;
  terms: SecureTerm[];
  activated: boolean;
}

const INITIAL_PLANS: SecurePlan[] = [
  {
    id: 'above-2500',
    title: 'Auto Secure Shipments above ₹2500',
    activated: true,
    terms: [
      { text: 'Secured lost or damaged shipments, eligible for max ₹4,75,000 refund.' },
      { text: 'The shipment must not be second-hand/refurbished, falling under dangerous/ restricted items as mentioned in the agreement, and a counterfeit or fraudulent product.' },
      { text: 'Adherence to packaging guidelines is required, with images for damaged shipments.', hasLink: true },
    ],
  },
  {
    id: 'india-post',
    title: 'Auto Secure India Post Shipment',
    activated: true,
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

interface DeactivationRecord {
  id: string;
  planTitle: string;
  deactivatedOn: string;
}

function AutoSecurePanel() {
  const { toast, showToast, closeToast } = useToast();
  const { isLoading } = useTableLoader(700);
  const [plans, setPlans] = useState<SecurePlan[]>(INITIAL_PLANS);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [history, setHistory] = useState<DeactivationRecord[]>([]);
  const [confirmingDeactivate, setConfirmingDeactivate] = useState<SecurePlan | null>(null);

  const handleDeactivate = () => {
    const plan = confirmingDeactivate;
    if (!plan) return;
    setConfirmingDeactivate(null);
    // Backend integration pending — simulates the opt-out API call.
    setPlans((prev) => prev.map((p) => (p.id === plan.id ? { ...p, activated: false } : p)));
    setHistory((prev) => [
      {
        id: `${plan.id}-${Date.now()}`,
        planTitle: plan.title,
        deactivatedOn: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      },
      ...prev,
    ]);
    showToast('info', `${plan.title} has been deactivated.`);
  };

  const handleActivate = (planId: string) => {
    setPlans((prev) => prev.map((p) => (p.id === planId ? { ...p, activated: true } : p)));
    const plan = plans.find((p) => p.id === planId);
    showToast('success', `${plan?.title || 'Plan'} activated successfully!`);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="relative w-20 h-20">
          <TableLoader />
        </div>
        <p className="text-[13px] font-semibold text-[#94A3B8]">Loading Auto Secure…</p>
      </div>
    );
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
              <h3 className="text-[14.5px] font-bold text-[#0F172A]">{plan.title}</h3>
              {plan.activated ? (
                <span className="flex items-center gap-1 text-[11px] font-bold text-[#16A34A] shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Activated
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] font-bold text-[#94A3B8] shrink-0">
                  <Clock className="w-3.5 h-3.5" /> Inactive
                </span>
              )}
            </div>

            <ul className="space-y-3 flex-1">
              {plan.terms.map((term, i) => (
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
              {plan.activated ? (
                <button
                  type="button"
                  onClick={() => setConfirmingDeactivate(plan)}
                  className="text-[12.5px] font-bold text-red-600 hover:text-red-700 underline underline-offset-2"
                >
                  Deactivate
                </button>
              ) : (
                <ShineButton
                  type="button"
                  onClick={() => handleActivate(plan.id)}
                  className="h-10 px-6 rounded-full bg-[#00A86B] hover:bg-[#009B63] text-white text-[13px] font-bold shadow-sm transition-colors"
                >
                  Activate
                </ShineButton>
              )}
            </div>
          </div>
        ))}
      </div>

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
                    {history.map((row) => (
                      <div key={row.id} className="flex items-center justify-between px-5 py-3.5">
                        <p className="text-[13px] font-bold text-[#0F172A]">{row.planTitle}</p>
                        <span className="flex items-center gap-1 text-[11px] font-bold text-[#94A3B8]">
                          Deactivated on {row.deactivatedOn}
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

      <Toast toast={toast} onClose={closeToast} />
    </div>
  );
}

/* ── RTO Score ── */
interface RtoBenefit {
  title: string;
  desc: string;
}

const RTO_BENEFITS: RtoBenefit[] = [
  { title: 'All new Risk AI', desc: 'Enhanced RTO Prediction, trained on 1.8 billion data points.' },
  { title: 'Next best actions', desc: 'Get preventive actions & accurate insights to reduce RTO risk.' },
  { title: 'All new Address quality score', desc: 'Reduce shipping costs for bad quality addresses with an AI, trained on 2.9 billion data points.' },
  { title: 'Boost customer engagement', desc: 'A new customer support tool with RTO risks, insights, customer calling scripts and free calls.' },
  { title: 'Revised hassle-free billing, new FAQs', desc: 'Charges for only COD orders will be deducted from the wallet automatically.' },
];

const RTO_HOW_IT_WORKS = [
  { title: 'Enable RTO Score', desc: 'Click on Enable RTO score button on top right corner' },
  { title: 'RTO Score Enabled', desc: 'RTO Score is enabled on your shipments' },
  { title: 'Confirmation with Buyer', desc: 'Confirmation with the Buyer' },
  { title: 'Ship with Confidence', desc: 'Ship Orders with no worries!!' },
];

const RTO_FAQS: { q: string; a: string }[] = [
  {
    q: 'What is the RTO score feature for you?',
    a: 'RTO score feature is a data analytics product, powered by Risk AI built on 4.8 billion data points. It computes RTO risk scores on the basis of various factors including the buyer’s shopping history, address score etc. It helps you to identify high or low risk orders and make calculative decisions on those orders.\n\nThe model provides you risk insights and also suggests you the next best action to mitigate your RTO risk.',
  },
  {
    q: 'What is High or low RTO predicted order?',
    a: 'An order is tagged as High RTO when our analytical model identifies the buyer as risky based on multiple parameters like incorrect address, incorrect mobile number or past RTO history.\n\nOn the other hand, a Low RTO predicted order refers to an order where the buyer has a low chance of returning the order. This means that the buyer is a good buyer and you can ship any order value to the buyer.',
  },
  {
    q: 'What are the benefits of the RTO Score Feature?',
    a: 'The RTO Score Feature powered by Risk AI, offers several benefits for businesses.\n\nOne of the main benefits is that it helps to save on inventory and shipping costs by proactively alerting businesses against risky buyers.\n\nThe in-built Customer connect module helps you to connect with your customer to verify the order and address details, thereby reducing the risk and costs involved in RTO.\n\nOverall, the RTO Score Feature is a valuable tool for businesses looking to minimize costs and mitigate risks associated with online sales.',
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

function RtoScorePanel() {
  const { toast, showToast, closeToast } = useToast();
  const { isLoading } = useTableLoader(700);
  const [isTrialActive, setIsTrialActive] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleActivateTrial = () => {
    if (isActivating || isTrialActive) return;
    setIsActivating(true);
    // Backend integration pending — simulates enabling RTO Score for the seller's account.
    setTimeout(() => {
      setIsTrialActive(true);
      setIsActivating(false);
      showToast('success', 'RTO Score free trial activated! It is now live on your shipments.');
    }, 900);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="relative w-20 h-20">
          <TableLoader />
        </div>
        <p className="text-[13px] font-semibold text-[#94A3B8]">Loading RTO Score…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[20px] font-bold text-[#0F172A]">Introducing RTO Score - powered by Risk AI</h1>
        <p className="text-[13px] text-[#64748B] mt-1">Enable RTO Score to improve your Delivery Success Rate and reduce RTO risk</p>
      </div>

      {/* Benefits + trial CTA */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_auto] gap-x-8 gap-y-5">
          <div className="space-y-5">
            {RTO_BENEFITS.filter((_, i) => i % 2 === 0).map((b) => (
              <div key={b.title} className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#16A34A] flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3 h-3 text-white" />
                </span>
                <div>
                  <p className="text-[13.5px] font-bold text-[#0F172A]">{b.title}</p>
                  <p className="text-[12.5px] text-[#64748B] leading-relaxed mt-0.5">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-5">
            {RTO_BENEFITS.filter((_, i) => i % 2 === 1).map((b) => (
              <div key={b.title} className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#16A34A] flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3 h-3 text-white" />
                </span>
                <div>
                  <p className="text-[13.5px] font-bold text-[#0F172A]">{b.title}</p>
                  <p className="text-[12.5px] text-[#64748B] leading-relaxed mt-0.5">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Trial CTA */}
          <div className="lg:w-[300px]">
            {!isTrialActive && (
              <p className="text-[13px] font-semibold text-[#0F172A] mb-3 text-center lg:text-left">Congrats! You are eligible for a free trial.</p>
            )}
            <div className="bg-[#F0FDF4] border border-[#DCFCE7] rounded-2xl p-4">
              {isTrialActive ? (
                <div className="flex items-center justify-center gap-2 h-11 rounded-full bg-white border border-[#16A34A]/30 text-[#16A34A] text-[13px] font-bold mb-3">
                  <CheckCircle2 className="w-4 h-4" /> RTO Score Active
                </div>
              ) : (
                <ShineButton
                  type="button"
                  onClick={handleActivateTrial}
                  disabled={isActivating}
                  className="w-full h-11 rounded-full bg-gradient-to-r from-[#818CF8] to-[#6366F1] text-white text-[13px] font-bold shadow-sm transition-opacity disabled:opacity-70 flex items-center justify-center gap-2 mb-3"
                >
                  {isActivating ? 'Activating…' : 'Activate Free Trial'}
                </ShineButton>
              )}
              <ul className="space-y-1.5">
                <li className="text-[11.5px] text-[#475569] leading-relaxed">• 30 days free trial</li>
                <li className="text-[11.5px] text-[#475569] leading-relaxed">• Rs 3.49 + GST per order - Charges will be automatically deducted from Wallet</li>
                <li className="text-[11.5px] text-[#475569] leading-relaxed">• Charges deducted for High and Low prediction for COD orders only</li>
              </ul>
            </div>
          </div>
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

      <Toast toast={toast} onClose={closeToast} />
    </div>
  );
}

/* ── Placeholder panels for the other VAS items — content to follow ── */
function VasComingSoonPanel({ title, description, icon: Icon }: { title: string; description: string; icon: React.ElementType }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[20px] font-bold text-[#0F172A]">{title}</h1>
        <p className="text-[13px] text-[#64748B] mt-1">{description}</p>
      </div>
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-10 text-center">
        <Icon className="w-8 h-8 text-[#CBD5E1] mx-auto mb-3" />
        <p className="text-[13px] font-semibold text-[#94A3B8]">{title} is coming soon</p>
      </div>
    </div>
  );
}

export function AdminAutoSecure() {
  return (
    <VasShell>
      <AutoSecurePanel />
    </VasShell>
  );
}

export function AdminRtoScore() {
  return (
    <VasShell>
      <RtoScorePanel />
    </VasShell>
  );
}

export function AdminDeliveryBoost() {
  return (
    <VasShell>
      <VasComingSoonPanel title="Delivery Boost" description="Improve delivery speed and success rate across couriers." icon={Rocket} />
    </VasShell>
  );
}

// Commented out for now — re-enable when Secure X is ready to ship.
// export function AdminSecureX() {
//   return (
//     <VasShell>
//       <VasComingSoonPanel title="Secure X" description="Extended shipment protection for high-risk categories." icon={ShieldAlert} />
//     </VasShell>
//   );
// }

// Commented out for now — re-enable when Brand Boost is ready to ship.
// export function AdminBrandBoost() {
//   return (
//     <VasShell>
//       <VasComingSoonPanel title="Brand Boost" description="Grow brand recall with custom packaging and tracking pages." icon={Award} />
//     </VasShell>
//   );
// }

export function AdminNotify() {
  return (
    <VasShell>
      <VasComingSoonPanel title="Notify" description="Automated order and delivery notifications for your customers." icon={BellRing} />
    </VasShell>
  );
}

export function AdminShipsure() {
  return (
    <VasShell>
      <VasComingSoonPanel title="Shipsure" description="End-to-end shipment assurance for your most valuable orders." icon={PackageCheck} />
    </VasShell>
  );
}
