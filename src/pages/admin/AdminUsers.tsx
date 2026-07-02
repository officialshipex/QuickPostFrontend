import React, { useState } from 'react';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { usePagination } from '../../hooks/usePagination';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Search, RefreshCcw, Calendar, ChevronDown, User, Users, 
  UserCheck, ShieldAlert, IndianRupee, CreditCard, Building2, 
  Clock, MoreVertical, Edit2, Wallet
} from 'lucide-react';
import { GlassDropdown } from '../../components/ui/GlassDropdown';
import { GlassDateFilter } from '../../components/ui/GlassDateFilter';

const STATUS_BADGE_STYLES: Record<string, string> = {
  'Verified': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Pending': 'bg-amber-50 text-amber-700 border-amber-200',
  'Bronze': 'bg-amber-50 text-amber-700 border-amber-200',
  'Silver': 'bg-slate-50 text-slate-700 border-slate-200',
  'Gold': 'bg-yellow-50 text-yellow-700 border-yellow-200',
};

const getStatusBadgeClass = (status: string) => {
  const normalized = status || '';
  return `${STATUS_BADGE_STYLES[normalized] || 'bg-blue-50 text-blue-700 border-blue-200'} px-2.5 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap shadow-sm`;
};

const MOCK_USERS = [
  { id: '86543', name: 'Dinesh Tharwani', email: 'dineshtharwani@gmail.com', business: 'Shipex', aadhaar: '765432198033', kyc: 'Verified', rateCard: 'Bronze', balance: '₹876.00', accountManager: 'Not Assigned', regDate: '13th Apr 2026', regTime: '04:34 PM', lastOrders: '57', lastDate: '13th Apr 2026', phone: '9876543120', state: 'Odisha' },
  { id: '86544', name: 'Rahul Sharma', email: 'rahul.s@example.com', business: 'KartDrop Logistics', aadhaar: '887766554433', kyc: 'Verified', rateCard: 'Silver', balance: '₹4,530.50', accountManager: 'Priya Singh', regDate: '10th Mar 2026', regTime: '11:20 AM', lastOrders: '124', lastDate: '14th Apr 2026', phone: '9898989898', state: 'Delhi' },
  { id: '86545', name: 'Anita Desai', email: 'anita.d@shopeasy.in', business: 'ShopEasy', aadhaar: '112233445566', kyc: 'Pending', rateCard: 'Bronze', balance: '₹120.00', accountManager: 'Not Assigned', regDate: '01th Feb 2026', regTime: '09:15 AM', lastOrders: '12', lastDate: '05th Apr 2026', phone: '8787878787', state: 'Maharashtra' },
  { id: '86546', name: 'Vikram Singh', email: 'vikram.singh@example.com', business: 'ExpressWay', aadhaar: '998877665544', kyc: 'Verified', rateCard: 'Gold', balance: '₹12,450.00', accountManager: 'Amit Patel', regDate: '15th Jan 2026', regTime: '02:45 PM', lastOrders: '430', lastDate: '16th Apr 2026', phone: '9123456789', state: 'Gujarat' },
  { id: '86547', name: 'Pooja Verma', email: 'pooja.verma@example.com', business: 'Verma Traders', aadhaar: '554433221100', kyc: 'Verified', rateCard: 'Silver', balance: '₹2,300.75', accountManager: 'Rahul Sharma', regDate: '22th Dec 2025', regTime: '10:05 AM', lastOrders: '89', lastDate: '12th Apr 2026', phone: '9001122334', state: 'Punjab' }
];

export function AdminUsers() {
  const navigate = useNavigate();
  const location = useLocation();
  const [globalSearchQuery, setGlobalSearchQuery] = useState((window as any).__adminSearchQuery?.toLowerCase() || '');

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

  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [userIdFilter, setUserIdFilter] = useState('');
  
  const [selectedKycStatuses, setSelectedKycStatuses] = useState<string[]>([]);
  const [selectedRateCards, setSelectedRateCards] = useState<string[]>([]);
  const [selectedWalletBalances, setSelectedWalletBalances] = useState<string[]>([]);
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  
  const [actionDropdownOpen, setActionDropdownOpen] = useState(false);

  const KYC_OPTIONS = [
    { label: 'Verified', value: 'Verified' },
    { label: 'Pending', value: 'Pending' }
  ];

  const RATE_CARD_OPTIONS = [
    { label: 'Bronze', value: 'Bronze' },
    { label: 'Silver', value: 'Silver' },
    { label: 'Gold', value: 'Gold' }
  ];

  const WALLET_BALANCE_OPTIONS = [
    { label: 'Negative', value: 'Negative' },
    { label: 'Positive', value: 'Positive' },
    { label: 'Hold Balance', value: 'Hold Balance' },
    { label: 'Never Recharged', value: 'Never Recharged' }
  ];
  
  const filteredUsers = MOCK_USERS.filter(user => {
    if (globalSearchQuery) {
      if (!user.name.toLowerCase().includes(globalSearchQuery) &&
          !user.email.toLowerCase().includes(globalSearchQuery) &&
          !user.id.toLowerCase().includes(globalSearchQuery) &&
          !user.business.toLowerCase().includes(globalSearchQuery)) return false;
    }
    if (userIdFilter && !user.id.toLowerCase().includes(userIdFilter.toLowerCase())) return false;
    if (selectedKycStatuses.length > 0 && !selectedKycStatuses.includes(user.kyc)) return false;
    if (selectedRateCards.length > 0 && !selectedRateCards.includes(user.rateCard)) return false;
    return true;
  });

  const {
    page: currentPage,
    setPage: setCurrentPage,
    totalPages,
    paginatedData: paginatedUsers,
    startIndex,
    endIndex,
  } = usePagination({ data: filteredUsers, perPage: 10 });

  const toggleAll = () => setSelectedUsers(selectedUsers.length === filteredUsers.length ? [] : filteredUsers.map(u => u.id));
  const toggleSelect = (id: string) => setSelectedUsers(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <AdminLayout>
      <div className="flex flex-col h-[calc(100vh-72px)] -m-4 md:-m-6 bg-white">
        <div className="bg-white relative z-50 shrink-0">



        {/* Summary Cards Row */}
        <div className="p-4 border-b border-[#E2E8F0] flex flex-nowrap overflow-x-auto gap-4 no-scrollbar">
          <div className="flex-1 min-w-[200px] bg-[#F4F9FF] rounded-xl p-3 border border-[#E0F2FE] flex items-center gap-3 shadow-sm">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm border border-[#E0F2FE]">
              <Users className="w-4 h-4 text-[#3B82F6]" />
            </div>
            <div>
              <div className="text-[14px] font-bold text-[#0F172A]">1,248</div>
              <div className="text-[10px] font-semibold text-[#64748B]">Total Users</div>
            </div>
          </div>
          <div className="flex-1 min-w-[200px] bg-[#FEFCE8] rounded-xl p-3 border border-[#FEF08A] flex items-center gap-3 shadow-sm">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm border border-[#FEF08A]">
              <User className="w-4 h-4 text-[#EAB308]" />
            </div>
            <div>
              <div className="text-[14px] font-bold text-[#0F172A]">82</div>
              <div className="text-[10px] font-semibold text-[#64748B]">New Users</div>
            </div>
          </div>
          <div className="flex-1 min-w-[200px] bg-[#FDF4FF] rounded-xl p-3 border border-[#F3E8FF] flex items-center gap-3 shadow-sm">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm border border-[#F3E8FF]">
              <Clock className="w-4 h-4 text-[#A855F7]" />
            </div>
            <div>
              <div className="text-[14px] font-bold text-[#0F172A]">1,180</div>
              <div className="text-[10px] font-semibold text-[#64748B]">Verified KYC</div>
            </div>
          </div>
          <div className="flex-1 min-w-[200px] bg-[#F0FDF4] rounded-xl p-3 border border-[#DCFCE7] flex items-center gap-3 shadow-sm">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm border border-[#DCFCE7]">
              <ShieldAlert className="w-4 h-4 text-[#22C55E]" />
            </div>
            <div>
              <div className="text-[14px] font-bold text-[#0F172A]">68</div>
              <div className="text-[10px] font-semibold text-[#64748B]">Pending KYC</div>
            </div>
          </div>
        </div>

        {/* Filters Row */}
        <div className="p-3 border-b border-[#E2E8F0] flex flex-wrap items-center gap-2.5 bg-white relative z-20">
          <input 
            type="text" 
            placeholder="User ID" 
            value={userIdFilter}
            onChange={(e) => setUserIdFilter(e.target.value)}
            className="h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs bg-white focus:outline-none w-[180px] shrink-0" 
          />
          
          <GlassDropdown
            label="KYC Status"
            options={KYC_OPTIONS}
            selected={selectedKycStatuses}
            onChange={setSelectedKycStatuses}
            placeholder="Search KYC..."
            icon={<UserCheck className="w-3.5 h-3.5" />}
          />

          <GlassDropdown
            label="Rate Card"
            options={RATE_CARD_OPTIONS}
            selected={selectedRateCards}
            onChange={setSelectedRateCards}
            placeholder="Search rate card..."
            icon={<CreditCard className="w-3.5 h-3.5" />}
          />

          <GlassDropdown
            label="Wallet Balance"
            options={WALLET_BALANCE_OPTIONS}
            selected={selectedWalletBalances}
            onChange={setSelectedWalletBalances}
            placeholder="Search balance..."
            icon={<Wallet className="w-3.5 h-3.5" />}
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

          <div className="relative shrink-0 ml-auto flex items-center">
            <button 
              onClick={() => setActionDropdownOpen(!actionDropdownOpen)}
              onBlur={() => setTimeout(() => setActionDropdownOpen(false), 200)}
              className="h-9 pl-4 pr-8 rounded-full border border-[#E2E8F0] text-xs bg-white focus:outline-none flex items-center font-bold text-[#475569] shadow-sm hover:bg-[#F8FAFC] transition-colors"
            >
              Action
              <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            </button>
            {actionDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-40 bg-white border border-[#E2E8F0] rounded-lg shadow-lg py-1 z-50">
                <button className="w-full text-left px-4 py-2 text-xs hover:bg-[#F8FAFC] text-[#475569]">Export Data</button>
                <button className="w-full text-left px-4 py-2 hover:bg-[#F8FAFC] transition-colors text-red-600 font-semibold">Deactivate</button>
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    if(selectedUsers.length > 0) navigate('/admin/profile');
                  }}
                  className={`w-full text-left px-4 py-2 text-xs ${selectedUsers.length > 0 ? 'hover:bg-[#F8FAFC] text-[#475569]' : 'text-[#CBD5E1] cursor-not-allowed'}`}
                >
                  Profile
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white flex flex-col flex-1 min-h-0 overflow-hidden border-t border-[#E2E8F0]">
        <div className="flex-1 overflow-auto no-scrollbar relative">
          <table className="w-full text-left border-collapse min-w-[1300px]">
            <thead className="sticky top-0 z-40 bg-[#E6F5F1] shadow-sm">
              <tr className="text-xs font-medium text-[#00A86B] uppercase tracking-wider">
                <th className="p-3 w-10">
                  <input type="checkbox" checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0} onChange={toggleAll} className="rounded border-[#00A86B] accent-[#00A86B] w-3.5 h-3.5" />
                </th>
                <th className="p-3 whitespace-nowrap"><User className="w-3.5 h-3.5 inline mr-1"/> User Details</th>
                <th className="p-3 whitespace-nowrap"><Building2 className="w-3.5 h-3.5 inline mr-1"/> Business Details</th>
                <th className="p-3 whitespace-nowrap"><UserCheck className="w-3.5 h-3.5 inline mr-1"/> KYC</th>
                <th className="p-3 whitespace-nowrap"><CreditCard className="w-3.5 h-3.5 inline mr-1"/> Rate Card</th>
                <th className="p-3 whitespace-nowrap"><IndianRupee className="w-3.5 h-3.5 inline mr-1"/> Balance</th>
                <th className="p-3 whitespace-nowrap"><User className="w-3.5 h-3.5 inline mr-1"/> Account Manager</th>
                <th className="p-3 whitespace-nowrap"><Clock className="w-3.5 h-3.5 inline mr-1"/> Registration Date</th>
                <th className="p-3 whitespace-nowrap"><Calendar className="w-3.5 h-3.5 inline mr-1"/> Last Scheduled Date</th>
                <th className="p-3 whitespace-nowrap text-right pr-6"><MoreVertical className="w-3.5 h-3.5 inline mr-1"/> Actions</th>
              </tr>
            </thead>
            <tbody className="text-[11px] text-[#475569]">
              {paginatedUsers.length > 0 ? paginatedUsers.map((user) => (
                <tr key={user.id} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors group">
                  <td className="p-3 align-top pt-4">
                    <input type="checkbox" checked={selectedUsers.includes(user.id)} onChange={() => toggleSelect(user.id)} className="rounded border-gray-300 accent-[#00A86B] w-3.5 h-3.5" />
                  </td>
                  <td className="p-3 align-top pt-4">
                    <div className="text-xs font-semibold text-[#00A86B] cursor-pointer hover:underline">{user.id}</div>
                    <div className="text-sm font-semibold text-[#0F172A] mt-0.5">{user.name}</div>
                    <div className="font-sans text-xs font-normal text-[#94A3B8]">{user.email}</div>
                  </td>
                  <td className="p-3 align-top pt-4">
                    <div className="font-bold text-[#0F172A] text-[11px]">{user.business}</div>
                    <div className="text-[#64748B] mt-0.5 text-[11px]">Aadhaar: {user.aadhaar}</div>
                  </td>
                  <td className="p-3 align-top pt-4">
                    <span className={getStatusBadgeClass(user.kyc)}>{user.kyc}</span>
                  </td>
                  <td className="p-3 align-top pt-4">
                    <div className="flex items-center gap-1.5">
                      <span className={getStatusBadgeClass(user.rateCard)}>{user.rateCard}</span>
                      <Edit2 className="w-3.5 h-3.5 text-[#00A86B] cursor-pointer hover:text-[#009B63]" />
                    </div>
                  </td>
                  <td className="p-3 align-top pt-4">
                    <div className="font-bold text-[#00A86B]">{user.balance}</div>
                  </td>
                  <td className="p-3 align-top pt-4">
                    <div className="text-[#64748B]">{user.accountManager}</div>
                  </td>
                  <td className="p-3 align-top pt-4">
                    <div className="table-date">{user.regDate}</div>
                    <div className="table-date mt-0.5">{user.regTime}</div>
                  </td>
                  <td className="p-3 align-top pt-4">
                    <div className="font-bold text-[#0F172A]">Orders: {user.lastOrders}</div>
                    <div className="table-date mt-0.5">{user.lastDate}</div>
                  </td>
                  <td className="p-3 align-top pt-4 text-right pr-6">
                    <button 
                      onClick={() => {
                        if (selectedUsers.includes(user.id)) {
                          navigate('/admin/profile');
                        }
                      }}
                      className={`px-4 py-1 rounded-full border font-bold text-[10px] transition-colors shadow-sm ${
                        selectedUsers.includes(user.id) 
                          ? 'border-[#00A86B] text-[#00A86B] hover:bg-[#F0FDF4] cursor-pointer' 
                          : 'border-[#E2E8F0] text-[#94A3B8] cursor-not-allowed opacity-60'
                      }`}
                    >
                      Profile
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-[#94A3B8] font-medium">No users found matching your search.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 0 && (
          <div className="p-4 border-t border-[#E2E8F0] flex items-center justify-between bg-white relative z-20">
            <div className="text-xs text-[#64748B]">
              Showing <span className="font-bold text-[#0F172A]">{startIndex}</span> to <span className="font-bold text-[#0F172A]">{endIndex}</span> of <span className="font-bold text-[#0F172A]">{filteredUsers.length}</span> entries
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
