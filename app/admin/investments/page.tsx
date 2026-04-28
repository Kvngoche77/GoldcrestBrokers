'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, TrendingUp, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import type { Investment, InvestmentPlan } from '@/types';

type AdminInvestment = Investment & {
  plan: InvestmentPlan;
  profile: { username: string | null; full_name: string };
};

async function fetchAllInvestments(): Promise<AdminInvestment[]> {
  const { data } = await supabase
    .from('investments')
    .select('*, plan:investment_plans(*), profile:profiles!user_id(username, full_name)')
    .order('created_at', { ascending: false });
  return (data as AdminInvestment[]) ?? [];
}

export default function AdminInvestmentsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const { data: investments = [], isLoading } = useQuery({
    queryKey: ['admin-investments'],
    queryFn: fetchAllInvestments,
    refetchInterval: 30000,
  });

  const creditProfitMutation = useMutation({
    mutationFn: async (inv: AdminInvestment) => {
      const dailyProfit = (inv.amount * inv.daily_roi_percent) / 100;
      const newEarned = inv.total_profit_earned + dailyProfit;
      const isCompleted = newEarned >= inv.total_profit_expected;

      await supabase.from('investments').update({
        total_profit_earned: newEarned,
        status: isCompleted ? 'completed' : inv.status,
        last_credited_at: new Date().toISOString(),
      }).eq('id', inv.id);

      // Credit user
      const { data: userProfile } = await supabase.from('profiles').select('balance, total_profit').eq('id', inv.user_id).single();
      if (userProfile) {
        await supabase.from('profiles').update({
          balance: Number(userProfile.balance) + dailyProfit,
          total_profit: Number(userProfile.total_profit) + dailyProfit,
        }).eq('id', inv.user_id);
      }

      await supabase.from('transactions').insert({
        user_id: inv.user_id,
        type: 'profit',
        amount: dailyProfit,
        status: 'completed',
        description: `Daily profit — ${inv.plan?.name ?? 'Plan'}`,
      });

      await supabase.from('notifications').insert({
        user_id: inv.user_id,
        title: 'Daily Profit Credited',
        message: `+$${dailyProfit.toFixed(2)} profit from your ${inv.plan?.name ?? 'investment'} has been credited.`,
        type: 'success',
      });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-investments'] }); toast.success('Daily profit credited'); },
    onError: () => toast.error('Failed to credit profit'),
  });

  const filtered = investments.filter((inv) => {
    if (filter !== 'all' && inv.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return inv.profile?.username?.toLowerCase().includes(q) || inv.plan?.name.toLowerCase().includes(q);
    }
    return true;
  });

  const statusColors: Record<string, string> = {
    active: 'badge-success',
    pending: 'badge-pending',
    completed: 'badge-info',
    cancelled: 'badge-grey',
  };

  const totalActiveValue = investments.filter((i) => i.status === 'active').reduce((s, i) => s + i.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Investment Management</h1>
          <p className="text-slate-400 text-sm mt-1">
            Active portfolio value: <span className="text-emerald-400 font-semibold">${totalActiveValue.toFixed(2)}</span>
          </p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="bg-white/[0.04] border border-white/10 rounded-xl pl-8 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 w-48" />
          </div>
          <div className="flex gap-2">
            {(['all', 'active', 'pending', 'completed'] as const).map((s) => (
              <button key={s} onClick={() => setFilter(s)} className={`px-3 py-2 rounded-xl text-xs font-medium capitalize ${filter === s ? 'bg-blue-600 text-white' : 'glass text-slate-400 hover:text-white'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.05]">
                <th className="text-left py-4 px-5 text-xs text-slate-400 uppercase tracking-wider font-semibold">Investor</th>
                <th className="text-left py-4 px-5 text-xs text-slate-400 uppercase tracking-wider font-semibold hidden sm:table-cell">Plan</th>
                <th className="text-right py-4 px-5 text-xs text-slate-400 uppercase tracking-wider font-semibold">Amount</th>
                <th className="text-right py-4 px-5 text-xs text-slate-400 uppercase tracking-wider font-semibold hidden md:table-cell">Earned</th>
                <th className="text-right py-4 px-5 text-xs text-slate-400 uppercase tracking-wider font-semibold hidden lg:table-cell">Progress</th>
                <th className="text-center py-4 px-5 text-xs text-slate-400 uppercase tracking-wider font-semibold">Status</th>
                <th className="text-right py-4 px-5 text-xs text-slate-400 uppercase tracking-wider font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/[0.04]">
                    {[0,1,2,3,4,5].map(j => <td key={j} className="py-4 px-5"><div className="shimmer h-4 rounded w-20" /></td>)}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-16 text-center text-slate-400 text-sm">No investments found</td></tr>
              ) : filtered.map((inv, i) => {
                const progress = inv.total_profit_expected > 0 ? (inv.total_profit_earned / inv.total_profit_expected) * 100 : 0;
                return (
                  <motion.tr key={inv.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                    <td className="py-3.5 px-5">
                      <p className="text-sm font-medium text-white">{inv.profile?.username ?? 'Unknown'}</p>
                      <p className="text-xs text-slate-500">{inv.profile?.full_name}</p>
                    </td>
                    <td className="py-3.5 px-5 hidden sm:table-cell">
                      <div>
                        <p className="text-sm text-white">{inv.plan?.name ?? '—'}</p>
                        <p className="text-xs text-emerald-400">{inv.daily_roi_percent}%/day</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <span className="text-sm font-bold text-white">${inv.amount.toFixed(2)}</span>
                    </td>
                    <td className="py-3.5 px-5 text-right hidden md:table-cell">
                      <span className="text-sm text-emerald-400">+${inv.total_profit_earned.toFixed(2)}</span>
                    </td>
                    <td className="py-3.5 px-5 hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-white/[0.05] rounded-full h-1.5">
                          <div className="bg-gradient-to-r from-blue-500 to-emerald-500 h-1.5 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }} />
                        </div>
                        <span className="text-xs text-slate-400 w-10 text-right">{progress.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <span className={statusColors[inv.status] ?? 'badge-grey'}>{inv.status}</span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      {inv.status === 'active' && (
                        <button
                          onClick={() => creditProfitMutation.mutate(inv)}
                          disabled={creditProfitMutation.isPending}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-medium transition-all ml-auto"
                        >
                          <TrendingUp size={12} />
                          Credit
                        </button>
                      )}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
