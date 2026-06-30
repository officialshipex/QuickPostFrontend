import React from 'react';
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
  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-secondary selection:bg-[#00A86B]/20 selection:text-[#00A86B]">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
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
