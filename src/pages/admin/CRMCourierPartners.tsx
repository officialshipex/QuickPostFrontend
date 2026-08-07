import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { Search, Truck, CheckCircle2, TrendingUp, TrendingDown, MapPin, Tag, Gauge, Clock, AlertTriangle, RotateCcw, Package, Weight, UserCog, Filter, X } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { GlassDropdown } from '../../components/ui/GlassDropdown';
import { TableLoader } from '../../components/ui/TableLoader';
import { EmptyState } from '../../components/ui/EmptyState';
import { usePagination, DesktopPagination } from '../../hooks/usePagination';
import { MobilePaginationBar } from '../../hooks/useMobilePaginationBar';

const STATUS_RIBBON: Record<string, string> = {
  'Active': '#059669', 'Inactive': '#94A3B8', 'Under Review': '#D97706',
};

const STATUS_STYLES: Record<string, string> = {
  'Active': 'bg-green-50 text-green-600',
  'Inactive': 'bg-gray-100 text-gray-500',
  'Under Review': 'bg-amber-50 text-amber-700',
};

export function CRMCourierPartners() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [zoneFilter, setZoneFilter] = useState<string[]>([]);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const [allPartners, setAllPartners] = useState<any[]>([]);
  const [summary, setSummary] = useState({ totalPartners: 0, avgDeliveryRate: '0.0', avgRtoRate: '0.0', totalActiveAWBs: 0 });
  const [loading, setLoading] = useState(false);

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/crm/courier-partners');
      setAllPartners(res.data.partners || []);
      if (res.data.summary) setSummary(res.data.summary);
    } catch {
      setAllPartners([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPartners(); }, []);

  // Zone options — derived client-side from the currently loaded partners list
  const zoneOptions = useMemo(() => {
    const unique = Array.from(new Set(allPartners.map(c => c.zones).filter(Boolean)));
    return unique.map(z => ({ label: z, value: z }));
  }, [allPartners]);

  const filtered = allPartners.filter(c => {
    if (statusFilter !== 'All' && c.status !== statusFilter) return false;
    if (zoneFilter.length && !zoneFilter.includes(c.zones)) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const { page, setPage, totalPages, paginatedData, startIndex, endIndex, rowsPerPage, setRowsPerPage } = usePagination({ data: filtered, perPage: 10 });

  const hasActiveFilters = !!search || statusFilter !== 'All' || zoneFilter.length > 0;

  const handleApplyFilters = () => { /* client-side filtering is already live; kept for pattern parity */ };

  const handleClearAllFilters = () => {
    setSearch(''); setStatusFilter('All'); setZoneFilter([]);
  };

  return (
    <AdminLayout>
      <div className="flex flex-col h-[calc(100vh-72px)] -m-4 md:-m-6 bg-white overflow-hidden">
        <div className="shrink-0 px-6 pt-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-[#0F172A]">Courier Partners</h2>
                <span className="text-[10px] font-bold bg-[#00A86B]/10 text-[#00A86B] px-2 py-0.5 rounded-full">INTERNAL CRM</span>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">Monitor courier partner performance, SLAs, delivery rates and account health.</p>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[
              { label: 'Active Partners', value: loading ? '—' : summary.totalPartners, sub: 'Total couriers on platform', icon: Truck, color: 'text-[#0F172A]' },
              { label: 'Avg Delivery Rate', value: loading ? '—' : `${summary.avgDeliveryRate}%`, sub: 'across all couriers', icon: CheckCircle2, color: 'text-green-500' },
              { label: 'Avg RTO Rate', value: loading ? '—' : `${summary.avgRtoRate}%`, sub: 'return to origin', icon: TrendingDown, color: 'text-red-500' },
              { label: 'Active AWBs', value: loading ? '—' : summary.totalActiveAWBs.toLocaleString('en-IN'), sub: 'in transit right now', icon: TrendingUp, color: 'text-blue-500' },
            ].map((card, i) => (
              <div key={i} className="bg-white rounded-xl border border-[#E2E8F0] p-4 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#64748B]">{card.label}</span>
                  <card.icon className={`w-4 h-4 ${card.color}`} />
                </div>
                <div className="text-2xl font-bold text-[#0F172A]">{card.value}</div>
                <div className="text-[10px] text-[#94A3B8] mt-0.5">{card.sub}</div>
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
              <span className="text-xs text-[#64748B] ml-auto">{filtered.length} partners</span>
            </div>
            <div className="filter-grid hidden md:grid grid-cols-2 gap-3">
              <div className="relative">
                <input type="text" placeholder="Search courier..." value={search} onChange={e => setSearch(e.target.value)} className="glass-search-input w-full" />
                <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute right-2.5 top-1/2 -translate-y-1/2" />
              </div>

              <GlassDropdown
                className="w-full [&_.glass-dropdown-trigger]:w-full"
                label="Status"
                options={['Active', 'Inactive', 'Under Review'].map(o => ({ label: o, value: o }))}
                selected={statusFilter === 'All' ? [] : [statusFilter]}
                onChange={(vals) => setStatusFilter(vals[0] || 'All')}
                placeholder="Search status..."
                icon={<CheckCircle2 className="w-3.5 h-3.5" />}
              />

              <GlassDropdown
                className="w-full [&_.glass-dropdown-trigger]:w-full"
                label="Zone"
                options={zoneOptions}
                selected={zoneFilter}
                onChange={setZoneFilter}
                placeholder="Search zone..."
                icon={<MapPin className="w-3.5 h-3.5" />}
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
                  {filtered.length} partners
                </span>
              </div>
            </div>
          </div>

          <div className="hidden md:block flex-1 overflow-auto w-full relative">
            {loading && <TableLoader />}
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead className="sticky top-0 z-40 bg-[#E6F9F2] shadow-sm">
                <tr className="border-b border-[#E2E8F0] text-xs uppercase tracking-wider font-medium text-[#64748B]">
                  <th className="py-2 px-3 rounded-l-lg"><div className="flex items-center gap-1"><Truck className="w-3.5 h-3.5 shrink-0" /><span>Courier</span></div></th>
                  <th className="py-2 px-3"><div className="flex items-center gap-1"><Tag className="w-3.5 h-3.5 shrink-0" /><span>Type</span></div></th>
                  <th className="py-2 px-3"><div className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 shrink-0" /><span>Coverage</span></div></th>
                  <th className="py-2 px-3"><div className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /><span>Status</span></div></th>
                  <th className="py-2 px-3"><div className="flex items-center gap-1"><Gauge className="w-3.5 h-3.5 shrink-0" /><span>Delivery Rate</span></div></th>
                  <th className="py-2 px-3"><div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 shrink-0" /><span>Avg Days</span></div></th>
                  <th className="py-2 px-3"><div className="flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5 shrink-0" /><span>NDR Rate</span></div></th>
                  <th className="py-2 px-3"><div className="flex items-center gap-1"><RotateCcw className="w-3.5 h-3.5 shrink-0" /><span>RTO Rate</span></div></th>
                  <th className="py-2 px-3"><div className="flex items-center gap-1"><Package className="w-3.5 h-3.5 shrink-0" /><span>Active AWBs</span></div></th>
                  <th className="py-2 px-3"><div className="flex items-center gap-1"><TrendingDown className="w-3.5 h-3.5 shrink-0" /><span>SLA Breaches</span></div></th>
                  <th className="py-2 px-3"><div className="flex items-center gap-1"><Weight className="w-3.5 h-3.5 shrink-0" /><span>Weight Cap</span></div></th>
                  <th className="py-2 px-3 rounded-r-lg"><div className="flex items-center gap-1"><UserCog className="w-3.5 h-3.5 shrink-0" /><span>RM</span></div></th>
                </tr>
              </thead>
              <tbody className="text-xs text-[#475569]">
                {paginatedData.length === 0 ? (
                  <tr><td colSpan={12} className="p-8 text-center text-[#64748B] font-medium">No courier partners found</td></tr>
                ) : paginatedData.map((c, i) => (
                  <tr key={i} className={`border-b border-[#E2E8F0] transition-colors cursor-pointer ${i % 2 === 0 ? 'bg-white' : 'bg-[#E6EDF7]/20'}`}>
                    <td className="p-3 pl-4">
                      <div className="font-bold text-[#0F172A]">{c.name}</div>
                      <div className="text-[10px] text-[#94A3B8]">{c.id}</div>
                    </td>
                    <td className="p-3 text-[#64748B]">{c.type || '—'}</td>
                    <td className="p-3">{c.zones || 'Pan India'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_STYLES[c.status] || 'bg-gray-100 text-gray-500'}`}>{c.status}</span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1 h-1.5 bg-[#F1F5F9] rounded-full w-16">
                          <div className="h-full rounded-full bg-green-500" style={{ width: `${Math.min(c.deliveryRate, 100)}%` }} />
                        </div>
                        <span className={`font-bold text-[11px] ${c.deliveryRate >= 93 ? 'text-green-600' : c.deliveryRate >= 88 ? 'text-amber-600' : 'text-red-500'}`}>{c.deliveryRate}%</span>
                      </div>
                    </td>
                    <td className="p-3 font-medium text-[#0F172A]">{c.avgDays ? `${c.avgDays}d` : '—'}</td>
                    <td className="p-3">
                      <span className={`font-bold ${c.ndrRate > 6 ? 'text-red-500' : c.ndrRate > 4 ? 'text-amber-600' : 'text-green-600'}`}>{c.ndrRate}%</span>
                    </td>
                    <td className="p-3">
                      <span className={`font-bold ${c.rtoRate > 10 ? 'text-red-500' : c.rtoRate > 6 ? 'text-amber-600' : 'text-green-600'}`}>{c.rtoRate}%</span>
                    </td>
                    <td className="p-3 font-semibold text-[#0F172A]">{c.activeAWBs.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-[#64748B]">{c.total ? c.total.toLocaleString('en-IN') : '—'}</td>
                    <td className="p-3 text-[#64748B]">{c.weightCap || '—'}</td>
                    <td className="p-3 text-[#64748B]">{c.rm || '—'}</td>
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
            totalItems={filtered.length}
          />

          {/* Mobile Card List */}
          <div className="md:hidden flex-1 overflow-y-auto bg-[#F8FAFC] relative">
            {loading && <TableLoader />}
            {paginatedData.length === 0 ? (
              <EmptyState title="No courier partners found" subtitle="Try changing filters" />
            ) : (
              <div className="p-2 space-y-2">
                {paginatedData.map((c, i) => {
                  const accent = STATUS_RIBBON[c.status] || '#00A86B';
                  return (
                    <div key={i} className="relative bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
                      <div className="absolute top-0 left-0 px-3.5 py-1 text-[10px] font-bold text-white uppercase tracking-wide"
                        style={{ background: accent, clipPath: 'polygon(0 0, 100% 0, 84% 100%, 0% 100%)' }}>
                        {c.status}
                      </div>
                      <div className="pt-8 px-4 pb-4">
                        <div className="rounded-xl p-3 mb-3 bg-white" style={{ border: `1px solid ${accent}` }}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="text-[14px] leading-[20px] font-semibold text-[#1E293B] truncate">{c.name}</div>
                              <div className="text-[12px] leading-[18px] font-normal text-[#64748B]">{c.type || '—'} · {c.zones || 'Pan India'}</div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className={`font-bold text-[13px] ${c.deliveryRate >= 93 ? 'text-green-600' : c.deliveryRate >= 88 ? 'text-amber-600' : 'text-red-500'}`}>{c.deliveryRate}%</div>
                              <div className="text-[10px] text-[#94A3B8]">Delivery</div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start justify-between bg-[#F8FAFC] rounded-xl px-3 py-2.5 mb-3 gap-2">
                          <div className="min-w-0">
                            <div className="text-[10px] font-normal text-[#94A3B8] uppercase tracking-wider">NDR / RTO</div>
                            <div className="text-[12px] font-medium text-[#0F172A] mt-0.5">{c.ndrRate}% / {c.rtoRate}%</div>
                            <div className="text-[10px] font-normal text-[#94A3B8] uppercase tracking-wider mt-2">Avg Days</div>
                            <div className="text-[12px] font-medium text-[#0F172A] mt-0.5">{c.avgDays ? `${c.avgDays}d` : '—'}</div>
                          </div>
                          <div className="text-right min-w-0">
                            <div className="text-[10px] font-normal text-[#94A3B8] uppercase tracking-wider">Active AWBs</div>
                            <div className="text-[12px] font-medium text-[#0F172A] mt-0.5">{(c.activeAWBs || 0).toLocaleString('en-IN')}</div>
                            <div className="text-[10px] font-normal text-[#94A3B8] uppercase tracking-wider mt-2">RM</div>
                            <div className="text-[12px] font-medium text-[#0F172A] mt-0.5">{c.rm || '—'}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {<MobilePaginationBar {...({ page, setPage, totalPages, rowsPerPage, setRowsPerPage, startIndex, endIndex, totalItems: filtered.length })} />}
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
                  <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search courier..."
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B]" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B] bg-white">
                    <option value="All">All</option>
                    {['Active', 'Inactive', 'Under Review'].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Zone</label>
                  <select value={zoneFilter[0] || ''} onChange={(e) => setZoneFilter(e.target.value ? [e.target.value] : [])}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B] bg-white">
                    <option value="">All Zones</option>
                    {zoneOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-[#E2E8F0] flex items-center gap-3 sticky bottom-0 bg-white">
                <button onClick={() => { handleClearAllFilters(); setIsMobileFiltersOpen(false); }}
                  className="flex-1 h-11 rounded-full border border-[#E2E8F0] text-[#475569] text-sm font-bold hover:bg-[#F8FAFC] transition-colors">
                  Reset All
                </button>
                <button onClick={() => setIsMobileFiltersOpen(false)}
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
