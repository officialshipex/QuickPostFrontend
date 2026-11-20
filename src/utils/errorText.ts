/**
 * A readable message from an API error, always as text. Some endpoints answer `message` as an object of
 * field errors (e.g. { phoneNumber: "Invalid phone number format." }); putting that object straight into JSX
 * crashes React and blanks the whole page, so objects / arrays are turned into their messages here.
 */
export function errorText(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const e = err as { response?: { data?: { message?: unknown } }; message?: unknown };
  const pick = (v: unknown): string => {
    if (typeof v === 'string') return v.trim();
    if (Array.isArray(v)) return v.map(pick).filter(Boolean).join(' ');
    if (v && typeof v === 'object') return Object.values(v as Record<string, unknown>).map(pick).filter(Boolean).join(' ');
    return '';
  };
  return pick(e?.response?.data?.message) || pick(e?.message) || fallback;
}
