import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface ProtectedRouteProps {
  allowedRoles?: ('admin' | 'user')[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // If authenticated but wrong role, redirect to appropriate dashboard
    return <Navigate to={role === 'admin' ? "/admin/dashboard" : "/dashboard"} replace />;
  }

  return <Outlet />;
}
