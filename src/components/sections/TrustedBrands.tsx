import { motion } from 'framer-motion';

const couriers = [
  { name: "Delhivery",      logo: "/brands/delhivery.png" },
  { name: "Blue Dart",      logo: "/brands/bluedart.png" },
  { name: "DTDC",           logo: "/brands/dtdc.png" },
  { name: "XpressBees",     logo: "/brands/xpressbees.png" },
  { name: "Ekart",          logo: "/brands/ekart.png" },
  { name: "Shadowfax",      logo: "/brands/shadowfax.png" },
  { name: "Amazon Shipping",logo: "/brands/amazon.png" },
  { name: "Shree Maruti",   logo: "/brands/shree_maruti.jpg" },
  { name: "Losung360",      logo: "/brands/losung.jpg" },
];

// Enough duplicates for a seamless loop (need ≥2 identical sets)
const row1 = [...couriers, ...couriers, ...couriers, ...couriers];
const row2 = [...couriers, ...couriers, ...couriers, ...couriers];


function LogoCard({ name, logo }: { name: string; logo: string }) {
  return (
    <div
      className="
        group flex-shrink-0
        flex items-center justify-center
        w-[158px] h-[72px]
        bg-white
        border border-[#E8EDF4]
        rounded-2xl
        px-5
        shadow-[0_2px_10px_rgba(0,0,0,0.04)]
        hover:shadow-[0_6px_24px_rgba(0,0,0,0.09)]
        hover:border-[#00A86B]/35
        hover:-translate-y-[3px]
        transition-all duration-250 ease-out
        cursor-default
      "
    >
      <img
        src={logo}
        alt={name}
        className="
          max-h-[38px] max-w-[112px]
          w-auto object-contain
          opacity-85
          group-hover:opacity-100
          transition-opacity duration-250
        "
      />
    </div>
  );
}

export function TrustedBrands() {
  return (
    <section
      className="relative py-20 bg-[#F8FAFC] overflow-hidden"
      style={{ fontFamily: 'Roboto, sans-serif' }}
    >
      {/* Subtle grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(#0F172A 1px, transparent 1px), linear-gradient(90deg, #0F172A 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* ── Heading block ── */}
      <motion.div
        className="relative text-center mb-14 px-4"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#00A86B] bg-[#00A86B]/10 border border-[#00A86B]/20 px-4 py-1.5 rounded-full mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00A86B] animate-pulse" />
          Our Courier Network
        </span>

        <h2 className="text-[28px] md:text-[36px] font-bold text-[#0F172A] leading-[1.2] tracking-tight mb-4">
          Ship with India's Most Trusted<br className="hidden md:block" /> Courier Partners
        </h2>

        <p className="text-[15px] text-[#64748B] max-w-[520px] mx-auto leading-relaxed">
          We've integrated with 25+ couriers so you always get the fastest, most
          reliable delivery — across every pincode in India.
        </p>
      </motion.div>

      {/* ── Dual-row marquee ── */}
      <div className="relative w-full space-y-3.5">

        {/* Edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0  w-40 bg-gradient-to-r from-[#F8FAFC] to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-[#F8FAFC] to-transparent z-10" />

        {/* Row 1 — left */}
        <motion.div
          className="flex gap-3.5 w-max"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ x: { repeat: Infinity, repeatType: 'loop', duration: 30, ease: 'linear' } }}
        >
          {row1.map((c, i) => <LogoCard key={i} {...c} />)}
        </motion.div>

        {/* Row 2 — right */}
        <motion.div
          className="flex gap-3.5 w-max"
          animate={{ x: ['-50%', '0%'] }}
          transition={{ x: { repeat: Infinity, repeatType: 'loop', duration: 34, ease: 'linear' } }}
        >
          {row2.map((c, i) => <LogoCard key={i} {...c} />)}
        </motion.div>
      </div>

    </section>
  );
}
