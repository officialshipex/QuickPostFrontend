import React, { useState, useRef, useEffect, useMemo } from 'react';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { usePagination } from '../../hooks/usePagination';
import { ChevronDown, RefreshCcw, Check, Package, User, MapPin, Truck, AlertTriangle, X, MoreHorizontal, DollarSign, IndianRupee, Settings } from 'lucide-react';
import { GlassDropdown } from '../../components/ui/GlassDropdown';
import { GlassDateFilter } from '../../components/ui/GlassDateFilter';

const MAIN_TABS = [
  { name: 'RTO', count: 67 },
  { name: 'Undelivered', count: 312 },
  { name: 'Action Required', count: 48 },
  { name: 'Action Requested', count: 129 }
];

const INITIAL_MOCK_NDR = Array.from({ length: 45 }, (_, i) => ({
  id: `86543`,
  awb: `QPSP${String(45 + i).padStart(9, '0')}`,
  userName: 'Dinesh Tharwani',
  userEmail: 'dineshtharwani@gmail.com',
  date: i % 2 === 0 ? '13th Apr 2026' : '12th Apr 2026',
  productName: 'Money Attraction Pro...',
  sku: 'MT492J/A',
  qty: 12,
  payment: 200,
  paymentType: 'Prepaid',
  customerName: 'Abdul Latiff',
  customerPhone: '7654321890',
  pickupName: 'Shubham Kukreja',
  courier: 'Ekart Surface',
  bookedDate: '13 Apr 2026',
  status: 'Undelivered',
  attempts: i % 2 === 0 ? 0 : 6,
  weight: '250g',
  dimensions: '10×10×10',
  volWeight: '0.20 KG',
}));

const STATUS_BADGE_STYLES: Record<string, string> = {
  'Undelivered': 'bg-amber-50 text-amber-700 border-amber-200',
  'RTO': 'bg-orange-50 text-orange-700 border-orange-200',
  'Action Required': 'bg-rose-50 text-rose-700 border-rose-200',
  'Action Requested': 'bg-indigo-50 text-indigo-700 border-indigo-200',
};

const getStatusBadgeClass = (status: string) => {
  const normalized = status || '';
  return `${STATUS_BADGE_STYLES[normalized] || 'bg-blue-50 text-blue-700 border-blue-200'} px-2.5 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap shadow-sm`;
};

const getFullProductName = (name?: string) => {
  const n = name || 'Money Attraction Pro...';
  if (n.includes('Money Attraction')) return 'Money Attraction Bracelet Kit Pro (2 Pcs)';
  if (n.includes('Magnetic Wireless')) return 'Magnetic Wireless Fast Charger 15W Pad';
  if (n.includes('Ergonomic Office')) return 'Ergonomic Office Executive Mesh Chair';
  if (n.includes('Ultra-Slim Power')) return 'Ultra-Slim Fast Charging Power Bank 10000mAh';
  if (n.includes('Smart Fitness')) return 'Smart Fitness AMOLED Display Health Watch';
  return n;
};

export function AdminNDR() {
  const [globalSearchQuery, setGlobalSearchQuery] = useState((window as any).__adminSearchQuery?.toLowerCase() || '');

  useEffect(() => {
    const handleSearch = (e: Event) => {
      setGlobalSearchQuery(((e as CustomEvent).detail || '').toLowerCase());
    };
    window.addEventListener('admin-search', handleSearch);
    setGlobalSearchQuery(((window as any).__adminSearchQuery || '').toLowerCase());
    return () => {
      window.removeEventListener('admin-search', handleSearch);
    };
  }, []);

  const [activeTab, setActiveTab] = useState('Undelivered');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [drawerOrder, setDrawerOrder] = useState<typeof INITIAL_MOCK_NDR[0] | null>(null);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const actionMenuRef = useRef<HTMLDivElement>(null);
  const [hoveredPickup, setHoveredPickup] = useState<{id: string, rect: DOMRect, name: string} | null>(null);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [selectedPickups, setSelectedPickups] = useState<string[]>([]);
  const [selectedCouriers, setSelectedCouriers] = useState<string[]>([]);
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  
  // Dropdown Options
  const PAYMENT_OPTIONS = [
    { label: 'Prepaid', value: 'Prepaid' },
    { label: 'COD', value: 'COD' },
  ];
  const PICKUP_OPTIONS = [
    { label: 'Shubham Kukreja', value: 'Shubham Kukreja' },
  ];
  const COURIER_OPTIONS = [
    { label: 'Ekart Surface', value: 'Ekart Surface' },
    { label: 'Delhivery', value: 'Delhivery' },
  ];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) setShowActionMenu(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasActiveFilters = searchTerm || selectedPayments.length > 0 || selectedPickups.length > 0 || selectedCouriers.length > 0 || (dateStart && dateEnd);

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedPayments([]);
    setSelectedPickups([]);
    setSelectedCouriers([]);
    setDateStart('');
    setDateEnd('');
    setCurrentPage(1);
  };

  const filteredOrders = useMemo(() => {
    return INITIAL_MOCK_NDR.filter(order => {
      const searchLower = searchTerm.toLowerCase();
      const matchSearch = searchTerm ? 
        order.userName.toLowerCase().includes(searchLower) || 
        order.userEmail.toLowerCase().includes(searchLower) || 
        order.customerName.toLowerCase().includes(searchLower) ||
        order.customerPhone.includes(searchTerm) ||
        order.id.toLowerCase().includes(searchLower) ||
        order.awb.toLowerCase().includes(searchLower) : true;
      const matchGlobal = globalSearchQuery ?
        order.userName.toLowerCase().includes(globalSearchQuery) || 
        order.userEmail.toLowerCase().includes(globalSearchQuery) || 
        order.customerName.toLowerCase().includes(globalSearchQuery) ||
        order.customerPhone.includes(globalSearchQuery) ||
        order.awb.toLowerCase().includes(globalSearchQuery) ||
        order.id.toLowerCase().includes(globalSearchQuery) : true;
      const matchPayment = selectedPayments.length === 0 || selectedPayments.includes(order.paymentType);
      const matchPickup = selectedPickups.length === 0 || selectedPickups.includes(order.pickupName);
      const matchCourier = selectedCouriers.length === 0 || selectedCouriers.includes(order.courier);
      
      return matchSearch && matchGlobal && matchPayment && matchPickup && matchCourier;
    });
  }, [searchTerm, globalSearchQuery, selectedPayments, selectedPickups, selectedCouriers]);

  const {
    page: currentPage,
    setPage: setCurrentPage,
    totalPages,
    paginatedData: paginatedOrders,
    startIndex,
    endIndex,
  } = usePagination({ data: filteredOrders, perPage: 10 });

  const toggleAll = () => setSelectedOrders(selectedOrders.length === paginatedOrders.length && paginatedOrders.length > 0 ? [] : paginatedOrders.map(o => o.awb));
  const toggleSelect = (id: string) => setSelectedOrders(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleApplyFilters = () => {
    setCurrentPage(1);
  };

  return (
    <AdminLayout>
      <div className="flex flex-col h-[calc(100vh-72px)] -m-4 md:-m-6 bg-white">
        <div className="bg-white relative z-50 shrink-0">
          {/* Top Header Row */}
          <div className="flex justify-between items-center px-6 py-2 border-b border-[#E2E8F0] bg-white">
            <div className="flex gap-6 items-center">
              {MAIN_TABS.map((tab) => (
                <button
                  key={tab.name}
                  onClick={() => setActiveTab(tab.name)}
                  className={`relative py-3 text-[13px] font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === tab.name ? 'text-[#00A86B]' : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  {tab.name} <span className="text-[11px] font-medium opacity-80">({tab.count})</span>
                  {activeTab === tab.name && (
                    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#00A86B] rounded-t-full" />
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 shrink-0 ml-4">
              <button className="w-8 h-8 rounded-full border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-[#F8FAFC]">
                <RefreshCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

        {/* Secondary Filter Row */}
        <div className="p-3 border-b border-[#E2E8F0] flex flex-wrap items-center gap-2.5 bg-[#F8FAFC]/50">
          <input 
            type="text" 
            placeholder="Search NDR..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs bg-white focus:outline-none w-[180px] shrink-0" 
          />
          
          <GlassDropdown
            label="Payment Type"
            options={PAYMENT_OPTIONS}
            selected={selectedPayments}
            onChange={setSelectedPayments}
            placeholder="Search payment..."
            icon={<DollarSign className="w-3.5 h-3.5" />}
          />

          <GlassDropdown
            label="Pickup Address"
            options={PICKUP_OPTIONS}
            selected={selectedPickups}
            onChange={setSelectedPickups}
            placeholder="Search pickup..."
            icon={<MapPin className="w-3.5 h-3.5" />}
          />

          <GlassDropdown
            label="Courier Service"
            options={COURIER_OPTIONS}
            selected={selectedCouriers}
            onChange={setSelectedCouriers}
            placeholder="Search courier..."
            icon={<Truck className="w-3.5 h-3.5" />}
          />

          <GlassDateFilter
            align="right"
            startDate={dateStart}
            endDate={dateEnd}
            onDateChange={(s, e) => { setDateStart(s); setDateEnd(e); }}
          />
          
          <button onClick={handleApplyFilters} className="h-9 px-4 shrink-0 rounded-lg bg-[#00A86B] text-white text-xs font-bold hover:bg-[#009B63] transition-colors shadow-sm flex items-center justify-center">
            Apply
          </button>

          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="h-9 px-3 shrink-0 rounded-lg border border-red-200 text-red-500 text-xs font-bold hover:bg-red-50 transition-colors"
            >
              Clear All
            </button>
          )}

          <div className="ml-auto flex items-center gap-2 shrink-0">
            <div className="relative" ref={actionMenuRef}>
              <button
                onClick={() => setShowActionMenu(!showActionMenu)}
                className="h-9 pl-4 pr-8 rounded-full border border-[#E2E8F0] text-xs bg-white focus:outline-none flex items-center font-bold text-[#475569] shadow-sm hover:bg-[#F8FAFC] transition-colors"
              >
                Action
                <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              </button>
              
              {showActionMenu && (
                <div className="absolute right-0 top-full mt-2 w-[180px] bg-white rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-[#E2E8F0] py-2 z-50">
                  {(activeTab === 'Undelivered' || activeTab === 'RTO' || activeTab === 'Action Required') ? (
                    <>
                      <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors">Export Excel</button>
                      <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors">Download Invoices</button>
                      <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors">Download Manifests</button>
                      <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors">Download Labels</button>
                      <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors">Bulk NDR Action</button>
                    </>
                  ) : (
                    <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors">Export Excel</button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bulk Actions Toolbar */}
        {selectedOrders.length > 0 && (
          <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex items-center gap-3 animate-fade-in">
            <span className="text-xs font-bold text-blue-700">{selectedOrders.length} selected</span>
            <button className="h-8 px-3 rounded-md bg-white border border-blue-200 text-xs font-bold text-blue-700 shadow-sm ml-auto hover:bg-red-50">Bulk Action</button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white flex flex-col flex-1 min-h-0 overflow-hidden border-t border-[#E2E8F0]">
        <div className="flex-1 overflow-auto no-scrollbar relative">
          <table className="w-full text-left border-collapse min-w-[1400px]">
            <thead className="sticky top-0 z-40 bg-[#E6F5F1] shadow-sm">
              <tr className="text-xs font-medium text-[#00A86B] uppercase tracking-wider">
                <th className="p-3 w-10 text-left align-middle">
                  <input type="checkbox" checked={selectedOrders.length === paginatedOrders.length && paginatedOrders.length > 0} onChange={toggleAll} className="rounded border-[#00A86B] accent-[#00A86B] w-3.5 h-3.5" />
                </th>
                <th className="p-3 text-left align-middle whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 shrink-0" />
                    <span>User</span>
                  </div>
                </th>
                <th className="p-3 text-left align-middle whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>Order</span>
                  </div>
                </th>
                <th className="p-3 text-left align-middle whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 shrink-0" />
                    <span>Product</span>
                  </div>
                </th>
                <th className="p-3 text-left align-middle whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <IndianRupee className="w-3.5 h-3.5 shrink-0" />
                    <span>Payment</span>
                  </div>
                </th>
                <th className="p-3 text-left align-middle whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 shrink-0" />
                    <span>Customer</span>
                  </div>
                </th>
                <th className="p-3 text-left align-middle whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>Pickup</span>
                  </div>
                </th>
                <th className="p-3 text-left align-middle whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 shrink-0" />
                    <span>Shipment</span>
                  </div>
                </th>
                <th className="p-3 text-left align-middle whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>Status</span>
                  </div>
                </th>
                <th className="p-3 text-left align-middle whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>NDR Reason</span>
                  </div>
                </th>
                {activeTab === 'Action Required' && (
                  <th className="p-3 text-left align-middle whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Settings className="w-3.5 h-3.5 shrink-0" />
                      <span>Actions</span>
                    </div>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="text-[11px] text-[#475569]">
              {paginatedOrders.map((order) => (
                <tr key={order.awb} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors group">
                  <td className="p-3">
                    <input type="checkbox" checked={selectedOrders.includes(order.awb)} onChange={() => toggleSelect(order.awb)} className="rounded border-gray-300 accent-[#00A86B] w-3.5 h-3.5" />
                  </td>
                  <td className="p-3">
                    <div className="text-xs font-semibold text-[#00A86B] hover:underline cursor-pointer" onClick={() => setDrawerOrder(order)}>{order.id}</div>
                    <div className="text-sm font-semibold text-[#0F172A] mt-0.5">{order.userName}</div>
                    <div className="font-sans text-xs font-normal text-[#94A3B8]">{order.userEmail}</div>
                  </td>
                  <td className="p-3">
                    <div className="text-xs font-semibold text-[#00A86B] hover:underline cursor-pointer" onClick={() => setDrawerOrder(order)}>{order.id}</div>
                    <div className="table-date mt-0.5">{order.date}</div>
                    <div className="mt-1"><span className="px-2 py-0.5 rounded-full border border-blue-200 text-blue-600 font-bold text-[9px] bg-blue-50/50">Custom</span></div>
                  </td>
                  <td className="p-3 text-xs font-normal">
                    <div className="relative group/prod cursor-pointer inline-block max-w-[160px]">
                      <div className="text-[#0F172A] truncate font-medium" title={getFullProductName(order.productName)}>
                        {order.productName}
                      </div>
                      <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover/prod:block z-50 bg-[#0F172A] text-white text-[11px] font-normal px-2.5 py-1.5 rounded shadow-xl whitespace-nowrap pointer-events-none border border-slate-700">
                        {getFullProductName(order.productName)}
                        <div className="absolute left-4 top-full -mt-1 border-4 border-transparent border-t-[#0F172A]" />
                      </div>
                    </div>
                    <div className="text-[#64748B] mt-0.5">SKU: {order.sku} | Qty: {order.qty}</div>
                  </td>
                  <td className="p-3">
                    <div className="font-semibold text-[#0F172A]">₹ {order.payment}</div>
                    <div className="mt-1"><span className="px-2 py-0.5 rounded-full border border-blue-200 text-blue-600 font-bold text-[9px] bg-blue-50/50">{order.paymentType}</span></div>
                  </td>
                  <td className="p-3">
                    <div className="font-normal text-[13px] text-[#0F172A]">{order.customerName}</div>
                    <div className="font-normal text-[13px] text-[#64748B] mt-0.5">{order.customerPhone}</div>
                  </td>
                  <td className="p-3">
                    <div 
                      className="text-[#64748B] underline decoration-dotted underline-offset-2 hover:text-[#0F172A] transition-colors cursor-help inline-block"
                      onMouseEnter={(e) => {
                        setHoveredPickup({
                          id: order.awb,
                          rect: e.currentTarget.getBoundingClientRect(),
                          name: order.pickupName
                        });
                      }}
                      onMouseLeave={() => setHoveredPickup(null)}
                    >
                      {order.pickupName}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="text-xs font-semibold text-[#00A86B]">{order.courier}</div>
                    <div className="table-date mt-0.5">Booked On : {order.bookedDate}</div>
                    <div className="text-xs font-semibold text-[#00A86B] underline decoration-solid underline-offset-2 mt-0.5 hover:text-[#009B63] cursor-pointer">{order.awb}</div>
                  </td>
                  <td className="p-3">
                    <span className={getStatusBadgeClass(order.status)}>{order.status}</span>
                  </td>
                  <td className="p-3">
                    <div className="table-date mb-0.5 whitespace-nowrap">Booked On | 13 Apr 2026</div>
                    <div className={`font-bold text-xs whitespace-nowrap underline decoration-dotted underline-offset-2 cursor-pointer mb-1 text-[#00A86B] decoration-[#00A86B]`}>{order.attempts} Attempted</div>
                    <button className="h-6 px-4 rounded-full bg-[#1e40af] text-white font-bold text-[9px] hover:bg-[#1e3a8a] shadow-sm whitespace-nowrap">
                      History
                    </button>
                  </td>
                  {activeTab === 'Action Required' && (
                    <td className="p-3">
                      <button className="h-7 px-4 rounded-full bg-[#1e40af] text-white font-bold text-[10px] hover:bg-[#1e3a8a] shadow-sm whitespace-nowrap">
                        Take Action
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {paginatedOrders.length === 0 && (
                <tr>
                  <td colSpan={activeTab === 'Action Required' ? 11 : 10} className="p-8 text-center text-[#64748B] font-medium">
                    No orders found matching your criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 0 && (
          <div className="p-4 border-t border-[#E2E8F0] flex items-center justify-between">
            <div className="text-xs text-[#64748B]">
              Showing <span className="font-bold text-[#0F172A]">{startIndex}</span> to <span className="font-bold text-[#0F172A]">{endIndex}</span> of <span className="font-bold text-[#0F172A]">{filteredOrders.length}</span> entries
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded border border-[#E2E8F0] text-xs font-medium text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-50"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-8 h-8 rounded text-xs font-medium flex items-center justify-center transition-colors ${
                    currentPage === i + 1 ? 'bg-[#00A86B] text-white border border-[#00A86B]' : 'border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded border border-[#E2E8F0] text-xs font-medium text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
      </div>

      {/* Side Drawer */}
      {drawerOrder && (
        <div className="fixed inset-0 z-[100] flex">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setDrawerOrder(null)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-white z-10 p-6 border-b border-[#E2E8F0] flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-[#0F172A]">Order #{drawerOrder.id}</h3>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold mt-1 inline-block bg-blue-50 text-blue-600`}>{drawerOrder.status}</span>
              </div>
              <button onClick={() => setDrawerOrder(null)} className="w-8 h-8 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-[#F8FAFC]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Detailed Mock Data Sections */}
              <div>
                <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wide mb-3">Customer Details</h4>
                <div className="bg-[#F8FAFC] rounded-xl p-4 space-y-2">
                  <div className="flex justify-between"><span className="text-xs text-[#64748B]">Name</span><span className="text-xs font-bold text-[#0F172A]">{drawerOrder.customerName}</span></div>
                  <div className="flex justify-between"><span className="text-xs text-[#64748B]">Phone</span><span className="text-xs font-bold text-[#0F172A]">{drawerOrder.customerPhone}</span></div>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wide mb-3">Shipping Details</h4>
                <div className="bg-[#F8FAFC] rounded-xl p-4 space-y-2">
                  <div className="flex justify-between"><span className="text-xs text-[#64748B]">Pickup Location</span><span className="text-xs font-bold text-[#0F172A]">{drawerOrder.pickupName}</span></div>
                  <div className="flex justify-between"><span className="text-xs text-[#64748B]">AWB</span><span className="text-xs font-bold text-[#0F172A]">{drawerOrder.awb}</span></div>
                  <div className="flex justify-between"><span className="text-xs text-[#64748B]">Courier Partner</span><span className="text-xs font-bold text-[#00A86B]">{drawerOrder.courier}</span></div>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wide mb-3">Products</h4>
                <div className="border border-[#E2E8F0] rounded-xl p-3 flex gap-3 items-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-bold text-[#0F172A]">{drawerOrder.productName}</div>
                    <div className="text-[10px] text-[#64748B]">SKU: {drawerOrder.sku} | Qty: {drawerOrder.qty}</div>
                  </div>
                  <div className="text-xs font-bold text-[#0F172A]">₹{drawerOrder.payment}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {hoveredPickup && (
        <div 
          className="fixed z-[9999] pointer-events-none bg-[#0F172A] text-white text-[10px] p-3 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] transition-opacity animate-in fade-in zoom-in-95 duration-150 w-64"
          style={{
            top: hoveredPickup.rect.top - 10,
            left: hoveredPickup.rect.left + (hoveredPickup.rect.width / 2),
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="font-bold text-white mb-1.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#00A86B]" /> 
            Pickup Address Details
          </div>
          <div className="font-semibold text-white mb-1">{hoveredPickup.name}</div>
          <div className="text-slate-300 leading-relaxed">
            Shop No 14, Ground Floor, Main Market Road, Near City Center, {hoveredPickup.name.includes('Warehouse') ? hoveredPickup.name.split('–')[1]?.trim() || 'City' : 'New Delhi'}, 110001
          </div>
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-[#0F172A]"></div>
        </div>
      )}
    </AdminLayout>
  );
}
