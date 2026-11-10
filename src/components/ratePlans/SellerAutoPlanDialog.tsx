import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Crown, AlertCircle, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

/* Admin, one seller: their automatic plan (backend /rate-plans/admin/seller/:id) — whether it applies and why
   not, the shipment commitment (changeable here), this month's shipments / recharges, the plan the 1st would
   give, and the history. */

interface TierRow { planName: string; minShipments: number; maxShipments: number | null; label: string }
interface SellerPlan {
  rechargeEnabled: boolean; shipmentEnabled: boolean; managed: boolean; reason: string | null;
  currentPlan: string | null; source: string | null; nextPlan: string | null;
  month: { period: string; recharged: number };
  shipment: { commitment: TierRow & { setBy: string }; shippedThisMonth: number } | null;
  history: { at: string; action: 'upgraded' | 'downgraded' | 'kept'; fromPlan?: string; toPlan?: string; note?: string }[];
}

const SOURCE_LABEL: Record<string, string> = { default: 'Signup default', recharge: 'Recharge plan', shipment: 'Shipment commitment', sales: 'Sales rate', admin: 'Assigned by admin' };
const inr = (v?: number) => `₹${(v ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const fmtDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '');
const errMsg = (e: unknown, fallback: string) => (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;

export function SellerAutoPlanDialog({ userId, onClose, onSaved }: { userId: string; onClose: () => void; onSaved?: (msg: string) => void }) {
  const [data, setData] = useState<SellerPlan | null>(null);
  const [tiers, setTiers] = useState<TierRow[]>([]);
  const [commitment, setCommitment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = () => Promise.all([apiClient.get(`/rate-plans/admin/seller/${userId}`), apiClient.get('/rate-plans/admin')])
    .then(([s, a]) => {
      setData(s.data);
      setTiers(a.data?.settings?.shipmentPlans || []);
      setCommitment(s.data?.shipment?.commitment?.planName || '');
    })
    .catch(e => setError(errMsg(e, 'Could not load the seller\'s plan.')));
  useEffect(() => { load(); }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async () => {
    setBusy(true); setError('');
    try {
      const res = await apiClient.put(`/rate-plans/admin/seller/${userId}/commitment`, { planName: commitment });
      onSaved?.(res.data?.message || 'Commitment saved');
      await load();
    } catch (e) { setError(errMsg(e, 'Could not save the commitment.')); } finally { setBusy(false); }
  };

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-sm" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label="Automatic plan" className="relative w-full max-w-lg bg-white rounded-2xl shadow-[0_24px_64px_-16px_rgba(15,23,42,0.35)] max-h-[calc(100vh-2rem)] flex flex-col">
        <div className="px-5 py-4 border-b border-[#F1F5F9] flex items-center justify-between gap-3 shrink-0">
          <h3 className="text-[15px] font-bold text-[#0F172A] flex items-center gap-2"><Crown className="w-4 h-4 text-amber-500" />Automatic plan</h3>
          <button onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-full flex items-center justify-center text-[#94A3B8] hover:bg-[#F1F5F9]"><X className="w-4 h-4" /></button>
        </div>
        <div className="overflow-y-auto p-5 space-y-4 text-[12.5px]">
          {error && <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-100 text-red-600"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{error}</div>}
          {!data ? (!error && <p className="text-[#94A3B8]">Loading…</p>) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                {[['Current plan', data.currentPlan || '—'], ['Set by', SOURCE_LABEL[data.source || ''] || 'Signup default (older account)'], ['From the 1st (if the month ended today)', data.nextPlan || '—'], ['This month', `${data.shipment ? `${data.shipment.shippedThisMonth.toLocaleString('en-IN')} shipments · ` : ''}${inr(data.month.recharged)} recharged`]].map(([l, v]) => (
                  <div key={l} className="rounded-xl bg-[#F8FAFC] border border-[#EEF2F6] px-3 py-2"><div className="text-[11px] text-[#94A3B8]">{l}</div><div className="font-semibold text-[#0F172A]">{v}</div></div>
                ))}
              </div>
              {!data.managed && data.reason && (
                <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-100 text-amber-800"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />Not changed automatically: {data.reason}</div>
              )}
              {!data.shipmentEnabled && <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-[#F0F9FF] border border-[#E0F2FE] text-[#075985]"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />Shipment commitment plans are switched off (Rate Cards → Automatic Plans). The commitment is kept and counts again once they are on.</div>}
              <div>
                <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Monthly shipment commitment</label>
                <div className="flex gap-2">
                  <select value={commitment} onChange={e => setCommitment(e.target.value)} className="flex-1 h-10 px-3 rounded-xl border border-[#E2E8F0] text-[13px] bg-white focus:outline-none focus:border-[#00A86B]">
                    <option value="">Choose…</option>
                    {tiers.map(t => <option key={t.planName} value={t.planName}>{t.label}</option>)}
                  </select>
                  <button disabled={busy || !commitment || commitment === data.shipment?.commitment?.planName} onClick={save} className="h-10 px-5 rounded-full bg-[#00A86B] hover:bg-[#009B63] text-white text-[13px] font-semibold disabled:opacity-50">{busy ? 'Saving…' : 'Save'}</button>
                </div>
                <p className="text-[11.5px] text-[#94A3B8] mt-1">{data.shipment?.commitment ? `Now: ${data.shipment.commitment.label} (${data.shipment.commitment.setBy === 'admin' ? 'set by admin' : 'chosen at registration'}). ` : ''}The seller can reach this plan by shipments; it counts from the next month-end review.</p>
              </div>
              {data.history.length > 0 && (
                <div>
                  <h4 className="text-[12.5px] font-bold text-[#0F172A] mb-1.5">Plan changes</h4>
                  <ul className="divide-y divide-[#F1F5F9] text-[12px]">
                    {data.history.map((h, i) => (
                      <li key={i} className="py-1.5 flex items-start gap-2">
                        {h.action === 'upgraded' ? <ArrowUpRight className="w-3.5 h-3.5 mt-0.5 text-emerald-600" /> : h.action === 'downgraded' ? <ArrowDownRight className="w-3.5 h-3.5 mt-0.5 text-red-500" /> : <Minus className="w-3.5 h-3.5 mt-0.5 text-[#94A3B8]" />}
                        <span className="text-[#64748B] w-[88px] shrink-0">{fmtDate(h.at)}</span>
                        <span className="text-[#0F172A]">{h.action === 'kept' ? `Kept ${h.toPlan}` : `${h.fromPlan} → ${h.toPlan}`}{h.note ? <span className="block text-[#94A3B8]">{h.note}</span> : null}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
