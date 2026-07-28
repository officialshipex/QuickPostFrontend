import { useState } from 'react';

/**
 * Date-range filter state used alongside <GlassDateFilter> across Orders/NDR/etc —
 * plain start/end strings (yyyy-mm-dd) plus a change handler matching
 * GlassDateFilter's onDateChange(start, end) contract, and a reset helper.
 */
export function useDateRangeFilter(initialStart = '', initialEnd = '') {
  const [dateStart, setDateStart] = useState(initialStart);
  const [dateEnd, setDateEnd] = useState(initialEnd);

  const onDateChange = (start: string, end: string) => {
    setDateStart(start);
    setDateEnd(end);
  };

  const clearDateRange = () => {
    setDateStart('');
    setDateEnd('');
  };

  return { dateStart, dateEnd, setDateStart, setDateEnd, onDateChange, clearDateRange };
}
