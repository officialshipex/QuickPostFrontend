import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, Plane, Info, X, Loader2, Send, Star, MapPin, Building2, ChevronsRight } from 'lucide-react';
import { apiClient } from '../../../services/apiClient';
import { TableLoader } from '../../ui/TableLoader';
import { NetworkError } from '../../ui/NetworkError';
import noCourierImg from '../../../assets/no-courier.jpg';

const TXT = {
  label: 'text-[12px] font-semibold',
  value: 'text-[12px] font-normal',
};

// Substring-based logo lookup (matches old UI getCarrierLogo logic)
const getLogoForCourier = (serviceName: string): string => {
  const n = (serviceName || '').toLowerCase();
  if (n.includes('delhivery'))  return '/brands/delhivery.png';
  if (n.includes('bluedart'))   return '/brands/bluedart.png';
  if (n.includes('shadowfax'))  return '/brands/shadowfax.png';
  if (n.includes('xpressbees')) return '/brands/xpressbees.png';
  if (n.includes('shiprocket')) return '/brands/shiprocket.jpg';
  if (n.includes('shree'))      return '/brands/shree_maruti.jpg';
  if (n.includes('dtdc'))       return '/brands/dtdc.png';
  if (n.includes('ekart'))      return '/brands/ekart.png';
  if (n.includes('ecom'))       return '/brands/ecom_express.png';
  if (n.includes('nimbus'))     return '/brands/nimbuspost.png';
  return '';
};

// Extract chargeable weight: prefer digit in service name, else applicableWeight
const getChargeableWeight = (serviceName: string, applicableWeight: number): string => {
  const n = Number(serviceName?.match(/\d+/)?.[0]);
  return `${n > 0 ? n : (applicableWeight || 0)} kg`;
};

const formatPickupDate = (date: string | null): string => {
  if (!date) return '—';
  const d = new Date(date);
  const now = new Date();
  const tomorrow = new Date(); tomorrow.setDate(now.getDate() + 1);
  if (d.toDateString() === now.toDateString()) return 'Today';
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const STATE_CODES: Record<string, string> = {
  'andhra pradesh': 'AP', 'arunachal pradesh': 'AR', 'assam': 'AS', 'bihar': 'BR', 'chhattisgarh': 'CG', 'goa': 'GA', 'gujarat': 'GJ',
  'haryana': 'HR', 'himachal pradesh': 'HP', 'jharkhand': 'JH', 'karnataka': 'KA', 'kerala': 'KL', 'madhya pradesh': 'MP',
  'maharashtra': 'MH', 'manipur': 'MN', 'meghalaya': 'ML', 'mizoram': 'MZ', 'nagaland': 'NL', 'odisha': 'OD', 'orissa': 'OD',
  'punjab': 'PB', 'rajasthan': 'RJ', 'sikkim': 'SK', 'tamil nadu': 'TN', 'telangana': 'TS', 'tripura': 'TR', 'uttar pradesh': 'UP',
  'uttarakhand': 'UK', 'west bengal': 'WB', 'delhi': 'DL', 'new delhi': 'DL', 'jammu and kashmir': 'JK', 'jammu & kashmir': 'JK',
  'ladakh': 'LA', 'puducherry': 'PY', 'pondicherry': 'PY', 'chandigarh': 'CH', 'andaman and nicobar islands': 'AN',
  'dadra and nagar haveli and daman and diu': 'DN', 'lakshadweep': 'LD',
};
/** "Maharashtra" → "MH" (falls back to the first 2 letters of an unknown state). */
const stateCode = (state?: string) => {
  const s = (state || '').trim().toLowerCase();
  if (!s) return '';
  return STATE_CODES[s] || (s.length <= 3 ? s.toUpperCase() : s.slice(0, 2).toUpperCase());
};

const formatDeliveryDate = (date: string | null): string =>
  date ? new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

interface RateItem {
  _id: string;
  courierServiceName: string;
  courierType: string;
  provider: string;
  courier: string;
  pickupDate: string | null;
  estimatedDeliveryDate: string | null;
  isRecommended: boolean;
  forward: { charges: number; gst: number; finalCharges: number };
  cod: number;
  // Cargo (B2B) only — the rate engine's full working, sent back as-is when booking
  working?: B2BWorking;
  serviceId?: string | number | null;
  modeId?: string | number | null;
}

/** One B2B rate's computation, as returned by GET /b2b/shipNow/:id (rates[].working). */
interface B2BWorking {
  zone?: string;
  billable_weight?: number;
  rate?: number;
  freight?: number;
  docket_charges?: number;
  pickup_charge?: number;
  handling_charge?: number;
  appointment_charge?: number;
  cod_charges?: number;
  rov?: number;
  fsc?: number;
  fsc_percent?: number;
  oda?: number;
  green_tax?: number;
  gst?: number;
  grand_total?: number;
}

/** Price breakup rows of a B2B rate (same rows as ShipexFrontend's B2B courier selection). */
const b2bBreakupRows = (w: B2BWorking = {}): [string, string][] => [
  ['Zone', w.zone || '—'],
  ['Chargeable Weight', `${w.billable_weight || 0} kg`],
  ['Freight / Kg', `₹${Number(w.rate ?? 0).toFixed(2)}`],
  ['Freight Charges', `₹${Number(w.freight || 0).toFixed(2)}`],
  ['Docket Charges', `₹${Number(w.docket_charges || 0).toFixed(2)}`],
  ['Pickup Charges', `₹${Number(w.pickup_charge || 0).toFixed(2)}`],
  ['Handling Charges', `₹${Number(w.handling_charge || 0).toFixed(2)}`],
  ['Appointment Charges', `₹${Number(w.appointment_charge || 0).toFixed(2)}`],
  ['COD Charges', `₹${Number(w.cod_charges || 0).toFixed(2)}`],
  ['ROV', `₹${Number(w.rov || 0).toFixed(2)}`],
  [w.fsc_percent != null ? `FSC (${w.fsc_percent}%)` : 'FSC', `₹${Number(w.fsc || 0).toFixed(2)}`],
  ['ODA', `₹${Number(w.oda || 0).toFixed(2)}`],
  ['Green Tax', `₹${Number(w.green_tax || 0).toFixed(2)}`],
  ['GST', `₹${Number(w.gst || 0).toFixed(2)}`],
];

/** GET /b2b/shipNow/:id rate → the row shape this modal renders. */
const fromB2BRate = (r: any): RateItem => ({
  _id: r.courierServiceName,
  courierServiceName: r.courierServiceName,
  courierType: r.mode_name === 'air' ? 'Domestic (Air)' : 'Domestic (Surface)',
  provider: r.provider || '',
  courier: r.courier || '',
  pickupDate: null,
  estimatedDeliveryDate: r.estimatedDeliveryDate || null,
  isRecommended: false,
  forward: {
    charges: Number(r.working?.freight || 0),
    gst: Number(r.working?.gst || 0),
    finalCharges: Number(r.working?.grand_total || 0),
  },
  cod: Number(r.working?.cod_charges || 0),
  working: r.working || {},
  serviceId: r.serviceId ?? null,
  modeId: r.modeId ?? null,
});

interface ShipOrderModalProps {
  order: any;
  onClose: () => void;
  onShipped?: () => void;
  /** Cargo (B2B) order — rates and booking go through the backend's /b2b namespace. */
  cargo?: boolean;
}

type TabKey = 'Recommended' | 'Surface' | 'Air' | 'All';
const TABS: TabKey[] = ['Recommended', 'Surface', 'Air', 'All'];
const MOBILE_TABS: TabKey[] = ['All', 'Surface', 'Air'];

/** Empty courier list — no courier serves the route at all, or the selected tab (Air / Surface) has none. */
function NoCourierState({ compact = false, tab }: { compact?: boolean; tab?: string }) {
  const title = tab ? `No ${tab.toLowerCase()} couriers available` : 'No courier service available';
  const body = tab ? '' : 'None of our courier partners serve this pickup and delivery pincode right now. Try a different pickup address, or check the delivery pincode.';
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'py-8 px-4' : 'py-8 px-6'}`}>
      <img
        src={noCourierImg}
        alt=""
        aria-hidden="true"
        draggable={false}
        className={`${compact ? 'w-[240px]' : 'w-[300px]'} h-auto select-none mix-blend-multiply`}
      />
      <h3 className="mt-4 text-[15px] font-bold text-[#0F172A]">{title}</h3>
      {body && <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#64748B] max-w-[340px]">{body}</p>}
    </div>
  );
}

export function ShipOrderModal({ order, onClose, onShipped, cargo = false }: ShipOrderModalProps) {
  const [loading, setLoading] = useState(true);
  const [rates, setRates] = useState<RateItem[]>([]);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [shippingId, setShippingId] = useState<string | null>(null);
  // Both carry the trigger's bounding rect so the tooltip can be portaled to
  // document.body with position:fixed — it previously rendered position:absolute
  // inside the scrollable rate list, which clipped/forced a scrollbar whenever a
  // tooltip near the middle of a long list didn't fit within the visible viewport.
  const [hoveredInfo, setHoveredInfo] = useState<{ id: string; rect: DOMRect } | null>(null);
  // Sidebar tooltips (Pickup From / Deliver To / Applicable Weight) — same portal pattern
  // as the courier-list tooltips, since the plain group-hover version got clipped by the
  // sidebar's overflow-y-auto and the modal's overflow-hidden.
  const [hoveredSidebar, setHoveredSidebar] = useState<{ id: 'pickup' | 'delivery' | 'weight'; rect: DOMRect } | null>(null);
  const [error, setError] = useState('');
  const [courierNetworkError, setCourierNetworkError] = useState(false);
  const [selectedCourier, setSelectedCourier] = useState<RateItem | null>(null);
  // Mobile detail sheets (address / weight / price breakup) — bottom sheets instead of
  // inline popovers, so nothing gets clipped by the scrolling list on small screens.
  const [mobileSheet, setMobileSheet] = useState<{ type: 'pickup' | 'delivery' | 'weight' | 'price'; item?: RateItem } | null>(null);
  const [isMobile] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches);
  // Mobile has no Recommended filter (the recommended courier is pinned to the top instead), so it opens on All.
  const [activeTab, setActiveTab] = useState<TabKey>(isMobile ? 'All' : 'Recommended');

  const orderId = order?._id || order?.orderId;

  useEffect(() => {
    let cancelled = false;
    const fetchRates = async () => {
      setLoading(true); setError('');
      try {
        if (cargo) {
          // B2B: rates from the seller's active B2B rate cards, already checked for serviceability
          const res = await apiClient.get(`/b2b/shipNow/${orderId}`);
          if (!cancelled) {
            setOrderDetails(res.data?.order || null);
            setRates((res.data?.rates || []).map(fromB2BRate));
          }
        } else {
          const res = await apiClient.get(`/order/ship/${orderId}`);
          if (!cancelled) {
            setOrderDetails(res.data?.order || null);
            setRates(res.data?.updatedRates || []);
          }
        }
      } catch (err: any) {
        if (!cancelled) setError(cargo && (err?.response?.data?.error || err?.response?.data?.message)
          ? `Failed to load courier options: ${err.response.data.error || err.response.data.message}`
          : 'Failed to load courier options. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (orderId) fetchRates();
    return () => { cancelled = true; };
  }, [orderId, cargo]);

  const handleShip = async (item: RateItem) => {
    const { provider, forward, courierServiceName, courier, estimatedDeliveryDate } = item;
    const safeProvider = provider.replace(/\s+/g, '');
    const charges = parseFloat(String(forward?.finalCharges));
    if (!orderId || !provider || !courierServiceName || isNaN(charges) || charges <= 0) {
      setError('Missing or invalid fields: id, provider, courierServiceName, or charges must be > 0');
      return;
    }
    setShippingId(item.courierServiceName); setError(''); setCourierNetworkError(false);
    try {
      if (cargo) {
        // Same body ShipexFrontend's B2B courier selection posts; the backend re-prices the order and
        // checks the wallet before booking, so the rate shown here is never trusted blindly.
        const res = await apiClient.post(`/b2b/${safeProvider}/createShipment`, {
          id: orderId,
          provider,
          courierServiceName,
          courier,
          estimatedDeliveryDate,
          finalCharges: item.working?.grand_total,
          rateBreakup: item.working,
          serviceId: item.serviceId,
          modeId: item.modeId,
        });
        if (res.data?.error) throw { response: { status: 400, data: { message: res.data.error } } };
      } else {
        await apiClient.post(`/${safeProvider}/createShipment`, {
          id: orderId,
          provider,
          finalCharges: forward.finalCharges,
          courierServiceName,
          courier,
          estimatedDeliveryDate,
          priceBreakup: { freight: forward.charges, cod: item.cod, gst: forward.gst, total: forward.finalCharges },
        });
      }
      onShipped?.();
      onClose();
    } catch (err: any) {
      const status = err?.response?.status;
      // A B2B provider without a booking route answers 404 — say so instead of a generic failure.
      if (cargo && status === 404) {
        setError(`Booking through ${provider} is not available for Cargo yet. Please choose another courier.`);
        return;
      }
      // No response (network drop) or a 5xx from the courier's own API — not a validation
      // problem on our end, so show the friendly "courier network issue" panel instead of
      // the raw error trace. The B2B booking routes answer every failure (insufficient wallet
      // balance, missing e-way bill, …) as a 500 with a readable message, so Cargo shows that message.
      const cargoReason = cargo ? err?.response?.data?.message : '';
      if (!err?.response || (status && status >= 500 && !cargoReason)) {
        setCourierNetworkError(true);
      } else {
        setError(
          err?.response?.data?.error?.message ||
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          'Something went wrong'
        );
      }
    } finally {
      setShippingId(null);
    }
  };

  // Prefer richer API response data; fall back to flat order object
  const pickup  = orderDetails?.pickupAddress;
  const delivery = orderDetails?.receiverAddress;
  const pkg     = orderDetails?.packageDetails;
  // Cargo (B2B) weights: boxes × weight per box, volumetric per box (L×W×H / 5000) × boxes
  const b2bPkg  = orderDetails?.B2BPackageDetails;
  const b2bRows: any[] = Array.isArray(b2bPkg?.packages) ? b2bPkg.packages : [];
  const b2bBoxes = b2bRows.reduce((s, p) => s + (Number(p.noOfBox) || 0), 0);
  const b2bDead  = b2bRows.reduce((s, p) => s + (Number(p.noOfBox) || 0) * (Number(p.weightPerBox) || 0), 0);
  const b2bVol   = Number(b2bPkg?.volumetricWeight) || b2bRows.reduce((s, p) =>
    s + (Number(p.noOfBox) || 0) * ((Number(p.length) || 0) * (Number(p.width) || 0) * (Number(p.height) || 0)) / 5000, 0);

  const pickupCity    = pickup?.city    || order?.pickupCity    || '—';
  const pickupState   = pickup?.state   || order?.pickupState   || '';
  const pickupPin     = pickup?.pinCode || order?.pickupPinCode || '—';
  const deliveryCity  = delivery?.city    || order?.customerCity    || '—';
  const deliveryState = delivery?.state   || order?.customerState   || '';
  const deliveryPin   = delivery?.pinCode || order?.customerPinCode || '—';
  const orderValue    = orderDetails?.paymentDetails?.amount ?? order?.payment ?? order?.orderValue ?? 0;
  const paymentMethod = orderDetails?.paymentDetails?.method || order?.paymentType || '';
  const applicableWeight = cargo
    ? Number(Number(b2bPkg?.applicableWeight ?? order?.pkg?.total ?? 0).toFixed(2))
    : Number(pkg?.applicableWeight ?? order?.weight ?? 0);

  // B2B: the rate engine's own chargeable weight; B2C: the service's weight slab or the applicable weight
  const chargeableFor = (item: RateItem) => cargo
    ? `${Number(item.working?.billable_weight ?? applicableWeight)} kg`
    : getChargeableWeight(item.courierServiceName, applicableWeight);

  const volW = pkg?.volumetricWeight;
  const volWeightKg = volW
    ? Number(((volW.length || 0) * (volW.width || 0) * (volW.height || 0)) / 5000).toFixed(2)
    : '—';

  // The cheapest rate overall is "Recommended" — computed from price, not the API's
  // isRecommended flag, so the tag and the Recommended tab always agree with each other.
  const cheapestServiceName = useMemo(() => {
    if (rates.length === 0) return null;
    return rates.reduce((min, r) =>
      Number(r.forward?.finalCharges ?? Infinity) < Number(min.forward?.finalCharges ?? Infinity) ? r : min
    ).courierServiceName;
  }, [rates]);

  // ── Tab-filtered rate list — each tab shows a genuinely distinct slice of `rates`. ──
  const tabFilteredRates = useMemo(() => {
    if (activeTab === 'Recommended') return rates.filter(r => r.courierServiceName === cheapestServiceName);
    if (activeTab === 'Surface') return rates.filter(r => (r.courierType || '').toLowerCase().includes('surface'));
    if (activeTab === 'Air') return rates.filter(r => (r.courierType || '').toLowerCase().includes('air'));
    return rates;
  }, [rates, activeTab, cheapestServiceName]);

  // Mobile list: recommended (cheapest) pinned first, the rest by price.
  const mobileRates = useMemo(() => [...tabFilteredRates].sort((a, b) => {
    if (a.courierServiceName === cheapestServiceName) return -1;
    if (b.courierServiceName === cheapestServiceName) return 1;
    return Number(a.forward?.finalCharges ?? Infinity) - Number(b.forward?.finalCharges ?? Infinity);
  }), [tabFilteredRates, cheapestServiceName]);

  const tabCounts = useMemo<Record<TabKey, number>>(() => ({
    Recommended: rates.filter(r => r.courierServiceName === cheapestServiceName).length,
    Surface: rates.filter(r => (r.courierType || '').toLowerCase().includes('surface')).length,
    Air: rates.filter(r => (r.courierType || '').toLowerCase().includes('air')).length,
    All: rates.length,
  }), [rates, cheapestServiceName]);

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm z-[200] flex items-center justify-center p-0 md:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={isMobile ? { opacity: 1, y: '100%' } : { opacity: 0, scale: 0.96, y: 16 }}
          animate={isMobile ? { opacity: 1, y: 0 } : { opacity: 1, scale: 1, y: 0 }}
          exit={isMobile ? { opacity: 1, y: '100%' } : { opacity: 0, scale: 0.96, y: 12 }}
          transition={isMobile ? { duration: 0.3, ease: [0.4, 0, 0.2, 1] } : { type: 'spring', stiffness: 380, damping: 32 }}
          className="w-full max-w-7xl h-full md:h-[85vh] max-h-full md:max-h-[85vh] bg-white rounded-none md:rounded-[16px] shadow-[0_40px_80px_-16px_rgba(0,0,0,0.25)] overflow-hidden flex flex-col md:flex-row border-0 md:border md:border-[#E2E8F0]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ══════════════════════ Left sidebar — Order Details (desktop) ══════════════════════ */}
          <div className="hidden md:flex md:w-[240px] shrink-0 bg-[#F8FAFC] border-r border-[#E2E8F0] flex-col p-5 gap-5 overflow-y-auto">
            <h3 className="text-[15px] font-bold text-[#0F172A]">Order Details</h3>

            <div>
              <p className="text-[11px] font-medium text-[#94A3B8] mb-1">Pickup From</p>
              <div
                className="relative inline-block"
                onMouseEnter={(e) => setHoveredSidebar({ id: 'pickup', rect: e.currentTarget.getBoundingClientRect() })}
                onMouseLeave={() => setHoveredSidebar(null)}
              >
                <p className="text-[13px] font-semibold text-[#0F172A] border-b border-dashed border-[#CBD5E1] cursor-default">
                  {pickupPin}{pickupState ? `, ${pickupState}` : ''}
                </p>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-medium text-[#94A3B8] mb-1">Deliver To</p>
              <div
                className="relative inline-block"
                onMouseEnter={(e) => setHoveredSidebar({ id: 'delivery', rect: e.currentTarget.getBoundingClientRect() })}
                onMouseLeave={() => setHoveredSidebar(null)}
              >
                <p className="text-[13px] font-semibold text-[#0F172A] border-b border-dashed border-[#CBD5E1] cursor-default">
                  {deliveryPin}{deliveryState ? `, ${deliveryState}` : ''}
                </p>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-medium text-[#94A3B8] mb-1">Order Value</p>
              <p className="text-[13px] font-semibold text-[#0F172A]">₹{Number(orderValue).toFixed(2)}</p>
            </div>

            <div>
              <p className="text-[11px] font-medium text-[#94A3B8] mb-1">Payment Mode</p>
              <p className="text-[13px] font-semibold text-[#0F172A]">{paymentMethod || '—'}</p>
            </div>

            <div>
              <p className="text-[11px] font-medium text-[#94A3B8] mb-1">Applicable Weight (in Kg)</p>
              <div
                className="relative inline-block"
                onMouseEnter={(e) => setHoveredSidebar({ id: 'weight', rect: e.currentTarget.getBoundingClientRect() })}
                onMouseLeave={() => setHoveredSidebar(null)}
              >
                <p className="text-[13px] font-semibold text-[#0F172A] border-b border-dashed border-[#CBD5E1] cursor-default">
                  {applicableWeight} Kg
                </p>
              </div>
            </div>
          </div>

          {/* ══════════════════════ Right panel ══════════════════════ */}
          <div className="flex-1 min-w-0 flex flex-col min-h-0">

            {/* ── Header ── */}
            <div className="px-4 md:px-6 py-3 md:py-4 bg-white border-b border-[#E2E8F0] flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-[15px] md:text-[17px] font-bold text-[#0F172A]">Select Courier Partner</h2>
                <p className="md:hidden mt-0.5 text-[12px] text-[#64748B]">
                  Order <span className="font-semibold text-[#0F172A]">#{orderDetails?.orderId || order?.orderId || '—'}</span>
                </p>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-[#64748B] hover:bg-[#F1F5F9] transition-colors shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ── Tabs ── */}
            <div className="hidden md:flex px-4 md:px-6 border-b border-[#E2E8F0] items-center gap-6 shrink-0 overflow-x-auto no-scrollbar">
              {TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative py-3 text-[13px] font-semibold whitespace-nowrap transition-colors ${activeTab === tab ? 'text-[#6D28D9]' : 'text-[#64748B] hover:text-[#0F172A]'}`}
                >
                  {tab}
                  {activeTab === tab && (
                    <motion.div layoutId="ship-modal-tab-underline" className="absolute left-0 right-0 -bottom-px h-[2px] bg-[#6D28D9] rounded-full" />
                  )}
                </button>
              ))}
            </div>

            {/* ── Mobile: order summary strip + filter chips ── */}
            <div className="md:hidden shrink-0 bg-white border-b border-[#E2E8F0]">
              <div className="px-4 pt-3 pb-3">
                {/* Route + order facts — one compact card; PINs and weight open their detail sheets */}
                <div className="rounded-2xl border border-[#E2E8F0] bg-white">
                  <div className="flex items-center gap-2 px-3.5 py-2.5">
                    <button type="button" onClick={() => setMobileSheet({ type: 'pickup' })} className="flex items-center gap-1.5 min-w-0 shrink-0 active:opacity-70" aria-label="View pickup address">
                      <Building2 className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
                      <span className="text-[13px] font-semibold text-[#0F172A] tabular-nums border-b border-dashed border-[#CBD5E1]">{pickupPin}</span>
                      {stateCode(pickupState) && <span className="text-[10.5px] text-[#94A3B8]">({stateCode(pickupState)})</span>}
                    </button>
                    <span className="flex-1 flex items-center gap-1 min-w-[24px] text-[#CBD5E1]">
                      <span className="flex-1 border-t border-dashed border-[#CBD5E1]" />
                      <ChevronsRight className="w-3.5 h-3.5 shrink-0 text-[#94A3B8]" />
                      <span className="flex-1 border-t border-dashed border-[#CBD5E1]" />
                    </span>
                    <button type="button" onClick={() => setMobileSheet({ type: 'delivery' })} className="flex items-center gap-1.5 min-w-0 shrink-0 active:opacity-70" aria-label="View delivery address">
                      <MapPin className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
                      <span className="text-[13px] font-semibold text-[#0F172A] tabular-nums border-b border-dashed border-[#CBD5E1]">{deliveryPin}</span>
                      {stateCode(deliveryState) && <span className="text-[10.5px] text-[#94A3B8]">({stateCode(deliveryState)})</span>}
                    </button>
                  </div>
                  <div className="grid grid-cols-3 border-t border-[#F1F5F9] divide-x divide-[#F1F5F9] text-center">
                    <button type="button" onClick={() => setMobileSheet({ type: 'weight' })} className="py-2 active:bg-[#F8FAFC] rounded-bl-2xl" aria-label="View weight details">
                      <span className="text-[12px] font-medium text-[#334155] border-b border-dashed border-[#CBD5E1]">{applicableWeight} kg</span>
                    </button>
                    <span className="py-2 text-[12px] font-medium text-[#334155] tabular-nums">₹ {Number(orderValue).toFixed(1)}</span>
                    <span className="py-2 text-[12px] font-medium text-[#334155] capitalize">{paymentMethod ? (paymentMethod.toLowerCase() === 'cod' ? 'COD' : paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1).toLowerCase()) : '—'}</span>
                  </div>
                </div>
              </div>
              {/* Filter chips */}
              <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
                {MOBILE_TABS.map(tab => {
                  const active = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`shrink-0 h-8 px-3.5 rounded-full text-[12.5px] font-semibold border transition-colors flex items-center gap-1.5 ${active ? 'bg-[#0F172A] border-[#0F172A] text-white' : 'bg-white border-[#E2E8F0] text-[#475569]'}`}
                    >
                      {tab}
                      {!loading && <span className={`text-[11px] ${active ? 'text-white/70' : 'text-[#94A3B8]'}`}>{tabCounts[tab]}</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Error banner ── */}
            {error && (
              <div className="mx-3 md:mx-6 mt-3 px-4 py-2 bg-[#FEF2F2] border border-[#FECACA] rounded-lg shrink-0">
                <p className="text-[12px] text-[#EF4444] font-medium">{error}</p>
              </div>
            )}

            {/* ── Recommended banner (desktop) ── */}
            {activeTab === 'Recommended' && tabFilteredRates.length > 0 && (
              <div className="hidden md:flex mx-6 mt-4 items-center gap-2.5 px-4 py-2.5 bg-[#F0FDF4] border border-[#BBF7D0] rounded-[10px] shrink-0">
                <Star className="w-4 h-4 text-[#16A34A] shrink-0" />
                <p className={`${TXT.value} text-[#166534]`}>
                  <span className="font-bold">Lowest Price courier :</span> The cheapest available option for this shipment, based on the current rate list.
                </p>
              </div>
            )}

            {!loading && (
              <p className="hidden md:block mx-6 mt-3 text-[12px] font-medium text-[#94A3B8] shrink-0">
                {tabFilteredRates.length} {tabFilteredRates.length === 1 ? 'Courier' : 'Couriers'} Found
              </p>
            )}

            {/* ── Courier list (desktop table) ── */}
            <div className="hidden md:flex relative flex-1 min-h-0 mx-6 mt-3 mb-5 bg-white border border-[#E2E8F0] rounded-[12px] overflow-hidden flex-col">
              {courierNetworkError && (
                <NetworkError onDone={() => setCourierNetworkError(false)} />
              )}
              <div className="grid grid-cols-[1.7fr_1fr_1fr_1fr_1fr_0.9fr] gap-2 px-5 py-3 bg-[#F8FAFC] border-b border-[#E2E8F0] shrink-0">
                <span className={`${TXT.label} text-[#64748B]`}>Courier Partner</span>
                <span className={`${TXT.label} text-[#64748B] text-center`}>Expected Pickup</span>
                <span className={`${TXT.label} text-[#64748B] text-center`}>Estimated Delivery</span>
                <span className={`${TXT.label} text-[#64748B] text-center`}>Chargeable Weight</span>
                <span className={`${TXT.label} text-[#64748B] text-center`}>Charges</span>
                <span className={`${TXT.label} text-[#64748B] text-center`}>Action</span>
              </div>

              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="relative h-48">
                    <TableLoader />
                  </div>
                ) : tabFilteredRates.length === 0 ? (
                  <NoCourierState tab={rates.length === 0 ? undefined : activeTab} />
                ) : (
                  <AnimatePresence initial={false}>
                    {tabFilteredRates.map((item, i) => {
                      const logo = getLogoForCourier(item.courierServiceName);
                      const isAir = item.courierType === 'Domestic (Air)';
                      const chargeableWeight = chargeableFor(item);
                      const isCheapest = item.courierServiceName === cheapestServiceName;
                      return (
                        <motion.div
                          key={item.courierServiceName}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: Math.min(i * 0.04, 0.3) }}
                          className={`relative grid grid-cols-[1.7fr_1fr_1fr_1fr_1fr_0.9fr] gap-2 items-center px-5 py-4 border-b last:border-b-0 transition-colors ${isCheapest ? 'bg-[#F0FDF4] border-[#BBF7D0] border-l-4 border-l-[#00A86B] pl-4' : 'border-[#F1F5F9] hover:bg-[#F8FAFC]'}`}
                        >
                          {/* Courier logo + name */}
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-[8px] border border-[#E2E8F0] bg-white flex items-center justify-center shrink-0 overflow-hidden">
                              {logo ? (
                                <img src={logo} alt={item.courierServiceName} className="max-w-full max-h-full object-contain"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                              ) : (
                                <Truck className="w-4 h-4 text-[#94A3B8]" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className={`${TXT.label} text-[#0F172A] truncate`}>{item.courierServiceName}</p>
                                {isCheapest && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#00A86B] text-white text-[10px] font-bold shrink-0">
                                    <Star className="w-3 h-3 fill-white stroke-white" /> Recommended
                                  </span>
                                )}
                              </div>
                              <p className={`${TXT.value} text-[#94A3B8] truncate flex items-center gap-1`}>
                                {isAir ? <Plane className="w-3 h-3" /> : <Truck className="w-3 h-3" />}
                                {item.courierType}
                              </p>
                            </div>
                          </div>

                          {/* Dates */}
                          <p className={`${TXT.value} text-center text-[#475569]`}>{formatPickupDate(item.pickupDate)}</p>
                          <p className={`${TXT.value} text-center text-[#475569]`}>{formatDeliveryDate(item.estimatedDeliveryDate)}</p>

                          {/* Chargeable weight — same for every row it's derived from the
                              order's own package, so no per-row detail popup (see sidebar) */}
                          <div className="flex justify-center">
                            <span className={`${TXT.value} text-[#475569]`}>
                              {chargeableWeight}
                            </span>
                          </div>

                          {/* Charges + price breakup hover */}
                          <div className="flex items-center justify-center gap-1.5 relative">
                            <span className={`${TXT.label} text-[#0F172A]`}>₹{Number(item.forward?.finalCharges || 0).toFixed(2)}</span>
                            <div
                              className="relative"
                              onMouseEnter={(e) => setHoveredInfo({ id: String(i), rect: e.currentTarget.getBoundingClientRect() })}
                              onMouseLeave={() => setHoveredInfo(null)}
                            >
                              <Info className="w-3.5 h-3.5 text-[#00A86B] cursor-help" />
                            </div>
                          </div>

                          {/* Ship Now button with icon */}
                          <div className="flex justify-center">
                            <button
                              onClick={() => handleShip(item)}
                              disabled={shippingId !== null}
                              className={`h-8 px-4 rounded-full bg-[#00A86B] text-white ${TXT.label} transition-colors shadow-sm flex items-center justify-center gap-1.5 min-w-[96px] ${shippingId === item.courierServiceName ? 'opacity-60 cursor-not-allowed' : shippingId !== null ? 'cursor-not-allowed pointer-events-none' : 'hover:bg-[#009B63]'}`}
                            >
                              {shippingId === item.courierServiceName
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : <><Send className="w-3 h-3" />Ship Now</>
                              }
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
              </div>
            </div>

            {/* ── Price hover tooltip — portaled to document.body with fixed
                 positioning (computed from the trigger's rect) so it escapes the
                 rate list's overflow-y-auto clipping instead of getting cut off or
                 forcing a scrollbar when it doesn't fit within the visible area.
                 (There's no per-row weight tooltip: chargeable weight is a property
                 of the order's own package, not the courier, so it's identical on
                 every row — the one weight breakdown lives once in the sidebar.) ── */}
            {hoveredInfo && (() => {
              const item = tabFilteredRates[Number(hoveredInfo.id)];
              if (!item) return null;
              const rect = hoveredInfo.rect;
              const TIP_H = cargo ? 380 : 140;
              const TIP_W = cargo ? 240 : 208;
              const showBelow = rect.top < TIP_H + 16;
              const rows: [string, string][] = cargo
                ? b2bBreakupRows(item.working)
                : [
                    ['Freight', `₹${Number(item.forward?.charges || 0).toFixed(2)}`],
                    ['COD', `₹${Number(item.cod || 0).toFixed(2)}`],
                    ['GST', `₹${Number(item.forward?.gst || 0).toFixed(2)}`],
                  ];
              return createPortal(
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.96 }}
                  transition={{ duration: 0.12 }}
                  className="fixed z-[300] bg-[#0F172A] text-white rounded-[10px] p-3 shadow-xl pointer-events-none"
                  style={{
                    width: TIP_W,
                    top: showBelow ? rect.bottom + 8 : undefined,
                    bottom: showBelow ? undefined : window.innerHeight - rect.top + 8,
                    left: Math.min(Math.max(rect.right - TIP_W, 8), window.innerWidth - TIP_W - 8),
                  }}
                >
                  <p className={`${TXT.label} text-slate-300 mb-1.5 border-b border-slate-700 pb-1.5`}>Price Breakup</p>
                  {rows.map(([label, val]) => (
                    <div key={label} className="flex justify-between items-center py-0.5">
                      <span className={`${TXT.value} text-slate-400`}>{label}</span>
                      <span className={`${TXT.value} text-white`}>{val}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center border-t border-slate-700 mt-1 pt-1">
                    <span className={`${TXT.label} text-slate-300`}>Total</span>
                    <span className={`${TXT.label} text-[#00A86B]`}>₹{Number(item.forward?.finalCharges || 0).toFixed(2)}</span>
                  </div>
                </motion.div>,
                document.body
              );
            })()}

            {/* ── Sidebar address/weight tooltips — portaled to document.body with fixed
                 positioning so they always render fully on screen instead of being
                 clipped by the sidebar's overflow-y-auto or the modal's overflow-hidden. ── */}
            {hoveredSidebar && (() => {
              const rect = hoveredSidebar.rect;
              const WIDTH = 256;
              const left = Math.min(rect.right + 12, window.innerWidth - WIDTH - 12);
              const style = { top: rect.top + rect.height / 2, left, transform: 'translateY(-50%)' } as const;

              if (hoveredSidebar.id === 'weight' && cargo) {
                if (!b2bPkg) return null;
                return createPortal(
                  <motion.div
                    initial={{ opacity: 0, x: -4, scale: 0.96 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -4, scale: 0.96 }}
                    transition={{ duration: 0.12 }}
                    className="fixed z-[300] w-56 bg-white text-[#475569] text-[10px] p-3 rounded-lg border border-[#E2E8F0] shadow-2xl whitespace-normal leading-relaxed pointer-events-none"
                    style={style}
                  >
                    <p className="font-semibold text-[#0F172A] mb-1.5 border-b border-[#F1F5F9] pb-1">Weight Details</p>
                    <div className="space-y-1">
                      <div className="flex justify-between"><span className="text-[#94A3B8]">Boxes:</span><span className="font-semibold">{b2bBoxes}</span></div>
                      <div className="flex justify-between"><span className="text-[#94A3B8]">Dead Weight:</span><span className="font-semibold">{b2bDead.toFixed(2)} kg</span></div>
                      <div className="flex justify-between"><span className="text-[#94A3B8]">Volumetric:</span><span className="font-semibold">{b2bVol.toFixed(2)} kg</span></div>
                      <div className="flex justify-between border-t border-[#F1F5F9] pt-1"><span className="text-[#0F172A] font-semibold">Applicable:</span><span className="font-semibold text-[#00A86B]">{applicableWeight} kg</span></div>
                    </div>
                  </motion.div>,
                  document.body
                );
              }

              if (hoveredSidebar.id === 'weight') {
                if (!pkg) return null;
                return createPortal(
                  <motion.div
                    initial={{ opacity: 0, x: -4, scale: 0.96 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -4, scale: 0.96 }}
                    transition={{ duration: 0.12 }}
                    className="fixed z-[300] w-56 bg-white text-[#475569] text-[10px] p-3 rounded-lg border border-[#E2E8F0] shadow-2xl whitespace-normal leading-relaxed pointer-events-none"
                    style={style}
                  >
                    <p className="font-semibold text-[#0F172A] mb-1.5 border-b border-[#F1F5F9] pb-1">Weight Details</p>
                    <div className="space-y-1">
                      <div className="flex justify-between"><span className="text-[#94A3B8]">Dead Weight:</span><span className="font-semibold">{pkg.weight || pkg.applicableWeight} kg</span></div>
                      {volW && <>
                        <div className="flex justify-between"><span className="text-[#94A3B8]">L × W × H:</span><span className="font-semibold">{volW.length}×{volW.width}×{volW.height}</span></div>
                        <div className="flex justify-between"><span className="text-[#94A3B8]">Volumetric:</span><span className="font-semibold">{volWeightKg} kg</span></div>
                      </>}
                      <div className="flex justify-between border-t border-[#F1F5F9] pt-1"><span className="text-[#0F172A] font-semibold">Applicable:</span><span className="font-semibold text-[#00A86B]">{pkg.applicableWeight} kg</span></div>
                    </div>
                  </motion.div>,
                  document.body
                );
              }

              const addr = hoveredSidebar.id === 'pickup' ? pickup : delivery;
              if (!addr) return null;
              return createPortal(
                <motion.div
                  initial={{ opacity: 0, x: -4, scale: 0.96 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -4, scale: 0.96 }}
                  transition={{ duration: 0.12 }}
                  className="fixed z-[300] w-64 bg-white text-[#475569] text-[10px] p-3 rounded-lg border border-[#E2E8F0] shadow-2xl whitespace-normal leading-relaxed pointer-events-none"
                  style={style}
                >
                  {addr.contactName && <p className="font-semibold text-[#0F172A] mb-1">{addr.contactName}</p>}
                  {addr.address    && <p>{addr.address}</p>}
                  <p>{[addr.city, addr.state].filter(Boolean).join(', ')}{addr.pinCode ? ` - ${addr.pinCode}` : ''}</p>
                  {addr.phoneNumber && <p className="mt-1 text-[#64748B]">{addr.phoneNumber}</p>}
                </motion.div>,
                document.body
              );
            })()}

            {/* ── Courier list (mobile cards) ── */}
            <div className="md:hidden relative flex-1 min-h-0 overflow-y-auto bg-[#F8FAFC] px-3 pt-3 pb-4 space-y-2.5">
              {courierNetworkError && (
                <NetworkError onDone={() => setCourierNetworkError(false)} />
              )}
              {!loading && tabFilteredRates.length > 0 && (
                <p className="text-[11.5px] font-medium text-[#64748B] px-1 pb-1.5">
                  {tabFilteredRates.length} {tabFilteredRates.length === 1 ? 'courier' : 'couriers'} available · sorted by price
                </p>
              )}
              {loading ? (
                [0, 1, 2].map(k => (
                  <div key={k} className="bg-white rounded-xl p-4 shadow-[0_1px_2px_rgba(16,24,40,0.05)] animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#F1F5F9]" />
                      <div className="flex-1 space-y-2"><div className="h-3 w-2/3 rounded bg-[#F1F5F9]" /><div className="h-2.5 w-1/3 rounded bg-[#F1F5F9]" /></div>
                    </div>
                    <div className="h-10 mt-4 rounded-lg bg-[#F8FAFC]" />
                  </div>
                ))
              ) : tabFilteredRates.length === 0 ? (
                <NoCourierState compact tab={rates.length === 0 ? undefined : activeTab} />
              ) : (
                mobileRates.map((item) => {
                  const logo = getLogoForCourier(item.courierServiceName);
                  const isAir = item.courierType === 'Domestic (Air)';
                  const chargeableWeight = chargeableFor(item);
                  const isSelected = selectedCourier?.courierServiceName === item.courierServiceName;
                  const isCheapest = item.courierServiceName === cheapestServiceName;
                  return (
                    <div
                      key={item.courierServiceName}
                      role="radio"
                      aria-checked={isSelected}
                      tabIndex={0}
                      onClick={() => setSelectedCourier(item)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedCourier(item); } }}
                      className={`relative bg-white rounded-xl transition-shadow cursor-pointer ${isSelected ? 'ring-2 ring-[#00A86B] shadow-[0_4px_14px_-6px_rgba(0,168,107,0.35)]' : 'shadow-[0_1px_2px_rgba(16,24,40,0.05),0_1px_6px_rgba(16,24,40,0.04)]'}`}
                    >
                      {isCheapest && (
                        <span className="absolute -top-2 left-3 inline-flex items-center gap-1 h-5 px-2 rounded-full bg-[#00A86B] text-white text-[10px] font-bold">
                          <Star className="w-2.5 h-2.5 fill-white stroke-white" /> Lowest price
                        </span>
                      )}
                      <div className="p-3.5">
                        {/* Courier */}
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-white ring-1 ring-[#EEF2F6] flex items-center justify-center shrink-0 overflow-hidden">
                            {logo ? (
                              <img src={logo} alt={item.courierServiceName} className="max-w-full max-h-full object-contain p-1"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            ) : (
                              <Truck className="w-4 h-4 text-[#94A3B8]" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13.5px] font-bold text-[#0F172A] truncate">{item.courierServiceName}</p>
                            <p className="text-[11.5px] text-[#64748B] truncate flex items-center gap-1">
                              {isAir ? <Plane className="w-3 h-3" /> : <Truck className="w-3 h-3" />}
                              {item.courierType}
                            </p>
                          </div>
                          <span className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${isSelected ? 'border-[#00A86B]' : 'border-[#CBD5E1]'}`}>
                            {isSelected && <span className="w-2.5 h-2.5 rounded-full bg-[#00A86B]" />}
                          </span>
                        </div>

                        {/* Pickup / delivery / weight */}
                        <div className="grid grid-cols-3 mt-3 rounded-lg bg-[#F8FAFC] divide-x divide-[#EEF2F6]">
                          {[
                            { label: 'Pickup', value: formatPickupDate(item.pickupDate) },
                            { label: 'Delivery by', value: formatDeliveryDate(item.estimatedDeliveryDate) },
                            { label: 'Chargeable', value: chargeableWeight },
                          ].map(c => (
                            <div key={c.label} className="px-2.5 py-2 min-w-0">
                              <p className="text-[10.5px] text-[#94A3B8]">{c.label}</p>
                              <p className="text-[12px] font-semibold text-[#0F172A] truncate">{c.value}</p>
                            </div>
                          ))}
                        </div>

                        {/* Price */}
                        <div className="flex items-center justify-between mt-3">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setMobileSheet({ type: 'price', item }); }}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-[#64748B] active:text-[#0F172A]"
                          >
                            <Info className="w-3 h-3 text-[#00A86B]" /> Price breakup
                          </button>
                          <p className="text-[14.5px] font-bold text-[#0F172A] tabular-nums">₹{Number(item.forward?.finalCharges || 0).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* ── Mobile bottom bar — selected courier + Ship Now ── */}
            <div className="md:hidden shrink-0 bg-white border-t border-[#E2E8F0] px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))] flex items-center gap-3">
              <div className="flex-1 min-w-0">
                {selectedCourier ? (
                  <>
                    <p className="text-[11px] text-[#64748B] truncate">{selectedCourier.courierServiceName}</p>
                    <p className="text-[16px] font-bold text-[#0F172A] tabular-nums leading-tight">₹{Number(selectedCourier.forward?.finalCharges || 0).toFixed(2)}</p>
                  </>
                ) : (
                  <p className="text-[12.5px] text-[#64748B] leading-snug">Select a courier to continue</p>
                )}
              </div>
              <button
                onClick={() => selectedCourier && handleShip(selectedCourier)}
                disabled={!selectedCourier || shippingId !== null}
                className={`h-11 px-6 rounded-full font-bold text-[13px] text-white bg-[#00A86B] shadow-sm transition-colors flex items-center justify-center gap-2 shrink-0 ${(!selectedCourier || shippingId !== null) ? 'opacity-50 cursor-not-allowed' : 'active:bg-[#009B63]'}`}
              >
                {shippingId !== null
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Processing…</>
                  : <><Send className="w-4 h-4" />Ship Now</>
                }
              </button>
            </div>

            {/* ── Mobile detail sheets: pickup / delivery address, weight, price breakup ── */}
            <AnimatePresence>
              {mobileSheet && (
                <div className="md:hidden fixed inset-0 z-[320] flex items-end" onClick={() => setMobileSheet(null)}>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="absolute inset-0 bg-[#0F172A]/40" />
                  <motion.div
                    initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                    transition={{ duration: 0.26, ease: [0.4, 0, 0.2, 1] }}
                    className="relative w-full bg-white rounded-t-2xl px-5 pt-2 pb-[max(14px,env(safe-area-inset-bottom))]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="w-10 h-1 rounded-full bg-[#E2E8F0] mx-auto mb-2" />
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-[14px] font-bold text-[#0F172A]">
                        {mobileSheet.type === 'pickup' ? 'Pickup Address' : mobileSheet.type === 'delivery' ? 'Delivery Address' : mobileSheet.type === 'weight' ? 'Weight Details' : 'Price Breakup'}
                      </h3>
                      <button type="button" onClick={() => setMobileSheet(null)} aria-label="Close" className="w-8 h-8 rounded-full flex items-center justify-center text-[#64748B] active:bg-[#F1F5F9]">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {(mobileSheet.type === 'pickup' || mobileSheet.type === 'delivery') && (() => {
                      const addr = mobileSheet.type === 'pickup' ? pickup : delivery;
                      const fallback = mobileSheet.type === 'pickup'
                        ? { city: pickupCity, state: pickupState, pin: pickupPin }
                        : { city: deliveryCity, state: deliveryState, pin: deliveryPin };
                      return (
                        <div className="flex items-start gap-2.5 rounded-xl bg-[#F8FAFC] px-3.5 py-3">
                          <MapPin className="w-3.5 h-3.5 text-[#00A86B] mt-0.5 shrink-0" />
                          <div className="min-w-0 text-[12px] leading-[1.55] text-[#475569]">
                            {addr?.contactName && <p className="font-semibold text-[#0F172A]">{addr.contactName}</p>}
                            {addr?.address && <p>{addr.address}</p>}
                            <p>{[addr?.city || fallback.city, addr?.state || fallback.state].filter(v => v && v !== '—').join(', ')}{(addr?.pinCode || fallback.pin) ? ` - ${addr?.pinCode || fallback.pin}` : ''}</p>
                            {addr?.phoneNumber && <p className="mt-1 text-[#64748B]">{addr.phoneNumber}</p>}
                          </div>
                        </div>
                      );
                    })()}

                    {mobileSheet.type === 'weight' && (
                      <div className="rounded-xl bg-[#F8FAFC] px-3.5 py-0.5 text-[12px]">
                        {(cargo
                          ? [['Boxes', String(b2bBoxes)], ['Dead Weight', `${b2bDead.toFixed(2)} kg`], ['Volumetric Weight', `${b2bVol.toFixed(2)} kg`]]
                          : [
                              ['Dead Weight', `${pkg?.weight || pkg?.applicableWeight || applicableWeight} kg`],
                              ...(volW ? [['L × W × H', `${volW.length}×${volW.width}×${volW.height} cm`], ['Volumetric Weight', `${volWeightKg} kg`]] : []),
                            ]
                        ).map(([k, v]) => (
                          <div key={k} className="flex justify-between py-1.5 border-b border-[#EEF2F6]"><span className="text-[#64748B]">{k}</span><span className="font-semibold text-[#0F172A]">{v}</span></div>
                        ))}
                        <div className="flex justify-between py-1.5"><span className="font-semibold text-[#0F172A]">Applicable Weight</span><span className="font-bold text-[#00A86B]">{cargo ? applicableWeight : (pkg?.applicableWeight ?? applicableWeight)} kg</span></div>
                      </div>
                    )}

                    {mobileSheet.type === 'price' && mobileSheet.item && (
                      <>
                        <p className="text-[11.5px] text-[#64748B] mb-2">{mobileSheet.item.courierServiceName}</p>
                        <div className="rounded-xl bg-[#F8FAFC] px-3.5 py-0.5 text-[12px] max-h-[50vh] overflow-y-auto">
                          {(cargo
                            ? b2bBreakupRows(mobileSheet.item.working)
                            : [
                                ['Freight', `₹${Number(mobileSheet.item.forward?.charges || 0).toFixed(2)}`],
                                ['COD', `₹${Number(mobileSheet.item.cod || 0).toFixed(2)}`],
                                ['GST', `₹${Number(mobileSheet.item.forward?.gst || 0).toFixed(2)}`],
                              ]
                          ).map(([k, v]) => (
                            <div key={String(k)} className="flex justify-between py-1.5 border-b border-[#EEF2F6]"><span className="text-[#64748B]">{k}</span><span className="font-semibold text-[#0F172A] tabular-nums">{v}</span></div>
                          ))}
                          <div className="flex justify-between py-1.5"><span className="font-semibold text-[#0F172A]">Total</span><span className="font-bold text-[#00A86B] tabular-nums">₹{Number(mobileSheet.item.forward?.finalCharges || 0).toFixed(2)}</span></div>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setSelectedCourier(mobileSheet.item!); setMobileSheet(null); }}
                          className="mt-3 w-full h-9 rounded-full border border-[#00A86B] text-[#00A86B] text-[12.5px] font-bold active:bg-[#F0FDF4]"
                        >
                          {selectedCourier?.courierServiceName === mobileSheet.item.courierServiceName ? 'Selected' : 'Select this courier'}
                        </button>
                      </>
                    )}

                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
