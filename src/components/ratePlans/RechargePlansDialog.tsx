import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Trash2, AlertCircle, Crown, Wallet, Package } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

/* Admin: automatic plans for sellers without a sales person (backend /rate-plans/admin). Two ladders:
   - Recharge plans: one recharge of a plan's amount moves a seller to that rate card at once; at month end the
     month's recharges decide the plan they keep.
   - Shipment commitment plans: the "Monthly Orders" a seller picks at registration is their commitment; at month
     end they get the plan their shipments reached, never above the committed one.
   The month-end review gives the better of the two. Sellers with a sales person, an admin-assigned plan or custom
   rates are never moved. */

interface Step { planName: string; minRecharge: number }
interface Tier { planName: string; minShipments: number; maxShipments: number | null; label?: string }

function Note({ children, tone = 'warn' }: { children: ReactNode; tone?: 'warn' | 'info' }) {
  const cls = tone === 'warn' ? 'bg-amber-50 border-amber-100 text-amber-800' : 'bg-[#F0F9FF] border-[#E0F2FE] text-[#075985]';
  return <div className={`flex items-start gap-2 px-3 py-2 rounded-xl border text-[12.5px] ${cls}`}><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><span>{children}</span></div>;
}

// What sellers see in the registration dropdown: the ranges only (the plan name is not shown to them)
const tierPreview = (tiers: Tier[]) => {
  const sorted = [...tiers].filter(t => t.planName).sort((a, b) => a.minShipments - b.minShipments);
  return sorted.map((t, i) => `${t.maxShipments != null && t.maxShipments >= t.minShipments ? `${t.minShipments}-${t.maxShipments}${i === sorted.length - 1 ? '+' : ''}` : `${t.minShipments}+`} (${t.planName})`);
};

export function RechargePlansDialog({ onClose, onSaved }: { onClose: () => void; onSaved?: (msg: string) => void }) {
  const [enabled, setEnabled] = useState(true);
  const [steps, setSteps] = useState<Step[] | null>(null);
  const [shipEnabled, setShipEnabled] = useState(true);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [planNames, setPlanNames] = useState<string[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [shipCounts, setShipCounts] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get('/rate-plans/admin').then(res => {
      const s = res.data?.settings || {};
      setEnabled(s.enabled !== false);
      setSteps(s.plans || []);
      setShipEnabled(s.shipmentEnabled === true);
      setTiers((s.shipmentPlans || []).map((t: Tier) => ({ planName: t.planName, minShipments: t.minShipments, maxShipments: t.maxShipments ?? null })));
      setPlanNames(res.data?.planNames || []);
      setCounts(res.data?.sellersOnRechargePlans || {});
      setShipCounts(res.data?.sellersOnShipmentPlans || {});
    }).catch(e => { setError(e?.response?.data?.message || 'Could not load the automatic plans.'); setSteps([]); });
  }, []);

  const update = (i: number, patch: Partial<Step>) => setSteps(s => (s || []).map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const updateTier = (i: number, patch: Partial<Tier>) => setTiers(t => t.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const save = async () => {
    setBusy(true); setError('');
    try {
      const res = await apiClient.put('/rate-plans/admin', { enabled, plans: steps, shipmentEnabled: shipEnabled, shipmentPlans: tiers });
      onSaved?.(res.data?.message || 'Automatic plans saved');
      onClose();
    } catch (e) {
      setError((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Could not save the automatic plans.');
    } finally { setBusy(false); }
  };

  // plans in a list that have no courier rates (switching that list on is refused while there are any)
  const missing = (steps || []).map(s => s.planName).filter(p => p && !planNames.includes(p));
  const missingTiers = tiers.map(t => t.planName).filter(p => p && !planNames.includes(p));

  const field = 'h-10 px-3 rounded-xl border border-[#E2E8F0] text-[13px] text-[#0F172A] bg-white focus:outline-none focus:border-[#00A86B]';
  const planSelect = (value: string, onChange: (v: string) => void) => (
    <select value={value} onChange={e => onChange(e.target.value)} className={`${field} w-full`}>
      <option value="">Choose a plan</option>
      {[...new Set([...planNames, value].filter(Boolean))].map(p => <option key={p} value={p}>{p}</option>)}
    </select>
  );
  const removeBtn = (onClick: () => void) => <button onClick={onClick} aria-label="Remove" className="w-9 h-9 rounded-full flex items-center justify-center text-[#94A3B8] hover:text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>;
  const addBtn = (onClick: () => void) => <button onClick={onClick} className="h-9 px-3.5 rounded-full border border-dashed border-[#00A86B]/50 text-[12.5px] font-semibold text-[#00A86B] inline-flex items-center gap-1.5 hover:bg-[#F0FDF4]"><Plus className="w-3.5 h-3.5" />Add plan</button>;

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-sm" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label="Automatic plans" className="relative w-full max-w-2xl bg-white rounded-2xl shadow-[0_24px_64px_-16px_rgba(15,23,42,0.35)] max-h-[calc(100vh-2rem)] flex flex-col">
        <div className="px-5 py-4 border-b border-[#F1F5F9] flex items-center justify-between gap-3 shrink-0">
          <h3 className="text-[15px] font-bold text-[#0F172A] flex items-center gap-2"><Crown className="w-4 h-4 text-amber-500" />Automatic plans</h3>
          <button onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-full flex items-center justify-center text-[#94A3B8] hover:bg-[#F1F5F9]"><X className="w-4 h-4" /></button>
        </div>
        <div className="overflow-y-auto p-5 space-y-5">
          <p className="text-[12.5px] text-[#64748B]">For sellers without a sales person. Every new seller starts on the first plan. On the 1st of every month each seller gets the <b>better</b> of the plan their recharges earned and the plan their shipments earned (never below the first plan). Sellers with a sales person, a plan you assigned, or custom rates are never moved.</p>
          {error && <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-100 text-[12.5px] text-red-600"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{error}</div>}
          {steps && planNames.length === 0 && <Note>No rate card has courier rates yet. Create the rate cards (Bronze, Silver, …) with their courier rates first, then come back here.</Note>}
          {!steps ? <p className="text-[13px] text-[#94A3B8]">Loading…</p> : (
            <>
              {/* ── Shipment commitment ── */}
              <section className="rounded-2xl border border-[#EEF2F6] p-4 space-y-3">
                <h4 className="text-[13.5px] font-bold text-[#0F172A] flex items-center gap-2"><Package className="w-4 h-4 text-[#00A86B]" />Shipment commitment plans</h4>
                <p className="text-[12px] text-[#64748B]">These ranges are the <b>Monthly Orders</b> dropdown at registration; the seller's choice is their commitment (you can change it on the seller's profile). At month end the seller gets the plan their shipments reached, never above the committed plan.</p>
                <label className="flex items-center gap-2.5 text-[13px] text-[#0F172A] cursor-pointer">
                  <input type="checkbox" checked={shipEnabled} onChange={e => setShipEnabled(e.target.checked)} className="h-4 w-4 accent-[#00A86B]" />
                  <span className="font-semibold">Shipment commitment plans switched on</span>
                </label>
                {!shipEnabled && <Note tone="info">Switched off: shipments don't change anyone's plan. The registration dropdown still shows these ranges.</Note>}
                {shipEnabled && missingTiers.length > 0 && <Note>Before switching on, every plan needs courier rates. Missing for: <b>{missingTiers.join(', ')}</b> — add their rate cards, or remove them from the list.</Note>}
                <div className="space-y-2">
                  <div className="grid grid-cols-[1fr_110px_110px_36px] gap-2 text-[11.5px] font-semibold text-[#64748B]"><span>Rate card plan</span><span>From (shipments)</span><span>Up to (shown)</span><span /></div>
                  {tiers.map((t, i) => (
                    <div key={i} className="grid grid-cols-[1fr_110px_110px_36px] gap-2 items-start">
                      <div>
                        {planSelect(t.planName, v => updateTier(i, { planName: v }))}
                        {shipCounts[t.planName] ? <div className="text-[11px] text-[#94A3B8] mt-0.5">{shipCounts[t.planName]} seller{shipCounts[t.planName] > 1 ? 's' : ''} on it by shipments</div> : null}
                      </div>
                      <input type="number" min={0} step={1} value={t.minShipments} onChange={e => updateTier(i, { minShipments: Math.max(0, Math.round(Number(e.target.value) || 0)) })} className={`${field} w-full text-right tabular-nums`} />
                      <input type="number" min={0} step={1} value={t.maxShipments ?? ''} placeholder="—" onChange={e => updateTier(i, { maxShipments: e.target.value === '' ? null : Math.max(0, Math.round(Number(e.target.value) || 0)) })} className={`${field} w-full text-right tabular-nums`} />
                      {removeBtn(() => setTiers(x => x.filter((_, j) => j !== i)))}
                    </div>
                  ))}
                  {tiers.length < 10 && addBtn(() => setTiers(x => [...x, { planName: '', minShipments: 0, maxShipments: null }]))}
                </div>
                {tiers.some(t => t.planName) && <p className="text-[11.5px] text-[#64748B]">Registration dropdown (sellers see only the numbers): {tierPreview(tiers).join(' · ')}</p>}
              </section>

              {/* ── Recharge ── */}
              <section className="rounded-2xl border border-[#EEF2F6] p-4 space-y-3">
                <h4 className="text-[13.5px] font-bold text-[#0F172A] flex items-center gap-2"><Wallet className="w-4 h-4 text-[#00A86B]" />Recharge plans</h4>
                <p className="text-[12px] text-[#64748B]">One recharge of a plan's amount moves the seller to that rate card at once. At month end the month's recharges must reach the plan's amount again, otherwise the seller moves to the plan their recharges reached.</p>
                <label className="flex items-center gap-2.5 text-[13px] text-[#0F172A] cursor-pointer">
                  <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} className="h-4 w-4 accent-[#00A86B]" />
                  <span className="font-semibold">Recharge plans switched on</span>
                </label>
                {!enabled && <Note tone="info">Switched off: recharges don't change anyone's plan. Sellers already moved by a recharge keep their plan.</Note>}
                {enabled && missing.length > 0 && <Note>Before switching on, every plan needs courier rates. Missing for: <b>{missing.join(', ')}</b> — add their rate cards, or remove them from the list.</Note>}
                <div className="space-y-2">
                  <div className="grid grid-cols-[1fr_140px_36px] gap-2 text-[11.5px] font-semibold text-[#64748B]"><span>Rate card plan</span><span>Recharge (₹)</span><span /></div>
                  {steps.map((s, i) => (
                    <div key={i} className="grid grid-cols-[1fr_140px_36px] gap-2 items-start">
                      <div>
                        {planSelect(s.planName, v => update(i, { planName: v }))}
                        {counts[s.planName] ? <div className="text-[11px] text-[#94A3B8] mt-0.5">{counts[s.planName]} seller{counts[s.planName] > 1 ? 's' : ''} on it by recharge</div> : null}
                      </div>
                      <input type="number" min={1} step={1} value={s.minRecharge || ''} onChange={e => update(i, { minRecharge: Math.max(0, Math.round(Number(e.target.value) || 0)) })} className={`${field} w-full text-right tabular-nums`} />
                      {removeBtn(() => setSteps(st => (st || []).filter((_, j) => j !== i)))}
                    </div>
                  ))}
                  {steps.length < 10 && addBtn(() => setSteps(st => [...(st || []), { planName: '', minRecharge: 0 }]))}
                </div>
              </section>
            </>
          )}
        </div>
        <div className="px-5 py-3.5 border-t border-[#F1F5F9] flex justify-end gap-2.5">
          <button onClick={onClose} className="h-10 px-5 rounded-full border border-[#E2E8F0] text-[13px] font-semibold text-[#475569] hover:bg-[#F8FAFC]">Cancel</button>
          <button disabled={busy || !steps?.length || !tiers.length} onClick={save} className="h-10 px-5 rounded-full bg-[#00A86B] hover:bg-[#009B63] text-white text-[13px] font-semibold disabled:opacity-50">{busy ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
