import { apiClient } from './apiClient';
import { getToken } from '../utils/session';

/* OTP check for the protected sections (backend auth/sensitiveAccess.js, switched on with SENSITIVE_OTP_ENABLED in
   the backend .env). The backend decides everything; this file only asks it and remembers the answer briefly. */

export type SensitiveStatus = {
  enabled: boolean;
  verified?: boolean;
  expiresAt?: string | null;
  hours?: number;
  maskedPhone?: string;
};

/** Sent on any API call the backend refused because this computer is not verified yet. */
export const SENSITIVE_REQUIRED_EVENT = 'sensitive-otp-required';
/** Sent once the OTP is accepted, so every locked screen opens. */
export const SENSITIVE_VERIFIED_EVENT = 'sensitive-otp-verified';
export const SENSITIVE_CODE = 'SENSITIVE_OTP_REQUIRED';

// The last answer, per login token (signing in as someone else gives a different token), for one minute
const CACHE_MS = 60 * 1000;
let cached: { token: string | null; at: number; status: SensitiveStatus } | null = null;
let pending: { token: string | null; promise: Promise<SensitiveStatus> } | null = null;

export async function getSensitiveStatus(): Promise<SensitiveStatus> {
  const token = getToken();
  const now = Date.now();
  if (cached && cached.token === token && now - cached.at < CACHE_MS) {
    const expired = cached.status.verified && cached.status.expiresAt && new Date(cached.status.expiresAt).getTime() <= now;
    if (!expired) return cached.status;
  }
  if (pending && pending.token === token) return pending.promise;
  const promise = apiClient
    .get('/sensitive-access/status')
    .then((r) => {
      const status: SensitiveStatus = {
        enabled: !!r.data.enabled,
        verified: !!r.data.verified,
        expiresAt: r.data.expiresAt || null,
        hours: r.data.hours,
        maskedPhone: r.data.maskedPhone || '',
      };
      cached = { token, at: Date.now(), status };
      return status;
    })
    .finally(() => { pending = null; });
  pending = { token, promise };
  return promise;
}

/** The remembered answer for this login, when there is a fresh one (no request). */
export function peekSensitiveStatus(): SensitiveStatus | null {
  const now = Date.now();
  if (!cached || cached.token !== getToken() || now - cached.at >= CACHE_MS) return null;
  if (cached.status.verified && cached.status.expiresAt && new Date(cached.status.expiresAt).getTime() <= now) return null;
  return cached.status;
}

export function forgetSensitiveStatus() {
  cached = null;
}

export async function sendSensitiveOtp() {
  const { data } = await apiClient.post('/sensitive-access/send-otp');
  return data as { maskedPhone: string; resendInSeconds?: number; expiresInSeconds?: number; sendsLeft?: number; retryAfterSeconds?: number; message?: string };
}

export async function verifySensitiveOtp(otp: string) {
  const { data } = await apiClient.post('/sensitive-access/verify', { otp });
  const status: SensitiveStatus = { enabled: true, verified: true, expiresAt: data.expiresAt, hours: data.hours };
  cached = { token: getToken(), at: Date.now(), status };
  window.dispatchEvent(new CustomEvent(SENSITIVE_VERIFIED_EVENT, { detail: status }));
  return data as { expiresAt: string; hours: number; message?: string };
}
