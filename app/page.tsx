'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Hero } from '@/components/sections/Hero';
import { MarketTicker } from '@/components/sections/MarketTicker';
import { MarketData } from '@/components/sections/MarketData';
import { TradingViewChart } from '@/components/sections/TradingViewChart';
import { InvestmentPlans } from '@/components/sections/InvestmentPlans';
import { Testimonials } from '@/components/sections/Testimonials';
import { ReferralSection } from '@/components/sections/ReferralSection';
import { WhyUsSection } from '@/components/sections/WhyUsSection';

export default function HomePage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);
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
              <div className="w-20 h-20 rounded-3xl bg-blue-600 flex items-center justify-center glow-blue shadow-2xl">
                <TrendingUp size={40} className="text-white" />
              </div>
              <div className="flex flex-col items-center">
                <h1 className="text-3xl font-bold tracking-tight">
                  <span className="text-white">Goldcrest</span>
                  <span className="gradient-text">Broker</span>
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

      <main className="min-h-screen">
        <Navbar />
        <Hero />
        <MarketTicker />
        <MarketData />
        <TradingViewChart />
        <InvestmentPlans />
        <WhyUsSection />
        <ReferralSection />
        <Testimonials />
        <Footer />
      </main>
    </>
  );
}

