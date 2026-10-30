import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { CheckCircle2, Eye, EyeOff, AlertCircle, ArrowLeft, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { apiClient } from '../../services/apiClient';
import { getRoleFromToken } from '../../utils/session';
import { OtpBoxes, OTP_LENGTH, formatCountdown, useCountdown } from '../twoFactor/OtpBoxes';

const formSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type FormData = z.infer<typeof formSchema>;

const FACE_STYLE = { backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' } as const;

export function LoginCard() {
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [serverError, setServerError] = useState<string | null>(null);
  // The OTP side of the card (kept after flipping back, so the card has no blank side while it turns)
  const [flipped, setFlipped] = useState(false);
  const [challenge, setChallenge] = useState<{ token: string; maskedPhone: string } | null>(null);
  const [otp, setOtp] = useState('');
  const [otpStatus, setOtpStatus] = useState<'idle' | 'verifying' | 'success'>('idle');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpNotice, setOtpNotice] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const resend = useCountdown();
  const block = useCountdown();
  const navigate = useNavigate();
  const { login } = useAuth();

  const { register, handleSubmit, trigger, getValues, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema)
  });

  // Forgot password only sends the reset mail: the new password is set from the link in that mail.
  const [forgotSending, setForgotSending] = useState(false);
  const [forgotSent, setForgotSent] = useState<string | null>(null);
  const forgotWait = useCountdown();

  const forgotPassword = async () => {
    setForgotSent(null);
    setStatus('idle');
    setServerError(null);
    if (!(await trigger('email'))) return;
    setForgotSending(true);
    try {
      await apiClient.post('/auth/resetPassword', { email: getValues('email') });
      setForgotSent('Please check your mail. We have sent you a link to reset your password.');
      forgotWait.start(30);
    } catch (err: any) {
      setStatus('error');
      setServerError(err.response?.data?.message || 'Could not send the reset mail. Please try again.');
    } finally {
      setForgotSending(false);
    }
  };

  const finishLogin = (token: string) => {
    login(token);
    const role = getRoleFromToken(token);
    navigate(role === 'admin' ? '/admin/dashboard' : '/user/home', { replace: true });
  };

  const onSubmit = async (data: FormData) => {
    setStatus('loading');
    setServerError(null);

    try {
      const response = await apiClient.post('/external/login', {
        email: data.email,
        password: data.password,
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Login failed');
      }

      // Password correct and two-factor on: no session yet, flip to the OTP side
      if (response.data.twoFactorRequired) {
        setChallenge({ token: response.data.challengeToken, maskedPhone: response.data.maskedPhone });
        setOtp('');
        setOtpError(null);
        setOtpStatus('idle');
        setOtpNotice(response.data.message);
        resend.start(response.data.resendInSeconds || 0);
        block.start(response.data.retryAfterSeconds || 0);
        setStatus('idle');
        setFlipped(true);
        return;
      }

      // Automatically handle different token locations depending on the backend response structure
      const token = typeof response.data.data === 'string'
        ? response.data.data
        : (response.data.token || response.data.data?.token);

      if (!token) {
        console.error('Could not find token in the login response.');
        throw new Error('Token not found in the response from the server');
      }

      setStatus('success');
      finishLogin(token);
    } catch (err: any) {
      setStatus('error');
      setServerError(
        err.response?.data?.message || err.message || 'An unexpected error occurred.'
      );
    }
  };

  const backToLogin = (message?: string) => {
    setFlipped(false);
    setOtp('');
    setOtpError(null);
    setStatus(message ? 'error' : 'idle');
    setServerError(message || null);
  };

  const verifyOtp = async (code: string) => {
    if (!challenge || otpStatus !== 'idle') return;
    setOtpStatus('verifying');
    setOtpError(null);
    try {
      const response = await apiClient.post('/two-factor/login/verify', { challengeToken: challenge.token, otp: code });
      setOtpStatus('success');
      setOtpNotice(null);
      finishLogin(response.data.data);
    } catch (err: any) {
      const data = err.response?.data || {};
      setOtpStatus('idle');
      setOtp('');
      if (data.code === 'CHALLENGE_EXPIRED') {
        backToLogin(data.message);
        return;
      }
      setOtpNotice(null);
      setOtpError(data.message || 'Could not verify the OTP. Please try again.');
    }
  };

  const resendOtp = async () => {
    if (!challenge) return;
    setResending(true);
    setOtpError(null);
    try {
      const response = await apiClient.post('/two-factor/login/resend', { challengeToken: challenge.token });
      setOtp('');
      setOtpNotice(response.data.message);
      resend.start(response.data.resendInSeconds || 0);
      block.start(response.data.retryAfterSeconds || 0);
    } catch (err: any) {
      const data = err.response?.data || {};
      if (data.code === 'CHALLENGE_EXPIRED') {
        backToLogin(data.message);
        return;
      }
      if (data.code === 'OTP_BLOCKED') block.start(data.retryAfterSeconds || 0);
      if (data.code === 'OTP_COOLDOWN') resend.start(data.retryAfterSeconds || 0);
      setOtpNotice(null);
      setOtpError(data.message || 'Could not send the OTP. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={{ perspective: 1400 }}>
      <motion.div
        className="grid"
        initial={false}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* ── Front: email and password ── */}
        <div
          className="[grid-area:1/1] bg-white p-8 md:p-10 rounded-2xl shadow-2xl shadow-black/10"
          style={{ ...FACE_STYLE, pointerEvents: flipped ? 'none' : undefined }}
          aria-hidden={flipped}
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-[#0F172A] mb-2">Sign in using E-mail</h2>
            <p className="text-[#64748B] text-sm">Discover the best shipping solution for your eCommerce business.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <fieldset disabled={flipped} className="space-y-5">
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
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">Password<span className="text-red-500">*</span></label>
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
                  <button
                    type="button"
                    onClick={forgotPassword}
                    disabled={forgotSending || forgotWait.seconds > 0}
                    className="text-[10px] text-[#00A86B] font-semibold hover:underline disabled:opacity-60 disabled:no-underline"
                  >
                    {forgotSending ? 'Sending...' : forgotWait.seconds > 0 ? `Send again in ${forgotWait.seconds}s` : 'Forgot password?'}
                  </button>
                </div>
              </div>

              {forgotSent && (
                <div className="flex items-start gap-2 p-3 bg-[#10B981]/10 text-[#00A86B] rounded-md text-xs font-medium">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{forgotSent}</span>
                </div>
              )}

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
                ) : 'Login'}
              </Button>
            </fieldset>
          </form>

          <div className="text-center mt-6 space-y-2">
            <p className="text-xs text-[#64748B]">
              Don't have an account? <Link to="/register" className="text-[#00A86B] font-semibold hover:underline">Sign up</Link>
            </p>
            <p className="text-xs text-[#64748B]">
              Employee?{' '}
              <Link to="/employee-login" className="text-[#1e40af] font-semibold hover:underline">
                Login with employee credentials
              </Link>
            </p>
          </div>
        </div>

        {/* ── Back: the OTP ── */}
        <div
          className="[grid-area:1/1] bg-white p-8 md:p-10 rounded-2xl shadow-2xl shadow-black/10 flex flex-col justify-center"
          style={{ ...FACE_STYLE, transform: 'rotateY(180deg)', pointerEvents: flipped ? undefined : 'none' }}
          aria-hidden={!flipped}
        >
          {challenge && (
            <fieldset disabled={!flipped} className="space-y-5">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#ECFDF5] flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-[#00A86B]" />
                </div>
                <h2 className="text-2xl font-bold text-[#0F172A] mb-2">Verify it's you</h2>
                <p className="text-[#64748B] text-sm">
                  Enter the {OTP_LENGTH}-digit OTP sent to your registered mobile number {challenge.maskedPhone}.
                </p>
              </div>

              <OtpBoxes
                value={otp}
                onChange={value => { setOtp(value); if (otpError) setOtpError(null); }}
                onComplete={verifyOtp}
                disabled={otpStatus !== 'idle' || !flipped}
                hasError={!!otpError}
                focusWhen={flipped}
              />

              {otpError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 text-red-600 rounded-md text-xs font-medium">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{otpError}</span>
                </div>
              )}

              {!otpError && otpNotice && otpStatus === 'idle' && (
                <div className="flex items-start gap-2 p-3 bg-[#10B981]/10 text-[#00A86B] rounded-md text-xs font-medium">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{otpNotice}</span>
                </div>
              )}

              {otpStatus === 'success' && (
                <div className="flex items-start gap-2 p-3 bg-[#10B981]/10 text-[#00A86B] rounded-md text-xs font-medium">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>OTP verified. Login successful! Redirecting...</span>
                </div>
              )}

              <Button
                type="button"
                onClick={() => verifyOtp(otp)}
                className="w-full h-11 bg-[#00A86B] hover:bg-[#009B63] text-sm font-semibold rounded-md shadow-none transition-colors"
                disabled={otp.length !== OTP_LENGTH || otpStatus !== 'idle'}
              >
                {otpStatus === 'verifying' ? 'Verifying...' : 'Verify & Login'}
              </Button>

              <div className="text-center text-xs text-[#64748B]">
                {block.seconds > 0 ? (
                  <span className="text-amber-700">OTP limit reached (3 per hour). You can request a new one in {formatCountdown(block.seconds)}.</span>
                ) : resend.seconds > 0 ? (
                  <span>Didn't get the OTP? Resend in {resend.seconds}s</span>
                ) : (
                  <span>
                    Didn't get the OTP?{' '}
                    <button type="button" onClick={resendOtp} disabled={resending || otpStatus !== 'idle'} className="text-[#00A86B] font-semibold hover:underline disabled:opacity-50">
                      {resending ? 'Sending...' : 'Resend OTP'}
                    </button>
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => backToLogin()}
                disabled={otpStatus !== 'idle'}
                className="mx-auto flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] disabled:opacity-50"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to login
              </button>
            </fieldset>
          )}
        </div>
      </motion.div>
    </div>
  );
}
