/* This browser's own random id, sent as x-device-id on every API call. The backend uses it to remember that this
   computer passed the OTP for the protected sections (wallet, COD, rate cards, couriers, system) for 48 hours
   (backend auth/sensitiveAccess.js). It is not tied to the login: logging out and in again keeps it. Clearing the
   browser's site data creates a new one, which counts as a new computer. */

const KEY = 'qp_device_id';
const VALID = /^[A-Za-z0-9_-]{16,80}$/;
let memo: string | null = null;

function randomId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
  }
}

export function getDeviceId(): string {
  if (memo) return memo;
  try {
    const saved = localStorage.getItem(KEY);
    if (saved && VALID.test(saved)) {
      memo = saved;
      return memo;
    }
  } catch { /* storage blocked: an id for this tab only */ }
  const id = randomId().replace(/[^A-Za-z0-9_-]/g, '').slice(0, 80);
  try { localStorage.setItem(KEY, id); } catch { /* storage blocked */ }
  memo = id;
  return id;
}
