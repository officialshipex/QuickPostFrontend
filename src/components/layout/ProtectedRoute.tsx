import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useAdminTab } from '../../context/AdminUserContext';
import { TableLoader } from '../ui/TableLoader';
import { getToken, isEmployeeToken, removeToken } from '../../utils/session';

function AccountLoadError() {
  const logout = () => {
    const token = getToken();
    const wasEmployee = !!token && isEmployeeToken(token);
    removeToken();
    window.location.href = wasEmployee ? '/employee-login' : '/login';
  };
  return (
    <div className="fixed inset-0 z-[400] bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm max-w-sm w-full p-6 text-center">
        <h2 className="text-[16px] font-semibold text-[#0F172A]">We couldn't load your account</h2>
        <p className="text-[13px] text-[#64748B] mt-2">
          This is usually a short connection problem. Please try again in a moment. If it keeps happening, log out and sign in again.
        </p>
        <div className="flex gap-2 mt-5">
          <button onClick={logout} className="flex-1 h-10 rounded-lg border border-[#E2E8F0] text-[13px] font-semibold text-[#64748B] hover:bg-[#F8FAFC]">
            Log out
          </button>
          <button onClick={() => window.location.reload()} className="flex-1 h-10 rounded-lg bg-[#00A86B] text-white text-[13px] font-semibold hover:bg-[#008F5C]">
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}

interface ProtectedRouteProps {
  allowedRoles?: ('admin' | 'user')[];
}

// Login / panel check. Employee MODULE permissions are enforced in AdminShell (which can show the
// "no access" popup without unmounting the sidebar); the backend is the real boundary for writes.
export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, role } = useAuth();
  const { adminTab, loadingAdminTab, isEmployee, profileError, currentUserId } = useAdminTab();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // No page runs until the signed-in account is known: a page mounted earlier would ask for its lists
  // without an account id (2026-11-27: a seller whose profile failed to load was shown other sellers' orders
  // by the old backend). The backend pins sellers to their own data anyway; this keeps the panel honest.
  if (loadingAdminTab) {
    return <div className="fixed inset-0 z-[400] bg-white"><TableLoader /></div>;
  }
  if (profileError || !currentUserId) {
    return <AccountLoadError />;
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
