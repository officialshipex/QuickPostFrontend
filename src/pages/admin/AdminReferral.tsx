import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { apiClient } from '../../services/apiClient';
import { useAdminTab } from '../../context/AdminUserContext';
import {
  RefreshCcw, User, Package, Truck, Wallet,
  Phone, Calendar, ChevronDown, X, Mail, Users, Download, Settings, MoreHorizontal,
} from 'lucide-react';
import { GlassDropdown } from '../../components/ui/GlassDropdown';
import { TableLoader } from '../../components/ui/TableLoader';
import { EmptyState } from '../../components/ui/EmptyState';
import { TruncatedText } from '../../components/ui/TruncatedText';
import { DesktopPagination } from '../../hooks/usePagination';

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const getMonthFull = (m: number) => MONTH_NAMES[(m - 1)] ?? '—';

const formatCurrency = (val: number) =>
  '₹' + Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface ReferralRow {
  _id: string;
  userId: string;
  userName: string;
  email: string;
  mobile: string;
  totalOrderCount: number;
  totalShipping: number;
  totalCommission: number;
  month: number;
  year: number | string;
  subUsers?: any[];
}

interface Summary {
  totalUsers: number;
  totalOrders: number;
  totalCommission: number;
  totalShipping: number;
}

// ─── Type scale — only these four are allowed anywhere in this modal ─────────
// 14px semibold : section/modal titles
// 12px semibold : field labels, tags, table headers
// 12px regular  : field values, body content
// 10px semibold : small badges/meta text
const DTXT = {
  title: 'text-[14px] font-semibold',
  label: 'text-[12px] font-semibold',
  value: 'text-[12px] font-normal',
  meta: 'text-[10px] font-semibold',
};

function ReferralDetailsModal({ referral, onClose }: { referral: ReferralRow; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-[12px] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-[#E2E8F0]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
          <div>
            <h2 className={`${DTXT.title} text-[#0F172A]`}>Referral Performance Details</h2>
            <p className={`${DTXT.value} text-[#94A3B8] mt-0.5`}>{getMonthFull(referral.month)} {referral.year}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-[#64748B] hover:bg-[#F8FAFC] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Referrer Information */}
            <div className="bg-white border border-[#E2E8F0] rounded-[10px] p-4">
              <h3 className={`${DTXT.title} text-[#0F172A] flex items-center gap-2 mb-3`}>
                <User className="w-4 h-4 text-[#64748B]" /> Referrer Information
              </h3>
              <div className="flex flex-col gap-2.5">
                <div className="flex justify-between items-center">
                  <span className={`${DTXT.label} text-[#94A3B8]`}>Full Name</span>
                  <span className={`${DTXT.value} text-[#1E293B]`}>{referral.userName || '—'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`${DTXT.label} text-[#94A3B8]`}>User ID</span>
                  <span className={`${DTXT.value} text-[#00A86B]`}>{referral.userId || '—'}</span>
                </div>
                <div className="h-px bg-[#F1F5F9]" />
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                  <span className={`${DTXT.value} text-[#475569] truncate`}>{referral.email || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                  <span className={`${DTXT.value} text-[#475569]`}>{referral.mobile || '—'}</span>
                </div>
              </div>
            </div>

            {/* Monthly Summary */}
            <div className="bg-white border border-[#E2E8F0] rounded-[10px] p-4">
              <h3 className={`${DTXT.title} text-[#0F172A] mb-3`}>Monthly Summary</h3>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2.5 bg-[#F8FAFC] rounded-[8px] border border-[#E2E8F0]">
                  <p className={`${DTXT.meta} text-[#94A3B8] mb-1`}>Orders</p>
                  <p className={`${DTXT.title} text-[#0F172A]`}>{referral.totalOrderCount || 0}</p>
                </div>
                <div className="text-center p-2.5 bg-[#F8FAFC] rounded-[8px] border border-[#E2E8F0]">
                  <p className={`${DTXT.meta} text-[#94A3B8] mb-1`}>Freight</p>
                  <p className={`${DTXT.title} text-[#00A86B]`}>₹{Math.round(referral.totalShipping || 0)}</p>
                </div>
                <div className="text-center p-2.5 bg-[#F8FAFC] rounded-[8px] border border-[#E2E8F0]">
                  <p className={`${DTXT.meta} text-[#94A3B8] mb-1`}>Reward</p>
                  <p className={`${DTXT.title} text-[#00A86B]`}>₹{Math.round(referral.totalCommission || 0)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Referred Customers */}
          <div className="bg-white border border-[#E2E8F0] rounded-[10px] p-4 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-3">
              <h3 className={`${DTXT.title} text-[#0F172A] flex items-center gap-2`}>
                <Users className="w-4 h-4 text-[#64748B]" /> Referred Customers
              </h3>
              <span className={`bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] px-2.5 py-1 rounded-full ${DTXT.meta}`}>
                {referral.subUsers?.length || 0} TOTAL
              </span>
            </div>
            <div className="max-h-[280px] overflow-y-auto border border-[#E2E8F0] rounded-[8px]">
              <table className="w-full border-collapse">
                <thead className="bg-[#E6F9F2] sticky top-0">
                  <tr className="border-b border-[#E2E8F0]">
                    <th className={`py-2 px-3 text-left ${DTXT.label} text-[#475569] rounded-l-lg`}>User Details</th>
                    <th className={`py-2 px-3 text-center ${DTXT.label} text-[#475569]`}>Orders</th>
                    <th className={`py-2 px-3 text-right ${DTXT.label} text-[#475569]`}>Shipping</th>
                    <th className={`py-2 px-3 text-right ${DTXT.label} text-[#475569] rounded-r-lg`}>Commission</th>
                  </tr>
                </thead>
                <tbody>
                  {referral.subUsers && referral.subUsers.length > 0 ? (
                    referral.subUsers.map((sub: any, idx: number) => (
                      <tr key={idx} className="border-b border-[#F1F5F9] last:border-0 hover:bg-[#F8FAFC] transition-colors">
                        <td className="px-3 py-2.5">
                          <p className={`${DTXT.value} text-[#00A86B]`}>{sub.userId}</p>
                          <p className={`${DTXT.value} text-[#1E293B]`}>{sub.fullname}</p>
                          <p className={`${DTXT.value} text-[#94A3B8]`}>{sub.email}</p>
                        </td>
                        <td className={`px-3 py-2.5 text-center ${DTXT.value} text-[#475569]`}>{sub.orderCount}</td>
                        <td className={`px-3 py-2.5 text-right ${DTXT.value} text-[#475569]`}>
                          {Number(sub.totalShipping || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className={`px-3 py-2.5 text-right ${DTXT.value} text-[#00A86B]`}>
                          {Number(sub.commission || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4}>
                        <EmptyState title="No sub-user data available" size={160} />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-[#F8FAFC] border-t border-[#E2E8F0] flex justify-end">
          <button
            onClick={onClose}
            className={`px-4 py-2 bg-white border border-[#E2E8F0] rounded-lg ${DTXT.label} text-[#475569] hover:bg-[#F1F5F9] transition-colors`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminReferral() {
  const { isAdmin, adminTab, currentUserId, loadingAdminTab } = useAdminTab();
  const isAdminView = isAdmin && adminTab;

  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [summary, setSummary] = useState<Summary>({ totalUsers: 0, totalOrders: 0, totalCommission: 0, totalShipping: 0 });
  const [loading, setLoading] = useState(true);

  // Server-side pagination — same shape as other admin list pages (DesktopPagination hook)
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters — draft (live in the inputs) vs applied (drives the fetch, set by Apply/Clear All)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string[]>([]);

  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedMonth, setAppliedMonth] = useState<string[]>([]);
  const [appliedYear, setAppliedYear] = useState<string[]>([]);

  // Global search from admin header navbar
  const [globalSearch, setGlobalSearch] = useState('');

  // Row selection (stores full row objects for export)
  const [selectedRows, setSelectedRows] = useState<ReferralRow[]>([]);

  // Details modal
  const [detailsRow, setDetailsRow] = useState<ReferralRow | null>(null);

  // Bulk actions dropdown
  const [actionOpen, setActionOpen] = useState(false);
  const actionRef = useRef<HTMLDivElement>(null);

  // Per-row actions dropdown ("..." menu)
  const [rowActionOpenId, setRowActionOpenId] = useState<string | null>(null);

  // Transfer modal
  const [transferOpen, setTransferOpen] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userSuggestions, setUserSuggestions] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [transferError, setTransferError] = useState('');

  const fetchReferrals = useCallback(async () => {
    if (loadingAdminTab) return;
    try {
      setLoading(true);
      const search = globalSearch || appliedSearch;
      const res = await apiClient.get('/referral/getAllReferralStats', {
        params: {
          ...(appliedMonth[0] && { month: appliedMonth[0] }),
          ...(appliedYear[0] && { year: appliedYear[0] }),
          ...(search.trim() && { search: search.trim() }),
          // Non-admin views (regular user login or admin switched to user mode)
          // must pass referById so the backend only returns that user's data
          ...(!isAdminView && currentUserId && { referById: currentUserId }),
          page,
          limit: rowsPerPage,
        },
      });
      setReferrals(res.data?.referrals || []);
      setSummary(res.data?.summary || { totalUsers: 0, totalOrders: 0, totalCommission: 0, totalShipping: 0 });
      setTotalPages(res.data?.totalPages || 1);
      setTotalCount(res.data?.totalCount ?? res.data?.total ?? 0);
      setSelectedRows([]);
    } catch (err) {
      console.error('Error fetching referral stats:', err);
    } finally {
      setLoading(false);
    }
  }, [globalSearch, appliedSearch, appliedMonth, appliedYear, page, rowsPerPage, isAdminView, currentUserId, loadingAdminTab]);

  useEffect(() => { fetchReferrals(); }, [fetchReferrals]);

  useEffect(() => { setPage(1); }, [rowsPerPage]);

  // Global search listener (navbar search bar)
  useEffect(() => {
    const handleSearch = (e: Event) => {
      const q = ((e as CustomEvent).detail || '').toLowerCase();
      setGlobalSearch(q);
      setPage(1);
    };
    window.addEventListener('admin-search', handleSearch);
    setGlobalSearch(((window as any).__adminSearchQuery || '').toLowerCase());
    return () => window.removeEventListener('admin-search', handleSearch);
  }, []);

  // Close bulk actions dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (actionRef.current && !actionRef.current.contains(e.target as Node)) setActionOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close the per-row Actions dropdown on outside click (not onBlur — a blur timeout races
  // the Details button's click and can unmount the menu before the click registers).
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.row-action-dropdown-container')) setRowActionOpenId(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ─── Apply / reset filters ──────────────────────────────────────────────────
  const applyFilters = () => {
    setAppliedSearch(searchQuery);
    setAppliedMonth(selectedMonth);
    setAppliedYear(selectedYear);
    setPage(1);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedMonth([]);
    setSelectedYear([]);
    setAppliedSearch('');
    setAppliedMonth([]);
    setAppliedYear([]);
    setPage(1);
  };

  const hasActiveFilters = !!(searchQuery || selectedMonth.length || selectedYear.length);

  // Client-side fallback: the backend may ignore an unsupported `search` param, so also
  // filter the fetched page locally against the same applied/global search value — this
  // guarantees the search bar (both the page filter and the navbar) always works.
  const activeSearch = (globalSearch || appliedSearch).trim().toLowerCase();
  const filteredReferrals = activeSearch
    ? referrals.filter(r =>
        String(r.userName ?? '').toLowerCase().includes(activeSearch) ||
        String(r.userId ?? '').toLowerCase().includes(activeSearch) ||
        String(r.email ?? '').toLowerCase().includes(activeSearch) ||
        String(r.mobile ?? '').toLowerCase().includes(activeSearch)
      )
    : referrals;

  // Debounced user search for transfer modal
  useEffect(() => {
    if (userSearch.trim().length < 2) { setUserSuggestions([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await apiClient.get(`/admin/searchUser?query=${encodeURIComponent(userSearch)}`);
        setUserSuggestions(res.data?.users || []);
      } catch { setUserSuggestions([]); }
    }, 300);
    return () => clearTimeout(timer);
  }, [userSearch]);

  const fetchUserStats = async (userId: string) => {
    try {
      setStatsLoading(true);
      const res = await apiClient.get('/referral/stats', { params: { targetUserId: userId } });
      setUserStats(res.data?.stats || null);
    } catch { setUserStats(null); }
    finally { setStatsLoading(false); }
  };

  const handleTransfer = async () => {
    if (!selectedUser || !transferAmount || Number(transferAmount) <= 0) return;
    if (Number(transferAmount) > (userStats?.remaining || 0)) {
      setTransferError('Amount exceeds available referral balance');
      return;
    }
    if (!window.confirm(`Transfer ₹${transferAmount} to ${selectedUser.fullname || selectedUser.name}'s wallet?`)) return;
    try {
      setTransferring(true);
      setTransferError('');
      const res = await apiClient.post('/referral/withdraw', {
        amount: Number(transferAmount),
        targetUserId: selectedUser._id,
      });
      if (res.data?.success) {
        alert(res.data.message || 'Transfer successful');
        setTransferOpen(false);
        setSelectedUser(null);
        setUserStats(null);
        setUserSearch('');
        setTransferAmount('');
        fetchReferrals();
      }
    } catch (err: any) {
      setTransferError(err?.response?.data?.message || 'Transfer failed');
    } finally {
      setTransferring(false);
    }
  };

  const handleExportCSV = () => {
    if (selectedRows.length === 0) return;
    const headers = ['Referrer ID', 'Referrer Name', 'Email', 'Mobile', 'Orders', 'Shipping', 'Commission', 'Month', 'Year'];
    const rows = selectedRows.map(r => [
      r.userId, r.userName, r.email, r.mobile,
      r.totalOrderCount, r.totalShipping, r.totalCommission,
      getMonthFull(r.month), r.year,
    ]);
    const csv = [headers, ...rows].map(row => row.map(v => `"${v ?? ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Referral_Payouts_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setActionOpen(false);
  };

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedRows(e.target.checked ? [...filteredReferrals] : []);
  };
  const toggleSelect = (row: ReferralRow) => {
    setSelectedRows(prev =>
      prev.find(r => r._id === row._id) ? prev.filter(r => r._id !== row._id) : [...prev, row]
    );
  };

  const statsCards = [
    { label: 'Total Referrers', value: String(summary.totalUsers || 0), icon: User, color: 'text-blue-500', iconBg: 'bg-blue-100', cardBg: 'bg-blue-50/30' },
    { label: 'Total Referral Orders', value: String(summary.totalOrders || 0), icon: Package, color: 'text-fuchsia-500', iconBg: 'bg-fuchsia-100', cardBg: 'bg-fuchsia-50/30' },
    { label: 'Total Shipping', value: formatCurrency(summary.totalShipping), icon: Truck, color: 'text-emerald-500', iconBg: 'bg-emerald-100', cardBg: 'bg-emerald-50/30' },
    { label: 'Total Commission', value: formatCurrency(summary.totalCommission), icon: Wallet, color: 'text-yellow-600', iconBg: 'bg-yellow-100', cardBg: 'bg-yellow-50/30' },
  ];

  const closeTransferModal = () => {
    setTransferOpen(false);
    setSelectedUser(null);
    setUserStats(null);
    setUserSearch('');
    setUserSuggestions([]);
    setTransferAmount('');
    setTransferError('');
  };

  return (
    <AdminLayout>
      <div className="flex flex-col h-[calc(100vh-72px)] -m-4 md:-m-6 bg-white">
        <div className="bg-white relative z-50 shrink-0">
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-3 border-b border-[#E2E8F0] bg-white">
            <h1 className="text-[20px] font-bold text-[#0F172A] tracking-tight">Referrals</h1>
            <button
              onClick={fetchReferrals}
              className="w-8 h-8 rounded-full border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-[#F8FAFC] transition-colors"
            >
              <RefreshCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Stats */}
          <div className="p-4 border-b border-[#E2E8F0] grid grid-cols-1 md:grid-cols-4 gap-4 bg-white">
            {statsCards.map((s, i) => (
              <div key={i} className={`p-4 rounded-xl border border-[#E2E8F0] shadow-sm flex items-center gap-4 ${s.cardBg}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${s.iconBg} ${s.color}`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-[#0F172A] text-[15px]">{s.value}</div>
                  <div className="text-[11px] text-[#64748B] font-medium">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="py-3 px-6 border-b border-[#CBD5F5] flex flex-wrap items-center gap-3 bg-[#F8FAFC]/50 relative z-20">
            <input
              type="text"
              placeholder="Search by name, user ID or email"
              className="glass-search-input w-[220px] shrink-0"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            />

            <GlassDropdown
              label="Month"
              options={MONTH_NAMES.map((m, i) => ({ label: m, value: String(i + 1) }))}
              selected={selectedMonth}
              onChange={setSelectedMonth}
              placeholder="Search month..."
              icon={<Calendar className="w-3.5 h-3.5" />}
            />

            <GlassDropdown
              label="Year"
              options={['2024', '2025', '2026', '2027'].map(y => ({ label: y, value: y }))}
              selected={selectedYear}
              onChange={setSelectedYear}
              placeholder="Search year..."
              icon={<Calendar className="w-3.5 h-3.5" />}
            />

            <button
              onClick={applyFilters}
              className="py-2 px-4 shrink-0 rounded-[32px] bg-[#009D64] border border-[#009D64] text-white text-xs font-medium leading-[18px] hover:bg-[#008a57] transition-colors cursor-pointer"
            >
              Apply Filters
            </button>

            {hasActiveFilters && (
              <button onClick={resetFilters}
                className="py-2 px-4 shrink-0 rounded-[32px] border border-red-200 text-red-500 text-xs font-medium leading-[18px] hover:bg-red-50 transition-colors cursor-pointer">
                Clear All
              </button>
            )}

            {/* Bulk Actions Dropdown */}
            <div className="relative shrink-0 ml-auto" ref={actionRef}>
              <button
                onClick={() => setActionOpen(v => !v)}
                className={`py-2 px-4 rounded-[32px] border text-xs leading-[18px] flex items-center gap-1.5 font-medium transition-colors ${
                  selectedRows.length > 0
                    ? 'border-[#03C27D] bg-white text-[#64748B] hover:bg-[#F0FDF9] cursor-pointer'
                    : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#CBD5E1] cursor-not-allowed'
                }`}
              >
                Actions
                {selectedRows.length > 0 && (
                  <span className="bg-[#00A86B] text-white rounded-full text-[9px] px-1.5 py-0.5 font-bold">{selectedRows.length}</span>
                )}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${actionOpen ? 'rotate-180' : ''}`} />
              </button>

              {actionOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-lg shadow-xl z-50 py-1">
                  <button
                    onClick={() => { setTransferOpen(true); setActionOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-[12px] text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Wallet className="w-4 h-4 text-[#00A86B]" />
                    Transfer Referral Amount
                  </button>
                  <button
                    onClick={handleExportCSV}
                    disabled={selectedRows.length === 0}
                    className="w-full text-left px-4 py-2.5 text-[12px] text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-t disabled:opacity-40"
                  >
                    <Download className="w-4 h-4 text-blue-500" />
                    Export Selected (CSV)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white flex flex-col flex-1 min-h-0 overflow-hidden border-t border-[#E2E8F0]">
          <div className="flex-1 overflow-auto w-full relative">
            {loading && <TableLoader />}
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead className="sticky top-0 z-20 bg-[#E6F9F2] shadow-sm">
                <tr className="text-xs font-medium text-[#64748B] uppercase tracking-wider">
                  <th className="py-2 px-3 w-12 text-center rounded-l-lg">
                    <input
                      type="checkbox"
                      onChange={toggleSelectAll}
                      checked={selectedRows.length === filteredReferrals.length && filteredReferrals.length > 0}
                      className="rounded border-gray-300 text-[#00A86B] focus:ring-[#00A86B]"
                    />
                  </th>
                  <th className="py-2 px-3 whitespace-nowrap">
                    <User className="w-3.5 h-3.5 inline mr-1" />Refer By
                  </th>
                  <th className="py-2 px-3 whitespace-nowrap">
                    <Phone className="w-3.5 h-3.5 inline mr-1" />Contact
                  </th>
                  <th className="py-2 px-3 whitespace-nowrap text-center">
                    <Package className="w-3.5 h-3.5 inline mr-1" />Orders
                  </th>
                  <th className="py-2 px-3 whitespace-nowrap">
                    <Truck className="w-3.5 h-3.5 inline mr-1" />Shipping
                  </th>
                  <th className="py-2 px-3 whitespace-nowrap">
                    <Wallet className="w-3.5 h-3.5 inline mr-1" />Commission
                  </th>
                  <th className="py-2 px-3 whitespace-nowrap">
                    <Calendar className="w-3.5 h-3.5 inline mr-1" />Period
                  </th>
                  <th className="py-2 px-3 whitespace-nowrap text-right rounded-r-lg">
                    <Settings className="w-3.5 h-3.5 inline mr-1" />Actions
                  </th>
                </tr>
              </thead>
              <tbody className="text-[#475569]">
                {loading ? null : filteredReferrals.length > 0 ? (
                  filteredReferrals.map((row, ridx) => (
                    <tr
                      key={row._id}
                      className={`border-b border-[#E2E8F0] transition-colors ${
                        selectedRows.find(r => r._id === row._id) ? 'bg-green-50/40' : (ridx % 2 === 0 ? 'bg-white' : 'bg-[#E6EDF7]/20')
                      }`}
                    >
                      <td className="p-4 text-center align-top">
                        <input
                          type="checkbox"
                          checked={!!selectedRows.find(r => r._id === row._id)}
                          onChange={() => toggleSelect(row)}
                          className="rounded border-gray-300 text-[#00A86B] focus:ring-[#00A86B]"
                        />
                      </td>
                      <td className="p-4 align-top max-w-[180px]">
                        <div className="text-xs font-semibold text-[#00A86B] mb-0.5">{row.userId || '—'}</div>
                        <TruncatedText text={row.userName || '—'} maxLength={20} className="text-[13px] text-[#0F172A] font-medium" />
                      </td>
                      <td className="p-4 align-top max-w-[180px]">
                        <TruncatedText text={row.email || '—'} maxLength={22} className="text-[12px] text-[#475569] mb-0.5" />
                        <div className="text-[12px] text-[#94A3B8]">{row.mobile || '—'}</div>
                      </td>
                      <td className="p-4 text-center align-top text-[12px] font-normal">{row.totalOrderCount || 0}</td>
                      <td className="p-4 align-top text-[12px] font-normal text-[#00A86B]">
                        ₹{Number(row.totalShipping || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 align-top text-[12px] font-normal text-[#00A86B]">
                        ₹{Number(row.totalCommission || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 align-top text-[12px] font-normal text-[#64748B]">
                        {getMonthFull(row.month)} {row.year}
                      </td>
                      <td className="p-4 text-right pr-6 align-top">
                        <div className="relative inline-block text-left row-action-dropdown-container">
                          <button
                            onClick={() => setRowActionOpenId(prev => prev === row._id ? null : row._id)}
                            className={`w-7 h-7 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${rowActionOpenId === row._id ? 'bg-green-100 border-[#00A86B] text-[#00A86B]' : 'border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9]'}`}
                          >
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </button>
                          {rowActionOpenId === row._id && (
                            <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.15)] border border-[#E2E8F0] py-1.5 z-50">
                              <button
                                onClick={() => { setDetailsRow(row); setRowActionOpenId(null); }}
                                className="w-full text-left px-4 py-2 text-xs font-semibold text-[#475569] hover:bg-[#F8FAFC] hover:text-[#00A86B] transition-colors"
                              >
                                Details
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8}>
                      <EmptyState title="No referral data found" />
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
              startIndex={totalCount === 0 ? 0 : (page - 1) * rowsPerPage + 1}
              endIndex={Math.min(page * rowsPerPage, totalCount)}
              totalItems={totalCount}
            />
          )}
        </div>
      </div>

      {/* Details Modal */}
      {detailsRow && (
        <ReferralDetailsModal referral={detailsRow} onClose={() => setDetailsRow(null)} />
      )}

      {/* Transfer Modal */}
      {transferOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="px-5 py-4 border-b bg-gray-50 flex justify-between items-center">
              <h2 className="text-[15px] font-bold text-gray-700">Transfer Referral Amount</h2>
              <button onClick={closeTransferModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* User Search */}
              <div>
                <label className="block text-[12px] font-bold text-gray-600 mb-2">
                  Search User (Name / Email / ID)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={userSearch}
                    onChange={e => { setUserSearch(e.target.value); if (!e.target.value) { setSelectedUser(null); setUserStats(null); } }}
                    placeholder="Type to search user..."
                    className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs focus:outline-none focus:border-[#00A86B] transition-colors"
                  />
                  {userSuggestions.length > 0 && !selectedUser && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-xl z-50 mt-1 max-h-48 overflow-y-auto">
                      {userSuggestions.map((u: any) => (
                        <button
                          key={u._id}
                          onClick={() => {
                            setSelectedUser(u);
                            setUserSearch(u.fullname || u.name || '');
                            setUserSuggestions([]);
                            fetchUserStats(u._id);
                          }}
                          className="w-full text-left px-3 py-2.5 text-[12px] hover:bg-gray-50 border-b last:border-0 flex items-center justify-between"
                        >
                          <span className="font-bold text-gray-800">{u.fullname || u.name}</span>
                          <span className="text-gray-400 text-[11px] ml-2 truncate">{u.email}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Selected User Stats */}
              {selectedUser && (
                <div className="bg-green-50/50 border border-green-100 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-[13px] font-bold text-gray-800">{selectedUser.fullname || selectedUser.name}</h3>
                      {selectedUser.walletAmount !== undefined && (
                        <p className="text-[11px] text-gray-500">
                          Wallet: ₹{Number(selectedUser.walletAmount || 0).toFixed(2)}
                        </p>
                      )}
                    </div>
                    <span className="px-2 py-0.5 bg-[#00A86B] text-white text-[10px] font-bold rounded">Target User</span>
                  </div>

                  {statsLoading ? (
                    <div className="flex justify-center py-4">
                      <div className="w-6 h-6 border-2 border-[#00A86B] border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : userStats ? (
                    <>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-white p-2 rounded-lg border border-green-100 text-center">
                          <p className="text-[9px] text-gray-400 font-bold uppercase">Total Earned</p>
                          <p className="text-[12px] font-bold text-gray-700">
                            ₹{Number(userStats.totalCommission || 0).toFixed(2)}
                          </p>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-green-100 text-center">
                          <p className="text-[9px] text-gray-400 font-bold uppercase">Paid Out</p>
                          <p className="text-[12px] font-bold text-gray-700">
                            ₹{Number(userStats.withdrawn || 0).toFixed(2)}
                          </p>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-green-100 text-center">
                          <p className="text-[9px] text-gray-400 font-bold uppercase">Remaining</p>
                          <p className="text-[12px] font-bold text-[#00A86B]">
                            ₹{Number(userStats.remaining || 0).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 pt-1">
                        <label className="block text-[12px] font-bold text-gray-700">Transfer Amount (₹)</label>
                        <input
                          type="number"
                          value={transferAmount}
                          onChange={e => { setTransferAmount(e.target.value); setTransferError(''); }}
                          placeholder="Enter amount"
                          className="w-full px-3 py-2 border border-green-200 rounded-lg text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20 transition-all"
                        />
                        {transferError && (
                          <p className="text-[11px] text-red-500 font-bold">{transferError}</p>
                        )}
                        {Number(transferAmount) > (userStats?.remaining || 0) && Number(transferAmount) > 0 && (
                          <p className="text-[10px] text-red-500 font-bold">Amount exceeds available balance!</p>
                        )}
                        <button
                          onClick={handleTransfer}
                          disabled={
                            transferring ||
                            !transferAmount ||
                            Number(transferAmount) <= 0 ||
                            Number(transferAmount) > (userStats?.remaining || 0)
                          }
                          className="w-full py-2.5 bg-[#00A86B] text-white rounded-lg text-[12px] font-bold hover:bg-[#009B63] disabled:opacity-50 transition-colors shadow-sm"
                        >
                          {transferring ? 'Processing...' : 'Transfer to Wallet'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <p className="text-[11px] text-gray-400 text-center py-2">No referral stats found for this user</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
