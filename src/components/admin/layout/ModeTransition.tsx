import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import type { ShippingMode } from '../../../context/shippingMode';

/* Branded B2C ⇄ Cargo switch screen.
   Logo settles in, the current mode word rolls up and out letter by letter while the target
   word rolls in from below (green), an accent line draws under it, and the top progress bar
   fills. `onDone` fires when the bar completes. */

const WORD: Record<ShippingMode, string> = { b2c: 'B2C', cargo: 'CARGO' };
const DURATION = 5;

function RollingWord({ text, mode }: { text: string; mode: 'out' | 'in' }) {
  return (
    <span className="absolute inset-0 flex items-center justify-center" aria-hidden={mode === 'out'}>
      {text.split('').map((ch, i) => (
        <motion.span
          key={i}
          className={`inline-block ${mode === 'in' ? 'text-[#00A86B]' : 'text-[#94A3B8]'}`}
          initial={mode === 'in' ? { y: '110%', opacity: 0 } : { y: '0%', opacity: 1 }}
          animate={mode === 'in' ? { y: '0%', opacity: 1 } : { y: '-110%', opacity: 0 }}
          transition={{
            delay: (mode === 'in' ? 1.2 : 0.8) + i * 0.07,
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {ch}
        </motion.span>
      ))}
    </span>
  );
}

export function ModeTransition({ from, to, onDone }: { from: ShippingMode; to: ShippingMode | null; onDone: () => void }) {
  return createPortal(
    <AnimatePresence>
      {to && (
        <motion.div
          key="mode-transition"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.25 } }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[600]"
          role="status"
          aria-live="polite"
          aria-label={`Opening QuickPost ${to === 'cargo' ? 'Cargo' : 'B2C'}`}
        >
          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(0,168,107,0.10),transparent_55%)]" />

          {/* Top progress bar */}
          <div className="absolute top-0 inset-x-0 h-[3px]">
            <motion.div
              className="h-full bg-[#00A86B] shadow-[0_0_8px_rgba(0,168,107,0.6)] rounded-r-full"
              initial={{ width: '0%' }}
              animate={{ width: ['0%', '45%', '80%', '100%'] }}
              transition={{ duration: DURATION, times: [0, 0.35, 0.75, 1], ease: 'easeInOut' }}
              onAnimationComplete={onDone}
            />
          </div>

          <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
            <motion.img
              src="/logo-color.png"
              alt="QuickPost"
              initial={{ opacity: 0, scale: 0.92, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="h-24 md:h-32 w-auto object-contain scale-[1.5]"
            />

            <div className="relative h-9 md:h-10 w-[220px] overflow-hidden -mt-1 text-[24px] md:text-[28px] font-extrabold tracking-[0.32em] pl-[0.32em] leading-none">
              <RollingWord text={WORD[from]} mode="out" />
              <RollingWord text={WORD[to]} mode="in" />
            </div>

            <motion.span
              className="block h-[3px] rounded-full bg-[#00A86B] mt-2"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 48, opacity: 1 }}
              transition={{ delay: 1.9, duration: 0.5, ease: 'easeOut' }}
            />

            <motion.p
              className="text-[12px] md:text-[13px] font-medium text-[#64748B] mt-3"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5, duration: 0.4 }}
            >
              {to === 'cargo' ? 'Switching to QuickPost Cargo' : 'Switching to QuickPost B2C'}
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
