import { useState } from 'react';

/**
 * Apply / Clear All visibility for a filter bar:
 *  - at the default filters → neither button
 *  - filters changed but not applied yet → "Apply Filters"
 *  - applied (non-default) filters → "Clear All"
 * `signature` is a serialisation of the bar's current filter values; call `markApplied()`
 * when the filters are applied. Returning to the default (e.g. Clear All) counts as applied.
 */
export function useFilterApplyState(signature: string, hasActive: boolean) {
  const [applied, setApplied] = useState(signature);
  // Render-time sync: the default state is always "applied", so a later change is detected correctly.
  if (!hasActive && applied !== signature) setApplied(signature);
  const dirty = signature !== applied;
  return {
    showApply: hasActive && dirty,
    showClear: hasActive && !dirty,
    markApplied: () => setApplied(signature),
  };
}
