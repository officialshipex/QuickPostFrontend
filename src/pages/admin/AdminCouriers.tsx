import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { Search, ChevronRight, Settings, Trash2 } from 'lucide-react';
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
  const [selectedCourier, setSelectedCourier] = useState<any | null>(null);
  const [serviceCourier, setServiceCourier] = useState<any | null>(null);
  const [expandedProviderId, setExpandedProviderId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'couriers' | 'services'>('couriers');
  const [showAddCourier, setShowAddCourier] = useState(false);

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
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('couriers')}
              className={`px-1 py-4 text-sm font-bold transition-colors ${activeTab === 'couriers' ? 'text-[#00A86B] border-b-2 border-[#00A86B]' : 'text-[#64748B] hover:text-[#0F172A]'}`}
            >
              Couriers
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={`px-1 py-4 text-sm font-bold transition-colors ${activeTab === 'services' ? 'text-[#00A86B] border-b-2 border-[#00A86B]' : 'text-[#64748B] hover:text-[#0F172A]'}`}
            >
              Courier Services
            </button>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 flex flex-col md:flex-row gap-4 items-center">
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

        {/* Table */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
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
                            <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                              {activeTab === 'couriers' ? (
                                <button
                                  onClick={() => setSelectedCourier({ ...provider, name, logo })}
                                  className="text-sm font-semibold text-[#64748B] hover:text-[#00A86B] transition-colors flex items-center gap-1"
                                >
                                  <Settings className="w-4 h-4" /> Configure
                                </button>
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
                                              <div className="w-1/3 flex justify-end items-center gap-4 pr-8">
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

      </div>

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

      <AddCourierModal
        isOpen={showAddCourier}
        onClose={() => setShowAddCourier(false)}
        onSuccess={() => { fetchAll(); setShowAddCourier(false); }}
      />
    </AdminLayout>
  );
}
