'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Check, TrendingUp, Loader as Loader2, ChevronRight, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import type { InvestmentPlan } from '@/types';

async function fetchPlans(): Promise<InvestmentPlan[]> {
  const { data, error } = await supabase.from('investment_plans').select('*').eq('is_active', true).order('sort_order');
  
  if (!error && (!data || data.length === 0)) {
    // Seed default plans if empty
    const defaultPlans = [
      {
        name: 'Starter Plan',
        description: 'Perfect for beginners looking to enter the market.',
        min_amount: 100,
        max_amount: 999,
        daily_roi_percent: 1.5,
        duration_days: 30,
        total_roi_percent: 145,
        referral_bonus_percent: 5,
        features: ['Daily Profit Payouts', 'Standard Support', 'Basic Analytics'],
        is_active: true,
        sort_order: 1
      },
      {
        name: 'Professional Plan',
        description: 'Designed for serious investors seeking steady growth.',
        min_amount: 1000,
        max_amount: 4999,
        daily_roi_percent: 2.5,
        duration_days: 30,
        total_roi_percent: 175,
        referral_bonus_percent: 8,
        features: ['Daily Profit Payouts', 'Priority Support', 'Advanced Analytics', 'Dedicated Account Manager'],
        is_active: true,
        sort_order: 2
      },
      {
        name: 'VIP Elite',
        description: 'Premium tier for maximum returns and exclusive perks.',
        min_amount: 5000,
        max_amount: null,
        daily_roi_percent: 4.0,
        duration_days: 30,
        total_roi_percent: 220,
        referral_bonus_percent: 12,
        features: ['Daily Profit Payouts', '24/7 VIP Support', 'Real-Time Analytics', 'Dedicated Account Manager', 'Exclusive Webinars'],
        is_active: true,
        sort_order: 3
      }
    ];
    const { data: insertedData } = await supabase.from('investment_plans').insert(defaultPlans).select();
    if (insertedData) {
      return (insertedData as InvestmentPlan[]) ?? [];
    }
  }
  
  return (data as InvestmentPlan[]) ?? [];
}

export default function InvestPage() {
  const { profile, refreshProfile } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const defaultPlanId = searchParams.get('plan');

  const { data: plans = [] } = useQuery({ queryKey: ['plans'], queryFn: fetchPlans });
  const [selectedPlanId, setSelectedPlanId] = useState(defaultPlanId ?? '');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);
  const dailyProfit = selectedPlan && amount ? (Number(amount) * selectedPlan.daily_roi_percent) / 100 : 0;
  const totalProfit = selectedPlan && amount ? (Number(amount) * selectedPlan.total_roi_percent) / 100 : 0;

  const handleInvest = async () => {
    if (!selectedPlan) { toast.error('Select a plan first'); return; }
    const amt = Number(amount);
    if (!amt || amt < selectedPlan.min_amount) {
      toast.error(`Minimum investment for ${selectedPlan.name} is $${selectedPlan.min_amount}`);
      return;
    }
    if (selectedPlan.max_amount && amt > selectedPlan.max_amount) {
      toast.error(`Maximum investment for ${selectedPlan.name} is $${selectedPlan.max_amount}`);
      return;
    }
    if (amt > Number(profile?.balance ?? 0)) {
      toast.error('Insufficient balance. Please deposit first.');
      return;
    }

    setLoading(true);
    try {
      const now = new Date();
      const expires = new Date(now.getTime() + selectedPlan.duration_days * 24 * 60 * 60 * 1000);

      const { error: invErr } = await supabase.from('investments').insert({
        user_id: profile!.id,
        plan_id: selectedPlan.id,
        amount: amt,
        daily_roi_percent: selectedPlan.daily_roi_percent,
        duration_days: selectedPlan.duration_days,
        total_profit_expected: totalProfit,
        total_profit_earned: 0,
        status: 'active',
        started_at: now.toISOString(),
        expires_at: expires.toISOString(),
      });
      if (invErr) throw invErr;

      // Deduct from balance
      const { error: balErr } = await supabase
        .from('profiles')
        .update({ balance: Number(profile!.balance) - amt })
        .eq('id', profile!.id);
      if (balErr) throw balErr;

      // Create transaction
      await supabase.from('transactions').insert({
        user_id: profile!.id,
        type: 'investment',
        amount: amt,
        status: 'completed',
        description: `${selectedPlan.name} plan activated`,
      });

      // Trigger API Route investment email
      fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'investment_created',
          user_email: profile!.email,
          user_name: profile!.full_name || profile!.username || 'Trader',
          amount: amt,
          currency: 'USD',
          status: 'Active',
          tx_id: 'N/A',
        }),
      }).catch((err) => console.error('InvestPage: Error triggering investment email:', err));

      await refreshProfile();
      toast.success(`${selectedPlan.name} plan activated! Earning ${selectedPlan.daily_roi_percent}% daily.`);
      router.push('/dashboard');
    } catch {
      toast.error('Failed to activate investment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Start Investing</h1>
        <p className="text-slate-400 text-sm mt-1">
          Available balance:{' '}
          <span className="text-white font-semibold">${Number(profile?.balance ?? 0).toFixed(2)}</span>
        </p>
      </div>

      {/* Plan selection */}
      <div className="grid sm:grid-cols-2 gap-4">
        {plans.map((plan, idx) => {
          const isSelected = selectedPlanId === plan.id;
          const isPopular = idx === 2;
          return (
            <motion.button
              key={plan.id}
              onClick={() => setSelectedPlanId(plan.id)}
              className={`relative text-left p-5 rounded-2xl border transition-all duration-200 ${
                isSelected
                  ? 'border-blue-500/60 bg-blue-500/10 ring-1 ring-blue-500/20'
                  : 'border-white/[0.06] glass hover:border-white/20'
              }`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              {isPopular && (
                <span className="absolute -top-2.5 left-4 bg-blue-600 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Zap size={10} /> Popular
                </span>
              )}
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-white">{plan.name}</span>
                {isSelected && <Check size={16} className="text-blue-400" />}
              </div>
              <div className="text-3xl font-bold text-white mb-1">{plan.daily_roi_percent}%<span className="text-sm font-normal text-slate-400">/day</span></div>
              <p className="text-xs text-slate-400">{plan.total_roi_percent}% in {plan.duration_days} days</p>
              <p className="text-xs text-slate-500 mt-2">
                ${plan.min_amount.toLocaleString()}{plan.max_amount ? `–$${plan.max_amount.toLocaleString()}` : '+'}
              </p>
            </motion.button>
          );
        })}
      </div>

      {/* Amount & summary */}
      {selectedPlan && (
        <motion.div
          className="glass rounded-2xl p-6 space-y-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="font-semibold text-white">Investment Details — {selectedPlan.name}</h2>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">
              Investment Amount (${selectedPlan.min_amount.toLocaleString()} – {selectedPlan.max_amount ? `$${selectedPlan.max_amount.toLocaleString()}` : 'unlimited'})
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Minimum $${selectedPlan.min_amount}`}
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 transition-all"
            />
          </div>

          {amount && Number(amount) > 0 && (
            <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.05] space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Plan</span>
                <span className="text-white">{selectedPlan.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Daily ROI</span>
                <span className="text-emerald-400 font-semibold">{selectedPlan.daily_roi_percent}% (+${dailyProfit.toFixed(2)}/day)</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Duration</span>
                <span className="text-white">{selectedPlan.duration_days} days</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Total Profit</span>
                <span className="text-emerald-400 font-semibold">+${totalProfit.toFixed(2)}</span>
              </div>
              <div className="h-px bg-white/[0.06]" />
              <div className="flex justify-between text-sm">
                <span className="text-slate-300 font-medium">Total Return</span>
                <span className="text-white font-bold text-base">${(Number(amount) + totalProfit).toFixed(2)}</span>
              </div>
            </div>
          )}

          <ul className="space-y-1.5">
            {selectedPlan.features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                <Check size={13} className="text-emerald-400 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          <button
            onClick={handleInvest}
            disabled={loading || !amount}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 glow-blue group"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                <TrendingUp size={16} /> Activate Investment
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </motion.div>
      )}
    </div>
  );
}
