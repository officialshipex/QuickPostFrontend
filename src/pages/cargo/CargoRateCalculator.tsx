import { Fragment, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Loader2, MapPin, Plus, Trash2, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { cargoApiClient } from '../../services/cargoApiClient';

/* QuickPost Cargo — Shipment Rate Calculator (B2B / multi-box), single column.
   Pincodes resolve city/state underneath; service options are compact toggles; box rows carry
   per-unit weight and dimensions; a weights strip shows actual / volumetric / chargeable.
   Rates come from the Cargo backend via cargoApiClient (wired later). */

const MIN_CHARGEABLE_KG = 20;
const VOL_DIVISOR_CM = 5000;          // L×W×H (cm) / 5000 → kg
const INCH_TO_CM = 2.54;

type Unit = 'cm' | 'inch';
interface BoxRow { id: string; count: string; weight: string; length: string; width: string; height: string }
interface Place { city: string; state: string }
interface CargoQuote { courierName?: string; mode?: string; tat?: string | number; totalCharges?: number; [k: string]: unknown }

const newBox = (): BoxRow => ({ id: Math.random().toString(36).slice(2), count: '', weight: '', length: '', width: '', height: '' });
const num = (v: string) => Number(v) || 0;

const SERVICES = [
  { key: 'secure', label: 'Secure Shipment' },
  { key: 'appointment', label: 'Appointment Delivery' },
  { key: 'toPay', label: 'To-Pay' },
  { key: 'cod', label: 'Cash on Delivery' },
] as const;
type ServiceKey = typeof SERVICES[number]['key'];
const NO_SERVICES: Record<ServiceKey, boolean> = { secure: false, appointment: false, toPay: false, cod: false };

const IMPORTANT_TERMS = [
  'All rates shown are inclusive of GST.',
  'Additional charges such as address correction, shipment destruction, demurrage, mall delivery and time-bound or appointment delivery are billed extra when the service is opted for or applicable.',
  'Handling charges, where applicable, are billed at actuals as levied by the carrier partner.',
  `Chargeable weight is the higher of actual and volumetric weight, subject to a minimum of ${MIN_CHARGEABLE_KG} kg per shipment.`,
  `Volumetric weight is calculated per box as L × W × H (in cm) ÷ ${VOL_DIVISOR_CM}, multiplied by the number of boxes. Dimensions entered in inches are converted to centimetres.`,
  'Secure Shipment and COD charges are calculated on the declared invoice value.',
  'Rates are indicative and may change with fuel surcharge revisions and carrier base-rate updates.',
];

const labelCls = 'block text-[12px] font-semibold text-[#475569] mb-1.5';
const inputCls = 'w-full h-10 px-4 bg-white border border-[#E2E8F0] rounded-full text-[13px] font-medium text-[#0F172A] placeholder:text-[#94A3B8] placeholder:font-normal focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B] transition-colors';
const errInput = 'border-red-400 focus:border-red-500 focus:ring-red-500';
const suffixCls = 'absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-medium text-[#94A3B8] pointer-events-none';
const sectionTitle = 'text-[13px] font-bold text-[#0F172A] mb-3';

/** Resolves a 6-digit pincode to city/state (India Post). Empty until resolved. */
function usePincodePlace(pincode: string): Place {
  const [place, setPlace] = useState<Place & { pin: string }>({ pin: '', city: '', state: '' });
  useEffect(() => {
    if (pincode.length !== 6) return;
    let alive = true;
    fetch(`https://api.postalpincode.in/pincode/${pincode}`)
      .then(r => r.json())
      .then(data => {
        const po = data?.[0]?.PostOffice?.[0];
        if (alive && po) setPlace({ pin: pincode, city: po.District || po.Name || '', state: po.State || '' });
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [pincode]);
  return place.pin === pincode ? place : { city: '', state: '' };
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={onChange}
      className="flex items-center gap-2.5 h-10 px-3.5 rounded-full border border-[#E2E8F0] bg-white hover:border-[#CBD5E1] transition-colors text-left">
      <span className={`relative w-8 h-[18px] rounded-full shrink-0 transition-colors ${on ? 'bg-[#00A86B]' : 'bg-[#CBD5E1]'}`}>
        <span className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow-sm transition-all ${on ? 'left-[16px]' : 'left-[2px]'}`} />
      </span>
      <span className={`text-[12.5px] font-semibold whitespace-nowrap ${on ? 'text-[#0F172A]' : 'text-[#475569]'}`}>{label}</span>
    </button>
  );
}

export function CargoRateCalculator() {
  const [fromPin, setFromPin] = useState('');
  const [toPin, setToPin] = useState('');
  const [invoiceValue, setInvoiceValue] = useState('');
  const [services, setServices] = useState<Record<ServiceKey, boolean>>(NO_SERVICES);
  const [unit, setUnit] = useState<Unit>('cm');
  const [boxes, setBoxes] = useState<BoxRow[]>([newBox()]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [quotes, setQuotes] = useState<CargoQuote[] | null>(null);

  const from = usePincodePlace(fromPin);
  const to = usePincodePlace(toPin);

  const touch = (key?: string) => {
    if (key) setErrors(e => ({ ...e, [key]: '' }));
    setQuotes(null);
    setApiError('');
  };
  const setBox = (id: string, k: keyof BoxRow, v: string) => {
    setBoxes(rows => rows.map(r => (r.id === id ? { ...r, [k]: v } : r)));
    touch('boxes');
  };

  const totals = useMemo(() => {
    const f = unit === 'inch' ? INCH_TO_CM : 1;
    let count = 0, actual = 0, vol = 0;
    for (const b of boxes) {
      const n = num(b.count);
      count += n;
      actual += n * num(b.weight);
      vol += n * (num(b.length) * f * num(b.width) * f * num(b.height) * f) / VOL_DIVISOR_CM;
    }
    return { count, actual, vol, chargeable: Math.max(actual, vol, count > 0 ? MIN_CHARGEABLE_KG : 0) };
  }, [boxes, unit]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (fromPin.length !== 6) e.fromPin = 'Enter a valid 6-digit pincode';
    if (toPin.length !== 6) e.toPin = 'Enter a valid 6-digit pincode';
    if ((services.cod || services.secure) && !(num(invoiceValue) > 0)) e.invoiceValue = 'Required for COD / Secure Shipment';
    if (boxes.some(b => !(num(b.count) > 0) || !(num(b.weight) > 0) || !(num(b.length) > 0) || !(num(b.width) > 0) || !(num(b.height) > 0)))
      e.boxes = 'Fill in boxes, weight and all dimensions for every row';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCalculate = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    touch();
    try {
      const res = await cargoApiClient.post('/ratecalculate', {
        from: { pincode: fromPin, ...from },
        to: { pincode: toPin, ...to },
        invoiceValue: num(invoiceValue),
        isSecure: services.secure, isAppointment: services.appointment, isToPay: services.toPay, isCod: services.cod,
        dimensionUnit: unit,
        boxes: boxes.map(b => ({ count: num(b.count), weightPerUnit: num(b.weight), length: num(b.length), width: num(b.width), height: num(b.height) })),
        totalBoxes: totals.count,
        actualWeight: Number(totals.actual.toFixed(2)),
        volumetricWeight: Number(totals.vol.toFixed(2)),
        chargeableWeight: Number(totals.chargeable.toFixed(2)),
      });
      const list: CargoQuote[] = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setQuotes(list);
      if (list.length === 0) setApiError('No carrier is serviceable for this route.');
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      setApiError(err?.response?.data?.message || 'Failed to calculate rates. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFromPin(''); setToPin(''); setInvoiceValue(''); setServices(NO_SERVICES);
    setUnit('cm'); setBoxes([newBox()]); setErrors({}); touch();
  };

  const pinField = (label: string, value: string, set: (v: string) => void, place: Place, errKey: string, dot: string) => (
    <div className="min-w-0">
      <label className={labelCls}>{label} <span className="text-red-500">*</span></label>
      <div className="relative">
        <span className={`absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${dot}`} />
        <input inputMode="numeric" value={value} placeholder="Enter 6-digit pincode"
          onChange={e => { set(e.target.value.replace(/\D/g, '').slice(0, 6)); touch(errKey); }}
          className={`${inputCls} pl-9 tracking-wide ${errors[errKey] ? errInput : ''}`} />
      </div>
      {errors[errKey] ? (
        <p className="text-[11.5px] text-red-500 mt-1.5 pl-1">{errors[errKey]}</p>
      ) : (
        <p className={`flex items-center gap-1 text-[11.5px] mt-1.5 pl-1 min-h-[16px] ${place.city ? 'text-[#00A86B] font-medium' : 'text-[#94A3B8]'}`}>
          {place.city ? <><MapPin className="w-3 h-3 shrink-0" /><span className="truncate">{place.city}{place.state ? `, ${place.state}` : ''}</span></> : 'City and state appear here'}
        </p>
      )}
    </div>
  );

  return (
    <AdminLayout>
      <div className="w-full max-w-[960px] mx-auto pb-10 space-y-5">
        <h1 className="text-[18px] font-bold text-[#0F172A]">Cargo Rate Calculator</h1>

        <form onSubmit={handleCalculate} noValidate
          className="bg-white rounded-2xl p-5 md:p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_2px_8px_rgba(16,24,40,0.05)] divide-y divide-[#F1F5F9]">

          {/* Route */}
          <section className="pb-5">
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-x-3 gap-y-4 sm:items-start">
              {pinField('Pickup Pincode', fromPin, setFromPin, from, 'fromPin', 'bg-[#2563EB]')}
              <div className="hidden sm:flex items-center justify-center h-10 mt-[22px]">
                <span className="w-7 h-7 rounded-full bg-[#F0FDF4] border border-[#DCFCE7] flex items-center justify-center">
                  <ArrowRight className="w-3.5 h-3.5 text-[#00A86B]" />
                </span>
              </div>
              {pinField('Delivery Pincode', toPin, setToPin, to, 'toPin', 'bg-[#00A86B]')}
            </div>
          </section>

          {/* Shipment details */}
          <section className="py-5">
            <div className="space-y-4">
              <div className="max-w-[260px]">
                <label className={labelCls}>Invoice Value</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[13px] font-semibold text-[#64748B] pointer-events-none">₹</span>
                  <input inputMode="numeric" value={invoiceValue} placeholder="Enter value"
                    onChange={e => { setInvoiceValue(e.target.value.replace(/\D/g, '')); touch('invoiceValue'); }}
                    className={`${inputCls} pl-8 ${errors.invoiceValue ? errInput : ''}`} />
                </div>
                {errors.invoiceValue && <p className="text-[11.5px] text-red-500 mt-1.5 pl-1">{errors.invoiceValue}</p>}
              </div>
              <div>
                <label className={labelCls}>Services</label>
                <div className="flex flex-wrap gap-2">
                  {SERVICES.map(s => (
                    <Toggle key={s.key} label={s.label} on={services[s.key]}
                      onChange={() => { setServices(v => ({ ...v, [s.key]: !v[s.key] })); touch('invoiceValue'); }} />
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Boxes */}
          <section className="py-5">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h2 className={sectionTitle.replace(' mb-3', '')}>Box Details</h2>
              <div role="radiogroup" aria-label="Dimension unit" className="grid grid-cols-2 p-0.5 h-8 rounded-full bg-[#F1F5F9] border border-[#E2E8F0]">
                {(['cm', 'inch'] as const).map(u => (
                  <button key={u} type="button" role="radio" aria-checked={unit === u} onClick={() => { setUnit(u); touch(); }}
                    className={`px-3 rounded-full text-[12px] font-semibold transition-all ${unit === u ? 'bg-white text-[#00A86B] shadow-sm' : 'text-[#64748B]'}`}>
                    {u}
                  </button>
                ))}
              </div>
            </div>

            {/* Column headers (desktop) */}
            <div className="hidden md:grid grid-cols-[110px_150px_1fr_36px] gap-3 px-1 mb-1.5">
              <span className={labelCls.replace(' mb-1.5', '')}>No. of Boxes</span>
              <span className={labelCls.replace(' mb-1.5', '')}>Weight / Box</span>
              <span className={labelCls.replace(' mb-1.5', '')}>Dimensions L × W × H ({unit})</span>
              <span />
            </div>

            <div className="space-y-3 md:space-y-2">
              {boxes.map((b, i) => (
                <div key={b.id} className="relative grid grid-cols-2 md:grid-cols-[110px_150px_1fr_36px] gap-3 items-center rounded-xl md:rounded-none border md:border-0 border-[#E2E8F0] p-3 pt-3 md:p-0">
                  <div>
                    <label className={`${labelCls} md:hidden`}>No. of Boxes</label>
                    <input inputMode="numeric" value={b.count} placeholder="Boxes" aria-label={`Row ${i + 1} number of boxes`}
                      onChange={e => setBox(b.id, 'count', e.target.value.replace(/\D/g, '').slice(0, 4))} className={inputCls} />
                  </div>
                  <div>
                    <label className={`${labelCls} md:hidden`}>Weight / Box</label>
                    <div className="relative">
                      <input inputMode="decimal" value={b.weight} placeholder="Weight" aria-label={`Row ${i + 1} weight per box`}
                        onChange={e => { if (/^\d*\.?\d*$/.test(e.target.value)) setBox(b.id, 'weight', e.target.value); }}
                        className={`${inputCls} pr-10`} />
                      <span className={suffixCls}>kg</span>
                    </div>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className={`${labelCls} md:hidden`}>Dimensions L × W × H ({unit})</label>
                    <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-1.5">
                      {(['length', 'width', 'height'] as const).map((k, j) => (
                        <Fragment key={k}>
                          {j > 0 && <span className="text-[12px] font-semibold text-[#94A3B8]">×</span>}
                          <input inputMode="decimal" value={b[k]} placeholder={k === 'length' ? 'L' : k === 'width' ? 'W' : 'H'}
                            aria-label={`Row ${i + 1} ${k} (${unit})`}
                            onChange={e => { if (/^\d*\.?\d*$/.test(e.target.value)) setBox(b.id, k, e.target.value); }}
                            className={`${inputCls} px-3 text-center`} />
                        </Fragment>
                      ))}
                    </div>
                  </div>
                  <div className="absolute top-1.5 right-1.5 md:static flex justify-end">
                    <button type="button" disabled={boxes.length === 1} aria-label={`Remove row ${i + 1}`}
                      onClick={() => { setBoxes(rows => rows.filter(r => r.id !== b.id)); touch(); }}
                      className="w-9 h-9 rounded-full flex items-center justify-center text-[#94A3B8] hover:text-[#EF4444] hover:bg-[#FEF2F2] transition-colors disabled:opacity-30 disabled:pointer-events-none">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {errors.boxes && <p className="text-[11.5px] text-red-500 mt-2 pl-1">{errors.boxes}</p>}
            <button type="button" onClick={() => { setBoxes(rows => [...rows, newBox()]); touch(); }}
              className="mt-3 text-[12.5px] font-semibold text-[#00A86B] hover:text-[#009B63] inline-flex items-center gap-1">
              <Plus className="w-4 h-4" /> Add box type
            </button>
          </section>

          {/* Weights + actions */}
          <section className="pt-5 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] divide-x divide-[#E2E8F0]">
              {[
                ['Total Boxes', totals.count ? String(totals.count) : '0', false],
                ['Actual Weight', `${totals.actual.toFixed(2)} kg`, false],
                ['Volumetric Weight', `${totals.vol.toFixed(2)} kg`, false],
                ['Chargeable Weight', `${totals.chargeable.toFixed(2)} kg`, true],
              ].map(([k, v, hi], i) => (
                <div key={k as string} className={`px-4 py-2.5 ${i >= 2 ? 'border-t md:border-t-0 border-[#E2E8F0]' : ''}`}>
                  <div className="text-[11.5px] text-[#64748B]">{k as string}</div>
                  <div className={`text-[14px] font-bold tabular-nums ${hi ? 'text-[#00A86B]' : 'text-[#0F172A]'}`}>{v as string}</div>
                </div>
              ))}
            </div>
            <p className="text-[11.5px] text-[#94A3B8] -mt-2 pl-1">Chargeable weight is the higher of actual and volumetric weight, minimum {MIN_CHARGEABLE_KG} kg.</p>

            <div className="flex gap-3">
              <button type="submit" disabled={loading}
                className="px-7 h-10 min-w-[150px] rounded-full bg-[#00A86B] hover:bg-[#009B63] text-white text-[13px] font-bold shadow-sm transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-60">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Calculating…</> : 'Calculate Rates'}
              </button>
              <button type="button" onClick={handleReset}
                className="px-7 h-10 rounded-full border border-[#E2E8F0] text-[#475569] text-[13px] font-bold hover:bg-[#F8FAFC] hover:border-[#CBD5E1] transition-colors">
                Reset
              </button>
            </div>
          </section>
        </form>

        {/* Results */}
        <AnimatePresence>
          {(apiError || quotes) && (
            <motion.section initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="bg-white rounded-2xl p-5 md:p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_2px_8px_rgba(16,24,40,0.05)]">
              <h2 className={sectionTitle}>Available Carriers</h2>
              {apiError ? (
                <p className="text-[12.5px] text-red-500 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5">{apiError}</p>
              ) : (
                <div className="divide-y divide-[#F1F5F9]">
                  {quotes!.map((q, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-9 h-9 rounded-lg bg-[#F1F5F9] flex items-center justify-center shrink-0"><Truck className="w-4 h-4 text-[#475569]" /></span>
                        <div className="min-w-0">
                          <div className="text-[13px] font-semibold text-[#0F172A] truncate">{q.courierName || 'Carrier'}</div>
                          {q.tat != null && <div className="text-[11.5px] text-[#64748B]">{q.tat} days{q.mode ? ` · ${q.mode}` : ''}</div>}
                        </div>
                      </div>
                      <div className="text-[15px] font-bold text-[#0F172A] tabular-nums">₹{Number(q.totalCharges || 0).toLocaleString('en-IN')}</div>
                    </div>
                  ))}
                </div>
              )}
            </motion.section>
          )}
        </AnimatePresence>

        {/* Important Terms */}
        <section className="bg-[#F0FDF4] rounded-2xl p-5 md:p-6">
          <h3 className="text-[15px] font-bold text-[#0F172A] mb-4">Important Terms</h3>
          <ol className="list-decimal list-inside text-[12px] text-[#475569] space-y-2 leading-relaxed">
            {IMPORTANT_TERMS.map(term => <li key={term}>{term}</li>)}
            <li>
              For detailed terms, see your <Link to="/user/settings/agreement" className="font-semibold text-[#00A86B] hover:underline">Agreement</Link>.
              For any queries, <Link to="/user/support" state={{ openCreateTicket: true }} className="font-semibold text-[#00A86B] hover:underline">raise a support ticket</Link>.
            </li>
          </ol>
        </section>
      </div>
    </AdminLayout>
  );
}
