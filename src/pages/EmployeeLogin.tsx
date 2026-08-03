import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, CheckCircle2, Briefcase } from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { setToken, getRoleFromToken } from '../utils/session';

export function EmployeeLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setErrorMsg('Email and password are required.'); setStatus('error'); return; }
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await apiClient.post('/staffRole/e-login', { email, password });
      if (!res.data.success) throw new Error(res.data.message || 'Login failed');
      const token: string = res.data.data;
      setToken(token);
      setStatus('success');
      const role = getRoleFromToken(token);
      navigate(role === 'admin' ? '/admin/dashboard' : '/user/dashboard', { replace: true });
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.response?.data?.message || err.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl shadow-black/10 p-8 md:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-[#00A86B]/10 flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-7 h-7 text-[#00A86B]" />
            </div>
            <h2 className="text-2xl font-bold text-[#0F172A] mb-1">Employee Login</h2>
            <p className="text-sm text-[#64748B]">Sign in with your employee credentials</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="employee@company.com"
                className="w-full h-11 px-3 rounded-lg border border-[#E2E8F0] text-sm focus:outline-none focus:border-[#00A86B] focus:ring-2 focus:ring-[#00A86B]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full h-11 px-3 pr-10 rounded-lg border border-[#E2E8F0] text-sm focus:outline-none focus:border-[#00A86B] focus:ring-2 focus:ring-[#00A86B]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-3 text-[#94A3B8] hover:text-[#475569]"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {status === 'error' && (
              <div className="flex items-start gap-2 p-3 bg-red-50 text-red-600 rounded-lg text-xs font-medium">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {status === 'success' && (
              <div className="flex items-start gap-2 p-3 bg-[#10B981]/10 text-[#00A86B] rounded-lg text-xs font-medium">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Login successful! Redirecting…</span>
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'loading' || status === 'success'}
              className="w-full h-11 rounded-lg bg-[#00A86B] text-white text-sm font-semibold hover:bg-[#009B63] disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
            >
              {status === 'loading' ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in…
                </>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-xs text-[#64748B] mt-6">
            Not an employee?{' '}
            <Link to="/login" className="text-[#00A86B] font-semibold hover:underline">
              Login as User / Admin
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
