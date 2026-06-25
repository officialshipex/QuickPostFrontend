import { useState } from 'react';

type Role = 'admin' | 'user' | null;

export function useAuth() {
  const [role, setRole] = useState<Role>(() => {
    return (localStorage.getItem('auth_role') as Role) || null;
  });

  const isAuthenticated = role !== null;

  const login = (token: string, userRole: 'admin' | 'user') => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_role', userRole);
    setRole(userRole);
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_role');
    setRole(null);
    window.location.href = '/login';
  };

  return { isAuthenticated, role, login, logout };
}
