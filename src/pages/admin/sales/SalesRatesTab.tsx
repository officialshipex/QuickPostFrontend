import { useEffect, useState, type ChangeEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { BadgePercent, Sparkles, ChevronDown, X, AlertCircle, CheckCircle2, ArrowDownRight, ArrowUpRight, Minus, Calculator, Download, Target, Save, Send, Mail } from 'lucide-react';
import { TableLoader } from '../../../components/ui/TableLoader';
import {
  salesApiClient, apiError, inr, periodLabel, ZONE_LABEL, emptyBusiness, downloadRateQuote, sendRateQuote,
  type RateOffer, type RateSuggestion, type ReferredSeller, type SlabPrice, type BusinessDetails, type SavedBusiness, type QuoteTarget,
} from '../../../services/salesApi';

/* Rates: the commitment rates the admin lets this sales person pitch ("ship N a month, get this rate card"),
   "Fetch rate" (a prospect's Monthly Business Details -> which rate fits, what it costs, a PDF proposal to send),
   and a seller's Monthly Business Details: saving them applies the suggested rate at once and sets the monthly
   shipments target. The sales person can't change any rate — only choose one. Every month from the commitment
   date the seller moves to the rate their shipments earned, never above the one committed. A seller with custom
   rates set by the admin is never changed. */

const card = 'bg-white rounded-2xl border border-[#EEF2F6] shadow-[0_1px_2px_rgba(16,24,40,0.04),0_2px_8px_rgba(16,24,40,0.05)]';
const fieldCls = 'w-full h-10 px-3 rounded-xl border border-[#E2E8F0] text-[13px] text-[#0F172A] bg-white focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B] disabled:bg-[#F8FAFC] disabled:text-[#475569]';
const labelCls = 'block text-[12px] font-semibold text-[#475569] mb-1.5';
const primaryBtn = 'h-10 px-5 rounded-full bg-[#00A86B] hover:bg-[#009B63] text-white text-[13px] font-semibold disabled:opacity-50 inline-flex items-center justify-center gap-2';
const ghostBtn = 'h-10 px-4 rounded-full border border-[#E2E8F0] text-[13px] font-semibold text-[#475569] hover:border-[#00A86B]/40 hover:text-[#00A86B] inline-flex items-center justify-center gap-2 disabled:opacity-50';
const n = (v?: number) => (v ?? 0).toLocaleString('en-IN');
const fmtDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
const ZONES = ['zoneA', 'zoneB', 'zoneC', 'zoneD', 'zoneE'];
const ZONE_HINT: Record<string, string> = { zoneA: 'Within city', zoneB: 'Within state', zoneC: 'Metro to metro', zoneD: 'Rest of India', zoneE: 'NE / J&K / special' };

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

/** Monthly shipments target progress (this month's in-transit shipments / Total Shipments) */
export function TargetBar({ target, achieved, compact }: { target: number; achieved: number; compact?: boolean }) {
  if (!target) {
    return compact
      ? <span className="text-[12px] text-[#94A3B8]" title="Open the seller (eye icon) → Monthly Business Details → Total Shipments sets the target">Not set · add business details</span>
      : <span className="text-[12px] text-[#94A3B8]">No target yet — fill in the <b>Monthly Business Details</b> tab (Total Shipments becomes the monthly target).</span>;
  }
  const p = Math.min(100, Math.round((achieved / target) * 100));
  const tone = p >= 100 ? 'bg-[#00A86B]' : p >= 60 ? 'bg-amber-500' : 'bg-red-400';
  return (
    <div className={compact ? 'w-[150px]' : ''}>
      <div className={`${compact ? 'h-1.5' : 'h-2.5'} rounded-full bg-[#F1F5F9] overflow-hidden`} role="progressbar" aria-valuenow={p} aria-valuemin={0} aria-valuemax={100}>
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${p}%` }} />
      </div>
      <div className={`${compact ? 'text-[11px] mt-1' : 'text-[12px] mt-1.5'} text-[#64748B] tabular-nums`}>{n(achieved)} / {n(target)} shipments · {p}%</div>
    </div>
  );
}

/** The eight Monthly Business Details fields */
function BusinessForm({ value, onChange, readOnly }: { value: BusinessDetails; onChange: (v: BusinessDetails) => void; readOnly?: boolean }) {
  const num = (k: keyof BusinessDetails, max?: number) => (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const v = raw === '' ? 0 : Math.max(0, Number(raw) || 0);
    onChange({ ...value, [k]: max != null ? Math.min(max, v) : v });
  };
  const show = (v: number) => (v ? v : '');
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <div><label className={labelCls}>Total Shipments / month *</label><input type="number" min={0} disabled={readOnly} value={show(value.totalShipments)} onChange={num('totalShipments')} className={fieldCls} placeholder="e.g. 1800" /></div>
      <div><label className={labelCls}>Monthly Shipping Bill (₹)</label><input type="number" min={0} disabled={readOnly} value={show(value.monthlyShippingBill)} onChange={num('monthlyShippingBill')} className={fieldCls} placeholder="What they pay today" /></div>
      <div><label className={labelCls}>Product Category</label><input disabled={readOnly} value={value.productCategory} maxLength={100} onChange={e => onChange({ ...value, productCategory: e.target.value })} className={fieldCls} placeholder="e.g. Fashion" /></div>
      <div><label className={labelCls}>Product Value (₹, avg)</label><input type="number" min={0} disabled={readOnly} value={show(value.productValue)} onChange={num('productValue')} className={fieldCls} placeholder="e.g. 800" /></div>
      <div><label className={labelCls}>Average Weight (kg)</label><input type="number" min={0} step="0.1" disabled={readOnly} value={show(value.averageWeight)} onChange={num('averageWeight', 100)} className={fieldCls} placeholder="e.g. 0.5" /></div>
      <div><label className={labelCls}>RTO %</label><input type="number" min={0} max={100} disabled={readOnly} value={show(value.rtoPercent)} onChange={num('rtoPercent', 100)} className={fieldCls} placeholder="e.g. 10" /></div>
      <div><label className={labelCls}>COD %</label><input type="number" min={0} max={100} disabled={readOnly} value={show(value.codPercent)} onChange={num('codPercent', 100)} className={fieldCls} placeholder="e.g. 40" /></div>
      <div><label className={labelCls}>Top Performing Zone</label>
        <select disabled={readOnly} value={value.topZone} onChange={e => onChange({ ...value, topZone: e.target.value })} className={fieldCls}>
          <option value="">All zones</option>
          {ZONES.map(z => <option key={z} value={z}>{ZONE_LABEL[z]} — {ZONE_HINT[z]}</option>)}
        </select>
      </div>
    </div>
  );
}

/** A step that has to be done first (by the admin or the sales person), shown where data is missing */
export function StepNote({ children, tone = 'warn' }: { children: ReactNode; tone?: 'warn' | 'info' }) {
  const cls = tone === 'warn' ? 'bg-amber-50 border-amber-100 text-amber-800' : 'bg-[#F0F9FF] border-[#E0F2FE] text-[#075985]';
  return (
    <div className={`flex items-start gap-2 px-4 py-3 rounded-xl border text-[12.5px] ${cls}`}>
      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

/** Nothing to price at all: no commitment rate for this sales person and no main rate card */
function NoOffersNote({ result }: { result?: RateSuggestion }) {
  return (
    <StepNote>
      Nothing can be priced yet. {result?.plansEmptyReason || 'The admin needs to create a rate card with courier rates in Rate Cards.'}{' '}
      {result?.offersEmptyReason || ''}
    </StepNote>
  );
}

type Est = RateSuggestion['offers'][number]['estimate'];
/** The four price cells, or the reason the row can't be priced across them */
function EstimateCells({ e, problem }: { e: Est; problem?: string | null }) {
  if (!e) {
    return <td colSpan={4} className="py-2.5 px-3 text-[12px] text-amber-700"><span className="inline-flex items-start gap-1.5"><AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />{problem || 'This rate card could not be priced. Please ask your admin to check its courier rates.'}</span></td>;
  }
  return (
    <>
      <td className="py-2.5 px-3 text-right tabular-nums">{inr(e.freightPerShipment)}{e.note && <span title={e.note} className="ml-1 text-amber-600 cursor-help">*</span>}</td>
      <td className="py-2.5 px-3 text-right tabular-nums font-semibold text-[#0F172A]">{inr(e.avgPerShipment)}</td>
      <td className="py-2.5 px-3 text-right tabular-nums">{inr(e.monthlyEstimate)}</td>
      <td className={`py-2.5 px-3 text-right tabular-nums font-semibold ${e.savings == null ? 'text-[#94A3B8]' : e.savings >= 0 ? 'text-[#00A86B]' : 'text-red-500'}`}>{e.savings == null ? '—' : `${e.savings < 0 ? '−' : ''}${inr(Math.abs(e.savings))}`}</td>
    </>
  );
}
const tableHead = (first: string, second: string, hasAction: boolean) => (
  <thead><tr className="text-[11.5px] font-semibold text-[#64748B]"><th className="py-2 pr-3">{first}</th><th className="py-2 px-3">{second}</th><th className="py-2 px-3 text-right">Freight</th><th className="py-2 px-3 text-right">Avg / shipment</th><th className="py-2 px-3 text-right">Est. monthly</th><th className="py-2 px-3 text-right">Saving</th>{hasAction && <th className="py-2 pl-3"></th>}</tr></thead>
);

/** Rates priced for the business: the commitment rates (suggested one highlighted), then the main rate cards */
function SuggestionTable({ result, offerAction, planAction }: { result: RateSuggestion; offerAction?: (offerId: string) => ReactNode; planAction?: (planName: string) => ReactNode }) {
  const plans = result.plans || [];
  if (!result.offers.length && !plans.length) return <NoOffersNote result={result} />;
  const anyPriced = [...result.offers, ...plans].some(r => r.estimate);
  const notes = [...result.offers.map(r => r.estimate?.note), ...plans.map(p => p.estimate?.note)].filter(Boolean);
  return (
    <div className="space-y-5">
      {!anyPriced && <StepNote>None of the rates could be priced for these details — see the reason on each row. The admin needs to fix those rate cards first.</StepNote>}
      {result.offers.length === 0 && result.offersEmptyReason && <StepNote tone="info">{result.offersEmptyReason} You can still pitch the rate cards below.</StepNote>}
      {result.offers.length > 0 && (
        <div className="overflow-x-auto">
          <h3 className="text-[12.5px] font-bold text-[#0F172A] mb-1">Commitment rates</h3>
          <table className="w-full text-left min-w-[720px] text-[12.5px] text-[#475569]">
            {tableHead('Rate', 'Commitment', !!offerAction)}
            <tbody className="divide-y divide-[#F1F5F9]">
              {result.offers.map(r => {
                const rec = r.offer._id === result.recommendedOfferId;
                return (
                  <tr key={r.offer._id} className={rec ? 'bg-[#F0FDF4]' : ''}>
                    <td className="py-2.5 pr-3"><span className="font-semibold text-[#0F172A]">{r.offer.name}</span>{rec && <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#00A86B] text-white text-[10.5px] font-bold"><CheckCircle2 className="w-3 h-3" />Suggested</span>}</td>
                    <td className="py-2.5 px-3 whitespace-nowrap">{n(r.offer.minMonthlyShipments)}+ / mo {r.eligible ? <span className="text-[#00A86B]">· fits</span> : <span className="text-amber-600">· {n(r.shipmentsShort)} short</span>}</td>
                    <EstimateCells e={r.estimate} problem={r.problem} />
                    {offerAction && <td className="py-2.5 pl-3 text-right whitespace-nowrap">{r.estimate ? offerAction(r.offer._id) : null}</td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {plans.length > 0 && (
        <div className="overflow-x-auto">
          <h3 className="text-[12.5px] font-bold text-[#0F172A] mb-1">Rate cards</h3>
          <table className="w-full text-left min-w-[720px] text-[12.5px] text-[#475569]">
            {tableHead('Rate card', 'Condition', !!planAction)}
            <tbody className="divide-y divide-[#F1F5F9]">
              {plans.map(p => (
                <tr key={p.planName}>
                  <td className="py-2.5 pr-3 font-semibold text-[#0F172A]">{p.planName}</td>
                  <td className="py-2.5 px-3 whitespace-nowrap">{p.minRecharge != null ? `Recharge ${inr(p.minRecharge)}` : 'No commitment'}</td>
                  <EstimateCells e={p.estimate} problem={p.problem} />
                  {planAction && <td className="py-2.5 pl-3 text-right whitespace-nowrap">{p.estimate ? planAction(p.planName) : null}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {result.offers.length > 0 && plans.length === 0 && result.plansEmptyReason && <StepNote tone="info">{result.plansEmptyReason}</StepNote>}
      {notes.length > 0 && <p className="text-[11.5px] text-amber-700">* {notes[0]}</p>}
      <p className="text-[11.5px] text-[#94A3B8]">Estimate = cheapest courier at the average weight in the top zone (or the average of all zones), plus COD charges on COD orders and RTO at the forward rate. Before GST.</p>
    </div>
  );
}

// ── Email the proposal to a prospect ─────────────────────────────────────────
const EMAIL_RE = /^[^\s@,;<>"'()[\]\\]+@[^\s@,;<>"'()[\]\\]+\.[a-z]{2,}$/i;
function SendRateDialog({ business, prospectName, offerId, planName, offerName, onClose, onSent }: {
  business: BusinessDetails; prospectName: string; offerId?: string; planName?: string; offerName?: string;
  onClose: () => void; onSent: (msg: string) => void;
}) {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const valid = EMAIL_RE.test(email.trim());
  const send = async () => {
    if (!valid || busy) return;
    setBusy(true); setError('');
    try {
      const res = await sendRateQuote({ ...business, prospectName: prospectName.trim(), offerId, planName, email: email.trim() });
      onSent(res.message || 'Rate proposal sent');
      onClose();
    } catch (e) { setError(apiError(e, 'The email could not be sent. Please try again.')); } finally { setBusy(false); }
  };
  return (
    <Modal title="Send rate" onClose={onClose}>
      <div className="p-5 space-y-4">
        <p className="text-[12.5px] text-[#64748B]">
          The rate proposal PDF{offerName ? <> for <b className="text-[#0F172A]">{offerName}</b></> : ' for the suggested rate'}{prospectName.trim() ? <> ({prospectName.trim()})</> : ''} is emailed with the plan, the estimate and the full price table. Replies come to your email.
        </p>
        {error && <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-100 text-[12.5px] text-red-600"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{error}</div>}
        <div>
          <label className={labelCls}>Prospect's email ID</label>
          <input type="email" autoFocus value={email} maxLength={254} onChange={e => setEmail(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') send(); }}
            className={fieldCls} placeholder="name@business.com" />
          {email.trim() && !valid && <p className="text-[11.5px] text-amber-600 mt-1">Enter one valid email address.</p>}
        </div>
      </div>
      <div className="px-5 py-3.5 border-t border-[#F1F5F9] flex justify-end gap-2.5">
        <button onClick={onClose} className="h-10 px-5 rounded-full border border-[#E2E8F0] text-[13px] font-semibold text-[#475569] hover:bg-[#F8FAFC]">Cancel</button>
        <button disabled={busy || !valid} onClick={send} className={primaryBtn}><Send className="w-4 h-4" />{busy ? 'Sending…' : 'Send'}</button>
      </div>
    </Modal>
  );
}

// ── Put a rate on a seller ───────────────────────────────────────────────────
export function AssignRateDialog({ sellers, offers, initialSellerId, initialOfferId, onClose, onDone }: {
  sellers: ReferredSeller[]; offers: RateOffer[]; initialSellerId?: string; initialOfferId?: string;
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
      const res = await salesApiClient.post(`/sellers/${sellerId}/rate`, { offerId, autoAdjust });
      onDone(res.data?.message || 'Rate assigned');
      onClose();
    } catch (e) { setError(apiError(e, 'Could not assign the rate.')); } finally { setBusy(false); }
  };
  return (
    <Modal title="Assign a commitment rate" onClose={onClose}>
      <div className="p-5 space-y-4">
        {error && <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-100 text-[12.5px] text-red-600"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{error}</div>}
        {sellers.length === 0 && <StepNote tone="info">You have no sellers yet. Sellers who register with your referral code (or the admin links to you) appear here; then you can assign them a rate.</StepNote>}
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

// ── One seller: overview (read-only) + Monthly Business Details ──────────────
interface SellerDetail {
  seller: { _id: string; fullname: string; company: string; email: string; phoneNumber: string; userId: number; kycDone: boolean; salesOnboardedAt?: string; createdAt: string };
  months: { period: string; shipments: number; freight: number }[];
  assignment: null | { currentOffer: RateOffer; committedOffer: RateOffer; commitmentDate: string; cycleStart: string; nextReviewAt: string; autoAdjust: boolean; history: { at: string; action: string; fromOffer?: string; toOffer?: string; shipments?: number; note?: string }[] };
  cycleShipments: number | null;
  business: SavedBusiness | null;
  monthTarget: { period: string; target: number; achieved: number };
}

const pickBusiness = (b?: SavedBusiness | null): BusinessDetails => (b
  ? { totalShipments: b.totalShipments || 0, monthlyShippingBill: b.monthlyShippingBill || 0, productCategory: b.productCategory || '', productValue: b.productValue || 0, averageWeight: b.averageWeight || 0.5, rtoPercent: b.rtoPercent || 0, codPercent: b.codPercent || 0, topZone: b.topZone || '' }
  : emptyBusiness());

export function SellerDetailDialog({ sellerId, viewAsId, canEdit, onClose, onSaved }: { sellerId: string; viewAsId?: string; canEdit?: boolean; onClose: () => void; onSaved?: (msg: string, ok: boolean) => void }) {
  const [d, setD] = useState<SellerDetail | null>(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'overview' | 'business'>('overview');
  const [form, setForm] = useState<BusinessDetails>(emptyBusiness);
  const [suggestion, setSuggestion] = useState<RateSuggestion | null>(null);
  const [suggestError, setSuggestError] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const params = viewAsId ? { employeeId: viewAsId } : {};

  const load = () => salesApiClient.get(`/sellers/${sellerId}`, { params })
    .then(res => { setD(res.data); setForm(pickBusiness(res.data?.business)); })
    .catch(e => setError(apiError(e)));
  useEffect(() => { load(); }, [sellerId, viewAsId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Suggested rate updates as the details are typed (the backend is the only place that prices it)
  useEffect(() => {
    if (tab !== 'business' || !form.totalShipments) return;
    const t = setTimeout(() => {
      salesApiClient.post('/rate-suggest', form, { params })
        .then(res => { setSuggestion(res.data); setSuggestError(''); })
        .catch(e => { setSuggestion(null); setSuggestError(apiError(e, 'The suggested rate could not be loaded. You can still save the details.')); });
    }, 400);
    return () => clearTimeout(t);
  }, [form, tab]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async () => {
    setBusy(true); setFormError('');
    try {
      const res = await salesApiClient.put(`/sellers/${sellerId}/business`, form);
      onSaved?.(res.data?.message || 'Details saved', res.data?.applied !== false);
      await load();
      setTab('overview');
    } catch (e) { setFormError(apiError(e, 'Could not save the details.')); } finally { setBusy(false); }
  };

  const max = Math.max(1, ...(d?.months || []).map(m => m.shipments));
  const a = d?.assignment;
  const icon = (action: string) => action === 'upgraded' ? <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" /> : action === 'downgraded' ? <ArrowDownRight className="w-3.5 h-3.5 text-red-500" /> : <Minus className="w-3.5 h-3.5 text-[#94A3B8]" />;
  // only while Total Shipments is filled in (a stale suggestion from earlier input is not shown)
  const suggested = form.totalShipments ? suggestion?.offers.find(o => o.offer._id === suggestion.recommendedOfferId) : undefined;
  const tabBtn = (k: typeof tab, label: string) => (
    <button key={k} onClick={() => setTab(k)} className={`h-8 px-3.5 rounded-full text-[12.5px] font-semibold ${tab === k ? 'bg-[#F0FDF4] text-[#00A86B]' : 'text-[#64748B] hover:bg-[#F8FAFC]'}`}>{label}</button>
  );

  return (
    <Modal title={d ? d.seller.company || d.seller.fullname : 'Seller'} onClose={onClose} wide>
      {error ? <p className="p-6 text-[13px] text-red-600">{error}</p> : !d ? <div className="relative h-60"><TableLoader /></div> : (
        <>
          <div className="px-5 pt-3 flex gap-1">{tabBtn('overview', 'Overview')}{tabBtn('business', 'Monthly Business Details')}</div>
          {tab === 'overview' ? (
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[12.5px]">
                {[['Contact', d.seller.fullname], ['Phone', d.seller.phoneNumber], ['User ID', String(d.seller.userId)], ['KYC', d.seller.kycDone ? 'Verified' : 'Pending']].map(([l, v]) => (
                  <div key={l} className="rounded-xl bg-[#F8FAFC] border border-[#EEF2F6] px-3 py-2"><div className="text-[11px] text-[#94A3B8]">{l}</div><div className="font-semibold text-[#0F172A] truncate">{v}</div></div>
                ))}
              </div>
              <div className="rounded-xl border border-[#EEF2F6] p-4">
                <h4 className="text-[13px] font-bold text-[#0F172A] mb-2 flex items-center gap-2"><Target className="w-4 h-4 text-[#00A86B]" />Shipments target · {periodLabel(d.monthTarget.period)}</h4>
                <TargetBar target={d.monthTarget.target} achieved={d.monthTarget.achieved} />
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
                {!a ? <p className="text-[12.5px] text-[#94A3B8]">No commitment rate assigned yet. Fill in the <b>Monthly Business Details</b> tab (the suggested rate is applied when saved), or use <b>Set rate</b> in the sellers list.</p> : (
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
                            <span className="text-[#0F172A]">{h.action === 'assigned' ? `Assigned ${h.toOffer}` : h.action === 'unchanged' ? (h.note || `Stayed on ${h.toOffer}`) : `${h.fromOffer} → ${h.toOffer}`}</span>
                            {h.shipments != null && <span className="text-[#94A3B8] ml-auto">{n(h.shipments)} shipments</span>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="p-5 space-y-4">
              <p className="text-[12px] text-[#64748B]">Saving applies the suggested rate at once (by Total Shipments) with monthly auto upgrade / downgrade, and Total Shipments becomes this seller's monthly target. Sellers with custom rates set by the admin keep their rates.</p>
              {!canEdit && <StepNote tone="info">You are viewing this sales person's seller. Only the sales person can fill in and save these details.</StepNote>}
              {!canEdit && !d.business && <StepNote tone="info">Monthly Business Details have not been filled in yet, so this seller has no monthly target.</StepNote>}
              {d.business?.applyNote && <StepNote>Last save: the rate was not applied — {d.business.applyNote}</StepNote>}
              <BusinessForm value={form} onChange={setForm} readOnly={!canEdit} />
              {canEdit && !form.totalShipments && <p className="text-[11.5px] text-[#94A3B8]">Enter Total Shipments / month to see the suggested rate.</p>}
              {suggested && suggested.estimate && (
                <div className="rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] px-4 py-3 text-[12.5px] text-[#14532D]">
                  <div className="font-bold flex items-center gap-1.5"><Sparkles className="w-4 h-4" />Suggested rate: {suggested.offer.name}</div>
                  <div className="mt-0.5">Commit {n(suggested.offer.minMonthlyShipments)}+ shipments / month · about {inr(suggested.estimate.avgPerShipment)} per shipment · {inr(suggested.estimate.monthlyEstimate)} / month{suggested.estimate.savings != null ? ` · ${suggested.estimate.savings >= 0 ? 'saves' : 'costs'} ${inr(Math.abs(suggested.estimate.savings))} vs today` : ''}</div>
                </div>
              )}
              {/* why nothing is suggested, or why the suggested rate can't be priced: what has to happen first */}
              {canEdit && form.totalShipments > 0 && suggestError && <StepNote>{suggestError}</StepNote>}
              {canEdit && form.totalShipments > 0 && suggestion && !suggested && (
                <StepNote>{suggestion.offersEmptyReason || 'No commitment rate can be suggested.'} Saving now stores the details and the monthly target, but no rate is applied.</StepNote>
              )}
              {canEdit && suggested && !suggested.estimate && (
                <StepNote>Suggested rate {suggested.offer.name}: {suggested.problem || 'its rate card could not be priced.'} Ask your admin to fix that rate card first; the message after saving tells you whether the rate was applied.</StepNote>
              )}
              {formError && <StepNote>{formError}</StepNote>}
              {canEdit && (
                <div className="flex justify-end">
                  <button disabled={busy || !form.totalShipments} onClick={save} className={primaryBtn}><Save className="w-4 h-4" />{busy ? 'Saving…' : suggested ? 'Save & apply rate' : 'Save details'}</button>
                </div>
              )}
              {d.business?.updatedAt && <p className="text-[11.5px] text-[#94A3B8] text-right">Last saved {fmtDate(d.business.updatedAt)}{d.business.appliedOffer ? ` · rate applied: ${d.business.appliedOffer.name}` : ''}</p>}
            </div>
          )}
        </>
      )}
    </Modal>
  );
}

// ── The tab ──────────────────────────────────────────────────────────────────
export function SalesRatesTab({ viewAsId, sellers, canAssign, onAssigned }: { viewAsId?: string; sellers: ReferredSeller[]; canAssign: boolean; onAssigned: (msg: string) => void }) {
  const [offers, setOffers] = useState<RateOffer[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [biz, setBiz] = useState<BusinessDetails>(emptyBusiness);
  const [prospect, setProspect] = useState('');
  const [result, setResult] = useState<RateSuggestion | null>(null);
  const [busy, setBusy] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [assign, setAssign] = useState<{ offerId?: string } | null>(null);
  const [sending, setSending] = useState<(QuoteTarget & { offerName?: string }) | null>(null);
  const params = viewAsId ? { employeeId: viewAsId } : {};

  const [offersError, setOffersError] = useState('');
  useEffect(() => {
    salesApiClient.get('/rate-offers', { params })
      .then(res => { setOffers(res.data?.offers || []); setOffersError(''); })
      // a failed load is not "no rates": say so, and Fetch rate (rate cards) still works
      .catch(e => { setOffers([]); setOffersError(apiError(e, 'Your commitment rates could not be loaded. Please refresh the page.')); });
  }, [viewAsId]); // eslint-disable-line react-hooks/exhaustive-deps

  const [fetchedFor, setFetchedFor] = useState('');
  const fetchRate = async () => {
    setBusy(true); setError('');
    try {
      const res = await salesApiClient.post('/rate-suggest', biz, { params });
      setResult(res.data);
      setFetchedFor(JSON.stringify(biz));
    } catch (e) { setError(apiError(e, 'Rates could not be fetched. Please try again.')); } finally { setBusy(false); }
  };
  // details changed after fetching: the table and a proposal would no longer match what is typed
  const stale = !!result && fetchedFor !== JSON.stringify(biz);
  const download = async (target: QuoteTarget = {}) => {
    setDownloading(target.offerId || (target.planName ? `plan:${target.planName}` : 'suggested')); setError('');
    try { await downloadRateQuote({ ...biz, prospectName: prospect.trim(), ...target }, viewAsId); }
    catch (e) { setError((e as Error).message); } finally { setDownloading(null); }
  };
  const iconBtn = 'w-8 h-8 rounded-full border border-[#E2E8F0] inline-flex items-center justify-center text-[#475569] hover:border-[#00A86B]/40 hover:text-[#00A86B] disabled:opacity-50';
  const rowActions = (target: QuoteTarget, name?: string) => (
    <>
      <button disabled={!!downloading} onClick={() => download(target)} title="Download this rate as a proposal" aria-label="Download proposal" className={iconBtn}><Download className="w-3.5 h-3.5" /></button>
      {canAssign && <button onClick={() => setSending({ ...target, offerName: name })} title="Send this rate by email" aria-label="Send rate by email" className={`ml-1.5 ${iconBtn}`}><Mail className="w-3.5 h-3.5" /></button>}
    </>
  );
  // the top Download / Send are for the suggested commitment rate, and only when it could be priced
  const hasSuggested = !!result?.recommendedOfferId && !!result.offers.find(o => o.offer._id === result.recommendedOfferId)?.estimate;

  if (!offers) return <div className="relative h-60"><TableLoader /></div>;

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
        {offersError ? <div className="p-5"><StepNote>{offersError}</StepNote></div> : offers.length === 0 ? (
          <div className="p-5"><StepNote tone="info">No commitment rates are open to you yet. The admin adds them in <b>Sales Management → Rates</b> (open to all sales people, or to you). Until then you can still price and send the main rate cards with <b>Fetch rate</b> below.</StepNote></div>
        ) : (
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

      {/* Fetch rate */}
      <div className={`${card} p-5`}>
        <h2 className="text-[14px] font-bold text-[#0F172A] flex items-center gap-2"><Calculator className="w-4 h-4 text-[#00A86B]" />Fetch rate</h2>
        <p className="text-[12px] text-[#94A3B8] mb-4">Enter a prospect's monthly business — see what each commitment rate and each rate card costs them, then download or email a proposal.</p>
        <div className="mb-3 max-w-sm"><label className={labelCls}>Prospect / business name</label><input value={prospect} maxLength={120} onChange={e => setProspect(e.target.value)} className={fieldCls} placeholder="Shown on the proposal" /></div>
        <BusinessForm value={biz} onChange={setBiz} />
        {error && <p className="text-[12.5px] text-red-600 mt-3">{error}</p>}
        <div className="flex flex-wrap justify-end gap-2 mt-4">
          {/* the top buttons are for the suggested commitment rate; every row (commitment or rate card) has its own */}
          {result && !stale && hasSuggested && <button disabled={!!downloading || !biz.totalShipments} onClick={() => download()} className={ghostBtn}><Download className="w-4 h-4" />{downloading === 'suggested' ? 'Preparing…' : 'Download proposal'}</button>}
          {result && !stale && hasSuggested && canAssign && <button disabled={!biz.totalShipments} onClick={() => setSending({ offerName: result.offers.find(o => o.offer._id === result.recommendedOfferId)?.offer.name })} className={ghostBtn}><Send className="w-4 h-4" />Send rate</button>}
          <button disabled={busy || !biz.totalShipments} onClick={fetchRate} className={primaryBtn}><Sparkles className="w-4 h-4" />{busy ? 'Working…' : 'Fetch rate'}</button>
        </div>
        {!biz.totalShipments && <p className="text-[11.5px] text-[#94A3B8] text-right mt-1.5">Enter Total Shipments / month to fetch rates.</p>}
        {result && !canAssign && <p className="text-[11.5px] text-[#94A3B8] text-right mt-1.5">You are viewing this sales person's panel: proposals can be downloaded; only the sales person can email them or assign rates.</p>}

        {result && stale && <div className="mt-4"><StepNote tone="info">You changed the details. Click <b>Fetch rate</b> again to update the prices before downloading or sending.</StepNote></div>}
        {result && !stale && (
          <div className="mt-5 border-t border-[#F1F5F9] pt-4">
            <SuggestionTable
              result={result}
              offerAction={offerId => (
                <>
                  {rowActions({ offerId }, result.offers.find(o => o.offer._id === offerId)?.offer.name)}
                  {canAssign && <button onClick={() => setAssign({ offerId })} className="ml-1.5 h-8 px-3 rounded-full border border-[#E2E8F0] text-[12px] font-semibold text-[#475569] hover:border-[#00A86B]/40 hover:text-[#00A86B]">Assign</button>}
                </>
              )}
              planAction={planName => rowActions({ planName }, planName)}
            />
          </div>
        )}
      </div>

      {assign && (
        <AssignRateDialog sellers={sellers} offers={offers} initialOfferId={assign.offerId}
          onClose={() => setAssign(null)} onDone={onAssigned} />
      )}
      {sending && (
        <SendRateDialog business={biz} prospectName={prospect} offerId={sending.offerId} planName={sending.planName} offerName={sending.offerName}
          onClose={() => setSending(null)} onSent={onAssigned} />
      )}
    </div>
  );
}
