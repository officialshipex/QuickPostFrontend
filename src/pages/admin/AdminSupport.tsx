import React, { useState, useEffect, useMemo } from 'react';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { usePagination } from '../../hooks/usePagination';
import { 
  Search, RefreshCcw, User, Package, FileText, Calendar, MoreHorizontal, X, MessageSquare, ChevronDown, CheckCircle2, Tag, ArrowUpDown
} from 'lucide-react';
import { GlassDropdown } from '../../components/ui/GlassDropdown';
import { GlassDateFilter } from '../../components/ui/GlassDateFilter';

const MOCK_TICKETS = [
  {
    id: '876543210',
    date: '10th Apr 2026 | 11:15 AM',
    dateStr: '2026-04-10',
    awb: 'AWB98765432',
    subcategory: 'Issues with KYC Verification',
    status: 'OPEN',
    resDue: '12th Apr 2026\n11:15 AM',
    lastUpdated: '10th Apr 2026\n11:15 AM',
    subject: 'KYC Document Rejected repeatedly',
    customer: 'Dinesh Tharwani',
    type: 'Seller',
    priority: 'High',
    assignee: 'Agent Ramesh',
    created: '10th Apr 2026',
    lastReply: '2 hrs ago',
    messages: 3,
  },
  {
    id: '876543211',
    date: '12th Apr 2026 | 02:30 PM',
    dateStr: '2026-04-12',
    awb: 'AWB77362911',
    subcategory: 'Shipment Delay',
    status: 'In Progress',
    resDue: '14th Apr 2026\n02:30 PM',
    lastUpdated: '12th Apr 2026\n03:45 PM',
    subject: 'Shipment delayed for AWB77362911',
    customer: 'Amit Sharma',
    type: 'Seller',
    priority: 'Critical',
    assignee: 'Agent Priya',
    created: '12th Apr 2026',
    lastReply: '1 day ago',
    messages: 5,
  },
  {
    id: '876543212',
    date: '13th Apr 2026 | 09:00 AM',
    dateStr: '2026-04-13',
    awb: 'N/A',
    subcategory: 'Payment Issue',
    status: 'NEW',
    resDue: '15th Apr 2026\n09:00 AM',
    lastUpdated: '13th Apr 2026\n09:00 AM',
    subject: 'Double charge on COD payment',
    customer: 'Pooja Patel',
    type: 'Seller',
    priority: 'Medium',
    assignee: 'Agent Sunita',
    created: '13th Apr 2026',
    lastReply: 'Just now',
    messages: 1,
  },
  {
    id: '876543213',
    date: '14th Apr 2026 | 04:34 PM',
    dateStr: '2026-04-14',
    awb: 'AWB88472911',
    subcategory: 'Issues with KYC Verification',
    status: 'Awaiting Reply',
    resDue: '16th Apr 2026\n04:34 PM',
    lastUpdated: '14th Apr 2026\n05:00 PM',
    subject: 'Pan card details verification pending',
    customer: 'Dinesh Tharwani',
    type: 'Seller',
    priority: 'Low',
    assignee: 'Agent Ramesh',
    created: '14th Apr 2026',
    lastReply: '3 hrs ago',
    messages: 2,
  },
  {
    id: '876543214',
    date: '15th Apr 2026 | 05:45 PM',
    dateStr: '2026-04-15',
    awb: 'AWB11029388',
    subcategory: 'Shipment Delay',
    status: 'Resolved',
    resDue: '17th Apr 2026\n05:45 PM',
    lastUpdated: '16th Apr 2026\n10:00 AM',
    subject: 'Lost shipment resolution',
    customer: 'Rahul Verma',
    type: 'Buyer',
    priority: 'High',
    assignee: 'Agent Priya',
    created: '15th Apr 2026',
    lastReply: '2 days ago',
    messages: 8,
  },
  {
    id: '876543215',
    date: '20th Jun 2026 | 10:20 AM',
    dateStr: '2026-06-20',
    awb: 'N/A',
    subcategory: 'Payment Issue',
    status: 'Escalated',
    resDue: '22nd Jun 2026\n10:20 AM',
    lastUpdated: '20th Jun 2026\n11:30 AM',
    subject: 'Refund request status check',
    customer: 'Siddharth Jain',
    type: 'Seller',
    priority: 'Critical',
    assignee: 'Agent Sunita',
    created: '20th Jun 2026',
    lastReply: '4 hrs ago',
    messages: 4,
  },
  {
    id: '876543216',
    date: '21st Jun 2026 | 08:15 AM',
    dateStr: '2026-06-21',
    awb: 'AWB44928112',
    subcategory: 'Issues with KYC Verification',
    status: 'Closed',
    resDue: '23rd Jun 2026\n08:15 AM',
    lastUpdated: '21st Jun 2026\n02:00 PM',
    subject: 'GST details mismatch error',
    customer: 'Amit Sharma',
    type: 'Seller',
    priority: 'Medium',
    assignee: 'Agent Ramesh',
    created: '21st Jun 2026',
    lastReply: '5 hrs ago',
    messages: 2,
  }
];

const PRIORITY_COLORS: Record<string, string> = {
  'Critical': 'bg-red-100 text-red-700',
  'High': 'bg-orange-50 text-orange-600',
  'Medium': 'bg-amber-50 text-amber-600',
  'Low': 'bg-gray-100 text-gray-500',
};
const STATUS_COLORS: Record<string, string> = {
  'OPEN': 'bg-green-50 text-green-600',
  'Open': 'bg-blue-50 text-blue-600',
  'In Progress': 'bg-purple-50 text-purple-600',
  'Awaiting Reply': 'bg-amber-50 text-amber-600',
  'Resolved': 'bg-green-50 text-green-600',
  'Escalated': 'bg-red-50 text-red-600',
  'NEW': 'bg-blue-50 text-[#00A86B]',
  'New': 'bg-blue-50 text-[#00A86B]',
  'CLOSED': 'bg-gray-100 text-gray-600',
  'Closed': 'bg-gray-100 text-gray-600',
};

const STATUS_BADGE_CLASSES: Record<string, string> = {
  'NEW': 'bg-slate-50 text-slate-700 border-slate-200',
  'OPEN': 'bg-blue-50 text-blue-700 border-blue-200',
  'IN PROGRESS': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'AWAITING REPLY': 'bg-amber-50 text-amber-700 border-amber-200',
  'RESOLVED': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'ESCALATED': 'bg-rose-50 text-rose-700 border-rose-200',
  'CLOSED': 'bg-slate-100 text-slate-500 border-slate-200',
};

const PRIORITY_ORDER: Record<string, number> = {
  'Critical': 4,
  'High': 3,
  'Medium': 2,
  'Low': 1,
};

export function AdminSupport() {
  const [activeTab, setActiveTab] = useState('New');
  const [selectedTicket, setSelectedTicket] = useState<typeof MOCK_TICKETS[0] | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [selectedSort, setSelectedSort] = useState<string[]>(['Most Recently Created']);
  const [globalSearchQuery, setGlobalSearchQuery] = useState((window as any).__adminSearchQuery?.toLowerCase() || '');

  useEffect(() => {
    const handleSearch = (e: Event) => {
      setGlobalSearchQuery(((e as CustomEvent).detail || '').toLowerCase());
    };
    window.addEventListener('admin-search', handleSearch);
    setGlobalSearchQuery(((window as any).__adminSearchQuery || '').toLowerCase());
    return () => {
      window.removeEventListener('admin-search', handleSearch);
    };
  }, []);

  const filteredTickets = useMemo(() => {
    let result = MOCK_TICKETS.filter(ticket => {
      // 1. Tab filtering
      const statusUpper = ticket.status.toUpperCase();
      if (activeTab === 'New') {
        if (statusUpper !== 'NEW') return false;
      } else if (activeTab === 'Open') {
        if (statusUpper !== 'OPEN' && statusUpper !== 'IN PROGRESS' && statusUpper !== 'ESCALATED') return false;
      } else if (activeTab === 'Awaiting Response') {
        if (statusUpper !== 'AWAITING REPLY' && statusUpper !== 'AWAITING RESPONSE') return false;
      } else if (activeTab === 'Closed') {
        if (statusUpper !== 'CLOSED' && statusUpper !== 'RESOLVED') return false;
      }

      // 2. Local Search Term (ID, AWB)
      if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        const matchId = ticket.id.toLowerCase().includes(lowerSearch);
        const matchAwb = ticket.awb.toLowerCase().includes(lowerSearch);
        if (!matchId && !matchAwb) return false;
      }

      // 3. Global Search Query
      if (globalSearchQuery) {
        const lowerGlobal = globalSearchQuery.toLowerCase();
        const matchId = ticket.id.toLowerCase().includes(lowerGlobal);
        const matchAwb = ticket.awb.toLowerCase().includes(lowerGlobal);
        const matchSubject = ticket.subject.toLowerCase().includes(lowerGlobal);
        const matchCustomer = ticket.customer.toLowerCase().includes(lowerGlobal);
        const matchAssignee = ticket.assignee.toLowerCase().includes(lowerGlobal);
        const matchSubcategory = ticket.subcategory.toLowerCase().includes(lowerGlobal);
        if (!matchId && !matchAwb && !matchSubject && !matchCustomer && !matchAssignee && !matchSubcategory) return false;
      }

      // 4. Subcategories dropdown
      if (selectedSubcategories.length > 0) {
        if (!selectedSubcategories.includes(ticket.subcategory)) return false;
      }

      // 5. Statuses dropdown
      if (selectedStatuses.length > 0) {
        if (!selectedStatuses.some(s => s.toUpperCase() === statusUpper)) return false;
      }

      // 6. Date Range filtering
      if (dateStart && ticket.dateStr < dateStart) return false;
      if (dateEnd && ticket.dateStr > dateEnd) return false;

      return true;
    });

    // 7. Sorting
    const sortVal = selectedSort[0] || 'Most Recently Created';
    if (sortVal === 'Oldest First') {
      result.sort((a, b) => a.dateStr.localeCompare(b.dateStr) || a.id.localeCompare(b.id));
    } else if (sortVal === 'Priority: High to Low') {
      result.sort((a, b) => {
        const pA = PRIORITY_ORDER[a.priority] || 0;
        const pB = PRIORITY_ORDER[b.priority] || 0;
        if (pA !== pB) return pB - pA;
        return b.dateStr.localeCompare(a.dateStr);
      });
    } else {
      // Default: Most Recently Created
      result.sort((a, b) => b.dateStr.localeCompare(a.dateStr) || b.id.localeCompare(a.id));
    }

    return result;
  }, [activeTab, searchTerm, globalSearchQuery, selectedSubcategories, selectedStatuses, dateStart, dateEnd, selectedSort]);

  const {
    page: currentPage,
    setPage: setCurrentPage,
    totalPages,
    paginatedData: paginatedTickets,
    startIndex,
    endIndex,
  } = usePagination({ data: filteredTickets, perPage: 10 });

  const SUBCATEGORY_OPTIONS = [
    { label: 'Issues with KYC Verification', value: 'Issues with KYC Verification' },
    { label: 'Shipment Delay', value: 'Shipment Delay' },
    { label: 'Payment Issue', value: 'Payment Issue' },
  ];

  const STATUS_OPTIONS = [
    { label: 'NEW', value: 'NEW' },
    { label: 'OPEN', value: 'OPEN' },
    { label: 'In Progress', value: 'In Progress' },
    { label: 'Awaiting Reply', value: 'Awaiting Reply' },
    { label: 'Resolved', value: 'Resolved' },
    { label: 'Escalated', value: 'Escalated' },
    { label: 'Closed', value: 'Closed' },
  ];

  const SORT_OPTIONS = [
    { label: 'Most Recently Created', value: 'Most Recently Created' },
    { label: 'Oldest First', value: 'Oldest First' },
    { label: 'Priority: High to Low', value: 'Priority: High to Low' },
  ];

  return (
    <AdminLayout>
      <div className="flex flex-col h-[calc(100vh-72px)] -m-4 md:-m-6 bg-white">
        <div className="bg-white relative z-50 shrink-0">
          {/* Top Header Row (Tabs + Global Search) */}
          <div className="flex justify-between items-center px-6 py-2 border-b border-[#E2E8F0] bg-white">
            <div className="flex gap-6 shrink-0">
              {['New', 'Open', 'Awaiting Response', 'Closed', 'All'].map(s => (
                <button 
                  key={s} 
                  onClick={() => setActiveTab(s)} 
                  className={`text-[13px] font-bold py-2.5 border-b-[3px] transition-colors ${activeTab === s ? 'border-[#00A86B] text-[#00A86B]' : 'border-transparent text-[#64748B] hover:text-[#0F172A]'}`}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 shrink-0 ml-auto">
              <button className="w-8 h-8 rounded-full border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-[#F8FAFC]">
                <RefreshCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

        {/* Filter Row */}
        <div className="p-4 border-b border-[#E2E8F0] flex flex-wrap justify-between items-center gap-3 bg-[#F8FAFC]/50">
          <div className="flex flex-wrap items-center gap-3">
            <input 
              type="text" 
              placeholder="Search Tickets..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs bg-white focus:outline-none w-[180px] shrink-0" 
            />
            
            <GlassDropdown
              label="Subcategory"
              options={SUBCATEGORY_OPTIONS}
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
              onDateChange={(s, e) => { setDateStart(s); setDateEnd(e); }}
            />

            <GlassDropdown
              label="Sort By"
              options={SORT_OPTIONS}
              selected={selectedSort}
              onChange={setSelectedSort}
              placeholder="Search sort..."
              icon={<ArrowUpDown className="w-3.5 h-3.5" />}
            />
          </div>

          <button className="h-9 px-6 rounded-full bg-[#00A86B] text-white text-[11px] font-bold hover:bg-[#009B63] transition-colors shadow-sm whitespace-nowrap">
            Create Ticket
          </button>
        </div>
        </div>

        {/* Table Section */}
        <div className="bg-white flex flex-col flex-1 min-h-0 overflow-hidden border-t border-[#E2E8F0]">
        <div className="flex-1 overflow-y-auto overflow-x-hidden w-full relative">
          <table className="w-full text-left border-collapse min-w-full">
            <thead>
              <tr className="bg-[#E6F5F1] text-xs font-medium text-[#00A86B] uppercase tracking-wider">
                <th className="p-4"><User className="w-3.5 h-3.5 inline mr-1"/> Ticket ID</th>
                <th className="p-4"><Package className="w-3.5 h-3.5 inline mr-1"/> AWB(s)</th>
                <th className="p-4"><FileText className="w-3.5 h-3.5 inline mr-1"/> Subcategory</th>
                <th className="p-4"><FileText className="w-3.5 h-3.5 inline mr-1"/> Ticket Status</th>
                <th className="p-4"><Calendar className="w-3.5 h-3.5 inline mr-1"/> Resolution Due By</th>
                <th className="p-4"><Calendar className="w-3.5 h-3.5 inline mr-1"/> Last Updated</th>
                <th className="p-4 text-right pr-6"><User className="w-3.5 h-3.5 inline mr-1"/> Actions</th>
              </tr>
            </thead>
            <tbody className="text-[11px] text-[#475569]">
              {paginatedTickets.length > 0 ? (
                paginatedTickets.map((ticket, i) => (
                  <tr key={i} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors group">
                    <td className="p-4 align-top pt-4 text-[#0F172A]">
                      <div className="text-xs font-semibold text-[#00A86B] mb-0.5">{ticket.id}</div>
                      <div className="table-date">{ticket.date}</div>
                    </td>
                    <td className="p-4 align-top pt-5 text-xs font-semibold text-[#0F172A]">{ticket.awb}</td>
                    <td className="p-4 align-top pt-5 font-medium text-[#475569] text-[11px]">{ticket.subcategory}</td>
                    <td className="p-4 align-top pt-5">
                      <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap shadow-sm ${STATUS_BADGE_CLASSES[ticket.status.toUpperCase()] || 'border-blue-200 text-blue-700 bg-blue-50/50'}`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="p-4 align-top pt-4">
                      <div className="table-date">{ticket.resDue.split('\n')[0]}</div>
                      <div className="table-date mt-0.5">{ticket.resDue.split('\n')[1]}</div>
                    </td>
                    <td className="p-4 align-top pt-4">
                      <div className="table-date">{ticket.lastUpdated.split('\n')[0]}</div>
                      <div className="table-date mt-0.5">{ticket.lastUpdated.split('\n')[1]}</div>
                    </td>
                    <td className="p-4 align-top pt-3 text-right pr-6">
                      <div className="flex items-center justify-end gap-3">
                        <div className="flex flex-col items-center">
                          <button 
                            className="px-4 py-1.5 rounded-full bg-[#1e3a8a] text-white font-bold text-[10px] hover:bg-[#1e40af] transition-colors shadow-sm"
                            onClick={(e) => { e.stopPropagation(); setSelectedTicket(ticket); }}
                          >
                            Update
                          </button>
                          <span 
                            className="text-[9px] font-bold text-[#64748B] mt-1 hover:text-[#0F172A] transition-colors cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); setSelectedTicket(ticket); }}
                          >
                            View
                          </span>
                        </div>
                        <button className="w-6 h-6 rounded-full border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-gray-50 transition-colors">
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#94A3B8] font-medium">
                    No tickets found matching the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 0 && (
          <div className="p-4 border-t border-[#E2E8F0] flex items-center justify-between">
            <div className="text-xs text-[#64748B]">
              Showing <span className="font-bold text-[#0F172A]">{startIndex}</span> to <span className="font-bold text-[#0F172A]">{endIndex}</span> of <span className="font-bold text-[#0F172A]">{filteredTickets.length}</span> entries
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded border border-[#E2E8F0] text-xs font-medium text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-50"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-8 h-8 rounded text-xs font-medium flex items-center justify-center transition-colors ${
                    currentPage === i + 1 ? 'bg-[#00A86B] text-white border border-[#00A86B]' : 'border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded border border-[#E2E8F0] text-xs font-medium text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>

      {/* Ticket Detail Drawer (unchanged functionality, smooth animation) */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-in fade-in" onClick={() => setSelectedTicket(null)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="sticky top-0 bg-white z-10 p-6 border-b border-[#E2E8F0] flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-[#0F172A]">{selectedTicket.id}</h3>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold mt-1 inline-block ${STATUS_COLORS[selectedTicket.status] || STATUS_COLORS['OPEN']}`}>{selectedTicket.status}</span>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="w-8 h-8 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-[#F8FAFC]"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <h4 className="text-sm font-bold text-[#0F172A] mb-1">{selectedTicket.subject}</h4>
                <p className="text-xs text-[#64748B]">Raised by {selectedTicket.customer} ({selectedTicket.type}) on {selectedTicket.created}</p>
              </div>
              <div className="bg-[#F8FAFC] rounded-xl p-4 space-y-2">
                <div className="flex justify-between"><span className="text-xs text-[#64748B]">Priority</span><span className={`text-xs font-bold ${selectedTicket.priority === 'Critical' ? 'text-red-600' : 'text-[#0F172A]'}`}>{selectedTicket.priority}</span></div>
                <div className="flex justify-between"><span className="text-xs text-[#64748B]">Assigned To</span><span className="text-xs font-bold text-[#0F172A]">{selectedTicket.assignee}</span></div>
              </div>
              {/* Mock Conversation */}
              <div>
                <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wide mb-3">Conversation</h4>
                <div className="space-y-3">
                  <div className="bg-blue-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2"><User className="w-3 h-3 text-blue-500" /><span className="text-[10px] font-bold text-blue-600">{selectedTicket.customer}</span><span className="text-[9px] text-[#94A3B8]">{selectedTicket.created}</span></div>
                    <p className="text-xs text-[#475569]">Hi, I am facing an issue with my shipment. The tracking shows no updates for the last 3 days. Can you please check?</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2"><User className="w-3 h-3 text-green-500" /><span className="text-[10px] font-bold text-green-600">{selectedTicket.assignee}</span><span className="text-[9px] text-[#94A3B8]">2 hrs ago</span></div>
                    <p className="text-xs text-[#475569]">Hello! We have checked with the courier partner. Your shipment is currently at the hub and will be dispatched for delivery today.</p>
                  </div>
                </div>
              </div>
              {/* Reply Box */}
              <div>
                <textarea className="w-full h-24 p-3 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20 focus:border-[#00A86B] resize-none" placeholder="Type your reply..." />
                <div className="flex gap-2 mt-2">
                  <button className="h-9 px-4 rounded-lg bg-[#00A86B] text-white text-xs font-semibold hover:bg-[#009B63] transition-colors">Send Reply</button>
                  <button className="h-9 px-4 rounded-lg border border-[#E2E8F0] text-[#475569] text-xs font-semibold hover:bg-[#F8FAFC]">Mark Resolved</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
