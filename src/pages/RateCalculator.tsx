import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calculator,
  Truck,
  Plane,
  MapPin,
  Target,
  Weight,
  Ruler,
  Wallet,
  CreditCard,
  ChevronDown,
  Info,
  Zap,
  ShieldCheck,
  BadgeIndianRupee,
  ArrowRight,
  PackageCheck,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

/* ── Easing curve used site-wide ── */
const EASE = [0.16, 1, 0.3, 1] as const;

interface CourierWorking {
  freight: number;
  docket_charges: number;
  pickup_charge: number;
  handling_charge: number;
  appointment_charge: number;
  cod_charges: number;
  rov: number;
  fsc: number;
  oda: number;
  green_tax: number;
  gst: number;
  grand_total: number;
}

interface CourierResult {
  _id: string;
  courierServiceName: string;
  courierType: string;
  orderType: 'B2C' | 'B2B';
  mode_name?: string;
  forward: { finalCharges: number | null };
  working?: CourierWorking;
}

const getCarrierLogo = (name: string): string => {
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

const isModeAir = (item: CourierResult) =>
  item.orderType === 'B2C'
    ? item.courierType?.toLowerCase().includes('air')
    : item.mode_name === 'air';

/* ── Demo rate engine — /ratecalculate/Rate requires an authenticated seller session
   (401 for anonymous callers), so this public page simulates a realistic quote instead.
   Swap generateDemoResults() for the real apiClient.post call once a public/unauthenticated
   rate endpoint is exposed by the backend. ── */
const DEMO_COURIERS: { name: string; type: 'B2C' | 'B2B'; mode: 'air' | 'surface'; baseRate: number; perKg: number }[] = [
  { name: 'Xpressbees',    type: 'B2C', mode: 'surface', baseRate: 28, perKg: 14 },
  { name: 'Delhivery',     type: 'B2C', mode: 'surface', baseRate: 32, perKg: 16 },
  { name: 'Ekart',         type: 'B2C', mode: 'surface', baseRate: 30, perKg: 15 },
  { name: 'Shadowfax',     type: 'B2C', mode: 'surface', baseRate: 27, perKg: 13.5 },
  { name: 'DTDC',          type: 'B2C', mode: 'air',     baseRate: 46, perKg: 22 },
  { name: 'Bluedart',      type: 'B2C', mode: 'air',     baseRate: 58, perKg: 27 },
  { name: 'Shree Maruti',  type: 'B2B', mode: 'surface', baseRate: 34, perKg: 15.5 },
  { name: 'Amazon Shipping', type: 'B2C', mode: 'surface', baseRate: 31, perKg: 15 },
];

const seededJitter = (seed: string, spread = 0.08) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return 1 + (((h % 1000) / 1000) * 2 - 1) * spread;
};

const generateDemoResults = (form: {
  pickUpPincode: string; deliveryPincode: string; weight: string;
  declaredValue: string; paymentType: 'Prepaid' | 'COD';
}, applicableWeight: number): CourierResult[] => {
  const declaredValue = parseFloat(form.declaredValue) || 0;
  const zoneFactor = 1 + (Math.abs(parseInt(form.pickUpPincode[0] || '0', 10) - parseInt(form.deliveryPincode[0] || '0', 10)) * 0.06);
  const weightForCalc = Math.max(applicableWeight, 0.5);
  const codFee = form.paymentType === 'COD' ? Math.max(25, declaredValue * 0.015) : 0;

  return DEMO_COURIERS.map((c, idx) => {
    const jitter = seededJitter(`${c.name}-${form.pickUpPincode}-${form.deliveryPincode}`);
    const freight = (c.baseRate + c.perKg * weightForCalc) * zoneFactor * jitter;
    const fsc = freight * 0.09;
    const gstBase = freight + fsc + codFee;
    const gst = gstBase * 0.18;
    const grandTotal = Math.round(gstBase + gst);

    if (c.type === 'B2B') {
      const working: CourierWorking = {
        freight: Math.round(freight),
        docket_charges: 20,
        pickup_charge: 15,
        handling_charge: 10,
        appointment_charge: 0,
        cod_charges: Math.round(codFee),
        rov: Math.round(declaredValue * 0.002),
        fsc: Math.round(fsc),
        oda: 0,
        green_tax: 5,
        gst: Math.round(gst),
        grand_total: grandTotal,
      };
      return {
        _id: `demo-${idx}`,
        courierServiceName: c.name,
        courierType: c.mode,
        orderType: 'B2B',
        mode_name: c.mode,
        forward: { finalCharges: null },
        working,
      };
    }

    return {
      _id: `demo-${idx}`,
      courierServiceName: c.name,
      courierType: c.mode === 'air' ? 'Air' : 'Surface',
      orderType: 'B2C',
      forward: { finalCharges: grandTotal },
    };
  });
};

/* ── Dot-grid background, same recipe as Track.tsx / TrustedBrands ── */
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

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#00A86B] bg-[#00A86B]/10 border border-[#00A86B]/20 px-4 py-1.5 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-[#00A86B] animate-pulse" />
      {children}
    </span>
  );
}

/* ── Bespoke 2D hero illustration — a rate ticket resolving between two pins,
     built as pure SVG/Framer Motion so it never depends on an external asset host ── */
function HeroIllustration() {
  return (
    <div className="relative w-full max-w-[460px] mx-auto aspect-square flex items-center justify-center">
      <div className="absolute inset-0 rounded-full bg-[#00A86B]/[0.06] blur-3xl" />

      <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full">
        <circle cx="200" cy="200" r="196" fill="none" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="1 9" strokeLinecap="round" />
        <circle cx="200" cy="200" r="150" fill="none" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="1 9" strokeLinecap="round" />
      </svg>

      {/* Route arc between origin and destination pins */}
      <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full">
        <path
          d="M 70 290 C 130 180, 270 220, 330 110"
          fill="none"
          stroke="#E2E8F0"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <motion.path
          d="M 70 290 C 130 180, 270 220, 330 110"
          fill="none"
          stroke="#00A86B"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="6 8"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, ease: EASE, repeat: Infinity, repeatType: 'loop', repeatDelay: 1.2 }}
        />

        {/* Origin pin */}
        <g>
          <circle cx="70" cy="290" r="7" fill="#00A86B" />
          <circle cx="70" cy="290" r="12" fill="none" stroke="#00A86B" strokeOpacity="0.3" strokeWidth="2" />
        </g>
        {/* Destination pin */}
        <g>
          <circle cx="330" cy="110" r="7" fill="#2563EB" />
          <circle cx="330" cy="110" r="12" fill="none" stroke="#2563EB" strokeOpacity="0.3" strokeWidth="2" />
        </g>

        {/* Moving parcel marker */}
        <motion.g
          initial={{ offsetDistance: '0%' }}
          animate={{ offsetDistance: '100%' }}
          transition={{ duration: 2, ease: EASE, repeat: Infinity, repeatType: 'loop', repeatDelay: 1.2 }}
          style={{ offsetPath: "path('M 70 290 C 130 180, 270 220, 330 110')" } as React.CSSProperties}
        >
          <circle r="6" fill="#0F172A" />
        </motion.g>
      </svg>

      {/* Floating price chip */}
      <motion.div
        className="absolute left-[4%] sm:left-[8%] bottom-[18%] sm:bottom-[20%] bg-white border border-[#E0EDE8] rounded-xl px-2 sm:px-3 py-1.5 sm:py-2 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.15)] flex items-center gap-1.5 sm:gap-2"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-[#F0FDF4] flex items-center justify-center shrink-0">
          <BadgeIndianRupee className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#00A86B]" />
        </div>
        <div>
          <div className="text-[8px] sm:text-[9px] font-bold text-[#94A3B8] uppercase tracking-wide leading-none">From</div>
          <div className="text-[11.5px] sm:text-[13px] font-extrabold text-[#0F172A] leading-none mt-0.5">₹28</div>
        </div>
      </motion.div>

      {/* Floating ETA chip */}
      <motion.div
        className="absolute right-[4%] sm:right-[10%] top-[22%] sm:top-[24%] bg-white border border-[#E0EDE8] rounded-xl px-2 sm:px-3 py-1.5 sm:py-2 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.15)] flex items-center gap-1.5 sm:gap-2"
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
      >
        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-[#EFF6FF] flex items-center justify-center shrink-0">
          <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#2563EB]" />
        </div>
        <div>
          <div className="text-[8px] sm:text-[9px] font-bold text-[#94A3B8] uppercase tracking-wide leading-none">25+ Couriers</div>
          <div className="text-[11.5px] sm:text-[13px] font-extrabold text-[#0F172A] leading-none mt-0.5">Compared</div>
        </div>
      </motion.div>

      {/* central — QuickPost logo, no card background */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        <img
          src="/logo-color.png"
          alt="QuickPost"
          className="h-20 sm:h-28 md:h-32 w-auto object-contain drop-shadow-[0_10px_30px_rgba(0,168,107,0.25)]"
        />
      </div>
    </div>
  );
}

/* ── Numeric input with unit suffix, matches Track.tsx's field styling language ── */
function UnitInput({
  label,
  required,
  value,
  onChange,
  placeholder,
  unit,
  icon: Icon,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  unit: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div>
      <label className="block text-[12px] font-bold text-[#475569] mb-2">
        {label} {required && <span className="text-[#DC2626]">*</span>}
      </label>
      <div className="flex h-[46px] group">
        <div className="relative flex-1 min-w-0">
          <Icon className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8] transition-colors group-focus-within:text-[#00A86B]" />
          <input
            type="text"
            inputMode="decimal"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full h-full pl-10 pr-3 border border-r-0 border-[#E2E8F0] rounded-l-full bg-[#F8FAFC] text-[13.5px] font-semibold text-[#0F172A] placeholder:text-[#94A3B8] placeholder:font-normal focus:outline-none focus:border-[#00A86B] focus:bg-white transition-colors"
          />
        </div>
        <span className="w-11 flex items-center justify-center bg-[#00A86B] text-white text-[11.5px] font-bold rounded-r-full shrink-0">
          {unit}
        </span>
      </div>
    </div>
  );
}

const IMPORTANT_TERMS = [
  'Above mentioned prices are inclusive of GST.',
  'Fixed COD charge or COD % of the order value whichever is higher will be considered while calculating the COD fee.',
  'Dead/Dry weight or volumetric weight whichever is higher will be considered while calculating the freight charges.',
  'Volumetric weight is calculated L × W × H (in cms) / 5000 for all courier companies.',
  'RTO (return to origin) shipment will be charged differently from the forward delivery rate.',
  'Additional government rules and norms can be applicable while shipping to certain states and are subject to change without prior intimation.',
  'For any queries reach out to us at support@shipexindia.com.',
];

export function RateCalculator() {
  const resultRef = useRef<HTMLDivElement>(null);
  const paymentDropdownRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    pickUpPincode: '',
    deliveryPincode: '',
    weight: '',
    declaredValue: '',
    paymentType: 'Prepaid' as 'Prepaid' | 'COD',
    length: '',
    breadth: '',
    height: '',
  });

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CourierResult[]>([]);
  const [hasFetched, setHasFetched] = useState(false);
  const [error, setError] = useState('');
  const [b2bPopup, setB2bPopup] = useState<{ working: CourierWorking; top: number; left: number } | null>(null);

  const setField = (name: keyof typeof form, value: string) => setForm((f) => ({ ...f, [name]: value }));

  const actualWeight = parseFloat(form.weight) || 0;
  const l = parseFloat(form.length) || 0;
  const b = parseFloat(form.breadth) || 0;
  const h = parseFloat(form.height) || 0;
  const volumetricWeight = l > 0 && b > 0 && h > 0 ? (l * b * h) / 5000 : 0;
  const applicableWeight = Math.max(actualWeight, volumetricWeight);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.pickUpPincode || !form.deliveryPincode || !form.weight || !form.declaredValue) {
      setError('Please fill all required fields.');
      return;
    }
    if (form.pickUpPincode.length !== 6 || form.deliveryPincode.length !== 6) {
      setError('Pincode must be exactly 6 digits.');
      return;
    }
    if (!form.length || !form.breadth || !form.height) {
      setError('Please fill all dimension fields.');
      return;
    }

    try {
      setLoading(true);
      setHasFetched(false);
      setResults([]);

      // Simulated network delay so the loading/scan animation still reads as "live".
      await new Promise((resolve) => setTimeout(resolve, 900));

      const data = generateDemoResults(form, applicableWeight);
      const filtered = data.filter((item) => (item.orderType === 'B2C' ? item.forward.finalCharges !== null : item.working));
      setResults(filtered.sort((a, b2) => {
        const priceA = a.orderType === 'B2C' ? (a.forward.finalCharges ?? 0) : (a.working?.grand_total ?? 0);
        const priceB = b2.orderType === 'B2C' ? (b2.forward.finalCharges ?? 0) : (b2.working?.grand_total ?? 0);
        return priceA - priceB;
      }));
      setHasFetched(true);

      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
    } catch {
      setError('Failed to calculate rates. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setForm({
      pickUpPincode: '', deliveryPincode: '', weight: '', declaredValue: '',
      paymentType: 'Prepaid', length: '', breadth: '', height: '',
    });
    setResults([]);
    setHasFetched(false);
    setError('');
  };

  const openB2BPopup = (e: React.MouseEvent, working?: CourierWorking) => {
    if (!working) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const popupWidth = 236;
    let left = rect.left + rect.width / 2 - popupWidth / 2;
    left = Math.max(10, Math.min(window.innerWidth - popupWidth - 10, left));
    setB2bPopup({ working, top: rect.bottom + 10, left });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans text-[#0F172A] selection:bg-[#00A86B]/20 selection:text-[#00A86B]" style={{ fontFamily: 'Roboto, sans-serif' }}>
      <Navbar />

      <main className="flex-1">

        {/* ═══════════════════════ HERO ═══════════════════════ */}
        <section className="relative overflow-hidden pt-[104px] pb-10 sm:pt-[120px] sm:pb-16 md:pt-[150px] md:pb-24 bg-[#F8FAFC]">
          <DotGrid />
          <div className="absolute top-24 -right-24 w-[420px] h-[420px] rounded-full bg-[#00A86B]/[0.05] blur-3xl pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-10 grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
            >
              <Eyebrow>Rate Calculator</Eyebrow>
              <h1 className="mt-4 sm:mt-5 text-[28px] leading-[1.2] sm:text-[34px] sm:leading-[1.15] md:text-[52px] md:leading-[1.1] font-bold text-[#0F172A] tracking-tight">
                Know Your Shipping Cost
                <br />
                <span className="text-[#00A86B]">Before You Ship. Instantly.</span>
              </h1>

              <p className="mt-4 sm:mt-5 text-[13.5px] sm:text-[15px] md:text-[16px] text-[#5F5E5A] leading-relaxed max-w-[520px]">
                Compare live courier rates across 25+ partners by pincode, weight, and dimensions — see the cheapest and fastest option side-by-side, with zero hidden charges.
              </p>

              <div className="mt-6 sm:mt-9 flex flex-wrap items-center gap-x-5 sm:gap-x-8 gap-y-2.5 sm:gap-y-3">
                {[
                  { icon: Truck, label: '25+ Courier Partners' },
                  { icon: Zap, label: 'Instant Comparison' },
                  { icon: ShieldCheck, label: 'All-Inclusive Pricing' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5 sm:gap-2 text-[11.5px] sm:text-[12.5px] font-semibold text-[#475569]">
                    <item.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#00A86B]" />
                    {item.label}
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.15, ease: EASE }}
            >
              <HeroIllustration />
            </motion.div>
          </div>
        </section>

        {/* ═══════════════════════ CALCULATOR CARD ═══════════════════════ */}
        <section className="relative -mt-6 sm:-mt-8 md:-mt-14 px-4 sm:px-6 md:px-10 z-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.55, ease: EASE }}
            className="max-w-5xl mx-auto bg-white rounded-[20px] sm:rounded-[24px] border border-[#E0EDE8] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.15)] p-4 sm:p-6 md:p-8"
          >
            <form onSubmit={handleSubmit}>
              <div className="flex items-center justify-between mb-5 sm:mb-6 gap-2">
                <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#F0FDF4] flex items-center justify-center shrink-0">
                    <Calculator className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#00A86B]" />
                  </div>
                  <h2 className="text-[14.5px] sm:text-[16px] md:text-[17px] font-bold text-[#0F172A] truncate">Shipment Details</h2>
                </div>

                {/* Payment type toggle */}
                <div className="relative shrink-0" ref={paymentDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setPaymentOpen((o) => !o)}
                    className="flex items-center gap-1.5 sm:gap-2 h-9 sm:h-10 px-3.5 sm:px-4 rounded-full border border-[#E2E8F0] bg-[#F8FAFC] text-[11.5px] sm:text-[12.5px] font-bold text-[#0F172A] hover:border-[#00A86B] transition-colors"
                  >
                    {form.paymentType === 'COD' ? <Wallet className="w-3.5 h-3.5 text-[#00A86B]" /> : <CreditCard className="w-3.5 h-3.5 text-[#00A86B]" />}
                    {form.paymentType}
                    <ChevronDown className={`w-3.5 h-3.5 text-[#94A3B8] transition-transform ${paymentOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {paymentOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-1.5 w-36 bg-white border border-[#E2E8F0] rounded-xl shadow-lg overflow-hidden z-20 origin-top-right"
                      >
                        {(['Prepaid', 'COD'] as const).map((opt) => (
                          <button
                            type="button"
                            key={opt}
                            onClick={() => { setField('paymentType', opt); setPaymentOpen(false); }}
                            className={`w-full text-left px-4 py-2.5 text-[12.5px] font-bold transition-colors ${form.paymentType === opt ? 'bg-[#F0FDF4] text-[#00A86B]' : 'text-[#475569] hover:bg-[#F8FAFC]'}`}
                          >
                            {opt}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-[12.5px] font-semibold text-[#DC2626] bg-[#FEF2F2] border border-[#FCA5A5]/40 rounded-xl px-4 py-2.5 mb-5 overflow-hidden"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Pincodes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                <UnitInput
                  label="Pickup Pincode" required icon={MapPin} unit="IN"
                  value={form.pickUpPincode}
                  onChange={(v) => setField('pickUpPincode', v.replace(/\D/g, '').slice(0, 6))}
                  placeholder="e.g. 110001"
                />
                <UnitInput
                  label="Delivery Pincode" required icon={Target} unit="IN"
                  value={form.deliveryPincode}
                  onChange={(v) => setField('deliveryPincode', v.replace(/\D/g, '').slice(0, 6))}
                  placeholder="e.g. 400001"
                />
              </div>

              {/* Weight + Value */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                <UnitInput
                  label="Approximate Weight" required icon={Weight} unit="kg"
                  value={form.weight}
                  onChange={(v) => { if (/^\d*\.?\d*$/.test(v)) setField('weight', v); }}
                  placeholder="e.g. 1"
                />
                <UnitInput
                  label="Declared Value" required icon={BadgeIndianRupee} unit="₹"
                  value={form.declaredValue}
                  onChange={(v) => setField('declaredValue', v.replace(/\D/g, ''))}
                  placeholder="e.g. 1500"
                />
              </div>

              {/* Dimensions */}
              <div className="mb-5">
                <label className="block text-[12px] font-bold text-[#475569] mb-2">
                  Package Dimensions (cm) <span className="text-[#DC2626]">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {([['length', 'L'], ['breadth', 'W'], ['height', 'H']] as const).map(([key, label]) => (
                    <div key={key} className="relative group">
                      <Ruler className="w-3.5 h-3.5 sm:w-4 sm:h-4 absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] transition-colors group-focus-within:text-[#00A86B]" />
                      <input
                        type="number"
                        min="0"
                        value={form[key]}
                        onChange={(e) => setField(key, e.target.value)}
                        placeholder={label}
                        className="w-full h-[46px] pl-7 sm:pl-10 pr-2 sm:pr-3 border border-[#E2E8F0] rounded-full bg-[#F8FAFC] text-[13px] sm:text-[13.5px] font-semibold text-[#0F172A] placeholder:text-[#94A3B8] placeholder:font-normal focus:outline-none focus:border-[#00A86B] focus:bg-white transition-colors"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Live weight readout */}
              <div className="flex flex-wrap gap-3 mb-6">
                <div className="flex items-center gap-2 px-4 py-2 bg-[#F0FDF4] border border-[#DCFCE7] rounded-xl">
                  <Weight className="w-3.5 h-3.5 text-[#00A86B]" />
                  <span className="text-[12px] font-bold text-[#0F172A]">Volumetric: {volumetricWeight.toFixed(2)} kg</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-[#F0FDF4] border border-[#DCFCE7] rounded-xl">
                  <PackageCheck className="w-3.5 h-3.5 text-[#00A86B]" />
                  <span className="text-[12px] font-bold text-[#0F172A]">Applicable: {applicableWeight.toFixed(2)} kg</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-row gap-2.5 sm:gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="qp-cta-calc flex-1 sm:flex-none sm:min-w-[220px] h-[46px] sm:h-[52px] px-4 sm:px-8 rounded-full text-[13px] sm:text-[14.5px] font-bold text-white tracking-[-0.01em] flex items-center justify-center gap-1.5 sm:gap-2 disabled:opacity-70"
                  style={{
                    background: 'linear-gradient(135deg, #00A86B 0%, #00C47A 100%)',
                    boxShadow: '0 2px 14px rgba(0, 168, 107, 0.38)',
                  }}
                >
                  {loading ? (
                    <>
                      <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Calculating…
                    </>
                  ) : (
                    <>
                      <span className="sm:hidden">Calculate</span>
                      <span className="hidden sm:inline">Calculate Rates</span>
                      <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="h-[46px] sm:h-[52px] px-4 sm:px-7 rounded-full text-[13px] sm:text-[13.5px] font-bold text-[#475569] border border-[#E2E8F0] hover:bg-[#F8FAFC] hover:border-[#CBD5E1] transition-colors flex items-center justify-center gap-1.5 sm:gap-2 shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset
                </button>
              </div>
            </form>
          </motion.div>
        </section>

        {/* ═══════════════════════ RESULTS ═══════════════════════ */}
        <div ref={resultRef} />
        <AnimatePresence>
          {hasFetched && results.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="relative px-4 sm:px-6 md:px-10 pt-10 sm:pt-14 md:pt-16 pb-4 max-w-5xl mx-auto"
            >
              <div className="flex items-center justify-between mb-4 sm:mb-5 gap-2">
                <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                  <Sparkles className="w-4 h-4 text-[#00A86B] shrink-0" />
                  <h3 className="text-[15px] sm:text-[17px] font-bold text-[#0F172A] truncate">Available Courier Partners</h3>
                </div>
                <span className="text-[11px] sm:text-[11.5px] font-bold text-[#00A86B] bg-[#F0FDF4] border border-[#DCFCE7] px-2.5 sm:px-3 py-1 rounded-full shrink-0">
                  {results.length} found
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                {results.map((item, idx) => {
                  const logo = getCarrierLogo(item.courierServiceName);
                  const isAir = isModeAir(item);
                  const price = item.orderType === 'B2C' ? item.forward.finalCharges : item.working?.grand_total;
                  const cheapestPrice = results[0].orderType === 'B2C' ? results[0].forward.finalCharges : results[0].working?.grand_total;
                  const delta = price != null && cheapestPrice != null ? price - cheapestPrice : 0;
                  const isCheapest = idx === 0;

                  return (
                    <motion.div
                      key={item._id}
                      initial={{ opacity: 0, y: 16, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.4, delay: idx * 0.06, ease: EASE }}
                      whileHover={{ y: -3 }}
                      className={`relative rounded-2xl p-4 sm:p-5 overflow-hidden transition-shadow duration-250 ${
                        isCheapest
                          ? 'border-2 border-[#00A86B] shadow-[0_12px_32px_-12px_rgba(0,168,107,0.35)]'
                          : 'border border-[#E0EDE8] shadow-sm hover:shadow-[0_10px_28px_-14px_rgba(15,23,42,0.18)] hover:border-[#CBD5E1]'
                      }`}
                      style={isCheapest ? { background: 'linear-gradient(160deg, #F0FDF4 0%, #FFFFFF 55%)' } : { background: '#FFFFFF' }}
                    >
                      {/* Rank medallion */}
                      <div
                        className={`absolute top-0 right-0 w-16 h-16 flex items-start justify-end p-2.5 ${isCheapest ? '' : ''}`}
                        aria-hidden
                      >
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-extrabold ${
                            isCheapest ? 'bg-[#00A86B] text-white' : 'bg-[#F1F5F9] text-[#64748B]'
                          }`}
                        >
                          {idx + 1}
                        </span>
                      </div>

                      {isCheapest && (
                        <span className="absolute top-4 left-5 text-[9.5px] font-extrabold text-white bg-[#00A86B] px-2 py-[3px] rounded-full uppercase tracking-wide flex items-center gap-1 shadow-sm">
                          <Sparkles className="w-2.5 h-2.5" /> Best Value
                        </span>
                      )}

                      <div className={`flex items-center gap-3.5 ${isCheapest ? 'mt-7' : 'mt-1'}`}>
                        <div className="w-12 h-12 rounded-xl bg-[#F8FAFC] border border-[#E0EDE8] flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                          <img src={logo} alt={item.courierServiceName} className="max-w-[30px] max-h-[30px] object-contain" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[14.5px] font-bold text-[#0F172A] block truncate">{item.courierServiceName}</span>
                          <div className="flex items-center gap-1.5 flex-wrap mt-1">
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-[3px] rounded-full ${
                                isAir ? 'bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE]' : 'bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]'
                              }`}
                            >
                              {isAir ? <Plane className="w-2.5 h-2.5" /> : <Truck className="w-2.5 h-2.5" />}
                              {isAir ? 'Air' : 'Surface'}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-[3px] rounded-full bg-[#FAF5FF] text-[#7C3AED] border border-[#F3E8FF]">
                              {item.orderType}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-dashed border-[#E2E8F0] flex items-end justify-between">
                        <div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-[22px] font-extrabold text-[#0F172A] tracking-tight">₹{price}</span>
                            {item.orderType === 'B2B' && (
                              <Info
                                className="w-3.5 h-3.5 text-[#00A86B] cursor-pointer shrink-0"
                                onClick={(e) => openB2BPopup(e, item.working)}
                              />
                            )}
                          </div>
                          <div className="text-[10px] text-[#94A3B8] font-semibold mt-0.5">all-inclusive</div>
                        </div>
                        {!isCheapest && delta > 0 && (
                          <span className="text-[10.5px] font-bold text-[#B45309] bg-[#FFFBEB] border border-[#FEF3C7] px-2 py-1 rounded-lg shrink-0">
                            +₹{Math.round(delta)} vs cheapest
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* ═══════════════════════ FEATURES ═══════════════════════ */}
        <section className="relative py-14 sm:py-16 md:py-24 bg-[#F8FAFC] overflow-hidden mt-8">
          <DotGrid />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-10">
            <motion.div
              className="text-center mb-10 sm:mb-12 md:mb-14"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.55, ease: EASE }}
            >
              <Eyebrow>Why Compare With Us</Eyebrow>
              <h2 className="mt-5 text-[24px] sm:text-[28px] md:text-[36px] font-bold text-[#0F172A] leading-[1.2] tracking-tight">
                Transparent Pricing, Every Time
              </h2>
              <p className="mt-3 text-[13.5px] sm:text-[15px] text-[#64748B] max-w-[520px] mx-auto leading-relaxed px-2">
                No hidden surcharges, no surprise COD fees — just real, all-inclusive courier rates you can trust.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {[
                { icon: Zap, title: 'Instant Rates', desc: 'Live pricing pulled directly from 25+ courier networks in real time.' },
                { icon: ShieldCheck, title: 'All-Inclusive', desc: 'Freight, fuel surcharge, COD fee and GST — all baked into one final number.' },
                { icon: Truck, title: 'Air & Surface', desc: 'Compare both express air and economical surface mode side-by-side.' },
                { icon: BadgeIndianRupee, title: 'Best Rate First', desc: 'Results always sorted cheapest-to-costliest, so the best deal is one glance away.' },
              ].map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.5, delay: i * 0.08, ease: EASE }}
                  className="bg-white rounded-2xl p-5 sm:p-6 md:p-7 border border-slate-100 hover:border-[#00A86B]/30 hover:shadow-xl hover:shadow-[#00A86B]/5 transition-all duration-300"
                >
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#F0FDF4] flex items-center justify-center mb-3.5 sm:mb-4">
                    <feature.icon className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-[#00A86B]" strokeWidth={1.75} />
                  </div>
                  <h4 className="text-[14px] sm:text-[15px] font-bold text-[#0F172A] mb-1.5">{feature.title}</h4>
                  <p className="text-[12.5px] sm:text-[13px] text-[#64748B] leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════ TERMS ═══════════════════════ */}
        <section className="relative px-4 sm:px-6 md:px-10 py-12 sm:py-16 md:py-20 max-w-5xl mx-auto">
          <div className="bg-[#F8FAFC] rounded-[20px] sm:rounded-[24px] border border-[#E0EDE8] p-5 sm:p-7 md:p-10">
            <h3 className="text-[15px] sm:text-[16px] md:text-[18px] font-bold text-[#0F172A] mb-4 sm:mb-5">Important Terms</h3>
            <ol className="list-decimal list-inside text-[12px] sm:text-[12.5px] text-[#5F5E5A] space-y-2.5 leading-relaxed">
              {IMPORTANT_TERMS.map((term, i) => (
                <li key={i}>{term}</li>
              ))}
            </ol>
          </div>
        </section>
      </main>

      <Footer />

      {/* B2B breakdown popup */}
      <AnimatePresence>
        {b2bPopup && (
          <>
            <div className="fixed inset-0 z-[998]" onClick={() => setB2bPopup(null)} />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="fixed z-[999] bg-white border border-[#E2E8F0] shadow-xl rounded-xl p-4 text-[12px] w-[236px]"
              style={{ top: b2bPopup.top, left: b2bPopup.left }}
            >
              {([
                ['Freight', b2bPopup.working.freight],
                ['Docket Charges', b2bPopup.working.docket_charges],
                ['Pickup Charges', b2bPopup.working.pickup_charge],
                ['Handling Charges', b2bPopup.working.handling_charge],
                ['Appointment Charges', b2bPopup.working.appointment_charge],
                ['COD Charges', b2bPopup.working.cod_charges],
                ['ROV', b2bPopup.working.rov],
                ['FSC', b2bPopup.working.fsc],
                ['ODA', b2bPopup.working.oda],
                ['Green Tax', b2bPopup.working.green_tax],
                ['GST', b2bPopup.working.gst],
              ] as [string, number][]).map(([k, v]) => (
                <div key={k} className="flex justify-between py-[2px]">
                  <span className="text-[#64748B] font-semibold">{k}</span>
                  <span className="font-semibold text-[#0F172A]">₹{v}</span>
                </div>
              ))}
              <div className="border-t border-[#E2E8F0] mt-2 pt-2 flex justify-between font-bold text-[#0F172A]">
                <span>Total</span>
                <span>₹{b2bPopup.working.grand_total}</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        .qp-cta-calc { transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease; }
        .qp-cta-calc:hover { transform: translateY(-2px); box-shadow: 0 6px 22px rgba(0, 168, 107, 0.48) !important; filter: brightness(1.06); }
        .qp-cta-calc:active { transform: translateY(0); }
      `}</style>
    </div>
  );
}
