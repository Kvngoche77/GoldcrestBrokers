'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CircleCheck as CheckCircle2, Circle as XCircle, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

type WithdrawalAdmin = {
  id: string;
  user_id: string;
  amount: number;
  wallet_address: string;
  network: string;
  status: string;
  admin_note: string;
  created_at: string;
  profile: { username: string | null; full_name: string; balance: number } | null;
};

async function fetchWithdrawals(): Promise<WithdrawalAdmin[]> {
  const { data } = await supabase
    .from('withdrawal_requests')
    .select('*, profile:profiles!user_id(username, full_name, balance)')
    .order('created_at', { ascending: false });
  return (data as WithdrawalAdmin[]) ?? [];
}

export default function AdminWithdrawalsPage() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [noteMap, setNoteMap] = useState<Record<string, string>>({});

  const { data: withdrawals = [], isLoading } = useQuery({
    queryKey: ['admin-withdrawals'],
    queryFn: fetchWithdrawals,
    refetchInterval: 30000,
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, userId, amount }: { id: string; userId: string; amount: number }) => {
      // Mark withdrawal as approved
      await supabase.from('withdrawal_requests').update({
        status: 'approved',
        processed_by: profile!.id,
        processed_at: new Date().toISOString(),
        admin_note: noteMap[id] ?? '',
      }).eq('id', id);

      // Fetch current profile to get latest balance and total_withdrawn
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('balance, total_withdrawn')
        .eq('id', userId)
        .single();

      if (userProfile) {
        // Deduct balance and increment total_withdrawn in one update
        await supabase.from('profiles').update({
          balance: Number(userProfile.balance) - amount,
          total_withdrawn: Number(userProfile.total_withdrawn || 0) + amount,
        }).eq('id', userId);
      }

      // Mark matching pending withdrawal transaction as completed
      await supabase.from('transactions').update({ status: 'completed' })
        .eq('user_id', userId)
        .eq('type', 'withdrawal')
        .eq('status', 'pending')
        .limit(1);

      // Notify user
      await supabase.from('notifications').insert({
        user_id: userId,
        title: 'Withdrawal Approved',
        message: `Your withdrawal of $${amount.toFixed(2)} has been approved and is being processed.`,
        type: 'success',
      });

      // Send approval email (fire-and-forget)
      fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'withdrawal_approved',
          user_id: userId,
          amount: Number(amount),
          currency: 'USD',
          origin: window.location.origin,
        }),
      }).catch((err) => console.error('AdminWithdrawals: Error triggering approved email:', err));
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] }); toast.success('Withdrawal approved'); },
    onError: () => toast.error('Failed to approve'),
  });


  const rejectMutation = useMutation({
    mutationFn: async ({ id, userId, amount }: { id: string; userId: string; amount: number }) => {
      await supabase.from('withdrawal_requests').update({
        status: 'rejected',
        processed_by: profile!.id,
        processed_at: new Date().toISOString(),
        admin_note: noteMap[id] ?? 'Rejected by admin',
      }).eq('id', id);

      // Refund balance
      const { data: userProfile } = await supabase.from('profiles').select('balance').eq('id', userId).single();
      if (userProfile) {
        await supabase.from('profiles').update({ balance: Number(userProfile.balance) + amount }).eq('id', userId);
      }

      await supabase.from('transactions').update({ status: 'cancelled' })
        .eq('user_id', userId).eq('type', 'withdrawal').eq('status', 'pending').limit(1);

      await supabase.from('notifications').insert({
        user_id: userId,
        title: 'Withdrawal Rejected',
        message: `Your withdrawal of $${amount.toFixed(2)} was rejected. Funds have been returned to your balance.`,
        type: 'error',
      });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] }); toast.success('Withdrawal rejected and funds refunded'); },
    onError: () => toast.error('Failed to reject'),
  });

  const filtered = withdrawals.filter((w) => {
    if (filter !== 'all' && w.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return w.profile?.username?.toLowerCase().includes(q) || w.wallet_address.toLowerCase().includes(q);
    }
    return true;
  });

  const statusColors: Record<string, string> = {
    completed: 'badge-success',
    approved: 'badge-info',
    pending: 'badge-pending',
    processing: 'badge-info',
    rejected: 'badge-danger',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Withdrawal Management</h1>
        <p className="text-slate-400 text-sm mt-1">Approve or reject withdrawal requests</p>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="bg-white/[0.04] border border-white/10 rounded-xl pl-8 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 w-56" />
        </div>
        <div className="flex gap-2">
          {(['all', 'pending', 'approved', 'rejected', 'completed'] as const).map((s) => (
            <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all capitalize ${filter === s ? 'bg-blue-600 text-white' : 'glass text-slate-400 hover:text-white'}`}>
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
                <th className="text-left py-4 px-5 text-xs text-slate-400 uppercase tracking-wider font-semibold hidden md:table-cell">Wallet</th>
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
                    {[0,1,2,3,4,5].map(j => <td key={j} className="py-4 px-5"><div className="shimmer h-4 rounded w-20" /></td>)}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-16 text-center text-slate-400 text-sm">No withdrawals found</td></tr>
              ) : filtered.map((w, i) => (
                <motion.tr key={w.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                  <td className="py-3.5 px-5">
                    <p className="text-sm font-medium text-white">{w.profile?.username ?? 'Unknown'}</p>
                    <p className="text-xs text-slate-500">${Number(w.profile?.balance ?? 0).toFixed(2)} balance</p>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <span className="text-sm font-bold text-amber-400">${w.amount.toFixed(2)}</span>
                  </td>
                  <td className="py-3.5 px-5 hidden md:table-cell">
                    {w.wallet_address.startsWith('{') ? (
                      <div className="text-xs space-y-0.5">
                        {(() => {
                          try {
                            const bank = JSON.parse(w.wallet_address);
                            return (
                              <>
                                <p className="text-white font-semibold">{bank.bank_name}</p>
                                <p className="text-slate-400">Acc: {bank.account_number}</p>
                                <p className="text-slate-500 text-[10px] uppercase">{bank.account_name}</p>
                              </>
                            );
                          } catch {
                            return <span className="text-red-400">Invalid Bank Data</span>;
                          }
                        })()}
                      </div>
                    ) : (
                      <span className="text-xs font-mono text-slate-400 truncate max-w-[140px] block">{w.wallet_address}</span>
                    )}
                  </td>
                  <td className="py-3.5 px-5 hidden lg:table-cell">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${w.network === 'Bank Transfer' ? 'bg-blue-500/10 text-blue-400' : 'bg-white/5 text-slate-400'}`}>
                      {w.network}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-center">
                    <span className={statusColors[w.status] ?? 'badge-grey'}>{w.status}</span>
                  </td>
                  <td className="py-3.5 px-5 text-right hidden sm:table-cell">
                    <span className="text-xs text-slate-400">{new Date(w.created_at).toLocaleDateString()}</span>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    {w.status === 'pending' && (
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => approveMutation.mutate({ id: w.id, userId: w.user_id, amount: w.amount })} disabled={approveMutation.isPending} className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors" title="Approve">
                          <CheckCircle2 size={15} />
                        </button>
                        <button onClick={() => rejectMutation.mutate({ id: w.id, userId: w.user_id, amount: w.amount })} disabled={rejectMutation.isPending} className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors" title="Reject">
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
