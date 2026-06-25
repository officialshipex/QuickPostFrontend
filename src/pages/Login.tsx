import React from 'react';
import { AuthHeroLayout } from '../components/layout/AuthHeroLayout';
import { LoginCard } from '../components/forms/LoginCard';
import { TrustedBrands } from '../components/sections/TrustedBrands';
import { Features } from '../components/sections/Features';
import { StatsSection } from '../components/sections/StatsSection';
import { Footer } from '../components/layout/Footer';

export function Login() {
  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-secondary selection:bg-[#00A86B]/20 selection:text-[#00A86B]">
      <main className="flex-1">
        <AuthHeroLayout>
          <LoginCard />
        </AuthHeroLayout>
        <TrustedBrands />
        <Features />
        <StatsSection />
      </main>
      <Footer />
    </div>
  );
}
