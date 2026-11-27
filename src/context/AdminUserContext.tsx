import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { apiClient } from '../services/apiClient';
import { getToken, removeToken, getRoleFromToken, isEmployeeToken, getEmployeeFromToken } from '../utils/session';
import { isCargoUrl } from '../utils/shippingMode';
import { hasAccessBeyondSales } from '../utils/permissions';

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
  /** The signed-in account could not be loaded (after retries): the panel must not run (ProtectedRoute). */
  profileError: boolean;
  userName: string;
  userEmail: string;
  businessName: string;
  profileImage: string;
  /** The wallet of the panel this page is in: Cargo panel = the Cargo wallet, B2C panel = the main (B2C) wallet. */
  walletBalance: number;
  walletHold: number;
  creditLimit: number;
  /** Both wallets, for the B2C <-> Cargo transfer (backend wallet/cargoWallet.js). */
  mainWalletBalance: number;
  mainWalletHold: number;
  cargoWalletBalance: number;
  hasCargoWallet: boolean;
  isEmployee: boolean;
  employeeId: string;
  employeeAccessRights: Record<string, EmployeeAccessRights>;
  /** false until the employee's live rights have been fetched (rights are never read from the token) */
  employeeRightsLoaded: boolean;
  /** Admin-panel employee on the Sales team — works from the Sales Dashboard, not the main dashboard. */
  isSalesEmployee: boolean;
  /** A sales person also given admin-panel modules (Orders, NDR, …): those open next to their Sales Dashboard. */
  salesHasAdminAccess: boolean;
  /** Admin-panel employee on the support Tech team: sees only the tickets Support moved to Tech. */
  isTechSupport: boolean;
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
  profileError: false,
  userName: '',
  userEmail: '',
  businessName: '',
  profileImage: '',
  walletBalance: 0,
  walletHold: 0,
  creditLimit: 0,
  mainWalletBalance: 0,
  mainWalletHold: 0,
  cargoWalletBalance: 0,
  hasCargoWallet: false,
  isEmployee: false,
  employeeId: '',
  employeeAccessRights: {},
  employeeRightsLoaded: false,
  isSalesEmployee: false,
  salesHasAdminAccess: false,
  isTechSupport: false,
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
  const [mainWalletBalance, setMainWalletBalance] = useState(0);
  const [mainWalletHold, setMainWalletHold] = useState(0);
  const [cargoWalletBalance, setCargoWalletBalance] = useState(0);
  const [hasCargoWallet, setHasCargoWallet] = useState(false);
  const [isEmployee, setIsEmployee] = useState(false);

  // Both wallets from the account record; the page shows the one of its own panel (Cargo panel = Cargo wallet).
  const applyWallets = useCallback((main: any, cargo: any) => {
    const m = main && typeof main === 'object' ? main : {};
    const c = cargo && typeof cargo === 'object' ? cargo : null;
    setMainWalletBalance(Number(m.balance || 0));
    setMainWalletHold(Number(m.holdAmount || 0));
    setCargoWalletBalance(Number(c?.balance || 0));
    setHasCargoWallet(Boolean(c));
    const shown = isCargoUrl() ? c || {} : m;
    setWalletBalance(Number(shown.balance || 0));
    setWalletHold(Number(shown.holdAmount || 0));
    setCreditLimit(Number(shown.creditLimit || 0));
  }, []);
  const [employeeId, setEmployeeId] = useState('');
  const [employeeAccessRights, setEmployeeAccessRights] = useState<Record<string, EmployeeAccessRights>>({});
  const [employeeRightsLoaded, setEmployeeRightsLoaded] = useState(false);
  const [employeeTeam, setEmployeeTeam] = useState('');
  const [employeeSupportRole, setEmployeeSupportRole] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(false);

  // The account could not be loaded (server restarting, network, 5xx) after retries. The panel must NOT run
  // without knowing who is signed in: pages would ask for lists with no account id. ProtectedRoute shows a
  // "could not load your account" screen instead (a 401 still logs out through the api client).
  const [profileError, setProfileError] = useState(false);
  const loadedOnce = useRef(false); // a later refetch failing must not lock a panel that already loaded

  const fetchAdminTab = useCallback(async () => {
    const token = getToken();
    if (!token) { setLoadingAdminTab(false); return; }

    // Network errors and 5xx are retried (twice, 1 s then 2 s); 4xx answers are final.
    const getWithRetry = async (url: string) => {
      for (let attempt = 0; ; attempt++) {
        try {
          return await apiClient.get(url);
        } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
          const status = e?.response?.status;
          const retryable = !status || status >= 500;
          if (!retryable || attempt >= 2) throw e;
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        }
      }
    };

    // ── Employee token path ────────────────────────────────────────────────────
    if (isEmployeeToken(token)) {
      const emp = getEmployeeFromToken(token);
      setIsAdmin(emp?.isAdmin ?? false);
      setAdminTab(emp?.adminTab ?? false);
      setIsEmployee(true);
      setEmployeeId(emp?.employeeId || '');
      try {
        const res = await getWithRetry('/staffRole/verify');
        const employee = res.data?.employee;
        const parentUser = res.data?.user;
        if (!employee || !(parentUser?._id || employee._id)) throw new Error('Employee account missing in response');
        setProfileError(false); loadedOnce.current = true;
        if (employee) {
          setEmployeeAccessRights(employee.accessRights || {});
          setEmployeeTeam(employee.team || '');
          setEmployeeSupportRole(employee.supportRole || '');
          setUserName(employee.fullName || '');
          setUserEmail(employee.email || '');
          setParentEmail(parentUser?.email || '');
          // currentUserId: for user employees use parent's _id so APIs filter correctly
          setCurrentUserId(parentUser?._id || employee._id || '');
          setBusinessName(parentUser?.company || '');
          applyWallets(parentUser?.Wallet, parentUser?.CargoWallet);
          setEmployeeRightsLoaded(true);
        }
      } catch (e: any) {
        console.error('[AdminUserContext] Employee verify failed:', e);
        // Deactivated / deleted employee (or removed owner): the session is no longer valid.
        // (A 401 is already handled by the api client.)
        const status = e?.response?.status;
        if (status === 404) {
          removeToken();
          window.location.href = '/employee-login';
        } else if (status !== 401) {
          if (!loadedOnce.current) setProfileError(true);
        }
      } finally {
        setLoadingAdminTab(false);
      }
      return;
    }

    // ── Regular user / admin path ──────────────────────────────────────────────
    try {
      const res = await getWithRetry('/user/getUserDetails');
      const user = res.data?.user;
      if (!user?._id) throw new Error('Account missing in response');
      setProfileError(false); loadedOnce.current = true;
      setIsAdmin(user?.isAdmin === true);
      setAdminTab(user?.adminTab === true);
      setCurrentUserId(user?._id || '');
      setUserName(user?.fullname || '');
      setUserEmail(user?.email || '');
      setBusinessName(user?.company || '');
      setProfileImage(user?.profileImage || '');
      applyWallets(user?.Wallet, user?.CargoWallet);
      setIsEmployee(false);
      setEmployeeAccessRights({});
      setParentEmail('');
    } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error('[AdminUserContext] Failed to fetch user details:', e);
      if (e?.response?.status !== 401 && !loadedOnce.current) setProfileError(true);
    } finally {
      setLoadingAdminTab(false);
    }
  }, [applyWallets]);

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
      isAdmin, adminTab, loadingAdminTab, currentUserId, profileError,
      userName, userEmail, businessName, profileImage, walletBalance, walletHold, creditLimit,
      mainWalletBalance, mainWalletHold, cargoWalletBalance, hasCargoWallet,
      isEmployee, employeeId, employeeAccessRights, employeeRightsLoaded, parentEmail,
      // Sales team = team 'sales' on the employee (the backend locks those accounts to the Sales panel,
      // unless they were also given admin-panel modules: salesHasAdminAccess).
      isSalesEmployee: isEmployee && employeeTeam === 'sales',
      salesHasAdminAccess: isEmployee && employeeTeam === 'sales' && hasAccessBeyondSales(employeeAccessRights),
      isTechSupport: isEmployee && employeeSupportRole === 'tech',
      showOnboarding, setShowOnboarding,
      toggleAdminTab,
      refetchUser: fetchAdminTab,
    }}>
      {children}
    </AdminTabContext.Provider>
  );
}

export const useAdminTab = () => useContext(AdminTabContext);
