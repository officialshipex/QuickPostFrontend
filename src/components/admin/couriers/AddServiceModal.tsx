import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Tag, Type, Hash, ChevronDown } from 'lucide-react';
import { apiClient } from '../../../services/apiClient';

interface AddServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  courier: any;
  onSuccess: () => void;
  editData?: any;
}

const DTDC_SERVICES = ['B2C SMART EXPRESS', 'B2C PRIORITY', 'B2C GROUND ECONOMY'];

export function AddServiceModal({ isOpen, onClose, courier, onSuccess, editData }: AddServiceModalProps) {
  const [courier_field, setCourierField] = useState('');
  const [courier_id, setCourierId] = useState('');
  const [courierType, setCourierType] = useState('Domestic (Surface)');
  const [name, setName] = useState('');
  const [status, setStatus] = useState('Enable');
  const [providerServices, setProviderServices] = useState<{ service: string; courier_id?: string | number }[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const providerName: string = courier?.name || '';
  const p = providerName.toLowerCase();

  const isBoxd = p === 'boxdlogistics';
  const isLosung = p === 'losung360' || p === 'lousung360';
  const hasServiceDropdown = providerServices.length > 0;

  useEffect(() => {
    if (!isOpen) return;
    if (editData?._id) {
      const isLosungEdit = (editData.provider || '').toLowerCase().includes('losung');
      setCourierField(isLosungEdit ? '' : (editData.courier || ''));
      setCourierId(editData.courier_id || '');
      setCourierType(editData.courierType || 'Domestic (Surface)');
      setName(editData.name || '');
      setStatus(editData.status || 'Enable');
    } else {
      setCourierField(''); setCourierId(''); setCourierType('Domestic (Surface)');
      setName(''); setStatus('Enable');
    }
    setError('');
    setProviderServices([]);
    fetchSubServices();
  }, [isOpen, providerName]);

  const fetchSubServices = async () => {
    if (!providerName) return;
    setLoadingServices(true);
    try {
      if (p === 'shiprocket') {
        const res = await apiClient.get('/Shiprocket/getAllActiveCourierServices');
        setProviderServices(res.data || []);
      } else if (p === 'nimbuspost') {
        const res = await apiClient.get('/NimbusPost/getCourierServices');
        setProviderServices((res.data || []).map((i: any) => ({ service: i.service || i })));
      } else if (p === 'xpressbees') {
        const res = await apiClient.get('/Xpressbees/getCourierList');
        setProviderServices((res.data || []).map((i: any) => ({ service: i.service || i })));
      } else if (p === 'dtdc') {
        setProviderServices(DTDC_SERVICES.map(s => ({ service: s })));
      }
    } catch {
      // If API fails, fall back to empty (user can still type name manually)
    } finally {
      setLoadingServices(false);
    }
  };

  const handleCourierSelect = (value: string) => {
    setCourierField(value);
    // For Shiprocket, auto-fill courier_id from the fetched service list
    if (p === 'shiprocket') {
      const found = providerServices.find(s => s.service === value);
      setCourierId(found?.courier_id != null ? String(found.courier_id) : '');
    }
  };

  const validate = () => {
    if (!name.trim()) return 'Service name is required';
    if (!courierType) return 'Mode is required';
    if (!status) return 'Status is required';
    if (isLosung && !courier_id.trim()) return 'Courier ID is required';
    if (isBoxd && !courier_field.trim()) return 'Courier Service ID is required';
    if (hasServiceDropdown && !courier_field) return 'Please select a sub-service';
    return '';
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setError('');
    setSaving(true);
    try {
      const courierValue = isLosung ? courier_id : courier_field;
      const payload = {
        provider: providerName,
        courier: courierValue,
        courierName: courierValue,
        courierType,
        name: name.trim(),
        status,
        courier_id,
      };
      if (editData?._id) {
        await apiClient.put(`/courierServices/couriers/${editData._id}`, payload);
      } else {
        await apiClient.post('/courierServices/couriers', payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save service');
    } finally {
      setSaving(false);
    }
  };

  if (!courier) return null;

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
                <div className="flex items-center gap-3 md:gap-4 min-w-0">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl border border-[#E2E8F0] p-2 flex items-center justify-center overflow-hidden shrink-0">
                    <img src={courier.logo || ''} alt={providerName}
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-sm font-bold text-[#94A3B8]">${providerName.charAt(0)}</span>`;
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[14px] md:text-lg font-bold text-[#0F172A] truncate">{providerName}</h3>
                    <p className="text-[12px] md:text-xs text-[#94A3B8]">{editData?._id ? 'Edit courier service' : 'Add courier service'}</p>
                  </div>
                </div>
                <button onClick={onClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-4 md:p-7 overflow-y-auto max-h-[65vh] space-y-4 md:space-y-5 bg-[#F8FAFC]/50">

                {/* Sub-service selector — shown for NimbusPost, Xpressbees, Shiprocket, DTDC */}
                {hasServiceDropdown && (
                  <div>
                    <label className="block text-[12px] font-semibold text-[#64748B] mb-1.5 md:mb-2 md:uppercase md:tracking-wide">
                      <Tag className="inline w-3 h-3 mr-1" />
                      {p === 'dtdc' ? 'Service Type' : 'Sub-Service'}
                    </label>
                    {loadingServices ? (
                      <div className="h-11 md:h-12 bg-white border border-[#E2E8F0] rounded-full md:rounded-[14px] flex items-center px-4 text-[12px] md:text-sm text-[#94A3B8]">
                        Loading services...
                      </div>
                    ) : (
                      <div className="relative">
                        <select
                          value={courier_field}
                          onChange={(e) => handleCourierSelect(e.target.value)}
                          className="w-full h-11 md:h-12 pl-4 pr-10 bg-white border border-[#E2E8F0] rounded-full md:rounded-[14px] text-[12px] md:text-sm font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20 focus:border-[#00A86B] appearance-none"
                        >
                          <option value="">Select sub-service</option>
                          {providerServices.map((svc, i) => (
                            <option key={i} value={svc.service}>{svc.service}</option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-[#94A3B8] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    )}
                  </div>
                )}

                {/* BoxdLogistics — free text courier service ID */}
                {isBoxd && (
                  <div>
                    <label className="block text-[12px] font-semibold text-[#64748B] mb-1.5 md:mb-2 md:uppercase md:tracking-wide">
                      <Hash className="inline w-3 h-3 mr-1" />Courier Service ID
                    </label>
                    <input
                      type="text"
                      placeholder="Enter courier service ID"
                      value={courier_field}
                      onChange={(e) => setCourierField(e.target.value)}
                      className="w-full h-11 md:h-12 px-4 bg-white border border-[#E2E8F0] rounded-full md:rounded-[14px] text-[12px] md:text-sm font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20 focus:border-[#00A86B]"
                    />
                  </div>
                )}

                {/* Losung360 — free text courier ID */}
                {isLosung && (
                  <div>
                    <label className="block text-[12px] font-semibold text-[#64748B] mb-1.5 md:mb-2 md:uppercase md:tracking-wide">
                      <Hash className="inline w-3 h-3 mr-1" />Courier ID
                    </label>
                    <input
                      type="text"
                      placeholder="Enter courier ID"
                      value={courier_id}
                      onChange={(e) => setCourierId(e.target.value)}
                      className="w-full h-11 md:h-12 px-4 bg-white border border-[#E2E8F0] rounded-full md:rounded-[14px] text-[12px] md:text-sm font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20 focus:border-[#00A86B]"
                    />
                  </div>
                )}

                {/* Shiprocket: show auto-filled courier_id as read-only */}
                {p === 'shiprocket' && courier_id && (
                  <div>
                    <label className="block text-[12px] font-semibold text-[#64748B] mb-1.5 md:mb-2 md:uppercase md:tracking-wide">
                      Courier ID (auto-filled)
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={courier_id}
                      className="w-full h-11 md:h-12 px-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-full md:rounded-[14px] text-[12px] md:text-sm text-[#94A3B8] cursor-not-allowed"
                    />
                  </div>
                )}

                {/* Mode */}
                <div>
                  <label className="block text-[12px] font-semibold text-[#64748B] mb-1.5 md:mb-2 md:uppercase md:tracking-wide">
                    <Tag className="inline w-3 h-3 mr-1" />Mode
                  </label>
                  <div className="relative">
                    <select
                      value={courierType}
                      onChange={(e) => setCourierType(e.target.value)}
                      className="w-full h-11 md:h-12 pl-4 pr-10 bg-white border border-[#E2E8F0] rounded-full md:rounded-[14px] text-[12px] md:text-sm font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20 focus:border-[#00A86B] appearance-none"
                    >
                      <option value="Domestic (Surface)">Domestic (Surface)</option>
                      <option value="Domestic (Air)">Domestic (Air)</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-[#94A3B8] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Service Name */}
                <div>
                  <label className="block text-[12px] font-semibold text-[#64748B] mb-1.5 md:mb-2 md:uppercase md:tracking-wide">
                    <Type className="inline w-3 h-3 mr-1" />Service Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Delhivery 0.5 KG Surface"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-11 md:h-12 px-4 bg-white border border-[#E2E8F0] rounded-full md:rounded-[14px] text-[12px] md:text-sm font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20 focus:border-[#00A86B]"
                  />
                  <p className="text-[12px] text-[#94A3B8] mt-1 ml-1">Must be unique across all courier services</p>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-[12px] font-semibold text-[#64748B] mb-1.5 md:mb-2 md:uppercase md:tracking-wide">Status</label>
                  <div className="relative">
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full h-11 md:h-12 pl-4 pr-10 bg-white border border-[#E2E8F0] rounded-full md:rounded-[14px] text-[12px] md:text-sm font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20 focus:border-[#00A86B] appearance-none"
                    >
                      <option value="Enable">Enable</option>
                      <option value="Disable">Disable</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-[#94A3B8] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

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
                  {saving ? 'Saving...' : editData?._id ? 'Save Changes' : 'Save Service'} <ArrowRight className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
