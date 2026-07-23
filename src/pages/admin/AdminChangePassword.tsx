import { useState, useMemo } from 'react';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { apiClient } from '../../services/apiClient';
import { useAdminTab } from '../../context/AdminUserContext';
import { Lock, Eye, EyeOff, Check, X, Loader2, ShieldCheck } from 'lucide-react';

const TXT = {
  title: 'text-[14px] font-semibold',
  label: 'text-[12px] font-semibold',
  value: 'text-[12px] font-normal',
};

interface PasswordRule {
  label: string;
  test: (v: string) => boolean;
}

const RULES: PasswordRule[] = [
  { label: 'At least 8 characters', test: (v) => v.length >= 8 },
  { label: 'One uppercase letter', test: (v) => /[A-Z]/.test(v) },
  { label: 'One lowercase letter', test: (v) => /[a-z]/.test(v) },
  { label: 'One number', test: (v) => /\d/.test(v) },
  { label: 'One special character', test: (v) => /[^A-Za-z0-9]/.test(v) },
];

function PasswordField({
  label, value, onChange, show, onToggleShow, placeholder, autoComplete,
}: {
  label: string; value: string; onChange: (v: string) => void; show: boolean;
  onToggleShow: () => void; placeholder: string; autoComplete: string;
}) {
  return (
    <div>
      <label className={`block ${TXT.label} text-[#475569] mb-1.5`}>{label}</label>
      <div className="relative">
        <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`w-full h-11 pl-10 pr-10 bg-white border border-[#E2E8F0] rounded-[12px] ${TXT.value} text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20 focus:border-[#00A86B]`}
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#00A86B] transition-colors"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

export function AdminChangePassword() {
  const { userEmail } = useAdminTab();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const passedRules = useMemo(() => RULES.map(r => ({ ...r, passed: r.test(newPassword) })), [newPassword]);
  const strength = passedRules.filter(r => r.passed).length;
  const strengthLabel = strength <= 2 ? 'Weak' : strength <= 4 ? 'Medium' : 'Strong';
  const strengthColor = strength <= 2 ? '#EF4444' : strength <= 4 ? '#F59E0B' : '#00A86B';

  const allRulesPass = passedRules.every(r => r.passed);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const canSubmit = allRulesPass && passwordsMatch && !saving;

  const handleSubmit = async () => {
    setError('');
    if (!allRulesPass) { setError('New password does not meet all requirements.'); return; }
    if (!passwordsMatch) { setError('Passwords do not match.'); return; }

    setSaving(true);
    try {
      await apiClient.post('/auth/changePasswordAdmin', { email: userEmail, newPassword });
      setSaved(true);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update password. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-[560px] mx-auto pb-10">
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-xl bg-[#F0FDF4] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4.5 h-4.5 text-[#00A86B]" />
            </div>
            <h1 className={`${TXT.title} text-[#0F172A]`}>Change Password</h1>
          </div>
          <p className={`${TXT.value} text-[#94A3B8] mb-6 ml-[46px]`}>
            Updating password for <span className="font-semibold text-[#475569]">{userEmail || '—'}</span>
          </p>

          <div className="space-y-5">
            <PasswordField
              label="New Password"
              value={newPassword}
              onChange={setNewPassword}
              show={showNew}
              onToggleShow={() => setShowNew(v => !v)}
              placeholder="Enter your new password"
              autoComplete="new-password"
            />

            {newPassword.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`${TXT.value} text-[#94A3B8]`}>Password strength</span>
                  <span className={`${TXT.label}`} style={{ color: strengthColor }}>{strengthLabel}</span>
                </div>
                <div className="h-1.5 w-full bg-[#F1F5F9] rounded-full overflow-hidden flex gap-0.5">
                  {[0, 1, 2, 3, 4].map(i => (
                    <div
                      key={i}
                      className="flex-1 rounded-full transition-colors"
                      style={{ backgroundColor: i < strength ? strengthColor : '#F1F5F9' }}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 mt-3">
                  {passedRules.map((rule) => (
                    <div key={rule.label} className="flex items-center gap-1.5">
                      {rule.passed
                        ? <Check className="w-3.5 h-3.5 text-[#00A86B] shrink-0" strokeWidth={3} />
                        : <X className="w-3.5 h-3.5 text-[#CBD5E1] shrink-0" strokeWidth={3} />}
                      <span className={`${TXT.value} ${rule.passed ? 'text-[#475569]' : 'text-[#94A3B8]'}`}>{rule.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <PasswordField
              label="Confirm New Password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              show={showConfirm}
              onToggleShow={() => setShowConfirm(v => !v)}
              placeholder="Re-enter your new password"
              autoComplete="new-password"
            />
            {confirmPassword.length > 0 && !passwordsMatch && (
              <p className={`${TXT.value} text-red-500 -mt-3`}>Passwords do not match</p>
            )}

            {error && <p className={`${TXT.value} text-red-500`}>{error}</p>}
            {saved && <p className={`${TXT.value} text-[#00A86B] flex items-center gap-1.5`}><Check className="w-3.5 h-3.5" /> Password updated successfully.</p>}

            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`w-full h-11 rounded-[12px] bg-[#00A86B] text-white ${TXT.label} hover:bg-[#009B63] transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Update Password
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
