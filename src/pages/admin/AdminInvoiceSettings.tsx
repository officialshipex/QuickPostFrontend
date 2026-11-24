import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Loader2, Lock, Upload, X as XIcon, RefreshCw, ExternalLink, AlertCircle, Info } from 'lucide-react';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { apiClient } from '../../services/apiClient';

/* Settings → Invoice. The seller designs the tax invoice their buyers get: A4 or thermal, branding, and which OPTIONAL
   details print. Mandatory details (GST law: seller's business name / address / state code / GSTIN, buyer's name /
   address / state & PIN, invoice number and date, product name, qty, unit price, taxable value, tax, row total) are
   always printed and shown locked. The preview on the right is the real PDF from the backend (label/invoiceRender.js),
   the same code that renders the downloaded invoice. */

const TXT = {
  title: 'text-[14px] font-semibold',
  label: 'text-[12px] font-semibold',
  value: 'text-[12px] font-normal',
  meta: 'text-[11px]',
};

type Format = 'A4' | 'thermal';
interface InvoiceSettings {
  format: Format;
  usePlatformBranding: boolean;
  logoUrl: string;
  soldBy: { phone: boolean; email: boolean; website: boolean; cin: string };
  buyer: { phone: boolean; email: boolean };
  invoice: {
    prefix: string; startNumber: number;
    ewayBill: boolean; orderNo: boolean; orderDate: boolean; channel: boolean; shippedBy: boolean; awb: boolean;
    paymentMethod: boolean; remarks: boolean; remarksText: string;
  };
  product: { hsn: boolean; sku: boolean; discount: boolean; amountInWords: boolean; trimSku: number; trimName: number };
  footer: { reverseCharge: boolean; signatureUrl: string };
}
interface Seller {
  businessName: string; brandName: string; companyName: string; address: string; city: string; state: string;
  stateCode: string; pinCode: string; gstin: string; phone: string; email: string; website: string;
}
interface Mandatory { soldBy: string[]; buyer: string[]; invoice: string[]; product: string[] }

const strip = (s: InvoiceSettings): InvoiceSettings => ({
  format: s.format, usePlatformBranding: s.usePlatformBranding, logoUrl: s.logoUrl,
  soldBy: { ...s.soldBy }, buyer: { ...s.buyer }, invoice: { ...s.invoice }, product: { ...s.product }, footer: { ...s.footer },
});
const same = (a: InvoiceSettings | null, b: InvoiceSettings | null) => JSON.stringify(a) === JSON.stringify(b);
const pad5 = (n: number) => String(Math.max(1, Math.floor(n) || 1)).padStart(5, '0');
const MAX_UPLOAD = 3 * 1024 * 1024;
// the server's own message when it sent one ("Image should be less than 3 MB."), else the fallback
const errorMessage = (err: unknown, fallback: string) =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
// Browsers that can't show a PDF inside the page (Chrome on Android) say so here; they get an "Open preview" button
const INLINE_PDF = typeof navigator === 'undefined' || (navigator as Navigator & { pdfViewerEnabled?: boolean }).pdfViewerEnabled !== false;

// ─── small pieces ───────────────────────────────────────────────────────────────────────────────────────────────
function Section({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <section className="py-5 border-b border-[#E2E8F0] last:border-0">
      <h2 className={`${TXT.title} text-[#0F172A] uppercase tracking-wide`}>{title}</h2>
      <p className={`${TXT.meta} text-[#64748B] mt-0.5 mb-4`}>{desc}</p>
      {children}
    </section>
  );
}

function Check3({ label, checked, onChange, locked }: { label: string; checked: boolean; onChange?: () => void; locked?: boolean }) {
  return (
    <label className={`flex items-center gap-2.5 py-1.5 select-none ${locked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      title={locked ? 'Required on every tax invoice — can\'t be turned off' : undefined}>
      <span className={`w-[18px] h-[18px] rounded-[5px] border-2 flex items-center justify-center shrink-0 transition-colors ${
        locked ? 'bg-[#CBD5E1] border-[#CBD5E1]' : checked ? 'bg-[#00A86B] border-[#00A86B]' : 'bg-white border-[#CBD5E1]'}`}>
        {(checked || locked) && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
      </span>
      <input type="checkbox" className="sr-only" checked={locked ? true : checked} disabled={locked} onChange={() => !locked && onChange?.()} />
      <span className={`${TXT.value} ${locked ? 'text-[#94A3B8]' : 'text-[#0F172A]'}`}>{label}</span>
      {locked && <Lock className="w-3 h-3 text-[#94A3B8]" aria-label="Mandatory" />}
    </label>
  );
}

function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={onClick}
      className={`relative w-10 h-[22px] rounded-full transition-colors shrink-0 ${on ? 'bg-[#00A86B]' : 'bg-[#CBD5E1]'}`}>
      <span className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow transition-all ${on ? 'left-[21px]' : 'left-[3px]'}`} />
    </button>
  );
}

const inputCls = `w-full h-10 px-3 rounded-lg border border-[#E2E8F0] bg-white ${TXT.value} text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20 focus:border-[#00A86B]`;
const readOnlyCls = `w-full h-10 px-3 rounded-lg border border-[#E2E8F0] bg-[#F1F5F9] ${TXT.value} text-[#475569] flex items-center truncate`;

function ImageUpload({ kind, url, onChange, onError }: { kind: 'logo' | 'signature'; url: string; onChange: (url: string) => void; onError: (m: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const pick = async (file: File | null) => {
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) { onError('Upload a PNG, JPG or WEBP image.'); return; }
    if (file.size > MAX_UPLOAD) { onError('Image should be less than 3 MB.'); return; }
    setBusy(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const { data } = await apiClient.post(`/printinvoice/settings/upload?kind=${kind}`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      onChange(data.url);
    } catch (err) {
      onError(errorMessage(err, 'Upload failed. Please try again.'));
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = '';
    }
  };
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <input ref={ref} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={e => pick(e.target.files?.[0] || null)} />
      {url ? (
        <>
          <img src={url} alt={kind === 'logo' ? 'Invoice logo' : 'Signature'} className="h-14 max-w-[180px] object-contain border border-[#E2E8F0] rounded-lg p-1.5 bg-white" />
          <button type="button" onClick={() => ref.current?.click()} disabled={busy} className={`${TXT.value} text-[#00A86B] hover:underline disabled:opacity-60`}>
            {busy ? 'Uploading…' : 'Change'}
          </button>
          <button type="button" onClick={() => onChange('')} aria-label="Remove" className="text-[#94A3B8] hover:text-red-500"><XIcon className="w-4 h-4" /></button>
        </>
      ) : (
        <button type="button" onClick={() => ref.current?.click()} disabled={busy}
          className="w-[120px] h-[84px] rounded-lg border border-dashed border-[#00A86B]/60 text-[#00A86B] flex flex-col items-center justify-center gap-1.5 hover:bg-[#F0FDF4] disabled:opacity-60">
          {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
          <span className={TXT.value}>{busy ? 'Uploading…' : 'Upload'}</span>
        </button>
      )}
    </div>
  );
}

// ─── page ───────────────────────────────────────────────────────────────────────────────────────────────────────
export function AdminInvoiceSettings() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saved, setSaved] = useState<InvoiceSettings | null>(null);
  const [form, setForm] = useState<InvoiceSettings | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [brandName, setBrandName] = useState('QuickPost');
  const [mandatory, setMandatory] = useState<Mandatory>({ soldBy: [], buyer: [], invoice: [], product: [] });
  const [nextInvoice, setNextInvoice] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [message, setMessage] = useState<{ kind: 'error' | 'info'; text: string } | null>(null);

  // preview
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewBusy, setPreviewBusy] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const previewSeq = useRef(0);
  const [refreshTick, setRefreshTick] = useState(0);

  // loads the saved settings; the first time with loading already on, "Try again" turns it back on first (retry)
  const [loadTick, setLoadTick] = useState(0);
  useEffect(() => {
    let alive = true;
    apiClient.get('/printinvoice/settings')
      .then(({ data }) => {
        if (!alive) return;
        const s = strip(data.settings);
        setSaved(s);
        setForm(s);
        setSeller(data.seller || null);
        setBrandName(data.brand?.name || 'QuickPost');
        setMandatory(data.mandatory || { soldBy: [], buyer: [], invoice: [], product: [] });
        setNextInvoice(data.nextInvoiceNumber || '');
      })
      .catch((err) => { if (alive) setLoadError(errorMessage(err, 'Could not load invoice settings.')); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [loadTick]);
  const retry = () => { setLoading(true); setLoadError(''); setLoadTick(n => n + 1); };

  const dirty = !!form && !!saved && !same(form, saved);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  // live preview: the real PDF for the current (unsaved) settings, half a second after the last change
  const formKey = useMemo(() => (form ? JSON.stringify(form) : ''), [form]);
  useEffect(() => {
    if (!form) return;
    const seq = ++previewSeq.current;
    const t = window.setTimeout(async () => {
      setPreviewBusy(true);
      try {
        const res = await apiClient.post('/printinvoice/preview', { settings: form }, { responseType: 'blob' });
        if (seq !== previewSeq.current) return;
        const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
        setPreviewUrl(prev => { if (prev) URL.revokeObjectURL(prev); return url; });
        setPreviewError('');
      } catch {
        if (seq === previewSeq.current) setPreviewError('Preview could not be built. Check your connection and try again.');
      } finally {
        if (seq === previewSeq.current) setPreviewBusy(false);
      }
    }, 500);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formKey, refreshTick]);
  // free the last preview when leaving the page (each new one frees the one before it)
  const lastPreview = useRef('');
  useEffect(() => { lastPreview.current = previewUrl; }, [previewUrl]);
  useEffect(() => () => { if (lastPreview.current) URL.revokeObjectURL(lastPreview.current); }, []);

  const set = <K extends keyof InvoiceSettings>(key: K, value: InvoiceSettings[K]) => setForm(f => (f ? { ...f, [key]: value } : f));
  const setIn = <K extends 'soldBy' | 'buyer' | 'invoice' | 'product' | 'footer'>(group: K, patch: Partial<InvoiceSettings[K]>) =>
    setForm(f => (f ? { ...f, [group]: { ...f[group], ...patch } } : f));
  const flip = <K extends 'soldBy' | 'buyer' | 'invoice' | 'product' | 'footer'>(group: K, field: keyof InvoiceSettings[K]) =>
    setForm(f => (f ? { ...f, [group]: { ...f[group], [field]: !(f[group] as Record<string, unknown>)[field as string] } } : f));

  const save = async () => {
    if (!form) return;
    if (!form.invoice.prefix.trim()) { setMessage({ kind: 'error', text: 'Invoice prefix is required.' }); return; }
    if (!(form.invoice.startNumber >= 1)) { setMessage({ kind: 'error', text: 'Starting series number must be 1 or more.' }); return; }
    setSaving(true);
    setMessage(null);
    try {
      // trims typed out of range are saved at their nearest allowed value (the same as the server would)
      const clean: InvoiceSettings = {
        ...form,
        product: {
          ...form.product,
          trimSku: Math.min(60, Math.max(5, Math.floor(form.product.trimSku) || 20)),
          trimName: Math.min(200, Math.max(10, Math.floor(form.product.trimName) || 80)),
        },
      };
      const { data } = await apiClient.put('/printinvoice/settings', { settings: clean });
      const s = strip(data.settings);
      setSaved(s);
      setForm(s);
      setNextInvoice(data.nextInvoiceNumber || '');
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 2000);
    } catch (err) {
      setMessage({ kind: 'error', text: errorMessage(err, 'Could not save. Please try again.') });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <AdminLayout><div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 animate-spin text-[#00A86B]" /></div></AdminLayout>;
  }
  if (loadError || !form) {
    return (
      <AdminLayout>
        <div className="max-w-md mx-auto mt-16 text-center">
          <p className={`${TXT.value} text-red-500 mb-3`}>{loadError || 'Could not load invoice settings.'}</p>
          <button onClick={retry} className={`h-9 px-4 rounded-lg bg-[#00A86B] text-white ${TXT.label}`}>Try again</button>
        </div>
      </AdminLayout>
    );
  }

  const seriesChanged = !!saved && (form.invoice.prefix !== saved.invoice.prefix || form.invoice.startNumber !== saved.invoice.startNumber);
  const numberPreview = seriesChanged || !nextInvoice ? `${form.invoice.prefix}${pad5(form.invoice.startNumber)}` : nextInvoice;
  const missingGstin = !!seller && !seller.gstin;

  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto pb-10">
        {/* header */}
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <div className="flex items-center gap-2.5">
            <h1 className="text-[18px] font-bold text-[#0F172A]">Invoice Settings</h1>
            <span className="px-2.5 py-1 rounded-md bg-[#F0FDF4] text-[#00A86B] text-[10px] font-bold uppercase tracking-wider">
              {form.format === 'A4' ? 'Classic A4' : 'Thermal 4" × 6"'}
            </span>
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <Toggle on={form.usePlatformBranding} onClick={() => set('usePlatformBranding', !form.usePlatformBranding)} label={`Use ${brandName} Branding`} />
            <span className={`${TXT.label} text-[#0F172A]`}>Use {brandName} Branding</span>
          </label>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_600px] gap-4 items-start">
          {/* ── form ── */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl px-5 sm:px-6 min-w-0">
            <Section title="Invoice Format" desc="Pick the paper your invoices are printed on">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {([['A4', 'Classic A4', 'Standard desktop printers (8.27" × 11.69")'], ['thermal', 'Thermal', 'Thermal label printers (4" × 6")']] as const).map(([value, title, sub]) => {
                  const on = form.format === value;
                  return (
                    <button key={value} type="button" onClick={() => set('format', value)}
                      className={`text-left rounded-xl border-2 p-4 flex items-start gap-3 transition-colors ${on ? 'border-[#00A86B] bg-[#F0FDF4]' : 'border-[#E2E8F0] hover:border-[#CBD5E1]'}`}>
                      <span className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${on ? 'border-[#00A86B]' : 'border-[#CBD5E1]'}`}>
                        {on && <span className="w-2 h-2 rounded-full bg-[#00A86B]" />}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className={`block ${TXT.label} ${on ? 'text-[#00A86B]' : 'text-[#0F172A]'}`}>{title}</span>
                        <span className={`block ${TXT.meta} text-[#64748B] mt-0.5`}>{sub}</span>
                      </span>
                      <span className={`shrink-0 border-2 rounded-sm ${on ? 'border-[#00A86B]' : 'border-[#CBD5E1]'} ${value === 'A4' ? 'w-7 h-10' : 'w-6 h-9'}`} aria-hidden="true" />
                    </button>
                  );
                })}
              </div>
            </Section>

            <Section title="Branding" desc="Choose how your branding appears on the invoice">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className={`${TXT.value} text-[#334155] mb-1.5`}>Brand Name</p>
                  <div className={readOnlyCls}>{seller?.brandName || '—'}</div>
                </div>
                <div>
                  <p className={`${TXT.value} text-[#334155] mb-1.5`}>Company Name</p>
                  <div className={readOnlyCls}>{seller?.companyName || '—'}</div>
                </div>
              </div>
              <p className={`${TXT.meta} text-[#94A3B8] mt-2`}>From your company profile. Change them in Settings → Company Profile.</p>
              <div className="mt-4">
                {form.usePlatformBranding ? (
                  <p className={`${TXT.value} text-[#475569] flex items-start gap-1.5`}>
                    <Info className="w-3.5 h-3.5 mt-0.5 text-[#00A86B] shrink-0" />
                    The {brandName} logo is printed at the top. Turn off “Use {brandName} Branding” to print your own logo.
                  </p>
                ) : (
                  <>
                    <p className={`${TXT.value} text-[#334155] mb-2`}>Your Logo <span className="text-[#94A3B8]">(Optional — your brand name is printed when there is no logo)</span></p>
                    <ImageUpload kind="logo" url={form.logoUrl} onChange={url => set('logoUrl', url)} onError={text => setMessage({ kind: 'error', text })} />
                    <p className={`${TXT.meta} text-[#94A3B8] mt-1.5`}>PNG, JPG or WEBP, less than 3 MB.</p>
                  </>
                )}
              </div>
            </Section>

            <Section title="Sold By (Billing Entity)" desc="Mandatory fields appear on every invoice — toggle the optional ones">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4">
                {mandatory.soldBy.map(l => <Check3 key={l} label={l} checked locked />)}
                <Check3 label="Phone Number" checked={form.soldBy.phone} onChange={() => flip('soldBy', 'phone')} />
                <Check3 label="Email Address" checked={form.soldBy.email} onChange={() => flip('soldBy', 'email')} />
                <Check3 label="Website" checked={form.soldBy.website} onChange={() => flip('soldBy', 'website')} />
              </div>
              <div className="mt-3">
                <p className={`${TXT.value} text-[#334155] mb-1.5`}>CIN Number <span className="text-[#94A3B8]">(optional)</span></p>
                <input className={inputCls} value={form.soldBy.cin} maxLength={21} placeholder="e.g. U74999DL2017PTC123456"
                  onChange={e => setIn('soldBy', { cin: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })} />
              </div>
              {missingGstin && (
                <p className={`${TXT.meta} text-[#B45309] mt-2 flex items-start gap-1.5`}>
                  <AlertCircle className="w-3.5 h-3.5 mt-px shrink-0" />
                  No GSTIN on your account, so invoices show “GSTIN: Not registered”. Add your GST details in KYC to print it.
                </p>
              )}
              {form.soldBy.website && seller && !seller.website && (
                <p className={`${TXT.meta} text-[#94A3B8] mt-1`}>Add your website in your company profile — it prints once it is filled.</p>
              )}
            </Section>

            <Section title="Shipping Address (Consignee)" desc="Choose what buyer info shows on the invoice">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4">
                {mandatory.buyer.map(l => <Check3 key={l} label={l} checked locked />)}
                <Check3 label="Customer Phone" checked={form.buyer.phone} onChange={() => flip('buyer', 'phone')} />
                <Check3 label="Customer Email" checked={form.buyer.email} onChange={() => flip('buyer', 'email')} />
              </div>
            </Section>

            <Section title="Invoice Details & Preferences" desc="Configure invoice numbering and which order details to show">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className={`${TXT.value} text-[#334155] mb-1.5`}>Invoice Prefix</p>
                  <input className={inputCls} value={form.invoice.prefix} maxLength={12} placeholder="e.g. INV"
                    onChange={e => setIn('invoice', { prefix: e.target.value.replace(/[^A-Za-z0-9/_-]/g, '') })} />
                </div>
                <div>
                  <p className={`${TXT.value} text-[#334155] mb-1.5`}>Starting Series Number</p>
                  <input className={inputCls} type="number" min={1} inputMode="numeric" value={form.invoice.startNumber || ''} placeholder="1"
                    onChange={e => setIn('invoice', { startNumber: Math.max(0, Math.floor(Number(e.target.value) || 0)) })} />
                </div>
              </div>
              <p className={`${TXT.meta} text-[#64748B] mt-2`}>
                {seriesChanged ? 'First invoice of the new series: ' : 'Next invoice number: '}
                <span className="font-semibold text-[#0F172A]">{numberPreview}</span>
              </p>
              {seriesChanged && (
                <p className={`${TXT.meta} text-[#B45309] mt-1`}>Saving starts a new series. Orders already invoiced keep their number.</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 mt-3">
                {mandatory.invoice.map(l => <Check3 key={l} label={l} checked locked />)}
                <Check3 label="E-Way Bill No." checked={form.invoice.ewayBill} onChange={() => flip('invoice', 'ewayBill')} />
                <Check3 label="Order No." checked={form.invoice.orderNo} onChange={() => flip('invoice', 'orderNo')} />
                <Check3 label="Order Date" checked={form.invoice.orderDate} onChange={() => flip('invoice', 'orderDate')} />
                <Check3 label="Channel" checked={form.invoice.channel} onChange={() => flip('invoice', 'channel')} />
                <Check3 label="Shipped By" checked={form.invoice.shippedBy} onChange={() => flip('invoice', 'shippedBy')} />
                <Check3 label="AWB No." checked={form.invoice.awb} onChange={() => flip('invoice', 'awb')} />
                <Check3 label="Payment Method" checked={form.invoice.paymentMethod} onChange={() => flip('invoice', 'paymentMethod')} />
                <Check3 label="Remarks" checked={form.invoice.remarks} onChange={() => flip('invoice', 'remarks')} />
              </div>
              {form.invoice.remarks && (
                <div className="mt-2">
                  <p className={`${TXT.value} text-[#334155] mb-1.5`}>Remarks text <span className="text-[#94A3B8]">(printed on every invoice)</span></p>
                  <input className={inputCls} value={form.invoice.remarksText} maxLength={200} placeholder="e.g. Thank you for shopping with us!"
                    onChange={e => setIn('invoice', { remarksText: e.target.value })} />
                </div>
              )}
              <p className={`${TXT.meta} text-[#94A3B8] mt-2`}>E-Way Bill No. and AWB No. print only when the order has them.</p>
            </Section>

            <Section title="Product Table & Charges" desc="Pick which columns show in the line items table">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4">
                {mandatory.product.map(l => <Check3 key={l} label={l} checked locked />)}
                <Check3 label="HSN Code" checked={form.product.hsn} onChange={() => flip('product', 'hsn')} />
                <Check3 label="SKU" checked={form.product.sku} onChange={() => flip('product', 'sku')} />
                <Check3 label="Discount" checked={form.product.discount} onChange={() => flip('product', 'discount')} />
                <Check3 label="Net Amount in Words" checked={form.product.amountInWords} onChange={() => flip('product', 'amountInWords')} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                <div>
                  <p className={`${TXT.value} text-[#334155] mb-1.5`} title="Longer SKUs are cut to this many characters">Trim SKU Upto <span className="text-[#94A3B8]">(characters)</span></p>
                  <input className={inputCls} type="number" min={5} max={60} inputMode="numeric" value={form.product.trimSku || ''}
                    onChange={e => setIn('product', { trimSku: Number(e.target.value) || 0 })}
                    onBlur={() => setIn('product', { trimSku: Math.min(60, Math.max(5, Math.floor(form.product.trimSku) || 20)) })} />
                </div>
                <div>
                  <p className={`${TXT.value} text-[#334155] mb-1.5`} title="Longer product names are cut to this many characters">Trim Product Name Upto <span className="text-[#94A3B8]">(characters)</span></p>
                  <input className={inputCls} type="number" min={10} max={200} inputMode="numeric" value={form.product.trimName || ''}
                    onChange={e => setIn('product', { trimName: Number(e.target.value) || 0 })}
                    onBlur={() => setIn('product', { trimName: Math.min(200, Math.max(10, Math.floor(form.product.trimName) || 80)) })} />
                </div>
              </div>
            </Section>

            <Section title="Footer" desc="Signature, declarations and legal text">
              <Check3 label="Reverse Charge Declaration" checked={form.footer.reverseCharge} onChange={() => flip('footer', 'reverseCharge')} />
              <p className={`${TXT.value} text-[#334155] mt-3 mb-2`}>Authorised Signature <span className="text-[#94A3B8]">(Optional)</span></p>
              <ImageUpload kind="signature" url={form.footer.signatureUrl} onChange={url => setIn('footer', { signatureUrl: url })} onError={text => setMessage({ kind: 'error', text })} />
              <p className={`${TXT.meta} text-[#94A3B8] mt-1.5`}><span className="text-[#475569]">Note:</span> Image should be less than 3 MB.</p>
            </Section>

            {/* save bar */}
            <div className="sticky bottom-0 bg-white border-t border-[#E2E8F0] -mx-5 sm:-mx-6 px-5 sm:px-6 py-3 flex items-center gap-3 flex-wrap rounded-b-2xl">
              <button onClick={save} disabled={saving || !dirty}
                className={`h-10 px-6 rounded-lg bg-[#00A86B] text-white ${TXT.label} hover:bg-[#009B63] transition-colors shadow-sm flex items-center gap-2 disabled:opacity-60`}>
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {savedFlash ? <><Check className="w-4 h-4" /> Saved</> : 'Save changes'}
              </button>
              {dirty && (
                <button onClick={() => { setForm(saved); setMessage(null); }} disabled={saving}
                  className={`h-10 px-4 rounded-lg border border-[#E2E8F0] bg-white text-[#475569] ${TXT.label} hover:bg-[#F8FAFC]`}>
                  Discard
                </button>
              )}
              {dirty && !saving && <span className={`${TXT.meta} text-[#B45309]`}>Unsaved changes</span>}
              {message && <span className={`${TXT.meta} ${message.kind === 'error' ? 'text-red-500' : 'text-[#475569]'}`}>{message.text}</span>}
            </div>
          </div>

          {/* ── preview ── */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-3 xl:sticky xl:top-4">
            <div className="flex items-center justify-between gap-2 px-1 pb-2">
              <p className={`${TXT.label} text-[#0F172A]`}>Preview <span className={`${TXT.meta} font-normal text-[#94A3B8]`}>(sample order)</span></p>
              <div className="flex items-center gap-3">
                {previewBusy && <Loader2 className="w-4 h-4 animate-spin text-[#00A86B]" />}
                <button type="button" onClick={() => setRefreshTick(n => n + 1)} title="Refresh preview" className="text-[#64748B] hover:text-[#00A86B]">
                  <RefreshCw className="w-4 h-4" />
                </button>
                {previewUrl && (
                  <a href={previewUrl} target="_blank" rel="noreferrer" title="Open full size" className="text-[#64748B] hover:text-[#00A86B]">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
            <div className={`relative w-full rounded-lg overflow-hidden border border-[#E2E8F0] bg-[#F8FAFC] ${!INLINE_PDF ? 'h-[180px]' : form.format === 'A4' ? 'h-[560px] sm:h-[780px]' : 'h-[560px] sm:h-[640px]'}`}>
              {previewUrl && INLINE_PDF && (
                <iframe key={previewUrl} src={`${previewUrl}#toolbar=0&navpanes=0&view=FitH`} title="Invoice preview" className="w-full h-full" />
              )}
              {previewUrl && !INLINE_PDF && !previewError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                  <p className={`${TXT.value} text-[#475569]`}>Your browser opens PDFs in their own window.</p>
                  <a href={previewUrl} target="_blank" rel="noreferrer"
                    className={`h-10 px-5 rounded-lg bg-[#00A86B] text-white ${TXT.label} inline-flex items-center gap-2`}>
                    <ExternalLink className="w-4 h-4" /> Open preview
                  </a>
                </div>
              )}
              {!previewUrl && !previewError && (
                <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#00A86B]" /></div>
              )}
              {previewError && (
                <div className="absolute inset-0 flex items-center justify-center p-6 text-center bg-white/90">
                  <p className={`${TXT.value} text-red-500`}>{previewError}</p>
                </div>
              )}
            </div>
            <p className={`${TXT.meta} text-[#94A3B8] mt-2 px-1`}>
              Real invoices use each order's buyer, products and charges, and your saved settings.
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
