import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { Search, UserPlus, Phone, ChevronLeft, ChevronRight, TrendingUp, Clock, CheckCircle2, XCircle, Loader2, X } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

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

const EMPTY_FORM = { businessName: '', contactName: '', phone: '', email: '', city: '', stage: 'New Lead', source: 'Website', expectedVolume: '', assignedTo: '', followUpDate: '', notes: '' };

export function CRMLeads() {
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState('All');
  const [source, setSource] = useState('All Sources');

  const [leads, setLeads] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [summary, setSummary] = useState({ total: 0, new: 0, inProgress: 0, converted: 0, lost: 0, conversionRate: '0.0' });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  const fetchLeads = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(pg), limit: '10' };
      if (search) params.search = search;
      if (source !== 'All Sources') params.source = source;
      if (stage !== 'All') params.stage = stage;

      const res = await apiClient.get('/crm/leads', { params });
      setLeads(res.data.leads || []);
      setTotalCount(res.data.totalCount || 0);
      setTotalPages(res.data.totalPages || 1);
      if (res.data.summary) setSummary(res.data.summary);
    } catch {
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, [search, source, stage]);

  useEffect(() => { setPage(1); }, [search, source, stage]);
  useEffect(() => { fetchLeads(page); }, [page, search, source, stage]);

  const handleAddLead = async () => {
    if (!form.businessName || !form.contactName || !form.phone) return;
    setSaving(true);
    try {
      await apiClient.post('/crm/leads', { ...form, expectedVolume: Number(form.expectedVolume) || 0 });
      setShowAddModal(false);
      setForm({ ...EMPTY_FORM });
      fetchLeads(1);
    } catch { /* silent */ } finally { setSaving(false); }
  };

  const funnelStats = [
    { label: 'Total Leads', value: summary.total, icon: UserPlus, color: 'text-[#0F172A]' },
    { label: 'New', value: summary.new, icon: TrendingUp, color: 'text-blue-500' },
    { label: 'In Progress', value: summary.inProgress, icon: Clock, color: 'text-amber-500' },
    { label: 'Converted', value: summary.converted, icon: CheckCircle2, color: 'text-green-500' },
    { label: 'Lost', value: summary.lost, icon: XCircle, color: 'text-red-500' },
    { label: 'Conversion Rate', value: `${summary.conversionRate}%`, icon: TrendingUp, color: 'text-purple-500' },
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
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#00A86B] text-white text-xs font-semibold hover:bg-[#009960] transition-colors self-start">
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
          <span className="text-xs text-[#64748B] ml-auto flex items-center gap-2">
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00A86B]" />}
            {totalCount} leads
          </span>
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
              {loading && leads.length === 0 ? (
                <tr><td colSpan={10} className="p-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-[#00A86B]" /></td></tr>
              ) : leads.length === 0 ? (
                <tr><td colSpan={10} className="p-8 text-center text-[#64748B] font-medium">No leads found</td></tr>
              ) : leads.map((lead, i) => (
                <tr key={i} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors cursor-pointer">
                  <td className="p-3 pl-4">
                    <div className="font-semibold text-[#0F172A]">{lead.businessName}</div>
                    <div className="text-[10px] text-[#94A3B8] font-mono">{lead.leadId}</div>
                  </td>
                  <td className="p-3">
                    <div className="font-medium">{lead.contactName}</div>
                    <div className="flex gap-2 mt-0.5">
                      <span className="text-[10px] text-[#64748B] flex items-center gap-0.5"><Phone className="w-2.5 h-2.5" /> {lead.phone}</span>
                    </div>
                  </td>
                  <td className="p-3">{lead.city || '—'}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STAGE_STYLES[lead.stage] || 'bg-gray-100 text-gray-500'}`}>{lead.stage}</span>
                  </td>
                  <td className="p-3 text-[#64748B]">{lead.source}</td>
                  <td className="p-3 font-medium text-[#0F172A]">{lead.expectedVolume ? `${lead.expectedVolume} orders/mo` : '—'}</td>
                  <td className="p-3 text-[#64748B]">{lead.assignedTo || '—'}</td>
                  <td className="p-3 table-date">{lead.lastActivityDate ? new Date(lead.lastActivityDate).toISOString().split('T')[0] : '—'}</td>
                  <td className="p-3">
                    <span className={`table-date ${lead.followUpDate && new Date(lead.followUpDate) <= new Date() ? '!text-red-500' : ''}`}>
                      {lead.followUpDate ? new Date(lead.followUpDate).toISOString().split('T')[0] : '—'}
                    </span>
                  </td>
                  <td className="p-3 text-[11px] text-[#64748B] max-w-[180px] truncate">{lead.notes || '—'}</td>
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

      {/* Add Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
              <h3 className="text-sm font-bold text-[#0F172A]">Add New Lead</h3>
              <button onClick={() => { setShowAddModal(false); setForm({ ...EMPTY_FORM }); }} className="text-[#94A3B8] hover:text-[#0F172A]"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 grid grid-cols-2 gap-3 text-xs">
              {[
                { label: 'Business Name *', key: 'businessName', placeholder: 'Raj Textiles' },
                { label: 'Contact Name *', key: 'contactName', placeholder: 'Rajesh Kumar' },
                { label: 'Phone *', key: 'phone', placeholder: '+91 98000 00000' },
                { label: 'Email', key: 'email', placeholder: 'raj@example.com' },
                { label: 'City', key: 'city', placeholder: 'Surat' },
                { label: 'Expected Volume (orders/mo)', key: 'expectedVolume', placeholder: '500' },
                { label: 'Assigned To', key: 'assignedTo', placeholder: 'Rahul M.' },
                { label: 'Follow-up Date', key: 'followUpDate', placeholder: '', type: 'date' },
              ].map(({ label, key, placeholder, type }) => (
                <div key={key} className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">{label}</label>
                  <input type={type || 'text'} placeholder={placeholder} value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className="h-8 px-3 rounded-lg border border-[#E2E8F0] text-xs focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20 focus:border-[#00A86B]" />
                </div>
              ))}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">Stage</label>
                <select value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value }))} className="h-8 px-3 rounded-lg border border-[#E2E8F0] text-xs focus:outline-none focus:border-[#00A86B] bg-white">
                  {STAGES.filter(s => s !== 'All').map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">Source</label>
                <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} className="h-8 px-3 rounded-lg border border-[#E2E8F0] text-xs focus:outline-none focus:border-[#00A86B] bg-white">
                  {SOURCES.filter(s => s !== 'All Sources').map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="col-span-2 flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">Notes</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="px-3 py-2 rounded-lg border border-[#E2E8F0] text-xs focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20 focus:border-[#00A86B] resize-none" />
              </div>
            </div>
            <div className="px-5 py-4 border-t border-[#E2E8F0] flex justify-end gap-2">
              <button onClick={() => { setShowAddModal(false); setForm({ ...EMPTY_FORM }); }} className="px-4 py-2 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-[#64748B] hover:bg-[#F8FAFC]">Cancel</button>
              <button onClick={handleAddLead} disabled={saving || !form.businessName || !form.contactName || !form.phone} className="px-5 py-2 rounded-lg bg-[#00A86B] text-white text-xs font-semibold hover:bg-[#009960] disabled:opacity-50 flex items-center gap-1.5">
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save Lead
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
