import { useEffect, useRef, useState } from 'react';

/**
 * Skeleton timing for dashboard-style pages.
 *
 * Shows the skeleton while `loading` is true and, every time `key` changes (e.g. switching tabs),
 * for a short randomised window (minMs–maxMs) so the swap feels like real data arriving rather than a
 * static jump. When the window ends, `revealKey` changes — use it as a React key on the content wrapper
 * so the content fades in fresh.
 *
 *   const { showSkeleton, revealKey } = useSkeletonReveal(tab, loading);
 */
export function useSkeletonReveal(key: string, loading: boolean, minMs = 1000, maxMs = 1800) {
  const [holding, setHolding] = useState(true);
  const [revealKey, setRevealKey] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setHolding(true);
    if (timer.current) clearTimeout(timer.current);
    const wait = minMs + Math.random() * Math.max(0, maxMs - minMs);
    timer.current = setTimeout(() => setHolding(false), wait);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [key, minMs, maxMs]);

  const showSkeleton = loading || holding;
  const prev = useRef(showSkeleton);
  useEffect(() => {
    if (prev.current && !showSkeleton) setRevealKey(k => k + 1);
    prev.current = showSkeleton;
  }, [showSkeleton]);

  return { showSkeleton, revealKey };
}
