import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { apiClient } from '../services/apiClient';
import { getToken } from '../utils/session';

export type Theme = 'light' | 'dark';

/** Same key as the small script in index.html that applies the saved theme before the first paint. */
export const THEME_STORAGE_KEY = 'qp_theme';

const readSaved = (): Theme | null => {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return saved === 'dark' || saved === 'light' ? saved : null;
  } catch {
    return null; // storage blocked
  }
};

function readTheme(): Theme {
  return readSaved() ?? (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}

const writeSaved = (t: Theme) => {
  try { localStorage.setItem(THEME_STORAGE_KEY, t); } catch { /* the choice just is not remembered in this browser */ }
};

/** Keeps the choice on the person's account so it follows them to any browser or device. Best effort: never blocks the UI. */
const saveToAccount = (t: Theme) => {
  if (!getToken()) return;
  apiClient.put('/ui-preferences', { theme: t }).catch(() => { /* offline / signed out: the browser copy still works */ });
};

interface ThemeValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  /** Called once the panel is open: the account's saved choice (if any) replaces this browser's. */
  syncFromAccount: () => Promise<void>;
}

const ThemeContext = createContext<ThemeValue>({ theme: 'light', setTheme: () => {}, toggleTheme: () => {}, syncFromAccount: async () => {} });

/**
 * Light / dark choice. Fast path: this browser's saved copy (no flash, works signed out). Source of truth once signed in:
 * the account (`/ui-preferences`), so the choice follows the person to another browser or device. The first visit with no
 * choice anywhere follows the computer's light / dark setting.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readTheme);
  const syncedFor = useRef<string | null>(null); // the sign-in the account's choice was already fetched for
  const changedByUser = useRef(false); // the person already chose in this session: a slow account answer must not undo it

  const setTheme = useCallback((t: Theme) => {
    changedByUser.current = true;
    setThemeState(t);
    writeSaved(t);
    saveToAccount(t);
  }, []);
  const toggleTheme = useCallback(() => setTheme(theme === 'dark' ? 'light' : 'dark'), [theme, setTheme]);

  const syncFromAccount = useCallback(async () => {
    const token = getToken();
    if (!token || syncedFor.current === token) return; // once per sign-in
    syncedFor.current = token;
    try {
      const { data } = await apiClient.get('/ui-preferences');
      if (changedByUser.current) return;
      const remote: Theme | null = data?.theme === 'dark' || data?.theme === 'light' ? data.theme : null;
      if (remote) {
        setThemeState(remote); // the account wins: this is how a choice made on another device arrives
        writeSaved(remote);
      } else {
        const local = readSaved();
        if (local) saveToAccount(local); // chose before accounts stored it: keep that choice and store it now
      }
    } catch {
      syncedFor.current = null; // try again next time the panel opens
    }
  }, []);

  const value = useMemo(() => ({ theme, setTheme, toggleTheme, syncFromAccount }), [theme, setTheme, toggleTheme, syncFromAccount]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => useContext(ThemeContext);

/**
 * Called by the panel shell only: dark mode is applied while the signed-in panel is on screen, so the public pages
 * (landing, tracking, login, a seller's branded page) always keep their own look. Layout effect = no light flash.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useApplyPanelTheme() {
  const { theme, syncFromAccount } = useTheme();

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    // Whatever is printed (labels, manifests, invoices, a page) always comes out in the light colours
    const beforePrint = () => root.removeAttribute('data-theme');
    const afterPrint = () => root.setAttribute('data-theme', theme);
    window.addEventListener('beforeprint', beforePrint);
    window.addEventListener('afterprint', afterPrint);
    return () => {
      window.removeEventListener('beforeprint', beforePrint);
      window.removeEventListener('afterprint', afterPrint);
      root.removeAttribute('data-theme');
    };
  }, [theme]);

  // Once per panel session: pick up the choice stored on the account
  useEffect(() => { syncFromAccount(); }, [syncFromAccount]);
}
