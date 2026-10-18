import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, Zap, Phone, MessageCircle, PhoneCall, CheckCircle2, Sparkles, PackageX, Clock, RefreshCw,
  Truck, ChevronDown, X, Info, MapPin, BadgeCheck, Signal, Wifi, BatteryFull, ChevronLeft, Video, MoreVertical, Lock,
  CheckCheck, Smile, Paperclip, Mic, type LucideIcon,
} from 'lucide-react';
import { AdminLayout } from '../../../components/admin/layout/AdminLayout';
import { Toast } from '../../../components/ui/Toast';
import { ShineButton } from '../../../components/ui/ShineButton';
import { useToast } from '../../../hooks/useToast';

/* NDR Follow-ups (VAS). Frontend only for now — activation is not wired to the backend yet, so confirming a
   plan shows a notice instead of calling an API. Expected later: POST /vas/ndr-followups/activate { plan }. */
const BACKEND_READY = false;

type PlanKey = 'calling' | 'both' | 'whatsapp';
interface Plan {
  key: PlanKey; name: string; icon: LucideIcon; price: string; unit: string; extra?: string; extraNote?: string;
  lead: string; leadRest: string; perks: string[]; cta: string; recommended?: boolean;
}

const PLANS: Plan[] = [
  {
    key: 'calling', name: 'Calling', icon: Phone, price: '₹11.99', unit: '/order',
    lead: 'Automated voice call', leadRest: ' with IVR options to re-attempt or cancel the delivery.',
    perks: ['Up to 3 attempts per NDR', 'Greets customers with your store name', 'Automated follow-up after failed delivery'],
    cta: 'Activate calling',
  },
  {
    key: 'both', name: 'WhatsApp + Calling', icon: PhoneCall, price: '₹4.99', unit: '/order', extra: '+ ₹11.99 for calls',
    extraNote: '₹11.99 only when WhatsApp couldn’t close it', recommended: true,
    lead: 'WhatsApp goes first.', leadRest: ' Anyone who doesn’t reply in your window gets an automatic call.',
    perks: ['Highest recovery rate of the three', 'Pay for calls only when WhatsApp doesn’t close it', 'Up to 3 call attempts per unresolved NDR'],
    cta: 'Activate both',
  },
  {
    key: 'whatsapp', name: 'WhatsApp', icon: MessageCircle, price: '₹4.99', unit: '/order',
    lead: 'Instant WhatsApp message', leadRest: ' with re-attempt, change-address and cancel buttons.',
    perks: ['Auto-sent the moment an NDR is logged', 'Customer self-serves in a single tap', 'Reminder follow-up if no response'],
    cta: 'Activate · ₹4.99/order',
  },
];

const FLOW: { icon: LucideIcon; title: string; desc: string; tone: string }[] = [
  { icon: PackageX, title: 'Delivery fails', desc: 'Courier logs an NDR', tone: 'bg-red-50 text-red-500' },
  { icon: MessageCircle, title: 'WhatsApp sent', desc: 'Instantly, with action buttons', tone: 'bg-[#F0FDF4] text-[#00A86B]' },
  { icon: Clock, title: 'No reply?', desc: 'Wait for your reply window', tone: 'bg-amber-50 text-amber-600' },
  { icon: PhoneCall, title: 'Auto call', desc: 'IVR with your store name', tone: 'bg-sky-50 text-sky-600' },
  { icon: RefreshCw, title: 'Synced to courier', desc: 'Re-attempt, new address or cancel', tone: 'bg-violet-50 text-violet-600' },
];

const FAQS = [
  { q: 'When is a customer contacted?', a: 'As soon as the courier marks a delivery as failed (NDR). WhatsApp goes out instantly; calls follow if you chose Calling or WhatsApp + Calling.' },
  { q: 'What can the customer do?', a: 'Ask for a re-attempt on a preferred date, share a corrected address or landmark, or cancel the order. Their response is pushed to the courier automatically.' },
  { q: 'When am I charged?', a: 'Per NDR order that is followed up. On WhatsApp + Calling, the call charge applies only when WhatsApp did not resolve the NDR.' },
  { q: 'Can I switch plans later?', a: 'Yes. You can change or deactivate the plan anytime; changes apply to new NDRs.' },
];

const WA_ACTIONS: { label: string; icon: LucideIcon }[] = [
  { label: 'Re-attempt delivery', icon: RefreshCw }, { label: 'Change address', icon: MapPin }, { label: 'Cancel order', icon: X },
];

/** Quick estimate of what the follow-ups win back — illustrative, based on typical recovery rates. */
const RECOVERY: Record<PlanKey, number> = { whatsapp: 0.28, calling: 0.3, both: 0.42 };

const HERO_STATS: { v: string; l: string; icon: LucideIcon }[] = [
  { v: '< 1 min', l: 'to first contact', icon: Clock }, { v: '3x', l: 'call attempts', icon: PhoneCall }, { v: '0', l: 'manual work', icon: Zap },
];

/* WhatsApp-style preview of an NDR follow-up, played as a short loop:
   message → quick replies → customer typing → reply → QuickPost confirmation → synced to courier. */
const WA_STEPS = 5;
function WhatsAppPreview() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = window.setTimeout(() => setStep(s => (s >= WA_STEPS + 2 ? 0 : s + 1)), step === 0 ? 600 : step >= WA_STEPS ? 2600 : 1100);
    return () => window.clearTimeout(id);
  }, [step]);
  const pop = { initial: { opacity: 0, y: 8, scale: 0.96 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0 }, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } };

  return (
    <div className="relative mx-auto w-full max-w-[320px]" aria-hidden>
      <div className="rounded-[34px] bg-[#0F172A] p-[7px] shadow-[0_30px_60px_-24px_rgba(15,23,42,0.55)] ring-1 ring-black/10">
        <div className="relative rounded-[28px] overflow-hidden bg-[#EFEAE2] h-[540px] flex flex-col">
          {/* Status bar */}
          <div className="bg-[#008069] px-5 pt-2 pb-1 flex items-center justify-between text-[10.5px] font-semibold text-white">
            <span>11:42</span>
            <span className="absolute left-1/2 -translate-x-1/2 top-1.5 w-20 h-4 rounded-full bg-[#0F172A]" />
            <span className="flex items-center gap-1"><Signal className="w-3 h-3" /><Wifi className="w-3 h-3" /><BatteryFull className="w-3.5 h-3.5" /></span>
          </div>
          {/* Chat header */}
          <div className="bg-[#008069] px-2.5 pb-2.5 pt-1 flex items-center gap-2 text-white">
            <ChevronLeft className="w-5 h-5 shrink-0" />
            {/* QuickPost pin mark, cropped from the full logo */}
            <span className="relative w-9 h-9 rounded-full bg-white overflow-hidden shrink-0 ring-2 ring-white/30">
              <img src="/logo-color.png" alt="" className="absolute max-w-none" style={{ width: 118, height: 118, left: 2, top: -41 }} />
            </span>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="text-[13.5px] font-bold flex items-center gap-1">QuickPost <BadgeCheck className="w-4 h-4 fill-[#25D366] text-white shrink-0" /></p>
              <p className="text-[10.5px] text-white/80 truncate">Official business account</p>
            </div>
            <Video className="w-[18px] h-[18px] shrink-0 opacity-90" />
            <Phone className="w-4 h-4 shrink-0 opacity-90 ml-2.5" />
            <MoreVertical className="w-4 h-4 shrink-0 opacity-90 ml-1.5" />
          </div>

          {/* Chat */}
          <div className="flex-1 min-h-0 overflow-hidden px-2.5 py-2.5 flex flex-col justify-end gap-1.5 [background-image:radial-gradient(rgba(0,0,0,0.045)_1px,transparent_1px)] [background-size:14px_14px]">
            <div className="flex justify-center"><span className="px-2 py-0.5 rounded-md bg-white/90 text-[10px] font-semibold text-[#54656F] shadow-sm">TODAY</span></div>
            <div className="mx-auto max-w-[92%] rounded-md bg-[#FFF5C4] px-2 py-1 text-[9.5px] text-[#54656F] text-center leading-snug flex items-start gap-1 justify-center">
              <Lock className="w-2.5 h-2.5 mt-0.5 shrink-0" />This business uses a secure service from Meta to manage this chat.
            </div>

            <AnimatePresence>
              {step >= 1 && (
                <motion.div key="msg" {...pop} className="max-w-[86%] rounded-lg rounded-tl-none bg-white shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] overflow-hidden">
                  <div className="px-2.5 pt-2">
                    <p className="text-[11.5px] font-bold text-[#111B21]">Delivery attempt failed 📦</p>
                    <p className="mt-0.5 text-[11.5px] text-[#111B21] leading-snug">Hi Priya, our courier couldn’t deliver your order today. What would you like us to do?</p>
                    <div className="mt-1.5 rounded-md bg-[#F0F2F5] px-2 py-1.5 flex items-center gap-2">
                      <span className="w-7 h-7 rounded bg-white flex items-center justify-center"><PackageX className="w-3.5 h-3.5 text-[#00A86B]" /></span>
                      <div className="leading-tight min-w-0">
                        <p className="text-[10.5px] font-bold text-[#111B21]">Order #QP240518</p>
                        <p className="text-[9.5px] text-[#667781] truncate">COD · ₹1,299 · Your Store</p>
                      </div>
                    </div>
                    <p className="text-[9px] text-[#667781] text-right py-1">11:42 AM</p>
                  </div>
                  {step >= 2 && WA_ACTIONS.map((a, i) => (
                    <motion.div key={a.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.12 }}
                      className={`border-t border-[#E9EDEF] py-1.5 text-center text-[11.5px] font-semibold text-[#00A884] flex items-center justify-center gap-1.5 ${step >= 4 && i === 0 ? 'bg-[#E7F8F3]' : ''}`}>
                      <a.icon className="w-3.5 h-3.5" />{a.label}
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="typing" {...pop} className="ml-auto w-14 rounded-lg rounded-tr-none bg-[#D9FDD3] px-2.5 py-2 flex items-center justify-center gap-1 shadow-[0_1px_0.5px_rgba(0,0,0,0.13)]">
                  {[0, 1, 2].map(d => (
                    <motion.span key={d} className="w-1.5 h-1.5 rounded-full bg-[#667781]" animate={{ y: [0, -3, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: d * 0.15 }} />
                  ))}
                </motion.div>
              )}

              {step >= 4 && (
                <motion.div key="reply" {...pop} className="ml-auto max-w-[72%] rounded-lg rounded-tr-none bg-[#D9FDD3] px-2.5 pt-1.5 shadow-[0_1px_0.5px_rgba(0,0,0,0.13)]">
                  <p className="text-[11.5px] text-[#111B21]">Re-attempt delivery tomorrow 🙏</p>
                  <p className="text-[9px] text-[#667781] text-right pb-1 flex items-center justify-end gap-0.5">11:44 AM <CheckCheck className="w-3 h-3 text-[#53BDEB]" /></p>
                </motion.div>
              )}

              {step >= 5 && (
                <motion.div key="confirm" {...pop} className="max-w-[86%] rounded-lg rounded-tl-none bg-white px-2.5 pt-1.5 shadow-[0_1px_0.5px_rgba(0,0,0,0.13)]">
                  <p className="text-[11.5px] text-[#111B21] leading-snug">Done! ✅ Your delivery is re-scheduled for <b>tomorrow</b>. Please keep your phone reachable.</p>
                  <p className="text-[9px] text-[#667781] text-right pb-1">11:44 AM</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Input bar */}
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
  const [selected, setSelected] = useState<Plan | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [ndrs, setNdrs] = useState(200);
  const [aov, setAov] = useState(1200);
  const [estPlan, setEstPlan] = useState<PlanKey>('both');
  const [busy, setBusy] = useState(false);

  const recovered = Math.round(ndrs * RECOVERY[estPlan]);
  const fmt = (v: number) => `₹${Math.round(v).toLocaleString('en-IN')}`;

  const confirm = () => {
    if (!selected) return;
    setBusy(true);
    window.setTimeout(() => {
      setBusy(false);
      setSelected(null);
      showToast('info', BACKEND_READY ? `${selected.name} activated.` : 'NDR Follow-ups will be available to activate soon. We’ll notify you once it’s live.');
    }, 500);
  };

  return (
    <AdminLayout>
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

        {/* Hero */}
        <div className="border-b border-[#E2E8F0] pb-6">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-8 lg:gap-12 items-center">
            <div className="min-w-0 pl-[35px] lg:relative lg:-top-10">
              <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#00A86B]">
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp + IVR automation
              </span>
              <h2 className="mt-2 text-[28px] md:text-[40px] font-extrabold tracking-tight text-[#0F172A] leading-[1.12]">
                Win back NDRs<br />
                <span className="text-[#00A86B]">before they become RTOs.</span>
              </h2>
              <p className="mt-3 text-[14px] md:text-[15px] text-[#64748B] leading-relaxed max-w-[540px]">
                When a delivery fails, we reach the customer on WhatsApp and by call to confirm a re-attempt or cancellation, then sync their response straight to the courier.
              </p>

              <div className="mt-6 grid grid-cols-3 gap-3 max-w-[540px]">
                {HERO_STATS.map(k => (
                  <div key={k.l} className="rounded-2xl bg-white/90 border border-[#E2E8F0] px-3.5 py-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
                    <span className="w-7 h-7 rounded-lg bg-[#F0FDF4] text-[#00A86B] flex items-center justify-center"><k.icon className="w-3.5 h-3.5" /></span>
                    <p className="mt-2 text-[18px] md:text-[20px] font-extrabold text-[#0F172A] leading-none">{k.v}</p>
                    <p className="mt-1 text-[11.5px] text-[#64748B]">{k.l}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-5 border-t border-[#E2E8F0]/80 max-w-[540px]">
                <p className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider mb-2.5">Your customer can, in one tap</p>
                <div className="flex flex-wrap gap-2">
                  {WA_ACTIONS.map(a => (
                    <span key={a.label} className="inline-flex items-center gap-1.5 h-8 pl-1.5 pr-3 rounded-full bg-white border border-[#E2E8F0] text-[12.5px] font-semibold text-[#334155]">
                      <span className="w-5 h-5 rounded-full bg-[#F0FDF4] text-[#00A86B] flex items-center justify-center"><a.icon className="w-3 h-3" /></span>{a.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:pr-5"><WhatsAppPreview /></div>
          </div>
        </div>

        {/* Plans */}
        <div className="rounded-2xl bg-gradient-to-b from-[#F0FDF4] to-[#F8FAFC] border border-[#E2E8F0] px-4 py-7 md:px-8">
          <div className="text-center">
            <h2 className="text-[20px] md:text-[24px] font-extrabold text-[#0F172A]">Choose how you recover NDRs</h2>
            <p className="mt-1 text-[13px] text-[#64748B]">Run WhatsApp, Calling, or both. We recommend both: WhatsApp first, with a call for anyone who doesn’t reply.</p>
          </div>
          <div className="mt-7 grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
            {PLANS.map((p, i) => (
              <motion.div key={p.key} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 * i }}
                className={`relative flex flex-col rounded-2xl bg-white p-5 md:p-6 transition-shadow ${p.recommended
                  ? 'border-2 border-[#00A86B] shadow-[0_20px_44px_-18px_rgba(0,168,107,0.45)] lg:-my-3'
                  : 'border border-[#E2E8F0] shadow-[0_1px_2px_rgba(16,24,40,0.04),0_2px_8px_rgba(16,24,40,0.05)] hover:shadow-md'}`}>
                {p.recommended && (
                  <span className="absolute -top-px right-5 -translate-y-1/2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#00A86B] text-white text-[11.5px] font-bold shadow-sm">
                    Recommended <Sparkles className="w-3 h-3" />
                  </span>
                )}
                <div className="flex items-center gap-3 pb-4 border-b border-[#F1F5F9]">
                  <span className="w-11 h-11 rounded-xl bg-[#F0FDF4] text-[#00A86B] flex items-center justify-center"><p.icon className="w-5 h-5" /></span>
                  <h3 className="text-[17px] font-bold text-[#0F172A]">{p.name}</h3>
                </div>
                <div className="pt-4">
                  <p className="flex items-baseline gap-1.5 flex-wrap">
                    <span className={`text-[30px] font-extrabold tracking-tight ${p.recommended ? 'text-[#00A86B]' : 'text-[#0F172A]'}`}>{p.price}</span>
                    <span className="text-[13px] text-[#94A3B8]">{p.unit}{p.extra ? ` ${p.extra}` : ''}</span>
                  </p>
                  {p.extraNote && <p className="mt-1 text-[12px] font-semibold text-[#00A86B]">{p.extraNote}</p>}
                  <p className="mt-3 text-[13px] text-[#475569] leading-relaxed"><b className="text-[#0F172A]">{p.lead}</b>{p.leadRest}</p>
                </div>
                <ul className="mt-4 pt-4 border-t border-[#F1F5F9] space-y-2.5 flex-1">
                  {p.perks.map(k => <li key={k} className="flex items-start gap-2 text-[12.5px] text-[#334155]"><CheckCircle2 className="w-4 h-4 text-[#00A86B] shrink-0 mt-px" />{k}</li>)}
                </ul>
                <ShineButton type="button" onClick={() => setSelected(p)}
                  className={`mt-6 h-12 w-full rounded-full text-[14px] font-bold inline-flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] ${p.recommended
                    ? 'bg-gradient-to-r from-[#00A86B] to-[#10B981] text-white shadow-[0_10px_24px_-10px_rgba(0,168,107,0.75)] hover:shadow-[0_14px_28px_-10px_rgba(0,168,107,0.85)] hover:-translate-y-px'
                    : 'border-[1.5px] border-[#00A86B] text-[#00A86B] bg-white hover:bg-[#F0FDF4] hover:-translate-y-px hover:shadow-[0_8px_18px_-10px_rgba(0,168,107,0.5)]'}`}>
                  <span className="relative">{p.cta}</span>
                  <ArrowRight className="relative w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </ShineButton>
              </motion.div>
            ))}
          </div>
        </div>

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
          <span><b className="not-italic text-[#334155]">Note:</b> Messages are sent from QuickPost’s verified business number (green tick) and calls greet customers with your store name. You can switch WhatsApp to your own brand number anytime in Settings.</span>
        </p>
      </div>

      {/* Confirm */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelected(null)} className="fixed inset-0 bg-[#0F172A]/50 backdrop-blur-sm z-[200]" />
            <div className="fixed inset-0 flex items-center justify-center z-[201] p-4 pointer-events-none">
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 16 }} transition={{ type: 'spring', duration: 0.4 }}
                className="w-full max-w-[420px] bg-white rounded-2xl shadow-2xl p-6 pointer-events-auto border border-[#E2E8F0]">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-[#F0FDF4] text-[#00A86B] flex items-center justify-center"><selected.icon className="w-5 h-5" /></span>
                    <div>
                      <h2 className="text-[15px] font-bold text-[#0F172A]">Activate {selected.name}?</h2>
                      <p className="text-[12.5px] text-[#64748B]">{selected.price}{selected.unit}{selected.extra ? ` ${selected.extra}` : ''}</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setSelected(null)} aria-label="Close" className="text-[#94A3B8] hover:text-[#0F172A]"><X className="w-4 h-4" /></button>
                </div>
                <ul className="mt-4 space-y-1.5 text-[12.5px] text-[#475569]">
                  <li>• Applies to every new NDR from the moment it’s active</li>
                  <li>• Charges are auto-deducted from your wallet per followed-up NDR</li>
                  <li>• Change or deactivate anytime</li>
                </ul>
                <div className="mt-5 flex gap-3">
                  <button type="button" onClick={() => setSelected(null)} className="flex-1 h-10 rounded-full border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] text-[13px] font-bold">Cancel</button>
                  <button type="button" onClick={confirm} disabled={busy} className="flex-1 h-10 rounded-full bg-[#00A86B] hover:bg-[#00965F] text-white text-[13px] font-bold shadow-sm disabled:opacity-70">{busy ? 'Activating…' : 'Confirm & activate'}</button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      <Toast toast={toast} onClose={closeToast} />
    </AdminLayout>
  );
}
