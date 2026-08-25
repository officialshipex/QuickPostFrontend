import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { TableLoader } from '../../ui/TableLoader';
import { useAdminTab } from '../../../context/AdminUserContext';
import { Lock } from 'lucide-react';
import { useAdminLayoutShell } from './AdminLayoutContext';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const isInsideShell = useAdminLayoutShell();
  const location = useLocation();
  const navigate = useNavigate();
  const { loadingAdminTab } = useAdminTab();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [accessDeniedMsg, setAccessDeniedMsg] = useState<string | null>(null);
  const isImpersonating = !!localStorage.getItem('admin_token_backup');
  const awaitingSecondKeyRef = useRef(false);
  const awaitingKeyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keyboard shortcut: "A" then "O" opens Add Order (user side, desktop only)
  useEffect(() => {
    if (!location.pathname.startsWith('/user/')) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTypingTarget =
        !!target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);
      if (isTypingTarget || e.metaKey || e.ctrlKey || e.altKey) {
        awaitingSecondKeyRef.current = false;
        return;
      }

      const key = e.key.toLowerCase();

      if (!awaitingSecondKeyRef.current) {
        if (key === 'a') {
          awaitingSecondKeyRef.current = true;
          if (awaitingKeyTimeoutRef.current) clearTimeout(awaitingKeyTimeoutRef.current);
          awaitingKeyTimeoutRef.current = setTimeout(() => {
            awaitingSecondKeyRef.current = false;
          }, 1000);
        }
        return;
      }

      awaitingSecondKeyRef.current = false;
      if (awaitingKeyTimeoutRef.current) clearTimeout(awaitingKeyTimeoutRef.current);
      if (key === 'o') {
        e.preventDefault();
        navigate('/user/add-order');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (awaitingKeyTimeoutRef.current) clearTimeout(awaitingKeyTimeoutRef.current);
    };
  }, [location.pathname, navigate]);

  useEffect(() => {
    if (isInsideShell) return;
    const handler = (e: Event) => {
      setAccessDeniedMsg((e as CustomEvent).detail || 'You do not have permission to perform this action.');
    };
    window.addEventListener('access-denied', handler);
    return () => window.removeEventListener('access-denied', handler);
  }, [isInsideShell]);

  // When inside AdminShell, the shell already renders sidebar, header, animation,
  // and the access-denied modal — just pass children through.
  if (isInsideShell) return <>{children}</>;

  const showHeader =
    location.pathname.startsWith('/admin/') ||
    location.pathname.startsWith('/user/') ||
    location.pathname.startsWith('/internal-crm/');

  return (
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
          {children}
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
  );
}
