import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Briefcase, Inbox, Loader2, RefreshCcw, Search, Send, StickyNote } from 'lucide-react';
import { AdminLayout } from '../../../components/admin/layout/AdminLayout';
import { useAdminTab } from '../../../context/AdminUserContext';
import { getTeamTickets, replyToTicket, addInternalNote, viewTicket, TEAM_LABEL, type Ticket } from '../../../services/api/supportService';

/* Sales panel › Tickets: support tickets transferred to the Sales team. Every sales employee sees the same queue.
   Reply to the seller, add an internal note. Desktop: list + detail side by side; mobile: list, then detail. */

const STATUS: Record<string, { label: string; cls: string }> = {
  new: { label: 'New', cls: 'bg-sky-50 text-sky-700' },
  open: { label: 'Open', cls: 'bg-amber-50 text-amber-700' },
  active: { label: 'Open', cls: 'bg-amber-50 text-amber-700' },
  awaiting_response: { label: 'Awaiting seller', cls: 'bg-violet-50 text-violet-700' },
  resolved: { label: 'Resolved', cls: 'bg-[#F0FDF4] text-[#047857]' },
  closed: { label: 'Closed', cls: 'bg-[#F1F5F9] text-[#64748B]' },
};
const fmtWhen = (d?: string) => (d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true }) : '');

export function SalesTickets() {
  const { userName } = useAdminTab();
  const [params, setParams] = useSearchParams();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'open' | 'all'>('open');
  const [selectedId, setSelectedId] = useState<string | null>(params.get('open'));
  const [reply, setReply] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState<'' | 'reply' | 'note'>('');

  const load = async () => {
    setLoading(true); setError('');
    try { setTickets(await getTeamTickets('sales')); }
    catch (e: any) { setError(e?.response?.data?.message || 'Could not load tickets'); } // eslint-disable-line @typescript-eslint/no-explicit-any
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { const id = params.get('open'); if (id) setSelectedId(id); }, [params]);

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return tickets
      .filter(x => filter === 'all' || (x.status !== 'closed' && x.status !== 'resolved'))
      .filter(x => !t || [x.ticketNumber, x.fullname, x.company, x.email, x.phoneNumber, x.subcategory].some(v => String(v || '').toLowerCase().includes(t)))
      .sort((a, b) => new Date(b.lastRepliedAt || b.createdAt).getTime() - new Date(a.lastRepliedAt || a.createdAt).getTime());
  }, [tickets, q, filter]);
  const selected = tickets.find(t => t._id === selectedId) || null;
  const openCount = tickets.filter(t => t.status !== 'closed' && t.status !== 'resolved').length;

  const select = (t: Ticket) => {
    setSelectedId(t._id); setReply(''); setNote('');
    setParams(p => { p.set('open', t._id); return p; }, { replace: true });
    viewTicket(t._id).then(u => u && setTickets(prev => prev.map(x => (x._id === u._id ? { ...x, ...u } : x)))).catch(() => {});
  };
  const back = () => { setSelectedId(null); setParams(p => { p.delete('open'); return p; }, { replace: true }); };
  const update = (u: Ticket) => setTickets(prev => prev.map(x => (x._id === u._id ? u : x)));

  const sendReply = async () => {
    if (!selected || !reply.trim()) return;
    setBusy('reply');
    try { update(await replyToTicket(selected._id, reply.trim(), 'admin', userName || 'Sales team')); setReply(''); }
    catch (e: any) { setError(e?.response?.data?.message || 'Could not send the reply'); } finally { setBusy(''); } // eslint-disable-line @typescript-eslint/no-explicit-any
  };
  const sendNote = async () => {
    if (!selected || !note.trim()) return;
    setBusy('note');
    try { update(await addInternalNote(selected._id, note.trim())); setNote(''); }
    catch (e: any) { setError(e?.response?.data?.message || 'Could not add the note'); } finally { setBusy(''); } // eslint-disable-line @typescript-eslint/no-explicit-any
  };

  const List = (
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden flex flex-col min-h-[420px]">
      <div className="p-3 border-b border-[#F1F5F9] space-y-2.5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search ticket, seller, phone"
            className="w-full h-9 pl-9 pr-3 rounded-full border border-[#E2E8F0] text-[13px] focus:outline-none focus:border-[#00A86B]" />
        </div>
        <div className="inline-flex p-0.5 rounded-full bg-[#F1F5F9]">
          {([['open', `Open · ${openCount}`], ['all', `All · ${tickets.length}`]] as const).map(([k, l]) => (
            <button key={k} type="button" onClick={() => setFilter(k)}
              className={`h-7 px-3 rounded-full text-[12px] font-semibold transition-colors ${filter === k ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#64748B]'}`}>{l}</button>
          ))}
        </div>
      </div>
      {loading ? (
        <div className="flex-1 flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-[#94A3B8]" /></div>
      ) : rows.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-12 px-6 text-center">
          <span className="w-11 h-11 rounded-full bg-[#F0FDF4] flex items-center justify-center"><Inbox className="w-5 h-5 text-[#00A86B]" /></span>
          <p className="mt-3 text-[13.5px] font-semibold text-[#0F172A]">{q ? 'No tickets match your search' : 'No tickets for Sales'}</p>
          <p className="mt-0.5 text-[12px] text-[#94A3B8]">Tickets the support team transfers to Sales appear here.</p>
        </div>
      ) : (
        <ul className="flex-1 overflow-y-auto divide-y divide-[#F1F5F9]">
          {rows.map(t => {
            const st = STATUS[t.status] || STATUS.open;
            const on = t._id === selectedId;
            return (
              <li key={t._id}>
                <button type="button" onClick={() => select(t)}
                  className={`w-full text-left px-4 py-3 transition-colors ${on ? 'bg-[#F0FDF4]' : 'hover:bg-[#F8FAFC]'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[12px] font-semibold text-[#64748B]">#{t.ticketNumber}</span>
                    <span className={`h-5 px-2 rounded-full text-[10.5px] font-bold inline-flex items-center ${st.cls}`}>{st.label}</span>
                  </div>
                  <div className="mt-1 text-[13.5px] font-semibold text-[#0F172A] truncate">{t.fullname || t.company || t.email}</div>
                  <div className="text-[12px] text-[#64748B] truncate">{t.subcategory || t.category}</div>
                  <div className="mt-1 text-[11px] text-[#94A3B8]">{fmtWhen(t.lastRepliedAt || t.createdAt)}</div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );

  const Detail = selected && (
    <motion.div key={selected._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
      className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm flex flex-col min-h-[420px]">
      <div className="p-4 border-b border-[#F1F5F9] flex items-start gap-3">
        <button type="button" onClick={back} className="lg:hidden w-8 h-8 rounded-full border border-[#E2E8F0] flex items-center justify-center shrink-0" aria-label="Back"><ArrowLeft className="w-4 h-4" /></button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[15px] font-bold text-[#0F172A]">#{selected.ticketNumber}</span>
            <span className={`h-5 px-2 rounded-full text-[10.5px] font-bold inline-flex items-center ${(STATUS[selected.status] || STATUS.open).cls}`}>{(STATUS[selected.status] || STATUS.open).label}</span>
          </div>
          <div className="mt-0.5 text-[13px] text-[#334155]">{selected.fullname} {selected.company ? `· ${selected.company}` : ''}</div>
          <div className="text-[12px] text-[#94A3B8]">{[selected.phoneNumber, selected.email].filter(Boolean).join(' · ')}</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* transfer notes = why it came to Sales */}
        {(selected.internalNotes || []).length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wide text-amber-800 flex items-center gap-1.5"><StickyNote className="w-3.5 h-3.5" />Internal · only staff see this</div>
            {(selected.internalNotes || []).map((n, i) => (
              <div key={i} className="text-[12.5px]">
                <span className="font-semibold text-amber-900">{n.kind === 'transfer' ? `${n.byName || 'Staff'} moved it ${n.fromTeam ? TEAM_LABEL[n.fromTeam] : ''} → ${n.toTeam ? TEAM_LABEL[n.toTeam] : ''}` : `${n.byName || 'Staff'} · note`}</span>
                <span className="ml-2 text-[11px] text-[#94A3B8]">{fmtWhen(n.at)}</span>
                <p className="text-[#475569] whitespace-pre-wrap">{n.note}</p>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-xl bg-[#F8FAFC] border border-[#EEF2F6] p-3">
          <div className="text-[12px] font-semibold text-[#334155]">{selected.category}{selected.subcategory ? ` · ${selected.subcategory}` : ''}</div>
          <p className="mt-1 text-[13px] text-[#475569] whitespace-pre-wrap">{selected.message}</p>
        </div>

        {(selected.messages || []).map((m, i) => (
          <div key={i} className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${m.sender === 'admin' ? 'ml-auto bg-[#F0FDF4] border border-[#DCFCE7]' : 'bg-white border border-[#E2E8F0]'}`}>
            <div className="text-[11px] font-semibold text-[#64748B]">{m.senderName} · {fmtWhen(m.sentAt)}</div>
            <p className="mt-0.5 text-[13px] text-[#0F172A] whitespace-pre-wrap">{m.message}</p>
          </div>
        ))}
      </div>

      {selected.status !== 'closed' && (
        <div className="p-3 border-t border-[#F1F5F9] space-y-2">
          <div className="flex gap-2">
            <textarea value={reply} onChange={e => setReply(e.target.value)} rows={2} placeholder="Reply to the seller…"
              className="flex-1 px-3.5 py-2.5 rounded-2xl border border-[#E2E8F0] text-[13px] resize-none focus:outline-none focus:border-[#00A86B]" />
            <button type="button" onClick={sendReply} disabled={busy === 'reply' || !reply.trim()}
              className="self-end h-10 px-4 rounded-full bg-[#00A86B] hover:bg-[#00965F] disabled:opacity-50 text-white text-[13px] font-bold inline-flex items-center gap-1.5">
              {busy === 'reply' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}<span className="hidden sm:inline">Send</span>
            </button>
          </div>
          <div className="flex gap-2">
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="Internal note (staff only)"
              className="flex-1 h-9 px-3.5 rounded-full border border-amber-200 bg-amber-50/40 text-[12.5px] focus:outline-none focus:border-amber-400" />
            <button type="button" onClick={sendNote} disabled={busy === 'note' || !note.trim()}
              className="h-9 px-3.5 rounded-full border border-amber-300 text-amber-800 text-[12px] font-semibold disabled:opacity-50">Add note</button>
          </div>
        </div>
      )}
    </motion.div>
  );

  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto pb-10">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-[#F0FDF4] flex items-center justify-center"><Briefcase className="w-5 h-5 text-[#00A86B]" /></span>
            <div>
              <h1 className="text-[20px] font-bold text-[#0F172A] leading-tight">Tickets</h1>
              <p className="text-[12.5px] text-[#64748B]">Support tickets transferred to the Sales team</p>
            </div>
          </div>
          <button type="button" onClick={load} title="Refresh" className="w-10 h-10 rounded-full border border-[#E2E8F0] bg-white flex items-center justify-center text-[#475569] hover:text-[#00A86B]">
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        {error && <p className="mb-3 text-[12.5px] text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>}

        <div className="grid grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)] gap-4">
          <div className={selected ? 'hidden lg:block' : ''}>{List}</div>
          <div className={selected ? '' : 'hidden lg:block'}>
            <AnimatePresence mode="wait">
              {Detail || (
                <div className="hidden lg:flex bg-white rounded-xl border border-dashed border-[#E2E8F0] min-h-[420px] items-center justify-center text-[13px] text-[#94A3B8]">Select a ticket to view it</div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
