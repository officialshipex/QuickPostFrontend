import { useState } from 'react';
import { ShieldCheck, AlertCircle, CheckCircle2, Smartphone } from 'lucide-react';
import { OtpBoxes, OTP_LENGTH, formatCountdown, useCountdown } from '../twoFactor/OtpBoxes';
import { sendSensitiveOtp, verifySensitiveOtp } from '../../services/sensitiveAccess';

/* The OTP popup for the protected sections (wallet / COD / rate cards / couriers / system). Step 1: send the OTP
   to the registered mobile; step 2: enter it. Once accepted, the backend trusts this computer for 48 hours. */

type ApiError = { response?: { data?: { message?: string; code?: string; retryAfterSeconds?: number } } };

interface SensitiveOtpDialogProps {
  maskedPhone?: string;
  hours?: number;
  /** Shown above the steps (why the popup appeared) */
  reason?: string;
  onVerified: () => void;
  onCancel: () => void;
  cancelLabel?: string;
}

export function SensitiveOtpDialog({ maskedPhone, hours = 48, reason, onVerified, onCancel, cancelLabel = 'Cancel' }: SensitiveOtpDialogProps) {
  const [step, setStep] = useState<'send' | 'enter' | 'done'>('send');
  const [phone, setPhone] = useState(maskedPhone || '');
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState<'sending' | 'verifying' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const resend = useCountdown();
  const block = useCountdown();

  const send = async () => {
    if (busy) return;
    setBusy('sending');
    setError(null);
    try {
      const data = await sendSensitiveOtp();
      if (data.maskedPhone) setPhone(data.maskedPhone);
      setOtp('');
      setStep('enter');
      setNotice(data.message || `OTP sent to ${data.maskedPhone}.`);
      resend.start(data.resendInSeconds || 30);
      if (data.retryAfterSeconds) block.start(data.retryAfterSeconds);
    } catch (err) {
      const data = (err as ApiError).response?.data || {};
      if (data.code === 'OTP_COOLDOWN') {
        // an OTP was sent a moment ago and still works
        resend.start(data.retryAfterSeconds || 30);
        setStep('enter');
      }
      if (data.code === 'OTP_BLOCKED') {
        block.start(data.retryAfterSeconds || 0);
        setStep('enter'); // the last OTP sent can still be used
      }
      setNotice(null);
      setError(data.message || 'Could not send the OTP. Please try again.');
    } finally {
      setBusy(null);
    }
  };

  const verify = async (code: string) => {
    if (busy || code.length !== OTP_LENGTH) return;
    setBusy('verifying');
    setError(null);
    try {
      await verifySensitiveOtp(code);
      setStep('done');
      setNotice(null);
      window.setTimeout(onVerified, 700);
    } catch (err) {
      const data = (err as ApiError).response?.data || {};
      setOtp('');
      setNotice(null);
      setError(data.message || 'Could not verify the OTP. Please try again.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[520] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="sensitive-otp-title">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 z-10">
        <div className="text-center mb-5">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#ECFDF5] flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-[#00A86B]" />
          </div>
          <h3 id="sensitive-otp-title" className="text-base font-bold text-[#0F172A] mb-1">Verify this computer</h3>
          <p className="text-xs text-[#64748B]">
            {reason || 'This section is protected.'} Verify with an OTP on your registered mobile number. This computer then stays verified for {hours} hours.
          </p>
        </div>

        {step === 'send' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 justify-center text-xs text-[#475569]">
              <Smartphone className="w-4 h-4 text-[#94A3B8]" />
              <span>OTP will be sent to <b className="text-[#0F172A]">{phone || 'your registered mobile number'}</b></span>
            </div>
            <button type="button" onClick={send} disabled={!!busy}
              className="w-full h-10 rounded-full bg-[#00A86B] hover:bg-[#009B63] text-white text-sm font-semibold disabled:opacity-60">
              {busy === 'sending' ? 'Sending…' : 'Send OTP'}
            </button>
            <button type="button" onClick={() => { setStep('enter'); setError(null); }} className="text-[11px] font-semibold text-[#64748B] hover:text-[#00A86B]">
              I already have an OTP
            </button>
          </div>
        )}

        {step === 'enter' && (
          <div className="flex flex-col gap-4">
            <p className="text-center text-xs text-[#475569]">
              Enter the {OTP_LENGTH}-digit OTP sent to {phone || 'your registered mobile number'}.
            </p>
            <OtpBoxes
              value={otp}
              onChange={(value) => { setOtp(value); if (error) setError(null); }}
              onComplete={verify}
              disabled={!!busy}
              hasError={!!error}
            />
            <button type="button" onClick={() => verify(otp)} disabled={otp.length !== OTP_LENGTH || !!busy}
              className="w-full h-10 rounded-full bg-[#00A86B] hover:bg-[#009B63] text-white text-sm font-semibold disabled:opacity-60">
              {busy === 'verifying' ? 'Verifying…' : 'Verify'}
            </button>
            <div className="text-center text-xs text-[#64748B]">
              {block.seconds > 0 ? (
                <span className="text-amber-700">OTP limit reached (3 per hour). You can request a new one in {formatCountdown(block.seconds)}.</span>
              ) : resend.seconds > 0 ? (
                <span>Didn't get the OTP? Resend in {resend.seconds}s</span>
              ) : (
                <span>
                  Didn't get the OTP?{' '}
                  <button type="button" onClick={send} disabled={!!busy} className="text-[#00A86B] font-semibold hover:underline disabled:opacity-50">
                    {busy === 'sending' ? 'Sending…' : 'Send OTP'}
                  </button>
                </span>
              )}
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="flex items-start gap-2 p-3 bg-[#10B981]/10 text-[#00A86B] rounded-xl text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>Verified. This computer is trusted for {hours} hours.</span>
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-start gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {!error && notice && step === 'enter' && (
          <div className="mt-4 flex items-start gap-2 p-3 bg-[#10B981]/10 text-[#00A86B] rounded-xl text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        {step !== 'done' && (
          <button type="button" onClick={onCancel} disabled={busy === 'verifying'}
            className="mt-4 w-full h-9 rounded-full border border-[#E2E8F0] text-xs font-semibold text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-50">
            {cancelLabel}
          </button>
        )}
      </div>
    </div>
  );
}
