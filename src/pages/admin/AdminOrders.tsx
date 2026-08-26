import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams, useLocation, useSearchParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { apiClient } from '../../services/apiClient';
import { refreshNotifications } from '../../context/NotificationListContext';
import { getToken } from '../../utils/session';
import { PDFDocument } from 'pdf-lib';
import * as XLSX from 'xlsx';
import {
  Search, ChevronDown, RefreshCcw, Send, Calendar, Check, MoreHorizontal,
  IndianRupee, Package, User, Settings, MapPin, X, Truck, CreditCard,
  CheckCircle2, Clock, AlertTriangle, Flame, History, Layers, RefreshCw, Mail,
  Filter, Copy, PackagePlus, FileText, Download, MoreVertical, Loader2, ArrowUp, ArrowDown,
  UserCheck, Eye, EyeOff
} from 'lucide-react';
import { usePagination, DesktopPagination } from '../../hooks/usePagination';
import { MobilePaginationBar } from '../../hooks/useMobilePaginationBar';
import { useUserSearchFilter } from '../../hooks/filters/useUserSearchFilter';
import { useDateRangeFilter } from '../../hooks/filters/useDateRangeFilter';
import { TableLoader } from '../../components/ui/TableLoader';
import { EmptyState } from '../../components/ui/EmptyState';
import { TruncatedText } from '../../components/ui/TruncatedText';
import { GlassDropdown } from '../../components/ui/GlassDropdown';
import { GlassDateFilter } from '../../components/ui/GlassDateFilter';
import { StatusRibbon } from '../../components/ui/StatusRibbon';
import { AdminPickupManifest } from './AdminPickupManifest';
import { useAdminTab } from '../../context/AdminUserContext';
import { ShipOrderModal } from '../../components/admin/orders/ShipOrderModal';
import { Toast } from '../../components/ui/Toast';
import { useToast } from '../../hooks/useToast';
import { useProductTooltip, ProductTooltipCard } from '../../hooks/useProductTooltip';
import { CourierLogo } from '../../components/ui/CourierLogo';
import { calculateRtoRisk, fetchBatchRtoRisk } from '../../services/rtoRisk';
import type { RtoRiskResult } from '../../services/rtoRisk';
import flatRateAdImg from '../../assets/flat-rate-ad.png';
import { ProtectedAdImage } from '../../components/ui/ProtectedAdImage';

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const MAIN_TABS = ['New', 'Ready to Ship', 'Pickup & Manifest', 'In Transit', 'Delivered'];
const MORE_TABS = ['Out for Delivery', 'Cancelled', 'Lost', 'Damaged', 'RTO Initiated', 'RTO In Transit', 'RTO Delivered', 'RTO Lost', 'RTO Damaged', 'All'];

// Each tab gets its own URL sub-route (/admin/orders/:tabSlug) so refresh, back/forward and deep links work per-status.
const TAB_SLUG_MAP: Record<string, string> = {
  'New': 'new',
  'Ready to Ship': 'ready-to-ship',
  'Pickup & Manifest': 'pickup-manifest',
  'In Transit': 'in-transit',
  'Delivered': 'delivered',
  'Out for Delivery': 'out-for-delivery',
  'Cancelled': 'cancelled',
  'Lost': 'lost',
  'Damaged': 'damaged',
  'RTO Initiated': 'rto-initiated',
  'RTO In Transit': 'rto-in-transit',
  'RTO Delivered': 'rto-delivered',
  'RTO Lost': 'rto-lost',
  'RTO Damaged': 'rto-damaged',
  'All': 'all',
};
const SLUG_TO_TAB: Record<string, string> = Object.fromEntries(
  Object.entries(TAB_SLUG_MAP).map(([tab, slug]) => [slug, tab])
);

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

// ─── Ribbon accent colors — mobile card layout (mirrors STATUS_BADGE_STYLES per status) ──
const STATUS_RIBBON_COLORS: Record<string, string> = {
  'New':               '#64748B',
  'Booked':            '#2563EB',
  'Not Picked':        '#F59E0B',
  'Ready To Ship':     '#4F46E5',
  'Ready to Ship':     '#4F46E5',
  'Pickup & Manifest': '#7C3AED',
  'Pickup Scheduled':  '#7C3AED',
  'In-Transit':        '#0284C7',
  'In-transit':        '#0284C7',
  'In Transit':        '#0284C7',
  'Delivered':         '#00A86B',
  'Out for Delivery':  '#F59E0B',
  'Cancelled':         '#E11D48',
  'Lost':              '#64748B',
  'Damaged':           '#E11D48',
  'RTO Initiated':     '#EA580C',
  'RTO In Transit':    '#EA580C',
  'RTO Delivered':     '#00A86B',
  'RTO Lost':          '#64748B',
  'RTO Damaged':       '#E11D48',
};
const getRibbonColor = (status: string) => STATUS_RIBBON_COLORS[status] || '#00A86B';

const getStatusBadgeClass = (status: string) =>
  `${STATUS_BADGE_STYLES[status] || 'bg-blue-50 text-blue-700 border-blue-200'} px-2.5 py-0.5 rounded-full border text-[10px] leading-4 font-semibold uppercase tracking-wider whitespace-nowrap shadow-sm`;

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

// Guards against non-email placeholder values (e.g. a stray phone/id like "123") leaking through the fallback chain.
const asEmail = (v: any): string => (typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) ? v.trim() : '';

/** Masks all but the last 2 digits of a phone number, e.g. "9876543210" -> "xxxxxxxx10". */
const maskPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length <= 2) return phone;
  return 'x'.repeat(digits.length - 2) + digits.slice(-2);
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
    createdAtRaw:   o.createdAt || null,
    manifestDate:   o.manifestDate || o.createdAt || new Date().toISOString(),
    productName:    (o.productDetails || []).map((p: any) => p.name).filter(Boolean).join(', ') || '—',
    sku:            (o.productDetails || []).map((p: any) => p.sku).filter(Boolean).join(', ') || '—',
    qty:            (o.productDetails || []).reduce((s: number, p: any) => s + (p.quantity || 0), 0) || 1,
    products:       (o.productDetails || []).map((p: any) => {
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
    weight:         `${o.packageDetails?.applicableWeight || 0} KG`,
    dimensions:     `${l}×${w}×${h}`,
    volWeight:      `${((l * w * h) / 5000).toFixed(2)} KG`,
    payment:        o.paymentDetails?.amount ?? 0,
    paymentType:    o.paymentDetails?.method || 'Prepaid',
    customerName:   o.receiverAddress?.contactName || '—',
    customerPhone:  o.receiverAddress?.phoneNumber || '—',
    customerAddress: o.receiverAddress?.address || '',
    customerCity:   o.receiverAddress?.city || '',
    customerState:  o.receiverAddress?.state || '',
    customerPinCode: o.receiverAddress?.pinCode || o.receiverAddress?.pincode || '',
    customerEmail:  asEmail(o.receiverAddress?.email) || asEmail(o.customerEmail) || asEmail(o.email) || '',
    pickupName:     o.pickupAddress?.contactName || '—',
    pickupAddressLine: o.pickupAddress?.address || '',
    pickupCity:     o.pickupAddress?.city || '',
    pickupState:    o.pickupAddress?.state || '',
    pickupPinCode:  o.pickupAddress?.pinCode || o.pickupAddress?.pincode || '',
    pickupPhone:    o.pickupAddress?.phoneNumber || '',
    courier:        o.courierServiceName || '—',
    bookedDate:     o.shipmentCreatedAt ? new Date(o.shipmentCreatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—',
    status:         o.status || 'New',
    lastUpdateEvent:  o.lastUpdateEvent || lastTracking?.status || '',
    lastUpdateLocation: lastTracking?.StatusLocation || '',
    lastUpdateDate:   lastTracking?.StatusDateTime || null,
    totalPackages:  o.totalPackages || 1,
    pickedPackages: o.pickedPackages || 0,
    pickupId:       o.pickupId || `PID${o.orderId}`,
    channel:        o.channel || 'CUSTOM',
    ndrStatus:      o.ndrStatus || '',
    ndrAttempts:    Array.isArray(o.ndrHistory) ? o.ndrHistory.length : 0,
  };
};

// ─── RTO risk display — label stays neutral (#0F172A); only the value's color
//     varies by risk level, matching existing text-color tokens on this page. ──
const RTO_RISK_COLOR: Record<string, string> = {
  High: 'text-red-500',
  Medium: 'text-purple-600',
  Low: 'text-[#00A86B]',
};

type RtoHistoryMaps = {
  byCustomer: Record<string, { totalOrders: number; totalRtoOrders: number; hasPreviousNdr: boolean }>;
  byPincode: Record<string, { total: number; rto: number }>;
  byCourierPincode: Record<string, { total: number; rto: number }>;
};

/** Row-level RTO risk backed by real per-customer/pincode/courier RTO history,
 *  aggregated client-side from a bulk order sample (see rtoHistoryMaps in
 *  AdminOrders), plus fields already present on the mapped order (payment
 *  type/value, address completeness). */
const getOrderRtoRisk = (order: ReturnType<typeof mapOrder>, historyMaps: RtoHistoryMaps) => {
  const customer = historyMaps.byCustomer[order.customerPhone] || null;
  const pincode = historyMaps.byPincode[order.customerPinCode] || null;
  const courierPincode = historyMaps.byCourierPincode[`${order.courier}|${order.customerPinCode}`] || null;

  return calculateRtoRisk(
    {
      paymentType: order.paymentType,
      payment: order.payment,
      customerAddress: order.customerAddress,
      customerCity: order.customerCity,
      customerState: order.customerState,
      customerPinCode: order.customerPinCode,
      courier: order.courier,
    },
    customer ? {
      isNewCustomer: customer.totalOrders <= 1,
      totalOrders: customer.totalOrders,
      totalRtoOrders: customer.totalRtoOrders,
      rtoRate: customer.totalOrders > 0 ? (customer.totalRtoOrders / customer.totalOrders) * 100 : 0,
      hasPreviousNdr: customer.hasPreviousNdr,
    } : { isNewCustomer: true },
    pincode ? { rtoRate: pincode.total > 0 ? (pincode.rto / pincode.total) * 100 : 0 } : {},
    courierPincode ? { rtoRate: courierPincode.total > 0 ? (courierPincode.rto / courierPincode.total) * 100 : 0 } : {}
  );
};

/** "RTO Risk: {level}" — label in the page's default text color, value colored
 *  by risk level with a dotted underline; High gets an up arrow (risk rising),
 *  Low a down arrow (risk falling), Medium shows no arrow (neutral).
 *  Prefers `riskResult` (backend-computed) when provided; falls back to the
 *  client-side historyMaps calculation while backend data is still loading. */
const RtoRiskLine = ({ order, historyMaps, riskResult, className = '' }: { order: ReturnType<typeof mapOrder>; historyMaps: RtoHistoryMaps; riskResult?: RtoRiskResult; className?: string }) => {
  const risk = riskResult || getOrderRtoRisk(order, historyMaps);
  return (
    <div className={`text-[11px] leading-[16px] font-semibold text-[#0F172A] ${className}`}>
      RTO Risk:{' '}
      <span className={`inline-flex items-center gap-0.5 border-b border-dotted border-current pb-px ${RTO_RISK_COLOR[risk.level]}`}>
        {risk.level}
        {risk.level === 'High' && <ArrowUp className="w-3 h-3" />}
        {risk.level === 'Low' && <ArrowDown className="w-3 h-3" />}
      </span>
    </div>
  );
};

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
  'Weight':          o.weight,
  'Payment Type':    o.paymentType,
  'Amount':          o.payment,
  'Courier':         o.courier,
  'Status':          o.status,
  'Pickup Name':     o.pickupName,
  'Pickup City':     o.pickupCity,
}));

const exportOrdersToExcel = (rows: any[], filename: string) => {
  const sheet = XLSX.utils.json_to_sheet(ordersToSheetRows(rows));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Orders');
  XLSX.writeFile(workbook, filename);
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
  const { isAdmin, adminTab, currentUserId, loadingAdminTab } = useAdminTab();
  const isAdminView = isAdmin && adminTab;
  // AdminLayout adds a 32px impersonation banner (pt-8) above the page when an
  // admin is impersonating a user — the page height calc must account for it too,
  // otherwise the extra 32px overflows the viewport and the whole page scrolls.
  const isImpersonating = !!localStorage.getItem('admin_token_backup');

  // ── Flat Rate Services ad — shown once per login session, dismissible ──
  const [showFlatRateAd, setShowFlatRateAd] = useState(() => {
    const token = getToken();
    if (!token) return false;
    return sessionStorage.getItem(`flatRateAdSeen_${token}`) !== '1';
  });
  const dismissFlatRateAd = () => {
    const token = getToken();
    if (token) sessionStorage.setItem(`flatRateAdSeen_${token}`, '1');
    setShowFlatRateAd(false);
  };

  // ── Tabs — each tab is its own URL sub-route (/admin/orders/:tabSlug or /user/orders/:tabSlug) ──
  const navigate = useNavigate();
  const location = useLocation();
  const ordersBase = location.pathname.startsWith('/user/') ? '/user/orders' : '/admin/orders';
  const { tabSlug } = useParams<{ tabSlug?: string }>();
  const [activeTab, setActiveTab]   = useState(() => (tabSlug && SLUG_TO_TAB[tabSlug]) || 'New');

  // Keep activeTab in sync with the URL (browser back/forward, direct links, refresh)
  useEffect(() => {
    const tabFromUrl = (tabSlug && SLUG_TO_TAB[tabSlug]) || 'New';
    setActiveTab(prev => (prev === tabFromUrl ? prev : tabFromUrl));
  }, [tabSlug]);

  useEffect(() => {
    if (location.state?.toast) {
      showToast(location.state.toast.type, location.state.toast.text);
    }
  }, []);

  // Deep-link support for the global navbar search: ?orderId=<id> opens that order's drawer directly.
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    const deepLinkOrderId = searchParams.get('orderId');
    if (!deepLinkOrderId) return;
    (async () => {
      try {
        const res = await apiClient.get('/admin/filterEmployeeOrders', {
          params: { page: 1, limit: 1, orderId: deepLinkOrderId },
        });
        const raw = res.data?.orders || [];
        if (raw.length > 0) setDrawerOrder(mapOrder(raw[0]));
      } catch (err) {
        console.error('Failed to open deep-linked order:', err);
      } finally {
        setSearchParams(prev => {
          const next = new URLSearchParams(prev);
          next.delete('orderId');
          return next;
        }, { replace: true });
      }
    })();
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const [showMore, setShowMore]     = useState(false);
  const moreRef                     = useRef<HTMLDivElement>(null);
  const actionMenuRef               = useRef<HTMLDivElement>(null);
  const mobileActionMenuRef         = useRef<HTMLDivElement>(null);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [mobileActionMenuPos, setMobileActionMenuPos] = useState<{ top: number; right: number } | null>(null);

  // ── Orders data ──
  const [orders, setOrders]         = useState<any[]>([]);
  const [loading, setLoading]       = useState(false);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [rowsPerPage, setRowsPerPageState] = useState(20);
  // Changing page size always resets to page 1 — otherwise the current page can go out of
  // range against the new page size and the next fetch returns an empty page.
  const setRowsPerPage = useCallback((value: number | ((prev: number) => number)) => {
    setRowsPerPageState(value);
    setPage(1);
  }, []);

  // Client-side re-slice of the already server-fetched page — same usePagination + TableLoader
  // wiring as AdminWallet.tsx (paginatedData drives the table body; loading state drives TableLoader).
  const { paginatedData: paginatedOrders } = usePagination({ data: orders, perPage: rowsPerPage });

  // ── RTO risk — kept as fallback for the brief window before backend data loads ──
  const [rtoHistoryMaps, setRtoHistoryMaps] = useState<{
    byCustomer: Record<string, { totalOrders: number; totalRtoOrders: number; hasPreviousNdr: boolean }>;
    byPincode: Record<string, { total: number; rto: number }>;
    byCourierPincode: Record<string, { total: number; rto: number }>;
  }>({ byCustomer: {}, byPincode: {}, byCourierPincode: {} });
  // Backend-computed risk scores keyed by order _id string
  const [riskMap, setRiskMap] = useState<Record<string, RtoRiskResult>>({});

  // ── Repeat-customer detection (user-side, desktop, New tab only) ──
  // Matching key is customer identity + address: phone number first (the closest
  // thing to a stable customer id on the order payload), normalized delivery
  // address as the tiebreaker — so two different people who happen to type the
  // same address text don't get merged, and the same customer re-ordering to a
  // slightly differently-formatted address still matches.
  const [repeatCustomerMap, setRepeatCustomerMap] = useState<Record<string, {
    totalOrders: number; lastOrderDate: string | null; previousOrderDate: string | null; customerName: string;
    delivered: number; cancelled: number; rto: number;
  }>>({});
  const normalizeAddress = (addr: string, pin: string) => `${(addr || '').trim().toLowerCase().replace(/\s+/g, ' ')}|${(pin || '').trim()}`;
  const repeatCustomerKey = (phone: string, addr: string, pin: string) =>
    `${(phone || '').replace(/\D/g, '')}__${normalizeAddress(addr, pin)}`;

  // Which single order, per customer+address, is the "latest" one — computed
  // dynamically from the orders actually on screen (this is what the indicator
  // anchors to), never a hardcoded id. Compares the FULL creation timestamp
  // (date + time, down to the millisecond) via createdAtRaw, not just the
  // calendar date, so a 4:45 PM order correctly beats a 10:30 AM order on the
  // same day. If two orders share the exact same timestamp, Mongo's _id is used
  // as a deterministic tiebreaker — ObjectIds are chronologically sortable by
  // creation, so this is a stable, meaningful fallback rather than an arbitrary one.
  const latestOrderIdByCustomer = useMemo(() => {
    const latest: Record<string, { id: string; time: number }> = {};
    for (const o of orders) {
      if (!o.customerAddress || !o.createdAtRaw) continue;
      const key = repeatCustomerKey(o.customerPhone, o.customerAddress, o.customerPinCode);
      const time = new Date(o.createdAtRaw).getTime();
      const current = latest[key];
      if (!current || time > current.time || (time === current.time && String(o._id) > String(current.id))) {
        latest[key] = { id: o._id, time };
      }
    }
    const result: Record<string, string> = {};
    for (const key in latest) result[key] = latest[key].id;
    return result;
  }, [orders]);

  // ── Filter state (applied on Apply click) ──
  const [orderId,                setOrderId]               = useState('');
  const [awbNumber,              setAwbNumber]             = useState('');
  const [selectedPaymentTypes,   setSelectedPaymentTypes]  = useState<string[]>([]);
  const [selectedPickupAddresses,setSelectedPickupAddresses] = useState<string[]>([]);
  const [selectedCouriers,       setSelectedCouriers]      = useState<string[]>([]);
  const { dateStart, dateEnd, setDateStart, setDateEnd, onDateChange: onOrderDateChange, defStart, defEnd } = useDateRangeFilter();

  // ── Dynamic options from API ──
  const [courierOptions,  setCourierOptions]  = useState<{ label: string; value: string }[]>([]);
  const [pickupOptions,   setPickupOptions]   = useState<{ label: string; value: string }[]>([]);

  // ── User search (admin-only) ──
  const { userQuery, userSuggestions, userMongoId, setUserQuery, setUserMongoId, setUserSuggestions, onQueryChange: onUserQueryChange, selectUser: selectUserSuggestion, clearUser: clearUserFilter } = useUserSearchFilter(isAdminView);

  // ── Filter refresh trigger (incremented on apply/clear so useEffect re-fetches with latest state) ──
  const [refreshTrigger,   setRefreshTrigger]   = useState(0);

  // ── UI state ──
  const [selectedOrders,   setSelectedOrders]   = useState<string[]>([]);
  const [cancellingIds,    setCancellingIds]    = useState<Set<string>>(new Set());
  const [drawerOrder,      setDrawerOrder]       = useState<any | null>(null);
  const [shipOrder,        setShipOrder]         = useState<any | null>(null);
  // dropdownPos renders the row-action dropdown via portal (fixed position) so overflow-auto doesn't clip it
  const [dropdownPos,      setDropdownPos]       = useState<{ id: string; top: number; left: number } | null>(null);
  // productHoverPos renders the Product-column line-item breakdown via portal, same reason as dropdownPos
  const { productHoverPos, openProductTooltip, hoverOpenProductTooltip, closeProductTooltip } = useProductTooltip();
  const [showAgeingLegend, setShowAgeingLegend] = useState(false);
  const { toast, showToast, closeToast } = useToast();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ageingLegendRef = useRef<any>(null);
  const [hoveredPickup,   setHoveredPickup]     = useState<{ id: string; rect: DOMRect; name: string; address: string; city: string; state: string; pinCode: string; phone: string } | null>(null);
  const [hoveredCustomer, setHoveredCustomer]   = useState<{ rect: DOMRect; name: string; address: string; city: string; state: string; pinCode: string; email: string } | null>(null);
  // Repeat-customer popover — click-triggered (not hover), portaled. Only one can
  // be open at a time since it's a single piece of state; clicking the same
  // indicator again, or clicking outside, closes it.
  const [repeatCustomerPopover, setRepeatCustomerPopover] = useState<{ rect: DOMRect; key: string } | null>(null);
  const [revealedPhones, setRevealedPhones] = useState<Set<string>>(new Set());

  // ── Update Package Details modal ──
  const [showPackageModal,  setShowPackageModal]  = useState(false);
  const [packageForm,       setPackageForm]        = useState({ weight: '', length: '', width: '', height: '' });
  const [packageSaving,     setPackageSaving]      = useState(false);

  const handleUpdatePackageDetails = async () => {
    const { weight, length, width, height } = packageForm;
    if (!weight || !length || !width || !height) return;
    setPackageSaving(true);
    try {
      await apiClient.post('/order/updatePackageDetails', {
        details: { weight: parseFloat(weight), length: parseFloat(length), width: parseFloat(width), height: parseFloat(height) },
        selectedOrders,
      });
      setShowPackageModal(false);
      setPackageForm({ weight: '', length: '', width: '', height: '' });
      fetchOrders(page);
      showToast('success', 'Package details updated successfully');
    } catch (e) {
      console.error('Update package details failed', e);
      showToast('error', 'Failed to update package details');
    } finally {
      setPackageSaving(false);
    }
  };

  // ── Update Pickup Address modal ──
  const [showPickupModal,    setShowPickupModal]    = useState(false);
  const [pickupList,         setPickupList]         = useState<any[]>([]);
  const [selectedPickupAddr, setSelectedPickupAddr] = useState<any | null>(null);
  const [pickupSaving,       setPickupSaving]       = useState(false);

  const openPickupModal = async () => {
    setShowPickupModal(true);
    try {
      const res = await apiClient.get('/order/pickupAddress', { params: { limit: 100 } });
      setPickupList(res.data?.data || []);
    } catch (e) { console.error('Failed to fetch pickup addresses', e); }
  };

  const handleUpdatePickupAddress = async () => {
    if (!selectedPickupAddr) return;
    setPickupSaving(true);
    try {
      const pa = selectedPickupAddr.pickupAddress;
      await Promise.all(
        selectedOrders.map(id =>
          apiClient.put(`/order/updateOrder/${id}`, {
            pickupAddress: {
              contactName: pa.contactName,
              phoneNumber: pa.phoneNumber,
              email:       pa.email,
              address:     pa.address,
              city:        pa.city,
              state:       pa.state,
              pinCode:     pa.pinCode,
            },
          })
        )
      );
      setShowPickupModal(false);
      setSelectedPickupAddr(null);
      fetchOrders(page);
      showToast('success', 'Pickup address updated successfully');
    } catch (e) {
      console.error('Update pickup address failed', e);
      showToast('error', 'Failed to update pickup address');
    } finally {
      setPickupSaving(false);
    }
  };

  // ── Mobile view state ──
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [mobileSearchQuery,   setMobileSearchQuery]   = useState('');
  // Pickup & Manifest tab — mobile search/filter/action row is hoisted above the shared
  // tab bar (matching every other tab), but the underlying state/logic lives inside
  // AdminPickupManifest; these bridge that component up to this hoisted row.
  const [pmMobileSearch,   setPmMobileSearch]   = useState('');
  const [pmSelectedCount,  setPmSelectedCount]  = useState(0);
  const pmBulkActionRef = useRef<(() => void) | null>(null);
  const [mobileToast, setMobileToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const showMobileToast = (type: 'success' | 'error', text: string) => {
    setMobileToast({ type, text });
    setTimeout(() => setMobileToast(null), 2000);
  };
  const copyToClipboard = async (text: string, label: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      showMobileToast('success', `${label} copied!`);
    } catch {
      showMobileToast('error', `Failed to copy ${label}.`);
    }
  };

  // ── Global search (header bar) ──
  const [globalSearchQuery, setGlobalSearchQuery] = useState((window as any).__adminSearchQuery?.toLowerCase() || '');
  useEffect(() => {
    const handler = (e: Event) => {
      setGlobalSearchQuery(((e as CustomEvent).detail || '').toLowerCase());
      setPage(1);
      setRefreshTrigger(t => t + 1); // ensures a refetch even when already on page 1
    };
    window.addEventListener('admin-search', handler);
    return () => window.removeEventListener('admin-search', handler);
  }, []);

  // ── Close dropdowns on outside click ──
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setShowMore(false);
      const insideDesktop = actionMenuRef.current?.contains(e.target as Node);
      const insideMobile  = mobileActionMenuRef.current?.contains(e.target as Node);
      if (!insideDesktop && !insideMobile) setShowActionMenu(false);
      if (ageingLegendRef.current && !ageingLegendRef.current.contains(e.target as Node)) setShowAgeingLegend(false);
      // Row-action dropdown is closed via its own backdrop overlay (portal); no setDropdownPos here
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Shared params builder for order fetches/exports ──
  const buildOrderParams = useCallback((pg: number, limit: number) => {
    const statuses = STATUS_FOR_TAB[activeTab] || [];
    const params: Record<string, any> = {
      page:  pg,
      limit,
    };
    if (statuses.length > 0)          params.status               = statuses;
    if (orderId)                       params.orderId              = orderId;
    if (awbNumber)                     params.awbNumber            = awbNumber;
    if (selectedCouriers.length > 0)   params.courierServiceName   = selectedCouriers.join(',');
    if (selectedPaymentTypes.length > 0) params.paymentType        = selectedPaymentTypes.join(',');
    if (selectedPickupAddresses.length > 0) params.pickupContactName = selectedPickupAddresses.join(',');
    if (dateStart)                     params.startDate            = dateStart;
    if (dateEnd)                       params.endDate              = dateEnd;
    if (isAdminView && userMongoId) { params.userId = userMongoId; params.selectedUserId = userMongoId; params.userSearch = userMongoId; }
    else if (!isAdminView && currentUserId) params.userId = currentUserId;
    if (globalSearchQuery)             params.searchQuery          = globalSearchQuery;
    return params;
  }, [activeTab, orderId, awbNumber, selectedCouriers, selectedPaymentTypes, selectedPickupAddresses, dateStart, dateEnd, userMongoId, globalSearchQuery, isAdmin, isAdminView, currentUserId]);

  // ── Fetch orders from API ──
  const fetchOrders = useCallback(async (pg = page) => {
    setLoading(true);
    try {
      const params = buildOrderParams(pg, rowsPerPage);
      const res = await apiClient.get('/admin/filterEmployeeOrders', { params });
      const raw = res.data?.orders || [];
      const mapped = raw.map(mapOrder);
      setOrders(mapped);
      setTotalPages(res.data?.totalPages || 1);
      setTotalRecords(res.data?.totalOrders || res.data?.totalRecords || raw.length);
      if (res.data?.courierServices) setCourierOptions(res.data.courierServices.map((s: any) => {
        const v = typeof s === 'string' ? s : String(s?.name || s?.courierServiceName || '');
        return { label: v, value: v };
      }));
      if (res.data?.pickupLocations) setPickupOptions(res.data.pickupLocations.map((p: any) => {
        const v = typeof p === 'string' ? p : String(p?.name || p?.contactName || '');
        return { label: v, value: v };
      }));
      // Fire-and-forget backend risk computation — updates the badge once results arrive
      if (mapped.length > 0) {
        const ids = mapped.map((o: any) => o._id).filter(Boolean);
        fetchBatchRtoRisk(ids).then(risks => setRiskMap(risks)).catch(() => {/* silent — fallback to client-side calc */});
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  }, [buildOrderParams, page, rowsPerPage]);

  // ── RTO risk history — fetch a bulk, unfiltered sample of this account's orders (all
  // statuses) once and aggregate real per-customer/pincode/courier RTO rates from it.
  // Re-runs whenever the account being viewed changes (admin switching users, or the
  // logged-in user resolving after refresh).
  useEffect(() => {
    const scopeUserId = isAdminView ? userMongoId : currentUserId;
    if (isAdminView && !scopeUserId) return; // admin hasn't picked a user yet — nothing to aggregate
    if (!isAdminView && !scopeUserId) return; // currentUserId not resolved yet

    let cancelled = false;
    (async () => {
      try {
        const params: Record<string, any> = { page: 1, limit: 1000 };
        if (isAdminView) { params.userId = scopeUserId; params.selectedUserId = scopeUserId; params.userSearch = scopeUserId; }
        else { params.userId = scopeUserId; }
        const res = await apiClient.get('/admin/filterEmployeeOrders', { params });
        if (cancelled) return;
        const raw: any[] = res.data?.orders || [];

        const byCustomer: Record<string, { totalOrders: number; totalRtoOrders: number; hasPreviousNdr: boolean }> = {};
        const byPincode: Record<string, { total: number; rto: number }> = {};
        const byCourierPincode: Record<string, { total: number; rto: number }> = {};
        const byCustomerAddress: Record<string, {
          totalOrders: number; lastOrderDate: string | null; previousOrderDate: string | null; customerName: string;
          delivered: number; cancelled: number; rto: number;
        }> = {};
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        for (const o of raw) {
          const status: string = o.status || '';
          const isRto = status.startsWith('RTO');
          const phone = o.receiverAddress?.phoneNumber || '';
          const pin = o.receiverAddress?.pinCode || o.receiverAddress?.pincode || '';
          const courier = o.courierServiceName || '';
          const hasNdr = Array.isArray(o.ndrHistory) && o.ndrHistory.length > 0;

          if (phone) {
            const c = byCustomer[phone] || { totalOrders: 0, totalRtoOrders: 0, hasPreviousNdr: false };
            c.totalOrders += 1;
            if (isRto) c.totalRtoOrders += 1;
            if (hasNdr) c.hasPreviousNdr = true;
            byCustomer[phone] = c;
          }
          if (pin) {
            const p = byPincode[pin] || { total: 0, rto: 0 };
            p.total += 1;
            if (isRto) p.rto += 1;
            byPincode[pin] = p;
          }
          if (courier && pin) {
            const key = `${courier}|${pin}`;
            const cp = byCourierPincode[key] || { total: 0, rto: 0 };
            cp.total += 1;
            if (isRto) cp.rto += 1;
            byCourierPincode[key] = cp;
          }

          const createdAt = o.createdAt ? new Date(o.createdAt) : null;
          const addr = o.receiverAddress?.address || '';
          if (createdAt && addr && createdAt >= sixMonthsAgo) {
            const key = repeatCustomerKey(phone, addr, pin);
            const c = byCustomerAddress[key] || {
              totalOrders: 0, lastOrderDate: null, previousOrderDate: null, customerName: o.receiverAddress?.contactName || '',
              delivered: 0, cancelled: 0, rto: 0,
            };
            c.totalOrders += 1;
            if (status === 'Delivered') c.delivered += 1;
            if (status === 'Cancelled') c.cancelled += 1;
            if (isRto) c.rto += 1;
            if (!c.lastOrderDate || createdAt > new Date(c.lastOrderDate)) {
              c.previousOrderDate = c.lastOrderDate;
              c.lastOrderDate = createdAt.toISOString();
              c.customerName = o.receiverAddress?.contactName || c.customerName;
            } else if (!c.previousOrderDate || createdAt > new Date(c.previousOrderDate)) {
              c.previousOrderDate = createdAt.toISOString();
            }
            byCustomerAddress[key] = c;
          }
        }

        setRtoHistoryMaps({ byCustomer, byPincode, byCourierPincode });
        setRepeatCustomerMap(byCustomerAddress);
      } catch (err) {
        console.error('Failed to load RTO risk history:', err);
      }
    })();

    return () => { cancelled = true; };
  }, [isAdminView, userMongoId, currentUserId]);

  // ── Excel export handlers ──
  const [exportingExcel, setExportingExcel] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportScope, setExportScope] = useState<'page' | 'all'>('page');

  const handleConfirmExport = async () => {
    setExportingExcel(true);
    try {
      if (exportScope === 'page') {
        exportOrdersToExcel(orders, `Orders-${activeTab}-Page${page}.xlsx`);
      } else {
        const PAGE_SIZE = 500;
        const first = await apiClient.get('/admin/filterEmployeeOrders', { params: buildOrderParams(1, PAGE_SIZE) });
        let allRaw: any[] = first.data?.orders || [];
        const total = first.data?.totalOrders || first.data?.totalRecords || allRaw.length;
        const pagesNeeded = Math.max(1, Math.ceil(total / PAGE_SIZE));
        for (let p = 2; p <= pagesNeeded; p++) {
          const res = await apiClient.get('/admin/filterEmployeeOrders', { params: buildOrderParams(p, PAGE_SIZE) });
          allRaw = allRaw.concat(res.data?.orders || []);
        }
        exportOrdersToExcel(allRaw.map(mapOrder), `Orders-${activeTab}-All.xlsx`);
      }
    } catch (err) {
      console.error('Failed to export orders:', err);
    } finally {
      setExportingExcel(false);
      setShowExportModal(false);
    }
  };

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
    setCancellingIds(prev => new Set(prev).add(order._id));
    setDropdownPos(null); // close any open per-row dropdown immediately
    try {
      await apiClient.post(endpoint, { orderId: order._id });
      showToast('success', 'Order cancelled successfully');
      fetchOrders(page);
    } catch (e: any) {
      console.error('Cancel failed', e);
      showToast('error', e?.response?.data?.error || 'Failed to cancel order');
    } finally {
      setCancellingIds(prev => { const s = new Set(prev); s.delete(order._id); return s; });
    }
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

      const saved = await mergedPdf.save();
      const blob = new Blob([saved.buffer as ArrayBuffer], { type: 'application/pdf' });
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

  // Fetch on tab/page/globalSearch change, or when filters are explicitly applied/cleared.
  // Guard with loadingAdminTab: without this, on refresh currentUserId is '' and all data is returned.
  useEffect(() => {
    if (loadingAdminTab) return;
    setSelectedOrders([]);
    fetchOrders(page);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, page, refreshTrigger, loadingAdminTab, dateStart, dateEnd]);

  useEffect(() => {
    if (loadingAdminTab) return;
    setPage(1);
    setRefreshTrigger(t => t + 1);
  }, [rowsPerPage]);

  // When the browser restores this page from bfcache (e.g. navigating away and
  // pressing Back), React never remounts and stale selection/data from before
  // navigation is left showing. Clear selection and refetch so nothing "persists".
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return;
      setSelectedOrders([]);
      fetchOrders(page);
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [fetchOrders, page]);

  // Reset pagination, selection and filters whenever activeTab changes — fires for clicks
  // (via handleTabChange below) AND for browser back/forward or direct URL loads (via the
  // tabSlug-sync effect above), so pagination never persists across a status tab regardless
  // of how the tab changed.
  useEffect(() => {
    setPage(1);
    setSelectedOrders([]);
    setShowMore(false);
    setMobileSearchQuery('');
    setPmMobileSearch('');
    setIsMobileFiltersOpen(false);
    setOrderId(''); setAwbNumber(''); setSelectedPaymentTypes([]); setSelectedPickupAddresses([]);
    setSelectedCouriers([]); setDateStart(defStart); setDateEnd(defEnd);
    setUserQuery(''); setUserSuggestions([]); setUserMongoId('');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Mobile search bar debounce — feeds into orderId filter
  useEffect(() => {
    const timer = setTimeout(() => {
      setOrderId(mobileSearchQuery);
      setPage(1);
      setRefreshTrigger(t => t + 1);
    }, 400);
    return () => clearTimeout(timer);
  }, [mobileSearchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTabChange = (tab: string) => {
    navigate(`${ordersBase}/${TAB_SLUG_MAP[tab] || 'new'}`);
  };

  const handleApplyFilters = () => { setPage(1); setRefreshTrigger(t => t + 1); };

  const hasActiveFilters = orderId || awbNumber || selectedPaymentTypes.length > 0 || selectedPickupAddresses.length > 0 || selectedCouriers.length > 0 || (dateStart && dateEnd && !(dateStart === defStart && dateEnd === defEnd)) || (isAdminView && userMongoId);

  const handleClearAllFilters = () => {
    setOrderId(''); setAwbNumber(''); setSelectedPaymentTypes([]); setSelectedPickupAddresses([]);
    setSelectedCouriers([]); setDateStart(defStart); setDateEnd(defEnd);
    if (isAdminView) { setUserQuery(''); setUserSuggestions([]); setUserMongoId(''); }
    setPage(1);
    setRefreshTrigger(t => t + 1); // fires useEffect after all state updates are committed
  };

  const toggleAll = () => setSelectedOrders(selectedOrders.length === orders.length && orders.length > 0 ? [] : orders.map(o => o._id));
  const toggleSelect = (id: string) => setSelectedOrders(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  // Single selected order keeps the existing manual rate-picker flow
  // (ShipOrderModal); 2+ selected orders go through the real bulk-ship
  // endpoint, which assigns a courier per order automatically and reports
  // progress via the notification bell instead of a modal.
  const handleBulkShipClick = async () => {
    if (selectedOrders.length === 0) return;
    if (selectedOrders.length === 1) {
      setShipOrder(orders.find(o => o._id === selectedOrders[0]) || null);
      return;
    }
    try {
      const res = await apiClient.post('/bulk/create-bulk-order', { selectedOrders });
      showToast('success', res.data?.message || `Bulk shipment started for ${selectedOrders.length} orders.`);
      refreshNotifications();
      fetchOrders(page);
    } catch (error: any) {
      showToast('error', error?.response?.data?.message || 'Failed to start bulk shipment.');
    }
  };

  // ── Tab-specific boolean helpers ──
  const isPMTab  = activeTab === 'Pickup & Manifest';
  const isNewTab = activeTab === 'New';
  const showShipmentCol = !isNewTab && !isPMTab;
  const showLastUpdateCol = !isNewTab && !isPMTab && !['Ready to Ship', 'Booked'].includes(activeTab);



  // ── Action menu items per tab ──
  const renderActionMenuItems = () => {
    const closeMenu = () => setShowActionMenu(false);
    const selectAllItem = (
      <button className="w-full text-left px-4 py-2.5 text-[13px] font-semibold text-[#00A86B] hover:bg-[#F0FDF4] cursor-pointer border-b border-[#F1F5F9]" onClick={() => { toggleAll(); closeMenu(); }}>
        {selectedOrders.length === orders.length && orders.length > 0 ? 'Deselect All' : 'Select All'}
      </button>
    );
    if (isPMTab) return (
      <>
        {selectAllItem}
        <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFC] cursor-pointer" onClick={() => { handleBulkManifest(selectedOrders); closeMenu(); }}>Download Manifests</button>
        <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFC] cursor-pointer" onClick={() => { handleBulkLabel(selectedOrders); closeMenu(); }}>Download Labels</button>
        <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFC] cursor-pointer" onClick={() => { handleBulkInvoice(selectedOrders); closeMenu(); }}>Download Invoices</button>
      </>
    );
    if (isNewTab) return (
      <>
        {selectAllItem}
        <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] cursor-pointer" onClick={() => { handleBulkShipClick(); closeMenu(); }}>Bulk Ship</button>
        <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] cursor-pointer" onClick={() => { setShowPackageModal(true); closeMenu(); }}>Update Package Details</button>
        <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] cursor-pointer" onClick={() => { openPickupModal(); closeMenu(); }}>Update Pickup Address</button>
        <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] cursor-pointer" onClick={() => { handleBulkLabel(selectedOrders); closeMenu(); }}>Verify Orders</button>
        <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] cursor-pointer" onClick={() => { setShowExportModal(true); closeMenu(); }}>Export Excel</button>
        <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] cursor-pointer" onClick={() => { handleBulkInvoice(selectedOrders); closeMenu(); }}>Download Invoices</button>
        <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#EF4444] hover:bg-red-50 mt-1 cursor-pointer" onClick={() => { selectedOrders.forEach(id => { const o = orders.find(x => x._id === id); if (o) handleCancelOrder(o); }); closeMenu(); }}>Bulk Delete</button>
      </>
    );
    return (
      <>
        {selectAllItem}
        <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] cursor-pointer" onClick={() => { setShowExportModal(true); closeMenu(); }}>Export Excel</button>
        <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] cursor-pointer" onClick={() => { handleBulkLabel(selectedOrders); closeMenu(); }}>Download Labels</button>
        <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] cursor-pointer" onClick={() => { handleBulkInvoice(selectedOrders); closeMenu(); }}>Download Invoices</button>
        <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] cursor-pointer" onClick={() => { handleBulkManifest(selectedOrders); closeMenu(); }}>Download Manifests</button>
      </>
    );
  };

  // ── Per-row action items ──
  const close = () => setDropdownPos(null);
  const renderRowActions = (rowOrder: any, _idx: number) => {
    if (isPMTab) return (
      <>
        <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] cursor-pointer" onClick={() => { handleManifest(rowOrder._id); close(); }}>Download Manifest</button>
        <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] cursor-pointer" onClick={() => { navigate(isAdminView ? '/admin/support' : '/user/support'); close(); }}>Raise a Ticket</button>
      </>
    );
    if (activeTab === 'Ready to Ship') return (
      <>
        <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFC] cursor-pointer" onClick={() => { handleLabel(rowOrder._id); close(); }}>Download Label</button>
        <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFC] cursor-pointer" onClick={() => { handleInvoice(rowOrder._id); close(); }}>Download Invoice</button>
        <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFC] cursor-pointer" onClick={() => { handleManifest(rowOrder._id); close(); }}>Download Manifest</button>
        <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFC] cursor-pointer" onClick={() => { navigate(`${isAdminView ? '/admin' : '/user'}/add-order?cloneId=${rowOrder._id}`); close(); }}>Clone Order</button>
        <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#EF4444] hover:bg-red-50 mt-1 cursor-pointer" onClick={() => { handleCancelOrder(rowOrder); close(); }}>Cancel Order</button>
      </>
    );
    if (isNewTab) return (
      <>
        <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] cursor-pointer" onClick={() => { handleInvoice(rowOrder._id); close(); }}>Download Invoice</button>
        <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] cursor-pointer" onClick={() => { navigate(`${isAdminView ? '/admin' : '/user'}/add-order?cloneId=${rowOrder._id}`); close(); }}>Clone Order</button>
        <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] cursor-pointer" onClick={() => { navigate(`${isAdminView ? '/admin' : '/user'}/add-order?updateId=${rowOrder._id}`); close(); }}>Update Order</button>
        <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#EF4444] hover:bg-red-50 mt-1 cursor-pointer" onClick={() => { handleCancelOrder(rowOrder); close(); }}>Delete Order</button>
      </>
    );
    return (
      <>
        <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] cursor-pointer" onClick={() => { handleLabel(rowOrder._id); close(); }}>Download Label</button>
        <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] cursor-pointer" onClick={() => { handleInvoice(rowOrder._id); close(); }}>Download Invoice</button>
        <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] cursor-pointer" onClick={() => { handleManifest(rowOrder._id); close(); }}>Download Manifest</button>
        <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] cursor-pointer" onClick={() => { navigate(`${isAdminView ? '/admin' : '/user'}/add-order?cloneId=${rowOrder._id}`); close(); }}>Clone Order</button>
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
      <div className={`flex flex-col ${isImpersonating ? 'h-[calc(100vh-104px)]' : 'h-[calc(100vh-72px)]'} -m-4 md:-m-6 bg-white ${!isAdminView ? 'overflow-hidden' : ''}`}>

        {/* ── Mobile Search + Filter + Action + Add Order Row (matches Wallet page) ──
            Same hoisted row for every tab, including Pickup & Manifest — only the search
            placeholder/value and the action-menu content differ for that tab. ── */}
        <div className="md:hidden relative z-[60] px-3 py-2.5 border-b border-[#E2E8F0] flex items-center gap-2 bg-white shrink-0">
          {isAdminView && !isPMTab ? (
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Search user..."
                value={userQuery}
                onChange={(e) => onUserQueryChange(e.target.value)}
                className="w-full h-9 pl-9 pr-8 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-2 focus:ring-[#00A86B]/10 transition-all"
              />
              {userMongoId && (
                <button onClick={clearUserFilter} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-red-500">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              {userSuggestions.length > 0 && !userMongoId && (
                <div className="absolute left-0 top-full mt-1 bg-white border border-[#E2E8F0] rounded-xl shadow-xl z-50 w-full max-h-52 overflow-y-auto py-1">
                  {userSuggestions.map((u: any) => (
                    <button key={u._id} type="button"
                      onClick={() => selectUserSuggestion(u)}
                      className="w-full text-left px-3 py-2.5 hover:bg-[#F0FDF4] flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-bold text-slate-800 truncate">{u.fullname}</div>
                        <div className="text-[11px] text-slate-400 truncate">{u.email} · {u.phoneNumber}</div>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">{u.userId}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="text"
                placeholder={isPMTab ? 'Pickup ID tracking' : 'AWB/Order ID tracking'}
                value={isPMTab ? pmMobileSearch : mobileSearchQuery}
                onChange={(e) => (isPMTab ? setPmMobileSearch(e.target.value) : setMobileSearchQuery(e.target.value))}
                className="w-full h-9 pl-9 pr-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-2 focus:ring-[#00A86B]/10 transition-all"
              />
            </div>
          )}
          {/* Filter icon */}
          <button
            onClick={() => setIsMobileFiltersOpen(true)}
            className="w-9 h-9 rounded-xl border border-[#E2E8F0] flex items-center justify-center text-[#475569] bg-white shrink-0"
          >
            <Filter className="w-4 h-4" />
          </button>
          {/* Action icon */}
          <div className="relative shrink-0" ref={mobileActionMenuRef}>
            <button
              onClick={(e) => {
                const count = isPMTab ? pmSelectedCount : selectedOrders.length;
                if (count === 0) return;
                if (isPMTab) { pmBulkActionRef.current?.(); return; }
                if (!showActionMenu) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setMobileActionMenuPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
                }
                setShowActionMenu(v => !v);
              }}
              disabled={(isPMTab ? pmSelectedCount : selectedOrders.length) === 0}
              className="w-9 h-9 rounded-xl border border-[#E2E8F0] flex items-center justify-center text-[#475569] bg-white relative disabled:opacity-50"
              title={isPMTab ? 'Download Manifests' : undefined}
            >
              <MoreVertical className="w-4 h-4" />
              {(isPMTab ? pmSelectedCount : selectedOrders.length) > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full bg-[#00A86B] text-white text-[9px] font-bold flex items-center justify-center px-0.5">
                  {isPMTab ? pmSelectedCount : selectedOrders.length}
                </span>
              )}
            </button>
            {!isPMTab && showActionMenu && mobileActionMenuPos && createPortal(
              <>
                <div className="fixed inset-0 z-[998]" onClick={() => setShowActionMenu(false)} />
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.16, ease: 'easeOut' }}
                    style={{ top: mobileActionMenuPos.top, right: mobileActionMenuPos.right }}
                    className="fixed w-[200px] bg-white rounded-xl shadow-[0_8px_28px_-6px_rgba(0,0,0,0.15)] border border-[#E2E8F0] py-1.5 z-[999] origin-top-right"
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    {renderActionMenuItems()}
                  </motion.div>
                </AnimatePresence>
              </>,
              document.body
            )}
          </div>
          {/* Add Order icon */}
          {!isAdminView && (
            <button
              onClick={() => navigate('/user/add-order')}
              className="w-9 h-9 rounded-xl bg-[#00A86B] flex items-center justify-center text-white shadow-sm active:bg-[#009B63] transition-colors shrink-0"
              title="Add Order"
            >
              <PackagePlus className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* ── Top Tab Bar ── */}
        <div className="bg-white relative z-50 shrink-0">
          <div className="flex items-center px-4 md:px-6 py-2 border-b border-[#E2E8F0]">
            {/* Left group: scrollable main tabs + More button side by side */}
            <div className="flex items-center flex-1 min-w-0 gap-4 md:gap-5">
              <div className="flex gap-1 items-center min-w-0 bg-[#F7FEFC] rounded-full p-1.5">
                <div className="flex gap-1 items-center overflow-x-auto no-scrollbar min-w-0">
                  {MAIN_TABS.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => handleTabChange(tab)}
                      ref={(el) => { if (el && activeTab === tab) el.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }}
                      className={`relative px-4 py-2 text-[14px] md:text-[13px] font-semibold md:font-bold transition-colors whitespace-nowrap rounded-full cursor-pointer ${activeTab === tab ? 'text-[#00A86B] underline underline-offset-4 decoration-2' : 'text-[#64748B] hover:text-[#0F172A]'}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                {/* More button — inside the pill, shrink-0 keeps it always visible (not pushed off-screen on mobile) */}
                <div className="relative shrink-0" ref={moreRef}>
                  <button
                    onClick={() => setShowMore(!showMore)}
                    className={`px-4 py-2 text-[14px] md:text-[13px] font-semibold md:font-bold flex items-center gap-1 transition-colors whitespace-nowrap rounded-full cursor-pointer ${MORE_TABS.includes(activeTab) ? 'text-[#00A86B] underline underline-offset-4 decoration-2' : 'text-[#64748B] hover:text-[#0F172A]'}`}
                  >
                    {MORE_TABS.includes(activeTab) ? activeTab : 'More'} <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showMore ? 'rotate-180' : ''}`} />
                  </button>
                  {showMore && (
                    <div className="absolute top-full right-0 md:left-0 md:right-auto mt-1 w-48 bg-white rounded-xl shadow-xl border border-[#E2E8F0] overflow-hidden z-[200] max-h-[60vh] overflow-y-auto">
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
            </div>
            {/* Download + Refresh on the right */}
            <button onClick={() => setShowExportModal(true)} aria-label="Download Excel" className="hidden md:flex w-8 h-8 rounded-full border border-[#E2E8F0] items-center justify-center text-[#64748B] hover:bg-[#F8FAFC] shrink-0 ml-4 cursor-pointer">
              <Download className="w-4 h-4" />
            </button>
            <button onClick={() => fetchOrders(page)} className="hidden md:flex w-8 h-8 rounded-full border border-[#E2E8F0] items-center justify-center text-[#64748B] hover:bg-[#F8FAFC] shrink-0 ml-2 cursor-pointer">
              <RefreshCcw className="w-4 h-4" />
            </button>
          </div>

          {/* ── Flat Rate Services ad — user side only, first time per login session ── */}
          {!isAdminView && (
            <AnimatePresence initial={false}>
              {showFlatRateAd && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="px-4 md:px-6 pt-3">
                    <div className="relative rounded-xl overflow-hidden border border-[#E2E8F0] shadow-sm">
                      <ProtectedAdImage src={flatRateAdImg} />
                      <button
                        onClick={dismissFlatRateAd}
                        aria-label="Dismiss ad"
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 hover:bg-white shadow-sm border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:text-[#0F172A] transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {/* ── Filter Row — hidden for Pickup & Manifest (that tab has its own UI) ── */}
          {!isPMTab && <div className="orders-filter-bar hidden md:flex py-3 px-6 border-b border-[#CBD5F5] flex-wrap items-center gap-3 bg-[#F8FAFC]/50">

            {/* User search autocomplete — admin view only */}
            {isAdminView && (
              <div className="relative shrink-0">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search user..."
                    value={userQuery}
                    onChange={(e) => onUserQueryChange(e.target.value)}
                    className="glass-search-input w-[160px]"
                    style={{ paddingLeft: '2rem', paddingRight: '2rem' }}
                  />
                  <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 top-1/2 -translate-y-1/2" />
                  {userMongoId && (
                    <button onClick={clearUserFilter}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                {userSuggestions.length > 0 && !userMongoId && (
                  <div className="absolute left-0 top-full mt-1 bg-white border border-[#E2E8F0] rounded-xl shadow-xl z-50 w-64 max-h-52 overflow-y-auto py-1">
                    {userSuggestions.map((u: any) => (
                      <button key={u._id} type="button"
                        onClick={() => selectUserSuggestion(u)}
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
              className="glass-search-input w-[170px] shrink-0"
            />

            {/* AWB — only on tabs that have AWB numbers */}
            {!isNewTab && !isPMTab && (
              <input
                type="text"
                placeholder="Search by AWB..."
                value={awbNumber}
                onChange={(e) => setAwbNumber(e.target.value)}
                className="glass-search-input w-[150px] shrink-0"
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
              onDateChange={onOrderDateChange}
              defaultStart={defStart}
              defaultEnd={defEnd}
            />

            <button onClick={handleApplyFilters} className="py-2 px-4 shrink-0 rounded-[32px] bg-[#009D64] border border-[#009D64] text-white text-xs font-medium leading-[18px] hover:bg-[#008a57] transition-colors cursor-pointer">
              Apply Filters
            </button>
            {hasActiveFilters && (
              <button onClick={handleClearAllFilters} className="py-2 px-4 shrink-0 rounded-[32px] border border-red-200 text-red-500 text-xs font-medium leading-[18px] hover:bg-red-50 transition-colors cursor-pointer">
                Clear All
              </button>
            )}

            <div className="ml-auto flex items-center gap-2 shrink-0">
              <div className="relative" ref={actionMenuRef}>
                <button
                  onClick={() => selectedOrders.length > 0 && setShowActionMenu(v => !v)}
                  disabled={selectedOrders.length === 0}
                  className={`py-2 pl-4 pr-8 rounded-[32px] border text-xs leading-[18px] flex items-center font-medium relative transition-colors ${selectedOrders.length === 0 ? 'border-[#E2E8F0] bg-[#F8FAFC] text-[#CBD5E1] cursor-not-allowed' : 'border-[#03C27D] bg-white text-[#64748B] hover:bg-[#F0FDF9] cursor-pointer'}`}
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
              {!isAdminView && (
                <button
                  onClick={() => navigate('/user/add-order')}
                  aria-label="Add Order"
                  className="w-9 h-9 rounded-[80px] border border-[#03C27D] flex items-center justify-center text-white shadow-sm transition-transform hover:scale-105 bg-[#009D64]"
                >
                  <PackagePlus className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>}

          {/* ── Bulk Actions Toolbar — only for order tabs ── */}
          {!isPMTab && selectedOrders.length > 0 && (
            <div className="hidden md:flex px-4 py-2 bg-blue-50 border-b border-blue-100 items-center gap-3">
              <span className="text-xs font-bold text-blue-700">{selectedOrders.length} selected</span>
              {isNewTab && <button onClick={handleBulkShipClick} className="h-8 px-3 rounded-md bg-white border border-blue-200 text-xs font-bold text-blue-700 shadow-sm hover:bg-blue-50 cursor-pointer">Bulk Ship</button>}
              {isNewTab && <button onClick={() => setShowPackageModal(true)} className="h-8 px-3 rounded-md bg-white border border-blue-200 text-xs font-bold text-blue-700 shadow-sm hover:bg-blue-50 cursor-pointer">Update Package Details</button>}
              {isNewTab && <button onClick={() => openPickupModal()} className="h-8 px-3 rounded-md bg-white border border-blue-200 text-xs font-bold text-blue-700 shadow-sm hover:bg-blue-50 cursor-pointer">Update Pickup Address</button>}
              <button onClick={() => setShowExportModal(true)} className="h-8 px-3 rounded-md bg-white border border-blue-200 text-xs font-bold text-blue-700 shadow-sm hover:bg-blue-50 cursor-pointer">Export Excel</button>
              <button onClick={() => handleBulkInvoice(selectedOrders)} className="h-8 px-3 rounded-md bg-white border border-blue-200 text-xs font-bold text-blue-700 shadow-sm hover:bg-blue-50 cursor-pointer">Download Invoices</button>
              {activeTab === 'Ready to Ship' && (
                <button onClick={() => handleBulkManifest(selectedOrders)} className="h-8 px-3 rounded-md bg-white border border-blue-200 text-xs font-bold text-blue-700 shadow-sm hover:bg-blue-50 cursor-pointer">Download Manifests</button>
              )}
              {isNewTab && <button onClick={() => { selectedOrders.forEach(id => { const o = orders.find(x => x._id === id); if (o) handleCancelOrder(o); }); setSelectedOrders([]); }} className="h-8 px-3 rounded-md bg-white border border-red-200 text-xs font-bold text-red-600 shadow-sm ml-auto hover:bg-red-50 cursor-pointer">Bulk Delete</button>}
            </div>
          )}
        </div>

        {/* ── Pickup & Manifest tab — separate component with its own API + UI ── */}
        {isPMTab && (
          <div className="flex-1 min-h-0 overflow-hidden border-t border-[#E2E8F0]">
            <AdminPickupManifest
              isAdminView={isAdminView}
              hideMobileSearchBar
              mobileSearchOverride={pmMobileSearch}
              onMobileSearchOverrideChange={setPmMobileSearch}
              mobileFiltersOpen={isMobileFiltersOpen}
              onMobileFiltersOpenChange={setIsMobileFiltersOpen}
              onSelectedCountChange={setPmSelectedCount}
              onBulkActionRequest={(trigger) => { pmBulkActionRef.current = trigger; }}
            />
          </div>
        )}

        {/* ── Table (all other tabs) — desktop only ── */}
        {!isPMTab && <div className="hidden md:flex bg-white flex-col flex-1 min-h-0 overflow-hidden border-t border-[#E2E8F0]">
          <div className="flex-1 overflow-auto w-full relative">
            {loading && <TableLoader />}
            <table className="w-full text-left border-collapse min-w-full">
                <thead className="sticky top-0 z-40 bg-[#E6F9F2] shadow-sm">
                  <tr className="text-xs leading-[18px] font-medium text-[#64748B] uppercase tracking-wider border border-[#B9EFDB]">
                    <th className="py-2 px-4 w-10 rounded-l-lg">
                      <input type="checkbox" checked={selectedOrders.length === orders.length && orders.length > 0} onChange={toggleAll} className="rounded border-[#00A86B] accent-[#00A86B] w-3.5 h-3.5" />
                    </th>

                    {/* User column — admin view only */}
                    {isAdminView && (
                      <th className="py-2 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1"><User className="w-3.5 h-3.5 shrink-0" /><span>User</span></div>
                      </th>
                    )}

                    {isPMTab ? (
                      <>
                        <th className="py-2 px-4 whitespace-nowrap"><div className="flex items-center gap-1"><Package className="w-3.5 h-3.5 shrink-0" /><span>Pickup ID</span></div></th>
                        <th className="py-2 px-4 whitespace-nowrap"><div className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 shrink-0" /><span>Pickup</span></div></th>
                        <th className="py-2 px-4 whitespace-nowrap"><div className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 shrink-0" /><span>Pickup Date</span></div></th>
                        <th className="py-2 px-4 whitespace-nowrap"><div className="flex items-center gap-1"><Layers className="w-3.5 h-3.5 shrink-0" /><span>Total / Picked</span></div></th>
                        <th ref={ageingLegendRef} className="py-2 px-4 whitespace-nowrap relative cursor-pointer hover:bg-[#D1F0E8]" onClick={() => setShowAgeingLegend(!showAgeingLegend)}>
                          <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 shrink-0" /><span>Ageing</span></div>
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
                        <th className="py-2 px-4 whitespace-nowrap"><div className="flex items-center gap-1"><FileText className="w-3.5 h-3.5 shrink-0" /><span>Order</span></div></th>
                        <th className="py-2 px-4 whitespace-nowrap"><div className="flex items-center gap-1"><Package className="w-3.5 h-3.5 shrink-0" /><span>Product</span></div></th>
                        <th className="py-2 px-4 whitespace-nowrap"><div className="flex items-center gap-1"><Package className="w-3.5 h-3.5 shrink-0" /><span>Package</span></div></th>
                        <th className="py-2 px-4 whitespace-nowrap"><div className="flex items-center gap-1"><IndianRupee className="w-3.5 h-3.5 shrink-0" /><span>Payment</span></div></th>
                        <th className="py-2 px-4 whitespace-nowrap"><div className="flex items-center gap-1"><User className="w-3.5 h-3.5 shrink-0" /><span>Customer</span></div></th>
                        <th className="py-2 px-4 whitespace-nowrap"><div className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 shrink-0" /><span>Pickup</span></div></th>
                        {showShipmentCol && (
                          <th className="py-2 px-4 whitespace-nowrap"><div className="flex items-center gap-1"><Truck className="w-3.5 h-3.5 shrink-0" /><span>Shipment</span></div></th>
                        )}
                      </>
                    )}

                    <th className="py-2 px-4 whitespace-nowrap"><div className="flex items-center gap-1"><Check className="w-3.5 h-3.5 shrink-0" /><span>Status</span></div></th>
                    {showLastUpdateCol && (
                      <th className="py-2 px-4 whitespace-nowrap"><div className="flex items-center gap-1"><History className="w-3.5 h-3.5 shrink-0" /><span>Last Update</span></div></th>
                    )}
                    <th className="py-2 px-4 whitespace-nowrap rounded-r-lg"><div className="flex items-center gap-1"><Settings className="w-3.5 h-3.5 shrink-0" /><span>Actions</span></div></th>
                  </tr>
                </thead>
                <tbody className="text-[11px] text-[#475569]">
                  {paginatedOrders.length === 0 ? (
                    <tr>
                      <td colSpan={colCount()} className="text-center">
                        <EmptyState title="No orders found" subtitle="Try changing filters" />
                      </td>
                    </tr>
                  ) : paginatedOrders.map((order, _idx) => (
                    <tr key={order._id} className={`border-b border-[#E2E8F0] transition-colors group ${_idx % 2 === 0 ? 'bg-white' : 'bg-[#E6EDF7]/20'} ${cancellingIds.has(order._id) ? 'opacity-50 pointer-events-none' : ''}`}>
                      <td className="p-3">
                        <input type="checkbox" checked={selectedOrders.includes(order._id)} onChange={() => toggleSelect(order._id)} className="rounded border-gray-300 accent-[#00A86B] w-3.5 h-3.5" />
                      </td>

                      {/* User column — admin view only */}
                      {isAdminView && (
                        <td className="p-3">
                          <div className="flex flex-col gap-1">
                            <div className="text-[12px] leading-[18px] font-semibold text-[#009D64] hover:underline cursor-pointer" onClick={() => setDrawerOrder(order)}>
                              {order.userUserId || order.orderId}
                            </div>
                            <TruncatedText text={order.userName} maxLength={20} className="text-[14px] leading-[20px] font-semibold text-[#1E293B] max-w-[156px]" />
                            <TruncatedText text={order.userEmail} maxLength={25} className="text-[12px] leading-[18px] font-normal text-[#64748B] max-w-[156px]" />
                          </div>
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
                              onMouseEnter={(e) => setHoveredPickup({ id: order._id, rect: e.currentTarget.getBoundingClientRect(), name: order.pickupName, address: order.pickupAddressLine, city: order.pickupCity, state: order.pickupState, pinCode: order.pickupPinCode, phone: order.pickupPhone })}
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
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1 group/copy w-max">
                                <div className="text-[12px] leading-[18px] font-semibold text-[#009D64] hover:underline cursor-pointer" onClick={() => navigate(`${isAdminView ? '/admin' : '/user'}/order-tracking?id=${order.orderId}`)}>{order.orderId}</div>
                                <button onClick={(e) => { e.stopPropagation(); copyToClipboard(order.orderId, 'Order ID'); }} className="opacity-100 md:opacity-0 md:group-hover/copy:opacity-100 transition-opacity shrink-0 focus:outline-none" title="Copy Order ID"><Copy className="w-3 h-3 text-[#94A3B8] hover:text-[#00A86B]" /></button>
                              </div>
                              <div className="text-[12px] leading-[18px] font-normal text-[#64748B]">{order.date}</div>
                              <span className="px-2 py-0.5 rounded-full border border-blue-200 text-[#004AAD] font-semibold text-[10px] leading-4 bg-blue-50/50 inline-block uppercase w-fit">
                                {order.channel === 'WooCommerce' ? 'Woo' : (order.channel || 'CUSTOM')}
                              </span>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex flex-col gap-1">
                              <div
                                className="inline-block text-[12px] leading-[18px] font-normal text-[#1E293B] underline decoration-dotted underline-offset-2 hover:text-[#00A86B] truncate max-w-[120px] w-fit cursor-help"
                                onMouseEnter={(e) => {
                                  if (order.products.length === 0) return;
                                  hoverOpenProductTooltip(order._id, e);
                                }}
                                onMouseLeave={() => closeProductTooltip(order._id)}
                              >{order.productName || '—'}</div>
                              <div className="text-[12px] leading-[18px] font-normal text-[#1E293B] truncate max-w-[120px]">SKU: {order.sku || '—'}</div>
                              <div className="text-[12px] leading-[18px] font-normal text-[#1E293B]">QTY: {order.qty}</div>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex flex-col gap-1 text-[12px] leading-[18px] font-normal text-[#1E293B]">
                              <div>Weight: {order.weight}</div>
                              <div>L×W×H: {order.dimensions}</div>
                              <div>Vol: {order.volWeight}</div>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex flex-col gap-1">
                              <div className="text-[12px] leading-[18px] font-normal text-[#64748B] ml-[3px]">&#8377;{order.payment}</div>
                              <span className="px-2 py-0.5 rounded-full border border-blue-200 text-[#004AAD] font-semibold text-[10px] leading-4 bg-blue-50/50 inline-block w-fit">{order.paymentType}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="relative flex flex-col gap-1 overflow-visible">
                              <div className="flex items-center gap-1">
                                <div
                                  className="text-[12px] leading-[18px] font-normal text-[#1E293B] underline decoration-dotted underline-offset-2 hover:text-[#00A86B] cursor-help inline-block truncate max-w-[110px]"
                                  onMouseEnter={(e) => setHoveredCustomer({ rect: e.currentTarget.getBoundingClientRect(), name: order.customerName, address: order.customerAddress, city: order.customerCity, state: order.customerState, pinCode: order.customerPinCode, email: order.customerEmail })}
                                  onMouseLeave={() => setHoveredCustomer(null)}
                                >
                                  {order.customerName}
                                </div>
                                {!isAdminView && isNewTab && (() => {
                                  const key = repeatCustomerKey(order.customerPhone, order.customerAddress, order.customerPinCode);
                                  const repeat = repeatCustomerMap[key];
                                  if (!repeat || repeat.totalOrders <= 1) return null;
                                  // Only the single most-recent order for this customer+address (among
                                  // what's on screen) gets the icon — never more than one row.
                                  // "Most recent" is decided by the full creation timestamp (date + time),
                                  // see latestOrderIdByCustomer above.
                                  if (latestOrderIdByCustomer[key] !== order._id) return null;
                                  return (
                                    <button
                                      type="button"
                                      title="Repeat customer"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        setRepeatCustomerPopover(prev => prev?.key === key ? null : { rect, key });
                                      }}
                                      className="shrink-0 text-[#4F46E5] hover:text-[#4338CA] cursor-pointer transition-colors ml-[5px]"
                                    >
                                      <UserCheck className="w-3.5 h-3.5" />
                                    </button>
                                  );
                                })()}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <div className="text-[12px] leading-[18px] font-normal text-[#64748B]">
                                  {!isAdminView && order.customerPhone && order.customerPhone !== '—' && !revealedPhones.has(order._id)
                                    ? maskPhone(order.customerPhone)
                                    : order.customerPhone}
                                </div>
                                {!isAdminView && order.customerPhone && order.customerPhone !== '—' && (
                                  <button
                                    type="button"
                                    title={revealedPhones.has(order._id) ? 'Hide mobile number' : 'Show mobile number'}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setRevealedPhones(prev => {
                                        const next = new Set(prev);
                                        if (next.has(order._id)) next.delete(order._id);
                                        else next.add(order._id);
                                        return next;
                                      });
                                    }}
                                    className="shrink-0 text-[#94A3B8] hover:text-[#0F172A] cursor-pointer transition-colors"
                                  >
                                    {revealedPhones.has(order._id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                  </button>
                                )}
                              </div>
                              <RtoRiskLine order={order} historyMaps={rtoHistoryMaps} riskResult={riskMap[order._id]} />
                            </div>
                          </td>
                          <td className="p-3">
                            <div
                              className="text-[12px] leading-[18px] font-normal text-[#1E293B] underline decoration-dotted underline-offset-2 hover:text-[#00A86B] cursor-help inline-block truncate max-w-[100px]"
                              onMouseEnter={(e) => setHoveredPickup({ id: order._id, rect: e.currentTarget.getBoundingClientRect(), name: order.pickupName, address: order.pickupAddressLine, city: order.pickupCity, state: order.pickupState, pinCode: order.pickupPinCode, phone: order.pickupPhone })}
                              onMouseLeave={() => setHoveredPickup(null)}
                            >
                              {order.pickupName}
                            </div>
                          </td>
                          {showShipmentCol && (
                            <td className="p-3">
                              <div className="flex flex-col gap-1">
                                <div className="text-[12px] leading-[18px] font-semibold text-[#009D64]">{order.courier}</div>
                                <div className="text-[12px] leading-[18px] font-normal text-[#1E293B]">Booked | {order.bookedDate}</div>
                                <div className="flex items-center gap-1 group/copy">
                                  <div onClick={() => order.awb && navigate(`${isAdminView ? '/admin' : '/user'}/tracking?awb=${order.awb}`)} title="Track shipment" className="text-[12px] leading-[18px] font-semibold text-[#009D64] underline hover:text-[#009B63] cursor-pointer truncate max-w-[120px]">{order.awb}</div>
                                  {order.awb && <button onClick={(e) => { e.stopPropagation(); copyToClipboard(order.awb, 'AWB'); }} className="opacity-100 md:opacity-0 md:group-hover/copy:opacity-100 transition-opacity shrink-0 focus:outline-none" title="Copy AWB"><Copy className="w-3 h-3 text-[#94A3B8] hover:text-[#00A86B]" /></button>}
                                </div>
                              </div>
                            </td>
                          )}
                        </>
                      )}

                      <td className="p-3">
                        <span className={getStatusBadgeClass(order.status)}>{order.status}</span>
                      </td>

                      {showLastUpdateCol && (
                        <td className="p-3">
                          {order.lastUpdateDate ? (
                            <div className="flex flex-col gap-0.5">
                              {order.lastUpdateLocation && (
                                <div className="flex items-center gap-1.5">
                                  <div className="w-2 h-2 rounded-full bg-[#00A86B] shrink-0" />
                                  <span className="font-semibold text-[#0F172A] text-[11px] truncate max-w-[120px]">{order.lastUpdateLocation}</span>
                                </div>
                              )}
                              <span className="text-[10px] text-[#64748B] pl-3.5">
                                {(() => {
                                  const d = new Date(order.lastUpdateDate);
                                  if (isNaN(d.getTime())) return order.lastUpdateDate;
                                  const day = String(d.getUTCDate()).padStart(2, '0');
                                  const month = d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
                                  let h = d.getUTCHours();
                                  const min = String(d.getUTCMinutes()).padStart(2, '0');
                                  const amPm = h >= 12 ? 'PM' : 'AM';
                                  h = h % 12 || 12;
                                  return `${day} ${month} ${d.getUTCFullYear()}, ${h}:${min} ${amPm}`;
                                })()}
                              </span>
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
                          {cancellingIds.has(order._id) ? (
                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-rose-500 bg-rose-50 border border-rose-100 rounded-full px-2.5 py-1 whitespace-nowrap">
                              <Loader2 className="w-3 h-3 animate-spin" /> Cancelling…
                            </span>
                          ) : (
                            <>
                              {isNewTab && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setShipOrder(order); }}
                                  className="h-7 px-3 rounded-full bg-[#1e40af] text-white font-bold text-[10px] flex items-center gap-1 hover:bg-[#1e3a8a] shadow-sm cursor-pointer"
                                >
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
                                className={`w-7 h-7 rounded-full border flex items-center justify-center z-10 transition-colors cursor-pointer ${dropdownPos?.id === order._id ? 'bg-green-100 border-[#00A86B] text-[#00A86B]' : 'border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9]'}`}
                              >
                                <MoreHorizontal className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {/* ── Pagination ── */}
          {totalRecords > 0 && (
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
        </div>}

        {/* ── Mobile Card Layout (all other tabs) ── */}
        {!isPMTab && (
          <div className="md:hidden flex-1 min-h-0 flex flex-col bg-[#F8FAFC]">
          <div className="flex-1 overflow-y-auto relative">
            {loading && <TableLoader />}
            {paginatedOrders.length === 0 ? (
              <div className="flex items-center justify-center min-h-[60vh]">
                <EmptyState title="No orders found" subtitle="Try changing filters" />
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {paginatedOrders.map((order) => {
                  const accent = getRibbonColor(order.status || activeTab);
                  return (
                  <div key={order._id} className="relative bg-white rounded-2xl border border-[#E2E8F0] shadow-sm">
                    {cancellingIds.has(order._id) && (
                      <div className="absolute inset-0 z-20 bg-white/80 rounded-2xl flex items-center justify-center">
                        <span className="flex items-center gap-2 text-[11px] font-bold text-rose-500 bg-rose-50 border border-rose-100 rounded-full px-3 py-1.5">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Cancelling…
                        </span>
                      </div>
                    )}
                    <StatusRibbon
                      label={isNewTab ? 'New' : (order.status || activeTab)}
                      color={accent}
                      textClassName={isNewTab ? 'text-[11px] font-bold tracking-wide leading-[13px]' : undefined}
                    />

                    {/* Checkbox — top-right, sits on its own white chip above the ribbon so long labels never overlap it */}
                    <div className="absolute top-2 right-2 z-20 bg-white rounded-md p-0.5 shadow-sm">
                      <input type="checkbox" checked={selectedOrders.includes(order._id)} onChange={() => toggleSelect(order._id)}
                        className="rounded border-gray-300 accent-[#00A86B] w-4 h-4 shrink-0 block" />
                    </div>

                    <div className="pt-4 px-2 pb-2">
                      {/* User Details Row — name shown admin-only; pr-6 keeps text clear of the checkbox chip */}
                      <div className="flex items-center justify-between mb-1 gap-2 pr-6">
                        {isAdminView ? (
                          <>
                            <span className="text-[#64748B] font-medium text-[12px] shrink-0">User Details</span>
                            <span className="text-[12px] inline-flex items-baseline gap-1 min-w-0 justify-end text-right">
                              <TruncatedText text={order.userName || order.customerName} maxLength={16} className="font-semibold text-[#0F172A] text-[12px]" />
                              <span className="text-[12px] font-semibold leading-[18px] shrink-0" style={{ color: '#009D64' }}>({order.userUserId || order.orderId})</span>
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-[#64748B] font-medium text-[12px] shrink-0">Order ID</span>
                            <span className="text-[12px] font-semibold text-[#0F172A] truncate">{order.orderId}</span>
                          </>
                        )}
                      </div>

                      {/* Courier & Order Card */}
                      <div className="rounded-xl p-1.5 mb-1.5 bg-white" style={{ border: `1px solid ${accent}` }}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            {order.courier && order.courier !== '—' ? (
                              <CourierLogo name={order.courier} size="sm" className="shadow-sm" />
                            ) : (
                              <div className="w-9 h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-center shrink-0">
                                <Truck className="w-4 h-4 text-[#94A3B8]" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="text-[12px] font-normal text-[#0F172A] truncate">
                                {order.courier && order.courier !== '—' ? order.courier : (isNewTab ? 'Not shipped yet' : 'Courier not assigned')} {order.weight ? `· ${order.weight}` : ''}
                              </div>
                              <div className="flex items-center gap-1.5 min-w-0 mt-0.5">
                                {order.awb ? (
                                  <>
                                    <span onClick={(e) => { e.stopPropagation(); navigate(`${isAdminView ? '/admin' : '/user'}/tracking?awb=${order.awb}`); }} className="text-[12px] font-semibold text-[#00A86B] underline truncate active:opacity-60 cursor-pointer">{order.awb}</span>
                                    <button onClick={(e) => { e.stopPropagation(); copyToClipboard(order.awb, 'AWB'); }} className="shrink-0 focus:outline-none">
                                      <Copy className="w-3 h-3 text-[#94A3B8] hover:text-[#00A86B]" />
                                    </button>
                                  </>
                                ) : (
                                  <span className="text-[12px] font-semibold text-[#94A3B8] truncate">AWB not generated</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-[12px] font-normal text-[#0F172A]">{order.paymentType}</div>
                            <div className="text-[12px] font-semibold text-[#00A86B]">&#8377;{order.payment}</div>
                          </div>
                        </div>
                      </div>

                      {/* Product & Weight Row */}
                      <div className="flex items-start justify-between mb-1.5 px-1 gap-2">
                        <div
                          className="min-w-0 cursor-help"
                          onClickCapture={(e) => {
                            if (!order.products || order.products.length === 0) return;
                            openProductTooltip(order._id, e);
                          }}
                        >
                          <TruncatedText text={order.productName || '—'} maxLength={30} className="text-[12px] font-normal text-[#0F172A] underline decoration-dotted underline-offset-2" />
                        </div>
                        <span className="text-[11px] font-medium text-[#64748B] shrink-0">Weight: {order.weight}</span>
                      </div>

                      {/* Pickup / Receiver Row */}
                      <div className="flex items-start justify-between bg-[#F8FAFC] rounded-xl px-2.5 py-1.5 mb-1.5 gap-2">
                        <div
                          className="min-w-0 cursor-help"
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            const next = { id: order._id, rect, name: order.pickupName, address: order.pickupAddressLine, city: order.pickupCity, state: order.pickupState, pinCode: order.pickupPinCode, phone: order.pickupPhone };
                            setHoveredPickup(prev => (prev?.id === order._id ? null : next));
                          }}
                        >
                          <div className="truncate max-w-[130px] text-[10px] font-normal text-[#94A3B8] uppercase tracking-wider underline decoration-dotted underline-offset-2">{order.pickupName}</div>
                          <div className="text-[12px] font-medium text-[#0F172A] mt-0.5">{order.pickupPhone}</div>
                        </div>
                        <div
                          className="text-right min-w-0 cursor-help"
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            const next = { rect, name: order.customerName, address: order.customerAddress, city: order.customerCity, state: order.customerState, pinCode: order.customerPinCode, email: order.customerEmail };
                            setHoveredCustomer(prev => (prev ? null : next));
                          }}
                        >
                          <div className="truncate max-w-[130px] ml-auto text-[10px] font-normal text-[#94A3B8] uppercase tracking-wider underline decoration-dotted underline-offset-2">{order.customerName}</div>
                          <div className="text-[12px] font-medium text-[#0F172A] mt-0.5">{order.customerPhone}</div>
                          <RtoRiskLine order={order} historyMaps={rtoHistoryMaps} riskResult={riskMap[order._id]} className="mt-0.5" />
                        </div>
                      </div>

                      {/* Actions Row — a single segmented pill: transparent left segment (primary) + neutral right segment (secondary), divided by a hairline */}
                      <div className={`flex items-stretch rounded-full border overflow-hidden ${cancellingIds.has(order._id) ? 'border-rose-200' : 'border-[#E2E8F0]'}`}>
                        {isNewTab ? (
                          <motion.button
                            whileTap={{ scale: 0.94 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                            onClick={() => !cancellingIds.has(order._id) && setShipOrder(order)}
                            disabled={cancellingIds.has(order._id)}
                            className="flex-1 h-9 bg-transparent text-[#00A86B] text-[12.5px] font-bold flex items-center justify-center gap-1.5 transition-colors active:bg-[#F0FDF4] disabled:opacity-50 disabled:pointer-events-none"
                          >
                            Ship <Send className="w-3.5 h-3.5" />
                          </motion.button>
                        ) : (
                          <motion.button
                            whileTap={{ scale: 0.94 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                            onClick={() => !cancellingIds.has(order._id) && navigate(`${isAdminView ? '/admin' : '/user'}/order-tracking?id=${order.orderId}`)}
                            disabled={cancellingIds.has(order._id)}
                            className="flex-1 h-9 bg-transparent text-[#00A86B] text-[12.5px] font-bold flex items-center justify-center gap-1.5 transition-colors active:bg-[#F0FDF4] disabled:opacity-50 disabled:pointer-events-none"
                          >
                            View Details
                          </motion.button>
                        )}
                        <div className={`w-px my-1.5 ${cancellingIds.has(order._id) ? 'bg-rose-200' : 'bg-[#E2E8F0]'}`} />
                        <motion.button
                          whileTap={{ scale: 0.94 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                          onClick={(e) => {
                            if (cancellingIds.has(order._id)) return;
                            e.stopPropagation();
                            if (dropdownPos?.id === order._id) { setDropdownPos(null); return; }
                            const rect = e.currentTarget.getBoundingClientRect();
                            setDropdownPos({ id: order._id, top: rect.bottom + 4, left: rect.right - 176 });
                          }}
                          disabled={cancellingIds.has(order._id)}
                          className={`flex-1 h-9 bg-transparent text-[12.5px] font-bold flex items-center justify-center gap-1.5 transition-colors ${cancellingIds.has(order._id) ? 'text-rose-400 cursor-not-allowed' : dropdownPos?.id === order._id ? 'text-[#0F172A] bg-[#F8FAFC]' : 'text-[#475569] active:bg-[#F8FAFC]'}`}
                        >
                          {cancellingIds.has(order._id)
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <>Actions <motion.span animate={{ rotate: dropdownPos?.id === order._id ? 180 : 0 }} transition={{ type: 'spring', stiffness: 400, damping: 22 }}><ChevronDown className={`w-3.5 h-3.5 ${dropdownPos?.id === order._id ? 'text-[#00A86B]' : 'text-[#94A3B8]'}`} /></motion.span></>
                          }
                        </motion.button>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>

            {/* Mobile Pagination — sibling of the scroll area, not inside it, so it stays pinned */}
            {<MobilePaginationBar {...({
              page,
              setPage,
              totalPages,
              rowsPerPage,
              setRowsPerPage,
              startIndex: Math.min((page - 1) * rowsPerPage + 1, totalRecords),
              endIndex: Math.min(page * rowsPerPage, totalRecords),
              totalItems: totalRecords,
            })} />}
          </div>
        )}

        {/* ── Mobile Filters Bottom Sheet (Orders tabs only — Pickup & Manifest renders its own) ── */}
        <AnimatePresence>
          {!isPMTab && isMobileFiltersOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[140] md:hidden flex items-end justify-center"
              onClick={() => setIsMobileFiltersOpen(false)}
            >
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
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
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Date Range</label>
                    <GlassDateFilter
                      className="w-full [&_.glass-dropdown-trigger]:!w-full [&_.glass-dropdown-trigger]:!h-11 [&_.glass-dropdown-trigger]:!min-w-0 [&_.glass-dropdown-trigger]:!rounded-full"
                      startDate={dateStart}
                      endDate={dateEnd}
                      onDateChange={onOrderDateChange}
                      defaultStart={defStart}
                      defaultEnd={defEnd}
                    />
                  </div>

                  {isAdminView && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Search by name, email, or contact</label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search user..."
                          value={userQuery}
                          onChange={(e) => onUserQueryChange(e.target.value)}
                          className="w-full h-11 px-4 rounded-full border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B]"
                        />
                        {userMongoId && (
                          <button onClick={clearUserFilter} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-red-500">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        {userSuggestions.length > 0 && !userMongoId && (
                          <div className="absolute left-0 top-full mt-1 bg-white border border-[#E2E8F0] rounded-xl shadow-xl z-50 w-full max-h-52 overflow-y-auto py-1">
                            {userSuggestions.map((u: any) => (
                              <button key={u._id} type="button"
                                onClick={() => selectUserSuggestion(u)}
                                className="w-full text-left px-3 py-2.5 hover:bg-[#F0FDF4] flex items-start gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="text-[12px] font-bold text-slate-800 truncate">{u.fullname}</div>
                                  <div className="text-[11px] text-slate-400 truncate">{u.email} · {u.phoneNumber}</div>
                                </div>
                                <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">{u.userId}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {!isAdminView && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Order Id</label>
                      <input
                        type="text"
                        placeholder="Order Id"
                        value={orderId}
                        onChange={(e) => setOrderId(e.target.value)}
                        className="w-full h-11 px-4 rounded-full border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B]"
                      />
                    </div>
                  )}

                  {!isAdminView && !isNewTab && !isPMTab && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">AWB Number</label>
                      <input
                        type="text"
                        placeholder="Search by AWB..."
                        value={awbNumber}
                        onChange={(e) => setAwbNumber(e.target.value)}
                        className="w-full h-11 px-4 rounded-full border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B]"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Payment Type</label>
                    <select
                      value={selectedPaymentTypes[0] || ''}
                      onChange={(e) => setSelectedPaymentTypes(e.target.value ? [e.target.value] : [])}
                      className="w-full h-11 px-3 rounded-full border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B] bg-white"
                    >
                      <option value="">All Payment Types</option>
                      {PAYMENT_TYPE_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Pickup Address</label>
                    <select
                      value={selectedPickupAddresses[0] || ''}
                      onChange={(e) => setSelectedPickupAddresses(e.target.value ? [e.target.value] : [])}
                      className="w-full h-11 px-3 rounded-full border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B] bg-white"
                    >
                      <option value="">All Pickup Addresses</option>
                      {pickupOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {!isNewTab && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Courier Service</label>
                      <select
                        value={selectedCouriers[0] || ''}
                        onChange={(e) => setSelectedCouriers(e.target.value ? [e.target.value] : [])}
                        className="w-full h-11 px-3 rounded-full border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B] bg-white"
                      >
                        <option value="">All Couriers</option>
                        {courierOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  )}
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

        {/* ── Mobile Toast ── */}
        <AnimatePresence>
          {mobileToast && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className={`md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-4 py-2.5 rounded-xl shadow-xl text-xs font-bold text-white ${mobileToast.type === 'success' ? 'bg-[#0F172A]' : 'bg-red-600'}`}
            >
              {mobileToast.text}
            </motion.div>
          )}
        </AnimatePresence>

        <Toast toast={toast} onClose={closeToast} />

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

        {/* ── Update Package Details Modal ── */}
        {showPackageModal && createPortal(
          <div className="fixed inset-0 z-[300] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => !packageSaving && setShowPackageModal(false)} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-[15px] font-bold text-[#0F172A]">Update Package Details</h3>
                <button onClick={() => !packageSaving && setShowPackageModal(false)} className="w-7 h-7 rounded-full flex items-center justify-center text-[#94A3B8] hover:bg-[#F8FAFC]"><X className="w-4 h-4" /></button>
              </div>
              <p className="text-[12px] text-[#64748B] mb-4">{selectedOrders.length} order(s) selected — new dimensions will apply to all.</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Dead Weight (kg)</label>
                  <input type="number" min="0" step="0.01" placeholder="e.g. 0.5" value={packageForm.weight} onChange={e => setPackageForm(f => ({ ...f, weight: e.target.value }))} className="w-full h-10 px-3 rounded-xl border border-[#E2E8F0] text-sm text-[#0F172A] focus:outline-none focus:border-[#00A86B]" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['length', 'width', 'height'] as const).map(dim => (
                    <div key={dim}>
                      <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">{dim} (cm)</label>
                      <input type="number" min="0" step="0.1" placeholder="0" value={packageForm[dim]} onChange={e => setPackageForm(f => ({ ...f, [dim]: e.target.value }))} className="w-full h-10 px-3 rounded-xl border border-[#E2E8F0] text-sm text-[#0F172A] focus:outline-none focus:border-[#00A86B]" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowPackageModal(false)} className="flex-1 h-10 rounded-xl border border-[#E2E8F0] text-[#475569] text-sm font-semibold hover:bg-[#F8FAFC]">Cancel</button>
                <button onClick={handleUpdatePackageDetails} disabled={packageSaving || !packageForm.weight || !packageForm.length || !packageForm.width || !packageForm.height}
                  className="flex-1 h-10 rounded-xl bg-[#00A86B] text-white text-sm font-bold hover:bg-[#009B63] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  {packageSaving ? 'Saving…' : 'Update'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* ── Update Pickup Address Modal ── */}
        {showPickupModal && createPortal(
          <div className="fixed inset-0 z-[300] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => !pickupSaving && setShowPickupModal(false)} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[15px] font-bold text-[#0F172A]">Update Pickup Address</h3>
                <button onClick={() => !pickupSaving && setShowPickupModal(false)} className="w-7 h-7 rounded-full flex items-center justify-center text-[#94A3B8] hover:bg-[#F8FAFC]"><X className="w-4 h-4" /></button>
              </div>
              <p className="text-[12px] text-[#64748B] mb-4">{selectedOrders.length} order(s) selected — select a pickup address to apply to all.</p>
              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {pickupList.length === 0 ? (
                  <p className="text-[13px] text-[#94A3B8] text-center py-6">No saved pickup addresses found.</p>
                ) : pickupList.map((addr: any) => {
                  const pa = addr.pickupAddress || {};
                  return (
                    <label key={addr._id} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${selectedPickupAddr?._id === addr._id ? 'border-[#00A86B] bg-[#F0FDF9]' : 'border-[#E2E8F0] hover:bg-[#F8FAFC]'}`}>
                      <input type="radio" name="pickupAddr" checked={selectedPickupAddr?._id === addr._id} onChange={() => setSelectedPickupAddr(addr)} className="mt-0.5 accent-[#00A86B]" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-bold text-[#0F172A]">{pa.contactName}</span>
                          {addr.isPrimary && <span className="text-[10px] font-bold text-[#00A86B] bg-[#F0FDF9] border border-[#00A86B]/20 px-1.5 py-0.5 rounded-full">Primary</span>}
                        </div>
                        <div className="text-[11px] text-[#64748B] mt-0.5">{pa.address}, {pa.city}, {pa.state} – {pa.pinCode}</div>
                        <div className="text-[11px] text-[#64748B]">{pa.phoneNumber}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowPickupModal(false)} className="flex-1 h-10 rounded-xl border border-[#E2E8F0] text-[#475569] text-sm font-semibold hover:bg-[#F8FAFC]">Cancel</button>
                <button onClick={handleUpdatePickupAddress} disabled={pickupSaving || !selectedPickupAddr}
                  className="flex-1 h-10 rounded-xl bg-[#00A86B] text-white text-sm font-bold hover:bg-[#009B63] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  {pickupSaving ? 'Saving…' : 'Update'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* ── Order Detail Drawer ── */}
        {drawerOrder && (
          <div className="fixed inset-0 z-[100] flex">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setDrawerOrder(null)} />
            <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl overflow-y-auto">
              <div className="sticky top-0 bg-white z-10 p-6 border-b border-[#E2E8F0] flex justify-between items-center">
                <div>
                  <h3 className="text-[14px] leading-[20px] font-semibold text-[#0F172A]">Order #{drawerOrder.orderId}</h3>
                  <span className={getStatusBadgeClass(drawerOrder.status) + ' mt-1 inline-block'}>{drawerOrder.status}</span>
                </div>
                <button onClick={() => setDrawerOrder(null)} className="w-8 h-8 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-[#F8FAFC]">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                {isAdminView && (
                  <div>
                    <h4 className="text-[10px] leading-4 font-semibold text-[#64748B] uppercase tracking-wide mb-3">Seller Details</h4>
                    <div className="bg-[#F8FAFC] rounded-xl p-4 space-y-2">
                      <div className="flex justify-between"><span className="text-[12px] leading-[18px] font-medium text-[#64748B]">Name</span><span className="text-[12px] leading-[18px] font-normal text-[#0F172A]">{drawerOrder.userName}</span></div>
                      <div className="flex justify-between"><span className="text-[12px] leading-[18px] font-medium text-[#64748B]">Email</span><span className="text-[12px] leading-[18px] font-normal text-[#0F172A]">{drawerOrder.userEmail}</span></div>
                    </div>
                  </div>
                )}
                <div>
                  <h4 className="text-[10px] leading-4 font-semibold text-[#64748B] uppercase tracking-wide mb-3">Customer Details</h4>
                  <div className="bg-[#F8FAFC] rounded-xl p-4 space-y-2">
                    <div className="flex justify-between"><span className="text-[12px] leading-[18px] font-medium text-[#64748B]">Name</span><span className="text-[12px] leading-[18px] font-normal text-[#0F172A]">{drawerOrder.customerName}</span></div>
                    <div className="flex justify-between"><span className="text-[12px] leading-[18px] font-medium text-[#64748B]">Phone</span><span className="text-[12px] leading-[18px] font-normal text-[#0F172A]">{drawerOrder.customerPhone}</span></div>
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] leading-4 font-semibold text-[#64748B] uppercase tracking-wide mb-3">Shipment Details</h4>
                  <div className="bg-[#F8FAFC] rounded-xl p-4 space-y-2">
                    <div className="flex justify-between"><span className="text-[12px] leading-[18px] font-medium text-[#64748B]">Pickup</span><span className="text-[12px] leading-[18px] font-normal text-[#0F172A]">{drawerOrder.pickupName}</span></div>
                    {drawerOrder.awb && <div className="flex justify-between"><span className="text-[12px] leading-[18px] font-medium text-[#64748B]">AWB</span><span className="text-[12px] leading-[18px] font-normal text-[#00A86B]">{drawerOrder.awb}</span></div>}
                    {drawerOrder.courier && <div className="flex justify-between"><span className="text-[12px] leading-[18px] font-medium text-[#64748B]">Courier</span><span className="text-[12px] leading-[18px] font-normal text-[#00A86B]">{drawerOrder.courier}</span></div>}
                    <div className="flex justify-between"><span className="text-[12px] leading-[18px] font-medium text-[#64748B]">Date</span><span className="text-[12px] leading-[18px] font-normal text-[#0F172A]">{drawerOrder.date}</span></div>
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] leading-4 font-semibold text-[#64748B] uppercase tracking-wide mb-3">Product</h4>
                  <div className="border border-[#E2E8F0] rounded-xl p-3 flex gap-3 items-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[14px] leading-[20px] font-semibold text-[#0F172A]">{drawerOrder.productName}</div>
                      <div className="text-[12px] leading-[18px] font-normal text-[#64748B]">SKU: {drawerOrder.sku} | Qty: {drawerOrder.qty}</div>
                      <div className="text-[12px] leading-[18px] font-normal text-[#64748B]">{drawerOrder.weight} | {drawerOrder.dimensions}</div>
                    </div>
                    <div className="text-[14px] leading-[20px] font-semibold text-[#0F172A]">&#8377;{drawerOrder.payment}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Ship Order Modal ── */}
        {shipOrder && (
          <ShipOrderModal
            order={shipOrder}
            onClose={() => setShipOrder(null)}
            onShipped={() => { showToast('success', 'Shipment created successfully'); fetchOrders(page); }}
          />
        )}


        {/* ── Shared backdrop — closes pickup/customer tooltips on outside tap (mobile only, where they're click-triggered).
             The product tooltip closes itself via a document pointerdown listener in useProductTooltip. ── */}
        {(hoveredPickup || hoveredCustomer) && createPortal(
          <div
            className="fixed inset-0 z-[997] md:hidden"
            onClick={() => { setHoveredPickup(null); setHoveredCustomer(null); }}
          />,
          document.body
        )}

        {/* ── Pickup Tooltip — portaled to document.body so it isn't clipped by the page root's
             overflow-hidden (active on the user side), which was causing it to flicker/disappear ── */}
        {hoveredPickup && (() => {
          // Flip below the trigger when there isn't enough room above to show the full tooltip without clipping.
          const showBelow = hoveredPickup.rect.top < 260;
          return createPortal(
            <div className="fixed z-[9999] pointer-events-none bg-[#0F172A] text-white text-xs p-3 rounded-xl shadow-xl w-64"
              style={{
                top: showBelow ? hoveredPickup.rect.bottom + 10 : hoveredPickup.rect.top - 10,
                left: Math.min(Math.max(hoveredPickup.rect.left + hoveredPickup.rect.width / 2, 140), window.innerWidth - 140),
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
            </div>,
            document.body
          );
        })()}

        {/* ── Customer Tooltip — also portaled for the same reason ── */}
        {hoveredCustomer && (() => {
          // Flip below the trigger when there isn't enough room above to show the full tooltip without clipping.
          const showBelow = hoveredCustomer.rect.top < 260;
          return createPortal(
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
            </div>,
            document.body
          );
        })()}

        {/* ── Repeat Customer "Customer Profile" popover — click-triggered, portaled,
             opens on the same page, closes on outside click. ── */}
        {repeatCustomerPopover && (() => {
          const repeat = repeatCustomerMap[repeatCustomerPopover.key];
          if (!repeat) return null;
          const rect = repeatCustomerPopover.rect;
          const showBelow = rect.top < 340;
          const lastOrderDate = repeat.lastOrderDate
            ? new Date(repeat.lastOrderDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
            : '—';
          const POPOVER_WIDTH = 272;
          return createPortal(
            <>
              <div className="fixed inset-0 z-[9998]" onClick={() => setRepeatCustomerPopover(null)} />
              <div className="fixed z-[9999] bg-white rounded-2xl shadow-[0_16px_40px_-8px_rgba(15,23,42,0.2)] border border-[#E2E8F0]"
                style={{
                  width: POPOVER_WIDTH,
                  top: showBelow ? rect.bottom + 8 : undefined,
                  bottom: showBelow ? undefined : window.innerHeight - rect.top + 8,
                  left: Math.min(Math.max(rect.left, 12), window.innerWidth - POPOVER_WIDTH - 12),
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4">
                  <h4 className="text-[14px] font-bold text-[#0F172A] mb-3">Customer Profile</h4>

                  <div className="flex items-center justify-between px-3 py-2.5 bg-[#F8FAFC] rounded-xl mb-3">
                    <span className="text-[12px] font-medium text-[#64748B]">Last Order Date:</span>
                    <span className="text-[12px] font-bold text-[#0F172A]">{lastOrderDate}</span>
                  </div>

                  <div className="px-3 py-2.5 bg-[#F8FAFC] rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-bold text-[#0F172A]">Total Orders:</span>
                      <span className="text-[12px] font-bold text-[#0F172A]">{repeat.totalOrders}</span>
                    </div>
                    <div className="h-px bg-[#E2E8F0]" />
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-medium text-[#64748B]">Delivered:</span>
                      <span className="text-[12px] font-bold text-[#0F172A]">{repeat.delivered}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-medium text-[#64748B]">Cancelled:</span>
                      <span className="text-[12px] font-bold text-[#0F172A]">{repeat.cancelled}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-medium text-[#64748B]">RTO:</span>
                      <span className="text-[12px] font-bold text-[#0F172A]">{repeat.rto}</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-[#94A3B8] mt-3">This data is for last 6 months only</p>

                  <div className="flex justify-end mt-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#EEF2FF] text-[#4F46E5] text-[10px] font-semibold tracking-wide">
                      <UserCheck className="w-3 h-3" /> REPEAT CUSTOMER
                    </span>
                  </div>
                </div>
              </div>
            </>,
            document.body
          );
        })()}
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

      {/* ── Product line-item hover card — shared component/hook, matches CRM listing's style ── */}
      <ProductTooltipCard
        productHoverPos={productHoverPos}
        order={orders.find(o => o._id === productHoverPos?.id)}
      />
    </AdminLayout>
  );
}
