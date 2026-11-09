import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Truck, Boxes, ChevronLeft, ChevronRight } from 'lucide-react';
import shopifyLogo from '../../assets/shopify-logo-tight.png';
import wooLogo from '../../assets/woo-commerce-logo.png';
import heroCourier from '../../assets/hero/hero-courier.webp';
import heroChannels from '../../assets/hero/hero-channels.webp';
import introPhoto from '../../assets/hero/hero-intro.webp';
import cargoPhoto from '../../assets/hero/hero-cargo.webp';

/* Landing page (phones) — hero carousel. Story-style: segmented progress bars that fill and auto-advance,
   swipe or tap the edges to move. Every slide is something QuickPost does today. */

const EASE = [0.16, 1, 0.3, 1] as const;
const SLIDE_MS = 8000;

/* ── Slide visuals: small, realistic product previews ─────────────────────────────── */

function CourierVisual() {
  const rows = [
    { logo: '/brands/bluedart.png', name: 'Blue Dart', eta: '1 day', price: '₹89', pick: true },
    { logo: '/brands/delhivery.png', name: 'Delhivery', eta: '2 days', price: '₹62' },
    { logo: '/brands/dtdc.png', name: 'DTDC', eta: '3 days', price: '₹58' },
  ];
  return (
    <div className="relative rounded-3xl overflow-hidden aspect-[4/3] shadow-[0_24px_48px_-24px_rgba(0,0,0,0.5)]">
      <motion.img
        src={heroCourier}
        alt="Seller packing orders with QuickPost tape"
        className="absolute inset-0 w-full h-full object-cover object-[70%_center]"
        initial={{ scale: 1.08 }} animate={{ scale: 1 }} transition={{ duration: 1.2, ease: EASE }}
      />
      {/* Courier picker floating over the calm left side of the photo */}
      <motion.div
        className="absolute left-2.5 top-2.5 w-[168px] rounded-2xl bg-white/95 backdrop-blur p-2.5 text-left shadow-[0_12px_28px_-12px_rgba(0,0,0,0.45)]"
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.25, ease: EASE }}
      >
        <div className="text-[9.5px] font-semibold text-[#64748B] uppercase tracking-wider">Best couriers · 0.5 kg</div>
        <div className="mt-1.5 space-y-1">
          {rows.map((r, i) => (
            <motion.div
              key={r.name}
              className={`flex items-center gap-1.5 rounded-lg px-1.5 py-1.5 ${r.pick ? 'bg-[#F0FDF4] ring-1 ring-[#00A86B]' : ''}`}
              initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35, delay: 0.4 + i * 0.1, ease: EASE }}
            >
              <span className={`w-3 h-3 rounded-full border-[1.5px] flex items-center justify-center shrink-0 ${r.pick ? 'border-[#00A86B] bg-[#00A86B]' : 'border-[#CBD5E1]'}`}>
                {r.pick && <Check className="w-2 h-2 text-white" strokeWidth={4} />}
              </span>
              <img src={r.logo} alt={r.name} className="h-3 w-[46px] object-contain object-left" />
              <span className="ml-auto text-[9.5px] text-[#64748B]">{r.eta}</span>
              <span className="text-[11px] font-bold text-[#0F172A] tabular-nums">{r.price}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
      <motion.span
        className="absolute left-2.5 bottom-2.5 inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-[#00A86B] text-white text-[11.5px] font-semibold shadow-md"
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.75, ease: EASE }}
      >
        <Truck className="w-3.5 h-3.5" /> Pickup booked
      </motion.span>
    </div>
  );
}

function ChannelsVisual() {
  const orders = [
    { logo: shopifyLogo, ch: 'Shopify', id: '#4021', amt: '₹1,299' },
    { logo: '/brands/amazon.svg', ch: 'Amazon', id: '#4022', amt: '₹749' },
    { logo: wooLogo, ch: 'WooCommerce', id: '#4023', amt: '₹2,150' },
    { logo: '/brands/flipkart.svg', ch: 'Flipkart', id: '#4024', amt: '₹599' },
  ];
  return (
    <div className="relative rounded-3xl overflow-hidden aspect-[4/3] shadow-[0_24px_48px_-24px_rgba(0,0,0,0.5)]">
      <motion.img
        src={heroChannels}
        alt="Seller managing store orders on a laptop"
        className="absolute inset-0 w-full h-full object-cover object-[70%_center]"
        initial={{ scale: 1.08 }} animate={{ scale: 1 }} transition={{ duration: 1.2, ease: EASE }}
      />
      {/* Orders from every channel arriving, over the calm wall on the left */}
      <motion.div
        className="absolute left-2.5 top-2.5 w-[164px] rounded-2xl bg-white/95 backdrop-blur p-2.5 text-left shadow-[0_12px_28px_-12px_rgba(0,0,0,0.45)]"
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.25, ease: EASE }}
      >
        <div className="flex items-center justify-between">
          <span className="text-[9.5px] font-semibold text-[#64748B] uppercase tracking-wider">New orders</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#00A86B] animate-pulse" />
        </div>
        <div className="mt-1.5 space-y-1">
          {orders.map((o, i) => (
            <motion.div
              key={o.id}
              className="flex items-center gap-1.5 rounded-lg px-1 py-1"
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35, delay: 0.4 + i * 0.12, ease: EASE }}
            >
              <span className="w-6 h-6 rounded-md border border-[#EEF2F6] bg-white flex items-center justify-center shrink-0">
                <img src={o.logo} alt={o.ch} className="max-w-[16px] max-h-[12px] object-contain" />
              </span>
              <span className="text-[10.5px] font-semibold text-[#0F172A]">{o.id}</span>
              <span className="ml-auto text-[10.5px] font-bold text-[#0F172A] tabular-nums">{o.amt}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
      <motion.span
        className="absolute left-2.5 bottom-2.5 inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-white text-[#0F172A] text-[11.5px] font-semibold shadow-md"
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.95, ease: EASE }}
      >
        <span className="w-4 h-4 rounded-full bg-[#00A86B] flex items-center justify-center"><Check className="w-2.5 h-2.5 text-white" strokeWidth={4} /></span>
        4 stores synced
      </motion.span>
    </div>
  );
}

function CargoVisual() {
  return (
    <div className="rounded-2xl bg-white p-3.5 text-left shadow-[0_24px_48px_-24px_rgba(0,0,0,0.45)]">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-bold text-[#0F172A]">B2B shipment</span>
        <span className="text-[10.5px] font-semibold text-[#475569] bg-[#F1F5F9] px-2 py-0.5 rounded-full">Cargo</span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[['Boxes', '12'], ['Weight', '180 kg'], ['Invoice', '₹1.4L']].map(([k, v], i) => (
          <motion.div key={k} className="rounded-xl bg-[#F8FAFC] border border-[#EEF2F6] px-2 py-2"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 + i * 0.1, ease: EASE }}>
            <div className="text-[10px] text-[#94A3B8]">{k}</div>
            <div className="text-[13.5px] font-bold text-[#0F172A] tabular-nums">{v}</div>
          </motion.div>
        ))}
      </div>
      <div className="mt-3 flex items-end gap-1.5 h-12" aria-hidden>
        {[34, 46, 28, 46, 40, 34].map((h, i) => (
          <motion.span key={i} className="flex-1 rounded-md bg-[#E6F4EC] border border-[#00A86B]/30"
            initial={{ height: 0 }} animate={{ height: h }} transition={{ duration: 0.5, delay: 0.3 + i * 0.06, ease: EASE }} />
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 text-[11.5px] text-[#475569]">
        <Boxes className="w-4 h-4 text-[#00A86B]" /> Pickup from your warehouse, delivered by surface
      </div>
    </div>
  );
}

/** Opening slide: full-bleed cover. The photo runs edge to edge (under the floating navbar), slowly zooms,
    and dissolves into the page at the bottom; the headline sits in the open sky. */
function IntroCover({ lines, sub, play }: { lines: string[][]; sub: string; play: boolean }) {
  return (
    <div className="relative -mx-5 -mt-[96px] h-[min(640px,86svh)] overflow-hidden">
      <motion.img
        src={introPhoto}
        alt="QuickPost delivery partner with a parcel"
        className="absolute inset-0 w-full h-full object-cover object-[62%_22%] [mask-image:linear-gradient(180deg,#000_0%,#000_72%,transparent_100%)]"
        initial={{ scale: 1.12, opacity: 0 }}
        animate={{ scale: play ? 1.02 : 1.06, opacity: 1 }}
        transition={{ scale: { duration: 7, ease: 'easeOut' }, opacity: { duration: 0.8 } }}
      />
      {/* Light wash behind the headline so it stays legible on any sky */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-[58%] bg-gradient-to-b from-[#F7F8F6]/85 via-[#F7F8F6]/40 to-transparent" />

      <div className="relative px-5 pt-[104px]">
        <h1 className="text-[38px] leading-[1.04] font-semibold tracking-[-0.045em] text-[#0B1220]">
          {lines.map(([verb, rest], k) => (
            <motion.span
              key={verb}
              className="block"
              initial={{ opacity: 0, y: 18, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.6, delay: 0.25 + k * 0.14, ease: EASE }}
            >
              <span className="italic font-bold text-[#00A86B]">{verb}</span> {rest}
            </motion.span>
          ))}
        </h1>
        <motion.p
          className="mt-3 text-[14.5px] leading-[1.55] text-[#334155] max-w-[230px]"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.75, ease: EASE }}
        >
          {sub}
        </motion.p>
      </div>
    </div>
  );
}

/** B2B slide: full-bleed warehouse cover, headline and actions on the open wall. */
function CargoCover({ lead, accent, sub, play }: { lead: string; accent: string; sub: string; play: boolean }) {
  return (
    <div className="relative -mx-5 -mt-[96px] h-[min(660px,88svh)] overflow-hidden">
      <motion.img
        src={cargoPhoto}
        alt="Warehouse manager tracking a QuickPost B2B consignment"
        className="absolute inset-0 w-full h-full object-cover object-[55%_28%] [mask-image:linear-gradient(180deg,#000_0%,#000_74%,transparent_100%)]"
        initial={{ scale: 1.12, opacity: 0 }}
        animate={{ scale: play ? 1.02 : 1.06, opacity: 1 }}
        transition={{ scale: { duration: 7, ease: 'easeOut' }, opacity: { duration: 0.8 } }}
      />
      <div aria-hidden className="absolute inset-x-0 top-0 h-[55%] bg-gradient-to-b from-[#F7F8F6]/80 via-[#F7F8F6]/35 to-transparent" />

      <div className="relative px-5 pt-[104px]">
        <motion.span
          className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-[#0B1220] text-white text-[11px] font-semibold tracking-[0.06em] uppercase"
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15, ease: EASE }}
        >
          <Boxes className="w-3.5 h-3.5 text-[#34D399]" /> QuickPost Cargo
        </motion.span>
        <h1 className="mt-3.5 tracking-[-0.04em]">
          <motion.span
            className="block text-[36px] leading-[1.04] font-semibold text-[#0B1220]"
            initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.55, delay: 0.25, ease: EASE }}
          >
            {lead}
          </motion.span>
          <motion.span
            className="block text-[36px] leading-[1.04] font-bold italic text-[#00A86B]"
            initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.55, delay: 0.4, ease: EASE }}
          >
            {accent}
          </motion.span>
        </h1>
        <motion.p
          className="mt-3 text-[14.5px] leading-[1.55] text-[#334155] max-w-[260px]"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.6, ease: EASE }}
        >
          {sub}
        </motion.p>
      </div>
    </div>
  );
}

const SIGNUP_PHONE_KEY = 'qp_signup_phone';

/** Lead capture (stacked, full width): label, +91 field, Get Started (tinted until the number is valid), consent line.
    A valid number prefills the signup form. */
function PhoneCapture({ onStart, onFocus, onBlur }: { onStart: () => void; onFocus: () => void; onBlur: () => void }) {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const valid = /^[6-9]\d{9}$/.test(phone);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) { setError('Enter a valid 10-digit mobile number'); return; }
    try { sessionStorage.setItem(SIGNUP_PHONE_KEY, phone); } catch { /* ignore */ }
    onStart();
  };
  return (
    <form onSubmit={submit} className="mt-5" noValidate>
      <label htmlFor="hero-phone" className="block">
        <span className="block text-[11.5px] font-semibold uppercase tracking-[0.14em] text-[#94A3B8]">Get started in 2 minutes</span>
        <span className="mt-1 block text-[21px] leading-[1.2] font-bold tracking-[-0.025em] text-[#0B1220]">
          Create your <span className="italic text-[#00A86B]">free</span> account
        </span>
      </label>
      <div className={`mt-3 flex items-center h-[54px] rounded-full bg-white border-[1.5px] transition-colors focus-within:border-[#00A86B] focus-within:shadow-[0_0_0_4px_rgba(0,168,107,0.10)] ${error ? 'border-red-400' : 'border-[#DCE3E0]'}`}>
        <span className="pl-5 pr-3 text-[15px] font-semibold text-[#0B1220] border-r border-[#DCE3E0]">+91</span>
        <input
          id="hero-phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          value={phone}
          onChange={e => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); if (error) setError(''); }}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder="Enter your phone number"
          className="flex-1 min-w-0 h-full px-3 bg-transparent text-[15px] text-[#0B1220] placeholder:text-[#94A3B8] focus:outline-none tabular-nums"
        />
        {valid && <Check className="w-5 h-5 mr-3.5 text-[#00A86B] shrink-0" strokeWidth={3} />}
      </div>
      {error && <p className="mt-1.5 pl-5 text-[12px] text-red-500">{error}</p>}
      <button
        type="submit"
        className={`mt-3 w-full h-[54px] rounded-full text-[16px] font-semibold inline-flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.99] ${
          valid
            ? 'bg-[#00A86B] text-white shadow-[0_12px_24px_-12px_rgba(0,168,107,0.9)]'
            : 'bg-[#E3F4EC] text-[#00A86B] border border-[#C9EAD9]'
        }`}
      >
        Get Started <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
      </button>
      <p className="mt-3 text-[12.5px] leading-[1.55] text-[#64748B]">
        By signing up, you agree to our{' '}
        <Link to="/privacy-policy" className="font-semibold text-[#00A86B]">Privacy Policy</Link> &{' '}
        <Link to="/terms-and-conditions" className="font-semibold text-[#00A86B]">T&C</Link>. To track your order{' '}
        <Link to="/track" className="font-semibold text-[#00A86B]">click here</Link>.
      </p>
    </form>
  );
}

const SLIDES = [
  {
    tag: 'QuickPost for sellers',
    lines: [['Ship', 'smarter.'], ['Deliver', 'faster.'], ['Grow', 'without limits.']],
    lead: '',
    accent: '',
    sub: 'One platform to compare couriers, ship across India and get paid faster.',
    Visual: () => null,
  },
  {
    tag: 'Multi-courier shipping',
    lead: 'The right courier,',
    accent: 'for every order',
    sub: 'Compare Delhivery, Blue Dart, DTDC and more — book a pickup in one tap.',
    Visual: CourierVisual,
    photo: heroCourier,
    hideTag: true,
  },
  {
    tag: 'Channel integrations',
    lead: 'Every store.',
    accent: 'One dashboard.',
    sub: 'Shopify, WooCommerce, Amazon and Flipkart orders, synced and ready to ship.',
    Visual: ChannelsVisual,
    photo: heroChannels,
    hideTag: true,
    stacked: true,
    phoneCapture: true,
  },
  {
    tag: 'QuickPost Cargo',
    lead: 'Heavy B2B loads,',
    accent: 'same dashboard',
    sub: 'Book and track multi-box B2B consignments right next to your parcels.',
    Visual: CargoVisual,
    cover: true,
  },
];

export function MobileHeroCarousel({ onStart }: { onStart: () => void }) {
  const reduced = useReducedMotion() ?? false;
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [paused, setPaused] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const go = useCallback((next: number, d?: number) => {
    setDir(d ?? (next >= index ? 1 : -1));
    setIndex((next + SLIDES.length) % SLIDES.length);
  }, [index]);

  useEffect(() => {
    if (paused) return;
    timer.current = window.setTimeout(() => go(index + 1, 1), SLIDE_MS);
    return () => window.clearTimeout(timer.current);
  }, [index, paused, go]);

  const slide = SLIDES[index];
  const isIntro = 'lines' in slide && !!slide.lines;
  const isCover = 'cover' in slide && !!slide.cover;
  const swipe = {
    drag: reduced ? false : ('x' as const),
    dragConstraints: { left: 0, right: 0 },
    dragElastic: 0.15,
    onDragStart: () => setPaused(true),
    onDragEnd: (_: unknown, info: { offset: { x: number } }) => {
      setPaused(false);
      if (info.offset.x < -50) go(index + 1, 1);
      else if (info.offset.x > 50) go(index - 1, -1);
    },
  };

  return (
    <div className="relative" style={{ fontFamily: 'Roboto, sans-serif' }}>
      <AnimatePresence mode="wait" initial={false}>
        {isIntro ? (
          <motion.div
            key="intro"
            className="touch-pan-y"
            {...swipe}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
          >
            <IntroCover lines={(slide as { lines: string[][] }).lines} sub={slide.sub} play={!paused} />
          </motion.div>
        ) : isCover ? (
          <motion.div
            key="cargo"
            className="touch-pan-y"
            {...swipe}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
          >
            <CargoCover lead={slide.lead} accent={slide.accent} sub={slide.sub} play={!paused} />
          </motion.div>
        ) : (
          <motion.div
            key="slides"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            {/* ── Copy ── */}
            <div className={'hideTag' in slide && slide.hideTag ? '' : 'min-h-[200px]'}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={index}
                  initial={reduced ? { opacity: 0 } : { opacity: 0, x: dir * 28 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduced ? { opacity: 0 } : { opacity: 0, x: dir * -28 }}
                  transition={{ duration: 0.35, ease: EASE }}
                >
                  {!('hideTag' in slide && slide.hideTag) && (
                    <span className="inline-flex items-center gap-1.5 h-7 px-3 mb-4 rounded-full bg-white border border-[#E3EAE6] text-[11.5px] font-semibold text-[#334155] shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00A86B]" /> {slide.tag}
                    </span>
                  )}
                  {'stacked' in slide && slide.stacked ? (
                    /* Two-beat headline: the problem, then the answer with a drawn underline */
                    <h1 className="tracking-[-0.04em]">
                      <motion.span
                        className="block text-[30px] leading-[1.1] font-normal text-[#475569]"
                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, delay: 0.05, ease: EASE }}
                      >
                        {slide.lead}
                      </motion.span>
                      <motion.span
                        className="relative inline-block mt-0.5 text-[42px] leading-[1.02] font-bold text-[#0B1220]"
                        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.18, ease: EASE }}
                      >
                        {slide.accent.replace(/\.$/, '')}<span className="text-[#00A86B]">.</span>
                        <svg className="absolute left-0 -bottom-2 w-full h-3" viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden>
                          <motion.path
                            d="M3 8 C 50 2, 120 2, 197 6"
                            fill="none" stroke="#00A86B" strokeWidth="4" strokeLinecap="round"
                            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                            transition={{ duration: 0.7, delay: 0.55, ease: EASE }}
                          />
                        </svg>
                      </motion.span>
                    </h1>
                  ) : (
                    <h1 className="text-[34px] leading-[1.08] font-medium tracking-[-0.035em] text-[#0B1220]">
                      {slide.lead}{' '}
                      <span className="font-semibold text-[#00A86B]">{slide.accent}</span>
                    </h1>
                  )}
                  <p className="mt-3 text-[15px] leading-[1.55] text-[#5B6472] max-w-[330px]">{slide.sub}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* ── Actions ── */}
            {'phoneCapture' in slide && slide.phoneCapture ? (
              <PhoneCapture onStart={onStart} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)} />
            ) : (
              <div className={`${'hideTag' in slide && slide.hideTag ? 'mt-4' : 'mt-5'} flex items-center gap-5`}>
                <button
                  type="button"
                  onClick={onStart}
                  className="group h-12 px-6 rounded-full bg-[#00A86B] hover:bg-[#009B63] text-white text-[15px] font-semibold tracking-[-0.01em] inline-flex items-center gap-2 shadow-[0_1px_2px_rgba(15,23,42,0.12)] active:scale-[0.98] transition-[transform,background-color] duration-150"
                >
                  Sign up for free
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1 group-active:translate-x-1" strokeWidth={2.5} />
                </button>
                <Link to="/track" className="group relative inline-flex items-center gap-0.5 text-[15px] font-semibold text-[#0B1220]">
                  Track an order
                  <ChevronRight className="w-4 h-4 text-[#00A86B] transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={2.5} />
                  <span aria-hidden className="absolute left-0 right-5 -bottom-1 h-[1.5px] bg-[#0B1220] origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100 group-active:scale-x-100" />
                </Link>
              </div>
            )}

            {'photo' in slide && slide.photo ? (
              /* ── Photo slide: bleeds to the screen edges and melts into the page, no frame ── */
              <motion.div className="relative -mx-5 mt-6 aspect-[4/3] overflow-hidden touch-pan-y" {...swipe}>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.img
                    key={index}
                    src={slide.photo}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover object-[64%_center] [mask-image:linear-gradient(180deg,transparent_0%,#000_14%,#000_80%,transparent_100%)]"
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: paused ? 1.04 : 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ opacity: { duration: 0.6 }, scale: { duration: 6, ease: 'easeOut' } }}
                  />
                </AnimatePresence>
                {/* side fades so the photo has no hard left/right edge either */}
                <div aria-hidden className="absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-[#F7F8F6] to-transparent" />
                <div aria-hidden className="absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-[#F7F8F6] to-transparent" />
              </motion.div>
            ) : (
            /* ── Visual stage ── */
            <motion.div
              className="mt-8 rounded-[28px] p-2.5 bg-[linear-gradient(140deg,#E7F6EE_0%,#F7F3E8_55%,#FBE9DC_100%)] ring-1 ring-white shadow-[0_30px_60px_-34px_rgba(15,23,42,0.45)] touch-pan-y"
              {...swipe}
            >
              <div className="relative aspect-[4/3]">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={index}
                    className="absolute inset-0 flex items-center"
                    initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.35, ease: EASE }}
                  >
                    <div className="w-full"><slide.Visual /></div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Controls: arrows + filling progress ── */}
      <div className={`flex items-center gap-3 ${isIntro || isCover ? '-mt-14 relative' : 'mt-5'}`}>
        <button type="button" onClick={() => go(index - 1, -1)} aria-label="Previous"
          className="w-11 h-11 rounded-full bg-white border border-[#E3EAE6] text-[#0B1220] flex items-center justify-center shadow-[0_4px_12px_-6px_rgba(15,23,42,0.25)] active:scale-95 transition-transform shrink-0">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 flex items-center gap-1.5" role="tablist" aria-label="Highlights">
          {SLIDES.map((s, i) => (
            <button key={s.tag} type="button" role="tab" aria-selected={i === index} aria-label={s.tag}
              onClick={() => go(i)} className="flex-1 h-6 flex items-center">
              <span className="relative w-full h-[4px] rounded-full bg-[#D9E3DE] overflow-hidden">
                {i < index && <span className="absolute inset-0 bg-[#0B1220]" />}
                {i === index && (
                  <motion.span
                    key={`${index}-${paused}`}
                    className="absolute inset-y-0 left-0 rounded-full bg-[#00A86B]"
                    initial={{ width: paused ? '100%' : '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: paused ? 0 : SLIDE_MS / 1000, ease: 'linear' }}
                  />
                )}
              </span>
            </button>
          ))}
        </div>
        <button type="button" onClick={() => go(index + 1, 1)} aria-label="Next"
          className="w-11 h-11 rounded-full bg-white border border-[#E3EAE6] text-[#0B1220] flex items-center justify-center shadow-[0_4px_12px_-6px_rgba(15,23,42,0.25)] active:scale-95 transition-transform shrink-0">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
