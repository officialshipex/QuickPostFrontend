import { useState } from 'react';
import { getToken, setToken, removeToken, getRoleFromToken, isTokenExpired } from '../utils/session';

type Role = 'admin' | 'user' | null;

export function useAuth() {
  const [role, setRole] = useState<Role>(() => {
    const token = getToken();
    if (!token || isTokenExpired(token)) {
      removeToken();
      return null;
    }
    return getRoleFromToken(token);
  });

  const isAuthenticated = role !== null;

  const login = (token: string) => {
    setToken(token);
    setRole(getRoleFromToken(token));
  };

  const logout = () => {
    removeToken();
    setRole(null);
    window.location.href = '/login';
  };

  return { isAuthenticated, role, login, logout };
}
