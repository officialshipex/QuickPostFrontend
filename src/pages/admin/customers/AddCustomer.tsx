import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, User, MapPin, CheckCircle2, AlertCircle, StickyNote } from 'lucide-react';
import { DEFAULT_SETTINGS, fromBackend, LabelPreview, type LabelPreviewAddress, type LabelSettings } from '../AdminLabelSettings';
import { AdminLayout } from '../../../components/admin/layout/AdminLayout';
import { apiClient } from '../../../services/apiClient';
import { useAdminTab } from '../../../context/AdminUserContext';
import {
  EMPTY_CUSTOMER, INDIAN_STATES, findCustomerByPhone, matchState, prefillOrderWith, readCustomers, saveCustomer,
  type CustomerInput,
} from './customersStore';

/* Add / edit a customer. Pincode fills city and state; the phone number must be unique among saved customers. */

type Field = keyof CustomerInput;
const NOTE_MAX = 300;

const inputCls = (err?: string) =>
  `w-full h-10 px-4 border rounded-full text-[13px] text-[#0F172A] bg-white placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B] transition-colors ${err ? 'border-red-400' : 'border-[#E2E8F0]'}`;

function validate(f: CustomerInput): Partial<Record<Field, string>> {
  const e: Partial<Record<Field, string>> = {};
  if (!f.firstName.trim()) e.firstName = 'Enter first name';
  if (!f.lastName.trim()) e.lastName = 'Enter last name';
  if (!f.email.trim()) e.email = 'Enter email address';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) e.email = 'Enter a valid email address';
  if (!/^[6-9]\d{9}$/.test(f.phone)) e.phone = 'Enter a valid 10-digit mobile number';
  if (f.address1.trim().length < 10) e.address1 = 'Add house no., street and area (min. 10 characters)';
  if (!/^[1-9]\d{5}$/.test(f.pinCode)) e.pinCode = 'Enter a valid 6-digit pincode';
  if (!f.city.trim()) e.city = 'Enter city';
  if (!f.state) e.state = 'Select state';
  return e;
}

export function AddCustomer() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { currentUserId } = useAdminTab();
  const editing = useMemo(() => (id ? readCustomers(currentUserId).find(c => c.id === id) : undefined), [id, currentUserId]);

  const [f, setF] = useState<CustomerInput>(() => {
    if (editing) return { ...EMPTY_CUSTOMER, ...editing };
    const from = (location.state as { from?: Partial<CustomerInput> } | null)?.from;
    return from ? {
      ...EMPTY_CUSTOMER, firstName: from.firstName || '', lastName: from.lastName || '', email: from.email || '', phone: from.phone || '',
      address1: from.address1 || '', city: from.city || '', state: matchState(from.state || ''), pinCode: from.pinCode || '',
    } : { ...EMPTY_CUSTOMER };
  });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [touched, setTouched] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<null | { id: string }>(null);
  const [labelSettings, setLabelSettings] = useState<LabelSettings>(DEFAULT_SETTINGS);
  const [labelLogo, setLabelLogo] = useState<string | null>(null);
  const [pickup, setPickup] = useState<LabelPreviewAddress | null>(null);

  // The seller's own label settings, so the preview matches what they print
  useEffect(() => {
    let alive = true;
    apiClient.get('/label/getLabel')
      .then(res => { if (!alive || !res.data) return; setLabelSettings(fromBackend(res.data)); setLabelLogo(res.data.logoUrl || null); })
      .catch(() => { /* keep defaults */ });
    // The seller's primary pickup address prints as the pickup / return address
    apiClient.get('/order/pickupAddress?limit=100')
      .then(res => {
        const list: { isPrimary?: boolean; pickupAddress?: Record<string, string> }[] = res.data?.data ?? [];
        const a = (list.find(d => d.isPrimary) || list[0])?.pickupAddress;
        if (alive && a) setPickup({ name: a.contactName || '', address: a.address || '', cityLine: [a.city, (a.state || '').toUpperCase(), a.pinCode].filter(Boolean).join(', '), mobile: a.phoneNumber || '' });
      })
      .catch(() => { /* placeholder stays */ });
    return () => { alive = false; };
  }, []);

  const set = <K extends Field>(k: K, v: CustomerInput[K]) => {
    setF(prev => {
      const next = { ...prev, [k]: v };
      if (touched) setErrors(validate(next));
      return next;
    });
  };

  // Pincode → city / state
  useEffect(() => {
    if (f.pinCode.length !== 6) { setPinError(''); return; }
    let cancelled = false;
    setPinLoading(true);
    apiClient.get(`/order/pincode/${f.pinCode}`)
      .then(res => {
        if (cancelled) return;
        const d = res.data || {};
        const city = d.city || d.District || '';
        const state = matchState(d.state || d.State || '');
        if (!city && !state) { setPinError("We couldn't find this pincode. Fill city and state yourself."); return; }
        setPinError('');
        setF(prev => ({ ...prev, city: city || prev.city, state: state || prev.state }));
      })
      .catch(() => { if (!cancelled) setPinError("We couldn't find this pincode. Fill city and state yourself."); })
      .finally(() => { if (!cancelled) setPinLoading(false); });
    return () => { cancelled = true; };
  }, [f.pinCode]);

  const persist = (): string | null => {
    setTouched(true);
    const trimmed: CustomerInput = {
      ...f, firstName: f.firstName.trim(), lastName: f.lastName.trim(), email: f.email.trim().toLowerCase(),
      address1: f.address1.trim(), address2: f.address2.trim(), city: f.city.trim(), notes: f.notes.trim(),
    };
    const e = validate(trimmed);
    const dupe = !e.phone && findCustomerByPhone(currentUserId, trimmed.phone, editing?.id);
    if (dupe) e.phone = `Already saved as ${dupe.firstName} ${dupe.lastName}`.trim();
    setErrors(e);
    if (Object.keys(e).length) {
      const first = Object.keys(e)[0];
      document.getElementById(`cust-${first}`)?.focus();
      return null;
    }
    setSaving(true);
    const saved = saveCustomer(currentUserId, trimmed, editing?.id);
    setSaving(false);
    return saved.id;
  };

  const onSave = () => { const sid = persist(); if (sid) setDone({ id: sid }); };
  const onSaveAndOrder = () => {
    const sid = persist();
    if (!sid) return;
    prefillOrderWith(f);
    navigate('/user/add-order');
  };

  if (id && !editing) {
    return (
      <AdminLayout>
        <div className="max-w-md mx-auto mt-20 text-center">
          <AlertCircle className="w-8 h-8 text-[#CBD5E1] mx-auto" />
          <p className="mt-3 text-[14px] font-semibold text-[#0F172A]">Customer not found</p>
          <button onClick={() => navigate('/user/customers')} className="mt-4 h-9 px-4 rounded-full border border-[#E2E8F0] text-[12.5px] font-semibold text-[#475569]">Back to customers</button>
        </div>
      </AdminLayout>
    );
  }

  const label = (text: string, required = true, htmlFor?: string) => (
    <label htmlFor={htmlFor} className="block text-[12px] font-semibold text-[#334155] mb-1.5">{text}{required && <span className="text-red-500"> *</span>}</label>
  );
  const err = (k: Field) => errors[k] && <p className="mt-1 text-[11.5px] text-red-500">{errors[k]}</p>;
  const name = `${f.firstName} ${f.lastName}`.trim();
  const errorCount = Object.keys(errors).length;

  return (
    <AdminLayout>
      <div className="flex flex-col h-[calc(100vh-72px)] -m-4 md:-m-6 bg-[#F8FAFC]">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 md:px-6 py-3.5 bg-white border-b border-[#E2E8F0] shrink-0">
          <button onClick={() => navigate('/user/customers')} aria-label="Back to customers" className="w-9 h-9 rounded-full border border-[#E2E8F0] flex items-center justify-center text-[#475569] hover:border-[#00A86B] hover:text-[#00A86B] shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-[17px] md:text-[20px] font-bold text-[#0F172A]">{editing ? 'Edit Customer' : 'Add Customer'}</h1>
            <p className="hidden md:block text-[13px] text-[#64748B] mt-0.5">Save a buyer once and reuse their address on every new order</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-3 md:px-6 py-4 md:py-5 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px] gap-4 md:gap-5 items-start">
            <div className="flex flex-col gap-4">
              {touched && errorCount > 0 && (
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-red-50 border border-red-100 text-[12.5px] text-red-600">
                  <AlertCircle className="w-4 h-4 shrink-0" /> Fix {errorCount} field{errorCount > 1 ? 's' : ''} to save this customer.
                </div>
              )}

              {/* Contact */}
              <section className="bg-white rounded-2xl border border-[#E2E8F0] p-4 md:p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-8 h-8 rounded-lg bg-[#F0FDF4] text-[#00A86B] flex items-center justify-center"><User className="w-4 h-4" /></span>
                  <div>
                    <h2 className="text-[14px] font-bold text-[#0F172A]">Contact details</h2>
                    <p className="text-[11.5px] text-[#94A3B8]">Used for delivery updates and courier calls</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-x-4 gap-y-3.5">
                  <div>{label('First name', true, 'cust-firstName')}<input id="cust-firstName" value={f.firstName} onChange={e => set('firstName', e.target.value)} placeholder="e.g. Rahul" autoComplete="off" className={inputCls(errors.firstName)} />{err('firstName')}</div>
                  <div>{label('Last name', true, 'cust-lastName')}<input id="cust-lastName" value={f.lastName} onChange={e => set('lastName', e.target.value)} placeholder="e.g. Sharma" autoComplete="off" className={inputCls(errors.lastName)} />{err('lastName')}</div>
                  <div>
                    {label('Mobile number', true, 'cust-phone')}
                    <div className="flex">
                      <span className="h-10 pl-4 pr-3 inline-flex items-center rounded-l-full border border-r-0 border-[#E2E8F0] bg-[#F8FAFC] text-[13px] font-medium text-[#475569]">+91</span>
                      <input id="cust-phone" value={f.phone} inputMode="numeric" onChange={e => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit mobile"
                        className={`${inputCls(errors.phone)} !rounded-l-none tabular-nums`} />
                    </div>
                    {err('phone')}
                  </div>
                  <div>{label('Email', true, 'cust-email')}<input id="cust-email" type="email" value={f.email} onChange={e => set('email', e.target.value)} placeholder="name@example.com" autoComplete="off" className={inputCls(errors.email)} />{err('email')}</div>
                </div>
              </section>

              {/* Address */}
              <section className="bg-white rounded-2xl border border-[#E2E8F0] p-4 md:p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-8 h-8 rounded-lg bg-[#F0FDF4] text-[#00A86B] flex items-center justify-center"><MapPin className="w-4 h-4" /></span>
                  <div>
                    <h2 className="text-[14px] font-bold text-[#0F172A]">Delivery address</h2>
                    <p className="text-[11.5px] text-[#94A3B8]">Enter the pincode first, city and state fill in automatically</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-x-4 gap-y-3.5">
                  <div className="sm:col-span-2">{label('Address line 1', true, 'cust-address1')}<input id="cust-address1" value={f.address1} onChange={e => set('address1', e.target.value)} placeholder="House / flat no., building, street" className={inputCls(errors.address1)} />{err('address1')}</div>
                  <div className="sm:col-span-2">{label('Address line 2', false, 'cust-address2')}<input id="cust-address2" value={f.address2} onChange={e => set('address2', e.target.value)} placeholder="Area, landmark (optional)" className={inputCls()} /></div>
                  <div>
                    {label('Pincode', true, 'cust-pinCode')}
                    <div className="relative">
                      <input id="cust-pinCode" value={f.pinCode} inputMode="numeric" onChange={e => set('pinCode', e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit pincode" className={`${inputCls(errors.pinCode)} tabular-nums pr-9`} />
                      {pinLoading && <Loader2 className="w-4 h-4 text-[#00A86B] animate-spin absolute right-3 top-1/2 -translate-y-1/2" />}
                      {!pinLoading && f.pinCode.length === 6 && !pinError && f.city && <CheckCircle2 className="w-4 h-4 text-[#00A86B] absolute right-3 top-1/2 -translate-y-1/2" />}
                    </div>
                    {err('pinCode') || (pinError && <p className="mt-1 text-[11.5px] text-amber-600">{pinError}</p>)}
                  </div>
                  <div>{label('City', true, 'cust-city')}<input id="cust-city" value={f.city} onChange={e => set('city', e.target.value)} placeholder="City" className={inputCls(errors.city)} />{err('city')}</div>
                  <div>
                    {label('State', true, 'cust-state')}
                    <select id="cust-state" value={f.state} onChange={e => set('state', e.target.value)} className={`${inputCls(errors.state)} ${f.state ? '' : 'text-[#94A3B8]'}`}>
                      <option value="">Select state</option>
                      {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {err('state')}
                  </div>
                  <div>{label('Country')}<input value="India" disabled className={`${inputCls()} bg-[#F8FAFC] text-[#64748B]`} /></div>
                </div>
              </section>

              {/* Notes */}
              <section className="bg-white rounded-2xl border border-[#E2E8F0] p-4 md:p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-8 h-8 rounded-lg bg-[#F0FDF4] text-[#00A86B] flex items-center justify-center"><StickyNote className="w-4 h-4" /></span>
                  <h2 className="text-[14px] font-bold text-[#0F172A]">Internal note <span className="text-[11.5px] font-normal text-[#94A3B8]">(optional)</span></h2>
                </div>
                <textarea value={f.notes} onChange={e => set('notes', e.target.value.slice(0, NOTE_MAX))} rows={2} placeholder="e.g. Prefers delivery after 6 pm. Call before arriving."
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-2xl text-[13px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B] resize-none" />
                <div className="text-right text-[11px] text-[#94A3B8] tabular-nums">{f.notes.length}/{NOTE_MAX}</div>
              </section>
            </div>

            {/* Preview */}
            <aside className="lg:sticky lg:top-0 flex flex-col gap-3">
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">Label preview</span>
                  <button type="button" onClick={() => navigate('/user/settings/label')} className="text-[11.5px] font-semibold text-[#00A86B]">Label settings</button>
                </div>
                <div className="rounded-lg">
                  <LabelPreview settings={labelSettings} logoUrl={labelLogo} to={{
                    name,
                    address: [f.address1, f.address2].map(x => x.trim()).filter(Boolean).join(', '),
                    cityLine: [f.city.trim(), f.state.toUpperCase(), f.pinCode].filter(Boolean).join(', '),
                    mobile: f.phone,
                  }} pickup={pickup} />
                </div>
              </div>
            </aside>
          </div>
        </div>

        {/* Footer — phones and tablets */}
        <div className="flex items-center justify-end gap-2 px-3 md:px-6 py-2.5 bg-white border-t border-[#E2E8F0] shrink-0 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
          <button onClick={() => navigate('/user/customers')} className="hidden sm:inline-flex items-center h-9 px-4 rounded-full border border-[#E2E8F0] text-[12.5px] font-semibold text-[#475569] hover:bg-[#F8FAFC]">Cancel</button>
          <button onClick={onSaveAndOrder} disabled={saving} className="h-9 px-4 rounded-full border border-[#00A86B] text-[#00A86B] text-[12.5px] font-semibold hover:bg-[#F0FDF4] disabled:opacity-50">Save &amp; create order</button>
          <button onClick={onSave} disabled={saving} className="h-9 px-4 rounded-full bg-[#00A86B] text-white text-[12.5px] font-semibold disabled:opacity-50">{editing ? 'Save changes' : 'Save customer'}</button>
        </div>
      </div>

      {done && (
        <div className="fixed inset-0 z-[950] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-5 text-center">
            <span className="mx-auto w-12 h-12 rounded-2xl bg-[#F0FDF4] text-[#00A86B] flex items-center justify-center"><CheckCircle2 className="w-6 h-6" /></span>
            <h3 className="mt-3 text-[15px] font-bold text-[#0F172A]">{editing ? 'Customer updated' : 'Customer saved'}</h3>
            <p className="mt-1 text-[13px] text-[#64748B]">{name} is ready to use on new orders.</p>
            <div className="mt-5 flex flex-col gap-2">
              <button onClick={() => { prefillOrderWith(f); navigate('/user/add-order'); }} className="h-9 rounded-full bg-[#00A86B] text-white text-[12.5px] font-semibold">Create order for {f.firstName}</button>
              <div className="grid grid-cols-2 gap-2">
                {!editing && <button onClick={() => { setF({ ...EMPTY_CUSTOMER }); setErrors({}); setTouched(false); setDone(null); }} className="h-9 rounded-full border border-[#E2E8F0] text-[12.5px] font-semibold text-[#475569]">Add another</button>}
                <button onClick={() => navigate('/user/customers')} className={`h-9 rounded-full border border-[#E2E8F0] text-[12.5px] font-semibold text-[#475569] ${editing ? 'col-span-2' : ''}`}>View customers</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
