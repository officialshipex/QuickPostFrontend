/* QuickPost Cargo (admin) — Rate Card. Cargo prices B2B shipments, so this is the B2B rate card:
   one card per (plan, B2B courier service) holding a zone × zone price-per-kg matrix plus the overhead
   charges (pickup, COD, ROV, ODA, FSC, …), and the Zone Matrix that maps cities / states to those zones.
   Same backend as ShipexFrontend's B2B Rate Card and Zone Matrix screens:
     /b2b/ratecard/{getMeta, getRateCard, createRateCard, updateRateCard/:id, deleteRateCard/:id}
     /b2b/saveRate/createPlanName
     /b2b/zonematrix/{getAll, addLocation, removeLocation, removeZone/:id, search}
   Saving a card also syncs it into every user plan of that name (backend), so sellers on the plan
   get the new rates on their next Ship Now. */
import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Save, Trash2, Plus, X, Search, MapPin, Layers, Loader2, ChevronDown, Upload, Download } from 'lucide-react';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { apiClient } from '../../services/apiClient';
import { TableLoader } from '../../components/ui/TableLoader';
import { Toast } from '../../components/ui/Toast';
import { useToast } from '../../hooks/useToast';

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface CourierAccount { _id: string; courierName: string; courierProvider: string; status?: string; zoneMatrixId?: string }
interface ZoneMatrixInfo { _id: string; name: string; isDefault: boolean; zones: string[] }
interface Meta {
  // each service carries the zone matrix of its courier (absent from a backend that predates zone matrices)
  couriers: { _id: string; name: string; provider?: string; courierType?: string; zoneMatrixId?: string; courierAccountName?: string }[];
  plans: { _id: string; name: string }[];
  zones: string[]; // the Default matrix's zones
  zoneMatrices: ZoneMatrixInfo[];
  courierAccounts: CourierAccount[];
  statuses: string[];
}
interface OverheadField { type?: string; value?: number | string; min?: number | string; delhiOnly?: boolean; places?: string[] }
type Overheads = Record<string, OverheadField>;
/** ROV owner-risk band by invoice value: up to `upto` ₹ (blank = above the previous band) */
interface OwnerSlab { upto: string; value: string; min: string }
/** Package handling by box weight: from kg (included) – to kg (not included; blank = no upper limit), charged per
 *  box as max(box kg × perKg, min) */
interface PkgSlab { from: string; to: string; min: string; perKg: string }
type StoredPkgSlab = { from?: number; to?: number; perKg?: number; min?: number };
const OLD_PKG_KEYS = ['packageHandling0to250', 'packageHandling250to400', 'packageHandling400plus'] as const;
const DEFAULT_PKG_SLABS: PkgSlab[] = [
  { from: '0', to: '250', min: '0', perKg: '0' },
  { from: '250', to: '400', min: '0', perKg: '0' },
  { from: '400', to: '', min: '0', perKg: '0' },
];

// Slabs to show for a stored card: its own, else the three earlier fixed rows (≤250 / 250–400 / ≥400 kg) as slabs
const pkgSlabsOf = (raw: Record<string, unknown>): PkgSlab[] => {
  const saved = Array.isArray(raw.packageHandlingSlabs) ? (raw.packageHandlingSlabs as StoredPkgSlab[]) : [];
  if (saved.length) {
    return saved.map(s => ({ from: String(s.from ?? 0), to: Number(s.to) > 0 ? String(s.to) : '', min: String(s.min ?? 0), perKg: String(s.perKg ?? 0) }));
  }
  return DEFAULT_PKG_SLABS.map((d, i) => {
    const old = (raw[OLD_PKG_KEYS[i]] || {}) as OverheadField;
    const v = Number(old.value || 0), m = Number(old.min || 0);
    // a flat ₹ per box is the same as a minimum with no per-kg rate
    return old.type === 'flat' ? { ...d, perKg: '0', min: String(Math.max(v, m)) } : { ...d, perKg: String(v), min: String(m) };
  });
};

// Same rules the server checks: To above From, only the last slab open-ended, no overlaps
const pkgSlabProblem = (slabs: StoredPkgSlab[]): string | null => {
  const sorted = [...slabs].sort((a, b) => Number(a.from) - Number(b.from));
  for (let i = 0; i < sorted.length; i++) {
    const s = sorted[i], next = sorted[i + 1];
    const name = `${s.from}–${s.to ?? 'above'} kg`;
    if (s.to != null && s.to <= Number(s.from)) return `Package handling slab ${name}: "To" must be more than "From".`;
    if (next && s.to == null) return `Package handling slab ${name}: only the last slab can be left without a "To" weight.`;
    if (next && s.to != null && Number(next.from) < s.to) return `Package handling slabs ${name} and ${next.from}–${next.to ?? 'above'} kg overlap.`;
  }
  return null;
};

const viewPkgSlabs = (slabs: PkgSlab[]) => {
  const charged = slabs.filter(s => Number(s.perKg) > 0 || Number(s.min) > 0);
  if (!charged.length) return 'Not charged';
  return charged.map(s => `${s.from}–${s.to ? `${s.to} kg` : 'above'}: ₹${s.perKg}/kg (min ₹${s.min})`).join(' · ');
};
interface RateCardDoc {
  _id: string;
  rates: { fromZone: string; toZone: string; price: number }[];
  overheadCharges: Overheads;
  status: string;
}
interface ZoneDoc { _id: string; zone: string; locations: { name: string }[] }
interface LocationSuggestion { name: string; label?: string; detail?: string }

/* ─── Overhead charges — same defaults and rows as ShipexFrontend's B2B rate card (src/B2B/RateCard/OverheadCharges.jsx)
   and the backend's defaults (B2B/controller/RateCard/ratecard.controller.js). Each charge has ONE type. ─── */
const DEFAULT_OVERHEADS: Overheads = {
  pickupCharge: { type: 'perKg', value: 0, min: 0 },
  handlingCharge: { type: 'perKg', value: 0, min: 0 },
  codCharges: { type: 'percentage', value: 0, min: 0 },
  fodCharges: { type: 'percentage', value: 0, min: 0 },
  rovOwner: { type: 'percentage', value: 0, min: 70 },
  rovCarrier: { type: 'percentage', value: 0, min: 50 },
  odaCharges: { type: 'perKg', value: 10, min: 1000 },
  fuelCharge: { type: 'percentage', value: 20 },
  docketCharge: { type: 'flat', value: 0 },
  appointmentDelivery: { type: 'perKg', value: 0, min: 0 },
  greenTax: { type: 'perKg', value: 0, min: 0, delhiOnly: true },
  deliveryCharge: { type: 'perKg', value: 0, min: 0, places: [] },
  divisor: { type: 'formula', value: 4500 },
  minimumFreight: { type: 'flat', value: 0 }, // replaced by Min. LR Billing; always saved as 0
  gst: { type: 'percentage', value: 18 },
  // carrier "unit charges" (e.g. Gati) — all 0 = not charged, so older cards price exactly as before
  odaCharges50to150: { type: 'perKg', value: 0, min: 0 },
  odaCharges150plus: { type: 'perKg', value: 0, min: 0 },
  packageHandling0to250: { type: 'perKg', value: 0, min: 0 },
  packageHandling250to400: { type: 'perKg', value: 0, min: 0 },
  packageHandling400plus: { type: 'perKg', value: 0, min: 0 },
  minChargeableWeight: { type: 'flat', value: 0 },
  minimumBilling: { type: 'flat', value: 0 },
  csdDelivery: { type: 'perKg', value: 0, min: 0 },
  floorDelivery: { type: 'perKg', value: 0, min: 0 },
  demurrage: { type: 'perKg', value: 0, min: 0 },
  reattemptCharge: { type: 'perKg', value: 0, min: 0 },
  reattemptFreeCount: { type: 'flat', value: 0 },
};

// Owner-risk bands (Gati): up to ₹10K, up to ₹25K, up to ₹50L, above ₹50L
const DEFAULT_OWNER_SLABS: OwnerSlab[] = [
  { upto: '10000', value: '0', min: '0' },
  { upto: '25000', value: '0', min: '0' },
  { upto: '5000000', value: '0', min: '0' },
  { upto: '', value: '0', min: '0' },
];

/* Row kinds — each charge has ONE type (no type dropdown):
   perKgMin — ₹ per kg of chargeable weight, at least the minimum ₹ (higher is charged; a minimum alone = fixed ₹)
   pctMin   — % of the base named in desc, at least the minimum ₹
   pct      — % only;  flat — ₹;  kg — weight;  count — a number;  plain — calculation rule (divisor) */
type RowKind = 'perKgMin' | 'pctMin' | 'pct' | 'flat' | 'kg' | 'count' | 'plain';
interface OverheadRow { key: string; label: string; desc: string; kind: RowKind; ifApplicable?: boolean }
// the type saved for each kind (the rate engine reads it)
const STORED_TYPE: Record<RowKind, string> = { perKgMin: 'perKg', pctMin: 'percentage', pct: 'percentage', flat: 'flat', kg: 'flat', count: 'flat', plain: 'formula' };
const OVERHEAD_SECTIONS: { title: string; note: string; rows: OverheadRow[]; pkgSlabs?: boolean; ownerSlabs?: boolean }[] = [
  {
    title: 'Per kg / minimum',
    note: '₹ per kg of the chargeable weight, at least the minimum ₹ — the higher is charged. A minimum alone is a fixed charge. 0 = not charged.',
    rows: [
      { key: 'pickupCharge', label: 'FM (Pickup) Charges', desc: 'First-mile pickup', kind: 'perKgMin' },
      { key: 'handlingCharge', label: 'Handling Charges', desc: 'Cargo handling per shipment', kind: 'perKgMin' },
      { key: 'greenTax', label: 'Green Tax', desc: 'Environmental surcharge', kind: 'perKgMin' },
      { key: 'deliveryCharge', label: 'Delivery Charges (specific places)', desc: 'Only for deliveries to the cities / states / zones listed (e.g. NE states)', kind: 'perKgMin' },
      { key: 'appointmentDelivery', label: 'Appointment Delivery', desc: 'Delivery by appointment', kind: 'perKgMin', ifApplicable: true },
      { key: 'csdDelivery', label: 'CSD / Army Delivery', desc: 'Delivery to CSD / army locations', kind: 'perKgMin', ifApplicable: true },
      { key: 'floorDelivery', label: 'Floor Delivery', desc: 'Delivery above ground floor', kind: 'perKgMin', ifApplicable: true },
      { key: 'demurrage', label: 'Demurrage', desc: 'Storage when the consignee delays', kind: 'perKgMin', ifApplicable: true },
      { key: 'reattemptCharge', label: 'Re-attempt Charges', desc: 'Each extra delivery attempt', kind: 'perKgMin', ifApplicable: true },
    ],
    pkgSlabs: true,
  },
  {
    title: 'Fixed',
    note: 'One fixed amount or number each.',
    rows: [
      { key: 'docketCharge', label: 'LR Charges (per LR)', desc: 'Per LR (waybill)', kind: 'flat' },
      { key: 'minimumBilling', label: 'Min. LR Billing', desc: 'Minimum per LR: freight + LR + ROV are topped up to this ₹ (0 = off)', kind: 'flat' },
      { key: 'minChargeableWeight', label: 'Min. Chargeable Weight', desc: '0 = use the service’s minimum weight', kind: 'kg' },
      { key: 'divisor', label: 'Volumetric Divisor', desc: 'Volumetric weight = L × W × H ÷ divisor', kind: 'plain' },
      { key: 'reattemptFreeCount', label: 'Re-attempt Free Count', desc: 'Delivery attempts not charged', kind: 'count' },
    ],
  },
  {
    title: 'Percentage',
    note: 'A % of the base named, at least the minimum ₹ where there is one.',
    rows: [
      { key: 'fuelCharge', label: 'Fuel Surcharge (FSC)', desc: '% of base freight', kind: 'pct' },
      { key: 'codCharges', label: 'COD Charges', desc: '% of invoice value — COD orders only', kind: 'pctMin' },
      { key: 'rovOwner', label: 'Risk Charges — Owner', desc: '% of invoice value; used when no owner-risk slabs are set below', kind: 'pctMin' },
      { key: 'rovCarrier', label: 'Risk Charges — Carrier', desc: '% of invoice value', kind: 'pctMin' },
      { key: 'fodCharges', label: 'To Pay', desc: '% of invoice value — freight collected at destination', kind: 'pctMin', ifApplicable: true },
      { key: 'gst', label: 'GST Rate', desc: 'GST % on the final subtotal', kind: 'pct' },
    ],
    ownerSlabs: true,
  },
];
const ALL_ROWS = OVERHEAD_SECTIONS.flatMap(s => s.rows);
// Rows whose saved TYPE changes the price (the engine computes them by type). A stored card set with another type
// (e.g. pickup saved as "% of freight") is flagged until an admin checks the value — never silently re-priced.
const TYPE_MATTERS = new Set(ALL_ROWS.filter(r => r.kind === 'perKgMin' || (r.kind === 'pct' && r.key === 'fuelCharge') || r.key === 'docketCharge' || r.key === 'rovOwner' || r.key === 'rovCarrier' || r.key === 'fodCharges').map(r => r.key));
const isSetField = (f?: OverheadField) => Boolean(f) && (Number(f?.value || 0) > 0 || Number(f?.min || 0) > 0);
const typeWords = (f: OverheadField) => {
  const v = f.value ?? 0, m = Number(f.min || 0) > 0 ? ` (min ₹${f.min})` : '';
  if (f.type === 'percentage') return `${v}%${m}`;
  if (f.type === 'perKg') return `₹${v} per kg${m}`;
  return `₹${v} flat${m}`;
};
/* ODA by the courier's distance, in admin-set bands: each band = "above From km" up to the next band's From (the first
   band also covers 0 km and an unknown distance); charged max(kg × ₹/kg, minimum). A band at 0 / 0 falls back to the
   charged band below it (backend B2B/utils/b2bRateEngine.js odaSlabRuleFor). */
interface OdaBand { from: string; perKg: string; min: string }
type StoredOdaBand = { from: number; perKg: number; min: number };
const OLD_ODA_KEYS = ['odaCharges', 'odaCharges50to150', 'odaCharges150plus'] as const;
const OLD_ODA_FROM = [0, 50, 150];
const OLD_ODA_LABEL: Record<string, string> = { odaCharges: 'ODA 0–50 km', odaCharges50to150: 'ODA 50–150 km', odaCharges150plus: 'ODA above 150 km' };
const odaBandsCharged = (raw: Record<string, unknown>) =>
  Array.isArray(raw.odaSlabs) && (raw.odaSlabs as StoredOdaBand[]).some(s => Number(s?.perKg) > 0 || Number(s?.min) > 0);
// Bands to show for a stored card: its own, else its three earlier fixed rows (0 / 50 / 150 km) as bands —
// ₹/kg as is; a flat ₹ is the same charge as ₹0/kg with that minimum; a % row is shown as entered (flagged to check)
const odaBandsOf = (raw: Record<string, unknown>): OdaBand[] => {
  const saved = Array.isArray(raw.odaSlabs) ? (raw.odaSlabs as StoredOdaBand[]) : [];
  if (saved.length) return [...saved].sort((a, b) => Number(a.from) - Number(b.from)).map(s => ({ from: String(s.from ?? 0), perKg: String(s.perKg ?? 0), min: String(s.min ?? 0) }));
  return OLD_ODA_KEYS.map((k, i) => {
    const o = (raw[k] || {}) as OverheadField;
    const v = Number(o.value || 0), m = Number(o.min || 0);
    return o.type === 'flat'
      ? { from: String(OLD_ODA_FROM[i]), perKg: '0', min: String(Math.max(v, m)) }
      : { from: String(OLD_ODA_FROM[i]), perKg: String(v), min: String(m) };
  });
};
const odaBandProblem = (bands: StoredOdaBand[]): string | null => {
  if (bands.some(b => b.from < 0)) return 'ODA distance bands: a band cannot start below 0 km.';
  const froms = bands.map(b => b.from).sort((a, b) => a - b);
  for (let i = 1; i < froms.length; i++) if (froms[i] === froms[i - 1]) return `ODA distance bands: two bands start at ${froms[i]} km.`;
  return null;
};
// "0–50 km" / "150+ km" for each band, by the next band's From
const odaRangeOf = (bands: OdaBand[], i: number) => {
  const sorted = bands.map((b, j) => ({ ...b, j })).filter(b => b.from.trim() !== '').sort((a, b) => Number(a.from) - Number(b.from));
  const at = sorted.findIndex(b => b.j === i);
  if (at < 0) return '';
  const next = sorted[at + 1];
  return `${Number(sorted[at].from)}${next ? `–${Number(next.from)}` : '+'} km`;
};
const viewOdaBands = (bands: OdaBand[]) => {
  const charged = bands.map((b, i) => ({ b, i })).filter(({ b }) => Number(b.perKg) > 0 || Number(b.min) > 0);
  if (!charged.length) return 'Not charged';
  return charged.map(({ b, i }) => `${odaRangeOf(bands, i)}: ₹${b.perKg}/kg (min ₹${b.min})`).join(' · ');
};

/** keys of a loaded card whose saved type is not the row's type, while that charge is set */
const typeMismatchesOf = (oh: Overheads, bandsCharged = odaBandsCharged(oh as Record<string, unknown>)): string[] => [
  ...ALL_ROWS.filter(r => TYPE_MATTERS.has(r.key)).filter(r => {
    const f = oh[r.key];
    return isSetField(f) && Boolean(f?.type) && f?.type !== STORED_TYPE[r.kind];
  }).map(r => r.key),
  // ODA rows saved as "% of freight" can't become ₹/kg by themselves (₹/kg and flat convert exactly)
  ...(bandsCharged ? [] : OLD_ODA_KEYS.filter(k => isSetField(oh[k]) && oh[k]?.type === 'percentage')),
];

const viewSlabs = (slabs: OwnerSlab[]) => {
  const set = slabs.filter(s => Number(s.value) > 0 || Number(s.min) > 0);
  if (!set.length) return 'Not set — ROV Owner Risk row applies';
  return set.map(s => `${s.upto ? `≤ ₹${Number(s.upto).toLocaleString('en-IN')}` : 'Above'}: ${s.value}% (min ₹${s.min})`).join(' · ');
};

const cellKey = (from: string, to: string) => `${from}|${to}`;
const toNumber = (v: unknown) => (v === '' || v == null ? 0 : Number(v) || 0);

const selectCls = 'h-10 pl-4 pr-9 bg-white border border-[#E2E8F0] rounded-full text-[13px] font-medium text-[#0F172A] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B] appearance-none disabled:bg-[#F8FAFC] disabled:text-[#94A3B8]';
const inputCls = 'h-10 px-4 bg-white border border-[#E2E8F0] rounded-full text-[13px] font-medium text-[#0F172A] placeholder:text-[#94A3B8] placeholder:font-normal focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]';
const btnPrimary = 'h-10 px-5 rounded-full bg-[#00A86B] hover:bg-[#009B63] text-white text-[13px] font-bold inline-flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-60';
const btnGhost = 'h-10 px-5 rounded-full border border-[#E2E8F0] bg-white text-[#475569] text-[13px] font-bold inline-flex items-center gap-1.5 hover:bg-[#F8FAFC] transition-colors disabled:opacity-60';

function Select({ value, onChange, options, disabled, label }: {
  value: string; onChange: (v: string) => void; options: { label: string; value: string }[]; disabled?: boolean; label: string;
}) {
  return (
    <div className="relative">
      <select aria-label={label} value={value} disabled={disabled} onChange={e => onChange(e.target.value)} className={selectCls}>
        {options.length === 0 && <option value="">No {label.toLowerCase()}</option>}
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown className="w-4 h-4 text-[#94A3B8] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  );
}

function ConfirmDialog({ title, body, confirmLabel, busy, onConfirm, onClose }: {
  title: string; body: string; confirmLabel: string; busy: boolean; onConfirm: () => void; onClose: () => void;
}) {
  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => !busy && onClose()} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <h3 className="text-[15px] font-bold text-[#0F172A]">{title}</h3>
        <p className="text-[13px] text-[#64748B] mt-2 leading-relaxed">{body}</p>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} disabled={busy} className={`${btnGhost} flex-1 justify-center`}>Cancel</button>
          <button onClick={onConfirm} disabled={busy}
            className="flex-1 h-10 rounded-full bg-red-600 hover:bg-red-700 text-white text-[13px] font-bold inline-flex items-center justify-center gap-1.5 disabled:opacity-60">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ─── Upload rates (Excel) — zone prices only; overhead charges stay as set on this screen ─── */
interface UploadResult { row: number; status: 'success' | 'skipped' | 'failed'; message: string }
function UploadRatesModal({ planId, planName, couriers, onClose, onDone }: {
  planId: string; planName: string; couriers: CourierAccount[]; onClose: () => void; onDone: () => void;
}) {
  const [scope, setScope] = useState<'plan' | 'all'>(planId ? 'plan' : 'all');
  // every courier (one sheet per zone matrix) or one courier (its own zone matrix)
  const [courierScope, setCourierScope] = useState<'all' | 'one'>('all');
  const [courierId, setCourierId] = useState(couriers[0]?._id || '');
  const courierName = couriers.find(c => c._id === courierId)?.courierName || '';
  const [file, setFile] = useState<File | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [outcome, setOutcome] = useState<{ ok: boolean; message: string; errors: string[]; results: UploadResult[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const readBlobError = async (err: any, fallback: string) => {
    const data = err?.response?.data;
    if (data instanceof Blob) { try { return JSON.parse(await data.text())?.message || fallback; } catch { return fallback; } }
    return data?.message || fallback;
  };

  const download = async () => {
    setDownloading(true);
    try {
      const params: Record<string, string> = {};
      if (scope === 'plan' && planId) params.planId = planId;
      if (courierScope === 'one' && courierId) params.courierId = courierId;
      const res = await apiClient.get('/b2b/ratecard/uploadTemplate', { params, responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `b2b-ratecard-${scope === 'plan' && planName ? planName : 'all-plans'}${courierScope === 'one' && courierName ? `-${courierName}` : ''}.xlsx`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setOutcome({ ok: false, message: await readBlobError(err, 'Could not download the sample file'), errors: [], results: [] });
    } finally { setDownloading(false); }
  };

  const upload = async () => {
    if (!file) return;
    setUploading(true); setOutcome(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await apiClient.post('/b2b/ratecard/uploadRates', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      const d = res.data || {};
      setOutcome({ ok: !!d.success, message: d.message || '', errors: d.errors || [], results: d.results || [] });
      if (d.success || (d.created || 0) + (d.updated || 0) > 0) onDone();
    } catch (err: any) {
      setOutcome({ ok: false, message: err?.response?.data?.message || 'Upload failed', errors: err?.response?.data?.errors || [], results: [] });
    } finally { setUploading(false); }
  };

  const tone = (s: UploadResult['status']) => s === 'success' ? 'text-[#00A86B]' : s === 'failed' ? 'text-red-600' : 'text-[#64748B]';

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => !uploading && onClose()} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <h3 className="text-[15px] font-bold text-[#0F172A]">Upload B2B Rates</h3>
          <button onClick={() => !uploading && onClose()} className="w-7 h-7 rounded-full flex items-center justify-center text-[#94A3B8] hover:bg-[#F8FAFC]" aria-label="Close"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-6 pb-5 overflow-y-auto space-y-4">
          <p className="text-[12px] text-[#64748B] leading-relaxed">
            Only the zone prices (per kg, from zone → to zone) are uploaded. <span className="font-semibold text-[#0F172A]">Overhead charges are not changed</span> — set them on this screen with Edit. A new rate card created by the upload starts with the standard overhead charges.
          </p>

          <div className="rounded-xl border border-[#E2E8F0] p-3.5 space-y-2.5">
            <p className="text-[12px] font-bold text-[#0F172A]">1. Download the sample file</p>
            <div className="flex flex-wrap gap-4">
              {planId && (
                <label className="flex items-center gap-1.5 text-[12px] font-semibold text-[#475569] cursor-pointer">
                  <input type="radio" checked={scope === 'plan'} onChange={() => setScope('plan')} className="accent-[#00A86B]" /> {planName || 'Selected plan'}
                </label>
              )}
              <label className="flex items-center gap-1.5 text-[12px] font-semibold text-[#475569] cursor-pointer">
                <input type="radio" checked={scope === 'all'} onChange={() => setScope('all')} className="accent-[#00A86B]" /> All plans
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <label className="flex items-center gap-1.5 text-[12px] font-semibold text-[#475569] cursor-pointer">
                <input type="radio" checked={courierScope === 'all'} onChange={() => setCourierScope('all')} className="accent-[#00A86B]" /> All couriers
              </label>
              <label className={`flex items-center gap-1.5 text-[12px] font-semibold cursor-pointer ${couriers.length ? 'text-[#475569]' : 'text-[#CBD5E1] cursor-not-allowed'}`}>
                <input type="radio" disabled={!couriers.length} checked={courierScope === 'one'} onChange={() => setCourierScope('one')} className="accent-[#00A86B]" /> Courier-wise
              </label>
              {courierScope === 'one' && (
                <Select label="Courier" value={courierId} onChange={setCourierId}
                  options={couriers.map(c => ({ label: c.courierName === c.courierProvider ? c.courierName : `${c.courierName} (${c.courierProvider})`, value: c._id }))} />
              )}
            </div>
            <p className="text-[11px] text-[#94A3B8]">
              {courierScope === 'one'
                ? `The file has ${courierName || 'this courier'}'s services with the zones of its own zone matrix.`
                : 'Each courier uses its own zone matrix, so the file has one sheet per zone matrix.'}{' '}
              Current prices are already filled in — change only what you need. Blank or 0 = lane not offered.
            </p>
            <button onClick={download} disabled={downloading} className={btnGhost}>
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Download sample
            </button>
          </div>

          <div className="rounded-xl border border-[#E2E8F0] p-3.5 space-y-2.5">
            <p className="text-[12px] font-bold text-[#0F172A]">2. Upload the filled file (.xlsx)</p>
            <input ref={fileRef} type="file" accept=".xlsx" className="hidden"
              onChange={e => { setFile(e.target.files?.[0] || null); setOutcome(null); }} />
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => fileRef.current?.click()} disabled={uploading} className={btnGhost}>Choose file</button>
              <span className="text-[12px] text-[#475569] truncate max-w-[220px]">{file ? file.name : 'No file chosen'}</span>
            </div>
            <button onClick={upload} disabled={!file || uploading} className={btnPrimary}>
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Upload
            </button>
          </div>

          {outcome && (
            <div className={`rounded-xl border p-3.5 ${outcome.ok ? 'border-[#BBF7D0] bg-[#F0FDF4]' : 'border-red-200 bg-red-50'}`}>
              <p className={`text-[12.5px] font-bold ${outcome.ok ? 'text-[#00A86B]' : 'text-red-600'}`}>{outcome.message}</p>
              {outcome.errors.length > 0 && (
                <ul className="mt-2 space-y-1 max-h-48 overflow-y-auto text-[11.5px] text-red-700 list-disc pl-4">
                  {outcome.errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              )}
              {outcome.errors.length === 0 && outcome.results.length > 0 && (
                <ul className="mt-2 space-y-1 max-h-48 overflow-y-auto text-[11.5px]">
                  {outcome.results.map((r, i) => <li key={i} className={tone(r.status)}>{r.message}</li>)}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ═══════════════════════════════ Rate Card tab ═══════════════════════════════ */
function RateCardTab({ showToast }: { showToast: (t: 'success' | 'error' | 'info', m: string) => void }) {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [metaError, setMetaError] = useState('');
  const [planId, setPlanId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [card, setCard] = useState<RateCardDoc | null>(null);
  const [mode, setMode] = useState<'view' | 'edit' | 'create'>('view');
  const [status, setStatus] = useState('active');
  const [matrix, setMatrix] = useState<Record<string, string>>({});
  const [overheads, setOverheads] = useState<Overheads>(DEFAULT_OVERHEADS);
  const [ownerSlabs, setOwnerSlabs] = useState<OwnerSlab[]>(DEFAULT_OWNER_SLABS);
  const [pkgSlabs, setPkgSlabs] = useState<PkgSlab[]>(DEFAULT_PKG_SLABS);
  const [odaBands, setOdaBands] = useState<OdaBand[]>(() => odaBandsOf(DEFAULT_OVERHEADS as Record<string, unknown>));
  const [legacyMinFreight, setLegacyMinFreight] = useState(0); // the card's old Minimum Freight, until saved
  // charges this card saved with another type than their row's (shown as they were saved, until checked)
  const [savedAs, setSavedAs] = useState<Record<string, OverheadField>>({});
  const [checkedTypes, setCheckedTypes] = useState<string[]>([]);
  // delivery charge places as typed (comma-separated); split into a list when saving
  const [placesText, setPlacesText] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [addingPlan, setAddingPlan] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  // the zones of the selected service's courier zone matrix (each courier may use its own)
  const selectedService = meta?.couriers.find(c => c._id === serviceId);
  const serviceMatrix = meta?.zoneMatrices.find(z => z._id === selectedService?.zoneMatrixId);
  const zones = serviceMatrix ? serviceMatrix.zones : (meta?.zones || []);

  const loadMeta = async (selectPlanName?: string) => {
    try {
      const res = await apiClient.get('/b2b/ratecard/getMeta');
      const m: Meta = {
        couriers: res.data?.couriers || [],
        plans: res.data?.plans || [],
        zones: res.data?.zones || [],
        zoneMatrices: res.data?.zoneMatrices || [],
        courierAccounts: res.data?.courierAccounts || [],
        statuses: res.data?.statuses || ['active', 'inactive'],
      };
      setMeta(m);
      setMetaError('');
      setServiceId(prev => (m.couriers.some(c => c._id === prev) ? prev : m.couriers[0]?._id || ''));
      setPlanId(prev => {
        const named = selectPlanName && m.plans.find(p => p.name === selectPlanName);
        if (named) return named._id;
        if (m.plans.some(p => p._id === prev)) return prev;
        return (m.plans.find(p => p.name === 'Bronze') || m.plans[0])?._id || '';
      });
    } catch (err: any) {
      setMetaError(err?.response?.data?.message || 'Failed to load rate card setup');
    }
  };

  useEffect(() => { loadMeta(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const applyCard = (doc: RateCardDoc | null) => {
    setCard(doc);
    const next: Record<string, string> = {};
    (doc?.rates || []).forEach(r => { next[cellKey(r.fromZone, r.toZone)] = r.price != null ? String(r.price) : ''; });
    setMatrix(next);
    // owner-risk slabs are an array, kept apart from the { type, value, min } rows
    const raw: Record<string, unknown> = { ...(doc?.overheadCharges || {}) };
    const savedSlabs = Array.isArray(raw.rovOwnerSlabs) ? (raw.rovOwnerSlabs as { upto?: number; value?: number; min?: number }[]) : [];
    delete raw.rovOwnerSlabs;
    setPkgSlabs(pkgSlabsOf(raw));
    delete raw.packageHandlingSlabs;
    // ODA distance bands are an array too (shown as its own table)
    const hadOdaBands = odaBandsCharged(raw);
    setOdaBands(odaBandsOf(raw));
    delete raw.odaSlabs;
    // Minimum Freight is no longer on the screen: a card that still has one shows it as its Min. LR Billing
    // (when that is not set) and saving moves it there for good
    const loaded: Overheads = { ...DEFAULT_OVERHEADS, ...(raw as Overheads) };
    const oldMinFreight = Number(loaded.minimumFreight?.value || 0);
    setLegacyMinFreight(oldMinFreight);
    if (oldMinFreight > 0 && !(Number(loaded.minimumBilling?.value || 0) > 0)) {
      loaded.minimumBilling = { type: 'flat', ...(loaded.minimumBilling || {}), value: oldMinFreight };
    }
    setOverheads(loaded);
    // a charge saved with another type than its row's is kept as saved (it prices that way until this card is saved)
    // and flagged for the admin to check
    setSavedAs(Object.fromEntries(typeMismatchesOf(loaded, hadOdaBands).map(k => [k, { ...loaded[k] }])));
    setCheckedTypes([]);
    setPlacesText((Array.isArray(loaded.deliveryCharge?.places) ? loaded.deliveryCharge!.places! : []).join(', '));
    // always at least 4 rows, so a band can be added back later (blank rows are ignored on save)
    const shown = savedSlabs.length
      ? savedSlabs.map(s => ({ upto: s.upto ? String(s.upto) : '', value: String(s.value ?? 0), min: String(s.min ?? 0) }))
      : DEFAULT_OWNER_SLABS.map(s => ({ ...s }));
    while (shown.length < DEFAULT_OWNER_SLABS.length) shown.push({ upto: '', value: '0', min: '0' });
    setOwnerSlabs(shown);
    setStatus(doc?.status || 'active');
    setMode(doc ? 'view' : 'create');
  };

  const loadCard = async () => {
    if (!planId || !serviceId) { applyCard(null); return; }
    setLoading(true);
    try {
      const res = await apiClient.get('/b2b/ratecard/getRateCard', { params: { courierId: serviceId, planId } });
      applyCard(res.data && res.data._id ? res.data : null);
    } catch {
      showToast('error', 'Failed to load rate card');
      applyCard(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (meta) loadCard(); }, [planId, serviceId, meta]); // eslint-disable-line react-hooks/exhaustive-deps

  const editing = mode !== 'view';

  const handleSave = async () => {
    const rates = zones.flatMap(from => zones.map(to => ({ fromZone: from, toZone: to, price: toNumber(matrix[cellKey(from, to)]) })));
    const overheadCharges: Record<string, unknown> = Object.fromEntries(Object.entries(overheads).map(([k, f]) => [k, {
      ...f,
      ...(f.value !== undefined ? { value: toNumber(f.value) } : {}),
      ...(f.min !== undefined ? { min: toNumber(f.min) } : {}),
    }]));
    // a charge saved with another type must be checked first: saving re-prices it with its row's type
    const unchecked = Object.keys(savedAs).filter(k => !checkedTypes.includes(k));
    if (unchecked.length) {
      const names = unchecked.map(k => ALL_ROWS.find(r => r.key === k)?.label || OLD_ODA_LABEL[k] || k).join(', ');
      showToast('error', `Check these charges first (they were saved with another type): ${names}. Tick "Checked" on each.`);
      return;
    }
    // every row is saved with its own type (one type per charge)
    for (const row of ALL_ROWS) {
      const f = (overheadCharges[row.key] || {}) as OverheadField;
      overheadCharges[row.key] = { ...f, type: STORED_TYPE[row.kind] };
    }
    // delivery charge: only for the places listed; a charge with no place would never apply
    const places = placesText.split(',').map(p => p.trim()).filter(Boolean);
    overheadCharges.deliveryCharge = { ...(overheadCharges.deliveryCharge as OverheadField), places };
    if (isSetField(overheadCharges.deliveryCharge as OverheadField) && !places.length) {
      showToast('error', 'Delivery Charges: add at least one city, state or zone it applies to (or set it to 0).');
      return;
    }
    // only bands with a % or a minimum are kept; none = the single ROV Owner Risk row applies
    overheadCharges.rovOwnerSlabs = ownerSlabs
      .filter(s => toNumber(s.value) > 0 || toNumber(s.min) > 0)
      .map(s => ({ ...(toNumber(s.upto) > 0 ? { upto: toNumber(s.upto) } : {}), value: toNumber(s.value), min: toNumber(s.min) }));
    // package handling = the slab table only (fully blank rows dropped); the three earlier fixed rows are cleared
    // so they can never apply alongside the slabs
    const slabs: StoredPkgSlab[] = pkgSlabs
      .filter(s => s.from.trim() !== '' || s.to.trim() !== '' || toNumber(s.perKg) > 0 || toNumber(s.min) > 0)
      .map(s => ({ from: toNumber(s.from), ...(toNumber(s.to) > 0 ? { to: toNumber(s.to) } : {}), perKg: toNumber(s.perKg), min: toNumber(s.min) }))
      .sort((a, b) => Number(a.from) - Number(b.from));
    const problem = pkgSlabProblem(slabs);
    if (problem) { showToast('error', problem); return; }
    overheadCharges.packageHandlingSlabs = slabs;
    for (const k of OLD_PKG_KEYS) overheadCharges[k] = { type: 'perKg', value: 0, min: 0 };
    // ODA = the distance bands only (fully blank rows dropped); the three earlier fixed rows are cleared so they can
    // never apply alongside the bands
    const bands: StoredOdaBand[] = odaBands
      .filter(b => b.from.trim() !== '' || toNumber(b.perKg) > 0 || toNumber(b.min) > 0)
      .map(b => ({ from: toNumber(b.from), perKg: toNumber(b.perKg), min: toNumber(b.min) }))
      .sort((a, b) => a.from - b.from);
    const odaProblem = odaBandProblem(bands);
    if (odaProblem) { showToast('error', odaProblem); return; }
    overheadCharges.odaSlabs = bands;
    for (const k of OLD_ODA_KEYS) overheadCharges[k] = { type: 'perKg', value: 0, min: 0 };
    // one minimum only: Min. LR Billing (the old Minimum Freight was moved into it when the card was opened)
    overheadCharges.minimumFreight = { type: 'flat', value: 0 };
    setSaving(true);
    try {
      if (mode === 'create') {
        await apiClient.post('/b2b/ratecard/createRateCard', { courierService: serviceId, plan: planId, rates, overheadCharges, status });
        showToast('success', 'Rate card created');
      } else if (card) {
        await apiClient.put(`/b2b/ratecard/updateRateCard/${card._id}`, { rates, overheadCharges, status });
        showToast('success', 'Rate card updated');
      }
      await loadCard();
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Failed to save rate card');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!card) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/b2b/ratecard/deleteRateCard/${card._id}`);
      showToast('success', 'Rate card deleted');
      setConfirmDelete(false);
      applyCard(null);
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Failed to delete rate card');
    } finally {
      setDeleting(false);
    }
  };

  const handleAddPlan = async () => {
    const name = newPlanName.trim();
    if (!name) return;
    setAddingPlan(true);
    try {
      await apiClient.post('/b2b/saveRate/createPlanName', { planName: name });
      showToast('success', `Plan "${name}" created`);
      setShowAddPlan(false);
      setNewPlanName('');
      await loadMeta(name);
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Failed to create plan');
    } finally {
      setAddingPlan(false);
    }
  };

  const setOverhead = (key: string, field: 'value' | 'min', v: string) => {
    if (!/^\d*\.?\d*$/.test(v)) return;
    setOverheads(prev => ({ ...prev, [key]: { ...(prev[key] || {}), [field]: v } }));
  };
  const setDelhiOnly = (on: boolean) =>
    setOverheads(prev => ({ ...prev, greenTax: { ...(prev.greenTax || {}), delhiOnly: on } }));
  const setSlab = (i: number, field: keyof OwnerSlab, v: string) => {
    if (!/^\d*\.?\d*$/.test(v)) return;
    setOwnerSlabs(prev => prev.map((s, j) => (j === i ? { ...s, [field]: v } : s)));
  };
  const setPkgSlab = (i: number, field: keyof PkgSlab, v: string) => {
    if (!/^\d*\.?\d*$/.test(v)) return;
    setPkgSlabs(prev => prev.map((s, j) => (j === i ? { ...s, [field]: v } : s)));
  };
  // a new slab starts where the last one ends
  const addPkgSlab = () => setPkgSlabs(prev => {
    const last = prev[prev.length - 1];
    return [...prev, { from: last?.to || '', to: '', min: '0', perKg: '0' }];
  });
  const removePkgSlab = (i: number) => setPkgSlabs(prev => prev.filter((_, j) => j !== i));
  const setOdaBand = (i: number, field: keyof OdaBand, v: string) => {
    if (!/^\d*\.?\d*$/.test(v)) return;
    setOdaBands(prev => prev.map((b, j) => (j === i ? { ...b, [field]: v } : b)));
  };
  // a new band starts 50 km after the highest one
  const addOdaBand = () => setOdaBands(prev => {
    const top = Math.max(0, ...prev.map(b => toNumber(b.from)));
    return [...prev, { from: String(prev.length ? top + 50 : 0), perKg: '0', min: '0' }];
  });
  const removeOdaBand = (i: number) => setOdaBands(prev => prev.filter((_, j) => j !== i));

  const planName = meta?.plans.find(p => p._id === planId)?.name || '';
  const serviceName = meta?.couriers.find(c => c._id === serviceId)?.name || '';

  if (!meta) {
    return (
      <div className="relative flex-1 min-h-[300px]">
        {metaError ? <p className="m-6 text-[13px] text-red-500">{metaError}</p> : <TableLoader />}
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      {/* Selectors + actions */}
      <div className="px-4 md:px-6 py-3 border-b border-[#CBD5F5] bg-[#F8FAFC]/50 flex flex-wrap items-center gap-2.5">
        <Select label="Plan" value={planId} onChange={setPlanId} options={meta.plans.map(p => ({ label: p.name, value: p._id }))} disabled={editing && mode === 'edit'} />
        <Select label="Courier service" value={serviceId} onChange={setServiceId} options={meta.couriers.map(c => ({ label: c.name, value: c._id }))} disabled={editing && mode === 'edit'} />
        <Select label="Status" value={status} onChange={setStatus} options={meta.statuses.map(s => ({ label: s.charAt(0).toUpperCase() + s.slice(1), value: s }))} disabled={!editing} />
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {mode === 'view' && card && (
            <>
              <button onClick={() => setMode('edit')} className={btnPrimary}><Edit2 className="w-4 h-4" /> Edit</button>
              <button onClick={() => setConfirmDelete(true)} className="h-10 px-5 rounded-full border border-red-200 bg-white text-red-600 text-[13px] font-bold inline-flex items-center gap-1.5 hover:bg-red-50">
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </>
          )}
          {mode === 'edit' && <button onClick={() => applyCard(card)} disabled={saving} className={btnGhost}>Cancel</button>}
          {editing && (
            <button onClick={handleSave} disabled={saving || !planId || !serviceId || zones.length === 0} className={btnPrimary}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {mode === 'create' ? 'Create Rate Card' : 'Save'}
            </button>
          )}
          {!editing || mode === 'create' ? (
            <button onClick={() => setShowUpload(true)} className={btnGhost} title="Upload zone prices from Excel (overhead charges are not changed)">
              <Upload className="w-4 h-4" /> Upload Rates
            </button>
          ) : null}
          <button onClick={() => setShowAddPlan(true)} className={btnGhost}><Plus className="w-4 h-4" /> Add Plan</button>
        </div>
      </div>

      <div className="px-4 md:px-6 py-4 space-y-4 relative">
        {loading && <TableLoader />}

        {meta.couriers.length === 0 && (
          <p className="text-[13px] text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3">
            No enabled B2B courier services yet — add them under Couriers → Courier Services first.
          </p>
        )}
        {zones.length === 0 && (
          <p className="text-[13px] text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3">
            {serviceMatrix
              ? `The zone matrix "${serviceMatrix.name}" of this courier has no zones yet — add zones to it in the Zone Matrix tab first.`
              : 'No zones yet — create zones in the Zone Matrix tab first.'}
          </p>
        )}

        {planId && serviceId && zones.length > 0 && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[14px] font-bold text-[#0F172A]">{planName} · {serviceName}</h2>
              <span className="text-[12px] text-[#64748B]">Price per 1 kg, from zone (row) to zone (column)</span>
              {serviceMatrix && (
                <span className="px-2 py-0.5 rounded-full bg-[#F1F5F9] border border-[#E2E8F0] text-[#475569] text-[11px] font-semibold inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Zones: {serviceMatrix.name}{selectedService?.courierAccountName ? ` (${selectedService.courierAccountName})` : ''}
                </span>
              )}
              {mode === 'create' && <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-semibold">No rate card yet — fill in and create</span>}
            </div>

            {/* Matrix — desktop */}
            <div className="hidden md:block overflow-auto rounded-xl border border-[#E2E8F0] bg-white">
              <table className="min-w-full text-center text-[12px]">
                <thead className="bg-[#E6F9F2]">
                  <tr>
                    <th className="sticky left-0 bg-[#E6F9F2] px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">From \ To</th>
                    {zones.map(z => <th key={z} className="px-2 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">{z}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {zones.map((from, i) => (
                    <tr key={from} className={i % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]'}>
                      <td className={`sticky left-0 px-3 py-2 text-left font-semibold text-[#0F172A] ${i % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]'}`}>{from}</td>
                      {zones.map(to => {
                        const k = cellKey(from, to);
                        return (
                          <td key={to} className="px-1.5 py-1.5">
                            {editing ? (
                              <input inputMode="decimal" value={matrix[k] ?? ''} aria-label={`${from} to ${to}`}
                                onChange={e => { if (/^\d*\.?\d*$/.test(e.target.value)) setMatrix(prev => ({ ...prev, [k]: e.target.value })); }}
                                className="w-16 h-8 px-2 text-center border border-[#E2E8F0] rounded-lg text-[12px] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]" />
                            ) : (
                              <span className="text-[#475569]">{matrix[k] !== undefined && matrix[k] !== '' ? matrix[k] : '—'}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Matrix — mobile */}
            <div className="md:hidden space-y-2">
              {zones.map(from => (
                <div key={from} className="bg-white rounded-2xl border border-[#E2E8F0] p-3">
                  <p className="text-[12px] font-bold text-[#0F172A] mb-2">From {from}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {zones.map(to => {
                      const k = cellKey(from, to);
                      return (
                        <div key={to} className="flex items-center justify-between gap-2 border border-[#F1F5F9] rounded-lg px-2.5 py-1.5">
                          <span className="text-[11px] text-[#64748B]">To {to}</span>
                          {editing ? (
                            <input inputMode="decimal" value={matrix[k] ?? ''} aria-label={`${from} to ${to}`}
                              onChange={e => { if (/^\d*\.?\d*$/.test(e.target.value)) setMatrix(prev => ({ ...prev, [k]: e.target.value })); }}
                              className="w-14 h-7 px-1.5 text-center border border-[#E2E8F0] rounded-md text-[12px] focus:outline-none focus:border-[#00A86B]" />
                          ) : (
                            <span className="text-[12px] font-semibold text-[#0F172A]">{matrix[k] !== undefined && matrix[k] !== '' ? matrix[k] : '—'}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Overhead charges — grouped rate table */}
            {(() => {
              // Rows come from OVERHEAD_SECTIONS (one table group per section); each row has ONE type (its kind).
              const TYPE: Record<RowKind, { label: string; cls: string }> = {
                perKgMin: { label: '₹/kg · Min ₹', cls: 'bg-sky-50 text-sky-700' },
                pctMin: { label: '% · Min ₹', cls: 'bg-violet-50 text-violet-700' },
                pct: { label: 'Percent', cls: 'bg-amber-50 text-amber-700' },
                flat: { label: 'Fixed ₹', cls: 'bg-[#F0FDF4] text-[#047857]' },
                kg: { label: 'Weight', cls: 'bg-slate-100 text-slate-600' },
                count: { label: 'Count', cls: 'bg-slate-100 text-slate-600' },
                plain: { label: 'Rule', cls: 'bg-slate-100 text-slate-600' },
              };
              const hasMinOf = (row: OverheadRow) => row.kind === 'perKgMin' || row.kind === 'pctMin';
              const fmtVal = (k: RowKind, v: number | string | undefined | null) => {
                const x = v === undefined || v === '' || v === null ? null : Number(v);
                if (x == null || Number.isNaN(x)) return <span className="text-[#CBD5E1]">—</span>;
                if (k === 'kg') return x > 0 ? `${x} kg` : 'Service minimum';
                const num = x.toLocaleString('en-IN', { minimumFractionDigits: k === 'plain' || k === 'count' ? 0 : 2, maximumFractionDigits: 2 });
                return k === 'flat' ? `₹${num}` : k === 'perKgMin' ? `₹${num} / kg` : k === 'pct' || k === 'pctMin' ? `${num}%` : num;
              };
              const basis = (row: OverheadRow) => {
                if (row.ifApplicable) return 'Only if it happens';
                if (row.key === 'minimumBilling') return 'Tops up freight + LR + ROV';
                if (row.key === 'deliveryCharge') return 'Listed places only';
                if (row.key === 'greenTax' && overheads.greenTax?.delhiOnly) return 'Delhi pickup / delivery only';
                if (row.kind === 'perKgMin') return 'Higher of ₹/kg or minimum';
                if (row.kind === 'pctMin') return 'Higher of % of invoice or minimum';
                if (row.key === 'fuelCharge') return '% of base freight';
                if (row.key === 'gst') return 'On the subtotal';
                if (row.key === 'docketCharge') return 'Per LR';
                return 'Calculation rule';
              };
              const field = ({ value, onChange, suffix, prefix, label }: { value: number | string | undefined; onChange: (v: string) => void; suffix?: string; prefix?: string; label: string }) => (
                <div className="inline-flex items-center h-9 w-[132px] rounded-lg border border-[#E2E8F0] bg-white focus-within:border-[#00A86B] focus-within:ring-2 focus-within:ring-[#00A86B]/10 transition-all overflow-hidden">
                  {prefix && <span className="pl-2.5 text-[12px] text-[#94A3B8]">{prefix}</span>}
                  <input inputMode="decimal" value={value ?? ''} onChange={e => onChange(e.target.value)} aria-label={label} placeholder="0"
                    className="flex-1 min-w-0 h-full px-2 text-right text-[13px] font-medium text-[#0F172A] tabular-nums bg-transparent focus:outline-none" />
                  {suffix && <span className="pr-2.5 text-[12px] text-[#94A3B8]">{suffix}</span>}
                </div>
              );
              return (
                <section className="rounded-2xl border border-[#E2E8F0] bg-white overflow-hidden shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
                  <header className="px-5 py-4 border-b border-[#E2E8F0] flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <h3 className="text-[15px] font-bold text-[#0F172A]">Overhead Charges &amp; Calculation Rules</h3>
                      <p className="text-[12px] text-[#64748B] mt-0.5">Charges added on top of base freight for {serviceName || 'this service'}.</p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-[11.5px] text-[#475569]">
                      <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-[#F8FAFC] border border-[#EEF2F6]">Rate + minimum → <b className="font-semibold text-[#0F172A]">higher is charged</b></span>
                      <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-[#F8FAFC] border border-[#EEF2F6]">% on freight: FSC</span>
                      <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-[#F8FAFC] border border-[#EEF2F6]">% on invoice: COD, Risk, To Pay</span>
                      <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-[#F8FAFC] border border-[#EEF2F6]">0 = not charged</span>
                    </div>
                  </header>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-[13px]">
                      <thead>
                        <tr className="bg-[#F8FAFC] text-[11.5px] uppercase tracking-wide text-[#64748B]">
                          <th className="text-left font-semibold px-5 py-3 w-[38%]">Charge</th>
                          <th className="text-left font-semibold px-4 py-3">Type</th>
                          <th className="text-right font-semibold px-4 py-3">Value</th>
                          <th className="text-right font-semibold px-4 py-3">Minimum</th>
                          <th className="text-left font-semibold px-5 py-3">Applied as</th>
                        </tr>
                      </thead>
                      {OVERHEAD_SECTIONS.map(section => (
                        <tbody key={section.title}>
                          <tr>
                            <td colSpan={5} className="px-5 pt-4 pb-1 border-t border-[#EEF2F6]">
                              <div className="text-[11.5px] font-bold uppercase tracking-wider text-[#00A86B]">{section.title}</div>
                              <div className="text-[11.5px] text-[#94A3B8] mt-0.5 normal-case tracking-normal">{section.note}</div>
                            </td>
                          </tr>
                          {section.rows.map(row => {
                            const f: OverheadField = overheads[row.key] || {};
                            const k = row.kind;
                            const hasMin = hasMinOf(row);
                            const t = TYPE[k];
                            const oldType = savedAs[row.key];
                            return (
                              <tr key={row.key} className="border-t border-[#F1F5F9] hover:bg-[#FAFBFC] transition-colors">
                                <td className="px-5 py-3 align-middle">
                                  <div className="font-semibold text-[#0F172A]">
                                    {row.label}
                                    {row.ifApplicable && (
                                      <span className="ml-1.5 inline-flex items-center h-5 px-2 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 align-middle">If applicable</span>
                                    )}
                                  </div>
                                  <div className="text-[11.5px] text-[#94A3B8] leading-snug mt-0.5">{row.desc}</div>
                                  {oldType && (
                                    <div className="mt-1.5 p-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 leading-snug">
                                      Saved earlier as <b>{typeWords(oldType)}</b>, and charged that way until this card is saved. This charge is now <b>{t.label}</b>: check the value and minimum{editing ? ', then tick Checked.' : ' (Edit).'}
                                      {editing && (
                                        <label className="mt-1 flex items-center gap-1.5 font-semibold cursor-pointer select-none">
                                          <input type="checkbox" className="accent-[#00A86B]" checked={checkedTypes.includes(row.key)}
                                            onChange={e => setCheckedTypes(prev => (e.target.checked ? [...prev, row.key] : prev.filter(x => x !== row.key)))} />
                                          Checked
                                        </label>
                                      )}
                                    </div>
                                  )}
                                  {row.key === 'deliveryCharge' && (
                                    editing ? (
                                      <input value={placesText} onChange={e => setPlacesText(e.target.value)} placeholder="e.g. Assam, Meghalaya, Tripura or NE"
                                        aria-label="Delivery charge places"
                                        className="mt-1.5 w-full max-w-[360px] h-9 px-2.5 border border-[#E2E8F0] rounded-lg text-[12px] focus:outline-none focus:border-[#00A86B]" />
                                    ) : (
                                      <div className="text-[11px] text-[#00A86B] font-semibold mt-0.5">
                                        {(f.places || []).length ? `Only: ${(f.places || []).join(', ')}` : 'No places set — not charged'}
                                      </div>
                                    )
                                  )}
                                  {row.key === 'minimumBilling' && legacyMinFreight > 0 && (
                                    <div className="mt-1 text-[11px] text-[#B45309] leading-snug">
                                      This card still has the old Minimum Freight ₹{legacyMinFreight}. It applies until you save; saving keeps only Min. LR Billing{Number(overheads.minimumBilling?.value || 0) > 0 ? ` (₹${overheads.minimumBilling?.value})` : ''}.
                                    </div>
                                  )}
                                  {row.key === 'greenTax' && (
                                    editing ? (
                                      <label className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-[#475569] cursor-pointer select-none">
                                        <input type="checkbox" checked={Boolean(f.delhiOnly)} onChange={e => setDelhiOnly(e.target.checked)} className="accent-[#00A86B]" />
                                        Only when pickup or delivery is in Delhi
                                      </label>
                                    ) : f.delhiOnly ? <div className="text-[11px] text-[#00A86B] font-semibold">Delhi shipments only</div> : null
                                  )}
                                </td>
                                <td className="px-4 py-3 align-middle">
                                  <span className={`inline-flex items-center h-6 px-2.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${t.cls}`}>{t.label}</span>
                                </td>
                                <td className="px-4 py-3 align-middle text-right">
                                  {editing
                                    ? field({
                                        label: `${row.label} value`, value: f.value, onChange: v => setOverhead(row.key, 'value', v),
                                        prefix: k === 'flat' || k === 'perKgMin' ? '₹' : undefined,
                                        suffix: k === 'perKgMin' ? '/kg' : k === 'pct' || k === 'pctMin' ? '%' : k === 'kg' ? 'kg' : undefined,
                                      })
                                    : <span className="font-semibold text-[#0F172A] tabular-nums">{fmtVal(k, f.value)}</span>}
                                </td>
                                <td className="px-4 py-3 align-middle text-right">
                                  {hasMin
                                    ? (editing
                                        ? field({ label: `${row.label} minimum`, value: f.min, onChange: v => setOverhead(row.key, 'min', v), prefix: '₹' })
                                        : <span className="font-semibold text-[#0F172A] tabular-nums">{fmtVal('flat', f.min ?? 0)}</span>)
                                    : <span className="text-[#CBD5E1]">—</span>}
                                </td>
                                <td className="px-5 py-3 align-middle text-[12px] text-[#64748B] whitespace-nowrap">{basis(row)}</td>
                              </tr>
                            );
                          })}

                          {/* ROV: owner risk by invoice value — when any band is set, it replaces the ROV Owner Risk row */}
                          {section.ownerSlabs && (
                            <tr className="border-t border-[#F1F5F9]">
                              <td colSpan={5} className="px-5 py-3">
                                <div className="font-semibold text-[#0F172A]">Risk Charges — Owner, by invoice value (slabs)</div>
                                <div className="text-[11.5px] text-[#94A3B8] leading-snug mt-0.5 mb-2">
                                  The first band whose “up to ₹” covers the invoice value applies; leave “up to” blank for the last band (above). Bands at 0% and min ₹0 are ignored.
                                </div>
                                {editing ? (
                                  <div className="space-y-1.5">
                                    {ownerSlabs.map((s, i) => (
                                      <div key={i} className="flex flex-wrap items-center gap-2">
                                        {field({ label: `Owner slab ${i + 1} up to`, value: s.upto, onChange: v => setSlab(i, 'upto', v), prefix: 'up to ₹' })}
                                        {field({ label: `Owner slab ${i + 1} percent`, value: s.value, onChange: v => setSlab(i, 'value', v), suffix: '% of invoice' })}
                                        {field({ label: `Owner slab ${i + 1} minimum`, value: s.min, onChange: v => setSlab(i, 'min', v), prefix: 'min ₹' })}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-[12.5px] font-semibold text-[#0F172A]">{viewSlabs(ownerSlabs)}</span>
                                )}
                              </td>
                            </tr>
                          )}

                          {/* Package handling: per box, by box weight */}
                          {/* ODA: per kg / minimum in distance bands the admin sets (km is not fixed) */}
                          {section.pkgSlabs && (
                            <tr className="border-t border-[#F1F5F9]">
                              <td colSpan={5} className="px-5 py-3">
                                <div className="font-semibold text-[#0F172A]">ODA Charges (by the courier’s distance)</div>
                                <div className="text-[11.5px] text-[#94A3B8] leading-snug mt-0.5 mb-2">
                                  Only when the courier marks the pin as ODA. Each band starts above its “From km” and runs to the next band’s From; the first band also covers 0 km and an unknown distance.
                                  Charge = the higher of (chargeable kg × ₹ per kg) and the minimum ₹. A band left at 0 / 0 uses the charged band below it.
                                </div>
                                {OLD_ODA_KEYS.filter(k => savedAs[k]).map(k => (
                                  <div key={k} className="mb-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 leading-snug">
                                    {OLD_ODA_LABEL[k]} was saved as <b>{typeWords(savedAs[k])}</b> (of freight), and is charged that way until this card is saved. ODA is now ₹ per kg + minimum: check that band{editing ? ', then tick Checked.' : ' (Edit).'}
                                    {editing && (
                                      <label className="mt-1 flex items-center gap-1.5 font-semibold cursor-pointer select-none">
                                        <input type="checkbox" className="accent-[#00A86B]" checked={checkedTypes.includes(k)}
                                          onChange={e => setCheckedTypes(prev => (e.target.checked ? [...prev, k] : prev.filter(x => x !== k)))} />
                                        Checked
                                      </label>
                                    )}
                                  </div>
                                ))}
                                {editing ? (
                                  <div className="space-y-1.5">
                                    <div className="hidden sm:grid grid-cols-[repeat(3,8.5rem)_7rem_auto] gap-2 text-[11px] font-semibold text-[#64748B]">
                                      <span>From (above) km</span><span>Per kg charge ₹</span><span>Minimum charge ₹</span><span>Band</span><span />
                                    </div>
                                    {odaBands.map((b, i) => (
                                      <div key={i} className="grid grid-cols-2 sm:grid-cols-[repeat(3,8.5rem)_7rem_auto] gap-2 items-center">
                                        {([['from', 'From km'], ['perKg', '₹ / kg'], ['min', 'Min ₹']] as [keyof OdaBand, string][]).map(([fieldKey, label]) => (
                                          <input key={fieldKey} inputMode="decimal" value={b[fieldKey]} placeholder={label} onChange={e => setOdaBand(i, fieldKey, e.target.value)}
                                            className="h-9 px-2 text-center border border-[#E2E8F0] rounded-lg text-[12px] focus:outline-none focus:border-[#00A86B]" aria-label={`ODA band ${i + 1} ${label}`} />
                                        ))}
                                        <span className="text-[11.5px] text-[#64748B]">{odaRangeOf(odaBands, i)}</span>
                                        <button type="button" onClick={() => removeOdaBand(i)}
                                          className="h-9 px-2 text-[11.5px] font-semibold text-[#DC2626] hover:bg-[#FEF2F2] rounded-lg justify-self-start" aria-label={`Remove ODA band ${i + 1}`}>
                                          Remove
                                        </button>
                                      </div>
                                    ))}
                                    <button type="button" onClick={addOdaBand}
                                      className="h-9 px-3 text-[12px] font-semibold text-[#00A86B] border border-dashed border-[#00A86B] rounded-lg hover:bg-[#F0FDF4]">
                                      + Add distance band
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[12.5px] font-semibold text-[#0F172A]">{viewOdaBands(odaBands)}</span>
                                )}
                              </td>
                            </tr>
                          )}

                          {section.pkgSlabs && (
                            <tr className="border-t border-[#F1F5F9]">
                              <td colSpan={5} className="px-5 py-3">
                                <div className="font-semibold text-[#0F172A]">Package Handling (per box, by box weight)</div>
                                <div className="text-[11.5px] text-[#94A3B8] leading-snug mt-0.5 mb-2">
                                  Each box: the higher of (box kg × ₹ per kg) and the minimum ₹ of its slab. A box weighing exactly a slab’s “To” weight goes to the next slab; leave the last “To” blank for no upper limit.
                                </div>
                                {editing ? (
                                  <div className="space-y-1.5">
                                    <div className="hidden sm:grid grid-cols-[repeat(4,8.5rem)_auto] gap-2 text-[11px] font-semibold text-[#64748B]">
                                      <span>From weight (kg)</span><span>To weight (kg)</span><span>Minimum charge ₹</span><span>Per kg charge ₹</span><span />
                                    </div>
                                    {pkgSlabs.map((s, i) => (
                                      <div key={i} className="grid grid-cols-2 sm:grid-cols-[repeat(4,8.5rem)_auto] gap-2 items-center">
                                        {([['from', 'From kg', ''], ['to', 'To kg', 'above'], ['min', 'Min ₹', ''], ['perKg', '₹ / kg', '']] as [keyof PkgSlab, string, string][]).map(([fieldKey, label, ph]) => (
                                          <input key={fieldKey} inputMode="decimal" value={s[fieldKey]} placeholder={ph || label} onChange={e => setPkgSlab(i, fieldKey, e.target.value)}
                                            className="h-9 px-2 text-center border border-[#E2E8F0] rounded-lg text-[12px] focus:outline-none focus:border-[#00A86B]" aria-label={`Package slab ${i + 1} ${label}`} />
                                        ))}
                                        <button type="button" onClick={() => removePkgSlab(i)}
                                          className="h-9 px-2 text-[11.5px] font-semibold text-[#DC2626] hover:bg-[#FEF2F2] rounded-lg justify-self-start" aria-label={`Remove package slab ${i + 1}`}>
                                          Remove
                                        </button>
                                      </div>
                                    ))}
                                    <button type="button" onClick={addPkgSlab}
                                      className="h-9 px-3 text-[12px] font-semibold text-[#00A86B] border border-dashed border-[#00A86B] rounded-lg hover:bg-[#F0FDF4]">
                                      + Add slab
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[12.5px] font-semibold text-[#0F172A]">{viewPkgSlabs(pkgSlabs)}</span>
                                )}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      ))}
                    </table>
                  </div>
                </section>
              );
            })()}
          </>
        )}
      </div>

      {confirmDelete && card && (
        <ConfirmDialog
          title="Delete rate card?"
          body={`The ${planName} · ${serviceName} rate card will be deleted and removed from every user on the ${planName} plan.`}
          confirmLabel="Delete"
          busy={deleting}
          onConfirm={handleDelete}
          onClose={() => setConfirmDelete(false)}
        />
      )}

      {showUpload && (
        <UploadRatesModal planId={planId} planName={planName} couriers={meta.courierAccounts} onClose={() => setShowUpload(false)} onDone={() => { loadCard(); }} />
      )}

      {showAddPlan && createPortal(
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => !addingPlan && setShowAddPlan(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-bold text-[#0F172A]">Add B2B Plan</h3>
              <button onClick={() => !addingPlan && setShowAddPlan(false)} className="w-7 h-7 rounded-full flex items-center justify-center text-[#94A3B8] hover:bg-[#F8FAFC]"><X className="w-4 h-4" /></button>
            </div>
            <input autoFocus value={newPlanName} onChange={e => setNewPlanName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddPlan()}
              placeholder="Plan name, e.g. Gold" className={`${inputCls} w-full`} />
            <button onClick={handleAddPlan} disabled={addingPlan || !newPlanName.trim()} className={`${btnPrimary} w-full justify-center mt-4`}>
              {addingPlan ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Plan'}
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

/* ═══════════════════════════════ Zone Matrix tab ═══════════════════════════════ */
/* Each courier prices with one zone matrix (a named set of zones). The Default matrix holds the zones made before
   matrices existed and is used by every courier until it is assigned another. */
interface MatrixRow { _id: string; name: string; isDefault: boolean; zoneCount: number; couriers: CourierAccount[] }
interface RatesToUpdate { plan: string; service: string; missing: string[] }

function ZoneMatrixTab({ showToast }: { showToast: (t: 'success' | 'error' | 'info', m: string) => void }) {
  const [matrices, setMatrices] = useState<MatrixRow[]>([]);
  const [courierList, setCourierList] = useState<CourierAccount[]>([]);
  const [matrixId, setMatrixId] = useState('');
  const [zones, setZones] = useState<ZoneDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [zone, setZone] = useState('');
  const [staged, setStaged] = useState<LocationSuggestion[]>([]);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [zoneToDelete, setZoneToDelete] = useState<ZoneDoc | null>(null);
  const [deleting, setDeleting] = useState(false);
  // matrix management
  const [showNew, setShowNew] = useState(false);
  const [newCourier, setNewCourier] = useState(''); // the courier the new matrix is made for
  const [copyFrom, setCopyFrom] = useState('');
  const [creating, setCreating] = useState(false);
  const [confirmDeleteMatrix, setConfirmDeleteMatrix] = useState(false);
  const [assigning, setAssigning] = useState<string | null>(null); // courier id
  const [ratesToUpdate, setRatesToUpdate] = useState<{ courier: string; matrix: string; cards: RatesToUpdate[] } | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const current = matrices.find(m => m._id === matrixId);
  const errMsg = (err: any, fallback: string) => err?.response?.data?.message || fallback;

  const loadMatrices = async (select?: string) => {
    try {
      const res = await apiClient.get('/b2b/zonematrix/matrices');
      const list: MatrixRow[] = res.data?.matrices || [];
      setMatrices(list);
      setCourierList(res.data?.couriers || []);
      setMatrixId(prev => {
        if (select && list.some(m => m._id === select)) return select;
        if (list.some(m => m._id === prev)) return prev;
        return (list.find(m => m.isDefault) || list[0])?._id || '';
      });
    } catch (err: any) {
      showToast('error', errMsg(err, 'Failed to load zone matrices'));
    }
  };

  const loadZones = async (id = matrixId) => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await apiClient.get('/b2b/zonematrix/getAll', { params: { matrixId: id } });
      setZones(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      showToast('error', errMsg(err, 'Failed to load zones'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMatrices(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (matrixId) { setZone(''); setStaged([]); loadZones(matrixId); } }, [matrixId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search by city, state or pincode
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { setSuggestions([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await apiClient.get('/b2b/zonematrix/search', { params: { q } });
        setSuggestions(res.data?.results || []);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSuggestions(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const mappedTo = useMemo(() => {
    const m: Record<string, string> = {};
    zones.forEach(z => z.locations.forEach(l => { m[l.name.toLowerCase()] = z.zone; }));
    return m;
  }, [zones]);

  const stage = (s: LocationSuggestion) => {
    if (staged.some(x => x.name.toLowerCase() === s.name.toLowerCase())) {
      showToast('info', `"${s.name}" is already added`);
    } else {
      setStaged(prev => [...prev, s]);
    }
    setQuery(''); setSuggestions([]); setShowSuggestions(false);
  };

  const handleSubmit = async () => {
    if (!zone.trim()) { showToast('info', 'Zone is required'); return; }
    if (staged.length === 0) { showToast('info', 'Add at least one city or state first'); return; }
    setSubmitting(true);
    try {
      await apiClient.post('/b2b/zonematrix/addLocation', {
        matrixId,
        zone: zone.trim().toUpperCase(),
        locations: staged.map(s => ({ name: s.name })),
      });
      showToast('success', 'Locations added successfully');
      setZone(''); setStaged([]); setQuery('');
      await Promise.all([loadZones(), loadMatrices()]);
    } catch (err: any) {
      showToast('error', errMsg(err, 'Failed to add locations'));
    } finally {
      setSubmitting(false);
    }
  };

  const removeLocation = async (zoneName: string, name: string) => {
    try {
      await apiClient.put('/b2b/zonematrix/removeLocation', { matrixId, zone: zoneName, name });
      setZones(prev => prev.map(z => (z.zone === zoneName ? { ...z, locations: z.locations.filter(l => l.name !== name) } : z)));
      showToast('success', 'Location removed');
    } catch {
      showToast('error', 'Failed to remove location');
    }
  };

  const deleteZone = async () => {
    if (!zoneToDelete) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/b2b/zonematrix/removeZone/${zoneToDelete._id}`);
      setZones(prev => prev.filter(z => z._id !== zoneToDelete._id));
      showToast('success', 'Zone deleted');
      setZoneToDelete(null);
      loadMatrices();
    } catch {
      showToast('error', 'Failed to delete zone');
    } finally {
      setDeleting(false);
    }
  };

  const createMatrix = async () => {
    if (!newCourier) return;
    setCreating(true);
    try {
      const res = await apiClient.post('/b2b/zonematrix/matrices', { courierId: newCourier, ...(copyFrom ? { copyFromId: copyFrom } : {}) });
      const name = res.data?.matrix?.name || '';
      const courierName = res.data?.courier?.courierName || '';
      const copied = res.data?.copiedZones || 0;
      showToast('success', `Zone matrix "${name}" created${copied ? ` with ${copied} zones copied` : ''} and assigned to ${courierName}`);
      const cards: RatesToUpdate[] = res.data?.ratesToUpdate || [];
      setRatesToUpdate(cards.length ? { courier: courierName, matrix: name, cards } : null);
      setShowNew(false); setNewCourier(''); setCopyFrom('');
      await loadMatrices(res.data?.matrix?._id);
    } catch (err: any) {
      showToast('error', errMsg(err, 'Failed to create zone matrix'));
    } finally {
      setCreating(false);
    }
  };

  const deleteMatrix = async () => {
    if (!current) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/b2b/zonematrix/matrices/${current._id}`);
      showToast('success', `Zone matrix "${current.name}" deleted`);
      setConfirmDeleteMatrix(false);
      await loadMatrices(matrices.find(m => m.isDefault)?._id);
    } catch (err: any) {
      showToast('error', errMsg(err, 'Failed to delete zone matrix'));
      setConfirmDeleteMatrix(false);
    } finally {
      setDeleting(false);
    }
  };

  const assign = async (courier: CourierAccount, toMatrix: string) => {
    if (courier.zoneMatrixId === toMatrix) return;
    setAssigning(courier._id);
    try {
      const res = await apiClient.put('/b2b/zonematrix/assign', { courierId: courier._id, matrixId: toMatrix });
      const target = matrices.find(m => m._id === toMatrix)?.name || '';
      const cards: RatesToUpdate[] = res.data?.ratesToUpdate || [];
      showToast(cards.length ? 'info' : 'success', `${courier.courierName} now uses the zone matrix "${target}"`);
      setRatesToUpdate(cards.length ? { courier: courier.courierName, matrix: target, cards } : null);
      await loadMatrices();
    } catch (err: any) {
      showToast('error', errMsg(err, 'Failed to assign zone matrix'));
    } finally {
      setAssigning(null);
    }
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      {/* Zone matrix selector + management */}
      <div className="px-4 md:px-6 py-3 border-b border-[#CBD5F5] bg-[#F8FAFC]/50 flex flex-wrap items-center gap-2.5">
        <Select label="Zone matrix" value={matrixId} onChange={setMatrixId}
          options={matrices.map(m => ({ label: `${m.name}${m.isDefault ? ' (default)' : ''} · ${m.zoneCount} zone${m.zoneCount === 1 ? '' : 's'}`, value: m._id }))} />
        {current && !current.isDefault && (
          <>
            <button onClick={() => setConfirmDeleteMatrix(true)} className="h-10 px-5 rounded-full border border-red-200 bg-white text-red-600 text-[13px] font-bold inline-flex items-center gap-1.5 hover:bg-red-50">
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </>
        )}
        <button onClick={() => { setShowNew(true); setCopyFrom(''); setNewCourier(courierList[0]?._id || ''); }} className={`${btnPrimary} ml-auto`}><Plus className="w-4 h-4" /> New zone matrix</button>
      </div>

      {current && (
        <div className="px-4 md:px-6 pt-3 flex flex-wrap items-center gap-1.5 text-[12px] text-[#64748B]">
          <span className="font-semibold text-[#0F172A]">Used by:</span>
          {current.couriers.length ? current.couriers.map(c => (
            <span key={c._id} className="px-2 py-0.5 rounded-full bg-[#00A86B]/10 text-[#00A86B] font-semibold text-[11.5px]">{c.courierName}</span>
          )) : <span>no courier yet — assign it below</span>}
        </div>
      )}

      {/* Add locations to a zone of the selected matrix — staged locally, saved together on Submit */}
      <div className="px-4 md:px-6 py-4 border-b border-[#CBD5F5] space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <input value={zone} onChange={e => setZone(e.target.value.toUpperCase())} placeholder="Zone (e.g. N1)" aria-label="Zone"
            className={`${inputCls} sm:w-40`} />
          <div className="relative flex-1 sm:max-w-sm" ref={searchRef}>
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input value={query} onChange={e => setQuery(e.target.value)} onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Search city, state or pincode…" aria-label="Search location" className={`${inputCls} w-full pl-10`} />
            {showSuggestions && (
              <div className="absolute z-30 mt-1 w-full bg-white border border-[#E2E8F0] rounded-xl shadow-xl max-h-64 overflow-y-auto py-1">
                {searching ? (
                  <div className="flex items-center justify-center gap-2 py-4 text-[12px] text-[#94A3B8]"><Loader2 className="w-4 h-4 animate-spin" /> Searching…</div>
                ) : suggestions.length > 0 ? suggestions.map((s, i) => {
                  const taken = mappedTo[s.name.toLowerCase()];
                  return (
                    <button key={`${s.label}-${s.name}-${i}`} type="button" onClick={() => stage(s)}
                      className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left hover:bg-[#F0FDF4]">
                      <span className="min-w-0 flex items-center gap-2">
                        {s.label && <span className="text-[9.5px] font-bold uppercase text-[#00A86B] bg-[#00A86B]/10 rounded px-1.5 py-0.5 shrink-0">{s.label}</span>}
                        <span className="text-[12.5px] font-semibold text-[#0F172A] truncate">{s.name}</span>
                        {s.detail && <span className="text-[11px] text-[#94A3B8] truncate">({s.detail})</span>}
                      </span>
                      <span className={`text-[11px] font-semibold shrink-0 ${taken ? 'text-amber-600' : 'text-[#00A86B]'}`}>{taken ? `In ${taken}` : '+ Add'}</span>
                    </button>
                  );
                }) : (
                  <p className="text-[12px] text-[#94A3B8] text-center py-3">No matches found</p>
                )}
              </div>
            )}
          </div>
          <button onClick={handleSubmit} disabled={submitting || !matrixId} className={btnPrimary}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Submit
          </button>
        </div>
        {current && <p className="text-[11px] text-[#94A3B8]">Adding to the zone matrix <span className="font-semibold text-[#475569]">{current.name}</span>. A city / state belongs to one zone per matrix.</p>}
        {staged.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-[#64748B] mb-1.5">Locations to add ({staged.length})</p>
            <div className="flex flex-wrap gap-2">
              {staged.map(s => (
                <span key={s.name} className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full bg-[#00A86B]/10 text-[#00A86B] text-[11.5px] font-semibold">
                  {s.name}
                  <button type="button" onClick={() => setStaged(prev => prev.filter(x => x.name !== s.name))} aria-label={`Remove ${s.name}`}
                    className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-[#00A86B]/20"><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Zones of the selected matrix */}
      <div className="px-4 md:px-6 py-4 relative min-h-[200px]">
        {loading ? <TableLoader /> : zones.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-8 h-8 text-[#CBD5E1] mx-auto" />
            <p className="text-[13px] font-semibold text-[#64748B] mt-2">No zones in this zone matrix yet</p>
            <p className="text-[12px] text-[#94A3B8]">Add a zone above — every pickup and delivery city / state must belong to one.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {zones.map(z => (
              <div key={z._id} className="bg-white rounded-2xl border border-[#E2E8F0] p-3.5 md:p-4">
                <div className="flex items-center justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="h-7 min-w-[2.5rem] px-2.5 rounded-full bg-[#0F172A] text-white text-[12px] font-bold inline-flex items-center justify-center">{z.zone}</span>
                    <span className="text-[12px] text-[#64748B]">{z.locations.length} location{z.locations.length === 1 ? '' : 's'}</span>
                  </div>
                  <button onClick={() => setZoneToDelete(z)} aria-label={`Delete zone ${z.zone}`}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[#94A3B8] hover:text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {z.locations.map(l => (
                    <span key={l.name} className="inline-flex items-center gap-1 pl-2.5 pr-1 py-0.5 rounded-full bg-[#F1F5F9] text-[#334155] text-[11.5px] font-medium">
                      {l.name}
                      <button type="button" onClick={() => removeLocation(z.zone, l.name)} aria-label={`Remove ${l.name} from ${z.zone}`}
                        className="w-4 h-4 rounded-full flex items-center justify-center text-[#94A3B8] hover:text-red-500 hover:bg-red-50"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Which zone matrix each courier uses */}
      <div className="px-4 md:px-6 pb-6">
        <div className="rounded-2xl border border-[#E2E8F0] bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E2E8F0] bg-[#F8FAFC]">
            <h3 className="text-[13px] font-bold text-[#0F172A]">Courier zone matrices</h3>
            <p className="text-[11.5px] text-[#64748B] mt-0.5">Each courier prices B2B shipments with the zones of its zone matrix. Several couriers can share one.</p>
          </div>
          {courierList.length === 0 ? (
            <p className="px-4 py-4 text-[12px] text-[#94A3B8]">No B2B couriers yet — add them under Couriers first.</p>
          ) : (
            <div className="divide-y divide-[#F1F5F9]">
              {courierList.map(c => (
                <div key={c._id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-2.5">
                  <div className="min-w-0">
                    <div className="text-[12.5px] font-semibold text-[#0F172A]">{c.courierName}</div>
                    <div className="text-[11px] text-[#94A3B8]">{c.courierProvider}{c.status && c.status !== 'Enable' ? ' · disabled' : ''}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {assigning === c._id && <Loader2 className="w-4 h-4 animate-spin text-[#94A3B8]" />}
                    <Select label={`Zone matrix of ${c.courierName}`} value={c.zoneMatrixId || ''} onChange={v => assign(c, v)} disabled={assigning !== null}
                      options={matrices.map(m => ({ label: m.name, value: m._id }))} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {ratesToUpdate && (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[12px] font-semibold text-amber-800">
                {ratesToUpdate.courier} now uses "{ratesToUpdate.matrix}". These rate cards have prices for zones that matrix does not have — update them in the Rate Card tab (or with Upload Rates):
              </p>
              <button onClick={() => setRatesToUpdate(null)} aria-label="Close" className="text-amber-700 hover:text-amber-900 shrink-0"><X className="w-4 h-4" /></button>
            </div>
            <ul className="mt-1.5 text-[11.5px] text-amber-800 list-disc pl-4 space-y-0.5">
              {ratesToUpdate.cards.map((c, i) => <li key={i}>{c.plan} · {c.service}: {c.missing.join(', ')}</li>)}
            </ul>
          </div>
        )}
      </div>

      {zoneToDelete && (
        <ConfirmDialog
          title={`Delete zone ${zoneToDelete.zone}?`}
          body={`The zone and all its locations are removed from the zone matrix "${current?.name || ''}". Rate cards keep their prices for it, but shipments from or to its cities can no longer be priced by the couriers using this matrix until they are mapped again.`}
          confirmLabel="Delete zone"
          busy={deleting}
          onConfirm={deleteZone}
          onClose={() => setZoneToDelete(null)}
        />
      )}

      {confirmDeleteMatrix && current && (
        <ConfirmDialog
          title={`Delete zone matrix "${current.name}"?`}
          body={current.couriers.length
            ? `It is used by ${current.couriers.map(c => c.courierName).join(', ')}. Assign another zone matrix to ${current.couriers.length === 1 ? 'it' : 'them'} first.`
            : 'The zone matrix and all its zones are deleted. No courier uses it.'}
          confirmLabel="Delete"
          busy={deleting}
          onConfirm={deleteMatrix}
          onClose={() => setConfirmDeleteMatrix(false)}
        />
      )}

      {showNew && createPortal(
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => !creating && setShowNew(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-bold text-[#0F172A]">New zone matrix</h3>
              <button onClick={() => !creating && setShowNew(false)} className="w-7 h-7 rounded-full flex items-center justify-center text-[#94A3B8] hover:bg-[#F8FAFC]" aria-label="Close"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-[12px] font-semibold text-[#475569] mb-2">Courier</p>
            {courierList.length ? (
              <Select label="Courier" value={newCourier} onChange={setNewCourier}
                options={courierList.map(c => ({ label: c.courierName === c.courierProvider ? c.courierName : `${c.courierName} (${c.courierProvider})`, value: c._id }))} />
            ) : (
              <p className="text-[12px] text-[#94A3B8]">No B2B couriers yet — add them under Couriers first.</p>
            )}
            <p className="text-[12px] font-semibold text-[#475569] mt-4 mb-2">Start with</p>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[12.5px] text-[#475569] cursor-pointer">
                <input type="radio" checked={!copyFrom} onChange={() => setCopyFrom('')} className="accent-[#00A86B]" /> New zones (empty)
              </label>
              <label className="flex items-center gap-2 text-[12.5px] text-[#475569] cursor-pointer">
                <input type="radio" checked={!!copyFrom} onChange={() => setCopyFrom(current?._id || matrices[0]?._id || '')} className="accent-[#00A86B]" /> Copy of an existing zone matrix
              </label>
              {!!copyFrom && (
                <Select label="Copy from" value={copyFrom} onChange={setCopyFrom}
                  options={matrices.map(m => ({ label: `${m.name} · ${m.zoneCount} zones`, value: m._id }))} />
              )}
            </div>
            <p className="text-[11.5px] text-[#64748B] mt-4">
              Name: set automatically — <span className="font-semibold text-[#0F172A]">{(courierList.find(c => c._id === newCourier)?.courierName || 'Courier')} zones</span>. The courier starts using it straight away.
            </p>
            <button onClick={createMatrix} disabled={creating || !newCourier} className={`${btnPrimary} w-full justify-center mt-3`}>
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create zone matrix'}
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

/* ═══════════════════════════════ Page ═══════════════════════════════ */
export function CargoRateCard() {
  const [activeTab, setActiveTab] = useState<'ratecard' | 'zones'>('ratecard');
  const { toast, showToast, closeToast } = useToast();
  const isImpersonating = !!localStorage.getItem('admin_token_backup');

  return (
    <AdminLayout>
      <div className={`flex flex-col h-[calc(100vh-72px)] -m-4 md:-m-6 bg-white`}>
        <div className="px-4 md:px-6 py-2 border-b border-[#E2E8F0] shrink-0">
          <div className="flex gap-1 items-center bg-[#F7FEFC] rounded-full p-1.5 w-fit">
            {([['ratecard', 'Rate Card', Layers], ['zones', 'Zone Matrix', MapPin]] as const).map(([key, label, Icon]) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`px-4 py-2 text-[13px] font-bold rounded-full whitespace-nowrap transition-colors inline-flex items-center gap-1.5 ${activeTab === key ? 'text-[#00A86B] underline underline-offset-4 decoration-2' : 'text-[#64748B] hover:text-[#0F172A]'}`}>
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
            className="flex-1 min-h-0 flex flex-col">
            {activeTab === 'ratecard' ? <RateCardTab showToast={showToast} /> : <ZoneMatrixTab showToast={showToast} />}
          </motion.div>
        </AnimatePresence>
      </div>
      <Toast toast={toast} onClose={closeToast} />
    </AdminLayout>
  );
}
