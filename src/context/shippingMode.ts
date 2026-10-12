import { createContext, useContext } from 'react';

import type { ShippingMode } from '../utils/shippingMode';

export type { ShippingMode };

export interface ShippingModeValue {
  mode: ShippingMode;
  isCargo: boolean;
  setMode: (mode: ShippingMode) => void;
}

export const ShippingModeContext = createContext<ShippingModeValue>({
  mode: 'b2c',
  isCargo: false,
  setMode: () => {},
});

export const useShippingMode = () => useContext(ShippingModeContext);
