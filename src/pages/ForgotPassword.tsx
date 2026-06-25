import React from 'react';
import { AuthHeroLayout } from '../components/layout/AuthHeroLayout';
import { ForgotPasswordCard } from '../components/forms/ForgotPasswordCard';
import { StatsSection } from '../components/sections/StatsSection';
import { Footer } from '../components/layout/Footer';

export function ForgotPassword() {
  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-secondary selection:bg-[#00A86B]/20 selection:text-[#00A86B]">
      <main className="flex-1">
        <AuthHeroLayout>
          <ForgotPasswordCard />
        </AuthHeroLayout>
        <StatsSection />
      </main>
      <Footer />
    </div>
  );
}
