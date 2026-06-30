import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { Search, ChevronDown, RefreshCcw, Calendar, Check, Package, User, Truck, Banknote, Clock, Upload, Download, Wallet, Send, MinusCircle, FileText, AlertCircle, CheckCircle2, X, MoreVertical, Filter, DollarSign } from 'lucide-react';
import { GlassDropdown } from '../../components/ui/GlassDropdown';
import { GlassDateFilter } from '../../components/ui/GlassDateFilter';

const MAIN_TABS = [
  { name: 'All COD Orders' },
  { name: 'Seller COD Remittance' },
  { name: 'Courier COD Remittance' }
];

const INITIAL_MOCK_COD = Array.from({ length: 45 }, (_, i) => ({
  id: `86543`,
  awb: `QPSP${String(45 + i).padStart(9, '0')}`,
  userName: 'Dinesh Tharwani',
  userEmail: 'dineshtharwani@gmail.com',
  date: '13th Apr 2026',
  day: 'Wednesday',
  courier: 'Ekart Surface',
  deliveredDate: '13 Apr 2026',
  codAmount: 145.99,
  status: 'Pending',
  utr: 'N/A',
  creditedAmount: 0.00,
  adjustedAmount: 0.00,
  earlyCodCharges: 0.00,
  remittanceAmount: 8009.86,
}));

// Mock data for COD Remittance
const COD_REMITTANCE_DATA = Array.from({ length: 15 }, (_, i) => ({
  id: `86543`,
  awb: `QPSP${String(45 + i).padStart(9, '0')}`,
  userName: 'Dinesh Tharwani',
  userEmail: 'dineshtharwani@gmail.com',
  date: '13th Apr 2026',
  day: 'Wednesday',
  utr: 'N/A',
  totalCodAmount: 145.99,
  creditedAmount: 0.00,
  adjustedAmount: 0.00,
  earlyCodCharges: 0.00,
  remittanceAmount: 8009.86,
  status: 'Pending',
}));

// Mock data for Courier COD Remittance
const COURIER_COD_REMITTANCE_DATA = Array.from({ length: 15 }, (_, i) => ({
  id: `86543`,
  awb: `QPSP${String(45 + i).padStart(9, '0')}`,
  courierName: 'Delhivery',
  courierId: 'DEL-892',
  date: '13th Apr 2026',
  day: 'Wednesday',
  utr: 'N/A',
  totalCodAmount: 145.99,
  creditedAmount: 0.00,
  adjustedAmount: 0.00,
  earlyCodCharges: 0.00,
  remittanceAmount: 8009.86,
  status: 'Pending',
}));

const STATUS_BADGE_STYLES: Record<string, string> = {
  'Pending': 'bg-amber-50 text-amber-700 border-amber-200',
  'Paid': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Success': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Remitted': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Failed': 'bg-rose-50 text-rose-700 border-rose-200',
  'Disputed': 'bg-rose-50 text-rose-700 border-rose-200',
};

const getStatusBadgeClass = (status: string) => {
  const normalized = status || '';
  return `${STATUS_BADGE_STYLES[normalized] || 'bg-blue-50 text-blue-700 border-blue-200'} px-2.5 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap shadow-sm`;
};

export function AdminCOD() {
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

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('All COD Orders');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [toast, setToast] = useState<{type: 'error' | 'success', text: string} | null>(null);

  const showToast = (type: 'error' | 'success', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3000);
  };

  // Filter States (All COD Orders)
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedCouriers, setSelectedCouriers] = useState<string[]>([]);
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [showActionMenu, setShowActionMenu] = useState(false);
  
  // COD Remittance Filters State
  const [remittanceSearchTerm, setRemittanceSearchTerm] = useState('');
  const [selectedUtrs, setSelectedUtrs] = useState<string[]>([]);
  const [selectedCodStatuses, setSelectedCodStatuses] = useState<string[]>([]);
  const [codDateStart, setCodDateStart] = useState('');
  const [codDateEnd, setCodDateEnd] = useState('');
  const [selectedCodOrders, setSelectedCodOrders] = useState<string[]>([]);
  
  // Courier COD Remittance Filters State
  const [courierRemittanceSearchTerm, setCourierRemittanceSearchTerm] = useState('');
  const [selectedCourierUtrs, setSelectedCourierUtrs] = useState<string[]>([]);
  const [selectedCourierCodStatuses, setSelectedCourierCodStatuses] = useState<string[]>([]);
  const [courierCodDateStart, setCourierCodDateStart] = useState('');
  const [courierCodDateEnd, setCourierCodDateEnd] = useState('');
  const [showCourierActionMenu, setShowCourierActionMenu] = useState(false);
  const [selectedCourierCodOrders, setSelectedCourierCodOrders] = useState<string[]>([]);

  // Dropdown Options
  const STATUS_OPTIONS = [
    { label: 'Pending', value: 'Pending' },
    { label: 'Paid', value: 'Paid' }
  ];
  const UTR_OPTIONS = [
    { label: 'Pending', value: 'Pending' },
    { label: 'Completed', value: 'Completed' }
  ];
  const COURIER_OPTIONS = [
    { label: 'Ekart Surface', value: 'Ekart Surface' },
    { label: 'Delhivery', value: 'Delhivery' }
  ];

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const toggleAllCod = () => setSelectedCodOrders(selectedCodOrders.length === COD_REMITTANCE_DATA.length && COD_REMITTANCE_DATA.length > 0 ? [] : COD_REMITTANCE_DATA.map(o => o.awb));
  const toggleSelectCod = (id: string) => setSelectedCodOrders(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const toggleAllCourierCod = () => setSelectedCourierCodOrders(selectedCourierCodOrders.length === COURIER_COD_REMITTANCE_DATA.length && COURIER_COD_REMITTANCE_DATA.length > 0 ? [] : COURIER_COD_REMITTANCE_DATA.map(o => o.awb));
  const toggleSelectCourierCod = (id: string) => setSelectedCourierCodOrders(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleExportData = (type: 'seller' | 'courier', filename: string) => {
    if (type === 'seller' && selectedCodOrders.length === 0) {
      showToast('error', "Please select at least one Seller COD record to export data.");
      return;
    }
    if (type === 'courier' && selectedCourierCodOrders.length === 0) {
      showToast('error', "Please select at least one Courier COD record to export data.");
      return;
    }

    // Simulated export logic
    const content = "AWB,Total_COD,Status\nQPSP000000045,145.99,Pending";
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    setShowActionMenu(false);
    setShowCourierActionMenu(false);
  };

  const handleUploadResponse = (type: 'seller' | 'courier') => {
    if (type === 'seller' && selectedCodOrders.length === 0) {
      showToast('error', "Please select at least one Seller COD record to upload bank response.");
      return;
    }
    if (type === 'courier' && selectedCourierCodOrders.length === 0) {
      showToast('error', "Please select at least one Courier COD record to upload bank response.");
      return;
    }

    // Simulated file input trigger
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv, .xlsx';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        showToast('success', `Successfully uploaded ${file.name}`);
        setShowActionMenu(false);
        setShowCourierActionMenu(false);
      }
    };
    input.click();
  };

  const handleTransferCOD = (type: 'seller' | 'courier') => {
    if (type === 'seller' && selectedCodOrders.length === 0) {
      showToast('error', "Please select at least one Seller COD record to transfer COD.");
      return;
    }
    if (type === 'courier' && selectedCourierCodOrders.length === 0) {
      showToast('error', "Please select at least one Courier COD record to transfer COD.");
      return;
    }
    navigate(`/admin/transfer-cod?type=${type}`);
  };

  const filteredOrders = useMemo(() => {
    return INITIAL_MOCK_COD.filter(order => {
      const searchLower = searchTerm.toLowerCase();
      const matchSearch = searchTerm ? 
        order.userName.toLowerCase().includes(searchLower) || 
        order.userEmail.toLowerCase().includes(searchLower) ||
        order.awb.toLowerCase().includes(searchLower) ||
        order.id.toLowerCase().includes(searchLower) : true;
      const matchGlobal = globalSearchQuery ?
        order.userName.toLowerCase().includes(globalSearchQuery) || 
        order.userEmail.toLowerCase().includes(globalSearchQuery) || 
        order.awb.toLowerCase().includes(globalSearchQuery) ||
        order.id.toLowerCase().includes(globalSearchQuery) : true;
      const matchStatus = selectedStatuses.length === 0 || selectedStatuses.includes(order.status);
      const matchCourier = selectedCouriers.length === 0 || selectedCouriers.includes(order.courier);
      
      return matchSearch && matchGlobal && matchStatus && matchCourier;
    });
  }, [searchTerm, globalSearchQuery, selectedStatuses, selectedCouriers]);

  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredOrders, currentPage]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

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
                  {tab.name}
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
        {/* Summary Cards Row */}
        {activeTab === 'Seller COD Remittance' && (
          <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC]/30 flex flex-nowrap overflow-x-auto gap-4 no-scrollbar">
            <div className="flex-1 min-w-[200px] bg-[#F0F9FF] rounded-xl p-3 border border-[#E0F2FE] flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#DBEAFE] flex items-center justify-center shrink-0">
                <Wallet className="w-4 h-4 text-[#3B82F6]" />
              </div>
              <div>
                <div className="text-[14px] font-bold text-[#0F172A]">₹34,57,876.49</div>
                <div className="text-[10px] font-semibold text-[#64748B]">COD To Be Remitted</div>
              </div>
            </div>
            <div className="flex-1 min-w-[200px] bg-[#FAF5FF] rounded-xl p-3 border border-[#F3E8FF] flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#F3E8FF] flex items-center justify-center shrink-0">
                <Send className="w-4 h-4 text-[#A855F7]" />
              </div>
              <div>
                <div className="text-[14px] font-bold text-[#0F172A]">₹34,57,876.49</div>
                <div className="text-[10px] font-semibold text-[#64748B]">Last COD Remitted</div>
              </div>
            </div>
            <div className="flex-1 min-w-[200px] bg-[#F0FDFA] rounded-xl p-3 border border-[#CCFBF1] flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#CCFBF1] flex items-center justify-center shrink-0">
                <Banknote className="w-4 h-4 text-[#14B8A6]" />
              </div>
              <div>
                <div className="text-[14px] font-bold text-[#0F172A]">₹34,57,876.49</div>
                <div className="text-[10px] font-semibold text-[#64748B]">Total COD Remitted</div>
              </div>
            </div>
            <div className="flex-1 min-w-[200px] bg-[#FEFCE8] rounded-xl p-3 border border-[#FEF08A] flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#FEF08A] flex items-center justify-center shrink-0">
                <MinusCircle className="w-4 h-4 text-[#EAB308]" />
              </div>
              <div>
                <div className="text-[14px] font-bold text-[#0F172A]">₹34,57,876.49</div>
                <div className="text-[10px] font-semibold text-[#64748B]">Total Deduction</div>
              </div>
            </div>
            <div className="flex-1 min-w-[200px] bg-[#F8F5FF] rounded-xl p-3 border border-[#F3EFFF] flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#EADDFF] flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-[#8B5CF6]" />
              </div>
              <div>
                <div className="text-[14px] font-bold text-[#0F172A]">₹34,57,876.49</div>
                <div className="text-[10px] font-semibold text-[#64748B]">Remittance Initiated</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Courier COD Remittance' && (
          <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC]/30 flex flex-nowrap overflow-x-auto gap-4 no-scrollbar">
            <div className="flex-1 min-w-[200px] bg-[#F0F9FF] rounded-xl p-3 border border-[#E0F2FE] flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#DBEAFE] flex items-center justify-center shrink-0">
                <Banknote className="w-4 h-4 text-[#3B82F6]" />
              </div>
              <div>
                <div className="text-[14px] font-bold text-[#0F172A]">₹34,57,876.49</div>
                <div className="text-[10px] font-semibold text-[#64748B]">Total Courier COD Remitted</div>
              </div>
            </div>
            <div className="flex-1 min-w-[200px] bg-[#FEFCE8] rounded-xl p-3 border border-[#FEF08A] flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#FEF08A] flex items-center justify-center shrink-0">
                <MinusCircle className="w-4 h-4 text-[#EAB308]" />
              </div>
              <div>
                <div className="text-[14px] font-bold text-[#0F172A]">₹34,57,876.49</div>
                <div className="text-[10px] font-semibold text-[#64748B]">Total Deduction</div>
              </div>
            </div>
            <div className="flex-1 min-w-[200px] bg-[#FAF5FF] rounded-xl p-3 border border-[#F3E8FF] flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#F3E8FF] flex items-center justify-center shrink-0">
                <Send className="w-4 h-4 text-[#A855F7]" />
              </div>
              <div>
                <div className="text-[14px] font-bold text-[#0F172A]">₹34,57,876.49</div>
                <div className="text-[10px] font-semibold text-[#64748B]">Remittance Initiated</div>
              </div>
            </div>
            <div className="flex-1 min-w-[200px] bg-[#F0F9FF] rounded-xl p-3 border border-[#E0F2FE] flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#DBEAFE] flex items-center justify-center shrink-0">
                <Wallet className="w-4 h-4 text-[#3B82F6]" />
              </div>
              <div>
                <div className="text-[14px] font-bold text-[#0F172A]">₹34,57,876.49</div>
                <div className="text-[10px] font-semibold text-[#64748B]">COD To Be Remitted</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'All COD Orders' && (
          <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC]/30 flex flex-wrap gap-4">
            <div className="flex-1 min-w-[250px] bg-[#F0F9FA] rounded-xl p-4 border border-[#E6F0F2] flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#E0F2F4] flex items-center justify-center shrink-0">
                <Banknote className="w-5 h-5 text-[#0EA5E9]" />
              </div>
              <div>
                <div className="text-lg font-bold text-[#0F172A]">₹34,57,876.49</div>
                <div className="text-xs font-semibold text-[#64748B]">Total COD Amount</div>
              </div>
            </div>
            
            <div className="flex-1 min-w-[250px] bg-[#FFFdf0] rounded-xl p-4 border border-[#FDF6E3] flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#FEF9C3] flex items-center justify-center shrink-0">
                <Package className="w-5 h-5 text-[#EAB308]" />
              </div>
              <div>
                <div className="text-lg font-bold text-[#0F172A]">₹34,57,876.49</div>
                <div className="text-xs font-semibold text-[#64748B]">Paid COD Amount</div>
              </div>
            </div>

            <div className="flex-1 min-w-[250px] bg-[#F8F5FF] rounded-xl p-4 border border-[#F3EFFF] flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#EADDFF] flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-[#8B5CF6]" />
              </div>
              <div>
                <div className="text-lg font-bold text-[#0F172A]">₹34,57,876.49</div>
                <div className="text-xs font-semibold text-[#64748B]">Pending COD Amount</div>
              </div>
            </div>
          </div>
        )}

        {/* Filters Row */}
        {activeTab === 'All COD Orders' && (
          <>
            <div className="p-3 border-b border-[#E2E8F0] flex flex-nowrap items-center gap-2.5 bg-white">
              <input 
                type="text" 
                placeholder="Search by name, email, AWB, or ID..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs bg-white focus:outline-none w-[180px] shrink-0" 
              />
              
              <GlassDropdown
                label="Status"
                options={STATUS_OPTIONS}
                selected={selectedStatuses}
                onChange={setSelectedStatuses}
                placeholder="Search status..."
                icon={<CheckCircle2 className="w-3.5 h-3.5" />}
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

              <button className="h-9 px-4 shrink-0 rounded-lg bg-[#00A86B] text-white text-xs font-bold hover:bg-[#009B63] transition-colors shadow-sm flex items-center gap-1.5 justify-center">
                <Clock className="w-3.5 h-3.5" /> Early COD
              </button>

              <div className="ml-auto flex items-center gap-2 shrink-0">
                <button className="w-9 h-9 rounded-full border border-[#00A86B] flex items-center justify-center text-[#00A86B] hover:bg-[#00A86B]/5 transition-colors bg-white shadow-sm">
                  <Upload className="w-4 h-4" />
                </button>
                <button className="w-9 h-9 rounded-full border border-[#00A86B] flex items-center justify-center text-[#00A86B] hover:bg-[#00A86B]/5 transition-colors bg-white shadow-sm">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bulk Actions Toolbar */}
            {selectedOrders.length > 0 && (
              <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex items-center gap-3 animate-fade-in">
                <span className="text-xs font-bold text-blue-700">{selectedOrders.length} selected</span>
                <button className="h-8 px-3 rounded-md bg-white border border-blue-200 text-xs font-bold text-blue-700 shadow-sm ml-auto hover:bg-blue-100">Export Selected</button>
              </div>
            )}
          </>
        )}

        {activeTab === 'Seller COD Remittance' && (
          <>
            {/* Filters Row */}
            <div className="p-3 border-b border-[#E2E8F0] flex flex-wrap items-center gap-2.5 bg-white">
              <input 
                type="text" 
                placeholder="Search by name, email, or Remittance ID..." 
                value={remittanceSearchTerm}
                onChange={(e) => setRemittanceSearchTerm(e.target.value)}
                className="h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs bg-white focus:outline-none w-[180px] shrink-0" 
              />
              
              <GlassDropdown
                label="UTR"
                options={UTR_OPTIONS}
                selected={selectedUtrs}
                onChange={setSelectedUtrs}
                placeholder="Search UTR..."
                icon={<FileText className="w-3.5 h-3.5" />}
              />

              <GlassDropdown
                label="Status"
                options={STATUS_OPTIONS}
                selected={selectedCodStatuses}
                onChange={setSelectedCodStatuses}
                placeholder="Search status..."
                icon={<CheckCircle2 className="w-3.5 h-3.5" />}
              />

              <GlassDateFilter
                align="right"
                startDate={codDateStart}
                endDate={codDateEnd}
                onDateChange={(s, e) => { setCodDateStart(s); setCodDateEnd(e); }}
              />
              
              <button className="h-9 px-4 shrink-0 rounded-lg bg-[#00A86B] text-white text-xs font-bold hover:bg-[#009B63] transition-colors shadow-sm flex items-center justify-center">
                Apply
              </button>

              <div className="relative shrink-0 ml-auto">
                <button
                  onClick={() => setShowActionMenu(!showActionMenu)}
                  className="h-9 pl-4 pr-8 rounded-full border border-[#E2E8F0] text-xs bg-white focus:outline-none flex items-center font-bold text-[#475569] shadow-sm hover:bg-[#F8FAFC] transition-colors"
                >
                  Action
                  <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                </button>
                {showActionMenu && (
                  <div className="absolute right-0 top-full mt-2 w-[180px] bg-white rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-[#E2E8F0] py-2 z-50">
                    <button onClick={() => handleExportData('seller', 'seller_remittance_data.csv')} className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors">Export Data</button>
                    <button onClick={() => handleExportData('seller', 'bank_template.csv')} className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors">Export Bank Template</button>
                    <button onClick={() => handleUploadResponse('seller')} className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors">Upload Bank Response</button>
                    <button onClick={() => handleTransferCOD('seller')} className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#00A86B] hover:bg-[#F0FDF4] transition-colors">Transfer COD</button>
                  </div>
                )}
              </div>
            </div>

            {/* Bulk Actions Toolbar */}
            {selectedCodOrders.length > 0 && (
              <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex items-center gap-3 animate-fade-in">
                <span className="text-xs font-bold text-blue-700">{selectedCodOrders.length} selected</span>
                <button className="h-8 px-3 rounded-md bg-white border border-blue-200 text-xs font-bold text-blue-700 shadow-sm ml-auto hover:bg-blue-100">Export Selected</button>
              </div>
            )}
          </>
        )}

        {activeTab === 'Courier COD Remittance' && (
          <>
            {/* Filters Row */}
            <div className="p-3 border-b border-[#E2E8F0] flex flex-wrap items-center gap-2.5 bg-white">
              <input 
                type="text" 
                placeholder="Search by courier or Remittance ID..." 
                value={courierRemittanceSearchTerm}
                onChange={(e) => setCourierRemittanceSearchTerm(e.target.value)}
                className="h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs bg-white focus:outline-none w-[180px] shrink-0" 
              />
              
              <GlassDropdown
                label="UTR"
                options={UTR_OPTIONS}
                selected={selectedCourierUtrs}
                onChange={setSelectedCourierUtrs}
                placeholder="Search UTR..."
                icon={<FileText className="w-3.5 h-3.5" />}
              />

              <GlassDropdown
                label="Status"
                options={STATUS_OPTIONS}
                selected={selectedCourierCodStatuses}
                onChange={setSelectedCourierCodStatuses}
                placeholder="Search status..."
                icon={<CheckCircle2 className="w-3.5 h-3.5" />}
              />

              <GlassDateFilter
                align="right"
                startDate={courierCodDateStart}
                endDate={courierCodDateEnd}
                onDateChange={(s, e) => { setCourierCodDateStart(s); setCourierCodDateEnd(e); }}
              />
              
              <button className="h-9 px-4 shrink-0 rounded-lg bg-[#00A86B] text-white text-xs font-bold hover:bg-[#009B63] transition-colors shadow-sm flex items-center justify-center">
                Apply
              </button>

              <div className="relative shrink-0 ml-auto">
                <button
                  onClick={() => setShowCourierActionMenu(!showCourierActionMenu)}
                  className="h-9 pl-4 pr-8 rounded-full border border-[#E2E8F0] text-xs bg-white focus:outline-none flex items-center font-bold text-[#475569] shadow-sm hover:bg-[#F8FAFC] transition-colors"
                >
                  Action
                  <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                </button>
                {showCourierActionMenu && (
                  <div className="absolute right-0 top-full mt-2 w-[180px] bg-white rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-[#E2E8F0] py-2 z-50">
                    <button onClick={() => handleExportData('courier', 'courier_remittance_data.csv')} className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors">Export Data</button>
                    <button onClick={() => handleExportData('courier', 'courier_bank_template.csv')} className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors">Export Bank Template</button>
                    <button onClick={() => handleUploadResponse('courier')} className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors">Upload Bank Response</button>
                    <button onClick={() => handleTransferCOD('courier')} className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#00A86B] hover:bg-[#F0FDF4] transition-colors">Transfer COD</button>
                  </div>
                )}
              </div>
            </div>

            {/* Bulk Actions Toolbar */}
            {selectedCourierCodOrders.length > 0 && (
              <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex items-center gap-3 animate-fade-in">
                <span className="text-xs font-bold text-blue-700">{selectedCourierCodOrders.length} selected</span>
                <button className="h-8 px-3 rounded-md bg-white border border-blue-200 text-xs font-bold text-blue-700 shadow-sm ml-auto hover:bg-blue-100">Export Selected</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Table Section */}
      <div className="bg-white flex flex-col flex-1 min-h-0 overflow-hidden border-t border-[#E2E8F0]">
        {activeTab === 'All COD Orders' && (
          <div className="flex-1 overflow-auto no-scrollbar relative">
            <table className="w-full text-left border-collapse min-w-[1000px]">
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
                      <Package className="w-3.5 h-3.5 shrink-0" />
                      <span>Order</span>
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
                      <Banknote className="w-3.5 h-3.5 shrink-0" />
                      <span>COD Amount</span>
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
                {paginatedOrders.map((order) => (
                  <tr key={order.awb} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors group">
                    <td className="p-3">
                      <input type="checkbox" checked={selectedOrders.includes(order.awb)} onChange={() => toggleSelect(order.awb)} className="rounded border-gray-300 accent-[#00A86B] w-3.5 h-3.5" />
                    </td>
                    <td className="p-3">
                      <div className="text-xs font-semibold text-[#00A86B] cursor-pointer hover:underline">{order.id}</div>
                      <div className="text-sm font-semibold text-[#0F172A] mt-0.5">{order.userName}</div>
                      <div className="font-sans text-xs font-normal text-[#94A3B8]">{order.userEmail}</div>
                    </td>
                    <td className="p-3">
                      <div className="text-xs font-semibold text-[#00A86B] cursor-pointer hover:underline">{order.id}</div>
                      <div className="table-date mt-0.5">{order.date}</div>
                      <div className="mt-1"><span className="px-2 py-0.5 rounded-full border border-blue-200 text-blue-600 font-bold text-[9px] bg-blue-50/50">Custom</span></div>
                    </td>
                    <td className="p-3">
                      <div className="text-xs font-semibold text-[#00A86B]">{order.courier}</div>
                      <div className="table-date mt-0.5">Delivered On : {order.deliveredDate}</div>
                      <div className="text-xs font-semibold text-[#00A86B] underline decoration-solid underline-offset-2 mt-0.5 hover:text-[#009B63] cursor-pointer">{order.awb}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-[#0F172A] text-[12px]">₹{order.codAmount}</div>
                    </td>
                    <td className="p-3">
                      <span className={getStatusBadgeClass(order.status)}>{order.status}</span>
                    </td>
                  </tr>
                ))}
                {paginatedOrders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-[#64748B] font-medium">
                      No COD orders found matching your criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'Seller COD Remittance' && (
          <div className="flex-1 overflow-auto no-scrollbar relative">
            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead className="sticky top-0 z-40 bg-[#E6F5F1] shadow-sm">
                <tr className="text-xs font-medium text-[#00A86B] uppercase tracking-wider">
                  <th className="p-3 w-10 text-left align-middle">
                    <input type="checkbox" checked={selectedCodOrders.length === COD_REMITTANCE_DATA.length && COD_REMITTANCE_DATA.length > 0} onChange={toggleAllCod} className="rounded border-[#00A86B] accent-[#00A86B] w-3.5 h-3.5" />
                  </th>
                  <th className="p-3 text-left align-middle whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 shrink-0" />
                      <span>User</span>
                    </div>
                  </th>
                  <th className="p-3 text-left align-middle whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 shrink-0" />
                      <span>Remittance ID</span>
                    </div>
                  </th>
                  <th className="p-3 text-left align-middle whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 shrink-0" />
                      <span>UTR</span>
                    </div>
                  </th>
                  <th className="p-3 text-left align-middle whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Banknote className="w-3.5 h-3.5 shrink-0" />
                      <span>Total COD</span>
                    </div>
                  </th>
                  <th className="p-3 text-left align-middle whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Banknote className="w-3.5 h-3.5 shrink-0" />
                      <span>Wallet Credit</span>
                    </div>
                  </th>
                  <th className="p-3 text-left align-middle whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Banknote className="w-3.5 h-3.5 shrink-0" />
                      <span>Adjusted</span>
                    </div>
                  </th>
                  <th className="p-3 text-left align-middle whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Banknote className="w-3.5 h-3.5 shrink-0" />
                      <span>Early COD Fee</span>
                    </div>
                  </th>
                  <th className="p-3 text-left align-middle whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Banknote className="w-3.5 h-3.5 shrink-0" />
                      <span>Net Remittance</span>
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
                {COD_REMITTANCE_DATA.map((order) => (
                  <tr key={order.awb} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors group">
                    <td className="p-3">
                      <input type="checkbox" checked={selectedCodOrders.includes(order.awb)} onChange={() => toggleSelectCod(order.awb)} className="rounded border-gray-300 accent-[#00A86B] w-3.5 h-3.5" />
                    </td>
                    <td className="p-3">
                      <div className="text-xs font-semibold text-[#00A86B] cursor-pointer hover:underline">{order.id}</div>
                      <div className="text-sm font-semibold text-[#0F172A] mt-0.5">{order.userName}</div>
                      <div className="font-sans text-xs font-normal text-[#94A3B8]">{order.userEmail}</div>
                    </td>
                    <td className="p-3">
                      <div className="text-xs font-semibold text-[#00A86B] cursor-pointer hover:underline">{order.id}</div>
                      <div className="table-date mt-0.5">{order.date}</div>
                      <div className="table-date mt-0.5">{order.day}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-[#00A86B]">{order.utr}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-[#0F172A] text-[11px]">₹{order.totalCodAmount}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-red-500 text-[11px]">₹{order.creditedAmount.toFixed(2)}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-[#64748B] text-[11px]">₹{order.adjustedAmount.toFixed(2)}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-red-500 text-[11px]">₹{order.earlyCodCharges.toFixed(2)}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-[#00A86B] text-[11px]">₹{order.remittanceAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
                    </td>
                    <td className="p-3">
                      <span className={getStatusBadgeClass(order.status)}>{order.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'Courier COD Remittance' && (
          <div className="flex-1 overflow-auto no-scrollbar relative">
            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead className="sticky top-0 z-40 bg-[#E6F5F1] shadow-sm">
                <tr className="text-xs font-medium text-[#00A86B] uppercase tracking-wider">
                  <th className="p-3 w-10 text-left align-middle">
                    <input type="checkbox" checked={selectedCourierCodOrders.length === COURIER_COD_REMITTANCE_DATA.length && COURIER_COD_REMITTANCE_DATA.length > 0} onChange={toggleAllCourierCod} className="rounded border-[#00A86B] accent-[#00A86B] w-3.5 h-3.5" />
                  </th>
                  <th className="p-3 text-left align-middle whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 shrink-0" />
                      <span>Courier</span>
                    </div>
                  </th>
                  <th className="p-3 text-left align-middle whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 shrink-0" />
                      <span>Remittance ID</span>
                    </div>
                  </th>
                  <th className="p-3 text-left align-middle whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 shrink-0" />
                      <span>UTR</span>
                    </div>
                  </th>
                  <th className="p-3 text-left align-middle whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Banknote className="w-3.5 h-3.5 shrink-0" />
                      <span>Total COD</span>
                    </div>
                  </th>
                  <th className="p-3 text-left align-middle whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Banknote className="w-3.5 h-3.5 shrink-0" />
                      <span>Wallet Credit</span>
                    </div>
                  </th>
                  <th className="p-3 text-left align-middle whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Banknote className="w-3.5 h-3.5 shrink-0" />
                      <span>Adjusted</span>
                    </div>
                  </th>
                  <th className="p-3 text-left align-middle whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Banknote className="w-3.5 h-3.5 shrink-0" />
                      <span>Early COD Fee</span>
                    </div>
                  </th>
                  <th className="p-3 text-left align-middle whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Banknote className="w-3.5 h-3.5 shrink-0" />
                      <span>Net Remittance</span>
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
                {COURIER_COD_REMITTANCE_DATA.map((order) => (
                  <tr key={order.awb} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors group">
                    <td className="p-3">
                      <input type="checkbox" checked={selectedCourierCodOrders.includes(order.awb)} onChange={() => toggleSelectCourierCod(order.awb)} className="rounded border-gray-300 accent-[#00A86B] w-3.5 h-3.5" />
                    </td>
                    <td className="p-3">
                      <div className="text-xs font-semibold text-[#0F172A]">{order.courierName}</div>
                      <div className="text-[#94A3B8] mt-0.5 text-[11px]">{order.courierId}</div>
                    </td>
                    <td className="p-3">
                      <div className="text-xs font-semibold text-[#00A86B] cursor-pointer hover:underline">{order.id}</div>
                      <div className="table-date mt-0.5">{order.date}</div>
                      <div className="table-date mt-0.5">{order.day}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-[#00A86B]">{order.utr}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-[#0F172A] text-[11px]">₹{order.totalCodAmount}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-red-500 text-[11px]">₹{order.creditedAmount.toFixed(2)}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-[#64748B] text-[11px]">₹{order.adjustedAmount.toFixed(2)}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-red-500 text-[11px]">₹{order.earlyCodCharges.toFixed(2)}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-[#00A86B] text-[11px]">₹{order.remittanceAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
                    </td>
                    <td className="p-3">
                      <span className={getStatusBadgeClass(order.status)}>{order.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {activeTab === 'All COD Orders' && totalPages > 0 && (
          <div className="p-4 border-t border-[#E2E8F0] flex items-center justify-between">
            <div className="text-xs text-[#64748B]">
              Showing <span className="font-bold text-[#0F172A]">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-[#0F172A]">{Math.min(currentPage * itemsPerPage, filteredOrders.length)}</span> of <span className="font-bold text-[#0F172A]">{filteredOrders.length}</span> entries
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

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-[100] bg-[#1E293B] text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border border-white/10 min-w-[320px]"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${toast.type === 'error' ? 'bg-red-500/20' : 'bg-emerald-500/20'}`}>
              {toast.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-[#F87171]" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-[#34D399]" />
              )}
            </div>
            <p className="text-[13px] font-medium pr-4">{toast.text}</p>
            <button onClick={() => setToast(null)} className="p-1 hover:bg-white/10 rounded-md transition-colors ml-auto text-[#94A3B8] hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
