import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useAdminTab } from '../../context/AdminUserContext';

// Maps route prefixes → permission module keys
const ROUTE_PERMISSION_MAP: Record<string, string> = {
  '/orders':             'orders',
  '/ndr':                'ndr',
  '/cod':                'finance',
  '/wallet':             'finance',
  '/reports':            'reports',
  '/support':            'support',
  '/weight-discrepancy': 'tools',
  '/notification':       'tools',
  '/announcement':       'tools',
  '/users':              'setupAndManage',
  '/kyc':                'setupAndManage',
  '/settings':           'setupAndManage',
  '/couriers':           'courier',
  '/rate-card':          'courier',
  '/vendors':            'courier',
};

function getModuleForPath(pathname: string): string | null {
  // Strip /admin/ or /user/ prefix, then match
  const stripped = pathname.replace(/^\/(admin|user)/, '');
  for (const [prefix, module] of Object.entries(ROUTE_PERMISSION_MAP)) {
    if (stripped.startsWith(prefix)) return module;
  }
  return null;
}

interface ProtectedRouteProps {
  allowedRoles?: ('admin' | 'user')[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, role } = useAuth();
  const { adminTab, loadingAdminTab, isEmployee, employeeAccessRights } = useAdminTab();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles) {
    const adminOnlyRoute = allowedRoles.includes('admin') && !allowedRoles.includes('user');
    const userOnlyRoute  = allowedRoles.includes('user')  && !allowedRoles.includes('admin');

    if (adminOnlyRoute) {
      if (role !== 'admin') return <Navigate to="/user/dashboard" replace />;
      if (loadingAdminTab) return null;
      if (!adminTab && !isEmployee) return <Navigate to="/user/dashboard" replace />;
    }

    if (userOnlyRoute) {
      if (role === 'admin') {
        if (loadingAdminTab) return null;
        if (adminTab && !isEmployee) return <Navigate to="/admin/dashboard" replace />;
      } else if (role !== 'user') {
        return <Navigate to="/login" replace />;
      }
    }
  }

  // Employee module permission check — block navigation to modules they can't view
  if (isEmployee && !loadingAdminTab) {
    const module = getModuleForPath(location.pathname);
    if (module && employeeAccessRights[module]?.view !== true) {
      // Redirect to their landing page
      const landing = role === 'admin' ? '/admin/dashboard' : '/user/dashboard';
      return <Navigate to={landing} replace />;
    }
  }

  return <Outlet />;
}
