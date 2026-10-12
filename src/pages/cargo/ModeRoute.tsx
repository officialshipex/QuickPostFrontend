import type { ReactNode } from 'react';
import { useShippingMode } from '../../context/shippingMode';

/* Renders the Cargo page when the seller is in Cargo mode, otherwise the B2C page.
   Both share the same URL (/user/orders, /user/ndr, …) so tabs, links and deep links work in either mode. */
export function ModeRoute({ b2c, cargo }: { b2c: ReactNode; cargo: ReactNode }) {
  const { isCargo } = useShippingMode();
  return <>{isCargo ? cargo : b2c}</>;
}
