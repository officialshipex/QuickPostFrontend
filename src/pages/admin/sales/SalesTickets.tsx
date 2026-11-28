import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import {
  X, AlertCircle, ChevronDown, LifeBuoy, Search, Phone, Undo2, MessageSquare, StickyNote, Send, Wrench, CheckCircle2, Loader2, RefreshCw, Inbox,
} from 'lucide-react';
import { TableLoader } from '../../../components/ui/TableLoader';
import {
  salesApiClient, apiError, isClosedTicket,
  type ReferredSeller, type SalesTicket, type SalesTicketStatus, type SalesTicketNote, type SalesPoolTicket,
} from '../../../services/salesApi';

/* Sales panel → Tickets. A sales person raises a support ticket for one of their sellers while on a call; Support
   works it in the normal queue (it is the seller's own ticket, so the seller sees it in their Support page too).
   When Support replies, sends it back ("call the seller") or closes it, the sales person is notified (navbar bell).
   Sales person <-> Support talk through staff notes the seller never sees. Backend: sales/salesTickets.js. */

const STATUS: Record<SalesTicketStatus, { label: string; tone: string }> = {
  new: { label: 'New', tone: 'bg-sky-50 text-sky-700' },
  active: { label: 'New', tone: 'bg-sky-50 text-sky-700' },
  open: { label: 'With Support', tone: 'bg-amber-50 text-amber-700' },
  awaiting_response: { label: 'Replied to seller', tone: 'bg-violet-50 text-violet-700' },
  closed: { label: 'Closed', tone: 'bg-[#F0FDF4] text-[#0F6B38]' },
  resolved: { label: 'Closed', tone: 'bg-[#F0FDF4] text-[#0F6B38]' },
  deleted: { label: 'Deleted', tone: 'bg-slate-100 text-slate-500' },
};
const NOTE_KIND: Record<SalesTicketNote['kind'], { label: string; tone: string }> = {
  handback: { label: 'Sent back to you', tone: 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]' },
  sales: { label: 'Your note', tone: 'bg-sky-50 border-sky-100 text-sky-900' },
  note: { label: 'Support note', tone: 'bg-amber-50 border-amber-100 text-amber-900' },
  transfer: { label: 'Moved', tone: 'bg-slate-50 border-slate-200 text-slate-700' },
  claim: { label: 'Taken from the team queue', tone: 'bg-slate-50 border-slate-200 text-slate-700' },
};
const TEAM_NAME: Record<string, string> = { tech: 'Tech', sales: 'Sales', support: 'Support' };

const when = (iso?: string) => (iso ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true }) : '—');
const inputCls = (bad?: string) => `w-full h-11 md:h-10 px-3.5 rounded-xl border text-[14px] md:text-[13px] text-[#0F172A] bg-white placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 transition-colors ${bad ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-[#E2E8F0] focus:border-[#00A86B] focus:ring-[#00A86B]/15'}`;
const areaCls = 'w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-[14px] md:text-[13px] text-[#0F172A] placeholder:text-[#94A3B8] resize-none focus:outline-none focus:border-[#00A86B] focus:ring-2 focus:ring-[#00A86B]/15';

function useEscape(onClose: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);
}

// ─── Raise a ticket ─────────────────────────────────────────────────────────────────────────────────────────
export function RaiseTicketDialog({ sellers, initialSellerId, onClose, onCreated }: {
  sellers: ReferredSeller[]; initialSellerId?: string; onClose: () => void; onCreated: (msg: string, ticketId: string) => void;
}) {
  useEscape(onClose);
  const [categories, setCategories] = useState<Record<string, string[]>>({});
  const [sellerId, setSellerId] = useState(initialSellerId || '');
  const [find, setFind] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [awbNumbers, setAwbNumbers] = useState('');
  const [message, setMessage] = useState('');
  const [supportNote, setSupportNote] = useState('');
  const [mode, setMode] = useState<'b2c' | 'cargo'>('b2c');
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    salesApiClient.get('/tickets/options').then(r => setCategories(r.data?.categories || {})).catch(e => setError(apiError(e, 'Could not load the ticket categories.')));
  }, []);

  const fl = find.trim().toLowerCase();
  const matches = useMemo(() => sellers.filter(s => !fl || [s.name, s.businessName, s.phone, s.email, String(s.userId || '')].some(v => (v || '').toLowerCase().includes(fl))).slice(0, 50), [sellers, fl]);
  const seller = sellers.find(s => s._id === sellerId);
  const errs = {
    seller: !sellerId ? 'Choose the seller' : '',
    category: !category ? 'Choose a category' : '',
    subcategory: !subcategory ? 'Choose a subcategory' : '',
    message: message.trim().length < 10 ? 'Describe the issue (at least 10 characters)' : '',
  };
  const valid = !Object.values(errs).some(Boolean);

  const save = async () => {
    setTouched(true);
    if (!valid || saving) return;
    setSaving(true); setError('');
    try {
      const r = await salesApiClient.post('/tickets', { sellerId, category, subcategory, awbNumbers, message: message.trim(), supportNote: supportNote.trim(), mode });
      onCreated(r.data?.message || 'Ticket raised', r.data?.ticket?._id);
      onClose();
    } catch (e) { setError(apiError(e, 'Could not raise the ticket.')); } finally { setSaving(false); }
  };

  const label = (text: string, required = false, htmlFor?: string) => (
    <label htmlFor={htmlFor} className="block text-[12.5px] font-semibold text-[#334155] mb-1.5">{text}{required && <span className="text-red-500"> *</span>}</label>
  );
  const fieldError = (msg: string) => (touched && msg ? <p className="mt-1 text-[11.5px] text-red-600">{msg}</p> : null);

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center sm:p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div role="dialog" aria-modal="true" aria-labelledby="raise-ticket-title"
        initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full sm:max-w-xl bg-white rounded-t-2xl sm:rounded-2xl shadow-[0_24px_64px_-16px_rgba(15,23,42,0.35)] flex flex-col max-h-[92vh] sm:max-h-[calc(100vh-4rem)]">
        <div className="sm:hidden pt-2.5 flex justify-center"><span className="w-10 h-1 rounded-full bg-[#E2E8F0]" /></div>
        <div className="px-5 pt-3 sm:pt-4 pb-3.5 border-b border-[#F1F5F9] flex items-start justify-between gap-3 shrink-0">
          <div className="flex items-start gap-3 min-w-0">
            <span className="w-9 h-9 rounded-xl bg-[#F0FDF4] text-[#00A86B] flex items-center justify-center shrink-0"><LifeBuoy className="w-[18px] h-[18px]" /></span>
            <div className="min-w-0">
              <h3 id="raise-ticket-title" className="text-[15.5px] font-bold text-[#0F172A] leading-tight">Create ticket for a seller</h3>
              <p className="text-[12px] text-[#64748B] mt-0.5">Support handles it. You're notified when they reply or send it back for you to call the seller.</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-full flex items-center justify-center text-[#94A3B8] hover:bg-[#F1F5F9] shrink-0"><X className="w-4 h-4" /></button>
        </div>

        <form className="flex-1 min-h-0 overflow-y-auto px-5 py-4 flex flex-col gap-3.5" onSubmit={e => { e.preventDefault(); save(); }} noValidate>
          {error && <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-100 text-[12.5px] text-red-600"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{error}</div>}

          <div>
            {label('Seller', true, 'ticket-seller-find')}
            {seller ? (
              <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border border-[#00A86B]/40 bg-[#F0FDF4]">
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-[#0F172A] truncate">{seller.businessName || seller.name}</div>
                  <div className="text-[11.5px] text-[#64748B] truncate">{[seller.businessName ? seller.name : null, seller.phone, seller.userId ? `ID ${seller.userId}` : null].filter(Boolean).join(' · ')}</div>
                </div>
                <button type="button" onClick={() => setSellerId('')} className="text-[12px] font-semibold text-[#00A86B] hover:underline shrink-0">Change</button>
              </div>
            ) : sellers.length === 0 ? (
              <p className="text-[12.5px] text-[#64748B] px-3.5 py-3 rounded-xl bg-[#F8FAFC] border border-[#EEF2F6]">You have no sellers yet. Tickets can be raised for sellers who registered with your referral code.</p>
            ) : (
              <>
                <div className="relative">
                  <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input id="ticket-seller-find" autoFocus value={find} onChange={e => setFind(e.target.value)} placeholder="Search your sellers: name, business, phone, ID"
                    className={`${inputCls(touched ? errs.seller : '')} pl-9`} />
                </div>
                <div className="mt-1.5 max-h-44 overflow-y-auto rounded-xl border border-[#EEF2F6] divide-y divide-[#F1F5F9]">
                  {matches.length === 0 ? <div className="px-3.5 py-3 text-[12px] text-[#94A3B8]">No seller matches</div> : matches.map(s => (
                    <button key={s._id} type="button" onClick={() => { setSellerId(s._id); setFind(''); }}
                      className="w-full text-left px-3.5 py-2 hover:bg-[#F0FDF4] transition-colors">
                      <div className="text-[12.5px] font-semibold text-[#0F172A] truncate">{s.businessName || s.name}</div>
                      <div className="text-[11px] text-[#94A3B8] truncate">{[s.businessName ? s.name : null, s.phone, s.userId ? `ID ${s.userId}` : null].filter(Boolean).join(' · ')}</div>
                    </button>
                  ))}
                </div>
              </>
            )}
            {fieldError(errs.seller)}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              {label('Category', true, 'ticket-category')}
              <div className="relative">
                <select id="ticket-category" value={category} onChange={e => { setCategory(e.target.value); setSubcategory(''); }}
                  className={`${inputCls(touched ? errs.category : '')} appearance-none pr-9 ${category ? '' : 'text-[#94A3B8]'}`}>
                  <option value="">Select category</option>
                  {Object.keys(categories).map(c => <option key={c} value={c} className="text-[#0F172A]">{c}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 text-[#94A3B8] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              {fieldError(errs.category)}
            </div>
            <div>
              {label('Subcategory', true, 'ticket-subcategory')}
              <div className="relative">
                <select id="ticket-subcategory" value={subcategory} disabled={!category} onChange={e => setSubcategory(e.target.value)}
                  className={`${inputCls(touched ? errs.subcategory : '')} appearance-none pr-9 disabled:opacity-60 ${subcategory ? '' : 'text-[#94A3B8]'}`}>
                  <option value="">{category ? 'Select subcategory' : 'Pick a category first'}</option>
                  {(categories[category] || []).map(s => <option key={s} value={s} className="text-[#0F172A]">{s}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 text-[#94A3B8] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              {fieldError(errs.subcategory)}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
            <div>
              {label('AWB number(s)', false, 'ticket-awb')}
              <input id="ticket-awb" value={awbNumbers} onChange={e => setAwbNumbers(e.target.value)} placeholder="Optional — separate several with commas" className={inputCls()} />
            </div>
            <div>
              {label('Panel')}
              <div className="grid grid-cols-2 gap-1.5" role="radiogroup" aria-label="Panel">
                {(['b2c', 'cargo'] as const).map(m => (
                  <button key={m} type="button" role="radio" aria-checked={mode === m} onClick={() => setMode(m)}
                    className={`h-11 md:h-10 px-3 rounded-xl border text-[12.5px] font-semibold transition-colors ${mode === m ? 'border-[#00A86B] bg-[#F0FDF4] text-[#0F6B38]' : 'border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]'}`}>
                    {m === 'b2c' ? 'B2C' : 'Cargo'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-end justify-between">
              {label("Seller's issue", true, 'ticket-message')}
              <span className="text-[11px] text-[#94A3B8] mb-1.5 tabular-nums">{message.length}/3000</span>
            </div>
            <textarea id="ticket-message" rows={4} maxLength={3000} value={message} onChange={e => setMessage(e.target.value)}
              placeholder="What the seller told you on the call, e.g. COD of 12 Nov not received; pickup pending since 2 days"
              className={areaCls} />
            <p className="mt-1 text-[11px] text-[#94A3B8]">The seller sees this in their Support page.</p>
            {fieldError(errs.message)}
          </div>
          <div>
            {label('Note for Support', false, 'ticket-note')}
            <textarea id="ticket-note" rows={2} maxLength={2000} value={supportNote} onChange={e => setSupportNote(e.target.value)}
              placeholder="Optional — only staff see this (e.g. high-value seller, promised a call back by evening)" className={areaCls} />
          </div>
          <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
        </form>

        <div className="px-5 py-3 border-t border-[#F1F5F9] flex items-center justify-end gap-2 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button onClick={onClose} className="h-9 px-4 rounded-full border border-[#E2E8F0] text-[12.5px] font-semibold text-[#475569] hover:bg-[#F8FAFC]">Cancel</button>
          <button onClick={save} disabled={saving || sellers.length === 0} className="h-9 px-4 rounded-full bg-[#00A86B] hover:bg-[#009B63] text-white text-[12.5px] font-semibold disabled:opacity-50 inline-flex items-center gap-1.5">
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}{saving ? 'Creating…' : 'Create ticket'}
          </button>
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}

// ─── One ticket ─────────────────────────────────────────────────────────────────────────────────────────────
function TicketDrawer({ id, viewAsId, canAct, onClose, onChanged }: {
  id: string; viewAsId?: string; canAct: boolean; onClose: () => void; onChanged: (msg?: string) => void;
}) {
  useEscape(onClose);
  const [t, setT] = useState<SalesTicket | null>(null);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [returning, setReturning] = useState(false);
  const [returnNote, setReturnNote] = useState('');
  const [returnClose, setReturnClose] = useState(true);

  // The sales person opens it (a ticket in the team queue becomes theirs: the first to open it takes it);
  // the owner viewing a sales person's panel only reads it.
  useEffect(() => {
    let alive = true;
    const req = canAct
      ? salesApiClient.post(`/tickets/${id}/open`)
      : salesApiClient.get(`/tickets/${id}`, { params: viewAsId ? { employeeId: viewAsId } : {} });
    req
      .then(r => {
        if (!alive) return;
        setT(r.data?.ticket || null);
        if (r.data?.taken) onChanged(r.data.message);
      })
      .catch(e => { if (alive) setError(apiError(e, 'Could not open the ticket.')); });
    return () => { alive = false; };
  }, [id, viewAsId, canAct]); // eslint-disable-line react-hooks/exhaustive-deps

  // Done on the sales side: back to the Support queue (or closed, solved on the call)
  const sendBack = async () => {
    if (returnNote.trim().length < 5 || sending) return;
    setSending(true); setSendError('');
    try {
      const r = await salesApiClient.post(`/tickets/${id}/return`, { note: returnNote.trim(), close: returnClose });
      setT(r.data?.ticket || t);
      setReturning(false); setReturnNote('');
      onChanged(r.data?.message);
    } catch (e) { setSendError(apiError(e, 'Could not hand the ticket back.')); } finally { setSending(false); }
  };

  const send = async () => {
    if (note.trim().length < 2 || sending) return;
    setSending(true); setSendError('');
    try {
      const r = await salesApiClient.post(`/tickets/${id}/notes`, { note: note.trim() });
      setT(r.data?.ticket || t);
      setNote('');
      onChanged(r.data?.message);
    } catch (e) { setSendError(apiError(e, 'Could not send the note.')); } finally { setSending(false); }
  };

  const closed = t ? isClosedTicket(t.status) : false;
  return createPortal(
    <div className="fixed inset-0 z-[300] flex justify-end">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-sm" onClick={onClose} />
      <motion.aside role="dialog" aria-modal="true" aria-label="Ticket"
        initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full sm:max-w-xl h-full bg-white shadow-[0_24px_64px_-16px_rgba(15,23,42,0.35)] flex flex-col">
        <div className="px-5 py-4 border-b border-[#F1F5F9] flex items-start justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-[15.5px] font-bold text-[#0F172A]">Ticket #{t?.ticketNumber || '…'}</h3>
              {t && <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold ${STATUS[t.status]?.tone}`}>{STATUS[t.status]?.label}</span>}
              {t?.team === 'tech' && <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-indigo-50 text-indigo-700 inline-flex items-center gap-1"><Wrench className="w-3 h-3" />Tech team</span>}
            </div>
            {t && <p className="text-[12px] text-[#64748B] mt-0.5 truncate">{t.category} · {t.subcategory} · raised {when(t.createdAt)}</p>}
          </div>
          <button onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-full flex items-center justify-center text-[#94A3B8] hover:bg-[#F1F5F9] shrink-0"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 flex flex-col gap-4">
          {error && <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-100 text-[12.5px] text-red-600"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{error}</div>}
          {!t && !error && <div className="relative h-40"><TableLoader /></div>}
          {t && (
            <>
              {/* seller + call */}
              <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-[#EEF2F6] bg-[#F8FAFC]">
                <div className="min-w-0">
                  <div className="text-[13.5px] font-bold text-[#0F172A] truncate">{t.seller.company || t.seller.name}</div>
                  <div className="text-[11.5px] text-[#64748B] truncate">{[t.seller.company ? t.seller.name : null, t.seller.phone, t.seller.email].filter(Boolean).join(' · ')}</div>
                </div>
                {t.seller.phone && t.seller.phone !== '-' && (
                  <a href={`tel:+91${t.seller.phone.replace(/\D/g, '').slice(-10)}`} className="h-9 px-3.5 rounded-full bg-[#00A86B] hover:bg-[#009B63] text-white text-[12.5px] font-semibold inline-flex items-center gap-1.5 shrink-0"><Phone className="w-4 h-4" />Call</a>
                )}
              </div>

              {t.team === 'sales' && t.supportNote && (
                <div className="p-3.5 rounded-xl border border-[#A7F3D0] bg-[#ECFDF5]">
                  <div className="text-[12px] font-bold text-[#065F46] inline-flex items-center gap-1.5"><Inbox className="w-4 h-4" />Support passed this to {t.origin === 'taken' ? 'the sales team — you took it' : 'you'}</div>
                  <p className="mt-1.5 text-[13px] text-[#064E3B] whitespace-pre-wrap break-words">{t.supportNote.note}</p>
                  <div className="mt-1 text-[11px] text-[#047857]">{t.supportNote.byName ? `${t.supportNote.byName} · ` : ''}{when(t.supportNote.at)}{t.takenAt ? ` · taken ${when(t.takenAt)}` : ''}</div>
                </div>
              )}

              {t.lastHandback && (
                <div className="p-3.5 rounded-xl border border-[#A7F3D0] bg-[#ECFDF5]">
                  <div className="text-[12px] font-bold text-[#065F46] inline-flex items-center gap-1.5"><Undo2 className="w-4 h-4" />Support sent this back to you — call the seller</div>
                  <p className="mt-1.5 text-[13px] text-[#064E3B] whitespace-pre-wrap break-words">{t.lastHandback.note}</p>
                  <div className="mt-1 text-[11px] text-[#047857]">{t.lastHandback.byName ? `${t.lastHandback.byName} · ` : ''}{when(t.lastHandback.at)}</div>
                </div>
              )}

              <section>
                <h4 className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#94A3B8] mb-2">Issue</h4>
                <p className="text-[13px] text-[#0F172A] whitespace-pre-wrap break-words">{t.message}</p>
                {!!t.awbNumbers?.length && <p className="mt-1.5 text-[12px] text-[#64748B]">AWB: <span className="font-mono text-[#0F172A]">{t.awbNumbers.join(', ')}</span></p>}
              </section>

              <section>
                <h4 className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#94A3B8] mb-2 inline-flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" />Conversation with the seller</h4>
                {!t.messages?.length ? <p className="text-[12.5px] text-[#94A3B8]">No replies yet.</p> : (
                  <ul className="flex flex-col gap-2">
                    {t.messages.map((m, i) => (
                      <li key={i} className={`p-3 rounded-xl border text-[12.5px] ${m.sender === 'admin' ? 'bg-white border-[#E2E8F0]' : 'bg-[#F8FAFC] border-[#EEF2F6]'}`}>
                        <div className="flex items-center justify-between gap-2 text-[11px] text-[#64748B]"><span className="font-semibold">{m.sender === 'admin' ? `${m.senderName || 'Support'}` : `${m.senderName || 'Seller'} (seller)`}</span><span>{when(m.sentAt)}</span></div>
                        <p className="mt-1 text-[#0F172A] whitespace-pre-wrap break-words">{m.message}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <h4 className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#94A3B8] mb-2 inline-flex items-center gap-1.5"><StickyNote className="w-3.5 h-3.5" />Notes with Support <span className="normal-case font-semibold tracking-normal">(the seller never sees these)</span></h4>
                {!t.notes?.length ? <p className="text-[12.5px] text-[#94A3B8]">No notes yet.</p> : (
                  <ul className="flex flex-col gap-2">
                    {t.notes.map((n, i) => (
                      <li key={i} className={`p-3 rounded-xl border text-[12.5px] ${NOTE_KIND[n.kind]?.tone || NOTE_KIND.note.tone}`}>
                        <div className="flex items-center justify-between gap-2 text-[11px] opacity-80"><span className="font-bold">{n.kind === 'transfer' ? `Moved ${TEAM_NAME[n.fromTeam || 'support'] || 'Support'} → ${TEAM_NAME[n.toTeam || 'support'] || 'Support'}` : NOTE_KIND[n.kind]?.label}{n.byName ? ` · ${n.byName}` : ''}</span><span>{when(n.at)}</span></div>
                        <p className="mt-1 whitespace-pre-wrap break-words">{n.note}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </div>

        {t && canAct && (
          <div className="px-5 py-3 border-t border-[#F1F5F9] shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {sendError && <p className="mb-2 text-[12px] text-red-600">{sendError}</p>}
            {/* a ticket Support gave the sales team: when done, hand it back (or close it, solved on the call) */}
            {t.team === 'sales' && !returning && (
              <button onClick={() => { setReturning(true); setSendError(''); setReturnClose(!closed); }}
                className="mb-2 w-full h-9 rounded-full border border-[#00A86B]/40 text-[#047857] hover:bg-[#F0FDF4] text-[12.5px] font-semibold inline-flex items-center justify-center gap-1.5">
                <Undo2 className="w-4 h-4" />Done — hand back to Support
              </button>
            )}
            {t.team === 'sales' && returning && (
              <div className="mb-3 p-3 rounded-xl border border-[#A7F3D0] bg-[#ECFDF5] space-y-2">
                <textarea rows={2} maxLength={2000} value={returnNote} onChange={e => setReturnNote(e.target.value)} autoFocus
                  placeholder="What did you do / tell the seller? e.g. Called, explained the COD cycle; seller is happy" className={areaCls} />
                {!closed && (
                  <label className="flex items-center gap-2 text-[12px] text-[#065F46] cursor-pointer">
                    <input type="checkbox" checked={returnClose} onChange={e => setReturnClose(e.target.checked)} className="h-4 w-4 accent-[#047857]" />
                    Solved on the call — close the ticket
                  </label>
                )}
                <div className="flex gap-2">
                  <button onClick={sendBack} disabled={sending || returnNote.trim().length < 5}
                    className="h-9 px-4 rounded-full bg-[#047857] hover:bg-[#065F46] text-white text-[12.5px] font-semibold disabled:opacity-50 inline-flex items-center gap-1.5">
                    {sending && <Loader2 className="w-4 h-4 animate-spin" />}{returnClose && !closed ? 'Close & hand back' : 'Hand back to Support'}
                  </button>
                  <button onClick={() => { setReturning(false); setReturnNote(''); }} className="h-9 px-4 rounded-full border border-[#E2E8F0] bg-white text-[12.5px] font-semibold text-[#475569]">Cancel</button>
                </div>
              </div>
            )}
            <div className="flex items-end gap-2">
              <textarea rows={2} maxLength={2000} value={note} onChange={e => setNote(e.target.value)}
                placeholder={closed ? 'Still not solved? Tell Support what the seller said — this reopens the ticket' : 'Note to Support (e.g. seller called again, more details)'}
                className={areaCls} />
              <button onClick={send} disabled={sending || note.trim().length < 2} aria-label="Send note to Support"
                className="h-10 px-4 rounded-full bg-[#00A86B] hover:bg-[#009B63] text-white text-[12.5px] font-semibold disabled:opacity-50 inline-flex items-center gap-1.5 shrink-0">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}{closed ? 'Reopen' : 'Send'}
              </button>
            </div>
          </div>
        )}
      </motion.aside>
    </div>,
    document.body,
  );
}

// ─── Tickets tab ────────────────────────────────────────────────────────────────────────────────────────────
export function SalesTicketsTab({ viewAsId, canAct, openId, onOpenChange, onRaise, reloadKey, onToast, initialFilter }: {
  viewAsId?: string; canAct: boolean; openId: string | null; onOpenChange: (id: string | null) => void;
  onRaise: () => void; reloadKey: number; onToast: (ok: boolean, msg: string) => void; initialFilter?: 'open' | 'pool';
}) {
  // pool: the sales team's queue — tickets Support gave to Sales that nobody has taken yet
  const [filter, setFilter] = useState<'open' | 'closed' | 'all' | 'pool'>(initialFilter || 'open');
  const [bump, setBump] = useState(0);
  const refresh = useCallback(() => setBump(b => b + 1), []);
  // the answer for one request (loading = the current request has no answer yet)
  const key = `${filter}|${viewAsId || ''}|${reloadKey}|${bump}`;
  const [result, setResult] = useState<{ key: string; tickets: SalesTicket[]; pool: SalesPoolTicket[]; poolCount: number; error: string } | null>(null);
  const loading = result?.key !== key;
  const tickets = result?.tickets || [];
  const pool = result?.pool || [];
  const poolCount = result?.poolCount ?? 0;
  const error = loading ? '' : result?.error || '';

  useEffect(() => {
    let alive = true;
    salesApiClient.get('/tickets', { params: { ...(filter === 'all' ? {} : { status: filter }), ...(viewAsId ? { employeeId: viewAsId } : {}) } })
      .then(r => {
        if (!alive) return;
        const list = r.data?.tickets || [];
        setResult({ key, tickets: r.data?.pool ? [] : list, pool: r.data?.pool ? list : [], poolCount: Number(r.data?.poolCount) || 0, error: '' });
      })
      .catch(e => { if (alive) setResult(prev => ({ key, tickets: prev?.tickets || [], pool: prev?.pool || [], poolCount: prev?.poolCount || 0, error: apiError(e, 'Could not load your tickets.') })); });
    return () => { alive = false; };
  }, [filter, viewAsId, key]);

  const sentBack = tickets.filter(t => t.lastHandback && !isClosedTicket(t.status)).length;
  const FILTERS: { key: typeof filter; label: string }[] = [
    { key: 'open', label: 'Open' }, { key: 'closed', label: 'Closed' }, { key: 'all', label: 'All' }, { key: 'pool', label: 'Team queue' },
  ];
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-full border border-[#E2E8F0] bg-white p-0.5 max-w-full overflow-x-auto">
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`h-8 px-3.5 rounded-full text-[12.5px] font-semibold whitespace-nowrap transition-colors inline-flex items-center gap-1.5 ${filter === f.key ? 'bg-[#00A86B] text-white' : 'text-[#475569] hover:bg-[#F8FAFC]'}`}>
              {f.label}
              {f.key === 'pool' && poolCount > 0 && <span className={`min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${filter === 'pool' ? 'bg-white text-[#047857]' : 'bg-red-500 text-white'}`}>{poolCount}</span>}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refresh} aria-label="Refresh tickets" className="w-9 h-9 rounded-full border border-[#E2E8F0] bg-white flex items-center justify-center text-[#64748B] hover:text-[#00A86B]"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
          {canAct && <button onClick={onRaise} className="h-9 px-4 rounded-full bg-[#00A86B] hover:bg-[#009B63] text-white text-[12.5px] font-semibold inline-flex items-center gap-1.5"><LifeBuoy className="w-4 h-4" />Create ticket</button>}
        </div>
      </div>
      {filter === 'pool' && (
        <p className="text-[12.5px] text-[#64748B]">Tickets Support passed to the sales team. <b className="text-[#0F172A]">The first one to open a ticket takes it</b> — after that only they see it.</p>
      )}
      {sentBack > 0 && filter !== 'closed' && filter !== 'pool' && (
        <div className="px-4 py-3 rounded-xl border border-[#A7F3D0] bg-[#ECFDF5] text-[12.5px] text-[#065F46] inline-flex items-center gap-2">
          <Undo2 className="w-4 h-4 shrink-0" />{sentBack} ticket{sentBack === 1 ? ' was' : 's were'} sent back to you by Support — call the seller{sentBack === 1 ? '' : 's'}.
        </div>
      )}

      <div className="relative bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
        {loading && <div className="absolute inset-0 z-10"><TableLoader /></div>}
        {error ? (
          <div className="p-6 text-center text-[13px] text-red-600">{error}</div>
        ) : filter === 'pool' ? (
          !loading && pool.length === 0 ? (
            <div className="py-12 px-6 text-center">
              <span className="mx-auto w-11 h-11 rounded-full bg-[#F0FDF4] flex items-center justify-center"><Inbox className="w-5 h-5 text-[#00A86B]" /></span>
              <p className="mt-3 text-[13.5px] font-semibold text-[#0F172A]">The team queue is empty</p>
              <p className="mt-1 text-[12.5px] text-[#94A3B8]">When Support passes a ticket to the sales team, you'll hear the bell and it shows up here.</p>
            </div>
          ) : (
            <ul className="divide-y divide-[#F1F5F9]">
              {pool.map(p => (
                <li key={p._id} className="px-4 py-3.5 flex items-start gap-3">
                  <span className="mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-[#ECFDF5] text-[#047857]"><Inbox className="w-4 h-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-bold text-[#0F172A] truncate">{p.seller.company || p.seller.name}</span>
                    <span className="block text-[12px] text-[#64748B] truncate mt-0.5">#{p.ticketNumber} · {p.subcategory}{p.mode === 'cargo' ? ' · Cargo' : ''}</span>
                    {p.supportNote && <span className="block text-[12px] text-[#065F46] mt-0.5 line-clamp-2 break-words">“{p.supportNote.note}”{p.supportNote.byName ? ` — ${p.supportNote.byName}` : ''}</span>}
                    <span className="block text-[11px] text-[#94A3B8] mt-0.5">passed to Sales {when(p.movedAt || p.createdAt)}</span>
                  </span>
                  {canAct && (
                    <button onClick={() => onOpenChange(p._id)} className="h-9 px-4 rounded-full bg-[#00A86B] hover:bg-[#009B63] text-white text-[12.5px] font-semibold shrink-0">Open &amp; take</button>
                  )}
                </li>
              ))}
            </ul>
          )
        ) : !loading && tickets.length === 0 ? (
          <div className="py-12 px-6 text-center">
            <span className="mx-auto w-11 h-11 rounded-full bg-[#F0FDF4] flex items-center justify-center"><Inbox className="w-5 h-5 text-[#00A86B]" /></span>
            <p className="mt-3 text-[13.5px] font-semibold text-[#0F172A]">{filter === 'closed' ? 'No closed tickets' : 'No open tickets'}</p>
            <p className="mt-1 text-[12.5px] text-[#94A3B8]">When a seller tells you about a problem on a call, create a ticket and Support takes it from there.</p>
          </div>
        ) : (
          <ul className="divide-y divide-[#F1F5F9]">
            {tickets.map(t => (
              <li key={t._id}>
                <button onClick={() => onOpenChange(t._id)} className="w-full text-left px-4 py-3.5 hover:bg-[#F8FAFC] transition-colors flex items-start gap-3">
                  <span className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${t.lastHandback && !isClosedTicket(t.status) ? 'bg-[#ECFDF5] text-[#047857]' : isClosedTicket(t.status) ? 'bg-[#F0FDF4] text-[#00A86B]' : 'bg-amber-50 text-amber-600'}`}>
                    {t.lastHandback && !isClosedTicket(t.status) ? <Undo2 className="w-4 h-4" /> : isClosedTicket(t.status) ? <CheckCircle2 className="w-4 h-4" /> : <LifeBuoy className="w-4 h-4" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 flex-wrap">
                      <span className="text-[13px] font-bold text-[#0F172A] truncate">{t.seller.company || t.seller.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold ${STATUS[t.status]?.tone}`}>{STATUS[t.status]?.label}</span>
                      {t.team === 'tech' && <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-indigo-50 text-indigo-700">Tech</span>}
                      {t.team === 'sales' && !isClosedTicket(t.status) && <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-[#ECFDF5] text-[#047857]">With you</span>}
                      {t.origin === 'taken' && <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-slate-100 text-slate-600">From team queue</span>}
                      {t.lastHandback && !isClosedTicket(t.status) && <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-[#ECFDF5] text-[#047857]">Sent back to you</span>}
                    </span>
                    <span className="block text-[12px] text-[#64748B] truncate mt-0.5">#{t.ticketNumber} · {t.subcategory}</span>
                    {t.lastHandback && !isClosedTicket(t.status) && <span className="block text-[12px] text-[#065F46] truncate mt-0.5">“{t.lastHandback.note}”</span>}
                  </span>
                  <span className="text-[11px] text-[#94A3B8] whitespace-nowrap shrink-0 text-right">{when(t.lastRepliedAt || t.createdAt)}{t.replies > 0 && <span className="block">{t.replies} repl{t.replies === 1 ? 'y' : 'ies'}</span>}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {openId && <TicketDrawer id={openId} viewAsId={viewAsId} canAct={canAct} onClose={() => { onOpenChange(null); refresh(); }}
        onChanged={msg => { if (msg) onToast(true, msg); refresh(); }} />}
    </div>
  );
}
