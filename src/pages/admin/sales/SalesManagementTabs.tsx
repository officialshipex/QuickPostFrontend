import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  X, AlertCircle, CheckCircle2, ExternalLink, Plus, Trash2, Pencil, ShieldCheck, RefreshCw, UserPlus, Receipt, Settings2,
} from 'lucide-react';
import { TableLoader } from '../../../components/ui/TableLoader';
import {
  salesApiClient, apiError, inr, periodLabel,
  type TeamMember, type Slab, type OnboardingBonusRule, type RateOffer, type SalesEarning, type SalesPayout, type KycStatus,
} from '../../../services/salesApi';
import { BadgeChip } from './SalesEarningsTab';
import { card, fieldCls, labelCls, primaryBtn, ghostBtn, fmtDate, loadPerson, type PersonDetail } from './salesUi';

/* Sales Management building blocks (owner only, backend /sales/admin/*). */

const n = (v?: number) => (v ?? 0).toLocaleString('en-IN');
type Notify = (ok: boolean, msg: string) => void;

export function Modal({ title, onClose, children, footer, wide }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} role="dialog" aria-modal="true"
        className={`relative w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} bg-white rounded-2xl shadow-[0_24px_64px_-16px_rgba(15,23,42,0.35)] max-h-[calc(100vh-2rem)] flex flex-col`}>
        <div className="px-5 py-4 border-b border-[#F1F5F9] flex items-center justify-between gap-3 shrink-0">
          <h3 className="text-[15px] font-bold text-[#0F172A] truncate">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-full flex items-center justify-center text-[#94A3B8] hover:bg-[#F1F5F9]"><X className="w-4 h-4" /></button>
        </div>
        <div className="overflow-y-auto flex-1">{children}</div>
        {footer && <div className="px-5 py-3.5 border-t border-[#F1F5F9] flex justify-end gap-2.5 shrink-0">{footer}</div>}
      </motion.div>
    </div>,
    document.body,
  );
}

export function ErrorLine({ text }: { text?: string }) {
  if (!text) return null;
  return <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-100 text-[12.5px] text-red-600"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{text}</div>;
}

const KYC_TONE: Record<KycStatus, string> = {
  not_started: 'bg-slate-100 text-slate-600', pending: 'bg-amber-50 text-amber-700', verified: 'bg-emerald-50 text-emerald-700', rejected: 'bg-red-50 text-red-600',
};
const KYC_LABEL: Record<KycStatus, string> = { not_started: 'Not started', pending: 'Pending review', verified: 'Verified', rejected: 'Rejected' };
export function KycChip({ status, method }: { status?: KycStatus; method?: string | null }) {
  const s = status || 'not_started';
  return <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${KYC_TONE[s]}`}>{KYC_LABEL[s]}{method && s !== 'not_started' ? ` · ${method === 'ekyc' ? 'e-KYC' : 'manual'}` : ''}</span>;
}

function PeoplePicker({ people, value, onChange, emptyLabel }: { people: TeamMember[]; value: string[]; onChange: (ids: string[]) => void; emptyLabel: string }) {
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter(v => v !== id) : [...value, id]);
  if (!people.length) return <p className="text-[12px] text-[#94A3B8]">No sales people yet.</p>;
  return (
    <div className="max-h-44 overflow-y-auto rounded-xl border border-[#E2E8F0] divide-y divide-[#F1F5F9]">
      {people.map(p => (
        <label key={p._id} className="flex items-center gap-2.5 px-3 py-2 text-[12.5px] cursor-pointer hover:bg-[#FAFBFC]">
          <input type="checkbox" checked={value.includes(p._id)} onChange={() => toggle(p._id)} className="h-4 w-4 accent-[#00A86B]" />
          <span className="font-medium text-[#0F172A]">{p.name}</span><span className="text-[#94A3B8]">{p.employeeId}</span>
        </label>
      ))}
      {!value.length && <div className="px-3 py-2 text-[11.5px] text-[#94A3B8] bg-[#FAFBFC]">{emptyLabel}</div>}
    </div>
  );
}

// ── Team ─────────────────────────────────────────────────────────────────────
export interface SalesCandidate { _id: string; fullName: string; email: string; employeeId: string; role: string; isEmpActive: boolean; createdAt: string }

export function TeamTab({ members, loading, onOpen, candidates = [], notify, onMoved }: {
  members: TeamMember[]; loading: boolean; onOpen: (m: TeamMember) => void;
  candidates?: SalesCandidate[]; notify: Notify; onMoved: () => void;
}) {
  const [moving, setMoving] = useState<SalesCandidate | null>(null);
  const [busy, setBusy] = useState(false);
  const move = async () => {
    if (!moving) return;
    setBusy(true);
    try {
      const res = await salesApiClient.post(`/admin/people/${moving._id}/make-sales`);
      notify(true, res.data?.message || 'Moved to the Sales team');
      setMoving(null);
      onMoved();
    } catch (e) { notify(false, apiError(e)); } finally { setBusy(false); }
  };
  return (
    <div className="flex flex-col gap-4">
    {candidates.length > 0 && (
      <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold text-[#0F172A]">Employees with Sales Dashboard access who are not on the Sales team</p>
            <p className="text-[12px] text-[#64748B] mt-0.5">Employees hired as "Sales" before the Sales team was set up were saved without it. Move the real sales people: they get a referral code and from their next sign-in work only in the Sales panel (KYC first). Leave anyone who also needs other modules.</p>
            <ul className="mt-3 divide-y divide-amber-100 rounded-xl bg-white border border-amber-100">
              {candidates.map(c => (
                <li key={c._id} className="px-3.5 py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-[#0F172A] truncate">{c.fullName} <span className="font-normal text-[#94A3B8]">· {c.employeeId} · {c.role}</span></div>
                    <div className="text-[11.5px] text-[#64748B] truncate">{c.email} · added {fmtDate(c.createdAt)}{c.isEmpActive ? '' : ' · inactive'}</div>
                  </div>
                  <button onClick={() => setMoving(c)} className={`${primaryBtn} h-9 shrink-0`}>Move to Sales team</button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    )}
    {moving && (
      <Modal title={`Move ${moving.fullName} to the Sales team?`} onClose={() => setMoving(null)}
        footer={<><button onClick={() => setMoving(null)} className={ghostBtn}>Cancel</button><button disabled={busy} onClick={move} className={primaryBtn}>{busy ? 'Moving…' : 'Move to Sales team'}</button></>}>
        <div className="p-5 space-y-2 text-[12.5px] text-[#475569]">
          <p>{moving.fullName} gets a referral code and a sales profile. From their next sign-in they can use <b className="text-[#0F172A]">only the Sales panel</b> (Sales Dashboard and Tasks) — any other module access they had stops — and they must complete KYC first.</p>
          <p>Their login email and password stay the same.</p>
        </div>
      </Modal>
    )}
    <div className={`${card} overflow-hidden relative`}>
      {loading && <div className="absolute inset-0 z-10"><TableLoader /></div>}
      <div className="px-5 py-4 border-b border-[#F1F5F9] flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-[14px] font-bold text-[#0F172A]">Sales team</h2>
          <p className="text-[12px] text-[#94A3B8]">Hire a sales person in Employees (team "Sales"); they get a referral code and log in to the Sales panel.</p>
        </div>
        <Link to="/admin/roles" className={ghostBtn}><UserPlus className="w-4 h-4" />Add sales person</Link>
      </div>
      {members.length === 0 ? <p className="px-5 py-12 text-center text-[12.5px] text-[#94A3B8]">{candidates.length ? 'No one is on the Sales team yet — move your sales people above.' : 'No sales people yet.'}</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[1080px] text-[12.5px] text-[#475569]">
            <thead><tr className="bg-[#E6F9F2] text-xs font-medium text-[#64748B] uppercase tracking-wider">
              {['Sales person', 'Referral code', 'KYC', 'Sellers', 'This month', 'Badge', 'Projected', 'Unpaid', ''].map(h => <th key={h} className="py-2.5 px-4 whitespace-nowrap">{h}</th>)}
            </tr></thead>
            <tbody>
              {members.map(m => (
                <tr key={m._id} onClick={() => onOpen(m)} className="border-b border-[#F1F5F9] last:border-0 hover:bg-[#F8FFFB] cursor-pointer">
                  <td className="py-3 px-4"><div className="font-semibold text-[#0F172A] flex items-center gap-1.5">{m.name}{m.active === false && <span className="text-[10px] font-bold text-red-500 uppercase">Inactive</span>}</div><div className="text-[11.5px] text-[#94A3B8]">{m.employeeId} · {m.designation}</div></td>
                  <td className="py-3 px-4 font-mono font-semibold text-[#0F172A]">{m.referralId || '—'}</td>
                  <td className="py-3 px-4"><KycChip status={m.kycStatus} method={m.kycMethod} /></td>
                  <td className="py-3 px-4 tabular-nums">{n(m.sellers)}</td>
                  <td className="py-3 px-4 tabular-nums">{n(m.month?.shipments)} shipments</td>
                  <td className="py-3 px-4"><BadgeChip badge={m.month?.badge} color={m.month?.badgeColor} /></td>
                  <td className="py-3 px-4 tabular-nums font-semibold text-[#0F172A]">{inr(m.month?.projected)}</td>
                  <td className={`py-3 px-4 tabular-nums font-semibold ${m.unpaid ? 'text-amber-700' : 'text-[#94A3B8]'}`}>{inr(m.unpaid)}</td>
                  <td className="py-3 px-4 text-right text-[12px] font-semibold text-[#00A86B]">Open</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
    </div>
  );
}

// ── KYC review ───────────────────────────────────────────────────────────────
const DOC_LABEL: Record<string, string> = { panCard: 'PAN card', aadhaarFront: 'Aadhaar front', aadhaarBack: 'Aadhaar back', bankProof: 'Bank proof', photo: 'Photo' };

export function KycReviewDialog({ employeeId, onClose, onDone }: { employeeId: string; onClose: () => void; onDone: Notify }) {
  const [d, setD] = useState<PersonDetail | null>(null);
  const [reason, setReason] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { loadPerson(employeeId).then(setD).catch(e => setError(apiError(e))); }, [employeeId]);

  const act = async (action: 'approve' | 'reject') => {
    setBusy(true); setError('');
    try {
      const res = await salesApiClient.post(`/admin/kyc/${employeeId}/${action}`, action === 'reject' ? { reason } : {});
      onDone(true, res.data?.message || 'Saved');
      onClose();
    } catch (e) { setError(apiError(e)); } finally { setBusy(false); }
  };
  const k = d?.kyc;
  const row = (l: string, v?: string) => <div className="flex justify-between gap-3 py-1.5 text-[12.5px]"><span className="text-[#64748B]">{l}</span><span className="font-medium text-[#0F172A] text-right break-all">{v || '—'}</span></div>;
  return (
    <Modal title={d ? `KYC — ${d.person.fullName}` : 'KYC'} onClose={onClose} wide
      footer={k?.status === 'pending' ? (rejecting ? (
        <>
          <button onClick={() => setRejecting(false)} className={ghostBtn}>Back</button>
          <button disabled={busy || reason.trim().length < 3} onClick={() => act('reject')} className="h-10 px-5 rounded-full bg-red-500 hover:bg-red-600 text-white text-[13px] font-semibold disabled:opacity-50">{busy ? 'Saving…' : 'Reject KYC'}</button>
        </>
      ) : (
        <>
          <button onClick={() => setRejecting(true)} className="h-10 px-5 rounded-full border border-red-200 text-red-600 text-[13px] font-semibold hover:bg-red-50">Reject</button>
          <button disabled={busy} onClick={() => act('approve')} className={primaryBtn}><ShieldCheck className="w-4 h-4" />{busy ? 'Approving…' : 'Approve & issue offer letter'}</button>
        </>
      )) : undefined}>
      {!d ? (error ? <div className="p-5"><ErrorLine text={error} /></div> : <div className="relative h-60"><TableLoader /></div>) : (
        <div className="p-5 space-y-4">
          <ErrorLine text={error} />
          <div className="flex flex-wrap items-center gap-2"><KycChip status={k!.status} method={k!.method} />{k!.submittedAt && <span className="text-[12px] text-[#64748B]">Submitted {fmtDate(k!.submittedAt)}</span>}{k!.verifiedAt && <span className="text-[12px] text-[#64748B]">· verified {fmtDate(k!.verifiedAt)}</span>}</div>
          {k!.status === 'rejected' && k!.rejectionReason && <p className="text-[12.5px] text-red-600">Rejected: {k!.rejectionReason}</p>}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-[#EEF2F6] px-3.5 py-2.5"><div className="text-[12px] font-bold text-[#0F172A] mb-1">PAN</div>{row('Number', k!.pan.number)}{row('Name', k!.pan.name)}</div>
            <div className="rounded-xl border border-[#EEF2F6] px-3.5 py-2.5"><div className="text-[12px] font-bold text-[#0F172A] mb-1">Aadhaar</div>{row('Number', k!.aadhaar.number)}{row('Name', k!.aadhaar.name)}{row('DOB', k!.aadhaar.dob)}{row('Address', k!.aadhaar.address)}</div>
            <div className="rounded-xl border border-[#EEF2F6] px-3.5 py-2.5"><div className="text-[12px] font-bold text-[#0F172A] mb-1">Bank</div>{row('Holder', k!.bank.holderName)}{row('Account', k!.bank.accountNumber)}{row('IFSC', k!.bank.ifsc)}{row('Bank', k!.bank.bankName)}</div>
          </div>
          {Object.values(k!.documents).some(Boolean) && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(k!.documents).filter(([, url]) => url).map(([key, url]) => (
                <a key={key} href={url!} target="_blank" rel="noopener noreferrer" className={`${ghostBtn} h-9 text-[12.5px]`}><ExternalLink className="w-3.5 h-3.5" />{DOC_LABEL[key] || key}</a>
              ))}
            </div>
          )}
          {k!.method === 'ekyc' && <p className="text-[12px] text-[#64748B]">e-KYC: PAN, Aadhaar (OTP) and bank account were verified online.</p>}
          {rejecting && (
            <div><label className={labelCls}>Reason (sent to the sales person)</label>
              <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="e.g. Aadhaar back side is not readable" className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-[13px] focus:outline-none focus:border-[#00A86B] resize-none" /></div>
          )}
        </div>
      )}
    </Modal>
  );
}

export function KycTab({ notify }: { notify: Notify }) {
  const [status, setStatus] = useState<KycStatus>('pending');
  const [items, setItems] = useState<{ employee: { _id: string; fullName: string; email: string; employeeId: string }; status: KycStatus; method: 'ekyc' | 'manual' | null; submittedAt?: string; verifiedAt?: string }[] | null>(null);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const load = useCallback(() => {
    salesApiClient.get('/admin/kyc', { params: { status } }).then(r => setItems(r.data?.items || [])).catch(() => setItems([]));
  }, [status]);
  useEffect(() => { load(); }, [load]);
  return (
    <div className={`${card} overflow-hidden`}>
      <div className="px-4 py-3 border-b border-[#F1F5F9] flex gap-1 overflow-x-auto">
        {(['pending', 'verified', 'rejected', 'not_started'] as KycStatus[]).map(s => (
          <button key={s} onClick={() => { setItems(null); setStatus(s); }} className={`h-8 px-3 rounded-full text-[12.5px] font-semibold whitespace-nowrap ${status === s ? 'bg-[#F0FDF4] text-[#00A86B]' : 'text-[#64748B] hover:bg-[#F8FAFC]'}`}>{KYC_LABEL[s]}</button>
        ))}
      </div>
      {!items ? <div className="relative h-40"><TableLoader /></div> : items.length === 0 ? (
        <p className="px-5 py-12 text-center text-[12.5px] text-[#94A3B8]">{status === 'pending' ? 'No KYC waiting for review.' : 'Nobody here.'}</p>
      ) : (
        <ul className="divide-y divide-[#F1F5F9]">
          {items.map(it => (
            <li key={it.employee._id} className="px-5 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-[#0F172A] truncate">{it.employee.fullName} <span className="font-normal text-[#94A3B8]">· {it.employee.employeeId}</span></div>
                <div className="text-[12px] text-[#64748B] truncate">{it.employee.email} · {it.method === 'ekyc' ? 'e-KYC' : it.method === 'manual' ? 'Manual' : '—'}{it.submittedAt ? ` · submitted ${fmtDate(it.submittedAt)}` : ''}</div>
              </div>
              <button onClick={() => setReviewing(it.employee._id)} className={`${status === 'pending' ? primaryBtn : ghostBtn} h-9`}>{status === 'pending' ? 'Review' : 'View'}</button>
            </li>
          ))}
        </ul>
      )}
      {reviewing && <KycReviewDialog employeeId={reviewing} onClose={() => setReviewing(null)} onDone={(ok, msg) => { notify(ok, msg); load(); }} />}
    </div>
  );
}

// ── Commission plans ─────────────────────────────────────────────────────────
interface Plan { _id?: string; name: string; isDefault?: boolean; salesPersons: { _id: string; fullName: string; employeeId: string }[] | string[]; onboardingBonus: OnboardingBonusRule; slabs: Slab[]; active?: boolean }
const idsOf = (list: Plan['salesPersons']) => (list as (string | { _id: string })[]).map(p => (typeof p === 'string' ? p : p._id));

function PlanEditor({ plan, people, onClose, onSaved }: { plan: Plan; people: TeamMember[]; onClose: () => void; onSaved: Notify }) {
  const [draft, setDraft] = useState<Plan>({ ...plan, salesPersons: idsOf(plan.salesPersons), slabs: plan.slabs.map(s => ({ ...s })) });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const bonus = draft.onboardingBonus;
  const setBonus = (k: keyof OnboardingBonusRule, v: number | boolean) => setDraft(d => ({ ...d, onboardingBonus: { ...d.onboardingBonus, [k]: v } }));
  const setSlab = (i: number, k: keyof Slab, v: string) => setDraft(d => ({
    ...d, slabs: d.slabs.map((s, j) => j !== i ? s : { ...s, [k]: k === 'badge' || k === 'color' ? v : k === 'maxShipments' && v === '' ? null : Number(v) }),
  }));
  const save = async () => {
    setBusy(true); setError('');
    try {
      const body = { ...draft, salesPersons: draft.salesPersons };
      if (draft._id) await salesApiClient.put(`/admin/commission-plans/${draft._id}`, body);
      else await salesApiClient.post('/admin/commission-plans', body);
      onSaved(true, 'Commission plan saved');
      onClose();
    } catch (e) { setError(apiError(e)); } finally { setBusy(false); }
  };
  const small = 'w-full h-9 px-2.5 rounded-lg border border-[#E2E8F0] text-[12.5px] focus:outline-none focus:border-[#00A86B]';
  return (
    <Modal title={draft._id ? `Edit ${draft.name}` : 'New commission plan'} onClose={onClose} wide
      footer={<><button onClick={onClose} className={ghostBtn}>Cancel</button><button disabled={busy} onClick={save} className={primaryBtn}>{busy ? 'Saving…' : 'Save plan'}</button></>}>
      <div className="p-5 space-y-5">
        <ErrorLine text={error} />
        <div><label className={labelCls}>Plan name</label><input value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} className={fieldCls} /></div>
        {draft.isDefault ? (
          <p className="text-[12px] text-[#64748B] bg-[#F8FAFC] rounded-xl px-3 py-2">This is the default plan — it applies to every sales person who is not on another plan.</p>
        ) : (
          <div><label className={labelCls}>Applies to</label><PeoplePicker people={people} value={draft.salesPersons as string[]} onChange={ids => setDraft(d => ({ ...d, salesPersons: ids }))} emptyLabel="Choose at least one sales person." /></div>
        )}
        <section>
          <label className="flex items-center gap-2 text-[13px] font-bold text-[#0F172A]"><input type="checkbox" checked={bonus.enabled} onChange={e => setBonus('enabled', e.target.checked)} className="h-4 w-4 accent-[#00A86B]" />Onboarding bonus</label>
          {bonus.enabled && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
              <div><label className={labelCls}>Bonus (₹)</label><input type="number" min={0} value={bonus.amount} onChange={e => setBonus('amount', Number(e.target.value))} className={fieldCls} /></div>
              <div><label className={labelCls}>First recharge at least (₹)</label><input type="number" min={0} value={bonus.minRecharge} onChange={e => setBonus('minRecharge', Number(e.target.value))} className={fieldCls} /></div>
              <div><label className={labelCls}>Within (days)</label><input type="number" min={1} value={bonus.withinDays} onChange={e => setBonus('withinDays', Number(e.target.value))} className={fieldCls} /></div>
              <label className="flex items-end gap-2 pb-2.5 text-[12.5px] text-[#475569]"><input type="checkbox" checked={bonus.requireKyc} onChange={e => setBonus('requireKyc', e.target.checked)} className="h-4 w-4 accent-[#00A86B]" />Seller KYC required</label>
            </div>
          )}
        </section>
        <section>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[13px] font-bold text-[#0F172A]">Monthly incentive slabs</h4>
            <button type="button" onClick={() => setDraft(d => ({ ...d, slabs: [...d.slabs, { minShipments: (d.slabs.at(-1)?.maxShipments ?? 0) + 1, maxShipments: null, percent: 0, badge: '', color: '#00A86B' }] }))} className="text-[12.5px] font-semibold text-[#00A86B] inline-flex items-center gap-1"><Plus className="w-3.5 h-3.5" />Add slab</button>
          </div>
          <p className="text-[11.5px] text-[#94A3B8] mb-2">In-transit shipments of the person's sellers in the month (booked-but-not-picked-up and cancelled ones don't count) pick the slab; that % is paid on the freight of all those shipments. Leave "to" empty for "and above".</p>
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_1fr_90px_1fr_56px_32px] gap-2 text-[11px] font-semibold text-[#64748B]"><span>From</span><span>To</span><span>%</span><span>Badge</span><span>Color</span><span /></div>
            {draft.slabs.map((s, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_90px_1fr_56px_32px] gap-2 items-center">
                <input type="number" min={0} value={s.minShipments} onChange={e => setSlab(i, 'minShipments', e.target.value)} className={small} />
                <input type="number" min={0} value={s.maxShipments ?? ''} placeholder="and above" onChange={e => setSlab(i, 'maxShipments', e.target.value)} className={small} />
                <input type="number" min={0} max={100} step={0.05} value={s.percent} onChange={e => setSlab(i, 'percent', e.target.value)} className={small} />
                <input value={s.badge} onChange={e => setSlab(i, 'badge', e.target.value)} placeholder="e.g. Gold" className={small} />
                <input type="color" value={s.color || '#00A86B'} onChange={e => setSlab(i, 'color', e.target.value)} className="h-9 w-full rounded-lg border border-[#E2E8F0] cursor-pointer" />
                <button type="button" aria-label="Remove slab" onClick={() => setDraft(d => ({ ...d, slabs: d.slabs.filter((_, j) => j !== i) }))} className="w-8 h-8 rounded-full flex items-center justify-center text-[#94A3B8] hover:text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Modal>
  );
}

export function PlansTab({ people, notify }: { people: TeamMember[]; notify: Notify }) {
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [editing, setEditing] = useState<Plan | null>(null);
  const load = useCallback(() => { salesApiClient.get('/admin/commission-plans').then(r => setPlans(r.data?.plans || [])).catch(() => setPlans([])); }, []);
  useEffect(() => { load(); }, [load]);
  const remove = async (p: Plan) => {
    if (!window.confirm(`Delete "${p.name}"? Its sales people go back to the default plan.`)) return;
    try { await salesApiClient.delete(`/admin/commission-plans/${p._id}`); notify(true, 'Plan deleted'); load(); } catch (e) { notify(false, apiError(e)); }
  };
  const def = plans?.find(p => p.isDefault);
  if (!plans) return <div className="relative h-60"><TableLoader /></div>;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[12.5px] text-[#64748B]">The default plan covers everyone; a plan for selected sales people overrides it for them. Incentives are calculated on the last day of each month.</p>
        <button onClick={() => def && setEditing({ name: '', salesPersons: [], onboardingBonus: { ...def.onboardingBonus }, slabs: def.slabs.map(s => ({ ...s })) })} className={primaryBtn}><Plus className="w-4 h-4" />Plan for selected people</button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {plans.map(p => (
          <div key={p._id} className={`${card} p-5`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2"><h3 className="text-[14px] font-bold text-[#0F172A] truncate">{p.name}</h3>{p.isDefault && <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 text-[10.5px] font-bold uppercase">Default</span>}</div>
                <p className="text-[12px] text-[#64748B] truncate">{p.isDefault ? 'All sales people not on another plan' : (p.salesPersons as { fullName: string }[]).map(s => s.fullName).join(', ')}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => setEditing(p)} aria-label="Edit plan" className="w-8 h-8 rounded-full flex items-center justify-center text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#00A86B]"><Pencil className="w-4 h-4" /></button>
                {!p.isDefault && <button onClick={() => remove(p)} aria-label="Delete plan" className="w-8 h-8 rounded-full flex items-center justify-center text-[#64748B] hover:bg-red-50 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>}
              </div>
            </div>
            <p className="text-[12.5px] text-[#475569] mt-3">{p.onboardingBonus.enabled ? <>Onboarding bonus <b className="text-[#0F172A]">{inr(p.onboardingBonus.amount)}</b> · first recharge ≥ {inr(p.onboardingBonus.minRecharge)} within {p.onboardingBonus.withinDays} days{p.onboardingBonus.requireKyc ? ' + KYC' : ''}</> : 'No onboarding bonus'}</p>
            <table className="w-full mt-3 text-[12px]">
              <tbody className="divide-y divide-[#F1F5F9]">
                {p.slabs.map(s => (
                  <tr key={s.minShipments}><td className="py-1.5 tabular-nums text-[#475569]">{n(s.minShipments)}{s.maxShipments ? ` – ${n(s.maxShipments)}` : '+'} shipments</td><td className="py-1.5 font-semibold text-[#0F172A]">{s.percent}%</td><td className="py-1.5 text-right"><BadgeChip badge={s.badge} color={s.color} /></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
      {editing && <PlanEditor plan={editing} people={people} onClose={() => setEditing(null)} onSaved={(ok, msg) => { notify(ok, msg); load(); }} />}
    </div>
  );
}

// ── Rate offers ──────────────────────────────────────────────────────────────
function OfferEditor({ offer, planNames, people, onClose, onSaved }: { offer: Partial<RateOffer>; planNames: string[]; people: TeamMember[]; onClose: () => void; onSaved: Notify }) {
  const [d, setD] = useState({
    name: offer.name || '', planName: offer.planName || '', minMonthlyShipments: offer.minMonthlyShipments ?? 0, description: offer.description || '',
    active: offer.active !== false, salesPersons: (offer.salesPersons || []).map(p => p._id),
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const save = async () => {
    setBusy(true); setError('');
    try {
      if (offer._id) await salesApiClient.put(`/admin/rate-offers/${offer._id}`, d);
      else await salesApiClient.post('/admin/rate-offers', d);
      onSaved(true, 'Rate saved');
      onClose();
    } catch (e) { setError(apiError(e)); } finally { setBusy(false); }
  };
  return (
    <Modal title={offer._id ? `Edit ${offer.name}` : 'New commitment rate'} onClose={onClose}
      footer={<><button onClick={onClose} className={ghostBtn}>Cancel</button><button disabled={busy} onClick={save} className={primaryBtn}>{busy ? 'Saving…' : 'Save'}</button></>}>
      <div className="p-5 space-y-4">
        <ErrorLine text={error} />
        <div><label className={labelCls}>Name</label><input value={d.name} onChange={e => setD({ ...d, name: e.target.value })} placeholder="e.g. 5000 shipments / month" className={fieldCls} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelCls}>Rate card</label>
            <select value={d.planName} onChange={e => setD({ ...d, planName: e.target.value })} className={fieldCls}>
              <option value="">Choose</option>{planNames.map(p => <option key={p} value={p}>{p}</option>)}
            </select></div>
          <div><label className={labelCls}>Commitment (shipments / month)</label><input type="number" min={0} value={d.minMonthlyShipments} onChange={e => setD({ ...d, minMonthlyShipments: Number(e.target.value) })} className={fieldCls} /></div>
        </div>
        <div><label className={labelCls}>Note for the sales person (optional)</label><input value={d.description} onChange={e => setD({ ...d, description: e.target.value })} className={fieldCls} /></div>
        <div><label className={labelCls}>Who can offer it</label><PeoplePicker people={people} value={d.salesPersons} onChange={ids => setD({ ...d, salesPersons: ids })} emptyLabel="Nobody selected = every sales person." /></div>
        <label className="flex items-center gap-2 text-[12.5px] text-[#475569]"><input type="checkbox" checked={d.active} onChange={e => setD({ ...d, active: e.target.checked })} className="h-4 w-4 accent-[#00A86B]" />Active (can be offered to new sellers)</label>
      </div>
    </Modal>
  );
}

export function OffersTab({ people, notify, autoAdjust }: { people: TeamMember[]; notify: Notify; autoAdjust?: boolean }) {
  const [offers, setOffers] = useState<RateOffer[] | null>(null);
  const [planNames, setPlanNames] = useState<string[]>([]);
  const [editing, setEditing] = useState<Partial<RateOffer> | null>(null);
  const load = useCallback(() => { salesApiClient.get('/admin/rate-offers').then(r => setOffers(r.data?.offers || [])).catch(() => setOffers([])); }, []);
  useEffect(() => { load(); salesApiClient.get('/admin/plan-names').then(r => setPlanNames(r.data?.plans || [])).catch(() => {}); }, [load]);
  const remove = async (o: RateOffer) => {
    if (!window.confirm(`Delete "${o.name}"?`)) return;
    try { await salesApiClient.delete(`/admin/rate-offers/${o._id}`); notify(true, 'Rate deleted'); load(); } catch (e) { notify(false, apiError(e)); }
  };
  if (!offers) return <div className="relative h-60"><TableLoader /></div>;
  return (
    <div className={`${card} overflow-hidden`}>
      <div className="px-5 py-4 border-b border-[#F1F5F9] flex flex-wrap items-center justify-between gap-2">
        <div className="max-w-2xl">
          <h2 className="text-[14px] font-bold text-[#0F172A]">Commitment rates</h2>
          <p className="text-[12px] text-[#94A3B8]">What sales people may pitch: "commit to N shipments a month, get this rate card". They can't edit rates — only choose one, so no approval is needed. Every month from the commitment date the seller moves to the rate their shipments earned{autoAdjust === false ? ' (auto-adjust is switched off in Settings)' : ''}, never above the committed one.</p>
        </div>
        <button onClick={() => setEditing({})} className={primaryBtn}><Plus className="w-4 h-4" />Add rate</button>
      </div>
      {offers.length === 0 ? <p className="px-5 py-12 text-center text-[12.5px] text-[#94A3B8]">No commitment rates yet.</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[760px] text-[12.5px] text-[#475569]">
            <thead><tr className="bg-[#E6F9F2] text-xs font-medium text-[#64748B] uppercase tracking-wider">{['Rate', 'Commitment', 'Rate card', 'Offered by', 'Sellers on it', 'Status', ''].map(h => <th key={h} className="py-2.5 px-4 whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>
              {offers.map(o => (
                <tr key={o._id} className="border-b border-[#F1F5F9] last:border-0">
                  <td className="py-3 px-4 font-semibold text-[#0F172A]">{o.name}{o.description && <div className="text-[11.5px] font-normal text-[#94A3B8]">{o.description}</div>}</td>
                  <td className="py-3 px-4 tabular-nums">{n(o.minMonthlyShipments)}+ / month</td>
                  <td className="py-3 px-4">{o.planName}</td>
                  <td className="py-3 px-4">{o.salesPersons?.length ? o.salesPersons.map(p => p.fullName).join(', ') : 'Everyone'}</td>
                  <td className="py-3 px-4 tabular-nums">{n(o.sellers)}</td>
                  <td className="py-3 px-4">{o.active !== false ? <span className="text-emerald-700 font-semibold">Active</span> : <span className="text-[#94A3B8] font-semibold">Off</span>}</td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <button onClick={() => setEditing(o)} aria-label="Edit" className="w-8 h-8 rounded-full inline-flex items-center justify-center text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#00A86B]"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => remove(o)} aria-label="Delete" className="w-8 h-8 rounded-full inline-flex items-center justify-center text-[#64748B] hover:bg-red-50 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editing && <OfferEditor offer={editing} planNames={planNames} people={people} onClose={() => setEditing(null)} onSaved={(ok, msg) => { notify(ok, msg); load(); }} />}
    </div>
  );
}

// ── Payouts ──────────────────────────────────────────────────────────────────
const thisPeriod = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };
const lastPeriod = () => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };

export function PayoutsTab({ people, notify, initialPerson }: { people: TeamMember[]; notify: Notify; initialPerson?: string }) {
  const [person, setPerson] = useState(initialPerson || '');
  const [status, setStatus] = useState<'unpaid' | 'paid' | 'all'>('unpaid');
  const [earnings, setEarnings] = useState<SalesEarning[] | null>(null);
  const [payouts, setPayouts] = useState<SalesPayout[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [paying, setPaying] = useState(false);
  const [utr, setUtr] = useState(''); const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10)); const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const [recalc, setRecalc] = useState(false);

  const load = useCallback(() => {
    const params: Record<string, string> = {};
    if (person) params.employeeId = person;
    if (status !== 'all') params.status = status;
    salesApiClient.get('/admin/earnings', { params }).then(r => { setEarnings(r.data?.earnings || []); setSelected([]); }).catch(() => setEarnings([]));
    salesApiClient.get('/admin/payouts', { params: person ? { employeeId: person } : {} }).then(r => setPayouts(r.data?.payouts || [])).catch(() => setPayouts([]));
  }, [person, status]);
  useEffect(() => { load(); }, [load]);

  const chosen = useMemo(() => (earnings || []).filter(e => selected.includes(e._id)), [earnings, selected]);
  const chosenPerson = chosen[0]?.salesPerson?._id;
  const total = chosen.reduce((s, e) => s + e.amount, 0);
  const toggle = (e: SalesEarning) => {
    if (e.status !== 'unpaid') return;
    if (chosenPerson && e.salesPerson?._id !== chosenPerson) { notify(false, 'A payment covers one sales person at a time.'); return; }
    setSelected(s => (s.includes(e._id) ? s.filter(x => x !== e._id) : [...s, e._id]));
  };
  const pay = async () => {
    setBusy(true); setError('');
    try {
      const res = await salesApiClient.post('/admin/payouts', { employeeId: chosenPerson, earningIds: selected, utr: utr.trim(), paidAt, note });
      notify(true, res.data?.message || 'Payment recorded');
      setPaying(false); setUtr(''); setNote('');
      load();
    } catch (e) { setError(apiError(e)); } finally { setBusy(false); }
  };
  const runRecalc = async (period: string) => {
    setRecalc(true);
    try { const res = await salesApiClient.post('/admin/recalculate', { period }); notify(true, res.data?.message || 'Recalculated'); load(); } catch (e) { notify(false, apiError(e)); } finally { setRecalc(false); }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className={`${card} p-4 flex flex-wrap items-end gap-3`}>
        <div className="w-full sm:w-64"><label className={labelCls}>Sales person</label>
          <select value={person} onChange={e => { setEarnings(null); setPerson(e.target.value); }} className={fieldCls}><option value="">Everyone</option>{people.map(p => <option key={p._id} value={p._id}>{p.name} ({p.employeeId})</option>)}</select></div>
        <div className="flex gap-1">
          {(['unpaid', 'paid', 'all'] as const).map(s => <button key={s} onClick={() => { setEarnings(null); setStatus(s); }} className={`h-10 px-4 rounded-full text-[12.5px] font-semibold capitalize ${status === s ? 'bg-[#F0FDF4] text-[#00A86B]' : 'text-[#64748B] hover:bg-[#F8FAFC]'}`}>{s}</button>)}
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          <button disabled={recalc} onClick={() => runRecalc(lastPeriod())} className={ghostBtn}><RefreshCw className={`w-4 h-4 ${recalc ? 'animate-spin' : ''}`} />Recalculate {periodLabel(lastPeriod())}</button>
          <button disabled={recalc} onClick={() => runRecalc(thisPeriod())} className={ghostBtn}>Recalculate {periodLabel(thisPeriod())}</button>
        </div>
      </div>

      <div className={`${card} overflow-hidden`}>
        <div className="px-5 py-3.5 border-b border-[#F1F5F9] flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[14px] font-bold text-[#0F172A]">Earnings</h2>
          {selected.length > 0 && <button onClick={() => setPaying(true)} className={primaryBtn}><Receipt className="w-4 h-4" />Record payment of {inr(total)}</button>}
        </div>
        {!earnings ? <div className="relative h-40"><TableLoader /></div> : earnings.length === 0 ? <p className="px-5 py-12 text-center text-[12.5px] text-[#94A3B8]">Nothing here.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[860px] text-[12.5px] text-[#475569]">
              <thead><tr className="bg-[#E6F9F2] text-xs font-medium text-[#64748B] uppercase tracking-wider">{['', 'Sales person', 'Type', 'Details', 'Amount', 'Status'].map(h => <th key={h} className="py-2.5 px-4 whitespace-nowrap">{h}</th>)}</tr></thead>
              <tbody>
                {earnings.map(e => (
                  <tr key={e._id} onClick={() => toggle(e)} className={`border-b border-[#F1F5F9] last:border-0 ${e.status === 'unpaid' ? 'cursor-pointer hover:bg-[#F8FFFB]' : ''} ${selected.includes(e._id) ? 'bg-[#F0FDF4]' : ''}`}>
                    <td className="py-3 px-4">{e.status === 'unpaid' && <input type="checkbox" readOnly checked={selected.includes(e._id)} className="h-4 w-4 accent-[#00A86B]" />}</td>
                    <td className="py-3 px-4 font-semibold text-[#0F172A]">{e.salesPerson?.fullName}</td>
                    <td className="py-3 px-4">{e.type === 'onboarding_bonus' ? 'Onboarding bonus' : `Incentive · ${periodLabel(e.period)}`}</td>
                    <td className="py-3 px-4">{e.type === 'onboarding_bonus' ? `${e.details?.sellerName || 'Seller'} · recharge ${inr(e.details?.rechargeAmount)}` : <span className="inline-flex items-center gap-2">{n(e.details?.shipments)} shipments · {e.details?.percent}% of {inr(e.details?.freight)} <BadgeChip badge={e.details?.badge} /></span>}</td>
                    <td className="py-3 px-4 font-bold text-[#0F172A] tabular-nums">{inr(e.amount)}</td>
                    <td className="py-3 px-4">{e.status === 'paid' ? <span className="text-emerald-700 font-semibold">Paid · UTR {e.payout?.utr}</span> : <span className="text-amber-700 font-semibold">Unpaid</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className={`${card} overflow-hidden`}>
        <div className="px-5 py-3.5 border-b border-[#F1F5F9]"><h2 className="text-[14px] font-bold text-[#0F172A]">Payments made</h2></div>
        {payouts.length === 0 ? <p className="px-5 py-10 text-center text-[12.5px] text-[#94A3B8]">No payments recorded yet.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[640px] text-[12.5px] text-[#475569]">
              <thead><tr className="bg-[#E6F9F2] text-xs font-medium text-[#64748B] uppercase tracking-wider">{['Paid on', 'Sales person', 'UTR', 'Amount', 'Items', 'Note'].map(h => <th key={h} className="py-2.5 px-4">{h}</th>)}</tr></thead>
              <tbody>
                {payouts.map(p => (
                  <tr key={p._id} className="border-b border-[#F1F5F9] last:border-0">
                    <td className="py-3 px-4 whitespace-nowrap">{fmtDate(p.paidAt)}</td>
                    <td className="py-3 px-4 font-semibold text-[#0F172A]">{p.salesPerson?.fullName}</td>
                    <td className="py-3 px-4 font-mono">{p.utr}</td>
                    <td className="py-3 px-4 font-bold text-[#0F172A] tabular-nums">{inr(p.amount)}</td>
                    <td className="py-3 px-4 tabular-nums">{p.earnings.length}</td>
                    <td className="py-3 px-4">{p.note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {paying && (
        <Modal title={`Record payment to ${chosen[0]?.salesPerson?.fullName}`} onClose={() => setPaying(false)}
          footer={<><button onClick={() => setPaying(false)} className={ghostBtn}>Cancel</button><button disabled={busy || utr.trim().length < 6} onClick={pay} className={primaryBtn}><CheckCircle2 className="w-4 h-4" />{busy ? 'Saving…' : `Mark ${inr(total)} paid`}</button></>}>
          <div className="p-5 space-y-4">
            <ErrorLine text={error} />
            <p className="text-[12.5px] text-[#475569]">Transfer <b className="text-[#0F172A]">{inr(total)}</b> to the sales person's verified bank account, then enter the bank's UTR. {chosen.length} earning{chosen.length === 1 ? '' : 's'} will be marked paid.</p>
            <div><label className={labelCls}>UTR / transaction reference</label><input value={utr} onChange={e => setUtr(e.target.value.replace(/\s/g, ''))} placeholder="e.g. HDFCN52026102312345" className={`${fieldCls} font-mono`} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Paid on</label><input type="date" value={paidAt} onChange={e => setPaidAt(e.target.value)} className={fieldCls} /></div>
              <div><label className={labelCls}>Note (optional)</label><input value={note} onChange={e => setNote(e.target.value)} className={fieldCls} /></div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Settings ─────────────────────────────────────────────────────────────────
export function SettingsTab({ notify, onAutoAdjust }: { notify: Notify; onAutoAdjust: (on: boolean) => void }) {
  const [s, setS] = useState<{ rateAutoAdjust: boolean; offerLetter: { signatoryName: string; signatoryDesignation: string; body: string; terms: string }; defaults: { body: string; terms: string } } | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { salesApiClient.get('/admin/settings').then(r => setS(r.data)).catch(() => {}); }, []);
  if (!s) return <div className="relative h-60"><TableLoader /></div>;
  const ol = s.offerLetter;
  const setOl = (k: keyof typeof ol, v: string) => setS({ ...s, offerLetter: { ...ol, [k]: v } });
  const save = async () => {
    setBusy(true);
    try { await salesApiClient.put('/admin/settings', { rateAutoAdjust: s.rateAutoAdjust, offerLetter: ol }); onAutoAdjust(s.rateAutoAdjust); notify(true, 'Settings saved'); }
    catch (e) { notify(false, apiError(e)); } finally { setBusy(false); }
  };
  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      <div className={`${card} p-5`}>
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={s.rateAutoAdjust} onChange={e => setS({ ...s, rateAutoAdjust: e.target.checked })} className="mt-1 h-4 w-4 accent-[#00A86B]" />
          <span><span className="block text-[14px] font-bold text-[#0F172A]">Auto upgrade / downgrade commitment rates</span>
            <span className="block text-[12.5px] text-[#64748B]">Every month from the commitment date, sellers move to the rate their shipments earned — never above the rate their sales person committed. Switch off to keep every seller on their assigned rate.</span></span>
        </label>
      </div>
      <div className={`${card} p-5 space-y-4`}>
        <div className="flex items-center gap-2"><Settings2 className="w-4 h-4 text-[#00A86B]" /><h3 className="text-[14px] font-bold text-[#0F172A]">Offer letter</h3></div>
        <p className="text-[12px] text-[#94A3B8]">Issued automatically when a sales person's KYC is verified. Placeholders: {'{{name}} {{designation}} {{company}} {{employeeId}} {{joiningDate}} {{ctc}} {{location}}'}. The incentive plan is added to every letter. The letterhead uses the company billing details.</p>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelCls}>Signatory name</label><input value={ol.signatoryName} onChange={e => setOl('signatoryName', e.target.value)} className={fieldCls} /></div>
          <div><label className={labelCls}>Signatory designation</label><input value={ol.signatoryDesignation} onChange={e => setOl('signatoryDesignation', e.target.value)} className={fieldCls} /></div>
        </div>
        {(['body', 'terms'] as const).map(k => (
          <div key={k}>
            <div className="flex items-center justify-between mb-1.5"><label className="text-[12px] font-semibold text-[#475569]">{k === 'body' ? 'Letter body' : 'Terms'}</label>
              {!ol[k] && <button type="button" onClick={() => setOl(k, s.defaults[k])} className="text-[12px] font-semibold text-[#00A86B]">Start from the default text</button>}</div>
            <textarea value={ol[k]} onChange={e => setOl(k, e.target.value)} rows={k === 'body' ? 7 : 4} placeholder="Empty = the default text" className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-[13px] focus:outline-none focus:border-[#00A86B] resize-y" />
          </div>
        ))}
      </div>
      <div className="flex justify-end"><button disabled={busy} onClick={save} className={primaryBtn}>{busy ? 'Saving…' : 'Save settings'}</button></div>
    </div>
  );
}
