import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Crown, CheckCircle2, AlertCircle, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { openRechargePopup } from '../../utils/walletEvents';

/* Recharge plans for sellers without a sales person (backend: /rate-plans/my). One recharge of a plan's amount
   moves the seller to that plan at once; at month end the month's recharges must reach the plan's amount again
   or the plan moves down. Choosing a plan opens the wallet recharge with that amount filled in. */

interface PlanRow { planName: string; minRecharge: number; isCurrent: boolean; isHigher: boolean; preview: Record<string, number | null> | null }
interface TierRow { planName: string; minShipments: number; maxShipments: number | null; label: string; isCurrent?: boolean; isCommitment?: boolean }
interface MyPlans {
  enabled: boolean; rechargeEnabled?: boolean; managed: boolean; message: string | null; currentPlan: string | null;
  plans: PlanRow[];
  month: { period: string; recharged: number; biggestRecharge: number };
  keep: { planName: string; amount: number; recharged: number; remaining: number; monthEnd: string } | null;
  shipment?: { tiers: TierRow[]; commitment: TierRow & { setBy: string }; shippedThisMonth: number; monthEnd: string } | null;
  nextPlan?: string | null;
  history: { at: string; action: 'upgraded' | 'downgraded' | 'kept'; fromPlan?: string; toPlan?: string; amount?: number; shipments?: number; period?: string; note?: string }[];
}

const inr = (v?: number) => `₹${(v ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const fmtDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '');
const ZONES = ['zoneA', 'zoneB', 'zoneC', 'zoneD', 'zoneE'];

export function UpgradePlanDialog({ onClose }: { onClose: () => void }) {
  const [data, setData] = useState<MyPlans | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    apiClient.get('/rate-plans/my').then(res => setData(res.data)).catch(e => setError(e?.response?.data?.message || 'Could not load the plans. Please try again.'));
  }, []);

  // the wallet recharge has a Rs.1,000 minimum: never prefill less
  const recharge = (amount: number) => { onClose(); openRechargePopup(Math.max(1000, Math.round(amount))); };

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-sm" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label="Upgrade plan" className="relative w-full max-w-3xl bg-white rounded-2xl shadow-[0_24px_64px_-16px_rgba(15,23,42,0.35)] max-h-[calc(100vh-2rem)] flex flex-col">
        <div className="px-5 py-4 border-b border-[#F1F5F9] flex items-center justify-between gap-3 shrink-0">
          <h3 className="text-[15px] font-bold text-[#0F172A] flex items-center gap-2"><Crown className="w-4 h-4 text-amber-500" />Upgrade plan</h3>
          <button onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-full flex items-center justify-center text-[#94A3B8] hover:bg-[#F1F5F9]"><X className="w-4 h-4" /></button>
        </div>
        <div className="overflow-y-auto p-5">
          {error ? <p className="text-[13px] text-red-600">{error}</p> : !data ? <p className="text-[13px] text-[#94A3B8] py-10 text-center">Loading plans…</p> : !data.enabled ? (
            <p className="text-[13px] text-[#64748B] py-6 text-center">Automatic plans are not available right now.</p>
          ) : (
            <div className="space-y-4">
              {!data.managed && data.message && (
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-100 text-[12.5px] text-amber-800"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{data.message}</div>
              )}
              {data.managed && data.plans.length > 0 && !data.plans.some(p => p.isHigher) && (
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-[12.5px] text-[#14532D]"><CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />You are on the highest plan.</div>
              )}
              {data.managed && data.currentPlan && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-[#475569]">
                  <span>Current plan: <b className="text-[#0F172A]">{data.currentPlan}</b></span>
                  {data.nextPlan && <span>If the month ended today, from the 1st: <b className="text-[#0F172A]">{data.nextPlan}</b></span>}
                </div>
              )}
              {/* ── Shipment commitment ── */}
              {data.managed && data.shipment && (() => {
                const s = data.shipment;
                const need = s.commitment.minShipments;
                const pct = need > 0 ? Math.min(100, Math.round((s.shippedThisMonth / need) * 100)) : 100;
                const done = s.shippedThisMonth >= need;
                return (
                  <div className="rounded-xl border border-[#EEF2F6] px-4 py-3 text-[12.5px] space-y-2">
                    <div className="font-semibold text-[#0F172A]">Your monthly shipment commitment: {s.commitment.label}</div>
                    <p className="text-[#64748B]">On the 1st of every month you move to the plan your shipments of the month reached, up to <b>{s.commitment.planName}</b>. To change your commitment, please contact support.</p>
                    {need > 0 && (
                      <>
                        <div className="h-2 rounded-full bg-[#E2E8F0] overflow-hidden"><div className={`h-full ${done ? 'bg-[#00A86B]' : 'bg-amber-500'}`} style={{ width: `${pct}%` }} /></div>
                        <div className="text-[#64748B]">{s.shippedThisMonth.toLocaleString('en-IN')} of {need.toLocaleString('en-IN')} shipments this month{done ? ` · ${s.commitment.planName} reached` : ` · ship ${(need - s.shippedThisMonth).toLocaleString('en-IN')} more by month end for ${s.commitment.planName}`}</div>
                      </>
                    )}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {s.tiers.map(t => (
                        <span key={t.planName} className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${t.isCommitment ? 'border-[#00A86B] text-[#00A86B] bg-[#F0FDF4]' : 'border-[#E2E8F0] text-[#64748B]'}`}>{t.label}{t.isCurrent ? ' · current' : ''}</span>
                      ))}
                    </div>
                  </div>
                );
              })()}
              {data.managed && data.rechargeEnabled !== false && data.plans.length > 0 && (
                <p className="text-[12.5px] text-[#475569]">Or recharge your wallet with a plan's amount in <b>one payment</b> and your rates move to that plan at once. To keep it, your recharges in each month need to add up to the plan's amount; otherwise from the 1st of next month you move to the plan your recharges or shipments reached.</p>
              )}
              {data.keep && (
                <div className="rounded-xl border border-[#EEF2F6] bg-[#F8FAFC] px-4 py-3 text-[12.5px]">
                  <div className="font-semibold text-[#0F172A]">Keep {data.keep.planName} next month</div>
                  <div className="h-2 rounded-full bg-[#E2E8F0] overflow-hidden mt-2"><div className="h-full bg-[#00A86B]" style={{ width: `${Math.min(100, Math.round((data.keep.recharged / Math.max(1, data.keep.amount)) * 100))}%` }} /></div>
                  <div className="text-[#64748B] mt-1.5">{inr(data.keep.recharged)} of {inr(data.keep.amount)} recharged this month{data.keep.remaining > 0 ? ` · recharge ${inr(data.keep.remaining)} more by month end` : ' · plan kept'}</div>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {data.plans.map(p => (
                  <div key={p.planName} className={`rounded-2xl border p-4 flex flex-col ${p.isCurrent ? 'border-[#00A86B] bg-[#F0FDF4]' : 'border-[#E2E8F0]'}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[14px] font-bold text-[#0F172A]">{p.planName}</span>
                      {p.isCurrent && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#00A86B] text-white text-[10.5px] font-bold"><CheckCircle2 className="w-3 h-3" />Current</span>}
                    </div>
                    <div className="text-[12px] text-[#64748B] mt-0.5">Recharge {inr(p.minRecharge)}</div>
                    {p.preview && (
                      <div className="mt-3 text-[11.5px]">
                        <div className="text-[#94A3B8] mb-1">500 g from</div>
                        <div className="grid grid-cols-5 gap-1 text-center">
                          {ZONES.map(z => <div key={z}><div className="text-[10px] text-[#94A3B8]">{z.slice(-1)}</div><div className="font-semibold text-[#0F172A] tabular-nums">{p.preview?.[z] == null ? '—' : `₹${p.preview[z]}`}</div></div>)}
                        </div>
                      </div>
                    )}
                    <div className="mt-auto pt-3">
                      {data.managed && p.isHigher && (
                        <button onClick={() => recharge(p.minRecharge)} className="w-full h-9 rounded-full bg-[#00A86B] hover:bg-[#009B63] text-white text-[12.5px] font-semibold">Recharge {inr(p.minRecharge)}</button>
                      )}
                      {data.managed && p.isCurrent && data.keep && data.keep.remaining > 0 && (
                        <button onClick={() => recharge(Math.max(1000, data.keep!.remaining))} className="w-full h-9 rounded-full border border-[#00A86B] text-[#00A86B] text-[12.5px] font-semibold hover:bg-[#F0FDF4]">Recharge to keep</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {data.plans.length > 0 && <p className="text-[11px] text-[#94A3B8]">Prices are forward freight per shipment for 500 g with the cheapest courier, before GST and COD. Zones: A within city, B within state, C metro to metro, D rest of India, E special areas.</p>}
              {data.history.length > 0 && (
                <div>
                  <h4 className="text-[12.5px] font-bold text-[#0F172A] mb-1.5">Plan changes</h4>
                  <ul className="divide-y divide-[#F1F5F9] text-[12px]">
                    {data.history.map((h, i) => (
                      <li key={i} className="py-1.5 flex items-center gap-2">
                        {h.action === 'upgraded' ? <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" /> : h.action === 'downgraded' ? <ArrowDownRight className="w-3.5 h-3.5 text-red-500" /> : <Minus className="w-3.5 h-3.5 text-[#94A3B8]" />}
                        <span className="text-[#64748B] w-[92px] shrink-0">{fmtDate(h.at)}</span>
                        <span className="text-[#0F172A]">{h.action === 'kept' ? `Kept ${h.toPlan}` : `${h.fromPlan} → ${h.toPlan}`}</span>
                        {(h.note || h.amount != null) && <span className="ml-auto text-[#94A3B8] text-right">{h.note || (h.action === 'upgraded' ? `recharge ${inr(h.amount)}` : `${inr(h.amount)} in the month`)}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
