import React, { useState } from 'react';
import { Search, RefreshCw, LogOut, Bell, User, Settings, Building2, Key, ChevronDown, IndianRupee } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';

export function DashboardHeader({ leftContent }: { leftContent?: React.ReactNode }) {
  const { logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <header className="bg-white border-b border-[#E2E8F0] h-20 px-6 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-4 flex-1">
        {leftContent ? leftContent : <h1 className="text-xl font-bold text-[#0F172A] hidden md:block">Dashboard</h1>}
      </div>

      <div className="flex items-center gap-4 lg:gap-6 flex-1 justify-end">
        {/* Refresh Icon */}
        <button className="w-8 h-8 rounded-full border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-[#F8FAFC] transition-colors hidden md:flex">
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* Global Search Bar */}
        <form onSubmit={handleSearch} className="hidden md:flex items-center relative w-64 lg:w-80">
          <Search className="w-4 h-4 absolute left-3 text-[#10B981]" />
          <input 
            type="text" 
            placeholder="Search AWB or Order ID..." 
            value={searchQuery}
            onChange={(e) => {
              const val = e.target.value;
              setSearchQuery(val);
              (window as any).__globalSearchQuery = val;
              window.dispatchEvent(new CustomEvent('global-search', { detail: val }));
            }}
            className="w-full h-10 pl-9 pr-4 rounded-full border border-[#10B981]/30 bg-[#F8FAFC] text-sm focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20 focus:border-[#00A86B] transition-all text-[#10B981] placeholder:text-[#10B981]/70 font-medium"
          />
        </form>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Link to="/wallet" className="h-10 px-4 rounded-full bg-[#10B981] text-white text-sm font-semibold flex items-center gap-2 hover:bg-[#009B63] transition-colors shadow-sm cursor-pointer">
            ₹ 7,12,24.82
            <span className="w-5 h-5 bg-white/20 text-white rounded-full flex items-center justify-center text-lg leading-none font-normal">+</span>
          </Link>
          
          {/* Notifications */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              onBlur={() => setTimeout(() => setShowNotifications(false), 200)}
              className="w-10 h-10 rounded-full border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-[#F8FAFC] transition-colors relative"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-[#E2E8F0] overflow-hidden z-50">
                <div className="p-3 border-b border-[#E2E8F0] flex justify-between items-center bg-[#F8FAFC]">
                  <h3 className="font-bold text-[#0F172A] text-sm">Notifications</h3>
                  <span className="text-xs text-[#00A86B] cursor-pointer hover:underline">Mark all as read</span>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <div className="p-3 border-b border-[#E2E8F0] hover:bg-[#F8FAFC] cursor-pointer">
                    <p className="text-sm font-medium text-[#0F172A]">Pickup Delayed</p>
                    <p className="text-xs text-[#64748B] mt-1">Shipment #1234567890 pickup has been delayed.</p>
                  </div>
                  <div className="p-3 border-b border-[#E2E8F0] hover:bg-[#F8FAFC] cursor-pointer">
                    <p className="text-sm font-medium text-[#0F172A]">New NDR Raised</p>
                    <p className="text-xs text-[#64748B] mt-1">Customer refused delivery for order #98765.</p>
                  </div>
                </div>
                <div className="p-2 text-center border-t border-[#E2E8F0] bg-gray-50">
                  <span className="text-xs font-semibold text-[#00A86B] cursor-pointer hover:underline">View All Notifications</span>
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative ml-2 border-l border-[#E2E8F0] pl-4 hidden sm:block">
            <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              onBlur={() => setTimeout(() => setShowProfileMenu(false), 200)}
              className="flex items-center gap-3 focus:outline-none"
            >
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold overflow-hidden border border-indigo-200">
                 <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="Profile" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-sm font-bold text-[#0F172A] leading-tight">Hi, ABC Studio</span>
                <span className="text-xs text-[#64748B]">abc@gmail.com</span>
              </div>
              <ChevronDown className="w-4 h-4 text-[#64748B]" />
            </button>

            {showProfileMenu && (
              <div 
                className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-lg border border-[#E2E8F0] overflow-hidden z-50"
                onMouseDown={(e) => e.preventDefault()}
              >
                <div className="py-1">
                  <Link to="/profile" className="flex items-center gap-3 px-4 py-2 text-sm text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]" onClick={() => setShowProfileMenu(false)}>
                    <User className="w-4 h-4" /> Profile
                  </Link>
                  <Link to="/company" className="flex items-center gap-3 px-4 py-2 text-sm text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]" onClick={() => setShowProfileMenu(false)}>
                    <Building2 className="w-4 h-4" /> Company Details
                  </Link>
                  <Link to="/billing" className="flex items-center gap-3 px-4 py-2 text-sm text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]" onClick={() => setShowProfileMenu(false)}>
                    <IndianRupee className="w-4 h-4" /> Billing
                  </Link>
                  <Link to="/api-keys" className="flex items-center gap-3 px-4 py-2 text-sm text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]" onClick={() => setShowProfileMenu(false)}>
                    <Key className="w-4 h-4" /> API Keys
                  </Link>
                  <Link to="/settings" className="flex items-center gap-3 px-4 py-2 text-sm text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]" onClick={() => setShowProfileMenu(false)}>
                    <Settings className="w-4 h-4" /> Settings
                  </Link>
                  <div className="border-t border-[#E2E8F0] my-1"></div>
                  <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
