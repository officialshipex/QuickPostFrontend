import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useAdminTab } from '../../context/AdminUserContext';

interface ProtectedRouteProps {
  allowedRoles?: ('admin' | 'user')[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, role } = useAuth();
  const { adminTab, loadingAdminTab } = useAdminTab();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles) {
    const adminOnlyRoute = allowedRoles.includes('admin') && !allowedRoles.includes('user');
    const userOnlyRoute  = allowedRoles.includes('user')  && !allowedRoles.includes('admin');

    if (adminOnlyRoute) {
      if (role !== 'admin') {
        // Not an admin at all → user dashboard
        return <Navigate to="/user/dashboard" replace />;
      }
      // Is admin — wait for adminTab to load before deciding
      if (loadingAdminTab) return null;
      if (!adminTab) {
        // Admin switched to user-view → block admin routes
        return <Navigate to="/user/dashboard" replace />;
      }
    }

    if (userOnlyRoute) {
      if (role === 'admin') {
        // Admin trying user routes — need to know their current view mode
        if (loadingAdminTab) return null;
        if (adminTab) {
          // Admin is in admin-view mode → block user routes
          return <Navigate to="/admin/dashboard" replace />;
        }
        // Admin in user-view mode → allow
      } else if (role !== 'user') {
        return <Navigate to="/login" replace />;
      }
    }
  }

  return <Outlet />;
}
