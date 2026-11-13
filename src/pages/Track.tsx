import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Package,
  Truck,
  MapPin,
  CheckCircle2,
  Clock,
  Warehouse,
  ScanLine,
  PackageCheck,
  Copy,
  Zap,
  ArrowRight,
  Check,
  Headset,
  Share2,
  ExternalLink,
  Bell,
  Target,
  ShieldCheck,
  Headphones,
  Phone,
  MessageCircle,
  HelpCircle,
  Weight,
  CreditCard,
  Wallet,
  Ruler,
  Hash,
  Building2,
  ChevronDown,
} from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { apiClient } from '../services/apiClient';
import { TrackRunOverlay, type RunPhase } from '../components/track/TrackRunOverlay';

/* ── Easing curve used site-wide ── */
const EASE = [0.16, 1, 0.3, 1] as const;

/* ── Demo tracking data — shape matches what a real /track/:id endpoint would return ── */
interface TimelineEvent {
  status: string;
  date: string;
  time: string;
  location: string;
  description: string;
  done: boolean;
  iso?: string;
}

interface TrackingResult {
  status: string;
  courierName: string;
  courierLogo: string;
  awb: string;
  orderId: string;
  pickup: string;
  destination: string;
  expectedDelivery: string;
  deliveredOn?: string;
  weight: string;
  dimensions: string;
  paymentMode: 'Prepaid' | 'COD';
  codAmount?: number;
  serviceType: string;
  currentHub: string;
  customerRef: string;
  timeline: TimelineEvent[];
  destCity: string;
  destState: string;
  destPin: string;
  placedOn: string;
  eddIso: string | null;
  deliveredIso: string | null;
}

const RECENT_KEY = 'qp_track_recent';
const STATUS_STEP_ICONS = [Package, Truck, ScanLine, Warehouse, Zap, PackageCheck];

const fmtEvt = (dateStr?: string): { date: string; time: string } => {
  if (!dateStr) return { date: '—', time: '—' };
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return { date: String(dateStr), time: '' };
  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleString('en-US', { month: 'short' });
  let h = d.getHours();
  const min = String(d.getMinutes()).padStart(2, '0');
  const amPm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return { date: `${day} ${month} ${d.getFullYear()}`, time: `${h}:${min} ${amPm}` };
};


const getCourierLogoPublic = (name: string): string => {
  const n = (name || '').toLowerCase();
  if (n.includes('delhivery')) return '/brands/delhivery.png';
  if (n.includes('amazon')) return '/brands/amazon.png';
  if (n.includes('dtdc')) return '/brands/dtdc.png';
  if (n.includes('ekart')) return '/brands/ekart.png';
  if (n.includes('losung') || n.includes('lousung')) return '/brands/losung.jpg';
  if (n.includes('shadowfax')) return '/brands/shadowfax.png';
  if (n.includes('shiprocket')) return '/brands/shiprocket.jpg';
  if (n.includes('shree') || n.includes('maruti')) return '/brands/shree_maruti.jpg';
  if (n.includes('xpressbees')) return '/brands/xpressbees.png';
  if (n.includes('bluedart') || n.includes('blue dart')) return '/brands/bluedart.png';
  return '/brands/default.png';
};

const mapApiToResult = (d: any, query: string): TrackingResult => {
  const courierName = d.courierServiceName || d.courierName || '—';
  const rawTracking: any[] = d.tracking || [];
  const deduped = [...new Map(
    rawTracking.filter((t: any) => t.StatusDateTime).map((t: any) => [t.StatusDateTime, t])
  ).values()].reverse();

  const timeline: TimelineEvent[] = deduped.map((t: any) => {
    const { date, time } = fmtEvt(t.StatusDateTime);
    return {
      status: t.status || t.Instructions || '—',
      date,
      time,
      location: t.StatusLocation || '',
      description: t.Instructions || t.status || '',
      done: true,
      iso: t.StatusDateTime,
    };
  });

  const pickup = [d.pickupAddress?.city, d.pickupAddress?.state].filter(Boolean).join(', ') || '—';
  const destination = [d.receiverAddress?.city, d.receiverAddress?.state].filter(Boolean).join(', ') || '—';
  const deliveredOn = (d.status === 'Delivered' || d.status === 'RTO Delivered') && deduped[0]
    ? fmtEvt(deduped[0].StatusDateTime).date
    : undefined;

  return {
    status: d.status || '',
    courierName,
    courierLogo: getCourierLogoPublic(courierName),
    awb: d.awb_number || query,
    orderId: String(d.orderId || '—'),
    pickup,
    destination,
    expectedDelivery: fmtEvt(d.estimatedDeliveryDate).date,
    deliveredOn,
    weight: d.totalWeight ? `${d.totalWeight} kg` : '—',
    dimensions: '—',
    paymentMode: d.paymentDetails?.method === 'COD' ? 'COD' : 'Prepaid',
    codAmount: d.paymentDetails?.codAmount || d.paymentDetails?.amount || undefined,
    serviceType: courierName,
    currentHub: deduped[0]?.StatusLocation || '—',
    customerRef: d.channelId || d.orderId || '—',
    timeline,
    destCity: d.receiverAddress?.city || '',
    destState: d.receiverAddress?.state || '',
    destPin: String(d.receiverAddress?.pinCode || d.receiverAddress?.pincode || ''),
    placedOn: fmtEvt(d.createdAt || d.shipmentCreatedAt).date,
    eddIso: d.estimatedDeliveryDate || null,
    deliveredIso: (d.status === 'Delivered' || d.status === 'RTO Delivered') && deduped[0] ? deduped[0].StatusDateTime : null,
  };
};

const DEFAULT_STATUS_STYLE = { bg: 'bg-[#F1F5F9]', text: 'text-[#475569]', border: 'border-[#475569]/20', dot: 'bg-[#475569]' };

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  'Delivered':        { bg: 'bg-[#F0FDF4]', text: 'text-[#00A86B]', border: 'border-[#00A86B]/25', dot: 'bg-[#00A86B]' },
  'RTO Delivered':    { bg: 'bg-[#FFF7ED]', text: 'text-[#EA580C]', border: 'border-[#EA580C]/20', dot: 'bg-[#EA580C]' },
  'Out for Delivery': { bg: 'bg-[#EFF6FF]', text: 'text-[#2563EB]', border: 'border-[#2563EB]/20', dot: 'bg-[#2563EB]' },
  'In-transit':       { bg: 'bg-[#F5F3FF]', text: 'text-[#7C3AED]', border: 'border-[#7C3AED]/20', dot: 'bg-[#7C3AED]' },
  'Ready To Ship':    { bg: 'bg-[#F0F9FF]', text: 'text-[#0369A1]', border: 'border-[#0369A1]/20', dot: 'bg-[#0369A1]' },
  'Undelivered':      { bg: 'bg-[#FFFBEB]', text: 'text-[#D97706]', border: 'border-[#D97706]/20', dot: 'bg-[#D97706]' },
  'RTO':              { bg: 'bg-[#FFFBEB]', text: 'text-[#D97706]', border: 'border-[#D97706]/20', dot: 'bg-[#D97706]' },
  'RTO In-transit':   { bg: 'bg-[#FFFBEB]', text: 'text-[#D97706]', border: 'border-[#D97706]/20', dot: 'bg-[#D97706]' },
  'Cancelled':        { bg: 'bg-[#FEF2F2]', text: 'text-[#DC2626]', border: 'border-[#DC2626]/20', dot: 'bg-[#DC2626]' },
  'Lost':             { bg: 'bg-[#FEF2F2]', text: 'text-[#DC2626]', border: 'border-[#DC2626]/20', dot: 'bg-[#DC2626]' },
};

/* ── Dot-grid background, same recipe as TrustedBrands ── */
function DotGrid({ opacity = 0.035 }: { opacity?: number }) {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        opacity,
        backgroundImage:
          'linear-gradient(#0F172A 1px, transparent 1px), linear-gradient(90deg, #0F172A 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }}
    />
  );
}

/* ── Eyebrow pill, same recipe as TrustedBrands ── */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#00A86B] bg-[#00A86B]/10 border border-[#00A86B]/20 px-4 py-1.5 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-[#00A86B] animate-pulse" />
      {children}
    </span>
  );
}

/* ── Mini courier-scan illustration for the hero (2D/premium, not cartoon) ── */
function HeroIllustration() {
  return (
    <div className="relative w-full max-w-[440px] mx-auto aspect-square flex items-center justify-center">
      {/* soft ambient glow */}
      <div className="absolute inset-0 rounded-full bg-[#00A86B]/[0.06] blur-3xl" />

      {/* concentric rings, static decoration */}
      <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full">
        <circle cx="200" cy="200" r="196" fill="none" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="1 9" strokeLinecap="round" />
        <circle cx="200" cy="200" r="150" fill="none" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="1 9" strokeLinecap="round" />
      </svg>

      {/* dummy dashed routes, static decoration around the logo */}
      <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full">
        {/* upper route */}
        <path d="M 40 100 C 110 40, 180 130, 240 70 S 340 20, 370 60" fill="none" stroke="#00A86B" strokeOpacity="0.35" strokeWidth="2" strokeDasharray="6 8" strokeLinecap="round" />
        <circle cx="40" cy="100" r="5" fill="#00A86B" />
        <circle cx="370" cy="60" r="5" fill="#2563EB" />

        {/* lower route */}
        <path d="M 30 320 C 100 360, 190 300, 250 340 S 330 380, 375 345" fill="none" stroke="#00A86B" strokeOpacity="0.3" strokeWidth="2" strokeDasharray="6 8" strokeLinecap="round" />
        <circle cx="30" cy="320" r="5" fill="#00A86B" />
        <circle cx="375" cy="345" r="5" fill="#2563EB" />

        {/* left route */}
        <path d="M 20 190 C 55 220, 55 250, 25 270" fill="none" stroke="#00A86B" strokeOpacity="0.25" strokeWidth="2" strokeDasharray="5 7" strokeLinecap="round" />
        <circle cx="20" cy="190" r="4" fill="#00A86B" />
        <circle cx="25" cy="270" r="4" fill="#2563EB" />

        {/* right route */}
        <path d="M 380 170 C 345 200, 345 230, 378 255" fill="none" stroke="#00A86B" strokeOpacity="0.25" strokeWidth="2" strokeDasharray="5 7" strokeLinecap="round" />
        <circle cx="380" cy="170" r="4" fill="#00A86B" />
        <circle cx="378" cy="255" r="4" fill="#2563EB" />
      </svg>

      {/* central — QuickPost logo, no card background */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        <img
          src="/logo-color.png"
          alt="QuickPost"
          className="h-32 md:h-36 w-auto object-contain drop-shadow-[0_10px_30px_rgba(0,168,107,0.25)]"
        />
        {/* Phones: the tracking product's one-word name under the logo */}
        <div className="md:hidden -mt-2 flex items-center gap-2.5">
          <span className="relative flex w-2.5 h-2.5">
            <span className="absolute inline-flex w-full h-full rounded-full bg-[#00A86B] opacity-60 animate-ping" />
            <span className="relative inline-flex w-2.5 h-2.5 rounded-full bg-[#00A86B]" />
          </span>
          <span className="text-[13px] font-bold uppercase tracking-[0.42em] text-[#0F172A]">Pinpoint</span>
        </div>
      </div>
    </div>
  );
}

/* ── Approx lat/lng for major Indian cities, used to place map markers from city names ── */
const CITY_COORDS: Record<string, [number, number]> = {
  'delhi': [28.7041, 77.1025], 'new delhi': [28.6139, 77.2090],
  'mumbai': [19.0760, 72.8777], 'bangalore': [12.9716, 77.5946], 'bengaluru': [12.9716, 77.5946],
  'hyderabad': [17.3850, 78.4867], 'chennai': [13.0827, 80.2707], 'kolkata': [22.5726, 88.3639],
  'pune': [18.5204, 73.8567], 'ahmedabad': [23.0225, 72.5714], 'surat': [21.1702, 72.8311],
  'jaipur': [26.9124, 75.7873], 'lucknow': [26.8467, 80.9462], 'kanpur': [26.4499, 80.3319],
  'nagpur': [21.1458, 79.0882], 'indore': [22.7196, 75.8577], 'thane': [19.2183, 72.9781],
  'bhopal': [23.2599, 77.4126], 'visakhapatnam': [17.6868, 83.2185], 'patna': [25.5941, 85.1376],
  'vadodara': [22.3072, 73.1812], 'ghaziabad': [28.6692, 77.4538], 'ludhiana': [30.9010, 75.8573],
  'agra': [27.1767, 78.0081], 'nashik': [19.9975, 73.7898], 'faridabad': [28.4089, 77.3178],
  'meerut': [28.9845, 77.7064], 'rajkot': [22.3039, 70.8022], 'varanasi': [25.3176, 82.9739],
  'srinagar': [34.0837, 74.7973], 'amritsar': [31.6340, 74.8723], 'chandigarh': [30.7333, 76.7794],
  'gurgaon': [28.4595, 77.0266], 'gurugram': [28.4595, 77.0266], 'noida': [28.5355, 77.3910],
  'coimbatore': [11.0168, 76.9558], 'kochi': [9.9312, 76.2673], 'guwahati': [26.1445, 91.7362],
  'bhubaneswar': [20.2961, 85.8245], 'dehradun': [30.3165, 78.0322], 'raipur': [21.2514, 81.6296],
  'ranchi': [23.3441, 85.3096], 'jodhpur': [26.2389, 73.0243], 'madurai': [9.9252, 78.1198],
  'dhanbad': [23.7957, 86.4304], 'jamshedpur': [22.8046, 86.2029], 'bokaro': [23.6693, 86.1511],
  'siliguri': [26.7271, 88.3953], 'jamnagar': [22.4707, 70.0577], 'aligarh': [27.8974, 78.0880],
  'gwalior': [26.2183, 78.1828], 'bareilly': [28.3670, 79.4304], 'moradabad': [28.8386, 78.7733],
  'mysore': [12.2958, 76.6394], 'mysuru': [12.2958, 76.6394], 'thiruvananthapuram': [8.5241, 76.9366],
  'vijayawada': [16.5062, 80.6480], 'jabalpur': [23.1815, 79.9864], 'salem': [11.6643, 78.1460],
  'warangal': [17.9689, 79.5941], 'guntur': [16.3067, 80.4365], 'bhilai': [21.1938, 81.3509],
  'cuttack': [20.4625, 85.8828], 'firozabad': [27.1592, 78.3957], 'kota': [25.2138, 75.8648],
  'nellore': [14.4426, 79.9865], 'gorakhpur': [26.7606, 83.3732], 'bhavnagar': [21.7645, 72.1519],
  'durgapur': [23.5204, 87.3119], 'asansol': [23.6739, 86.9524], 'ajmer': [26.4499, 74.6399],
  'udaipur': [24.5854, 73.7125], 'jamalpur': [25.3095, 86.4881],
};

const resolveCityCoords = (place: string): [number, number] | null => {
  if (!place) return null;
  const key = place.split(',')[0].trim().toLowerCase();
  return CITY_COORDS[key] || null;
};

/* ── Status + tracking history, laid out like the branded tracking page ── */
const STEP_LABELS = ['Booked', 'Picked up', 'In transit', 'Out for delivery', 'Delivered'];
function stepOf(status: string): { step: number; exception: boolean } {
  const s = (status || '').toLowerCase();
  if (s.includes('rto') || s.includes('cancel') || s.includes('lost')) return { step: 2, exception: true };
  if (s.includes('undelivered')) return { step: 3, exception: true };
  if (s.includes('delivered')) return { step: 4, exception: false };
  if (s.includes('out for delivery')) return { step: 3, exception: false };
  if (s.includes('transit') || s.includes('hub') || s.includes('dispatch')) return { step: 2, exception: false };
  if (s.includes('picked')) return { step: 1, exception: false };
  return { step: 0, exception: false };
}
/** "Shadowfax 1KG" / "Delhivery Surface 5KG" → the courier's name only. */
function courierBrand(name: string) {
  const n = (name || '').trim();
  const known = ['Delhivery', 'Blue Dart', 'Bluedart', 'DTDC', 'Ekart', 'Shadowfax', 'Xpressbees', 'Amazon Shipping', 'Amazon', 'Shree Maruti', 'Shiprocket', 'Losung'];
  const hit = known.find(k => n.toLowerCase().startsWith(k.toLowerCase()));
  if (hit) return hit === 'Bluedart' ? 'Blue Dart' : hit;
  return n.replace(/\s+\d+(\.\d+)?\s*(kg|g)\b.*$/i, '') || 'Courier';
}
function titleCase(s: string) {
  return (s || '').toLowerCase().replace(/(^|[\s-])([a-z])/g, (_, a, b) => a + b.toUpperCase()).replace(/\bRto\b/g, 'RTO');
}
function bigDate(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return { weekday: d.toLocaleDateString('en-IN', { weekday: 'long' }), month: d.toLocaleDateString('en-IN', { month: 'long' }), day: d.getDate() };
}
function stamp(e: TimelineEvent) {
  const d = e.iso ? new Date(e.iso) : null;
  if (!d || isNaN(d.getTime())) return { day: e.date, time: e.time };
  return {
    day: `${String(d.getDate()).padStart(2, '0')} ${d.toLocaleDateString('en-IN', { month: 'short' }).slice(0, 3).toUpperCase()}`,
    time: d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase(),
  };
}

function StatusAndHistory({ result, onShare, onCopyAwb, copied }: { result: TrackingResult; onShare: () => void; onCopyAwb: () => void; copied: boolean }) {
  const [showAll, setShowAll] = useState(false);
  const { step, exception } = stepOf(result.status);
  const delivered = step === 4 && !exception;
  const date = bigDate(delivered ? result.deliveredIso : result.eddIso);
  const last = result.timeline[0];
  const accent = exception ? '#D97706' : delivered ? '#00A86B' : '#2563EB';
  const events = showAll ? result.timeline : result.timeline.slice(0, 5);

  return (
    <div className="bg-white rounded-[24px] border border-[#E0EDE8] shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-[380px_minmax(0,1fr)]">
      {/* Left: date + status */}
      <div className="p-6 sm:p-7 flex flex-col">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[13px] font-semibold text-[#0F172A]">{delivered ? 'Delivered On' : date ? 'Estimated Delivery Date' : 'Shipment Status'}</p>
          <button type="button" onClick={onShare} aria-label="Share tracking" title="Share tracking" className="w-8 h-8 -mt-1 -mr-1 rounded-full flex items-center justify-center text-[#0F172A] hover:bg-[#F1F5F9]"><Share2 className="w-4 h-4" /></button>
        </div>
        {date ? (
          <div className="mt-2">
            <div className="text-[22px] font-bold text-[#0F172A] leading-tight">{date.weekday}</div>
            <div className="text-[15px] font-semibold text-[#0F172A]">{date.month}</div>
            <motion.div className="text-[88px] leading-[0.95] font-light tracking-[-0.04em] text-[#00A86B] tabular-nums"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}>{date.day}</motion.div>
          </div>
        ) : (
          <div className="mt-2">
            <div className="text-[30px] leading-tight font-bold text-[#0F172A] tracking-[-0.02em]">To be confirmed</div>
            <p className="mt-1 text-[12.5px] text-[#64748B]">The date appears once the courier picks up the parcel.</p>
          </div>
        )}
        <div className="mt-4 inline-flex items-center gap-2 self-start">
          <span className="relative flex w-2.5 h-2.5">
            {!delivered && <span className="absolute inset-0 rounded-full animate-ping opacity-50" style={{ backgroundColor: accent }} />}
            <span className="relative w-2.5 h-2.5 rounded-full" style={{ backgroundColor: accent }} />
          </span>
          <span className="text-[24px] font-semibold tracking-[-0.015em] leading-tight" style={{ color: accent }}>{titleCase(result.status)}</span>
        </div>
        {last && <p className="mt-1 text-[12.5px] text-[#64748B]">Last updated {last.date.slice(0, 6)}, {last.time}</p>}

        <div className="mt-5">
          <div className="h-1.5 rounded-full bg-[#E9EEF3] overflow-hidden">
            <motion.div className="h-full rounded-full" style={{ backgroundColor: exception ? '#D97706' : '#00A86B' }}
              initial={{ width: 0 }} animate={{ width: `${((step + 1) / STEP_LABELS.length) * 100}%` }} transition={{ duration: 0.8, ease: EASE }} />
          </div>
          <p className="mt-2 text-[12px] font-semibold text-[#475569]">{STEP_LABELS[step]} · Step {step + 1} of {STEP_LABELS.length}</p>
        </div>

        <a href="#help" className="mt-5 inline-flex items-center gap-2 text-[14px] font-semibold text-[#00A86B] hover:underline self-start"><Headset className="w-4 h-4" />Need help with delivery?</a>

        <div className="mt-6 pt-5 border-t border-[#F1F5F9] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-16 h-16 rounded-2xl border border-[#E2E8F0] bg-white flex items-center justify-center shrink-0 overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
              {result.courierLogo && !result.courierLogo.endsWith('default.png')
                ? <img src={result.courierLogo} alt="" className="max-w-[48px] max-h-[40px] object-contain" />
                : <Truck className="w-6 h-6 text-[#94A3B8]" />}
            </span>
            <div className="min-w-0">
              <div className="text-[16px] font-bold text-[#0F172A] truncate">{courierBrand(result.courierName)}</div>
              <div className="text-[12px] text-[#94A3B8]">Courier partner</div>
            </div>
          </div>
          <div className="text-right min-w-0">
            <div className="text-[12.5px] font-bold text-[#0F172A]">Tracking ID</div>
            <button type="button" onClick={onCopyAwb} className="inline-flex items-center gap-1 text-[13.5px] font-bold text-[#00A86B] hover:underline max-w-full">
              <span className="truncate">{result.awb}</span>{copied ? <Check className="w-3.5 h-3.5 shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
            </button>
          </div>
        </div>
      </div>

      {/* Right: history */}
      <div className="bg-[#F4F6F5] p-6 sm:p-7 border-t lg:border-t-0 lg:border-l border-[#EEF2F6]">
        <div className="flex items-center justify-between">
          <h3 className="text-[16px] font-bold text-[#0F172A]">Tracking History</h3>
          <span className="text-[12px] font-semibold text-[#64748B]">{result.timeline.length} update{result.timeline.length === 1 ? '' : 's'}</span>
        </div>
        {result.timeline.length === 0 ? (
          <p className="mt-8 text-[13px] text-[#64748B]">No scans yet. Updates appear here once the parcel is picked up.</p>
        ) : (
          <ol className="mt-5">
            {events.map((e, i) => {
              const st = stamp(e);
              const first = i === 0;
              const lastRow = i === events.length - 1;
              return (
                <motion.li key={`${e.iso || e.date}-${i}`} className="grid grid-cols-[72px_24px_minmax(0,1fr)] gap-x-3"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: Math.min(i, 6) * 0.05 }}>
                  <div className="pt-0.5">
                    <div className="text-[13px] font-bold text-[#0F172A] whitespace-nowrap">{st.day}</div>
                    <div className="text-[11.5px] text-[#64748B] whitespace-nowrap">{st.time}</div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className={`relative z-[1] mt-1 rounded-full ${first ? 'w-[18px] h-[18px] bg-[#00A86B] ring-[5px] ring-[#00A86B]/20' : 'w-[14px] h-[14px] bg-[#F4F6F5] border-2 border-[#00A86B]'}`} />
                    {!lastRow && <span className="absolute top-6 bottom-0 border-l-2 border-dashed border-[#00A86B]/50" />}
                  </div>
                  <div className={`pb-5 ${lastRow ? '' : 'mb-4 border-b border-[#E5EAE7]'}`}>
                    <div className="grid grid-cols-[64px_10px_minmax(0,1fr)] gap-y-1.5 text-[13px]">
                      <span className="text-[#64748B]">Activity</span><span className="text-[#64748B]">:</span>
                      <span className="font-bold text-[#0F172A]">{e.description || e.status}</span>
                      {e.location && <><span className="text-[#64748B]">Location</span><span className="text-[#64748B]">:</span><span className="text-[#334155]">{e.location}</span></>}
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </ol>
        )}
        {result.timeline.length > 5 && (
          <button type="button" onClick={() => setShowAll(v => !v)} className="mt-1 mx-auto flex items-center gap-1 h-8 px-3.5 rounded-full border border-[#DCE3DF] bg-white text-[12px] font-semibold text-[#475569] hover:border-[#00A86B] hover:text-[#00A86B]">
            {showAll ? 'Show less' : `Show ${result.timeline.length - 5} more`}<ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAll ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Delivery region map (Leaflet from index.html). Shows only the area the parcel is going to: the point is looked
   up from the pincode and city (never the street address), with a 100 m boundary drawn around it. ── */
const REGION_RADIUS_M = 100;
const regionCache = new Map<string, [number, number] | null>();

async function locateRegion(pin: string, city: string, state: string): Promise<[number, number] | null> {
  const key = `${pin}|${city}|${state}`;
  if (regionCache.has(key)) return regionCache.get(key)!;
  let found: [number, number] | null = null;
  try {
    const q = new URLSearchParams({ format: 'json', limit: '1', countrycodes: 'in' });
    if (pin) q.set('postalcode', pin);
    if (city) q.set('city', city);
    if (state) q.set('state', state);
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${q.toString()}`, { headers: { 'Accept-Language': 'en' } });
    const rows = await res.json();
    if (Array.isArray(rows) && rows[0]) found = [Number(rows[0].lat), Number(rows[0].lon)];
  } catch { /* fall back to the city */ }
  if (!found) found = resolveCityCoords(city);
  regionCache.set(key, found);
  return found;
}

function DeliveryRegionMap({ city, state, pin }: { city: string; state: string; pin: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [center, setCenter] = useState<[number, number] | null>(null);
  const [state2, setState2] = useState<'loading' | 'ready' | 'none'>('loading');

  useEffect(() => {
    let alive = true;
    setState2('loading');
    locateRegion(pin, city, state).then(c => { if (!alive) return; setCenter(c); setState2(c ? 'ready' : 'none'); });
    return () => { alive = false; };
  }, [pin, city, state]);

  useEffect(() => {
    if (!center) return;
    let map: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any
    let timer: number | undefined;
    let ro: ResizeObserver | null = null;
    const init = () => {
      const L = (window as any).L; // eslint-disable-line @typescript-eslint/no-explicit-any
      if (!L || !boxRef.current) return false;
      map = L.map(boxRef.current, { zoomControl: false, attributionControl: true, scrollWheelZoom: false });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);
      // Set the view first: a circle cannot measure itself on a map that has no view yet
      map.fitBounds(L.latLng(center).toBounds(REGION_RADIUS_M * 2), { padding: [40, 40] });
      L.circle(center, { radius: REGION_RADIUS_M, color: '#00A86B', weight: 2, dashArray: '6 6', fillColor: '#00A86B', fillOpacity: 0.12 }).addTo(map);
      L.marker(center, {
        icon: L.divIcon({ className: '', iconSize: [18, 18], iconAnchor: [9, 9],
          html: '<div style="width:18px;height:18px;border-radius:9999px;background:#00A86B;border:3px solid #fff;box-shadow:0 0 0 6px rgba(0,168,107,0.18),0 2px 6px rgba(15,23,42,0.3)"></div>' }),
      }).addTo(map);
      L.control.zoom({ position: 'bottomright' }).addTo(map);
      requestAnimationFrame(() => map && map.invalidateSize());
      if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(() => map && map.invalidateSize()); ro.observe(boxRef.current); }
      return true;
    };
    if (!init()) {
      let n = 0;
      timer = window.setInterval(() => { n += 1; if (init() || n > 50) window.clearInterval(timer); }, 100);
    }
    return () => { if (timer) window.clearInterval(timer); ro?.disconnect(); map?.remove(); };
  }, [center]);

  const label = [city, state].filter(Boolean).join(', ') + (pin ? ` – ${pin}` : '');
  const mapsUrl = center ? `https://www.google.com/maps/search/?api=1&query=${center[0]},${center[1]}` : '';

  return (
    <div className="relative isolate z-0 h-[300px] lg:h-[330px] rounded-2xl border border-[#E0EDE8] overflow-hidden bg-[#EEF5F1]">
      <div ref={boxRef} className="absolute inset-0" />
      {state2 !== 'ready' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          {state2 === 'loading'
            ? <span className="w-6 h-6 border-2 border-[#00A86B]/30 border-t-[#00A86B] rounded-full animate-spin" />
            : <><MapPin className="w-6 h-6 text-[#94A3B8]" /><p className="mt-2 text-[12.5px] text-[#64748B]">Map is not available for this delivery area.</p></>}
        </div>
      )}
      {state2 === 'ready' && (
        <>
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
            className="absolute z-[500] top-3 left-3 h-9 px-3.5 rounded-lg bg-white shadow-[0_2px_8px_rgba(15,23,42,0.18)] text-[13px] font-semibold text-[#2563EB] inline-flex items-center gap-1.5 hover:bg-[#F8FAFC]">
            Open in Maps <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <div className="absolute z-[500] bottom-3 left-3 max-w-[70%] px-3 py-1.5 rounded-lg bg-white/95 shadow-[0_2px_8px_rgba(15,23,42,0.15)] text-[11.5px] text-[#334155]">
            <span className="font-semibold text-[#0F172A]">Delivery region</span> · {label}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Live route map, rendered with Leaflet (loaded via CDN script tags in index.html) ── */
function RoutePreview({ pickup, destination }: { pickup: string; destination: string }) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    let map: any = null;
    let resizeObserver: ResizeObserver | null = null;

    const init = () => {
      const L = (window as any).L;
      if (cancelled || !L || !mapContainerRef.current) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const originCoords = resolveCityCoords(pickup) || [22.9734, 78.6569];
      const destCoords = resolveCityCoords(destination) || [22.9734, 78.6569];

      map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: false,
      });
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      const originIcon = L.divIcon({
        className: '',
        html: `<div style="width:14px;height:14px;border-radius:9999px;background:#00A86B;border:3px solid white;box-shadow:0 0 0 2px rgba(0,168,107,0.35)"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });
      const destIcon = L.divIcon({
        className: '',
        html: `<div style="width:14px;height:14px;border-radius:9999px;background:#2563EB;border:3px solid white;box-shadow:0 0 0 2px rgba(37,99,235,0.35)"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      L.marker(originCoords, { icon: originIcon }).addTo(map).bindTooltip(pickup, { direction: 'top' });
      L.marker(destCoords, { icon: destIcon }).addTo(map).bindTooltip(destination, { direction: 'top' });

      const routeLine = L.polyline([originCoords, destCoords], {
        color: '#00A86B',
        weight: 3,
        opacity: 0.8,
        dashArray: '6 8',
      }).addTo(map);

      map.fitBounds(routeLine.getBounds(), { padding: [36, 36] });
      if (originCoords[0] === destCoords[0] && originCoords[1] === destCoords[1]) {
        map.setView(originCoords, 5);
      }

      // Container can be zero-size at init time (e.g. still animating in),
      // so re-measure once layout settles.
      requestAnimationFrame(() => map && map.invalidateSize());
      if (mapContainerRef.current && typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => map && map.invalidateSize());
        resizeObserver.observe(mapContainerRef.current);
      }
    };

    const L = (window as any).L;
    if (L) {
      init();
    } else {
      // Leaflet CDN script may not have finished loading yet — poll briefly.
      let attempts = 0;
      const timer = setInterval(() => {
        attempts += 1;
        if ((window as any).L) {
          clearInterval(timer);
          init();
        } else if (attempts > 50) {
          clearInterval(timer);
        }
      }, 100);
      return () => {
        cancelled = true;
        clearInterval(timer);
      };
    }

    return () => {
      cancelled = true;
      if (resizeObserver) resizeObserver.disconnect();
      if (map) map.remove();
      mapInstanceRef.current = null;
    };
  }, [pickup, destination]);

  return (
    <div className="relative rounded-2xl border border-[#E0EDE8] bg-gradient-to-b from-[#F8FAFC] to-white p-5 overflow-hidden">
      <div className="relative flex items-center justify-between mb-4">
        <h3 className="text-[13px] font-bold text-[#0F172A]">Live Route</h3>
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#00A86B] bg-[#00A86B]/10 border border-[#00A86B]/20 px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00A86B] animate-pulse" /> Live
        </span>
      </div>

      <div className="relative isolate z-0 h-[220px] rounded-xl bg-white border border-[#E0EDE8] overflow-hidden">
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-[11px] font-bold text-[#0F172A]">
        <span className="flex items-center gap-1.5 min-w-0">
          <MapPin className="w-3 h-3 text-[#00A86B] shrink-0" />
          <span className="truncate">{pickup}</span>
        </span>
        <span className="flex items-center gap-1.5 min-w-0">
          <Target className="w-3 h-3 text-[#2563EB] shrink-0" />
          <span className="truncate">{destination}</span>
        </span>
      </div>
    </div>
  );
}

/**
 * Public tracking page. Shareable addresses: /track/<AWB> (what the email / SMS / WhatsApp links use) and
 * /track?order=<order id>; /track?awb=<AWB> still works. `pathAwb` is the <AWB> of /track/<AWB>, handed over by
 * BrandedTrackingPublicPage when that path is not a seller's branded page.
 */
export function Track({ pathAwb }: { pathAwb?: string } = {}) {
  const navigate = useNavigate();
  const [searchMode, setSearchMode] = useState<'order' | 'awb'>('awb');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<'awb' | 'order' | null>(null);
  const [showAllEvents, setShowAllEvents] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const [runPhase, setRunPhase] = useState<RunPhase>(null);
  const [runQuery, setRunQuery] = useState('');
  const RUN_MS = 3000;
  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

  const runSearch = async (value: string, mode: 'order' | 'awb' = searchMode) => {
    const searchMode = mode;
    if (!value.trim()) {
      setError(`Please enter a valid ${searchMode === 'awb' ? 'AWB number' : 'Order ID'}.`);
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);
    setShowAllEvents(false);
    // The truck drives for RUN_MS while the lookup runs; the result shows once both are done.
    const started = Date.now();
    setRunQuery(value.trim());
    setRunPhase('driving');
    const waitRun = () => sleep(Math.max(0, RUN_MS - (Date.now() - started)));
    try {
      // A shipment of a seller with a live branded tracking page is shown on that seller's page instead.
      try {
        const { data: found } = await apiClient.get('/branded-tracking/lookup', { params: { [searchMode]: value.trim() } });
        if (found?.slug) {
          setRunPhase(null);
          navigate(`/track/${found.slug}?${searchMode}=${encodeURIComponent(value.trim())}`, { replace: true });
          return;
        }
      } catch { /* lookup is best-effort: fall through to the standard result */ }
      const endpoint = searchMode === 'order'
        ? `/orders/GetTrackingByOrderId/${encodeURIComponent(value.trim())}`
        : `/orders/GetTrackingByAwb/${encodeURIComponent(value.trim())}`;
      const res = await apiClient.get(endpoint);
      const mapped = mapApiToResult(res.data, value.trim());
      await waitRun();
      setRunPhase(null);
      setResult(mapped);
      rememberSearch(searchMode, value.trim());
      // Put what was found in the address bar so the page can be shared / reloaded. replaceState (not navigate):
      // /track/<AWB> is a different route, and navigating there would reload this page and search again.
      const v = encodeURIComponent(value.trim());
      const url = searchMode === 'awb' ? `/track/${v}` : `/track?order=${v}`;
      if (window.location.pathname + window.location.search !== url) window.history.replaceState(window.history.state, '', url);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (err: any) {
      const notFound = !err?.response || err.response.status === 404 || err.response.status === 400;
      if (notFound) {
        // Short drive, then the crash scene with the message; it stays until the visitor retries
        await sleep(Math.max(0, 900 - (Date.now() - started)));
        setRunPhase('crash');
        setError(`No shipment found for this ${searchMode === 'awb' ? 'AWB number' : 'Order ID'}.`);
      } else {
        setRunPhase(null);
        setError('Tracking is not available right now. Please try again in a moment.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Deep links search straight away: /track/<AWB> (email / SMS / WhatsApp), /track?awb=… or /track?order=…
  // (landing page's tracking dock).
  const [searchParams] = useSearchParams();
  const [pendingSearch, setPendingSearch] = useState<string | null>(null);
  // Last few lookups on this device, so a buyer or seller can re-check a parcel in one tap
  const [recent, setRecent] = useState<{ mode: 'order' | 'awb'; value: string }[]>(() => {
    try { const v = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); return Array.isArray(v) ? v.slice(0, 3) : []; } catch { return []; }
  });
  function rememberSearch(mode: 'order' | 'awb', value: string) {
    setRecent(prev => {
      const next = [{ mode, value }, ...prev.filter(r => r.value !== value)].slice(0, 3);
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* storage blocked */ }
      return next;
    });
  }
  // Recent chip: put the number in the search field (and the matching tab) so it can be checked or edited, then Track
  const searchRecent = (r: { mode: 'order' | 'awb'; value: string }) => {
    setSearchMode(r.mode); setQuery(r.value); setError('');
    setTimeout(() => {
      const el = document.querySelector<HTMLInputElement>(`input[aria-label="${r.mode === 'awb' ? 'AWB number' : 'Order ID'}"]`);
      el?.focus(); el?.setSelectionRange(r.value.length, r.value.length);
    }, 0);
  };
  useEffect(() => {
    const awb = searchParams.get('awb') || pathAwb, order = searchParams.get('order');
    const v = (awb || order || '').trim();
    if (!v) return;
    setSearchMode(awb ? 'awb' : 'order');
    setQuery(v);
    setPendingSearch(v);
  }, [searchParams, pathAwb]);
  useEffect(() => {
    if (!pendingSearch) return;
    setPendingSearch(null);
    runSearch(pendingSearch);
    // runSearch is recreated each render; it runs once per deep link, after searchMode has updated
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingSearch]);


  /** AWB / Order ID lookup. `hero` = the large desktop version in the hero's left column. */
  const trackForm = (hero: boolean) => (
    <>
      <div role="radiogroup" aria-label="Search by" className={`grid grid-cols-2 p-1 rounded-full bg-[#F1F5F9] border border-[#E2E8F0] ${hero ? 'mb-4' : 'mb-5 sm:inline-grid'}`}>
        {([
          { key: 'awb', label: 'AWB Number' },
          { key: 'order', label: 'Order ID' },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="radio"
            aria-checked={searchMode === tab.key}
            onClick={() => { setSearchMode(tab.key); setError(''); }}
            className={`h-9 px-5 rounded-full text-[13px] font-semibold transition-all duration-200 ${
              searchMode === tab.key ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); runSearch(query); }}
        className={hero ? 'flex flex-col gap-3' : 'flex flex-col sm:flex-row gap-3'}
      >
        <div className="relative flex-1 group">
          <Search className={`${hero ? 'w-5 h-5 left-5' : 'w-[18px] h-[18px] left-4'} absolute top-1/2 -translate-y-1/2 text-[#94A3B8] transition-colors group-focus-within:text-[#00A86B]`} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchMode === 'order' ? 'Enter your Order ID' : 'Enter your AWB number'}
            aria-label={searchMode === 'order' ? 'Order ID' : 'AWB number'}
            autoFocus={hero}
            className={`w-full ${hero ? 'h-[60px] pl-14 text-[16px]' : 'h-[52px] pl-12 text-[14.5px]'} pr-4 rounded-full border border-[#E2E8F0] bg-white font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-4 focus:ring-[#00A86B]/10 transition-all duration-200`}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className={`${hero ? 'h-[56px] text-[15.5px]' : 'h-[52px] px-7 text-[14.5px]'} rounded-full bg-[#00A86B] hover:bg-[#009B63] font-semibold text-white tracking-[-0.01em] flex items-center justify-center gap-2 shadow-[0_10px_24px_-12px_rgba(0,168,107,0.9)] transition-colors disabled:opacity-70`}
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Searching…
            </>
          ) : (
            <>Track shipment <ArrowRight className="w-4 h-4" /></>
          )}
        </button>
      </form>

      {error && (
        <p role="alert" className="mt-3 text-[12.5px] font-semibold text-[#DC2626]">{error}</p>
      )}

      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 overflow-hidden"
          >
            <div className="h-1 w-full bg-[#F1F5F9] rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-[#00A86B]"
                initial={{ x: '-100%' }}
                animate={{ x: ['-100%', '10%', '120%'] }}
                transition={{ duration: 1.3, ease: 'easeInOut', repeat: Infinity }}
              />
            </div>
            <p className="mt-2.5 text-[12px] font-semibold text-[#64748B] flex items-center gap-1.5">
              <ScanLine className="w-3.5 h-3.5 text-[#00A86B]" /> Searching courier network…
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {recent.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-[12px] font-semibold text-[#94A3B8]">Recent</span>
          {recent.map(r => (
            <button key={r.value} type="button" onClick={() => searchRecent(r)}
              className="h-7 px-3 rounded-full border border-[#E2E8F0] bg-white text-[12px] font-medium text-[#475569] hover:border-[#00A86B] hover:text-[#00A86B] font-mono">
              {r.value}
            </button>
          ))}
        </div>
      )}
    </>
  );

  const copyValue = (value: string, key: 'awb' | 'order') => {
    navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const statusStyle = result ? (STATUS_STYLES[result.status] ?? DEFAULT_STATUS_STYLE) : DEFAULT_STATUS_STYLE;
  const doneCount = result ? result.timeline.filter(t => t.done).length : 0;

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans text-[#0F172A] selection:bg-[#00A86B]/20 selection:text-[#00A86B]" style={{ fontFamily: 'Roboto, sans-serif' }}>
      <Navbar />
      <TrackRunOverlay
        phase={runPhase}
        query={runQuery}
        mode={searchMode}
        onRetry={() => { setRunPhase(null); setQuery(''); setTimeout(() => document.querySelector<HTMLInputElement>('input[aria-label="AWB number"], input[aria-label="Order ID"]')?.focus(), 50); }}
      />

      <main className="flex-1">

        {/* ═══════════════════════ HERO ═══════════════════════ */}
        <section className="relative overflow-hidden pt-[96px] pb-16 md:pt-[150px] md:pb-24 lg:pt-[132px] lg:pb-20 bg-[#F8FAFC]">
          <DotGrid />
          <div className="absolute top-24 -right-24 w-[420px] h-[420px] rounded-full bg-[#00A86B]/[0.05] blur-3xl pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-6 md:px-10 grid grid-cols-1 lg:grid-cols-2 gap-0 md:gap-12 lg:gap-16 items-center">
            {/* Left — lookup (desktop). Phones and tablets use the card below the hero. */}
            <motion.div
              className="hidden lg:block"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
            >
              <div className="relative max-w-[520px] bg-white rounded-[28px] border border-[#E2E8F0] p-8 shadow-[0_30px_70px_-32px_rgba(15,23,42,0.35)]">
                <h1 className="text-[32px] leading-[1.1] font-bold text-[#0F172A] tracking-[-0.025em]">Track your shipment</h1>
                <p className="mt-2 mb-6 text-[14.5px] text-[#64748B]">Enter the AWB number from the shipping label, or your Order ID.</p>
                {trackForm(true)}
              </div>
            </motion.div>

            {/* Right — illustration */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.15, ease: EASE }}
            >
              <HeroIllustration />
            </motion.div>
          </div>
        </section>

        {/* ═══════════════════════ TRACKING CARD ═══════════════════════ */}
        <section id="track-card" className="lg:hidden relative -mt-8 md:-mt-14 px-6 md:px-10 z-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.55, ease: EASE }}
            className="max-w-3xl mx-auto bg-white rounded-[24px] border border-[#E0EDE8] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.15)] p-6 md:p-8"
          >
            {trackForm(false)}
          </motion.div>
        </section>

        {/* ═══════════════════════ RESULT ═══════════════════════ */}
        <AnimatePresence>
          {result && (
            <motion.section
              ref={resultRef}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="relative px-4 sm:px-6 md:px-10 pt-10 sm:pt-14 md:pt-20 pb-4 max-w-7xl mx-auto"
            >
              <StatusAndHistory
                result={result}
                copied={copied === 'awb'}
                onCopyAwb={() => copyValue(result.awb, 'awb')}
                onShare={() => {
                  const url = window.location.href;
                  if (navigator.share) navigator.share({ title: 'Track shipment', url }).catch(() => { /* dismissed */ });
                  else copyValue(url, 'awb');
                }}
              />

              <div className="mt-5 sm:mt-6 bg-white rounded-[24px] border border-[#E0EDE8] shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px]">
                {/* Map */}
                <div className="p-4 sm:p-5 lg:pr-0">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[16px] font-bold text-[#0F172A]">Delivery region</h3>
                  </div>
                  <DeliveryRegionMap city={result.destCity} state={result.destState} pin={result.destPin} />
                </div>

                {/* Order details */}
                <div className="p-5 sm:p-6 lg:border-l border-t lg:border-t-0 border-[#EEF2F6]">
                  <h3 className="text-[16px] font-bold text-[#0F172A] flex items-center gap-2"><Package className="w-[18px] h-[18px] text-[#00A86B]" />Order details</h3>

                  <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4">
                    <div>
                      <dt className="text-[11.5px] font-semibold text-[#94A3B8] uppercase tracking-wider">Order ID</dt>
                      <dd className="mt-0.5 text-[14px] font-bold text-[#0F172A] font-mono">{result.orderId.length > 3 ? `${'•'.repeat(Math.min(6, result.orderId.length - 3))}${result.orderId.slice(-3)}` : result.orderId}</dd>
                    </div>
                    <div>
                      <dt className="text-[11.5px] font-semibold text-[#94A3B8] uppercase tracking-wider">Placed on</dt>
                      <dd className="mt-0.5 text-[14px] font-bold text-[#0F172A]">{result.placedOn}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-[11.5px] font-semibold text-[#94A3B8] uppercase tracking-wider">Payment</dt>
                      <dd className="mt-1">
                        <span className={`inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-[12.5px] font-semibold ${result.paymentMode === 'COD' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-[#F0FDF4] text-[#00A86B] border border-[#00A86B]/20'}`}>
                          {result.paymentMode === 'COD' ? <Wallet className="w-3.5 h-3.5" /> : <CreditCard className="w-3.5 h-3.5" />}
                          {result.paymentMode === 'COD' ? `Cash on delivery${result.codAmount ? ` · ₹${result.codAmount.toLocaleString('en-IN')}` : ''}` : 'Prepaid'}
                        </span>
                      </dd>
                    </div>
                  </dl>

                  {/* Route */}
                  <div className="mt-5 rounded-2xl bg-[#F8FAFC] border border-[#EEF2F6] p-4">
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center pt-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#00A86B] ring-4 ring-[#00A86B]/15" />
                        <span className="flex-1 my-1 border-l-2 border-dashed border-[#CBD5E1] min-h-[28px]" />
                        <span className="w-2.5 h-2.5 rounded-full bg-[#0F172A] ring-4 ring-[#0F172A]/10" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-4">
                        <div>
                          <div className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Shipped from</div>
                          <div className="text-[13.5px] font-semibold text-[#0F172A] truncate">{result.pickup}</div>
                        </div>
                        <div>
                          <div className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Delivering to</div>
                          <div className="text-[13.5px] font-semibold text-[#0F172A] truncate">{result.destination}{result.destPin ? ` – ${result.destPin}` : ''}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* ═══════════════════════ HELP ═══════════════════════ */}
        <section id="help" className="relative scroll-mt-24 px-6 md:px-10 py-16 md:py-20 max-w-7xl mx-auto">
          <div className="bg-[#F8FAFC] rounded-[24px] border border-[#E0EDE8] p-7 md:p-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-7">
              <div>
                <h3 className="text-[19px] md:text-[22px] font-bold text-[#0F172A]">Need Help With Your Shipment?</h3>
                <p className="text-[13.5px] text-[#64748B] mt-1">Our support team is here for you, every step of the way.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: HelpCircle, label: 'Raise a Ticket', desc: 'Report an issue' },
                { icon: Phone, label: 'Call Support', desc: '+91 1800-123-456' },
                { icon: MessageCircle, label: 'Chat Support', desc: 'Avg reply in 2 min' },
                { icon: Headphones, label: 'FAQs', desc: 'Common questions' },
              ].map((item) => (
                <button
                  key={item.label}
                  className="bg-white border border-[#E0EDE8] rounded-2xl p-4 md:p-5 flex flex-col items-start gap-3 text-left hover:border-[#00A86B]/30 hover:shadow-lg hover:shadow-[#00A86B]/5 hover:-translate-y-[2px] transition-all duration-250"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#F0FDF4] flex items-center justify-center">
                    <item.icon className="w-4.5 h-4.5 text-[#00A86B]" />
                  </div>
                  <div>
                    <div className="text-[13px] font-bold text-[#0F172A]">{item.label}</div>
                    <div className="text-[11px] text-[#94A3B8] mt-0.5">{item.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════ FEATURES ═══════════════════════ */}
        <section className="relative py-16 md:py-24 bg-[#F8FAFC] overflow-hidden">
          <DotGrid />
          <div className="relative max-w-7xl mx-auto px-6 md:px-10">
            <motion.div
              className="text-center mb-12 md:mb-14"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.55, ease: EASE }}
            >
              <Eyebrow>Built For Trust</Eyebrow>
              <h2 className="mt-5 text-[28px] md:text-[36px] font-bold text-[#0F172A] leading-[1.2] tracking-tight">
                Why Track with QuickPost
              </h2>
              <p className="mt-3 text-[15px] text-[#64748B] max-w-[520px] mx-auto leading-relaxed">
                Enterprise-grade tracking infrastructure, built for accuracy and speed across every courier partner in India.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { icon: Zap, title: 'Real Time Tracking', desc: 'Live status updates pulled directly from courier networks, refreshed continuously.' },
                { icon: Truck, title: 'Multiple Courier Partners', desc: 'One page to track shipments across 25+ integrated courier partners nationwide.' },
                { icon: Bell, title: 'Live Notifications', desc: 'Get notified the moment your shipment status changes, from pickup to delivery.' },
                { icon: Target, title: 'Accurate Delivery Updates', desc: 'Precise ETAs and hub-level visibility so you always know exactly where things stand.' },
              ].map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.5, delay: i * 0.08, ease: EASE }}
                  className="bg-white rounded-2xl p-6 md:p-7 border border-slate-100 hover:border-[#00A86B]/30 hover:shadow-xl hover:shadow-[#00A86B]/5 transition-all duration-300"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#F0FDF4] flex items-center justify-center mb-4">
                    <feature.icon className="w-5 h-5 text-[#00A86B]" strokeWidth={1.75} />
                  </div>
                  <h4 className="text-[15px] font-bold text-[#0F172A] mb-1.5">{feature.title}</h4>
                  <p className="text-[13px] text-[#64748B] leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <style>{`
        .qp-cta-track { transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease; }
        .qp-cta-track:hover { transform: translateY(-2px); box-shadow: 0 6px 22px rgba(0, 168, 107, 0.48) !important; filter: brightness(1.06); }
        .qp-cta-track:active { transform: translateY(0); }
      `}</style>
    </div>
  );
}
