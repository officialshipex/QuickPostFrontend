import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const showHeader = [
    '/admin/dashboard',
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
    '/admin/kyc',
    '/admin/reports'
  ].includes(location.pathname);

  return (
    <div className="admin-dashboard-layout flex min-h-screen bg-[#F8FAFC] text-[#0F172A] selection:bg-[#00A86B]/20 selection:text-[#00A86B] text-sm">
      <AdminSidebar />
      <div 
        className="flex-1 flex flex-col min-w-0" 
        style={{ marginLeft: 68 }}
      >
        {showHeader && <AdminHeader />}
        <main className="flex-1 p-4 md:p-6 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
