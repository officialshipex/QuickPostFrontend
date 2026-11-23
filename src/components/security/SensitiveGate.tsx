import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { getSensitiveStatus, peekSensitiveStatus, SENSITIVE_VERIFIED_EVENT, type SensitiveStatus } from '../../services/sensitiveAccess';
import { SensitiveOtpDialog } from './SensitiveOtpDialog';
import { getRoleFromToken, getToken } from '../../utils/session';

/* Wraps a protected screen (wallet, COD, rate card, couriers, referral, system). Until this computer has passed the
   OTP, the screen is not drawn at all (so it calls none of its APIs) and the OTP popup is shown instead. With the
   check switched off in the backend .env, or for a computer already verified, the screen opens as normal.
   The backend refuses these screens' APIs on its own as well; this only makes it a clean popup. */

type GateState = { phase: 'checking' } | { phase: 'open' } | { phase: 'locked'; status: SensitiveStatus };

export function SensitiveGate({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  // start from the remembered answer when there is one, so a verified computer never sees "Checking…"
  const [state, setState] = useState<GateState>(() => {
    const known = peekSensitiveStatus();
    if (!known) return { phase: 'checking' };
    return !known.enabled || known.verified ? { phase: 'open' } : { phase: 'locked', status: known };
  });

  useEffect(() => {
    let cancelled = false;
    getSensitiveStatus()
      .then((status) => {
        if (cancelled) return;
        setState(!status.enabled || status.verified ? { phase: 'open' } : { phase: 'locked', status });
      })
      // could not ask: draw the screen; the backend still refuses its data and the popup then opens from there
      .catch(() => { if (!cancelled) setState({ phase: 'open' }); });
    const onVerified = () => setState({ phase: 'open' });
    window.addEventListener(SENSITIVE_VERIFIED_EVENT, onVerified);
    return () => { cancelled = true; window.removeEventListener(SENSITIVE_VERIFIED_EVENT, onVerified); };
  }, []);

  if (state.phase === 'open') return <>{children}</>;

  const goBack = () => {
    const token = getToken();
    navigate(token && getRoleFromToken(token) === 'admin' ? '/admin/dashboard' : '/user/home');
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 rounded-2xl bg-[#F1F5F9] flex items-center justify-center mx-auto mb-4">
          <Lock className="w-7 h-7 text-[#94A3B8]" />
        </div>
        <h3 className="text-sm font-bold text-[#0F172A] mb-1">Protected section</h3>
        <p className="text-xs text-[#64748B]">
          {state.phase === 'checking' ? 'Checking this computer…' : 'Verify this computer with an OTP to open this section.'}
        </p>
      </div>
      {state.phase === 'locked' && (
        <SensitiveOtpDialog
          maskedPhone={state.status.maskedPhone}
          hours={state.status.hours}
          onVerified={() => setState({ phase: 'open' })}
          onCancel={goBack}
          cancelLabel="Go back"
        />
      )}
    </div>
  );
}
