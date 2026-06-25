import React, { useEffect, useRef } from 'react';

const TruckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M5 17h-2v-11a1 1 0 0 1 1 -1h9v12m-4 0h6m4 0h2v-6h-8m0 -5h5l3 5" /></svg>;
const WhatsAppIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21l1.65 -3.8a9 9 0 1 1 3.4 2.9l-5.05 .9" /><path d="M9 10a.5 .5 0 0 0 1 0v-1a.5 .5 0 0 0 -1 0v1a5 5 0 0 0 5 5h1a.5 .5 0 0 0 0 -1h-1a.5 .5 0 0 0 0 1" /></svg>;
const PhoneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a16 16 0 0 1 -15 -15a2 2 0 0 1 2 -2" /></svg>;
const RupeeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 5h-11h3a4 4 0 0 1 0 8h-3l6 6" /><path d="M7 9l11 0" /></svg>;
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M12 7l0 5l3 3" /></svg>;
const ChartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" /><path d="M9 8m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v10a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" /><path d="M15 4m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v14a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" /><path d="M4 20l14 0" /></svg>;
const StarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#F5A623" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z" /></svg>;

const AnimatedConnector = ({ direction = 'right', id }: { direction?: 'left' | 'right', id: string }) => {
  const isRight = direction === 'right';
  const pathD = isRight 
    ? "M 100 0 C 160 30, 160 70, 100 100" 
    : "M 100 0 C 40 30, 40 70, 100 100";
    
  return (
    <div className="sp-arrow-container w-full h-[100px] flex justify-center items-center relative overflow-visible my-8 md:my-4">
      <svg className="hidden md:block w-[200px] h-[100px] overflow-visible" viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={`grad-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1D9E75" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#1D9E75" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#00A86B" stopOpacity="1" />
          </linearGradient>
          <filter id={`glow-${id}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <mask id={`mask-${id}`}>
            <path 
              className="sp-arrow-mask-path" 
              d={pathD} 
              stroke="white" 
              strokeWidth="4" 
              strokeLinecap="round" 
              fill="none" 
            />
          </mask>
        </defs>
        
        {/* Faint background track */}
        <path d={pathD} stroke="#1D9E75" strokeOpacity="0.15" strokeWidth="2" strokeLinecap="round" />
        
        {/* The dashed glowing gradient line, revealed by the mask */}
        <path 
          d={pathD} 
          stroke={`url(#grad-${id})`} 
          strokeWidth="2.5" 
          strokeDasharray="6 8" 
          strokeLinecap="round"
          filter={`url(#glow-${id})`}
          mask={`url(#mask-${id})`}
        />
        
        {/* Sleek Chevron Arrowhead */}
        <path 
          className="sp-arrow-head opacity-0 translate-y-[-2px]"
          d="M 93 92 L 100 100 L 107 92" 
          stroke="#00A86B" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
      </svg>
      
      {/* Mobile Vertical Line */}
      <div className="md:hidden w-[2px] h-[60px] relative overflow-hidden rounded-full bg-[#1D9E75]/10">
        <div className="sp-mobile-line absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-[#1D9E75]/80 to-[#00A86B] translate-y-[-100%]"></div>
      </div>
    </div>
  );
};

export function ServicesPortfolioSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const gsap = (window as any).gsap;
    const ScrollTrigger = (window as any).ScrollTrigger;

    if (!gsap || !ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // Header Animation
      gsap.from('.sp-header-line', {
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.12,
        ease: 'power4.out',
        scrollTrigger: {
          trigger: '.sp-header',
          start: 'top 80%',
          once: true,
        }
      });

      // Blocks Animations
      const blocks = gsap.utils.toArray('.sp-block');
      blocks.forEach((block: any, i: number) => {
        const imagePanel = block.querySelector('.sp-image-panel');
        const textPanel = block.querySelector('.sp-text-panel');
        const chips = block.querySelectorAll('.sp-chip');
        const checkmarks = block.querySelectorAll('.sp-check-bullet');
        
        const isOdd = i % 2 === 0;
        
        gsap.from(imagePanel, {
          x: isOdd ? -50 : 50,
          opacity: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: block,
            start: 'top 75%',
            once: true,
          }
        });

        gsap.from(textPanel, {
          x: isOdd ? 50 : -50,
          opacity: 0,
          duration: 0.8,
          ease: 'power3.out',
          delay: 0.15,
          scrollTrigger: {
            trigger: block,
            start: 'top 75%',
            once: true,
          }
        });

        if (chips.length > 0) {
          gsap.from(chips, {
            scale: 0.8,
            opacity: 0,
            duration: 0.5,
            ease: 'back.out(1.4)',
            delay: 0.5,
            scrollTrigger: {
              trigger: block,
              start: 'top 75%',
              once: true,
            }
          });
        }

        if (checkmarks.length > 0) {
          gsap.from(checkmarks, {
            x: -16,
            opacity: 0,
            duration: 0.8,
            ease: 'power3.out',
            stagger: 0.08,
            delay: 0.55, // 0.15 + 0.4
            scrollTrigger: {
              trigger: block,
              start: 'top 75%',
              once: true,
            }
          });
        }
      });

      // Arrow Animations
      const arrowContainers = gsap.utils.toArray('.sp-arrow-container');
      arrowContainers.forEach((container: any) => {
        const maskPath = container.querySelector('.sp-arrow-mask-path');
        const arrowHead = container.querySelector('.sp-arrow-head');
        const mobileLine = container.querySelector('.sp-mobile-line');
        
        if (maskPath) {
          const length = maskPath.getTotalLength();
          gsap.set(maskPath, { strokeDasharray: length, strokeDashoffset: length });
          
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: container,
              start: 'top 80%',
              once: true,
            }
          });
          
          tl.to(maskPath, {
            strokeDashoffset: 0,
            duration: 1.2,
            ease: 'power2.inOut',
          })
          .to(arrowHead, {
            opacity: 1,
            y: 0,
            duration: 0.3,
            ease: 'back.out(2)',
          }, "-=0.3");
        }

        if (mobileLine) {
          gsap.to(mobileLine, {
            y: "0%",
            duration: 1.2,
            ease: 'power2.inOut',
            scrollTrigger: {
              trigger: container,
              start: 'top 80%',
              once: true,
            }
          });
        }
      });

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-[60px] md:py-[100px] px-5 bg-white font-[Roboto] overflow-hidden">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes qp-sol-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(29,158,117,0.4); }
          50% { box-shadow: 0 0 0 6px rgba(29,158,117,0); }
        }
        .qp-chip-style {
          background: #ffffff;
          border-radius: 30px;
          padding: 10px 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: 'Roboto', sans-serif;
          font-weight: 500;
          font-size: 13px;
          color: #1A1A1A;
          box-shadow: 0 8px 24px rgba(0,0,0,0.10);
          position: absolute;
          z-index: 10;
          white-space: nowrap;
        }
        @media (max-width: 480px) {
          .qp-chip-style { display: none; }
        }
      `}} />

      <div className="max-w-[1200px] mx-auto">
        
        {/* Section Header */}
        <div className="sp-header mb-[80px] text-left">
          <p className="text-[#1D9E75] uppercase text-[11px] font-medium tracking-[0.12em] mb-4">WHAT WE OFFER</p>
          <h2 className="text-[#1A1A1A] font-bold text-[32px] md:text-[48px] leading-[1.1] tracking-[-0.02em]">
            <div className="sp-header-line overflow-hidden">Our Services</div>
            <div className="sp-header-line overflow-hidden">& Solutions Portfolio</div>
          </h2>
        </div>

        {/* Block 1 */}
        <div className="sp-block grid grid-cols-1 md:grid-cols-[46%_46%] gap-[40px] md:gap-[8%] items-center min-h-[420px]">
          {/* Image */}
          <div className="sp-image-panel relative rounded-[20px] bg-[#E8F5F0] p-4 md:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.10)] w-full h-[240px] md:h-[320px] md:order-1 order-1" id="qp-sol-img-1">
            <img src="/brands/integration.png" alt="Integrations" className="w-full h-full object-contain rounded-[16px]" />
          </div>
          
          {/* Text */}
          <div className="sp-text-panel md:order-2 order-2">
            <p className="text-[#1D9E75] text-[11px] font-medium uppercase tracking-wider mb-3">MULTI-COURIER BOOKING</p>
            <h3 className="text-[#1A1A1A] font-bold text-[24px] md:text-[32px] leading-[1.2] mb-4">Ship with India's Top Couriers — All from One Platform</h3>
            <p className="text-[#5F5E5A] text-[15px] md:text-[16px] leading-[1.7] mb-6">Stop logging into five courier portals. QuickPost compares rates, delivery speed, and performance scores across Delhivery, Ekart, BlueDart, Shadowfax, XpressBees and more — then books the smartest choice in one click.</p>
            
            <ul className="space-y-3 mb-8">
              {['Rate comparison across 15+ couriers', 'Auto-select by pincode performance', 'Bulk booking in seconds'].map((txt, idx) => (
                <li key={idx} className="sp-check-bullet flex items-start gap-[10px] text-[15px] text-[#1A1A1A]">
                  <span className="text-[#1D9E75] font-bold mt-0.5">✓</span>
                  {txt}
                </li>
              ))}
            </ul>
            
            <a href="#" className="inline-block text-[#1D9E75] font-medium text-[15px] mt-6 hover:underline">Explore courier partners →</a>
          </div>
        </div>

        {/* Dotted Arrow 1->2 */}
        <AnimatedConnector direction="right" id="arrow-1-2" />

        {/* Block 2 */}
        <div className="sp-block grid grid-cols-1 md:grid-cols-[46%_46%] gap-[40px] md:gap-[8%] items-center min-h-[420px]">
          {/* Text */}
          <div className="sp-text-panel md:order-1 order-2">
            <p className="text-[#1D9E75] text-[11px] font-medium uppercase tracking-wider mb-3">NDR RECOVERY</p>
            <h3 className="text-[#1A1A1A] font-bold text-[24px] md:text-[32px] leading-[1.2] mb-4">Rescue Every Stuck Shipment Before It Becomes a Return</h3>
            <p className="text-[#5F5E5A] text-[15px] md:text-[16px] leading-[1.7] mb-6">When delivery fails, QuickPost doesn't wait for the seller to notice. Our NDR engine automatically triggers WhatsApp messages and IVR calls to the customer — confirming address, rescheduling delivery, and giving your shipment one more chance before RTO.</p>
            
            <ul className="space-y-3 mb-8">
              {['WhatsApp + IVR follow-up within 2 hours of NDR', 'Address update without re-booking', '40% average NDR-to-delivery recovery rate'].map((txt, idx) => (
                <li key={idx} className="sp-check-bullet flex items-start gap-[10px] text-[15px] text-[#1A1A1A]">
                  <span className="text-[#1D9E75] font-bold mt-0.5">✓</span>
                  {txt}
                </li>
              ))}
            </ul>
            
            <a href="#" className="inline-block text-[#1D9E75] font-medium text-[15px] mt-6 hover:underline">See how NDR recovery works →</a>
          </div>

          {/* Image */}
          <div className="sp-image-panel relative rounded-[20px] bg-[#FFF8E8] p-4 md:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.10)] w-full h-[240px] md:h-[320px] md:order-2 order-1" id="qp-sol-img-2">
            <img src="/brands/state 2.png" alt="NDR Recovery" className="w-full h-full object-contain rounded-[16px]" />
          </div>
        </div>

        {/* Dotted Arrow 2->3 */}
        <AnimatedConnector direction="left" id="arrow-2-3" />

        {/* Block 3 */}
        <div className="sp-block grid grid-cols-1 md:grid-cols-[46%_46%] gap-[40px] md:gap-[8%] items-center min-h-[420px]">
          {/* Image */}
          <div className="sp-image-panel relative rounded-[20px] bg-[#EEF4FF] p-4 md:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.10)] w-full h-[240px] md:h-[320px] md:order-1 order-1" id="qp-sol-img-3">
            <img src="/brands/image 4.png" alt="COD & Payments" className="w-full h-full object-contain rounded-[16px]" />
          </div>
          
          {/* Text */}
          <div className="sp-text-panel md:order-2 order-2">
            <p className="text-[#1D9E75] text-[11px] font-medium uppercase tracking-wider mb-3">COD & PAYMENTS</p>
            <h3 className="text-[#1A1A1A] font-bold text-[24px] md:text-[32px] leading-[1.2] mb-4">Get Your Cash in 48 Hours. Every Time.</h3>
            <p className="text-[#5F5E5A] text-[15px] md:text-[16px] leading-[1.7] mb-6">Waiting 7–10 days for COD remittance kills working capital. QuickPost settles your cash-on-delivery payments within 48 hours of delivery confirmation — automatically credited to your QuickPost wallet, ready for your next shipment batch.</p>
            
            <ul className="space-y-3 mb-8">
              {['T+2 COD remittance — industry fastest', 'Auto-reconciliation, zero manual follow-up', 'Real-time wallet dashboard with full history'].map((txt, idx) => (
                <li key={idx} className="sp-check-bullet flex items-start gap-[10px] text-[15px] text-[#1A1A1A]">
                  <span className="text-[#1D9E75] font-bold mt-0.5">✓</span>
                  {txt}
                </li>
              ))}
            </ul>
            
            <a href="#" className="inline-block text-[#1D9E75] font-medium text-[15px] mt-6 hover:underline">Learn about COD payouts →</a>
          </div>
        </div>

        {/* Dotted Arrow 3->4 */}
        <AnimatedConnector direction="right" id="arrow-3-4" />

        {/* Block 4 */}
        <div className="sp-block grid grid-cols-1 md:grid-cols-[46%_46%] gap-[40px] md:gap-[8%] items-center min-h-[420px]">
          {/* Text */}
          <div className="sp-text-panel md:order-1 order-2">
            <p className="text-[#1D9E75] text-[11px] font-medium uppercase tracking-wider mb-3">ANALYTICS & INTELLIGENCE</p>
            <h3 className="text-[#1A1A1A] font-bold text-[24px] md:text-[32px] leading-[1.2] mb-4">Know Exactly Where Your Shipping Is Winning or Losing</h3>
            <p className="text-[#5F5E5A] text-[15px] md:text-[16px] leading-[1.7] mb-6">QuickPost gives your ops team real-time visibility into every courier's performance — delivery rates, RTO percentages, COD collection efficiency, and weight dispute trends — broken down by zone, courier, and time period. Stop guessing. Start optimising.</p>
            
            <ul className="space-y-3 mb-8">
              {['Courier performance scorecard per zone', 'RTO trend analysis with root cause tagging', 'Weight dispute auto-flagging and resolution'].map((txt, idx) => (
                <li key={idx} className="sp-check-bullet flex items-start gap-[10px] text-[15px] text-[#1A1A1A]">
                  <span className="text-[#1D9E75] font-bold mt-0.5">✓</span>
                  {txt}
                </li>
              ))}
            </ul>
            
            <a href="#" className="inline-block text-[#1D9E75] font-medium text-[15px] mt-6 hover:underline">Explore analytics features →</a>
          </div>

          {/* Image */}
          <div className="sp-image-panel relative rounded-[20px] bg-[#F0FAF5] p-4 md:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.10)] w-full h-[240px] md:h-[320px] md:order-2 order-1" id="qp-sol-img-4">
            <img src="/brands/state 3.png" alt="Analytics and Intelligence" className="w-full h-full object-contain rounded-[16px]" />
          </div>
        </div>

      </div>
    </section>
  );
}
