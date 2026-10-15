import { useState, type ReactNode } from 'react';
import { clearIntro, getShippingMode, hasPendingIntro, modeUrl } from '../utils/shippingMode';
import { ModeTransition } from '../components/admin/layout/ModeTransition';
import { ShippingModeContext, type ShippingMode } from './shippingMode';

/* B2C ⇄ Cargo mode for the seller and admin side — read from the URL (`/cargo/...` = Cargo).
   Switching modes is a full navigation to the other mode's URL.
   A Cargo tab opened from the switch plays the branded switch animation once on load. */

export function ShippingModeProvider({ children }: { children: ReactNode }) {
  const [mode] = useState<ShippingMode>(getShippingMode);
  const [intro, setIntro] = useState(hasPendingIntro);

  const setMode = (next: ShippingMode, path?: string) => {
    if (next === mode) return;
    const home = path || (window.location.pathname.includes('/admin/') || window.location.pathname.includes('/internal-crm') ? '/admin/dashboard' : '/user/home');
    window.location.assign(modeUrl(next, home));
  };

  return (
    <ShippingModeContext.Provider value={{ mode, isCargo: mode === 'cargo', setMode }}>
      {children}
      <ModeTransition from="b2c" to={intro ? mode : null} onDone={() => { clearIntro(); setIntro(false); }} />
    </ShippingModeContext.Provider>
  );
}
