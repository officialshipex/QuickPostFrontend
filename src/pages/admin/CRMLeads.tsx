import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { Search, UserPlus, Phone, TrendingUp, Clock, CheckCircle2, XCircle, Loader2, X, MapPin, Building2, Tag, Radio, IndianRupee, UserCog, History, CalendarClock, FileText, Filter } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { GlassDropdown } from '../../components/ui/GlassDropdown';
import { GlassDateFilter } from '../../components/ui/GlassDateFilter';
import { getLast7DaysStr } from '../../hooks/filters/useDateRangeFilter';
import { TableLoader } from '../../components/ui/TableLoader';
import { EmptyState } from '../../components/ui/EmptyState';
import { StatusRibbon } from '../../components/ui/StatusRibbon';
import { usePagination, DesktopPagination } from '../../hooks/usePagination';
import { MobilePaginationBar } from '../../hooks/useMobilePaginationBar';

const STAGE_RIBBON: Record<string, string> = {
  'New Lead': '#2563EB', 'Contacted': '#7C3AED', 'Demo Scheduled': '#D97706',
  'Proposal Sent': '#EA580C', 'Negotiation': '#DB2777', 'Converted': '#059669', 'Lost': '#DC2626',
};

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
  const [cityFilter, setCityFilter] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState(() => getLast7DaysStr()[0]);
  const [dateTo, setDateTo] = useState(() => getLast7DaysStr()[1]);
  const [defStart, defEnd] = getLast7DaysStr();

  const [leads, setLeads] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [summary, setSummary] = useState({ total: 0, new: 0, inProgress: 0, converted: 0, lost: 0, conversionRate: '0.0' });
  const [loading, setLoading] = useState(false);

  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: '1', limit: '100000' };
      if (search) params.search = search;
      if (source !== 'All Sources') params.source = source;
      if (stage !== 'All') params.stage = stage;

      const res = await apiClient.get('/crm/leads', { params });
      setLeads(res.data.leads || []);
      setTotalCount(res.data.totalCount || 0);
      if (res.data.summary) setSummary(res.data.summary);
    } catch {
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, [search, source, stage]);

  useEffect(() => { fetchLeads(); }, [search, source, stage]);

  const handleAddLead = async () => {
    if (!form.businessName || !form.contactName || !form.phone) return;
    setSaving(true);
    try {
      await apiClient.post('/crm/leads', { ...form, expectedVolume: Number(form.expectedVolume) || 0 });
      setShowAddModal(false);
      setForm({ ...EMPTY_FORM });
      fetchLeads();
    } catch { /* silent */ } finally { setSaving(false); }
  };

  // City options — derived client-side from the currently loaded leads list
  const cityOptions = useMemo(() => {
    const unique = Array.from(new Set(leads.map(l => l.city).filter(Boolean)));
    return unique.map(c => ({ label: c, value: c }));
  }, [leads]);

  // City / Date Range (followUpDate) are client-side filters applied on top of the fetched list
  const displayLeads = useMemo(() => {
    return leads.filter(l => {
      if (cityFilter.length && !cityFilter.includes(l.city)) return false;
      if (dateFrom || dateTo) {
        if (!l.followUpDate) return false;
        const d = new Date(l.followUpDate).getTime();
        if (dateFrom && d < new Date(dateFrom).getTime()) return false;
        if (dateTo && d > new Date(dateTo).getTime() + 24 * 60 * 60 * 1000 - 1) return false;
      }
      return true;
    });
  }, [leads, cityFilter, dateFrom, dateTo]);

  const { page, setPage, totalPages, paginatedData, startIndex, endIndex, rowsPerPage, setRowsPerPage } = usePagination({ data: displayLeads, perPage: 10 });

  const hasActiveFilters = !!search || stage !== 'All' || source !== 'All Sources' || cityFilter.length > 0 || (dateFrom && dateTo && !(dateFrom === defStart && dateTo === defEnd));

  const handleApplyFilters = () => { fetchLeads(); };

  const handleClearAllFilters = () => {
    setSearch(''); setStage('All'); setSource('All Sources');
    setCityFilter([]); setDateFrom(defStart); setDateTo(defEnd);
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
      <div className="flex flex-col h-[calc(100vh-72px)] -m-4 md:-m-6 bg-white overflow-hidden">
        <div className="shrink-0 px-6 pt-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
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

          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-4">
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
        </div>

        <div className="bg-white flex flex-col flex-1 min-h-0 overflow-hidden border-t border-[#E2E8F0]">
          <div className="py-3 px-6 border-b border-[#CBD5F5] shrink-0">
            <div className="md:hidden flex items-center gap-2 mb-2">
              <button onClick={() => setIsMobileFiltersOpen(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#00A86B] text-white text-[12px] font-bold shadow-sm">
                <Filter className="w-3.5 h-3.5" /> Filters
              </button>
              {hasActiveFilters && <span className="text-[11px] font-bold text-[#00A86B] bg-[#F0FDF4] border border-[#00A86B]/20 px-2.5 py-1 rounded-full">Active</span>}
              <span className="text-xs text-[#64748B] ml-auto">{totalCount} leads</span>
            </div>
            <div className="filter-grid hidden md:grid grid-cols-3 gap-3">
              <div className="relative">
                <input type="text" placeholder="Search leads..." value={search} onChange={e => setSearch(e.target.value)} className="glass-search-input w-full" />
                <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute right-2.5 top-1/2 -translate-y-1/2" />
              </div>

              <GlassDropdown
                className="w-full [&_.glass-dropdown-trigger]:w-full"
                label="Source"
                options={SOURCES.filter(o => o !== 'All Sources').map(o => ({ label: o, value: o }))}
                selected={source === 'All Sources' ? [] : [source]}
                onChange={(vals) => setSource(vals[0] || 'All Sources')}
                placeholder="Search source..."
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
                defaultStart={defStart}
                defaultEnd={defEnd}
              />

              <div className="flex items-center gap-3 col-span-2">
                <button onClick={handleApplyFilters} className="py-2 px-4 shrink-0 rounded-[32px] bg-[#009D64] border border-[#009D64] text-white text-xs font-medium leading-[18px] hover:bg-[#008a57] transition-colors cursor-pointer">
                  Apply Filters
                </button>
                {hasActiveFilters && (
                  <button onClick={handleClearAllFilters} className="py-2 px-4 shrink-0 rounded-[32px] border border-red-200 text-red-500 text-xs font-medium leading-[18px] hover:bg-red-50 transition-colors cursor-pointer">
                    Clear All
                  </button>
                )}
                <span className="text-xs text-[#64748B] ml-auto flex items-center gap-2 shrink-0">
                  {totalCount} leads
                </span>
              </div>
            </div>
          </div>

          <div className="hidden md:block flex-1 overflow-auto w-full relative">
            {loading && <TableLoader />}
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead className="sticky top-0 z-40 bg-[#E6F9F2] shadow-sm">
                <tr className="border-b border-[#E2E8F0] text-xs uppercase tracking-wider font-medium text-[#64748B]">
                  <th className="py-2 px-3 rounded-l-lg"><div className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5 shrink-0" /><span>Lead / Business</span></div></th>
                  <th className="py-2 px-3"><div className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 shrink-0" /><span>Contact</span></div></th>
                  <th className="py-2 px-3"><div className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 shrink-0" /><span>City</span></div></th>
                  <th className="py-2 px-3"><div className="flex items-center gap-1"><Tag className="w-3.5 h-3.5 shrink-0" /><span>Stage</span></div></th>
                  <th className="py-2 px-3"><div className="flex items-center gap-1"><Radio className="w-3.5 h-3.5 shrink-0" /><span>Source</span></div></th>
                  <th className="py-2 px-3"><div className="flex items-center gap-1"><IndianRupee className="w-3.5 h-3.5 shrink-0" /><span>Expected Volume</span></div></th>
                  <th className="py-2 px-3"><div className="flex items-center gap-1"><UserCog className="w-3.5 h-3.5 shrink-0" /><span>Assigned To</span></div></th>
                  <th className="py-2 px-3"><div className="flex items-center gap-1"><History className="w-3.5 h-3.5 shrink-0" /><span>Last Activity</span></div></th>
                  <th className="py-2 px-3"><div className="flex items-center gap-1"><CalendarClock className="w-3.5 h-3.5 shrink-0" /><span>Follow-up</span></div></th>
                  <th className="py-2 px-3 rounded-r-lg"><div className="flex items-center gap-1"><FileText className="w-3.5 h-3.5 shrink-0" /><span>Notes</span></div></th>
                </tr>
              </thead>
              <tbody className="text-xs text-[#475569]">
                {paginatedData.length === 0 ? (
                  <tr><td colSpan={10} className="p-8 text-center text-[#64748B] font-medium">No leads found</td></tr>
                ) : paginatedData.map((lead, i) => (
                  <tr key={i} className={`border-b border-[#E2E8F0] transition-colors cursor-pointer ${i % 2 === 0 ? 'bg-white' : 'bg-[#E6EDF7]/20'}`}>
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

          <DesktopPagination
            page={page}
            setPage={setPage}
            totalPages={totalPages}
            rowsPerPage={rowsPerPage}
            setRowsPerPage={setRowsPerPage}
            startIndex={startIndex}
            endIndex={endIndex}
            totalItems={displayLeads.length}
          />

          {/* Mobile Card List */}
          <div className="md:hidden flex-1 overflow-y-auto bg-[#F8FAFC] relative">
            {loading && <TableLoader />}
            {paginatedData.length === 0 ? (
              <EmptyState title="No leads found" subtitle="Try changing filters" />
            ) : (
              <div className="p-2 space-y-2">
                {paginatedData.map((lead, i) => {
                  const accent = STAGE_RIBBON[lead.stage] || '#00A86B';
                  return (
                    <div key={i} className="relative bg-white rounded-2xl border border-[#E2E8F0] shadow-sm">
                      <StatusRibbon label={lead.stage} color={accent} />
                      {/* Lead ID — parallel to the ribbon, matching Orders page layout */}
                      <div className="flex justify-end pl-[84px] pr-4 pt-1.5">
                        <span className="text-[12.5px] font-bold text-[#1D4ED8] truncate max-w-[140px]">{lead.leadId}</span>
                      </div>
                      <div className="pt-1.5 px-4 pb-4">
                        <div className="rounded-xl p-3 mb-3 bg-white" style={{ border: `1px solid ${accent}` }}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="text-[14px] leading-[20px] font-semibold text-[#1E293B] truncate">{lead.businessName}</div>
                              <div className="text-[12px] leading-[18px] font-normal text-[#64748B]">{lead.contactName}</div>
                            </div>
                            <span className="text-[11px] font-medium text-[#64748B] shrink-0 flex items-center gap-1"><Phone className="w-3 h-3" />{lead.phone}</span>
                          </div>
                        </div>

                        <div className="flex items-start justify-between mb-3 px-1 gap-2">
                          <span className="text-[12px] font-medium text-[#0F172A] flex-1">{lead.city || '—'}</span>
                          <span className="text-[11px] font-medium text-[#64748B] shrink-0">{lead.source}</span>
                        </div>

                        <div className="flex items-start justify-between bg-[#F8FAFC] rounded-xl px-3 py-2.5 mb-3 gap-2">
                          <div className="min-w-0">
                            <div className="text-[10px] font-normal text-[#94A3B8] uppercase tracking-wider">Expected Volume</div>
                            <div className="text-[12px] font-medium text-[#0F172A] mt-0.5">{lead.expectedVolume ? `${lead.expectedVolume} orders/mo` : '—'}</div>
                            <div className="text-[10px] font-normal text-[#94A3B8] uppercase tracking-wider mt-2">Assigned To</div>
                            <div className="text-[12px] font-medium text-[#0F172A] mt-0.5">{lead.assignedTo || '—'}</div>
                          </div>
                          <div className="text-right min-w-0">
                            <div className="text-[10px] font-normal text-[#94A3B8] uppercase tracking-wider">Follow-up</div>
                            <div className={`text-[12px] font-medium mt-0.5 ${lead.followUpDate && new Date(lead.followUpDate) <= new Date() ? 'text-red-500' : 'text-[#0F172A]'}`}>
                              {lead.followUpDate ? new Date(lead.followUpDate).toISOString().split('T')[0] : '—'}
                            </div>
                            <div className="text-[10px] font-normal text-[#94A3B8] uppercase tracking-wider mt-2">Last Activity</div>
                            <div className="text-[12px] font-medium text-[#0F172A] mt-0.5">{lead.lastActivityDate ? new Date(lead.lastActivityDate).toISOString().split('T')[0] : '—'}</div>
                          </div>
                        </div>

                        {lead.notes && (
                          <div className="text-[11px] text-[#64748B] px-1 mb-1 line-clamp-2">{lead.notes}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {<MobilePaginationBar {...({ page, setPage, totalPages, rowsPerPage, setRowsPerPage, startIndex, endIndex, totalItems: displayLeads.length })} />}
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
                  <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search leads..."
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B]" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Source</label>
                  <select value={source} onChange={(e) => setSource(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B] bg-white">
                    {SOURCES.map(o => <option key={o} value={o}>{o}</option>)}
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
                    defaultStart={defStart}
                    defaultEnd={defEnd}
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
