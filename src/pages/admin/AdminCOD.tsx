import { useState, useMemo, useEffect, useCallback } from 'react';
import { apiClient } from '../../services/apiClient';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import {
  ChevronDown, RefreshCcw, Check, User, Truck, Banknote, Clock, Upload, Download,
  Wallet, Send, MinusCircle, FileText, AlertCircle, CheckCircle2, X
} from 'lucide-react';
import { GlassDropdown } from '../../components/ui/GlassDropdown';
import { GlassDateFilter } from '../../components/ui/GlassDateFilter';

const MAIN_TABS = [
  { name: 'All COD Orders' },
  { name: 'Seller COD Remittance' },
  { name: 'Courier COD Remittance' }
];

// Data mapping helpers — field names must match exact API response keys
const mapCodOrder = (item: any) => ({
  id: String(item._id || item.orderID || ''),
  orderID: item.orderID || '',
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
  utr: item.utr || 'N/A',
  totalCodAmount: (Number(item.codAvailable) || 0) + (Number(item.adjustedAmount) || 0),
  creditedAmount: item.amountCreditedToWallet || 0,
  adjustedAmount: item.adjustedAmount || 0,
  earlyCodCharges: item.earlyCodCharges || 0,
  remittanceAmount: item.remittanceInitiated || 0,
  status: item.status || 'Pending',
});

const mapCourierRemittance = (item: any) => ({
  id: String(item._id || item.orderID || ''),
  orderID: item.orderID || '',
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

const getStatusBadgeClass = (status: string) =>
  `${STATUS_BADGE_STYLES[status] || 'bg-blue-50 text-blue-700 border-blue-200'} px-2.5 py-0.5 rounded-full border text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap shadow-sm`;

const fmtCurrency = (n: any) =>
  `₹${(Number(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

const toISOStart = (d: string) => d ? d + 'T00:00:00.000Z' : '';
const toISOEnd   = (d: string) => d ? d + 'T23:59:59.999Z' : '';

export function AdminCOD() {
  const navigate = useNavigate();

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
  const [toast, setToast] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const showToast = (type: 'error' | 'success', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3000);
  };

  // ── All COD Orders state ─────────────────────────────────────────────────
  const [codOrdersList, setCodOrdersList] = useState<any[]>([]);
  const [codOrdersTotal, setCodOrdersTotal] = useState(0);
  const [codOrdersSummary, setCodOrdersSummary] = useState({ totalCODAmount: 0, paidCODAmount: 0, pendingCODAmount: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedCouriers, setSelectedCouriers] = useState<string[]>([]);
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);   // stores _id/orderID

  // ── Seller COD Remittance state ──────────────────────────────────────────
  const [sellerRemittanceList, setSellerRemittanceList] = useState<any[]>([]);
  const [sellerRemittanceTotal, setSellerRemittanceTotal] = useState(0);
  const [sellerSummary, setSellerSummary] = useState({
    CODToBeRemitted: 0, LastCodRemmited: 0, TotalCODRemitted: 0,
    TotalDeductionfromCOD: 0, RemittanceInitiated: 0,
  });
  const [sellerPage, setSellerPage] = useState(1);
  const [remittanceSearchTerm, setRemittanceSearchTerm] = useState('');
  const [selectedCodStatuses, setSelectedCodStatuses] = useState<string[]>([]);
  const [codDateStart, setCodDateStart] = useState('');
  const [codDateEnd, setCodDateEnd] = useState('');
  const [selectedCodOrders, setSelectedCodOrders] = useState<string[]>([]);  // stores remittanceId
  const [showActionMenu, setShowActionMenu] = useState(false);

  // Remittance detail modal
  const [remittanceDetailId, setRemittanceDetailId] = useState<string | null>(null);
  const [remittanceDetail, setRemittanceDetail] = useState<any>(null);
  const [remittanceDetailLoading, setRemittanceDetailLoading] = useState(false);

  // ── Courier COD Remittance state ─────────────────────────────────────────
  const [courierRemittanceList, setCourierRemittanceList] = useState<any[]>([]);
  const [courierRemittanceTotal, setCourierRemittanceTotal] = useState(0);
  const [courierSummary, setCourierSummary] = useState({ totalCODAmount: 0, paidCODAmount: 0, pendingCODAmount: 0 });
  const [courierPage, setCourierPage] = useState(1);
  const [courierRemittanceSearchTerm, setCourierRemittanceSearchTerm] = useState('');
  const [selectedCourierCodStatuses, setSelectedCourierCodStatuses] = useState<string[]>([]);
  const [courierCodDateStart, setCourierCodDateStart] = useState('');
  const [courierCodDateEnd, setCourierCodDateEnd] = useState('');
  const [selectedCourierCodOrders, setSelectedCourierCodOrders] = useState<string[]>([]); // stores _id/orderID
  const [showCourierActionMenu, setShowCourierActionMenu] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const itemsPerPage = 20;

  const STATUS_OPTIONS = [
    { label: 'Pending', value: 'Pending' },
    { label: 'Paid',    value: 'Paid'    }
  ];
  const COURIER_OPTIONS = [
    { label: 'Ekart Surface', value: 'Ekart Surface' },
    { label: 'Delhivery',     value: 'Delhivery'     },
    { label: 'Bluedart',      value: 'Bluedart'      },
  ];

  // ── Fetch functions ──────────────────────────────────────────────────────
  const fetchCodOrders = useCallback(async (page: number) => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = { page, limit: itemsPerPage };
      if (searchTerm) params.searchFilter = searchTerm;
      if (dateStart)  params.startDate = toISOStart(dateStart);
      if (dateEnd)    params.endDate   = toISOEnd(dateEnd);
      if (selectedStatuses.length === 1)  params.statusFilter     = selectedStatuses[0];
      if (selectedCouriers.length > 0)    params.courierProvider  = selectedCouriers.join(',');
      const res = await apiClient.get('/cod/CodRemittanceOrder', { params });
      setCodOrdersList((res.data.data?.orders || []).map(mapCodOrder));
      setCodOrdersTotal(res.data.total || 0);
      setCodOrdersSummary({
        totalCODAmount:   res.data.data?.totalCODAmount   || 0,
        paidCODAmount:    res.data.data?.paidCODAmount    || 0,
        pendingCODAmount: res.data.data?.pendingCODAmount || 0,
      });
    } catch {
      showToast('error', 'Failed to load COD orders.');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, dateStart, dateEnd, selectedStatuses, selectedCouriers]);

  const fetchSellerRemittance = useCallback(async (page: number) => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = { page, limit: itemsPerPage };
      if (remittanceSearchTerm)          params.userNameFilter = remittanceSearchTerm;
      if (codDateStart)                  params.startDate      = toISOStart(codDateStart);
      if (codDateEnd)                    params.endDate        = toISOEnd(codDateEnd);
      if (selectedCodStatuses.length === 1) params.statusFilter = selectedCodStatuses[0];
      const res = await apiClient.get('/cod/getAdminCodRemitanceData', { params });
      setSellerRemittanceList((res.data.results || []).map(mapSellerRemittance));
      setSellerRemittanceTotal(res.data.total || 0);
      if (res.data.summary) {
        setSellerSummary({
          CODToBeRemitted:       res.data.summary.CODToBeRemitted       || 0,
          LastCodRemmited:       res.data.summary.LastCODRemitted        || 0,
          TotalCODRemitted:      res.data.summary.TotalCODRemitted       || 0,
          TotalDeductionfromCOD: res.data.summary.TotalDeductionfromCOD || 0,
          RemittanceInitiated:   res.data.summary.RemittanceInitiated    || 0,
        });
      }
    } catch {
      showToast('error', 'Failed to load seller remittance data.');
    } finally {
      setIsLoading(false);
    }
  }, [remittanceSearchTerm, codDateStart, codDateEnd, selectedCodStatuses]);

  const fetchCourierRemittance = useCallback(async (page: number) => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = { page, limit: itemsPerPage };
      if (courierRemittanceSearchTerm)              params.searchFilter  = courierRemittanceSearchTerm;
      if (courierCodDateStart)                      params.startDate     = toISOStart(courierCodDateStart);
      if (courierCodDateEnd)                        params.endDate       = toISOEnd(courierCodDateEnd);
      if (selectedCourierCodStatuses.length === 1)  params.statusFilter  = selectedCourierCodStatuses[0];
      const res = await apiClient.get('/cod/courierCodRemittance', { params });
      setCourierRemittanceList((res.data.data?.orders || []).map(mapCourierRemittance));
      setCourierRemittanceTotal(res.data.total || 0);
      setCourierSummary({
        totalCODAmount:   res.data.data?.totalCODAmount   || 0,
        paidCODAmount:    res.data.data?.paidCODAmount    || 0,
        pendingCODAmount: res.data.data?.pendingCODAmount || 0,
      });
    } catch {
      showToast('error', 'Failed to load courier remittance data.');
    } finally {
      setIsLoading(false);
    }
  }, [courierRemittanceSearchTerm, courierCodDateStart, courierCodDateEnd, selectedCourierCodStatuses]);

  // Tab change: reset page to 1 and fetch active tab
  useEffect(() => {
    setCurrentPage(1); setSellerPage(1); setCourierPage(1);
    switch (activeTab) {
      case 'All COD Orders':        fetchCodOrders(1);         break;
      case 'Seller COD Remittance': fetchSellerRemittance(1);  break;
      case 'Courier COD Remittance':fetchCourierRemittance(1); break;
    }
  }, [activeTab]);

  // Client-side global search on All COD Orders (server handles all other filters)
  const paginatedOrders = useMemo(() => {
    if (!globalSearchQuery) return codOrdersList;
    const q = globalSearchQuery.toLowerCase();
    return codOrdersList.filter(o =>
      (o.userName   || '').toLowerCase().includes(q) ||
      (o.userEmail  || '').toLowerCase().includes(q) ||
      (o.awb        || '').toLowerCase().includes(q) ||
      (o.orderID    || '').toLowerCase().includes(q)
    );
  }, [codOrdersList, globalSearchQuery]);

  const totalPages        = Math.max(1, Math.ceil(codOrdersTotal        / itemsPerPage));
  const totalSellerPages  = Math.max(1, Math.ceil(sellerRemittanceTotal / itemsPerPage));
  const totalCourierPages = Math.max(1, Math.ceil(courierRemittanceTotal/ itemsPerPage));

  // All COD selection — keyed by _id/orderID
  const toggleAll    = () => setSelectedOrders(
    selectedOrders.length === paginatedOrders.length && paginatedOrders.length > 0
      ? [] : paginatedOrders.map(o => o.id)
  );
  const toggleSelect = (id: string) => setSelectedOrders(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  );

  // Seller selection — keyed by remittanceId
  const toggleAllCod    = () => setSelectedCodOrders(
    selectedCodOrders.length === sellerRemittanceList.length && sellerRemittanceList.length > 0
      ? [] : sellerRemittanceList.map(o => o.awb)
  );
  const toggleSelectCod = (id: string) => setSelectedCodOrders(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  );

  // Courier selection — keyed by _id/orderID
  const toggleAllCourierCod    = () => setSelectedCourierCodOrders(
    selectedCourierCodOrders.length === courierRemittanceList.length && courierRemittanceList.length > 0
      ? [] : courierRemittanceList.map(o => o.id)
  );
  const toggleSelectCourierCod = (id: string) => setSelectedCourierCodOrders(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  );

  const handleApplyFilters = () => { setCurrentPage(1); fetchCodOrders(1); };

  // Sliding window of up to 5 page numbers centred on current page
  const pageWindow = (curr: number, total: number) => {
    const half = 2;
    let start = Math.max(1, curr - half);
    let end   = Math.min(total, curr + half);
    if (end - start < 4) {
      if (start === 1) end   = Math.min(total, start + 4);
      else             start = Math.max(1, end - 4);
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const handleTransferCOD = async (type: 'seller' | 'courier') => {
    const ids = type === 'seller' ? selectedCodOrders : selectedCourierCodOrders;
    if (ids.length === 0) {
      showToast('error', `Select at least one record to transfer COD.`);
      return;
    }
    try {
      const res = await apiClient.post('/cod/validateCODTransfer', { remittanceIds: ids });
      const userId = res.data.userId;
      navigate(`/admin/transfer-cod?type=${type}&userId=${userId}&ids=${ids.join(',')}`);
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

  // Reusable pagination renderer
  const renderPagination = (
    page: number, total: number, totalRec: number,
    setPage: (p: number) => void, fetchFn: (p: number) => void
  ) => {
    if (totalRec === 0) return null;
    const win = pageWindow(page, total);
    const btnBase = 'w-8 h-8 rounded text-xs font-medium flex items-center justify-center transition-colors';
    const active  = `${btnBase} bg-[#00A86B] text-white border border-[#00A86B]`;
    const inactive = `${btnBase} border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]`;
    const navBtn  = 'px-3 py-1.5 rounded border border-[#E2E8F0] text-xs font-medium text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-50';
    const go = (p: number) => { setPage(p); fetchFn(p); };
    return (
      <div className="p-4 border-t border-[#E2E8F0] flex items-center justify-between shrink-0">
        <div className="text-xs text-[#64748B]">
          Showing <span className="font-bold text-[#0F172A]">{(page - 1) * itemsPerPage + 1}</span>
          –<span className="font-bold text-[#0F172A]">{Math.min(page * itemsPerPage, totalRec)}</span>
          {' '}of <span className="font-bold text-[#0F172A]">{totalRec}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => go(Math.max(1, page - 1))} disabled={page === 1} className={navBtn}>←</button>
          {win[0] > 1 && (
            <>
              <button onClick={() => go(1)} className={page === 1 ? active : inactive}>1</button>
              {win[0] > 2 && <span className="px-1 text-[#94A3B8] text-xs">…</span>}
            </>
          )}
          {win.map(p => (
            <button key={p} onClick={() => go(p)} className={page === p ? active : inactive}>{p}</button>
          ))}
          {win[win.length - 1] < total && (
            <>
              {win[win.length - 1] < total - 1 && <span className="px-1 text-[#94A3B8] text-xs">…</span>}
              <button onClick={() => go(total)} className={page === total ? active : inactive}>{total}</button>
            </>
          )}
          <button onClick={() => go(Math.min(total, page + 1))} disabled={page === total} className={navBtn}>→</button>
        </div>
      </div>
    );
  };

  // ── Shared table body cells ──────────────────────────────────────────────
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

  const thBase = 'p-3 whitespace-nowrap text-[10px] font-bold text-[#00A86B] uppercase tracking-wider';

  return (
    <AdminLayout>
      <div className="flex flex-col h-[calc(100vh-72px)] -m-4 md:-m-6 bg-white">

        {/* ── Header: Tab Navigation ── */}
        <div className="bg-white relative z-50 shrink-0">
          <div className="flex justify-between items-center px-6 py-2 border-b border-[#E2E8F0] overflow-x-auto no-scrollbar">
            <div className="flex gap-6 items-center shrink-0">
              {MAIN_TABS.map(tab => (
                <button
                  key={tab.name}
                  onClick={() => setActiveTab(tab.name)}
                  className={`relative py-3 text-[13px] font-bold transition-colors whitespace-nowrap ${
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
            <button
              onClick={() => {
                if (activeTab === 'All COD Orders')        fetchCodOrders(currentPage);
                if (activeTab === 'Seller COD Remittance') fetchSellerRemittance(sellerPage);
                if (activeTab === 'Courier COD Remittance')fetchCourierRemittance(courierPage);
              }}
              className="w-8 h-8 rounded-full border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-[#F8FAFC]"
            >
              <RefreshCcw className="w-4 h-4" />
            </button>
          </div>

          {/* ── Summary Cards ── */}
          {activeTab === 'Seller COD Remittance' && (
            <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC]/30 flex flex-nowrap overflow-x-auto gap-4 no-scrollbar">
              {[
                { icon: <Wallet className="w-4 h-4 text-[#3B82F6]" />, bg: 'bg-[#F0F9FF] border-[#E0F2FE]', ibg: 'bg-[#DBEAFE]', val: sellerSummary.CODToBeRemitted, label: 'COD To Be Remitted' },
                { icon: <Send className="w-4 h-4 text-[#A855F7]" />, bg: 'bg-[#FAF5FF] border-[#F3E8FF]', ibg: 'bg-[#F3E8FF]', val: sellerSummary.LastCodRemmited, label: 'Last COD Remitted' },
                { icon: <Banknote className="w-4 h-4 text-[#14B8A6]" />, bg: 'bg-[#F0FDFA] border-[#CCFBF1]', ibg: 'bg-[#CCFBF1]', val: sellerSummary.TotalCODRemitted, label: 'Total COD Remitted' },
                { icon: <MinusCircle className="w-4 h-4 text-[#EAB308]" />, bg: 'bg-[#FEFCE8] border-[#FEF08A]', ibg: 'bg-[#FEF08A]', val: sellerSummary.TotalDeductionfromCOD, label: 'Total Deduction' },
                { icon: <Clock className="w-4 h-4 text-[#8B5CF6]" />, bg: 'bg-[#F8F5FF] border-[#F3EFFF]', ibg: 'bg-[#EADDFF]', val: sellerSummary.RemittanceInitiated, label: 'Remittance Initiated' },
              ].map((c, i) => (
                <div key={i} className={`flex-1 min-w-[200px] ${c.bg} rounded-xl p-3 border flex items-center gap-3`}>
                  <div className={`w-8 h-8 rounded-full ${c.ibg} flex items-center justify-center shrink-0`}>{c.icon}</div>
                  <div>
                    <div className="text-[14px] font-bold text-[#0F172A]">{fmtCurrency(c.val)}</div>
                    <div className="text-[10px] font-semibold text-[#64748B]">{c.label}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'Courier COD Remittance' && (
            <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC]/30 flex flex-nowrap overflow-x-auto gap-4 no-scrollbar">
              {[
                { icon: <Banknote className="w-4 h-4 text-[#3B82F6]" />, bg: 'bg-[#F0F9FF] border-[#E0F2FE]', ibg: 'bg-[#DBEAFE]', val: courierSummary.totalCODAmount, label: 'Total COD Amount' },
                { icon: <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />, bg: 'bg-[#F0FDF4] border-[#DCFCE7]', ibg: 'bg-[#DCFCE7]', val: courierSummary.paidCODAmount, label: 'Paid COD Amount' },
                { icon: <Clock className="w-4 h-4 text-[#EAB308]" />, bg: 'bg-[#FEFCE8] border-[#FEF08A]', ibg: 'bg-[#FEF08A]', val: courierSummary.pendingCODAmount, label: 'Pending COD Amount' },
              ].map((c, i) => (
                <div key={i} className={`flex-1 min-w-[200px] ${c.bg} rounded-xl p-3 border flex items-center gap-3`}>
                  <div className={`w-8 h-8 rounded-full ${c.ibg} flex items-center justify-center shrink-0`}>{c.icon}</div>
                  <div>
                    <div className="text-[14px] font-bold text-[#0F172A]">{fmtCurrency(c.val)}</div>
                    <div className="text-[10px] font-semibold text-[#64748B]">{c.label}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'All COD Orders' && (
            <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC]/30 flex flex-wrap gap-4">
              {[
                { icon: <Banknote className="w-5 h-5 text-[#0EA5E9]" />, bg: 'bg-[#F0F9FA] border-[#E6F0F2]', ibg: 'bg-[#E0F2F4]', val: codOrdersSummary.totalCODAmount, label: 'Total COD Amount' },
                { icon: <CheckCircle2 className="w-5 h-5 text-[#22C55E]" />, bg: 'bg-[#F0FDF4] border-[#DCFCE7]', ibg: 'bg-[#DCFCE7]', val: codOrdersSummary.paidCODAmount, label: 'Paid COD Amount' },
                { icon: <Clock className="w-5 h-5 text-[#8B5CF6]" />, bg: 'bg-[#F8F5FF] border-[#F3EFFF]', ibg: 'bg-[#EADDFF]', val: codOrdersSummary.pendingCODAmount, label: 'Pending COD Amount' },
              ].map((c, i) => (
                <div key={i} className={`flex-1 min-w-[250px] ${c.bg} rounded-xl p-4 border flex items-center gap-4`}>
                  <div className={`w-10 h-10 rounded-full ${c.ibg} flex items-center justify-center shrink-0`}>{c.icon}</div>
                  <div>
                    <div className="text-lg font-bold text-[#0F172A]">{fmtCurrency(c.val)}</div>
                    <div className="text-xs font-semibold text-[#64748B]">{c.label}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Filter Rows ── */}
          {activeTab === 'All COD Orders' && (
            <>
              <div className="p-3 border-b border-[#E2E8F0] flex flex-nowrap items-center gap-2.5 bg-white overflow-x-auto no-scrollbar">
                <input
                  type="text"
                  placeholder="Search by name, email, AWB, Order ID..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleApplyFilters()}
                  className="h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs bg-white focus:outline-none w-[200px] shrink-0"
                />
                <GlassDropdown
                  label="Status" options={STATUS_OPTIONS} selected={selectedStatuses}
                  onChange={setSelectedStatuses} placeholder="Filter status..." icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                />
                <GlassDropdown
                  label="Courier" options={COURIER_OPTIONS} selected={selectedCouriers}
                  onChange={setSelectedCouriers} placeholder="Filter courier..." icon={<Truck className="w-3.5 h-3.5" />}
                />
                <GlassDateFilter
                  align="right" startDate={dateStart} endDate={dateEnd}
                  onDateChange={(s, e) => { setDateStart(s); setDateEnd(e); }}
                />
                <button
                  onClick={handleApplyFilters}
                  className="h-9 px-4 shrink-0 rounded-lg bg-[#00A86B] text-white text-xs font-bold hover:bg-[#009B63] transition-colors shadow-sm"
                >
                  Apply
                </button>
                <div className="ml-auto flex items-center gap-2 shrink-0">
                  <button className="w-9 h-9 rounded-full border border-[#00A86B] flex items-center justify-center text-[#00A86B] hover:bg-[#00A86B]/5">
                    <Upload className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (selectedOrders.length === 0) { showToast('error', 'Select rows to export.'); return; }
                      showToast('success', `Exporting ${selectedOrders.length} records…`);
                    }}
                    className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors ${
                      selectedOrders.length > 0
                        ? 'border-[#00A86B] text-[#00A86B] hover:bg-[#00A86B]/5'
                        : 'border-[#E2E8F0] text-[#CBD5E1] cursor-not-allowed'
                    }`}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {selectedOrders.length > 0 && (
                <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-100 flex items-center gap-3">
                  <span className="text-xs font-bold text-emerald-700">{selectedOrders.length} selected</span>
                  <button
                    onClick={() => setSelectedOrders([])}
                    className="text-xs text-[#64748B] hover:text-red-500 ml-2"
                  >
                    Clear
                  </button>
                </div>
              )}
            </>
          )}

          {activeTab === 'Seller COD Remittance' && (
            <>
              <div className="p-3 border-b border-[#E2E8F0] flex flex-nowrap items-center gap-2.5 bg-white overflow-x-auto no-scrollbar">
                <input
                  type="text"
                  placeholder="Search by user name..."
                  value={remittanceSearchTerm}
                  onChange={e => setRemittanceSearchTerm(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (setSellerPage(1), fetchSellerRemittance(1))}
                  className="h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs bg-white focus:outline-none w-[180px] shrink-0"
                />
                <GlassDropdown
                  label="Status" options={STATUS_OPTIONS} selected={selectedCodStatuses}
                  onChange={setSelectedCodStatuses} placeholder="Filter status..." icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                />
                <GlassDateFilter
                  align="right" startDate={codDateStart} endDate={codDateEnd}
                  onDateChange={(s, e) => { setCodDateStart(s); setCodDateEnd(e); }}
                />
                <button
                  onClick={() => { setSellerPage(1); fetchSellerRemittance(1); }}
                  className="h-9 px-4 shrink-0 rounded-lg bg-[#00A86B] text-white text-xs font-bold hover:bg-[#009B63] transition-colors shadow-sm"
                >
                  Apply
                </button>

                <div className="relative shrink-0 ml-auto">
                  <button
                    onClick={() => selectedCodOrders.length > 0 && setShowActionMenu(!showActionMenu)}
                    disabled={selectedCodOrders.length === 0}
                    className={`h-9 pl-4 pr-8 rounded-full border text-xs font-bold shadow-sm relative transition-colors ${
                      selectedCodOrders.length > 0
                        ? 'border-[#00A86B] text-[#00A86B] bg-white hover:bg-[#F0FDF4]'
                        : 'border-[#E2E8F0] text-[#CBD5E1] bg-[#F8FAFC] cursor-not-allowed'
                    }`}
                  >
                    Actions
                    <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-current" />
                  </button>
                  {showActionMenu && selectedCodOrders.length > 0 && (
                    <div className="absolute right-0 top-full mt-2 w-[180px] bg-white rounded-xl shadow-lg border border-[#E2E8F0] py-2 z-50">
                      <button onClick={() => { showToast('success', 'Export initiated'); setShowActionMenu(false); }} className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]">Export Data</button>
                      <button onClick={() => { showToast('success', 'Bank template exported'); setShowActionMenu(false); }} className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]">Export Bank Template</button>
                      <button onClick={() => { setShowActionMenu(false); }} className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]">Upload Bank Response</button>
                      <div className="border-t border-[#E2E8F0] my-1" />
                      <button onClick={() => { setShowActionMenu(false); handleTransferCOD('seller'); }} className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#00A86B] hover:bg-[#F0FDF4]">Transfer COD</button>
                    </div>
                  )}
                </div>
              </div>

              {selectedCodOrders.length > 0 && (
                <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-100 flex items-center gap-3">
                  <span className="text-xs font-bold text-emerald-700">{selectedCodOrders.length} selected</span>
                  <button onClick={() => handleTransferCOD('seller')} className="h-7 px-3 rounded-md bg-[#00A86B] text-white text-xs font-bold shadow-sm hover:bg-[#009B63]">Transfer COD</button>
                  <button onClick={() => setSelectedCodOrders([])} className="text-xs text-[#64748B] hover:text-red-500">Clear</button>
                </div>
              )}
            </>
          )}

          {activeTab === 'Courier COD Remittance' && (
            <>
              <div className="p-3 border-b border-[#E2E8F0] flex flex-nowrap items-center gap-2.5 bg-white overflow-x-auto no-scrollbar">
                <input
                  type="text"
                  placeholder="Search by AWB, Order ID, courier..."
                  value={courierRemittanceSearchTerm}
                  onChange={e => setCourierRemittanceSearchTerm(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (setCourierPage(1), fetchCourierRemittance(1))}
                  className="h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs bg-white focus:outline-none w-[200px] shrink-0"
                />
                <GlassDropdown
                  label="Status" options={STATUS_OPTIONS} selected={selectedCourierCodStatuses}
                  onChange={setSelectedCourierCodStatuses} placeholder="Filter status..." icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                />
                <GlassDateFilter
                  align="right" startDate={courierCodDateStart} endDate={courierCodDateEnd}
                  onDateChange={(s, e) => { setCourierCodDateStart(s); setCourierCodDateEnd(e); }}
                />
                <button
                  onClick={() => { setCourierPage(1); fetchCourierRemittance(1); }}
                  className="h-9 px-4 shrink-0 rounded-lg bg-[#00A86B] text-white text-xs font-bold hover:bg-[#009B63] transition-colors shadow-sm"
                >
                  Apply
                </button>

                <div className="relative shrink-0 ml-auto">
                  <button
                    onClick={() => selectedCourierCodOrders.length > 0 && setShowCourierActionMenu(!showCourierActionMenu)}
                    disabled={selectedCourierCodOrders.length === 0}
                    className={`h-9 pl-4 pr-8 rounded-full border text-xs font-bold shadow-sm relative transition-colors ${
                      selectedCourierCodOrders.length > 0
                        ? 'border-[#00A86B] text-[#00A86B] bg-white hover:bg-[#F0FDF4]'
                        : 'border-[#E2E8F0] text-[#CBD5E1] bg-[#F8FAFC] cursor-not-allowed'
                    }`}
                  >
                    Actions
                    <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-current" />
                  </button>
                  {showCourierActionMenu && selectedCourierCodOrders.length > 0 && (
                    <div className="absolute right-0 top-full mt-2 w-[180px] bg-white rounded-xl shadow-lg border border-[#E2E8F0] py-2 z-50">
                      <button onClick={() => { showToast('success', 'Export initiated'); setShowCourierActionMenu(false); }} className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]">Export Data</button>
                      <button onClick={() => { setShowCourierActionMenu(false); }} className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]">Upload Bank Response</button>
                    </div>
                  )}
                </div>
              </div>
              {selectedCourierCodOrders.length > 0 && (
                <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-100 flex items-center gap-3">
                  <span className="text-xs font-bold text-emerald-700">{selectedCourierCodOrders.length} selected</span>
                  <button onClick={() => setSelectedCourierCodOrders([])} className="text-xs text-[#64748B] hover:text-red-500">Clear</button>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Table Section ── */}
        <div className="bg-white flex flex-col flex-1 min-h-0 overflow-hidden border-t border-[#E2E8F0]">

          {/* All COD Orders Tab */}
          {activeTab === 'All COD Orders' && (
            <>
              <div className="flex-1 overflow-y-auto overflow-x-auto no-scrollbar">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead className="sticky top-0 z-30 bg-[#E6F5F1] shadow-sm">
                    <tr>
                      <th className="p-3 w-10">
                        <input type="checkbox" checked={selectedOrders.length === paginatedOrders.length && paginatedOrders.length > 0} onChange={toggleAll} className="rounded accent-[#00A86B] w-3.5 h-3.5" />
                      </th>
                      <th className={thBase}><User className="w-3.5 h-3.5 inline mr-1" />User Details</th>
                      <th className={thBase}>Order ID</th>
                      <th className={thBase}><Truck className="w-3.5 h-3.5 inline mr-1" />Shipping Details</th>
                      <th className={thBase}><Banknote className="w-3.5 h-3.5 inline mr-1" />COD Amount</th>
                      <th className={thBase}><Check className="w-3.5 h-3.5 inline mr-1" />Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-[11px] text-[#475569]">
                    {isLoading ? (
                      <LoadingRow cols={6} />
                    ) : paginatedOrders.length === 0 ? (
                      <EmptyRow cols={6} msg="No COD orders found" />
                    ) : paginatedOrders.map(order => (
                      <tr key={order.id} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors">
                        <td className="p-3">
                          <input type="checkbox" checked={selectedOrders.includes(order.id)} onChange={() => toggleSelect(order.id)} className="rounded accent-[#00A86B] w-3.5 h-3.5" />
                        </td>
                        <td className="p-3">
                          <div className="text-[11px] font-semibold text-[#00A86B]">{order.userId}</div>
                          <div className="text-sm font-semibold text-[#0F172A] mt-0.5">{order.userName}</div>
                          <div className="text-[11px] text-[#94A3B8]">{order.userEmail}</div>
                        </td>
                        <td className="p-3">
                          <div className="text-xs font-semibold text-[#00A86B]">{order.orderID || '—'}</div>
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => navigate('/admin/tracking', { state: { awb: order.awb } })}
                            className="text-xs font-semibold text-[#00A86B] hover:underline text-left"
                          >
                            {order.awb || '—'}
                          </button>
                          <div className="text-[11px] text-[#475569] mt-0.5">{order.courier}</div>
                          <div className="text-[11px] text-[#94A3B8]">Delivered On: {order.date}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-[#0F172A] text-[12px]">{fmtCurrency(order.codAmount)}</div>
                        </td>
                        <td className="p-3">
                          <span className={getStatusBadgeClass(order.status)}>{order.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {renderPagination(currentPage, totalPages, codOrdersTotal, setCurrentPage, fetchCodOrders)}
            </>
          )}

          {/* Seller COD Remittance Tab */}
          {activeTab === 'Seller COD Remittance' && (
            <>
              <div className="flex-1 overflow-y-auto overflow-x-auto no-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1200px]">
                  <thead className="sticky top-0 z-30 bg-[#E6F5F1] shadow-sm">
                    <tr>
                      <th className="p-3 w-10">
                        <input type="checkbox" checked={selectedCodOrders.length === sellerRemittanceList.length && sellerRemittanceList.length > 0} onChange={toggleAllCod} className="rounded accent-[#00A86B] w-3.5 h-3.5" />
                      </th>
                      <th className={thBase}><User className="w-3.5 h-3.5 inline mr-1" />Date</th>
                      <th className={thBase}><User className="w-3.5 h-3.5 inline mr-1" />User</th>
                      <th className={thBase}><FileText className="w-3.5 h-3.5 inline mr-1" />Remittance ID</th>
                      <th className={thBase}><FileText className="w-3.5 h-3.5 inline mr-1" />UTR</th>
                      <th className={thBase}><Banknote className="w-3.5 h-3.5 inline mr-1" />Total COD Amount</th>
                      <th className={thBase}><Banknote className="w-3.5 h-3.5 inline mr-1" />Credited to Wallet</th>
                      <th className={thBase}><Banknote className="w-3.5 h-3.5 inline mr-1" />Adjusted Amount</th>
                      <th className={thBase}><Banknote className="w-3.5 h-3.5 inline mr-1" />Early COD Charges</th>
                      <th className={thBase}><Banknote className="w-3.5 h-3.5 inline mr-1" />Remittance Amount</th>
                      <th className={thBase}><Check className="w-3.5 h-3.5 inline mr-1" />Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-[11px] text-[#475569]">
                    {isLoading ? (
                      <LoadingRow cols={11} />
                    ) : sellerRemittanceList.length === 0 ? (
                      <EmptyRow cols={11} msg="No seller remittance records found" />
                    ) : sellerRemittanceList.map(order => (
                      <tr key={order.id || order.awb} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors">
                        <td className="p-3">
                          <input type="checkbox" checked={selectedCodOrders.includes(order.awb)} onChange={() => toggleSelectCod(order.awb)} className="rounded accent-[#00A86B] w-3.5 h-3.5" />
                        </td>
                        <td className="p-3 text-[#475569]">{order.date}</td>
                        <td className="p-3">
                          <div className="text-sm font-semibold text-[#0F172A]">{order.userName}</div>
                          <div className="text-[11px] text-[#94A3B8]">{order.userEmail}</div>
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => openRemittanceDetail(order.awb)}
                            className="text-xs font-semibold text-[#00A86B] hover:underline"
                          >
                            {order.awb}
                          </button>
                          <div className="text-[10px] text-[#94A3B8] mt-0.5">{order.paymentMethod}</div>
                        </td>
                        <td className="p-3 font-bold text-[#00A86B]">{order.utr}</td>
                        <td className="p-3 font-bold text-[#0F172A]">{fmtCurrency(order.totalCodAmount)}</td>
                        <td className="p-3 font-bold text-red-500">{fmtCurrency(order.creditedAmount)}</td>
                        <td className="p-3 text-[#64748B]">{fmtCurrency(order.adjustedAmount)}</td>
                        <td className="p-3 font-bold text-red-700">{fmtCurrency(order.earlyCodCharges)}</td>
                        <td className="p-3 font-bold text-[#00A86B]">{fmtCurrency(order.remittanceAmount)}</td>
                        <td className="p-3">
                          <span className={getStatusBadgeClass(order.status)}>{order.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {renderPagination(sellerPage, totalSellerPages, sellerRemittanceTotal, setSellerPage, fetchSellerRemittance)}
            </>
          )}

          {/* Courier COD Remittance Tab */}
          {activeTab === 'Courier COD Remittance' && (
            <>
              <div className="flex-1 overflow-y-auto overflow-x-auto no-scrollbar">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead className="sticky top-0 z-30 bg-[#E6F5F1] shadow-sm">
                    <tr>
                      <th className="p-3 w-10">
                        <input type="checkbox" checked={selectedCourierCodOrders.length === courierRemittanceList.length && courierRemittanceList.length > 0} onChange={toggleAllCourierCod} className="rounded accent-[#00A86B] w-3.5 h-3.5" />
                      </th>
                      <th className={thBase}><User className="w-3.5 h-3.5 inline mr-1" />User Details</th>
                      <th className={thBase}>Order ID</th>
                      <th className={thBase}><Truck className="w-3.5 h-3.5 inline mr-1" />Shipping Details</th>
                      <th className={thBase}><Banknote className="w-3.5 h-3.5 inline mr-1" />COD Amount</th>
                      <th className={thBase}><Check className="w-3.5 h-3.5 inline mr-1" />Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-[11px] text-[#475569]">
                    {isLoading ? (
                      <LoadingRow cols={6} />
                    ) : courierRemittanceList.length === 0 ? (
                      <EmptyRow cols={6} msg="No courier remittance records found" />
                    ) : courierRemittanceList.map(order => (
                      <tr key={order.id} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors">
                        <td className="p-3">
                          <input type="checkbox" checked={selectedCourierCodOrders.includes(order.id)} onChange={() => toggleSelectCourierCod(order.id)} className="rounded accent-[#00A86B] w-3.5 h-3.5" />
                        </td>
                        <td className="p-3">
                          <div className="text-[11px] font-semibold text-[#00A86B]">{order.userId}</div>
                          <div className="text-sm font-semibold text-[#0F172A] mt-0.5">{order.userName}</div>
                          <div className="text-[11px] text-[#94A3B8]">{order.userEmail}</div>
                        </td>
                        <td className="p-3">
                          <div className="text-xs font-semibold text-[#00A86B]">{order.orderID || '—'}</div>
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => navigate('/admin/tracking', { state: { awb: order.awb } })}
                            className="text-xs font-semibold text-[#00A86B] hover:underline text-left"
                          >
                            {order.awb || '—'}
                          </button>
                          <div className="text-[11px] text-[#475569] mt-0.5">{order.courierName}</div>
                          <div className="text-[11px] text-[#94A3B8]">Delivered On: {order.date}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-[#0F172A] text-[12px]">{fmtCurrency(order.codAmount)}</div>
                        </td>
                        <td className="p-3">
                          <span className={getStatusBadgeClass(order.status)}>{order.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {renderPagination(courierPage, totalCourierPages, courierRemittanceTotal, setCourierPage, fetchCourierRemittance)}
            </>
          )}
        </div>
      </div>

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
