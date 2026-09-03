import React from 'react';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import heroImg from '../../assets/hero-image.png';

interface AuthHeroLayoutProps {
  children: ReactNode;
  showInlineLogo?: boolean;
}

export function AuthHeroLayout({ children, showInlineLogo = true }: AuthHeroLayoutProps) {
  return (
    <section className={`relative min-h-screen bg-[#00A86B] overflow-hidden pb-16 ${showInlineLogo ? 'pt-8' : 'pt-[88px]'}`}>
      <div className="container mx-auto px-6 md:px-12 max-w-7xl">
        {/* Header / Logo — hidden when the page Navbar handles branding.
            Same logo image the Navbar uses (white variant, for contrast
            against this section's solid green background) — this used to be
            a hand-drawn placeholder SVG + text that didn't match the real
            brand mark shown everywhere else. */}
        {showInlineLogo && (
          <div className="flex items-center mb-8 md:mb-0">
            {/* Same base size + scale as the Navbar logo (64px, scaled 1.5x
                to ~96px) — matching it exactly rather than guessing a size. */}
            <img
              src="/logo-white.png"
              alt="Quickpost"
              className="object-contain scale-[1.5] origin-left"
              style={{ height: '64px', width: 'auto', filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.18)) brightness(1.1)' }}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center mt-4">
          
          {/* Left Column */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col text-white"
          >
            {/* Image Container */}
            <div className="relative w-full max-w-md mx-auto lg:mx-0 mb-8 flex justify-center">
               <div className="w-80 h-80 sm:w-96 sm:h-96 rounded-full bg-[#009B63] flex items-center justify-center relative overflow-hidden shadow-xl ring-4 ring-[#00A86B]">
                 <img src={heroImg} alt="Delivery Executive" className="w-full h-full object-cover object-center" />
               </div>
            </div>

            <div className="max-w-xl">
              <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-black tracking-[-0.035em] leading-[1.1] mb-6 drop-shadow-[0_4px_12px_rgba(0,0,0,0.06)]">
                <motion.span
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -2, scale: 1.02 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
                  className="inline-block mr-2 cursor-default"
                >
                  <span className="italic font-bold text-[#A3FFE0] select-none">Ship</span>{" "}
                  <span className="font-black text-white">Smarter.</span>
                </motion.span>

                <motion.span
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -2, scale: 1.02 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                  className="inline-block mr-2 cursor-default"
                >
                  <span className="italic font-bold text-[#A3FFE0] select-none">Deliver</span>{" "}
                  <span className="font-black text-white">Faster.</span>
                </motion.span>
                
                <br className="hidden sm:inline" />

                <motion.span
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -2, scale: 1.02 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.45 }}
                  className="inline-block cursor-default"
                >
                  <span className="italic font-bold text-[#A3FFE0] select-none">Grow</span>{" "}
                  <span className="font-black text-white">Without Limits.</span>
                </motion.span>
              </h1>
              
              <p className="text-white/90 text-lg mb-8 max-w-lg">
                Join thousands of sellers using <span className="font-bold">Quickpost</span> to automate shipping, reduce costs, and deliver exceptional customer experiences.
              </p>

              <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm font-medium">
                {[
                  "No setup fees",
                  "Instant onboarding",
                  "PAN India coverage"
                ].map((bullet, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    <span className="italic text-white/90">{bullet}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right Column: Form passed as children */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-[500px] lg:ml-auto"
          >
            {children}
          </motion.div>
          
        </div>
      </div>
    </section>
  );
}
