import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAdminTab } from '../../../context/AdminUserContext';
import { hasPermission, showAccessDenied } from '../../../utils/permissions';
import {
  Home,
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
  Scale,
  Bell,
  AlertCircle,
  Route,
  Calendar,
  Mail,
  Building2,
  RotateCcw,
  X,
  ChevronRight,
  MapPin,
  HelpCircle,
  TrendingUp,
  Zap,
  ShieldCheck,
  Palette,
  LayoutDashboard,
  Lock,
} from 'lucide-react';

const LOGO_URL = '/logo-white.png';

// `permission` is a module key from utils/permissions.ts. Employees SEE every item of their panel;
// the ones they hold no View right for are locked (a click opens the "no access" popup).
interface MenuItem {
  name: string;
  path: string;
  icon: any;
  adminOnly?: boolean;
  userOnly?: boolean;
  permission?: string;
  noEmployee?: boolean; // owner-only: hidden from all employees regardless of their access rights
  isNew?: boolean;
}

interface MenuGroup {
  label?: string;
  icon?: any;
  path?: string;
  isBeta?: boolean;
  adminOnly?: boolean;
  userOnly?: boolean;
  items?: MenuItem[];
  divider?: boolean;
  permission?: string; // only for groups that are themselves a link (no items)
}

const MENU_GROUPS: MenuGroup[] = [
  {
    label: 'Home',
    icon: Home,
    path: '/user/home',
    userOnly: true,
  },
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/admin/dashboard'
  },
  {
    label: 'Internal CRM',
    icon: Building2,
    path: '/internal-crm/shipments',
    isBeta: true,
    adminOnly: true,
    permission: 'internalCrm',
  },
  {
    label: 'Orders',
    icon: ShoppingCart,
    path: '/admin/orders',
    permission: 'orders',
  },
  {
    label: 'NDR',
    icon: RotateCcw,
    path: '/admin/ndr',
    permission: 'ndr',
  },

  { divider: true },
  {
    label: 'Finance',
    icon: Wallet,
    items: [
      { name: 'Wallet', path: '/admin/wallet', icon: Wallet, permission: 'wallet' },
      { name: 'COD', path: '/admin/cod', icon: Banknote, permission: 'cod' },
    ]
  },
  {
    label: 'Reports',
    icon: FileText,
    items: [
      { name: 'Reports', path: '/admin/reports', icon: FileText, permission: 'reportsHub' },
      { name: 'Performance', path: '/admin/performance', icon: TrendingUp, adminOnly: true, permission: 'performance' },
    ]
  },
  {
    label: 'Tools',
    icon: Wrench,
    items: [
      { name: 'Weight Discrepancy', path: '/admin/weight-discrepancy', icon: Scale, permission: 'weightDiscrepancy' },
      { name: 'Notification', path: '/admin/notification', icon: Bell, permission: 'notification' },
      { name: 'Announcements', path: '/admin/announcement', icon: AlertCircle, adminOnly: true, permission: 'announcement' },
      { name: 'Rate Calculator', path: '/user/rate-calculator', icon: Wrench, userOnly: true, permission: 'rateCalculator' },
    ]
  },
  {
    label: 'Value Added Services',
    icon: Zap,
    userOnly: true,
    items: [
      { name: 'Seller Remittance', path: '/user/seller-remittance/early-cod', icon: Wallet, userOnly: true, permission: 'sellerRemittance' },
      { name: 'Secure', path: '/user/vas/auto-secure', icon: ShieldCheck, userOnly: true, permission: 'vasSecure' },
      { name: 'Branded Tracking Page', path: '/user/vas/branded-tracking', icon: Palette, userOnly: true, permission: 'brandedTracking' },
    ]
  },
  {
    label: 'Setup & Manage',
    icon: Settings,
    items: [
      { name: 'Users', path: '/admin/users', icon: Users, adminOnly: true, permission: 'users' },
      { name: 'KYC Review', path: '/admin/kyc-review', icon: ShieldCheck, adminOnly: true, permission: 'users' },
      { name: 'Employees', path: '/admin/roles', icon: Users, adminOnly: true, noEmployee: true },
      { name: 'Status Map', path: '/admin/status-map', icon: Route, adminOnly: true, permission: 'statusMap' },
      { name: 'EDD Mapping', path: '/admin/edd-mapping', icon: Calendar, adminOnly: true, permission: 'eddMapping' },
      { name: 'EPD Mapping', path: '/admin/epd-mapping', icon: Calendar, adminOnly: true, permission: 'epdMapping' },
      { name: 'Agreement', path: '/admin/agreement', icon: FileText, adminOnly: true, permission: 'agreement' },
      { name: 'Complete KYC', path: '/admin/kyc', icon: FileText, userOnly: true, noEmployee: true },
      { name: 'Employees', path: '/user/employees', icon: Users, userOnly: true, noEmployee: true },
      { name: 'Pickup Address', path: '/admin/settings/pickup-address', icon: MapPin, permission: 'pickupAddress' },
      { name: 'Channels', path: '/user/channels', icon: ShoppingCart, userOnly: true, permission: 'channels' },
      { name: 'Courier', path: '/user/courier-setup', icon: Truck, userOnly: true, permission: 'courierSetup' },
      { name: 'Settings', path: '/user/settings', icon: Settings, userOnly: true, permission: 'settings' },
    ]
  },
  {
    label: 'Courier',
    icon: Truck,
    adminOnly: true,
    items: [
      { name: 'Couriers', path: '/admin/couriers', icon: Truck, permission: 'couriers' },
      { name: 'Rate Card', path: '/admin/rate-card', icon: Banknote, permission: 'rateCard' },
    ]
  },
  {
    label: 'System',
    icon: Monitor,
    adminOnly: true,
    items: [
      { name: 'Support Tickets', path: '/admin/support', icon: Mail, permission: 'support' },
      // { name: 'System Settings', path: '/admin/settings', icon: Settings, noEmployee: true },
      { name: 'Admin Accounts', path: '/admin/accounts', icon: Users, noEmployee: true },
      { name: 'Companies', path: '/admin/companies', icon: Building2, noEmployee: true },
    ]
  },
  {
    label: 'Referral',
    icon: Star,
    path: '/admin/referral',
    adminOnly: true,
    permission: 'referral',
  },
  {
    label: 'Support',
    icon: HelpCircle,
    path: '/admin/support',
    userOnly: true,
    permission: 'support',
  },
];

interface AdminSidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function AdminSidebar({ isMobileOpen = false, onMobileClose }: AdminSidebarProps) {
  const location = useLocation();
  const [mobileExpandedGroup, setMobileExpandedGroup] = useState<string | null>(null);
  const { isAdmin, adminTab, isEmployee, employeeAccessRights } = useAdminTab();
  const isAdminView = isAdmin && adminTab;
  const isImpersonating = !!localStorage.getItem('admin_token_backup');

  // Replace /admin/ prefix with /user/ when in user mode
  const resolvePath = (path: string) => {
    if (!isAdminView && path.startsWith('/admin/')) {
      return path.replace('/admin/', '/user/');
    }
    return path;
  };

  // Visible to the employee but not permitted
  const isLocked = (permission?: string) =>
    isEmployee && !!permission && !hasPermission(employeeAccessRights, permission, 'view');

  const notifyLocked = (label?: string) =>
    showAccessDenied(`You don't have access to ${label ? `"${label}"` : 'this page'}. Please contact your administrator.`);

  const filterItems = (items?: MenuItem[]) =>
    (items || []).filter(item => {
      if (item.adminOnly && !isAdminView) return false;
      if (item.userOnly && isAdminView) return false;
      if (isEmployee && item.noEmployee) return false;
      return true;
    });

  const shouldShowGroup = (group: MenuGroup) => {
    if (group.divider) return true;
    if (group.adminOnly && !isAdminView) return false;
    if (group.userOnly && isAdminView) return false;
    if (group.items) return filterItems(group.items).length > 0;
    return true;
  };

  const getIsGroupActive = (items?: MenuItem[]) => {
    if (!items) return false;
    return filterItems(items).some(item => location.pathname.startsWith(resolvePath(item.path)));
  };

  // Dashboard is active on both /admin/dashboard and /user/dashboard
  const dashboardPath = location.pathname === '/user/dashboard' ? '/user/dashboard' : '/admin/dashboard';

  const handleMobileNavClick = () => {
    onMobileClose?.();
    setMobileExpandedGroup(null);
  };

  const visibleGroups = MENU_GROUPS.filter(shouldShowGroup);

  return (
    <>
      {/* Desktop Sidebar — hidden on mobile */}
      <aside className={`hidden md:flex fixed left-0 w-[68px] bg-[#0F172A] z-[100] flex-col items-center py-4 border-r border-[#1E293B] ${isImpersonating ? 'top-8 h-[calc(100vh-2rem)]' : 'top-0 h-screen'}`}>

        {/* Logo */}
        <div className="w-full flex justify-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <img src={LOGO_URL} alt="QP" className="w-6 object-contain" />
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 w-full flex flex-col gap-2 items-center px-2">
          {visibleGroups.map((group, index) => {
            if (group.divider) {
              return <div key={index} className="w-8 border-b border-[#1E293B] my-1 opacity-50" />;
            }

            const filteredGroupItems = group.items ? filterItems(group.items) : [];
            // If only one item is visible after filtering (e.g. user sees "Reports" but not "Performance"),
            // navigate directly instead of opening a flyout popup.
            const singleItem = !group.path && filteredGroupItems.length === 1 ? filteredGroupItems[0] : undefined;
            const resolvedGroupPath = group.path
              ? resolvePath(group.path)
              : (singleItem ? resolvePath(singleItem.path) : undefined);
            const linkPermission = group.path ? group.permission : singleItem?.permission;
            const linkLocked = isLocked(linkPermission);

            const isActive = resolvedGroupPath
              ? (location.pathname.startsWith(resolvedGroupPath) ||
                 (group.path === '/admin/dashboard' && location.pathname === '/user/dashboard'))
              : getIsGroupActive(group.items);

            const Icon = group.icon as React.ComponentType<{ className?: string; strokeWidth?: number }>;

            return (
              <div key={index} className="relative group w-full">
                {/* Main Icon Button */}
                {resolvedGroupPath ? (
                  linkLocked ? (
                    <button
                      type="button"
                      title={`${group.label} — no access`}
                      onClick={() => notifyLocked(singleItem?.name ?? group.label)}
                      className="relative w-full h-12 flex items-center justify-center rounded-xl transition-all duration-200 text-[#94A3B8]/50 hover:bg-white/5"
                    >
                      <Icon className="w-[22px] h-[22px]" strokeWidth={2} />
                      <Lock className="absolute bottom-1.5 right-2.5 w-2.5 h-2.5 text-[#94A3B8]" strokeWidth={2.5} />
                    </button>
                  ) : (
                    <NavLink
                      to={group.path === '/admin/dashboard' ? dashboardPath : resolvedGroupPath}
                      title={group.label}
                      className={`w-full h-12 flex items-center justify-center rounded-xl transition-all duration-200
                        ${isActive
                          ? 'bg-[#00A86B] text-white shadow-lg shadow-[#00A86B]/20'
                          : 'text-[#94A3B8] hover:bg-white/10 hover:text-white'}`}
                    >
                      <Icon className="w-[22px] h-[22px]" strokeWidth={2} />
                    </NavLink>
                  )
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

                {/* Flyout Menu Container — only shown when 2+ items are visible */}
                {filteredGroupItems.length > 1 && (
                  <div className={`absolute left-full ml-2 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 z-[100] ${index > visibleGroups.length / 2 ? 'bottom-0' : 'top-0'}`}>
                    <div className="bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-[#E2E8F0] min-w-[200px] overflow-hidden py-2">
                      <div className="px-4 py-2 border-b border-[#E2E8F0] mb-2 flex justify-between items-center">
                        <p className="text-[12px] font-bold text-[#64748B] uppercase tracking-wider">{group.label}</p>
                        {group.isBeta && <span className="text-[9px] font-bold bg-[#00A86B]/10 text-[#00A86B] px-1.5 py-0.5 rounded-md">BETA</span>}
                      </div>

                      <div className="flex flex-col">
                        {filteredGroupItems.map((item, i) => {
                          const resolvedItemPath = resolvePath(item.path);
                          const isSubActive = location.pathname === resolvedItemPath;
                          if (isLocked(item.permission)) {
                            return (
                              <button
                                key={i}
                                type="button"
                                title="You don't have access"
                                onClick={() => notifyLocked(item.name)}
                                className="flex items-center gap-3 px-4 py-2.5 text-left text-[#94A3B8] hover:bg-[#F8FAFC] transition-colors"
                              >
                                <item.icon className="w-[18px] h-[18px]" strokeWidth={2} />
                                <span className="text-[13px] font-medium">{item.name}</span>
                                <Lock className="ml-auto w-3 h-3 shrink-0" strokeWidth={2.5} />
                              </button>
                            );
                          }
                          return (
                            <NavLink
                              key={i}
                              to={resolvedItemPath}
                              className={`flex items-center gap-3 px-4 py-2.5 transition-colors
                                ${isSubActive
                                  ? 'bg-[#F0FDF4] text-[#00A86B]'
                                  : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'}`}
                            >
                              <item.icon className="w-[18px] h-[18px]" strokeWidth={2} />
                              <span className={`text-[13px] ${isSubActive ? 'font-bold' : 'font-medium'}`}>
                                {item.name}
                              </span>
                              {item.isNew && <span className="ml-auto text-[9px] font-bold bg-[#00A86B] text-white px-1.5 py-0.5 rounded-md shrink-0">New</span>}
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

      {/* Mobile Sidebar Drawer — visible only on mobile when toggled */}
      {isMobileOpen && (
        <div className={`md:hidden fixed inset-x-0 bottom-0 z-[200] ${isImpersonating ? 'top-8' : 'top-0'}`}>
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleMobileNavClick}
          />
          {/* Drawer */}
          <aside className="absolute left-0 top-0 h-full w-[280px] bg-[#0F172A] shadow-2xl flex flex-col animate-slide-in-left">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E293B]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <img src={LOGO_URL} alt="QP" className="w-5 object-contain" />
                </div>
                <span className="text-white text-[15px] font-bold tracking-wide">QuickPost</span>
              </div>
              <button
                onClick={handleMobileNavClick}
                className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-[#94A3B8] hover:text-white hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Navigation */}
            <nav className="flex-1 overflow-y-auto py-3 px-3">
              {visibleGroups.map((group, index) => {
                if (group.divider) {
                  return <div key={index} className="border-b border-[#1E293B] my-2 mx-2 opacity-50" />;
                }

                const filteredGroupItems = group.items ? filterItems(group.items) : [];
                const singleItem = !group.path && filteredGroupItems.length === 1 ? filteredGroupItems[0] : undefined;
                const resolvedGroupPath = group.path
                  ? resolvePath(group.path)
                  : (singleItem ? resolvePath(singleItem.path) : undefined);
                const linkPermission = group.path ? group.permission : singleItem?.permission;
                const linkLocked = isLocked(linkPermission);

                const isActive = resolvedGroupPath
                  ? (location.pathname.startsWith(resolvedGroupPath) ||
                     (group.path === '/admin/dashboard' && location.pathname === '/user/dashboard'))
                  : getIsGroupActive(group.items);

                const Icon = group.icon as React.ComponentType<{ className?: string; strokeWidth?: number }>;

                // Direct link (also handles single-item groups collapsed to one path)
                if (resolvedGroupPath) {
                  if (linkLocked) {
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => { notifyLocked(singleItem?.name ?? group.label); }}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl mb-1 text-[#94A3B8]/60 hover:bg-white/5 text-left"
                      >
                        <Icon className="w-5 h-5" strokeWidth={2} />
                        <span className="text-[13px] font-semibold">{group.label}</span>
                        <Lock className="w-3.5 h-3.5 ml-auto" strokeWidth={2.5} />
                      </button>
                    );
                  }
                  return (
                    <NavLink
                      key={index}
                      to={group.path === '/admin/dashboard' ? dashboardPath : resolvedGroupPath}
                      onClick={handleMobileNavClick}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl mb-1 transition-all duration-200
                        ${isActive
                          ? 'bg-[#00A86B] text-white shadow-lg shadow-[#00A86B]/20'
                          : 'text-[#94A3B8] hover:bg-white/10 hover:text-white'}`}
                    >
                      <Icon className="w-5 h-5" strokeWidth={2} />
                      <span className="text-[13px] font-semibold">{group.label}</span>
                      {group.isBeta && <span className="text-[8px] font-bold bg-[#00A86B]/20 text-[#00A86B] px-1.5 py-0.5 rounded-md ml-auto">BETA</span>}
                    </NavLink>
                  );
                }

                // Expandable group
                const isExpanded = mobileExpandedGroup === group.label;
                return (
                  <div key={index} className="mb-1">
                    <button
                      onClick={() => setMobileExpandedGroup(isExpanded ? null : (group.label || null))}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200
                        ${isActive
                          ? 'bg-[#00A86B]/10 text-[#00A86B]'
                          : 'text-[#94A3B8] hover:bg-white/10 hover:text-white'}`}
                    >
                      <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                      <span className="text-[13px] font-semibold">{group.label}</span>
                      <ChevronRight className={`w-4 h-4 ml-auto transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>
                    {isExpanded && filteredGroupItems.length > 0 && (
                      <div className="ml-4 mt-1 flex flex-col gap-0.5 border-l-2 border-[#1E293B] pl-3">
                        {filteredGroupItems.map((item, i) => {
                          const resolvedItemPath = resolvePath(item.path);
                          const isSubActive = location.pathname === resolvedItemPath;
                          if (isLocked(item.permission)) {
                            return (
                              <button
                                key={i}
                                type="button"
                                onClick={() => notifyLocked(item.name)}
                                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-[#64748B]/60 hover:bg-white/5"
                              >
                                <item.icon className="w-4 h-4" strokeWidth={2} />
                                <span className="text-[12px] font-medium">{item.name}</span>
                                <Lock className="ml-auto w-3 h-3 shrink-0" strokeWidth={2.5} />
                              </button>
                            );
                          }
                          return (
                            <NavLink
                              key={i}
                              to={resolvedItemPath}
                              onClick={handleMobileNavClick}
                              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-colors
                                ${isSubActive
                                  ? 'bg-[#00A86B]/10 text-[#00A86B]'
                                  : 'text-[#64748B] hover:bg-white/5 hover:text-white'}`}
                            >
                              <item.icon className="w-4 h-4" strokeWidth={2} />
                              <span className={`text-[12px] ${isSubActive ? 'font-bold' : 'font-medium'}`}>{item.name}</span>
                              {item.isNew && <span className="ml-auto text-[9px] font-bold bg-[#00A86B] text-white px-1.5 py-0.5 rounded-md shrink-0">New</span>}
                            </NavLink>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
