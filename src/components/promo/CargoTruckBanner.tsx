import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, animate as animateMV, motion, useInView, useMotionValue, useReducedMotion, useTransform, type MotionValue } from 'framer-motion';
import { Boxes, MapPinned, Wallet, Warehouse } from 'lucide-react';
import { WALLET_CASHBACK_OFFER } from '../../config/offers';

/* Cargo (B2B) home promo — the Cargo counterpart of OfferFlagBanner, same card and timing language.
   A QuickPost Cargo truck drives in along the road and parks on the left (wheels spin while it moves, a little
   dust as it brakes); then the copy and the call to action stagger in. Plays once when the banner scrolls into
   view; prefers-reduced-motion shows the final state. */

const EASE = [0.22, 1, 0.36, 1] as const;
const DRIVE = 1.6;
const DRIVE_DELAY = 0.25;
const PARKED = DRIVE_DELAY + DRIVE;
const COPY_DELAY = PARKED - 0.15;

/* Wheels roll exactly with the distance driven (rotation = x / radius), the body sits on suspension and pitches
   (squats back on take-off, noses down on braking), tail lamps glow while braking, exhaust puffs on take-off. */
const WHEEL_R_PX = 12;
function CargoTruck({ x, pitch, braking }: { x: MotionValue<number>; pitch: MotionValue<number>; braking: boolean }) {
  const spin = useTransform(x, v => (v / WHEEL_R_PX) * (180 / Math.PI));
  const wheel = (cx: number) => (
    <g key={cx}>
      <circle cx={cx} cy={98} r={13} fill="#0F172A" />
      <circle cx={cx} cy={98} r={7} fill="#CBD5E1" />
      <motion.g style={{ rotate: spin, transformBox: 'fill-box', transformOrigin: 'center' }}>
        <circle cx={cx} cy={98} r={7} fill="none" />
        <g stroke="#64748B" strokeWidth={1.6} strokeLinecap="round">
          <line x1={cx - 6} y1={98} x2={cx + 6} y2={98} /><line x1={cx} y1={92} x2={cx} y2={104} />
          <line x1={cx - 4.2} y1={93.8} x2={cx + 4.2} y2={102.2} opacity={0.5} />
        </g>
      </motion.g>
      <circle cx={cx} cy={98} r={2.5} fill="#475569" />
    </g>
  );
  return (
    <svg viewBox="0 0 250 116" className="w-[230px] h-[107px] overflow-visible" aria-hidden>
      <ellipse cx={125} cy={112} rx={118} ry={4} fill="#0F172A" opacity={0.1} />
      <motion.g style={{ rotate: pitch, transformBox: 'view-box', transformOrigin: '120px 92px' }}>
        <rect x={4} y={10} width={158} height={76} rx={5} fill="#FFFFFF" stroke="#CBD5E1" strokeWidth={1.4} />
        {Array.from({ length: 9 }).map((_, i) => <line key={i} x1={20 + i * 16} y1={14} x2={20 + i * 16} y2={82} stroke="#EEF2F6" strokeWidth={2} />)}
        <rect x={4} y={58} width={158} height={12} fill="#00A86B" />
        <text x={83} y={44} textAnchor="middle" fontSize="17" fontWeight="800" fill="#0F172A" fontFamily="Roboto, sans-serif">Quick<tspan fill="#00A86B">Post</tspan></text>
        <text x={83} y={54} textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#64748B" letterSpacing="2.5" fontFamily="Roboto, sans-serif">CARGO</text>
        <path d="M166 34 h40 a8 8 0 0 1 6.6 3.5 l20 29 a8 8 0 0 1 1.4 4.5 V90 H166 Z" fill="#00A86B" />
        <path d="M174 40 h26 a3 3 0 0 1 2.5 1.3 l13 19 a1.5 1.5 0 0 1 -1.2 2.4 H174 Z" fill="#E0F2FE" />
        <path d="M176 41 l7 0 l-5 20 h-2 Z" fill="#FFFFFF" opacity={0.55} />
        <rect x={228} y={78} width={6} height={6} rx={1.5} fill="#FDE68A" />
        <rect x={166} y={64} width={3} height={26} fill="#0F172A" opacity={0.16} />
        <rect x={186} y={72} width={9} height={2.5} rx={1} fill="#0F172A" opacity={0.3} />
        {/* tail lamp */}
        <rect x={1} y={72} width={4} height={9} rx={1.5} fill={braking ? '#EF4444' : '#B91C1C'} />
        {braking && <rect x={-5} y={70} width={10} height={13} rx={5} fill="#EF4444" opacity={0.35} style={{ filter: 'blur(3px)' }} />}
      </motion.g>
      <rect x={2} y={86} width={234} height={7} rx={3} fill="#334155" />
      <rect x={232} y={80} width={8} height={12} rx={2.5} fill="#475569" />
      <rect x={-4} y={88} width={8} height={3} rx={1.5} fill="#475569" />
      {[32, 62, 132, 206].map(wheel)}
    </svg>
  );
}

const POINTS = [
  { icon: Boxes, text: 'Multi-box consignments' },
  { icon: Warehouse, text: 'Pickup from your warehouse' },
  { icon: MapPinned, text: 'Tracked door to door' },
];

type Phase = 'brand' | 'drive' | 'offer';
const HOLD_MS = 6000;
const LEAVE = 1.8;

export function CargoTruckBanner({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const reduced = useReducedMotion() ?? false;
  const play = inView || reduced;
  const animate = !reduced;
  const [phase, setPhase] = useState<Phase>('brand');
  const [moving, setMoving] = useState(false);
  const [braking, setBraking] = useState(false);
  const x = useMotionValue(reduced ? 0 : -320);
  const pitch = useMotionValue(0);

  useEffect(() => {
    if (!play) return;
    if (reduced) { x.set(0); setPhase('offer'); return; }
    let cancelled = false;
    const wait = (ms: number) => new Promise(r => setTimeout(r, ms));
    (async () => {
      // Arrive: cruise in, brake hard over the last stretch, nose dips, then settles back on the springs.
      await wait(DRIVE_DELAY * 1000); if (cancelled) return;
      setMoving(true);
      await animateMV(x, -70, { duration: 0.85, ease: 'linear' }); if (cancelled) return;
      setBraking(true);
      animateMV(pitch, 1.6, { duration: 0.35, ease: 'easeOut' });
      await animateMV(x, 0, { duration: 0.75, ease: [0.2, 0.7, 0.35, 1] }); if (cancelled) return;
      setMoving(false);
      animateMV(pitch, 0, { type: 'spring', stiffness: 260, damping: 9 });
      await wait(500); setBraking(false);
      // Hold, then pull away: engine rev shake, body squats back, slow start that builds speed.
      await wait(HOLD_MS - 500); if (cancelled) return;
      setPhase('drive');
      await animateMV(pitch, [0, 0.25, -0.25, 0.2, 0], { duration: 0.35 }); if (cancelled) return;
      setMoving(true);
      animateMV(pitch, -1.4, { duration: 0.4, ease: 'easeOut' }).then(() => animateMV(pitch, 0, { type: 'spring', stiffness: 120, damping: 12 }));
      await animateMV(x, 1600, { duration: LEAVE, ease: [0.5, 0, 0.85, 0.55] }); if (cancelled) return;
      setMoving(false);
      setPhase('offer');
    })();
    return () => { cancelled = true; };
  }, [play, reduced, x, pitch]);

  const copy = (i: number, base = COPY_DELAY) => ({
    initial: animate ? { opacity: 0, y: 8 } : false,
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8, transition: { duration: 0.35, delay: i * 0.05 } },
    transition: { duration: 0.5, delay: base + i * 0.14, ease: EASE },
  } as const);

  return (
    <section ref={ref} aria-label="QuickPost Cargo"
      className={`relative h-[176px] rounded-2xl border border-[#E2E8F0] bg-white overflow-hidden shadow-[0_1px_2px_rgba(16,24,40,0.04),0_2px_8px_rgba(16,24,40,0.05)] ${className}`}>
      <span aria-hidden className="absolute -right-10 -top-10 w-56 h-56 rounded-full bg-[#00A86B]/[0.06]" />
      <span aria-hidden className="absolute right-40 top-3 w-24 h-10 opacity-60 [background-image:radial-gradient(#00A86B_1px,transparent_1px)] [background-size:8px_8px] [mask-image:linear-gradient(to_left,black,transparent)]" />
      <span aria-hidden className="absolute inset-x-0 bottom-0 h-[22px] bg-[#F1F5F4]" />
      <span aria-hidden className="absolute inset-x-6 bottom-[10px] h-[2px] bg-[repeating-linear-gradient(90deg,#CBD5E1_0_18px,transparent_18px_34px)]" />

      {/* Truck */}
      {phase !== 'offer' && (
        <motion.div className="absolute left-[28px] bottom-[8px] z-10" style={{ x }}>
          {/* road vibration only while rolling */}
          <motion.div animate={moving ? { y: [0, -0.8, 0, -0.5, 0] } : { y: 0 }} transition={moving ? { duration: 0.35, repeat: Infinity, ease: 'linear' } : { duration: 0.2 }}>
            <CargoTruck x={x} pitch={pitch} braking={braking} />
          </motion.div>
          {animate && phase === 'drive' && [0, 1, 2].map(i => (
            <motion.span key={`puff-${i}`} aria-hidden className="absolute -left-2 bottom-[16px] w-5 h-5 rounded-full bg-[#94A3B8] blur-[4px]"
              initial={{ opacity: 0, scale: 0.4, x: 0, y: 0 }}
              animate={{ opacity: [0, 0.55, 0], scale: [0.4, 1.3, 2], x: [-2, -18, -32], y: [0, -6, -14] }}
              transition={{ duration: 0.9, delay: i * 0.18, ease: 'easeOut' }} />
          ))}
          {animate && phase === 'brand' && braking && (
            <motion.span aria-hidden className="absolute -left-3 bottom-1 w-12 h-4 rounded-full bg-[#CBD5E1] blur-[6px]"
              initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: [0, 0.8, 0], scale: [0.6, 1.4, 1.9] }}
              transition={{ duration: 0.9 }} />
          )}
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {phase !== 'offer' ? (
          <motion.div key="brand" exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
            className="relative h-full flex items-center pl-[290px] pr-8 xl:pr-12 pb-[18px]">
            <div className="min-w-0">
              <motion.p {...copy(0)} className="text-[13px] font-semibold text-[#00A86B] tracking-wide">QuickPost Cargo</motion.p>
              <motion.p {...copy(1)} className="mt-0.5 text-[24px] xl:text-[28px] font-bold tracking-[-0.02em] text-[#0F172A] leading-[1.15] truncate">
                Heavy loads. <span className="text-[#00A86B]">Same easy shipping.</span>
              </motion.p>
              <motion.ul {...copy(2)} className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1.5">
                {POINTS.map(p => (
                  <li key={p.text} className="inline-flex items-center gap-1.5 text-[13px] text-[#475569]">
                    <p.icon className="w-4 h-4 text-[#00A86B]" />{p.text}
                  </li>
                ))}
              </motion.ul>
            </div>
          </motion.div>
        ) : (
          <motion.div key="offer" className="relative h-full flex items-center justify-center gap-8 xl:gap-12 px-8 pb-[18px]">
            <motion.span {...copy(0, 0)} className="hidden xl:flex w-14 h-14 rounded-2xl bg-[#F0FDF4] items-center justify-center shrink-0">
              <Wallet className="w-7 h-7 text-[#00A86B]" />
            </motion.span>
            <div className="min-w-0 text-center xl:text-left">
              <motion.p {...copy(0, 0.05)} className="text-[13px] font-semibold text-[#00A86B] tracking-wide">{WALLET_CASHBACK_OFFER.heading}</motion.p>
              <motion.p {...copy(1, 0.05)} className="mt-0.5 text-[26px] xl:text-[30px] font-bold tracking-[-0.02em] text-[#0F172A] leading-[1.15]">
                {WALLET_CASHBACK_OFFER.offer} <span className="text-[#94A3B8] font-semibold">&middot;</span> <span className="text-[#00A86B]">{WALLET_CASHBACK_OFFER.benefit}</span>
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
