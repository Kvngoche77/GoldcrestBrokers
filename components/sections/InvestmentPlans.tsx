'use client';

import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Check, TrendingUp, ChevronRight, Zap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
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

const planColors: Record<number, { accent: string; glow: string; badge: string }> = {
  0: { accent: 'border-slate-500/30 hover:border-slate-400/50', glow: '', badge: 'bg-slate-500/20 text-slate-300' },
  1: { accent: 'border-blue-500/40 hover:border-blue-400/60', glow: '', badge: 'bg-blue-500/20 text-blue-300' },
  2: { accent: 'border-emerald-500/40 hover:border-emerald-400/60', glow: 'ring-1 ring-emerald-500/20', badge: 'bg-emerald-500/20 text-emerald-300' },
  3: { accent: 'border-amber-500/40 hover:border-amber-400/60', glow: '', badge: 'bg-amber-500/20 text-amber-300' },
  4: { accent: 'border-purple-500/40 hover:border-purple-400/60', glow: '', badge: 'bg-purple-500/20 text-purple-300' },
  5: { accent: 'border-red-500/40 hover:border-red-400/60', glow: 'ring-1 ring-red-500/20', badge: 'bg-red-500/20 text-red-300' },
};

export function InvestmentPlans() {
  const { user } = useAuth();
  const router = useRouter();
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['investment-plans'],
    queryFn: fetchPlans,
  });

  const handleSelectPlan = (planId: string) => {
    if (!user) {
      router.push('/auth/register');
      return;
    }
    router.push(`/dashboard/invest?plan=${planId}`);
  };

  return (
    <section id="plans" className="py-24 bg-[#040b15]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 glass rounded-full text-sm text-blue-400 border border-blue-500/20 mb-4">
            <TrendingUp size={14} />
            <span>Investment Plans</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Choose Your <span className="gradient-text">Growth Plan</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Asset-backed plans with daily ROI payouts. Diversify across tiers to maximize your portfolio.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="glass rounded-2xl p-6 h-[400px]">
                  <div className="shimmer h-6 w-24 rounded mb-3" />
                  <div className="shimmer h-10 w-32 rounded mb-4" />
                  <div className="space-y-2">
                    {[0, 1, 2, 3].map((j) => <div key={j} className="shimmer h-4 rounded" />)}
                  </div>
                </div>
              ))
            : plans.map((plan, idx) => {
                const colors = planColors[idx] ?? planColors[0];
                const isPopular = idx === 2;
                return (
                  <motion.div
                    key={plan.id}
                    className={`relative glass rounded-2xl p-8 border card-hover transition-all flex flex-col ${colors.accent} ${colors.glow}`}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 rounded-full text-xs font-semibold text-white">
                          <Zap size={11} /> Most Popular
                        </div>
                      </div>
                    )}

                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-lg ${colors.badge}`}>
                          {plan.name}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">{plan.referral_bonus_percent}% Bonus</span>
                      </div>
                      <div className="flex items-baseline gap-1 mt-4">
                        <span className="text-5xl font-bold text-white tracking-tight">{plan.daily_roi_percent}%</span>
                        <span className="text-slate-400 text-sm font-medium">/ day</span>
                      </div>
                      <p className="text-sm text-slate-400 mt-2 font-medium">
                        {plan.total_roi_percent}% total over {plan.duration_days} days
                      </p>
                    </div>

                    <div className="bg-white/[0.03] rounded-xl p-4 mb-6 border border-white/[0.05]">
                      <div className="text-xs text-slate-400 mb-1 uppercase tracking-widest font-bold">Investment Range</div>
                      <div className="text-lg font-bold text-white">
                        ${plan.min_amount.toLocaleString()}
                        {plan.max_amount
                          ? ` — $${plan.max_amount.toLocaleString()}`
                          : '+'}
                      </div>
                    </div>

                    <ul className="space-y-3 mb-8 flex-grow">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-3 text-sm text-slate-300">
                          <div className="mt-1 w-4 h-4 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                            <Check size={10} className="text-emerald-400" />
                          </div>
                          <span className="leading-tight">{f}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => handleSelectPlan(plan.id)}
                      className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 group ${
                        isPopular
                          ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20'
                          : 'bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/10'
                      }`}
                    >
                      Choose {plan.name}
                      <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </motion.div>
                );
              })}
        </div>
      </div>
    </section>
  );
}
