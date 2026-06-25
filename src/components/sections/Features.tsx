import React, { useEffect, useRef } from 'react';

const TruckIconLarge = () => <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#00A86B" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M5 17h-2v-11a1 1 0 0 1 1 -1h9v12m-4 0h6m4 0h2v-6h-8m0 -5h5l3 5" /></svg>;
const BoxIconLarge = () => <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="#00A86B" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l8 4.5l0 9l-8 4.5l-8 -4.5l0 -9l8 -4.5" /><path d="M12 12l8 -4.5" /><path d="M12 12l0 9" /><path d="M12 12l-8 -4.5" /></svg>;
const MapIconLarge = () => <svg xmlns="http://www.w3.org/2000/svg" width="90" height="90" viewBox="0 0 24 24" fill="none" stroke="#00A86B" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7l6 -3l6 3l6 -3l0 13l-6 3l-6 -3l-6 3l0 -13" /><path d="M9 4l0 13" /><path d="M15 7l0 13" /></svg>;

// Tabler-style internal SVG icons
const IconShoppingCart = (props: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>;
const IconTag = (props: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>;
const IconFileText = (props: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>;
const IconClipboardList = (props: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><line x1="12" y1="11" x2="16" y2="11"/><line x1="12" y1="16" x2="16" y2="16"/><line x1="8" y1="11" x2="8.01" y2="11"/><line x1="8" y1="16" x2="8.01" y2="16"/></svg>;
const IconTruckDelivery = (props: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>;
const IconPackage = (props: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>;
const IconArrowBackUp = (props: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>;
const IconMapPin = (props: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const IconCurrencyRupee = (props: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M6 3h12"/><path d="M6 8h12"/><path d="M6 13h8.5a4.5 4.5 0 0 0 0-9"/><path d="M14 13l-8 8"/></svg>;
const IconArrowRight = (props: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;

const renderChars = (word: string) => word.split('').map((char, i) => (
  <span key={i} className="inline-block sp-char opacity-0 translate-y-6">{char}</span>
));

export function Features() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const gsap = (window as any).gsap;
    const ScrollTrigger = (window as any).ScrollTrigger;
    if (!gsap || !ScrollTrigger || !sectionRef.current) return;
    
    gsap.registerPlugin(ScrollTrigger);
    
    const ctx = gsap.context(() => {
      // Header animations
      gsap.to('.sp-char', {
        y: 0, opacity: 1, duration: 0.8, stagger: 0.03, ease: 'back.out(1.7)',
        scrollTrigger: { trigger: '.sp-header-container', start: 'top 85%', once: true }
      });
      gsap.to('.sp-float-icon', {
        y: -15, rotation: 3, duration: 4, repeat: -1, yoyo: true, ease: 'sine.inOut', stagger: 1.2,
      });
      gsap.to('.sp-route-progress', { width: '100%', duration: 4, ease: 'ease-in-out', repeat: -1, yoyo: true });

      // Grid Cards Entrance & Internal Triggers
      const cards = gsap.utils.toArray('.new-bento-card');
      cards.forEach((card: any, i: number) => {
        let delay = 0;
        if (i < 2) delay = i * 0.12;
        else if (i < 4) delay = 0.15 + (i - 2) * 0.12;
        else delay = 0.25;

        gsap.from(card, {
          y: 30, opacity: 0, duration: 0.6, ease: 'power3.out', delay: delay,
          scrollTrigger: { trigger: '.bento-grid-container', start: 'top 75%', once: true },
          onComplete: () => {
            if (card.classList.contains('card-1')) playCard1();
            if (card.classList.contains('card-2')) playCard2();
            if (card.classList.contains('card-3')) playCard3();
            if (card.classList.contains('card-4')) playCard4();
            if (card.classList.contains('card-5')) playCard5();
          }
        });
      });

      // Internal Card Timelines
      function playCard1() {
        const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.5 });
        tl.fromTo('.c1-row', { opacity: 0, x: -8 }, { opacity: 1, x: 0, stagger: 0.12, duration: 0.4, ease: 'power2.out' })
          .fromTo('.c1-badge', { scale: 0 }, { scale: 1, duration: 0.4, ease: 'back.out(1.7)' });
      }

      function playCard2() {
        const counterObj = { val: 89 };
        const counterEl = document.getElementById('c2-counter');
        const tl = gsap.timeline({ repeat: -1, repeatDelay: 1 });
        
        tl.set('.c2-tag', { opacity: 0 })
          .set('.c2-savings', { opacity: 0, scale: 0.5 })
          .set(counterObj, { val: 89 })
          .call(() => { if(counterEl) counterEl.innerText = '89'; });

        tl.to('.c2-tag', { opacity: 1, stagger: 0.6, duration: 0.3 });
        tl.to(counterObj, {
          val: 42, duration: 2, ease: 'power2.out',
          onUpdate: () => { if(counterEl) counterEl.innerText = Math.round(counterObj.val).toString(); }
        }, "<");
        
        tl.to('.c2-savings', { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.4)' });
      }

      function playCard3() {
        const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.5 });
        tl.set('.c3-progress', { width: '0%' })
          .set('.c3-circle', { backgroundColor: '#E8EDE9', color: '#9FB5AB' })
          .set('.c3-label', { color: '#9FB5AB' })
          .set('.c3-package', { left: '0%' });

        [0, 1, 2, 3, 4].forEach((i) => {
          tl.to(`.c3-circle-${i}`, { backgroundColor: '#1D9E75', color: '#ffffff', duration: 0.2 }, i * 0.7);
          tl.to(`.c3-label-${i}`, { color: '#1D9E75', duration: 0.2 }, i * 0.7);
          if (i > 0) {
            tl.to('.c3-progress', { width: `${i * 25}%`, duration: 0.4, ease: 'power2.inOut' }, (i - 1) * 0.7 + 0.2);
            tl.to('.c3-package', { left: `${i * 25}%`, duration: 0.4, ease: 'power2.inOut' }, (i - 1) * 0.7 + 0.2);
          }
        });
        tl.to('.c3-circle', { scale: 1.1, duration: 0.1, yoyo: true, repeat: 1, stagger: 0.05 }, "+=0.2");
      }

      function playCard4() {
        const tl = gsap.timeline({ repeat: -1, repeatDelay: 2 });
        tl.set('.c4-row', { opacity: 0, y: 10 })
          .set('.c4-line', { scaleY: 0 });

        [4, 3, 2, 1, 0].forEach((i, step) => {
          tl.to(`.c4-row-${i}`, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, step * 0.4);
          if (i !== 4) {
            tl.to(`.c4-line-${i}`, { scaleY: 1, duration: 0.3, ease: 'linear' }, step * 0.4 + 0.2);
          }
        });
      }

      function playCard5() {
        const tl = gsap.timeline({ repeat: -1, repeatDelay: 2 });
        tl.set('.c5-stage', { backgroundColor: '#F4F6F5', borderColor: '#E0EDE8' })
          .set('.c5-icon', { color: '#5F5E5A' })
          .set('.c5-arrow', { color: '#D4E4DC' })
          .set('.c5-badge', { opacity: 0, scale: 0.5 });

        [0, 1, 2, 3].forEach((i) => {
          tl.to(`.c5-stage-${i}`, { backgroundColor: '#E1F5EE', borderColor: '#1D9E75', duration: 0.3 }, i * 0.8);
          tl.to(`.c5-icon-${i}`, { color: '#1D9E75', duration: 0.3 }, i * 0.8);
          if (i !== 3) {
            tl.to(`.c5-arrow-${i}`, { color: '#1D9E75', duration: 0.3 }, i * 0.8 + 0.4);
          }
        });
        tl.to('.c5-badge', { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.4)' }, "+=0.2");
      }

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="features" className="py-[48px] md:py-[80px] bg-[#F4F6F5] overflow-hidden" style={{ fontFamily: 'Roboto, sans-serif' }}>
      <style>{`
        @keyframes sp-route-progress {
          0% { width: 0%; opacity: 1; }
          75% { width: 100%; opacity: 1; }
          85% { width: 100%; opacity: 0; }
          90% { width: 0%; opacity: 0; }
          100% { width: 0%; opacity: 1; }
        }
        @keyframes sp-route-dot {
          0% { left: 0%; opacity: 1; transform: translate(-50%, -50%) scale(1); }
          70% { left: 100%; opacity: 1; transform: translate(-50%, -50%) scale(1); }
          75% { left: 100%; opacity: 1; transform: translate(-50%, -50%) scale(1.3); }
          85% { left: 100%; opacity: 0; transform: translate(-50%, -50%) scale(1.5); }
          90% { left: 0%; opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
          100% { left: 0%; opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes c4-pulse {
          0% { box-shadow: 0 0 0 4px rgba(255,255,255,0.25); }
          50% { box-shadow: 0 0 0 10px rgba(255,255,255,0); }
          100% { box-shadow: 0 0 0 4px rgba(255,255,255,0.25); }
        }
        .animate-c4-pulse { animation: c4-pulse 2s infinite; }
      `}</style>

      <div className="max-w-[1200px] mx-auto px-4 md:px-8">
        
        {/* HEADING BLOCK */}
        <div className="sp-header-container text-center mb-[48px] relative z-0 flex flex-col items-center">
          <div className="absolute top-[-30px] right-[10%] sp-float-icon opacity-[0.04] z-[-1] hidden md:block">
            <TruckIconLarge />
          </div>
          <div className="absolute top-[20px] left-[15%] sp-float-icon opacity-[0.03] z-[-1] hidden md:block">
            <BoxIconLarge />
          </div>
          <div className="absolute top-[-10px] right-[30%] sp-float-icon opacity-[0.03] z-[-1] hidden md:block">
            <MapIconLarge />
          </div>

          <h2 className="text-[28px] md:text-[40px] font-bold text-[#1A1A1A] leading-tight mb-5 flex flex-wrap justify-center items-center gap-x-2 md:gap-x-3 pb-2">
            <span className="inline-block">{renderChars('Take')}</span>
            <span className="inline-block sp-char opacity-0 translate-y-6 text-[#00A86B] mx-1 text-[28px] md:text-[42px]">
              Full Control
            </span>
            <span className="inline-block">{renderChars('of')}</span>
            <span className="inline-block">{renderChars('Your')}</span>
            <span className="inline-block">{renderChars('Shipping')}</span>
          </h2>

          <p className="text-[16px] font-normal text-[#5F5E5A]">
            Manage everything from a single dashboard — no chaos, no confusion.
          </p>

          {/* Tracking Route */}
          <div className="mt-8 flex items-center justify-center gap-3 mx-auto w-full max-w-[320px]">
            <div className="w-3.5 h-3.5 rounded-full border-[2.5px] border-[#94A3B8] bg-white z-10 shrink-0"></div>
            <div className="flex-1 h-[24px] relative flex items-center">
              <div className="absolute inset-0 w-full h-full flex items-center">
                <div className="w-full border-t-[2.5px] border-dashed border-[#CBD5E1]"></div>
              </div>
              <div className="absolute left-0 h-[2.5px] bg-[#00A86B] shadow-[0_0_6px_rgba(0,168,107,0.4)] animate-[sp-route-progress_4s_ease-in-out_infinite]"></div>
              <div className="absolute top-1/2 w-4 h-4 bg-white border-[3.5px] border-[#00A86B] rounded-full shadow-[0_0_12px_rgba(0,168,107,0.6)] z-10 animate-[sp-route-dot_4s_ease-in-out_infinite]"></div>
            </div>
            <div className="z-10 shrink-0 text-[#00A86B] flex items-center justify-center">
              <IconMapPin className="w-[22px] h-[22px]" />
            </div>
          </div>
        </div>

        {/* NEW BENTO GRID - MAX WIDTH 1080px */}
        <div className="bento-grid-container max-w-[1080px] mx-auto w-full flex flex-col md:grid md:grid-cols-10 gap-[16px]">
          
          {/* Row 1 */}
          {/* CARD 1: 50% (col-span-5) - Bid Board */}
          <div className="new-bento-card card-1 md:col-span-5 bg-[#1D9E75] rounded-[20px] p-[28px] min-h-[280px] relative overflow-hidden flex flex-col justify-between">
            <div>
              <h3 className="text-[20px] font-bold text-[#ffffff] leading-tight mb-1">Multi-Courier Integration</h3>
              <p className="text-[13px] font-normal text-white/80 mb-[24px]">Best courier selected automatically for every order.</p>
            </div>
            
            <div className="bg-black/18 rounded-[12px] p-[12px_16px] w-full">
              <div className="grid grid-cols-3 text-[10px] uppercase font-medium text-white/45 mb-2">
                <span>Courier</span><span className="text-center">Rate</span><span className="text-right">ETA</span>
              </div>
              <div className="c1-row flex items-center justify-between text-[12px] text-white/85 py-[6px] border-b border-white/10 opacity-0">
                <span className="w-1/3">Delhivery</span><span className="w-1/3 text-center">₹47</span><span className="w-1/3 text-right">2 days</span>
              </div>
              <div className="c1-row flex items-center justify-between text-[12px] text-white/85 py-[6px] border-b border-white/10 opacity-0">
                <span className="w-1/3">Ekart</span><span className="w-1/3 text-center">₹52</span><span className="w-1/3 text-right">3 days</span>
              </div>
              <div className="c1-row flex items-center justify-between text-[12px] text-white/85 py-[6px] border-b border-white/10 opacity-0">
                <span className="w-1/3">BlueDart</span><span className="w-1/3 text-center">₹61</span><span className="w-1/3 text-right">1 day</span>
              </div>
              <div className="c1-row flex items-center justify-between text-[12px] text-white/85 py-[6px] bg-white/15 rounded-[6px] px-[8px] -mx-[8px] opacity-0">
                <span className="w-1/3">Shadowfax</span>
                <span className="w-1/3 flex items-center justify-center gap-[6px]">
                  ₹44
                  <span className="c1-badge bg-white text-[#0F6E56] font-bold text-[9px] px-[7px] py-[2px] rounded-[10px]">BEST</span>
                </span>
                <span className="w-1/3 text-right">3 days</span>
              </div>
            </div>
          </div>

          {/* CARD 2: 50% (col-span-5) - Savings Counter */}
          <div className="new-bento-card card-2 md:col-span-5 bg-[#0F6E56] rounded-[20px] p-[28px] min-h-[280px] relative overflow-hidden flex flex-col justify-between">
            <div>
              <h3 className="text-[20px] font-bold text-[#ffffff] leading-tight mb-1">Shipping Rate Optimisation</h3>
              <p className="text-[13px] font-normal text-white/80">AI cuts your per-shipment cost automatically.</p>
            </div>
            <div className="mt-6 flex flex-col items-center">
              <div className="text-center mb-4">
                <div className="text-[48px] font-bold text-white leading-none">₹<span id="c2-counter">89</span></div>
                <div className="text-[11px] text-white/55">per shipment</div>
              </div>
              <div className="flex flex-col gap-2 w-full max-w-[220px]">
                {['Zone optimization applied', 'Dead weight corrected', 'Best courier matched'].map((tag, i) => (
                  <div key={i} className="c2-tag bg-white/12 rounded-[20px] py-[5px] px-[12px] flex items-center gap-[6px] text-[11px] text-white/80 opacity-0">
                    <span className="text-[#9FE1CB]">✓</span> {tag}
                  </div>
                ))}
              </div>
              <div className="c2-savings bg-white text-[#0F6E56] font-bold text-[13px] rounded-[8px] py-[8px] px-[16px] mt-[12px] opacity-0 inline-block">
                You saved ₹47 per shipment
              </div>
            </div>
          </div>

          {/* Row 2 */}
          {/* CARD 3: 40% (col-span-4) - Automated Order Processing */}
          <div className="new-bento-card card-3 md:col-span-4 bg-white border border-[#E0EDE8] rounded-[20px] p-[28px] min-h-[280px] relative overflow-hidden flex flex-col justify-between">
            <div>
              <h3 className="text-[20px] font-bold text-[#1A1A1A] leading-tight mb-1">Automated Order Processing</h3>
              <p className="text-[13px] font-normal text-[#5F5E5A]">From order to dispatch — zero manual steps.</p>
            </div>
            <div className="bg-[#F4F6F5] rounded-[12px] h-[80px] mt-[40px] px-[32px] relative flex flex-col justify-center">
              <div className="relative w-full h-[36px]">
                <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-[1.5px] bg-[#D4E4DC]"></div>
                <div className="c3-progress absolute top-1/2 -translate-y-1/2 left-0 h-[1.5px] bg-[#1D9E75] w-0"></div>

                {[
                  {i: IconShoppingCart, l: "Order Received"},
                  {i: IconTag, l: "Label Printed"},
                  {i: IconFileText, l: "Invoice Created"},
                  {i: IconClipboardList, l: "Manifest Ready"},
                  {i: IconTruckDelivery, l: "AWB Assigned"}
                ].map((st, idx) => (
                  <div key={idx} className="absolute top-0 -translate-x-1/2 flex flex-col items-center" style={{ left: `${idx * 25}%` }}>
                    <div className={`c3-circle c3-circle-${idx} w-[36px] h-[36px] rounded-full bg-[#E8EDE9] flex items-center justify-center text-[#9FB5AB]`}>
                      <st.i className="w-[16px] h-[16px]" />
                    </div>
                    <div className={`c3-label c3-label-${idx} text-[10px] font-normal text-[#9FB5AB] absolute top-[42px] w-[60px] text-center leading-tight`}>{st.l}</div>
                  </div>
                ))}

                <div className="c3-package absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-[24px] h-[24px] rounded-full bg-[#1D9E75] flex items-center justify-center z-20 shadow-md" style={{ left: '0%' }}>
                  <IconPackage className="w-[12px] h-[12px] text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* CARD 4: 60% (col-span-6) - Real-Time Tracking */}
          <div className="new-bento-card card-4 md:col-span-6 bg-[#1D9E75] rounded-[20px] p-[28px] min-h-[280px] relative overflow-hidden flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <h3 className="text-[20px] font-bold text-[#ffffff] leading-tight mb-1">Real-Time Tracking</h3>
              <p className="text-[13px] font-normal text-white/80 mb-2">Customer always knows. You always know.</p>
              <div className="flex flex-wrap gap-[8px] mt-[8px]">
                <span className="bg-white/18 text-white font-medium text-[11px] py-[4px] px-[12px] rounded-[20px]">WhatsApp</span>
                <span className="bg-white/18 text-white font-medium text-[11px] py-[4px] px-[12px] rounded-[20px]">SMS</span>
                <span className="bg-white/18 text-white font-medium text-[11px] py-[4px] px-[12px] rounded-[20px]">Email</span>
              </div>
            </div>
            
            <div className="flex-1 bg-black/18 rounded-[14px] p-[16px_20px]">
              <div className="flex flex-col relative">
                {[
                  { title: "Out for Delivery", detail: "Today, 10:23 AM · Ekart Agent: Ravi Kumar", active: true },
                  { title: "Reached Delivery Hub", detail: "Today, 7:45 AM · Andheri Sort Facility", active: false },
                  { title: "In Transit", detail: "Yesterday, 11:30 PM · Mumbai Hub", active: false },
                  { title: "Picked Up", detail: "Yesterday, 3:15 PM · Seller Warehouse", active: false },
                  { title: "Order Booked", detail: "23 Jun, 2:00 PM · AWB: QP0900004821", active: false }
                ].map((m, i) => (
                  <div key={i} className={`c4-row-${i} relative flex gap-[12px] items-start ${i !== 4 ? 'pb-[16px]' : ''}`}>
                    {i !== 4 && (
                      <div className={`c4-line-${i} absolute left-[4.5px] top-[14px] bottom-0 w-[1.5px] origin-top ${i === 0 ? 'border-l-[1.5px] border-dashed border-white/30 bg-transparent' : 'bg-white/20'}`}></div>
                    )}
                    <div className={`relative z-10 shrink-0 mt-[3px] ${m.active ? 'w-[12px] h-[12px] bg-white rounded-full animate-c4-pulse' : 'w-[8px] h-[8px] bg-white/40 rounded-full ml-[2px]'}`}></div>
                    <div className="flex flex-col -mt-[1px]">
                      <span className={m.active ? "text-[12px] font-bold text-white" : "text-[12px] font-medium text-white/80"}>{m.title}</span>
                      <span className={m.active ? "text-[11px] font-normal text-white/70 mt-[2px]" : "text-[11px] font-normal text-white/45 mt-[2px]"}>{m.detail}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Row 3 */}
          {/* CARD 5: 100% (col-span-10) - Easy Returns */}
          <div className="new-bento-card card-5 md:col-span-10 bg-white border border-[#E0EDE8] rounded-[20px] p-[28px_32px] min-h-[280px] md:min-h-[auto] relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="w-full md:w-[45%]">
              <h3 className="text-[20px] font-bold text-[#1A1A1A] leading-tight mb-1">Easy Returns Management</h3>
              <p className="text-[14px] font-normal text-[#5F5E5A] leading-[1.6] mb-4">
                Reverse logistics that runs itself. One click to initiate, automatic to complete.
              </p>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-[8px] text-[13px] text-[#1A1A1A]"><span className="text-[#1D9E75] font-bold">✓</span> Return initiated in one click</div>
                <div className="flex items-center gap-[8px] text-[13px] text-[#1A1A1A]"><span className="text-[#1D9E75] font-bold">✓</span> Pickup auto-scheduled with courier</div>
                <div className="flex items-center gap-[8px] text-[13px] text-[#1A1A1A]"><span className="text-[#1D9E75] font-bold">✓</span> COD refund released on confirmation</div>
              </div>
            </div>

            <div className="w-full md:w-[55%] flex items-center justify-between relative mt-4 md:mt-0 px-4 md:px-0">
              <div className="c5-badge absolute -top-[20px] right-0 bg-[#1D9E75] text-white font-bold text-[10px] rounded-[6px] px-[8px] py-[3px]">Return Complete ✓</div>
              
              {[
                {i: IconArrowBackUp, l: "Return Initiated"},
                {i: IconMapPin, l: "Pickup Scheduled"},
                {i: IconPackage, l: "Item Collected"},
                {i: IconCurrencyRupee, l: "Refund Released"}
              ].map((st, i) => (
                <React.Fragment key={i}>
                  <div className={`c5-stage c5-stage-${i} bg-[#F4F6F5] border-[1.5px] border-[#E0EDE8] rounded-[10px] p-[10px_14px] w-[100px] md:w-[120px] flex flex-col items-center gap-2`}>
                    <st.i className={`c5-icon c5-icon-${i} w-[18px] h-[18px] text-[#5F5E5A]`} />
                    <span className="text-[11px] font-medium text-[#1A1A1A] text-center leading-tight">{st.l}</span>
                  </div>
                  {i !== 3 && (
                    <div className="flex-1 flex justify-center">
                      <IconArrowRight className={`c5-arrow c5-arrow-${i} w-[16px] h-[16px] text-[#D4E4DC]`} />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
