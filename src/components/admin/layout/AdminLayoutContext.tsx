import { createContext, useContext } from 'react';

const AdminLayoutShellContext = createContext(false);

export const useAdminLayoutShell = () => useContext(AdminLayoutShellContext);

export function AdminLayoutShellProvider({ children }: { children: React.ReactNode }) {
  return (
    <AdminLayoutShellContext.Provider value={true}>
      {children}
    </AdminLayoutShellContext.Provider>
  );
}
