'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, TrendingUp, Shield, Star, Info, ChevronRight,
  Search, CheckCircle2, AlertCircle, Loader2, X,
  BarChart3, Copy, Activity, ArrowUpRight, ArrowDownRight,
  Clock, RefreshCw, Zap, DollarSign
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
  id: string;
  trader_id: string;
  amount: number;
  status: 'active' | 'cancelled' | 'expired';
  created_at: string;
  last_processed_at: string | null;
  copy_traders?: any;
};

type Position = {
  id: string;
  trader_id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  entry_price: number;
  exit_price: number | null;
  profit_loss_percent: number | null;
  status: 'open' | 'closed';
  created_at: string;
  closed_at: string | null;
  trader_name?: string;
};

type CopyTradeResult = {
  success: boolean;
  credited_count: number;
  total_net_pnl: number;
};

export default function CopyTradingPage() {
  const { profile, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrader, setSelectedTrader] = useState<Trader | null>(null);
  const [activeTab, setActiveTab] = useState<'discover' | 'my-trades'>('discover');
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch traders
  const { data: traders = [], isLoading: loadingTraders } = useQuery({
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

  // Fetch user subscriptions with trader details
  const { data: userSubs = [], isLoading: loadingSubs } = useQuery({
    queryKey: ['user-copy-subs', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from('copy_trading_subscriptions')
        .select(`
          id,
          trader_id,
          amount,
          status,
          created_at,
          last_processed_at,
          copy_traders (
            name,
            avatar_url,
            win_rate,
            roi_percent
          )
        `)
        .eq('user_id', profile.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Subscription[];
    },
    enabled: !!profile?.id,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch active positions for subscribed traders
  const subscribedTraderIds = userSubs.map(s => s.trader_id);
  const { data: positions = [], isLoading: loadingPositions, refetch: refetchPositions } = useQuery({
    queryKey: ['copy-positions', subscribedTraderIds],
    queryFn: async () => {
      if (subscribedTraderIds.length === 0) return [];
      const { data: posData, error } = await supabase
        .from('copy_trader_positions')
        .select('*')
        .in('trader_id', subscribedTraderIds)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;

      // Attach trader names
      return (posData as Position[]).map(pos => {
        const sub = userSubs.find(s => s.trader_id === pos.trader_id);
        const rawTrader = sub?.copy_traders;
        const trader = Array.isArray(rawTrader) ? rawTrader[0] : rawTrader;
        return { ...pos, trader_name: trader?.name ?? 'Unknown' };
      });
    },
    enabled: subscribedTraderIds.length > 0,
    refetchInterval: 60000, // Refresh every 60 seconds
  });

  // Fetch recent copy trade transactions (P&L history)
  const { data: recentPnL = [] } = useQuery({
    queryKey: ['copy-trade-pnl', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', profile.id)
        .filter('metadata->>is_copy_trade', 'eq', 'true')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
    refetchInterval: 30000,
  });

  // Subscribe mutation
  const subscribeMutation = useMutation({
    mutationFn: async (trader: Trader) => {
      if (!profile) throw new Error('Not logged in');
      if (profile.balance < trader.subscription_rate) {
        throw new Error(`Insufficient balance. Need $${trader.subscription_rate.toFixed(2)}`);
      }

      const { error: subError } = await supabase
        .from('copy_trading_subscriptions')
        .insert({
          user_id: profile.id,
          trader_id: trader.id,
          amount: trader.subscription_rate,
          status: 'active',
        });
      if (subError) throw subError;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ balance: profile.balance - trader.subscription_rate })
        .eq('id', profile.id);
      if (profileError) throw profileError;

      await supabase.from('transactions').insert({
        user_id: profile.id,
        type: 'investment',
        amount: trader.subscription_rate,
        status: 'completed',
        description: `Copy Trading subscription: ${trader.name}`,
        reference: `COPY-${trader.id.slice(0, 8)}`,
        metadata: { trader_id: trader.id, trader_name: trader.name },
      });

      await supabase
        .from('copy_traders')
        .update({ total_followers: trader.total_followers + 1 })
        .eq('id', trader.id);
    },
    onSuccess: () => {
      toast.success('Successfully subscribed! Trades will sync automatically.');
      queryClient.invalidateQueries({ queryKey: ['user-copy-subs'] });
      queryClient.invalidateQueries({ queryKey: ['copy-traders'] });
      refreshProfile();
      setSelectedTrader(null);
      setActiveTab('my-trades');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to subscribe'),
  });

  // Process copy trades (claim profits)
  const processMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.id) throw new Error('Not logged in');
      const { data, error } = await supabase.rpc('process_user_copy_trades', {
        target_user_id: profile.id,
      });
      if (error) throw error;
      return data as CopyTradeResult;
    },
    onSuccess: (result) => {
      if (result.credited_count > 0) {
        const pnl = result.total_net_pnl;
        toast.success(
          `Synced ${result.credited_count} trade(s). Net PnL: ${pnl >= 0 ? '+' : ''}$${Math.abs(pnl).toFixed(2)}`,
          { duration: 5000 }
        );
      } else {
        toast('No new trades to process yet. Check back later.', { icon: '📊' });
      }
      queryClient.invalidateQueries({ queryKey: ['copy-trade-pnl'] });
      queryClient.invalidateQueries({ queryKey: ['copy-positions'] });
      refreshProfile();
      refetchPositions();
    },
    onError: (err: any) => toast.error(err.message || 'Failed to process trades'),
    onSettled: () => setIsProcessing(false),
  });

  // Cancel subscription
  const cancelMutation = useMutation({
    mutationFn: async (subId: string) => {
      const { error } = await supabase
        .from('copy_trading_subscriptions')
        .update({ status: 'cancelled' })
        .eq('id', subId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Subscription cancelled');
      queryClient.invalidateQueries({ queryKey: ['user-copy-subs'] });
    },
    onError: (err: any) => toast.error(err.message || 'Failed to cancel'),
  });

  const filteredTraders = traders.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.bio.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isSubscribed = (traderId: string) => userSubs.some(s => s.trader_id === traderId);

  const openPositions = positions.filter(p => p.status === 'open');
  const closedPositions = positions.filter(p => p.status === 'closed').slice(0, 10);

  const totalPnL = recentPnL.reduce((acc: number, tx: any) => {
    const amount = Number(tx.amount);
    return tx.type === 'profit' ? acc + amount : acc - amount;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden glass rounded-3xl p-6 md:p-8 border border-white/[0.05]">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 grid md:grid-cols-2 gap-6 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-4">
              <Zap size={12} />
              Auto-Sync Active
            </div>
            <h1 className="text-3xl font-bold text-white mb-3 leading-tight">
              Copy Pro Traders,{' '}
              <span className="gradient-text">Earn Automatically</span>
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Subscribe to verified master traders. Their P&L is automatically calculated and
              credited to your account as trades close.
            </p>
            <div className="flex flex-wrap gap-3">
              {['Verified ROI', 'Auto-Sync Payouts', 'Real-time Positions'].map(f => (
                <div key={f} className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-400" />
                  <span className="text-xs text-slate-300">{f}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="glass rounded-2xl p-4 border border-white/[0.05]">
              <div className="w-9 h-9 rounded-xl bg-blue-600/20 flex items-center justify-center mb-2">
                <Users size={18} className="text-blue-400" />
              </div>
              <p className="text-xl font-bold text-white">{traders.length}+</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mt-1">Master Traders</p>
            </div>
            <div className="glass rounded-2xl p-4 border border-white/[0.05]">
              <div className="w-9 h-9 rounded-xl bg-emerald-600/20 flex items-center justify-center mb-2">
                <BarChart3 size={18} className="text-emerald-400" />
              </div>
              <p className="text-xl font-bold text-white">{userSubs.length}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mt-1">My Subscriptions</p>
            </div>
            <div className="glass rounded-2xl p-4 border border-white/[0.05]">
              <div className="w-9 h-9 rounded-xl bg-amber-600/20 flex items-center justify-center mb-2">
                <Activity size={18} className="text-amber-400" />
              </div>
              <p className="text-xl font-bold text-white">{openPositions.length}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mt-1">Open Positions</p>
            </div>
            <div className={`glass rounded-2xl p-4 border ${totalPnL >= 0 ? 'border-emerald-500/20' : 'border-red-500/20'}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${totalPnL >= 0 ? 'bg-emerald-600/20' : 'bg-red-600/20'}`}>
                <DollarSign size={18} className={totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'} />
              </div>
              <p className={`text-xl font-bold ${totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {totalPnL >= 0 ? '+' : ''}${Math.abs(totalPnL).toFixed(2)}
              </p>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mt-1">Net P&L</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-white/[0.02] rounded-2xl border border-white/[0.05] w-fit">
        {(['discover', 'my-trades'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all capitalize ${
              activeTab === tab
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab === 'discover' ? '🔍 Discover Traders' : '📊 My Copy Trades'}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'discover' ? (
          <motion.div
            key="discover"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Search */}
            <div className="relative w-full max-w-md">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search by name or strategy..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-all"
              />
            </div>

            {/* Traders Grid */}
            {loadingTraders ? (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="glass rounded-3xl h-72 shimmer border border-white/[0.05]" />
                ))}
              </div>
            ) : filteredTraders.length === 0 ? (
              <div className="py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.03] flex items-center justify-center mx-auto mb-4 border border-white/10">
                  <Search size={32} className="text-slate-600" />
                </div>
                <p className="text-white font-semibold">No traders found</p>
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
                              <span className="text-[10px] text-slate-500 font-medium">Verified</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-emerald-400">+{trader.roi_percent.toFixed(1)}%</p>
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">ROI</p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">{trader.bio}</p>

                      <div className="py-3 border-y border-white/[0.05] space-y-2">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-400">Win Rate</span>
                          <span className="text-emerald-400 font-bold">{trader.win_rate}%</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className="text-emerald-400 text-xs font-bold w-10 text-left">{trader.trades_won}W</span>
                          <div className="flex-1 bg-red-500/20 rounded-full h-1.5 overflow-hidden flex">
                            <div
                              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${
                                  (trader.trades_won + trader.trades_lost) > 0
                                    ? (trader.trades_won / (trader.trades_won + trader.trades_lost)) * 100
                                    : trader.win_rate
                                }%`
                              }}
                            />
                          </div>
                          <span className="text-red-400 text-xs font-bold w-10 text-right">{trader.trades_lost}L</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500">
                          <span>Followers: {trader.total_followers.toLocaleString()}</span>
                          <span>Trades: {trader.trades_won + trader.trades_lost}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-white/[0.02] flex items-center justify-between gap-4 mt-auto">
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-0.5">Subscription</p>
                        <p className="text-lg font-bold text-white">${trader.subscription_rate.toFixed(0)}<span className="text-xs text-slate-500 font-normal">/mo</span></p>
                      </div>
                      {isSubscribed(trader.id) ? (
                        <button disabled className="px-5 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 flex items-center gap-1.5">
                          <CheckCircle2 size={14} /> Subscribed
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelectedTrader(trader)}
                          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all glow-blue flex items-center gap-1.5 group/btn"
                        >
                          Copy Now <ChevronRight size={14} className="group-hover/btn:translate-x-0.5 transition-transform" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="my-trades"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Sync Button */}
            <div className="flex items-center justify-between">
              <p className="text-slate-400 text-sm">
                {userSubs.length === 0 ? 'No active subscriptions' : `${userSubs.length} active subscription${userSubs.length > 1 ? 's' : ''}`}
              </p>
              <button
                onClick={() => {
                  setIsProcessing(true);
                  processMutation.mutate();
                }}
                disabled={processMutation.isPending || userSubs.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all"
              >
                <RefreshCw size={14} className={processMutation.isPending ? 'animate-spin' : ''} />
                {processMutation.isPending ? 'Syncing...' : 'Sync Profits Now'}
              </button>
            </div>

            {/* Active Subscriptions */}
            {userSubs.length === 0 ? (
              <div className="glass rounded-3xl p-12 text-center border border-white/[0.05]">
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                  <Copy size={28} className="text-blue-400" />
                </div>
                <p className="text-white font-semibold mb-2">No active subscriptions</p>
                <p className="text-slate-500 text-sm mb-6">Subscribe to a master trader to start copying their trades automatically.</p>
                <button
                  onClick={() => setActiveTab('discover')}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all"
                >
                  Discover Traders
                </button>
              </div>
            ) : (
              <>
                {/* Subscriptions list */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-300">Active Subscriptions</h3>
                  {userSubs.map(sub => {
                    const trader = Array.isArray(sub.copy_traders)
                      ? sub.copy_traders[0]
                      : sub.copy_traders;
                    return (
                      <div key={sub.id} className="glass rounded-2xl p-4 border border-white/[0.05] flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm">
                            {trader?.name?.charAt(0) ?? '?'}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">{trader?.name ?? 'Unknown Trader'}</p>
                            <p className="text-xs text-slate-500">
                              ${sub.amount}/mo · Subscribed {new Date(sub.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="hidden sm:block text-right">
                            <p className="text-xs text-slate-500">Win Rate</p>
                            <p className="text-sm font-bold text-emerald-400">{trader?.win_rate ?? '—'}%</p>
                          </div>
                          <button
                            onClick={() => cancelMutation.mutate(sub.id)}
                            disabled={cancelMutation.isPending}
                            className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors border border-red-500/10 font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Live Positions */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                      </span>
                      Live Positions ({openPositions.length})
                    </h3>
                    <button
                      onClick={() => refetchPositions()}
                      className="text-xs text-slate-500 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      <RefreshCw size={11} /> Refresh
                    </button>
                  </div>

                  {loadingPositions ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map(i => <div key={i} className="h-14 glass rounded-xl shimmer" />)}
                    </div>
                  ) : openPositions.length === 0 ? (
                    <div className="glass rounded-2xl p-6 text-center border border-white/[0.05]">
                      <Clock size={24} className="text-slate-600 mx-auto mb-2" />
                      <p className="text-slate-500 text-sm">No open positions right now. Traders will open positions periodically.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {openPositions.map(pos => (
                        <div key={pos.id} className="glass rounded-xl p-3 border border-white/[0.04] flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${pos.type === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                              {pos.type === 'BUY' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-white">{pos.symbol}</p>
                              <p className="text-[10px] text-slate-500">{pos.trader_name} · Entry ${pos.entry_price.toFixed(2)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded-md font-bold ${pos.type === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                              {pos.type}
                            </span>
                            <span className="text-xs text-slate-500 hidden sm:block">
                              {new Date(pos.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Closed Positions */}
                {closedPositions.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-300 mb-3">Recent Closed Positions</h3>
                    <div className="space-y-2">
                      {closedPositions.map(pos => (
                        <div key={pos.id} className="glass rounded-xl p-3 border border-white/[0.04] flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              (pos.profit_loss_percent ?? 0) >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'
                            }`}>
                              {(pos.profit_loss_percent ?? 0) >= 0
                                ? <ArrowUpRight size={16} className="text-emerald-400" />
                                : <ArrowDownRight size={16} className="text-red-400" />}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-white">{pos.symbol} <span className="text-xs text-slate-500">{pos.type}</span></p>
                              <p className="text-[10px] text-slate-500">{pos.trader_name}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-bold ${(pos.profit_loss_percent ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {(pos.profit_loss_percent ?? 0) >= 0 ? '+' : ''}{pos.profit_loss_percent?.toFixed(2)}%
                            </p>
                            <p className="text-[10px] text-slate-500">{pos.closed_at ? new Date(pos.closed_at).toLocaleDateString() : '—'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

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

              <div className="flex items-center gap-4 mb-6">
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
                  <p className="text-sm text-slate-400">{selectedTrader.total_followers.toLocaleString()} followers</p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="p-4 bg-white/[0.03] rounded-2xl border border-white/[0.05] space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Subscription Rate</span>
                    <span className="font-bold text-white">${selectedTrader.subscription_rate.toFixed(2)}/mo</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Your Balance</span>
                    <span className={`font-bold ${Number(profile?.balance ?? 0) >= selectedTrader.subscription_rate ? 'text-emerald-400' : 'text-red-400'}`}>
                      ${Number(profile?.balance ?? 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Win Rate</span>
                    <span className="font-bold text-emerald-400">{selectedTrader.win_rate}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">All-time ROI</span>
                    <span className="font-bold text-emerald-400">+{selectedTrader.roi_percent.toFixed(1)}%</span>
                  </div>
                </div>

                <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10 flex gap-3">
                  <Info size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Profits and losses from {selectedTrader.name}&apos;s trades will be automatically applied to your balance. Use the &quot;Sync Profits&quot; button to claim latest earnings.
                  </p>
                </div>

                {profile && profile.balance < selectedTrader.subscription_rate && (
                  <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20 flex items-center gap-2 text-red-400">
                    <AlertCircle size={16} />
                    <p className="text-xs font-semibold">Insufficient balance. Please deposit first.</p>
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
                  onClick={() => subscribeMutation.mutate(selectedTrader)}
                  disabled={subscribeMutation.isPending || !profile || profile.balance < selectedTrader.subscription_rate}
                  className="flex-1 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold transition-all glow-blue flex items-center justify-center gap-2"
                >
                  {subscribeMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Copy size={18} />}
                  {subscribeMutation.isPending ? 'Processing...' : 'Confirm & Subscribe'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
