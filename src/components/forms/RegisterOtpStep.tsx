import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, Mail, Smartphone, X, AlertCircle, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../services/apiClient';

// OTP check of the email AND mobile number before an account is created — only when the company has
// "OTP at registration" switched on (QuickPost > System > Companies). The register call then carries
// emailOtpToken + phoneOtpToken; the backend refuses it without them.
//
//   const otp = useRegisterOtp();
//   const tokens = await otp.verify(email, phone);   // null = closed by the user
//   ... post('/external/register', { ...form, ...tokens }) ...
//   {otp.dialog}

export interface RegisterOtpTokens { emailOtpToken?: string; phoneOtpToken?: string }
type Channel = 'email' | 'phone';
interface Verified { target: string; token: string }

const normEmail = (v: string) => v.trim().toLowerCase();
const normPhone = (v: string) => v.replace(/\D/g, '').slice(-10);
const errText = (e: any, fallback: string) => e?.response?.data?.message || e?.message || fallback;

// fields: the form's input names, so "Change email / mobile" can put the cursor back in that field.
export function useRegisterOtp(fields: Record<Channel, string> = { email: 'email', phone: 'phone' }) {
  const [required, setRequired] = useState<boolean | null>(null);
  const [open, setOpen] = useState<{ email: string; phone: string } | null>(null);
  const verified = useRef<Partial<Record<Channel, Verified>>>({});
  const resolver = useRef<((t: RegisterOtpTokens | null) => void) | null>(null);
  const [, rerender] = useState(0);

  // Which of these two are verified already (for the ticks on the form).
  const status = (email: string, phone: string) => ({
    email: verified.current.email?.target === normEmail(email),
    phone: verified.current.phone?.target === normPhone(phone),
  });

  useEffect(() => {
    apiClient.get('/auth/register-otp/config')
      .then(r => setRequired(r.data?.required === true))
      .catch(() => setRequired(false)); // an older backend: no OTP step (it would not ask for one either)
  }, []);

  const tokensFor = (email: string, phone: string): RegisterOtpTokens | null => {
    const e = verified.current.email, p = verified.current.phone;
    if (e?.target === normEmail(email) && p?.target === normPhone(phone)) return { emailOtpToken: e.token, phoneOtpToken: p.token };
    return null;
  };

  const verify = useCallback(async (email: string, phone: string): Promise<RegisterOtpTokens | null> => {
    let need = required;
    if (need === null) {
      try { need = (await apiClient.get('/auth/register-otp/config')).data?.required === true; } catch { need = false; }
      setRequired(need);
    }
    if (!need) return {};
    const ready = tokensFor(email, phone);
    if (ready) return ready;
    return new Promise(resolve => { resolver.current = resolve; setOpen({ email, phone }); });
  }, [required]);

  const finish = (t: RegisterOtpTokens | null) => {
    setOpen(null);
    resolver.current?.(t);
    resolver.current = null;
  };

  const dialog = open ? (
    <RegisterOtpDialog
      email={open.email}
      phone={open.phone}
      already={verified.current}
      onVerified={(ch, v) => { verified.current = { ...verified.current, [ch]: v }; rerender(n => n + 1); }}
      onDone={() => finish(tokensFor(open.email, open.phone))}
      onClose={() => finish(null)}
      onEdit={(ch) => {
        finish(null);
        setTimeout(() => {
          const el = document.querySelector<HTMLInputElement>(`input[name="${fields[ch]}"]`);
          if (el) { el.focus(); el.select(); }
        }, 50);
      }}
    />
  ) : null;

  return { required, verify, status, dialog };
}

// Shown on the form (under email + mobile) when the company asks for OTP at registration.
export function RegisterOtpFormBar({ otp, email, phone }: {
  otp: ReturnType<typeof useRegisterOtp>; email: string; phone: string;
}) {
  if (otp.required !== true) return null;
  const s = otp.status(email || '', phone || '');
  const ready = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((email || '').trim()) && /^[6-9]\d{9}$/.test(normPhone(phone || ''));
  const Tick = ({ ok, label }: { ok: boolean; label: string }) => (
    <span className={`flex items-center gap-1 text-[11px] font-semibold ${ok ? 'text-[#00A86B]' : 'text-[#94A3B8]'}`}>
      <CheckCircle2 className="w-3.5 h-3.5" />{label} {ok ? 'verified' : 'not verified'}
    </span>
  );
  return (
    <div className="rounded-lg border border-[#DCFCE7] bg-[#F0FDF4] px-3 py-2.5 flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-semibold text-[#0F172A] flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-[#00A86B]" />Verify your email and mobile with OTP</span>
        <div className="flex gap-3"><Tick ok={s.email} label="Email" /><Tick ok={s.phone} label="Mobile" /></div>
      </div>
      {!(s.email && s.phone) && (
        <button type="button" disabled={!ready} onClick={() => { otp.verify(email, phone); }}
          title={ready ? undefined : 'Enter a valid email and 10-digit mobile number first'}
          className="h-8 px-3 rounded-md bg-[#00A86B] text-white text-xs font-semibold disabled:opacity-50 shrink-0">
          Send OTP
        </button>
      )}
    </div>
  );
}

function OtpRow({ channel, label, shown, target, already, onVerified, onEdit }: {
  channel: Channel; label: string; shown: string; target: string;
  already?: Verified; onVerified: (v: Verified) => void; onEdit: () => void;
}) {
  const [done, setDone] = useState(already?.target === target);
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [sent, setSent] = useState(false);
  const [wait, setWait] = useState(0);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  // already registered: no OTP can be sent, only changing it (or logging in) helps
  const [taken, setTaken] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait(w => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const body = channel === 'email' ? { channel, email: target } : { channel, phoneNumber: target };

  const send = async () => {
    setSending(true); setMsg(null);
    try {
      const r = await apiClient.post('/auth/register-otp/send', body);
      setSent(true); setWait(r.data?.resendAfter || 30);
      setMsg({ ok: true, text: r.data?.message || 'OTP sent' });
    } catch (e: any) {
      if (e?.response?.status === 409) { setTaken(errText(e, `This ${label.toLowerCase()} is already registered.`)); return; }
      const after = e?.response?.data?.retryAfter;
      if (after) { setSent(true); setWait(after); }
      setMsg({ ok: false, text: errText(e, 'Could not send the OTP') });
    } finally { setSending(false); }
  };

  useEffect(() => {
    if (done || started.current) return;
    started.current = true;
    send();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const check = async () => {
    if (!/^\d{6}$/.test(code)) { setMsg({ ok: false, text: 'Enter the 6-digit OTP' }); return; }
    setChecking(true); setMsg(null);
    try {
      const r = await apiClient.post('/auth/register-otp/verify', { ...body, otp: code });
      onVerified({ target, token: r.data.token });
      setDone(true);
    } catch (e: any) {
      setMsg({ ok: false, text: errText(e, 'Could not verify the OTP') });
    } finally { setChecking(false); }
  };

  const Icon = channel === 'email' ? Mail : Smartphone;
  return (
    <div className={`rounded-xl border p-4 ${done ? 'border-[#BBF7D0] bg-[#F0FDF4]' : taken ? 'border-red-200 bg-red-50' : 'border-[#E2E8F0]'}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className={`w-4 h-4 shrink-0 ${taken ? 'text-red-500' : 'text-[#00A86B]'}`} />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#0F172A]">{label}</p>
            <p className="text-[11px] text-[#64748B] truncate">{shown}</p>
          </div>
        </div>
        {done && <span className="flex items-center gap-1 text-xs font-semibold text-[#00A86B] shrink-0"><CheckCircle2 className="w-4 h-4" /> Verified</span>}
      </div>
      {taken ? (
        <div className="mt-3">
          <p className="text-[11px] text-red-600 flex items-start gap-1"><AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" />{taken}</p>
          <div className="flex items-center gap-3 mt-2.5">
            <button type="button" onClick={onEdit}
              className="h-9 px-4 rounded-md bg-[#00A86B] text-white text-xs font-semibold">
              Change {channel === 'email' ? 'email' : 'mobile number'}
            </button>
            <Link to="/login" className="text-xs font-semibold text-[#00A86B] hover:underline">Log in instead</Link>
          </div>
        </div>
      ) : !done && (
        <>
          <div className="flex gap-2 mt-3">
            <input
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); check(); } }}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="6-digit OTP"
              className="flex-1 min-w-0 h-10 px-3 rounded-md border border-[#E2E8F0] text-sm tracking-[0.3em] focus:outline-none focus:border-[#00A86B]"
            />
            <button type="button" onClick={check} disabled={checking || code.length !== 6}
              className="h-10 px-4 rounded-md bg-[#00A86B] text-white text-xs font-semibold disabled:opacity-50 shrink-0">
              {checking ? 'Checking…' : 'Verify'}
            </button>
          </div>
          <div className="flex items-center justify-between mt-2 gap-2">
            {msg ? (
              <p className={`text-[11px] flex items-start gap-1 ${msg.ok ? 'text-[#00A86B]' : 'text-red-500'}`}>
                {!msg.ok && <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" />}{msg.text}
              </p>
            ) : <span />}
            <div className="flex items-center gap-3 shrink-0">
              <button type="button" onClick={onEdit} className="text-[11px] font-semibold text-[#64748B] hover:text-[#0F172A]">
                Change
              </button>
              <button type="button" onClick={send} disabled={sending || wait > 0}
                className="text-[11px] font-semibold text-[#00A86B] disabled:text-[#94A3B8]">
                {sending ? 'Sending…' : wait > 0 ? `Resend in ${wait}s` : sent ? 'Resend OTP' : 'Send OTP'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function RegisterOtpDialog({ email, phone, already, onVerified, onDone, onClose, onEdit }: {
  email: string; phone: string; already: Partial<Record<Channel, Verified>>;
  onVerified: (ch: Channel, v: Verified) => void; onDone: () => void; onClose: () => void; onEdit: (ch: Channel) => void;
}) {
  const e = normEmail(email), p = normPhone(phone);
  const [ok, setOk] = useState({ email: already.email?.target === e, phone: already.phone?.target === p });
  const both = ok.email && ok.phone;

  // both verified: carry on with the registration by itself
  useEffect(() => {
    if (!both) return;
    const t = setTimeout(onDone, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [both]);

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0F172A]/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 text-[#94A3B8] hover:text-[#475569]"><X className="w-4 h-4" /></button>
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-5 h-5 text-[#00A86B]" />
          <h3 className="text-base font-bold text-[#0F172A]">Verify your email and mobile</h3>
        </div>
        <p className="text-xs text-[#64748B] mb-4">We send a 6-digit code to each. Enter both to create your account.</p>
        <div className="space-y-3">
          <OtpRow channel="email" label="Email" shown={email.trim()} target={e} already={already.email}
            onVerified={v => { onVerified('email', v); setOk(s => ({ ...s, email: true })); }} onEdit={() => onEdit('email')} />
          <OtpRow channel="phone" label="Mobile number" shown={`+91 ${p}`} target={p} already={already.phone}
            onVerified={v => { onVerified('phone', v); setOk(s => ({ ...s, phone: true })); }} onEdit={() => onEdit('phone')} />
        </div>
        {both && <p className="text-[11px] text-center mt-4 text-[#00A86B] font-semibold">Verified. Creating your account…</p>}
      </div>
    </div>,
    document.body
  );
}
