import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { useAdminTab } from '../../context/AdminUserContext';
import { usePagination, DesktopPagination } from '../../hooks/usePagination';
import {
  Search, RefreshCcw, User, Package, FileText, Calendar, X,
  MessageSquare, CheckCircle2, Tag, ArrowUpDown, Send, Plus
} from 'lucide-react';
import { GlassDropdown } from '../../components/ui/GlassDropdown';
import { GlassDateFilter } from '../../components/ui/GlassDateFilter';
import { useDateRangeFilter } from '../../hooks/filters/useDateRangeFilter';
import { EmptyState } from '../../components/ui/EmptyState';
import { apiClient } from '../../services/apiClient';
import {
  getAllTickets, getUserTickets, viewTicket, replyToTicket, closeTicket, createTicket,
  type Ticket
} from '../../services/api/supportService';

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, string> = {
  new:                'bg-slate-50 text-slate-700 border-slate-200',
  open:               'bg-blue-50 text-blue-700 border-blue-200',
  awaiting_response:  'bg-amber-50 text-amber-700 border-amber-200',
  closed:             'bg-slate-100 text-slate-500 border-slate-200',
  active:             'bg-blue-50 text-blue-700 border-blue-200',
  resolved:           'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const STATUS_LABEL: Record<string, string> = {
  new:               'New',
  open:              'Open',
  awaiting_response: 'Awaiting Response',
  closed:            'Closed',
  active:            'Active',
  resolved:          'Resolved',
};

function statusTab(s: string): string {
  switch (s) {
    case 'new':               return 'New';
    case 'open':
    case 'active':            return 'Open';
    case 'awaiting_response': return 'Awaiting Response';
    case 'closed':
    case 'resolved':          return 'Closed';
    default:                  return 'All';
  }
}

function formatDate(iso: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' | ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDateShort(iso: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function timeAgo(iso: string) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

// ─── Categories & subcategories (matches old frontend) ───────────────────────

const CATEGORIES = [
  'Shipment Dispute', 'Finance', 'Pickup & Delivery', 'Shipment NDR & RTO',
  'KYC & Bank Verification', 'Technical Support', 'Billing & Taxation', 'Claims', 'Others',
];

const SUBCATEGORIES: Record<string, string[]> = {
  'Shipment Dispute': ['Issue Over Weight Discrepancy', 'Issues with Delivered Shipment', 'Status Mismatch Issues', 'Delivered Not Received', 'Wrong/Damaged/Partial/Empty Package Delivered'],
  'Finance': ['Delay in COD Remittance', 'Request to Hold COD Remittance', 'Transfer Wallet Amount into My Bank Account', 'Issue in Recharging Wallet', 'Request to Revise shipping charges', 'Wallet Showing Negative Balance'],
  'Pickup & Delivery': ['Delay in Forward Delivery', 'Delay in RTO Delivery', 'Delay in Pickup', 'Shipment Showing as Lost/Damaged in Tracking', 'Shipment picked up but status is incorrect'],
  'Shipment NDR & RTO': ['Issue Over Undelivered Shipment', 'Request to Mark Shipment as RTO'],
  'KYC & Bank Verification': ['Issues with KYC Verification', 'Request to Unfreeze KYC', 'Request to Unfreeze Bank Details'],
  'Technical Support': ['Issues with Channel & API Integration', 'Request to Managing Orders', 'Order/Shipment Cancellation'],
  'Billing & Taxation': ['Account Ledger Statement Needed', 'TDS Form Required for Tax Return', 'Issue with Invoice', 'Need Help with GST'],
  'Claims': ['Issues with Lost/Damaged/Wrong delivery etc claim amount', 'Credit Note Details Required'],
  'Others': ['Issues with WhatsApp Communication', 'Issues with Tracking page', 'Issues with COD Remmitance terms', 'My Issue is Not Listed', 'Enable/Disable Click to Call Service'],
};

// ─── Create Ticket Modal ──────────────────────────────────────────────────────

interface CreateTicketModalProps {
  onClose: () => void;
  onCreated: (ticket: Ticket) => void;
}

function CreateTicketModal({ onClose, onCreated }: CreateTicketModalProps) {
  const [category, setCategory]       = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [awbNumbers, setAwbNumbers]   = useState('');
  const [message, setMessage]         = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState('');
  const [awbWarning, setAwbWarning]   = useState('');
  const [awbValidating, setAwbValidating] = useState(false);

  // Auto-fetched from token — not shown to user
  const [userInfo, setUserInfo] = useState<{
    fullname: string; phoneNumber: string; email: string; company: string; userId: string;
  } | null>(null);

  useEffect(() => {
    apiClient.get('/user/getUserDetails')
      .then(res => {
        const u = res.data.user;
        setUserInfo({
          fullname:    u.fullname    || '',
          phoneNumber: u.phoneNumber || '',
          email:       u.email       || '',
          company:     u.company     || '',
          userId:      u._id         || '',
        });
      })
      .catch(() => {});
  }, []);

  const validateAwbs = async (rawInput: string) => {
    const awbs = rawInput.split(',').map(s => s.trim()).filter(Boolean);
    if (awbs.length === 0 || !userInfo?.userId) { setAwbWarning(''); return; }
    setAwbValidating(true);
    const invalid: string[] = [];
    for (const awb of awbs) {
      try {
        const { data } = await apiClient.get(`/order/GetTrackingByAwb/${awb}`);
        const orderId = data.userId?._id ?? data.userId;
        if (orderId && String(orderId) !== String(userInfo.userId)) invalid.push(awb);
      } catch (err: any) {
        if (err?.response?.status === 404) invalid.push(awb);
      }
    }
    setAwbValidating(false);
    if (invalid.length > 0) {
      setAwbWarning(`AWB(s) not found or not linked to your account: ${invalid.join(', ')}`);
    } else {
      setAwbWarning('');
    }
  };

  const subcategoryOptions = category ? (SUBCATEGORIES[category] || []) : [];

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!category || !subcategory || !message) {
      setError('Category, subcategory and message are required.');
      return;
    }
    if (!userInfo) {
      setError('Could not load your account details. Please try again.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const ticket = await createTicket({ ...userInfo, category, subcategory, awbNumbers, message });
      onCreated(ticket);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto z-10">
        <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <h2 className="text-base font-bold text-[#0F172A]">Create Support Ticket</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-[#F8FAFC]"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <p className="text-[11px] text-red-500 font-semibold bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          {/* Category */}
          <div>
            <label className="block text-[11px] font-bold text-[#475569] mb-1">Category *</label>
            <select value={category} onChange={e => { setCategory(e.target.value); setSubcategory(''); }} className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs focus:outline-none focus:border-[#00A86B] bg-white">
              <option value="">Select category</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Subcategory */}
          <div>
            <label className="block text-[11px] font-bold text-[#475569] mb-1">Subcategory *</label>
            <select value={subcategory} onChange={e => setSubcategory(e.target.value)} disabled={!category} className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs focus:outline-none focus:border-[#00A86B] bg-white disabled:bg-slate-50 disabled:text-slate-400">
              <option value="">Select subcategory</option>
              {subcategoryOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* AWB */}
          <div>
            <label className="block text-[11px] font-bold text-[#475569] mb-1">
              AWB Number(s) <span className="font-normal text-slate-400">(optional, comma-separated)</span>
            </label>
            <input
              value={awbNumbers}
              onChange={e => { setAwbNumbers(e.target.value); setAwbWarning(''); }}
              onBlur={e => { if (e.target.value.trim()) validateAwbs(e.target.value); }}
              placeholder="AWB123, AWB456"
              className={`w-full h-9 px-3 rounded-lg border text-xs focus:outline-none focus:border-[#00A86B] ${awbWarning ? 'border-amber-400 bg-amber-50' : 'border-[#E2E8F0]'}`}
            />
            {awbValidating && (
              <p className="text-[10px] text-[#64748B] mt-1">Validating AWB(s)…</p>
            )}
            {awbWarning && !awbValidating && (
              <p className="text-[10px] text-amber-600 font-semibold mt-1 flex items-center gap-1">
                <span>⚠</span> {awbWarning}
              </p>
            )}
          </div>

          {/* Message */}
          <div>
            <label className="block text-[11px] font-bold text-[#475569] mb-1">Message *</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Describe the issue in detail..." rows={4} className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-xs focus:outline-none focus:border-[#00A86B] resize-none" />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 h-9 rounded-full border border-[#E2E8F0] text-[#475569] text-xs font-semibold hover:bg-[#F8FAFC]">Cancel</button>
            <button type="submit" disabled={submitting || !userInfo} className="flex-1 h-9 rounded-full bg-[#00A86B] text-white text-xs font-bold hover:bg-[#009B63] disabled:opacity-50">
              {submitting ? 'Creating...' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const TABS = ['New', 'Open', 'Awaiting Response', 'Closed', 'All'] as const;

export function AdminSupport() {
  const { isAdmin, adminTab } = useAdminTab();
  const isAdminView = isAdmin && adminTab;

  const [activeTab, setActiveTab]       = useState<string>('New');
  const [tickets, setTickets]           = useState<Ticket[]>([]);
  const [loading, setLoading]           = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Drawer state
  const [replyText, setReplyText]       = useState('');
  const [replying, setReplying]         = useState(false);
  const [closing, setClosing]           = useState(false);

  // Filters
  const [searchTerm, setSearchTerm]     = useState('');
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses]           = useState<string[]>([]);
  const { dateStart, dateEnd, onDateChange }              = useDateRangeFilter();
  const [selectedSort, setSelectedSort] = useState<string[]>(['Most Recently Created']);
  const [globalSearchQuery, setGlobalSearchQuery] = useState(
    ((window as any).__adminSearchQuery || '').toLowerCase()
  );

  // Global admin search event
  useEffect(() => {
    const handler = (e: Event) => setGlobalSearchQuery(((e as CustomEvent).detail || '').toLowerCase());
    window.addEventListener('admin-search', handler);
    return () => window.removeEventListener('admin-search', handler);
  }, []);

  // Fetch tickets — all tickets for admin, own tickets for user
  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const data = isAdminView ? await getAllTickets() : await getUserTickets();
      setTickets(data);
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [isAdminView]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  // Tab counts
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { New: 0, Open: 0, 'Awaiting Response': 0, Closed: 0, All: 0 };
    tickets.forEach(t => {
      const tab = statusTab(t.status);
      if (counts[tab] !== undefined) counts[tab]++;
      counts.All++;
    });
    return counts;
  }, [tickets]);

  // Filtered + sorted tickets
  const filteredTickets = useMemo(() => {
    let result = tickets.filter(ticket => {
      // Tab filter
      if (activeTab !== 'All' && statusTab(ticket.status) !== activeTab) return false;

      // Local search (ticket number, AWB, name, email)
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const match =
          ticket.ticketNumber.toLowerCase().includes(q) ||
          ticket.awbNumbers.some(a => a.toLowerCase().includes(q)) ||
          ticket.fullname.toLowerCase().includes(q) ||
          ticket.email.toLowerCase().includes(q);
        if (!match) return false;
      }

      // Global search
      if (globalSearchQuery) {
        const q = globalSearchQuery;
        const match =
          ticket.ticketNumber.toLowerCase().includes(q) ||
          ticket.awbNumbers.some(a => a.toLowerCase().includes(q)) ||
          ticket.fullname.toLowerCase().includes(q) ||
          ticket.email.toLowerCase().includes(q) ||
          ticket.category.toLowerCase().includes(q) ||
          ticket.subcategory.toLowerCase().includes(q) ||
          ticket.message.toLowerCase().includes(q);
        if (!match) return false;
      }

      // Subcategory dropdown
      if (selectedSubcategories.length > 0 && !selectedSubcategories.includes(ticket.subcategory)) return false;

      // Status dropdown
      if (selectedStatuses.length > 0 && !selectedStatuses.some(s => s.toLowerCase() === ticket.status.toLowerCase())) return false;

      // Date range
      if (dateStart && ticket.createdAt.slice(0, 10) < dateStart) return false;
      if (dateEnd   && ticket.createdAt.slice(0, 10) > dateEnd)   return false;

      return true;
    });

    // Sort
    const sortVal = selectedSort[0] || 'Most Recently Created';
    if (sortVal === 'Oldest First') {
      result.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    } else if (sortVal === 'Last Updated') {
      result.sort((a, b) => {
        const aDate = a.lastRepliedAt || a.createdAt;
        const bDate = b.lastRepliedAt || b.createdAt;
        return bDate.localeCompare(aDate);
      });
    } else {
      result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }

    return result;
  }, [tickets, activeTab, searchTerm, globalSearchQuery, selectedSubcategories, selectedStatuses, dateStart, dateEnd, selectedSort]);

  const {
    page: currentPage,
    setPage: setCurrentPage,
    totalPages,
    paginatedData: paginatedTickets,
    startIndex,
    endIndex,
    rowsPerPage,
    setRowsPerPage,
  } = usePagination({ data: filteredTickets, perPage: 10 });

  // Open ticket in drawer — only admin viewing transitions new → open
  const handleViewTicket = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setReplyText('');
    if (isAdminView && (ticket.status === 'new' || ticket.status === 'active')) {
      try {
        const updated = await viewTicket(ticket._id);
        setTickets(prev => prev.map(t => t._id === updated._id ? updated : t));
        setSelectedTicket(updated);
      } catch { /* non-fatal */ }
    }
  };

  // Send reply — admin replies as 'admin', user replies as 'user'
  const handleReply = async () => {
    if (!selectedTicket || !replyText.trim()) return;
    setReplying(true);
    try {
      const role = isAdminView ? 'admin' : 'user';
      const name = isAdminView ? 'Support Team' : selectedTicket.fullname;
      const updated = await replyToTicket(selectedTicket._id, replyText.trim(), role, name);
      setTickets(prev => prev.map(t => t._id === updated._id ? updated : t));
      setSelectedTicket(updated);
      setReplyText('');
    } catch { /* silent */ }
    setReplying(false);
  };

  // Close ticket
  const handleClose = async () => {
    if (!selectedTicket) return;
    setClosing(true);
    try {
      const updated = await closeTicket(selectedTicket._id);
      setTickets(prev => prev.map(t => t._id === updated._id ? updated : t));
      setSelectedTicket(updated);
    } catch { /* silent */ }
    setClosing(false);
  };

  // Build subcategory filter options from real data
  const subcategoryOptions = useMemo(() => {
    const unique = Array.from(new Set(tickets.map(t => t.subcategory)));
    return unique.map(s => ({ label: s, value: s }));
  }, [tickets]);

  const STATUS_OPTIONS = [
    { label: 'New', value: 'new' },
    { label: 'Open', value: 'open' },
    { label: 'Awaiting Response', value: 'awaiting_response' },
    { label: 'Closed', value: 'closed' },
    { label: 'Resolved', value: 'resolved' },
  ];

  const SORT_OPTIONS = [
    { label: 'Most Recently Created', value: 'Most Recently Created' },
    { label: 'Oldest First',          value: 'Oldest First' },
    { label: 'Last Updated',          value: 'Last Updated' },
  ];

  return (
    <AdminLayout>
      <div className="flex flex-col h-[calc(100vh-72px)] -m-4 md:-m-6 bg-white">
        <div className="bg-white relative z-50 shrink-0">

          {/* ── Tabs ── */}
          <div className="flex justify-between items-center px-6 py-2 border-b border-[#E2E8F0] bg-white">
            <div className="flex gap-1 items-center bg-[#F7FEFC] rounded-full p-1.5 shrink-0 overflow-x-auto">
              {TABS.map(s => (
                <button
                  key={s}
                  onClick={() => { setActiveTab(s); setCurrentPage(1); }}
                  className={`px-4 py-2 text-[13px] font-bold rounded-full transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${activeTab === s ? 'text-[#00A86B] underline underline-offset-4 decoration-2' : 'text-[#64748B] hover:text-[#0F172A]'}`}
                >
                  {s}
                  {tabCounts[s] > 0 && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${activeTab === s ? 'bg-[#00A86B]/10 text-[#00A86B]' : 'bg-slate-100 text-slate-500'}`}>
                      {tabCounts[s]}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 shrink-0 ml-4">
              <button
                onClick={fetchTickets}
                className={`w-8 h-8 rounded-full border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-[#F8FAFC] ${loading ? 'animate-spin' : ''}`}
              >
                <RefreshCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── Filter Row ── */}
          <div className="py-3 px-6 border-b border-[#CBD5F5] flex flex-wrap justify-between items-center gap-3 bg-[#F8FAFC]/50">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative shrink-0">
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="glass-search-input w-[180px]"
                  style={{ paddingLeft: '2rem' }}
                />
                <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <GlassDropdown
                label="Subcategory"
                options={subcategoryOptions}
                selected={selectedSubcategories}
                onChange={setSelectedSubcategories}
                placeholder="Search category..."
                icon={<Tag className="w-3.5 h-3.5" />}
              />

              <GlassDropdown
                label="Status"
                options={STATUS_OPTIONS}
                selected={selectedStatuses}
                onChange={setSelectedStatuses}
                placeholder="Search status..."
                icon={<CheckCircle2 className="w-3.5 h-3.5" />}
              />

              <GlassDateFilter
                align="right"
                startDate={dateStart}
                endDate={dateEnd}
                onDateChange={onDateChange}
              />

              <GlassDropdown
                label="Sort By"
                options={SORT_OPTIONS}
                selected={selectedSort}
                onChange={setSelectedSort}
                placeholder="Sort by..."
                icon={<ArrowUpDown className="w-3.5 h-3.5" />}
              />
            </div>

            {!isAdminView && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="h-9 px-5 rounded-full bg-[#00A86B] text-white text-[11px] font-bold hover:bg-[#009B63] transition-colors shadow-sm whitespace-nowrap flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Create Ticket
              </button>
            )}
          </div>
        </div>

        {/* ── Table ── */}
        <div className="bg-white flex flex-col flex-1 min-h-0 overflow-hidden border-t border-[#E2E8F0]">
          <div className="flex-1 overflow-y-auto overflow-x-hidden w-full relative">
            {loading ? (
              <div className="flex items-center justify-center h-40 text-[#64748B] text-sm">Loading tickets…</div>
            ) : (
              <table className="w-full text-left border-collapse min-w-full">
                <thead>
                  <tr className="bg-[#E6F9F2] text-xs font-medium text-[#64748B] uppercase tracking-wider">
                    <th className="py-2 px-3 rounded-l-lg"><User className="w-3.5 h-3.5 inline mr-1" />Ticket ID</th>
                    <th className="py-2 px-3"><FileText className="w-3.5 h-3.5 inline mr-1" />Raised By</th>
                    <th className="py-2 px-3"><Package className="w-3.5 h-3.5 inline mr-1" />AWB(s)</th>
                    <th className="py-2 px-3"><Tag className="w-3.5 h-3.5 inline mr-1" />Category</th>
                    <th className="py-2 px-3"><CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />Status</th>
                    <th className="py-2 px-3"><MessageSquare className="w-3.5 h-3.5 inline mr-1" />Messages</th>
                    <th className="py-2 px-3"><Calendar className="w-3.5 h-3.5 inline mr-1" />Created</th>
                    <th className="py-2 px-3 text-right rounded-r-lg">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-[11px] text-[#475569]">
                  {paginatedTickets.length > 0 ? (
                    paginatedTickets.map((ticket, i) => (
                      <tr
                        key={ticket._id}
                        className={`border-b border-[#E2E8F0] transition-colors group ${i % 2 === 0 ? 'bg-white' : 'bg-[#E6EDF7]/20'}`}
                      >
                        <td className="p-4 align-top">
                          <div className="text-xs font-bold text-[#00A86B] mb-0.5">#{ticket.ticketNumber}</div>
                          <div className="text-[10px] text-[#94A3B8]">{formatDate(ticket.createdAt)}</div>
                        </td>
                        <td className="p-4 align-top">
                          <div className="text-xs font-semibold text-[#0F172A]">{ticket.fullname}</div>
                          <div className="text-[10px] text-[#94A3B8]">{ticket.email}</div>
                        </td>
                        <td className="p-4 align-top text-xs font-semibold text-[#0F172A]">
                          {ticket.awbNumbers.length > 0 ? ticket.awbNumbers.slice(0, 2).join(', ') + (ticket.awbNumbers.length > 2 ? ` +${ticket.awbNumbers.length - 2}` : '') : '—'}
                        </td>
                        <td className="p-4 align-top">
                          <div className="font-semibold text-[#0F172A] text-[11px]">{ticket.category}</div>
                          <div className="text-[10px] text-[#94A3B8]">{ticket.subcategory}</div>
                        </td>
                        <td className="p-4 align-top">
                          <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap shadow-sm ${STATUS_BADGE[ticket.status] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                            {STATUS_LABEL[ticket.status] || ticket.status}
                          </span>
                        </td>
                        <td className="p-4 align-top">
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-[#64748B]">
                            <MessageSquare className="w-3 h-3" />
                            {ticket.messages.length + 1}
                          </span>
                          {ticket.lastRepliedAt && (
                            <div className="text-[10px] text-[#94A3B8] mt-0.5">{timeAgo(ticket.lastRepliedAt)}</div>
                          )}
                        </td>
                        <td className="p-4 align-top text-[10px] text-[#94A3B8]">{formatDateShort(ticket.createdAt)}</td>
                        <td className="p-4 align-top text-right pr-6">
                          <button
                            onClick={() => handleViewTicket(ticket)}
                            className="px-4 py-1.5 rounded-full bg-[#1e3a8a] text-white font-bold text-[10px] hover:bg-[#1e40af] transition-colors shadow-sm"
                          >
                            {ticket.status === 'new' ? 'Open' : 'View'}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8}>
                        <EmptyState title="No tickets found" />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {totalPages > 0 && (
            <DesktopPagination
              page={currentPage}
              setPage={setCurrentPage}
              totalPages={totalPages}
              rowsPerPage={rowsPerPage}
              setRowsPerPage={setRowsPerPage}
              startIndex={startIndex}
              endIndex={endIndex}
              totalItems={filteredTickets.length}
            />
          )}
        </div>
      </div>

      {/* ── Ticket Detail Drawer ── */}
      {selectedTicket && (
        <div className="fixed inset-0 z-[110] flex">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSelectedTicket(null)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
            {/* Drawer header */}
            <div className="sticky top-0 bg-white z-10 p-6 border-b border-[#E2E8F0] flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-bold text-[#0F172A]">#{selectedTicket.ticketNumber}</h3>
                  <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${STATUS_BADGE[selectedTicket.status] || ''}`}>
                    {STATUS_LABEL[selectedTicket.status] || selectedTicket.status}
                  </span>
                </div>
                <p className="text-[11px] text-[#64748B]">Raised by {selectedTicket.fullname} · {formatDate(selectedTicket.createdAt)}</p>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="w-8 h-8 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-[#F8FAFC]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Ticket meta */}
              <div className="bg-[#F8FAFC] rounded-xl p-4 space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-[#64748B]">Category</span><span className="font-semibold text-[#0F172A]">{selectedTicket.category}</span></div>
                <div className="flex justify-between"><span className="text-[#64748B]">Subcategory</span><span className="font-semibold text-[#0F172A] text-right max-w-[60%]">{selectedTicket.subcategory}</span></div>
                <div className="flex justify-between"><span className="text-[#64748B]">Email</span><span className="font-semibold text-[#0F172A]">{selectedTicket.email}</span></div>
                <div className="flex justify-between"><span className="text-[#64748B]">Phone</span><span className="font-semibold text-[#0F172A]">{selectedTicket.phoneNumber}</span></div>
                <div className="flex justify-between"><span className="text-[#64748B]">Company</span><span className="font-semibold text-[#0F172A]">{selectedTicket.company}</span></div>
                {selectedTicket.awbNumbers.length > 0 && (
                  <div className="flex justify-between"><span className="text-[#64748B]">AWB(s)</span><span className="font-semibold text-[#0F172A]">{selectedTicket.awbNumbers.join(', ')}</span></div>
                )}
              </div>

              {/* Conversation */}
              <div>
                <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wide mb-3">Conversation</h4>
                <div className="space-y-3">
                  {/* Initial message (user) */}
                  <div className="bg-blue-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-3 h-3 text-blue-500" />
                      <span className="text-[10px] font-bold text-blue-600">{selectedTicket.fullname}</span>
                      <span className="text-[9px] text-[#94A3B8]">{formatDate(selectedTicket.createdAt)}</span>
                    </div>
                    <p className="text-xs text-[#475569] whitespace-pre-wrap">{selectedTicket.message}</p>
                  </div>

                  {/* Reply messages */}
                  {selectedTicket.messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`rounded-xl p-4 ${msg.sender === 'admin' ? 'bg-green-50' : 'bg-blue-50'}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <User className={`w-3 h-3 ${msg.sender === 'admin' ? 'text-green-500' : 'text-blue-500'}`} />
                        <span className={`text-[10px] font-bold ${msg.sender === 'admin' ? 'text-green-600' : 'text-blue-600'}`}>
                          {msg.senderName}
                        </span>
                        <span className="text-[9px] text-[#94A3B8]">{timeAgo(msg.sentAt)}</span>
                      </div>
                      <p className="text-xs text-[#475569] whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reply box — hidden if closed */}
              {selectedTicket.status !== 'closed' && selectedTicket.status !== 'resolved' && (
                <div>
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    className="w-full h-24 p-3 rounded-xl border border-[#E2E8F0] text-xs focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20 focus:border-[#00A86B] resize-none"
                    placeholder="Type your reply..."
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={handleReply}
                      disabled={replying || !replyText.trim()}
                      className="h-9 px-4 rounded-lg bg-[#00A86B] text-white text-xs font-semibold hover:bg-[#009B63] disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Send className="w-3 h-3" />
                      {replying ? 'Sending…' : 'Send Reply'}
                    </button>
                    {isAdminView && (
                      <button
                        onClick={handleClose}
                        disabled={closing}
                        className="h-9 px-4 rounded-lg border border-[#E2E8F0] text-[#475569] text-xs font-semibold hover:bg-[#F8FAFC] disabled:opacity-50"
                      >
                        {closing ? 'Closing…' : 'Mark Closed'}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {(selectedTicket.status === 'closed' || selectedTicket.status === 'resolved') && (
                <div className="text-center py-3 text-[11px] font-semibold text-slate-400 bg-slate-50 rounded-xl">
                  This ticket is closed.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Create Ticket Modal ── */}
      {showCreateModal && (
        <CreateTicketModal
          onClose={() => setShowCreateModal(false)}
          onCreated={ticket => setTickets(prev => [ticket, ...prev])}
        />
      )}
    </AdminLayout>
  );
}
