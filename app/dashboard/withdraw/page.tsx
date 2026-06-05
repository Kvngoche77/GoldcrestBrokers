'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowUpFromLine, Loader as Loader2, CircleCheck as CheckCircle2, Clock, Building2, Wallet, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import type { WithdrawalRequest, BankDetails } from '@/types';
import { ConfirmPinModal } from '@/components/ui/ConfirmPinModal';

const networks = [
  { value: 'USDT_TRC20', label: 'USDT (TRC20)', type: 'crypto' },
  { value: 'USDT_ERC20', label: 'USDT (ERC20)', type: 'crypto' },
  { value: 'BTC', label: 'Bitcoin (BTC)', type: 'crypto' },
  { value: 'ETH', label: 'Ethereum (ETH)', type: 'crypto' },
  { value: 'BANK', label: 'Bank Transfer', type: 'bank' },
];

export default function WithdrawPage() {
  const { profile, refreshProfile } = useAuth();
  const [amount, setAmount] = useState('');
  const [wallet, setWallet] = useState('');
  const [activeTab, setActiveTab] = useState<'crypto' | 'bank'>('crypto');
  const [network, setNetwork] = useState('USDT_TRC20');
  
  // Bank fields
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [swiftCode, setSwiftCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  const isBank = activeTab === 'bank';
  const availableNetworks = networks.filter(n => n.type === activeTab);
  const selectedNetwork = networks.find(n => n.value === network);

  const handleTabChange = (tab: 'crypto' | 'bank') => {
    setActiveTab(tab);
    if (tab === 'crypto') {
      setNetwork('USDT_TRC20');
    } else {
      setNetwork('BANK');
    }
  };

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

  const handleWithdraw = () => {
    // KYC gate
    if (profile?.kyc_status !== 'verified') {
      toast.error('KYC verification required. Please complete your identity verification before withdrawing.');
      setTimeout(() => { window.location.href = '/dashboard/kyc'; }, 1500);
      return;
    }
    const amt = Number(amount);
    if (!amt || amt < 10) { toast.error('Minimum withdrawal is $10'); return; }
    if (amt > Number(profile?.balance ?? 0)) { toast.error('Insufficient balance'); return; }

    if (isBank) {
      if (!bankName || !accountName || !accountNumber) {
        toast.error('Please fill in all required bank details');
        return;
      }
    } else {
      if (!wallet.trim()) { toast.error('Enter your wallet address'); return; }
    }

    setIsPinModalOpen(true);
  };

  const executeWithdrawal = async (pin: string) => {
    const amt = Number(amount);
    let destination = '';
    if (isBank) {
      const bankDetails: BankDetails = {
        bank_name: bankName,
        account_name: accountName,
        account_number: accountNumber,
        swift_code: swiftCode,
      };
      destination = JSON.stringify(bankDetails);
    } else {
      destination = wallet.trim();
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('withdrawal_requests').insert({
        user_id: profile!.id,
        amount: amt,
        wallet_address: destination,
        network: isBank ? 'Bank Transfer' : (selectedNetwork?.label || network),
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
        description: `Withdrawal request — ${isBank ? 'Bank Transfer' : (selectedNetwork?.label || network)}`,
        metadata: isBank ? { bank_details: { bank_name: bankName, account_name: accountName, account_number: accountNumber, swift_code: swiftCode } } : { wallet_address: destination, network }
      });

      // Trigger API Route withdrawal email
      fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'withdrawal_initiated',
          user_email: profile!.email,
          user_name: profile!.full_name || profile!.username || 'Trader',
          amount: amt,
          currency: 'USD',
          status: 'Pending',
          tx_id: 'N/A',
        }),
      }).catch((err) => console.error('WithdrawPage: Error triggering withdrawal email:', err));

      await refreshProfile();
      refetch();
      setSubmitted(true);
      toast.success('Withdrawal request submitted!');
    } catch (err) {
      console.error(err);
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

      {/* KYC Gate Banner */}
      {profile?.kyc_status !== 'verified' && (
        <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
          <span className="text-2xl flex-shrink-0">⚠️</span>
          <div className="flex-1">
            <p className="text-amber-400 font-semibold text-sm">KYC Verification Required</p>
            <p className="text-amber-300/80 text-xs mt-0.5">You must complete identity verification before you can withdraw funds.</p>
          </div>
          <a href="/dashboard/kyc" className="flex-shrink-0 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-white text-xs font-semibold rounded-lg transition-all">
            Verify Now
          </a>
        </div>
      )}

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
        <div className="glass rounded-2xl overflow-hidden relative">
          {/* KYC Overlay */}
          {profile?.kyc_status !== 'verified' && (
            <div className="absolute inset-0 bg-[#040c18]/80 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4">
                <span className="text-2xl text-amber-500">⚠️</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-1.5">KYC Verification Required</h3>
              <p className="text-slate-400 text-xs max-w-xs mb-5 leading-relaxed">
                Under regulatory compliance guidelines, please complete your identity verification (KYC) to enable withdrawals and payout requests.
              </p>
              <a 
                href="/dashboard/kyc" 
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-white font-bold text-xs rounded-xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:scale-[1.02] active:scale-[0.98]"
              >
                Verify Identity Now
              </a>
            </div>
          )}
          {/* Tabs */}
          <div className="flex bg-white/[0.02] border-b border-white/[0.05]">
            <button
              onClick={() => handleTabChange('crypto')}
              className={`flex-1 py-4 text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'crypto' 
                  ? 'text-blue-400 bg-blue-400/5 border-b-2 border-blue-500' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Wallet size={16} />
              Crypto Withdrawal
            </button>
            <button
              onClick={() => handleTabChange('bank')}
              className={`flex-1 py-4 text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'bank' 
                  ? 'text-blue-400 bg-blue-400/5 border-b-2 border-blue-500' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Building2 size={16} />
              Bank Withdrawal
            </button>
          </div>

          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Amount (USD)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Min $10"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-8 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 transition-all font-bold"
                  />
                </div>
              </div>

              {activeTab === 'crypto' && (
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Network</label>
                  <div className="relative">
                    <select
                      value={network}
                      onChange={(e) => setNetwork(e.target.value)}
                      className="w-full bg-[#0a1628] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/60 appearance-none transition-all"
                    >
                      {availableNetworks.map((n) => <option key={n.value} value={n.value}>{n.label}</option>)}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                      <ChevronDown size={16} />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'bank' && (
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Withdrawal Method</label>
                  <div className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-400 flex items-center justify-between">
                    <span>Bank Transfer</span>
                    <Building2 size={16} className="text-slate-600" />
                  </div>
                </div>
              )}
            </div>

            {activeTab === 'bank' ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 pt-2"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block">Bank Name</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. JP Morgan Chase"
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/60 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block">Account Name</label>
                    <input
                      type="text"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      placeholder="Full name on account"
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/60 transition-all"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block">Account Number / IBAN</label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="Enter account number"
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/60 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block">SWIFT / BIC / Routing (Optional)</label>
                    <input
                      type="text"
                      value={swiftCode}
                      onChange={(e) => setSwiftCode(e.target.value)}
                      placeholder="Bank routing code"
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/60 transition-all"
                    />
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-2"
              >
                <label className="text-xs text-slate-400 mb-1.5 block">Wallet Address</label>
                <input
                  type="text"
                  value={wallet}
                  onChange={(e) => setWallet(e.target.value)}
                  placeholder={`Enter your ${selectedNetwork?.label} address`}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 transition-all font-mono"
                />
              </motion.div>
            )}

            <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 text-[11px] text-blue-400 flex gap-2">
              <span className="flex-shrink-0">ℹ️</span>
              <span>Withdrawals are processed within 24 hours. Ensure all details are correct — funds cannot be recovered if sent to the wrong destination.</span>
            </div>

            <button
              onClick={handleWithdraw}
              disabled={loading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 glow-blue"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <><ArrowUpFromLine size={20} /> Request {activeTab === 'crypto' ? 'Crypto' : 'Bank'} Withdrawal</>}
            </button>
          </div>
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

      {/* Transaction PIN Confirmation Modal */}
      <ConfirmPinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={(pin) => {
          setIsPinModalOpen(false);
          executeWithdrawal(pin);
        }}
        title="Confirm Withdrawal Authorization"
        description={`Please enter your 4-digit Transaction PIN to authorize a withdrawal of $${Number(amount).toFixed(2)}.`}
      />
    </div>
  );
}
