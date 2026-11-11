import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

/* Impersonation bar eye. Realistic SVG eye: shaded sclera, fibred iris, pupil and catch-light.
   The iris follows the pointer (desktop) or looks around slowly (touch), blinks now and then,
   and closes before running onClose (exit spectating). */

const W = 44, H = 26;
const CX = W / 2, CY = H / 2;
const EYE_PATH = `M2 ${CY} C 10 1, 34 1, 42 ${CY} C 34 25, 10 25, 2 ${CY} Z`;

export function SpectateEye({ onClose, label = 'Stop viewing', canClose }: { onClose: () => void; label?: string; canClose?: () => boolean }) {
  const reduced = useReducedMotion() ?? false;
  const ref = useRef<HTMLButtonElement>(null);
  const [look, setLook] = useState({ x: 0, y: 0 });
  const [blink, setBlink] = useState(false);
  const [closing, setClosing] = useState(false);

  // Follow the pointer; on touch devices drift around slowly instead
  useEffect(() => {
    if (reduced) return;
    const fine = window.matchMedia('(pointer: fine)').matches;
    if (fine) {
      const onMove = (e: PointerEvent) => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        const d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 220);
        setLook({ x: (dx / d) * 5.5 * k, y: (dy / d) * 2.6 * k });
      };
      window.addEventListener('pointermove', onMove);
      return () => window.removeEventListener('pointermove', onMove);
    }
    const spots = [{ x: 0, y: 0 }, { x: -4.5, y: 0.5 }, { x: 4, y: -1 }, { x: 0, y: 1.5 }, { x: 3, y: 1 }];
    let i = 0;
    const t = window.setInterval(() => { i = (i + 1) % spots.length; setLook(spots[i]); }, 1800);
    return () => window.clearInterval(t);
  }, [reduced]);

  // Natural blink every 3–6 s
  useEffect(() => {
    if (reduced || closing) return;
    let t: number;
    const loop = () => {
      t = window.setTimeout(() => { setBlink(true); window.setTimeout(() => setBlink(false), 140); loop(); }, 3000 + Math.random() * 3000);
    };
    loop();
    return () => window.clearTimeout(t);
  }, [reduced, closing]);

  const shut = blink || closing;

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => { if (closing || (canClose && !canClose())) return; setClosing(true); window.setTimeout(onClose, 420); }}
      aria-label={label}
      title={label}
      className="group relative flex items-center justify-center w-[52px] h-[30px] rounded-full bg-white/[0.06] hover:bg-white/[0.12] ring-1 ring-white/10 transition-colors"
    >
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="w-[40px] h-[24px] overflow-visible" aria-hidden>
        <defs>
          <clipPath id="qp-eye-clip"><path d={EYE_PATH} /></clipPath>
          <radialGradient id="qp-eye-sclera" cx="50%" cy="45%" r="65%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="70%" stopColor="#F1F1EE" />
            <stop offset="100%" stopColor="#C9CBC6" />
          </radialGradient>
          <radialGradient id="qp-eye-iris" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#7B5A2E" />
            <stop offset="34%" stopColor="#6E8F3A" />
            <stop offset="72%" stopColor="#1E7A4C" />
            <stop offset="100%" stopColor="#0B3B26" />
          </radialGradient>
          <radialGradient id="qp-eye-shade" cx="50%" cy="0%" r="90%">
            <stop offset="55%" stopColor="#000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.28" />
          </radialGradient>
        </defs>

        <g clipPath="url(#qp-eye-clip)">
          <rect width={W} height={H} fill="url(#qp-eye-sclera)" />
          {/* iris + pupil follow the gaze */}
          <motion.g animate={{ x: look.x, y: look.y }} transition={{ type: 'spring', stiffness: 160, damping: 18 }}>
            <circle cx={CX} cy={CY} r={8.2} fill="url(#qp-eye-iris)" />
            {/* iris fibres */}
            {Array.from({ length: 22 }).map((_, k) => {
              const a = (k / 22) * Math.PI * 2;
              return <line key={k} x1={CX + Math.cos(a) * 3.6} y1={CY + Math.sin(a) * 3.6} x2={CX + Math.cos(a) * 7.8} y2={CY + Math.sin(a) * 7.8} stroke="#0B2E1E" strokeOpacity="0.28" strokeWidth="0.45" />;
            })}
            <circle cx={CX} cy={CY} r={8.2} fill="none" stroke="#06231A" strokeOpacity="0.75" strokeWidth="0.9" />
            <circle cx={CX} cy={CY} r={3.5} fill="#050807" />
            <circle cx={CX + 2.6} cy={CY - 2.7} r={1.5} fill="#FFFFFF" opacity="0.95" />
            <circle cx={CX - 2.4} cy={CY + 2.4} r={0.7} fill="#FFFFFF" opacity="0.55" />
          </motion.g>
          {/* depth: shadow under the upper lid */}
          <rect width={W} height={H} fill="url(#qp-eye-shade)" />
          {/* lids */}
          <motion.rect x={0} y={0} width={W} fill="#1E293B"
            initial={false} animate={{ height: shut ? CY + 0.5 : 0 }} transition={{ duration: closing ? 0.32 : 0.08, ease: 'easeIn' }} />
          <motion.rect x={0} width={W} fill="#1E293B"
            initial={false} animate={{ y: shut ? CY - 0.5 : H, height: shut ? CY + 0.5 : 0 }} transition={{ duration: closing ? 0.32 : 0.08, ease: 'easeIn' }} />
        </g>
        {/* lid line + lashes */}
        <path d={EYE_PATH} fill="none" stroke="#E2E8F0" strokeOpacity="0.85" strokeWidth="1.1" />
        {[8, 14, 22, 30, 36].map((x, k) => (
          <line key={x} x1={x} y1={k === 2 ? 3.2 : 4.6} x2={x + (x - CX) * 0.08} y2={k === 2 ? 0.6 : 2.2} stroke="#E2E8F0" strokeOpacity="0.7" strokeWidth="0.9" strokeLinecap="round" />
        ))}
      </svg>
    </button>
  );
}

/** Floating widget shown while an admin views a seller or sales account: the eye in a raised round bubble.
    Hold and drag it anywhere on screen; tap the eye to stop viewing. A small QuickPost label peeks out on
    hover / first load. */
export function SpectateFloat({ role, onExit }: { name?: string; role: string; onExit: () => void }) {
  const [peek, setPeek] = useState(true);
  const area = useRef<HTMLDivElement>(null);
  const dragged = useRef(false);
  useEffect(() => { const t = window.setTimeout(() => setPeek(false), 3500); return () => window.clearTimeout(t); }, []);

  return (
    <div ref={area} className="fixed inset-2 z-[1000] pointer-events-none">
      <motion.div
        className="absolute right-1 md:right-3 top-[64px] md:top-[76px] flex items-center gap-2 pointer-events-auto cursor-grab active:cursor-grabbing touch-none"
        drag
        dragConstraints={area}
        dragMomentum={false}
        dragElastic={0.08}
        onDragStart={() => { dragged.current = true; setPeek(false); }}
        onDragEnd={() => { window.setTimeout(() => { dragged.current = false; }, 0); }}
        whileDrag={{ scale: 1.06 }}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 22 }}
        onMouseEnter={() => setPeek(true)}
        onMouseLeave={() => setPeek(false)}
      >
        <AnimatePresence>
          {peek && (
            <motion.div
              className="flex items-center gap-2 h-9 pl-3 pr-3.5 rounded-full bg-[#0F172A] text-white shadow-[0_10px_24px_-10px_rgba(15,23,42,0.6)] whitespace-nowrap select-none"
              initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.22 }}
            >
              <span className="relative flex w-2 h-2">
                <span className="absolute inline-flex w-full h-full rounded-full bg-amber-400 opacity-70 animate-ping" />
                <span className="relative inline-flex w-2 h-2 rounded-full bg-amber-400" />
              </span>
              <span className="text-[12.5px] font-bold tracking-[-0.01em]">Quick<span className="text-[#34D399]">Post</span></span>
              <span className="px-1.5 py-px rounded bg-white/10 text-[9.5px] font-semibold uppercase tracking-wider text-white/80">{role} view</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* The bubble */}
        <motion.div
          className="relative rounded-full p-[3px] bg-gradient-to-b from-[#334155] to-[#0F172A] shadow-[0_14px_30px_-12px_rgba(15,23,42,0.7),inset_0_1px_0_rgba(255,255,255,0.15)]"
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span aria-hidden className="absolute -inset-1 rounded-full ring-2 ring-amber-400/40 animate-pulse pointer-events-none" />
          <div className="w-[52px] h-[52px] rounded-full bg-[#1E293B] flex items-center justify-center">
            <SpectateEye onClose={onExit} canClose={() => !dragged.current} label="Tap to stop viewing and return to admin" />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
