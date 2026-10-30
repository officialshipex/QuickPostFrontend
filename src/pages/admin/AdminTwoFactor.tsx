import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { TwoFactorPanel } from '../../components/twoFactor/TwoFactorPanel';

export function AdminTwoFactor() {
  const isImpersonating = !!localStorage.getItem('admin_token_backup');

  return (
    <AdminLayout>
      <div className="max-w-[720px] mx-auto pb-10">
        <h1 className="text-[20px] font-bold text-[#0F172A] mb-4">Two-Factor Authentication</h1>
        <TwoFactorPanel readOnly={isImpersonating} />
      </div>
    </AdminLayout>
  );
}
