import { useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { Calculator, ChevronDown, Download, Printer, RotateCcw, Info, ArrowUpDown, AlertCircle, MessageCircle } from 'lucide-react';
import { AdminLayout } from '../../../components/admin/layout/AdminLayout';
import { SalesKycGate } from '../sales/SalesKycGate';
import { useAdminTab } from '../../../context/AdminUserContext';
import rawData from './data/rate_cards.json';
import { RATE_COMPARISON_CONFIG as CFG } from './config';
import {
  compare, comparableProviders, selectablePlans, defaultQuickPostPlan, NoServiceError,
  type RateData, type CompareResult, type Profile,
} from './engine';

/* Sales panel → Rate Comparison. A sales person enters a prospect's shipping details; estimates monthly
   shipping cost with the prospect's current provider vs
   QuickPost from published rate cards, plus a business score. Inputs can be typed as shipment counts or as
   percentages. If the seller does not share their provider, the closest published rate card is inferred from
   what they pay. All pricing comes from rate_cards.json and config.ts; the maths lives in engine.ts. */

const DATA = rawData as unknown as RateData;
const ZONES = ['Zone A', 'Zone B', 'Zone C', 'Zone D', 'Zone E'];
const ZONE_HINT = ['Within city', 'Within state', 'Metro to metro', 'Rest of India', 'NE, J&K, islands'];
const PAN_INDIA = CFG.ZONE_PRESETS[CFG.DEFAULT_ZONE_PRESET].mix;

const inr = (v: number) => `₹${Math.round(v).toLocaleString('en-IN')}`;
const inr2 = (v: number) => `₹${v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pct = (v: number) => `${(Math.round(v * 10) / 10).toLocaleString('en-IN')}%`;
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const num = (s: string) => (s.trim() === '' ? NaN : Number(s));

type Mode = 'number' | 'percent';
interface Form {
  mode: Mode;
  shipments: string; shippingCost: string; aov: string; weight: string;
  zoneMode: 'pan' | 'zone'; zones: string[];
  cod: string; rto: string;
  provider: string; providerPlan: string; qpPlan: string;
  useWeightMix: boolean; weightMix: string[];
  dims: string[]; courier: string; remittance: string; dispute: string;
}

const emptyForm = (qpPlan: string): Form => ({
  mode: 'number',
  shipments: '', shippingCost: '', aov: '', weight: '0.5',
  zoneMode: 'pan', zones: ['', '', '', '', ''],
  cod: '', rto: '', provider: '', providerPlan: '', qpPlan,
  useWeightMix: false, weightMix: ['', '', '', '', ''], dims: ['', '', ''], courier: '', remittance: '', dispute: '',
});

const inputCls = (err?: string) =>
  `w-full h-10 pl-3.5 pr-11 rounded-lg border bg-white text-[13px] text-[#0F172A] tabular-nums placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B] ${err ? 'border-red-400' : 'border-[#E2E8F0]'}`;
const selectCls = 'w-full h-10 px-3 rounded-lg border border-[#E2E8F0] bg-white text-[13px] text-[#0F172A] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]';
const card = 'bg-white rounded-2xl border border-[#E2E8F0]';

function Field({ id, label, help, error, suffix, children }: { id: string; label: string; help?: string; error?: string; suffix?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="block text-[12px] font-semibold text-[#334155] mb-1.5">{label}</label>
      <div className="relative">
        {children}
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-[#94A3B8] pointer-events-none">{suffix}</span>}
      </div>
      {error ? <p className="mt-1 text-[11.5px] text-red-500">{error}</p> : help ? <p className="mt-1 text-[11.5px] text-[#94A3B8]">{help}</p> : null}
    </div>
  );
}

function Segmented<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { key: T; label: string }[]; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex p-1 rounded-full bg-[#F1F5F9] border border-[#E2E8F0]">
      {options.map(o => (
        <button key={o.key} type="button" role="radio" aria-checked={value === o.key} onClick={() => onChange(o.key)}
          className={`h-8 px-4 rounded-full text-[12.5px] font-semibold transition-colors ${value === o.key ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]'}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Credit-score style gauge: a half dial split into the score bands, with a needle on the score. */
function ScoreGauge({ score, bandLabel, bandColor }: { score: number; bandLabel: string; bandColor: string }) {
  const reduced = useReducedMotion() ?? false;
  const [shown, setShown] = useState(reduced ? score : 0);
  useEffect(() => { const t = window.setTimeout(() => setShown(score), 30); return () => window.clearTimeout(t); }, [score]);

  const CX = 130, CY = 130, R = 104;
  const pt = (v: number, r = R) => {
    const a = Math.PI * (1 - v / 100);
    return `${(CX + r * Math.cos(a)).toFixed(2)} ${(CY - r * Math.sin(a)).toFixed(2)}`;
  };
  // bands are listed high → low in config; draw low → high
  const bands = [...CFG.SCORE.bands].reverse().map((b, i, arr) => ({ ...b, from: b.min, to: i < arr.length - 1 ? arr[i + 1].min : 100 }));
  const GAP = 0.9;

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 260 160" className="w-full max-w-[300px]" aria-hidden>
        {bands.map(b => (
          <path key={b.label} d={`M ${pt(b.from + GAP)} A ${R} ${R} 0 0 1 ${pt(b.to - GAP)}`} fill="none" stroke={b.color} strokeWidth="16" strokeLinecap="butt" />
        ))}
        {[0, ...bands.slice(1).map(b => b.from), 100].map(v => (
          <text key={v} x={pt(v, R + 18).split(' ')[0]} y={pt(v, R + 18).split(' ')[1]} textAnchor="middle" dominantBaseline="middle" fontSize="10" fill="#94A3B8">{v}</text>
        ))}
        <g style={{ transform: `rotate(${shown * 1.8 - 90}deg)`, transformOrigin: `${CX}px ${CY}px`, transformBox: 'view-box', transition: reduced ? 'none' : 'transform 600ms cubic-bezier(0.16, 1, 0.3, 1)' }}>
          <path d={`M ${CX - 5} ${CY} L ${CX} ${CY - R + 22} L ${CX + 5} ${CY} Z`} fill="#0F172A" />
        </g>
        <circle cx={CX} cy={CY} r="9" fill="#0F172A" />
        <circle cx={CX} cy={CY} r="3.5" fill="#FFFFFF" />
      </svg>
      <div className="-mt-1 text-center">
        <div className="text-[40px] leading-none font-bold text-[#0F172A] tabular-nums">{score}</div>
        <div className="mt-1 text-[11px] text-[#94A3B8]">out of 100</div>
        <div className="mt-2 inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-[12.5px] font-semibold" style={{ color: bandColor, backgroundColor: `${bandColor}1A` }}>
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: bandColor }} />{bandLabel}
        </div>
      </div>
    </div>
  );
}

export function RateComparison() {
  const { currentUserId } = useAdminTab();
  const storageKey = `${CFG.STORAGE_KEY}_${currentUserId || 'me'}`;

  const providers = useMemo(() => comparableProviders(DATA), []);
  const qpPlans = useMemo(() => selectablePlans(DATA, 'quickpost'), []);
  const couriers = useMemo(() => [...new Set(DATA.sources.quickpost.plans[qpPlans[0]?.key || '']?.services.filter(s => s.comparable).map(s => s.courier as string) || [])], [qpPlans]);

  const sellerPlan: string | null = null;
  const [form, setForm] = useState<Form>(() => emptyForm(qpPlans[0]?.key || ''));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [result, setResult] = useState<CompareResult | null>(null);
  const [state, setState] = useState<'idle' | 'done' | 'unavailable' | 'noservice'>('idle');
  const [sortDesc, setSortDesc] = useState(false);
  const [showAssumptions, setShowAssumptions] = useState(() => { try { return !localStorage.getItem(`${CFG.STORAGE_KEY}_seen`); } catch { return true; } });
  const [showHow, setShowHow] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const errorSummaryRef = useRef<HTMLDivElement>(null);

  // Saved inputs (the sales person picks the QuickPost plan to pitch; there is no "own plan" here)
  useEffect(() => {
    const def = defaultQuickPostPlan(DATA, sellerPlan);
    let saved: Partial<Form> | null = null;
    try { saved = JSON.parse(localStorage.getItem(storageKey) || 'null'); } catch { /* ignore */ }
    setForm(f => ({ ...f, ...(saved || {}), qpPlan: saved?.qpPlan && qpPlans.some(p => p.key === saved!.qpPlan) ? saved.qpPlan : (def.key || f.qpPlan) }));
  }, [sellerPlan, storageKey, qpPlans]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm(f => ({ ...f, [k]: v }));
  const isNum = form.mode === 'number';
  const N = num(form.shipments);
  const unit = isNum ? 'nos' : '%';
  const zoneSum = form.zones.reduce((a, z) => a + (Number(z) || 0), 0);
  const zoneTarget = isNum ? (Number.isFinite(N) ? N : 0) : 100;
  const zonesOk = isNum ? Number.isFinite(N) && zoneSum === N : Math.abs(zoneSum - 100) <= CFG.ZONE_SUM_TOLERANCE;
  const mixTotal = form.weightMix.reduce((a, z) => a + (Number(z) || 0), 0);
  const providerPlans = providers.find(p => p.key === form.provider)?.plans || [];

  /** Numbers ⇄ percentages: convert what is already typed, using total shipments. */
  const switchMode = (mode: Mode) => setForm(f => {
    if (f.mode === mode) return f;
    const total = Number(f.shipments);
    const conv = (s: string) => {
      const v = Number(s);
      if (s.trim() === '' || !Number.isFinite(v) || !(total > 0)) return '';
      return mode === 'number' ? String(Math.round((v / 100) * total)) : String(Math.round((v / total) * 1000) / 10);
    };
    const zones = f.zones.map(conv);
    if (mode === 'number' && zones.every(z => z !== '')) {
      // rounding can leave the counts a few short or over; settle the gap on the largest zone
      const vals = zones.map(Number), gap = total - vals.reduce((a, b) => a + b, 0);
      if (gap !== 0) { const i = vals.indexOf(Math.max(...vals)); zones[i] = String(vals[i] + gap); }
    }
    return { ...f, mode, zones, cod: conv(f.cod), rto: conv(f.rto) };
  });

  const toPct = (s: string) => (isNum ? (num(s) / N) * 100 : num(s));

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    const L = CFG.INPUT_LIMITS;
    const range = (k: string, v: number, label: string, int = false) => {
      const [lo, hi] = L[k];
      if (!Number.isFinite(v)) e[k] = `Enter ${label}`;
      else if (v < lo || v > hi || (int && !Number.isInteger(v))) e[k] = `${label[0].toUpperCase() + label.slice(1)} must be between ${lo.toLocaleString('en-IN')} and ${hi.toLocaleString('en-IN')}`;
    };
    range('shipments', N, 'total shipments', true);
    if (form.shippingCost.trim() !== '') range('shippingCost', num(form.shippingCost), 'monthly shipping cost');
    range('aov', num(form.aov), 'average parcel value');
    if (!form.useWeightMix) range('weight', num(form.weight), 'average weight');
    else if (Math.abs(mixTotal - 100) > CFG.ZONE_SUM_TOLERANCE) e.weightMix = `Weight distribution must total 100% (now ${pct(mixTotal)})`;
    if (form.zoneMode === 'zone' && !zonesOk) {
      e.zones = isNum
        ? `Zone shipments must add up to ${Number.isFinite(N) ? N.toLocaleString('en-IN') : 'total shipments'} (now ${zoneSum.toLocaleString('en-IN')})`
        : `Zone mix must total 100% (now ${pct(zoneSum)})`;
    }
    for (const [k, label] of [['cod', 'COD'], ['rto', 'RTO']] as const) {
      const raw = num(form[k]);
      const [lo, hi] = L[k];
      if (!Number.isFinite(raw) || raw < 0) e[k] = `Enter ${label} ${isNum ? 'shipments' : 'share'}`;
      else if (isNum && Number.isFinite(N) && raw > N) e[k] = `${label} shipments cannot exceed total shipments`;
      else if (Number.isFinite(N) && (toPct(form[k]) < lo || toPct(form[k]) > hi)) e[k] = `${label} must be between ${lo}% and ${hi}% of shipments`;
    }
    if (form.provider && !form.providerPlan) e.providerPlan = 'Select your current plan';
    if (!form.qpPlan) e.qpPlan = 'Select a QuickPost plan';
    if (form.remittance.trim() !== '') range('remittance', num(form.remittance), 'remittance cycle');
    if (form.dispute.trim() !== '') range('dispute', num(form.dispute), 'weight dispute share');
    return e;
  };

  const calculate = (ev?: React.FormEvent) => {
    ev?.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) { setTimeout(() => errorSummaryRef.current?.focus(), 0); return; }
    try { localStorage.setItem(storageKey, JSON.stringify(form)); } catch { /* storage blocked: keep going */ }
    const dims = form.dims.map(Number);
    const profile: Profile = {
      shipments: N, aov: num(form.aov), weight: num(form.weight) || 0.5,
      dims: dims.every(v => v > 0) ? (dims as [number, number, number]) : null,
      weightMix: form.useWeightMix ? form.weightMix.map(v => Number(v) || 0) : null,
      zoneMix: form.zoneMode === 'pan' ? PAN_INDIA : form.zones.map(z => toPct(z) || 0),
      codPct: toPct(form.cod), rtoPct: toPct(form.rto),
      courier: form.courier || null,
    };
    try {
      const r = compare(DATA, {
        profile,
        provider: form.provider || 'auto',
        providerPlan: form.providerPlan || null,
        statedMonthlyCost: form.shippingCost.trim() === '' ? null : num(form.shippingCost),
        quickpostPlan: form.qpPlan,
        remittanceDays: form.remittance.trim() === '' ? null : num(form.remittance),
        disputePct: form.dispute.trim() === '' ? null : num(form.dispute),
      });
      setResult(r); setState('done');
      try { localStorage.setItem(`${CFG.STORAGE_KEY}_seen`, '1'); } catch { /* ignore */ }
    } catch (err) {
      setResult(null);
      setState(err instanceof NoServiceError ? 'noservice' : 'unavailable');
    }
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  };

  const reset = () => {
    setForm(emptyForm(defaultQuickPostPlan(DATA, sellerPlan).key || qpPlans[0]?.key || ''));
    setErrors({}); setResult(null); setState('idle');
    try { localStorage.removeItem(storageKey); } catch { /* ignore */ }
  };

  const rateDate = fmtDate(DATA.sources.shiprocket?.effective_from || DATA.meta.generated_on);
  const disclaimer = CFG.DISCLAIMER.replace('{date}', rateDate);

  /** Opens WhatsApp with a short text summary of this comparison; the sales person picks the chat. */
  const shareWhatsApp = () => {
    if (!result) return;
    const diff = result.diffMonth;
    const lines = [
      '*QuickPost rate comparison*',
      `Shipments per month: ${Number(form.shipments).toLocaleString('en-IN')}`,
      `${result.current.totalOnly ? 'Current shipping cost' : result.current.label}: ${inr(result.current.breakdown.total)} per month (${inr2(result.current.perShipment)} per shipment)`,
      `${result.quickpost.label}: ${inr(result.quickpost.breakdown.total)} per month (${inr2(result.quickpost.perShipment)} per shipment)`,
      diff > 0 ? `Difference: ${inr(diff)} lower per month with QuickPost (${pct(result.diffPct)}), ${inr(result.diffYear)} per year`
        : diff < 0 ? `Difference: QuickPost estimate is ${inr(-diff)} higher per month`
          : 'Difference: both estimates are the same',
      `Business score: ${result.score.score} out of 100 (${result.score.band.label})`,
      '',
      `_${disclaimer}_`,
    ];
    window.open(`https://wa.me/?text=${encodeURIComponent(lines.join(String.fromCharCode(10)))}`, '_blank', 'noopener,noreferrer');
  };

  const exportCsv = () => {
    if (!result) return;
    const b = result.current.breakdown, q = result.quickpost.breakdown;
    const cur = (v: number) => (result.current.totalOnly ? '' : v);
    const rows: (string | number)[][] = [
      ['QuickPost Rate Comparison'], ['Rate cards as on', rateDate], ['Data version', DATA.meta.generated_on], [],
      ['Inputs'], ['Total monthly shipments', form.shipments], ['Monthly shipping cost (₹)', form.shippingCost], ['Average parcel value (₹)', form.aov],
      ['Average weight (kg)', form.useWeightMix ? 'Distribution' : form.weight],
      ['Zone mix A/B/C/D/E', form.zoneMode === 'pan' ? `Pan India (${PAN_INDIA.join('/')} %)` : `${form.zones.join('/')} ${unit}`],
      [`COD (${unit})`, form.cod], [`RTO (${unit})`, form.rto],
      ['Current', result.current.label], ...(result.current.predicted ? [['Closest published rate card', result.current.predicted.label]] : []),
      ['QuickPost plan', result.quickpost.label], [],
      ['', result.current.label, result.quickpost.label, 'Difference'],
      ['Freight', cur(b.freight), q.freight, result.current.totalOnly ? '' : b.freight - q.freight],
      ['COD fees', cur(b.cod), q.cod, result.current.totalOnly ? '' : b.cod - q.cod],
      ['RTO charges', cur(b.rto), q.rto, result.current.totalOnly ? '' : b.rto - q.rto],
      ['Total', b.total, q.total, result.diffMonth],
      [], ['Business score', result.score.score, result.score.band.label], [], ['Note', disclaimer],
    ];
    const esc = (v: unknown) => `"${String(typeof v === 'number' ? Math.round(v) : v ?? '').replace(/"/g, '""')}"`;
    const blob = new Blob([rows.map(r => r.map(esc).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `rate-comparison-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const errorList = Object.values(errors);
  const qpCheaper = result ? result.diffMonth > 0 : false;
  const courierRows = result ? [...result.courierRows].sort((a, b) => (sortDesc ? b.qpTotal - a.qpTotal : a.qpTotal - b.qpTotal)) : [];
  const bandColor = result ? (CFG.SCORE.bands.find(b => b.label === result.score.band.label)?.color || '#0F172A') : '#0F172A';
  const toneDot = (sub: number) => (sub >= 60 ? 'bg-[#00A86B]' : sub >= 40 ? 'bg-amber-500' : 'bg-red-500');
  const statusWord = (sub: number) => (sub >= 60 ? 'Good' : sub >= 40 ? 'Fair' : 'Weak');
  const partial = result ? result.current.totalOnly || result.current.freightOnly : false;
  const likelyEst = result?.estimates.find(e => e.likely && e.key !== 'other');
  const sameCourierHead = likelyEst ? `${likelyEst.provider} ${likelyEst.plan}` : result?.current.label;

  return (
    <AdminLayout>
      <SalesKycGate>
      <style>{`@media print { aside, header, nav, .rc-no-print { display: none !important; } }`}</style>
      <div className="max-w-[1180px] mx-auto pb-10">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
          <div className="flex items-start gap-3 min-w-0">
            <span className="w-10 h-10 rounded-xl bg-[#F0FDF4] text-[#00A86B] flex items-center justify-center shrink-0"><Calculator className="w-5 h-5" /></span>
            <div>
              <h1 className="text-[20px] font-bold text-[#0F172A]">Rate comparison</h1>
              <p className="text-[13px] text-[#64748B] max-w-[620px]">Enter a seller's shipping details to compare what they pay today with QuickPost, using published rate cards, and get their business score.</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={calculate} noValidate className={`${card} rc-no-print`}>
          <div className="px-4 md:px-6 py-3.5 border-b border-[#F1F5F9] flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-[14px] font-bold text-[#0F172A]">Seller's shipping details</h2>
              <p className="text-[12px] text-[#94A3B8]">Enter zones, COD and RTO as shipment counts or as percentages.</p>
            </div>
            <Segmented label="Input type" value={form.mode} onChange={switchMode} options={[{ key: 'number', label: 'Numbers' }, { key: 'percent', label: 'Percentages %' }]} />
          </div>

          <div className="p-4 md:p-6">
            {errorList.length > 0 && (
              <div ref={errorSummaryRef} tabIndex={-1} role="alert" className="mb-5 flex items-start gap-2 px-3.5 py-2.5 rounded-xl bg-red-50 border border-red-100 text-[12.5px] text-red-600 outline-none">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Fix {errorList.length} field{errorList.length > 1 ? 's' : ''} to calculate: {errorList.join(' · ')}</span>
              </div>
            )}

            {/* Volume and cost */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Field id="rc-shipments" label="Total shipments per month" error={errors.shipments}>
                <input id="rc-shipments" inputMode="numeric" value={form.shipments} onChange={e => set('shipments', e.target.value.replace(/\D/g, ''))} placeholder="e.g. 1000" className={inputCls(errors.shipments)} />
              </Field>
              <Field id="rc-cost" label="Shipping cost per month" suffix="₹" error={errors.shippingCost} help="Optional. What you pay now, including COD and RTO charges">
                <input id="rc-cost" inputMode="decimal" value={form.shippingCost} onChange={e => set('shippingCost', e.target.value.replace(/[^\d.]/g, ''))} placeholder="e.g. 95000" className={inputCls(errors.shippingCost)} />
              </Field>
              <Field id="rc-aov" label="Average parcel value" suffix="₹" error={errors.aov} help="Order value of a typical parcel">
                <input id="rc-aov" inputMode="decimal" value={form.aov} onChange={e => set('aov', e.target.value.replace(/[^\d.]/g, ''))} placeholder="e.g. 800" className={inputCls(errors.aov)} />
              </Field>
              <Field id="rc-weight" label="Average parcel weight" suffix="kg" error={errors.weight} help={form.useWeightMix ? 'Using the weight distribution below' : undefined}>
                <input id="rc-weight" inputMode="decimal" disabled={form.useWeightMix} value={form.weight} onChange={e => set('weight', e.target.value.replace(/[^\d.]/g, ''))} className={`${inputCls(errors.weight)} disabled:bg-[#F8FAFC] disabled:text-[#94A3B8]`} />
              </Field>
            </div>

            {/* Zones */}
            <div className="mt-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[12px] font-semibold text-[#334155]">Where you ship</span>
                <Segmented label="Zone input" value={form.zoneMode} onChange={v => set('zoneMode', v)} options={[{ key: 'pan', label: 'Pan India' }, { key: 'zone', label: 'Zone-wise' }]} />
              </div>
              {form.zoneMode === 'pan' ? (
                <p className="mt-2 text-[12.5px] text-[#64748B]">
                  Uses a standard Pan India mix: {ZONES.map((z, i) => `${z} ${PAN_INDIA[i]}%`).join(' · ')}. Choose Zone-wise to enter your own split.
                </p>
              ) : (
                <>
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {ZONES.map((z, i) => (
                      <Field key={z} id={`rc-zone-${i}`} label={z} suffix={unit} help={ZONE_HINT[i]}>
                        <input id={`rc-zone-${i}`} inputMode="decimal" value={form.zones[i]} onChange={e => {
                          const zones = [...form.zones]; zones[i] = e.target.value.replace(isNum ? /\D/g : /[^\d.]/g, ''); set('zones', zones);
                        }} placeholder="0" className={inputCls(errors.zones)} />
                      </Field>
                    ))}
                  </div>
                  <p aria-live="polite" className={`mt-2 text-[12px] font-semibold tabular-nums ${zonesOk ? 'text-[#00A86B]' : 'text-red-500'}`}>
                    Total: {isNum ? `${zoneSum.toLocaleString('en-IN')} of ${zoneTarget.toLocaleString('en-IN')} shipments` : `${pct(zoneSum)} of 100%`}
                  </p>
                </>
              )}
            </div>

            {/* COD / RTO */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Field id="rc-cod" label={isNum ? 'COD shipments' : 'COD share of shipments'} suffix={unit} error={errors.cod}>
                <input id="rc-cod" inputMode="decimal" value={form.cod} onChange={e => set('cod', e.target.value.replace(isNum ? /\D/g : /[^\d.]/g, ''))} placeholder={isNum ? 'e.g. 600' : 'e.g. 60'} className={inputCls(errors.cod)} />
              </Field>
              <Field id="rc-rto" label={isNum ? 'RTO shipments' : 'RTO rate, all shipments'} suffix={unit} error={errors.rto}>
                <input id="rc-rto" inputMode="decimal" value={form.rto} onChange={e => set('rto', e.target.value.replace(isNum ? /\D/g : /[^\d.]/g, ''))} placeholder={isNum ? 'e.g. 250' : 'e.g. 25'} className={inputCls(errors.rto)} />
              </Field>
            </div>

            {/* Providers */}
            <div className="mt-6 pt-5 border-t border-[#F1F5F9] grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field id="rc-provider" label="Current provider (optional)" help={form.provider ? undefined : 'If you skip this, your likely provider and plan are estimated from your volume'}>
                <select id="rc-provider" value={form.provider} onChange={e => setForm(f => ({ ...f, provider: e.target.value, providerPlan: '' }))} className={selectCls}>
                  <option value="">Prefer not to say</option>
                  {providers.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                </select>
              </Field>
              {form.provider && (
                <Field id="rc-provider-plan" label="Current plan" error={errors.providerPlan}>
                  <select id="rc-provider-plan" value={form.providerPlan} onChange={e => set('providerPlan', e.target.value)} className={selectCls}>
                    <option value="">Select plan</option>
                    {providerPlans.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                  </select>
                </Field>
              )}
              <Field id="rc-qp" label="QuickPost plan to compare" error={errors.qpPlan} help="The plan you are offering this seller">
                <select id="rc-qp" value={form.qpPlan} onChange={e => set('qpPlan', e.target.value)} className={selectCls}>
                  {qpPlans.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                </select>
              </Field>
            </div>

            {/* Advanced */}
            <button type="button" onClick={() => setShowAdvanced(s => !s)} aria-expanded={showAdvanced} className="mt-6 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#00A86B]">
              More options <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            </button>
            {showAdvanced && (
              <div className="mt-4 pt-4 border-t border-[#F1F5F9] space-y-5">
                <div>
                  <label className="inline-flex items-center gap-2 text-[12px] font-semibold text-[#334155]">
                    <input type="checkbox" checked={form.useWeightMix} onChange={e => set('useWeightMix', e.target.checked)} className="w-4 h-4 accent-[#00A86B]" />
                    Use a weight distribution instead of the average weight
                  </label>
                  {form.useWeightMix && (
                    <>
                      <div className="mt-2 grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {CFG.WEIGHT_BUCKETS.map((b, i) => (
                          <Field key={b.key} id={`rc-w-${i}`} label={b.label} suffix="%">
                            <input id={`rc-w-${i}`} inputMode="decimal" value={form.weightMix[i]} onChange={e => { const w = [...form.weightMix]; w[i] = e.target.value.replace(/[^\d.]/g, ''); set('weightMix', w); }} className={inputCls(errors.weightMix)} />
                          </Field>
                        ))}
                      </div>
                      <p aria-live="polite" className={`mt-1 text-[11.5px] ${errors.weightMix ? 'text-red-500' : 'text-[#94A3B8]'}`}>{errors.weightMix || `Total: ${pct(mixTotal)}`}</p>
                    </>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <span className="block text-[12px] font-semibold text-[#334155] mb-1.5">Package size L × B × H</span>
                    <div className="grid grid-cols-3 gap-2">
                      {['L', 'B', 'H'].map((d, i) => (
                        <input key={d} aria-label={`${d} in cm`} inputMode="decimal" value={form.dims[i]} onChange={e => { const v = [...form.dims]; v[i] = e.target.value.replace(/[^\d.]/g, ''); set('dims', v); }} placeholder={`${d} cm`} className={`${inputCls()} !pr-2`} />
                      ))}
                    </div>
                    <p className="mt-1 text-[11.5px] text-[#94A3B8]">Volumetric weight = L × B × H / {CFG.VOLUMETRIC_DIVISOR}</p>
                  </div>
                  <Field id="rc-courier" label="Primary courier" help="Compares the same courier on both sides">
                    <select id="rc-courier" value={form.courier} onChange={e => set('courier', e.target.value)} className={selectCls}>
                      <option value="">Any courier (best rate)</option>
                      {couriers.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </Field>
                  <Field id="rc-remit" label="COD remittance cycle" suffix="days" error={errors.remittance} help="Days after delivery; adds to your score">
                    <input id="rc-remit" inputMode="numeric" value={form.remittance} onChange={e => set('remittance', e.target.value.replace(/\D/g, ''))} className={inputCls(errors.remittance)} />
                  </Field>
                  <Field id="rc-dispute" label="Shipments with weight disputes" suffix="%" error={errors.dispute} help="Adds to your score">
                    <input id="rc-dispute" inputMode="decimal" value={form.dispute} onChange={e => set('dispute', e.target.value.replace(/[^\d.]/g, ''))} className={inputCls(errors.dispute)} />
                  </Field>
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-2">
              <button type="button" onClick={reset} className="h-10 px-4 rounded-full border border-[#E2E8F0] text-[13px] font-semibold text-[#475569] hover:bg-[#F8FAFC] inline-flex items-center gap-1.5"><RotateCcw className="w-3.5 h-3.5" />Reset</button>
              <button type="submit" className="h-10 px-6 rounded-full bg-[#00A86B] hover:bg-[#009B63] text-white text-[13px] font-semibold">Calculate</button>
            </div>
          </div>
        </form>

        {/* Results */}
        <div ref={resultRef} className="scroll-mt-24" aria-live="polite">
          {state === 'unavailable' && (
            <div className={`${card} mt-5 p-6 text-center`}>
              <AlertCircle className="w-6 h-6 text-[#94A3B8] mx-auto" />
              <p className="mt-2 text-[14px] font-semibold text-[#0F172A]">Comparison is temporarily unavailable</p>
              <p className="text-[12.5px] text-[#64748B]">Please try again later.</p>
            </div>
          )}
          {state === 'noservice' && (
            <div className={`${card} mt-5 p-6 text-center`}>
              <p className="text-[14px] font-semibold text-[#0F172A]">No service on the selected plan can price this weight</p>
              <p className="text-[12.5px] text-[#64748B]">Try a different weight, plan or courier.</p>
            </div>
          )}

          {state === 'done' && result && (
            <div className="mt-5 space-y-5">
              <div className="grid grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)] gap-5">
                {/* Business score */}
                <section className={`${card} p-5`}>
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-[15px] font-bold text-[#0F172A]">Business score</h2>
                    <button type="button" onClick={() => setShowHow(s => !s)} aria-expanded={showHow} className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#00A86B]"><Info className="w-3.5 h-3.5" />How it works</button>
                  </div>
                  <p className="sr-only">Business score {result.score.score} out of 100, {result.score.band.label}</p>
                  <div className="mt-3"><ScoreGauge score={result.score.score} bandLabel={result.score.band.label} bandColor={bandColor} /></div>
                  <p className="mt-3 text-center text-[12px] text-[#64748B]">
                    Based on {result.score.used} of {result.score.total} factors
                    {result.score.used < result.score.total && <> · <button type="button" onClick={() => { setShowAdvanced(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="font-semibold text-[#00A86B]">add more</button></>}
                  </p>
                  {showHow && (
                    <div className="mt-3 rounded-xl bg-[#F8FAFC] border border-[#EEF2F6] p-3.5 text-[11.5px] text-[#475569] space-y-1">
                      <p>Each factor scores 0–100 and is weighted: RTO {CFG.SCORE.rto.weight * 100}%, cost efficiency {CFG.SCORE.cost.weight * 100}%, COD dependency {CFG.SCORE.cod.weight * 100}%, weight disputes {CFG.SCORE.dispute.weight * 100}%, remittance cycle {CFG.SCORE.remittance.weight * 100}%.</p>
                      <p>Factors you did not enter are left out and the rest are scaled up. Reference levels are the ones used by this tool, not industry statistics.</p>
                      <p>Bands: 80–100 Strong, 60–79 Good, 40–59 Needs attention, 0–39 Critical.</p>
                    </div>
                  )}
                </section>

                {/* Summary + factors */}
                <div className="space-y-5 min-w-0">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { k: result.current.totalOnly ? 'Your monthly shipping cost' : `Estimated monthly cost, ${result.current.label}`, v: inr(result.current.breakdown.total) },
                      { k: `Estimated monthly cost, ${result.quickpost.label}`, v: inr(result.quickpost.breakdown.total) },
                      { k: 'Difference per month', v: `${inr(Math.abs(result.diffMonth))} (${pct(Math.abs(result.diffPct))})`, green: qpCheaper },
                      { k: 'Difference per year', v: inr(Math.abs(result.diffYear)), green: qpCheaper },
                    ].map(c => (
                      <div key={c.k} className={`${card} px-4 py-3.5`}>
                        <div className="text-[11.5px] text-[#64748B] leading-snug">{c.k}</div>
                        <div className={`mt-1 text-[19px] font-bold tabular-nums ${c.green ? 'text-[#00A86B]' : 'text-[#0F172A]'}`}>{c.v}</div>
                      </div>
                    ))}
                  </div>
                  <div className={`${card} px-4 md:px-5 py-4 text-[13px] text-[#334155] space-y-1.5`}>
                    <p className="font-semibold text-[#0F172A]">
                      {result.diffMonth > 0
                        ? `QuickPost estimate is ${inr(result.diffMonth)} lower per month for this profile.`
                        : result.diffMonth < 0
                          ? `QuickPost estimate is ${inr(-result.diffMonth)} higher per month for this profile.`
                          : 'Both estimates are the same for this profile.'}
                    </p>
                    {!result.current.totalOnly && result.stated != null && (
                      <p>You entered a monthly shipping cost of {inr(result.stated)}; the rate-card estimate for {result.current.label} is {inr(result.current.breakdown.total)}.</p>
                    )}
                  </div>
                  <div className={`${card} overflow-hidden`}>
                    <table className="w-full text-left text-[12.5px]">
                      <thead className="bg-[#FAFBFC] text-[11.5px] text-[#64748B]"><tr><th className="py-2.5 px-4 font-semibold">Score factor</th><th className="py-2.5 px-4 font-semibold text-right">Your value</th><th className="py-2.5 px-4 font-semibold text-right">Sub-score</th><th className="py-2.5 px-4 font-semibold">Status</th></tr></thead>
                      <tbody className="divide-y divide-[#F1F5F9]">
                        {result.score.factors.map(f => (
                          <tr key={f.key}>
                            <td className="py-2.5 px-4 text-[#334155]">{f.label}</td>
                            <td className="py-2.5 px-4 text-right tabular-nums text-[#0F172A]">{f.value}</td>
                            <td className="py-2.5 px-4 text-right tabular-nums font-semibold text-[#0F172A]">{Math.round(f.sub)}</td>
                            <td className="py-2.5 px-4"><span className="inline-flex items-center gap-1.5 text-[#475569]"><span className={`w-2 h-2 rounded-full ${toneDot(f.sub)}`} />{statusWord(f.sub)}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {result.score.lowest.length > 0 && (
                      <ul className="px-4 py-3 border-t border-[#F1F5F9] space-y-1 text-[12.5px] text-[#475569] list-disc pl-9">
                        {result.score.lowest.map(f => <li key={f.key}>{f.sentence}</li>)}
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              {/* Provider not shared: likely provider and plan */}
              {result.estimates.length > 0 && (
                <section className={`${card} overflow-hidden`}>
                  <div className="px-4 md:px-6 py-3.5 border-b border-[#F1F5F9]">
                    <h2 className="text-[15px] font-bold text-[#0F172A]">Your likely current provider</h2>
                    <p className="text-[12px] text-[#94A3B8]">Estimated from your monthly shipments and shipping profile, because no provider was selected.</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-left text-[13px]">
                      <thead className="bg-[#FAFBFC] text-[11.5px] text-[#64748B]">
                        <tr>
                          <th className="py-2.5 px-4 md:px-6 font-semibold sticky left-0 bg-[#FAFBFC]">Provider</th>
                          <th className="py-2.5 px-4 font-semibold">Likely plan</th>
                          <th className="py-2.5 px-4 font-semibold text-right">Rate per shipment</th>
                          <th className="py-2.5 px-4 font-semibold text-right">Total per month</th>
                          <th className="py-2.5 px-4 md:px-6 font-semibold text-right">Against {result.quickpost.label}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F1F5F9]">
                        {result.estimates.map(e => {
                          const d = e.total - result.quickpost.breakdown.total;
                          return (
                            <tr key={e.key} className={e.likely ? 'bg-[#F0FDF4]/60' : ''}>
                              <td className="py-2.5 px-4 md:px-6 font-semibold text-[#0F172A] sticky left-0 bg-inherit">
                                {e.provider}
                                {e.likely && <span className="ml-2 px-1.5 py-px rounded bg-[#00A86B]/10 text-[10.5px] font-semibold text-[#00A86B] whitespace-nowrap">{result.stated != null ? 'Closest to your cost' : 'Used for comparison'}</span>}
                              </td>
                              <td className="py-2.5 px-4 text-[#475569]">{e.plan ?? 'Not known'}</td>
                              <td className="py-2.5 px-4 text-right tabular-nums">{inr2(e.perShipment)}</td>
                              <td className="py-2.5 px-4 text-right tabular-nums">{inr(e.total)}</td>
                              <td className="py-2.5 px-4 md:px-6 text-right tabular-nums text-[#475569]">{d >= 0 ? `${inr(d)} higher` : `${inr(-d)} lower`}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <p className="px-4 md:px-6 py-3 border-t border-[#F1F5F9] text-[12px] text-[#94A3B8]">
                    Plans are matched to your monthly shipments using each provider's published volume tiers. "Other provider" is an assumption: the higher of the two estimates plus {CFG.OTHER_PROVIDER_MARKUP * 100}%. These are estimates, not a confirmation of who you ship with.
                  </p>
                </section>
              )}

              {/* Cost breakdown */}
              <section className={`${card} overflow-hidden`}>
                <div className="px-4 md:px-6 py-3.5 border-b border-[#F1F5F9] flex items-center justify-between">
                  <h2 className="text-[15px] font-bold text-[#0F172A]">Cost breakdown</h2>
                  <span className="text-[11.5px] text-[#94A3B8]">Monthly, GST-inclusive</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-left text-[13px]">
                    <thead className="bg-[#FAFBFC] text-[11.5px] text-[#64748B]">
                      <tr><th className="py-2.5 px-4 md:px-6 font-semibold sticky left-0 bg-[#FAFBFC]"> </th><th className="py-2.5 px-4 font-semibold text-right">{result.current.label}</th><th className="py-2.5 px-4 font-semibold text-right">{result.quickpost.label}</th><th className="py-2.5 px-4 md:px-6 font-semibold text-right">Difference</th></tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9]">
                      {([
                        ['Freight', result.current.totalOnly ? null : result.current.breakdown.freight, result.quickpost.breakdown.freight],
                        ['COD fees', partial ? null : result.current.breakdown.cod, result.current.freightOnly ? null : result.quickpost.breakdown.cod],
                        ['RTO charges', partial ? null : result.current.breakdown.rto, result.current.freightOnly ? null : result.quickpost.breakdown.rto],
                      ] as [string, number | null, number | null][]).map(([k, a, b]) => (
                        <tr key={k}>
                          <td className="py-2.5 px-4 md:px-6 text-[#334155] sticky left-0 bg-white">{k}</td>
                          <td className="py-2.5 px-4 text-right tabular-nums">{a == null ? '—' : inr(a)}</td>
                          <td className="py-2.5 px-4 text-right tabular-nums">{b == null ? '—' : inr(b)}</td>
                          <td className="py-2.5 px-4 md:px-6 text-right tabular-nums text-[#475569]">{a == null || b == null ? '—' : inr(a - b)}</td>
                        </tr>
                      ))}
                      <tr className="font-bold text-[#0F172A]">
                        <td className="py-2.5 px-4 md:px-6 sticky left-0 bg-white">Total</td>
                        <td className="py-2.5 px-4 text-right tabular-nums">{inr(result.current.breakdown.total)}</td>
                        <td className="py-2.5 px-4 text-right tabular-nums">{inr(result.quickpost.breakdown.total)}</td>
                        <td className="py-2.5 px-4 md:px-6 text-right tabular-nums">{inr(result.diffMonth)}</td>
                      </tr>
                      <tr className="text-[#475569]">
                        <td className="py-2.5 px-4 md:px-6 sticky left-0 bg-white">Cost per shipment</td>
                        <td className="py-2.5 px-4 text-right tabular-nums">{inr2(result.current.perShipment)}</td>
                        <td className="py-2.5 px-4 text-right tabular-nums">{inr2(result.quickpost.perShipment)}</td>
                        <td className="py-2.5 px-4 md:px-6 text-right tabular-nums">{inr2(result.current.perShipment - result.quickpost.perShipment)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                {result.current.totalOnly && <p className="px-4 md:px-6 py-3 border-t border-[#F1F5F9] text-[12px] text-[#94A3B8]">The split of your current cost is not known, so only the total is compared.</p>}
              </section>

              {/* Service-level */}
              <section className={`${card} overflow-hidden`}>
                <div className="px-4 md:px-6 py-3.5 border-b border-[#F1F5F9]">
                  <h2 className="text-[15px] font-bold text-[#0F172A]">Lowest-cost QuickPost services for this profile</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-[13px]">
                    <thead className="bg-[#FAFBFC] text-[11.5px] text-[#64748B]">
                      <tr>
                        <th className="py-2.5 px-4 md:px-6 font-semibold sticky left-0 bg-[#FAFBFC]">Courier</th>
                        <th className="py-2.5 px-4 font-semibold">Service</th>
                        <th className="py-2.5 px-4 font-semibold text-right">Per shipment</th>
                        <th className="py-2.5 px-4 font-semibold text-right"><button type="button" onClick={() => setSortDesc(s => !s)} className="inline-flex items-center gap-1">Monthly total <ArrowUpDown className="w-3 h-3" /></button></th>
                        <th className="py-2.5 px-4 md:px-6 font-semibold text-right">{sameCourierHead}, same courier</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9]">
                      {courierRows.map(r => (
                        <tr key={r.courier}>
                          <td className="py-2.5 px-4 md:px-6 font-semibold text-[#0F172A] sticky left-0 bg-white">{r.courier}</td>
                          <td className="py-2.5 px-4 text-[#475569]">{r.service}</td>
                          <td className="py-2.5 px-4 text-right tabular-nums">{inr2(r.qpPerShipment)}</td>
                          <td className="py-2.5 px-4 text-right tabular-nums">{inr(r.qpTotal)}</td>
                          <td className="py-2.5 px-4 md:px-6 text-right tabular-nums text-[#475569]">{r.currentTotal == null ? 'Not available' : `${inr2(r.currentPerShipment!)} · ${inr(r.currentTotal)}`}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {result.capitalCost && (
                  <p className="px-4 md:px-6 py-3 border-t border-[#F1F5F9] text-[12.5px] text-[#475569]">
                    Cost of capital on COD remittance (not included above): {inr(result.capitalCost.current)} per month at your cycle, {inr(result.capitalCost.quickpost)} at QuickPost's cycle.
                  </p>
                )}
              </section>

              {/* Assumptions */}
              <section className={card}>
                <button type="button" onClick={() => setShowAssumptions(s => !s)} aria-expanded={showAssumptions} className="w-full px-4 md:px-6 py-3.5 flex items-center justify-between text-[15px] font-bold text-[#0F172A]">
                  Assumptions <ChevronDown className={`w-4 h-4 text-[#94A3B8] transition-transform ${showAssumptions ? 'rotate-180' : ''}`} />
                </button>
                {showAssumptions && (
                  <ul className="px-4 md:px-6 pb-5 space-y-1.5 text-[12.5px] text-[#475569] list-disc pl-9 md:pl-11">
                    <li>Freight = shipments × weighted forward price across your zone mix. Forward freight applies to every shipment, including those that later return.</li>
                    <li>RTO charges = returned shipments × RTO price. Where a provider does not publish RTO rates, RTO is priced the same as forward.</li>
                    <li>COD fee = the higher of the fixed fee and the percentage of parcel value, charged only on delivered COD orders.</li>
                    <li>Weight above the first slab is charged per additional step as listed on each rate card. Chargeable weight is the higher of actual and volumetric weight.</li>
                    <li>The cheapest eligible service on each plan is used unless a primary courier is chosen. All totals are GST-inclusive.</li>
                    <li>When you do not select a provider, your own shipping cost is used as the current cost and the closest published rate card is shown for reference only.</li>
                    <li>Rate cards as on {rateDate}. Actual negotiated rates may differ; figures are estimates.</li>
                  </ul>
                )}
              </section>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2 rc-no-print">
                <button type="button" onClick={() => window.print()} className="h-10 px-4 rounded-full border border-[#E2E8F0] text-[13px] font-semibold text-[#475569] hover:bg-[#F8FAFC] inline-flex items-center gap-1.5"><Printer className="w-4 h-4" />Download PDF</button>
                <button type="button" onClick={exportCsv} className="h-10 px-4 rounded-full border border-[#E2E8F0] text-[13px] font-semibold text-[#475569] hover:bg-[#F8FAFC] inline-flex items-center gap-1.5"><Download className="w-4 h-4" />Download CSV</button>
                <button type="button" onClick={shareWhatsApp} className="h-10 px-4 rounded-full bg-[#25D366] hover:bg-[#1FB959] text-white text-[13px] font-semibold inline-flex items-center gap-1.5"><MessageCircle className="w-4 h-4" />Share on WhatsApp</button>
              </div>
            </div>
          )}

          <p className="mt-6 text-[11.5px] text-[#94A3B8]">{disclaimer}</p>
        </div>
      </div>
      </SalesKycGate>
    </AdminLayout>
  );
}
