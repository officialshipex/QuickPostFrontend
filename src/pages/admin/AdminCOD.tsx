import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../../services/apiClient';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { useAdminTab } from '../../context/AdminUserContext';
import {
  ChevronDown, RefreshCcw, Check, User, Truck, Banknote, Clock, Upload, Download,
  Wallet, Send, MinusCircle, FileText, AlertCircle, CheckCircle2, X, Package, Search, Filter, Copy
} from 'lucide-react';
import { GlassDropdown } from '../../components/ui/GlassDropdown';
import { GlassDateFilter } from '../../components/ui/GlassDateFilter';
import { TruncatedText } from '../../components/ui/TruncatedText';
import { TableLoader } from '../../components/ui/TableLoader';
import { TransferCODModal } from '../../components/ui/TransferCODModal';
import { useTableLoader } from '../../hooks/useTableLoader';
import { usePagination, DesktopPagination } from '../../hooks/usePagination';

const MAIN_TABS = [
  { name: 'All COD Orders' },
  { name: 'Seller COD Remittance' },
  { name: 'Courier COD Remittance' }
];

// Data mapping helpers â€" field names must match exact API response keys
const mapCodOrder = (item: any) => ({
  id: String(item._id || item.orderID || ''),
  orderID: String(item.orderID || ''),
  awb: item.AWB_Number || '',          // model field is AWB_Number (not AwbNumber)
  userId: item.userId || '',
  userName: item.userName || '',
  userEmail: item.Email || '',
  date: item.Date
    ? new Date(item.Date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'N/A',
  courier: item.courierProvider || '',
  codAmount: parseFloat(item.CODAmount) || 0,
  status: item.status || 'Pending',
});

const mapSellerRemittance = (item: any) => ({
  id: String(item._id || ''),
  awb: String(item.remittanceId || ''),   // awb field holds remittanceId for selection
  userName: item.user?.name || '',
  userEmail: item.user?.email || '',
  date: item.date
    ? new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'N/A',
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
  return `${STATUS_BADGE_STYLES[normalized] || 'bg-blue-50 text-blue-700 border-blue-200'} px-2.5 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap shadow-sm`;
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

export function AdminCOD() {
  const navigate = useNavigate();
  const { isAdmin, adminTab, loadingAdminTab } = useAdminTab();
  const isAdminView = isAdmin && adminTab;

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


  const [activeTab, setActiveTab] = useState('All COD Orders');
  const handleTabChange = (tab: string) => {
    // Clear all selections across tabs when switching
    setSelectedOrders([]);
    setSelectedCodOrders([]);
    setSelectedCourierCodOrders([]);
    // Push a history entry so the browser back button returns to the previous tab
    // instead of leaving the COD page entirely (e.g. going to wallet)
    if (tab !== activeTab) {
      window.history.pushState({ codTab: tab }, '', window.location.pathname);
    }
    setActiveTab(tab);
  };
  useEffect(() => { if (!isAdminView && activeTab !== 'All COD Orders') setActiveTab('All COD Orders'); }, [isAdminView]);

  // Handle browser back/forward button: switch to the previous tab instead of leaving the page
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const tab = e.state?.codTab;
      if (tab && MAIN_TABS.some(t => t.name === tab)) {
        setSelectedOrders([]);
        setSelectedCodOrders([]);
        setSelectedCourierCodOrders([]);
        setActiveTab(tab);
      } else if (activeTab !== 'All COD Orders') {
        // No tab state in history — go back to default tab
        setSelectedOrders([]);
        setSelectedCodOrders([]);
        setSelectedCourierCodOrders([]);
        setActiveTab('All COD Orders');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeTab]);

  // Broadcast active tab so the header search placeholder can reflect it
  useEffect(() => {
    (window as any).__adminCodTab = activeTab;
    window.dispatchEvent(new CustomEvent('admin-cod-tab-change', { detail: activeTab }));
    return () => { (window as any).__adminCodTab = ''; };
  }, [activeTab]);
  const handleRefresh = () => {
    if (activeTab === 'All COD Orders') fetchCodOrders(currentPage);
    else if (activeTab === 'Seller COD Remittance') fetchSellerRemittance(sellerPage);
    else fetchCourierRemittance(courierPage);
  };

  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [toast, setToast] = useState<{type: 'error' | 'success', text: string} | null>(null);
  const showToast = (type: 'error' | 'success', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3000);
  };

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

  const [codUserQuery, setCodUserQuery] = useState('');
  const [codUserSuggestions, setCodUserSuggestions] = useState<any[]>([]);
  const [codUserMongoId, setCodUserMongoId] = useState('');
  const [codOrderId, setCodOrderId] = useState('');
  const [codAwb, setCodAwb] = useState('');
  const [codOrdersList, setCodOrdersList] = useState<any[]>([]);
  const [codOrdersTotal, setCodOrdersTotal] = useState(0);
  const [codSummary, setCodSummary] = useState({ totalCODAmount: 0, paidCODAmount: 0, pendingCODAmount: 0 });
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedCouriers, setSelectedCouriers] = useState<string[]>([]);
  const [codCourierOptions, setCodCourierOptions] = useState<{ label: string; value: string }[]>([]);
  const [showAllCodActionMenu, setShowAllCodActionMenu] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);

  const [remittanceSearchTerm, setRemittanceSearchTerm] = useState('');
  const [selectedUtrs, setSelectedUtrs] = useState<string[]>([]);
  const [selectedCodStatuses, setSelectedCodStatuses] = useState<string[]>([]);
  const [codDateStart, setCodDateStart] = useState('');
  const [codDateEnd, setCodDateEnd] = useState('');
  const [selectedCodOrders, setSelectedCodOrders] = useState<string[]>([]);
  const [bankExportLoading, setBankExportLoading] = useState(false);
  const [showBankResponseUpload, setShowBankResponseUpload] = useState(false);
  const [bankResponseUploading, setBankResponseUploading] = useState(false);
  const [selectedBankFile, setSelectedBankFile] = useState<File | null>(null);
  const bankFileInputRef = useRef<HTMLInputElement>(null);
  const [sellerUserQuery, setSellerUserQuery] = useState('');
  const [sellerUserSuggestions, setSellerUserSuggestions] = useState<any[]>([]);
  const [sellerUserMongoId, setSellerUserMongoId] = useState('');
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
  const [courierCodDateStart, setCourierCodDateStart] = useState('');
  const [courierCodDateEnd, setCourierCodDateEnd] = useState('');
  const [selectedCourierCodOrders, setSelectedCourierCodOrders] = useState<string[]>([]);
  const [showCourierActionMenu, setShowCourierActionMenu] = useState(false);
  const [courierUserQuery, setCourierUserQuery] = useState('');
  const [courierUserSuggestions, setCourierUserSuggestions] = useState<any[]>([]);
  const [courierUserMongoId, setCourierUserMongoId] = useState('');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as Element).closest('.action-dropdown-container')) {
        setShowAllCodActionMenu(false);
        setShowActionMenu(false);
        setShowCourierActionMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [isLoading, setIsLoading] = useState(false);
  const [codRowsPerPage, setCodRowsPerPage] = useState(20);
  const [sellerRowsPerPage, setSellerRowsPerPage] = useState(20);
  const [courierRowsPerPage, setCourierRowsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

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
      const res = await apiClient.get('/cod/getAdminCodRemitanceData', { params });
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
  }, [sellerUserMongoId, sellerRemittanceId, codDateStart, codDateEnd, selectedCodStatuses, isAdminView, sellerRowsPerPage]);

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
      case 'Seller COD Remittance': fetchSellerRemittance(1); break;
      case 'Courier COD Remittance': fetchCourierRemittance(1); break;
    }
  }, [activeTab, loadingAdminTab]);

  // Effects for rows per page change
  useEffect(() => {
    if (!loadingAdminTab && activeTab === 'All COD Orders') {
      setCurrentPage(1); fetchCodOrders(1);
    }
  }, [codRowsPerPage]);

  useEffect(() => {
    if (!loadingAdminTab && activeTab === 'Seller COD Remittance') {
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

  // User search debounce effects
  const makeUserSearchEffect = (query: string, setSuggestions: (v: any[]) => void) => {
    if (!isAdminView || query.trim().length < 2) { setSuggestions([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await apiClient.get(`/admin/searchUser?query=${encodeURIComponent(query)}`);
        setSuggestions(res.data.users || []);
      } catch { setSuggestions([]); }
    }, 300);
    return () => clearTimeout(timer);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => makeUserSearchEffect(codUserQuery, setCodUserSuggestions), [codUserQuery, isAdminView]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => makeUserSearchEffect(sellerUserQuery, setSellerUserSuggestions), [sellerUserQuery, isAdminView]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => makeUserSearchEffect(courierUserQuery, setCourierUserSuggestions), [courierUserQuery, isAdminView]);

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
  const handleBankResponseSubmit = async () => {
    if (!selectedBankFile) return;
    setBankResponseUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = new TextDecoder().decode(e.target?.result as ArrayBuffer);
        const lines = text.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
        const rows = lines.slice(1).map(line => {
          const vals = line.split(',').map(v => v.replace(/"/g, '').trim());
          return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']));
        });
        const mappedRows = rows.map(r => ({
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
        showToast('success', `Processed: ${successCount} paid, ${skippedCount} skipped, ${errorCount} errors`);
        setShowBankResponseUpload(false); setSelectedBankFile(null);
        fetchSellerRemittance(sellerPage);
      } catch (err: any) {
        showToast('error', err?.response?.data?.message || 'Failed to process bank response');
      } finally { setBankResponseUploading(false); }
    };
    reader.readAsArrayBuffer(selectedBankFile);
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
    <tr><td colSpan={cols} className="p-8 text-center text-[#64748B] font-medium">{msg}</td></tr>
  );

  const thBase = 'p-3 whitespace-nowrap text-xs font-medium text-[#00A86B] uppercase tracking-wider';

  return (
    <AdminLayout>
      <div className="flex flex-col h-[calc(100vh-72px)] -m-4 md:-m-6 bg-white">

        {/* Tab Navigation */}
        <div className="bg-white relative z-50 shrink-0">
          <div className="flex justify-between items-center px-6 py-2 border-b border-[#E2E8F0] overflow-x-auto no-scrollbar">
            <div className="flex gap-6 items-center shrink-0">
              {(isAdminView ? MAIN_TABS : MAIN_TABS.filter(t => t.name === 'All COD Orders')).map(tab => (
                <button
                  key={tab.name}
                  onClick={() => handleTabChange(tab.name)}
                  className={`relative py-3 text-[13px] font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === tab.name ? 'text-[#00A86B]' : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  {tab.name}
                  {activeTab === tab.name && (
                    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#00A86B] rounded-t-full" />
                  )}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 shrink-0 ml-4">
              <button onClick={handleRefresh} className="w-8 h-8 rounded-full border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-[#F8FAFC]">
                <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
          {activeTab === 'Seller COD Remittance' && (
            <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC]/30 flex flex-nowrap overflow-x-auto gap-4 no-scrollbar">
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
          )}
          {activeTab === 'Courier COD Remittance' && (
            <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC]/30 flex flex-nowrap overflow-x-auto gap-4 no-scrollbar">
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
          )}
          {activeTab === 'All COD Orders' && (
            <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC]/30 flex flex-nowrap overflow-x-auto gap-4 no-scrollbar">
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
          )}
        </div>

      {/* â"€â"€ Table Section â"€â"€ */}
      <div className="bg-white flex flex-col flex-1 min-h-0 overflow-hidden border-t border-[#E2E8F0] relative">
        {isLoading && <TableLoader />}

        {/* All COD Orders Tab */}
        {activeTab === 'All COD Orders' && (
          <>
            {/* Filter Bar */}
            <div className="p-3 border-b border-[#E2E8F0] flex flex-wrap items-center gap-2.5 bg-[#F8FAFC]/50 shrink-0">
              {isAdminView && (
                <div className="relative shrink-0">
                  <div className="relative">
                    <input type="text" placeholder="Search user..." value={codUserQuery}
                      onChange={e => { setCodUserQuery(e.target.value); if (!e.target.value.trim()) { setCodUserMongoId(''); setCodUserSuggestions([]); } }}
                      className="glass-search-input w-[160px]" style={{ paddingLeft: '2rem', paddingRight: '2rem' }} />
                    <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 top-1/2 -translate-y-1/2" />
                    {codUserMongoId && <CheckCircle2 className="w-3.5 h-3.5 text-[#00A86B] absolute right-2.5 top-1/2 -translate-y-1/2" />}
                  </div>
                  {codUserSuggestions.length > 0 && !codUserMongoId && (
                    <div className="absolute left-0 top-full mt-1 bg-white border border-[#E2E8F0] rounded-xl shadow-xl z-50 w-64 max-h-52 overflow-y-auto py-1">
                      {codUserSuggestions.map((u: any) => (
                        <button key={u._id} type="button" onClick={() => { setCodUserMongoId(u._id); setCodUserQuery(`${u.fullname} (${u.email})`); setCodUserSuggestions([]); }}
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
              <GlassDateFilter startDate={dateStart} endDate={dateEnd} onDateChange={(s, e) => { setDateStart(s); setDateEnd(e); }} />
              <button onClick={() => { setCurrentPage(1); fetchCodOrders(1); }}
                className="h-9 px-4 shrink-0 rounded-lg bg-[#00A86B] text-white text-xs font-bold hover:bg-[#009B63] transition-colors shadow-sm">Apply</button>
              <div className="ml-auto flex items-center gap-2 shrink-0">
                <button onClick={() => { if (selectedOrders.length === 0) { showToast('error', 'Select rows to export.'); return; } const rows = codOrdersList.filter(o => selectedOrders.includes(o.id)); handleExportCsv(rows, 'cod_orders.csv'); }}
                  className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors ${selectedOrders.length > 0 ? 'border-[#00A86B] text-[#00A86B] hover:bg-[#00A86B]/5' : 'border-[#E2E8F0] text-[#CBD5E1] cursor-not-allowed'}`}>
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
            {selectedOrders.length > 0 && (
              <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-100 flex items-center gap-3 shrink-0">
                <span className="text-xs font-bold text-emerald-700">{selectedOrders.length} selected</span>
                <button onClick={() => setSelectedOrders([])} className="text-xs text-[#64748B] hover:text-red-500">Clear</button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead className="sticky top-0 z-30 bg-[#E6F5F1] shadow-sm">
                  <tr>
                    <th className="p-3 w-10">
                      <input type="checkbox" checked={selectedOrders.length === paginatedOrders.length && paginatedOrders.length > 0} onChange={toggleAll} className="rounded accent-[#00A86B] w-3.5 h-3.5" />
                    </th>
                    {isAdminView && <th className={thBase}><User className="w-3.5 h-3.5 inline mr-1" />User Details</th>}
                    <th className={thBase}>Order Details</th>
                    <th className={thBase}><Truck className="w-3.5 h-3.5 inline mr-1" />Shipping Details</th>
                    <th className={thBase}><Banknote className="w-3.5 h-3.5 inline mr-1" />COD Amount</th>
                    <th className={thBase}><Check className="w-3.5 h-3.5 inline mr-1" />Status</th>
                  </tr>
                </thead>
                <tbody className="text-[11px] text-[#475569]">
                  {paginatedOrders.length === 0 ? (
                    <EmptyRow cols={isAdminView ? 6 : 5} msg="No COD orders found" />
                  ) : paginatedOrders.map(order => (
                    <tr key={order.id} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors">
                      <td className="p-3">
                        <input type="checkbox" checked={selectedOrders.includes(order.id)} onChange={() => toggleSelect(order.id)} className="rounded accent-[#00A86B] w-3.5 h-3.5" />
                      </td>
                      {isAdminView && (
                        <td className="p-3">
                          <div className="text-[11px] font-semibold text-[#00A86B]">{order.userId}</div>
                          <TruncatedText text={order.userName} maxLength={20} className="text-sm font-semibold text-[#0F172A] mt-0.5 max-w-[160px]" />
                          <TruncatedText text={order.userEmail} maxLength={25} className="text-xs font-normal text-[#94A3B8] max-w-[180px]" />
                        </td>
                      )}
                      <td className="p-3">
                        {order.orderID ? renderCopyable(order.orderID, 'Order ID', "text-xs font-semibold text-[#00A86B] cursor-pointer") : <div className="text-xs font-semibold text-[#00A86B]">—</div>}
                      </td>
                      <td className="p-3">
                        <div className="text-xs font-semibold text-[#00A86B]">{order.courier}</div>
                        <div className="text-xs font-normal text-[#94A3B8] mt-0.5">Delivered On : {withOrdinalSuffix(order.date)}</div>
                        <div className="mt-0.5">
                          {order.awb ? renderCopyable(order.awb, 'AWB', "text-xs font-semibold text-[#00A86B] hover:underline cursor-pointer") : <div className="text-xs font-semibold text-[#00A86B]">—</div>}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-normal text-[#0F172A] text-xs">{fmtCurrency(order.codAmount)}</div>
                      </td>
                      <td className="p-3">
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
          </>
        )}

        {/* Seller COD Remittance Tab */}
        {activeTab === 'Seller COD Remittance' && (
          <>
            {/* Filter Bar */}
            <div className="p-3 border-b border-[#E2E8F0] flex flex-wrap items-center gap-2.5 bg-[#F8FAFC]/50 shrink-0">
              {isAdminView && (
                <div className="relative shrink-0">
                  <div className="relative">
                    <input type="text" placeholder="Search user..." value={sellerUserQuery}
                      onChange={e => { setSellerUserQuery(e.target.value); if (!e.target.value.trim()) { setSellerUserMongoId(''); setSellerUserSuggestions([]); } }}
                      className="glass-search-input w-[160px]" style={{ paddingLeft: '2rem', paddingRight: '2rem' }} />
                    <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 top-1/2 -translate-y-1/2" />
                    {sellerUserMongoId && <CheckCircle2 className="w-3.5 h-3.5 text-[#00A86B] absolute right-2.5 top-1/2 -translate-y-1/2" />}
                  </div>
                  {sellerUserSuggestions.length > 0 && !sellerUserMongoId && (
                    <div className="absolute left-0 top-full mt-1 bg-white border border-[#E2E8F0] rounded-xl shadow-xl z-50 w-64 max-h-52 overflow-y-auto py-1">
                      {sellerUserSuggestions.map((u: any) => (
                        <button key={u._id} type="button" onClick={() => { setSellerUserMongoId(u._id); setSellerUserQuery(`${u.fullname} (${u.email})`); setSellerUserSuggestions([]); }}
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
              <GlassDateFilter startDate={codDateStart} endDate={codDateEnd} onDateChange={(s, e) => { setCodDateStart(s); setCodDateEnd(e); }} />
              <button onClick={() => { setSellerPage(1); fetchSellerRemittance(1); }}
                className="h-9 px-4 shrink-0 rounded-lg bg-[#00A86B] text-white text-xs font-bold hover:bg-[#009B63] transition-colors shadow-sm">Apply</button>
              <div className="relative shrink-0 ml-auto action-dropdown-container">
                <button onClick={() => selectedCodOrders.length > 0 && setShowActionMenu(!showActionMenu)} disabled={selectedCodOrders.length === 0}
                  className={`h-9 pl-4 pr-8 rounded-full border text-xs font-bold relative transition-colors ${selectedCodOrders.length > 0 ? 'border-[#00A86B] text-[#00A86B] bg-white hover:bg-[#F0FDF4]' : 'border-[#E2E8F0] text-[#CBD5E1] bg-[#F8FAFC] cursor-not-allowed'}`}>
                  Actions <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2" />
                </button>
                {showActionMenu && selectedCodOrders.length > 0 && (
                  <div className="absolute right-0 top-full mt-2 w-[200px] bg-white rounded-xl shadow-lg border border-[#E2E8F0] py-2 z-50">
                    <button onClick={() => { const rows = sellerRemittanceList.filter(r => selectedCodOrders.includes(r.awb)); handleExportCsv(rows, 'seller_remittances.csv'); }} className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] flex items-center gap-2"><Download className="w-4 h-4 text-[#00A86B]" />Export Data</button>
                    <button onClick={handleExportBankTemplate} disabled={bankExportLoading} className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] flex items-center gap-2"><FileText className="w-4 h-4 text-blue-500" />{bankExportLoading ? 'Generating…' : 'Export Bank Template'}</button>
                    <button onClick={handleOpenBankResponseUpload} className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] flex items-center gap-2"><Upload className="w-4 h-4 text-orange-500" />Upload Bank Response</button>
                    <div className="border-t border-[#E2E8F0] my-1" />
                    <button onClick={() => { setShowActionMenu(false); handleTransferCOD('seller'); }} className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#00A86B] hover:bg-[#F0FDF4] flex items-center gap-2"><Send className="w-4 h-4" />Transfer COD</button>
                  </div>
                )}
              </div>
            </div>
            {selectedCodOrders.length > 0 && (
              <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-100 flex items-center gap-3 shrink-0">
                <span className="text-xs font-bold text-emerald-700">{selectedCodOrders.length} selected</span>
                <button onClick={() => handleTransferCOD('seller')} className="h-7 px-3 rounded-md bg-[#00A86B] text-white text-xs font-bold shadow-sm hover:bg-[#009B63]">Transfer COD</button>
                <button onClick={() => setSelectedCodOrders([])} className="text-xs text-[#64748B] hover:text-red-500">Clear</button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse min-w-[1200px]">
                <thead className="sticky top-0 z-30 bg-[#E6F5F1] shadow-sm">
                  <tr>
                    <th className="p-3 w-10">
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
                    <th className={thBase}><Check className="w-3.5 h-3.5 inline mr-1" />Status</th>
                  </tr>
                </thead>
                <tbody className="text-[11px] text-[#475569]">
                  {filteredSellerRemittanceList.length === 0 ? (
                    <EmptyRow cols={isAdminView ? 10 : 9} msg="No seller remittance records found" />
                  ) : filteredSellerRemittanceList.map(order => (
                    <tr key={order.id || order.awb} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors">
                      <td className="p-3">
                        <input type="checkbox" checked={selectedCodOrders.includes(order.awb)} onChange={() => toggleSelectCod(order.awb)} className="rounded accent-[#00A86B] w-3.5 h-3.5" />
                      </td>
                      {isAdminView && (
                        <td className="p-3">
                          <TruncatedText text={order.userName} maxLength={20} className="text-sm font-semibold text-[#0F172A] max-w-[160px]" />
                          <TruncatedText text={order.userEmail} maxLength={25} className="text-xs font-normal text-[#94A3B8] max-w-[180px]" />
                        </td>
                      )}
                      <td className="p-3">
                        {order.awb ? (
                          <div className="flex items-center gap-1.5 group/copy w-max">
                            <TruncatedText text={order.awb} maxLength={6} className="text-xs font-semibold text-[#00A86B] cursor-default" />
                            <button
                              onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(order.awb); showToast('success', 'Remittance ID copied!'); }}
                              className="opacity-100 md:opacity-0 md:group-hover/copy:opacity-100 transition-opacity focus:outline-none"
                              title="Copy Remittance ID"
                            >
                              <Copy className="w-3 h-3 text-[#94A3B8] hover:text-[#00A86B]" />
                            </button>
                          </div>
                        ) : <div className="text-xs font-semibold text-[#00A86B]">—</div>}
                        <div className="text-xs font-normal text-[#94A3B8] mt-0.5">{order.paymentMethod}</div>
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
                      <td className="p-3">
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
          </>
        )}

        {/* Courier COD Remittance Tab */}
        {activeTab === 'Courier COD Remittance' && (
          <>
            {/* Filter Bar */}
            <div className="p-3 border-b border-[#E2E8F0] flex flex-wrap items-center gap-2.5 bg-[#F8FAFC]/50 shrink-0">
              {isAdminView && (
                <div className="relative shrink-0">
                  <div className="relative">
                    <input type="text" placeholder="Search user..." value={courierUserQuery}
                      onChange={e => { setCourierUserQuery(e.target.value); if (!e.target.value.trim()) { setCourierUserMongoId(''); setCourierUserSuggestions([]); } }}
                      className="glass-search-input w-[160px]" style={{ paddingLeft: '2rem', paddingRight: '2rem' }} />
                    <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 top-1/2 -translate-y-1/2" />
                    {courierUserMongoId && <CheckCircle2 className="w-3.5 h-3.5 text-[#00A86B] absolute right-2.5 top-1/2 -translate-y-1/2" />}
                  </div>
                  {courierUserSuggestions.length > 0 && !courierUserMongoId && (
                    <div className="absolute left-0 top-full mt-1 bg-white border border-[#E2E8F0] rounded-xl shadow-xl z-50 w-64 max-h-52 overflow-y-auto py-1">
                      {courierUserSuggestions.map((u: any) => (
                        <button key={u._id} type="button" onClick={() => { setCourierUserMongoId(u._id); setCourierUserQuery(`${u.fullname} (${u.email})`); setCourierUserSuggestions([]); }}
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
              <GlassDateFilter startDate={courierCodDateStart} endDate={courierCodDateEnd} onDateChange={(s, e) => { setCourierCodDateStart(s); setCourierCodDateEnd(e); }} />
              <button onClick={() => { setCourierPage(1); fetchCourierRemittance(1); }}
                className="h-9 px-4 shrink-0 rounded-lg bg-[#00A86B] text-white text-xs font-bold hover:bg-[#009B63] transition-colors shadow-sm">Apply</button>
              <div className="relative shrink-0 ml-auto action-dropdown-container">
                <button onClick={() => selectedCourierCodOrders.length > 0 && setShowCourierActionMenu(!showCourierActionMenu)} disabled={selectedCourierCodOrders.length === 0}
                  className={`h-9 pl-4 pr-8 rounded-full border text-xs font-bold relative transition-colors ${selectedCourierCodOrders.length > 0 ? 'border-[#00A86B] text-[#00A86B] bg-white hover:bg-[#F0FDF4]' : 'border-[#E2E8F0] text-[#CBD5E1] bg-[#F8FAFC] cursor-not-allowed'}`}>
                  Actions <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2" />
                </button>
                {showCourierActionMenu && selectedCourierCodOrders.length > 0 && (
                  <div className="absolute right-0 top-full mt-2 w-[180px] bg-white rounded-xl shadow-lg border border-[#E2E8F0] py-2 z-50">
                    <button onClick={() => { const rows = courierRemittanceList.filter(r => selectedCourierCodOrders.includes(r.id)); handleExportCsv(rows, 'courier_cod.csv'); }} className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] flex items-center gap-2"><Download className="w-4 h-4 text-[#00A86B]" />Export Data</button>
                    <div className="border-t border-[#E2E8F0] my-1" />
                    <button onClick={() => { setShowCourierActionMenu(false); handleTransferCOD('courier'); }} className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#00A86B] hover:bg-[#F0FDF4] flex items-center gap-2"><Send className="w-4 h-4" />Transfer COD</button>
                  </div>
                )}
              </div>
            </div>
            {selectedCourierCodOrders.length > 0 && (
              <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-100 flex items-center gap-3 shrink-0">
                <span className="text-xs font-bold text-emerald-700">{selectedCourierCodOrders.length} selected</span>
                <button onClick={() => handleTransferCOD('courier')} className="h-7 px-3 rounded-md bg-[#00A86B] text-white text-xs font-bold shadow-sm hover:bg-[#009B63]">Transfer COD</button>
                <button onClick={() => setSelectedCourierCodOrders([])} className="text-xs text-[#64748B] hover:text-red-500">Clear</button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead className="sticky top-0 z-30 bg-[#E6F5F1] shadow-sm">
                  <tr>
                    <th className="p-3 w-10">
                      <input type="checkbox" checked={selectedCourierCodOrders.length === filteredCourierRemittanceList.length && filteredCourierRemittanceList.length > 0} onChange={toggleAllCourierCod} className="rounded accent-[#00A86B] w-3.5 h-3.5" />
                    </th>
                    {isAdminView && <th className={thBase}><User className="w-3.5 h-3.5 inline mr-1" />User Details</th>}
                    <th className={thBase}>Order Details</th>
                    <th className={thBase}><Truck className="w-3.5 h-3.5 inline mr-1" />Shipping Details</th>
                    <th className={thBase}><Banknote className="w-3.5 h-3.5 inline mr-1" />COD Amount</th>
                    <th className={thBase}><Check className="w-3.5 h-3.5 inline mr-1" />Status</th>
                  </tr>
                </thead>
                <tbody className="text-[11px] text-[#475569]">
                  {filteredCourierRemittanceList.length === 0 ? (
                    <EmptyRow cols={isAdminView ? 6 : 5} msg="No courier remittance records found" />
                  ) : filteredCourierRemittanceList.map(order => (
                    <tr key={order.id} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors">
                      <td className="p-3">
                        <input type="checkbox" checked={selectedCourierCodOrders.includes(order.id)} onChange={() => toggleSelectCourierCod(order.id)} className="rounded accent-[#00A86B] w-3.5 h-3.5" />
                      </td>
                      {isAdminView && (
                        <td className="p-3">
                          <div className="text-xs font-semibold text-[#00A86B]">{order.userId}</div>
                          <TruncatedText text={order.userName} maxLength={20} className="text-sm font-semibold text-[#0F172A] mt-0.5 max-w-[160px]" />
                          <TruncatedText text={order.userEmail} maxLength={25} className="text-xs font-normal text-[#94A3B8] max-w-[180px]" />
                        </td>
                      )}
                      <td className="p-3">
                        {order.orderID ? renderCopyable(order.orderID, 'Order ID', "text-xs font-semibold text-[#00A86B] cursor-pointer") : <div className="text-xs font-semibold text-[#00A86B]">—</div>}
                      </td>
                      <td className="p-3">
                        <div className="text-xs font-semibold text-[#00A86B]">{order.courierName}</div>
                        <div className="text-xs font-normal text-[#94A3B8] mt-0.5">Delivered On : {withOrdinalSuffix(order.date)}</div>
                        <div className="mt-0.5">
                          {order.awb ? renderCopyable(order.awb, 'AWB', "text-xs font-semibold text-[#00A86B] hover:underline cursor-pointer", () => navigate('/admin/tracking', { state: { awb: order.awb } })) : <div className="text-xs font-semibold text-[#00A86B]">—</div>}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-normal text-[#0F172A] text-xs">{fmtCurrency(order.codAmount)}</div>
                      </td>
                      <td className="p-3">
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
          </>
        )}
      </div>
      </div>

      {/* ── Bank Response Upload Modal ── */}
      <AnimatePresence>
        {showBankResponseUpload && (
          <motion.div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200] p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => { setShowBankResponseUpload(false); setSelectedBankFile(null); }}>
            <motion.div className="bg-white rounded-2xl shadow-2xl w-full max-w-[420px] p-5 relative"
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}>
              <button onClick={() => { setShowBankResponseUpload(false); setSelectedBankFile(null); }} className="absolute top-4 right-4 text-[#94A3B8] hover:text-red-500">
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-50 rounded-xl border border-green-100"><Upload className="w-6 h-6 text-[#00A86B]" /></div>
                <div>
                  <h2 className="text-[14px] font-bold text-[#0F172A]">Upload Bank Response</h2>
                  <p className="text-[11px] text-[#64748B]">Upload the CSV/Excel file received from the bank</p>
                </div>
              </div>
              <div className="bg-[#F8FAFC] border border-dashed border-[#E2E8F0] rounded-xl p-5 text-center mb-4">
                {selectedBankFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle2 className="w-8 h-8 text-[#00A86B]" />
                    <p className="text-[12px] font-bold text-[#0F172A] break-all">{selectedBankFile.name}</p>
                    <p className="text-[11px] text-[#94A3B8]">{(selectedBankFile.size / 1024).toFixed(1)} KB</p>
                    <div className="flex gap-2 mt-1">
                      <button onClick={() => setSelectedBankFile(null)} className="px-3 py-1.5 border border-[#E2E8F0] rounded-lg text-[11px] font-bold text-[#64748B] hover:bg-[#F8FAFC]">Remove</button>
                      <button onClick={handleBankResponseSubmit} disabled={bankResponseUploading}
                        className="px-4 py-1.5 bg-[#00A86B] text-white rounded-lg text-[11px] font-bold hover:bg-[#009B63] flex items-center gap-1.5">
                        {bankResponseUploading ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" /> Processing…</> : 'Confirm & Submit'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-8 h-8 text-[#94A3B8] mx-auto mb-2" />
                    <p className="text-[12px] font-bold text-[#475569] mb-1">Select Bank Response File</p>
                    <p className="text-[11px] text-[#94A3B8] mb-3">Expected: Beneficiary Account, UTR Number, Status, Amount</p>
                    <input ref={bankFileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" id="bankRespFile"
                      onChange={e => { const f = e.target.files?.[0]; if (f) setSelectedBankFile(f); }} />
                    <label htmlFor="bankRespFile" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-bold cursor-pointer bg-[#00A86B] text-white hover:bg-[#009B63]">
                      <Upload className="w-4 h-4" /> Choose File
                    </label>
                  </div>
                )}
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-[11px] text-blue-700">
                <p className="font-bold mb-1">How it works:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Only rows with <strong>Status = "Successful"</strong> are processed.</li>
                  <li>Matched by <strong>Beneficiary Account + Amount</strong>.</li>
                  <li>Matched items are automatically marked as <strong>Paid</strong>.</li>
                </ul>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                      <thead className="bg-[#E6F5F1] sticky top-0 z-10">
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
                                    navigate('/admin/tracking', { state: { awb: item.awb_number } });
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

      {/* ── Transfer COD Modal ── */}
      {showTransferModal && (
        <TransferCODModal
          userId={transferUserId}
          selectedRemittanceIds={transferIds}
          type={activeTab === 'Courier COD Remittance' ? 'courier' : 'seller'}
          onClose={() => { setShowTransferModal(false); setTransferUserId(''); setTransferIds([]); }}
          onSuccess={() => {
            if (activeTab === 'Seller COD Remittance') fetchSellerRemittance(sellerPage);
            else if (activeTab === 'Courier COD Remittance') fetchCourierRemittance(courierPage);
          }}
        />
      )}

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-[100] bg-[#1E293B] text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border border-white/10 min-w-[320px]"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${toast.type === 'error' ? 'bg-red-500/20' : 'bg-emerald-500/20'}`}>
              {toast.type === 'error'
                ? <AlertCircle className="w-4 h-4 text-[#F87171]" />
                : <CheckCircle2 className="w-4 h-4 text-[#34D399]" />}
            </div>
            <p className="text-[13px] font-medium pr-4">{toast.text}</p>
            <button onClick={() => setToast(null)} className="p-1 hover:bg-white/10 rounded-md ml-auto text-[#94A3B8] hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}