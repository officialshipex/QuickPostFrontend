import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../../services/apiClient';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { getCourierLogo } from '../../utils/courierLogo';
import { useAdminTab } from '../../context/AdminUserContext';
import { useUserSearchFilter } from '../../hooks/filters/useUserSearchFilter';
import {
  ChevronDown, ChevronRight, RefreshCcw, Check, User, Truck, Banknote, Clock, Upload, Download,
  Wallet, Send, MinusCircle, MoreVertical, FileText, AlertCircle, CheckCircle2, X, Package, Search, Filter, Copy
} from 'lucide-react';
import { GlassDropdown } from '../../components/ui/GlassDropdown';
import { GlassDateFilter } from '../../components/ui/GlassDateFilter';
import { useDateRangeFilter } from '../../hooks/filters/useDateRangeFilter';
import { TruncatedText } from '../../components/ui/TruncatedText';
import { TableLoader } from '../../components/ui/TableLoader';
import { EmptyState } from '../../components/ui/EmptyState';
import { TransferCODModal } from '../../components/ui/TransferCODModal';
import { SharedUploadModal } from '../../components/ui/SharedUploadModal';
import { Toast } from '../../components/ui/Toast';
import { useToast } from '../../hooks/useToast';
import { useTableLoader } from '../../hooks/useTableLoader';
import { usePagination, DesktopPagination } from '../../hooks/usePagination';
import { MobilePaginationBar } from '../../hooks/useMobilePaginationBar';

const ADMIN_TABS = [
  { name: 'All COD Orders' },
  { name: 'Seller COD Remittance' },
  { name: 'Courier COD Remittance' },
];

const USER_TABS = [
  { name: 'COD Remittance' },
];

const TAB_SLUG_MAP: Record<string, string> = {
  'All COD Orders':       'all-cod-orders',
  'Seller COD Remittance':'seller-cod-remittance',
  'Courier COD Remittance':'courier-cod-remittance',
};

const SLUG_TO_TAB: Record<string, string> = {
  'all-cod-orders':          'All COD Orders',
  'seller-cod-remittance':   'Seller COD Remittance',
  'courier-cod-remittance':  'Courier COD Remittance',
};

// Data mapping helpers â€" field names must match exact API response keys
const mapCodOrder = (item: any) => ({
  id: String(item._id || item.orderID || ''),
  orderID: String(item.orderID || ''),
  awb: item.AWB_Number || '',          // model field is AWB_Number (not AwbNumber)
  userId: item.userId || '',
  userName: item.userName || '',
  userEmail: item.Email || '',
  date: (item.Date || item.createdAt || item.orderDate)
    ? new Date(item.Date || item.createdAt || item.orderDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'N/A',
  rawDate: item.Date || item.createdAt || item.orderDate || '',
  courier: item.courierProvider || '',
  codAmount: parseFloat(item.CODAmount) || 0,
  status: item.status || 'Pending',
});

const mapSellerRemittance = (item: any) => ({
  id: String(item._id || ''),
  awb: String(item.remittanceId || ''),   // awb field holds remittanceId for selection
  userId: item.user?.userId || item.userId || '',
  userName: item.user?.name || '',
  userEmail: item.user?.email || '',
  date: (() => {
    const raw = item.date;
    if (!raw) return 'N/A';
    const d = new Date(raw);
    if (isNaN(d.getTime())) return 'N/A';
    const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  })(),
  paymentMethod: item.remittanceMethod || 'N/A',
  utr: item.utr ? String(item.utr) : 'N/A',
  totalCodAmount: (Number(item.codAvailable) || 0) + (Number(item.adjustedAmount) || 0),
  creditedAmount: item.amountCreditedToWallet || 0,
  adjustedAmount: item.adjustedAmount || 0,
  earlyCodCharges: item.earlyCodCharges || 0,
  remittanceAmount: item.remittanceInitiated || 0,
  status: item.status || 'Pending',
});

const mapCourierRemittance = (item: any) => ({
  id: String(item._id || item.orderID || ''),
  orderID: String(item.orderID || ''),
  awb: item.AwbNumber || '',            // courier model field is AwbNumber
  userId: item.userId || '',
  userName: item.userName || '',
  userEmail: item.Email || '',
  date: item.date
    ? new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'N/A',
  courierName: item.courierServiceName || '',
  codAmount: parseFloat(item.CODAmount) || 0,
  status: item.status || 'Pending',
});

const STATUS_BADGE_STYLES: Record<string, string> = {
  'Pending': 'bg-amber-50 text-amber-700 border-amber-200',
  'Paid': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Success': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Remitted': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Failed': 'bg-rose-50 text-rose-700 border-rose-200',
};

const getStatusBadgeClass = (status: string) => {
  const normalized = status || '';
  return `${STATUS_BADGE_STYLES[normalized] || 'bg-blue-50 text-blue-700 border-blue-200'} px-2.5 py-0.5 rounded-full border text-[10px] leading-4 font-semibold uppercase tracking-wider whitespace-nowrap shadow-sm`;
};

const fmtCurrency = (n: any) =>
  `₹${(Number(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

const toISOStart = (d: string) => d ? d + 'T00:00:00.000Z' : '';
const toISOEnd = (d: string) => d ? d + 'T23:59:59.999Z' : '';

const withOrdinalSuffix = (dateStr: string) => {
  const match = dateStr.match(/^(\d{1,2})(\s.+)$/);
  if (!match) return dateStr;
  const day = parseInt(match[1], 10);
  const suffix = (day % 10 === 1 && day !== 11) ? 'st'
    : (day % 10 === 2 && day !== 12) ? 'nd'
    : (day % 10 === 3 && day !== 13) ? 'rd' : 'th';
  return `${day}${suffix}${match[2]}`;
};

// "Created At: 13th Apr 2026 | 12hr:60min:09sec" — elapsed time since order creation, live-formatted on each render.
const formatCreatedAt = (rawDate: string) => {
  if (!rawDate) return 'N/A';
  const created = new Date(rawDate);
  if (isNaN(created.getTime())) return 'N/A';
  const datePart = withOrdinalSuffix(created.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }));
  const elapsedMs = Math.max(0, Date.now() - created.getTime());
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${datePart} | ${hours}hr:${minutes}min:${seconds}sec`;
};

// ─── Early COD Plan Modal (user self-service) ────────────────────────────────
const EARLY_COD_PLANS = [
  { name: 'D+2', amount: 0.99, label: 'D + 2 Days' },
  { name: 'D+3', amount: 0.69, label: 'D + 3 Days' },
  { name: 'D+4', amount: 0.49, label: 'D + 4 Days' },
];
function EarlyCODPlanModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [currentPlan, setCurrentPlan] = useState('');
  const [activating, setActivating] = useState('');
  const { toast: _t, showToast, closeToast: _c } = useToast();

  useEffect(() => {
    if (!userId) return;
    apiClient.get('/cod/CheckCodplan', { params: { id: userId } })
      .then(res => setCurrentPlan(String(res.data.codplaneName || '')))
      .catch(() => {});
  }, [userId]);

  const handleActivate = async (planName: string, codAmount: number) => {
    setActivating(planName);
    try {
      await apiClient.post('/cod/codPlanUpdate', { planName, codAmount }, { params: { id: userId } });
      showToast('success', `${planName} plan activated!`);
      setCurrentPlan(planName);
    } catch {
      showToast('error', 'Failed to activate plan');
    } finally {
      setActivating('');
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <Toast toast={_t} onClose={_c} />
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
          <span className="text-[15px] font-bold text-[#0F172A]">Early COD</span>
          <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center text-[#94A3B8] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* Plans */}
        <div className="px-5 py-4 flex flex-col gap-3">
          <p className="text-[12px] text-[#64748B]">Select your COD remittance cycle. Charges apply as a percentage of COD amount.</p>
          <div className="grid grid-cols-3 gap-2">
            {EARLY_COD_PLANS.map(plan => {
              const isActive = currentPlan === plan.name;
              return (
                <div key={plan.name} className={`p-3 rounded-[10px] border flex flex-col gap-1.5 ${isActive ? 'border-[#00A86B] bg-[#ECFDF5]' : 'border-[#E2E8F0] bg-white'}`}>
                  {plan.name === 'D+2' && <span className="text-[9px] font-bold bg-amber-400 text-white px-1.5 py-0.5 rounded w-fit">BEST</span>}
                  <p className="text-[12px] font-semibold text-[#0F172A]">{plan.label}</p>
                  <p className="text-[11px] text-[#64748B]">{plan.amount}% of COD</p>
                  <button
                    onClick={() => !isActive && handleActivate(plan.name, plan.amount)}
                    disabled={isActive || !!activating}
                    className={`w-full py-1.5 rounded-[6px] text-[11px] font-semibold transition-colors ${isActive ? 'bg-[#E2E8F0] text-[#94A3B8] cursor-default' : 'bg-[#00A86B] text-white hover:bg-[#008F5C] disabled:opacity-50'}`}
                  >
                    {activating === plan.name ? 'Activating…' : isActive ? 'Active' : 'Activate'}
                  </button>
                </div>
              );
            })}
          </div>
          <button onClick={onClose} className="w-full py-2 text-[12px] font-semibold text-[#64748B] rounded-[8px] border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors mt-1">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminCOD() {
  const navigate = useNavigate();
  const location = useLocation();
  const { tabSlug } = useParams<{ tabSlug?: string }>();
  const { isAdmin, adminTab, loadingAdminTab, currentUserId } = useAdminTab();
  const isAdminView = isAdmin && adminTab;
  const isUserPanel = location.pathname.startsWith('/user/');
  // AdminLayout adds a 32px impersonation banner (pt-8) above the page when an
  // admin is impersonating a user — the page height calc must account for it too,
  // otherwise the extra 32px overflows the viewport and the whole page scrolls.
  const isImpersonating = !!localStorage.getItem('admin_token_backup');
  const MAIN_TABS = isAdminView ? ADMIN_TABS : USER_TABS;

  const codBase = isUserPanel ? '/user/cod' : '/admin/cod';

  // Global search from layout
  const [globalSearchQuery, setGlobalSearchQuery] = useState(
    ((window as any).__adminSearchQuery || '').toLowerCase()
  );
  useEffect(() => {
    const handler = (e: Event) => setGlobalSearchQuery(((e as CustomEvent).detail || '').toLowerCase());
    window.addEventListener('admin-search', handler);
    setGlobalSearchQuery(((window as any).__adminSearchQuery || '').toLowerCase());
    return () => window.removeEventListener('admin-search', handler);
  }, []);

  const [activeTab, setActiveTab] = useState(
    () => isUserPanel ? 'COD Remittance' : ((tabSlug && SLUG_TO_TAB[tabSlug]) || 'All COD Orders')
  );

  // Sync tab from URL (browser back/forward, direct link, refresh)
  useEffect(() => {
    if (isUserPanel) { setActiveTab('COD Remittance'); return; }
    const tabFromUrl = (tabSlug && SLUG_TO_TAB[tabSlug]) || 'All COD Orders';
    setActiveTab(prev => (prev === tabFromUrl ? prev : tabFromUrl));
  }, [tabSlug, isUserPanel]);

  const handleTabChange = (tab: string) => {
    setSelectedOrders([]);
    setSelectedCodOrders([]);
    setSelectedCourierCodOrders([]);
    if (isAdminView) {
      navigate(`${codBase}/${TAB_SLUG_MAP[tab] || 'all-cod-orders'}`);
    } else {
      setActiveTab(tab);
    }
  };

  // Broadcast active tab so the header search placeholder can reflect it
  useEffect(() => {
    (window as any).__adminCodTab = activeTab;
    window.dispatchEvent(new CustomEvent('admin-cod-tab-change', { detail: activeTab }));
    return () => { (window as any).__adminCodTab = ''; };
  }, [activeTab]);
  const handleRefresh = () => {
    if (activeTab === 'All COD Orders') fetchCodOrders(currentPage);
    else if (activeTab === 'Seller COD Remittance' || activeTab === 'COD Remittance') fetchSellerRemittance(sellerPage);
    else fetchCourierRemittance(courierPage);
  };

  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const { toast, showToast, closeToast } = useToast();

  const renderCopyable = (text: string, label: string, className: string = "text-xs font-semibold text-[#00A86B] cursor-pointer hover:underline uppercase", onTextClick?: () => void) => (
    <div className="flex items-center gap-1.5 group/copy w-max">
      <div className={className} onClick={(e) => { if (onTextClick) { e.stopPropagation(); onTextClick(); } }}>{text}</div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          navigator.clipboard.writeText(text);
          showToast('success', `${label} copied!`);
        }}
        className="opacity-100 md:opacity-0 md:group-hover/copy:opacity-100 transition-opacity focus:outline-none"
        title={`Copy ${label}`}
      >
        <Copy className="w-3 h-3 text-[#94A3B8] hover:text-[#00A86B]" />
      </button>
    </div>
  );

  const {
    userQuery: codUserQuery, userMongoId: codUserMongoId, userSuggestions: codUserSuggestions,
    setUserQuery: setCodUserQuery, setUserMongoId: setCodUserMongoId, setUserSuggestions: setCodUserSuggestions,
    onQueryChange: onCodUserQueryChange, selectUser: selectCodUserSuggestion, clearUser: clearCodUserFilter,
  } = useUserSearchFilter(isAdminView);
  const [codOrderId, setCodOrderId] = useState('');
  const [codAwb, setCodAwb] = useState('');
  const [codOrdersList, setCodOrdersList] = useState<any[]>([]);
  const [codOrdersTotal, setCodOrdersTotal] = useState(0);
  const [codSummary, setCodSummary] = useState({ totalCODAmount: 0, paidCODAmount: 0, pendingCODAmount: 0 });
  const { dateStart, dateEnd, setDateStart, setDateEnd, onDateChange, defStart, defEnd } = useDateRangeFilter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedCouriers, setSelectedCouriers] = useState<string[]>([]);
  const [codCourierOptions, setCodCourierOptions] = useState<{ label: string; value: string }[]>([]);
  const [showAllCodActionMenu, setShowAllCodActionMenu] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);

  const [remittanceSearchTerm, setRemittanceSearchTerm] = useState('');
  const [selectedUtrs, setSelectedUtrs] = useState<string[]>([]);
  const [selectedCodStatuses, setSelectedCodStatuses] = useState<string[]>([]);
  const { dateStart: codDateStart, dateEnd: codDateEnd, setDateStart: setCodDateStart, setDateEnd: setCodDateEnd, onDateChange: onCodDateChange } = useDateRangeFilter();
  const [selectedCodOrders, setSelectedCodOrders] = useState<string[]>([]);
  const [bankExportLoading, setBankExportLoading] = useState(false);
  const [showBankResponseUpload, setShowBankResponseUpload] = useState(false);
  const [showCourierUpload, setShowCourierUpload] = useState(false);
  const {
    userQuery: sellerUserQuery, userMongoId: sellerUserMongoId, userSuggestions: sellerUserSuggestions,
    setUserQuery: setSellerUserQuery, setUserMongoId: setSellerUserMongoId, setUserSuggestions: setSellerUserSuggestions,
    onQueryChange: onSellerUserQueryChange, selectUser: selectSellerUserSuggestion, clearUser: clearSellerUserFilter,
  } = useUserSearchFilter(isAdminView);
  const [sellerRemittanceList, setSellerRemittanceList] = useState<any[]>([]);
  const [sellerRemittanceTotal, setSellerRemittanceTotal] = useState(0);
  const [sellerSummary, setSellerSummary] = useState({
    CODToBeRemitted: 0, LastCodRemmited: 0, TotalCODRemitted: 0, TotalDeductionfromCOD: 0, RemittanceInitiated: 0
  });
  const [sellerPage, setSellerPage] = useState(1);
  const [sellerRemittanceId, setSellerRemittanceId] = useState('');

  const [remittanceDetailId, setRemittanceDetailId] = useState<string | null>(null);
  const [remittanceDetail, setRemittanceDetail] = useState<any>(null);
  const [remittanceDetailLoading, setRemittanceDetailLoading] = useState(false);

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showEarlyCODModal, setShowEarlyCODModal] = useState(false);
  const [transferUserId, setTransferUserId] = useState('');
  const [transferIds, setTransferIds] = useState<string[]>([]);

  const [courierRemittanceList, setCourierRemittanceList] = useState<any[]>([]);
  const [courierRemittanceTotal, setCourierRemittanceTotal] = useState(0);
  const [courierSummary, setCourierSummary] = useState({ totalCODAmount: 0, paidCODAmount: 0, pendingCODAmount: 0 });
  const [courierPage, setCourierPage] = useState(1);
  const [courierOrderId, setCourierOrderId] = useState('');
  const [courierAwb, setCourierAwb] = useState('');
  const [selectedCourierCodStatuses, setSelectedCourierCodStatuses] = useState<string[]>([]);
  const [courierCourierOptions, setCourierCourierOptions] = useState<{ label: string; value: string }[]>([]);
  const [selectedCourierCouriers, setSelectedCourierCouriers] = useState<string[]>([]);
  const { dateStart: courierCodDateStart, dateEnd: courierCodDateEnd, setDateStart: setCourierCodDateStart, setDateEnd: setCourierCodDateEnd, onDateChange: onCourierCodDateChange } = useDateRangeFilter();
  const [selectedCourierCodOrders, setSelectedCourierCodOrders] = useState<string[]>([]);
  const [showCourierActionMenu, setShowCourierActionMenu] = useState(false);
  const {
    userQuery: courierUserQuery, userMongoId: courierUserMongoId, userSuggestions: courierUserSuggestions,
    setUserQuery: setCourierUserQuery, setUserMongoId: setCourierUserMongoId, setUserSuggestions: setCourierUserSuggestions,
    onQueryChange: onCourierUserQueryChange, selectUser: selectCourierUserSuggestion, clearUser: clearCourierUserFilter,
  } = useUserSearchFilter(isAdminView);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as Element).closest('.action-dropdown-container')) {
        setShowAllCodActionMenu(false);
        setShowActionMenu(false);
        setShowCourierActionMenu(false);
        setShowMobileSellerActionMenu(false);
        setShowMobileCourierActionMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [isMobileSellerFiltersOpen, setIsMobileSellerFiltersOpen] = useState(false);
  const [isMobileCourierFiltersOpen, setIsMobileCourierFiltersOpen] = useState(false);
  const [showMobileSellerActionMenu, setShowMobileSellerActionMenu] = useState(false);
  const [showMobileCourierActionMenu, setShowMobileCourierActionMenu] = useState(false);
  const [showMobileCodStats, setShowMobileCodStats] = useState(false);
  const [showMobileSellerStats, setShowMobileSellerStats] = useState(false);
  const [showMobileCourierStats, setShowMobileCourierStats] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [codRowsPerPage, setCodRowsPerPage] = useState(20);
  const [sellerRowsPerPage, setSellerRowsPerPage] = useState(20);
  const [courierRowsPerPage, setCourierRowsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const STATUS_OPTIONS = [
    { label: 'Pending', value: 'Pending' },
    { label: 'Paid',    value: 'Paid'    }
  ];

  const handleExportData = (type: 'seller' | 'courier', filename: string) => {
    if (type === 'seller' && selectedCodOrders.length === 0) {
      showToast('error', "Please select at least one Seller COD record to export data.");
      return;
    }
    if (type === 'courier' && selectedCourierCodOrders.length === 0) {
      showToast('error', "Please select at least one Courier COD record to export data.");
      return;
    }

    // Simulated export logic
    const content = "AWB,Total_COD,Status\nQPSP000000045,145.99,Pending";
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    setShowActionMenu(false);
    setShowCourierActionMenu(false);
  };

  const handleUploadResponse = (type: 'seller' | 'courier') => {
    if (type === 'seller' && selectedCodOrders.length === 0) {
      showToast('error', "Please select at least one Seller COD record to upload bank response.");
      return;
    }
    if (type === 'courier' && selectedCourierCodOrders.length === 0) {
      showToast('error', "Please select at least one Courier COD record to upload bank response.");
      return;
    }

    // Simulated file input trigger
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv, .xlsx';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        showToast('success', `Successfully uploaded ${file.name}`);
        setShowActionMenu(false);
        setShowCourierActionMenu(false);
      }
    };
    input.click();
  };

  const fetchCodOrders = useCallback(async (page: number) => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = { page, limit: codRowsPerPage };
      if (isAdminView && codUserMongoId) {
        params.selectedUserId = codUserMongoId;
        params.userSearch = codUserMongoId;
        params.userId = codUserMongoId;
      }
      if (codOrderId) params.orderID = codOrderId;
      if (codAwb) params.awbNumber = codAwb;
      if (dateStart) params.startDate = toISOStart(dateStart);
      if (dateEnd) params.endDate = toISOEnd(dateEnd);
      if (selectedStatuses.length === 1) params.statusFilter = selectedStatuses[0];
      if (selectedCouriers.length > 0) params.courierProvider = selectedCouriers.join(',');
      const res = await apiClient.get('/cod/CodRemittanceOrder', { params });
      const orders = res.data.data?.orders || [];
      setCodOrdersList(orders.map(mapCodOrder));
      setCodOrdersTotal(res.data.totalPages ? res.data.totalPages * codRowsPerPage : (res.data.total || 0));
      setCodSummary({
        totalCODAmount: res.data.data?.totalCODAmount || 0,
        paidCODAmount: res.data.data?.paidCODAmount || 0,
        pendingCODAmount: res.data.data?.pendingCODAmount || 0,
      });
      if (orders.length > 0) {
        const couriers = Array.from(new Set(orders.map((o: any) => o.courierProvider).filter(Boolean))) as string[];
        setCodCourierOptions(prev => {
          const existing = prev.map((p: any) => p.value);
          const newOnes = couriers.filter(c => !existing.includes(c)).map(c => ({ label: c, value: c }));
          return [...prev, ...newOnes];
        });
      }
    } catch {
      showToast('error', 'Failed to load COD orders.');
    } finally {
      setIsLoading(false);
    }
  }, [codUserMongoId, codOrderId, codAwb, dateStart, dateEnd, selectedStatuses, selectedCouriers, isAdminView, codRowsPerPage]);

  const fetchSellerRemittance = useCallback(async (page: number) => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = { page, limit: sellerRowsPerPage };
      if (isAdminView && sellerUserMongoId) params.selectedUserId = sellerUserMongoId;
      if (sellerRemittanceId) params.remittanceIdFilter = sellerRemittanceId;
      if (codDateStart) params.startDate = toISOStart(codDateStart);
      if (codDateEnd) params.endDate = toISOEnd(codDateEnd);
      if (selectedCodStatuses.length === 1) params.statusFilter = selectedCodStatuses[0];
      const endpoint = isAdminView ? '/cod/getAdminCodRemitanceData' : '/cod/getUserCodRemittanceData';
      const res = await apiClient.get(endpoint, { params });
      setSellerRemittanceList((res.data.results || []).map(mapSellerRemittance));
      setSellerRemittanceTotal(res.data.totalPages ? res.data.totalPages * sellerRowsPerPage : (res.data.total || 0));
      if (res.data.summary) {
        setSellerSummary({
          CODToBeRemitted: res.data.summary.CODToBeRemitted || 0,
          LastCodRemmited: res.data.summary.LastCODRemitted || 0,
          TotalCODRemitted: res.data.summary.TotalCODRemitted || 0,
          TotalDeductionfromCOD: res.data.summary.TotalDeductionfromCOD || 0,
          RemittanceInitiated: res.data.summary.RemittanceInitiated || 0,
        });
      }
    } catch {
      showToast('error', 'Failed to load seller remittance data.');
    } finally {
      setIsLoading(false);
    }
  }, [sellerUserMongoId, sellerRemittanceId, codDateStart, codDateEnd, selectedCodStatuses, isAdminView, currentUserId, sellerRowsPerPage]);

  const fetchCourierRemittance = useCallback(async (page: number) => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = { page, limit: courierRowsPerPage };
      if (isAdminView && courierUserMongoId) { params.selectedUserId = courierUserMongoId; params.userSearch = courierUserMongoId; params.userId = courierUserMongoId; }
      if (courierOrderId) params.orderID = courierOrderId;
      if (courierAwb) params.awbNumber = courierAwb;
      if (courierCodDateStart) params.startDate = toISOStart(courierCodDateStart);
      if (courierCodDateEnd) params.endDate = toISOEnd(courierCodDateEnd);
      if (selectedCourierCodStatuses.length === 1) params.statusFilter = selectedCourierCodStatuses[0];
      if (selectedCourierCouriers.length > 0) params.courierProvider = selectedCourierCouriers.join(',');
      const res = await apiClient.get('/cod/courierCodRemittance', { params });
      const orders = res.data.data?.orders || [];
      setCourierRemittanceList(orders.map(mapCourierRemittance));
      setCourierRemittanceTotal(res.data.totalPages ? res.data.totalPages * courierRowsPerPage : (res.data.total || 0));
      setCourierSummary({
        totalCODAmount: res.data.data?.totalCODAmount || 0,
        paidCODAmount: res.data.data?.paidCODAmount || 0,
        pendingCODAmount: res.data.data?.pendingCODAmount || 0,
      });
      if (orders.length > 0) {
        const couriers = Array.from(new Set(orders.map((o: any) => o.courierServiceName).filter(Boolean))) as string[];
        setCourierCourierOptions(prev => {
          const existing = prev.map(p => p.value);
          const newOnes = couriers.filter(c => !existing.includes(c)).map(c => ({ label: c, value: c }));
          return [...prev, ...newOnes];
        });
      }
    } catch {
      showToast('error', 'Failed to load courier remittance data.');
    } finally {
      setIsLoading(false);
    }
  }, [courierUserMongoId, courierOrderId, courierAwb, courierCodDateStart, courierCodDateEnd, selectedCourierCodStatuses, selectedCourierCouriers, isAdminView, courierRowsPerPage]);

  // Tab change: reset page to 1 and fetch active tab.
  // Guard on loadingAdminTab so we don't fetch with stale isAdminView on first render.
  useEffect(() => {
    if (loadingAdminTab) return;
    setCurrentPage(1); setSellerPage(1); setCourierPage(1);
    switch (activeTab) {
      case 'All COD Orders': fetchCodOrders(1); break;
      case 'Seller COD Remittance':
      case 'COD Remittance': fetchSellerRemittance(1); break;
      case 'Courier COD Remittance': fetchCourierRemittance(1); break;
    }
  }, [activeTab, loadingAdminTab, refreshTrigger]);

  // Effects for rows per page change
  useEffect(() => {
    if (!loadingAdminTab && activeTab === 'All COD Orders') {
      setCurrentPage(1); fetchCodOrders(1);
    }
  }, [codRowsPerPage]);

  useEffect(() => {
    if (!loadingAdminTab && (activeTab === 'Seller COD Remittance' || activeTab === 'COD Remittance')) {
      setSellerPage(1); fetchSellerRemittance(1);
    }
  }, [sellerRowsPerPage]);

  useEffect(() => {
    if (!loadingAdminTab && activeTab === 'Courier COD Remittance') {
      setCourierPage(1); fetchCourierRemittance(1);
    }
  }, [courierRowsPerPage]);

  // When the browser restores this page from bfcache (e.g. clicking an AWB to
  // /admin/tracking, then pressing Back), React never remounts and stale
  // selection/data from before navigation is left showing. Clear selections
  // and refetch the active tab's data so it isn't "saved"/stale after Back.
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return;
      setSelectedOrders([]);
      setSelectedCodOrders([]);
      setSelectedCourierCodOrders([]);
      // Reset to default tab on bfcache restore
      setActiveTab('All COD Orders');
      fetchCodOrders(currentPage);
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [currentPage, fetchCodOrders]);

  // User search debounce — handled per-tab by useUserSearchFilter

  // Export data (All COD / Courier)
  const handleExportCsv = (rows: any[], filename: string) => {
    if (rows.length === 0) { showToast('error', 'Select rows to export.'); return; }
    const keys = Object.keys(rows[0]);
    const csv = [keys.join(','), ...rows.map(r => keys.map(k => `"${r[k] ?? ''}"`).join(','))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = filename;
    a.click();
    setShowActionMenu(false); setShowCourierActionMenu(false);
  };

  // Export Bank Template â€" calls /cod/exportBankTemplate with selected remittance IDs
  const handleExportBankTemplate = async () => {
    if (selectedCodOrders.length === 0) { showToast('error', 'Select remittances to export bank template.'); return; }
    setBankExportLoading(true);
    try {
      const params = new URLSearchParams();
      selectedCodOrders.forEach(id => params.append('selectedRemittanceIds', id));
      const res = await apiClient.get(`/cod/exportBankTemplate?${params.toString()}`);
      const rows = res.data.rows || [];
      if (!rows.length) { showToast('error', 'No payable remittances to export.'); return; }
      const HEADERS = ['Debit Account Number', 'Payment mode', 'Amount', 'Beneficiary Name', 'Beneficiary Account', 'Beneficiary Bank IFSC', 'Remarks', 'Beneficiary LEI'];
      const csv = [HEADERS.join(','), ...rows.map((r: any) => HEADERS.map(h => `"${r[h] ?? ''}"`).join(','))].join('\n');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
      a.download = `bank_payment_template_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      showToast('success', `Bank template exported: ${rows.length} record(s)`);
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Failed to export bank template');
    } finally {
      setBankExportLoading(false); setShowActionMenu(false);
    }
  };

  // Validate + open bank response upload
  const handleOpenBankResponseUpload = async () => {
    if (selectedCodOrders.length === 0) { showToast('error', 'Select remittances first.'); return; }
    try {
      const res = await apiClient.post('/cod/validateExportedStatus', { selectedRemittanceIds: selectedCodOrders });
      if (res.data?.success) { setShowBankResponseUpload(true); setShowActionMenu(false); }
      else showToast('error', res.data?.message || 'Some remittances not exported yet. Export bank template first.');
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Failed to validate remittances');
    }
  };

  // Parse and submit bank response Excel
  const handleCODUpload = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const text = new TextDecoder().decode(e.target?.result as ArrayBuffer);
          const lines = text.trim().split('\n');
          const headers = lines[0].split(',').map((h: string) => h.replace(/"/g, '').trim());
          const rows = lines.slice(1).map((line: string) => {
            const vals = line.split(',').map((v: string) => v.replace(/"/g, '').trim());
            return Object.fromEntries(headers.map((h: string, i: number) => [h, vals[i] ?? '']));
          });
          const mappedRows = rows.map((r: any) => ({
            remarks: r['Remarks'] || '',
            referenceNumber: r['Reference Number'] || '',
            utrNumber: r['UTR Number'] || r['UTR'] || '',
            beneficiaryName: r['Beneficiary Name'] || '',
            beneficiaryAccount: r['Beneficiary Account'] || '',
            amount: Number(r['Amount'] || 0),
            status: r['Status'] || '',
            reason: r['Reason of failure/return'] || '',
          }));
          const res = await apiClient.post('/cod/uploadBankResponse', { rows: mappedRows, selectedRemittanceIds: selectedCodOrders });
          const { successCount = 0, skippedCount = 0, errorCount = 0 } = res.data;
          fetchSellerRemittance(sellerPage);
          resolve(`Processed: ${successCount} paid, ${skippedCount} skipped, ${errorCount} errors`);
        } catch (err: any) {
          reject(new Error(err?.response?.data?.message || 'Failed to process bank response'));
        }
      };
      reader.readAsArrayBuffer(file);
    });

  const handleCourierCodDownloadSample = async () => {
    const res = await apiClient.get('/cod/download-excel-courier', { responseType: 'blob' });
    const blob = new Blob([res.data], { type: String(res.headers['content-type'] ?? 'application/octet-stream') });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Courier_COD_Remittance_Sample_Format.xlsx';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleCourierCodUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post('/cod/upload_courier', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    fetchCourierRemittance(courierPage);
    return res.data?.message || 'Courier COD remittance uploaded successfully!';
  };

  // Client-side global search on All COD Orders (server handles all other filters)
  const paginatedOrders = useMemo(() => {
    if (!globalSearchQuery) return codOrdersList;
    const q = globalSearchQuery.toLowerCase();
    return codOrdersList.filter(o =>
      (o.userName || '').toLowerCase().includes(q) ||
      (o.userEmail || '').toLowerCase().includes(q) ||
      (o.awb || '').toLowerCase().includes(q) ||
      (o.orderID || '').toLowerCase().includes(q)
    );
  }, [codOrdersList, globalSearchQuery]);

  // Client-side global search on Seller COD Remittance (server handles all other filters)
  const filteredSellerRemittanceList = useMemo(() => {
    if (!globalSearchQuery) return sellerRemittanceList;
    const q = globalSearchQuery.toLowerCase();
    return sellerRemittanceList.filter(o =>
      (o.userName || '').toLowerCase().includes(q) ||
      (o.userEmail || '').toLowerCase().includes(q) ||
      (o.awb || '').toLowerCase().includes(q) ||
      (o.utr || '').toLowerCase().includes(q)
    );
  }, [sellerRemittanceList, globalSearchQuery]);

  // Client-side global search on Courier COD Remittance (server handles all other filters)
  const filteredCourierRemittanceList = useMemo(() => {
    if (!globalSearchQuery) return courierRemittanceList;
    const q = globalSearchQuery.toLowerCase();
    return courierRemittanceList.filter(o =>
      (o.userName || '').toLowerCase().includes(q) ||
      (o.userEmail || '').toLowerCase().includes(q) ||
      (o.awb || '').toLowerCase().includes(q) ||
      (o.orderID || '').toLowerCase().includes(q)
    );
  }, [courierRemittanceList, globalSearchQuery]);

  const totalPages = Math.max(1, Math.ceil(codOrdersTotal / codRowsPerPage));
  const totalSellerPages = Math.max(1, Math.ceil(sellerRemittanceTotal / sellerRowsPerPage));
  const totalCourierPages = Math.max(1, Math.ceil(courierRemittanceTotal / courierRowsPerPage));

  // All COD selection â€" keyed by _id/orderID
  const toggleAll = () => setSelectedOrders(
    selectedOrders.length === paginatedOrders.length && paginatedOrders.length > 0
      ? [] : paginatedOrders.map(o => o.id)
  );
  const toggleSelect = (id: string) => setSelectedOrders(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  );

  // Seller selection â€" keyed by remittanceId
  const toggleAllCod = () => setSelectedCodOrders(
    selectedCodOrders.length === filteredSellerRemittanceList.length && filteredSellerRemittanceList.length > 0
      ? [] : filteredSellerRemittanceList.map(o => o.awb)
  );
  const toggleSelectCod = (id: string) => setSelectedCodOrders(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  );

  // Courier selection â€" keyed by _id/orderID
  const toggleAllCourierCod = () => setSelectedCourierCodOrders(
    selectedCourierCodOrders.length === filteredCourierRemittanceList.length && filteredCourierRemittanceList.length > 0
      ? [] : filteredCourierRemittanceList.map(o => o.id)
  );
  const toggleSelectCourierCod = (id: string) => setSelectedCourierCodOrders(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  );

  const handleApplyFilters = () => { setCurrentPage(1); fetchCodOrders(1); };

  const clearCodOrderFilters = () => {
    setCodOrderId(''); setCodAwb(''); setSelectedStatuses([]); setSelectedCouriers([]);
    setDateStart(defStart); setDateEnd(defEnd);
    if (isAdminView) { clearCodUserFilter(); }
    setCurrentPage(1);
    setRefreshTrigger(t => t + 1);
  };
  const hasCodOrderFilters = !!(codOrderId || codAwb || selectedStatuses.length || selectedCouriers.length || (dateStart && dateEnd && !(dateStart === defStart && dateEnd === defEnd)) || (isAdminView && codUserMongoId));

  const clearSellerRemittanceFilters = () => {
    setSellerRemittanceId(''); setSelectedCodStatuses([]); setCodDateStart(defStart); setCodDateEnd(defEnd);
    if (isAdminView) { clearSellerUserFilter(); }
    setSellerPage(1);
    setRefreshTrigger(t => t + 1);
  };
  const hasSellerRemittanceFilters = !!(sellerRemittanceId || selectedCodStatuses.length || (codDateStart && codDateEnd && !(codDateStart === defStart && codDateEnd === defEnd)) || (isAdminView && sellerUserMongoId));

  const clearCourierRemittanceFilters = () => {
    setCourierOrderId(''); setCourierAwb(''); setSelectedCourierCodStatuses([]); setSelectedCourierCouriers([]);
    setCourierCodDateStart(defStart); setCourierCodDateEnd(defEnd);
    if (isAdminView) { clearCourierUserFilter(); }
    setCourierPage(1);
    setRefreshTrigger(t => t + 1);
  };
  const hasCourierRemittanceFilters = !!(courierOrderId || courierAwb || selectedCourierCodStatuses.length || selectedCourierCouriers.length || (courierCodDateStart && courierCodDateEnd && !(courierCodDateStart === defStart && courierCodDateEnd === defEnd)) || (isAdminView && courierUserMongoId));



  const handleTransferCOD = async (type: 'seller' | 'courier') => {
    const ids = type === 'seller' ? selectedCodOrders : selectedCourierCodOrders;
    if (ids.length === 0) {
      showToast('error', `Select at least one record to transfer COD.`);
      return;
    }
    try {
      const res = await apiClient.post('/cod/validateCODTransfer', { remittanceIds: ids });
      const userId = res.data.userId;
      setTransferUserId(userId);
      setTransferIds(ids);
      setShowTransferModal(true);
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Error validating COD transfer');
    }
  };

  // Open remittance detail modal (Seller tab)
  const openRemittanceDetail = async (remittanceId: string) => {
    setRemittanceDetailId(remittanceId);
    setRemittanceDetail(null);
    setRemittanceDetailLoading(true);
    try {
      const res = await apiClient.get(`/cod/sellerremittanceTransactionData/${remittanceId}`);
      if (res.data.success) setRemittanceDetail(res.data.data);
    } catch {
      showToast('error', 'Failed to load remittance details.');
    } finally {
      setRemittanceDetailLoading(false);
    }
  };

  // â"€â"€ Shared table body cells â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const LoadingRow = ({ cols }: { cols: number }) => (
    <tr>
      <td colSpan={cols} className="p-12 text-center">
        <div className="w-8 h-8 border-2 border-[#00A86B] border-t-transparent rounded-full animate-spin mx-auto" />
        <div className="text-[12px] text-[#64748B] mt-2">Loading...</div>
      </td>
    </tr>
  );
  const EmptyRow = ({ cols, msg }: { cols: number; msg: string }) => (
    <tr><td colSpan={cols}><EmptyState title={msg} /></td></tr>
  );

  const thBase = 'py-2 px-4 whitespace-nowrap text-xs leading-[18px] font-medium text-[#64748B] uppercase tracking-wider';

  return (
    <AdminLayout>
      <div className={`flex flex-col ${isImpersonating ? 'h-[calc(100vh-104px)]' : 'h-[calc(100vh-72px)]'} -m-4 md:-m-6 bg-white ${!isAdminView ? 'overflow-hidden' : ''}`}>

        {/* Mobile Search Bar — search + filter + action consolidated */}
        <div className="md:hidden px-3 py-2.5 border-b border-[#E2E8F0] flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              placeholder={
                activeTab === 'All COD Orders' ? 'Search by AWB...' :
                (activeTab === 'Seller COD Remittance' || activeTab === 'COD Remittance') ? 'Search by remittance ID...' :
                'Search by AWB, Order ID...'
              }
              value={
                activeTab === 'All COD Orders' ? codAwb :
                (activeTab === 'Seller COD Remittance' || activeTab === 'COD Remittance') ? sellerRemittanceId :
                courierAwb
              }
              onChange={(e) => {
                const val = e.target.value;
                if (activeTab === 'All COD Orders') setCodAwb(val);
                else if (activeTab === 'Seller COD Remittance' || activeTab === 'COD Remittance') setSellerRemittanceId(val);
                else setCourierAwb(val);
              }}
              className="w-full h-9 pl-9 pr-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-2 focus:ring-[#00A86B]/10 transition-all"
            />
          </div>
          {/* Filter icon */}
          <button
            onClick={() => {
              if (activeTab === 'All COD Orders') setIsMobileFiltersOpen(true);
              else if (activeTab === 'Seller COD Remittance' || activeTab === 'COD Remittance') setIsMobileSellerFiltersOpen(true);
              else setIsMobileCourierFiltersOpen(true);
            }}
            className="w-9 h-9 rounded-xl border border-[#E2E8F0] flex items-center justify-center text-[#475569] bg-white shrink-0"
          >
            <Filter className="w-4 h-4" />
          </button>
          {/* Early COD button — user view only */}
          {!isAdminView && (
            <button
              onClick={() => setShowEarlyCODModal(true)}
              className="w-9 h-9 rounded-xl bg-[#00A86B] flex items-center justify-center text-white hover:bg-[#008F5C] transition-colors shrink-0"
            >
              <Banknote className="w-4 h-4" />
            </button>
          )}
          {/* Action icon + per-tab dropdowns */}
          <div className="relative action-dropdown-container shrink-0">
            <button
              onClick={() => {
                if (activeTab === 'All COD Orders') setShowAllCodActionMenu(v => !v);
                else if (activeTab === 'Seller COD Remittance' || activeTab === 'COD Remittance') setShowMobileSellerActionMenu(v => !v);
                else setShowMobileCourierActionMenu(v => !v);
              }}
              className="w-9 h-9 rounded-xl border border-[#E2E8F0] flex items-center justify-center text-[#475569] bg-white relative"
            >
              <MoreVertical className="w-4 h-4" />
              {(() => {
                const count = activeTab === 'All COD Orders' ? selectedOrders.length :
                  (activeTab === 'Seller COD Remittance' || activeTab === 'COD Remittance') ? selectedCodOrders.length :
                  selectedCourierCodOrders.length;
                return count > 0 ? (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full bg-[#00A86B] text-white text-[9px] font-bold flex items-center justify-center px-0.5">
                    {count}
                  </span>
                ) : null;
              })()}
            </button>
            {/* All COD Orders action menu */}
            {activeTab === 'All COD Orders' && showAllCodActionMenu && (
              <div className="absolute right-0 top-full mt-2 w-[200px] bg-white rounded-xl shadow-[0_8px_28px_-6px_rgba(0,0,0,0.15)] border border-[#E2E8F0] py-1.5 z-[200]">
                <button
                  onClick={() => { toggleAll(); setShowAllCodActionMenu(false); }}
                  className="w-full text-left px-4 py-2.5 text-[13px] font-semibold text-[#00A86B] hover:bg-[#F0FDF4] border-b border-[#F1F5F9]"
                >
                  {selectedOrders.length === paginatedOrders.length && paginatedOrders.length > 0 ? 'Deselect All' : 'Select All'}
                </button>
                <button onClick={() => { handleExportBankTemplate(); setShowAllCodActionMenu(false); }} disabled={bankExportLoading} className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] flex items-center gap-2 disabled:opacity-60">
                  <Banknote className="w-4 h-4 text-[#00A86B]" />{bankExportLoading ? 'Generating…' : 'Early COD'}
                </button>
                <button onClick={() => { handleOpenBankResponseUpload(); setShowAllCodActionMenu(false); }} className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] flex items-center gap-2">
                  <Upload className="w-4 h-4 text-orange-500" />Upload Bank Response
                </button>
                <div className="h-px bg-[#E2E8F0] my-1" />
                <button
                  onClick={() => { if (selectedOrders.length === 0) { showToast('error', 'Select rows to export.'); return; } const rows = codOrdersList.filter(o => selectedOrders.includes(o.id)); handleExportCsv(rows, 'cod_orders.csv'); setShowAllCodActionMenu(false); }}
                  disabled={selectedOrders.length === 0}
                  className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4 text-[#00A86B]" />Export Data
                </button>
              </div>
            )}
            {/* Seller action menu */}
            {(activeTab === 'Seller COD Remittance' || activeTab === 'COD Remittance') && showMobileSellerActionMenu && (
              <div className="absolute right-0 top-full mt-2 w-[200px] bg-white rounded-xl shadow-[0_8px_28px_-6px_rgba(0,0,0,0.15)] border border-[#E2E8F0] py-1.5 z-[200]">
                <button
                  onClick={() => { toggleAllCod(); setShowMobileSellerActionMenu(false); }}
                  className="w-full text-left px-4 py-2.5 text-[13px] font-semibold text-[#00A86B] hover:bg-[#F0FDF4] border-b border-[#F1F5F9]"
                >
                  {selectedCodOrders.length === filteredSellerRemittanceList.length && filteredSellerRemittanceList.length > 0 ? 'Deselect All' : 'Select All'}
                </button>
                <button onClick={() => { const rows = sellerRemittanceList.filter(r => selectedCodOrders.includes(r.awb)); handleExportCsv(rows, 'seller_remittances.csv'); setShowMobileSellerActionMenu(false); }} className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] flex items-center gap-2"><Download className="w-4 h-4 text-[#00A86B]" />Export Data</button>
                {isAdminView && <button onClick={() => { handleExportBankTemplate(); setShowMobileSellerActionMenu(false); }} disabled={bankExportLoading} className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] flex items-center gap-2 disabled:opacity-60"><FileText className="w-4 h-4 text-blue-500" />{bankExportLoading ? 'Generating…' : 'Export Bank Template'}</button>}
                {isAdminView && <button onClick={() => { handleOpenBankResponseUpload(); setShowMobileSellerActionMenu(false); }} className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] flex items-center gap-2"><Upload className="w-4 h-4 text-orange-500" />Upload Bank Response</button>}
                <div className="border-t border-[#E2E8F0] my-1" />
                {isAdminView && <button onClick={() => { setShowMobileSellerActionMenu(false); handleTransferCOD('seller'); }} className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#00A86B] hover:bg-[#F0FDF4] flex items-center gap-2"><Send className="w-4 h-4" />Transfer COD</button>}
              </div>
            )}
            {/* Courier action menu */}
            {activeTab === 'Courier COD Remittance' && showMobileCourierActionMenu && (
              <div className="absolute right-0 top-full mt-2 w-[190px] bg-white rounded-xl shadow-[0_8px_28px_-6px_rgba(0,0,0,0.15)] border border-[#E2E8F0] py-1.5 z-[200]">
                <button
                  onClick={() => { toggleAllCourierCod(); setShowMobileCourierActionMenu(false); }}
                  className="w-full text-left px-4 py-2.5 text-[13px] font-semibold text-[#00A86B] hover:bg-[#F0FDF4] border-b border-[#F1F5F9]"
                >
                  {selectedCourierCodOrders.length === filteredCourierRemittanceList.length && filteredCourierRemittanceList.length > 0 ? 'Deselect All' : 'Select All'}
                </button>
                <button onClick={() => { const rows = courierRemittanceList.filter(r => selectedCourierCodOrders.includes(r.id)); handleExportCsv(rows, 'courier_cod.csv'); setShowMobileCourierActionMenu(false); }} className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] flex items-center gap-2"><Download className="w-4 h-4 text-[#00A86B]" />Export Data</button>
                <button onClick={() => { setShowCourierUpload(true); setShowMobileCourierActionMenu(false); }} className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] flex items-center gap-2"><Upload className="w-4 h-4 text-orange-500" />Upload Courier COD</button>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white relative z-50 shrink-0">
          <div className={`flex justify-between items-center px-4 md:px-6 py-2 border-b border-[#E2E8F0]${!isAdminView ? ' hidden md:flex' : ''}`}>
            <div className="flex gap-1 items-center bg-[#F7FEFC] rounded-full p-1.5 min-w-0">
              <div className="flex gap-1 items-center overflow-x-auto no-scrollbar flex-1 min-w-0">
                {(isAdminView ? MAIN_TABS : MAIN_TABS.filter(t => t.name === 'All COD Orders')).map(tab => (
                  <button
                    key={tab.name}
                    onClick={() => handleTabChange(tab.name)}
                    ref={(el) => { if (el && activeTab === tab.name) el.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }}
                    className={`relative px-4 py-2 text-[14px] md:text-[13px] font-semibold md:font-bold transition-colors whitespace-nowrap rounded-full flex items-center gap-1.5 cursor-pointer ${
                      activeTab === tab.name ? 'text-[#00A86B] underline underline-offset-4 decoration-2' : 'text-[#64748B] hover:text-[#0F172A]'
                    }`}
                  >
                    {tab.name}
                  </button>
                ))}
              </div>
              {isAdminView && <ChevronRight className="md:hidden w-4 h-4 text-[#94A3B8] shrink-0" />}
            </div>
            <div className="hidden md:flex items-center gap-3 shrink-0 ml-4">
              {!isAdminView && (
                <button
                  onClick={() => setShowEarlyCODModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-[#00A86B] text-white text-[12px] font-semibold hover:bg-[#008F5C] transition-colors whitespace-nowrap"
                >
                  Early COD
                </button>
              )}
              <button onClick={handleRefresh} className="w-8 h-8 rounded-full border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-[#F8FAFC]">
                <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {(activeTab === 'Seller COD Remittance' || activeTab === 'COD Remittance') && (
            <>
              <div className="hidden md:flex p-4 border-b border-[#E2E8F0] bg-[#F8FAFC]/30 flex-nowrap overflow-x-auto gap-4 no-scrollbar">
                <div className="flex-1 min-w-[200px] bg-[#F0F9FF] rounded-xl p-3 border border-[#E0F2FE] flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#DBEAFE] flex items-center justify-center shrink-0"><Wallet className="w-4 h-4 text-[#3B82F6]" /></div>
                  <div><div className="text-[14px] font-bold text-[#0F172A]">{fmtCurrency(sellerSummary.CODToBeRemitted)}</div><div className="text-[10px] font-semibold text-[#64748B]">COD To Be Remitted</div></div>
                </div>
                <div className="flex-1 min-w-[200px] bg-[#FAF5FF] rounded-xl p-3 border border-[#F3E8FF] flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#F3E8FF] flex items-center justify-center shrink-0"><Send className="w-4 h-4 text-[#A855F7]" /></div>
                  <div><div className="text-[14px] font-bold text-[#0F172A]">{fmtCurrency(sellerSummary.LastCodRemmited)}</div><div className="text-[10px] font-semibold text-[#64748B]">Last COD Remitted</div></div>
                </div>
                <div className="flex-1 min-w-[200px] bg-[#F0FDFA] rounded-xl p-3 border border-[#CCFBF1] flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#CCFBF1] flex items-center justify-center shrink-0"><Banknote className="w-4 h-4 text-[#14B8A6]" /></div>
                  <div><div className="text-[14px] font-bold text-[#0F172A]">{fmtCurrency(sellerSummary.TotalCODRemitted)}</div><div className="text-[10px] font-semibold text-[#64748B]">Total COD Remitted</div></div>
                </div>
                <div className="flex-1 min-w-[200px] bg-[#FEFCE8] rounded-xl p-3 border border-[#FEF08A] flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#FEF08A] flex items-center justify-center shrink-0"><MinusCircle className="w-4 h-4 text-[#EAB308]" /></div>
                  <div><div className="text-[14px] font-bold text-[#0F172A]">{fmtCurrency(sellerSummary.TotalDeductionfromCOD)}</div><div className="text-[10px] font-semibold text-[#64748B]">Total Deduction</div></div>
                </div>
                <div className="flex-1 min-w-[200px] bg-[#F8F5FF] rounded-xl p-3 border border-[#F3EFFF] flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#EADDFF] flex items-center justify-center shrink-0"><Clock className="w-4 h-4 text-[#8B5CF6]" /></div>
                  <div><div className="text-[14px] font-bold text-[#0F172A]">{fmtCurrency(sellerSummary.RemittanceInitiated)}</div><div className="text-[10px] font-semibold text-[#64748B]">Remittance Initiated</div></div>
                </div>
              </div>

              {/* Mobile Stat Cards */}
              <div className="md:hidden border-b border-[#E2E8F0] bg-white">
                <button onClick={() => setShowMobileSellerStats(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 text-[13px] font-bold text-[#0F172A]">
                  Summary
                  <ChevronDown className={`w-4 h-4 text-[#64748B] transition-transform ${showMobileSellerStats ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {showMobileSellerStats && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }} className="overflow-hidden">
                      <div className="grid grid-cols-3 gap-2 px-3 pb-3">
                        <div className="bg-[#F0F9FF] rounded-xl p-2 border border-[#E0F2FE] flex flex-col items-center text-center gap-1">
                          <div className="w-7 h-7 rounded-full bg-[#DBEAFE] flex items-center justify-center shrink-0"><Wallet className="w-3.5 h-3.5 text-[#3B82F6]" /></div>
                          <div className="min-w-0 w-full">
                            <div className="text-[12px] font-bold text-[#0F172A] truncate">{fmtCurrency(sellerSummary.CODToBeRemitted)}</div>
                            <div className="text-[9px] font-semibold text-[#64748B] leading-tight truncate">COD To Be Remitted</div>
                          </div>
                        </div>
                        <div className="bg-[#FAF5FF] rounded-xl p-2 border border-[#F3E8FF] flex flex-col items-center text-center gap-1">
                          <div className="w-7 h-7 rounded-full bg-[#F3E8FF] flex items-center justify-center shrink-0"><Send className="w-3.5 h-3.5 text-[#A855F7]" /></div>
                          <div className="min-w-0 w-full">
                            <div className="text-[12px] font-bold text-[#0F172A] truncate">{fmtCurrency(sellerSummary.LastCodRemmited)}</div>
                            <div className="text-[9px] font-semibold text-[#64748B] leading-tight truncate">Last COD Remitted</div>
                          </div>
                        </div>
                        <div className="bg-[#F0FDFA] rounded-xl p-2 border border-[#CCFBF1] flex flex-col items-center text-center gap-1">
                          <div className="w-7 h-7 rounded-full bg-[#CCFBF1] flex items-center justify-center shrink-0"><Banknote className="w-3.5 h-3.5 text-[#14B8A6]" /></div>
                          <div className="min-w-0 w-full">
                            <div className="text-[12px] font-bold text-[#0F172A] truncate">{fmtCurrency(sellerSummary.TotalCODRemitted)}</div>
                            <div className="text-[9px] font-semibold text-[#64748B] leading-tight truncate">Total COD Remitted</div>
                          </div>
                        </div>
                        <div className="bg-[#FEFCE8] rounded-xl p-2 border border-[#FEF08A] flex flex-col items-center text-center gap-1">
                          <div className="w-7 h-7 rounded-full bg-[#FEF08A] flex items-center justify-center shrink-0"><MinusCircle className="w-3.5 h-3.5 text-[#EAB308]" /></div>
                          <div className="min-w-0 w-full">
                            <div className="text-[12px] font-bold text-[#0F172A] truncate">{fmtCurrency(sellerSummary.TotalDeductionfromCOD)}</div>
                            <div className="text-[9px] font-semibold text-[#64748B] leading-tight truncate">Total Deduction</div>
                          </div>
                        </div>
                        <div className="bg-[#F8F5FF] rounded-xl p-2 border border-[#F3EFFF] flex flex-col items-center text-center gap-1">
                          <div className="w-7 h-7 rounded-full bg-[#EADDFF] flex items-center justify-center shrink-0"><Clock className="w-3.5 h-3.5 text-[#8B5CF6]" /></div>
                          <div className="min-w-0 w-full">
                            <div className="text-[12px] font-bold text-[#0F172A] truncate">{fmtCurrency(sellerSummary.RemittanceInitiated)}</div>
                            <div className="text-[9px] font-semibold text-[#64748B] leading-tight truncate">Remittance Initiated</div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}
          {activeTab === 'Courier COD Remittance' && (
            <>
              <div className="hidden md:flex p-4 border-b border-[#E2E8F0] bg-[#F8FAFC]/30 flex-nowrap overflow-x-auto gap-4 no-scrollbar">
                <div className="flex-1 min-w-[200px] bg-[#F0F9FF] rounded-xl p-3 border border-[#E0F2FE] flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#DBEAFE] flex items-center justify-center shrink-0"><Banknote className="w-4 h-4 text-[#3B82F6]" /></div>
                  <div><div className="text-[14px] font-bold text-[#0F172A]">{fmtCurrency(courierSummary.totalCODAmount)}</div><div className="text-[10px] font-semibold text-[#64748B]">Total Courier COD</div></div>
                </div>
                <div className="flex-1 min-w-[200px] bg-[#FEFCE8] rounded-xl p-3 border border-[#FEF08A] flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#FEF08A] flex items-center justify-center shrink-0"><MinusCircle className="w-4 h-4 text-[#EAB308]" /></div>
                  <div><div className="text-[14px] font-bold text-[#0F172A]">{fmtCurrency(courierSummary.paidCODAmount)}</div><div className="text-[10px] font-semibold text-[#64748B]">Paid COD Amount</div></div>
                </div>
                <div className="flex-1 min-w-[200px] bg-[#FAF5FF] rounded-xl p-3 border border-[#F3E8FF] flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#F3E8FF] flex items-center justify-center shrink-0"><Send className="w-4 h-4 text-[#A855F7]" /></div>
                  <div><div className="text-[14px] font-bold text-[#0F172A]">{fmtCurrency(courierSummary.pendingCODAmount)}</div><div className="text-[10px] font-semibold text-[#64748B]">Pending COD Amount</div></div>
                </div>
              </div>

              {/* Mobile Stat Cards */}
              <div className="md:hidden border-b border-[#E2E8F0] bg-white">
                <button onClick={() => setShowMobileCourierStats(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 text-[13px] font-bold text-[#0F172A]">
                  Summary
                  <ChevronDown className={`w-4 h-4 text-[#64748B] transition-transform ${showMobileCourierStats ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {showMobileCourierStats && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }} className="overflow-hidden">
                      <div className="grid grid-cols-3 gap-2 px-3 pb-3">
                        <div className="bg-[#F0F9FF] rounded-xl p-2 border border-[#E0F2FE] flex flex-col items-center text-center gap-1">
                          <div className="w-7 h-7 rounded-full bg-[#DBEAFE] flex items-center justify-center shrink-0"><Banknote className="w-3.5 h-3.5 text-[#3B82F6]" /></div>
                          <div className="min-w-0 w-full">
                            <div className="text-[12px] font-bold text-[#0F172A] truncate">{fmtCurrency(courierSummary.totalCODAmount)}</div>
                            <div className="text-[9px] font-semibold text-[#64748B] leading-tight truncate">Total Courier COD</div>
                          </div>
                        </div>
                        <div className="bg-[#FEFCE8] rounded-xl p-2 border border-[#FEF08A] flex flex-col items-center text-center gap-1">
                          <div className="w-7 h-7 rounded-full bg-[#FEF08A] flex items-center justify-center shrink-0"><MinusCircle className="w-3.5 h-3.5 text-[#EAB308]" /></div>
                          <div className="min-w-0 w-full">
                            <div className="text-[12px] font-bold text-[#0F172A] truncate">{fmtCurrency(courierSummary.paidCODAmount)}</div>
                            <div className="text-[9px] font-semibold text-[#64748B] leading-tight truncate">Paid COD Amount</div>
                          </div>
                        </div>
                        <div className="bg-[#FAF5FF] rounded-xl p-2 border border-[#F3E8FF] flex flex-col items-center text-center gap-1">
                          <div className="w-7 h-7 rounded-full bg-[#F3E8FF] flex items-center justify-center shrink-0"><Send className="w-3.5 h-3.5 text-[#A855F7]" /></div>
                          <div className="min-w-0 w-full">
                            <div className="text-[12px] font-bold text-[#0F172A] truncate">{fmtCurrency(courierSummary.pendingCODAmount)}</div>
                            <div className="text-[9px] font-semibold text-[#64748B] leading-tight truncate">Pending COD Amount</div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}
          {activeTab === 'All COD Orders' && (
            <>
              <div className="hidden md:flex p-4 border-b border-[#E2E8F0] bg-[#F8FAFC]/30 flex-nowrap overflow-x-auto gap-4 no-scrollbar">
                <div className="flex-1 min-w-[200px] bg-[#F0F9FF] rounded-xl p-3 border border-[#E0F2FE] flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#DBEAFE] flex items-center justify-center shrink-0"><Banknote className="w-4 h-4 text-[#3B82F6]" /></div>
                  <div><div className="text-[14px] font-bold text-[#0F172A]">{fmtCurrency(codSummary.totalCODAmount)}</div><div className="text-[10px] font-semibold text-[#64748B]">Total COD Amount</div></div>
                </div>
                <div className="flex-1 min-w-[200px] bg-[#F0FDFA] rounded-xl p-3 border border-[#CCFBF1] flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#CCFBF1] flex items-center justify-center shrink-0"><Check className="w-4 h-4 text-[#14B8A6]" /></div>
                  <div><div className="text-[14px] font-bold text-[#0F172A]">{fmtCurrency(codSummary.paidCODAmount)}</div><div className="text-[10px] font-semibold text-[#64748B]">Paid COD Amount</div></div>
                </div>
                <div className="flex-1 min-w-[200px] bg-[#FEFCE8] rounded-xl p-3 border border-[#FEF08A] flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#FEF08A] flex items-center justify-center shrink-0"><Clock className="w-4 h-4 text-[#EAB308]" /></div>
                  <div><div className="text-[14px] font-bold text-[#0F172A]">{fmtCurrency(codSummary.pendingCODAmount)}</div><div className="text-[10px] font-semibold text-[#64748B]">Pending COD Amount</div></div>
                </div>
              </div>

              {/* Mobile Stat Cards */}
              <div className="md:hidden border-b border-[#E2E8F0] bg-white">
                <button onClick={() => setShowMobileCodStats(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 text-[13px] font-bold text-[#0F172A]">
                  Summary
                  <ChevronDown className={`w-4 h-4 text-[#64748B] transition-transform ${showMobileCodStats ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {showMobileCodStats && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }} className="overflow-hidden">
                      <div className="grid grid-cols-3 gap-2 px-3 pb-3">
                        <div className="bg-[#F0F9FF] rounded-xl p-2 border border-[#E0F2FE] flex flex-col items-center text-center gap-1">
                          <div className="w-7 h-7 rounded-full bg-[#DBEAFE] flex items-center justify-center shrink-0"><Banknote className="w-3.5 h-3.5 text-[#3B82F6]" /></div>
                          <div className="min-w-0 w-full">
                            <div className="text-[12px] font-bold text-[#0F172A] truncate">{fmtCurrency(codSummary.totalCODAmount)}</div>
                            <div className="text-[9px] font-semibold text-[#64748B] leading-tight truncate">Total COD Remitted</div>
                          </div>
                        </div>
                        <div className="bg-[#FEFCE8] rounded-xl p-2 border border-[#FEF08A] flex flex-col items-center text-center gap-1">
                          <div className="w-7 h-7 rounded-full bg-[#FEF08A] flex items-center justify-center shrink-0"><Check className="w-3.5 h-3.5 text-[#EAB308]" /></div>
                          <div className="min-w-0 w-full">
                            <div className="text-[12px] font-bold text-[#0F172A] truncate">{fmtCurrency(codSummary.paidCODAmount)}</div>
                            <div className="text-[9px] font-semibold text-[#64748B] leading-tight truncate">Paid COD Amount</div>
                          </div>
                        </div>
                        <div className="bg-[#FAF5FF] rounded-xl p-2 border border-[#F3E8FF] flex flex-col items-center text-center gap-1">
                          <div className="w-7 h-7 rounded-full bg-[#F3E8FF] flex items-center justify-center shrink-0"><Clock className="w-3.5 h-3.5 text-[#A855F7]" /></div>
                          <div className="min-w-0 w-full">
                            <div className="text-[12px] font-bold text-[#0F172A] truncate">{fmtCurrency(codSummary.pendingCODAmount)}</div>
                            <div className="text-[9px] font-semibold text-[#64748B] leading-tight truncate">Pending COD Amount</div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>

      {/* â"€â"€ Table Section â"€â"€ */}
      <div className="bg-white flex flex-col flex-1 min-h-0 overflow-hidden border-t border-[#E2E8F0] relative">
        {isLoading && <TableLoader />}

        {/* All COD Orders Tab */}
        {activeTab === 'All COD Orders' && (
          <>
            {/* Filter Bar — desktop only */}
            <div className="hidden md:flex py-3 px-6 border-b border-[#CBD5F5] flex-wrap items-center gap-3 bg-[#F8FAFC]/50 shrink-0">
              {isAdminView && (
                <div className="relative shrink-0">
                  <div className="relative">
                    <input type="text" placeholder="Search user..." value={codUserQuery}
                      onChange={e => onCodUserQueryChange(e.target.value)}
                      className="glass-search-input w-[160px]" style={{ paddingLeft: '2rem', paddingRight: '2rem' }} />
                    <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 top-1/2 -translate-y-1/2" />
                    {codUserMongoId && <CheckCircle2 className="w-3.5 h-3.5 text-[#00A86B] absolute right-2.5 top-1/2 -translate-y-1/2" />}
                  </div>
                  {codUserSuggestions.length > 0 && !codUserMongoId && (
                    <div className="absolute left-0 top-full mt-1 bg-white border border-[#E2E8F0] rounded-xl shadow-xl z-50 w-64 max-h-52 overflow-y-auto py-1">
                      {codUserSuggestions.map((u: any) => (
                        <button key={u._id} type="button" onClick={() => selectCodUserSuggestion(u)}
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
              <input type="text" placeholder="Order ID" value={codOrderId} onChange={e => setCodOrderId(e.target.value)}
                className="glass-search-input w-[120px] shrink-0" />
              <input type="text" placeholder="AWB Number" value={codAwb} onChange={e => setCodAwb(e.target.value)}
                className="glass-search-input w-[130px] shrink-0" />
              <GlassDropdown label="Status" options={STATUS_OPTIONS} selected={selectedStatuses} onChange={setSelectedStatuses} placeholder="Status..." icon={<CheckCircle2 className="w-3.5 h-3.5" />} />
              <GlassDropdown label="Courier" options={codCourierOptions} selected={selectedCouriers} onChange={setSelectedCouriers} placeholder="Courier..." icon={<Truck className="w-3.5 h-3.5" />} />
              <GlassDateFilter startDate={dateStart} endDate={dateEnd} onDateChange={onDateChange} defaultStart={defStart} defaultEnd={defEnd} />
              <button onClick={() => { setCurrentPage(1); fetchCodOrders(1); }}
                className="py-2 px-4 shrink-0 rounded-[32px] bg-[#009D64] border border-[#009D64] text-white text-xs font-medium leading-[18px] hover:bg-[#008a57] transition-colors cursor-pointer">Apply Filters</button>
              {hasCodOrderFilters && (
                <button onClick={clearCodOrderFilters}
                  className="py-2 px-4 shrink-0 rounded-[32px] border border-red-200 text-red-500 text-xs font-medium leading-[18px] hover:bg-red-50 transition-colors cursor-pointer">
                  Clear All
                </button>
              )}
              <div className="ml-auto flex items-center gap-2 shrink-0">
                <button onClick={() => { if (selectedOrders.length === 0) { showToast('error', 'Select rows to export.'); return; } const rows = codOrdersList.filter(o => selectedOrders.includes(o.id)); handleExportCsv(rows, 'cod_orders.csv'); }}
                  className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors ${selectedOrders.length > 0 ? 'border-[#00A86B] text-[#00A86B] hover:bg-[#00A86B]/5' : 'border-[#E2E8F0] text-[#CBD5E1] cursor-not-allowed'}`}>
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
            {selectedOrders.length > 0 && (
              <div className="hidden md:flex px-4 py-2 bg-emerald-50 border-b border-emerald-100 items-center gap-3 shrink-0">
                <span className="text-xs font-bold text-emerald-700">{selectedOrders.length} selected</span>
                <button onClick={() => setSelectedOrders([])} className="text-xs text-[#64748B] hover:text-red-500">Clear</button>
              </div>
            )}
            <div className="hidden md:block flex-1 overflow-y-auto overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead className="sticky top-0 z-30 bg-[#E6F9F2] shadow-sm">
                  <tr className="border border-[#B9EFDB]">
                    <th className="py-2 px-4 w-10 rounded-l-lg">
                      <input type="checkbox" checked={selectedOrders.length === paginatedOrders.length && paginatedOrders.length > 0} onChange={toggleAll} className="rounded accent-[#00A86B] w-3.5 h-3.5" />
                    </th>
                    {isAdminView && <th className={thBase}><User className="w-3.5 h-3.5 inline mr-1" />User Details</th>}
                    <th className={thBase}><FileText className="w-3.5 h-3.5 inline mr-1" />Order Details</th>
                    <th className={thBase}><Truck className="w-3.5 h-3.5 inline mr-1" />Shipping Details</th>
                    <th className={thBase}><Banknote className="w-3.5 h-3.5 inline mr-1" />COD Amount</th>
                    <th className={`${thBase} rounded-r-lg`}><Check className="w-3.5 h-3.5 inline mr-1" />Status</th>
                  </tr>
                </thead>
                <tbody className="text-[11px] text-[#475569]">
                  {paginatedOrders.length === 0 ? (
                    <EmptyRow cols={isAdminView ? 6 : 5} msg="No COD orders found" />
                  ) : paginatedOrders.map((order, idx) => (
                    <tr key={order.id} className={`border-b border-[#E2E8F0] transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-[#E6EDF7]/20'}`}>
                      <td className="p-4">
                        <input type="checkbox" checked={selectedOrders.includes(order.id)} onChange={() => toggleSelect(order.id)} className="rounded accent-[#00A86B] w-3.5 h-3.5" />
                      </td>
                      {isAdminView && (
                        <td className="p-4">
                          <div className="text-[11px] font-semibold text-[#00A86B]">{order.userId}</div>
                          <TruncatedText text={order.userName} maxLength={20} className="text-sm font-semibold text-[#0F172A] mt-0.5 max-w-[160px]" />
                          <TruncatedText text={order.userEmail} maxLength={25} className="text-xs font-normal text-[#94A3B8] max-w-[180px]" />
                        </td>
                      )}
                      <td className="p-4">
                        {order.orderID ? renderCopyable(order.orderID, 'Order ID', "text-xs font-semibold text-[#00A86B] cursor-pointer", () => navigate(`${isAdminView ? '/admin' : '/user'}/order-tracking?id=${order.orderID}`)) : <div className="text-xs font-semibold text-[#00A86B]">—</div>}
                      </td>
                      <td className="p-4">
                        <div className="text-xs font-semibold text-[#00A86B]">{order.courier}</div>
                        <div className="text-xs font-normal text-[#94A3B8] mt-0.5">Delivered On : {withOrdinalSuffix(order.date)}</div>
                        <div className="mt-0.5">
                          {order.awb ? renderCopyable(order.awb, 'AWB', "text-xs font-semibold text-[#00A86B] hover:underline cursor-pointer", () => navigate(`${isAdminView ? '/admin' : '/user'}/tracking?awb=${order.awb}`)) : <div className="text-xs font-semibold text-[#00A86B]">—</div>}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-normal text-[#0F172A] text-xs">{fmtCurrency(order.codAmount)}</div>
                      </td>
                      <td className="p-4">
                        <span className={getStatusBadgeClass(order.status)}>{order.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <DesktopPagination
              page={currentPage}
              setPage={setCurrentPage}
              totalPages={totalPages}
              rowsPerPage={codRowsPerPage}
              setRowsPerPage={setCodRowsPerPage}
              startIndex={Math.min((currentPage - 1) * codRowsPerPage + 1, codOrdersTotal)}
              endIndex={Math.min(currentPage * codRowsPerPage, codOrdersTotal)}
              totalItems={codOrdersTotal}
            />

            {/* Mobile Card Layout */}
            <div className="md:hidden flex flex-col flex-1 min-h-0 bg-[#F8FAFC]">
              <div className="flex-1 overflow-y-auto">
                {paginatedOrders.length === 0 ? (
                  <EmptyState title="No COD orders found" />
                ) : (
                  <div className="p-2 space-y-2">
                    {paginatedOrders.map((order) => {
                      const accent = order.status === 'Paid' ? '#00A86B' : '#F59E0B';
                      return (
                        <div key={order.id} className="relative bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
                          <div className="px-2.5 pt-2.5 pb-2.5">
                            {/* Header Row — status badge on the left, checkbox on the right (no more corner ribbon) */}
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wider ${order.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                {order.status}
                              </span>
                              <input type="checkbox" checked={selectedOrders.includes(order.id)} onChange={() => toggleSelect(order.id)} className="rounded border-gray-300 accent-[#00A86B] w-4 h-4 shrink-0" />
                            </div>

                            {/* User Details + Order ID Row — each take half the row, with a centered vertical divider; user details admin-only */}
                            <div className="flex items-center gap-2 mb-1.5 min-w-0">
                              {isAdminView && (
                                <>
                                  <span className="flex-1 min-w-0 text-[12px] inline-flex items-baseline gap-1">
                                    <span className="font-semibold text-[#1E293B] text-[12px] leading-[18px] truncate">{(order.userName || '—').split(' ')[0]}</span>
                                    <span className="text-[#00A86B] font-semibold shrink-0">({order.userId || '—'})</span>
                                  </span>
                                  <span className="w-px h-3.5 bg-[#E2E8F0] shrink-0" />
                                </>
                              )}
                              {order.orderID && (
                                <div className="flex-1 min-w-0 flex items-center justify-end gap-1 group/copy">
                                  <div className="text-[12px] font-semibold text-[#00A86B] cursor-pointer hover:underline truncate text-right" onClick={() => navigate(`${isAdminView ? '/admin' : '/user'}/order-tracking?id=${order.orderID}`)}>{order.orderID}</div>
                                  <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(order.orderID).catch(()=>{}); showToast('success', 'Order ID copied!'); }} className="opacity-100 md:opacity-0 md:group-hover/copy:opacity-100 transition-opacity shrink-0 focus:outline-none" title="Copy Order ID"><Copy className="w-3 h-3 text-[#94A3B8] hover:text-[#00A86B]" /></button>
                                </div>
                              )}
                            </div>

                            {/* Courier / AWB / Amount Card */}
                            <div className="rounded-xl p-2 bg-white" style={{ border: `1px solid ${accent}` }}>
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                  <div className="w-9 h-9 bg-white border border-[#E2E8F0] rounded-xl flex items-center justify-center shrink-0 overflow-hidden p-1 shadow-sm">
                                    {order.courier ? (
                                      <img
                                        src={getCourierLogo(order.courier)}
                                        alt={order.courier}
                                        className="w-full h-full object-contain"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(order.courier)}&background=f8fafc&color=0f172a&bold=true&font-size=0.4`;
                                        }}
                                      />
                                    ) : (
                                      <Truck className="w-4 h-4 text-[#94A3B8]" />
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="text-[12px] font-normal text-[#0F172A] truncate">{order.courier || '—'}</div>
                                    <div className="text-[11px] font-normal text-[#94A3B8] truncate mt-0.5">Delivered On: {withOrdinalSuffix(order.date)}</div>
                                    {order.awb ? (
                                      <div className="flex items-center gap-1 group/copy mt-0.5">
                                        <div className="text-[12px] font-semibold text-[#00A86B] underline truncate active:opacity-60 cursor-pointer" onClick={(e) => { e.stopPropagation(); navigate(`${isAdminView ? '/admin' : '/user'}/tracking?awb=${order.awb}`); }}>{order.awb}</div>
                                        <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(order.awb).catch(()=>{}); showToast('success', 'AWB copied!'); }} className="opacity-100 md:opacity-0 md:group-hover/copy:opacity-100 transition-opacity shrink-0 focus:outline-none" title="Copy AWB"><Copy className="w-3 h-3 text-[#94A3B8] hover:text-[#00A86B]" /></button>
                                      </div>
                                    ) : (
                                      <div className="text-[12px] font-semibold text-[#94A3B8] truncate mt-0.5">—</div>
                                    )}
                                  </div>
                                </div>
                                <div className="text-[12px] font-semibold text-[#00A86B] shrink-0">{fmtCurrency(order.codAmount)}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Mobile Pagination */}
              {<MobilePaginationBar {...({
                page: currentPage,
                setPage: setCurrentPage,
                totalPages,
                rowsPerPage: codRowsPerPage,
                setRowsPerPage: setCodRowsPerPage,
                startIndex: Math.min((currentPage - 1) * codRowsPerPage + 1, codOrdersTotal),
                endIndex: Math.min(currentPage * codRowsPerPage, codOrdersTotal),
                totalItems: codOrdersTotal,
              })} />}
            </div>
          </>
        )}

        {/* Seller COD Remittance Tab */}
        {(activeTab === 'Seller COD Remittance' || activeTab === 'COD Remittance') && (
          <>
            {/* Filter Bar — desktop only */}
            <div className="hidden md:flex py-3 px-6 border-b border-[#CBD5F5] flex-wrap items-center gap-3 bg-[#F8FAFC]/50 shrink-0">
              {isAdminView && (
                <div className="relative shrink-0">
                  <div className="relative">
                    <input type="text" placeholder="Search user..." value={sellerUserQuery}
                      onChange={e => onSellerUserQueryChange(e.target.value)}
                      className="glass-search-input w-[160px]" style={{ paddingLeft: '2rem', paddingRight: '2rem' }} />
                    <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 top-1/2 -translate-y-1/2" />
                    {sellerUserMongoId && <CheckCircle2 className="w-3.5 h-3.5 text-[#00A86B] absolute right-2.5 top-1/2 -translate-y-1/2" />}
                  </div>
                  {sellerUserSuggestions.length > 0 && !sellerUserMongoId && (
                    <div className="absolute left-0 top-full mt-1 bg-white border border-[#E2E8F0] rounded-xl shadow-xl z-50 w-64 max-h-52 overflow-y-auto py-1">
                      {sellerUserSuggestions.map((u: any) => (
                        <button key={u._id} type="button" onClick={() => selectSellerUserSuggestion(u)}
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
              <input type="text" placeholder="Remittance ID" value={sellerRemittanceId} onChange={e => setSellerRemittanceId(e.target.value)}
                className="glass-search-input w-[140px] shrink-0" />
              <GlassDropdown label="Status" options={STATUS_OPTIONS} selected={selectedCodStatuses} onChange={setSelectedCodStatuses} placeholder="Status..." icon={<CheckCircle2 className="w-3.5 h-3.5" />} />
              <GlassDateFilter startDate={codDateStart} endDate={codDateEnd} onDateChange={onCodDateChange} defaultStart={defStart} defaultEnd={defEnd} />
              <button onClick={() => { setSellerPage(1); fetchSellerRemittance(1); }}
                className="py-2 px-4 shrink-0 rounded-[32px] bg-[#009D64] border border-[#009D64] text-white text-xs font-medium leading-[18px] hover:bg-[#008a57] transition-colors cursor-pointer">Apply Filters</button>
              {hasSellerRemittanceFilters && (
                <button onClick={clearSellerRemittanceFilters}
                  className="py-2 px-4 shrink-0 rounded-[32px] border border-red-200 text-red-500 text-xs font-medium leading-[18px] hover:bg-red-50 transition-colors cursor-pointer">
                  Clear All
                </button>
              )}
              <div className="relative shrink-0 ml-auto action-dropdown-container">
                <button onClick={() => selectedCodOrders.length > 0 && setShowActionMenu(!showActionMenu)} disabled={selectedCodOrders.length === 0}
                  className={`py-2 pl-4 pr-8 rounded-[32px] border text-xs leading-[18px] flex items-center font-medium relative transition-colors ${selectedCodOrders.length > 0 ? 'border-[#03C27D] bg-white text-[#64748B] hover:bg-[#F0FDF9] cursor-pointer' : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#CBD5E1] cursor-not-allowed'}`}>
                  Actions <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2" />
                </button>
                {showActionMenu && selectedCodOrders.length > 0 && (
                  <div className="absolute right-0 top-full mt-2 w-[200px] bg-white rounded-xl shadow-lg border border-[#E2E8F0] py-2 z-50">
                    <button onClick={() => { const rows = sellerRemittanceList.filter(r => selectedCodOrders.includes(r.awb)); handleExportCsv(rows, 'seller_remittances.csv'); }} className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] flex items-center gap-2"><Download className="w-4 h-4 text-[#00A86B]" />Export Data</button>
                    {isAdminView && <button onClick={handleExportBankTemplate} disabled={bankExportLoading} className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] flex items-center gap-2"><FileText className="w-4 h-4 text-blue-500" />{bankExportLoading ? 'Generating…' : 'Export Bank Template'}</button>}
                    {isAdminView && <button onClick={handleOpenBankResponseUpload} className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] flex items-center gap-2"><Upload className="w-4 h-4 text-orange-500" />Upload Bank Response</button>}
                    {isAdminView && <div className="border-t border-[#E2E8F0] my-1" />}
                    {isAdminView && <button onClick={() => { setShowActionMenu(false); handleTransferCOD('seller'); }} className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#00A86B] hover:bg-[#F0FDF4] flex items-center gap-2"><Send className="w-4 h-4" />Transfer COD</button>}
                  </div>
                )}
              </div>
            </div>
            {selectedCodOrders.length > 0 && (
              <div className="hidden md:flex px-4 py-2 bg-emerald-50 border-b border-emerald-100 items-center gap-3 shrink-0">
                <span className="text-xs font-bold text-emerald-700">{selectedCodOrders.length} selected</span>
                {isAdminView && <button onClick={() => handleTransferCOD('seller')} className="h-7 px-3 rounded-md bg-[#00A86B] text-white text-xs font-bold shadow-sm hover:bg-[#009B63]">Transfer COD</button>}
                <button onClick={() => setSelectedCodOrders([])} className="text-xs text-[#64748B] hover:text-red-500">Clear</button>
              </div>
            )}
            <div className="hidden md:block flex-1 overflow-y-auto overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse min-w-[1200px]">
                <thead className="sticky top-0 z-30 bg-[#E6F9F2] shadow-sm">
                  <tr className="border border-[#B9EFDB]">
                    <th className="py-2 px-4 w-10 rounded-l-lg">
                      <input type="checkbox" checked={selectedCodOrders.length === filteredSellerRemittanceList.length && filteredSellerRemittanceList.length > 0} onChange={toggleAllCod} className="rounded accent-[#00A86B] w-3.5 h-3.5" />
                    </th>
                    {isAdminView && <th className={thBase}><User className="w-3.5 h-3.5 inline mr-1" />User</th>}
                    <th className={thBase}><FileText className="w-3.5 h-3.5 inline mr-1" />Remittance ID</th>
                    <th className={thBase}><FileText className="w-3.5 h-3.5 inline mr-1" />UTR</th>
                    <th className={thBase}><Banknote className="w-3.5 h-3.5 inline mr-1" />Total COD</th>
                    <th className={thBase}><Banknote className="w-3.5 h-3.5 inline mr-1" />Wallet Credit</th>
                    <th className={thBase}><Banknote className="w-3.5 h-3.5 inline mr-1" />Adjusted</th>
                    <th className={thBase}><Banknote className="w-3.5 h-3.5 inline mr-1" />Early COD Fee</th>
                    <th className={thBase}><Banknote className="w-3.5 h-3.5 inline mr-1" />Net Remittance</th>
                    <th className={`${thBase} rounded-r-lg`}><Check className="w-3.5 h-3.5 inline mr-1" />Status</th>
                  </tr>
                </thead>
                <tbody className="text-[11px] text-[#475569]">
                  {filteredSellerRemittanceList.length === 0 ? (
                    <EmptyRow cols={isAdminView ? 10 : 9} msg="No seller remittance records found" />
                  ) : filteredSellerRemittanceList.map((order, idx) => (
                    <tr key={order.id || order.awb} className={`border-b border-[#E2E8F0] transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-[#E6EDF7]/20'}`}>
                      <td className="p-4">
                        <input type="checkbox" checked={selectedCodOrders.includes(order.awb)} onChange={() => toggleSelectCod(order.awb)} className="rounded accent-[#00A86B] w-3.5 h-3.5" />
                      </td>
                      {isAdminView && (
                        <td className="p-4">
                          <TruncatedText text={order.userName} maxLength={20} className="text-sm font-semibold text-[#0F172A] max-w-[160px]" />
                          <TruncatedText text={order.userEmail} maxLength={25} className="text-xs font-normal text-[#94A3B8] max-w-[180px]" />
                        </td>
                      )}
                      <td className="p-4">
                        {order.awb ? (
                          <div className="flex items-center gap-1.5 group/copy">
                            <button
                              onClick={(e) => { e.stopPropagation(); openRemittanceDetail(order.awb); }}
                              className="text-xs font-semibold text-[#00A86B] hover:underline cursor-pointer max-w-[90px] truncate text-left"
                              title={order.awb}
                            >
                              {order.awb}
                            </button>
                            {/* <button
                              onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(order.awb); showToast('success', 'Remittance ID copied!'); }}
                              className="opacity-100 md:opacity-0 md:group-hover/copy:opacity-100 transition-opacity focus:outline-none shrink-0"
                              title="Copy Remittance ID"
                            >
                              <Copy className="w-3 h-3 text-[#94A3B8] hover:text-[#00A86B]" />
                            </button> */}
                          </div>
                        ) : 
                        <div className="text-xs font-semibold text-[#00A86B]">—</div>}
                        {/* <div className="text-xs font-normal text-[#94A3B8] mt-0.5">{order.paymentMethod}</div> */}
                        <div className="text-xs font-normal text-[#94A3B8]">{order.date}</div>
                      </td>
                      <td className="p-3 font-normal text-xs text-[#00A86B]">
                        {order.utr && order.utr !== 'N/A' ? (
                          <div className="flex items-center gap-1.5 group/copy w-max">
                            <TruncatedText text={order.utr} maxLength={10} className="text-xs font-semibold text-[#00A86B] cursor-default" />
                            <button
                              onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(order.utr); showToast('success', 'UTR copied!'); }}
                              className="opacity-100 md:opacity-0 md:group-hover/copy:opacity-100 transition-opacity focus:outline-none"
                              title="Copy UTR"
                            >
                              <Copy className="w-3 h-3 text-[#94A3B8] hover:text-[#00A86B]" />
                            </button>
                          </div>
                        ) : order.utr}
                      </td>
                      <td className="p-3 font-normal text-xs text-[#0F172A]">{fmtCurrency(order.totalCodAmount)}</td>
                      <td className="p-3 font-normal text-xs text-red-500">{fmtCurrency(order.creditedAmount)}</td>
                      <td className="p-3 font-normal text-xs text-[#64748B]">{fmtCurrency(order.adjustedAmount)}</td>
                      <td className="p-3 font-normal text-xs text-red-700">{fmtCurrency(order.earlyCodCharges)}</td>
                      <td className="p-3 font-normal text-xs text-[#00A86B]">{fmtCurrency(order.remittanceAmount)}</td>
                      <td className="p-4">
                        <span className={getStatusBadgeClass(order.status)}>{order.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <DesktopPagination
              page={sellerPage}
              setPage={setSellerPage}
              totalPages={totalSellerPages}
              rowsPerPage={sellerRowsPerPage}
              setRowsPerPage={setSellerRowsPerPage}
              startIndex={Math.min((sellerPage - 1) * sellerRowsPerPage + 1, sellerRemittanceTotal)}
              endIndex={Math.min(sellerPage * sellerRowsPerPage, sellerRemittanceTotal)}
              totalItems={sellerRemittanceTotal}
            />

            {/* Mobile Card Layout */}
            <div className="md:hidden flex flex-col flex-1 min-h-0 bg-[#F8FAFC]">
              <div className="flex-1 overflow-y-auto">
                {filteredSellerRemittanceList.length === 0 ? (
                  <EmptyState title="No seller remittance records found" />
                ) : (
                  <div className="p-2 space-y-2">
                    {filteredSellerRemittanceList.map((order) => {
                      const accent = order.status === 'Paid' ? '#00A86B' : '#F59E0B';
                      return (
                        <div key={order.id || order.awb} className="relative bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
                          <div className="px-2.5 pt-2.5 pb-2.5">
                            {/* Header Row — status badge on the left, checkbox on the right (no more corner ribbon) */}
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wider ${order.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                {order.status}
                              </span>
                              <input type="checkbox" checked={selectedCodOrders.includes(order.awb)} onChange={() => toggleSelectCod(order.awb)} className="rounded border-gray-300 accent-[#00A86B] w-4 h-4 shrink-0" />
                            </div>

                            {/* User Details + Remittance ID Row — each take half the row, with a centered vertical divider; user details admin-only */}
                            <div className="flex items-center gap-2 mb-1.5 min-w-0">
                              {isAdminView && (
                                <>
                                  <span className="flex-1 min-w-0 text-[12px] inline-flex items-baseline gap-1">
                                    <span className="font-semibold text-[#1E293B] text-[12px] leading-[18px] truncate">{(order.userName || '—').split(' ')[0]}</span>
                                    <span className="text-[#94A3B8] font-semibold shrink-0">({order.userId || '—'})</span>
                                  </span>
                                  <span className="w-px h-3.5 bg-[#E2E8F0] shrink-0" />
                                </>
                              )}
                              <div className="flex-1 min-w-0 flex items-center justify-end gap-1 group/copyRemit">
                                <button onClick={() => openRemittanceDetail(order.awb)} className="text-[12px] font-semibold text-[#00A86B] hover:underline truncate text-right">
                                  {order.awb || '—'}
                                </button>
                                {order.awb && (
                                  <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(order.awb).catch(() => {}); showToast('success', 'Remittance ID copied!'); }} className="opacity-100 md:opacity-0 md:group-hover/copyRemit:opacity-100 transition-opacity shrink-0 focus:outline-none" title="Copy Remittance ID">
                                    <Copy className="w-3 h-3 text-[#94A3B8] hover:text-[#00A86B]" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* UTR / Total COD / Wallet Credit / Adj. Amt / Early COD / Net Remittance */}
                            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 bg-[#F8FAFC] rounded-xl px-2.5 py-2">
                              <div>
                                <div className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wide">UTR</div>
                                <div className="text-[12px] font-normal text-[#0F172A] mt-0.5 truncate">{order.utr}</div>
                              </div>
                              <div>
                                <div className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wide">Total COD</div>
                                <div className="text-[12px] font-normal text-[#0F172A] mt-0.5">{fmtCurrency(order.totalCodAmount)}</div>
                              </div>
                              <div>
                                <div className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wide">Wallet Credit</div>
                                <div className="text-[12px] font-normal text-red-500 mt-0.5">{fmtCurrency(order.creditedAmount)}</div>
                              </div>
                              <div>
                                <div className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wide">Adj. Amt</div>
                                <div className="text-[12px] font-normal text-[#0F172A] mt-0.5">{fmtCurrency(order.adjustedAmount)}</div>
                              </div>
                              <div>
                                <div className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wide">Early COD</div>
                                <div className="text-[12px] font-normal text-red-700 mt-0.5">{fmtCurrency(order.earlyCodCharges)}</div>
                              </div>
                              <div>
                                <div className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wide">Net Remittance</div>
                                <div className="text-[12px] font-bold text-[#00A86B] mt-0.5">{fmtCurrency(order.remittanceAmount)}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Mobile Pagination */}
              {<MobilePaginationBar {...({
                page: sellerPage,
                setPage: setSellerPage,
                totalPages: totalSellerPages,
                rowsPerPage: sellerRowsPerPage,
                setRowsPerPage: setSellerRowsPerPage,
                startIndex: Math.min((sellerPage - 1) * sellerRowsPerPage + 1, sellerRemittanceTotal),
                endIndex: Math.min(sellerPage * sellerRowsPerPage, sellerRemittanceTotal),
                totalItems: sellerRemittanceTotal,
              })} />}
            </div>
          </>
        )}

        {/* Courier COD Remittance Tab */}
        {activeTab === 'Courier COD Remittance' && (
          <>
            {/* Filter Bar — desktop only */}
            <div className="hidden md:flex py-3 px-6 border-b border-[#CBD5F5] flex-wrap items-center gap-3 bg-[#F8FAFC]/50 shrink-0">
              {isAdminView && (
                <div className="relative shrink-0">
                  <div className="relative">
                    <input type="text" placeholder="Search user..." value={courierUserQuery}
                      onChange={e => onCourierUserQueryChange(e.target.value)}
                      className="glass-search-input w-[160px]" style={{ paddingLeft: '2rem', paddingRight: '2rem' }} />
                    <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 top-1/2 -translate-y-1/2" />
                    {courierUserMongoId && <CheckCircle2 className="w-3.5 h-3.5 text-[#00A86B] absolute right-2.5 top-1/2 -translate-y-1/2" />}
                  </div>
                  {courierUserSuggestions.length > 0 && !courierUserMongoId && (
                    <div className="absolute left-0 top-full mt-1 bg-white border border-[#E2E8F0] rounded-xl shadow-xl z-50 w-64 max-h-52 overflow-y-auto py-1">
                      {courierUserSuggestions.map((u: any) => (
                        <button key={u._id} type="button" onClick={() => selectCourierUserSuggestion(u)}
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
              <input type="text" placeholder="Order ID" value={courierOrderId} onChange={e => setCourierOrderId(e.target.value)}
                className="glass-search-input w-[120px] shrink-0" />
              <input type="text" placeholder="AWB Number" value={courierAwb} onChange={e => setCourierAwb(e.target.value)}
                className="glass-search-input w-[130px] shrink-0" />
              <GlassDropdown label="Status" options={STATUS_OPTIONS} selected={selectedCourierCodStatuses} onChange={setSelectedCourierCodStatuses} placeholder="Status..." icon={<CheckCircle2 className="w-3.5 h-3.5" />} />
              <GlassDropdown label="Courier" options={courierCourierOptions} selected={selectedCourierCouriers} onChange={setSelectedCourierCouriers} placeholder="Courier..." icon={<Truck className="w-3.5 h-3.5" />} />
              <GlassDateFilter startDate={courierCodDateStart} endDate={courierCodDateEnd} onDateChange={onCourierCodDateChange} defaultStart={defStart} defaultEnd={defEnd} />
              <button onClick={() => { setCourierPage(1); fetchCourierRemittance(1); }}
                className="py-2 px-4 shrink-0 rounded-[32px] bg-[#009D64] border border-[#009D64] text-white text-xs font-medium leading-[18px] hover:bg-[#008a57] transition-colors cursor-pointer">Apply Filters</button>
              {hasCourierRemittanceFilters && (
                <button onClick={clearCourierRemittanceFilters}
                  className="py-2 px-4 shrink-0 rounded-[32px] border border-red-200 text-red-500 text-xs font-medium leading-[18px] hover:bg-red-50 transition-colors cursor-pointer">
                  Clear All
                </button>
              )}
              <button onClick={() => setShowCourierUpload(true)}
                className="py-2 px-4 shrink-0 rounded-[32px] bg-[#00A86B] text-white text-xs font-bold leading-[18px] flex items-center gap-1.5 hover:bg-[#009B63] transition-colors ml-auto cursor-pointer">
                <Upload className="w-3.5 h-3.5" /> Upload
              </button>
              <div className="relative shrink-0 action-dropdown-container">
                <button onClick={() => selectedCourierCodOrders.length > 0 && setShowCourierActionMenu(!showCourierActionMenu)} disabled={selectedCourierCodOrders.length === 0}
                  className={`py-2 pl-4 pr-8 rounded-[32px] border text-xs leading-[18px] flex items-center font-medium relative transition-colors ${selectedCourierCodOrders.length > 0 ? 'border-[#03C27D] bg-white text-[#64748B] hover:bg-[#F0FDF9] cursor-pointer' : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#CBD5E1] cursor-not-allowed'}`}>
                  Actions <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2" />
                </button>
                {showCourierActionMenu && selectedCourierCodOrders.length > 0 && (
                  <div className="absolute right-0 top-full mt-2 w-[180px] bg-white rounded-xl shadow-lg border border-[#E2E8F0] py-2 z-50">
                    <button onClick={() => { const rows = courierRemittanceList.filter(r => selectedCourierCodOrders.includes(r.id)); handleExportCsv(rows, 'courier_cod.csv'); setShowCourierActionMenu(false); }} className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] flex items-center gap-2"><Download className="w-4 h-4 text-[#00A86B]" />Export Data</button>
                  </div>
                )}
              </div>
            </div>
            {selectedCourierCodOrders.length > 0 && (
              <div className="hidden md:flex px-4 py-2 bg-emerald-50 border-b border-emerald-100 items-center gap-3 shrink-0">
                <span className="text-xs font-bold text-emerald-700">{selectedCourierCodOrders.length} selected</span>
                <button onClick={() => setSelectedCourierCodOrders([])} className="text-xs text-[#64748B] hover:text-red-500">Clear</button>
              </div>
            )}
            <div className="hidden md:block flex-1 overflow-y-auto overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead className="sticky top-0 z-30 bg-[#E6F9F2] shadow-sm">
                  <tr className="border border-[#B9EFDB]">
                    <th className="py-2 px-4 w-10 rounded-l-lg">
                      <input type="checkbox" checked={selectedCourierCodOrders.length === filteredCourierRemittanceList.length && filteredCourierRemittanceList.length > 0} onChange={toggleAllCourierCod} className="rounded accent-[#00A86B] w-3.5 h-3.5" />
                    </th>
                    {isAdminView && <th className={thBase}><User className="w-3.5 h-3.5 inline mr-1" />User Details</th>}
                    <th className={thBase}><FileText className="w-3.5 h-3.5 inline mr-1" />Order Details</th>
                    <th className={thBase}><Truck className="w-3.5 h-3.5 inline mr-1" />Shipping Details</th>
                    <th className={thBase}><Banknote className="w-3.5 h-3.5 inline mr-1" />COD Amount</th>
                    <th className={`${thBase} rounded-r-lg`}><Check className="w-3.5 h-3.5 inline mr-1" />Status</th>
                  </tr>
                </thead>
                <tbody className="text-[11px] text-[#475569]">
                  {filteredCourierRemittanceList.length === 0 ? (
                    <EmptyRow cols={isAdminView ? 6 : 5} msg="No courier remittance records found" />
                  ) : filteredCourierRemittanceList.map((order, idx) => (
                    <tr key={order.id} className={`border-b border-[#E2E8F0] transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-[#E6EDF7]/20'}`}>
                      <td className="p-4">
                        <input type="checkbox" checked={selectedCourierCodOrders.includes(order.id)} onChange={() => toggleSelectCourierCod(order.id)} className="rounded accent-[#00A86B] w-3.5 h-3.5" />
                      </td>
                      {isAdminView && (
                        <td className="p-4">
                          <div className="text-xs font-semibold text-[#00A86B]">{order.userId}</div>
                          <TruncatedText text={order.userName} maxLength={20} className="text-sm font-semibold text-[#0F172A] mt-0.5 max-w-[160px]" />
                          <TruncatedText text={order.userEmail} maxLength={25} className="text-xs font-normal text-[#94A3B8] max-w-[180px]" />
                        </td>
                      )}
                      <td className="p-4">
                        {order.orderID ? renderCopyable(order.orderID, 'Order ID', "text-xs font-semibold text-[#00A86B] cursor-pointer", () => navigate(`${isAdminView ? '/admin' : '/user'}/order-tracking?id=${order.orderID}`)) : <div className="text-xs font-semibold text-[#00A86B]">—</div>}
                      </td>
                      <td className="p-4">
                        <div className="text-xs font-semibold text-[#00A86B]">{order.courierName}</div>
                        <div className="text-xs font-normal text-[#94A3B8] mt-0.5">Delivered On : {withOrdinalSuffix(order.date)}</div>
                        <div className="mt-0.5">
                          {order.awb ? renderCopyable(order.awb, 'AWB', "text-xs font-semibold text-[#00A86B] hover:underline cursor-pointer", () => navigate(`${isAdminView ? '/admin' : '/user'}/tracking?awb=${order.awb}`)) : <div className="text-xs font-semibold text-[#00A86B]">—</div>}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-normal text-[#0F172A] text-xs">{fmtCurrency(order.codAmount)}</div>
                      </td>
                      <td className="p-4">
                        <span className={getStatusBadgeClass(order.status)}>{order.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <DesktopPagination
              page={courierPage}
              setPage={setCourierPage}
              totalPages={totalCourierPages}
              rowsPerPage={courierRowsPerPage}
              setRowsPerPage={setCourierRowsPerPage}
              startIndex={Math.min((courierPage - 1) * courierRowsPerPage + 1, courierRemittanceTotal)}
              endIndex={Math.min(courierPage * courierRowsPerPage, courierRemittanceTotal)}
              totalItems={courierRemittanceTotal}
            />

            {/* Mobile Card Layout */}
            <div className="md:hidden flex flex-col flex-1 min-h-0 bg-[#F8FAFC]">
              <div className="flex-1 overflow-y-auto">
                {filteredCourierRemittanceList.length === 0 ? (
                  <EmptyState title="No courier remittance records found" />
                ) : (
                  <div className="p-2 space-y-2">
                    {filteredCourierRemittanceList.map((order) => {
                      const accent = order.status === 'Paid' ? '#00A86B' : '#F59E0B';
                      return (
                        <div key={order.id} className="relative bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
                          <div className="px-2.5 pt-2.5 pb-2.5">
                            {/* Header Row — status badge on the left, checkbox on the right (no more corner ribbon) */}
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wider ${order.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                {order.status}
                              </span>
                              <input type="checkbox" checked={selectedCourierCodOrders.includes(order.id)} onChange={() => toggleSelectCourierCod(order.id)} className="rounded border-gray-300 accent-[#00A86B] w-4 h-4 shrink-0" />
                            </div>

                            {/* User Details + Order ID Row — each take half the row, with a centered vertical divider; user details admin-only */}
                            <div className="flex items-center gap-2 mb-1.5 min-w-0">
                              {isAdminView && (
                                <>
                                  <span className="flex-1 min-w-0 text-[12px] inline-flex items-baseline gap-1">
                                    <span className="font-semibold text-[#1E293B] text-[12px] leading-[18px] truncate">{(order.userName || '—').split(' ')[0]}</span>
                                    <span className="text-[#00A86B] font-semibold shrink-0">({order.userId || '—'})</span>
                                  </span>
                                  <span className="w-px h-3.5 bg-[#E2E8F0] shrink-0" />
                                </>
                              )}
                              {order.orderID && (
                                <div className="flex-1 min-w-0 flex items-center justify-end gap-1 group/copy">
                                  <div className="text-[12px] font-semibold text-[#00A86B] cursor-pointer hover:underline truncate text-right" onClick={() => navigate(`${isAdminView ? '/admin' : '/user'}/order-tracking?id=${order.orderID}`)}>{order.orderID}</div>
                                  <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(order.orderID).catch(()=>{}); showToast('success', 'Order ID copied!'); }} className="opacity-100 md:opacity-0 md:group-hover/copy:opacity-100 transition-opacity shrink-0 focus:outline-none" title="Copy Order ID"><Copy className="w-3 h-3 text-[#94A3B8] hover:text-[#00A86B]" /></button>
                                </div>
                              )}
                            </div>

                            {/* Courier / AWB / Amount Card */}
                            <div className="rounded-xl p-2 bg-white" style={{ border: `1px solid ${accent}` }}>
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                  <div className="w-9 h-9 bg-white border border-[#E2E8F0] rounded-xl flex items-center justify-center shrink-0 overflow-hidden p-1 shadow-sm">
                                    {order.courierName ? (
                                      <img
                                        src={getCourierLogo(order.courierName)}
                                        alt={order.courierName}
                                        className="w-full h-full object-contain"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(order.courierName)}&background=f8fafc&color=0f172a&bold=true&font-size=0.4`;
                                        }}
                                      />
                                    ) : (
                                      <Truck className="w-4 h-4 text-[#94A3B8]" />
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="text-[12px] font-normal text-[#0F172A] truncate">{order.courierName || '—'}</div>
                                    <div className="text-[11px] font-normal text-[#94A3B8] truncate mt-0.5">Delivered On: {withOrdinalSuffix(order.date)}</div>
                                    {order.awb ? (
                                      <div className="flex items-center gap-1 group/copy mt-0.5">
                                        <div className="text-[12px] font-semibold text-[#00A86B] underline truncate active:opacity-60 cursor-pointer" onClick={(e) => { e.stopPropagation(); navigate(`${isAdminView ? '/admin' : '/user'}/tracking?awb=${order.awb}`); }}>{order.awb}</div>
                                        <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(order.awb).catch(()=>{}); showToast('success', 'AWB copied!'); }} className="opacity-100 md:opacity-0 md:group-hover/copy:opacity-100 transition-opacity shrink-0 focus:outline-none" title="Copy AWB"><Copy className="w-3 h-3 text-[#94A3B8] hover:text-[#00A86B]" /></button>
                                      </div>
                                    ) : (
                                      <div className="text-[12px] font-semibold text-[#94A3B8] truncate mt-0.5">—</div>
                                    )}
                                  </div>
                                </div>
                                <div className="text-[12px] font-semibold text-[#00A86B] shrink-0">{fmtCurrency(order.codAmount)}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Mobile Pagination */}
              {<MobilePaginationBar {...({
                page: courierPage,
                setPage: setCourierPage,
                totalPages: totalCourierPages,
                rowsPerPage: courierRowsPerPage,
                setRowsPerPage: setCourierRowsPerPage,
                startIndex: Math.min((courierPage - 1) * courierRowsPerPage + 1, courierRemittanceTotal),
                endIndex: Math.min(courierPage * courierRowsPerPage, courierRemittanceTotal),
                totalItems: courierRemittanceTotal,
              })} />}
            </div>
          </>
        )}
      </div>
      </div>

      {/* ── Bank Response Upload Modal ── */}
      <SharedUploadModal
        open={showBankResponseUpload}
        onClose={() => setShowBankResponseUpload(false)}
        title="Upload Bank Response"
        subtitle="Upload the CSV/Excel file received from the bank"
        accept=".xlsx,.xls,.csv"
        fileHint="XLSX, XLS or CSV supported"
        chooseFileLabel="Choose Bank Response File"
        uploadButtonLabel="Confirm & Submit"
        onUpload={handleCODUpload}
        extraContent={
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-[11px] text-blue-700">
            <p className="font-bold mb-1">How it works:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Only rows with <strong>Status = "Successful"</strong> are processed.</li>
              <li>Matched by <strong>Beneficiary Account + Amount</strong>.</li>
              <li>Matched items are automatically marked as <strong>Paid</strong>.</li>
            </ul>
          </div>
        }
      />

      {/* ── Courier COD Upload Modal ── */}
      <SharedUploadModal
        open={showCourierUpload}
        onClose={() => setShowCourierUpload(false)}
        title="Upload Courier COD Remittance"
        subtitle="Upload the courier COD remittance file"
        chooseFileLabel="Choose Excel File"
        onDownloadSample={handleCourierCodDownloadSample}
        downloadSampleLabel="Download Sample"
        uploadButtonLabel="Submit"
        onUpload={handleCourierCodUpload}
      />

      {/* ── Remittance Detail Modal (Seller tab) ── */}
      <AnimatePresence>
        {remittanceDetailId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4"
            onClick={() => setRemittanceDetailId(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full mx-auto overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
                <div>
                  <h3 className="text-[14px] font-bold text-[#0F172A]">Remittance Details</h3>
                  <p className="text-[11px] text-[#64748B] mt-0.5">ID: <span className="text-[#00A86B] font-semibold">{remittanceDetailId}</span></p>
                </div>
                <button onClick={() => setRemittanceDetailId(null)} className="p-1.5 hover:bg-[#F8FAFC] rounded-lg">
                  <X className="w-4 h-4 text-[#64748B]" />
                </button>
              </div>

              <div className="p-5 max-h-[60vh] overflow-y-auto">
                {remittanceDetailLoading ? (
                  <div className="py-12 text-center">
                    <div className="w-8 h-8 border-2 border-[#00A86B] border-t-transparent rounded-full animate-spin mx-auto" />
                    <div className="text-[12px] text-[#64748B] mt-2">Loading...</div>
                  </div>
                ) : remittanceDetail ? (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-[12px] text-[#475569]">
                        Total: <span className="font-bold text-[#0F172A]">
                          {fmtCurrency(
                            (remittanceDetail.orderDataInArray || []).reduce(
                              (s: number, i: any) => s + (Number(i.paymentDetails?.amount) || 0), 0
                            )
                          )}
                        </span>
                      </div>
                      <span className={getStatusBadgeClass(remittanceDetail.status || 'Pending')}>
                        {remittanceDetail.status || 'Pending'}
                      </span>
                    </div>
                    <table className="w-full text-left border-collapse min-w-[600px] text-[12px]">
                      <thead className="bg-[#E6F9F2] sticky top-0 z-10">
                        <tr>
                          <th className="px-3 py-2 text-[10px] font-bold text-[#00A86B] uppercase">Order ID</th>
                          <th className="px-3 py-2 text-[10px] font-bold text-[#00A86B] uppercase">Courier</th>
                          <th className="px-3 py-2 text-[10px] font-bold text-[#00A86B] uppercase">AWB Number</th>
                          <th className="px-3 py-2 text-[10px] font-bold text-[#00A86B] uppercase">Order Value</th>
                          <th className="px-3 py-2 text-[10px] font-bold text-[#00A86B] uppercase">Payment Method</th>
                          <th className="px-3 py-2 text-[10px] font-bold text-[#00A86B] uppercase">Delivery Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(remittanceDetail.orderDataInArray || []).map((item: any, idx: number) => {
                          const lastTracking = item?.tracking?.at(-1);
                          return (
                            <tr key={idx} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC]">
                              <td className="px-3 py-2 text-[#00A86B] font-semibold">{item.orderId}</td>
                              <td className="px-3 py-2 text-[#64748B]">{item.courierServiceName}</td>
                              <td className="px-3 py-2">
                                <button
                                  onClick={() => {
                                    setRemittanceDetailId(null);
                                    navigate(`${isAdminView ? '/admin' : '/user'}/tracking?awb=${item.awb_number}`);
                                  }}
                                  className="text-[#00A86B] font-semibold hover:underline"
                                >
                                  {item.awb_number}
                                </button>
                              </td>
                              <td className="px-3 py-2 text-[#475569]">{fmtCurrency(item.paymentDetails?.amount)}</td>
                              <td className="px-3 py-2 text-[#475569]">{item.paymentDetails?.method || 'N/A'}</td>
                              <td className="px-3 py-2 text-[#64748B]">
                                {lastTracking
                                  ? new Date(lastTracking.StatusDateTime).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                                  : 'N/A'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </>
                ) : (
                  <div className="py-8 text-center text-[#94A3B8] font-medium">No details available</div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mobile Filters Bottom Sheet — All COD Orders ── */}
      <AnimatePresence>
        {isMobileFiltersOpen && (
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
                <h3 className="font-bold text-slate-800 text-base">Filters</h3>
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
                    onDateChange={onDateChange}
                    defaultStart={defStart}
                    defaultEnd={defEnd}
                  />
                </div>

                {isAdminView && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Search by name, email, or contact</label>
                    <input
                      type="text"
                      placeholder="Search user..."
                      value={codUserQuery}
                      onChange={(e) => onCodUserQueryChange(e.target.value)}
                      className="w-full h-11 px-4 rounded-full border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B]"
                    />
                    {codUserSuggestions.length > 0 && !codUserMongoId && (
                      <div className="mt-1 bg-white border border-[#E2E8F0] rounded-xl shadow-lg max-h-52 overflow-y-auto py-1">
                        {codUserSuggestions.map((u: any) => (
                          <button key={u._id} type="button" onClick={() => selectCodUserSuggestion(u)}
                            className="w-full text-left px-3 py-2 hover:bg-[#F0FDF4] flex items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="text-[12px] font-bold text-slate-800 truncate">{u.fullname}</div>
                              <div className="text-[11px] text-slate-400 truncate">{u.email} · {u.phoneNumber}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Order Id</label>
                  <input
                    type="text"
                    placeholder="Order Id"
                    value={codOrderId}
                    onChange={(e) => setCodOrderId(e.target.value)}
                    className="w-full h-11 px-4 rounded-full border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">AWB Number</label>
                  <input
                    type="text"
                    placeholder="AWB Number"
                    value={codAwb}
                    onChange={(e) => setCodAwb(e.target.value)}
                    className="w-full h-11 px-4 rounded-full border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
                  <select
                    value={selectedStatuses[0] || ''}
                    onChange={(e) => setSelectedStatuses(e.target.value ? [e.target.value] : [])}
                    className="w-full h-11 px-3 rounded-full border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B] bg-white"
                  >
                    <option value="">All Statuses</option>
                    {STATUS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
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
                    {codCourierOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-[#E2E8F0] flex items-center gap-3 sticky bottom-0 bg-white">
                <button
                  onClick={() => { clearCodOrderFilters(); setIsMobileFiltersOpen(false); }}
                  className="flex-1 h-11 rounded-full border border-[#E2E8F0] text-[#475569] text-sm font-bold hover:bg-[#F8FAFC] transition-colors"
                >
                  Reset All
                </button>
                <button
                  onClick={() => { setCurrentPage(1); fetchCodOrders(1); setIsMobileFiltersOpen(false); }}
                  className="flex-1 h-11 rounded-full bg-[#009D64] text-white text-sm font-bold hover:bg-[#009B63] transition-colors shadow-sm"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mobile Filters Bottom Sheet — Seller COD Remittance ── */}
      <AnimatePresence>
        {isMobileSellerFiltersOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[140] md:hidden flex items-end justify-center"
            onClick={() => setIsMobileSellerFiltersOpen(false)}
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
                <h3 className="font-bold text-slate-800 text-base">Filters</h3>
                <button onClick={() => setIsMobileSellerFiltersOpen(false)} className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Date Range</label>
                  <GlassDateFilter
                    className="w-full [&_.glass-dropdown-trigger]:!w-full [&_.glass-dropdown-trigger]:!h-11 [&_.glass-dropdown-trigger]:!min-w-0 [&_.glass-dropdown-trigger]:!rounded-full"
                    startDate={codDateStart}
                    endDate={codDateEnd}
                    onDateChange={onCodDateChange}
                    defaultStart={defStart}
                    defaultEnd={defEnd}
                  />
                </div>

                {isAdminView && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Search by name, email, or contact</label>
                    <input
                      type="text"
                      placeholder="Search user..."
                      value={sellerUserQuery}
                      onChange={(e) => onSellerUserQueryChange(e.target.value)}
                      className="w-full h-11 px-4 rounded-full border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B]"
                    />
                    {sellerUserSuggestions.length > 0 && !sellerUserMongoId && (
                      <div className="mt-1 bg-white border border-[#E2E8F0] rounded-xl shadow-lg max-h-52 overflow-y-auto py-1">
                        {sellerUserSuggestions.map((u: any) => (
                          <button key={u._id} type="button" onClick={() => selectSellerUserSuggestion(u)}
                            className="w-full text-left px-3 py-2 hover:bg-[#F0FDF4] flex items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="text-[12px] font-bold text-slate-800 truncate">{u.fullname}</div>
                              <div className="text-[11px] text-slate-400 truncate">{u.email} · {u.phoneNumber}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Remittance ID</label>
                  <input
                    type="text"
                    placeholder="Remittance ID"
                    value={sellerRemittanceId}
                    onChange={(e) => setSellerRemittanceId(e.target.value)}
                    className="w-full h-11 px-4 rounded-full border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
                  <select
                    value={selectedCodStatuses[0] || ''}
                    onChange={(e) => setSelectedCodStatuses(e.target.value ? [e.target.value] : [])}
                    className="w-full h-11 px-3 rounded-full border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B] bg-white"
                  >
                    <option value="">All Statuses</option>
                    {STATUS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-[#E2E8F0] flex items-center gap-3 sticky bottom-0 bg-white">
                <button
                  onClick={() => { clearSellerRemittanceFilters(); setIsMobileSellerFiltersOpen(false); }}
                  className="flex-1 h-11 rounded-full border border-[#E2E8F0] text-[#475569] text-sm font-bold hover:bg-[#F8FAFC] transition-colors"
                >
                  Reset All
                </button>
                <button
                  onClick={() => { setSellerPage(1); fetchSellerRemittance(1); setIsMobileSellerFiltersOpen(false); }}
                  className="flex-1 h-11 rounded-full bg-[#009D64] text-white text-sm font-bold hover:bg-[#009B63] transition-colors shadow-sm"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mobile Filters Bottom Sheet — Courier COD Remittance ── */}
      <AnimatePresence>
        {isMobileCourierFiltersOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[140] md:hidden flex items-end justify-center"
            onClick={() => setIsMobileCourierFiltersOpen(false)}
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
                <h3 className="font-bold text-slate-800 text-base">Filters</h3>
                <button onClick={() => setIsMobileCourierFiltersOpen(false)} className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Date Range</label>
                  <GlassDateFilter
                    className="w-full [&_.glass-dropdown-trigger]:!w-full [&_.glass-dropdown-trigger]:!h-11 [&_.glass-dropdown-trigger]:!min-w-0 [&_.glass-dropdown-trigger]:!rounded-full"
                    startDate={courierCodDateStart}
                    endDate={courierCodDateEnd}
                    onDateChange={onCourierCodDateChange}
                    defaultStart={defStart}
                    defaultEnd={defEnd}
                  />
                </div>

                {isAdminView && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Search by name, email, or contact</label>
                    <input
                      type="text"
                      placeholder="Search user..."
                      value={courierUserQuery}
                      onChange={(e) => onCourierUserQueryChange(e.target.value)}
                      className="w-full h-11 px-4 rounded-full border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B]"
                    />
                    {courierUserSuggestions.length > 0 && !courierUserMongoId && (
                      <div className="mt-1 bg-white border border-[#E2E8F0] rounded-xl shadow-lg max-h-52 overflow-y-auto py-1">
                        {courierUserSuggestions.map((u: any) => (
                          <button key={u._id} type="button" onClick={() => selectCourierUserSuggestion(u)}
                            className="w-full text-left px-3 py-2 hover:bg-[#F0FDF4] flex items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="text-[12px] font-bold text-slate-800 truncate">{u.fullname}</div>
                              <div className="text-[11px] text-slate-400 truncate">{u.email} · {u.phoneNumber}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Order Id</label>
                  <input
                    type="text"
                    placeholder="Order Id"
                    value={courierOrderId}
                    onChange={(e) => setCourierOrderId(e.target.value)}
                    className="w-full h-11 px-4 rounded-full border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">AWB Number</label>
                  <input
                    type="text"
                    placeholder="AWB Number"
                    value={courierAwb}
                    onChange={(e) => setCourierAwb(e.target.value)}
                    className="w-full h-11 px-4 rounded-full border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
                  <select
                    value={selectedCourierCodStatuses[0] || ''}
                    onChange={(e) => setSelectedCourierCodStatuses(e.target.value ? [e.target.value] : [])}
                    className="w-full h-11 px-3 rounded-full border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B] bg-white"
                  >
                    <option value="">All Statuses</option>
                    {STATUS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Courier Service</label>
                  <select
                    value={selectedCourierCouriers[0] || ''}
                    onChange={(e) => setSelectedCourierCouriers(e.target.value ? [e.target.value] : [])}
                    className="w-full h-11 px-3 rounded-full border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B] bg-white"
                  >
                    <option value="">All Couriers</option>
                    {courierCourierOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-[#E2E8F0] flex items-center gap-3 sticky bottom-0 bg-white">
                <button
                  onClick={() => { clearCourierRemittanceFilters(); setIsMobileCourierFiltersOpen(false); }}
                  className="flex-1 h-11 rounded-full border border-[#E2E8F0] text-[#475569] text-sm font-bold hover:bg-[#F8FAFC] transition-colors"
                >
                  Reset All
                </button>
                <button
                  onClick={() => { setCourierPage(1); fetchCourierRemittance(1); setIsMobileCourierFiltersOpen(false); }}
                  className="flex-1 h-11 rounded-full bg-[#009D64] text-white text-sm font-bold hover:bg-[#009B63] transition-colors shadow-sm"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Early COD Plan Modal (user view) ── */}
      {showEarlyCODModal && (
        <EarlyCODPlanModal userId={currentUserId} onClose={() => setShowEarlyCODModal(false)} />
      )}

      {/* ── Transfer COD Modal ── */}
      {showTransferModal && (
        <TransferCODModal
          userId={transferUserId}
          selectedRemittanceIds={transferIds}
          type={activeTab === 'Courier COD Remittance' ? 'courier' : 'seller'}
          onClose={() => { setShowTransferModal(false); setTransferUserId(''); setTransferIds([]); }}
          onSuccess={() => {
            if ((activeTab === 'Seller COD Remittance' || activeTab === 'COD Remittance')) fetchSellerRemittance(sellerPage);
            else if (activeTab === 'Courier COD Remittance') fetchCourierRemittance(courierPage);
          }}
        />
      )}

      <Toast toast={toast} onClose={closeToast} />
    </AdminLayout>
  );
}