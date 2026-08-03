import { useAdminTab } from '../context/AdminUserContext';

interface Permission {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

/**
 * Returns the current session's permission for a given module.
 * Non-employees always have full access.
 * Employees get whatever was configured by the admin/user who created their account.
 */
export function usePermission(module: string): Permission {
  const { isEmployee, employeeAccessRights } = useAdminTab();

  if (!isEmployee) {
    return { canView: true, canEdit: true, canDelete: true };
  }

  const rights = employeeAccessRights[module] || {};
  return {
    canView:   rights.view   === true,
    canEdit:   rights.edit   === true,
    canDelete: rights.delete === true,
  };
}
