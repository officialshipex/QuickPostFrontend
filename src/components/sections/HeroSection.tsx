import React from 'react';
import { AuthHeroLayout } from '../layout/AuthHeroLayout';
import { SignupCard } from '../forms/SignupCard';

export function HeroSection() {
  return (
    <AuthHeroLayout showInlineLogo={false}>
      <SignupCard />
    </AuthHeroLayout>
  );
}
