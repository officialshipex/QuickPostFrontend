import { useEffect, useState } from 'react';
import { apiClient } from './apiClient';

/* Registration "Monthly Orders" dropdown = the seller's shipment commitment (backend ratePlans/: from the next
   month-end review, shipping that many a month earns that plan). The ranges come from the company's settings
   (admin: Rate Cards → Automatic Plans); the defaults below are shown until they load or if the call fails. */

export interface MonthlyOrderOption { value: string; label: string; planName: string }

// Only the range is shown and saved; planName is sent along so the commitment is saved (not shown).
export const DEFAULT_MONTHLY_ORDER_OPTIONS: MonthlyOrderOption[] = [
  { value: '0-1000', label: '0-1000', planName: 'Bronze' },
  { value: '1001-3000', label: '1001-3000', planName: 'Silver' },
  { value: '3001-6000', label: '3001-6000', planName: 'Gold' },
  { value: '6001-10000+', label: '6001-10000+', planName: 'Diamond' },
];

export function useMonthlyOrderOptions() {
  const [options, setOptions] = useState<MonthlyOrderOption[]>(DEFAULT_MONTHLY_ORDER_OPTIONS);
  useEffect(() => {
    let alive = true;
    apiClient.get('/rate-plans/commitment-options')
      .then(res => {
        const list = res.data?.options;
        if (alive && Array.isArray(list) && list.length) setOptions(list);
      })
      .catch(() => { /* keep the defaults */ });
    return () => { alive = false; };
  }, []);
  return options;
}

/** The plan a chosen dropdown value commits to (sent with the registration) */
export const commitmentPlanOf = (options: MonthlyOrderOption[], value: string) => options.find(o => o.value === value)?.planName;
