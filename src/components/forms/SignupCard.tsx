import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { CheckCircle2, Apple, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';

const formSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Valid phone number is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type FormData = z.infer<typeof formSchema>;

interface SignupCardProps {
  onBack?: () => void;
}

export function SignupCard({ onBack }: SignupCardProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(formSchema)
  });

  const onSubmit = async () => {
    return new Promise((resolve) => setTimeout(resolve, 1500));
  };

  return (
    <div className="bg-white p-8 md:p-10 rounded-2xl shadow-2xl shadow-black/10">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-[#0F172A] mb-2">Create an account</h2>
        <p className="text-[#64748B] text-sm">Sign up in less than 2 minutes.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#475569] mb-1.5">First Name<span className="text-[#00A86B]">*</span></label>
            <Input placeholder="Enter your first name" className="h-11 bg-transparent border-[#E2E8F0] text-sm focus-visible:ring-[#00A86B]" {...register('firstName')} error={errors.firstName?.message} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#475569] mb-1.5">Last Name<span className="text-[#00A86B]">*</span></label>
            <Input placeholder="Enter your last name" className="h-11 bg-transparent border-[#E2E8F0] text-sm focus-visible:ring-[#00A86B]" {...register('lastName')} error={errors.lastName?.message} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#475569] mb-1.5">Email<span className="text-red-500">*</span></label>
            <div className="relative">
              <Input type="email" placeholder="abc@gmail.com" className="h-11 bg-transparent border-[#E2E8F0] text-sm focus-visible:ring-[#00A86B]" {...register('email')} error={errors.email?.message} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#475569] mb-1.5">Phone Number <span className="text-red-500">*</span></label>
            <div className="relative flex">
              <div className="flex items-center border border-r-0 border-[#E2E8F0] rounded-l-md px-2 bg-transparent text-sm text-[#475569]">
                +91 <ChevronDown className="w-3 h-3 ml-1" />
              </div>
              <Input type="tel" placeholder="9876543210" className="h-11 rounded-l-none bg-transparent border-[#E2E8F0] text-sm focus-visible:ring-[#00A86B]" {...register('phone')} error={errors.phone?.message} />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#475569] mb-1.5">Password<span className="text-[#00A86B]">*</span></label>
          <Input type="password" placeholder="Create a password" className="h-11 bg-transparent border-[#E2E8F0] text-sm focus-visible:ring-[#00A86B]" {...register('password')} error={errors.password?.message} />
          <p className="text-[10px] text-[#94A3B8] mt-1.5">Must be at least 8 characters.</p>
        </div>

        <Button type="submit" className="w-full h-11 bg-[#00A86B] hover:bg-[#009B63] text-sm font-semibold rounded-md shadow-none" disabled={isSubmitting}>
          Get Started
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
          Sign up with Google
        </Button>
        <Button variant="outline" className="w-full h-10 border-[#E2E8F0] text-xs font-semibold text-[#475569]">
          <Apple className="w-4 h-4 mr-2" />
          Sign up with Apple
        </Button>
      </div>

      <div className="text-center mt-6">
        <p className="text-xs text-[#64748B]">
          Already have an account? <Link to="/login" className="text-[#00A86B] font-semibold hover:underline">Log in</Link>
        </p>
      </div>

      {onBack && (
        <div className="text-center mt-4 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onBack}
            className="text-xs text-slate-500 hover:text-[#00A86B] font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Back to Live Operations
          </button>
        </div>
      )}
    </div>
  );
}
