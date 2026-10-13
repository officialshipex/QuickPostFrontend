import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { Toast } from '../../components/ui/Toast';
import { TableLoader } from '../../components/ui/TableLoader';
import { useToast } from '../../hooks/useToast';
import { apiMessage, fmtMoney } from './vas/vasApi';
import { adminVasApi, type AdminService } from './vas/admin/adminVasApi';
import { ServiceSettings } from './vas/admin/ServiceSettings';
import { ServiceUsers } from './vas/admin/ServiceUsers';
import { ServiceRules } from './vas/admin/ServiceRules';
import { UserDrawer } from './vas/admin/UserDrawer';
import { SecureRulesTab } from './vas/admin/SecureRulesTab';
import { SecurePoliciesTab } from './vas/admin/SecurePoliciesTab';
import { SecureClaimsTab } from './vas/admin/SecureClaimsTab';
import { secureAdminApi, type SecureSummaryRow } from './vas/secure/secureApi';

type Tab = 'sellers' | 'policies' | 'claims' | 'cover' | 'settings' | 'rules';
const SECURE_KEYS = ['auto-secure-above-2500', 'auto-secure-india-post'];

/**
 * Admin console for every value-added service: switch a service off/on for everyone or for chosen sellers,
 * set what it costs (plans of N months at ₹X) for everyone or for chosen sellers, and see every seller who has
 * activated / published it — including those who stopped, so the team can ask why.
 */
export function AdminManageVas() {
  const { toast, showToast, closeToast } = useToast(3500);
  const [services, setServices] = useState<AdminService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeKey, setActiveKey] = useState('branded-tracking');
  const [tab, setTab] = useState<Tab>('sellers');
  const [openUser, setOpenUser] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [secure, setSecure] = useState<Record<string, SecureSummaryRow>>({});

  const load = useCallback(async () => {
    try {
      setError('');
      setServices(await adminVasApi.services());
      // Auto Secure numbers (premiums, claims waiting) are best effort: the page works without them.
      secureAdminApi.summary().then((rows) => setSecure(Object.fromEntries(rows.map((r) => [r.key, r])))).catch(() => {});
    } catch (err) {
      setError(apiMessage(err, 'Could not load services.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const changed = useCallback(() => { setRefreshKey((k) => k + 1); load(); }, [load]);
  const notify = useCallback((type: 'success' | 'error' | 'info', text: string) => showToast(type, text), [showToast]);

  const service = services.find((s) => s.key === activeKey) || services[0];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <div className="relative w-20 h-20"><TableLoader /></div>
          <p className="text-[13px] font-semibold text-[#94A3B8]">Loading services…</p>
        </div>
      </AdminLayout>
    );
  }

  const sec = service ? secure[service.key] : undefined;
  const isSecure = !!service && SECURE_KEYS.includes(service.key);
  const TABS: { id: Tab; label: string }[] = [
    { id: 'sellers', label: 'Sellers' },
    ...(isSecure ? [
      { id: 'policies' as Tab, label: 'Covered shipments' },
      { id: 'claims' as Tab, label: `Claims${sec?.claimsAwaitingReview ? ` (${sec.claimsAwaitingReview} to review)` : ''}` },
      { id: 'cover' as Tab, label: 'Cover rules' },
    ] : []),
    { id: 'settings', label: 'Availability & charges' },
    { id: 'rules', label: `Special rules${service?.stats.overrides ? ` (${service.stats.overrides})` : ''}` },
  ];

  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto pb-10">
        <div className="mb-5">
          <h1 className="text-[20px] font-bold text-[#0F172A]">Manage Value Added Services</h1>
          <p className="text-[13px] text-[#64748B] mt-1">Switch services on or off, set what they cost, and keep track of every seller who uses them.</p>
        </div>

        {error || !service ? (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8 text-center text-[13px] text-red-600 font-semibold">{error || 'No services found.'}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
            {/* Service list */}
            <aside className="md:sticky md:top-6 md:self-start">
              <nav className="flex md:flex-col gap-1.5 overflow-x-auto md:overflow-visible pb-1 md:pb-0" aria-label="Services">
                {services.map((s) => {
                  const active = s.key === service.key;
                  const off = !s.config.enabled;
                  return (
                    <button
                      key={s.key} type="button" onClick={() => { setActiveKey(s.key); setTab('sellers'); }}
                      aria-current={active ? 'page' : undefined}
                      className={`shrink-0 md:w-full text-left px-3.5 py-2.5 rounded-xl border transition-colors ${active ? 'bg-[#F0FDF4] border-[#00A86B]/30' : 'bg-white border-[#E2E8F0] hover:bg-[#F8FAFC]'}`}
                    >
                      <p className={`text-[13px] font-bold whitespace-nowrap md:whitespace-normal ${active ? 'text-[#00A86B]' : 'text-[#0F172A]'}`}>{s.name}</p>
                      <p className="text-[11.5px] text-[#64748B] mt-0.5 whitespace-nowrap">
                        {s.stats.active} active · {off ? 'switched off' : s.config.pricingEnabled ? 'paid' : 'free'}
                        {s.stats.followUpOpen > 0 && <span className="text-red-500 font-bold"> · {s.stats.followUpOpen} to follow up</span>}
                        {(secure[s.key]?.claimsAwaitingReview || 0) > 0 && <span className="text-red-500 font-bold"> · {secure[s.key].claimsAwaitingReview} claim{secure[s.key].claimsAwaitingReview === 1 ? '' : 's'} to review</span>}
                      </p>
                    </button>
                  );
                })}
              </nav>
            </aside>

            {/* Selected service */}
            <div className="min-w-0 space-y-5">
              <div>
                <h2 className="text-[17px] font-bold text-[#0F172A]">{service.name}</h2>
                <p className="text-[12.5px] text-[#64748B]">{service.description} {service.activation === 'publish' ? 'A seller counts as a user only when they publish — editing alone does not.' : 'A seller counts as a user once they activate it.'}</p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                <Stat label="Active" value={service.stats.active} tone="green" />
                <Stat label="Deactivated" value={service.stats.inactive} />
                <Stat label="Expired" value={service.stats.expired} tone={service.stats.expired ? 'red' : undefined} />
                <Stat label="Need follow-up" value={service.stats.followUpOpen} tone={service.stats.followUpOpen ? 'red' : undefined} />
                <Stat label="Collected" value={fmtMoney(service.stats.revenue)} />
              </div>

              {isSecure && sec && (
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                  <Stat label="Shipments covered" value={sec.covered} tone="green" />
                  <Stat label="Premium collected" value={fmtMoney(sec.premiumCollected)} />
                  <Stat label="Claims paid out" value={fmtMoney(sec.paidOut)} />
                  <Stat label="Claims waiting" value={sec.claimsAwaitingReview} tone={sec.claimsAwaitingReview ? 'red' : undefined} />
                  <Stat label="Paid out ÷ premium" value={sec.lossRatio === null ? '—' : `${sec.lossRatio}%`} tone={sec.lossRatio !== null && sec.lossRatio > 100 ? 'red' : undefined} />
                </div>
              )}

              <div className="flex gap-1 border-b border-[#E2E8F0] overflow-x-auto" role="tablist">
                {TABS.map((t) => (
                  <button
                    key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
                    className={`relative h-10 px-4 text-[13px] font-bold whitespace-nowrap transition-colors ${tab === t.id ? 'text-[#00A86B]' : 'text-[#64748B] hover:text-[#0F172A]'}`}
                  >
                    {t.label}
                    {tab === t.id && <motion.span layoutId="manage-vas-tab" className="absolute left-0 right-0 -bottom-px h-0.5 bg-[#00A86B]" />}
                  </button>
                ))}
              </div>

              {tab === 'sellers' && <ServiceUsers service={service} refreshKey={refreshKey} onOpen={setOpenUser} notify={notify} />}
              {tab === 'policies' && isSecure && <SecurePoliciesTab service={service} refreshKey={refreshKey} onChanged={changed} notify={notify} />}
              {tab === 'claims' && isSecure && <SecureClaimsTab service={service} refreshKey={refreshKey} onChanged={changed} notify={notify} />}
              {tab === 'cover' && isSecure && <SecureRulesTab service={service} onChanged={changed} notify={notify} />}
              {tab === 'settings' && <ServiceSettings service={service} onChanged={changed} notify={notify} />}
              {tab === 'rules' && <ServiceRules service={service} onChanged={changed} notify={notify} />}
            </div>
          </div>
        )}
      </div>

      {service && <UserDrawer service={service} userId={openUser} onClose={() => setOpenUser(null)} onChanged={changed} notify={notify} />}
      <Toast toast={toast} onClose={closeToast} />
    </AdminLayout>
  );
}

function Stat({ label, value, tone }: { label: string; value: number | string; tone?: 'green' | 'red' }) {
  const color = tone === 'green' ? 'text-[#16A34A]' : tone === 'red' ? 'text-red-600' : 'text-[#0F172A]';
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] px-4 py-3">
      <p className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">{label}</p>
      <p className={`text-[20px] font-extrabold mt-0.5 ${color}`}>{typeof value === 'number' ? value.toLocaleString('en-IN') : value}</p>
    </div>
  );
}
