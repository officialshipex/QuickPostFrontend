import { vasApi, type VasAccess } from '../pages/admin/vas/vasApi';

/**
 * Whether the signed-in seller may see RTO risk: RTO Score must be switched on for them by admin AND activated
 * (and, when charged, within its plan). One shared lookup serves every row of an orders table.
 */
const TTL_MS = 60_000;
let cached: { at: number; value: Promise<VasAccess | null> } | null = null;

export function getRtoScoreAccess(): Promise<VasAccess | null> {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.value;
  const value = vasApi.mine('rto-score').catch(() => null);
  cached = { at: Date.now(), value };
  return value;
}

/** Call after the seller activates / deactivates RTO Score so open tables pick it up at once. */
export function invalidateRtoScoreAccess() {
  cached = null;
}

export const canViewRtoScore = (a: VasAccess | null) => !!a && a.enabled && a.status === 'active' && a.entitled;
