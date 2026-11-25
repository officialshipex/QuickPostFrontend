import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, Zap, Phone, MessageCircle, PhoneCall, CheckCircle2, Sparkles, PackageX, Clock, ClipboardCheck,
  ChevronDown, X, Info, BadgeCheck, Signal, Wifi, BatteryFull, ChevronLeft, Video, MoreVertical, Lock, CheckCheck,
  Smile, Paperclip, Mic, Loader2, Ban, BadgeIndianRupee, ExternalLink, type LucideIcon,
} from 'lucide-react';
import { AdminLayout } from '../../../components/admin/layout/AdminLayout';
import { DesktopPreferred } from '../../../components/ui/DesktopPreferred';
import { Toast } from '../../../components/ui/Toast';
import { ShineButton } from '../../../components/ui/ShineButton';
import { useToast } from '../../../hooks/useToast';
import { apiMessage, fmtMoney, NDR_MODE_LABEL, vasApi, type NdrMode, type UsagePrices, type VasAccess } from './vasApi';
import { NdrFollowupList } from './NdrFollowupList';

/* NDR Follow-ups (VAS). When a delivery fails (NDR), the customer gets a WhatsApp and/or an AI call. Connected to
   /vas/ndr-followups: activation + mode, the admin's prices (or free), and the seller's own follow-ups and charges.
   Charged only per successful response: a WhatsApp DELIVERED to the customer, a call ANSWERED by the customer. */

interface Plan {
  key: NdrMode; name: string; icon: LucideIcon; lead: string; leadRest: string; perks: string[]; cta: string; recommended?: boolean;
}

const PLANS: Plan[] = [
  {
    key: 'calling', name: 'Calling', icon: Phone,
    lead: 'Automated AI voice call', leadRest: ' to the customer as soon as the delivery fails, asking whether to re-attempt.',
    perks: ['Greets customers with your store name', 'Customer’s answer saved on the order', 'Pay only when the customer answers'],
    cta: 'Activate calling',
  },
  {
    key: 'both', name: 'WhatsApp + Calling', icon: PhoneCall, recommended: true,
    lead: 'WhatsApp goes first.', leadRest: ' If the NDR is still open after the wait time, the customer also gets an AI call.',
    perks: ['Highest recovery of the three', 'Call only when the NDR is still open', 'Pay only for delivered WhatsApp / answered calls'],
    cta: 'Activate both',
  },
  {
    key: 'whatsapp', name: 'WhatsApp', icon: MessageCircle,
    lead: 'Instant WhatsApp message', leadRest: ' telling the customer the delivery failed, with a Track Order button.',
    perks: ['Sent the moment the NDR is recorded', 'Reminds the customer to keep the phone reachable', 'Pay only when it is delivered'],
    cta: 'Activate WhatsApp',
  },
];

const FLOW: { icon: LucideIcon; title: string; desc: string; tone: string }[] = [
  { icon: PackageX, title: 'Delivery fails', desc: 'Courier records an NDR', tone: 'bg-red-50 text-red-500' },
  { icon: MessageCircle, title: 'WhatsApp sent', desc: 'Instantly, with Track Order', tone: 'bg-[#F0FDF4] text-[#00A86B]' },
  { icon: Clock, title: 'Still open?', desc: 'After the wait time', tone: 'bg-amber-50 text-amber-600' },
  { icon: PhoneCall, title: 'AI call', desc: 'Greets with your store name', tone: 'bg-sky-50 text-sky-600' },
  { icon: ClipboardCheck, title: 'Answer saved', desc: 'Re-attempt wish on the order', tone: 'bg-violet-50 text-violet-600' },
];

const FAQS = [
  { q: 'When is a customer contacted?', a: 'As soon as the courier records a failed delivery (NDR) with a re-attempt pending. WhatsApp goes out at once; on WhatsApp + Calling the call follows only if the NDR is still open after the wait time.' },
  { q: 'When am I charged?', a: 'Only for successful responses: a WhatsApp is charged once WhatsApp confirms it was delivered to the customer, a call once the customer answers it. Failed, undelivered and unanswered attempts are free. Each NDR is charged at most once per channel.' },
  { q: 'What if my wallet balance is low?', a: 'Nothing is sent when your wallet cannot cover the price, so you are never charged into a negative balance. While the service is free, it always runs.' },
  { q: 'What happens with the customer’s answer?', a: 'When the customer answers the AI call, their answer (for example “deliver again”) is saved on the order’s NDR history, so you can act on it from your NDR screen.' },
  { q: 'Can I switch plans later?', a: 'Yes. Change the plan or deactivate anytime; changes apply to new NDRs.' },
];

const priceLine = (key: NdrMode, p: UsagePrices | undefined, charged: boolean) => {
  if (!charged || !p) return { price: 'Free', unit: 'right now', note: 'No charge while the service is free' };
  const wa = p.whatsapp > 0 ? `${fmtMoney(p.whatsapp)} / delivered WhatsApp` : 'WhatsApp free';
  const call = p.call > 0 ? `${fmtMoney(p.call)} / answered call` : 'calls free';
  if (key === 'whatsapp') return { price: p.whatsapp > 0 ? fmtMoney(p.whatsapp) : 'Free', unit: p.whatsapp > 0 ? '/ delivered WhatsApp' : '', note: 'Not delivered = no charge' };
  if (key === 'calling') return { price: p.call > 0 ? fmtMoney(p.call) : 'Free', unit: p.call > 0 ? '/ answered call' : '', note: 'Not answered = no charge' };
  return { price: p.whatsapp > 0 ? fmtMoney(p.whatsapp) : 'Free', unit: p.whatsapp > 0 ? '/ delivered WhatsApp' : 'WhatsApp', note: `+ ${call} — ${wa}` };
};

/** Recovery rates for the estimate — illustrative only. */
const RECOVERY: Record<NdrMode, number> = { whatsapp: 0.28, calling: 0.3, both: 0.42 };

/* WhatsApp-style preview of the NDR message the customer actually receives (template "shipment_undelivered"). */
function WhatsAppPreview({ withCall }: { withCall: boolean }) {
  const [step, setStep] = useState(0);
  const last = withCall ? 4 : 3;
  useEffect(() => {
    const id = window.setTimeout(() => setStep(s => (s >= last + 1 ? 0 : s + 1)), step === 0 ? 600 : step >= last ? 2800 : 1200);
    return () => window.clearTimeout(id);
  }, [step, last]);
  const pop = { initial: { opacity: 0, y: 8, scale: 0.96 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0 }, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } };

  return (
    <div className="relative mx-auto w-full max-w-[320px]" aria-hidden>
      <div className="rounded-[34px] bg-[#0F172A] p-[7px] shadow-[0_30px_60px_-24px_rgba(15,23,42,0.55)] ring-1 ring-black/10">
        <div className="relative rounded-[28px] overflow-hidden bg-[#EFEAE2] h-[540px] flex flex-col">
          <div className="bg-[#008069] px-5 pt-2 pb-1 flex items-center justify-between text-[10.5px] font-semibold text-white">
            <span>11:42</span>
            <span className="absolute left-1/2 -translate-x-1/2 top-1.5 w-20 h-4 rounded-full bg-[#0F172A]" />
            <span className="flex items-center gap-1"><Signal className="w-3 h-3" /><Wifi className="w-3 h-3" /><BatteryFull className="w-3.5 h-3.5" /></span>
          </div>
          <div className="bg-[#008069] px-2.5 pb-2.5 pt-1 flex items-center gap-2 text-white">
            <ChevronLeft className="w-5 h-5 shrink-0" />
            <span className="relative w-9 h-9 rounded-full bg-white overflow-hidden shrink-0 ring-2 ring-white/30">
              <img src="/logo-color.png" alt="" className="absolute max-w-none" style={{ width: 118, height: 118, left: 2, top: -41 }} />
            </span>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="text-[13.5px] font-bold flex items-center gap-1">QuickPost <BadgeCheck className="w-4 h-4 fill-[#25D366] text-white shrink-0" /></p>
              <p className="text-[10.5px] text-white/80 truncate">Business account</p>
            </div>
            <Video className="w-[18px] h-[18px] shrink-0 opacity-90" />
            <Phone className="w-4 h-4 shrink-0 opacity-90 ml-2.5" />
            <MoreVertical className="w-4 h-4 shrink-0 opacity-90 ml-1.5" />
          </div>

          <div className="flex-1 min-h-0 overflow-hidden px-2.5 py-2.5 flex flex-col justify-end gap-1.5 [background-image:radial-gradient(rgba(0,0,0,0.045)_1px,transparent_1px)] [background-size:14px_14px]">
            <div className="flex justify-center"><span className="px-2 py-0.5 rounded-md bg-white/90 text-[10px] font-semibold text-[#54656F] shadow-sm">TODAY</span></div>
            <div className="mx-auto max-w-[92%] rounded-md bg-[#FFF5C4] px-2 py-1 text-[9.5px] text-[#54656F] text-center leading-snug flex items-start gap-1 justify-center">
              <Lock className="w-2.5 h-2.5 mt-0.5 shrink-0" />This business uses a secure service from Meta to manage this chat.
            </div>
            <AnimatePresence>
              {step >= 1 && (
                <motion.div key="msg" {...pop} className="max-w-[88%] rounded-lg rounded-tl-none bg-white shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] overflow-hidden">
                  <div className="px-2.5 pt-2">
                    <p className="text-[11.5px] font-bold text-[#111B21]">Delivery Attempt Failed</p>
                    <p className="mt-1 text-[11.5px] text-[#111B21] leading-snug">Hi Priya,<br /><br />Your order <b>QP240518</b> from <b>Your Store</b> could not be delivered today ⚠️<br /><br />📦 <b>AWB Number:</b> 1234567890<br /><br />A re-attempt will be made shortly. Please keep your phone reachable.</p>
                    <p className="text-[9px] text-[#667781] text-right py-1 flex items-center justify-end gap-0.5">11:42 AM {step >= 3 && <CheckCheck className="w-3 h-3 text-[#53BDEB]" />}</p>
                  </div>
                  {step >= 2 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-t border-[#E9EDEF] py-1.5 text-center text-[11.5px] font-semibold text-[#00A884] flex items-center justify-center gap-1.5">
                      <ExternalLink className="w-3.5 h-3.5" />Track Order
                    </motion.div>
                  )}
                </motion.div>
              )}
              {step >= 3 && (
                <motion.div key="delivered" {...pop} className="mx-auto rounded-md bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-[#16A34A] shadow-sm">✓ Delivered — charged only now</motion.div>
              )}
              {withCall && step >= 4 && (
                <motion.div key="call" {...pop} className="mx-auto rounded-lg bg-[#0F172A] text-white px-3 py-2 text-[10.5px] font-semibold flex items-center gap-2 shadow">
                  <PhoneCall className="w-3.5 h-3.5 text-[#34D399]" /> NDR still open → AI call to the customer
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="px-2 py-1.5 flex items-center gap-1.5 bg-[#F0F2F5]">
            <div className="flex-1 h-8 rounded-full bg-white px-3 flex items-center gap-2 text-[11px] text-[#8696A0]"><Smile className="w-4 h-4" />Message<Paperclip className="w-3.5 h-3.5 ml-auto" /></div>
            <span className="w-8 h-8 rounded-full bg-[#00A884] flex items-center justify-center text-white"><Mic className="w-4 h-4" /></span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NdrFollowups() {
  const navigate = useNavigate();
  const { toast, showToast, closeToast } = useToast();
  const [access, setAccess] = useState<VasAccess | null>(null);
  const [loadError, setLoadError] = useState('');
  const [selected, setSelected] = useState<Plan | null>(null);
  const [confirmOff, setConfirmOff] = useState(false);
  const [busy, setBusy] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [ndrs, setNdrs] = useState(200);
  const [aov, setAov] = useState(1200);
  const [estPlan, setEstPlan] = useState<NdrMode>('both');
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async () => {
    try {
      setLoadError('');
      setAccess(await vasApi.mine('ndr-followups'));
    } catch (err) {
      setLoadError(apiMessage(err, 'Could not load NDR Follow-ups. Please refresh.'));
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const active = access?.status === 'active' && !!access.ndrMode;
  const currentMode = active ? access!.ndrMode! : null;
  const enabled = access?.enabled !== false;
  const recovered = Math.round(ndrs * RECOVERY[estPlan]);
  const fmt = (v: number) => `₹${(Number(v) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const loadActivity = useCallback((p: Parameters<typeof vasApi.ndrActivity>[0]) => vasApi.ndrActivity(p), []);

  const confirm = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      setAccess(await vasApi.activateNdr(selected.key));
      showToast('success', currentMode ? `Switched to ${selected.name}.` : `${selected.name} activated. New NDRs will be followed up automatically.`);
      setSelected(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      showToast('error', apiMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const deactivate = async () => {
    setBusy(true);
    try {
      setAccess(await vasApi.deactivate('ndr-followups'));
      showToast('success', 'NDR Follow-ups deactivated. New NDRs will not be followed up.');
      setConfirmOff(false);
    } catch (err) {
      showToast('error', apiMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminLayout>
      <DesktopPreferred title="NDR Follow-ups">
      <div className="max-w-[1400px] mx-auto pb-10 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-start gap-3">
          <button type="button" onClick={() => navigate(-1)} aria-label="Back"
            className="mt-0.5 w-9 h-9 rounded-full bg-white border border-[#E2E8F0] flex items-center justify-center text-[#475569] hover:bg-[#F8FAFC] shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-[20px] font-bold text-[#0F172A]">NDR Follow-ups</h1>
            <p className="text-[13px] text-[#64748B] mt-0.5">Automatically reach customers after a failed delivery, recover orders before they turn into RTOs.</p>
            <span className="mt-2.5 inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-[#00A86B] text-white text-[12px] font-bold shadow-sm">
              <Zap className="w-3.5 h-3.5 fill-current" /> Reduce Delivery Failures
            </span>
          </div>
        </div>

        {loadError && <div className="rounded-xl border border-red-200 bg-[#FEF2F2] px-4 py-3 text-[13px] font-semibold text-red-600">{loadError}</div>}

        {access && !enabled && (
          <div className="rounded-2xl border border-[#FDE68A] bg-[#FFFBEB] px-5 py-4 flex items-start gap-3">
            <Ban className="w-5 h-5 text-[#B45309] shrink-0 mt-0.5" />
            <div>
              <p className="text-[14px] font-bold text-[#78350F]">NDR Follow-ups is not available for your account right now</p>
              <p className="text-[12.5px] text-[#92400E] mt-0.5">Please contact support if you would like to use it.{active ? ' Your NDRs are not being followed up meanwhile.' : ''}</p>
            </div>
          </div>
        )}

        {/* Current status */}
        {access && enabled && active && (
          <div className="rounded-2xl border border-[#00A86B]/30 bg-[#F0FDF4] px-5 py-4 flex flex-wrap items-center gap-4">
            <span className="w-10 h-10 rounded-xl bg-white text-[#00A86B] flex items-center justify-center shadow-sm"><CheckCircle2 className="w-5 h-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-bold text-[#0F172A]">Active — {NDR_MODE_LABEL[currentMode!]}</p>
              <p className="text-[12.5px] text-[#166534] mt-0.5">
                {access.charged && access.usagePrices
                  ? `You pay ${[
                    currentMode !== 'calling' ? `${fmtMoney(access.usagePrices.whatsapp)} per delivered WhatsApp` : '',
                    currentMode !== 'whatsapp' ? `${fmtMoney(access.usagePrices.call)} per answered call` : '',
                  ].filter(Boolean).join(' and ')} from your wallet. Failed / unanswered = free.`
                  : 'Free right now — no charges for follow-ups.'}
              </p>
            </div>
            <button type="button" onClick={() => setConfirmOff(true)} className="h-9 px-4 rounded-full border border-[#E2E8F0] bg-white text-[12.5px] font-bold text-[#64748B] hover:text-red-600 hover:border-red-200">Deactivate</button>
          </div>
        )}

        {/* Hero */}
        <div className="border-b border-[#E2E8F0] pb-6">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-8 lg:gap-12 items-center">
            <div className="min-w-0 pl-[35px] lg:relative lg:-top-10">
              <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#00A86B]">
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp + AI call automation
              </span>
              <h2 className="mt-2 text-[28px] md:text-[40px] font-extrabold tracking-tight text-[#0F172A] leading-[1.12]">
                Win back NDRs<br />
                <span className="text-[#00A86B]">before they become RTOs.</span>
              </h2>
              <p className="mt-3 text-[14px] md:text-[15px] text-[#64748B] leading-relaxed max-w-[540px]">
                When a delivery fails, we reach the customer on WhatsApp and with an AI call, and save their answer on the order.
              </p>
              <div className="mt-6 grid grid-cols-3 gap-3 max-w-[540px]">
                {([
                  ['< 1 min', 'to first contact', Clock],
                  ['₹0', 'if not delivered / answered', BadgeIndianRupee],
                  ['0', 'manual work', Zap],
                ] as const).map(([v, l, Icon]) => (
                  <div key={l} className="rounded-2xl bg-white/90 border border-[#E2E8F0] px-3.5 py-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
                    <span className="w-7 h-7 rounded-lg bg-[#F0FDF4] text-[#00A86B] flex items-center justify-center"><Icon className="w-3.5 h-3.5" /></span>
                    <p className="mt-2 text-[18px] md:text-[20px] font-extrabold text-[#0F172A] leading-none">{v}</p>
                    <p className="mt-1 text-[11.5px] text-[#64748B]">{l}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:pr-5"><WhatsAppPreview withCall={currentMode !== 'whatsapp'} /></div>
          </div>
        </div>

        {/* Plans */}
        <div className="rounded-2xl bg-gradient-to-b from-[#F0FDF4] to-[#F8FAFC] border border-[#E2E8F0] px-4 py-7 md:px-8">
          <div className="text-center">
            <h2 className="text-[20px] md:text-[24px] font-extrabold text-[#0F172A]">{active ? 'Your plan' : 'Choose how you recover NDRs'}</h2>
            <p className="mt-1 text-[13px] text-[#64748B]">You pay only for successful responses: a WhatsApp delivered to the customer, a call the customer answers.</p>
          </div>
          <div className="mt-7 grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
            {PLANS.map((p, i) => {
              const isCurrent = currentMode === p.key;
              const pl = priceLine(p.key, access?.usagePrices, !!access?.charged);
              return (
                <motion.div key={p.key} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 * i }}
                  className={`relative flex flex-col rounded-2xl bg-white p-5 md:p-6 transition-shadow ${isCurrent || (!active && p.recommended)
                    ? 'border-2 border-[#00A86B] shadow-[0_20px_44px_-18px_rgba(0,168,107,0.45)] lg:-my-3'
                    : 'border border-[#E2E8F0] shadow-[0_1px_2px_rgba(16,24,40,0.04),0_2px_8px_rgba(16,24,40,0.05)] hover:shadow-md'}`}>
                  {(isCurrent || (!active && p.recommended)) && (
                    <span className="absolute -top-px right-5 -translate-y-1/2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#00A86B] text-white text-[11.5px] font-bold shadow-sm">
                      {isCurrent ? <>Active <CheckCircle2 className="w-3 h-3" /></> : <>Recommended <Sparkles className="w-3 h-3" /></>}
                    </span>
                  )}
                  <div className="flex items-center gap-3 pb-4 border-b border-[#F1F5F9]">
                    <span className="w-11 h-11 rounded-xl bg-[#F0FDF4] text-[#00A86B] flex items-center justify-center"><p.icon className="w-5 h-5" /></span>
                    <h3 className="text-[17px] font-bold text-[#0F172A]">{p.name}</h3>
                  </div>
                  <div className="pt-4">
                    <p className="flex items-baseline gap-1.5 flex-wrap">
                      <span className={`text-[30px] font-extrabold tracking-tight ${isCurrent || p.recommended ? 'text-[#00A86B]' : 'text-[#0F172A]'}`}>{pl.price}</span>
                      <span className="text-[13px] text-[#94A3B8]">{pl.unit}</span>
                    </p>
                    <p className="mt-1 text-[12px] font-semibold text-[#00A86B]">{pl.note}</p>
                    <p className="mt-3 text-[13px] text-[#475569] leading-relaxed"><b className="text-[#0F172A]">{p.lead}</b>{p.leadRest}</p>
                  </div>
                  <ul className="mt-4 pt-4 border-t border-[#F1F5F9] space-y-2.5 flex-1">
                    {p.perks.map(k => <li key={k} className="flex items-start gap-2 text-[12.5px] text-[#334155]"><CheckCircle2 className="w-4 h-4 text-[#00A86B] shrink-0 mt-px" />{k}</li>)}
                  </ul>
                  <ShineButton type="button" disabled={!access || !enabled || isCurrent} onClick={() => setSelected(p)}
                    className={`mt-6 h-12 w-full rounded-full text-[14px] font-bold inline-flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed ${p.recommended
                      ? 'bg-gradient-to-r from-[#00A86B] to-[#10B981] text-white shadow-[0_10px_24px_-10px_rgba(0,168,107,0.75)] hover:shadow-[0_14px_28px_-10px_rgba(0,168,107,0.85)] hover:-translate-y-px'
                      : 'border-[1.5px] border-[#00A86B] text-[#00A86B] bg-white hover:bg-[#F0FDF4] hover:-translate-y-px hover:shadow-[0_8px_18px_-10px_rgba(0,168,107,0.5)]'}`}>
                    <span className="relative">{isCurrent ? 'Your current plan' : active ? `Switch to ${p.name}` : p.cta}</span>
                    {!isCurrent && <ArrowRight className="relative w-4 h-4 transition-transform group-hover:translate-x-0.5" />}
                  </ShineButton>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Seller's own follow-ups */}
        {access && (access.status !== 'none') && (
          <div>
            <h3 className="text-[15px] font-bold text-[#0F172A] mb-3">Your NDR follow-ups</h3>
            <NdrFollowupList load={loadActivity} refreshKey={refreshKey} />
          </div>
        )}

        {/* How it works */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5 md:p-6">
          <h3 className="text-[15px] font-bold text-[#0F172A] mb-5">How it works</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {FLOW.map((f, i) => (
              <div key={f.title} className="relative flex flex-col items-center text-center">
                {i < FLOW.length - 1 && <span className="hidden md:block absolute top-6 left-[calc(50%+32px)] right-[calc(-50%+32px)] border-t-2 border-dashed border-[#CBD5E1]" />}
                <motion.span initial={{ scale: 0.7, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.12 }}
                  className={`relative w-12 h-12 rounded-2xl flex items-center justify-center ring-1 ring-black/5 ${f.tone}`}><f.icon className="w-5 h-5" /></motion.span>
                <p className="mt-2 text-[13px] font-bold text-[#0F172A]">{f.title}</p>
                <p className="text-[11.5px] text-[#64748B] mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Estimator + FAQ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5 md:p-6">
            <h3 className="text-[15px] font-bold text-[#0F172A]">Estimate what you win back</h3>
            <p className="text-[12px] text-[#94A3B8] mt-0.5">Illustrative, based on typical recovery rates.</p>
            <div className="mt-4 inline-flex p-1 rounded-xl bg-[#F1F5F9] gap-1">
              {PLANS.map(p => (
                <button key={p.key} type="button" onClick={() => setEstPlan(p.key)}
                  className={`h-8 px-3 rounded-lg text-[12px] font-semibold transition-colors ${estPlan === p.key ? 'bg-white text-[#00A86B] shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]'}`}>{p.name}</button>
              ))}
            </div>
            <label className="block mt-5">
              <span className="flex justify-between text-[12.5px] font-semibold text-[#334155]">NDRs per month <span className="tabular-nums text-[#0F172A]">{ndrs}</span></span>
              <input type="range" min={20} max={2000} step={10} value={ndrs} onChange={e => setNdrs(+e.target.value)} className="w-full mt-2 accent-[#00A86B]" />
            </label>
            <label className="block mt-4">
              <span className="flex justify-between text-[12.5px] font-semibold text-[#334155]">Average order value <span className="tabular-nums text-[#0F172A]">{fmt(aov)}</span></span>
              <input type="range" min={200} max={10000} step={100} value={aov} onChange={e => setAov(+e.target.value)} className="w-full mt-2 accent-[#00A86B]" />
            </label>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-[#F0FDF4] border border-[#DCFCE7] p-3.5">
                <p className="text-[11.5px] font-semibold text-[#15803D]">Orders recovered</p>
                <p className="text-[22px] font-extrabold text-[#00A86B] tabular-nums">~{recovered}</p>
              </div>
              <div className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-3.5">
                <p className="text-[11.5px] font-semibold text-[#64748B]">GMV saved from RTO</p>
                <p className="text-[22px] font-extrabold text-[#0F172A] tabular-nums">{fmt(recovered * aov)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5 md:p-6">
            <h3 className="text-[15px] font-bold text-[#0F172A] mb-2">Frequently asked questions</h3>
            <div className="divide-y divide-[#F1F5F9]">
              {FAQS.map((f, i) => {
                const open = openFaq === i;
                return (
                  <div key={f.q}>
                    <button type="button" onClick={() => setOpenFaq(open ? null : i)} className="w-full flex items-center justify-between gap-4 py-3.5 text-left">
                      <span className="text-[13px] font-semibold text-[#334155]">{f.q}</span>
                      <ChevronDown className={`w-4 h-4 text-[#94A3B8] shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence initial={false}>
                      {open && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <p className="pb-3.5 pr-6 text-[12.5px] text-[#64748B] leading-relaxed">{f.a}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <p className="text-[12px] text-[#64748B] italic flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 not-italic" />
          <span><b className="not-italic text-[#334155]">Note:</b> While NDR Follow-ups is active, it sends your NDR WhatsApp and AI calls — the NDR WhatsApp and AI NDR call from Notification settings are not sent as well, so your customers are never contacted twice.</span>
        </p>
      </div>

      {/* Activate / switch */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !busy && setSelected(null)} className="fixed inset-0 bg-[#0F172A]/50 backdrop-blur-sm z-[200]" />
            <div className="fixed inset-0 flex items-center justify-center z-[201] p-4 pointer-events-none">
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 16 }} transition={{ type: 'spring', duration: 0.4 }}
                className="w-full max-w-[420px] bg-white rounded-2xl shadow-2xl p-6 pointer-events-auto border border-[#E2E8F0]">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-[#F0FDF4] text-[#00A86B] flex items-center justify-center"><selected.icon className="w-5 h-5" /></span>
                    <div>
                      <h2 className="text-[15px] font-bold text-[#0F172A]">{currentMode ? `Switch to ${selected.name}?` : `Activate ${selected.name}?`}</h2>
                      <p className="text-[12.5px] text-[#64748B]">{(() => { const pl = priceLine(selected.key, access?.usagePrices, !!access?.charged); return `${pl.price} ${pl.unit}`.trim(); })()}</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setSelected(null)} aria-label="Close" className="text-[#94A3B8] hover:text-[#0F172A]"><X className="w-4 h-4" /></button>
                </div>
                <ul className="mt-4 space-y-1.5 text-[12.5px] text-[#475569]">
                  <li>• Applies to every new NDR from the moment it’s active</li>
                  <li>• {access?.charged ? 'Charged from your wallet only for delivered WhatsApp / answered calls' : 'Free right now — you will be told before any charges start'}</li>
                  <li>• Nothing is sent when your wallet cannot cover the price</li>
                  <li>• Change or deactivate anytime</li>
                </ul>
                <div className="mt-5 flex gap-3">
                  <button type="button" onClick={() => setSelected(null)} disabled={busy} className="flex-1 h-10 rounded-full border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] text-[13px] font-bold">Cancel</button>
                  <button type="button" onClick={confirm} disabled={busy} className="flex-1 h-10 rounded-full bg-[#00A86B] hover:bg-[#00965F] text-white text-[13px] font-bold shadow-sm disabled:opacity-70 inline-flex items-center justify-center gap-2">
                    {busy && <Loader2 className="w-4 h-4 animate-spin" />}{currentMode ? 'Confirm switch' : 'Confirm & activate'}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Deactivate */}
      <AnimatePresence>
        {confirmOff && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !busy && setConfirmOff(false)} className="fixed inset-0 bg-[#0F172A]/50 backdrop-blur-sm z-[200]" />
            <div className="fixed inset-0 flex items-center justify-center z-[201] p-4 pointer-events-none">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-[400px] bg-white rounded-2xl shadow-2xl p-6 pointer-events-auto border border-[#E2E8F0]">
                <h2 className="text-[15px] font-bold text-[#0F172A]">Deactivate NDR Follow-ups?</h2>
                <p className="mt-2 text-[12.5px] text-[#64748B]">New NDRs will not get a WhatsApp or AI call from this service. Follow-ups already sent finish normally.</p>
                <div className="mt-5 flex gap-3">
                  <button type="button" onClick={() => setConfirmOff(false)} disabled={busy} className="flex-1 h-10 rounded-full border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] text-[13px] font-bold">Keep active</button>
                  <button type="button" onClick={deactivate} disabled={busy} className="flex-1 h-10 rounded-full bg-red-600 hover:bg-red-700 text-white text-[13px] font-bold disabled:opacity-70 inline-flex items-center justify-center gap-2">
                    {busy && <Loader2 className="w-4 h-4 animate-spin" />}Deactivate
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      <Toast toast={toast} onClose={closeToast} />
      </DesktopPreferred>
    </AdminLayout>
  );
}
