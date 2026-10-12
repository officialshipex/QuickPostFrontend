import axios, { AxiosError, type AxiosAdapter } from 'axios';
import { getToken, removeToken } from '../utils/session';

/* API client for QuickPost Cargo pages (src/pages/cargo/*).
   Cargo has its own backend namespace: `${VITE_API_URL}/cargo/...`. Until that backend exists,
   CARGO_BACKEND_READY = false and requests never leave the browser:
     • GET  → 200 with an empty body, so Cargo screens render their normal empty states
     • others → rejected with "Cargo backend is not connected yet." (shown by the page's error toast)
   Flip CARGO_BACKEND_READY to true once the Cargo APIs are live — no page changes needed. */

export const CARGO_BACKEND_READY = false;

const API_BASE = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000/api/v1';
export const CARGO_API_BASE = `${API_BASE}/cargo`;

const OFFLINE_MESSAGE = 'Cargo backend is not connected yet.';

const offlineAdapter: AxiosAdapter = async (config) => {
  if ((config.method || 'get').toLowerCase() === 'get') {
    return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
  }
  const response = { data: { message: OFFLINE_MESSAGE }, status: 503, statusText: 'Service Unavailable', headers: {}, config };
  throw new AxiosError(OFFLINE_MESSAGE, 'ERR_CARGO_OFFLINE', config, null, response);
};

export const cargoApiClient = axios.create({
  baseURL: CARGO_API_BASE,
  headers: { 'Content-Type': 'application/json' },
  ...(CARGO_BACKEND_READY ? {} : { adapter: offlineAdapter }),
});

cargoApiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const devTenant = localStorage.getItem('dev_tenant_key') || localStorage.getItem('dev_tenant');
  if (devTenant) config.headers['x-tenant-key'] = devTenant;
  return config;
});

cargoApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      removeToken();
      window.location.href = '/login';
    }
    if (error.response?.status === 403) {
      window.dispatchEvent(new CustomEvent('access-denied', {
        detail: error.response?.data?.message || 'You do not have permission to perform this action.',
      }));
    }
    return Promise.reject(error);
  }
);
