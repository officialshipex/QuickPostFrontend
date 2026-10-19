import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { LogisticsCharacter } from './LogisticsCharacter';
import { ShineButton } from '../ui/ShineButton';
import type { SellerOffer } from '../../config/offers';
import { openRechargePopup } from '../../utils/walletEvents';

/* Seller-dashboard promo. Two associates stand holding flag poles; only the flag moves:
   a rolled-up flag leaves the first associate's pole and unrolls across the banner until the second associate's
   pole catches the far end. The open flag then ripples like fabric (both ends pinned to the poles) and the offer
   copy staggers in. Plays once when the banner scrolls into view; prefers-reduced-motion shows the final state. */

const EASE = [0.22, 1, 0.36, 1] as const;
const UNROLL = [0.45, 0.05, 0.25, 1] as const; // starts with a push, slows as it reaches the far pole
const APPEAR = 0.45;
const FLAG_DELAY = 0.6;
const FLAG_DURATION = 1.7;
const SETTLE = FLAG_DELAY + FLAG_DURATION;
const COPY_DELAY = SETTLE + 0.1;

// Flag silhouettes in a 1000×120 box. Every shape keeps both pole edges (x=0, x=1000) fixed so the cloth
// stays attached; the free middle billows. Identical commands so the outline can morph smoothly.
const W0 = 'M0 4 C 220 4, 380 6, 500 6 S 800 4, 1000 4 L 1000 116 C 800 117, 640 118, 500 117 S 220 116, 0 116 Z';
const W1 = 'M0 4 C 220 -3, 380 13, 500 6 S 800 -1, 1000 4 L 1000 116 C 800 121, 640 108, 500 114 S 220 123, 0 116 Z';
const W2 = 'M0 4 C 220 11, 380 -1, 500 8 S 800 12, 1000 4 L 1000 116 C 800 110, 640 123, 500 117 S 220 108, 0 116 Z';
const WAVE = [W0, W1, W0, W2, W0];

function Parcel() {
  return (
    <svg viewBox="0 0 48 48" className="w-11 h-11 shrink-0" aria-hidden>
      <path d="M24 5 L42 14 L24 23 L6 14 Z" fill="#4ADE80" />
      <path d="M6 14 L24 23 L24 43 L6 34 Z" fill="#00A86B" />
      <path d="M24 23 L42 14 L42 34 L24 43 Z" fill="#0F6B38" />
      <path d="M15 9.5 L33 18.5 L33 24 L29 22 L29 20.5 L11 11.5 Z" fill="#FFFFFF" opacity="0.85" />
    </svg>
  );
}

export function OfferFlagBanner({ offer, className = '' }: { offer: SellerOffer; className?: string }) {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const reduced = useReducedMotion() ?? false;
  const play = inView || reduced;
  const animate = !reduced;

  const go = () => {
    if (offer.rechargeAmount) openRechargePopup(offer.rechargeAmount);
    else if (/^https?:\/\//.test(offer.ctaHref)) window.open(offer.ctaHref, '_blank', 'noopener,noreferrer');
    else navigate(offer.ctaHref);
  };

  const copy = (i: number) => ({
    initial: animate ? { opacity: 0, y: 8 } : false,
    animate: play ? { opacity: 1, y: 0 } : undefined,
    transition: { duration: 0.5, delay: COPY_DELAY + i * 0.14, ease: EASE },
  } as const);

  const appear = (delay: number) => ({
    initial: animate ? { opacity: 0, y: 6 } : false,
    animate: play ? { opacity: 1, y: 0 } : undefined,
    transition: { duration: APPEAR, delay, ease: EASE },
  } as const);

  // "Recharge ₹5,000" → lead "Recharge " + amount "₹5,000" (amount highlighted in brand green)
  const amountAt = offer.offer.indexOf('₹');
  const offerParts = amountAt > 0
    ? { lead: offer.offer.slice(0, amountAt), amount: offer.offer.slice(amountAt) }
    : { lead: offer.offer, amount: '' };

  // Bold the rupee amounts in the benefit line ("Get up to ₹10,000 cashback").
  const benefitParts = offer.benefit.split(/(₹[\d,]+)/);

  const waving = animate && play;
  const waveTransition = { duration: 6.5, delay: SETTLE, repeat: Infinity, ease: 'easeInOut' } as const;

  return (
    <section ref={ref} aria-label={offer.heading}
      className={`relative h-[176px] rounded-2xl border border-[#E2E8F0] bg-white overflow-hidden shadow-[0_1px_2px_rgba(16,24,40,0.04),0_2px_8px_rgba(16,24,40,0.05)] ${className}`}>
      {/* Subtle backdrop: dotted corner, ground line */}
      <span aria-hidden className="absolute -right-10 -top-10 w-56 h-56 rounded-full bg-[#00A86B]/[0.06]" />
      <span aria-hidden className="absolute left-1/3 -bottom-16 w-72 h-32 rounded-full bg-[#00A86B]/[0.05] blur-2xl" />
      <span aria-hidden className="absolute right-40 top-3 w-24 h-10 opacity-60 [background-image:radial-gradient(#00A86B_1px,transparent_1px)] [background-size:8px_8px] [mask-image:linear-gradient(to_left,black,transparent)]" />
      <span aria-hidden className="absolute inset-x-6 bottom-[13px] border-t-2 border-dashed border-[#E2E8F0]" />

      {/* Associates — standing in place */}
      <motion.div className="absolute left-6 bottom-2 w-[84px] h-[159px] z-20" {...appear(0)}>
        <LogisticsCharacter variant="a" className="w-full h-full" />
      </motion.div>
      <motion.div className="absolute right-6 bottom-2 w-[84px] h-[159px] z-20" {...appear(0.12)}>
        <LogisticsCharacter variant="b" flip className="w-full h-full" />
      </motion.div>

      {/* Flag between the two poles */}
      <div className="absolute left-[97px] right-[97px] top-[12px] h-[108px] z-10">
        <svg viewBox="0 0 1000 120" preserveAspectRatio="none" className="absolute inset-0 w-full h-full overflow-visible drop-shadow-[0_2px_3px_rgba(15,23,42,0.08)]" aria-hidden>
          <defs>
            {/* Unroll mask: grows from the first pole to the second */}
            <clipPath id="qp-flag-unroll">
              <motion.rect x="0" y="-20" height="160"
                initial={animate ? { width: 0 } : false} animate={play ? { width: 1000 } : undefined}
                transition={{ duration: FLAG_DURATION, delay: FLAG_DELAY, ease: UNROLL }} />
            </clipPath>
            <clipPath id="qp-flag-shape">
              <motion.path d={W0} animate={waving ? { d: WAVE } : undefined} transition={waveTransition} />
            </clipPath>
            {/* One soft fold: matte fabric — a faint shadow only, no highlight/shine */}
            <linearGradient id="qp-flag-fold" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#0B1F2A" stopOpacity="0" />
              <stop offset="0.45" stopColor="#0B1F2A" stopOpacity="0.035" />
              <stop offset="1" stopColor="#0B1F2A" stopOpacity="0" />
            </linearGradient>
          </defs>

          <g clipPath="url(#qp-flag-unroll)">
            <g clipPath="url(#qp-flag-shape)">
              <rect width="1000" height="120" fill="#FFFFFF" />
              <rect width="1000" height="15" fill="#00A86B" />
              <rect y="105" width="1000" height="15" fill="#00A86B" />
              {/* Stitched hems */}
              <path d="M12 19.5 H988 M12 100.5 H988" stroke="#00A86B" strokeOpacity="0.45" strokeWidth="1" strokeDasharray="5 4" vectorEffect="non-scaling-stroke" />
              {/* Travelling folds — soft light/shadow bands drifting across the fabric */}
              <motion.g animate={waving ? { x: [0, -250] } : undefined}
                transition={{ duration: 4.5, delay: SETTLE, repeat: Infinity, ease: 'linear' }}>
                {Array.from({ length: 6 }).map((_, i) => <rect key={i} x={i * 250} width="250" height="120" fill="url(#qp-flag-fold)" />)}
              </motion.g>
              {/* Pole sleeves */}
              <rect width="10" height="120" fill="#0F6B38" />
              <rect x="990" width="10" height="120" fill="#0F6B38" />
            </g>
            <motion.path d={W0} fill="none" stroke="#0F6B38" strokeOpacity="0.18" strokeWidth="1" vectorEffect="non-scaling-stroke"
              animate={waving ? { d: WAVE } : undefined} transition={waveTransition} />
          </g>
        </svg>

        {/* The rolled part of the flag, travelling ahead of the unrolled cloth; it unwinds onto the far pole */}
        {animate && (
          <motion.div aria-hidden className="absolute top-[2px] bottom-[2px] w-[14px] -ml-[7px] rounded-full overflow-hidden shadow-[1px_2px_3px_rgba(15,23,42,0.12)]"
            style={{ background: 'linear-gradient(90deg, #F1F5F3 0%, #FFFFFF 40%, #F1F5F3 75%, #E2E8E4 100%)' }}
            initial={{ left: '0%', opacity: 0, scaleX: 1 }}
            animate={play ? { left: '100%', opacity: [0, 1, 1, 0], scaleX: 0.45 } : undefined}
            transition={{
              // Same timing as the unroll mask, so the roll always sits at the cloth's leading edge…
              left: { duration: FLAG_DURATION, delay: FLAG_DELAY, ease: UNROLL },
              // …and it thins as the fabric unwinds off it.
              scaleX: { duration: FLAG_DURATION, delay: FLAG_DELAY, ease: UNROLL },
              opacity: { duration: FLAG_DURATION + 0.4, delay: FLAG_DELAY - 0.15, times: [0, 0.1, 0.86, 1] },
            }}>
            <span className="absolute inset-x-0 top-0 h-[15%] bg-[#00A86B]" />
            <span className="absolute inset-x-0 bottom-0 h-[15%] bg-[#00A86B]" />
            <span className="absolute inset-y-0 left-1/2 w-px bg-[#0F6B38]/25" />
          </motion.div>
        )}

        {/* Offer copy — real text, selectable */}
        {/* Three zones spread across the flag: offer · cashback · action */}
        <div className="relative h-full grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto] items-center px-8 xl:px-14">
          {/* 1 — what to do */}
          <div className="flex items-center justify-center gap-4 min-w-0">
            <motion.div {...copy(0)}><Parcel /></motion.div>
            <div className="min-w-0">
              <motion.p {...copy(0)} className="text-[13px] font-medium text-[#64748B]">{offer.heading}</motion.p>
              <motion.p {...copy(1)} className="mt-0.5 text-[24px] xl:text-[28px] font-bold tracking-[-0.02em] text-[#0F172A] leading-[1.15] truncate">
                {offerParts.lead}{offerParts.amount && <span className="text-[#00A86B]">{offerParts.amount}</span>}
              </motion.p>
            </div>
          </div>

          <motion.span {...copy(1)} aria-hidden className="w-px h-12 bg-[#E2E8F0]" />

          {/* 2 — what you get */}
          <motion.div {...copy(2)} className="min-w-0 text-center px-4">
            <p className="text-[13px] font-medium text-[#64748B]">Cashback</p>
            <p className="mt-0.5 text-[18px] xl:text-[20px] text-[#334155] leading-[1.2] truncate">
              {benefitParts.map((part, i) => (/^₹[\d,]+$/.test(part) ? <strong key={i} className="font-bold text-[#0F172A]">{part}</strong> : part))}
            </p>
            <p className="mt-0.5 text-[11.5px] text-[#94A3B8]">*T&amp;C apply</p>
          </motion.div>

          {/* 3 — action */}
          <motion.div {...copy(3)} className="shrink-0 pl-6 xl:pl-8 border-l border-[#E2E8F0] h-12 flex items-center">
            <ShineButton type="button" onClick={go}
              className="h-11 px-6 rounded-full bg-gradient-to-r from-[#00A86B] to-[#0F6B38] text-white text-[13.5px] font-bold inline-flex items-center gap-2 shadow-[0_10px_22px_-10px_rgba(0,168,107,0.8)] hover:-translate-y-px transition-transform">
              <span className="relative">{offer.ctaLabel}</span>
              <ArrowRight className="relative w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </ShineButton>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
