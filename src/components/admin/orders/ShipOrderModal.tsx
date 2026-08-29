import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, Plane, Info, X, Loader2, Send, Star, ChevronRight } from 'lucide-react';
import { apiClient } from '../../../services/apiClient';
import { TableLoader } from '../../ui/TableLoader';
import { NetworkError } from '../../ui/NetworkError';

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
}

interface ShipOrderModalProps {
  order: any;
  onClose: () => void;
  onShipped?: () => void;
}

type TabKey = 'Recommended' | 'Surface' | 'Air' | 'All';
const TABS: TabKey[] = ['Recommended', 'Surface', 'Air', 'All'];

export function ShipOrderModal({ order, onClose, onShipped }: ShipOrderModalProps) {
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
  const [openPopup, setOpenPopup] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('Recommended');

  const orderId = order?._id || order?.orderId;

  useEffect(() => {
    let cancelled = false;
    const fetchRates = async () => {
      setLoading(true); setError('');
      try {
        const res = await apiClient.get(`/order/ship/${orderId}`);
        if (!cancelled) {
          setOrderDetails(res.data?.order || null);
          setRates(res.data?.updatedRates || []);
        }
      } catch {
        if (!cancelled) setError('Failed to load courier options. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (orderId) fetchRates();
    return () => { cancelled = true; };
  }, [orderId]);

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
      await apiClient.post(`/${safeProvider}/createShipment`, {
        id: orderId,
        provider,
        finalCharges: forward.finalCharges,
        courierServiceName,
        courier,
        estimatedDeliveryDate,
        priceBreakup: { freight: forward.charges, cod: item.cod, gst: forward.gst, total: forward.finalCharges },
      });
      onShipped?.();
      onClose();
    } catch (err: any) {
      // No response (network drop) or a 5xx from the courier's own API — not a validation
      // problem on our end, so show the friendly "courier network issue" panel instead of
      // the raw error trace.
      const status = err?.response?.status;
      if (!err?.response || (status && status >= 500)) {
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

  const pickupCity    = pickup?.city    || order?.pickupCity    || '—';
  const pickupState   = pickup?.state   || order?.pickupState   || '';
  const pickupPin     = pickup?.pinCode || order?.pickupPinCode || '—';
  const deliveryCity  = delivery?.city    || order?.customerCity    || '—';
  const deliveryState = delivery?.state   || order?.customerState   || '';
  const deliveryPin   = delivery?.pinCode || order?.customerPinCode || '—';
  const orderValue    = orderDetails?.paymentDetails?.amount ?? order?.payment ?? order?.orderValue ?? 0;
  const paymentMethod = orderDetails?.paymentDetails?.method || order?.paymentType || '';
  const applicableWeight = Number(pkg?.applicableWeight ?? order?.weight ?? 0);

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

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm z-[200] flex items-center justify-center p-0 md:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
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
                <p className={`${TXT.value} text-[#94A3B8] md:hidden mt-0.5`}>
                  Order ID: <span className="text-[#00A86B] font-semibold">{orderDetails?.orderId || order?.orderId || '—'}</span>
                </p>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-[#64748B] hover:bg-[#F1F5F9] transition-colors shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ── Tabs ── */}
            <div className="px-4 md:px-6 border-b border-[#E2E8F0] flex items-center gap-6 shrink-0 overflow-x-auto no-scrollbar">
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

            {/* ── Mobile summary card (old-UI style) ── */}
            <div className="md:hidden mx-3 mt-6 shrink-0" onClick={() => setOpenPopup(null)}>
              <div className="relative bg-white rounded-lg shadow-md border flex py-3 px-0 min-h-[115px]">
                {/* FROM / TO column */}
                <div className="flex-1 flex flex-col items-center justify-center relative border-r">
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-50">
                    <span className="w-9 h-9 flex items-center justify-center bg-white rounded-full shadow-lg border">
                      <Truck className="w-4 h-4 text-[#00A86B]" />
                    </span>
                  </div>
                  <div className="mt-6 flex flex-col items-center w-full px-1">
                    {/* Pickup */}
                    <div className="flex flex-col items-center relative" onClick={(e) => { e.stopPropagation(); setOpenPopup(openPopup === 'pickup' ? null : 'pickup'); }}>
                      <span className="text-[12px] font-semibold text-[#0F172A] border-b border-dashed border-[#94A3B8] cursor-pointer">{pickupState || pickupCity}</span>
                      <span className="text-[#94A3B8] text-[11px] font-semibold">{pickupPin}</span>
                      {openPopup === 'pickup' && pickup && (
                        <div className="absolute z-[300] bg-white border border-[#E2E8F0] shadow-2xl rounded-lg p-3 w-[200px] top-0 left-full ml-3 text-[10px] leading-snug" onClick={(e) => e.stopPropagation()}>
                          {pickup.contactName && <p className="font-semibold text-[#0F172A] mb-1">{pickup.contactName}</p>}
                          {pickup.address && <p className="text-[#475569]">{pickup.address}</p>}
                          <p className="text-[#475569]">{[pickup.city, pickup.state].filter(Boolean).join(', ')}{pickup.pinCode ? ` - ${pickup.pinCode}` : ''}</p>
                          {pickup.phoneNumber && <p className="text-[#64748B] mt-1">{pickup.phoneNumber}</p>}
                        </div>
                      )}
                    </div>
                    <span className="text-[#94A3B8] text-[14px] my-0.5">↓</span>
                    {/* Delivery */}
                    <div className="flex flex-col items-center relative" onClick={(e) => { e.stopPropagation(); setOpenPopup(openPopup === 'delivery' ? null : 'delivery'); }}>
                      <span className="text-[12px] font-semibold text-[#0F172A] border-b border-dashed border-[#94A3B8] cursor-pointer">{deliveryState || deliveryCity}</span>
                      <span className="text-[#94A3B8] text-[11px] font-semibold">{deliveryPin}</span>
                      {openPopup === 'delivery' && delivery && (
                        <div className="absolute z-[300] bg-white border border-[#E2E8F0] shadow-2xl rounded-lg p-3 w-[200px] bottom-0 left-full ml-3 text-[10px] leading-snug" onClick={(e) => e.stopPropagation()}>
                          {delivery.contactName && <p className="font-semibold text-[#0F172A] mb-1">{delivery.contactName}</p>}
                          {delivery.address && <p className="text-[#475569]">{delivery.address}</p>}
                          <p className="text-[#475569]">{[delivery.city, delivery.state].filter(Boolean).join(', ')}{delivery.pinCode ? ` - ${delivery.pinCode}` : ''}</p>
                          {delivery.phoneNumber && <p className="text-[#64748B] mt-1">{delivery.phoneNumber}</p>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {/* ORDER VALUE column */}
                <div className="flex-1 flex flex-col items-center justify-center relative border-r">
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-50">
                    <span className="w-9 h-9 flex items-center justify-center bg-white rounded-full shadow-lg border text-[#00A86B] font-bold text-[13px]">₹</span>
                  </div>
                  <div className="mt-6 flex flex-col items-center">
                    {paymentMethod && <span className="font-semibold text-[12px] text-[#0F172A] uppercase">{paymentMethod}</span>}
                    <span className="text-[#64748B] text-[11px] font-semibold mt-0.5">Order Value</span>
                    <span className="text-[12px] font-semibold text-[#0F172A] mt-0.5">₹{Number(orderValue).toFixed(2)}</span>
                  </div>
                </div>
                {/* WEIGHT column */}
                <div className="flex-1 flex flex-col items-center justify-center relative">
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-50">
                    <span className="w-9 h-9 flex items-center justify-center bg-white rounded-full shadow-lg border">
                      <Truck className="w-4 h-4 text-[#00A86B]" />
                    </span>
                  </div>
                  <div className="mt-6 flex flex-col items-center relative" onClick={(e) => { e.stopPropagation(); setOpenPopup(openPopup === 'weight' ? null : 'weight'); }}>
                    <span className="text-[#64748B] text-[11px] font-semibold">Weight</span>
                    <span className="text-[12px] font-semibold text-[#0F172A] border-b border-dashed border-[#94A3B8] cursor-pointer">{applicableWeight} kg</span>
                    {openPopup === 'weight' && pkg && (
                      <div className="absolute z-[300] bg-white border border-[#E2E8F0] shadow-2xl rounded-lg p-3 w-[200px] top-0 right-full mr-3 text-[10px] leading-snug" onClick={(e) => e.stopPropagation()}>
                        <p className="font-semibold text-[#0F172A] mb-1.5 border-b border-[#F1F5F9] pb-1">Weight Details</p>
                        <div className="space-y-1">
                          <div className="flex justify-between"><span className="text-[#94A3B8]">Dead Weight:</span><span className="font-semibold">{pkg.weight || pkg.applicableWeight} kg</span></div>
                          {volW && <>
                            <div className="flex justify-between"><span className="text-[#94A3B8]">Volumetric:</span><span className="font-semibold">{volWeightKg} kg</span></div>
                            <div className="flex justify-between"><span className="text-[#94A3B8]">L×W×H:</span><span className="font-semibold">{volW.length}×{volW.width}×{volW.height}</span></div>
                          </>}
                          <div className="flex justify-between border-t border-[#F1F5F9] pt-1"><span className="font-semibold text-[#0F172A]">Applicable:</span><span className="font-semibold text-[#00A86B]">{pkg.applicableWeight} kg</span></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
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
                  <div className="flex flex-col items-center justify-center h-full gap-2 py-16">
                    <Truck className="w-8 h-8 text-[#CBD5E1]" />
                    <p className={`${TXT.value} text-[#94A3B8]`}>
                      {rates.length === 0 ? 'No courier options available for this pincode.' : `No ${activeTab.toLowerCase()} couriers available.`}
                    </p>
                  </div>
                ) : (
                  <AnimatePresence initial={false}>
                    {tabFilteredRates.map((item, i) => {
                      const logo = getLogoForCourier(item.courierServiceName);
                      const isAir = item.courierType === 'Domestic (Air)';
                      const chargeableWeight = getChargeableWeight(item.courierServiceName, applicableWeight);
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
              const TIP_H = 140;
              const showBelow = rect.top < TIP_H + 16;
              return createPortal(
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.96 }}
                  transition={{ duration: 0.12 }}
                  className="fixed z-[300] w-52 bg-[#0F172A] text-white rounded-[10px] p-3 shadow-xl pointer-events-none"
                  style={{
                    top: showBelow ? rect.bottom + 8 : undefined,
                    bottom: showBelow ? undefined : window.innerHeight - rect.top + 8,
                    left: Math.min(Math.max(rect.right - 208, 8), window.innerWidth - 216),
                  }}
                >
                  <p className={`${TXT.label} text-slate-300 mb-1.5 border-b border-slate-700 pb-1.5`}>Price Breakup</p>
                  {[
                    { label: 'Freight', val: item.forward?.charges },
                    { label: 'COD',     val: item.cod },
                    { label: 'GST',     val: item.forward?.gst },
                  ].map((b) => (
                    <div key={b.label} className="flex justify-between items-center py-0.5">
                      <span className={`${TXT.value} text-slate-400`}>{b.label}</span>
                      <span className={`${TXT.value} text-white`}>₹{Number(b.val || 0).toFixed(2)}</span>
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
            <div className="md:hidden relative flex-1 min-h-0 mx-3 mt-3 mb-0 overflow-y-auto space-y-2 pb-2" onClick={() => setOpenPopup(null)}>
              {courierNetworkError && (
                <NetworkError onDone={() => setCourierNetworkError(false)} />
              )}
              {!loading && (
                <p className="text-[11px] font-semibold text-[#94A3B8] px-0.5">
                  {tabFilteredRates.length} {tabFilteredRates.length === 1 ? 'Courier' : 'Couriers'} Found
                </p>
              )}
              {loading ? (
                <div className="relative h-48 bg-white rounded-lg border border-[#E2E8F0]">
                  <TableLoader />
                </div>
              ) : tabFilteredRates.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 gap-2 bg-white rounded-lg border border-[#E2E8F0]">
                  <Truck className="w-8 h-8 text-[#CBD5E1]" />
                  <p className={`${TXT.value} text-[#94A3B8]`}>
                    {rates.length === 0 ? 'No courier options available for this pincode.' : `No ${activeTab.toLowerCase()} couriers available.`}
                  </p>
                </div>
              ) : (
                tabFilteredRates.map((item, i) => {
                  const logo = getLogoForCourier(item.courierServiceName);
                  const isAir = item.courierType === 'Domestic (Air)';
                  const chargeableWeight = getChargeableWeight(item.courierServiceName, applicableWeight);
                  const isSelected = selectedCourier?.courierServiceName === item.courierServiceName;
                  const isCheapest = item.courierServiceName === cheapestServiceName;
                  return (
                    <div
                      key={item.courierServiceName}
                      className={`relative border text-[10px] rounded-lg overflow-hidden shadow-sm bg-white cursor-pointer transition-all ${isSelected ? 'border-[#6D28D9] ring-1 ring-[#6D28D9]' : isCheapest ? 'border-[#00A86B] ring-1 ring-[#00A86B]/30' : 'border-[#E2E8F0]'}`}
                      onClick={() => setSelectedCourier(item)}
                    >
                      {isCheapest && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00A86B] text-white">
                          <Star className="w-3 h-3 fill-white stroke-white" />
                          <span className="text-[10px] font-bold tracking-wide">RECOMMENDED — LOWEST PRICE</span>
                        </div>
                      )}
                      {/* Top row: logo + name + mode/weight */}
                      <div className="p-3">
                      <div className="flex items-center gap-3 mb-2.5">
                        <div className="w-9 h-9 rounded-[8px] border border-[#E2E8F0] bg-white flex items-center justify-center shrink-0 overflow-hidden">
                          {logo ? (
                            <img src={logo} alt={item.courierServiceName} className="max-w-full max-h-full object-contain"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          ) : (
                            <Truck className="w-4 h-4 text-[#94A3B8]" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold text-[#0F172A] truncate">{item.courierServiceName}</p>
                          <p className="text-[11px] text-[#64748B] truncate flex items-center gap-1">
                            {isAir ? <Plane className="w-3 h-3" /> : <Truck className="w-3 h-3" />}
                            {item.courierType}
                          </p>
                        </div>
                        {/* Chargeable weight — same for every card, it's the order's own
                            package, not the courier's; the one breakdown lives in the
                            summary card above, so no per-card detail popup here */}
                        <span className="text-[11px] font-semibold text-[#64748B] shrink-0">{chargeableWeight}</span>
                      </div>

                      {/* Info section */}
                      <div className="grid grid-cols-1 gap-1 p-2 bg-[#FAF5FF] rounded-lg font-semibold border-t border-[#E2E8F0] text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-[#64748B]">Est. Pickup Date</span>
                          <span className="text-[#0F172A]">{formatPickupDate(item.pickupDate)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#64748B]">Est. Delivery Date</span>
                          <span className="text-[#0F172A]">{formatDeliveryDate(item.estimatedDeliveryDate)}</span>
                        </div>
                        <div className="flex justify-between relative">
                          <span className="text-[#64748B]">Charges</span>
                          <div className="flex items-center gap-1">
                            <span className="text-[#0F172A]">₹{Number(item.forward?.finalCharges || 0).toFixed(2)}</span>
                            <Info
                              className="w-3.5 h-3.5 text-[#6D28D9] cursor-pointer"
                              onClick={(e) => { e.stopPropagation(); setOpenPopup(openPopup === `charges_${i}` ? null : `charges_${i}`); }}
                            />
                            {openPopup === `charges_${i}` && (
                              <div className={`absolute z-[500] bg-white border border-[#E2E8F0] shadow-xl rounded-lg p-3 w-[190px] right-0 text-[10px] ${i === 0 ? 'top-full mt-2' : 'bottom-full mb-2'}`} onClick={(e) => e.stopPropagation()}>
                                <p className="font-semibold text-[#0F172A] mb-1.5 border-b border-[#F1F5F9] pb-1">Price Details</p>
                                <div className="space-y-1">
                                  <div className="flex justify-between"><span className="text-[#94A3B8]">Freight:</span><span className="font-semibold">₹{Number(item.forward?.charges || 0).toFixed(2)}</span></div>
                                  <div className="flex justify-between"><span className="text-[#94A3B8]">COD:</span><span className="font-semibold">₹{Number(item.cod || 0).toFixed(2)}</span></div>
                                  <div className="flex justify-between"><span className="text-[#94A3B8]">GST:</span><span className="font-semibold">₹{Number(item.forward?.gst || 0).toFixed(2)}</span></div>
                                  <div className="flex justify-between border-t border-[#F1F5F9] pt-1"><span className="font-semibold text-[#0F172A]">Total:</span><span className="font-semibold text-[#00A86B]">₹{Number(item.forward?.finalCharges || 0).toFixed(2)}</span></div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="flex items-center justify-end gap-1 mt-2 text-[#6D28D9] text-[11px] font-semibold">
                          Selected <ChevronRight className="w-3 h-3" />
                        </div>
                      )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* ── Mobile bottom ship button ── */}
            <div className="md:hidden shrink-0 px-3 pb-3 pt-2 bg-gradient-to-t from-white via-white to-transparent">
              <button
                onClick={() => selectedCourier && handleShip(selectedCourier)}
                disabled={!selectedCourier || shippingId !== null}
                className={`w-full h-11 rounded-lg font-semibold text-[13px] text-white bg-[#00A86B] shadow-lg transition-all flex items-center justify-center gap-2 ${(!selectedCourier || shippingId !== null) ? 'opacity-50 cursor-not-allowed' : 'active:bg-[#009B63]'}`}
              >
                {shippingId !== null
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Processing...</>
                  : selectedCourier
                    ? <><Send className="w-4 h-4" />Ship With {selectedCourier.courierServiceName}</>
                    : 'Select a courier to ship'
                }
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
