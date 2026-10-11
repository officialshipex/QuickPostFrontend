import { useAdminTab } from '../context/AdminUserContext';
import { getModuleRights } from '../utils/permissions';

interface Permission {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

/**
 * Returns the current session's permission for a given module key (see utils/permissions.ts).
 * Non-employees always have full access.
 * Employees get whatever was configured by the admin/user who created their account.
 */
export function usePermission(module: string): Permission {
  const { isEmployee, employeeAccessRights } = useAdminTab();

  if (!isEmployee) {
    return { canView: true, canEdit: true, canDelete: true };
  }

  const rights = getModuleRights(employeeAccessRights, module);
  return { canView: rights.view, canEdit: rights.edit, canDelete: rights.delete };
}
