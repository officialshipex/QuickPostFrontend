import React, { useState, useEffect, useMemo } from 'react';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { usePagination } from '../../hooks/usePagination';
import { ChevronDown, RefreshCcw, Check, Package, User, Truck, Clock, Upload, FileText, AlertTriangle, MoreVertical, Filter, Settings } from 'lucide-react';
import { GlassDropdown } from '../../components/ui/GlassDropdown';
import { GlassDateFilter } from '../../components/ui/GlassDateFilter';

const MAIN_TABS = [
  { name: 'All', count: 8 },
  { name: 'New', count: 6 },
  { name: 'Accepted', count: 6 },
  { name: 'Rejected', count: 6 },
  { name: 'Escalated', count: 6 }
];

const generateData = (status: string, count: number, startId: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `86543`,
    userName: 'Dinesh Tharwani',
    userEmail: 'dineshtharwani@gmail.com',
    productName: 'Money Attraction Pro...',
    sku: 'MT492J/A',
    qty: 12,
    uploadDate: '13th Apr 2026',
    uploadTime: '04:34 PM',
    courier: 'Ekart Surface',
    bookedDate: '13 Apr 2026',
    awb: `QPSP${String(startId + i).padStart(9, '0')}`,
    initialAppliedWeight: '4 Kg',
    initialWeight: '250g',
    initialDimensions: '10*10*10',
    initialVolWeight: '0.20 KG',
    courierChargedWeight: '4 Kg',
    courierDeadWeight: '250g',
    exWeight: '2 Kg',
    exCharges: '4 Kg',
    amount: i === 0 ? 'Amount: 4 Kg' : 'Pending Amount: 4 Kg',
    status: status
  }));
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

const STATUS_BADGE_STYLES: Record<string, string> = {
  'New': 'bg-blue-50 text-blue-700 border-blue-200',
  'new': 'bg-blue-50 text-blue-700 border-blue-200',
  'Accepted': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'accepted': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Rejected': 'bg-rose-50 text-rose-700 border-rose-200',
  'rejected': 'bg-rose-50 text-rose-700 border-rose-200',
  'Escalated': 'bg-orange-50 text-orange-700 border-orange-200',
  'escalated': 'bg-orange-50 text-orange-700 border-orange-200',
};

const getStatusBadgeClass = (status: string) => {
  const normalized = status || '';
  return `${STATUS_BADGE_STYLES[normalized] || 'bg-blue-50 text-blue-700 border-blue-200'} px-2.5 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap shadow-sm`;
};

const ALL_DATA = [
  ...generateData('New', 2, 45),
  ...generateData('Accepted', 2, 65),
  ...generateData('Rejected', 2, 85),
  ...generateData('Escalated', 2, 105),
];

const NEW_DATA = generateData('New', 6, 45);
const ACCEPTED_DATA = generateData('Accepted', 6, 65);
const REJECTED_DATA = generateData('Rejected', 6, 85);
const ESCALATED_DATA = generateData('Discrepancy Raised', 6, 55);

export function AdminWeightDiscrepancy() {
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

  const [activeTab, setActiveTab] = useState('New');
  
  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSearchTypes, setSelectedSearchTypes] = useState<string[]>([]);
  const [selectedCouriers, setSelectedCouriers] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  // Glass Dropdown Options
  const SEARCH_TYPE_OPTIONS = [
    { label: 'Forward', value: 'Forward' },
    { label: 'RTO', value: 'RTO' },
  ];
  const COURIER_OPTIONS = [
    { label: 'Ekart Surface', value: 'Ekart Surface' },
    { label: 'Delhivery', value: 'Delhivery' },
    { label: 'Bluedart', value: 'Bluedart' },
    { label: 'XpressBees', value: 'XpressBees' },
  ];
  const STATUS_OPTIONS = [
    { label: 'Accepted', value: 'Accepted' },
    { label: 'Rejected', value: 'Rejected' },
    { label: 'New', value: 'New' },
    { label: 'Escalated', value: 'Escalated' },
  ];
  const [selectedEscalated, setSelectedEscalated] = useState<string[]>([]);
  const [showActionMenu, setShowActionMenu] = useState(false);

  let currentData = NEW_DATA;
  if (activeTab === 'All') currentData = ALL_DATA;
  else if (activeTab === 'Accepted') currentData = ACCEPTED_DATA;
  else if (activeTab === 'Rejected') currentData = REJECTED_DATA;
  else if (activeTab === 'Escalated') currentData = ESCALATED_DATA;

  const hasActiveFilters = searchTerm || selectedSearchTypes.length > 0 || selectedCouriers.length > 0 || selectedStatuses.length > 0 || (dateStart && dateEnd);

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedSearchTypes([]);
    setSelectedCouriers([]);
    setSelectedStatuses([]);
    setDateStart('');
    setDateEnd('');
  };

  const filteredData = useMemo(() => {
    return currentData.filter(item => {
      const searchLower = searchTerm.toLowerCase();
      const matchSearch = searchTerm ? 
        item.userName.toLowerCase().includes(searchLower) || 
        item.userEmail.toLowerCase().includes(searchLower) ||
        item.awb.toLowerCase().includes(searchLower) ||
        item.id.toLowerCase().includes(searchLower) : true;
      const matchGlobal = globalSearchQuery ?
        item.userName.toLowerCase().includes(globalSearchQuery) || 
        item.userEmail.toLowerCase().includes(globalSearchQuery) || 
        item.awb.toLowerCase().includes(globalSearchQuery) ||
        item.id.toLowerCase().includes(globalSearchQuery) : true;
      const matchCourier = selectedCouriers.length === 0 || selectedCouriers.includes(item.courier);
      const matchStatus = selectedStatuses.length === 0 || selectedStatuses.includes(item.status);
      
      return matchSearch && matchGlobal && matchCourier && matchStatus;
    });
  }, [currentData, searchTerm, globalSearchQuery, selectedCouriers, selectedStatuses]);

  const {
    page: currentPage,
    setPage: setCurrentPage,
    totalPages,
    paginatedData,
    startIndex,
    endIndex,
  } = usePagination({ data: filteredData, perPage: 10 });

  useEffect(() => { setCurrentPage(1); }, [activeTab]);

  const paginatedEscalatedData = paginatedData;
  const totalEscalatedPages = totalPages;

  const toggleAll = () => setSelectedOrders(selectedOrders.length === filteredData.length && filteredData.length > 0 ? [] : filteredData.map(o => o.awb));
  const toggleSelect = (id: string) => setSelectedOrders(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const toggleAllEscalated = () => setSelectedEscalated(selectedEscalated.length === filteredData.length && filteredData.length > 0 ? [] : filteredData.map(o => o.awb));
  const toggleSelectEscalated = (id: string) => setSelectedEscalated(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <AdminLayout>
      <div className="flex flex-col h-[calc(100vh-72px)] -m-4 md:-m-6 bg-white">
        <div className="bg-white border-b border-[#E2E8F0] relative z-50 shrink-0">
          {/* Top Header Row */}
          <div className="flex justify-between items-center px-6 py-2 border-b border-[#E2E8F0] bg-white overflow-x-auto no-scrollbar">
            <div className="flex gap-6 items-center shrink-0">
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

        {/* Summary Cards Row */}
        <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC]/30 flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px] bg-white rounded-xl p-3 border border-[#E2E8F0] flex items-center gap-3 shadow-sm">
            <div className="w-8 h-8 rounded-full bg-[#E0F2FE] flex items-center justify-center shrink-0">
              <Package className="w-4 h-4 text-[#0EA5E9]" />
            </div>
            <div>
              <div className="text-[14px] font-bold text-[#0F172A]">₹34,57,876.49</div>
              <div className="text-[10px] font-semibold text-[#64748B]">New Discrepancies</div>
            </div>
          </div>
          <div className="flex-1 min-w-[200px] bg-[#FAF5FF] rounded-xl p-3 border border-[#F3E8FF] flex items-center gap-3 shadow-sm">
            <div className="w-8 h-8 rounded-full bg-[#F3E8FF] flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-[#A855F7]" />
            </div>
            <div>
              <div className="text-[14px] font-bold text-[#0F172A]">₹34,57,876.49</div>
              <div className="text-[10px] font-semibold text-[#64748B]">Accepted</div>
            </div>
          </div>
          <div className="flex-1 min-w-[200px] bg-white rounded-xl p-3 border border-[#E2E8F0] flex items-center gap-3 shadow-sm">
            <div className="w-8 h-8 rounded-full bg-[#DCFCE7] flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-[#22C55E]" />
            </div>
            <div>
              <div className="text-[14px] font-bold text-[#0F172A]">₹34,57,876.49</div>
              <div className="text-[10px] font-semibold text-[#64748B]">Rejected</div>
            </div>
          </div>
          <div className="flex-1 min-w-[200px] bg-[#FEFCE8] rounded-xl p-3 border border-[#FEF08A] flex items-center gap-3 shadow-sm">
            <div className="w-8 h-8 rounded-full bg-[#FEF08A] flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-[#EAB308]" />
            </div>
            <div>
              <div className="text-[14px] font-bold text-[#0F172A]">₹34,57,876.49</div>
              <div className="text-[10px] font-semibold text-[#64748B]">Escalated</div>
            </div>
          </div>
        </div>

        {/* Filters Row */}
        <div className="p-3 border-b border-[#E2E8F0] flex flex-wrap items-center gap-2.5 bg-[#F8FAFC]/50 relative z-50">
          <input 
            type="text" 
            placeholder="Search discrepancies..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs bg-white focus:outline-none w-[180px] shrink-0" 
          />
          
          <GlassDropdown
            label="Search Type"
            options={SEARCH_TYPE_OPTIONS}
            selected={selectedSearchTypes}
            onChange={setSelectedSearchTypes}
            placeholder="Search type..."
            icon={<Filter className="w-3.5 h-3.5" />}
          />

          <GlassDropdown
            label="Courier Service"
            options={COURIER_OPTIONS}
            selected={selectedCouriers}
            onChange={setSelectedCouriers}
            placeholder="Search courier..."
            icon={<Truck className="w-3.5 h-3.5" />}
          />

          <GlassDropdown
            label="Status"
            options={STATUS_OPTIONS}
            selected={selectedStatuses}
            onChange={setSelectedStatuses}
            placeholder="Search status..."
            icon={<Check className="w-3.5 h-3.5" />}
          />

          <GlassDateFilter
            align="right"
            startDate={dateStart}
            endDate={dateEnd}
            onDateChange={(s, e) => { setDateStart(s); setDateEnd(e); }}
          />
          
          <button className="h-9 px-4 shrink-0 rounded-lg bg-[#00A86B] text-white text-xs font-bold hover:bg-[#009B63] transition-colors shadow-sm flex items-center justify-center">
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

          <div className="relative shrink-0 ml-auto flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setShowActionMenu(!showActionMenu)}
                className="h-9 pl-4 pr-8 rounded-full border border-[#E2E8F0] text-xs bg-white focus:outline-none flex items-center font-bold text-[#475569] shadow-sm hover:bg-[#F8FAFC] transition-colors"
              >
                Action
                <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              </button>
              {showActionMenu && (
                <div className="absolute right-0 top-full mt-2 w-[180px] bg-white rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-[#E2E8F0] py-2 z-50">
                  <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors">Export Excel</button>
                  <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors">Download Report</button>
                </div>
              )}
            </div>
            <button className="w-9 h-9 rounded-full bg-[#00A86B] flex items-center justify-center text-white shadow-sm hover:bg-[#009B63] transition-colors">
              <Upload className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white flex flex-col flex-1 min-h-0 overflow-hidden border-t border-[#E2E8F0]">
        {activeTab !== 'Escalated' && (
          <>
            <div className="flex-1 overflow-auto no-scrollbar relative">
            <table className="w-full text-left border-collapse min-w-[1300px]">
              <thead className="sticky top-0 z-40 bg-[#E6F5F1] shadow-sm">
                <tr className="text-xs font-medium text-[#00A86B] uppercase tracking-wider">
                  <th className="p-3 w-10 text-left align-middle">
                    <input type="checkbox" checked={selectedOrders.length === filteredData.length && filteredData.length > 0} onChange={toggleAll} className="rounded border-[#00A86B] accent-[#00A86B] w-3.5 h-3.5" />
                  </th>
                  <th className="p-3 text-left align-middle whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 shrink-0" />
                      <span>User</span>
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
                      <Upload className="w-3.5 h-3.5 shrink-0" />
                      <span>Upload Date</span>
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
                      <Package className="w-3.5 h-3.5 shrink-0" />
                      <span>Applied Weight</span>
                    </div>
                  </th>
                  <th className="p-3 text-left align-middle whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 shrink-0" />
                      <span>Charged Weight</span>
                    </div>
                  </th>
                  <th className="p-3 text-left align-middle whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 shrink-0" />
                      <span>Excess Charges</span>
                    </div>
                  </th>
                  <th className="p-3 text-left align-middle whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span>Status</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="text-[11px] text-[#475569]">
                {paginatedData.map((item) => (
                  <tr key={item.awb} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors group">
                    <td className="p-3 align-top pt-4">
                      <input type="checkbox" checked={selectedOrders.includes(item.awb)} onChange={() => toggleSelect(item.awb)} className="rounded border-gray-300 accent-[#00A86B] w-3.5 h-3.5" />
                    </td>
                    <td className="p-3 align-top pt-4">
                      <div className="text-xs font-semibold text-[#00A86B] cursor-pointer hover:underline">{item.id}</div>
                      <div className="text-sm font-semibold text-[#0F172A] mt-0.5">{item.userName}</div>
                      <div className="font-sans text-xs font-normal text-[#94A3B8]">{item.userEmail}</div>
                    </td>
                    <td className="p-3 align-top pt-4 text-xs font-normal">
                      <div className="relative group/prod cursor-pointer inline-block max-w-[170px]">
                        <div className="text-[#0F172A] truncate font-medium" title={getFullProductName(item.productName)}>
                          {item.productName}
                        </div>
                        <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover/prod:block z-50 bg-[#0F172A] text-white text-[11px] font-normal px-2.5 py-1.5 rounded shadow-xl whitespace-nowrap pointer-events-none border border-slate-700">
                          {getFullProductName(item.productName)}
                          <div className="absolute left-4 top-full -mt-1 border-4 border-transparent border-t-[#0F172A]" />
                        </div>
                      </div>
                      <div className="text-[#64748B] mt-0.5">SKU: {item.sku}</div>
                      <div className="text-[#64748B] mt-0.5">QTY: {item.qty}</div>
                    </td>
                    <td className="p-3 align-top pt-4">
                      <div className="table-date">{item.uploadDate}</div>
                      <div className="table-date mt-0.5">{item.uploadTime}</div>
                    </td>
                    <td className="p-3 align-top pt-4">
                      <div className="text-xs font-semibold text-[#00A86B]">{item.courier}</div>
                      <div className="table-date mt-0.5">Booked On : {item.bookedDate}</div>
                      <div className="text-xs font-semibold text-[#00A86B] underline decoration-solid underline-offset-2 mt-0.5 hover:text-[#009B63] cursor-pointer">{item.awb}</div>
                    </td>
                    <td className="p-3 align-top pt-4 text-xs font-normal text-[#64748B]">
                      <div className="text-[#0F172A] font-medium">Applied weight: {item.initialAppliedWeight}</div>
                      <div className="mt-0.5">Weight: {item.initialWeight}</div>
                      <div className="mt-0.5">L*W*H: {item.initialDimensions}</div>
                      <div className="mt-0.5">Vol. Weight: {item.initialVolWeight}</div>
                    </td>
                    <td className="p-3 align-top pt-4 text-xs font-normal text-[#64748B]">
                      <div className="text-[#0F172A] font-medium">Charged weight: {item.courierChargedWeight}</div>
                      <div className="mt-0.5">Dead Weight: {item.courierDeadWeight}</div>
                    </td>
                    <td className="p-3 align-top pt-4 text-xs font-normal text-[#64748B]">
                      <div className="text-[#0F172A] font-medium">Excess Weight: {item.exWeight}</div>
                      <div className="mt-0.5">Excess Charges: {item.exCharges}</div>
                      <div className="mt-0.5 font-medium text-[#EF4444]">{item.amount}</div>
                    </td>
                    <td className="p-3 align-top pt-4">
                      <span className={getStatusBadgeClass(item.status)}>{item.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 0 && (
            <div className="p-4 border-t border-[#E2E8F0] flex items-center justify-between">
              <div className="text-xs text-[#64748B]">
                Showing <span className="font-bold text-[#0F172A]">{startIndex}</span> to <span className="font-bold text-[#0F172A]">{endIndex}</span> of <span className="font-bold text-[#0F172A]">{filteredData.length}</span> entries
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
          </>
        )}

        {activeTab === 'Escalated' && (
          <>
            <div className="flex-1 overflow-auto no-scrollbar relative">
            <table className="w-full text-left border-collapse min-w-[1400px]">
              <thead className="sticky top-0 z-40 bg-[#E6F5F1] shadow-sm">
                <tr className="text-xs font-medium text-[#00A86B] uppercase tracking-wider">
                  <th className="p-3 w-10 text-left align-middle">
                    <input type="checkbox" checked={selectedEscalated.length === ESCALATED_DATA.length && ESCALATED_DATA.length > 0} onChange={toggleAllEscalated} className="rounded border-[#00A86B] accent-[#00A86B] w-3.5 h-3.5" />
                  </th>
                  <th className="p-3 text-left align-middle whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 shrink-0" />
                      <span>User</span>
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
                      <Upload className="w-3.5 h-3.5 shrink-0" />
                      <span>Upload Date</span>
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
                      <Package className="w-3.5 h-3.5 shrink-0" />
                      <span>Applied Weight</span>
                    </div>
                  </th>
                  <th className="p-3 text-left align-middle whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 shrink-0" />
                      <span>Charged Weight</span>
                    </div>
                  </th>
                  <th className="p-3 text-left align-middle whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 shrink-0" />
                      <span>Excess Charges</span>
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
                      <FileText className="w-3.5 h-3.5 shrink-0" />
                      <span>Details</span>
                    </div>
                  </th>
                  <th className="p-3 text-left align-middle whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Settings className="w-3.5 h-3.5 shrink-0" />
                      <span>Actions</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="text-[11px] text-[#475569]">
                {paginatedEscalatedData.map((item) => (
                  <tr key={item.awb} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors group">
                    <td className="p-3 align-top pt-4">
                      <input type="checkbox" checked={selectedEscalated.includes(item.awb)} onChange={() => toggleSelectEscalated(item.awb)} className="rounded border-gray-300 accent-[#00A86B] w-3.5 h-3.5" />
                    </td>
                    <td className="p-3 align-top pt-4">
                      <div className="text-xs font-semibold text-[#00A86B] cursor-pointer hover:underline">{item.id}</div>
                      <div className="text-sm font-semibold text-[#0F172A] mt-0.5">{item.userName}</div>
                      <div className="font-sans text-xs font-normal text-[#94A3B8]">{item.userEmail}</div>
                    </td>
                    <td className="p-3 align-top pt-4 text-xs font-normal">
                      <div className="relative group/prod cursor-pointer inline-block max-w-[170px]">
                        <div className="text-[#0F172A] truncate font-medium" title={getFullProductName(item.productName)}>
                          {item.productName}
                        </div>
                        <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover/prod:block z-50 bg-[#0F172A] text-white text-[11px] font-normal px-2.5 py-1.5 rounded shadow-xl whitespace-nowrap pointer-events-none border border-slate-700">
                          {getFullProductName(item.productName)}
                          <div className="absolute left-4 top-full -mt-1 border-4 border-transparent border-t-[#0F172A]" />
                        </div>
                      </div>
                      <div className="text-[#64748B] mt-0.5">SKU: {item.sku}</div>
                      <div className="text-[#64748B] mt-0.5">QTY: {item.qty}</div>
                    </td>
                    <td className="p-3 align-top pt-4">
                      <div className="table-date">{item.uploadDate}</div>
                      <div className="table-date mt-0.5">{item.uploadTime}</div>
                    </td>
                    <td className="p-3 align-top pt-4">
                      <div className="text-xs font-semibold text-[#00A86B]">{item.courier}</div>
                      <div className="table-date mt-0.5">Booked On : {item.bookedDate}</div>
                      <div className="text-xs font-semibold text-[#00A86B] underline decoration-solid underline-offset-2 mt-0.5 hover:text-[#009B63] cursor-pointer">{item.awb}</div>
                    </td>
                    <td className="p-3 align-top pt-4 text-xs font-normal text-[#64748B]">
                      <div className="text-[#0F172A] font-medium">Applied weight: {item.initialAppliedWeight}</div>
                      <div className="mt-0.5">Weight: {item.initialWeight}</div>
                      <div className="mt-0.5">L*W*H: {item.initialDimensions}</div>
                      <div className="mt-0.5">Vol. Weight: {item.initialVolWeight}</div>
                    </td>
                    <td className="p-3 align-top pt-4 text-xs font-normal text-[#64748B]">
                      <div className="text-[#0F172A] font-medium">Charged weight: {item.courierChargedWeight}</div>
                      <div className="mt-0.5">Dead Weight: {item.courierDeadWeight}</div>
                    </td>
                    <td className="p-3 align-top pt-4 text-xs font-normal text-[#64748B]">
                      <div className="text-[#0F172A] font-medium">Excess Weight: {item.exWeight}</div>
                      <div className="mt-0.5">Excess Charges: {item.exCharges}</div>
                      <div className="mt-0.5 font-medium text-[#EF4444]">{item.amount}</div>
                    </td>
                    <td className="p-3 align-top pt-4">
                      <span className={getStatusBadgeClass(item.status)}>{item.status}</span>
                    </td>
                    <td className="p-3 align-top pt-4">
                      <button className="text-[#00A86B] font-bold hover:underline">Details</button>
                    </td>
                    <td className="p-3 align-top pt-4 text-right">
                      <div className="flex flex-col gap-1.5 justify-end items-end">
                        <button className="px-3 py-0.5 rounded-full border border-[#00A86B] text-[#00A86B] font-bold text-[10px] hover:bg-[#00A86B]/10 transition-colors">Accepted</button>
                        <button className="px-3 py-0.5 rounded-full border border-red-500 text-red-500 font-bold text-[10px] hover:bg-red-50 transition-colors">Decline</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalEscalatedPages > 0 && (
            <div className="p-4 border-t border-[#E2E8F0] flex items-center justify-between">
              <div className="text-xs text-[#64748B]">
                Showing <span className="font-bold text-[#0F172A]">{startIndex}</span> to <span className="font-bold text-[#0F172A]">{endIndex}</span> of <span className="font-bold text-[#0F172A]">{filteredData.length}</span> entries
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded border border-[#E2E8F0] text-xs font-medium text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-50"
                >
                  Previous
                </button>
                {Array.from({ length: totalEscalatedPages }, (_, i) => (
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
                  onClick={() => setCurrentPage(p => Math.min(totalEscalatedPages, p + 1))}
                  disabled={currentPage === totalEscalatedPages}
                  className="px-3 py-1.5 rounded border border-[#E2E8F0] text-xs font-medium text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
          </>
        )}
      </div>
      </div>
    </AdminLayout>
  );
}
