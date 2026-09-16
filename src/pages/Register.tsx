import React from 'react';
import { AuthHeroLayout } from '../components/layout/AuthHeroLayout';
import { MobileAuthHero } from '../components/layout/MobileAuthHero';
import { SignupCard } from '../components/forms/SignupCard';
import { TrustedBrands } from '../components/sections/TrustedBrands';
import { Features } from '../components/sections/Features';
import { StatsSection } from '../components/sections/StatsSection';
import { Footer } from '../components/layout/Footer';

// Standalone route mirroring Login.tsx, so LoginCard's "Sign up" link (and
// any other deep link to registration) has a real page to land on with
// client-side navigation instead of a full-page reload back to the landing
// page's hero flip-card, which was the only place SignupCard previously lived.
export function Register() {
  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-secondary selection:bg-[#00A86B]/20 selection:text-[#00A86B]">
      <main className="flex-1">
        <MobileAuthHero
          ctaLabel="Sign Up"
          renderForm={() => <SignupCard />}
        />

        <div className="hidden md:block">
          <AuthHeroLayout>
            <SignupCard />
          </AuthHeroLayout>
        </div>
        <TrustedBrands />
        <Features />
        <StatsSection />
      </main>
      <Footer />
    </div>
  );
}
