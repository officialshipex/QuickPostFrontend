/* QuickPost Cargo — Settings → Label. Cargo prints B2B box labels (/b2b/generate-label): one label per box —
   the master AWB plus one per child AWB — four to an A4 page, with Order ID / LRN / OID, box count, payment
   type, shipping and return address. Its options are kept apart from the B2C label's (labelSettings.b2bLabel),
   so changing one panel's label never changes the other's. */
import { useState, useRef, useEffect } from 'react';
import { Check, Loader2, ImagePlus, X as XIcon, Package } from 'lucide-react';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { apiClient } from '../../services/apiClient';

interface B2BLabelOptions {
  showLogoOnLabel: boolean;
  hideCustomerMobile: boolean;
  hideRTOName: boolean;
  hideRTOAddress: boolean;
}

const DEFAULTS: B2BLabelOptions = { showLogoOnLabel: false, hideCustomerMobile: false, hideRTOName: false, hideRTOAddress: false };

function CheckboxRow({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: () => void }) {
  return (
    <div onClick={onChange} className="flex items-start gap-2.5 cursor-pointer group select-none py-1">
      <span className={`mt-0.5 w-[18px] h-[18px] rounded-[5px] border-2 flex items-center justify-center shrink-0 transition-all ${checked ? 'bg-[#00A86B] border-[#00A86B]' : 'bg-white border-[#CBD5E1] group-hover:border-[#00A86B]'}`}>
        {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
      </span>
      <span>
        <span className="block text-[12px] font-semibold text-[#334155] group-hover:text-[#0F172A]">{label}</span>
        {hint && <span className="block text-[11px] text-[#94A3B8]">{hint}</span>}
      </span>
    </div>
  );
}

function Barcode({ value }: { value: string }) {
  const bars: number[] = [];
  for (let i = 0; i < value.length; i++) { const c = value.charCodeAt(i); bars.push((c % 3) + 1, ((c >> 2) % 3) + 1); }
  let x = 0;
  const width = bars.reduce((s, b) => s + b + 1, 0);
  return (
    <svg viewBox={`0 0 ${width} 28`} className="w-[70%] h-7 mx-auto block">
      {bars.map((b, i) => { const r = <rect key={i} x={x} y={0} width={b} height={28} fill="#0F172A" />; x += b + 1; return r; })}
    </svg>
  );
}

/** One box label, laid out like the PDF the backend prints. */
function BoxLabel({ opts, logo, boxNo, total, type }: { opts: B2BLabelOptions; logo: string | null; boxNo: number; total: number; type: string }) {
  const awb = boxNo === 1 ? '1490811234567' : `14908112345${66 + boxNo}`;
  const cell = 'border-b border-[#0F172A] px-2 py-1';
  return (
    <div className="border border-[#0F172A] bg-white text-[9px] leading-[1.35] text-[#0F172A] font-[Helvetica,Arial,sans-serif]">
      <div className={`${cell} grid grid-cols-2 h-9 items-center`}>
        <span className="font-bold text-[#64748B]">Courier logo</span>
        <span className="border-l border-[#0F172A] pl-2 h-full flex items-center">
          {opts.showLogoOnLabel && logo
            ? <img src={logo} alt="" className="max-h-6 max-w-[70px] object-contain" />
            : <span className="font-bold text-[#64748B]">Company logo</span>}
        </span>
      </div>
      <div className={`${cell} grid grid-cols-2 font-bold`}>
        <span>Order ID: 482913<br />Master AWB: 1490811234567</span>
        <span className="border-l border-[#0F172A] pl-2">LRN: 220884512<br />OID: 99017342</span>
      </div>
      <div className={`${cell} py-1.5 text-center font-bold`}><Barcode value={awb} />{awb}</div>
      <div className={`${cell} grid grid-cols-2 font-bold`}>
        <span>Box: {boxNo}/{total}<br />Payment: PREPAID</span>
        <span className="border-l border-[#0F172A] pl-2 flex items-center">{type}</span>
      </div>
      <div className={cell}>
        <span className="font-bold">Shipping Address:</span><br />
        Rahul Traders<br />Plot 14, MIDC Industrial Area<br />Pune, Maharashtra - 411019
        {!opts.hideCustomerMobile && <><br />Ph: 9876543210</>}
      </div>
      <div className="px-2 py-1">
        <span className="font-bold">Return Address:</span><br />
        {!opts.hideRTOName && <>Acme Warehouse<br /></>}
        {!opts.hideRTOAddress && <>Godown 3, Sector 63<br /></>}
        Noida, Uttar Pradesh - 201301
      </div>
    </div>
  );
}

export function CargoLabelSettings() {
  const [opts, setOpts] = useState<B2BLabelOptions>(DEFAULTS);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get('/label/getLabel')
      .then(res => {
        const b = res.data?.b2bLabel || {};
        setOpts({
          showLogoOnLabel: !!b.showLogoOnLabel,
          hideCustomerMobile: !!b.hideCustomerMobile,
          hideRTOName: !!b.hideRTOName,
          hideRTOAddress: !!b.hideRTOAddress,
        });
        if (b.logoUrl) { setLogoUrl(b.logoUrl); setLogoPreview(b.logoUrl); }
      })
      .catch(() => { /* defaults */ })
      .finally(() => setLoading(false));
  }, []);

  const toggle = (key: keyof B2BLabelOptions) => setOpts(prev => ({ ...prev, [key]: !prev[key] }));

  const pickLogo = (file: File | null) => {
    if (!file) return;
    if (logoPreview?.startsWith('blob:')) URL.revokeObjectURL(logoPreview);
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const removeLogo = () => {
    if (logoPreview?.startsWith('blob:')) URL.revokeObjectURL(logoPreview);
    setLogoFile(null); setLogoPreview(null); setLogoUrl(null);
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      let finalLogo = logoUrl;
      if (logoFile) {
        const form = new FormData();
        form.append('logo', logoFile);
        const up = await apiClient.post('/label/uploadLogo', form, { headers: { 'Content-Type': 'multipart/form-data' } });
        finalLogo = up.data.logoUrl;
        if (logoPreview?.startsWith('blob:')) URL.revokeObjectURL(logoPreview);
        setLogoUrl(finalLogo); setLogoPreview(finalLogo); setLogoFile(null);
      }
      // Only b2bLabel is sent — the B2C label's settings stay exactly as they are
      await apiClient.post('/label/saveLabel', { b2bLabel: { ...opts, logoUrl: finalLogo || '' } });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      setError(err?.response?.data?.message || 'Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 animate-spin text-[#00A86B]" /></div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto pb-10 grid grid-cols-1 lg:grid-cols-[1fr_560px] gap-4 items-start">
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6">
          <h1 className="text-[15px] font-bold text-[#0F172A] flex items-center gap-2"><Package className="w-4 h-4 text-[#00A86B]" /> Cargo (B2B) Box Label</h1>
          <p className="text-[12px] text-[#64748B] mt-1 mb-5 leading-relaxed">
            Every box of a Cargo shipment gets its own label — the master AWB on box 1, a child AWB on each other box —
            printed four to an A4 page. These options apply to Cargo labels only; your B2C label is set in the B2C panel.
          </p>

          <h2 className="text-[13px] font-semibold text-[#0F172A] mb-2">Branding</h2>
          <CheckboxRow label="Show my logo on the label" hint="Otherwise the company logo is printed" checked={opts.showLogoOnLabel} onChange={() => toggle('showLogoOnLabel')} />
          {opts.showLogoOnLabel && (
            <div className="ml-[28px] mt-1 mb-3 flex items-center gap-3">
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={e => pickLogo(e.target.files?.[0] || null)} />
              {logoPreview ? (
                <div className="flex items-center gap-2.5">
                  <img src={logoPreview} alt="Logo preview" className="h-10 max-w-[100px] object-contain border border-[#E2E8F0] rounded-lg p-1" />
                  <button type="button" onClick={() => logoInputRef.current?.click()} className="text-[12px] text-[#00A86B] hover:underline">Change</button>
                  <button type="button" onClick={removeLogo} className="text-[#94A3B8] hover:text-red-500"><XIcon className="w-3.5 h-3.5" /></button>
                </div>
              ) : (
                <button type="button" onClick={() => logoInputRef.current?.click()}
                  className="flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-dashed border-[#CBD5E1] text-[#64748B] text-[12px] hover:border-[#00A86B] hover:text-[#00A86B]">
                  <ImagePlus className="w-4 h-4" /> Choose file
                </button>
              )}
            </div>
          )}

          <h2 className="text-[13px] font-semibold text-[#0F172A] mt-4 mb-2">Shipping address</h2>
          <CheckboxRow label="Hide buyer mobile number" checked={opts.hideCustomerMobile} onChange={() => toggle('hideCustomerMobile')} />

          <h2 className="text-[13px] font-semibold text-[#0F172A] mt-4 mb-2">Return address</h2>
          <CheckboxRow label="Hide return contact name" checked={opts.hideRTOName} onChange={() => toggle('hideRTOName')} />
          <CheckboxRow label="Hide return street address" hint="City, state and pincode always print" checked={opts.hideRTOAddress} onChange={() => toggle('hideRTOAddress')} />

          {error && <p className="text-[12px] text-red-500 mt-4">{error}</p>}
          <button onClick={handleSave} disabled={saving}
            className="mt-6 h-10 px-6 rounded-lg bg-[#00A86B] text-white text-[12px] font-semibold hover:bg-[#009B63] shadow-sm flex items-center gap-2 disabled:opacity-70">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saved ? <><Check className="w-4 h-4" /> Saved</> : 'Save'}
          </button>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 lg:sticky lg:top-4">
          <p className="text-[12px] font-semibold text-[#64748B] mb-3">Preview — a 2-box shipment</p>
          <div className="grid grid-cols-2 gap-3">
            <BoxLabel opts={opts} logo={logoPreview} boxNo={1} total={2} type="Master" />
            <BoxLabel opts={opts} logo={logoPreview} boxNo={2} total={2} type="Child" />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
