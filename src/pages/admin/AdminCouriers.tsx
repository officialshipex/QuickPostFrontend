import React, { useState } from 'react';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { Search, ChevronRight, Settings, Trash2, Filter, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfigureCourierModal } from '../../components/admin/couriers/ConfigureCourierModal';
import { AddServiceModal } from '../../components/admin/couriers/AddServiceModal';

const INITIAL_COURIERS = [
  { id: 1, name: 'Amazon Shipping', logo: '/brands/amazon.png', couriersCount: 3, type: 'Domestic', status: 'Active' },
  { id: 2, name: 'Delhivery', logo: '/brands/delhivery.png', couriersCount: 12, type: 'Domestic', status: 'Active' },
  { id: 3, name: 'DTDC', logo: '/brands/dtdc.png', couriersCount: 7, type: 'Domestic', status: 'Inactive' },
  { id: 4, name: 'Ekart', logo: '/brands/ekart.png', couriersCount: 8, type: 'Domestic', status: 'Active' },
  { id: 5, name: 'Lousung360', logo: '/brands/losung.jpg', couriersCount: 2, type: 'Domestic', status: 'Inactive' },
  { id: 6, name: 'Shadowfax', logo: '/brands/shadowfax.png', couriersCount: 5, type: 'Domestic', status: 'Inactive' },
  { id: 7, name: 'Shiprocket', logo: '/brands/shiprocket.jpg', couriersCount: 6, type: 'Domestic', status: 'Active' },
  { id: 8, name: 'Shree Maruti', logo: '/brands/shree_maruti.jpg', couriersCount: 4, type: 'Domestic', status: 'Inactive' },
  { id: 9, name: 'XpressBees', logo: '/brands/xpressbees.png', couriersCount: 9, type: 'Domestic', status: 'Inactive' },
];

const MOCK_ACCOUNTS: Record<number, any[]> = {
  1: [
    { id: 101, name: 'Amazon Shipping', weight: '500 g', type: 'Surface', status: 'Active' },
    { id: 1011, name: 'Amazon Shipping 1 KG', weight: '1 kg', type: 'Surface', status: 'Active' },
    { id: 1012, name: 'Amazon Shipping 2 KG', weight: '2 kg', type: 'Surface', status: 'Active' },
  ],
  2: [
    { id: 102, name: 'Delhivery B2B Direct', weight: '5 kg', type: 'Surface', status: 'Active' },
    { id: 103, name: 'Delhivery Heavy', weight: '10 kg', type: 'Air', status: 'Active' },
  ],
  4: [
    { id: 104, name: 'Ekart Standard', weight: '1 kg', type: 'Surface', status: 'Active' },
  ],
  7: [
    { id: 105, name: 'Shiprocket Pro', weight: '2 kg', type: 'Surface', status: 'Active' },
  ],
};

const INITIAL_SERVICES: Record<number, any[]> = {
  1: [
    { id: 201, name: 'Amazon Standard', type: 'Surface', status: 'Active' },
    { id: 202, name: 'Amazon Prime Air', type: 'Air', status: 'Active' },
  ],
  2: [
    { id: 203, name: 'Delhivery Surface', type: 'Surface', status: 'Active' },
    { id: 204, name: 'Delhivery Express', type: 'Air', status: 'Active' },
  ],
  7: [
    { id: 205, name: 'Shiprocket Lite', type: 'Surface', status: 'Active' },
  ]
};

export function AdminCouriers() {
  const [couriers, setCouriers] = useState(INITIAL_COURIERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [selectedCourier, setSelectedCourier] = useState<any | null>(null);
  const [serviceCourier, setServiceCourier] = useState<any | null>(null);
  const [expandedCourierId, setExpandedCourierId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'couriers' | 'services'>('couriers');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [servicesMap, setServicesMap] = useState<Record<number, any[]>>(() => {
    const stored = localStorage.getItem('admin_services_map');
    return stored ? JSON.parse(stored) : INITIAL_SERVICES;
  });

  React.useEffect(() => {
    localStorage.setItem('admin_services_map', JSON.stringify(servicesMap));
  }, [servicesMap]);

  const toggleCourierStatus = (id: number) => {
    const items = activeTab === 'couriers' ? (MOCK_ACCOUNTS[id] || []) : (servicesMap[id] || []);
    if (items.length === 0) return; // Prevent toggling if no items are configured
    
    setCouriers(prev => prev.map(c => 
      c.id === id ? { ...c, status: c.status === 'Active' ? 'Inactive' : 'Active' } : c
    ));
  };

  const handleDeleteService = (courierId: number, serviceId: number) => {
    setServicesMap(prev => ({
      ...prev,
      [courierId]: prev[courierId]?.filter(s => s.id !== serviceId) || []
    }));
  };

  const toggleServiceStatus = (courierId: number, serviceId: number) => {
    setServicesMap(prev => ({
      ...prev,
      [courierId]: prev[courierId]?.map(s => 
        s.id === serviceId ? { ...s, status: s.status === 'Active' ? 'Inactive' : 'Active' } : s
      ) || []
    }));
  };

  const filteredCouriers = couriers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All Status' || c.status === statusFilter;
    const matchesType = typeFilter === 'All Types' || c.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
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
                  <th className="py-4 px-6 text-xs font-bold text-[#64748B] uppercase tracking-wider text-right">{activeTab === 'couriers' ? 'CONFIGURE' : 'ADD SERVICE'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredCouriers.length > 0 ? (
                  filteredCouriers.map((courier, index) => {
                    const isExpanded = expandedCourierId === courier.id;
                    const items = activeTab === 'couriers' ? (MOCK_ACCOUNTS[courier.id] || []) : (servicesMap[courier.id] || []);

                    return (
                      <React.Fragment key={courier.id}>
                        <tr 
                          className={`border-b border-[#E2E8F0] hover:bg-[#F8FAFC]/50 transition-colors cursor-pointer ${isExpanded ? 'bg-[#F8FAFC]' : ''}`}
                          onClick={() => setExpandedCourierId(isExpanded ? null : courier.id)}
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
                                <img 
                                  src={courier.logo} 
                                  alt={courier.name} 
                                  className="max-w-full max-h-full object-contain"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-[15px] font-bold text-[#94A3B8]">${courier.name.charAt(0)}</span>`;
                                  }}
                                />
                              </div>
                              <div>
                                <div className="text-[15px] font-extrabold text-[#0F172A]">{courier.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex justify-center">
                              <span className="px-3 py-1 bg-[#F1F5F9] text-[#475569] rounded-full text-xs font-bold">
                                {courier.type}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                              <span className={`text-sm font-bold ${courier.status === 'Active' ? 'text-[#00A86B]' : 'text-[#94A3B8]'}`}>
                                {courier.status}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                              <button 
                                onClick={() => toggleCourierStatus(courier.id)}
                                disabled={items.length === 0}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#00A86B] focus:ring-offset-2 ${
                                  items.length === 0 
                                    ? 'bg-[#E2E8F0] opacity-50 cursor-not-allowed' 
                                    : courier.status === 'Active' 
                                      ? 'bg-[#1E1B4B]' 
                                      : 'bg-[#E2E8F0]'
                                }`}
                              >
                                <span 
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
                                    items.length === 0 
                                      ? 'translate-x-1 bg-[#94A3B8]' 
                                      : courier.status === 'Active' 
                                        ? 'translate-x-6' 
                                        : 'translate-x-1'
                                  }`}
                                />
                              </button>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                              {activeTab === 'couriers' ? (
                                <button 
                                  onClick={() => setSelectedCourier(courier)}
                                  className="text-sm font-semibold text-[#64748B] hover:text-[#00A86B] transition-colors flex items-center gap-1"
                                >
                                  <Settings className="w-4 h-4" /> Configure
                                </button>
                              ) : (
                                <button 
                                  onClick={() => setServiceCourier(courier)}
                                  className="text-sm font-semibold text-[#64748B] hover:text-[#00A86B] transition-colors flex items-center gap-1"
                                >
                                  + Add Service
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        
                        {/* Expandable Accounts Row */}
                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] shadow-inner overflow-hidden">
                              <td colSpan={6} className="p-0">
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ type: "spring", stiffness: 350, damping: 30, mass: 0.8 }}
                                  className="overflow-hidden"
                                >
                                  <div className="py-6 px-12">
                                    {items.length > 0 ? (
                                      <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                                        <div className="flex flex-col">
                                          {items.map((acc, i) => (
                                            <div key={acc.id} className={`flex items-center justify-between py-5 px-8 hover:bg-[#F8FAFC] transition-colors ${i !== items.length - 1 ? 'border-b border-[#F1F5F9]' : ''}`}>
                                              <div className="w-1/3">
                                                <div className="text-[15px] font-medium text-[#1E293B] mb-1 leading-none">{acc.name}</div>
                                                {acc.weight && <div className="text-[13px] text-[#94A3B8] leading-none">{acc.weight}</div>}
                                              </div>
                                              <div className="w-1/3 flex justify-center">
                                                <span className="px-4 py-1.5 bg-[#F1F5F9] text-[#1E293B] rounded-full text-[13px] font-medium">
                                                  {acc.type || 'Surface'}
                                                </span>
                                              </div>
                                              <div className="w-1/3 flex justify-end items-center gap-4 pr-8">
                                                {activeTab === 'services' ? (
                                                  <button 
                                                    onClick={() => toggleServiceStatus(courier.id, acc.id)}
                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#00A86B] focus:ring-offset-2 ${
                                                      acc.status === 'Active' ? 'bg-[#1E1B4B]' : 'bg-[#E2E8F0]'
                                                    }`}
                                                  >
                                                    <span 
                                                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
                                                        acc.status === 'Active' ? 'translate-x-6' : 'translate-x-1'
                                                      }`}
                                                    />
                                                  </button>
                                                ) : (
                                                  <span className={`text-[15px] font-semibold ${acc.status === 'Active' ? 'text-[#00A86B]' : 'text-[#94A3B8]'}`}>
                                                    {acc.status}
                                                  </span>
                                                )}
                                                {activeTab === 'services' && (
                                                  <button 
                                                    onClick={() => handleDeleteService(courier.id, acc.id)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-full text-[#94A3B8] hover:text-red-500 hover:bg-red-50 transition-colors"
                                                  >
                                                    <Trash2 className="w-4 h-4" />
                                                  </button>
                                                )}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="text-center py-8 bg-white rounded-xl border border-[#E2E8F0] border-dashed">
                                        <p className="text-xs font-semibold text-[#94A3B8]">No {activeTab === 'couriers' ? 'accounts' : 'services'} configured yet.</p>
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
          {filteredCouriers.length > 0 ? (
            filteredCouriers.map((courier) => {
              const isExpanded = expandedCourierId === courier.id;
              const items = activeTab === 'couriers' ? (MOCK_ACCOUNTS[courier.id] || []) : (servicesMap[courier.id] || []);
              return (
                <div key={courier.id} className="relative bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
                  {/* Ribbon Tag */}
                  <div
                    className={`absolute top-0 left-0 px-3.5 py-1 text-[10px] font-bold text-white uppercase tracking-wide ${courier.status === 'Active' ? 'bg-[#00A86B]' : 'bg-[#94A3B8]'}`}
                    style={{ clipPath: 'polygon(0 0, 100% 0, 84% 100%, 0% 100%)' }}
                  >
                    {courier.status}
                  </div>

                  <button
                    onClick={() => setExpandedCourierId(isExpanded ? null : courier.id)}
                    className="w-full pt-8 px-4 pb-4 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white border border-[#E2E8F0] rounded-xl p-2 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                        <img
                          src={courier.logo}
                          alt={courier.name}
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-[13px] font-bold text-[#94A3B8]">${courier.name.charAt(0)}</span>`;
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[14px] font-bold text-[#0F172A] truncate">{courier.name}</div>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-[#F1F5F9] text-[#475569] rounded-full text-[10px] font-bold">
                          {courier.type}
                        </span>
                      </div>
                      <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isExpanded ? 'rotate-90 text-[#00A86B]' : 'text-[#CBD5E1]'}`} />
                    </div>
                  </button>

                  <div className="px-4 pb-4 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => toggleCourierStatus(courier.id)}
                      disabled={items.length === 0}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#00A86B] focus:ring-offset-2 ${
                        items.length === 0
                          ? 'bg-[#E2E8F0] opacity-50 cursor-not-allowed'
                          : courier.status === 'Active'
                            ? 'bg-[#1E1B4B]'
                            : 'bg-[#E2E8F0]'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
                          items.length === 0
                            ? 'translate-x-1 bg-[#94A3B8]'
                            : courier.status === 'Active'
                              ? 'translate-x-6'
                              : 'translate-x-1'
                        }`}
                      />
                    </button>

                    {activeTab === 'couriers' ? (
                      <button
                        onClick={() => setSelectedCourier(courier)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#E2E8F0] text-[12px] font-semibold text-[#475569] bg-white active:bg-[#F8FAFC]"
                      >
                        <Settings className="w-3.5 h-3.5" /> Configure
                      </button>
                    ) : (
                      <button
                        onClick={() => setServiceCourier(courier)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#E2E8F0] text-[12px] font-semibold text-[#475569] bg-white active:bg-[#F8FAFC]"
                      >
                        + Add Service
                      </button>
                    )}
                  </div>

                  {/* Expandable Accounts/Services List */}
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
                          {items.length > 0 ? (
                            <div className="space-y-2.5">
                              {items.map((acc) => (
                                <div key={acc.id} className="bg-white rounded-xl border border-[#E2E8F0] p-3.5">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                      <div className="text-[13px] font-semibold text-[#0F172A] truncate">{acc.name}</div>
                                      {acc.weight && <div className="text-[11px] text-[#94A3B8] mt-0.5">{acc.weight}</div>}
                                      <span className="inline-block mt-1.5 px-2 py-0.5 bg-[#F1F5F9] text-[#1E293B] rounded-full text-[10px] font-medium">
                                        {acc.type || 'Surface'}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      {activeTab === 'services' ? (
                                        <button
                                          onClick={() => toggleServiceStatus(courier.id, acc.id)}
                                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#00A86B] focus:ring-offset-2 ${
                                            acc.status === 'Active' ? 'bg-[#1E1B4B]' : 'bg-[#E2E8F0]'
                                          }`}
                                        >
                                          <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
                                              acc.status === 'Active' ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                          />
                                        </button>
                                      ) : (
                                        <span className={`text-[12px] font-semibold ${acc.status === 'Active' ? 'text-[#00A86B]' : 'text-[#94A3B8]'}`}>
                                          {acc.status}
                                        </span>
                                      )}
                                      {activeTab === 'services' && (
                                        <button
                                          onClick={() => handleDeleteService(courier.id, acc.id)}
                                          className="w-8 h-8 flex items-center justify-center rounded-full text-[#94A3B8] active:text-red-500 active:bg-red-50 transition-colors shrink-0"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-6 bg-white rounded-xl border border-[#E2E8F0] border-dashed">
                              <p className="text-xs font-semibold text-[#94A3B8]">No {activeTab === 'couriers' ? 'accounts' : 'services'} configured yet.</p>
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
      />

      <AddServiceModal
        isOpen={!!serviceCourier}
        onClose={() => setServiceCourier(null)}
        courier={serviceCourier}
        onAdd={(servicesToAdd) => {
          if (serviceCourier) {
            setServicesMap(prev => ({
              ...prev,
              [serviceCourier.id]: [
                ...(prev[serviceCourier.id] || []),
                ...servicesToAdd.map(s => ({
                  id: Math.floor(Math.random() * 100000),
                  name: s.name,
                  type: s.type,
                  status: 'Active'
                }))
              ]
            }));
          }
        }}
      />
    </AdminLayout>
  );
}
