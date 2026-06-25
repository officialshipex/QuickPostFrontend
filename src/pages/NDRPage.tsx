import React, { useState, useMemo } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Search, Download, Filter, Eye, CheckCheck, AlertCircle, ChevronDown, Phone, MessageSquare } from 'lucide-react';

const STATUS_TABS = ['All', 'Action Required', 'Action Requested', 'NDR Delivered', 'RTO Initiated'];

const STATUS_COLOR: Record<string, string> = {
  'Action Required': 'bg-red-100 text-red-700',
  'Action Requested': 'bg-yellow-100 text-yellow-700',
  'NDR Delivered': 'bg-green-100 text-green-700',
  'RTO Initiated': 'bg-rose-100 text-rose-700',
};

const REASON_COLOR: Record<string, string> = {
  'Customer Refused': 'bg-red-50 text-red-600',
  'Not At Home': 'bg-orange-50 text-orange-600',
  'Wrong Address': 'bg-yellow-50 text-yellow-700',
  'Out Of Coverage': 'bg-purple-50 text-purple-600',
  'Office Closed': 'bg-blue-50 text-blue-600',
};

const NDR_DATA = [
  { id: 'NDR10045', orderId: 'QP100246', awb: 'BDT9876543210', customer: 'Priya Singh', mobile: '9765432109', courier: 'Bluedart', city: 'Bengaluru', reason: 'Not At Home', attempts: 1, status: 'Action Required', date: '12 Jun 2026', nextAction: 'Reattempt' },
  { id: 'NDR10046', orderId: 'QP100250', awb: 'EKT3344556677', customer: 'Anita Desai', mobile: '9321098765', courier: 'Ekart', city: 'Lucknow', reason: 'Customer Refused', attempts: 3, status: 'RTO Initiated', date: '09 Jun 2026', nextAction: 'RTO' },
  { id: 'NDR10047', orderId: 'QP100251', awb: 'BDT4455667788', customer: 'Ravi Mehta', mobile: '9210987654', courier: 'Bluedart', city: 'Kochi', reason: 'Wrong Address', attempts: 2, status: 'Action Requested', date: '09 Jun 2026', nextAction: 'Update Address' },
  { id: 'NDR10048', orderId: 'QP100258', awb: 'DEL8899001123', customer: 'Sunita Rao', mobile: '9109876543', courier: 'Delhivery', city: 'Hyderabad', reason: 'Office Closed', attempts: 1, status: 'Action Required', date: '11 Jun 2026', nextAction: 'Reattempt' },
  { id: 'NDR10049', orderId: 'QP100259', awb: 'SFX9900112234', customer: 'Vijay Kumar', mobile: '9098765432', courier: 'Shadowfax', city: 'Pune', reason: 'Out Of Coverage', attempts: 1, status: 'Action Required', date: '10 Jun 2026', nextAction: 'Reattempt' },
  { id: 'NDR10050', orderId: 'QP100260', awb: 'XPB0011223345', customer: 'Nalini Das', mobile: '8987654321', courier: 'XpressBees', city: 'Kolkata', reason: 'Not At Home', attempts: 2, status: 'Action Requested', date: '08 Jun 2026', nextAction: 'Fake Attempt' },
  { id: 'NDR10051', orderId: 'QP100261', awb: 'DEL1122334456', customer: 'Mohan Iyer', mobile: '8876543210', courier: 'Delhivery', city: 'Chennai', reason: 'Not At Home', attempts: 1, status: 'NDR Delivered', date: '07 Jun 2026', nextAction: '—' },
];

const PAGE_SIZE = 8;

export function NDR() {
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    return NDR_DATA.filter(n => {
      const matchTab = activeTab === 'All' || n.status === activeTab;
      const matchSearch = !search || n.customer.toLowerCase().includes(search.toLowerCase()) || n.awb.toLowerCase().includes(search.toLowerCase()) || n.orderId.toLowerCase().includes(search.toLowerCase());
      return matchTab && matchSearch;
    });
  }, [activeTab, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const toggleAll = () => selectedRows.size === paginated.length ? setSelectedRows(new Set()) : setSelectedRows(new Set(paginated.map(r => r.id)));
  const toggleRow = (id: string) => setSelectedRows(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">NDR Management</h1>
          <p className="text-sm text-[#64748B] mt-0.5">Manage non-delivery reports and re-attempt requests</p>
        </div>
        <button className="flex items-center gap-1.5 px-4 h-10 rounded-full border border-[#E2E8F0] text-xs font-semibold text-[#475569] hover:bg-[#F8FAFC]">
          <Download className="w-4 h-4" /> Export
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Total NDR', value: '302', color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Action Required', value: '128', color: 'text-red-500', bg: 'bg-red-50' },
          { label: 'Action Requested', value: '74', color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'NDR Delivered', value: '68', color: 'text-green-500', bg: 'bg-green-50' },
          { label: 'RTO Initiated', value: '32', color: 'text-rose-500', bg: 'bg-rose-50' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-sm">
            <div className={`text-2xl font-bold ${s.color} mb-1`}>{s.value}</div>
            <div className="text-xs text-[#64748B] font-medium">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-[#E2E8F0] px-4 flex overflow-x-auto no-scrollbar">
          {STATUS_TABS.map(tab => (
            <button key={tab} onClick={() => { setActiveTab(tab); setPage(1); }}
              className={`px-4 py-3.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${activeTab === tab ? 'border-[#00A86B] text-[#00A86B]' : 'border-transparent text-[#64748B] hover:text-[#0F172A]'}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="p-4 flex flex-wrap items-center gap-3 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-full px-3 h-9 flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
            <input type="text" placeholder="Search AWB, Customer, Order ID..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="bg-transparent text-xs text-[#0F172A] outline-none placeholder:text-[#94A3B8] w-full" />
          </div>
          {selectedRows.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#64748B]">{selectedRows.size} selected</span>
              <button className="px-3 h-8 rounded-full bg-[#00A86B] text-white text-xs font-semibold hover:bg-[#009B63]">Bulk Reattempt</button>
              <button className="px-3 h-8 rounded-full border border-rose-200 text-rose-600 text-xs font-semibold hover:bg-rose-50">Mark RTO</button>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[1000px]">
            <thead>
              <tr className="bg-[#F8FAFC] text-xs font-semibold text-[#475569] border-b border-[#E2E8F0]">
                <th className="p-4 w-10"><input type="checkbox" className="accent-[#00A86B]" checked={selectedRows.size === paginated.length && paginated.length > 0} onChange={toggleAll} /></th>
                <th className="p-4">NDR ID</th>
                <th className="p-4">Customer</th>
                <th className="p-4">AWB / Order</th>
                <th className="p-4">Courier</th>
                <th className="p-4">City</th>
                <th className="p-4">Reason</th>
                <th className="p-4 text-center">Attempts</th>
                <th className="p-4">Status</th>
                <th className="p-4">Next Action</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((n) => (
                <tr key={n.id} className="border-t border-[#E2E8F0] hover:bg-[#F8FAFC] text-xs">
                  <td className="p-4"><input type="checkbox" className="accent-[#00A86B]" checked={selectedRows.has(n.id)} onChange={() => toggleRow(n.id)} /></td>
                  <td className="p-4 font-bold text-[#00A86B]">{n.id}</td>
                  <td className="p-4">
                    <div className="font-semibold text-[#0F172A]">{n.customer}</div>
                    <div className="text-[#64748B]">{n.mobile}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-mono text-[#0F172A]">{n.awb}</div>
                    <div className="text-[#00A86B] font-semibold">{n.orderId}</div>
                  </td>
                  <td className="p-4 font-medium text-[#0F172A]">{n.courier}</td>
                  <td className="p-4 text-[#475569]">{n.city}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${REASON_COLOR[n.reason] || 'bg-gray-100 text-gray-600'}`}>{n.reason}</span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold ${n.attempts >= 3 ? 'bg-red-100 text-red-700' : n.attempts === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>{n.attempts}</span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_COLOR[n.status] || 'bg-gray-100 text-gray-600'}`}>{n.status}</span>
                  </td>
                  <td className="p-4 font-medium text-[#475569]">{n.nextAction}</td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-1.5">
                      <button className="w-7 h-7 rounded-full border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:text-[#00A86B] hover:bg-[#F8FAFC]" title="View"><Eye className="w-3.5 h-3.5" /></button>
                      <button className="w-7 h-7 rounded-full border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:text-blue-500 hover:bg-blue-50" title="Call"><Phone className="w-3.5 h-3.5" /></button>
                      <button className="w-7 h-7 rounded-full border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:text-green-500 hover:bg-green-50" title="Reattempt"><CheckCheck className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#E2E8F0]">
          <span className="text-xs text-[#64748B]">Showing {paginated.length} of {filtered.length} records</span>
          <div className="flex gap-1">
            <button disabled={page<=1} onClick={() => setPage(p => p-1)} className="px-3 h-7 rounded border border-[#E2E8F0] text-xs text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-40">Prev</button>
            {Array.from({length: totalPages}, (_, i) => i+1).map(p => (
              <button key={p} onClick={() => setPage(p)} className={`w-7 h-7 rounded text-xs ${p===page ? 'bg-[#00A86B] text-white' : 'border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]'}`}>{p}</button>
            ))}
            <button disabled={page>=totalPages} onClick={() => setPage(p => p+1)} className="px-3 h-7 rounded border border-[#E2E8F0] text-xs text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-40">Next</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
