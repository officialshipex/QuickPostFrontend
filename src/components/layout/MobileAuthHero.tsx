import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import heroImg from '../../assets/hero-image.png';

interface MobileAuthHeroProps {
  ctaLabel: string;
  renderForm: (onBack: () => void) => React.ReactNode;
  /** Skip the hero and show the form immediately (e.g. deep-linked from "Get Started"). */
  initialShowForm?: boolean;
  /** Replaces the default photo + tagline hero (the landing page uses its carousel); gets the "start" action. */
  renderHero?: (start: () => void) => React.ReactNode;
}

/**
 * Mobile-only auth entry point: hero image + tagline + CTA button.
 * Tapping the CTA smoothly swaps in the form (signup or login) passed via renderForm.
 * Desktop keeps its own separate layout (AuthHeroLayout + flip card / plain card).
 */
export function MobileAuthHero({ ctaLabel, renderForm, initialShowForm = false, renderHero }: MobileAuthHeroProps) {
  const [showForm, setShowForm] = useState(initialShowForm);

  // Same fix as HeroSection's flip card — useState's initial value doesn't
  // re-sync if this prop changes after mount (e.g. hash updates to #signup
  // without a remount), so a same-page "Get Started" click would otherwise
  // never actually reveal the form here either.
  useEffect(() => {
    if (initialShowForm) setShowForm(true);
  }, [initialShowForm]);

  return (
    <section className={`md:hidden pb-10 overflow-hidden transition-colors duration-300 ${renderHero && !showForm ? 'bg-[#F7F8F6] pt-[96px] px-5' : 'bg-[#00A86B] pt-[88px] px-4'}`}>
      <AnimatePresence mode="wait" initial={false}>
        {!showForm && renderHero ? (
          <motion.div
            key="custom-hero"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            {renderHero(() => setShowForm(true))}
          </motion.div>
        ) : !showForm ? (
          <motion.div
            key="hero"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="text-center text-white"
          >
            <div className="w-44 h-44 rounded-full bg-[#009B63] mx-auto mb-6 overflow-hidden ring-4 ring-white/20 shadow-xl">
              <img src={heroImg} alt="Delivery Executive" className="w-full h-full object-cover object-center" />
            </div>

            <h1 className="text-[26px] font-black tracking-[-0.03em] leading-[1.2] mb-4 font-sans">
              <span className="italic font-bold text-[#A3FFE0]">Ship</span> Smarter.{' '}
              <span className="italic font-bold text-[#A3FFE0]">Deliver</span> Faster.{' '}
              <span className="italic font-bold text-[#A3FFE0]">Grow</span> Without Limits.
            </h1>
            <p className="text-white/90 text-sm mb-5 max-w-md mx-auto font-sans">
              Join thousands of sellers using <span className="font-bold">Quickpost</span> to automate shipping, reduce costs, and deliver exceptional customer experiences.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-medium font-sans mb-8">
              {['No setup fees', 'Instant onboarding', 'PAN India coverage'].map((bullet, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  <span className="italic text-white/90">{bullet}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowForm(true)}
              className="w-full max-w-xs mx-auto flex items-center justify-center gap-2 h-12 bg-white text-[#00A86B] font-bold text-[15px] rounded-full shadow-[0_10px_24px_-8px_rgba(0,0,0,0.3)] hover:bg-[#F0FAF5] active:scale-[0.98] transition-all font-sans"
            >
              {ctaLabel}
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            {renderForm(() => setShowForm(false))}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
