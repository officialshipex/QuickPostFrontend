import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { Search, Download, Building2, CheckCircle2, AlertCircle, Clock, TrendingUp, Eye, MapPin, Phone, Tag, ShieldCheck, Wallet, UserCog, Calendar, Settings, Filter, X } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { GlassDropdown } from '../../components/ui/GlassDropdown';
import { GlassDateFilter } from '../../components/ui/GlassDateFilter';
import { TableLoader } from '../../components/ui/TableLoader';
import { EmptyState } from '../../components/ui/EmptyState';
import { usePagination, DesktopPagination } from '../../hooks/usePagination';
import { MobilePaginationBar } from '../../hooks/useMobilePaginationBar';

const KYC_RIBBON: Record<string, string> = {
  'Verified': '#059669', 'Pending': '#D97706', 'Rejected': '#DC2626', 'Not Submitted': '#94A3B8',
};
const ACCOUNT_RIBBON: Record<string, string> = {
  'Active': '#059669', 'Inactive': '#94A3B8', 'Suspended': '#DC2626', 'Trial': '#2563EB',
};

const KYC_STATUS: Record<string, string> = {
  'Verified': 'bg-green-50 text-green-600',
  'Pending': 'bg-amber-50 text-amber-700',
  'Rejected': 'bg-red-50 text-red-600',
  'Not Submitted': 'bg-gray-100 text-gray-500',
};

const ACCOUNT_STATUS: Record<string, string> = {
  'Active': 'bg-green-50 text-green-600',
  'Inactive': 'bg-gray-100 text-gray-500',
  'Suspended': 'bg-red-50 text-red-600',
  'Trial': 'bg-blue-50 text-blue-600',
};

export function CRMSellerAccounts() {
  const [search, setSearch] = useState('');
  const [kycFilter, setKycFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [cityFilter, setCityFilter] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const perPage = 10;

  const [sellers, setSellers] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [summary, setSummary] = useState({ total: 0, active: 0, kycVerified: 0, kycPending: 0, suspended: 0 });
  const [loading, setLoading] = useState(false);

  const fetchSellers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: '1', limit: '100000' };
      if (search) params.search = search;
      if (kycFilter !== 'All') params.kycStatus = kycFilter;
      if (statusFilter !== 'All') params.accountStatus = statusFilter;

      const res = await apiClient.get('/crm/sellers', { params });
      setSellers(res.data.sellers || []);
      setTotalCount(res.data.totalCount || 0);
      if (res.data.summary) setSummary(res.data.summary);
    } catch {
      setSellers([]);
    } finally {
      setLoading(false);
    }
  }, [search, kycFilter, statusFilter]);

  useEffect(() => { fetchSellers(); }, [search, kycFilter, statusFilter]);

  const handleExport = async () => {
    try {
      const params: Record<string, string> = { export: 'true' };
      if (search) params.search = search;
      if (kycFilter !== 'All') params.kycStatus = kycFilter;
      if (statusFilter !== 'All') params.accountStatus = statusFilter;

      const res = await apiClient.get('/crm/sellers', { params, responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `crm_sellers_${Date.now()}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* silent */ }
  };

  // City options — derived client-side from the currently loaded sellers list
  const cityOptions = useMemo(() => {
    const unique = Array.from(new Set(sellers.map(s => s.city).filter(Boolean)));
    return unique.map(c => ({ label: c, value: c }));
  }, [sellers]);

  // City / Date Range are client-side filters (no backend param) applied on top of the fetched list
  const displaySellers = useMemo(() => {
    return sellers.filter(s => {
      if (cityFilter.length && !cityFilter.includes(s.city)) return false;
      if (dateFrom || dateTo) {
        if (!s.createdAt) return false;
        const created = new Date(s.createdAt).getTime();
        if (dateFrom && created < new Date(dateFrom).getTime()) return false;
        if (dateTo && created > new Date(dateTo).getTime() + 24 * 60 * 60 * 1000 - 1) return false;
      }
      return true;
    });
  }, [sellers, cityFilter, dateFrom, dateTo]);

  const { page, setPage, totalPages, paginatedData, startIndex, endIndex, rowsPerPage, setRowsPerPage } = usePagination({ data: displaySellers, perPage });

  const hasActiveFilters = !!search || kycFilter !== 'All' || statusFilter !== 'All' || cityFilter.length > 0 || (dateFrom && dateTo);

  const handleApplyFilters = () => { fetchSellers(); };

  const handleClearAllFilters = () => {
    setSearch(''); setKycFilter('All'); setStatusFilter('All');
    setCityFilter([]); setDateFrom(''); setDateTo('');
  };

  const stats = [
    { label: 'Total Sellers', value: summary.total, icon: Building2, color: 'text-[#0F172A]' },
    { label: 'Active', value: summary.active, icon: CheckCircle2, color: 'text-green-500' },
    { label: 'KYC Verified', value: summary.kycVerified, icon: CheckCircle2, color: 'text-blue-500' },
    { label: 'KYC Pending', value: summary.kycPending, icon: Clock, color: 'text-amber-500' },
    { label: 'Suspended', value: summary.suspended, icon: AlertCircle, color: 'text-red-500' },
    { label: 'Enterprise', value: sellers.filter(s => s.planName === 'Enterprise').length, icon: TrendingUp, color: 'text-purple-500' },
  ];

  return (
    <AdminLayout>
      <div className="flex flex-col h-[calc(100vh-72px)] -m-4 md:-m-6 bg-white overflow-hidden">
        <div className="shrink-0 px-6 pt-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-[#0F172A]">Seller Accounts</h2>
                <span className="text-[10px] font-bold bg-[#00A86B]/10 text-[#00A86B] px-2 py-0.5 rounded-full">INTERNAL CRM</span>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">Manage all seller accounts, KYC status, wallet health and relationship managers.</p>
            </div>
            <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#00A86B] text-white text-xs font-semibold hover:bg-[#009960] transition-colors self-start">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-4">
            {stats.map((s, i) => (
              <div key={i} className="bg-white rounded-xl border border-[#E2E8F0] p-3 hover:shadow-md transition-all">
                <s.icon className={`w-4 h-4 ${s.color} mb-1.5`} />
                <div className="text-lg font-bold text-[#0F172A]">{s.value}</div>
                <div className="text-[10px] font-semibold text-[#64748B]">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white flex flex-col flex-1 min-h-0 overflow-hidden border-t border-[#E2E8F0]">
          <div className="py-3 px-6 border-b border-[#CBD5F5] shrink-0">
            <div className="md:hidden flex items-center gap-2 mb-2">
              <button onClick={() => setIsMobileFiltersOpen(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#00A86B] text-white text-[12px] font-bold shadow-sm">
                <Filter className="w-3.5 h-3.5" /> Filters
              </button>
              {hasActiveFilters && <span className="text-[11px] font-bold text-[#00A86B] bg-[#F0FDF4] border border-[#00A86B]/20 px-2.5 py-1 rounded-full">Active</span>}
              <span className="text-xs text-[#64748B] ml-auto">{totalCount} sellers</span>
            </div>
            <div className="filter-grid hidden md:grid grid-cols-3 gap-3">
              <div className="relative">
                <input type="text" placeholder="Search seller, ID, email..." value={search} onChange={e => setSearch(e.target.value)} className="glass-search-input w-full" />
                <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute right-2.5 top-1/2 -translate-y-1/2" />
              </div>

              <GlassDropdown
                className="w-full [&_.glass-dropdown-trigger]:w-full"
                label="KYC Status"
                options={['Verified', 'Pending', 'Rejected', 'Not Submitted'].map(o => ({ label: o, value: o }))}
                selected={kycFilter === 'All' ? [] : [kycFilter]}
                onChange={(vals) => setKycFilter(vals[0] || 'All')}
                placeholder="Search KYC status..."
                icon={<CheckCircle2 className="w-3.5 h-3.5" />}
              />

              <GlassDropdown
                className="w-full [&_.glass-dropdown-trigger]:w-full"
                label="Account Status"
                options={['Active', 'Inactive', 'Suspended', 'Trial'].map(o => ({ label: o, value: o }))}
                selected={statusFilter === 'All' ? [] : [statusFilter]}
                onChange={(vals) => setStatusFilter(vals[0] || 'All')}
                placeholder="Search account status..."
                icon={<Building2 className="w-3.5 h-3.5" />}
              />

              <GlassDropdown
                className="w-full [&_.glass-dropdown-trigger]:w-full"
                label="City"
                options={cityOptions}
                selected={cityFilter}
                onChange={setCityFilter}
                placeholder="Search city..."
                icon={<MapPin className="w-3.5 h-3.5" />}
              />

              <GlassDateFilter
                className="w-full [&_.glass-dropdown-trigger]:w-full"
                align="left"
                startDate={dateFrom}
                endDate={dateTo}
                onDateChange={(s, e) => { setDateFrom(s); setDateTo(e); }}
              />

              <div className="flex items-center gap-3">
                <button onClick={handleApplyFilters} className="py-2 px-4 shrink-0 rounded-[32px] bg-[#009D64] border border-[#009D64] text-white text-xs font-medium leading-[18px] hover:bg-[#008a57] transition-colors cursor-pointer">
                  Apply Filters
                </button>
                {hasActiveFilters && (
                  <button onClick={handleClearAllFilters} className="py-2 px-4 shrink-0 rounded-[32px] border border-red-200 text-red-500 text-xs font-medium leading-[18px] hover:bg-red-50 transition-colors cursor-pointer">
                    Clear All
                  </button>
                )}
                <span className="text-xs text-[#64748B] ml-auto flex items-center gap-2 shrink-0">
                  {totalCount} sellers
                </span>
              </div>
            </div>
          </div>

          <div className="hidden md:block flex-1 overflow-auto w-full relative">
            {loading && <TableLoader />}
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead className="sticky top-0 z-40 bg-[#E6F9F2] shadow-sm">
                <tr className="border-b border-[#E2E8F0] text-xs uppercase tracking-wider font-medium text-[#64748B]">
                  <th className="py-2 px-3 text-left align-middle rounded-l-lg"><div className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5 shrink-0" /><span>Seller / ID</span></div></th>
                  <th className="py-2 px-3 text-left align-middle"><div className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 shrink-0" /><span>Contact</span></div></th>
                  <th className="py-2 px-3 text-left align-middle"><div className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 shrink-0" /><span>City</span></div></th>
                  <th className="py-2 px-3 text-left align-middle"><div className="flex items-center gap-1"><Tag className="w-3.5 h-3.5 shrink-0" /><span>Plan</span></div></th>
                  <th className="py-2 px-3 text-left align-middle"><div className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 shrink-0" /><span>KYC</span></div></th>
                  <th className="py-2 px-3 text-left align-middle"><div className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /><span>Account</span></div></th>
                  <th className="py-2 px-3 text-right align-middle"><div className="flex items-center justify-end gap-1"><TrendingUp className="w-3.5 h-3.5 shrink-0" /><span>Total Orders</span></div></th>
                  <th className="py-2 px-3 text-right align-middle"><div className="flex items-center justify-end gap-1"><TrendingUp className="w-3.5 h-3.5 shrink-0" /><span>Monthly Orders</span></div></th>
                  <th className="py-2 px-3 text-right align-middle"><div className="flex items-center justify-end gap-1"><Wallet className="w-3.5 h-3.5 shrink-0" /><span>Wallet</span></div></th>
                  <th className="py-2 px-3 text-left align-middle"><div className="flex items-center gap-1"><UserCog className="w-3.5 h-3.5 shrink-0" /><span>RM</span></div></th>
                  <th className="py-2 px-3 text-left align-middle"><div className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 shrink-0" /><span>Joined</span></div></th>
                  <th className="py-2 px-3 text-center align-middle rounded-r-lg"><div className="flex items-center justify-center gap-1"><Settings className="w-3.5 h-3.5 shrink-0" /><span>Action</span></div></th>
                </tr>
              </thead>
              <tbody className="text-xs text-[#475569]">
                {paginatedData.length === 0 ? (
                  <tr><td colSpan={12} className="p-8 text-center text-[#64748B] font-medium">No sellers found</td></tr>
                ) : paginatedData.map((seller, i) => (
                  <tr key={i} className={`border-b border-[#E2E8F0] transition-colors cursor-pointer ${i % 2 === 0 ? 'bg-white' : 'bg-[#E6EDF7]/20'}`}>
                    <td className="px-3 py-3.5 pl-4 text-left align-middle">
                      <div className="font-semibold text-[#0F172A]">{seller.company || seller.fullname}</div>
                      <div className="text-[10px] text-[#64748B] font-mono">{seller.userId}</div>
                    </td>
                    <td className="px-3 py-3.5 text-left align-middle">
                      <div className="font-sans text-xs font-normal">{seller.email}</div>
                      <div className="text-[10px] text-[#64748B]">{seller.phoneNumber}</div>
                    </td>
                    <td className="px-3 py-3.5 text-left align-middle">{seller.city || '—'}</td>
                    <td className="px-3 py-3.5 text-left align-middle">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-600">{seller.planName || '—'}</span>
                    </td>
                    <td className="px-3 py-3.5 text-left align-middle">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${KYC_STATUS[seller.kycStatus] || 'bg-gray-100 text-gray-500'}`}>{seller.kycStatus}</span>
                    </td>
                    <td className="px-3 py-3.5 text-left align-middle">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${ACCOUNT_STATUS[seller.accountStatus] || 'bg-gray-100 text-gray-500'}`}>{seller.accountStatus}</span>
                    </td>
                    <td className="px-3 py-3.5 text-right align-middle font-semibold text-[#0F172A]">{(seller.totalOrders || 0).toLocaleString('en-IN')}</td>
                    <td className="px-3 py-3.5 text-right align-middle">{seller.monthlyOrders || '—'}</td>
                    <td className="px-3 py-3.5 text-right align-middle font-semibold text-[#00A86B]">₹{(seller.walletBalance || 0).toLocaleString('en-IN')}</td>
                    <td className="px-3 py-3.5 text-left align-middle text-[#64748B]">{seller.rm || '—'}</td>
                    <td className="px-3 py-3.5 text-left align-middle table-date">{seller.createdAt ? new Date(seller.createdAt).toISOString().split('T')[0] : '—'}</td>
                    <td className="px-3 py-3.5 text-center align-middle">
                      <button className="p-1.5 rounded-lg hover:bg-[#00A86B]/10 text-[#64748B] hover:text-[#00A86B] transition-colors inline-flex justify-center">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <DesktopPagination
            page={page}
            setPage={setPage}
            totalPages={totalPages}
            rowsPerPage={rowsPerPage}
            setRowsPerPage={setRowsPerPage}
            startIndex={startIndex}
            endIndex={endIndex}
            totalItems={displaySellers.length}
          />

          {/* Mobile Card List */}
          <div className="md:hidden flex-1 overflow-y-auto bg-[#F8FAFC] relative">
            {loading && <TableLoader />}
            {paginatedData.length === 0 ? (
              <EmptyState title="No sellers found" subtitle="Try changing filters" />
            ) : (
              <div className="p-4 space-y-4">
                {paginatedData.map((seller, i) => {
                  const accent = ACCOUNT_RIBBON[seller.accountStatus] || '#00A86B';
                  return (
                    <div key={i} className="relative bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
                      <div className="absolute top-0 left-0 px-3.5 py-1 text-[10px] font-bold text-white uppercase tracking-wide"
                        style={{ background: accent, clipPath: 'polygon(0 0, 100% 0, 84% 100%, 0% 100%)' }}>
                        {seller.accountStatus || '—'}
                      </div>
                      <div className="pt-8 px-4 pb-4">
                        <div className="rounded-xl p-3 mb-3 bg-white" style={{ border: `1px solid ${accent}` }}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="text-[14px] leading-[20px] font-semibold text-[#1E293B] truncate">{seller.company || seller.fullname}</div>
                              <div className="text-[12px] leading-[18px] font-normal text-[#64748B] truncate">{seller.email}</div>
                              <div className="text-[11px] text-[#94A3B8] font-mono mt-0.5">{seller.userId}</div>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${KYC_STATUS[seller.kycStatus] || 'bg-gray-100 text-gray-500'}`}>{seller.kycStatus}</span>
                          </div>
                        </div>

                        <div className="flex items-start justify-between mb-3 px-1 gap-2">
                          <span className="text-[12px] font-medium text-[#0F172A] flex-1">{seller.phoneNumber || '—'}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-600 shrink-0">{seller.planName || '—'}</span>
                        </div>

                        <div className="flex items-start justify-between bg-[#F8FAFC] rounded-xl px-3 py-2.5 mb-3 gap-2">
                          <div className="min-w-0">
                            <div className="text-[10px] font-normal text-[#94A3B8] uppercase tracking-wider">City</div>
                            <div className="text-[12px] font-medium text-[#0F172A] mt-0.5">{seller.city || '—'}</div>
                            <div className="text-[10px] font-normal text-[#94A3B8] uppercase tracking-wider mt-2">RM</div>
                            <div className="text-[12px] font-medium text-[#0F172A] mt-0.5">{seller.rm || '—'}</div>
                          </div>
                          <div className="text-right min-w-0">
                            <div className="text-[10px] font-normal text-[#94A3B8] uppercase tracking-wider">Wallet</div>
                            <div className="text-[12px] font-semibold text-[#00A86B] mt-0.5">₹{(seller.walletBalance || 0).toLocaleString('en-IN')}</div>
                            <div className="text-[10px] font-normal text-[#94A3B8] uppercase tracking-wider mt-2">Orders</div>
                            <div className="text-[12px] font-medium text-[#0F172A] mt-0.5">{(seller.totalOrders || 0).toLocaleString('en-IN')}</div>
                          </div>
                        </div>

                        <button className="w-full py-2.5 rounded-xl bg-[#1e40af] text-white text-[12px] font-bold flex items-center justify-center gap-1.5 hover:bg-[#1e3a8a] transition-colors">
                          <Eye className="w-4 h-4" /> View Details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {<MobilePaginationBar {...({ page, setPage, totalPages, rowsPerPage, setRowsPerPage, startIndex, endIndex, totalItems: displaySellers.length })} />}
          </div>
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
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2"><Filter className="w-5 h-5 text-[#00A86B]" /> Filters</h3>
                <button onClick={() => setIsMobileFiltersOpen(false)} className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Search</label>
                  <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search seller, ID, email..."
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B]" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">KYC Status</label>
                  <select value={kycFilter} onChange={(e) => setKycFilter(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B] bg-white">
                    <option value="All">All</option>
                    {['Verified', 'Pending', 'Rejected', 'Not Submitted'].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Account Status</label>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B] bg-white">
                    <option value="All">All</option>
                    {['Active', 'Inactive', 'Suspended', 'Trial'].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">City</label>
                  <select value={cityFilter[0] || ''} onChange={(e) => setCityFilter(e.target.value ? [e.target.value] : [])}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B] bg-white">
                    <option value="">All Cities</option>
                    {cityOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Date Range</label>
                  <GlassDateFilter
                    className="w-full [&_.glass-dropdown-trigger]:w-full [&_.glass-dropdown-trigger]:h-11"
                    startDate={dateFrom} endDate={dateTo}
                    onDateChange={(s, e) => { setDateFrom(s); setDateTo(e); }}
                  />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-[#E2E8F0] flex items-center gap-3 sticky bottom-0 bg-white">
                <button onClick={() => { handleClearAllFilters(); setIsMobileFiltersOpen(false); }}
                  className="flex-1 h-11 rounded-full border border-[#E2E8F0] text-[#475569] text-sm font-bold hover:bg-[#F8FAFC] transition-colors">
                  Reset All
                </button>
                <button onClick={() => { handleApplyFilters(); setIsMobileFiltersOpen(false); }}
                  className="flex-1 h-11 rounded-full bg-[#009D64] text-white text-sm font-bold hover:bg-[#009B63] transition-colors shadow-sm">
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
