import { useEffect, useRef, useState } from 'react';
import { getToken } from '../../utils/session';

export function getLast7DaysStr(): [string, string] {
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - 6);
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  return [fmt(start), fmt(end)];
}

/* Seller side only: the date range picked on any page is shared by every page with a
   date filter. Stored in localStorage and bound to the current login token, so it resets
   on logout / a new login, and is cleared when the seller goes back to the default
   (last 7 days) or clears the filter. Admin pages keep their own per-page range. */
const SHARED_KEY = 'qp_date_range';
const isSellerSide = () => typeof window !== 'undefined' && window.location.pathname.startsWith('/user/');
const tokenTag = () => (getToken() || '').slice(-16);

function readSharedRange(): [string, string] | null {
  if (!isSellerSide()) return null;
  try {
    const v = JSON.parse(localStorage.getItem(SHARED_KEY) || 'null');
    if (v?.t === tokenTag() && v.start && v.end) return [v.start, v.end];
  } catch { /* storage blocked */ }
  return null;
}

/** Seller's shared range if one is set, else the default last 7 days — use when a page resets
 *  its filters for a reason other than the seller clearing them (e.g. switching tabs). */
export function getSharedOrDefaultRange(): [string, string] {
  return readSharedRange() ?? getLast7DaysStr();
}

function writeSharedRange(start: string, end: string, defStart: string, defEnd: string) {
  if (!isSellerSide()) return;
  try {
    if (!start || !end || (start === defStart && end === defEnd)) localStorage.removeItem(SHARED_KEY);
    else localStorage.setItem(SHARED_KEY, JSON.stringify({ t: tokenTag(), start, end }));
  } catch { /* storage blocked */ }
}

/**
 * Date-range filter state used alongside <GlassDateFilter> across Orders/NDR/etc —
 * plain start/end strings (yyyy-mm-dd) plus a change handler matching
 * GlassDateFilter's onDateChange(start, end) contract, and a reset helper.
 * Defaults to the seller's shared range (seller side), else last 7 days, unless
 * initial values are provided (e.g. from the URL).
 */
export function useDateRangeFilter(initialStart?: string, initialEnd?: string) {
  const [defStart, defEnd] = getLast7DaysStr();
  const [dateStart, setDateStart] = useState(() => initialStart ?? readSharedRange()?.[0] ?? defStart);
  const [dateEnd, setDateEnd] = useState(() => initialEnd ?? readSharedRange()?.[1] ?? defEnd);

  // Share changes made by the seller (skip the initial mount so opening a page never overwrites it).
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    writeSharedRange(dateStart, dateEnd, defStart, defEnd);
    // defStart/defEnd are derived from "today" and only matter for the comparison.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateStart, dateEnd]);

  const onDateChange = (start: string, end: string) => {
    setDateStart(start);
    setDateEnd(end);
  };

  const clearDateRange = () => {
    setDateStart('');
    setDateEnd('');
  };

  const isDefaultDateRange = dateStart === defStart && dateEnd === defEnd;

  return { dateStart, dateEnd, setDateStart, setDateEnd, onDateChange, clearDateRange, defStart, defEnd, isDefaultDateRange };
}
