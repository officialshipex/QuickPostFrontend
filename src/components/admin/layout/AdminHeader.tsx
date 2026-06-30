import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, LogOut, Bell, User, Building2, Calendar, ChevronDown, ChevronUp, Shield, FileText, Zap, Calculator, PackagePlus, MapPin, Wallet, Check, X, ArrowLeft, Banknote } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export function AdminHeader() {
  const { logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [selectedDateFilter, setSelectedDateFilter] = useState('Last 30 Days');
  const [toast, setToast] = useState<string | null>(null);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [walletBalance, setWalletBalance] = useState(4820000);
  const [showWalletHover, setShowWalletHover] = useState(false);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState(500);
  const [couponCode, setCouponCode] = useState('');
  const [showBillSummary, setShowBillSummary] = useState(true);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [tempCouponCode, setTempCouponCode] = useState('');
  const [rechargeMode, setRechargeMode] = useState<'Payment' | 'COD'>('Payment');
  const [availableCodBalance, setAvailableCodBalance] = useState(148250);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
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
    '/admin/notification'
  ].includes(location.pathname);

  const getSearchPlaceholder = () => {
    switch (location.pathname) {
      case '/admin/users': return "Search users by name, email or role (Press '/')";
      case '/admin/roles': return "Search roles by name (Press '/')";
      case '/admin/allocate-sellers': return "Search sellers or account managers (Press '/')";
      case '/admin/status-map': return "Search status mappings (Press '/')";
      case '/admin/edd-mapping': return "Search EDD rules (Press '/')";
      case '/admin/epd-mapping': return "Search EPD rules (Press '/')";
      case '/admin/orders': return "Search AWB or Order ID...";
      case '/admin/ndr': return "Search NDR by name, email, phone or AWB (Press '/')";
      case '/admin/weight-discrepancy': return "Search weight discrepancies by name, email, or AWB (Press '/')";
      case '/admin/cod': return "Search COD remitted by user, AWB, or amount (Press '/')";
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
    <header className="bg-white/80 backdrop-blur-xl border-b border-[#E2E8F0]/60 h-[72px] px-6 flex items-center gap-6 sticky top-0 z-[100] shadow-[0_4px_24px_-12px_rgba(0,0,0,0.05)]">
      
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
      </div>

      {/* Right Section - Actions */}
      <div className="flex items-center gap-3 shrink-0">
        
        {/* Date Filter */}
        {!isSetupPage && (
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
              <Calendar className="w-4 h-4 text-[#94A3B8]" /> {selectedDateFilter} <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8]" />
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
                        const formattedStart = new Date(customStart).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
                        const formattedEnd = new Date(customEnd).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
                        setSelectedDateFilter(`${formattedStart} - ${formattedEnd}`);
                        setShowDateDropdown(false);
                        setIsCustomMode(false);
                        showToast(`Date range set to: ${formattedStart} - ${formattedEnd}`);
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
                          setSelectedDateFilter(option);
                          setShowDateDropdown(false);
                          showToast(`Date range set to: ${option}`);
                        }}
                        className={`w-full text-left px-3 py-1.5 rounded-xl text-[13px] font-semibold transition-colors flex items-center justify-between ${
                          selectedDateFilter === option 
                            ? 'bg-[#00A86B]/10 text-[#00A86B]' 
                            : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                        }`}
                      >
                        {option}
                        {selectedDateFilter === option && <Check className="w-4 h-4 text-[#00A86B]" />}
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
            className="h-10 px-4 rounded-[14px] bg-gradient-to-b from-[#00b876] to-[#00A86B] text-white text-sm font-semibold flex items-center gap-2 shadow-[0_4px_12px_rgba(0,168,107,0.25),inset_0_1px_1px_rgba(255,255,255,0.2)] border border-[#009B63] transition-all cursor-pointer focus:outline-none"
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
                    <span className="text-sm font-bold text-amber-600">₹{(150000).toLocaleString('en-IN')}</span>
                  </div>

                  <div className="h-[1px] bg-slate-100 my-1"></div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700">Net Balance</span>
                    <span className="text-sm font-extrabold text-[#00A86B]">₹{(walletBalance - 150000).toLocaleString('en-IN')}</span>
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
        {!isSetupPage && (
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
                  <div className="p-2 flex flex-col gap-1">
                    <Link 
                      to="/admin/add-order" 
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F8FAFC] transition-colors group"
                      onClick={() => setShowQuickActions(false)}
                    >
                      <div className="w-10 h-10 rounded-full bg-[#EFF6FF] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <PackagePlus className="w-5 h-5 text-[#3B82F6]" />
                      </div>
                      <h4 className="text-[13px] font-bold text-[#0F172A] group-hover:text-[#3B82F6] transition-colors">Add Order</h4>
                    </Link>
                    <Link 
                      to="/admin/rate-calculator" 
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F8FAFC] transition-colors group"
                      onClick={() => setShowQuickActions(false)}
                    >
                      <div className="w-10 h-10 rounded-full bg-[#F0FDF4] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <Calculator className="w-5 h-5 text-[#00A86B]" />
                      </div>
                      <h4 className="text-[13px] font-bold text-[#0F172A] group-hover:text-[#00A86B] transition-colors">Rate Calculator</h4>
                    </Link>
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
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#EF4444] rounded-full border-[1.5px] border-white shadow-sm" />
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
                  <h3 className="font-bold text-[#0F172A] text-[13px] tracking-wide uppercase">System Alerts</h3>
                  <span className="text-xs font-semibold text-[#00A86B] cursor-pointer hover:text-[#009B63]">Mark all read</span>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  <div className="px-4 py-3.5 border-b border-[#E2E8F0]/60 hover:bg-[#F8FAFC] cursor-pointer transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
                      <p className="text-[13px] font-bold text-[#0F172A]">Failed Courier API</p>
                    </div>
                    <p className="text-xs font-medium text-[#64748B] ml-3.5">Bluedart API is experiencing high latency (500ms+).</p>
                    <p className="text-[10px] font-semibold text-[#94A3B8] ml-3.5 mt-1.5">Just now</p>
                  </div>
                  <div className="px-4 py-3.5 border-b border-[#E2E8F0]/60 hover:bg-[#F8FAFC] cursor-pointer transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
                      <p className="text-[13px] font-bold text-[#0F172A]">New Vendor Request</p>
                    </div>
                    <p className="text-xs font-medium text-[#64748B] ml-3.5">SuperMart Pvt Ltd requested onboarding approval.</p>
                    <p className="text-[10px] font-semibold text-[#94A3B8] ml-3.5 mt-1.5">2 hours ago</p>
                  </div>
                </div>
                <div className="p-2.5 text-center bg-[#F8FAFC]/80 hover:bg-[#F1F5F9] transition-colors cursor-pointer">
                  <span className="text-xs font-bold text-[#0F172A]">View All Alerts</span>
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
            <div className="w-10 h-10 rounded-[14px] bg-gradient-to-br from-[#1E293B] to-[#0F172A] flex items-center justify-center text-white font-bold overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.1)] group-hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-all">
               <Shield className="w-4 h-4 text-white/90" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[13px] font-bold text-[#0F172A] leading-tight group-hover:text-[#00A86B] transition-colors">Super Admin</span>
              <span className="text-[11px] font-semibold text-[#64748B]">System Role</span>
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
                  <p className="text-[13px] font-bold text-[#0F172A] truncate">admin@quickpost.in</p>
                </div>
                
                <Link to="/admin/profile" className="flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-semibold text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors" onClick={() => setShowProfileMenu(false)}>
                  <User className="w-4 h-4 text-[#94A3B8]" /> Profile
                </Link>
                
                <div className="border-t border-[#E2E8F0] my-1"></div>
                
                <button onMouseDown={(e) => { e.preventDefault(); logout(); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-semibold text-[#EF4444] hover:bg-[#FEF2F2] transition-colors">
                  <LogOut className="w-4 h-4 text-[#EF4444]/70" /> Sign out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-[100] bg-[#1E293B] text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border border-white/10 min-w-[280px]"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
              <Check className="w-4 h-4 text-[#34D399]" />
            </div>
            <p className="text-[13px] font-medium pr-4">{toast}</p>
          </motion.div>
        )}
      </AnimatePresence>

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
                  className="w-full max-w-[380px] bg-white rounded-3xl shadow-[0_24px_48px_rgba(0,0,0,0.16)] p-6 relative pointer-events-auto border border-slate-100"
                >
                  {/* Center Top Overlapping Close Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowRechargeModal(false);
                      setRechargeMode('Payment');
                    }}
                    className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:bg-slate-50 transition-colors border border-slate-100 cursor-pointer focus:outline-none"
                  >
                    <X className="w-4 h-4 text-slate-500" />
                  </button>

                  {/* Header */}
                  <div className="flex justify-between items-center mb-5 mt-2">
                    <h2 className="text-lg font-bold text-[#0F172A]">Recharge Wallet</h2>
                    <div className="flex items-center gap-1 text-[#00A86B] font-semibold text-sm">
                      <Wallet className="w-3.5 h-3.5" />
                      <span>₹{walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  <div className="h-[1px] bg-slate-100 mb-5" />

                  {rechargeMode === 'Payment' ? (
                    <>
                      {/* Amount Input Section */}
                      <div className="text-center mb-5">
                        <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wide mb-3">Enter Amount to Add</p>
                        
                        <div className="inline-block relative">
                          <div className="flex items-center justify-center text-3xl font-extrabold text-[#0F172A]">
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
                                width: `${Math.max(1.5, rechargeAmount ? rechargeAmount.toString().length : 1.5) * 18}px`,
                                minWidth: '30px'
                              }}
                              className="text-center bg-transparent focus:outline-none font-extrabold border-none p-0 select-all"
                              placeholder="0"
                            />
                          </div>
                          <div className="w-full border-b border-dashed border-[#94A3B8] mt-1 h-0" />
                        </div>

                        {/* Quick Select Pills */}
                        <div className="flex items-center justify-center gap-2 mt-5">
                          {[500, 1000, 2000, 5000].map((amt) => (
                            <button
                              type="button"
                              key={amt}
                              onClick={() => setRechargeAmount(amt)}
                              className={`px-4 py-1.5 rounded-full border text-xs font-semibold transition-all ${
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

                      <div className="h-[1px] bg-slate-100 mb-4" />

                      {/* Offer & Bill Summary Section */}
                      <div className="mb-5">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">Offer & Bill Summary</p>
                        
                        {/* Coupon Box */}
                        <div 
                          onClick={() => {
                            setTempCouponCode(couponCode);
                            setShowCouponModal(true);
                          }}
                          className="border border-slate-200/80 rounded-xl px-4 py-2.5 flex items-center justify-between bg-white mb-3 hover:border-slate-300 transition-colors cursor-pointer"
                        >
                          <div className="flex flex-col text-left">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Coupon Code</span>
                            <span className="text-xs font-semibold text-slate-700">
                              {couponCode ? (
                                <span className="text-[#00A86B] font-bold">{couponCode}</span>
                              ) : (
                                "Have Coupon Code?"
                              )}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-[#00A86B] hover:text-[#009B63] select-none">
                            {couponCode ? 'Change' : 'View Coupons'}
                          </span>
                        </div>

                        {/* Bill Details Box */}
                        <div className="bg-[#F8FAFC] border border-[#E2E8F0]/50 rounded-xl p-3">
                          <button
                            type="button"
                            onClick={() => setShowBillSummary(!showBillSummary)}
                            className="w-full flex items-center justify-between text-xs font-bold text-[#475569] focus:outline-none"
                          >
                            <div className="flex items-center gap-2">
                              <Wallet className="w-3.5 h-3.5 text-[#94A3B8]" />
                              <span>Amount to be credited: ₹{(rechargeAmount || 0).toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[#94A3B8] hover:text-[#64748B] transition-colors">
                              <span className="text-[10px] font-bold">{showBillSummary ? 'Hide Bill Summary' : 'Show Bill Summary'}</span>
                              {showBillSummary ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </div>
                          </button>

                          {showBillSummary && (
                            <div className="mt-3 pt-3 border-t border-[#E2E8F0] space-y-2">
                              <div className="flex justify-between text-xs font-semibold text-[#64748B]">
                                <span>Recharge Amount</span>
                                <span>₹{(rechargeAmount || 0).toLocaleString('en-IN')}</span>
                              </div>
                              <div className="flex justify-between text-xs font-bold text-[#0F172A] pt-2 border-t border-dashed border-[#E2E8F0]">
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
                        className="w-full py-3.5 bg-gradient-to-r from-[#00b876] to-[#00A86B] text-white text-sm font-bold rounded-full shadow-[0_4px_12px_rgba(0,168,107,0.2)] hover:from-[#00c982] hover:to-[#00b876] transition-all disabled:opacity-50 disabled:pointer-events-none text-center focus:outline-none cursor-pointer"
                      >
                        Pay ₹{(rechargeAmount || 0).toLocaleString('en-IN')}
                      </button>

                      {/* OR recharge via COD Remittance */}
                      <div className="relative flex py-2 items-center my-1.5">
                        <div className="flex-grow border-t border-slate-100"></div>
                        <span className="flex-shrink mx-3 text-slate-400 text-[10px] font-bold uppercase tracking-wider">OR</span>
                        <div className="flex-grow border-t border-slate-100"></div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setRechargeMode('COD')}
                        className="w-full py-3 border border-[#00A86B]/30 hover:border-[#00A86B] bg-[#00A86B]/5 hover:bg-[#00A86B]/10 text-[#00A86B] text-xs font-bold rounded-full transition-all flex items-center justify-center gap-1.5 focus:outline-none cursor-pointer"
                      >
                        <Banknote className="w-3.5 h-3.5" /> Recharge via COD Remittance
                      </button>
                    </>
                  ) : (
                    <div className="space-y-5 animate-fade-in">
                      {/* COD Remittance Info Card */}
                      <div className="bg-gradient-to-br from-emerald-50 to-green-50/30 border border-emerald-100/80 rounded-2xl p-4 text-left">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">Available COD Payout</span>
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        </div>
                        <div className="text-2xl font-black text-slate-800">
                          ₹{availableCodBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-[10px] text-slate-400 font-semibold mt-1">
                          Transfer funds directly from your pending COD remittance.
                        </p>
                      </div>

                      {/* Amount to Transfer Input */}
                      <div className="text-center">
                        <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wide mb-2.5">Amount to Transfer</p>
                        
                        <div className="inline-block relative">
                          <div className="flex items-center justify-center text-3xl font-extrabold text-[#0F172A]">
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
                                width: `${Math.max(1.5, rechargeAmount ? rechargeAmount.toString().length : 1.5) * 18}px`,
                                minWidth: '30px'
                              }}
                              className="text-center bg-transparent focus:outline-none font-extrabold border-none p-0 select-all"
                              placeholder="0"
                            />
                          </div>
                          <div className="w-full border-b border-dashed border-[#94A3B8] mt-1 h-0" />
                        </div>

                        {/* Quick Select Pills */}
                        <div className="flex items-center justify-center gap-2 mt-4">
                          {[500, 1000, 2000, 5000].map((amt) => (
                            <button
                              type="button"
                              key={amt}
                              onClick={() => setRechargeAmount(amt)}
                              className={`px-4 py-1.5 rounded-full border text-xs font-semibold transition-all ${
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
                      <div className="flex gap-2 p-3 bg-slate-50 border border-slate-100 rounded-xl text-left">
                        <Shield className="w-4 h-4 text-[#94A3B8] shrink-0 mt-0.5" />
                        <p className="text-[10px] text-slate-500 font-medium leading-normal">
                          No gateway charges apply. The transferred amount will be adjusted in your next COD settlement statement.
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2.5">
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
                          className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-[#00A86B] text-white text-sm font-bold rounded-full shadow-[0_4px_12px_rgba(0,168,107,0.2)] hover:from-emerald-700 hover:to-[#009B63] transition-all disabled:opacity-50 disabled:pointer-events-none text-center focus:outline-none cursor-pointer"
                        >
                          Confirm Transfer
                        </button>

                        <button
                          type="button"
                          onClick={() => setRechargeMode('Payment')}
                          className="w-full py-2.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300 text-xs font-bold rounded-full transition-all flex items-center justify-center gap-1.5 focus:outline-none cursor-pointer"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" /> Back to Online Payment
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
                  className="w-full max-w-[360px] bg-white rounded-3xl shadow-[0_24px_48px_rgba(0,0,0,0.16)] p-6 relative pointer-events-auto border border-slate-100"
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
  );
}
