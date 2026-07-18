import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { Search, ChevronRight, Settings, Trash2, Pencil, Filter, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfigureCourierModal } from '../../components/admin/couriers/ConfigureCourierModal';
import { AddServiceModal } from '../../components/admin/couriers/AddServiceModal';
import { AddCourierModal } from '../../components/admin/couriers/AddCourierModal';
import { apiClient } from '../../services/apiClient';

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

export function AdminCouriers() {
  const [providers, setProviders] = useState<any[]>([]);
  const [servicesMap, setServicesMap] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [typeFilter, setTypeFilter] = useState('All Types');

  const [selectedCourier, setSelectedCourier] = useState<any | null>(null);
  const [serviceCourier, setServiceCourier] = useState<any | null>(null);
  const [expandedProviderId, setExpandedProviderId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'couriers' | 'services'>('couriers');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [showAddCourier, setShowAddCourier] = useState(false);
  const [editServiceData, setEditServiceData] = useState<any | null>(null);


  useEffect(() => {
    fetchAll();
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

  const filteredProviders = providers.filter(p => {
    const name = p.courierName || p.courierProvider || '';
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'All Status' ||
      (statusFilter === 'Active' && p.status === 'Enable') ||
      (statusFilter === 'Inactive' && p.status === 'Disable');
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header Tabs */}
        <div className="border-b border-[#E2E8F0]">
          <div className="flex gap-6 md:gap-8 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('couriers')}
              className={`px-1 py-4 text-sm font-bold transition-colors whitespace-nowrap ${activeTab === 'couriers' ? 'text-[#00A86B] border-b-2 border-[#00A86B]' : 'text-[#64748B] hover:text-[#0F172A]'}`}
            >
              Couriers
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={`px-1 py-4 text-sm font-bold transition-colors whitespace-nowrap ${activeTab === 'services' ? 'text-[#00A86B] border-b-2 border-[#00A86B]' : 'text-[#64748B] hover:text-[#0F172A]'}`}
            >
              Courier Services
            </button>
          </div>
        </div>

        {/* Filters & Search — desktop */}
        <div className="hidden md:flex bg-white rounded-xl border border-[#E2E8F0] p-4 flex-col md:flex-row gap-4">
          <div className="flex gap-4">
            <select
              className="h-10 px-4 border border-[#E2E8F0] rounded-xl text-sm font-medium text-[#0F172A] outline-none focus:border-[#00A86B] min-w-[140px] appearance-none bg-white"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option>All Status</option>
              <option>Active</option>
              <option>Inactive</option>
            </select>

            <select
              className="h-10 px-4 border border-[#E2E8F0] rounded-xl text-sm font-medium text-[#0F172A] outline-none focus:border-[#00A86B] min-w-[140px] appearance-none bg-white"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option>All Types</option>
              <option>Domestic</option>
            </select>
          </div>

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Search by courier name"
              className="w-full h-10 pl-10 pr-4 border border-[#E2E8F0] rounded-xl text-sm outline-none focus:border-[#00A86B] text-[#0F172A]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button
            onClick={() => setShowAddCourier(true)}
            className="ml-auto h-10 px-5 rounded-xl text-sm font-semibold text-white bg-[#00A86B] hover:bg-[#009B63] transition-colors shrink-0"
          >
            + Add Courier
          </button>
        </div>

        {/* Filters & Search — mobile */}
        <div className="md:hidden flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Search by courier name"
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-[#E2E8F0] bg-white text-sm outline-none focus:border-[#00A86B] text-[#0F172A]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            onClick={() => setIsMobileFiltersOpen(true)}
            className="flex items-center gap-1.5 h-10 px-4 rounded-xl bg-[#00A86B] text-white text-[12px] font-bold shadow-sm shrink-0"
          >
            <Filter className="w-3.5 h-3.5" /> Filters
          </button>
        </div>

        {/* Table — desktop only */}
        <div className="hidden md:block bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                  <th className="py-4 px-6 text-xs font-bold text-[#64748B] uppercase tracking-wider w-20">S.NO.</th>
                  <th className="py-4 px-6 text-xs font-bold text-[#64748B] uppercase tracking-wider">COURIER NAME</th>
                  <th className="py-4 px-6 text-xs font-bold text-[#64748B] uppercase tracking-wider text-center">TYPE</th>
                  <th className="py-4 px-6 text-xs font-bold text-[#64748B] uppercase tracking-wider text-center">STATUS</th>
                  <th className="py-4 px-6 text-xs font-bold text-[#64748B] uppercase tracking-wider text-center">ACTION</th>
                  <th className="py-4 px-6 text-xs font-bold text-[#64748B] uppercase tracking-wider text-right">
                    {activeTab === 'couriers' ? 'CONFIGURE' : 'ADD SERVICE'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <div className="text-sm font-semibold text-[#94A3B8]">Loading...</div>
                    </td>
                  </tr>
                ) : filteredProviders.length > 0 ? (
                  filteredProviders.map((provider, index) => {
                    const name = provider.courierName || provider.courierProvider || '';
                    const logo = LOGO_MAP[name] || '';
                    const isEnabled = provider.status === 'Enable';
                    const services = servicesMap[name] || [];
                    const isExpanded = expandedProviderId === provider._id && activeTab === 'services';

                    return (
                      <React.Fragment key={provider._id}>
                        <tr
                          className={`border-b border-[#E2E8F0] hover:bg-[#F8FAFC]/50 transition-colors ${activeTab === 'services' ? 'cursor-pointer' : ''} ${isExpanded ? 'bg-[#F8FAFC]' : ''}`}
                          onClick={() => activeTab === 'services' && setExpandedProviderId(isExpanded ? null : provider._id)}
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-semibold text-[#64748B]">{index + 1}</span>
                              {activeTab === 'services' && (
                                <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90 text-[#00A86B]' : 'text-[#CBD5E1]'}`} />
                              )}
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
                                {activeTab === 'services' && (
                                  <div className="text-xs text-[#94A3B8] mt-0.5">
                                    {services.length} service{services.length !== 1 ? 's' : ''}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex justify-center">
                              <span className="px-3 py-1 bg-[#F1F5F9] text-[#475569] rounded-full text-xs font-bold">Domestic</span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                              <span className={`text-sm font-bold ${isEnabled ? 'text-[#00A86B]' : 'text-[#94A3B8]'}`}>
                                {isEnabled ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => toggleProviderStatus(provider)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#00A86B] focus:ring-offset-2 ${
                                  isEnabled ? 'bg-[#1E1B4B]' : 'bg-[#E2E8F0]'
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

                        {/* Expandable Services Row — Services tab only */}
                        <AnimatePresence initial={false}>
                          {activeTab === 'services' && isExpanded && (
                            <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] overflow-hidden">
                              <td colSpan={6} className="p-0">
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ type: 'spring', stiffness: 350, damping: 30, mass: 0.8 }}
                                  className="overflow-hidden"
                                >
                                  <div className="py-6 px-12">
                                    {services.length > 0 ? (
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
                                                    svc.status === 'Enable' ? 'bg-[#1E1B4B]' : 'bg-[#E2E8F0]'
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
                    <td colSpan={6} className="py-12 text-center">
                      <div className="text-sm font-semibold text-[#64748B]">No couriers found</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card List — mobile only */}
        <div className="md:hidden space-y-4">
          {filteredProviders.length > 0 ? (
            filteredProviders.map((provider) => {
              const name = provider.courierName || provider.courierProvider || '';
              const logo = LOGO_MAP[name] || '';
              const isEnabled = provider.status === 'Enable';
              const services = servicesMap[name] || [];
              const isExpanded = expandedProviderId === provider._id && activeTab === 'services';
              
              return (
                <div key={provider._id} className="relative bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
                  {/* Ribbon Tag */}
                  <div
                    className={`absolute top-0 left-0 px-3.5 py-1 text-[10px] font-bold text-white uppercase tracking-wide ${isEnabled ? 'bg-[#00A86B]' : 'bg-[#94A3B8]'}`}
                    style={{ clipPath: 'polygon(0 0, 100% 0, 84% 100%, 0% 100%)' }}
                  >
                    {isEnabled ? 'Active' : 'Inactive'}
                  </div>

                  <button
                    onClick={() => activeTab === 'services' && setExpandedProviderId(isExpanded ? null : provider._id)}
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
                        <span className="inline-block mt-1 px-2 py-0.5 bg-[#F1F5F9] text-[#475569] rounded-full text-[10px] font-bold">
                          Domestic
                        </span>
                      </div>
                      {activeTab === 'services' && (
                        <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isExpanded ? 'rotate-90 text-[#00A86B]' : 'text-[#CBD5E1]'}`} />
                      )}
                    </div>
                  </button>

                  <div className="px-4 pb-4 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => toggleProviderStatus(provider)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#00A86B] focus:ring-offset-2 ${
                        isEnabled ? 'bg-[#1E1B4B]' : 'bg-[#E2E8F0]'
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
                    {activeTab === 'services' && isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 350, damping: 30, mass: 0.8 }}
                        className="overflow-hidden border-t border-[#E2E8F0] bg-[#F8FAFC]"
                      >
                        <div className="p-4">
                          {services.length > 0 ? (
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
                                            svcIsEnabled ? 'bg-[#1E1B4B]' : 'bg-[#E2E8F0]'
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
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option>All Status</option>
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Type</label>
                  <select
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B] bg-white"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                  >
                    <option>All Types</option>
                    <option>Domestic</option>
                  </select>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-[#E2E8F0] flex items-center gap-3 sticky bottom-0 bg-white">
                <button
                  onClick={() => { setStatusFilter('All Status'); setTypeFilter('All Types'); }}
                  className="flex-1 h-11 rounded-full border border-[#E2E8F0] text-[#475569] text-sm font-bold hover:bg-[#F8FAFC] transition-colors"
                >
                  Reset All
                </button>
                <button
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="flex-1 h-11 rounded-full bg-[#00A86B] text-white text-sm font-bold hover:bg-[#009B63] transition-colors shadow-sm"
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
