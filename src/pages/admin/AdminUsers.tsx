import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { useNavigate } from 'react-router-dom';
import {
  ChevronDown, User, Users,
  UserCheck, ShieldAlert, IndianRupee, CreditCard, Building2,
  Clock, Edit2, Wallet, Copy, CheckCircle2, AlertCircle, X, MoreVertical, Settings, Info, Filter, Search, ExternalLink
} from 'lucide-react';
import { GlassDropdown } from '../../components/ui/GlassDropdown';
import { GlassDateFilter } from '../../components/ui/GlassDateFilter';
import { useDateRangeFilter } from '../../hooks/filters/useDateRangeFilter';
import { TableLoader } from '../../components/ui/TableLoader';
import { TruncatedText } from '../../components/ui/TruncatedText';
import { DesktopPagination } from '../../hooks/usePagination';
import { MobilePaginationBar } from '../../hooks/useMobilePaginationBar';
import { getTier } from '../../hooks/useTier';
import { apiClient } from '../../services/apiClient';

const STATUS_BADGE_STYLES: Record<string, string> = {
  'Verified': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Pending': 'bg-amber-50 text-amber-700 border-amber-200',
  'Bronze': 'bg-amber-50 text-amber-700 border-amber-200',
  'Silver': 'bg-slate-50 text-slate-700 border-slate-200',
  'Gold': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  'Platinum': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Diamond': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'Titanium': 'bg-purple-50 text-purple-700 border-purple-200',
};

const getStatusBadgeClass = (status: string) => {
  const normalized = status || '';
  return `${STATUS_BADGE_STYLES[normalized] || 'bg-blue-50 text-blue-700 border-blue-200'} px-2.5 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap shadow-sm`;
};

// Prefers a real backend field if present; otherwise infers from GST/company data already on the user record.
const getUserType = (user: any): string => {
  if (user.userType) return user.userType;
  if (user.accountType) return user.accountType;
  return (user.gstDetails?.gstNumber || user.company) ? 'Business' : 'Individual';
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
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [verifiedKycCount, setVerifiedKycCount] = useState(0);
  const [pendingKycCount, setPendingKycCount] = useState(0);
  const [newUsersCount, setNewUsersCount] = useState(0);

  // ─── Selection ──────────────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [hoveredBalance, setHoveredBalance] = useState<{ rect: DOMRect; holdAmount: number; lastRechargeDate: any } | null>(null);
  const [hoveredManager, setHoveredManager] = useState<{ rect: DOMRect; name: string; email: string; phone: string } | null>(null);
  const [hoveredBusiness, setHoveredBusiness] = useState<{ rect: DOMRect; company: string; userType: string; isBlocked: boolean } | null>(null);

  // ─── Filter display state ───────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKycStatuses, setSelectedKycStatuses] = useState<string[]>([]);
  const [selectedRateCards, setSelectedRateCards] = useState<string[]>([]);
  const [selectedWalletBalances, setSelectedWalletBalances] = useState<string[]>([]);
  const [selectedTiers, setSelectedTiers] = useState<string[]>([]);
  const [selectedUserTypes, setSelectedUserTypes] = useState<string[]>([]);
  const { dateStart, dateEnd, setDateStart, setDateEnd, onDateChange } = useDateRangeFilter();

  // ─── Applied filters (trigger API call) ────────────────────────────────────
  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedKyc, setAppliedKyc] = useState<string[]>([]);
  const [appliedRateCard, setAppliedRateCard] = useState<string[]>([]);
  const [appliedBalance, setAppliedBalance] = useState<string[]>([]);
  const [appliedTiers, setAppliedTiers] = useState<string[]>([]);
  const [appliedUserTypes, setAppliedUserTypes] = useState<string[]>([]);
  const [appliedDateStart, setAppliedDateStart] = useState('');
  const [appliedDateEnd, setAppliedDateEnd] = useState('');

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
  const [rateCardFilterOptions, setRateCardFilterOptions] = useState<{ label: string; value: string }[]>([]);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [mobileActionOpen, setMobileActionOpen] = useState(false);

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

  // ─── Fetch rate card plan names for the filter dropdown (same source as the assign-plan modal) ──
  useEffect(() => {
    apiClient.get('/saveRate/getPlanNames')
      .then(res => setRateCardFilterOptions((res.data.planNames || []).map((p: string) => ({ label: p, value: p }))))
      .catch(() => {});
  }, []);

  // Close the Action dropdown on outside click (not onBlur — a blur timeout races the
  // Refresh button's click and can unmount the menu before the click registers).
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.action-dropdown-container')) {
        setActionDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ─── Fetch users ─────────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async (page: number) => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = { page, limit: rowsPerPage };
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
      if (appliedDateStart) params.fromDate = new Date(appliedDateStart).toISOString();
      if (appliedDateEnd) params.toDate = new Date(appliedDateEnd).toISOString();
      const res = await apiClient.get('/user/getAllUsers', { params });
      setUsers(res.data.userDetails || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalCount(res.data.totalCount || 0);
      setVerifiedKycCount(res.data.verifiedKycCount || 0);
      setPendingKycCount(res.data.pendingKycCount || 0);
      setNewUsersCount(res.data.newUsersCount || 0);
    } catch {
      showToast('error', 'Failed to load users.');
    } finally {
      setIsLoading(false);
    }
  }, [globalSearch, appliedSearch, appliedKyc, appliedRateCard, appliedBalance, appliedDateStart, appliedDateEnd, rowsPerPage]);

  useEffect(() => {
    fetchUsers(currentPage);
  }, [fetchUsers, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [rowsPerPage]);

  // Live search: debounce searchQuery into appliedSearch so results update as the user types,
  // without needing to press Enter or hit Apply.
  useEffect(() => {
    const timer = setTimeout(() => {
      setAppliedSearch(searchQuery);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ─── Apply / reset filters ──────────────────────────────────────────────────
  const applyFilters = () => {
    setAppliedSearch(searchQuery);
    setAppliedKyc(selectedKycStatuses);
    setAppliedRateCard(selectedRateCards);
    setAppliedBalance(selectedWalletBalances);
    setAppliedTiers(selectedTiers);
    setAppliedUserTypes(selectedUserTypes);
    setAppliedDateStart(dateStart);
    setAppliedDateEnd(dateEnd);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedKycStatuses([]);
    setSelectedRateCards([]);
    setSelectedWalletBalances([]);
    setSelectedTiers([]);
    setSelectedUserTypes([]);
    setDateStart('');
    setDateEnd('');
    setAppliedSearch('');
    setAppliedKyc([]);
    setAppliedRateCard([]);
    setAppliedBalance([]);
    setAppliedTiers([]);
    setAppliedUserTypes([]);
    setAppliedDateStart('');
    setAppliedDateEnd('');
    setCurrentPage(1);
    setActionDropdownOpen(false);
  };

  // Matches Wallet's behavior: show "Clear All" as soon as a filter is picked (draft state),
  // not only after Apply — so it's visible the moment the user selects anything.
  const hasActiveFilters = !!(searchQuery || selectedKycStatuses.length || selectedRateCards.length || selectedWalletBalances.length || selectedTiers.length || selectedUserTypes.length || (dateStart && dateEnd));

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
  const toggleAll = () => setSelectedIds(selectedIds.length === filteredUsers.length ? [] : filteredUsers.map(u => String(u.id)));
  const toggleSelect = (id: string) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const KYC_OPTIONS = [
    { label: 'Verified', value: 'Verified' },
    { label: 'Pending', value: 'Pending' }
  ];

  const WALLET_BALANCE_OPTIONS = [
    { label: 'Negative', value: 'Negative' },
    { label: 'Positive', value: 'Positive' },
    { label: 'Hold Balance', value: 'Hold Balance' },
    { label: 'Never Recharged', value: 'Never Recharged' }
  ];

  const TIER_OPTIONS = [
    { label: 'Silver', value: 'Silver' },
    { label: 'Gold', value: 'Gold' },
    { label: 'Platinum', value: 'Platinum' },
    { label: 'Diamond', value: 'Diamond' },
    { label: 'Titanium', value: 'Titanium' },
  ];

  const USER_TYPE_OPTIONS = [
    { label: 'Business', value: 'Business' },
    { label: 'Individual', value: 'Individual' },
  ];

  // Tier and User Type have no backend query params (both derived client-side),
  // so they filter the already-fetched page in-memory rather than refetching.
  const filteredUsers = users.filter(u => {
    const matchesTier = appliedTiers.length === 0 || appliedTiers.includes(getTier(u.monthlyShipments ?? u.orderCount ?? 0));
    const matchesUserType = appliedUserTypes.length === 0 || appliedUserTypes.includes(getUserType(u));
    return matchesTier && matchesUserType;
  });

  return (
    <AdminLayout>
      <div className="flex flex-col h-[calc(100vh-72px)] -m-4 md:-m-6 bg-white">
        <div className="bg-white relative z-50 shrink-0">

          {/* Mobile Search Bar */}
          <div className="md:hidden px-4 py-3 border-b border-[#E2E8F0] bg-white">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Search by User ID / Name / Email"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-2 focus:ring-[#00A86B]/10 transition-all"
              />
            </div>
          </div>

          {/* Mobile Filters + Action Row */}
          <div className="md:hidden px-4 py-3 border-b border-[#E2E8F0] flex items-center justify-between bg-white gap-2">
            <button
              onClick={() => setIsMobileFiltersOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#00A86B] text-white text-[12px] font-bold shadow-sm shrink-0"
            >
              <Filter className="w-3.5 h-3.5" /> Filters
            </button>
            <div className="relative shrink-0">
              <button
                onClick={() => setMobileActionOpen(v => !v)}
                className="h-9 px-4 rounded-lg border border-[#E2E8F0] text-[12px] font-semibold text-[#475569] bg-white active:bg-[#F8FAFC] flex items-center gap-1"
              >
                Action <ChevronDown className={`w-3.5 h-3.5 transition-transform ${mobileActionOpen ? 'rotate-180' : ''}`} />
              </button>
              {mobileActionOpen && (
                <div className="absolute right-0 top-full mt-2 w-40 bg-white border border-[#E2E8F0] rounded-lg shadow-lg py-1 z-50">
                  <button
                    onClick={() => { fetchUsers(currentPage); setMobileActionOpen(false); }}
                    className="w-full text-left px-4 py-2 text-xs hover:bg-[#F8FAFC] text-[#475569]"
                  >
                    Refresh
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Summary Cards Row — desktop */}
          <div className="hidden md:flex p-4 border-b border-[#E2E8F0] flex-nowrap overflow-x-auto gap-4 no-scrollbar">
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

          {/* Mobile Stat Cards */}
          <div className="md:hidden p-4 border-b border-[#E2E8F0] bg-white grid grid-cols-2 gap-2.5">
            <div className="bg-[#F4F9FF] rounded-xl p-3 border border-[#E0F2FE] flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm border border-[#E0F2FE]">
                <Users className="w-4 h-4 text-[#3B82F6]" />
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-bold text-[#0F172A] truncate">{isLoading ? '—' : totalCount.toLocaleString('en-IN')}</div>
                <div className="text-[10px] font-semibold text-[#64748B] truncate">Total Users</div>
              </div>
            </div>
            <div className="bg-[#FDF4FF] rounded-xl p-3 border border-[#F3E8FF] flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm border border-[#F3E8FF]">
                <Users className="w-4 h-4 text-[#A855F7]" />
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-bold text-[#0F172A] truncate">{isLoading ? '—' : newUsersCount.toLocaleString('en-IN')}</div>
                <div className="text-[10px] font-semibold text-[#64748B] truncate">New Users</div>
              </div>
            </div>
            <div className="bg-[#FAF5FF] rounded-xl p-3 border border-[#F3E8FF] flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm border border-[#F3E8FF]">
                <Clock className="w-4 h-4 text-[#A855F7]" />
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-bold text-[#0F172A] truncate">{isLoading ? '—' : verifiedKycCount.toLocaleString('en-IN')}</div>
                <div className="text-[10px] font-semibold text-[#64748B] truncate">Verified KYC</div>
              </div>
            </div>
            <div className="bg-[#F0FDF4] rounded-xl p-3 border border-[#DCFCE7] flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm border border-[#DCFCE7]">
                <ShieldAlert className="w-4 h-4 text-[#22C55E]" />
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-bold text-[#0F172A] truncate">{isLoading ? '—' : pendingKycCount.toLocaleString('en-IN')}</div>
                <div className="text-[10px] font-semibold text-[#64748B] truncate">Pending KYC</div>
              </div>
            </div>
          </div>

          {/* Filters Row — desktop only */}
          <div className="hidden md:flex py-3 px-6 border-b border-[#CBD5F5] flex-wrap items-center gap-3 bg-white relative z-20">
            <input
              type="text"
              placeholder="User ID / Name / Email"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              className="glass-search-input w-[200px] shrink-0"
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
              options={rateCardFilterOptions}
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

            <GlassDropdown
              label="Tier"
              options={TIER_OPTIONS}
              selected={selectedTiers}
              onChange={setSelectedTiers}
              placeholder="Search tier..."
              icon={<ShieldAlert className="w-3.5 h-3.5" />}
            />

            <GlassDropdown
              label="User Type"
              options={USER_TYPE_OPTIONS}
              selected={selectedUserTypes}
              onChange={setSelectedUserTypes}
              placeholder="Search type..."
              icon={<Building2 className="w-3.5 h-3.5" />}
            />

            <GlassDateFilter
              align="right"
              startDate={dateStart}
              endDate={dateEnd}
              onDateChange={onDateChange}
            />

            <button
              onClick={applyFilters}
              className="py-2 px-4 shrink-0 rounded-[32px] bg-[#009D64] border border-[#009D64] text-white text-xs font-medium leading-[18px] hover:bg-[#008a57] transition-colors cursor-pointer"
            >
              Apply Filters
            </button>

            {hasActiveFilters && (
              <button onClick={resetFilters}
                className="py-2 px-4 shrink-0 rounded-[32px] border border-red-200 text-red-500 text-xs font-medium leading-[18px] hover:bg-red-50 transition-colors cursor-pointer">
                Clear All
              </button>
            )}

            <div className="relative shrink-0 ml-auto flex items-center action-dropdown-container">
              <button
                onClick={() => setActionDropdownOpen(!actionDropdownOpen)}
                className="py-2 pl-4 pr-8 rounded-[32px] border border-[#03C27D] text-xs leading-[18px] bg-white focus:outline-none flex items-center font-medium relative text-[#64748B] hover:bg-[#F0FDF9] transition-colors cursor-pointer"
              >
                Action
                <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              </button>
              {actionDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-40 bg-white border border-[#E2E8F0] rounded-lg shadow-lg py-1 z-50">
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

        {/* Table Section — desktop only */}
        <div className="hidden md:flex bg-white flex-col flex-1 min-h-0 overflow-hidden border-t border-[#E2E8F0]">
          <div className="flex-1 overflow-auto w-full relative">
            {isLoading && <TableLoader />}
            <table className="w-full text-left border-collapse min-w-[1300px]">
              <thead className="sticky top-0 z-40 bg-[#E6F9F2] shadow-sm">
                <tr className="text-xs font-medium text-[#64748B] uppercase tracking-wider">
                  <th className="py-2 px-3 w-10 rounded-l-lg">
                    <input type="checkbox" checked={selectedIds.length === filteredUsers.length && filteredUsers.length > 0} onChange={toggleAll} className="rounded border-[#00A86B] accent-[#00A86B] w-3.5 h-3.5" />
                  </th>
                  <th className="py-2 px-3 whitespace-nowrap"><User className="w-3.5 h-3.5 inline mr-1" /> User Details</th>
                  <th className="py-2 px-3 whitespace-nowrap"><UserCheck className="w-3.5 h-3.5 inline mr-1" /> KYC Status</th>
                  <th className="py-2 px-3 whitespace-nowrap"><CreditCard className="w-3.5 h-3.5 inline mr-1" /> Rate Card</th>
                  <th className="py-2 px-3 whitespace-nowrap"><ShieldAlert className="w-3.5 h-3.5 inline mr-1" /> Tier</th>
                  <th className="py-2 px-3 whitespace-nowrap"><IndianRupee className="w-3.5 h-3.5 inline mr-1" /> Balance</th>
                  <th className="py-2 px-3 whitespace-nowrap"><User className="w-3.5 h-3.5 inline mr-1" /> Account Manager</th>
                  <th className="py-2 px-3 whitespace-nowrap"><Clock className="w-3.5 h-3.5 inline mr-1" /> Registration Date</th>
                  <th className="py-2 px-3 whitespace-nowrap"><MoreVertical className="w-3.5 h-3.5 inline mr-1" /> Order Activity</th>
                  <th className="py-2 px-3 whitespace-nowrap text-right rounded-r-lg"><Settings className="w-3.5 h-3.5 inline mr-1" /> Actions</th>
                </tr>
              </thead>
              <tbody className="text-[11px] text-[#475569]">
                {filteredUsers.length > 0 ? filteredUsers.map((user, uidx) => {
                  const uid = String(user.id);
                  const kycLabel = user.kycStatus ? 'Verified' : 'Pending';
                  return (
                    <tr key={uid} className={`border-b border-[#E2E8F0] transition-colors group ${uidx % 2 === 0 ? 'bg-white' : 'bg-[#E6EDF7]/20'}`}>
                      <td className="p-3 align-top pt-4">
                        <input type="checkbox" checked={selectedIds.includes(uid)} onChange={() => toggleSelect(uid)} className="rounded border-gray-300 accent-[#00A86B] w-3.5 h-3.5" />
                      </td>
                      <td className="p-3 align-top pt-4">
                        <div className="flex items-center gap-1">
                          <div
                            className="text-xs font-semibold text-[#00A86B] cursor-default"
                            onMouseEnter={(e) => setHoveredBusiness({
                              rect: e.currentTarget.getBoundingClientRect(),
                              company: user.company || '—',
                              userType: getUserType(user),
                              isBlocked: !!user.isBlocked,
                            })}
                            onMouseLeave={() => setHoveredBusiness(null)}
                          >
                            {user.userId}
                          </div>
                          <button onClick={() => copyToClipboard(user.userId, 'User ID')} className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Copy className="w-3 h-3 text-[#94A3B8] hover:text-[#00A86B]" />
                          </button>
                        </div>
                        <TruncatedText text={user.fullname || '—'} maxLength={20} className="text-sm font-semibold text-[#0F172A] mt-0.5 max-w-[160px]" />
                        <div className="flex items-center gap-1 mt-0.5">
                          <TruncatedText text={user.email || '—'} maxLength={25} className="font-sans text-xs font-normal text-[#94A3B8] max-w-[180px]" />
                          {user.email && (
                            <button onClick={() => copyToClipboard(user.email, 'Email')} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              <Copy className="w-3 h-3 text-[#94A3B8] hover:text-[#00A86B]" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="p-3 align-top pt-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={getStatusBadgeClass(kycLabel)}>{kycLabel}</span>
                          {user.isBlocked && (
                            <span className="bg-red-50 text-red-700 border border-red-200 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap shadow-sm">
                              Blocked
                            </span>
                          )}
                        </div>
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
                        <span className={getStatusBadgeClass(getTier(user.monthlyShipments ?? user.orderCount ?? 0))}>{getTier(user.monthlyShipments ?? user.orderCount ?? 0)} Tier</span>
                      </td>
                      <td className="p-3 align-top pt-4">
                        <div className="text-[10px] font-medium text-[#94A3B8] uppercase tracking-wider">Wallet Balance</div>
                        <div className="flex items-center gap-1">
                          <span className={`font-normal text-[12px] ${(user.walletAmount ?? 0) < 0 ? 'text-red-500' : 'text-[#00A86B]'}`}>
                            {fmtCurrency(user.walletAmount ?? 0)}
                          </span>
                          <Info
                            className="w-3 h-3 cursor-help shrink-0"
                            style={{ color: '#9FB5AB', width: 12, height: 12 }}
                            onMouseEnter={(e) => setHoveredBalance({ rect: e.currentTarget.getBoundingClientRect(), holdAmount: user.holdAmount ?? 0, lastRechargeDate: user.lastRechargeDate })}
                            onMouseLeave={() => setHoveredBalance(null)}
                          />
                        </div>
                      </td>
                      <td className="p-3 align-top pt-4 text-left">
                        <div
                          className="max-w-[140px] ml-[20px] truncate text-[#0F172A] font-normal text-[12px] cursor-default"
                          onMouseEnter={(e) => setHoveredManager({
                            rect: e.currentTarget.getBoundingClientRect(),
                            name: user.accountManagerName || 'N/A',
                            email: user.accountManagerEmail || '',
                            phone: user.accountManagerPhone || user.accountManagerNumber || '',
                          })}
                          onMouseLeave={() => setHoveredManager(null)}
                        >
                          {user.accountManagerName || 'N/A'}
                        </div>
                      </td>
                      <td className="p-3 align-top pt-4">
                        <div className="table-date">{fmtDate(user.createdAt)}</div>
                        <div className="text-[12px] font-normal text-[#94A3B8] mt-0.5">{fmtTime(user.createdAt)}</div>
                      </td>
                      <td className="p-3 align-top pt-4">
                        <div className="font-bold text-[#475569] text-[12px] ml-[5px]">Total Orders: {user.orderCount || 0}</div>
                        <div className="text-[12px] font-normal text-[#64748B] mt-0.5 ml-[5px]">Last Booked: {user.lastBookedCount ?? 0}</div>
                        <div className="table-date mt-0.5 ml-[5px]">{fmtDate(user.lastOrderDate)}</div>
                      </td>
                      <td className="p-3 align-top pt-4 text-right pr-6">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => navigate('/admin/profile', { state: { user } })}
                            title="View Profile"
                            className="w-7 h-7 rounded-full border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-[#F0FDF4] hover:border-[#00A86B] hover:text-[#00A86B] transition-colors cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
            <DesktopPagination
              page={currentPage}
              setPage={setCurrentPage}
              totalPages={totalPages}
              rowsPerPage={rowsPerPage}
              setRowsPerPage={setRowsPerPage}
              startIndex={totalCount === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}
              endIndex={Math.min(currentPage * rowsPerPage, totalCount)}
              totalItems={totalCount}
            />
          )}
        </div>

        {/* Mobile Card Layout */}
        <div className="md:hidden flex flex-col flex-1 min-h-0 bg-[#F8FAFC]">
          <div className="flex-1 overflow-y-auto relative">
            {isLoading && <TableLoader />}
            {filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-[#94A3B8] font-medium text-sm">No users found.</div>
            ) : (
              <div className="p-4 space-y-4">
                {filteredUsers.map((user) => {
                  const uid = String(user.id);
                  const kycLabel = user.kycStatus ? 'Verified' : 'Pending';
                  const aadhaar = user.aadhaarNumber || user.aadhaar || user.kycDetails?.aadhaarNumber || '';
                  return (
                    <div key={uid} className="relative bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
                      {/* Ribbon Tag */}
                      <div
                        className={`absolute top-0 left-0 px-3.5 py-1 text-[10px] font-bold text-white uppercase tracking-wide ${kycLabel === 'Verified' ? 'bg-[#00A86B]' : 'bg-[#F59E0B]'}`}
                        style={{ clipPath: 'polygon(0 0, 100% 0, 84% 100%, 0% 100%)' }}
                      >
                        {kycLabel}
                      </div>

                      <div className="pt-8 px-4 pb-4">
                        {/* User Details Row */}
                        <div className="flex items-center justify-between mb-2 gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <input type="checkbox" checked={selectedIds.includes(uid)} onChange={() => toggleSelect(uid)} className="rounded border-gray-300 accent-[#00A86B] w-4 h-4 shrink-0" />
                            <span className="text-[#64748B] font-medium text-[12px]">User Details</span>
                          </div>
                          <span className="text-[12px] inline-flex items-baseline gap-1 max-w-[190px] justify-end text-right">
                            <TruncatedText text={user.fullname || '—'} maxLength={16} className="font-semibold text-[#0F172A] text-[12px]" />
                            <span className="text-[#00A86B] font-semibold shrink-0">({user.userId})</span>
                          </span>
                        </div>

                        {/* Company + Aadhaar */}
                        <div className="text-[12px] font-medium text-[#475569] mb-0.5">{user.company || '—'}</div>
                        {aadhaar && (
                          <div className="text-[11px] font-normal text-[#94A3B8] mb-3">Aadhaar: {aadhaar}</div>
                        )}

                        {/* Rate Card + Amount Row */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-1.5">
                            <span className={getStatusBadgeClass(user.rateCard || 'N/A')}>{user.rateCard || 'N/A'}</span>
                            <button onClick={() => openRateCardModal(user)}>
                              <Edit2 className="w-3.5 h-3.5 text-[#00A86B] cursor-pointer" />
                            </button>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className={`font-semibold text-[13px] ${(user.walletAmount ?? 0) < 0 ? 'text-red-500' : 'text-[#00A86B]'}`}>
                              {fmtCurrency(user.walletAmount ?? 0)}
                            </span>
                            <Info
                              className="w-3 h-3 cursor-help shrink-0"
                              style={{ color: '#9FB5AB', width: 12, height: 12 }}
                              onMouseEnter={(e) => setHoveredBalance({ rect: e.currentTarget.getBoundingClientRect(), holdAmount: user.holdAmount ?? 0, lastRechargeDate: user.lastRechargeDate })}
                              onMouseLeave={() => setHoveredBalance(null)}
                              onClick={(e) => {
                                e.stopPropagation();
                                const rect = e.currentTarget.getBoundingClientRect();
                                setHoveredBalance(prev => prev ? null : { rect, holdAmount: user.holdAmount ?? 0, lastRechargeDate: user.lastRechargeDate });
                              }}
                            />
                          </div>
                        </div>

                        {/* Orders + Date / Profile Row */}
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-[12px] font-semibold text-[#475569]">Orders: {user.orderCount || 0}</div>
                            <div className="text-[11px] font-normal text-[#94A3B8] mt-0.5">{fmtDate(user.createdAt)} | {fmtTime(user.createdAt)}</div>
                          </div>
                          <button
                            onClick={() => navigate('/admin/profile', { state: { user } })}
                            className="px-4 py-1.5 rounded-full border border-[#00A86B] text-[#00A86B] font-bold text-[11px] active:bg-[#F0FDF4] transition-colors shrink-0"
                          >
                            Profile
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Mobile Pagination */}
          {<MobilePaginationBar {...({
            page: currentPage,
            setPage: setCurrentPage,
            totalPages,
            rowsPerPage,
            setRowsPerPage,
            startIndex: totalCount === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1,
            endIndex: Math.min(currentPage * rowsPerPage, totalCount),
            totalItems: totalCount,
          })} />}
        </div>
      </div>

      {/* Balance Tooltip */}
      {hoveredBalance && (() => {
        const showBelow = hoveredBalance.rect.top < 160;
        return (
          <div
            className="fixed z-[9999] pointer-events-none bg-[#0F172A] text-white text-xs font-normal p-3 rounded-xl shadow-xl w-52"
            style={{
              top: showBelow ? hoveredBalance.rect.bottom + 10 : hoveredBalance.rect.top - 10,
              left: Math.min(Math.max(hoveredBalance.rect.left + hoveredBalance.rect.width / 2, 110), window.innerWidth - 110),
              transform: showBelow ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
            }}
          >
            <div className="flex justify-between items-center gap-3">
              <span className="text-slate-300">Hold Amount</span>
              <span className="font-semibold text-white">{fmtCurrency(hoveredBalance.holdAmount)}</span>
            </div>
            <div className="flex justify-between items-center gap-3 mt-1.5 pt-1.5 border-t border-white/10">
              <span className="text-slate-300">Last Recharge</span>
              <span className="font-semibold text-white">{fmtDate(hoveredBalance.lastRechargeDate)}</span>
            </div>
            {showBelow ? (
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 border-[6px] border-transparent border-b-[#0F172A]" />
            ) : (
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-[#0F172A]" />
            )}
          </div>
        );
      })()}

      {/* Account Manager Tooltip */}
      {hoveredManager && (() => {
        const showBelow = hoveredManager.rect.top < 160;
        return (
          <div
            className="fixed z-[9999] pointer-events-none bg-[#0F172A] text-white text-xs font-normal p-3 rounded-xl shadow-xl w-60"
            style={{
              top: showBelow ? hoveredManager.rect.bottom + 10 : hoveredManager.rect.top - 10,
              left: Math.min(Math.max(hoveredManager.rect.left + hoveredManager.rect.width / 2, 120), window.innerWidth - 120),
              transform: showBelow ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
            }}
          >
            <div className="flex justify-between items-center gap-3">
              <span className="text-slate-300">Name</span>
              <span className="font-semibold text-white truncate max-w-[140px]">{hoveredManager.name}</span>
            </div>
            <div className="flex justify-between items-center gap-3 mt-1.5 pt-1.5 border-t border-white/10">
              <span className="text-slate-300">Email</span>
              <span className="font-semibold text-white truncate max-w-[140px]">{hoveredManager.email || '—'}</span>
            </div>
            <div className="flex justify-between items-center gap-3 mt-1.5 pt-1.5 border-t border-white/10">
              <span className="text-slate-300">Number</span>
              <span className="font-semibold text-white truncate max-w-[140px]">{hoveredManager.phone || '—'}</span>
            </div>
            {showBelow ? (
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 border-[6px] border-transparent border-b-[#0F172A]" />
            ) : (
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-[#0F172A]" />
            )}
          </div>
        );
      })()}

      {/* Business Details Tooltip */}
      {hoveredBusiness && (() => {
        // Anchored below the sticky table header (~104px with summary/filter rows), so always
        // show below the trigger unless there's not enough room before the viewport bottom.
        const tooltipHeight = 90 + (hoveredBusiness.isBlocked ? 30 : 0);
        const showBelow = hoveredBusiness.rect.bottom + 10 + tooltipHeight < window.innerHeight;
        return (
          <div
            className="fixed z-[9999] pointer-events-none bg-[#0F172A] text-white text-xs font-normal p-3 rounded-xl shadow-xl w-60"
            style={{
              top: showBelow ? hoveredBusiness.rect.bottom + 10 : hoveredBusiness.rect.top - 10,
              left: Math.min(Math.max(hoveredBusiness.rect.left, 12), window.innerWidth - 252),
              transform: showBelow ? 'translate(0, 0)' : 'translate(0, -100%)',
            }}
          >
            <div className="flex justify-between items-center gap-3">
              <span className="text-slate-300">Company</span>
              <span className="font-semibold text-white truncate max-w-[140px]">{hoveredBusiness.company}</span>
            </div>
            <div className="flex justify-between items-center gap-3 mt-1.5 pt-1.5 border-t border-white/10">
              <span className="text-slate-300">User Type</span>
              <span className="font-semibold text-white truncate max-w-[140px]">{hoveredBusiness.userType}</span>
            </div>
            {hoveredBusiness.isBlocked && (
              <div className="flex justify-between items-center gap-3 mt-1.5 pt-1.5 border-t border-white/10">
                <span className="text-slate-300">Status</span>
                <span className="font-semibold text-red-400">Blocked</span>
              </div>
            )}
            {showBelow ? (
              <div className="absolute -top-1.5 left-4 border-[6px] border-transparent border-b-[#0F172A]" />
            ) : (
              <div className="absolute -bottom-1.5 left-4 border-[6px] border-transparent border-t-[#0F172A]" />
            )}
          </div>
        );
      })()}

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
                <h3 className="font-bold text-slate-800 text-base">Filters</h3>
                <button onClick={() => setIsMobileFiltersOpen(false)} className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Date Range</label>
                  <GlassDateFilter
                    className="w-full [&_.glass-dropdown-trigger]:w-full [&_.glass-dropdown-trigger]:h-11"
                    startDate={dateStart}
                    endDate={dateEnd}
                    onDateChange={onDateChange}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">User ID</label>
                  <input
                    type="text"
                    placeholder="User ID / Name / Email"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">KYC Status</label>
                  <select
                    value={selectedKycStatuses[0] || ''}
                    onChange={(e) => setSelectedKycStatuses(e.target.value ? [e.target.value] : [])}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B] bg-white"
                  >
                    <option value="">All Statuses</option>
                    {KYC_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Rate Card</label>
                  <select
                    value={selectedRateCards[0] || ''}
                    onChange={(e) => setSelectedRateCards(e.target.value ? [e.target.value] : [])}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B] bg-white"
                  >
                    <option value="">All Rate Cards</option>
                    {rateCardFilterOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Wallet Balance</label>
                  <select
                    value={selectedWalletBalances[0] || ''}
                    onChange={(e) => setSelectedWalletBalances(e.target.value ? [e.target.value] : [])}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B] bg-white"
                  >
                    <option value="">All Balances</option>
                    {WALLET_BALANCE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Tier</label>
                  <select
                    value={selectedTiers[0] || ''}
                    onChange={(e) => setSelectedTiers(e.target.value ? [e.target.value] : [])}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B] bg-white"
                  >
                    <option value="">All Tiers</option>
                    {TIER_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">User Type</label>
                  <select
                    value={selectedUserTypes[0] || ''}
                    onChange={(e) => setSelectedUserTypes(e.target.value ? [e.target.value] : [])}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B] bg-white"
                  >
                    <option value="">All Types</option>
                    {USER_TYPE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-[#E2E8F0] flex items-center gap-3 sticky bottom-0 bg-white">
                <button
                  onClick={() => { resetFilters(); setIsMobileFiltersOpen(false); }}
                  className="flex-1 h-11 rounded-full border border-[#E2E8F0] text-[#475569] text-sm font-bold hover:bg-[#F8FAFC] transition-colors"
                >
                  Reset All
                </button>
                <button
                  onClick={() => { applyFilters(); setIsMobileFiltersOpen(false); }}
                  className="flex-1 h-11 rounded-full bg-[#009D64] text-white text-sm font-bold hover:bg-[#009B63] transition-colors shadow-sm"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rate Card Modal */}
      {rateCardModal.open && (
        <div
          className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center"
          onClick={() => { setRateCardModal({ open: false, userId: '', userName: '', currentPlan: '' }); setPlanDropdownOpen(false); }}
        >
          <div className="bg-white rounded-xl p-6 w-[320px] shadow-2xl" onClick={(e) => e.stopPropagation()}>
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
