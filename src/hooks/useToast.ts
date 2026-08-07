import { useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastState {
  type: ToastType;
  text: string;
}

export function useToast(duration = 3000) {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((type: ToastType, text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), duration);
  }, [duration]);

  const closeToast = useCallback(() => setToast(null), []);

  return { toast, showToast, closeToast };
}
