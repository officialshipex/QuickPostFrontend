import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { DesktopPagination } from '../../hooks/usePagination';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { apiClient } from '../../services/apiClient';
import { useAdminTab } from '../../context/AdminUserContext';
import { useUserSearchFilter } from '../../hooks/filters/useUserSearchFilter';
import * as XLSX from 'xlsx';
import {
  ChevronDown, RefreshCcw, Check, Package, User, Truck,
  Upload, FileText, AlertTriangle, X, Search, Download, Filter, MoreVertical, Copy,
} from 'lucide-react';
import { GlassDropdown } from '../../components/ui/GlassDropdown';
import { GlassDateFilter } from '../../components/ui/GlassDateFilter';
import { useDateRangeFilter } from '../../hooks/filters/useDateRangeFilter';
import { TableLoader } from '../../components/ui/TableLoader';
import { EmptyState } from '../../components/ui/EmptyState';
import { TruncatedText } from '../../components/ui/TruncatedText';
import { MobilePaginationBar } from '../../hooks/useMobilePaginationBar';
import { getCourierLogo } from '../../utils/courierLogo';
import { SharedUploadModal } from '../../components/ui/SharedUploadModal';

// ── Date helpers ──────────────────────────────────────────────────────────────
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function ordinalSuffix(n: number) {
  if (n % 10 === 1 && n % 100 !== 11) return 'st';
  if (n % 10 === 2 && n % 100 !== 12) return 'nd';
  if (n % 10 === 3 && n % 100 !== 13) return 'rd';
  return 'th';
}
function fmtDate(iso: string) {
  const d = new Date(iso);
  const day = d.getDate();
  return `${day}${ordinalSuffix(day)} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}
function fmtTime(iso: string) {
  const d = new Date(iso);
  let h = d.getHours(); const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')} ${ampm}`;
}
// Guards against the API returning a populated object (e.g. { name, courierServiceName }) instead of a plain string.
function safeText(v: any): string {
  if (typeof v === 'string') return v;
  if (v && typeof v === 'object') return v.name || v.label || v.courierServiceName || v.code || '';
  return v == null ? '' : String(v);
}

// ── Tab config ────────────────────────────────────────────────────────────────
const MAIN_TABS = ['All', 'Pending', 'Complete', 'Dispute'] as const;
type TabName = typeof MAIN_TABS[number];

const TAB_STATUS: Record<TabName, string> = {
  All:      '',
  Pending:  'pending',
  Complete: 'Accepted',
  Dispute:  'Discrepancy Raised',
};

// Each tab gets its own URL sub-route (/admin/weight-discrepancy/:tabSlug) so refresh, back/forward and deep links work per-status.
const TAB_SLUG_MAP: Record<TabName, string> = {
  All:      'all',
  Pending:  'pending',
  Complete: 'complete',
  Dispute:  'dispute',
};
const SLUG_TO_TAB: Record<string, TabName> = Object.fromEntries(
  Object.entries(TAB_SLUG_MAP).map(([tab, slug]) => [slug, tab])
) as Record<string, TabName>;

// ── Status badge ──────────────────────────────────────────────────────────────
const BADGE: Record<string, string> = {
  pending:            'bg-blue-50 text-blue-700 border-blue-200',
  new:                'bg-blue-50 text-blue-700 border-blue-200',
  accepted:           'bg-emerald-50 text-emerald-700 border-emerald-200',
  'discrepancy raised': 'bg-orange-50 text-orange-700 border-orange-200',
  escalated:          'bg-rose-50 text-rose-700 border-rose-200',
  declined:           'bg-red-50 text-red-700 border-red-200',
};
const badge = (s: string) =>
  `${BADGE[(s || '').toLowerCase()] ?? 'bg-gray-50 text-gray-700 border-gray-200'} px-2.5 py-0.5 rounded-full border text-[10px] leading-4 font-semibold uppercase tracking-wider whitespace-nowrap shadow-sm`;

// ── Inline: Admin Accept Modal (admin accepts a raised dispute) ───────────────
function AcceptModal({ awb, onClose, onDone }: { awb: string; onClose: () => void; onDone: () => void }) {
  const [loading, setLoading] = useState(false);
  const confirm = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await apiClient.post('/dispreancy/adminAcceptDiscrepancy/', { awbNumber: awb });
      onDone();
      onClose();
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Accept failed');
    } finally { setLoading(false); }
  };
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-80 text-center">
        <h2 className="text-[14px] font-semibold mb-4">Accept this dispute?</h2>
        <p className="text-xs text-gray-500 mb-4">AWB: <strong>{awb}</strong></p>
        <div className="flex justify-center gap-3">
          <button onClick={confirm} disabled={loading}
            className="px-4 py-2 bg-[#00A86B] text-white rounded-md text-sm disabled:opacity-50">
            {loading ? 'Processing...' : 'Yes, Accept'}
          </button>
          <button onClick={onClose} disabled={loading} className="px-4 py-2 bg-gray-400 text-white rounded-md text-sm">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Inline: User Accept Modal (user agrees to pay the discrepancy) ────────────
function UserAcceptModal({ awb, onClose, onDone }: { awb: string; onClose: () => void; onDone: () => void }) {
  const [loading, setLoading] = useState(false);
  const confirm = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await apiClient.post('/dispreancy/acceptDiscrepancy', { awb_number: awb });
      onDone();
      onClose();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Accept failed');
    } finally { setLoading(false); }
  };
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-80 text-center">
        <h2 className="text-[14px] font-semibold mb-2">Accept Discrepancy?</h2>
        <p className="text-xs text-gray-500 mb-4">By accepting, the extra weight charge will be debited from your wallet.<br />AWB: <strong>{awb}</strong></p>
        <div className="flex justify-center gap-3">
          <button onClick={confirm} disabled={loading}
            className="px-4 py-2 bg-[#00A86B] text-white rounded-md text-sm disabled:opacity-50">
            {loading ? 'Processing...' : 'Yes, Accept'}
          </button>
          <button onClick={onClose} disabled={loading} className="px-4 py-2 bg-gray-400 text-white rounded-md text-sm">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Inline: Raise Dispute Modal (user raises a dispute on a pending discrepancy)
function RaiseDisputeModal({ awb, onClose, onDone }: { awb: string; onClose: () => void; onDone: () => void }) {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('awbNumber', awb);
      fd.append('text', text);
      if (file) fd.append('image', file);
      await apiClient.post('/dispreancy/raiseDiscrepancies', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onDone();
      onClose();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to raise dispute');
    } finally { setLoading(false); }
  };
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-[500px] relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"><X size={18} /></button>
        <h2 className="text-sm font-bold mb-1 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-orange-500" />Raise Dispute</h2>
        <p className="text-xs text-gray-500 mb-3">AWB: <strong>{awb}</strong> — Submit evidence for this weight discrepancy</p>
        <label className="text-xs font-semibold text-gray-700">Remarks</label>
        <textarea rows={4} className="w-full mt-1 mb-3 border rounded p-2 text-sm focus:outline-none focus:ring focus:ring-[#00A86B]"
          placeholder="Describe the discrepancy details..." value={text} onChange={e => setText(e.target.value)} />
        <label className="text-xs font-semibold text-gray-700">Evidence Image (optional)</label>
        <label className="mt-1 flex items-center justify-between gap-2 border border-[#00A86B] text-[#00A86B] rounded-lg px-4 py-2 text-sm cursor-pointer hover:bg-green-50">
          <span>{file ? file.name : 'Select Image'}</span>
          <Upload className="w-4 h-4" />
          <input type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0] || null; setFile(f); setPreview(f ? URL.createObjectURL(f) : ''); }} />
        </label>
        {preview && <img src={preview} alt="preview" className="mt-2 h-32 w-full object-cover rounded border" />}
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} disabled={loading} className="px-4 py-2 bg-gray-400 text-white rounded-md text-sm">Cancel</button>
          <button onClick={submit} disabled={loading || !text.trim()}
            className="px-4 py-2 bg-[#00A86B] text-white rounded-md text-sm disabled:opacity-50">
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Inline: Bulk Accept Modal ─────────────────────────────────────────────────
function BulkAcceptModal({ orderIds, label, onClose, onDone }: { orderIds: string[]; label: string; onClose: () => void; onDone: () => void }) {
  const [loading, setLoading] = useState(false);
  const confirm = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await apiClient.post('/dispreancy/acceptAllDiscrepancies', { orderIds });
      onDone();
      onClose();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Bulk accept failed');
    } finally { setLoading(false); }
  };
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-[480px] relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"><X size={18} /></button>
        <h2 className="text-[14px] font-semibold mb-2">{label} — {orderIds.length} item{orderIds.length > 1 ? 's' : ''}</h2>
        <p className="text-sm text-gray-500 mb-4">Are you sure you want to accept all <strong>{orderIds.length}</strong> selected item{orderIds.length > 1 ? 's' : ''}?</p>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} disabled={loading} className="px-4 py-2 bg-gray-400 text-white rounded-md text-sm">Cancel</button>
          <button onClick={confirm} disabled={loading}
            className="px-4 py-2 bg-[#00A86B] text-white rounded-md text-sm disabled:opacity-50">
            {loading ? 'Processing...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Inline: Decline Modal ─────────────────────────────────────────────────────
function DeclineModal({ awbNumbers, onClose, onDone }: { awbNumbers: string[]; onClose: () => void; onDone: () => void }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const isBulk = awbNumbers.length > 1;
  const confirm = async () => {
    if (loading) return;
    setLoading(true);
    try {
      if (isBulk) {
        await apiClient.post('/dispreancy/bulkDeclineDiscrepancy', { awbNumbers, text });
      } else {
        await apiClient.post('/dispreancy/declineDiscrepancy/', { awbNumber: awbNumbers[0], text });
      }
      onDone();
      onClose();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Decline failed');
    } finally { setLoading(false); }
  };
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-[500px] relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"><X size={18} /></button>
        <h2 className="text-[14px] font-semibold mb-3">{isBulk ? `Declining ${awbNumbers.length} AWBs` : `Decline — ${awbNumbers[0]}`}</h2>
        {isBulk && (
          <div className="max-h-[100px] overflow-y-auto border rounded p-2 text-xs text-gray-600 bg-gray-50 mb-3">
            {awbNumbers.map((a, i) => <div key={i}>{a}</div>)}
          </div>
        )}
        <label className="text-xs font-semibold text-gray-700">Decline Reason</label>
        <textarea rows={4} className="w-full mt-1 border rounded p-2 text-sm focus:outline-none focus:ring focus:ring-[#00A86B]"
          placeholder="Enter reason..." value={text} onChange={e => setText(e.target.value)} />
        <div className="flex justify-end gap-2 mt-3">
          <button onClick={onClose} disabled={loading} className="px-4 py-2 bg-gray-400 text-white rounded-md text-sm">Cancel</button>
          <button onClick={confirm} disabled={loading} className="px-4 py-2 bg-[#00A86B] text-white rounded-md text-sm disabled:opacity-50">
            {loading ? 'Processing...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Inline: Details Modal ─────────────────────────────────────────────────────
function DetailsModal({ text, imageUrl, onClose }: { text: string; imageUrl: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-[500px] relative max-h-[80vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"><X size={18} /></button>
        <h2 className="text-sm font-bold mb-3">Dispute Details</h2>
        {text && <p className="text-sm text-gray-700 mb-3">{text}</p>}
        {imageUrl && <img src={imageUrl} alt="Dispute" className="w-full rounded" />}
        {!text && !imageUrl && <p className="text-sm text-gray-500">No details available.</p>}
      </div>
    </div>
  );
}

// ─── Excel export helpers ──────────────────────────────────────────────────────
const discrepancyToSheetRows = (rows: any[]) => rows.map((o) => ({
  'AWB':              o.awbNumber,
  'Date':             o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
  'User':             o.user?.fullname || o.user?.name || '',
  'User Email':       o.user?.email || '',
  'Courier':          o.courierServiceName || '',
  'Applied Weight (Kg)': o.enteredWeight?.applicableWeight ?? '',
  'Charged Weight (Kg)': o.chargedWeight?.applicableWeight ?? '',
  'Excess Weight (Kg)':  o.excessWeightCharges?.excessWeight ?? '',
  'Excess Charges':      o.excessWeightCharges?.excessCharges ?? '',
  'Pending Amount':      o.excessWeightCharges?.pendingAmount ?? '',
  'Status':           o.adminStatus || o.status || '',
}));

const exportDiscrepancyToExcel = (rows: any[], filename: string) => {
  const sheet = XLSX.utils.json_to_sheet(discrepancyToSheetRows(rows));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'WeightDiscrepancy');
  XLSX.writeFile(workbook, filename);
};

// ── Main Component ────────────────────────────────────────────────────────────
export function AdminWeightDiscrepancy() {
  const { isAdmin, adminTab, currentUserId, loadingAdminTab } = useAdminTab();
  const isAdminView = isAdmin && adminTab;
  // AdminLayout adds a 32px impersonation banner (pt-8) above the page when an
  // admin is impersonating a user — the page height calc must account for it too,
  // otherwise the extra 32px overflows the viewport and the whole page scrolls.
  const isImpersonating = !!localStorage.getItem('admin_token_backup');

  // ── Tabs — each tab is its own URL sub-route (/admin/weight-discrepancy/:tabSlug) ──
  const navigate = useNavigate();
  const location = useLocation();
  const isUserRoute = location.pathname.startsWith('/user/');
  const wdBase = isUserRoute ? '/user/weight-discrepancy' : '/admin/weight-discrepancy';
  const { tabSlug } = useParams<{ tabSlug?: string }>();
  const [activeTab, setActiveTab] = useState<TabName>(() => (tabSlug && SLUG_TO_TAB[tabSlug]) || 'All');

  // Keep activeTab in sync with the URL (browser back/forward, direct links, refresh)
  useEffect(() => {
    const tabFromUrl = (tabSlug && SLUG_TO_TAB[tabSlug]) || 'All';
    setActiveTab(prev => (prev === tabFromUrl ? prev : tabFromUrl));
  }, [tabSlug]);

  const handleTabChange = (tab: TabName) => {
    const path = `${wdBase}/${TAB_SLUG_MAP[tab]}`;
    if (tab !== 'All' && activeTab !== 'All') {
      navigate(path, { replace: true });
    } else {
      navigate(path);
    }
  };

  // ── Data
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [courierOptions, setCourierOptions] = useState<string[]>([]);
  const [showMobileWDStats, setShowMobileWDStats] = useState(false);

  // ── Filters
  const [searchInput, setSearchInput] = useState('');
  const [searchBy, setSearchBy] = useState('awbNumber');
  const [selectedCouriers, setSelectedCouriers] = useState<string[]>([]);
  const { dateStart, dateEnd, setDateStart, setDateEnd, onDateChange } = useDateRangeFilter();
  const {
    userQuery: userSearchText, userMongoId, userSuggestions: userResults,
    setUserQuery: setUserSearchText, setUserMongoId, setUserSuggestions: setUserResults,
    onQueryChange: onUserSearchTextChange,
    selectUser: selectUserSuggestion,
    clearUser: clearUserSearchFilter,
  } = useUserSearchFilter(isAdminView);

  // ── Global search (navbar search bar) ──
  const [globalSearchQuery, setGlobalSearchQuery] = useState((window as any).__adminSearchQuery?.toLowerCase() || '');
  useEffect(() => {
    const fn = (e: Event) => {
      setGlobalSearchQuery(((e as CustomEvent).detail || '').toLowerCase());
      setPage(1);
    };
    window.addEventListener('admin-search', fn);
    return () => window.removeEventListener('admin-search', fn);
  }, []);

  // ── Selection
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [copiedAwb, setCopiedAwb] = useState<string | null>(null);
  const [productHoverPos, setProductHoverPos] = useState<{ id: string; top: number; left: number } | null>(null);

  // ── UI
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [showMobileActionMenu, setShowMobileActionMenu] = useState(false);
  const [acceptModal, setAcceptModal] = useState<{ open: boolean; awb: string }>({ open: false, awb: '' });
  const [userAcceptModal, setUserAcceptModal] = useState<{ open: boolean; awb: string }>({ open: false, awb: '' });
  const [raiseDisputeModal, setRaiseDisputeModal] = useState<{ open: boolean; awb: string }>({ open: false, awb: '' });
  const [declineModal, setDeclineModal] = useState<{ open: boolean; awbs: string[] }>({ open: false, awbs: [] });
  const [bulkAcceptModal, setBulkAcceptModal] = useState<{ open: boolean; orderIds: string[]; label: string }>({ open: false, orderIds: [], label: '' });
  const [detailsModal, setDetailsModal] = useState<{ open: boolean; text: string; imageUrl: string }>({ open: false, text: '', imageUrl: '' });

  const handleWdDownloadSample = async () => {
    const res = await apiClient.get('/dispreancy/download-excel', { responseType: 'arraybuffer' });
    const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'Weight_Discrepancy_Sample_Format.xlsx';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const handleWdUpload = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append('file', file);
    await apiClient.post('/dispreancy/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    fetchDiscrepancy();
    fetchCounts();
    return 'Weight discrepancy uploaded successfully!';
  };

  const actionMenuRef = useRef<HTMLDivElement>(null);
  const userDropRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) setShowActionMenu(false);
      if (userDropRef.current && !userDropRef.current.contains(e.target as Node)) setUserResults([]);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // ── Fetch summary counts
  // Derive counts from getAllDiscrepancy (same endpoint + same user filter as the table).
  // allDispreancy always returns global counts so we can't use it for user-filtered counts.
  const fetchCounts = useCallback(async () => {
    try {
      const userParams: Record<string, any> = {};
      if (isAdminView && userMongoId) userParams.userSearch = userMongoId;
      else if (!isAdminView && currentUserId) userParams.userSearch = currentUserId;

      const statuses = [
        { key: 'pending',             status: 'pending' },
        { key: 'accepted',            status: 'Accepted' },
        { key: 'discrepancy raised',  status: 'Discrepancy Raised' },
        { key: 'escalated',           status: 'escalated' },
      ];

      const results = await Promise.all(
        statuses.map(({ status }) =>
          apiClient.get('/dispreancy/getAllDiscrepancy', {
            params: { ...userParams, status, limit: 1, page: 1 },
          })
        )
      );

      const map: Record<string, number> = {};
      statuses.forEach(({ key }, i) => {
        map[key] = results[i].data?.total || 0;
      });
      setCounts(map);
    } catch { /* ignore */ }
  }, [isAdminView, userMongoId, currentUserId]);

  // ── Fetch discrepancies
  // ── Shared params builder for discrepancy fetches/exports ──
  const buildDiscrepancyParams = useCallback((pg: number, limit: number) => {
    const params: Record<string, any> = { page: pg, limit };
    if (TAB_STATUS[activeTab]) params.status = TAB_STATUS[activeTab];
    if (selectedCouriers.length) params.courierService = selectedCouriers.join(',');

    // isAdminView user filter
    if (isAdminView && userMongoId) params.userSearch = userMongoId;
    else if (!isAdminView && currentUserId) params.userSearch = currentUserId;

    if (dateStart) params.fromDate = new Date(dateStart).toISOString();
    if (dateEnd) params.toDate = new Date(dateEnd).toISOString();
    if (searchInput.trim()) params[searchBy] = searchInput.trim();
    if (globalSearchQuery) params.searchQuery = globalSearchQuery;
    return params;
  }, [activeTab, selectedCouriers, isAdminView, userMongoId, currentUserId, dateStart, dateEnd, searchInput, searchBy, globalSearchQuery]);

  const fetchDiscrepancy = useCallback(async () => {
    setLoading(true);
    try {
      const params = buildDiscrepancyParams(page, rowsPerPage);
      const res = await apiClient.get('/dispreancy/getAllDiscrepancy', { params });
      setOrders(res.data?.results || []);
      setTotal(res.data?.total || 0);
      setTotalPages(Math.ceil((res.data?.total || 0) / rowsPerPage));
      if (Array.isArray(res.data?.courierServices)) {
        setCourierOptions(res.data.courierServices.map((c: any) =>
          typeof c === 'string' ? c : String(c?.name || c?.courierServiceName || '')
        ).filter(Boolean));
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [buildDiscrepancyParams, page, rowsPerPage]);

  // ── Excel export handlers ──
  const [exportingExcel, setExportingExcel] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportScope, setExportScope] = useState<'page' | 'all'>('page');

  const handleConfirmExport = async () => {
    setExportingExcel(true);
    try {
      if (exportScope === 'page') {
        exportDiscrepancyToExcel(orders, `WeightDiscrepancy-${activeTab}-Page${page}.xlsx`);
      } else {
        const PAGE_SIZE = 500;
        const first = await apiClient.get('/dispreancy/getAllDiscrepancy', { params: buildDiscrepancyParams(1, PAGE_SIZE) });
        let allRaw: any[] = first.data?.results || [];
        const totalCount = first.data?.total || allRaw.length;
        const pagesNeeded = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
        for (let p = 2; p <= pagesNeeded; p++) {
          const res = await apiClient.get('/dispreancy/getAllDiscrepancy', { params: buildDiscrepancyParams(p, PAGE_SIZE) });
          allRaw = allRaw.concat(res.data?.results || []);
        }
        exportDiscrepancyToExcel(allRaw, `WeightDiscrepancy-${activeTab}-All.xlsx`);
      }
    } catch (err) {
      console.error('Failed to export weight discrepancy:', err);
    } finally {
      setExportingExcel(false);
      setShowExportModal(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [rowsPerPage]);

  // Guard: wait for admin context to load before any fetch.
  // Without this, on refresh currentUserId is '' and the first call returns all data.
  useEffect(() => { if (!loadingAdminTab) fetchCounts(); }, [fetchCounts, loadingAdminTab]);
  useEffect(() => { if (!loadingAdminTab) fetchDiscrepancy(); }, [fetchDiscrepancy, loadingAdminTab]);
  useEffect(() => { setPage(1); setSelectedItems([]); }, [activeTab]);

  // ── User search (admin only) — matches AdminOrders pattern
  const handleUserInput = (v: string) => onUserSearchTextChange(v);
  const selectUser = (u: any) => { selectUserSuggestion(u); setPage(1); };
  const clearUserFilter = () => { clearUserSearchFilter(); setPage(1); };

  // ── Client-side refinement by navbar search — guarantees the header search bar
  // works even if the backend doesn't support the `searchQuery` param on this endpoint.
  const filteredOrders = useMemo(() => {
    if (!globalSearchQuery) return orders;
    const s = (v: any) => String(v ?? '').toLowerCase();
    return orders.filter(o =>
      s(o.awbNumber).includes(globalSearchQuery) ||
      s(o.courierServiceName).includes(globalSearchQuery) ||
      s(o.user?.fullname || o.user?.name).includes(globalSearchQuery) ||
      s(o.user?.email).includes(globalSearchQuery) ||
      s(o.user?.userId).includes(globalSearchQuery)
    );
  }, [orders, globalSearchQuery]);

  // ── Selection helpers
  const toggleAll = () =>
    setSelectedItems(selectedItems.length === filteredOrders.length && filteredOrders.length > 0 ? [] : filteredOrders.map(o => o._id));
  const toggleOne = (id: string) =>
    setSelectedItems(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  // ── Copy AWB
  const copyAwb = (awb: string, key: string) => {
    const showCopied = () => {
      setCopiedAwb(key);
      setTimeout(() => setCopiedAwb(null), 1500);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(awb).then(showCopied).catch(() => {
        // Clipboard API blocked (insecure context, permissions) — fall back to legacy copy
        const ta = document.createElement('textarea');
        ta.value = awb;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch { /* ignore */ }
        document.body.removeChild(ta);
        showCopied();
      });
    } else {
      const ta = document.createElement('textarea');
      ta.value = awb;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch { /* ignore */ }
      document.body.removeChild(ta);
      showCopied();
    }
  };

  // ── Export
  const handleExport = async () => {
    if (selectedItems.length === 0) { alert('Select at least one row to export.'); return; }
    try {
      const res = await apiClient.post('/dispreancy/exportWeightDiscrepancy',
        { disputeId: selectedItems }, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url; a.download = 'weight_discrepancy_export.csv';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    } catch { alert('Export failed'); }
  };

  // ── Bulk decline (admin — Dispute tab)
  const handleBulkDecline = () => {
    if (selectedItems.length === 0) { alert('Select at least one row.'); return; }
    const awbs = orders.filter(o => selectedItems.includes(o._id)).map(o => o.awbNumber);
    setDeclineModal({ open: true, awbs });
  };

  // ── Bulk accept (admin — accepts selected raised disputes)
  const handleBulkAccept = () => {
    if (selectedItems.length === 0) { alert('Select at least one row.'); return; }
    setBulkAcceptModal({ open: true, orderIds: selectedItems, label: 'Bulk Accept Disputes' });
  };

  // ── Bulk accept (user — accepts selected pending discrepancies)
  const handleUserBulkAccept = () => {
    if (selectedItems.length === 0) { alert('Select at least one row.'); return; }
    setBulkAcceptModal({ open: true, orderIds: selectedItems, label: 'Accept Discrepancies' });
  };

  // ── Clear filters
  const clearFilters = () => {
    setSearchInput('');
    setSelectedCouriers([]);
    setDateStart('');
    setDateEnd('');
    setUserMongoId('');
    setUserSearchText('');
    setPage(1);
  };
  const hasFilters = !!(searchInput || selectedCouriers.length || dateStart || dateEnd || userMongoId);

  // ── Courier options for GlassDropdown
  const courierDropOptions = courierOptions.map(c => ({ label: c, value: c }));

  // ── Days left badge (for pending orders)
  const daysLeft = (createdAt: string) => {
    const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000);
    return Math.max(7 - days, 0);
  };

  // ── Pagination range
  const startIdx = total === 0 ? 0 : (page - 1) * rowsPerPage + 1;
  const endIdx = Math.min(page * rowsPerPage, total);

  // ── Columns for non-Dispute vs Dispute tab
  const isDisputeTab = activeTab === 'Dispute';

  return (
    <AdminLayout>
      <div className={`flex flex-col ${isImpersonating ? 'h-[calc(100vh-104px)]' : 'h-[calc(100vh-72px)]'} -m-4 md:-m-6 bg-white ${!isAdminView ? 'overflow-hidden' : ''}`}>

        {/* ── Mobile Search + Filter + Action + Upload Row (matches Wallet page) ── */}
        <div className="md:hidden px-3 py-2.5 border-b border-[#E2E8F0] flex items-center gap-2 bg-white">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="AWB/Order ID tracking"
              value={searchInput}
              onChange={e => { setSearchInput(e.target.value); setPage(1); }}
              className="w-full h-9 pl-9 pr-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-2 focus:ring-[#00A86B]/10 transition-all"
            />
          </div>
          {/* Filter icon */}
          <button
            onClick={() => setIsMobileFiltersOpen(true)}
            className="w-9 h-9 rounded-xl border border-[#E2E8F0] flex items-center justify-center text-[#475569] bg-white shrink-0"
          >
            <Filter className="w-4 h-4" />
          </button>
          {/* Action icon */}
          <div className="relative shrink-0">
            <button
              onClick={() => selectedItems.length > 0 && setShowMobileActionMenu(v => !v)}
              disabled={selectedItems.length === 0}
              className="w-9 h-9 rounded-xl border border-[#E2E8F0] flex items-center justify-center text-[#475569] bg-white relative disabled:opacity-50"
            >
              <MoreVertical className="w-4 h-4" />
              {selectedItems.length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full bg-[#00A86B] text-white text-[9px] font-bold flex items-center justify-center px-0.5">
                  {selectedItems.length}
                </span>
              )}
            </button>
            {showMobileActionMenu && selectedItems.length > 0 && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMobileActionMenu(false)} />
                <div className="absolute right-0 top-full mt-2 w-[200px] bg-white rounded-xl shadow-[0_8px_28px_-6px_rgba(0,0,0,0.15)] border border-[#E2E8F0] py-1.5 z-50">
                  <button onClick={() => { handleExport(); setShowMobileActionMenu(false); }} className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors">Export</button>
                  {activeTab === 'Pending' && !isAdminView && (
                    <button onClick={() => { handleUserBulkAccept(); setShowMobileActionMenu(false); }} className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#00A86B] hover:bg-green-50 transition-colors">Accept All</button>
                  )}
                  {isDisputeTab && isAdminView && (
                    <button onClick={() => { handleBulkAccept(); setShowMobileActionMenu(false); }} className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#00A86B] hover:bg-green-50 transition-colors">Bulk Accept</button>
                  )}
                  {isDisputeTab && (
                    <button onClick={() => { handleBulkDecline(); setShowMobileActionMenu(false); }} className="w-full text-left px-4 py-2.5 text-[13px] font-semibold text-red-600 hover:bg-red-50 transition-colors">Bulk Decline</button>
                  )}
                </div>
              </>
            )}
          </div>
          {/* Upload icon — admin only */}
          {!isUserRoute && (
            <button
              onClick={() => setShowUpload(true)}
              className="w-9 h-9 rounded-xl bg-[#00A86B] flex items-center justify-center text-white shadow-sm active:bg-[#009B63] transition-colors shrink-0"
              title="Upload discrepancy"
            >
              <Upload className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* ── Tab bar ── */}
        <div className="bg-white border-b border-[#E2E8F0] relative z-50 shrink-0">
          <div className="flex justify-between items-center px-4 md:px-6 py-2 border-b border-[#E2E8F0] bg-white overflow-x-auto no-scrollbar">
            <div className="flex gap-1 items-center bg-[#F7FEFC] rounded-full p-1.5 shrink-0">
              {MAIN_TABS.map(tab => (
                <button key={tab} onClick={() => handleTabChange(tab)}
                  ref={(el) => { if (el && activeTab === tab) el.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }}
                  className={`relative px-4 py-2 text-[14px] md:text-[13px] font-semibold md:font-bold transition-colors whitespace-nowrap rounded-full flex items-center gap-1.5 cursor-pointer ${
                    activeTab === tab ? 'text-[#00A86B] underline underline-offset-4 decoration-2' : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}>
                  {tab}
                </button>
              ))}
            </div>
            <div className="hidden md:flex items-center gap-2 shrink-0 ml-4">
              <button onClick={() => setShowExportModal(true)} aria-label="Download Excel"
                className="w-8 h-8 rounded-full border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-[#F8FAFC] cursor-pointer">
                <Download className="w-4 h-4" />
              </button>
              <button onClick={() => { fetchDiscrepancy(); fetchCounts(); }}
                className="w-8 h-8 rounded-full border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-[#F8FAFC] cursor-pointer">
                <RefreshCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── Summary cards (desktop) ── */}
          <div className="hidden md:flex p-4 border-b border-[#E2E8F0] bg-[#F8FAFC]/30 flex-wrap gap-4">
            <div className="flex-1 min-w-[180px] bg-white rounded-xl p-3 border border-[#E2E8F0] flex items-center gap-3 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-[#E0F2FE] flex items-center justify-center shrink-0">
                <Package className="w-4 h-4 text-[#0EA5E9]" />
              </div>
              <div className="min-w-0">
                <div className="text-[18px] font-bold text-[#0F172A] leading-tight">{counts['pending'] ?? 0}</div>
                <div className="text-[10px] font-semibold text-[#64748B] leading-tight truncate">New Discrepancies</div>
              </div>
            </div>
            <div className="flex-1 min-w-[180px] bg-[#F0FDF4] rounded-xl p-3 border border-[#BBF7D0] flex items-center gap-3 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-[#BBF7D0] flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 text-[#16A34A]" />
              </div>
              <div className="min-w-0">
                <div className="text-[18px] font-bold text-[#0F172A] leading-tight">{counts['accepted'] ?? 0}</div>
                <div className="text-[10px] font-semibold text-[#64748B] leading-tight truncate">Accepted</div>
              </div>
            </div>
            <div className="flex-1 min-w-[180px] bg-[#FFFBEB] rounded-xl p-3 border border-[#FDE68A] flex items-center gap-3 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-[#FDE68A] flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-[#D97706]" />
              </div>
              <div className="min-w-0">
                <div className="text-[18px] font-bold text-[#0F172A] leading-tight">{counts['discrepancy raised'] ?? 0}</div>
                <div className="text-[10px] font-semibold text-[#64748B] leading-tight truncate">Disputes</div>
              </div>
            </div>
            <div className="flex-1 min-w-[180px] bg-[#FFF1F2] rounded-xl p-3 border border-[#FECDD3] flex items-center gap-3 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-[#FECDD3] flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-[#E11D48]" />
              </div>
              <div className="min-w-0">
                <div className="text-[18px] font-bold text-[#0F172A] leading-tight">{counts['escalated'] ?? 0}</div>
                <div className="text-[10px] font-semibold text-[#64748B] leading-tight truncate">Escalated</div>
              </div>
            </div>
          </div>

          {/* ── Summary cards (mobile, collapsible) ── */}
          <div className="md:hidden border-b border-[#E2E8F0] bg-white">
            <button onClick={() => setShowMobileWDStats(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 text-[13px] font-bold text-[#0F172A]">
              Summary
              <ChevronDown className={`w-4 h-4 text-[#64748B] transition-transform ${showMobileWDStats ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {showMobileWDStats && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }} className="overflow-hidden">
                  <div className="grid grid-cols-2 gap-2.5 px-3 pb-3">
                    <div className="bg-white rounded-xl p-2.5 border border-[#E2E8F0] flex items-center gap-2 shadow-sm">
                      <div className="w-7 h-7 rounded-full bg-[#E0F2FE] flex items-center justify-center shrink-0">
                        <Package className="w-3.5 h-3.5 text-[#0EA5E9]" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[15px] font-bold text-[#0F172A] leading-tight">{counts['pending'] ?? 0}</div>
                        <div className="text-[9.5px] font-semibold text-[#64748B] leading-tight truncate">New Discrepancies</div>
                      </div>
                    </div>
                    <div className="bg-[#F0FDF4] rounded-xl p-2.5 border border-[#BBF7D0] flex items-center gap-2 shadow-sm">
                      <div className="w-7 h-7 rounded-full bg-[#BBF7D0] flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[15px] font-bold text-[#0F172A] leading-tight">{counts['accepted'] ?? 0}</div>
                        <div className="text-[9.5px] font-semibold text-[#64748B] leading-tight truncate">Accepted</div>
                      </div>
                    </div>
                    <div className="bg-[#FFFBEB] rounded-xl p-2.5 border border-[#FDE68A] flex items-center gap-2 shadow-sm">
                      <div className="w-7 h-7 rounded-full bg-[#FDE68A] flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-3.5 h-3.5 text-[#D97706]" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[15px] font-bold text-[#0F172A] leading-tight">{counts['discrepancy raised'] ?? 0}</div>
                        <div className="text-[9.5px] font-semibold text-[#64748B] leading-tight truncate">Disputes</div>
                      </div>
                    </div>
                    <div className="bg-[#FFF1F2] rounded-xl p-2.5 border border-[#FECDD3] flex items-center gap-2 shadow-sm">
                      <div className="w-7 h-7 rounded-full bg-[#FECDD3] flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-3.5 h-3.5 text-[#E11D48]" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[15px] font-bold text-[#0F172A] leading-tight">{counts['escalated'] ?? 0}</div>
                        <div className="text-[9.5px] font-semibold text-[#64748B] leading-tight truncate">Escalated</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Filter row (desktop) ── */}
          <div className="hidden md:flex py-3 px-6 border-b border-[#CBD5F5] flex-wrap items-center gap-3 bg-[#F8FAFC]/50 relative z-50">

            {/* User search (admin only) — matches AdminOrders pattern */}
            {isAdminView && (
              <div className="relative shrink-0" ref={userDropRef}>
                <div className="relative">
                  <input type="text" placeholder="Search user..."
                    value={userSearchText}
                    onChange={e => handleUserInput(e.target.value)}
                    className="glass-search-input w-[170px]" style={{ paddingLeft: '2rem', paddingRight: '1.75rem' }} />
                  <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  {userMongoId && (
                    <button onClick={clearUserFilter}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                {userResults.length > 0 && !userMongoId && (
                  <div className="absolute left-0 top-full mt-1 w-[260px] bg-white border border-[#E2E8F0] rounded-xl shadow-xl z-[200] max-h-52 overflow-y-auto py-1">
                    {userResults.map((u: any) => (
                      <button key={u._id} type="button" onClick={() => selectUser(u)}
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

            {/* AWB search */}
            <input type="text" placeholder="Search AWB..."
              value={searchInput} onChange={e => { setSearchInput(e.target.value); setPage(1); }}
              className="glass-search-input w-[160px] shrink-0" />

            {/* Courier filter */}
            <GlassDropdown
              label="Courier"
              options={courierDropOptions}
              selected={selectedCouriers}
              onChange={v => { setSelectedCouriers(v); setPage(1); }}
              placeholder="Search courier..."
              icon={<Truck className="w-3.5 h-3.5" />}
            />

            {/* Date filter */}
            <GlassDateFilter
              align="right"
              startDate={dateStart}
              endDate={dateEnd}
              onDateChange={(s, e) => { onDateChange(s, e); setPage(1); }}
            />

            <button onClick={() => { setPage(1); fetchDiscrepancy(); }}
              className="py-2 px-4 shrink-0 rounded-[32px] bg-[#009D64] border border-[#009D64] text-white text-xs font-medium leading-[18px] hover:bg-[#008a57] transition-colors cursor-pointer">
              Apply Filters
            </button>

            {hasFilters && (
              <button onClick={clearFilters}
                className="py-2 px-4 shrink-0 rounded-[32px] border border-red-200 text-red-500 text-xs font-medium leading-[18px] hover:bg-red-50 transition-colors cursor-pointer">
                Clear All
              </button>
            )}

            {/* Selection count badge */}
            {selectedItems.length > 0 && (
              <div className="h-9 px-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold flex items-center gap-1 shrink-0">
                {selectedItems.length} selected
              </div>
            )}

            <div className="ml-auto flex items-center gap-2 shrink-0">
              {/* Actions dropdown — disabled until at least one row is selected */}
              <div className="relative" ref={actionMenuRef}>
                <button onClick={() => selectedItems.length > 0 && setShowActionMenu(v => !v)} disabled={selectedItems.length === 0}
                  className={`py-2 pl-4 pr-8 rounded-[32px] border text-xs leading-[18px] font-medium relative transition-colors flex items-center ${selectedItems.length > 0 ? 'border-[#03C27D] bg-white text-[#64748B] hover:bg-[#F0FDF9] cursor-pointer' : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#CBD5E1] cursor-not-allowed'}`}>
                  Actions
                  <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2" />
                </button>
                {showActionMenu && (
                  <div className="absolute right-0 top-full mt-2 w-[170px] bg-white rounded-xl shadow-[0_8px_30px_-4px_rgba(0,0,0,0.15)] border border-[#E2E8F0] py-1.5 z-[200]">
                    {/* Export — all tabs */}
                    <button onClick={() => { handleExport(); setShowActionMenu(false); }}
                      className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFC]">
                      Export
                    </button>
                    {/* Pending tab — user can bulk accept */}
                    {activeTab === 'Pending' && !isAdminView && (
                      <button onClick={() => { handleUserBulkAccept(); setShowActionMenu(false); }}
                        className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#00A86B] hover:bg-green-50">
                        Accept All
                      </button>
                    )}
                    {/* Dispute tab — admin can bulk accept or bulk decline */}
                    {isDisputeTab && isAdminView && (
                      <button onClick={() => { handleBulkAccept(); setShowActionMenu(false); }}
                        className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#00A86B] hover:bg-green-50">
                        Bulk Accept
                      </button>
                    )}
                    {isDisputeTab && (
                      <button onClick={() => { handleBulkDecline(); setShowActionMenu(false); }}
                        className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-red-500 hover:bg-red-50">
                        Bulk Decline
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Upload button — admin only */}
              {!isUserRoute && (
                <button onClick={() => setShowUpload(true)}
                  className="w-9 h-9 rounded-full bg-[#00A86B] flex items-center justify-center text-white shadow-sm hover:bg-[#009B63] transition-colors"
                  title="Upload discrepancy">
                  <Upload className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Table (desktop) ── */}
        <div className="hidden md:flex bg-white flex-col flex-1 min-h-0 overflow-hidden border-t border-[#E2E8F0]">
          <div className="flex-1 overflow-auto w-full relative">
            {loading && <TableLoader />}
            <table className="w-full text-left border-collapse min-w-full">
              <thead className="sticky top-0 z-40 bg-[#E6F9F2] shadow-sm">
                <tr className="text-xs font-medium text-[#64748B] uppercase tracking-wider">
                  <th className="py-2 px-3 w-10 rounded-l-lg">
                    <input type="checkbox" className="rounded accent-[#00A86B] w-3.5 h-3.5"
                      checked={selectedItems.length === filteredOrders.length && filteredOrders.length > 0}
                      onChange={toggleAll} />
                  </th>
                  {isAdminView && (
                    <th className="py-2 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /><span>User</span></div>
                    </th>
                  )}
                  <th className="py-2 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5"><Package className="w-3.5 h-3.5" /><span>Product</span></div>
                  </th>
                  <th className="py-2 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5"><Upload className="w-3.5 h-3.5" /><span>Upload On</span></div>
                  </th>
                  <th className="py-2 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5"><Truck className="w-3.5 h-3.5" /><span>Shipment</span></div>
                  </th>
                  <th className="py-2 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5"><Package className="w-3.5 h-3.5" /><span>Applied Weight</span></div>
                  </th>
                  <th className="py-2 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5"><Package className="w-3.5 h-3.5" /><span>Charged Weight</span></div>
                  </th>
                  <th className="py-2 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /><span>Excess Charges</span></div>
                  </th>
                  <th className="py-2 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /><span>Status</span></div>
                  </th>
                  <th className="py-2 px-3 whitespace-nowrap text-center">Details</th>
                  <th className="py-2 px-3 whitespace-nowrap text-center rounded-r-lg">Actions</th>
                </tr>
              </thead>
              <tbody className="text-[11px] text-[#475569]">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={isAdminView ? 11 : 10}>
                      <EmptyState title="No discrepancies found" subtitle="Try changing filters" />
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order, idx) => {
                    const products: any[] = Array.isArray(order.productDetails) ? order.productDetails : [];
                    const rem = daysLeft(order.createdAt);
                    // Use adminStatus if present — it reflects the real dispute state
                    const orderStatus = safeText(order.adminStatus || order.status).toLowerCase();
                    const isPending = orderStatus === 'pending' || orderStatus === 'new';
                    const isDisputeRaised = orderStatus === 'discrepancy raised';

                    return (
                      <tr key={order._id || order.awbNumber || idx} className={`border-b border-[#E2E8F0] transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-[#E6EDF7]/20'}`}>
                        <td className="p-3">
                          <div className="flex flex-col items-start gap-1">
                            <input type="checkbox" className="rounded accent-[#00A86B] w-3.5 h-3.5"
                              checked={selectedItems.includes(order._id)}
                              onChange={() => toggleOne(order._id)} />
                            {isPending && (
                              <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap">
                                {rem > 0 ? `${rem}d left` : 'Auto soon'}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* User (admin view only) */}
                        {isAdminView && (
                          <td className="p-3">
                            <div className="text-xs font-semibold text-[#00A86B]">{order.user?.userId}</div>
                            <TruncatedText text={order.user?.fullname || order.user?.name || ''} maxLength={20} className="text-sm font-semibold text-[#0F172A] mt-0.5 max-w-[160px]" />
                            <TruncatedText text={order.user?.email || ''} maxLength={25} className="text-xs text-[#94A3B8] max-w-[180px]" />
                          </td>
                        )}

                        {/* Product */}
                        <td
                          className="p-3"
                          onMouseEnter={(e) => {
                            if (products.length === 0) return;
                            const rect = e.currentTarget.getBoundingClientRect();
                            setProductHoverPos({ id: order._id, top: rect.bottom + 4, left: rect.left });
                          }}
                          onMouseLeave={() => setProductHoverPos(prev => (prev?.id === order._id ? null : prev))}
                        >
                          <div className="text-xs font-normal text-[#0F172A] underline decoration-dotted underline-offset-2 hover:text-[#00A86B] truncate max-w-[140px] cursor-help">
                            {products.map(p => p.name).filter(Boolean).join(', ') || '—'}
                          </div>
                          <div className="text-xs font-normal text-[#64748B] mt-0.5 truncate max-w-[140px]">
                            SKU: {products.map(p => p.sku).filter(Boolean).join(', ') || '—'}
                          </div>
                          <div className="text-xs font-normal text-[#64748B]">
                            QTY: {products.reduce((s, p) => s + (p.quantity || 0), 0)}
                          </div>
                        </td>

                        {/* Upload On */}
                        <td className="p-3">
                          <div className="text-xs text-[#0F172A]">{fmtDate(order.createdAt)}</div>
                          <div className="text-xs text-[#64748B]">{fmtTime(order.createdAt)}</div>
                        </td>

                        {/* Shipment */}
                        <td className="p-3">
                          <div className="text-xs font-semibold text-[#00A86B]">{safeText(order.courierServiceName)}</div>
                          <div className="text-xs text-[#94A3B8] mt-0.5">Booked On:</div>
                          <div className="flex items-center gap-1 group mt-0.5">
                            <span
                              className="text-xs font-semibold text-[#00A86B] underline underline-offset-2 cursor-pointer hover:text-[#009B63]"
                              onClick={() => order.awbNumber && navigate(`${isAdminView ? '/admin' : '/user'}/tracking?awb=${order.awbNumber}`)}
                            >
                              {order.awbNumber}
                            </span>
                            <button onClick={() => copyAwb(order.awbNumber, `awb-${idx}`)}
                              className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-green-50 rounded text-gray-400 hover:text-[#00A86B]">
                              {copiedAwb === `awb-${idx}` ? (
                                <Check className="w-3 h-3 text-[#00A86B]" />
                              ) : (
                                <FileText className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Applied Weight */}
                        <td className="p-3 text-xs font-normal text-[#64748B]">
                          <div>Applied weight: {order.enteredWeight?.applicableWeight} Kg</div>
                          <div className="mt-0.5">Weight: {order.enteredWeight?.deadWeight} Kg</div>
                          {order.enteredWeight?.volumetricWeight && (
                            <>
                              <div className="mt-0.5">
                                {`L*W*H: ${order.enteredWeight.volumetricWeight.length ?? '—'}*${order.enteredWeight.volumetricWeight.breadth ?? '—'}*${order.enteredWeight.volumetricWeight.height ?? '—'}`}
                              </div>
                              <div className="mt-0.5">
                                Vol. Weight: {(
                                  ((order.enteredWeight.volumetricWeight.length || 0) *
                                    (order.enteredWeight.volumetricWeight.breadth || 0) *
                                    (order.enteredWeight.volumetricWeight.height || 0)) / 5000
                                ).toFixed(2)} KG
                              </div>
                            </>
                          )}
                        </td>

                        {/* Charged Weight */}
                        <td className="p-3 text-xs font-normal text-[#64748B]">
                          <div>Charged: {order.chargedWeight?.applicableWeight} Kg</div>
                          <div className="mt-0.5">Dead: {order.chargedWeight?.deadWeight} Kg</div>
                          {order.chargedDimension?.length && (
                            <div className="mt-0.5">
                              Vol: {(
                                (order.chargedDimension.length *
                                  order.chargedDimension.breadth *
                                  order.chargedDimension.height) / 5000
                              ).toFixed(2)} Kg
                              ({order.chargedDimension.length}×
                              {order.chargedDimension.breadth}×
                              {order.chargedDimension.height} cm)
                            </div>
                          )}
                        </td>

                        {/* Excess Charges */}
                        <td className="p-3 text-xs font-normal text-[#64748B]">
                          <div>Excess Wt: {order.excessWeightCharges?.excessWeight || 0} Kg</div>
                          <div className="mt-0.5">Excess Charges: ₹{Number(order.excessWeightCharges?.excessCharges || 0).toFixed(2)}</div>
                          <div className="mt-0.5">Pending: ₹{Number(order.excessWeightCharges?.pendingAmount || 0).toFixed(2)}</div>
                        </td>

                        {/* Status */}
                        <td className="p-3">
                          <span className={badge(safeText(order.adminStatus || order.status))}>
                            {safeText(order.adminStatus || order.status)}
                          </span>
                        </td>

                        {/* Details — always shown for dispute-raised rows */}
                        <td className="p-3 text-center">
                          {isDisputeRaised && (
                            <button onClick={() => setDetailsModal({ open: true, text: order.text || '', imageUrl: order.imageUrl || '' })}
                              className="text-[#00A86B] font-semibold text-xs hover:underline">
                              Details
                            </button>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-3">
                          {/* Admin: Accept / Decline raised disputes */}
                          {isAdminView && isDisputeRaised && (
                            <div className="flex flex-col gap-1.5 items-center">
                              <button onClick={() => setAcceptModal({ open: true, awb: order.awbNumber })}
                                className="w-16 px-2 py-1 rounded-lg bg-[#00A86B] text-white text-[10px] font-semibold hover:bg-[#009B63]">
                                Accept
                              </button>
                              <button onClick={() => setDeclineModal({ open: true, awbs: [order.awbNumber] })}
                                className="w-16 px-2 py-1 rounded-lg bg-red-500 text-white text-[10px] font-semibold hover:bg-red-600">
                                Decline
                              </button>
                            </div>
                          )}
                          {/* User: Accept discrepancy or Raise Dispute */}
                          {!isAdminView && isPending && (
                            <div className="flex flex-col gap-1.5 items-center">
                              <button onClick={() => setUserAcceptModal({ open: true, awb: order.awbNumber })}
                                className="w-20 px-2 py-1 rounded-lg bg-[#00A86B] text-white text-[10px] font-semibold hover:bg-[#009B63]">
                                Accept
                              </button>
                              <button onClick={() => setRaiseDisputeModal({ open: true, awb: order.awbNumber })}
                                className="w-20 px-2 py-1 rounded-lg bg-orange-500 text-white text-[10px] font-semibold hover:bg-orange-600">
                                Raise Dispute
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          {totalPages > 0 && (
            <DesktopPagination
              page={page}
              setPage={setPage}
              totalPages={totalPages}
              rowsPerPage={rowsPerPage}
              setRowsPerPage={setRowsPerPage}
              startIndex={startIdx}
              endIndex={endIdx}
              totalItems={total}
            />
          )}
        </div>

        {/* ── Cards (mobile) ── */}
        <div className="md:hidden bg-[#F8FAFC] flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto overflow-x-hidden w-full relative">
            {loading && <TableLoader />}
            {!loading && filteredOrders.length === 0 && (
              <EmptyState title="No discrepancies found" subtitle="Try changing filters" />
            )}
            {!loading && filteredOrders.length > 0 && (
              <div className="p-2 space-y-2">
                {filteredOrders.map((order, idx) => {
                  const products: any[] = Array.isArray(order.productDetails) ? order.productDetails : [];
                  const rem = daysLeft(order.createdAt);
                  const statusText = safeText(order.adminStatus || order.status);
                  const orderStatus = statusText.toLowerCase();
                  const isPending = orderStatus === 'pending' || orderStatus === 'new';
                  const isDisputeRaised = orderStatus === 'discrepancy raised';
                  const logo = getCourierLogo(safeText(order.courierServiceName));
                  const key = order._id || order.awbNumber || idx;

                  return (
                    <div key={key} className="relative bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-visible">
                      {/* Ribbon */}
                      <div
                        className={`absolute top-0 left-0 px-3.5 py-1 text-[10px] font-bold text-white uppercase tracking-wide rounded-tl-2xl ${
                          isDisputeRaised ? 'bg-rose-500' : orderStatus === 'accepted' ? 'bg-[#00A86B]' : orderStatus === 'escalated' ? 'bg-rose-600' : 'bg-blue-500'
                        }`}
                        style={{ clipPath: 'polygon(0 0, 100% 0, 84% 100%, 0% 100%)' }}
                      >
                        {statusText || 'Pending'}
                      </div>

                      {/* Checkbox — top-right, parallel to the status ribbon */}
                      <input type="checkbox" className="absolute top-2 right-2.5 rounded accent-[#00A86B] w-4 h-4 shrink-0 z-10"
                        checked={selectedItems.includes(order._id)}
                        onChange={() => toggleOne(order._id)} />

                      <div className="pt-7 px-3 pb-2.5">
                        {/* User */}
                        <div className="flex items-start justify-between gap-2 mb-1.5 pr-6">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {isAdminView ? (
                              <div className="w-7 h-7 rounded-full bg-[#F0FDF4] flex items-center justify-center text-[#00A86B] text-[11px] font-bold shrink-0">
                                {(order.user?.fullname || order.user?.name || '?').charAt(0).toUpperCase()}
                              </div>
                            ) : null}
                            <div className="min-w-0 flex-1">
                              {isAdminView && (
                                <>
                                  <div className="text-[12px] font-semibold text-[#0F172A] truncate max-w-full">{order.user?.fullname || order.user?.name || '—'}</div>
                                  <div className="text-[11px] text-[#94A3B8] truncate max-w-full">{order.user?.email || ''}</div>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            {isAdminView && order.user?.userId && (
                              <span className="text-[12px] font-semibold text-[#009D64]">{order.user.userId}</span>
                            )}
                            {isPending && (
                              <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap">
                                {rem > 0 ? `${rem}d left` : 'Auto soon'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Weights row */}
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="text-[12px] text-[#64748B]">
                            Charged weight: <span className="font-semibold text-[#0F172A]">{order.chargedWeight?.applicableWeight ?? '—'} Kg</span>
                          </div>
                          <div className="text-[12px] text-[#64748B] shrink-0">
                            Pending: <span className="font-semibold text-[#059669]">₹{Number(order.excessWeightCharges?.pendingAmount || 0).toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="text-[12px] text-[#64748B] mb-1.5">
                          Applied weight: <span className="font-semibold text-[#0F172A]">{order.enteredWeight?.applicableWeight ?? '—'} Kg</span>
                        </div>

                        {/* Courier + AWB + price row */}
                        <div className="flex items-center justify-between gap-2 bg-[#F8FAFC] rounded-xl px-2.5 py-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-white border border-[#E2E8F0] flex items-center justify-center shrink-0 overflow-hidden">
                              {logo ? <img src={logo} alt="" className="w-5 h-5 object-contain" /> : <Truck className="w-3.5 h-3.5 text-[#94A3B8]" />}
                            </div>
                            <div className="min-w-0">
                              <div className="text-[11px] font-semibold text-[#64748B] truncate">{safeText(order.courierServiceName) || 'Courier'} {order.chargedWeight?.applicableWeight ?? ''}KG</div>
                              <div className="relative flex items-center gap-1">
                                <button
                                  onClick={() => order.awbNumber && navigate(`${isAdminView ? '/admin' : '/user'}/tracking?awb=${order.awbNumber}`)}
                                  className="text-[11px] font-semibold text-[#00A86B] hover:underline truncate"
                                >
                                  {order.awbNumber}
                                </button>
                                {order.awbNumber && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); copyAwb(order.awbNumber, `mobile-card-${idx}`); }}
                                    className="p-0.5 text-[#94A3B8] hover:text-[#00A86B] shrink-0"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                )}
                                {copiedAwb === `mobile-card-${idx}` && (
                                  <span className="absolute left-0 -top-6 px-2 py-1 rounded-md bg-[#0F172A] text-white text-[10px] font-semibold whitespace-nowrap shadow-lg z-10">
                                    Copied!
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-[12px] font-normal text-[#059669] shrink-0">
                            ₹{Number(order.excessWeightCharges?.excessCharges || 0).toFixed(2)}
                          </div>
                        </div>

                        {/* Actions row — only rendered when there's something to show */}
                        {(isDisputeRaised || (!isAdminView && isPending)) && (
                          <div className="flex items-center gap-2 mt-2">
                            {isDisputeRaised && (
                              <button onClick={() => setDetailsModal({ open: true, text: order.text || '', imageUrl: order.imageUrl || '' })}
                                className="flex-1 h-8 rounded-full border border-[#E2E8F0] text-[#475569] text-[11px] font-bold hover:bg-[#F8FAFC] transition-colors">
                                Details
                              </button>
                            )}
                            {isAdminView && isDisputeRaised && (
                              <>
                                <button onClick={() => setAcceptModal({ open: true, awb: order.awbNumber })}
                                  className="flex-1 h-8 rounded-full bg-[#00A86B] hover:bg-[#009B63] text-white text-[11px] font-bold transition-colors">
                                  Accept
                                </button>
                                <button onClick={() => setDeclineModal({ open: true, awbs: [order.awbNumber] })}
                                  className="flex-1 h-8 rounded-full bg-red-500 hover:bg-red-600 text-white text-[11px] font-bold transition-colors">
                                  Decline
                                </button>
                              </>
                            )}
                            {!isAdminView && isPending && (
                              <>
                                <button onClick={() => setUserAcceptModal({ open: true, awb: order.awbNumber })}
                                  className="flex-1 h-8 rounded-full bg-[#00A86B] hover:bg-[#009B63] text-white text-[11px] font-bold transition-colors">
                                  Accept
                                </button>
                                <button onClick={() => setRaiseDisputeModal({ open: true, awb: order.awbNumber })}
                                  className="flex-1 h-8 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-bold transition-colors">
                                  Raise Dispute
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Mobile Pagination */}
          {<MobilePaginationBar {...({
            page,
            setPage,
            totalPages,
            rowsPerPage,
            setRowsPerPage,
            startIndex: startIdx,
            endIndex: endIdx,
            totalItems: total,
          })} />}
        </div>
      </div>

      {/* ── Product line-item hover card — rendered on document.body to escape overflow-auto clipping ── */}
      {productHoverPos && (() => {
        const hoveredOrder = orders.find(o => o._id === productHoverPos.id);
        const hoveredProducts: any[] = hoveredOrder && Array.isArray(hoveredOrder.productDetails) ? hoveredOrder.productDetails : [];
        if (hoveredProducts.length === 0) return null;
        const totalQty = hoveredProducts.reduce((s: number, p: any) => s + (p.quantity || 0), 0);
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
                  <th className="text-left font-semibold pb-1.5">Qty</th>
                </tr>
              </thead>
              <tbody>
                {hoveredProducts.map((p: any, i: number) => (
                  <tr key={i} className="text-[#0F172A]">
                    <td className="py-1 pr-2 break-words">{p.name}</td>
                    <td className="py-1 pr-2 text-[#64748B] break-words">{p.sku}</td>
                    <td className="py-1">{p.quantity}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-[#E2E8F0] font-bold text-[#0F172A]">
                  <td className="pt-1.5">Total</td>
                  <td className="pt-1.5"></td>
                  <td className="pt-1.5">{totalQty}</td>
                </tr>
              </tfoot>
            </table>
          </div>,
          document.body
        );
      })()}

      {/* ── Mobile Filters Bottom Sheet ── */}
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
              className="bg-white rounded-t-3xl border-t border-[#E2E8F0] shadow-2xl w-full max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between sticky top-0 bg-white z-10">
                <h3 className="font-bold text-slate-800 text-base">Filters</h3>
                <button onClick={() => setIsMobileFiltersOpen(false)} className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-3">
                {/* Date range */}
                <GlassDateFilter
                  className="w-full [&_.glass-dropdown-trigger]:!w-full [&_.glass-dropdown-trigger]:!h-12 [&_.glass-dropdown-trigger]:!min-w-0 [&_.glass-dropdown-trigger]:!rounded-full"
                  startDate={dateStart}
                  endDate={dateEnd}
                  onDateChange={(s, e) => { onDateChange(s, e); setPage(1); }}
                />

                {/* Search user (admin only) */}
                {isAdminView && (
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by name, email, or contact..."
                      value={userSearchText}
                      onChange={e => handleUserInput(e.target.value)}
                      className="w-full h-12 pl-4 pr-10 rounded-full border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B] placeholder:text-slate-400"
                    />
                    {userMongoId ? (
                      <button onClick={clearUserFilter} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    ) : (
                      <Search className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    )}
                    {userResults.length > 0 && !userMongoId && (
                      <div className="mt-1.5 bg-white border border-[#E2E8F0] rounded-2xl shadow-lg max-h-52 overflow-y-auto py-1">
                        {userResults.map((u: any) => (
                          <button key={u._id} type="button" onClick={() => selectUser(u)}
                            className="w-full text-left px-4 py-2.5 hover:bg-[#F0FDF4] flex items-start gap-2">
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
                )}

                {/* Search AWB Number */}
                <input
                  type="text"
                  placeholder="Search AWB Number"
                  value={searchInput}
                  onChange={e => { setSearchInput(e.target.value); setPage(1); }}
                  className="w-full h-12 px-4 rounded-full border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B] placeholder:text-slate-400"
                />

                {/* Search Type */}
                <div className="relative">
                  <select
                    value={searchBy}
                    onChange={e => { setSearchBy(e.target.value); setPage(1); }}
                    className="w-full h-12 px-4 pr-10 rounded-full border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B] bg-white appearance-none"
                  >
                    <option value="awbNumber">Search by AWB Number</option>
                    <option value="orderId">Search by Order ID</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Courier Service */}
                <GlassDropdown
                  label="Courier"
                  options={courierDropOptions}
                  selected={selectedCouriers}
                  onChange={v => { setSelectedCouriers(v); setPage(1); }}
                  placeholder="Courier Service"
                  className="w-full [&_.glass-dropdown-trigger]:!w-full [&_.glass-dropdown-trigger]:!h-12 [&_.glass-dropdown-trigger]:!min-w-0 [&_.glass-dropdown-trigger]:!rounded-full"
                />

                {/* Status — mirrors the tabs */}
                <div className="relative">
                  <select
                    value={activeTab}
                    onChange={e => handleTabChange(e.target.value as TabName)}
                    className="w-full h-12 px-4 pr-10 rounded-full border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B] bg-white appearance-none"
                  >
                    {MAIN_TABS.map(tab => <option key={tab} value={tab}>{tab === 'All' ? 'All Statuses' : tab}</option>)}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-[#E2E8F0] flex items-center gap-3 sticky bottom-0 bg-white">
                <button
                  onClick={() => { clearFilters(); setIsMobileFiltersOpen(false); }}
                  className="flex-1 h-11 rounded-full border border-[#00A86B] text-[#00A86B] text-sm font-bold hover:bg-[#F0FDF4] transition-colors"
                >
                  Reset All
                </button>
                <button
                  onClick={() => { setPage(1); fetchDiscrepancy(); setIsMobileFiltersOpen(false); }}
                  className="flex-1 h-11 rounded-full bg-[#009D64] text-white text-sm font-bold hover:bg-[#009B63] transition-colors shadow-sm"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
      {acceptModal.open && (
        <AcceptModal awb={acceptModal.awb}
          onClose={() => setAcceptModal({ open: false, awb: '' })}
          onDone={() => { fetchDiscrepancy(); fetchCounts(); }} />
      )}
      {declineModal.open && (
        <DeclineModal awbNumbers={declineModal.awbs}
          onClose={() => setDeclineModal({ open: false, awbs: [] })}
          onDone={() => { fetchDiscrepancy(); fetchCounts(); setSelectedItems([]); }} />
      )}
      {userAcceptModal.open && (
        <UserAcceptModal awb={userAcceptModal.awb}
          onClose={() => setUserAcceptModal({ open: false, awb: '' })}
          onDone={() => { fetchDiscrepancy(); fetchCounts(); }} />
      )}
      {raiseDisputeModal.open && (
        <RaiseDisputeModal awb={raiseDisputeModal.awb}
          onClose={() => setRaiseDisputeModal({ open: false, awb: '' })}
          onDone={() => { fetchDiscrepancy(); fetchCounts(); }} />
      )}
      {bulkAcceptModal.open && (
        <BulkAcceptModal orderIds={bulkAcceptModal.orderIds} label={bulkAcceptModal.label}
          onClose={() => setBulkAcceptModal({ open: false, orderIds: [], label: '' })}
          onDone={() => { fetchDiscrepancy(); fetchCounts(); setSelectedItems([]); }} />
      )}
      <SharedUploadModal
        open={showUpload}
        onClose={() => setShowUpload(false)}
        title="Upload Weight Discrepancy"
        subtitle="Upload bulk weight discrepancy data"
        onDownloadSample={handleWdDownloadSample}
        downloadSampleLabel="Download Sample"
        uploadButtonLabel="Submit"
        onUpload={handleWdUpload}
      />
      {detailsModal.open && (
        <DetailsModal text={detailsModal.text} imageUrl={detailsModal.imageUrl}
          onClose={() => setDetailsModal({ open: false, text: '', imageUrl: '' })} />
      )}
    </AdminLayout>
  );
}
