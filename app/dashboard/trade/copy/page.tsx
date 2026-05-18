'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, TrendingUp, Shield, Star, Info, ChevronRight, 
  Search, Filter, CheckCircle2, AlertCircle, Loader2, X,
  ArrowUpRight, BarChart3, Wallet, Copy
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

type Trader = {
  id: string;
  name: string;
  avatar_url: string;
  bio: string;
  roi_percent: number;
  win_rate: number;
  total_followers: number;
  subscription_rate: number;
  is_active: boolean;
  trades_won: number;
  trades_lost: number;
};

type Subscription = {
  trader_id: string;
  status: 'active' | 'cancelled' | 'expired';
};

export default function CopyTradingPage() {
  const { profile, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrader, setSelectedTrader] = useState<Trader | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);

  // Fetch traders
  const { data: traders = [], isLoading } = useQuery({
    queryKey: ['copy-traders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('copy_traders')
        .select('*')
        .eq('is_active', true)
        .order('roi_percent', { ascending: false });
      if (error) throw error;
      return data as Trader[];
    },
  });

  // Fetch user subscriptions
  const { data: userSubs = [] } = useQuery({
    queryKey: ['user-copy-subs', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from('copy_trading_subscriptions')
        .select('trader_id, status')
        .eq('user_id', profile.id)
        .eq('status', 'active');
      if (error) throw error;
      return data as Subscription[];
    },
    enabled: !!profile?.id,
  });

  const subscribeMutation = useMutation({
    mutationFn: async (trader: Trader) => {
      if (!profile) throw new Error('Not logged in');
      if (profile.balance < trader.subscription_rate) {
        throw new Error('Insufficient balance');
      }

      // 1. Create subscription
      const { error: subError } = await supabase
        .from('copy_trading_subscriptions')
        .insert({
          user_id: profile.id,
          trader_id: trader.id,
          amount: trader.subscription_rate,
          status: 'active'
        });
      if (subError) throw subError;

      // 2. Deduct balance
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ balance: profile.balance - trader.subscription_rate })
        .eq('id', profile.id);
      if (profileError) throw profileError;

      // 3. Create transaction record
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: profile.id,
          type: 'investment',
          amount: trader.subscription_rate,
          status: 'completed',
          description: `Copy Trading subscription: ${trader.name}`,
          reference: `COPY-${trader.id.slice(0, 8)}`,
          metadata: { trader_id: trader.id, trader_name: trader.name }
        });
      if (txError) throw txError;

      // 4. Update trader follower count
      const { error: traderError } = await supabase
        .from('copy_traders')
        .update({ total_followers: trader.total_followers + 1 })
        .eq('id', trader.id);
      if (traderError) throw traderError;
    },
    onSuccess: () => {
      toast.success('Successfully subscribed to trader!');
      queryClient.invalidateQueries({ queryKey: ['user-copy-subs'] });
      queryClient.invalidateQueries({ queryKey: ['copy-traders'] });
      refreshProfile();
      setSelectedTrader(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to subscribe');
    },
    onSettled: () => setIsSubscribing(false)
  });

  const filteredTraders = traders.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.bio.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isSubscribed = (traderId: string) => userSubs.some(s => s.trader_id === traderId);

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="relative overflow-hidden glass rounded-3xl p-8 border border-white/[0.05]">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-4">
              <TrendingUp size={12} />
              Expert Network
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
              Copy Pro Traders, <br />
              <span className="gradient-text">Automate Your Success</span>
            </h1>
            <p className="text-slate-400 max-w-md mb-6 leading-relaxed text-sm">
              Follow seasoned traders with proven track records. Their trades are automatically 
              mirrored in your account, giving you the edge of experts without the stress.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400" />
                <span className="text-xs text-slate-300">Verified ROI</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400" />
                <span className="text-xs text-slate-300">Real-time Execution</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400" />
                <span className="text-xs text-slate-300">No Management Fees</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="glass rounded-2xl p-5 border border-white/[0.05]">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center mb-3">
                <Users size={20} className="text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-white">{traders.length}+</p>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mt-1">Master Traders</p>
            </div>
            <div className="glass rounded-2xl p-5 border border-white/[0.05]">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 flex items-center justify-center mb-3">
                <BarChart3 size={20} className="text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-white">92%</p>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mt-1">Avg. Win Rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            type="text"
            placeholder="Search by name or strategy..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto">
          {['All', 'High ROI', 'Safe', 'Popular'].map((f) => (
            <button key={f} className="px-4 py-2 rounded-xl text-xs font-semibold glass border border-white/[0.05] text-slate-400 hover:text-white hover:bg-white/5 transition-all whitespace-nowrap">
              {f}
            </button>
          ))}
          <button className="p-2.5 rounded-xl glass border border-white/[0.05] text-slate-400 hover:text-white">
            <Filter size={16} />
          </button>
        </div>
      </div>

      {/* Traders Grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="glass rounded-3xl h-80 shimmer border border-white/[0.05]" />
          ))}
        </div>
      ) : filteredTraders.length === 0 ? (
        <div className="py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.03] flex items-center justify-center mx-auto mb-4 border border-white/10">
            <Search size={32} className="text-slate-600" />
          </div>
          <p className="text-white font-semibold">No traders found</p>
          <p className="text-slate-500 text-sm mt-1">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTraders.map((trader) => (
            <motion.div
              key={trader.id}
              className="glass rounded-3xl overflow-hidden border border-white/[0.05] group hover:border-blue-500/30 transition-all duration-300 flex flex-col"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Card Header */}
              <div className="relative p-6 pb-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden bg-blue-600/10 border border-blue-500/20">
                        {trader.avatar_url ? (
                          <img src={trader.avatar_url} alt={trader.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-blue-400 font-bold text-xl">
                            {trader.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#060d1a] flex items-center justify-center">
                        <Shield size={10} className="text-white" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg group-hover:text-blue-400 transition-colors">{trader.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-[10px] text-amber-400 font-bold bg-amber-400/10 px-1.5 py-0.5 rounded-md">
                          <Star size={10} fill="currentColor" /> PRO
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">Verified Strategy</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-400">+{trader.roi_percent}%</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">ROI (All-time)</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                  {trader.bio}
                </p>
                <div className="py-4 border-y border-white/[0.05] space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-400">History (Wins / Losses)</span>
                    <span className="text-emerald-400 font-bold">{trader.win_rate}% Win Rate</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-emerald-400 text-xs font-bold w-12 text-left">{trader.trades_won || 0} W</span>
                    <div className="flex-1 bg-red-500/20 rounded-full h-2 overflow-hidden flex">
                      <div 
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                        style={{ 
                          width: `${
                            ((trader.trades_won || 0) + (trader.trades_lost || 0)) > 0 
                              ? ((trader.trades_won || 0) / ((trader.trades_won || 0) + (trader.trades_lost || 0))) * 100 
                              : trader.win_rate
                          }%` 
                        }} 
                      />
                    </div>
                    <span className="text-red-400 text-xs font-bold w-12 text-right">{trader.trades_lost || 0} L</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                    <span>Total Trades: {(trader.trades_won || 0) + (trader.trades_lost || 0)}</span>
                    <span>Followers: {trader.total_followers.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-4 bg-white/[0.02] flex items-center justify-between gap-4 mt-auto">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-0.5">Subscription</p>
                  <p className="text-lg font-bold text-white">${trader.subscription_rate.toFixed(0)}<span className="text-xs text-slate-500 font-normal">/mo</span></p>
                </div>
                {isSubscribed(trader.id) ? (
                  <button disabled className="px-6 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 text-sm font-bold border border-emerald-500/20 flex items-center gap-2">
                    <CheckCircle2 size={16} /> Subscribed
                  </button>
                ) : (
                  <button 
                    onClick={() => setSelectedTrader(trader)}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all glow-blue flex items-center gap-2 group/btn"
                  >
                    Copy Now <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Subscription Modal */}
      <AnimatePresence>
        {selectedTrader && (
          <motion.div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="glass-strong rounded-3xl p-8 max-w-lg w-full border border-white/10 shadow-2xl relative"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
            >
              <button 
                onClick={() => setSelectedTrader(null)}
                className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>

              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-blue-600/10 border border-blue-500/20">
                  {selectedTrader.avatar_url ? (
                    <img src={selectedTrader.avatar_url} alt={selectedTrader.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-blue-400 font-bold text-2xl">
                      {selectedTrader.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Subscribe to {selectedTrader.name}</h2>
                  <p className="text-sm text-slate-400">Join {selectedTrader.total_followers.toLocaleString()} others following this expert.</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="p-4 bg-white/[0.03] rounded-2xl border border-white/[0.05]">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-slate-400">Subscription Rate</span>
                    <span className="text-lg font-bold text-white">${selectedTrader.subscription_rate.toFixed(2)} / month</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Your Balance</span>
                    <span className={`text-sm font-bold ${profile?.balance ?? 0 >= selectedTrader.subscription_rate ? 'text-emerald-400' : 'text-red-400'}`}>
                      ${Number(profile?.balance ?? 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10 flex gap-3">
                  <Info size={18} className="text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-400 leading-relaxed">
                    By subscribing, you authorize the automated execution of trades based on {selectedTrader.name}&apos;s strategy. You can cancel your subscription at any time from your settings.
                  </p>
                </div>

                {profile && profile.balance < selectedTrader.subscription_rate && (
                  <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20 flex items-center gap-2 text-red-400">
                    <AlertCircle size={16} />
                    <p className="text-xs font-semibold">Insufficient balance to subscribe. Please deposit funds first.</p>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setSelectedTrader(null)}
                  className="flex-1 py-3.5 rounded-2xl glass border border-white/10 text-white font-bold hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    setIsSubscribing(true);
                    subscribeMutation.mutate(selectedTrader);
                  }}
                  disabled={isSubscribing || !profile || profile.balance < selectedTrader.subscription_rate}
                  className="flex-1 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold transition-all glow-blue flex items-center justify-center gap-2"
                >
                  {isSubscribing ? <Loader2 size={18} className="animate-spin" /> : <Copy size={18} />}
                  {isSubscribing ? 'Processing...' : 'Confirm Copy'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
