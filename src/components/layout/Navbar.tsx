import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Menu, X, ChevronRight } from 'lucide-react';
import { appUrl } from '../../utils/domainUrl';
import { FestiveOfferBar, FESTIVE_BAR_HEIGHT, FESTIVE_BAR_HEIGHT_DESKTOP } from './FestiveOfferBar';

const navLinks = [
  { label: 'Platform', href: '#features', badge: null },
  { label: 'Rate Calculator', href: '/rate-calculator', badge: null },
  { label: 'Pricing', href: '#features', badge: null },
  { label: 'Track Order', href: '/track', badge: 'Live' },
];

export function Navbar() {
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  // Mobile festive strip above the navbar; closing it lasts for this visit
  const [offerClosed, setOfferClosed] = useState(() => { try { return sessionStorage.getItem('qp_festive_bar_closed') === '1'; } catch { return false; } });
  const closeOffer = () => { setOfferClosed(true); try { sessionStorage.setItem('qp_festive_bar_closed', '1'); } catch { /* ignore */ } };

  // Desktop: once the hero is behind us the bar turns into a floating capsule
  const [floating, setFloating] = useState(false);
  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 60);
    setFloating(latest > window.innerHeight * 0.75);
  });

  // Full-screen mobile menu: lock page scroll and close on Esc while it is open.
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [mobileOpen]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setMobileOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      <style>{`
        .qp-nav-link {
          position: relative;
          overflow: hidden;
        }
        .qp-nav-link::after {
          content: '';
          position: absolute;
          bottom: 4px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 2px;
          border-radius: 99px;
          transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .qp-nav-link:hover::after {
          width: 60%;
        }
        .qp-nav-link-dark::after  { background: #00A86B; }
        .qp-nav-link-light::after { background: rgba(255,255,255,0.7); }

        .qp-cta-primary {
          background: linear-gradient(135deg, #00A86B 0%, #00C47A 100%);
          box-shadow: 0 2px 14px rgba(0, 168, 107, 0.38);
          transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
        }
        .qp-cta-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 22px rgba(0, 168, 107, 0.48);
          filter: brightness(1.06);
        }
        .qp-cta-primary:active {
          transform: translateY(0);
        }

        @media only screen and (max-width: 992px) {
          .qp-nav-logo-sm { width: 130px; height: auto; }
        }
        .qp-logo-white {
          filter: drop-shadow(0 1px 4px rgba(0,0,0,0.18)) brightness(1.1);
        }
      `}</style>

      <motion.header
        style={{ fontFamily: 'Roboto, sans-serif' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-350 max-lg:!bg-transparent max-lg:!shadow-none max-lg:!border-0 max-lg:!backdrop-blur-none lg:!bg-transparent lg:!shadow-none lg:!border-transparent lg:!backdrop-blur-none ${
          isScrolled
            ? 'bg-white shadow-[0_2px_24px_rgba(0,0,0,0.07)] border-b border-slate-100'
            : 'bg-black/10 backdrop-blur-md'
        }`}
        initial={{ y: -90, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      >
        <FestiveOfferBar hidden={offerClosed || isScrolled} onClose={closeOffer} />
        {/* Phones: the bar is a floating white capsule; from lg it is the full-width bar */}
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 md:px-10 h-[78px] flex items-center justify-between gap-3 sm:gap-6 lg:transition-all lg:duration-500 lg:ease-[cubic-bezier(0.16,1,0.3,1)] ${floating
          ? 'lg:mt-3 lg:max-w-[1180px] lg:h-[66px] lg:!pl-7 lg:!pr-2.5'
          : 'lg:mt-0 lg:max-w-7xl lg:h-[92px]'} lg:relative lg:rounded-full max-lg:mx-3 max-lg:mt-2 max-lg:h-16 max-lg:px-2 max-lg:pl-4 max-lg:rounded-full max-lg:bg-white max-lg:border max-lg:border-slate-200/80 max-lg:shadow-[0_8px_24px_-12px_rgba(15,23,42,0.25)]`}>

          {/* Desktop capsule surface: fades in after the hero, no hard border */}
          <span aria-hidden className={`hidden lg:block absolute inset-0 rounded-full pointer-events-none transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] bg-[linear-gradient(100deg,rgba(236,253,245,0.9)_0%,rgba(255,255,255,0.92)_45%,rgba(240,249,255,0.9)_100%)] backdrop-blur-xl shadow-[0_20px_44px_-22px_rgba(15,23,42,0.38),0_0_0_1px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,0.95)] ${floating ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.98]'}`} />

          {/* ── Logo ── */}
          <Link to="/" className="flex-shrink-0 flex items-center">
            <img
              src="/logo-color.png"
              alt="QuickPost"
              className="qp-nav-logo-sm lg:hidden object-contain"
            />
            <img
              src={floating ? '/logo-color.png' : '/logo-white.png'}
              alt=""
              aria-hidden
              className={`hidden lg:block relative object-contain transition-all duration-500 origin-left ml-2 ${floating ? 'scale-[1.5]' : 'scale-[2.5] translate-x-[48px] qp-logo-white'}`}
              style={{
                height: '64px',
                width: 'auto',
                objectFit: 'contain',
              }}
            />
          </Link>

          {/* ── Desktop Nav ── */}
          <nav className={`hidden lg:flex relative items-center gap-0.5 flex-1 transition-[padding] duration-500 justify-center ${floating ? 'pl-0' : 'pl-[150px]'}`}>
            {navLinks.map((link) => {
              const navLinkClass = `qp-nav-link flex items-center gap-1.5 rounded-full ${floating ? 'px-4 py-2.5 text-[13.5px]' : 'px-5 py-3 text-[15.5px]'} font-medium tracking-[-0.01em] transition-colors duration-200 ${
                floating
                  ? 'qp-nav-link-dark text-[#4A5568] hover:text-[#0F172A] hover:bg-slate-50'
                  : 'qp-nav-link-light text-white/85 hover:text-white hover:bg-white/10'
              }`;
              const content = (
                <>
                  {link.label}
                  {link.badge && (
                    <span className="text-[10px] font-bold px-1.5 py-[2px] rounded-full bg-[#00A86B] text-white leading-none">
                      {link.badge}
                    </span>
                  )}
                </>
              );
              // Real same-app routes (e.g. /rate-calculator) get client-side
              // SPA navigation via Link — a plain <a> to a different path
              // always forces a full browser reload. Pure in-page hash
              // anchors (#features) stay as native <a> tags, which is what
              // gives free native browser scroll-to-anchor behavior.
              return link.href.startsWith('/') ? (
                <Link key={link.label} to={link.href} className={navLinkClass}>
                  {content}
                </Link>
              ) : (
                <a key={link.label} href={link.href} className={navLinkClass}>
                  {content}
                </a>
              );
            })}
          </nav>

          {/* ── Desktop CTAs ── */}
          <div className="hidden lg:flex relative items-center gap-3 flex-shrink-0">
            {/* Vertical separator */}
            {!floating && <div className="w-px h-5 bg-white/20" />}

            <a
              href={appUrl('/login')}
              className={`rounded-full ${floating ? 'px-5 py-[9px] text-[13.5px]' : 'px-6 py-[11px] text-[15px]'} font-semibold border transition-all duration-200 ${
                floating
                  ? 'border-[#D1D5DB] text-[#374151] hover:border-slate-400 hover:bg-slate-50'
                  : 'border-white/35 text-white hover:bg-white/10 hover:border-white/65'
              }`}
            >
              Log In
            </a>

            <Link
              to="/#signup"
              className={`qp-cta-primary rounded-full ${floating ? 'px-6 py-[10px] text-[13.5px]' : 'px-7 py-[12px] text-[15px]'} font-bold text-white tracking-[-0.01em]`}
            >
              Get Started&nbsp;→
            </Link>
          </div>

          {/* ── Mobile: Sign up pill (after the hero) + hamburger ── */}
          <div className="lg:hidden flex items-center gap-2 flex-shrink-0">
          <Link
            to="/#signup"
            className="h-11 px-5 rounded-full bg-[#00A86B] hover:bg-[#009B63] text-white text-[15px] font-semibold tracking-[-0.01em] inline-flex items-center active:scale-[0.96] transition-[transform,background-color] duration-150"
          >
            Sign up
          </Link>
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="lg:hidden flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-full text-[#0F172A] active:bg-slate-100 transition-colors"
            aria-label="Toggle navigation menu"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={mobileOpen ? 'close' : 'open'}
                initial={{ opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 90 }}
                transition={{ duration: 0.15 }}
              >
                {mobileOpen ? <X size={24} /> : <Menu size={26} strokeWidth={2} />}
              </motion.div>
            </AnimatePresence>
          </button>
          </div>
        </div>

      </motion.header>

      {/* Pushes the page down by the festive strip's height on phones (the header itself is fixed) */}
      {!offerClosed && <div aria-hidden className="md:hidden" style={{ height: FESTIVE_BAR_HEIGHT }} />}
      {!offerClosed && <div aria-hidden className="hidden md:block" style={{ height: FESTIVE_BAR_HEIGHT_DESKTOP }} />}

      {/* ── Mobile Menu — full-screen sheet ── */}
      {createPortal(
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              key="qp-mobile-menu"
              role="dialog"
              aria-modal="true"
              aria-label="Main menu"
              className="lg:hidden fixed inset-0 z-[100] bg-white flex flex-col"
              style={{ fontFamily: 'Roboto, sans-serif' }}
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Header */}
              <div className="h-[78px] px-4 sm:px-6 flex items-center justify-between shrink-0 border-b border-slate-100">
                <Link to="/" onClick={() => setMobileOpen(false)} className="flex items-center">
                  <img src="/logo-color.png" alt="QuickPost" className="object-contain scale-[1.5] origin-left ml-2" style={{ height: '64px', width: 'auto' }} />
                </Link>
                <button
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                  className="w-10 h-10 rounded-full flex items-center justify-center text-[#0F172A] hover:bg-slate-100 active:bg-slate-100 transition-colors"
                >
                  <X size={22} />
                </button>
              </div>

              {/* Links */}
              <nav className="flex-1 overflow-y-auto px-4 sm:px-6 py-2">
                {navLinks.map((link, i) => {
                  const rowClass = 'group flex items-center justify-between gap-3 py-[18px] border-b border-slate-100 text-[17px] font-semibold text-[#0F172A] active:text-[#00A86B]';
                  const content = (
                    <>
                      <span className="flex items-center gap-2">
                        {link.label}
                        {link.badge && (
                          <span className="text-[10px] font-bold px-1.5 py-[2px] rounded-full bg-[#00A86B] text-white leading-none">{link.badge}</span>
                        )}
                      </span>
                      <ChevronRight className="w-5 h-5 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-[#00A86B]" />
                    </>
                  );
                  return (
                    <motion.div
                      key={link.label}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.06 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                    >
                      {/* Real routes use Link (no reload); hash anchors stay native <a> for scroll-to-anchor. */}
                      {link.href.startsWith('/') ? (
                        <Link to={link.href} onClick={() => setMobileOpen(false)} className={rowClass}>{content}</Link>
                      ) : (
                        <a href={link.href} onClick={() => setMobileOpen(false)} className={rowClass}>{content}</a>
                      )}
                    </motion.div>
                  );
                })}
              </nav>

              {/* CTAs */}
              <motion.div
                className="shrink-0 px-4 sm:px-6 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] flex flex-col gap-2.5 border-t border-slate-100"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.06 + navLinks.length * 0.05, ease: [0.16, 1, 0.3, 1] }}
              >
                <Link
                  to="/#signup"
                  onClick={() => setMobileOpen(false)}
                  className="qp-cta-primary w-full h-12 rounded-full flex items-center justify-center text-[15px] font-bold text-white"
                >
                  Get Started
                </Link>
                <a
                  href={appUrl('/login')}
                  onClick={() => setMobileOpen(false)}
                  className="w-full h-12 rounded-full flex items-center justify-center text-[15px] font-semibold border border-[#D1D5DB] text-[#374151] active:bg-slate-50"
                >
                  Log In
                </a>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
