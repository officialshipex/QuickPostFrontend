import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { useAdminTab } from '../../context/AdminUserContext';
import { apiClient } from '../../services/apiClient';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell, MessageSquare, Smartphone, Mail, History,
  RefreshCw, CreditCard, Edit2, X, Send, Search,
  AlertTriangle, CheckCircle, Plus, PhoneCall, Copy, Filter,
} from 'lucide-react';
import { MobilePaginationBar } from '../../hooks/useMobilePaginationBar';

// ─── Types ────────────────────────────────────────────────────────────────────
interface NotifSettings { [key: string]: any }
interface Transaction {
  _id?: string; channelOrderId?: string;
  category: 'credit' | 'debit'; amount: number;
  balanceAfterTransaction: number; description: string; date: string;
}
interface UserResult { _id: string; fullname?: string; name?: string; email?: string }

// ─── Statuses ─────────────────────────────────────────────────────────────────
// fieldKey maps to backend model field names (e.g. Intransit not In-transit)
const STATUSES = [
  { key: 'Booked',          fieldKey: 'Booked',          label: 'Booked',
    tpl: { whatsapp: 'Your order {order_id} has been booked. Track: {tracking_link}', sms: 'Order {order_id} booked. Track: {tracking_link}', email: 'Your order {order_id} has been successfully booked.' },
    subject: 'Your Order has been Booked' },
  { key: 'PickupPending',   fieldKey: 'PickupPending',   label: 'Ready To Ship',
    tpl: { whatsapp: 'Your order {order_id} is ready to ship. Track: {tracking_link}', sms: 'Order {order_id} ready to ship. {tracking_link}', email: 'Your order {order_id} is ready to ship from our warehouse.' },
    subject: 'Your Order is Ready to Ship' },
  { key: 'In-transit',      fieldKey: 'Intransit',       label: 'In Transit',
    tpl: { whatsapp: 'Your order {order_id} is in transit. Track: {tracking_link}', sms: 'Order {order_id} in transit. {tracking_link}', email: 'Your order is currently in transit. Track: {tracking_link}' },
    subject: 'Your Order is In Transit' },
  { key: 'OutForDelivery',  fieldKey: 'OutForDelivery',  label: 'Out for Delivery',
    tpl: { whatsapp: 'Your order {order_id} is out for delivery today. Track: {tracking_link}', sms: 'Order {order_id} out for delivery. {tracking_link}', email: 'Your order is out for delivery. Please be available.' },
    subject: 'Your Order is Out for Delivery' },
  { key: 'Delivered',       fieldKey: 'Delivered',       label: 'Delivered',
    tpl: { whatsapp: 'Your order {order_id} has been delivered. Thank you!', sms: 'Order {order_id} delivered. Thanks!', email: 'Your order {order_id} has been successfully delivered.' },
    subject: 'Your Order has been Delivered' },
  { key: 'Undelivered',     fieldKey: 'Undelivered',     label: 'Undelivered',
    tpl: { whatsapp: 'Delivery attempt for {order_id} failed. We\'ll retry soon. Track: {tracking_link}', sms: 'Delivery failed for {order_id}. Track: {tracking_link}', email: 'Delivery attempt was unsuccessful. We will retry.' },
    subject: 'Delivery Attempt Unsuccessful' },
  { key: 'RTO',             fieldKey: 'RTO',             label: 'RTO Initiated',
    tpl: { whatsapp: 'Your order {order_id} is being returned. Track: {tracking_link}', sms: 'RTO for {order_id}. Track: {tracking_link}', email: 'RTO has been initiated for order {order_id}.' },
    subject: 'RTO Initiated for Your Order' },
  { key: 'Cancelled',       fieldKey: 'Cancelled',       label: 'Cancelled',
    tpl: { whatsapp: 'Your order {order_id} has been cancelled. Contact support for queries.', sms: 'Order {order_id} cancelled. Contact support.', email: 'Your order {order_id} has been cancelled.' },
    subject: 'Order Cancelled' },
] as const;

type StatusKey = typeof STATUSES[number]['fieldKey'];

// ─── Channels ─────────────────────────────────────────────────────────────────
const CHANNELS = [
  { type: 'whatsapp', label: 'WhatsApp',    Icon: MessageSquare, color: '#25D366',
    masterField: 'isUserWhatsAppEnable', adminField: 'isAdminWhatsAppEnable',
    togglePrefix: 'WhatsApp', dataPrefix: 'whatsapp', hasSubject: false, paid: true },
  { type: 'sms',      label: 'SMS',         Icon: Smartphone,    color: '#F97316',
    masterField: 'isUserSMSEnable',      adminField: 'isAdminSMSEnable',
    togglePrefix: 'SMS',      dataPrefix: 'sms',      hasSubject: false, paid: true },
  { type: 'email',    label: 'Email (Free)', Icon: Mail,          color: '#3B82F6',
    masterField: 'isUserEmailEnable',    adminField: 'isAdminEmailEnable',
    togglePrefix: 'Email',    dataPrefix: 'email',    hasSubject: true,  paid: false },
] as const;

type ChannelType = typeof CHANNELS[number]['type'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (d?: string) => {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    + ', ' + dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

// ─── Toggle ───────────────────────────────────────────────────────────────────
function Toggle({ checked, onChange, disabled = false }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none ${
        checked ? 'bg-[#00A86B]' : 'bg-[#CBD5E1]'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

// ─── EditTemplateModal ────────────────────────────────────────────────────────
function EditTemplateModal({ open, onClose, statusLabel, channelLabel, hasSubject, currentTemplate, currentSubject, onSave, saving }: {
  open: boolean; onClose: () => void; statusLabel: string; channelLabel: string;
  hasSubject: boolean; currentTemplate: string; currentSubject: string;
  onSave: (tpl: string, subject: string) => void; saving: boolean;
}) {
  const [tpl, setTpl] = useState(currentTemplate);
  const [subj, setSubj] = useState(currentSubject);
  useEffect(() => { if (open) { setTpl(currentTemplate); setSubj(currentSubject); } }, [open, currentTemplate, currentSubject]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0] bg-[#F8FAFC]">
          <div>
            <h3 className="text-base font-bold text-[#0F172A]">Edit Notification Template</h3>
            <p className="text-xs text-[#64748B] mt-0.5">{channelLabel} · {statusLabel}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-[#64748B] hover:bg-[#E2E8F0] transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          {hasSubject && (
            <div>
              <label className="block text-xs font-bold text-[#475569] mb-1.5 uppercase tracking-wide">Email Subject</label>
              <input value={subj} onChange={e => setSubj(e.target.value)} placeholder="Email subject line..."
                className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] text-xs focus:outline-none focus:border-[#00A86B]" />
            </div>
          )}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold text-[#475569] uppercase tracking-wide">Message Body</label>
              <span className="text-[10px] text-[#94A3B8]">&#123;order_id&#125; · &#123;tracking_link&#125; · &#123;customer_name&#125;</span>
            </div>
            <textarea value={tpl} onChange={e => setTpl(e.target.value)} rows={5}
              className="w-full p-3 rounded-xl border border-[#E2E8F0] text-xs focus:outline-none focus:border-[#00A86B] resize-none" />
          </div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-[#E2E8F0] bg-[#F8FAFC]">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-bold text-[#64748B] hover:bg-[#E2E8F0] transition-colors">Cancel</button>
          <button onClick={() => onSave(tpl, subj)} disabled={saving}
            className="px-4 py-2 rounded-xl bg-[#00A86B] text-white text-xs font-bold hover:bg-[#009B63] transition-colors disabled:opacity-60">
            {saving ? 'Saving…' : 'Save Template'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── BuyCreditsModal ──────────────────────────────────────────────────────────
function BuyCreditsModal({ open, onClose, onSuccess, targetUserId }: {
  open: boolean; onClose: () => void; onSuccess: () => void; targetUserId: string | null;
}) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  useEffect(() => { if (open) { setAmount(''); setErr(''); } }, [open]);
  const handleBuy = async () => {
    if (!amount || Number(amount) <= 0) { setErr('Enter a valid amount'); return; }
    setLoading(true); setErr('');
    try {
      await apiClient.post('/notification/buyCredits', { amount: Number(amount), ...(targetUserId ? { userId: targetUserId } : {}) });
      onSuccess(); onClose();
    } catch (e: any) { setErr(e?.response?.data?.error || 'Failed to buy credits'); }
    finally { setLoading(false); }
  };
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0] bg-[#F8FAFC]">
          <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2"><CreditCard className="w-4 h-4 text-[#00A86B]" /> Buy Notification Credits</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-[#64748B] hover:bg-[#E2E8F0] transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-[#F0FDF4] rounded-xl p-3 border border-[#DCFCE7] text-xs text-[#00A86B] font-semibold">
            ₹1 = 1 Credit · 1 WhatsApp / SMS = 1 Credit · Email is Free
          </div>
          <div>
            <label className="block text-xs font-bold text-[#475569] mb-1.5 uppercase tracking-wide">Amount (₹)</label>
            <input type="number" min={1} value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 500"
              className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] text-sm focus:outline-none focus:border-[#00A86B]" />
            {err && <p className="text-xs text-red-500 mt-1 font-medium">{err}</p>}
          </div>
          <p className="text-[10px] text-[#94A3B8]">Credits are deducted from your main wallet and moved to the notification credit pool. Non-refundable.</p>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-[#E2E8F0] bg-[#F8FAFC]">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-bold text-[#64748B] hover:bg-[#E2E8F0] transition-colors">Cancel</button>
          <button onClick={handleBuy} disabled={loading || !amount}
            className="px-4 py-2 rounded-xl bg-[#00A86B] text-white text-xs font-bold hover:bg-[#009B63] transition-colors disabled:opacity-60">
            {loading ? 'Processing…' : `Buy ₹${amount || '0'} Credits`}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── SendAlertModal ───────────────────────────────────────────────────────────
function SendAlertModal({ open, onClose, targetUserId, targetUserName }: {
  open: boolean; onClose: () => void; targetUserId: string | null; targetUserName: string;
}) {
  const [recipientType, setRecipientType] = useState<'all' | 'specific'>('all');
  const [channel, setChannel] = useState('Email');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => {
    if (open) { setRecipientType(targetUserId ? 'specific' : 'all'); setTitle(''); setMessage(''); setEmail(''); setResult(null); }
  }, [open, targetUserId]);
  const handleSend = async () => {
    if (!title.trim() || !message.trim()) { setResult({ ok: false, text: 'Title and message are required' }); return; }
    setLoading(true); setResult(null);
    try {
      const body: any = { channel, title, message, recipientType };
      if (recipientType === 'specific') { if (targetUserId) body.targetUserId = targetUserId; else body.targetEmail = email; }
      const res = await apiClient.post('/notification/sendCustomAlert', body);
      setResult({ ok: true, text: res.data?.message || 'Alert sent!' });
      setTimeout(() => onClose(), 2000);
    } catch (e: any) { setResult({ ok: false, text: e?.response?.data?.error || 'Failed to send alert' }); }
    finally { setLoading(false); }
  };
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0] bg-[#F8FAFC]">
          <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2"><Send className="w-4 h-4 text-[#00A86B]" /> Send Custom Alert</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-[#64748B] hover:bg-[#E2E8F0] transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#475569] mb-2 uppercase tracking-wide">Recipient</label>
            <div className="flex gap-4">
              {([['all', 'Broadcast (All Users)'], ['specific', targetUserId ? (targetUserName || 'Selected User') : 'Specific Email']] as const).map(([v, l]) => (
                <label key={v} className="flex items-center gap-1.5 text-xs font-semibold text-[#475569] cursor-pointer">
                  <input type="radio" checked={recipientType === v} onChange={() => setRecipientType(v)} className="accent-[#00A86B]" />{l}
                </label>
              ))}
            </div>
          </div>
          {recipientType === 'specific' && !targetUserId && (
            <div>
              <label className="block text-xs font-bold text-[#475569] mb-1.5 uppercase tracking-wide">Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="recipient@example.com"
                className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] text-xs focus:outline-none focus:border-[#00A86B]" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#475569] mb-1.5 uppercase tracking-wide">Channel</label>
              <select value={channel} onChange={e => setChannel(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] text-xs focus:outline-none focus:border-[#00A86B] bg-white">
                <option value="Email">Email (Free)</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="SMS">SMS</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#475569] mb-1.5 uppercase tracking-wide">Title / Subject</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Alert title…"
                className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] text-xs focus:outline-none focus:border-[#00A86B]" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-[#475569] mb-1.5 uppercase tracking-wide">Message</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4} placeholder="Write your alert message here…"
              className="w-full p-3 rounded-xl border border-[#E2E8F0] text-xs focus:outline-none focus:border-[#00A86B] resize-none" />
          </div>
          {result && (
            <div className={`flex items-center gap-2 text-xs font-semibold p-3 rounded-xl ${result.ok ? 'bg-green-50 text-[#00A86B]' : 'bg-red-50 text-red-600'}`}>
              {result.ok ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              {result.text}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-[#E2E8F0] bg-[#F8FAFC]">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-bold text-[#64748B] hover:bg-[#E2E8F0] transition-colors">Cancel</button>
          <button onClick={handleSend} disabled={loading}
            className="px-4 py-2 rounded-xl bg-[#00A86B] text-white text-xs font-bold hover:bg-[#009B63] transition-colors disabled:opacity-60 flex items-center gap-1.5">
            <Send className="w-3.5 h-3.5" />{loading ? 'Sending…' : 'Dispatch Alert'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── ChannelTab ───────────────────────────────────────────────────────────────
function ChannelTab({ channelCfg, settings, targetUserId, onUpdate }: {
  channelCfg: typeof CHANNELS[number];
  settings: NotifSettings;
  targetUserId: string | null;
  onUpdate: (s: NotifSettings) => void;
}) {
  const { label, Icon, color, masterField, adminField, togglePrefix, dataPrefix, hasSubject, paid } = channelCfg;
  const [saving, setSaving] = useState<string | null>(null);
  const [editModal, setEditModal] = useState<typeof STATUSES[number] | null>(null);
  const [localToast, setLocalToast] = useState<{ ok: boolean; text: string } | null>(null);

  const showToast = (ok: boolean, text: string) => { setLocalToast({ ok, text }); setTimeout(() => setLocalToast(null), 2500); };
  const masterEnabled: boolean = settings[masterField] ?? false;
  const adminBlocked: boolean = settings[adminField] === false;

  const putSetting = async (field: string, body: Record<string, any>) => {
    setSaving(field);
    try {
      const res = await apiClient.put('/notification/updateNotification', { field, ...(targetUserId ? { userId: targetUserId } : {}), ...body });
      onUpdate(res.data);
      showToast(true, 'Saved');
    } catch { showToast(false, 'Failed to save'); }
    finally { setSaving(null); }
  };

  const toggleField = (key: StatusKey) => `is${togglePrefix}${key}Enable` as string;
  const isEnabled = (key: StatusKey) => !!settings[toggleField(key)];
  const getTpl = (key: StatusKey) => settings[`${dataPrefix}${key}Template`] || (STATUSES.find(s => s.fieldKey === key)?.tpl[dataPrefix as 'whatsapp' | 'sms' | 'email'] ?? '');
  const getSubj = (key: StatusKey) => settings[`${dataPrefix}${key}Subject`] || (STATUSES.find(s => s.fieldKey === key)?.subject ?? '');
  const getUpdated = (key: StatusKey) => settings[`${dataPrefix}${key}UpdatedAt`] as string | undefined;

  const handleMaster = (v: boolean) => putSetting(masterField, { value: v });
  const handleStatusToggle = (key: StatusKey) => {
    const field = toggleField(key);
    onUpdate({ ...settings, [field]: !settings[field] });  // optimistic
    putSetting(field, { value: !settings[field] });
  };
  const handleSaveTpl = async (tpl: string, subject: string) => {
    if (!editModal) return;
    const field = `${dataPrefix}${editModal.fieldKey}`;
    await putSetting(field, { template: tpl, ...(hasSubject ? { subject } : {}) });
    setEditModal(null);
  };

  return (
    <div>
      {adminBlocked && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 mb-4 text-xs font-semibold text-red-600">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {label} notifications are blocked by admin. Please contact your account manager.
        </div>
      )}

      {/* Master toggle */}
      <div className={`flex items-center justify-between bg-white border border-[#E2E8F0] rounded-xl px-3 md:px-4 py-2.5 md:py-3 mb-3 md:mb-4 shadow-sm gap-2 ${adminBlocked ? 'opacity-60 pointer-events-none' : ''}`}>
        <div className="flex items-center gap-2 md:gap-2.5 min-w-0">
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}18` }}>
            <Icon className="w-3.5 h-3.5 md:w-4 md:h-4" style={{ color }} />
          </div>
          <div className="min-w-0 flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-0">
            <span className="text-[13px] md:text-sm font-bold text-[#0F172A] truncate">{label} Notifications</span>
            {paid
              ? <span className="sm:ml-2 text-[9px] md:text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md whitespace-nowrap self-start">Paid · 1 Credit / message</span>
              : <span className="sm:ml-2 text-[9px] md:text-[10px] font-bold text-[#00A86B] bg-[#F0FDF4] px-1.5 py-0.5 rounded-md whitespace-nowrap self-start">Free</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:inline text-xs font-semibold text-[#64748B]">{masterEnabled ? 'Enabled' : 'Disabled'}</span>
          <Toggle checked={masterEnabled} onChange={handleMaster} disabled={adminBlocked || saving === masterField} />
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[10px] uppercase tracking-wider font-bold text-[#64748B]">
              <th className="px-4 py-3 w-44">Shipment Status</th>
              <th className="px-4 py-3 w-28">On / Off</th>
              <th className="px-4 py-3">Message Template</th>
              <th className="px-4 py-3 w-44">Last Updated</th>
              <th className="px-4 py-3 w-20 text-right">Edit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            {STATUSES.map(s => (
              <tr key={s.key} className={`hover:bg-[#F8FAFC] transition-colors ${(!masterEnabled || adminBlocked) ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3">
                  <span className="text-xs font-semibold text-[#0F172A]">{s.label}</span>
                </td>
                <td className="px-4 py-3">
                  <Toggle checked={isEnabled(s.fieldKey)} onChange={() => handleStatusToggle(s.fieldKey)}
                    disabled={!masterEnabled || adminBlocked || saving !== null} />
                </td>
                <td className="px-4 py-3 max-w-xs">
                  {hasSubject && <div className="text-[10px] font-bold text-[#0F172A] mb-0.5 truncate">Subject: {getSubj(s.fieldKey)}</div>}
                  <p className="text-[11px] text-[#64748B] line-clamp-2 leading-relaxed">"{getTpl(s.fieldKey)}"</p>
                </td>
                <td className="px-4 py-3 text-[11px] text-[#94A3B8]">{fmtDate(getUpdated(s.fieldKey))}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setEditModal(s)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-[#00A86B] border border-[#DCFCE7] bg-[#F0FDF4] rounded-lg hover:bg-[#E6F5F1] transition-colors">
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {STATUSES.map(s => (
          <div key={s.key} className={`bg-white border border-[#E2E8F0] rounded-xl p-3 shadow-sm ${(!masterEnabled || adminBlocked) ? 'opacity-50' : ''}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-[#0F172A]">{s.label}</span>
              <Toggle checked={isEnabled(s.fieldKey)} onChange={() => handleStatusToggle(s.fieldKey)} disabled={!masterEnabled || adminBlocked} />
            </div>
            {hasSubject && <div className="text-[10px] font-bold text-[#0F172A] mb-1 truncate">Subject: {getSubj(s.fieldKey)}</div>}
            <div className="bg-[#F8FAFC] rounded-lg p-2.5 text-[11px] text-[#64748B] leading-relaxed mb-2 border border-[#F1F5F9]">
              "{getTpl(s.fieldKey)}"
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-[#94A3B8]">{fmtDate(getUpdated(s.fieldKey))}</span>
              <button onClick={() => setEditModal(s)}
                className="inline-flex items-center gap-1 px-3 py-1 text-[11px] font-bold text-[#00A86B] border border-[#DCFCE7] bg-[#F0FDF4] rounded-lg">
                <Edit2 className="w-3 h-3" /> Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit modal */}
      <AnimatePresence>
        {editModal && (
          <EditTemplateModal open onClose={() => setEditModal(null)}
            statusLabel={editModal.label} channelLabel={label} hasSubject={hasSubject}
            currentTemplate={getTpl(editModal.fieldKey)} currentSubject={getSubj(editModal.fieldKey)}
            onSave={handleSaveTpl} saving={saving === `${dataPrefix}${editModal.fieldKey}`} />
        )}
      </AnimatePresence>

      {/* Channel-level toast */}
      <AnimatePresence>
        {localToast && (
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
            className={`fixed bottom-4 right-4 z-[120] px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 ${localToast.ok ? 'bg-[#0F172A] text-white' : 'bg-red-600 text-white'}`}>
            {localToast.ok ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {localToast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── AICallingTab ─────────────────────────────────────────────────────────────
interface CallLog {
  _id: string; awb_number?: string; orderDisplayId?: number; serviceType: string;
  calledNumber?: string; callStatus: 'pending' | 'answered' | 'unanswered' | 'failed';
  customerResponse?: string; recordingUrl?: string; creditDeducted?: boolean;
  orderUpdated?: boolean; errorMessage?: string; createdAt: string;
}

const CALL_STATUS_STYLES: Record<string, string> = {
  answered:   'bg-green-50 text-[#00A86B] border-green-200',
  pending:    'bg-amber-50 text-amber-600 border-amber-200',
  unanswered: 'bg-orange-50 text-orange-500 border-orange-200',
  failed:     'bg-red-50 text-red-500 border-red-200',
};
const SERVICE_LABELS: Record<string, string> = {
  order_verification: 'Order Verify',
  ndr_followup: 'NDR Follow-up',
};

function AICallingTab({ settings, targetUserId, onUpdate }: { settings: NotifSettings; targetUserId: string | null; onUpdate: (s: NotifSettings) => void }) {
  const [saving, setSaving] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Call logs state
  const [logs, setLogs] = useState<CallLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotalPages, setLogsTotalPages] = useState(0);
  const [serviceTypeFilter, setServiceTypeFilter] = useState('');
  const [callStatusFilter, setCallStatusFilter] = useState('');
  const LOGS_LIMIT = 20;

  const showToast = (t: string) => { setToast(t); setTimeout(() => setToast(null), 2500); };

  const putField = async (field: string, value: boolean) => {
    setSaving(field);
    try {
      const res = await apiClient.put('/notification/updateNotification', { field, value, ...(targetUserId ? { userId: targetUserId } : {}) });
      onUpdate(res.data); showToast('Saved');
    } catch { showToast('Failed to save'); }
    finally { setSaving(null); }
  };

  const fetchLogs = useCallback(async () => {
    if (!targetUserId) return;
    setLogsLoading(true);
    try {
      const params: any = { page: logsPage, limit: LOGS_LIMIT, userId: targetUserId };
      if (serviceTypeFilter) params.serviceType = serviceTypeFilter;
      if (callStatusFilter) params.callStatus = callStatusFilter;
      const res = await apiClient.get('/ai-calling/logs', { params });
      setLogs(res.data?.logs || []);
      setLogsTotalPages(res.data?.totalPages || 0);
    } catch { setLogs([]); }
    finally { setLogsLoading(false); }
  }, [targetUserId, logsPage, serviceTypeFilter, callStatusFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const features = [
    { field: 'isAiOrderVerifyEnable', adminField: 'isAdminAiOrderVerifyEnable', label: 'AI Order Verification', desc: 'Automatically call customers to verify their order before it ships to reduce RTO.' },
    { field: 'isAiNdrFollowupEnable', adminField: 'isAdminAiNdrFollowupEnable', label: 'AI NDR Follow-up', desc: 'Automatically call customers when a delivery attempt is unsuccessful (NDR) to schedule a re-delivery.' },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 text-xs text-[#64748B] font-medium">
        AI Calling uses automated voice calls to verify orders and follow up on undelivered shipments. Contact your account manager to enable calling credits.
      </div>

      {/* Feature toggles */}
      {features.map(f => {
        const adminBlocked = settings[f.adminField] === false;
        const enabled = !!settings[f.field];
        return (
          <div key={f.field} className={`bg-white border border-[#E2E8F0] rounded-2xl p-4 md:p-5 shadow-sm ${adminBlocked ? 'opacity-60' : ''}`}>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 bg-[#F0FDF4] rounded-xl flex items-center justify-center shrink-0">
                  <PhoneCall className="w-5 h-5 text-[#00A86B]" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-[#0F172A]">{f.label}</div>
                  <div className="text-xs text-[#64748B] mt-0.5 leading-relaxed">{f.desc}</div>
                  {adminBlocked && (
                    <div className="flex items-center gap-1 text-[10px] font-bold text-red-500 mt-1">
                      <AlertTriangle className="w-3 h-3" /> Disabled by admin
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                <span className="text-xs font-semibold text-[#64748B]">{enabled ? 'On' : 'Off'}</span>
                <Toggle checked={enabled} onChange={v => putField(f.field, v)} disabled={adminBlocked || saving === f.field} />
              </div>
            </div>
          </div>
        );
      })}

      {/* Call Logs */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm overflow-hidden">
        {/* Header + filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-4 py-3 border-b border-[#E2E8F0] bg-[#F8FAFC]">
          <div className="flex items-center gap-2">
            <PhoneCall className="w-4 h-4 text-[#00A86B]" />
            <span className="text-sm font-bold text-[#0F172A]">Call Logs</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select value={serviceTypeFilter} onChange={e => { setServiceTypeFilter(e.target.value); setLogsPage(1); }}
              className="h-8 px-2 text-xs rounded-lg border border-[#E2E8F0] focus:outline-none focus:border-[#00A86B] bg-white text-[#0F172A]">
              <option value="">All Types</option>
              <option value="order_verification">Order Verify</option>
              <option value="ndr_followup">NDR Follow-up</option>
            </select>
            <select value={callStatusFilter} onChange={e => { setCallStatusFilter(e.target.value); setLogsPage(1); }}
              className="h-8 px-2 text-xs rounded-lg border border-[#E2E8F0] focus:outline-none focus:border-[#00A86B] bg-white text-[#0F172A]">
              <option value="">All Statuses</option>
              <option value="answered">Answered</option>
              <option value="unanswered">Unanswered</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            <button onClick={fetchLogs} title="Refresh logs"
              className={`w-8 h-8 flex items-center justify-center rounded-lg border border-[#E2E8F0] text-[#64748B] hover:text-[#00A86B] hover:border-[#00A86B] transition-colors ${logsLoading ? 'animate-spin' : ''}`}>
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left min-w-[750px]">
            <thead>
              <tr className="border-b border-[#E2E8F0] text-[10px] uppercase tracking-wider font-bold text-[#64748B]">
                <th className="px-4 py-3 w-36">Date & Time</th>
                <th className="px-4 py-3 w-28">AWB / Order</th>
                <th className="px-4 py-3 w-32">Type</th>
                <th className="px-4 py-3 w-32">Phone</th>
                <th className="px-4 py-3 w-28">Status</th>
                <th className="px-4 py-3">Customer Response</th>
                <th className="px-4 py-3 w-20 text-center">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {logsLoading ? (
                <tr><td colSpan={7} className="text-center py-12 text-xs text-[#94A3B8]">Loading call logs…</td></tr>
              ) : !targetUserId ? (
                <tr><td colSpan={7} className="text-center py-12 text-xs text-[#94A3B8]">Select a user to view call logs</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-sm font-medium text-[#94A3B8]">No call logs found</td></tr>
              ) : logs.map(log => (
                <tr key={log._id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-4 py-3">
                    <div className="text-xs font-semibold text-[#0F172A]">{new Date(log.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                    <div className="text-[10px] text-[#94A3B8]">{new Date(log.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                  </td>
                  <td className="px-4 py-3">
                    {log.awb_number ? (
                      <div className="flex items-center gap-1 group/copy">
                        <span className="text-xs font-mono font-semibold text-[#00A86B] underline cursor-pointer hover:text-[#009B63]" onClick={() => navigate(`${isAdminView ? '/admin' : '/user'}/tracking?awb=${log.awb_number}`)}>{log.awb_number}</span>
                        <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(log.awb_number).catch(()=>{}); }} className="opacity-100 md:opacity-0 md:group-hover/copy:opacity-100 transition-opacity shrink-0 focus:outline-none" title="Copy AWB"><Copy className="w-3 h-3 text-[#94A3B8] hover:text-[#00A86B]" /></button>
                      </div>
                    ) : <span className="text-xs font-mono font-semibold text-[#0F172A]">—</span>}
                    {log.orderDisplayId && <div className="text-[10px] text-[#94A3B8]">#{log.orderDisplayId}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold text-[#475569]">{SERVICE_LABELS[log.serviceType] || log.serviceType}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#64748B] font-mono">{log.calledNumber || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${CALL_STATUS_STYLES[log.callStatus] || ''}`}>
                      {log.callStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#64748B] max-w-[200px]">
                    {log.customerResponse
                      ? <span className="line-clamp-2 leading-relaxed" title={log.customerResponse}>"{log.customerResponse}"</span>
                      : log.errorMessage
                        ? <span className="text-red-400 text-[11px]">{log.errorMessage}</span>
                        : <span className="text-[#CBD5E1]">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {log.orderUpdated
                      ? <span title="Order updated"><CheckCircle className="w-4 h-4 text-[#00A86B] mx-auto" /></span>
                      : <span className="text-[#CBD5E1] text-xs">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-[#F1F5F9]">
          {logsLoading ? (
            <div className="text-center py-10 text-xs text-[#94A3B8]">Loading…</div>
          ) : !targetUserId ? (
            <div className="text-center py-10 text-xs text-[#94A3B8]">Select a user to view call logs</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-10 text-sm font-medium text-[#94A3B8]">No call logs found</div>
          ) : logs.map(log => (
            <div key={log._id} className="p-4 space-y-1.5">
              <div className="flex items-center justify-between">
                <div>
                  {log.awb_number ? (
                    <div className="flex items-center gap-1 group/copy">
                      <span className="text-xs font-bold text-[#00A86B] font-mono underline cursor-pointer active:opacity-60" onClick={(e) => { e.stopPropagation(); navigate(`${isAdminView ? '/admin' : '/user'}/tracking?awb=${log.awb_number}`); }}>{log.awb_number}</span>
                      <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(log.awb_number).catch(()=>{}); }} className="opacity-100 md:opacity-0 md:group-hover/copy:opacity-100 transition-opacity shrink-0 focus:outline-none" title="Copy AWB"><Copy className="w-3 h-3 text-[#94A3B8] hover:text-[#00A86B]" /></button>
                    </div>
                  ) : <span className="text-xs font-bold text-[#0F172A] font-mono">—</span>}
                  {log.orderDisplayId && <span className="text-[10px] text-[#94A3B8] ml-1">#{log.orderDisplayId}</span>}
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${CALL_STATUS_STYLES[log.callStatus] || ''}`}>
                  {log.callStatus}
                </span>
              </div>
              <div className="flex gap-3 text-[11px] text-[#64748B]">
                <span>{SERVICE_LABELS[log.serviceType]}</span>
                <span>·</span>
                <span className="font-mono">{log.calledNumber || '—'}</span>
                <span>·</span>
                <span>{fmtDate(log.createdAt)}</span>
              </div>
              {log.customerResponse && (
                <div className="text-[11px] text-[#475569] bg-[#F8FAFC] rounded-lg px-2.5 py-1.5 border border-[#F1F5F9]">
                  "{log.customerResponse}"
                </div>
              )}
              {log.errorMessage && <div className="text-[11px] text-red-400">{log.errorMessage}</div>}
            </div>
          ))}
        </div>

        {/* Pagination */}
        {logsTotalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-3 border-t border-[#E2E8F0]">
            <button onClick={() => setLogsPage(p => Math.max(1, p - 1))} disabled={logsPage === 1}
              className="px-3 py-1.5 text-xs font-bold border border-[#E2E8F0] rounded-lg disabled:opacity-40 hover:bg-[#F8FAFC] transition-colors">
              ← Prev
            </button>
            <span className="text-xs text-[#64748B] font-medium">Page {logsPage} of {logsTotalPages}</span>
            <button onClick={() => setLogsPage(p => Math.min(logsTotalPages, p + 1))} disabled={logsPage === logsTotalPages}
              className="px-3 py-1.5 text-xs font-bold border border-[#E2E8F0] rounded-lg disabled:opacity-40 hover:bg-[#F8FAFC] transition-colors">
              Next →
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
            className="fixed bottom-4 right-4 z-[120] px-4 py-2.5 rounded-xl bg-[#0F172A] text-white shadow-xl text-xs font-semibold">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── CustomAlertsTab ──────────────────────────────────────────────────────────
interface CustomAlertLog {
  _id: string; sentBy?: string; channel: string; recipientType: string;
  targetEmail?: string; targetUserId?: string; targetUserName?: string;
  title: string; message: string; sentCount: number;
  status: 'success' | 'failed'; errorMessage?: string; createdAt: string;
}

function CustomAlertsTab() {
  const [logs, setLogs] = useState<CustomAlertLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [channelFilter, setChannelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const LIMIT = 20;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: LIMIT };
      if (channelFilter) params.channel = channelFilter;
      if (statusFilter) params.status = statusFilter;
      if (fromDate) params.fromDate = new Date(fromDate).toISOString();
      if (toDate) params.toDate = new Date(toDate + 'T23:59:59').toISOString();
      const res = await apiClient.get('/notification/customAlertLogs', { params });
      setLogs(res.data?.logs || []);
      setTotalPages(res.data?.totalPages || 0);
    } catch { setLogs([]); }
    finally { setLoading(false); }
  }, [page, channelFilter, statusFilter, fromDate, toDate]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const clearFilters = () => { setChannelFilter(''); setStatusFilter(''); setFromDate(''); setToDate(''); setPage(1); };
  const anyFilter = !!(channelFilter || statusFilter || fromDate || toDate);

  const recipientLabel = (log: CustomAlertLog) => {
    if (log.recipientType === 'all') return 'All Users (Broadcast)';
    if (log.targetUserName) return log.targetUserName;
    if (log.targetEmail) return log.targetEmail;
    return 'Specific User';
  };

  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div className="flex items-center gap-2 bg-[#FFF7ED] border border-[#FED7AA] rounded-xl px-4 py-2.5 text-xs font-semibold text-orange-600">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        This log is admin-only. It records every custom alert dispatched via the Send Alert feature.
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <select value={channelFilter} onChange={e => { setChannelFilter(e.target.value); setPage(1); }}
          className="h-9 px-2 text-xs rounded-lg border border-[#E2E8F0] focus:outline-none focus:border-[#00A86B] bg-white text-[#0F172A]">
          <option value="">All Channels</option>
          <option value="Email">Email</option>
          <option value="WhatsApp">WhatsApp</option>
          <option value="SMS">SMS</option>
        </select>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-9 px-2 text-xs rounded-lg border border-[#E2E8F0] focus:outline-none focus:border-[#00A86B] bg-white text-[#0F172A]">
          <option value="">All Statuses</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
        </select>
        <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1); }}
          className="h-9 px-3 text-xs rounded-lg border border-[#E2E8F0] focus:outline-none focus:border-[#00A86B] bg-white text-[#0F172A]" />
        <span className="text-xs text-[#94A3B8] font-medium">to</span>
        <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setPage(1); }}
          className="h-9 px-3 text-xs rounded-lg border border-[#E2E8F0] focus:outline-none focus:border-[#00A86B] bg-white text-[#0F172A]" />
        <button onClick={fetchLogs} title="Refresh"
          className={`w-9 h-9 flex items-center justify-center rounded-lg border border-[#E2E8F0] text-[#64748B] hover:text-[#00A86B] hover:border-[#00A86B] transition-colors ${loading ? 'animate-spin' : ''}`}>
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
        {anyFilter && (
          <button onClick={clearFilters} className="h-9 px-3 text-xs font-bold text-red-500 hover:text-red-700 transition-colors">Clear</button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
        {/* Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[10px] uppercase tracking-wider font-bold text-[#64748B]">
                <th className="px-4 py-3 w-36">Sent At</th>
                <th className="px-4 py-3 w-24">Channel</th>
                <th className="px-4 py-3 w-44">Recipient</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3 w-24 text-center">Sent To</th>
                <th className="px-4 py-3 w-24 text-center">Status</th>
                <th className="px-4 py-3 w-28">Sent By</th>
                <th className="px-4 py-3 w-16 text-center">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12 text-xs text-[#94A3B8]">Loading alert logs…</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-sm font-medium text-[#94A3B8]">No custom alerts sent yet</td></tr>
              ) : logs.map(log => (
                <React.Fragment key={log._id}>
                  <tr className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-xs font-semibold text-[#0F172A]">{new Date(log.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                      <div className="text-[10px] text-[#94A3B8]">{new Date(log.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold text-[#475569]">{log.channel}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs font-semibold text-[#0F172A] truncate max-w-[160px]" title={recipientLabel(log)}>{recipientLabel(log)}</div>
                      {log.recipientType === 'all' && (
                        <span className="text-[10px] font-bold text-purple-500 bg-purple-50 px-1.5 py-0.5 rounded mt-0.5 inline-block border border-purple-200">Broadcast</span>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-[180px]">
                      <div className="text-xs font-bold text-[#0F172A] truncate" title={log.title}>{log.title}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-extrabold text-[#0F172A]">{log.sentCount}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${log.status === 'success' ? 'bg-green-50 text-[#00A86B] border-green-200' : 'bg-red-50 text-red-500 border-red-200'}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-[#64748B] truncate max-w-[100px]" title={log.sentBy}>{log.sentBy || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => setExpanded(expanded === log._id ? null : log._id)}
                        className="text-[#00A86B] hover:text-[#009B63] transition-colors font-bold text-xs">
                        {expanded === log._id ? '▲' : '▼'}
                      </button>
                    </td>
                  </tr>
                  {expanded === log._id && (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 bg-[#F8FAFC] border-b border-[#E2E8F0]">
                        <div className="text-xs font-bold text-[#475569] mb-1.5 uppercase tracking-wide">Message Body</div>
                        <div className="bg-white rounded-xl border border-[#E2E8F0] p-3 text-xs text-[#0F172A] leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
                          {log.message}
                        </div>
                        {log.errorMessage && (
                          <div className="mt-2 text-xs text-red-500 font-semibold flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" /> {log.errorMessage}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-[#F1F5F9]">
          {loading ? (
            <div className="text-center py-10 text-xs text-[#94A3B8]">Loading…</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-10 text-sm font-medium text-[#94A3B8]">No custom alerts sent yet</div>
          ) : logs.map(log => (
            <div key={log._id} className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-[#0F172A] truncate">{log.title}</div>
                  <div className="text-[10px] text-[#94A3B8] mt-0.5">{fmtDate(log.createdAt)} · {log.channel} · by {log.sentBy || '—'}</div>
                </div>
                <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border ${log.status === 'success' ? 'bg-green-50 text-[#00A86B] border-green-200' : 'bg-red-50 text-red-500 border-red-200'}`}>
                  {log.status}
                </span>
              </div>
              <div className="flex gap-3 text-[11px] text-[#64748B]">
                <span className="font-semibold">{recipientLabel(log)}</span>
                {log.recipientType === 'all' && <span className="text-purple-500 font-bold">· Broadcast</span>}
                <span>· {log.sentCount} sent</span>
              </div>
              <button onClick={() => setExpanded(expanded === log._id ? null : log._id)}
                className="text-[11px] font-bold text-[#00A86B]">
                {expanded === log._id ? 'Hide message ▲' : 'View message ▼'}
              </button>
              {expanded === log._id && (
                <div className="bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] p-3 text-xs text-[#0F172A] leading-relaxed whitespace-pre-wrap">
                  {log.message}
                </div>
              )}
              {log.errorMessage && <div className="text-[11px] text-red-400 font-semibold">{log.errorMessage}</div>}
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-3 border-t border-[#E2E8F0]">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 text-xs font-bold border border-[#E2E8F0] rounded-lg disabled:opacity-40 hover:bg-[#F8FAFC] transition-colors">
              ← Prev
            </button>
            <span className="text-xs text-[#64748B] font-medium">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1.5 text-xs font-bold border border-[#E2E8F0] rounded-lg disabled:opacity-40 hover:bg-[#F8FAFC] transition-colors">
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CreditHistoryTab ─────────────────────────────────────────────────────────
function CreditHistoryTab({ targetUserId, isAdminView }: { targetUserId: string | null; isAdminView: boolean }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [category, setCategory] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const totalPages = Math.ceil(totalItems / rowsPerPage);

  const fetchTxns = useCallback(async () => {
    if (isAdminView && !targetUserId) return;
    setLoading(true);
    try {
      const params: any = { page, limit: rowsPerPage };
      if (targetUserId) params.userId = targetUserId;
      if (category) params.category = category;
      if (fromDate) params.fromDate = new Date(fromDate).toISOString();
      if (toDate) params.toDate = new Date(toDate + 'T23:59:59').toISOString();
      const res = await apiClient.get('/notification/getUserPassbookTransactions', { params });
      setTransactions(res.data.results || []);
      setTotalItems(res.data.total || 0);
    } catch { setTransactions([]); }
    finally { setLoading(false); }
  }, [page, rowsPerPage, category, fromDate, toDate, targetUserId, isAdminView]);

  useEffect(() => { fetchTxns(); }, [fetchTxns]);
  useEffect(() => { setPage(1); }, [rowsPerPage]);

  const clearFilters = () => { setFromDate(''); setToDate(''); setCategory(''); setPage(1); };
  const anyFilter = !!(fromDate || toDate || category);
  const startIndex = totalItems === 0 ? 0 : (page - 1) * rowsPerPage + 1;
  const endIndex = Math.min(page * rowsPerPage, totalItems);

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Filters — desktop */}
      <div className="hidden md:flex flex-wrap gap-2 items-center">
        <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1); }}
          className="h-9 px-3 text-xs rounded-lg border border-[#E2E8F0] focus:outline-none focus:border-[#00A86B] bg-white text-[#0F172A]" />
        <span className="text-xs text-[#94A3B8] font-medium">to</span>
        <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setPage(1); }}
          className="h-9 px-3 text-xs rounded-lg border border-[#E2E8F0] focus:outline-none focus:border-[#00A86B] bg-white text-[#0F172A]" />
        <select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}
          className="h-9 px-3 text-xs rounded-lg border border-[#E2E8F0] focus:outline-none focus:border-[#00A86B] bg-white text-[#0F172A]">
          <option value="">All Types</option>
          <option value="credit">Credit</option>
          <option value="debit">Debit</option>
        </select>
        {anyFilter && (
          <button onClick={clearFilters} className="h-9 px-3 text-xs font-bold text-red-500 hover:text-red-700 transition-colors">Clear Filters</button>
        )}
      </div>

      {/* Filters — mobile (filter icon, matches other pages) */}
      <div className="md:hidden flex items-center justify-end">
        <button
          onClick={() => setIsMobileFiltersOpen(true)}
          className="relative w-9 h-9 rounded-xl border border-[#E2E8F0] flex items-center justify-center text-[#475569] bg-white shrink-0"
        >
          <Filter className="w-4 h-4" />
          {anyFilter && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#00A86B] border-2 border-white" />}
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[10px] uppercase tracking-wider font-bold text-[#64748B]">
                <th className="px-4 py-3 w-36">Date & Time</th>
                <th className="px-4 py-3">Reference ID</th>
                <th className="px-4 py-3 w-20">Type</th>
                <th className="px-4 py-3 w-24">Amount</th>
                <th className="px-4 py-3 w-28">Balance After</th>
                <th className="px-4 py-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-xs text-[#94A3B8]">Loading…</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-sm font-medium text-[#94A3B8]">No credit transactions found</td></tr>
              ) : transactions.map((t, i) => (
                <tr key={i} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-4 py-3">
                    <div className="text-xs font-semibold text-[#0F172A]">{new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                    <div className="text-[10px] text-[#94A3B8]">{new Date(t.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-[#64748B]">{t.channelOrderId || t._id || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${t.category === 'credit' ? 'bg-green-50 text-[#00A86B] border-green-200' : 'bg-red-50 text-red-500 border-red-200'}`}>
                      {t.category}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-xs font-bold ${t.category === 'credit' ? 'text-[#00A86B]' : 'text-red-500'}`}>
                    {t.category === 'credit' ? '+' : '−'}₹{Number(t.amount).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold text-[#0F172A]">₹{Number(t.balanceAfterTransaction).toFixed(2)}</td>
                  <td className="px-4 py-3 text-xs text-[#64748B] max-w-[220px] truncate" title={t.description}>{t.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="md:hidden divide-y divide-[#F1F5F9]">
          {loading ? (
            <div className="text-center py-10 text-[12px] text-[#94A3B8]">Loading…</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-10 text-[12px] font-semibold text-[#94A3B8]">No transactions found</div>
          ) : transactions.map((t, i) => (
            <div key={i} className="p-3 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-semibold text-[#0F172A] truncate">{t.description}</div>
                <div className="text-[12px] font-normal text-[#94A3B8] mt-0.5 truncate">{fmtDate(t.date)} · {t.channelOrderId || '—'}</div>
              </div>
              <div className="text-right shrink-0">
                <div className={`text-[14px] font-semibold ${t.category === 'credit' ? 'text-[#00A86B]' : 'text-red-500'}`}>
                  {t.category === 'credit' ? '+' : '−'}₹{Number(t.amount).toFixed(2)}
                </div>
                <div className="text-[12px] font-normal text-[#94A3B8]">Bal: ₹{Number(t.balanceAfterTransaction).toFixed(2)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination — desktop */}
      {totalPages > 1 && (
        <div className="hidden md:flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1.5 text-xs font-bold border border-[#E2E8F0] rounded-lg disabled:opacity-40 hover:bg-[#F8FAFC] transition-colors">
            ← Prev
          </button>
          <span className="text-xs text-[#64748B] font-medium">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="px-3 py-1.5 text-xs font-bold border border-[#E2E8F0] rounded-lg disabled:opacity-40 hover:bg-[#F8FAFC] transition-colors">
            Next →
          </button>
        </div>
      )}

      {/* Pagination — mobile, from hooks */}
      {<MobilePaginationBar {...({
        page, setPage, totalPages, rowsPerPage, setRowsPerPage,
        startIndex, endIndex, totalItems,
      })} />}

      {/* Mobile Filters Bottom Sheet */}
      <AnimatePresence>
        {isMobileFiltersOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[140] md:hidden flex items-end justify-center"
            onClick={() => setIsMobileFiltersOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white rounded-t-3xl border-t border-[#E2E8F0] shadow-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between sticky top-0 bg-white z-10">
                <h3 className="font-bold text-slate-800 text-base">Filters</h3>
                <button onClick={() => setIsMobileFiltersOpen(false)} className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">From Date</label>
                  <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1); }}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B]" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">To Date</label>
                  <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setPage(1); }}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B]" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Type</label>
                  <select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B] bg-white">
                    <option value="">All Types</option>
                    <option value="credit">Credit</option>
                    <option value="debit">Debit</option>
                  </select>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-[#E2E8F0] flex items-center gap-3 sticky bottom-0 bg-white">
                <button
                  onClick={() => { clearFilters(); setIsMobileFiltersOpen(false); }}
                  className="flex-1 h-11 rounded-full border border-[#00A86B] text-[#00A86B] text-sm font-bold hover:bg-[#F0FDF4] transition-colors"
                >
                  Reset All
                </button>
                <button
                  onClick={() => { setPage(1); fetchTxns(); setIsMobileFiltersOpen(false); }}
                  className="flex-1 h-11 rounded-full bg-[#009D64] text-white text-sm font-bold hover:bg-[#009B63] transition-colors shadow-sm"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── AdminNotification (main) ──────────────────────────────────────────────────
type TabKey = ChannelType | 'ai' | 'history' | 'alerts';

// Tab keys are already URL-safe slugs — used to validate slugs from the URL
const NOTIF_VALID_SLUGS = new Set<string>(['whatsapp', 'sms', 'email', 'ai', 'history', 'alerts']);

export function AdminNotification() {
  const navigate = useNavigate();
  const location = useLocation();
  const { tabSlug } = useParams<{ tabSlug?: string }>();
  const { isAdmin, adminTab, currentUserId } = useAdminTab();
  const isAdminView = isAdmin && adminTab;

  const notifBase = location.pathname.startsWith('/user/') ? '/user/notification' : '/admin/notification';
  // AdminLayout adds a 32px impersonation banner (pt-8) above the page when an
  // admin is impersonating a user — the page height calc must account for it too,
  // otherwise the extra 32px overflows the viewport and the whole page scrolls.
  const isImpersonating = !!localStorage.getItem('admin_token_backup');

  // User search (admin)
  const [userSearch, setUserSearch] = useState('');
  const [suggestions, setSuggestions] = useState<UserResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [dropOpen, setDropOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Core state
  const [settings, setSettings] = useState<NotifSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [loadingBal, setLoadingBal] = useState(false);

  // UI — tab driven by URL slug
  const [activeTab, setActiveTab] = useState<TabKey>(
    () => (tabSlug && NOTIF_VALID_SLUGS.has(tabSlug) ? tabSlug as TabKey : 'whatsapp')
  );

  // Sync tab from URL on back/forward/refresh/direct link
  useEffect(() => {
    const tabFromUrl = (tabSlug && NOTIF_VALID_SLUGS.has(tabSlug) ? tabSlug as TabKey : 'whatsapp');
    setActiveTab(prev => (prev === tabFromUrl ? prev : tabFromUrl));
  }, [tabSlug]);
  const [buyOpen, setBuyOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (t: string) => { setToast(t); setTimeout(() => setToast(null), 3000); };

  const targetUserId = isAdminView ? (selectedUser?._id || null) : currentUserId;
  const targetUserName = selectedUser?.fullname || selectedUser?.name || '';

  // User search debounce — skipped right after selecting a user, since selecting
  // sets userSearch to the picked name and would otherwise immediately re-trigger
  // a search + reopen the dropdown that was just closed.
  useEffect(() => {
    if (!isAdminView || userSearch.trim().length < 2) { setSuggestions([]); return; }
    if (selectedUser && userSearch === (selectedUser.fullname || selectedUser.name || selectedUser.email || '')) return;
    const timer = setTimeout(async () => {
      try {
        const res = await apiClient.get(`/admin/searchUser?query=${encodeURIComponent(userSearch)}`);
        setSuggestions(res.data?.users || []);
        setDropOpen(true);
      } catch { setSuggestions([]); }
    }, 300);
    return () => clearTimeout(timer);
  }, [userSearch, isAdminView, selectedUser]);

  // Close dropdown on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => { if (searchRef.current && !searchRef.current.contains(e.target as Node)) setDropOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Fetch settings
  const fetchSettings = useCallback(async () => {
    if (isAdminView && !targetUserId) return;
    if (!targetUserId) return;
    setLoadingSettings(true);
    try {
      const res = await apiClient.get('/notification/getNotification', { params: targetUserId ? { userId: targetUserId } : {} });
      setSettings(res.data);
    } catch { setSettings(null); }
    finally { setLoadingSettings(false); }
  }, [targetUserId, isAdminView]);

  // Fetch credit balance
  const fetchBalance = useCallback(async () => {
    if (isAdminView && !targetUserId) return;
    if (!targetUserId) return;
    setLoadingBal(true);
    try {
      const res = await apiClient.get('/notification/getCreditBalance', { params: targetUserId ? { userId: targetUserId } : {} });
      setCreditBalance(res.data?.creditBalance ?? 0);
    } catch { setCreditBalance(0); }
    finally { setLoadingBal(false); }
  }, [targetUserId, isAdminView]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);
  useEffect(() => { fetchBalance(); }, [fetchBalance]);

  // Derived metrics
  const countActive = (tp: string) => {
    if (!settings) return 0;
    return STATUSES.filter(s => !!settings[`is${tp}${s.fieldKey}Enable`]).length;
  };

  const showContent = !isAdminView || !!selectedUser;

  const TABS: { key: TabKey; label: string; Icon: React.ComponentType<any>; adminOnly?: boolean }[] = [
    { key: 'whatsapp', label: 'WhatsApp',       Icon: MessageSquare },
    { key: 'sms',      label: 'SMS',            Icon: Smartphone    },
    { key: 'email',    label: 'Email',          Icon: Mail          },
    { key: 'ai',       label: 'AI Calling',     Icon: PhoneCall     },
    { key: 'history',  label: 'Credit History', Icon: History       },
    { key: 'alerts',   label: 'Alert Logs',     Icon: Send, adminOnly: true },
  ];

  return (
    <AdminLayout>
      <div className={`flex flex-col ${isImpersonating ? 'h-[calc(100vh-104px)]' : 'h-[calc(100vh-72px)]'} -m-4 md:-m-6 overflow-hidden`}>
        <div className="px-4 md:px-6 pt-4 md:pt-6 shrink-0">

        {/* Header */}
        <div className="flex flex-row md:flex-row justify-between items-center md:items-start gap-3 md:gap-4 mb-4 md:mb-6">
          <div className="min-w-0">
            <h2 className="text-base md:text-xl font-bold text-[#0F172A] flex items-center gap-2">
              <Bell className="w-4 h-4 md:w-5 md:h-5 text-[#00A86B]" />
              Notification Settings
            </h2>
            <p className="hidden md:block text-xs text-[#64748B] mt-1">
              Configure WhatsApp, SMS & Email alerts sent to customers at each shipment milestone.
            </p>
          </div>

          {showContent && (
            <div className="flex items-center gap-2 shrink-0">
              {/* Credit balance chip */}
              <div className="flex items-center gap-1.5 md:gap-2 bg-white border border-[#E2E8F0] rounded-xl px-2 md:px-3 py-1.5 md:py-2 shadow-sm">
                <CreditCard className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#00A86B] shrink-0" />
                <div className="hidden sm:block">
                  <div className="text-[9px] font-bold text-[#64748B] uppercase tracking-wide leading-tight">Credits</div>
                  <div className="text-sm font-extrabold text-[#0F172A] leading-tight">
                    {creditBalance === null || loadingBal ? '—' : creditBalance}
                  </div>
                </div>
                <span className="sm:hidden text-[12px] font-extrabold text-[#0F172A]">
                  {creditBalance === null || loadingBal ? '—' : creditBalance}
                </span>
                <button onClick={fetchBalance} title="Refresh balance"
                  className={`hidden md:inline-flex text-[#94A3B8] hover:text-[#00A86B] transition-colors ml-1 ${loadingBal ? 'animate-spin' : ''}`}>
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              <button onClick={() => setBuyOpen(true)} title="Buy Credits"
                className="h-8 w-8 md:h-9 md:w-auto md:px-4 rounded-xl border border-[#00A86B] text-[#00A86B] text-xs font-bold hover:bg-[#F0FDF4] transition-colors flex items-center justify-center gap-1.5 shrink-0">
                <Plus className="w-3.5 h-3.5" /> <span className="hidden md:inline">Buy Credits</span>
              </button>

              {isAdminView && (
                <button onClick={() => setAlertOpen(true)} title="Send Alert"
                  className="h-8 w-8 md:h-9 md:w-auto md:px-4 rounded-xl bg-[#00A86B] text-white text-xs font-bold hover:bg-[#009B63] transition-colors flex items-center justify-center gap-1.5 shadow-sm shrink-0">
                  <Send className="w-3.5 h-3.5" /> <span className="hidden md:inline">Send Alert</span>
                </button>
              )}
            </div>
          )}
        </div>
        </div>

        {/* Scrollable body — everything below the title bar */}
        <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="px-4 md:px-6 pb-10">

        {/* Admin: user search */}
        {isAdminView && (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 mb-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-end gap-4">
              <div className="flex-1 max-w-md" ref={searchRef}>
                <label className="block text-xs font-bold text-[#475569] mb-1.5 uppercase tracking-wide">Select User</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
                  <input value={userSearch} onChange={e => setUserSearch(e.target.value)}
                    onFocus={() => suggestions.length > 0 && setDropOpen(true)}
                    placeholder="Search by name or email…"
                    name="notification-target-user-search"
                    autoComplete="off"
                    className="w-full h-10 pl-9 pr-3 rounded-lg border border-[#E2E8F0] text-xs focus:outline-none focus:border-[#00A86B]" />
                  {dropOpen && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 w-full bg-white border border-[#E2E8F0] rounded-xl shadow-xl z-50 mt-1 max-h-48 overflow-y-auto">
                      {suggestions.map(u => (
                        <button key={u._id} onClick={() => { setSelectedUser(u); setUserSearch(u.fullname || u.name || u.email || ''); setDropOpen(false); setSettings(null); setCreditBalance(null); }}
                          className="w-full text-left px-4 py-2.5 hover:bg-[#F8FAFC] transition-colors border-b border-[#F1F5F9] last:border-0">
                          <div className="text-xs font-bold text-[#0F172A]">{u.fullname || u.name || '—'}</div>
                          <div className="text-[10px] text-[#94A3B8]">{u.email}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {selectedUser && (
                <div className="flex items-center gap-3">
                  <div className="text-xs font-bold text-[#00A86B] bg-[#F0FDF4] border border-[#DCFCE7] px-3 py-1.5 rounded-lg">
                    Viewing: {selectedUser.fullname || selectedUser.name} · {selectedUser.email}
                  </div>
                  <button onClick={() => { setSelectedUser(null); setUserSearch(''); setSettings(null); setCreditBalance(null); }}
                    className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors">
                    Clear
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Placeholder (admin, no user selected) */}
        {isAdminView && !selectedUser && (
          <div className="bg-white border-2 border-dashed border-[#E2E8F0] rounded-2xl py-20 text-center">
            <div className="w-16 h-16 bg-[#F8FAFC] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#E2E8F0]">
              <Bell className="w-8 h-8 text-[#CBD5E1]" />
            </div>
            <p className="text-sm font-bold text-[#64748B]">Select a user to manage their notification settings</p>
            <p className="text-xs text-[#94A3B8] mt-1">Use the search field above to find a seller or user</p>
          </div>
        )}

        {/* Main content */}
        {showContent && (
          <>
            {/* Metrics */}
            {settings && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3 mb-4 md:mb-6">
                {[
                  { label: 'Credit Balance', value: creditBalance ?? 0, sub: '₹1 = 1 Credit', colorCls: 'text-[#00A86B]', bg: 'bg-[#F0FDF4]', border: 'border-[#DCFCE7]' },
                  { label: 'WhatsApp Active', value: `${countActive('WhatsApp')}/${STATUSES.length}`, sub: 'statuses enabled', colorCls: 'text-[#16A34A]', bg: 'bg-[#F0FDF4]', border: 'border-[#BBF7D0]' },
                  { label: 'SMS Active', value: `${countActive('SMS')}/${STATUSES.length}`, sub: 'statuses enabled', colorCls: 'text-orange-500', bg: 'bg-[#FFF7ED]', border: 'border-[#FED7AA]' },
                  { label: 'Email Active', value: `${countActive('Email')}/${STATUSES.length}`, sub: 'statuses enabled', colorCls: 'text-blue-500', bg: 'bg-[#EFF6FF]', border: 'border-[#BFDBFE]' },
                ].map(m => (
                  <div key={m.label} className={`${m.bg} border ${m.border} rounded-xl p-2.5 md:p-4 shadow-sm`}>
                    <div className={`text-base md:text-xl font-extrabold ${m.colorCls}`}>{m.value}</div>
                    <div className="text-[9px] md:text-[10px] font-bold text-[#64748B] uppercase tracking-wide mt-0.5 truncate">{m.label}</div>
                    <div className="hidden md:block text-[10px] text-[#94A3B8]">{m.sub}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Tabs */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm overflow-hidden">
              {/* Mobile — scrollable pill tabs */}
              <div className="md:hidden flex items-center gap-2 px-3 py-2.5 border-b border-[#E2E8F0] overflow-x-auto no-scrollbar">
                {TABS.filter(t => !t.adminOnly || isAdminView).map(tab => {
                  const Ico = tab.Icon;
                  return (
                    <button key={tab.key} onClick={() => navigate(`${notifBase}/${tab.key}`)}
                      className={`flex items-center gap-1.5 text-[12px] font-semibold py-1.5 px-3 rounded-full whitespace-nowrap shrink-0 transition-colors ${
                        activeTab === tab.key ? 'bg-[#00A86B] text-white' : 'bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]'
                      }`}>
                      <Ico className="w-3.5 h-3.5" />{tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Desktop — underline tabs */}
              <div className="hidden md:flex border-b border-[#E2E8F0] px-6 overflow-x-auto no-scrollbar">
                {TABS.filter(t => !t.adminOnly || isAdminView).map(tab => {
                  const Ico = tab.Icon;
                  return (
                    <button key={tab.key} onClick={() => navigate(`${notifBase}/${tab.key}`)}
                      className={`flex items-center gap-1.5 text-[13px] font-bold py-3 px-0.5 mr-6 border-b-[3px] whitespace-nowrap shrink-0 transition-colors ${
                        activeTab === tab.key ? 'border-[#00A86B] text-[#00A86B]' : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
                      }`}>
                      <Ico className="w-3.5 h-3.5" />{tab.label}
                    </button>
                  );
                })}
              </div>

              <div className="p-3 md:p-6">
                {loadingSettings ? (
                  <div className="py-16 text-center text-sm text-[#94A3B8]">Loading settings…</div>
                ) : !settings ? (
                  <div className="py-16 text-center text-sm text-[#94A3B8]">Could not load notification settings. Please try again.</div>
                ) : (
                  <>
                    {(activeTab === 'whatsapp' || activeTab === 'sms' || activeTab === 'email') && (
                      <ChannelTab
                        key={activeTab}
                        channelCfg={CHANNELS.find(c => c.type === activeTab)!}
                        settings={settings}
                        targetUserId={targetUserId}
                        onUpdate={setSettings}
                      />
                    )}
                    {activeTab === 'ai' && (
                      <AICallingTab settings={settings} targetUserId={targetUserId} onUpdate={setSettings} />
                    )}
                    {activeTab === 'history' && (
                      <CreditHistoryTab targetUserId={targetUserId} isAdminView={isAdminView} />
                    )}
                    {activeTab === 'alerts' && isAdminView && (
                      <CustomAlertsTab />
                    )}
                  </>
                )}
              </div>
            </div>
          </>
        )}

        </div>
        </div>

        {/* Modals */}
        <AnimatePresence>
          {buyOpen && (
            <BuyCreditsModal open onClose={() => setBuyOpen(false)}
              onSuccess={() => { fetchBalance(); showToast('Credits purchased successfully!'); }}
              targetUserId={targetUserId} />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {alertOpen && (
            <SendAlertModal open onClose={() => setAlertOpen(false)}
              targetUserId={targetUserId} targetUserName={targetUserName} />
          )}
        </AnimatePresence>

        {/* Page-level toast */}
        <AnimatePresence>
          {toast && (
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              className="fixed bottom-4 right-4 z-[120] px-4 py-2.5 rounded-xl bg-[#0F172A] text-white shadow-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />{toast}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </AdminLayout>
  );
}
