import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Boxes, HandCoins, MapPinned, Route, ShieldCheck, Sparkles, Truck } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

/* About Us — public page (desktop + mobile).
   Facts used: formerly Shipex India, 6 years in shipping, 25,000+ sellers served. Keep claims to these. */

const EASE = [0.16, 1, 0.3, 1] as const;
const fade = (d = 0) => ({
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.3 },
  transition: { duration: 0.6, ease: EASE, delay: d },
});

const JOURNEY = [
  { tag: 'Where we started', title: 'Shipex India', body: 'We began as Shipex India, helping small online sellers book shipments without juggling courier accounts, rate cards and paperwork.' },
  { tag: '6 years of shipping', title: 'Built with sellers', body: 'Year after year we listened to sellers — about pickups, COD, returns and weight disputes — and turned those conversations into product.' },
  { tag: 'Today', title: 'QuickPost', body: 'Shipex India is now QuickPost: one platform to compare couriers, ship, track and get COD paid — for D2C brands, marketplace sellers and businesses moving freight.' },
];

const WHAT_WE_DO = [
  { icon: Route, title: 'Multi-courier shipping', body: 'Compare leading courier partners and book the right one for every order.' },
  { icon: HandCoins, title: 'COD, handled', body: 'Cash-on-delivery collection and remittance tracked in one place.' },
  { icon: MapPinned, title: 'Tracking that customers trust', body: 'Live status from pickup to doorstep for you and your buyers.' },
  { icon: Boxes, title: 'Cargo for bigger loads', body: 'B2B freight for multi-box consignments, booked and tracked the same way.' },
];

const BELIEFS = [
  { word: 'Simplicity', line: 'Shipping should take minutes, not a morning.' },
  { word: 'Honesty', line: 'Clear rates, clear charges — no surprises on the invoice.' },
  { word: 'Reliability', line: 'Every parcel carries a promise someone made to a customer.' },
  { word: 'Partnership', line: 'When our sellers grow, we grow. That is the whole plan.' },
];

export function About() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-[#0F172A] selection:bg-[#00A86B]/20 selection:text-[#00A86B]" style={{ fontFamily: 'Roboto, sans-serif' }}>
      <Navbar alwaysFloating />

      <main className="flex-1">
        {/* ── Hero ─────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-[#F8FAFC] pt-[110px] pb-16 md:pt-[150px] md:pb-24">
          <div aria-hidden className="absolute inset-0 opacity-50 [background-image:radial-gradient(#CBD5E1_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
          <div aria-hidden className="absolute -top-28 -left-24 w-[420px] h-[420px] rounded-full bg-[#00A86B]/[0.07] blur-3xl" />

          <div className="relative max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-10 text-center">
            <motion.span {...fade()} className="inline-flex items-center gap-2 h-8 px-3.5 rounded-full bg-white border border-[#E2E8F0] text-[12.5px] font-semibold text-[#047857]">
              <Sparkles className="w-4 h-4" /> About QuickPost
            </motion.span>
            <motion.h1 {...fade(0.05)} className="mt-5 text-[34px] sm:text-[46px] lg:text-[58px] font-bold leading-[1.06] tracking-[-0.025em]">
              Six years of moving parcels<br className="hidden sm:block" /> for <span className="text-[#00A86B]">India’s sellers</span>
            </motion.h1>
            <motion.p {...fade(0.1)} className="mt-5 text-[16px] md:text-[18px] text-[#475569] leading-relaxed max-w-[720px] mx-auto">
              We started as <b className="text-[#0F172A] font-semibold">Shipex India</b>. Today we are <b className="text-[#0F172A] font-semibold">QuickPost</b> — the same team,
              the same promise, built into a sharper platform for everyone who ships.
            </motion.p>

            {/* Proof */}
            <motion.div {...fade(0.15)} className="mt-10 grid grid-cols-2 max-w-[560px] mx-auto rounded-[24px] bg-white border border-[#EEF2F6] shadow-[0_20px_50px_-30px_rgba(15,23,42,0.3)] divide-x divide-[#EEF2F6]">
              {[
                { k: '6+', v: 'years in shipping' },
                { k: '25,000+', v: 'sellers served' },
              ].map(st => (
                <div key={st.v} className="px-4 py-6 sm:py-7">
                  <div className="text-[34px] sm:text-[44px] font-bold tracking-[-0.03em] text-[#0F172A] leading-none tabular-nums">{st.k}</div>
                  <div className="mt-2 text-[13px] sm:text-[14px] text-[#64748B]">{st.v}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── Story ─────────────────────────────────────────── */}
        <section className="py-16 md:py-24">
          <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-10 lg:gap-16">
            <motion.div {...fade()}>
              <div className="text-[12.5px] font-bold uppercase tracking-[0.14em] text-[#00A86B]">Our story</div>
              <h2 className="mt-3 text-[28px] md:text-[38px] font-bold leading-[1.12] tracking-[-0.02em]">From Shipex India<br />to QuickPost</h2>
              <p className="mt-4 text-[15.5px] text-[#475569] leading-relaxed">
                For six years we have sat on the other side of the counter from India’s online sellers — the home bakers, the
                fashion labels, the electronics stores and the growing D2C brands. More than 25,000 of them have shipped with us.
              </p>
              <p className="mt-4 text-[15.5px] text-[#475569] leading-relaxed">
                The new name reflects what we have become: faster, simpler and ready for sellers at every size — from the first parcel to full truckloads.
              </p>
            </motion.div>

            <ol className="relative">
              <span aria-hidden className="absolute left-[19px] top-2 bottom-2 w-[2px] bg-gradient-to-b from-[#00A86B] via-[#00A86B]/40 to-[#E2E8F0]" />
              {JOURNEY.map((j, i) => (
                <motion.li key={j.title} {...fade(0.08 * i)} className="relative pl-14 pb-8 last:pb-0">
                  <span className={`absolute left-0 top-0 w-10 h-10 rounded-full flex items-center justify-center ring-4 ring-white ${i === JOURNEY.length - 1 ? 'bg-[#00A86B] text-white' : 'bg-[#ECFDF5] text-[#00A86B]'}`}>
                    {i === JOURNEY.length - 1 ? <Truck className="w-[18px] h-[18px]" /> : <span className="text-[13px] font-bold">{i + 1}</span>}
                  </span>
                  <div className="text-[12px] font-semibold uppercase tracking-wide text-[#94A3B8]">{j.tag}</div>
                  <h3 className="mt-1 text-[20px] font-bold text-[#0F172A]">{j.title}</h3>
                  <p className="mt-1.5 text-[15px] text-[#475569] leading-relaxed">{j.body}</p>
                </motion.li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── What we do ─────────────────────────────────────── */}
        <section className="py-16 md:py-20 bg-[#F8FAFC]">
          <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-10">
            <motion.div {...fade()} className="max-w-[620px]">
              <div className="text-[12.5px] font-bold uppercase tracking-[0.14em] text-[#00A86B]">What we do</div>
              <h2 className="mt-3 text-[28px] md:text-[38px] font-bold leading-[1.12] tracking-[-0.02em]">Everything after “order placed”</h2>
            </motion.div>
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {WHAT_WE_DO.map((w, i) => (
                <motion.div key={w.title} {...fade(0.06 * i)}
                  className="rounded-[22px] bg-white border border-[#EEF2F6] p-6 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.3)] hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-24px_rgba(15,23,42,0.35)] transition-all">
                  <span className="w-11 h-11 rounded-2xl bg-[#ECFDF5] flex items-center justify-center"><w.icon className="w-5 h-5 text-[#00A86B]" /></span>
                  <h3 className="mt-4 text-[17px] font-bold text-[#0F172A]">{w.title}</h3>
                  <p className="mt-1.5 text-[14.5px] text-[#64748B] leading-relaxed">{w.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── We believe in ─────────────────────────────────── */}
        <section className="relative overflow-hidden py-20 md:py-28 bg-[#0A0F0D] text-white">
          <div aria-hidden className="absolute -bottom-40 -right-32 w-[520px] h-[520px] rounded-full bg-[#00A86B]/20 blur-[120px]" />
          <div className="relative max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-10">
            <motion.div {...fade()} className="flex items-center gap-3 text-[#34D399]">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-[13px] font-bold uppercase tracking-[0.18em]">We believe in</span>
            </motion.div>
            <ul className="mt-8 divide-y divide-white/10 border-y border-white/10">
              {BELIEFS.map((b, i) => (
                <motion.li key={b.word} {...fade(0.06 * i)} className="group py-6 md:py-8 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-2 md:gap-10 items-baseline">
                  <span className="text-[40px] sm:text-[56px] lg:text-[72px] font-bold tracking-[-0.035em] leading-none text-white/90 group-hover:text-[#34D399] transition-colors">
                    {b.word}<span className="text-[#00A86B]">.</span>
                  </span>
                  <span className="text-[16px] md:text-[19px] text-white/65 leading-relaxed">{b.line}</span>
                </motion.li>
              ))}
            </ul>
            <motion.p {...fade(0.1)} className="mt-12 max-w-[760px] text-[20px] md:text-[26px] font-medium leading-[1.45] text-white/85 tracking-[-0.01em]">
              Behind every shipment is a seller who made a promise to a customer.
              <span className="text-[#34D399]"> Our job is to help them keep it.</span>
            </motion.p>
            <motion.div {...fade(0.15)} className="mt-10 flex flex-wrap gap-3">
              <Link to="/register" className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-[#00A86B] hover:bg-[#00965F] text-white text-[15px] font-bold transition-colors">
                Start shipping <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/contact-us" className="inline-flex items-center gap-2 h-12 px-6 rounded-full border border-white/20 hover:border-white/50 text-white text-[15px] font-semibold transition-colors">
                Talk to us
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
