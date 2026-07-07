import { useState, useEffect, useCallback } from 'react';

export function useTableLoader(initialLoadTime: number = 800) {
  const [isLoading, setIsLoading] = useState(true);

  // Initial load simulation
  useEffect(() => {
    if (initialLoadTime > 0) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, initialLoadTime);
      return () => clearTimeout(timer);
    }
  }, [initialLoadTime]);

  // Method to trigger a refresh load. If duration is provided, it simulates a timeout.
  // Otherwise, it just starts loading and relies on stopLoading to finish.
  const startLoading = useCallback((duration?: number): Promise<void> | void => {
    setIsLoading(true);
    if (duration) {
      return new Promise((resolve) => {
        setTimeout(() => {
          setIsLoading(false);
          resolve();
        }, duration);
      });
    }
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  return { isLoading, startLoading, stopLoading, setIsLoading };
}
