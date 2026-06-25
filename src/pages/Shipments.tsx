import React, { useState, useMemo } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Search, Download, Filter, ChevronDown, Package, Truck, CheckCircle2, XCircle, RefreshCcw, MapPin, Eye, Copy } from 'lucide-react';

const STATUS_TABS = ['All', 'Pending Pickup', 'In Transit', 'Out For Delivery', 'Delivered', 'Undelivered', 'RTO'];

const STATUS_COLOR: Record<string, string> = {
  'Pending Pickup': 'bg-purple-100 text-purple-700',
  'In Transit': 'bg-orange-100 text-orange-700',
  'Out For Delivery': 'bg-teal-100 text-teal-700',
  'Delivered': 'bg-green-100 text-green-700',
  'Undelivered': 'bg-red-100 text-red-700',
  'RTO': 'bg-rose-100 text-rose-700',
};

const DUMMY_SHIPMENTS = [
  { awb: 'DEL1234567890', orderId: 'QP100245', customer: 'Rahul Sharma', origin: 'Mumbai', destination: 'Delhi', courier: 'Delhivery', weight: '0.5 KG', status: 'Delivered', date: '12 Jun 2026', eta: '14 Jun 2026', attempts: 1 },
  { awb: 'BDT9876543210', orderId: 'QP100246', customer: 'Priya Singh', origin: 'Ahmedabad', destination: 'Bengaluru', courier: 'Bluedart', weight: '0.8 KG', status: 'In Transit', date: '12 Jun 2026', eta: '15 Jun 2026', attempts: 0 },
  { awb: 'XPB1122334455', orderId: 'QP100247', customer: 'Amit Kumar', origin: 'Delhi', destination: 'Chennai', courier: 'XpressBees', weight: '0.6 KG', status: 'Pending Pickup', date: '11 Jun 2026', eta: '16 Jun 2026', attempts: 0 },
  { awb: 'SFX5566778899', orderId: 'QP100248', customer: 'Sneha Patel', origin: 'Surat', destination: 'Pune', courier: 'Shadowfax', weight: '0.3 KG', status: 'Out For Delivery', date: '11 Jun 2026', eta: '13 Jun 2026', attempts: 1 },
  { awb: 'DEL2233445566', orderId: 'QP100249', customer: 'Vikram Nair', origin: 'Hyderabad', destination: 'Kolkata', courier: 'Delhivery', weight: '1.2 KG', status: 'In Transit', date: '10 Jun 2026', eta: '15 Jun 2026', attempts: 0 },
  { awb: 'EKT3344556677', orderId: 'QP100250', customer: 'Anita Desai', origin: 'Jaipur', destination: 'Lucknow', courier: 'Ekart', weight: '1.5 KG', status: 'RTO', date: '09 Jun 2026', eta: '—', attempts: 3 },
  { awb: 'BDT4455667788', orderId: 'QP100251', customer: 'Ravi Mehta', origin: 'Mumbai', destination: 'Kochi', courier: 'Bluedart', weight: '0.2 KG', status: 'Undelivered', date: '09 Jun 2026', eta: '—', attempts: 2 },
  { awb: 'DTC5566778890', orderId: 'QP100252', customer: 'Meera Joshi', origin: 'Bengaluru', destination: 'Bhopal', courier: 'DTDC', weight: '3.0 KG', status: 'Delivered', date: '08 Jun 2026', eta: '10 Jun 2026', attempts: 1 },
  { awb: 'XPB6677889901', orderId: 'QP100253', customer: 'Arjun Reddy', origin: 'Chennai', destination: 'Indore', courier: 'XpressBees', weight: '0.9 KG', status: 'In Transit', date: '08 Jun 2026', eta: '14 Jun 2026', attempts: 0 },
  { awb: 'DEL7788990012', orderId: 'QP100254', customer: 'Divya Kapoor', origin: 'Kolkata', destination: 'Nagpur', courier: 'Delhivery', weight: '0.4 KG', status: 'Delivered', date: '07 Jun 2026', eta: '09 Jun 2026', attempts: 1 },
];

const PAGE_SIZE = 8;

export function Shipments() {
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [copied, setCopied] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return DUMMY_SHIPMENTS.filter(s => {
      const matchTab = activeTab === 'All' || s.status === activeTab;
      const matchSearch = !search || s.awb.toLowerCase().includes(search.toLowerCase()) || s.customer.toLowerCase().includes(search.toLowerCase()) || s.orderId.toLowerCase().includes(search.toLowerCase());
      return matchTab && matchSearch;
    });
  }, [activeTab, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const copyAWB = (awb: string) => {
    navigator.clipboard.writeText(awb);
    setCopied(awb);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Shipments</h1>
          <p className="text-sm text-[#64748B] mt-0.5">Track and manage all shipments</p>
        </div>
        <button className="flex items-center gap-1.5 px-4 h-10 rounded-full border border-[#E2E8F0] text-xs font-semibold text-[#475569] hover:bg-[#F8FAFC]">
          <Download className="w-4 h-4" /> Export
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
        {[
          { label: 'Total', value: '1,824', icon: Package, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Pickup Pending', value: '234', icon: Package, color: 'text-purple-500', bg: 'bg-purple-50' },
          { label: 'In Transit', value: '542', icon: Truck, color: 'text-orange-500', bg: 'bg-orange-50' },
          { label: 'Out For Delivery', value: '128', icon: MapPin, color: 'text-teal-500', bg: 'bg-teal-50' },
          { label: 'Delivered', value: '824', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' },
          { label: 'RTO', value: '96', icon: RefreshCcw, color: 'text-rose-500', bg: 'bg-rose-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-sm">
            <div className={`w-8 h-8 rounded-full ${stat.bg} flex items-center justify-center mb-2`}>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <div className="text-lg font-bold text-[#0F172A]">{stat.value}</div>
            <div className="text-[10px] text-[#64748B] font-medium">{stat.label}</div>
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
            <input type="text" placeholder="Search AWB, Order ID, Customer..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="bg-transparent text-xs text-[#0F172A] outline-none placeholder:text-[#94A3B8] w-full" />
          </div>
          <div className="flex items-center gap-1.5 px-3 h-9 rounded-full border border-[#E2E8F0] text-xs font-semibold text-[#475569] hover:bg-[#F8FAFC] cursor-pointer">
            <span>Courier: All</span><ChevronDown className="w-3 h-3" />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead>
              <tr className="bg-[#F8FAFC] text-xs font-semibold text-[#475569] border-b border-[#E2E8F0]">
                <th className="p-4">AWB Number</th>
                <th className="p-4">Order ID</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Route</th>
                <th className="p-4">Courier</th>
                <th className="p-4">Weight</th>
                <th className="p-4">Attempts</th>
                <th className="p-4">ETA</th>
                <th className="p-4">Status</th>
                <th className="p-4">Date</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={11} className="text-center py-16 text-sm text-[#94A3B8]">No shipments found.</td></tr>
              ) : paginated.map((s) => (
                <tr key={s.awb} className="border-t border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors text-xs">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#0F172A]">{s.awb}</span>
                      <button onClick={() => copyAWB(s.awb)} className="text-[#94A3B8] hover:text-[#00A86B] transition-colors" title="Copy AWB">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      {copied === s.awb && <span className="text-[#00A86B] text-[10px]">Copied!</span>}
                    </div>
                  </td>
                  <td className="p-4 font-semibold text-[#00A86B]">{s.orderId}</td>
                  <td className="p-4 font-medium text-[#0F172A]">{s.customer}</td>
                  <td className="p-4 text-[#475569]">
                    <div>{s.origin}</div>
                    <div className="text-[#10B981] font-semibold">→ {s.destination}</div>
                  </td>
                  <td className="p-4 font-medium text-[#0F172A]">{s.courier}</td>
                  <td className="p-4 text-[#64748B]">{s.weight}</td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${s.attempts > 1 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>{s.attempts}</span>
                  </td>
                  <td className="p-4 text-[#64748B]">{s.eta}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_COLOR[s.status] || 'bg-gray-100 text-gray-700'}`}>{s.status}</span>
                  </td>
                  <td className="p-4 text-[#64748B]">{s.date}</td>
                  <td className="p-4 text-center">
                    <button className="w-7 h-7 rounded-full hover:bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:text-[#00A86B] mx-auto" title="View"><Eye className="w-3.5 h-3.5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#E2E8F0]">
          <span className="text-xs text-[#64748B]">Showing {Math.min((page-1)*PAGE_SIZE+1, filtered.length)}–{Math.min(page*PAGE_SIZE, filtered.length)} of {filtered.length}</span>
          <div className="flex items-center gap-1">
            <button disabled={page<=1} onClick={() => setPage(p => p-1)} className="px-3 h-7 rounded border border-[#E2E8F0] text-xs font-medium text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-40">Prev</button>
            {Array.from({length: totalPages}, (_, i) => i+1).map(p => (
              <button key={p} onClick={() => setPage(p)} className={`w-7 h-7 rounded text-xs font-medium ${p===page ? 'bg-[#00A86B] text-white' : 'border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]'}`}>{p}</button>
            ))}
            <button disabled={page>=totalPages} onClick={() => setPage(p => p+1)} className="px-3 h-7 rounded border border-[#E2E8F0] text-xs font-medium text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-40">Next</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
