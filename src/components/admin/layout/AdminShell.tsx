import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { TableLoader } from '../../ui/TableLoader';
import { AccessDeniedModal } from '../../ui/AccessDeniedModal';
import { useAdminTab } from '../../../context/AdminUserContext';
import { canAccessRoute, NO_ACCESS_MESSAGE } from '../../../utils/permissions';
import { AdminLayoutShellProvider } from './AdminLayoutContext';

export function AdminShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { loadingAdminTab, isEmployee, isAdmin, adminTab, employeeAccessRights } = useAdminTab();
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

  // Employees may only open what their rights allow. The forbidden page is never mounted (so it
  // never fetches), the popup explains why, and OK returns them to their own dashboard.
  const employeeBlocked = isEmployee && !loadingAdminTab && !canAccessRoute(employeeAccessRights, location.pathname);
  const landing = isAdmin && adminTab ? '/admin/dashboard' : '/user/dashboard';

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
              {employeeBlocked ? null : <Outlet />}
            </motion.div>
          </main>
        </div>

        {employeeBlocked ? (
          <AccessDeniedModal message={NO_ACCESS_MESSAGE} onClose={() => navigate(landing, { replace: true })} />
        ) : (
          accessDeniedMsg && <AccessDeniedModal message={accessDeniedMsg} onClose={() => setAccessDeniedMsg(null)} />
        )}
      </div>
    </AdminLayoutShellProvider>
  );
}
