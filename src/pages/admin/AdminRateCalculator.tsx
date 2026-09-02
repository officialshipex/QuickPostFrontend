import React, { useState, useEffect, useRef } from 'react';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { Truck, Plane, Loader2, ChevronDown, Info, Sparkles, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../services/apiClient';
import { ParcelPreview } from '../../components/ui/ParcelPreview';
import { RouteSummary } from '../../components/ui/RouteSummary';
import { ShineButton } from '../../components/ui/ShineButton';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Carrier Logo ──────────────────────────────────────────────────────────────
const getCarrierLogo = (name = '') => {
  const n = name.toLowerCase();
  if (n.includes('delhivery')) return '/brands/delhivery.png';
  if (n.includes('bluedart')) return '/brands/bluedart.png';
  if (n.includes('shadowfax')) return '/brands/shadowfax.png';
  if (n.includes('xpressbees')) return '/brands/xpressbees.png';
  if (n.includes('dtdc')) return '/brands/dtdc.png';
  if (n.includes('amazon')) return '/brands/amazon.png';
  if (n.includes('ekart')) return '/brands/ekart.png';
  return null;
};

// ─── Date formatting ─────────────────────────────────────────────────────────
const formatPickupDate = (date?: string | null): string => {
  if (!date) return '—';
  const d = new Date(date);
  const now = new Date();
  const tomorrow = new Date(); tomorrow.setDate(now.getDate() + 1);
  if (d.toDateString() === now.toDateString()) return 'Today';
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatDeliveryDate = (date?: string | null): string =>
  date ? new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const daysFromNow = (date?: string | null): string => {
  if (!date) return '';
  const target = new Date(date); target.setHours(0, 0, 0, 0);
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const days = Math.round((target.getTime() - now.getTime()) / 86400000);
  if (days < 0) return '';
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `In ${days} Days`;
};

// ─── Types ─────────────────────────────────────────────────────────────────────
interface CourierResult {
  _id: string;
  courierServiceName: string;
  courierType: string;
  orderType: 'B2C' | 'B2B';
  mode_name?: string;
  pickupDate?: string | null;
  estimatedDeliveryDate?: string | null;
  forward: { finalCharges: number | null; freightCharges?: number; codCharges?: number; smartOrderCharges?: number };
  working?: {
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
  };
}

const IMPORTANT_TERMS = [
  'Above mentioned prices are inclusive of GST.',
  'Fixed COD charge or COD % of the order value whichever is higher will be considered while calculating the COD fee.',
  'The above pricing is subject to change based on fuel surcharges and courier company base rates.',
  'Dead/Dry weight or volumetric weight whichever is higher will be considered while calculating the freight charges.',
  'Volumetric weight is calculated L × W × H (in cms) / 5000 for all courier companies. In case of Ecom Express EGS Shipments it is L × W × H (in cms) / 4500.',
  'RTO (return to origin) shipment will be charged differently from the forward delivery rate.',
  'Pickup services may face issues due to operational concerns of the courier company.',
  'Return charges may apply over and above the freight fee in case of Ecom Express.',
  'Other Charges like Octroi charges, State Entry Tax and Fees, Address Correction charges if applicable shall be charged extra.',
  'Billing issues should be escalated within 7 days from the date of Invoice.',
  'Lost or damaged products claims will be handled as per the carrier terms and conditions.',
  "The Customer/Seller shall not book/handover or allows to be handed over any Product which is banned, restricted, illegal, prohibited, stolen, infringing of any third-party rights, liquid materials, hazardous or dangerous or in breach of any law or regulation in force in India for the purpose of the logistics or delivery services.",
  'Additional government rules and norms can be applicable while shipping to certain states and subject to change without prior intimation and will abide by them.',
  "Detailed terms and conditions can be reviewed on Shipex's Terms of services.",
  'For any queries reach out to us at https://carrier.shipex.in/support or write to us at support@shipexindia.com.',
];

export function AdminRateCalculator() {
  const navigate = useNavigate();
  const resultRef = useRef<HTMLDivElement>(null);
  const paymentDropdownRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    shipmentType: 'Forward',
    pickUpPincode: '',
    deliveryPincode: '',
    weight: '',
    declaredValue: '',
    paymentType: 'Prepaid',
    length: '',
    breadth: '',
    height: '',
  });

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CourierResult[]>([]);
  const [hasFetched, setHasFetched] = useState(false);
  const [error, setError] = useState('');
  const [b2bPopup, setB2bPopup] = useState<CourierResult['working'] | null>(null);
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0 });
  const [ratePopup, setRatePopup] = useState<CourierResult['forward'] | null>(null);
  const [ratePopupPos, setRatePopupPos] = useState({ top: 0, left: 0 });
  const [resultsTab, setResultsTab] = useState<'All' | 'Air' | 'Surface'>('All');

  // Pickup/delivery city & state — resolved from the entered pincodes, shown
  // in the route summary that replaces the graphic panel after Calculate.
  const [pickupLocation, setPickupLocation] = useState({ city: '', state: '' });
  const [deliveryLocation, setDeliveryLocation] = useState({ city: '', state: '' });

  useEffect(() => {
    if (form.pickUpPincode.length !== 6) { setPickupLocation({ city: '', state: '' }); return; }
    fetch(`https://api.postalpincode.in/pincode/${form.pickUpPincode}`)
      .then(r => r.json())
      .then(data => {
        const po = data?.[0]?.PostOffice?.[0];
        if (po) setPickupLocation({ city: po.District || po.Name || '', state: po.State || '' });
      })
      .catch(() => {});
  }, [form.pickUpPincode]);

  useEffect(() => {
    if (form.deliveryPincode.length !== 6) { setDeliveryLocation({ city: '', state: '' }); return; }
    fetch(`https://api.postalpincode.in/pincode/${form.deliveryPincode}`)
      .then(r => r.json())
      .then(data => {
        const po = data?.[0]?.PostOffice?.[0];
        if (po) setDeliveryLocation({ city: po.District || po.Name || '', state: po.State || '' });
      })
      .catch(() => {});
  }, [form.deliveryPincode]);

  // Close payment dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (paymentDropdownRef.current && !paymentDropdownRef.current.contains(e.target as Node)) {
        setPaymentOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close B2B popup on outside click
  useEffect(() => {
    if (!b2bPopup) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('.b2b-popup') || t.closest('.b2b-info-icon')) return;
      setB2bPopup(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [b2bPopup]);

  // Close rate breakdown popup on outside click
  useEffect(() => {
    if (!ratePopup) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('.rate-popup') || t.closest('.rate-info-icon')) return;
      setRatePopup(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ratePopup]);

  // Computed weights
  const actualWeight = parseFloat(form.weight) || 0;
  const l = parseFloat(form.length) || 0;
  const b = parseFloat(form.breadth) || 0;
  const h = parseFloat(form.height) || 0;
  const volumetricWeight = l > 0 && b > 0 && h > 0 ? (l * b * h) / 5000 : 0;
  const applicableWeight = Math.max(actualWeight, volumetricWeight);

  const setField = (name: string, value: string) => setForm(f => ({ ...f, [name]: value }));

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

    const payload = {
      shipmentType: form.shipmentType,
      pickUpPincode: form.pickUpPincode,
      deliveryPincode: form.deliveryPincode,
      weight: form.weight,
      declaredValue: form.declaredValue,
      paymentType: form.paymentType,
      dimensions: { length: form.length, breadth: form.breadth, height: form.height },
      applicableWeight,
    };

    try {
      setLoading(true);
      setHasFetched(false);
      setResults([]);
      setResultsTab('All');
      const res = await apiClient.post('/ratecalculate/Rate', payload);
      const data: CourierResult[] = res.data || [];

      if (data.length === 0) {
        setError('No courier available for this pincode.');
        setHasFetched(true);
        return;
      }
      if (data[0]?.forward?.finalCharges === null) {
        setError('Pincode serviceability is not available.');
        setHasFetched(true);
        return;
      }

      const filtered = data.filter(item => item.forward?.finalCharges !== null);
      setResults(filtered.sort((a, b2) => (a.forward.finalCharges ?? 0) - (b2.forward.finalCharges ?? 0)));
      setHasFetched(true);

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    } catch {
      setError('Failed to calculate rates. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setForm({
      shipmentType: 'Forward', pickUpPincode: '', deliveryPincode: '',
      weight: '', declaredValue: '', paymentType: 'Prepaid',
      length: '', breadth: '', height: '',
    });
    setResults([]);
    setHasFetched(false);
    setError('');
    setResultsTab('All');
  };

  const openB2BPopup = (e: React.MouseEvent, working: CourierResult['working']) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const popupWidth = 230;
    let left = rect.left + rect.width / 2 - popupWidth / 2;
    left = Math.max(10, Math.min(window.innerWidth - popupWidth - 10, left));
    setPopupPos({ top: rect.bottom + 10, left });
    setB2bPopup(working);
  };

  const openRatePopup = (e: React.MouseEvent, forward: CourierResult['forward']) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const popupWidth = 190;
    let left = rect.left + rect.width / 2 - popupWidth / 2;
    left = Math.max(10, Math.min(window.innerWidth - popupWidth - 10, left));
    setRatePopupPos({ top: rect.bottom + 8, left });
    setRatePopup(forward);
  };

  const isModeAir = (item: CourierResult) =>
    item.orderType === 'B2C'
      ? item.courierType?.toLowerCase().includes('air')
      : item.mode_name === 'air';

  return (
    <AdminLayout>
      <div className="w-full max-w-[1400px] mx-auto pb-10 space-y-6">

        <h1 className="text-[18px] font-bold text-[#0F172A]">Shipping Rate Calculator</h1>

        {/* Form + Graphic */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-2 bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm space-y-5">

            {error && (
              <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-[13px] font-semibold text-red-600">
                {error}
              </div>
            )}

            {/* Row 1: Shipment Type + Payment Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[13px] font-bold text-[#0F172A] mb-3">Shipment Type</label>
                <div className="flex gap-5">
                  {['Forward', 'Return'].map(opt => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer">
                      <div
                        onClick={() => setField('shipmentType', opt)}
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${form.shipmentType === opt ? 'border-[#00A86B]' : 'border-[#CBD5E1]'}`}
                      >
                        {form.shipmentType === opt && <div className="w-2 h-2 rounded-full bg-[#00A86B]" />}
                      </div>
                      <span className="text-[13px] font-medium text-[#475569]">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Payment Type custom dropdown */}
              <div>
                <label className="block text-[13px] font-bold text-[#0F172A] mb-3">Payment Type <span className="text-red-500">*</span></label>
                <div className="relative" ref={paymentDropdownRef}>
                  <div
                    onClick={() => setPaymentOpen(o => !o)}
                    className="flex justify-between items-center w-full h-11 border border-[#E2E8F0] rounded-full px-4 text-[13px] font-semibold text-[#0F172A] cursor-pointer hover:border-[#00A86B] transition-colors"
                  >
                    {form.paymentType}
                    <ChevronDown className={`w-4 h-4 text-[#94A3B8] transition-transform ${paymentOpen ? 'rotate-180' : ''}`} />
                  </div>
                  {paymentOpen && (
                    <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-[#E2E8F0] rounded-xl shadow-lg overflow-hidden">
                      {['Prepaid', 'COD'].map(opt => (
                        <div
                          key={opt}
                          onClick={() => { setField('paymentType', opt); setPaymentOpen(false); }}
                          className={`px-4 py-2.5 text-[13px] font-semibold cursor-pointer transition-colors ${form.paymentType === opt ? 'bg-[#F0FDF4] text-[#00A86B]' : 'text-[#475569] hover:bg-[#F8FAFC]'}`}
                        >
                          {opt}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Row 2: Pincodes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[13px] font-bold text-[#64748B] mb-2">Pickup Pincode <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.pickUpPincode}
                  onChange={e => setField('pickUpPincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6 digit pickup pincode"
                  className="w-full h-11 px-4 border border-[#E2E8F0] rounded-full text-[13px] font-medium focus:outline-none focus:border-[#00A86B]"
                />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-[#64748B] mb-2">Delivery Pincode <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.deliveryPincode}
                  onChange={e => setField('deliveryPincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6 digit delivery pincode"
                  className="w-full h-11 px-4 border border-[#E2E8F0] rounded-full text-[13px] font-medium focus:outline-none focus:border-[#00A86B]"
                />
              </div>
            </div>

            {/* Row 3: Weight + Declared Value */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[13px] font-bold text-[#64748B] mb-2">Approximate Weight (kg) <span className="text-red-500">*</span></label>
                <div className="flex h-11">
                  <input
                    type="text"
                    value={form.weight}
                    onChange={e => {
                      const v = e.target.value;
                      if (/^\d*\.?\d*$/.test(v)) setField('weight', v);
                    }}
                    placeholder="E.g. 1"
                    className="flex-1 px-4 border border-r-0 border-[#E2E8F0] rounded-l-full text-[13px] font-medium focus:outline-none focus:border-[#00A86B] min-w-0"
                  />
                  <span className="w-12 flex items-center justify-center bg-[#00A86B] text-white text-[12px] font-bold border border-[#00A86B] rounded-r-full shrink-0">kg</span>
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-bold text-[#64748B] mb-2">Declared Value (INR) <span className="text-red-500">*</span></label>
                <div className="flex h-11">
                  <input
                    type="text"
                    value={form.declaredValue}
                    onChange={e => setField('declaredValue', e.target.value.replace(/\D/g, ''))}
                    placeholder="Declared value"
                    className="flex-1 px-4 border border-r-0 border-[#E2E8F0] rounded-l-full text-[13px] font-medium focus:outline-none focus:border-[#00A86B] min-w-0"
                  />
                  <span className="w-12 flex items-center justify-center bg-[#00A86B] text-white text-[13px] font-bold border border-[#00A86B] rounded-r-full shrink-0">₹</span>
                </div>
              </div>
            </div>

            {/* Row 4: Dimensions */}
            <div>
              <label className="block text-[13px] font-bold text-[#64748B] mb-2">Dimensions (cm) <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-3 gap-3">
                {[['length', 'Length'], ['breadth', 'Width'], ['height', 'Height']].map(([key, label]) => (
                  <input
                    key={key}
                    type="number"
                    value={form[key as keyof typeof form]}
                    onChange={e => setField(key, e.target.value)}
                    placeholder={label}
                    min="0"
                    className="w-full h-11 px-4 border border-[#E2E8F0] rounded-full text-[13px] font-medium focus:outline-none focus:border-[#00A86B]"
                  />
                ))}
              </div>
            </div>

            {/* Live weight display */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-[#F0FDF4] border border-[#DCFCE7] rounded-xl">
                <span className="text-[13px] font-semibold text-[#0F172A]">
                  Volumetric Weight: {volumetricWeight.toFixed(2)} kg
                </span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2.5 bg-[#F0FDF4] border border-[#DCFCE7] rounded-xl">
                <span className="text-[13px] font-semibold text-[#0F172A]">
                  Applicable Weight: {applicableWeight.toFixed(2)} kg
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <ShineButton
                type="submit"
                disabled={loading}
                className="px-8 h-11 bg-[#00A86B] hover:bg-[#009B63] text-white text-[13px] font-bold rounded-full transition-colors shadow-sm flex items-center justify-center gap-2 min-w-[120px] disabled:opacity-60"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Calculating…</> : 'Calculate'}
              </ShineButton>
              <button
                type="button"
                onClick={handleReset}
                className="px-8 h-11 bg-white border border-[#00A86B] text-[#475569] text-[13px] font-bold rounded-full hover:bg-[#F8FAFC] transition-colors"
              >
                Reset
              </button>
            </div>
          </form>

          {/* Graphic — desktop only */}
          <div className="hidden lg:flex relative bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm flex-col items-center overflow-hidden min-h-[460px]">
            {/* Soft accent glow — small, tucked in a corner so it never washes out taller content */}
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[#F0FDF4] blur-2xl pointer-events-none" />

            {/* Graphic state machine (priority order):
                1. Calculate clicked           → route summary illustration
                2. Length/Width/Height entered → live parcel box
                3. Pickup pincode entered       → route summary illustration (preview)
                4. Nothing entered yet          → Lottie animation             */}
            {hasFetched ? (
              <div className="relative z-10 w-full flex-1 flex items-center justify-center">
                <RouteSummary
                  pickupCity={pickupLocation.city}
                  pickupState={pickupLocation.state}
                  deliveryCity={deliveryLocation.city}
                  deliveryState={deliveryLocation.state}
                />
              </div>
            ) : l > 0 && b > 0 && h > 0 ? (
              <div className="relative z-10 flex flex-col items-center justify-center gap-3 flex-1">
                <div className="relative w-full max-w-[300px] animate-[strapFadeIn_0.4s_ease-out]">
                  <ParcelPreview length={l} breadth={b} height={h} />
                </div>
                <div className="relative text-center">
                  <h3 className="text-[14px] font-bold text-[#0F172A]">Calculate rates in seconds</h3>
                  <p className="text-[12px] text-[#64748B] mt-0.5">Your parcel updates live as you enter dimensions</p>
                </div>
              </div>
            ) : form.pickUpPincode.length === 6 ? (
              <div className="relative z-10 w-full flex-1 flex items-center justify-center animate-[strapFadeIn_0.4s_ease-out]">
                <RouteSummary
                  pickupCity={pickupLocation.city}
                  pickupState={pickupLocation.state}
                  deliveryCity={deliveryLocation.city}
                  deliveryState={deliveryLocation.state}
                />
              </div>
            ) : (
              <div className="relative z-10 flex flex-col items-center justify-center gap-3 flex-1">
                <div className="relative w-full max-w-[380px]">
                  <DotLottieReact
                    src="https://lottie.host/5eb8a435-1c8e-4eba-b0d9-770defa8557d/wRv72wEB62.lottie"
                    loop
                    autoplay
                  />
                </div>
                <div className="relative text-center">
                  <h3 className="text-[14px] font-bold text-[#0F172A]">Calculate rates in seconds</h3>
                  <p className="text-[12px] text-[#64748B] mt-0.5">Enter your shipment details to compare live courier rates</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div ref={resultRef}>
          {hasFetched && results.length > 0 && (() => {
            const tabFiltered = results.filter(item =>
              resultsTab === 'All' ? true : resultsTab === 'Air' ? isModeAir(item) : !isModeAir(item)
            );

            // The cheapest rate overall is "Recommended" — computed from the actual
            // displayed price (forward.finalCharges for B2C, working.grand_total for
            // B2B), so a single, correct winner is picked regardless of order type.
            // Keyed by courierServiceName rather than _id: the API can return the same
            // _id (or an empty one) across multiple rows, which made every row match.
            const priceOf = (item: CourierResult) =>
              Number(item.orderType === 'B2C' ? item.forward.finalCharges : item.working?.grand_total ?? Infinity);
            const cheapestServiceName = results.reduce((min, r) => (priceOf(r) < priceOf(min) ? r : min), results[0]).courierServiceName;

            return (
              <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">

                {/* Order Details sidebar */}
                <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6 h-fit">
                  <h3 className="text-[16px] font-bold text-[#0F172A] mb-5">Order Details</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="text-[11px] text-[#94A3B8] font-medium">Pickup From</div>
                      <div className="text-[14px] font-bold text-[#0F172A] mt-0.5">{form.pickUpPincode}</div>
                      <div className="text-[13px] font-semibold text-[#334155]">
                        {[pickupLocation.city, pickupLocation.state].filter(Boolean).join(', ') || '—'}
                      </div>
                      <div className="flex justify-start pl-[3px] pt-2">
                        <div className="w-px h-5 border-l-2 border-dashed border-[#CBD5E1]" />
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] text-[#94A3B8] font-medium">Delivery To</div>
                      <div className="text-[14px] font-bold text-[#0F172A] mt-0.5">{form.deliveryPincode}</div>
                      <div className="text-[13px] font-semibold text-[#334155]">
                        {[deliveryLocation.city, deliveryLocation.state].filter(Boolean).join(', ') || '—'}
                      </div>
                    </div>
                    <div className="border-t border-dashed border-[#E2E8F0]" />
                    <div>
                      <div className="text-[11px] text-[#94A3B8] font-medium">Shipment Value</div>
                      <div className="text-[14px] font-bold text-[#0F172A] mt-0.5">₹ {form.declaredValue}</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-[#94A3B8] font-medium">Payment Mode</div>
                      <div className="text-[14px] font-bold text-[#0F172A] mt-0.5">{form.paymentType}</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-[#94A3B8] font-medium">Applicable Weight (in Kg)</div>
                      <div className="text-[14px] font-bold text-[#0F172A] mt-0.5">{applicableWeight.toFixed(2)} Kg</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-[#94A3B8] font-medium">Dangerous Goods</div>
                      <div className="text-[14px] font-bold text-[#0F172A] mt-0.5">No</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-[#94A3B8] font-medium">Secure Shipment</div>
                      <div className="text-[14px] font-bold text-[#0F172A] mt-0.5">Yes</div>
                    </div>
                  </div>
                </div>

                {/* Serviceable Courier Partners */}
                <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6">
                  <h3 className="text-[16px] font-bold text-[#0F172A]">Serviceable Courier Partners</h3>

                  {/* Tabs */}
                  <div className="flex items-center gap-6 mt-4 border-b border-[#E2E8F0]">
                    {(['All', 'Air', 'Surface'] as const).map(tab => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setResultsTab(tab)}
                        className={`relative pb-3 text-[13px] font-semibold transition-colors ${resultsTab === tab ? 'text-[#009D64]' : 'text-[#94A3B8] hover:text-[#475569]'}`}
                      >
                        {tab}
                        {resultsTab === tab && <span className="absolute left-0 right-0 -bottom-px h-[2px] bg-[#009D64] rounded-full" />}
                      </button>
                    ))}
                  </div>

                  <p className="text-[12.5px] font-semibold text-[#009D64] mt-3 mb-4">
                    Showing {tabFiltered.length} serviceable courier{tabFiltered.length === 1 ? '' : 's'}
                  </p>

                  {/* Desktop list — shared grid template on header + every row keeps
                      columns and values genuinely aligned, instead of independently
                      guessed flex-basis percentages drifting apart per row. */}
                  <div className="hidden md:block max-h-[480px] overflow-y-auto thin-scrollbar pr-1">
                    <div className="grid grid-cols-[1.6fr_0.9fr_1fr_0.9fr_1fr_0.9fr] gap-2 px-5 py-2 text-[12px] font-bold text-[#64748B]">
                      <span className="text-left">Courier Partner</span>
                      <span className="text-center">Pickup Date</span>
                      <span className="text-center">Est. Delivery Date</span>
                      <span className="text-center">Chargeable Weight</span>
                      <span className="text-center">Shipment Rate</span>
                      <span className="text-center">Action</span>
                    </div>

                    <div className="space-y-3 pt-1">
                      <AnimatePresence initial={false}>
                        {tabFiltered.map((item, i) => {
                          const isRecommended = item.courierServiceName === cheapestServiceName;
                          const price = item.orderType === 'B2C' ? item.forward.finalCharges : item.working?.grand_total;
                          return (
                            <motion.div
                              key={item.courierServiceName}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -6 }}
                              transition={{ duration: 0.22, delay: Math.min(i * 0.04, 0.3) }}
                              whileHover={{ y: -2 }}
                              className={`relative grid grid-cols-[1.6fr_0.9fr_1fr_0.9fr_1fr_0.9fr] gap-2 items-center px-5 py-4 rounded-xl border transition-shadow ${
                                isRecommended
                                  ? 'border-[#009D64] shadow-[0_4px_16px_-6px_rgba(0,157,100,0.25)]'
                                  : 'border-[#E2E8F0] hover:shadow-[0_4px_16px_-8px_rgba(15,23,42,0.12)] hover:border-[#CBD5E1]'
                              }`}
                            >
                              {isRecommended && (
                                <span className="absolute -top-3 left-4 inline-flex items-center gap-1 text-[10.5px] font-bold text-white bg-[#009D64] pl-2 pr-2.5 py-1 rounded-full shadow-sm">
                                  <Sparkles className="w-3 h-3" /> Recommended
                                </span>
                              )}

                              <div className="flex items-center gap-3 min-w-0">
                                {getCarrierLogo(item.courierServiceName)
                                  ? <img src={getCarrierLogo(item.courierServiceName)!} alt={item.courierServiceName} className="w-9 h-9 object-contain rounded shrink-0" />
                                  : <div className="w-9 h-9 rounded-lg bg-[#F1F5F9] flex items-center justify-center text-[9px] font-bold text-[#64748B] text-center leading-tight px-1 shrink-0">{item.courierServiceName.slice(0, 6)}</div>
                                }
                                <span className="text-[13.5px] font-bold text-[#0F172A] truncate">{item.courierServiceName}</span>
                              </div>

                              <div className="text-center text-[13px] font-semibold text-[#334155]">
                                {formatPickupDate(item.pickupDate)}
                              </div>

                              <div className="text-center">
                                <div className="text-[13px] font-semibold text-[#334155]">{formatDeliveryDate(item.estimatedDeliveryDate)}</div>
                                {daysFromNow(item.estimatedDeliveryDate) && (
                                  <div className="text-[11px] font-bold text-[#00A86B] mt-0.5">{daysFromNow(item.estimatedDeliveryDate)}</div>
                                )}
                              </div>

                              <div className="text-center text-[13px] font-semibold text-[#334155]">
                                {applicableWeight.toFixed(2)} Kg
                              </div>

                              <div className="text-center">
                                <span className="text-[14.5px] font-bold text-[#0F172A]">₹{price}</span>
                                {item.orderType === 'B2B' ? (
                                  <Info
                                    className="b2b-info-icon w-3.5 h-3.5 text-[#00A86B] cursor-pointer inline ml-1"
                                    onMouseEnter={e => openB2BPopup(e as unknown as React.MouseEvent, item.working)}
                                    onMouseLeave={() => setB2bPopup(null)}
                                    onClick={e => { e.stopPropagation(); openB2BPopup(e, item.working); }}
                                  />
                                ) : (
                                  <Info
                                    className="rate-info-icon w-3.5 h-3.5 text-[#00A86B] cursor-pointer inline ml-1"
                                    onMouseEnter={e => openRatePopup(e as unknown as React.MouseEvent, item.forward)}
                                    onMouseLeave={() => setRatePopup(null)}
                                    onClick={e => { e.stopPropagation(); openRatePopup(e, item.forward); }}
                                  />
                                )}
                              </div>

                              <div className="text-center">
                                <ShineButton
                                  onClick={() => navigate('/user/add-order')}
                                  className="px-4 py-2 bg-[#009D64] hover:bg-[#008856] text-white text-[12px] font-bold rounded-full transition-colors"
                                >
                                  Create Shipment
                                </ShineButton>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Mobile cards */}
                  <div className="md:hidden -mx-2">
                    <div className="space-y-3 px-2">
                    <AnimatePresence initial={false}>
                      {tabFiltered.map((item, i) => {
                        const isRecommended = item.courierServiceName === cheapestServiceName;
                        const isAir = isModeAir(item);
                        const price = item.orderType === 'B2C' ? item.forward.finalCharges : item.working?.grand_total;
                        return (
                          <motion.div
                            key={item.courierServiceName}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.22, delay: Math.min(i * 0.04, 0.3) }}
                            className={`relative rounded-xl border p-4 transition-shadow ${isRecommended ? 'border-[#009D64] shadow-[0_4px_16px_-6px_rgba(0,157,100,0.25)]' : 'border-[#E2E8F0]'}`}
                          >
                            {isRecommended && (
                              <span className="absolute -top-2.5 left-3 inline-flex items-center gap-1 text-[10px] font-bold text-white bg-[#009D64] pl-2 pr-2.5 py-1 rounded-full shadow-sm">
                                <Sparkles className="w-3 h-3" /> Recommended
                              </span>
                            )}
                            <div className="flex items-start gap-3">
                              {getCarrierLogo(item.courierServiceName)
                                ? <img src={getCarrierLogo(item.courierServiceName)!} alt={item.courierServiceName} className="w-11 h-11 object-contain rounded-lg border border-[#F1F5F9] p-1.5 shrink-0" />
                                : <div className="w-11 h-11 rounded-lg bg-[#F1F5F9] flex items-center justify-center text-[9px] font-bold text-[#64748B] text-center shrink-0">{item.courierServiceName.slice(0, 6)}</div>
                              }
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <span className="text-[13.5px] font-bold text-[#0F172A] truncate block">{item.courierServiceName}</span>
                                    <div className="flex items-center gap-1 text-[11px] text-[#64748B] font-medium mt-0.5">
                                      {isAir ? <Plane className="w-3 h-3" /> : <Truck className="w-3 h-3" />}
                                      {isAir ? 'Air Mode' : 'Surface Mode'} · {applicableWeight.toFixed(2)} Kg
                                    </div>
                                    <div className="text-[11px] text-[#94A3B8] font-medium mt-0.5">
                                      Pickup {formatPickupDate(item.pickupDate)} · Delivery {formatDeliveryDate(item.estimatedDeliveryDate)}
                                      {daysFromNow(item.estimatedDeliveryDate) && (
                                        <span className="text-[#00A86B] font-bold"> ({daysFromNow(item.estimatedDeliveryDate)})</span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <span className="text-[15px] font-extrabold text-[#0F172A]">₹{price}</span>
                                    {item.orderType === 'B2B' ? (
                                      <Info
                                        className="b2b-info-icon w-3.5 h-3.5 text-[#00A86B] cursor-pointer inline ml-1"
                                        onClick={e => { e.stopPropagation(); openB2BPopup(e, item.working); }}
                                      />
                                    ) : (
                                      <Info
                                        className="rate-info-icon w-3.5 h-3.5 text-[#00A86B] cursor-pointer inline ml-1"
                                        onClick={e => { e.stopPropagation(); openRatePopup(e, item.forward); }}
                                      />
                                    )}
                                  </div>
                                </div>
                                <ShineButton
                                  onClick={() => navigate('/user/add-order')}
                                  className="mt-2.5 w-full py-2 border border-[#009D64] text-[#009D64] active:bg-[#009D64] active:text-white text-[12px] font-bold rounded-lg transition-colors"
                                >
                                  Create Shipment
                                </ShineButton>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Important Terms */}
        <div className="bg-[#F0FDF4] rounded-2xl border border-[#DCFCE7] p-6 shadow-sm">
          <h3 className="text-[15px] font-bold text-[#0F172A] mb-4">Important Terms</h3>
          <ol className="list-decimal list-inside text-[12px] text-[#475569] space-y-2 leading-relaxed">
            {IMPORTANT_TERMS.map((term, i) => (
              <li key={i}>{term}</li>
            ))}
          </ol>
        </div>
      </div>

      {/* B2B breakdown popup */}
      {b2bPopup && (
        <div
          className="b2b-popup fixed z-[9999] bg-white border border-[#E2E8F0] shadow-xl rounded-xl p-4 text-[12px] w-[230px]"
          style={{ top: popupPos.top, left: popupPos.left }}
        >
          {([
            ['Freight', b2bPopup.freight],
            ['Docket Charges', b2bPopup.docket_charges],
            ['Pickup Charges', b2bPopup.pickup_charge],
            ['Handling Charges', b2bPopup.handling_charge],
            ['Appointment Charges', b2bPopup.appointment_charge],
            ['COD Charges', b2bPopup.cod_charges],
            ['ROV', b2bPopup.rov],
            ['FSC', b2bPopup.fsc],
            ['ODA', b2bPopup.oda],
            ['Green Tax', b2bPopup.green_tax],
            ['GST', b2bPopup.gst],
          ] as [string, number][]).map(([k, v]) => (
            <div key={k} className="flex justify-between py-[2px]">
              <span className="text-[#64748B] font-semibold">{k}</span>
              <span className="font-semibold text-[#0F172A]">₹{v}</span>
            </div>
          ))}
          <div className="border-t border-[#E2E8F0] mt-2 pt-2 flex justify-between font-bold text-[#0F172A]">
            <span>Total</span>
            <span>₹{b2bPopup.grand_total}</span>
          </div>
        </div>
      )}

      {/* Rate breakdown popup — Freight / COD / Smart Order */}
      {ratePopup && (
        <div
          className="rate-popup fixed z-[9999] bg-white border border-[#E2E8F0] shadow-xl rounded-xl p-3 text-[12px] w-[190px] space-y-1.5"
          style={{ top: ratePopupPos.top, left: ratePopupPos.left }}
        >
          <div className="flex justify-between">
            <span className="text-[#334155] font-semibold">Freight charges :</span>
            <span className="font-bold text-[#0F172A]">₹{(ratePopup.freightCharges ?? 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#334155] font-semibold">COD charges :</span>
            <span className="font-bold text-[#0F172A]">₹{(ratePopup.codCharges ?? 0).toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-[#7C3AED] font-semibold">
              <Zap className="w-3.5 h-3.5 fill-[#7C3AED]" /> Smart Order :
            </span>
            <span className="font-bold text-[#7C3AED]">₹{(ratePopup.smartOrderCharges ?? 0).toFixed(2)}</span>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
