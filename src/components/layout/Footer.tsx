import React, { useEffect, useRef } from 'react';

// Inline Tabler Icons (Lucide-like)
const IconLinkedIn = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z" /><path d="M8 11l0 5" /><path d="M8 8l0 .01" /><path d="M12 16l0 -5" /><path d="M16 16v-3a2 2 0 0 0 -4 0" /></svg>;
const IconInstagram = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4m0 4a4 4 0 0 1 4 -4h8a4 4 0 0 1 4 4v8a4 4 0 0 1 -4 4h-8a4 4 0 0 1 -4 -4z" /><path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /><path d="M16.5 7.5l0 .01" /></svg>;
const IconX = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l11.733 16h4.267l-11.733 -16z" /><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" /></svg>;
const IconYouTube = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 8a4 4 0 0 1 4 -4h12a4 4 0 0 1 4 4v8a4 4 0 0 1 -4 4h-12a4 4 0 0 1 -4 -4v-8z" /><path d="M10 9l5 3l-5 3z" /></svg>;
const IconMail = ({ size = 14, color = "#1D9E75" }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10z" /><path d="M3 7l9 6l9 -6" /></svg>;
const IconClock = ({ size = 14, color = "#1D9E75" }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M12 7l0 5l3 3" /></svg>;

export function Footer() {
  const footerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const gsap = (window as any).gsap;
    const ScrollTrigger = (window as any).ScrollTrigger;
    if (!gsap || !ScrollTrigger || !footerRef.current) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // Zone 1 Animations
      gsap.from('.footer-cta-left', {
        x: -30, opacity: 0, duration: 0.7, ease: 'power3.out',
        scrollTrigger: { trigger: '.footer-zone-1', start: 'top 90%', once: true }
      });
      gsap.from('.footer-cta-right', {
        x: 30, opacity: 0, duration: 0.7, ease: 'power3.out', delay: 0.1,
        scrollTrigger: { trigger: '.footer-zone-1', start: 'top 90%', once: true }
      });

      // Zone 2 Animations
      gsap.from('.footer-col', {
        y: 30, opacity: 0, duration: 0.6, ease: 'power3.out', stagger: 0.1,
        scrollTrigger: { trigger: '.footer-zone-2', start: 'top 90%', once: true }
      });

      // Zone 3 Animations
      gsap.from('.footer-zone-3', {
        opacity: 0, duration: 0.5, delay: 0.3,
        scrollTrigger: { trigger: '.footer-zone-2', start: 'top 90%', once: true }
      });
    }, footerRef);

    return () => ctx.revert();
  }, []);

  return (
    <footer ref={footerRef} className="overflow-hidden" style={{ fontFamily: 'Roboto, sans-serif' }}>
      
      {/* ================= ZONE 1: CTA STRIP ================= */}
      <div className="bg-[#1D9E75] footer-zone-1 relative z-10 border-b border-white/15">
        <div className="max-w-[1200px] mx-auto px-5 md:px-0 py-[36px] md:py-[48px] flex flex-col md:flex-row items-center">
          {/* LEFT: 55% */}
          <div className="w-full md:w-[55%] text-center md:text-left mb-6 md:mb-0 footer-cta-left">
            <h2 className="text-[24px] md:text-[32px] font-bold text-white leading-[1.2] m-0">
              Start Shipping Smarter Today
            </h2>
            <p className="text-[16px] font-normal text-white/80 mt-2 m-0">
              No setup fees. No contracts. Go live in under 10 minutes.
            </p>
          </div>
          
          {/* RIGHT: 45% */}
          <div className="w-full md:w-[45%] flex flex-col items-center md:items-end footer-cta-right">
            <button className="w-full md:w-auto bg-white text-[#1D9E75] font-bold text-[15px] px-[32px] py-[16px] rounded-[10px] border-none hover:bg-[#F0FAF5] hover:-translate-y-[2px] transition-all duration-200 ease-in-out cursor-pointer">
              Get Started Free &rarr;
            </button>
            <a href="#" className="block text-[13px] font-normal text-white/75 mt-[10px] hover:underline hover:text-white text-center md:text-right">
              Already have an account? Log in
            </a>
          </div>
        </div>
      </div>

      {/* ================= ZONE 2: MAIN FOOTER COLUMNS ================= */}
      <div className="bg-[#0D1F1A] footer-zone-2">
        <div className="max-w-[1200px] mx-auto px-5 md:px-0 pt-[48px] pb-[36px] md:pt-[64px] md:pb-[48px]">
          
          {/* Grid Layout */}
          <div className="grid grid-cols-2 md:grid-cols-[30%_1fr_1fr_1fr] gap-[32px] md:gap-[40px]">
            
            {/* COLUMN 1: BRAND */}
            <div className="footer-col col-span-2 md:col-span-1 mb-2 md:mb-0">
              <img 
                src="/logo-color.png" 
                alt="QuickPost" 
                className="h-[32px] mb-[16px] brightness-0 invert" 
                onError={(e) => { e.currentTarget.style.display='none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }}
              />
              <span className="hidden text-white font-bold text-2xl mb-[16px] block tracking-tight">QuickPost</span>
              
              <p className="text-[14px] font-normal text-white/55 leading-[1.6] max-w-[220px] mb-[24px]">
                Shipping infrastructure for India's growing brands.
              </p>
              
              <div className="flex flex-row gap-[10px]">
                {[IconLinkedIn, IconInstagram, IconX, IconYouTube].map((Icon, idx) => (
                  <a key={idx} href="#" className="w-[36px] h-[36px] rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:bg-[#1D9E75] hover:text-white hover:border-[#1D9E75] transition-all duration-200 ease-in-out">
                    <Icon />
                  </a>
                ))}
              </div>

              {/* Contact Nudge */}
              <div className="mt-[28px]">
                <div className="flex flex-row items-center gap-[8px] mb-[10px]">
                  <IconMail />
                  <span className="text-[13px] font-normal text-white/55">support@quickpost.in</span>
                </div>
                <div className="flex flex-row items-center gap-[8px]">
                  <IconClock />
                  <span className="text-[13px] font-normal text-white/55">Mon–Sat, 9am–7pm IST</span>
                </div>
              </div>
            </div>

            {/* COLUMN 2: PRODUCT */}
            <div className="footer-col flex flex-col col-span-1">
              <h4 className="text-[12px] font-medium uppercase tracking-[0.1em] text-white/35 mb-[20px] m-0">Product</h4>
              <div className="flex flex-col gap-[12px]">
                {['Order Management', 'Rate Calculator', 'Courier Comparison', 'NDR Management', 'COD Remittance', 'Tracking Page'].map((link) => (
                  <a key={link} href="#" className="text-[14px] font-normal text-white/65 hover:text-[#1D9E75] hover:pl-[4px] transition-all duration-200 ease-in-out no-underline">
                    {link}
                  </a>
                ))}
              </div>
            </div>

            {/* COLUMN 3: COMPANY */}
            <div className="footer-col flex flex-col col-span-1">
              <h4 className="text-[12px] font-medium uppercase tracking-[0.1em] text-white/35 mb-[20px] m-0">Company</h4>
              <div className="flex flex-col gap-[12px]">
                {['About Us', 'Careers', 'Partner Program', 'Contact Us'].map((link) => (
                  <a key={link} href="#" className="text-[14px] font-normal text-white/65 hover:text-[#1D9E75] hover:pl-[4px] transition-all duration-200 ease-in-out no-underline">
                    {link}
                  </a>
                ))}
              </div>
            </div>

            {/* COLUMN 4: INTEGRATIONS */}
            <div className="footer-col flex flex-col col-span-2 md:col-span-1 mt-4 md:mt-0">
              <h4 className="text-[12px] font-medium uppercase tracking-[0.1em] text-white/35 mb-[20px] m-0">Integrations</h4>
              <div className="flex flex-col gap-[12px]">
                {['Shopify', 'WooCommerce', 'API Documentation'].map((link) => (
                  <a key={link} href="#" className="text-[14px] font-normal text-white/65 hover:text-[#1D9E75] hover:pl-[4px] transition-all duration-200 ease-in-out no-underline">
                    {link}
                  </a>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Divider above Zone 3 */}
        <div className="w-full max-w-[1200px] mx-auto border-t border-white/5"></div>

        {/* ================= ZONE 3: BOTTOM BAR ================= */}
        <div className="footer-zone-3 max-w-[1200px] mx-auto px-5 md:px-0 py-[20px] flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0">
          
          <div className="text-[13px] font-normal text-white/35 text-center md:text-left">
            © 2026 Quickpost. All rights reserved.
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-[10px] gap-y-2">
            {['Terms & Conditions', 'Privacy Policy', 'Compliance', 'Refund & Cancellation Policy'].map((link, idx, arr) => (
              <React.Fragment key={link}>
                <a href="#" className="text-[13px] font-normal text-white/35 hover:text-white/70 transition-colors duration-150 ease-in-out no-underline">
                  {link}
                </a>
                {idx < arr.length - 1 && (
                  <span className="text-white/20">·</span>
                )}
              </React.Fragment>
            ))}
          </div>

        </div>
      </div>

    </footer>
  );
}
