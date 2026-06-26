import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home,
  Briefcase,
  Package,
  Wallet,
  Wrench,
  Settings,
  Truck,
  Monitor,
  Star,
  Users,
  ShoppingCart,
  FileText,
  Banknote,
  Send,
  Scale,
  Bell,
  AlertCircle,
  UserCog,
  UserPlus,
  Route,
  Calendar,
  History,
  Mail,
  Building2,
  BarChart2,
  RotateCcw
} from 'lucide-react';

const LOGO_URL = '/logo-white.png';

const MENU_GROUPS = [
  {
    label: 'Dashboard',
    icon: Home,
    path: '/admin/dashboard'
  },
  // {
  //   label: 'Management',
  //   icon: Briefcase,
  //   items: [
  //     { name: 'Vendors', path: '/admin/vendors', icon: Users },
  //   ]
  // },
  {
    label: 'Internal CRM',
    icon: Building2,
    isBeta: true,
    items: [
      { name: 'Shipments', path: '/internal-crm/shipments', icon: Package },
    ]
  },
  {
    label: 'Orders',
    icon: ShoppingCart,
    path: '/admin/orders'
  },
  {
    label: 'NDR',
    icon: RotateCcw,
    path: '/admin/ndr'
  },

  { divider: true },
  {
    label: 'Finance',
    icon: Wallet,
    items: [
      { name: 'Wallet', path: '/admin/wallet', icon: Wallet },
      { name: 'COD', path: '/admin/cod', icon: Banknote },
    ]
  },
  {
    label: 'Reports',
    icon: FileText,
    path: '/admin/reports'
  },
  {
    label: 'Tools',
    icon: Wrench,
    items: [
      { name: 'Weight Discrepancy', path: '/admin/weight-discrepancy', icon: Scale },
      { name: 'Notification', path: '/admin/notification', icon: Bell },
      { name: 'Announcements', path: '/admin/announcement', icon: AlertCircle },
    ]
  },
  {
    label: 'Setup & Manage',
    icon: Settings,
    items: [
      { name: 'Users', path: '/admin/users', icon: Users },
      { name: 'Status Map', path: '/admin/status-map', icon: Route },
      { name: 'EDD Mapping', path: '/admin/edd-mapping', icon: Calendar },
      { name: 'EPD Mapping', path: '/admin/epd-mapping', icon: Calendar },
      { name: 'Complete KYC', path: '/admin/kyc', icon: FileText },
    ]
  },
  {
    label: 'Courier',
    icon: Truck,
    items: [
      { name: 'Couriers', path: '/admin/couriers', icon: Truck },
      { name: 'Rate Card', path: '/admin/rate-card', icon: Banknote },
    ]
  },
  {
    label: 'System',
    icon: Monitor,
    items: [
      { name: 'Support Tickets', path: '/admin/support', icon: Mail },
      { name: 'System Settings', path: '/admin/settings', icon: Settings },
      { name: 'Admin Accounts', path: '/admin/accounts', icon: Users },
    ]
  },
  {
    label: 'Referral',
    icon: Star,
    path: '/admin/referral'
  }
];

export function AdminSidebar() {
  const location = useLocation();

  const getIsGroupActive = (items?: {path: string}[]) => {
    if (!items) return false;
    return items.some(item => location.pathname.startsWith(item.path));
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-[68px] bg-[#0F172A] z-[100] flex flex-col items-center py-4 border-r border-[#1E293B]">
      
      {/* Logo */}
      <div className="w-full flex justify-center mb-8">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
          <img src={LOGO_URL} alt="QP" className="w-6 object-contain" />
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 w-full flex flex-col gap-2 items-center px-2">
        {MENU_GROUPS.map((group, index) => {
          if (group.divider) {
            return <div key={index} className="w-8 border-b border-[#1E293B] my-1 opacity-50" />;
          }

          const isActive = group.path 
            ? location.pathname === group.path
            : getIsGroupActive(group.items);

          const Icon = group.icon as React.ComponentType<{ className?: string; strokeWidth?: number }>;

          return (
            <div key={index} className="relative group w-full">
              {/* Main Icon Button */}
              {group.path ? (
                <NavLink
                  to={group.path}
                  title={group.label}
                  className={`w-full h-12 flex items-center justify-center rounded-xl transition-all duration-200
                    ${isActive 
                      ? 'bg-[#00A86B] text-white shadow-lg shadow-[#00A86B]/20' 
                      : 'text-[#94A3B8] hover:bg-white/10 hover:text-white'}`}
                >
                  <Icon className="w-[22px] h-[22px]" strokeWidth={2} />
                </NavLink>
              ) : (
                <div 
                  className={`w-full h-12 flex items-center justify-center rounded-xl cursor-pointer transition-all duration-200
                    ${isActive 
                      ? 'bg-[#00A86B]/10 text-[#00A86B]' 
                      : 'text-[#94A3B8] hover:bg-white/10 hover:text-white'}`}
                >
                  <Icon className="w-[22px] h-[22px]" strokeWidth={isActive ? 2.5 : 2} />
                </div>
              )}

              {/* Flyout Menu Container */}
              {group.items && group.items.length > 0 && (
                <div className={`absolute left-full ml-2 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 z-[100] ${index > MENU_GROUPS.length / 2 ? 'bottom-0' : 'top-0'}`}>
                  <div className="bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-[#E2E8F0] min-w-[200px] overflow-hidden py-2">
                    <div className="px-4 py-2 border-b border-[#E2E8F0] mb-2 flex justify-between items-center">
                      <p className="text-[12px] font-bold text-[#64748B] uppercase tracking-wider">{group.label}</p>
                      {group.isBeta && <span className="text-[9px] font-bold bg-[#00A86B]/10 text-[#00A86B] px-1.5 py-0.5 rounded-md">BETA</span>}
                    </div>
                    
                    <div className="flex flex-col">
                      {group.items.map((item, i) => {
                        const isSubActive = location.pathname === item.path;
                        return (
                          <NavLink
                            key={i}
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-2.5 transition-colors
                              ${isSubActive 
                                ? 'bg-[#F0FDF4] text-[#00A86B]' 
                                : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'}`}
                          >
                            <item.icon className="w-[18px] h-[18px]" strokeWidth={2} />
                            <span className={`text-[13px] ${isSubActive ? 'font-bold' : 'font-medium'}`}>
                              {item.name}
                            </span>
                          </NavLink>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

            </div>
          );
        })}
      </nav>

    </aside>
  );
}
