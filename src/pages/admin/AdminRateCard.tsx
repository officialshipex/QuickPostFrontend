import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { Search, ChevronRight, Save, Filter, X, Upload, Download, Plus, Edit2, CheckCircle2, Truck, Hash, Layers, IndianRupee, RotateCcw, Trash2, Plane, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '../../services/apiClient';
import { GlassDropdown } from '../../components/ui/GlassDropdown';
import { TableLoader } from '../../components/ui/TableLoader';
import { StatusRibbon } from '../../components/ui/StatusRibbon';
import { DesktopPagination, usePagination } from '../../hooks/usePagination';
import { MobilePaginationBar } from '../../hooks/useMobilePaginationBar';

const STATUS_OPTIONS = [
  { label: 'Active', value: 'Active' },
  { label: 'Inactive', value: 'Inactive' },
];
const TYPE_OPTIONS = [
  { label: 'Domestic (Surface)', value: 'Domestic (Surface)' },
  { label: 'Domestic (Air)', value: 'Domestic (Air)' },
];

const getProviderLogo = (name: string) => {
  const n = (name || '').toLowerCase();
  if (n.includes('amazon')) return '/brands/amazon.png';
  if (n.includes('delhivery')) return '/brands/delhivery.png';
  if (n.includes('dtdc')) return '/brands/dtdc.png';
  if (n.includes('ekart')) return '/brands/ekart.png';
  if (n.includes('losung') || n.includes('lousung')) return '/brands/losung.jpg';
  if (n.includes('shadowfax')) return '/brands/shadowfax.png';
  if (n.includes('shiprocket')) return '/brands/shiprocket.jpg';
  if (n.includes('maruti')) return '/brands/shree_maruti.jpg';
  if (n.includes('xpress')) return '/brands/xpressbees.png';
  if (n.includes('nimbus')) return '/brands/nimbuspost.png';
  return '';
};

// ─── Pill single-select dropdown — same animated-panel pattern as the "Plan"
//     dropdown above, reused for the Costing form's Courier Service/Status/
//     Shipment Type fields so every dropdown on this page behaves & looks alike. ──
interface PillOption { label: string; value: string; }
function PillSelect({ value, onChange, options, placeholder = 'Select...' }: {
  value: string; onChange: (v: string) => void; options: PillOption[]; placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectedLabel = options.find(o => o.value === value)?.label;

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full h-11 px-4 border rounded-full text-[13px] font-medium transition-all flex items-center justify-between gap-2 ${open ? 'border-[#00A86B] ring-2 ring-[#00A86B]/10 bg-white text-[#0F172A]' : 'border-[#E2E8F0] bg-white text-[#0F172A] hover:border-[#00A86B]/50'}`}
      >
        <span className={`truncate ${!selectedLabel ? 'text-[#94A3B8]' : ''}`}>{selectedLabel || placeholder}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="shrink-0 text-[#94A3B8]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="absolute top-[calc(100%+6px)] left-0 w-full bg-white border border-[#E2E8F0] rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] z-20 overflow-hidden py-1.5"
            >
              <div className="max-h-[240px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                {options.length === 0 ? (
                  <div className="px-4 py-3 text-[13px] text-[#94A3B8] font-medium">No options</div>
                ) : options.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { onChange(opt.value); setOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-[13px] transition-colors flex items-center justify-between gap-2 ${value === opt.value ? 'bg-[#F0FDF4] text-[#00A86B] font-bold' : 'text-[#475569] font-semibold hover:bg-[#F8FAFC] hover:text-[#0F172A]'}`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {value === opt.value && <CheckCircle2 className="w-4 h-4 text-[#00A86B] shrink-0" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function ciGet(obj: Record<string, any> | undefined, key: string): any {
  if (!obj || !key) return undefined;
  if (obj[key] !== undefined) return obj[key];
  const lk = key.toLowerCase().trim();
  const hit = Object.keys(obj).find(k => k.toLowerCase().trim() === lk);
  return hit !== undefined ? obj[hit] : undefined;
}

function buildRatesMap(
  _providers: any[],
  _services: any[],
  rateCards: any[]
): Record<string, Record<string, Record<string, any>>> {
  const map: Record<string, Record<string, Record<string, any>>> = {};
  rateCards.forEach((rc: any) => {
    const provKey = (rc.courierProviderName || '').trim();
    const svcKey = (rc.courierServiceName || '').trim();
    if (!rc.plan || !provKey || !svcKey) return;
    const basic = rc.weightPriceBasic?.[0] || {};
    const add = rc.weightPriceAdditional?.[0] || {};
    if (!map[rc.plan]) map[rc.plan] = {};
    if (!map[rc.plan][provKey]) map[rc.plan][provKey] = {};
    map[rc.plan][provKey][svcKey] = {
      _id: rc._id,
      isFlatRate: rc.isFlatRate || false,
      basicWeight: basic.weight != null ? String(basic.weight) : '',
      basicZoneA: basic.zoneA != null ? String(basic.zoneA) : '',
      basicZoneB: basic.zoneB != null ? String(basic.zoneB) : '',
      basicZoneC: basic.zoneC != null ? String(basic.zoneC) : '',
      basicZoneD: basic.zoneD != null ? String(basic.zoneD) : '',
      basicZoneE: basic.zoneE != null ? String(basic.zoneE) : '',
      addWeight: add.weight != null ? String(add.weight) : '',
      addZoneA: add.zoneA != null ? String(add.zoneA) : '',
      addZoneB: add.zoneB != null ? String(add.zoneB) : '',
      addZoneC: add.zoneC != null ? String(add.zoneC) : '',
      addZoneD: add.zoneD != null ? String(add.zoneD) : '',
      addZoneE: add.zoneE != null ? String(add.zoneE) : '',
      codCharge: rc.codCharge != null ? String(rc.codCharge) : '',
      codPercentage: rc.codPercent != null ? String(rc.codPercent) : '',
      status: rc.status || 'Active',
      shipmentType: rc.shipmentType || 'Forward',
    };
  });
  return map;
}

export function AdminRateCard() {
  const [activeTab, setActiveTab] = useState<'management' | 'costing'>('management');

  const [plans, setPlans] = useState<string[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);

  // ─── Applied filters (only these drive filteredProviders — set by Apply/Clear All) ──
  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedStatus, setAppliedStatus] = useState<string[]>([]);
  const [appliedType, setAppliedType] = useState<string[]>([]);

  // ─── Global search from admin header navbar ──────────────────────────────────
  const [globalSearch, setGlobalSearch] = useState('');

  const [selectedPlan, setSelectedPlan] = useState('');
  const [isPlanDropdownOpen, setIsPlanDropdownOpen] = useState(false);
  const [mobilePlanDropdownPos, setMobilePlanDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const mobilePlanTriggerRef = useRef<HTMLButtonElement>(null);
  const [expandedProviderId, setExpandedProviderId] = useState<string | null>(null);
  const [editingProviderId, setEditingProviderId] = useState<string | null>(null);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const [addPlanModal, setAddPlanModal] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [addingPlan, setAddingPlan] = useState(false);
  const [planError, setPlanError] = useState('');

  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState('');

  const emptyAddRateForm = {
    plan: '', providerName: '', serviceName: '',
    basicWeight: '', basicZoneA: '', basicZoneB: '', basicZoneC: '', basicZoneD: '', basicZoneE: '',
    addWeight: '', addZoneA: '', addZoneB: '', addZoneC: '', addZoneD: '', addZoneE: '',
    codCharge: '', codPercentage: '', isFlatRate: false, status: 'Active',
  };
  const [addRateModal, setAddRateModal] = useState(false);
  const [addRateForm, setAddRateForm] = useState(emptyAddRateForm);
  const [addRateError, setAddRateError] = useState('');
  const [addingRate, setAddingRate] = useState(false);

  const [ratesMap, setRatesMap] = useState<Record<string, Record<string, Record<string, any>>>>({});

  // ─── Costing Rate Card tab ─────────────────────────────────────────────────────
  const emptyCostingForm = {
    courierServiceId: '', status: 'Active', shipmentType: 'Forward',
    basicWeight: '', basicZoneA: '', basicZoneB: '', basicZoneC: '', basicZoneD: '', basicZoneE: '',
    addWeight: '', addZoneA: '', addZoneB: '', addZoneC: '', addZoneD: '', addZoneE: '',
    codCharge: '', codPercentage: '',
  };
  const [costingCards, setCostingCards] = useState<any[]>([]);
  const [costingLoading, setCostingLoading] = useState(false);
  const [costingForm, setCostingForm] = useState(emptyCostingForm);
  const [costingSaving, setCostingSaving] = useState(false);
  const [costingError, setCostingError] = useState('');
  const [costingSearch, setCostingSearch] = useState('');
  const [editingCostingId, setEditingCostingId] = useState<string | null>(null);
  const [deleteCostingId, setDeleteCostingId] = useState<string | null>(null);
  // Row-level expand/collapse — clicking a courier service name opens its costing
  // form inline below it, matching the Rate Card Management tab's interaction.
  const [expandedCostingServiceId, setExpandedCostingServiceId] = useState<string | null>(null);

  // Hooks must run unconditionally on every render — usePagination (which calls
  // useState internally) previously lived inside a conditional `activeTab === 'costing'
  // && (() => { ... })()` IIFE, which changed the hook count between renders and
  // crashed the whole page. Computed here at the top level instead.
  const filteredCostingServices = services.filter((s: any) => {
    const q = costingSearch.trim().toLowerCase();
    if (!q) return true;
    return (s.name || '').toLowerCase().includes(q) || (s.provider || '').toLowerCase().includes(q);
  });
  const costingPagination = usePagination({ data: filteredCostingServices, perPage: 10 });

  const fetchCostingCards = async () => {
    setCostingLoading(true);
    try {
      const res = await apiClient.get('/costingRate/getCostingRateCard');
      setCostingCards(res.data?.costingRateCards || res.data?.data || []);
    } catch {
      setCostingCards([]);
    } finally {
      setCostingLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'costing' && services.length === 0 && !loading) {
      // services are already fetched on mount for the Management tab; nothing extra needed here.
    }
    if (activeTab === 'costing') fetchCostingCards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const resetCostingForm = () => {
    setCostingForm(emptyCostingForm);
    setEditingCostingId(null);
    setCostingError('');
  };

  const handleSaveCosting = async () => {
    const svc = services.find((s: any) => s._id === costingForm.courierServiceId);
    if (!svc) { setCostingError('Please select a courier service'); return; }
    if (!costingForm.basicWeight) { setCostingError('Basic weight is required'); return; }
    if (!costingForm.addWeight) { setCostingError('Additional weight is required'); return; }

    setCostingSaving(true);
    setCostingError('');
    try {
      const payload = {
        courierServiceId: svc._id,
        courierProviderName: svc.provider,
        courierServiceName: svc.name,
        mode: svc.courierType || 'Domestic (Surface)',
        status: costingForm.status,
        shipmentType: costingForm.shipmentType,
        weightPriceBasic: [{ weight: parseFloat(costingForm.basicWeight) || 0, zoneA: parseFloat(costingForm.basicZoneA) || 0, zoneB: parseFloat(costingForm.basicZoneB) || 0, zoneC: parseFloat(costingForm.basicZoneC) || 0, zoneD: parseFloat(costingForm.basicZoneD) || 0, zoneE: parseFloat(costingForm.basicZoneE) || 0 }],
        weightPriceAdditional: [{ weight: parseFloat(costingForm.addWeight) || 0, zoneA: parseFloat(costingForm.addZoneA) || 0, zoneB: parseFloat(costingForm.addZoneB) || 0, zoneC: parseFloat(costingForm.addZoneC) || 0, zoneD: parseFloat(costingForm.addZoneD) || 0, zoneE: parseFloat(costingForm.addZoneE) || 0 }],
        codCharge: parseFloat(costingForm.codCharge) || 0,
        codPercent: parseFloat(costingForm.codPercentage) || 0,
      };
      if (editingCostingId) {
        await apiClient.put(`/costingRate/updateCostingRateCard/${editingCostingId}`, payload);
      } else {
        await apiClient.post('/costingRate/saveCostingRateCard', payload);
      }
      await fetchCostingCards();
      resetCostingForm();
      setExpandedCostingServiceId(null);
    } catch (err: any) {
      setCostingError(err?.response?.data?.message || 'Failed to save costing rate');
    } finally {
      setCostingSaving(false);
    }
  };

  const handleEditCosting = (card: any) => {
    const basic = card.weightPriceBasic?.[0] || {};
    const add = card.weightPriceAdditional?.[0] || {};
    const svc = services.find((s: any) =>
      (s.name || '').trim().toLowerCase() === (card.courierServiceName || '').trim().toLowerCase() &&
      (s.provider || '').trim().toLowerCase() === (card.courierProviderName || '').trim().toLowerCase()
    );
    setCostingForm({
      courierServiceId: svc?._id || card.courierServiceId || '',
      status: card.status || 'Active',
      shipmentType: card.shipmentType || 'Forward',
      basicWeight: basic.weight != null ? String(basic.weight) : '',
      basicZoneA: basic.zoneA != null ? String(basic.zoneA) : '',
      basicZoneB: basic.zoneB != null ? String(basic.zoneB) : '',
      basicZoneC: basic.zoneC != null ? String(basic.zoneC) : '',
      basicZoneD: basic.zoneD != null ? String(basic.zoneD) : '',
      basicZoneE: basic.zoneE != null ? String(basic.zoneE) : '',
      addWeight: add.weight != null ? String(add.weight) : '',
      addZoneA: add.zoneA != null ? String(add.zoneA) : '',
      addZoneB: add.zoneB != null ? String(add.zoneB) : '',
      addZoneC: add.zoneC != null ? String(add.zoneC) : '',
      addZoneD: add.zoneD != null ? String(add.zoneD) : '',
      addZoneE: add.zoneE != null ? String(add.zoneE) : '',
      codCharge: card.codCharge != null ? String(card.codCharge) : '',
      codPercentage: card.codPercent != null ? String(card.codPercent) : '',
    });
    setEditingCostingId(card._id);
    setCostingError('');
  };

  const handleDeleteCosting = async () => {
    if (!deleteCostingId) return;
    try {
      await apiClient.delete(`/costingRate/deleteCostingRateCard/${deleteCostingId}`);
      await fetchCostingCards();
    } catch {
      setCostingError('Failed to delete costing rate card');
    } finally {
      setDeleteCostingId(null);
    }
  };

  const filteredCostingCards = costingCards.filter((c: any) => {
    const q = costingSearch.trim().toLowerCase();
    if (!q) return true;
    return (c.courierServiceName || '').toLowerCase().includes(q) || (c.courierProviderName || '').toLowerCase().includes(q);
  });

  /** Finds an existing costing card for a given courier service, if any. */
  const findCostingCardForService = (svc: any) =>
    costingCards.find((c: any) =>
      (c.courierServiceName || '').trim().toLowerCase() === (svc.name || '').trim().toLowerCase() &&
      (c.courierProviderName || '').trim().toLowerCase() === (svc.provider || '').trim().toLowerCase()
    );

  /** Click a courier service row — toggles its inline costing form open/closed,
   *  pre-filling from an existing costing card when one is already saved. */
  const toggleCostingRow = (svc: any) => {
    if (expandedCostingServiceId === svc._id) {
      setExpandedCostingServiceId(null);
      resetCostingForm();
      return;
    }
    const existing = findCostingCardForService(svc);
    if (existing) {
      handleEditCosting(existing);
    } else {
      setCostingForm({ ...emptyCostingForm, courierServiceId: svc._id });
      setEditingCostingId(null);
      setCostingError('');
    }
    setExpandedCostingServiceId(svc._id);
  };

  // ─── Global search listener (navbar search bar) ──────────────────────────────
  useEffect(() => {
    const handleSearch = (e: Event) => {
      const q = ((e as CustomEvent).detail || '').toLowerCase();
      setGlobalSearch(q);
    };
    window.addEventListener('admin-search', handleSearch);
    setGlobalSearch(((window as any).__adminSearchQuery || '').toLowerCase());
    return () => window.removeEventListener('admin-search', handleSearch);
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const [plansRes, providersRes, servicesRes, rateCardsRes] = await Promise.allSettled([
        apiClient.get('/saveRate/getPlanNames'),
        apiClient.get('/allCourier/couriers'),
        apiClient.get('/courierServices/couriers'),
        apiClient.get('/saveRate/getRateCard'),
      ]);

      const fetchedProviders: any[] = providersRes.status === 'fulfilled' && Array.isArray(providersRes.value.data)
        ? providersRes.value.data : [];
      const fetchedServices: any[] = servicesRes.status === 'fulfilled' && Array.isArray(servicesRes.value.data)
        ? servicesRes.value.data : [];
      const fetchedCards: any[] = rateCardsRes.status === 'fulfilled'
        ? (rateCardsRes.value.data.rateCards || []) : [];

      const namedPlans: string[] = plansRes.status === 'fulfilled'
        ? (plansRes.value.data.planNames || []) : [];
      const cardPlans: string[] = [...new Set(fetchedCards.map((rc: any) => rc.plan).filter(Boolean))] as string[];
      const fetchedPlans: string[] = [...new Set([...cardPlans, ...namedPlans])];

      setPlans(fetchedPlans);
      setProviders(fetchedProviders);
      setServices(fetchedServices);
      if (fetchedPlans.length > 0) setSelectedPlan(fetchedPlans[0]);
      setRatesMap(buildRatesMap(fetchedProviders, fetchedServices, fetchedCards));
      setLoading(false);
    };
    init();
  }, []);

  const servicesGrouped = services.reduce((acc: Record<string, any[]>, svc: any) => {
    const key = svc.provider;
    if (!acc[key]) acc[key] = [];
    acc[key].push(svc);
    return acc;
  }, {});

  const handleRateChange = (provKey: string, svcKey: string, field: string, value: any) => {
    setRatesMap(prev => {
      const planRates = prev[selectedPlan] || {};
      const storedProvKey = Object.keys(planRates).find(k => k.toLowerCase().trim() === provKey.toLowerCase().trim()) ?? provKey;
      const providerRates = planRates[storedProvKey] || {};
      const storedSvcKey = Object.keys(providerRates).find(k => k.toLowerCase().trim() === svcKey.toLowerCase().trim()) ?? svcKey;
      const serviceRates = providerRates[storedSvcKey] || {};
      let updated = { ...serviceRates, [field]: value };
      if (field === 'isFlatRate' && value === true) {
        updated.codCharge = '0';
        updated.codPercentage = '0';
      }
      return {
        ...prev,
        [selectedPlan]: {
          ...planRates,
          [storedProvKey]: { ...providerRates, [storedSvcKey]: updated },
        },
      };
    });
  };

  const handleSaveRates = async (provider: any) => {
    if (!selectedPlan) { setSaveError('Please select a plan first'); return; }
    const provKey = (provider.courierName || provider.courierProvider || '').trim();
    const providerRates = ciGet(ratesMap[selectedPlan], provKey) || {};
    const providerServices: any[] = servicesGrouped[provider.courierName] || servicesGrouped[provider.courierProvider] || [];

    setSavingId(provider._id);
    setSaveError('');

    try {
      const saves = providerServices
        .filter((svc: any) => {
          const r = ciGet(providerRates, (svc.name || '').trim()) || {};
          return r.basicWeight !== '' && r.basicWeight != null;
        })
        .map(async (svc: any) => {
          const r = ciGet(providerRates, (svc.name || '').trim()) || {};
          const payload = {
            plan: selectedPlan,
            courierProviderName: svc.provider,
            courierServiceName: svc.name,
            mode: svc.courierType || 'Domestic (Surface)',
            status: r.status || 'Active',
            shipmentType: r.shipmentType || 'Forward',
            isFlatRate: r.isFlatRate || false,
            weightPriceBasic: [{ weight: parseFloat(r.basicWeight)||0, zoneA: parseFloat(r.basicZoneA)||0, zoneB: parseFloat(r.basicZoneB)||0, zoneC: parseFloat(r.basicZoneC)||0, zoneD: parseFloat(r.basicZoneD)||0, zoneE: parseFloat(r.basicZoneE)||0 }],
            weightPriceAdditional: [{ weight: parseFloat(r.addWeight)||0, zoneA: parseFloat(r.addZoneA)||0, zoneB: parseFloat(r.addZoneB)||0, zoneC: parseFloat(r.addZoneC)||0, zoneD: parseFloat(r.addZoneD)||0, zoneE: parseFloat(r.addZoneE)||0 }],
            codPercent: parseFloat(r.codPercentage) || 0,
            codCharge: parseFloat(r.codCharge) || 0,
          };
          if (r._id) return apiClient.put(`/saveRate/updateRateCard/${r._id}`, payload);
          return apiClient.post('/saveRate/saveB2CRate', payload);
        });

      await Promise.all(saves);
      const fresh = await apiClient.get('/saveRate/getRateCard');
      const freshCards: any[] = fresh.data.rateCards || [];
      setRatesMap(buildRatesMap(providers, services, freshCards));
      setEditingProviderId(null);
      setExpandedProviderId(null);
    } catch (err: any) {
      setSaveError(err?.response?.data?.message || 'Failed to save rates');
    } finally {
      setSavingId(null);
    }
  };

  const handleAddPlan = async () => {
    if (!newPlanName.trim()) { setPlanError('Plan name is required'); return; }
    setAddingPlan(true);
    setPlanError('');
    try {
      await apiClient.post('/saveRate/createPlanName', { planName: newPlanName.trim() });
      const res = await apiClient.get('/saveRate/getPlanNames');
      const namedPlans: string[] = res.data.planNames || [];
      const cardPlans = [...new Set(Object.keys(ratesMap))] as string[];
      setPlans([...new Set([...cardPlans, ...namedPlans])]);
      setNewPlanName('');
      setAddPlanModal(false);
    } catch (err: any) {
      setPlanError(err?.response?.data?.message || 'Failed to create plan');
    } finally {
      setAddingPlan(false);
    }
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    setUploadSuccess('');
    setSaveError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      await apiClient.post('/saveRate/uploadRatecard', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const fresh = await apiClient.get('/saveRate/getRateCard');
      const freshCards: any[] = fresh.data.rateCards || [];
      setRatesMap(buildRatesMap(providers, services, freshCards));
      setUploadSuccess('Rate card uploaded successfully!');
      setTimeout(() => setUploadSuccess(''), 4000);
    } catch (err: any) {
      setSaveError(err?.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await apiClient.get('/saveRate/download-excel', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'rate-card-template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setSaveError('Failed to download template');
    }
  };

  const handleAddRateCard = async () => {
    if (!addRateForm.plan || !addRateForm.providerName || !addRateForm.serviceName) {
      setAddRateError('Plan, provider, and service are required');
      return;
    }
    setAddingRate(true);
    setAddRateError('');
    try {
      const svc = services.find((s: any) => s.name === addRateForm.serviceName);
      const payload = {
        plan: addRateForm.plan,
        courierProviderName: addRateForm.providerName,
        courierServiceName: addRateForm.serviceName,
        mode: svc?.courierType || 'Domestic (Surface)',
        status: addRateForm.status,
        shipmentType: 'Forward',
        isFlatRate: addRateForm.isFlatRate,
        weightPriceBasic: [{ weight: parseFloat(addRateForm.basicWeight)||0, zoneA: parseFloat(addRateForm.basicZoneA)||0, zoneB: parseFloat(addRateForm.basicZoneB)||0, zoneC: parseFloat(addRateForm.basicZoneC)||0, zoneD: parseFloat(addRateForm.basicZoneD)||0, zoneE: parseFloat(addRateForm.basicZoneE)||0 }],
        weightPriceAdditional: [{ weight: parseFloat(addRateForm.addWeight)||0, zoneA: parseFloat(addRateForm.addZoneA)||0, zoneB: parseFloat(addRateForm.addZoneB)||0, zoneC: parseFloat(addRateForm.addZoneC)||0, zoneD: parseFloat(addRateForm.addZoneD)||0, zoneE: parseFloat(addRateForm.addZoneE)||0 }],
        codPercent: parseFloat(addRateForm.codPercentage)||0,
        codCharge: parseFloat(addRateForm.codCharge)||0,
      };
      await apiClient.post('/saveRate/saveB2CRate', payload);
      const fresh = await apiClient.get('/saveRate/getRateCard');
      setRatesMap(buildRatesMap(providers, services, fresh.data.rateCards || []));
      setAddRateModal(false);
    } catch (err: any) {
      setAddRateError(err?.response?.data?.message || 'Failed to save rate card');
    } finally {
      setAddingRate(false);
    }
  };

  // ─── Apply / reset filters ──────────────────────────────────────────────────
  const applyFilters = () => {
    setAppliedSearch(searchQuery);
    setAppliedStatus(statusFilter);
    setAppliedType(typeFilter);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter([]);
    setTypeFilter([]);
    setAppliedSearch('');
    setAppliedStatus([]);
    setAppliedType([]);
  };

  const hasActiveFilters = !!(searchQuery || statusFilter.length || typeFilter.length);

  const filteredProviders = providers.filter(p => {
    const search = globalSearch || appliedSearch;
    const matchesSearch = (p.courierName || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      appliedStatus.length === 0 ||
      (appliedStatus.includes('Active') && p.status === 'Enable') ||
      (appliedStatus.includes('Inactive') && p.status === 'Disable');
    const provSvcs: any[] = servicesGrouped[p.courierName] || servicesGrouped[p.courierProvider] || [];
    const matchesType =
      appliedType.length === 0 ||
      (appliedType.includes('Domestic (Surface)') && provSvcs.some((s: any) => (s.courierType || '').toLowerCase().includes('surface'))) ||
      (appliedType.includes('Domestic (Air)') && provSvcs.some((s: any) => (s.courierType || '').toLowerCase().includes('air')));
    return matchesSearch && matchesStatus && matchesType;
  });

  const Spinner = () => (
    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  );

  const RoText = ({ val, prefix = '', suffix = '' }: { val?: string; prefix?: string; suffix?: string }) =>
    val ? <span className="text-[13px] font-semibold text-[#0F172A]">{prefix}{val}{suffix}</span>
         : <span className="text-[#CBD5E1] text-[13px]">—</span>;

  return (
    <AdminLayout>
      <div className="flex flex-col h-[calc(100vh-72px)] -m-4 md:-m-6 bg-white">
        <div className="bg-white relative z-50 shrink-0">

        {/* Header Tabs */}
        <div className="hidden md:block px-4 md:px-6 py-2 border-b border-[#E2E8F0]">
          <div className="flex gap-1 items-center bg-[#F7FEFC] rounded-full p-1.5 w-fit overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('management')}
              className={`px-4 py-2 text-[13px] font-bold rounded-full whitespace-nowrap transition-colors ${activeTab === 'management' ? 'text-[#00A86B] underline underline-offset-4 decoration-2' : 'text-[#64748B] hover:text-[#0F172A]'}`}
            >
              Rate Card Management
            </button>
            <button
              onClick={() => setActiveTab('costing')}
              className={`px-4 py-2 text-[13px] font-bold rounded-full whitespace-nowrap transition-colors ${activeTab === 'costing' ? 'text-[#00A86B] underline underline-offset-4 decoration-2' : 'text-[#64748B] hover:text-[#0F172A]'}`}
            >
              Costing Rate Card
            </button>
          </div>
        </div>

        {/* Mobile Tabs */}
        <div className="md:hidden px-3 py-2 border-b border-[#E2E8F0] bg-white">
          <div className="flex gap-1 items-center bg-[#F7FEFC] rounded-full p-1.5">
            <button
              onClick={() => setActiveTab('management')}
              className={`flex-1 px-3 py-2 text-[12.5px] font-bold rounded-full whitespace-nowrap transition-colors ${activeTab === 'management' ? 'text-[#00A86B] bg-white shadow-sm' : 'text-[#64748B]'}`}
            >
              Rate Card
            </button>
            <button
              onClick={() => setActiveTab('costing')}
              className={`flex-1 px-3 py-2 text-[12.5px] font-bold rounded-full whitespace-nowrap transition-colors ${activeTab === 'costing' ? 'text-[#00A86B] bg-white shadow-sm' : 'text-[#64748B]'}`}
            >
              Costing Rate Card
            </button>
          </div>
        </div>

        {activeTab === 'management' && <>
        {uploadSuccess && (
          <div className="mx-4 md:mx-6 mt-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-600 font-medium">
            {uploadSuccess}
          </div>
        )}
        {saveError && (
          <div className="mx-4 md:mx-6 mt-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium flex items-center justify-between gap-2">
            <span>{saveError}</span>
            <button onClick={() => setSaveError('')}><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Filters & Actions — desktop */}
        <div className="hidden md:flex py-3 px-6 border-b border-[#CBD5F5] flex-wrap items-center gap-3 bg-[#F8FAFC]/50">
          <input
            type="text"
            placeholder="Search by courier name"
            className="glass-search-input w-[220px] shrink-0"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
          />

          <GlassDropdown
            label="Status"
            options={STATUS_OPTIONS}
            selected={statusFilter}
            onChange={setStatusFilter}
            placeholder="Search status..."
            icon={<CheckCircle2 className="w-3.5 h-3.5" />}
          />

          <GlassDropdown
            label="Type"
            options={TYPE_OPTIONS}
            selected={typeFilter}
            onChange={setTypeFilter}
            placeholder="Search type..."
            icon={<Truck className="w-3.5 h-3.5" />}
          />

          {/* Plan Dropdown */}
          <div className="relative min-w-[220px] shrink-0">
            <button
              onClick={() => setIsPlanDropdownOpen(!isPlanDropdownOpen)}
              className={`w-full h-9 px-4 border rounded-full text-xs font-bold transition-all flex items-center justify-between ${isPlanDropdownOpen ? 'border-[#00A86B] ring-1 ring-[#00A86B]/20 bg-white text-[#00A86B]' : 'border-[#E2E8F0] bg-white text-[#0F172A] hover:border-[#00A86B] hover:text-[#00A86B]'}`}
            >
              <span className="truncate pr-2">{selectedPlan || 'Select Plan'}</span>
              <motion.div animate={{ rotate: isPlanDropdownOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </motion.div>
            </button>
            <AnimatePresence>
              {isPlanDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsPlanDropdownOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="absolute top-[calc(100%+8px)] left-0 w-full bg-white border border-[#E2E8F0] rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] z-20 overflow-hidden py-1.5"
                  >
                    <div className="max-h-[280px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                      {plans.map(plan => (
                        <button key={plan} onClick={() => { setSelectedPlan(plan); setIsPlanDropdownOpen(false); }}
                          className={`w-full text-left px-4 py-2.5 text-[13px] transition-colors flex items-center justify-between ${selectedPlan === plan ? 'bg-[#F0FDF4] text-[#00A86B] font-bold' : 'text-[#475569] font-semibold hover:bg-[#F8FAFC] hover:text-[#0F172A]'}`}>
                          <span className="truncate">{plan}</span>
                          {selectedPlan === plan && <svg className="w-4 h-4 text-[#00A86B] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={applyFilters}
            className="py-2 px-4 shrink-0 rounded-[32px] bg-[#009D64] border border-[#009D64] text-white text-xs font-medium leading-[18px] hover:bg-[#008a57] transition-colors cursor-pointer"
          >
            Apply Filters
          </button>

          {hasActiveFilters && (
            <button onClick={resetFilters}
              className="py-2 px-4 shrink-0 rounded-[32px] border border-red-200 text-red-500 text-xs font-medium leading-[18px] hover:bg-red-50 transition-colors cursor-pointer">
              Clear All
            </button>
          )}

          <div className="ml-auto flex items-center gap-2 flex-wrap">
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-1.5 h-9 px-4 shrink-0 rounded-full border border-[#E2E8F0] bg-white text-[#475569] text-xs font-bold hover:bg-[#F8FAFC] transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" /> Template
            </button>
            <label className={`flex items-center gap-1.5 h-9 px-4 shrink-0 rounded-full border border-[#E2E8F0] bg-white text-[#475569] text-xs font-bold hover:bg-[#F8FAFC] transition-colors shadow-sm cursor-pointer ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
              {uploading ? <><Spinner /> Uploading...</> : <><Upload className="w-3.5 h-3.5" /> Upload</>}
              <input
                ref={uploadInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                disabled={uploading}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) { handleUpload(f); e.target.value = ''; } }}
              />
            </label>
            <button
              onClick={() => { setNewPlanName(''); setPlanError(''); setAddPlanModal(true); }}
              className="flex items-center gap-1.5 h-9 px-4 shrink-0 rounded-full border border-[#00A86B] text-[#00A86B] text-xs font-bold hover:bg-[#F0FDF4] transition-colors shadow-sm bg-white"
            >
              <Plus className="w-3.5 h-3.5" /> Add Plan
            </button>
            <button
              onClick={() => { setAddRateForm({ ...emptyAddRateForm, plan: selectedPlan || plans[0] || '' }); setAddRateError(''); setAddRateModal(true); }}
              className="flex items-center gap-1.5 h-9 px-4 shrink-0 rounded-full bg-[#00A86B] text-white text-xs font-bold hover:bg-[#009B63] transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Add Rate Card
            </button>
          </div>
        </div>

        {/* Search + Filter — mobile (matches Orders page) */}
        <div className="md:hidden relative z-[60] px-3 py-2.5 border-b border-[#E2E8F0] flex items-center gap-2 bg-white shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Search by courier name"
              className="w-full h-9 pl-9 pr-3 rounded-full border border-[#E2E8F0] bg-[#F8FAFC] text-sm outline-none focus:border-[#00A86B] focus:ring-2 focus:ring-[#00A86B]/10 text-[#0F172A] placeholder:text-[#94A3B8] transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            />
          </div>
          <button
            onClick={() => setIsMobileFiltersOpen(true)}
            className="w-9 h-9 rounded-full border border-[#E2E8F0] flex items-center justify-center text-[#475569] bg-white shrink-0"
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>

        {/* Actions — mobile, icon-only circular buttons */}
        <div className="md:hidden px-3 py-2.5 border-b border-[#E2E8F0] flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button onClick={handleDownloadTemplate} title="Download Template"
            className="w-9 h-9 rounded-full border border-[#E2E8F0] bg-white text-[#475569] flex items-center justify-center shrink-0">
            <Download className="w-4 h-4" />
          </button>
          <label title="Upload Rate Card" className={`w-9 h-9 rounded-full border border-[#E2E8F0] bg-white text-[#475569] flex items-center justify-center shrink-0 cursor-pointer ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
            {uploading ? <Spinner /> : <Upload className="w-4 h-4" />}
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" disabled={uploading}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) { handleUpload(f); e.target.value = ''; } }} />
          </label>
          <button onClick={() => { setNewPlanName(''); setPlanError(''); setAddPlanModal(true); }} title="Add Plan"
            className="w-9 h-9 rounded-full border border-[#00A86B] text-[#00A86B] bg-white flex items-center justify-center shrink-0">
            <Plus className="w-4 h-4" />
          </button>
          <button onClick={() => { setAddRateForm({ ...emptyAddRateForm, plan: selectedPlan || plans[0] || '' }); setAddRateError(''); setAddRateModal(true); }} title="Add Rate Card"
            className="w-9 h-9 rounded-full bg-[#00A86B] text-white flex items-center justify-center shrink-0 shadow-sm">
            <Plus className="w-4 h-4" />
          </button>
          <div className="relative min-w-[130px] shrink-0">
            <button
              ref={mobilePlanTriggerRef}
              onClick={() => {
                if (!isPlanDropdownOpen && mobilePlanTriggerRef.current) {
                  const r = mobilePlanTriggerRef.current.getBoundingClientRect();
                  setMobilePlanDropdownPos({ top: r.bottom + 8, left: r.left, width: r.width });
                }
                setIsPlanDropdownOpen(!isPlanDropdownOpen);
              }}
              className={`w-full h-9 px-3 border rounded-full text-[11px] font-bold transition-all flex items-center justify-between gap-1 ${isPlanDropdownOpen ? 'border-[#00A86B] ring-1 ring-[#00A86B]/20 bg-white text-[#00A86B]' : 'border-[#E2E8F0] bg-white text-[#0F172A]'}`}>
              <span className="truncate">{selectedPlan || 'Select Plan'}</span>
              <motion.div animate={{ rotate: isPlanDropdownOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="shrink-0">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </motion.div>
            </button>
            {isPlanDropdownOpen && mobilePlanDropdownPos && createPortal(
              <AnimatePresence>
                <div className="fixed inset-0 z-[140]" onClick={() => setIsPlanDropdownOpen(false)} />
                <motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} transition={{ duration: 0.15 }}
                  style={{
                    position: 'fixed',
                    top: mobilePlanDropdownPos.top,
                    left: Math.max(8, Math.min(mobilePlanDropdownPos.left, window.innerWidth - 220)),
                    width: 210,
                  }}
                  className="bg-white border border-[#E2E8F0] rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] z-[141] overflow-hidden py-1.5">
                  <div className="max-h-[280px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                    {plans.map(plan => (
                      <button key={plan} onClick={() => { setSelectedPlan(plan); setIsPlanDropdownOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-[13px] transition-colors flex items-center justify-between ${selectedPlan === plan ? 'bg-[#F0FDF4] text-[#00A86B] font-bold' : 'text-[#475569] font-semibold hover:bg-[#F8FAFC]'}`}>
                        <span className="truncate">{plan}</span>
                        {selectedPlan === plan && <svg className="w-4 h-4 text-[#00A86B] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>}
                      </button>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>,
              document.body
            )}
          </div>
        </div>
        </>}
        </div>

        {/* Desktop Table */}
        {activeTab === 'management' && <div className="hidden md:flex bg-white flex-col flex-1 min-h-0 overflow-hidden border-t border-[#E2E8F0]">
          <div className="flex-1 overflow-y-auto overflow-x-hidden w-full relative">
          {loading && <TableLoader />}
          <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-20 bg-[#E6F9F2] shadow-sm">
                <tr className="border-b border-[#E2E8F0]">
                  <th className="py-2 px-3 text-xs font-medium text-[#64748B] uppercase tracking-wider w-20 rounded-l-lg">
                    <div className="flex items-center gap-1.5"><Hash className="w-3.5 h-3.5 shrink-0" /><span>S.NO.</span></div>
                  </th>
                  <th className="py-2 px-3 text-xs font-medium text-[#64748B] uppercase tracking-wider">
                    <div className="flex items-center gap-1.5"><Truck className="w-3.5 h-3.5 shrink-0" /><span>COURIER NAME</span></div>
                  </th>
                  <th className="py-2 px-3 text-xs font-medium text-[#64748B] uppercase tracking-wider text-center">
                    <div className="flex items-center justify-center gap-1.5"><Filter className="w-3.5 h-3.5 shrink-0" /><span>TYPE</span></div>
                  </th>
                  <th className="py-2 px-3 text-xs font-medium text-[#64748B] uppercase tracking-wider text-center">
                    <div className="flex items-center justify-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /><span>STATUS</span></div>
                  </th>
                  <th className="py-2 px-3 text-xs font-medium text-[#64748B] uppercase tracking-wider text-right rounded-r-lg">
                    <div className="flex items-center justify-end gap-1.5"><Layers className="w-3.5 h-3.5 shrink-0" /><span>SERVICES COUNT</span></div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? null : filteredProviders.length > 0 ? (
                  filteredProviders.map((provider, index) => {
                    const isExpanded = expandedProviderId === provider._id;
                    const isEditing = editingProviderId === provider._id;
                    const items: any[] = servicesGrouped[provider.courierName] || servicesGrouped[provider.courierProvider] || [];
                    const logo = getProviderLogo(provider.courierName);

                    return (
                      <React.Fragment key={provider._id}>
                        <tr
                          className={`border-b border-[#E2E8F0] transition-colors cursor-pointer ${isExpanded ? 'bg-[#F8FAFC]' : index % 2 === 0 ? 'bg-white' : 'bg-[#E6EDF7]/20'}`}
                          onClick={() => { setExpandedProviderId(isExpanded ? null : provider._id); setEditingProviderId(null); }}
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-semibold text-[#64748B]">{index + 1}</span>
                              <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90 text-[#00A86B]' : 'text-[#CBD5E1]'}`} />
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-5">
                              <div className="w-[60px] h-[60px] bg-white border border-[#E2E8F0] rounded-2xl p-2.5 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                                {logo ? (
                                  <img src={logo} alt={provider.courierName} className="max-w-full max-h-full object-contain"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-[15px] font-bold text-[#94A3B8]">${provider.courierName.charAt(0)}</span>`; }} />
                                ) : (
                                  <span className="text-[15px] font-bold text-[#94A3B8]">{provider.courierName.charAt(0)}</span>
                                )}
                              </div>
                              <div className="text-[15px] font-extrabold text-[#0F172A]">{provider.courierName}</div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className="px-3 py-1 bg-[#F1F5F9] text-[#475569] rounded-full text-xs font-bold">Domestic</span>
                          </td>
                          <td className="py-4 px-6" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-center">
                              <span className={`text-sm font-bold ${provider.status === 'Enable' ? 'text-[#00A86B]' : 'text-[#94A3B8]'}`}>{provider.status}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex justify-end pr-4 text-sm font-semibold text-[#64748B]">
                              {items.length} {items.length === 1 ? 'Service' : 'Services'}
                            </div>
                          </td>
                        </tr>

                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                              <td colSpan={5} className="p-0">
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                  transition={{ type: 'spring', stiffness: 350, damping: 30, mass: 0.8 }} className="overflow-hidden">
                                  <div className="py-6 px-8">
                                    <div className="bg-white rounded-[20px] border border-[#E2E8F0] p-7 shadow-[0_2px_16px_rgba(0,0,0,0.02)]">
                                      {!selectedPlan ? (
                                        <p className="text-sm text-[#94A3B8] font-semibold text-center py-4">Please select a plan from the dropdown above.</p>
                                      ) : items.length > 0 ? (
                                        <div className="rounded-2xl overflow-hidden border border-[#E2E8F0] shadow-sm bg-white">
                                          {/* Panel header */}
                                          <div className="flex items-center justify-between px-5 py-3 bg-[#F8FAFC] border-b border-[#E2E8F0]">
                                            <span className="text-[12px] font-bold text-[#64748B] uppercase tracking-wider">Rate Card — {selectedPlan}</span>
                                            {!isEditing && (
                                              <button
                                                onClick={(e) => { e.stopPropagation(); setEditingProviderId(provider._id); }}
                                                className="flex items-center gap-1.5 h-8 px-4 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0] text-[#475569] text-[12px] font-bold hover:bg-[#E2E8F0] transition-all"
                                              >
                                                <Edit2 className="w-3.5 h-3.5" /> Edit
                                              </button>
                                            )}
                                          </div>
                                          <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse min-w-[1000px]">
                                              <thead>
                                                <tr className="bg-[#E6F9F2] border-b border-[#E2E8F0]">
                                                  <th className="py-2 px-3 text-xs font-medium text-[#64748B] uppercase tracking-wider rounded-l-lg">Courier Service</th>
                                                  <th className="py-2 px-3 text-xs font-medium text-[#64748B] uppercase tracking-wider">Mode</th>
                                                  <th className="py-2 px-3 text-xs font-medium text-[#64748B] uppercase tracking-wider">Weight (gm)</th>
                                                  <th className="py-2 px-3 text-xs font-medium text-[#64748B] uppercase tracking-wider">Zone A</th>
                                                  <th className="py-2 px-3 text-xs font-medium text-[#64748B] uppercase tracking-wider">Zone B</th>
                                                  <th className="py-2 px-3 text-xs font-medium text-[#64748B] uppercase tracking-wider">Zone C</th>
                                                  <th className="py-2 px-3 text-xs font-medium text-[#64748B] uppercase tracking-wider">Zone D</th>
                                                  <th className="py-2 px-3 text-xs font-medium text-[#64748B] uppercase tracking-wider">Zone E</th>
                                                  <th className="py-2 px-3 text-xs font-medium text-[#64748B] uppercase tracking-wider">COD</th>
                                                  <th className="py-2 px-3 text-xs font-medium text-[#64748B] uppercase tracking-wider rounded-r-lg">Status</th>
                                                </tr>
                                              </thead>
                                              <tbody className="divide-y divide-[#E2E8F0]">
                                                {items.map((svc: any) => {
                                                  const pKey = (provider.courierName || provider.courierProvider || '').trim();
                                                  const sKey = (svc.name || '').trim();
                                                  const r = ciGet(ciGet(ratesMap[selectedPlan], pKey), sKey) || {};
                                                  return (
                                                    <React.Fragment key={svc._id}>
                                                      <tr className="hover:bg-[#F8FAFC]/50 transition-colors">
                                                        <td className="py-4 px-5" rowSpan={2} style={{ verticalAlign: 'top', paddingTop: '1.25rem' }}>
                                                          <div className="font-bold text-[13px] text-[#0F172A]">{svc.name}</div>
                                                          {r._id && <div className="text-[10px] text-[#00A86B] mt-1 font-semibold">● Saved</div>}
                                                          <div className="mt-3 flex items-center gap-2">
                                                            {isEditing ? (
                                                              <button type="button" onClick={() => handleRateChange(pKey, sKey, 'isFlatRate', !r.isFlatRate)}
                                                                className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors ${r.isFlatRate ? 'bg-[#00A86B]' : 'bg-[#CBD5E1]'}`}>
                                                                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${r.isFlatRate ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                                                              </button>
                                                            ) : (
                                                              <span className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full ${r.isFlatRate ? 'bg-[#00A86B]' : 'bg-[#CBD5E1]'}`}>
                                                                <span className={`inline-block h-3 w-3 rounded-full bg-white ${r.isFlatRate ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                                                              </span>
                                                            )}
                                                            <span className="text-[11px] font-semibold text-[#64748B] whitespace-nowrap">Flat Rate?</span>
                                                          </div>
                                                        </td>
                                                        <td className="py-4 px-5 text-[13px] text-[#64748B] font-medium" rowSpan={2} style={{ verticalAlign: 'top', paddingTop: '1.25rem' }}>
                                                          {svc.courierType || 'Surface'}
                                                        </td>
                                                        <td className="py-3 px-5">
                                                          <div className="flex items-center gap-2">
                                                            <span className="text-[12px] font-bold text-[#64748B] w-10">Basic:</span>
                                                            {isEditing
                                                              ? <input type="number" value={r.basicWeight || ''} onChange={(e) => handleRateChange(pKey, sKey, 'basicWeight', e.target.value)} className="w-16 h-8 px-2 bg-white border border-[#E2E8F0] rounded-md text-[13px] font-semibold text-[#0F172A] focus:border-[#00A86B] focus:outline-none" placeholder="0" />
                                                              : <RoText val={r.basicWeight} />}
                                                          </div>
                                                        </td>
                                                        {(['basicZoneA','basicZoneB','basicZoneC','basicZoneD','basicZoneE'] as const).map(field => (
                                                          <td key={field} className="py-3 px-5">
                                                            {isEditing
                                                              ? <div className="relative"><span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-[#94A3B8]">₹</span><input type="number" value={r[field] || ''} onChange={(e) => handleRateChange(pKey, sKey, field, e.target.value)} className="w-[72px] h-8 pl-6 pr-2 bg-white border border-[#E2E8F0] rounded-md text-[13px] font-semibold text-[#0F172A] focus:border-[#00A86B] focus:outline-none" /></div>
                                                              : <RoText val={r[field]} prefix="₹" />}
                                                          </td>
                                                        ))}
                                                        <td className="py-3 px-5">
                                                          {isEditing
                                                            ? <input type="number" placeholder="COD ₹" value={r.codCharge || ''} disabled={r.isFlatRate} onChange={(e) => handleRateChange(pKey, sKey, 'codCharge', e.target.value)} className={`w-[72px] h-8 px-2 bg-white border border-[#E2E8F0] rounded-md text-[13px] font-semibold text-[#0F172A] focus:border-[#00A86B] focus:outline-none ${r.isFlatRate ? 'opacity-50 cursor-not-allowed' : ''}`} />
                                                            : <RoText val={r.codCharge} prefix="₹" />}
                                                        </td>
                                                        <td className="py-4 px-5" rowSpan={2} style={{ verticalAlign: 'top', paddingTop: '1.25rem' }}>
                                                          {isEditing ? (
                                                            <select value={r.status || 'Active'} onChange={(e) => handleRateChange(pKey, sKey, 'status', e.target.value)}
                                                              className="h-8 px-2 bg-white border border-[#E2E8F0] rounded-md text-[13px] font-semibold text-[#0F172A] focus:border-[#00A86B] focus:outline-none appearance-none">
                                                              <option value="Active">Active</option>
                                                              <option value="Inactive">Inactive</option>
                                                            </select>
                                                          ) : (
                                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${(r.status || 'Active') === 'Active' ? 'bg-[#F0FDF4] text-[#00A86B]' : 'bg-[#FEF2F2] text-[#EF4444]'}`}>
                                                              {r.status || 'Active'}
                                                            </span>
                                                          )}
                                                        </td>
                                                      </tr>
                                                      <tr className="hover:bg-[#F8FAFC]/50 transition-colors">
                                                        <td className="py-3 px-5 pb-5">
                                                          <div className="flex items-center gap-2">
                                                            <span className="text-[12px] font-bold text-[#64748B] w-10">Add:</span>
                                                            {isEditing
                                                              ? <input type="number" value={r.addWeight || ''} onChange={(e) => handleRateChange(pKey, sKey, 'addWeight', e.target.value)} className="w-16 h-8 px-2 bg-white border border-[#E2E8F0] rounded-md text-[13px] font-semibold text-[#0F172A] focus:border-[#00A86B] focus:outline-none" placeholder="0" />
                                                              : <RoText val={r.addWeight} />}
                                                          </div>
                                                        </td>
                                                        {(['addZoneA','addZoneB','addZoneC','addZoneD','addZoneE'] as const).map(field => (
                                                          <td key={field} className="py-3 px-5 pb-5">
                                                            {isEditing
                                                              ? <div className="relative"><span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-[#94A3B8]">₹</span><input type="number" value={r[field] || ''} onChange={(e) => handleRateChange(pKey, sKey, field, e.target.value)} className="w-[72px] h-8 pl-6 pr-2 bg-white border border-[#E2E8F0] rounded-md text-[13px] font-semibold text-[#0F172A] focus:border-[#00A86B] focus:outline-none" /></div>
                                                              : <RoText val={r[field]} prefix="₹" />}
                                                          </td>
                                                        ))}
                                                        <td className="py-3 px-5 pb-5">
                                                          {isEditing
                                                            ? <input type="number" placeholder="COD %" value={r.codPercentage || ''} disabled={r.isFlatRate} onChange={(e) => handleRateChange(pKey, sKey, 'codPercentage', e.target.value)} className={`w-[72px] h-8 px-2 bg-white border border-[#E2E8F0] rounded-md text-[13px] font-semibold text-[#0F172A] focus:border-[#00A86B] focus:outline-none ${r.isFlatRate ? 'opacity-50 cursor-not-allowed' : ''}`} />
                                                            : <RoText val={r.codPercentage} suffix="%" />}
                                                        </td>
                                                      </tr>
                                                    </React.Fragment>
                                                  );
                                                })}
                                              </tbody>
                                            </table>
                                          </div>
                                          <div className="flex justify-end gap-4 p-5 bg-[#F8FAFC] border-t border-[#E2E8F0]">
                                            {isEditing ? (
                                              <>
                                                <button onClick={() => setEditingProviderId(null)}
                                                  className="px-6 h-9 rounded-full font-bold text-[13px] text-[#475569] border border-[#CBD5E1] bg-white hover:bg-[#F1F5F9] transition-all shadow-sm">
                                                  Cancel
                                                </button>
                                                <button onClick={() => handleSaveRates(provider)} disabled={savingId === provider._id}
                                                  className="px-6 h-9 rounded-full font-bold text-[13px] text-white bg-[#00A86B] hover:bg-[#009B63] shadow-sm transition-all flex items-center gap-2 disabled:opacity-60">
                                                  {savingId === provider._id ? <><Spinner /> Saving...</> : <><Save className="w-4 h-4" /> Save Configuration</>}
                                                </button>
                                              </>
                                            ) : (
                                              <button onClick={() => setExpandedProviderId(null)}
                                                className="px-6 h-9 rounded-full font-bold text-[13px] text-[#475569] border border-[#CBD5E1] bg-white hover:bg-[#F1F5F9] transition-all shadow-sm">
                                                Close
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="text-center py-10 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0]">
                                          <p className="text-sm font-semibold text-[#94A3B8]">No services configured for this courier yet.</p>
                                          <p className="text-xs text-[#94A3B8] mt-1">Please add services in the Courier Management page first.</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </motion.div>
                              </td>
                            </tr>
                          )}
                        </AnimatePresence>
                      </React.Fragment>
                    );
                  })
                ) : (
                  <tr><td colSpan={5} className="py-12 text-center">
                    <div className="text-sm font-semibold text-[#64748B]">No couriers found</div>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>}

        {/* Mobile Cards */}
        {activeTab === 'management' && <div className="md:hidden flex-1 overflow-y-auto p-2 space-y-2 relative">
          {loading && <TableLoader />}
          {loading ? null : filteredProviders.length > 0 ? (
            filteredProviders.map((provider) => {
              const isExpanded = expandedProviderId === provider._id;
              const isEditing = editingProviderId === provider._id;
              const items: any[] = servicesGrouped[provider.courierName] || servicesGrouped[provider.courierProvider] || [];
              const logo = getProviderLogo(provider.courierName);
              return (
                <div key={provider._id} className="relative bg-white rounded-2xl border border-[#E2E8F0] shadow-sm">
                  <StatusRibbon label={provider.status} color={provider.status === 'Enable' ? '#00A86B' : '#94A3B8'} />
                  <button onClick={() => { setExpandedProviderId(isExpanded ? null : provider._id); setEditingProviderId(null); }} className="w-full pt-8 px-4 pb-4 text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white border border-[#E2E8F0] rounded-xl p-2 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                        {logo ? <img src={logo} alt={provider.courierName} className="max-w-full max-h-full object-contain"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-[13px] font-bold text-[#94A3B8]">${provider.courierName.charAt(0)}</span>`; }} />
                          : <span className="text-[13px] font-bold text-[#94A3B8]">{provider.courierName.charAt(0)}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[14px] font-bold text-[#0F172A] truncate">{provider.courierName}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 bg-[#F1F5F9] text-[#475569] rounded-full text-[10px] font-bold">Domestic</span>
                          <span className="text-[11px] font-semibold text-[#94A3B8]">{items.length} {items.length === 1 ? 'Service' : 'Services'}</span>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isExpanded ? 'rotate-90 text-[#00A86B]' : 'text-[#CBD5E1]'}`} />
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 350, damping: 30, mass: 0.8 }}
                        className="overflow-hidden border-t border-[#E2E8F0] bg-[#F8FAFC]">
                        <div className="p-4">
                          {!selectedPlan ? (
                            <p className="text-xs text-center text-[#94A3B8] font-semibold py-4">Please select a plan first.</p>
                          ) : items.length > 0 ? (
                            <div className="space-y-3">
                              {!isEditing && (
                                <div className="flex justify-end">
                                  <button onClick={() => setEditingProviderId(provider._id)}
                                    className="flex items-center gap-1.5 h-8 px-4 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0] text-[#475569] text-[12px] font-bold">
                                    <Edit2 className="w-3.5 h-3.5" /> Edit
                                  </button>
                                </div>
                              )}
                              {items.map((svc: any) => {
                                const pKey = (provider.courierName || provider.courierProvider || '').trim();
                                const sKey = (svc.name || '').trim();
                                const r = ciGet(ciGet(ratesMap[selectedPlan], pKey), sKey) || {};
                                return (
                                  <div key={svc._id} className="bg-white rounded-xl border border-[#E2E8F0] p-4">
                                    <div className="flex items-start justify-between gap-2 mb-3">
                                      <div className="min-w-0">
                                        <div className="text-[13px] font-bold text-[#0F172A] truncate">{svc.name}</div>
                                        <div className="flex items-center gap-2 mt-1">
                                          <span className="inline-block px-2 py-0.5 bg-[#F1F5F9] text-[#1E293B] rounded-full text-[10px] font-medium">{svc.courierType || 'Surface'}</span>
                                          {r._id && <span className="text-[10px] text-[#00A86B] font-semibold">● Saved</span>}
                                        </div>
                                      </div>
                                      {isEditing ? (
                                        <button type="button" onClick={() => handleRateChange(pKey, sKey, 'isFlatRate', !r.isFlatRate)} className="flex items-center gap-1.5 shrink-0">
                                          <span className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${r.isFlatRate ? 'bg-[#00A86B]' : 'bg-[#CBD5E1]'}`}>
                                            <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${r.isFlatRate ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                                          </span>
                                          <span className="text-[10px] font-semibold text-[#64748B]">Flat?</span>
                                        </button>
                                      ) : (
                                        <div className="flex items-center gap-1.5 shrink-0">
                                          <span className={`relative inline-flex h-4 w-7 items-center rounded-full ${r.isFlatRate ? 'bg-[#00A86B]' : 'bg-[#CBD5E1]'}`}>
                                            <span className={`inline-block h-3 w-3 rounded-full bg-white ${r.isFlatRate ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                                          </span>
                                          <span className="text-[10px] font-semibold text-[#64748B]">Flat?</span>
                                        </div>
                                      )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                      {[
                                        { label: 'Basic Wt. (gm)', field: 'basicWeight' },
                                        { label: 'Add. Wt. (gm)', field: 'addWeight' },
                                      ].map(({ label, field }) => (
                                        <div key={field}>
                                          <label className="block text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1">{label}</label>
                                          {isEditing
                                            ? <input type="number" value={r[field] || ''} onChange={(e) => handleRateChange(pKey, sKey, field, e.target.value)} className="w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-lg text-[13px] font-semibold text-[#0F172A] focus:border-[#00A86B] focus:outline-none" placeholder="0" />
                                            : <div className="w-full h-10 px-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg flex items-center text-[13px] font-semibold text-[#0F172A]">{r[field] || <span className="text-[#CBD5E1]">—</span>}</div>}
                                        </div>
                                      ))}
                                    </div>

                                    <div className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1.5">Basic Zone Rates (₹)</div>
                                    <div className="grid grid-cols-2 gap-2.5 mb-3">
                                      {(['A','B','C','D','E'] as const).map((zone) => (
                                        <div key={`b${zone}`}>
                                          <label className="block text-[10px] font-semibold text-[#64748B] mb-1">Zone {zone}</label>
                                          {isEditing
                                            ? <div className="relative"><span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-[#94A3B8]">₹</span><input type="number" value={r[`basicZone${zone}`] || ''} onChange={(e) => handleRateChange(pKey, sKey, `basicZone${zone}`, e.target.value)} className="w-full h-9 pl-6 pr-2 bg-white border border-[#E2E8F0] rounded-lg text-[13px] font-semibold text-[#0F172A] focus:border-[#00A86B] focus:outline-none" /></div>
                                            : <div className="w-full h-9 px-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg flex items-center text-[13px] font-semibold text-[#0F172A]">{r[`basicZone${zone}`] ? `₹${r[`basicZone${zone}`]}` : <span className="text-[#CBD5E1]">—</span>}</div>}
                                        </div>
                                      ))}
                                      <div>
                                        <label className="block text-[10px] font-semibold text-[#64748B] mb-1">COD ₹</label>
                                        {isEditing
                                          ? <input type="number" placeholder="0" value={r.codCharge || ''} disabled={r.isFlatRate} onChange={(e) => handleRateChange(pKey, sKey, 'codCharge', e.target.value)} className={`w-full h-9 px-2 bg-white border border-[#E2E8F0] rounded-lg text-[13px] font-semibold text-[#0F172A] focus:border-[#00A86B] focus:outline-none ${r.isFlatRate ? 'opacity-50' : ''}`} />
                                          : <div className="w-full h-9 px-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg flex items-center text-[13px] font-semibold text-[#0F172A]">{r.codCharge ? `₹${r.codCharge}` : <span className="text-[#CBD5E1]">—</span>}</div>}
                                      </div>
                                    </div>

                                    <div className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1.5">Additional Zone Rates (₹)</div>
                                    <div className="grid grid-cols-2 gap-2.5">
                                      {(['A','B','C','D','E'] as const).map((zone) => (
                                        <div key={`a${zone}`}>
                                          <label className="block text-[10px] font-semibold text-[#64748B] mb-1">Zone {zone}</label>
                                          {isEditing
                                            ? <div className="relative"><span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-[#94A3B8]">₹</span><input type="number" value={r[`addZone${zone}`] || ''} onChange={(e) => handleRateChange(pKey, sKey, `addZone${zone}`, e.target.value)} className="w-full h-9 pl-6 pr-2 bg-white border border-[#E2E8F0] rounded-lg text-[13px] font-semibold text-[#0F172A] focus:border-[#00A86B] focus:outline-none" /></div>
                                            : <div className="w-full h-9 px-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg flex items-center text-[13px] font-semibold text-[#0F172A]">{r[`addZone${zone}`] ? `₹${r[`addZone${zone}`]}` : <span className="text-[#CBD5E1]">—</span>}</div>}
                                        </div>
                                      ))}
                                      <div>
                                        <label className="block text-[10px] font-semibold text-[#64748B] mb-1">COD %</label>
                                        {isEditing
                                          ? <input type="number" placeholder="0" value={r.codPercentage || ''} disabled={r.isFlatRate} onChange={(e) => handleRateChange(pKey, sKey, 'codPercentage', e.target.value)} className={`w-full h-9 px-2 bg-white border border-[#E2E8F0] rounded-lg text-[13px] font-semibold text-[#0F172A] focus:border-[#00A86B] focus:outline-none ${r.isFlatRate ? 'opacity-50' : ''}`} />
                                          : <div className="w-full h-9 px-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg flex items-center text-[13px] font-semibold text-[#0F172A]">{r.codPercentage ? `${r.codPercentage}%` : <span className="text-[#CBD5E1]">—</span>}</div>}
                                      </div>
                                    </div>
                                    <div className="mt-3">
                                      <label className="block text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1.5">Rate Status</label>
                                      {isEditing ? (
                                        <select value={r.status || 'Active'} onChange={(e) => handleRateChange(pKey, sKey, 'status', e.target.value)}
                                          className="w-full h-9 px-3 bg-white border border-[#E2E8F0] rounded-lg text-[13px] font-semibold text-[#0F172A] focus:border-[#00A86B] focus:outline-none appearance-none">
                                          <option value="Active">Active</option>
                                          <option value="Inactive">Inactive</option>
                                        </select>
                                      ) : (
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold ${(r.status || 'Active') === 'Active' ? 'bg-[#F0FDF4] text-[#00A86B]' : 'bg-[#FEF2F2] text-[#EF4444]'}`}>
                                          {r.status || 'Active'}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}

                              <div className="flex items-center gap-3 pt-1">
                                {isEditing ? (
                                  <>
                                    <button onClick={() => setEditingProviderId(null)}
                                      className="flex-1 h-11 rounded-full font-bold text-[13px] text-[#475569] border border-[#CBD5E1] bg-white transition-all shadow-sm">
                                      Cancel
                                    </button>
                                    <button onClick={() => handleSaveRates(provider)} disabled={savingId === provider._id}
                                      className="flex-1 h-11 rounded-full font-bold text-[13px] text-white bg-[#00A86B] shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                                      {savingId === provider._id ? <><Spinner /> Saving...</> : <><Save className="w-4 h-4" /> Save</>}
                                    </button>
                                  </>
                                ) : (
                                  <button onClick={() => setExpandedProviderId(null)}
                                    className="flex-1 h-11 rounded-full font-bold text-[13px] text-[#475569] border border-[#CBD5E1] bg-white transition-all shadow-sm">
                                    Close
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-8 bg-white rounded-xl border border-dashed border-[#E2E8F0]">
                              <p className="text-xs font-semibold text-[#94A3B8]">No services configured for this courier yet.</p>
                              <p className="text-[11px] text-[#94A3B8] mt-1">Please add services in the Courier Management page first.</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center bg-white rounded-2xl border border-[#E2E8F0]">
              <div className="text-sm font-semibold text-[#64748B]">No couriers found</div>
            </div>
          )}
        </div>}

        {/* ══════════════════════ COSTING RATE CARD TAB — redesigned to match Rate
             Card Management: courier services listed in a table, click a row to
             expand its costing form inline (add or edit), same as provider rows
             expand into their rate-card editor above. ══════════════════════ */}
        {activeTab === 'costing' && (() => {
          const filteredServices = filteredCostingServices;
          // Table is driven by both the shared courier-services list (loading, fetched
          // once on mount) and the costing cards themselves (costingLoading) — the page
          // looked blank because only costingLoading was checked, so if `services` was
          // still in flight the table rendered with zero rows instead of the loader.
          const costingTabLoading = loading || costingLoading;

          const CostingForm = () => (
            <div className="bg-white rounded-[20px] border border-[#E2E8F0] p-5 md:p-7 shadow-[0_2px_16px_rgba(0,0,0,0.02)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
                <PillSelect
                  value={costingForm.status}
                  onChange={(v) => setCostingForm(f => ({ ...f, status: v }))}
                  options={[{ value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }]}
                />
                <PillSelect
                  value={costingForm.shipmentType}
                  onChange={(v) => setCostingForm(f => ({ ...f, shipmentType: v }))}
                  options={[{ value: 'Forward', label: 'Forward' }, { value: 'RTO', label: 'RTO' }]}
                />
              </div>

              <div className="mb-5">
                <p className="text-[13px] font-bold text-[#0F172A] mb-2.5">
                  Weight Type <span className="text-red-500 font-bold">Basic *</span> <span className="text-[#94A3B8] font-medium">(in gram)</span>
                </p>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                  <input type="number" placeholder="Weight (gm) *" value={costingForm.basicWeight}
                    onChange={(e) => setCostingForm(f => ({ ...f, basicWeight: e.target.value }))}
                    className="w-full h-11 px-4 bg-white border border-[#E2E8F0] rounded-full text-[13px] font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-2 focus:ring-[#00A86B]/10" />
                  {(['basicZoneA', 'basicZoneB', 'basicZoneC', 'basicZoneD', 'basicZoneE'] as const).map((field, i) => (
                    <input key={field} type="number" placeholder={`Zone ${String.fromCharCode(65 + i)} * ₹`} value={(costingForm as any)[field]}
                      onChange={(e) => setCostingForm(f => ({ ...f, [field]: e.target.value }))}
                      className="w-full h-11 px-4 bg-white border border-[#E2E8F0] rounded-full text-[13px] font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-2 focus:ring-[#00A86B]/10" />
                  ))}
                </div>
              </div>

              <div className="mb-5">
                <p className="text-[13px] font-bold text-[#0F172A] mb-2.5">
                  Weight Type <span className="text-red-500 font-bold">Additional *</span> <span className="text-[#94A3B8] font-medium">(in gram)</span>
                </p>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                  <input type="number" placeholder="Weight (gm) *" value={costingForm.addWeight}
                    onChange={(e) => setCostingForm(f => ({ ...f, addWeight: e.target.value }))}
                    className="w-full h-11 px-4 bg-white border border-[#E2E8F0] rounded-full text-[13px] font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-2 focus:ring-[#00A86B]/10" />
                  {(['addZoneA', 'addZoneB', 'addZoneC', 'addZoneD', 'addZoneE'] as const).map((field, i) => (
                    <input key={field} type="number" placeholder={`Zone ${String.fromCharCode(65 + i)} * ₹`} value={(costingForm as any)[field]}
                      onChange={(e) => setCostingForm(f => ({ ...f, [field]: e.target.value }))}
                      className="w-full h-11 px-4 bg-white border border-[#E2E8F0] rounded-full text-[13px] font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-2 focus:ring-[#00A86B]/10" />
                  ))}
                </div>
              </div>

              <div className="mb-1">
                <p className="text-[13px] font-bold text-[#0F172A] mb-2.5">Overhead Charges:</p>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                  <input type="number" placeholder="COD Charge ₹" value={costingForm.codCharge}
                    onChange={(e) => setCostingForm(f => ({ ...f, codCharge: e.target.value }))}
                    className="w-full h-11 px-4 bg-white border border-[#E2E8F0] rounded-full text-[13px] font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-2 focus:ring-[#00A86B]/10" />
                  <input type="number" placeholder="COD Percentage %" value={costingForm.codPercentage}
                    onChange={(e) => setCostingForm(f => ({ ...f, codPercentage: e.target.value }))}
                    className="w-full h-11 px-4 bg-white border border-[#E2E8F0] rounded-full text-[13px] font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-2 focus:ring-[#00A86B]/10" />
                </div>
              </div>

              {costingError && <p className="text-[12px] font-semibold text-red-500 mt-3">{costingError}</p>}

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#F1F5F9]">
                <button
                  onClick={() => { resetCostingForm(); setExpandedCostingServiceId(null); }}
                  className="flex items-center gap-1.5 px-5 h-10 rounded-full border border-[#E2E8F0] text-[#475569] text-[13px] font-bold bg-white hover:bg-[#F8FAFC] transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset
                </button>
                <button
                  onClick={handleSaveCosting}
                  disabled={costingSaving}
                  className="flex items-center gap-1.5 px-5 h-10 rounded-full bg-[#00A86B] text-white text-[13px] font-bold hover:bg-[#009B63] transition-colors shadow-sm disabled:opacity-60"
                >
                  {costingSaving ? <><Spinner /> Saving...</> : <><Save className="w-3.5 h-3.5" /> {editingCostingId ? 'Update' : 'Save'} Costing Rate</>}
                </button>
              </div>
            </div>
          );

          return (
          <div className="flex-1 min-h-0 overflow-y-auto">
            {/* Search — same placement/style as Management's courier search */}
            <div className="hidden md:flex py-3 px-6 border-b border-[#CBD5F5] items-center gap-3 bg-[#F8FAFC]/50">
              <input
                type="text"
                placeholder="Search courier service"
                className="glass-search-input w-[260px] shrink-0"
                value={costingSearch}
                onChange={(e) => setCostingSearch(e.target.value)}
              />
              <span className="text-[12px] font-semibold text-[#94A3B8]">
                {filteredServices.length} {filteredServices.length === 1 ? 'service' : 'services'}
              </span>
            </div>
            <div className="md:hidden px-3 py-2.5 border-b border-[#E2E8F0] bg-white">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                <input
                  type="text"
                  placeholder="Search courier service"
                  className="w-full h-9 pl-9 pr-3 rounded-full border border-[#E2E8F0] bg-[#F8FAFC] text-sm outline-none focus:border-[#00A86B] focus:ring-2 focus:ring-[#00A86B]/10 text-[#0F172A] placeholder:text-[#94A3B8] transition-all"
                  value={costingSearch}
                  onChange={(e) => setCostingSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Desktop table */}
            <div className="hidden md:block bg-white">
              {costingTabLoading && <div className="relative h-32"><TableLoader /></div>}
              {!costingTabLoading && (
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 z-20 bg-[#E6F9F2] shadow-sm">
                    <tr className="border-b border-[#E2E8F0]">
                      <th className="py-2 px-3 text-xs font-medium text-[#64748B] uppercase tracking-wider w-20 rounded-l-lg">
                        <div className="flex items-center gap-1.5"><Hash className="w-3.5 h-3.5 shrink-0" /><span>S.NO.</span></div>
                      </th>
                      <th className="py-2 px-3 text-xs font-medium text-[#64748B] uppercase tracking-wider">
                        <div className="flex items-center gap-1.5"><Truck className="w-3.5 h-3.5 shrink-0" /><span>COURIER SERVICE</span></div>
                      </th>
                      <th className="py-2 px-3 text-xs font-medium text-[#64748B] uppercase tracking-wider text-center">
                        <div className="flex items-center justify-center gap-1.5"><Layers className="w-3.5 h-3.5 shrink-0" /><span>MODE</span></div>
                      </th>
                      <th className="py-2 px-3 text-xs font-medium text-[#64748B] uppercase tracking-wider text-center">
                        <div className="flex items-center justify-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /><span>COSTING STATUS</span></div>
                      </th>
                      <th className="py-2 px-3 text-xs font-medium text-[#64748B] uppercase tracking-wider text-right rounded-r-lg">
                        <div className="flex items-center justify-end gap-1.5"><Edit2 className="w-3.5 h-3.5 shrink-0" /><span>DETAILS</span></div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredServices.length === 0 ? (
                      <tr><td colSpan={5} className="py-12 text-center text-sm font-semibold text-[#94A3B8]">No courier services found</td></tr>
                    ) : costingPagination.paginatedData.map((svc: any, index: number) => {
                      const isExpanded = expandedCostingServiceId === svc._id;
                      const existing = findCostingCardForService(svc);
                      const logo = getProviderLogo(svc.provider);
                      return (
                        <React.Fragment key={svc._id}>
                          <tr
                            className={`border-b border-[#E2E8F0] transition-colors cursor-pointer ${isExpanded ? 'bg-[#F8FAFC]' : index % 2 === 0 ? 'bg-white' : 'bg-[#E6EDF7]/20'}`}
                            onClick={() => toggleCostingRow(svc)}
                          >
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-semibold text-[#64748B]">{costingPagination.startIndex + index}</span>
                                <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90 text-[#00A86B]' : 'text-[#CBD5E1]'}`} />
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-4">
                                <div className="w-11 h-11 bg-white border border-[#E2E8F0] rounded-xl p-2 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                                  {logo ? (
                                    <img src={logo} alt={svc.provider} className="max-w-full max-h-full object-contain"
                                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-[13px] font-bold text-[#94A3B8]">${(svc.provider || '?').charAt(0)}</span>`; }} />
                                  ) : (
                                    <span className="text-[13px] font-bold text-[#94A3B8]">{(svc.provider || '?').charAt(0)}</span>
                                  )}
                                </div>
                                <div>
                                  <div className="text-[14px] font-extrabold text-[#0F172A]">{svc.name}</div>
                                  <div className="text-[11px] font-semibold text-[#94A3B8]">{svc.provider}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-center">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F1F5F9] text-[#475569] rounded-full text-xs font-bold whitespace-nowrap">
                                {(svc.courierType || '').toLowerCase().includes('air') ? <Plane className="w-3.5 h-3.5" /> : <Truck className="w-3.5 h-3.5" />}
                                {svc.courierType || 'Domestic (Surface)'}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-center">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${existing ? 'bg-[#F0FDF4] text-[#00A86B]' : 'bg-[#F1F5F9] text-[#94A3B8]'}`}>
                                {existing ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                {existing ? 'Configured' : 'Not Set'}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right pr-8">
                              <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#64748B]">
                                {isExpanded ? 'Close' : existing ? <Edit2 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                                {isExpanded ? '' : existing ? 'Edit' : 'Add costing'}
                              </span>
                            </td>
                          </tr>

                          <AnimatePresence initial={false}>
                            {isExpanded && (
                              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                                <td colSpan={5} className="p-0">
                                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                    transition={{ type: 'spring', stiffness: 350, damping: 30, mass: 0.8 }} className="overflow-hidden">
                                    <div className="py-6 px-8" onClick={(e) => e.stopPropagation()}>
                                      <CostingForm />
                                    </div>
                                  </motion.div>
                                </td>
                              </tr>
                            )}
                          </AnimatePresence>
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              )}
              <DesktopPagination
                page={costingPagination.page}
                setPage={costingPagination.setPage}
                totalPages={costingPagination.totalPages}
                rowsPerPage={costingPagination.rowsPerPage}
                setRowsPerPage={costingPagination.setRowsPerPage}
                startIndex={costingPagination.startIndex}
                endIndex={costingPagination.endIndex}
                totalItems={costingPagination.totalItems}
              />
            </div>

            {/* Mobile cards */}
            <div className="md:hidden p-2.5 space-y-2.5">
              {costingTabLoading && <div className="relative h-32"><TableLoader /></div>}
              {!costingTabLoading && filteredServices.length === 0 && (
                <div className="p-8 text-center text-sm font-semibold text-[#94A3B8]">No courier services found</div>
              )}
              {!costingTabLoading && costingPagination.paginatedData.map((svc: any) => {
                const isExpanded = expandedCostingServiceId === svc._id;
                const existing = findCostingCardForService(svc);
                const logo = getProviderLogo(svc.provider);
                return (
                  <div key={svc._id} className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
                    <button onClick={() => toggleCostingRow(svc)} className="w-full text-left p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-white border border-[#E2E8F0] rounded-lg p-1.5 flex items-center justify-center shrink-0 overflow-hidden">
                          {logo ? (
                            <img src={logo} alt={svc.provider} className="max-w-full max-h-full object-contain"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          ) : (
                            <span className="text-[11px] font-bold text-[#94A3B8]">{(svc.provider || '?').charAt(0)}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-[13px] text-[#0F172A] truncate">{svc.name}</div>
                          <div className="text-[10px] font-semibold text-[#94A3B8] truncate">{svc.provider}</div>
                        </div>
                        <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${existing ? 'bg-[#F0FDF4] text-[#00A86B]' : 'bg-[#F1F5F9] text-[#94A3B8]'}`}>
                          {existing ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {existing ? 'Configured' : 'Not Set'}
                        </span>
                        <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isExpanded ? 'rotate-90 text-[#00A86B]' : 'text-[#CBD5E1]'}`} />
                      </div>
                    </button>
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          transition={{ type: 'spring', stiffness: 350, damping: 30, mass: 0.8 }} className="overflow-hidden border-t border-[#E2E8F0] bg-[#F8FAFC]">
                          <div className="p-3">
                            <CostingForm />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
              {<MobilePaginationBar {...({
                page: costingPagination.page,
                setPage: costingPagination.setPage,
                totalPages: costingPagination.totalPages,
                rowsPerPage: costingPagination.rowsPerPage,
                setRowsPerPage: costingPagination.setRowsPerPage,
                startIndex: costingPagination.startIndex,
                endIndex: costingPagination.endIndex,
                totalItems: costingPagination.totalItems,
                inline: true,
              })} />}
            </div>
          </div>
          );
        })()}
      </div>

      {/* Delete Costing Rate Card Confirm */}
      <AnimatePresence>
        {deleteCostingId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4"
            onClick={() => setDeleteCostingId(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              className="w-full max-w-[380px] bg-white rounded-[24px] shadow-[0_40px_80px_-16px_rgba(0,0,0,0.2)] border border-[#E2E8F0] overflow-hidden"
              onClick={(e) => e.stopPropagation()}>
              <div className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-5 h-5 text-red-500" />
                </div>
                <h3 className="text-base font-bold text-[#0F172A] mb-1.5">Delete Costing Rate Card?</h3>
                <p className="text-[13px] text-[#94A3B8]">This action cannot be undone.</p>
              </div>
              <div className="px-6 py-5 border-t border-[#E2E8F0] flex gap-3">
                <button onClick={() => setDeleteCostingId(null)}
                  className="flex-1 h-11 rounded-[14px] font-semibold text-sm text-[#475569] bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-all">
                  Cancel
                </button>
                <button onClick={handleDeleteCosting}
                  className="flex-1 h-11 rounded-[14px] font-semibold text-sm text-white bg-red-500 hover:bg-red-600 transition-all shadow-sm">
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Filters Bottom Sheet */}
      <AnimatePresence>
        {isMobileFiltersOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[140] md:hidden flex items-end justify-center"
            onClick={() => setIsMobileFiltersOpen(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white rounded-t-3xl border-t border-[#E2E8F0] shadow-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between sticky top-0 bg-white z-10">
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2"><Filter className="w-5 h-5 text-[#00A86B]" /> Filters</h3>
                <button onClick={() => setIsMobileFiltersOpen(false)} className="p-1.5 hover:bg-slate-100 text-slate-400 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
                  <select className="w-full h-11 px-3 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B] bg-white" value={statusFilter[0] || ''} onChange={(e) => setStatusFilter(e.target.value ? [e.target.value] : [])}>
                    <option value="">All Status</option>
                    {STATUS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Type</label>
                  <select className="w-full h-11 px-3 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B] bg-white" value={typeFilter[0] || ''} onChange={(e) => setTypeFilter(e.target.value ? [e.target.value] : [])}>
                    <option value="">All Types</option>
                    {TYPE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-[#E2E8F0] flex items-center gap-3 sticky bottom-0 bg-white">
                <button onClick={() => { resetFilters(); setIsMobileFiltersOpen(false); }}
                  className="flex-1 h-11 rounded-full border border-[#E2E8F0] text-[#475569] text-sm font-bold hover:bg-[#F8FAFC] transition-colors">
                  Reset All
                </button>
                <button onClick={() => { applyFilters(); setIsMobileFiltersOpen(false); }}
                  className="flex-1 h-11 rounded-full bg-[#009D64] text-white text-sm font-bold hover:bg-[#009B63] transition-colors shadow-sm">
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Plan Modal */}
      <AnimatePresence>
        {addPlanModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4"
            onClick={() => setAddPlanModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              className="w-full max-w-[420px] bg-white rounded-[24px] shadow-[0_40px_80px_-16px_rgba(0,0,0,0.2)] border border-[#E2E8F0] overflow-hidden"
              onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-5 border-b border-[#E2E8F0] flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#0F172A]">Add New Plan</h3>
                  <p className="text-xs text-[#94A3B8] mt-0.5">Create a new rate card plan</p>
                </div>
                <button onClick={() => setAddPlanModal(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-[#64748B] hover:bg-[#F1F5F9] transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6">
                <label className="block text-xs font-bold text-[#64748B] mb-2 uppercase tracking-wide">Plan Name</label>
                <input
                  type="text"
                  placeholder="e.g. Standard Plan, Premium Plan"
                  value={newPlanName}
                  onChange={(e) => setNewPlanName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddPlan()}
                  autoFocus
                  className="w-full h-12 px-4 bg-white border border-[#E2E8F0] rounded-[14px] text-sm font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20 focus:border-[#00A86B]"
                />
                {planError && <p className="text-xs text-red-500 font-medium mt-2">{planError}</p>}
              </div>
              <div className="px-6 py-5 border-t border-[#E2E8F0] flex justify-end gap-3">
                <button onClick={() => setAddPlanModal(false)}
                  className="px-5 h-11 rounded-[14px] font-semibold text-sm text-[#475569] bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-all">
                  Cancel
                </button>
                <button onClick={handleAddPlan} disabled={addingPlan}
                  className="px-6 h-11 rounded-[14px] font-semibold text-sm text-white bg-[#00A86B] hover:bg-[#009B63] transition-all shadow-sm flex items-center gap-2 disabled:opacity-60">
                  {addingPlan ? <><Spinner /> Creating...</> : <><Plus className="w-4 h-4" /> Create Plan</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Rate Card Modal */}
      <AnimatePresence>
        {addRateModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4"
            onClick={() => setAddRateModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              className="w-full max-w-[560px] bg-white rounded-[24px] shadow-[0_40px_80px_-16px_rgba(0,0,0,0.2)] border border-[#E2E8F0] overflow-hidden max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-5 border-b border-[#E2E8F0] flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-base font-bold text-[#0F172A]">Add Rate Card</h3>
                  <p className="text-xs text-[#94A3B8] mt-0.5">Create a new rate card entry</p>
                </div>
                <button onClick={() => setAddRateModal(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-[#64748B] hover:bg-[#F1F5F9] transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-5">
                {/* Plan + Provider + Service */}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#64748B] mb-2 uppercase tracking-wide">Plan</label>
                    <select value={addRateForm.plan} onChange={(e) => setAddRateForm(f => ({ ...f, plan: e.target.value }))}
                      className="w-full h-11 px-4 bg-white border border-[#E2E8F0] rounded-[14px] text-sm font-medium text-[#0F172A] focus:outline-none focus:border-[#00A86B] appearance-none">
                      <option value="">Select Plan</option>
                      {plans.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#64748B] mb-2 uppercase tracking-wide">Courier Provider</label>
                    <select value={addRateForm.providerName}
                      onChange={(e) => setAddRateForm(f => ({ ...f, providerName: e.target.value, serviceName: '' }))}
                      className="w-full h-11 px-4 bg-white border border-[#E2E8F0] rounded-[14px] text-sm font-medium text-[#0F172A] focus:outline-none focus:border-[#00A86B] appearance-none">
                      <option value="">Select Provider</option>
                      {providers.map(p => <option key={p._id} value={p.courierName}>{p.courierName}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#64748B] mb-2 uppercase tracking-wide">Courier Service</label>
                    <select value={addRateForm.serviceName} onChange={(e) => setAddRateForm(f => ({ ...f, serviceName: e.target.value }))}
                      disabled={!addRateForm.providerName}
                      className="w-full h-11 px-4 bg-white border border-[#E2E8F0] rounded-[14px] text-sm font-medium text-[#0F172A] focus:outline-none focus:border-[#00A86B] appearance-none disabled:opacity-50">
                      <option value="">Select Service</option>
                      {services.filter((s: any) => s.provider === addRateForm.providerName).map((s: any) => (
                        <option key={s._id} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Flat Rate + Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#64748B] mb-2 uppercase tracking-wide">Flat Rate</label>
                    <button type="button" onClick={() => setAddRateForm(f => ({ ...f, isFlatRate: !f.isFlatRate, codCharge: !f.isFlatRate ? '0' : f.codCharge, codPercentage: !f.isFlatRate ? '0' : f.codPercentage }))}
                      className="flex items-center gap-2 h-11 px-4 bg-white border border-[#E2E8F0] rounded-[14px] w-full">
                      <span className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${addRateForm.isFlatRate ? 'bg-[#00A86B]' : 'bg-[#CBD5E1]'}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${addRateForm.isFlatRate ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </span>
                      <span className="text-sm font-semibold text-[#475569]">{addRateForm.isFlatRate ? 'Yes' : 'No'}</span>
                    </button>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#64748B] mb-2 uppercase tracking-wide">Status</label>
                    <select value={addRateForm.status} onChange={(e) => setAddRateForm(f => ({ ...f, status: e.target.value }))}
                      className="w-full h-11 px-4 bg-white border border-[#E2E8F0] rounded-[14px] text-sm font-medium text-[#0F172A] focus:outline-none focus:border-[#00A86B] appearance-none">
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Basic Weight + Zones */}
                <div>
                  <p className="text-xs font-bold text-[#64748B] uppercase tracking-wide mb-3">Basic Rate</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-[#94A3B8] mb-1">Weight (gm)</label>
                      <input type="number" placeholder="0" value={addRateForm.basicWeight} onChange={(e) => setAddRateForm(f => ({ ...f, basicWeight: e.target.value }))}
                        className="w-full h-9 px-3 bg-white border border-[#E2E8F0] rounded-lg text-[13px] font-semibold text-[#0F172A] focus:border-[#00A86B] focus:outline-none" />
                    </div>
                    {(['A','B','C','D','E'] as const).map(z => (
                      <div key={z}>
                        <label className="block text-[10px] font-semibold text-[#94A3B8] mb-1">Zone {z} (₹)</label>
                        <input type="number" placeholder="0" value={(addRateForm as any)[`basicZone${z}`]} onChange={(e) => setAddRateForm(f => ({ ...f, [`basicZone${z}`]: e.target.value }))}
                          className="w-full h-9 px-3 bg-white border border-[#E2E8F0] rounded-lg text-[13px] font-semibold text-[#0F172A] focus:border-[#00A86B] focus:outline-none" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Additional Weight + Zones */}
                <div>
                  <p className="text-xs font-bold text-[#64748B] uppercase tracking-wide mb-3">Additional Rate</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-[#94A3B8] mb-1">Weight (gm)</label>
                      <input type="number" placeholder="0" value={addRateForm.addWeight} onChange={(e) => setAddRateForm(f => ({ ...f, addWeight: e.target.value }))}
                        className="w-full h-9 px-3 bg-white border border-[#E2E8F0] rounded-lg text-[13px] font-semibold text-[#0F172A] focus:border-[#00A86B] focus:outline-none" />
                    </div>
                    {(['A','B','C','D','E'] as const).map(z => (
                      <div key={z}>
                        <label className="block text-[10px] font-semibold text-[#94A3B8] mb-1">Zone {z} (₹)</label>
                        <input type="number" placeholder="0" value={(addRateForm as any)[`addZone${z}`]} onChange={(e) => setAddRateForm(f => ({ ...f, [`addZone${z}`]: e.target.value }))}
                          className="w-full h-9 px-3 bg-white border border-[#E2E8F0] rounded-lg text-[13px] font-semibold text-[#0F172A] focus:border-[#00A86B] focus:outline-none" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* COD */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#64748B] mb-2 uppercase tracking-wide">COD Charge (₹)</label>
                    <input type="number" placeholder="0" value={addRateForm.codCharge} disabled={addRateForm.isFlatRate}
                      onChange={(e) => setAddRateForm(f => ({ ...f, codCharge: e.target.value }))}
                      className={`w-full h-11 px-4 bg-white border border-[#E2E8F0] rounded-[14px] text-sm font-medium text-[#0F172A] focus:outline-none focus:border-[#00A86B] ${addRateForm.isFlatRate ? 'opacity-50' : ''}`} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#64748B] mb-2 uppercase tracking-wide">COD % </label>
                    <input type="number" placeholder="0" value={addRateForm.codPercentage} disabled={addRateForm.isFlatRate}
                      onChange={(e) => setAddRateForm(f => ({ ...f, codPercentage: e.target.value }))}
                      className={`w-full h-11 px-4 bg-white border border-[#E2E8F0] rounded-[14px] text-sm font-medium text-[#0F172A] focus:outline-none focus:border-[#00A86B] ${addRateForm.isFlatRate ? 'opacity-50' : ''}`} />
                  </div>
                </div>

                {addRateError && <p className="text-xs text-red-500 font-medium">{addRateError}</p>}
              </div>

              <div className="px-6 py-5 border-t border-[#E2E8F0] flex justify-end gap-3 shrink-0">
                <button onClick={() => setAddRateModal(false)}
                  className="px-5 h-11 rounded-[14px] font-semibold text-sm text-[#475569] bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-all">
                  Cancel
                </button>
                <button onClick={handleAddRateCard} disabled={addingRate}
                  className="px-6 h-11 rounded-[14px] font-semibold text-sm text-white bg-[#00A86B] hover:bg-[#009B63] transition-all shadow-sm flex items-center gap-2 disabled:opacity-60">
                  {addingRate ? <><Spinner /> Saving...</> : <><Save className="w-4 h-4" /> Save Rate Card</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
