'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeftRight, Loader as Loader2, CheckCircle2, AlertTriangle, 
  User, DollarSign, ArrowRight, CornerDownLeft, Clock, RefreshCw 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { ConfirmPinModal } from '@/components/ui/ConfirmPinModal';
import type { Transaction } from '@/types';

export default function TransferPage() {
  const { profile, refreshProfile } = useAuth();
  
  // Form states
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  
  // Success receipt states
  const [successReceipt, setSuccessReceipt] = useState<{
    recipient: string;
    amount: number;
    timestamp: string;
    txId: string;
  } | null>(null);

  // Fetch recent transfers for history log
  const { data: history = [], refetch, isFetching } = useQuery({
    queryKey: ['transfers', profile?.id],
    queryFn: async (): Promise<Transaction[]> => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Filter client-side to only display transfer transactions
      return (data as Transaction[]).filter(tx => 
        tx.metadata && (tx.metadata.is_transfer === true || tx.metadata.transfer_recipient_id || tx.metadata.transfer_sender_id)
      ) || [];
    },
    enabled: !!profile?.id,
  });

  const handleInitiateTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(amount);
    
    if (!recipient.trim()) {
      return toast.error('Please enter the recipient\'s username or email');
    }
    if (!amt || amt < 10) {
      return toast.error('Minimum transfer amount is $10');
    }
    if (amt > Number(profile?.balance ?? 0)) {
      return toast.error('Insufficient balance');
    }
    
    const selfUsername = profile?.username?.toLowerCase();
    const selfEmail = profile?.id; // Standard checking or email lookup can be skipped as DB RPC double checks self-transfer
    if (recipient.trim().toLowerCase() === selfUsername) {
      return toast.error('You cannot transfer funds to yourself');
    }

    setIsPinModalOpen(true);
  };

  const handlePinSuccess = async (pin: string) => {
    setIsPinModalOpen(false);
    setLoading(true);

    try {
      const { data, error } = await supabase.rpc('transfer_funds', {
        sender_id: profile!.id,
        recipient_identifier: recipient.trim(),
        amount: Number(amount),
        pin: pin
      });

      if (error) throw error;

      // Extract result from RPC
      const result = typeof data === 'string' ? JSON.parse(data) : data;

      if (result && !result.success) {
        toast.error(result.message || 'Transfer failed');
        return;
      }

      // Success
      toast.success('Funds transferred successfully!');
      
      // Save receipt
      setSuccessReceipt({
        recipient: result.recipient_username || recipient,
        amount: Number(amount),
        timestamp: new Date().toLocaleString(),
        txId: Math.random().toString(36).substring(2, 12).toUpperCase() // Client receipt token matching action
      });

      // Reset form
      setAmount('');
      setRecipient('');

      // Refresh data
      await refreshProfile();
      refetch();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to complete internal transfer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ArrowLeftRight className="text-blue-500" size={24} />
          Internal Banking Transfer
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Instantly transfer USD balances to any other registered user on the Goldcrest Broker platform.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Form and Receipt Card */}
        <div className="md:col-span-3 space-y-6">
          <AnimatePresence mode="wait">
            {!successReceipt ? (
              /* Transfer Input Card */
              <motion.div 
                key="transfer-form"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="glass rounded-3xl p-6 md:p-8 space-y-6 border border-white/10"
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-white text-lg">Send Funds</h3>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Available Balance</p>
                    <p className="text-sm font-bold text-emerald-400">${Number(profile?.balance ?? 0).toFixed(2)}</p>
                  </div>
                </div>

                <form onSubmit={handleInitiateTransfer} className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block">Recipient Username or Email</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                        <User size={16} />
                      </span>
                      <input
                        type="text"
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        placeholder="e.g. johndoe or user@email.com"
                        className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 transition-all font-medium"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Lookup handles match precise user handles or email registrations.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block">Transfer Amount (USD)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                        <DollarSign size={16} />
                      </span>
                      <input
                        type="number"
                        min="10"
                        step="any"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Min $10.00"
                        className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 transition-all font-bold"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-amber-500/5 rounded-2xl border border-amber-500/15 text-[11px] text-amber-400 flex gap-2">
                    <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                    <span>
                      Internal transfers are finalized immediately. Please ensure the recipient identifier is correct. Funds cannot be reversed after completion.
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !amount || !recipient}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 glow-blue"
                  >
                    {loading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <>
                        Transfer Balance <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            ) : (
              /* Stunning Success Receipt Card */
              <motion.div
                key="transfer-receipt"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass rounded-3xl p-6 md:p-8 space-y-6 border border-emerald-500/20 text-center relative overflow-hidden"
              >
                {/* Visual top check */}
                <div className="absolute top-0 inset-x-0 h-1.5 bg-emerald-500" />
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                  <CheckCircle2 size={36} className="animate-bounce-slow" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-black text-white">Transfer Completed!</h3>
                  <p className="text-xs text-slate-400">Transaction completed successfully.</p>
                </div>

                <div className="py-4 border-y border-white/[0.05] space-y-3 font-medium text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>Sent To</span>
                    <span className="text-white font-bold">@{successReceipt.recipient}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount Transferred</span>
                    <span className="text-emerald-400 font-extrabold text-sm">${successReceipt.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date & Time</span>
                    <span className="text-white">{successReceipt.timestamp}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Receipt Token</span>
                    <span className="text-blue-400 font-mono font-bold tracking-wider">{successReceipt.txId}</span>
                  </div>
                </div>

                <button
                  onClick={() => setSuccessReceipt(null)}
                  className="w-full py-3 bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] text-white font-semibold rounded-xl transition-all"
                >
                  Send Another Transfer
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* History Log */}
        <div className="md:col-span-2 flex flex-col h-full">
          <div className="glass rounded-3xl border border-white/10 overflow-hidden flex flex-col flex-1">
            <div className="px-5 py-4 border-b border-white/[0.05] flex items-center justify-between">
              <h3 className="font-bold text-white text-sm">Recent Transfers</h3>
              <button 
                onClick={() => refetch()} 
                disabled={isFetching}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
              </button>
            </div>

            <div className="divide-y divide-white/[0.04] overflow-y-auto max-h-[360px] flex-1">
              {history.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-center p-4">
                  <Clock size={28} className="text-slate-600 mb-2" />
                  <p className="text-xs text-slate-500 font-medium">No transfer history found</p>
                  <p className="text-[10px] text-slate-600 mt-0.5">Your peer-to-peer transfers will appear here.</p>
                </div>
              ) : (
                history.map((tx) => {
                  const metadata = tx.metadata as Record<string, any>;
                  const isDebit = metadata?.transfer_direction === 'out' || tx.type === 'withdrawal';
                  
                  return (
                    <div key={tx.id} className="p-4 flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-semibold text-white truncate">
                          {tx.description}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {new Date(tx.created_at).toLocaleDateString()} at {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className={`text-xs font-black flex-shrink-0 ${isDebit ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {isDebit ? '-' : '+'}${tx.amount.toFixed(2)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Transaction PIN Modal */}
      <ConfirmPinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={handlePinSuccess}
        title="Confirm Transfer Authorization"
        description={`Please enter your 4-digit Transaction PIN to authorize an instant transfer of $${Number(amount).toFixed(2)} to @${recipient}.`}
      />
    </div>
  );
}
