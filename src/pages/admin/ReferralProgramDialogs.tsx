import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X, AlertCircle, Gift, Percent, Award, Plus, Trash2, Pencil, Search } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { TableLoader } from '../../components/ui/TableLoader';

/* Admin: the company's user-referral programme (joining bonus rule + default monthly commission %) and the list
   of joining bonuses paid. Backend /referral/settings and /referral/bonuses (admin only). */

export interface ReferralProgram {
  joiningBonus: { enabled: boolean; amount: number; minFirstRecharge: number; withinDays: number; requireKyc: boolean };
}

export interface ReferralSlab { minShipments: number; maxShipments: number | null; percent: number; badge: string; color?: string }
interface PlanUser { _id: string; fullname: string; company?: string; userId?: number; email?: string; referred?: number }
export interface ReferralPlan { _id?: string; name: string; isDefault?: boolean; users: PlanUser[]; slabs: ReferralSlab[]; active?: boolean }

const fieldCls = 'w-full h-10 px-3.5 rounded-xl border border-[#E2E8F0] text-[13px] text-[#0F172A] bg-white focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]';
const labelCls = 'block text-[12px] font-semibold text-[#475569] mb-1.5';
const inr = (v?: number) => `₹${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const errMsg = (e: any) => e?.response?.data?.message || 'Something went wrong. Please try again.';

function Modal({ title, onClose, children, footer, wide }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} role="dialog" aria-modal="true"
        className={`relative w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} bg-white rounded-2xl shadow-[0_24px_64px_-16px_rgba(15,23,42,0.35)] max-h-[calc(100vh-2rem)] flex flex-col`}>
        <div className="px-5 py-4 border-b border-[#F1F5F9] flex items-center justify-between gap-3 shrink-0">
          <h3 className="text-[15px] font-bold text-[#0F172A]">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-full flex items-center justify-center text-[#94A3B8] hover:bg-[#F1F5F9]"><X className="w-4 h-4" /></button>
        </div>
        <div className="overflow-y-auto flex-1">{children}</div>
        {footer && <div className="px-5 py-3.5 border-t border-[#F1F5F9] flex justify-end gap-2.5 shrink-0">{footer}</div>}
      </motion.div>
    </div>,
    document.body,
  );
}

export function ReferralSettingsDialog({ onClose, onSaved }: { onClose: () => void; onSaved: (msg: string) => void }) {
  const [s, setS] = useState<ReferralProgram | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { apiClient.get('/referral/settings').then(r => setS(r.data?.settings)).catch(e => setError(errMsg(e))); }, []);
  const setBonus = (k: keyof ReferralProgram['joiningBonus'], v: number | boolean) => setS(p => (p ? { ...p, joiningBonus: { ...p.joiningBonus, [k]: v } } : p));
  const save = async () => {
    if (!s) return;
    setBusy(true); setError('');
    try {
      await apiClient.put('/referral/settings', { joiningBonus: s.joiningBonus });
      onSaved('Referral programme saved');
      onClose();
    } catch (e) { setError(errMsg(e)); } finally { setBusy(false); }
  };
  const b = s?.joiningBonus;
  return (
    <Modal title="Referral programme" onClose={onClose}
      footer={<>
        <button onClick={onClose} className="h-10 px-5 rounded-full border border-[#E2E8F0] text-[13px] font-semibold text-[#475569] hover:bg-[#F8FAFC]">Cancel</button>
        <button disabled={busy || !s} onClick={save} className="h-10 px-6 rounded-full bg-[#00A86B] hover:bg-[#009B63] text-white text-[13px] font-semibold disabled:opacity-50">{busy ? 'Saving…' : 'Save'}</button>
      </>}>
      {!s ? (error ? <p className="p-5 text-[13px] text-red-600">{error}</p> : <div className="relative h-48"><TableLoader /></div>) : (
        <div className="p-5 space-y-5">
          {error && <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-100 text-[12.5px] text-red-600"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{error}</div>}
          <section>
            <label className="flex items-center gap-2 text-[13.5px] font-bold text-[#0F172A]"><input type="checkbox" checked={b!.enabled} onChange={e => setBonus('enabled', e.target.checked)} className="h-4 w-4 accent-[#00A86B]" /><Gift className="w-4 h-4 text-[#00A86B]" />Joining bonus</label>
            <p className="text-[12px] text-[#94A3B8] mt-1">Paid once into the referrer's wallet when the referred user completes KYC and their <b>first</b> recharge is at least the amount below, within the days below of signing up.</p>
            {b!.enabled && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div><label className={labelCls}>Bonus (₹)</label><input type="number" min={0} value={b!.amount} onChange={e => setBonus('amount', Number(e.target.value))} className={fieldCls} /></div>
                <div><label className={labelCls}>First recharge at least (₹)</label><input type="number" min={0} value={b!.minFirstRecharge} onChange={e => setBonus('minFirstRecharge', Number(e.target.value))} className={fieldCls} /></div>
                <div><label className={labelCls}>Within (days of sign-up)</label><input type="number" min={1} value={b!.withinDays} onChange={e => setBonus('withinDays', Number(e.target.value))} className={fieldCls} /></div>
                <label className="flex items-end gap-2 pb-2.5 text-[12.5px] text-[#475569]"><input type="checkbox" checked={b!.requireKyc} onChange={e => setBonus('requireKyc', e.target.checked)} className="h-4 w-4 accent-[#00A86B]" />KYC required</label>
              </div>
            )}
          </section>
          <section className="rounded-xl bg-[#F8FAFC] border border-[#EEF2F6] p-3.5">
            <div className="flex items-center gap-2 text-[13px] font-bold text-[#0F172A]"><Percent className="w-4 h-4 text-[#00A86B]" />Monthly commission</div>
            <p className="text-[12px] text-[#64748B] mt-1">Set in <b>Commission plans</b>: slabs by the referred users' in-transit shipments in the month, each with its % and badge — a default plan for everyone and plans for selected referrers. Credited to the referrer's wallet at month end.</p>
          </section>
        </div>
      )}
    </Modal>
  );
}

// ── Commission plans ─────────────────────────────────────────────────────────
export function SlabBadge({ badge, color }: { badge?: string; color?: string }) {
  if (!badge) return null;
  const c = color || '#00A86B';
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap" style={{ color: c, backgroundColor: `${c}14`, border: `1px solid ${c}40` }}><Award className="w-3 h-3" />{badge}</span>;
}

function ReferrerPicker({ value, onChange }: { value: PlanUser[]; onChange: (users: PlanUser[]) => void }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<PlanUser[]>([]);
  useEffect(() => {
    const t = setTimeout(() => {
      apiClient.get('/referral/referrers', { params: { q: q.trim() } }).then(r => setResults(r.data?.users || [])).catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);
  const has = (id: string) => value.some(u => u._id === id);
  const label = (u: PlanUser) => u.company || u.fullname;
  return (
    <div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {value.map(u => (
            <span key={u._id} className="inline-flex items-center gap-1 h-7 pl-2.5 pr-1 rounded-full bg-[#F0FDF4] border border-[#DCFCE7] text-[12px] font-semibold text-[#0F172A]">
              {label(u)}<button type="button" aria-label={`Remove ${label(u)}`} onClick={() => onChange(value.filter(v => v._id !== u._id))} className="w-5 h-5 rounded-full flex items-center justify-center text-[#64748B] hover:bg-white"><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
      )}
      <div className="relative"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search referrers by name, company, email or user ID" className={`${fieldCls} pl-9`} /></div>
      <div className="mt-1.5 max-h-40 overflow-y-auto rounded-xl border border-[#E2E8F0] divide-y divide-[#F1F5F9]">
        {results.length === 0 ? <div className="px-3 py-2 text-[12px] text-[#94A3B8]">No referrers found (only users who referred someone are listed).</div> : results.map(u => (
          <label key={u._id} className="flex items-center gap-2.5 px-3 py-2 text-[12.5px] cursor-pointer hover:bg-[#FAFBFC]">
            <input type="checkbox" checked={has(u._id)} onChange={() => onChange(has(u._id) ? value.filter(v => v._id !== u._id) : [...value, u])} className="h-4 w-4 accent-[#00A86B]" />
            <span className="font-medium text-[#0F172A] truncate">{label(u)}</span>
            <span className="text-[#94A3B8] whitespace-nowrap">{u.userId} · {u.referred} referred</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function PlanEditor({ plan, onClose, onSaved }: { plan: ReferralPlan; onClose: () => void; onSaved: (msg: string) => void }) {
  const [d, setD] = useState<ReferralPlan>({ ...plan, slabs: plan.slabs.map(s => ({ ...s })), users: [...(plan.users || [])] });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const setSlab = (i: number, k: keyof ReferralSlab, v: string) => setD(p => ({
    ...p, slabs: p.slabs.map((s, j) => (j !== i ? s : { ...s, [k]: k === 'badge' || k === 'color' ? v : k === 'maxShipments' && v === '' ? null : Number(v) })),
  }));
  const save = async () => {
    setBusy(true); setError('');
    try {
      const body = { name: d.name, slabs: d.slabs, users: d.users.map(u => u._id) };
      const res = d._id ? await apiClient.put(`/referral/plans/${d._id}`, body) : await apiClient.post('/referral/plans', body);
      onSaved(res.data?.message || 'Commission plan saved');
      onClose();
    } catch (e) { setError(errMsg(e)); } finally { setBusy(false); }
  };
  const small = 'w-full h-9 px-2.5 rounded-lg border border-[#E2E8F0] text-[12.5px] focus:outline-none focus:border-[#00A86B]';
  return (
    <Modal title={d._id ? `Edit ${d.name}` : 'New commission plan'} onClose={onClose} wide
      footer={<>
        <button onClick={onClose} className="h-10 px-5 rounded-full border border-[#E2E8F0] text-[13px] font-semibold text-[#475569] hover:bg-[#F8FAFC]">Cancel</button>
        <button disabled={busy} onClick={save} className="h-10 px-6 rounded-full bg-[#00A86B] hover:bg-[#009B63] text-white text-[13px] font-semibold disabled:opacity-50">{busy ? 'Saving…' : 'Save plan'}</button>
      </>}>
      <div className="p-5 space-y-5">
        {error && <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-100 text-[12.5px] text-red-600"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{error}</div>}
        <div><label className={labelCls}>Plan name</label><input value={d.name} onChange={e => setD({ ...d, name: e.target.value })} className={fieldCls} /></div>
        {d.isDefault
          ? <p className="text-[12px] text-[#64748B] bg-[#F8FAFC] rounded-xl px-3 py-2">This is the default plan — it applies to every referrer who is not on another plan.</p>
          : <div><label className={labelCls}>Applies to</label><ReferrerPicker value={d.users} onChange={users => setD({ ...d, users })} /></div>}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[13px] font-bold text-[#0F172A]">Slabs</h4>
            <button type="button" onClick={() => setD(p => ({ ...p, slabs: [...p.slabs, { minShipments: (p.slabs.at(-1)?.maxShipments ?? p.slabs.at(-1)?.minShipments ?? 0) + 1, maxShipments: null, percent: 0, badge: '', color: '#00A86B' }] }))} className="text-[12.5px] font-semibold text-[#00A86B] inline-flex items-center gap-1"><Plus className="w-3.5 h-3.5" />Add slab</button>
          </div>
          <p className="text-[11.5px] text-[#94A3B8] mb-2">The month's in-transit shipments of all the referrer's referred users pick the slab; its % is paid on the shipping charges of all those shipments. Leave "to" empty for "and above".</p>
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_1fr_90px_1fr_56px_32px] gap-2 text-[11px] font-semibold text-[#64748B]"><span>From</span><span>To</span><span>%</span><span>Badge</span><span>Color</span><span /></div>
            {d.slabs.map((s, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_90px_1fr_56px_32px] gap-2 items-center">
                <input type="number" min={0} value={s.minShipments} onChange={e => setSlab(i, 'minShipments', e.target.value)} className={small} />
                <input type="number" min={0} value={s.maxShipments ?? ''} placeholder="and above" onChange={e => setSlab(i, 'maxShipments', e.target.value)} className={small} />
                <input type="number" min={0} max={100} step={0.05} value={s.percent} onChange={e => setSlab(i, 'percent', e.target.value)} className={small} />
                <input value={s.badge} onChange={e => setSlab(i, 'badge', e.target.value)} placeholder="e.g. Gold" className={small} />
                <input type="color" value={s.color || '#00A86B'} onChange={e => setSlab(i, 'color', e.target.value)} className="h-9 w-full rounded-lg border border-[#E2E8F0] cursor-pointer" />
                <button type="button" aria-label="Remove slab" onClick={() => setD(p => ({ ...p, slabs: p.slabs.filter((_, j) => j !== i) }))} className="w-8 h-8 rounded-full flex items-center justify-center text-[#94A3B8] hover:text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Modal>
  );
}

export function ReferralPlansDialog({ onClose, onSaved }: { onClose: () => void; onSaved: (msg: string) => void }) {
  const [plans, setPlans] = useState<ReferralPlan[] | null>(null);
  const [editing, setEditing] = useState<ReferralPlan | null>(null);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  useEffect(() => { apiClient.get('/referral/plans').then(r => setPlans(r.data?.plans || [])).catch(e => setError(errMsg(e))); }, [reload]);
  const def = plans?.find(p => p.isDefault);
  const remove = async (p: ReferralPlan) => {
    if (!window.confirm(`Delete "${p.name}"? Its referrers go back to the default plan.`)) return;
    try { const r = await apiClient.delete(`/referral/plans/${p._id}`); onSaved(r.data?.message || 'Plan deleted'); setReload(x => x + 1); } catch (e) { setError(errMsg(e)); }
  };
  return (
    <Modal title="Referral commission plans" onClose={onClose} wide>
      <div className="p-5 space-y-4">
        {error && <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-100 text-[12.5px] text-red-600"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{error}</div>}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[12px] text-[#64748B] max-w-xl">The default plan covers every referrer; a plan for selected referrers overrides it for them. Commission is calculated and credited to the wallet at month end.</p>
          {def && <button onClick={() => setEditing({ name: '', users: [], slabs: def.slabs.map(s => ({ ...s })) })} className="h-9 px-4 rounded-full bg-[#00A86B] hover:bg-[#009B63] text-white text-[12.5px] font-semibold inline-flex items-center gap-1.5"><Plus className="w-4 h-4" />Plan for selected referrers</button>}
        </div>
        {!plans ? <div className="relative h-40"><TableLoader /></div> : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {plans.map(p => (
              <div key={p._id} className="rounded-2xl border border-[#EEF2F6] p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2"><span className="text-[14px] font-bold text-[#0F172A] truncate">{p.name}</span>{p.isDefault && <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 text-[10.5px] font-bold uppercase">Default</span>}</div>
                    <p className="text-[12px] text-[#64748B] truncate">{p.isDefault ? 'Every referrer not on another plan' : p.users.map(u => u.company || u.fullname).join(', ')}</p>
                  </div>
                  <div className="flex shrink-0">
                    <button onClick={() => setEditing(p)} aria-label="Edit plan" className="w-8 h-8 rounded-full flex items-center justify-center text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#00A86B]"><Pencil className="w-4 h-4" /></button>
                    {!p.isDefault && <button onClick={() => remove(p)} aria-label="Delete plan" className="w-8 h-8 rounded-full flex items-center justify-center text-[#64748B] hover:bg-red-50 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>}
                  </div>
                </div>
                <table className="w-full mt-3 text-[12px]"><tbody className="divide-y divide-[#F1F5F9]">
                  {p.slabs.map(s => (
                    <tr key={s.minShipments}><td className="py-1.5 tabular-nums text-[#475569]">{s.minShipments.toLocaleString('en-IN')}{s.maxShipments ? ` – ${s.maxShipments.toLocaleString('en-IN')}` : '+'} shipments</td><td className="py-1.5 font-semibold text-[#0F172A]">{s.percent}%</td><td className="py-1.5 text-right"><SlabBadge badge={s.badge} color={s.color} /></td></tr>
                  ))}
                </tbody></table>
              </div>
            ))}
          </div>
        )}
      </div>
      {editing && <PlanEditor plan={editing} onClose={() => setEditing(null)} onSaved={msg => { onSaved(msg); setReload(x => x + 1); }} />}
    </Modal>
  );
}

// ── One user's plan (user profile) ───────────────────────────────────────────
export function UserPlanDialog({ userId, onClose, onSaved }: { userId: string; onClose: () => void; onSaved: (planName: string) => void }) {
  const [plans, setPlans] = useState<ReferralPlan[] | null>(null);
  const [current, setCurrent] = useState<string>('');
  const [choice, setChoice] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    Promise.all([apiClient.get('/referral/plans'), apiClient.get(`/referral/plans/user/${userId}`)])
      .then(([a, b]) => { setPlans(a.data?.plans || []); setCurrent(b.data?.plan?._id || ''); setChoice(b.data?.plan?._id || ''); })
      .catch(e => setError(errMsg(e)));
  }, [userId]);
  const chosen = plans?.find(p => p._id === choice);
  const save = async () => {
    setBusy(true); setError('');
    try {
      const res = await apiClient.put('/referral/plans/assign', { userId, planId: chosen?.isDefault ? null : choice });
      onSaved(res.data?.plan?.name || chosen?.name || '');
      onClose();
    } catch (e) { setError(errMsg(e)); } finally { setBusy(false); }
  };
  return (
    <Modal title="Referral commission plan" onClose={onClose}
      footer={<>
        <button onClick={onClose} className="h-10 px-5 rounded-full border border-[#E2E8F0] text-[13px] font-semibold text-[#475569] hover:bg-[#F8FAFC]">Cancel</button>
        <button disabled={busy || !choice || choice === current} onClick={save} className="h-10 px-6 rounded-full bg-[#00A86B] hover:bg-[#009B63] text-white text-[13px] font-semibold disabled:opacity-50">{busy ? 'Saving…' : 'Save'}</button>
      </>}>
      {!plans ? (error ? <p className="p-5 text-[13px] text-red-600">{error}</p> : <div className="relative h-40"><TableLoader /></div>) : (
        <div className="p-5 space-y-3">
          {error && <p className="text-[12.5px] text-red-600">{error}</p>}
          <p className="text-[12px] text-[#64748B]">The monthly commission this user earns on the shipments of the users they referred. Create or edit plans in Referrals → Commission plans.</p>
          {plans.map(p => (
            <label key={p._id} className={`block rounded-xl border p-3 cursor-pointer ${choice === p._id ? 'border-[#00A86B] bg-[#F0FDF4]' : 'border-[#E2E8F0] hover:border-[#CBD5E1]'}`}>
              <div className="flex items-center gap-2"><input type="radio" checked={choice === p._id} onChange={() => setChoice(p._id!)} className="accent-[#00A86B]" /><span className="text-[13px] font-bold text-[#0F172A]">{p.name}</span>{p.isDefault && <span className="text-[10.5px] font-bold text-sky-700 uppercase">Default</span>}</div>
              <div className="mt-1.5 flex flex-wrap gap-1.5 pl-6">{p.slabs.map(s => <span key={s.minShipments} className="text-[11.5px] text-[#475569] bg-white border border-[#EEF2F6] rounded-full px-2 py-0.5">{s.minShipments.toLocaleString('en-IN')}{s.maxShipments ? `–${s.maxShipments.toLocaleString('en-IN')}` : '+'}: <b>{s.percent}%</b>{s.badge ? ` · ${s.badge}` : ''}</span>)}</div>
            </label>
          ))}
        </div>
      )}
    </Modal>
  );
}

interface BonusRow {
  _id: string; amount: number; rechargeAmount?: number; status: 'pending' | 'credited'; creditedAt?: string; createdAt: string;
  referrer?: { fullname: string; company: string; userId: number; email: string }; referredUser?: { fullname: string; company: string; userId: number; email: string };
}

export function ReferralBonusesDialog({ onClose }: { onClose: () => void }) {
  const [rows, setRows] = useState<BonusRow[] | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  useEffect(() => {
    apiClient.get('/referral/bonuses', { params: { page, limit: 50 } })
      .then(r => { setRows(r.data?.bonuses || []); setTotalPages(r.data?.totalPages || 1); })
      .catch(() => setRows([]));
  }, [page]);
  const fmt = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
  return (
    <Modal title="Joining bonuses paid" onClose={onClose} wide>
      {!rows ? <div className="relative h-48"><TableLoader /></div> : rows.length === 0 ? (
        <p className="px-5 py-12 text-center text-[12.5px] text-[#94A3B8]">No joining bonus has been paid yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[640px] text-[12.5px] text-[#475569]">
            <thead><tr className="bg-[#E6F9F2] text-xs font-medium text-[#64748B] uppercase tracking-wider">{['Credited', 'Referrer', 'Referred user', 'First recharge', 'Bonus'].map(h => <th key={h} className="py-2.5 px-4 whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r._id} className="border-b border-[#F1F5F9] last:border-0">
                  <td className="py-3 px-4 whitespace-nowrap">{r.status === 'credited' ? fmt(r.creditedAt) : <span className="text-amber-700 font-semibold">Processing</span>}</td>
                  <td className="py-3 px-4"><div className="font-semibold text-[#0F172A]">{r.referrer?.company || r.referrer?.fullname}</div><div className="text-[11px] text-[#94A3B8]">{r.referrer?.userId}</div></td>
                  <td className="py-3 px-4"><div className="font-semibold text-[#0F172A]">{r.referredUser?.company || r.referredUser?.fullname}</div><div className="text-[11px] text-[#94A3B8]">{r.referredUser?.userId}</div></td>
                  <td className="py-3 px-4 tabular-nums">{inr(r.rechargeAmount)}</td>
                  <td className="py-3 px-4 font-bold text-[#0F172A] tabular-nums">{inr(r.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex justify-end gap-2 px-5 py-3">
              <button disabled={page <= 1} onClick={() => { setRows(null); setPage(p => p - 1); }} className="h-8 px-3 rounded-full border border-[#E2E8F0] text-[12px] font-semibold disabled:opacity-40">Previous</button>
              <span className="text-[12px] text-[#64748B] self-center">{page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => { setRows(null); setPage(p => p + 1); }} className="h-8 px-3 rounded-full border border-[#E2E8F0] text-[12px] font-semibold disabled:opacity-40">Next</button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
