import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/apiClient';
import { getToken, getRoleFromToken } from '../utils/session';

interface AdminTabContextType {
  isAdmin: boolean;
  adminTab: boolean;
  loadingAdminTab: boolean;
  currentUserId: string;
  userName: string;
  userEmail: string;
  profileImage: string;
  walletBalance: number;
  walletHold: number;
  toggleAdminTab: (value: boolean) => Promise<void>;
}

const AdminTabContext = createContext<AdminTabContextType>({
  isAdmin: false,
  adminTab: false,
  loadingAdminTab: true,
  currentUserId: '',
  userName: '',
  userEmail: '',
  profileImage: '',
  walletBalance: 0,
  walletHold: 0,
  toggleAdminTab: async () => {},
});

export function AdminUserProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(() => {
    const token = getToken();
    return token ? getRoleFromToken(token) === 'admin' : false;
  });
  const [adminTab, setAdminTab] = useState(false);
  const [loadingAdminTab, setLoadingAdminTab] = useState(true);
  const [currentUserId, setCurrentUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletHold, setWalletHold] = useState(0);

  const fetchAdminTab = useCallback(async () => {
    if (!getToken()) { setLoadingAdminTab(false); return; }
    try {
      const res = await apiClient.get('/user/getUserDetails');
      const user = res.data?.user;
      const userIsAdmin = user?.isAdmin === true;
      const resolvedAdminTab = user?.adminTab === true;

      setIsAdmin(userIsAdmin);
      setAdminTab(resolvedAdminTab);
      setCurrentUserId(user?._id || '');
      setUserName(user?.fullname || '');
      setUserEmail(user?.email || '');
      setProfileImage(user?.profileImage || '');
      setWalletBalance(user?.Wallet?.balance || 0);
      setWalletHold(user?.Wallet?.holdAmount || 0);
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
      // Full reload so all data, context, and routes reset cleanly
      window.location.href = value ? '/admin/dashboard' : '/user/dashboard';
    } catch (e) {
      console.error('[AdminUserContext] Failed to toggle admin tab:', e);
    }
  };

  return (
    <AdminTabContext.Provider value={{
      isAdmin, adminTab, loadingAdminTab, currentUserId,
      userName, userEmail, profileImage, walletBalance, walletHold,
      toggleAdminTab,
    }}>
      {children}
    </AdminTabContext.Provider>
  );
}

export const useAdminTab = () => useContext(AdminTabContext);
