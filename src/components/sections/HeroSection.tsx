import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AuthHeroLayout } from '../layout/AuthHeroLayout';
import { MobileAuthHero } from '../layout/MobileAuthHero';
import { SignupCard } from '../forms/SignupCard';
import { SignupCardMobile } from '../forms/SignupCardMobile';
import { LiveLogisticsConsole } from './LiveLogisticsConsole';

interface HeroSectionProps {
  /** Skip straight to the signup form (e.g. deep-linked from a "Get Started" CTA elsewhere on the page). */
  openSignupOnMount?: boolean;
}

export function HeroSection({ openSignupOnMount = false }: HeroSectionProps) {
  const [showSignup, setShowSignup] = useState(openSignupOnMount);

  return (
    <>
      {/* Mobile: hero image + tagline + "Get Started" CTA, which smoothly reveals the signup form */}
      <MobileAuthHero
        ctaLabel="Get Started"
        renderForm={(onBack) => <SignupCardMobile onBack={onBack} />}
        initialShowForm={openSignupOnMount}
      />

      {/* Desktop: 3D flip card (Live Logistics Console <-> Signup) inside AuthHeroLayout */}
      <div className="hidden md:block">
        <AuthHeroLayout showInlineLogo={false}>
          <>
            {/* 3D Flip Card Styles */}
            <style>{`
              .perspective-1000 {
                perspective: 1000px;
              }
              .preserve-3d {
                transform-style: preserve-3d;
              }
              .backface-hidden {
                backface-visibility: hidden;
                -webkit-backface-visibility: hidden;
              }
              .rotate-y-180 {
                transform: rotateY(180deg);
              }
            `}</style>

            <div className="relative w-full h-[580px] perspective-1000">
              <motion.div
                className="w-full h-full relative preserve-3d"
                animate={{ rotateY: showSignup ? 180 : 0 }}
                transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
              >
                {/* Front Side: Live Logistics Console */}
                <div className="absolute inset-0 backface-hidden w-full h-full">
                  <LiveLogisticsConsole onStart={() => setShowSignup(true)} />
                </div>

                {/* Back Side: Signup Form Card */}
                <div className="absolute inset-0 backface-hidden rotate-y-180 w-full h-full">
                  <SignupCard onBack={() => setShowSignup(false)} />
                </div>
              </motion.div>
            </div>
          </>
        </AuthHeroLayout>
      </div>
    </>
  );
}
