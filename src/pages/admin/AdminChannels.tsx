import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import {
  ArrowLeft, Plus, ShoppingBag, ChevronDown, Check,
  Trash2, Pencil, RefreshCw, Loader2, AlertTriangle,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { apiClient } from '../../services/apiClient';

type ChannelView = 'list' | 'add' | 'woocommerce' | 'shopify';

// ─── Pill single-select dropdown ────────────────────────────────────────────
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

// ─── Types ──────────────────────────────────────────────────────────────────
interface Channel {
  _id: string;
  channel: 'WooCommerce' | 'Shopify';
  storeName: string;
  storeURL: string;
  storeClientId?: string;
  storeClientSecret?: string;
  storeAccessToken?: string;
  orderSyncFrequency?: string;
  paymentStatus?: { COD?: string; Prepaid?: string };
  multiSeller?: boolean;
  syncInventory?: boolean;
  syncFromDate?: string;
  lastSync?: string;
}

const PAYMENT_STATUS_OPTIONS = [
  'Booked', 'Ready To Ship', 'Pickup Scheduled', 'In-transit', 'Delivered',
];

// Backend enum: daily | weekly | monthly
const SYNC_FREQUENCY_OPTIONS: PillOption[] = [
  { label: 'Daily',   value: 'daily'   },
  { label: 'Weekly',  value: 'weekly'  },
  { label: 'Monthly', value: 'monthly' },
];

const emptyForm = {
  storeName: '', storeURL: '', storeClientId: '', storeClientSecret: '',
  storeAccessToken: '', orderSyncFrequency: '', paymentStatusCOD: '',
  paymentStatusPrepaid: '', multiSeller: false, syncInventory: false, syncDate: '',
};

const VIEW_PARAM_TO_VIEW: Record<string, ChannelView> = {
  add: 'add', woocommerce: 'woocommerce', shopify: 'shopify',
};

export function AdminChannels() {
  const [searchParams, setSearchParams] = useSearchParams();
  const view: ChannelView = VIEW_PARAM_TO_VIEW[searchParams.get('view') || ''] || 'list';
  const editId = searchParams.get('id') || '';
  const isEditing = !!editId;
  const isWoo = view === 'woocommerce';

  // ── List state
  const [channels, setChannels]           = useState<Channel[]>([]);
  const [loading, setLoading]             = useState(false);
  const [listError, setListError]         = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId]       = useState<string | null>(null);
  const [syncingId, setSyncingId]         = useState<string | null>(null);

  // ── Form state
  const [form, setForm]                   = useState(emptyForm);
  const [formErrors, setFormErrors]       = useState<Record<string, string>>({});
  const [submitting, setSubmitting]       = useState(false);
  const [editLoading, setEditLoading]     = useState(false);

  const goToView = (v: ChannelView | 'list', id?: string) => {
    const params: Record<string, string> = {};
    if (v !== 'list') params.view = v;
    if (id) params.id = id;
    setSearchParams(params, { replace: false });
  };

  const resetForm = () => { setForm(emptyForm); setFormErrors({}); };

  // ── Fetch all channels (called on list view mount / after mutations)
  const fetchChannels = useCallback(async () => {
    setLoading(true); setListError('');
    try {
      const res = await apiClient.get('/channel/getAllChannel');
      setChannels(res.data?.data || []);
    } catch {
      setListError('Failed to load channels. Please refresh.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (view === 'list') fetchChannels();
  }, [view, fetchChannels]);

  // ── Pre-fill form when editing an existing channel
  useEffect(() => {
    if (!editId || (view !== 'woocommerce' && view !== 'shopify')) return;
    setEditLoading(true);
    apiClient.get(`/channel/getOneChannel/${editId}`)
      .then(res => {
        const ch: Channel = res.data?.data || res.data || {};
        setForm({
          storeName:          ch.storeName || '',
          storeURL:           ch.storeURL || '',
          storeClientId:      ch.storeClientId || '',
          storeClientSecret:  ch.storeClientSecret || '',
          storeAccessToken:   ch.storeAccessToken || '',
          orderSyncFrequency: ch.orderSyncFrequency || '',
          paymentStatusCOD:   ch.paymentStatus?.COD || '',
          paymentStatusPrepaid: ch.paymentStatus?.Prepaid || '',
          multiSeller:        ch.multiSeller ?? false,
          syncInventory:      ch.syncInventory ?? false,
          syncDate:           ch.syncFromDate ? ch.syncFromDate.slice(0, 10) : '',
        });
      })
      .catch(() => {})
      .finally(() => setEditLoading(false));
  }, [editId, view]);

  // ── Submit: create or update
  const handleSubmit = async () => {
    const errs: Record<string, string> = {};
    if (!form.storeName.trim())      errs.storeName      = 'Required';
    if (!form.storeURL.trim())       errs.storeURL       = 'Required';
    if (!form.storeClientId.trim())  errs.storeClientId  = 'Required';
    if (!form.storeClientSecret.trim()) errs.storeClientSecret = 'Required';
    if (!isWoo && !form.storeAccessToken.trim()) errs.storeAccessToken = 'Required';
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      const body: Record<string, any> = {
        channel:          isWoo ? 'WooCommerce' : 'Shopify',
        storeName:        form.storeName.trim(),
        storeURL:         form.storeURL.trim(),
        storeClientId:    form.storeClientId.trim(),
        storeClientSecret: form.storeClientSecret.trim(),
        multiSeller:      form.multiSeller,
        syncInventory:    form.syncInventory,
      };
      if (!isWoo)                    body.storeAccessToken   = form.storeAccessToken.trim();
      if (form.orderSyncFrequency)   body.orderSyncFrequency = form.orderSyncFrequency;
      if (form.paymentStatusCOD)     body.paymentStatusCOD   = form.paymentStatusCOD;
      if (form.paymentStatusPrepaid) body.paymentStatusPrepaid = form.paymentStatusPrepaid;
      if (form.syncDate)             body.syncDate           = form.syncDate;

      if (isEditing) {
        await apiClient.put(`/channel/updateChannel/${editId}`, body);
      } else {
        await apiClient.post('/channel/storeAllChannelDetails', body);
      }
      resetForm();
      goToView('list');
    } catch (e: any) {
      setFormErrors({ submit: e?.response?.data?.message || 'Failed to save channel. Please try again.' });
    } finally { setSubmitting(false); }
  };

  // ── Delete with confirmation
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await apiClient.delete(`/channel/delete/${id}`);
      setChannels(prev => prev.filter(c => c._id !== id));
    } catch {}
    finally { setDeletingId(null); setConfirmDeleteId(null); }
  };

  // ── Sync existing orders from the connected store
  const handleSync = async (id: string) => {
    setSyncingId(id);
    try {
      await apiClient.post('/channel/fetchOrder', {});
    } catch {}
    finally { setSyncingId(null); }
  };

  const inputCls = (err?: string) =>
    `w-full h-11 px-4 bg-white border rounded-full text-[13px] font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-2 focus:ring-[#00A86B]/10 transition-all ${err ? 'border-red-400' : 'border-[#E2E8F0]'}`;
  const labelCls = 'block text-[13px] font-semibold text-[#334155] mb-1.5';
  const errCls   = 'text-[11px] text-red-500 mt-1';

  // ── Channel list view ──────────────────────────────────────────────────────
  if (view === 'list') {
    return (
      <AdminLayout>
        <div className="max-w-[1400px] mx-auto pb-10">
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-[20px] font-bold text-[#0F172A]">Channels</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchChannels}
                disabled={loading}
                className="w-9 h-9 flex items-center justify-center rounded-full border border-[#E2E8F0] text-[#64748B] hover:text-[#00A86B] hover:border-[#00A86B] transition-colors"
                title="Refresh"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => { resetForm(); goToView('add'); }}
                className="flex items-center gap-1.5 h-10 px-4 rounded-full bg-[#00A86B] text-white text-[13px] font-bold hover:bg-[#009B63] transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" /> New Channel
              </button>
            </div>
          </div>

          {listError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-[13px] text-red-600">{listError}</p>
            </div>
          )}

          {loading ? (
            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm py-24 flex items-center justify-center gap-2 text-[#94A3B8]">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-[14px] font-medium">Loading channels…</span>
            </div>
          ) : channels.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm py-24 flex items-center justify-center">
              <p className="text-[15px] font-bold text-[#334155]">No Channels Found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {channels.map(ch => (
                <div key={ch._id} className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${ch.channel === 'WooCommerce' ? 'bg-[#7F54B3]/10' : 'bg-[#95BF47]/10'}`}>
                        {ch.channel === 'WooCommerce'
                          ? <span className="text-[#7F54B3] font-black text-[10px]">Woo</span>
                          : <ShoppingBag className="w-5 h-5 text-[#95BF47]" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[14px] font-bold text-[#0F172A] truncate">{ch.storeName}</div>
                        <div className="text-[11px] font-semibold text-[#94A3B8]">{ch.channel}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Sync */}
                      <button
                        onClick={() => handleSync(ch._id)}
                        disabled={syncingId === ch._id}
                        title="Sync orders"
                        className="w-8 h-8 flex items-center justify-center rounded-full text-[#64748B] hover:bg-[#F0FDF4] hover:text-[#00A86B] transition-colors"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${syncingId === ch._id ? 'animate-spin' : ''}`} />
                      </button>
                      {/* Edit */}
                      <button
                        onClick={() => goToView(ch.channel === 'WooCommerce' ? 'woocommerce' : 'shopify', ch._id)}
                        title="Edit channel"
                        className="w-8 h-8 flex items-center justify-center rounded-full text-[#64748B] hover:bg-[#F0FDF4] hover:text-[#00A86B] transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {/* Delete */}
                      <button
                        onClick={() => setConfirmDeleteId(ch._id)}
                        title="Delete channel"
                        className="w-8 h-8 flex items-center justify-center rounded-full text-[#64748B] hover:bg-red-50 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="text-[12px] text-[#64748B] truncate">{ch.storeURL}</div>
                  {ch.lastSync && (
                    <div className="text-[11px] text-[#94A3B8] mt-1.5">
                      Last synced: {new Date(ch.lastSync).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Delete confirmation modal */}
        <AnimatePresence>
          {confirmDeleteId && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/40 backdrop-blur-sm"
              onClick={() => setConfirmDeleteId(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm"
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </div>
                  <div>
                    <p className="text-[15px] font-bold text-[#0F172A]">Delete Channel</p>
                    <p className="text-[13px] text-[#64748B] mt-0.5">This will permanently remove the channel and disconnect your store. This action cannot be undone.</p>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="h-9 px-4 rounded-full border border-[#E2E8F0] text-[13px] font-bold text-[#64748B] hover:bg-[#F8FAFC] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(confirmDeleteId)}
                    disabled={!!deletingId}
                    className="h-9 px-4 rounded-full bg-red-500 text-white text-[13px] font-bold hover:bg-red-600 disabled:opacity-60 transition-colors flex items-center gap-1.5"
                  >
                    {deletingId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    Delete
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
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
  const wooSteps = [
    'Fill in your WooCommerce credentials and API details.',
    "If you don't have API details, go to WooCommerce settings and generate a key.",
    'Enable REST API access and set permissions to "read/write".',
    'Copy and paste the generated API key and secret into the form above.',
    'Click "Add Channel" to complete the integration.',
  ];
  const shopifySteps = [
    'Fill in your Shopify Store name, Store URL, Store Client ID and Store client secret.',
    'If you do not have these details, login to your Shopify account and copy the URL from the address bar (Store URL). The Store name is the name of your store.',
    'Click on Settings and in the left menu choose Apps and sales channels.',
    'Click on Develop apps and in the new page, click on Create an App.',
    'Enter the App name and choose the App developer, then click Create.',
    'Click on API credentials. The API key is the Client ID, and the API secret is the Client Secret.',
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
          <h1 className="text-[18px] font-bold text-[#0F172A]">
            {isEditing ? 'Edit' : (isWoo ? 'WooCommerce' : 'Shopify')} {isEditing ? (isWoo ? 'WooCommerce' : 'Shopify') + ' Integration' : 'Integration'}
          </h1>
        </div>

        {editLoading ? (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm py-24 flex items-center justify-center gap-2 text-[#94A3B8]">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-[14px] font-medium">Loading channel details…</span>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-5 items-start">
            <div className="flex-1 w-full bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6">
              {formErrors.submit && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-[13px] text-red-600">{formErrors.submit}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <label className={labelCls}>Store Name <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="Provide your store name" value={form.storeName}
                    onChange={e => setForm(f => ({ ...f, storeName: e.target.value }))}
                    className={inputCls(formErrors.storeName)} />
                  {formErrors.storeName && <p className={errCls}>{formErrors.storeName}</p>}
                </div>

                <div>
                  <label className={labelCls}>Store URL <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="https://yourstore.com" value={form.storeURL}
                    onChange={e => setForm(f => ({ ...f, storeURL: e.target.value }))}
                    className={inputCls(formErrors.storeURL)} />
                  {formErrors.storeURL && <p className={errCls}>{formErrors.storeURL}</p>}
                </div>

                <div>
                  <label className={labelCls}>Store Client ID <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="Provide your consumer key" value={form.storeClientId}
                    onChange={e => setForm(f => ({ ...f, storeClientId: e.target.value }))}
                    className={inputCls(formErrors.storeClientId)} />
                  {formErrors.storeClientId && <p className={errCls}>{formErrors.storeClientId}</p>}
                </div>

                <div>
                  <label className={labelCls}>Store Client Secret <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="Provide your consumer secret" value={form.storeClientSecret}
                    onChange={e => setForm(f => ({ ...f, storeClientSecret: e.target.value }))}
                    className={inputCls(formErrors.storeClientSecret)} />
                  {formErrors.storeClientSecret && <p className={errCls}>{formErrors.storeClientSecret}</p>}
                </div>

                {!isWoo && (
                  <div>
                    <label className={labelCls}>Access Token <span className="text-red-500">*</span></label>
                    <input type="text" placeholder="Provide your Access Token" value={form.storeAccessToken}
                      onChange={e => setForm(f => ({ ...f, storeAccessToken: e.target.value }))}
                      className={inputCls(formErrors.storeAccessToken)} />
                    {formErrors.storeAccessToken && <p className={errCls}>{formErrors.storeAccessToken}</p>}
                  </div>
                )}

                <div>
                  <label className={labelCls}>Order Sync Frequency</label>
                  <PillSelect
                    value={form.orderSyncFrequency}
                    onChange={v => setForm(f => ({ ...f, orderSyncFrequency: v }))}
                    options={SYNC_FREQUENCY_OPTIONS}
                    placeholder="Please Select"
                  />
                </div>

                <div className="md:col-span-2">
                  <div className="text-[13px] font-bold text-[#0F172A] mb-2">Map Payment Statuses</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <div>
                      <label className={labelCls}>COD</label>
                      <PillSelect
                        value={form.paymentStatusCOD}
                        onChange={v => setForm(f => ({ ...f, paymentStatusCOD: v }))}
                        options={PAYMENT_STATUS_OPTIONS.map(o => ({ label: o, value: o }))}
                        placeholder="Payment Status"
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Prepaid</label>
                      <PillSelect
                        value={form.paymentStatusPrepaid}
                        onChange={v => setForm(f => ({ ...f, paymentStatusPrepaid: v }))}
                        options={PAYMENT_STATUS_OPTIONS.map(o => ({ label: o, value: o }))}
                        placeholder="Payment Status"
                      />
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 flex items-center gap-2 pt-1">
                  <input type="checkbox" id="multiSeller" checked={form.multiSeller}
                    onChange={e => setForm(f => ({ ...f, multiSeller: e.target.checked }))}
                    className="w-4 h-4 rounded border-[#CBD5E1] text-[#00A86B] focus:ring-[#00A86B]/30" />
                  <label htmlFor="multiSeller" className="text-[13px] font-semibold text-[#334155]">Enable Multi Seller</label>
                </div>

                <div className="md:col-span-2">
                  <div className="text-[13px] font-bold text-[#0F172A] mb-2">Inventory</div>
                  <div className="flex items-center gap-2 mb-3">
                    <input type="checkbox" id="inventorySync" checked={form.syncInventory}
                      onChange={e => setForm(f => ({ ...f, syncInventory: e.target.checked }))}
                      className="w-4 h-4 rounded border-[#CBD5E1] text-[#00A86B] focus:ring-[#00A86B]/30" />
                    <label htmlFor="inventorySync" className="text-[13px] font-semibold text-[#334155]">Enable Inventory Sync</label>
                  </div>
                  <label className={labelCls}>Sync From Date</label>
                  <input type="date" value={form.syncDate}
                    onChange={e => setForm(f => ({ ...f, syncDate: e.target.value }))}
                    className={`${inputCls()} md:w-[280px]`} />
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="h-10 px-6 rounded-lg bg-[#00A86B] text-white text-[13px] font-bold hover:bg-[#009B63] disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {isEditing ? 'Update Channel' : 'Add Channel'}
                </button>
                <button
                  onClick={() => { resetForm(); goToView('list'); }}
                  className="h-10 px-5 rounded-lg border border-[#E2E8F0] text-[#64748B] text-[13px] font-bold hover:bg-[#F8FAFC] transition-colors"
                >
                  Cancel
                </button>
              </div>
              <p className="text-[12px] text-[#94A3B8] mt-2">
                Please click on the "{isEditing ? 'Update Channel' : 'Add Channel'}" button to {isEditing ? 'save your changes to' : 'integrate with'} your {isWoo ? 'WooCommerce' : 'Shopify'} account.
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
        )}
      </div>
    </AdminLayout>
  );
}
