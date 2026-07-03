import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/apiClient';
import { getToken } from '../utils/session';

interface AdminTabContextType {
  isAdmin: boolean;
  adminTab: boolean;
  loadingAdminTab: boolean;
  currentUserId: string;
  toggleAdminTab: (value: boolean) => Promise<void>;
}

const AdminTabContext = createContext<AdminTabContextType>({
  isAdmin: false,
  adminTab: false,
  loadingAdminTab: true,
  currentUserId: '',
  toggleAdminTab: async () => {},
});

export function AdminUserProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminTab, setAdminTab] = useState(false);
  const [loadingAdminTab, setLoadingAdminTab] = useState(true);
  const [currentUserId, setCurrentUserId] = useState('');

  const fetchAdminTab = useCallback(async () => {
    if (!getToken()) { setLoadingAdminTab(false); return; }
    try {
      const res = await apiClient.get('/user/getUserDetails');
      const user = res.data?.user;
      setIsAdmin(user?.isAdmin === true);
      setAdminTab(user?.adminTab === true);
      setCurrentUserId(user?._id || '');
    } catch (e) {
      console.error('[AdminUserContext] Failed to fetch user details:', e);
    } finally {
      setLoadingAdminTab(false);
    }
  }, []);

  useEffect(() => { fetchAdminTab(); }, [fetchAdminTab]);

  const toggleAdminTab = async (value: boolean) => {
    try {
      await apiClient.post('/user/getUserDetails', { adminTab: value });
      setAdminTab(value);
    } catch (e) {
      console.error('[AdminUserContext] Failed to toggle admin tab:', e);
    }
  };

  return (
    <AdminTabContext.Provider value={{ isAdmin, adminTab, loadingAdminTab, currentUserId, toggleAdminTab }}>
      {children}
    </AdminTabContext.Provider>
  );
}

export const useAdminTab = () => useContext(AdminTabContext);
