import { useState } from 'react';
import { landingUrl } from '../../utils/domainUrl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { CheckCircle2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { apiClient } from '../../services/apiClient';
import { getRoleFromToken } from '../../utils/session';

const ALLOWED_EMAILS = ['bhanjabijayketan@gmail.com', 'vincesingal@gmail.com', 'shubhamjha493@gmail.com'];

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

    if (!ALLOWED_EMAILS.includes(data.email.toLowerCase().trim())) {
      setStatus('error');
      setServerError('This panel is currently in testing mode. Please login at app.shipexindia.com/login');
      return;
    }

    try {
      const response = await apiClient.post('/external/login', {
        email: data.email,
        password: data.password,
      });

      console.log('Login API Response:', response.data);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Login failed');
      }

      // Automatically handle different token locations depending on the backend response structure
      const token = typeof response.data.data === 'string' 
        ? response.data.data 
        : (response.data.token || response.data.data?.token);

      if (!token) {
        console.error('Could not find token. Full response:', response.data);
        throw new Error('Token not found in the response from the server');
      }

      login(token);
      setStatus('success');
      const role = getRoleFromToken(token);
      navigate(role === 'admin' ? '/admin/dashboard' : '/user/dashboard', { replace: true });
    } catch (err: any) {
      setStatus('error');
      setServerError(
        err.response?.data?.message || err.message || 'An unexpected error occurred.'
      );
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

      <div className="text-center mt-6 space-y-2">
        <p className="text-xs text-[#64748B]">
          Don't have an account? <a href={landingUrl()} className="text-[#00A86B] font-semibold hover:underline">Sign up</a>
        </p>
        <p className="text-xs text-[#64748B]">
          Employee?{' '}
          <Link to="/employee-login" className="text-[#1e40af] font-semibold hover:underline">
            Login with employee credentials
          </Link>
        </p>
      </div>
    </div>
  );
}
