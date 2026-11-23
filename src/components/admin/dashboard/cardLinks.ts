import { createContext, useContext } from 'react';

/** Whether dashboard cards may link through to list pages. Off on the seller (user) side — cards are read-only there. */
export const CardLinksContext = createContext(true);
export const useCardLinks = () => useContext(CardLinksContext);
