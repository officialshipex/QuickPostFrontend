import { useEffect, useRef, useState } from 'react';

export const OTP_LENGTH = 6;

/** Counts a number of seconds down to 0. Call start(n) to begin again. */
export function useCountdown() {
  const [seconds, setSeconds] = useState(0);
  const endRef = useRef(0);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setInterval(() => {
      const left = Math.max(0, Math.ceil((endRef.current - Date.now()) / 1000));
      setSeconds(left);
    }, 1000);
    return () => clearInterval(timer);
  }, [seconds > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const start = (next: number) => {
    endRef.current = Date.now() + next * 1000;
    setSeconds(Math.max(0, Math.ceil(next)));
  };

  return { seconds, start };
}

export const formatCountdown = (total: number) => {
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

interface OtpBoxesProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  hasError?: boolean;
  /** Puts the cursor in the first empty box whenever this turns true (or the value is cleared) */
  focusWhen?: boolean;
}

export function OtpBoxes({ value, onChange, onComplete, disabled, hasError, focusWhen = true }: OtpBoxesProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!focusWhen || disabled || value) return;
    const timer = setTimeout(() => refs.current[0]?.focus(), 50);
    return () => clearTimeout(timer);
  }, [focusWhen, disabled, value]);

  const apply = (next: string, focusIndex: number) => {
    const clean = next.replace(/\D/g, '').slice(0, OTP_LENGTH);
    onChange(clean);
    refs.current[Math.min(focusIndex, OTP_LENGTH - 1)]?.focus();
    if (clean.length === OTP_LENGTH && clean !== value) onComplete?.(clean);
  };

  const onBoxChange = (index: number, raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (!digits) return;
    // a browser filling in the SMS code, or a typed digit in a filled box
    apply(value.slice(0, index) + digits + value.slice(index + digits.length), index + digits.length);
  };

  const onKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (value[index]) apply(value.slice(0, index) + value.slice(index + 1), index);
      else if (index > 0) apply(value.slice(0, index - 1) + value.slice(index), index - 1);
    } else if (e.key === 'ArrowLeft' && index > 0) {
      refs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  return (
    <div className="flex justify-center gap-2" role="group" aria-label="One-time password">
      {Array.from({ length: OTP_LENGTH }).map((_, index) => (
        <input
          key={index}
          ref={el => { refs.current[index] = el; }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          aria-label={`Digit ${index + 1}`}
          disabled={disabled}
          value={value[index] || ''}
          onChange={e => onBoxChange(index, e.target.value)}
          onKeyDown={e => onKeyDown(index, e)}
          onPaste={e => {
            e.preventDefault();
            apply(e.clipboardData.getData('text'), OTP_LENGTH - 1);
          }}
          onFocus={e => e.target.select()}
          className={`w-10 h-11 md:w-11 md:h-12 text-center text-[16px] font-semibold text-[#0F172A] bg-white border rounded-[8px] focus:outline-none focus:ring-2 transition-colors disabled:bg-[#F8FAFC] disabled:text-[#94A3B8] ${
            hasError ? 'border-[#EF4444] focus:ring-[#EF4444]/30' : 'border-[#E2E8F0] focus:ring-[#00A86B]/40 focus:border-[#00A86B]'
          }`}
        />
      ))}
    </div>
  );
}
