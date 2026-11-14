import { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { forgetSensitiveStatus, getSensitiveStatus, SENSITIVE_REQUIRED_EVENT } from '../../services/sensitiveAccess';
import { SensitiveOtpDialog } from './SensitiveOtpDialog';

/* Mounted once for the whole app. When any API call is refused because this computer is not verified (an action
   from an ordinary screen — e.g. changing a seller's credit limit or plan from their profile, or a recharge — or a
   48-hour verification that ran out while a screen was open), it opens the OTP popup. After the OTP the person
   repeats what they were doing: the refused action is never sent again on its own (it may move money). */

export function SensitiveOtpListener() {
  const [open, setOpen] = useState<{ maskedPhone?: string; hours?: number } | null>(null);
  const [verifiedNote, setVerifiedNote] = useState(false);

  useEffect(() => {
    const onRequired = () => {
      forgetSensitiveStatus();
      // a protected screen that is still locked shows its own popup: no second one
      if (document.querySelector('[aria-labelledby="sensitive-otp-title"]')) return;
      setOpen((current) => current || {});
      getSensitiveStatus()
        .then((s) => setOpen((current) => (current ? { ...current, maskedPhone: s.maskedPhone, hours: s.hours } : current)))
        .catch(() => { /* the popup works without the masked number */ });
    };
    window.addEventListener(SENSITIVE_REQUIRED_EVENT, onRequired);
    return () => window.removeEventListener(SENSITIVE_REQUIRED_EVENT, onRequired);
  }, []);

  useEffect(() => {
    if (!verifiedNote) return undefined;
    const id = window.setTimeout(() => setVerifiedNote(false), 6000);
    return () => window.clearTimeout(id);
  }, [verifiedNote]);

  return (
    <>
      {open && (
        <SensitiveOtpDialog
          maskedPhone={open.maskedPhone}
          hours={open.hours}
          reason="This action is protected."
          onVerified={() => { setOpen(null); setVerifiedNote(true); }}
          onCancel={() => setOpen(null)}
        />
      )}
      {verifiedNote && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[530] flex items-center gap-2 px-4 py-3 rounded-xl bg-[#0F172A] text-white text-xs font-semibold shadow-2xl">
          <CheckCircle2 className="w-4 h-4 text-[#34D399]" />
          Computer verified. Please do that again now.
        </div>
      )}
    </>
  );
}
