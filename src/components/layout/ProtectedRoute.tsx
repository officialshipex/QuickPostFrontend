import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useAdminTab } from '../../context/AdminUserContext';

interface ProtectedRouteProps {
  allowedRoles?: ('admin' | 'user')[];
}

// Login / panel check. Employee MODULE permissions are enforced in AdminShell (which can show the
// "no access" popup without unmounting the sidebar); the backend is the real boundary for writes.
export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, role } = useAuth();
  const { adminTab, loadingAdminTab, isEmployee } = useAdminTab();

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

  return <Outlet />;
}
