import React, { useState, useRef, useEffect } from 'react';
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
} from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { apiClient } from '../services/apiClient';

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
}

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
    orderId: d.orderId || '—',
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
  };
};

const DEFAULT_STATUS_STYLE = { bg: 'bg-[#F1F5F9]', text: 'text-[#475569]', border: 'border-[#475569]/20', dot: 'bg-[#475569]' };

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  'Delivered':        { bg: 'bg-[#F0FDF4]', text: 'text-[#00A86B]', border: 'border-[#00A86B]/25', dot: 'bg-[#00A86B]' },
  'RTO Delivered':    { bg: 'bg-[#FFF7ED]', text: 'text-[#EA580C]', border: 'border-[#EA580C]/20', dot: 'bg-[#EA580C]' },
  'Out for Delivery': { bg: 'bg-[#EFF6FF]', text: 'text-[#2563EB]', border: 'border-[#2563EB]/20', dot: 'bg-[#2563EB]' },
  'In-transit':       { bg: 'bg-[#F5F3FF]', text: 'text-[#7C3AED]', border: 'border-[#7C3AED]/20', dot: 'bg-[#7C3AED]' },
  'Ready To Ship':    { bg: 'bg-[#F0F9FF]', text: 'text-[#0369A1]', border: 'border-[#0369A1]/20', dot: 'bg-[#0369A1]' },
  'Booked':           { bg: 'bg-[#F0F9FF]', text: 'text-[#0369A1]', border: 'border-[#0369A1]/20', dot: 'bg-[#0369A1]' },
  'Undelivered':      { bg: 'bg-[#FFFBEB]', text: 'text-[#D97706]', border: 'border-[#D97706]/20', dot: 'bg-[#D97706]' },
  'RTO':              { bg: 'bg-[#FFFBEB]', text: 'text-[#D97706]', border: 'border-[#D97706]/20', dot: 'bg-[#D97706]' },
  'RTO In-transit':   { bg: 'bg-[#FFFBEB]', text: 'text-[#D97706]', border: 'border-[#D97706]/20', dot: 'bg-[#D97706]' },
  'Cancelled':        { bg: 'bg-[#FEF2F2]', text: 'text-[#DC2626]', border: 'border-[#DC2626]/20', dot: 'bg-[#DC2626]' },
  'Lost':             { bg: 'bg-[#FEF2F2]', text: 'text-[#DC2626]', border: 'border-[#DC2626]/20', dot: 'bg-[#DC2626]' },
  'Not Picked':       { bg: 'bg-[#FEF2F2]', text: 'text-[#DC2626]', border: 'border-[#DC2626]/20', dot: 'bg-[#DC2626]' },
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

export function Track() {
  const [searchMode, setSearchMode] = useState<'order' | 'awb'>('awb');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<'awb' | 'order' | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const runSearch = async (value: string) => {
    if (!value.trim()) {
      setError(`Please enter a valid ${searchMode === 'awb' ? 'AWB number' : 'Order ID'}.`);
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);
    try {
      const endpoint = searchMode === 'order'
        ? `/orders/GetTrackingByOrderId/${encodeURIComponent(value.trim())}`
        : `/orders/GetTrackingByAwb/${encodeURIComponent(value.trim())}`;
      const res = await apiClient.get(endpoint);
      setResult(mapApiToResult(res.data, value.trim()));
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (err: any) {
      setError(err?.response?.status === 404 ? 'Order not found. Please check and try again.' : 'Failed to fetch tracking info. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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

      <main className="flex-1">

        {/* ═══════════════════════ HERO ═══════════════════════ */}
        <section className="relative overflow-hidden pt-[120px] pb-16 md:pt-[150px] md:pb-24 bg-[#F8FAFC]">
          <DotGrid />
          <div className="absolute top-24 -right-24 w-[420px] h-[420px] rounded-full bg-[#00A86B]/[0.05] blur-3xl pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-6 md:px-10 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left — copy */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
            >
              <h1 className="text-[34px] leading-[1.15] md:text-[52px] md:leading-[1.1] font-bold text-[#0F172A] tracking-tight">
                Track Every Shipment
                <br />
                <span className="text-[#00A86B]">Real-Time. Accurate. Transparent.</span>
              </h1>

              <p className="mt-5 text-[15px] md:text-[16px] text-[#5F5E5A] leading-relaxed max-w-[520px]">
                Track your courier across all courier partners using Order ID or AWB Number. Get live shipment updates, courier information, estimated delivery, and complete tracking history.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-3">
                {[
                  { icon: Truck, label: '25+ Courier Partners' },
                  { icon: Zap, label: 'Real-Time Updates' },
                  { icon: ShieldCheck, label: '99.2% Accuracy' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2 text-[12.5px] font-semibold text-[#475569]">
                    <item.icon className="w-4 h-4 text-[#00A86B]" />
                    {item.label}
                  </div>
                ))}
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
        <section id="track-card" className="relative -mt-8 md:-mt-14 px-6 md:px-10 z-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.55, ease: EASE }}
            className="max-w-3xl mx-auto bg-white rounded-[24px] border border-[#E0EDE8] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.15)] p-6 md:p-8"
          >
            {/* Tabs */}
            <div className="inline-flex items-center gap-1 bg-[#F1F5F9] rounded-xl p-1 mb-5">
              {([
                { key: 'order', label: 'Order ID' },
                { key: 'awb', label: 'AWB Number' },
              ] as const).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => { setSearchMode(tab.key); setError(''); }}
                  className={`px-4 py-2 rounded-lg text-[13px] font-bold transition-all duration-200 ${
                    searchMode === tab.key ? 'bg-white text-[#00A86B] shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => { e.preventDefault(); runSearch(query); }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <div className="relative flex-1 group">
                <Search className="w-[18px] h-[18px] absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8] transition-colors group-focus-within:text-[#00A86B]" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchMode === 'order' ? 'Enter Order ID (e.g. QP2408417)' : 'Enter AWB Number'}
                  className="w-full h-[52px] pl-12 pr-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-[14.5px] font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-4 focus:ring-[#00A86B]/10 focus:bg-white transition-all duration-200"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="qp-cta-track h-[52px] px-7 rounded-xl text-[14.5px] font-bold text-white tracking-[-0.01em] flex items-center justify-center gap-2 disabled:opacity-70"
                style={{
                  background: 'linear-gradient(135deg, #00A86B 0%, #00C47A 100%)',
                  boxShadow: '0 2px 14px rgba(0, 168, 107, 0.38)',
                }}
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Searching…
                  </>
                ) : (
                  <>Track Shipment</>
                )}
              </button>
            </form>

            {error && (
              <p className="mt-3 text-[12.5px] font-semibold text-[#DC2626]">{error}</p>
            )}

            {/* Loading progress line */}
            <AnimatePresence>
              {loading && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-5 overflow-hidden"
                >
                  <div className="h-1 w-full bg-[#F1F5F9] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: 'linear-gradient(90deg, #00A86B, #00C47A)' }}
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
              {/* Header status card */}
              <div className="bg-white rounded-2xl border border-[#E0EDE8] shadow-sm p-4 sm:p-5 md:p-7 mb-5 md:mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#F8FAFC] border border-[#E0EDE8] flex items-center justify-center shrink-0 overflow-hidden">
                      <img src={result.courierLogo} alt={result.courierName} className="max-w-[32px] max-h-[32px] sm:max-w-[38px] sm:max-h-[38px] object-contain" />
                    </div>
                    <div className="min-w-0">
                      <div className={`inline-flex items-center gap-1.5 text-[11px] sm:text-[11.5px] font-bold px-2.5 sm:px-3 py-1 rounded-full border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} mb-1.5`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot} shrink-0`} />
                        {result.status}
                      </div>
                      <h2 className="text-[15.5px] sm:text-[17px] md:text-[19px] font-bold text-[#0F172A] truncate">{result.courierName}</h2>
                      <p className="text-[12px] sm:text-[12.5px] text-[#64748B] truncate">{result.serviceType}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:flex md:items-center gap-3 sm:gap-4 md:gap-8 pt-3 md:pt-0 border-t md:border-t-0 border-dashed border-[#E2E8F0]">
                    <div className="min-w-0">
                      <div className="text-[9.5px] sm:text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-0.5">AWB Number</div>
                      <button onClick={() => copyValue(result.awb, 'awb')} className="flex items-center gap-1.5 text-[12.5px] sm:text-[13px] font-bold text-[#0F172A] hover:text-[#00A86B] transition-colors max-w-full">
                        <span className="truncate">{result.awb}</span> <Copy className="w-3 h-3 shrink-0" />
                      </button>
                      {copied === 'awb' && <span className="text-[10px] font-semibold text-[#00A86B]">Copied!</span>}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[9.5px] sm:text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-0.5">Order ID</div>
                      <button onClick={() => copyValue(result.orderId, 'order')} className="flex items-center gap-1.5 text-[12.5px] sm:text-[13px] font-bold text-[#0F172A] hover:text-[#00A86B] transition-colors max-w-full">
                        <span className="truncate">{result.orderId}</span> <Copy className="w-3 h-3 shrink-0" />
                      </button>
                      {copied === 'order' && <span className="text-[10px] font-semibold text-[#00A86B]">Copied!</span>}
                    </div>
                  </div>
                </div>

                <div className="mt-4 sm:mt-5 pt-4 sm:pt-5 border-t border-dashed border-[#E2E8F0] grid grid-cols-2 md:grid-cols-4 gap-x-3 gap-y-4 sm:gap-5">
                  {[
                    { icon: MapPin, label: 'Pickup', value: result.pickup },
                    { icon: Target, label: 'Destination', value: result.destination },
                    { icon: Clock, label: result.deliveredOn ? 'Delivered On' : 'Expected Delivery', value: result.deliveredOn || result.expectedDelivery },
                    { icon: result.paymentMode === 'COD' ? Wallet : CreditCard, label: 'Payment Mode', value: result.paymentMode === 'COD' ? `COD · ₹${result.codAmount?.toLocaleString('en-IN')}` : 'Prepaid' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-2 sm:gap-2.5 min-w-0">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#F0FDF4] flex items-center justify-center shrink-0 mt-0.5">
                        <item.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#00A86B]" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[9.5px] sm:text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">{item.label}</div>
                        <div className="text-[12.5px] sm:text-[13px] font-bold text-[#0F172A] truncate">{item.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timeline + Map + Courier details grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

                {/* Timeline */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E0EDE8] shadow-sm p-4 sm:p-5 md:p-7">
                  <div className="flex items-center justify-between mb-5 sm:mb-6">
                    <h3 className="text-[14px] sm:text-[15px] font-bold text-[#0F172A]">Tracking History</h3>
                    <span className="text-[10.5px] sm:text-[11px] font-bold text-[#64748B] bg-[#F1F5F9] px-2 sm:px-2.5 py-1 rounded-full whitespace-nowrap">
                      {doneCount}/{result.timeline.length} completed
                    </span>
                  </div>

                  <div className="relative">
                    {result.timeline.map((event, idx) => {
                      const Icon = STATUS_STEP_ICONS[idx] || CheckCircle2;
                      const isLast = idx === result.timeline.length - 1;
                      return (
                        <motion.div
                          key={event.status}
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true, margin: '-20px' }}
                          transition={{ duration: 0.4, delay: idx * 0.08, ease: EASE }}
                          className="relative flex gap-3 sm:gap-4 pb-6 sm:pb-8 last:pb-0"
                        >
                          {!isLast && (
                            <div
                              className={`absolute left-4 sm:left-[19px] top-9 sm:top-10 bottom-0 w-[2px] ${event.done ? 'bg-[#00A86B]' : 'bg-[#E2E8F0]'}`}
                            />
                          )}
                          <div
                            className={`relative z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 border-2 ${
                              event.done
                                ? 'bg-[#00A86B] border-[#00A86B] text-white'
                                : 'bg-white border-[#E2E8F0] text-[#CBD5E1]'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
                          </div>
                          <div className="flex-1 min-w-0 pt-1 sm:pt-1.5">
                            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-x-2 gap-y-0.5 sm:gap-y-1">
                              <h4 className={`text-[13px] sm:text-[13.5px] font-bold ${event.done ? 'text-[#0F172A]' : 'text-[#94A3B8]'}`}>{event.status}</h4>
                              {event.done && (
                                <span className="text-[10px] sm:text-[10.5px] font-semibold text-[#64748B]">
                                  {event.date} · {event.time}
                                </span>
                              )}
                            </div>
                            <p className={`text-[12px] sm:text-[12.5px] mt-0.5 ${event.done ? 'text-[#475569]' : 'text-[#94A3B8]'}`}>{event.description}</p>
                            {event.done && event.location && (
                              <p className="text-[11px] sm:text-[11.5px] text-[#94A3B8] mt-0.5 flex items-center gap-1">
                                <MapPin className="w-3 h-3 shrink-0" /> <span className="truncate">{event.location}</span>
                              </p>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Right column — Map + Courier details */}
                <div className="space-y-4 sm:space-y-6">
                  <RoutePreview pickup={result.pickup} destination={result.destination} />

                  <div className="bg-white rounded-2xl border border-[#E0EDE8] shadow-sm p-4 sm:p-5 md:p-6">
                    <h3 className="text-[13px] font-bold text-[#0F172A] mb-3.5 sm:mb-4">Courier Details</h3>
                    <div className="space-y-3 sm:space-y-3.5">
                      {[
                        { icon: Truck, label: 'Courier Partner', value: result.courierName },
                        { icon: Hash, label: 'Tracking Number', value: result.awb },
                        { icon: ScanLine, label: 'Service Type', value: result.serviceType },
                        { icon: Building2, label: 'Current Hub', value: result.currentHub },
                        { icon: Weight, label: 'Shipment Weight', value: result.weight },
                        { icon: Ruler, label: 'Dimensions', value: result.dimensions },
                        { icon: Hash, label: 'Customer Reference', value: result.customerRef },
                      ].map((row) => (
                        <div key={row.label} className="flex items-center justify-between gap-2.5 sm:gap-3">
                          <div className="flex items-center gap-1.5 sm:gap-2 text-[#64748B] shrink-0">
                            <row.icon className="w-3.5 h-3.5 shrink-0" />
                            <span className="text-[11.5px] sm:text-[12px] font-semibold whitespace-nowrap">{row.label}</span>
                          </div>
                          <span className="text-[12px] sm:text-[12.5px] font-bold text-[#0F172A] text-right truncate">{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* ═══════════════════════ HELP ═══════════════════════ */}
        <section className="relative px-6 md:px-10 py-16 md:py-20 max-w-7xl mx-auto">
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
