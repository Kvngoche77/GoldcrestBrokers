import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Hero } from '@/components/sections/Hero';
import { MarketTicker } from '@/components/sections/MarketTicker';
import { MarketData } from '@/components/sections/MarketData';
import { InvestmentPlans } from '@/components/sections/InvestmentPlans';
import { Testimonials } from '@/components/sections/Testimonials';
import { ReferralSection } from '@/components/sections/ReferralSection';
import { WhyUsSection } from '@/components/sections/WhyUsSection';

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <MarketTicker />
      <MarketData />
      <InvestmentPlans />
      <WhyUsSection />
      <ReferralSection />
      <Testimonials />
      <Footer />
    </main>
  );
}
