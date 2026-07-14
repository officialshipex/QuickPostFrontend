import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Key, Mail, User, Clock, ShieldCheck, ArrowRight, Hash } from 'lucide-react';
import { apiClient } from '../../../services/apiClient';

const PROVIDERS = [
  'Amazon Shipping', 'Delhivery', 'DTDC', 'EcomExpress', 'Ekart',
  'Losung360', 'NimbusPost', 'Proship', 'Shadowfax', 'Shiprocket',
  'Shree Maruti', 'Smartship', 'XpressBees', 'ZipyPost', 'BoxdLogistics',
];

type CredField = { id: string; label: string; type: string; placeholder: string; icon: any };

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
  // Shiprocket, Shree Maruti, Losung360, Ekart, NimbusPost, Smartship,
  // EcomExpress, Proship, ZipyPost, BoxdLogistics, etc.
  return [
    { id: 'email', label: 'Email / Username', type: 'text', placeholder: 'Enter email or username', icon: User },
    { id: 'password', label: 'Password', type: 'password', placeholder: 'Enter password', icon: ShieldCheck },
  ];
};

interface AddCourierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddCourierModal({ isOpen, onClose, onSuccess }: AddCourierModalProps) {
  const [provider, setProvider] = useState('');
  const [courierName, setCourierName] = useState('');
  const [codDays, setCodDays] = useState('');
  const [status, setStatus] = useState('Enable');
  const [creds, setCreds] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setProvider(''); setCourierName(''); setCodDays(''); setStatus('Enable');
      setCreds({}); setError('');
    }
  }, [isOpen]);

  useEffect(() => {
    setCreds({});
  }, [provider]);

  const credFields = provider ? getCredFields(provider) : [];

  const handleSubmit = async () => {
    setError('');
    if (!provider) { setError('Select a provider'); return; }
    if (!courierName.trim()) { setError('Courier name is required'); return; }
    if (!status) { setError('Status is required'); return; }

    setSaving(true);
    try {
      await apiClient.post('/allCourier/addCourier', {
        courierName: courierName.trim(),
        courierProvider: provider,
        CODDays: codDays ? Number(codDays) : undefined,
        status,
        email: creds.email || '',
        apiKey: creds.apiKey || '',
        password: creds.password || '',
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

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit"
              className="w-full max-w-[520px] bg-white/95 backdrop-blur-2xl border border-white/60 shadow-[0_40px_80px_-16px_rgba(0,0,0,0.16)] rounded-[28px] pointer-events-auto overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="px-7 py-6 border-b border-[#E2E8F0] flex items-center justify-between bg-white/40">
                <div>
                  <h3 className="text-xl font-bold text-[#0F172A]">Add Courier</h3>
                  <p className="text-xs text-[#94A3B8] mt-0.5">Register a new courier provider</p>
                </div>
                <button onClick={onClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-7 overflow-y-auto max-h-[65vh] space-y-5 bg-[#F8FAFC]/50">

                {/* Provider */}
                <div>
                  <label className="block text-xs font-bold text-[#64748B] mb-2 uppercase tracking-wide">Provider</label>
                  <select
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    className="w-full h-12 px-4 bg-white border border-[#E2E8F0] rounded-[14px] text-sm font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20 focus:border-[#00A86B] appearance-none"
                  >
                    <option value="">Select provider</option>
                    {PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                {/* Courier Name */}
                <div>
                  <label className="block text-xs font-bold text-[#64748B] mb-2 uppercase tracking-wide">Courier Name</label>
                  <input
                    type="text"
                    placeholder="Display name (e.g. Delhivery Primary)"
                    value={courierName}
                    onChange={(e) => setCourierName(e.target.value)}
                    className="w-full h-12 px-4 bg-white border border-[#E2E8F0] rounded-[14px] text-sm font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20 focus:border-[#00A86B]"
                  />
                </div>

                {/* COD Days + Status row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#64748B] mb-2 uppercase tracking-wide">
                      <Clock className="inline w-3 h-3 mr-1" />COD Days
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 3"
                      value={codDays}
                      onChange={(e) => setCodDays(e.target.value)}
                      className="w-full h-12 px-4 bg-white border border-[#E2E8F0] rounded-[14px] text-sm font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20 focus:border-[#00A86B]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#64748B] mb-2 uppercase tracking-wide">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full h-12 px-4 bg-white border border-[#E2E8F0] rounded-[14px] text-sm font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20 focus:border-[#00A86B] appearance-none"
                    >
                      <option value="Enable">Enable</option>
                      <option value="Disable">Disable</option>
                    </select>
                  </div>
                </div>

                {/* Dynamic credential fields */}
                {credFields.map((field) => {
                  const Icon = field.icon;
                  return (
                    <div key={field.id}>
                      <label className="block text-xs font-bold text-[#64748B] mb-2 uppercase tracking-wide">{field.label}</label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]">
                          <Icon className="w-4 h-4" />
                        </div>
                        <input
                          type={field.type}
                          placeholder={field.placeholder}
                          value={creds[field.id] || ''}
                          onChange={(e) => setCreds(prev => ({ ...prev, [field.id]: e.target.value }))}
                          className="w-full h-12 pl-11 pr-4 bg-white border border-[#E2E8F0] rounded-[14px] text-sm font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20 focus:border-[#00A86B]"
                        />
                      </div>
                    </div>
                  );
                })}

                {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
              </div>

              {/* Footer */}
              <div className="px-7 py-5 border-t border-[#E2E8F0] bg-white/60 flex justify-end gap-3">
                <button onClick={onClose}
                  className="px-5 h-11 rounded-[14px] font-semibold text-sm text-[#475569] bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-all">
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={handleSubmit}
                  disabled={saving}
                  className="px-6 h-11 rounded-[14px] font-semibold text-sm text-white bg-gradient-to-b from-[#00b876] to-[#00A86B] shadow-[0_4px_12px_rgba(0,168,107,0.25)] flex items-center gap-2 border border-[#009B63] disabled:opacity-60"
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
