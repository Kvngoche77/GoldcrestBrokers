'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, TrendingUp, ArrowRight } from 'lucide-react';
import type { InvestmentPlan } from '@/types';

interface ProfitCalculatorSectionProps {
  plans: InvestmentPlan[];
}

export function ProfitCalculatorSection({ plans }: ProfitCalculatorSectionProps) {
  const [selectedPlan, setSelectedPlan] = useState(plans[0]?.id ?? '');
  const [amount, setAmount] = useState(500);

  const plan = plans.find((p) => p.id === selectedPlan);
  const dailyProfit = plan ? (amount * plan.daily_roi_percent) / 100 : 0;
  const totalProfit = plan ? (amount * plan.total_roi_percent) / 100 : 0;
  const totalReturn = amount + totalProfit;

  return (
    <section id="calculator" className="py-20 bg-[#040b15] relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 glass rounded-full text-sm text-blue-400 border border-blue-500/20 mb-4">
            <Calculator size={14} />
            <span>Profit Calculator</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Calculate Your <span className="gradient-text">Earnings</span>
          </h2>
          <p className="text-slate-400">Estimate your potential returns based on our investment tiers.</p>
        </motion.div>

        <motion.div
          className="glass-strong rounded-3xl p-8 border border-white/[0.08] shadow-2xl relative overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl -z-10" />

          <div className="grid md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2.5 block">Investment Amount (USD)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">$</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    min={100}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-8 pr-4 py-4 text-white text-lg font-bold focus:outline-none focus:border-blue-500/50 transition-all focus:ring-1 focus:ring-blue-500/20"
                  />
                </div>
                <input
                  type="range"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  min={100}
                  max={100000}
                  step={100}
                  className="w-full mt-6 accent-blue-500 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between mt-2">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">$100</span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">$100,000</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300 mb-2.5 block">Select Investment Plan</label>
                <div className="grid grid-cols-1 gap-3">
                  {plans.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPlan(p.id)}
                      className={`flex items-center justify-between px-4 py-3.5 rounded-2xl border transition-all ${
                        selectedPlan === p.id
                          ? 'bg-blue-600/10 border-blue-500/50 text-white'
                          : 'bg-white/[0.02] border-white/10 text-slate-400 hover:bg-white/[0.05]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${selectedPlan === p.id ? 'bg-blue-400 animate-pulse' : 'bg-slate-600'}`} />
                        <span className="text-sm font-semibold">{p.name}</span>
                      </div>
                      <span className="text-xs font-bold opacity-80">{p.daily_roi_percent}% Daily</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-between">
              <div className="bg-white/[0.03] rounded-3xl p-6 border border-white/[0.05] space-y-5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Daily Earnings</span>
                  <div className="text-right">
                    <span className="text-emerald-400 font-bold text-xl">+${dailyProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
                
                <div className="h-px bg-white/[0.06]" />
                
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Total Net Profit</span>
                  <div className="text-right">
                    <span className="text-emerald-400 font-bold text-xl">+${totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">in {plan?.duration_days} days</p>
                  </div>
                </div>

                <div className="bg-blue-600/10 rounded-2xl p-4 border border-blue-500/20 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-blue-200 text-sm font-semibold">Total ROI</span>
                    <span className="text-white font-bold text-2xl">${totalReturn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <button className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all glow-blue group">
                  Start Investing Now
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <p className="text-center text-[11px] text-slate-500 mt-4 flex items-center justify-center gap-1.5">
                  <TrendingUp size={12} />
                  Historical performance is not a guarantee of future results.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
