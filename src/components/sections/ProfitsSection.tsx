import { useState, useEffect } from 'react';
import { appUrl } from '../../utils/domainUrl';
import { motion, AnimatePresence } from 'framer-motion';

export function ProfitsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [typedLine1, setTypedLine1] = useState("");
  const [typedLine2, setTypedLine2] = useState("");
  const [typingComplete, setTypingComplete] = useState(false);

  const data = [
    {
      title: "Post-NDR Follow Ups",
      desc: "Rescue & deliver NDR shipments through WhatsApp & IVR follow ups. QuickPost triggers automated communication to verify delivery details instantly.",
      tags: ["WhatsApp alerts", "IVR calling", "Auto-reschedule"],
    },
    {
      title: "Same/Next-day Delivery",
      desc: "Offer express delivery options to your customers and win the checkout moment. QuickPost automatically routes to the fastest courier available.",
      tags: ["Express routing", "Pincode intelligence", "ETA display"],
    },
    {
      title: "RTO Reduction Suite",
      desc: "Reduce return-to-origin rates with AI-powered courier selection, fake order detection, and proactive customer communication before dispatch.",
      tags: ["AI courier match", "Fake order filter", "Pre-dispatch SMS"],
    },
    {
      title: "Early COD Payout Options",
      desc: "Don't wait days for your cash. QuickPost releases COD remittance within 24–48 hours of delivery confirmation, keeping your cash flow healthy.",
      tags: ["T+2 remittance", "Auto settlement", "Wallet credit"],
    }
  ];



  // Character-by-character typewriter effect
  useEffect(() => {
    const line1 = "Fewer Failures,";
    const line2 = "Higher Profits";
    let index1 = 0;
    let index2 = 0;

    // Type Line 1
    const timer1 = setInterval(() => {
      if (index1 <= line1.length) {
        setTypedLine1(line1.slice(0, index1));
        index1++;
      } else {
        clearInterval(timer1);
        // Start Line 2
        const timer2 = setInterval(() => {
          if (index2 <= line2.length) {
            setTypedLine2(line2.slice(0, index2));
            index2++;
          } else {
            clearInterval(timer2);
            setTypingComplete(true);
          }
        }, 60); // Type speed for line 2
      }
    }, 60); // Type speed for line 1

    return () => {
      clearInterval(timer1);
    };
  }, []);

  return (
    <section id="qp-profits-section" className="hidden md:block py-[60px] md:py-[100px] bg-[#FAFAFA] overflow-hidden" style={{ fontFamily: 'Roboto, sans-serif' }}>
      <style>{`
        .qp-accord-item {
          background: #ffffff;
          border: none;
          border-radius: 16px;
          margin-bottom: 14px;
          overflow: hidden;
          transition: all 0.25s ease;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03);
          cursor: pointer;
        }

        .qp-accord-item.active {
          box-shadow: 0 10px 30px rgba(0, 168, 107, 0.08);
        }

        .qp-accord-trigger {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 22px 24px;
          background: none;
          border: none;
          cursor: pointer;
          text-align: left;
        }

        .qp-accord-title {
          font-family: 'Roboto', sans-serif;
          font-size: 18px;
          font-weight: 700;
          color: #0F172A;
          transition: color 0.25s ease;
        }

        .qp-accord-item.active .qp-accord-title {
          color: #00A86B;
        }

        .qp-accord-body {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1),
                      padding 0.25s ease;
          padding: 0 24px;
        }

        .qp-accord-item.active .qp-accord-body {
          max-height: 220px;
          padding: 0 24px 22px;
        }

        .qp-accord-desc {
          font-family: 'Roboto', sans-serif;
          font-size: 14.5px;
          font-weight: 400;
          color: #475569;
          line-height: 1.6;
        }

        .qp-image-panel {
          position: sticky;
          top: 100px;
        }

        .qp-image-wrap {
          position: relative;
          border-radius: 24px;
          overflow: hidden;
          aspect-ratio: 4/3;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #F1F5F9;
        }

        .qp-profits-cta {
          display: inline-block;
          background: #00A86B;
          color: #ffffff;
          font-family: 'Roboto', sans-serif;
          font-size: 16px;
          font-weight: 700;
          padding: 15px 38px;
          border-radius: 30px;
          text-decoration: none;
          letter-spacing: 0.01em;
          transition: all 0.25s ease;
          box-shadow: 0 4px 12px rgba(0, 168, 107, 0.15);
        }

        .qp-profits-cta:hover {
          background: #009B63;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 168, 107, 0.25);
        }

        .qp-typing-cursor {
          display: inline-block;
          width: 3px;
          height: 36px;
          background-color: currentColor;
          margin-left: 6px;
          animation: qp-cursor-blink 0.9s infinite;
        }

        @keyframes qp-cursor-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        /* Responsive Styles */
        @media (max-width: 768px) {
          .qp-grid-layout {
            display: flex;
            flex-direction: column-reverse;
            gap: 24px;
          }
          .qp-image-panel {
            position: static;
          }
          .qp-image-wrap {
            aspect-ratio: 1.4;
            border-radius: 18px;
          }
          .qp-heading-title {
            font-size: clamp(26px, 7vw, 40px) !important;
            min-height: 96px !important;
          }
          .qp-typing-cursor {
            height: 24px;
          }
          .qp-accord-trigger {
            padding: 16px 18px;
          }
          .qp-accord-title {
            font-size: 15px;
          }
          .qp-accord-body {
            padding: 0 18px;
          }
          .qp-accord-item.active .qp-accord-body {
            padding: 0 18px 18px;
          }
          .qp-accord-desc {
            font-size: 13px;
          }
          .qp-profits-cta {
            width: 100%;
            text-align: center;
            font-size: 15px;
            padding: 14px 24px;
          }
        }
      `}</style>

      <div className="max-w-[1200px] mx-auto px-5 md:px-0">
        
        {/* HEADING BLOCK */}
        <div className="text-center mb-[56px]">
          <h2 className="qp-heading-title text-[48px] font-black text-[#0F172A] leading-tight mb-4 flex flex-col items-center tracking-tight min-h-[120px]">
            {/* Line 1 */}
            <span className="heading-line inline-flex items-center gap-1.5 min-h-[58px]">
              <span>{typedLine1}</span>
              {!typingComplete && typedLine2.length === 0 && (
                <span className="qp-typing-cursor text-[#0F172A]" />
              )}
            </span>
            {/* Line 2 */}
            <span className="heading-line inline-flex items-center gap-1.5 text-[#00A86B] min-h-[58px]">
              <span>{typedLine2}</span>
              {(typingComplete || typedLine2.length > 0) && (
                <span className="qp-typing-cursor text-[#00A86B]" />
              )}
            </span>
          </h2>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.8 }}
            className="qp-subheading text-[16px] font-normal text-[#475569] max-w-[560px] mx-auto leading-relaxed"
          >
            Reliable eCommerce delivery services designed to reduce losses and protect margins.
          </motion.p>
        </div>

        {/* TWO-COLUMN LAYOUT */}
        <div className="qp-grid-layout md:grid md:grid-cols-2 md:gap-[5%] items-center min-h-[440px] w-full">
          
          {/* LEFT COLUMN — ACCORDION CARDS */}
          <div className="flex flex-col">
            {data.map((item, index) => (
              <motion.div 
                key={index} 
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 1.8 + (index * 0.08) }}
                className={`qp-accord-item ${activeIndex === index ? 'active' : ''}`}
                onClick={() => setActiveIndex(index)}
              >
                <div className="qp-accord-trigger">
                  <span className="qp-accord-title">{item.title}</span>
                </div>
                <div className="qp-accord-body">
                  <p className="qp-accord-desc">{item.desc}</p>
                  <div className="qp-accord-tags flex flex-wrap gap-2 mt-3.5">
                    {item.tags.map((tag, i) => (
                      <span key={i} className="qp-tag text-[11px] font-medium text-[#065F46] bg-[#00A86B]/10 border border-[#00A86B]/20 px-2.5 py-0.5 rounded-full select-none">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* RIGHT COLUMN — CONTEXTUAL MOCKUPS PANEL */}
          <div className="qp-image-panel mb-8 md:mb-0">
            <div className="qp-image-wrap p-6 sm:p-8">
              


              {/* Mockup Container */}
              <AnimatePresence mode="wait">
                <motion.div 
                  key={activeIndex}
                  initial={{ opacity: 0, scale: 0.96, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -10 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="w-full flex justify-center z-10"
                >
                  {activeIndex === 0 && (
                    <div className="absolute inset-0 w-full h-full animate-fade-in">
                      <img 
                        src="/brands/post_ndr_follow_ups.png" 
                        alt="Post-NDR Follow Ups" 
                        className="w-full h-full object-cover rounded-[24px]"
                      />
                    </div>
                  )}

                  {activeIndex === 1 && (
                    <div className="absolute inset-0 w-full h-full animate-fade-in">
                      <img 
                        src="/brands/express_day_delivery.png" 
                        alt="Same/Next-day Delivery" 
                        className="w-full h-full object-cover rounded-[24px]"
                      />
                    </div>
                  )}

                  {activeIndex === 2 && (
                    <div className="absolute inset-0 w-full h-full animate-fade-in">
                      <img 
                        src="/brands/rto_reduction_suite.png" 
                        alt="RTO Reduction Suite" 
                        className="w-full h-full object-cover rounded-[24px]"
                      />
                    </div>
                  )}

                  {activeIndex === 3 && (
                    <div className="absolute inset-0 w-full h-full animate-fade-in">
                      <img 
                        src="/brands/early_cod_payout.png" 
                        alt="Early COD Payout Options" 
                        className="w-full h-full object-cover rounded-[24px]"
                      />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

            </div>
          </div>

        </div>

        {/* CTA BUTTON */}
        <div style={{ textAlign: 'center', marginTop: '56px' }}>
          <a href={appUrl('/signup')} className="qp-profits-cta">
            Get Started
          </a>
        </div>

      </div>
    </section>
  );
}
