import { useCallback, useEffect, useState } from 'react';
import { Gift, Copy, Check, Link2, Users, Wallet, Percent, RefreshCcw, MessageCircle, CheckCircle2, Clock, XCircle, ArrowRightLeft } from 'lucide-react';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { TableLoader } from '../../components/ui/TableLoader';
import { apiClient } from '../../services/apiClient';
import { copyToClipboard } from '../../utils/clipboard';
import { SlabBadge as BadgeChip } from './ReferralProgramDialogs';

/* Seller: Invite & Earn. Their referral code and link, the joining bonus for each friend (KYC + first recharge),
   the monthly commission on their friends' shipments — both paid straight into the wallet — and, for commission
   from before automatic crediting, a transfer to the wallet. Backend GET /referral/stats, POST /referral/withdraw. */

interface Stats { referredFriends: number; referralOrders: number; totalShipping: number; totalCommission: number; withdrawn: number; remaining: number; bonusEarned: number; bonusCount: number }
interface MonthRow { _id: string; month: string; referralOrders: number; shippingCharges: number; commission: number; commissionRate: number | null; badge?: string; creditedToWallet: number }
interface Friend { _id: string; name: string; joinedAt: string; kycDone: boolean; bonusStatus: 'credited' | 'processing' | 'pending' | 'expired' | 'not_eligible'; bonusAmount: number; bonusDeadline: string }
interface Slab { minShipments: number; maxShipments: number | null; percent: number; badge: string; color?: string }
interface CurrentMonth {
  period: string; shipments: number; freight: number; percent: number; badge: string; badgeColor: string; amount: number;
  nextSlab: { minShipments: number; percent: number; badge: string; needed: number } | null;
}
interface StatsResponse {
  stats: Stats; monthlyData: MonthRow[]; referralCommissionPercentage: number; referralCode: string;
  program: { joiningBonus: { enabled: boolean; amount: number; minFirstRecharge: number; withinDays: number; requireKyc: boolean } };
  plan: { name: string; slabs: Slab[] };
  currentMonth: CurrentMonth;
  referredUsers: Friend[];
}

const card = 'bg-white rounded-2xl border border-[#EEF2F6] shadow-[0_1px_2px_rgba(16,24,40,0.04),0_2px_8px_rgba(16,24,40,0.05)]';
const inr = (v?: number) => `₹${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const fmt = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

const BONUS: Record<Friend['bonusStatus'], { label: (f: Friend) => string; tone: string; icon: typeof Clock }> = {
  credited: { label: f => `${inr(f.bonusAmount)} credited`, tone: 'text-emerald-700', icon: CheckCircle2 },
  processing: { label: () => 'Being credited', tone: 'text-sky-700', icon: Clock },
  pending: { label: f => `Waiting · till ${fmt(f.bonusDeadline)}`, tone: 'text-amber-700', icon: Clock },
  expired: { label: () => 'Time limit passed', tone: 'text-[#94A3B8]', icon: XCircle },
  not_eligible: { label: () => 'First recharge too small', tone: 'text-[#94A3B8]', icon: XCircle },
};

export function UserReferral() {
  const [data, setData] = useState<StatsResponse | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let alive = true;
    apiClient.get('/referral/stats', { params: { page: 1, limit: 24 } })
      .then(res => { if (alive) { setData(res.data); setError(''); } })
      .catch(() => { if (alive) setError('Could not load your referral details. Please refresh.'); });
    return () => { alive = false; };
  }, [reload]);
  const refresh = useCallback(() => setReload(r => r + 1), []);

  const code = data?.referralCode || '';
  const link = code ? `${window.location.origin}/register?ref=${encodeURIComponent(code)}` : '';
  const bonus = data?.program.joiningBonus;
  const shareText = bonus?.enabled
    ? `Sign up with my referral code ${code} and start shipping: ${link}`
    : `Sign up with my referral code ${code}: ${link}`;
  const copy = async (key: string, value: string) => { if (value && await copyToClipboard(value)) { setCopied(key); setTimeout(() => setCopied(''), 1500); } };

  const transfer = async () => {
    const amount = Number(data?.stats.remaining || 0);
    if (!(amount > 0)) return;
    setTransferring(true); setMessage(null);
    try {
      const res = await apiClient.post('/referral/withdraw', { amount });
      setMessage({ ok: true, text: res.data?.message || 'Transferred to your wallet' });
      refresh();
    } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      setMessage({ ok: false, text: e?.response?.data?.message || 'Transfer failed. Please try again.' });
    } finally { setTransferring(false); }
  };

  const s = data?.stats;
  return (
    <AdminLayout>
      <div className="flex flex-col h-[calc(100vh-72px)] -m-4 md:-m-6 bg-[#F8FAFC] overflow-y-auto">
        <div className="px-4 md:px-6 pt-5 pb-8 flex flex-col gap-5 max-w-[1200px] w-full mx-auto">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-10 h-10 rounded-xl bg-[#F0FDF4] text-[#00A86B] flex items-center justify-center shrink-0"><Gift className="w-5 h-5" /></span>
              <div className="min-w-0">
                <h1 className="text-[18px] font-bold text-[#0F172A]">Invite &amp; Earn</h1>
                <p className="text-[12.5px] text-[#64748B] truncate">Refer other businesses and earn into your wallet.</p>
              </div>
            </div>
            <button onClick={refresh} aria-label="Refresh" className="w-10 h-10 rounded-full border border-[#E2E8F0] bg-white flex items-center justify-center text-[#64748B] hover:text-[#00A86B]"><RefreshCcw className="w-4 h-4" /></button>
          </div>

          {error && <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-[13px] text-red-600">{error}</div>}
          {!data && !error && <div className="relative h-60"><TableLoader /></div>}

          {data && (
            <>
              {/* How it works */}
              <div className={`${card} p-5`}>
                <h2 className="text-[14px] font-bold text-[#0F172A] mb-3">How you earn</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="rounded-xl bg-[#F8FAFC] border border-[#EEF2F6] p-3.5">
                    <div className="text-[11px] font-bold text-[#00A86B] uppercase tracking-wider">1 · Share</div>
                    <p className="text-[12.5px] text-[#475569] mt-1">Your friend signs up with your referral code or link.</p>
                  </div>
                  <div className="rounded-xl bg-[#F8FAFC] border border-[#EEF2F6] p-3.5">
                    <div className="text-[11px] font-bold text-[#00A86B] uppercase tracking-wider">2 · Joining bonus</div>
                    <p className="text-[12.5px] text-[#475569] mt-1">{bonus?.enabled && bonus.amount > 0
                      ? <>You get <b className="text-[#0F172A]">{inr(bonus.amount)}</b> when they {bonus.requireKyc ? 'complete KYC and ' : ''}make a <b className="text-[#0F172A]">first recharge of at least {inr(bonus.minFirstRecharge)}</b> within {bonus.withinDays} days of signing up.</>
                      : 'There is no joining bonus at the moment.'}</p>
                  </div>
                  <div className="rounded-xl bg-[#F8FAFC] border border-[#EEF2F6] p-3.5">
                    <div className="text-[11px] font-bold text-[#00A86B] uppercase tracking-wider">3 · Every month</div>
                    <p className="text-[12.5px] text-[#475569] mt-1">A commission on the shipping charges of their shipments that go in transit — the more they ship in the month, the higher your % (see your plan below). Added to your wallet at the end of each month.</p>
                  </div>
                </div>
              </div>

              {/* Code + link */}
              <div className={`${card} p-5 flex flex-col lg:flex-row lg:items-center gap-4`}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="w-10 h-10 rounded-xl bg-[#F0FDF4] text-[#00A86B] flex items-center justify-center shrink-0"><Link2 className="w-5 h-5" /></span>
                  <div className="min-w-0">
                    <div className="text-[14px] font-bold text-[#0F172A]">Your referral code</div>
                    <p className="text-[12px] text-[#64748B] truncate">{link || 'Your code will appear here.'}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="h-10 px-4 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] flex items-center text-[14px] font-mono font-bold text-[#0F172A]">{code || '—'}</span>
                  <button disabled={!code} onClick={() => copy('code', code)} className="h-10 px-4 rounded-full border border-[#E2E8F0] text-[12.5px] font-semibold text-[#475569] inline-flex items-center gap-1.5 hover:border-[#00A86B]/40 hover:text-[#00A86B] disabled:opacity-40">{copied === 'code' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}Code</button>
                  <button disabled={!link} onClick={() => copy('link', link)} className="h-10 px-4 rounded-full border border-[#E2E8F0] text-[12.5px] font-semibold text-[#475569] inline-flex items-center gap-1.5 hover:border-[#00A86B]/40 hover:text-[#00A86B] disabled:opacity-40">{copied === 'link' ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}Link</button>
                  <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer" className="h-10 px-4 rounded-full bg-[#00A86B] hover:bg-[#009B63] text-white text-[12.5px] font-semibold inline-flex items-center gap-1.5"><MessageCircle className="w-4 h-4" />Share</a>
                </div>
              </div>

              {/* Totals */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {[
                  { label: 'Friends referred', value: String(s?.referredFriends || 0), icon: Users, tone: 'bg-sky-50 text-sky-600' },
                  { label: `Joining bonuses (${s?.bonusCount || 0})`, value: inr(s?.bonusEarned), icon: Gift, tone: 'bg-[#F0FDF4] text-[#00A86B]' },
                  { label: 'Commission earned', value: inr(s?.totalCommission), icon: Wallet, tone: 'bg-amber-50 text-amber-600' },
                  { label: 'This month\'s rate', value: `${data.currentMonth?.percent ?? 0}%`, icon: Percent, tone: 'bg-violet-50 text-violet-600' },
                ].map(k => (
                  <div key={k.label} className={`${card} px-4 py-3.5 flex items-start justify-between gap-3`}>
                    <div className="min-w-0"><div className="text-[12px] font-medium text-[#64748B] truncate">{k.label}</div><div className="text-[20px] font-bold text-[#0F172A] tabular-nums mt-0.5">{k.value}</div></div>
                    <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${k.tone}`}><k.icon className="w-[18px] h-[18px]" /></span>
                  </div>
                ))}
              </div>

              {/* This month on the plan */}
              {data.currentMonth && data.plan && (() => {
                const cm = data.currentMonth;
                const toNext = cm.nextSlab ? Math.min(100, Math.round((cm.shipments / Math.max(1, cm.nextSlab.minShipments)) * 100)) : 100;
                return (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
                    <div className={`${card} p-5`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[12px] font-semibold text-[#64748B]">This month so far</div>
                          <div className="text-[26px] font-bold text-[#0F172A] tabular-nums leading-tight mt-1">{inr(cm.amount)}</div>
                          <div className="text-[12.5px] text-[#64748B] mt-0.5">{cm.percent}% of {inr(cm.freight)} · {cm.shipments.toLocaleString('en-IN')} in-transit shipments</div>
                        </div>
                        {cm.badge && <BadgeChip badge={cm.badge} color={cm.badgeColor} />}
                      </div>
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-[12.5px]">
                          <span className="font-medium text-[#334155]">{cm.nextSlab ? `Next: ${cm.nextSlab.percent}%${cm.nextSlab.badge ? ` (${cm.nextSlab.badge})` : ''} at ${cm.nextSlab.minShipments.toLocaleString('en-IN')} shipments` : 'Top slab reached'}</span>
                          {cm.nextSlab && <span className="text-[#64748B] tabular-nums">{cm.nextSlab.needed.toLocaleString('en-IN')} to go</span>}
                        </div>
                        <div className="mt-1.5 h-2.5 rounded-full bg-[#F1F5F9] overflow-hidden"><div className="h-full rounded-full bg-[#00A86B]" style={{ width: `${toNext}%` }} /></div>
                        <p className="text-[11.5px] text-[#94A3B8] mt-2">Credited to your wallet at the end of the month. When a higher slab is reached, its % applies to all of the month's shipments.</p>
                      </div>
                    </div>
                    <div className={`${card} overflow-hidden`}>
                      <div className="px-5 py-4 border-b border-[#F1F5F9]"><h2 className="text-[14px] font-bold text-[#0F172A]">Your commission plan · {data.plan.name}</h2></div>
                      <table className="w-full text-left text-[12.5px]">
                        <thead><tr className="bg-[#FAFBFC] text-[11.5px] font-semibold text-[#64748B]"><th className="py-2.5 px-5">Shipments / month</th><th className="py-2.5 px-5">Commission</th><th className="py-2.5 px-5">Badge</th></tr></thead>
                        <tbody className="divide-y divide-[#F1F5F9]">
                          {data.plan.slabs.map(sl => {
                            const on = sl.percent === cm.percent && (sl.badge || '') === (cm.badge || '');
                            return (
                              <tr key={sl.minShipments} className={on ? 'bg-[#F0FDF4]' : ''}>
                                <td className="py-2.5 px-5 tabular-nums font-medium text-[#0F172A]">{sl.minShipments.toLocaleString('en-IN')}{sl.maxShipments ? ` – ${sl.maxShipments.toLocaleString('en-IN')}` : ' and above'}</td>
                                <td className="py-2.5 px-5 font-semibold text-[#0F172A]">{sl.percent}%</td>
                                <td className="py-2.5 px-5">{sl.badge ? <BadgeChip badge={sl.badge} color={sl.color} /> : <span className="text-[#94A3B8]">—</span>}{on && <span className="ml-2 text-[11px] font-semibold text-[#00A86B]">You're here</span>}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}

              {/* Older balance (from before automatic crediting) */}
              {(s?.remaining || 0) > 0 && (
                <div className={`${card} p-4 flex flex-col sm:flex-row sm:items-center gap-3 border-amber-200`}>
                  <div className="flex-1 text-[12.5px] text-[#475569]"><b className="text-[#0F172A]">{inr(s?.remaining)}</b> of your earlier commission is not in your wallet yet.</div>
                  <button disabled={transferring} onClick={transfer} className="h-10 px-5 rounded-full bg-[#00A86B] hover:bg-[#009B63] text-white text-[13px] font-semibold inline-flex items-center gap-2 disabled:opacity-50"><ArrowRightLeft className="w-4 h-4" />{transferring ? 'Transferring…' : 'Transfer to wallet'}</button>
                </div>
              )}
              {message && <div className={`px-4 py-2.5 rounded-xl text-[12.5px] ${message.ok ? 'bg-[#F0FDF4] text-[#00A86B]' : 'bg-red-50 text-red-600'}`}>{message.text}</div>}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5 items-start">
                {/* Friends */}
                <div className={`${card} overflow-hidden`}>
                  <div className="px-5 py-4 border-b border-[#F1F5F9]"><h2 className="text-[14px] font-bold text-[#0F172A]">Friends you referred</h2></div>
                  {data.referredUsers.length === 0 ? <p className="px-5 py-10 text-center text-[12.5px] text-[#94A3B8]">Share your code — friends who sign up with it appear here.</p> : (
                    <ul className="divide-y divide-[#F1F5F9]">
                      {data.referredUsers.map(f => {
                        const b = BONUS[f.bonusStatus];
                        return (
                          <li key={f._id} className="px-5 py-3 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-[13px] font-semibold text-[#0F172A] truncate">{f.name}</div>
                              <div className="text-[11.5px] text-[#94A3B8]">Joined {fmt(f.joinedAt)} · KYC {f.kycDone ? 'done' : 'pending'}</div>
                            </div>
                            <span className={`inline-flex items-center gap-1 text-[12px] font-semibold whitespace-nowrap ${b.tone}`}><b.icon className="w-3.5 h-3.5" />{b.label(f)}</span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
                {/* Monthly commission */}
                <div className={`${card} overflow-hidden`}>
                  <div className="px-5 py-4 border-b border-[#F1F5F9]"><h2 className="text-[14px] font-bold text-[#0F172A]">Monthly commission</h2></div>
                  {data.monthlyData.length === 0 ? <p className="px-5 py-10 text-center text-[12.5px] text-[#94A3B8]">Your first commission is added at the end of the month your friends start shipping.</p> : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left min-w-[480px] text-[12.5px] text-[#475569]">
                        <thead><tr className="bg-[#E6F9F2] text-xs font-medium text-[#64748B] uppercase tracking-wider">{['Month', 'Shipments', 'Shipping', 'Commission', 'Wallet'].map(h => <th key={h} className="py-2.5 px-4 whitespace-nowrap">{h}</th>)}</tr></thead>
                        <tbody>
                          {data.monthlyData.map(m => (
                            <tr key={m._id} className="border-b border-[#F1F5F9] last:border-0">
                              <td className="py-3 px-4 font-semibold text-[#0F172A] whitespace-nowrap">{m.month}</td>
                              <td className="py-3 px-4 tabular-nums">{m.referralOrders}</td>
                              <td className="py-3 px-4 tabular-nums">{inr(m.shippingCharges)}</td>
                              <td className="py-3 px-4 tabular-nums font-bold text-[#0F172A]">{inr(m.commission)}{m.commissionRate != null && <span className="font-normal text-[#94A3B8]"> · {m.commissionRate}%{m.badge ? ` · ${m.badge}` : ''}</span>}</td>
                              <td className="py-3 px-4 whitespace-nowrap">{m.creditedToWallet >= m.commission - 0.01
                                ? <span className="text-emerald-700 font-semibold">Credited</span>
                                : m.creditedToWallet > 0
                                  ? <span className="text-amber-700 font-semibold">{inr(m.creditedToWallet)} credited</span>
                                  : <span className="text-[#94A3B8] font-semibold" title="From before automatic crediting — transferred by hand">Manual transfer</span>}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
