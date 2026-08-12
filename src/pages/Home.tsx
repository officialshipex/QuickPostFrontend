import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { HeroSection } from '../components/sections/HeroSection';
import { TrustedBrands } from '../components/sections/TrustedBrands';
import { Features } from '../components/sections/Features';
import { ProfitsSection } from '../components/sections/ProfitsSection';
import { HowItWorks } from '../components/sections/HowItWorks';
import { ServicesPortfolioSection } from '../components/sections/ServicesPortfolioSection';
import { StatsSection } from '../components/sections/StatsSection';

export function Home() {
  const location = useLocation();
  const heroRef = useRef<HTMLDivElement>(null);
  const openSignup = location.hash === '#signup';

  useEffect(() => {
    if (openSignup) heroRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [openSignup]);

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-secondary selection:bg-[#00A86B]/20 selection:text-[#00A86B]">
      <Navbar />
      <main className="flex-1">
        <div ref={heroRef}>
          <HeroSection openSignupOnMount={openSignup} />
        </div>
        <TrustedBrands />
        <Features />
        <ProfitsSection />
        <HowItWorks />
        <ServicesPortfolioSection />
        <StatsSection />
      </main>
      <Footer />
    </div>
  );
}
