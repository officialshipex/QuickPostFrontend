import { useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';

/**
 * Dashboard overview (/dashboard/getDashboardOverview) for one date range.
 * Responses are cached per range + seller for the session tab, so several cards asking for the same range
 * (e.g. "Today" in every card) share one request. `refreshKey` bumps force a refetch.
 */
const cache = new Map<string, Promise<any>>();

export function overviewKey(start: Date, end: Date, userId = '') {
  return `${start.toISOString()}|${end.toISOString()}|${userId}`;
}

export function clearOverviewCache() { cache.clear(); }

export function useOverviewRange(start: Date | null, end: Date | null, userId = '', refreshKey = 0) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const key = start && end ? overviewKey(start, end, userId) : '';

  useEffect(() => {
    if (!key || !start || !end) return;
    let alive = true;
    setLoading(true);
    if (!cache.has(key)) {
      const q = `?startDate=${start.toISOString()}&endDate=${end.toISOString()}${userId ? `&userId=${userId}` : ''}`;
      cache.set(key, apiClient.get(`/dashboard/getDashboardOverview${q}`).then(r => r.data?.data ?? null).catch(e => { cache.delete(key); throw e; }));
    }
    cache.get(key)!.then(d => { if (alive) { setData(d); setLoading(false); } }).catch(() => { if (alive) { setData(null); setLoading(false); } });
    return () => { alive = false; };
  }, [key, refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading };
}

/* ── range helpers ─────────────────────────────────────────────── */
const dayStart = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const dayEnd = (d: Date) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };

export function todayRange() { const n = new Date(); return { start: dayStart(n), end: dayEnd(n) }; }
export function yesterdayRange() { const n = new Date(); n.setDate(n.getDate() - 1); return { start: dayStart(n), end: dayEnd(n) }; }
export function last7Range() { const s = new Date(); s.setDate(s.getDate() - 6); return { start: dayStart(s), end: dayEnd(new Date()) }; }

/** 'all' or 'YYYY-MM' → range (current month ends today). */
export function monthRange(month: string) {
  const now = new Date();
  if (month === 'all') return { start: new Date(FIRST_MONTH.year, FIRST_MONTH.month, 1), end: dayEnd(now) };
  const [y, m] = month.split('-').map(Number);
  const start = new Date(y, m - 1, 1);
  const last = new Date(y, m, 0);
  return { start, end: dayEnd(last > now ? now : last) };
}

/** Month filter options: All time, then every month from the current one back to March 2026 (first month with data). */
export const FIRST_MONTH = { year: 2026, month: 2 }; // March 2026 (0-based month)
export function monthOptions() {
  const out: { value: string; label: string }[] = [{ value: 'all', label: 'All time' }];
  const d = new Date(); d.setDate(1);
  const floor = new Date(FIRST_MONTH.year, FIRST_MONTH.month, 1);
  while (d >= floor) {
    out.push({ value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) });
    d.setMonth(d.getMonth() - 1);
  }
  return out;
}
export const currentMonth = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };
