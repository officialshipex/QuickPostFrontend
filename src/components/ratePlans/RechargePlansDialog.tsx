import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Trash2, AlertCircle, Crown } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

/* Admin: recharge plans for sellers without a sales person (backend /rate-plans/admin). One recharge of a plan's
   amount moves a seller to that rate card at once; at month end the month's recharges must reach it again or the
   seller moves down. Sellers with a sales person, an admin-assigned plan or custom rates are never moved. */

interface Step { planName: string; minRecharge: number }

function Note({ children, tone = 'warn' }: { children: ReactNode; tone?: 'warn' | 'info' }) {
  const cls = tone === 'warn' ? 'bg-amber-50 border-amber-100 text-amber-800' : 'bg-[#F0F9FF] border-[#E0F2FE] text-[#075985]';
  return <div className={`flex items-start gap-2 px-3 py-2 rounded-xl border text-[12.5px] ${cls}`}><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><span>{children}</span></div>;
}

export function RechargePlansDialog({ onClose, onSaved }: { onClose: () => void; onSaved?: (msg: string) => void }) {
  const [enabled, setEnabled] = useState(true);
  const [steps, setSteps] = useState<Step[] | null>(null);
  const [planNames, setPlanNames] = useState<string[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get('/rate-plans/admin').then(res => {
      setEnabled(res.data?.settings?.enabled !== false);
      setSteps(res.data?.settings?.plans || []);
      setPlanNames(res.data?.planNames || []);
      setCounts(res.data?.sellersOnRechargePlans || {});
    }).catch(e => { setError(e?.response?.data?.message || 'Could not load recharge plans.'); setSteps([]); });
  }, []);

  const update = (i: number, patch: Partial<Step>) => setSteps(s => (s || []).map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const save = async () => {
    setBusy(true); setError('');
    try {
      const res = await apiClient.put('/rate-plans/admin', { enabled, plans: steps });
      onSaved?.(res.data?.message || 'Recharge plans saved');
      onClose();
    } catch (e) {
      setError((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Could not save the recharge plans.');
    } finally { setBusy(false); }
  };

  // plans in the list that have no courier rates (switching on is refused while there are any)
  const missing = (steps || []).map(s => s.planName).filter(p => p && !planNames.includes(p));

  const field = 'h-10 px-3 rounded-xl border border-[#E2E8F0] text-[13px] text-[#0F172A] bg-white focus:outline-none focus:border-[#00A86B]';
  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-sm" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label="Recharge plans" className="relative w-full max-w-lg bg-white rounded-2xl shadow-[0_24px_64px_-16px_rgba(15,23,42,0.35)] max-h-[calc(100vh-2rem)] flex flex-col">
        <div className="px-5 py-4 border-b border-[#F1F5F9] flex items-center justify-between gap-3 shrink-0">
          <h3 className="text-[15px] font-bold text-[#0F172A] flex items-center gap-2"><Crown className="w-4 h-4 text-amber-500" />Recharge plans</h3>
          <button onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-full flex items-center justify-center text-[#94A3B8] hover:bg-[#F1F5F9]"><X className="w-4 h-4" /></button>
        </div>
        <div className="overflow-y-auto p-5 space-y-4">
          <p className="text-[12.5px] text-[#64748B]">For sellers without a sales person. One recharge of a plan's amount moves the seller to that rate card at once. At month end the month's recharges must reach the plan's amount again, otherwise the seller moves to the plan their recharges reached (never below the first). Sellers with a sales person, a plan you assigned, or custom rates are never moved.</p>
          <label className="flex items-center gap-2.5 text-[13px] text-[#0F172A] cursor-pointer">
            <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} className="h-4 w-4 accent-[#00A86B]" />
            <span className="font-semibold">Recharge plans switched on</span>
          </label>
          {!enabled && <Note tone="info">Switched off: sellers don't see "Upgrade plan" and recharges don't change anyone's plan. Sellers already moved by a recharge keep their plan.</Note>}
          {steps && planNames.length === 0 && <Note>No rate card has courier rates yet. Create the rate cards (Bronze, Silver, …) with their courier rates first, then come back here.</Note>}
          {steps && enabled && missing.length > 0 && <Note>Before switching on, every plan needs courier rates. Missing for: <b>{missing.join(', ')}</b> — add their rate cards, or remove them from the list.</Note>}
          {error &&<div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-100 text-[12.5px] text-red-600"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{error}</div>}
          {!steps ? <p className="text-[13px] text-[#94A3B8]">Loading…</p> : (
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_140px_36px] gap-2 text-[11.5px] font-semibold text-[#64748B]"><span>Rate card plan</span><span>Recharge (₹)</span><span /></div>
              {steps.map((s, i) => (
                <div key={i} className="grid grid-cols-[1fr_140px_36px] gap-2 items-center">
                  <div>
                    <select value={s.planName} onChange={e => update(i, { planName: e.target.value })} className={`${field} w-full`}>
                      <option value="">Choose a plan</option>
                      {[...new Set([...planNames, s.planName].filter(Boolean))].map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    {counts[s.planName] ? <div className="text-[11px] text-[#94A3B8] mt-0.5">{counts[s.planName]} seller{counts[s.planName] > 1 ? 's' : ''} on it by recharge</div> : null}
                    {s.planName && !planNames.includes(s.planName) && <div className="text-[11px] text-amber-600 mt-0.5">No courier rates set up for this plan — sellers won't see it.</div>}
                  </div>
                  <input type="number" min={0} step={1} value={s.minRecharge || ''} onChange={e => update(i, { minRecharge: Math.max(0, Math.round(Number(e.target.value) || 0)) })} className={`${field} w-full text-right tabular-nums`} />
                  <button onClick={() => setSteps(st => (st || []).filter((_, j) => j !== i))} aria-label="Remove" className="w-9 h-9 rounded-full flex items-center justify-center text-[#94A3B8] hover:text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
              {steps.length < 10 && (
                <button onClick={() => setSteps(st => [...(st || []), { planName: '', minRecharge: 0 }])} className="h-9 px-3.5 rounded-full border border-dashed border-[#00A86B]/50 text-[12.5px] font-semibold text-[#00A86B] inline-flex items-center gap-1.5 hover:bg-[#F0FDF4]"><Plus className="w-3.5 h-3.5" />Add plan</button>
              )}
            </div>
          )}
        </div>
        <div className="px-5 py-3.5 border-t border-[#F1F5F9] flex justify-end gap-2.5">
          <button onClick={onClose} className="h-10 px-5 rounded-full border border-[#E2E8F0] text-[13px] font-semibold text-[#475569] hover:bg-[#F8FAFC]">Cancel</button>
          <button disabled={busy || !steps?.length} onClick={save} className="h-10 px-5 rounded-full bg-[#00A86B] hover:bg-[#009B63] text-white text-[13px] font-semibold disabled:opacity-50">{busy ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
