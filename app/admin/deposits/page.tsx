'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CircleCheck as CheckCircle2, Circle as XCircle, Eye, Search, Filter } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

type DepositTx = {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  description: string;
  reference: string;
  metadata: Record<string, unknown>;
  created_at: string;
  profile: { username: string | null; full_name: string; email?: string } | null;
};

async function fetchDeposits(): Promise<DepositTx[]> {
  const { data } = await supabase
    .from('transactions')
    .select('*, profile:profiles!user_id(username, full_name)')
    .eq('type', 'deposit')
    .order('created_at', { ascending: false });
  return (data as DepositTx[]) ?? [];
}

export default function AdminDepositsPage() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'failed'>('all');
  const [search, setSearch] = useState('');

  const { data: deposits = [], isLoading } = useQuery({
    queryKey: ['admin-deposits'],
    queryFn: fetchDeposits,
    refetchInterval: 30000,
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, userId, amount }: { id: string; userId: string; amount: number }) => {
      // Mark transaction completed
      await supabase.from('transactions').update({ status: 'completed' }).eq('id', id);
      // Credit user balance
      const { data: userProfile } = await supabase.from('profiles').select('balance, total_deposited').eq('id', userId).single();
      if (userProfile) {
        await supabase.from('profiles').update({
          balance: Number(userProfile.balance) + amount,
          total_deposited: Number(userProfile.total_deposited) + amount,
        }).eq('id', userId);
      }
      // Create notification
      await supabase.from('notifications').insert({
        user_id: userId,
        title: 'Deposit Approved',
        message: `Your deposit of $${amount.toFixed(2)} has been approved and credited to your account.`,
        type: 'success',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-deposits'] });
      toast.success('Deposit approved and credited');
    },
    onError: () => toast.error('Failed to approve deposit'),
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, userId, amount }: { id: string; userId: string; amount: number }) => {
      await supabase.from('transactions').update({ status: 'failed' }).eq('id', id);
      await supabase.from('notifications').insert({
        user_id: userId,
        title: 'Deposit Rejected',
        message: `Your deposit of $${amount.toFixed(2)} could not be verified. Please contact support.`,
        type: 'error',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-deposits'] });
      toast.success('Deposit rejected');
    },
    onError: () => toast.error('Failed to reject deposit'),
  });

  const filtered = deposits.filter((d) => {
    if (filter !== 'all' && d.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return d.profile?.username?.toLowerCase().includes(q) ||
             d.reference?.toLowerCase().includes(q) ||
             d.amount.toString().includes(q);
    }
    return true;
  });

  const statusColors: Record<string, string> = {
    completed: 'badge-success',
    pending: 'badge-pending',
    failed: 'badge-danger',
    cancelled: 'badge-grey',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Deposit Management</h1>
        <p className="text-slate-400 text-sm mt-1">Review and approve user deposit requests</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by user or TX hash..."
            className="bg-white/[0.04] border border-white/10 rounded-xl pl-8 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 w-64"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'pending', 'completed', 'failed'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all capitalize ${
                filter === s ? 'bg-blue-600 text-white' : 'glass text-slate-400 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.05]">
                <th className="text-left py-4 px-5 text-xs text-slate-400 uppercase tracking-wider font-semibold">User</th>
                <th className="text-right py-4 px-5 text-xs text-slate-400 uppercase tracking-wider font-semibold">Amount</th>
                <th className="text-left py-4 px-5 text-xs text-slate-400 uppercase tracking-wider font-semibold hidden md:table-cell">TX Hash</th>
                <th className="text-left py-4 px-5 text-xs text-slate-400 uppercase tracking-wider font-semibold hidden lg:table-cell">Network</th>
                <th className="text-center py-4 px-5 text-xs text-slate-400 uppercase tracking-wider font-semibold">Status</th>
                <th className="text-right py-4 px-5 text-xs text-slate-400 uppercase tracking-wider font-semibold hidden sm:table-cell">Date</th>
                <th className="text-right py-4 px-5 text-xs text-slate-400 uppercase tracking-wider font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/[0.04]">
                    {[0,1,2,3,4].map(j => <td key={j} className="py-4 px-5"><div className="shimmer h-4 rounded w-24" /></td>)}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400 text-sm">No deposits found</td>
                </tr>
              ) : filtered.map((dep, i) => (
                <motion.tr
                  key={dep.id}
                  className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <td className="py-3.5 px-5">
                    <div>
                      <p className="text-sm font-medium text-white">{dep.profile?.username ?? 'Unknown'}</p>
                      <p className="text-xs text-slate-500">{dep.profile?.full_name}</p>
                    </div>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <span className="text-sm font-bold text-emerald-400">${dep.amount.toFixed(2)}</span>
                  </td>
                  <td className="py-3.5 px-5 hidden md:table-cell">
                    <span className="text-xs font-mono text-slate-400 truncate max-w-[120px] block">{dep.reference || '—'}</span>
                  </td>
                  <td className="py-3.5 px-5 hidden lg:table-cell">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${dep.metadata?.network === 'BANK' ? 'bg-blue-500/10 text-blue-400' : 'bg-white/5 text-slate-400'}`}>
                      {(dep.metadata?.network as string) ?? '—'}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-center">
                    <span className={statusColors[dep.status] ?? 'badge-grey'}>{dep.status}</span>
                  </td>
                  <td className="py-3.5 px-5 text-right hidden sm:table-cell">
                    <span className="text-xs text-slate-400">{new Date(dep.created_at).toLocaleDateString()}</span>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    {dep.status === 'pending' && (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => approveMutation.mutate({ id: dep.id, userId: dep.user_id, amount: dep.amount })}
                          disabled={approveMutation.isPending}
                          className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                          title="Approve"
                        >
                          <CheckCircle2 size={15} />
                        </button>
                        <button
                          onClick={() => rejectMutation.mutate({ id: dep.id, userId: dep.user_id, amount: dep.amount })}
                          disabled={rejectMutation.isPending}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                          title="Reject"
                        >
                          <XCircle size={15} />
                        </button>
                      </div>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
