import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock, Loader2, ShieldCheck, Smartphone } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { Toast } from '../ui/Toast';
import { useToast } from '../../hooks/useToast';
import { OtpBoxes, OTP_LENGTH, formatCountdown, useCountdown } from './OtpBoxes';

interface TwoFactorStatus {
  available: boolean;
  ownerOnly?: boolean;
  enabled?: boolean;
  maskedPhone?: string;
  otpRequired?: boolean;
  verifiedSeconds?: number;
  blockedSeconds?: number;
  resendInSeconds?: number;
}

const errorOf = (err: any) => err?.response?.data || {};
const messageOf = (err: any, fallback: string) => errorOf(err).message || fallback;

/** The account owner's own two-factor switch. Used by the Profile tab and the Settings page. */
export function TwoFactorPanel({ readOnly = false }: { readOnly?: boolean }) {
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  // the change waiting for an OTP (null = no OTP step on screen)
  const [pending, setPending] = useState<boolean | null>(null);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState('');
  const resend = useCountdown();
  const block = useCountdown();
  const { toast, showToast, closeToast } = useToast();

  const applyStatus = useCallback((next: TwoFactorStatus) => {
    setStatus(next);
    if (next.blockedSeconds) block.start(next.blockedSeconds);
    if (next.resendInSeconds) resend.start(next.resendInSeconds);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const load = useCallback(() => {
    setLoadFailed(false);
    apiClient.get('/two-factor/status')
      .then(res => applyStatus(res.data))
      .catch(() => setLoadFailed(true));
  }, [applyStatus]);

  useEffect(load, [load]);

  const sendOtp = async (target: boolean) => {
    setSending(true);
    setOtpError('');
    try {
      const res = await apiClient.post('/two-factor/settings/send-otp');
      setPending(target);
      setOtp('');
      setNotice(res.data.message);
      resend.start(res.data.resendInSeconds || 0);
      if (res.data.retryAfterSeconds) block.start(res.data.retryAfterSeconds);
      showToast('success', res.data.message);
    } catch (err) {
      const data = errorOf(err);
      if (data.code === 'OTP_BLOCKED') {
        block.start(data.retryAfterSeconds || 0);
        showToast('error', data.message);
      } else if (data.code === 'OTP_COOLDOWN') {
        // an OTP went out moments ago: it is still the one to enter
        setPending(target);
        resend.start(data.retryAfterSeconds || 0);
        setNotice(`Enter the OTP already sent to ${status?.maskedPhone || 'your mobile'}.`);
      } else {
        showToast('error', messageOf(err, 'Could not send the OTP. Please try again.'));
      }
    } finally {
      setSending(false);
    }
  };

  const submitChange = async (target: boolean, code?: string) => {
    setBusy(true);
    setOtpError('');
    try {
      const res = await apiClient.post('/two-factor/settings/change', { enabled: target, ...(code ? { otp: code } : {}) });
      applyStatus(res.data);
      setPending(null);
      setOtp('');
      setNotice('');
      showToast('success', res.data.message);
    } catch (err) {
      const data = errorOf(err);
      if (data.code === 'OTP_REQUIRED') {
        // the 24 hours ran out while this page was open
        setStatus(s => (s ? { ...s, otpRequired: true } : s));
        await sendOtp(target);
      } else if (pending !== null) {
        setOtp('');
        setOtpError(messageOf(err, 'Could not verify the OTP. Please try again.'));
      } else {
        showToast('error', messageOf(err, 'Could not update two-factor authentication.'));
      }
    } finally {
      setBusy(false);
    }
  };

  const onToggle = () => {
    if (!status || busy || sending || readOnly) return;
    const target = !status.enabled;
    if (status.otpRequired) sendOtp(target);
    else submitChange(target);
  };

  const cancelOtp = () => {
    setPending(null);
    setOtp('');
    setOtpError('');
    setNotice('');
  };

  return (
    <div className="w-full bg-white border border-[#E2E8F0] rounded-2xl md:rounded-[12px] px-4 py-[18px] md:p-5 shadow-sm md:shadow-none">
      <Toast toast={toast} onClose={closeToast} />

      <h3 className="text-[13px] md:text-[14px] font-semibold text-[#0F172A] flex items-center gap-2 mb-3 md:mb-4">
        <span className="w-7 h-7 rounded-lg bg-[#F0FDF4] md:bg-transparent flex items-center justify-center shrink-0">
          <ShieldCheck className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#00A86B] md:text-[#64748B]" />
        </span>
        Two-Factor Authentication
      </h3>

      {!status && !loadFailed && (
        <p className="flex items-center gap-2 text-[12px] text-[#94A3B8]"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading…</p>
      )}

      {loadFailed && (
        <div className="flex items-center justify-between gap-3 p-3 bg-red-50 text-red-600 rounded-[8px] text-[12px]">
          <span>Could not load your two-factor settings.</span>
          <button type="button" onClick={load} className="font-semibold underline shrink-0">Try again</button>
        </div>
      )}

      {status && !status.available && (
        <p className="text-[12px] text-[#64748B]">
          {status.ownerOnly
            ? 'Only the account owner can change two-factor authentication.'
            : 'Two-factor authentication is not available for your company.'}
        </p>
      )}

      {status?.available && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4 rounded-[8px] border border-[#E2E8F0] p-3">
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-[#0F172A] flex items-center gap-2 flex-wrap">
                {status.enabled ? 'Enabled' : 'Disabled'}
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${status.enabled ? 'bg-[#ECFDF5] text-[#00A86B]' : 'bg-[#F1F5F9] text-[#64748B]'}`}>
                  {status.enabled ? 'Protected' : 'Not protected'}
                </span>
              </p>
              <p className="text-[12px] text-[#64748B] mt-1">
                When enabled, each login needs an OTP sent to your registered mobile number, after your email and password.
              </p>
              {status.maskedPhone && (
                <p className="text-[12px] text-[#64748B] mt-1 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 shrink-0" /> {status.maskedPhone}
                </p>
              )}
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={!!status.enabled}
              aria-label="Two-factor authentication"
              disabled={busy || sending || readOnly || pending !== null || (status.otpRequired && block.seconds > 0)}
              onClick={onToggle}
              className={`relative w-10 h-6 rounded-full transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed ${status.enabled ? 'bg-[#00A86B]' : 'bg-[#CBD5E1]'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${status.enabled ? 'translate-x-4' : ''}`} />
            </button>
          </div>

          {readOnly && (
            <p className="text-[12px] text-[#64748B]">You are signed in as this seller. Only the seller can change this setting, as the OTP goes to their mobile.</p>
          )}

          {sending && pending === null && (
            <p className="flex items-center gap-2 text-[12px] text-[#64748B]"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending OTP…</p>
          )}

          {pending === null && !status.otpRequired && !readOnly && (
            <p className="flex items-start gap-2 text-[12px] text-[#00A86B]">
              <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              OTP verified. You can change this setting without an OTP for the next {Math.max(1, Math.ceil((status.verifiedSeconds || 0) / 3600))} hour(s).
            </p>
          )}

          {block.seconds > 0 && status.otpRequired && pending === null && (
            <p className="flex items-start gap-2 p-3 bg-amber-50 text-amber-700 rounded-[8px] text-[12px]">
              <Clock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              You have reached the limit of 3 OTPs. You can request a new one in {formatCountdown(block.seconds)}.
            </p>
          )}

          {pending !== null && (
            <div className="rounded-[8px] border border-[#E2E8F0] p-3 md:p-4 flex flex-col gap-3">
              <div className="text-center">
                <p className="text-[13px] font-semibold text-[#0F172A]">
                  Enter the OTP to {pending ? 'enable' : 'disable'} two-factor authentication
                </p>
                {notice && <p className="text-[12px] text-[#64748B] mt-1">{notice}</p>}
              </div>

              <OtpBoxes
                value={otp}
                onChange={value => { setOtp(value); if (otpError) setOtpError(''); }}
                onComplete={code => submitChange(pending, code)}
                disabled={busy}
                hasError={!!otpError}
              />

              {otpError && (
                <p className="flex items-start justify-center gap-1.5 text-[12px] text-red-600 text-center">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {otpError}
                </p>
              )}

              <div className="flex items-center justify-between gap-3 flex-wrap">
                <button type="button" onClick={cancelOtp} disabled={busy} className="text-[12px] font-semibold text-[#64748B] px-3 py-2 rounded-[8px] border border-[#E2E8F0] hover:bg-[#F8FAFC] disabled:opacity-50">
                  Cancel
                </button>
                <div className="flex items-center gap-3 ml-auto">
                  {block.seconds > 0 ? (
                    <span className="text-[12px] text-amber-700">OTP limit reached. Resend in {formatCountdown(block.seconds)}</span>
                  ) : resend.seconds > 0 ? (
                    <span className="text-[12px] text-[#94A3B8]">Resend in {resend.seconds}s</span>
                  ) : (
                    <button type="button" onClick={() => sendOtp(pending)} disabled={sending || busy} className="text-[12px] font-semibold text-[#00A86B] hover:underline disabled:opacity-50">
                      {sending ? 'Sending…' : 'Resend OTP'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => submitChange(pending, otp)}
                    disabled={busy || otp.length !== OTP_LENGTH}
                    className="text-[12px] font-semibold text-white px-4 py-2 rounded-[8px] bg-[#00A86B] hover:bg-[#008F5C] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {busy ? 'Verifying…' : 'Verify'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** An admin looking at a seller's profile: the status, and the way back in for a seller who lost their mobile. */
export function TwoFactorAdminCard({ userId }: { userId: string }) {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast, showToast, closeToast } = useToast();

  useEffect(() => {
    let alive = true;
    apiClient.get(`/two-factor/admin/${userId}`)
      .then(res => { if (alive) setEnabled(!!res.data.enabled); })
      .catch(() => { if (alive) showToast('error', 'Could not load the two-factor status.'); });
    return () => { alive = false; };
  }, [userId, showToast]);

  const disable = async () => {
    setSaving(true);
    try {
      const res = await apiClient.post(`/two-factor/admin/${userId}/disable`);
      setEnabled(false);
      setConfirming(false);
      showToast('success', res.data.message);
    } catch (err) {
      showToast('error', messageOf(err, 'Could not turn off two-factor authentication.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full bg-white border border-[#E2E8F0] rounded-2xl md:rounded-[12px] px-4 py-[18px] md:p-5 shadow-sm md:shadow-none">
      <Toast toast={toast} onClose={closeToast} />
      <h3 className="text-[13px] md:text-[14px] font-semibold text-[#0F172A] flex items-center gap-2 mb-3">
        <ShieldCheck className="w-4 h-4 text-[#64748B]" /> Two-Factor Authentication
      </h3>
      {enabled === null ? (
        <p className="text-[12px] text-[#94A3B8]">Loading…</p>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-[12px] text-[#64748B]">
            This user has two-factor authentication <span className="font-semibold text-[#0F172A]">{enabled ? 'enabled' : 'disabled'}</span>.
            {' '}Only the user can turn it on.
          </p>
          {enabled && !confirming && (
            <button type="button" onClick={() => setConfirming(true)} className="self-start text-[12px] font-semibold text-red-600 px-3 py-2 rounded-[8px] border border-red-200 hover:bg-red-50">
              Turn off for this user
            </button>
          )}
          {enabled && confirming && (
            <div className="rounded-[8px] border border-red-200 bg-red-50 p-3 flex flex-col gap-2">
              <p className="text-[12px] text-red-700">Use this only when the user can no longer receive OTPs. Their next login will need just the email and password.</p>
              <div className="flex gap-2">
                <button type="button" onClick={disable} disabled={saving} className="text-[12px] font-semibold text-white px-3 py-2 rounded-[8px] bg-red-600 hover:bg-red-700 disabled:opacity-50">
                  {saving ? 'Turning off…' : 'Yes, turn off'}
                </button>
                <button type="button" onClick={() => setConfirming(false)} disabled={saving} className="text-[12px] font-semibold text-[#64748B] px-3 py-2 rounded-[8px] border border-[#E2E8F0] bg-white">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
