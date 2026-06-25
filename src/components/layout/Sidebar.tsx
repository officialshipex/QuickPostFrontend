import React, { useState } from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Truck,
  Target,
  IndianRupee,
  User,
  Headphones,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Scan,
  Users,
  UserPlus,
  AlertCircle,
  BarChart2,
  Building2
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: ShoppingCart, label: 'Orders', path: '/orders' },
  { icon: Package, label: 'Shipments', path: '/shipments' },
  { icon: Truck, label: 'Tracking', path: '/tracking' },
  { icon: Target, label: 'NDR', path: '/ndr' },
  { icon: IndianRupee, label: 'Billing', path: '/billing' },
  { icon: User, label: 'Account', path: '/account' },
  { icon: Headphones, label: 'Support', path: '/support' },
  { icon: FileText, label: 'Reports', path: '/reports' },
];

const crmItems = [
  { icon: Scan, label: 'Shipment Listing', path: '/internal-crm/shipments' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const isCrmRoute = location.pathname.startsWith('/internal-crm');
  const [crmOpen, setCrmOpen] = useState(isCrmRoute);

  return (
    <aside className={twMerge(
      "bg-[#00A86B] text-white transition-all duration-300 flex flex-col items-center py-6 h-screen sticky top-0",
      collapsed ? "w-20" : "w-64"
    )}>
      <div className="mb-8 w-full flex justify-center items-center px-4">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
          <Package className="w-6 h-6 text-white" />
        </div>
        {!collapsed && <span className="ml-3 font-bold text-xl tracking-tight">QuickPost</span>}
      </div>

      <nav className="flex-1 w-full px-3 space-y-2 overflow-y-auto overflow-x-hidden no-scrollbar">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.label}
              to={item.path}
              className={twMerge(
                "flex items-center p-3 rounded-xl transition-colors w-full group",
                isActive ? "bg-white/20" : "hover:bg-white/10",
                collapsed ? "justify-center" : "justify-start px-4"
              )}
              title={item.label}
            >
              <item.icon className={twMerge("w-5 h-5 shrink-0", isActive ? "text-white" : "text-white/80 group-hover:text-white")} />
              {!collapsed && (
                <span className={twMerge("ml-3 font-medium text-sm whitespace-nowrap", isActive ? "text-white" : "text-white/90")}>
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}

        {/* Internal CRM Section */}
        <div className="pt-2">
          {!collapsed && (
            <div className="px-1 pb-1">
              <div className="border-t border-white/20 mb-2" />
            </div>
          )}
          {collapsed && <div className="border-t border-white/20 mb-2 mx-1" />}

          <button
            onClick={() => {
              if (collapsed) {
                navigate('/internal-crm/shipments');
              } else {
                setCrmOpen(!crmOpen);
              }
            }}
            title="Internal CRM"
            className={twMerge(
              "flex items-center p-3 rounded-xl transition-colors w-full group",
              (crmOpen && !collapsed) || (collapsed && isCrmRoute) ? "bg-white/20" : "hover:bg-white/10",
              collapsed ? "justify-center" : "justify-start px-4"
            )}
          >
            <Users className={twMerge("w-5 h-5 shrink-0", "text-white/80 group-hover:text-white")} />
            {!collapsed && (
              <>
                <span className="ml-3 font-medium text-sm whitespace-nowrap text-white/90 group-hover:text-white flex-1 text-left">
                  Internal CRM
                </span>
                <span className="ml-1 text-[10px] font-semibold bg-white/20 text-white px-1.5 py-0.5 rounded-full mr-1">BETA</span>
                {crmOpen ? <ChevronUp className="w-4 h-4 text-white/70" /> : <ChevronDown className="w-4 h-4 text-white/70" />}
              </>
            )}
          </button>

          {!collapsed && crmOpen && (
            <div className="mt-1 space-y-1 pl-2">
              {crmItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.label}
                    to={item.path}
                    className={twMerge(
                      "flex items-center px-3 py-2.5 rounded-xl transition-colors w-full group",
                      isActive ? "bg-white/20" : "hover:bg-white/10"
                    )}
                    title={item.label}
                  >
                    <item.icon className={twMerge("w-4 h-4 shrink-0", isActive ? "text-white" : "text-white/70 group-hover:text-white")} />
                    <span className={twMerge("ml-3 font-medium text-xs whitespace-nowrap", isActive ? "text-white" : "text-white/80 group-hover:text-white/95")}>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      <div className="mt-auto w-full px-3 pt-4 border-t border-white/10 flex justify-center">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-xl hover:bg-white/10 transition-colors text-white/80 hover:text-white w-full flex items-center justify-center"
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <div className="flex items-center gap-2"><ChevronLeft className="w-5 h-5" /><span className="text-sm font-medium">Collapse</span></div>}
        </button>
      </div>
    </aside>
  );
}
