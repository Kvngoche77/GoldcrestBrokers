'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Copy, CircleCheck as CheckCircle2, Clock, Loader as Loader2, ArrowDownToLine } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import type { DepositAddress } from '@/types';

async function fetchAddresses(): Promise<DepositAddress[]> {
  const { data } = await supabase.from('deposit_addresses').select('*').eq('is_active', true);
  return (data as DepositAddress[]) ?? [];
}

export default function DepositPage() {
  const { profile, refreshProfile } = useAuth();
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [txHash, setTxHash] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: addresses = [], error: addrError, isLoading: addrLoading } = useQuery({
    queryKey: ['deposit-addresses'],
    queryFn: async () => {
      console.log('DepositPage: Fetching addresses...');
      const data = await fetchAddresses();
      console.log('DepositPage: Addresses received:', data);
      return data;
    },
  });

  if (addrError) console.error('DepositPage: Error loading addresses:', addrError);

  const selectedAddress = addresses.find((a) => a.network === selectedNetwork);

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    toast.success('Address copied!');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSubmit = async () => {
    if (!amount || Number(amount) < 50) {
      toast.error('Minimum deposit is $50');
      return;
    }
    if (!txHash.trim()) {
      toast.error('Please enter your transaction hash/ID');
      return;
    }
    if (!selectedNetwork) {
      toast.error('Select a payment network');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('transactions').insert({
        user_id: profile!.id,
        type: 'deposit',
        amount: Number(amount),
        status: 'pending',
        description: `${selectedAddress?.label} deposit`,
        reference: txHash.trim(),
        metadata: { network: selectedNetwork, wallet: selectedAddress?.address },
      });
      if (error) throw error;
      setSubmitted(true);
      toast.success('Deposit submitted for review!');
    } catch {
      toast.error('Failed to submit deposit');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Deposit Funds</h1>
        <p className="text-slate-400 text-sm mt-1">Send crypto to the address below and confirm your deposit</p>
      </div>

      {submitted ? (
        <motion.div
          className="glass rounded-2xl p-8 text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <CheckCircle2 size={48} className="text-emerald-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Deposit Submitted!</h2>
          <p className="text-slate-400 text-sm mb-6">Your deposit is being reviewed and will be credited within 1–3 hours after network confirmation.</p>
          <div className="bg-white/[0.03] rounded-xl p-4 text-left mb-5 border border-white/[0.05]">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400">Amount</span>
              <span className="text-white font-semibold">${Number(amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400">Network</span>
              <span className="text-white">{selectedAddress?.label}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">TX Hash</span>
              <span className="text-white font-mono text-xs truncate max-w-[150px]">{txHash}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 justify-center text-sm text-amber-400">
            <Clock size={16} />
            <span>Pending admin review</span>
          </div>
        </motion.div>
      ) : (
        <>
          {/* Network selection */}
          <div className="glass rounded-2xl p-6 border border-white/[0.05]">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Select Preferred Asset
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {addresses.map((addr) => {
                const isSelected = selectedNetwork === addr.network;
                return (
                  <button
                    key={addr.network}
                    onClick={() => setSelectedNetwork(addr.network)}
                    className={`p-4 rounded-2xl border flex items-center gap-4 transition-all duration-300 ${
                      isSelected
                        ? 'border-blue-500/60 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.15)]'
                        : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0 ${
                      isSelected ? 'bg-blue-600 text-white' : 'bg-white/[0.05] text-slate-400'
                    }`}>
                      {addr.label.charAt(0)}
                    </div>
                    <div className="text-left">
                      <p className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-slate-200'}`}>{addr.label}</p>
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-0.5">{addr.network}</p>
                    </div>
                    {isSelected && (
                      <div className="ml-auto w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                        <CheckCircle2 size={12} className="text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>


          {/* Deposit address */}
          {selectedAddress && (
            <motion.div
              className="glass rounded-2xl p-5"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="font-semibold text-white mb-4">Send to Address</h2>
              <div className="bg-white/[0.03] rounded-xl p-6 border border-white/[0.05] mb-4 text-center flex flex-col items-center">
                <div className="bg-white p-3 rounded-xl inline-block mb-6 shadow-xl border border-white/20">
                  <QRCodeSVG value={selectedAddress.address} size={180} level="H" />
                </div>
                <div className="w-full text-left">
                  <p className="text-xs text-slate-400 mb-2">Wallet Address ({selectedAddress.label})</p>
                  <div className="flex items-center gap-3">
                    <p className="text-sm text-white font-mono break-all flex-1 bg-black/20 p-2 rounded-lg">{selectedAddress.address}</p>
                    <button
                      onClick={() => copyAddress(selectedAddress.address)}
                      className="p-3 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 transition-colors flex-shrink-0"
                    >
                      {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-xs text-amber-400 flex gap-2">
                <span className="flex-shrink-0">!</span>
                <span>Only send {selectedAddress.label} to this address. Sending other assets will result in permanent loss.</span>
              </div>
            </motion.div>
          )}

          {/* Confirmation form */}
          {selectedNetwork && (
            <motion.div
              className="glass rounded-2xl p-5 space-y-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="font-semibold text-white">Confirm Your Deposit</h2>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Amount (USD)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Minimum $50"
                  min={50}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 transition-all"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Transaction Hash / ID</label>
                <input
                  type="text"
                  value={txHash}
                  onChange={(e) => setTxHash(e.target.value)}
                  placeholder="Paste your transaction hash here"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 transition-all font-mono"
                />
                <p className="text-xs text-slate-500 mt-1">Find this in your wallet after sending the transaction</p>
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 glow-blue"
              >
                {submitting ? <Loader2 size={18} className="animate-spin" /> : <><ArrowDownToLine size={16} /> Submit Deposit</>}
              </button>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
