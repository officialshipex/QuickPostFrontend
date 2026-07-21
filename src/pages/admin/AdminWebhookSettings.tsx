import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { apiClient } from '../../services/apiClient';
import { TableLoader } from '../../components/ui/TableLoader';
import {
  ArrowLeft, Plus, X, RefreshCcw, Trash2, Pencil, Copy, Eye, EyeOff,
  CheckCircle2, XCircle, Loader2, Webhook as WebhookIcon,
} from 'lucide-react';

const TXT = {
  title: 'text-[14px] font-semibold',
  label: 'text-[12px] font-semibold',
  value: 'text-[12px] font-normal',
};

const TOPIC_OPTIONS = ['track update', 'order created', 'order cancelled', 'ndr raised', 'rto initiated'];

interface WebhookRow {
  _id: string;
  url: string;
  secret: string;
  alertEmail: string;
  topics: string[];
  updatedAt: string;
  status: 'Active' | 'Inactive';
}

interface WebhookLogRow {
  _id: string;
  webhookId: string;
  event: string;
  statusCode: number;
  success: boolean;
  createdAt: string;
}

const genSecret = () => Array.from({ length: 24 }, () => Math.floor(Math.random() * 36).toString(36)).join('');

export function AdminWebhookSettings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'webhooks' | 'logs'>('webhooks');

  const [webhooks, setWebhooks] = useState<WebhookRow[]>([]);
  const [logs, setLogs] = useState<WebhookLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [revealedSecretId, setRevealedSecretId] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookRow | null>(null);
  const [formUrl, setFormUrl] = useState('');
  const [formSecret, setFormSecret] = useState('');
  const [formAlertEmail, setFormAlertEmail] = useState('');
  const [formTopics, setFormTopics] = useState<string[]>(['track update']);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchWebhooks = useCallback(async () => {
    setLoading(true);
    try {
      // TODO: webhook backend endpoints are not yet finalized — swap in the real routes once confirmed.
      const res = await apiClient.get('/webhook/getAllWebhooks');
      setWebhooks(res.data?.webhooks || []);
    } catch {
      setWebhooks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/webhook/getWebhookLogs');
      setLogs(res.data?.logs || []);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'webhooks') fetchWebhooks();
    else fetchLogs();
  }, [activeTab, fetchWebhooks, fetchLogs]);

  const openAddModal = () => {
    setEditingWebhook(null);
    setFormUrl('');
    setFormSecret(genSecret());
    setFormAlertEmail('');
    setFormTopics(['track update']);
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (wh: WebhookRow) => {
    setEditingWebhook(wh);
    setFormUrl(wh.url);
    setFormSecret(wh.secret);
    setFormAlertEmail(wh.alertEmail);
    setFormTopics(wh.topics);
    setFormError('');
    setModalOpen(true);
  };

  const toggleTopic = (topic: string) => {
    setFormTopics(prev => prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]);
  };

  const handleSave = async () => {
    if (!formUrl.trim()) { setFormError('URL is required'); return; }
    if (!formSecret.trim()) { setFormError('Secret is required'); return; }
    if (formTopics.length === 0) { setFormError('Select at least one topic'); return; }

    setSaving(true);
    setFormError('');
    try {
      const payload = { url: formUrl.trim(), secret: formSecret.trim(), alertEmail: formAlertEmail.trim(), topics: formTopics };
      if (editingWebhook) {
        await apiClient.put(`/webhook/updateWebhook/${editingWebhook._id}`, payload);
      } else {
        await apiClient.post('/webhook/createWebhook', payload);
      }
      setModalOpen(false);
      fetchWebhooks();
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'Failed to save webhook.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (wh: WebhookRow) => {
    if (!window.confirm(`Delete webhook for ${wh.url}?`)) return;
    try {
      await apiClient.delete(`/webhook/deleteWebhook/${wh._id}`);
      setWebhooks(prev => prev.filter(w => w._id !== wh._id));
    } catch {
      // silent
    }
  };

  const copyToClipboard = async (text: string) => {
    try { await navigator.clipboard.writeText(text); } catch { /* silent */ }
  };

  const maskSecret = (secret: string) => secret ? `${secret.slice(0, 4)}${'•'.repeat(Math.max(secret.length - 4, 4))}` : '—';

  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto pb-10">
        <button
          onClick={() => navigate('/user/settings')}
          className={`flex items-center gap-2 ${TXT.label} text-[#64748B] hover:text-[#0F172A] transition-colors bg-white px-3.5 py-2 rounded-lg border border-[#E2E8F0] hover:border-[#CBD5E1] mb-4`}
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Settings
        </button>

        <h1 className={`text-[20px] font-bold text-[#0F172A] mb-4 flex items-center gap-2`}>
          <WebhookIcon className="w-5 h-5 text-[#00A86B]" /> Webhook Settings
        </h1>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-5">
          <button
            onClick={() => setActiveTab('webhooks')}
            className={`h-9 px-4 rounded-lg ${TXT.label} transition-colors ${activeTab === 'webhooks' ? 'bg-[#00A86B] text-white shadow-sm' : 'bg-white border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]'}`}
          >
            Manage Webhooks
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`h-9 px-4 rounded-lg ${TXT.label} transition-colors ${activeTab === 'logs' ? 'bg-[#00A86B] text-white shadow-sm' : 'bg-white border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]'}`}
          >
            Webhook Logs
          </button>
        </div>

        {activeTab === 'webhooks' ? (
          <>
            <div className="flex items-center justify-between mb-3">
              <h2 className={`${TXT.title} text-[#0F172A]`}>All Configured Webhooks</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchWebhooks}
                  className="w-9 h-9 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-[#F8FAFC] transition-colors"
                >
                  <RefreshCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={openAddModal}
                  className={`h-9 px-4 rounded-lg bg-[#00A86B] text-white ${TXT.label} flex items-center gap-1.5 hover:bg-[#009B63] transition-colors shadow-sm`}
                >
                  <Plus className="w-4 h-4" /> Add Webhook
                </button>
              </div>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
              <div className="overflow-x-auto relative">
                {loading && <TableLoader />}
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-[#00A86B] text-white">
                      <th className={`px-4 py-3 ${TXT.label} whitespace-nowrap`}>Webhook ID</th>
                      <th className={`px-4 py-3 ${TXT.label} whitespace-nowrap`}>Updated On</th>
                      <th className={`px-4 py-3 ${TXT.label} whitespace-nowrap`}>URL</th>
                      <th className={`px-4 py-3 ${TXT.label} whitespace-nowrap`}>Topics</th>
                      <th className={`px-4 py-3 ${TXT.label} whitespace-nowrap`}>Alert Email</th>
                      <th className={`px-4 py-3 ${TXT.label} whitespace-nowrap`}>Secret</th>
                      <th className={`px-4 py-3 ${TXT.label} whitespace-nowrap text-right`}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? null : webhooks.length > 0 ? (
                      webhooks.map((wh) => (
                        <tr key={wh._id} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors">
                          <td className={`px-4 py-3 ${TXT.value} text-[#00A86B] font-medium`}>{wh._id.slice(-8)}</td>
                          <td className={`px-4 py-3 ${TXT.value} text-[#64748B]`}>
                            {wh.updatedAt ? new Date(wh.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                          </td>
                          <td className={`px-4 py-3 ${TXT.value} text-[#0F172A] max-w-[220px] truncate`} title={wh.url}>{wh.url}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {wh.topics.map(t => (
                                <span key={t} className={`px-2 py-0.5 rounded-full bg-[#F0FDF4] text-[#00A86B] ${TXT.value}`}>{t}</span>
                              ))}
                            </div>
                          </td>
                          <td className={`px-4 py-3 ${TXT.value} text-[#64748B]`}>{wh.alertEmail || '—'}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <span className={`${TXT.value} text-[#64748B] font-mono`}>
                                {revealedSecretId === wh._id ? wh.secret : maskSecret(wh.secret)}
                              </span>
                              <button
                                onClick={() => setRevealedSecretId(prev => prev === wh._id ? null : wh._id)}
                                className="text-[#94A3B8] hover:text-[#00A86B] transition-colors"
                              >
                                {revealedSecretId === wh._id ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={() => copyToClipboard(wh.secret)}
                                className="text-[#94A3B8] hover:text-[#00A86B] transition-colors"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openEditModal(wh)}
                                className="w-7 h-7 rounded-full flex items-center justify-center text-[#94A3B8] hover:text-[#00A86B] hover:bg-[#F0FDF4] transition-colors"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(wh)}
                                className="w-7 h-7 rounded-full flex items-center justify-center text-[#94A3B8] hover:text-red-500 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className={`px-4 py-16 text-center ${TXT.value} text-[#94A3B8]`}>
                          No webhooks found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <h2 className={`${TXT.title} text-[#0F172A]`}>Recent Webhook Deliveries</h2>
              <button
                onClick={fetchLogs}
                className="w-9 h-9 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-[#F8FAFC] transition-colors"
              >
                <RefreshCcw className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
              <div className="overflow-x-auto relative">
                {loading && <TableLoader />}
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-[#00A86B] text-white">
                      <th className={`px-4 py-3 ${TXT.label} whitespace-nowrap`}>Event</th>
                      <th className={`px-4 py-3 ${TXT.label} whitespace-nowrap`}>Status Code</th>
                      <th className={`px-4 py-3 ${TXT.label} whitespace-nowrap`}>Result</th>
                      <th className={`px-4 py-3 ${TXT.label} whitespace-nowrap`}>Delivered At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? null : logs.length > 0 ? (
                      logs.map((log) => (
                        <tr key={log._id} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors">
                          <td className={`px-4 py-3 ${TXT.value} text-[#0F172A]`}>{log.event}</td>
                          <td className={`px-4 py-3 ${TXT.value} text-[#64748B]`}>{log.statusCode}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 ${TXT.value} ${log.success ? 'text-[#00A86B]' : 'text-red-500'}`}>
                              {log.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                              {log.success ? 'Success' : 'Failed'}
                            </span>
                          </td>
                          <td className={`px-4 py-3 ${TXT.value} text-[#64748B]`}>
                            {log.createdAt ? new Date(log.createdAt).toLocaleString('en-IN') : '—'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className={`px-4 py-16 text-center ${TXT.value} text-[#94A3B8]`}>
                          No webhook logs found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add/Edit Webhook Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              className="w-full max-w-[520px] bg-white rounded-[20px] shadow-[0_40px_80px_-16px_rgba(0,0,0,0.2)] border border-[#E2E8F0] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-5 border-b border-[#E2E8F0] flex items-center justify-between">
                <h3 className={`text-base font-semibold text-[#0F172A]`}>{editingWebhook ? 'Edit Webhook' : 'Add New Webhook'}</h3>
                <button onClick={() => setModalOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-[#64748B] hover:bg-[#F1F5F9] transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <label className={`block ${TXT.label} text-[#475569] mb-1.5`}>URL <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    placeholder="https://your-api.com/webhook"
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    className={`w-full h-11 px-4 bg-white border border-[#E2E8F0] rounded-[12px] ${TXT.value} text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20 focus:border-[#00A86B]`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block ${TXT.label} text-[#475569] mb-1.5`}>Secret <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Enter secret"
                        value={formSecret}
                        onChange={(e) => setFormSecret(e.target.value)}
                        className={`w-full h-11 pl-4 pr-9 bg-white border border-[#E2E8F0] rounded-[12px] ${TXT.value} text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20 focus:border-[#00A86B]`}
                      />
                      <button
                        type="button"
                        onClick={() => setFormSecret(genSecret())}
                        title="Generate new secret"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#00A86B] transition-colors"
                      >
                        <RefreshCcw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className={`block ${TXT.label} text-[#475569] mb-1.5`}>Alert Email</label>
                    <input
                      type="email"
                      placeholder="tech@example.com"
                      value={formAlertEmail}
                      onChange={(e) => setFormAlertEmail(e.target.value)}
                      className={`w-full h-11 px-4 bg-white border border-[#E2E8F0] rounded-[12px] ${TXT.value} text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20 focus:border-[#00A86B]`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block ${TXT.label} text-[#475569] mb-2`}>Topics <span className="text-red-500">*</span></label>
                  <div className="flex flex-wrap gap-2">
                    {TOPIC_OPTIONS.map(topic => {
                      const active = formTopics.includes(topic);
                      return (
                        <button
                          key={topic}
                          type="button"
                          onClick={() => toggleTopic(topic)}
                          className={`px-3 py-1.5 rounded-full ${TXT.label} transition-colors ${active ? 'bg-[#00A86B] text-white' : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]'}`}
                        >
                          {topic}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {formError && <p className={`${TXT.value} text-red-500`}>{formError}</p>}
              </div>

              <div className="px-6 py-5 border-t border-[#E2E8F0] flex justify-end gap-3">
                <button
                  onClick={() => setModalOpen(false)}
                  className={`px-5 h-11 rounded-[12px] ${TXT.label} text-[#475569] bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-all`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={`px-6 h-11 rounded-[12px] ${TXT.label} text-white bg-[#00A86B] hover:bg-[#009B63] transition-all shadow-sm flex items-center gap-2 disabled:opacity-60`}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {editingWebhook ? 'Save Changes' : 'Create Webhook'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
