import React, { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { Search, Download, Building2, CheckCircle2, AlertCircle, Clock, TrendingUp, ChevronLeft, ChevronRight, Eye, Loader2 } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

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
  const [page, setPage] = useState(1);
  const perPage = 10;

  const [sellers, setSellers] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [summary, setSummary] = useState({ total: 0, active: 0, kycVerified: 0, kycPending: 0, suspended: 0 });
  const [loading, setLoading] = useState(false);

  const fetchSellers = useCallback(async (pg = page) => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(pg), limit: String(perPage) };
      if (search) params.search = search;
      if (kycFilter !== 'All') params.kycStatus = kycFilter;
      if (statusFilter !== 'All') params.accountStatus = statusFilter;

      const res = await apiClient.get('/crm/sellers', { params });
      setSellers(res.data.sellers || []);
      setTotalCount(res.data.totalCount || 0);
      setTotalPages(res.data.totalPages || 1);
      if (res.data.summary) setSummary(res.data.summary);
    } catch {
      setSellers([]);
    } finally {
      setLoading(false);
    }
  }, [search, kycFilter, statusFilter, page]);

  useEffect(() => { setPage(1); }, [search, kycFilter, statusFilter]);
  useEffect(() => { fetchSellers(page); }, [page, search, kycFilter, statusFilter]);

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
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

      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-5">
        {stats.map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-[#E2E8F0] p-3 hover:shadow-md transition-all">
            <s.icon className={`w-4 h-4 ${s.color} mb-1.5`} />
            <div className="text-lg font-bold text-[#0F172A]">{s.value}</div>
            <div className="text-[10px] font-semibold text-[#64748B]">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#E2E8F0] flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input type="text" placeholder="Search seller, ID, email..." value={search} onChange={e => setSearch(e.target.value)} className="w-full h-9 pl-9 pr-4 rounded-lg border border-[#E2E8F0] text-xs focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20 focus:border-[#00A86B]" />
          </div>
          <select value={kycFilter} onChange={e => setKycFilter(e.target.value)} className="h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs text-[#0F172A] bg-white focus:outline-none focus:border-[#00A86B]">
            {['All', 'Verified', 'Pending', 'Rejected', 'Not Submitted'].map(o => <option key={o}>{o === 'All' ? 'All KYC' : o}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs text-[#0F172A] bg-white focus:outline-none focus:border-[#00A86B]">
            {['All', 'Active', 'Inactive', 'Suspended', 'Trial'].map(o => <option key={o}>{o === 'All' ? 'All Status' : o}</option>)}
          </select>
          <span className="text-xs text-[#64748B] ml-auto flex items-center gap-2">
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00A86B]" />}
            {totalCount} sellers
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-xs uppercase tracking-wider font-medium text-[#64748B]">
                <th className="px-3 py-3.5 pl-4 text-left align-middle">Seller / ID</th>
                <th className="px-3 py-3.5 text-left align-middle">Contact</th>
                <th className="px-3 py-3.5 text-left align-middle">City</th>
                <th className="px-3 py-3.5 text-left align-middle">Plan</th>
                <th className="px-3 py-3.5 text-left align-middle">KYC</th>
                <th className="px-3 py-3.5 text-left align-middle">Account</th>
                <th className="px-3 py-3.5 text-right align-middle">Total Orders</th>
                <th className="px-3 py-3.5 text-right align-middle">Monthly Orders</th>
                <th className="px-3 py-3.5 text-right align-middle">Wallet</th>
                <th className="px-3 py-3.5 text-left align-middle">RM</th>
                <th className="px-3 py-3.5 text-left align-middle">Joined</th>
                <th className="px-3 py-3.5 text-center align-middle">Action</th>
              </tr>
            </thead>
            <tbody className="text-xs text-[#475569]">
              {loading && sellers.length === 0 ? (
                <tr><td colSpan={12} className="p-8 text-center text-[#64748B]"><Loader2 className="w-5 h-5 animate-spin mx-auto text-[#00A86B]" /></td></tr>
              ) : sellers.length === 0 ? (
                <tr><td colSpan={12} className="p-8 text-center text-[#64748B] font-medium">No sellers found</td></tr>
              ) : sellers.map((seller, i) => (
                <tr key={i} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors cursor-pointer">
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

        <div className="flex justify-between items-center px-4 py-3 border-t border-[#E2E8F0] bg-[#F8FAFC]">
          <span className="text-xs text-[#64748B]">Page {page} of {totalPages || 1}</span>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-8 h-8 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-white disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-xs font-bold ${page === p ? 'bg-[#00A86B] text-white' : 'border border-[#E2E8F0] text-[#64748B] hover:bg-white'}`}>{p}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0} className="w-8 h-8 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-white disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
