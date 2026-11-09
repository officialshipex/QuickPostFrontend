import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { Check, Home, LayoutDashboard, Bike, Store } from 'lucide-react';
import shopifyLogo from '../../assets/shopify-logo-tight.png';
import wooLogo from '../../assets/woo-commerce-logo.png';

/* Landing page — shipping-channel network shown under "Take Full Control of Your Shipping".
   Lightweight 2.5D SVG scene (no WebGL): parcels travel along dotted routes from sales channels into the
   QuickPost hub, then out to a QuickPost truck. Native SVG motion (animateMotion) keeps it smooth and cheap;
   animation only runs while the scene is on screen. Reduced motion or small screens get a static frame. */

const VB_W = 1200;
const VB_H = 470;
const HUB = { x: 640, y: 240 };

const CHANNELS = [
  { y: 92, logo: shopifyLogo, alt: 'Shopify', w: 150 },
  { y: 192, logo: '/brands/amazon.svg', alt: 'Amazon', w: 112 },
  { y: 292, logo: '/brands/flipkart.svg', alt: 'Flipkart', w: 118 },
  { y: 392, logo: wooLogo, alt: 'WooCommerce', w: 138 },
];

// Each channel's route curves into the hub's left face; the outgoing route runs to the truck dock.
const inRoute = (y: number) => `M246 ${y} C 380 ${y}, 440 ${HUB.y + 36}, 572 ${HUB.y + 36}`;
const OUT_ROUTE = `M708 ${HUB.y + 54} C 780 ${HUB.y + 54}, 800 330, 872 330`;
const ROAD = 'M760 382 L 1188 382';

const IN_DUR = 9;
const OUT_DUR = 3.6;

/** Isometric cardboard parcel centred on (0,0). */
function Parcel() {
  return (
    <g>
      <ellipse cx="0" cy="15" rx="12" ry="3.2" fill="#0F172A" opacity="0.12" />
      <polygon points="0,-12 11,-6 0,0 -11,-6" fill="#E8CA9C" />
      <polygon points="-11,-6 0,0 0,12 -11,6" fill="#CFA56F" />
      <polygon points="0,0 11,-6 11,6 0,12" fill="#BC8E58" />
      <line x1="-5.5" y1="-9" x2="5.5" y2="-3" stroke="#C49A64" strokeWidth="1.6" />
      <line x1="0" y1="0" x2="0" y2="12" stroke="#A97C48" strokeWidth="0.6" opacity="0.6" />
    </g>
  );
}

/** Parcel that rides `path`, fading in/out at the ends. `offset` (s) staggers it along the loop. */
function MovingParcel({ path, dur, offset }: { path: string; dur: number; offset: number }) {
  const begin = `${-offset}s`;
  return (
    <g opacity="0">
      <animateMotion path={path} dur={`${dur}s`} begin={begin} repeatCount="indefinite" rotate="0" />
      <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.08;0.9;1" dur={`${dur}s`} begin={begin} repeatCount="indefinite" />
      <Parcel />
    </g>
  );
}

function Route({ d }: { d: string }) {
  return (
    <g fill="none" strokeLinecap="round">
      <path d={d} stroke="#CBD5E1" strokeWidth="2.6" strokeDasharray="0.1 9" />
      <path d={d} stroke="#00A86B" strokeOpacity="0.55" strokeWidth="2.6" strokeDasharray="0.1 9" />
    </g>
  );
}

function ChannelTile({ y, logo, alt, w }: typeof CHANNELS[number]) {
  return (
    <g transform={`translate(150 ${y})`}>
      <ellipse cx="0" cy="42" rx="80" ry="7" fill="#0F172A" opacity="0.06" />
      {/* raised tile: darker base edge gives depth */}
      <rect x="-92" y="-32" width="184" height="72" rx="14" fill="#E2E8F0" />
      <rect x="-92" y="-36" width="184" height="70" rx="14" fill="#FFFFFF" stroke="#E2E8F0" />
      <image href={logo} x={-w / 2} y="-20" width={w} height="38" preserveAspectRatio="xMidYMid meet" aria-label={alt} />
      <circle cx="92" cy="-1" r="4.5" fill="#FFFFFF" stroke="#00A86B" strokeWidth="2" />
    </g>
  );
}

/** QuickPost fulfilment building (isometric warehouse): loading doors on both sides, window bands,
    QuickPost sign on the façade and the QuickPost mark on a rooftop sign. Ground footprint centred on HUB. */
function Hub() {
  const cx = HUB.x, gy = HUB.y + 28;          // ground centre
  const W = 120, D = 60, H = 112;               // half-width, half-depth (iso 2:1), wall height
  const L = [cx - W, gy], B = [cx, gy + D], R = [cx + W, gy], T = [cx, gy - D];
  const up = (p: number[], h: number) => `${p[0]},${p[1] - h}`;
  const pt = (p: number[]) => `${p[0]},${p[1]}`;
  // Point on a wall edge at fraction t, raised by h.
  const along = (a: number[], b: number[], t: number, h = 0) => `${a[0] + (b[0] - a[0]) * t},${a[1] + (b[1] - a[1]) * t - h}`;
  const door = (a: number[], b: number[]) => `${along(a, b, 0.36)} ${along(a, b, 0.64)} ${along(a, b, 0.64, 34)} ${along(a, b, 0.36, 34)}`;
  const win = (a: number[], b: number[], t0: number, t1: number, h: number) => `${along(a, b, t0, h)} ${along(a, b, t1, h)} ${along(a, b, t1, h + 10)} ${along(a, b, t0, h + 10)}`;
  // Two floors of windows; the upper row skips the span behind the façade sign.
  const windows = (a: number[], b: number[], sign = false) => [48, 74].flatMap(h => [0.08, 0.22, 0.36, 0.5, 0.64, 0.78]
    .filter(() => !(sign && h === 74))
    .map(t => <polygon key={`${h}-${t}`} points={win(a, b, t, t + 0.1, h)} fill="#CBD5E1" opacity="0.9" />));

  return (
    <g>
      {/* ground shadow */}
      <polygon points={`${cx - W - 6},${gy + 6} ${cx + 10},${gy + D + 16} ${cx + W + 26},${gy + 8} ${cx + 10},${gy - D + 4}`} fill="#0F172A" opacity="0.07" />
      {/* walls */}
      <polygon points={`${pt(L)} ${pt(B)} ${up(B, H)} ${up(L, H)}`} fill="#F4F7F6" stroke="#D5DEDB" />
      <polygon points={`${pt(B)} ${pt(R)} ${up(R, H)} ${up(B, H)}`} fill="#E3EAE7" stroke="#D5DEDB" />
      {/* brand band under the roof line */}
      <polygon points={`${up(L, H)} ${up(B, H)} ${up(B, H - 5)} ${up(L, H - 5)}`} fill="#00A86B" />
      <polygon points={`${up(B, H)} ${up(R, H)} ${up(R, H - 5)} ${up(B, H - 5)}`} fill="#0B8A57" />
      {/* window bands */}
      {windows(L, B)}
      {windows(B, R, true)}
      {/* loading doors (roller shutters) */}
      {[[L, B], [B, R]].map(([a, b], i) => (
        <g key={i}>
          <polygon points={door(a, b)} fill="#475569" />
          {[8, 16, 24].map(h => <polyline key={h} points={`${along(a, b, 0.36, h)} ${along(a, b, 0.64, h)}`} stroke="#64748B" strokeWidth="1" />)}
          <polygon points={`${along(a, b, 0.33)} ${along(a, b, 0.67)} ${along(a, b, 0.67, -4)} ${along(a, b, 0.33, -4)}`} fill="#CBD5E1" />
        </g>
      ))}
      {/* QuickPost sign on the right façade (drawn in the wall plane) */}
      <g transform={`matrix(1,-0.5,0,1,${cx + 14},${gy + D - H + 16})`}>
        <defs><clipPath id="qp-hub-sign"><rect x="0" y="0" width="92" height="20" rx="2" /></clipPath></defs>
        <rect x="-2" y="-2" width="96" height="24" rx="3" fill="#FFFFFF" stroke="#D5DEDB" />
        <image href="/logo-color.png" x="-4" y="-37" width="100" height="100" clipPath="url(#qp-hub-sign)" preserveAspectRatio="xMidYMid meet" />
      </g>
      {/* roof with parapet */}
      <polygon points={`${up(L, H)} ${up(B, H)} ${up(R, H)} ${up(T, H)}`} fill="#FFFFFF" stroke="#D5DEDB" />
      <polygon points={`${up(L, H - 2)} ${up(B, H - 2)} ${up(R, H - 2)} ${up(T, H - 2)}`} fill="none" stroke="#E2E8F0" transform="scale(1)" />
      {/* rooftop units */}
      {[[-58, 4], [46, -6]].map(([dx, dy], i) => {
        const x = cx + dx, y = gy - H + dy;
        return (
          <g key={i}>
            <polygon points={`${x},${y - 8} ${x + 14},${y - 1} ${x},${y + 6} ${x - 14},${y - 1}`} fill="#F1F5F9" stroke="#CBD5E1" />
            <polygon points={`${x - 14},${y - 1} ${x},${y + 6} ${x},${y + 12} ${x - 14},${y + 5}`} fill="#E2E8F0" />
            <polygon points={`${x},${y + 6} ${x + 14},${y - 1} ${x + 14},${y + 5} ${x},${y + 12}`} fill="#CBD5E1" />
          </g>
        );
      })}
      {/* rooftop QuickPost mark */}
      <line x1={cx} y1={gy - H - 2} x2={cx} y2={gy - H - 22} stroke="#94A3B8" strokeWidth="2" />
      <ellipse cx={cx} cy={gy - H} rx="16" ry="5" fill="#0F172A" opacity="0.08" />
      <circle cx={cx} cy={gy - H - 44} r="24" fill="#FFFFFF" stroke="#D5DEDB" />
      <image href="/icon-color.png" x={cx - 11.5} y={gy - H - 59} width="23" height="30" preserveAspectRatio="xMidYMid meet" />
    </g>
  );
}

/** QuickPost delivery truck (side view with depth), wheels at y≈48 relative to origin. */
function Truck() {
  return (
    <g>
      <ellipse cx="84" cy="58" rx="92" ry="7" fill="#0F172A" opacity="0.14" />
      {/* cargo box */}
      <polygon points="0,-10 120,-10 132,-20 12,-20" fill="#0B8A57" />
      <polygon points="120,-10 132,-20 132,36 120,46" fill="#0A7A4D" />
      <rect x="0" y="-10" width="120" height="56" rx="3" fill="#00A86B" />
      <defs>
        <clipPath id="qp-truck-side"><rect x="0" y="-10" width="120" height="56" rx="3" /></clipPath>
      </defs>
      <image href="/logo-white.png" x="8" y="-34" width="104" height="104" clipPath="url(#qp-truck-side)" preserveAspectRatio="xMidYMid meet" />
      <rect x="0" y="40" width="120" height="6" fill="#0F6B38" opacity="0.5" />
      {/* cab */}
      <polygon points="122,4 150,4 158,-3 130,-3" fill="#F1F5F9" />
      <path d="M122 4 H150 L166 24 V46 H122 Z" fill="#FFFFFF" stroke="#E2E8F0" />
      <path d="M128 9 H148 L159 23 H128 Z" fill="#1E293B" opacity="0.88" />
      <path d="M132 11 L138 21" stroke="#FFFFFF" strokeOpacity="0.35" strokeWidth="2" />
      <rect x="122" y="30" width="44" height="4" fill="#00A86B" />
      <rect x="161" y="36" width="5" height="4" rx="1" fill="#FDE68A" />
      {/* wheels */}
      {[30, 98, 142].map(cx => (
        <g key={cx}>
          <circle cx={cx} cy="48" r="10" fill="#1F2937" />
          <circle cx={cx} cy="48" r="4" fill="#94A3B8" />
        </g>
      ))}
    </g>
  );
}

const POINTS = [
  'Orders sync automatically from your stores and marketplaces',
  'Every order ships from one dashboard',
  'Each parcel is tracked from pickup to doorstep',
];

/** Vertical connector between flow steps; a dot travels down it. */
function FlowLink({ animated }: { animated: boolean }) {
  return (
    <div className="relative mx-auto w-px h-9 bg-[repeating-linear-gradient(180deg,#00A86B_0_4px,transparent_4px_8px)] opacity-60">
      {animated && (
        <motion.span
          className="absolute -left-[3px] w-[7px] h-[7px] rounded-full bg-[#00A86B]"
          animate={{ top: ['-10%', '100%'], opacity: [0, 1, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeIn' }}
        />
      )}
    </div>
  );
}

const RUN_STEPS = ['Picked up', 'In transit', 'Delivered'];
const PHASE_MS = [1400, 5000, 3200]; // pickup, ride, delivered (then repeat)

/** Rider picks the parcel up, rides the dotted route for 5 s, and the home card flips (3D) to "Delivered". */
function DeliveryRun({ animated }: { animated: boolean }) {
  const [phase, setPhase] = useState(animated ? 0 : 2);
  useEffect(() => {
    if (!animated) return;
    const t = window.setTimeout(() => setPhase(p => (p + 1) % 3), PHASE_MS[phase]);
    return () => window.clearTimeout(t);
  }, [phase, animated]);

  const riderX = phase === 0 ? '0%' : '100%';
  return (
    <div className="rounded-2xl border border-[#EEF2F6] bg-[#F8FAFC] px-3.5 pt-4 pb-3.5">
      {/* Route */}
      <div className="relative h-[64px]">
        {/* dotted road */}
        <div className="absolute left-7 right-7 top-1/2 -translate-y-1/2 h-[3px] bg-[repeating-linear-gradient(90deg,#CBD5E1_0_6px,transparent_6px_12px)] rounded-full" />
        {/* travelled part */}
        <motion.div
          className="absolute left-7 top-1/2 -translate-y-1/2 h-[3px] bg-[repeating-linear-gradient(90deg,#00A86B_0_6px,transparent_6px_12px)] rounded-full"
          initial={false}
          animate={{ width: phase === 0 ? '0%' : 'calc(100% - 56px)' }}
          transition={{ duration: phase === 1 ? 5 : 0, ease: 'linear' }}
        />

        {/* pickup point */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-14 flex flex-col items-center">
          <span className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${phase === 0 ? 'bg-[#00A86B] text-white' : 'bg-white border border-[#E2E8F0] text-[#00A86B]'}`}>
            <Store className="w-5 h-5" />
          </span>
        </div>

        {/* home: flips in 3D to "Delivered" */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-14 h-14" style={{ perspective: 400 }}>
          <motion.div
            className="relative w-full h-full"
            style={{ transformStyle: 'preserve-3d' }}
            initial={false}
            animate={{ rotateY: phase === 2 ? 180 : 0, scale: phase === 2 ? [1, 1.12, 1] : 1 }}
            transition={{ rotateY: { duration: 0.7, ease: [0.16, 1, 0.3, 1] }, scale: { duration: 0.7 } }}
          >
            <span className="absolute inset-[8px] rounded-xl bg-white border border-[#E2E8F0] text-[#94A3B8] flex items-center justify-center [backface-visibility:hidden]">
              <Home className="w-5 h-5" />
            </span>
            <span className="absolute inset-[8px] rounded-xl bg-[#00A86B] text-white flex items-center justify-center shadow-[0_10px_20px_-8px_rgba(0,168,107,0.6)] [backface-visibility:hidden] [transform:rotateY(180deg)]">
              <Check className="w-5 h-5" strokeWidth={3} />
            </span>
          </motion.div>
        </div>

        {/* rider */}
        <div className="absolute left-14 right-14 top-1/2 -translate-y-1/2 h-0">
          <motion.div
            className="absolute -top-[17px] -ml-[17px]"
            initial={false}
            animate={{ left: riderX, opacity: phase === 2 ? 0 : 1 }}
            transition={{ left: { duration: phase === 1 ? 5 : 0, ease: 'easeInOut' }, opacity: { duration: 0.25 } }}
          >
            <motion.span
              className="w-[34px] h-[34px] rounded-full bg-white border-2 border-[#00A86B] text-[#00A86B] flex items-center justify-center shadow-md"
              animate={phase === 1 ? { y: [0, -2, 0] } : { y: 0 }}
              transition={{ duration: 0.4, repeat: phase === 1 ? Infinity : 0 }}
            >
              <Bike className="w-4 h-4" />
            </motion.span>
          </motion.div>
        </div>
      </div>

      {/* Steps */}
      <div className="mt-3 grid grid-cols-3 gap-1.5">
        {RUN_STEPS.map((label, i) => {
          const done = i < phase || (i === 2 && phase === 2);
          const active = i === phase;
          return (
            <div key={label} className="flex flex-col items-center text-center">
              <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center transition-colors duration-300 ${done || active ? 'bg-[#00A86B] text-white' : 'bg-[#E2E8F0] text-[#94A3B8]'}`}>
                {done && !active ? <Check className="w-3 h-3" strokeWidth={3} /> : i + 1}
              </span>
              <span className={`mt-1 text-[11.5px] font-semibold transition-colors duration-300 ${active ? 'text-[#0F172A]' : done ? 'text-[#475569]' : 'text-[#94A3B8]'}`}>{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Phones: the wide SVG scene is unreadable at this width, so the same story is told as a vertical flow. */
function MobileFlow({ animated }: { animated: boolean }) {
  const step = (i: number) => ({
    initial: { opacity: 0, y: 14 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-40px' },
    transition: { duration: 0.45, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] as const },
  });
  return (
    <div className="rounded-3xl bg-white border border-[#E2E8F0] p-4 shadow-[0_12px_32px_-18px_rgba(15,23,42,0.25)]">
      <motion.div {...step(0)}>
        <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#64748B] text-center mb-3">Your sales channels</p>
        <div className="grid grid-cols-2 gap-2">
          {CHANNELS.map(c => (
            <div key={c.alt} className="h-14 rounded-2xl border border-[#EEF2F6] bg-[#F8FAFC] flex items-center justify-center px-3">
              <img src={c.logo} alt={c.alt} className="max-h-7 max-w-[100px] w-auto object-contain" />
            </div>
          ))}
        </div>
      </motion.div>

      <FlowLink animated={animated} />

      <motion.div {...step(1)} className="rounded-2xl bg-[#00A86B] text-white px-4 py-3.5 flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0"><LayoutDashboard className="w-5 h-5" /></span>
        <div className="min-w-0">
          <div className="text-[14px] font-bold">QuickPost dashboard</div>
          <div className="text-[12px] text-white/85">Every order in one place, ready to ship</div>
        </div>
      </motion.div>

      <FlowLink animated={animated} />

      <motion.div {...step(2)}>
        <DeliveryRun animated={animated} />
      </motion.div>
    </div>
  );
}

export function ShippingNetworkScene() {
  const sectionRef = useRef<HTMLElement>(null);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.15 });
  const reduced = useReducedMotion() ?? false;
  const [small] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches);
  const animated = !reduced && !small && inView;
  const mobileAnimated = !reduced && small;

  // Scroll-linked 3D entrance: tilted in depth while the section approaches, flat once it is centred.
  const still = reduced || small;
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'center center'] });
  const sceneRotateX = useTransform(scrollYProgress, [0, 1], still ? [0, 0] : [32, 0]);
  const sceneScale = useTransform(scrollYProgress, [0, 1], still ? [1, 1] : [0.86, 1]);
  const sceneY = useTransform(scrollYProgress, [0, 1], still ? [0, 0] : [80, 0]);
  const textRotateY = useTransform(scrollYProgress, [0, 1], still ? [0, 0] : [28, 0]);
  const textX = useTransform(scrollYProgress, [0, 1], still ? [0, 0] : [-70, 0]);
  const fade = useTransform(scrollYProgress, [0, 0.6], still ? [1, 1] : [0, 1]);

  return (
    <section ref={sectionRef} className="bg-[#F4F6F5] py-[48px] md:py-[80px] overflow-hidden" style={{ fontFamily: 'Roboto, sans-serif' }}>
      <div className="max-w-[1320px] mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] gap-7 md:gap-10 lg:gap-12 items-center [perspective:1400px]">
        {/* Text — swings in from depth and settles on the left */}
        <motion.div style={{ rotateY: textRotateY, x: textX, opacity: fade, transformOrigin: 'left center' }}>
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#00A86B]/10 text-[13px] md:text-[11px] font-bold uppercase tracking-[0.12em] md:tracking-[0.14em] text-[#00A86B]">Channels</span>
          <h2 className="mt-3 text-[28px] md:text-[40px] font-bold text-[#1A1A1A] leading-[1.15] tracking-tight">
            Every sales channel. <span className="text-[#00A86B]">One shipping network.</span>
          </h2>
          <p className="mt-3 md:mt-4 text-[14.5px] md:text-[16px] text-[#5F5E5A] leading-relaxed">
            Connect your store and marketplaces once — QuickPost brings every order into a single flow, from your warehouse to the customer’s door.
          </p>
          <ul className="mt-5 md:mt-6 space-y-2.5 md:space-y-3">
            {POINTS.map(t => (
              <li key={t} className="flex items-start gap-3 text-[14px] md:text-[15px] text-[#334155]">
                <span className="mt-0.5 w-5 h-5 rounded-full bg-[#00A86B]/10 flex items-center justify-center shrink-0"><Check className="w-3 h-3 text-[#00A86B]" strokeWidth={3} /></span>
                {t}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Phones: vertical flow */}
        <div className="md:hidden"><MobileFlow animated={mobileAnimated} /></div>

        {/* Scene — tilts back in 3D and lays flat as you scroll in */}
        <motion.div ref={ref} className="hidden md:block" style={{ rotateX: sceneRotateX, scale: sceneScale, y: sceneY, opacity: fade, transformOrigin: 'center bottom' }}>
        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="w-full h-auto block" aria-hidden="true">
          <defs>
            <radialGradient id="qp-net-light" cx="0.52" cy="0.45" r="0.6">
              <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.95" />
              <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
            </radialGradient>
            <pattern id="qp-net-grid" width="22" height="22" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="#CBD5E1" opacity="0.5" />
            </pattern>
            <radialGradient id="qp-net-fade" cx="0.5" cy="0.5" r="0.55">
              <stop offset="0.55" stopColor="#FFFFFF" />
              <stop offset="1" stopColor="#000000" />
            </radialGradient>
            <mask id="qp-net-mask"><rect width={VB_W} height={VB_H} fill="url(#qp-net-fade)" /></mask>
          </defs>

          {/* Soft lighting + faint floor grid */}
          <rect width={VB_W} height={VB_H} fill="url(#qp-net-grid)" mask="url(#qp-net-mask)" />
          <rect width={VB_W} height={VB_H} fill="url(#qp-net-light)" />

          {/* Routes */}
          {CHANNELS.map(c => <Route key={c.alt} d={inRoute(c.y)} />)}
          <Route d={OUT_ROUTE} />
          <Route d={ROAD} />

          {/* Channels */}
          {CHANNELS.map(c => <ChannelTile key={c.alt} {...c} />)}

          <Hub />

          {/* Parcels */}
          {animated ? (
            <>
              {CHANNELS.map((c, i) => (
                <g key={c.alt}>
                  <MovingParcel path={inRoute(c.y)} dur={IN_DUR} offset={i * 1.4} />
                  <MovingParcel path={inRoute(c.y)} dur={IN_DUR} offset={i * 1.4 + IN_DUR / 2} />
                </g>
              ))}
              <MovingParcel path={OUT_ROUTE} dur={OUT_DUR} offset={0} />
              <MovingParcel path={OUT_ROUTE} dur={OUT_DUR} offset={OUT_DUR / 2} />
            </>
          ) : (
            // Static frame: one parcel mid-way on each route
            <>
              {CHANNELS.map((c, i) => (
                <g key={c.alt} transform={`translate(${380 + (i % 2) * 30} ${c.y + (HUB.y + 36 - c.y) * 0.45})`}><Parcel /></g>
              ))}
              <g transform="translate(800 290)"><Parcel /></g>
            </>
          )}

          {/* Truck: waits at the dock, drives off along the road, and returns */}
          <motion.g
            initial={false}
            animate={animated ? { x: [0, 0, 300, 300, -60, 0], opacity: [1, 1, 0, 0, 0, 1] } : { x: 0, opacity: 1 }}
            transition={animated ? { duration: 12, times: [0, 0.45, 0.72, 0.8, 0.82, 1], ease: ['linear', 'easeIn', 'linear', 'linear', 'easeOut'], repeat: Infinity } : { duration: 0 }}>
            <g transform="translate(880 326)"><Truck /></g>
          </motion.g>
        </svg>
        </motion.div>
      </div>
    </section>
  );
}
