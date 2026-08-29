import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, LogOut, Bell, User, Building2, Calendar, ChevronDown, Shield, Zap, Calculator, PackagePlus, Wallet, Check, X, Menu, Upload, Users, Package, UploadCloud, Loader2 } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { apiClient } from '../../../services/apiClient';
import { getToken, setToken } from '../../../utils/session';
import { useAdminTab } from '../../../context/AdminUserContext';
import { useDashboardFilters } from '../../../context/DashboardFilterContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BulkUploadModal } from '../../ui/BulkUploadModal';
import { RechargeWalletModal } from '../../ui/RechargeWalletModal';
import { Toast } from '../../ui/Toast';
import { useToast } from '../../../hooks/useToast';
import { useNotificationList } from '../../../context/NotificationListContext';
import { JobDetailModal } from '../notifications/JobDetailModal';
import { NotificationHistoryModal } from '../notifications/NotificationHistoryModal';

interface AdminHeaderProps {
  onMobileMenuToggle?: () => void;
}

export function AdminHeader({ onMobileMenuToggle }: AdminHeaderProps) {
  const { logout } = useAuth();
  const { isAdmin, adminTab, toggleAdminTab, userName, userEmail, businessName, profileImage, walletBalance: ctxWalletBalance, walletHold, creditLimit, isEmployee, parentEmail, currentUserId } = useAdminTab();
  const { filters, updateFilter } = useDashboardFilters();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const { notifications, dismiss } = useNotificationList();
  const [openNotificationId, setOpenNotificationId] = useState<string | null>(null);
  const [showNotificationHistory, setShowNotificationHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderSearchResults, setOrderSearchResults] = useState<any[]>([]);
  const [orderSearchLoading, setOrderSearchLoading] = useState(false);
  const [showOrderSearchResults, setShowOrderSearchResults] = useState(false);
  const orderSearchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const { toast, showToast: _showToast, closeToast } = useToast();
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  // Local copy of wallet balance so recharge modal can update it optimistically
  const [walletBalance, setWalletBalance] = useState(0);
  const [showWalletHover, setShowWalletHover] = useState(false);
  const [showMobileWalletSummary, setShowMobileWalletSummary] = useState(false);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  // Bulk Import modal
  const [showBulkModal, setShowBulkModal] = useState(false);

  // User Login (impersonation) modal
  const [showUserLoginModal, setShowUserLoginModal] = useState(false);
  const [userLoginQuery, setUserLoginQuery] = useState('');
  const [userSuggestions, setUserSuggestions] = useState<any[]>([]);
  const [userLoginSearching, setUserLoginSearching] = useState(false);
  const [userLoginLoading, setUserLoginLoading] = useState(false);

  // Pending agreement for notification bell
  const [pendingAgreement, setPendingAgreement] = useState<any>(null);

  // Mobile — Notifications/Quick Actions share one icon slot (space is tight on small
  // screens); the icon rolls between Bell and Zap every 5s so both stay discoverable.
  // Tapping always opens whichever panel is currently showing, so it's never ambiguous.
  // Paused while either panel is open so the icon never rolls out from under an open menu.
  const [mobileIconRoll, setMobileIconRoll] = useState<'bell' | 'zap'>('bell');
  useEffect(() => {
    if (showNotifications || showQuickActions) return;
    const interval = setInterval(() => {
      setMobileIconRoll((v) => (v === 'bell' ? 'zap' : 'bell'));
    }, 5000);
    return () => clearInterval(interval);
  }, [showNotifications, showQuickActions]);

  // Sync real wallet balance from context on load (and whenever context updates)
  React.useEffect(() => { setWalletBalance(ctxWalletBalance); }, [ctxWalletBalance]);

  // Fetch pending agreement for notification bell (users only — including admin in user mode)
  useEffect(() => {
    if (isAdmin && adminTab) return;
    apiClient.get('/agreement/user/pending')
      .then(res => {
        if (res.data?.success && res.data?.hasPending) {
          setPendingAgreement(res.data.agreement);
        } else {
          setPendingAgreement(null);
        }
      })
      .catch(() => {});
  }, [isAdmin, adminTab]);

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
        setToken(res.data.token);
        window.location.href = '/user/dashboard';
      }
    } catch (e) {
      console.error('adminLoginAsUser error:', e);
      showToast('Failed to login as user.');
    } finally {
      setUserLoginLoading(false);
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

  const showToast = (message: string) => _showToast('success', message);

  const isImpersonating = !!localStorage.getItem('admin_token_backup');

  const handleReturnToAdmin = () => {
    const backup = localStorage.getItem('admin_token_backup');
    if (backup) {
      setToken(backup);
      localStorage.removeItem('admin_token_backup');
      window.location.href = '/admin/dashboard';
    }
  };

  const location = useLocation();
  const navigate = useNavigate();

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
    '/admin/notification',
    '/admin/couriers',
    '/admin/rate-card',
    '/internal-crm'
  ].some((path) => location.pathname === path || location.pathname.startsWith(path + '/'));

  // KYC is a self-contained onboarding flow — the page-context search/date/quick-action tools don't apply there.
  const isKycPage = location.pathname === '/admin/kyc' || location.pathname.startsWith('/admin/kyc/');

  // Mobile navbar search icon/bar is dashboard-only — every other page hides it.
  const isDashboardPage = location.pathname === '/admin/dashboard' || location.pathname === '/user/dashboard';

  // Pages (both /admin/* and /user/*) that either have their own in-page date
  // filter or don't need one at all — the navbar date filter is dashboard-only.
  // Deliberately separate from isSetupPage/isKycPage so it doesn't also hide
  // Quick Actions or the global search, which should stay available everywhere.
  const isDateFilterHiddenPage = [
    '/admin/orders', '/user/orders',
    '/admin/ndr', '/user/ndr',
    '/admin/wallet', '/user/wallet',
    '/admin/cod', '/user/cod',
    '/admin/reports', '/user/reports',
    '/admin/weight-discrepancy', '/user/weight-discrepancy',
    '/admin/notification', '/user/notification',
    '/admin/rate-calculator', '/user/rate-calculator',
    '/admin/kyc', '/user/kyc',
    '/admin/settings', '/user/settings',
    '/admin/referral', '/user/referral',
    '/internal-crm',
    '/admin/performance',
    '/admin/announcement',
    '/admin/agreement',
    '/admin/epd-mapping',
    '/admin/edd-mapping',
    '/admin/users',
    '/admin/status-map',
    '/admin/couriers',
    '/admin/rate-card',
    '/admin/support', '/user/support',
    '/admin/add-order', '/user/add-order',
    '/admin/profile', '/user/profile',
    '/user/courier-setup',
    '/user/channels',
  ].some((path) => location.pathname === path || location.pathname.startsWith(path + '/'));

  // ─── Global navbar search — always searches Orders, regardless of the current page ──
  // The "Search by" behavior never changes; only the placeholder hint cycles through
  // the fields it matches against, so the user always knows what they can type.
  const ORDER_SEARCH_FIELDS = [
    'receiver email',
    'receiver mobile',
    'courier service name',
    'order ID',
    'AWB number',
    'pickup name',
    'pickup mobile',
    'pickup email',
  ];
  // "Search by " is always a fixed, unchanging prefix — only the field name after it rolls/cycles,
  // sliding vertically into place (like an odometer) rather than typing letter-by-letter.
  const SEARCH_BY_PREFIX = 'Search by ';
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    if (searchQuery) return; // don't roll while the user is actively typing
    const interval = setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % ORDER_SEARCH_FIELDS.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [searchQuery]);

  // Debounced live search against Orders — fires from any page, never just Orders itself.
  useEffect(() => {
    if (!searchQuery.trim()) {
      setOrderSearchResults([]);
      setOrderSearchLoading(false);
      return;
    }
    setOrderSearchLoading(true);
    const timer = setTimeout(async () => {
      try {
        const isAdminView = isAdmin && adminTab && !isEmployee;
        const params: Record<string, any> = { page: 1, limit: 8, searchQuery: searchQuery.trim() };
        if (!isAdminView && currentUserId) params.userId = currentUserId;
        const res = await apiClient.get('/admin/filterEmployeeOrders', { params });
        setOrderSearchResults(res.data?.orders || []);
      } catch {
        setOrderSearchResults([]);
      } finally {
        setOrderSearchLoading(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery, isAdmin, adminTab, isEmployee, currentUserId]);

  // Close the results dropdown on outside click. Checks both the desktop search box
  // and the mobile search bar/results container — without the mobile ref, any tap on
  // mobile (including on a result row) reads as "outside" the desktop-only ref and
  // closes the dropdown on mousedown, before the row's own onClick ever fires.
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideDesktop = orderSearchRef.current?.contains(target);
      const insideMobile = mobileSearchRef.current?.contains(target);
      if (!insideDesktop && !insideMobile) {
        setShowOrderSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const goToOrder = (order: any) => {
    setShowOrderSearchResults(false);
    setSearchQuery('');
    const panel = location.pathname.startsWith('/user/') ? '/user' : '/admin';
    navigate(`${panel}/order-tracking?id=${encodeURIComponent(String(order._id))}`);
  };

  const dropdownVariants: any = {
    hidden: { opacity: 0, scale: 0.95, y: 10 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring" as const, stiffness: 400, damping: 30 } },
    exit: { opacity: 0, scale: 0.95, y: 10, transition: { duration: 0.2 } }
  };

  return (
    <>
      {/* Impersonation Banner */}
      {isImpersonating && (
        <div className="fixed top-0 left-0 right-0 z-[1000] bg-gradient-to-r from-orange-600 to-orange-500 text-white h-8 px-4 shadow-md flex items-center justify-center gap-3">
          <Shield className="w-3.5 h-3.5 animate-pulse" />
          <span className="text-[11px] font-semibold tracking-wide uppercase">Impersonation Mode Active</span>
          <button
            onClick={handleReturnToAdmin}
            className="ml-2 flex items-center gap-1.5 bg-white/20 hover:bg-white/30 rounded-full px-3 py-0.5 text-[11px] font-semibold transition-colors"
          >
            <LogOut className="w-3 h-3" />
            Return to Admin
          </button>
        </div>
      )}

      {/* Mobile Top Bar — visible only on mobile */}
      <div ref={mobileSearchRef} className={`md:hidden bg-white border-b border-[#E2E8F0] sticky ${isImpersonating ? 'top-8' : 'top-0'} z-[100] shadow-sm overflow-hidden`}>

        <AnimatePresence mode="wait" initial={false}>
        {/* Normal mode — hamburger + logo + icon strip */}
        {!showMobileSearch && (
          <motion.div
            key="normal-bar"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="w-full flex items-center gap-1 pl-1 pr-2 h-[60px]">
            {/* Left: hamburger */}
            <div className="flex items-center shrink-0">
              <button
                onClick={onMobileMenuToggle}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-[#475569] hover:bg-[#F8FAFC] transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>

            {/* Search chip — grows to fill the space between the hamburger and the icon cluster,
                capped so it never crowds out the wallet/profile; same rolling placeholder as
                desktop, tap to expand into full search mode */}
            <button
              onClick={() => {
                setShowMobileSearch(true);
                setSearchQuery('');
                setShowOrderSearchResults(false);
                setShowNotifications(false);
                setShowQuickActions(false);
                setShowProfileMenu(false);
                setShowMobileWalletSummary(false);
                setShowDateDropdown(false);
              }}
              className="flex items-center gap-1.5 h-8 flex-1 min-w-0 pl-2.5 pr-2.5 rounded-full border border-[#E2E8F0] bg-[#F8FAFC] text-[#94A3B8] hover:border-[#CBD5E1] transition-colors"
            >
              <Search className="w-3.5 h-3.5 shrink-0" />
              <span className="relative flex-1 min-w-0 h-4 overflow-hidden text-[11px] font-medium leading-4 whitespace-nowrap text-left">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={placeholderIndex}
                    initial={{ y: 16, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -16, opacity: 0 }}
                    transition={{ duration: 0.35, ease: 'easeInOut' }}
                    className="block truncate"
                  >
                    {ORDER_SEARCH_FIELDS[placeholderIndex]}
                  </motion.span>
                </AnimatePresence>
              </span>
            </button>

            <div className="flex items-center gap-1 shrink-0">
              {/* Notifications + Quick Actions — merged into one rolling icon slot on the user
                  side (both non-admin and non-employee) to save space for the profile icon;
                  admin-only and employee-only cases keep a single dedicated icon, no roll. */}
              {(() => {
                const showsNotifications = !(isAdmin && adminTab);
                const showsQuickActions = !isEmployee;
                const isMerged = showsNotifications && showsQuickActions;
                const activeIcon: 'bell' | 'zap' = isMerged ? mobileIconRoll : (showsNotifications ? 'bell' : 'zap');
                if (!showsNotifications && !showsQuickActions) return null;

                const isOpen = activeIcon === 'bell' ? showNotifications : showQuickActions;
                const handleToggle = () => {
                  if (activeIcon === 'bell') {
                    setShowNotifications(!showNotifications);
                    setShowQuickActions(false);
                  } else {
                    setShowQuickActions(!showQuickActions);
                    setShowNotifications(false);
                  }
                  setShowProfileMenu(false);
                  setShowMobileWalletSummary(false);
                  setShowDateDropdown(false);
                };

                return (
                  <div className="relative shrink-0">
                    <button
                      onClick={handleToggle}
                      className={`w-8 h-8 flex items-center justify-center rounded-full text-[#64748B] hover:bg-[#F8FAFC] transition-colors relative cursor-pointer overflow-hidden ${isOpen ? 'bg-[#F8FAFC] text-[#0F172A]' : ''}`}
                    >
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.span
                          key={activeIcon}
                          initial={{ y: 14, opacity: 0, rotate: -8 }}
                          animate={{ y: 0, opacity: 1, rotate: 0 }}
                          exit={{ y: -14, opacity: 0, rotate: 8 }}
                          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                          className="flex items-center justify-center"
                        >
                          {activeIcon === 'bell'
                            ? <Bell className="w-[18px] h-[18px]" />
                            : <Zap className="w-[18px] h-[18px]" />
                          }
                        </motion.span>
                      </AnimatePresence>
                      {activeIcon === 'bell' && (pendingAgreement || notifications.length > 0) && (
                        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#EF4444] rounded-full" />
                      )}
                    </button>

                    {showNotifications && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                        <div className={`fixed right-3 ${isImpersonating ? 'top-[96px]' : 'top-[64px]'} w-56 max-w-[calc(100vw-24px)] bg-white rounded-xl shadow-xl border border-[#E2E8F0] overflow-hidden z-50 origin-top-right`}>
                          <div className="px-2.5 py-1.5 border-b border-[#E2E8F0] flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-[#0F172A] text-[10px] uppercase tracking-wider">Notifications</h3>
                            {((pendingAgreement ? 1 : 0) + notifications.length) > 0 && (
                              <span className="text-[8.5px] font-bold text-white bg-[#EF4444] rounded-full px-1.5 py-0.5">
                                {(pendingAgreement ? 1 : 0) + notifications.length}
                              </span>
                            )}
                          </div>
                          <div className="max-h-[160px] overflow-y-auto">
                            {pendingAgreement && (
                              <div className="px-2.5 py-2 border-b border-[#E2E8F0]/60">
                                <div className="flex items-start gap-1.5">
                                  <div className="w-1.5 h-1.5 rounded-full bg-[#EF4444] shrink-0 mt-1" />
                                  <div className="flex-1">
                                    <p className="text-[10.5px] font-semibold text-[#0F172A] leading-snug">Agreement Pending</p>
                                    <p className="text-[9.5px] text-[#64748B] mt-0.5 leading-snug">{pendingAgreement.versionName || 'New Terms & Conditions'} — please review and accept.</p>
                                    <button
                                      onClick={() => { navigate('/user/settings/agreement'); setShowNotifications(false); }}
                                      className="mt-1 text-[9.5px] font-bold text-[#00A86B] hover:underline"
                                    >
                                      View &amp; Accept →
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {notifications.map((n) => {
                              const ref: any = n.refId;
                              const isBulkShip = n.refModel === 'BulkShipJob';
                              const isRunning = isBulkShip && ref?.status === 'running';
                              let summary = '';
                              if (ref) {
                                if (isBulkShip) {
                                  const done = (ref.successCount || 0) + (ref.failureCount || 0);
                                  summary = isRunning
                                    ? `Processing… ${done}/${ref.totalOrders}`
                                    : `${ref.successCount || 0} succeeded, ${ref.failureCount || 0} failed`;
                                } else {
                                  summary = `${ref.successfullyUploaded || 0}/${ref.noOfOrders || 0} rows uploaded${ref.errorOrders ? `, ${ref.errorOrders} failed` : ''}`;
                                }
                              }
                              return (
                                <div
                                  key={n._id}
                                  onClick={() => { setShowNotifications(false); setOpenNotificationId(n._id); }}
                                  className="px-2.5 py-2 border-b border-[#E2E8F0]/60 flex items-start gap-1.5 cursor-pointer hover:bg-slate-50"
                                >
                                  {isRunning ? (
                                    <Loader2 className="w-3 h-3 text-[#00A86B] animate-spin shrink-0 mt-0.5" />
                                  ) : isBulkShip ? (
                                    <Package className="w-3 h-3 text-[#00A86B] shrink-0 mt-0.5" />
                                  ) : (
                                    <UploadCloud className="w-3 h-3 text-[#00A86B] shrink-0 mt-0.5" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[10.5px] font-semibold text-[#0F172A] leading-snug truncate">{n.title}</p>
                                    <p className="text-[9.5px] text-[#64748B] mt-0.5 leading-snug">{summary}</p>
                                  </div>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); dismiss(n._id); }}
                                    className="p-0.5 text-[#CBD5E1] hover:text-red-500 shrink-0"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              );
                            })}

                            {!pendingAgreement && notifications.length === 0 && (
                              <div className="px-2.5 py-3.5 text-center">
                                <Bell className="w-4.5 h-4.5 text-[#CBD5E1] mx-auto mb-1.5" />
                                <p className="text-[10px] font-semibold text-[#94A3B8]">No new notifications</p>
                              </div>
                            )}
                          </div>
                          <div
                            className="px-2.5 py-1.5 border-t border-[#E2E8F0] bg-[#F8FAFC] text-center cursor-pointer hover:bg-[#F1F5F9] transition-colors"
                            onClick={() => { setShowNotifications(false); setShowNotificationHistory(true); }}
                          >
                            <span className="text-[9.5px] font-bold text-[#0F172A]">View All Notifications</span>
                          </div>
                        </div>
                      </>
                    )}

                    {showQuickActions && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowQuickActions(false)} />
                        <div className={`fixed right-3 ${isImpersonating ? 'top-[96px]' : 'top-[64px]'} w-48 max-w-[calc(100vw-24px)] bg-white rounded-xl shadow-xl border border-[#E2E8F0] py-2 z-50 origin-top-right`}>
                          <div className="px-4 py-1.5 border-b border-slate-100 mb-1">
                            <span className="text-[10px] font-bold text-[#94A3B8] uppercase">Quick Menu</span>
                          </div>
                          {isAdmin && adminTab ? (
                            <button className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] text-left w-full" onClick={() => { setShowUserLoginModal(true); setUserLoginQuery(''); setUserSuggestions([]); setShowQuickActions(false); }}>
                              <Users className="w-3.5 h-3.5" /> User Login
                            </button>
                          ) : (
                            <>
                              <Link to="/user/add-order" className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]" onClick={() => setShowQuickActions(false)}>
                                <PackagePlus className="w-3.5 h-3.5" /> Add an Order
                              </Link>
                              <button className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] text-left w-full" onClick={() => { setShowBulkModal(true); setShowQuickActions(false); }}>
                                <Upload className="w-3.5 h-3.5" /> Bulk Import
                              </button>
                              <Link to="/user/rate-calculator" className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]" onClick={() => setShowQuickActions(false)}>
                                <Calculator className="w-3.5 h-3.5" /> Calculate Rate
                              </Link>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })()}

              {/* Wallet Balance */}
              <div className="relative shrink-0">
                <div
                  className={`flex items-center gap-1.5 shrink-0 whitespace-nowrap text-white pl-3 pr-1.5 py-2 rounded-full text-[12px] font-bold shadow-sm transition-all duration-200 ${walletBalance < 0 ? 'bg-[#EF4444]' : 'bg-[#00A86B]'} ${showMobileWalletSummary ? 'scale-105' : ''}`}
                >
                  <button
                    onClick={() => {
                      setShowMobileWalletSummary(!showMobileWalletSummary);
                      setShowNotifications(false);
                      setShowQuickActions(false);
                      setShowProfileMenu(false);
                      setShowDateDropdown(false);
                    }}
                    className="flex items-center gap-1.5 focus:outline-none cursor-pointer"
                  >
                    <Wallet className="w-4 h-4 shrink-0" />
                    <span>₹{walletBalance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                  </button>
                  <button
                    onClick={() => setShowRechargeModal(true)}
                    className="text-white/80 hover:text-white px-1.5 focus:outline-none cursor-pointer"
                    aria-label="Recharge wallet"
                  >
                    +
                  </button>
                </div>

                {showMobileWalletSummary && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowMobileWalletSummary(false)} />
                    <div className={`fixed right-3 ${isImpersonating ? 'top-[96px]' : 'top-[64px]'} w-64 max-w-[calc(100vw-24px)] bg-white rounded-2xl shadow-xl border border-[#E2E8F0] p-4 z-50 origin-top-right`}>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Wallet Summary</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00A86B] animate-pulse shrink-0"></span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-[13px] font-semibold text-[#64748B]">Available</span>
                          <span className="text-[13px] font-bold text-slate-800">₹{walletBalance.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-[13px] font-semibold text-[#64748B]">Hold</span>
                          <span className="text-[13px] font-bold text-amber-600">₹{walletHold.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-[13px] font-semibold text-[#64748B]">Credit Limit</span>
                          <span className="text-[13px] font-bold text-violet-600">₹{creditLimit.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="h-[1px] bg-slate-100"></div>
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-[13px] font-bold text-slate-700">Net</span>
                          <span className="text-[13px] font-extrabold text-[#00A86B]">₹{Math.max(0, walletBalance - walletHold).toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Profile Dropdown */}
              <div className="relative shrink-0">
                <button
                  onClick={() => {
                    setShowProfileMenu(!showProfileMenu);
                    setShowNotifications(false);
                    setShowQuickActions(false);
                    setShowMobileWalletSummary(false);
                    setShowDateDropdown(false);
                  }}
                  className="w-8 h-8 rounded-full bg-[#E2E8F0] overflow-hidden flex items-center justify-center focus:outline-none border border-[#CBD5E1] shrink-0"
                >
                  {profileImage ? (
                    <img src={profileImage} alt={userName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#1E293B] to-[#0F172A] flex items-center justify-center text-white text-[11px] font-bold">
                      {userInitials}
                    </div>
                  )}
                </button>

                {showProfileMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                    <div className={`fixed right-3 ${isImpersonating ? 'top-[96px]' : 'top-[64px]'} w-56 max-w-[calc(100vw-24px)] bg-white rounded-xl shadow-xl border border-[#E2E8F0] py-2 z-50 origin-top-right`}>
                      <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/50">
                        {isEmployee ? (
                          <>
                            <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-0.5">Employee Login</p>
                            <p className="text-[12px] font-bold text-[#0F172A] truncate">{userEmail || '—'}</p>
                            {parentEmail && <p className="text-[10px] text-[#64748B] mt-0.5 truncate">Account: {parentEmail}</p>}
                          </>
                        ) : (
                          <>
                            <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-0.5">Signed in as</p>
                            <p className="text-[12px] font-bold text-[#0F172A] truncate">{userEmail || '—'}</p>
                          </>
                        )}
                      </div>
                      {!isEmployee && (
                        <Link
                          to={(isAdmin && adminTab) ? '/admin/profile' : '/user/profile'}
                          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
                          onClick={() => setTimeout(() => setShowProfileMenu(false), 0)}
                        >
                          <User className="w-3.5 h-3.5" /> My Profile
                        </Link>
                      )}
                      {isAdmin && !isEmployee && (
                        <>
                          <div className="border-t border-[#E2E8F0] my-1" />
                          <div className="flex items-center justify-between px-4 py-2">
                            <div className="flex items-center gap-2 text-[#475569]">
                              <Shield className="w-3.5 h-3.5 text-[#00A86B]" />
                              <span className="text-[12px] font-semibold">{adminTab ? 'Admin' : 'User'} Mode</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" className="sr-only peer" checked={adminTab} onChange={(e) => toggleAdminTab(e.target.checked)} />
                              <div className="w-10 h-5 bg-gray-300 rounded-full peer peer-checked:bg-[#00A86B] transition-colors duration-300" />
                              <div className="absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform duration-300 peer-checked:translate-x-5" />
                            </label>
                          </div>
                        </>
                      )}
                      <div className="border-t border-[#E2E8F0] my-1" />
                      <button
                        onClick={() => { logout(); setShowProfileMenu(false); }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 text-left"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Search mode — full-width input with Cancel, expands over and covers the normal top bar */}
        {showMobileSearch && (
          <motion.div
            key="search-bar"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-2.5 px-4 h-[60px]"
          >
            <motion.div
              initial={{ scaleX: 0.85 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              style={{ originX: 0 }}
              className="flex-1 flex items-center gap-2 h-10 bg-[#F8FAFC] rounded-full px-3.5 border border-[#E2E8F0] focus-within:border-[#00A86B] focus-within:ring-4 focus-within:ring-[#00A86B]/10 focus-within:bg-white transition-all min-w-0"
            >
              <Search className="w-[17px] h-[17px] text-[#94A3B8] shrink-0" />
              <input
                autoFocus
                type="text"
                name="order-search"
                autoComplete="off"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowOrderSearchResults(true); }}
                onFocus={() => { if (searchQuery.trim()) setShowOrderSearchResults(true); }}
                placeholder="Search by AWB, order ID, customer…"
                className="flex-1 min-w-0 bg-transparent text-[13.5px] font-medium text-[#0F172A] outline-none placeholder:text-[#94A3B8]"
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(''); setShowOrderSearchResults(false); }} className="shrink-0 focus:outline-none">
                  <X className="w-4 h-4 text-[#94A3B8] hover:text-[#64748B]" />
                </button>
              )}
            </motion.div>
            <button
              onClick={() => { setShowMobileSearch(false); setSearchQuery(''); setShowOrderSearchResults(false); }}
              className="shrink-0 text-[13px] font-semibold text-[#00A86B] px-1 focus:outline-none"
            >
              Cancel
            </button>
          </motion.div>
        )}
        </AnimatePresence>

        {/* Mobile search results panel */}
        {showMobileSearch && showOrderSearchResults && searchQuery.trim() && (
          <>
            <div className="fixed inset-0 z-[89]" style={{ top: isImpersonating ? 92 : 60 }} onClick={() => setShowOrderSearchResults(false)} />
            <div className={`fixed left-0 right-0 ${isImpersonating ? 'top-[92px]' : 'top-[60px]'} max-h-[60vh] overflow-y-auto bg-white border-b border-[#E2E8F0] shadow-2xl z-[90]`}>
              {orderSearchLoading ? (
                <div className="px-4 py-6 flex items-center justify-center gap-2 text-[#94A3B8]">
                  <div className="w-4 h-4 border-2 border-[#00A86B] border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-semibold">Searching orders…</span>
                </div>
              ) : orderSearchResults.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <p className="text-xs font-semibold text-[#94A3B8]">No matching orders found</p>
                </div>
              ) : (
                orderSearchResults.map((o: any, i: number) => (
                  <button
                    key={o._id || o.orderId || i}
                    onClick={() => { goToOrder(o); setShowMobileSearch(false); setShowOrderSearchResults(false); }}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-[#F8FAFC] active:bg-[#F1F5F9] transition-colors text-left border-b border-[#F1F5F9] last:border-0"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#00A86B]">{o.orderId}</span>
                        {o.awb_number && <span className="text-[10px] text-[#94A3B8] font-mono truncate">{o.awb_number}</span>}
                      </div>
                      <p className="text-[11px] text-[#64748B] truncate mt-0.5">
                        {o.receiverAddress?.contactName || o.userId?.fullname || '—'}
                        {o.receiverAddress?.email ? ` · ${o.receiverAddress.email}` : ''}
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold text-[#475569] bg-slate-100 px-2 py-0.5 rounded-full shrink-0">{o.status || 'New'}</span>
                  </button>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Desktop Header — hidden on mobile */}
      <header className={`hidden md:flex bg-white/80 backdrop-blur-xl border-b border-[#E2E8F0]/60 h-[72px] px-6 items-center gap-6 sticky ${isImpersonating ? 'top-8' : 'top-0'} z-[100] shadow-[0_4px_24px_-12px_rgba(0,0,0,0.05)]`}>
      
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

      {/* Middle Section - Search — global Orders search, available from every page */}
      <div className="flex-1 flex items-center justify-center min-w-0">
        {!isKycPage && (
        <div ref={orderSearchRef} className="hidden md:flex items-center relative w-full max-w-lg group">
          <Search className="w-4 h-4 absolute left-3.5 text-[#94A3B8] group-focus-within:text-[#00A86B] transition-colors duration-300 z-10" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowOrderSearchResults(true);
            }}
            onFocus={() => { if (searchQuery.trim()) setShowOrderSearchResults(true); }}
            name="navbar-global-order-search"
            autoComplete="off"
            className="w-full h-10 pl-10 pr-12 rounded-full border border-[#E2E8F0] bg-[#F8FAFC]/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20 focus:border-[#00A86B] transition-all text-[#0F172A] font-medium shadow-[0_2px_6px_rgba(0,0,0,0.02)] hover:border-[#CBD5E1]"
          />
          {!searchQuery && (
            <div className="absolute left-10 flex items-center gap-1 overflow-hidden pointer-events-none text-sm font-medium text-[#94A3B8] whitespace-nowrap">
              <span>{SEARCH_BY_PREFIX.trim()}</span>
              <span className="relative inline-block h-5 overflow-hidden align-middle">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={placeholderIndex}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.35, ease: 'easeInOut' }}
                    className="block"
                  >
                    {ORDER_SEARCH_FIELDS[placeholderIndex]}...
                  </motion.span>
                </AnimatePresence>
              </span>
            </div>
          )}
          {searchQuery ? (
            <button
              onClick={() => { setSearchQuery(''); setShowOrderSearchResults(false); }}
              className="absolute right-3 text-[#94A3B8] hover:text-[#64748B]"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <div className="absolute right-3 px-1.5 py-0.5 rounded-md bg-white border border-[#E2E8F0] shadow-sm text-[10px] font-bold text-[#94A3B8]">
              ⌘K
            </div>
          )}

          <AnimatePresence>
            {showOrderSearchResults && searchQuery.trim() && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-[0_20px_40px_-12px_rgba(0,0,0,0.15),0_0_0_1px_rgba(0,0,0,0.05)] overflow-hidden z-[110] max-h-[360px] overflow-y-auto"
              >
                {orderSearchLoading ? (
                  <div className="px-4 py-6 flex items-center justify-center gap-2 text-[#94A3B8]">
                    <div className="w-4 h-4 border-2 border-[#00A86B] border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-semibold">Searching orders…</span>
                  </div>
                ) : orderSearchResults.length === 0 ? (
                  <div className="px-4 py-6 text-center">
                    <p className="text-xs font-semibold text-[#94A3B8]">No matching orders found</p>
                  </div>
                ) : (
                  orderSearchResults.map((o: any, i: number) => (
                    <button
                      key={o._id || o.orderId || i}
                      onClick={() => goToOrder(o)}
                      className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-[#F8FAFC] transition-colors text-left border-b border-[#F1F5F9] last:border-0"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#00A86B]">{o.orderId}</span>
                          {o.awb_number && <span className="text-[10px] text-[#94A3B8] font-mono truncate">{o.awb_number}</span>}
                        </div>
                        <p className="text-[11px] text-[#64748B] truncate mt-0.5">
                          {o.receiverAddress?.contactName || o.userId?.fullname || '—'}
                          {o.receiverAddress?.email ? ` · ${o.receiverAddress.email}` : ''}
                        </p>
                      </div>
                      <span className="text-[10px] font-semibold text-[#475569] bg-slate-100 px-2 py-0.5 rounded-full shrink-0">{o.status || 'New'}</span>
                    </button>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        )}
      </div>

      {/* Right Section - Actions */}
      <div className="flex items-center gap-3 shrink-0">
        
        {/* Date Filter */}
        {!isDateFilterHiddenPage && (
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setShowDateDropdown(!showDateDropdown);
                setIsCustomMode(false);
              }}
              className="hidden lg:flex items-center gap-2 px-4 h-10 rounded-full border border-[#E2E8F0] text-xs font-semibold text-[#475569] cursor-pointer hover:bg-[#F8FAFC] hover:border-[#CBD5E1] transition-all bg-white shadow-sm focus:outline-none"
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
          <div className={`h-10 pl-3.5 pr-1 rounded-full text-white flex items-center gap-2 shadow-sm ${walletBalance < 0 ? 'bg-[#EF4444]' : 'bg-[#03C27D]'}`}>
            <button
              type="button"
              onClick={() => setShowWalletHover(v => !v)}
              className="flex items-center gap-2 focus:outline-none cursor-pointer"
            >
              <Wallet className="w-4 h-4 text-white" />
              <span className="text-sm font-bold tabular-nums">₹{walletBalance.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}</span>
            </button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowRechargeModal(true)}
              aria-label="Recharge wallet"
              className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-base leading-none font-medium transition-colors focus:outline-none cursor-pointer ${walletBalance < 0 ? 'bg-[#DC2626] hover:bg-[#B91C1C]' : 'bg-[#008757] hover:bg-[#00754a]'}`}
            >
              +
            </motion.button>
          </div>

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

                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-[#64748B]">Credit Limit</span>
                    <span className="text-sm font-bold text-violet-600">₹{creditLimit.toLocaleString('en-IN')}</span>
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
        
        {/* Quick Actions — hidden for employees */}
        {!isEmployee && !isSetupPage && !isKycPage && (
          <div className="relative">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowQuickActions(!showQuickActions)}
              onBlur={() => setTimeout(() => setShowQuickActions(false), 200)}
              className={`w-10 h-10 rounded-[14px] border flex items-center justify-center transition-all shadow-sm cursor-pointer ${showQuickActions ? 'bg-[#F8FAFC] border-[#CBD5E1]' : 'bg-white border-[#E2E8F0] hover:bg-[#F8FAFC] hover:border-[#CBD5E1]'}`}
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
                  <div className="p-2">
                    {isAdmin && adminTab ? (
                      <button
                        className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-[#F8FAFC] transition-colors group text-center w-full"
                        onClick={() => { setShowUserLoginModal(true); setUserLoginQuery(''); setUserSuggestions([]); setShowQuickActions(false); }}
                      >
                        <div className="w-10 h-10 rounded-full bg-[#F5F3FF] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                          <Users className="w-5 h-5 text-[#8B5CF6]" />
                        </div>
                        <h4 className="text-[12px] font-bold text-[#0F172A] group-hover:text-[#8B5CF6] transition-colors leading-tight">User Login</h4>
                      </button>
                    ) : (
                      <div className="grid grid-cols-2 gap-1">
                        <Link
                          to="/user/add-order"
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
                          onClick={() => { setShowBulkModal(true); setShowQuickActions(false); }}
                        >
                          <div className="w-10 h-10 rounded-full bg-[#FFF7ED] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                            <Upload className="w-5 h-5 text-[#F97316]" />
                          </div>
                          <h4 className="text-[12px] font-bold text-[#0F172A] group-hover:text-[#F97316] transition-colors leading-tight">Bulk Import</h4>
                        </button>
                        <Link
                          to="/user/rate-calculator"
                          className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-[#F8FAFC] transition-colors group text-center"
                          onClick={() => setShowQuickActions(false)}
                        >
                          <div className="w-10 h-10 rounded-full bg-[#F0FDF4] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                            <Calculator className="w-5 h-5 text-[#00A86B]" />
                          </div>
                          <h4 className="text-[12px] font-bold text-[#0F172A] group-hover:text-[#00A86B] transition-colors leading-tight">Calculate Rate</h4>
                        </Link>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Notifications — users only (including admin in user mode) */}
        {!(isAdmin && adminTab) && (
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowNotifications(!showNotifications)}
              onBlur={() => setTimeout(() => setShowNotifications(false), 200)}
              className={`w-10 h-10 rounded-[14px] border flex items-center justify-center transition-all relative cursor-pointer ${showNotifications ? 'bg-[#F8FAFC] border-[#CBD5E1] text-[#0F172A]' : 'bg-white border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'}`}
            >
              <Bell className="w-5 h-5" />
              {(pendingAgreement || notifications.length > 0) && (
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
                    {((pendingAgreement ? 1 : 0) + notifications.length) > 0 && (
                      <span className="text-[11px] font-bold text-white bg-[#EF4444] rounded-full px-2 py-0.5">
                        {(pendingAgreement ? 1 : 0) + notifications.length}
                      </span>
                    )}
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {pendingAgreement && (
                      <div className="px-4 py-3.5 border-b border-[#E2E8F0]/60 hover:bg-[#F8FAFC] transition-colors">
                        <div className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#EF4444] shrink-0 mt-1.5" />
                          <div className="flex-1">
                            <p className="text-[13px] font-semibold text-[#0F172A] leading-snug">Agreement Pending</p>
                            <p className="text-[12px] text-[#64748B] mt-0.5">{pendingAgreement.versionName || 'New Terms & Conditions'} — please review and accept.</p>
                            <button
                              onClick={() => { navigate('/user/settings/agreement'); setShowNotifications(false); }}
                              className="mt-1.5 text-[11px] font-bold text-[#00A86B] hover:underline"
                            >
                              View &amp; Accept →
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {notifications.map((n) => {
                      const ref: any = n.refId;
                      const isBulkShip = n.refModel === 'BulkShipJob';
                      const isRunning = isBulkShip && ref?.status === 'running';
                      let summary = '';
                      if (ref) {
                        if (isBulkShip) {
                          const done = (ref.successCount || 0) + (ref.failureCount || 0);
                          summary = isRunning
                            ? `Processing… ${done}/${ref.totalOrders}`
                            : `${ref.successCount || 0} succeeded, ${ref.failureCount || 0} failed`;
                        } else {
                          summary = `${ref.successfullyUploaded || 0}/${ref.noOfOrders || 0} rows uploaded${ref.errorOrders ? `, ${ref.errorOrders} failed` : ''}`;
                        }
                      }
                      return (
                        <div
                          key={n._id}
                          onClick={() => { setShowNotifications(false); setOpenNotificationId(n._id); }}
                          className="px-4 py-3.5 border-b border-[#E2E8F0]/60 hover:bg-[#F8FAFC] transition-colors cursor-pointer flex items-start gap-2"
                        >
                          {isRunning ? (
                            <Loader2 className="w-3.5 h-3.5 text-[#00A86B] animate-spin shrink-0 mt-0.5" />
                          ) : isBulkShip ? (
                            <Package className="w-3.5 h-3.5 text-[#00A86B] shrink-0 mt-0.5" />
                          ) : (
                            <UploadCloud className="w-3.5 h-3.5 text-[#00A86B] shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-[#0F172A] leading-snug truncate">{n.title}</p>
                            <p className="text-[12px] text-[#64748B] mt-0.5">{summary}</p>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); dismiss(n._id); }}
                            className="p-1 text-[#CBD5E1] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}

                    {!pendingAgreement && notifications.length === 0 && (
                      <div className="px-4 py-8 flex flex-col items-center gap-2">
                        <Bell className="w-8 h-8 text-[#CBD5E1]" />
                        <p className="text-[13px] font-semibold text-[#94A3B8]">No notifications right now</p>
                      </div>
                    )}
                  </div>
                  <div className="p-2.5 text-center bg-[#F8FAFC]/80 hover:bg-[#F1F5F9] transition-colors cursor-pointer" onClick={() => { setShowNotifications(false); setShowNotificationHistory(true); }}>
                    <span className="text-xs font-bold text-[#0F172A]">View All Notifications</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

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
              <span className="text-[11px] font-semibold text-[#64748B] truncate max-w-[120px]">{(isAdmin && adminTab) ? 'Admin' : businessName}</span>
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
                  {isEmployee ? (
                    <>
                      <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-0.5">Employee Login</p>
                      <p className="text-[13px] font-bold text-[#0F172A] truncate">{userEmail || '—'}</p>
                      {parentEmail && (
                        <p className="text-[10px] text-[#64748B] mt-0.5 truncate">Account: {parentEmail}</p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-0.5">Signed in as</p>
                      <p className="text-[13px] font-bold text-[#0F172A] truncate">{userEmail || '—'}</p>
                    </>
                  )}
                </div>
                
                {!isEmployee && (
                  <Link
                    to={(isAdmin && adminTab) ? '/admin/profile' : '/user/profile'}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-semibold text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <User className="w-4 h-4 text-[#94A3B8]" /> Profile
                  </Link>
                )}

                {/* Admin / User view toggle — only for admins, not employees */}
                {isAdmin && !isEmployee && (
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
      <Toast toast={toast} onClose={closeToast} />

      <RechargeWalletModal
        open={showRechargeModal}
        onClose={() => setShowRechargeModal(false)}
        walletBalance={walletBalance}
        onSuccess={(amount) => setWalletBalance(prev => prev + amount)}
      />
      </header>

      {/* Bulk Import Modal */}
      <BulkUploadModal open={showBulkModal} onClose={() => setShowBulkModal(false)} />

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

      <JobDetailModal notificationId={openNotificationId} onClose={() => setOpenNotificationId(null)} />
      <NotificationHistoryModal open={showNotificationHistory} onClose={() => setShowNotificationHistory(false)} />
    </>
  );
}
