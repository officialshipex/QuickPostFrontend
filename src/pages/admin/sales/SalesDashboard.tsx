import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  PhoneCall, PhoneOutgoing, CalendarClock, UserPlus, UserCheck, PackageCheck, Package, Target,
  Search, Copy, Check, Link2, X, AlertCircle, TrendingUp, Users, Clock, RefreshCw, Phone, MessageCircle, ChevronDown,
  Wallet, BadgePercent, Plus, Eye, Gift, type LucideIcon,
} from 'lucide-react';
import { AdminLayout } from '../../../components/admin/layout/AdminLayout';
import { useAdminTab } from '../../../context/AdminUserContext';
import { useDashboardFilters } from '../../../context/DashboardFilterContext';
import { TableLoader } from '../../../components/ui/TableLoader';
import { Toast } from '../../../components/ui/Toast';
import { useToast } from '../../../hooks/useToast';
import { copyToClipboard } from '../../../utils/clipboard';
import {
  salesApiClient, pct, CALL_STATUS_LABEL, CALL_OUTCOME_LABEL, apiError, referralLinkFor, inr,
  type SalesOverview, type SalesCall, type ReferredSeller, type SalesPerformance, type TeamMember, FUNNEL_STAGES, LEAD_STAGE_LABEL, type LeadStage,
  type CallStatus, type CallOutcome, type SalesMe, type SalesEarnings, type RateOffer,
} from '../../../services/salesApi';
import { SalesKycGate, OfferLetterCard } from './SalesKycGate';
import { SalesEarningsTab, BadgeChip } from './SalesEarningsTab';
import { SalesRatesTab, AssignRateDialog, SellerDetailDialog } from './SalesRatesTab';

/* Sales module — one page, tabbed: Overview · My Leads · My Sellers · Earnings · Rates · Performance (+ Team for the owner).
   A sales person sees only their own leads and the sellers who registered with their referral code (read-only);
   nothing loads until their KYC is verified (SalesKycGate). The owner opens a person's view from Sales Management. */

type Tab = 'overview' | 'calls' | 'sellers' | 'earnings' | 'rates' | 'performance' | 'team';

const card = 'bg-white rounded-2xl border border-[#EEF2F6] shadow-[0_1px_2px_rgba(16,24,40,0.04),0_2px_8px_rgba(16,24,40,0.05)]';
const n = (v?: number) => (v ?? 0).toLocaleString('en-IN');
const fmtDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
const fmtDateTime = (iso?: string) => (iso ? new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true }) : '—');


const STATUS_TONE: Record<CallStatus, string> = {
  assigned: 'bg-sky-50 text-sky-700 border-sky-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  follow_up: 'bg-violet-50 text-violet-700 border-violet-200',
  unreachable: 'bg-slate-100 text-slate-600 border-slate-200',
};

// ── Seller funnel: stage bars sized to the first stage, % of previous, biggest drop-off flagged ──
function SellerFunnel({ funnel, rangeLabel }: { funnel?: SalesOverview['funnel']; rangeLabel: string }) {
  const stages = FUNNEL_STAGES.map(s => ({ ...s, value: funnel?.[s.key] || 0 }));
  const max = Math.max(...stages.map(s => s.value), 0);
  const conv = stages.map((s, i) => (i === 0 ? null : pct(s.value, stages[i - 1].value)));
  let drop = -1;
  if (max > 0) conv.forEach((c, i) => { if (c !== null && stages[i - 1].value > 0 && (drop < 0 || c < (conv[drop] ?? 101))) drop = i; });
  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h2 className="text-[14px] font-bold text-[#0F172A]">Seller funnel <span className="font-medium text-[#94A3B8]">· {rangeLabel}</span></h2>
        {drop > 0 && (
          <span className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-[11.5px] font-semibold text-amber-700">
            Biggest drop-off: {stages[drop - 1].label} → {stages[drop].label} ({conv[drop]}%)
          </span>
        )}
      </div>
      <div className="overflow-x-auto -mx-1 px-1">
        <div className="grid grid-cols-8 gap-2 md:gap-3 min-w-[640px]">
          {stages.map((s, i) => {
            const h = max > 0 ? Math.max(14, Math.round((s.value / max) * 100)) : 14;
            const isDrop = i === drop;
            return (
              <div key={s.key} className="flex flex-col items-center min-w-0">
                <span className={`text-[11px] font-semibold mb-1 whitespace-nowrap ${isDrop ? 'text-amber-700' : 'text-[#64748B]'}`}>{i === 0 ? 'Start' : `${conv[i]}% of prev`}</span>
                <div className="relative w-full h-[120px] flex items-end">
                  <motion.div
                    initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ duration: 0.5, delay: i * 0.05, ease: 'easeOut' }}
                    title={`${s.label}: ${s.value.toLocaleString('en-IN')}`}
                    className={`w-full rounded-t-lg flex justify-center pt-1.5 ${max === 0 ? 'bg-[#F1F5F9]' : isDrop ? 'bg-amber-600' : 'bg-[#00A86B]'}`}>
                    <span className={`text-[13px] font-bold tabular-nums ${max === 0 ? 'text-[#94A3B8]' : 'text-white'}`}>{s.value.toLocaleString('en-IN')}</span>
                  </motion.div>
                </div>
                <span className="mt-2 text-[12px] font-medium text-[#475569] text-center truncate w-full">{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>
      {max === 0 && <p className="mt-3 text-[12px] text-[#94A3B8] text-center">Funnel data will appear once leads are assigned to you.</p>}
    </div>
  );
}

function Kpi({ label, value, sub, icon: Icon, tone }: { label: string; value: string; sub?: string; icon: LucideIcon; tone: string }) {
  return (
    <div className={`${card} px-4 py-3.5 flex items-start justify-between gap-3`}>
      <div className="min-w-0">
        <div className="text-[12px] font-medium text-[#64748B] truncate">{label}</div>
        <div className="text-[22px] font-bold text-[#0F172A] tabular-nums leading-tight mt-0.5">{value}</div>
        {sub && <div className="text-[11.5px] text-[#94A3B8] mt-0.5 truncate">{sub}</div>}
      </div>
      <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${tone}`}><Icon className="w-[18px] h-[18px]" /></span>
    </div>
  );
}

function Progress({ label, t }: { label: string; t?: { target: number; achieved: number } }) {
  const p = Math.min(100, pct(t?.achieved, t?.target));
  return (
    <div>
      <div className="flex items-center justify-between text-[12.5px]">
        <span className="font-medium text-[#334155]">{label}</span>
        <span className="tabular-nums text-[#64748B]"><span className="font-semibold text-[#0F172A]">{n(t?.achieved)}</span> / {n(t?.target)}</span>
      </div>
      <div className="mt-1.5 h-2 rounded-full bg-[#F1F5F9] overflow-hidden"><div className="h-full rounded-full bg-[#00A86B] transition-all" style={{ width: `${p}%` }} /></div>
      <div className="text-[11px] text-[#94A3B8] mt-1">{t?.target ? `${p}% of target` : 'No target set'}</div>
    </div>
  );
}

function Empty({ icon: Icon, title, body }: { icon: LucideIcon; title: string; body: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      <span className="w-12 h-12 rounded-2xl bg-[#F1F5F9] flex items-center justify-center"><Icon className="w-6 h-6 text-[#94A3B8]" /></span>
      <p className="mt-3 text-[13px] font-semibold text-[#0F172A]">{title}</p>
      <p className="text-[12px] text-[#94A3B8] mt-0.5 max-w-[320px]">{body}</p>
    </div>
  );
}

function Funnel({ steps }: { steps: { label: string; value: number; rate?: string }[] }) {
  const max = Math.max(...steps.map(s => s.value), 1);
  return (
    <div className="space-y-3">
      {steps.map(s => (
        <div key={s.label}>
          <div className="flex items-center justify-between text-[12.5px]">
            <span className="text-[#334155] font-medium">{s.label}</span>
            <span className="tabular-nums"><span className="font-semibold text-[#0F172A]">{n(s.value)}</span>{s.rate && <span className="text-[#94A3B8] ml-1.5">{s.rate}</span>}</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-[#F1F5F9] overflow-hidden"><div className="h-full rounded-full bg-[#00A86B]/80" style={{ width: `${(s.value / max) * 100}%` }} /></div>
        </div>
      ))}
    </div>
  );
}

// ── Call update dialog: a call can only be completed with an outcome ──────────
// ── Priority queue: who to contact next, ranked by urgency (overdue → today → upcoming), with filters ──
const STAGE_TONE: Record<LeadStage, string> = {
  lead: 'bg-[#F1F5F9] text-[#475569]', interested: 'bg-sky-50 text-sky-700', callback: 'bg-emerald-50 text-emerald-700',
  kyc_pending: 'bg-amber-50 text-amber-700', first_shipment_due: 'bg-violet-50 text-violet-700', onboarded: 'bg-[#F0FDF4] text-[#00A86B]',
};
const PRIORITY_RANK = { high: 0, medium: 1, low: 2 } as const;
type DueBucket = 'overdue' | 'today' | 'upcoming' | 'none';
const dayStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
function dueInfo(iso?: string): { bucket: DueBucket; label: string; tone: string } {
  if (!iso) return { bucket: 'none', label: 'No date', tone: 'bg-[#F8FAFC] text-[#94A3B8]' };
  const d = new Date(iso); const now = new Date();
  const days = Math.round((dayStart(d) - dayStart(now)) / 86400000);
  const time = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase();
  if (d < now) return { bucket: 'overdue', label: days < 0 ? `Overdue ${-days}d` : `Overdue · ${time}`, tone: 'bg-red-50 text-red-600' };
  if (days === 0) return { bucket: 'today', label: `Today ${time}`, tone: 'bg-amber-50 text-amber-700' };
  if (days === 1) return { bucket: 'upcoming', label: 'Tomorrow', tone: 'bg-[#F1F5F9] text-[#475569]' };
  return { bucket: 'upcoming', label: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }), tone: 'bg-[#F1F5F9] text-[#475569]' };
}
const leadStage = (c: SalesCall): LeadStage => c.stage || (c.status === 'follow_up' ? 'callback' : c.outcome === 'interested' ? 'interested' : 'lead');
const waLink = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  return `https://wa.me/${digits.length === 10 ? `91${digits}` : digits}`;
};

function PriorityQueue({ calls, onUpdate, onViewAll, readOnly }: { calls: SalesCall[]; onUpdate: (c: SalesCall) => void; onViewAll: () => void; readOnly?: boolean }) {
  const [bucket, setBucket] = useState<'all' | DueBucket>('all');
  const [stage, setStage] = useState<'all' | LeadStage>('all');
  const [sort, setSort] = useState<'urgency' | 'priority' | 'name'>('urgency');
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(false);

  const open = useMemo(() => calls.filter(c => c.status !== 'completed').map(c => ({ c, due: dueInfo(c.followUpAt), stage: leadStage(c) })), [calls]);
  const counts = useMemo(() => {
    const k: Record<'all' | DueBucket, number> = { all: open.length, overdue: 0, today: 0, upcoming: 0, none: 0 };
    open.forEach(r => { k[r.due.bucket]++; });
    return k;
  }, [open]);
  const rows = useMemo(() => {
    const ql = query.trim().toLowerCase();
    const BUCKET_RANK: Record<DueBucket, number> = { overdue: 0, today: 1, upcoming: 2, none: 3 };
    const time = (iso?: string) => (iso ? new Date(iso).getTime() : Infinity);
    return open
      .filter(r => (bucket === 'all' || r.due.bucket === bucket) && (stage === 'all' || r.stage === stage)
        && (!ql || [r.c.leadName, r.c.businessName, r.c.city, r.c.category, r.c.phone, r.c.lastNote].some(v => (v || '').toLowerCase().includes(ql))))
      .sort((a, b) => {
        if (sort === 'name') return (a.c.businessName || a.c.leadName).localeCompare(b.c.businessName || b.c.leadName);
        const pa = PRIORITY_RANK[a.c.priority || 'medium'], pb = PRIORITY_RANK[b.c.priority || 'medium'];
        if (sort === 'priority' && pa !== pb) return pa - pb;
        return BUCKET_RANK[a.due.bucket] - BUCKET_RANK[b.due.bucket] || time(a.c.followUpAt) - time(b.c.followUpAt) || pa - pb;
      });
  }, [open, bucket, stage, sort, query]);
  const shown = expanded ? rows : rows.slice(0, 6);

  const chips: { key: 'all' | DueBucket; label: string; dot?: string }[] = [
    { key: 'all', label: 'All' }, { key: 'overdue', label: 'Overdue', dot: 'bg-red-500' }, { key: 'today', label: 'Today', dot: 'bg-amber-500' },
    { key: 'upcoming', label: 'Upcoming', dot: 'bg-slate-400' }, { key: 'none', label: 'No date' },
  ];
  const select = 'h-8 pl-2.5 pr-7 rounded-lg border border-[#E2E8F0] bg-white text-[12.5px] font-medium text-[#475569] outline-none focus:border-[#00A86B] appearance-none cursor-pointer';
  const contact = (c: SalesCall) => (
    <div className="flex items-center gap-1.5 justify-end">
      <a href={`tel:${c.phone}`} title={`Call ${c.phone}`} aria-label={`Call ${c.leadName}`}
        className="w-9 h-9 rounded-xl bg-[#00A86B] hover:bg-[#00965F] text-white flex items-center justify-center transition-colors"><Phone className="w-4 h-4" /></a>
      <a href={waLink(c.phone)} target="_blank" rel="noopener noreferrer" title="Message on WhatsApp" aria-label={`Message ${c.leadName}`}
        className="w-9 h-9 rounded-xl border border-[#E2E8F0] bg-white hover:border-[#00A86B]/40 hover:text-[#00A86B] text-[#475569] flex items-center justify-center transition-colors"><MessageCircle className="w-4 h-4" /></a>
      {!readOnly && <button type="button" onClick={() => onUpdate(c)} title="Log call outcome"
        className="h-9 px-3 rounded-xl border border-[#E2E8F0] text-[12px] font-semibold text-[#475569] hover:border-[#00A86B]/40 hover:text-[#00A86B]">Log</button>}
    </div>
  );
  const seller = (c: SalesCall) => (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5">
        {c.priority === 'high' && <span title="High priority" className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />}
        <span className="text-[13px] font-bold text-[#0F172A] truncate">{c.businessName || c.leadName}</span>
      </div>
      <div className="text-[11.5px] text-[#94A3B8] truncate">{[c.businessName ? c.leadName : null, c.city, c.category].filter(Boolean).join(' · ') || c.phone}</div>
    </div>
  );

  return (
    <div className={`${card} overflow-hidden`}>
      <div className="px-5 pt-4 pb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-[14px] font-bold text-[#0F172A]">Priority queue</h2>
          <p className="text-[12px] text-[#94A3B8]">{counts.overdue > 0 ? `${counts.overdue} overdue · ` : ''}{counts.today} due today · {counts.all} open</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select value={sort} onChange={e => setSort(e.target.value as typeof sort)} className={select} aria-label="Sort queue">
              <option value="urgency">Sorted by urgency</option>
              <option value="priority">Sorted by priority</option>
              <option value="name">Sorted by name</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <button onClick={onViewAll} className="text-[12.5px] font-semibold text-[#00A86B] hover:underline">View all</button>
        </div>
      </div>

      <div className="px-5 pb-3 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1.5">
          {chips.map(ch => (
            <button key={ch.key} type="button" onClick={() => setBucket(ch.key)}
              className={`h-7 px-2.5 rounded-full border text-[12px] font-semibold inline-flex items-center gap-1.5 transition-colors ${bucket === ch.key ? 'bg-[#0F172A] border-[#0F172A] text-white' : 'bg-white border-[#E2E8F0] text-[#475569] hover:border-[#CBD5E1]'}`}>
              {ch.dot && <span className={`w-1.5 h-1.5 rounded-full ${ch.dot}`} />}{ch.label}
              <span className={`tabular-nums ${bucket === ch.key ? 'text-white/70' : 'text-[#94A3B8]'}`}>{counts[ch.key]}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto w-full sm:w-auto">
          <div className="relative">
            <select value={stage} onChange={e => setStage(e.target.value as typeof stage)} className={select} aria-label="Filter by stage">
              <option value="all">All stages</option>
              {(Object.keys(LEAD_STAGE_LABEL) as LeadStage[]).map(k => <option key={k} value={k}>{LEAD_STAGE_LABEL[k]}</option>)}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search seller, city, note…"
              className="w-full h-8 pl-8 pr-2.5 rounded-lg border border-[#E2E8F0] text-[12.5px] outline-none focus:border-[#00A86B]" />
          </div>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="border-t border-[#F1F5F9]">
          <Empty icon={PhoneCall} title={open.length ? 'Nothing matches these filters' : 'Your queue is clear'}
            body={open.length ? 'Try another due filter, stage or search.' : 'Assigned leads and follow-ups will be ranked here by urgency.'} />
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto border-t border-[#F1F5F9]">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[11.5px] font-semibold text-[#64748B] bg-[#FAFBFC]">
                  <th className="py-2.5 px-4">Seller</th>
                  <th className="py-2.5 px-4">Stage</th>
                  <th className="py-2.5 px-4">Last note</th>
                  <th className="py-2.5 px-4">Due</th>
                  <th className="py-2.5 px-4 text-right">Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {shown.map(({ c, due, stage: st }) => (
                  <tr key={c._id} className={`hover:bg-[#FAFBFC] transition-colors ${due.bucket === 'overdue' ? 'shadow-[inset_3px_0_0_#EF4444]' : ''}`}>
                    <td className="py-3 px-4 max-w-[220px]">{seller(c)}</td>
                    <td className="py-3 px-4"><span className={`px-2.5 py-1 rounded-full text-[11.5px] font-semibold whitespace-nowrap ${STAGE_TONE[st]}`}>{LEAD_STAGE_LABEL[st]}</span></td>
                    <td className="py-3 px-4 max-w-[280px]"><p className="text-[12.5px] text-[#475569] line-clamp-2" title={c.lastNote}>{c.lastNote || <span className="text-[#CBD5E1]">No notes yet</span>}</p></td>
                    <td className="py-3 px-4"><span className={`px-2 py-1 rounded-md text-[11.5px] font-semibold whitespace-nowrap ${due.tone}`}>{due.label}</span></td>
                    <td className="py-3 px-4">{contact(c)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile cards */}
          <ul className="md:hidden divide-y divide-[#F1F5F9] border-t border-[#F1F5F9]">
            {shown.map(({ c, due, stage: st }) => (
              <li key={c._id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  {seller(c)}
                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold whitespace-nowrap shrink-0 ${due.tone}`}>{due.label}</span>
                </div>
                <div className="mt-1.5 flex items-center gap-2 min-w-0">
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${STAGE_TONE[st]}`}>{LEAD_STAGE_LABEL[st]}</span>
                  <p className="text-[12px] text-[#64748B] truncate">{c.lastNote || 'No notes yet'}</p>
                </div>
                <div className="mt-2">{contact(c)}</div>
              </li>
            ))}
          </ul>
          {rows.length > 6 && (
            <button type="button" onClick={() => setExpanded(e => !e)}
              className="w-full py-2.5 border-t border-[#F1F5F9] text-[12.5px] font-semibold text-[#00A86B] hover:bg-[#F0FDF4] inline-flex items-center justify-center gap-1">
              {expanded ? 'Show less' : `Show all ${rows.length}`}<ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
          )}
        </>
      )}
    </div>
  );
}

function CallUpdateDialog({ call, onClose, onSaved }: { call: SalesCall; onClose: () => void; onSaved: (msg: string, ok: boolean) => void }) {
  const [status, setStatus] = useState<CallStatus>(call.status);
  const [outcome, setOutcome] = useState<CallOutcome | ''>(call.outcome || '');
  const [note, setNote] = useState('');
  const [followUpAt, setFollowUpAt] = useState(call.followUpAt ? call.followUpAt.slice(0, 16) : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    if (status === 'completed' && !outcome) { setError('Record an outcome before marking the lead completed.'); return; }
    if (status === 'follow_up' && !followUpAt) { setError('Pick a follow-up date and time.'); return; }
    setSaving(true); setError('');
    try {
      await salesApiClient.patch(`/calls/${call._id}`, { status, outcome: outcome || undefined, note: note.trim() || undefined, followUpAt: followUpAt || undefined });
      onSaved('Lead updated', true);
      onClose();
    } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      setError(e?.response?.data?.message || 'Could not update the lead.');
    } finally { setSaving(false); }
  };

  const fieldCls = 'w-full h-10 px-3.5 rounded-xl border border-[#E2E8F0] text-[13px] text-[#0F172A] bg-white focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]';
  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative w-full max-w-md bg-white rounded-2xl shadow-[0_24px_64px_-16px_rgba(15,23,42,0.35)]">
        <div className="px-5 py-4 border-b border-[#F1F5F9] flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-[15px] font-bold text-[#0F172A]">Update lead</h3>
            <p className="text-[12px] text-[#64748B] truncate">{call.leadName}{call.businessName ? ` · ${call.businessName}` : ''} · {call.phone}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-full flex items-center justify-center text-[#94A3B8] hover:bg-[#F1F5F9]"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          {error && <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-100 text-[12.5px] text-red-600"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value as CallStatus)} className={fieldCls}>
                {(Object.keys(CALL_STATUS_LABEL) as CallStatus[]).map(s => <option key={s} value={s}>{CALL_STATUS_LABEL[s]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Outcome {status === 'completed' && <span className="text-red-500">*</span>}</label>
              <select value={outcome} onChange={e => setOutcome(e.target.value as CallOutcome)} className={fieldCls}>
                <option value="">Select outcome</option>
                {(Object.keys(CALL_OUTCOME_LABEL) as CallOutcome[]).map(o => <option key={o} value={o}>{CALL_OUTCOME_LABEL[o]}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Follow-up {status === 'follow_up' && <span className="text-red-500">*</span>}</label>
            <input type="datetime-local" value={followUpAt} onChange={e => setFollowUpAt(e.target.value)} className={fieldCls} />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Note</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="What was discussed, next step…"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-[13px] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B] resize-none" />
            {call.lastNote && <p className="text-[11.5px] text-[#94A3B8] mt-1">Last note: {call.lastNote}</p>}
          </div>
        </div>
        <div className="px-5 py-3.5 border-t border-[#F1F5F9] flex justify-end gap-2.5">
          <button onClick={onClose} className="h-10 px-5 rounded-full border border-[#E2E8F0] text-[13px] font-semibold text-[#475569] hover:bg-[#F8FAFC]">Cancel</button>
          <button onClick={save} disabled={saving} className="h-10 px-6 rounded-full bg-[#00A86B] hover:bg-[#009B63] text-white text-[13px] font-semibold disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}

// ── Add a lead (the sales person's own prospects) ───────────────────────────
function AddLeadDialog({ onClose, onSaved }: { onClose: () => void; onSaved: (msg: string) => void }) {
  const [f, setF] = useState({ leadName: '', businessName: '', phone: '', city: '', category: '', priority: 'medium', followUpAt: '', note: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k: keyof typeof f, v: string) => setF(p => ({ ...p, [k]: v }));
  const save = async () => {
    setSaving(true); setError('');
    try {
      await salesApiClient.post('/calls', { ...f, followUpAt: f.followUpAt || undefined });
      onSaved('Lead added');
      onClose();
    } catch (e) { setError(apiError(e, 'Could not add the lead.')); } finally { setSaving(false); }
  };
  const fieldCls = 'w-full h-10 px-3.5 rounded-xl border border-[#E2E8F0] text-[13px] text-[#0F172A] bg-white focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]';
  const field = (k: keyof typeof f, label: string, props: Record<string, unknown> = {}) => (
    <div><label className="block text-[12px] font-semibold text-[#475569] mb-1.5">{label}</label><input value={f[k]} onChange={e => set(k, e.target.value)} className={fieldCls} {...props} /></div>
  );
  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="relative w-full max-w-lg bg-white rounded-2xl shadow-[0_24px_64px_-16px_rgba(15,23,42,0.35)]">
        <div className="px-5 py-4 border-b border-[#F1F5F9] flex items-center justify-between">
          <h3 className="text-[15px] font-bold text-[#0F172A]">Add lead</h3>
          <button onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-full flex items-center justify-center text-[#94A3B8] hover:bg-[#F1F5F9]"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {error && <div className="sm:col-span-2 flex items-start gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-100 text-[12.5px] text-red-600"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{error}</div>}
          {field('leadName', 'Contact name *')}
          {field('phone', 'Phone *', { inputMode: 'tel', placeholder: '10-digit mobile' })}
          {field('businessName', 'Business name')}
          {field('city', 'City')}
          {field('category', 'Category')}
          <div><label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Priority</label>
            <select value={f.priority} onChange={e => set('priority', e.target.value)} className={fieldCls}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></div>
          <div className="sm:col-span-2">{field('followUpAt', 'Follow-up', { type: 'datetime-local' })}</div>
          <div className="sm:col-span-2">{field('note', 'Note')}</div>
        </div>
        <div className="px-5 py-3.5 border-t border-[#F1F5F9] flex justify-end gap-2.5">
          <button onClick={onClose} className="h-10 px-5 rounded-full border border-[#E2E8F0] text-[13px] font-semibold text-[#475569] hover:bg-[#F8FAFC]">Cancel</button>
          <button onClick={save} disabled={saving} className="h-10 px-6 rounded-full bg-[#00A86B] hover:bg-[#009B63] text-white text-[13px] font-semibold disabled:opacity-50">{saving ? 'Saving…' : 'Add lead'}</button>
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}

const BONUS_TONE: Record<string, string> = { earned: 'text-[#00A86B]', paid: 'text-emerald-700', pending: 'text-amber-700', expired: 'text-[#94A3B8]' };

/** `viewAs`: owner viewing one sales executive's dashboard (Sales Management) — every request is scoped with ?employeeId. */
export function SalesDashboard({ viewAs }: { viewAs?: { id: string; name: string } } = {}) {
  if (viewAs) return <SalesDashboardBody viewAs={viewAs} />;
  return (
    <AdminLayout>
      <SalesKycGate><SalesDashboardBody /></SalesKycGate>
    </AdminLayout>
  );
}

function SalesDashboardBody({ viewAs }: { viewAs?: { id: string; name: string } }) {
  const { isEmployee, isAdmin, userName } = useAdminTab();
  const isSalesAdmin = isAdmin && !isEmployee && !viewAs;
  const viewAsId = viewAs?.id;
  // Leads and rates are the sales person's own work; the owner's view is read-only
  const canAct = !viewAs && isEmployee;
  const { toast, showToast, closeToast } = useToast();
  const [tab, setTab] = useState<Tab>('overview');
  // Date range comes from the navbar date filter (shared dashboard filter).
  const { filters } = useDashboardFilters();
  const fromISO = filters.dateRange.start.toISOString();
  const toISO = filters.dateRange.end.toISOString();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<SalesOverview>({});
  const [calls, setCalls] = useState<SalesCall[]>([]);
  const [sellers, setSellers] = useState<ReferredSeller[]>([]);
  const [perf, setPerf] = useState<SalesPerformance>({});
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [me, setMe] = useState<SalesMe | null>(null);
  const [earnings, setEarnings] = useState<SalesEarnings>({});
  const [offers, setOffers] = useState<RateOffer[]>([]);
  const [addingLead, setAddingLead] = useState(false);
  const [assigning, setAssigning] = useState<ReferredSeller | null>(null);
  const [viewing, setViewing] = useState<string | null>(null);
  const referral = { referralId: me?.referralId, referralLink: referralLinkFor(me?.referralId) };
  const [callFilter, setCallFilter] = useState<'all' | CallStatus>('all');
  const [sellerFilter, setSellerFilter] = useState<'all' | 'new' | 'kyc_pending' | 'onboarding' | 'active' | 'inactive' | 'no_first_order'>('all');
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<SalesCall | null>(null);
  const [copied, setCopied] = useState('');

  // Bump to refetch (Refresh button, after saving a call).
  const [reloadKey, setReloadKey] = useState(0);
  const load = useCallback(() => { setLoading(true); setReloadKey(k => k + 1); }, []);

  useEffect(() => {
    let alive = true;
    const scope = viewAsId ? { employeeId: viewAsId } : {};
    const params = { from: fromISO, to: toISO, ...scope };
    const person = !isSalesAdmin; // the owner's own page (no person picked) only has the team view
    const none = Promise.resolve({ data: {} });
    Promise.allSettled([
      salesApiClient.get('/overview', { params }),
      person ? salesApiClient.get('/calls', { params: { limit: 300, ...scope } }) : none,
      person ? salesApiClient.get('/sellers', { params: scope }) : none,
      salesApiClient.get('/performance', { params }),
      salesApiClient.get('/me', { params: scope }),
      isSalesAdmin ? salesApiClient.get('/team', { params }) : none,
      person ? salesApiClient.get('/earnings', { params: scope }) : none,
      person ? salesApiClient.get('/rate-offers', { params: scope }) : none,
    ]).then(([ov, cl, se, pf, mo, tm, ea, ro]) => {
      if (!alive) return;
      if (ov.status === 'fulfilled') setOverview(ov.value.data || {});
      if (cl.status === 'fulfilled') setCalls(cl.value.data?.calls || []);
      if (se.status === 'fulfilled') setSellers(se.value.data?.sellers || []);
      if (pf.status === 'fulfilled') setPerf(pf.value.data || {});
      if (mo.status === 'fulfilled') setMe(mo.value.data || null);
      if (tm.status === 'fulfilled') setTeam(tm.value.data?.members || []);
      if (ea.status === 'fulfilled') setEarnings(ea.value.data || {});
      if (ro.status === 'fulfilled') setOffers(ro.value.data?.offers || []);
      setLoading(false);
    });
    return () => { alive = false; };
  }, [fromISO, toISO, isSalesAdmin, viewAsId, reloadKey]);

  const copy = async (key: string, value?: string) => {
    if (!value) return;
    if (await copyToClipboard(value)) { setCopied(key); setTimeout(() => setCopied(''), 1500); }
  };

  const tabs: { key: Tab; label: string; icon: LucideIcon }[] = isSalesAdmin ? [
    { key: 'overview', label: 'Overview', icon: TrendingUp },
    { key: 'team', label: 'Team', icon: Users },
  ] : [
    { key: 'overview', label: 'Overview', icon: TrendingUp },
    { key: 'calls', label: viewAs ? 'Leads' : 'My Leads', icon: PhoneCall },
    { key: 'sellers', label: viewAs ? 'Sellers' : 'My Sellers', icon: UserPlus },
    { key: 'earnings', label: 'Earnings', icon: Wallet },
    { key: 'rates', label: 'Rates', icon: BadgePercent },
    { key: 'performance', label: 'Performance', icon: Target },
  ];

  const ql = q.trim().toLowerCase();
  const visibleCalls = useMemo(() => calls.filter(c =>
    (callFilter === 'all' || c.status === callFilter) &&
    (!ql || [c.leadName, c.businessName, c.phone].some(v => (v || '').toLowerCase().includes(ql)))), [calls, callFilter, ql]);
  const visibleSellers = useMemo(() => sellers.filter(s => {
    const f = sellerFilter;
    const ok = f === 'all' || (f === 'new' && s.onboardingStatus === 'registered') || (f === 'kyc_pending' && s.kycStatus !== 'verified')
      || (f === 'onboarding' && s.onboardingStatus === 'in_progress') || (f === 'active' && s.active) || (f === 'inactive' && !s.active)
      || (f === 'no_first_order' && !s.firstOrderAt);
    return ok && (!ql || [s.name, s.businessName, s.phone].some(v => (v || '').toLowerCase().includes(ql)));
  }), [sellers, sellerFilter, ql]);

  const ov = overview;
  const rangeLabel = filters.dateRange.label;

  const cur = earnings.current;
  return (
    <>
      <Toast toast={toast} onClose={closeToast} />
      <div className="flex flex-col h-[calc(100vh-72px)] -m-4 md:-m-6 bg-[#F8FAFC] overflow-y-auto">
        <div className="px-4 md:px-6 pt-5 pb-8 flex flex-col gap-5">
          {/* Title */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-10 h-10 rounded-xl bg-[#F0FDF4] text-[#00A86B] flex items-center justify-center shrink-0"><Target className="w-5 h-5" /></span>
              <div className="min-w-0">
                <h1 className="text-[18px] font-bold text-[#0F172A] flex items-center gap-2 flex-wrap">{isSalesAdmin ? 'Sales — Team overview' : viewAs ? `${viewAs.name}'s Sales Dashboard` : 'Sales Dashboard'}{cur?.badge && <BadgeChip badge={cur.badge} color={cur.badgeColor} />}</h1>
                <p className="text-[12.5px] text-[#64748B] truncate">{isSalesAdmin ? 'Leads, referred sellers and targets across the sales team.' : viewAs ? 'Leads, referred sellers, funnel and targets for this sales person.' : `Welcome back${userName ? `, ${userName.split(' ')[0]}` : ''} — here's your day.`}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={load} aria-label="Refresh" className="w-10 h-10 rounded-full border border-[#E2E8F0] bg-white flex items-center justify-center text-[#64748B] hover:text-[#00A86B]">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto border-b border-[#E2E8F0]">
            {tabs.map(t => (
              <button key={t.key} onClick={() => { setTab(t.key); setQ(''); }}
                className={`relative h-10 px-3.5 inline-flex items-center gap-1.5 text-[13px] font-semibold whitespace-nowrap transition-colors ${tab === t.key ? 'text-[#00A86B]' : 'text-[#64748B] hover:text-[#0F172A]'}`}>
                <t.icon className="w-4 h-4" />{t.label}
                {tab === t.key && <motion.span layoutId="sales-tab" className="absolute left-2 right-2 -bottom-px h-0.5 rounded-full bg-[#00A86B]" />}
              </button>
            ))}
          </div>

          <div className="relative">
            {loading && <div className="absolute inset-0 z-10"><TableLoader /></div>}

            {/* ── Overview ── */}
            {tab === 'overview' && (
              <div className="flex flex-col gap-5">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                  <Kpi label="Assigned leads" value={n(ov.calls?.assigned)} sub={rangeLabel} icon={PhoneCall} tone="bg-sky-50 text-sky-600" />
                  <Kpi label="Leads completed" value={n(ov.calls?.completed)} sub={`${n(ov.calls?.pending)} pending`} icon={PhoneOutgoing} tone="bg-emerald-50 text-emerald-600" />
                  <Kpi label="Follow-ups due" value={n(ov.followUps?.dueToday)} sub={`${n(ov.followUps?.overdue)} overdue`} icon={CalendarClock} tone="bg-amber-50 text-amber-600" />
                  <Kpi label="Sellers onboarded" value={n(ov.sellers?.onboarded)} sub={`${n(ov.sellers?.active)} active`} icon={UserCheck} tone="bg-[#F0FDF4] text-[#00A86B]" />
                  <Kpi label="First-order conversions" value={n(ov.sellers?.firstOrder)} sub={`${pct(ov.sellers?.firstOrder, ov.sellers?.onboarded)}% of onboarded`} icon={PackageCheck} tone="bg-violet-50 text-violet-600" />
                  <Kpi label="Orders generated" value={n(ov.orders?.total)} sub={`${n(ov.orders?.delivered)} delivered`} icon={Package} tone="bg-[#F1F5F9] text-[#475569]" />
                  <Kpi label="Orders today" value={n(ov.orders?.today)} sub={`${n(ov.orders?.month)} this month`} icon={TrendingUp} tone="bg-sky-50 text-sky-600" />
                  <Kpi label="RTO / Cancelled" value={`${n(ov.orders?.rto)} / ${n(ov.orders?.cancelled)}`} sub="By referred sellers" icon={AlertCircle} tone="bg-red-50 text-red-500" />
                </div>

                {!isSalesAdmin && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                    <button type="button" onClick={() => setTab('earnings')} className={`${card} px-4 py-3.5 text-left hover:border-[#00A86B]/40 transition-colors`}>
                      <div className="flex items-center justify-between"><span className="text-[12px] font-medium text-[#64748B]">This month's incentive</span><BadgeChip badge={cur?.badge} color={cur?.badgeColor} /></div>
                      <div className="text-[22px] font-bold text-[#0F172A] tabular-nums mt-0.5">{inr(cur?.amount)}</div>
                      <div className="text-[11.5px] text-[#94A3B8] truncate">{n(cur?.shipments)} shipments · {cur?.percent ?? 0}%{cur?.nextSlab ? ` · ${n(cur.nextSlab.needed)} more for ${cur.nextSlab.badge || 'next slab'}` : ''}</div>
                    </button>
                    <button type="button" onClick={() => setTab('earnings')} className={`${card} px-4 py-3.5 text-left hover:border-[#00A86B]/40 transition-colors`}>
                      <div className="flex items-center justify-between"><span className="text-[12px] font-medium text-[#64748B]">Awaiting payment</span><Wallet className="w-4 h-4 text-amber-600" /></div>
                      <div className="text-[22px] font-bold text-[#0F172A] tabular-nums mt-0.5">{inr(earnings.totals?.unpaid)}</div>
                      <div className="text-[11.5px] text-[#94A3B8]">{inr(earnings.totals?.paid)} paid so far</div>
                    </button>
                    <button type="button" onClick={() => setTab('sellers')} className={`${card} px-4 py-3.5 text-left hover:border-[#00A86B]/40 transition-colors`}>
                      <div className="flex items-center justify-between"><span className="text-[12px] font-medium text-[#64748B]">Onboarding bonuses pending</span><Gift className="w-4 h-4 text-[#00A86B]" /></div>
                      <div className="text-[22px] font-bold text-[#0F172A] tabular-nums mt-0.5">{n(sellers.filter(s => s.bonus?.status === 'pending').length)}</div>
                      <div className="text-[11.5px] text-[#94A3B8] truncate">sellers yet to complete KYC + first recharge of {inr(earnings.plan?.onboardingBonus?.minRecharge)}</div>
                    </button>
                  </div>
                )}

                <SellerFunnel funnel={ov.funnel} rangeLabel={rangeLabel} />

                {!isSalesAdmin && <PriorityQueue calls={calls} readOnly={!canAct} onUpdate={setEditing} onViewAll={() => { setTab('calls'); setCallFilter('all'); }} />}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5 items-start">
                  {/* Targets */}
                  <div className={`${card} p-5`}>
                    <h2 className="text-[14px] font-bold text-[#0F172A] mb-4">Target progress</h2>
                    <div className="space-y-4">
                      <Progress label="Daily" t={ov.targets?.daily} />
                      <Progress label="Weekly" t={ov.targets?.weekly} />
                      <Progress label="Monthly" t={ov.targets?.monthly} />
                    </div>
                  </div>

                  {/* Follow-ups due */}
                  <div className={`${card} lg:col-span-2 overflow-hidden`}>
                    <div className="px-5 py-4 border-b border-[#F1F5F9] flex items-center justify-between">
                      <h2 className="text-[14px] font-bold text-[#0F172A]">Follow-ups due</h2>
                      <button onClick={() => { setTab('calls'); setCallFilter('follow_up'); }} className="text-[12.5px] font-semibold text-[#00A86B] hover:underline">View all</button>
                    </div>
                    {(ov.followUpList || []).length === 0 ? (
                      <Empty icon={CalendarClock} title="No follow-ups due" body="Scheduled callbacks and overdue follow-ups will show up here." />
                    ) : (
                      <ul className="divide-y divide-[#F1F5F9]">
                        {(ov.followUpList || []).slice(0, 6).map(c => {
                          const overdue = c.followUpAt && new Date(c.followUpAt) < new Date();
                          return (
                            <li key={c._id} className="px-5 py-3 flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-[13px] font-semibold text-[#0F172A] truncate">{c.leadName}{c.businessName ? <span className="font-normal text-[#94A3B8]"> · {c.businessName}</span> : null}</div>
                                <div className="text-[12px] text-[#64748B] truncate">{c.lastNote || 'No notes yet'}</div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className={`text-[11.5px] font-semibold px-2 py-0.5 rounded-full ${overdue ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'}`}>
                                  <Clock className="w-3 h-3 inline -mt-0.5 mr-1" />{fmtDateTime(c.followUpAt)}
                                </span>
                                {canAct && <button onClick={() => setEditing(c)} className="h-8 px-3 rounded-full border border-[#E2E8F0] text-[12px] font-semibold text-[#475569] hover:border-[#00A86B]/40 hover:text-[#00A86B]">Update</button>}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>

                {/* Referral */}
                {!isSalesAdmin && (
                  <div className={`${card} p-5 flex flex-col md:flex-row md:items-center gap-4`}>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="w-10 h-10 rounded-xl bg-[#F0FDF4] text-[#00A86B] flex items-center justify-center shrink-0"><Link2 className="w-5 h-5" /></span>
                      <div className="min-w-0">
                        <div className="text-[14px] font-bold text-[#0F172A]">{viewAs ? 'Referral code' : 'Your referral code'}</div>
                        <p className="text-[12.5px] text-[#64748B]">Sellers who sign up with this code (or the link) are linked to {viewAs ? 'this sales person' : 'you'} — share it before they register.</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="h-10 px-4 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] flex items-center text-[13px] font-mono font-semibold text-[#0F172A]">{referral.referralId || '—'}</span>
                      <button disabled={!referral.referralId} onClick={() => copy('id', referral.referralId)}
                        className="h-10 px-4 rounded-full border border-[#E2E8F0] text-[12.5px] font-semibold text-[#475569] inline-flex items-center gap-1.5 hover:border-[#00A86B]/40 hover:text-[#00A86B] disabled:opacity-40">
                        {copied === 'id' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} Copy ID
                      </button>
                      <button disabled={!referral.referralLink} onClick={() => copy('link', referral.referralLink)}
                        className="h-10 px-4 rounded-full bg-[#00A86B] hover:bg-[#009B63] text-white text-[12.5px] font-semibold inline-flex items-center gap-1.5 disabled:opacity-40">
                        {copied === 'link' ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />} Copy link
                      </button>
                    </div>
                  </div>
                )}

                {!isSalesAdmin && <OfferLetterCard employeeId={viewAsId} letterNumber={me?.offer?.letterNumber} issuedAt={me?.offer?.issuedAt} />}
              </div>
            )}

            {/* ── My Calls ── */}
            {tab === 'calls' && (
              <div className={`${card} overflow-hidden`}>
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-[#F1F5F9]">
                  <div className="flex items-center gap-1 overflow-x-auto">
                    {(['all', ...Object.keys(CALL_STATUS_LABEL)] as ('all' | CallStatus)[]).map(s => (
                      <button key={s} onClick={() => setCallFilter(s)}
                        className={`h-8 px-3 rounded-full text-[12.5px] font-semibold whitespace-nowrap ${callFilter === s ? 'bg-[#F0FDF4] text-[#00A86B]' : 'text-[#64748B] hover:bg-[#F8FAFC]'}`}>
                        {s === 'all' ? 'All' : CALL_STATUS_LABEL[s]} <span className="ml-1 tabular-nums text-[#94A3B8]">{s === 'all' ? calls.length : calls.filter(c => c.status === s).length}</span>
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 max-w-full">
                    <div className="relative w-[240px] max-w-full">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                      <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name, business or phone"
                        className="w-full h-9 pl-10 pr-4 rounded-full border border-[#E2E8F0] text-[12.5px] focus:outline-none focus:border-[#00A86B]" />
                    </div>
                    {canAct && (
                      <button onClick={() => setAddingLead(true)} className="h-9 px-4 rounded-full bg-[#00A86B] hover:bg-[#009B63] text-white text-[12.5px] font-semibold inline-flex items-center gap-1.5 shrink-0"><Plus className="w-4 h-4" />Add lead</button>
                    )}
                  </div>
                </div>
                {visibleCalls.length === 0 ? (
                  <Empty icon={PhoneCall} title={calls.length ? 'No leads match' : 'No leads assigned yet'} body={calls.length ? 'Try a different status or search.' : 'Leads assigned to you will appear here with their status and follow-ups.'} />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[860px]">
                      <thead><tr className="bg-[#E6F9F2] text-xs font-medium text-[#64748B] uppercase tracking-wider">
                        {['Lead', 'Phone', 'Assigned', 'Status', 'Outcome', 'Follow-up', ''].map(h => <th key={h} className="py-2.5 px-4 whitespace-nowrap">{h}</th>)}
                      </tr></thead>
                      <tbody className="text-[12.5px] text-[#475569]">
                        {visibleCalls.map(c => (
                          <tr key={c._id} className="border-b border-[#F1F5F9] last:border-0 hover:bg-[#F8FFFB]">
                            <td className="py-3 px-4"><div className="font-semibold text-[#0F172A]">{c.leadName}</div><div className="text-[11.5px] text-[#94A3B8]">{c.businessName || '—'}</div></td>
                            <td className="py-3 px-4"><a href={`tel:${c.phone}`} className="inline-flex items-center gap-1.5 text-[#0F172A] hover:text-[#00A86B]"><PhoneCall className="w-3.5 h-3.5 text-[#94A3B8]" />{c.phone}</a></td>
                            <td className="py-3 px-4 whitespace-nowrap">{fmtDate(c.assignedAt)}</td>
                            <td className="py-3 px-4"><span className={`px-2 py-0.5 rounded-full border text-[11px] font-semibold ${STATUS_TONE[c.status]}`}>{CALL_STATUS_LABEL[c.status]}</span></td>
                            <td className="py-3 px-4">{c.outcome ? CALL_OUTCOME_LABEL[c.outcome] : '—'}</td>
                            <td className="py-3 px-4 whitespace-nowrap">{fmtDateTime(c.followUpAt)}</td>
                            <td className="py-3 px-4 text-right">{canAct ? <button onClick={() => setEditing(c)} className="h-8 px-3 rounded-full border border-[#E2E8F0] text-[12px] font-semibold text-[#475569] hover:border-[#00A86B]/40 hover:text-[#00A86B]">Update</button> : c.stage === 'onboarded' ? <span className="text-[11.5px] font-semibold text-[#00A86B]">Onboarded</span> : null}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ── My Sellers ── */}
            {tab === 'sellers' && (
              <div className={`${card} overflow-hidden`}>
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-[#F1F5F9]">
                  <div className="flex items-center gap-1 overflow-x-auto">
                    {([['all', 'All'], ['new', 'New'], ['kyc_pending', 'KYC pending'], ['onboarding', 'Onboarding'], ['active', 'Active'], ['inactive', 'Inactive'], ['no_first_order', 'No first order']] as [typeof sellerFilter, string][]).map(([k, l]) => (
                      <button key={k} onClick={() => setSellerFilter(k)}
                        className={`h-8 px-3 rounded-full text-[12.5px] font-semibold whitespace-nowrap ${sellerFilter === k ? 'bg-[#F0FDF4] text-[#00A86B]' : 'text-[#64748B] hover:bg-[#F8FAFC]'}`}>{l}</button>
                    ))}
                  </div>
                  <div className="relative w-[240px] max-w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                    <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search seller or phone"
                      className="w-full h-9 pl-10 pr-4 rounded-full border border-[#E2E8F0] text-[12.5px] focus:outline-none focus:border-[#00A86B]" />
                  </div>
                </div>
                {visibleSellers.length === 0 ? (
                  <Empty icon={UserPlus} title={sellers.length ? 'No sellers match' : 'No referred sellers yet'} body={sellers.length ? 'Try a different filter or search.' : 'Sellers who register with your referral ID will appear here.'} />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[1240px]">
                      <thead><tr className="bg-[#E6F9F2] text-xs font-medium text-[#64748B] uppercase tracking-wider">
                        {['Seller', 'Phone', 'Registered', 'KYC', 'Onboarding', 'First order', 'Shipments', 'Last order', 'Activity', 'Rate', 'Bonus', ''].map(h => <th key={h} className="py-2.5 px-4 whitespace-nowrap">{h}</th>)}
                      </tr></thead>
                      <tbody className="text-[12.5px] text-[#475569]">
                        {visibleSellers.map(s => (
                          <tr key={s._id} className="border-b border-[#F1F5F9] last:border-0 hover:bg-[#F8FFFB]">
                            <td className="py-3 px-4"><div className="font-semibold text-[#0F172A]">{s.name}</div><div className="text-[11.5px] text-[#94A3B8]">{s.businessName || '—'}</div></td>
                            <td className="py-3 px-4">{s.phone}</td>
                            <td className="py-3 px-4 whitespace-nowrap">{fmtDate(s.registeredAt)}</td>
                            <td className="py-3 px-4"><span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${s.kycStatus === 'verified' ? 'bg-emerald-50 text-emerald-700' : s.kycStatus === 'rejected' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'}`}>{s.kycStatus}</span></td>
                            <td className="py-3 px-4 capitalize">{s.onboardingStatus.replace('_', ' ')}</td>
                            <td className="py-3 px-4 whitespace-nowrap">{fmtDate(s.firstOrderAt)}</td>
                            <td className="py-3 px-4 font-semibold text-[#0F172A] tabular-nums">{n(s.totalOrders)}</td>
                            <td className="py-3 px-4 whitespace-nowrap">{fmtDate(s.lastOrderAt)}</td>
                            <td className="py-3 px-4"><span className={`inline-flex items-center gap-1.5 text-[12px] font-semibold ${s.active ? 'text-[#00A86B]' : 'text-[#94A3B8]'}`}><span className={`w-1.5 h-1.5 rounded-full ${s.active ? 'bg-[#00A86B]' : 'bg-[#CBD5E1]'}`} />{s.active ? 'Active' : 'Inactive'}</span></td>
                            <td className="py-3 px-4 whitespace-nowrap">{s.rate
                              ? <div><div className="font-semibold text-[#0F172A]">{s.rate.current}</div><div className="text-[11px] text-[#94A3B8]">{s.rate.current !== s.rate.committed ? `committed ${s.rate.committed} · ` : ''}{s.rate.autoAdjust ? `review ${fmtDate(s.rate.nextReviewAt)}` : 'fixed'}</div></div>
                              : <span className="text-[#94A3B8]">Default</span>}</td>
                            <td className="py-3 px-4 whitespace-nowrap">{s.bonus
                              ? <span className={`text-[12px] font-semibold capitalize ${BONUS_TONE[s.bonus.status]}`}>{s.bonus.status === 'earned' || s.bonus.status === 'paid' ? `${inr(s.bonus.amount)} ${s.bonus.status}` : s.bonus.status === 'pending' ? `Pending till ${fmtDate(s.bonus.deadline)}` : 'Window closed'}</span>
                              : '—'}</td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <button onClick={() => setViewing(s._id)} title="View seller" aria-label={`View ${s.name}`} className="w-8 h-8 rounded-full border border-[#E2E8F0] inline-flex items-center justify-center text-[#475569] hover:border-[#00A86B]/40 hover:text-[#00A86B]"><Eye className="w-4 h-4" /></button>
                              {canAct && offers.length > 0 && <button onClick={() => setAssigning(s)} className="ml-1.5 h-8 px-3 rounded-full border border-[#E2E8F0] text-[12px] font-semibold text-[#475569] hover:border-[#00A86B]/40 hover:text-[#00A86B]">{s.rate ? 'Change rate' : 'Set rate'}</button>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {tab === 'earnings' && <SalesEarningsTab key={reloadKey} viewAsId={viewAsId} />}
            {tab === 'rates' && <SalesRatesTab viewAsId={viewAsId} sellers={sellers} canAssign={canAct} onAssigned={msg => { showToast('success', msg); load(); }} />}

            {/* ── Performance ── */}
            {tab === 'performance' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5 items-start">
                <div className={`${card} p-5`}>
                  <h2 className="text-[14px] font-bold text-[#0F172A]">Conversion funnel</h2>
                  <p className="text-[12px] text-[#94A3B8] mb-4">{rangeLabel} · each rate is that step ÷ the step above</p>
                  <Funnel steps={[
                    { label: 'Leads completed', value: perf.callsCompleted || 0, rate: `${pct(perf.callsCompleted, perf.callsAssigned)}% of assigned` },
                    { label: 'Registrations', value: perf.registrations || 0, rate: `${pct(perf.registrations, perf.callsCompleted)}%` },
                    { label: 'Onboarded', value: perf.onboarded || 0, rate: `${pct(perf.onboarded, perf.registrations)}%` },
                    { label: 'First order', value: perf.firstOrders || 0, rate: `${pct(perf.firstOrders, perf.onboarded)}%` },
                  ]} />
                </div>
                <div className={`${card} p-5`}>
                  <h2 className="text-[14px] font-bold text-[#0F172A] mb-4">Business generated</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {[['Orders created', perf.ordersGenerated], ['Delivered', perf.delivered]].map(([l, v]) => (
                      <div key={l as string} className="rounded-xl bg-[#F8FAFC] border border-[#EEF2F6] px-3.5 py-3">
                        <div className="text-[11.5px] text-[#64748B]">{l as string}</div>
                        <div className="text-[18px] font-bold text-[#0F172A] tabular-nums">{n(v as number)}</div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11.5px] text-[#94A3B8] mt-3">Orders by sellers attributed to you. Delivered is a subset of orders created.</p>
                </div>
                <div className={`${card} p-5`}>
                  <h2 className="text-[14px] font-bold text-[#0F172A] mb-3">Top sellers</h2>
                  {(perf.topSellers || []).length === 0 ? (
                    <Empty icon={TrendingUp} title="No order data yet" body="Your highest-volume sellers will be ranked here." />
                  ) : (
                    <ol className="space-y-2.5">
                      {(perf.topSellers || []).slice(0, 5).map((s, i) => (
                        <li key={s.name} className="flex items-center justify-between text-[13px]">
                          <span className="flex items-center gap-2 min-w-0"><span className="w-5 text-[#94A3B8] tabular-nums">{i + 1}.</span><span className="truncate text-[#0F172A] font-medium">{s.name}</span></span>
                          <span className="font-semibold tabular-nums">{n(s.orders)}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                  {(perf.dormantSellers || []).length > 0 && (
                    <div className="mt-4 pt-3 border-t border-[#F1F5F9]">
                      <div className="text-[12px] font-semibold text-amber-700 mb-1.5">Stopped ordering</div>
                      {(perf.dormantSellers || []).slice(0, 3).map(s => <div key={s.name} className="text-[12px] text-[#64748B] truncate">{s.name} · last order {fmtDate(s.lastOrderAt)}</div>)}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Team (sales admins) ── */}
            {tab === 'team' && isSalesAdmin && (
              <div className={`${card} overflow-hidden`}>
                <div className="px-5 py-4 border-b border-[#F1F5F9]">
                  <h2 className="text-[14px] font-bold text-[#0F172A]">Team performance</h2>
                  <p className="text-[12px] text-[#94A3B8]">{rangeLabel} · per sales executive</p>
                </div>
                {team.length === 0 ? (
                  <Empty icon={Users} title="No sales employees yet" body="Create an employee with the Sales team in Employees to see their performance here." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[900px]">
                      <thead><tr className="bg-[#E6F9F2] text-xs font-medium text-[#64748B] uppercase tracking-wider">
                        {['Executive', 'Referral ID', 'Leads (done / assigned)', 'Onboarded', 'First orders', 'Orders', 'Monthly target'].map(h => <th key={h} className="py-2.5 px-4 whitespace-nowrap">{h}</th>)}
                      </tr></thead>
                      <tbody className="text-[12.5px] text-[#475569]">
                        {team.map(m => (
                          <tr key={m._id} className="border-b border-[#F1F5F9] last:border-0 hover:bg-[#F8FFFB]">
                            <td className="py-3 px-4 font-semibold text-[#0F172A]">{m.name}</td>
                            <td className="py-3 px-4 font-mono">{m.referralId}</td>
                            <td className="py-3 px-4 tabular-nums">{n(m.callsCompleted)} / {n(m.callsAssigned)} <span className="text-[#94A3B8]">({pct(m.callsCompleted, m.callsAssigned)}%)</span></td>
                            <td className="py-3 px-4 tabular-nums">{n(m.onboarded)}</td>
                            <td className="py-3 px-4 tabular-nums">{n(m.firstOrders)} <span className="text-[#94A3B8]">({pct(m.firstOrders, m.onboarded)}%)</span></td>
                            <td className="py-3 px-4 tabular-nums font-semibold text-[#0F172A]">{n(m.orders)}</td>
                            <td className="py-3 px-4 w-[180px]">
                              {m.monthlyTarget ? (
                                <div><div className="h-1.5 rounded-full bg-[#F1F5F9] overflow-hidden"><div className="h-full bg-[#00A86B]" style={{ width: `${Math.min(100, pct(m.onboarded, m.monthlyTarget))}%` }} /></div>
                                  <div className="text-[11px] text-[#94A3B8] mt-1">{n(m.onboarded)} / {n(m.monthlyTarget)} sellers</div></div>
                              ) : <span className="text-[#94A3B8]">Not set</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {editing && (
          <CallUpdateDialog call={editing} onClose={() => setEditing(null)}
            onSaved={(msg, ok) => { showToast(ok ? 'success' : 'error', msg); load(); }} />
        )}
      </AnimatePresence>
      {addingLead && <AddLeadDialog onClose={() => setAddingLead(false)} onSaved={msg => { showToast('success', msg); load(); }} />}
      {assigning && (
        <AssignRateDialog sellers={sellers} offers={offers} initialSellerId={assigning._id}
          onClose={() => setAssigning(null)} onDone={msg => { showToast('success', msg); load(); }} />
      )}
      {viewing && <SellerDetailDialog sellerId={viewing} viewAsId={viewAsId} onClose={() => setViewing(null)} />}
    </>
  );
}
