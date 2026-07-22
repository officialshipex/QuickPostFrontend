import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { MapPin, Package, Calendar as CalendarIcon, CheckCircle2, Navigation, Loader2, AlertCircle } from 'lucide-react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { apiClient } from '../../services/apiClient';

export interface TrackingEvent {
  id: number;
  date: string;
  time: string;
  status: string;
  desc: string;
  location: string;
  active: boolean;
}

export interface TrackingData {
  awb: string;
  orderId: string;
  orderDate: string;
  paymentMode: string;
  orderAmount: number;
  currentStatus: string;
  estimatedDelivery: string;
  courierName: string;
  courierLogo: string;
  events: TrackingEvent[];
}

// ── UTC-based date formatter (matches old UI's TrackingDetailsSection.jsx) ──
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
  return '/brands/default.png';
};

// ── Real API replacing the old fake fetchTrackingData ──
const fetchTrackingData = async (awbNumber: string): Promise<TrackingData> => {
  const res = await apiClient.get(`/orders/GetTrackingByAwb/${awbNumber.trim()}`);
  const d = res.data;

  const courierName = d.courierServiceName || d.courierName || '—';

  // Deduplicate tracking entries by StatusDateTime, keep only those with a timestamp
  const rawTracking: any[] = d.tracking || [];
  const deduped = [...new Map(
    rawTracking.filter((t: any) => t.StatusDateTime).map((t: any) => [t.StatusDateTime, t])
  ).values()].reverse();

  const events: TrackingEvent[] = deduped.map((t: any, idx: number) => {
    const { date, time } = fmtUtc(t.StatusDateTime);
    return {
      id: idx + 1,
      date,
      time,
      status: t.Instructions || t.status || '—',
      desc: t.Instructions || t.status || '',
      location: t.StatusLocation || '',
      active: idx === 0,
    };
  });

  const { date: estDate } = fmtUtc(d.estimatedDeliveryDate);
  const { date: orderDate } = fmtUtc(d.createdAt || d.shipmentCreatedAt);

  return {
    awb: d.awb_number || awbNumber,
    orderId: d.orderId || '—',
    orderDate,
    paymentMode: d.paymentDetails?.method || '—',
    orderAmount: d.paymentDetails?.amount || 0,
    currentStatus: d.status || '—',
    estimatedDelivery: estDate,
    courierName,
    courierLogo: getCourierLogo(courierName),
    events,
  };
};

export function AdminTracking() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [awb, setAwb] = useState(location.state?.awb || searchParams.get('awb') || '');
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const paramAwb = searchParams.get('awb') || location.state?.awb || '';
    if (paramAwb) {
      setAwb(paramAwb);
      handleTrack(paramAwb);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get('awb'), location.state?.awb]);

  const handleTrack = async (trackingAwb: string = awb) => {
    if (!trackingAwb.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchTrackingData(trackingAwb);
      setTrackingData(data);
    } catch (err) {
      setError('Failed to fetch tracking details. Please check the AWB number and try again.');
      setTrackingData(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="w-full max-w-[1400px] mx-auto py-2 space-y-5">

        {/* Search Header */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-5 flex flex-col md:flex-row items-center gap-5">
          <div className="flex items-center shrink-0 pr-4 border-r border-[#E2E8F0]">
            <img src="/logo-color.png" alt="Quickpost" className="h-7" />
          </div>

          <div className="flex-1 w-full">
            <div className="relative flex items-center">
              <input
                type="text"
                value={awb}
                onChange={(e) => setAwb(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
                placeholder="Track your shipment by entering AWB number..."
                className="w-full h-11 pl-4 pr-32 border border-[#E2E8F0] rounded-lg text-[14px] text-[#0F172A] font-medium focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B] shadow-inner bg-[#F8FAFC]/50"
              />
              <button
                onClick={() => handleTrack()}
                disabled={isLoading}
                className="absolute right-1.5 h-8 px-5 bg-[#00A86B] hover:bg-[#009B63] text-white text-[13px] font-bold rounded-md transition-colors shadow-sm disabled:opacity-70 flex items-center gap-2"
              >
                {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Track
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && !trackingData && (
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 flex flex-col items-center justify-center text-[#64748B]">
            <Loader2 className="w-8 h-8 animate-spin text-[#00A86B] mb-4" />
            <p className="font-medium">Fetching tracking details...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="font-medium text-sm">{error}</p>
          </div>
        )}

        {/* Results Section */}
        {trackingData && !isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">

            {/* Left Column: Order Details */}
            <div className="lg:col-span-3 bg-white rounded-xl border border-[#E2E8F0] shadow-[0_2px_10px_rgba(0,0,0,0.02)] h-fit overflow-hidden">
              <div className="px-5 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC]/50 flex items-center gap-2">
                <Package className="w-4 h-4 text-[#64748B]" />
                <h2 className="text-[14px] font-bold text-[#0F172A]">Order Overview</h2>
              </div>

              <div className="p-5">
                <div className="space-y-4 mb-5">
                  <div className="flex justify-between items-start border-b border-[#F1F5F9] pb-3">
                    <p className="text-[12px] text-[#64748B] font-medium">Order ID</p>
                    <p className="text-[13px] font-bold text-[#0F172A]">{trackingData.orderId}</p>
                  </div>
                  <div className="flex justify-between items-start border-b border-[#F1F5F9] pb-3">
                    <p className="text-[12px] text-[#64748B] font-medium">Order Placed</p>
                    <p className="text-[13px] font-bold text-[#0F172A]">{trackingData.orderDate}</p>
                  </div>
                  <div className="flex justify-between items-start border-b border-[#F1F5F9] pb-3">
                    <p className="text-[12px] text-[#64748B] font-medium">Payment Mode</p>
                    <span className="px-2 py-0.5 bg-[#EFF6FF] text-[#2563EB] text-[11px] font-bold rounded">{trackingData.paymentMode}</span>
                  </div>
                  <div className="flex justify-between items-start border-b border-[#F1F5F9] pb-3">
                    <p className="text-[12px] text-[#64748B] font-medium">Order Amount</p>
                    <p className="text-[13px] font-bold text-[#0F172A]">₹{trackingData.orderAmount.toFixed(2)}</p>
                  </div>
                </div>

                <div className="bg-[#FFFBEB] border border-[#FEF3C7] rounded-lg p-3">
                  <p className="text-[11px] text-[#B45309] font-medium leading-relaxed mb-2">
                    To take any action and see complete buyer details, please verify yourself.
                  </p>
                  <button className="text-[12px] font-bold text-[#D97706] hover:underline flex items-center gap-1">
                    Verify via OTP <Navigation className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Tracking Details */}
            <div className="lg:col-span-9 bg-white rounded-xl border border-[#E2E8F0] shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col">

              {/* Status Banner */}
              <div className="bg-gradient-to-r from-[#00A86B]/10 to-[#F0FDF4] border-b border-[#E2E8F0] px-6 py-5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00A86B] opacity-40"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-[#00A86B]"></span>
                    </span>
                    <h2 className="text-[18px] font-extrabold text-[#0F172A] tracking-tight">{trackingData.currentStatus}</h2>
                  </div>
                  <p className="text-[13px] text-[#475569] font-medium flex items-center gap-1.5">
                    <CalendarIcon className="w-3.5 h-3.5" /> Estimated Delivery: <span className="text-[#0F172A] font-bold">{trackingData.estimatedDelivery}</span>
                  </p>
                </div>

                <div className="flex items-center gap-3 bg-white px-3 py-2 rounded-lg border border-[#E2E8F0] shadow-sm">
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Shipped Via</p>
                    <p className="text-[12px] font-bold text-[#0F172A]">{trackingData.courierName}</p>
                  </div>
                  <div className="w-px h-8 bg-[#E2E8F0]"></div>
                  <img src={trackingData.courierLogo} alt={trackingData.courierName} className="h-6 w-auto object-contain" />
                </div>
              </div>

              {/* Timeline Container */}
              <div className="p-6 flex-1 bg-white">
                <div className="flex items-center gap-2 mb-5 pb-3 border-b border-[#F1F5F9]">
                  <MapPin className="w-4 h-4 text-[#00A86B]" />
                  <h3 className="text-[14px] font-bold text-[#0F172A]">Tracking Journey</h3>
                </div>

                {trackingData.events.length === 0 ? (
                  <p className="text-center text-[13px] text-[#94A3B8] py-8">No tracking updates yet.</p>
                ) : (
                  <div className="pl-2">
                    {trackingData.events.map((event, index, arr) => (
                      <div key={event.id} className="relative flex gap-5 pb-6 last:pb-0">
                        {/* Timeline Line */}
                        {index !== arr.length - 1 && (
                          <div className="absolute left-[9px] top-6 bottom-0 w-px bg-[#E2E8F0]" />
                        )}

                        {/* Timeline Dot */}
                        <div className="relative z-10 mt-1">
                          {event.active ? (
                            <div className="w-5 h-5 rounded-full bg-[#00A86B] flex items-center justify-center shadow-[0_0_0_4px_rgba(0,168,107,0.1)]">
                              <CheckCircle2 className="w-3 h-3 text-white" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-white border-2 border-[#CBD5E1]" />
                          )}
                        </div>

                        {/* Timeline Content */}
                        <div className={`flex-1 ${event.active ? 'opacity-100' : 'opacity-75'}`}>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1 gap-1">
                            <h4 className={`text-[14px] font-bold ${event.active ? 'text-[#00A86B]' : 'text-[#0F172A]'}`}>
                              {event.status}
                            </h4>
                            <span className="text-[12px] font-semibold text-[#64748B]">
                              {event.date} <span className="font-normal mx-1">•</span> {event.time}
                            </span>
                          </div>
                          <p className="text-[13px] text-[#475569] leading-relaxed mb-1">
                            {event.desc}
                          </p>
                          {event.location && (
                            <p className="text-[12px] font-medium text-[#94A3B8] flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {event.location}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            </div>

          </div>
        )}

      </div>
    </AdminLayout>
  );
}
