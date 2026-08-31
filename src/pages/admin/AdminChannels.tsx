import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { ArrowLeft, Plus, ShoppingBag, ChevronDown, Check } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

type ChannelView = 'list' | 'add' | 'woocommerce' | 'shopify';

// ─── Pill single-select dropdown — matches the form's rounded-full field style
//     with an animated panel, instead of a native <select>. ──────────────────
interface PillOption { label: string; value: string; }
function PillSelect({ value, onChange, options, placeholder = 'Please Select', className = '' }: {
  value: string; onChange: (v: string) => void; options: PillOption[]; placeholder?: string; className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectedLabel = options.find(o => o.value === value)?.label;

  return (
    <div ref={ref} className={`relative w-full ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full h-11 px-4 border rounded-full text-[13px] font-medium transition-all flex items-center justify-between gap-2 ${open ? 'border-[#00A86B] ring-2 ring-[#00A86B]/10 bg-white text-[#0F172A]' : 'border-[#E2E8F0] bg-white text-[#0F172A] hover:border-[#00A86B]/50'}`}
      >
        <span className={`truncate ${!selectedLabel ? 'text-[#94A3B8]' : ''}`}>{selectedLabel || placeholder}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="shrink-0 text-[#94A3B8]">
          <ChevronDown className="w-4 h-4" />
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="absolute top-[calc(100%+6px)] left-0 w-full bg-white border border-[#E2E8F0] rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] z-20 overflow-hidden py-1.5"
            >
              <div className="max-h-[240px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                {options.length === 0 ? (
                  <div className="px-4 py-3 text-[13px] text-[#94A3B8] font-medium">No options</div>
                ) : options.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { onChange(opt.value); setOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-[13px] transition-colors flex items-center justify-between gap-2 ${value === opt.value ? 'bg-[#F0FDF4] text-[#00A86B] font-bold' : 'text-[#475569] font-semibold hover:bg-[#F8FAFC] hover:text-[#0F172A]'}`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {value === opt.value && <Check className="w-4 h-4 text-[#00A86B] shrink-0" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

interface Channel {
  _id: string;
  platform: 'WooCommerce' | 'Shopify';
  storeName: string;
  storeUrl: string;
}

const PAYMENT_STATUS_OPTIONS = ['Booked', 'Ready To Ship', 'Pickup Scheduled', 'In-transit', 'Delivered'];
const SYNC_FREQUENCY_OPTIONS = ['Every 15 minutes', 'Every 30 minutes', 'Every 1 hour', 'Every 6 hours', 'Daily'];

const emptyIntegrationForm = {
  storeName: '', storeUrl: '', clientId: '', clientSecret: '', accessToken: '',
  syncFrequency: '', codStatus: '', prepaidStatus: '',
  multiSeller: false, inventorySync: false, syncFromDate: '',
};

const VIEW_PARAM_TO_VIEW: Record<string, ChannelView> = {
  add: 'add', woocommerce: 'woocommerce', shopify: 'shopify',
};

export function AdminChannels() {
  // The current step lives in the URL (?view=add / woocommerce / shopify) instead of
  // plain component state, so the browser Back button steps back through Add Channel →
  // the integration form correctly, and always resolves to the channel list at the end
  // rather than navigating away from the page entirely.
  const [searchParams, setSearchParams] = useSearchParams();
  const view: ChannelView = VIEW_PARAM_TO_VIEW[searchParams.get('view') || ''] || 'list';
  const [channels, setChannels] = useState<Channel[]>([]);
  const [form, setForm] = useState(emptyIntegrationForm);

  const goToView = (v: ChannelView) => {
    if (v === 'list') setSearchParams({}, { replace: false });
    else setSearchParams({ view: v }, { replace: false });
  };

  const resetForm = () => setForm(emptyIntegrationForm);

  const handleAddChannel = (platform: 'WooCommerce' | 'Shopify') => {
    if (!form.storeName.trim() || !form.storeUrl.trim()) return;
    setChannels(prev => [...prev, {
      _id: `dummy-channel-${Date.now()}`,
      platform,
      storeName: form.storeName.trim(),
      storeUrl: form.storeUrl.trim(),
    }]);
    resetForm();
    goToView('list');
  };

  const inputCls = "w-full h-11 px-4 bg-white border border-[#E2E8F0] rounded-full text-[13px] font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-2 focus:ring-[#00A86B]/10 transition-all";
  const labelCls = "block text-[13px] font-semibold text-[#334155] mb-1.5";

  const canSubmit = form.storeName.trim() && form.storeUrl.trim();

  // ─── Channels list ──────────────────────────────────────────────────────────
  if (view === 'list') {
    return (
      <AdminLayout>
        <div className="max-w-[1400px] mx-auto pb-10">
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-[20px] font-bold text-[#0F172A]">Channels</h1>
            <button
              onClick={() => { resetForm(); goToView('add'); }}
              className="flex items-center gap-1.5 h-10 px-4 rounded-full bg-[#00A86B] text-white text-[13px] font-bold hover:bg-[#009B63] transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> New Channel
            </button>
          </div>

          {channels.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm py-24 flex items-center justify-center">
              <p className="text-[15px] font-bold text-[#334155]">No Channels Found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {channels.map(ch => (
                <div key={ch._id} className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-xl bg-[#F0FDF4] flex items-center justify-center shrink-0">
                      <ShoppingBag className="w-5 h-5 text-[#00A86B]" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[14px] font-bold text-[#0F172A] truncate">{ch.storeName}</div>
                      <div className="text-[11px] font-semibold text-[#94A3B8]">{ch.platform}</div>
                    </div>
                  </div>
                  <div className="text-[12px] text-[#64748B] truncate">{ch.storeUrl}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </AdminLayout>
    );
  }

  // ─── Add Channel — platform picker ─────────────────────────────────────────
  if (view === 'add') {
    return (
      <AdminLayout>
        <div className="max-w-[1400px] mx-auto pb-10">
          <div className="flex items-center gap-3 mb-5">
            <button onClick={() => goToView('list')}
              className="w-9 h-9 rounded-full bg-[#F1F5F9] flex items-center justify-center text-[#475569] hover:bg-[#E2E8F0] transition-colors shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-[18px] font-bold text-[#0F172A]">Add Channel</h1>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="w-[280px] bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-xl bg-[#7F54B3]/10 flex items-center justify-center mb-4">
                <span className="text-[#7F54B3] font-black text-[15px] tracking-tight">Woo</span>
              </div>
              <div className="text-[14px] font-bold text-[#0F172A] mb-4">Woocommerce</div>
              <button
                onClick={() => { resetForm(); goToView('woocommerce'); }}
                className="w-20 h-9 rounded-lg bg-[#00A86B] text-white text-[13px] font-bold hover:bg-[#009B63] transition-colors"
              >
                Add
              </button>
            </div>

            <div className="w-[280px] bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-xl bg-[#95BF47]/10 flex items-center justify-center mb-4">
                <ShoppingBag className="w-7 h-7 text-[#95BF47]" />
              </div>
              <div className="text-[14px] font-bold text-[#0F172A] mb-4">Shopify</div>
              <button
                onClick={() => { resetForm(); goToView('shopify'); }}
                className="w-20 h-9 rounded-lg bg-[#00A86B] text-white text-[13px] font-bold hover:bg-[#009B63] transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // ─── WooCommerce / Shopify integration form ────────────────────────────────
  const isWoo = view === 'woocommerce';
  const wooSteps = [
    'Fill in your WooCommerce credentials and API details.',
    "If you don't have API details, go to WooCommerce settings and generate a key.",
    'Enable REST API access and set permissions to "read/write".',
    'Copy and paste the generated API key and secret into the form above.',
    'Click "Add Channel" to complete the integration.',
  ];
  const shopifySteps = [
    'Fill in your Shopify Store name, Store URL, Store Client ID and Store client secret. Enter the details and click on add Channel to connect Shopify with Shipex.',
    'If you do not have these details available, Login to your Shopify account and copy the URL link in the address bar. This is the store URL. Store name is the name of your store.',
    'Click on settings and in the left menu choose apps and sales channels.',
    'Click on develop apps and in the new page, click on Create an App.',
    'Enter the App name and choose the app developer and click on Create.',
    'Click on API credentials. The API key is the Client ID, and the API secret is the client secret. Use the details provided to enter in the Carrier application and connect Shopify.',
  ];

  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto pb-10">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => goToView('add')}
            className="w-9 h-9 rounded-full bg-[#F1F5F9] flex items-center justify-center text-[#475569] hover:bg-[#E2E8F0] transition-colors shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </button>
          {isWoo ? (
            <span className="w-6 h-6 rounded-md bg-[#7F54B3]/10 flex items-center justify-center text-[#7F54B3] font-black text-[9px]">Woo</span>
          ) : (
            <ShoppingBag className="w-6 h-6 text-[#95BF47]" />
          )}
          <h1 className="text-[18px] font-bold text-[#0F172A]">{isWoo ? 'WooCommerce Integration' : 'Shopify Integration'}</h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-5 items-start">
          <div className="flex-1 w-full bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <label className={labelCls}>Store Name</label>
                <input type="text" placeholder="Provide your store name" value={form.storeName}
                  onChange={(e) => setForm(f => ({ ...f, storeName: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Store URL</label>
                <input type="text" placeholder="Provide your store URL" value={form.storeUrl}
                  onChange={(e) => setForm(f => ({ ...f, storeUrl: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Store Client ID</label>
                <input type="text" placeholder="Provide your consumer key" value={form.clientId}
                  onChange={(e) => setForm(f => ({ ...f, clientId: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Store Client Secret</label>
                <input type="text" placeholder="Provide your consumer secret" value={form.clientSecret}
                  onChange={(e) => setForm(f => ({ ...f, clientSecret: e.target.value }))} className={inputCls} />
              </div>

              {!isWoo && (
                <div>
                  <label className={labelCls}>Access Token</label>
                  <input type="text" placeholder="Provide your Access Token" value={form.accessToken}
                    onChange={(e) => setForm(f => ({ ...f, accessToken: e.target.value }))} className={inputCls} />
                </div>
              )}

              <div>
                <label className={labelCls}>Order Sync Frequency</label>
                <PillSelect
                  value={form.syncFrequency}
                  onChange={(v) => setForm(f => ({ ...f, syncFrequency: v }))}
                  options={SYNC_FREQUENCY_OPTIONS.map(o => ({ label: o, value: o }))}
                  placeholder="Please Select"
                />
              </div>

              <div className="md:col-span-2">
                <div className="text-[13px] font-bold text-[#0F172A] mb-2">Map Payment Statuses</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <div>
                    <label className={labelCls}>COD</label>
                    <PillSelect
                      value={form.codStatus}
                      onChange={(v) => setForm(f => ({ ...f, codStatus: v }))}
                      options={PAYMENT_STATUS_OPTIONS.map(o => ({ label: o, value: o }))}
                      placeholder="Payment Status"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Prepaid</label>
                    <PillSelect
                      value={form.prepaidStatus}
                      onChange={(v) => setForm(f => ({ ...f, prepaidStatus: v }))}
                      options={PAYMENT_STATUS_OPTIONS.map(o => ({ label: o, value: o }))}
                      placeholder="Payment Status"
                    />
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 flex items-center gap-2 pt-1">
                <input type="checkbox" id="multiSeller" checked={form.multiSeller}
                  onChange={(e) => setForm(f => ({ ...f, multiSeller: e.target.checked }))}
                  className="w-4 h-4 rounded border-[#CBD5E1] text-[#00A86B] focus:ring-[#00A86B]/30" />
                <label htmlFor="multiSeller" className="text-[13px] font-semibold text-[#334155]">Enable Multi Seller</label>
              </div>

              <div className="md:col-span-2">
                <div className="text-[13px] font-bold text-[#0F172A] mb-2">Inventory</div>
                <div className="flex items-center gap-2 mb-3">
                  <input type="checkbox" id="inventorySync" checked={form.inventorySync}
                    onChange={(e) => setForm(f => ({ ...f, inventorySync: e.target.checked }))}
                    className="w-4 h-4 rounded border-[#CBD5E1] text-[#00A86B] focus:ring-[#00A86B]/30" />
                  <label htmlFor="inventorySync" className="text-[13px] font-semibold text-[#334155]">Enable Inventory Sync</label>
                </div>
                <label className={labelCls}>Sync From Date</label>
                <input type="date" value={form.syncFromDate}
                  onChange={(e) => setForm(f => ({ ...f, syncFromDate: e.target.value }))}
                  className={`${inputCls} md:w-[280px]`} />
              </div>
            </div>

            <button
              onClick={() => handleAddChannel(isWoo ? 'WooCommerce' : 'Shopify')}
              disabled={!canSubmit}
              className="mt-6 h-10 px-6 rounded-lg bg-[#94A3B8] text-white text-[13px] font-bold enabled:bg-[#00A86B] enabled:hover:bg-[#009B63] disabled:cursor-not-allowed transition-colors"
            >
              Add Channel
            </button>
            <p className="text-[12px] text-[#94A3B8] mt-2">
              Please click on the "Add Channel" button, to integrate with your {isWoo ? 'WooCommerce' : 'shopify'} account.
            </p>
          </div>

          <div className="w-full lg:w-[380px] shrink-0 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6">
            <h3 className="text-[14px] font-bold text-[#0F172A] mb-3">Steps to Integrate {isWoo ? 'WooCommerce' : 'Shopify'}</h3>
            <ol className="space-y-2.5 list-decimal list-inside">
              {(isWoo ? wooSteps : shopifySteps).map((step, i) => (
                <li key={i} className="text-[13px] text-[#475569] leading-relaxed">{step}</li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
