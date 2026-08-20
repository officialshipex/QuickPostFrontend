import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { DesktopPagination } from '../../hooks/usePagination';
import { apiClient } from '../../services/apiClient';
import {
  Search, Download, RefreshCw, ChevronLeft, ChevronRight, ChevronDown,
  Filter, Truck, RotateCcw, CheckCircle2, AlertTriangle, Clock, Package, MoreHorizontal, MoreVertical, MapPin, Check, History, User, Settings, X, Loader2, Zap, IndianRupee, Calendar, Mail, FileText, Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassDropdown } from '../../components/ui/GlassDropdown';
import { GlassDateFilter } from '../../components/ui/GlassDateFilter';
import { TruncatedText } from '../../components/ui/TruncatedText';
import { StatusRibbon } from '../../components/ui/StatusRibbon';
import { useUserSearchFilter } from '../../hooks/filters/useUserSearchFilter';
import { getLast7DaysStr } from '../../hooks/filters/useDateRangeFilter';
import { TableLoader } from '../../components/ui/TableLoader';
import { EmptyState } from '../../components/ui/EmptyState';
import { MobilePaginationBar } from '../../hooks/useMobilePaginationBar';
import { useProductTooltip, ProductTooltipCard } from '../../hooks/useProductTooltip';

const STATUS_OPTS = ['Ready To Ship', 'Not Picked', 'Booked', 'Pickup Scheduled', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered', 'Undelivered', 'Action Requested', 'RTO Initiated', 'RTO In Transit', 'RTO Delivered', 'RTO Lost', 'RTO Damaged', 'Lost', 'Damaged', 'Cancelled'];
const CHANNEL_OPTS = ['custom', 'api', 'shopify', 'woocommerce'];
const ORDER_TYPE_OPTS = ['Prepaid', 'COD'];
const WEIGHT_RANGE_OPTS = [
  { label: 'Under 500g', value: 'under500', min: 0, max: 0.5 },
  { label: '500g – 1 kg', value: '500to1', min: 0.5, max: 1 },
  { label: '1 – 2 kg', value: '1to2', min: 1, max: 2 },
  { label: '2 – 5 kg', value: '2to5', min: 2, max: 5 },
  { label: '5 kg+', value: 'over5', min: 5, max: undefined as number | undefined },
];

const STATUS_STYLES: Record<string, string> = {
  'Ready To Ship': 'bg-teal-50 text-teal-700 border-teal-200',
  'Not Picked': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  'Booked': 'bg-slate-50 text-slate-700 border-slate-200',
  'Pickup Scheduled': 'bg-slate-50 text-slate-600 border-slate-200',
  'Picked Up': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'In Transit': 'bg-sky-50 text-sky-700 border-sky-200',
  'Out for Delivery': 'bg-amber-50 text-amber-700 border-amber-200',
  'Delivered': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Undelivered': 'bg-red-50 text-red-700 border-red-200',
  'Action Requested': 'bg-orange-50 text-orange-700 border-orange-200',
  'RTO Initiated': 'bg-orange-50 text-orange-700 border-orange-200',
  'RTO In Transit': 'bg-orange-50 text-orange-600 border-orange-200',
  'RTO Delivered': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'RTO Lost': 'bg-red-50 text-red-700 border-red-200',
  'RTO Damaged': 'bg-rose-50 text-rose-700 border-rose-200',
  'Lost': 'bg-slate-100 text-slate-500 border-slate-200',
  'Damaged': 'bg-red-50 text-red-600 border-red-200',
  'Cancelled': 'bg-rose-50 text-rose-700 border-rose-200',
};

const STATUS_RIBBON_COLORS: Record<string, string> = {
  'Ready To Ship': '#0D9488',
  'Not Picked': '#CA8A04',
  'Booked': '#64748B',
  'Pickup Scheduled': '#64748B',
  'Picked Up': '#4F46E5',
  'In Transit': '#0284C7',
  'Out for Delivery': '#D97706',
  'Delivered': '#059669',
  'Undelivered': '#DC2626',
  'Action Requested': '#EA580C',
  'RTO Initiated': '#EA580C',
  'RTO In Transit': '#EA580C',
  'RTO Delivered': '#059669',
  'RTO Lost': '#DC2626',
  'RTO Damaged': '#E11D48',
  'Lost': '#94A3B8',
  'Damaged': '#DC2626',
  'Cancelled': '#E11D48',
};
const getRibbonColor = (status: string) => STATUS_RIBBON_COLORS[status] || '#00A86B';

interface TrackingEvent {
  date: string;
  time: string;
  activity: string;
  location: string;
  isLatest?: boolean;
}

const calculateAgeingDays = (manifestDateStr: string) => {
  const start = new Date(manifestDateStr);
  const end = new Date();
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  let count = 0;
  const cur = new Date(start);
  while (cur < end) {
    if (cur.getDay() !== 0) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
};

// Delivered-family statuses are excluded from the "Delayed" check once the
// shipment has actually reached a terminal delivered state.
const DELIVERED_STATUSES = new Set(['Delivered', 'RTO Delivered']);

/** Below the Status badge: ageing (days since manifest) plus On Time / Delayed vs EDD. */
const renderDeliveryStatus = (row: { status: string; manifestDate: string; expectedDeliveryDate?: string }) => {
  const days = calculateAgeingDays(row.manifestDate);
  const formattedManifest = new Date(row.manifestDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const ageingLine = (
    <div className="flex items-center gap-1.5 text-[#64748B]" title={`Manifested on ${formattedManifest} — ${days} working day${days === 1 ? '' : 's'} pending.`}>
      <Clock className="w-3.5 h-3.5" /><span>{days} day{days === 1 ? '' : 's'}</span>
    </div>
  );

  if (!row.expectedDeliveryDate) return ageingLine;
  const edd = new Date(row.expectedDeliveryDate);
  if (isNaN(edd.getTime())) return ageingLine;
  edd.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const formattedEdd = edd.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const isDelivered = DELIVERED_STATUSES.has(row.status);
  const daysLate = Math.round((today.getTime() - edd.getTime()) / 86400000);

  return (
    <div className="flex flex-col gap-0.5">
      {ageingLine}
      {isDelivered || daysLate <= 0 ? (
        <div className="flex items-center gap-1.5 text-emerald-600 font-semibold" title={`EDD: ${formattedEdd}`}>
          <CheckCircle2 className="w-3.5 h-3.5" /><span>On Time</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-red-600 font-bold" title={`EDD: ${formattedEdd}`}>
          <AlertTriangle className="w-3.5 h-3.5" /><span>Delayed — {daysLate} day{daysLate === 1 ? '' : 's'} late</span>
        </div>
      )}
    </div>
  );
};

// Map raw API order document to the shape the UI expects
const mapOrder = (o: any) => ({
  awb: o.awb_number || '',
  orderId: String(o.orderId || ''),
  orderType: o.paymentDetails?.method || 'Prepaid',
  courier: o.courierServiceName || '—',
  channel: o.channel || 'API',
  seller: o.userId?.fullname || o.userId?.company || 'Unknown',
  companyId: String(o.userId?.userId || ''),
  email: o.userId?.email || '',
  pickupName: o.pickupAddress?.contactName || '—',
  pickupAddr: o.pickupAddress?.city ? `${o.pickupAddress.city}, ${o.pickupAddress.state || ''}` : '—',
  pickupAddressLine: o.pickupAddress?.address || '',
  pickupCity: o.pickupAddress?.city || '',
  pickupState: o.pickupAddress?.state || '',
  pickupPinCode: o.pickupAddress?.pinCode || o.pickupAddress?.pincode || '',
  pickupPhone: o.pickupAddress?.phoneNumber || '',
  shippingAddr: o.receiverAddress?.city || '—',
  paymentMode: o.paymentDetails?.method || 'Prepaid',
  shipmentValue: `₹${(o.paymentDetails?.amount || 0).toLocaleString('en-IN')}`,
  status: o.status || 'Booked',
  manifestDate: o.shipmentCreatedAt || o.createdAt || new Date().toISOString(),
  expectedDeliveryDate: o.expectedDeliveryDate || null,
  customerName: o.receiverAddress?.contactName || '—',
  customerPhone: o.receiverAddress?.phoneNumber || '—',
  customerAddress: o.receiverAddress?.address || '',
  customerCity: o.receiverAddress?.city || '',
  customerState: o.receiverAddress?.state || '',
  customerPinCode: o.receiverAddress?.pinCode || o.receiverAddress?.pincode || '',
  customerEmail: o.receiverAddress?.email || o.customerEmail || o.email || '',
  productName: (o.productDetails || [])[0]?.name || '—',
  sku: (o.productDetails || [])[0]?.sku || '—',
  qty: (o.productDetails || []).reduce((s: number, p: any) => s + (p.quantity || 0), 0) || 1,
  products: (o.productDetails || []).map((p: any) => {
    const qty = p.quantity || 1;
    const price = Number(p.price ?? p.unitPrice ?? p.sellingPrice ?? p.amount ?? p.rate ?? 0);
    return {
      name: p.name || '—',
      sku: p.sku || '—',
      qty,
      price,
      total: Number(p.total ?? p.lineTotal ?? (price * qty)),
    };
  }),
  weight: o.packageDetails?.applicableWeight
    ? `${o.packageDetails.applicableWeight} kg`
    : (o.packageDetails?.deadWeight ? `${(o.packageDetails.deadWeight / 1000).toFixed(2)} kg` : '—'),
  dimensions: (() => {
    const v = o.packageDetails?.volumetricWeight;
    return (v?.length && v?.width && v?.height) ? `${v.length}×${v.width}×${v.height} cm` : '—';
  })(),
  volWeight: (() => {
    const v = o.packageDetails?.volumetricWeight;
    if (!v) return '—';
    const cw = v.calculatedWeight || (v.length && v.width && v.height ? (v.length * v.width * v.height) / 5000 : null);
    return cw ? `${Number(cw).toFixed(2)} kg` : '—';
  })(),
});

const populateTrackingFromOrders = (rawOrders: any[]): Record<string, TrackingEvent[]> => {
  const td: Record<string, TrackingEvent[]> = {};
  rawOrders.forEach((o: any) => {
    // Backend attaches lastTracking (last entry) separately to avoid $slice projection issues
    const lt = o.lastTracking || null;
    if (lt?.StatusDateTime) {
      td[o.awb_number || ''] = [{
        activity: lt.status || lt.Status || 'Updated',       // schema: status (lowercase)
        location: lt.StatusLocation || lt.Location || '—',   // schema: StatusLocation
        date: new Date(lt.StatusDateTime).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }),
        time: new Date(lt.StatusDateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        isLatest: true,
      }];
    }
  });
  return td;
};

export function CRMShipmentListing() {
  const navigate = useNavigate();
  const [selectedCouriers, setSelectedCouriers] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [selectedOrderTypes, setSelectedOrderTypes] = useState<string[]>([]);
  const [selectedPickupAddrs, setSelectedPickupAddrs] = useState<string[]>([]);

  const { userQuery, userSuggestions, userMongoId, onQueryChange, selectUser, clearUser } = useUserSearchFilter(true);
  const [courierOptions, setCourierOptions] = useState<string[]>([]);
  const [pickupOptions, setPickupOptions] = useState<string[]>([]);
  const [selectedWeightRanges, setSelectedWeightRanges] = useState<string[]>([]);
  const [orderId, setOrderId] = useState('');
  const [forwardAwb, setForwardAwb] = useState('');
  const [pendingPickupOnly, setPendingPickupOnly] = useState(false);
  const [pendingNdrOnly, setPendingNdrOnly] = useState(false);
  const [dateFrom, setDateFrom] = useState(() => getLast7DaysStr()[0]);
  const [dateTo, setDateTo] = useState(() => getLast7DaysStr()[1]);
  const [defStart, defEnd] = getLast7DaysStr();

  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [copiedAwb, setCopiedAwb] = useState<string | null>(null);
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const handleCopyAwb = (awb: string) => {
    const showCopied = () => {
      setCopiedAwb(awb);
      setCopyToast(awb);
      setTimeout(() => setCopiedAwb(prev => (prev === awb ? null : prev)), 1500);
      setTimeout(() => setCopyToast(prev => (prev === awb ? null : prev)), 2000);
    };
    const legacyCopy = () => {
      const ta = document.createElement('textarea');
      ta.value = awb;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch { /* ignore */ }
      document.body.removeChild(ta);
      showCopied();
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(awb).then(showCopied).catch(legacyCopy);
    } else {
      legacyCopy();
    }
  };
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const [mobileActionMenuPos, setMobileActionMenuPos] = useState<{ top: number; right: number } | null>(null);
  const [showGlobalActionMenu, setShowGlobalActionMenu] = useState(false);
  const globalActionMenuRef = useRef<HTMLDivElement>(null);
  const [showLastUpdate, setShowLastUpdate] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [downloadScope, setDownloadScope] = useState<'displayed' | 'all'>('displayed');
  const downloadMenuRef = useRef<HTMLDivElement>(null);
  const [hoveredTracking, setHoveredTracking] = useState<{id: string, rect: DOMRect, activity: string, location: string, date: string, time: string} | null>(null);
  const [hoveredPickup, setHoveredPickup] = useState<{ id: string; rect: DOMRect; name: string; address: string; city: string; state: string; pinCode: string; phone: string } | null>(null);
  const [hoveredCustomer, setHoveredCustomer] = useState<{ rect: DOMRect; name: string; address: string; city: string; state: string; pinCode: string; email: string } | null>(null);
  const { productHoverPos, openProductTooltip, hoverOpenProductTooltip, closeProductTooltip } = useProductTooltip();

  const [trackingData, setTrackingData] = useState<Record<string, TrackingEvent[]>>({});
  const [trackingLoading] = useState<Record<string, boolean>>({});
  const autoFetchEnabled = false;
  const trackingPopoverRef = useRef<HTMLDivElement>(null);

  // ── API state ──
  const [orders, setOrders] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Stable refs for page / rowsPerPage so callbacks never go stale
  const [pageState, setPageState] = useState(1);
  const pageRef = useRef(1);
  const page = pageState;

  const [rowsPerPageState, setRowsPerPageState] = useState(20);
  const rowsPerPageRef = useRef(20);
  const rowsPerPage = rowsPerPageState;

  const startIndex = orders.length > 0 ? (page - 1) * rowsPerPage + 1 : 0;
  const endIndex = (page - 1) * rowsPerPage + orders.length;
  const paginated = orders;

  // Core fetch — reads current filter state from closure
  const fetchOrders = useCallback(async (pg: number, lim: number) => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(pg), limit: String(lim) };
      if (selectedCouriers.length) params.courier = selectedCouriers.join(',');
      // pendingPickupOnly / pendingNdrOnly take precedence over the status dropdown
      if (pendingPickupOnly) {
        params.status = 'Not Picked,Ready To Ship,Booked,Pickup Scheduled';
        // Exclude today — shipments created today are still within the courier's pickup window
        const yd = new Date(); yd.setDate(yd.getDate() - 1);
        const yesterday = yd.toISOString().split('T')[0];
        if (dateFrom) params.dateFrom = dateFrom;
        params.dateTo = yesterday;
      } else if (pendingNdrOnly) {
        params.pendingNdr = 'true';
        if (dateFrom) params.dateFrom = dateFrom;
        if (dateTo) params.dateTo = dateTo;
      } else {
        if (selectedStatuses.length) params.status = selectedStatuses.join(',');
        if (dateFrom) params.dateFrom = dateFrom;
        if (dateTo) params.dateTo = dateTo;
      }
      if (selectedChannels.length) params.channel = selectedChannels.join(',');
      if (selectedOrderTypes.length) params.orderType = selectedOrderTypes.join(',');
      if (selectedPickupAddrs.length) params.pickupCity = selectedPickupAddrs.join(',');
      if (userMongoId) params.userId = userMongoId;
      if (orderId) params.orderId = orderId;
      if (selectedWeightRanges.length === 1) {
        const wopt = WEIGHT_RANGE_OPTS.find(o => o.value === selectedWeightRanges[0]);
        if (wopt) { if (wopt.min) params.minWeight = String(wopt.min); if (wopt.max !== undefined) params.maxWeight = String(wopt.max); }
      }
      if (forwardAwb) params.awb = forwardAwb;

      const res = await apiClient.get('/crm/shipments', { params });
      setOrders((res.data.orders || []).map(mapOrder));
      setTotalCount(res.data.totalCount || 0);
      setTotalPages(res.data.totalPages || 1);
      setTrackingData(populateTrackingFromOrders(res.data.orders || []));
      setApiError(null);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'API error';
      const status = err?.response?.status;
      setApiError(`${status ? `${status}: ` : ''}${msg}`);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCouriers, selectedStatuses, selectedChannels, selectedOrderTypes, selectedPickupAddrs, userMongoId, orderId, selectedWeightRanges, forwardAwb, pendingPickupOnly, pendingNdrOnly, dateFrom, dateTo]);

  // Always-latest ref — prevents stale closure in setPage / setRowsPerPage wrappers
  const fetchRef = useRef(fetchOrders);
  fetchRef.current = fetchOrders;

  // Wrapped setters that also trigger a re-fetch
  const setPage = useCallback((p: number | ((prev: number) => number)) => {
    const np = typeof p === 'function' ? p(pageRef.current) : p;
    pageRef.current = np;
    setPageState(np);
    fetchRef.current(np, rowsPerPageRef.current);
  }, []);

  const setRowsPerPage = useCallback((r: number | ((prev: number) => number)) => {
    const nr = typeof r === 'function' ? r(rowsPerPageRef.current) : r;
    rowsPerPageRef.current = nr;
    setRowsPerPageState(nr);
    pageRef.current = 1;
    setPageState(1);
    fetchRef.current(1, nr);
  }, []);

  // Initial load
  useEffect(() => { fetchRef.current(1, rowsPerPageRef.current); }, []);

  // Fetch courier names dynamically from /courierServices/couriers
  useEffect(() => {
    apiClient.get('/courierServices/couriers')
      .then(res => setCourierOptions((res.data || []).map((c: any) => c.name).filter(Boolean)))
      .catch(() => {});
  }, []);

  // Fetch distinct pickup cities for filter
  useEffect(() => {
    apiClient.get('/crm/pickup-cities')
      .then(res => setPickupOptions((res.data || []).filter(Boolean)))
      .catch(() => {});
  }, []);

  // Close popovers on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (trackingPopoverRef.current && !trackingPopoverRef.current.contains(e.target as Node)) { /* popover handled by hover */ }
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target as Node)) setShowDownloadMenu(false);
      setOpenActionId(null);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close tap-triggered mobile pickup tooltip on any outside tap (product tooltip
  // closes itself via its own document pointerdown listener in useProductTooltip)
  useEffect(() => {
    if (!hoveredPickup) return;
    const handler = () => setHoveredPickup(null);
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, [hoveredPickup]);

  const hasActiveFilters = selectedCouriers.length > 0 || selectedStatuses.length > 0 || selectedChannels.length > 0 || selectedOrderTypes.length > 0 || selectedPickupAddrs.length > 0 || !!userMongoId || orderId || selectedWeightRanges.length > 0 || forwardAwb || pendingPickupOnly || pendingNdrOnly || (dateFrom && dateTo && !(dateFrom === defStart && dateTo === defEnd));

  const handleClearAllFilters = () => {
    setSelectedCouriers([]); setSelectedStatuses([]); setSelectedChannels([]);
    setSelectedOrderTypes([]); setSelectedPickupAddrs([]);
    clearUser(); setOrderId(''); setSelectedWeightRanges([]);
    setForwardAwb(''); setPendingPickupOnly(false); setPendingNdrOnly(false); setDateFrom(defStart); setDateTo(defEnd);
    pageRef.current = 1; setPageState(1);
    // Fetch with empty params — don't use stale closure
    setLoading(true);
    apiClient.get('/crm/shipments', { params: { page: '1', limit: String(rowsPerPageRef.current) } })
      .then(res => {
        setOrders((res.data.orders || []).map(mapOrder));
        setTotalCount(res.data.totalCount || 0);
        setTotalPages(res.data.totalPages || 1);
        setTrackingData(populateTrackingFromOrders(res.data.orders || []));
      })
      .catch((err: any) => { setApiError(err?.response?.status ? `${err.response.status}: ${err.response.data?.message || err.message}` : err?.message || 'API error'); setOrders([]); })
      .finally(() => setLoading(false));
  };

  const handleApplyFilters = () => {
    pageRef.current = 1;
    setPageState(1);
    fetchRef.current(1, rowsPerPageRef.current);
  };

  const handleExport = async (scope: 'displayed' | 'all' = 'all') => {
    try {
      const params: Record<string, string> = { export: 'true' };
      if (scope === 'displayed') {
        // Only the rows currently rendered on this page
        params.awbs = paginated.map(o => o.awb).join(',');
      } else if (selectedOrders.length) {
        params.awbs = selectedOrders.join(',');
      }
      if (selectedCouriers.length) params.courier = selectedCouriers.join(',');
      if (pendingPickupOnly) {
        params.status = 'Not Picked,Ready To Ship,Booked,Pickup Scheduled';
        const yd = new Date(); yd.setDate(yd.getDate() - 1);
        const yesterday = yd.toISOString().split('T')[0];
        if (dateFrom) params.dateFrom = dateFrom;
        params.dateTo = yesterday;
      } else if (pendingNdrOnly) {
        params.pendingNdr = 'true';
        if (dateFrom) params.dateFrom = dateFrom;
        if (dateTo) params.dateTo = dateTo;
      } else {
        if (selectedStatuses.length) params.status = selectedStatuses.join(',');
        if (dateFrom) params.dateFrom = dateFrom;
        if (dateTo) params.dateTo = dateTo;
      }
      if (selectedChannels.length) params.channel = selectedChannels.join(',');
      if (selectedOrderTypes.length) params.orderType = selectedOrderTypes.join(',');
      if (selectedPickupAddrs.length) params.pickupCity = selectedPickupAddrs.join(',');
      if (userMongoId) params.userId = userMongoId;
      if (orderId) params.orderId = orderId;
      if (forwardAwb) params.awb = forwardAwb;
      const res = await apiClient.get('/crm/shipments', { params, responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url; a.download = `crm_shipments_${Date.now()}.xlsx`; a.click();
      URL.revokeObjectURL(url);
    } catch { /* silent */ }
  };

  // Re-fetch current page to refresh tracking data
  const fetchTracking = useCallback((_awb: string, _status?: string, _manifestDate?: string, _courier?: string) => {
    fetchRef.current(pageRef.current, rowsPerPageRef.current);
  }, []);

  const toggleAll = () => setSelectedOrders(selectedOrders.length === paginated.length && paginated.length > 0 ? [] : paginated.map(o => o.awb));
  const toggleSelect = (id: string) => setSelectedOrders(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const totalColumns = showLastUpdate ? 14 : 13;

  return (
    <AdminLayout>
      {/* Copy Toast */}
      <AnimatePresence>
        {copyToast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-[13px] font-semibold text-white bg-[#00A86B]"
          >
            <Check className="w-4 h-4" /> AWB {copyToast} copied
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col h-[calc(100vh-72px)] -m-4 md:-m-6 bg-white overflow-hidden">
        {/* Header Section */}
        <div className="bg-[#F8FAFC]/50 shrink-0 py-3 px-6 border-b border-[#CBD5F5]">
          <div className="flex flex-row items-center justify-between gap-3 mb-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="hidden md:block text-xl font-bold text-[#0F172A]">Shipment Listing</h2>
                <h2 className="md:hidden text-xl font-bold text-[#0F172A]">Internal CRM</h2>
                <span className="hidden md:inline text-[10px] font-bold bg-[#00A86B]/10 text-[#00A86B] px-2 py-0.5 rounded-full">INTERNAL CRM</span>
              </div>
              <p className="hidden md:block text-xs text-[#64748B] mt-0.5">AWB-level details — view, filter and manage all shipments across couriers.</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => fetchRef.current(pageRef.current, rowsPerPageRef.current)} className="flex items-center justify-center gap-1.5 w-9 h-9 md:w-auto md:h-auto md:px-3 md:py-2 rounded-full md:rounded-lg border border-[#E2E8F0] text-xs font-semibold text-[#64748B] hover:bg-[#F8FAFC] transition-colors shrink-0">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> <span className="hidden md:inline">Refresh</span>
              </button>
              <div className="relative shrink-0" ref={downloadMenuRef}>
                <button
                  onClick={() => setShowDownloadMenu(o => !o)}
                  title="Download"
                  className="flex items-center justify-center w-9 h-9 rounded-full md:rounded-lg bg-[#00A86B] text-white hover:bg-[#009960] transition-colors shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                {showDownloadMenu && (
                  <div className="absolute top-full right-0 mt-1.5 w-64 bg-white border border-[#E2E8F0] rounded-2xl shadow-xl z-50 p-4">
                    <div className="text-[11px] font-bold text-[#0F172A] mb-3 uppercase tracking-wide">Download Shipments</div>
                    <div className="space-y-2.5 mb-4">
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="radio"
                          name="downloadScope"
                          checked={downloadScope === 'displayed'}
                          onChange={() => setDownloadScope('displayed')}
                          className="accent-[#00A86B] w-3.5 h-3.5"
                        />
                        <span className="text-[12.5px] text-[#334155]">Displayed data</span>
                      </label>
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="radio"
                          name="downloadScope"
                          checked={downloadScope === 'all'}
                          onChange={() => setDownloadScope('all')}
                          className="accent-[#00A86B] w-3.5 h-3.5"
                        />
                        <span className="text-[12.5px] text-[#334155]">Whole data</span>
                      </label>
                    </div>
                    <button
                      onClick={() => { handleExport(downloadScope); setShowDownloadMenu(false); }}
                      className="w-full h-9 rounded-full bg-[#00A86B] text-white text-xs font-bold hover:bg-[#009960] transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={() => setIsMobileFiltersOpen(true)}
                className="md:hidden flex items-center justify-center gap-1.5 w-9 h-9 rounded-full bg-[#00A86B] text-white shadow-sm shrink-0 relative"
              >
                <Filter className="w-3.5 h-3.5" />
                {hasActiveFilters && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#00A86B] border-2 border-white" />
                )}
              </button>
              {/* Actions icon — mobile only, enabled once any card is checked */}
              <div className="md:hidden relative shrink-0" ref={globalActionMenuRef}>
                <button
                  onClick={(e) => {
                    if (selectedOrders.length === 0) return;
                    if (!showGlobalActionMenu) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setMobileActionMenuPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
                    }
                    setShowGlobalActionMenu(v => !v);
                  }}
                  disabled={selectedOrders.length === 0}
                  className="w-9 h-9 rounded-full border border-[#E2E8F0] flex items-center justify-center text-[#475569] bg-white relative disabled:opacity-50"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                  {selectedOrders.length > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full bg-[#00A86B] text-white text-[9px] font-bold flex items-center justify-center px-0.5">
                      {selectedOrders.length}
                    </span>
                  )}
                </button>
                {showGlobalActionMenu && mobileActionMenuPos && createPortal(
                  <>
                    <div className="fixed inset-0 z-[998]" onClick={() => setShowGlobalActionMenu(false)} />
                    <div
                      style={{ top: mobileActionMenuPos.top, right: mobileActionMenuPos.right }}
                      className="fixed w-[200px] bg-white rounded-xl shadow-[0_8px_28px_-6px_rgba(0,0,0,0.15)] border border-[#E2E8F0] py-1.5 z-[999] origin-top-right"
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => { toggleAll(); setShowGlobalActionMenu(false); }}
                        className="w-full text-left px-4 py-2.5 text-[13px] font-semibold text-[#00A86B] hover:bg-[#F0FDF4] transition-colors border-b border-[#F1F5F9]"
                      >
                        {selectedOrders.length === paginated.length && paginated.length > 0 ? 'Deselect All' : 'Select All'}
                      </button>
                      <button
                        onClick={() => { navigate(`/admin/order-tracking?id=${paginated.find(o => selectedOrders.includes(o.awb))?.orderId}`); setShowGlobalActionMenu(false); }}
                        className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors"
                      >
                        Track Shipment
                      </button>
                      <button
                        onClick={() => { alert(`Downloading Proof of Delivery (POD) for ${selectedOrders.length} shipment(s)...`); setShowGlobalActionMenu(false); }}
                        className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors"
                      >
                        Download POD
                      </button>
                      <button
                        onClick={() => { alert(`Opening Support Ticket Escalation dialog for ${selectedOrders.length} shipment(s)...`); setShowGlobalActionMenu(false); }}
                        className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors"
                      >
                        Raise Ticket
                      </button>
                      <button
                        onClick={() => { handleExport(); setShowGlobalActionMenu(false); }}
                        className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors"
                      >
                        Export{selectedOrders.length > 0 ? ` (${selectedOrders.length})` : ''}
                      </button>
                    </div>
                  </>,
                  document.body
                )}
              </div>
            </div>
          </div>

          {/* Filter Row — evenly distributed 2-row grid, uniform pill sizes */}
          <div className="filter-grid hidden md:grid grid-cols-6 gap-3 mt-3">
            <div className="relative">
              <input type="text" placeholder="Search user..." value={userQuery} onChange={e => onQueryChange(e.target.value)} className="glass-search-input w-full" />
              <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute right-2.5 top-1/2 -translate-y-1/2" />
              {userSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-[#E2E8F0] rounded-xl shadow-lg overflow-hidden">
                  {userSuggestions.map(u => (
                    <button key={u._id} onClick={() => selectUser(u)} className="w-full text-left px-3 py-2 text-[12px] hover:bg-[#F0FDF4] transition-colors border-b border-[#F1F5F9] last:border-0">
                      <div className="font-semibold text-[#1E293B]">{u.fullname}</div>
                      <div className="text-[#64748B] text-[11px]">{u.email}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <input
              type="text"
              placeholder="Search order..."
              value={orderId}
              onChange={e => setOrderId(e.target.value)}
              className="glass-search-input w-full"
            />

            <GlassDropdown
              label="Weight"
              options={WEIGHT_RANGE_OPTS.map(o => ({ label: o.label, value: o.value }))}
              selected={selectedWeightRanges}
              onChange={setSelectedWeightRanges}
              placeholder="Weight range..."
              icon={<Package className="w-3.5 h-3.5" />}
            />

            <input
              type="text"
              placeholder="Search FWD AWB..."
              value={forwardAwb}
              onChange={e => setForwardAwb(e.target.value)}
              className="glass-search-input w-full"
            />

            <button
              type="button"
              onClick={() => {
                const next = !pendingNdrOnly;
                setPendingNdrOnly(next);
                if (next) setPendingPickupOnly(false);
                pageRef.current = 1;
                setPageState(1);
                setTimeout(() => fetchRef.current(1, rowsPerPageRef.current), 0);
              }}
              className={`glass-search-input w-full flex items-center gap-2 !cursor-pointer transition-all text-left ${
                pendingNdrOnly
                  ? 'border-amber-400 bg-amber-50 text-amber-700'
                  : 'text-[#94A3B8] hover:border-amber-300'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span className={`text-[12px] flex-1 ${pendingNdrOnly ? 'font-bold text-amber-700' : 'font-normal'}`}>
                Pending NDR
              </span>
              {pendingNdrOnly && (
                <span className="text-[9px] font-bold bg-amber-400 text-white px-1.5 py-0.5 rounded-full shrink-0">ON</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                const next = !pendingPickupOnly;
                setPendingPickupOnly(next);
                if (next) setPendingNdrOnly(false);
                pageRef.current = 1;
                setPageState(1);
                setTimeout(() => fetchRef.current(1, rowsPerPageRef.current), 0);
              }}
              className={`glass-search-input w-full flex items-center gap-2 !cursor-pointer transition-all text-left ${
                pendingPickupOnly
                  ? 'border-amber-400 bg-amber-50 text-amber-700'
                  : 'text-[#94A3B8] hover:border-amber-300'
              }`}
            >
              <Package className="w-3.5 h-3.5 shrink-0" />
              <span className={`text-[12px] flex-1 ${pendingPickupOnly ? 'font-bold text-amber-700' : 'font-normal'}`}>
                Pending Pickup
              </span>
              {pendingPickupOnly && (
                <span className="text-[9px] font-bold bg-amber-400 text-white px-1.5 py-0.5 rounded-full shrink-0">ON</span>
              )}
            </button>

            <GlassDropdown
              className="w-full [&_.glass-dropdown-trigger]:w-full"
              label="Pickup Address"
              options={pickupOptions.map(o => ({ label: o, value: o }))}
              selected={selectedPickupAddrs}
              onChange={setSelectedPickupAddrs}
              placeholder="Search pickup..."
              icon={<MapPin className="w-3.5 h-3.5" />}
            />

            <GlassDropdown
              className="w-full [&_.glass-dropdown-trigger]:w-full"
              label="All Statuses"
              options={STATUS_OPTS.map(o => ({ label: o, value: o }))}
              selected={selectedStatuses}
              onChange={setSelectedStatuses}
              placeholder="Search status…"
              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
            />

            <GlassDropdown
              className="w-full [&_.glass-dropdown-trigger]:w-full"
              label="Courier Service"
              options={courierOptions.map(o => ({ label: o, value: o }))}
              selected={selectedCouriers}
              onChange={setSelectedCouriers}
              placeholder="Search courier…"
              icon={<Truck className="w-3.5 h-3.5" />}
            />

            <GlassDropdown
              className="w-full [&_.glass-dropdown-trigger]:w-full"
              label="All Channels"
              options={CHANNEL_OPTS.map(o => ({ label: o.charAt(0).toUpperCase() + o.slice(1), value: o }))}
              selected={selectedChannels}
              onChange={setSelectedChannels}
              placeholder="Search channel…"
              icon={<Package className="w-3.5 h-3.5" />}
            />

            <GlassDropdown
              className="w-full [&_.glass-dropdown-trigger]:w-full"
              label="All Types"
              options={ORDER_TYPE_OPTS.map(o => ({ label: o, value: o }))}
              selected={selectedOrderTypes}
              onChange={setSelectedOrderTypes}
              placeholder="COD / Prepaid…"
              icon={<Search className="w-3.5 h-3.5" />}
            />

            <GlassDateFilter
              className="w-full [&_.glass-dropdown-trigger]:w-full"
              align="right"
              startDate={dateFrom}
              endDate={dateTo}
              onDateChange={(s, e) => { setDateFrom(s); setDateTo(e); }}
              defaultStart={defStart}
              defaultEnd={defEnd}
            />

            <div className="flex items-center justify-end gap-3 col-span-6">
              {hasActiveFilters && (
                <button onClick={handleClearAllFilters} className="py-2 px-4 shrink-0 rounded-[32px] border border-red-200 text-red-500 text-xs font-medium leading-[18px] hover:bg-red-50 transition-colors cursor-pointer">
                  Clear All
                </button>
              )}
              <button onClick={handleApplyFilters} className="py-2 px-4 shrink-0 rounded-[32px] bg-[#009D64] border border-[#009D64] text-white text-xs font-medium leading-[18px] hover:bg-[#008a57] transition-colors cursor-pointer">
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        {selectedOrders.length > 0 && (
          <div className="hidden md:flex bg-white shrink-0 px-6 py-2.5 border-b border-[#E2E8F0] items-center justify-end gap-4">
            <div className="flex items-center gap-3 animate-fade-in shrink-0">
              <span className="text-xs font-bold text-blue-700">{selectedOrders.length} selected</span>
              <button className="h-8 px-3 rounded-md bg-white border border-blue-200 text-xs font-bold text-blue-700 shadow-sm hover:bg-blue-50 transition-colors">Export Selection</button>
            </div>
          </div>
        )}

        {/* Table Area — desktop */}
        <div className="hidden md:flex bg-white flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-auto w-full relative no-scrollbar">
            {loading && <TableLoader />}
            <table className="text-left border-collapse w-full min-w-full">
              <thead className="sticky top-0 z-40 shadow-sm bg-[#E6F9F2]">
                <tr className="text-xs leading-[18px] font-medium text-[#64748B] uppercase tracking-wider border border-[#B9EFDB] whitespace-nowrap">
                  <th className="py-2 px-4 w-10 rounded-l-lg">
                    <input type="checkbox" checked={selectedOrders.length === paginated.length && paginated.length > 0} onChange={toggleAll} className="rounded border-[#00A86B] accent-[#00A86B] w-3.5 h-3.5" />
                  </th>
                  <th className="py-2 px-4 text-left align-middle">
                    <div className="flex items-center gap-1"><User className="w-3.5 h-3.5 shrink-0"/><span>User</span></div>
                  </th>
                  <th className="py-2 px-4 text-left align-middle">
                    <div className="flex items-center gap-1"><FileText className="w-3.5 h-3.5 shrink-0"/><span>Order</span></div>
                  </th>
                  <th className="py-2 px-4 text-left align-middle">
                    <div className="flex items-center gap-1"><Package className="w-3.5 h-3.5 shrink-0"/><span>Product</span></div>
                  </th>
                  <th className="py-2 px-4 text-left align-middle">
                    <div className="flex items-center gap-1"><Package className="w-3.5 h-3.5 shrink-0"/><span>Package</span></div>
                  </th>
                  <th className="py-2 px-4 text-left align-middle">
                    <div className="flex items-center gap-1"><IndianRupee className="w-3.5 h-3.5 shrink-0"/><span>Payment</span></div>
                  </th>
                  <th className="py-2 px-4 text-left align-middle">
                    <div className="flex items-center gap-1"><User className="w-3.5 h-3.5 shrink-0"/><span>Customer</span></div>
                  </th>
                  <th className="py-2 px-4 text-left align-middle">
                    <div className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 shrink-0"/><span>Pickup</span></div>
                  </th>
                  <th className="py-2 px-4 text-left align-middle">
                    <div className="flex items-center gap-1"><Truck className="w-3.5 h-3.5 shrink-0"/><span>Shipment</span></div>
                  </th>
                  <th className="py-2 px-4 text-left align-middle">
                    <div className="flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 shrink-0"/>
                      <span>Status</span>
                      <button
                        onClick={() => setShowLastUpdate(!showLastUpdate)}
                        className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-200 shrink-0 ml-0.5 ${showLastUpdate ? 'bg-[#009D64] border-[#009D64]' : 'bg-white border-[#B9EFDB] hover:bg-[#D1F0E8] hover:border-[#009D64]'}`}
                        title={showLastUpdate ? 'Hide last update' : 'Show last update'}
                      >
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ease-in-out ${showLastUpdate ? 'rotate-90 text-white' : '-rotate-90 text-[#009D64]'}`} />
                      </button>
                    </div>
                  </th>
                  {showLastUpdate && (
                    <th className="py-2 px-4 text-left align-middle">
                      <div className="flex items-center gap-1">
                        <History className="w-3.5 h-3.5 shrink-0"/>
                        <span>Last Update</span>
                        {autoFetchEnabled && <Zap className="w-3 h-3 text-amber-500 animate-pulse" />}
                      </div>
                    </th>
                  )}
                  <th className="py-2 px-4 text-left align-middle rounded-r-lg">
                    <div className="flex items-center gap-1"><Settings className="w-3.5 h-3.5 shrink-0"/><span>Actions</span></div>
                  </th>
                </tr>
              </thead>
              <tbody className="text-[11px] text-[#475569]">
                {paginated.map((row, idx) => (
                  <tr key={row.awb || idx} className={`border-b border-[#E2E8F0] transition-colors group ${idx % 2 === 0 ? 'bg-white' : 'bg-[#E6EDF7]/20'}`}>
                    <td className="px-2 py-3 text-center align-middle">
                      <input type="checkbox" checked={selectedOrders.includes(row.awb)} onChange={() => toggleSelect(row.awb)} className="rounded border-gray-300 accent-[#00A86B] w-3.5 h-3.5" />
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col gap-1">
                        <div className="text-[12px] leading-[18px] font-semibold text-[#009D64]">{row.companyId}</div>
                        <TruncatedText text={row.seller} maxLength={20} className="text-[14px] leading-[20px] font-semibold text-[#1E293B] max-w-[156px]" />
                        <TruncatedText text={row.email} maxLength={25} className="text-[12px] leading-[18px] font-normal text-[#64748B] max-w-[156px]" />
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1 group/copy">
                          <span className="text-[12px] leading-[18px] font-semibold text-[#009D64] underline cursor-pointer hover:text-[#007A50]" onClick={() => navigate(`/admin/order-tracking?id=${row.orderId}`)}>{row.orderId}</span>
                          <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(row.orderId).catch(()=>{}); }} className="opacity-100 md:opacity-0 md:group-hover/copy:opacity-100 transition-opacity shrink-0 focus:outline-none" title="Copy Order ID"><Copy className="w-3 h-3 text-[#94A3B8] hover:text-[#00A86B]" /></button>
                        </div>
                        <div className="text-[12px] leading-[18px] font-normal text-[#64748B]">{new Date(row.manifestDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                        <span className="px-2 py-0.5 rounded-full border border-blue-200 text-[#004AAD] font-semibold text-[10px] leading-4 bg-blue-50/50 inline-block uppercase w-fit">
                          {row.channel === 'WooCommerce' ? 'Woo' : (row.channel || 'API')}
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col gap-1">
                        <div
                          className="text-[12px] leading-[18px] font-normal text-[#1E293B] underline decoration-dotted underline-offset-2 truncate max-w-[120px] cursor-help"
                          onMouseEnter={(e) => {
                            if (row.products.length === 0) return;
                            hoverOpenProductTooltip(row.awb, e);
                          }}
                          onMouseLeave={() => closeProductTooltip(row.awb)}
                        >{row.productName || '—'}</div>
                        <div className="text-[12px] leading-[18px] font-normal text-[#1E293B] truncate max-w-[120px]">SKU: {row.sku || '—'}</div>
                        <div className="text-[12px] leading-[18px] font-normal text-[#1E293B]">QTY: {row.qty || 1}</div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col gap-1 text-[12px] leading-[18px] font-normal text-[#1E293B]">
                        <div>Weight: {row.weight || '—'}</div>
                        <div>L×W×H: {row.dimensions || '—'}</div>
                        <div>Vol: {row.volWeight || '—'}</div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col gap-1">
                        <div className="text-[12px] leading-[18px] font-normal text-[#64748B]">{row.shipmentValue}</div>
                        <span className="px-2 py-0.5 rounded-full border border-blue-200 text-[#004AAD] font-semibold text-[10px] leading-4 bg-blue-50/50 inline-block w-fit">{row.paymentMode}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col gap-1">
                        <div
                          className="text-[12px] leading-[18px] font-normal text-[#1E293B] underline decoration-dotted underline-offset-2 hover:text-[#00A86B] cursor-help inline-block truncate max-w-[110px]"
                          onMouseEnter={(e) => setHoveredCustomer({ rect: e.currentTarget.getBoundingClientRect(), name: row.customerName, address: row.customerAddress, city: row.customerCity, state: row.customerState, pinCode: row.customerPinCode, email: row.customerEmail })}
                          onMouseLeave={() => setHoveredCustomer(null)}
                        >
                          {row.customerName}
                        </div>
                        <div className="text-[12px] leading-[18px] font-normal text-[#64748B]">{row.customerPhone}</div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div
                        className="text-[12px] leading-[18px] font-normal text-[#1E293B] underline decoration-dotted underline-offset-2 hover:text-[#00A86B] cursor-help inline-block truncate max-w-[100px]"
                        onMouseEnter={(e) => setHoveredPickup({ id: row.awb, rect: e.currentTarget.getBoundingClientRect(), name: row.pickupName, address: row.pickupAddressLine, city: row.pickupCity, state: row.pickupState, pinCode: row.pickupPinCode, phone: row.pickupPhone })}
                        onMouseLeave={() => setHoveredPickup(null)}
                      >
                        {row.pickupAddr || '—'}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col gap-1">
                        <div className="text-[12px] leading-[18px] font-semibold text-[#009D64]">{row.courier}</div>
                        <div className="text-[12px] leading-[18px] font-normal text-[#1E293B]">{new Date(row.manifestDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
                        <div className="flex items-center gap-1 group/copy">
                          <span className="text-[12px] leading-[18px] font-semibold text-[#009D64] underline cursor-pointer hover:text-[#009B63] truncate max-w-[120px]" onClick={() => row.awb && navigate(`/admin/tracking?awb=${row.awb}`)}>{row.awb}</span>
                          <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(row.awb).catch(()=>{}); }} className="opacity-100 md:opacity-0 md:group-hover/copy:opacity-100 transition-opacity shrink-0 focus:outline-none" title="Copy AWB"><Copy className="w-3 h-3 text-[#94A3B8] hover:text-[#00A86B]" /></button>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col gap-1 items-start">
                        <span className={`px-2.5 py-0.5 rounded-full border ${STATUS_STYLES[row.status] || 'bg-blue-50 text-blue-700 border-blue-200'} text-[10px] leading-4 font-semibold uppercase tracking-wider whitespace-nowrap shadow-sm`}>
                          {row.status}
                        </span>
                        <div className="text-[11px]">{renderDeliveryStatus(row)}</div>
                      </div>
                    </td>
                    {showLastUpdate && (
                      <td className="px-3 py-3 text-left align-middle min-w-[180px]">
                        {trackingLoading[row.awb] && !trackingData[row.awb] ? (
                          <div className="flex items-center gap-2 text-[#94A3B8]">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span className="text-[10px] font-medium">Fetching…</span>
                          </div>
                        ) : trackingData[row.awb] && trackingData[row.awb].length > 0 ? (
                          <div
                            className="text-left px-1.5 py-1 -mx-1.5 -my-1 cursor-help group/tracking"
                            onMouseEnter={(e) => {
                              const latest = trackingData[row.awb][0];
                              setHoveredTracking({ id: row.awb, rect: e.currentTarget.getBoundingClientRect(), activity: latest.activity, location: latest.location, date: latest.date, time: latest.time });
                            }}
                            onMouseLeave={() => setHoveredTracking(null)}
                          >
                            <div className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-full bg-[#00A86B] shrink-0 animate-pulse" />
                              <span className="font-semibold text-[#0F172A] text-[11px] truncate max-w-[140px]">{trackingData[row.awb][0].activity}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-[#64748B] mt-0.5">
                              <MapPin className="w-3 h-3 shrink-0" />
                              <span className="truncate max-w-[140px]">{trackingData[row.awb][0].location}</span>
                            </div>
                            <div className="text-[10px] text-[#64748B] mt-0.5">
                              {trackingData[row.awb][0].date} • {trackingData[row.awb][0].time}
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => fetchTracking(row.awb, row.status, row.manifestDate, row.courier)}
                            className="text-[10px] font-bold text-[#00A86B] hover:underline flex items-center gap-1"
                          >
                            <RefreshCw className="w-3.5 h-3.5" /> Fetch
                          </button>
                        )}
                      </td>
                    )}
                    <td className="px-2 py-3 text-center align-middle">
                      <div className="relative inline-flex justify-center">
                        <button
                          onClick={(e) => { e.stopPropagation(); setOpenActionId(openActionId === String(idx) ? null : String(idx)); }}
                          className="w-7 h-7 rounded-full border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-[#F1F5F9] relative z-10"
                        >
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>
                        {openActionId === String(idx) && (
                          <div
                            className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-[#E2E8F0] py-2 z-[60]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button className="w-full text-left px-4 py-2 text-[12px] font-medium text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors" onClick={() => navigate(`/admin/order-tracking?id=${row.orderId}`)}>View Details</button>
                            <button className="w-full text-left px-4 py-2 text-[12px] font-medium text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors" onClick={() => navigate(`/admin/order-tracking?id=${row.orderId}`)}>Track Shipment</button>
                            <button className="w-full text-left px-4 py-2 text-[12px] font-medium text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors" onClick={() => alert('Downloading Proof of Delivery (POD)...')}>Download POD</button>
                            <button className="w-full text-left px-4 py-2 text-[12px] font-medium text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors" onClick={() => alert('Opening Support Ticket Escalation dialog...')}>Raise Ticket</button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={totalColumns} className="p-8 text-center">
                      <EmptyState title="No shipments found" subtitle="Try changing filters" />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 0 && (
            <DesktopPagination
              page={page}
              setPage={setPage}
              totalPages={totalPages}
              rowsPerPage={rowsPerPage}
              setRowsPerPage={setRowsPerPage}
              startIndex={startIndex}
              endIndex={endIndex}
              totalItems={totalCount}
            />
          )}
        </div>

        {/* Mobile Card List */}
        <div className="md:hidden flex flex-col flex-1 min-h-0">
        <div className="flex-1 overflow-y-auto bg-[#F8FAFC] relative">
          {loading && <TableLoader />}
          {paginated.length === 0 ? (
            <EmptyState title="No shipments found" subtitle="Try changing filters" />
          ) : (
            <div className="p-2 space-y-2">
              {paginated.map((row, idx) => {
                const accent = getRibbonColor(row.status);
                return (
                  <div key={row.awb || idx} className="relative bg-white rounded-2xl border border-[#E2E8F0] shadow-sm">
                    <StatusRibbon label={row.status} color={accent} />

                    {/* Checkbox — top-right, sits on its own white chip above the ribbon so long labels never overlap it */}
                    <div className="absolute top-2 right-2 z-20 bg-white rounded-md p-0.5 shadow-sm">
                      <input type="checkbox" checked={selectedOrders.includes(row.awb)} onChange={() => toggleSelect(row.awb)}
                        className="rounded border-gray-300 accent-[#00A86B] w-4 h-4 shrink-0 block" />
                    </div>

                    <div className="px-2.5 pt-4 pb-2.5">
                      {/* Header Row — Order ID, kept clear of the checkbox chip */}
                      <div className="flex items-center justify-between mb-1.5 pr-6">
                        <button
                          onClick={() => navigate(`/admin/order-tracking?id=${row.orderId}`)}
                          className="text-[12.5px] font-bold text-[#1D4ED8] truncate"
                        >
                          {row.orderId}
                        </button>
                      </div>
                      <div className="text-[11px] mb-1.5">{renderDeliveryStatus(row)}</div>

                      <div className="rounded-xl p-2 mb-1.5 bg-white" style={{ border: `1px solid ${accent}` }}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <TruncatedText text={row.seller} maxLength={18} className="text-[13px] leading-[18px] font-semibold text-[#1E293B]" />
                            <TruncatedText text={row.email} maxLength={20} className="text-[12px] leading-[18px] font-normal text-[#64748B]" />
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-[12px] font-normal text-[#059669]">{row.shipmentValue}</div>
                            <span className="px-2 py-0.5 rounded-full border border-blue-200 text-[#004AAD] font-semibold text-[10px] leading-4 bg-blue-50/50 inline-block w-fit mt-0.5">{row.paymentMode}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start justify-between mb-1.5 px-1 gap-2">
                        <div className="min-w-0 flex-1">
                          <span
                            className={`text-[12px] font-normal text-[#1E293B] underline decoration-dotted underline-offset-2 truncate inline-block max-w-full ${row.products.length > 0 ? 'cursor-help' : ''}`}
                            onClick={(e) => {
                              if (row.products.length === 0) return;
                              openProductTooltip(row.awb, e);
                            }}
                          >
                            {row.productName || '—'}
                          </span>
                        </div>
                        <span className="text-[11px] font-medium text-[#64748B] shrink-0">QTY: {row.qty}</span>
                      </div>

                      <div className="flex items-start justify-between bg-[#F8FAFC] rounded-xl px-2.5 py-1.5 mb-1.5 gap-2">
                        <div className="min-w-0">
                          <div className="text-[10px] font-normal text-[#94A3B8] uppercase tracking-wider">Courier</div>
                          <div className="text-[12px] font-normal text-[#1E293B] mt-0.5">{row.courier}</div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-[11px] text-[#64748B]">{row.awb}</span>
                            <button onClick={() => handleCopyAwb(row.awb)} className="text-[#94A3B8] hover:text-[#00A86B] transition-colors shrink-0">
                              {copiedAwb === row.awb ? <Check className="w-3 h-3 text-[#00A86B]" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>
                        <div className="text-right min-w-0">
                          <div className="text-[10px] font-normal text-[#94A3B8] uppercase tracking-wider">Pickup</div>
                          <div
                            className="text-[12px] font-normal text-[#1E293B] mt-0.5 underline decoration-dotted underline-offset-2 cursor-help truncate max-w-[130px] ml-auto"
                            onClick={(e) => {
                              e.stopPropagation();
                              setHoveredPickup({ id: row.awb, rect: e.currentTarget.getBoundingClientRect(), name: row.pickupName, address: row.pickupAddressLine, city: row.pickupCity, state: row.pickupState, pinCode: row.pickupPinCode, phone: row.pickupPhone });
                            }}
                          >
                            {row.pickupAddr || '—'}
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="shrink-0">
          {<MobilePaginationBar {...({
            page, setPage, totalPages, rowsPerPage, setRowsPerPage,
            startIndex, endIndex, totalItems: totalCount,
          })} />}
        </div>
        </div>
      </div>

      {/* Mobile Filters Bottom Sheet */}
      <AnimatePresence>
        {isMobileFiltersOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[140] md:hidden flex items-end justify-center"
            onClick={() => setIsMobileFiltersOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white rounded-t-3xl border-t border-[#E2E8F0] shadow-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between sticky top-0 bg-white z-10">
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <Filter className="w-5 h-5 text-[#00A86B]" /> Filters
                </h3>
                <button onClick={() => setIsMobileFiltersOpen(false)} className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Search User</label>
                  <div className="relative">
                    <input type="text" value={userQuery} onChange={e => onQueryChange(e.target.value)} placeholder="Search user..."
                      className="w-full h-11 px-4 rounded-full border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B]" />
                    {userSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-[#E2E8F0] rounded-xl shadow-lg overflow-hidden">
                        {userSuggestions.map(u => (
                          <button key={u._id} onClick={() => selectUser(u)} className="w-full text-left px-3 py-2.5 text-[12px] hover:bg-[#F0FDF4] transition-colors border-b border-[#F1F5F9] last:border-0">
                            <div className="font-semibold text-[#1E293B]">{u.fullname}</div>
                            <div className="text-[#64748B] text-[11px]">{u.email}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Order ID</label>
                  <input type="text" value={orderId} onChange={e => setOrderId(e.target.value)} placeholder="Search order..."
                    className="w-full h-11 px-4 rounded-full border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B]" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Weight Range</label>
                  <GlassDropdown
                    label="Weight"
                    options={WEIGHT_RANGE_OPTS.map(o => ({ label: o.label, value: o.value }))}
                    selected={selectedWeightRanges}
                    onChange={setSelectedWeightRanges}
                    placeholder="Weight range..."
                    icon={<Package className="w-3.5 h-3.5" />}
                    className="w-full [&_.glass-dropdown-trigger]:!w-full [&_.glass-dropdown-trigger]:!h-11 [&_.glass-dropdown-trigger]:!min-w-0 [&_.glass-dropdown-trigger]:!rounded-full"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Forward AWB</label>
                  <input type="text" value={forwardAwb} onChange={e => setForwardAwb(e.target.value)} placeholder="Search FWD AWB..."
                    className="w-full h-11 px-4 rounded-full border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B]" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Pending NDR</label>
                  <button
                    type="button"
                    onClick={() => setPendingNdrOnly(p => { const next = !p; if (next) setPendingPickupOnly(false); return next; })}
                    className={`w-full h-11 px-4 rounded-full border flex items-center gap-2 cursor-pointer transition-all ${
                      pendingNdrOnly
                        ? 'border-amber-400 bg-amber-50 text-amber-700'
                        : 'border-slate-200 text-slate-400 hover:border-amber-300'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span className={`text-sm flex-1 text-left ${pendingNdrOnly ? 'font-bold text-amber-700' : 'font-normal'}`}>
                      {pendingNdrOnly ? 'Pending NDR — Active' : 'Show Pending NDR'}
                    </span>
                    {pendingNdrOnly && (
                      <span className="text-[10px] font-bold bg-amber-400 text-white px-2 py-0.5 rounded-full shrink-0">ON</span>
                    )}
                  </button>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Pending Pickup</label>
                  <button
                    type="button"
                    onClick={() => setPendingPickupOnly(p => { const next = !p; if (next) setPendingNdrOnly(false); return next; })}
                    className={`w-full h-11 px-4 rounded-full border flex items-center gap-2 cursor-pointer transition-all ${
                      pendingPickupOnly
                        ? 'border-amber-400 bg-amber-50 text-amber-700'
                        : 'border-slate-200 text-slate-400 hover:border-amber-300'
                    }`}
                  >
                    <Package className="w-4 h-4 shrink-0" />
                    <span className={`text-sm flex-1 text-left ${pendingPickupOnly ? 'font-bold text-amber-700' : 'font-normal'}`}>
                      {pendingPickupOnly ? 'Pending Pickup — Active' : 'Show Pending Pickup'}
                    </span>
                    {pendingPickupOnly && (
                      <span className="text-[10px] font-bold bg-amber-400 text-white px-2 py-0.5 rounded-full shrink-0">ON</span>
                    )}
                  </button>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Pickup Address</label>
                  <select
                    value={selectedPickupAddrs[0] || ''}
                    onChange={(e) => setSelectedPickupAddrs(e.target.value ? [e.target.value] : [])}
                    className="w-full h-11 px-3 rounded-full border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B] bg-white"
                  >
                    <option value="">All Pickup Addresses</option>
                    {pickupOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
                  <select
                    value={selectedStatuses[0] || ''}
                    onChange={(e) => setSelectedStatuses(e.target.value ? [e.target.value] : [])}
                    className="w-full h-11 px-3 rounded-full border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B] bg-white"
                  >
                    <option value="">All Statuses</option>
                    {STATUS_OPTS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Courier Service</label>
                  <select
                    value={selectedCouriers[0] || ''}
                    onChange={(e) => setSelectedCouriers(e.target.value ? [e.target.value] : [])}
                    className="w-full h-11 px-3 rounded-full border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B] bg-white"
                  >
                    <option value="">All Couriers</option>
                    {courierOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Channel</label>
                  <select
                    value={selectedChannels[0] || ''}
                    onChange={(e) => setSelectedChannels(e.target.value ? [e.target.value] : [])}
                    className="w-full h-11 px-3 rounded-full border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B] bg-white"
                  >
                    <option value="">All Channels</option>
                    {CHANNEL_OPTS.map((opt) => <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Order Type</label>
                  <select
                    value={selectedOrderTypes[0] || ''}
                    onChange={(e) => setSelectedOrderTypes(e.target.value ? [e.target.value] : [])}
                    className="w-full h-11 px-3 rounded-full border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B] bg-white"
                  >
                    <option value="">All Types</option>
                    {ORDER_TYPE_OPTS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Date Range</label>
                  <GlassDateFilter
                    className="w-full [&_.glass-dropdown-trigger]:!w-full [&_.glass-dropdown-trigger]:!h-11 [&_.glass-dropdown-trigger]:!min-w-0 [&_.glass-dropdown-trigger]:!rounded-full"
                    startDate={dateFrom}
                    endDate={dateTo}
                    onDateChange={(s, e) => { setDateFrom(s); setDateTo(e); }}
                    defaultStart={defStart}
                    defaultEnd={defEnd}
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-[#E2E8F0] flex items-center gap-3 sticky bottom-0 bg-white">
                <button
                  onClick={() => { handleClearAllFilters(); setIsMobileFiltersOpen(false); }}
                  className="flex-1 h-11 rounded-full border border-[#E2E8F0] text-[#475569] text-sm font-bold hover:bg-[#F8FAFC] transition-colors"
                >
                  Reset All
                </button>
                <button
                  onClick={() => { handleApplyFilters(); setIsMobileFiltersOpen(false); }}
                  className="flex-1 h-11 rounded-full bg-[#009D64] text-white text-sm font-bold hover:bg-[#009B63] transition-colors shadow-sm"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fixed Tooltip for Tracking Last Update */}
      {hoveredTracking && (
        <div
          className="fixed z-[9999] pointer-events-none bg-[#0F172A] text-white text-[10px] p-3 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] transition-opacity animate-in fade-in zoom-in-95 duration-150 w-64"
          style={{
            top: hoveredTracking.rect.top - 10,
            left: hoveredTracking.rect.left + (hoveredTracking.rect.width / 2),
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="font-bold text-white mb-1.5 flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-[#00A86B]" />
            Last Update Details
          </div>
          <div className="space-y-1.5 border-t border-white/10 pt-1.5 mt-1.5">
            <div className="flex justify-between gap-2"><span className="text-slate-400">Activity:</span><span className="font-semibold text-white text-right">{hoveredTracking.activity}</span></div>
            <div className="flex justify-between gap-2"><span className="text-slate-400">Location:</span><span className="font-semibold text-white text-right">{hoveredTracking.location}</span></div>
            <div className="flex justify-between gap-2"><span className="text-slate-400">Time:</span><span className="font-semibold text-white text-right">{hoveredTracking.date} • {hoveredTracking.time}</span></div>
          </div>
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-[#0F172A]"></div>
        </div>
      )}

      {/* ── Pickup Tooltip ── */}
      {hoveredPickup && (() => {
        const showBelow = hoveredPickup.rect.top < 260;
        return (
          <div className="fixed z-[9999] pointer-events-none bg-[#0F172A] text-white text-[11px] md:text-xs p-2.5 md:p-3 rounded-xl shadow-xl w-52 md:w-64"
            style={{
              top: showBelow ? hoveredPickup.rect.bottom + 10 : hoveredPickup.rect.top - 10,
              left: Math.min(Math.max(hoveredPickup.rect.left + hoveredPickup.rect.width / 2, 112), window.innerWidth - 112),
              transform: showBelow ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
            }}>
            <div className="font-bold flex items-center gap-1.5 mb-1.5"><MapPin className="w-3.5 h-3.5 text-[#00A86B] shrink-0" />{hoveredPickup.name}</div>
            <div className="text-slate-300 font-normal leading-relaxed border-t border-white/10 pt-1.5 break-words whitespace-normal">
              {hoveredPickup.address || 'No address on file'}
              {(hoveredPickup.city || hoveredPickup.state || hoveredPickup.pinCode) && (
                <div>{[hoveredPickup.city, hoveredPickup.state].filter(Boolean).join(', ')}{hoveredPickup.pinCode ? ` – ${hoveredPickup.pinCode}` : ''}</div>
              )}
              {hoveredPickup.phone && <div className="text-slate-400 mt-1">{hoveredPickup.phone}</div>}
            </div>
            {showBelow ? (
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 border-[6px] border-transparent border-b-[#0F172A]" />
            ) : (
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-[#0F172A]" />
            )}
          </div>
        );
      })()}

      {/* ── Customer Tooltip ── */}
      {hoveredCustomer && (() => {
        const showBelow = hoveredCustomer.rect.top < 260;
        return (
          <div className="fixed z-[9999] pointer-events-none bg-[#0F172A] text-white text-xs font-normal p-3 rounded-xl shadow-xl w-72"
            style={{
              top: showBelow ? hoveredCustomer.rect.bottom + 10 : hoveredCustomer.rect.top - 10,
              left: Math.min(Math.max(hoveredCustomer.rect.left + hoveredCustomer.rect.width / 2, 150), window.innerWidth - 150),
              transform: showBelow ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
            }}>
            <div className="font-normal flex items-center gap-1.5 mb-1.5"><User className="w-3.5 h-3.5 text-[#00A86B] shrink-0" />{hoveredCustomer.name}</div>
            {(hoveredCustomer.address || hoveredCustomer.city || hoveredCustomer.state || hoveredCustomer.pinCode) && (
              <div className="text-slate-300 font-normal leading-relaxed border-t border-white/10 pt-1.5 break-words whitespace-normal">
                {hoveredCustomer.address}
                {(hoveredCustomer.city || hoveredCustomer.state || hoveredCustomer.pinCode) && (
                  <div className="mt-0.5">
                    {[hoveredCustomer.city, hoveredCustomer.state].filter(Boolean).join(', ')}
                    {hoveredCustomer.pinCode && ` - ${hoveredCustomer.pinCode}`}
                  </div>
                )}
              </div>
            )}
            {hoveredCustomer.email && (
              <div className="flex items-center gap-1.5 text-slate-300 font-normal mt-1.5 pt-1.5 border-t border-white/10 break-all">
                <Mail className="w-3.5 h-3.5 text-[#00A86B] shrink-0" />{hoveredCustomer.email}
              </div>
            )}
            {showBelow ? (
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 border-[6px] border-transparent border-b-[#0F172A]" />
            ) : (
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-[#0F172A]" />
            )}
          </div>
        );
      })()}

      {/* ── Product line-item hover card — shared component/hook, matches Orders page style ── */}
      <ProductTooltipCard
        productHoverPos={productHoverPos}
        order={orders.find(o => o.awb === productHoverPos?.id)}
      />
    </AdminLayout>
  );
}
