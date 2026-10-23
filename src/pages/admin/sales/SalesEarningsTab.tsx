import { useEffect, useState } from 'react';
import { Award, Wallet, CheckCircle2, Clock, Gift, TrendingUp, Receipt } from 'lucide-react';
import { TableLoader } from '../../../components/ui/TableLoader';
import { salesApiClient, inr, periodLabel, type SalesEarnings } from '../../../services/salesApi';

/* Earnings: this month's live incentive (slab, badge, progress to the next slab), the plan, every amount earned
   and every payment the admin made (with UTR). Sales people have no wallet — the admin pays out of band. */

const card = 'bg-white rounded-2xl border border-[#EEF2F6] shadow-[0_1px_2px_rgba(16,24,40,0.04),0_2px_8px_rgba(16,24,40,0.05)]';
const n = (v?: number) => (v ?? 0).toLocaleString('en-IN');
const fmtDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

export function BadgeChip({ badge, color, size = 'sm' }: { badge?: string; color?: string; size?: 'sm' | 'md' }) {
  if (!badge) return <span className="text-[#94A3B8]">—</span>;
  const c = color || '#00A86B';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-bold whitespace-nowrap ${size === 'md' ? 'px-3 py-1 text-[12.5px]' : 'px-2 py-0.5 text-[11px]'}`}
      style={{ color: c, backgroundColor: `${c}14`, border: `1px solid ${c}40` }}>
      <Award className={size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3'} />{badge}
    </span>
  );
}

export function SalesEarningsTab({ viewAsId }: { viewAsId?: string }) {
  const [data, setData] = useState<SalesEarnings | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    salesApiClient.get('/earnings', { params: viewAsId ? { employeeId: viewAsId } : {} })
      .then(res => { if (alive) setData(res.data); })
      .catch(() => { if (alive) setError(true); });
    return () => { alive = false; };
  }, [viewAsId]);

  if (error) return <div className={`${card} p-10 text-center text-[13px] text-[#64748B]`}>Could not load earnings. Please refresh.</div>;
  if (!data) return <div className="relative h-60"><TableLoader /></div>;

  const cur = data.current;
  const slabs = data.plan?.slabs || [];
  const bonus = data.plan?.onboardingBonus;
  const nextPct = cur?.nextSlab ? Math.min(100, Math.round((cur.shipments / cur.nextSlab.minShipments) * 100)) : 100;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5">
        {/* This month */}
        <div className={`${card} p-5 lg:col-span-2`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-[12px] font-semibold text-[#64748B]">{periodLabel(cur?.period)} · so far</div>
              <div className="text-[28px] font-bold text-[#0F172A] tabular-nums leading-tight mt-1">{inr(cur?.amount)}</div>
              <div className="text-[12.5px] text-[#64748B] mt-0.5">{cur?.percent ?? 0}% of {inr(cur?.freight)} freight · {n(cur?.shipments)} shipments by {n(cur?.sellers)} sellers</div>
            </div>
            <BadgeChip badge={cur?.badge} color={cur?.badgeColor} size="md" />
          </div>
          <div className="mt-5">
            <div className="flex items-center justify-between text-[12.5px]">
              <span className="font-medium text-[#334155]">{cur?.nextSlab ? `Next: ${cur.nextSlab.badge || 'next slab'} at ${n(cur.nextSlab.minShipments)} shipments (${cur.nextSlab.percent}%)` : 'Top slab reached'}</span>
              {cur?.nextSlab && <span className="text-[#64748B] tabular-nums">{n(cur.nextSlab.needed)} to go</span>}
            </div>
            <div className="mt-1.5 h-2.5 rounded-full bg-[#F1F5F9] overflow-hidden"><div className="h-full rounded-full bg-[#00A86B] transition-all" style={{ width: `${nextPct}%` }} /></div>
            <p className="text-[11.5px] text-[#94A3B8] mt-2">Calculated on the last day of the month on your sellers' shipments that have gone in transit (booked-but-not-picked-up and cancelled ones don't count), then paid by the admin to your verified bank account.</p>
          </div>
        </div>
        {/* Totals */}
        <div className={`${card} p-5 flex flex-col gap-3`}>
          {[
            { label: 'Total earned', value: data.totals?.earned, icon: TrendingUp, tone: 'bg-sky-50 text-sky-600' },
            { label: 'Paid to you', value: data.totals?.paid, icon: CheckCircle2, tone: 'bg-emerald-50 text-emerald-600' },
            { label: 'Awaiting payment', value: data.totals?.unpaid, icon: Clock, tone: 'bg-amber-50 text-amber-600' },
          ].map(t => (
            <div key={t.label} className="flex items-center gap-3">
              <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${t.tone}`}><t.icon className="w-[18px] h-[18px]" /></span>
              <div><div className="text-[12px] text-[#64748B]">{t.label}</div><div className="text-[17px] font-bold text-[#0F172A] tabular-nums">{inr(t.value)}</div></div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5 items-start">
        <div className={`${card} overflow-hidden`}>
          <div className="px-5 py-4 border-b border-[#F1F5F9]">
            <h2 className="text-[14px] font-bold text-[#0F172A]">Monthly incentive · {data.plan?.name}</h2>
            <p className="text-[12px] text-[#94A3B8]">In-transit shipments in the month decide the % paid on all their freight</p>
          </div>
          <table className="w-full text-left text-[12.5px]">
            <thead><tr className="bg-[#FAFBFC] text-[11.5px] font-semibold text-[#64748B]"><th className="py-2.5 px-5">Shipments / month</th><th className="py-2.5 px-5">Commission</th><th className="py-2.5 px-5">Badge</th></tr></thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {slabs.map(s => {
                const on = cur?.badge === s.badge && cur?.percent === s.percent;
                return (
                  <tr key={s.minShipments} className={on ? 'bg-[#F0FDF4]' : ''}>
                    <td className="py-2.5 px-5 tabular-nums font-medium text-[#0F172A]">{n(s.minShipments)}{s.maxShipments ? ` – ${n(s.maxShipments)}` : ' and above'}</td>
                    <td className="py-2.5 px-5 font-semibold text-[#0F172A]">{s.percent}%</td>
                    <td className="py-2.5 px-5"><BadgeChip badge={s.badge} color={s.color} />{on && <span className="ml-2 text-[11px] font-semibold text-[#00A86B]">You're here</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className={`${card} p-5`}>
          <div className="flex items-center gap-2"><Gift className="w-4 h-4 text-[#00A86B]" /><h2 className="text-[14px] font-bold text-[#0F172A]">Onboarding bonus</h2></div>
          {bonus?.enabled && bonus.amount > 0 ? (
            <ul className="mt-3 space-y-2 text-[12.5px] text-[#475569]">
              <li><b className="text-[#0F172A]">{inr(bonus.amount)}</b> for every seller who registers with your referral code and, within <b className="text-[#0F172A]">{bonus.withinDays} days</b>:</li>
              {bonus.requireKyc && <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-[#00A86B] shrink-0" />completes KYC</li>}
              <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-[#00A86B] shrink-0" />makes a first recharge of at least {inr(bonus.minRecharge)} (only the first recharge counts)</li>
              <li className="text-[11.5px] text-[#94A3B8]">Added to your earnings automatically within a day of the seller qualifying.</li>
            </ul>
          ) : <p className="mt-2 text-[12.5px] text-[#94A3B8]">No onboarding bonus on your plan.</p>}
        </div>
      </div>

      <div className={`${card} overflow-hidden`}>
        <div className="px-5 py-4 border-b border-[#F1F5F9] flex items-center gap-2"><Wallet className="w-4 h-4 text-[#00A86B]" /><h2 className="text-[14px] font-bold text-[#0F172A]">Earnings</h2></div>
        {(data.earnings || []).length === 0 ? (
          <p className="px-5 py-10 text-center text-[12.5px] text-[#94A3B8]">Bonuses and monthly incentives will be listed here.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[720px] text-[12.5px] text-[#475569]">
              <thead><tr className="bg-[#E6F9F2] text-xs font-medium text-[#64748B] uppercase tracking-wider">{['Date', 'Type', 'Details', 'Amount', 'Status'].map(h => <th key={h} className="py-2.5 px-4">{h}</th>)}</tr></thead>
              <tbody>
                {(data.earnings || []).map(e => (
                  <tr key={e._id} className="border-b border-[#F1F5F9] last:border-0">
                    <td className="py-3 px-4 whitespace-nowrap">{fmtDate(e.earnedAt)}</td>
                    <td className="py-3 px-4 font-semibold text-[#0F172A]">{e.type === 'onboarding_bonus' ? 'Onboarding bonus' : `Incentive · ${periodLabel(e.period)}`}</td>
                    <td className="py-3 px-4">{e.type === 'onboarding_bonus'
                      ? `${e.details?.sellerName || 'Seller'} · recharge ${inr(e.details?.rechargeAmount)}`
                      : <span className="inline-flex items-center gap-2">{n(e.details?.shipments)} shipments · {e.details?.percent}% of {inr(e.details?.freight)} <BadgeChip badge={e.details?.badge} /></span>}</td>
                    <td className="py-3 px-4 font-bold text-[#0F172A] tabular-nums">{inr(e.amount)}</td>
                    <td className="py-3 px-4">{e.status === 'paid'
                      ? <span className="text-[12px] font-semibold text-emerald-700">Paid{e.payout?.utr ? ` · UTR ${e.payout.utr}` : ''}</span>
                      : <span className="text-[12px] font-semibold text-amber-700">Awaiting payment</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className={`${card} overflow-hidden`}>
        <div className="px-5 py-4 border-b border-[#F1F5F9] flex items-center gap-2"><Receipt className="w-4 h-4 text-[#00A86B]" /><h2 className="text-[14px] font-bold text-[#0F172A]">Payments received</h2></div>
        {(data.payouts || []).length === 0 ? (
          <p className="px-5 py-10 text-center text-[12.5px] text-[#94A3B8]">Payments made to your bank account will appear here with their UTR.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[560px] text-[12.5px] text-[#475569]">
              <thead><tr className="bg-[#E6F9F2] text-xs font-medium text-[#64748B] uppercase tracking-wider">{['Paid on', 'UTR', 'Amount', 'Note'].map(h => <th key={h} className="py-2.5 px-4">{h}</th>)}</tr></thead>
              <tbody>
                {(data.payouts || []).map(p => (
                  <tr key={p._id} className="border-b border-[#F1F5F9] last:border-0">
                    <td className="py-3 px-4 whitespace-nowrap">{fmtDate(p.paidAt)}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-[#0F172A]">{p.utr}</td>
                    <td className="py-3 px-4 font-bold text-[#0F172A] tabular-nums">{inr(p.amount)}</td>
                    <td className="py-3 px-4">{p.note || '—'}</td>
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
