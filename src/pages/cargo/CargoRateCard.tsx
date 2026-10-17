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
import { Edit2, Save, Trash2, Plus, X, Search, MapPin, Layers, Loader2, ChevronDown } from 'lucide-react';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { apiClient } from '../../services/apiClient';
import { TableLoader } from '../../components/ui/TableLoader';
import { Toast } from '../../components/ui/Toast';
import { useToast } from '../../hooks/useToast';

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface Meta {
  couriers: { _id: string; name: string; provider?: string; courierType?: string }[];
  plans: { _id: string; name: string }[];
  zones: string[];
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

  const zones = meta?.zones || [];

  const loadMeta = async (selectPlanName?: string) => {
    try {
      const res = await apiClient.get('/b2b/ratecard/getMeta');
      const m: Meta = {
        couriers: res.data?.couriers || [],
        plans: res.data?.plans || [],
        zones: res.data?.zones || [],
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
            No zones yet — create zones in the Zone Matrix tab first.
          </p>
        )}

        {planId && serviceId && zones.length > 0 && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[14px] font-bold text-[#0F172A]">{planName} · {serviceName}</h2>
              <span className="text-[12px] text-[#64748B]">Price per 1 kg, from zone (row) to zone (column)</span>
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
function ZoneMatrixTab({ showToast }: { showToast: (t: 'success' | 'error' | 'info', m: string) => void }) {
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
  const searchRef = useRef<HTMLDivElement>(null);

  const loadZones = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/b2b/zonematrix/getAll');
      setZones(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Failed to load zones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadZones(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
        zone: zone.trim().toUpperCase(),
        locations: staged.map(s => ({ name: s.name })),
      });
      showToast('success', 'Locations added successfully');
      setZone(''); setStaged([]); setQuery('');
      await loadZones();
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Failed to add locations');
    } finally {
      setSubmitting(false);
    }
  };

  const removeLocation = async (zoneName: string, name: string) => {
    try {
      await apiClient.put('/b2b/zonematrix/removeLocation', { zone: zoneName, name });
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
    } catch {
      showToast('error', 'Failed to delete zone');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      {/* Add locations to a zone — staged locally, saved together on Submit */}
      <div className="px-4 md:px-6 py-4 border-b border-[#CBD5F5] bg-[#F8FAFC]/50 space-y-3">
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
          <button onClick={handleSubmit} disabled={submitting} className={btnPrimary}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Submit
          </button>
        </div>
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

      {/* Zones */}
      <div className="px-4 md:px-6 py-4 relative min-h-[200px]">
        {loading ? <TableLoader /> : zones.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-8 h-8 text-[#CBD5E1] mx-auto" />
            <p className="text-[13px] font-semibold text-[#64748B] mt-2">No zones yet</p>
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

      {zoneToDelete && (
        <ConfirmDialog
          title={`Delete zone ${zoneToDelete.zone}?`}
          body="The zone and all its locations are removed. Rate cards keep their prices for it, but shipments from or to its cities can no longer be priced until they are mapped again."
          confirmLabel="Delete zone"
          busy={deleting}
          onConfirm={deleteZone}
          onClose={() => setZoneToDelete(null)}
        />
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
