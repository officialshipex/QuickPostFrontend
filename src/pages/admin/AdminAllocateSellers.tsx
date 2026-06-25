import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { 
  Search, RefreshCcw, ChevronDown, User, 
  Briefcase, Calendar, MoreVertical
} from 'lucide-react';
import { GlassDropdown } from '../../components/ui/GlassDropdown';

const MOCK_ALLOCATIONS = Array.from({ length: 9 }, (_, i) => ({
  serialNo: i + 1,
  sellerName: 'Dinesh Tharwani',
  sellerDate: '13th Apr 2026 | 04:34 PM',
  sellerEmail: 'dineshtharwani@gmail.com',
  execName: 'Dinesh Tharwani',
  execDate: '13th Apr 2026 | 04:34 PM',
  execEmail: 'dineshtharwani@gmail.com',
  allocDate: '13th Apr 2026',
  allocTime: '04:34 PM'
}));

export function AdminAllocateSellers() {
  const location = useLocation();
  const [globalSearchQuery, setGlobalSearchQuery] = React.useState((window as any).__adminSearchQuery?.toLowerCase() || '');

  React.useEffect(() => {
    const handleSearch = (e: Event) => {
      setGlobalSearchQuery(((e as CustomEvent).detail || '').toLowerCase());
    };
    window.addEventListener('admin-search', handleSearch);
    setGlobalSearchQuery(((window as any).__adminSearchQuery || '').toLowerCase());
    return () => {
      window.removeEventListener('admin-search', handleSearch);
    };
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSellers, setSelectedSellers] = useState<string[]>([]);
  const [selectedExecs, setSelectedExecs] = useState<string[]>([]);

  const SELLER_OPTIONS = [
    { label: '765321 - dinesh kumar', value: '765321' },
    { label: '765322 - rahul sharma', value: '765322' }
  ];

  const EXEC_OPTIONS = [
    { label: 'Amit Patel', value: 'Amit Patel' },
    { label: 'Priya Singh', value: 'Priya Singh' }
  ];

  const filteredAllocations = MOCK_ALLOCATIONS.filter(alloc => {
    if (globalSearchQuery) {
      if (!alloc.sellerName.toLowerCase().includes(globalSearchQuery) &&
          !alloc.sellerEmail.toLowerCase().includes(globalSearchQuery) &&
          !alloc.execName.toLowerCase().includes(globalSearchQuery) &&
          !alloc.execEmail.toLowerCase().includes(globalSearchQuery)) return false;
    }
    if (searchTerm) {
      if (!alloc.sellerName.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !alloc.execName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <AdminLayout>
      <div className="flex flex-col h-[calc(100vh-72px)] -m-4 md:-m-6 bg-white">
        <div className="bg-white relative z-50 shrink-0">

        {/* Page Header */}
        <div className="px-6 py-4 border-b border-[#E2E8F0] bg-white flex justify-end items-center z-50 relative shrink-0">
          <button className="h-9 px-4 rounded-[14px] bg-[#00A86B] text-white text-[12px] font-bold hover:bg-[#009B63] transition-colors shadow-sm flex items-center gap-1.5">
            New Allocation
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Filter and Action Row */}
        <div className="p-4 border-b border-[#E2E8F0] flex flex-wrap items-center gap-3 bg-white">
          <input 
            type="text" 
            placeholder="Search by Seller ID, Name, Employee ID" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 px-4 rounded-full border border-[#E2E8F0] text-xs bg-white focus:outline-none w-64 shrink-0 text-[#475569]" 
          />
          
          <GlassDropdown
            label="Seller"
            options={SELLER_OPTIONS}
            selected={selectedSellers}
            onChange={setSelectedSellers}
            placeholder="Search seller..."
            icon={<User className="w-3.5 h-3.5" />}
          />

          <GlassDropdown
            label="Sales Executive"
            options={EXEC_OPTIONS}
            selected={selectedExecs}
            onChange={setSelectedExecs}
            placeholder="Search executive..."
            icon={<Briefcase className="w-3.5 h-3.5" />}
          />

          <button className="h-9 px-6 rounded-full bg-[#00A86B] text-white text-xs font-bold hover:bg-[#009B63] transition-colors shadow-sm ml-2">
            Save
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white flex flex-col flex-1 min-h-0 overflow-hidden border-t border-[#E2E8F0]">
        <div className="flex-1 overflow-auto no-scrollbar relative">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="sticky top-0 z-40 bg-[#E6F5F1] shadow-sm">
              <tr className="text-[10px] font-bold text-[#00A86B] uppercase tracking-wider">
                <th className="p-4 w-16 text-center">Serial No.</th>
                <th className="p-4 whitespace-nowrap"><User className="w-3.5 h-3.5 inline mr-1"/> Seller</th>
                <th className="p-4 whitespace-nowrap"><Briefcase className="w-3.5 h-3.5 inline mr-1"/> Allotted Sales Executive</th>
                <th className="p-4 whitespace-nowrap"><Calendar className="w-3.5 h-3.5 inline mr-1"/> Date of Allocation</th>
                <th className="p-4 whitespace-nowrap text-right pr-6"><MoreVertical className="w-3.5 h-3.5 inline mr-1"/> Actions</th>
              </tr>
            </thead>
            <tbody className="text-[11px] text-[#475569]">
              {filteredAllocations.length > 0 ? filteredAllocations.map((alloc, i) => (
                <tr key={i} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors group">
                  <td className="p-4 text-center text-[#94A3B8] font-medium align-top pt-5">
                    {alloc.serialNo}
                  </td>
                  <td className="p-4 align-top pt-4">
                    <div className="font-bold text-[#0F172A] text-[11px]">{alloc.sellerName}</div>
                    <div className="text-[#64748B] mt-1">{alloc.sellerDate}</div>
                    <div className="text-[#94A3B8] mt-0.5">{alloc.sellerEmail}</div>
                  </td>
                  <td className="p-4 align-top pt-4">
                    <div className="font-bold text-[#0F172A] text-[11px]">{alloc.execName}</div>
                    <div className="text-[#64748B] mt-1">{alloc.execDate}</div>
                    <div className="text-[#94A3B8] mt-0.5">{alloc.execEmail}</div>
                  </td>
                  <td className="p-4 align-top pt-5">
                    <div className="text-[#64748B]">{alloc.allocDate}</div>
                    <div className="text-[#94A3B8] mt-0.5">{alloc.allocTime}</div>
                  </td>
                  <td className="p-4 align-top pt-5 text-right pr-6">
                    <button className="px-5 py-1.5 rounded-full bg-[#1e40af] text-white font-bold text-[10px] hover:bg-[#1e3a8a] transition-colors shadow-sm">
                      Edit
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#94A3B8] font-medium">No allocations found matching your search.</td>
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
