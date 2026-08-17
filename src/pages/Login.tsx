import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthHeroLayout } from '../components/layout/AuthHeroLayout';
import { MobileAuthHero } from '../components/layout/MobileAuthHero';
import { LoginCard } from '../components/forms/LoginCard';
import { TrustedBrands } from '../components/sections/TrustedBrands';
import { Features } from '../components/sections/Features';
import { StatsSection } from '../components/sections/StatsSection';
import { Footer } from '../components/layout/Footer';

export function Login() {
  const navigate = useNavigate();

  // Pressing the browser back button from /login should land on the sign-up
  // form instead of wherever history would otherwise send the user — push a
  // marker entry so back navigation triggers our own redirect via popstate.
  useEffect(() => {
    window.history.pushState({ quickpostLoginGuard: true }, '', window.location.href);
    const handlePopState = () => {
      navigate('/#signup', { replace: true });
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-secondary selection:bg-[#00A86B]/20 selection:text-[#00A86B]">
      <main className="flex-1">
        {/* Mobile: hero image + tagline + "Log In" CTA, which smoothly reveals the login form */}
        <MobileAuthHero
          ctaLabel="Log In"
          renderForm={() => <LoginCard />}
        />

        <div className="hidden md:block">
          <AuthHeroLayout>
            <LoginCard />
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
