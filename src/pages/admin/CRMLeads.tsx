import React, { useState } from 'react';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { usePagination } from '../../hooks/usePagination';
import { Search, UserPlus, Phone, Mail, ChevronLeft, ChevronRight, TrendingUp, Clock, CheckCircle2, XCircle } from 'lucide-react';

const STAGES = ['All', 'New Lead', 'Contacted', 'Demo Scheduled', 'Proposal Sent', 'Negotiation', 'Converted', 'Lost'];
const SOURCES = ['All Sources', 'Website', 'Referral', 'Cold Call', 'LinkedIn', 'Event', 'Partner'];

const STAGE_STYLES: Record<string, string> = {
  'New Lead': 'bg-blue-50 text-blue-600',
  'Contacted': 'bg-purple-50 text-purple-600',
  'Demo Scheduled': 'bg-amber-50 text-amber-700',
  'Proposal Sent': 'bg-orange-50 text-orange-600',
  'Negotiation': 'bg-pink-50 text-pink-600',
  'Converted': 'bg-green-50 text-green-600',
  'Lost': 'bg-red-50 text-red-500',
};

const MOCK_LEADS = Array.from({ length: 16 }, (_, i) => ({
  id: `LEAD${String(1000 + i).padStart(4, '0')}`,
  name: ['Raj Textiles', 'Meera Electronics', 'Sundar Organics', 'Bharat Footwear', 'Nisha Cosmetics', 'Veer Sports', 'Om Handicrafts', 'Priya Kitchenware'][i % 8],
  contact: ['Rajesh Kumar', 'Meera Joshi', 'Sundar Patel', 'Bharat Shah', 'Nisha Gupta', 'Veer Singh', 'Om Prakash', 'Priya Menon'][i % 8],
  email: `lead${i + 1}@business.com`,
  phone: `+91 98${String(10000000 + i * 7).slice(0, 8)}`,
  city: ['Surat', 'Indore', 'Jaipur', 'Nagpur', 'Lucknow', 'Bhopal', 'Coimbatore', 'Kochi'][i % 8],
  stage: STAGES.filter(s => s !== 'All')[i % (STAGES.length - 1)],
  source: ['Website', 'Referral', 'Cold Call', 'LinkedIn', 'Event', 'Partner'][i % 6],
  expectedVolume: `${(i + 1) * 200 + 100} orders/mo`,
  assignedTo: ['Rahul M.', 'Priya S.', 'Amit K.', 'Neha V.'][i % 4],
  lastActivity: `2026-06-${String(10 + (i % 9)).padStart(2, '0')}`,
  followUpDate: `2026-06-${String(20 + (i % 9)).padStart(2, '0')}`,
  notes: i % 3 === 0 ? 'Interested in enterprise plan, pending demo.' : i % 3 === 1 ? 'Waiting for pricing approval.' : 'Follow-up scheduled.',
}));

export function CRMLeads() {
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState('All');
  const [source, setSource] = useState('All Sources');
  // usePagination initialization below filtered definition

  const filtered = MOCK_LEADS.filter(l => {
    if (stage !== 'All' && l.stage !== stage) return false;
    if (source !== 'All Sources' && l.source !== source) return false;
    if (search && !l.name.toLowerCase().includes(search.toLowerCase()) && !l.contact.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const {
    page,
    setPage,
    totalPages,
    paginatedData: paginated,
  } = usePagination({ data: filtered, perPage: 10 });

  const funnelStats = [
    { label: 'Total Leads', value: MOCK_LEADS.length, icon: UserPlus, color: 'text-[#0F172A]' },
    { label: 'New', value: MOCK_LEADS.filter(l => l.stage === 'New Lead').length, icon: TrendingUp, color: 'text-blue-500' },
    { label: 'In Progress', value: MOCK_LEADS.filter(l => ['Contacted', 'Demo Scheduled', 'Proposal Sent', 'Negotiation'].includes(l.stage)).length, icon: Clock, color: 'text-amber-500' },
    { label: 'Converted', value: MOCK_LEADS.filter(l => l.stage === 'Converted').length, icon: CheckCircle2, color: 'text-green-500' },
    { label: 'Lost', value: MOCK_LEADS.filter(l => l.stage === 'Lost').length, icon: XCircle, color: 'text-red-500' },
    { label: 'Conversion Rate', value: `${Math.round((MOCK_LEADS.filter(l => l.stage === 'Converted').length / MOCK_LEADS.length) * 100)}%`, icon: TrendingUp, color: 'text-purple-500' },
  ];

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#0F172A]">Leads & Onboarding</h2>
            <span className="text-[10px] font-bold bg-[#00A86B]/10 text-[#00A86B] px-2 py-0.5 rounded-full">INTERNAL CRM</span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">Track prospective sellers through the onboarding funnel.</p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#00A86B] text-white text-xs font-semibold hover:bg-[#009960] transition-colors self-start">
          <UserPlus className="w-3.5 h-3.5" /> Add Lead
        </button>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-5">
        {funnelStats.map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-[#E2E8F0] p-3 hover:shadow-md transition-all">
            <s.icon className={`w-4 h-4 ${s.color} mb-1.5`} />
            <div className="text-lg font-bold text-[#0F172A]">{s.value}</div>
            <div className="text-[10px] font-semibold text-[#64748B]">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Stage filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-4 no-scrollbar">
        {STAGES.map(s => (
          <button key={s} onClick={() => setStage(s)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${stage === s ? 'bg-[#00A86B] text-white' : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]'}`}>
            {s}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#E2E8F0] flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input type="text" placeholder="Search leads..." value={search} onChange={e => setSearch(e.target.value)} className="w-full h-9 pl-9 pr-4 rounded-lg border border-[#E2E8F0] text-xs focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20 focus:border-[#00A86B]" />
          </div>
          <select value={source} onChange={e => setSource(e.target.value)} className="h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs bg-white focus:outline-none focus:border-[#00A86B]">
            {SOURCES.map(o => <option key={o}>{o}</option>)}
          </select>
          <span className="text-xs text-[#64748B] ml-auto">{filtered.length} leads</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-xs uppercase tracking-wider font-medium text-[#64748B]">
                <th className="p-3 pl-4">Lead / Business</th>
                <th className="p-3">Contact</th>
                <th className="p-3">City</th>
                <th className="p-3">Stage</th>
                <th className="p-3">Source</th>
                <th className="p-3">Expected Volume</th>
                <th className="p-3">Assigned To</th>
                <th className="p-3">Last Activity</th>
                <th className="p-3">Follow-up</th>
                <th className="p-3">Notes</th>
              </tr>
            </thead>
            <tbody className="text-xs text-[#475569]">
              {paginated.map((lead, i) => (
                <tr key={i} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors cursor-pointer">
                  <td className="p-3 pl-4">
                    <div className="font-semibold text-[#0F172A]">{lead.name}</div>
                    <div className="text-[10px] text-[#94A3B8] font-mono">{lead.id}</div>
                  </td>
                  <td className="p-3">
                    <div className="font-medium">{lead.contact}</div>
                    <div className="flex gap-2 mt-0.5">
                      <span className="text-[10px] text-[#64748B] flex items-center gap-0.5"><Phone className="w-2.5 h-2.5" /> {lead.phone}</span>
                    </div>
                  </td>
                  <td className="p-3">{lead.city}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STAGE_STYLES[lead.stage] || 'bg-gray-100 text-gray-500'}`}>{lead.stage}</span>
                  </td>
                  <td className="p-3 text-[#64748B]">{lead.source}</td>
                  <td className="p-3 font-medium text-[#0F172A]">{lead.expectedVolume}</td>
                  <td className="p-3 text-[#64748B]">{lead.assignedTo}</td>
                  <td className="p-3 table-date">{lead.lastActivity}</td>
                  <td className="p-3">
                    <span className={`table-date ${new Date(lead.followUpDate) <= new Date() ? '!text-red-500' : ''}`}>{lead.followUpDate}</span>
                  </td>
                  <td className="p-3 text-[11px] text-[#64748B] max-w-[180px] truncate">{lead.notes}</td>
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
