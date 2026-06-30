import React, { useState, useEffect, useMemo } from 'react';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { usePagination } from '../../hooks/usePagination';
import { GlassDropdown } from '../../components/ui/GlassDropdown';
import { 
  Search, RefreshCcw, User, 
  MoreVertical, Package, Truck, Wallet,
  Phone, Calendar, ChevronDown
} from 'lucide-react';

const MOCK_REFERRALS = [
  {
    userId: '86543',
    name: 'Dinesh Tharwani',
    email: 'dineshtharwani@gmail.com',
    phone: '8765432198',
    orders: '5',
    shipping: '₹4,500.00',
    commission: '₹450.00',
    period: 'March 2026'
  },
  {
    userId: '86544',
    name: 'Amit Sharma',
    email: 'amit.sharma@outlook.com',
    phone: '9876543210',
    orders: '2',
    shipping: '₹1,800.00',
    commission: '₹180.00',
    period: 'April 2026'
  },
  {
    userId: '86545',
    name: 'Pooja Patel',
    email: 'pooja.patel@gmail.com',
    phone: '7654321098',
    orders: '12',
    shipping: '₹11,200.00',
    commission: '₹1,120.00',
    period: 'March 2026'
  },
  {
    userId: '86546',
    name: 'Rahul Verma',
    email: 'rahulv@yahoo.com',
    phone: '8901234567',
    orders: '8',
    shipping: '₹6,400.00',
    commission: '₹640.00',
    period: 'May 2026'
  },
  {
    userId: '86547',
    name: 'Siddharth Jain',
    email: 'sid.jain@gmail.com',
    phone: '9012345678',
    orders: '3',
    shipping: '₹2,700.00',
    commission: '₹270.00',
    period: 'February 2026'
  },
  {
    userId: '86548',
    name: 'Priya Nair',
    email: 'priya.nair@gmail.com',
    phone: '7012345678',
    orders: '15',
    shipping: '₹13,500.00',
    commission: '₹1,350.00',
    period: 'March 2025'
  },
  {
    userId: '86549',
    name: 'Vikas Gupta',
    email: 'vikas.g@gmail.com',
    phone: '8123456789',
    orders: '4',
    shipping: '₹3,600.00',
    commission: '₹360.00',
    period: 'June 2026'
  }
];

const MONTH_OPTIONS = [
  { label: 'January', value: 'January' },
  { label: 'February', value: 'February' },
  { label: 'March', value: 'March' },
  { label: 'April', value: 'April' },
  { label: 'May', value: 'May' },
  { label: 'June', value: 'June' },
  { label: 'July', value: 'July' },
  { label: 'August', value: 'August' },
  { label: 'September', value: 'September' },
  { label: 'October', value: 'October' },
  { label: 'November', value: 'November' },
  { label: 'December', value: 'December' },
];

const YEAR_OPTIONS = [
  { label: '2025', value: '2025' },
  { label: '2026', value: '2026' },
  { label: '2027', value: '2027' },
];

export function AdminReferral() {
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
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

  const filteredReferrals = useMemo(() => {
    return MOCK_REFERRALS.filter(row => {
      // 1. Local Search Term (Name, Email, Phone, User ID)
      if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        const matchName = row.name.toLowerCase().includes(lowerSearch);
        const matchEmail = row.email.toLowerCase().includes(lowerSearch);
        const matchPhone = row.phone.includes(searchTerm);
        const matchUserId = row.userId.includes(searchTerm);
        if (!matchName && !matchEmail && !matchPhone && !matchUserId) return false;
      }

      // 2. Global Search Query (Name, Email, Phone, User ID, Period)
      if (globalSearchQuery) {
        const lowerGlobal = globalSearchQuery.toLowerCase();
        const matchName = row.name.toLowerCase().includes(lowerGlobal);
        const matchEmail = row.email.toLowerCase().includes(lowerGlobal);
        const matchPhone = row.phone.includes(lowerGlobal);
        const matchUserId = row.userId.includes(lowerGlobal);
        const matchPeriod = row.period.toLowerCase().includes(lowerGlobal);
        if (!matchName && !matchEmail && !matchPhone && !matchUserId && !matchPeriod) return false;
      }

      // 3. Month Filter
      if (selectedMonths.length > 0) {
        const periodMonth = row.period.split(' ')[0].toLowerCase();
        if (!selectedMonths.some(m => m.toLowerCase() === periodMonth)) return false;
      }

      // 4. Year Filter
      if (selectedYears.length > 0) {
        const periodYear = row.period.split(' ')[1];
        if (!selectedYears.includes(periodYear)) return false;
      }

      return true;
    });
  }, [searchTerm, globalSearchQuery, selectedMonths, selectedYears]);

  const {
    page: currentPage,
    setPage: setCurrentPage,
    totalPages,
    paginatedData: paginatedReferrals,
    startIndex,
    endIndex,
  } = usePagination({ data: filteredReferrals, perPage: 10 });

  const computedStats = useMemo(() => {
    let totalOrders = 0;
    let totalShipping = 0;
    let totalCommission = 0;

    filteredReferrals.forEach(row => {
      totalOrders += parseInt(row.orders, 10) || 0;
      const shippingVal = parseFloat(row.shipping.replace(/[^0-9.]/g, '')) || 0;
      const commissionVal = parseFloat(row.commission.replace(/[^0-9.]/g, '')) || 0;
      totalShipping += shippingVal;
      totalCommission += commissionVal;
    });

    const formatCurrency = (val: number) => {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2
      }).format(val);
    };

    return [
      { label: 'Total Referrers', value: String(filteredReferrals.length), icon: User, color: 'text-blue-500', iconBg: 'bg-blue-100', cardBg: 'bg-blue-50/30' },
      { label: 'Total Referral Orders', value: String(totalOrders), icon: Package, color: 'text-fuchsia-500', iconBg: 'bg-fuchsia-100', cardBg: 'bg-fuchsia-50/30' },
      { label: 'Total Shipping', value: formatCurrency(totalShipping), icon: Truck, color: 'text-emerald-500', iconBg: 'bg-emerald-100', cardBg: 'bg-emerald-50/30' },
      { label: 'Total Commission', value: formatCurrency(totalCommission), icon: Wallet, color: 'text-yellow-600', iconBg: 'bg-yellow-100', cardBg: 'bg-yellow-50/30' },
    ];
  }, [filteredReferrals]);

  const toggleAll = () => setSelectedRows(selectedRows.length === filteredReferrals.length ? [] : filteredReferrals.map(row => row.userId));
  const toggleSelect = (userId: string) => setSelectedRows(prev => prev.includes(userId) ? prev.filter(x => x !== userId) : [...prev, userId]);

  return (
    <AdminLayout>
      <div className="flex flex-col h-[calc(100vh-72px)] -m-4 md:-m-6 bg-white">
        <div className="bg-white relative z-50 shrink-0">
          {/* Top Header Row */}
          <div className="flex justify-between items-center px-6 py-3 border-b border-[#E2E8F0] bg-white">
            <h1 className="text-[20px] font-bold text-[#0F172A] tracking-tight">Referrals</h1>
            <div className="flex items-center gap-3 shrink-0 ml-auto">
              <button className="w-8 h-8 rounded-full border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-[#F8FAFC]">
                <RefreshCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="p-4 border-b border-[#E2E8F0] grid grid-cols-1 md:grid-cols-4 gap-4 bg-white">
            {computedStats.map((stat, i) => (
              <div key={i} className={`p-4 rounded-xl border border-[#E2E8F0] shadow-sm flex items-center gap-4 ${stat.cardBg}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${stat.iconBg} ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-[#0F172A] text-[15px]">{stat.value}</div>
                  <div className="text-[11px] text-[#64748B] font-medium">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Filter Row */}
          <div className="p-4 border-b border-[#E2E8F0] flex flex-wrap justify-between items-center gap-3 bg-[#F8FAFC]/50 relative z-20">
            <div className="flex flex-wrap items-center gap-3">
              <input 
                type="text" 
                placeholder="Search Referrals..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs bg-white focus:outline-none w-[180px] shrink-0" 
              />
              
              <GlassDropdown
                label="Month"
                options={MONTH_OPTIONS}
                selected={selectedMonths}
                onChange={setSelectedMonths}
                placeholder="Search month..."
                icon={<Calendar className="w-3.5 h-3.5" />}
              />

              <GlassDropdown
                label="Year"
                options={YEAR_OPTIONS}
                selected={selectedYears}
                onChange={setSelectedYears}
                placeholder="Search year..."
                icon={<Calendar className="w-3.5 h-3.5" />}
              />

              <button className="h-9 px-6 rounded-full bg-[#00A86B] text-white text-[11px] font-bold hover:bg-[#009B63] transition-colors shadow-sm">
                Apply
              </button>
            </div>

            <div className="relative shrink-0">
              <select className="h-9 pl-4 pr-8 rounded-full border border-[#00A86B]/30 text-[11px] font-bold text-[#00A86B] bg-white focus:outline-none appearance-none w-28 shadow-sm">
                <option>Action</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-[#00A86B] pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white flex flex-col flex-1 min-h-0 overflow-hidden border-t border-[#E2E8F0]">
          <div className="flex-1 overflow-y-auto overflow-x-auto w-full relative no-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-[#E6F5F1] text-xs font-medium text-[#00A86B] uppercase tracking-wider">
                  <th className="p-4 w-12 text-center">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-[#00A86B] focus:ring-[#00A86B]" 
                      onChange={toggleAll} 
                      checked={selectedRows.length === filteredReferrals.length && filteredReferrals.length > 0} 
                    />
                  </th>
                  <th className="p-4 whitespace-nowrap"><User className="w-3.5 h-3.5 inline mr-1"/> Refer By (User ID)</th>
                  <th className="p-4 whitespace-nowrap"><Phone className="w-3.5 h-3.5 inline mr-1"/> Contact Details</th>
                  <th className="p-4 whitespace-nowrap"><Package className="w-3.5 h-3.5 inline mr-1"/> Referral Orders</th>
                  <th className="p-4 whitespace-nowrap"><Truck className="w-3.5 h-3.5 inline mr-1"/> Total Shipping</th>
                  <th className="p-4 whitespace-nowrap"><Wallet className="w-3.5 h-3.5 inline mr-1"/> Commission</th>
                  <th className="p-4 whitespace-nowrap"><Calendar className="w-3.5 h-3.5 inline mr-1"/> Period</th>
                  <th className="p-4 whitespace-nowrap text-right pr-6"><MoreVertical className="w-3.5 h-3.5 inline mr-1"/> Actions</th>
                </tr>
              </thead>
              <tbody className="text-[11px] text-[#475569]">
                {paginatedReferrals.length > 0 ? (
                  paginatedReferrals.map((row, i) => (
                    <tr key={row.userId} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors">
                      <td className="p-4 align-top pt-5 text-center">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-[#00A86B] focus:ring-[#00A86B]" 
                          checked={selectedRows.includes(row.userId)} 
                          onChange={() => toggleSelect(row.userId)} 
                        />
                      </td>
                      <td className="p-4 align-top pt-4 text-[#0F172A]">
                        <div className="text-xs font-semibold text-[#00A86B] mb-0.5">{row.userId}</div>
                        <div className="font-normal text-[13px] text-[#0F172A] mt-0.5">{row.name}</div>
                      </td>
                      <td className="p-4 align-top pt-4">
                        <div className="font-sans text-xs font-normal text-[#475569] mb-0.5">{row.email}</div>
                        <div className="font-normal text-[13px] text-[#94A3B8]">{row.phone}</div>
                      </td>
                      <td className="p-4 align-top pt-5 font-sans text-xs font-normal text-[#475569]">{row.orders}</td>
                      <td className="p-4 align-top pt-5 text-[#00A86B] font-sans text-xs font-normal">{row.shipping}</td>
                      <td className="p-4 align-top pt-5 text-[#00A86B] font-sans text-xs font-normal">{row.commission}</td>
                      <td className="p-4 align-top pt-5 font-sans text-xs font-normal text-[#64748B]">{row.period}</td>
                      <td className="p-4 align-top pt-4 text-right pr-6">
                        <button className="px-4 py-1.5 rounded-full border border-[#00A86B] text-[#00A86B] font-bold text-[10px] hover:bg-[#E6F5F1] transition-colors shadow-sm">
                          Details
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-[#94A3B8] font-medium">
                      No referrals found matching the selected filters.
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
                Showing <span className="font-bold text-[#0F172A]">{startIndex}</span> to <span className="font-bold text-[#0F172A]">{endIndex}</span> of <span className="font-bold text-[#0F172A]">{filteredReferrals.length}</span> entries
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
    </AdminLayout>
  );
}
