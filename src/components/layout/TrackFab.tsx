import { useEffect, useRef, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Search, X } from 'lucide-react';

/* Phones: a tracking dock that appears once the hero has scrolled away. The round button shows a small truck
   driving a dashed road; tapping it opens a sheet to enter an AWB or Order ID, which opens /track with the
   search already running. */

function TruckRoad() {
  return (
    <svg viewBox="0 0 56 56" className="w-full h-full" aria-hidden>
      <defs><clipPath id="qp-fab-clip"><circle cx="28" cy="28" r="27" /></clipPath></defs>
      <g clipPath="url(#qp-fab-clip)">
        {/* road */}
        <line x1="-10" y1="38" x2="70" y2="38" stroke="white" strokeOpacity="0.5" strokeWidth="1.6" strokeDasharray="4 4">
          <animate attributeName="stroke-dashoffset" from="0" to="-16" dur="0.6s" repeatCount="indefinite" />
        </line>
        {/* truck */}
        <g>
          <animateTransform attributeName="transform" type="translate" values="0 0; 0 -0.8; 0 0" dur="0.35s" repeatCount="indefinite" />
          <rect x="13" y="20" width="18" height="12" rx="1.5" fill="white" />
          <path d="M31 24 h6 l4 4 v4 h-10 z" fill="white" />
          <rect x="33" y="25" width="3.5" height="2.6" rx="0.5" fill="#00A86B" />
          <circle cx="18" cy="34" r="2.6" fill="#00A86B" stroke="white" strokeWidth="1.6" />
          <circle cx="36" cy="34" r="2.6" fill="#00A86B" stroke="white" strokeWidth="1.6" />
        </g>
        {/* speed lines */}
        {[22, 27].map((y, i) => (
          <line key={y} x1="4" y1={y} x2="10" y2={y} stroke="white" strokeOpacity="0.7" strokeWidth="1.4" strokeLinecap="round">
            <animate attributeName="x1" values="10;2;10" dur={`${0.7 + i * 0.2}s`} repeatCount="indefinite" />
          </line>
        ))}
      </g>
    </svg>
  );
}

export function TrackFab({ afterRef }: { afterRef: RefObject<HTMLElement | null> }) {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'awb' | 'order'>('awb');
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = afterRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setShow(!e.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [afterRef]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = window.setTimeout(() => inputRef.current?.focus(), 250);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.clearTimeout(t); window.removeEventListener('keydown', onKey); };
  }, [open]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = value.trim();
    if (!v) { inputRef.current?.focus(); return; }
    setOpen(false);
    navigate(`/track?${mode}=${encodeURIComponent(v)}`);
  };

  return createPortal(
    <>
      <AnimatePresence>
        {show && !open && (
          <motion.button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Track your order"
            className="md:hidden fixed right-4 z-[60] bottom-[max(1.25rem,env(safe-area-inset-bottom))] w-[58px] h-[58px] rounded-full bg-[#00A86B] ring-4 ring-white shadow-[0_14px_30px_-10px_rgba(0,168,107,0.7)]"
            initial={{ opacity: 0, scale: 0.5, rotate: -30 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.5 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 380, damping: 24 }}
          >
            <TruckRoad />
            <span className="absolute -top-1 -left-1 px-1.5 py-[1px] rounded-full bg-[#0F172A] text-white text-[9px] font-bold tracking-wide">TRACK</span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <>
            <motion.div key="bd" className="md:hidden fixed inset-0 z-[90] bg-black/45" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.form
              key="sheet"
              onSubmit={submit}
              role="dialog"
              aria-modal="true"
              aria-label="Track your order"
              className="md:hidden fixed inset-x-0 bottom-0 z-[91] bg-white rounded-t-3xl px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
              style={{ fontFamily: 'Roboto, sans-serif' }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            >
              <div className="mx-auto w-10 h-1.5 rounded-full bg-[#E2E8F0]" />
              <div className="mt-4 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-11 h-11 rounded-2xl bg-[#00A86B] overflow-hidden shrink-0"><TruckRoad /></span>
                  <div>
                    <h3 className="text-[17px] font-bold text-[#0F172A]">Track your shipment</h3>
                    <p className="text-[12.5px] text-[#64748B]">Live status from the courier</p>
                  </div>
                </div>
                <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="w-8 h-8 rounded-full flex items-center justify-center text-[#94A3B8] active:bg-[#F1F5F9]"><X className="w-4 h-4" /></button>
              </div>

              <div role="radiogroup" aria-label="Search by" className="mt-5 grid grid-cols-2 p-1 rounded-full bg-[#F1F5F9]">
                {([['awb', 'AWB number'], ['order', 'Order ID']] as const).map(([k, label]) => (
                  <button key={k} type="button" role="radio" aria-checked={mode === k} onClick={() => setMode(k)}
                    className={`h-9 rounded-full text-[13px] font-semibold transition-all ${mode === k ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#64748B]'}`}>
                    {label}
                  </button>
                ))}
              </div>

              <div className="mt-3 relative">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                <input
                  ref={inputRef}
                  value={value}
                  onChange={e => setValue(e.target.value)}
                  placeholder={mode === 'awb' ? 'Enter AWB number' : 'Enter Order ID'}
                  inputMode={mode === 'awb' ? 'numeric' : 'text'}
                  autoComplete="off"
                  className="w-full h-12 pl-11 pr-4 rounded-full border border-[#E2E8F0] bg-[#F8FAFC] text-[15px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:bg-white"
                />
              </div>

              <button type="submit" className="mt-3 w-full h-12 rounded-full bg-[#00A86B] active:bg-[#009B63] text-white text-[15px] font-bold inline-flex items-center justify-center gap-2">
                Track <ArrowRight className="w-4 h-4" />
              </button>
            </motion.form>
          </>
        )}
      </AnimatePresence>
    </>,
    document.body,
  );
}
