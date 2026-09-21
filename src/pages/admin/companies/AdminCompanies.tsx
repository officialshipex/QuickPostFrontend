import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AdminLayout } from '../../../components/admin/layout/AdminLayout';
import { TableLoader } from '../../../components/ui/TableLoader';
import { Toast } from '../../../components/ui/Toast';
import { useToast } from '../../../hooks/useToast';
import { ColorField } from '../../../components/admin/companies/ColorField';
import { ImageDimensionUpload } from '../../../components/admin/companies/ImageDimensionUpload';
import {
  companiesApi, type CompanySummary, type ConfigGroups, type ConfigFieldHint, type GroupStatusMap, type WebhookAddress,
} from '../../../services/companiesApi';
import {
  Plus, ArrowLeft, Building2, Globe, CheckCircle2, Clock, Pencil, X, ChevronRight, Copy,
} from 'lucide-react';

type View = 'list' | 'create' | 'detail';

// Placeholder dimensions — adjust here if the brand has exact specs in mind.
const LOGO_DIMENSIONS = { width: 512, height: 512 };
const FAVICON_DIMENSIONS = { width: 32, height: 32 };

const STATUS_BADGE: Record<string, string> = {
  onboarding: 'bg-amber-50 text-amber-700 border-amber-200',
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  suspended: 'bg-red-50 text-red-700 border-red-200',
  disabled: 'bg-slate-50 text-slate-700 border-slate-200',
};

function slugify(input: string) {
  return input.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export function AdminCompanies() {
  const [searchParams, setSearchParams] = useSearchParams();
  const view = (searchParams.get('view') as View) || 'list';
  const activeKey = searchParams.get('key') || '';

  const goTo = (v: View, key?: string) => {
    const params: Record<string, string> = {};
    if (v !== 'list') params.view = v;
    if (key) params.key = key;
    setSearchParams(params);
  };

  return (
    <AdminLayout>
      {view === 'list' && <CompaniesList onCreate={() => goTo('create')} onOpen={key => goTo('detail', key)} />}
      {view === 'create' && <CompanyCreateForm onBack={() => goTo('list')} onCreated={key => goTo('detail', key)} />}
      {view === 'detail' && activeKey && <CompanyDetail tenantKey={activeKey} onBack={() => goTo('list')} />}
    </AdminLayout>
  );
}

// ─── List view ──────────────────────────────────────────────────────────────
function CompaniesList({ onCreate, onOpen }: { onCreate: () => void; onOpen: (key: string) => void }) {
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await companiesApi.list();
      setCompanies(res.data.companies || []);
    } catch {
      setError('Failed to load companies. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  return (
    <div className="flex flex-col h-[calc(100vh-72px)] -m-4 md:-m-6 bg-white">
      <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-[#E2E8F0] shrink-0">
        <div>
          <h1 className="text-[16px] font-semibold text-[#0F172A] flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#00A86B]" /> Companies
          </h1>
          <p className="text-[12px] text-[#64748B] mt-0.5">White-label companies onboarded onto the shared platform</p>
        </div>
        <button
          onClick={onCreate}
          className="flex items-center gap-1.5 bg-[#00A86B] hover:bg-[#008F5C] text-white text-[12px] font-semibold px-4 py-2.5 rounded-[8px] transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Company
        </button>
      </div>

      <div className="flex-1 overflow-auto relative">
        {loading && <TableLoader />}
        {error ? (
          <p className="p-6 text-[12px] text-red-500">{error}</p>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-[#E6F9F2] shadow-sm">
              <tr className="text-xs font-medium text-[#64748B] uppercase tracking-wider">
                <th className="py-2.5 px-4">Company</th>
                <th className="py-2.5 px-4">Domain</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Setup</th>
                <th className="py-2.5 px-4">Created</th>
                <th className="py-2.5 px-4 text-right">&nbsp;</th>
              </tr>
            </thead>
            <tbody className="text-[12px] text-[#475569]">
              {companies.length === 0 && !loading ? (
                <tr><td colSpan={6} className="py-10 text-center text-[#94A3B8]">No companies onboarded yet.</td></tr>
              ) : companies.map((c, idx) => {
                const primaryDomain = c.domains.find(d => d.isPrimary)?.hostname || c.domains[0]?.hostname || '—';
                return (
                  <tr
                    key={c.tenantKey}
                    onClick={() => onOpen(c.tenantKey)}
                    className={`border-b border-[#E2E8F0] cursor-pointer hover:bg-[#F0FDF4] transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-[#E6EDF7]/20'}`}
                  >
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2.5">
                        {c.branding?.logoUrl ? (
                          <img src={c.branding.logoUrl} alt="" className="w-7 h-7 rounded-[6px] object-cover border border-[#E2E8F0]" />
                        ) : (
                          <div className="w-7 h-7 rounded-[6px] bg-[#F0FDF4] flex items-center justify-center"><Building2 className="w-3.5 h-3.5 text-[#00A86B]" /></div>
                        )}
                        <div>
                          <p className="font-semibold text-[#0F172A]">{c.displayName}</p>
                          <p className="text-[10px] text-[#94A3B8]">{c.tenantKey}{c.isDefaultTenant ? ' · default' : ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-4"><span className="flex items-center gap-1.5"><Globe className="w-3 h-3 text-[#94A3B8]" />{primaryDomain}</span></td>
                    <td className="py-2.5 px-4">
                      <span className={`${STATUS_BADGE[c.status] || STATUS_BADGE.disabled} px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wider`}>{c.status}</span>
                    </td>
                    <td className="py-2.5 px-4">
                      {c.requiredSetupComplete ? (
                        <span className="flex items-center gap-1 text-[#00A86B]"><CheckCircle2 className="w-3.5 h-3.5" /> Complete</span>
                      ) : (
                        <span className="flex items-center gap-1 text-amber-600"><Clock className="w-3.5 h-3.5" /> Incomplete</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-[#94A3B8]">{new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td className="py-2.5 px-4 text-right"><ChevronRight className="w-4 h-4 text-[#94A3B8] inline-block" /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Create view (stage 1 — required fields only) ──────────────────────────
function CompanyCreateForm({ onBack, onCreated }: { onBack: () => void; onCreated: (key: string) => void }) {
  const { toast, showToast } = useToast();
  const [displayName, setDisplayName] = useState('');
  const [tenantKey, setTenantKey] = useState('');
  const [keyEdited, setKeyEdited] = useState(false);
  const [domain, setDomain] = useState('');
  const [mongoUri, setMongoUri] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#00A86B');
  const [secondaryColor, setSecondaryColor] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!keyEdited) setTenantKey(slugify(displayName));
  }, [displayName, keyEdited]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!displayName.trim()) e.displayName = 'Required';
    if (!slugify(tenantKey)) e.tenantKey = 'Required';
    if (!domain.trim()) e.domain = 'Required';
    if (!mongoUri.trim()) e.mongoUri = 'Required';
    if (!logoFile) e.logo = 'Required';
    if (!/^#[0-9a-fA-F]{6}$/.test(primaryColor)) e.primaryColor = 'Enter a valid hex color';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const logoUpload = await companiesApi.uploadPendingAsset(logoFile as File);
      const logoUrl = logoUpload.data.url;

      let faviconUrl: string | undefined;
      if (faviconFile) {
        const faviconUpload = await companiesApi.uploadPendingAsset(faviconFile);
        faviconUrl = faviconUpload.data.url;
      }

      const res = await companiesApi.create({
        displayName: displayName.trim(),
        tenantKey: slugify(tenantKey),
        domain: domain.trim(),
        mongoUri: mongoUri.trim(),
        logoUrl,
        faviconUrl,
        primaryColor,
        secondaryColor: secondaryColor || undefined,
      });

      showToast('success', 'Company created — you can fill in the rest of its setup now.');
      setTimeout(() => onCreated(res.data.company.tenantKey), 600);
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to create company');
    } finally {
      setSubmitting(false);
    }
  };

  const labelCls = 'text-[12px] font-semibold text-[#64748B]';
  const inputCls = (hasError?: boolean) =>
    `w-full border rounded-[8px] px-3 py-2.5 text-[13px] text-[#1E293B] focus:outline-none focus:ring-2 transition-colors ${hasError ? 'border-red-300 focus:ring-red-100' : 'border-[#E2E8F0] focus:ring-[#00A86B]/40 focus:border-[#00A86B]'}`;
  const errCls = 'text-[11px] text-red-500 mt-1';

  return (
    <div className="flex flex-col min-h-[calc(100vh-72px)] -m-4 md:-m-6 bg-white">
      <Toast toast={toast} onClose={() => {}} />
      <div className="flex items-center gap-3 px-4 md:px-6 py-4 border-b border-[#E2E8F0] shrink-0">
        <button onClick={onBack} className="w-8 h-8 rounded-[8px] border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-[#F8FAFC]"><ArrowLeft className="w-4 h-4" /></button>
        <div>
          <h1 className="text-[16px] font-semibold text-[#0F172A]">Add Company</h1>
          <p className="text-[12px] text-[#64748B]">Only what's needed to stand this company up. Everything else can be filled in afterwards, one field at a time.</p>
        </div>
      </div>

      <div className="max-w-2xl w-full mx-auto px-4 md:px-6 py-6 flex flex-col gap-4">
        <div>
          <label className={labelCls}>Company Name <span className="text-red-500">*</span></label>
          <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Acme Logistics" className={inputCls(!!errors.displayName)} />
          {errors.displayName && <p className={errCls}>{errors.displayName}</p>}
        </div>

        <div>
          <label className={labelCls}>Company Key <span className="text-red-500">*</span> <span className="font-normal text-[#94A3B8]">(used internally, cannot be changed later)</span></label>
          <input
            value={tenantKey}
            onChange={e => { setTenantKey(e.target.value); setKeyEdited(true); }}
            placeholder="acme-logistics"
            className={inputCls(!!errors.tenantKey)}
          />
          {errors.tenantKey && <p className={errCls}>{errors.tenantKey}</p>}
        </div>

        <div>
          <label className={labelCls}>Domain <span className="text-red-500">*</span> <span className="font-normal text-[#94A3B8]">(where this company's app will be reachable)</span></label>
          <input value={domain} onChange={e => setDomain(e.target.value)} placeholder="app.acmelogistics.com" className={inputCls(!!errors.domain)} />
          {errors.domain && <p className={errCls}>{errors.domain}</p>}
        </div>

        <div>
          <label className={labelCls}>MongoDB Connection URI <span className="text-red-500">*</span> <span className="font-normal text-[#94A3B8]">(this company's own, isolated database)</span></label>
          <input
            value={mongoUri}
            onChange={e => setMongoUri(e.target.value)}
            placeholder="mongodb+srv://user:pass@cluster.mongodb.net/dbname"
            type="password"
            className={inputCls(!!errors.mongoUri)}
          />
          {errors.mongoUri && <p className={errCls}>{errors.mongoUri}</p>}
          <p className="text-[11px] text-[#94A3B8] mt-1">We'll check this is reachable before creating the company.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <ImageDimensionUpload
            label="Logo"
            requiredWidth={LOGO_DIMENSIONS.width}
            requiredHeight={LOGO_DIMENSIONS.height}
            value={logoPreview}
            required
            onFileValidated={(file, preview) => { setLogoFile(file); setLogoPreview(preview); }}
            onClear={() => { setLogoFile(null); setLogoPreview(null); }}
          />
          <ImageDimensionUpload
            label="Favicon"
            requiredWidth={FAVICON_DIMENSIONS.width}
            requiredHeight={FAVICON_DIMENSIONS.height}
            value={faviconPreview}
            onFileValidated={(file, preview) => { setFaviconFile(file); setFaviconPreview(preview); }}
            onClear={() => { setFaviconFile(null); setFaviconPreview(null); }}
          />
        </div>
        {errors.logo && <p className={errCls}>{errors.logo}</p>}

        <div className="grid grid-cols-2 gap-4">
          <ColorField label="Primary Color" value={primaryColor} onChange={setPrimaryColor} required />
          <ColorField label="Secondary Color" value={secondaryColor} onChange={setSecondaryColor} />
        </div>
        {errors.primaryColor && <p className={errCls}>{errors.primaryColor}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onBack} className="text-[12px] font-semibold text-[#64748B] px-4 py-2.5 rounded-[8px] border border-[#E2E8F0] hover:bg-[#F8FAFC]">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="text-[12px] font-semibold text-white px-5 py-2.5 rounded-[8px] bg-[#00A86B] hover:bg-[#008F5C] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Creating…' : 'Create Company'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Detail view (stage 2 — fill in the rest, one group at a time) ─────────
const GROUP_LABELS: Record<string, string> = {
  delhivery: 'Delhivery', dtdc: 'DTDC', ekart: 'Ekart', shadowfax: 'Shadowfax',
  smartship: 'SmartShip', zipypost: 'Zipypost', amazon: 'Amazon', boxdLogistics: 'BoxdLogistics', proship: 'Proship',
  shiprocket: 'Shiprocket', shreeMaruti: 'Shree Maruti',
  razorpay: 'Razorpay', paytm: 'Paytm', cashfree: 'Cashfree',
  smtp: 'Email (SMTP)', whatsapp: 'WhatsApp', sms: 'SMS', s3: 'File Storage (S3)', core: 'Core / Security',
};

// Generic field hints per category so the edit modal shows sensible labels
// without the backend needing to know about them — it stores whatever JSON
// is submitted, so adding a new provider later is a frontend-only change.
const GROUP_FIELD_HINTS: Record<string, { key: string; label: string; secret?: boolean }[]> = {
  couriers: [
    { key: 'apiKey', label: 'API Key', secret: true },
    { key: 'apiSecret', label: 'API Secret', secret: true },
    { key: 'accountId', label: 'Account / Client ID' },
  ],
  payments: [
    { key: 'keyId', label: 'Key ID' },
    { key: 'keySecret', label: 'Key Secret', secret: true },
    { key: 'webhookSecret', label: 'Webhook Secret', secret: true },
  ],
  smtp: [
    { key: 'host', label: 'SMTP Host' },
    { key: 'port', label: 'Port' },
    { key: 'username', label: 'Username' },
    { key: 'password', label: 'Password', secret: true },
  ],
  whatsapp: [
    { key: 'apiKey', label: 'API Key', secret: true },
    { key: 'phoneNumberId', label: 'Phone Number ID' },
  ],
  sms: [
    { key: 'apiKey', label: 'API Key', secret: true },
    { key: 'senderId', label: 'Sender ID' },
  ],
  s3: [
    { key: 'accessKeyId', label: 'Access Key ID' },
    { key: 'secretAccessKey', label: 'Secret Access Key', secret: true },
    { key: 'bucket', label: 'Bucket' },
    { key: 'region', label: 'Region' },
  ],
  core: [
    { key: 'jwtSecret', label: 'JWT Secret', secret: true },
    { key: 'sessionSecret', label: 'Session Secret', secret: true },
  ],
};

function fieldHintsFor(category: string, key: string) {
  if (category === 'core') return GROUP_FIELD_HINTS.core;
  return GROUP_FIELD_HINTS[key] || GROUP_FIELD_HINTS[category] || [{ key: 'value', label: 'Value', secret: true }];
}

function CompanyDetail({ tenantKey, onBack }: { tenantKey: string; onBack: () => void }) {
  const { toast, showToast } = useToast();
  const [company, setCompany] = useState<CompanySummary | null>(null);
  const [groupStatus, setGroupStatus] = useState<GroupStatusMap>({});
  const [groups, setGroups] = useState<ConfigGroups | null>(null);
  // the exact fields the backend expects per group (courier groups today); empty against an older backend
  const [fieldCatalog, setFieldCatalog] = useState<Record<string, ConfigFieldHint[]>>({});
  const [loading, setLoading] = useState(true);
  const [editingGroup, setEditingGroup] = useState<{ category: string; key: string; groupKey: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [detailRes, groupsRes] = await Promise.all([companiesApi.getOne(tenantKey), companiesApi.configGroups()]);
      setCompany(detailRes.data.company);
      setGroupStatus(detailRes.data.groupStatus);
      setGroups(groupsRes.data.groups);
      setFieldCatalog(groupsRes.data.fields || {});
    } catch {
      showToast('error', 'Failed to load company');
    } finally {
      setLoading(false);
    }
  }, [tenantKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  if (loading || !company || !groups) {
    return (
      <div className="flex flex-col h-[calc(100vh-72px)] -m-4 md:-m-6 bg-white relative">
        <TableLoader />
      </div>
    );
  }

  const groupSections: { category: string; label: string; keys: string[] }[] = [
    { category: 'core', label: 'Core / Security', keys: ['core'] },
    { category: 'couriers', label: 'Courier Credentials', keys: groups.couriers },
    { category: 'payments', label: 'Payment Gateways', keys: groups.payments },
    { category: 'notifications', label: 'Notifications', keys: groups.notifications },
    { category: 'storage', label: 'File Storage', keys: groups.storage },
  ];

  return (
    <div className="flex flex-col min-h-[calc(100vh-72px)] -m-4 md:-m-6 bg-white">
      <Toast toast={toast} onClose={() => {}} />
      <div className="flex items-center gap-3 px-4 md:px-6 py-4 border-b border-[#E2E8F0] shrink-0">
        <button onClick={onBack} className="w-8 h-8 rounded-[8px] border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-[#F8FAFC]"><ArrowLeft className="w-4 h-4" /></button>
        {company.branding?.logoUrl ? (
          <img src={company.branding.logoUrl} alt="" className="w-9 h-9 rounded-[8px] object-cover border border-[#E2E8F0]" />
        ) : (
          <div className="w-9 h-9 rounded-[8px] bg-[#F0FDF4] flex items-center justify-center"><Building2 className="w-4 h-4 text-[#00A86B]" /></div>
        )}
        <div>
          <h1 className="text-[16px] font-semibold text-[#0F172A]">{company.displayName}</h1>
          <p className="text-[12px] text-[#64748B]">{company.tenantKey} · {company.domains[0]?.hostname}</p>
        </div>
      </div>

      <div className="max-w-3xl w-full mx-auto px-4 md:px-6 py-6 flex flex-col gap-4">
        <BrandingSection company={company} onSaved={load} showToast={showToast} />

        {groupSections.map(section => (
          <SectionCard key={section.category} title={section.label}>
            <div className="flex flex-col divide-y divide-[#F1F5F9]">
              {section.keys.map(key => {
                const groupKey = section.category === 'core' ? 'core' : `${section.category}.${key}`;
                const status = groupStatus[groupKey];
                const isSet = section.category === 'core'
                  ? (status as any)?.jwtSecret === 'set'
                  : status === 'set';
                return (
                  <div key={key} className="flex items-center justify-between py-2.5">
                    <span className="text-[13px] text-[#334155]">{GROUP_LABELS[key] || key}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${isSet ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                        {isSet ? 'Configured' : 'Not configured'}
                      </span>
                      <button
                        onClick={() => setEditingGroup({ category: section.category, key, groupKey })}
                        className="p-1.5 rounded-[6px] text-[#94A3B8] hover:text-[#00A86B] hover:bg-[#ECFDF5] transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        ))}

        <WebhookAddressesSection tenantKey={tenantKey} refreshKey={JSON.stringify(groupStatus)} />
      </div>

      {editingGroup && (
        <GroupEditModal
          tenantKey={tenantKey}
          category={editingGroup.category}
          keyName={editingGroup.key}
          serverFields={fieldCatalog[editingGroup.groupKey]}
          groupKey={editingGroup.groupKey}
          onClose={() => setEditingGroup(null)}
          onSaved={() => { setEditingGroup(null); load(); showToast('success', 'Saved'); }}
        />
      )}
    </div>
  );
}

function WebhookAddressesSection({ tenantKey, refreshKey }: { tenantKey: string; refreshKey: string }) {
  const [urls, setUrls] = useState<WebhookAddress[] | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');

  // reload when a settings group is saved: the "secret set" badges come from the same settings
  useEffect(() => {
    let cancelled = false;
    companiesApi.webhookUrls(tenantKey)
      .then(res => { if (!cancelled) { setUrls(res.data.urls); setError(''); } })
      .catch(() => { if (!cancelled) setError('Could not load the webhook addresses'); });
    return () => { cancelled = true; };
  }, [tenantKey, refreshKey]);

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      setTimeout(() => setCopied(''), 1500);
    } catch { /* clipboard not available */ }
  };

  const badge = (text: string, tone: 'ok' | 'warn' | 'muted') => (
    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
      tone === 'ok' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
        : tone === 'warn' ? 'bg-amber-50 text-amber-700 border-amber-200'
        : 'bg-slate-50 text-slate-500 border-slate-200'}`}>{text}</span>
  );

  return (
    <SectionCard title="Webhook addresses">
      <p className="text-[12px] text-[#64748B] mb-3">
        Register these with the courier or shop for this company. Each one carries the company's key, so whatever arrives is applied to this company only.
        A courier's webhook secret (set under its settings above) must be filled in, otherwise its calls are refused.
      </p>
      {error && <p className="text-[12px] text-red-600">{error}</p>}
      {!urls && !error && <p className="text-[12px] text-[#94A3B8]">Loading…</p>}
      {urls && (
        <div className="flex flex-col divide-y divide-[#F1F5F9]">
          {urls.map(u => (
            <div key={u.url} className="py-2.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-[13px] text-[#334155]">{u.label}</span>
                <div className="flex items-center gap-1.5">
                  {u.automatic && badge('Automatic', 'muted')}
                  {!u.authenticated && badge('No authentication', 'warn')}
                  {u.secretStatus && badge(u.secretStatus === 'set' ? 'Secret set' : 'Secret missing', u.secretStatus === 'set' ? 'ok' : 'warn')}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <code data-testid="webhook-url" className="text-[11px] text-[#475569] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-2 py-1 break-all flex-1">{u.url}</code>
                <button
                  onClick={() => copy(u.url)}
                  title="Copy"
                  className="p-1.5 rounded-[6px] text-[#94A3B8] hover:text-[#00A86B] hover:bg-[#ECFDF5] transition-colors shrink-0"
                >
                  {copied === u.url ? <span className="text-[10px] font-semibold text-[#00A86B]">Copied</span> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[11px] text-[#94A3B8] mt-1">{u.how}</p>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="w-full bg-white border border-[#E2E8F0] rounded-[12px] p-5">
      <h3 className="text-[14px] font-semibold text-[#0F172A] mb-3">{title}</h3>
      {children}
    </div>
  );
}

function BrandingSection({ company, onSaved, showToast }: {
  company: CompanySummary; onSaved: () => void; showToast: (t: 'success' | 'error', m: string) => void;
}) {
  const [uploading, setUploading] = useState<'logo' | 'favicon' | null>(null);

  const handleReplace = async (kind: 'logo' | 'favicon', file: File) => {
    setUploading(kind);
    try {
      await companiesApi.uploadBrandingAsset(company.tenantKey, kind, file);
      onSaved();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || `Failed to update ${kind}`);
    } finally {
      setUploading(null);
    }
  };

  return (
    <SectionCard title="Branding">
      <div className="grid grid-cols-2 gap-4">
        <ImageDimensionUpload
          label="Logo"
          requiredWidth={LOGO_DIMENSIONS.width}
          requiredHeight={LOGO_DIMENSIONS.height}
          value={company.branding?.logoUrl || null}
          onFileValidated={file => handleReplace('logo', file)}
        />
        <ImageDimensionUpload
          label="Favicon"
          requiredWidth={FAVICON_DIMENSIONS.width}
          requiredHeight={FAVICON_DIMENSIONS.height}
          value={company.branding?.faviconUrl || null}
          onFileValidated={file => handleReplace('favicon', file)}
        />
      </div>
      {uploading && <p className="text-[11px] text-[#94A3B8] mt-2">Uploading {uploading}…</p>}
      <p className="text-[11px] text-[#94A3B8] mt-3">Colors: primary {company.branding?.colors?.primary || '—'}{company.branding?.colors?.secondary ? `, secondary ${company.branding.colors.secondary}` : ''}</p>
    </SectionCard>
  );
}

function GroupEditModal({ tenantKey, category, keyName, groupKey, serverFields, onClose, onSaved }: {
  tenantKey: string; category: string; keyName: string; groupKey: string; serverFields?: ConfigFieldHint[]; onClose: () => void; onSaved: () => void;
}) {
  // The backend's own field list wins (courier groups); the generic hints below are the fallback
  // for groups it does not list yet and for an older backend.
  const fields = serverFields && serverFields.length ? serverFields : fieldHintsFor(category, keyName);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    const populated = Object.fromEntries(Object.entries(values).filter(([, v]) => v.trim() !== ''));
    if (Object.keys(populated).length === 0) {
      setError('Fill in at least one field');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await companiesApi.updateConfigGroup(tenantKey, groupKey, populated);
      onSaved();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 md:p-4" onClick={onClose}>
      <div className="bg-white rounded-t-[20px] md:rounded-[12px] shadow-xl w-full md:max-w-md relative max-h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0] shrink-0">
          <h3 className="text-[14px] font-semibold text-[#0F172A]">{GROUP_LABELS[keyName] || keyName}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F8FAFC]"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-5 py-4 flex flex-col gap-3 overflow-y-auto min-h-0">
          <p className="text-[11px] text-[#94A3B8]">Only fields you fill in here are saved — leave the rest blank to keep them unset.</p>
          {fields.map(f => (
            <div key={f.key} className="flex flex-col gap-1">
              <label className="text-[12px] font-semibold text-[#64748B]">{f.label}</label>
              <input
                type={f.secret ? 'password' : 'text'}
                value={values[f.key] || ''}
                onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))}
                className="border border-[#E2E8F0] rounded-[8px] px-3 py-2 text-[12px] text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#00A86B]/40 focus:border-[#00A86B] transition-colors"
              />
            </div>
          ))}
          {error && <p className="text-[11px] text-red-500">{error}</p>}
        </div>
        <div className="flex justify-end gap-2.5 px-5 py-4 border-t border-[#E2E8F0] shrink-0">
          <button onClick={onClose} className="text-[12px] font-semibold text-[#64748B] px-4 py-2 rounded-[8px] border border-[#E2E8F0] hover:bg-[#F8FAFC]">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="text-[12px] font-semibold text-white px-4 py-2 rounded-[8px] bg-[#00A86B] hover:bg-[#008F5C] disabled:opacity-50">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
