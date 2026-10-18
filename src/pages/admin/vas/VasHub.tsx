import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Gauge, ShieldCheck, Wallet, Palette, Rocket, BellRing, PackageCheck, ArrowLeft, ArrowRight, CheckCircle2,
  Sparkles, LayoutList, PhoneCall, Truck, PackageX, MapPinCheck, MessageSquare, BadgeIndianRupee, Zap, Clock,
  type LucideIcon,
} from 'lucide-react';
import { AdminLayout } from '../../../components/admin/layout/AdminLayout';
import { vasApi } from './vasApi';

/* View all VAS — one hub for every value-added service: a "Curated for you" carousel, category tabs and a
   detailed card per service. Status comes from the existing /vas/my/:key API where a service has one. */

type Category = 'failures' | 'experience' | 'revenue' | 'automation';
type Tab = 'all' | 'active' | Category;

interface Service {
  key: string;
  vasKey?: string;           // /vas/my/:key — only services wired to the VAS API
  name: string;
  category: Category;
  headline: string;
  perks: string[];
  price: string;
  path: string;
  icon: LucideIcon;
  flow: { icon: LucideIcon; label: string; tone: string }[];
  comingSoon?: boolean;
  isNew?: boolean;
}

const SERVICES: Service[] = [
  {
    key: 'rto-score', vasKey: 'rto-score', name: 'RTO Score', category: 'failures', icon: Gauge, path: '/user/vas/rto-score',
    headline: 'Spot risky COD orders before you ship them',
    perks: ['High / Medium / Low risk on every COD order', 'Next best action for risky buyers', 'Track actual outcomes after shipping'],
    price: '₹3.49 / COD order',
    flow: [{ icon: LayoutList, label: 'Order placed', tone: 'bg-[#F1F5F9] text-[#475569]' }, { icon: Gauge, label: 'Risk scored', tone: 'bg-amber-50 text-amber-600' }, { icon: CheckCircle2, label: 'Ship safely', tone: 'bg-[#F0FDF4] text-[#00A86B]' }],
  },
  {
    key: 'ndr-followups', name: 'NDR Follow-ups', category: 'failures', icon: PhoneCall, path: '/user/vas/ndr-followups', isNew: true,
    headline: 'Win back NDRs before they become RTOs',
    perks: ['Instant WhatsApp with re-attempt & address buttons', 'Automatic IVR call if there’s no reply', 'Responses synced straight to the courier'],
    price: 'From ₹4.99 / order',
    flow: [{ icon: PackageX, label: 'Delivery fails', tone: 'bg-red-50 text-red-500' }, { icon: MessageSquare, label: 'WhatsApp + call', tone: 'bg-sky-50 text-sky-600' }, { icon: CheckCircle2, label: 'Re-attempted', tone: 'bg-[#F0FDF4] text-[#00A86B]' }],
  },
  {
    key: 'delivery-boost', name: 'QuickBoost', category: 'failures', icon: Rocket, path: '/user/vas/delivery-boost', comingSoon: true,
    headline: 'Recover failed deliveries with smart follow-ups',
    perks: ['WhatsApp & call follow-ups with buyers', 'Address correction & re-attempt scheduling', 'Fewer NDRs turning into RTO'],
    price: 'Pay on recovered orders',
    flow: [{ icon: PackageX, label: 'Courier fails', tone: 'bg-red-50 text-red-500' }, { icon: PhoneCall, label: 'We follow up', tone: 'bg-sky-50 text-sky-600' }, { icon: CheckCircle2, label: 'Delivered', tone: 'bg-[#F0FDF4] text-[#00A86B]' }],
  },
  {
    key: 'notify', name: 'Notify', category: 'experience', icon: BellRing, path: '/user/vas/notify', comingSoon: true,
    headline: 'Keep buyers updated at every step',
    perks: ['Automatic WhatsApp & SMS updates', 'Out-for-delivery and delay alerts', 'Fewer “where is my order” calls'],
    price: 'Per message',
    flow: [{ icon: Truck, label: 'Status changes', tone: 'bg-[#F1F5F9] text-[#475569]' }, { icon: MessageSquare, label: 'Buyer notified', tone: 'bg-sky-50 text-sky-600' }, { icon: CheckCircle2, label: 'Happy buyer', tone: 'bg-[#F0FDF4] text-[#00A86B]' }],
  },
  {
    key: 'branded-tracking', name: 'Branded Tracking Page', category: 'experience', icon: Palette, path: '/user/vas/branded-tracking',
    headline: 'Your brand on every tracking page',
    perks: ['Your logo, colours and links', 'Promote products to waiting buyers', 'Live shipment timeline'],
    price: 'Included',
    flow: [{ icon: Palette, label: 'Design page', tone: 'bg-violet-50 text-violet-600' }, { icon: Truck, label: 'Buyer tracks', tone: 'bg-sky-50 text-sky-600' }, { icon: Sparkles, label: 'Brand recall', tone: 'bg-[#F0FDF4] text-[#00A86B]' }],
  },
  {
    key: 'auto-secure', name: 'Secure', category: 'revenue', icon: ShieldCheck, path: '/user/vas/auto-secure',
    headline: 'Protect high-value shipments against loss & damage',
    perks: ['Automatic cover on eligible shipments', 'Simple claims from your dashboard', 'Rules by order value'],
    price: 'From a small % of order value',
    flow: [{ icon: ShieldCheck, label: 'Auto-secured', tone: 'bg-[#F0FDF4] text-[#00A86B]' }, { icon: PackageX, label: 'Lost / damaged', tone: 'bg-red-50 text-red-500' }, { icon: BadgeIndianRupee, label: 'Claim paid', tone: 'bg-amber-50 text-amber-600' }],
  },
  {
    key: 'early-cod', name: 'Seller Remittance', category: 'revenue', icon: Wallet, path: '/user/seller-remittance/early-cod',
    headline: 'Get your COD money faster',
    perks: ['Early COD remittance cycles', 'Better cash flow for restocking', 'Transparent remittance reports'],
    price: 'Small fee per remittance',
    flow: [{ icon: Truck, label: 'COD delivered', tone: 'bg-[#F1F5F9] text-[#475569]' }, { icon: Clock, label: 'Early cycle', tone: 'bg-sky-50 text-sky-600' }, { icon: Wallet, label: 'Cash in bank', tone: 'bg-[#F0FDF4] text-[#00A86B]' }],
  },
  {
    key: 'shipsure', name: 'QuickSure', category: 'automation', icon: PackageCheck, path: '/user/vas/shipsure', comingSoon: true, isNew: true,
    headline: 'End-to-end assurance for your most valuable orders',
    perks: ['Address verification before pickup', 'Priority handling & escalation', 'Automated exception tagging'],
    price: 'Per order',
    flow: [{ icon: MapPinCheck, label: 'Address verified', tone: 'bg-sky-50 text-sky-600' }, { icon: Zap, label: 'Auto-tagged', tone: 'bg-amber-50 text-amber-600' }, { icon: PackageCheck, label: 'Assured', tone: 'bg-[#F0FDF4] text-[#00A86B]' }],
  },
];

const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'All Services' },
  { key: 'active', label: 'Active Services' },
  { key: 'failures', label: 'Reduce Delivery Failures' },
  { key: 'experience', label: 'Improve Customer Experience' },
  { key: 'revenue', label: 'Protect & Grow Revenue' },
  { key: 'automation', label: 'Automation Services' },
];
const CATEGORY_LABEL: Record<Category, string> = {
  failures: 'Reduce Delivery Failures', experience: 'Improve Customer Experience', revenue: 'Protect & Grow Revenue', automation: 'Automation Services',
};
const EASE = [0.22, 1, 0.36, 1] as const;

function Curated({ items, onOpen }: { items: Service[]; onOpen: (s: Service) => void }) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = items.length;
  useEffect(() => {
    if (paused || n < 2) return;
    const id = window.setInterval(() => setIdx(i => (i + 1) % n), 4500);
    return () => window.clearInterval(id);
  }, [paused, n]);
  const go = (d: number) => setIdx(i => (i + d + n) % n);

  return (
    <div className="relative" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="flex items-center gap-4 mb-4">
        <span className="flex-1 h-px bg-gradient-to-r from-transparent to-[#CBD5E1]" />
        <span className="inline-flex items-center gap-1.5 text-[15px] font-bold italic text-[#00A86B]"><Sparkles className="w-4 h-4" />Curated For You</span>
        <span className="flex-1 h-px bg-gradient-to-l from-transparent to-[#CBD5E1]" />
      </div>

      <div className="relative h-[230px] md:h-[250px] [perspective:1400px]">
        {items.map((s, i) => {
          let rel = i - idx;
          if (rel > n / 2) rel -= n;
          if (rel < -n / 2) rel += n;
          const side = Math.abs(rel);
          const center = rel === 0;
          // Cards beyond the neighbours wait tucked behind the centre card, so the next one grows out from inside.
          const hidden = side > 1;
          const dir = Math.sign(rel);
          return (
            <motion.div key={s.key}
              initial={false}
              animate={hidden
                ? { x: `${dir * 18}%`, rotateY: dir * -10, scale: 0.6, opacity: 0 }
                : { x: `${rel * 62}%`, rotateY: rel * -18, scale: center ? 1 : 0.84, opacity: center ? 1 : 0.6 }}
              transition={{ duration: 0.75, ease: EASE }}
              style={{ zIndex: center ? 3 : hidden ? 0 : 2, pointerEvents: hidden ? 'none' : undefined, willChange: 'transform, opacity' }}
              onClick={() => (center ? undefined : setIdx(i))}
              className={`absolute left-1/2 top-0 -ml-[min(46%,320px)] w-[min(92%,640px)] h-full rounded-2xl overflow-hidden ${center ? 'shadow-[0_24px_60px_-20px_rgba(6,78,59,0.55)]' : 'cursor-pointer'}`}>
              <motion.span aria-hidden className="absolute inset-0 z-10 bg-white/35 pointer-events-none" initial={false} animate={{ opacity: center ? 0 : 1 }} transition={{ duration: 0.75, ease: EASE }} />
              <div className="relative h-full bg-gradient-to-br from-[#0F172A] via-[#0B3B2E] to-[#00A86B] p-5 md:p-7 grid grid-cols-1 md:grid-cols-[1.25fr_1fr] gap-5 items-center">
                <span className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-[#34D399]/20 blur-2xl" />
                <span className="absolute right-24 bottom-6 w-1 h-1 rounded-full bg-white/70 animate-pulse" />
                <span className="absolute right-10 top-8 w-1 h-1 rounded-full bg-white/60 animate-pulse" />
                <div className="relative">
                  <p className="text-[12.5px] font-semibold text-[#A7F3D0] flex items-center gap-1.5"><s.icon className="w-4 h-4" />{s.name}</p>
                  <h3 className="mt-2 text-[18px] md:text-[21px] font-bold text-white leading-snug">{s.headline}</h3>
                  <button type="button" tabIndex={center ? 0 : -1} onClick={e => { e.stopPropagation(); onOpen(s); }}
                    className="mt-5 h-11 px-6 w-full md:w-auto rounded-xl bg-[#00A86B] hover:bg-[#00965F] text-white text-[13.5px] font-bold shadow-[0_8px_20px_-8px_rgba(0,168,107,0.8)] ring-1 ring-white/20 transition-colors">
                    {s.comingSoon ? 'Explore' : 'Activate Now'}
                  </button>
                </div>
                <div className="relative hidden md:block">
                  <div className="flex items-center gap-2 mb-3 text-[12px] font-semibold text-white/60"><span className="flex-1 h-px bg-white/20" />Perks<span className="flex-1 h-px bg-white/20" /></div>
                  <ul className="space-y-2.5">
                    {s.perks.map(p => (
                      <li key={p} className="flex items-start gap-2 text-[13px] text-white/90"><CheckCircle2 className="w-4 h-4 text-[#34D399] shrink-0 mt-0.5" />{p}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          );
        })}
        <button type="button" onClick={() => go(-1)} aria-label="Previous"
          className="absolute left-0 md:left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-11 md:h-11 rounded-full bg-white border border-[#E2E8F0] shadow-md text-[#00A86B] flex items-center justify-center hover:bg-[#F0FDF4] transition-colors"><ArrowLeft className="w-4 h-4" /></button>
        <button type="button" onClick={() => go(1)} aria-label="Next"
          className="absolute right-0 md:right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-11 md:h-11 rounded-full bg-white border border-[#E2E8F0] shadow-md text-[#00A86B] flex items-center justify-center hover:bg-[#F0FDF4] transition-colors"><ArrowRight className="w-4 h-4" /></button>
      </div>
      <div className="flex justify-center gap-1.5 mt-4">
        {items.map((s, i) => (
          <button key={s.key} type="button" onClick={() => setIdx(i)} aria-label={`Show ${s.name}`}
            className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-6 bg-[#00A86B]' : 'w-1.5 bg-[#CBD5E1] hover:bg-[#94A3B8]'}`} />
        ))}
      </div>
    </div>
  );
}

function ServiceCard({ s, active, onOpen }: { s: Service; active: boolean; onOpen: () => void }) {
  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
      className={`relative bg-white rounded-2xl border overflow-hidden grid grid-cols-1 lg:grid-cols-[300px_1fr_260px] ${active ? 'border-[#00A86B]/40 shadow-[inset_-4px_0_0_#00A86B]' : 'border-[#E2E8F0]'} shadow-[0_1px_2px_rgba(16,24,40,0.04),0_2px_8px_rgba(16,24,40,0.05)]`}>
      {/* Flow illustration */}
      <div className="relative bg-gradient-to-br from-[#F0FDF4] to-[#F8FAFC] p-5 flex items-center justify-center">
        {s.isNew && <span className="absolute left-3 top-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#00A86B] text-white text-[10.5px] font-bold"><Sparkles className="w-3 h-3" />New</span>}
        <div className="flex items-center gap-2">
          {s.flow.map((f, i) => (
            <div key={f.label} className="flex items-center gap-2">
              <div className="flex flex-col items-center gap-1.5 w-[70px]">
                <motion.span initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 + i * 0.15 }}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ring-1 ring-black/5 ${f.tone}`}><f.icon className="w-5 h-5" /></motion.span>
                <span className="text-[10.5px] font-semibold text-[#475569] text-center leading-tight">{f.label}</span>
              </div>
              {i < s.flow.length - 1 && <ArrowRight className="w-4 h-4 text-[#94A3B8] -mt-5 shrink-0" />}
            </div>
          ))}
        </div>
      </div>
      {/* Details */}
      <div className="p-5 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[12.5px] font-semibold text-[#00A86B]">{s.name}</span>
          {active ? <span className="px-2 py-0.5 rounded-full border border-[#BBF7D0] bg-[#F0FDF4] text-[11px] font-bold text-[#16A34A]">Active</span>
            : s.comingSoon ? <span className="px-2 py-0.5 rounded-full border border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-bold text-[#64748B]">Coming soon</span> : null}
          <span className="text-[11px] text-[#94A3B8]">· {CATEGORY_LABEL[s.category]}</span>
        </div>
        <h3 className="mt-1.5 text-[16px] font-bold text-[#0F172A]">{s.headline}</h3>
        <div className="mt-3 pt-3 border-t border-[#F1F5F9]">
          <p className="text-[11.5px] font-semibold text-[#94A3B8] uppercase tracking-wide mb-2">What you'll get</p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-4 gap-y-1.5">
            {s.perks.map(p => <li key={p} className="flex items-start gap-1.5 text-[12.5px] text-[#334155]"><CheckCircle2 className="w-3.5 h-3.5 text-[#00A86B] shrink-0 mt-0.5" />{p}</li>)}
          </ul>
        </div>
      </div>
      {/* Price + CTA */}
      <div className="p-5 lg:pl-0 flex">
        <div className="w-full rounded-xl bg-[#F8FAFC] border border-[#F1F5F9] p-4 flex flex-col justify-center gap-3 text-center">
          <p className="text-[13px] text-[#64748B]">{s.price}</p>
          <button type="button" onClick={onOpen}
            className={`h-10 rounded-xl text-[13px] font-bold transition-colors ${active ? 'bg-white border border-[#00A86B] text-[#00A86B] hover:bg-[#F0FDF4]' : 'bg-[#00A86B] hover:bg-[#00965F] text-white shadow-sm'}`}>
            {active ? 'Manage Service' : s.comingSoon ? 'Learn More' : 'Activate Now'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export function VasHub() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('all');
  const [activeKeys, setActiveKeys] = useState<string[]>([]);

  useEffect(() => {
    let alive = true;
    Promise.allSettled(SERVICES.filter(s => s.vasKey).map(s => vasApi.mine(s.vasKey as string))).then(res => {
      if (!alive) return;
      setActiveKeys(res.flatMap(r => (r.status === 'fulfilled' && r.value.status === 'active' ? [r.value.key] : [])));
    });
    return () => { alive = false; };
  }, []);

  const shown = SERVICES.filter(s => tab === 'all' || (tab === 'active' ? activeKeys.includes(s.vasKey || '') : s.category === tab));
  const open = (s: Service) => navigate(s.path);

  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto pb-10 flex flex-col gap-6">
        <div>
          <h1 className="text-[20px] font-bold text-[#0F172A]">Value Added Services</h1>
          <p className="text-[13px] text-[#64748B] mt-0.5">Tools to improve delivery success, reduce losses and grow your business.</p>
        </div>

        <Curated items={SERVICES} onOpen={open} />

        <div className="flex gap-1 overflow-x-auto border-b border-[#E2E8F0] -mx-1 px-1">
          {TABS.map(t => (
            <button key={t.key} type="button" onClick={() => setTab(t.key)}
              className={`relative h-11 px-3.5 text-[13.5px] whitespace-nowrap font-semibold transition-colors ${tab === t.key ? 'text-[#00A86B]' : 'text-[#64748B] hover:text-[#0F172A]'}`}>
              {t.label}
              {t.key === 'active' && activeKeys.length > 0 && <span className="ml-1.5 px-1.5 rounded-full bg-[#F0FDF4] text-[#00A86B] text-[11px] font-bold">{activeKeys.length}</span>}
              {tab === t.key && <motion.span layoutId="vas-hub-tab" className="absolute left-2 right-2 -bottom-px h-0.5 rounded-full bg-[#00A86B]" />}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <AnimatePresence mode="popLayout">
            {shown.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl border border-[#E2E8F0] py-14 text-center">
                <span className="mx-auto w-12 h-12 rounded-2xl bg-[#F0FDF4] flex items-center justify-center"><Sparkles className="w-6 h-6 text-[#00A86B]" /></span>
                <p className="mt-3 text-[14px] font-semibold text-[#0F172A]">No active services yet</p>
                <p className="mt-1 text-[12.5px] text-[#94A3B8]">Activate a service to see it here.</p>
                <button type="button" onClick={() => setTab('all')} className="mt-4 text-[13px] font-semibold text-[#00A86B] hover:underline">Browse all services</button>
              </motion.div>
            ) : shown.map(s => (
              <ServiceCard key={s.key} s={s} active={activeKeys.includes(s.vasKey || '')} onOpen={() => open(s)} />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </AdminLayout>
  );
}
