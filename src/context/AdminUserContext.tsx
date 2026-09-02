import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { apiClient } from '../services/apiClient';
import { getToken, getRoleFromToken, isEmployeeToken, getEmployeeFromToken } from '../utils/session';

export interface EmployeeAccessRights {
  view?: boolean;
  edit?: boolean;
  delete?: boolean;
}

interface AdminTabContextType {
  isAdmin: boolean;
  adminTab: boolean;
  loadingAdminTab: boolean;
  currentUserId: string;
  userName: string;
  userEmail: string;
  businessName: string;
  profileImage: string;
  walletBalance: number;
  walletHold: number;
  creditLimit: number;
  isEmployee: boolean;
  employeeId: string;
  employeeAccessRights: Record<string, EmployeeAccessRights>;
  parentEmail: string;
  showOnboarding: boolean;
  setShowOnboarding: (value: boolean) => void;
  toggleAdminTab: (value: boolean) => Promise<void>;
  refetchUser: () => Promise<void>;
}

const AdminTabContext = createContext<AdminTabContextType>({
  isAdmin: false,
  adminTab: false,
  loadingAdminTab: true,
  currentUserId: '',
  userName: '',
  userEmail: '',
  businessName: '',
  profileImage: '',
  walletBalance: 0,
  walletHold: 0,
  creditLimit: 0,
  isEmployee: false,
  employeeId: '',
  employeeAccessRights: {},
  parentEmail: '',
  showOnboarding: false,
  setShowOnboarding: () => {},
  toggleAdminTab: async () => {},
  refetchUser: async () => {},
});

export function AdminUserProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(() => {
    const token = getToken();
    return token ? getRoleFromToken(token) === 'admin' : false;
  });
  const [adminTab, setAdminTab] = useState(false);
  const [loadingAdminTab, setLoadingAdminTab] = useState(true);
  const [currentUserId, setCurrentUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletHold, setWalletHold] = useState(0);
  const [creditLimit, setCreditLimit] = useState(0);
  const [isEmployee, setIsEmployee] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [employeeAccessRights, setEmployeeAccessRights] = useState<Record<string, EmployeeAccessRights>>({});
  const [parentEmail, setParentEmail] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(false);

  const fetchAdminTab = useCallback(async () => {
    const token = getToken();
    if (!token) { setLoadingAdminTab(false); return; }

    // ── Employee token path ────────────────────────────────────────────────────
    if (isEmployeeToken(token)) {
      const emp = getEmployeeFromToken(token);
      setIsAdmin(emp?.isAdmin ?? false);
      setAdminTab(emp?.adminTab ?? false);
      setIsEmployee(true);
      setEmployeeId(emp?.employeeId || '');
      try {
        const res = await apiClient.get('/staffRole/verify');
        const employee = res.data?.employee;
        const parentUser = res.data?.user;
        if (employee) {
          setEmployeeAccessRights(employee.accessRights || {});
          setUserName(employee.fullName || '');
          setUserEmail(employee.email || '');
          setParentEmail(parentUser?.email || '');
          // currentUserId: for user employees use parent's _id so APIs filter correctly
          setCurrentUserId(parentUser?._id || employee._id || '');
          setBusinessName(parentUser?.company || '');
          setWalletBalance(parentUser?.Wallet?.balance || 0);
          setWalletHold(parentUser?.Wallet?.holdAmount || 0);
          setCreditLimit(parentUser?.Wallet?.creditLimit || 0);
        }
      } catch (e) {
        console.error('[AdminUserContext] Employee verify failed:', e);
      } finally {
        setLoadingAdminTab(false);
      }
      return;
    }

    // ── Regular user / admin path ──────────────────────────────────────────────
    try {
      const res = await apiClient.get('/user/getUserDetails');
      const user = res.data?.user;
      setIsAdmin(user?.isAdmin === true);
      setAdminTab(user?.adminTab === true);
      setCurrentUserId(user?._id || '');
      setUserName(user?.fullname || '');
      setUserEmail(user?.email || '');
      setBusinessName(user?.company || '');
      setProfileImage(user?.profileImage || '');
      setWalletBalance(user?.Wallet?.balance || 0);
      setWalletHold(user?.Wallet?.holdAmount || 0);
      setCreditLimit(user?.Wallet?.creditLimit || 0);
      setIsEmployee(false);
      setEmployeeAccessRights({});
      setParentEmail('');
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
      window.location.href = value ? '/admin/dashboard' : '/user/dashboard';
    } catch (e) {
      console.error('[AdminUserContext] Failed to toggle admin tab:', e);
    }
  };

  return (
    <AdminTabContext.Provider value={{
      isAdmin, adminTab, loadingAdminTab, currentUserId,
      userName, userEmail, businessName, profileImage, walletBalance, walletHold, creditLimit,
      isEmployee, employeeId, employeeAccessRights, parentEmail,
      showOnboarding, setShowOnboarding,
      toggleAdminTab,
      refetchUser: fetchAdminTab,
    }}>
      {children}
    </AdminTabContext.Provider>
  );
}

export const useAdminTab = () => useContext(AdminTabContext);
