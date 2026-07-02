import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

// --- HELPER: DYNAMIC FONT LOADER ---
const useGlobalSetup = () => {
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700;800;900&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);
};

export function HowItWorks() {
  useGlobalSetup();

  const cards = [
    {
      num: "01",
      category: "CONNECT YOUR STORE",
      title: "Sync Orders in One Click",
      desc: "Integrate your Shopify, WooCommerce, or any custom storefront via API. Every new order is automatically pulled into the QuickPost dashboard in under 5 seconds — no CSV uploads, no manual entries.",
      bullets: [
        "Shopify, WooCommerce & custom API webhooks",
        "Auto-sync within 5 seconds of checkout",
        "Bulk import for existing order backlogs"
      ],
      btnLabel: "Connect Store",
      img: "/store_sync.png"
    },
    {
      num: "02",
      category: "SMART COURIER SELECTION",
      title: "Picks the Best Courier",
      desc: "QuickPost's allocation engine compares 9+ courier partners in real time — evaluating delivery speed, zone pricing, RTO history, and serviceability — then auto-assigns the optimal carrier for every single shipment.",
      bullets: [
        "Real-time rate comparison across 9+ couriers",
        "Pin-code level serviceability checks",
        "RTO risk scoring before dispatch"
      ],
      btnLabel: "View Couriers",
      img: "/routing_boxes.png"
    },
    {
      num: "03",
      category: "NDR & RTO PREVENTION",
      title: "Rescue Failed Deliveries",
      desc: "When a delivery attempt fails, QuickPost automatically triggers WhatsApp messages and IVR calls to the customer to confirm their address, reschedule delivery, or update their contact number — reducing RTO by up to 40%.",
      bullets: [
        "Automated WhatsApp & IVR follow-ups",
        "Customer self-serve address correction",
        "Re-attempt scheduling within 2 hours"
      ],
      btnLabel: "See NDR Flow",
      img: "/phone_ndr.png"
    },
    {
      num: "04",
      category: "GET PAID FASTER",
      title: "Early COD Remittance",
      desc: "Stop waiting 7–15 days for your money. QuickPost settles your COD collections within 24–48 hours of delivery confirmation directly into your bank account, keeping your working capital healthy.",
      bullets: [
        "COD settlement in 24–48 hours",
        "Transparent ledger with per-order tracking",
        "Instant withdrawals to any bank account"
      ],
      btnLabel: "View Wallet",
      img: "/payout_ledger.png"
    }
  ];

  return (
    <section
      id="how-it-works"
      className="bg-[#0C0C0C] rounded-t-[40px] sm:rounded-t-[50px] md:rounded-t-[60px] -mt-10 sm:-mt-12 md:-mt-14 relative z-20 px-5 sm:px-8 md:px-10 py-20 pb-40"
      style={{ fontFamily: "'Kanit', sans-serif" }}
    >

      {/* Heading gradient style */}
      <style dangerouslySetInnerHTML={{__html: `
        .hero-heading {
          background: linear-gradient(180deg, #646973 0%, #BBCCD7 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}} />

      {/* Title */}
      <div className="mb-16 md:mb-24 text-center">
        <h2 className="hero-heading font-black uppercase text-[clamp(3rem,12vw,160px)] tracking-tight leading-none">
          How it works
        </h2>
        <p className="text-[#D7E2EA]/60 mt-6 text-[clamp(0.9rem,1.6vw,1.15rem)] font-light max-w-xl mx-auto leading-relaxed">
          From order placement to cash in your bank — four steps, fully automated.
        </p>
      </div>

      {/* Sticky Stacking Cards */}
      <div className="space-y-24 max-w-5xl mx-auto">
        {cards.map((card, index) => {
          const targetScale = 1 - (cards.length - 1 - index) * 0.03;

          return (
            <div
              key={index}
              className="sticky top-24 md:top-32 h-[85vh] flex items-start justify-center"
              style={{ paddingTop: `${index * 28}px` }}
            >
              <motion.div
                style={{ scale: targetScale }}
                className="bg-[#0C0C0C] border-2 border-[#D7E2EA] rounded-[40px] sm:rounded-[50px] md:rounded-[60px] p-6 md:p-8 w-full h-full flex flex-col justify-between shadow-2xl relative overflow-hidden"
              >

                {/* Card Header */}
                <div className="flex flex-wrap justify-between items-center gap-4 border-b border-[#D7E2EA]/15 pb-4">
                  <div className="flex items-center gap-4">
                    <span className="text-[32px] font-black text-[#D7E2EA] leading-none font-mono">
                      {card.num}
                    </span>
                    <div>
                      <span className="text-[9px] font-extrabold tracking-widest text-[#D7E2EA]/60 uppercase block">
                        {card.category}
                      </span>
                      <span className="text-[16px] md:text-[20px] font-bold text-[#D7E2EA] uppercase">
                        {card.title}
                      </span>
                    </div>
                  </div>

                  <button className="rounded-full border-2 border-[#D7E2EA] text-[#D7E2EA] font-medium uppercase tracking-widest text-xs sm:text-sm px-6 py-2.5 hover:bg-[#D7E2EA]/10 transition-colors">
                    {card.btnLabel}
                  </button>
                </div>

                {/* Card Body: Text Left + Image Right */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 flex-1 mt-6 items-center">

                  {/* Left: Content */}
                  <div className="flex flex-col justify-center gap-6">
                    <p className="text-[#D7E2EA]/80 text-[clamp(0.85rem,1.5vw,1.1rem)] font-light leading-relaxed">
                      {card.desc}
                    </p>

                    <ul className="space-y-3">
                      {card.bullets.map((bullet, i) => (
                        <li key={i} className="flex items-start gap-3 text-[#D7E2EA]">
                          <span className="mt-1.5 w-2 h-2 rounded-full bg-[#00A86B] shrink-0" />
                          <span className="text-[clamp(0.8rem,1.3vw,1rem)] font-normal leading-snug">
                            {bullet}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* Mini stat badge */}
                    <div className="flex items-center gap-3 mt-2">
                      <div className="bg-[#00A86B]/10 border border-[#00A86B]/30 rounded-xl px-4 py-2">
                        <span className="text-[#00A86B] text-[11px] font-extrabold tracking-wider uppercase">
                          {index === 0 && "5-second sync"}
                          {index === 1 && "9+ courier partners"}
                          {index === 2 && "40% RTO reduction"}
                          {index === 3 && "24-hr settlement"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Image */}
                  <div className="w-full h-full rounded-[24px] sm:rounded-[32px] overflow-hidden">
                    <img
                      src={card.img}
                      alt={card.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

              </motion.div>
            </div>
          );
        })}
      </div>

    </section>
  );
}
