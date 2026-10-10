import { useState, type ReactNode } from 'react';
import { getToken } from '../utils/session';
import { ShippingModeContext, type ShippingMode } from './shippingMode';

/* B2C ⇄ Cargo mode for the seller side.
   Persisted in localStorage but bound to the current login token, so it survives
   refreshes/new tabs, and every fresh login starts in B2C (the default). */

const KEY = 'qp_shipping_mode';
const tokenTag = () => (getToken() || '').slice(-16);

function readMode(): ShippingMode {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || 'null');
    return v?.t && v.t === tokenTag() && v.mode === 'cargo' ? 'cargo' : 'b2c';
  } catch { return 'b2c'; }
}

export function ShippingModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ShippingMode>(readMode);

  const setMode = (next: ShippingMode) => {
    try { localStorage.setItem(KEY, JSON.stringify({ t: tokenTag(), mode: next })); } catch { /* storage blocked */ }
    setModeState(next);
  };

  return (
    <ShippingModeContext.Provider value={{ mode, isCargo: mode === 'cargo', setMode }}>
      {children}
    </ShippingModeContext.Provider>
  );
}
