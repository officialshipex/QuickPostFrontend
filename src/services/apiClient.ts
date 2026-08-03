import axios from 'axios';
import { getToken, removeToken } from '../utils/session';

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
  return config;
});

apiClient.interceptors.response.use(
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
