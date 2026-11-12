/* Rate Comparison — every threshold, preset, reference level and copy template used by the engine and score.
   Nothing numeric lives in a component. */

export const RATE_COMPARISON_CONFIG = {
  /** Lets QA select plans marked verified:false in the rate data. Keep false in production. */
  ALLOW_UNVERIFIED_PLANS: false,
  /** Applied when a source's list prices are ex-GST (gst_included === false). */
  GST_RATE: 0.18,
  /** Volumetric divisor: L × B × H (cm) / divisor = kg. */
  VOLUMETRIC_DIVISOR: 5000,
  /** Heaviest weight bucket (>5 kg) is priced at this weight. */
  MAX_WEIGHT_KG: 30,
  /** Annual cost of capital for the optional COD remittance line. */
  ANNUAL_COST_OF_CAPITAL: 0.18,
  /** QuickPost COD remittance cycle in days after delivery. null until confirmed: the cost-of-capital line stays hidden. */
  QUICKPOST_REMITTANCE_DAYS: null as number | null,
  ZONE_SUM_TOLERANCE: 0.01,

  /** Provider not shared: the plan a seller is most likely on, by monthly shipments (first tier whose `upTo` fits).
      Shiprocket tiers follow its published plan page; its Pro plan is not in the rate data, so high volumes map to
      Advanced. NimbusPost tiers are assumed to follow the same volume steps. */
  VOLUME_PLAN_TIERS: {
    shiprocket: [{ upTo: 5, plan: 'lite' }, { upTo: 100, plan: 'basic' }, { upTo: Infinity, plan: 'advanced' }],
    nimbuspost: [{ upTo: 5, plan: 'starter' }, { upTo: 100, plan: 'essential' }, { upTo: 500, plan: 'growth' }, { upTo: Infinity, plan: 'pro' }],
  } as Record<string, { upTo: number; plan: string }[]>,
  /** "Other provider" estimate = the higher of the predicted provider costs × (1 + this). An assumption, shown as such. */
  OTHER_PROVIDER_MARKUP: 0.1,

  ZONE_PRESETS: {
    pan_india: { label: 'Pan-India', mix: [10, 20, 30, 35, 5] },
    mostly_local: { label: 'Mostly local', mix: [45, 30, 10, 12, 3] },
    metro_heavy: { label: 'Metro-heavy', mix: [15, 15, 50, 17, 3] },
  } as Record<string, { label: string; mix: number[] }>,
  DEFAULT_ZONE_PRESET: 'pan_india',

  /** Weight distribution buckets; each is priced at its upper bound (last one at MAX_WEIGHT_KG). */
  WEIGHT_BUCKETS: [
    { key: 'w05', label: 'Up to 0.5 kg', upper: 0.5 },
    { key: 'w1', label: '0.5 – 1 kg', upper: 1 },
    { key: 'w2', label: '1 – 2 kg', upper: 2 },
    { key: 'w5', label: '2 – 5 kg', upper: 5 },
    { key: 'w5p', label: 'Above 5 kg', upper: 30 },
  ],

  INPUT_LIMITS: {
    shipments: [1, 1_000_000],
    shippingCost: [1, 1_000_000_000],
    aov: [1, 100_000],
    weight: [0.05, 30],
    cod: [0, 100],
    rto: [0, 80],
    dispute: [0, 100],
    remittance: [0, 60],
  } as Record<string, [number, number]>,

  /** Shipping Health Score. Each factor: weight, and sub = clamp((ref - value) / span, 0, 1) × 100. */
  SCORE: {
    rto: { weight: 0.3, ref: 35, span: 30, goodLevel: 5 },
    cost: { weight: 0.3, span: 0.6 },
    cod: { weight: 0.15, ref: 70, span: 50, goodLevel: 20 },
    dispute: { weight: 0.15, ref: 10, span: 9, goodLevel: 1 },
    remittance: { weight: 0.1, ref: 15, span: 13, goodLevel: 2 },
    bands: [
      { min: 80, label: 'Strong', tone: 'success', color: '#00A86B' },
      { min: 60, label: 'Good', tone: 'success', color: '#84CC16' },
      { min: 40, label: 'Needs attention', tone: 'warning', color: '#F59E0B' },
      { min: 0, label: 'Critical', tone: 'danger', color: '#DC2626' },
    ] as { min: number; label: string; tone: 'success' | 'warning' | 'danger'; color: string }[],
  },

  /** Sentences for the two lowest-scoring factors. {value} and {good} are filled in. */
  SCORE_TEMPLATES: {
    rto: 'RTO of {value}% is above the {good}% reference level used for this score.',
    cost: 'Your cost per shipment is {value}% above the lowest rate card in this comparison for the same profile.',
    cod: 'COD makes up {value}% of shipments, above the {good}% reference level used for this score.',
    dispute: 'Weight disputes on {value}% of shipments are above the {good}% reference level used for this score.',
    remittance: 'A {value}-day COD remittance cycle is longer than the {good}-day reference level used for this score.',
  } as Record<string, string>,

  DISCLAIMER:
    'Competitor figures are based on publicly listed rate cards as on {date} and may differ from your negotiated or current rates. Estimates are indicative and not a quotation.',

  STORAGE_KEY: 'qp_rate_comparison_inputs_v2',
};

export type RateComparisonConfig = typeof RATE_COMPARISON_CONFIG;
