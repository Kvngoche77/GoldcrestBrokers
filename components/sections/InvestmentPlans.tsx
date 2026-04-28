'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Check, TrendingUp, Calculator, ChevronRight, Zap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { InvestmentPlan } from '@/types';

async function fetchPlans(): Promise<InvestmentPlan[]> {
  const { data } = await supabase
    .from('investment_plans')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');
  return (data as InvestmentPlan[]) ?? [];
}

const planColors: Record<number, { accent: string; glow: string; badge: string }> = {
  0: { accent: 'border-slate-500/30 hover:border-slate-400/50', glow: '', badge: 'bg-slate-500/20 text-slate-300' },
  1: { accent: 'border-blue-500/40 hover:border-blue-400/60', glow: '', badge: 'bg-blue-500/20 text-blue-300' },
  2: { accent: 'border-emerald-500/40 hover:border-emerald-400/60', glow: 'ring-1 ring-emerald-500/20', badge: 'bg-emerald-500/20 text-emerald-300' },
  3: { accent: 'border-amber-500/40 hover:border-amber-400/60', glow: '', badge: 'bg-amber-500/20 text-amber-300' },
};

function ProfitCalculator({ plans }: { plans: InvestmentPlan[] }) {
  const [selectedPlan, setSelectedPlan] = useState(plans[0]?.id ?? '');
  const [amount, setAmount] = useState(500);

  const plan = plans.find((p) => p.id === selectedPlan);
  const dailyProfit = plan ? (amount * plan.daily_roi_percent) / 100 : 0;
  const totalProfit = plan ? (amount * plan.total_roi_percent) / 100 : 0;
  const totalReturn = amount + totalProfit;

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-5">
        <Calculator size={18} className="text-blue-400" />
        <h3 className="font-semibold text-white">Profit Calculator</h3>
      </div>
      <div className="space-y-4">
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">Investment Amount (USD)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            min={100}
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
          />
          <input
            type="range"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            min={100}
            max={50000}
            step={100}
            className="w-full mt-2 accent-blue-500"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">Select Plan</label>
          <select
            value={selectedPlan}
            onChange={(e) => setSelectedPlan(e.target.value)}
            className="w-full bg-[#0a1628] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50"
          >
            {plans.map((p) => (
              <option key={p.id} value={p.id}>{p.name} — {p.daily_roi_percent}% Daily</option>
            ))}
          </select>
        </div>
        {plan && (
          <div className="bg-white/[0.03] rounded-xl p-4 space-y-3 border border-white/[0.05]">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Daily Profit</span>
              <span className="text-emerald-400 font-semibold">+${dailyProfit.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Total Profit ({plan.duration_days} days)</span>
              <span className="text-emerald-400 font-semibold">+${totalProfit.toFixed(2)}</span>
            </div>
            <div className="h-px bg-white/[0.06]" />
            <div className="flex justify-between text-sm">
              <span className="text-slate-300 font-medium">Total Return</span>
              <span className="text-white font-bold text-base">${totalReturn.toFixed(2)}</span>
            </div>
            <div className="text-center text-xs text-slate-500">
              ROI: {plan.total_roi_percent}% in {plan.duration_days} days
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

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

        {/* Calculator on Top */}
        <div className="max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            {plans.length > 0 && <ProfitCalculator plans={plans} />}
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Plan cards */}
          <div className="lg:col-span-3 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="glass rounded-2xl p-6">
                    <div className="shimmer h-6 w-24 rounded mb-3" />
                    <div className="shimmer h-10 w-32 rounded mb-4" />
                    <div className="space-y-2">
                      {[0, 1, 2].map((j) => <div key={j} className="shimmer h-4 rounded" />)}
                    </div>
                  </div>
                ))
              : plans.map((plan, idx) => {
                  const colors = planColors[idx] ?? planColors[0];
                  const isPopular = idx === 2;
                  return (
                    <motion.div
                      key={plan.id}
                      className={`relative glass rounded-2xl p-6 border card-hover transition-all ${colors.accent} ${colors.glow}`}
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

                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${colors.badge}`}>
                            {plan.name}
                          </span>
                          <span className="text-xs text-slate-500">{plan.referral_bonus_percent}% Referral</span>
                        </div>
                        <div className="flex items-baseline gap-1 mt-3">
                          <span className="text-4xl font-bold text-white">{plan.daily_roi_percent}%</span>
                          <span className="text-slate-400 text-sm">/ day</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {plan.total_roi_percent}% total over {plan.duration_days} days
                        </p>
                      </div>

                      <div className="text-sm text-slate-400 mb-4">
                        <span className="text-white font-medium">${plan.min_amount.toLocaleString()}</span>
                        {plan.max_amount
                          ? ` — $${plan.max_amount.toLocaleString()}`
                          : '+'}
                        <span className="text-xs ml-1">min investment</span>
                      </div>

                      <ul className="space-y-2 mb-6">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                            <Check size={14} className="text-emerald-400 flex-shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>

                      <button
                        onClick={() => handleSelectPlan(plan.id)}
                        className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 group ${
                          isPopular
                            ? 'bg-blue-600 hover:bg-blue-500 text-white glow-blue'
                            : 'bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/10'
                        }`}
                      >
                        Select {plan.name}
                        <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      </button>
                    </motion.div>
                  );
                })}
          </div>
        </div>

      </div>
    </section>
  );
}
