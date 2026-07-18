import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { apiClient } from '../../services/apiClient';
import {
  RefreshCcw, User, Package, Truck, Wallet,
  Phone, Calendar, ChevronDown, X, Mail, Users, Download,
} from 'lucide-react';

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

function ReferralDetailsModal({ referral, onClose }: { referral: ReferralRow; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
          <div>
            <h2 className="text-[14px] font-bold text-gray-700">Referral Performance Details</h2>
            <p className="text-[11px] text-gray-500">{getMonthFull(referral.month)} {referral.year}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50/50 border border-green-100 rounded-xl p-4 space-y-2">
              <h3 className="text-[11px] font-bold text-[#00A86B] uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4" /> Referrer Information
              </h3>
              <div className="space-y-2 text-[12px]">
                <div className="flex justify-between border-b border-green-100 pb-1">
                  <span className="text-gray-500">Full Name</span>
                  <span className="font-bold text-gray-700">{referral.userName || '—'}</span>
                </div>
                <div className="flex justify-between border-b border-green-100 pb-1">
                  <span className="text-gray-500">User ID</span>
                  <span className="font-bold text-[#00A86B]">{referral.userId || '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-3.5 h-3.5 text-gray-500" />
                  <span>{referral.email || '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-3.5 h-3.5 text-gray-500" />
                  <span>{referral.mobile || '—'}</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 space-y-2">
              <h3 className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Monthly Summary</h3>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 bg-white rounded-lg border border-blue-100">
                  <p className="text-[9px] text-gray-500 font-bold">Orders</p>
                  <p className="text-[12px] font-bold text-gray-700">{referral.totalOrderCount || 0}</p>
                </div>
                <div className="text-center p-2 bg-white rounded-lg border border-blue-100">
                  <p className="text-[9px] text-gray-500 font-bold">Freight</p>
                  <p className="text-[12px] font-bold text-[#00A86B]">₹{Math.round(referral.totalShipping || 0)}</p>
                </div>
                <div className="text-center p-2 bg-white rounded-lg border border-blue-100">
                  <p className="text-[9px] text-gray-500 font-bold">Reward</p>
                  <p className="text-[12px] font-bold text-blue-600">₹{Math.round(referral.totalCommission || 0)}</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[13px] font-bold text-gray-700 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#00A86B]" /> Referred Customers
              </h3>
              <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-[10px] font-bold">
                {referral.subUsers?.length || 0} Total
              </span>
            </div>
            <div className="max-h-[300px] overflow-y-auto border rounded-lg">
              <table className="w-full text-[12px] border-collapse">
                <thead className="bg-[#00A86B] text-white font-bold sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left">User Details</th>
                    <th className="px-3 py-2 text-center">Orders</th>
                    <th className="px-3 py-2 text-right">Shipping</th>
                    <th className="px-3 py-2 text-right">Commission</th>
                  </tr>
                </thead>
                <tbody>
                  {referral.subUsers && referral.subUsers.length > 0 ? (
                    referral.subUsers.map((sub: any, idx: number) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-3 py-2">
                          <p className="font-bold text-[#00A86B]">{sub.userId}</p>
                          <p className="text-gray-700">{sub.fullname}</p>
                          <p className="text-gray-400 text-[11px]">{sub.email}</p>
                        </td>
                        <td className="px-3 py-2 text-center font-bold text-gray-700">{sub.orderCount}</td>
                        <td className="px-3 py-2 text-right font-bold text-gray-500">
                          {Number(sub.totalShipping || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-[#00A86B]">
                          {Number(sub.commission || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-400 text-[12px]">
                        No sub-user data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 bg-gray-50 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-[12px] font-bold text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminReferral() {
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [summary, setSummary] = useState<Summary>({ totalUsers: 0, totalOrders: 0, totalCommission: 0, totalShipping: 0 });
  const [loading, setLoading] = useState(true);

  // Server-side pagination
  const [page, setPage] = useState(1);
  const limit = 20;
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  // Row selection (stores full row objects for export)
  const [selectedRows, setSelectedRows] = useState<ReferralRow[]>([]);

  // Details modal
  const [detailsRow, setDetailsRow] = useState<ReferralRow | null>(null);

  // Action dropdown
  const [actionOpen, setActionOpen] = useState(false);
  const actionRef = useRef<HTMLDivElement>(null);

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
    try {
      setLoading(true);
      const res = await apiClient.get('/referral/getAllReferralStats', {
        params: {
          ...(selectedMonth && { month: selectedMonth }),
          ...(selectedYear && { year: selectedYear }),
          page,
          limit,
        },
      });
      setReferrals(res.data?.referrals || []);
      setSummary(res.data?.summary || { totalUsers: 0, totalOrders: 0, totalCommission: 0, totalShipping: 0 });
      setTotalPages(res.data?.totalPages || 1);
      setSelectedRows([]);
    } catch (err) {
      console.error('Error fetching referral stats:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, page, limit]);

  useEffect(() => { fetchReferrals(); }, [fetchReferrals]);

  // Close action dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (actionRef.current && !actionRef.current.contains(e.target as Node)) setActionOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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
    setSelectedRows(e.target.checked ? [...referrals] : []);
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
          <div className="p-4 border-b border-[#E2E8F0] flex flex-wrap justify-between items-center gap-3 bg-[#F8FAFC]/50 relative z-20">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#64748B]" />
                <select
                  value={selectedMonth}
                  onChange={e => { setSelectedMonth(e.target.value); setPage(1); }}
                  className="h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs bg-white focus:outline-none focus:border-[#00A86B] appearance-none pr-7 cursor-pointer"
                >
                  <option value="">All Months</option>
                  {MONTH_NAMES.map((m, i) => (
                    <option key={i + 1} value={String(i + 1)}>{m}</option>
                  ))}
                </select>
              </div>

              <select
                value={selectedYear}
                onChange={e => { setSelectedYear(e.target.value); setPage(1); }}
                className="h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs bg-white focus:outline-none focus:border-[#00A86B] appearance-none cursor-pointer"
              >
                <option value="">All Years</option>
                {['2024', '2025', '2026', '2027'].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>

              {(selectedMonth || selectedYear) && (
                <button
                  onClick={() => { setSelectedMonth(''); setSelectedYear(''); setPage(1); }}
                  className="h-9 px-4 rounded-full border border-red-200 text-red-500 text-[11px] font-bold hover:bg-red-50 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Action Dropdown */}
            <div className="relative shrink-0" ref={actionRef}>
              <button
                onClick={() => setActionOpen(v => !v)}
                className={`h-9 px-4 rounded-full border text-[11px] font-bold flex items-center gap-1.5 transition-colors ${
                  selectedRows.length > 0
                    ? 'border-[#00A86B] text-[#00A86B] hover:bg-[#E6F5F1]'
                    : 'border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]'
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
          <div className="flex-1 overflow-y-auto overflow-x-auto w-full no-scrollbar">
            {loading ? (
              <div className="flex justify-center items-center h-48">
                <div className="w-8 h-8 border-2 border-[#00A86B] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-[#E6F5F1] text-xs font-medium text-[#00A86B] uppercase tracking-wider sticky top-0 z-10">
                    <th className="p-4 w-12 text-center">
                      <input
                        type="checkbox"
                        onChange={toggleSelectAll}
                        checked={selectedRows.length === referrals.length && referrals.length > 0}
                        className="rounded border-gray-300 text-[#00A86B] focus:ring-[#00A86B]"
                      />
                    </th>
                    <th className="p-4 whitespace-nowrap">
                      <User className="w-3.5 h-3.5 inline mr-1" />Refer By
                    </th>
                    <th className="p-4 whitespace-nowrap">
                      <Phone className="w-3.5 h-3.5 inline mr-1" />Contact
                    </th>
                    <th className="p-4 whitespace-nowrap text-center">
                      <Package className="w-3.5 h-3.5 inline mr-1" />Orders
                    </th>
                    <th className="p-4 whitespace-nowrap">
                      <Truck className="w-3.5 h-3.5 inline mr-1" />Shipping
                    </th>
                    <th className="p-4 whitespace-nowrap">
                      <Wallet className="w-3.5 h-3.5 inline mr-1" />Commission
                    </th>
                    <th className="p-4 whitespace-nowrap">
                      <Calendar className="w-3.5 h-3.5 inline mr-1" />Period
                    </th>
                    <th className="p-4 whitespace-nowrap text-right pr-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-[12px] text-[#475569]">
                  {referrals.length > 0 ? (
                    referrals.map(row => (
                      <tr
                        key={row._id}
                        className={`border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors ${
                          selectedRows.find(r => r._id === row._id) ? 'bg-green-50/40' : ''
                        }`}
                      >
                        <td className="p-4 text-center">
                          <input
                            type="checkbox"
                            checked={!!selectedRows.find(r => r._id === row._id)}
                            onChange={() => toggleSelect(row)}
                            className="rounded border-gray-300 text-[#00A86B] focus:ring-[#00A86B]"
                          />
                        </td>
                        <td className="p-4">
                          <div className="text-xs font-semibold text-[#00A86B] mb-0.5">{row.userId || '—'}</div>
                          <div className="text-[13px] text-[#0F172A] font-medium">{row.userName}</div>
                        </td>
                        <td className="p-4">
                          <div className="text-xs text-[#475569] mb-0.5">{row.email || '—'}</div>
                          <div className="text-[12px] text-[#94A3B8]">{row.mobile || '—'}</div>
                        </td>
                        <td className="p-4 text-center font-medium">{row.totalOrderCount || 0}</td>
                        <td className="p-4 text-[#00A86B] font-medium">
                          ₹{Number(row.totalShipping || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-4 text-[#00A86B] font-medium">
                          ₹{Number(row.totalCommission || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-4 text-[#64748B] text-xs">
                          {getMonthFull(row.month)} {row.year}
                        </td>
                        <td className="p-4 text-right pr-6">
                          <button
                            onClick={() => setDetailsRow(row)}
                            className="px-4 py-1.5 rounded-full border border-[#00A86B] text-[#00A86B] font-bold text-[10px] hover:bg-[#E6F5F1] transition-colors shadow-sm"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-[#94A3B8] font-medium text-[13px]">
                        No referral data found for the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="border-t border-[#E2E8F0] px-6 py-3 flex items-center justify-between text-[12px] text-[#64748B] bg-white shrink-0">
              <span>Page {page} of {totalPages}</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="h-8 px-3 rounded border border-[#E2E8F0] text-xs disabled:opacity-40 hover:bg-[#F8FAFC] transition-colors"
                >
                  Prev
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`h-8 w-8 rounded border text-[11px] font-bold transition-colors ${
                        p === page
                          ? 'bg-[#00A86B] border-[#00A86B] text-white'
                          : 'border-[#E2E8F0] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="h-8 px-3 rounded border border-[#E2E8F0] text-xs disabled:opacity-40 hover:bg-[#F8FAFC] transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
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
