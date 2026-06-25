import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { CheckCircle2, Apple, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const formSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type FormData = z.infer<typeof formSchema>;

export function LoginCard() {
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [serverError, setServerError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema)
  });

  const onSubmit = async (data: FormData) => {
    setStatus('loading');
    setServerError(null);

    try {
      // Mock API call to POST /api/v1/auth/login
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          if (data.email === 'admin@quickpost.in' && data.password === 'Admin@123') {
            resolve({ success: true, token: 'mock_admin_token', user: { email: data.email }, role: 'admin' });
          } else if (data.email === 'demo@quickpost.in' && data.password === 'QuickPost@123') {
            resolve({ success: true, token: 'mock_token', user: { email: data.email }, role: 'user' });
          } else {
            reject(new Error('Invalid credentials. Use demo@quickpost.in / QuickPost@123 or admin@quickpost.in / Admin@123'));
          }
        }, 1500);
      });
      
      setStatus('success');
      
      const role = data.email === 'admin@quickpost.in' ? 'admin' : 'user';
      const token = role === 'admin' ? 'mock_admin_token' : 'mock_token';
      
      login(token, role);
      
      // Simulate redirect to dashboard
      setTimeout(() => {
        navigate(role === 'admin' ? '/admin/dashboard' : '/dashboard');
      }, 500);
      
    } catch (err: any) {
      setStatus('error');
      setServerError(err.message || 'An unexpected error occurred.');
    }
  };

  return (
    <div className="bg-white p-8 md:p-10 rounded-2xl shadow-2xl shadow-black/10">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-[#0F172A] mb-2">Sign in using E-mail</h2>
        <p className="text-[#64748B] text-sm">Discover the best shipping solution for your eCommerce business.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-xs font-semibold text-[#475569] mb-1.5">Email<span className="text-red-500">*</span></label>
          <div className="relative">
            <Input 
              type="email" 
              placeholder="abc@gmail.com" 
              className="h-11 bg-transparent border-[#E2E8F0] text-sm focus-visible:ring-[#00A86B]" 
              {...register('email')} 
              error={errors.email?.message} 
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#475569] mb-1.5">Password<span className="text-[#00A86B]">*</span></label>
          <div className="relative">
            <Input 
              type={showPassword ? 'text' : 'password'} 
              placeholder="Create a password" 
              className="h-11 bg-transparent border-[#E2E8F0] text-sm pr-10 focus-visible:ring-[#00A86B]" 
              {...register('password')} 
              error={errors.password?.message} 
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3.5 text-[#94A3B8] hover:text-[#475569] transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex justify-end mt-1.5">
            <Link to="/forgot-password" className="text-[10px] text-[#00A86B] font-semibold hover:underline">
              Forgot password?
            </Link>
          </div>
        </div>

        {status === 'error' && (
          <div className="flex items-start gap-2 p-3 bg-red-50 text-red-600 rounded-md text-xs font-medium">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        {status === 'success' && (
          <div className="flex items-start gap-2 p-3 bg-[#10B981]/10 text-[#00A86B] rounded-md text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>Login successful! Redirecting...</span>
          </div>
        )}

        <Button 
          type="submit" 
          className="w-full h-11 bg-[#00A86B] hover:bg-[#009B63] text-sm font-semibold rounded-md shadow-none transition-colors" 
          disabled={status === 'loading' || status === 'success'}
        >
          {status === 'loading' ? (
             <div className="flex items-center gap-2">
               <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
               Signing in...
             </div>
          ) : 'Get Started'}
        </Button>
      </form>

      <div className="grid grid-cols-2 gap-4 mt-5">
        <Button variant="outline" className="w-full h-10 border-[#E2E8F0] text-xs font-semibold text-[#475569]">
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Sign in with Google
        </Button>
        <Button variant="outline" className="w-full h-10 border-[#E2E8F0] text-xs font-semibold text-[#475569]">
          <Apple className="w-4 h-4 mr-2" />
          Sign in with Apple
        </Button>
      </div>

      <div className="text-center mt-6">
        <p className="text-xs text-[#64748B]">
          Don't have an account? <Link to="/" className="text-[#00A86B] font-semibold hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
