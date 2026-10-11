import { useState, type ReactNode } from 'react';
import { clearIntro, getShippingMode, hasPendingIntro, saveShippingMode } from '../utils/shippingMode';
import { ModeTransition } from '../components/admin/layout/ModeTransition';
import { ShippingModeContext, type ShippingMode } from './shippingMode';

/* B2C ⇄ Cargo mode for the seller side — per tab, bound to the login token (see utils/shippingMode).
   A Cargo tab opened from the switch plays the branded switch animation once on load. */

export function ShippingModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ShippingMode>(getShippingMode);
  const [intro, setIntro] = useState(hasPendingIntro);

  const setMode = (next: ShippingMode) => {
    saveShippingMode(next);
    setModeState(next);
  };

  return (
    <ShippingModeContext.Provider value={{ mode, isCargo: mode === 'cargo', setMode }}>
      {children}
      <ModeTransition from="b2c" to={intro ? mode : null} onDone={() => { clearIntro(); setIntro(false); }} />
    </ShippingModeContext.Provider>
  );
}
