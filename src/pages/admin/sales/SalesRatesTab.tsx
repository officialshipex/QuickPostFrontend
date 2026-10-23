import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { BadgePercent, Sparkles, ChevronDown, X, AlertCircle, CheckCircle2, ArrowDownRight, ArrowUpRight, Minus, Calculator } from 'lucide-react';
import { TableLoader } from '../../../components/ui/TableLoader';
import {
  salesApiClient, apiError, inr, periodLabel, ZONE_LABEL,
  type RateOffer, type RateSuggestion, type RateRequirement, type ReferredSeller, type WeightSlab, type SlabPrice,
} from '../../../services/salesApi';

/* Rates: the commitment rates the admin lets this sales person pitch ("ship N a month, get this rate card"),
   the suggestion tool (seller's volume, COD, weight and zone mix -> which rate fits, and what it costs), and
   putting a rate on one of their sellers. The sales person can't change any rate — only choose one. Every month
   from the commitment date the seller moves to the rate their shipments earned, never above the one committed. */

const card = 'bg-white rounded-2xl border border-[#EEF2F6] shadow-[0_1px_2px_rgba(16,24,40,0.04),0_2px_8px_rgba(16,24,40,0.05)]';
const fieldCls = 'w-full h-10 px-3 rounded-xl border border-[#E2E8F0] text-[13px] text-[#0F172A] bg-white focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]';
const labelCls = 'block text-[12px] font-semibold text-[#475569] mb-1.5';
const primaryBtn = 'h-10 px-5 rounded-full bg-[#00A86B] hover:bg-[#009B63] text-white text-[13px] font-semibold disabled:opacity-50 inline-flex items-center justify-center gap-2';
const n = (v?: number) => (v ?? 0).toLocaleString('en-IN');
const fmtDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
const ZONES = ['zoneA', 'zoneB', 'zoneC', 'zoneD', 'zoneE'];

function PriceTable({ rows }: { rows?: SlabPrice[] }) {
  if (!rows?.length) return <p className="text-[12px] text-[#94A3B8]">No courier rates on this rate card yet.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[12px] min-w-[460px]">
        <thead><tr className="text-[#64748B]"><th className="text-left py-1.5 pr-2 font-semibold">Weight</th>{ZONES.map(z => <th key={z} className="text-right py-1.5 px-1.5 font-semibold">{ZONE_LABEL[z].replace('Zone ', '')}</th>)}</tr></thead>
        <tbody className="divide-y divide-[#F1F5F9]">
          {rows.map(r => (
            <tr key={r.key}><td className="py-1.5 pr-2 text-[#475569] whitespace-nowrap">{r.label}</td>{ZONES.map(z => <td key={z} className="py-1.5 px-1.5 text-right tabular-nums text-[#0F172A]">{r.zonePrices[z] == null ? '—' : `₹${r.zonePrices[z]}`}</td>)}</tr>
          ))}
        </tbody>
      </table>
      <p className="text-[11px] text-[#94A3B8] mt-1.5">Forward freight, cheapest courier on the rate card, before GST and COD.</p>
    </div>
  );
}

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} role="dialog" aria-modal="true"
        className={`relative w-full ${wide ? 'max-w-2xl' : 'max-w-md'} bg-white rounded-2xl shadow-[0_24px_64px_-16px_rgba(15,23,42,0.35)] max-h-[calc(100vh-2rem)] flex flex-col`}>
        <div className="px-5 py-4 border-b border-[#F1F5F9] flex items-center justify-between gap-3 shrink-0">
          <h3 className="text-[15px] font-bold text-[#0F172A] truncate">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-full flex items-center justify-center text-[#94A3B8] hover:bg-[#F1F5F9]"><X className="w-4 h-4" /></button>
        </div>
        <div className="overflow-y-auto">{children}</div>
      </motion.div>
    </div>,
    document.body,
  );
}

// ── Put a rate on a seller ───────────────────────────────────────────────────
export function AssignRateDialog({ sellers, offers, initialSellerId, initialOfferId, requirement, onClose, onDone }: {
  sellers: ReferredSeller[]; offers: RateOffer[]; initialSellerId?: string; initialOfferId?: string; requirement?: RateRequirement;
  onClose: () => void; onDone: (msg: string) => void;
}) {
  const [sellerId, setSellerId] = useState(initialSellerId || '');
  const [offerId, setOfferId] = useState(initialOfferId || '');
  const [autoAdjust, setAutoAdjust] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const seller = sellers.find(s => s._id === sellerId);
  const offer = offers.find(o => o._id === offerId);

  const save = async () => {
    setBusy(true); setError('');
    try {
      const res = await salesApiClient.post(`/sellers/${sellerId}/rate`, { offerId, autoAdjust, requirement });
      onDone(res.data?.message || 'Rate assigned');
      onClose();
    } catch (e) { setError(apiError(e, 'Could not assign the rate.')); } finally { setBusy(false); }
  };
  return (
    <Modal title="Assign a commitment rate" onClose={onClose}>
      <div className="p-5 space-y-4">
        {error && <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-100 text-[12.5px] text-red-600"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{error}</div>}
        <div>
          <label className={labelCls}>Seller</label>
          <select value={sellerId} onChange={e => setSellerId(e.target.value)} className={fieldCls}>
            <option value="">Choose a seller</option>
            {sellers.map(s => <option key={s._id} value={s._id}>{s.businessName || s.name}{s.rate ? ` (now: ${s.rate.current})` : ''}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Rate</label>
          <select value={offerId} onChange={e => setOfferId(e.target.value)} className={fieldCls}>
            <option value="">Choose a rate</option>
            {offers.map(o => <option key={o._id} value={o._id}>{o.name} — {n(o.minMonthlyShipments)}+ shipments / month</option>)}
          </select>
        </div>
        <label className="flex items-start gap-2.5 text-[12.5px] text-[#475569] cursor-pointer">
          <input type="checkbox" checked={autoAdjust} onChange={e => setAutoAdjust(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#00A86B]" />
          <span><b className="text-[#0F172A]">Auto upgrade / downgrade every month.</b> If the seller ships less than committed they move down to the rate their shipments earned; when they ship more they move back up, but never above this rate unless you assign a higher one.</span>
        </label>
        {seller?.rate && offer && <p className="text-[12px] text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">This replaces {seller.businessName || seller.name}'s current rate ({seller.rate.current}) and restarts the 30-day commitment from today.</p>}
      </div>
      <div className="px-5 py-3.5 border-t border-[#F1F5F9] flex justify-end gap-2.5">
        <button onClick={onClose} className="h-10 px-5 rounded-full border border-[#E2E8F0] text-[13px] font-semibold text-[#475569] hover:bg-[#F8FAFC]">Cancel</button>
        <button disabled={busy || !sellerId || !offerId} onClick={save} className={primaryBtn}>{busy ? 'Assigning…' : 'Assign rate'}</button>
      </div>
    </Modal>
  );
}

// ── One seller, read-only ────────────────────────────────────────────────────
interface SellerDetail {
  seller: { _id: string; fullname: string; company: string; email: string; phoneNumber: string; userId: number; kycDone: boolean; salesOnboardedAt?: string; createdAt: string };
  months: { period: string; shipments: number; freight: number }[];
  assignment: null | { currentOffer: RateOffer; committedOffer: RateOffer; commitmentDate: string; cycleStart: string; nextReviewAt: string; autoAdjust: boolean; history: { at: string; action: string; fromOffer?: string; toOffer?: string; shipments?: number; note?: string }[] };
  cycleShipments: number | null;
}

export function SellerDetailDialog({ sellerId, viewAsId, onClose }: { sellerId: string; viewAsId?: string; onClose: () => void }) {
  const [d, setD] = useState<SellerDetail | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    salesApiClient.get(`/sellers/${sellerId}`, { params: viewAsId ? { employeeId: viewAsId } : {} })
      .then(res => setD(res.data)).catch(e => setError(apiError(e)));
  }, [sellerId, viewAsId]);
  const max = Math.max(1, ...(d?.months || []).map(m => m.shipments));
  const a = d?.assignment;
  const icon = (action: string) => action === 'upgraded' ? <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" /> : action === 'downgraded' ? <ArrowDownRight className="w-3.5 h-3.5 text-red-500" /> : <Minus className="w-3.5 h-3.5 text-[#94A3B8]" />;
  return (
    <Modal title={d ? d.seller.company || d.seller.fullname : 'Seller'} onClose={onClose} wide>
      {error ? <p className="p-6 text-[13px] text-red-600">{error}</p> : !d ? <div className="relative h-60"><TableLoader /></div> : (
        <div className="p-5 space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[12.5px]">
            {[['Contact', d.seller.fullname], ['Phone', d.seller.phoneNumber], ['User ID', String(d.seller.userId)], ['KYC', d.seller.kycDone ? 'Verified' : 'Pending']].map(([l, v]) => (
              <div key={l} className="rounded-xl bg-[#F8FAFC] border border-[#EEF2F6] px-3 py-2"><div className="text-[11px] text-[#94A3B8]">{l}</div><div className="font-semibold text-[#0F172A] truncate">{v}</div></div>
            ))}
          </div>
          <div>
            <h4 className="text-[13px] font-bold text-[#0F172A] mb-2">Shipments, last 6 months</h4>
            <div className="space-y-1.5">
              {d.months.map(m => (
                <div key={m.period} className="grid grid-cols-[96px_1fr_120px] items-center gap-2 text-[12px]">
                  <span className="text-[#64748B]">{periodLabel(m.period)}</span>
                  <div className="h-2 rounded-full bg-[#F1F5F9] overflow-hidden"><div className="h-full rounded-full bg-[#00A86B]" style={{ width: `${(m.shipments / max) * 100}%` }} /></div>
                  <span className="text-right tabular-nums text-[#0F172A]">{n(m.shipments)} · {inr(m.freight)}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-[13px] font-bold text-[#0F172A] mb-2">Commitment rate</h4>
            {!a ? <p className="text-[12.5px] text-[#94A3B8]">No commitment rate assigned yet.</p> : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[12.5px]">
                  {[['Current', a.currentOffer?.name], ['Committed', `${a.committedOffer?.name} (${n(a.committedOffer?.minMonthlyShipments)}+/mo)`], ['This cycle', `${n(d.cycleShipments ?? 0)} shipments`], ['Next review', a.autoAdjust ? fmtDate(a.nextReviewAt) : 'Auto-adjust off']].map(([l, v]) => (
                    <div key={l} className="rounded-xl bg-[#F8FAFC] border border-[#EEF2F6] px-3 py-2"><div className="text-[11px] text-[#94A3B8]">{l}</div><div className="font-semibold text-[#0F172A]">{v}</div></div>
                  ))}
                </div>
                {a.history.length > 0 && (
                  <ul className="mt-3 divide-y divide-[#F1F5F9] text-[12px]">
                    {[...a.history].reverse().map((h, i) => (
                      <li key={i} className="py-2 flex items-center gap-2">
                        {icon(h.action)}
                        <span className="text-[#64748B] w-[92px] shrink-0">{fmtDate(h.at)}</span>
                        <span className="text-[#0F172A]">{h.action === 'assigned' ? `Assigned ${h.toOffer}` : h.action === 'unchanged' ? `Stayed on ${h.toOffer}` : `${h.fromOffer} → ${h.toOffer}`}</span>
                        {h.shipments != null && <span className="text-[#94A3B8] ml-auto">{n(h.shipments)} shipments</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

// ── The tab ──────────────────────────────────────────────────────────────────
const emptyReq = (): RateRequirement => ({ monthlyShipments: 0, codPercent: 0, avgCodValue: 0, productCategory: '', weightMix: {}, zoneMix: { zoneA: 20, zoneB: 20, zoneC: 20, zoneD: 20, zoneE: 20 } });

export function SalesRatesTab({ viewAsId, sellers, canAssign, onAssigned }: { viewAsId?: string; sellers: ReferredSeller[]; canAssign: boolean; onAssigned: (msg: string) => void }) {
  const [offers, setOffers] = useState<RateOffer[] | null>(null);
  const [slabs, setSlabs] = useState<WeightSlab[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [req, setReq] = useState<RateRequirement>(emptyReq);
  const [result, setResult] = useState<RateSuggestion | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [assign, setAssign] = useState<{ offerId?: string } | null>(null);

  useEffect(() => {
    salesApiClient.get('/rate-offers', { params: viewAsId ? { employeeId: viewAsId } : {} })
      .then(res => { setOffers(res.data?.offers || []); setSlabs(res.data?.weightSlabs || []); })
      .catch(() => setOffers([]));
  }, [viewAsId]);

  const zoneTotal = useMemo(() => ZONES.reduce((s, z) => s + (Number(req.zoneMix[z]) || 0), 0), [req.zoneMix]);
  const slabTotal = useMemo(() => Object.values(req.weightMix).reduce((s, v) => s + (Number(v) || 0), 0), [req.weightMix]);
  const setNum = (k: 'monthlyShipments' | 'codPercent' | 'avgCodValue', v: string) => setReq(r => ({ ...r, [k]: Math.max(0, Number(v) || 0) }));

  const suggest = async () => {
    setBusy(true); setError('');
    try {
      const res = await salesApiClient.post('/rate-suggest', req, { params: viewAsId ? { employeeId: viewAsId } : {} });
      setResult(res.data);
    } catch (e) { setError(apiError(e)); } finally { setBusy(false); }
  };

  if (!offers) return <div className="relative h-60"><TableLoader /></div>;
  const numInput = 'w-full h-9 px-2.5 rounded-lg border border-[#E2E8F0] text-[12.5px] text-right tabular-nums focus:outline-none focus:border-[#00A86B]';

  return (
    <div className="flex flex-col gap-5">
      {/* Offers */}
      <div className={`${card} overflow-hidden`}>
        <div className="px-5 py-4 border-b border-[#F1F5F9] flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-[14px] font-bold text-[#0F172A] flex items-center gap-2"><BadgePercent className="w-4 h-4 text-[#00A86B]" />Rates you can offer</h2>
            <p className="text-[12px] text-[#94A3B8]">Set by your admin. Pitch the rate that matches the seller's monthly shipment commitment.</p>
          </div>
          {canAssign && offers.length > 0 && <button onClick={() => setAssign({})} className={primaryBtn}>Assign to a seller</button>}
        </div>
        {offers.length === 0 ? <p className="px-5 py-10 text-center text-[12.5px] text-[#94A3B8]">No rates have been set up for you yet. Ask your admin to add commitment rates in Sales Management.</p> : (
          <ul className="divide-y divide-[#F1F5F9]">
            {offers.map(o => (
              <li key={o._id}>
                <button type="button" onClick={() => setOpen(v => (v === o._id ? null : o._id))} className="w-full px-5 py-3.5 flex items-center gap-3 text-left hover:bg-[#FAFBFC]">
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-bold text-[#0F172A]">{o.name}</div>
                    <div className="text-[12px] text-[#64748B]">Commit {n(o.minMonthlyShipments)}+ shipments / month · rate card {o.planName}{o.description ? ` · ${o.description}` : ''}</div>
                  </div>
                  <span className="text-[12.5px] font-semibold text-[#0F172A] tabular-nums whitespace-nowrap">500 g from ₹{o.preview?.find(p => p.key === '500g')?.zonePrices.zoneA ?? '—'}</span>
                  <ChevronDown className={`w-4 h-4 text-[#94A3B8] transition-transform ${open === o._id ? 'rotate-180' : ''}`} />
                </button>
                {open === o._id && <div className="px-5 pb-4"><PriceTable rows={o.preview} /></div>}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Suggestion */}
      <div className={`${card} p-5`}>
        <h2 className="text-[14px] font-bold text-[#0F172A] flex items-center gap-2"><Calculator className="w-4 h-4 text-[#00A86B]" />Which rate fits this seller?</h2>
        <p className="text-[12px] text-[#94A3B8] mb-4">Enter the seller's business — the system suggests the rate and estimates their cost per shipment.</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div><label className={labelCls}>Monthly shipments</label><input type="number" min={0} value={req.monthlyShipments || ''} onChange={e => setNum('monthlyShipments', e.target.value)} className={fieldCls} placeholder="e.g. 1800" /></div>
          <div><label className={labelCls}>COD %</label><input type="number" min={0} max={100} value={req.codPercent || ''} onChange={e => setNum('codPercent', e.target.value)} className={fieldCls} placeholder="e.g. 40" /></div>
          <div><label className={labelCls}>Average COD value (₹)</label><input type="number" min={0} value={req.avgCodValue || ''} onChange={e => setNum('avgCodValue', e.target.value)} className={fieldCls} placeholder="e.g. 800" /></div>
          <div><label className={labelCls}>Product category</label><input value={req.productCategory} onChange={e => setReq(r => ({ ...r, productCategory: e.target.value }))} className={fieldCls} placeholder="e.g. Apparel" /></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
          <div>
            <div className="flex items-center justify-between mb-2"><span className="text-[12px] font-semibold text-[#475569]">Monthly shipments by weight</span><span className="text-[11.5px] text-[#94A3B8] tabular-nums">{n(slabTotal)} total</span></div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {slabs.map(s => (
                <div key={s.key}><div className="text-[11px] text-[#64748B] mb-1 truncate" title={s.label}>{s.label}</div>
                  <input type="number" min={0} value={req.weightMix[s.key] || ''} onChange={e => setReq(r => ({ ...r, weightMix: { ...r.weightMix, [s.key]: Math.max(0, Number(e.target.value) || 0) } }))} className={numInput} placeholder="0" /></div>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2"><span className="text-[12px] font-semibold text-[#475569]">Shipments by zone (%)</span><span className={`text-[11.5px] tabular-nums font-semibold ${zoneTotal === 100 ? 'text-[#00A86B]' : 'text-amber-600'}`}>{zoneTotal}%</span></div>
            <div className="grid grid-cols-5 gap-2">
              {ZONES.map(z => (
                <div key={z}><div className="text-[11px] text-[#64748B] mb-1">{ZONE_LABEL[z]}</div>
                  <input type="number" min={0} max={100} value={req.zoneMix[z] ?? ''} onChange={e => setReq(r => ({ ...r, zoneMix: { ...r.zoneMix, [z]: Math.min(100, Math.max(0, Number(e.target.value) || 0)) } }))} className={numInput} /></div>
              ))}
            </div>
            {zoneTotal !== 100 && <p className="text-[11.5px] text-amber-600 mt-1.5">Zone shares should add up to 100%.</p>}
          </div>
        </div>
        {error && <p className="text-[12.5px] text-red-600 mt-3">{error}</p>}
        <div className="flex justify-end mt-4"><button disabled={busy || !req.monthlyShipments} onClick={suggest} className={primaryBtn}><Sparkles className="w-4 h-4" />{busy ? 'Working…' : 'Suggest rate'}</button></div>

        {result && (
          <div className="mt-5 border-t border-[#F1F5F9] pt-4 overflow-x-auto">
            <table className="w-full text-left min-w-[640px] text-[12.5px] text-[#475569]">
              <thead><tr className="text-[11.5px] font-semibold text-[#64748B]"><th className="py-2 pr-3">Rate</th><th className="py-2 px-3">Commitment</th><th className="py-2 px-3 text-right">Avg / shipment</th><th className="py-2 px-3 text-right">Est. monthly</th><th className="py-2 pl-3"></th></tr></thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {result.offers.map(r => {
                  const rec = r.offer._id === result.recommendedOfferId;
                  return (
                    <tr key={r.offer._id} className={rec ? 'bg-[#F0FDF4]' : ''}>
                      <td className="py-2.5 pr-3"><span className="font-semibold text-[#0F172A]">{r.offer.name}</span>{rec && <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#00A86B] text-white text-[10.5px] font-bold"><CheckCircle2 className="w-3 h-3" />Suggested</span>}</td>
                      <td className="py-2.5 px-3">{n(r.offer.minMonthlyShipments)}+ / mo {r.eligible ? <span className="text-[#00A86B]">· fits</span> : <span className="text-amber-600">· {n(r.shipmentsShort)} short</span>}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums font-semibold text-[#0F172A]">{r.estimate ? inr(r.estimate.avgPerShipment) : '—'}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums">{r.estimate ? inr(r.estimate.monthlyEstimate) : '—'}</td>
                      <td className="py-2.5 pl-3 text-right">{canAssign && <button onClick={() => setAssign({ offerId: r.offer._id })} className="h-8 px-3 rounded-full border border-[#E2E8F0] text-[12px] font-semibold text-[#475569] hover:border-[#00A86B]/40 hover:text-[#00A86B]">Assign</button>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="text-[11.5px] text-[#94A3B8] mt-2">Estimate = cheapest courier per weight and zone on each rate card, weighted by the mix above, plus COD charges on {req.codPercent}% of shipments. Before GST.</p>
          </div>
        )}
      </div>

      {assign && (
        <AssignRateDialog sellers={sellers} offers={offers} initialOfferId={assign.offerId} requirement={result?.requirement}
          onClose={() => setAssign(null)} onDone={onAssigned} />
      )}
    </div>
  );
}
