import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

/* Landing page — closing call-to-action. A delivery cycle drawn in the hero van's dashed-line style rides
   across the band towing a "Get Started" ribbon. */

const DASH = { stroke: 'white', fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

function Wheel({ cx, cy, spin }: { cx: number; cy: number; spin: boolean }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={26} {...DASH} strokeWidth={3.5} strokeDasharray="6 4" />
      <g>
        <circle cx={cx} cy={cy} r={17} {...DASH} strokeWidth={1.5} strokeDasharray="3 3" opacity={0.6} />
        <line x1={cx - 17} y1={cy} x2={cx + 17} y2={cy} {...DASH} strokeWidth={1.2} strokeDasharray="2 3" opacity={0.6} />
        <line x1={cx} y1={cy - 17} x2={cx} y2={cy + 17} {...DASH} strokeWidth={1.2} strokeDasharray="2 3" opacity={0.6} />
        {spin && <animateTransform attributeName="transform" type="rotate" from={`0 ${cx} ${cy}`} to={`360 ${cx} ${cy}`} dur="0.9s" repeatCount="indefinite" />}
      </g>
      <circle cx={cx} cy={cy} r={3} fill="white" />
    </g>
  );
}

/** Delivery cycle with rider and a parcel crate on the rear carrier, in dashed white strokes. */
function DottedCycle({ spin }: { spin: boolean }) {
  return (
    <svg viewBox="0 0 220 124" className="w-[150px] md:w-[200px] h-auto overflow-visible" aria-hidden="true">
      <Wheel cx={45} cy={94} spin={spin} />
      <Wheel cx={168} cy={94} spin={spin} />
      {/* frame */}
      <path d="M45 94 L100 94 L88 52 Z M88 52 L150 54 L100 94 M150 54 L168 94" {...DASH} strokeWidth={3} strokeDasharray="5 3" />
      {/* bars + saddle */}
      <path d="M150 54 L146 40 L160 37" {...DASH} strokeWidth={3} strokeDasharray="4 2" />
      <path d="M78 49 L98 49" {...DASH} strokeWidth={3.5} />
      {/* parcel crate on the carrier */}
      <rect x={22} y={38} width={44} height={30} rx={2} {...DASH} strokeWidth={2} strokeDasharray="4 2" />
      <line x1={44} y1={38} x2={44} y2={68} {...DASH} strokeWidth={1.5} strokeDasharray="3 1" opacity={0.65} />
      <line x1={22} y1={53} x2={66} y2={53} {...DASH} strokeWidth={1.5} strokeDasharray="3 1" opacity={0.65} />
      {/* rider */}
      <circle cx={128} cy={12} r={8} {...DASH} strokeWidth={2.5} strokeDasharray="4 2" />
      <path d="M92 47 L122 22" {...DASH} strokeWidth={3} strokeDasharray="5 2" />
      <path d="M120 25 L152 38" {...DASH} strokeWidth={2.5} strokeDasharray="4 2" />
      <motion.path
        d="M94 48 L112 70 L100 94" {...DASH} strokeWidth={2.5} strokeDasharray="4 2"
        animate={spin ? { d: ['M94 48 L112 70 L100 94', 'M94 48 L106 74 L104 90', 'M94 48 L112 70 L100 94'] } : undefined}
        transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
      />
    </svg>
  );
}

export function FinalCtaBand() {
  return (
    <section className="relative bg-[#F4F7F5] px-4 md:px-8 py-12 md:py-20 overflow-hidden" style={{ fontFamily: 'Roboto, sans-serif' }}>
      <div aria-hidden className="pointer-events-none absolute inset-0 [background-image:radial-gradient(#C7D7CF_1.2px,transparent_1.2px)] [background-size:20px_20px] [mask-image:radial-gradient(ellipse_at_center,#000_35%,transparent_85%)]" />
      <div className="relative max-w-[1200px] mx-auto rounded-[28px] md:rounded-[36px] bg-[#00A86B] overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_80%_at_80%_0%,#00C47A_0%,transparent_60%),linear-gradient(180deg,#00A86B_0%,#008F5B_100%)]" />

        <div className="relative px-6 md:px-14 pt-10 md:pt-14 text-center md:text-left md:flex md:items-end md:justify-between gap-8">
          <div className="max-w-[560px] mx-auto md:mx-0">
            <h2 className="text-white text-[28px] md:text-[42px] font-bold leading-[1.12] tracking-tight">
              Start shipping in minutes
            </h2>
            <p className="mt-3 text-white/85 text-[15px] md:text-[17px] leading-relaxed">
              Create your account, connect your store and book your first pickup today.
            </p>
          </div>
          <div className="mt-6 md:mt-0 flex flex-col sm:flex-row items-center justify-center gap-3 shrink-0">
            <Link to="/#signup" className="w-full sm:w-auto h-12 px-7 rounded-full bg-white text-[#00A86B] text-[15px] font-bold inline-flex items-center justify-center gap-2 shadow-[0_10px_24px_-10px_rgba(0,0,0,0.35)] hover:bg-[#F0FAF5] transition-colors">
              Sign up free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/rate-calculator" className="w-full sm:w-auto h-12 px-7 rounded-full border border-white/50 text-white text-[15px] font-semibold inline-flex items-center justify-center hover:bg-white/10 transition-colors">
              Calculate rates
            </Link>
          </div>
        </div>

        {/* Road with the cycle towing the ribbon */}
        <div className="relative mt-8 md:mt-10 h-[150px] md:h-[190px]">
          <div className="absolute left-0 right-0 bottom-[22px] md:bottom-[28px] h-[3px] bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.7)_0_14px,transparent_14px_24px)]" />
          {/* The ride is a plain CSS transform loop: a track-wide layer slides from fully left of the band to
              fully right, carrying the cycle at its right edge. Runs on every device, including phones with
              battery saver (which reports reduced motion). */}
          <style>{`@keyframes qp-cta-ride { from { transform: translate3d(-100%,0,0) } to { transform: translate3d(100%,0,0) } }`}</style>
          <div className="absolute inset-0 pointer-events-none will-change-transform" style={{ animation: 'qp-cta-ride 16s linear infinite' }}>
          <div className="absolute right-0 bottom-[24px] md:bottom-[30px] flex items-end pointer-events-auto">
            {/* Ribbon */}
            <motion.div
              className="mb-[52px] md:mb-[70px] origin-right"
              animate={{ rotate: [-2, 2, -2], skewY: [-2, 2, -2] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Link
                to="/#signup"
                className="relative inline-flex items-center gap-1.5 h-9 md:h-10 pl-6 pr-4 bg-white text-[#00A86B] text-[13px] md:text-[14px] font-bold whitespace-nowrap shadow-[0_8px_18px_-8px_rgba(0,0,0,0.35)] [clip-path:polygon(0_0,100%_0,100%_100%,0_100%,12px_50%)]"
              >
                Get Started <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </motion.div>
            {/* Tow line */}
            <svg width="44" height="70" viewBox="0 0 44 70" className="mb-[34px] md:mb-[46px] -mx-px" aria-hidden="true">
              <path d="M0 18 Q 22 30 44 46" stroke="white" strokeWidth="2" strokeDasharray="3 3" fill="none" opacity="0.85" />
            </svg>
            <DottedCycle spin />
          </div>
          </div>
        </div>
      </div>
    </section>
  );
}
