import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  PhoneCall, PhoneOutgoing, CalendarClock, UserPlus, UserCheck, PackageCheck, Package, Target,
  Search, Copy, Check, Link2, X, AlertCircle, TrendingUp, Users, Clock, RefreshCw, type LucideIcon,
} from 'lucide-react';
import { AdminLayout } from '../../../components/admin/layout/AdminLayout';
import { useAdminTab } from '../../../context/AdminUserContext';
import { useDashboardFilters } from '../../../context/DashboardFilterContext';
import { TableLoader } from '../../../components/ui/TableLoader';
import { Toast } from '../../../components/ui/Toast';
import { useToast } from '../../../hooks/useToast';
import { copyToClipboard } from '../../../utils/clipboard';
import {
  salesApiClient, pct, CALL_STATUS_LABEL, CALL_OUTCOME_LABEL,
  type SalesOverview, type SalesCall, type ReferredSeller, type SalesPerformance, type TeamMember,
  type CallStatus, type CallOutcome,
} from '../../../services/salesApi';

/* Sales module — one page, tabbed: Overview · My Calls · My Sellers · Performance (+ Team for sales admins).
   Sales executives (employees with the Sales module) see their own data; admins see the team view.
   All numbers come from the Sales API (salesApi.ts) — empty / zero until the backend is connected. */

type Tab = 'overview' | 'calls' | 'sellers' | 'performance' | 'team';

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
function CallUpdateDialog({ call, onClose, onSaved }: { call: SalesCall; onClose: () => void; onSaved: (msg: string, ok: boolean) => void }) {
  const [status, setStatus] = useState<CallStatus>(call.status);
  const [outcome, setOutcome] = useState<CallOutcome | ''>(call.outcome || '');
  const [note, setNote] = useState('');
  const [followUpAt, setFollowUpAt] = useState(call.followUpAt ? call.followUpAt.slice(0, 16) : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    if (status === 'completed' && !outcome) { setError('Record an outcome before marking the call completed.'); return; }
    if (status === 'follow_up' && !followUpAt) { setError('Pick a follow-up date and time.'); return; }
    setSaving(true); setError('');
    try {
      await salesApiClient.patch(`/calls/${call._id}`, { status, outcome: outcome || undefined, note: note.trim() || undefined, followUpAt: followUpAt || undefined });
      onSaved('Call updated', true);
      onClose();
    } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      setError(e?.response?.data?.message || 'Could not update the call.');
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
            <h3 className="text-[15px] font-bold text-[#0F172A]">Update call</h3>
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

export function SalesDashboard() {
  const { isEmployee, isAdmin, userName } = useAdminTab();
  const isSalesAdmin = isAdmin && !isEmployee;
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
  const [referral, setReferral] = useState<{ referralId?: string; referralLink?: string }>({});
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
    const params = { from: fromISO, to: toISO };
    Promise.allSettled([
      salesApiClient.get('/overview', { params }),
      salesApiClient.get('/calls', { params: { limit: 100 } }),
      salesApiClient.get('/sellers', { params: { limit: 100 } }),
      salesApiClient.get('/performance', { params }),
      salesApiClient.get('/referral'),
      isSalesAdmin ? salesApiClient.get('/team', { params }) : Promise.resolve({ data: {} }),
    ]).then(([ov, cl, se, pf, rf, tm]) => {
      if (!alive) return;
      if (ov.status === 'fulfilled') setOverview(ov.value.data || {});
      if (cl.status === 'fulfilled') setCalls(cl.value.data?.calls || []);
      if (se.status === 'fulfilled') setSellers(se.value.data?.sellers || []);
      if (pf.status === 'fulfilled') setPerf(pf.value.data || {});
      if (rf.status === 'fulfilled') setReferral(rf.value.data || {});
      if (tm.status === 'fulfilled') setTeam(tm.value.data?.members || []);
      setLoading(false);
    });
    return () => { alive = false; };
  }, [fromISO, toISO, isSalesAdmin, reloadKey]);

  const copy = async (key: string, value?: string) => {
    if (!value) return;
    if (await copyToClipboard(value)) { setCopied(key); setTimeout(() => setCopied(''), 1500); }
  };

  const tabs: { key: Tab; label: string; icon: LucideIcon }[] = [
    { key: 'overview', label: 'Overview', icon: TrendingUp },
    { key: 'calls', label: 'My Calls', icon: PhoneCall },
    { key: 'sellers', label: 'My Sellers', icon: UserPlus },
    { key: 'performance', label: 'Performance', icon: Target },
    ...(isSalesAdmin ? [{ key: 'team' as Tab, label: 'Team', icon: Users }] : []),
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

  return (
    <AdminLayout>
      <Toast toast={toast} onClose={closeToast} />
      <div className="flex flex-col h-[calc(100vh-72px)] -m-4 md:-m-6 bg-[#F8FAFC] overflow-y-auto">
        <div className="px-4 md:px-6 pt-5 pb-8 flex flex-col gap-5">
          {/* Title */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-10 h-10 rounded-xl bg-[#F0FDF4] text-[#00A86B] flex items-center justify-center shrink-0"><Target className="w-5 h-5" /></span>
              <div className="min-w-0">
                <h1 className="text-[18px] font-bold text-[#0F172A]">{isSalesAdmin ? 'Sales — Team overview' : 'Sales Dashboard'}</h1>
                <p className="text-[12.5px] text-[#64748B] truncate">{isSalesAdmin ? 'Calls, referred sellers and targets across the sales team.' : `Welcome back${userName ? `, ${userName.split(' ')[0]}` : ''} — here's your day.`}</p>
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
                  <Kpi label="Assigned calls" value={n(ov.calls?.assigned)} sub={rangeLabel} icon={PhoneCall} tone="bg-sky-50 text-sky-600" />
                  <Kpi label="Calls completed" value={n(ov.calls?.completed)} sub={`${n(ov.calls?.pending)} pending`} icon={PhoneOutgoing} tone="bg-emerald-50 text-emerald-600" />
                  <Kpi label="Follow-ups due" value={n(ov.followUps?.dueToday)} sub={`${n(ov.followUps?.overdue)} overdue`} icon={CalendarClock} tone="bg-amber-50 text-amber-600" />
                  <Kpi label="Sellers onboarded" value={n(ov.sellers?.onboarded)} sub={`${n(ov.sellers?.active)} active`} icon={UserCheck} tone="bg-[#F0FDF4] text-[#00A86B]" />
                  <Kpi label="First-order conversions" value={n(ov.sellers?.firstOrder)} sub={`${pct(ov.sellers?.firstOrder, ov.sellers?.onboarded)}% of onboarded`} icon={PackageCheck} tone="bg-violet-50 text-violet-600" />
                  <Kpi label="Orders generated" value={n(ov.orders?.total)} sub={`${n(ov.orders?.delivered)} delivered`} icon={Package} tone="bg-[#F1F5F9] text-[#475569]" />
                  <Kpi label="Orders today" value={n(ov.orders?.today)} sub={`${n(ov.orders?.month)} this month`} icon={TrendingUp} tone="bg-sky-50 text-sky-600" />
                  <Kpi label="RTO / Cancelled" value={`${n(ov.orders?.rto)} / ${n(ov.orders?.cancelled)}`} sub="By referred sellers" icon={AlertCircle} tone="bg-red-50 text-red-500" />
                </div>

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
                                <button onClick={() => setEditing(c)} className="h-8 px-3 rounded-full border border-[#E2E8F0] text-[12px] font-semibold text-[#475569] hover:border-[#00A86B]/40 hover:text-[#00A86B]">Update</button>
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
                        <div className="text-[14px] font-bold text-[#0F172A]">Your referral</div>
                        <p className="text-[12.5px] text-[#64748B]">Sellers who register with your ID or link are attributed to you.</p>
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
                  <div className="relative w-[240px] max-w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                    <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name, business or phone"
                      className="w-full h-9 pl-10 pr-4 rounded-full border border-[#E2E8F0] text-[12.5px] focus:outline-none focus:border-[#00A86B]" />
                  </div>
                </div>
                {visibleCalls.length === 0 ? (
                  <Empty icon={PhoneCall} title={calls.length ? 'No calls match' : 'No calls assigned yet'} body={calls.length ? 'Try a different status or search.' : 'Calls assigned to you will appear here with their status and follow-ups.'} />
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
                            <td className="py-3 px-4 text-right"><button onClick={() => setEditing(c)} className="h-8 px-3 rounded-full border border-[#E2E8F0] text-[12px] font-semibold text-[#475569] hover:border-[#00A86B]/40 hover:text-[#00A86B]">Update</button></td>
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
                    <table className="w-full text-left min-w-[960px]">
                      <thead><tr className="bg-[#E6F9F2] text-xs font-medium text-[#64748B] uppercase tracking-wider">
                        {['Seller', 'Phone', 'Registered', 'KYC', 'Onboarding', 'First order', 'Orders', 'Last order', 'Activity'].map(h => <th key={h} className="py-2.5 px-4 whitespace-nowrap">{h}</th>)}
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
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ── Performance ── */}
            {tab === 'performance' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5 items-start">
                <div className={`${card} p-5`}>
                  <h2 className="text-[14px] font-bold text-[#0F172A]">Conversion funnel</h2>
                  <p className="text-[12px] text-[#94A3B8] mb-4">{rangeLabel} · each rate is that step ÷ the step above</p>
                  <Funnel steps={[
                    { label: 'Calls completed', value: perf.callsCompleted || 0, rate: `${pct(perf.callsCompleted, perf.callsAssigned)}% of assigned` },
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
                        {['Executive', 'Referral ID', 'Calls (done / assigned)', 'Onboarded', 'First orders', 'Orders', 'Monthly target'].map(h => <th key={h} className="py-2.5 px-4 whitespace-nowrap">{h}</th>)}
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
    </AdminLayout>
  );
}
