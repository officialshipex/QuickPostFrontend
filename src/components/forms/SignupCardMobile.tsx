import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { CheckCircle2, Apple, ChevronDown, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const formSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Valid phone number is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type FormData = z.infer<typeof formSchema>;

type VerifyStatus = 'idle' | 'otp-sent' | 'verified';

interface SignupCardMobileProps {
  onBack?: () => void;
}

/**
 * Mobile-only signup card. Shares the same validation schema and submit
 * contract as the desktop SignupCard, plus an email/phone OTP verify step
 * (mocked with a timeout — swap `requestOtp`/`confirmOtp` for real API calls).
 */
export function SignupCardMobile({ onBack }: SignupCardMobileProps) {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const emailValue = watch('email');
  const phoneValue = watch('phone');

  const [emailStatus, setEmailStatus] = useState<VerifyStatus>('idle');
  const [phoneStatus, setPhoneStatus] = useState<VerifyStatus>('idle');
  const [emailOtp, setEmailOtp] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [phoneSending, setPhoneSending] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [verifiedPhone, setVerifiedPhone] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const isEmailValid = !!emailValue && z.string().email().safeParse(emailValue).success;
  const isPhoneValid = !!phoneValue && phoneValue.length >= 10;

  const requestOtp = async (field: 'email' | 'phone') => {
    if (field === 'email') {
      setEmailSending(true);
      // TODO: replace with real "send OTP to email" API call
      await new Promise((r) => setTimeout(r, 900));
      setEmailSending(false);
      setEmailStatus('otp-sent');
    } else {
      setPhoneSending(true);
      // TODO: replace with real "send OTP to phone" API call
      await new Promise((r) => setTimeout(r, 900));
      setPhoneSending(false);
      setPhoneStatus('otp-sent');
    }
  };

  const confirmOtp = (field: 'email' | 'phone') => {
    if (field === 'email') {
      if (emailOtp.trim().length < 4) return;
      // TODO: replace with real "verify OTP" API call
      setEmailStatus('verified');
      setVerifiedEmail(emailValue);
    } else {
      if (phoneOtp.trim().length < 4) return;
      // TODO: replace with real "verify OTP" API call
      setPhoneStatus('verified');
      setVerifiedPhone(phoneValue);
    }
  };

  // Reset verification if the user edits an already-verified value
  useEffect(() => {
    if (emailStatus === 'verified' && verifiedEmail !== emailValue) {
      setEmailStatus('idle');
      setEmailOtp('');
    }
  }, [emailValue, emailStatus, verifiedEmail]);

  useEffect(() => {
    if (phoneStatus === 'verified' && verifiedPhone !== phoneValue) {
      setPhoneStatus('idle');
      setPhoneOtp('');
    }
  }, [phoneValue, phoneStatus, verifiedPhone]);

  const onSubmit = async () => {
    if (emailStatus !== 'verified' || phoneStatus !== 'verified') {
      setFormError('Please verify your email and phone number to continue.');
      return;
    }
    setFormError(null);
    // TODO: replace with real signup API call
    return new Promise((resolve) => setTimeout(resolve, 1500));
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
          <label className="block text-xs font-semibold text-[#475569] mb-1.5 font-sans">First Name<span className="text-[#00A86B]">*</span></label>
          <Input placeholder="Enter your first name" className="h-11 bg-transparent border-[#E2E8F0] text-sm focus-visible:ring-[#00A86B]" {...register('firstName')} error={errors.firstName?.message} />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#475569] mb-1.5 font-sans">Last Name<span className="text-[#00A86B]">*</span></label>
          <Input placeholder="Enter your last name" className="h-11 bg-transparent border-[#E2E8F0] text-sm focus-visible:ring-[#00A86B]" {...register('lastName')} error={errors.lastName?.message} />
        </div>

        {/* Email + Verify */}
        <div>
          <label className="block text-xs font-semibold text-[#475569] mb-1.5 font-sans">Email<span className="text-red-500">*</span></label>
          <div className="relative">
            <Input
              type="email"
              placeholder="abc@gmail.com"
              className="h-11 bg-transparent border-[#E2E8F0] text-sm pr-24 focus-visible:ring-[#00A86B]"
              {...register('email')}
              error={errors.email?.message}
              disabled={emailStatus === 'verified'}
            />
            <div className="absolute right-3 top-0 h-11 flex items-center">
              {emailStatus === 'verified' ? (
                <span className="flex items-center gap-1 text-[11px] font-bold text-[#00A86B] font-sans">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                </span>
              ) : (
                <button
                  type="button"
                  disabled={!isEmailValid || emailSending}
                  onClick={() => requestOtp('email')}
                  className="text-[11px] font-bold text-[#00A86B] disabled:text-[#94A3B8] disabled:cursor-not-allowed font-sans"
                >
                  {emailSending ? 'Sending...' : emailStatus === 'otp-sent' ? 'Resend' : 'Verify'}
                </button>
              )}
            </div>
          </div>
          {emailStatus === 'otp-sent' && (
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={emailOtp}
                onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter OTP"
                className="h-9 flex-1 px-3 rounded-md border border-[#E2E8F0] text-sm focus:outline-none focus:border-[#00A86B] font-sans"
              />
              <button
                type="button"
                onClick={() => confirmOtp('email')}
                disabled={emailOtp.trim().length < 4}
                className="h-9 px-3 rounded-md bg-[#00A86B] text-white text-xs font-bold disabled:opacity-50 font-sans shrink-0"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => { setEmailStatus('idle'); setEmailOtp(''); }}
                className="text-[#94A3B8] shrink-0"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Phone + Verify */}
        <div>
          <label className="block text-xs font-semibold text-[#475569] mb-1.5 font-sans">Phone Number <span className="text-red-500">*</span></label>
          <div className="relative flex">
            <div className="flex items-center border border-r-0 border-[#E2E8F0] rounded-l-md px-2 bg-transparent text-sm text-[#475569] font-sans">
              +91 <ChevronDown className="w-3 h-3 ml-1" />
            </div>
            <div className="relative flex-1">
              <Input
                type="tel"
                placeholder="9876543210"
                className="h-11 rounded-l-none bg-transparent border-[#E2E8F0] text-sm pr-24 focus-visible:ring-[#00A86B]"
                {...register('phone')}
                error={errors.phone?.message}
                disabled={phoneStatus === 'verified'}
              />
              <div className="absolute right-3 top-0 h-11 flex items-center">
                {phoneStatus === 'verified' ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-[#00A86B] font-sans">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={!isPhoneValid || phoneSending}
                    onClick={() => requestOtp('phone')}
                    className="text-[11px] font-bold text-[#00A86B] disabled:text-[#94A3B8] disabled:cursor-not-allowed font-sans"
                  >
                    {phoneSending ? 'Sending...' : phoneStatus === 'otp-sent' ? 'Resend' : 'Verify'}
                  </button>
                )}
              </div>
            </div>
          </div>
          {phoneStatus === 'otp-sent' && (
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={phoneOtp}
                onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter OTP"
                className="h-9 flex-1 px-3 rounded-md border border-[#E2E8F0] text-sm focus:outline-none focus:border-[#00A86B] font-sans"
              />
              <button
                type="button"
                onClick={() => confirmOtp('phone')}
                disabled={phoneOtp.trim().length < 4}
                className="h-9 px-3 rounded-md bg-[#00A86B] text-white text-xs font-bold disabled:opacity-50 font-sans shrink-0"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => { setPhoneStatus('idle'); setPhoneOtp(''); }}
                className="text-[#94A3B8] shrink-0"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#475569] mb-1.5 font-sans">Password<span className="text-[#00A86B]">*</span></label>
          <Input type="password" placeholder="Create a password" className="h-11 bg-transparent border-[#E2E8F0] text-sm focus-visible:ring-[#00A86B]" {...register('password')} error={errors.password?.message} />
          <p className="text-[10px] text-[#94A3B8] mt-1.5 font-sans">Must be at least 8 characters.</p>
        </div>

        {formError && (
          <p className="text-xs text-red-500 font-sans -mt-1">{formError}</p>
        )}

        <Button type="submit" className="w-full h-11 bg-[#00A86B] hover:bg-[#009B63] text-sm font-semibold rounded-md shadow-none font-sans" disabled={isSubmitting}>
          Get Started
        </Button>
      </form>

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

      <div className="text-center mt-6">
        <p className="text-xs text-[#64748B] font-sans">
          Already have an account? <Link to="/login" className="text-[#00A86B] font-semibold hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
