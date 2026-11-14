import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { ArrowRight, Boxes, MapPinned, Warehouse } from 'lucide-react';
import { ShineButton } from '../ui/ShineButton';

/* Cargo (B2B) home promo — the Cargo counterpart of OfferFlagBanner, same card and timing language.
   A QuickPost Cargo truck drives in along the road and parks on the left (wheels spin while it moves, a little
   dust as it brakes); then the copy and the call to action stagger in. Plays once when the banner scrolls into
   view; prefers-reduced-motion shows the final state. */

const EASE = [0.22, 1, 0.36, 1] as const;
const DRIVE = 1.6;
const DRIVE_DELAY = 0.25;
const PARKED = DRIVE_DELAY + DRIVE;
const COPY_DELAY = PARKED - 0.15;

function CargoTruck({ moving }: { moving: boolean }) {
  const wheel = (cx: number) => (
    <g>
      <circle cx={cx} cy={98} r={13} fill="#0F172A" />
      <circle cx={cx} cy={98} r={7} fill="#CBD5E1" />
      <circle cx={cx} cy={98} r={2.5} fill="#475569" />
      <g stroke="#64748B" strokeWidth={1.6} strokeLinecap="round">
        <line x1={cx - 6} y1={98} x2={cx + 6} y2={98} /><line x1={cx} y1={92} x2={cx} y2={104} />
        {moving && <animateTransform attributeName="transform" type="rotate" from={`0 ${cx} 98`} to={`360 ${cx} 98`} dur="0.4s" repeatCount="indefinite" />}
      </g>
    </g>
  );
  return (
    <svg viewBox="0 0 250 116" className="w-[230px] h-[107px] overflow-visible" aria-hidden>
      <ellipse cx={125} cy={112} rx={118} ry={4} fill="#0F172A" opacity={0.1} />
      {/* container */}
      <rect x={4} y={10} width={158} height={76} rx={5} fill="#FFFFFF" stroke="#CBD5E1" strokeWidth={1.4} />
      {Array.from({ length: 9 }).map((_, i) => <line key={i} x1={20 + i * 16} y1={14} x2={20 + i * 16} y2={82} stroke="#EEF2F6" strokeWidth={2} />)}
      <rect x={4} y={58} width={158} height={12} fill="#00A86B" />
      <text x={83} y={44} textAnchor="middle" fontSize="17" fontWeight="800" fill="#0F172A" fontFamily="Roboto, sans-serif">Quick<tspan fill="#00A86B">Post</tspan></text>
      <text x={83} y={54} textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#64748B" letterSpacing="2.5" fontFamily="Roboto, sans-serif">CARGO</text>
      {/* cab */}
      <path d="M166 34 h40 a8 8 0 0 1 6.6 3.5 l20 29 a8 8 0 0 1 1.4 4.5 V90 H166 Z" fill="#00A86B" />
      <path d="M174 40 h26 a3 3 0 0 1 2.5 1.3 l13 19 a1.5 1.5 0 0 1 -1.2 2.4 H174 Z" fill="#E0F2FE" />
      <path d="M176 41 l7 0 l-5 20 h-2 Z" fill="#FFFFFF" opacity={0.55} />
      <rect x={228} y={78} width={6} height={6} rx={1.5} fill="#FDE68A" />
      <rect x={166} y={64} width={3} height={26} fill="#0F172A" opacity={0.16} />
      <rect x={186} y={72} width={9} height={2.5} rx={1} fill="#0F172A" opacity={0.3} />
      {/* chassis */}
      <rect x={2} y={86} width={234} height={7} rx={3} fill="#334155" />
      <rect x={232} y={80} width={8} height={12} rx={2.5} fill="#475569" />
      {wheel(32)}{wheel(62)}{wheel(132)}{wheel(206)}
    </svg>
  );
}

const POINTS = [
  { icon: Boxes, text: 'Multi-box consignments' },
  { icon: Warehouse, text: 'Pickup from your warehouse' },
  { icon: MapPinned, text: 'Tracked door to door' },
];

export function CargoTruckBanner({ className = '' }: { className?: string }) {
  const navigate = useNavigate();
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const reduced = useReducedMotion() ?? false;
  const play = inView || reduced;
  const animate = !reduced;

  const copy = (i: number) => ({
    initial: animate ? { opacity: 0, y: 8 } : false,
    animate: play ? { opacity: 1, y: 0 } : undefined,
    transition: { duration: 0.5, delay: COPY_DELAY + i * 0.14, ease: EASE },
  } as const);

  return (
    <section ref={ref} aria-label="QuickPost Cargo"
      className={`relative h-[176px] rounded-2xl border border-[#E2E8F0] bg-white overflow-hidden shadow-[0_1px_2px_rgba(16,24,40,0.04),0_2px_8px_rgba(16,24,40,0.05)] ${className}`}>
      {/* Backdrop: soft brand light, dotted corner, the road */}
      <span aria-hidden className="absolute -right-10 -top-10 w-56 h-56 rounded-full bg-[#00A86B]/[0.06]" />
      <span aria-hidden className="absolute right-40 top-3 w-24 h-10 opacity-60 [background-image:radial-gradient(#00A86B_1px,transparent_1px)] [background-size:8px_8px] [mask-image:linear-gradient(to_left,black,transparent)]" />
      <span aria-hidden className="absolute inset-x-0 bottom-0 h-[22px] bg-[#F1F5F4]" />
      <span aria-hidden className="absolute inset-x-6 bottom-[10px] h-[2px] bg-[repeating-linear-gradient(90deg,#CBD5E1_0_18px,transparent_18px_34px)]" />

      {/* Truck: drives in and parks */}
      <motion.div className="absolute bottom-[8px] z-10"
        initial={animate ? { left: '-260px' } : false}
        animate={play ? { left: '28px' } : undefined}
        transition={{ duration: DRIVE, delay: DRIVE_DELAY, ease: EASE }}>
        <motion.div
          animate={animate && play ? { y: [0, -1.5, 0, -1, 0] } : undefined}
          transition={{ duration: DRIVE, delay: DRIVE_DELAY, ease: 'linear' }}>
          <CargoTruck moving={animate && !inView ? false : animate && play} />
        </motion.div>
        {/* dust as it brakes */}
        {animate && (
          <motion.span aria-hidden className="absolute -left-3 bottom-1 w-10 h-4 rounded-full bg-[#CBD5E1] blur-[6px]"
            initial={{ opacity: 0, scale: 0.6 }} animate={play ? { opacity: [0, 0.8, 0], scale: [0.6, 1.4, 1.8] } : undefined}
            transition={{ duration: 0.9, delay: PARKED - 0.35 }} />
        )}
      </motion.div>

      {/* Copy */}
      <div className="relative h-full grid grid-cols-[minmax(0,1fr)_auto] items-center gap-6 pl-[290px] pr-8 xl:pr-12 pb-[18px]">
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

        <motion.div {...copy(3)} className="shrink-0 pl-6 xl:pl-8 border-l border-[#E2E8F0] h-12 flex items-center">
          <ShineButton type="button" onClick={() => navigate('/user/rate-calculator')}
            className="h-11 px-6 rounded-full bg-gradient-to-r from-[#00A86B] to-[#0F6B38] text-white text-[13.5px] font-bold inline-flex items-center gap-2 shadow-[0_10px_22px_-10px_rgba(0,168,107,0.8)] hover:-translate-y-px transition-transform">
            <span className="relative">Get a freight quote</span>
            <ArrowRight className="relative w-4 h-4" />
          </ShineButton>
        </motion.div>
      </div>
    </section>
  );
}
