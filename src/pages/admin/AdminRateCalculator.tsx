import React, { useState, useEffect, useRef } from 'react';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { Truck, Plane, Loader2, ChevronDown, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../services/apiClient';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

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

// ─── Types ─────────────────────────────────────────────────────────────────────
interface CourierResult {
  _id: string;
  courierServiceName: string;
  courierType: string;
  orderType: 'B2C' | 'B2B';
  mode_name?: string;
  forward: { finalCharges: number | null };
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
  };

  const openB2BPopup = (e: React.MouseEvent, working: CourierResult['working']) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const popupWidth = 230;
    let left = rect.left + rect.width / 2 - popupWidth / 2;
    left = Math.max(10, Math.min(window.innerWidth - popupWidth - 10, left));
    setPopupPos({ top: rect.bottom + 10, left });
    setB2bPopup(working);
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
                    className="flex justify-between items-center w-full h-11 border border-[#E2E8F0] rounded-xl px-4 text-[13px] font-semibold text-[#0F172A] cursor-pointer hover:border-[#00A86B] transition-colors"
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
                  className="w-full h-11 px-4 border border-[#E2E8F0] rounded-xl text-[13px] font-medium focus:outline-none focus:border-[#00A86B]"
                />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-[#64748B] mb-2">Delivery Pincode <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.deliveryPincode}
                  onChange={e => setField('deliveryPincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6 digit delivery pincode"
                  className="w-full h-11 px-4 border border-[#E2E8F0] rounded-xl text-[13px] font-medium focus:outline-none focus:border-[#00A86B]"
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
                    className="flex-1 px-4 border border-r-0 border-[#E2E8F0] rounded-l-xl text-[13px] font-medium focus:outline-none focus:border-[#00A86B] min-w-0"
                  />
                  <span className="w-12 flex items-center justify-center bg-[#00A86B] text-white text-[12px] font-bold border border-[#00A86B] rounded-r-xl shrink-0">kg</span>
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
                    className="flex-1 px-4 border border-r-0 border-[#E2E8F0] rounded-l-xl text-[13px] font-medium focus:outline-none focus:border-[#00A86B] min-w-0"
                  />
                  <span className="w-12 flex items-center justify-center bg-[#00A86B] text-white text-[13px] font-bold border border-[#00A86B] rounded-r-xl shrink-0">₹</span>
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
                    className="w-full h-11 px-4 border border-[#E2E8F0] rounded-xl text-[13px] font-medium focus:outline-none focus:border-[#00A86B]"
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
              <button
                type="submit"
                disabled={loading}
                className="px-8 h-11 bg-[#00A86B] hover:bg-[#009B63] text-white text-[13px] font-bold rounded-full transition-colors shadow-sm flex items-center justify-center gap-2 min-w-[120px] disabled:opacity-60"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Calculating…</> : 'Calculate'}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-8 h-11 bg-white border border-[#00A86B] text-[#475569] text-[13px] font-bold rounded-full hover:bg-[#F8FAFC] transition-colors"
              >
                Reset
              </button>
            </div>
          </form>

          {/* Graphic */}
          <div className="relative bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm flex flex-col items-center justify-center gap-3 overflow-hidden min-h-[380px]">
            {/* Soft accent glow behind the animation */}
            <div className="absolute w-64 h-64 rounded-full bg-[#F0FDF4] blur-2xl pointer-events-none" />

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
        </div>

        {/* Results */}
        <div ref={resultRef}>
          {hasFetched && results.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC]/50">
                <h3 className="text-[15px] font-bold text-[#0F172A]">Available Courier Partners</h3>
              </div>

              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto max-h-[480px] overflow-y-auto thin-scrollbar">
                <table className="w-full min-w-[700px]">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-[#E6F9F2] text-[#0F172A] text-[12px] font-bold">
                      <th className="py-3 px-5 text-left">Courier</th>
                      <th className="py-3 px-5 text-center">Mode</th>
                      <th className="py-3 px-5 text-center">Charges</th>
                      <th className="py-3 px-5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {results.map(item => {
                      const logo = getCarrierLogo(item.courierServiceName);
                      const isAir = isModeAir(item);
                      return (
                        <tr key={item._id} className="bg-white hover:bg-[#F8FAFC] transition-colors">
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3">
                              {logo
                                ? <img src={logo} alt={item.courierServiceName} className="w-9 h-9 object-contain rounded" />
                                : <div className="w-9 h-9 rounded-lg bg-[#F1F5F9] flex items-center justify-center text-[9px] font-bold text-[#64748B] text-center leading-tight px-1">{item.courierServiceName.slice(0, 6)}</div>
                              }
                              <span className="text-[13px] font-semibold text-[#0F172A]">{item.courierServiceName}</span>
                            </div>
                          </td>
                          <td className="py-4 px-5 text-center">
                            {isAir
                              ? <Plane className="w-4 h-4 text-[#64748B] mx-auto" />
                              : <Truck className="w-4 h-4 text-[#64748B] mx-auto" />
                            }
                          </td>
                          <td className="py-4 px-5 text-center">
                            {item.orderType === 'B2C' ? (
                              <span className="text-[14px] font-bold text-[#0F172A]">₹{item.forward.finalCharges}</span>
                            ) : (
                              <span className="text-[14px] font-bold text-[#0F172A] flex items-center justify-center gap-1">
                                ₹{item.working?.grand_total}
                                <Info
                                  className="b2b-info-icon w-3.5 h-3.5 text-[#00A86B] cursor-pointer"
                                  onMouseEnter={e => openB2BPopup(e as unknown as React.MouseEvent, item.working)}
                                  onMouseLeave={() => setB2bPopup(null)}
                                  onClick={e => { e.stopPropagation(); openB2BPopup(e, item.working); }}
                                />
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-5 text-center">
                            <button
                              onClick={() => navigate('/user/add-order')}
                              className="px-4 py-2 bg-[#00A86B] hover:bg-[#009B63] text-white text-[12px] font-bold rounded-full transition-colors"
                            >
                              + Create Shipment
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-[#E2E8F0]">
                {results.map(item => {
                  const logo = getCarrierLogo(item.courierServiceName);
                  const isAir = isModeAir(item);
                  return (
                    <div key={item._id} className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        {logo
                          ? <img src={logo} alt={item.courierServiceName} className="w-10 h-10 object-contain rounded" />
                          : <div className="w-10 h-10 rounded-lg bg-[#F1F5F9] flex items-center justify-center text-[9px] font-bold text-[#64748B] text-center">{item.courierServiceName.slice(0, 6)}</div>
                        }
                        <span className="text-[13px] font-bold text-[#0F172A]">{item.courierServiceName}</span>
                      </div>
                      <div className="flex justify-between text-[12px] mb-1">
                        <span className="text-[#64748B] font-medium">Mode</span>
                        {isAir ? <Plane className="w-4 h-4 text-[#64748B]" /> : <Truck className="w-4 h-4 text-[#64748B]" />}
                      </div>
                      <div className="flex justify-between text-[12px] mb-3">
                        <span className="text-[#64748B] font-medium">Charges</span>
                        <span className="font-bold text-[#0F172A]">
                          {item.orderType === 'B2C' ? `₹${item.forward.finalCharges}` : `₹${item.working?.grand_total}`}
                        </span>
                      </div>
                      <button
                        onClick={() => navigate('/user/add-order')}
                        className="w-full py-2 bg-[#00A86B] hover:bg-[#009B63] text-white text-[12px] font-bold rounded-xl transition-colors"
                      >
                        + Create Shipment
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
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
    </AdminLayout>
  );
}
