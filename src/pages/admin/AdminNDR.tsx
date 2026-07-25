import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { apiClient } from '../../services/apiClient';
import { getToken } from '../../utils/session';
import { PDFDocument } from 'pdf-lib';
import * as XLSX from 'xlsx';
import { useAdminTab } from '../../context/AdminUserContext';
import {
  Search, ChevronDown, RefreshCcw, Check, IndianRupee, Package,
  User, Settings, MapPin, X, Truck,
  AlertTriangle, Mail, FileText, Download
} from 'lucide-react';
import { GlassDropdown } from '../../components/ui/GlassDropdown';
import { GlassDateFilter } from '../../components/ui/GlassDateFilter';
import { TableLoader } from '../../components/ui/TableLoader';
import { EmptyState } from '../../components/ui/EmptyState';
import { TruncatedText } from '../../components/ui/TruncatedText';
import { NdrActionModal } from './NdrActionModal';
import { NdrStatusModal } from './NdrStatusModal';
import { BulkNdrActionModal } from './BulkNdrActionModal';
import { DesktopPagination } from '../../hooks/usePagination';

const BACKEND_BASE = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000/v1';

// ─── Tabs ──────────────────────────────────────────────────────────────────────
const TABS = ['Undelivered', 'Action Required', 'Action Requested', 'Delivered', 'RTO Initiated'];

const TAB_SLUG_MAP: Record<string, string> = {
  'Undelivered':      'undelivered',
  'Action Required':  'action-required',
  'Action Requested': 'action-requested',
  'Delivered':        'delivered',
  'RTO Initiated':    'rto-initiated',
};
const SLUG_TO_TAB: Record<string, string> = Object.fromEntries(
  Object.entries(TAB_SLUG_MAP).map(([tab, slug]) => [slug, tab])
);

const TAB_PARAMS: Record<string, Record<string, string>> = {
  'Undelivered':      { status: 'Undelivered', ndrStatus: 'Undelivered' },
  'Action Required':  { tab: 'Action_Required', status: 'Undelivered', ndrStatus: 'Undelivered' },
  'Action Requested': { tab: 'Action_Requested' },
  'Delivered':        { status: 'Delivered', ndrStatus: 'Delivered' },
  'RTO Initiated':    { ndrStatus: 'RTO', status: 'RTO' },
};

// ─── Badge styles ───────────────────────────────────────────────────────────────
const STATUS_BADGE_STYLES: Record<string, string> = {
  'Undelivered':      'bg-amber-50 text-amber-700 border-amber-200',
  'Action Required':  'bg-rose-50 text-rose-700 border-rose-200',
  'Action Requested': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Delivered':        'bg-emerald-50 text-emerald-700 border-emerald-200',
  'RTO Initiated':    'bg-orange-50 text-orange-700 border-orange-200',
};
const getStatusBadgeClass = (s: string) =>
  `${STATUS_BADGE_STYLES[s] || 'bg-blue-50 text-blue-700 border-blue-200'} px-2.5 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap shadow-sm`;



// ─── Payment options ───────────────────────────────────────────────────────────
const PAYMENT_TYPE_OPTIONS = [
  { label: 'Prepaid', value: 'Prepaid' },
  { label: 'COD',     value: 'COD' },
];

// Guards against non-email placeholder values (e.g. a stray phone/id like "123") leaking through the fallback chain.
const asEmail = (v: any): string => (typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) ? v.trim() : '';

// ─── Map raw order from API ─────────────────────────────────────────────────────
const mapOrder = (o: any) => {
  const products = Array.isArray(o.productDetails) ? o.productDetails : [];
  const ndrAttempts = Array.isArray(o.ndrHistory) ? o.ndrHistory.length : 0;
  const lastTracking = Array.isArray(o.tracking) && o.tracking.length > 0
    ? o.tracking[o.tracking.length - 1] : null;

  return {
    _id:           o._id,
    orderId:       o.orderId || '',
    awb:           o.awb_number || o.awbNumber || '',
    channel:       o.channel === 'WooCommerce' ? 'Woo' : (o.channel || 'CUSTOM'),
    productName:   products.map((p: any) => p.name).filter(Boolean).join(', ') || '—',
    sku:           products.map((p: any) => p.sku).filter(Boolean).join(', ') || '—',
    qty:           products.reduce((s: number, p: any) => s + (p.quantity || 0), 0) || 1,
    products:      products.map((p: any) => {
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
    payment:       o.paymentDetails?.amount ?? 0,
    paymentType:   o.paymentDetails?.method || 'Prepaid',
    customerName:  o.receiverAddress?.contactName || '—',
    customerPhone: o.receiverAddress?.phoneNumber || '—',
    customerAddress: o.receiverAddress?.address || '',
    customerCity:  o.receiverAddress?.city || '',
    customerState: o.receiverAddress?.state || '',
    customerPinCode: o.receiverAddress?.pinCode || o.receiverAddress?.pincode || '',
    customerEmail: asEmail(o.receiverAddress?.email) || asEmail(o.customerEmail) || asEmail(o.email) || '',
    pickupName:    o.pickupAddress?.contactName || '—',
    pickupAddress: o.pickupAddress?.address || '',
    courier:       o.courierServiceName || '—',
    bookedDate:    o.shipmentCreatedAt
      ? new Date(o.shipmentCreatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
    date:          o.createdAt
      ? new Date(o.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
    status:        o.status || '',
    ndrStatus:     o.ndrStatus || '',
    ndrHistory:    o.ndrHistory || [],
    ndrAttempts,
    lastNdrReason: o.ndrReason?.reason || '',
    lastNdrDate:   o.ndrReason?.date   || null,
    lastUpdateEvent: lastTracking?.status || '',
    lastUpdateDate:  lastTracking?.StatusDateTime || null,
    userName:      o.userId?.fullname || o.userId?.name || '',
    userEmail:     o.userId?.email || '',
    userUserId:    o.userId?.userId || '',
  };
};

// ─── Excel export helpers ──────────────────────────────────────────────────────
const ordersToSheetRows = (rows: any[]) => rows.map((o) => ({
  'Order ID':        o.orderId,
  'AWB':             o.awb,
  'Date':            o.date,
  'Customer Name':   o.customerName,
  'Customer Phone':  o.customerPhone,
  'Customer City':   o.customerCity,
  'Customer State':  o.customerState,
  'Pincode':         o.customerPinCode,
  'Product':         o.productName,
  'SKU':             o.sku,
  'Qty':             o.qty,
  'Payment Type':    o.paymentType,
  'Amount':          o.payment,
  'Courier':         o.courier,
  'Status':          o.status,
  'NDR Status':      o.ndrStatus,
  'NDR Attempts':    o.ndrAttempts,
  'Last NDR Reason': o.lastNdrReason,
  'Pickup Name':     o.pickupName,
}));

const exportOrdersToExcel = (rows: any[], filename: string) => {
  const sheet = XLSX.utils.json_to_sheet(ordersToSheetRows(rows));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'NDR');
  XLSX.writeFile(workbook, filename);
};

// ─── Download helpers ──────────────────────────────────────────────────────────
const downloadBlob = async (path: string, filename: string) => {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BACKEND_BASE}${path}`, { headers });
  if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`);
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  window.URL.revokeObjectURL(url);
};

// ─── Component ──────────────────────────────────────────────────────────────────
export function AdminNDR() {
  const { isAdmin, adminTab, currentUserId, loadingAdminTab } = useAdminTab();
  const isAdminView = isAdmin && adminTab;

  // ── Tabs — URL-based routing ──
  const navigate = useNavigate();
  const location = useLocation();
  const ndrBase = location.pathname.startsWith('/user/') ? '/user/ndr' : '/admin/ndr';
  const { tabSlug } = useParams<{ tabSlug?: string }>();
  const [activeTab, setActiveTab] = useState(() => (tabSlug && SLUG_TO_TAB[tabSlug]) || 'Undelivered');

  // Sync activeTab when URL changes (back/forward, direct link)
  useEffect(() => {
    const tabFromUrl = (tabSlug && SLUG_TO_TAB[tabSlug]) || 'Undelivered';
    setActiveTab(prev => (prev === tabFromUrl ? prev : tabFromUrl));
  }, [tabSlug]);

  // ── Data ──
  const [orders, setOrders]         = useState<any[]>([]);
  const [loading, setLoading]       = useState(false);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  // ── Filter state ──
  const [orderId,              setOrderId]              = useState('');
  const [awbNumber,            setAwbNumber]            = useState('');
  const [selectedPaymentTypes, setSelectedPaymentTypes] = useState<string[]>([]);
  const [selectedPickups,      setSelectedPickups]      = useState<string[]>([]);
  const [selectedCouriers,     setSelectedCouriers]     = useState<string[]>([]);
  const [dateStart,            setDateStart]            = useState('');
  const [dateEnd,              setDateEnd]              = useState('');
  const [refreshTrigger,       setRefreshTrigger]       = useState(0);

  // ── Dynamic options ──
  const [courierOptions, setCourierOptions] = useState<{ label: string; value: string }[]>([]);
  const [pickupOptions,  setPickupOptions]  = useState<{ label: string; value: string }[]>([]);

  // ── User search (admin-only) ──
  const [userQuery,       setUserQuery]       = useState('');
  const [userSuggestions, setUserSuggestions] = useState<any[]>([]);
  const [userMongoId,     setUserMongoId]     = useState('');

  // ── UI state ──
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [hoveredPickup,  setHoveredPickup]  = useState<{ rect: DOMRect; name: string; address: string } | null>(null);
  const [hoveredCustomer, setHoveredCustomer] = useState<{ rect: DOMRect; name: string; address: string; city: string; state: string; pinCode: string; email: string } | null>(null);
  const [productHoverPos, setProductHoverPos] = useState<{ id: string; top: number; left: number } | null>(null);
  const [hoveredNdrReason, setHoveredNdrReason] = useState<{ rect: DOMRect; reason: string } | null>(null);
  const [showActionMenu, setShowActionMenu] = useState(false);

  // ── Modals ──
  const [actionModalOrder,   setActionModalOrder]   = useState<any>(null);
  const [historyModalOrder,  setHistoryModalOrder]  = useState<any>(null);
  const [showBulkNdrModal,   setShowBulkNdrModal]   = useState(false);

  const actionMenuRef = useRef<HTMLDivElement>(null);

  // ── Global search ──
  const [globalSearchQuery, setGlobalSearchQuery] = useState((window as any).__adminSearchQuery?.toLowerCase() || '');
  useEffect(() => {
    const fn = (e: Event) => {
      setGlobalSearchQuery(((e as CustomEvent).detail || '').toLowerCase());
      setPage(1);
      setRefreshTrigger(t => t + 1);
    };
    window.addEventListener('admin-search', fn);
    return () => window.removeEventListener('admin-search', fn);
  }, []);

  // ── Close dropdowns on outside click ──
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) setShowActionMenu(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  // ── User search debounce ──
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

  // ── Fetch orders ──
  // ── Shared params builder for NDR fetches/exports ──
  const buildOrderParams = useCallback((pg: number, limit: number) => {
    const tabParams = TAB_PARAMS[activeTab] || { status: 'Undelivered' };
    const params: Record<string, any> = { page: pg, limit, ...tabParams };
    if (orderId)                       params.orderId             = orderId;
    if (awbNumber)                     params.awbNumber           = awbNumber;
    if (selectedCouriers.length)       params.courierServiceName  = selectedCouriers.join(',');
    if (selectedPaymentTypes.length)   params.paymentType         = selectedPaymentTypes.join(',');
    if (selectedPickups.length)        params.pickupContactName   = selectedPickups.join(',');
    if (dateStart)                     params.startDate           = dateStart;
    if (dateEnd)                       params.endDate             = dateEnd;
    if (isAdminView && userMongoId)     params.userId = userMongoId;
    else if (!isAdminView && currentUserId) params.userId = currentUserId;
    if (globalSearchQuery)             params.searchQuery         = globalSearchQuery;
    return params;
  }, [activeTab, orderId, awbNumber, selectedCouriers, selectedPaymentTypes, selectedPickups, dateStart, dateEnd, userMongoId, globalSearchQuery, isAdminView, currentUserId]);

  const fetchOrders = useCallback(async (pg = page) => {
    setLoading(true);
    try {
      const params = buildOrderParams(pg, rowsPerPage);
      const res = await apiClient.get('/admin/filterNdrOrdersForEmployee', { params });
      const raw: any[] = res.data?.orders || [];
      setOrders(raw.map(mapOrder));
      setTotalPages(res.data?.totalPages || 1);
      setTotalRecords(res.data?.totalOrders || raw.length);
      if (res.data?.courierServices?.length) setCourierOptions(res.data.courierServices.map((c: any) => {
        const v = typeof c === 'string' ? c : String(c?.name || c?.courierServiceName || '');
        return { label: v, value: v };
      }));
      if (res.data?.pickupLocations?.length)  setPickupOptions(res.data.pickupLocations.map((p: any) => {
        const v = typeof p === 'string' ? p : String(p?.name || p?.contactName || '');
        return { label: v, value: v };
      }));
    } catch (err) {
      console.error('NDR fetch error:', err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [buildOrderParams, page, rowsPerPage]);

  // ── Excel export handlers ──
  const [exportingExcel, setExportingExcel] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportScope, setExportScope] = useState<'page' | 'all'>('page');

  const handleConfirmExport = async () => {
    setExportingExcel(true);
    try {
      if (exportScope === 'page') {
        exportOrdersToExcel(orders, `NDR-${activeTab}-Page${page}.xlsx`);
      } else {
        const PAGE_SIZE = 500;
        const first = await apiClient.get('/admin/filterNdrOrdersForEmployee', { params: buildOrderParams(1, PAGE_SIZE) });
        let allRaw: any[] = first.data?.orders || [];
        const total = first.data?.totalOrders || first.data?.totalRecords || allRaw.length;
        const pagesNeeded = Math.max(1, Math.ceil(total / PAGE_SIZE));
        for (let p = 2; p <= pagesNeeded; p++) {
          const res = await apiClient.get('/admin/filterNdrOrdersForEmployee', { params: buildOrderParams(p, PAGE_SIZE) });
          allRaw = allRaw.concat(res.data?.orders || []);
        }
        exportOrdersToExcel(allRaw.map(mapOrder), `NDR-${activeTab}-All.xlsx`);
      }
    } catch (err) {
      console.error('Failed to export NDR orders:', err);
    } finally {
      setExportingExcel(false);
      setShowExportModal(false);
    }
  };

  useEffect(() => {
    if (loadingAdminTab) return;
    setSelectedOrders([]);
    fetchOrders(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, page, refreshTrigger, loadingAdminTab]);

  useEffect(() => {
    if (loadingAdminTab) return;
    setPage(1);
    setRefreshTrigger(t => t + 1);
  }, [rowsPerPage]);

  // Reset page, selection and filters whenever the active tab changes
  useEffect(() => {
    setPage(1);
    setSelectedOrders([]);
    setOrderId(''); setAwbNumber(''); setSelectedPaymentTypes([]); setSelectedPickups([]);
    setSelectedCouriers([]); setDateStart(''); setDateEnd('');
    if (isAdminView) { setUserQuery(''); setUserSuggestions([]); setUserMongoId(''); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleTabChange = (tab: string) => {
    navigate(`${ndrBase}/${TAB_SLUG_MAP[tab] || 'undelivered'}`);
  };
  const handleApplyFilters = () => { setPage(1); setRefreshTrigger(t => t + 1); };
  const hasActiveFilters = !!(orderId || awbNumber || selectedPaymentTypes.length || selectedPickups.length || selectedCouriers.length || (dateStart && dateEnd) || (isAdminView && userMongoId));
  const handleClearAllFilters = () => {
    setOrderId(''); setAwbNumber(''); setSelectedPaymentTypes([]); setSelectedPickups([]);
    setSelectedCouriers([]); setDateStart(''); setDateEnd('');
    if (isAdminView) { setUserQuery(''); setUserSuggestions([]); setUserMongoId(''); }
    setPage(1); setRefreshTrigger(t => t + 1);
  };

  const toggleAll    = () => setSelectedOrders(selectedOrders.length === orders.length && orders.length > 0 ? [] : orders.map(o => o._id));
  const toggleSelect = (id: string) => setSelectedOrders(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const isActionRequired = activeTab === 'Action Required';
  const showActionsColumn = activeTab === 'Action Required' || activeTab === 'Action Requested';

  // ── Bulk download helpers ──
  const handleBulkLabel = async (ids: string[]) => {
    if (!ids.length) return;
    try {
      const mergedPdf = await PDFDocument.create();
      const pageW = 595, pageH = 842, labelW = pageW / 2, labelH = pageH / 2;
      let labelCount = 0;
      let currentPage: ReturnType<typeof mergedPdf.addPage> | null = null;
      const token = getToken();
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      for (const id of ids) {
        try {
          const res = await fetch(`${BACKEND_BASE}/label/get-label?orderId=${id}`, { headers });
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
      const pdfSaved = await mergedPdf.save();
      const blob = new Blob([pdfSaved.buffer as ArrayBuffer], { type: 'application/pdf' });
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
          const res = await fetch(`${BACKEND_BASE}/label/invoice?orderId=${id}`, { headers });
          if (!res.ok) continue;
          const pdfBytes = await (await res.blob()).arrayBuffer();
          const srcPdf = await PDFDocument.load(pdfBytes);
          const copied = await mergedPdf.copyPages(srcPdf, srcPdf.getPageIndices());
          copied.forEach(p => mergedPdf.addPage(p));
        } catch (e) { console.error(`Invoice fetch failed for ${id}`, e); }
      }
      const pdfSaved = await mergedPdf.save();
      const blob = new Blob([pdfSaved.buffer as ArrayBuffer], { type: 'application/pdf' });
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

  // ── Action menu items ──
  const renderActionMenuItems = () => {
    const close = () => setShowActionMenu(false);
    return (
      <>
        <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC]" onClick={() => { handleBulkLabel(selectedOrders); close(); }}>Download Labels</button>
        <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC]" onClick={() => { handleBulkInvoice(selectedOrders); close(); }}>Download Invoices</button>
        <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC]" onClick={() => { handleBulkManifest(selectedOrders); close(); }}>Download Manifests</button>
        {isActionRequired && (
          <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] border-t border-[#F1F5F9] mt-1 pt-2.5"
            onClick={() => { setShowBulkNdrModal(true); close(); }}>
            Bulk NDR Action
          </button>
        )}
      </>
    );
  };

  // ── Per-row actions ──
  const renderHistoryButton = (order: any) => (
    <button
      onClick={() => setHistoryModalOrder(order)}
      className="px-3 py-1.5 rounded-full bg-[#1E3A8A] text-white text-[10px] font-semibold hover:bg-[#1E3A8A]/90 transition-colors cursor-pointer whitespace-nowrap">
      History
    </button>
  );
  const renderTakeActionButton = (order: any) => (
    <button
      onClick={() => setActionModalOrder(order)}
      className="px-3 py-1.5 rounded-full bg-[#1E3A8A] text-white text-[10px] font-semibold hover:bg-[#1E3A8A]/90 transition-colors cursor-pointer whitespace-nowrap">
      Take Action
    </button>
  );

  // ── NDR action submit ──
  const handleNdrAction = async (payload: any) => {
    const res = await apiClient.post('/ndr/ndr-process', payload);
    if (res.data?.success) { setRefreshTrigger(t => t + 1); }
    else throw new Error(res.data?.data || 'Failed');
  };

  // ── Column count ──
  const colCount = () => {
    let n = 2; // checkbox + order
    if (isAdminView) n++;
    n += 5; // product, payment, customer, pickup, shipment
    n += 2; // status, ndr reason
    if (showActionsColumn) n++; // actions
    return n;
  };

  return (
    <AdminLayout>
      <div className="flex flex-col h-[calc(100vh-72px)] -m-4 md:-m-6 bg-white">

        {/* ── Tab Bar ── */}
        <div className="bg-white relative z-50 shrink-0">
          <div className="flex items-center px-6 py-2 border-b border-[#E2E8F0]">
            <div className="flex items-center flex-1 min-w-0">
              <div className="flex gap-1 items-center min-w-0 bg-[#F7FEFC] rounded-full p-1.5">
                <div className="flex gap-1 items-center overflow-x-auto no-scrollbar min-w-0">
                  {TABS.map(tab => (
                    <button key={tab} onClick={() => handleTabChange(tab)}
                      className={`relative px-4 py-2 text-[13px] font-bold transition-colors whitespace-nowrap rounded-full cursor-pointer ${activeTab === tab ? 'text-[#00A86B] underline underline-offset-4 decoration-2' : 'text-[#64748B] hover:text-[#0F172A]'}`}>
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={() => setShowExportModal(true)} aria-label="Download Excel"
              className="w-8 h-8 rounded-full border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-[#F8FAFC] shrink-0 ml-4 cursor-pointer">
              <Download className="w-4 h-4" />
            </button>
            <button onClick={() => fetchOrders(page)}
              className="w-8 h-8 rounded-full border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-[#F8FAFC] shrink-0 ml-2 cursor-pointer">
              <RefreshCcw className="w-4 h-4" />
            </button>
          </div>

          {/* ── Filter Row ── */}
          <div className="py-3 px-6 border-b border-[#CBD5F5] flex flex-wrap items-center gap-3 bg-[#F8FAFC]/50">

            {/* User search — admin-only */}
            {isAdminView && (
              <div className="relative shrink-0">
                <div className="relative">
                  <input type="text" placeholder="Search user..."
                    value={userQuery}
                    onChange={e => { setUserQuery(e.target.value); if (!e.target.value.trim()) { setUserMongoId(''); setUserSuggestions([]); } }}
                    className="glass-search-input w-[160px]" style={{ paddingLeft: '2rem', paddingRight: '2rem' }} />
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

            {/* Order ID */}
            <input type="text" placeholder="Search by order ID..."
              value={orderId} onChange={e => setOrderId(e.target.value)}
              className="glass-search-input w-[170px] shrink-0" />

            {/* AWB */}
            <input type="text" placeholder="Search by AWB..."
              value={awbNumber} onChange={e => setAwbNumber(e.target.value)}
              className="glass-search-input w-[150px] shrink-0" />

            <GlassDropdown label="Payment Type" options={PAYMENT_TYPE_OPTIONS}
              selected={selectedPaymentTypes} onChange={setSelectedPaymentTypes}
              placeholder="Search payment type..." icon={<IndianRupee className="w-3.5 h-3.5" />} />

            <GlassDropdown label="Pickup Address" options={pickupOptions}
              selected={selectedPickups} onChange={setSelectedPickups}
              placeholder="Search pickup address..." icon={<MapPin className="w-3.5 h-3.5" />} />

            <GlassDropdown label="Courier Service" options={courierOptions}
              selected={selectedCouriers} onChange={setSelectedCouriers}
              placeholder="Search courier..." icon={<Truck className="w-3.5 h-3.5" />} />

            <GlassDateFilter align="right" startDate={dateStart} endDate={dateEnd}
              onDateChange={(s, e) => { setDateStart(s); setDateEnd(e); }} />

            <button onClick={handleApplyFilters}
              className="py-2 px-4 shrink-0 rounded-[32px] bg-[#009D64] border border-[#009D64] text-white text-xs font-medium leading-[18px] hover:bg-[#008a57] transition-colors cursor-pointer">
              Apply Filters
            </button>
            {hasActiveFilters && (
              <button onClick={handleClearAllFilters}
                className="py-2 px-4 shrink-0 rounded-[32px] border border-red-200 text-red-500 text-xs font-medium leading-[18px] hover:bg-red-50 transition-colors cursor-pointer">
                Clear All
              </button>
            )}

            <div className="ml-auto flex items-center gap-2 shrink-0">
              <div className="relative" ref={actionMenuRef}>
                <button
                  onClick={() => selectedOrders.length > 0 && setShowActionMenu(v => !v)}
                  disabled={selectedOrders.length === 0}
                  className={`py-2 pl-4 pr-8 rounded-[32px] border text-xs leading-[18px] flex items-center font-medium relative transition-colors ${selectedOrders.length === 0 ? 'border-[#E2E8F0] bg-[#F8FAFC] text-[#CBD5E1] cursor-not-allowed' : 'border-[#03C27D] bg-white text-[#64748B] hover:bg-[#F0FDF9] cursor-pointer'}`}>
                  Action
                  <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                </button>
                {showActionMenu && (
                  <div className="absolute right-0 top-full mt-2 w-[190px] bg-white rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-[#E2E8F0] py-2 z-50">
                    {renderActionMenuItems()}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Selection toolbar ── */}
          {selectedOrders.length > 0 && (
            <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex items-center gap-3">
              <span className="text-xs font-bold text-blue-700">{selectedOrders.length} selected</span>
              <button className="h-8 px-3 rounded-md bg-white border border-blue-200 text-xs font-bold text-blue-700 shadow-sm"
                onClick={() => handleBulkLabel(selectedOrders)}>Download Labels</button>
              <button className="h-8 px-3 rounded-md bg-white border border-blue-200 text-xs font-bold text-blue-700 shadow-sm"
                onClick={() => handleBulkInvoice(selectedOrders)}>Download Invoices</button>
              <button className="h-8 px-3 rounded-md bg-white border border-blue-200 text-xs font-bold text-blue-700 shadow-sm"
                onClick={() => handleBulkManifest(selectedOrders)}>Download Manifests</button>
              {isActionRequired && (
                <button className="h-8 px-3 rounded-md bg-white border border-blue-200 text-xs font-bold text-blue-700 shadow-sm"
                  onClick={() => setShowBulkNdrModal(true)}>Bulk NDR Action</button>
              )}
            </div>
          )}
        </div>

        {/* ── Table ── */}
        <div className="bg-white flex flex-col flex-1 min-h-0 overflow-hidden border-t border-[#E2E8F0]">
          <div className="flex-1 overflow-auto w-full relative">
            {loading && <TableLoader />}
            <table className="w-full text-left border-collapse min-w-full">
                <thead className="sticky top-0 z-40 bg-[#E6F9F2] shadow-sm">
                  <tr className="text-xs leading-[18px] font-medium text-[#64748B] uppercase tracking-wider border border-[#B9EFDB]">
                    <th className="py-2 px-4 w-10 rounded-l-lg">
                      <input type="checkbox" checked={selectedOrders.length === orders.length && orders.length > 0}
                        onChange={toggleAll} className="rounded border-[#00A86B] accent-[#00A86B] w-3.5 h-3.5" />
                    </th>
                    {isAdminView && (
                      <th className="py-2 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1"><User className="w-3.5 h-3.5 shrink-0" /><span>User</span></div>
                      </th>
                    )}
                    <th className="py-2 px-4 whitespace-nowrap"><div className="flex items-center gap-1"><FileText className="w-3.5 h-3.5 shrink-0" /><span>Order</span></div></th>
                    <th className="py-2 px-4 whitespace-nowrap"><div className="flex items-center gap-1"><Package className="w-3.5 h-3.5 shrink-0" /><span>Product</span></div></th>
                    <th className="py-2 px-4 whitespace-nowrap"><div className="flex items-center gap-1"><IndianRupee className="w-3.5 h-3.5 shrink-0" /><span>Payment</span></div></th>
                    <th className="py-2 px-4 whitespace-nowrap"><div className="flex items-center gap-1"><User className="w-3.5 h-3.5 shrink-0" /><span>Customer</span></div></th>
                    <th className="py-2 px-4 whitespace-nowrap"><div className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 shrink-0" /><span>Pickup</span></div></th>
                    <th className="py-2 px-4 whitespace-nowrap"><div className="flex items-center gap-1"><Truck className="w-3.5 h-3.5 shrink-0" /><span>Shipment</span></div></th>
                    <th className="py-2 px-4 whitespace-nowrap"><div className="flex items-center gap-1"><Check className="w-3.5 h-3.5 shrink-0" /><span>Status</span></div></th>
                    <th className="py-2 px-4 whitespace-nowrap"><div className="flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5 shrink-0" /><span>NDR Reason</span></div></th>
                    {showActionsColumn && (
                      <th className="py-2 px-4 whitespace-nowrap rounded-r-lg"><div className="flex items-center gap-1"><Settings className="w-3.5 h-3.5 shrink-0" /><span>Actions</span></div></th>
                    )}
                  </tr>
                </thead>
                <tbody className="text-[11px] text-[#475569]">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={colCount()}>
                        <EmptyState title="No NDR orders found" subtitle="Try changing filters" />
                      </td>
                    </tr>
                  ) : orders.map((order, idx) => (
                    <tr key={order._id} className={`border-b border-[#E2E8F0] transition-colors group ${idx % 2 === 0 ? 'bg-white' : 'bg-[#E6EDF7]/20'}`}>
                      <td className="p-4">
                        <input type="checkbox" checked={selectedOrders.includes(order._id)}
                          onChange={() => toggleSelect(order._id)} className="rounded border-gray-300 accent-[#00A86B] w-3.5 h-3.5" />
                      </td>

                      {/* User — admin view only */}
                      {isAdminView && (
                        <td className="p-4">
                          <div className="text-xs font-semibold text-[#00A86B]">{order.userUserId}</div>
                          <TruncatedText text={order.userName} maxLength={20} className="text-sm font-semibold text-[#0F172A] mt-0.5 max-w-[140px]" />
                          <TruncatedText text={order.userEmail} maxLength={25} className="text-xs font-normal text-[#94A3B8] max-w-[140px]" />
                        </td>
                      )}

                      {/* Order */}
                      <td className="p-4">
                        <div className="text-[12px] font-semibold text-[#00A86B]">{order.orderId}</div>
                        <div className="text-[12px] font-normal text-[#94A3B8] mt-0.5">{order.date}</div>
                        <span className="px-2 py-0.5 rounded-full border border-blue-200 text-blue-600 font-semibold text-[10px] bg-blue-50/50 mt-1 inline-block">
                          {order.channel}
                        </span>
                      </td>

                      {/* Product */}
                      <td
                        className="p-4"
                        onMouseEnter={(e) => {
                          if (order.products.length === 0) return;
                          const rect = e.currentTarget.getBoundingClientRect();
                          setProductHoverPos({ id: order._id, top: rect.bottom + 4, left: rect.left });
                        }}
                        onMouseLeave={() => setProductHoverPos(prev => (prev?.id === order._id ? null : prev))}
                      >
                        <div className="text-[#0F172A] text-[12px] font-normal underline decoration-dotted underline-offset-2 hover:text-[#00A86B] truncate max-w-[140px] cursor-help">{order.productName || '—'}</div>
                        <div className="text-[#64748B] text-[12px] font-normal mt-0.5 truncate max-w-[140px]">SKU: {order.sku || '—'}</div>
                        <div className="text-[#64748B] text-[12px] font-normal mt-0.5">QTY: {order.qty}</div>
                      </td>

                      {/* Payment */}
                      <td className="p-4">
                        <div className="text-[12px] font-normal text-[#0F172A]">&#8377;{Number(order.payment).toLocaleString('en-IN')}</div>
                        <span className={`px-2 py-0.5 rounded-full border font-semibold text-[10px] mt-1 inline-block ${order.paymentType === 'COD' ? 'border-orange-200 text-orange-600 bg-orange-50/50' : 'border-blue-200 text-blue-600 bg-blue-50/50'}`}>
                          {order.paymentType}
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="p-4">
                        <div
                          className="text-[#0F172A] text-[12px] font-normal underline decoration-dotted underline-offset-2 hover:text-[#00A86B] cursor-help inline-block truncate max-w-[120px]"
                          onMouseEnter={e => setHoveredCustomer({ rect: e.currentTarget.getBoundingClientRect(), name: order.customerName, address: order.customerAddress, city: order.customerCity, state: order.customerState, pinCode: order.customerPinCode, email: order.customerEmail })}
                          onMouseLeave={() => setHoveredCustomer(null)}>
                          {order.customerName}
                        </div>
                        <div className="text-[#64748B] text-[12px] font-normal mt-0.5">{order.customerPhone}</div>
                      </td>

                      {/* Pickup */}
                      <td className="p-4">
                        <div
                          className="text-[#64748B] text-[12px] font-normal underline decoration-dotted underline-offset-2 hover:text-[#0F172A] cursor-help inline-block truncate max-w-[120px]"
                          onMouseEnter={e => setHoveredPickup({ rect: e.currentTarget.getBoundingClientRect(), name: order.pickupName, address: order.pickupAddress })}
                          onMouseLeave={() => setHoveredPickup(null)}>
                          {order.pickupName || '—'}
                        </div>
                      </td>

                      {/* Shipment */}
                      <td className="p-4">
                        <div className="text-[12px] font-semibold text-[#00A86B]">{order.courier}</div>
                        <div className="text-[12px] font-normal text-[#94A3B8] mt-0.5">Booked On | {order.bookedDate}</div>
                        <div className="text-[12px] font-semibold text-[#00A86B] underline mt-0.5 hover:text-[#009B63] cursor-pointer truncate max-w-[120px]">{order.awb}</div>
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <span className={getStatusBadgeClass(order.status)}>{order.status}</span>
                      </td>

                      {/* NDR Reason */}
                      <td className="p-3 min-w-[130px]">
                        {order.lastNdrDate && (
                          <div className="text-[12px] font-normal text-[#94A3B8] mb-0.5 whitespace-nowrap">
                            {new Date(order.lastNdrDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={`text-[12px] font-semibold text-[#00A86B] ${order.lastNdrReason ? 'cursor-help hover:underline decoration-dotted underline-offset-2' : ''}`}
                            onMouseEnter={e => order.lastNdrReason ? setHoveredNdrReason({ rect: e.currentTarget.getBoundingClientRect(), reason: order.lastNdrReason }) : null}
                            onMouseLeave={() => setHoveredNdrReason(null)}
                          >
                            {order.ndrAttempts} Attempted
                          </span>
                        </div>
                        <div className="mt-1.5">
                          {renderHistoryButton(order)}
                        </div>
                      </td>

                      {/* Actions */}
                      {showActionsColumn && (
                        <td className="p-4">
                          <div className="flex items-center gap-1.5">
                            {renderTakeActionButton(order)}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
          </div>

          {/* ── Pagination ── */}
          {!loading && totalRecords > 0 && (
            <DesktopPagination
              page={page}
              setPage={setPage}
              totalPages={totalPages}
              rowsPerPage={rowsPerPage}
              setRowsPerPage={setRowsPerPage}
              startIndex={Math.min((page - 1) * rowsPerPage + 1, totalRecords)}
              endIndex={Math.min(page * rowsPerPage, totalRecords)}
              totalItems={totalRecords}
            />
          )}
        </div>

        {/* ── Pickup Tooltip ── */}
        {hoveredPickup && (
          <div className="fixed z-[9999] pointer-events-none bg-[#0F172A] text-white text-xs font-normal p-3 rounded-xl shadow-xl w-64"
            style={{ top: hoveredPickup.rect.top - 10, left: hoveredPickup.rect.left + hoveredPickup.rect.width / 2, transform: 'translate(-50%, -100%)' }}>
            <div className="font-normal flex items-center gap-1.5 mb-1.5"><MapPin className="w-3.5 h-3.5 text-[#00A86B]" />{hoveredPickup.name}</div>
            {hoveredPickup.address && <div className="text-slate-300 font-normal leading-relaxed border-t border-white/10 pt-1.5">{hoveredPickup.address}</div>}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-[#0F172A]" />
          </div>
        )}

        {/* ── Customer Tooltip ── */}
        {hoveredCustomer && (() => {
          // Flip below the trigger when there isn't enough room above to show the full tooltip without clipping.
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

        {/* ── NDR Reason Tooltip ── */}
        {hoveredNdrReason && (
          <div className="fixed z-[9999] pointer-events-none bg-[#0F172A] text-white text-xs font-normal p-3 rounded-xl shadow-xl w-64"
            style={{ top: hoveredNdrReason.rect.top - 10, left: hoveredNdrReason.rect.left + hoveredNdrReason.rect.width / 2, transform: 'translate(-50%, -100%)' }}>
            <div className="font-normal flex items-center gap-1.5 mb-1.5"><AlertTriangle className="w-3.5 h-3.5 text-amber-400" />NDR Reason</div>
            <div className="text-slate-300 font-normal leading-relaxed border-t border-white/10 pt-1.5">{hoveredNdrReason.reason}</div>
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-[#0F172A]" />
          </div>
        )}
      </div>

      {/* ── Product line-item hover card — rendered on document.body to escape overflow-auto clipping ── */}
      {productHoverPos && (() => {
        const hoveredOrder = orders.find(o => o._id === productHoverPos.id);
        if (!hoveredOrder || hoveredOrder.products.length === 0) return null;
        const grandTotal = hoveredOrder.products.reduce((s: number, p: any) => s + p.total, 0);
        return createPortal(
          <div
            className="fixed z-[999] w-[320px] bg-white border border-[#E2E8F0] rounded-xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.15)] p-3 pointer-events-none"
            style={{
              top: productHoverPos.top,
              left: Math.max(4, Math.min(productHoverPos.left, window.innerWidth - 336)),
            }}
          >
            <table className="w-full text-[11px] border-collapse">
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

      {/* ── Excel Export Modal ── */}
      {showExportModal && createPortal(
        <div className="fixed inset-0 z-[300] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => !exportingExcel && setShowExportModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-semibold text-[#0F172A]">Download Excel</h3>
              <button onClick={() => !exportingExcel && setShowExportModal(false)} className="w-7 h-7 rounded-full flex items-center justify-center text-[#94A3B8] hover:bg-[#F8FAFC]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 rounded-xl border border-[#E2E8F0] cursor-pointer hover:bg-[#F8FAFC] transition-colors has-[:checked]:border-[#03C27D] has-[:checked]:bg-[#F0FDF9]">
                <input
                  type="radio"
                  name="exportScope"
                  checked={exportScope === 'page'}
                  onChange={() => setExportScope('page')}
                  className="w-4 h-4 accent-[#00A86B]"
                />
                <span className="text-[13px] font-medium text-[#334155]">Current page only</span>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-xl border border-[#E2E8F0] cursor-pointer hover:bg-[#F8FAFC] transition-colors has-[:checked]:border-[#03C27D] has-[:checked]:bg-[#F0FDF9]">
                <input
                  type="radio"
                  name="exportScope"
                  checked={exportScope === 'all'}
                  onChange={() => setExportScope('all')}
                  className="w-4 h-4 accent-[#00A86B]"
                />
                <span className="text-[13px] font-medium text-[#334155]">Entire tab ({activeTab})</span>
              </label>
            </div>
            <button
              onClick={handleConfirmExport}
              disabled={exportingExcel}
              className="mt-6 w-full py-2.5 rounded-full bg-[#009D64] text-white text-xs font-medium leading-[18px] hover:bg-[#008a57] transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {exportingExcel ? 'Exporting…' : 'Download'}
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* ── Modals ── */}
      {actionModalOrder && (
        <NdrActionModal
          isOpen={!!actionModalOrder}
          onClose={() => setActionModalOrder(null)}
          order={actionModalOrder}
          onSubmit={handleNdrAction}
        />
      )}
      {historyModalOrder && (
        <NdrStatusModal
          isOpen={!!historyModalOrder}
          setIsOpen={open => { if (!open) setHistoryModalOrder(null); }}
          ndrHistory={historyModalOrder.ndrHistory || []}
        />
      )}
      {showBulkNdrModal && (
        <BulkNdrActionModal
          isOpen={showBulkNdrModal}
          onClose={() => setShowBulkNdrModal(false)}
          selectedOrders={selectedOrders}
          onRefresh={() => setRefreshTrigger(t => t + 1)}
        />
      )}
    </AdminLayout>
  );
}
