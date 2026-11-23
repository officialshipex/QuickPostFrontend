import axios from 'axios';
import { getToken, setToken, removeToken, isEmployeeToken } from '../utils/session';
import { isCargoUrl } from '../utils/shippingMode';
import { getDeviceId } from '../utils/deviceId';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Which panel this tab is in — the backend keeps announcements, tickets, reports, employees, channels,
  // wallet history and notifications separate per panel (backend utils/shippingMode.js).
  config.headers['x-shipping-mode'] = isCargoUrl() ? 'cargo' : 'b2c';
  // This computer, for the OTP check on wallet / COD / rate card / courier / system sections (utils/deviceId.ts)
  config.headers['x-device-id'] = getDeviceId();
  const devTenant = localStorage.getItem('dev_tenant_key') || localStorage.getItem('dev_tenant');
  if (devTenant && !config.url?.startsWith('/platform-admin')) {
    config.headers['x-tenant-key'] = devTenant;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Signed in as someone and that session ended: back to the admin's own session.
      const adminBackup = localStorage.getItem('admin_token_backup');
      if (adminBackup) {
        localStorage.removeItem('admin_token_backup');
        setToken(adminBackup);
        window.location.href = '/admin/dashboard';
        return Promise.reject(error);
      }
      // An employee whose session ended (expired, deactivated) goes back to the employee login
      const token = getToken();
      const wasEmployee = !!token && isEmployeeToken(token);
      removeToken();
      window.location.href = wasEmployee ? '/employee-login' : '/login';
    }
    if (error.response?.status === 403) {
      window.dispatchEvent(new CustomEvent('access-denied', {
        detail: error.response?.data?.message || 'You do not have permission to perform this action.',
      }));
    }
    // A protected section refused this computer: open the OTP popup (components/security/SensitiveOtpListener.tsx).
    // Same names as services/sensitiveAccess.ts (not imported from there: it imports this file).
    if (error.response?.status === 428 && error.response?.data?.code === 'SENSITIVE_OTP_REQUIRED') {
      window.dispatchEvent(new CustomEvent('sensitive-otp-required', { detail: error.response.data.message }));
    }
    return Promise.reject(error);
  }
);
