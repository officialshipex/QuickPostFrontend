import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const navLinks = [
  { label: 'Platform', href: '#features', badge: null },
  { label: 'Solutions', href: '#services-portfolio', badge: null },
  { label: 'Pricing', href: '#pricing', badge: null },
  { label: 'Track Order', href: '/track', badge: 'Live' },
];

export function Navbar() {
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 60);
    if (latest > 60) setMobileOpen(false);
  });

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

        .qp-logo-white {
          filter: drop-shadow(0 1px 4px rgba(0,0,0,0.18)) brightness(1.1);
        }
      `}</style>

      <motion.header
        style={{ fontFamily: 'Roboto, sans-serif' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-350 ${
          isScrolled
            ? 'bg-white shadow-[0_2px_24px_rgba(0,0,0,0.07)] border-b border-slate-100'
            : 'bg-black/10 backdrop-blur-md'
        }`}
        initial={{ y: -90, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-10 h-[78px] flex items-center justify-between gap-6">

          {/* ── Logo ── */}
          <Link to="/" className="flex-shrink-0 flex items-center">
            <img
              src={isScrolled ? '/logo-color.png' : '/logo-white.png'}
              alt="QuickPost"
              className={`object-contain transition-all duration-300 scale-[1.5] origin-left ml-2 ${isScrolled ? '' : 'qp-logo-white'}`}
              style={{
                height: '64px',
                width: 'auto',
                objectFit: 'contain',
              }}
            />
          </Link>

          {/* ── Desktop Nav ── */}
          <nav className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={`qp-nav-link flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13.5px] font-medium tracking-[-0.01em] transition-colors duration-200 ${
                  isScrolled
                    ? 'qp-nav-link-dark text-[#4A5568] hover:text-[#0F172A] hover:bg-slate-50'
                    : 'qp-nav-link-light text-white/85 hover:text-white hover:bg-white/10'
                }`}
              >
                {link.label}
                {link.badge && (
                  <span className="text-[10px] font-bold px-1.5 py-[2px] rounded-full bg-[#00A86B] text-white leading-none">
                    {link.badge}
                  </span>
                )}
              </a>
            ))}
          </nav>

          {/* ── Desktop CTAs ── */}
          <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
            {/* Vertical separator */}
            <div className={`w-px h-5 ${isScrolled ? 'bg-slate-200' : 'bg-white/20'}`} />

            <Link
              to="/login"
              className={`px-5 py-[9px] rounded-xl text-[13.5px] font-semibold border transition-all duration-200 ${
                isScrolled
                  ? 'border-[#D1D5DB] text-[#374151] hover:border-slate-400 hover:bg-slate-50'
                  : 'border-white/35 text-white hover:bg-white/10 hover:border-white/65'
              }`}
            >
              Log In
            </Link>

            <Link
              to="/login"
              className="qp-cta-primary px-5 py-[9px] rounded-xl text-[13.5px] font-bold text-white tracking-[-0.01em]"
            >
              Get Started Free&nbsp;→
            </Link>
          </div>

          {/* ── Mobile Hamburger ── */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className={`lg:hidden flex items-center justify-center w-10 h-10 rounded-xl transition-colors ${
              isScrolled
                ? 'text-slate-700 hover:bg-slate-100'
                : 'text-white hover:bg-white/10'
            }`}
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
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </motion.div>
            </AnimatePresence>
          </button>
        </div>

        {/* ── Mobile Menu ── */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className={`lg:hidden overflow-hidden border-t ${
                isScrolled
                  ? 'bg-white border-slate-100'
                  : 'bg-[#006B44]/95 backdrop-blur-2xl border-white/10'
              }`}
            >
              <div className="max-w-7xl mx-auto px-5 py-4 flex flex-col gap-1">
                {navLinks.map((link, i) => (
                  <motion.a
                    key={link.label}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.22, delay: i * 0.05 }}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-[14px] font-medium transition-colors ${
                      isScrolled
                        ? 'text-[#4A5568] hover:text-[#0F172A] hover:bg-slate-50'
                        : 'text-white/85 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {link.label}
                    {link.badge && (
                      <span className="text-[10px] font-bold px-1.5 py-[2px] rounded-full bg-[#00A86B] text-white">
                        {link.badge}
                      </span>
                    )}
                  </motion.a>
                ))}

                <div className={`flex flex-col gap-2.5 mt-3 pt-3 border-t ${isScrolled ? 'border-slate-100' : 'border-white/15'}`}>
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className={`w-full text-center px-5 py-3 rounded-xl text-[14px] font-semibold border transition-all ${
                      isScrolled
                        ? 'border-[#D1D5DB] text-[#374151] hover:bg-slate-50'
                        : 'border-white/30 text-white hover:bg-white/10'
                    }`}
                  >
                    Log In
                  </Link>
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="qp-cta-primary w-full text-center px-5 py-3 rounded-xl text-[14px] font-bold text-white"
                  >
                    Get Started Free →
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </>
  );
}
