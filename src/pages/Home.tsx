import React, { Suspense, lazy, useEffect, useRef } from 'react';
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
import { OfferPopup } from '../components/sections/OfferPopup';

const ShippingNetworkScene = lazy(() => import('../components/sections/ShippingNetworkScene').then(m => ({ default: m.ShippingNetworkScene })));

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
        <Suspense fallback={<div aria-hidden className="bg-[#F4F6F5] py-[48px] md:py-[80px]"><div className="max-w-[1320px] mx-auto px-4 md:px-8"><div className="min-h-[420px] lg:min-h-[480px]" /></div></div>}>
          <ShippingNetworkScene />
        </Suspense>
        <ProfitsSection />
        <HowItWorks />
        <ServicesPortfolioSection />
        <StatsSection />
      </main>
      <Footer />
      <OfferPopup />
    </div>
  );
}
