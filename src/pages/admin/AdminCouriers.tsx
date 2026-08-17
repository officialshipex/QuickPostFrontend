import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { Search, ChevronRight, Settings, Trash2, Pencil, Filter, X, CheckCircle2, Truck, Plus, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfigureCourierModal } from '../../components/admin/couriers/ConfigureCourierModal';
import { AddServiceModal } from '../../components/admin/couriers/AddServiceModal';
import { AddCourierModal } from '../../components/admin/couriers/AddCourierModal';
import { GlassDropdown } from '../../components/ui/GlassDropdown';
import { TableLoader } from '../../components/ui/TableLoader';
import { EmptyState } from '../../components/ui/EmptyState';
import { StatusRibbon } from '../../components/ui/StatusRibbon';
import { apiClient } from '../../services/apiClient';

const STATUS_OPTIONS = [
  { label: 'Active', value: 'Active' },
  { label: 'Inactive', value: 'Inactive' },
];
const TYPE_OPTIONS = [
  { label: 'Domestic', value: 'Domestic' },
];

const LOGO_MAP: Record<string, string> = {
  'Amazon Shipping': '/brands/amazon.png',
  'Delhivery': '/brands/delhivery.png',
  'DTDC': '/brands/dtdc.png',
  'Dtdc': '/brands/dtdc.png',
  'Ekart': '/brands/ekart.png',
  'Losung360': '/brands/losung.jpg',
  'Lousung360': '/brands/losung.jpg',
  'Shadowfax': '/brands/shadowfax.png',
  'Shiprocket': '/brands/shiprocket.jpg',
  'Shree Maruti': '/brands/shree_maruti.jpg',
  'XpressBees': '/brands/xpressbees.png',
  'Xpressbees': '/brands/xpressbees.png',
  'Smartship': '/brands/smartship.png',
  'Ecom Express': '/brands/ecom.png',
  'EcomExpress': '/brands/ecom.png',
  'BoxdLogistics': '/brands/boxd.png',
  'Proship': '/brands/proship.png',
  'ZipyPost': '/brands/zipypost.png',
};

const maskValue = (value?: string) => {
  if (!value) return '';
  if (value.length <= 4) return '****';
  return `${'*'.repeat(value.length - 4)}${value.slice(-4)}`;
};

const TAB_SLUG_MAP: Record<'couriers' | 'services', string> = {
  couriers: 'couriers',
  services: 'services',
};
const SLUG_TO_TAB: Record<string, 'couriers' | 'services'> = {
  couriers: 'couriers',
  services: 'services',
};

export function AdminCouriers() {
  const [providers, setProviders] = useState<any[]>([]);
  const [servicesMap, setServicesMap] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);

  // ─── Applied filters (only these drive filteredProviders — set by Apply/Clear All) ──
  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedStatus, setAppliedStatus] = useState<string[]>([]);
  const [appliedType, setAppliedType] = useState<string[]>([]);

  // ─── Global search from admin header navbar ──────────────────────────────────
  const [globalSearch, setGlobalSearch] = useState('');

  const [selectedCourier, setSelectedCourier] = useState<any | null>(null);
  const [serviceCourier, setServiceCourier] = useState<any | null>(null);
  const [expandedProviderId, setExpandedProviderId] = useState<string | null>(null);

  // ── Tabs — each tab is its own URL sub-route (/admin/couriers/:tabSlug) ──
  const navigate = useNavigate();
  const { tabSlug } = useParams<{ tabSlug?: string }>();
  const [activeTab, setActiveTab] = useState<'couriers' | 'services'>(
    () => (tabSlug && SLUG_TO_TAB[tabSlug]) || 'couriers'
  );

  // Keep activeTab in sync with the URL (browser back/forward, direct links, refresh)
  useEffect(() => {
    const tabFromUrl = (tabSlug && SLUG_TO_TAB[tabSlug]) || 'couriers';
    setActiveTab(prev => (prev === tabFromUrl ? prev : tabFromUrl));
  }, [tabSlug]);

  const handleTabChange = (tab: 'couriers' | 'services') => {
    navigate(`/admin/couriers/${TAB_SLUG_MAP[tab]}`);
  };

  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [showAddCourier, setShowAddCourier] = useState(false);
  const [editServiceData, setEditServiceData] = useState<any | null>(null);

  // Reset per-tab UI/filter state whenever the tab changes — otherwise an expanded
  // row, search text, or applied filters from "Couriers" would incorrectly carry
  // over and appear to apply to "Courier Services" (and vice versa).
  useEffect(() => {
    setExpandedProviderId(null);
    setSearchQuery('');
    setStatusFilter([]);
    setTypeFilter([]);
    setAppliedSearch('');
    setAppliedStatus([]);
    setAppliedType([]);
    setIsMobileFiltersOpen(false);
  }, [activeTab]);


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
    fetchAll();
  }, [activeTab]);

  // When the browser restores this page from bfcache (e.g. navigating away and
  // pressing Back), React never remounts and stale data from before navigation
  // is left showing. Refetch so nothing "persists".
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return;
      fetchAll();
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [providersRes, servicesRes] = await Promise.allSettled([
        apiClient.get('/allCourier/couriers'),
        apiClient.get('/courierServices/couriers'),
      ]);

      if (providersRes.status === 'fulfilled') {
        setProviders(providersRes.value.data || []);
      }

      if (servicesRes.status === 'fulfilled') {
        const services: any[] = servicesRes.value.data || [];
        const grouped: Record<string, any[]> = {};
        services.forEach(s => {
          if (!grouped[s.provider]) grouped[s.provider] = [];
          grouped[s.provider].push(s);
        });
        setServicesMap(grouped);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleProviderStatus = async (provider: any) => {
    const newStatus = provider.status === 'Enable' ? 'Disable' : 'Enable';
    try {
      await apiClient.post('/allCourier/updateStatus', { id: provider._id, status: newStatus });
      setProviders(prev => prev.map(p => p._id === provider._id ? { ...p, status: newStatus } : p));
    } catch {}
  };

  const toggleServiceStatus = async (svc: any) => {
    const newStatus = svc.status === 'Enable' ? 'Disable' : 'Enable';
    try {
      await apiClient.put(`/courierServices/updateStatus/${svc._id}`, { status: newStatus });
      setServicesMap(prev => {
        const updated = { ...prev };
        if (updated[svc.provider]) {
          updated[svc.provider] = updated[svc.provider].map(s =>
            s._id === svc._id ? { ...s, status: newStatus } : s
          );
        }
        return updated;
      });
    } catch {}
  };

  const handleDeleteProvider = async (provider: any) => {
    try {
      await apiClient.delete(`/allCourier/deleteCourier/${provider._id}`);
      setProviders(prev => prev.filter(p => p._id !== provider._id));
    } catch {}
  };

  const handleDeleteService = async (svc: any) => {
    try {
      await apiClient.delete(`/courierServices/couriers/${svc._id}`);
      setServicesMap(prev => {
        const updated = { ...prev };
        if (updated[svc.provider]) {
          updated[svc.provider] = updated[svc.provider].filter(s => s._id !== svc._id);
        }
        return updated;
      });
    } catch {}
  };

  const handleConfigureSave = async (data: Record<string, string>): Promise<void> => {
    if (!selectedCourier) return;
    try {
      await apiClient.put(`/allCourier/updateCourier/${selectedCourier._id}`, data);
      setProviders(prev =>
        prev.map(p => p._id === selectedCourier._id ? { ...p, ...data } : p)
      );
    } catch {}
    setSelectedCourier(null);
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
    const name = p.courierName || p.courierProvider || '';
    const search = globalSearch || appliedSearch;
    const matchesSearch = name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      appliedStatus.length === 0 ||
      (appliedStatus.includes('Active') && p.status === 'Enable') ||
      (appliedStatus.includes('Inactive') && p.status === 'Disable');
    const matchesType = appliedType.length === 0 || appliedType.includes('Domestic');
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <AdminLayout>
      <div className="flex flex-col h-[calc(100vh-72px)] -m-4 md:-m-6 bg-white">
        <div className="bg-white relative z-50 shrink-0">

        {/* Filters & Search — mobile (matches Orders page, sits above the tab pill) */}
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
          <button
            onClick={() => setShowAddCourier(true)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white shadow-sm shrink-0 active:scale-95 transition-transform"
            style={{ background: '#009D64' }}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Header Tabs */}
        <div className="px-4 md:px-6 py-2 border-b border-[#E2E8F0]">
          <div className="flex gap-1 items-center bg-[#F7FEFC] rounded-full p-1.5 w-fit overflow-x-auto no-scrollbar">
            <button
              onClick={() => handleTabChange('couriers')}
              className={`px-4 py-2 text-[14px] md:text-[13px] font-semibold md:font-bold transition-colors whitespace-nowrap rounded-full cursor-pointer ${activeTab === 'couriers' ? 'text-[#00A86B] underline underline-offset-4 decoration-2' : 'text-[#64748B] hover:text-[#0F172A]'}`}
            >
              Couriers
            </button>
            <button
              onClick={() => handleTabChange('services')}
              className={`px-4 py-2 text-[14px] md:text-[13px] font-semibold md:font-bold transition-colors whitespace-nowrap rounded-full cursor-pointer ${activeTab === 'services' ? 'text-[#00A86B] underline underline-offset-4 decoration-2' : 'text-[#64748B] hover:text-[#0F172A]'}`}
            >
              Courier Services
            </button>
          </div>
        </div>

        {/* Filters & Search — desktop */}
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

          <button
            onClick={() => setShowAddCourier(true)}
            aria-label="Add Courier"
            className="ml-auto w-9 h-9 rounded-[80px] border border-[#03C27D] flex items-center justify-center text-white shadow-sm transition-transform hover:scale-105"
            style={{ background: 'linear-gradient(180deg, #03C27D 0%, #059669 50%, #065F46 100%)' }}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        </div>

        {/* Table — desktop only */}
        <div className="hidden md:flex bg-white flex-col flex-1 min-h-0 overflow-hidden border-t border-[#E2E8F0]">
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
                <th className="py-2 px-3 text-xs font-medium text-[#64748B] uppercase tracking-wider">
                  <div className="flex items-center gap-1.5"><Hash className="w-3.5 h-3.5 shrink-0" /><span>COURIER ID</span></div>
                </th>
                <th className="py-2 px-3 text-xs font-medium text-[#64748B] uppercase tracking-wider text-center">
                  <div className="flex items-center justify-center gap-1.5"><Filter className="w-3.5 h-3.5 shrink-0" /><span>TYPE</span></div>
                </th>
                <th className="py-2 px-3 text-xs font-medium text-[#64748B] uppercase tracking-wider text-center">
                  <div className="flex items-center justify-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /><span>STATUS</span></div>
                </th>
                <th className="py-2 px-3 text-xs font-medium text-[#64748B] uppercase tracking-wider text-right rounded-r-lg">
                  <div className="flex items-center justify-end gap-1.5">
                    {activeTab === 'couriers' ? <Settings className="w-3.5 h-3.5 shrink-0" /> : <Plus className="w-3.5 h-3.5 shrink-0" />}
                    <span>{activeTab === 'couriers' ? 'CONFIGURE' : 'ADD SERVICE'}</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? null : filteredProviders.length > 0 ? (
                filteredProviders.map((provider, index) => {
                  const name = provider.courierName || provider.courierProvider || '';
                  const logo = LOGO_MAP[name] || '';
                  const isEnabled = provider.status === 'Enable';
                  const services = servicesMap[name] || [];
                  const isExpanded = expandedProviderId === provider._id;

                  return (
                    <React.Fragment key={provider._id}>
                      <tr
                        className={`border-b border-[#E2E8F0] transition-colors cursor-pointer ${isExpanded ? 'bg-[#F8FAFC]' : (index % 2 === 0 ? 'bg-white' : 'bg-[#E6EDF7]/20')}`}
                        onClick={() => setExpandedProviderId(isExpanded ? null : provider._id)}
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
                                <img
                                  src={logo}
                                  alt={name}
                                  className="max-w-full max-h-full object-contain"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-[15px] font-bold text-[#94A3B8]">${name.charAt(0)}</span>`;
                                  }}
                                />
                              ) : (
                                <span className="text-[15px] font-bold text-[#94A3B8]">{name.charAt(0)}</span>
                              )}
                            </div>
                            <div>
                              <div className="text-[15px] font-extrabold text-[#0F172A]">{name}</div>
                              <div className="text-xs text-[#94A3B8] mt-0.5">
                                {activeTab === 'couriers'
                                  ? (provider.apiKey || provider.email ? '1 account configured' : 'No account configured')
                                  : `${services.length} service${services.length !== 1 ? 's' : ''}`}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          {provider.courierId != null ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#E6F9F2] text-[#009D64] text-xs font-bold border border-[#00A86B]/20">
                              #{String(provider.courierId).padStart(2, '0')}
                            </span>
                          ) : (
                            <span className="text-[#CBD5E1] text-xs font-medium">—</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex justify-center">
                            <span className="px-3 py-1 bg-[#F1F5F9] text-[#475569] rounded-full text-xs font-bold">Domestic</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => toggleProviderStatus(provider)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#00A86B] focus:ring-offset-2 ${
                                isEnabled ? 'bg-[#00A86B]' : 'bg-[#EF4444]'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
                                  isEnabled ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex justify-end items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            {activeTab === 'couriers' ? (
                              <>
                                <button
                                  onClick={() => setSelectedCourier({ ...provider, name, logo })}
                                  className="text-sm font-semibold text-[#64748B] hover:text-[#00A86B] transition-colors flex items-center gap-1"
                                >
                                  <Settings className="w-4 h-4" /> Configure
                                </button>
                                <button
                                  onClick={() => handleDeleteProvider(provider)}
                                  className="w-8 h-8 flex items-center justify-center rounded-full text-[#94A3B8] hover:text-red-500 hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => setServiceCourier({ ...provider, name, logo })}
                                className="text-sm font-semibold text-[#64748B] hover:text-[#00A86B] transition-colors flex items-center gap-1"
                              >
                                + Add Service
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                        {/* Expandable Services Row */}
                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] overflow-hidden">
                              <td colSpan={5} className="p-0">
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ type: 'spring', stiffness: 350, damping: 30, mass: 0.8 }}
                                  className="overflow-hidden"
                                >
                                  <div className="py-6 px-12">
                                    {activeTab === 'couriers' ? (
                                      <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                                        {provider.apiKey || provider.email ? (
                                          <div className="flex items-center justify-between py-5 px-8">
                                            <div className="w-1/3">
                                              <div className="text-[15px] font-medium text-[#1E293B] mb-1 leading-none">
                                                {provider.email || maskValue(provider.apiKey)}
                                              </div>
                                              <div className="text-[13px] text-[#94A3B8] leading-none">Configured Account</div>
                                            </div>
                                            <div className="w-1/3 flex justify-center">
                                              <span className="px-4 py-1.5 bg-[#F1F5F9] text-[#1E293B] rounded-full text-[13px] font-medium">
                                                {provider.CODDays != null ? `${provider.CODDays} day delivery` : 'No ETA set'}
                                              </span>
                                            </div>
                                            <div className="w-1/3 flex justify-end items-center gap-3 pr-8">
                                              <span className={`text-sm font-bold ${isEnabled ? 'text-[#00A86B]' : 'text-[#94A3B8]'}`}>
                                                {isEnabled ? 'Active' : 'Inactive'}
                                              </span>
                                              <button
                                                onClick={() => setSelectedCourier({ ...provider, name, logo })}
                                                className="w-8 h-8 flex items-center justify-center rounded-full text-[#94A3B8] hover:text-[#00A86B] hover:bg-[#00A86B]/10 transition-colors"
                                              >
                                                <Pencil className="w-3.5 h-3.5" />
                                              </button>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="text-center py-8">
                                            <p className="text-xs font-semibold text-[#94A3B8]">No account configured yet.</p>
                                          </div>
                                        )}
                                      </div>
                                    ) : services.length > 0 ? (
                                      <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                                        <div className="flex flex-col">
                                          {services.map((svc, i) => (
                                            <div
                                              key={svc._id}
                                              className={`flex items-center justify-between py-5 px-8 hover:bg-[#F8FAFC] transition-colors ${i !== services.length - 1 ? 'border-b border-[#F1F5F9]' : ''}`}
                                            >
                                              <div className="w-1/3">
                                                <div className="text-[15px] font-medium text-[#1E293B] mb-1 leading-none">{svc.name}</div>
                                                {svc.courier_id && (
                                                  <div className="text-[13px] text-[#94A3B8] leading-none">ID: {svc.courier_id}</div>
                                                )}
                                              </div>
                                              <div className="w-1/3 flex justify-center">
                                                <span className="px-4 py-1.5 bg-[#F1F5F9] text-[#1E293B] rounded-full text-[13px] font-medium">
                                                  {svc.courierType === 'Domestic (Air)' ? 'Air' : 'Surface'}
                                                </span>
                                              </div>
                                              <div className="w-1/3 flex justify-end items-center gap-3 pr-8">
                                                <button
                                                  onClick={() => toggleServiceStatus(svc)}
                                                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#00A86B] focus:ring-offset-2 ${
                                                    svc.status === 'Enable' ? 'bg-[#00A86B]' : 'bg-[#EF4444]'
                                                  }`}
                                                >
                                                  <span
                                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
                                                      svc.status === 'Enable' ? 'translate-x-6' : 'translate-x-1'
                                                    }`}
                                                  />
                                                </button>
                                                <button
                                                  onClick={() => setEditServiceData({ ...svc, providerCourier: { ...provider, name, logo } })}
                                                  className="w-8 h-8 flex items-center justify-center rounded-full text-[#94A3B8] hover:text-[#00A86B] hover:bg-[#00A86B]/10 transition-colors"
                                                >
                                                  <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                  onClick={() => handleDeleteService(svc)}
                                                  className="w-8 h-8 flex items-center justify-center rounded-full text-[#94A3B8] hover:text-red-500 hover:bg-red-50 transition-colors"
                                                >
                                                  <Trash2 className="w-4 h-4" />
                                                </button>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="text-center py-8 bg-white rounded-xl border border-[#E2E8F0] border-dashed">
                                        <p className="text-xs font-semibold text-[#94A3B8]">No services configured yet.</p>
                                      </div>
                                    )}
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
                  <tr>
                    <td colSpan={6}>
                      <EmptyState title="No couriers found" />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card List — mobile only */}
        <div className="md:hidden flex-1 overflow-y-auto relative p-2 space-y-2">
          {loading && <TableLoader />}
          {loading ? null : filteredProviders.length > 0 ? (
            filteredProviders.map((provider) => {
              const name = provider.courierName || provider.courierProvider || '';
              const logo = LOGO_MAP[name] || '';
              const isEnabled = provider.status === 'Enable';
              const services = servicesMap[name] || [];
              const isExpanded = expandedProviderId === provider._id;

              return (
                <div key={provider._id} className="relative bg-white rounded-2xl border border-[#E2E8F0] shadow-sm">
                  {/* Ribbon Tag */}
                  <StatusRibbon label={isEnabled ? 'Active' : 'Inactive'} color={isEnabled ? '#00A86B' : '#94A3B8'} />

                  <button
                    onClick={() => setExpandedProviderId(isExpanded ? null : provider._id)}
                    className="w-full pt-8 px-4 pb-4 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white border border-[#E2E8F0] rounded-xl p-2 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                        {logo ? (
                          <img
                            src={logo}
                            alt={name}
                            className="max-w-full max-h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-[13px] font-bold text-[#94A3B8]">${name.charAt(0)}</span>`;
                            }}
                          />
                        ) : (
                          <span className="text-[13px] font-bold text-[#94A3B8]">{name.charAt(0)}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[14px] font-bold text-[#0F172A] truncate">{name}</div>
                        {provider.courierId != null && (
                          <span className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full bg-[#E6F9F2] text-[#009D64] text-[10px] font-bold border border-[#00A86B]/20">
                            #{String(provider.courierId).padStart(2, '0')}
                          </span>
                        )}
                        <span className="inline-block mt-1 px-2 py-0.5 bg-[#F1F5F9] text-[#475569] rounded-full text-[10px] font-bold">
                          Domestic
                        </span>
                      </div>
                      <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isExpanded ? 'rotate-90 text-[#00A86B]' : 'text-[#CBD5E1]'}`} />
                    </div>
                  </button>

                  <div className="px-4 pb-4 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => toggleProviderStatus(provider)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#00A86B] focus:ring-offset-2 ${
                        isEnabled ? 'bg-[#00A86B]' : 'bg-[#EF4444]'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
                          isEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>

                    {activeTab === 'couriers' ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedCourier({ ...provider, name, logo })}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#E2E8F0] text-[12px] font-semibold text-[#475569] bg-white active:bg-[#F8FAFC]"
                        >
                          <Settings className="w-3.5 h-3.5" /> Configure
                        </button>
                        <button
                          onClick={() => handleDeleteProvider(provider)}
                          className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#E2E8F0] text-[#94A3B8] active:text-red-500 active:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setServiceCourier({ ...provider, name, logo })}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#E2E8F0] text-[12px] font-semibold text-[#475569] bg-white active:bg-[#F8FAFC]"
                      >
                        + Add Service
                      </button>
                    )}
                  </div>

                  {/* Expandable Services List */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 350, damping: 30, mass: 0.8 }}
                        className="overflow-hidden border-t border-[#E2E8F0] bg-[#F8FAFC]"
                      >
                        <div className="p-4">
                          {activeTab === 'couriers' ? (
                            provider.apiKey || provider.email ? (
                              <div className="bg-white rounded-xl border border-[#E2E8F0] p-3.5">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <div className="text-[13px] font-semibold text-[#0F172A] truncate">
                                      {provider.email || maskValue(provider.apiKey)}
                                    </div>
                                    <div className="text-[11px] text-[#94A3B8] mt-0.5">Configured Account</div>
                                    <span className="inline-block mt-1.5 px-2 py-0.5 bg-[#F1F5F9] text-[#1E293B] rounded-full text-[10px] font-medium">
                                      {provider.CODDays != null ? `${provider.CODDays} day delivery` : 'No ETA set'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className={`text-xs font-bold ${isEnabled ? 'text-[#00A86B]' : 'text-[#94A3B8]'}`}>
                                      {isEnabled ? 'Active' : 'Inactive'}
                                    </span>
                                    <button
                                      onClick={() => setSelectedCourier({ ...provider, name, logo })}
                                      className="w-8 h-8 flex items-center justify-center rounded-full text-[#94A3B8] active:text-[#00A86B] active:bg-[#00A86B]/10 transition-colors shrink-0"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-6 bg-white rounded-xl border border-[#E2E8F0] border-dashed">
                                <p className="text-xs font-semibold text-[#94A3B8]">No account configured yet.</p>
                              </div>
                            )
                          ) : services.length > 0 ? (
                            <div className="space-y-2.5">
                              {services.map((svc) => {
                                const svcIsEnabled = svc.status === 'Enable';
                                return (
                                  <div key={svc._id} className="bg-white rounded-xl border border-[#E2E8F0] p-3.5">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="min-w-0">
                                        <div className="text-[13px] font-semibold text-[#0F172A] truncate">{svc.name}</div>
                                        {svc.courier_id && (
                                          <div className="text-[11px] text-[#94A3B8] mt-0.5">ID: {svc.courier_id}</div>
                                        )}
                                        <span className="inline-block mt-1.5 px-2 py-0.5 bg-[#F1F5F9] text-[#1E293B] rounded-full text-[10px] font-medium">
                                          {svc.courierType === 'Domestic (Air)' ? 'Air' : 'Surface'}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 shrink-0">
                                        <button
                                          onClick={() => toggleServiceStatus(svc)}
                                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#00A86B] focus:ring-offset-2 ${
                                            svcIsEnabled ? 'bg-[#00A86B]' : 'bg-[#EF4444]'
                                          }`}
                                        >
                                          <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
                                              svcIsEnabled ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                          />
                                        </button>
                                        <button
                                          onClick={() => setEditServiceData({ ...svc, providerCourier: { ...provider, name, logo } })}
                                          className="w-8 h-8 flex items-center justify-center rounded-full text-[#94A3B8] active:text-[#00A86B] active:bg-[#00A86B]/10 transition-colors shrink-0"
                                        >
                                          <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteService(svc)}
                                          className="w-8 h-8 flex items-center justify-center rounded-full text-[#94A3B8] active:text-red-500 active:bg-red-50 transition-colors shrink-0"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-center py-6 bg-white rounded-xl border border-[#E2E8F0] border-dashed">
                              <p className="text-xs font-semibold text-[#94A3B8]">No services configured yet.</p>
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
        </div>

      </div>

      {/* Mobile Filters Bottom Sheet */}
      <AnimatePresence>
        {isMobileFiltersOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[140] md:hidden flex items-end justify-center"
            onClick={() => setIsMobileFiltersOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white rounded-t-3xl border-t border-[#E2E8F0] shadow-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between sticky top-0 bg-white z-10">
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <Filter className="w-5 h-5 text-[#00A86B]" /> Filters
                </h3>
                <button onClick={() => setIsMobileFiltersOpen(false)} className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
                  <select
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B] bg-white"
                    value={statusFilter[0] || ''}
                    onChange={(e) => setStatusFilter(e.target.value ? [e.target.value] : [])}
                  >
                    <option value="">All Status</option>
                    {STATUS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Type</label>
                  <select
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B] bg-white"
                    value={typeFilter[0] || ''}
                    onChange={(e) => setTypeFilter(e.target.value ? [e.target.value] : [])}
                  >
                    <option value="">All Types</option>
                    {TYPE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-[#E2E8F0] flex items-center gap-3 sticky bottom-0 bg-white">
                <button
                  onClick={() => { resetFilters(); setIsMobileFiltersOpen(false); }}
                  className="flex-1 h-11 rounded-full border border-[#E2E8F0] text-[#475569] text-sm font-bold hover:bg-[#F8FAFC] transition-colors"
                >
                  Reset All
                </button>
                <button
                  onClick={() => { applyFilters(); setIsMobileFiltersOpen(false); }}
                  className="flex-1 h-11 rounded-full bg-[#009D64] text-white text-sm font-bold hover:bg-[#009B63] transition-colors shadow-sm"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfigureCourierModal
        isOpen={!!selectedCourier}
        onClose={() => setSelectedCourier(null)}
        courier={selectedCourier}
        onSave={handleConfigureSave}
      />

      <AddServiceModal
        isOpen={!!serviceCourier}
        onClose={() => setServiceCourier(null)}
        courier={serviceCourier}
        onSuccess={() => { fetchAll(); setServiceCourier(null); }}
      />

      <AddServiceModal
        isOpen={!!editServiceData}
        onClose={() => setEditServiceData(null)}
        courier={editServiceData?.providerCourier || null}
        editData={editServiceData}
        onSuccess={() => { fetchAll(); setEditServiceData(null); }}
      />

      <AddCourierModal
        isOpen={showAddCourier}
        onClose={() => setShowAddCourier(false)}
        onSuccess={() => { fetchAll(); setShowAddCourier(false); }}
      />
    </AdminLayout>
  );
}
