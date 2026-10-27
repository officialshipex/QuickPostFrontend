import { useRef, useState } from 'react';
import { createPortal, flushSync } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const REVEAL_MS = 650;
const SWITCH_AFTER_MS = 320; // let the progress bar get going before the theme changes

type ViewTransitionDoc = Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } };

/** Light / dark switch for the panel header. Shows the mode you would switch TO.
    Switching shows the app's green top progress bar and reveals the new theme in a circle from the button
    (View Transitions API); browsers without it get an instant switch, and reduced-motion users skip the effect. */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const reduced = useReducedMotion() ?? false;
  const btnRef = useRef<HTMLButtonElement>(null);
  const [switching, setSwitching] = useState(false);
  const dark = theme === 'dark';
  const label = dark ? 'Switch to light mode' : 'Switch to dark mode';

  const applyTheme = () => {
    const doc = document as ViewTransitionDoc;
    if (reduced || !doc.startViewTransition) { toggleTheme(); return; }

    const r = btnRef.current?.getBoundingClientRect();
    const x = r ? r.left + r.width / 2 : window.innerWidth - 80;
    const y = r ? r.top + r.height / 2 : 32;
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

    const transition = doc.startViewTransition(() => { flushSync(() => toggleTheme()); });
    transition.ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: REVEAL_MS, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', pseudoElement: '::view-transition-new(root)' },
      );
    }).catch(() => { /* transition skipped — the theme has already changed */ });
  };

  const onClick = () => {
    if (switching) return;
    if (reduced) { toggleTheme(); return; }
    setSwitching(true);
    window.setTimeout(applyTheme, SWITCH_AFTER_MS);
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={onClick}
        aria-label={label}
        title={label}
        aria-busy={switching}
        className={`relative w-9 h-9 shrink-0 flex items-center justify-center rounded-full text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors overflow-hidden ${className}`}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={dark ? 'sun' : 'moon'}
            initial={{ opacity: 0, rotate: -60, scale: 0.6 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 60, scale: 0.6 }}
            transition={{ duration: 0.18 }}
            className="flex items-center justify-center"
          >
            {dark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
          </motion.span>
        </AnimatePresence>
      </button>

      {switching && createPortal(
        <div className="fixed top-0 inset-x-0 z-[600] h-[3px] pointer-events-none" role="status" aria-label="Switching theme">
          <motion.div
            className="h-full bg-[#00A86B] shadow-[0_0_8px_rgba(0,168,107,0.6)] rounded-r-full"
            initial={{ width: '0%', opacity: 1 }}
            animate={{ width: ['0%', '60%', '100%'], opacity: [1, 1, 0] }}
            transition={{ duration: (SWITCH_AFTER_MS + REVEAL_MS + 150) / 1000, times: [0, 0.4, 1], ease: 'easeInOut' }}
            onAnimationComplete={() => setSwitching(false)}
          />
        </div>,
        document.body,
      )}
    </>
  );
}
