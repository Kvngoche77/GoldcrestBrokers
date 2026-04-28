'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowDownLeft, ArrowUpRight, Filter } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Transaction } from '@/types';

const typeLabels: Record<string, string> = {
  deposit: 'Deposit',
  withdrawal: 'Withdrawal',
  profit: 'Daily Profit',
  referral_bonus: 'Referral Bonus',
  investment: 'Investment',
};

const typeColors: Record<string, string> = {
  deposit: 'text-emerald-400',
  withdrawal: 'text-red-400',
  profit: 'text-blue-400',
  referral_bonus: 'text-amber-400',
  investment: 'text-rose-400',
};

export default function TransactionsPage() {
  const { profile } = useAuth();
  const [filter, setFilter] = useState<string>('all');

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['all-transactions', profile?.id],
    queryFn: async (): Promise<Transaction[]> => {
      if (!profile?.id) return [];
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });
      return (data as Transaction[]) ?? [];
    },
    enabled: !!profile?.id,
  });

  const filtered = filter === 'all' ? transactions : transactions.filter((t) => t.type === filter);

  const statusColors: Record<string, string> = {
    completed: 'badge-success',
    pending: 'badge-pending',
    failed: 'badge-danger',
    cancelled: 'badge-grey',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Transactions</h1>
          <p className="text-slate-400 text-sm mt-1">Complete history of all financial activity</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-[#0a1628] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
          >
            <option value="all">All Types</option>
            {Object.entries(typeLabels).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="flex gap-3 items-center">
                  <div className="shimmer w-8 h-8 rounded-xl" />
                  <div className="space-y-1">
                    <div className="shimmer h-4 w-32 rounded" />
                    <div className="shimmer h-3 w-20 rounded" />
                  </div>
                </div>
                <div className="shimmer h-5 w-20 rounded" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <ArrowDownLeft size={32} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No transactions found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.05]">
                <th className="text-left py-4 px-5 text-xs text-slate-400 uppercase tracking-wider font-semibold">Type</th>
                <th className="text-right py-4 px-5 text-xs text-slate-400 uppercase tracking-wider font-semibold">Amount</th>
                <th className="text-right py-4 px-5 text-xs text-slate-400 uppercase tracking-wider font-semibold hidden sm:table-cell">Status</th>
                <th className="text-right py-4 px-5 text-xs text-slate-400 uppercase tracking-wider font-semibold hidden md:table-cell">Date</th>
                <th className="text-left py-4 px-5 text-xs text-slate-400 uppercase tracking-wider font-semibold hidden lg:table-cell">Description</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tx, i) => {
                const isCredit = ['deposit', 'profit', 'referral_bonus'].includes(tx.type);
                return (
                  <motion.tr
                    key={tx.id}
                    className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isCredit ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                          {isCredit ? <ArrowDownLeft size={14} className="text-emerald-400" /> : <ArrowUpRight size={14} className="text-red-400" />}
                        </div>
                        <span className={`text-sm font-medium ${typeColors[tx.type] ?? 'text-white'}`}>
                          {typeLabels[tx.type] ?? tx.type}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <span className={`text-sm font-semibold ${isCredit ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isCredit ? '+' : '-'}${tx.amount.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right hidden sm:table-cell">
                      <span className={statusColors[tx.status] ?? 'badge-grey'}>{tx.status}</span>
                    </td>
                    <td className="py-3.5 px-5 text-right hidden md:table-cell text-slate-400 text-xs">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-5 hidden lg:table-cell text-slate-400 text-xs truncate max-w-[200px]">
                      {tx.description || '—'}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
