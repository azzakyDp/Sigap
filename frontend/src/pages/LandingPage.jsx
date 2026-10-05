import React from 'react';
import LandingHeader from '../components/landing/LandingHeader';
import Hero from '../components/landing/Hero';
import HowItWorks from '../components/landing/HowItWorks';
import AIExplainer from '../components/landing/AIExplainer';
import FAQ from '../components/landing/FAQ';
import ClosingCTA from '../components/landing/ClosingCTA';
import LandingFooter from '../components/landing/LandingFooter';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background font-sans text-ink antialiased selection:bg-primary/20 selection:text-primary">
      <LandingHeader />
      <main>
        <Hero />
        <HowItWorks />
        <AIExplainer />
        <FAQ />
        <ClosingCTA />
      </main>
      <LandingFooter />
    </div>
  );
}

export default LandingPage;
