'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowUpFromLine, Loader as Loader2, CircleCheck as CheckCircle2, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import type { WithdrawalRequest } from '@/types';

const networks = [
  { value: 'USDT_TRC20', label: 'USDT (TRC20)' },
  { value: 'USDT_ERC20', label: 'USDT (ERC20)' },
  { value: 'BTC', label: 'Bitcoin (BTC)' },
  { value: 'ETH', label: 'Ethereum (ETH)' },
];

export default function WithdrawPage() {
  const { profile, refreshProfile } = useAuth();
  const [amount, setAmount] = useState('');
  const [wallet, setWallet] = useState('');
  const [network, setNetwork] = useState('USDT_TRC20');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { data: history = [], refetch } = useQuery({
    queryKey: ['withdrawals', profile?.id],
    queryFn: async (): Promise<WithdrawalRequest[]> => {
      if (!profile?.id) return [];
      const { data } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(10);
      return (data as WithdrawalRequest[]) ?? [];
    },
    enabled: !!profile?.id,
  });

  const handleWithdraw = async () => {
    const amt = Number(amount);
    if (!amt || amt < 10) { toast.error('Minimum withdrawal is $10'); return; }
    if (!wallet.trim()) { toast.error('Enter your wallet address'); return; }
    if (amt > Number(profile?.balance ?? 0)) { toast.error('Insufficient balance'); return; }

    setLoading(true);
    try {
      const { error } = await supabase.from('withdrawal_requests').insert({
        user_id: profile!.id,
        amount: amt,
        wallet_address: wallet.trim(),
        network,
        status: 'pending',
      });
      if (error) throw error;

      // Deduct balance
      await supabase.from('profiles').update({ balance: Number(profile!.balance) - amt }).eq('id', profile!.id);

      // Create transaction
      await supabase.from('transactions').insert({
        user_id: profile!.id,
        type: 'withdrawal',
        amount: amt,
        status: 'pending',
        description: `Withdrawal request — ${network}`,
      });

      await refreshProfile();
      refetch();
      setSubmitted(true);
      toast.success('Withdrawal request submitted!');
    } catch {
      toast.error('Failed to submit withdrawal');
    } finally {
      setLoading(false);
    }
  };

  const statusColors: Record<string, string> = {
    pending: 'badge-pending',
    approved: 'badge-info',
    processing: 'badge-info',
    completed: 'badge-success',
    rejected: 'badge-danger',
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Withdraw Funds</h1>
        <p className="text-slate-400 text-sm mt-1">Available: <span className="text-white font-semibold">${Number(profile?.balance ?? 0).toFixed(2)}</span></p>
      </div>

      {submitted ? (
        <motion.div className="glass rounded-2xl p-8 text-center" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <CheckCircle2 size={48} className="text-emerald-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Request Submitted!</h2>
          <p className="text-slate-400 text-sm mb-6">Your withdrawal is pending admin approval. Funds will be sent within 24 hours.</p>
          <div className="flex items-center justify-center gap-2 text-amber-400 text-sm">
            <Clock size={16} /> Pending approval
          </div>
          <button onClick={() => setSubmitted(false)} className="mt-5 text-sm text-blue-400 hover:text-blue-300">
            Make another withdrawal
          </button>
        </motion.div>
      ) : (
        <div className="glass rounded-2xl p-6 space-y-5">
          <h2 className="font-semibold text-white">Withdrawal Request</h2>

          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Network</label>
            <select
              value={network}
              onChange={(e) => setNetwork(e.target.value)}
              className="w-full bg-[#0a1628] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/60"
            >
              {networks.map((n) => <option key={n.value} value={n.value}>{n.label}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Amount (USD)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Minimum $10"
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 transition-all"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Wallet Address</label>
            <input
              type="text"
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              placeholder="Enter your wallet address"
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 transition-all font-mono"
            />
          </div>

          <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-xs text-amber-400">
            Withdrawals are processed within 24 hours. Ensure your wallet address is correct — funds cannot be recovered.
          </div>

          <button
            onClick={handleWithdraw}
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 glow-blue"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <><ArrowUpFromLine size={16} /> Request Withdrawal</>}
          </button>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.05]">
            <h2 className="font-semibold text-white">Withdrawal History</h2>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {history.map((w) => (
              <div key={w.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-white">${w.amount.toFixed(2)}</p>
                  <p className="text-xs text-slate-500">{w.network} — {new Date(w.created_at).toLocaleDateString()}</p>
                </div>
                <span className={statusColors[w.status] ?? 'badge-grey'}>{w.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
