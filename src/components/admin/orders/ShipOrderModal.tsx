import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, Plane, Info, X, ArrowRight, Loader2, Send } from 'lucide-react';
import { apiClient } from '../../../services/apiClient';
import { TableLoader } from '../../ui/TableLoader';

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

export function ShipOrderModal({ order, onClose, onShipped }: ShipOrderModalProps) {
  const [loading, setLoading] = useState(true);
  const [rates, setRates] = useState<RateItem[]>([]);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [shippingId, setShippingId] = useState<string | null>(null);
  const [hoveredInfo, setHoveredInfo] = useState<string | null>(null);
  const [hoveredWeight, setHoveredWeight] = useState<string | null>(null);
  const [error, setError] = useState('');

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
    setShippingId(item._id); setError('');
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
      setError(
        err?.response?.data?.error?.message ||
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Something went wrong'
      );
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
          className="w-full max-w-6xl h-full md:h-auto max-h-full md:max-h-[90vh] bg-[#F8FAFC] rounded-none md:rounded-[16px] shadow-[0_40px_80px_-16px_rgba(0,0,0,0.25)] overflow-hidden flex flex-col border-0 md:border md:border-[#E2E8F0]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header ── */}
          <div className="px-4 md:px-5 py-3 md:py-3.5 bg-white border-b border-[#E2E8F0] flex items-center justify-between shrink-0">
            <div className={`${TXT.label} text-[#0F172A]`}>
              Order ID : <span className="text-[#00A86B]">{orderDetails?.orderId || order?.orderId || '—'}</span>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-[#64748B] hover:bg-[#F1F5F9] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* ── Summary strip ── */}
          <div className="mx-3 md:mx-5 mt-3 md:mt-4 bg-white border border-[#E2E8F0] rounded-[12px] px-4 md:px-6 py-3 md:py-4 grid grid-cols-2 gap-4 md:gap-6 shrink-0">

            {/* FROM with address hover */}
            <div>
              <p className={`${TXT.label} text-[#94A3B8] mb-1.5`}>From</p>
              <div className="relative group inline-block">
                <p className={`${TXT.label} text-[#0F172A] uppercase border-b border-dashed border-[#94A3B8] cursor-default`}>
                  {pickupCity}{pickupState ? `, ${pickupState}` : ''}
                </p>
                {pickup && (
                  <div className="absolute z-[200] hidden group-hover:block bg-white text-[#475569] text-[10px] p-3 rounded-lg border border-[#E2E8F0] shadow-2xl w-64 top-1/2 left-full ml-3 -translate-y-1/2 whitespace-normal leading-relaxed pointer-events-none">
                    {pickup.contactName && <p className="font-semibold text-[#0F172A] mb-1">{pickup.contactName}</p>}
                    {pickup.address    && <p>{pickup.address}</p>}
                    <p>{[pickup.city, pickup.state].filter(Boolean).join(', ')}{pickup.pinCode ? ` - ${pickup.pinCode}` : ''}</p>
                    {pickup.phoneNumber && <p className="mt-1 text-[#64748B]">{pickup.phoneNumber}</p>}
                  </div>
                )}
              </div>
              <p className={`${TXT.value} text-[#94A3B8] mt-0.5`}>{pickupPin}</p>
            </div>

            <div className="flex items-center gap-3">
              <ArrowRight className="w-4 h-4 text-[#CBD5E1] hidden md:block shrink-0" />
              {/* TO with address hover */}
              <div>
                <p className={`${TXT.label} text-[#94A3B8] mb-1.5`}>To</p>
                <div className="relative group inline-block">
                  <p className={`${TXT.label} text-[#0F172A] uppercase border-b border-dashed border-[#94A3B8] cursor-default`}>
                    {deliveryCity}{deliveryState ? `, ${deliveryState}` : ''}
                  </p>
                  {delivery && (
                    <div className="absolute z-[200] hidden group-hover:block bg-white text-[#475569] text-[10px] p-3 rounded-lg border border-[#E2E8F0] shadow-2xl w-64 top-1/2 right-full mr-3 -translate-y-1/2 whitespace-normal leading-relaxed pointer-events-none">
                      {delivery.contactName && <p className="font-semibold text-[#0F172A] mb-1">{delivery.contactName}</p>}
                      {delivery.address    && <p>{delivery.address}</p>}
                      <p>{[delivery.city, delivery.state].filter(Boolean).join(', ')}{delivery.pinCode ? ` - ${delivery.pinCode}` : ''}</p>
                      {delivery.phoneNumber && <p className="mt-1 text-[#64748B]">{delivery.phoneNumber}</p>}
                    </div>
                  )}
                </div>
                <p className={`${TXT.value} text-[#94A3B8] mt-0.5`}>{deliveryPin}</p>
              </div>
            </div>

            <div className="md:border-l md:border-[#E2E8F0] md:pl-6">
              <p className={`${TXT.label} text-[#94A3B8] mb-1.5`}>Order Value</p>
              <p className={`${TXT.label} text-[#0F172A]`}>₹{Number(orderValue).toFixed(2)}</p>
              {paymentMethod && <p className={`${TXT.value} text-[#94A3B8] mt-0.5 uppercase`}>{paymentMethod}</p>}
            </div>

            {/* Weight with detail hover */}
            <div className="md:border-l md:border-[#E2E8F0] md:pl-6">
              <p className={`${TXT.label} text-[#94A3B8] mb-1.5`}>Weight</p>
              <div className="relative group inline-block">
                <p className={`${TXT.label} text-[#0F172A] border-b border-dashed border-[#94A3B8] cursor-default`}>
                  {applicableWeight} kg
                </p>
                {pkg && (
                  <div className="absolute z-[200] hidden group-hover:block bg-white text-[#475569] text-[10px] p-3 rounded-lg border border-[#E2E8F0] shadow-2xl w-56 top-1/2 right-full mr-3 -translate-y-1/2 whitespace-normal leading-relaxed pointer-events-none">
                    <p className="font-semibold text-[#0F172A] mb-1.5 border-b border-[#F1F5F9] pb-1">Weight Details</p>
                    <div className="space-y-1">
                      <div className="flex justify-between"><span className="text-[#94A3B8]">Dead Weight:</span><span className="font-semibold">{pkg.weight || pkg.applicableWeight} kg</span></div>
                      {volW && <>
                        <div className="flex justify-between"><span className="text-[#94A3B8]">L × W × H:</span><span className="font-semibold">{volW.length}×{volW.width}×{volW.height}</span></div>
                        <div className="flex justify-between"><span className="text-[#94A3B8]">Volumetric:</span><span className="font-semibold">{volWeightKg} kg</span></div>
                      </>}
                      <div className="flex justify-between border-t border-[#F1F5F9] pt-1"><span className="text-[#0F172A] font-semibold">Applicable:</span><span className="font-semibold text-[#00A86B]">{pkg.applicableWeight} kg</span></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Error banner ── */}
          {error && (
            <div className="mx-3 md:mx-5 mt-2 px-4 py-2 bg-[#FEF2F2] border border-[#FECACA] rounded-lg">
              <p className="text-[12px] text-[#EF4444] font-medium">{error}</p>
            </div>
          )}

          {/* ── Courier list (desktop table) ── */}
          <div className="hidden md:flex flex-1 min-h-0 mx-5 my-4 bg-white border border-[#E2E8F0] rounded-[12px] overflow-hidden flex-col">
            <div className="grid grid-cols-[1.6fr_0.8fr_1.1fr_1.1fr_1fr_1fr_0.9fr] gap-2 px-5 py-3 bg-[#00A86B] text-white shrink-0">
              <span className={TXT.label}>Courier Partner</span>
              <span className={`${TXT.label} text-center`}>Mode</span>
              <span className={`${TXT.label} text-center`}>Est. Pickup</span>
              <span className={`${TXT.label} text-center`}>Est. Delivery</span>
              <span className={`${TXT.label} text-center`}>Chargeable Wt.</span>
              <span className={`${TXT.label} text-center`}>Charges</span>
              <span className={`${TXT.label} text-center`}>Action</span>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="relative h-48">
                  <TableLoader />
                </div>
              ) : rates.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 py-16">
                  <Truck className="w-8 h-8 text-[#CBD5E1]" />
                  <p className={`${TXT.value} text-[#94A3B8]`}>No courier options available for this pincode.</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {rates.map((item, i) => {
                    const logo = getLogoForCourier(item.courierServiceName);
                    const isAir = item.courierType === 'Domestic (Air)';
                    const chargeableWeight = getChargeableWeight(item.courierServiceName, applicableWeight);
                    return (
                      <motion.div
                        key={item._id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: Math.min(i * 0.04, 0.3) }}
                        className={`grid grid-cols-[1.6fr_0.8fr_1.1fr_1.1fr_1fr_1fr_0.9fr] gap-2 items-center px-5 py-3.5 border-b border-[#F1F5F9] last:border-0 transition-colors ${item.isRecommended ? 'bg-[#F0FDF4]' : 'hover:bg-[#F8FAFC]'}`}
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
                            <p className={`${TXT.label} text-[#0F172A] truncate`}>{item.courierServiceName}</p>
                            <p className={`${TXT.value} text-[#94A3B8] truncate`}>{item.courierType}</p>
                          </div>
                        </div>

                        {/* Mode icon */}
                        <div className="flex justify-center text-[#64748B]">
                          {isAir ? <Plane className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
                        </div>

                        {/* Dates */}
                        <p className={`${TXT.value} text-center text-[#475569]`}>{formatPickupDate(item.pickupDate)}</p>
                        <p className={`${TXT.value} text-center text-[#475569]`}>{formatDeliveryDate(item.estimatedDeliveryDate)}</p>

                        {/* Chargeable weight with hover detail — same dark style as price */}
                        <div className="flex justify-center">
                          <div
                            className="relative inline-block"
                            onMouseEnter={() => setHoveredWeight(String(i))}
                            onMouseLeave={() => setHoveredWeight(null)}
                          >
                            <span className={`${TXT.value} text-[#475569] border-b border-dashed border-[#94A3B8] cursor-help`}>
                              {chargeableWeight}
                            </span>
                            <AnimatePresence>
                              {hoveredWeight === String(i) && pkg && (
                                <motion.div
                                  initial={{ opacity: 0, y: 4, scale: 0.96 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: 4, scale: 0.96 }}
                                  transition={{ duration: 0.12 }}
                                  className={`absolute z-20 ${i === 0 ? 'top-full mt-2' : 'bottom-full mb-2'} right-0 w-52 bg-[#0F172A] text-white rounded-[10px] p-3 shadow-xl`}
                                >
                                  <p className={`${TXT.label} text-slate-300 mb-1.5 border-b border-slate-700 pb-1.5`}>Weight Detail</p>
                                  {[
                                    { label: 'Dead Weight', val: `${pkg.weight || pkg.applicableWeight} kg` },
                                    ...(volW ? [
                                      { label: 'Volumetric', val: `${volWeightKg} kg` },
                                      { label: 'L × W × H', val: `${volW.length}×${volW.width}×${volW.height}` },
                                    ] : []),
                                  ].map((b) => (
                                    <div key={b.label} className="flex justify-between items-center py-0.5">
                                      <span className={`${TXT.value} text-slate-400`}>{b.label}</span>
                                      <span className={`${TXT.value} text-white`}>{b.val}</span>
                                    </div>
                                  ))}
                                  <div className="flex justify-between items-center border-t border-slate-700 mt-1 pt-1">
                                    <span className={`${TXT.label} text-slate-300`}>Applicable</span>
                                    <span className={`${TXT.label} text-[#00A86B]`}>{pkg.applicableWeight} kg</span>
                                  </div>
                                  <div className={`absolute ${i === 0 ? '-top-1.5' : '-bottom-1.5'} right-3 w-2.5 h-2.5 bg-[#0F172A] rotate-45`} />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>

                        {/* Charges + price breakup hover */}
                        <div className="flex items-center justify-center gap-1.5 relative">
                          <span className={`${TXT.label} text-[#0F172A]`}>₹{Number(item.forward?.finalCharges || 0).toFixed(2)}</span>
                          <div
                            className="relative"
                            onMouseEnter={() => setHoveredInfo(String(i))}
                            onMouseLeave={() => setHoveredInfo(null)}
                          >
                            <Info className="w-3.5 h-3.5 text-[#00A86B] cursor-help" />
                            <AnimatePresence>
                              {hoveredInfo === String(i) && (
                                <motion.div
                                  initial={{ opacity: 0, y: 4, scale: 0.96 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: 4, scale: 0.96 }}
                                  transition={{ duration: 0.12 }}
                                  className={`absolute z-20 ${i === 0 ? 'top-full mt-2' : 'bottom-full mb-2'} right-0 w-52 bg-[#0F172A] text-white rounded-[10px] p-3 shadow-xl`}
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
                                  <div className={`absolute ${i === 0 ? '-top-1.5' : '-bottom-1.5'} right-3 w-2.5 h-2.5 bg-[#0F172A] rotate-45`} />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>

                        {/* Ship Now button with icon */}
                        <div className="flex justify-center">
                          <button
                            onClick={() => handleShip(item)}
                            disabled={shippingId !== null}
                            className={`h-8 px-4 rounded-full bg-[#00A86B] text-white ${TXT.label} hover:bg-[#009B63] transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 min-w-[96px]`}
                          >
                            {shippingId === item._id
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

          {/* ── Courier list (mobile cards) ── */}
          <div className="md:hidden flex-1 min-h-0 mx-3 my-3 overflow-y-auto space-y-2.5">
            {loading ? (
              <div className="relative h-48 bg-white rounded-[12px] border border-[#E2E8F0]">
                <TableLoader />
              </div>
            ) : rates.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 gap-2 bg-white rounded-[12px] border border-[#E2E8F0]">
                <Truck className="w-8 h-8 text-[#CBD5E1]" />
                <p className={`${TXT.value} text-[#94A3B8]`}>No courier options available for this pincode.</p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {rates.map((item, i) => {
                  const logo = getLogoForCourier(item.courierServiceName);
                  const isAir = item.courierType === 'Domestic (Air)';
                  const chargeableWeight = getChargeableWeight(item.courierServiceName, applicableWeight);
                  return (
                    <motion.div
                      key={item._id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: Math.min(i * 0.04, 0.3) }}
                      className={`rounded-[12px] border p-3 ${item.isRecommended ? 'bg-[#F0FDF4] border-[#00A86B]/30' : 'bg-white border-[#E2E8F0]'}`}
                    >
                      <div className="flex items-center gap-2.5 mb-2.5">
                        <div className="w-9 h-9 rounded-[8px] border border-[#E2E8F0] bg-white flex items-center justify-center shrink-0 overflow-hidden">
                          {logo ? (
                            <img src={logo} alt={item.courierServiceName} className="max-w-full max-h-full object-contain"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          ) : (
                            <Truck className="w-4 h-4 text-[#94A3B8]" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`${TXT.label} text-[#0F172A] truncate`}>{item.courierServiceName}</p>
                          <div className="flex items-center gap-1 text-[#64748B]">
                            {isAir ? <Plane className="w-3 h-3" /> : <Truck className="w-3 h-3" />}
                            <p className={`${TXT.value} truncate`}>{item.courierType}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`${TXT.label} text-[#0F172A]`}>₹{Number(item.forward?.finalCharges || 0).toFixed(2)}</p>
                          <p className={`${TXT.value} text-[#94A3B8]`}>{chargeableWeight}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-3 bg-[#F8FAFC] rounded-[8px] px-3 py-2">
                        <div>
                          <p className={`${TXT.value} text-[#94A3B8]`}>Est. Pickup</p>
                          <p className={`${TXT.label} text-[#475569]`}>{formatPickupDate(item.pickupDate)}</p>
                        </div>
                        <div>
                          <p className={`${TXT.value} text-[#94A3B8]`}>Est. Delivery</p>
                          <p className={`${TXT.label} text-[#475569]`}>{formatDeliveryDate(item.estimatedDeliveryDate)}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleShip(item)}
                        disabled={shippingId !== null}
                        className={`w-full h-9 rounded-full bg-[#00A86B] text-white ${TXT.label} hover:bg-[#009B63] active:bg-[#009B63] transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-1.5`}
                      >
                        {shippingId === item._id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <><Send className="w-3 h-3" />Ship Now</>
                        }
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
