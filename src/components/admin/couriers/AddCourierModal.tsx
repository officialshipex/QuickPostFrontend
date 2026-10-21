import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Key, Mail, User, Clock, ShieldCheck, ArrowRight, Hash } from 'lucide-react';
import { apiClient } from '../../../services/apiClient';

const PROVIDERS = [
  'Amazon Shipping', 'Delhivery', 'DTDC', 'EcomExpress', 'Ekart',
  'ShipMaxx', 'NimbusPost', 'Proship', 'Shadowfax', 'Shiprocket',
  'Shree Maruti', 'Smartship', 'XpressBees', 'ZipyPost', 'BoxdLogistics', 'Jiffy',
];

type CredField = { id: string; label: string; type: string; placeholder: string; icon: any; optional?: boolean };

const getCredFields = (provider: string): CredField[] => {
  const p = provider.toLowerCase();
  if (['delhivery', 'shadowfax', 'amazon shipping'].includes(p)) {
    return [{ id: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Enter API Key', icon: Key }];
  }
  if (p === 'dtdc') {
    return [
      { id: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Enter API Key', icon: Key },
      { id: 'email', label: 'Username', type: 'text', placeholder: 'Enter username', icon: User },
      { id: 'password', label: 'Password', type: 'password', placeholder: 'Enter password', icon: ShieldCheck },
    ];
  }
  if (p === 'xpressbees') {
    return [
      { id: 'email', label: 'Email', type: 'email', placeholder: 'Enter email', icon: Mail },
      { id: 'password', label: 'Password', type: 'password', placeholder: 'Enter password', icon: ShieldCheck },
    ];
  }
  if (p === 'shree maruti') {
    return [
      { id: 'email', label: 'Email / Username', type: 'text', placeholder: 'Enter email or username', icon: User },
      { id: 'password', label: 'Password', type: 'password', placeholder: 'Enter password', icon: ShieldCheck },
      { id: 'tenantId', label: 'Tenant ID (optional)', type: 'text', placeholder: 'Overrides default tenant', icon: Hash },
      { id: 'carrierId', label: 'Carrier ID (optional)', type: 'text', placeholder: 'Overrides default carrier', icon: Hash },
      { id: 'carrierName', label: 'Carrier Name (optional)', type: 'text', placeholder: 'Overrides default carrier name', icon: Hash },
    ];
  }
  // ShipMaxx (Losung360 internally): login + the channel id given for the account
  if (p === 'shipmaxx') {
    return [
      { id: 'email', label: 'Email / Username', type: 'text', placeholder: 'Enter email or username', icon: User },
      { id: 'password', label: 'Password', type: 'password', placeholder: 'Enter password', icon: ShieldCheck },
      { id: 'channelId', label: 'Channel ID', type: 'text', placeholder: 'Channel ID given for this account', icon: Hash },
    ];
  }
  // Shiprocket, Ekart, NimbusPost, Smartship,
  // EcomExpress, Proship, ZipyPost, BoxdLogistics, etc.
  return [
    { id: 'email', label: 'Email / Username', type: 'text', placeholder: 'Enter email or username', icon: User },
    { id: 'password', label: 'Password', type: 'password', placeholder: 'Enter password', icon: ShieldCheck },
  ];
};

// Cargo (B2B) couriers have their own credential store (B2BallCourier) and save routes — only providers
// with a real B2B integration, same configs as ShipexFrontend's B2B "Add Courier" (CourierAdd isB2B).
const B2B_COURIER_CONFIGS: Record<string, { endpoint: string; fields: CredField[] }> = {
  Shiprocket: {
    endpoint: '/b2b/shiprocket/getToken',
    fields: [
      { id: 'clientId', label: 'Client ID', type: 'text', placeholder: 'Shiprocket Cargo Client ID', icon: Hash },
      { id: 'refreshToken', label: 'Refresh Token', type: 'password', placeholder: 'Refresh Token', icon: Key },
      { id: 'authToken', label: 'Auth Token', type: 'password', placeholder: 'Auth Token', icon: Key },
    ],
  },
  Delhivery: {
    endpoint: '/b2b/delhivery/getToken',
    fields: [
      { id: 'username', label: 'User', type: 'text', placeholder: 'B2B Username', icon: User },
      { id: 'password', label: 'Password', type: 'password', placeholder: 'Password', icon: ShieldCheck },
    ],
  },
  BigShip: {
    endpoint: '/b2b/bigship/getToken',
    fields: [
      { id: 'username', label: 'User / Email', type: 'text', placeholder: 'API Username', icon: User },
      { id: 'password', label: 'Password', type: 'password', placeholder: 'Password', icon: ShieldCheck },
      { id: 'accessKey', label: 'Access Key', type: 'text', placeholder: 'API Access Key', icon: Key },
    ],
  },
  Gati: {
    endpoint: '/b2b/gati/getToken',
    fields: [
      { id: 'username', label: 'User', type: 'text', placeholder: 'Gati API Username', icon: User },
      { id: 'password', label: 'Password', type: 'password', placeholder: 'Password', icon: ShieldCheck },
      { id: 'customerCode', label: 'Customer Code', type: 'text', placeholder: '8-digit customer code issued by Gati', icon: Hash },
      { id: 'encryptedCustCode', label: 'Encrypted Customer Code', type: 'text', placeholder: 'Encrypted customer code issued by Gati', icon: Key },
      { id: 'goodsCode', label: 'Default Goods Code (optional)', type: 'text', placeholder: 'Auto-detected from products; else this, else 18', icon: Hash, optional: true },
    ],
  },
};

interface AddCourierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  /** Cargo (B2B) courier — B2B providers, credentials and save routes. */
  cargo?: boolean;
  /** Cargo: providers already added (one account per B2B provider). */
  existingProviders?: string[];
}

export function AddCourierModal({ isOpen, onClose, onSuccess, cargo = false, existingProviders = [] }: AddCourierModalProps) {
  const [b2bProviders, setB2bProviders] = useState<string[]>([]);
  const [provider, setProvider] = useState('');
  const [courierName, setCourierName] = useState('');
  const [codDays, setCodDays] = useState('');
  const [status, setStatus] = useState('Enable');
  const [liabilityCharge, setLiabilityCharge] = useState('');
  const [liabilityPercent, setLiabilityPercent] = useState('');
  const [creds, setCreds] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setProvider(''); setCourierName(''); setCodDays(''); setStatus('Enable');
      setLiabilityCharge(''); setLiabilityPercent('');
      setCreds({}); setError('');
    }
  }, [isOpen]);

  useEffect(() => {
    setCreds({});
  }, [provider]);

  // Cargo: the B2B providers enabled for this company (same list ShipexFrontend's B2B screen offers)
  useEffect(() => {
    if (!cargo || !isOpen) return;
    apiClient.get('/allCourier/enabled-providers', { params: { type: 'b2b' } })
      .then(res => {
        const opts: { value: string }[] = res.data?.options || res.data?.b2b || [];
        setB2bProviders(opts.map(o => o.value).filter(Boolean));
      })
      .catch(() => setB2bProviders([]));
  }, [cargo, isOpen]);

  const providerOptions = cargo
    ? b2bProviders.filter(p => !existingProviders.includes(p))
    : PROVIDERS;
  const b2bConfig = cargo ? B2B_COURIER_CONFIGS[provider] : undefined;
  const credFields = !provider ? [] : cargo ? (b2bConfig?.fields || []) : getCredFields(provider);

  const handleSubmit = async () => {
    setError('');
    if (!provider) { setError('Select a provider'); return; }
    if (!courierName.trim()) { setError('Courier name is required'); return; }
    if (!status) { setError('Status is required'); return; }
    if (cargo) {
      if (!b2bConfig) { setError(`${provider} does not have a B2B integration yet`); return; }
      if (!codDays) { setError('COD days is required'); return; }
      const missing = b2bConfig.fields.find(f => !f.optional && !(creds[f.id] || '').trim());
      if (missing) { setError(`Please enter ${missing.label}`); return; }
      setSaving(true);
      try {
        // Same body ShipexFrontend's B2B "Add Courier" posts to the provider's B2B save route
        await apiClient.post(b2bConfig.endpoint, {
          courierName: courierName.trim(),
          courierProvider: provider,
          CODDays: codDays,
          status,
          credentials: Object.fromEntries(Object.entries(creds).map(([k, v]) => [k, String(v).trim()])),
        });
        onSuccess();
        onClose();
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to add courier');
      } finally {
        setSaving(false);
      }
      return;
    }
    if (provider === 'ShipMaxx' && !/^d+$/.test((creds.channelId || '').trim())) {
      setError('Channel ID is required (numeric)'); return;
    }

    setSaving(true);
    try {
      await apiClient.post('/allCourier/addCourier', {
        courierName: courierName.trim(),
        courierProvider: provider,
        CODDays: codDays ? Number(codDays) : undefined,
        status,
        liabilityCharge: liabilityCharge ? Number(liabilityCharge) : 0,
        liabilityPercent: liabilityPercent ? Number(liabilityPercent) : 0,
        email: creds.email || '',
        apiKey: creds.apiKey || '',
        password: creds.password || '',
        tenantId: creds.tenantId || undefined,
        carrierId: creds.carrierId || undefined,
        carrierName: creds.carrierName || undefined,
        channelId: creds.channelId ? creds.channelId.trim() : undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to add courier');
    } finally {
      setSaving(false);
    }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.25 } },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  } as const;

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.96, y: 16 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring' as const, stiffness: 400, damping: 32, mass: 0.8 } },
    exit: { opacity: 0, scale: 0.96, y: 12, transition: { duration: 0.2 } },
  } as const;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div variants={overlayVariants} initial="hidden" animate="visible" exit="exit"
            className="fixed inset-0 z-50 bg-[#0F172A]/20 pointer-events-auto" onClick={onClose} />

          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4 pointer-events-none">
            <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit"
              className="w-full md:max-w-[520px] max-h-[92vh] md:max-h-none bg-white md:bg-white/95 md:backdrop-blur-2xl border-t md:border border-[#E2E8F0] md:border-white/60 shadow-[0_-8px_40px_-8px_rgba(0,0,0,0.16)] md:shadow-[0_40px_80px_-16px_rgba(0,0,0,0.16)] rounded-t-[24px] md:rounded-[28px] pointer-events-auto overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="px-4 md:px-7 py-4 md:py-6 border-b border-[#E2E8F0] flex items-center justify-between bg-white/40 shrink-0">
                <div className="min-w-0">
                  <h3 className="text-[14px] md:text-xl font-bold text-[#0F172A]">{cargo ? 'Add B2B Courier' : 'Add Courier'}</h3>
                  <p className="hidden md:block text-xs text-[#94A3B8] mt-0.5">{cargo ? 'Register a cargo (B2B) courier account' : 'Register a new courier provider'}</p>
                </div>
                <button onClick={onClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-4 md:p-7 overflow-y-auto max-h-[65vh] space-y-4 md:space-y-5 bg-[#F8FAFC]/50">

                {/* Provider */}
                <div>
                  <label className="block text-[12px] font-semibold text-[#64748B] mb-1.5 md:mb-2 md:uppercase md:tracking-wide">Provider</label>
                  <select
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    className="w-full h-11 md:h-12 px-4 bg-white border border-[#E2E8F0] rounded-full md:rounded-[14px] text-[12px] md:text-sm font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20 focus:border-[#00A86B] appearance-none"
                  >
                    <option value="">Select provider</option>
                    {providerOptions.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  {cargo && providerOptions.length === 0 && (
                    <p className="text-[12px] text-[#64748B] mt-1.5 ml-1">
                      {b2bProviders.length === 0
                        ? 'No B2B couriers are enabled for your company yet.'
                        : 'All enabled B2B couriers have already been added.'}
                    </p>
                  )}
                </div>

                {/* Courier Name */}
                <div>
                  <label className="block text-[12px] font-semibold text-[#64748B] mb-1.5 md:mb-2 md:uppercase md:tracking-wide">Courier Name</label>
                  <input
                    type="text"
                    placeholder="Display name (e.g. Delhivery Primary)"
                    value={courierName}
                    onChange={(e) => setCourierName(e.target.value)}
                    className="w-full h-11 md:h-12 px-4 bg-white border border-[#E2E8F0] rounded-full md:rounded-[14px] text-[12px] md:text-sm font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20 focus:border-[#00A86B]"
                  />
                </div>

                {/* COD Days + Status row */}
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className="block text-[12px] font-semibold text-[#64748B] mb-1.5 md:mb-2 md:uppercase md:tracking-wide">
                      <Clock className="inline w-3 h-3 mr-1" />COD Days
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 3"
                      value={codDays}
                      onChange={(e) => setCodDays(e.target.value)}
                      className="w-full h-11 md:h-12 px-4 bg-white border border-[#E2E8F0] rounded-full md:rounded-[14px] text-[12px] md:text-sm font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20 focus:border-[#00A86B]"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-[#64748B] mb-1.5 md:mb-2 md:uppercase md:tracking-wide">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full h-11 md:h-12 px-4 bg-white border border-[#E2E8F0] rounded-full md:rounded-[14px] text-[12px] md:text-sm font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20 focus:border-[#00A86B] appearance-none"
                    >
                      <option value="Enable">Enable</option>
                      <option value="Disable">Disable</option>
                    </select>
                  </div>
                </div>

                {/* Liability Amount + Percent row — B2C only (a B2B courier record has no liability) */}
                {!cargo && <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className="block text-[12px] font-semibold text-[#64748B] mb-1.5 md:mb-2 md:uppercase md:tracking-wide">
                      Liability ₹
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 2000"
                      value={liabilityCharge}
                      onChange={(e) => setLiabilityCharge(e.target.value)}
                      className="w-full h-11 md:h-12 px-4 bg-white border border-[#E2E8F0] rounded-full md:rounded-[14px] text-[12px] md:text-sm font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20 focus:border-[#00A86B]"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-[#64748B] mb-1.5 md:mb-2 md:uppercase md:tracking-wide">
                      Liability %
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 70"
                      value={liabilityPercent}
                      onChange={(e) => setLiabilityPercent(e.target.value)}
                      className="w-full h-11 md:h-12 px-4 bg-white border border-[#E2E8F0] rounded-full md:rounded-[14px] text-[12px] md:text-sm font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20 focus:border-[#00A86B]"
                    />
                  </div>
                </div>}

                {/* Dynamic credential fields */}
                {credFields.map((field) => {
                  const Icon = field.icon;
                  return (
                    <div key={field.id}>
                      <label className="block text-[12px] font-semibold text-[#64748B] mb-1.5 md:mb-2 md:uppercase md:tracking-wide">{field.label}</label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]">
                          <Icon className="w-4 h-4" />
                        </div>
                        <input
                          type={field.type}
                          placeholder={field.placeholder}
                          value={creds[field.id] || ''}
                          onChange={(e) => setCreds(prev => ({ ...prev, [field.id]: e.target.value }))}
                          className="w-full h-11 md:h-12 pl-11 pr-4 bg-white border border-[#E2E8F0] rounded-full md:rounded-[14px] text-[12px] md:text-sm font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20 focus:border-[#00A86B]"
                        />
                      </div>
                    </div>
                  );
                })}

                {error && <p className="text-[12px] text-red-500 font-medium">{error}</p>}
              </div>

              {/* Footer */}
              <div className="px-4 md:px-7 py-4 md:py-5 border-t border-[#E2E8F0] bg-white/60 flex justify-end gap-2.5 md:gap-3 shrink-0">
                <button onClick={onClose}
                  className="flex-1 md:flex-none px-5 h-11 rounded-full font-semibold text-[12px] md:text-sm text-[#475569] bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-all">
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={handleSubmit}
                  disabled={saving}
                  className="flex-1 md:flex-none px-6 h-11 rounded-full font-semibold text-[12px] md:text-sm text-white flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(0,157,100,0.25)] disabled:opacity-60"
                  style={{ background: '#009D64' }}
                >
                  {saving ? 'Adding...' : 'Add Courier'} <ArrowRight className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
