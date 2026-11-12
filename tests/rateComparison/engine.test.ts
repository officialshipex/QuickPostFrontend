/* Rate Comparison engine tests. Run: npm run test:rate-comparison
   (bundled with rolldown, which ships with Vite, and run on Node's built-in test runner — no extra dependency). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import raw from '../../src/pages/admin/rateComparison/data/rate_cards.json';
import {
  validateRateData, rankServices, compare, price, chargeableWeight, healthScore, DataConfigError, isPlanSelectable,
  type RateData, type Profile, type ServiceRow,
} from '../../src/pages/admin/rateComparison/engine';
import { RATE_COMPARISON_CONFIG as CFG } from '../../src/pages/admin/rateComparison/config';

const data = raw as unknown as RateData;
/** Golden fixtures assume a GST-inclusive QuickPost list; set only for these tests. */
const withGst = (v: boolean | null): RateData => ({ ...data, sources: { ...data.sources, quickpost: { ...data.sources.quickpost, gst_included: v } } });
const D = withGst(true);

const profile = (weight: number, extra: Partial<Profile> = {}): Profile => ({
  shipments: 1000, aov: 800, weight, zoneMix: [10, 20, 30, 35, 5], codPct: 60, rtoPct: 25, ...extra,
});
const near = (a: number, b: number, tol = 1) => assert.ok(Math.abs(a - b) <= tol, `${a} vs ${b}`);

test('rate data validates', () => {
  assert.deepEqual(validateRateData(data), []);
});

test('no unverified plan or non-comparable service reaches a result', () => {
  for (const [sk, s] of Object.entries(D.sources)) {
    for (const [pk, p] of Object.entries(s.plans)) {
      const r = rankServices(D, sk, pk, profile(0.5));
      if (!p.verified) assert.equal(r.length, 0, `${sk}.${pk} unverified`);
      const comparableNames = new Set(p.services.filter(x => x.comparable).map(x => x.service));
      r.forEach(x => assert.ok(comparableNames.has(x.service), `${sk}.${pk}: ${x.service}`));
    }
  }
  assert.equal(isPlanSelectable(D.sources.quickpost.plans.bronze), false);
});

const golden: [number, string, string, string, number, number, number, number][] = [
  [0.5, 'quickpost', 'gold', 'Shree Maruti', 32375, 13050, 8094, 53519],
  [0.5, 'quickpost', 'diamond', 'Shree Maruti', 31080, 11700, 7770, 50550],
  [0.5, 'shiprocket', 'lite', 'Xpressbees Surface', 61000, 21600, 15250, 97850],
  [0.5, 'shiprocket', 'basic', 'Xpressbees Surface', 57150, 21150, 14287, 92588],
  [0.5, 'shiprocket', 'advanced', 'Xpressbees Surface', 51300, 20250, 12825, 84375],
  [1.8, 'quickpost', 'gold', 'Shree Maruti 2KG', 68562, 13050, 17141, 98753],
  [1.8, 'shiprocket', 'lite', 'Shadowfax Surface 2kg', 120800, 22095, 30200, 173095],
];
for (const [w, src, plan, svc, freight, cod, rto, total] of golden) {
  test(`golden: ${w} kg ${src} ${plan} → ${svc}`, () => {
    const best = rankServices(D, src, plan, profile(w))[0];
    assert.equal(best.service, svc);
    near(best.freight, freight); near(best.cod, cod); near(best.rto, rto); near(best.total, total);
  });
}

test('golden like-for-like: Delhivery Surface at 0.5 kg', () => {
  near(rankServices(D, 'quickpost', 'gold', profile(0.5, { courier: 'Delhivery' })).find(s => s.service === 'Delhivery Surface')!.total, 56972);
  near(rankServices(D, 'shiprocket', 'lite', profile(0.5, { courier: 'Delhivery' })).find(s => s.service === 'Delhivery Surface')!.total, 106275);
});

test('additional-weight stepping', () => {
  const s = { base: [10, 10, 10, 10, 10], addl: [4, 4, 4, 4, 4], addl_step_kg: 0.5, min_weight_kg: 0.5 } as unknown as ServiceRow;
  assert.equal(price(s, 0.5, 0), 10);
  assert.equal(price(s, 0.51, 0), 14);
  assert.equal(price(s, 1.0, 0), 14);
  assert.equal(price(s, 1.2, 0), 18);
  assert.equal(price({ ...s, addl: null }, 1, 0), null);
});

test('volumetric weight', () => {
  assert.equal(chargeableWeight(0.5, [30, 20, 10]), 1.2);
  assert.equal(chargeableWeight(2, [10, 10, 10]), 2);
});

test('zone mix outside the shares is ignored; zero-share zones are not required', () => {
  const r = rankServices(D, 'quickpost', 'gold', profile(0.5, { zoneMix: [100, 0, 0, 0, 0] }))[0];
  near(r.freight, 1000 * 22.5);
});

test('QuickPost not cheaper is reported as a negative difference, never forced positive', () => {
  // A seller typing a very low current freight should see QuickPost as higher.
  const r = compare(D, { profile: profile(0.5), provider: 'other', otherFreightPerShipment: 5, quickpostPlan: 'gold' });
  assert.ok(r.diffMonth < 0);
});

test('DataConfigError when QuickPost GST basis is null', () => {
  assert.throws(() => compare(withGst(null), { profile: profile(0.5), provider: 'shiprocket', providerPlan: 'lite', quickpostPlan: 'gold' }), DataConfigError);
});

test('ex-GST list is grossed up', () => {
  const a = rankServices(withGst(true), 'quickpost', 'gold', profile(0.5))[0].total;
  const b = rankServices(withGst(false), 'quickpost', 'gold', profile(0.5))[0].total;
  near(b, a * (1 + CFG.GST_RATE), 0.01);
});

test('health score renormalises missing factors and bands', () => {
  const s = healthScore({ rtoPct: 25, codPct: 60, disputePct: null, remittanceDays: null, costRatio: 1 });
  assert.equal(s.used, 3);
  assert.ok(s.score >= 0 && s.score <= 100);
  assert.equal(healthScore({ rtoPct: 5, codPct: 20, disputePct: 1, remittanceDays: 2, costRatio: 1 }).score, 100);
});

test('performance: 1,000,000 shipments under 50 ms', () => {
  const t = performance.now();
  compare(D, { profile: profile(0.5, { shipments: 1_000_000 }), provider: 'shiprocket', providerPlan: 'lite', quickpostPlan: 'gold' });
  assert.ok(performance.now() - t < 50);
});

test('provider not shared: plan is predicted from shipment volume, with an "other provider" estimate', () => {
  const p = profile(0.5); // 1,000 shipments → Shiprocket Advanced, NimbusPost Pro
  const r = compare(D, { profile: p, provider: 'auto', quickpostPlan: 'gold' });
  const sr = r.estimates.find(e => e.key === 'shiprocket')!, nb = r.estimates.find(e => e.key === 'nimbuspost')!, other = r.estimates.find(e => e.key === 'other')!;
  assert.equal(sr.plan, 'Advanced');
  near(sr.total, 84375);
  assert.equal(nb.plan, 'Pro');
  near(other.total, Math.max(sr.total, nb.total) * (1 + CFG.OTHER_PROVIDER_MARKUP));
  assert.equal(r.estimates.filter(e => e.likely).length, 1);
  assert.ok(!r.current.totalOnly); // no stated cost: the likely estimate is the current cost
  // with a stated cost the seller's own figure is used and the closest estimate is flagged
  const r2 = compare(D, { profile: p, provider: 'auto', statedMonthlyCost: 84000, quickpostPlan: 'gold' });
  assert.equal(r2.current.totalOnly, true);
  assert.equal(r2.estimates.find(e => e.likely)!.key, 'shiprocket');
  assert.equal(compare(D, { profile: profile(0.5, { shipments: 60 }), provider: 'auto', quickpostPlan: 'gold' }).estimates.find(e => e.key === 'shiprocket')!.plan, 'Basic');
});
