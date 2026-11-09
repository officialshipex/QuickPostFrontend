import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Palette, Gauge, Wallet, ShieldCheck } from 'lucide-react';

/* Landing page — Value Added Services, shown after "How it works".
   Each card pairs a short pitch with a small product preview of what the seller actually gets. */

const EASE = [0.16, 1, 0.3, 1] as const;
const inView = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.6, delay, ease: EASE },
});

/** Branded tracking page: the buyer's tracking screen on a phone, in the seller's branding. */
function TrackingPreview() {
  const steps = [
    { label: 'Order placed', time: 'Mon, 10:42 AM' },
    { label: 'Shipped from Jaipur', time: 'Mon, 6:15 PM' },
    { label: 'Out for delivery', time: 'Today, 9:05 AM' },
    { label: 'Delivered', time: 'Expected by 7 PM' },
  ];
  const current = 2;
  return (
    <div className="mx-auto w-[236px] rounded-[34px] bg-[#0F172A] p-[7px] shadow-[0_30px_60px_-28px_rgba(15,23,42,0.6)]">
      <div className="relative rounded-[28px] bg-white overflow-hidden">
        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-16 h-4 rounded-full bg-[#0F172A] z-10" />
        {/* Brand header */}
        <div className="bg-[#1F2937] text-white px-4 pt-8 pb-4">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-extrabold tracking-wide">URBAN<span className="text-[#FBBF24]">KART</span></span>
            <span className="text-[9px] text-white/60">Help</span>
          </div>
          <div className="mt-3 text-[10px] text-white/60">Arriving</div>
          <div className="text-[17px] font-bold leading-tight">Today by 7 PM</div>
          <div className="mt-2.5 h-1.5 rounded-full bg-white/15 overflow-hidden">
            <motion.div className="h-full rounded-full bg-[#FBBF24]" initial={{ width: 0 }} whileInView={{ width: '75%' }} viewport={{ once: true }} transition={{ duration: 1.1, delay: 0.3, ease: EASE }} />
          </div>
        </div>
        {/* Shipment */}
        <div className="px-4 py-3 border-b border-[#F1F5F9] flex items-center justify-between">
          <div>
            <div className="text-[9px] text-[#94A3B8] uppercase tracking-wider">AWB</div>
            <div className="text-[11px] font-semibold text-[#0F172A] tabular-nums">2841 7730 9915</div>
          </div>
          <img src="/brands/delhivery.png" alt="Delhivery" className="h-3.5 w-auto object-contain" />
        </div>
        {/* Timeline */}
        <div className="px-4 py-3">
          {steps.map((st, k) => (
            <motion.div
              key={st.label}
              className="relative flex gap-2.5 pb-2.5 last:pb-0"
              initial={{ opacity: 0, y: 6 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.35, delay: 0.4 + k * 0.12, ease: EASE }}
            >
              {k < steps.length - 1 && <span className={`absolute left-[5px] top-3 bottom-0 w-[2px] ${k < current ? 'bg-[#1F2937]' : 'bg-[#E2E8F0]'}`} />}
              <span className={`relative mt-0.5 w-3 h-3 rounded-full shrink-0 ${k < current ? 'bg-[#1F2937]' : k === current ? 'bg-[#FBBF24] ring-4 ring-[#FBBF24]/25' : 'bg-white border-2 border-[#E2E8F0]'}`} />
              <div className="min-w-0">
                <div className={`text-[11px] leading-tight ${k === current ? 'font-bold text-[#0F172A]' : k < current ? 'text-[#334155]' : 'text-[#94A3B8]'}`}>{st.label}</div>
                <div className="text-[9.5px] text-[#94A3B8]">{st.time}</div>
              </div>
            </motion.div>
          ))}
        </div>
        {/* Seller banner */}
        <div className="mx-3 mb-3 rounded-xl bg-[#FEF3C7] px-3 py-2.5 flex items-center justify-between">
          <div>
            <div className="text-[10.5px] font-bold text-[#78350F]">Flat 15% off</div>
            <div className="text-[9px] text-[#92400E]">on your next order</div>
          </div>
          <span className="text-[9.5px] font-semibold bg-[#1F2937] text-white px-2.5 py-1 rounded-full">Shop now</span>
        </div>
      </div>
    </div>
  );
}

/** RTO score: overall score on a risk bar, plus the signals behind it, each with its own bar. */
function RtoPreview() {
  const score = 28; // out of 100, lower is safer
  const signals = [
    { k: 'Address quality', v: 92, label: 'Complete', tone: '#00A86B' },
    { k: 'Pincode delivery rate', v: 86, label: '86%', tone: '#00A86B' },
    { k: 'Buyer history', v: 100, label: '3 of 3 delivered', tone: '#00A86B' },
    { k: 'Order value (COD)', v: 55, label: '₹2,499', tone: '#F59E0B' },
  ];
  return (
    <div className="rounded-2xl bg-white border border-[#E2E8F0] p-4 shadow-[0_24px_48px_-28px_rgba(15,23,42,0.45)]">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider">Order #QP10482 · COD</div>
          <div className="text-[12.5px] font-semibold text-[#0F172A]">Priya S. · Pune 411014</div>
        </div>
        <span className="text-[10px] font-bold text-[#00A86B] bg-[#F0FDF4] border border-[#00A86B]/20 px-2 py-0.5 rounded-full">Low risk</span>
      </div>

      {/* Score + risk bar */}
      <div className="mt-4 flex items-end gap-2">
        <span className="text-[32px] font-extrabold text-[#0F172A] leading-none tabular-nums">{score}</span>
        <span className="text-[11px] text-[#94A3B8] mb-1">/ 100 RTO risk</span>
      </div>
      <div className="relative mt-2.5">
        <div className="h-2.5 rounded-full overflow-hidden flex">
          <span className="flex-[40] bg-[#00A86B]" />
          <span className="flex-[30] bg-[#F59E0B]" />
          <span className="flex-[30] bg-[#EF4444]" />
        </div>
        <motion.span
          className="absolute -top-1 w-1 h-[18px] rounded-full bg-[#0F172A] ring-2 ring-white"
          initial={{ left: '0%' }} whileInView={{ left: `${score}%` }} viewport={{ once: true }}
          transition={{ duration: 1.1, delay: 0.3, ease: EASE }}
        />
        <div className="mt-1.5 flex justify-between text-[9.5px] text-[#94A3B8]"><span>Low</span><span>Medium</span><span>High</span></div>
      </div>

      {/* Signals */}
      <ul className="mt-3 space-y-2.5">
        {signals.map((sg, k) => (
          <li key={sg.k}>
            <div className="flex items-center justify-between text-[11.5px]">
              <span className="text-[#475569]">{sg.k}</span>
              <span className="font-semibold text-[#0F172A]">{sg.label}</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-[#F1F5F9] overflow-hidden">
              <motion.div
                className="h-full rounded-full" style={{ backgroundColor: sg.tone }}
                initial={{ width: 0 }} whileInView={{ width: `${sg.v}%` }} viewport={{ once: true }}
                transition={{ duration: 0.9, delay: 0.5 + k * 0.12, ease: EASE }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Seller remittance: next payout and the recent COD credits to the seller's bank. */
function RemittancePreview() {
  const rows = [
    { date: '08 Nov', orders: 12, utr: 'UTR 4021 8817 3302', amt: '₹18,420' },
    { date: '06 Nov', orders: 9, utr: 'UTR 4019 2276 0145', amt: '₹12,760' },
    { date: '04 Nov', orders: 15, utr: 'UTR 4017 5530 8861', amt: '₹21,305' },
  ];
  return (
    <div className="rounded-2xl bg-white border border-[#E2E8F0] overflow-hidden shadow-[0_24px_48px_-28px_rgba(15,23,42,0.45)]">
      <div className="bg-[#0F172A] text-white p-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">Next COD payout</span>
          <span className="inline-flex items-center gap-1 text-[10px] text-white/80"><ShieldCheck className="w-3 h-3 text-[#34D399]" /> HDFC Bank ••4821</span>
        </div>
        <div className="mt-1 flex items-end justify-between">
          <span className="text-[26px] font-extrabold leading-none tabular-nums">₹24,860</span>
          <span className="text-[11px] text-white/70">Tomorrow · 14 orders</span>
        </div>
        <div className="mt-3 h-1.5 rounded-full bg-white/15 overflow-hidden">
          <motion.div className="h-full rounded-full bg-[#34D399]" initial={{ width: 0 }} whileInView={{ width: '82%' }} viewport={{ once: true }} transition={{ duration: 1.1, delay: 0.3, ease: EASE }} />
        </div>
        <div className="mt-1.5 text-[9.5px] text-white/50">Delivery confirmed for 14 of 17 orders in this cycle</div>
      </div>
      <ul className="divide-y divide-[#F1F5F9] px-4">
        {rows.map((r, k) => (
          <motion.li
            key={r.utr}
            className="py-2.5 flex items-center justify-between gap-2"
            initial={{ opacity: 0, y: 6 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.35, delay: 0.5 + k * 0.12, ease: EASE }}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-8 h-8 rounded-lg bg-[#F0FDF4] text-[#00A86B] text-[9.5px] font-bold leading-tight flex flex-col items-center justify-center shrink-0">
                {r.date.split(' ')[0]}<span className="text-[8px] font-semibold">{r.date.split(' ')[1].toUpperCase()}</span>
              </span>
              <div className="min-w-0">
                <div className="text-[12px] font-semibold text-[#0F172A]">{r.orders} orders settled</div>
                <div className="text-[10px] text-[#94A3B8] tabular-nums truncate">{r.utr}</div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[12.5px] font-bold text-[#0F172A] tabular-nums">{r.amt}</div>
              <div className="text-[10px] font-semibold text-[#00A86B]">Credited</div>
            </div>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

const SERVICES = [
  {
    icon: Palette,
    name: 'Branded Tracking Page',
    title: 'Tracking that looks like your store',
    desc: 'Buyers follow their order on a page with your logo, colours and links — and come back to shop instead of calling support.',
    points: ['Your logo, colours and domain', 'Product banners and offers', 'Fewer “where is my order” calls'],
    Preview: TrackingPreview,
  },
  {
    icon: Gauge,
    name: 'RTO Score',
    title: 'Know which orders may come back',
    desc: 'Every order gets a risk score before you ship, based on the address, pincode history and the buyer’s past deliveries.',
    points: ['Score on every new order', 'Flags incomplete addresses', 'Verify or cancel risky COD early'],
    Preview: RtoPreview,
  },
  {
    icon: Wallet,
    name: 'Seller Remittance',
    title: 'COD money, sooner',
    desc: 'Get your cash-on-delivery collections in your bank faster, with every payout matched to the orders it covers.',
    points: ['Early COD payouts', 'Order-wise remittance ledger', 'Direct to your bank account'],
    Preview: RemittancePreview,
  },
];

export function ValueAddedServicesSection() {
  return (
    <section className="relative bg-[#F8FAFC] py-16 md:py-24 overflow-hidden" style={{ fontFamily: 'Roboto, sans-serif' }}>
      {/* Soft light from the top */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_50%_at_50%_0%,#E8F5EE_0%,transparent_70%)]" />

      <div className="relative max-w-[1200px] mx-auto px-4 md:px-8">
        <motion.div {...inView()} className="text-center max-w-[640px] mx-auto">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#00A86B]/10 text-[12px] md:text-[11px] font-bold uppercase tracking-[0.12em] text-[#00A86B]">Value Added Services</span>
          <h2 className="mt-4 text-[28px] md:text-[42px] font-bold text-[#0F172A] leading-[1.15] tracking-tight">
            More than shipping. <span className="text-[#00A86B]">Tools that protect every order.</span>
          </h2>
          <p className="mt-4 text-[15px] md:text-[16px] text-[#64748B] leading-relaxed">
            Switch on the services you need from your QuickPost dashboard — no extra integration.
          </p>
        </motion.div>

        <div className="mt-10 md:mt-14 grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6">
          {SERVICES.map((s, i) => (
            <motion.article
              key={s.name}
              {...inView(0.1 + i * 0.12)}
              whileHover={{ y: -6 }}
              className="group relative rounded-3xl bg-white/80 backdrop-blur border border-[#E2E8F0] p-5 md:p-6 flex flex-col shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:shadow-[0_24px_48px_-24px_rgba(15,23,42,0.3)] hover:border-[#00A86B]/30 transition-[box-shadow,border-color] duration-300"
            >
              {/* Product preview on a soft tinted panel */}
              <div className="rounded-2xl bg-gradient-to-br from-[#F1F5F9] to-[#E6F4EC] p-4 md:p-5 min-h-[360px] flex items-center justify-center">
                <div className="w-full">
                <s.Preview />
                </div>
              </div>

              <div className="mt-5 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-[#F0FDF4] text-[#00A86B] flex items-center justify-center"><s.icon className="w-4 h-4" /></span>
                <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#00A86B]">{s.name}</span>
              </div>
              <h3 className="mt-3 text-[19px] md:text-[20px] font-bold text-[#0F172A] leading-snug">{s.title}</h3>
              <p className="mt-2 text-[14px] text-[#64748B] leading-relaxed">{s.desc}</p>
              <ul className="mt-4 space-y-2">
                {s.points.map(p => (
                  <li key={p} className="flex items-start gap-2.5 text-[13.5px] text-[#334155]">
                    <span className="mt-0.5 w-4 h-4 rounded-full bg-[#00A86B]/10 flex items-center justify-center shrink-0"><Check className="w-2.5 h-2.5 text-[#00A86B]" strokeWidth={3} /></span>
                    {p}
                  </li>
                ))}
              </ul>
              <Link to="/#signup" className="mt-5 pt-4 border-t border-[#F1F5F9] inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-[#00A86B]">
                Get started <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
