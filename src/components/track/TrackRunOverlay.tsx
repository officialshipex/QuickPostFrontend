import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { RotateCcw, SearchX } from 'lucide-react';

/* Public tracking: what plays while a lookup runs.
   'driving' — a QuickPost truck drives through a moving city scene (about 3 s) while the shipment is fetched.
   'crash'   — the number was not found: the truck runs into a "no record" roadblock, then the error is shown. */

export type RunPhase = 'driving' | 'crash' | null;

const EASE = [0.16, 1, 0.3, 1] as const;

function Truck({ spin, crashed }: { spin: boolean; crashed?: boolean }) {
  const wheel = (cx: number) => (
    <g>
      <circle cx={cx} cy={64} r={11} fill="#0F172A" />
      <circle cx={cx} cy={64} r={6} fill="#CBD5E1" />
      <circle cx={cx} cy={64} r={2.2} fill="#475569" />
      <g stroke="#64748B" strokeWidth={1.4} strokeLinecap="round">
        <line x1={cx - 5} y1={64} x2={cx + 5} y2={64} />
        <line x1={cx} y1={59} x2={cx} y2={69} />
        {spin && <animateTransform attributeName="transform" type="rotate" from={`0 ${cx} 64`} to={`360 ${cx} 64`} dur="0.45s" repeatCount="indefinite" />}
      </g>
    </g>
  );
  return (
    <svg viewBox="0 0 170 80" className="w-[170px] h-[80px] overflow-visible" aria-hidden>
      <ellipse cx={85} cy={76} rx={80} ry={4} fill="#0F172A" opacity={0.12} />
      <g>
        {spin && <animateTransform attributeName="transform" type="translate" values="0 0; 0 -1.2; 0 0" dur="0.32s" repeatCount="indefinite" />}
        {/* cargo box */}
        <rect x={4} y={8} width={104} height={48} rx={5} fill="#FFFFFF" stroke="#CBD5E1" strokeWidth={1.4} />
        <rect x={4} y={38} width={104} height={9} fill="#00A86B" />
        <text x={56} y={30} textAnchor="middle" fontSize="13" fontWeight="800" fill="#0F172A" fontFamily="Roboto, sans-serif">Quick<tspan fill="#00A86B">Post</tspan></text>
        <line x1={4} y1={20} x2={108} y2={20} stroke="#F1F5F9" strokeWidth={1} />
        {/* cab */}
        <path d="M110 22 h24 a7 7 0 0 1 6 3.4 l13 20 a7 7 0 0 1 1 3.6 V58 H110 Z" fill="#00A86B" />
        <path d="M117 27 h15 a3 3 0 0 1 2.6 1.5 l8 12.5 a1.5 1.5 0 0 1 -1.3 2.3 H117 Z" fill="#E0F2FE" />
        <path d="M118 28 l6 0 l-4 14 h-2 Z" fill="#FFFFFF" opacity={0.5} />
        <rect x={150} y={49} width={5} height={5} rx={1.5} fill="#FDE68A" />
        <rect x={110} y={40} width={2.5} height={18} fill="#0F172A" opacity={0.18} />
        <rect x={126} y={46} width={7} height={2} rx={1} fill="#0F172A" opacity={0.35} />
        {/* chassis + bumper */}
        <rect x={2} y={56} width={154} height={6} rx={2.5} fill="#334155" />
        <rect x={152} y={52} width={6} height={9} rx={2} fill="#475569" />
        {crashed && <path d="M152 46 l8 -4 l-3 7 l7 1 l-8 4" fill="none" stroke="#F59E0B" strokeWidth={2} strokeLinejoin="round" />}
      </g>
      {wheel(30)}{wheel(84)}{wheel(132)}
    </svg>
  );
}

/** Repeating strip that scrolls left to suggest movement. */
function Strip({ children, duration, play, className }: { children: React.ReactNode; duration: number; play: boolean; className?: string }) {
  return (
    <div className={`absolute inset-x-0 overflow-hidden ${className || ''}`}>
      <motion.div className="flex w-max" animate={play ? { x: ['0%', '-50%'] } : { x: '0%' }} transition={play ? { duration, repeat: Infinity, ease: 'linear' } : { duration: 0 }}>
        {children}{children}
      </motion.div>
    </div>
  );
}

const Skyline = () => (
  <svg width="720" height="90" viewBox="0 0 720 90" aria-hidden>
    {[[0, 40, 46], [50, 60, 30], [96, 34, 52], [136, 70, 20], [212, 44, 40], [262, 58, 28], [326, 30, 56], [362, 66, 24], [434, 42, 44], [482, 56, 32], [544, 36, 50], [586, 62, 26], [654, 46, 40]].map(([x, h, w], i) => (
      <rect key={i} x={x} y={90 - h} width={w} height={h} rx={2} fill="#E2E8F0" />
    ))}
  </svg>
);
const Trees = () => (
  <svg width="600" height="40" viewBox="0 0 600 40" aria-hidden>
    {[30, 150, 260, 390, 520].map(x => (
      <g key={x}><rect x={x - 1.5} y={26} width={3} height={14} fill="#94A3B8" /><circle cx={x} cy={20} r={11} fill="#B7E4CC" /></g>
    ))}
  </svg>
);
const Lane = () => (
  <svg width="400" height="6" viewBox="0 0 400 6" aria-hidden>
    {[0, 80, 160, 240, 320].map(x => <rect key={x} x={x} y={1} width={44} height={4} rx={2} fill="#FFFFFF" />)}
  </svg>
);

export function TrackRunOverlay({ phase, query, mode, onRetry }: { phase: RunPhase; query: string; mode: 'awb' | 'order'; onRetry: () => void }) {
  const reduced = useReducedMotion() ?? false;
  const driving = phase === 'driving';
  const crash = phase === 'crash';

  useEffect(() => {
    if (!phase) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && crash) onRetry(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [phase, crash, onRetry]);

  return createPortal(
    <AnimatePresence>
      {phase && (
        <motion.div
          key="run"
          className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-[#0F172A]/45 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          role="dialog" aria-modal="true" aria-live="polite"
          aria-label={crash ? 'Shipment not found' : 'Finding your shipment'}
          style={{ fontFamily: 'Roboto, sans-serif' }}
        >
          <motion.div
            className="relative w-full max-w-[640px] bg-white rounded-[28px] overflow-hidden shadow-[0_40px_90px_-30px_rgba(15,23,42,0.6)]"
            initial={{ scale: 0.94, y: 12 }} animate={crash ? { scale: 1, y: 0, x: [0, -6, 6, -4, 4, 0] } : { scale: 1, y: 0 }}
            transition={crash ? { x: { delay: 0.95, duration: 0.45 }, default: { duration: 0.35, ease: EASE } } : { duration: 0.35, ease: EASE }}
          >
            {/* Scene */}
            <div className="relative h-[230px] bg-gradient-to-b from-[#EAF6F0] via-[#F4FAF7] to-white overflow-hidden">
              <motion.div className="absolute right-10 top-7 w-12 h-12 rounded-full bg-[#FDE68A]" animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 3, repeat: Infinity }} />
              <Strip duration={14} play={driving && !reduced} className="bottom-[78px] opacity-90"><Skyline /></Strip>
              <Strip duration={6} play={driving && !reduced} className="bottom-[64px]"><Trees /></Strip>
              {/* road */}
              <div className="absolute inset-x-0 bottom-0 h-[64px] bg-[#334155]" />
              <div className="absolute inset-x-0 bottom-[64px] h-[4px] bg-[#94A3B8]" />
              <Strip duration={0.9} play={driving && !reduced} className="bottom-[28px]"><Lane /></Strip>

              {/* roadblock for the crash */}
              {crash && (
                <motion.div className="absolute bottom-[40px] right-[14%] origin-bottom"
                  initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0, rotate: [0, 0, 0, 14] }}
                  transition={{ opacity: { duration: 0.25 }, y: { duration: 0.35, ease: EASE }, rotate: { delay: 0.95, duration: 0.45, times: [0, 0, 0.3, 1] } }}>
                  <svg width="92" height="78" viewBox="0 0 92 78" aria-hidden>
                    <rect x={10} y={40} width={4} height={38} fill="#475569" /><rect x={78} y={40} width={4} height={38} fill="#475569" />
                    <rect x={2} y={22} width={88} height={22} rx={3} fill="#FFFFFF" stroke="#DC2626" strokeWidth={2} />
                    {[0, 1, 2, 3, 4].map(i => <path key={i} d={`M${6 + i * 18} 42 l10 -18 h8 l-10 18 Z`} fill="#DC2626" />)}
                    <rect x={30} y={2} width={32} height={18} rx={3} fill="#0F172A" />
                    <text x={46} y={15} textAnchor="middle" fontSize="9" fontWeight="800" fill="#FFFFFF" fontFamily="Roboto, sans-serif">NO RECORD</text>
                  </svg>
                </motion.div>
              )}

              {/* truck */}
              <motion.div
                className="absolute bottom-[20px]"
                initial={{ left: '-30%' }}
                animate={
                  reduced ? { left: '30%' }
                    : crash ? { left: ['-30%', '46%', '42%'], rotate: [0, 0, -3] }
                      : { left: ['-30%', '30%', '33%', '30%'] }
                }
                transition={
                  reduced ? { duration: 0 }
                    : crash ? { duration: 1.3, times: [0, 0.72, 1], ease: 'easeIn' }
                      : { duration: 3, times: [0, 0.35, 0.7, 1], ease: 'easeInOut' }
                }
              >
                <Truck spin={driving || (crash && !reduced)} crashed={crash} />
              </motion.div>

              {/* impact burst */}
              {crash && !reduced && (
                <motion.div className="absolute bottom-[56px] right-[22%]"
                  initial={{ scale: 0, opacity: 0 }} animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0.9] }} transition={{ delay: 0.92, duration: 0.4 }}>
                  <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden>
                    <path d="M28 2 l5 15 l15 -6 l-8 13 l14 6 l-15 3 l5 15 l-13 -9 l-8 13 l-2 -15 l-15 3 l10 -11 l-12 -9 l15 -1 Z" fill="#FBBF24" stroke="#F59E0B" strokeWidth={1.5} />
                  </svg>
                </motion.div>
              )}
            </div>

            {/* Copy */}
            <div className="px-6 sm:px-8 py-6 text-center">
              {driving ? (
                <>
                  <p className="text-[18px] font-bold text-[#0F172A]">Finding your shipment</p>
                  <p className="mt-1 text-[13.5px] text-[#64748B]">Checking the latest scans for {mode === 'awb' ? 'AWB' : 'Order ID'} <span className="font-mono font-semibold text-[#0F172A]">{query}</span></p>
                  <div className="mt-4 h-1.5 rounded-full bg-[#EEF2F6] overflow-hidden">
                    <motion.div className="h-full rounded-full bg-[#00A86B]" initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: reduced ? 0 : 3, ease: 'linear' }} />
                  </div>
                </>
              ) : (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduced ? 0 : 1.2, duration: 0.35 }}>
                  <span className="mx-auto w-11 h-11 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center"><SearchX className="w-5 h-5" /></span>
                  <p className="mt-3 text-[18px] font-bold text-[#0F172A]">We couldn't find this shipment</p>
                  <p className="mt-1 text-[13.5px] text-[#64748B] max-w-[420px] mx-auto">
                    No shipment matches {mode === 'awb' ? 'AWB' : 'Order ID'} <span className="font-mono font-semibold text-[#0F172A]">{query}</span>. Check the number on your shipping label or order confirmation and try again.
                  </p>
                  <button type="button" onClick={onRetry} autoFocus
                    className="mt-5 h-11 px-6 rounded-full bg-[#00A86B] hover:bg-[#009B63] text-white text-[14px] font-semibold inline-flex items-center gap-2">
                    <RotateCcw className="w-4 h-4" /> Try another number
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
