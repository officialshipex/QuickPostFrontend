/* QuickPost Cargo — Settings → API & Webhooks (the Cargo panel's /user/settings/webhook).
   B2B API key: one permanent key per seller; it stays the same until it is regenerated or revoked here.
   B2B webhooks, kept separate from the B2C ones:
     Shipment Details — sent as soon as the AWB of a Cargo order is assigned
     Tracking         — sent on every tracking update of a Cargo order
   Backend: /b2b-api (Shipex-backend API/B2B/b2bPanel.controller.js). */
import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { apiClient } from '../../services/apiClient';
import { Toast } from '../../components/ui/Toast';
import { useToast } from '../../hooks/useToast';
import { TableLoader } from '../../components/ui/TableLoader';
import {
  KeyRound, Copy, Eye, EyeOff, RefreshCcw, Trash2, Loader2, Webhook as WebhookIcon, Play, X,
  CheckCircle2, XCircle, PackageCheck, MapPinned, ShieldCheck, BookOpen, Download,
} from 'lucide-react';

const TXT = {
  title: 'text-[14px] font-semibold',
  label: 'text-[12px] font-semibold',
  value: 'text-[12px] font-normal',
};
const INPUT = `w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-[10px] ${TXT.value} text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20 focus:border-[#00A86B]`;
const BTN_PRIMARY = `h-9 px-4 rounded-lg bg-[#00A86B] text-white ${TXT.label} flex items-center gap-1.5 hover:bg-[#009B63] transition-colors shadow-sm disabled:opacity-60`;
const BTN_SECONDARY = `h-9 px-3 rounded-lg bg-white border border-[#E2E8F0] text-[#475569] ${TXT.label} flex items-center gap-1.5 hover:bg-[#F8FAFC] transition-colors disabled:opacity-60`;

type EventKey = 'shipment_details' | 'tracking';
type AuthType = 'none' | 'bearer' | 'basic' | 'header';

interface KeyInfo {
  exists: boolean;
  canManage: boolean;
  apiKey: string | null;
  keyPreview: string | null;
  generatedAt: string | null;
  lastUsedAt: string | null;
  apiBaseUrl?: string;
}

interface WebhookView {
  webhookId: string;
  event: EventKey;
  url: string;
  isActive: boolean;
  auth: { type: AuthType; username: string; headerName: string; hasSecret: boolean };
  signingSecret: string;
  lastDeliveryAt: string | null;
  lastDeliveryStatus: 'Success' | 'Failure' | null;
  lastHttpStatus: number | null;
}

interface LogRow {
  _id: string;
  webhookId: string;
  url: string;
  eventTopic: EventKey;
  eventId?: string;
  attempt?: number;
  httpStatus: number | null;
  status: 'Success' | 'Failure';
  responseTime: number;
  timestamp: string;
  payload?: unknown;
  response?: unknown;
}

const EVENTS: { key: EventKey; title: string; description: string; icon: typeof PackageCheck }[] = [
  {
    key: 'shipment_details',
    title: 'Shipment Details',
    description: 'Sent as soon as the AWB of a Cargo order is assigned (AWB, child AWBs, LRN, tracking link).',
    icon: PackageCheck,
  },
  {
    key: 'tracking',
    title: 'Tracking',
    description: 'Sent on every tracking update of a Cargo order (latest scan and full history).',
    icon: MapPinned,
  },
];

const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');
const errText = (err: any, fallback: string) => err?.response?.data?.message || fallback;
const saveFile = (url: string, name: string) => {
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
};

/* ---------------------------------------------------------------------------------------------------- */
function SecretText({ value, preview }: { value: string | null; preview?: string | null }) {
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState(false);
  if (!value) return <span className={`${TXT.value} text-[#64748B] font-mono`}>{preview || '—'}</span>;
  const copy = async () => {
    try { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ }
  };
  return (
    <div className="flex items-center gap-2 min-w-0">
      <code className={`${TXT.value} text-[#0F172A] font-mono bg-[#F8FAFC] border border-[#E2E8F0] rounded-md px-2 py-1 truncate`}>
        {shown ? value : preview || `${value.slice(0, 8)}${'•'.repeat(12)}`}
      </code>
      <button type="button" onClick={() => setShown(v => !v)} title={shown ? 'Hide' : 'Show'} className="text-[#94A3B8] hover:text-[#00A86B] transition-colors shrink-0">
        {shown ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
      <button type="button" onClick={copy} title="Copy" className="text-[#94A3B8] hover:text-[#00A86B] transition-colors shrink-0">
        {copied ? <CheckCircle2 className="w-4 h-4 text-[#00A86B]" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
}

/* ---------------------------------------------------------------------------------------------------- */
function WebhookCard({ meta, hook, onSaved, showToast }: {
  meta: typeof EVENTS[number];
  hook: WebhookView | null;
  onSaved: () => void;
  showToast: (type: 'success' | 'error' | 'info', text: string) => void;
}) {
  const [url, setUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [authType, setAuthType] = useState<AuthType>('none');
  const [token, setToken] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [headerName, setHeaderName] = useState('');
  const [headerValue, setHeaderValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setUrl(hook?.url || '');
    setIsActive(hook ? hook.isActive : true);
    setAuthType(hook?.auth.type || 'none');
    setUsername(hook?.auth.username || '');
    setHeaderName(hook?.auth.headerName || '');
    setToken(''); setPassword(''); setHeaderValue('');
    setError('');
  }, [hook]);

  const keepsSecret = Boolean(hook?.auth.hasSecret && hook.auth.type === authType);
  const secretPlaceholder = keepsSecret ? 'Saved — leave blank to keep' : '';

  const save = async () => {
    if (!url.trim()) { setError('Enter the URL that should receive this webhook.'); return; }
    if (!/^https:\/\//i.test(url.trim())) { setError('The URL must start with https://'); return; }
    setSaving(true); setError('');
    try {
      await apiClient.put(`/b2b-api/webhooks/${meta.key}`, {
        url: url.trim(),
        isActive,
        auth: { type: authType, token, username, password, headerName, headerValue },
      });
      showToast('success', `${meta.title} webhook saved`);
      onSaved();
    } catch (err: any) {
      setError(errText(err, 'Could not save the webhook.'));
    } finally {
      setSaving(false);
    }
  };

  const test = async () => {
    setTesting(true);
    try {
      const res = await apiClient.post(`/b2b-api/webhooks/${meta.key}/test`);
      const d = res.data?.data;
      if (d?.delivered) showToast('success', `Test delivered — HTTP ${d.httpStatus} in ${d.responseTime} ms`);
      else showToast('error', `Test not delivered${d?.httpStatus ? ` — HTTP ${d.httpStatus}` : ''}${d?.error ? ` — ${d.error}` : ''}`);
      onSaved();
    } catch (err: any) {
      showToast('error', errText(err, 'Could not send the test.'));
    } finally {
      setTesting(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Remove the ${meta.title} webhook? Nothing will be sent to this URL any more.`)) return;
    setRemoving(true);
    try {
      await apiClient.delete(`/b2b-api/webhooks/${meta.key}`);
      showToast('success', `${meta.title} webhook removed`);
      onSaved();
    } catch (err: any) {
      showToast('error', errText(err, 'Could not remove the webhook.'));
    } finally {
      setRemoving(false);
    }
  };

  const Icon = meta.icon;
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00A86B] to-[#007A4D] flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className={`${TXT.title} text-[#0F172A]`}>{meta.title}</h3>
            <p className={`${TXT.value} text-[#64748B] mt-0.5`}>{meta.description}</p>
          </div>
        </div>
        {hook && (
          <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold ${hook.isActive ? 'bg-[#F0FDF4] text-[#00A86B]' : 'bg-[#F8FAFC] text-[#94A3B8]'}`}>
            {hook.isActive ? 'Active' : 'Inactive'}
          </span>
        )}
      </div>

      <div>
        <label className={`block ${TXT.label} text-[#475569] mb-1.5`}>Callback URL <span className="text-red-500">*</span></label>
        <input className={INPUT} placeholder="https://your-domain.com/webhooks/cargo" value={url} onChange={e => setUrl(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={`block ${TXT.label} text-[#475569] mb-1.5`}>Authentication</label>
          <select className={INPUT} value={authType} onChange={e => setAuthType(e.target.value as AuthType)}>
            <option value="none">None</option>
            <option value="bearer">Bearer token</option>
            <option value="basic">Basic (username + password)</option>
            <option value="header">Custom header</option>
          </select>
        </div>
        {authType === 'bearer' && (
          <div>
            <label className={`block ${TXT.label} text-[#475569] mb-1.5`}>Token</label>
            <input className={INPUT} type="password" autoComplete="new-password" placeholder={secretPlaceholder || 'Token your endpoint expects'} value={token} onChange={e => setToken(e.target.value)} />
          </div>
        )}
        {authType === 'header' && (
          <div>
            <label className={`block ${TXT.label} text-[#475569] mb-1.5`}>Header name</label>
            <input className={INPUT} placeholder="X-Api-Key" value={headerName} onChange={e => setHeaderName(e.target.value)} />
          </div>
        )}
        {authType === 'basic' && (
          <div>
            <label className={`block ${TXT.label} text-[#475569] mb-1.5`}>Username</label>
            <input className={INPUT} autoComplete="off" value={username} onChange={e => setUsername(e.target.value)} />
          </div>
        )}
      </div>
      {authType === 'basic' && (
        <div>
          <label className={`block ${TXT.label} text-[#475569] mb-1.5`}>Password</label>
          <input className={INPUT} type="password" autoComplete="new-password" placeholder={secretPlaceholder} value={password} onChange={e => setPassword(e.target.value)} />
        </div>
      )}
      {authType === 'header' && (
        <div>
          <label className={`block ${TXT.label} text-[#475569] mb-1.5`}>Header value</label>
          <input className={INPUT} type="password" autoComplete="new-password" placeholder={secretPlaceholder} value={headerValue} onChange={e => setHeaderValue(e.target.value)} />
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className={`${TXT.label} text-[#475569]`}>Send this webhook</span>
        <button
          type="button"
          onClick={() => setIsActive(v => !v)}
          className={`w-11 h-6 rounded-full transition-colors relative ${isActive ? 'bg-[#00A86B]' : 'bg-[#E2E8F0]'}`}
          aria-label="Active"
        >
          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </button>
      </div>

      {hook && (
        <div className="bg-[#F8FAFC] rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className={`${TXT.value} text-[#64748B] shrink-0`}>Signing secret</span>
            <SecretText value={hook.signingSecret} />
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className={`${TXT.value} text-[#64748B]`}>Last delivery</span>
            <span className={`${TXT.value} flex items-center gap-1 ${hook.lastDeliveryStatus === 'Success' ? 'text-[#00A86B]' : hook.lastDeliveryStatus === 'Failure' ? 'text-red-500' : 'text-[#64748B]'}`}>
              {hook.lastDeliveryStatus === 'Success' && <CheckCircle2 className="w-3.5 h-3.5" />}
              {hook.lastDeliveryStatus === 'Failure' && <XCircle className="w-3.5 h-3.5" />}
              {hook.lastDeliveryAt ? `${fmtDate(hook.lastDeliveryAt)}${hook.lastHttpStatus ? ` · HTTP ${hook.lastHttpStatus}` : ''}` : 'Not sent yet'}
            </span>
          </div>
        </div>
      )}

      {error && <p className={`${TXT.value} text-red-500`}>{error}</p>}

      <div className="flex flex-wrap items-center gap-2 mt-auto">
        <button type="button" onClick={save} disabled={saving} className={BTN_PRIMARY}>
          {saving && <Loader2 className="w-4 h-4 animate-spin" />} {hook ? 'Save changes' : 'Save webhook'}
        </button>
        {hook && (
          <>
            <button type="button" onClick={test} disabled={testing} className={BTN_SECONDARY}>
              {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} Send test
            </button>
            <button type="button" onClick={remove} disabled={removing} className={`${BTN_SECONDARY} hover:text-red-500`}>
              <Trash2 className="w-4 h-4" /> Remove
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------------------------------- */
export function CargoApiWebhooks() {
  const { toast, showToast, closeToast } = useToast();
  const [tab, setTab] = useState<'setup' | 'logs'>('setup');

  const [keyInfo, setKeyInfo] = useState<KeyInfo | null>(null);
  const [keyLoading, setKeyLoading] = useState(true);
  const [keyBusy, setKeyBusy] = useState(false);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);

  const [hooks, setHooks] = useState<Record<EventKey, WebhookView | null>>({ shipment_details: null, tracking: null });
  const [hooksLoading, setHooksLoading] = useState(true);

  const [logs, setLogs] = useState<LogRow[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logEvent, setLogEvent] = useState<'' | EventKey>('');
  const [logDetail, setLogDetail] = useState<LogRow | null>(null);

  // The exact address for this account, from the backend (the company's own API domain when it has one)
  const apiBase = keyInfo?.apiBaseUrl || '';
  const [docsBusy, setDocsBusy] = useState(false);
  const [postmanBusy, setPostmanBusy] = useState(false);

  // Branded documentation (this company's name, logo, colours and addresses), opened in a new tab. The tab is
  // opened before the request so the browser does not block it as a pop-up.
  const openDocs = async () => {
    const tab = window.open('', '_blank');
    setDocsBusy(true);
    try {
      const res = await apiClient.get('/b2b-api/docs');
      const { html, fileName } = res.data?.data || {};
      const url = URL.createObjectURL(new Blob([html || ''], { type: 'text/html' }));
      if (tab) tab.location.href = url;
      else saveFile(url, fileName || 'B2B-API-Documentation.html');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err: any) {
      tab?.close();
      showToast('error', errText(err, 'Could not open the API documentation.'));
    } finally {
      setDocsBusy(false);
    }
  };

  const downloadPostman = async () => {
    setPostmanBusy(true);
    try {
      const res = await apiClient.get('/b2b-api/postman');
      const { collection, fileName } = res.data?.data || {};
      const url = URL.createObjectURL(new Blob([JSON.stringify(collection, null, 2)], { type: 'application/json' }));
      saveFile(url, fileName || 'B2B-API.postman_collection.json');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err: any) {
      showToast('error', errText(err, 'Could not download the Postman collection.'));
    } finally {
      setPostmanBusy(false);
    }
  };

  const loadKey = useCallback(async () => {
    setKeyLoading(true);
    try {
      const res = await apiClient.get('/b2b-api/key');
      setKeyInfo(res.data?.data || null);
    } catch (err: any) {
      showToast('error', errText(err, 'Could not load the API key.'));
    } finally {
      setKeyLoading(false);
    }
  }, [showToast]);

  const loadHooks = useCallback(async () => {
    setHooksLoading(true);
    try {
      const res = await apiClient.get('/b2b-api/webhooks');
      setHooks({ shipment_details: res.data?.data?.shipment_details || null, tracking: res.data?.data?.tracking || null });
    } catch (err: any) {
      showToast('error', errText(err, 'Could not load the webhooks.'));
    } finally {
      setHooksLoading(false);
    }
  }, [showToast]);

  const loadLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const res = await apiClient.get('/b2b-api/webhooks/logs', { params: { limit: 50, ...(logEvent ? { event: logEvent } : {}) } });
      setLogs(res.data?.data?.logs || []);
    } catch {
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
  }, [logEvent]);

  useEffect(() => { loadKey(); loadHooks(); }, [loadKey, loadHooks]);
  useEffect(() => { if (tab === 'logs') loadLogs(); }, [tab, loadLogs]);

  const generate = async () => {
    setKeyBusy(true);
    setConfirmRegenerate(false);
    try {
      const res = await apiClient.post('/b2b-api/key');
      setKeyInfo(res.data?.data || null);
      showToast('success', res.data?.message || 'API key generated');
    } catch (err: any) {
      showToast('error', errText(err, 'Could not generate the API key.'));
    } finally {
      setKeyBusy(false);
    }
  };

  const revoke = async () => {
    if (!window.confirm('Revoke the API key? Every call made with it will be refused until you generate a new key.')) return;
    setKeyBusy(true);
    try {
      await apiClient.delete('/b2b-api/key');
      showToast('success', 'API key revoked');
      loadKey();
    } catch (err: any) {
      showToast('error', errText(err, 'Could not revoke the API key.'));
    } finally {
      setKeyBusy(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto pb-10">
        <h1 className="text-[20px] font-bold text-[#0F172A] mb-1 flex items-center gap-2">
          <WebhookIcon className="w-5 h-5 text-[#00A86B]" /> API &amp; Webhooks
        </h1>
        <p className={`${TXT.value} text-[#64748B] mb-4`}>Connect your system to Cargo (B2B) shipments. These are separate from your B2C API and webhooks.</p>

        <div className="flex items-center gap-2 mb-5">
          {(['setup', 'logs'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`h-9 px-4 rounded-lg ${TXT.label} transition-colors ${tab === t ? 'bg-[#00A86B] text-white shadow-sm' : 'bg-white border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]'}`}
            >
              {t === 'setup' ? 'API Key & Webhooks' : 'Webhook Logs'}
            </button>
          ))}
        </div>

        {tab === 'setup' ? (
          <div className="space-y-5">
            {/* API key */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00A86B] to-[#007A4D] flex items-center justify-center shrink-0">
                    <KeyRound className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h3 className={`${TXT.title} text-[#0F172A]`}>B2B API Key</h3>
                    <p className={`${TXT.value} text-[#64748B] mt-0.5`}>
                      One permanent key — send it on every API call. It stays the same until you regenerate it here.
                    </p>
                  </div>
                </div>
                {keyInfo?.canManage && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => (keyInfo.exists ? setConfirmRegenerate(true) : generate())}
                      disabled={keyBusy || keyLoading}
                      className={BTN_PRIMARY}
                    >
                      {keyBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
                      {keyInfo.exists ? 'Regenerate key' : 'Generate key'}
                    </button>
                    {keyInfo.exists && (
                      <button onClick={revoke} disabled={keyBusy} className={`${BTN_SECONDARY} hover:text-red-500`}>
                        <Trash2 className="w-4 h-4" /> Revoke
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-4">
                {keyLoading ? (
                  <div className="flex items-center gap-2 text-[#64748B]"><Loader2 className="w-4 h-4 animate-spin" /><span className={TXT.value}>Loading…</span></div>
                ) : keyInfo?.exists ? (
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_auto] gap-3 items-center">
                    <SecretText value={keyInfo.apiKey} preview={keyInfo.keyPreview} />
                    <span className={`${TXT.value} text-[#64748B]`}>Generated: {fmtDate(keyInfo.generatedAt)}</span>
                    <span className={`${TXT.value} text-[#64748B]`}>Last used: {fmtDate(keyInfo.lastUsedAt)}</span>
                  </div>
                ) : (
                  <p className={`${TXT.value} text-[#64748B]`}>
                    {keyInfo?.canManage === false ? 'No key yet. Only the account owner can generate it.' : 'No key yet. Generate one to start using the B2B API.'}
                  </p>
                )}
                {keyInfo?.exists && keyInfo.canManage === false && (
                  <p className={`${TXT.value} text-[#94A3B8] mt-2`}>Only the account owner can see the full key.</p>
                )}
              </div>

              <div className="mt-4 bg-[#F8FAFC] rounded-xl p-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`${TXT.label} text-[#475569]`}>Base URL</span>
                    {apiBase ? <SecretText value={apiBase} preview={apiBase} /> : <span className={`${TXT.value} text-[#94A3B8]`}>—</span>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`${TXT.label} text-[#475569]`}>Header</span>
                    <code className={`${TXT.value} font-mono text-[#0F172A]`}>Authorization: Bearer &lt;your API key&gt;</code>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <button type="button" onClick={openDocs} disabled={docsBusy} className={BTN_SECONDARY}>
                    {docsBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />} API documentation
                  </button>
                  <button type="button" onClick={downloadPostman} disabled={postmanBusy} className={BTN_SECONDARY}>
                    {postmanBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Postman collection
                  </button>
                </div>
              </div>
            </div>

            {/* Webhooks */}
            {hooksLoading ? (
              <div className="flex items-center gap-2 text-[#64748B]"><Loader2 className="w-4 h-4 animate-spin" /><span className={TXT.value}>Loading webhooks…</span></div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                {EVENTS.map(meta => (
                  <WebhookCard key={meta.key} meta={meta} hook={hooks[meta.key]} onSaved={loadHooks} showToast={showToast} />
                ))}
              </div>
            )}

            <div className="flex items-start gap-2 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl p-3">
              <ShieldCheck className="w-4 h-4 text-[#00A86B] mt-0.5 shrink-0" />
              <p className={`${TXT.value} text-[#166534]`}>
                Every webhook is signed: the <code className="font-mono">X-Webhook-Signature</code> header is
                {' '}<code className="font-mono">sha256=</code> HMAC-SHA256 of <code className="font-mono">"&lt;X-Webhook-Timestamp&gt;.&lt;raw body&gt;"</code> with
                that webhook's signing secret. Use <code className="font-mono">X-Webhook-Id</code> to ignore a repeated delivery. Failed deliveries are retried after 1, 5 and 15 minutes.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3 gap-2">
              <h2 className={`${TXT.title} text-[#0F172A]`}>Recent Webhook Deliveries</h2>
              <div className="flex items-center gap-2">
                <select className={`${INPUT} w-[180px]`} value={logEvent} onChange={e => setLogEvent(e.target.value as '' | EventKey)}>
                  <option value="">All events</option>
                  <option value="shipment_details">Shipment Details</option>
                  <option value="tracking">Tracking</option>
                </select>
                <button onClick={loadLogs} className="w-9 h-9 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-[#F8FAFC] transition-colors">
                  <RefreshCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
              <div className="overflow-x-auto relative">
                {logsLoading && <TableLoader />}
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-[#E6F9F2] text-[#0F172A]">
                      {['Event', 'URL', 'Attempt', 'Status Code', 'Response Time', 'Result', 'Sent At', ''].map(h => (
                        <th key={h} className={`px-4 py-3 ${TXT.label} whitespace-nowrap`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {logsLoading ? null : logs.length ? logs.map(log => (
                      <tr key={log._id} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors">
                        <td className={`px-4 py-3 ${TXT.value} text-[#0F172A]`}>{log.eventTopic === 'tracking' ? 'Tracking' : 'Shipment Details'}</td>
                        <td className={`px-4 py-3 ${TXT.value} text-[#0F172A] max-w-[240px] truncate`} title={log.url}>{log.url}</td>
                        <td className={`px-4 py-3 ${TXT.value} text-[#64748B]`}>{log.attempt ?? 1}</td>
                        <td className={`px-4 py-3 ${TXT.value} text-[#64748B]`}>{log.httpStatus ?? '—'}</td>
                        <td className={`px-4 py-3 ${TXT.value} text-[#64748B]`}>{log.responseTime != null ? `${log.responseTime} ms` : '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 ${TXT.value} ${log.status === 'Success' ? 'text-[#00A86B]' : 'text-red-500'}`}>
                            {log.status === 'Success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                            {log.status === 'Success' ? 'Success' : 'Failed'}
                          </span>
                        </td>
                        <td className={`px-4 py-3 ${TXT.value} text-[#64748B] whitespace-nowrap`}>{fmtDate(log.timestamp)}</td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => setLogDetail(log)} title="View details" className="w-7 h-7 rounded-full flex items-center justify-center ml-auto text-[#94A3B8] hover:text-[#00A86B] hover:bg-[#F0FDF4] transition-colors">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={8} className={`px-4 py-16 text-center ${TXT.value} text-[#94A3B8]`}>No webhook deliveries yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Regenerate confirmation */}
      <AnimatePresence>
        {confirmRegenerate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4" onClick={() => setConfirmRegenerate(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="w-full max-w-[440px] bg-white rounded-[20px] border border-[#E2E8F0] p-6" onClick={e => e.stopPropagation()}>
              <h3 className="text-base font-semibold text-[#0F172A] mb-2">Regenerate API key?</h3>
              <p className={`${TXT.value} text-[#475569] mb-5`}>The current key stops working immediately. Update the new key in every system that calls the B2B API.</p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setConfirmRegenerate(false)} className={BTN_SECONDARY}>Cancel</button>
                <button onClick={generate} className={BTN_PRIMARY}>Regenerate</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Log detail */}
      <AnimatePresence>
        {logDetail && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4" onClick={() => setLogDetail(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="w-full max-w-[640px] bg-white rounded-[20px] border border-[#E2E8F0] overflow-hidden max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between shrink-0">
                <h3 className="text-base font-semibold text-[#0F172A]">Delivery Details</h3>
                <button onClick={() => setLogDetail(null)} className="w-8 h-8 rounded-full flex items-center justify-center text-[#64748B] hover:bg-[#F1F5F9]"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-6 overflow-y-auto space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ['Event ID', logDetail.eventId || '—'],
                    ['Attempt', String(logDetail.attempt ?? 1)],
                    ['Status Code', String(logDetail.httpStatus ?? '—')],
                    ['Response Time', logDetail.responseTime != null ? `${logDetail.responseTime} ms` : '—'],
                    ['Result', logDetail.status],
                    ['Sent At', fmtDate(logDetail.timestamp)],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-[#F8FAFC] rounded-xl p-3">
                      <p className={`${TXT.value} text-[#94A3B8] mb-0.5`}>{label}</p>
                      <p className={`${TXT.label} text-[#0F172A] break-all`}>{value}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <p className={`${TXT.label} text-[#475569] mb-1.5`}>Payload</p>
                  <pre className={`bg-[#0F172A] text-[#94A3B8] rounded-xl p-4 ${TXT.value} overflow-x-auto whitespace-pre-wrap break-all`}>{JSON.stringify(logDetail.payload ?? null, null, 2)}</pre>
                </div>
                <div>
                  <p className={`${TXT.label} text-[#475569] mb-1.5`}>Response</p>
                  <pre className={`bg-[#0F172A] text-[#94A3B8] rounded-xl p-4 ${TXT.value} overflow-x-auto whitespace-pre-wrap break-all`}>{JSON.stringify(logDetail.response ?? null, null, 2)}</pre>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Toast toast={toast} onClose={closeToast} />
    </AdminLayout>
  );
}
