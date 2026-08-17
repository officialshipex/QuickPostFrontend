import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { usePagination, DesktopPagination } from '../../hooks/usePagination';
import { MobilePaginationBar } from '../../hooks/useMobilePaginationBar';
import { Search, AlertCircle, Clock, CheckCircle2, XCircle, Plus, Hash, User, Truck, Tag, Flame, Timer, UserCog, Calendar, History, Filter, X } from 'lucide-react';
import { GlassDropdown } from '../../components/ui/GlassDropdown';
import { GlassDateFilter } from '../../components/ui/GlassDateFilter';
import { getLast7DaysStr } from '../../hooks/filters/useDateRangeFilter';
import { EmptyState } from '../../components/ui/EmptyState';
import { StatusRibbon } from '../../components/ui/StatusRibbon';

const PRIORITY_RIBBON: Record<string, string> = {
  'Critical': '#DC2626', 'High': '#EA580C', 'Medium': '#D97706', 'Low': '#2563EB',
};

const PRIORITIES = ['All', 'Critical', 'High', 'Medium', 'Low'];
const CATEGORIES = ['All Categories', 'Lost Shipment', 'Delayed Delivery', 'Wrong Delivery', 'Billing Dispute', 'Pickup Failure', 'Damaged Goods', 'COD Discrepancy', 'Tech Issue'];
const TICKET_STATUSES = ['All', 'Open', 'In Progress', 'Awaiting Courier', 'Resolved', 'Closed'];

const PRIORITY_STYLES: Record<string, string> = {
  'Critical': 'bg-red-50 text-red-600 border border-red-200',
  'High': 'bg-orange-50 text-orange-600 border border-orange-200',
  'Medium': 'bg-amber-50 text-amber-700 border border-amber-200',
  'Low': 'bg-blue-50 text-blue-600 border border-blue-200',
};

const STATUS_STYLES: Record<string, string> = {
  'Open': 'bg-red-50 text-red-600',
  'In Progress': 'bg-purple-50 text-purple-600',
  'Awaiting Courier': 'bg-amber-50 text-amber-700',
  'Resolved': 'bg-green-50 text-green-600',
  'Closed': 'bg-gray-100 text-gray-500',
};

const MOCK_TICKETS = Array.from({ length: 18 }, (_, i) => ({
  id: `ESC${String(5000 + i).padStart(5, '0')}`,
  seller: ['Fashion Hub', 'TechGadgets', 'HomeDecor Plus', 'Beauty Bazaar', 'Sports Arena'][i % 5],
  awb: `QP${String(900000000 + i * 1337).padStart(10, '0')}`,
  courier: ['Delhivery', 'Ekart', 'XpressBees', 'Shadowfax', 'DTDC'][i % 5],
  category: ['Lost Shipment', 'Delayed Delivery', 'Wrong Delivery', 'Billing Dispute', 'Pickup Failure', 'Damaged Goods', 'COD Discrepancy', 'Tech Issue'][i % 8],
  priority: ['Critical', 'High', 'Medium', 'Low'][i % 4],
  status: ['Open', 'In Progress', 'Awaiting Courier', 'Resolved', 'Closed'][i % 5],
  assignedTo: ['Rahul M.', 'Priya S.', 'Amit K.', 'Neha V.'][i % 4],
  createdAt: `2026-06-${String(10 + (i % 9)).padStart(2, '0')}`,
  updatedAt: `2026-06-${String(14 + (i % 5)).padStart(2, '0')}`,
  slaHours: [4, 8, 24, 48][i % 4],
  breached: i % 5 === 0,
  description: ['Customer claims shipment lost in transit.', 'Delivery delayed beyond SLA window.', 'Wrong item delivered to customer.', 'COD amount not received.', 'Pickup not attempted.'][i % 5],
}));

export function CRMEscalations() {
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState('All');
  const [ticketStatus, setTicketStatus] = useState('All');
  const [category, setCategory] = useState('All Categories');
  const [dateFrom, setDateFrom] = useState(() => getLast7DaysStr()[0]);
  const [dateTo, setDateTo] = useState(() => getLast7DaysStr()[1]);
  const [defStart, defEnd] = getLast7DaysStr();
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  // usePagination initialization below filtered definition

  const filtered = MOCK_TICKETS.filter(t => {
    if (priority !== 'All' && t.priority !== priority) return false;
    if (ticketStatus !== 'All' && t.status !== ticketStatus) return false;
    if (category !== 'All Categories' && t.category !== category) return false;
    if (search && !t.id.includes(search) && !t.awb.includes(search) && !t.seller.toLowerCase().includes(search.toLowerCase())) return false;
    if (dateFrom || dateTo) {
      const created = new Date(t.createdAt).getTime();
      if (dateFrom && created < new Date(dateFrom).getTime()) return false;
      if (dateTo && created > new Date(dateTo).getTime() + 24 * 60 * 60 * 1000 - 1) return false;
    }
    return true;
  });

  const hasActiveFilters = !!search || ticketStatus !== 'All' || category !== 'All Categories' || (dateFrom && dateTo && !(dateFrom === defStart && dateTo === defEnd));

  const handleApplyFilters = () => { /* client-side filtering is already live; kept for pattern parity */ };

  const handleClearAllFilters = () => {
    setSearch(''); setTicketStatus('All'); setCategory('All Categories');
    setDateFrom(defStart); setDateTo(defEnd);
  };

  const {
    page,
    setPage,
    totalPages,
    paginatedData: paginated,
    startIndex,
    endIndex,
    rowsPerPage,
    setRowsPerPage,
  } = usePagination({ data: filtered, perPage: 10 });

  const stats = [
    { label: 'Total', value: MOCK_TICKETS.length, icon: AlertCircle, color: 'text-[#0F172A]' },
    { label: 'Open', value: MOCK_TICKETS.filter(t => t.status === 'Open').length, icon: XCircle, color: 'text-red-500' },
    { label: 'In Progress', value: MOCK_TICKETS.filter(t => t.status === 'In Progress').length, icon: Clock, color: 'text-purple-500' },
    { label: 'SLA Breached', value: MOCK_TICKETS.filter(t => t.breached).length, icon: AlertCircle, color: 'text-amber-500' },
    { label: 'Resolved', value: MOCK_TICKETS.filter(t => t.status === 'Resolved').length, icon: CheckCircle2, color: 'text-green-500' },
    { label: 'Critical', value: MOCK_TICKETS.filter(t => t.priority === 'Critical').length, icon: AlertCircle, color: 'text-red-600' },
  ];

  return (
    <AdminLayout>
      <div className="flex flex-col h-[calc(100vh-72px)] -m-4 md:-m-6 bg-white overflow-hidden">
        <div className="shrink-0 px-6 pt-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-[#0F172A]">Escalations</h2>
                <span className="text-[10px] font-bold bg-[#00A86B]/10 text-[#00A86B] px-2 py-0.5 rounded-full">INTERNAL CRM</span>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">Internal escalation ticket management — track, assign, and resolve critical issues.</p>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#00A86B] text-white text-xs font-semibold hover:bg-[#009960] transition-colors self-start">
              <Plus className="w-3.5 h-3.5" /> Raise Escalation
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

          {/* Priority tabs */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {PRIORITIES.map(p => (
              <button key={p} onClick={() => setPriority(p)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${priority === p ? 'bg-[#00A86B] text-white' : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]'}`}>{p === 'All' ? 'All Priorities' : p}</button>
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
              <span className="text-xs text-[#64748B] ml-auto">{filtered.length} tickets</span>
            </div>
            <div className="filter-grid hidden md:grid grid-cols-3 gap-3">
              <div className="relative">
                <input type="text" placeholder="Search ticket, AWB, seller..." value={search} onChange={e => setSearch(e.target.value)} className="glass-search-input w-full" />
                <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute right-2.5 top-1/2 -translate-y-1/2" />
              </div>

              <GlassDropdown
                className="w-full [&_.glass-dropdown-trigger]:w-full"
                label="Status"
                options={TICKET_STATUSES.filter(o => o !== 'All').map(o => ({ label: o, value: o }))}
                selected={ticketStatus === 'All' ? [] : [ticketStatus]}
                onChange={(vals) => setTicketStatus(vals[0] || 'All')}
                placeholder="Search status..."
                icon={<CheckCircle2 className="w-3.5 h-3.5" />}
              />

              <GlassDropdown
                className="w-full [&_.glass-dropdown-trigger]:w-full"
                label="Category"
                options={CATEGORIES.filter(o => o !== 'All Categories').map(o => ({ label: o, value: o }))}
                selected={category === 'All Categories' ? [] : [category]}
                onChange={(vals) => setCategory(vals[0] || 'All Categories')}
                placeholder="Search category..."
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
                <span className="text-xs text-[#64748B] ml-auto shrink-0">{filtered.length} tickets</span>
              </div>
            </div>
          </div>

          <div className="hidden md:block flex-1 overflow-auto w-full relative">
            <table className="w-full text-left border-collapse min-w-[950px]">
              <thead className="sticky top-0 z-40 bg-[#E6F9F2] shadow-sm">
                <tr className="border-b border-[#E2E8F0] text-xs uppercase tracking-wider font-medium text-[#64748B]">
                  <th className="py-2 px-3 rounded-l-lg"><div className="flex items-center gap-1"><Hash className="w-3.5 h-3.5 shrink-0" /><span>Ticket ID</span></div></th>
                  <th className="py-2 px-3"><div className="flex items-center gap-1"><User className="w-3.5 h-3.5 shrink-0" /><span>Seller</span></div></th>
                  <th className="py-2 px-3"><div className="flex items-center gap-1"><Tag className="w-3.5 h-3.5 shrink-0" /><span>AWB</span></div></th>
                  <th className="py-2 px-3"><div className="flex items-center gap-1"><Truck className="w-3.5 h-3.5 shrink-0" /><span>Courier</span></div></th>
                  <th className="py-2 px-3"><div className="flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5 shrink-0" /><span>Category</span></div></th>
                  <th className="py-2 px-3"><div className="flex items-center gap-1"><Flame className="w-3.5 h-3.5 shrink-0" /><span>Priority</span></div></th>
                  <th className="py-2 px-3"><div className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /><span>Status</span></div></th>
                  <th className="py-2 px-3"><div className="flex items-center gap-1"><Timer className="w-3.5 h-3.5 shrink-0" /><span>SLA</span></div></th>
                  <th className="py-2 px-3"><div className="flex items-center gap-1"><UserCog className="w-3.5 h-3.5 shrink-0" /><span>Assigned To</span></div></th>
                  <th className="py-2 px-3"><div className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 shrink-0" /><span>Created</span></div></th>
                  <th className="py-2 px-3 rounded-r-lg"><div className="flex items-center gap-1"><History className="w-3.5 h-3.5 shrink-0" /><span>Last Updated</span></div></th>
                </tr>
              </thead>
              <tbody className="text-xs text-[#475569]">
                {paginated.length === 0 ? (
                  <tr><td colSpan={11} className="p-8 text-center text-[#64748B] font-medium">No escalations found</td></tr>
                ) : paginated.map((ticket, i) => (
                  <tr key={i} className={`border-b border-[#E2E8F0] transition-colors cursor-pointer ${ticket.breached && ticket.status !== 'Resolved' && ticket.status !== 'Closed' ? 'bg-red-50/30' : (i % 2 === 0 ? 'bg-white' : 'bg-[#E6EDF7]/20')}`}>
                    <td className="p-3 pl-4 font-bold text-[#0F172A] font-mono text-[11px]">{ticket.id}</td>
                    <td className="p-3 font-medium">{ticket.seller}</td>
                    <td className="p-3 font-mono text-[10px] text-[#00A86B]">{ticket.awb.slice(0, 14)}...</td>
                    <td className="p-3">{ticket.courier}</td>
                    <td className="p-3 text-[#64748B]">{ticket.category}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${PRIORITY_STYLES[ticket.priority]}`}>{ticket.priority}</span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_STYLES[ticket.status]}`}>{ticket.status}</span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        {ticket.breached && ticket.status !== 'Resolved' && ticket.status !== 'Closed' && <AlertCircle className="w-3 h-3 text-red-500" />}
                        <span className={`text-[11px] font-medium ${ticket.breached ? 'text-red-500' : 'text-[#64748B]'}`}>{ticket.slaHours}h SLA</span>
                      </div>
                    </td>
                    <td className="p-3 text-[#64748B]">{ticket.assignedTo}</td>
                    <td className="p-3 table-date">{ticket.createdAt}</td>
                    <td className="p-3 table-date">{ticket.updatedAt}</td>
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
            {paginated.length === 0 ? (
              <EmptyState title="No escalations found" subtitle="Try changing filters" />
            ) : (
              <div className="p-2 space-y-2">
                {paginated.map((ticket, i) => {
                  const accent = PRIORITY_RIBBON[ticket.priority] || '#00A86B';
                  const isBreached = ticket.breached && ticket.status !== 'Resolved' && ticket.status !== 'Closed';
                  return (
                    <div key={i} className={`relative bg-white rounded-2xl border shadow-sm ${isBreached ? 'border-red-200' : 'border-[#E2E8F0]'}`}>
                      <StatusRibbon label={ticket.priority} color={accent} />
                      {/* Ticket ID — parallel to the ribbon, matching Orders page layout */}
                      <div className="flex justify-end pl-[84px] pr-4 pt-1.5">
                        <span className="text-[12.5px] font-bold text-[#1D4ED8] truncate max-w-[140px] font-mono">{ticket.id}</span>
                      </div>
                      <div className="pt-1.5 px-4 pb-4">
                        <div className="flex items-center justify-end mb-3 gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_STYLES[ticket.status]}`}>{ticket.status}</span>
                        </div>

                        <div className="rounded-xl p-3 mb-3 bg-white" style={{ border: `1px solid ${accent}` }}>
                          <div className="text-[14px] leading-[20px] font-semibold text-[#1E293B]">{ticket.seller}</div>
                          <div className="text-[12px] leading-[18px] font-normal text-[#64748B]">{ticket.category}</div>
                          <div className="text-[11px] text-[#94A3B8] font-mono mt-0.5">{ticket.awb}</div>
                        </div>

                        <div className="flex items-start justify-between mb-3 px-1 gap-2">
                          <span className="text-[12px] font-medium text-[#0F172A] flex-1 flex items-center gap-1"><Truck className="w-3 h-3" />{ticket.courier}</span>
                          <span className={`text-[11px] font-medium shrink-0 flex items-center gap-1 ${ticket.breached ? 'text-red-500' : 'text-[#64748B]'}`}>
                            {isBreached && <AlertCircle className="w-3 h-3" />}{ticket.slaHours}h SLA
                          </span>
                        </div>

                        <div className="flex items-start justify-between bg-[#F8FAFC] rounded-xl px-3 py-2.5 mb-3 gap-2">
                          <div className="min-w-0">
                            <div className="text-[10px] font-normal text-[#94A3B8] uppercase tracking-wider">Assigned To</div>
                            <div className="text-[12px] font-medium text-[#0F172A] mt-0.5">{ticket.assignedTo}</div>
                          </div>
                          <div className="text-right min-w-0">
                            <div className="text-[10px] font-normal text-[#94A3B8] uppercase tracking-wider">Created / Updated</div>
                            <div className="text-[12px] font-medium text-[#0F172A] mt-0.5">{ticket.createdAt} / {ticket.updatedAt}</div>
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
                  <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search ticket, AWB, seller..."
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B]" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
                  <select value={ticketStatus} onChange={(e) => setTicketStatus(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B] bg-white">
                    {TICKET_STATUSES.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B] bg-white">
                    {CATEGORIES.map(o => <option key={o} value={o}>{o}</option>)}
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
