import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const formSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
});

type FormData = z.infer<typeof formSchema>;

export function ForgotPasswordCard() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema)
  });

  const onSubmit = async (data: FormData) => {
    setStatus('loading');
    setServerError(null);

    try {
      // Mock API call to POST /api/v1/auth/forgot-password
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // Simulate an error for a specific test email if needed, otherwise success
          if (data.email === 'error@test.com') {
            reject(new Error('Failed to send reset link. Please try again later.'));
          } else {
            resolve(true);
          }
        }, 1500);
      });
      
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setServerError(err.message || 'An unexpected error occurred.');
    }
  };

  if (status === 'success') {
    return (
      <div className="bg-white p-8 md:p-10 rounded-2xl shadow-2xl shadow-black/10 text-center">
        <div className="w-12 h-12 bg-[#10B981]/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-6 h-6 text-[#10B981]" />
        </div>
        <h2 className="text-2xl font-bold text-[#0F172A] mb-2">Check your email</h2>
        <p className="text-[#64748B] text-sm mb-8">
          We sent a password reset link to your email address.
        </p>
        <Link to="/login" className="inline-flex items-center justify-center w-full h-11 border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-sm font-semibold text-[#475569] transition-colors rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 md:p-10 rounded-2xl shadow-2xl shadow-black/10">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-[#0F172A] mb-2">Forgot password?</h2>
        <p className="text-[#64748B] text-sm">No worries, we'll send you reset instructions.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-xs font-semibold text-[#475569] mb-1.5">Email<span className="text-red-500">*</span></label>
          <Input 
            type="email" 
            placeholder="Enter your email" 
            className="h-11 bg-transparent border-[#E2E8F0] text-sm focus-visible:ring-[#00A86B]" 
            {...register('email')} 
            error={errors.email?.message} 
          />
        </div>

        {status === 'error' && (
          <div className="flex items-start gap-2 p-3 bg-red-50 text-red-600 rounded-md text-xs font-medium">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <Button 
          type="submit" 
          className="w-full h-11 bg-[#00A86B] hover:bg-[#009B63] text-sm font-semibold rounded-md shadow-none transition-colors" 
          disabled={status === 'loading'}
        >
          {status === 'loading' ? (
             <div className="flex items-center gap-2">
               <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
               Sending instructions...
             </div>
          ) : 'Reset password'}
        </Button>
      </form>

      <div className="mt-6">
        <Link to="/login" className="inline-flex items-center justify-center w-full h-11 text-sm font-semibold text-[#64748B] hover:bg-transparent hover:text-[#0F172A] transition-colors rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to log in
        </Link>
      </div>
    </div>
  );
}
