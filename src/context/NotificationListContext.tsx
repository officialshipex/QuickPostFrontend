import { createContext, useContext, useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
import { getActiveNotifications, dismissNotification, type AppNotification } from '../services/notificationService';

const POLL_INTERVAL_MS = 15000;

interface NotificationListContextType {
  notifications: AppNotification[];
  dismiss: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const NotificationListContext = createContext<NotificationListContextType>({
  notifications: [],
  dismiss: async () => {},
  refresh: async () => {},
});

export const useNotificationList = () => useContext(NotificationListContext);

// Module-level bridge so files outside this provider's subtree (e.g. the
// bulk-ship submit handler, the bulk-upload modal) can trigger an immediate
// refresh without prop drilling.
let bridge: { refresh: () => Promise<void> } | null = null;

export const refreshNotifications = () => {
  if (bridge) bridge.refresh();
};

export function NotificationListProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const fetchOnce = useCallback(async () => {
    try {
      const response = await getActiveNotifications();
      setNotifications(response.data?.notifications || []);
    } catch (error: any) {
      // apiClient's own interceptor already handles a 401 (logout + redirect);
      // just stop polling here rather than duplicating that logic.
      if (error?.response?.status === 401) stopPolling();
    }
  }, [stopPolling]);

  const startPolling = useCallback(() => {
    stopPolling();
    intervalRef.current = setInterval(fetchOnce, POLL_INTERVAL_MS);
  }, [fetchOnce, stopPolling]);

  useEffect(() => {
    fetchOnce();
    startPolling();
    return stopPolling;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bridge = { refresh: fetchOnce };
    return () => { bridge = null; };
  }, [fetchOnce]);

  // Pause polling while the tab is hidden, resume + refresh immediately when visible.
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        fetchOnce();
        startPolling();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [fetchOnce, startPolling, stopPolling]);

  const dismiss = useCallback(async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n._id !== id));
    try {
      await dismissNotification(id);
    } catch (error) {
      // even if the dismiss call fails, keep it removed locally rather than
      // confusingly reappearing it — the next poll will resync either way
    }
  }, []);

  return (
    <NotificationListContext.Provider value={{ notifications, dismiss, refresh: fetchOnce }}>
      {children}
    </NotificationListContext.Provider>
  );
}
