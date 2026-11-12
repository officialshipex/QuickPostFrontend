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
interface OverheadField { type?: string; value?: number | string; min?: number | string }
type Overheads = Record<string, OverheadField>;
interface RateCardDoc {
  _id: string;
  rates: { fromZone: string; toZone: string; price: number }[];
  overheadCharges: Overheads;
  status: string;
}
interface ZoneDoc { _id: string; zone: string; locations: { name: string }[] }
interface LocationSuggestion { name: string; label?: string; detail?: string }

/* ─── Overhead charges — same defaults and rows as ShipexFrontend's B2B rate card ─── */
const DEFAULT_OVERHEADS: Overheads = {
  pickupCharge: { type: 'percentage', value: 4, min: 0 },
  handlingCharge: { type: 'flat', value: 0 },
  codCharges: { type: 'percentage', value: 0, min: 0 },
  fodCharges: { type: 'flat', value: 0 },
  rovOwner: { type: 'percentage', value: 0, min: 70 },
  rovCarrier: { type: 'percentage', value: 0, min: 50 },
  odaCharges: { type: 'perKg', value: 10, min: 1000 },
  fuelCharge: { type: 'percentage', value: 20 },
  docketCharge: { type: 'flat', value: 0 },
  appointmentDelivery: { type: 'flat', value: 0 },
  greenTax: { type: 'flat', value: 0 },
  divisor: { type: 'formula', value: 4500 },
  minimumFreight: { type: 'flat', value: 220 },
  gst: { type: 'percentage', value: 18 },
};

type RowKind = 'pctMin' | 'perKgMin' | 'flat' | 'pct' | 'plain';
const OVERHEAD_ROWS: { key: string; label: string; desc: string; kind: RowKind }[] = [
  { key: 'pickupCharge', label: 'Pickup Charge', desc: '% of freight or minimum ₹ (whichever is higher)', kind: 'pctMin' },
  { key: 'handlingCharge', label: 'Handling Charge', desc: 'Flat ₹ per shipment for cargo handling', kind: 'flat' },
  { key: 'codCharges', label: 'COD Charges', desc: '% of invoice value or minimum ₹ (whichever is higher)', kind: 'pctMin' },
  { key: 'fodCharges', label: 'To Pay Charges (FOD)', desc: 'Flat ₹ when freight is collected at destination', kind: 'flat' },
  { key: 'rovOwner', label: 'ROV Owner Risk', desc: '% of declared value or minimum ₹ (whichever is higher)', kind: 'pctMin' },
  { key: 'rovCarrier', label: 'ROV Carrier Risk', desc: '% of declared value or minimum ₹ (whichever is higher)', kind: 'pctMin' },
  { key: 'odaCharges', label: 'ODA Charge (Out of Area)', desc: '₹/kg on billable weight or minimum ₹ (whichever is higher)', kind: 'perKgMin' },
  { key: 'fuelCharge', label: 'Fuel Surcharge (FSC)', desc: '% of base freight', kind: 'pct' },
  { key: 'docketCharge', label: 'Docket Charge', desc: 'Flat ₹ per LR / waybill', kind: 'flat' },
  { key: 'appointmentDelivery', label: 'Appointment Delivery', desc: 'Flat ₹ for time-slot scheduled delivery', kind: 'flat' },
  { key: 'greenTax', label: 'Green Tax', desc: 'Flat ₹ environmental surcharge', kind: 'flat' },
  { key: 'divisor', label: 'Volumetric Divisor', desc: 'Volumetric weight = L × W × H ÷ divisor', kind: 'plain' },
  { key: 'minimumFreight', label: 'Minimum Freight', desc: 'Minimum base freight per booking', kind: 'flat' },
  { key: 'gst', label: 'GST Rate', desc: 'GST % on the final subtotal', kind: 'pct' },
];

const viewOverhead = (kind: RowKind, f: OverheadField = {}) => {
  const v = f.value ?? 0;
  const m = f.min ?? 0;
  switch (kind) {
    case 'pctMin': return `${v}% or min ₹${m}`;
    case 'perKgMin': return `₹${v}/kg or min ₹${m}`;
    case 'flat': return `₹${v}`;
    case 'pct': return `${v}%`;
    default: return String(v);
  }
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
    setOverheads({ ...DEFAULT_OVERHEADS, ...(doc?.overheadCharges || {}) });
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
    const overheadCharges: Overheads = Object.fromEntries(Object.entries(overheads).map(([k, f]) => [k, {
      ...f,
      ...(f.value !== undefined ? { value: toNumber(f.value) } : {}),
      ...(f.min !== undefined ? { min: toNumber(f.min) } : {}),
    }]));
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

            {/* Overhead charges */}
            <div className="rounded-2xl border border-[#E2E8F0] bg-white overflow-hidden">
              <div className="px-4 py-3 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                <h3 className="text-[13px] font-bold text-[#0F172A]">Overhead Charges &amp; Calculation Rules</h3>
                <p className="text-[11.5px] text-[#64748B] mt-0.5">
                  Where both a % (or ₹/kg) and a minimum ₹ are set, the higher of the two is charged. Percentages apply to base freight (pickup, FSC) or invoice value (COD, ROV).
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x divide-[#F1F5F9]">
                {[OVERHEAD_ROWS.slice(0, 7), OVERHEAD_ROWS.slice(7)].map((col, ci) => (
                  <div key={ci} className="divide-y divide-[#F1F5F9]">
                    {col.map(row => {
                      const f = overheads[row.key] || {};
                      const hasMin = row.kind === 'pctMin' || row.kind === 'perKgMin';
                      const unit = row.kind === 'pctMin' || row.kind === 'pct' ? '%' : row.kind === 'perKgMin' ? '₹/kg' : row.kind === 'flat' ? '₹' : '';
                      return (
                        <div key={row.key} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-2.5">
                          <div className="min-w-0">
                            <div className="text-[12.5px] font-semibold text-[#0F172A]">{row.label}</div>
                            <div className="text-[11px] text-[#94A3B8] leading-tight">{row.desc}</div>
                          </div>
                          {editing ? (
                            <div className="flex items-center gap-1.5 shrink-0">
                              <input inputMode="decimal" value={f.value ?? ''} onChange={e => setOverhead(row.key, 'value', e.target.value)}
                                className="w-20 h-8 px-2 text-center border border-[#E2E8F0] rounded-lg text-[12px] focus:outline-none focus:border-[#00A86B]" aria-label={`${row.label} value`} />
                              {unit && <span className="text-[11px] text-[#64748B]">{unit}</span>}
                              {hasMin && (
                                <>
                                  <span className="text-[11px] text-[#CBD5E1] mx-0.5">|</span>
                                  <span className="text-[11px] text-[#64748B]">min ₹</span>
                                  <input inputMode="decimal" value={f.min ?? ''} onChange={e => setOverhead(row.key, 'min', e.target.value)}
                                    className="w-20 h-8 px-2 text-center border border-[#E2E8F0] rounded-lg text-[12px] focus:outline-none focus:border-[#00A86B]" aria-label={`${row.label} minimum`} />
                                </>
                              )}
                            </div>
                          ) : (
                            <span className="text-[12.5px] font-semibold text-[#0F172A] shrink-0">{viewOverhead(row.kind, f)}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
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
  const [newName, setNewName] = useState('');
  const [copyFrom, setCopyFrom] = useState('');
  const [creating, setCreating] = useState(false);
  const [renaming, setRenaming] = useState<string | null>(null); // the new name being typed
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
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    try {
      const res = await apiClient.post('/b2b/zonematrix/matrices', { name, ...(copyFrom ? { copyFromId: copyFrom } : {}) });
      const copied = res.data?.copiedZones || 0;
      showToast('success', copied ? `Zone matrix "${name}" created with ${copied} zones copied` : `Zone matrix "${name}" created`);
      setShowNew(false); setNewName(''); setCopyFrom('');
      await loadMatrices(res.data?.matrix?._id);
    } catch (err: any) {
      showToast('error', errMsg(err, 'Failed to create zone matrix'));
    } finally {
      setCreating(false);
    }
  };

  const renameMatrix = async () => {
    const name = (renaming || '').trim();
    if (!current || !name || name === current.name) { setRenaming(null); return; }
    try {
      await apiClient.put(`/b2b/zonematrix/matrices/${current._id}`, { name });
      showToast('success', 'Zone matrix renamed');
      setRenaming(null);
      await loadMatrices();
    } catch (err: any) {
      showToast('error', errMsg(err, 'Failed to rename zone matrix'));
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
        {current && renaming === null && !current.isDefault && (
          <>
            <button onClick={() => setRenaming(current.name)} className={btnGhost}><Edit2 className="w-4 h-4" /> Rename</button>
            <button onClick={() => setConfirmDeleteMatrix(true)} className="h-10 px-5 rounded-full border border-red-200 bg-white text-red-600 text-[13px] font-bold inline-flex items-center gap-1.5 hover:bg-red-50">
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </>
        )}
        {renaming !== null && (
          <div className="flex items-center gap-2">
            <input autoFocus value={renaming} onChange={e => setRenaming(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') renameMatrix(); if (e.key === 'Escape') setRenaming(null); }}
              aria-label="Zone matrix name" className={`${inputCls} w-48`} />
            <button onClick={renameMatrix} className={btnPrimary}><Save className="w-4 h-4" /> Save</button>
            <button onClick={() => setRenaming(null)} className={btnGhost}>Cancel</button>
          </div>
        )}
        <button onClick={() => { setShowNew(true); setCopyFrom(''); }} className={`${btnPrimary} ml-auto`}><Plus className="w-4 h-4" /> New zone matrix</button>
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
            <input autoFocus value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && createMatrix()}
              placeholder="Name, e.g. Gati zones" maxLength={60} className={`${inputCls} w-full`} />
            <p className="text-[12px] font-semibold text-[#475569] mt-4 mb-2">Start with</p>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[12.5px] text-[#475569] cursor-pointer">
                <input type="radio" checked={!copyFrom} onChange={() => setCopyFrom('')} className="accent-[#00A86B]" /> An empty zone matrix
              </label>
              <label className="flex items-center gap-2 text-[12.5px] text-[#475569] cursor-pointer">
                <input type="radio" checked={!!copyFrom} onChange={() => setCopyFrom(current?._id || matrices[0]?._id || '')} className="accent-[#00A86B]" /> A copy of
              </label>
              {!!copyFrom && (
                <Select label="Copy from" value={copyFrom} onChange={setCopyFrom}
                  options={matrices.map(m => ({ label: `${m.name} · ${m.zoneCount} zones`, value: m._id }))} />
              )}
            </div>
            <button onClick={createMatrix} disabled={creating || !newName.trim()} className={`${btnPrimary} w-full justify-center mt-5`}>
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create zone matrix'}
            </button>
            <p className="text-[11px] text-[#94A3B8] mt-2">Then assign it to couriers under "Courier zone matrices".</p>
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
      <div className={`flex flex-col ${isImpersonating ? 'h-[calc(100vh-104px)]' : 'h-[calc(100vh-72px)]'} -m-4 md:-m-6 bg-white`}>
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
