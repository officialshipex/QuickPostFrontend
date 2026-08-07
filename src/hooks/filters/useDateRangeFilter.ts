import { useState } from 'react';

export function getLast7DaysStr(): [string, string] {
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - 6);
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  return [fmt(start), fmt(end)];
}

/**
 * Date-range filter state used alongside <GlassDateFilter> across Orders/NDR/etc —
 * plain start/end strings (yyyy-mm-dd) plus a change handler matching
 * GlassDateFilter's onDateChange(start, end) contract, and a reset helper.
 * Defaults to last 7 days when no initial values are provided.
 */
export function useDateRangeFilter(initialStart?: string, initialEnd?: string) {
  const [defStart, defEnd] = getLast7DaysStr();
  const [dateStart, setDateStart] = useState(initialStart ?? defStart);
  const [dateEnd, setDateEnd] = useState(initialEnd ?? defEnd);

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
