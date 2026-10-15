import { createContext, useContext } from 'react';

import type { ShippingMode } from '../utils/shippingMode';

export type { ShippingMode };

export interface ShippingModeValue {
  mode: ShippingMode;
  isCargo: boolean;
  /** Full navigation to `path` (an app path) in the other mode; defaults to that panel's home. */
  setMode: (mode: ShippingMode, path?: string) => void;
}

export const ShippingModeContext = createContext<ShippingModeValue>({
  mode: 'b2c',
  isCargo: false,
  setMode: () => {},
});

export const useShippingMode = () => useContext(ShippingModeContext);
