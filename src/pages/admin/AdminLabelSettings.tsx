import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { Check, Loader2, ImagePlus, X as XIcon } from 'lucide-react';

const TXT = {
  title: 'text-[14px] font-semibold',
  label: 'text-[12px] font-semibold',
  value: 'text-[12px] font-normal',
};

interface LabelSettings {
  showLogo: boolean;
  hideCustomerMobile: boolean;
  hideCustomerBarcode: boolean;
  hideGstNumber: boolean;
  hideRtoAddress: boolean;
  hidePickupMobile: boolean;
  hidePickupName: boolean;
  hidePickupAddress: boolean;
  hideRtoName: boolean;
  hideRtoMobile: boolean;
  hideHsn: boolean;
  hideQty: boolean;
  hideOrderAmount: boolean;
  hideSku: boolean;
  hideTotalAmount: boolean;
  hideProduct: boolean;
}

const DEFAULT_SETTINGS: LabelSettings = {
  showLogo: false,
  hideCustomerMobile: false,
  hideCustomerBarcode: false,
  hideGstNumber: false,
  hideRtoAddress: false,
  hidePickupMobile: false,
  hidePickupName: false,
  hidePickupAddress: false,
  hideRtoName: false,
  hideRtoMobile: false,
  hideHsn: false,
  hideQty: true,
  hideOrderAmount: true,
  hideSku: false,
  hideTotalAmount: true,
  hideProduct: true,
};

const LABEL_SETTINGS_KEY = 'quickpost.labelSettings';
const LABEL_SIZE_KEY = 'quickpost.labelSize';

function loadSavedSettings(): LabelSettings {
  try {
    const raw = localStorage.getItem(LABEL_SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function loadSavedLabelSize(): 'a4' | 'thermal' {
  try {
    const raw = localStorage.getItem(LABEL_SIZE_KEY);
    return raw === 'thermal' ? 'thermal' : 'a4';
  } catch {
    return 'a4';
  }
}

// Deterministic pseudo-barcode: bar widths are derived from each character's code point,
// not randomly, so the same value always renders the same pattern (unlike index-based noise).
function Barcode({ value, height = 36 }: { value: string; height?: number }) {
  const bars: { w: number; gap: number }[] = [];
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    bars.push({ w: (code % 3) + 1, gap: ((code >> 2) % 3) + 1 });
    bars.push({ w: ((code >> 4) % 3) + 1, gap: ((code >> 6) % 2) + 1 });
  }
  const totalWidth = bars.reduce((sum, b) => sum + b.w + b.gap, 0);

  return (
    <svg viewBox={`0 0 ${totalWidth} ${height}`} width={Math.min(totalWidth * 1.6, 160)} height={height} className="block">
      {(() => {
        let x = 0;
        return bars.map((b, i) => {
          const rect = <rect key={i} x={x} y={0} width={b.w} height={height} fill="#0F172A" />;
          x += b.w + b.gap;
          return rect;
        });
      })()}
    </svg>
  );
}

function CheckboxRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <div
      onClick={onChange}
      className="flex items-center gap-2.5 cursor-pointer group select-none py-0.5"
    >
      <span
        className={`w-[18px] h-[18px] rounded-[5px] border-2 flex items-center justify-center shrink-0 transition-all ${
          checked ? 'bg-[#00A86B] border-[#00A86B]' : 'bg-white border-[#CBD5E1] group-hover:border-[#00A86B]'
        }`}
      >
        {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
      </span>
      <span className={`${TXT.value} text-[#475569] group-hover:text-[#0F172A] transition-colors`}>{label}</span>
    </div>
  );
}

function LabelPreview({ settings, logoUrl }: { settings: LabelSettings; logoUrl: string | null }) {
  return (
    <div className="bg-white border border-[#0F172A]/80 rounded-lg p-5 text-[11px] text-[#1E293B] leading-relaxed font-sans">
      {settings.showLogo && logoUrl && (
        <img src={logoUrl} alt="Company logo" className="h-10 max-w-[140px] object-contain mb-3" />
      )}
      <p className={TXT.label}>To:</p>
      <p className="mt-1">narinder kaur</p>
      <p>block c 14/2 new govind pura street no-8 near</p>
      <p>gandhi park</p>
      <p>East Delhi, DELHI, 110051</p>
      {!settings.hideCustomerMobile && <p>MOBILE NO: 9718794406</p>}

      <div className="h-px bg-[#CBD5E1] my-3" />

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-0.5">
          <p><span className={TXT.label}>Order Date:</span> Mar 7, 2025</p>
          <p><span className={TXT.label}>Invoice No:</span> 843987</p>
          {!settings.hideGstNumber && <p><span className={TXT.label}>GSTIN No:</span> 22XXXXX0000SHI</p>}
        </div>
        {!settings.hideCustomerBarcode && (
          <div className="text-center shrink-0">
            <Barcode value="1234ABCD" />
            <p className="text-[10px] mt-1 tracking-wider">1234ABCD</p>
          </div>
        )}
      </div>

      <div className="h-px bg-[#CBD5E1] my-3" />

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-0.5">
          <p><span className={TXT.label}>MODE:</span> PREPAID</p>
          <p><span className={TXT.label}>WEIGHT:</span> 0.4</p>
          <p><span className={TXT.label}>Dimensions (cm):</span> 10*10*10</p>
        </div>
        <div className="text-center shrink-0">
          <p className={`${TXT.label} mb-1`}>SHIPEX INDIA</p>
          <Barcode value="35973710008735" />
          <p className="text-[10px] mt-1 tracking-wider">35973710008735</p>
        </div>
      </div>

      {(!settings.hideSku || !settings.hideHsn) && (
        <table className="w-full border-collapse mt-3 text-[11px]">
          <thead>
            <tr className="bg-[#F1F5F9]">
              {!settings.hideSku && <th className="border border-[#CBD5E1] px-2 py-1 text-left">SKU</th>}
              {!settings.hideHsn && <th className="border border-[#CBD5E1] px-2 py-1 text-left">HSN</th>}
            </tr>
          </thead>
          <tbody>
            <tr>
              {!settings.hideSku && <td className="border border-[#CBD5E1] px-2 py-1">1</td>}
              {!settings.hideHsn && <td className="border border-[#CBD5E1] px-2 py-1">AAA</td>}
            </tr>
          </tbody>
        </table>
      )}

      {!settings.hidePickupAddress && (
        <div className="mt-3">
          <p className={TXT.label}>Pickup Address:</p>
          {!settings.hidePickupName && <p>Ajeet Kumar</p>}
          <p>Vaidic Panchgavyya, Near LIC Building, Laxmi Sweets, Sagwan Chowk</p>
          <p>Sirsa, HARYANA, 125055</p>
          {!settings.hidePickupMobile && <p>Mobile No: 9518156020</p>}
        </div>
      )}

      {!settings.hideRtoAddress && (
        <div className="mt-3">
          <p className={TXT.label}>Return Address:</p>
          {!settings.hideRtoName && <p>Ajeet Kumar</p>}
          <p>Vaidic Panchgavyya, Near LIC Building, Laxmi Sweets, Sagwan Chowk</p>
          <p>Sirsa, HARYANA, 125055</p>
          {!settings.hideRtoMobile && <p>Mobile No: 9518156020</p>}
        </div>
      )}

      <div className="h-px bg-[#CBD5E1] my-3" />

      <p>This is a computer-generated document, hence does not require a signature.</p>
      <p><span className={TXT.label}>Note:</span> All disputes are subject to Delhi jurisdiction. Goods once sold will only be taken back or exchanged as per the store's exchange/return policy.</p>
    </div>
  );
}

export function AdminLabelSettings() {
  const [activeTab, setActiveTab] = useState<'customization' | 'size'>('customization');
  const [settings, setSettings] = useState<LabelSettings>(loadSavedSettings);
  const [labelSize, setLabelSize] = useState<'a4' | 'thermal'>(loadSavedLabelSize);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggle = (key: keyof LabelSettings) => setSettings(prev => ({ ...prev, [key]: !prev[key] }));

  const handleLogoChange = (file: File | null) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setLogoUrl(prev => { if (prev) URL.revokeObjectURL(prev); return url; });
  };

  const removeLogo = () => {
    setLogoUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null; });
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  const handleSave = async () => {
    setSaving(true);
    // TODO: no label-settings backend endpoint exists yet — persisted to localStorage in the
    // meantime so Save/reload actually works; swap in a real API call once the route is confirmed.
    try {
      localStorage.setItem(LABEL_SETTINGS_KEY, JSON.stringify(settings));
      localStorage.setItem(LABEL_SIZE_KEY, labelSize);
    } catch { /* storage unavailable — settings just won't persist across reloads */ }
    await new Promise(res => setTimeout(res, 400));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto pb-10">
        {/* Tabs */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setActiveTab('customization')}
            className={`h-9 px-4 rounded-lg ${TXT.label} transition-colors ${activeTab === 'customization' ? 'bg-[#00A86B] text-white shadow-sm' : 'bg-white border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]'}`}
          >
            Label Customization
          </button>
          <button
            onClick={() => setActiveTab('size')}
            className={`h-9 px-4 rounded-lg ${TXT.label} transition-colors ${activeTab === 'size' ? 'bg-[#00A86B] text-white shadow-sm' : 'bg-white border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]'}`}
          >
            Label Size
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'customization' ? (
            <motion.div
              key="customization"
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-4 items-start"
            >
              {/* Left: settings form */}
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6">
                <h2 className={`${TXT.title} text-[#0F172A] mb-3`}>Common Setting</h2>
                <div className="flex flex-col gap-1 mb-5">
                  <CheckboxRow label="Show Logo on Label" checked={settings.showLogo} onChange={() => toggle('showLogo')} />

                  {settings.showLogo && (
                    <div className="ml-[26px] mt-1 mb-2 flex items-center gap-3">
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleLogoChange(e.target.files?.[0] || null)}
                      />
                      {logoUrl ? (
                        <div className="flex items-center gap-2.5">
                          <img src={logoUrl} alt="Logo preview" className="h-10 max-w-[100px] object-contain border border-[#E2E8F0] rounded-lg p-1" />
                          <button
                            type="button"
                            onClick={() => logoInputRef.current?.click()}
                            className={`${TXT.value} text-[#00A86B] hover:underline`}
                          >
                            Change
                          </button>
                          <button
                            type="button"
                            onClick={removeLogo}
                            className="text-[#94A3B8] hover:text-red-500 transition-colors"
                          >
                            <XIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => logoInputRef.current?.click()}
                          className={`flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-dashed border-[#CBD5E1] text-[#64748B] ${TXT.value} hover:border-[#00A86B] hover:text-[#00A86B] transition-colors`}
                        >
                          <ImagePlus className="w-4 h-4" /> Choose file
                        </button>
                      )}
                    </div>
                  )}

                  <CheckboxRow label="Hide Customer Mobile Number" checked={settings.hideCustomerMobile} onChange={() => toggle('hideCustomerMobile')} />
                  <CheckboxRow label="Hide Customer Order Barcode" checked={settings.hideCustomerBarcode} onChange={() => toggle('hideCustomerBarcode')} />
                </div>

                <h2 className={`${TXT.title} text-[#0F172A] mb-3`}>Warehouse Setting</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 mb-5">
                  <CheckboxRow label="Hide Gst Number" checked={settings.hideGstNumber} onChange={() => toggle('hideGstNumber')} />
                  <CheckboxRow label="Hide Pickup Address" checked={settings.hidePickupAddress} onChange={() => toggle('hidePickupAddress')} />
                  <CheckboxRow label="Hide R T O Address" checked={settings.hideRtoAddress} onChange={() => toggle('hideRtoAddress')} />
                  <CheckboxRow label="Hide R T O Name" checked={settings.hideRtoName} onChange={() => toggle('hideRtoName')} />
                  <CheckboxRow label="Hide Pickup Mobile" checked={settings.hidePickupMobile} onChange={() => toggle('hidePickupMobile')} />
                  <CheckboxRow label="Hide R T O Mobile" checked={settings.hideRtoMobile} onChange={() => toggle('hideRtoMobile')} />
                  <CheckboxRow label="Hide Pickup Name" checked={settings.hidePickupName} onChange={() => toggle('hidePickupName')} />
                </div>

                <h2 className={`${TXT.title} text-[#0F172A] mb-3`}>Hide/Show Product Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 mb-6">
                  <CheckboxRow label="Hide H S N" checked={settings.hideHsn} onChange={() => toggle('hideHsn')} />
                  <CheckboxRow label="Hide S K U" checked={settings.hideSku} onChange={() => toggle('hideSku')} />
                  <CheckboxRow label="Hide Qty" checked={settings.hideQty} onChange={() => toggle('hideQty')} />
                  <CheckboxRow label="Hide Total Amount" checked={settings.hideTotalAmount} onChange={() => toggle('hideTotalAmount')} />
                  <CheckboxRow label="Hide Order Amount" checked={settings.hideOrderAmount} onChange={() => toggle('hideOrderAmount')} />
                  <CheckboxRow label="Hide Product" checked={settings.hideProduct} onChange={() => toggle('hideProduct')} />
                </div>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={`h-10 px-6 rounded-lg bg-[#00A86B] text-white ${TXT.label} hover:bg-[#009B63] transition-colors shadow-sm flex items-center gap-2 disabled:opacity-70`}
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {saved ? <><Check className="w-4 h-4" /> Saved</> : 'Save'}
                </button>
              </div>

              {/* Right: live preview */}
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 lg:sticky lg:top-4">
                <LabelPreview settings={settings} logoUrl={logoUrl} />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="size"
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="bg-white border border-[#E2E8F0] rounded-2xl p-6"
            >
              <p className={`${TXT.value} text-[#475569] mb-4`}>Choose the label size that matches your printer type.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* A4 option */}
                <button
                  onClick={() => setLabelSize('a4')}
                  className={`text-left rounded-2xl border-2 p-5 transition-all ${labelSize === 'a4' ? 'border-[#00A86B] bg-[#F0FDF4]' : 'border-[#E2E8F0] hover:border-[#CBD5E1]'}`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${labelSize === 'a4' ? 'border-[#00A86B]' : 'border-[#CBD5E1]'}`}>
                      {labelSize === 'a4' && <span className="w-2 h-2 rounded-full bg-[#00A86B]" />}
                    </span>
                    <div>
                      <p className={`${TXT.label} ${labelSize === 'a4' ? 'text-[#00A86B]' : 'text-[#0F172A]'}`}>Standard Desktop Printers - Size A4 (8"X11")</p>
                      <p className={`${TXT.value} text-[#94A3B8] mt-0.5`}>(Four Label Printed on one Sheet)</p>
                    </div>
                  </div>
                  <div className="flex justify-center mt-6">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-[#64748B] mb-1">8" (inches)</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#64748B] [writing-mode:vertical-rl] rotate-180">11" (inches)</span>
                        <div className="grid grid-cols-2 grid-rows-2 w-[120px] h-[150px] border border-[#94A3B8]">
                          {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="border border-[#CBD5E1]" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </button>

                {/* Thermal option */}
                <button
                  onClick={() => setLabelSize('thermal')}
                  className={`text-left rounded-2xl border-2 p-5 transition-all ${labelSize === 'thermal' ? 'border-[#00A86B] bg-[#F0FDF4]' : 'border-[#E2E8F0] hover:border-[#CBD5E1]'}`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${labelSize === 'thermal' ? 'border-[#00A86B]' : 'border-[#CBD5E1]'}`}>
                      {labelSize === 'thermal' && <span className="w-2 h-2 rounded-full bg-[#00A86B]" />}
                    </span>
                    <div>
                      <p className={`${TXT.label} ${labelSize === 'thermal' ? 'text-[#00A86B]' : 'text-[#0F172A]'}`}>Thermal Label Printers - Size (4"X6")</p>
                      <p className={`${TXT.value} text-[#94A3B8] mt-0.5`}>(Single Label on one Sheet)</p>
                    </div>
                  </div>
                  <div className="flex justify-center mt-6">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-[#64748B] mb-1">4" (inches)</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#64748B] [writing-mode:vertical-rl] rotate-180">6" (inches)</span>
                        <div className="w-[90px] h-[150px] border-2 border-dashed border-[#94A3B8] flex items-center justify-center p-2">
                          <div className="w-full h-full border border-[#CBD5E1]" />
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className={`h-10 px-6 rounded-lg bg-[#00A86B] text-white ${TXT.label} hover:bg-[#009B63] transition-colors shadow-sm flex items-center gap-2 disabled:opacity-70 mt-5`}
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saved ? <><Check className="w-4 h-4" /> Saved</> : 'Submit'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
}
