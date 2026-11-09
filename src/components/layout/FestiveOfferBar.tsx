import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, X } from 'lucide-react';

/* Mobile-only Diwali strip above the navbar. Opens with crackers bursting and a blooming light, then the
   offer line settles in. Crackers run on a small canvas, only while the strip is visible; reduced motion
   skips straight to the line. */

export const FESTIVE_BAR_HEIGHT = 76;
const INTRO_MS = 2200;

interface P { x: number; y: number; vx: number; vy: number; life: number; max: number; hue: number; trail?: boolean }

function Crackers({ intro }: { intro: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const introRef = useRef(intro);
  introRef.current = intro;

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = canvas.clientWidth, H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const parts: P[] = [];
    const burst = (x: number, y: number, n: number) => {
      const hue = [38, 45, 28, 330, 12][Math.floor(Math.random() * 5)];
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + Math.random() * 0.2;
        const sp = 1 + Math.random() * 1.6;
        parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, max: 34 + Math.random() * 20, hue: hue + Math.random() * 12 });
      }
    };
    // a rocket rises, then bursts
    const rocket = () => parts.push({ x: 20 + Math.random() * (W - 40), y: H + 4, vx: (Math.random() - 0.5) * 0.4, vy: -(2.2 + Math.random() * 0.8), life: 0, max: 14 + Math.random() * 8, hue: 45, trail: true });

    let raf = 0, last = performance.now(), nextRocket = 0;
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 16.7, 3);
      last = now;
      nextRocket -= dt;
      if (nextRocket <= 0) {
        rocket();
        nextRocket = introRef.current ? 12 + Math.random() * 10 : 150 + Math.random() * 90;
      }
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        const px = p.x, py = p.y;
        if (!p.trail) { p.vy += 0.035 * dt; p.vx *= 0.975; p.vy *= 0.975; }
        p.x += p.vx * dt; p.y += p.vy * dt; p.life += dt;
        if (p.trail && p.life >= p.max) { parts.splice(i, 1); burst(p.x, p.y, introRef.current ? 34 : 22); continue; }
        const t = 1 - p.life / p.max;
        if (t <= 0) { parts.splice(i, 1); continue; }
        ctx.strokeStyle = `hsla(${p.hue},100%,${p.trail ? 85 : 55 + t * 25}%,${introRef.current ? t : t * 0.55})`;
        ctx.lineWidth = p.trail ? 1.6 : 1.2;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(p.x, p.y); ctx.stroke();
      }
      raf = requestAnimationFrame(tick);
    };
    const start = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };
    const onVis = () => (document.hidden ? stop() : start());
    const io = new IntersectionObserver(([e]) => (e.isIntersecting && !document.hidden ? start() : stop()));
    io.observe(canvas);
    document.addEventListener('visibilitychange', onVis);
    return () => { stop(); io.disconnect(); document.removeEventListener('visibilitychange', onVis); };
  }, []);

  return <canvas ref={ref} aria-hidden className="absolute inset-0 w-full h-full pointer-events-none" />;
}

export function FestiveOfferBar({ hidden, onClose }: { hidden: boolean; onClose: () => void }) {
  const reduced = useReducedMotion() ?? false;
  const [intro, setIntro] = useState(!reduced);
  useEffect(() => {
    if (!intro) return;
    const t = window.setTimeout(() => setIntro(false), INTRO_MS);
    return () => window.clearTimeout(t);
  }, [intro]);

  return (
    <motion.div
      className="md:hidden relative overflow-hidden bg-[#0B1F4D]"
      initial={false}
      animate={{ height: hidden ? 0 : FESTIVE_BAR_HEIGHT }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      role="region"
      aria-label="Diwali offer"
    >
      <div className="relative h-[76px]" style={{ fontFamily: 'Roboto, sans-serif' }}>
        {/* Blooming warm light */}
        {!reduced && (
          <motion.div
            aria-hidden
            className="absolute left-1/2 top-1/2 w-[320px] h-[320px] -ml-[160px] -mt-[160px] rounded-full bg-[radial-gradient(circle,rgba(251,191,36,0.55)_0%,rgba(249,115,22,0.18)_35%,transparent_65%)]"
            initial={{ scale: 0, opacity: 0 }}
            animate={intro ? { scale: [0, 1.3, 1.1], opacity: [0, 1, 0.75] } : { scale: 1.6, opacity: 0.16 }}
            transition={{ duration: intro ? 1.4 : 1.2, ease: 'easeOut' }}
          />
        )}
        {!reduced && <Crackers intro={intro} />}

        <AnimatePresence>
          {!intro && (
            <motion.div
              className="relative h-full flex items-center gap-2.5 pl-4 pr-9"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="min-w-0 flex-1 leading-tight">
                <p className="text-[15px] font-extrabold text-[#FBBF24] tracking-[-0.01em] truncate">Is Diwali, sirf ghar nahi.</p>
                <p className="mt-0.5 text-[13.5px] text-white/95 truncate">Shipping bhi sorted rakho. 🪔</p>
              </div>
              <Link
                to="/#signup"
                className="shrink-0 h-9 px-3.5 rounded-full bg-gradient-to-b from-[#FBBF24] to-[#F59E0B] text-[#0B1F4D] text-[12.5px] font-bold inline-flex items-center gap-1 shadow-[0_6px_16px_-6px_rgba(245,158,11,0.7)] active:scale-[0.97] transition-transform"
              >
                Get Started <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        <button type="button" onClick={onClose} aria-label="Close offer" className="absolute right-0.5 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-white/55 active:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
