import React, { useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Search, Plus, MessageSquare, Clock, CheckCircle2, AlertCircle, ChevronDown, ChevronRight, Send, X, HelpCircle } from 'lucide-react';

const TICKETS = [
  { id: 'TKT-1045', subject: 'Weight discrepancy on AWB DEL1234567890', category: 'Weight Dispute', status: 'Open', priority: 'High', date: '12 Jun 2026', lastReply: '12 Jun, 4:30 PM' },
  { id: 'TKT-1044', subject: 'Delayed pickup for order QP100248', category: 'Pickup Issue', status: 'In Progress', priority: 'Medium', date: '11 Jun 2026', lastReply: '12 Jun, 10:00 AM' },
  { id: 'TKT-1043', subject: 'COD settlement not received for batch #4467', category: 'Billing', status: 'Resolved', priority: 'High', date: '09 Jun 2026', lastReply: '10 Jun, 2:15 PM' },
  { id: 'TKT-1042', subject: 'Customer claims package was damaged', category: 'Damage/Lost', status: 'Open', priority: 'High', date: '08 Jun 2026', lastReply: '09 Jun, 11:00 AM' },
  { id: 'TKT-1041', subject: 'Unable to generate manifest for Bluedart', category: 'Technical', status: 'Resolved', priority: 'Low', date: '07 Jun 2026', lastReply: '07 Jun, 6:00 PM' },
  { id: 'TKT-1040', subject: 'Need rate card update for new zone pricing', category: 'Billing', status: 'In Progress', priority: 'Medium', date: '06 Jun 2026', lastReply: '08 Jun, 9:30 AM' },
];

const STATUS_COLOR: Record<string, string> = {
  'Open': 'bg-blue-100 text-blue-700',
  'In Progress': 'bg-yellow-100 text-yellow-700',
  'Resolved': 'bg-green-100 text-green-700',
};

const PRIORITY_COLOR: Record<string, string> = {
  'High': 'bg-red-100 text-red-700',
  'Medium': 'bg-orange-100 text-orange-700',
  'Low': 'bg-gray-100 text-gray-600',
};

const FAQ = [
  { q: 'How do I raise a weight dispute?', a: 'Go to Weight Discrepancy section on the dashboard, click "Actions" → "Raise Dispute". Attach proof of weight (scale photo) and the system will process it within 48 hours.' },
  { q: 'When do COD settlements happen?', a: 'COD settlements are processed every 7 days. Once delivery is confirmed, the amount is queued for the next settlement cycle. You can check settlement dates in Billing → COD Settlements.' },
  { q: 'How to schedule a pickup?', a: 'Create an order first, then click "Ship Now". Select a courier and choose your pickup slot. Pickups are typically scheduled within 24 hours.' },
  { q: 'What happens when NDR is raised?', a: 'When a delivery attempt fails, an NDR is automatically raised. You need to take action within 48 hours — either reattempt delivery, update address, or initiate RTO.' },
  { q: 'How do I recharge my wallet?', a: 'Go to Wallet page, click "Recharge Wallet", enter the amount and pay via Razorpay (UPI, Net Banking, Cards supported). Balance updates instantly.' },
];

export function Support() {
  const [showCreate, setShowCreate] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'tickets' | 'faq'>('tickets');
  const [search, setSearch] = useState('');
  const [newTicket, setNewTicket] = useState({ subject: '', category: 'General', message: '' });

  const filtered = TICKETS.filter(t =>
    !search || t.subject.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Support Center</h1>
          <p className="text-sm text-[#64748B] mt-0.5">Get help with your shipping issues</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 h-10 rounded-full bg-[#00A86B] text-white text-sm font-semibold hover:bg-[#009B63] transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> New Ticket
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Open Tickets', value: '12', icon: AlertCircle, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'In Progress', value: '8', icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Resolved', value: '156', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' },
          { label: 'Avg Response', value: '2.4h', icon: MessageSquare, color: 'text-purple-500', bg: 'bg-purple-50' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${s.bg} flex items-center justify-center`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <div className="text-xl font-bold text-[#0F172A]">{s.value}</div>
              <div className="text-xs text-[#64748B] font-medium">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="border-b border-[#E2E8F0] px-4 flex">
          <button onClick={() => setActiveTab('tickets')} className={`px-4 py-3.5 text-xs font-semibold border-b-2 transition-all ${activeTab === 'tickets' ? 'border-[#00A86B] text-[#00A86B]' : 'border-transparent text-[#64748B]'}`}>
            My Tickets
          </button>
          <button onClick={() => setActiveTab('faq')} className={`px-4 py-3.5 text-xs font-semibold border-b-2 transition-all ${activeTab === 'faq' ? 'border-[#00A86B] text-[#00A86B]' : 'border-transparent text-[#64748B]'}`}>
            FAQ
          </button>
        </div>

        {activeTab === 'tickets' && (
          <>
            <div className="p-4 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-full px-3 h-9 max-w-sm">
                <Search className="w-3.5 h-3.5 text-[#94A3B8]" />
                <input type="text" placeholder="Search tickets..." value={search} onChange={e => setSearch(e.target.value)}
                  className="bg-transparent text-xs outline-none placeholder:text-[#94A3B8] w-full" />
              </div>
            </div>
            <div className="divide-y divide-[#E2E8F0]">
              {filtered.map(t => (
                <div key={t.id} className="p-4 flex items-center justify-between hover:bg-[#F8FAFC] transition-colors cursor-pointer">
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-[#00A86B]">{t.id}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${PRIORITY_COLOR[t.priority]}`}>{t.priority}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_COLOR[t.status]}`}>{t.status}</span>
                    </div>
                    <div className="text-sm font-semibold text-[#0F172A] truncate">{t.subject}</div>
                    <div className="text-xs text-[#64748B] mt-0.5">{t.category} · Created <span className="table-date">{t.date}</span> · Last reply: <span className="table-date">{t.lastReply}</span></div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#94A3B8] shrink-0" />
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'faq' && (
          <div className="divide-y divide-[#E2E8F0]">
            {FAQ.map((item, i) => (
              <div key={i} className="cursor-pointer" onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}>
                <div className="p-4 flex items-center justify-between hover:bg-[#F8FAFC] transition-colors">
                  <div className="flex items-center gap-3">
                    <HelpCircle className="w-4 h-4 text-[#00A86B] shrink-0" />
                    <span className="text-sm font-semibold text-[#0F172A]">{item.q}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-[#94A3B8] transition-transform ${expandedFaq === i ? 'rotate-180' : ''}`} />
                </div>
                {expandedFaq === i && (
                  <div className="px-4 pb-4 pl-11 text-sm text-[#64748B] leading-relaxed">{item.a}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Ticket Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-[#0F172A]">Create Support Ticket</h3>
              <button onClick={() => setShowCreate(false)} className="w-8 h-8 rounded-full hover:bg-[#F8FAFC] flex items-center justify-center text-[#64748B]"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#475569] mb-1.5 block">Category</label>
                <select value={newTicket.category} onChange={e => setNewTicket(p => ({ ...p, category: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl border border-[#E2E8F0] text-sm outline-none focus:border-[#00A86B]">
                  <option>General</option><option>Pickup Issue</option><option>Weight Dispute</option><option>Billing</option><option>Damage/Lost</option><option>Technical</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#475569] mb-1.5 block">Subject</label>
                <input type="text" value={newTicket.subject} onChange={e => setNewTicket(p => ({ ...p, subject: e.target.value }))}
                  placeholder="Brief description of your issue"
                  className="w-full h-10 px-3 rounded-xl border border-[#E2E8F0] text-sm outline-none focus:border-[#00A86B]" />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#475569] mb-1.5 block">Message</label>
                <textarea value={newTicket.message} onChange={e => setNewTicket(p => ({ ...p, message: e.target.value }))}
                  placeholder="Describe your issue in detail..."
                  className="w-full h-28 px-3 py-2 rounded-xl border border-[#E2E8F0] text-sm outline-none focus:border-[#00A86B] resize-none" />
              </div>
            </div>
            <button className="w-full h-11 rounded-full bg-[#00A86B] text-white font-bold hover:bg-[#009B63] transition-colors mt-5 flex items-center justify-center gap-2">
              <Send className="w-4 h-4" /> Submit Ticket
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
