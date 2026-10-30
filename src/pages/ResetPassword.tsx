import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { AuthHeroLayout } from '../components/layout/AuthHeroLayout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Footer } from '../components/layout/Footer';
import { apiClient } from '../services/apiClient';

/** Opened only from the link in the reset mail. */
export function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(token ? null : 'This reset link is not valid. Please use "Forgot password?" on the login page to get a new one.');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    setSaving(true);
    setError(null);
    try {
      await apiClient.post('/auth/reset-password', { token, newPassword });
      setDone(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not reset your password. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const backToLogin = (
    <Link to="/login" className="inline-flex items-center justify-center w-full h-11 text-sm font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors rounded-md">
      <ArrowLeft className="w-4 h-4 mr-2" />
      Back to log in
    </Link>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-secondary">
      <main className="flex-1">
        <AuthHeroLayout>
          <div className="bg-white p-8 md:p-10 rounded-2xl shadow-2xl shadow-black/10">
            {done ? (
              <div className="text-center">
                <div className="w-12 h-12 bg-[#10B981]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-6 h-6 text-[#10B981]" />
                </div>
                <h2 className="text-2xl font-bold text-[#0F172A] mb-2">Password reset successfully</h2>
                <p className="text-[#64748B] text-sm mb-6">You can now log in with your new password.</p>
                {backToLogin}
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-[#0F172A] mb-2">Set a new password</h2>
                  <p className="text-[#64748B] text-sm">Enter the new password for your account.</p>
                </div>
                <form onSubmit={submit} className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-[#475569] mb-1.5">New Password<span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Input
                        type={show ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="Minimum 8 characters"
                        className="h-11 bg-transparent border-[#E2E8F0] text-sm pr-10 focus-visible:ring-[#00A86B]"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        disabled={!token}
                      />
                      <button type="button" onClick={() => setShow(s => !s)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute right-3 top-3.5 text-[#94A3B8] hover:text-[#475569] transition-colors">
                        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#475569] mb-1.5">Confirm Password<span className="text-red-500">*</span></label>
                    <Input
                      type={show ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Enter the password again"
                      className="h-11 bg-transparent border-[#E2E8F0] text-sm focus-visible:ring-[#00A86B]"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      disabled={!token}
                    />
                  </div>
                  {error && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 text-red-600 rounded-md text-xs font-medium">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                  <Button type="submit" disabled={saving || !token} className="w-full h-11 bg-[#00A86B] hover:bg-[#009B63] text-sm font-semibold rounded-md shadow-none transition-colors">
                    {saving ? 'Saving...' : 'Reset password'}
                  </Button>
                </form>
                <div className="mt-4">{backToLogin}</div>
              </>
            )}
          </div>
        </AuthHeroLayout>
      </main>
      <Footer />
    </div>
  );
}
