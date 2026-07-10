import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { useNavigate } from 'react-router-dom';
import {
  ChevronDown, User, Users,
  UserCheck, ShieldAlert, IndianRupee, CreditCard, Building2,
  Clock, Edit2, Wallet, Copy, CheckCircle2, AlertCircle, X, MoreVertical
} from 'lucide-react';
import { GlassDropdown } from '../../components/ui/GlassDropdown';
import { GlassDateFilter } from '../../components/ui/GlassDateFilter';
import { apiClient } from '../../services/apiClient';

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

const fmtCurrency = (amount: number) => {
  if (amount == null) return '₹0.00';
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return amount < 0 ? `-₹${formatted}` : `₹${formatted}`;
};

const fmtDate = (iso: string | null | undefined) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const fmtTime = (iso: string | null | undefined) => {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

export function AdminUsers() {
  const navigate = useNavigate();

  // ─── Data state ────────────────────────────────────────────────────────────
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [verifiedKycCount, setVerifiedKycCount] = useState(0);
  const [pendingKycCount, setPendingKycCount] = useState(0);

  // ─── Selection ──────────────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // ─── Filter display state ───────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKycStatuses, setSelectedKycStatuses] = useState<string[]>([]);
  const [selectedRateCards, setSelectedRateCards] = useState<string[]>([]);
  const [selectedWalletBalances, setSelectedWalletBalances] = useState<string[]>([]);
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');

  // ─── Applied filters (trigger API call) ────────────────────────────────────
  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedKyc, setAppliedKyc] = useState<string[]>([]);
  const [appliedRateCard, setAppliedRateCard] = useState<string[]>([]);
  const [appliedBalance, setAppliedBalance] = useState<string[]>([]);

  // ─── Global search from admin header ────────────────────────────────────────
  const [globalSearch, setGlobalSearch] = useState('');

  // ─── Rate card modal state ──────────────────────────────────────────────────
  const [rateCardModal, setRateCardModal] = useState({ open: false, userId: '', userName: '', currentPlan: '' });
  const [planNames, setPlanNames] = useState<string[]>([]);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [planDropdownOpen, setPlanDropdownOpen] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  // ─── UI state ───────────────────────────────────────────────────────────────
  const [actionDropdownOpen, setActionDropdownOpen] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ─── Helpers ────────────────────────────────────────────────────────────────
  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3000);
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(String(text));
      showToast('success', `${label} copied!`);
    } catch {
      showToast('error', `Failed to copy ${label}.`);
    }
  };

  // ─── Global search listener ──────────────────────────────────────────────────
  useEffect(() => {
    const handleSearch = (e: Event) => {
      const q = ((e as CustomEvent).detail || '').toLowerCase();
      setGlobalSearch(q);
      setCurrentPage(1);
    };
    window.addEventListener('admin-search', handleSearch);
    setGlobalSearch(((window as any).__adminSearchQuery || '').toLowerCase());
    return () => window.removeEventListener('admin-search', handleSearch);
  }, []);

  // ─── Fetch users ─────────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async (page: number) => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = { page, limit: 10 };
      const search = globalSearch || appliedSearch;
      if (search.trim()) {
        if (/^\d+$/.test(search.trim())) {
          params.userId = search.trim();
        } else {
          params.search = search.trim();
        }
      }
      if (appliedKyc.length === 1) params.kycStatus = appliedKyc[0].toLowerCase();
      if (appliedRateCard.length === 1) params.rateCard = appliedRateCard[0];
      if (appliedBalance.length === 1) {
        const bmap: Record<string, string> = {
          'Positive': 'positive',
          'Negative': 'negative',
          'Never Recharged': 'never',
          'Hold Balance': 'hold',
        };
        params.balanceType = bmap[appliedBalance[0]] || appliedBalance[0].toLowerCase();
      }
      const res = await apiClient.get('/user/getAllUsers', { params });
      setUsers(res.data.userDetails || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalCount(res.data.totalCount || 0);
      setVerifiedKycCount(res.data.verifiedKycCount || 0);
      setPendingKycCount(res.data.pendingKycCount || 0);
    } catch {
      showToast('error', 'Failed to load users.');
    } finally {
      setIsLoading(false);
    }
  }, [globalSearch, appliedSearch, appliedKyc, appliedRateCard, appliedBalance]);

  useEffect(() => {
    fetchUsers(currentPage);
  }, [fetchUsers, currentPage]);

  // ─── Apply / reset filters ──────────────────────────────────────────────────
  const applyFilters = () => {
    setAppliedSearch(searchQuery);
    setAppliedKyc(selectedKycStatuses);
    setAppliedRateCard(selectedRateCards);
    setAppliedBalance(selectedWalletBalances);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedKycStatuses([]);
    setSelectedRateCards([]);
    setSelectedWalletBalances([]);
    setDateStart('');
    setDateEnd('');
    setAppliedSearch('');
    setAppliedKyc([]);
    setAppliedRateCard([]);
    setAppliedBalance([]);
    setCurrentPage(1);
    setActionDropdownOpen(false);
  };

  // ─── Rate card modal ─────────────────────────────────────────────────────────
  const openRateCardModal = async (user: any) => {
    setRateCardModal({ open: true, userId: String(user.id), userName: user.fullname, currentPlan: user.rateCard });
    setSelectedPlan(user.rateCard || '');
    try {
      const res = await apiClient.get('/saveRate/getPlanNames');
      setPlanNames(res.data.planNames || []);
    } catch {
      showToast('error', 'Failed to load plan names.');
    }
  };

  const handleAssignPlan = async () => {
    if (!selectedPlan) { showToast('error', 'Please select a plan.'); return; }
    setIsAssigning(true);
    try {
      const rcRes = await apiClient.get('/saveRate/getRateCard');
      const allRateCards = rcRes.data.rateCards || [];
      const filteredRateCards = allRateCards.filter((c: any) => c.plan === selectedPlan);
      await apiClient.put('/users/assignPlan', {
        userId: rateCardModal.userId,
        userName: rateCardModal.userName,
        planName: selectedPlan,
        rateCards: filteredRateCards,
      });
      showToast('success', 'Rate card assigned successfully!');
      setRateCardModal({ open: false, userId: '', userName: '', currentPlan: '' });
      fetchUsers(currentPage);
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Failed to assign rate card.');
    } finally {
      setIsAssigning(false);
    }
  };

  // ─── Selection helpers ───────────────────────────────────────────────────────
  const toggleAll = () => setSelectedIds(selectedIds.length === users.length ? [] : users.map(u => String(u.id)));
  const toggleSelect = (id: string) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

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
                <div className="text-[14px] font-bold text-[#0F172A]">{isLoading ? '—' : totalCount.toLocaleString('en-IN')}</div>
                <div className="text-[10px] font-semibold text-[#64748B]">Total Users</div>
              </div>
            </div>
            <div className="flex-1 min-w-[200px] bg-[#FDF4FF] rounded-xl p-3 border border-[#F3E8FF] flex items-center gap-3 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm border border-[#F3E8FF]">
                <Clock className="w-4 h-4 text-[#A855F7]" />
              </div>
              <div>
                <div className="text-[14px] font-bold text-[#0F172A]">{isLoading ? '—' : verifiedKycCount.toLocaleString('en-IN')}</div>
                <div className="text-[10px] font-semibold text-[#64748B]">Verified KYC</div>
              </div>
            </div>
            <div className="flex-1 min-w-[200px] bg-[#F0FDF4] rounded-xl p-3 border border-[#DCFCE7] flex items-center gap-3 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm border border-[#DCFCE7]">
                <ShieldAlert className="w-4 h-4 text-[#22C55E]" />
              </div>
              <div>
                <div className="text-[14px] font-bold text-[#0F172A]">{isLoading ? '—' : pendingKycCount.toLocaleString('en-IN')}</div>
                <div className="text-[10px] font-semibold text-[#64748B]">Pending KYC</div>
              </div>
            </div>
          </div>

          {/* Filters Row */}
          <div className="p-3 border-b border-[#E2E8F0] flex flex-wrap items-center gap-2.5 bg-white relative z-20">
            <input
              type="text"
              placeholder="User ID / Name / Email"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              className="h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs bg-white focus:outline-none w-[200px] shrink-0"
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

            <button
              onClick={applyFilters}
              className="h-9 px-4 shrink-0 rounded-lg bg-[#00A86B] text-white text-xs font-bold hover:bg-[#009B63] transition-colors shadow-sm flex items-center justify-center"
            >
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
                  <button onClick={resetFilters} className="w-full text-left px-4 py-2 text-xs hover:bg-[#F8FAFC] text-[#475569]">Reset Filters</button>
                  <button
                    onClick={() => { fetchUsers(currentPage); setActionDropdownOpen(false); }}
                    className="w-full text-left px-4 py-2 text-xs hover:bg-[#F8FAFC] text-[#475569]"
                  >
                    Refresh
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
                    <input type="checkbox" checked={selectedIds.length === users.length && users.length > 0} onChange={toggleAll} className="rounded border-[#00A86B] accent-[#00A86B] w-3.5 h-3.5" />
                  </th>
                  <th className="p-3 whitespace-nowrap"><User className="w-3.5 h-3.5 inline mr-1" /> User Details</th>
                  <th className="p-3 whitespace-nowrap"><Building2 className="w-3.5 h-3.5 inline mr-1" /> Business Details</th>
                  <th className="p-3 whitespace-nowrap"><UserCheck className="w-3.5 h-3.5 inline mr-1" /> KYC</th>
                  <th className="p-3 whitespace-nowrap"><CreditCard className="w-3.5 h-3.5 inline mr-1" /> Rate Card</th>
                  <th className="p-3 whitespace-nowrap"><IndianRupee className="w-3.5 h-3.5 inline mr-1" /> Balance</th>
                  <th className="p-3 whitespace-nowrap"><User className="w-3.5 h-3.5 inline mr-1" /> Account Manager</th>
                  <th className="p-3 whitespace-nowrap"><Clock className="w-3.5 h-3.5 inline mr-1" /> Registration Date</th>
                  <th className="p-3 whitespace-nowrap"><MoreVertical className="w-3.5 h-3.5 inline mr-1" /> Last Activity</th>
                  <th className="p-3 whitespace-nowrap text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="text-[11px] text-[#475569]">
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-[#E2E8F0]">
                      {Array.from({ length: 10 }).map((_, j) => (
                        <td key={j} className="p-3 pt-4">
                          <div className="h-4 bg-[#F1F5F9] rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : users.length > 0 ? users.map((user) => {
                  const uid = String(user.id);
                  const kycLabel = user.kycStatus ? 'Verified' : 'Pending';
                  return (
                    <tr key={uid} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors group">
                      <td className="p-3 align-top pt-4">
                        <input type="checkbox" checked={selectedIds.includes(uid)} onChange={() => toggleSelect(uid)} className="rounded border-gray-300 accent-[#00A86B] w-3.5 h-3.5" />
                      </td>
                      <td className="p-3 align-top pt-4">
                        <div className="flex items-center gap-1">
                          <div className="text-xs font-semibold text-[#00A86B]">{user.userId}</div>
                          <button onClick={() => copyToClipboard(user.userId, 'User ID')} className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Copy className="w-3 h-3 text-[#94A3B8] hover:text-[#00A86B]" />
                          </button>
                        </div>
                        <div className="text-sm font-semibold text-[#0F172A] mt-0.5">{user.fullname || '—'}</div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <div className="font-sans text-xs font-normal text-[#94A3B8]">{user.email || '—'}</div>
                          {user.email && (
                            <button onClick={() => copyToClipboard(user.email, 'Email')} className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <Copy className="w-3 h-3 text-[#94A3B8] hover:text-[#00A86B]" />
                            </button>
                          )}
                        </div>
                        {user.phoneNumber && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <div className="font-sans text-xs font-normal text-[#94A3B8]">{user.phoneNumber}</div>
                            <button onClick={() => copyToClipboard(user.phoneNumber, 'Phone')} className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <Copy className="w-3 h-3 text-[#94A3B8] hover:text-[#00A86B]" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="p-3 align-top pt-4">
                        <div className="font-bold text-[#0F172A] text-[11px]">{user.company || '—'}</div>
                        <div className="text-[#64748B] mt-0.5 text-[11px]">Aadhaar: {user.aadharDetails?.aadharNumber || '—'}</div>
                        {user.gstDetails?.gstNumber && (
                          <div className="text-[#64748B] text-[11px]">GST: {user.gstDetails.gstNumber}</div>
                        )}
                      </td>
                      <td className="p-3 align-top pt-4">
                        <span className={getStatusBadgeClass(kycLabel)}>{kycLabel}</span>
                        {user.isBlocked && (
                          <span className="mt-1 block bg-red-50 text-red-700 border border-red-200 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap shadow-sm">
                            Blocked
                          </span>
                        )}
                      </td>
                      <td className="p-3 align-top pt-4">
                        <div className="flex items-center gap-1.5">
                          <span className={getStatusBadgeClass(user.rateCard || 'N/A')}>{user.rateCard || 'N/A'}</span>
                          <button onClick={() => openRateCardModal(user)}>
                            <Edit2 className="w-3.5 h-3.5 text-[#00A86B] cursor-pointer hover:text-[#009B63]" />
                          </button>
                        </div>
                      </td>
                      <td className="p-3 align-top pt-4">
                        <div className={`font-bold ${(user.walletAmount ?? 0) < 0 ? 'text-red-500' : 'text-[#00A86B]'}`}>
                          {fmtCurrency(user.walletAmount ?? 0)}
                        </div>
                        {user.creditLimit > 0 && (
                          <div className="text-[10px] text-[#94A3B8] mt-0.5">Credit: {fmtCurrency(user.creditLimit)}</div>
                        )}
                      </td>
                      <td className="p-3 align-top pt-4">
                        <div className="text-[#64748B]">N/A</div>
                      </td>
                      <td className="p-3 align-top pt-4">
                        <div className="table-date">{fmtDate(user.createdAt)}</div>
                        <div className="text-[10px] text-[#94A3B8] mt-0.5">{fmtTime(user.createdAt)}</div>
                      </td>
                      <td className="p-3 align-top pt-4">
                        <div className="font-bold text-[#0F172A]">Orders: {user.orderCount || 0}</div>
                        <div className="table-date mt-0.5">{fmtDate(user.lastOrderDate)}</div>
                        {user.lastLogin && (
                          <div className="text-[10px] text-[#94A3B8] mt-0.5">Login: {fmtDate(user.lastLogin)}</div>
                        )}
                      </td>
                      <td className="p-3 align-top pt-4 text-right pr-6">
                        <button
                          onClick={() => navigate('/admin/profile', { state: { user } })}
                          className="px-4 py-1 rounded-full border border-[#00A86B] text-[#00A86B] font-bold text-[10px] hover:bg-[#F0FDF4] cursor-pointer transition-colors shadow-sm"
                        >
                          Profile
                        </button>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-[#94A3B8] font-medium">No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 0 && (
            <div className="p-4 border-t border-[#E2E8F0] flex items-center justify-between bg-white relative z-20">
              <div className="text-xs text-[#64748B]">
                Page <span className="font-bold text-[#0F172A]">{currentPage}</span> of <span className="font-bold text-[#0F172A]">{totalPages}</span>
                {' '}· <span className="font-bold text-[#0F172A]">{totalCount.toLocaleString('en-IN')}</span> total
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded border border-[#E2E8F0] text-xs font-medium text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-50"
                >
                  Previous
                </button>
                {(() => {
                  const window = 3;
                  const start = Math.max(1, Math.min(currentPage - window, totalPages - window * 2));
                  const end = Math.min(totalPages, start + window * 2);
                  return Array.from({ length: end - start + 1 }, (_, i) => start + i).map(p => (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`w-8 h-8 rounded text-xs font-medium flex items-center justify-center transition-colors ${
                        currentPage === p ? 'bg-[#00A86B] text-white border border-[#00A86B]' : 'border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      {p}
                    </button>
                  ));
                })()}
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

      {/* Rate Card Modal */}
      {rateCardModal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 w-[320px] shadow-2xl">
            <h3 className="text-sm font-bold text-[#0F172A] mb-1">Update Rate Card</h3>
            <p className="text-xs text-[#64748B] mb-4">
              User: <span className="font-semibold text-[#0F172A]">{rateCardModal.userName}</span>
            </p>

            <div className="relative mb-4">
              <button
                onClick={() => setPlanDropdownOpen(!planDropdownOpen)}
                className="w-full border-2 border-[#E2E8F0] text-[#475569] font-semibold px-3 py-2 rounded-lg text-xs flex justify-between items-center focus:outline-none hover:border-[#00A86B] transition-colors"
              >
                <span>{selectedPlan || 'Select Plan'}</span>
                <ChevronDown className="w-4 h-4 text-[#94A3B8]" />
              </button>
              {planDropdownOpen && (
                <div className="absolute z-10 bg-white border-2 border-[#E2E8F0] rounded-lg w-full mt-1 shadow-lg max-h-40 overflow-y-auto">
                  {planNames.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-[#94A3B8]">Loading plans...</div>
                  ) : planNames.map((plan) => (
                    <div
                      key={plan}
                      onClick={() => { setSelectedPlan(plan); setPlanDropdownOpen(false); }}
                      className={`px-3 py-2 cursor-pointer text-xs text-[#475569] hover:bg-[#F0FDF4] ${selectedPlan === plan ? 'bg-[#F0FDF4] font-semibold text-[#00A86B]' : ''}`}
                    >
                      {plan}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRateCardModal({ open: false, userId: '', userName: '', currentPlan: '' })}
                className="px-4 py-2 text-xs text-[#475569] hover:bg-[#F1F5F9] transition-colors rounded-lg font-semibold bg-[#F8FAFC] border border-[#E2E8F0]"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignPlan}
                disabled={isAssigning || !selectedPlan}
                className="bg-[#00A86B] hover:bg-[#009B63] disabled:opacity-50 font-semibold text-white px-4 py-2 text-xs rounded-lg transition-colors"
              >
                {isAssigning ? 'Assigning...' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[100] bg-[#1E293B] text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border border-white/10 min-w-[280px]">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${toast.type === 'error' ? 'bg-red-500/20' : 'bg-emerald-500/20'}`}>
            {toast.type === 'error'
              ? <AlertCircle className="w-4 h-4 text-[#F87171]" />
              : <CheckCircle2 className="w-4 h-4 text-[#34D399]" />
            }
          </div>
          <p className="text-[13px] font-medium pr-4">{toast.text}</p>
          <button onClick={() => setToast(null)} className="p-1 hover:bg-white/10 rounded-md transition-colors ml-auto text-[#94A3B8] hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </AdminLayout>
  );
}
