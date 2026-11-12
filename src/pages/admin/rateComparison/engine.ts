/* Rate Comparison engine — pure, framework-free, no I/O. Same inputs → same output.
   Money is never rounded here; rounding happens only for display. */

import { RATE_COMPARISON_CONFIG as CFG } from './config';

// ── Data types (mirror rate_cards.json) ───────────────────────────────────────
export type Zones5 = [number, number, number, number, number];
export interface ServiceRow {
  service: string | null;
  courier: string | null;
  mode: 'surface' | 'air' | null;
  comparable: boolean;
  min_weight_kg: number;
  base: number[];
  addl_step_kg?: number | null;
  addl?: (number | null)[] | null;
  rto?: (number | null)[] | null;
  cod_fixed: number;
  cod_pct: number;
}
export interface Plan { label: string; verified: boolean; note?: string; source_file?: string; services: ServiceRow[] }
export interface Source {
  label: string;
  gst_included: boolean | null;
  cod_rule: 'max';
  rto_rule: 'explicit' | 'mirror_forward';
  captured_on?: string;
  effective_from?: string;
  plans: Record<string, Plan>;
}
export interface RateData { meta: { generated_on: string }; sources: Record<string, Source> }

export class DataConfigError extends Error {
  constructor(message: string) { super(message); this.name = 'DataConfigError'; }
}

// ── Validation (stands in for a JSON schema; no extra dependency) ─────────────
export function validateRateData(data: unknown): string[] {
  const errs: string[] = [];
  const d = data as RateData;
  if (!d || typeof d !== 'object' || !d.sources || typeof d.sources !== 'object') return ['sources missing'];
  const num = (v: unknown) => typeof v === 'number' && Number.isFinite(v);
  for (const [sk, s] of Object.entries(d.sources)) {
    if (typeof s.label !== 'string') errs.push(`${sk}: label`);
    if (!(s.gst_included === null || typeof s.gst_included === 'boolean')) errs.push(`${sk}: gst_included`);
    if (s.cod_rule !== 'max') errs.push(`${sk}: cod_rule`);
    if (s.rto_rule !== 'explicit' && s.rto_rule !== 'mirror_forward') errs.push(`${sk}: rto_rule`);
    if (!s.plans || typeof s.plans !== 'object') { errs.push(`${sk}: plans`); continue; }
    for (const [pk, p] of Object.entries(s.plans)) {
      const at = `${sk}.${pk}`;
      if (typeof p.label !== 'string') errs.push(`${at}: label`);
      if (typeof p.verified !== 'boolean') errs.push(`${at}: verified`);
      if (!Array.isArray(p.services)) { errs.push(`${at}: services`); continue; }
      p.services.forEach((r, i) => {
        const w = `${at}[${i}]`;
        if (typeof r.comparable !== 'boolean') errs.push(`${w}: comparable`);
        if (!num(r.min_weight_kg) || r.min_weight_kg <= 0) errs.push(`${w}: min_weight_kg`);
        if (!Array.isArray(r.base) || r.base.length !== 5 || !r.base.every(num)) errs.push(`${w}: base`);
        if (!num(r.cod_fixed) || !num(r.cod_pct)) errs.push(`${w}: cod`);
        if (r.addl != null && (!Array.isArray(r.addl) || r.addl.length !== 5)) errs.push(`${w}: addl`);
        if (r.addl != null && !num(r.addl_step_kg)) errs.push(`${w}: addl_step_kg`);
        if (r.rto != null && (!Array.isArray(r.rto) || r.rto.length !== 5)) errs.push(`${w}: rto`);
        if (r.comparable && (!r.service || !r.courier)) errs.push(`${w}: comparable row needs service and courier`);
      });
    }
  }
  return errs;
}

// ── Inputs ────────────────────────────────────────────────────────────────────
export interface Profile {
  shipments: number;
  aov: number;
  /** Average weight in kg; ignored when weightMix is given. */
  weight: number;
  /** Optional L, B, H in cm: chargeable = max(actual, volumetric). */
  dims?: [number, number, number] | null;
  /** Optional % per CFG.WEIGHT_BUCKETS (sums to 100). Overrides `weight`. */
  weightMix?: number[] | null;
  zoneMix: number[]; // % A..E, sums to 100
  codPct: number;
  rtoPct: number;
  /** Restrict both sides to this courier (like-for-like). */
  courier?: string | null;
}

export interface CostBreakdown { freight: number; cod: number; rto: number; total: number }
export interface ServiceCost extends CostBreakdown { service: string; courier: string; mode: string | null; perShipment: number }

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const safe = (v: number) => (Number.isFinite(v) ? v : 0);

/** Multiplier that turns a source's list prices into GST-inclusive prices. */
export function gstMultiplier(src: Source): number {
  if (src.gst_included === null || src.gst_included === undefined) {
    throw new DataConfigError(`GST basis for ${src.label} is not set (gst_included is null).`);
  }
  return src.gst_included ? 1 : 1 + CFG.GST_RATE;
}

export function chargeableWeight(actual: number, dims?: [number, number, number] | null): number {
  if (!dims || dims.some(v => !(v > 0))) return actual;
  return Math.max(actual, (dims[0] * dims[1] * dims[2]) / CFG.VOLUMETRIC_DIVISOR);
}

/** Forward price for one shipment of chargeable weight w (kg) to zone z, or null when not computable. */
export function price(s: ServiceRow, w: number, z: number): number | null {
  const base = s.base[z];
  if (!Number.isFinite(base)) return null;
  if (w <= s.min_weight_kg + 1e-9) return base;
  const add = s.addl?.[z];
  if (add == null || !s.addl_step_kg) return null;
  const steps = Math.ceil((w - s.min_weight_kg) / s.addl_step_kg - 1e-9);
  return base + steps * add;
}

/** RTO price: explicit per-zone RTO (plus forward additional-weight charge above the first slab), else forward. */
export function rtoPrice(s: ServiceRow, src: Source, w: number, z: number): number | null {
  if (src.rto_rule === 'explicit' && s.rto && s.rto[z] != null) {
    const r = s.rto[z] as number;
    if (w <= s.min_weight_kg + 1e-9) return r;
    const add = s.addl?.[z];
    if (add == null || !s.addl_step_kg) return null;
    return r + Math.ceil((w - s.min_weight_kg) / s.addl_step_kg - 1e-9) * add;
  }
  return price(s, w, z);
}

/** Weight points priced for the profile: [{ w, share (0..1) }]. */
export function weightPoints(p: Profile): { w: number; share: number }[] {
  if (p.weightMix && p.weightMix.some(v => v > 0)) {
    const total = p.weightMix.reduce((a, b) => a + b, 0) || 1;
    return CFG.WEIGHT_BUCKETS
      .map((b, i) => ({ w: Math.min(b.upper, CFG.MAX_WEIGHT_KG), share: (p.weightMix![i] || 0) / total }))
      .filter(x => x.share > 0)
      .map(x => ({ w: chargeableWeight(x.w, p.dims), share: x.share }));
  }
  return [{ w: chargeableWeight(p.weight, p.dims), share: 1 }];
}

/** Monthly cost of one service for the profile, GST-inclusive. null when not computable for any priced zone/weight. */
export function serviceCost(s: ServiceRow, src: Source, p: Profile): ServiceCost | null {
  if (!s.comparable || !s.service || !s.courier) return null;
  const mult = gstMultiplier(src);
  const zones = p.zoneMix.map(v => v / 100);
  let fwd = 0, ret = 0;
  for (const { w, share } of weightPoints(p)) {
    for (let z = 0; z < 5; z++) {
      if (!(zones[z] > 0)) continue;
      const f = price(s, w, z), r = rtoPrice(s, src, w, z);
      if (f == null || r == null) return null;
      fwd += share * zones[z] * f;
      ret += share * zones[z] * r;
    }
  }
  const N = p.shipments;
  const rtoShare = p.rtoPct / 100;
  const deliveredCod = N * (p.codPct / 100) * (1 - rtoShare);
  const codFee = Math.max(s.cod_fixed, (s.cod_pct / 100) * p.aov);
  const freight = safe(N * fwd * mult);
  const rto = safe(N * rtoShare * ret * mult);
  const cod = safe(deliveredCod * codFee * mult);
  const total = freight + rto + cod;
  return { service: s.service, courier: s.courier, mode: s.mode, freight, rto, cod, total, perShipment: N > 0 ? total / N : 0 };
}

export function isPlanSelectable(plan: Plan | undefined, allowUnverified = CFG.ALLOW_UNVERIFIED_PLANS): boolean {
  return !!plan && (plan.verified || allowUnverified) && plan.services.some(s => s.comparable);
}

/** Every eligible service on a plan for the profile, cheapest first. */
export function rankServices(data: RateData, sourceKey: string, planKey: string, p: Profile, allowUnverified = CFG.ALLOW_UNVERIFIED_PLANS): ServiceCost[] {
  const src = data.sources[sourceKey];
  const plan = src?.plans[planKey];
  if (!src || !isPlanSelectable(plan, allowUnverified)) return [];
  const out: ServiceCost[] = [];
  for (const s of plan!.services) {
    if (p.courier && s.courier !== p.courier) continue;
    const c = serviceCost(s, src, p);
    if (c) out.push(c);
  }
  return out.sort((a, b) => a.total - b.total);
}

/** Providers (other than QuickPost) that have at least one selectable plan with comparable services. */
export function comparableProviders(data: RateData, allowUnverified = CFG.ALLOW_UNVERIFIED_PLANS) {
  return Object.entries(data.sources)
    .filter(([k]) => k !== 'quickpost')
    .map(([k, s]) => ({ key: k, label: s.label, plans: Object.entries(s.plans).filter(([, p]) => isPlanSelectable(p, allowUnverified)).map(([pk, p]) => ({ key: pk, label: p.label })) }))
    .filter(x => x.plans.length > 0);
}

export function selectablePlans(data: RateData, sourceKey: string, allowUnverified = CFG.ALLOW_UNVERIFIED_PLANS) {
  const src = data.sources[sourceKey];
  if (!src) return [];
  return Object.entries(src.plans).filter(([, p]) => isPlanSelectable(p, allowUnverified)).map(([k, p]) => ({ key: k, label: p.label }));
}

/** Lowest cost per shipment across every selectable plan of every source, for the same profile. */
export function lowestPerShipment(data: RateData, p: Profile): number | null {
  let best: number | null = null;
  for (const sk of Object.keys(data.sources)) {
    for (const { key } of selectablePlans(data, sk)) {
      const top = rankServices(data, sk, key, p)[0];
      if (top && (best == null || top.perShipment < best)) best = top.perShipment;
    }
  }
  return best;
}

/** QuickPost plan to preselect: the seller's own when selectable, else the cheapest selectable one. */
export function defaultQuickPostPlan(data: RateData, sellerPlan: string | null | undefined, p?: Profile | null): { key: string | null; ownUnavailable: boolean } {
  const plans = selectablePlans(data, 'quickpost');
  if (!plans.length) return { key: null, ownUnavailable: !!sellerPlan };
  const own = sellerPlan ? plans.find(x => x.key === sellerPlan.toLowerCase() || x.label.toLowerCase() === sellerPlan.toLowerCase()) : undefined;
  if (own) return { key: own.key, ownUnavailable: false };
  let cheapest = plans[0].key;
  if (p) {
    try {
      let best = Infinity;
      for (const pl of plans) {
        const t = rankServices(data, 'quickpost', pl.key, p)[0];
        if (t && t.total < best) { best = t.total; cheapest = pl.key; }
      }
    } catch { /* GST not set: keep the first plan */ }
  }
  return { key: cheapest, ownUnavailable: !!sellerPlan };
}

// ── Comparison ────────────────────────────────────────────────────────────────
export interface CompareInput {
  profile: Profile;
  /** A source key, 'other' (freight cost typed in) or 'auto' (provider not shared: uses statedMonthlyCost). */
  provider: string | 'other' | 'auto';
  providerPlan?: string | null;
  /** What the seller pays now per month, all-in (₹). Required for 'auto'. */
  statedMonthlyCost?: number | null;
  /** Provider 'other': current freight cost per shipment (₹). */
  otherFreightPerShipment?: number | null;
  quickpostPlan: string;
  remittanceDays?: number | null;
  disputePct?: number | null;
}

export interface CompareResult {
  current: { label: string; breakdown: CostBreakdown; perShipment: number; freightOnly: boolean; totalOnly: boolean; predicted: PredictedProvider | null; top: ServiceCost[] };
  /** Seller's stated monthly spend, when given. */
  stated: number | null;
  /** Provider not shared: likely plan per provider by volume, plus the "other provider" assumption. */
  estimates: ProviderEstimate[];
  quickpost: { label: string; breakdown: CostBreakdown; perShipment: number; top: ServiceCost[] };
  diffMonth: number;
  diffYear: number;
  diffPct: number;
  /** Same courier on both sides, QuickPost's top services first. */
  courierRows: { courier: string; service: string; qpPerShipment: number; qpTotal: number; currentPerShipment: number | null; currentTotal: number | null }[];
  capitalCost: { current: number; quickpost: number } | null;
  score: HealthScore;
  rateDates: { source: string; date: string }[];
}

export interface PredictedProvider { source: string; plan: string; label: string; perShipment: number; service: string }

/** Published rate card whose modelled cost per shipment for this profile is closest to what the seller pays. */
export function predictProvider(data: RateData, p: Profile, perShipment: number): PredictedProvider | null {
  let best: PredictedProvider | null = null, gap = Infinity;
  for (const prov of comparableProviders(data)) {
    for (const pl of prov.plans) {
      const top = rankServices(data, prov.key, pl.key, p)[0];
      if (!top) continue;
      const g = Math.abs(top.perShipment - perShipment);
      if (g < gap) { gap = g; best = { source: prov.key, plan: pl.key, label: `${prov.label} ${pl.label}`, perShipment: top.perShipment, service: top.service }; }
    }
  }
  return best;
}

export interface ProviderEstimate {
  key: string; provider: string; plan: string | null; service: string | null;
  perShipment: number; total: number; breakdown: CostBreakdown | null;
  /** 'volume' = plan picked from monthly shipments; 'assumed' = the "other provider" assumption. */
  basis: 'volume' | 'assumed';
  /** Closest to the seller's stated cost (when given), else the lower of the named providers. */
  likely: boolean;
}

/** Provider not shared: likely plan on each named provider by shipment volume, plus an "other provider" estimate. */
export function estimateProviders(data: RateData, p: Profile, statedPerShipment: number | null): ProviderEstimate[] {
  const out: ProviderEstimate[] = [];
  for (const prov of comparableProviders(data)) {
    const tiers = CFG.VOLUME_PLAN_TIERS[prov.key];
    const wanted = tiers?.find(t => p.shipments <= t.upTo)?.plan;
    const plan = prov.plans.find(pl => pl.key === wanted) || prov.plans[prov.plans.length - 1];
    const top = plan ? rankServices(data, prov.key, plan.key, p)[0] : undefined;
    if (!plan || !top) continue;
    out.push({ key: prov.key, provider: prov.label, plan: plan.label, service: top.service, perShipment: top.perShipment, total: top.total,
      breakdown: { freight: top.freight, cod: top.cod, rto: top.rto, total: top.total }, basis: 'volume', likely: false });
  }
  if (!out.length) return out;
  const high = out.reduce((m, e) => (e.total > m.total ? e : m));
  out.push({ key: 'other', provider: 'Other provider', plan: null, service: null, perShipment: high.perShipment * (1 + CFG.OTHER_PROVIDER_MARKUP),
    total: high.total * (1 + CFG.OTHER_PROVIDER_MARKUP), breakdown: null, basis: 'assumed', likely: false });
  const pick = statedPerShipment != null && statedPerShipment > 0
    ? out.reduce((m, e) => (Math.abs(e.perShipment - statedPerShipment) < Math.abs(m.perShipment - statedPerShipment) ? e : m))
    : out.filter(e => e.basis === 'volume').reduce((m, e) => (e.total < m.total ? e : m));
  pick.likely = true;
  return out;
}

export class NoServiceError extends Error {
  constructor() { super('No service on the selected plan can price this weight.'); this.name = 'NoServiceError'; }
}

export function compare(data: RateData, input: CompareInput): CompareResult {
  const p = input.profile;
  const qpSrc = data.sources.quickpost;
  gstMultiplier(qpSrc); // refuse early when the QuickPost GST basis is unknown

  const qpTop = rankServices(data, 'quickpost', input.quickpostPlan, p);
  if (!qpTop.length) throw new NoServiceError();
  const qpBest = qpTop[0];

  let current: CompareResult['current'];
  let rankedSource: { source: string; plan: string } | null = null;
  let estimates: ProviderEstimate[] = [];
  if (input.provider === 'auto') {
    const stated = input.statedMonthlyCost != null && input.statedMonthlyCost > 0 ? input.statedMonthlyCost : null;
    estimates = estimateProviders(data, p, stated != null && p.shipments > 0 ? stated / p.shipments : null);
    const likely = estimates.find(e => e.likely);
    if (!likely) throw new NoServiceError();
    if (likely.key !== 'other') {
      const planKey = Object.entries(data.sources[likely.key].plans).find(([, pl]) => pl.label === likely.plan)?.[0] || '';
      rankedSource = { source: likely.key, plan: planKey };
    }
    if (stated != null) {
      // The seller's own figure is the current cost; the estimates are shown for reference.
      current = { label: 'Your current spend', breakdown: { freight: 0, cod: 0, rto: 0, total: stated }, perShipment: stated / Math.max(p.shipments, 1), freightOnly: false, totalOnly: true, predicted: null, top: [] };
    } else {
      const label = `${likely.provider}${likely.plan ? ` ${likely.plan}` : ''} (estimated)`;
      current = { label, breakdown: likely.breakdown || { freight: 0, cod: 0, rto: 0, total: likely.total }, perShipment: likely.perShipment, freightOnly: false, totalOnly: !likely.breakdown, predicted: null, top: [] };
    }
  } else if (input.provider === 'other') {
    const per = input.otherFreightPerShipment ?? 0;
    const freight = per * p.shipments;
    current = { label: 'Current provider', breakdown: { freight, cod: 0, rto: 0, total: freight }, perShipment: per, freightOnly: true, totalOnly: false, predicted: null, top: [] };
  } else {
    rankedSource = { source: input.provider, plan: input.providerPlan || '' };
    const src = data.sources[input.provider];
    const top = rankServices(data, input.provider, input.providerPlan || '', p);
    if (!top.length) throw new NoServiceError();
    const b = top[0];
    current = {
      label: `${src.label} ${src.plans[input.providerPlan || '']?.label ?? ''}`.trim(),
      breakdown: { freight: b.freight, cod: b.cod, rto: b.rto, total: b.total },
      perShipment: b.perShipment, freightOnly: false, totalOnly: false, predicted: null, top: top.slice(0, 3),
    };
  }

  const qpBreakdown: CostBreakdown = current.freightOnly
    ? { freight: qpBest.freight, cod: qpBest.cod, rto: qpBest.rto, total: qpBest.freight }
    : { freight: qpBest.freight, cod: qpBest.cod, rto: qpBest.rto, total: qpBest.total };
  const qpTotal = qpBreakdown.total;
  const diffMonth = current.breakdown.total - qpTotal;
  const diffPct = current.breakdown.total > 0 ? (diffMonth / current.breakdown.total) * 100 : 0;

  // Same-courier view: QuickPost's cheapest service per courier, against the current provider's cheapest for that courier
  const currentRanked = rankedSource ? rankServices(data, rankedSource.source, rankedSource.plan, p) : [];
  const seen = new Set<string>();
  const courierRows: CompareResult['courierRows'] = [];
  for (const q of qpTop) {
    if (seen.has(q.courier)) continue;
    seen.add(q.courier);
    const c = currentRanked.find(x => x.courier === q.courier);
    courierRows.push({ courier: q.courier, service: q.service, qpPerShipment: q.perShipment, qpTotal: q.total, currentPerShipment: c ? c.perShipment : null, currentTotal: c ? c.total : null });
    if (courierRows.length === 3) break;
  }

  let capitalCost: CompareResult['capitalCost'] = null;
  if (input.remittanceDays != null && CFG.QUICKPOST_REMITTANCE_DAYS != null) {
    const value = p.shipments * (p.codPct / 100) * (1 - p.rtoPct / 100) * p.aov;
    capitalCost = {
      current: value * (input.remittanceDays / 365) * CFG.ANNUAL_COST_OF_CAPITAL,
      quickpost: value * (CFG.QUICKPOST_REMITTANCE_DAYS / 365) * CFG.ANNUAL_COST_OF_CAPITAL,
    };
  }

  const lowest = lowestPerShipment(data, p);
  const score = healthScore({ rtoPct: p.rtoPct, codPct: p.codPct, disputePct: input.disputePct ?? null, remittanceDays: input.remittanceDays ?? null, costRatio: lowest && current.perShipment > 0 ? current.perShipment / lowest : null });

  const rateDates = Object.values(data.sources).map(s => ({ source: s.label, date: s.effective_from || s.captured_on || data.meta.generated_on }));

  return {
    current,
    stated: input.statedMonthlyCost ?? null,
    estimates,
    quickpost: { label: `QuickPost ${qpSrc.plans[input.quickpostPlan].label}`, breakdown: qpBreakdown, perShipment: qpBreakdown.total / Math.max(p.shipments, 1), top: qpTop.slice(0, 3) },
    diffMonth, diffYear: diffMonth * 12, diffPct, courierRows, capitalCost, score, rateDates,
  };
}

// ── Shipping Health Score ─────────────────────────────────────────────────────
export type FactorKey = 'rto' | 'cost' | 'cod' | 'dispute' | 'remittance';
export interface FactorResult { key: FactorKey; label: string; value: string; sub: number; weight: number; sentence: string }
export interface HealthScore { score: number; band: { label: string; tone: 'success' | 'warning' | 'danger' }; factors: FactorResult[]; used: number; total: number; lowest: FactorResult[] }

export function healthScore(x: { rtoPct: number | null; codPct: number | null; disputePct: number | null; remittanceDays: number | null; costRatio: number | null }): HealthScore {
  const S = CFG.SCORE;
  const T = CFG.SCORE_TEMPLATES;
  const lin = (ref: number, span: number, v: number) => clamp((ref - v) / span, 0, 1) * 100;
  const fill = (t: string, value: string | number, good: string | number) => t.replace('{value}', String(value)).replace('{good}', String(good));
  const fmt = (n: number) => (Math.round(n * 10) / 10).toString();

  const all: (FactorResult | null)[] = [
    x.rtoPct == null ? null : { key: 'rto', label: 'RTO', value: `${fmt(x.rtoPct)}%`, sub: lin(S.rto.ref, S.rto.span, x.rtoPct), weight: S.rto.weight, sentence: fill(T.rto, fmt(x.rtoPct), S.rto.goodLevel) },
    x.costRatio == null ? null : { key: 'cost', label: 'Cost efficiency', value: `${fmt(x.costRatio)}× lowest`, sub: clamp(1 - (x.costRatio - 1) / S.cost.span, 0, 1) * 100, weight: S.cost.weight, sentence: fill(T.cost, fmt((x.costRatio - 1) * 100), '') },
    x.codPct == null ? null : { key: 'cod', label: 'COD dependency', value: `${fmt(x.codPct)}%`, sub: lin(S.cod.ref, S.cod.span, x.codPct), weight: S.cod.weight, sentence: fill(T.cod, fmt(x.codPct), S.cod.goodLevel) },
    x.disputePct == null ? null : { key: 'dispute', label: 'Weight disputes', value: `${fmt(x.disputePct)}%`, sub: lin(S.dispute.ref, S.dispute.span, x.disputePct), weight: S.dispute.weight, sentence: fill(T.dispute, fmt(x.disputePct), S.dispute.goodLevel) },
    x.remittanceDays == null ? null : { key: 'remittance', label: 'Remittance cycle', value: `${fmt(x.remittanceDays)} days`, sub: lin(S.remittance.ref, S.remittance.span, x.remittanceDays), weight: S.remittance.weight, sentence: fill(T.remittance, fmt(x.remittanceDays), S.remittance.goodLevel) },
  ];
  const factors = all.filter(Boolean) as FactorResult[];
  const wSum = factors.reduce((a, f) => a + f.weight, 0);
  const score = wSum > 0 ? Math.round(factors.reduce((a, f) => a + f.sub * f.weight, 0) / wSum) : 0;
  const band = S.bands.find(b => score >= b.min) || S.bands[S.bands.length - 1];
  const lowest = [...factors].filter(f => f.sub < 100).sort((a, b) => a.sub - b.sub).slice(0, 2);
  return { score, band: { label: band.label, tone: band.tone }, factors, used: factors.length, total: 5, lowest };
}
