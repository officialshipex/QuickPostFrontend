import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, Info, X, ArrowRight, Loader2 } from 'lucide-react';
import { apiClient } from '../../../services/apiClient';

// ─── Type scale — 14px semibold titles, 12px semibold labels, 12px regular body ──
const TXT = {
  title: 'text-[14px] font-semibold',
  label: 'text-[12px] font-semibold',
  value: 'text-[12px] font-normal',
};

const LOGO_MAP: Record<string, string> = {
  'Delhivery': '/brands/delhivery.png',
  'Dtdc': '/brands/dtdc.png',
  'DTDC': '/brands/dtdc.png',
  'Ekart': '/brands/ekart.png',
  'Bluedart': '/brands/bluedart.png',
  'Blue Dart': '/brands/bluedart.png',
  'BlueDart': '/brands/bluedart.png',
  'Shadowfax': '/brands/shadowfax.png',
  'Shiprocket': '/brands/shiprocket.jpg',
  'Shree Maruti': '/brands/shree_maruti.jpg',
  'XpressBees': '/brands/xpressbees.png',
  'Xpressbees': '/brands/xpressbees.png',
};

interface CourierOption {
  id: string;
  name: string;
  mode: string;
  logo: string;
  estimatedPickupDate: string | null;
  estimatedDeliveryDate: string | null;
  chargeableWeight: string;
  charges: number;
  chargeBreakup?: { label: string; amount: number }[];
}

interface ShipOrderModalProps {
  order: any;
  onClose: () => void;
  onShipped?: (courier: CourierOption) => void;
}

export function ShipOrderModal({ order, onClose, onShipped }: ShipOrderModalProps) {
  const [loading, setLoading] = useState(true);
  const [couriers, setCouriers] = useState<CourierOption[]>([]);
  const [shippingId, setShippingId] = useState<string | null>(null);
  const [hoveredInfo, setHoveredInfo] = useState<string | null>(null);
  const [error, setError] = useState('');

  const orderValue = order?.payment ?? order?.orderValue ?? order?.amount ?? order?.totalAmount ?? 0;
  const isCod = (order?.paymentType || '').toLowerCase().includes('cod');

  useEffect(() => {
    let cancelled = false;
    const fetchRates = async () => {
      setLoading(true);
      setError('');
      try {
        // TODO: backend endpoint for courier rate options is not yet finalized —
        // swap this for the real route once confirmed (e.g. /shipping/getCourierRates).
        const res = await apiClient.get('/shipping/getCourierRates', {
          params: { orderId: order?._id || order?.orderId },
        });
        if (!cancelled) {
          const options: CourierOption[] = (res.data?.couriers || []).map((c: any) => ({
            id: c._id || c.id || `${c.courierName}-${c.mode}`,
            name: c.courierName || c.name,
            mode: c.mode || c.courierType || 'Domestic (Surface)',
            logo: LOGO_MAP[c.courierName] || LOGO_MAP[c.name] || '',
            estimatedPickupDate: c.estimatedPickupDate || null,
            estimatedDeliveryDate: c.estimatedDeliveryDate || null,
            chargeableWeight: c.chargeableWeight || order?.weight || '—',
            charges: Number(c.charges || c.totalCharge || 0),
            chargeBreakup: c.chargeBreakup,
          }));
          setCouriers(options);
        }
      } catch (err) {
        if (!cancelled) setError('Failed to load courier options. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchRates();
    return () => { cancelled = true; };
  }, [order]);

  const sortedCouriers = useMemo(
    () => [...couriers].sort((a, b) => a.charges - b.charges),
    [couriers]
  );

  const handleShip = async (courier: CourierOption) => {
    setShippingId(courier.id);
    setError('');
    try {
      // TODO: backend endpoint for booking a shipment is not yet finalized —
      // swap this for the real route once confirmed (e.g. /shipping/bookShipment).
      await apiClient.post('/shipping/bookShipment', {
        orderId: order?._id || order?.orderId,
        courierId: courier.id,
        courierName: courier.name,
        mode: courier.mode,
      });
      onShipped?.(courier);
      onClose();
    } catch (err) {
      setError(`Failed to ship with ${courier.name}. Please try again.`);
    } finally {
      setShippingId(null);
    }
  };

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          className="w-full max-w-6xl max-h-[90vh] bg-[#F8FAFC] rounded-[16px] shadow-[0_40px_80px_-16px_rgba(0,0,0,0.25)] overflow-hidden flex flex-col border border-[#E2E8F0]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header: Order ID + Close ── */}
          <div className="px-5 py-3.5 bg-white border-b border-[#E2E8F0] flex items-center justify-between shrink-0">
            <div className={`${TXT.label} text-[#0F172A]`}>
              Order ID : <span className="text-[#00A86B]">{order?.userUserId || order?.orderId || '—'}</span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#64748B] hover:bg-[#F1F5F9] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* ── Summary strip ── */}
          <div className="mx-5 mt-4 bg-white border border-[#E2E8F0] rounded-[12px] px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-6 shrink-0">
            <div>
              <p className={`${TXT.label} text-[#94A3B8] mb-1.5`}>From</p>
              <p className={`${TXT.label} text-[#0F172A] uppercase`}>{order?.pickupCity || '—'}{order?.pickupState ? `, ${order.pickupState}` : ''}</p>
              <p className={`${TXT.value} text-[#94A3B8] mt-0.5 underline decoration-dotted underline-offset-2`}>{order?.pickupPinCode || '—'}</p>
            </div>

            <div className="flex items-center gap-3">
              <ArrowRight className="w-4 h-4 text-[#CBD5E1] hidden md:block shrink-0" />
              <div>
                <p className={`${TXT.label} text-[#94A3B8] mb-1.5`}>To</p>
                <p className={`${TXT.label} text-[#0F172A] uppercase`}>{order?.customerCity || '—'}{order?.customerState ? `, ${order.customerState}` : ''}</p>
                <p className={`${TXT.value} text-[#94A3B8] mt-0.5 underline decoration-dotted underline-offset-2`}>{order?.customerPinCode || '—'}</p>
              </div>
            </div>

            <div className="md:border-l md:border-[#E2E8F0] md:pl-6">
              <p className={`${TXT.label} text-[#94A3B8] mb-1.5`}>Order Value</p>
              <p className={`${TXT.label} text-[#0F172A]`}>₹{Number(orderValue || 0).toFixed(2)}</p>
              {isCod && <p className={`${TXT.value} text-[#94A3B8] mt-0.5`}>COD</p>}
            </div>

            <div className="md:border-l md:border-[#E2E8F0] md:pl-6">
              <p className={`${TXT.label} text-[#94A3B8] mb-1.5`}>Weight</p>
              <p className={`${TXT.label} text-[#0F172A] underline decoration-dotted underline-offset-2`}>{order?.weight || '—'}</p>
            </div>
          </div>

          {/* ── Courier table ── */}
          <div className="flex-1 min-h-0 mx-5 my-4 bg-white border border-[#E2E8F0] rounded-[12px] overflow-hidden flex flex-col">
            <div className="grid grid-cols-[1.6fr_0.8fr_1.1fr_1.1fr_1fr_1fr_0.9fr] gap-2 px-5 py-3 bg-[#00A86B] text-white shrink-0">
              <span className={TXT.label}>Courier Partner</span>
              <span className={`${TXT.label} text-center`}>Mode</span>
              <span className={`${TXT.label} text-center`}>Estimated Pickup Date</span>
              <span className={`${TXT.label} text-center`}>Estimated Delivery Date</span>
              <span className={`${TXT.label} text-center`}>Chargeable Weight</span>
              <span className={`${TXT.label} text-center`}>Charges</span>
              <span className={`${TXT.label} text-center`}>Action</span>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 py-16">
                  <Loader2 className="w-6 h-6 text-[#00A86B] animate-spin" />
                  <p className={`${TXT.value} text-[#94A3B8]`}>Fetching best courier rates…</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 py-16">
                  <p className={`${TXT.value} text-[#EF4444]`}>{error}</p>
                </div>
              ) : sortedCouriers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 py-16">
                  <Truck className="w-8 h-8 text-[#CBD5E1]" />
                  <p className={`${TXT.value} text-[#94A3B8]`}>No courier options available for this order.</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {sortedCouriers.map((c, i) => (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: Math.min(i * 0.04, 0.3) }}
                      className="grid grid-cols-[1.6fr_0.8fr_1.1fr_1.1fr_1fr_1fr_0.9fr] gap-2 items-center px-5 py-3.5 border-b border-[#F1F5F9] last:border-0 hover:bg-[#F8FAFC] transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-[8px] border border-[#E2E8F0] bg-white flex items-center justify-center shrink-0 overflow-hidden">
                          {c.logo ? (
                            <img
                              src={c.logo}
                              alt={c.name}
                              className="max-w-full max-h-full object-contain"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          ) : (
                            <Truck className="w-4 h-4 text-[#94A3B8]" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className={`${TXT.label} text-[#0F172A] truncate`}>{c.name}</p>
                          <p className={`${TXT.value} text-[#94A3B8] truncate`}>{c.mode}</p>
                        </div>
                      </div>

                      <div className="flex justify-center text-[#64748B]">
                        <Truck className="w-4 h-4" />
                      </div>

                      <p className={`${TXT.value} text-center text-[#475569]`}>{c.estimatedPickupDate || '—'}</p>
                      <p className={`${TXT.value} text-center text-[#475569]`}>{c.estimatedDeliveryDate || '—'}</p>
                      <p className={`${TXT.value} text-center text-[#475569] underline decoration-dotted underline-offset-2`}>{c.chargeableWeight}</p>

                      <div className="flex items-center justify-center gap-1.5 relative">
                        <span className={`${TXT.label} text-[#0F172A]`}>₹{c.charges.toFixed(2)}</span>
                        {c.chargeBreakup && c.chargeBreakup.length > 0 && (
                          <div
                            className="relative"
                            onMouseEnter={() => setHoveredInfo(c.id)}
                            onMouseLeave={() => setHoveredInfo(null)}
                          >
                            <Info className="w-3.5 h-3.5 text-[#94A3B8] cursor-help" />
                            <AnimatePresence>
                              {hoveredInfo === c.id && (
                                <motion.div
                                  initial={{ opacity: 0, y: 4, scale: 0.96 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: 4, scale: 0.96 }}
                                  transition={{ duration: 0.12 }}
                                  className="absolute z-20 bottom-full right-0 mb-2 w-52 bg-[#0F172A] text-white rounded-[10px] p-3 shadow-xl"
                                >
                                  {c.chargeBreakup.map((b, bi) => (
                                    <div key={bi} className="flex justify-between items-center py-0.5">
                                      <span className={`${TXT.value} text-slate-300`}>{b.label}</span>
                                      <span className={`${TXT.label} text-white`}>₹{b.amount.toFixed(2)}</span>
                                    </div>
                                  ))}
                                  <div className="absolute -bottom-1.5 right-3 w-2.5 h-2.5 bg-[#0F172A] rotate-45" />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-center">
                        <button
                          onClick={() => handleShip(c)}
                          disabled={shippingId !== null}
                          className={`h-8 px-4 rounded-full bg-[#00A86B] text-white ${TXT.label} hover:bg-[#009B63] transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 min-w-[92px]`}
                        >
                          {shippingId === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Ship Now'}
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
