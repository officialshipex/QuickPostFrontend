import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight, ChevronDown, RefreshCw, AlertTriangle, Copy, Check } from 'lucide-react';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { apiClient } from '../../services/apiClient';
import { companiesApi, type CompanySummary } from '../../services/companiesApi';

/* Admin → System Logs (platform admin). One page for the daily check: every call sellers' systems make to our API,
   every call we make to a courier / payment / shop, every courier webhook, and tracking-job alerts — kept 72 hours
   (backend monitoring/). Click a row to see its request and response right there. Filters live in the URL. */

type Kind = 'seller_api' | 'courier_call' | 'courier_webhook' | 'job_alert';

type LogRow = {
  _id: string;
  at: string;
  kind: Kind;
  tenantKey?: string;
  partner?: string;
  user?: string;
  method?: string;
  url?: string;
  status?: number;
  isError?: boolean;
  ms?: number;
  error?: string;
  awb?: string;
  orderId?: string;
};

type FullLog = LogRow & { req?: string; res?: string };

type Alert = { tenantKey: string; partner: string; severity: 'critical' | 'warning'; message: string; lastRun: string };

type Summary = {
  last24h: Record<Kind, { total: number; errors: number }>;
  partners: string[];
  trackingHealth: { partner: string; checked: number; saved: number; noData: number; failed: number; lastRun: string }[];
  alerts: Alert[];
  storage: { enabled: boolean; connected: boolean; mode: 'full' | 'errors' | 'off'; usage: number | null; dropped: number };
};

const KIND_LABEL: Record<Kind, string> = {
  seller_api: 'Seller API',
  courier_call: 'Outgoing call',
  courier_webhook: 'Courier webhook',
  job_alert: 'Job alert',
};

const KIND_STYLE: Record<Kind, string> = {
  seller_api: 'bg-[#EFF6FF] text-[#1D4ED8]',
  courier_call: 'bg-[#F5F3FF] text-[#6D28D9]',
  courier_webhook: 'bg-[#ECFEFF] text-[#0E7490]',
  job_alert: 'bg-[#FEF2F2] text-[#B91C1C]',
};

const fmtTime = (d: string) => new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' });

// Show a stored body as indented JSON when it is JSON, else as it is.
const pretty = (text?: string) => {
  if (!text) return '';
  try { return JSON.stringify(JSON.parse(text), null, 2); } catch { return text; }
};

const LIMIT = 50;

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" onClick={() => { navigator.clipboard?.writeText(text).then(() => { setDone(true); window.setTimeout(() => setDone(false), 1200); }).catch(() => {}); }}
      className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#64748B] hover:text-[#00A86B]">
      {done ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}{done ? 'Copied' : 'Copy'}
    </button>
  );
}

export function AdminSystemLogs() {
  const [params, setParams] = useSearchParams();
  const company = params.get('company') || '';
  const kind = (params.get('kind') || '') as Kind | '';
  const errorsOnly = params.get('errors') === '1';
  const partner = params.get('partner') || '';
  const q = params.get('q') || '';
  const hours = params.get('hours') || '24';
  const page = Math.max(1, Number(params.get('page')) || 1);

  const setParam = useCallback((changes: Record<string, string>) => {
    setParams(prev => {
      const next = new URLSearchParams(prev);
      for (const [k, v] of Object.entries(changes)) { if (v) next.set(k, v); else next.delete(k); }
      if (!('page' in changes)) next.delete('page');
      return next;
    }, { replace: true });
  }, [setParams]);

  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [search, setSearch] = useState(q);
  const [rows, setRows] = useState<LogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, FullLog | 'loading' | 'error'>>({});
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    companiesApi.list().then(r => setCompanies(r.data.companies || [])).catch(() => {});
  }, []);

  // search as you type, without a request per keystroke
  useEffect(() => {
    const id = window.setTimeout(() => { if (search.trim() !== q) setParam({ q: search.trim() }); }, 400);
    return () => window.clearTimeout(id);
  }, [search, q, setParam]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = window.setInterval(() => setTick(t => t + 1), 60000);
    return () => window.clearInterval(id);
  }, [autoRefresh]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    const listParams = { tenantKey: company || undefined, kind: kind || undefined, errorsOnly: errorsOnly ? '1' : undefined, partner: partner || undefined, q: q || undefined, hours, page, limit: LIMIT };
    Promise.all([
      apiClient.get('/platform-admin/system-logs', { params: listParams }),
      apiClient.get('/platform-admin/system-logs/summary', { params: { tenantKey: company || undefined } }),
    ])
      .then(([list, sum]) => {
        if (cancelled) return;
        setRows(list.data.rows || []);
        setTotal(list.data.total || 0);
        setSummary(sum.data);
      })
      .catch(err => { if (!cancelled) setError(err?.response?.data?.message || 'Could not load the logs'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [company, kind, errorsOnly, partner, q, hours, page, tick]);

  const toggleRow = (id: string) => {
    if (openId === id) { setOpenId(null); return; }
    setOpenId(id);
    if (details[id] && details[id] !== 'error') return;
    setDetails(d => ({ ...d, [id]: 'loading' }));
    apiClient.get(`/platform-admin/system-logs/${id}`)
      .then(r => setDetails(d => ({ ...d, [id]: r.data.log })))
      .catch(() => setDetails(d => ({ ...d, [id]: 'error' })));
  };

  const companyName = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of companies) map[c.tenantKey] = c.branding?.companyDisplayName || c.displayName || c.tenantKey;
    return (key?: string) => (key ? map[key] || key : '—');
  }, [companies]);

  const pages = Math.max(1, Math.ceil(total / LIMIT));
  const kinds: (Kind | '')[] = ['', 'seller_api', 'courier_call', 'courier_webhook', 'job_alert'];

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl font-bold text-[#0F172A]">System Logs</h2>
          <p className="text-xs text-[#64748B] mt-1">Seller API calls, calls we make to couriers / payment / shops, courier webhooks, and tracking alerts for every company. Kept for 72 hours.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-[12px] font-semibold text-[#475569] cursor-pointer select-none">
            <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} className="accent-[#00A86B]" />
            Auto-refresh every minute
          </label>
          <button type="button" onClick={() => setTick(t => t + 1)} className="h-9 px-3 rounded-lg border border-[#E2E8F0] bg-white text-[12px] font-semibold text-[#475569] hover:bg-[#F8FAFC] inline-flex items-center gap-1.5">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* company switcher */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[{ tenantKey: '', label: 'All companies', logo: '' }, ...companies.map(c => ({ tenantKey: c.tenantKey, label: c.branding?.companyDisplayName || c.displayName, logo: c.branding?.iconUrl || c.branding?.faviconUrl || '' }))].map(c => (
          <button key={c.tenantKey || 'all'} type="button" onClick={() => setParam({ company: c.tenantKey })}
            className={`h-9 pl-2 pr-3 rounded-lg border text-[12px] font-semibold inline-flex items-center gap-2 transition-colors ${company === c.tenantKey ? 'border-[#00A86B] bg-[#E6F9F2] text-[#0F6B38]' : 'border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F8FAFC]'}`}>
            {c.logo
              ? <img src={c.logo} alt="" className="w-5 h-5 rounded object-contain" />
              : <span className="w-5 h-5 rounded bg-[#F1F5F9] text-[10px] font-bold text-[#64748B] flex items-center justify-center">{c.tenantKey ? c.label.slice(0, 1).toUpperCase() : '★'}</span>}
            {c.label}
          </button>
        ))}
      </div>

      {/* alerts */}
      {summary?.alerts?.length ? (
        <div className="flex flex-col gap-2 mb-4">
          {summary.alerts.map(a => (
            <div key={`${a.tenantKey}|${a.partner}`} className={`rounded-xl border px-4 py-3 flex items-start gap-3 ${a.severity === 'critical' ? 'bg-[#FEF2F2] border-[#FECACA]' : 'bg-[#FFFBEB] border-[#FDE68A]'}`}>
              <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${a.severity === 'critical' ? 'text-[#DC2626]' : 'text-[#D97706]'}`} />
              <div className="text-[12px] text-[#0F172A] flex-1">
                <span className="font-bold">{a.partner} tracking · {companyName(a.tenantKey)}</span> — {a.message}
                <button type="button" onClick={() => setParam({ company: a.tenantKey, partner: a.partner, kind: 'courier_call', errors: '1' })} className="ml-2 font-semibold text-[#00A86B] hover:underline">Show its errors</button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* summary: last 24 hours + tracking health */}
      {summary && (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-4 mb-4 flex flex-col gap-3">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-[12px]">
            <span className="font-bold text-[#0F172A]">Last 24 h</span>
            {(Object.keys(KIND_LABEL) as Kind[]).map(k => (
              <span key={k} className="text-[#475569]">
                {KIND_LABEL[k]}: <b className="text-[#0F172A]">{summary.last24h[k]?.total ?? 0}</b>
                {summary.last24h[k]?.errors ? <span className="text-[#DC2626] font-semibold"> · {summary.last24h[k].errors} errors</span> : null}
              </span>
            ))}
          </div>
          {summary.trackingHealth.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-[12px] font-bold text-[#0F172A] mr-1">Tracking saved (24 h)</span>
              {summary.trackingHealth.map(h => {
                const bad = h.checked > 0 && h.saved === 0;
                return (
                  <span key={h.partner} title={`${h.checked} checked · ${h.saved} saved · ${h.noData} no tracking from courier · ${h.failed} failed in our code`}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${bad ? 'bg-[#FEF2F2] text-[#B91C1C]' : 'bg-[#F0FDF4] text-[#0F6B38]'}`}>
                    {h.partner} {h.saved}/{h.checked}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* filters */}
      <div className="flex flex-col xl:flex-row xl:items-center gap-3 mb-4">
        <div className="inline-flex flex-wrap rounded-lg border border-[#E2E8F0] bg-white p-0.5 w-fit">
          {kinds.map(k => (
            <button key={k || 'all'} type="button" onClick={() => setParam({ kind: k })}
              className={`h-8 px-3 rounded-md text-[12px] font-semibold transition-colors ${kind === k ? 'bg-[#00A86B] text-white' : 'text-[#475569] hover:bg-[#F8FAFC]'}`}>
              {k ? KIND_LABEL[k] : 'All'}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-[12px] font-semibold text-[#475569] cursor-pointer select-none">
          <input type="checkbox" checked={errorsOnly} onChange={e => setParam({ errors: e.target.checked ? '1' : '' })} className="accent-[#DC2626]" />
          Errors only
        </label>
        <select value={partner} onChange={e => setParam({ partner: e.target.value })}
          className="h-9 px-3 rounded-lg border border-[#E2E8F0] bg-white text-[12px] text-[#475569] focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20">
          <option value="">All couriers / services</option>
          {(summary?.partners || []).map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={hours} onChange={e => setParam({ hours: e.target.value })}
          className="h-9 px-3 rounded-lg border border-[#E2E8F0] bg-white text-[12px] text-[#475569] focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20">
          <option value="1">Last 1 hour</option>
          <option value="6">Last 6 hours</option>
          <option value="24">Last 24 hours</option>
          <option value="72">Last 72 hours</option>
        </select>
        <div className="relative w-full xl:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="AWB, order ID, seller, URL or error"
            className="w-full h-9 pl-9 pr-4 rounded-lg border border-[#E2E8F0] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20 focus:border-[#00A86B]" />
        </div>
      </div>

      {/* the list */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className="bg-[#E6F9F2] border-b border-[#E2E8F0] text-[10px] uppercase tracking-wider font-bold text-[#64748B]">
                <th className="p-3 w-8" />
                <th className="p-3">Time</th>
                <th className="p-3">Type</th>
                <th className="p-3">Company</th>
                <th className="p-3">Seller</th>
                <th className="p-3">Courier / service</th>
                <th className="p-3">Endpoint</th>
                <th className="p-3">AWB / Order</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Time taken</th>
              </tr>
            </thead>
            <tbody className="text-xs font-medium text-[#475569]">
              {loading && rows.length === 0 ? (
                <tr><td colSpan={10} className="p-8 text-center text-[#94A3B8]">Loading…</td></tr>
              ) : error ? (
                <tr><td colSpan={10} className="p-8 text-center text-[#DC2626]">{error}</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={10} className="p-8 text-center text-[#94A3B8]">No logs for these filters.</td></tr>
              ) : rows.map(r => {
                const open = openId === r._id;
                const d = details[r._id];
                return (
                  <Fragment key={r._id}>
                    <tr onClick={() => toggleRow(r._id)}
                      className={`border-b border-[#E2E8F0] cursor-pointer transition-colors align-top ${r.isError ? 'bg-[#FEF2F2]/60 hover:bg-[#FEF2F2]' : 'hover:bg-[#F8FAFC]'}`}>
                      <td className="p-3"><ChevronDown className={`w-3.5 h-3.5 text-[#94A3B8] transition-transform ${open ? '' : '-rotate-90'}`} /></td>
                      <td className="p-3 whitespace-nowrap text-[11px]">{fmtTime(r.at)}</td>
                      <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${KIND_STYLE[r.kind]}`}>{KIND_LABEL[r.kind]}</span></td>
                      <td className="p-3 whitespace-nowrap">{companyName(r.tenantKey)}</td>
                      <td className="p-3 max-w-[160px] truncate" title={r.user}>{r.user || <span className="text-[#CBD5E1]">—</span>}</td>
                      <td className="p-3 whitespace-nowrap">{r.partner || <span className="text-[#CBD5E1]">—</span>}</td>
                      <td className="p-3 max-w-[300px]">
                        <div className="truncate font-mono text-[11px]" title={r.url}>{r.method ? `${r.method} ` : ''}{r.url}</div>
                        {r.error && <div className="text-[11px] text-[#DC2626] mt-0.5 line-clamp-2">{r.error}</div>}
                      </td>
                      <td className="p-3 whitespace-nowrap text-[11px]">{[r.awb, r.orderId].filter(Boolean).join(' · ') || <span className="text-[#CBD5E1]">—</span>}</td>
                      <td className="p-3">
                        <span className={`font-bold ${r.isError ? 'text-[#DC2626]' : 'text-[#0F6B38]'}`}>{r.kind === 'job_alert' ? 'Alert' : r.status === 0 ? 'No answer' : r.status}</span>
                      </td>
                      <td className="p-3 text-right whitespace-nowrap text-[11px]">{typeof r.ms === 'number' ? `${r.ms} ms` : '—'}</td>
                    </tr>
                    {open && (
                      <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                        <td colSpan={10} className="p-4">
                          {d === 'loading' || !d ? <span className="text-[#94A3B8]">Loading…</span>
                            : d === 'error' ? <span className="text-[#DC2626]">Could not load this log (logs are kept 72 hours).</span>
                            : (
                              <div className="flex flex-col gap-3">
                                <div className="text-[11px] text-[#64748B] break-all"><b className="text-[#0F172A]">{d.method} {d.url}</b></div>
                                {d.error && <div className="text-[12px] text-[#B91C1C]"><b>Error:</b> {d.error}</div>}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                  {([['Request', d.req], ['Response', d.res]] as const).map(([label, body]) => (
                                    <div key={label} className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
                                      <div className="flex items-center justify-between px-3 py-2 border-b border-[#E2E8F0]">
                                        <span className="text-[11px] font-bold text-[#0F172A]">{label}</span>
                                        {body ? <CopyButton text={pretty(body)} /> : null}
                                      </div>
                                      <pre className="p-3 text-[11px] leading-relaxed text-[#334155] whitespace-pre-wrap break-all max-h-[420px] overflow-auto">{pretty(body) || '(empty)'}</pre>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between items-center p-4 border-t border-[#E2E8F0] bg-[#F8FAFC]">
          <span className="text-xs text-[#64748B]">
            {total} log{total === 1 ? '' : 's'}
            {summary?.storage && (
              <span className="ml-3 text-[#94A3B8]">
                Logs storage {summary.storage.usage != null ? `${Math.round(summary.storage.usage * 100)}% used` : ''}
                {summary.storage.mode === 'errors' ? ' · nearly full: keeping errors only' : summary.storage.mode === 'off' ? ' · full: logging paused' : ''}
                {!summary.storage.connected ? ' · logs database not connected' : ''}
              </span>
            )}
          </span>
          <div className="flex items-center gap-2">
            <button type="button" disabled={page <= 1} onClick={() => setParam({ page: String(page - 1) })} aria-label="Previous page"
              className="w-8 h-8 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-white disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-xs font-semibold text-[#475569]">{page} / {pages}</span>
            <button type="button" disabled={page >= pages} onClick={() => setParam({ page: String(page + 1) })} aria-label="Next page"
              className="w-8 h-8 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-white disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
