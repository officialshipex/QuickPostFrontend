import { useState, useEffect } from 'react';

export function useTableLoader(initialLoadTime: number = 800) {
  const [isLoading, setIsLoading] = useState(true);

  // Initial load simulation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, initialLoadTime);
    return () => clearTimeout(timer);
  }, [initialLoadTime]);

  // Method to trigger a refresh load with a promise
  const startLoading = (duration: number = 800): Promise<void> => {
    setIsLoading(true);
    return new Promise((resolve) => {
      setTimeout(() => {
        setIsLoading(false);
        resolve();
      }, duration);
    });
  };

  return { isLoading, startLoading, setIsLoading };
}
