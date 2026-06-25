import React, { useState } from 'react';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { Search, ChevronRight, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const INITIAL_COURIERS = [
  { id: 1, name: 'Amazon Shipping', logo: '/brands/amazon.png', type: 'Domestic', status: 'Active' },
  { id: 2, name: 'Delhivery', logo: '/brands/delhivery.png', type: 'Domestic', status: 'Active' },
  { id: 3, name: 'DTDC', logo: '/brands/dtdc.png', type: 'Domestic', status: 'Inactive' },
  { id: 4, name: 'Ekart', logo: '/brands/ekart.png', type: 'Domestic', status: 'Active' },
  { id: 5, name: 'Lousung360', logo: '/brands/losung.jpg', type: 'Domestic', status: 'Inactive' },
  { id: 6, name: 'Shadowfax', logo: '/brands/shadowfax.png', type: 'Domestic', status: 'Inactive' },
  { id: 7, name: 'Shiprocket', logo: '/brands/shiprocket.jpg', type: 'Domestic', status: 'Active' },
  { id: 8, name: 'Shree Maruti', logo: '/brands/shree_maruti.jpg', type: 'Domestic', status: 'Inactive' },
  { id: 9, name: 'XpressBees', logo: '/brands/xpressbees.png', type: 'Domestic', status: 'Inactive' },
];

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

const PLANS = [
  'Bennys bowl',
  'ROUTEXMITRA - PREMIUM CUSTOM',
  'Premium',
  'Elite',
  'Titanium',
  'Diamond',
  'Platinum',
  'Gold',
  'Silver',
  'Bronze',
  'testing'
];

export function AdminRateCard() {
  const [couriers] = useState(INITIAL_COURIERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [selectedPlan, setSelectedPlan] = useState(PLANS[0]);
  const [isPlanDropdownOpen, setIsPlanDropdownOpen] = useState(false);
  const [expandedCourierId, setExpandedCourierId] = useState<number | null>(null);
  const [servicesMap, setServicesMap] = useState<Record<number, any[]>>(() => {
    const stored = localStorage.getItem('admin_services_map');
    return stored ? JSON.parse(stored) : INITIAL_SERVICES;
  });

  React.useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'admin_services_map' && e.newValue) {
        setServicesMap(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  const [ratesMap, setRatesMap] = useState<Record<string, Record<number, Record<number, any>>>>({});
  const [activeServiceIds, setActiveServiceIds] = useState<Record<number, number>>({});

  const filteredCouriers = couriers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All Status' || c.status === statusFilter;
    const matchesType = typeFilter === 'All Types' || c.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleRateChange = (courierId: number, serviceId: number, field: string, value: any) => {
    setRatesMap(prev => {
      const planRates = prev[selectedPlan] || {};
      const courierRates = planRates[courierId] || {};
      const serviceRates = courierRates[serviceId] || {};
      
      return {
        ...prev,
        [selectedPlan]: {
          ...planRates,
          [courierId]: {
            ...courierRates,
            [serviceId]: {
              ...serviceRates,
              [field]: value
            }
          }
        }
      };
    });
  };

  const handleServiceSelect = (courierId: number, serviceId: number) => {
    setActiveServiceIds(prev => ({ ...prev, [courierId]: serviceId }));
  };

  const handleSaveRates = (courierId: number) => {
    // In a real app, you would send this to your backend
    const ratesToSave = (ratesMap[selectedPlan] || {})[courierId] || {};
    console.log(`Saving rates for Courier ${courierId} under Plan ${selectedPlan}:`, ratesToSave);
    
    // Simulate a success visual feedback
    const btn = document.getElementById(`save-btn-${courierId}`);
    if (btn) {
      const originalText = btn.innerHTML;
      btn.innerHTML = 'Saved Successfully!';
      btn.style.backgroundColor = '#10B981';
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.backgroundColor = '';
      }, 2000);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header Tabs */}
        <div className="border-b border-[#E2E8F0]">
          <div className="flex gap-8">
            <button className="px-1 py-4 text-sm font-bold text-[#00A86B] border-b-2 border-[#00A86B]">
              Rate Card Management
            </button>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 flex flex-col md:flex-row gap-4">
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

          {/* Custom Animated Plan Dropdown */}
          <div className="relative min-w-[240px]">
            <button
              onClick={() => setIsPlanDropdownOpen(!isPlanDropdownOpen)}
              className={`w-full h-10 px-4 border rounded-xl text-sm font-bold transition-all flex items-center justify-between ${
                isPlanDropdownOpen 
                  ? 'border-[#00A86B] ring-1 ring-[#00A86B]/20 bg-white text-[#00A86B]' 
                  : 'border-[#E2E8F0] bg-white text-[#0F172A] hover:border-[#00A86B] hover:text-[#00A86B]'
              }`}
            >
              <span className="truncate pr-2">{selectedPlan}</span>
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
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute top-[calc(100%+8px)] left-0 w-full bg-white border border-[#E2E8F0] rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] z-20 overflow-hidden py-1.5"
                  >
                    <div className="max-h-[280px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                      {PLANS.map(plan => (
                        <button
                          key={plan}
                          onClick={() => {
                            setSelectedPlan(plan);
                            setIsPlanDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-[13px] transition-colors flex items-center justify-between ${
                            selectedPlan === plan 
                              ? 'bg-[#F0FDF4] text-[#00A86B] font-bold' 
                              : 'text-[#475569] font-semibold hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                          }`}
                        >
                          <span className="truncate">{plan}</span>
                          {selectedPlan === plan && (
                            <svg className="w-4 h-4 text-[#00A86B] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
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
                  <th className="py-4 px-6 text-xs font-bold text-[#64748B] uppercase tracking-wider text-right">SERVICES COUNT</th>
                </tr>
              </thead>
              <tbody>
                {filteredCouriers.length > 0 ? (
                  filteredCouriers.map((courier, index) => {
                    const isExpanded = expandedCourierId === courier.id;
                    const items = servicesMap[courier.id] || [];

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
                            <div className="flex justify-end pr-4 text-sm font-semibold text-[#64748B]">
                              {items.length} {items.length === 1 ? 'Service' : 'Services'}
                            </div>
                          </td>
                        </tr>
                        
                        {/* Expandable Rate Card Row */}
                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] shadow-inner overflow-hidden">
                              <td colSpan={5} className="p-0">
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ type: "spring", stiffness: 350, damping: 30, mass: 0.8 }}
                                  className="overflow-hidden"
                                >
                                  <div className="py-6 px-8">
                                    <div className="bg-white rounded-[20px] border border-[#E2E8F0] p-7 shadow-[0_2px_16px_rgba(0,0,0,0.02)]">
                                      {items.length > 0 ? (
                                        <div className="overflow-x-auto rounded-2xl overflow-hidden border border-[#E2E8F0] shadow-sm bg-white">
                                          <table className="w-full text-left border-collapse min-w-[1000px]">
                                            <thead>
                                              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                                                <th className="py-4 px-5 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Courier Service</th>
                                                <th className="py-4 px-5 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Mode</th>
                                                <th className="py-4 px-5 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Weight (in kg)</th>
                                                <th className="py-4 px-5 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Zone A</th>
                                                <th className="py-4 px-5 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Zone B</th>
                                                <th className="py-4 px-5 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Zone C</th>
                                                <th className="py-4 px-5 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Zone D</th>
                                                <th className="py-4 px-5 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Zone E</th>
                                                <th className="py-4 px-5 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">COD</th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#E2E8F0]">
                                              {items.map(s => {
                                                const currentRates = ((ratesMap[selectedPlan] || {})[courier.id] || {})[s.id] || {};
                                                return (
                                                  <React.Fragment key={s.id}>
                                                    <tr className="hover:bg-[#F8FAFC]/50 transition-colors">
                                                      <td className="py-4 px-5" rowSpan={2} style={{ verticalAlign: 'top', paddingTop: '1.25rem' }}>
                                                        <div className="font-bold text-[13px] text-[#0F172A]">{s.name}</div>
                                                        <div className="mt-3 flex items-center gap-2">
                                                          <button
                                                            type="button"
                                                            onClick={() => handleRateChange(courier.id, s.id, 'isFlatRate', !currentRates.isFlatRate)}
                                                            className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors ${currentRates.isFlatRate ? 'bg-[#00A86B]' : 'bg-[#CBD5E1]'}`}
                                                          >
                                                            <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${currentRates.isFlatRate ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                                                          </button>
                                                          <span className="text-[11px] font-semibold text-[#64748B] whitespace-nowrap">Is Flat Rate?</span>
                                                        </div>
                                                      </td>
                                                      <td className="py-4 px-5 text-[13px] text-[#64748B] font-medium" rowSpan={2} style={{ verticalAlign: 'top', paddingTop: '1.25rem' }}>{s.type}</td>
                                                      
                                                      <td className="py-3 px-5">
                                                        <div className="flex items-center gap-2">
                                                          <span className="text-[12px] font-bold text-[#64748B] w-10">Basic:</span>
                                                          <div className="relative">
                                                            <input type="number" value={currentRates.basicWeight || ''} onChange={(e) => handleRateChange(courier.id, s.id, 'basicWeight', e.target.value)} className="w-16 h-8 px-2 bg-white border border-[#E2E8F0] rounded-md text-[13px] font-semibold text-[#0F172A] focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]/20 focus:outline-none transition-all placeholder:font-normal placeholder:text-[#94A3B8]" />
                                                            <span className="absolute -right-5 top-1/2 -translate-y-1/2 text-[10px] font-medium text-[#64748B]">gm</span>
                                                          </div>
                                                        </div>
                                                      </td>
                                                      <td className="py-3 px-5"><div className="relative"><span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-[#94A3B8]">₹</span><input type="number" value={currentRates.basicZoneA || ''} onChange={(e) => handleRateChange(courier.id, s.id, 'basicZoneA', e.target.value)} className="w-[72px] h-8 pl-6 pr-2 bg-white border border-[#E2E8F0] rounded-md text-[13px] font-semibold text-[#0F172A] focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]/20 focus:outline-none transition-all" /></div></td>
                                                      <td className="py-3 px-5"><div className="relative"><span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-[#94A3B8]">₹</span><input type="number" value={currentRates.basicZoneB || ''} onChange={(e) => handleRateChange(courier.id, s.id, 'basicZoneB', e.target.value)} className="w-[72px] h-8 pl-6 pr-2 bg-white border border-[#E2E8F0] rounded-md text-[13px] font-semibold text-[#0F172A] focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]/20 focus:outline-none transition-all" /></div></td>
                                                      <td className="py-3 px-5"><div className="relative"><span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-[#94A3B8]">₹</span><input type="number" value={currentRates.basicZoneC || ''} onChange={(e) => handleRateChange(courier.id, s.id, 'basicZoneC', e.target.value)} className="w-[72px] h-8 pl-6 pr-2 bg-white border border-[#E2E8F0] rounded-md text-[13px] font-semibold text-[#0F172A] focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]/20 focus:outline-none transition-all" /></div></td>
                                                      <td className="py-3 px-5"><div className="relative"><span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-[#94A3B8]">₹</span><input type="number" value={currentRates.basicZoneD || ''} onChange={(e) => handleRateChange(courier.id, s.id, 'basicZoneD', e.target.value)} className="w-[72px] h-8 pl-6 pr-2 bg-white border border-[#E2E8F0] rounded-md text-[13px] font-semibold text-[#0F172A] focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]/20 focus:outline-none transition-all" /></div></td>
                                                      <td className="py-3 px-5"><div className="relative"><span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-[#94A3B8]">₹</span><input type="number" value={currentRates.basicZoneE || ''} onChange={(e) => handleRateChange(courier.id, s.id, 'basicZoneE', e.target.value)} className="w-[72px] h-8 pl-6 pr-2 bg-white border border-[#E2E8F0] rounded-md text-[13px] font-semibold text-[#0F172A] focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]/20 focus:outline-none transition-all" /></div></td>
                                                      <td className="py-3 px-5"><input type="number" placeholder="COD ₹" value={currentRates.codCharge || ''} disabled={currentRates.isFlatRate} onChange={(e) => handleRateChange(courier.id, s.id, 'codCharge', e.target.value)} className={`w-[72px] h-8 px-2 bg-white border border-[#E2E8F0] rounded-md text-[13px] font-semibold text-[#0F172A] focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]/20 focus:outline-none transition-all placeholder:font-normal placeholder:text-[#94A3B8] ${currentRates.isFlatRate ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}`} /></td>
                                                    </tr>
                                                    <tr className="hover:bg-[#F8FAFC]/50 transition-colors border-none">
                                                      <td className="py-3 px-5 pb-5">
                                                        <div className="flex items-center gap-2">
                                                          <span className="text-[12px] font-bold text-[#64748B] w-10">Add:</span>
                                                          <div className="relative">
                                                            <input type="number" value={currentRates.addWeight || ''} onChange={(e) => handleRateChange(courier.id, s.id, 'addWeight', e.target.value)} className="w-16 h-8 px-2 bg-white border border-[#E2E8F0] rounded-md text-[13px] font-semibold text-[#0F172A] focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]/20 focus:outline-none transition-all placeholder:font-normal placeholder:text-[#94A3B8]" />
                                                            <span className="absolute -right-5 top-1/2 -translate-y-1/2 text-[10px] font-medium text-[#64748B]">gm</span>
                                                          </div>
                                                        </div>
                                                      </td>
                                                      <td className="py-3 px-5 pb-5"><div className="relative"><span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-[#94A3B8]">₹</span><input type="number" value={currentRates.addZoneA || ''} onChange={(e) => handleRateChange(courier.id, s.id, 'addZoneA', e.target.value)} className="w-[72px] h-8 pl-6 pr-2 bg-white border border-[#E2E8F0] rounded-md text-[13px] font-semibold text-[#0F172A] focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]/20 focus:outline-none transition-all" /></div></td>
                                                      <td className="py-3 px-5 pb-5"><div className="relative"><span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-[#94A3B8]">₹</span><input type="number" value={currentRates.addZoneB || ''} onChange={(e) => handleRateChange(courier.id, s.id, 'addZoneB', e.target.value)} className="w-[72px] h-8 pl-6 pr-2 bg-white border border-[#E2E8F0] rounded-md text-[13px] font-semibold text-[#0F172A] focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]/20 focus:outline-none transition-all" /></div></td>
                                                      <td className="py-3 px-5 pb-5"><div className="relative"><span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-[#94A3B8]">₹</span><input type="number" value={currentRates.addZoneC || ''} onChange={(e) => handleRateChange(courier.id, s.id, 'addZoneC', e.target.value)} className="w-[72px] h-8 pl-6 pr-2 bg-white border border-[#E2E8F0] rounded-md text-[13px] font-semibold text-[#0F172A] focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]/20 focus:outline-none transition-all" /></div></td>
                                                      <td className="py-3 px-5 pb-5"><div className="relative"><span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-[#94A3B8]">₹</span><input type="number" value={currentRates.addZoneD || ''} onChange={(e) => handleRateChange(courier.id, s.id, 'addZoneD', e.target.value)} className="w-[72px] h-8 pl-6 pr-2 bg-white border border-[#E2E8F0] rounded-md text-[13px] font-semibold text-[#0F172A] focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]/20 focus:outline-none transition-all" /></div></td>
                                                      <td className="py-3 px-5 pb-5"><div className="relative"><span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-[#94A3B8]">₹</span><input type="number" value={currentRates.addZoneE || ''} onChange={(e) => handleRateChange(courier.id, s.id, 'addZoneE', e.target.value)} className="w-[72px] h-8 pl-6 pr-2 bg-white border border-[#E2E8F0] rounded-md text-[13px] font-semibold text-[#0F172A] focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]/20 focus:outline-none transition-all" /></div></td>
                                                      <td className="py-3 px-5 pb-5"><input type="number" placeholder="COD %" value={currentRates.codPercentage || ''} disabled={currentRates.isFlatRate} onChange={(e) => handleRateChange(courier.id, s.id, 'codPercentage', e.target.value)} className={`w-[72px] h-8 px-2 bg-white border border-[#E2E8F0] rounded-md text-[13px] font-semibold text-[#0F172A] focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]/20 focus:outline-none transition-all placeholder:font-normal placeholder:text-[#94A3B8] ${currentRates.isFlatRate ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}`} /></td>
                                                    </tr>
                                                  </React.Fragment>
                                                );
                                              })}
                                            </tbody>
                                          </table>
                                          <div className="flex justify-end gap-4 p-5 bg-[#F8FAFC] border-t border-[#E2E8F0]">
                                            <button 
                                              onClick={() => setExpandedCourierId(null)}
                                              className="px-6 h-9 rounded-full font-bold text-[13px] text-[#475569] border border-[#CBD5E1] bg-white hover:bg-[#F1F5F9] transition-all shadow-sm"
                                            >
                                              Cancel
                                            </button>
                                            <button 
                                              id={`save-btn-${courier.id}`}
                                              onClick={() => handleSaveRates(courier.id)}
                                              className="px-6 h-9 rounded-full font-bold text-[13px] text-white bg-[#00A86B] hover:bg-[#009B63] shadow-sm transition-all flex items-center gap-2"
                                            >
                                              <Save className="w-4 h-4" /> Save Configuration
                                            </button>
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
                  <tr>
                    <td colSpan={5} className="py-12 text-center">
                      <div className="text-sm font-semibold text-[#64748B]">No couriers found</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
