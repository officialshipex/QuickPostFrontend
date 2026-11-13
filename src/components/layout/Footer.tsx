import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

// Inline Tabler Icons (Lucide-like)
const IconLinkedIn = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z" /><path d="M8 11l0 5" /><path d="M8 8l0 .01" /><path d="M12 16l0 -5" /><path d="M16 16v-3a2 2 0 0 0 -4 0" /></svg>;
const IconInstagram = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4m0 4a4 4 0 0 1 4 -4h8a4 4 0 0 1 4 4v8a4 4 0 0 1 -4 4h-8a4 4 0 0 1 -4 -4z" /><path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /><path d="M16.5 7.5l0 .01" /></svg>;
const IconX = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l11.733 16h4.267l-11.733 -16z" /><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" /></svg>;
const IconYouTube = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 8a4 4 0 0 1 4 -4h12a4 4 0 0 1 4 4v8a4 4 0 0 1 -4 4h-12a4 4 0 0 1 -4 -4v-8z" /><path d="M10 9l5 3l-5 3z" /></svg>;
const IconMail = ({ size = 14, color = "#1D9E75" }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10z" /><path d="M3 7l9 6l9 -6" /></svg>;
const IconClock = ({ size = 14, color = "#1D9E75" }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M12 7l0 5l3 3" /></svg>;

/** `hideCta`: the page already ends with its own call-to-action band (the landing page). */
const FOOTER_GROUPS: { title: string; links: { label: string; to?: string }[] }[] = [
  { title: 'Product', links: ['Order Management', 'Rate Calculator', 'Courier Comparison', 'NDR Management', 'COD Remittance', 'Tracking Page'].map(label => ({ label, to: label === 'Rate Calculator' ? '/rate-calculator' : undefined })) },
  { title: 'Company', links: ['About Us', 'Careers', 'Partner Program', 'Contact Us'].map(label => ({ label, to: label === 'Careers' ? '/careers' : undefined })) },
  { title: 'Integrations', links: ['Shopify', 'WooCommerce', 'API Documentation'].map(label => ({ label })) },
];

const LEGAL_LINKS = [
  { label: 'Terms & Conditions', to: '/terms-and-conditions' },
  { label: 'Privacy Policy', to: '/privacy-policy' },
  { label: 'Refund & Cancellation Policy', to: '/refund-and-cancellation-policy' },
];

/** Phones: open layout — brand and description, social, two-column link groups, contact, then legal. */
function MobileFooter() {
  const [product, company, integrations] = FOOTER_GROUPS;
  const linkCls = 'text-[14.5px] text-white/75 leading-snug active:text-white';
  const group = (g: typeof product) => (
    <div>
      <h4 className="text-[19px] font-bold text-white mb-3.5">{g.title}</h4>
      <ul className="space-y-3.5">
        {g.links.map(l => (
          <li key={l.label}>
            {l.to ? <Link to={l.to} className={linkCls}>{l.label}</Link> : <span className={linkCls}>{l.label}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
  return (
    <div className="md:hidden bg-[#0A0F0D] rounded-t-[32px] px-6 pt-12 pb-[max(1.75rem,env(safe-area-inset-bottom))]">
      <img src="/logo-white.png" alt="QuickPost" className="h-[64px] w-auto object-contain scale-[1.5] origin-left" />
      <p className="mt-5 text-[15.5px] text-white/70 leading-[1.75]">
        QuickPost is a multi-courier shipping platform built for Indian eCommerce. Compare live rates across leading couriers,
        ship to pincodes across India, automate NDR and RTO follow-ups, and get your COD remitted faster — all from one dashboard.
      </p>

      <h4 className="mt-10 text-[21px] font-bold text-white">Follow Us</h4>
      <div className="mt-5 flex items-center gap-7 pl-1">
        {[IconLinkedIn, IconInstagram, IconX, IconYouTube].map((Icon, idx) => (
          <span key={idx} className="text-white [&_svg]:w-[24px] [&_svg]:h-[24px]"><Icon /></span>
        ))}
      </div>

      <div className="mt-12 grid grid-cols-2 gap-x-6">
        <div className="space-y-10">
          {group(company)}
          {group(integrations)}
        </div>
        {group(product)}
      </div>

      <h4 className="mt-12 text-[21px] font-bold text-white">Contact Us</h4>
      <div className="mt-5 space-y-5">
        <a href="mailto:support@quickpost.in" className="flex items-center gap-4">
          <span className="w-7 h-6 rounded-md bg-[#1D9E75] flex items-center justify-center shrink-0"><IconMail size={15} color="#FFFFFF" /></span>
          <span className="text-[16px] text-white/80">support@quickpost.in</span>
        </a>
        <div className="flex items-center gap-4">
          <span className="w-7 h-7 rounded-full bg-[#F59E0B] flex items-center justify-center shrink-0"><IconClock size={15} color="#FFFFFF" /></span>
          <span className="text-[16px] text-white/80">Mon–Sat, 9am–7pm IST</span>
        </div>
      </div>

      <div className="mt-10 mx-2 pt-7 border-t border-white/15 text-center">
        <div className="grid grid-cols-3 items-center">
          {LEGAL_LINKS.map((l, idx) => (
            <Link key={l.label} to={l.to} className={`px-2 text-[14px] leading-snug text-white/75 active:text-white ${idx > 0 ? 'border-l border-white/30' : ''}`}>{l.label}</Link>
          ))}
        </div>
        <p className="mt-7 text-[15px] text-white/75">© 2026 Quickpost. All rights reserved.</p>
      </div>
    </div>
  );
}

export function Footer({ hideCta = false }: { hideCta?: boolean }) {
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
    <footer ref={footerRef} className="overflow-hidden bg-transparent" style={{ fontFamily: 'Roboto, sans-serif' }}>
      
      {/* ================= ZONE 1: CTA STRIP ================= */}
      {!hideCta && <div className="bg-[#1D9E75] footer-zone-1 relative z-10 border-b border-white/15">
        <div className="max-w-[1200px] mx-auto px-5 md:px-0 py-[28px] md:py-[48px] flex flex-col md:flex-row items-center">
          {/* LEFT: 55% */}
          <div className="w-full md:w-[55%] text-center md:text-left mb-5 md:mb-0 footer-cta-left">
            <h2 className="text-[20px] md:text-[32px] font-bold text-white leading-[1.25] m-0">
              Start Shipping Smarter Today
            </h2>
            <p className="text-[13px] md:text-[16px] font-normal text-white/80 mt-2 m-0">
              No setup fees. No contracts. Go live in under 10 minutes.
            </p>
          </div>

          {/* RIGHT: 45% */}
          <div className="w-full md:w-[45%] flex flex-col items-center md:items-end footer-cta-right">
            <Link to="/#signup" className="w-full md:w-auto inline-block text-center bg-white text-[#1D9E75] font-bold text-[14px] md:text-[15px] px-[24px] md:px-[32px] py-[13px] md:py-[16px] rounded-[10px] border-none hover:bg-[#F0FAF5] hover:-translate-y-[2px] transition-all duration-200 ease-in-out cursor-pointer">
              Get Started &rarr;
            </Link>
            <Link to="/login" className="block text-[12px] md:text-[13px] font-normal text-white/75 mt-[8px] hover:underline hover:text-white text-center md:text-right">
              Already have an account? Log in
            </Link>
          </div>
        </div>
      </div>}

      {/* ================= ZONE 2: MAIN FOOTER COLUMNS ================= */}
      <MobileFooter />

      <div className="hidden md:block bg-[#0A0F0D] rounded-t-[40px] footer-zone-2">
        <div className="max-w-[1240px] mx-auto px-10 pt-[72px] pb-[56px]">
          <div className="grid grid-cols-[1.35fr_1fr_1fr_1fr] gap-12">

            {/* Brand + reach us */}
            <div className="footer-col">
              <img src="/logo-white.png" alt="QuickPost" className="h-[56px] w-auto object-contain scale-[1.45] origin-left" />
              <p className="mt-5 max-w-[300px] text-[14px] leading-[1.7] text-white/60">
                Multi-courier shipping for Indian eCommerce, from booking to COD remittance, in one dashboard.
              </p>
              <div className="mt-6 flex items-center gap-2.5">
                {[IconLinkedIn, IconInstagram, IconX, IconYouTube].map((Icon, idx) => (
                  <span key={idx} className="w-10 h-10 rounded-full bg-white text-[#0A0F0D] flex items-center justify-center transition-transform duration-200 hover:-translate-y-0.5">
                    <Icon />
                  </span>
                ))}
              </div>

              <h4 className="mt-10 text-[20px] font-semibold text-white">Reach Us At</h4>
              <ul className="mt-4 space-y-3.5">
                <li>
                  <a href="mailto:support@quickpost.in" className="group flex items-center gap-3 text-[15px] text-white/80 hover:text-white">
                    <span className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0"><IconMail size={16} color="#FFFFFF" /></span>
                    support@quickpost.in
                  </a>
                </li>
                <li className="flex items-center gap-3 text-[15px] text-white/80">
                  <span className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0"><IconClock size={16} color="#FFFFFF" /></span>
                  Mon–Sat, 9am–7pm IST
                </li>
              </ul>
            </div>

            {/* Link groups */}
            {FOOTER_GROUPS.map(g => (
              <div key={g.title} className="footer-col">
                <h4 className="text-[20px] font-semibold text-white">{g.title}</h4>
                <ul className="mt-5 space-y-3.5">
                  {g.links.map(l => (
                    <li key={l.label}>
                      {l.to ? (
                        <Link to={l.to} className="relative text-[15px] text-white/75 hover:text-white transition-colors after:absolute after:left-0 after:-bottom-0.5 after:h-px after:w-0 after:bg-[#34D399] after:transition-all hover:after:w-full">{l.label}</Link>
                      ) : (
                        <span className="text-[15px] text-white/75">{l.label}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="footer-zone-3 border-t border-white/10">
          <div className="max-w-[1240px] mx-auto px-10 py-6 flex items-center justify-between gap-6">
            <p className="text-[13.5px] text-white/50">© 2026 Quickpost. All rights reserved.</p>
            <div className="flex items-center gap-6">
              {LEGAL_LINKS.map(l => (
                <Link key={l.label} to={l.to} className="text-[13.5px] text-white/60 hover:text-white transition-colors">{l.label}</Link>
              ))}
            </div>
          </div>
        </div>
      </div>

    </footer>
  );
}
