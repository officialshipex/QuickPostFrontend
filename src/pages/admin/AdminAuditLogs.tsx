import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search, ChevronLeft, ChevronRight, ChevronDown, RefreshCw, AlertTriangle, Download, X,
  Activity, LogIn, Users, MapPin, Monitor, ShieldAlert,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { apiClient } from '../../services/apiClient';
import { companiesApi, type CompanySummary } from '../../services/companiesApi';

/* Admin → Audit Logs (platform admin, every company). Backend: monitoring/audit/ (kept 30 days).
   Activity  every change a logged-in person made — rate cards, couriers, COD, wallet, KYC, employees, settings —
             with who (admin / staff / seller, or an admin through "login as"), the login it came from, and the
             before → after values
   Logins    every login and failed login: place, device, IP, last seen, "also in use on another device or place at the same time"
   Accounts  per account: last login, every place / device / IP it was used from in the period
   A login (session) opens in a panel with everything done in it. Filters live in the URL. */

type Tab = 'activity' | 'logins' | 'accounts';
type ActorType = 'admin' | 'seller' | 'admin_employee' | 'seller_employee';

type Change = {
  model?: string;
  op?: string;
  id?: string;
  label?: string;
  count?: number;
  more?: number;
  fields?: { path: string; before: unknown; after: unknown }[];
};

type ActionRow = {
  _id: string;
  at: string;
  tenantKey?: string;
  actorType?: ActorType;
  actorId?: string;
  actorName?: string;
  actorEmail?: string;
  employeeCode?: string;
  accountId?: string;
  accountUserId?: number;
  accountName?: string;
  impersonatedBy?: string;
  sid?: string;
  ip?: string;
  device?: string;
  category?: string;
  action?: string;
  method?: string;
  path?: string;
  url?: string;
  targetId?: string;
  targetTenant?: string;
  status?: number;
  ok?: boolean;
  ms?: number;
  message?: string;
  body?: string;
  files?: string[];
  changes?: Change[];
  moreChanges?: number;
};

type Geo = { city?: string; region?: string; country?: string; isp?: string; proxy?: boolean };
type Device = { browser?: string; os?: string; type?: string; model?: string; label?: string };

type LoginRow = {
  _id: string;
  at: string;
  tenantKey?: string;
  sid?: string;
  outcome: 'success' | 'failed';
  reason?: string;
  method?: string;
  panel?: string;
  accountType?: 'user' | 'employee';
  accountId?: string;
  accountUserId?: number;
  accountName?: string;
  email?: string;
  impersonatedBy?: { id?: string; name?: string; email?: string };
  ip?: string;
  device?: Device;
  geo?: Geo;
  lastSeen?: string;
  seenIps?: string[];
  concurrentWith?: { sid?: string; ip?: string; place?: string; device?: string; at?: string }[];
};

type AccountRow = {
  tenantKey?: string;
  accountType?: 'user' | 'employee';
  accountId?: string;
  accountName?: string;
  email?: string;
  accountUserId?: number;
  panel?: string;
  lastLogin: string;
  lastPlace?: string;
  lastRegion?: string;
  lastCountry?: string;
  lastDevice?: string;
  lastIp?: string;
  lastSeen?: string;
  logins: number;
  ips: string[];
  cities: string[];
  devices: string[];
  sharedLogins: number;
};

type Summary = {
  last24h: { actions: number; failedActions: number; byCategory: { category: string; total: number; failed: number }[]; logins: number; failedLogins: number };
  sharedLogins: { last7days: number; latest: LoginRow[] };
  categories: string[];
  storage: { enabled: boolean; connected: boolean; queued: number; dropped: number; retentionDays: number };
};

const ACTOR_LABEL: Record<ActorType, string> = {
  admin: 'Admin',
  admin_employee: 'Admin staff',
  seller: 'Seller',
  seller_employee: 'Seller staff',
};

const ACTOR_STYLE: Record<ActorType, string> = {
  admin: 'bg-[#EFF6FF] text-[#1D4ED8]',
  admin_employee: 'bg-[#F5F3FF] text-[#6D28D9]',
  seller: 'bg-[#ECFEFF] text-[#0E7490]',
  seller_employee: 'bg-[#FFF7ED] text-[#C2410C]',
};

const ACTION_LABEL: Record<string, string> = {
  create: 'Created',
  update: 'Changed',
  delete: 'Deleted',
  upload: 'Uploaded',
  export: 'Exported',
  approve: 'Approved',
  reject: 'Rejected',
  credentials: 'Saved credentials',
  action: 'Action',
};

const METHOD_LABEL: Record<string, string> = {
  password: 'Password',
  password_otp: 'Password + OTP',
  google: 'Google',
  register: 'Sign-up',
  employee: 'Staff login',
  login_as_user: 'Login as seller',
  login_as_employee: 'Login as staff',
};

const PANEL_LABEL: Record<string, string> = { admin: 'Admin panel', seller: 'Seller panel', sales: 'Sales panel' };

const MODEL_LABEL: Record<string, string> = {
  User: 'Account', Role: 'Employee', AllocatedRole: 'Seller allocation', KamDetails: 'KAM details', BankAccount: 'Bank account',
  Kyc: 'KYC', KycSubmission: 'KYC submission', RateCard: 'Rate card', BaseRateCard: 'Base rate card', CostingRateCard: 'Costing rate card',
  CustomRate: 'Custom rate', Plan: 'Seller plan', PlanName: 'Plan name', B2BRateCard: 'Cargo rate card', B2BPlan: 'Cargo plan',
  b2bPlanName: 'Cargo plan name', ZoneMatrix: 'Zone matrix', RechargePlanSettings: 'Recharge plan settings', SellerRatePlan: 'Seller recharge plan',
  CourierService: 'Courier service', allCourier: 'Courier', B2BallCourier: 'Cargo courier', B2BCourierService: 'Cargo courier service',
  EDDMap: 'EDD mapping', EPDMap: 'EPD mapping', Wallet: 'Wallet', CodPlan: 'COD plan', afterPlan: 'COD plan', adminCodRemittance: 'COD remittance',
  CODRemittance: 'COD remittance', CourierCodRemittance: 'Courier COD remittance', CodReversal: 'COD reversal',
  ReferralCommissionPlan: 'Referral plan', ReferralSettings: 'Referral settings', ReferralWithdrawal: 'Referral withdrawal',
  Tenant: 'Company settings', LabelSettings: 'Label settings', NotificationSetting: 'Notification settings', Announcement: 'Announcement',
  Webhook: 'Webhook', VasServiceConfig: 'VAS service', VasUserOverride: 'VAS seller override', Agreement: 'Agreement',
};

const OP_LABEL: Record<string, string> = { create: 'created', update: 'changed', delete: 'deleted', bulk: 'bulk change' };

const fmtTime = (d?: string) => (d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—');
const fmtShort = (d?: string) => (d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—');
const placeOf = (g?: Geo) => (g ? [g.city, g.region, g.country].filter(Boolean).join(', ') : '');
const show = (v: unknown) => (v === null || v === undefined || v === '' ? '—' : typeof v === 'object' ? JSON.stringify(v) : String(v));
const pretty = (text?: string) => {
  if (!text) return '';
  try { return JSON.stringify(JSON.parse(text), null, 2); } catch { return text; }
};
const ago = (d?: string) => {
  if (!d) return '';
  const min = Math.round((Date.now() - new Date(d).getTime()) / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  if (min < 48 * 60) return `${Math.round(min / 60)} h ago`;
  return `${Math.round(min / 1440)} days ago`;
};

const LIMIT = 50;
const Dash = () => <span className="text-[#CBD5E1]">—</span>;
const selectCls = 'h-9 px-3 rounded-lg border border-[#E2E8F0] bg-white text-[12px] text-[#475569] focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20';

function ChangesTable({ changes, more }: { changes?: Change[]; more?: number }) {
  if (!changes?.length) return null;
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
      <div className="px-3 py-2 border-b border-[#E2E8F0] text-[11px] font-bold text-[#0F172A]">What changed</div>
      <div className="divide-y divide-[#E2E8F0]">
        {changes.map((c, i) => (
          <div key={i} className="p-3">
            <div className="text-[12px] text-[#0F172A] mb-1.5">
              <b>{MODEL_LABEL[c.model || ''] || c.model}</b> {OP_LABEL[c.op || ''] || c.op}
              {c.label && <span className="text-[#475569]"> · {c.label}</span>}
              {c.count && c.count > 1 && <span className="text-[#475569]"> · {c.count} records{c.more ? ` (${c.more} not shown)` : ''}</span>}
              {c.id && <span className="ml-2 font-mono text-[10px] text-[#94A3B8]">{c.id}</span>}
            </div>
            {c.fields?.length ? (
              <table className="w-full text-[11px] border-collapse">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-[#94A3B8]">
                    <th className="text-left font-bold py-1 pr-3 w-1/3">Field</th>
                    <th className="text-left font-bold py-1 pr-3">Before</th>
                    <th className="text-left font-bold py-1">After</th>
                  </tr>
                </thead>
                <tbody>
                  {c.fields.map((f, j) => (
                    <tr key={j} className="align-top">
                      <td className="py-1 pr-3 font-mono text-[#475569] break-all">{f.path}</td>
                      <td className="py-1 pr-3 text-[#B91C1C] break-all">{show(f.before)}</td>
                      <td className="py-1 text-[#0F6B38] font-semibold break-all">{show(f.after)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
            {c.more && c.fields?.length ? <div className="text-[10px] text-[#94A3B8] mt-1">+{c.more} more field changes not shown</div> : null}
          </div>
        ))}
      </div>
      {more ? <div className="px-3 py-2 text-[10px] text-[#94A3B8] border-t border-[#E2E8F0]">+{more} more records changed in this request (not shown)</div> : null}
    </div>
  );
}

function LoginCard({ s, companyName }: { s: LoginRow; companyName: (k?: string) => string }) {
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] p-3 text-[12px] text-[#475569] flex flex-col gap-1.5">
      <div className="text-[#0F172A] font-bold">
        {s.accountName || s.email} <span className="font-normal text-[#64748B]">· {s.email} · {companyName(s.tenantKey)} · {PANEL_LABEL[s.panel || ''] || s.panel}</span>
      </div>
      {s.impersonatedBy?.id && (
        <div className="text-[#C2410C] font-semibold">Login as — opened by {s.impersonatedBy.name || s.impersonatedBy.email || s.impersonatedBy.id}{s.impersonatedBy.email ? ` (${s.impersonatedBy.email})` : ''}</div>
      )}
      <div className="flex flex-wrap gap-x-5 gap-y-1">
        <span><b className="text-[#0F172A]">Logged in</b> {fmtTime(s.at)} · {METHOD_LABEL[s.method || ''] || s.method}</span>
        <span><b className="text-[#0F172A]">Place</b> {placeOf(s.geo) || 'unknown'}{s.geo?.proxy ? ' (VPN / proxy)' : ''}</span>
        <span><b className="text-[#0F172A]">Device</b> {s.device?.label || 'unknown'}</span>
        <span><b className="text-[#0F172A]">IP</b> <span className="font-mono">{s.ip}</span>{s.geo?.isp ? ` · ${s.geo.isp}` : ''}</span>
        <span><b className="text-[#0F172A]">Last seen</b> {fmtShort(s.lastSeen)} ({ago(s.lastSeen)})</span>
      </div>
      {s.seenIps && s.seenIps.length > 1 && (
        <div><b className="text-[#0F172A]">Used from these IPs</b> <span className="font-mono">{s.seenIps.join(', ')}</span></div>
      )}
      {s.concurrentWith?.length ? (
        <div className="rounded-lg bg-[#FFFBEB] border border-[#FDE68A] px-3 py-2 text-[#92400E]">
          <b>Same account was in use on another device or place at the same time:</b>
          {s.concurrentWith.map((c, i) => (
            <div key={i}>· {c.place || 'unknown place'} · {c.device || 'unknown device'} · <span className="font-mono">{c.ip}</span> · logged in {fmtShort(c.at)}</div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function AdminAuditLogs() {
  const [params, setParams] = useSearchParams();
  const tab = (['activity', 'logins', 'accounts'].includes(params.get('tab') || '') ? params.get('tab') : 'activity') as Tab;
  const company = params.get('company') || '';
  const category = params.get('category') || '';
  const who = params.get('who') || '';
  const failedOnly = params.get('failed') === '1';
  const changesOnly = params.get('changes') === '1';
  const outcome = params.get('outcome') || '';
  const sharedOnly = params.get('shared') === '1';
  const loginAsOnly = params.get('loginAs') === '1';
  const accountId = params.get('account') || '';
  const days = params.get('days') || '7';
  const q = params.get('q') || '';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const sid = params.get('sid') || '';

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
  // the search box follows the URL when something else changes it ("Find in Activity", a tab link)
  const [searchFor, setSearchFor] = useState(q);
  if (q !== searchFor) {
    setSearchFor(q);
    if (q !== search.trim()) setSearch(q);
  }
  const [summary, setSummary] = useState<Summary | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, ActionRow | 'loading' | 'error'>>({});
  const [tick, setTick] = useState(0);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    companiesApi.list().then(r => setCompanies(r.data.companies || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => { if (search.trim() !== q) setParam({ q: search.trim() }); }, 400);
    return () => window.clearTimeout(id);
  }, [search, q, setParam]);

  const filterParams = useMemo(() => ({
    tenantKey: company || undefined,
    days,
    q: q || undefined,
    ...(tab === 'activity'
      ? { category: category || undefined, actorType: who || undefined, ok: failedOnly ? '0' : undefined, changesOnly: changesOnly ? '1' : undefined, accountId: accountId || undefined }
      : { outcome: outcome || undefined, shared: sharedOnly ? '1' : undefined, loginAs: loginAsOnly ? '1' : undefined, accountId: accountId || undefined }),
  }), [tab, company, days, q, category, who, failedOnly, changesOnly, outcome, sharedOnly, loginAsOnly, accountId]);

  // What was last loaded, and for which request. Rows are only drawn in the tab they were loaded for: right
  // after a tab switch the old rows (a different shape) must never reach the new tab's table.
  const requestKey = JSON.stringify([tab, filterParams, page, tick]);
  const [result, setResult] = useState<{ key: string; tab: Tab; rows: (ActionRow | LoginRow | AccountRow)[]; total: number; error: string }>({ key: '', tab, rows: [], total: 0, error: '' });
  const loading = result.key !== requestKey;
  const rows = result.tab === tab ? result.rows : [];
  const total = result.tab === tab ? result.total : 0;
  const error = loading ? '' : result.error;

  useEffect(() => {
    let cancelled = false;
    const endpoint = tab === 'activity' ? '/platform-admin/audit/actions' : tab === 'logins' ? '/platform-admin/audit/logins' : '/platform-admin/audit/accounts';
    Promise.all([
      apiClient.get(endpoint, { params: { ...filterParams, page, limit: LIMIT } }),
      apiClient.get('/platform-admin/audit/summary', { params: { tenantKey: company || undefined } }),
    ])
      .then(([list, sum]) => {
        if (cancelled) return;
        setResult({ key: requestKey, tab, rows: list.data.rows || [], total: list.data.total || 0, error: '' });
        setSummary(sum.data);
      })
      .catch(err => {
        if (!cancelled) setResult({ key: requestKey, tab, rows: [], total: 0, error: err?.response?.data?.message || 'Could not load the audit logs' });
      });
    return () => { cancelled = true; };
  }, [requestKey, tab, filterParams, page, company]);

  // The login opened in the side panel (?sid=), loaded for that sid
  const [sessionData, setSessionData] = useState<{ sid: string; data: { session: LoginRow | null; actions: ActionRow[] } | 'error' } | null>(null);
  const session = !sid ? null : sessionData?.sid === sid ? sessionData.data : 'loading';
  useEffect(() => {
    if (!sid) return undefined;
    let cancelled = false;
    apiClient.get(`/platform-admin/audit/sessions/${encodeURIComponent(sid)}`)
      .then(r => { if (!cancelled) setSessionData({ sid, data: { session: r.data.session, actions: r.data.actions || [] } }); })
      .catch(() => { if (!cancelled) setSessionData({ sid, data: 'error' }); });
    return () => { cancelled = true; };
  }, [sid]);

  const toggleAction = (id: string) => {
    if (openId === id) { setOpenId(null); return; }
    setOpenId(id);
    if (details[id] && details[id] !== 'error') return;
    setDetails(d => ({ ...d, [id]: 'loading' }));
    apiClient.get(`/platform-admin/audit/actions/${id}`)
      .then(r => setDetails(d => ({ ...d, [id]: r.data.row })))
      .catch(() => setDetails(d => ({ ...d, [id]: 'error' })));
  };

  const companyName = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of companies) map[c.tenantKey] = c.branding?.companyDisplayName || c.displayName || c.tenantKey;
    return (key?: string) => (key ? map[key] || key : '—');
  }, [companies]);

  const exportExcel = async () => {
    if (tab === 'accounts') return;
    setExporting(true);
    try {
      const r = await apiClient.get('/platform-admin/audit/export', { params: { ...filterParams, type: tab === 'logins' ? 'logins' : 'actions' } });
      const data: (ActionRow | LoginRow)[] = r.data.rows || [];
      const XLSX = await import('xlsx');
      const sheet = tab === 'logins'
        ? (data as LoginRow[]).map(l => ({
          Time: fmtTime(l.at), Company: companyName(l.tenantKey), Result: l.outcome === 'success' ? 'Logged in' : `Failed: ${l.reason || ''}`,
          Name: l.accountName || '', Email: l.email || '', 'User ID': l.accountUserId || '', Panel: PANEL_LABEL[l.panel || ''] || l.panel || '',
          Method: METHOD_LABEL[l.method || ''] || l.method || '', 'Login as by': l.impersonatedBy?.name || l.impersonatedBy?.email || '',
          Place: placeOf(l.geo), IP: l.ip || '', 'Other IPs': (l.seenIps || []).filter(ip => ip !== l.ip).join(', '), Device: l.device?.label || '',
          'Last seen': fmtTime(l.lastSeen), 'In use on another device or place at the same time': (l.concurrentWith || []).map(c => `${c.place || c.ip} (${c.device || ''})`).join('; '),
        }))
        : (data as ActionRow[]).map(a => ({
          Time: fmtTime(a.at), Company: companyName(a.tenantKey), Who: a.actorName || '', Email: a.actorEmail || '', Role: ACTOR_LABEL[a.actorType as ActorType] || '',
          'In account': a.accountName || '', 'Via login as': a.impersonatedBy ? 'yes' : '', Category: a.category || '', Action: ACTION_LABEL[a.action || ''] || a.action || '',
          Endpoint: `${a.method || ''} ${a.path || ''}`, Result: a.ok ? 'OK' : `Failed (${a.status})${a.message ? `: ${a.message}` : ''}`, IP: a.ip || '', Device: a.device || '',
          Changes: (a.changes || []).map(c => `${MODEL_LABEL[c.model || ''] || c.model} ${OP_LABEL[c.op || ''] || c.op}${c.label ? ` (${c.label})` : ''}: ${(c.fields || []).map(f => `${f.path} ${show(f.before)} → ${show(f.after)}`).join('; ')}`).join(' | '),
        }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sheet), tab === 'logins' ? 'Logins' : 'Activity');
      XLSX.writeFile(wb, `audit-${tab}-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      window.alert(e?.response?.data?.message || 'Could not export');
    } finally {
      setExporting(false);
    }
  };

  const pages = Math.max(1, Math.ceil(total / LIMIT));
  const retention = summary?.storage?.retentionDays || 30;
  const accountFilterName = accountId && rows.length && tab !== 'accounts'
    ? ((rows[0] as LoginRow).accountId === accountId ? ((rows[0] as LoginRow).accountName || (rows[0] as LoginRow).email) : '')
    : '';

  const tabs: { key: Tab; label: string; icon: typeof Activity }[] = [
    { key: 'activity', label: 'Activity', icon: Activity },
    { key: 'logins', label: 'Logins', icon: LogIn },
    { key: 'accounts', label: 'Accounts', icon: Users },
  ];

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl font-bold text-[#0F172A]">Audit Logs</h2>
          <p className="text-xs text-[#64748B] mt-1">
            Who changed what (rate cards, couriers, COD, wallet, KYC, employees, settings) and every login with its place and device, for every company. Kept {retention} days.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {tab !== 'accounts' && (
            <button type="button" onClick={exportExcel} disabled={exporting}
              className="h-9 px-3 rounded-lg border border-[#E2E8F0] bg-white text-[12px] font-semibold text-[#475569] hover:bg-[#F8FAFC] inline-flex items-center gap-1.5 disabled:opacity-50">
              <Download className="w-3.5 h-3.5" /> {exporting ? 'Exporting…' : 'Export Excel'}
            </button>
          )}
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

      {/* shared-login alerts */}
      {summary && summary.sharedLogins.last7days > 0 && (
        <div className="rounded-xl border bg-[#FFFBEB] border-[#FDE68A] px-4 py-3 mb-4 flex items-start gap-3">
          <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0 text-[#D97706]" />
          <div className="text-[12px] text-[#0F172A] flex-1">
            <b>{summary.sharedLogins.last7days} login{summary.sharedLogins.last7days === 1 ? '' : 's'} in the last 7 days happened while the same account was already in use from another place or device</b>
            <span className="text-[#64748B]"> — a shared password, or a copied login.</span>
            <div className="mt-1 flex flex-col gap-0.5 text-[#475569]">
              {summary.sharedLogins.latest.slice(0, 3).map(l => (
                <div key={l._id}>
                  · <b className="text-[#0F172A]">{l.accountName || l.email}</b> ({companyName(l.tenantKey)}) — {placeOf(l.geo) || l.ip}, {l.device?.label}, {fmtShort(l.at)}
                  {' '}while also on {l.concurrentWith?.[0]?.place || l.concurrentWith?.[0]?.ip}
                  {l.sid && <button type="button" onClick={() => setParam({ sid: l.sid || '' })} className="ml-2 font-semibold text-[#00A86B] hover:underline">Open login</button>}
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setParam({ tab: 'logins', shared: '1', days: '7', outcome: '' })} className="mt-1 font-semibold text-[#00A86B] hover:underline">Show all</button>
          </div>
        </div>
      )}

      {/* summary */}
      {summary && (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-4 mb-4 flex flex-col gap-2">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-[12px] text-[#475569]">
            <span className="font-bold text-[#0F172A]">Last 24 h</span>
            <span>Changes: <b className="text-[#0F172A]">{summary.last24h.actions}</b>{summary.last24h.failedActions ? <span className="text-[#DC2626] font-semibold"> · {summary.last24h.failedActions} refused / failed</span> : null}</span>
            <span>Logins: <b className="text-[#0F172A]">{summary.last24h.logins}</b></span>
            <button type="button" onClick={() => setParam({ tab: 'logins', outcome: 'failed', days: '1', shared: '' })} className={`text-left ${summary.last24h.failedLogins ? 'text-[#DC2626] font-semibold hover:underline' : ''}`}>
              Failed logins: <b>{summary.last24h.failedLogins}</b>
            </button>
          </div>
          {summary.last24h.byCategory.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {summary.last24h.byCategory.map(c => (
                <button key={c.category} type="button" onClick={() => setParam({ tab: 'activity', category: c.category, days: '1' })}
                  className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#F1F5F9] text-[#334155] hover:bg-[#E6F9F2]">
                  {c.category} {c.total}{c.failed ? <span className="text-[#DC2626]"> · {c.failed} failed</span> : null}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* tabs */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <div className="inline-flex rounded-lg border border-[#E2E8F0] bg-white p-0.5 w-fit">
          {tabs.map(t => (
            <button key={t.key} type="button" onClick={() => setParam({ tab: t.key, account: '' })}
              className={`h-8 px-3 rounded-md text-[12px] font-semibold inline-flex items-center gap-1.5 transition-colors ${tab === t.key ? 'bg-[#00A86B] text-white' : 'text-[#475569] hover:bg-[#F8FAFC]'}`}>
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
        </div>
        {accountId && (
          <span className="h-8 pl-3 pr-1 rounded-full bg-[#E6F9F2] text-[#0F6B38] text-[12px] font-semibold inline-flex items-center gap-1">
            Account: {accountFilterName || accountId}
            <button type="button" onClick={() => setParam({ account: '' })} aria-label="Clear account filter" className="w-6 h-6 rounded-full hover:bg-white/70 flex items-center justify-center"><X className="w-3.5 h-3.5" /></button>
          </span>
        )}
      </div>

      {/* filters */}
      <div className="flex flex-col xl:flex-row xl:items-center gap-3 mb-4 flex-wrap">
        {tab === 'activity' && (
          <>
            <select value={category} onChange={e => setParam({ category: e.target.value })} className={selectCls}>
              <option value="">All categories</option>
              {(summary?.categories || []).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={who} onChange={e => setParam({ who: e.target.value })} className={selectCls}>
              <option value="">Everyone</option>
              {(Object.keys(ACTOR_LABEL) as ActorType[]).map(k => <option key={k} value={k}>{ACTOR_LABEL[k]}</option>)}
            </select>
            <label className="flex items-center gap-2 text-[12px] font-semibold text-[#475569] cursor-pointer select-none">
              <input type="checkbox" checked={changesOnly} onChange={e => setParam({ changes: e.target.checked ? '1' : '' })} className="accent-[#00A86B]" />
              With before → after only
            </label>
            <label className="flex items-center gap-2 text-[12px] font-semibold text-[#475569] cursor-pointer select-none">
              <input type="checkbox" checked={failedOnly} onChange={e => setParam({ failed: e.target.checked ? '1' : '' })} className="accent-[#DC2626]" />
              Refused / failed only
            </label>
          </>
        )}
        {tab === 'logins' && (
          <>
            <select value={outcome} onChange={e => setParam({ outcome: e.target.value })} className={selectCls}>
              <option value="">Successful and failed</option>
              <option value="success">Successful only</option>
              <option value="failed">Failed only</option>
            </select>
            <label className="flex items-center gap-2 text-[12px] font-semibold text-[#475569] cursor-pointer select-none">
              <input type="checkbox" checked={sharedOnly} onChange={e => setParam({ shared: e.target.checked ? '1' : '' })} className="accent-[#D97706]" />
              In use on another device or place at the same time
            </label>
            <label className="flex items-center gap-2 text-[12px] font-semibold text-[#475569] cursor-pointer select-none">
              <input type="checkbox" checked={loginAsOnly} onChange={e => setParam({ loginAs: e.target.checked ? '1' : '' })} className="accent-[#C2410C]" />
              "Login as" only
            </label>
          </>
        )}
        <select value={days} onChange={e => setParam({ days: e.target.value })} className={selectCls}>
          <option value="1">Last 24 hours</option>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
        </select>
        <div className="relative w-full xl:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder={tab === 'activity' ? 'Name, email, user ID, IP, endpoint, record' : 'Name, email, user ID, IP, city, device'}
            className="w-full h-9 pl-9 pr-4 rounded-lg border border-[#E2E8F0] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20 focus:border-[#00A86B]" />
        </div>
      </div>

      {/* the list */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {tab === 'activity' && (
            <table className="w-full text-left border-collapse min-w-[1100px]">
              <thead>
                <tr className="bg-[#E6F9F2] border-b border-[#E2E8F0] text-[10px] uppercase tracking-wider font-bold text-[#64748B]">
                  <th className="p-3 w-8" />
                  <th className="p-3">Time</th>
                  <th className="p-3">Who</th>
                  <th className="p-3">Company · account</th>
                  <th className="p-3">What</th>
                  <th className="p-3">Changed</th>
                  <th className="p-3">From</th>
                  <th className="p-3">Result</th>
                </tr>
              </thead>
              <tbody className="text-xs font-medium text-[#475569]">
                {loading && rows.length === 0 ? (
                  <tr><td colSpan={8} className="p-8 text-center text-[#94A3B8]">Loading…</td></tr>
                ) : error ? (
                  <tr><td colSpan={8} className="p-8 text-center text-[#DC2626]">{error}</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={8} className="p-8 text-center text-[#94A3B8]">Nothing recorded for these filters.</td></tr>
                ) : (rows as ActionRow[]).map(r => {
                  const open = openId === r._id;
                  const d = details[r._id];
                  return (
                    <Fragment key={r._id}>
                      <tr onClick={() => toggleAction(r._id)}
                        className={`border-b border-[#E2E8F0] cursor-pointer transition-colors align-top ${r.ok === false ? 'bg-[#FEF2F2]/60 hover:bg-[#FEF2F2]' : 'hover:bg-[#F8FAFC]'}`}>
                        <td className="p-3"><ChevronDown className={`w-3.5 h-3.5 text-[#94A3B8] transition-transform ${open ? '' : '-rotate-90'}`} /></td>
                        <td className="p-3 whitespace-nowrap text-[11px]">{fmtTime(r.at)}</td>
                        <td className="p-3 max-w-[200px]">
                          <div className="text-[#0F172A] font-bold truncate" title={r.actorEmail}>{r.actorName || r.actorEmail || '—'}</div>
                          <div className="flex flex-wrap items-center gap-1 mt-0.5">
                            {r.actorType && <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${ACTOR_STYLE[r.actorType]}`}>{ACTOR_LABEL[r.actorType]}</span>}
                            {r.impersonatedBy && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#FFF7ED] text-[#C2410C]" title="Done by an admin through Login as">via Login as</span>}
                          </div>
                        </td>
                        <td className="p-3 max-w-[180px]">
                          <div className="truncate">{companyName(r.tenantKey)}</div>
                          {r.accountName && <div className="text-[11px] text-[#94A3B8] truncate" title={r.accountName}>{r.accountUserId ? `${r.accountUserId} · ` : ''}{r.accountName}</div>}
                        </td>
                        <td className="p-3 max-w-[280px]">
                          <div className="text-[#0F172A] font-semibold">{r.category} · {ACTION_LABEL[r.action || ''] || r.action}</div>
                          <div className="truncate font-mono text-[10px] text-[#94A3B8]" title={r.url}>{r.method} {r.path}</div>
                          {r.targetTenant && <div className="text-[11px]">Company: <b>{companyName(r.targetTenant)}</b></div>}
                        </td>
                        <td className="p-3 max-w-[220px]">
                          {r.changes?.length
                            ? <div className="truncate" title={r.changes.map(c => `${MODEL_LABEL[c.model || ''] || c.model}${c.label ? ` ${c.label}` : ''}`).join(', ')}>
                              {r.changes.slice(0, 2).map(c => `${MODEL_LABEL[c.model || ''] || c.model}${c.label ? ` (${c.label})` : ''}`).join(', ')}
                              {r.changes.length > 2 ? ` +${r.changes.length - 2}` : ''}
                            </div>
                            : <Dash />}
                        </td>
                        <td className="p-3 max-w-[180px]">
                          <div className="font-mono text-[11px] truncate">{r.ip || '—'}</div>
                          <div className="text-[10px] text-[#94A3B8] truncate" title={r.device}>{r.device}</div>
                        </td>
                        <td className="p-3">
                          <span className={`font-bold ${r.ok === false ? 'text-[#DC2626]' : 'text-[#0F6B38]'}`}>{r.ok === false ? (r.status === 403 ? 'Refused' : 'Failed') : 'OK'}</span>
                          {r.ok === false && r.message && <div className="text-[10px] text-[#DC2626] line-clamp-2 max-w-[160px]">{r.message}</div>}
                        </td>
                      </tr>
                      {open && (
                        <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                          <td colSpan={8} className="p-4">
                            {d === 'loading' || !d ? <span className="text-[#94A3B8]">Loading…</span>
                              : d === 'error' ? <span className="text-[#DC2626]">Could not load this entry (kept {retention} days).</span>
                              : (
                                <div className="flex flex-col gap-3">
                                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-[12px]">
                                    <span><b className="text-[#0F172A]">Who</b> {d.actorName} ({d.actorEmail}){d.employeeCode ? ` · staff ID ${d.employeeCode}` : ''}</span>
                                    {d.accountName && <span><b className="text-[#0F172A]">In account</b> {d.accountUserId ? `${d.accountUserId} · ` : ''}{d.accountName}</span>}
                                    <span><b className="text-[#0F172A]">Result</b> {d.status} {d.message ? `— ${d.message}` : ''} · {d.ms} ms</span>
                                    <span className="font-mono text-[11px] break-all"><b className="text-[#0F172A] font-sans">Endpoint</b> {d.method} {d.url}</span>
                                    {d.sid
                                      ? <button type="button" onClick={() => setParam({ sid: d.sid || '' })} className="font-semibold text-[#00A86B] hover:underline">Open this login (place, device, everything done in it)</button>
                                      : <span className="text-[#94A3B8]">Login session not known (signed in before audit started)</span>}
                                  </div>
                                  {d.files?.length ? <div className="text-[12px]"><b className="text-[#0F172A]">Files</b> {d.files.join(', ')}</div> : null}
                                  <ChangesTable changes={d.changes} more={d.moreChanges} />
                                  {d.body && (
                                    <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
                                      <div className="px-3 py-2 border-b border-[#E2E8F0] text-[11px] font-bold text-[#0F172A]">What was sent (passwords, keys and tokens hidden)</div>
                                      <pre className="p-3 text-[11px] leading-relaxed text-[#334155] whitespace-pre-wrap break-all max-h-[360px] overflow-auto">{pretty(d.body)}</pre>
                                    </div>
                                  )}
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
          )}

          {tab === 'logins' && (
            <table className="w-full text-left border-collapse min-w-[1100px]">
              <thead>
                <tr className="bg-[#E6F9F2] border-b border-[#E2E8F0] text-[10px] uppercase tracking-wider font-bold text-[#64748B]">
                  <th className="p-3">Time</th>
                  <th className="p-3">Account</th>
                  <th className="p-3">Company · panel</th>
                  <th className="p-3">How</th>
                  <th className="p-3">Place</th>
                  <th className="p-3">Device</th>
                  <th className="p-3">IP</th>
                  <th className="p-3">Last seen</th>
                </tr>
              </thead>
              <tbody className="text-xs font-medium text-[#475569]">
                {loading && rows.length === 0 ? (
                  <tr><td colSpan={8} className="p-8 text-center text-[#94A3B8]">Loading…</td></tr>
                ) : error ? (
                  <tr><td colSpan={8} className="p-8 text-center text-[#DC2626]">{error}</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={8} className="p-8 text-center text-[#94A3B8]">No logins for these filters.</td></tr>
                ) : (rows as LoginRow[]).map(l => {
                  const failed = l.outcome === 'failed';
                  const shared = (l.concurrentWith?.length || 0) > 0;
                  return (
                    <tr key={l._id} onClick={() => l.sid && setParam({ sid: l.sid })}
                      className={`border-b border-[#E2E8F0] align-top transition-colors ${l.sid ? 'cursor-pointer' : ''} ${failed ? 'bg-[#FEF2F2]/60 hover:bg-[#FEF2F2]' : shared ? 'bg-[#FFFBEB]/70 hover:bg-[#FFFBEB]' : 'hover:bg-[#F8FAFC]'}`}>
                      <td className="p-3 whitespace-nowrap text-[11px]">{fmtTime(l.at)}</td>
                      <td className="p-3 max-w-[220px]">
                        <div className="text-[#0F172A] font-bold truncate">{l.accountName || l.email || '—'}</div>
                        <div className="text-[11px] text-[#94A3B8] truncate">{l.accountUserId ? `${l.accountUserId} · ` : ''}{l.email}</div>
                        {failed && <div className="text-[11px] text-[#DC2626] font-semibold">Failed — {l.reason}</div>}
                        {shared && <div className="text-[11px] text-[#B45309] font-semibold">Also in use on another device or place at the same time</div>}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <div>{companyName(l.tenantKey)}</div>
                        <div className="text-[11px] text-[#94A3B8]">{PANEL_LABEL[l.panel || ''] || l.panel || '—'}</div>
                      </td>
                      <td className="p-3">
                        <div>{METHOD_LABEL[l.method || ''] || l.method}</div>
                        {l.impersonatedBy?.id && <div className="text-[11px] text-[#C2410C] font-semibold">by {l.impersonatedBy.name || l.impersonatedBy.email}</div>}
                      </td>
                      <td className="p-3 max-w-[200px]">
                        <div className="flex items-start gap-1"><MapPin className="w-3 h-3 mt-0.5 shrink-0 text-[#94A3B8]" /><span>{placeOf(l.geo) || 'unknown'}</span></div>
                        {l.geo?.proxy && <div className="text-[10px] text-[#B45309] font-semibold">VPN / proxy</div>}
                      </td>
                      <td className="p-3 max-w-[220px]">
                        <div className="flex items-start gap-1"><Monitor className="w-3 h-3 mt-0.5 shrink-0 text-[#94A3B8]" /><span>{l.device?.label || '—'}</span></div>
                      </td>
                      <td className="p-3">
                        <div className="font-mono text-[11px]">{l.ip}</div>
                        {(l.seenIps?.length || 0) > 1 && <div className="text-[10px] text-[#B45309] font-semibold" title={l.seenIps?.join(', ')}>+{(l.seenIps?.length || 1) - 1} more IP{(l.seenIps?.length || 0) > 2 ? 's' : ''} later</div>}
                      </td>
                      <td className="p-3 whitespace-nowrap text-[11px]">{failed ? <Dash /> : ago(l.lastSeen)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {tab === 'accounts' && (
            <table className="w-full text-left border-collapse min-w-[1100px]">
              <thead>
                <tr className="bg-[#E6F9F2] border-b border-[#E2E8F0] text-[10px] uppercase tracking-wider font-bold text-[#64748B]">
                  <th className="p-3">Account</th>
                  <th className="p-3">Company · panel</th>
                  <th className="p-3">Last login</th>
                  <th className="p-3">Last seen</th>
                  <th className="p-3 text-right">Logins</th>
                  <th className="p-3">Places</th>
                  <th className="p-3">Devices</th>
                  <th className="p-3">IPs</th>
                </tr>
              </thead>
              <tbody className="text-xs font-medium text-[#475569]">
                {loading && rows.length === 0 ? (
                  <tr><td colSpan={8} className="p-8 text-center text-[#94A3B8]">Loading…</td></tr>
                ) : error ? (
                  <tr><td colSpan={8} className="p-8 text-center text-[#DC2626]">{error}</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={8} className="p-8 text-center text-[#94A3B8]">No logins in this period.</td></tr>
                ) : (rows as AccountRow[]).map(a => (
                  <tr key={`${a.tenantKey}|${a.accountType}|${a.accountId}`} onClick={() => setParam({ tab: 'logins', account: a.accountId || '' })}
                    className={`border-b border-[#E2E8F0] align-top cursor-pointer transition-colors ${a.sharedLogins ? 'bg-[#FFFBEB]/70 hover:bg-[#FFFBEB]' : 'hover:bg-[#F8FAFC]'}`}>
                    <td className="p-3 max-w-[220px]">
                      <div className="text-[#0F172A] font-bold truncate">{a.accountName || a.email}</div>
                      <div className="text-[11px] text-[#94A3B8] truncate">{a.accountUserId ? `${a.accountUserId} · ` : ''}{a.email}{a.accountType === 'employee' ? ' · staff' : ''}</div>
                      {a.sharedLogins > 0 && <div className="text-[11px] text-[#B45309] font-semibold">{a.sharedLogins} login{a.sharedLogins === 1 ? '' : 's'} while in use on another device or place</div>}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <div>{companyName(a.tenantKey)}</div>
                      <div className="text-[11px] text-[#94A3B8]">{PANEL_LABEL[a.panel || ''] || a.panel}</div>
                    </td>
                    <td className="p-3">
                      <div className="whitespace-nowrap">{fmtShort(a.lastLogin)}</div>
                      <div className="text-[11px] text-[#94A3B8]">{[a.lastPlace, a.lastRegion, a.lastCountry].filter(Boolean).join(', ') || 'unknown place'}</div>
                      <div className="text-[11px] text-[#94A3B8]">{a.lastDevice}</div>
                    </td>
                    <td className="p-3 whitespace-nowrap text-[11px]">{ago(a.lastSeen)}</td>
                    <td className="p-3 text-right font-bold text-[#0F172A]">{a.logins}</td>
                    <td className="p-3 max-w-[200px] text-[11px]">{a.cities.length ? a.cities.join(', ') : <Dash />}</td>
                    <td className="p-3 max-w-[240px] text-[11px]">{a.devices.map((dv, i) => <div key={i} className="truncate" title={dv}>{dv}</div>)}</td>
                    <td className="p-3 max-w-[160px] font-mono text-[11px]">{a.ips.slice(0, 4).map(ip => <div key={ip} className="truncate">{ip}</div>)}{a.ips.length > 4 ? <div className="text-[#94A3B8]">+{a.ips.length - 4} more</div> : null}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-2 justify-between sm:items-center p-4 border-t border-[#E2E8F0] bg-[#F8FAFC]">
          <span className="text-xs text-[#64748B]">
            {total} {tab === 'activity' ? 'change' : tab === 'logins' ? 'login' : 'account'}{total === 1 ? '' : 's'}
            {summary?.storage && !summary.storage.connected && <span className="ml-3 text-[#DC2626]">logs database not connected</span>}
            <span className="ml-3 text-[#94A3B8]">
              Places are approximate (from the IP address). IP geolocation by{' '}
              <a href="https://www.ip2location.io" target="_blank" rel="noreferrer" className="underline hover:text-[#00A86B]">IP2Location.io</a>.
            </span>
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

      {/* one login: where, which device, everything done in it */}
      {sid && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={() => setParam({ sid: '' })}>
          <div className="w-full max-w-3xl h-full bg-[#F8FAFC] shadow-xl overflow-y-auto p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-bold text-[#0F172A]">Login session</h3>
              <button type="button" onClick={() => setParam({ sid: '' })} aria-label="Close" className="w-8 h-8 rounded-lg hover:bg-white flex items-center justify-center text-[#64748B]"><X className="w-4 h-4" /></button>
            </div>
            {session === 'loading' || session === null ? <span className="text-[12px] text-[#94A3B8]">Loading…</span>
              : session === 'error' ? <span className="text-[12px] text-[#DC2626]">Could not load this login (kept {retention} days).</span>
              : (
                <div className="flex flex-col gap-4">
                  {session.session
                    ? <LoginCard s={session.session} companyName={companyName} />
                    : <div className="text-[12px] text-[#94A3B8]">The login record itself is no longer available.</div>}
                  {session.session?.accountId && (
                    <button type="button" onClick={() => setParam({ sid: '', tab: 'logins', account: session.session?.accountId || '' })}
                      className="self-start text-[12px] font-semibold text-[#00A86B] hover:underline">All logins of this account</button>
                  )}
                  <div>
                    <div className="text-[12px] font-bold text-[#0F172A] mb-2">Done in this login ({session.actions.length}{session.actions.length === 200 ? '+' : ''})</div>
                    {session.actions.length === 0 ? <div className="text-[12px] text-[#94A3B8]">No recorded changes in this login.</div> : (
                      <div className="bg-white rounded-xl border border-[#E2E8F0] divide-y divide-[#E2E8F0]">
                        {session.actions.map(a => (
                          <div key={a._id} className="p-3 text-[12px] flex flex-col gap-0.5">
                            <div className="flex flex-wrap items-center gap-x-2">
                              <span className="text-[11px] text-[#94A3B8] whitespace-nowrap">{fmtTime(a.at)}</span>
                              <b className="text-[#0F172A]">{a.category} · {ACTION_LABEL[a.action || ''] || a.action}</b>
                              <span className={`font-bold ${a.ok === false ? 'text-[#DC2626]' : 'text-[#0F6B38]'}`}>{a.ok === false ? (a.status === 403 ? 'Refused' : 'Failed') : 'OK'}</span>
                              {a.ip && a.ip !== session.session?.ip && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#FFFBEB] text-[#B45309]" title="Done from a different IP than the login">from {a.ip}</span>}
                            </div>
                            <div className="font-mono text-[10px] text-[#94A3B8] break-all">{a.method} {a.path}</div>
                            {a.changes?.length ? <div className="text-[#475569]">{a.changes.map(c => `${MODEL_LABEL[c.model || ''] || c.model} ${OP_LABEL[c.op || ''] || c.op}${c.label ? ` (${c.label})` : ''}`).join(', ')}</div> : null}
                            {a.targetId && (
                              <button type="button" onClick={() => setParam({ sid: '', tab: 'activity', q: a.targetId || '', account: '' })} className="self-start text-[11px] font-semibold text-[#00A86B] hover:underline">
                                Find in Activity
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
          </div>
        </div>
      )}

      {!loading && summary && !summary.storage.enabled && (
        <div className="mt-4 rounded-xl border bg-[#FEF2F2] border-[#FECACA] px-4 py-3 flex items-start gap-3 text-[12px] text-[#0F172A]">
          <AlertTriangle className="w-4 h-4 mt-0.5 text-[#DC2626]" /> Audit logging is switched off on the server.
        </div>
      )}
    </AdminLayout>
  );
}
