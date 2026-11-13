import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import {
  MapPin, Package, Loader2, AlertCircle, Search, Copy, Check, Truck, ScanLine, PackageCheck, Home,
  Clock, RotateCcw, RefreshCw, Link2, MessageCircle, ChevronDown, CalendarClock, Undo2, Warehouse, CircleDot, TriangleAlert,
  type LucideIcon,
} from 'lucide-react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { apiClient } from '../../services/apiClient';
import { copyToClipboard } from '../../utils/clipboard';

/* Seller / admin shipment tracking (opened from an AWB anywhere in the panel).
   One request: /orders/GetTrackingByAwb/:awb. Everything on the page is derived from that response:
   status headline, route, journey stages with the time each was reached, day-grouped scan history,
   and the shipment's order, address and package details. */

export interface TrackingEvent {
  id: number;
  iso: string;
  date: string;
  time: string;
  status: string;
  desc: string;
  location: string;
  active: boolean;
}

interface Place { name: string; city: string; state: string; pin: string }

export interface TrackingData {
  awb: string;
  orderId: string;
  orderDate: string;
  paymentMode: string;
  orderAmount: number;
  currentStatus: string;
  estimatedDelivery: string;
  estimatedIso: string | null;
  courierName: string;
  courierLogo: string;
  events: TrackingEvent[];
  origin: Place;
  destination: Place;
  weightKg: number | null;
  dims: string | null;
  products: { name: string; qty: number }[];
  ndrAttempts: number;
}

// ── Dates: courier timestamps are shown in UTC, as the rest of the panel does ──
const fmtUtc = (dateStr?: string): { date: string; time: string } => {
  if (!dateStr) return { date: '—', time: '' };
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return { date: String(dateStr), time: '' };
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
  const year = d.getUTCFullYear();
  let h = d.getUTCHours();
  const min = String(d.getUTCMinutes()).padStart(2, '0');
  const amPm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return { date: `${day} ${month} ${year}`, time: `${h}:${min} ${amPm}` };
};
const dayLabel = (iso: string): string => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
};
const daysBetween = (fromIso: string, to = new Date()): number => {
  const a = new Date(fromIso); a.setUTCHours(0, 0, 0, 0);
  const b = new Date(to); b.setUTCHours(0, 0, 0, 0);
  return Math.round((a.getTime() - b.getTime()) / 86400000);
};

const getCourierLogo = (name: string): string => {
  const n = (name || '').toLowerCase();
  if (n.includes('delhivery'))                           return '/brands/delhivery.png';
  if (n.includes('amazon'))                              return '/brands/amazon.png';
  if (n.includes('dtdc'))                                return '/brands/dtdc.png';
  if (n.includes('ekart'))                               return '/brands/ekart.png';
  if (n.includes('losung') || n.includes('lousung'))     return '/brands/losung.jpg';
  if (n.includes('shadowfax'))                           return '/brands/shadowfax.png';
  if (n.includes('shiprocket'))                          return '/brands/shiprocket.jpg';
  if (n.includes('shree') || n.includes('maruti'))       return '/brands/shree_maruti.jpg';
  if (n.includes('xpressbees'))                          return '/brands/xpressbees.png';
  if (n.includes('bluedart') || n.includes('blue dart')) return '/brands/bluedart.png';
  return '';
};

/* eslint-disable @typescript-eslint/no-explicit-any */
const place = (a: any): Place => ({
  name: a?.contactName || '', city: a?.city || '', state: a?.state || '', pin: String(a?.pinCode || a?.pincode || ''),
});

const fetchTrackingData = async (awbNumber: string): Promise<TrackingData> => {
  const res = await apiClient.get(`/orders/GetTrackingByAwb/${awbNumber.trim()}`);
  const d = res.data;
  const courierName = d.courierServiceName || d.courierName || '—';

  // One entry per scan time, newest first
  const rawTracking: any[] = d.tracking || [];
  const deduped = [...new Map(
    rawTracking.filter((t: any) => t.StatusDateTime).map((t: any) => [t.StatusDateTime, t]),
  ).values()].reverse();

  const events: TrackingEvent[] = deduped.map((t: any, idx: number) => {
    const { date, time } = fmtUtc(t.StatusDateTime);
    return {
      id: idx + 1, iso: t.StatusDateTime, date, time,
      status: t.status || t.Instructions || '—',
      desc: t.Instructions && t.Instructions !== t.status ? t.Instructions : '',
      location: t.StatusLocation || '',
      active: idx === 0,
    };
  });

  const pkg = d.packageDetails || {};
  const vol = pkg.volumetricWeight || {};
  const l = Number(vol.length ?? pkg.length) || 0, w = Number(vol.width ?? pkg.width) || 0, h = Number(vol.height ?? pkg.height) || 0;
  const weight = Number(pkg.applicableWeight ?? pkg.deadWeight ?? d.totalWeight);

  return {
    awb: d.awb_number || awbNumber,
    orderId: String(d.orderId || '—'),
    orderDate: fmtUtc(d.createdAt || d.shipmentCreatedAt).date,
    paymentMode: d.paymentDetails?.method || '—',
    orderAmount: Number(d.paymentDetails?.amount) || 0,
    currentStatus: d.status || '—',
    estimatedDelivery: fmtUtc(d.estimatedDeliveryDate).date,
    estimatedIso: d.estimatedDeliveryDate || null,
    courierName,
    courierLogo: getCourierLogo(courierName),
    events,
    origin: place(d.pickupAddress),
    destination: place(d.receiverAddress),
    weightKg: Number.isFinite(weight) && weight > 0 ? weight : null,
    dims: l && w && h ? `${l} × ${w} × ${h} cm` : null,
    products: Array.isArray(d.productDetails) ? d.productDetails.filter((p: any) => p?.name).map((p: any) => ({ name: String(p.name), qty: Number(p.quantity) || 1 })) : [],
    ndrAttempts: Array.isArray(d.ndrHistory) ? d.ndrHistory.length : 0,
  };
};
/* eslint-enable @typescript-eslint/no-explicit-any */

// ── Journey model ─────────────────────────────────────────────────────────────
type Flow = 'forward' | 'rto' | 'stopped';
interface Stage { key: string; label: string; icon: LucideIcon; match: string[] }

const FORWARD_STAGES: Stage[] = [
  { key: 'booked',    label: 'Booked',           icon: Package,      match: ['booked', 'ready to ship', 'pickup scheduled', 'manifest', 'new'] },
  { key: 'picked',    label: 'Picked up',        icon: ScanLine,     match: ['picked up', 'pickup done', 'picked'] },
  { key: 'transit',   label: 'In transit',       icon: Truck,        match: ['in transit', 'in-transit', 'transit', 'hub', 'bag', 'dispatch', 'arrived', 'reached'] },
  { key: 'ofd',       label: 'Out for delivery', icon: Warehouse,    match: ['out for delivery'] },
  { key: 'delivered', label: 'Delivered',        icon: PackageCheck, match: ['delivered'] },
];
const RTO_STAGES: Stage[] = [
  { key: 'rto-init',    label: 'Return started',   icon: Undo2,        match: ['rto initiated', 'rto'] },
  { key: 'rto-transit', label: 'Return in transit', icon: Truck,        match: ['rto in transit', 'rto in-transit', 'rto intransit'] },
  { key: 'rto-done',    label: 'Returned to you',  icon: PackageCheck, match: ['rto delivered'] },
];

function resolveJourney(status: string): { flow: Flow; stages: Stage[]; index: number } {
  const s = (status || '').toLowerCase();
  if (s.includes('rto')) {
    const index = s.includes('deliver') ? 2 : s.includes('transit') ? 1 : 0;
    return { flow: 'rto', stages: RTO_STAGES, index };
  }
  if (s.includes('cancel') || s.includes('lost') || s.includes('damag')) return { flow: 'stopped', stages: FORWARD_STAGES, index: -1 };
  // "undelivered" contains "delivered": it is a failed attempt, so the parcel is still at the out-for-delivery stage
  if (s.includes('undelivered')) return { flow: 'forward', stages: FORWARD_STAGES, index: 3 };
  for (let i = FORWARD_STAGES.length - 1; i >= 0; i--) {
    if (FORWARD_STAGES[i].match.some(m => s.includes(m))) return { flow: 'forward', stages: FORWARD_STAGES, index: i };
  }
  return { flow: 'forward', stages: FORWARD_STAGES, index: 0 };
}

/** When each stage was first reached, read from the scan history (oldest match). */
function stageTimes(stages: Stage[], events: TrackingEvent[]): (TrackingEvent | null)[] {
  const oldestFirst = [...events].reverse();
  return stages.map(st => {
    const hit = oldestFirst.find(e => {
      const t = `${e.status} ${e.desc}`.toLowerCase();
      if (st.key === 'delivered' && (t.includes('undelivered') || t.includes('rto') || t.includes('out for delivery'))) return false;
      return st.match.some(m => t.includes(m));
    });
    return hit || null;
  });
}

type Tone = 'green' | 'amber' | 'sky' | 'red' | 'slate';
const TONE: Record<Tone, { text: string; bg: string; border: string; solid: string }> = {
  green: { text: 'text-[#00A86B]', bg: 'bg-[#F0FDF4]', border: 'border-[#00A86B]/25', solid: '#00A86B' },
  amber: { text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', solid: '#D97706' },
  sky:   { text: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-200', solid: '#0284C7' },
  red:   { text: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', solid: '#DC2626' },
  slate: { text: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', solid: '#64748B' },
};
function statusTone(status: string): Tone {
  const s = (status || '').toLowerCase();
  if (s.includes('cancel') || s.includes('lost') || s.includes('damag')) return 'red';
  if (s.includes('rto') || s.includes('undelivered')) return 'amber';
  if (s.includes('delivered')) return 'green';
  if (s.includes('out for delivery')) return 'green';
  if (s.includes('transit') || s.includes('picked')) return 'sky';
  return 'slate';
}

/** Icon for one scan line, from its wording. */
function eventIcon(text: string): LucideIcon {
  const t = text.toLowerCase();
  if (t.includes('rto') || t.includes('return')) return Undo2;
  if (t.includes('undelivered') || t.includes('fail') || t.includes('not available') || t.includes('refus')) return TriangleAlert;
  if (t.includes('delivered')) return PackageCheck;
  if (t.includes('out for delivery')) return Home;
  if (t.includes('pick')) return ScanLine;
  if (t.includes('transit') || t.includes('dispatch') || t.includes('bag')) return Truck;
  if (t.includes('hub') || t.includes('arriv') || t.includes('reach') || t.includes('facility')) return Warehouse;
  return CircleDot;
}

const card = 'bg-white rounded-2xl border border-[#E2E8F0]';

/** Delivery truck drawn for the route line: box body with the brand stripe, cab with window and headlight,
    spinning wheels, a light suspension bounce and speed lines while moving. Faces right; flipped for returns. */
function RouteTruck({ color, moving, flip }: { color: string; moving: boolean; flip?: boolean }) {
  const reduced = useReducedMotion() ?? false;
  const go = moving && !reduced;
  const wheel = (cx: number) => (
    <g>
      <circle cx={cx} cy={38} r={6.5} fill="#1E293B" />
      <circle cx={cx} cy={38} r={3.2} fill="#CBD5E1" />
      <g stroke="#64748B" strokeWidth={1}>
        <line x1={cx - 3} y1={38} x2={cx + 3} y2={38} /><line x1={cx} y1={35} x2={cx} y2={41} />
        {go && <animateTransform attributeName="transform" type="rotate" from={`0 ${cx} 38`} to={`360 ${cx} 38`} dur="0.7s" repeatCount="indefinite" />}
      </g>
    </g>
  );
  return (
    <svg viewBox="0 0 84 48" className="w-[64px] h-[37px] overflow-visible drop-shadow-[0_3px_4px_rgba(15,23,42,0.18)]" style={flip ? { transform: 'scaleX(-1)' } : undefined} aria-hidden>
      {go && [14, 22, 30].map((y, i) => (
        <line key={y} x1={-4} y1={y} x2={-12 - i * 3} y2={y} stroke="#CBD5E1" strokeWidth={1.6} strokeLinecap="round">
          <animate attributeName="opacity" values="0;1;0" dur={`${0.7 + i * 0.15}s`} repeatCount="indefinite" />
        </line>
      ))}
      <g>
        {go && <animateTransform attributeName="transform" type="translate" values="0 0; 0 -0.9; 0 0" dur="0.45s" repeatCount="indefinite" />}
        {/* cargo box */}
        <rect x={2} y={6} width={50} height={28} rx={3} fill="#FFFFFF" stroke="#CBD5E1" strokeWidth={1.2} />
        <rect x={2} y={22} width={50} height={6} fill={color} />
        <line x1={27} y1={7} x2={27} y2={21} stroke="#E2E8F0" strokeWidth={1} />
        {/* cab */}
        <path d="M54 14 h12 a4 4 0 0 1 3.4 1.9 l7.2 11.4 a4 4 0 0 1 .6 2.1 V34 H54 Z" fill={color} />
        <path d="M58 17.5 h7 a2 2 0 0 1 1.7 1 l3.9 6.3 a1 1 0 0 1 -.85 1.5 H58 Z" fill="#E0F2FE" opacity={0.95} />
        <rect x={74.5} y={28} width={3} height={3} rx={1} fill="#FDE68A" />
        <rect x={54} y={24} width={1.6} height={10} fill="#0F172A" opacity={0.18} />
        {/* chassis */}
        <rect x={1} y={33} width={77} height={3.5} rx={1.5} fill="#334155" />
      </g>
      {wheel(16)}{wheel(40)}{wheel(66)}
    </svg>
  );
}

function JourneyRail({ stages, index, times, flow }: { stages: Stage[]; index: number; times: (TrackingEvent | null)[]; flow: Flow }) {
  const reduced = useReducedMotion() ?? false;
  const color = flow === 'rto' ? '#D97706' : '#00A86B';
  const pctDone = index <= 0 ? 0 : (index / (stages.length - 1)) * 100;
  return (
    <div className="-mx-1 px-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="relative min-w-[520px] sm:min-w-0 pt-1">
        {/* track */}
        <div className="absolute left-[calc(10%)] right-[calc(10%)] top-[22px] h-[3px] rounded-full bg-[#E9EEF3]" style={{ left: `${50 / stages.length}%`, right: `${50 / stages.length}%` }}>
          <motion.div className="h-full rounded-full" style={{ backgroundColor: color }}
            initial={{ width: reduced ? `${pctDone}%` : 0 }} animate={{ width: `${pctDone}%` }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} />
        </div>
        <ol className="relative grid" style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))` }}>
          {stages.map((st, i) => {
            const done = index >= 0 && i <= index;
            const current = i === index;
            const t = times[i];
            return (
              <li key={st.key} className="flex flex-col items-center text-center px-1">
                <span className="relative flex items-center justify-center w-10 h-10 rounded-full border-2 bg-white"
                  style={done ? { backgroundColor: color, borderColor: color, color: '#fff' } : { borderColor: '#E2E8F0', color: '#CBD5E1' }}>
                  {current && !reduced && <span className="absolute inset-0 rounded-full animate-ping opacity-25" style={{ backgroundColor: color }} />}
                  <st.icon className="relative w-[18px] h-[18px]" strokeWidth={2.2} />
                </span>
                <span className={`mt-2 text-[12px] font-semibold leading-tight ${done ? 'text-[#0F172A]' : 'text-[#94A3B8]'}`}>{st.label}</span>
                <span className="mt-0.5 text-[10.5px] text-[#94A3B8] leading-tight tabular-nums min-h-[14px]">{done && t ? `${t.date.slice(0, 6)} · ${t.time}` : ''}</span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

function Row({ k, v, mono }: { k: string; v: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <span className="text-[12px] text-[#64748B] shrink-0">{k}</span>
      <span className={`text-[12.5px] font-semibold text-[#0F172A] text-right break-words min-w-0 ${mono ? 'font-mono' : ''}`}>{v}</span>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-5 animate-pulse" aria-hidden>
      <div className={`${card} p-6`}><div className="h-5 w-40 bg-[#EEF2F6] rounded" /><div className="mt-3 h-8 w-72 bg-[#EEF2F6] rounded" /><div className="mt-8 h-16 bg-[#F4F6F8] rounded-xl" /></div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className={`${card} lg:col-span-8 p-6 space-y-4`}>{[0, 1, 2, 3].map(i => <div key={i} className="h-12 bg-[#F4F6F8] rounded-xl" />)}</div>
        <div className={`${card} lg:col-span-4 p-6 space-y-3`}>{[0, 1, 2, 3, 4].map(i => <div key={i} className="h-5 bg-[#F4F6F8] rounded" />)}</div>
      </div>
    </div>
  );
}

const COLLAPSED_EVENTS = 4;

export function AdminTracking() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [awb, setAwb] = useState(location.state?.awb || searchParams.get('awb') || '');
  const [data, setData] = useState<TrackingData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<'awb' | 'link' | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null);

  const handleTrack = async (trackingAwb: string = awb) => {
    if (!trackingAwb.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      setData(await fetchTrackingData(trackingAwb));
      setShowAll(false);
      setRefreshedAt(new Date());
    } catch {
      setError('We could not find tracking for this AWB. Check the number and try again.');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const paramAwb = searchParams.get('awb') || location.state?.awb || '';
    if (paramAwb) { setAwb(paramAwb); handleTrack(paramAwb); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get('awb'), location.state?.awb]);

  const publicLink = data ? `${window.location.origin}/track?awb=${encodeURIComponent(data.awb)}` : '';
  const flash = (k: 'awb' | 'link') => { setCopied(k); window.setTimeout(() => setCopied(null), 1400); };
  const copyAwb = () => { if (data) { copyToClipboard(data.awb); flash('awb'); } };
  const copyLink = () => { if (data) { copyToClipboard(publicLink); flash('link'); } };
  const shareWhatsApp = () => {
    if (!data) return;
    const text = `Track your order ${data.orderId} (${data.courierName}, AWB ${data.awb}): ${publicLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  const view = useMemo(() => {
    if (!data) return null;
    const journey = resolveJourney(data.currentStatus);
    const times = stageTimes(journey.stages, data.events);
    const tone = statusTone(data.currentStatus);
    const s = data.currentStatus.toLowerCase();
    const delivered = s.includes('delivered') && !s.includes('undelivered');
    const latest = data.events[0] || null;

    // ETA line
    let eta: { label: string; value: string; note: string; late: boolean } = { label: 'Estimated delivery', value: data.estimatedDelivery, note: '', late: false };
    if (delivered) {
      eta = { label: journey.flow === 'rto' ? 'Returned on' : 'Delivered on', value: latest ? latest.date : data.estimatedDelivery, note: latest ? latest.time : '', late: false };
    } else if (journey.flow !== 'forward') {
      eta = { label: 'Estimated delivery', value: '—', note: journey.flow === 'rto' ? 'Shipment is returning to origin' : 'Shipment is not moving', late: false };
    } else if (data.estimatedIso) {
      const n = daysBetween(data.estimatedIso);
      eta.note = n > 1 ? `In ${n} days` : n === 1 ? 'Tomorrow' : n === 0 ? 'Today' : `${-n} day${n === -1 ? '' : 's'} past the estimate`;
      eta.late = n < 0;
    }

    // Scan history grouped by day (newest day first); collapsed to the latest few updates
    const groups: { day: string; items: TrackingEvent[] }[] = [];
    for (const e of showAll ? data.events : data.events.slice(0, COLLAPSED_EVENTS)) {
      const day = dayLabel(e.iso);
      const g = groups[groups.length - 1];
      if (g && g.day === day) g.items.push(e); else groups.push({ day, items: [e] });
    }
    const routeLine = [data.origin.city, data.destination.city].every(Boolean);

    return { journey, times, tone, delivered, latest, eta, groups, routeLine };
  }, [data, showAll]);

  const t = view ? TONE[view.tone] : TONE.slate;

  return (
    <AdminLayout>
      <div className="w-full max-w-[1320px] mx-auto py-2 space-y-5">

        {/* ── Header + search ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-[20px] font-bold text-[#0F172A]">Shipment tracking</h1>
            <p className="text-[13px] text-[#64748B]">Live courier status, journey and scan history for any AWB.</p>
          </div>
          <form onSubmit={e => { e.preventDefault(); handleTrack(); }} className="flex items-center gap-2 w-full md:w-[440px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="text" value={awb} onChange={e => setAwb(e.target.value)} placeholder="Enter AWB number" aria-label="AWB number"
                className="w-full h-10 pl-10 pr-4 rounded-full border border-[#E2E8F0] bg-white text-[13px] font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]"
              />
            </div>
            <button type="submit" disabled={isLoading} className="h-10 px-5 rounded-full bg-[#00A86B] hover:bg-[#009B63] text-white text-[13px] font-semibold disabled:opacity-60 inline-flex items-center gap-1.5 shrink-0">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}Track
            </button>
          </form>
        </div>

        {isLoading && !data && <Skeleton />}

        {error && !isLoading && (
          <div className={`${card} p-10 flex flex-col items-center text-center`}>
            <span className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center"><AlertCircle className="w-6 h-6 text-red-500" /></span>
            <p className="mt-3 text-[14px] font-semibold text-[#0F172A]">No tracking found</p>
            <p className="text-[12.5px] text-[#64748B] max-w-[360px]">{error}</p>
          </div>
        )}

        {!data && !isLoading && !error && (
          <div className={`${card} border-dashed p-14 flex flex-col items-center text-center`}>
            <span className="w-14 h-14 rounded-2xl bg-[#F0FDF4] flex items-center justify-center"><Truck className="w-6 h-6 text-[#00A86B]" /></span>
            <h3 className="mt-4 text-[14px] font-bold text-[#0F172A]">Track a shipment</h3>
            <p className="text-[12.5px] text-[#94A3B8] max-w-[320px]">Enter an AWB number above, or open one from your Orders list.</p>
          </div>
        )}

        {data && view && (
          <div className={`space-y-5 transition-opacity ${isLoading ? 'opacity-60' : ''}`}>

            {/* ── Status hero ── */}
            <section className={`${card} overflow-hidden`}>
              <div className="h-1" style={{ backgroundColor: t.solid }} />
              <div className="p-4 sm:p-6">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span className="w-10 h-10 rounded-xl border border-[#E2E8F0] bg-white flex items-center justify-center shrink-0 overflow-hidden">
                        {data.courierLogo ? <img src={data.courierLogo} alt="" className="max-w-[28px] max-h-[28px] object-contain" /> : <Truck className="w-5 h-5 text-[#94A3B8]" />}
                      </span>
                      <div className="min-w-0">
                        <div className="text-[13px] font-semibold text-[#0F172A] truncate">{data.courierName}</div>
                        <button type="button" onClick={copyAwb} title="Copy AWB" className="group inline-flex items-center gap-1.5 text-[12.5px] font-mono font-semibold text-[#475569] hover:text-[#00A86B]">
                          AWB {data.awb}
                          {copied === 'awb' ? <Check className="w-3.5 h-3.5 text-[#00A86B]" /> : <Copy className="w-3.5 h-3.5 text-[#94A3B8] group-hover:text-[#00A86B]" />}
                        </button>
                      </div>
                    </div>

                    <h2 className={`mt-4 text-[26px] sm:text-[30px] leading-tight font-bold tracking-[-0.02em] ${t.text}`}>{data.currentStatus}</h2>
                    {view.latest ? (
                      <p className="mt-1 text-[13px] text-[#475569]">
                        Last update: <span className="font-semibold text-[#0F172A]">{view.latest.status}</span>
                        {view.latest.location && <> at {view.latest.location}</>} · {view.latest.date}, {view.latest.time}
                      </p>
                    ) : (
                      <p className="mt-1 text-[13px] text-[#94A3B8]">Waiting for the courier's first scan.</p>
                    )}
                    {(view.eta.late || data.ndrAttempts > 0) && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {view.eta.late && <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-amber-50 border border-amber-200 text-[12px] font-semibold text-amber-700"><Clock className="w-3.5 h-3.5" />Running late</span>}
                        {data.ndrAttempts > 0 && <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-amber-50 border border-amber-200 text-[12px] font-semibold text-amber-700"><TriangleAlert className="w-3.5 h-3.5" />{data.ndrAttempts} failed delivery attempt{data.ndrAttempts > 1 ? 's' : ''}</span>}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:items-end shrink-0">
                    <div className={`rounded-xl border px-4 py-3 min-w-[200px] ${t.bg} ${t.border}`}>
                      <div className="flex items-center gap-1.5 text-[11.5px] font-semibold text-[#64748B]"><CalendarClock className="w-3.5 h-3.5" />{view.eta.label}</div>
                      <div className="mt-0.5 text-[18px] font-bold text-[#0F172A] tabular-nums">{view.eta.value}</div>
                      {view.eta.note && <div className={`text-[12px] font-semibold ${view.eta.late ? 'text-amber-700' : 'text-[#64748B]'}`}>{view.eta.note}</div>}
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => handleTrack(data.awb)} title="Refresh" aria-label="Refresh tracking" className="w-9 h-9 rounded-full border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:border-[#00A86B] hover:text-[#00A86B]">
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                      </button>
                      <button type="button" onClick={copyLink} className="h-9 px-3.5 rounded-full border border-[#E2E8F0] text-[12.5px] font-semibold text-[#475569] hover:border-[#00A86B] hover:text-[#00A86B] inline-flex items-center gap-1.5">
                        {copied === 'link' ? <Check className="w-4 h-4 text-[#00A86B]" /> : <Link2 className="w-4 h-4" />}{copied === 'link' ? 'Link copied' : 'Copy tracking link'}
                      </button>
                      <button type="button" onClick={shareWhatsApp} title="Share with the buyer on WhatsApp" aria-label="Share on WhatsApp" className="w-9 h-9 rounded-full bg-[#25D366] hover:bg-[#1FB959] text-white flex items-center justify-center">
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Route */}
                {view.routeLine && (
                  <div className="mt-6 flex items-center gap-3 rounded-xl bg-[#F8FAFC] border border-[#EEF2F6] px-4 py-3">
                    <div className="min-w-0">
                      <div className="text-[10.5px] font-semibold uppercase tracking-wider text-[#94A3B8]">From</div>
                      <div className="text-[13.5px] font-bold text-[#0F172A] truncate">{data.origin.city}</div>
                      <div className="text-[11.5px] text-[#94A3B8] truncate">{[data.origin.state, data.origin.pin].filter(Boolean).join(' · ')}</div>
                    </div>
                    <div className="relative flex-1 h-[52px] min-w-[120px]">
                      {/* road */}
                      <div className="absolute inset-x-0 bottom-[6px] h-[5px] rounded-full bg-[#E2E8F0]" />
                      <div className="absolute inset-x-2 bottom-[8px] h-px bg-[repeating-linear-gradient(90deg,#FFFFFF_0_8px,transparent_8px_16px)]" />
                      <span className="absolute left-0 bottom-[3px] w-[11px] h-[11px] rounded-full border-2 border-white" style={{ backgroundColor: t.solid }} />
                      <span className="absolute right-0 bottom-[3px] w-[11px] h-[11px] rounded-full border-2 border-white bg-[#0F172A]" />
                      <motion.span
                        className="absolute bottom-[9px] -ml-8"
                        initial={{ left: '0%' }}
                        animate={{ left: `${view.journey.flow === 'forward' && view.journey.index >= 0 ? 8 + (view.journey.index / (view.journey.stages.length - 1)) * 84 : view.journey.flow === 'rto' ? 92 - (view.journey.index / 2) * 84 : 50}%` }}
                        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <RouteTruck color={view.journey.flow === 'rto' ? '#D97706' : t.solid} moving={!view.delivered && view.journey.flow !== 'stopped'} flip={view.journey.flow === 'rto'} />
                      </motion.span>
                    </div>
                    <div className="min-w-0 text-right">
                      <div className="text-[10.5px] font-semibold uppercase tracking-wider text-[#94A3B8]">To</div>
                      <div className="text-[13.5px] font-bold text-[#0F172A] truncate">{data.destination.city}</div>
                      <div className="text-[11.5px] text-[#94A3B8] truncate">{[data.destination.state, data.destination.pin].filter(Boolean).join(' · ')}</div>
                    </div>
                  </div>
                )}

                {/* Journey */}
                <div className="mt-6">
                  {view.journey.flow === 'stopped' ? (
                    <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <p className="text-[12.5px] font-medium text-red-700">This shipment is marked {data.currentStatus.toLowerCase()} and is no longer moving. The scan history below shows the last recorded events.</p>
                    </div>
                  ) : (
                    <>
                      {view.journey.flow === 'rto' && <p className="mb-3 text-[12.5px] font-medium text-amber-700">The parcel could not be delivered and is on its way back to the pickup address.</p>}
                      <JourneyRail stages={view.journey.stages} index={view.journey.index} times={view.times} flow={view.journey.flow} />
                    </>
                  )}
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* ── Scan history ── */}
              <section className={`${card} lg:col-span-8`}>
                <div className="px-4 sm:px-6 py-3.5 border-b border-[#F1F5F9] flex items-center justify-between gap-3">
                  <h3 className="text-[15px] font-bold text-[#0F172A]">Scan history</h3>
                  <span className="text-[11.5px] text-[#94A3B8]">{data.events.length} update{data.events.length === 1 ? '' : 's'}{refreshedAt && ` · refreshed ${refreshedAt.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}`}</span>
                </div>

                {data.events.length === 0 ? (
                  <div className="py-14 px-6 text-center">
                    <Clock className="w-8 h-8 text-[#CBD5E1] mx-auto" />
                    <p className="mt-3 text-[13px] font-semibold text-[#0F172A]">No scans yet</p>
                    <p className="text-[12.5px] text-[#94A3B8]">Updates appear here once the courier picks up and scans the parcel.</p>
                  </div>
                ) : (
                  <div className="px-4 sm:px-6 py-4">
                    {view.groups.map((g, gi) => (
                      <div key={g.day} className={gi > 0 ? 'mt-6' : ''}>
                        <div className="flex items-center gap-3">
                          <span className="text-[12px] font-bold text-[#0F172A] whitespace-nowrap">{g.day}</span>
                          <span className="flex-1 h-px bg-[#EEF2F6]" />
                          <span className="text-[11px] text-[#94A3B8] whitespace-nowrap">{g.items.length} update{g.items.length === 1 ? '' : 's'}</span>
                        </div>
                        <ol className="mt-3">
                          {g.items.map((e, i) => {
                            const Icon = eventIcon(`${e.status} ${e.desc}`);
                            const last = i === g.items.length - 1;
                            const warn = Icon === TriangleAlert || Icon === Undo2;
                            return (
                              <motion.li
                                key={e.id}
                                className="relative grid grid-cols-[58px_32px_minmax(0,1fr)] gap-x-3 pb-3 last:pb-0"
                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: Math.min(i, 6) * 0.04 }}
                              >
                                <span className="pt-2.5 text-right text-[11.5px] font-semibold text-[#64748B] tabular-nums whitespace-nowrap">{e.time}</span>
                                <span className="relative flex justify-center">
                                  {!last && (
                                    <span
                                      className="absolute top-[42px] bottom-[-10px] w-[3px]"
                                      style={{ backgroundImage: `radial-gradient(circle, ${e.active ? t.solid : '#CBD5E1'} 1.5px, transparent 1.6px)`, backgroundSize: '3px 8px', backgroundRepeat: 'repeat-y', backgroundPosition: 'center top' }}
                                    />
                                  )}
                                  <span
                                    className={`relative z-[1] mt-1 w-8 h-8 rounded-full flex items-center justify-center ${e.active ? 'text-white' : warn ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-white text-[#64748B] border border-[#E2E8F0]'}`}
                                    style={e.active ? { backgroundColor: t.solid, boxShadow: `0 0 0 4px ${t.solid}22` } : undefined}
                                  >
                                    <Icon className="w-4 h-4" />
                                  </span>
                                </span>
                                <div className={`min-w-0 rounded-xl px-3.5 py-2.5 border ${e.active ? `${t.bg} ${t.border}` : 'border-transparent hover:bg-[#F8FAFC]'} transition-colors`}>
                                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                    <span className={`text-[13px] font-semibold ${e.active ? 'text-[#0F172A]' : 'text-[#334155]'}`}>{e.status}</span>
                                    {e.active && <span className="px-1.5 py-px rounded bg-white text-[10.5px] font-bold" style={{ color: t.solid }}>Latest</span>}
                                  </div>
                                  {e.desc && <p className="mt-0.5 text-[12.5px] text-[#64748B] leading-relaxed">{e.desc}</p>}
                                  {e.location && (
                                    <span className="mt-1.5 inline-flex items-center gap-1 h-6 px-2 rounded-full bg-white border border-[#E2E8F0] text-[11.5px] font-medium text-[#475569]">
                                      <MapPin className="w-3 h-3 text-[#94A3B8] shrink-0" />{e.location}
                                    </span>
                                  )}
                                </div>
                              </motion.li>
                            );
                          })}
                        </ol>
                      </div>
                    ))}
                    {data.events.length > COLLAPSED_EVENTS && (
                      <button type="button" onClick={() => setShowAll(v => !v)} className="mt-4 mx-auto h-8 px-3.5 rounded-full border border-[#E2E8F0] text-[12px] font-semibold text-[#475569] hover:border-[#00A86B] hover:text-[#00A86B] flex items-center justify-center gap-1 transition-colors">
                        {showAll ? 'Show less' : `Show more (${data.events.length - COLLAPSED_EVENTS} earlier update${data.events.length - COLLAPSED_EVENTS > 1 ? 's' : ''})`}
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAll ? 'rotate-180' : ''}`} />
                      </button>
                    )}
                  </div>
                )}
              </section>

              {/* ── Details ── */}
              <div className="lg:col-span-4 space-y-5">
                <section className={`${card} p-4 sm:p-5`}>
                  <h3 className="text-[15px] font-bold text-[#0F172A] mb-1">Order</h3>
                  <div className="divide-y divide-[#F1F5F9]">
                    <Row k="Order ID" v={data.orderId} mono />
                    <Row k="Placed on" v={data.orderDate} />
                    <Row k="Payment" v={<span className={`px-2 py-0.5 rounded-full text-[11.5px] ${data.paymentMode.toLowerCase() === 'cod' ? 'bg-amber-50 text-amber-700' : 'bg-[#F0FDF4] text-[#00A86B]'}`}>{data.paymentMode}</span>} />
                    <Row k="Order value" v={`₹${data.orderAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                    {data.weightKg != null && <Row k="Weight" v={`${data.weightKg} kg`} />}
                    {data.dims && <Row k="Dimensions" v={data.dims} />}
                  </div>
                  {data.products.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#F1F5F9]">
                      <div className="text-[11.5px] font-semibold text-[#64748B] mb-1.5">Items</div>
                      <ul className="space-y-1">
                        {data.products.slice(0, 4).map((p, i) => (
                          <li key={i} className="flex items-start justify-between gap-3 text-[12.5px]"><span className="text-[#334155] min-w-0 break-words">{p.name}</span><span className="text-[#94A3B8] tabular-nums shrink-0">× {p.qty}</span></li>
                        ))}
                        {data.products.length > 4 && <li className="text-[12px] text-[#94A3B8]">and {data.products.length - 4} more</li>}
                      </ul>
                    </div>
                  )}
                </section>

                {(data.destination.city || data.origin.city) && (
                  <section className={`${card} p-4 sm:p-5 space-y-4`}>
                    {[{ title: 'Delivering to', p: data.destination, icon: Home }, { title: 'Picked up from', p: data.origin, icon: Warehouse }].filter(x => x.p.city).map(x => (
                      <div key={x.title} className="flex items-start gap-3">
                        <span className="w-8 h-8 rounded-lg bg-[#F0FDF4] text-[#00A86B] flex items-center justify-center shrink-0"><x.icon className="w-4 h-4" /></span>
                        <div className="min-w-0">
                          <div className="text-[11.5px] font-semibold text-[#64748B]">{x.title}</div>
                          {x.p.name && <div className="text-[13px] font-semibold text-[#0F172A] truncate">{x.p.name}</div>}
                          <div className="text-[12.5px] text-[#475569]">{[x.p.city, x.p.state].filter(Boolean).join(', ')}{x.p.pin && ` – ${x.p.pin}`}</div>
                        </div>
                      </div>
                    ))}
                  </section>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
