import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown } from 'lucide-react';

/* Pill dropdown matching the Add Order form fields (h-11, rounded-full, green focus).
   Options can carry a one-line hint shown under the label in the menu. */

export interface PillSelectOption {
  value: string;
  label: string;
  hint?: string;
}

export function PillSelect({ value, onChange, options, ariaLabel }: {
  value: string;
  onChange: (v: string) => void;
  options: PillSelectOption[];
  ariaLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const selected = options.find(o => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen(o => !o)}
        className={`w-full h-11 pl-4 pr-3 bg-white border rounded-full text-[12px] md:text-[13px] font-semibold text-[#0F172A] flex items-center justify-between gap-2 transition-all focus:outline-none ${
          open ? 'border-[#00A86B] ring-1 ring-[#00A86B]' : 'border-[#E2E8F0] hover:border-[#CBD5E1]'
        }`}
      >
        <span className="truncate">{selected?.label ?? 'Select'}</span>
        <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-200 ${open ? 'rotate-180 text-[#00A86B]' : 'text-[#94A3B8]'}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            aria-label={ariaLabel}
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute left-0 top-[calc(100%+6px)] z-30 min-w-full w-max max-w-[260px] max-h-64 overflow-y-auto bg-white border border-[#E2E8F0] rounded-2xl shadow-[0_12px_32px_-12px_rgba(15,23,42,0.2)] p-1.5 origin-top"
          >
            {options.map(o => {
              const active = o.value === value;
              return (
                <li key={o.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => { onChange(o.value); setOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded-xl flex items-start justify-between gap-3 transition-colors ${active ? 'bg-[#F0FDF4]' : 'hover:bg-[#F8FAFC]'}`}
                  >
                    <span className="min-w-0">
                      <span className={`block text-[12.5px] md:text-[13px] font-semibold ${active ? 'text-[#00A86B]' : 'text-[#0F172A]'}`}>{o.label}</span>
                      {o.hint && <span className="block text-[11px] text-[#64748B] mt-0.5 leading-snug">{o.hint}</span>}
                    </span>
                    {active && <Check className="w-4 h-4 text-[#00A86B] shrink-0 mt-0.5" />}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
