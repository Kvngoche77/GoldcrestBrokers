'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Hero } from '@/components/sections/Hero';
import { MarketTicker } from '@/components/sections/MarketTicker';
import { MarketData } from '@/components/sections/MarketData';
import { TradingViewFeatures } from '@/components/sections/TradingViewFeatures';
import { ProfitCalculatorSection } from '@/components/sections/ProfitCalculatorSection';
import { InvestmentPlans } from '@/components/sections/InvestmentPlans';
import { Testimonials } from '@/components/sections/Testimonials';
import { ReferralSection } from '@/components/sections/ReferralSection';
import { WhyUsSection } from '@/components/sections/WhyUsSection';
import { WhatIsBrokerage } from '@/components/sections/WhatIsBrokerage';
import { HowInvestingWorks } from '@/components/sections/HowInvestingWorks';
import { AnimatedBackground } from '@/components/ui/AnimatedBackground';
import { WithdrawalPopup } from '@/components/ui/WithdrawalPopup';
import { supabase } from '@/lib/supabase';
import type { InvestmentPlan } from '@/types';

const STATIC_PLANS: InvestmentPlan[] = [
  {
    id: 'starter-premier',
    name: 'Starter Premier Plan',
    description: 'Ideal for beginners starting their investment journey',
    min_amount: 500,
    max_amount: 1999,
    daily_roi_percent: 2.0,
    duration_days: 20,
    total_roi_percent: 40,
    referral_bonus_percent: 5,
    features: ['Daily profit payouts', '24/7 Support', 'Standard analytics'],
    sort_order: 1,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'silver',
    name: 'Silver Plan',
    description: 'Accelerated growth for medium-term investors',
    min_amount: 2000,
    max_amount: 5500,
    daily_roi_percent: 3.0,
    duration_days: 21,
    total_roi_percent: 63,
    referral_bonus_percent: 7,
    features: ['Daily profit payouts', 'Priority support', 'Advanced charts'],
    sort_order: 2,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'gold',
    name: 'Gold Plan',
    description: 'High-yield returns for serious capital growth',
    min_amount: 5600,
    max_amount: 15000,
    daily_roi_percent: 4.0,
    duration_days: 45,
    total_roi_percent: 180,
    referral_bonus_percent: 10,
    features: ['Daily profit payouts', 'Dedicated manager', 'Market insights'],
    sort_order: 3,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'diamond',
    name: 'Diamond Plan',
    description: 'Premium returns for high-net-worth individuals',
    min_amount: 15100,
    max_amount: 25000,
    daily_roi_percent: 5.0,
    duration_days: 60,
    total_roi_percent: 300,
    referral_bonus_percent: 12,
    features: ['Daily profit payouts', 'VIP analytics', 'Exclusive events'],
    sort_order: 4,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'executive',
    name: 'Executive Plan',
    description: 'Elite investment tier with maximum profitability',
    min_amount: 25100,
    max_amount: 35000,
    daily_roi_percent: 6.0,
    duration_days: 90,
    total_roi_percent: 540,
    referral_bonus_percent: 15,
    features: ['Daily profit payouts', 'Executive advisor', 'Custom strategies'],
    sort_order: 5,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'vip',
    name: 'VIP Plan',
    description: 'Unparalleled investment experience and returns',
    min_amount: 36000,
    max_amount: 100000,
    daily_roi_percent: 8.0,
    duration_days: 120,
    total_roi_percent: 960,
    referral_bonus_percent: 20,
    features: ['Daily profit payouts', 'Full concierge service', 'Maximum leverage'],
    sort_order: 6,
    is_active: true,
    created_at: new Date().toISOString()
  }
];

async function fetchPlans(): Promise<InvestmentPlan[]> {
  try {
    const { data } = await supabase
      .from('investment_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');
    return (data?.length ? data : STATIC_PLANS) as InvestmentPlan[];
  } catch {
    return STATIC_PLANS;
  }
}

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<InvestmentPlan[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);

    fetchPlans().then(setPlans);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <AnimatePresence>
        {loading && (
          <motion.div
            key="loader"
            className="fixed inset-0 z-[100] bg-[#040c18] flex flex-col items-center justify-center"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center gap-6"
            >
              <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center glow-blue shadow-2xl mb-2">
                <svg viewBox="0 0 24 24" className="w-12 h-12 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <div className="flex flex-col items-center">
                <h1 className="text-4xl font-black tracking-tight flex flex-col items-center">
                  <span className="text-white">GOLDCREST</span>
                  <span className="text-sm tracking-[0.3em] text-blue-400 uppercase font-bold mt-1">Broker</span>
                </h1>
                <div className="mt-4 w-48 h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-blue-600"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2.8, ease: "linear" }}
                  />
                </div>
                <p className="mt-3 text-slate-500 text-sm font-medium animate-pulse">Loading secure environment...</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatedBackground />

      <main className="relative min-h-screen">
        <Navbar />
        <Hero />
        <MarketTicker />
        <MarketData />
        <WhatIsBrokerage />
        <TradingViewFeatures />
        <HowInvestingWorks />
        {plans.length > 0 && <ProfitCalculatorSection plans={plans} />}
        <InvestmentPlans />
        <WhyUsSection />
        <ReferralSection />
        <Testimonials />
        <Footer />
      </main>
      <WithdrawalPopup />
    </>
  );
}

