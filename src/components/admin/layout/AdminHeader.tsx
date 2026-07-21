import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, LogOut, Bell, User, Building2, Calendar, ChevronDown, ChevronUp, Shield, FileText, Zap, Calculator, PackagePlus, MapPin, Wallet, Check, X, ArrowLeft, Banknote, Menu, RefreshCcw, Upload, Users } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { apiClient } from '../../../services/apiClient';
import { getToken } from '../../../utils/session';
import { useAdminTab } from '../../../context/AdminUserContext';
import { useDashboardFilters } from '../../../context/DashboardFilterContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminHeaderProps {
  onMobileMenuToggle?: () => void;
}

export function AdminHeader({ onMobileMenuToggle }: AdminHeaderProps) {
  const { logout } = useAuth();
  const { isAdmin, adminTab, toggleAdminTab, userName, userEmail, profileImage, walletBalance: ctxWalletBalance, walletHold } = useAdminTab();
  const { filters, updateFilter } = useDashboardFilters();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  // Local copy of wallet balance so recharge modal can update it optimistically
  const [walletBalance, setWalletBalance] = useState(0);
  const [showWalletHover, setShowWalletHover] = useState(false);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState(500);
  const [couponCode, setCouponCode] = useState('');
  const [showBillSummary, setShowBillSummary] = useState(true);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [tempCouponCode, setTempCouponCode] = useState('');
  const [rechargeMode, setRechargeMode] = useState<'Payment' | 'COD'>('Payment');
  const [availableCodBalance, setAvailableCodBalance] = useState(148250);

  // Bulk Import modal
  const bulkFileInputRef = useRef<HTMLInputElement>(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkStep, setBulkStep] = useState<1 | 2>(1);
  const [bulkOrderType, setBulkOrderType] = useState<'B2C' | 'B2B'>('B2C');
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkUploading, setBulkUploading] = useState(false);

  // User Login (impersonation) modal
  const [showUserLoginModal, setShowUserLoginModal] = useState(false);
  const [userLoginQuery, setUserLoginQuery] = useState('');
  const [userSuggestions, setUserSuggestions] = useState<any[]>([]);
  const [userLoginSearching, setUserLoginSearching] = useState(false);
  const [userLoginLoading, setUserLoginLoading] = useState(false);

  // Pending agreement for notification bell
  const [pendingAgreement, setPendingAgreement] = useState<any>(null);

  // Sync real wallet balance from context on load (and whenever context updates)
  React.useEffect(() => { setWalletBalance(ctxWalletBalance); }, [ctxWalletBalance]);

  // Fetch pending agreement for notification bell
  useEffect(() => {
    apiClient.get('/agreement/user/pending')
      .then(res => {
        if (res.data?.success && res.data?.hasPending) {
          setPendingAgreement(res.data.agreement);
        } else {
          setPendingAgreement(null);
        }
      })
      .catch(() => {});
  }, []);

  // Debounced user search for impersonation popup
  useEffect(() => {
    if (!showUserLoginModal) return;
    if (!userLoginQuery.trim()) { setUserSuggestions([]); return; }
    const timer = setTimeout(async () => {
      setUserLoginSearching(true);
      try {
        const res = await apiClient.get(`/user/searchUsers?q=${encodeURIComponent(userLoginQuery.trim())}`);
        setUserSuggestions(res.data.users || []);
      } catch { setUserSuggestions([]); }
      finally { setUserLoginSearching(false); }
    }, 350);
    return () => clearTimeout(timer);
  }, [userLoginQuery, showUserLoginModal]);

  const handleAdminLoginAsUser = async (user: any) => {
    setUserLoginLoading(true);
    try {
      const res = await apiClient.post('/user/adminLoginAsUser', { userId: user.id });
      if (res.data.success) {
        const currentToken = getToken();
        if (currentToken) localStorage.setItem('admin_token_backup', currentToken);
        window.location.href = `/login?token=${res.data.token}`;
      }
    } catch (e) {
      console.error('adminLoginAsUser error:', e);
      showToast('Failed to login as user.');
    } finally {
      setUserLoginLoading(false);
    }
  };

  const handleBulkUpload = async () => {
    if (!bulkFile) return;
    setBulkUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', bulkFile);
      const url = bulkOrderType === 'B2C' ? '/bulkOrderUpload/upload' : '/b2b/bulkOrderUpload/upload';
      await apiClient.post(url, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      showToast('Bulk import successful!');
      setShowBulkModal(false);
      setBulkFile(null);
      setBulkStep(1);
    } catch {
      showToast('Bulk import failed. Please check your file and try again.');
    } finally {
      setBulkUploading(false);
    }
  };

  // Initials fallback for profile avatar
  const userInitials = (userName || '?').split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();

  // Helper to compute date boundaries for preset options
  const getPresetDates = (option: string): { start: Date; end: Date } => {
    const now = new Date();
    const endOfToday = new Date(now); endOfToday.setHours(23, 59, 59, 999);
    const startOfToday = new Date(now); startOfToday.setHours(0, 0, 0, 0);
    switch (option) {
      case 'Today':
        return { start: startOfToday, end: endOfToday };
      case 'Yesterday': {
        const s = new Date(startOfToday); s.setDate(s.getDate() - 1);
        const e = new Date(s); e.setHours(23, 59, 59, 999);
        return { start: s, end: e };
      }
      case 'Last 7 Days': {
        const s = new Date(startOfToday); s.setDate(s.getDate() - 6);
        return { start: s, end: endOfToday };
      }
      case 'Last 30 Days': {
        const s = new Date(startOfToday); s.setDate(s.getDate() - 29);
        return { start: s, end: endOfToday };
      }
      case 'This Month': {
        const s = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start: s, end: endOfToday };
      }
      case 'Last Month': {
        const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const e = new Date(now.getFullYear(), now.getMonth(), 0); e.setHours(23, 59, 59, 999);
        return { start: s, end: e };
      }
      default: {
        const s = new Date(startOfToday); s.setDate(s.getDate() - 29);
        return { start: s, end: endOfToday };
      }
    }
  };

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const location = useLocation();
  const navigate = useNavigate();

  const [codTab, setCodTab] = useState(((window as any).__adminCodTab || '') as string);
  useEffect(() => {
    const handler = (e: Event) => setCodTab((e as CustomEvent).detail || '');
    window.addEventListener('admin-cod-tab-change', handler);
    setCodTab((window as any).__adminCodTab || '');
    return () => window.removeEventListener('admin-cod-tab-change', handler);
  }, []);

  const isSetupPage = [
    '/admin/users',
    '/admin/roles',
    '/admin/allocate-sellers',
    '/admin/status-map',
    '/admin/edd-mapping',
    '/admin/epd-mapping',
    '/admin/orders',
    '/admin/ndr',
    '/admin/weight-discrepancy',
    '/admin/cod',
    '/admin/wallet',
    '/admin/support',
    '/admin/referral',
    '/admin/accounts',
    '/admin/announcement',
    '/admin/notification'
  ].some((path) => location.pathname === path || location.pathname.startsWith(path + '/'));

  // KYC is a self-contained onboarding flow — the page-context search/date/quick-action tools don't apply there.
  const isKycPage = location.pathname === '/admin/kyc' || location.pathname.startsWith('/admin/kyc/');

  const ORDERS_TAB_PLACEHOLDER: Record<string, string> = {
    'new': "Search new orders by AWB or Order ID (Press '/')",
    'ready-to-ship': "Search ready-to-ship orders by AWB or Order ID (Press '/')",
    'pickup-manifest': "Search pickups by Pickup ID (Press '/')",
    'in-transit': "Search in-transit orders by AWB or Order ID (Press '/')",
    'delivered': "Search delivered orders by AWB or Order ID (Press '/')",
    'out-for-delivery': "Search out-for-delivery orders by AWB or Order ID (Press '/')",
    'cancelled': "Search cancelled orders by AWB or Order ID (Press '/')",
    'lost': "Search lost orders by AWB or Order ID (Press '/')",
    'damaged': "Search damaged orders by AWB or Order ID (Press '/')",
    'rto-initiated': "Search RTO initiated orders by AWB or Order ID (Press '/')",
    'rto-in-transit': "Search RTO in-transit orders by AWB or Order ID (Press '/')",
    'rto-delivered': "Search RTO delivered orders by AWB or Order ID (Press '/')",
    'rto-lost': "Search RTO lost orders by AWB or Order ID (Press '/')",
    'rto-damaged': "Search RTO damaged orders by AWB or Order ID (Press '/')",
    'all': "Search all orders by AWB or Order ID (Press '/')",
  };

  const getSearchPlaceholder = () => {
    if (location.pathname.startsWith('/admin/orders/')) {
      const tabSlug = location.pathname.slice('/admin/orders/'.length);
      return ORDERS_TAB_PLACEHOLDER[tabSlug] || "Search AWB or Order ID...";
    }
    if (location.pathname.startsWith('/admin/weight-discrepancy/')) {
      return "Search weight discrepancies by name, email, or AWB (Press '/')";
    }
    const path = location.pathname;
    switch (path) {
      case '/admin/users': return "Search users by name, email or role (Press '/')";
      case '/admin/roles': return "Search roles by name (Press '/')";
      case '/admin/allocate-sellers': return "Search sellers or account managers (Press '/')";
      case '/admin/status-map': return "Search status mappings (Press '/')";
      case '/admin/edd-mapping': return "Search EDD rules (Press '/')";
      case '/admin/epd-mapping': return "Search EPD rules (Press '/')";
      case '/admin/orders': return "Search new orders by AWB or Order ID (Press '/')";
      case '/admin/ndr': return "Search NDR by name, email, phone or AWB (Press '/')";
      case '/admin/weight-discrepancy': return "Search weight discrepancies by name, email, or AWB (Press '/')";
      case '/admin/cod':
        switch (codTab) {
          case 'Seller COD Remittance': return "Search by user, remittance ID or UTR (Press '/')";
          case 'Courier COD Remittance': return "Search by user, order ID or AWB (Press '/')";
          default: return "Search COD orders by user, order ID or AWB (Press '/')";
        }
      case '/admin/wallet': return "Search transactions by user or remark (Press '/')";
      case '/admin/referral': return "Search referrers by name, email, phone or ID (Press '/')";
      case '/admin/support': return "Search support tickets by ID, AWB or customer (Press '/')";
      case '/admin/accounts': return "Search admin accounts by name, email or role (Press '/')";
      case '/admin/announcement': return "Search announcements by title or message (Press '/')";
      case '/admin/notification': return "Search notifications by user, title or content (Press '/')";
      default: return "Search shipments, vendors, or users (Press '/')";
    }
  };

  useEffect(() => {
    if (isSetupPage) {
      const q = (window as any).__adminSearchQuery || '';
      setSearchQuery(q);
    } else {
      setSearchQuery('');
    }
  }, [location.pathname, isSetupPage]);

  const dropdownVariants: any = {
    hidden: { opacity: 0, scale: 0.95, y: 10 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring" as const, stiffness: 400, damping: 30 } },
    exit: { opacity: 0, scale: 0.95, y: 10, transition: { duration: 0.2 } }
  };

  return (
    <>
      {/* Mobile Top Bar — visible only on mobile */}
      <div className="md:hidden bg-white border-b border-[#E2E8F0] px-4 py-3 flex items-center justify-between sticky top-0 z-[100] shadow-sm">
        <button
          onClick={onMobileMenuToggle}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-[#475569] hover:bg-[#F8FAFC] transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-2.5">
          {/* Notifications */}
          <div className="relative animate-fade-in">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowQuickActions(false);
                setShowProfileMenu(false);
              }}
              className={`w-8 h-8 flex items-center justify-center rounded-full text-[#64748B] hover:bg-[#F8FAFC] transition-colors relative ${showNotifications ? 'bg-[#F8FAFC] text-[#0F172A]' : ''}`}
            >
              <Bell className="w-[18px] h-[18px]" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#EF4444] rounded-full" />
            </button>

            {showNotifications && (
              <div className="fixed left-3 right-3 top-[60px] max-w-[calc(100vw-24px)] bg-white rounded-xl shadow-xl border border-[#E2E8F0] py-2 z-50 origin-top-right">
                <div className="px-4 py-2 border-b border-[#E2E8F0] flex justify-between items-center bg-slate-50/50">
                  <h3 className="font-bold text-[#0F172A] text-xs uppercase tracking-wider">Alerts</h3>
                  <span className="text-[10px] font-semibold text-[#00A86B] cursor-pointer hover:underline" onClick={() => setShowNotifications(false)}>Dismiss</span>
                </div>
                <div className="max-h-[220px] overflow-y-auto">
                  <div className="px-4 py-6 text-center">
                    <Bell className="w-6 h-6 text-[#CBD5E1] mx-auto mb-2" />
                    <p className="text-xs font-semibold text-[#94A3B8]">No alerts right now</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="relative animate-fade-in">
            <button
              onClick={() => {
                setShowQuickActions(!showQuickActions);
                setShowNotifications(false);
                setShowProfileMenu(false);
              }}
              className={`w-8 h-8 flex items-center justify-center rounded-full text-[#64748B] hover:bg-[#F8FAFC] transition-colors ${showQuickActions ? 'bg-[#F8FAFC] text-[#0F172A]' : ''}`}
            >
              <Zap className="w-[18px] h-[18px]" />
            </button>

            {showQuickActions && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-[#E2E8F0] py-2 z-50 origin-top-right">
                <div className="px-4 py-1.5 border-b border-slate-100 mb-1">
                  <span className="text-[10px] font-bold text-[#94A3B8] uppercase">Quick Menu</span>
                </div>
                <Link to="/admin/add-order" className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]" onClick={() => setShowQuickActions(false)}>
                  <PackagePlus className="w-3.5 h-3.5" /> Add an Order
                </Link>
                <button className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] text-left w-full" onClick={() => { setShowBulkModal(true); setBulkStep(1); setBulkFile(null); setShowQuickActions(false); }}>
                  <Upload className="w-3.5 h-3.5" /> Bulk Import
                </button>
                <Link to="/admin/rate-calculator" className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]" onClick={() => setShowQuickActions(false)}>
                  <Calculator className="w-3.5 h-3.5" /> Calculate Rate
                </Link>
                {isAdmin && (
                  <button className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] text-left w-full" onClick={() => { setShowUserLoginModal(true); setUserLoginQuery(''); setUserSuggestions([]); setShowQuickActions(false); }}>
                    <Users className="w-3.5 h-3.5" /> User Login
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Wallet Balance */}
          <button
            onClick={() => setShowRechargeModal(true)}
            className={`flex items-center gap-1.5 text-white px-2.5 py-1.5 rounded-full text-[11px] font-bold shadow-sm cursor-pointer transition-colors focus:outline-none ${walletBalance < 0 ? 'bg-[#EF4444] hover:bg-[#DC2626]' : 'bg-[#00A86B] hover:bg-[#009B63]'}`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>₹{(walletBalance / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            <span className="text-white/80">+</span>
          </button>

          {/* Profile Dropdown */}
          <div className="relative animate-fade-in">
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
                setShowQuickActions(false);
              }}
              className="w-8 h-8 rounded-full bg-[#E2E8F0] overflow-hidden flex items-center justify-center focus:outline-none border border-[#CBD5E1]"
            >
              <img src="https://ui-avatars.com/api/?name=Admin&background=00A86B&color=fff&size=32&bold=true" alt="Profile" className="w-full h-full object-cover" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-[#E2E8F0] py-2 z-50 origin-top-right">
                <div className="px-4 py-2 border-b border-slate-100 flex items-center gap-2.5 bg-slate-50/50">
                  <div className="w-6 h-6 rounded-md bg-[#00A86B] text-white flex items-center justify-center font-bold text-xs">S</div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[#0F172A] leading-tight">Super Admin</span>
                    <span className="text-[10px] font-medium text-[#64748B]">System Role</span>
                  </div>
                </div>
                <Link to="/admin/profile" className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]" onClick={() => setShowProfileMenu(false)}>
                  <User className="w-3.5 h-3.5" /> My Profile
                </Link>
                <button
                  onClick={() => { logout(); setShowProfileMenu(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 text-left"
                >
                  <LogOut className="w-3.5 h-3.5" /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Header — hidden on mobile */}
      <header className="hidden md:flex bg-white/80 backdrop-blur-xl border-b border-[#E2E8F0]/60 h-[72px] px-6 items-center gap-6 sticky top-0 z-[100] shadow-[0_4px_24px_-12px_rgba(0,0,0,0.05)]">
      
      {/* Left Section - Logo & Portal Name */}
      <div className="flex items-center shrink-0">
        <Link to="/admin/dashboard" className="flex items-center group">
          <img 
            src="/logo-color.png" 
            alt="QuickPost" 
            className="h-16 w-auto object-contain transition-opacity group-hover:opacity-80 scale-[1.5] origin-left ml-2" 
          />
        </Link>
      </div>

      {/* Middle Section - Search */}
      <div className="flex-1 flex items-center justify-center min-w-0">
        {!isKycPage && (
        <div className="hidden md:flex items-center relative w-full max-w-lg group">
          <Search className="w-4 h-4 absolute left-3.5 text-[#94A3B8] group-focus-within:text-[#00A86B] transition-colors duration-300" />
          <input 
            type="text" 
            placeholder={getSearchPlaceholder()} 
            value={searchQuery}
            onChange={(e) => {
              const val = e.target.value;
              setSearchQuery(val);
              if (isSetupPage) {
                (window as any).__adminSearchQuery = val;
                window.dispatchEvent(new CustomEvent('admin-search', { detail: val }));
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchQuery.trim() && !isSetupPage) {
                navigate('/admin/tracking', { state: { awb: searchQuery.trim() } });
                setSearchQuery('');
              }
            }}
            className="w-full h-10 pl-10 pr-12 rounded-[14px] border border-[#E2E8F0] bg-[#F8FAFC]/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20 focus:border-[#00A86B] transition-all text-[#0F172A] placeholder:text-[#94A3B8] font-medium shadow-[0_2px_6px_rgba(0,0,0,0.02)] hover:border-[#CBD5E1]"
          />
          <div className="absolute right-3 px-1.5 py-0.5 rounded-md bg-white border border-[#E2E8F0] shadow-sm text-[10px] font-bold text-[#94A3B8]">
            ⌘K
          </div>
        </div>
        )}
      </div>

      {/* Right Section - Actions */}
      <div className="flex items-center gap-3 shrink-0">
        
        {/* Date Filter */}
        {!isSetupPage && !isKycPage && (
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setShowDateDropdown(!showDateDropdown);
                setIsCustomMode(false);
              }}
              className="hidden lg:flex items-center gap-2 px-4 h-10 rounded-[14px] border border-[#E2E8F0] text-xs font-semibold text-[#475569] cursor-pointer hover:bg-[#F8FAFC] hover:border-[#CBD5E1] transition-all bg-white shadow-sm focus:outline-none"
            >
              <Calendar className="w-4 h-4 text-[#94A3B8]" /> {filters.dateRange.label} <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8]" />
            </motion.button>
            
            {showDateDropdown && (
              <div 
                className="fixed inset-0 z-[105] bg-transparent" 
                onClick={() => {
                  setShowDateDropdown(false);
                  setIsCustomMode(false);
                }}
              />
            )}

            <AnimatePresence>
              {showDateDropdown && (
                <motion.div 
                  variants={dropdownVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="absolute left-0 mt-3 w-56 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_20px_40px_-12px_rgba(0,0,0,0.15),0_0_0_1px_rgba(0,0,0,0.05)] overflow-hidden z-[110] origin-top-left p-2"
                  onMouseDown={(e) => e.stopPropagation()}
                >
                {isCustomMode ? (
                  <div className="p-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">Custom Range</span>
                      <button 
                        onClick={() => setIsCustomMode(false)}
                        className="text-[10px] text-[#00A86B] font-bold hover:underline"
                      >
                        Back
                      </button>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Start Date</label>
                      <input 
                        type="date"
                        required
                        value={customStart}
                        onChange={(e) => setCustomStart(e.target.value)}
                        className="w-full h-8 px-2 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#00A86B] font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">End Date</label>
                      <input 
                        type="date"
                        required
                        value={customEnd}
                        onChange={(e) => setCustomEnd(e.target.value)}
                        className="w-full h-8 px-2 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#00A86B] font-medium"
                      />
                    </div>
                    <button
                      onClick={() => {
                        if (!customStart || !customEnd) {
                          showToast('Please select both start and end dates.');
                          return;
                        }
                        const start = new Date(customStart); start.setHours(0, 0, 0, 0);
                        const end = new Date(customEnd); end.setHours(23, 59, 59, 999);
                        const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
                        const label = `${fmt(start)} – ${fmt(end)}`;
                        updateFilter('dateRange', { start, end, label });
                        setShowDateDropdown(false);
                        setIsCustomMode(false);
                        showToast(`Date range set to: ${label}`);
                      }}
                      className="w-full h-8 rounded-lg bg-[#00A86B] text-white text-xs font-bold hover:bg-[#009B63] transition-colors"
                    >
                      Apply Range
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-0.5">
                    {['Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'This Month', 'Last Month'].map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          const { start, end } = getPresetDates(option);
                          updateFilter('dateRange', { start, end, label: option });
                          setShowDateDropdown(false);
                          showToast(`Date range set to: ${option}`);
                        }}
                        className={`w-full text-left px-3 py-1.5 rounded-xl text-[13px] font-semibold transition-colors flex items-center justify-between ${
                          filters.dateRange.label === option
                            ? 'bg-[#00A86B]/10 text-[#00A86B]'
                            : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                        }`}
                      >
                        {option}
                        {filters.dateRange.label === option && <Check className="w-4 h-4 text-[#00A86B]" />}
                      </button>
                    ))}
                    <div className="h-[1px] bg-slate-100 my-1"></div>
                    <button
                      onClick={() => setIsCustomMode(true)}
                      className="w-full text-left px-3 py-1.5 rounded-xl text-[13px] font-semibold text-[#00A86B] hover:bg-[#00A86B]/5 transition-colors"
                    >
                      Custom Date...
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        )}

        {/* Wallet Balance */}
        <div 
          className="relative"
          onMouseEnter={() => setShowWalletHover(true)}
          onMouseLeave={() => setShowWalletHover(false)}
        >
          <motion.button 
            whileHover={{ scale: 1.03 }} 
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              setShowRechargeModal(true);
              setShowWalletHover(false);
            }}
            className={`h-10 px-4 rounded-[14px] text-white text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer focus:outline-none ${walletBalance < 0 ? 'bg-gradient-to-b from-[#F87171] to-[#EF4444] shadow-[0_4px_12px_rgba(239,68,68,0.25),inset_0_1px_1px_rgba(255,255,255,0.2)] border border-[#DC2626]' : 'bg-gradient-to-b from-[#00b876] to-[#00A86B] shadow-[0_4px_12px_rgba(0,168,107,0.25),inset_0_1px_1px_rgba(255,255,255,0.2)] border border-[#009B63]'}`}
          >
            <Wallet className="w-4 h-4 text-white/95" /> ₹{walletBalance.toLocaleString('en-IN')}
          </motion.button>

          <AnimatePresence>
            {showWalletHover && (
              <motion.div
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={dropdownVariants}
                className="absolute right-0 mt-3 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_20px_40px_-12px_rgba(0,0,0,0.15),0_0_0_1px_rgba(0,0,0,0.05)] overflow-hidden z-[110] origin-top-right p-4 border border-slate-100"
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">Wallet Summary</span>
                  <span className="w-2 h-2 rounded-full bg-[#00A86B] animate-pulse"></span>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-[#64748B]">Available Balance</span>
                    <span className="text-sm font-bold text-slate-800">₹{walletBalance.toLocaleString('en-IN')}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-[#64748B]">Hold Amount</span>
                    <span className="text-sm font-bold text-amber-600">₹{walletHold.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="h-[1px] bg-slate-100 my-1"></div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700">Net Balance</span>
                    <span className="text-sm font-extrabold text-[#00A86B]">₹{Math.max(0, walletBalance - walletHold).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 text-center">
                  <p className="text-[10px] text-slate-400 font-semibold">Click wallet to Recharge</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Quick Actions */}
        {!isSetupPage && !isKycPage && (
          <div className="relative">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowQuickActions(!showQuickActions)}
              onBlur={() => setTimeout(() => setShowQuickActions(false), 200)}
              className={`w-10 h-10 rounded-[14px] border flex items-center justify-center transition-all shadow-sm ${showQuickActions ? 'bg-[#F8FAFC] border-[#CBD5E1]' : 'bg-white border-[#E2E8F0] hover:bg-[#F8FAFC] hover:border-[#CBD5E1]'}`}
              title="Quick Actions"
            >
              <Zap className={`w-5 h-5 ${showQuickActions ? 'text-[#D97706]' : 'text-[#F59E0B]'}`} />
            </motion.button>

            <AnimatePresence>
              {showQuickActions && (
                <motion.div 
                  variants={dropdownVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="absolute right-0 mt-3 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_20px_40px_-12px_rgba(0,0,0,0.15),0_0_0_1px_rgba(0,0,0,0.05)] overflow-hidden z-[110] origin-top-right"
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <div className="px-4 py-3.5 border-b border-[#E2E8F0]/60 bg-white/50">
                    <h3 className="font-bold text-[#0F172A] text-[13px] tracking-wide uppercase">Quick Actions</h3>
                  </div>
                  <div className="p-2 grid grid-cols-2 gap-1">
                    <Link
                      to="/admin/add-order"
                      className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-[#F8FAFC] transition-colors group text-center"
                      onClick={() => setShowQuickActions(false)}
                    >
                      <div className="w-10 h-10 rounded-full bg-[#EFF6FF] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <PackagePlus className="w-5 h-5 text-[#3B82F6]" />
                      </div>
                      <h4 className="text-[12px] font-bold text-[#0F172A] group-hover:text-[#3B82F6] transition-colors leading-tight">Add an Order</h4>
                    </Link>
                    <button
                      className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-[#F8FAFC] transition-colors group text-center w-full"
                      onClick={() => { setShowBulkModal(true); setBulkStep(1); setBulkFile(null); setShowQuickActions(false); }}
                    >
                      <div className="w-10 h-10 rounded-full bg-[#FFF7ED] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <Upload className="w-5 h-5 text-[#F97316]" />
                      </div>
                      <h4 className="text-[12px] font-bold text-[#0F172A] group-hover:text-[#F97316] transition-colors leading-tight">Bulk Import</h4>
                    </button>
                    <Link
                      to="/admin/rate-calculator"
                      className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-[#F8FAFC] transition-colors group text-center"
                      onClick={() => setShowQuickActions(false)}
                    >
                      <div className="w-10 h-10 rounded-full bg-[#F0FDF4] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <Calculator className="w-5 h-5 text-[#00A86B]" />
                      </div>
                      <h4 className="text-[12px] font-bold text-[#0F172A] group-hover:text-[#00A86B] transition-colors leading-tight">Calculate Rate</h4>
                    </Link>
                    {isAdmin && (
                      <button
                        className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-[#F8FAFC] transition-colors group text-center w-full"
                        onClick={() => { setShowUserLoginModal(true); setUserLoginQuery(''); setUserSuggestions([]); setShowQuickActions(false); }}
                      >
                        <div className="w-10 h-10 rounded-full bg-[#F5F3FF] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                          <Users className="w-5 h-5 text-[#8B5CF6]" />
                        </div>
                        <h4 className="text-[12px] font-bold text-[#0F172A] group-hover:text-[#8B5CF6] transition-colors leading-tight">User Login</h4>
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Notifications */}
        <div className="relative">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowNotifications(!showNotifications)}
            onBlur={() => setTimeout(() => setShowNotifications(false), 200)}
            className={`w-10 h-10 rounded-[14px] border flex items-center justify-center transition-all relative ${showNotifications ? 'bg-[#F8FAFC] border-[#CBD5E1] text-[#0F172A]' : 'bg-white border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'}`}
          >
            <Bell className="w-5 h-5" />
            {!!pendingAgreement && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#EF4444] rounded-full border-[1.5px] border-white shadow-sm" />
            )}
          </motion.button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div 
                variants={dropdownVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute right-0 mt-3 w-[340px] bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_20px_40px_-12px_rgba(0,0,0,0.15),0_0_0_1px_rgba(0,0,0,0.05)] overflow-hidden z-[110] origin-top-right"
                onMouseDown={(e) => e.preventDefault()}
              >
                <div className="px-4 py-3.5 border-b border-[#E2E8F0]/60 flex justify-between items-center bg-white/50">
                  <h3 className="font-bold text-[#0F172A] text-[13px] tracking-wide uppercase">Notifications</h3>
                  {!!pendingAgreement && (
                    <span className="text-[11px] font-bold text-white bg-[#EF4444] rounded-full px-2 py-0.5">1</span>
                  )}
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {pendingAgreement ? (
                    <div className="px-4 py-3.5 border-b border-[#E2E8F0]/60 hover:bg-[#F8FAFC] transition-colors">
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#EF4444] shrink-0 mt-1.5" />
                        <div className="flex-1">
                          <p className="text-[13px] font-semibold text-[#0F172A] leading-snug">Agreement Pending</p>
                          <p className="text-[12px] text-[#64748B] mt-0.5">{pendingAgreement.versionName || 'New Terms & Conditions'} — please review and accept.</p>
                          <button
                            onClick={() => { navigate('/admin/notification'); setShowNotifications(false); }}
                            className="mt-1.5 text-[11px] font-bold text-[#00A86B] hover:underline"
                          >
                            View &amp; Accept →
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="px-4 py-8 flex flex-col items-center gap-2">
                      <Bell className="w-8 h-8 text-[#CBD5E1]" />
                      <p className="text-[13px] font-semibold text-[#94A3B8]">No notifications right now</p>
                    </div>
                  )}
                </div>
                <div className="p-2.5 text-center bg-[#F8FAFC]/80 hover:bg-[#F1F5F9] transition-colors cursor-pointer" onClick={() => { navigate('/admin/notification'); setShowNotifications(false); }}>
                  <span className="text-xs font-bold text-[#0F172A]">View All Notifications</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile Dropdown */}
        <div className="relative ml-1 border-l border-[#E2E8F0] pl-3 hidden sm:block">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            onBlur={() => setTimeout(() => setShowProfileMenu(false), 200)}
            className="flex items-center gap-3 focus:outline-none group"
          >
            <div className="w-10 h-10 rounded-[14px] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.1)] group-hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-all shrink-0">
              {profileImage ? (
                <img src={profileImage} alt={userName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#1E293B] to-[#0F172A] flex items-center justify-center text-white text-xs font-bold">
                  {userInitials}
                </div>
              )}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[13px] font-bold text-[#0F172A] leading-tight group-hover:text-[#00A86B] transition-colors truncate max-w-[120px]">
                {userName || 'User'}
              </span>
              <span className="text-[11px] font-semibold text-[#64748B]">{isAdmin ? 'Admin' : 'User'}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] group-hover:text-[#0F172A] transition-colors" />
          </button>

          <AnimatePresence>
            {showProfileMenu && (
              <motion.div 
                variants={dropdownVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute right-0 mt-3 w-56 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_20px_40px_-12px_rgba(0,0,0,0.15),0_0_0_1px_rgba(0,0,0,0.05)] overflow-hidden z-[110] origin-top-right p-1.5"
                onMouseDown={(e) => e.preventDefault()}
              >
                <div className="px-3 py-2.5 mb-1 border-b border-[#E2E8F0]/60">
                  <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-0.5">Signed in as</p>
                  <p className="text-[13px] font-bold text-[#0F172A] truncate">{userEmail || '—'}</p>
                </div>
                
                <Link to="/admin/profile" className="flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-semibold text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors" onClick={() => setShowProfileMenu(false)}>
                  <User className="w-4 h-4 text-[#94A3B8]" /> Profile
                </Link>

                {/* Admin / User view toggle — only for admins */}
                {isAdmin && (
                  <>
                    <div className="border-t border-[#E2E8F0] my-1"></div>
                    <div className="flex items-center justify-between px-3 py-2">
                      <div className="flex items-center gap-2 text-[#475569]">
                        <Shield className="w-4 h-4 text-[#00A86B]" />
                        <span className="text-[13px] font-semibold">{adminTab ? 'Admin' : 'User'}</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={adminTab}
                          onChange={(e) => toggleAdminTab(e.target.checked)}
                        />
                        <div className="w-10 h-5 bg-gray-300 rounded-full peer peer-checked:bg-[#00A86B] transition-colors duration-300"></div>
                        <div className="absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform duration-300 peer-checked:translate-x-5"></div>
                      </label>
                    </div>
                  </>
                )}

                <div className="border-t border-[#E2E8F0] my-1"></div>

                <button onMouseDown={(e) => { e.preventDefault(); logout(); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-semibold text-[#EF4444] hover:bg-[#FEF2F2] transition-colors">
                  <LogOut className="w-4 h-4 text-[#EF4444]/70" /> Sign out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 z-[250] bg-[#1E293B] text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border border-white/10 sm:min-w-[280px]"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 text-[#34D399]" />
              </div>
              <p className="text-[13px] font-medium pr-4">{toast}</p>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Recharge Wallet Modal */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showRechargeModal && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  setShowRechargeModal(false);
                  setRechargeMode('Payment');
                }}
                className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm z-[200]"
              />

              {/* Modal Container */}
              <div className="fixed inset-0 flex items-center justify-center z-[201] p-4 pointer-events-none">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  transition={{ type: "spring", duration: 0.5 }}
                  className="w-full max-w-[300px] sm:max-w-[380px] max-h-[88vh] sm:max-h-[92vh] overflow-y-auto bg-white rounded-2xl sm:rounded-3xl shadow-[0_24px_48px_rgba(0,0,0,0.16)] p-4 sm:p-6 relative pointer-events-auto border border-slate-100"
                >
                  {/* Center Top Overlapping Close Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowRechargeModal(false);
                      setRechargeMode('Payment');
                    }}
                    className="absolute -top-3.5 sm:-top-5 left-1/2 -translate-x-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:bg-slate-50 transition-colors border border-slate-100 cursor-pointer focus:outline-none"
                  >
                    <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
                  </button>

                  {/* Header */}
                  <div className="flex justify-between items-center mb-3 sm:mb-5 mt-1 sm:mt-2">
                    <h2 className="text-sm sm:text-lg font-bold text-[#0F172A]">Recharge Wallet</h2>
                    <div className="flex items-center gap-1 text-[#00A86B] font-semibold text-xs sm:text-sm">
                      <Wallet className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span>₹{walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  <div className="h-[1px] bg-slate-100 mb-3 sm:mb-5" />

                  {rechargeMode === 'Payment' ? (
                    <>
                      {/* Amount Input Section */}
                      <div className="text-center mb-3 sm:mb-5">
                        <p className="text-[10px] sm:text-[11px] font-bold text-[#64748B] uppercase tracking-wide mb-2 sm:mb-3">Enter Amount to Add</p>

                        <div className="inline-block relative">
                          <div className="flex items-center justify-center text-2xl sm:text-3xl font-extrabold text-[#0F172A]">
                            <span className="mr-1 font-extrabold select-none">₹</span>
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={rechargeAmount || ''}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '');
                                setRechargeAmount(val ? parseInt(val) : 0);
                              }}
                              style={{
                                width: `${Math.max(1.5, rechargeAmount ? rechargeAmount.toString().length : 1.5) * 16}px`,
                                minWidth: '26px'
                              }}
                              className="text-center bg-transparent focus:outline-none font-extrabold border-none p-0 select-all"
                              placeholder="0"
                            />
                          </div>
                          <div className="w-full border-b border-dashed border-[#94A3B8] mt-1 h-0" />
                        </div>

                        {/* Quick Select Pills */}
                        <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-3 sm:mt-5">
                          {[500, 1000, 2000, 5000].map((amt) => (
                            <button
                              type="button"
                              key={amt}
                              onClick={() => setRechargeAmount(amt)}
                              className={`px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full border text-[11px] sm:text-xs font-semibold transition-all ${
                                rechargeAmount === amt
                                  ? 'border-[#00A86B] bg-[#00A86B]/5 text-[#00A86B]'
                                  : 'border-slate-200 text-[#64748B] hover:border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              ₹{amt}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="h-[1px] bg-slate-100 mb-3 sm:mb-4" />

                      {/* Offer & Bill Summary Section */}
                      <div className="mb-3 sm:mb-5">
                        <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 sm:mb-2.5">Offer & Bill Summary</p>

                        {/* Coupon Box */}
                        <div
                          onClick={() => {
                            setTempCouponCode(couponCode);
                            setShowCouponModal(true);
                          }}
                          className="border border-slate-200/80 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between bg-white mb-2 sm:mb-3 hover:border-slate-300 transition-colors cursor-pointer"
                        >
                          <div className="flex flex-col text-left">
                            <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wide">Coupon Code</span>
                            <span className="text-[11px] sm:text-xs font-semibold text-slate-700">
                              {couponCode ? (
                                <span className="text-[#00A86B] font-bold">{couponCode}</span>
                              ) : (
                                "Have Coupon Code?"
                              )}
                            </span>
                          </div>
                          <span className="text-[11px] sm:text-xs font-bold text-[#00A86B] hover:text-[#009B63] select-none">
                            {couponCode ? 'Change' : 'View Coupons'}
                          </span>
                        </div>

                        {/* Bill Details Box */}
                        <div className="bg-[#F8FAFC] border border-[#E2E8F0]/50 rounded-xl p-2.5 sm:p-3">
                          <button
                            type="button"
                            onClick={() => setShowBillSummary(!showBillSummary)}
                            className="w-full flex items-center justify-between text-[11px] sm:text-xs font-bold text-[#475569] focus:outline-none"
                          >
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <Wallet className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#94A3B8]" />
                              <span>Amount to be credited: ₹{(rechargeAmount || 0).toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[#94A3B8] hover:text-[#64748B] transition-colors">
                              <span className="text-[9px] sm:text-[10px] font-bold hidden sm:inline">{showBillSummary ? 'Hide Bill Summary' : 'Show Bill Summary'}</span>
                              {showBillSummary ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </div>
                          </button>

                          {showBillSummary && (
                            <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-[#E2E8F0] space-y-1.5 sm:space-y-2">
                              <div className="flex justify-between text-[11px] sm:text-xs font-semibold text-[#64748B]">
                                <span>Recharge Amount</span>
                                <span>₹{(rechargeAmount || 0).toLocaleString('en-IN')}</span>
                              </div>
                              <div className="flex justify-between text-[11px] sm:text-xs font-bold text-[#0F172A] pt-2 border-t border-dashed border-[#E2E8F0]">
                                <span>Payable Amount</span>
                                <span>₹{(rechargeAmount || 0).toLocaleString('en-IN')}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Pay Button */}
                      <button
                        type="button"
                        disabled={!rechargeAmount || rechargeAmount <= 0}
                        onClick={() => {
                          setWalletBalance((prev) => prev + rechargeAmount);
                          showToast(`Recharge of ₹${rechargeAmount.toLocaleString('en-IN')} successful!`);
                          setShowRechargeModal(false);
                        }}
                        className="w-full py-2.5 sm:py-3.5 bg-gradient-to-r from-[#00b876] to-[#00A86B] text-white text-xs sm:text-sm font-bold rounded-full shadow-[0_4px_12px_rgba(0,168,107,0.2)] hover:from-[#00c982] hover:to-[#00b876] transition-all disabled:opacity-50 disabled:pointer-events-none text-center focus:outline-none cursor-pointer"
                      >
                        Pay ₹{(rechargeAmount || 0).toLocaleString('en-IN')}
                      </button>

                      {/* OR recharge via COD Remittance */}
                      <div className="relative flex py-1.5 sm:py-2 items-center my-1 sm:my-1.5">
                        <div className="flex-grow border-t border-slate-100"></div>
                        <span className="flex-shrink mx-3 text-slate-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">OR</span>
                        <div className="flex-grow border-t border-slate-100"></div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setRechargeMode('COD')}
                        className="w-full py-2.5 sm:py-3 border border-[#00A86B]/30 hover:border-[#00A86B] bg-[#00A86B]/5 hover:bg-[#00A86B]/10 text-[#00A86B] text-[11px] sm:text-xs font-bold rounded-full transition-all flex items-center justify-center gap-1.5 focus:outline-none cursor-pointer"
                      >
                        <Banknote className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Recharge via COD Remittance
                      </button>
                    </>
                  ) : (
                    <div className="space-y-3 sm:space-y-5 animate-fade-in">
                      {/* COD Remittance Info Card */}
                      <div className="bg-gradient-to-br from-emerald-50 to-green-50/30 border border-emerald-100/80 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-left">
                        <div className="flex justify-between items-center mb-1.5 sm:mb-2">
                          <span className="text-[10px] sm:text-[11px] font-bold text-emerald-800 uppercase tracking-wide">Available COD Payout</span>
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        </div>
                        <div className="text-xl sm:text-2xl font-black text-slate-800">
                          ₹{availableCodBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-[9px] sm:text-[10px] text-slate-400 font-semibold mt-1">
                          Transfer funds directly from your pending COD remittance.
                        </p>
                      </div>

                      {/* Amount to Transfer Input */}
                      <div className="text-center">
                        <p className="text-[10px] sm:text-[11px] font-bold text-[#64748B] uppercase tracking-wide mb-2 sm:mb-2.5">Amount to Transfer</p>

                        <div className="inline-block relative">
                          <div className="flex items-center justify-center text-2xl sm:text-3xl font-extrabold text-[#0F172A]">
                            <span className="mr-1 font-extrabold select-none">₹</span>
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={rechargeAmount || ''}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '');
                                setRechargeAmount(val ? parseInt(val) : 0);
                              }}
                              style={{
                                width: `${Math.max(1.5, rechargeAmount ? rechargeAmount.toString().length : 1.5) * 16}px`,
                                minWidth: '26px'
                              }}
                              className="text-center bg-transparent focus:outline-none font-extrabold border-none p-0 select-all"
                              placeholder="0"
                            />
                          </div>
                          <div className="w-full border-b border-dashed border-[#94A3B8] mt-1 h-0" />
                        </div>

                        {/* Quick Select Pills */}
                        <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-3 sm:mt-4">
                          {[500, 1000, 2000, 5000].map((amt) => (
                            <button
                              type="button"
                              key={amt}
                              onClick={() => setRechargeAmount(amt)}
                              className={`px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full border text-[11px] sm:text-xs font-semibold transition-all ${
                                rechargeAmount === amt
                                  ? 'border-[#00A86B] bg-[#00A86B]/5 text-[#00A86B]'
                                  : 'border-slate-200 text-[#64748B] hover:border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              ₹{amt}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Information banner */}
                      <div className="flex gap-2 p-2.5 sm:p-3 bg-slate-50 border border-slate-100 rounded-xl text-left">
                        <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#94A3B8] shrink-0 mt-0.5" />
                        <p className="text-[9px] sm:text-[10px] text-slate-500 font-medium leading-normal">
                          No gateway charges apply. The transferred amount will be adjusted in your next COD settlement statement.
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2 sm:space-y-2.5">
                        <button
                          type="button"
                          disabled={!rechargeAmount || rechargeAmount <= 0 || rechargeAmount > availableCodBalance}
                          onClick={() => {
                            setWalletBalance((prev) => prev + rechargeAmount);
                            setAvailableCodBalance((prev) => prev - rechargeAmount);
                            showToast(`Successfully transferred ₹${rechargeAmount.toLocaleString('en-IN')} from COD Remittance!`);
                            setShowRechargeModal(false);
                            setRechargeMode('Payment');
                          }}
                          className="w-full py-2.5 sm:py-3.5 bg-gradient-to-r from-emerald-600 to-[#00A86B] text-white text-xs sm:text-sm font-bold rounded-full shadow-[0_4px_12px_rgba(0,168,107,0.2)] hover:from-emerald-700 hover:to-[#009B63] transition-all disabled:opacity-50 disabled:pointer-events-none text-center focus:outline-none cursor-pointer"
                        >
                          Confirm Transfer
                        </button>

                        <button
                          type="button"
                          onClick={() => setRechargeMode('Payment')}
                          className="w-full py-2 sm:py-2.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300 text-[11px] sm:text-xs font-bold rounded-full transition-all flex items-center justify-center gap-1.5 focus:outline-none cursor-pointer"
                        >
                          <ArrowLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Back to Online Payment
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
      {/* Available Coupon Modal */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showCouponModal && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowCouponModal(false)}
                className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm z-[210]"
              />

              {/* Modal Container */}
              <div className="fixed inset-0 flex items-center justify-center z-[211] p-4 pointer-events-none">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  transition={{ type: "spring", duration: 0.5 }}
                  className="w-full max-w-[360px] max-h-[92vh] overflow-y-auto bg-white rounded-3xl shadow-[0_24px_48px_rgba(0,0,0,0.16)] p-6 relative pointer-events-auto border border-slate-100"
                >
                  {/* Center Top Overlapping Close Button */}
                  <button
                    type="button"
                    onClick={() => setShowCouponModal(false)}
                    className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:bg-slate-50 transition-colors border border-slate-100 cursor-pointer focus:outline-none"
                  >
                    <X className="w-4 h-4 text-slate-500" />
                  </button>

                  {/* Title & Subtitle */}
                  <div className="text-center mb-5 mt-2">
                    <h2 className="text-lg font-bold text-[#0F172A] mb-1">Available Coupon</h2>
                    <p className="text-[11px] text-[#64748B] font-medium">Note: Cash-back amount will expire in 30 days.</p>
                  </div>

                  <div className="h-[1px] bg-slate-100 mb-4" />

                  {/* Input box showing tempCouponCode and Apply button */}
                  <div className="border border-slate-200/80 rounded-xl px-4 py-2.5 flex items-center justify-between bg-white mb-5 hover:border-slate-300 transition-colors">
                    <input
                      type="text"
                      placeholder="Enter Coupon Code"
                      value={tempCouponCode}
                      onChange={(e) => setTempCouponCode(e.target.value.toUpperCase())}
                      className="bg-transparent focus:outline-none text-xs font-bold text-[#0F172A] placeholder:text-[#94A3B8] w-full mr-2 uppercase"
                    />
                    <button 
                      type="button"
                      onClick={() => {
                        if (tempCouponCode.trim()) {
                          setCouponCode(tempCouponCode);
                          showToast(`Coupon "${tempCouponCode}" applied successfully!`);
                          setShowCouponModal(false);
                        } else {
                          showToast('Please enter a coupon code.');
                        }
                      }}
                      className="text-xs font-bold text-[#00A86B] hover:text-[#009B63] transition-colors shrink-0 focus:outline-none"
                    >
                      Apply
                    </button>
                  </div>

                  {/* Available Coupons Header */}
                  <div className="text-center mb-3">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Available Coupons</span>
                  </div>

                  {/* List of Coupon Rows */}
                  <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                    {[
                      { code: 'SHIPFIRST25', desc: 'Save ₹25 using this code', actionText: 'Apply Code' },
                      { code: 'FREESHIP100', desc: 'Free shipping on orders over ₹1000', actionText: 'Apply Code' },
                      { code: 'WELCOME50', desc: 'Get ₹50 off on your first purchase', actionText: 'Apply Code' },
                      { code: 'BUY2GET1', desc: 'Buy 2 items, get 1 free', actionText: 'Apply Offer' }
                    ].map((coupon) => {
                      const isApplied = couponCode === coupon.code;
                      return (
                        <div 
                          key={coupon.code}
                          className={`border rounded-xl px-4 py-3 flex items-center justify-between transition-all ${
                            isApplied 
                              ? 'border-[#00A86B] bg-[#00A86B]/5 shadow-[0_2px_8px_rgba(0,168,107,0.05)]' 
                              : 'border-slate-100 hover:border-slate-200 bg-[#F8FAFC]/40'
                          }`}
                        >
                          <div className="flex flex-col text-left mr-3">
                            <span className="text-xs font-bold text-[#0F172A] tracking-tight">{coupon.code}</span>
                            <span className="text-[10px] text-[#64748B] font-medium mt-0.5">{coupon.desc}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (isApplied) {
                                setCouponCode('');
                                showToast('Coupon removed.');
                              } else {
                                setCouponCode(coupon.code);
                                showToast(`Coupon "${coupon.code}" applied successfully!`);
                                setShowCouponModal(false);
                              }
                            }}
                            className={`text-[10px] font-bold shrink-0 transition-colors focus:outline-none ${
                              isApplied 
                                ? 'text-[#00A86B]' 
                                : 'text-slate-500 hover:text-[#00A86B]'
                            }`}
                          >
                            {isApplied ? 'Applied' : coupon.actionText}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
      </header>

      {/* Bulk Import Modal */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showBulkModal && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setShowBulkModal(false); setBulkFile(null); setBulkStep(1); }} className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm z-[200]" />
              <div className="fixed inset-0 flex items-center justify-center z-[201] p-4 pointer-events-none">
                <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', duration: 0.4 }} className="w-full max-w-[380px] bg-white rounded-2xl shadow-[0_24px_48px_rgba(0,0,0,0.16)] p-6 relative pointer-events-auto border border-slate-100">
                  <button onClick={() => { setShowBulkModal(false); setBulkFile(null); setBulkStep(1); }} className="absolute top-4 right-4 w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center transition-colors focus:outline-none">
                    <X className="w-4 h-4 text-slate-500" />
                  </button>

                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-full bg-[#FFF7ED] flex items-center justify-center shrink-0">
                      <Upload className="w-5 h-5 text-[#F97316]" />
                    </div>
                    <div>
                      <h2 className="text-[15px] font-bold text-[#0F172A]">Bulk Import Orders</h2>
                      <p className="text-[11px] text-[#64748B] font-medium">{bulkStep === 1 ? 'Step 1: Select order type' : `Step 2: Upload ${bulkOrderType} file`}</p>
                    </div>
                  </div>

                  <div className="h-[1px] bg-slate-100 mb-5" />

                  {bulkStep === 1 ? (
                    <div className="flex flex-col gap-3">
                      <p className="text-[12px] font-semibold text-[#64748B] mb-1">Select Order Type</p>
                      <button onClick={() => { setBulkOrderType('B2C'); setBulkStep(2); }} className="flex items-center gap-3 p-4 rounded-xl border-2 border-[#E2E8F0] hover:border-[#00A86B] hover:bg-[#F0FDF4] transition-all text-left group">
                        <div className="w-9 h-9 rounded-full bg-[#EFF6FF] flex items-center justify-center shrink-0 group-hover:bg-[#DCFCE7] transition-colors"><Upload className="w-4 h-4 text-[#3B82F6] group-hover:text-[#00A86B]" /></div>
                        <div><p className="text-[13px] font-bold text-[#0F172A]">B2C Order</p><p className="text-[11px] text-[#64748B]">Business to Consumer shipments</p></div>
                      </button>
                      <button onClick={() => { setBulkOrderType('B2B'); setBulkStep(2); }} className="flex items-center gap-3 p-4 rounded-xl border-2 border-[#E2E8F0] hover:border-[#00A86B] hover:bg-[#F0FDF4] transition-all text-left group">
                        <div className="w-9 h-9 rounded-full bg-[#FFF7ED] flex items-center justify-center shrink-0 group-hover:bg-[#DCFCE7] transition-colors"><Upload className="w-4 h-4 text-[#F97316] group-hover:text-[#00A86B]" /></div>
                        <div><p className="text-[13px] font-bold text-[#0F172A]">B2B Order</p><p className="text-[11px] text-[#64748B]">Business to Business shipments</p></div>
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <button onClick={() => setBulkStep(1)} className="flex items-center gap-1.5 text-[12px] font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors self-start">
                        <ArrowLeft className="w-3.5 h-3.5" /> Back
                      </button>
                      <input ref={bulkFileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => setBulkFile(e.target.files?.[0] || null)} />
                      <div onClick={() => bulkFileInputRef.current?.click()} className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${bulkFile ? 'border-[#00A86B] bg-[#F0FDF4]' : 'border-[#E2E8F0] hover:border-[#00A86B] hover:bg-[#F8FAFC]'}`}>
                        <Upload className={`w-8 h-8 mx-auto mb-2 ${bulkFile ? 'text-[#00A86B]' : 'text-[#CBD5E1]'}`} />
                        {bulkFile ? (
                          <><p className="text-[13px] font-bold text-[#00A86B]">{bulkFile.name}</p><p className="text-[11px] text-[#64748B] mt-0.5">{(bulkFile.size / 1024).toFixed(1)} KB</p></>
                        ) : (
                          <><p className="text-[13px] font-semibold text-[#475569]">Click to upload file</p><p className="text-[11px] text-[#94A3B8] mt-0.5">Supported: .xlsx, .xls, .csv</p></>
                        )}
                      </div>
                      <button onClick={handleBulkUpload} disabled={!bulkFile || bulkUploading} className="w-full py-3 bg-gradient-to-r from-[#00b876] to-[#00A86B] text-white text-sm font-bold rounded-xl shadow-sm hover:from-[#00c982] hover:to-[#00b876] transition-all disabled:opacity-50 disabled:pointer-events-none focus:outline-none">
                        {bulkUploading ? 'Uploading…' : 'Upload & Import'}
                      </button>
                    </div>
                  )}
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* User Login (Impersonation) Modal */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showUserLoginModal && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setShowUserLoginModal(false); setUserLoginQuery(''); setUserSuggestions([]); }} className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm z-[200]" />
              <div className="fixed inset-0 flex items-center justify-center z-[201] p-4 pointer-events-none">
                <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', duration: 0.4 }} className="w-full max-w-[420px] bg-white rounded-2xl shadow-[0_24px_48px_rgba(0,0,0,0.16)] p-6 relative pointer-events-auto border border-slate-100">
                  <button onClick={() => { setShowUserLoginModal(false); setUserLoginQuery(''); setUserSuggestions([]); }} className="absolute top-4 right-4 w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center transition-colors focus:outline-none">
                    <X className="w-4 h-4 text-slate-500" />
                  </button>

                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-full bg-[#F5F3FF] flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5 text-[#8B5CF6]" />
                    </div>
                    <div>
                      <h2 className="text-[15px] font-bold text-[#0F172A]">Login as User</h2>
                      <p className="text-[11px] text-[#64748B] font-medium">Admin access — no password required</p>
                    </div>
                  </div>

                  <div className="h-[1px] bg-slate-100 mb-4" />

                  <div className="relative">
                    <div className="flex items-center gap-2 border border-[#E2E8F0] rounded-xl px-3 py-2.5 bg-[#F8FAFC] focus-within:border-[#8B5CF6] focus-within:bg-white transition-all">
                      <Search className="w-4 h-4 text-[#94A3B8] shrink-0" />
                      <input
                        autoFocus
                        type="text"
                        placeholder="Search by name, email, phone or company…"
                        value={userLoginQuery}
                        onChange={e => setUserLoginQuery(e.target.value)}
                        className="w-full bg-transparent text-[13px] font-medium text-[#0F172A] outline-none placeholder:text-[#94A3B8]"
                      />
                      {userLoginSearching && <div className="w-4 h-4 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin shrink-0" />}
                      {userLoginQuery && !userLoginSearching && (
                        <button onClick={() => { setUserLoginQuery(''); setUserSuggestions([]); }} className="text-[#94A3B8] hover:text-[#64748B] shrink-0 text-[12px] focus:outline-none">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {userSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-[#E2E8F0] rounded-xl shadow-lg z-50 overflow-y-auto max-h-[280px]">
                        {userSuggestions.map((u) => (
                          <button
                            key={u.id}
                            disabled={userLoginLoading}
                            onClick={() => handleAdminLoginAsUser(u)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F5F3FF] transition-colors text-left border-b border-[#F1F5F9] last:border-0 disabled:opacity-60 focus:outline-none"
                          >
                            <div className="w-8 h-8 rounded-full bg-[#8B5CF6] text-white text-[12px] font-bold flex items-center justify-center shrink-0">
                              {u.fullname?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-bold text-[#0F172A] truncate">{u.fullname || '—'}</p>
                              <p className="text-[11px] text-[#64748B] truncate">{u.email}</p>
                            </div>
                            {userLoginLoading && <div className="w-3.5 h-3.5 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin shrink-0" />}
                          </button>
                        ))}
                      </div>
                    )}

                    {userLoginQuery.trim() && !userLoginSearching && userSuggestions.length === 0 && (
                      <div className="mt-4 text-center py-6">
                        <p className="text-[13px] font-semibold text-[#94A3B8]">No users found</p>
                        <p className="text-[11px] text-[#CBD5E1] mt-1">Try a different name, email or phone</p>
                      </div>
                    )}

                    {!userLoginQuery.trim() && (
                      <p className="mt-3 text-[11px] text-[#94A3B8] text-center">Type to search for a user to log in as</p>
                    )}
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
