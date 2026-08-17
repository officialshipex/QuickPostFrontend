import { motion } from 'framer-motion';
import { ArrowRight, RotateCcw, ShieldCheck, Clock3 } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

const EASE = [0.16, 1, 0.3, 1] as const;

const POLICY_POINTS: string[] = [
  'Cancellations will only be considered if the request is made within 7 days of placing the order. However, cancellation requests may not be entertained if the orders have been communicated to sellers / merchants listed on the Platform and they have initiated the process of shipping them, or the product is out for delivery.',
  'Quickpost does not accept cancellation requests for perishable items like flowers, eatables, etc. However, the refund / replacement can be made if the user establishes that the quality of the product delivered is not good.',
  'In case of receipt of damaged or defective items, please report to our customer service team. This should be reported within 7 days of receipt of products.',
  'If you feel that the product received is not as shown on the site or as per your expectations, you must bring it to the notice of our customer service within 7 days of receiving the product.',
  'In case of complaints regarding the products that come with a warranty from the manufacturers, please refer the issue to them.',
  'If refund is approved, the amount would be credited to original payment method within 3 business days.',
];

/* ── Dot-grid background, same recipe used across the site ── */
function DotGrid({ opacity = 0.035 }: { opacity?: number }) {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        opacity,
        backgroundImage:
          'linear-gradient(#0F172A 1px, transparent 1px), linear-gradient(90deg, #0F172A 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }}
    />
  );
}

export function RefundPolicy() {
  return (
    <div className="min-h-screen flex flex-col bg-white font-sans text-[#0F172A] selection:bg-[#00A86B]/20 selection:text-[#00A86B]" style={{ fontFamily: 'Roboto, sans-serif' }}>
      <Navbar />

      <main className="flex-1">
        {/* ═══════════════════════ HERO ═══════════════════════ */}
        <section className="relative overflow-hidden pt-[120px] pb-14 md:pt-[150px] md:pb-20 bg-[#F8FAFC]">
          <DotGrid />
          <div className="absolute top-16 -right-24 w-[360px] h-[360px] rounded-full bg-[#00A86B]/[0.05] blur-3xl pointer-events-none" />

          <div className="relative max-w-4xl mx-auto px-6 md:px-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
            >
              <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#00A86B] bg-[#00A86B]/10 border border-[#00A86B]/20 px-4 py-1.5 rounded-full">
                <RotateCcw className="w-3.5 h-3.5" />
                Legal
              </span>

              <h1 className="mt-5 text-[30px] leading-[1.15] md:text-[44px] md:leading-[1.1] font-bold text-[#0F172A] tracking-tight">
                Refund &amp; Cancellation Policy
              </h1>

              <p className="mt-4 text-[14.5px] md:text-[15.5px] text-[#5F5E5A] leading-relaxed max-w-[620px] mx-auto">
                How you can cancel or seek a refund for a product / service purchased through the Platform.
              </p>
            </motion.div>
          </div>
        </section>

        {/* ═══════════════════════ INTRO CARD ═══════════════════════ */}
        <section className="relative px-6 md:px-10 -mt-6 md:-mt-10 z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.55, ease: EASE }}
            className="max-w-4xl mx-auto bg-white rounded-2xl border border-[#E0EDE8] shadow-[0_20px_60px_-30px_rgba(0,0,0,0.15)] p-6 md:p-9"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#F0FDF4] flex items-center justify-center shrink-0">
                <Clock3 className="w-4.5 h-4.5 text-[#00A86B]" />
              </div>
              <p className="text-[13px] md:text-[13.5px] text-[#475569] leading-relaxed">
                This refund and cancellation policy outlines how you can cancel or seek a refund for a product /
                service that you have purchased through the Platform. Under this policy, the terms below apply.
              </p>
            </div>
          </motion.div>
        </section>

        {/* ═══════════════════════ POLICY — numbered arrow list ═══════════════════════ */}
        <section className="relative py-16 md:py-20">
          <div className="max-w-4xl mx-auto px-6 md:px-10">
            <motion.div
              className="mb-10 md:mb-12"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.55, ease: EASE }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F0FDF4] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-[#00A86B]" />
                </div>
                <h2 className="text-[22px] md:text-[28px] font-bold text-[#0F172A] tracking-tight">
                  Policy Details
                </h2>
              </div>
            </motion.div>

            <div className="space-y-3">
              {POLICY_POINTS.map((point, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.45, delay: Math.min(i * 0.05, 0.5), ease: EASE }}
                  className="group relative flex items-start gap-4 bg-white rounded-2xl border border-[#E0EDE8] p-4 md:p-5 hover:border-[#00A86B]/30 hover:shadow-lg hover:shadow-[#00A86B]/5 hover:-translate-y-[1px] transition-all duration-250"
                >
                  {/* 2D numbered badge */}
                  <div className="relative shrink-0">
                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-[#F0FDF4] border border-[#00A86B]/20 flex items-center justify-center text-[13px] md:text-[14px] font-bold text-[#00A86B] group-hover:bg-[#00A86B] group-hover:text-white group-hover:border-[#00A86B] transition-colors duration-250">
                      {String(i + 1).padStart(2, '0')}
                    </div>
                  </div>

                  <p className="flex-1 min-w-0 text-[13px] md:text-[13.5px] leading-relaxed text-[#334155] pt-1.5 md:pt-2">
                    {point}
                  </p>

                  <ArrowRight className="hidden md:block w-4 h-4 text-[#CBD5E1] group-hover:text-[#00A86B] group-hover:translate-x-1 transition-all duration-250 shrink-0 mt-2.5" />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════ CONTACT STRIP ═══════════════════════ */}
        <section className="relative px-6 md:px-10 pb-16 md:pb-24">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.55, ease: EASE }}
            className="max-w-4xl mx-auto bg-[#F8FAFC] rounded-2xl border border-[#E0EDE8] p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div>
              <h3 className="text-[15px] md:text-[16px] font-bold text-[#0F172A]">Need help with a refund or cancellation?</h3>
              <p className="text-[12.5px] md:text-[13px] text-[#64748B] mt-1">
                Reach out to our customer service team and we'll help you sort it out quickly.
              </p>
            </div>
            <a
              href="/#contact"
              className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl text-[13.5px] font-bold text-white shrink-0 transition-all"
              style={{ background: 'linear-gradient(135deg, #00A86B 0%, #00C47A 100%)', boxShadow: '0 2px 14px rgba(0, 168, 107, 0.38)' }}
            >
              Contact Us <ArrowRight className="w-4 h-4" />
            </a>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
