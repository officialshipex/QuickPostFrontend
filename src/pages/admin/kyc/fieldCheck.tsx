import { AlertCircle, CheckCircle2 } from 'lucide-react';

/* Live checks for KYC fields that have a fixed length / format (IFSC, PAN, GSTIN, Aadhaar, account number, pincode,
   mobile). A disabled "Verify"/"Next" button alone never tells the seller what is wrong, so every such field shows:
     typing      "IFSC: 7 of 11 characters — 4 more needed"
     wrong char  at once, the position and the rule ("The 5th character of an IFSC is always 0 (zero)")
     complete    "IFSC format looks right"
   and the buttons say what is still missing (firstProblem). The patterns match kycStyles.ts. */

interface Slot { re: RegExp; msg: string }
export interface FieldRule {
  label: string;
  unit: 'characters' | 'digits';
  length?: number;            // exact length
  min?: number; max?: number; // or a range
  slots?: Slot[];             // per-position rule (checked while typing)
  example?: string;
}

const L = (msg: string): Slot => ({ re: /[A-Z]/, msg });
const D = (msg: string): Slot => ({ re: /[0-9]/, msg });
const AN = (msg: string): Slot => ({ re: /[A-Z0-9]/, msg });
const times = (n: number, s: Slot) => Array.from({ length: n }, () => s);

export const IFSC_RULE: FieldRule = {
  label: 'IFSC', unit: 'characters', length: 11, example: 'HDFC0001234',
  slots: [
    ...times(4, L('The first 4 characters of an IFSC are letters (the bank code)')),
    { re: /0/, msg: 'The 5th character of an IFSC is always 0 (zero)' },
    ...times(6, AN('The last 6 characters of an IFSC are letters or digits')),
  ],
};

export const PAN_RULE: FieldRule = {
  label: 'PAN', unit: 'characters', length: 10, example: 'ABCDE1234F',
  slots: [
    ...times(5, L('The first 5 characters of a PAN are letters')),
    ...times(4, D('Characters 6 to 9 of a PAN are digits')),
    L('The last character of a PAN is a letter'),
  ],
};

export const GSTIN_RULE: FieldRule = {
  label: 'GSTIN', unit: 'characters', length: 15, example: '27ABCDE1234F1Z5',
  slots: [
    ...times(2, D('A GSTIN starts with your 2-digit state code')),
    ...times(5, L('Characters 3 to 12 of a GSTIN are your PAN (5 letters, 4 digits, 1 letter)')),
    ...times(4, D('Characters 3 to 12 of a GSTIN are your PAN (5 letters, 4 digits, 1 letter)')),
    L('Characters 3 to 12 of a GSTIN are your PAN (5 letters, 4 digits, 1 letter)'),
    { re: /[1-9A-Z]/, msg: 'The 13th character of a GSTIN is 1–9 or a letter' },
    { re: /Z/, msg: 'The 14th character of a GSTIN is always Z' },
    AN('The last character of a GSTIN is a letter or digit'),
  ],
};

export const AADHAAR_RULE: FieldRule = {
  label: 'Aadhaar number', unit: 'digits', length: 12,
  slots: [{ re: /[2-9]/, msg: 'An Aadhaar number never starts with 0 or 1' }, ...times(11, D('An Aadhaar number has digits only'))],
};

export const ACCOUNT_RULE: FieldRule = { label: 'Account number', unit: 'digits', min: 9, max: 18 };
export const PINCODE_RULE: FieldRule = {
  label: 'Pincode', unit: 'digits', length: 6,
  slots: [{ re: /[1-9]/, msg: 'A pincode never starts with 0' }, ...times(5, D('A pincode has digits only'))],
};
export const MOBILE_RULE: FieldRule = {
  label: 'Mobile number', unit: 'digits', length: 10,
  slots: [{ re: /[6-9]/, msg: 'Indian mobile numbers start with 6, 7, 8 or 9' }, ...times(9, D('A mobile number has digits only'))],
};

export type FieldState = 'empty' | 'short' | 'invalid' | 'ok';

export function checkField(raw: string, rule: FieldRule): { state: FieldState; message: string } {
  const value = String(raw || '');
  const n = value.length;
  if (!n) return { state: 'empty', message: '' };
  if (rule.slots) {
    for (let i = 0; i < n && i < rule.slots.length; i++) {
      if (!rule.slots[i].re.test(value[i])) return { state: 'invalid', message: rule.slots[i].msg };
    }
  }
  if (rule.length) {
    if (n > rule.length) return { state: 'invalid', message: `${rule.label} has ${rule.length} ${rule.unit} — you entered ${n}` };
    if (n < rule.length) {
      const left = rule.length - n;
      return { state: 'short', message: `${rule.label}: ${n} of ${rule.length} ${rule.unit} — ${left} more needed` };
    }
  } else if (rule.min && n < rule.min) {
    return { state: 'short', message: `${rule.label}: ${n} ${rule.unit} — at least ${rule.min} needed (${rule.min}–${rule.max})` };
  } else if (rule.max && n > rule.max) {
    return { state: 'invalid', message: `${rule.label} has at most ${rule.max} ${rule.unit}` };
  }
  return { state: 'ok', message: `${rule.label} format looks right` };
}

/** The first thing still stopping a button, as an instruction ("Enter the IFSC — 4 more characters needed"). */
export function firstProblem(fields: { value: string; rule: FieldRule }[], extra: (string | false | null | undefined)[] = []): string | null {
  for (const { value, rule } of fields) {
    const c = checkField(value, rule);
    if (c.state === 'empty') return `Enter your ${rule.label}`;
    if (c.state !== 'ok') return c.message;
  }
  return extra.find((x): x is string => !!x) || null;
}

const TONE = {
  light: { short: 'text-[#B45309]', invalid: 'text-red-500', ok: 'text-[#00A86B]', idle: 'text-[#94A3B8]' },
  dark: { short: 'text-amber-300', invalid: 'text-red-300', ok: 'text-emerald-300', idle: 'text-white/60' },
};

/** The line under a field. `idle` is shown while it is empty. */
export function FieldHint({ value, rule, idle, dark, className = '' }: { value: string; rule: FieldRule; idle?: string; dark?: boolean; className?: string }) {
  const { state, message } = checkField(value, rule);
  const tone = TONE[dark ? 'dark' : 'light'];
  if (state === 'empty') {
    return idle ? <p className={`text-[11px] mt-1.5 ${tone.idle} ${className}`}>{idle}</p> : null;
  }
  const color = state === 'ok' ? tone.ok : state === 'invalid' ? tone.invalid : tone.short;
  const Icon = state === 'ok' ? CheckCircle2 : AlertCircle;
  return (
    <p role={state === 'invalid' ? 'alert' : undefined} aria-live="polite" className={`text-[11px] mt-1.5 font-medium flex items-start gap-1 ${color} ${className}`}>
      <Icon className="w-3 h-3 mt-[1px] shrink-0" />
      <span>{message}{state === 'invalid' && rule.example ? ` (e.g. ${rule.example})` : ''}</span>
    </p>
  );
}

/** Why a button is disabled — shown next to / under it. */
export function BlockedReason({ reason, dark, className = '' }: { reason: string | null; dark?: boolean; className?: string }) {
  if (!reason) return null;
  return (
    <p aria-live="polite" className={`text-[11.5px] font-medium flex items-center gap-1 ${dark ? 'text-amber-200' : 'text-[#B45309]'} ${className}`}>
      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {reason}
    </p>
  );
}
