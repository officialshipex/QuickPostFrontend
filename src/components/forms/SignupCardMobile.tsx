import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Apple, ChevronDown, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { apiClient } from '../../services/apiClient';
import { useAuth } from '../../hooks/useAuth';
import { getRoleFromToken } from '../../utils/session';

const MONTHLY_ORDER_OPTIONS = [
  '0 - 500',
  '500 - 1500',
  '1500 - 3000',
  '3000 - 5000',
  '5000+',
];

const formSchema = z.object({
  fullname: z.string().min(2, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Valid phone number is required'),
  company: z.string().min(2, 'Company name is required'),
  monthlyOrders: z.string().min(1, 'Please select monthly orders'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmedPassword: z.string().min(8, 'Please confirm your password'),
  checked: z.boolean().refine(v => v === true, 'You must accept the terms'),
}).refine(data => data.password === data.confirmedPassword, {
  message: 'Passwords do not match',
  path: ['confirmedPassword'],
});

type FormData = z.infer<typeof formSchema>;

interface SignupCardMobileProps {
  onBack?: () => void;
}

export function SignupCardMobile({ onBack }: SignupCardMobileProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [serverError, setServerError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { checked: false },
  });

  const onSubmit = async (data: FormData) => {
    setStatus('loading');
    setServerError(null);
    try {
      const response = await apiClient.post('/external/register', {
        fullname: data.fullname,
        email: data.email,
        phoneNumber: data.phone,
        company: data.company,
        monthlyOrders: data.monthlyOrders,
        password: data.password,
        confirmedPassword: data.confirmedPassword,
        checked: data.checked,
        referralCode: searchParams.get('ref') || undefined,
      });

      if (!response.data.success) throw new Error(response.data.message || 'Registration failed');

      const token = typeof response.data.data === 'string'
        ? response.data.data
        : (response.data.token || response.data.data?.token);

      if (!token) throw new Error('Token not found in the server response');

      login(token);
      setStatus('success');
      const role = getRoleFromToken(token);
      navigate(role === 'admin' ? '/admin/dashboard' : '/user/dashboard', { replace: true });
    } catch (err: any) {
      setStatus('error');
      setServerError(err.response?.data?.message || err.message || 'An unexpected error occurred.');
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-2xl shadow-black/10">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#00A86B] transition-colors mb-4 font-sans"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back
        </button>
      )}

      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-[#0F172A] mb-1.5 font-sans">Create an account</h2>
        <p className="text-[#64748B] text-sm font-sans">Sign up in less than 2 minutes.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-[#475569] mb-1.5 font-sans">Full Name<span className="text-[#00A86B]">*</span></label>
          <Input placeholder="Enter your full name" className="h-11 bg-transparent border-[#E2E8F0] text-sm focus-visible:ring-[#00A86B]" {...register('fullname')} error={errors.fullname?.message} />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#475569] mb-1.5 font-sans">Email<span className="text-red-500">*</span></label>
          <Input type="email" placeholder="abc@gmail.com" className="h-11 bg-transparent border-[#E2E8F0] text-sm focus-visible:ring-[#00A86B]" {...register('email')} error={errors.email?.message} />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#475569] mb-1.5 font-sans">Phone Number<span className="text-red-500">*</span></label>
          <div className="flex">
            <div className="flex items-center border border-r-0 border-[#E2E8F0] rounded-l-md px-2 bg-transparent text-sm text-[#475569] font-sans">
              +91 <ChevronDown className="w-3 h-3 ml-1" />
            </div>
            <Input type="tel" placeholder="9876543210" className="h-11 rounded-l-none bg-transparent border-[#E2E8F0] text-sm focus-visible:ring-[#00A86B]" {...register('phone')} error={errors.phone?.message} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#475569] mb-1.5 font-sans">Company Name<span className="text-red-500">*</span></label>
          <Input placeholder="Your company name" className="h-11 bg-transparent border-[#E2E8F0] text-sm focus-visible:ring-[#00A86B]" {...register('company')} error={errors.company?.message} />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#475569] mb-1.5 font-sans">Monthly Orders<span className="text-red-500">*</span></label>
          <select
            {...register('monthlyOrders')}
            className="h-11 w-full rounded-md border border-[#E2E8F0] bg-transparent px-3 text-sm text-[#0F172A] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B] font-sans"
          >
            <option value="">Select monthly order range</option>
            {MONTHLY_ORDER_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          {errors.monthlyOrders && <p className="mt-1 text-xs text-red-500 font-sans">{errors.monthlyOrders.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#475569] mb-1.5 font-sans">Password<span className="text-[#00A86B]">*</span></label>
          <div className="relative">
            <Input type={showPassword ? 'text' : 'password'} placeholder="Create a password" className="h-11 bg-transparent border-[#E2E8F0] text-sm pr-10 focus-visible:ring-[#00A86B]" {...register('password')} error={errors.password?.message} />
            <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-3.5 text-[#94A3B8] hover:text-[#475569]">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[10px] text-[#94A3B8] mt-1 font-sans">Must be at least 8 characters.</p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#475569] mb-1.5 font-sans">Confirm Password<span className="text-[#00A86B]">*</span></label>
          <div className="relative">
            <Input type={showConfirm ? 'text' : 'password'} placeholder="Confirm your password" className="h-11 bg-transparent border-[#E2E8F0] text-sm pr-10 focus-visible:ring-[#00A86B]" {...register('confirmedPassword')} error={errors.confirmedPassword?.message} />
            <button type="button" onClick={() => setShowConfirm(p => !p)} className="absolute right-3 top-3.5 text-[#94A3B8] hover:text-[#475569]">
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="terms-mobile"
            {...register('checked')}
            className="mt-0.5 h-4 w-4 rounded border-[#E2E8F0] accent-[#00A86B] cursor-pointer"
          />
          <label htmlFor="terms-mobile" className="text-xs text-[#475569] font-sans cursor-pointer">
            I agree to the <span className="text-[#00A86B] font-semibold">Terms of Service</span> and <span className="text-[#00A86B] font-semibold">Privacy Policy</span>
          </label>
        </div>
        {errors.checked && <p className="text-xs text-red-500 font-sans -mt-2">{errors.checked.message}</p>}

        {status === 'error' && (
          <div className="flex items-start gap-2 p-3 bg-red-50 text-red-600 rounded-md text-xs font-medium font-sans">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        {status === 'success' && (
          <div className="flex items-start gap-2 p-3 bg-[#10B981]/10 text-[#00A86B] rounded-md text-xs font-medium font-sans">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            <span>Account created! Redirecting...</span>
          </div>
        )}

        <Button
          type="submit"
          className="w-full h-11 bg-[#00A86B] hover:bg-[#009B63] text-sm font-semibold rounded-md shadow-none font-sans"
          disabled={status === 'loading' || status === 'success'}
        >
          {status === 'loading' ? (
            <div className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Creating account...
            </div>
          ) : 'Sign up'}
        </Button>
      </form>

      {/* Google/Apple sign-up disabled per request
      <div className="grid grid-cols-1 gap-3 mt-5">
        <Button variant="outline" className="w-full h-10 border-[#E2E8F0] text-xs font-semibold text-[#475569] font-sans">
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Sign up with Google
        </Button>
        <Button variant="outline" className="w-full h-10 border-[#E2E8F0] text-xs font-semibold text-[#475569] font-sans">
          <Apple className="w-4 h-4 mr-2" />
          Sign up with Apple
        </Button>
      </div>
      */}

      <div className="text-center mt-6">
        <p className="text-xs text-[#64748B] font-sans">
          Already have an account? <Link to="/login" className="text-[#00A86B] font-semibold hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
