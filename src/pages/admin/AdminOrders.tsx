import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { apiClient } from '../../services/apiClient';
import { getToken } from '../../utils/session';
import { PDFDocument } from 'pdf-lib';
import {
  Search, ChevronDown, RefreshCcw, Send, Calendar, Check, MoreHorizontal,
  IndianRupee, Package, User, Settings, MapPin, X, Truck, CreditCard,
  CheckCircle2, Clock, AlertTriangle, Flame, History, Layers, Loader2, RefreshCw
} from 'lucide-react';
import { GlassDropdown } from '../../components/ui/GlassDropdown';
import { GlassDateFilter } from '../../components/ui/GlassDateFilter';
import { AdminPickupManifest } from './AdminPickupManifest';
import { useAdminTab } from '../../context/AdminUserContext';

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const MAIN_TABS = ['New', 'Ready to Ship', 'Pickup & Manifest', 'In Transit', 'Delivered'];
const MORE_TABS = ['Out for Delivery', 'Cancelled', 'Lost', 'Damaged', 'RTO Initiated', 'RTO In Transit', 'RTO Delivered', 'RTO Lost', 'RTO Damaged', 'All'];

// Status array sent to API per tab
const STATUS_FOR_TAB: Record<string, string[]> = {
  'New':              ['new'],
  'Ready to Ship':    ['Booked', 'Not Picked', 'Ready To Ship'],
  'Pickup & Manifest':['Pickup Scheduled', 'Pickup & Manifest'],
  'In Transit':       ['In-transit'],
  'Out for Delivery': ['Out for Delivery'],
  'Delivered':        ['Delivered'],
  'Cancelled':        ['Cancelled'],
  'Lost':             ['Lost'],
  'Damaged':          ['Damaged'],
  'RTO Initiated':    ['RTO Initiated'],
  'RTO In Transit':   ['RTO In Transit'],
  'RTO Delivered':    ['RTO Delivered'],
  'RTO Lost':         ['RTO Lost'],
  'RTO Damaged':      ['RTO Damaged'],
  'All':              [],
};

// ─── Badge styles ──────────────────────────────────────────────────────────────
const STATUS_BADGE_STYLES: Record<string, string> = {
  'New':               'bg-slate-50 text-slate-700 border-slate-200',
  'Booked':            'bg-blue-50 text-blue-700 border-blue-200',
  'Not Picked':        'bg-amber-50 text-amber-700 border-amber-200',
  'Ready To Ship':     'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Ready to Ship':     'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Pickup & Manifest': 'bg-violet-50 text-violet-700 border-violet-200',
  'Pickup Scheduled':  'bg-violet-50 text-violet-700 border-violet-200',
  'In-Transit':        'bg-sky-50 text-sky-700 border-sky-200',
  'In-transit':        'bg-sky-50 text-sky-700 border-sky-200',
  'In Transit':        'bg-sky-50 text-sky-700 border-sky-200',
  'Delivered':         'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Out for Delivery':  'bg-amber-50 text-amber-700 border-amber-200',
  'Cancelled':         'bg-rose-50 text-rose-700 border-rose-200',
  'Lost':              'bg-slate-100 text-slate-500 border-slate-200',
  'Damaged':           'bg-rose-50 text-rose-700 border-rose-200',
  'RTO Initiated':     'bg-orange-50 text-orange-700 border-orange-200',
  'RTO In Transit':    'bg-orange-50 text-orange-700 border-orange-200',
  'RTO Delivered':     'bg-emerald-50 text-emerald-700 border-emerald-200',
  'RTO Lost':          'bg-slate-100 text-slate-500 border-slate-200',
  'RTO Damaged':       'bg-rose-50 text-rose-700 border-rose-200',
};

const getStatusBadgeClass = (status: string) =>
  `${STATUS_BADGE_STYLES[status] || 'bg-blue-50 text-blue-700 border-blue-200'} px-2.5 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap shadow-sm`;

// ─── Ageing (Pickup & Manifest tab) ───────────────────────────────────────────
const calculateAgeingDays = (dateStr: string) => {
  const start = new Date(dateStr); start.setHours(0, 0, 0, 0);
  const end   = new Date();        end.setHours(0, 0, 0, 0);
  let count = 0;
  const cur = new Date(start);
  while (cur < end) { if (cur.getDay() !== 0) count++; cur.setDate(cur.getDate() + 1); }
  return count;
};

const renderAgeing = (dateStr: string) => {
  const days = calculateAgeingDays(dateStr);
  const formattedDate = new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const tip = `Manifested on ${formattedDate} — ${days} working days pending pickup.`;
  if (days <= 1) return <div className="flex items-center gap-1.5 text-[#64748B]" title={tip}><CheckCircle2 className="w-3.5 h-3.5" /><span>On schedule</span></div>;
  if (days <= 3) return <div className="flex items-center gap-1.5 text-[#64748B]" title={tip}><Clock className="w-3.5 h-3.5" /><span>{days} days</span></div>;
  if (days <= 6) return <div className="flex items-center gap-1.5 text-[#0F172A] font-bold" title={tip}><AlertTriangle className="w-3.5 h-3.5" /><span>{days} days</span></div>;
  return <div className="flex items-center gap-1.5 text-[#0F172A] font-bold" title={tip}><Flame className="w-3.5 h-3.5" /><span>{days} days</span></div>;
};

// ─── Map raw API order → display shape ────────────────────────────────────────
const mapOrder = (o: any) => {
  const l = o.packageDetails?.volumetricWeight?.length || 0;
  const w = o.packageDetails?.volumetricWeight?.width  || 0;
  const h = o.packageDetails?.volumetricWeight?.height || 0;
  const lastTracking = Array.isArray(o.tracking) && o.tracking.length > 0
    ? o.tracking[o.tracking.length - 1]
    : null;
  return {
    _id:            o._id,
    orderId:        o.orderId || o._id,
    awb:            o.awb_number || o.awbNumber || '',
    userName:       o.userId?.fullname || o.userId?.name || '—',
    userEmail:      o.userId?.email || '—',
    userUserId:     o.userId?.userId || '',
    date:           o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—',
    manifestDate:   o.manifestDate || o.createdAt || new Date().toISOString(),
    productName:    (o.productDetails || []).map((p: any) => p.name).filter(Boolean).join(', ') || '—',
    sku:            (o.productDetails || []).map((p: any) => p.sku).filter(Boolean).join(', ') || '—',
    qty:            (o.productDetails || []).reduce((s: number, p: any) => s + (p.quantity || 0), 0) || 1,
    weight:         `${o.packageDetails?.applicableWeight || 0} KG`,
    dimensions:     `${l}×${w}×${h}`,
    volWeight:      `${((l * w * h) / 5000).toFixed(2)} KG`,
    payment:        o.paymentDetails?.amount ?? 0,
    paymentType:    o.paymentDetails?.method || 'Prepaid',
    customerName:   o.receiverAddress?.contactName || '—',
    customerPhone:  o.receiverAddress?.phoneNumber || '—',
    pickupName:     o.pickupAddress?.contactName || '—',
    courier:        o.courierServiceName || '—',
    bookedDate:     o.shipmentCreatedAt ? new Date(o.shipmentCreatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—',
    status:         o.status || 'New',
    lastUpdateEvent:o.lastUpdateEvent || lastTracking?.status || '',
    lastUpdateDate: lastTracking?.StatusDateTime || null,
    totalPackages:  o.totalPackages || 1,
    pickedPackages: o.pickedPackages || 0,
    pickupId:       o.pickupId || `PID${o.orderId}`,
    channel:        o.channel || 'CUSTOM',
  };
};

const ITEMS_PER_PAGE = 20;

// ─── File download helper ──────────────────────────────────────────────────────
const BACKEND_BASE = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000/v1';

const downloadBlob = async (path: string, filename: string) => {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BACKEND_BASE}${path}`, { headers });
  if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`);
  const blob = await res.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(blobUrl);
};

// ─── Payment type dropdown options ────────────────────────────────────────────
const PAYMENT_TYPE_OPTIONS = [
  { label: 'Prepaid',     value: 'Prepaid' },
  { label: 'COD',         value: 'COD' },
  // { label: 'Partial COD', value: 'Partial COD' },
];

export function AdminOrders() {
  // Both isAdmin and adminTab come from the API (fresh DB read), not from JWT.
  // JWT isAdmin can be stale if the user was granted admin after their last login.
  const { isAdmin, adminTab, currentUserId } = useAdminTab();
  const isAdminView = isAdmin && adminTab;

  // ── Tabs ──
  const [activeTab, setActiveTab]   = useState('New');
  const [showMore, setShowMore]     = useState(false);
  const moreRef                     = useRef<HTMLDivElement>(null);
  const actionMenuRef               = useRef<HTMLDivElement>(null);
  const [showActionMenu, setShowActionMenu] = useState(false);

  // ── Orders data ──
  const [orders, setOrders]         = useState<any[]>([]);
  const [loading, setLoading]       = useState(false);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // ── Filter state (applied on Apply click) ──
  const [orderId,                setOrderId]               = useState('');
  const [awbNumber,              setAwbNumber]             = useState('');
  const [selectedPaymentTypes,   setSelectedPaymentTypes]  = useState<string[]>([]);
  const [selectedPickupAddresses,setSelectedPickupAddresses] = useState<string[]>([]);
  const [selectedCouriers,       setSelectedCouriers]      = useState<string[]>([]);
  const [dateStart,              setDateStart]             = useState('');
  const [dateEnd,                setDateEnd]               = useState('');

  // ── Dynamic options from API ──
  const [courierOptions,  setCourierOptions]  = useState<{ label: string; value: string }[]>([]);
  const [pickupOptions,   setPickupOptions]   = useState<{ label: string; value: string }[]>([]);

  // ── User search (admin-only) ──
  const [userQuery,       setUserQuery]       = useState('');
  const [userSuggestions, setUserSuggestions] = useState<any[]>([]);
  const [userMongoId,     setUserMongoId]     = useState('');

  // ── Filter refresh trigger (incremented on apply/clear so useEffect re-fetches with latest state) ──
  const [refreshTrigger,   setRefreshTrigger]   = useState(0);

  // ── UI state ──
  const [selectedOrders,   setSelectedOrders]   = useState<string[]>([]);
  const [drawerOrder,      setDrawerOrder]       = useState<any | null>(null);
  // dropdownPos renders the row-action dropdown via portal (fixed position) so overflow-auto doesn't clip it
  const [dropdownPos,      setDropdownPos]       = useState<{ id: string; top: number; left: number } | null>(null);
  const [showAgeingLegend, setShowAgeingLegend] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ageingLegendRef = useRef<any>(null);
  const [hoveredPickup,   setHoveredPickup]     = useState<{ id: string; rect: DOMRect; name: string } | null>(null);

  // ── Global search (header bar) ──
  const [globalSearchQuery, setGlobalSearchQuery] = useState((window as any).__adminSearchQuery?.toLowerCase() || '');
  useEffect(() => {
    const handler = (e: Event) => { setGlobalSearchQuery(((e as CustomEvent).detail || '').toLowerCase()); setPage(1); };
    window.addEventListener('admin-search', handler);
    return () => window.removeEventListener('admin-search', handler);
  }, []);

  // ── Close dropdowns on outside click ──
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setShowMore(false);
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) setShowActionMenu(false);
      if (ageingLegendRef.current && !ageingLegendRef.current.contains(e.target as Node)) setShowAgeingLegend(false);
      // Row-action dropdown is closed via its own backdrop overlay (portal); no setDropdownPos here
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── User search debounce (admin-only) ──
  useEffect(() => {
    if (!isAdminView || userQuery.trim().length < 2) { setUserSuggestions([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await apiClient.get(`/admin/searchUser?query=${encodeURIComponent(userQuery)}`);
        setUserSuggestions(res.data.users || []);
      } catch { setUserSuggestions([]); }
    }, 300);
    return () => clearTimeout(t);
  }, [userQuery, isAdminView]);

  // ── Fetch orders from API ──
  const fetchOrders = useCallback(async (pg = page) => {
    setLoading(true);
    try {
      const statuses = STATUS_FOR_TAB[activeTab] || [];
      const params: Record<string, any> = {
        page:  pg,
        limit: ITEMS_PER_PAGE,
      };
      if (statuses.length > 0)          params.status               = statuses;
      if (orderId)                       params.orderId              = orderId;
      if (awbNumber)                     params.awbNumber            = awbNumber;
      if (selectedCouriers.length > 0)   params.courierServiceName   = selectedCouriers.join(',');
      if (selectedPaymentTypes.length > 0) params.paymentType        = selectedPaymentTypes.join(',');
      if (selectedPickupAddresses.length > 0) params.pickupContactName = selectedPickupAddresses.join(',');
      if (dateStart)                     params.startDate            = dateStart;
      if (dateEnd)                       params.endDate              = dateEnd;
      if (isAdminView && userMongoId)          params.userId = userMongoId;
      else if (!isAdminView && currentUserId) params.userId = currentUserId;
      if (globalSearchQuery)             params.searchQuery          = globalSearchQuery;

      const res = await apiClient.get('/admin/filterEmployeeOrders', { params });
      const raw = res.data?.orders || [];
      setOrders(raw.map(mapOrder));
      setTotalPages(res.data?.totalPages || 1);
      setTotalRecords(res.data?.totalOrders || res.data?.totalRecords || raw.length);
      if (res.data?.courierServices) setCourierOptions(res.data.courierServices.map((s: any) => ({ label: s, value: s })));
      if (res.data?.pickupLocations) setPickupOptions(res.data.pickupLocations.map((p: any) => ({ label: p, value: p })));
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, orderId, awbNumber, selectedCouriers, selectedPaymentTypes, selectedPickupAddresses, dateStart, dateEnd, userMongoId, globalSearchQuery, isAdmin, isAdminView, currentUserId]);

  // ── Per-order action handlers ──
  const handleLabel = async (id: string) => {
    try { await downloadBlob(`/printlabel/generate-pdf/${id}`, `Label-${id}.pdf`); }
    catch (e) { console.error('Label download failed', e); }
  };

  const handleInvoice = async (id: string) => {
    try { await downloadBlob(`/printinvoice/download-invoice/${id}`, `invoice-${id}.pdf`); }
    catch (e) { console.error('Invoice download failed', e); }
  };

  const handleManifest = async (id: string) => {
    try { await downloadBlob(`/manifest/generate-pdf?orderIds=${id}`, `manifest-${id}.pdf`); }
    catch (e) { console.error('Manifest download failed', e); }
  };

  const handleCancelOrder = async (order: any) => {
    const isBooked = ['Booked', 'Not Picked', 'Ready To Ship'].includes(order.status);
    const endpoint = isBooked ? '/order/cancelOrdersAtBooked' : '/order/cancelOrdersAtNotShipped';
    try {
      await apiClient.post(endpoint, { orderId: order._id });
      fetchOrders(page);
    } catch (e) { console.error('Cancel failed', e); }
  };

  const handleBulkLabel = async (ids: string[]) => {
    if (!ids.length) return;
    try {
      const mergedPdf = await PDFDocument.create();
      const pageW = 595, pageH = 842;
      const labelW = pageW / 2, labelH = pageH / 2;
      let labelCount = 0;
      let currentPage: ReturnType<typeof mergedPdf.addPage> | null = null;
      const token = getToken();
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      for (const id of ids) {
        try {
          const res = await fetch(`${BACKEND_BASE}/printlabel/generate-pdf/${id}`, { headers });
          if (!res.ok) continue;
          const pdfBytes = await (await res.blob()).arrayBuffer();
          const srcPdf = await PDFDocument.load(pdfBytes);
          const copied = await mergedPdf.copyPages(srcPdf, srcPdf.getPageIndices());
          for (const pg of copied) {
            if (ids.length <= 2) {
              const p = mergedPdf.addPage([pageW, pageH]);
              p.drawPage(await mergedPdf.embedPage(pg), { x: 0, y: 0, width: pageW, height: pageH });
            } else {
              if (labelCount % 4 === 0) currentPage = mergedPdf.addPage([pageW, pageH]);
              const x = (labelCount % 2) * labelW;
              const y = pageH - ((Math.floor(labelCount / 2) % 2) + 1) * labelH;
              currentPage!.drawPage(await mergedPdf.embedPage(pg), { x, y, width: labelW, height: labelH });
              labelCount++;
            }
          }
        } catch (e) { console.error(`Label fetch failed for ${id}`, e); }
      }

      const blob = new Blob([await mergedPdf.save()], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'bulk-labels.pdf';
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) { console.error('Bulk label merge failed', e); }
  };

  const handleBulkInvoice = async (ids: string[]) => {
    if (!ids.length) return;
    try {
      const mergedPdf = await PDFDocument.create();
      const token = getToken();
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      for (const id of ids) {
        try {
          const res = await fetch(`${BACKEND_BASE}/printinvoice/download-invoice/${id}`, { headers });
          if (!res.ok) continue;
          const pdfBytes = await (await res.blob()).arrayBuffer();
          const srcPdf = await PDFDocument.load(pdfBytes);
          const copied = await mergedPdf.copyPages(srcPdf, srcPdf.getPageIndices());
          copied.forEach(p => mergedPdf.addPage(p));
        } catch (e) { console.error(`Invoice fetch failed for ${id}`, e); }
      }

      const blob = new Blob([await mergedPdf.save()], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'bulk-invoices.pdf';
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) { console.error('Bulk invoice merge failed', e); }
  };

  const handleBulkManifest = async (ids: string[]) => {
    try { await downloadBlob(`/manifest/generate-pdf?orderIds=${ids.join(',')}`, 'bulk-manifest.pdf'); }
    catch (e) { console.error('Bulk manifest download failed', e); }
  };

  // Fetch on tab/page/globalSearch change, or when filters are explicitly applied/cleared
  useEffect(() => {
    setSelectedOrders([]);
    fetchOrders(page);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, page, refreshTrigger]);

  // Switch tab → reset to page 1
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setPage(1);
    setSelectedOrders([]);
    setShowMore(false);
  };

  const handleApplyFilters = () => { setPage(1); setRefreshTrigger(t => t + 1); };

  const hasActiveFilters = orderId || awbNumber || selectedPaymentTypes.length > 0 || selectedPickupAddresses.length > 0 || selectedCouriers.length > 0 || (dateStart && dateEnd) || (isAdminView && userMongoId);

  const handleClearAllFilters = () => {
    setOrderId(''); setAwbNumber(''); setSelectedPaymentTypes([]); setSelectedPickupAddresses([]);
    setSelectedCouriers([]); setDateStart(''); setDateEnd('');
    if (isAdminView) { setUserQuery(''); setUserSuggestions([]); setUserMongoId(''); }
    setPage(1);
    setRefreshTrigger(t => t + 1); // fires useEffect after all state updates are committed
  };

  const toggleAll = () => setSelectedOrders(selectedOrders.length === orders.length && orders.length > 0 ? [] : orders.map(o => o._id));
  const toggleSelect = (id: string) => setSelectedOrders(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  // ── Tab-specific boolean helpers ──
  const isPMTab  = activeTab === 'Pickup & Manifest';
  const isNewTab = activeTab === 'New';
  const showShipmentCol = !isNewTab && !isPMTab;
  const showLastUpdateCol = !isNewTab && !isPMTab && !['Ready to Ship', 'Booked'].includes(activeTab);

  // Pagination window
  const pageWindow = () => {
    const half = 2; let start = Math.max(1, page - half), end = Math.min(totalPages, page + half);
    if (end - start < 4) { if (start === 1) end = Math.min(totalPages, 5); else start = Math.max(1, end - 4); }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  // ── Action menu items per tab ──
  const renderActionMenuItems = () => {
    const closeMenu = () => setShowActionMenu(false);
    if (isPMTab) return (
      <>
        <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFC]" onClick={() => { handleBulkManifest(selectedOrders); closeMenu(); }}>Download Manifests</button>
        <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFC]" onClick={() => { handleBulkLabel(selectedOrders); closeMenu(); }}>Download Labels</button>
        <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFC]" onClick={() => { handleBulkInvoice(selectedOrders); closeMenu(); }}>Download Invoices</button>
      </>
    );
    if (isNewTab) return (
      <>
        <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC]">Bulk Ship</button>
        <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC]">Update Package Details</button>
        <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC]">Update Pickup Address</button>
        <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC]">Verify Orders</button>
        <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC]">Export Excel</button>
        <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC]" onClick={() => { handleBulkInvoice(selectedOrders); closeMenu(); }}>Download Invoices</button>
        <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#EF4444] hover:bg-red-50 mt-1">Bulk Delete</button>
      </>
    );
    return (
      <>
        <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC]">Export Excel</button>
        <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC]" onClick={() => { handleBulkLabel(selectedOrders); closeMenu(); }}>Download Labels</button>
        <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC]" onClick={() => { handleBulkInvoice(selectedOrders); closeMenu(); }}>Download Invoices</button>
        <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC]" onClick={() => { handleBulkManifest(selectedOrders); closeMenu(); }}>Download Manifests</button>
      </>
    );
  };

  // ── Per-row action items ──
  const close = () => setDropdownPos(null);
  const renderRowActions = (rowOrder: any, _idx: number) => {
    if (isPMTab) return (
      <>
        <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC]" onClick={() => { handleManifest(rowOrder._id); close(); }}>Download Manifest</button>
        <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC]" onClick={close}>Raise a Ticket</button>
      </>
    );
    if (activeTab === 'Ready to Ship') return (
      <>
        <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFC]" onClick={() => { handleLabel(rowOrder._id); close(); }}>Download Label</button>
        <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFC]" onClick={() => { handleInvoice(rowOrder._id); close(); }}>Download Invoice</button>
        <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFC]" onClick={() => { handleManifest(rowOrder._id); close(); }}>Download Manifest</button>
        <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFC]" onClick={close}>Clone Order</button>
        <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#EF4444] hover:bg-red-50 mt-1" onClick={() => { handleCancelOrder(rowOrder); close(); }}>Cancel Order</button>
      </>
    );
    if (isNewTab) return (
      <>
        <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC]" onClick={() => { handleInvoice(rowOrder._id); close(); }}>Download Invoice</button>
        <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC]" onClick={close}>Clone Order</button>
        <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC]" onClick={close}>Update Order</button>
        <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#EF4444] hover:bg-red-50 mt-1" onClick={() => { handleCancelOrder(rowOrder); close(); }}>Delete Order</button>
      </>
    );
    return (
      <>
        <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC]" onClick={() => { handleLabel(rowOrder._id); close(); }}>Download Label</button>
        <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC]" onClick={() => { handleInvoice(rowOrder._id); close(); }}>Download Invoice</button>
        <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC]" onClick={() => { handleManifest(rowOrder._id); close(); }}>Download Manifest</button>
        <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC]" onClick={close}>Clone Order</button>
      </>
    );
  };

  // ── Table column count (for empty-state colSpan) ──
  const colCount = () => {
    let n = 2; // checkbox + (User col if admin or just order)
    if (isAdminView) n++; // separate User col
    if (isPMTab) n += 5; // Pickup ID, Pickup, Pickup Date, Total/Picked, Ageing
    else { n += 4; if (showShipmentCol) n++; } // Order, Product, Package, Payment, Customer, Pickup, [Shipment]
    n += 2; // Status + Actions
    if (showLastUpdateCol) n++;
    return n;
  };

  return (
    <AdminLayout>
      <div className="flex flex-col h-[calc(100vh-72px)] -m-4 md:-m-6 bg-white">

        {/* ── Top Tab Bar ── */}
        <div className="bg-white relative z-50 shrink-0">
          <div className="flex items-center px-6 py-2 border-b border-[#E2E8F0]">
            {/* Left group: scrollable main tabs + More button side by side */}
            <div className="flex items-center flex-1 min-w-0">
              <div className="flex gap-5 items-center overflow-x-auto no-scrollbar">
                {MAIN_TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => handleTabChange(tab)}
                    className={`relative py-3 text-[13px] font-bold transition-colors whitespace-nowrap ${activeTab === tab ? 'text-[#00A86B]' : 'text-[#64748B] hover:text-[#0F172A]'}`}
                  >
                    {tab}
                    {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#00A86B] rounded-t-full" />}
                  </button>
                ))}
              </div>
              {/* More button — outside overflow-x-auto so its dropdown is never clipped, but stays left */}
              <div className="relative shrink-0 ml-5" ref={moreRef}>
                <button
                  onClick={() => setShowMore(!showMore)}
                  className={`py-3 text-[13px] font-bold flex items-center gap-1 transition-colors whitespace-nowrap ${MORE_TABS.includes(activeTab) ? 'text-[#00A86B]' : 'text-[#64748B] hover:text-[#0F172A]'}`}
                >
                  {MORE_TABS.includes(activeTab) ? activeTab : 'More'} <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showMore ? 'rotate-180' : ''}`} />
                </button>
                {showMore && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-[#E2E8F0] overflow-hidden z-[200]">
                    {MORE_TABS.map(tab => (
                      <button key={tab} onClick={() => handleTabChange(tab)}
                        className={`w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-[#F8FAFC] transition-colors ${activeTab === tab ? 'text-[#00A86B] bg-[#00A86B]/5' : 'text-[#475569]'}`}>
                        {tab}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {/* Refresh on the right */}
            <button onClick={() => fetchOrders(page)} className="w-8 h-8 rounded-full border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-[#F8FAFC] shrink-0 ml-4">
              <RefreshCcw className="w-4 h-4" />
            </button>
          </div>

          {/* ── Filter Row — hidden for Pickup & Manifest (that tab has its own UI) ── */}
          {!isPMTab && <div className="p-3 border-b border-[#E2E8F0] flex flex-wrap items-center gap-2.5 bg-[#F8FAFC]/50">

            {/* User search autocomplete — admin view only */}
            {isAdminView && (
              <div className="relative shrink-0">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search user..."
                    value={userQuery}
                    onChange={(e) => {
                      setUserQuery(e.target.value);
                      if (!e.target.value.trim()) { setUserMongoId(''); setUserSuggestions([]); }
                    }}
                    className="h-9 pl-8 pr-3 rounded-lg border border-[#E2E8F0] text-xs bg-white focus:outline-none w-[160px]"
                  />
                  <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 top-1/2 -translate-y-1/2" />
                  {userMongoId && (
                    <button onClick={() => { setUserQuery(''); setUserMongoId(''); setUserSuggestions([]); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                {userSuggestions.length > 0 && !userMongoId && (
                  <div className="absolute left-0 top-full mt-1 bg-white border border-[#E2E8F0] rounded-xl shadow-xl z-50 w-64 max-h-52 overflow-y-auto py-1">
                    {userSuggestions.map((u: any) => (
                      <button key={u._id} type="button"
                        onClick={() => { setUserMongoId(u._id); setUserQuery(`${u.fullname} (${u.email})`); setUserSuggestions([]); }}
                        className="w-full text-left px-3 py-2 hover:bg-[#F0FDF4] flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-bold text-slate-800 truncate">{u.fullname}</div>
                          <div className="text-[10px] text-slate-400 truncate">{u.email} · {u.phoneNumber}</div>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">{u.userId}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Order ID / Pickup ID */}
            <input
              type="text"
              placeholder={isPMTab ? 'Search by pickup ID...' : 'Search by order ID...'}
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs bg-white focus:outline-none w-[170px] shrink-0"
            />

            {/* AWB — only on tabs that have AWB numbers */}
            {!isNewTab && !isPMTab && (
              <input
                type="text"
                placeholder="Search by AWB..."
                value={awbNumber}
                onChange={(e) => setAwbNumber(e.target.value)}
                className="h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs bg-white focus:outline-none w-[150px] shrink-0"
              />
            )}

            {/* Payment Type */}
            <GlassDropdown
              label="Payment Type"
              options={PAYMENT_TYPE_OPTIONS}
              selected={selectedPaymentTypes}
              onChange={setSelectedPaymentTypes}
              placeholder="Search payment type..."
              icon={<CreditCard className="w-3.5 h-3.5" />}
            />

            {/* Pickup Address */}
            <GlassDropdown
              label="Pickup Address"
              options={pickupOptions}
              selected={selectedPickupAddresses}
              onChange={setSelectedPickupAddresses}
              placeholder="Search pickup address..."
              icon={<MapPin className="w-3.5 h-3.5" />}
            />

            {/* Courier Service — not relevant for New orders */}
            {!isNewTab && (
              <GlassDropdown
                label="Courier Service"
                options={courierOptions}
                selected={selectedCouriers}
                onChange={setSelectedCouriers}
                placeholder="Search courier..."
                icon={<Truck className="w-3.5 h-3.5" />}
              />
            )}

            {/* Date Range */}
            <GlassDateFilter
              align="right"
              startDate={dateStart}
              endDate={dateEnd}
              onDateChange={(s, e) => { setDateStart(s); setDateEnd(e); }}
            />

            <button onClick={handleApplyFilters} className="h-9 px-4 shrink-0 rounded-lg bg-[#00A86B] text-white text-xs font-bold hover:bg-[#009B63] transition-colors shadow-sm">
              Apply
            </button>
            {hasActiveFilters && (
              <button onClick={handleClearAllFilters} className="h-9 px-3 shrink-0 rounded-lg border border-red-200 text-red-500 text-xs font-bold hover:bg-red-50 transition-colors">
                Clear All
              </button>
            )}

            <div className="ml-auto flex items-center gap-2 shrink-0">
              <div className="relative" ref={actionMenuRef}>
                <button
                  onClick={() => selectedOrders.length > 0 && setShowActionMenu(v => !v)}
                  disabled={selectedOrders.length === 0}
                  className={`h-9 pl-4 pr-8 rounded-full border text-xs flex items-center font-bold relative transition-colors ${selectedOrders.length === 0 ? 'border-[#E2E8F0] bg-[#F8FAFC] text-[#CBD5E1] cursor-not-allowed' : 'border-[#E2E8F0] bg-white text-[#475569] shadow-sm hover:bg-[#F8FAFC]'}`}
                >
                  Action
                  <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                </button>
                {showActionMenu && (
                  <div className="absolute right-0 top-full mt-2 w-[190px] bg-white rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-[#E2E8F0] py-2 z-50">
                    {renderActionMenuItems()}
                  </div>
                )}
              </div>
              <button className="w-9 h-9 rounded-full bg-[#00A86B] flex items-center justify-center text-white hover:bg-[#009B63] shadow-sm">
                <span className="text-lg leading-none mt-[-2px]">+</span>
              </button>
            </div>
          </div>}

          {/* ── Bulk Actions Toolbar — only for order tabs ── */}
          {!isPMTab && selectedOrders.length > 0 && (
            <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex items-center gap-3">
              <span className="text-xs font-bold text-blue-700">{selectedOrders.length} selected</span>
              {isNewTab && <button className="h-8 px-3 rounded-md bg-white border border-blue-200 text-xs font-bold text-blue-700 shadow-sm">Bulk Ship</button>}
              {isNewTab && <button className="h-8 px-3 rounded-md bg-white border border-blue-200 text-xs font-bold text-blue-700 shadow-sm">Update Package Details</button>}
              <button className="h-8 px-3 rounded-md bg-white border border-blue-200 text-xs font-bold text-blue-700 shadow-sm">Export Excel</button>
              <button className="h-8 px-3 rounded-md bg-white border border-blue-200 text-xs font-bold text-blue-700 shadow-sm">Download Invoices</button>
              {activeTab === 'Ready to Ship' && (
                <button className="h-8 px-3 rounded-md bg-white border border-blue-200 text-xs font-bold text-blue-700 shadow-sm">Download Manifests</button>
              )}
              {isNewTab && <button className="h-8 px-3 rounded-md bg-white border border-red-200 text-xs font-bold text-red-600 shadow-sm ml-auto hover:bg-red-50">Bulk Delete</button>}
            </div>
          )}
        </div>

        {/* ── Pickup & Manifest tab — separate component with its own API + UI ── */}
        {isPMTab && (
          <div className="flex-1 min-h-0 overflow-hidden border-t border-[#E2E8F0]">
            <AdminPickupManifest isAdminView={isAdminView} />
          </div>
        )}

        {/* ── Table (all other tabs) ── */}
        {!isPMTab && <div className="bg-white flex flex-col flex-1 min-h-0 overflow-hidden border-t border-[#E2E8F0]">
          <div className="flex-1 overflow-auto w-full relative">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-[#94A3B8]">
                <Loader2 className="w-8 h-8 animate-spin text-[#00A86B]" />
                <span className="text-sm font-medium">Loading orders…</span>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-full">
                <thead className="sticky top-0 z-40 bg-[#E6F5F1] shadow-sm">
                  <tr className="text-xs font-medium text-[#00A86B] uppercase tracking-wider">
                    <th className="p-3 w-10">
                      <input type="checkbox" checked={selectedOrders.length === orders.length && orders.length > 0} onChange={toggleAll} className="rounded border-[#00A86B] accent-[#00A86B] w-3.5 h-3.5" />
                    </th>

                    {/* User column — admin view only */}
                    {isAdminView && (
                      <th className="p-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 shrink-0" /><span>User</span></div>
                      </th>
                    )}

                    {isPMTab ? (
                      <>
                        <th className="p-3 whitespace-nowrap"><div className="flex items-center gap-1.5"><Package className="w-3.5 h-3.5 shrink-0" /><span>Pickup ID</span></div></th>
                        <th className="p-3 whitespace-nowrap"><div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 shrink-0" /><span>Pickup</span></div></th>
                        <th className="p-3 whitespace-nowrap"><div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 shrink-0" /><span>Pickup Date</span></div></th>
                        <th className="p-3 whitespace-nowrap"><div className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 shrink-0" /><span>Total / Picked</span></div></th>
                        <th ref={ageingLegendRef} className="p-3 whitespace-nowrap relative cursor-pointer hover:bg-[#D1F0E8]" onClick={() => setShowAgeingLegend(!showAgeingLegend)}>
                          <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 shrink-0" /><span>Ageing</span></div>
                          {showAgeingLegend && (
                            <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-[#E2E8F0] p-3 z-[100] normal-case tracking-normal">
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
                      </>
                    ) : (
                      <>
                        <th className="p-3 whitespace-nowrap"><div className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 shrink-0" /><span>Order</span></div></th>
                        <th className="p-3 whitespace-nowrap"><div className="flex items-center gap-1.5"><Package className="w-3.5 h-3.5 shrink-0" /><span>Product</span></div></th>
                        <th className="p-3 whitespace-nowrap"><div className="flex items-center gap-1.5"><Package className="w-3.5 h-3.5 shrink-0" /><span>Package</span></div></th>
                        <th className="p-3 whitespace-nowrap"><div className="flex items-center gap-1.5"><IndianRupee className="w-3.5 h-3.5 shrink-0" /><span>Payment</span></div></th>
                        <th className="p-3 whitespace-nowrap"><div className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 shrink-0" /><span>Customer</span></div></th>
                        <th className="p-3 whitespace-nowrap"><div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 shrink-0" /><span>Pickup</span></div></th>
                        {showShipmentCol && (
                          <th className="p-3 whitespace-nowrap"><div className="flex items-center gap-1.5"><Truck className="w-3.5 h-3.5 shrink-0" /><span>Shipment</span></div></th>
                        )}
                      </>
                    )}

                    <th className="p-3 whitespace-nowrap"><div className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 shrink-0" /><span>Status</span></div></th>
                    {showLastUpdateCol && (
                      <th className="p-3 whitespace-nowrap"><div className="flex items-center gap-1.5"><History className="w-3.5 h-3.5 shrink-0" /><span>Last Update</span></div></th>
                    )}
                    <th className="p-3 whitespace-nowrap"><div className="flex items-center gap-1.5"><Settings className="w-3.5 h-3.5 shrink-0" /><span>Actions</span></div></th>
                  </tr>
                </thead>
                <tbody className="text-[11px] text-[#475569]">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={colCount()} className="p-10 text-center text-[#64748B] font-medium">
                        No orders found for <span className="font-bold text-[#0F172A]">{activeTab}</span>
                      </td>
                    </tr>
                  ) : orders.map((order, _idx) => (
                    <tr key={order._id} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors group">
                      <td className="p-3">
                        <input type="checkbox" checked={selectedOrders.includes(order._id)} onChange={() => toggleSelect(order._id)} className="rounded border-gray-300 accent-[#00A86B] w-3.5 h-3.5" />
                      </td>

                      {/* User column — admin view only */}
                      {isAdminView && (
                        <td className="p-3">
                          <div className="text-xs font-semibold text-[#00A86B] hover:underline cursor-pointer" onClick={() => setDrawerOrder(order)}>
                            {order.userUserId || order.orderId}
                          </div>
                          <div className="text-sm font-semibold text-[#0F172A] mt-0.5 truncate max-w-[140px]">{order.userName}</div>
                          <div className="text-xs font-normal text-[#94A3B8] truncate max-w-[140px]">{order.userEmail}</div>
                        </td>
                      )}

                      {isPMTab ? (
                        <>
                          <td className="p-3">
                            <div className="text-xs font-semibold text-[#00A86B]">{order.pickupId}</div>
                            <div className="text-[10px] text-[#94A3B8] mt-0.5">Requested: {order.date}</div>
                            <div className="text-xs font-semibold text-[#0F172A] mt-0.5">{order.courier}</div>
                          </td>
                          <td className="p-3">
                            <div
                              className="text-[#64748B] underline decoration-dotted underline-offset-2 hover:text-[#0F172A] cursor-help inline-block"
                              onMouseEnter={(e) => setHoveredPickup({ id: order._id, rect: e.currentTarget.getBoundingClientRect(), name: order.pickupName })}
                              onMouseLeave={() => setHoveredPickup(null)}
                            >
                              {order.pickupName}
                            </div>
                          </td>
                          <td className="p-3 text-[10px] text-[#94A3B8]">{order.date}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="relative w-7 h-7 shrink-0">
                                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                  <path fill="none" stroke="currentColor" strokeWidth="4" className="text-[#F1F5F9]" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                  <path fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"
                                    className={order.pickedPackages === order.totalPackages ? 'text-[#00A86B]' : order.pickedPackages > 0 ? 'text-[#F59E0B]' : 'text-[#CBD5E1]'}
                                    strokeDasharray={`${(order.pickedPackages / Math.max(order.totalPackages, 1)) * 100}, 100`}
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                </svg>
                              </div>
                              <div>
                                <div className="text-[11px] font-bold text-[#0F172A]">{order.pickedPackages} <span className="text-[10px] font-normal text-[#64748B]">/ {order.totalPackages}</span></div>
                                <div className="text-[9px] font-bold uppercase text-[#94A3B8]">{order.pickedPackages === order.totalPackages ? 'Completed' : 'Picked'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">{renderAgeing(order.manifestDate)}</td>
                        </>
                      ) : (
                        <>
                          <td className="p-3">
                            <div className="text-xs font-semibold text-[#00A86B] hover:underline cursor-pointer" onClick={() => setDrawerOrder(order)}>{order.orderId}</div>
                            <div className="text-[10px] text-[#94A3B8] mt-0.5">{order.date}</div>
                            <span className="px-2 py-0.5 rounded-full border border-blue-200 text-blue-600 font-bold text-[9px] bg-blue-50/50 mt-1 inline-block uppercase">
                              {order.channel === 'WooCommerce' ? 'Woo' : (order.channel || 'CUSTOM')}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="text-[#0F172A] font-medium truncate max-w-[160px]" title={order.productName}>{order.productName}</div>
                            <div className="text-[#64748B] mt-0.5">SKU: {order.sku}</div>
                            <div className="text-[#64748B]">QTY: {order.qty}</div>
                          </td>
                          <td className="p-3 text-[#64748B]">
                            <div className="text-[#0F172A] font-medium">Weight: {order.weight}</div>
                            <div className="mt-0.5">L×W×H: {order.dimensions}</div>
                            <div className="mt-0.5">Vol: {order.volWeight}</div>
                          </td>
                          <td className="p-3">
                            <div className="font-semibold text-[#0F172A]">&#8377;{order.payment}</div>
                            <span className="px-2 py-0.5 rounded-full border border-blue-200 text-blue-600 font-bold text-[9px] bg-blue-50/50 mt-1 inline-block">{order.paymentType}</span>
                          </td>
                          <td className="p-3">
                            <div className="text-[#0F172A]">{order.customerName}</div>
                            <div className="text-[#64748B] mt-0.5">{order.customerPhone}</div>
                          </td>
                          <td className="p-3">
                            <div
                              className="text-[#64748B] underline decoration-dotted underline-offset-2 hover:text-[#0F172A] cursor-help inline-block truncate max-w-[120px]"
                              onMouseEnter={(e) => setHoveredPickup({ id: order._id, rect: e.currentTarget.getBoundingClientRect(), name: order.pickupName })}
                              onMouseLeave={() => setHoveredPickup(null)}
                            >
                              {order.pickupName}
                            </div>
                          </td>
                          {showShipmentCol && (
                            <td className="p-3">
                              <div className="text-xs font-semibold text-[#00A86B]">{order.courier}</div>
                              <div className="text-[10px] text-[#94A3B8] mt-0.5">Booked | {order.bookedDate}</div>
                              <div className="text-xs font-semibold text-[#00A86B] underline mt-0.5 hover:text-[#009B63] cursor-pointer truncate max-w-[120px]">{order.awb}</div>
                            </td>
                          )}
                        </>
                      )}

                      <td className="p-3">
                        <span className={getStatusBadgeClass(order.status)}>{order.status}</span>
                      </td>

                      {showLastUpdateCol && (
                        <td className="p-3 w-[160px]">
                          {order.lastUpdateEvent ? (
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-[#00A86B] shrink-0" />
                                <span className="font-semibold text-[#0F172A] text-[11px] truncate max-w-[120px]">{order.lastUpdateEvent}</span>
                              </div>
                              {order.lastUpdateDate && (
                                <span className="text-[10px] text-[#64748B] pl-3.5">
                                  {new Date(order.lastUpdateDate).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                          ) : (
                            <button onClick={() => fetchOrders(page)} className="text-[10px] font-bold text-[#00A86B] hover:underline flex items-center gap-1">
                              <RefreshCw className="w-3 h-3" /> Fetch
                            </button>
                          )}
                        </td>
                      )}

                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {isNewTab && (
                            <button className="h-7 px-3 rounded-full bg-[#1e40af] text-white font-bold text-[10px] flex items-center gap-1 hover:bg-[#1e3a8a] shadow-sm">
                              Ship <Send className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (dropdownPos?.id === order._id) { setDropdownPos(null); return; }
                              const rect = e.currentTarget.getBoundingClientRect();
                              setDropdownPos({ id: order._id, top: rect.bottom + 4, left: rect.right - 176 });
                            }}
                            className={`w-7 h-7 rounded-full border flex items-center justify-center z-10 transition-colors ${dropdownPos?.id === order._id ? 'bg-green-100 border-[#00A86B] text-[#00A86B]' : 'border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9]'}`}
                          >
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* ── Pagination ── */}
          {!loading && totalRecords > 0 && (
            <div className="p-4 border-t border-[#E2E8F0] flex items-center justify-between shrink-0">
              <div className="text-xs text-[#64748B]">
                Showing <span className="font-bold text-[#0F172A]">{(page - 1) * ITEMS_PER_PAGE + 1}</span>
                {' '}–<span className="font-bold text-[#0F172A]">{Math.min(page * ITEMS_PER_PAGE, totalRecords)}</span>
                {' '}of <span className="font-bold text-[#0F172A]">{totalRecords}</span> orders
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => { const p = Math.max(1, page - 1); setPage(p); fetchOrders(p); }} disabled={page === 1}
                  className="px-3 py-1.5 rounded border border-[#E2E8F0] text-xs font-medium text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-50">
                  Previous
                </button>
                {pageWindow().map(p => (
                  <button key={p} onClick={() => { setPage(p); fetchOrders(p); }}
                    className={`w-8 h-8 rounded text-xs font-medium flex items-center justify-center transition-colors ${p === page ? 'bg-[#00A86B] text-white border border-[#00A86B]' : 'border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]'}`}>
                    {p}
                  </button>
                ))}
                <button onClick={() => { const p = Math.min(totalPages, page + 1); setPage(p); fetchOrders(p); }} disabled={page === totalPages}
                  className="px-3 py-1.5 rounded border border-[#E2E8F0] text-xs font-medium text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-50">
                  Next
                </button>
              </div>
            </div>
          )}
        </div>}

        {/* ── Order Detail Drawer ── */}
        {drawerOrder && (
          <div className="fixed inset-0 z-[100] flex">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setDrawerOrder(null)} />
            <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl overflow-y-auto">
              <div className="sticky top-0 bg-white z-10 p-6 border-b border-[#E2E8F0] flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-[#0F172A]">Order #{drawerOrder.orderId}</h3>
                  <span className={getStatusBadgeClass(drawerOrder.status) + ' mt-1 inline-block'}>{drawerOrder.status}</span>
                </div>
                <button onClick={() => setDrawerOrder(null)} className="w-8 h-8 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-[#F8FAFC]">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                {isAdminView && (
                  <div>
                    <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wide mb-3">Seller Details</h4>
                    <div className="bg-[#F8FAFC] rounded-xl p-4 space-y-2">
                      <div className="flex justify-between"><span className="text-xs text-[#64748B]">Name</span><span className="text-xs font-bold text-[#0F172A]">{drawerOrder.userName}</span></div>
                      <div className="flex justify-between"><span className="text-xs text-[#64748B]">Email</span><span className="text-xs font-bold text-[#0F172A]">{drawerOrder.userEmail}</span></div>
                    </div>
                  </div>
                )}
                <div>
                  <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wide mb-3">Customer Details</h4>
                  <div className="bg-[#F8FAFC] rounded-xl p-4 space-y-2">
                    <div className="flex justify-between"><span className="text-xs text-[#64748B]">Name</span><span className="text-xs font-bold text-[#0F172A]">{drawerOrder.customerName}</span></div>
                    <div className="flex justify-between"><span className="text-xs text-[#64748B]">Phone</span><span className="text-xs font-bold text-[#0F172A]">{drawerOrder.customerPhone}</span></div>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wide mb-3">Shipment Details</h4>
                  <div className="bg-[#F8FAFC] rounded-xl p-4 space-y-2">
                    <div className="flex justify-between"><span className="text-xs text-[#64748B]">Pickup</span><span className="text-xs font-bold text-[#0F172A]">{drawerOrder.pickupName}</span></div>
                    {drawerOrder.awb && <div className="flex justify-between"><span className="text-xs text-[#64748B]">AWB</span><span className="text-xs font-bold text-[#00A86B]">{drawerOrder.awb}</span></div>}
                    {drawerOrder.courier && <div className="flex justify-between"><span className="text-xs text-[#64748B]">Courier</span><span className="text-xs font-bold text-[#00A86B]">{drawerOrder.courier}</span></div>}
                    <div className="flex justify-between"><span className="text-xs text-[#64748B]">Date</span><span className="text-xs font-bold text-[#0F172A]">{drawerOrder.date}</span></div>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wide mb-3">Product</h4>
                  <div className="border border-[#E2E8F0] rounded-xl p-3 flex gap-3 items-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-[#0F172A]">{drawerOrder.productName}</div>
                      <div className="text-[10px] text-[#64748B]">SKU: {drawerOrder.sku} | Qty: {drawerOrder.qty}</div>
                      <div className="text-[10px] text-[#64748B]">{drawerOrder.weight} | {drawerOrder.dimensions}</div>
                    </div>
                    <div className="text-xs font-bold text-[#0F172A]">&#8377;{drawerOrder.payment}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Pickup Tooltip ── */}
        {hoveredPickup && (
          <div className="fixed z-[9999] pointer-events-none bg-[#0F172A] text-white text-[10px] p-3 rounded-xl shadow-xl w-64"
            style={{ top: hoveredPickup.rect.top - 10, left: hoveredPickup.rect.left + hoveredPickup.rect.width / 2, transform: 'translate(-50%, -100%)' }}>
            <div className="font-bold flex items-center gap-1.5 mb-1.5"><MapPin className="w-3.5 h-3.5 text-[#00A86B]" />{hoveredPickup.name}</div>
            <div className="text-slate-300 font-medium leading-relaxed border-t border-white/10 pt-1.5">Pickup location on file</div>
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-[#0F172A]" />
          </div>
        )}
      </div>

      {/* ── Row-action dropdown portal — rendered on document.body to escape overflow-auto clipping ── */}
      {dropdownPos && createPortal(
        <>
          {/* Invisible backdrop to close on outside click */}
          <div className="fixed inset-0 z-[998]" onClick={() => setDropdownPos(null)} />
          <div
            className="fixed z-[999] w-44 bg-white rounded-xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.15)] border border-[#E2E8F0] py-2"
            style={{
              top:  dropdownPos.top,
              left: Math.max(4, Math.min(dropdownPos.left, window.innerWidth - 180)),
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {renderRowActions(orders.find(o => o._id === dropdownPos.id), 0)}
          </div>
        </>,
        document.body
      )}
    </AdminLayout>
  );
}
