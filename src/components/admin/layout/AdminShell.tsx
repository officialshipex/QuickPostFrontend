import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { TableLoader } from '../../ui/TableLoader';
import { useAdminTab } from '../../../context/AdminUserContext';
import { Lock } from 'lucide-react';
import { AdminLayoutShellProvider } from './AdminLayoutContext';

export function AdminShell() {
  const location = useLocation();
  const { loadingAdminTab } = useAdminTab();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [accessDeniedMsg, setAccessDeniedMsg] = useState<string | null>(null);
  const isImpersonating = !!localStorage.getItem('admin_token_backup');

  useEffect(() => {
    const handler = (e: Event) => {
      setAccessDeniedMsg((e as CustomEvent).detail || 'You do not have permission to perform this action.');
    };
    window.addEventListener('access-denied', handler);
    return () => window.removeEventListener('access-denied', handler);
  }, []);

  const showHeader =
    location.pathname.startsWith('/admin/') ||
    location.pathname.startsWith('/user/') ||
    location.pathname.startsWith('/internal-crm/');

  // Strip the tab-slug segment so switching tabs within the same page
  // (/admin/orders/pending → /admin/orders/delivered) doesn't retrigger the animation.
  const parts = location.pathname.split('/').filter(Boolean);
  const animKey = '/' + parts.slice(0, 2).join('/');

  return (
    <AdminLayoutShellProvider>
      <div className="admin-dashboard-layout flex min-h-screen bg-[#F8FAFC] text-[#0F172A] selection:bg-[#00A86B]/20 selection:text-[#00A86B] text-sm">

        {loadingAdminTab && (
          <div className="fixed inset-0 z-[400] bg-white">
            <TableLoader />
          </div>
        )}

        <AdminSidebar
          isMobileOpen={isMobileSidebarOpen}
          onMobileClose={() => setIsMobileSidebarOpen(false)}
        />

        <div className={`flex-1 flex flex-col min-w-0 md:ml-[68px] ${isImpersonating ? 'pt-8' : ''}`}>
          {showHeader && (
            <AdminHeader onMobileMenuToggle={() => setIsMobileSidebarOpen(true)} />
          )}
          <main className="flex-1 p-4 md:p-6 w-full min-w-0 overflow-x-hidden">
            <motion.div
              key={animKey}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
            >
              <Outlet />
            </motion.div>
          </main>
        </div>

        {accessDeniedMsg && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setAccessDeniedMsg(null)} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 z-10 text-center">
              <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="text-sm font-bold text-[#0F172A] mb-1">Access Restricted</h3>
              <p className="text-xs text-[#64748B] mb-5">{accessDeniedMsg}</p>
              <button
                onClick={() => setAccessDeniedMsg(null)}
                className="w-full h-9 rounded-full bg-[#0F172A] text-white text-xs font-bold hover:bg-[#1E293B]"
              >
                OK, Got It
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayoutShellProvider>
  );
}
