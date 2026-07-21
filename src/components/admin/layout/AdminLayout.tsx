import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const showHeader =
    location.pathname.startsWith('/admin/') ||
    location.pathname.startsWith('/user/') ||
    location.pathname.startsWith('/internal-crm/');

  return (
    <div className="admin-dashboard-layout flex min-h-screen bg-[#F8FAFC] text-[#0F172A] selection:bg-[#00A86B]/20 selection:text-[#00A86B] text-sm overflow-x-hidden">
      <AdminSidebar
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 md:ml-[68px] overflow-x-hidden">
        {showHeader && (
          <AdminHeader onMobileMenuToggle={() => setIsMobileSidebarOpen(true)} />
        )}
        <main className="flex-1 p-4 md:p-6 w-full min-w-0 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}

