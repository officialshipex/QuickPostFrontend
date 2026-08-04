import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { DesktopPagination } from '../../hooks/usePagination';
import { apiClient } from '../../services/apiClient';
import {
  Search, Download, RefreshCw, ChevronLeft, ChevronRight, ChevronDown,
  Filter, Truck, RotateCcw, CheckCircle2, AlertTriangle, Clock, Package, MoreHorizontal, MapPin, Check, History, User, Settings, Flame, X, Loader2, Zap, IndianRupee, Calendar, Mail, FileText, Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassDropdown } from '../../components/ui/GlassDropdown';
import { GlassDateFilter } from '../../components/ui/GlassDateFilter';
import { TruncatedText } from '../../components/ui/TruncatedText';
import { TableLoader } from '../../components/ui/TableLoader';
import { EmptyState } from '../../components/ui/EmptyState';
import { useMobilePaginationBar } from '../../hooks/useMobilePaginationBar';

const COURIER_OPTS = ['Delhivery', 'Ekart', 'XpressBees', 'Shadowfax', 'DTDC', 'BlueDart', 'Ecom Express'];
const STATUS_OPTS = ['Booked', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered', 'RTO Initiated', 'RTO Delivered', 'Lost'];
const CHANNEL_OPTS = ['Shopify', 'WooCommerce', 'Manual', 'API', 'Wix', 'Amazon'];
const ORDER_TYPE_OPTS = ['Prepaid', 'COD'];
const VENDOR_OPTS = ['Vendor A', 'Vendor B', 'Vendor C'];
const PICKUP_ADDR_OPTS = ['Mumbai, MH', 'Delhi, DL', 'Bangalore, KA', 'Hyderabad, TS', 'Chennai, TN'];

const STATUS_STYLES: Record<string, string> = {
  'Booked': 'bg-slate-50 text-slate-700 border-slate-200',
  'Picked Up': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'In Transit': 'bg-sky-50 text-sky-700 border-sky-200',
  'Out for Delivery': 'bg-amber-50 text-amber-700 border-amber-200',
  'Delivered': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'RTO Initiated': 'bg-orange-50 text-orange-700 border-orange-200',
  'RTO Delivered': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Lost': 'bg-slate-100 text-slate-500 border-slate-200',
};

const STATUS_RIBBON_COLORS: Record<string, string> = {
  'Booked': '#64748B',
  'Picked Up': '#4F46E5',
  'In Transit': '#0284C7',
  'Out for Delivery': '#D97706',
  'Delivered': '#059669',
  'RTO Initiated': '#EA580C',
  'RTO Delivered': '#059669',
  'Lost': '#94A3B8',
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

const renderAgeing = (manifestDateStr: string) => {
  const days = calculateAgeingDays(manifestDateStr);
  const formattedDate = new Date(manifestDateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const tooltipText = `Manifested on ${formattedDate} — ${days} working days pending.`;
  if (days <= 1) return (
    <div className="flex items-center gap-1.5 text-[#64748B]" title={tooltipText}><CheckCircle2 className="w-3.5 h-3.5" /><span>On schedule</span></div>
  );
  if (days <= 3) return (
    <div className="flex items-center gap-1.5 text-[#64748B]" title={tooltipText}><Clock className="w-3.5 h-3.5" /><span>{days} days</span></div>
  );
  if (days <= 6) return (
    <div className="flex items-center gap-1.5 text-[#0F172A] font-bold" title={tooltipText}><AlertTriangle className="w-3.5 h-3.5" /><span>{days} days</span></div>
  );
  return (
    <div className="flex items-center gap-1.5 text-[#0F172A] font-bold" title={tooltipText}><Flame className="w-3.5 h-3.5" /><span>{days} days</span></div>
  );
};

// Map raw API order document to the shape the UI expects
const mapOrder = (o: any) => ({
  awb: o.awb_number || '',
  orderId: String(o.orderId || ''),
  orderType: o.paymentDetails?.method || 'Prepaid',
  courier: o.courierServiceName || '—',
  channel: o.channel || 'API',
  seller: o.userId?.company || o.userId?.fullname || 'Unknown',
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
  weight: o.packageDetails?.deadWeight ? `${o.packageDetails.deadWeight}g` : '—',
  dimensions: '—',
  volWeight: o.packageDetails?.volumetricWeight?.calculatedWeight
    ? `${o.packageDetails.volumetricWeight.calculatedWeight} KG`
    : '—',
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

  const [userDetails, setUserDetails] = useState('');
  const [orderId, setOrderId] = useState('');
  const [productSpecs, setProductSpecs] = useState('');
  const [packageSpecs, setPackageSpecs] = useState('');
  const [forwardAwb, setForwardAwb] = useState('');
  const [rtoAwb, setRtoAwb] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [copiedAwb, setCopiedAwb] = useState<string | null>(null);
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const handleCopyAwb = (awb: string) => {
    navigator.clipboard.writeText(awb).then(() => {
      setCopiedAwb(awb);
      setCopyToast(awb);
      setTimeout(() => setCopiedAwb(prev => (prev === awb ? null : prev)), 1500);
      setTimeout(() => setCopyToast(prev => (prev === awb ? null : prev)), 2000);
    });
  };
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const [showLastUpdate, setShowLastUpdate] = useState(false);
  const [showAgeingLegend, setShowAgeingLegend] = useState(false);
  const ageingLegendRef = useRef<HTMLTableHeaderCellElement>(null);
  const [hoveredTracking, setHoveredTracking] = useState<{id: string, rect: DOMRect, activity: string, location: string, date: string, time: string} | null>(null);
  const [hoveredPickup, setHoveredPickup] = useState<{ id: string; rect: DOMRect; name: string; address: string; city: string; state: string; pinCode: string; phone: string } | null>(null);
  const [hoveredCustomer, setHoveredCustomer] = useState<{ rect: DOMRect; name: string; address: string; city: string; state: string; pinCode: string; email: string } | null>(null);
  const [productHoverPos, setProductHoverPos] = useState<{ id: string; top: number; left: number } | null>(null);

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
      if (selectedStatuses.length) params.status = selectedStatuses.join(',');
      if (selectedChannels.length) params.channel = selectedChannels.join(',');
      if (selectedOrderTypes.length) params.orderType = selectedOrderTypes.join(',');
      if (selectedPickupAddrs.length) params.pickupCity = selectedPickupAddrs.map(a => a.split(',')[0].trim()).join(',');
      if (userDetails) params.userId = userDetails;
      if (orderId) params.orderId = orderId;
      if (productSpecs) params.product = productSpecs;
      if (forwardAwb) params.awb = forwardAwb;
      if (rtoAwb) params.rtoAwb = rtoAwb;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

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
  }, [selectedCouriers, selectedStatuses, selectedChannels, selectedOrderTypes, selectedPickupAddrs, userDetails, orderId, productSpecs, forwardAwb, rtoAwb, dateFrom, dateTo]);

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

  // Close popovers on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ageingLegendRef.current && !ageingLegendRef.current.contains(e.target as Node)) setShowAgeingLegend(false);
      if (trackingPopoverRef.current && !trackingPopoverRef.current.contains(e.target as Node)) { /* popover handled by hover */ }
      setOpenActionId(null);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close tap-triggered mobile tooltips (product/pickup) on any outside tap
  useEffect(() => {
    if (!productHoverPos && !hoveredPickup) return;
    const handler = () => { setProductHoverPos(null); setHoveredPickup(null); };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, [productHoverPos, hoveredPickup]);

  const hasActiveFilters = selectedCouriers.length > 0 || selectedStatuses.length > 0 || selectedChannels.length > 0 || selectedOrderTypes.length > 0 || selectedPickupAddrs.length > 0 || userDetails || orderId || productSpecs || packageSpecs || forwardAwb || rtoAwb || (dateFrom && dateTo);

  const handleClearAllFilters = () => {
    setSelectedCouriers([]); setSelectedStatuses([]); setSelectedChannels([]);
    setSelectedOrderTypes([]); setSelectedPickupAddrs([]);
    setUserDetails(''); setOrderId(''); setProductSpecs(''); setPackageSpecs('');
    setForwardAwb(''); setRtoAwb(''); setDateFrom(''); setDateTo('');
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

  const handleExport = async () => {
    try {
      const params: Record<string, string> = { export: 'true' };
      if (selectedOrders.length) params.awbs = selectedOrders.join(',');
      if (selectedCouriers.length) params.courier = selectedCouriers.join(',');
      if (selectedStatuses.length) params.status = selectedStatuses.join(',');
      if (selectedChannels.length) params.channel = selectedChannels.join(',');
      if (selectedOrderTypes.length) params.orderType = selectedOrderTypes.join(',');
      if (selectedPickupAddrs.length) params.pickupCity = selectedPickupAddrs.map(a => a.split(',')[0].trim()).join(',');
      if (userDetails) params.userId = userDetails;
      if (orderId) params.orderId = orderId;
      if (productSpecs) params.product = productSpecs;
      if (forwardAwb) params.awb = forwardAwb;
      if (rtoAwb) params.rtoAwb = rtoAwb;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
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
                <h2 className="text-xl font-bold text-[#0F172A]">Shipment Listing</h2>
                <span className="text-[10px] font-bold bg-[#00A86B]/10 text-[#00A86B] px-2 py-0.5 rounded-full">INTERNAL CRM</span>
              </div>
              <p className="hidden md:block text-xs text-[#64748B] mt-0.5">AWB-level details — view, filter and manage all shipments across couriers.</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => fetchRef.current(pageRef.current, rowsPerPageRef.current)} className="flex items-center justify-center gap-1.5 w-9 h-9 md:w-auto md:h-auto md:px-3 md:py-2 rounded-full md:rounded-lg border border-[#E2E8F0] text-xs font-semibold text-[#64748B] hover:bg-[#F8FAFC] transition-colors shrink-0">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> <span className="hidden md:inline">Refresh</span>
              </button>
              <button
                onClick={handleExport}
                disabled={selectedOrders.length === 0}
                className={`flex items-center justify-center gap-1.5 w-9 h-9 md:w-auto md:h-auto md:px-3 md:py-2 rounded-full md:rounded-lg text-xs font-semibold transition-colors shadow-sm shrink-0 ${selectedOrders.length > 0 ? 'bg-[#00A86B] text-white hover:bg-[#009960] cursor-pointer' : 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed opacity-60'}`}
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Export{selectedOrders.length > 0 ? ` (${selectedOrders.length})` : ''}</span>
              </button>
            </div>
          </div>

          {/* Mobile Filters trigger */}
          <div className="md:hidden flex items-center gap-2 mt-1 w-full">
            {selectedOrders.length > 0 && (
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-bold text-blue-700 whitespace-nowrap">{selectedOrders.length} selected</span>
                <button className="h-7 px-2.5 rounded-md bg-white border border-blue-200 text-[11px] font-bold text-blue-700 shadow-sm hover:bg-blue-50 transition-colors whitespace-nowrap">Export</button>
              </div>
            )}
            <div className="flex items-center gap-2 ml-auto shrink-0">
              <button
                onClick={() => setIsMobileFiltersOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#00A86B] text-white text-[12px] font-bold shadow-sm whitespace-nowrap"
              >
                <Filter className="w-3.5 h-3.5" /> Filters
              </button>
              {hasActiveFilters && (
                <span className="text-[11px] font-bold text-[#00A86B] bg-[#F0FDF4] border border-[#00A86B]/20 px-2.5 py-1 rounded-full whitespace-nowrap">Active</span>
              )}
            </div>
          </div>

          {/* Filter Row — evenly distributed 2-row grid, uniform pill sizes */}
          <div className="filter-grid hidden md:grid grid-cols-6 gap-3 mt-3">
            <div className="relative">
              <input type="text" placeholder="Search user..." value={userDetails} onChange={e => setUserDetails(e.target.value)} className="glass-search-input w-full" />
              <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute right-2.5 top-1/2 -translate-y-1/2" />
            </div>

            <input
              type="text"
              placeholder="Search order..."
              value={orderId}
              onChange={e => setOrderId(e.target.value)}
              className="glass-search-input w-full"
            />

            <input
              type="text"
              placeholder="Search SKU / item..."
              value={productSpecs}
              onChange={e => setProductSpecs(e.target.value)}
              className="glass-search-input w-full"
            />

            <input
              type="text"
              placeholder="Search weight / dims..."
              value={packageSpecs}
              onChange={e => setPackageSpecs(e.target.value)}
              className="glass-search-input w-full"
            />

            <input
              type="text"
              placeholder="Search FWD AWB..."
              value={forwardAwb}
              onChange={e => setForwardAwb(e.target.value)}
              className="glass-search-input w-full"
            />

            <input
              type="text"
              placeholder="Search RTO AWB..."
              value={rtoAwb}
              onChange={e => setRtoAwb(e.target.value)}
              className="glass-search-input w-full"
            />

            <GlassDropdown
              className="w-full [&_.glass-dropdown-trigger]:w-full"
              label="Pickup Address"
              options={PICKUP_ADDR_OPTS.map(o => ({ label: o, value: o }))}
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
              label="All Couriers"
              options={COURIER_OPTS.map(o => ({ label: o, value: o }))}
              selected={selectedCouriers}
              onChange={setSelectedCouriers}
              placeholder="Search courier…"
              icon={<Truck className="w-3.5 h-3.5" />}
            />

            <GlassDropdown
              className="w-full [&_.glass-dropdown-trigger]:w-full"
              label="All Channels"
              options={CHANNEL_OPTS.map(o => ({ label: o, value: o }))}
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
              align="left"
              startDate={dateFrom}
              endDate={dateTo}
              onDateChange={(s, e) => { setDateFrom(s); setDateTo(e); }}
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
                  <th
                    ref={ageingLegendRef}
                    className="py-2 px-4 text-left align-middle relative cursor-pointer hover:bg-[#D1F0E8] transition-colors"
                    onClick={() => setShowAgeingLegend(!showAgeingLegend)}
                  >
                    <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 shrink-0"/><span>Ageing</span></div>
                    {showAgeingLegend && (
                      <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] border border-[#E2E8F0] p-3 z-[100] normal-case tracking-normal">
                        <div className="text-[11px] font-bold text-[#0F172A] mb-2 pb-2 border-b border-[#E2E8F0]">Ageing Indicators</div>
                        <div className="space-y-2.5">
                          <div className="flex items-center gap-2 text-[11px] font-medium text-[#64748B]"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> On schedule (0-1 days)</div>
                          <div className="flex items-center gap-2 text-[11px] font-medium text-[#64748B]"><Clock className="w-3.5 h-3.5 shrink-0" /> Normal (2-3 days)</div>
                          <div className="flex items-center gap-2 text-[11px] font-bold text-[#0F172A]"><AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Delay (4-6 days)</div>
                          <div className="flex items-center gap-2 text-[11px] font-bold text-[#0F172A]"><Flame className="w-3.5 h-3.5 shrink-0" /> Critical (7+ days)</div>
                        </div>
                      </div>
                    )}
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
                    <td
                      className="p-3"
                      onMouseEnter={(e) => {
                        if (row.products.length === 0) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        setProductHoverPos({ id: row.awb, top: rect.bottom + 4, left: rect.left });
                      }}
                      onMouseLeave={() => setProductHoverPos(prev => (prev?.id === row.awb ? null : prev))}
                    >
                      <div className="flex flex-col gap-1">
                        <div className="text-[12px] leading-[18px] font-normal text-[#1E293B] underline decoration-dotted underline-offset-2 truncate max-w-[120px] cursor-default">{row.productName || '—'}</div>
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
                    <td className="px-2 py-3 text-left align-middle">
                      {renderAgeing(row.manifestDate)}
                    </td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full border ${STATUS_STYLES[row.status] || 'bg-blue-50 text-blue-700 border-blue-200'} text-[10px] leading-4 font-semibold uppercase tracking-wider whitespace-nowrap shadow-sm`}>
                        {row.status}
                      </span>
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
                      {apiError ? (
                        <div>
                          <div className="text-red-500 font-semibold text-xs mb-1">API Error</div>
                          <div className="text-red-400 text-[11px] font-mono">{apiError}</div>
                          <div className="text-[#94A3B8] text-[11px] mt-2">Make sure the backend is running and restarted after the CRM routes were added.</div>
                        </div>
                      ) : (
                        <span className="text-[#64748B] font-medium">No records found matching your criteria</span>
                      )}
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
        <div className="md:hidden flex-1 overflow-y-auto bg-[#F8FAFC] relative">
          {loading && <TableLoader />}
          {paginated.length === 0 ? (
            <EmptyState title="No shipments found" subtitle="Try changing filters" />
          ) : (
            <div className="p-4 space-y-4">
              {paginated.map((row, idx) => {
                const accent = getRibbonColor(row.status);
                return (
                  <div key={row.awb || idx} className="relative bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
                    <div
                      className="absolute top-0 left-0 px-3.5 py-1 text-[10px] font-bold text-white uppercase tracking-wide"
                      style={{ background: accent, clipPath: 'polygon(0 0, 100% 0, 84% 100%, 0% 100%)' }}
                    >
                      {row.status}
                    </div>

                    <div className="pt-8 px-4 pb-4">
                      <div className="flex items-center justify-between mb-3 gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <input type="checkbox" checked={selectedOrders.includes(row.awb)} onChange={() => toggleSelect(row.awb)} className="rounded border-gray-300 accent-[#00A86B] w-4 h-4 shrink-0" />
                          <span className="text-[#64748B] font-medium text-[12px]">{row.companyId}</span>
                        </div>
                        <span className="text-[12px] font-semibold text-[#009D64]">{row.orderId}</span>
                      </div>

                      <div className="rounded-xl p-3 mb-3 bg-white" style={{ border: `1px solid ${accent}` }}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <TruncatedText text={row.seller} maxLength={24} className="text-[14px] leading-[20px] font-semibold text-[#1E293B]" />
                            <TruncatedText text={row.email} maxLength={28} className="text-[12px] leading-[18px] font-normal text-[#64748B]" />
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-[12px] font-semibold text-[#0F172A]">{row.shipmentValue}</div>
                            <span className="px-2 py-0.5 rounded-full border border-blue-200 text-[#004AAD] font-semibold text-[10px] leading-4 bg-blue-50/50 inline-block w-fit mt-0.5">{row.paymentMode}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start justify-between mb-3 px-1 gap-2">
                        <span
                          className="text-[12px] font-medium text-[#0F172A] underline decoration-dotted underline-offset-2 truncate flex-1 cursor-help"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (row.products.length === 0) return;
                            const rect = e.currentTarget.getBoundingClientRect();
                            setProductHoverPos({ id: row.awb, top: rect.bottom + 4, left: rect.left });
                          }}
                        >
                          {row.productName || '—'}
                        </span>
                        <span className="text-[11px] font-medium text-[#64748B] shrink-0">QTY: {row.qty}</span>
                      </div>

                      <div className="flex items-start justify-between bg-[#F8FAFC] rounded-xl px-3 py-2.5 mb-3 gap-2">
                        <div className="min-w-0">
                          <div className="text-[10px] font-normal text-[#94A3B8] uppercase tracking-wider">Courier</div>
                          <div className="text-[12px] font-medium text-[#0F172A] mt-0.5">{row.courier}</div>
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
                            className="text-[12px] font-medium text-[#0F172A] mt-0.5 underline decoration-dotted underline-offset-2 cursor-help truncate"
                            onClick={(e) => {
                              e.stopPropagation();
                              setHoveredPickup({ id: row.awb, rect: e.currentTarget.getBoundingClientRect(), name: row.pickupName, address: row.pickupAddressLine, city: row.pickupCity, state: row.pickupState, pinCode: row.pickupPinCode, phone: row.pickupPhone });
                            }}
                          >
                            {row.pickupAddr || '—'}
                          </div>
                          <div className="text-[11px] text-[#64748B] mt-0.5">{renderAgeing(row.manifestDate)}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button onClick={() => navigate(`/admin/order-tracking?id=${row.orderId}`)} className="flex-1 py-2.5 rounded-xl bg-[#1e40af] text-white text-[12px] font-bold flex items-center justify-center gap-1.5 hover:bg-[#1e3a8a] transition-colors">
                          View Details
                        </button>
                        <div className="relative shrink-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); setOpenActionId(openActionId === row.awb ? null : row.awb); }}
                            className="w-10 h-10 rounded-full border border-[#E2E8F0] text-[#64748B] bg-white flex items-center justify-center"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          {openActionId === row.awb && (
                            <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] border border-[#E2E8F0] py-2 z-[60] text-left" onClick={(e) => e.stopPropagation()}>
                              <button className="w-full text-left px-4 py-2 text-[12px] font-medium text-[#475569] hover:bg-[#F8FAFC]" onClick={() => navigate(`/admin/order-tracking?id=${row.orderId}`)}>Track Shipment</button>
                              <button className="w-full text-left px-4 py-2 text-[12px] font-medium text-[#475569] hover:bg-[#F8FAFC]" onClick={() => { alert('Downloading Proof of Delivery (POD)...'); setOpenActionId(null); }}>Download POD</button>
                              <button className="w-full text-left px-4 py-2 text-[12px] font-medium text-[#475569] hover:bg-[#F8FAFC]" onClick={() => { alert('Opening Support Ticket Escalation dialog...'); setOpenActionId(null); }}>Raise Ticket</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {useMobilePaginationBar({
            page, setPage, totalPages, rowsPerPage, setRowsPerPage,
            startIndex, endIndex, totalItems: totalCount,
          })}
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
                  <input type="text" value={userDetails} onChange={e => setUserDetails(e.target.value)} placeholder="Search user..."
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B]" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Order ID</label>
                  <input type="text" value={orderId} onChange={e => setOrderId(e.target.value)} placeholder="Search order..."
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B]" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">SKU / Item</label>
                  <input type="text" value={productSpecs} onChange={e => setProductSpecs(e.target.value)} placeholder="Search SKU / item..."
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B]" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Weight / Dimensions</label>
                  <input type="text" value={packageSpecs} onChange={e => setPackageSpecs(e.target.value)} placeholder="Search weight / dims..."
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B]" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Forward AWB</label>
                  <input type="text" value={forwardAwb} onChange={e => setForwardAwb(e.target.value)} placeholder="Search FWD AWB..."
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B]" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">RTO AWB</label>
                  <input type="text" value={rtoAwb} onChange={e => setRtoAwb(e.target.value)} placeholder="Search RTO AWB..."
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B]" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Pickup Address</label>
                  <select
                    value={selectedPickupAddrs[0] || ''}
                    onChange={(e) => setSelectedPickupAddrs(e.target.value ? [e.target.value] : [])}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B] bg-white"
                  >
                    <option value="">All Pickup Addresses</option>
                    {PICKUP_ADDR_OPTS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
                  <select
                    value={selectedStatuses[0] || ''}
                    onChange={(e) => setSelectedStatuses(e.target.value ? [e.target.value] : [])}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B] bg-white"
                  >
                    <option value="">All Statuses</option>
                    {STATUS_OPTS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Courier</label>
                  <select
                    value={selectedCouriers[0] || ''}
                    onChange={(e) => setSelectedCouriers(e.target.value ? [e.target.value] : [])}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B] bg-white"
                  >
                    <option value="">All Couriers</option>
                    {COURIER_OPTS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Channel</label>
                  <select
                    value={selectedChannels[0] || ''}
                    onChange={(e) => setSelectedChannels(e.target.value ? [e.target.value] : [])}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B] bg-white"
                  >
                    <option value="">All Channels</option>
                    {CHANNEL_OPTS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Order Type</label>
                  <select
                    value={selectedOrderTypes[0] || ''}
                    onChange={(e) => setSelectedOrderTypes(e.target.value ? [e.target.value] : [])}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B] bg-white"
                  >
                    <option value="">All Types</option>
                    {ORDER_TYPE_OPTS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Date Range</label>
                  <GlassDateFilter
                    className="w-full [&_.glass-dropdown-trigger]:w-full [&_.glass-dropdown-trigger]:h-11"
                    startDate={dateFrom}
                    endDate={dateTo}
                    onDateChange={(s, e) => { setDateFrom(s); setDateTo(e); }}
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

      {/* ── Product line-item hover card — rendered on document.body to escape overflow-auto clipping ── */}
      {productHoverPos && (() => {
        const hoveredOrder = orders.find(o => o.awb === productHoverPos.id);
        if (!hoveredOrder || hoveredOrder.products.length === 0) return null;
        const grandTotal = hoveredOrder.products.reduce((s: number, p: any) => s + p.total, 0);
        return createPortal(
          <div
            className="fixed z-[999] w-[260px] md:w-[320px] bg-white border border-[#E2E8F0] rounded-xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.15)] p-2 md:p-3 pointer-events-none"
            style={{
              top: productHoverPos.top,
              left: Math.max(4, Math.min(productHoverPos.left, window.innerWidth - 276)),
            }}
          >
            <table className="w-full text-[10px] md:text-[11px] border-collapse">
              <thead>
                <tr className="text-[#64748B] border-b border-[#E2E8F0]">
                  <th className="text-left font-semibold pb-1.5 pr-2">Name</th>
                  <th className="text-left font-semibold pb-1.5 pr-2">SKU</th>
                  <th className="text-left font-semibold pb-1.5 pr-2">Qty</th>
                  <th className="text-left font-semibold pb-1.5 pr-2">Price</th>
                  <th className="text-left font-semibold pb-1.5">Total</th>
                </tr>
              </thead>
              <tbody>
                {hoveredOrder.products.map((p: any, i: number) => (
                  <tr key={i} className="text-[#0F172A]">
                    <td className="py-1 pr-2 break-words">{p.name}</td>
                    <td className="py-1 pr-2 text-[#64748B] break-words">{p.sku}</td>
                    <td className="py-1 pr-2">{p.qty}</td>
                    <td className="py-1 pr-2">₹{p.price.toLocaleString('en-IN')}</td>
                    <td className="py-1 font-semibold">₹{p.total.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-[#E2E8F0] font-bold text-[#0F172A]">
                  <td className="pt-1.5">Total</td>
                  <td className="pt-1.5"></td>
                  <td className="pt-1.5">{hoveredOrder.qty}</td>
                  <td className="pt-1.5"></td>
                  <td className="pt-1.5">₹{grandTotal.toLocaleString('en-IN')}</td>
                </tr>
              </tfoot>
            </table>
          </div>,
          document.body
        );
      })()}
    </AdminLayout>
  );
}
