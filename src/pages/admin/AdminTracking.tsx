import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import {
  MapPin, Package, Calendar as CalendarIcon, CheckCircle2, Loader2, AlertCircle,
  Search, Copy, Check, Truck, Warehouse, ScanLine, PackageCheck, Home, CreditCard,
  ChevronRight, Clock, ShieldAlert,
} from 'lucide-react';
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

// ── Status → visual language (matches the palette convention used across admin pages) ──
const STATUS_STYLES: Record<string, { chip: string; dot: string; ring: string }> = {
  'Delivered':          { chip: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', ring: 'rgba(16,185,129,0.12)' },
  'RTO Delivered':       { chip: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', ring: 'rgba(16,185,129,0.12)' },
  'Out for Delivery':    { chip: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500', ring: 'rgba(245,158,11,0.12)' },
  'In Transit':          { chip: 'bg-sky-50 text-sky-700 border-sky-200', dot: 'bg-sky-500', ring: 'rgba(14,165,233,0.12)' },
  'In-transit':          { chip: 'bg-sky-50 text-sky-700 border-sky-200', dot: 'bg-sky-500', ring: 'rgba(14,165,233,0.12)' },
  'Picked Up':           { chip: 'bg-indigo-50 text-indigo-700 border-indigo-200', dot: 'bg-indigo-500', ring: 'rgba(99,102,241,0.12)' },
  'Ready To Ship':       { chip: 'bg-teal-50 text-teal-700 border-teal-200', dot: 'bg-teal-500', ring: 'rgba(20,184,166,0.12)' },
  'Booked':              { chip: 'bg-slate-50 text-slate-700 border-slate-200', dot: 'bg-slate-400', ring: 'rgba(100,116,139,0.12)' },
  'RTO Initiated':       { chip: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-500', ring: 'rgba(249,115,22,0.12)' },
  'RTO In Transit':      { chip: 'bg-orange-50 text-orange-600 border-orange-200', dot: 'bg-orange-500', ring: 'rgba(249,115,22,0.12)' },
  'Undelivered':         { chip: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500', ring: 'rgba(245,158,11,0.12)' },
  'Cancelled':           { chip: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500', ring: 'rgba(239,68,68,0.12)' },
  'Lost':                { chip: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500', ring: 'rgba(239,68,68,0.12)' },
};
const DEFAULT_STATUS_STYLE = { chip: 'bg-slate-50 text-slate-600 border-slate-200', dot: 'bg-slate-400', ring: 'rgba(100,116,139,0.12)' };

// ── Coarse journey stages, used to render the top progress rail ──
const STAGE_DEFS = [
  { key: 'booked',   label: 'Booked',    icon: Package,      match: ['booked', 'ready to ship', 'pickup scheduled'] },
  { key: 'picked',   label: 'Picked Up', icon: ScanLine,      match: ['picked up', 'pickup'] },
  { key: 'transit',  label: 'In Transit',icon: Truck,         match: ['in transit', 'in-transit', 'transit', 'hub'] },
  { key: 'ofd',      label: 'Out For Delivery', icon: Warehouse, match: ['out for delivery'] },
  { key: 'delivered',label: 'Delivered', icon: PackageCheck,  match: ['delivered'] },
];

const resolveStageIndex = (status: string): number => {
  const s = (status || '').toLowerCase();
  // Must run before the substring loop below: 'undelivered' contains
  // 'delivered' as a substring, so it would otherwise match the LAST stage
  // ('delivered', matched via s.includes('delivered')) since the loop scans
  // backward from the end — incorrectly showing the rail as fully complete
  // for a failed delivery attempt instead of treating it as an exception.
  if (s.includes('rto') || s.includes('cancel') || s.includes('lost') || s === 'undelivered') return -1;
  for (let i = STAGE_DEFS.length - 1; i >= 0; i--) {
    if (STAGE_DEFS[i].match.some((m) => s.includes(m))) return i;
  }
  return 0;
};

function ProgressRail({ status }: { status: string }) {
  const activeIdx = resolveStageIndex(status);
  const isException = activeIdx === -1;

  return (
    <div className="-mx-1 px-1 overflow-x-auto sm:overflow-visible [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex items-center w-full min-w-[520px] sm:min-w-0">
        {STAGE_DEFS.map((stage, i) => {
          const Icon = stage.icon;
          const done = !isException && i <= activeIdx;
          const isCurrent = !isException && i === activeIdx;
          return (
            <div key={stage.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-2 shrink-0 w-[76px] sm:w-auto">
                <div
                  className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center border-2 transition-colors ${
                    done
                      ? 'bg-[#00A86B] border-[#00A86B] text-white'
                      : 'bg-white border-slate-200 text-slate-300'
                  }`}
                >
                  {isCurrent && (
                    <span className="absolute inset-0 rounded-full bg-[#00A86B] opacity-30 animate-ping" />
                  )}
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 relative z-10" strokeWidth={2.25} />
                </div>
                <span className={`text-[10px] sm:text-[10.5px] font-semibold text-center leading-tight ${done ? 'text-[#0F172A]' : 'text-slate-400'}`}>
                  {stage.label}
                </span>
              </div>
              {i < STAGE_DEFS.length - 1 && (
                <div className="flex-1 h-[2px] mx-1 sm:mx-1.5 -mt-5 rounded-full overflow-hidden bg-slate-200 min-w-[16px]">
                  <div
                    className="h-full bg-[#00A86B] transition-all duration-500"
                    style={{ width: !isException && i < activeIdx ? '100%' : '0%' }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const STAT_ICON_STYLE = 'w-8 h-8 rounded-lg flex items-center justify-center shrink-0';

export function AdminTracking() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [awb, setAwb] = useState(location.state?.awb || searchParams.get('awb') || '');
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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

  const copyAwb = () => {
    if (!trackingData) return;
    navigator.clipboard.writeText(trackingData.awb);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const statusStyle = trackingData ? (STATUS_STYLES[trackingData.currentStatus] ?? DEFAULT_STATUS_STYLE) : DEFAULT_STATUS_STYLE;
  const isException = trackingData ? resolveStageIndex(trackingData.currentStatus) === -1 : false;

  return (
    <AdminLayout>
      <div className="w-full max-w-[1400px] mx-auto py-2 space-y-5">

        {/* Search Header */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-1">
            <Truck className="w-4 h-4 text-[#00A86B]" />
            <h1 className="text-[15px] font-bold text-[#0F172A]">Shipment Tracking</h1>
          </div>
          <p className="text-[12px] text-[#64748B] mb-4">Look up any shipment's live courier status using its AWB number.</p>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-[16px] h-[16px] absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="text"
                value={awb}
                onChange={(e) => setAwb(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
                placeholder="Enter AWB number, e.g. QPSP0000000617"
                className="w-full h-11 pl-10 pr-4 border border-[#E2E8F0] rounded-lg text-[13.5px] text-[#0F172A] font-medium focus:outline-none focus:border-[#00A86B] focus:ring-4 focus:ring-[#00A86B]/10 bg-[#F8FAFC] focus:bg-white transition-colors"
              />
            </div>
            <button
              onClick={() => handleTrack()}
              disabled={isLoading}
              className="h-11 px-6 bg-[#00A86B] hover:bg-[#009B63] text-white text-[13px] font-bold rounded-lg transition-colors shadow-sm disabled:opacity-70 flex items-center justify-center gap-2 shrink-0"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Track Shipment
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && !trackingData && (
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-16 flex flex-col items-center justify-center text-[#64748B]">
            <Loader2 className="w-7 h-7 animate-spin text-[#00A86B] mb-3" />
            <p className="text-[12.5px] font-medium">Fetching tracking details…</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-[12.5px] font-medium">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!trackingData && !isLoading && !error && (
          <div className="bg-white rounded-xl border border-dashed border-[#E2E8F0] p-16 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#F0FDF4] flex items-center justify-center mb-4">
              <Truck className="w-6 h-6 text-[#00A86B]" />
            </div>
            <h3 className="text-[14px] font-bold text-[#0F172A] mb-1">No shipment looked up yet</h3>
            <p className="text-[12.5px] text-[#94A3B8] max-w-[320px]">Enter an AWB number above to pull live courier status, journey history, and order details.</p>
          </div>
        )}

        {/* Results Section */}
        {trackingData && !isLoading && (
          <div className="space-y-5 animate-fade-in">

            {/* ── Status Hero ── */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden">
              <div className="px-4 sm:px-6 pt-5 pb-6 border-b border-[#F1F5F9]">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center shrink-0 overflow-hidden">
                      <img src={trackingData.courierLogo} alt={trackingData.courierName} className="max-w-[26px] max-h-[26px] sm:max-w-[30px] sm:max-h-[30px] object-contain" />
                    </div>
                    <div className="min-w-0">
                      <div className={`inline-flex items-center gap-1.5 text-[10.5px] sm:text-[11px] font-bold px-2.5 py-1 rounded-full border ${statusStyle.chip} mb-1`}>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusStyle.dot} ${isException ? '' : 'animate-pulse'}`} />
                        {trackingData.currentStatus}
                      </div>
                      <h2 className="text-[15px] sm:text-[16px] font-bold text-[#0F172A] truncate">{trackingData.courierName}</h2>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3">
                    <div className="flex items-center justify-between sm:justify-start gap-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-[9.5px] font-bold text-[#94A3B8] uppercase tracking-wider">AWB Number</p>
                        <p onClick={copyAwb} title="Click to copy AWB" className="text-[12.5px] font-bold text-[#00A86B] font-mono truncate cursor-pointer hover:underline">{trackingData.awb}</p>
                      </div>
                      <button
                        onClick={copyAwb}
                        className="w-7 h-7 rounded-md flex items-center justify-center text-[#64748B] hover:bg-white hover:text-[#00A86B] border border-transparent hover:border-[#E2E8F0] transition-colors shrink-0"
                        title="Copy AWB"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-[#00A86B]" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11.5px] sm:text-[12px] font-semibold text-[#475569] bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2.5 flex-wrap">
                      <CalendarIcon className="w-3.5 h-3.5 text-[#00A86B] shrink-0" />
                      Est. Delivery <span className="text-[#0F172A] font-bold">{trackingData.estimatedDelivery}</span>
                    </div>
                  </div>
                </div>

                {/* ── Progress Rail ── */}
                {isException ? (
                  <div className="flex items-start sm:items-center gap-2.5 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                    <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5 sm:mt-0" />
                    <p className="text-[11.5px] sm:text-[12px] font-semibold text-red-700 leading-relaxed">
                      This shipment is in an exception state ({trackingData.currentStatus}) — standard journey tracking is unavailable.
                    </p>
                  </div>
                ) : (
                  <ProgressRail status={trackingData.currentStatus} />
                )}
              </div>

              {/* ── Stat Strip ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 divide-x-0 sm:divide-x divide-[#F1F5F9]">
                {[
                  { icon: Package, label: 'Order ID', value: trackingData.orderId, color: 'text-[#00A86B] bg-[#F0FDF4]' },
                  { icon: Clock, label: 'Order Placed', value: trackingData.orderDate, color: 'text-sky-600 bg-sky-50' },
                  { icon: CreditCard, label: 'Payment Mode', value: trackingData.paymentMode, color: 'text-indigo-600 bg-indigo-50' },
                  { icon: Home, label: 'Order Amount', value: `₹${trackingData.orderAmount.toFixed(2)}`, color: 'text-amber-600 bg-amber-50' },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center gap-3 px-4 sm:px-6 py-3.5 sm:py-4">
                    <div className={`${STAT_ICON_STYLE} ${stat.color}`}>
                      <stat.icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">{stat.label}</p>
                      <p className="text-[13px] font-bold text-[#0F172A] truncate">{stat.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Journey + Verification ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

              {/* Timeline */}
              <div className="lg:col-span-8 bg-white rounded-xl border border-[#E2E8F0] shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-4 sm:p-6">
                <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#F1F5F9]">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#00A86B]" />
                    <h3 className="text-[13.5px] font-bold text-[#0F172A]">Tracking Journey</h3>
                  </div>
                  <span className="text-[10.5px] font-bold text-[#64748B] bg-[#F1F5F9] px-2.5 py-1 rounded-full">
                    {trackingData.events.length} update{trackingData.events.length === 1 ? '' : 's'}
                  </span>
                </div>

                {trackingData.events.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-14 text-center">
                    <Clock className="w-8 h-8 text-slate-200 mb-3" />
                    <p className="text-[12.5px] font-medium text-[#94A3B8]">No tracking updates yet — check back once the courier scans this shipment.</p>
                  </div>
                ) : (
                  <div className="pl-1">
                    {trackingData.events.map((event, index, arr) => (
                      <div key={event.id} className="relative flex gap-4 pb-7 last:pb-0">
                        {index !== arr.length - 1 && (
                          <div className={`absolute left-[13px] top-7 bottom-0 w-[2px] ${event.active ? 'bg-[#00A86B]' : 'bg-[#E2E8F0]'}`} />
                        )}

                        <div className="relative z-10 mt-0.5 shrink-0">
                          {event.active ? (
                            <div
                              className="w-7 h-7 rounded-full bg-[#00A86B] flex items-center justify-center"
                              style={{ boxShadow: '0 0 0 5px rgba(0,168,107,0.12)' }}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                            </div>
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-white border-2 border-[#E2E8F0] flex items-center justify-center">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#CBD5E1]" />
                            </div>
                          )}
                        </div>

                        <div className={`flex-1 min-w-0 pt-0.5 ${event.active ? '' : 'opacity-85'}`}>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-x-3 gap-y-0.5 mb-1">
                            <h4 className={`text-[13px] font-bold ${event.active ? 'text-[#00A86B]' : 'text-[#0F172A]'}`}>
                              {event.status}
                            </h4>
                            <span className="text-[11px] font-semibold text-[#94A3B8] whitespace-nowrap">
                              {event.date} · {event.time}
                            </span>
                          </div>
                          {event.desc && event.desc !== event.status && (
                            <p className="text-[12px] text-[#475569] mb-1 leading-relaxed">{event.desc}</p>
                          )}
                          {event.location && (
                            <p className="text-[11.5px] text-[#94A3B8] flex items-center gap-1">
                              <MapPin className="w-3 h-3 shrink-0" /> {event.location}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right rail: verification + courier card */}
              <div className="lg:col-span-4 space-y-5">
                <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-5">
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#F1F5F9]">
                    <Truck className="w-4 h-4 text-[#00A86B]" />
                    <h3 className="text-[13.5px] font-bold text-[#0F172A]">Courier Details</h3>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: 'Courier Partner', value: trackingData.courierName },
                      { label: 'Tracking Number', value: trackingData.awb },
                      { label: 'Current Status', value: trackingData.currentStatus },
                    ].map((row) => {
                      const isAwbRow = row.label === 'Tracking Number';
                      return (
                        <div key={row.label} className="flex items-center justify-between gap-3">
                          <span className="text-[11.5px] font-semibold text-[#64748B]">{row.label}</span>
                          <span
                            onClick={isAwbRow ? copyAwb : undefined}
                            title={isAwbRow ? 'Click to copy AWB' : undefined}
                            className={`text-[12px] font-bold text-right truncate max-w-[160px] ${isAwbRow ? 'text-[#00A86B] cursor-pointer hover:underline' : 'text-[#0F172A]'}`}
                          >
                            {row.value}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Buyer verification banner — disabled per request
                <div className="bg-[#FFFBEB] border border-[#FEF3C7] rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldAlert className="w-4 h-4 text-[#D97706]" />
                    <h3 className="text-[13px] font-bold text-[#92400E]">Buyer Verification Required</h3>
                  </div>
                  <p className="text-[12px] leading-relaxed text-[#B45309] mb-3">
                    To take any action or view complete buyer details, please verify your identity via OTP.
                  </p>
                  <button className="w-full flex items-center justify-center gap-1.5 text-[12.5px] font-bold text-white bg-[#D97706] hover:bg-[#B45309] rounded-lg py-2.5 transition-colors">
                    Verify via OTP <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                */}
              </div>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
