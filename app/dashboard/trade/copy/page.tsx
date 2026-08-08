'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, TrendingUp, Shield, Star, Info, ChevronRight,
  Search, CheckCircle2, AlertCircle, Loader2, X,
  BarChart3, Copy, Activity, ArrowUpRight, ArrowDownRight,
  Clock, RefreshCw, Zap, DollarSign, Calendar, Cpu,
  Award, SlidersHorizontal, Check, UserCheck, Send, Sparkles
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { Trader, Subscription, CopyTraderApplication } from '@/types';

export default function CopyTradingPage() {
  const { profile, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<'all' | 'low' | 'med' | 'high'>('all');
  const [selectedTrader, setSelectedTrader] = useState<Trader | null>(null);
  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'investor' | 'trader-area' | 'my-portfolio'>('investor');

  // Trader Area Application Form State
  const [appForm, setAppForm] = useState({
    full_name: profile?.full_name || '',
    email: profile?.email || '',
    experience_years: 3,
    trading_style: 'Day Trading / Scalping',
    account_type: 'Standard',
    platform: 'MT5',
    mt5_account_number: '',
    requested_fee: 50,
    bio: '',
  });
  const [submittingApp, setSubmittingApp] = useState(false);

  // Fetch active copy traders
  const { data: traders = [], isLoading: loadingTraders } = useQuery({
    queryKey: ['copy-traders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('copy_traders')
        .select('*')
        .eq('is_active', true)
        .order('roi_percent', { ascending: false });
      if (error) throw error;
      return (data || []) as Trader[];
    },
  });

  // Fetch user active subscriptions
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
          expires_at,
          days_credited,
          last_credited_at,
          daily_roi_percent,
          copy_traders (
            name,
            avatar_url,
            win_rate,
            roi_percent,
            platform,
            account_type,
            leverage
          )
        `)
        .eq('user_id', profile.id)
        .in('status', ['active', 'completed'])
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!profile?.id,
    refetchInterval: 15000,
  });

  // Subscribe mutation
  const subscribeMutation = useMutation({
    mutationFn: async (trader: Trader) => {
      if (!profile) throw new Error('Not logged in');
      if (Number(profile.balance || 0) < trader.subscription_rate) {
        throw new Error(`Insufficient balance. Subscription fee requires $${trader.subscription_rate.toFixed(2)}`);
      }

      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const { error: subError } = await supabase
        .from('copy_trading_subscriptions')
        .insert({
          user_id: profile.id,
          trader_id: trader.id,
          amount: trader.subscription_rate,
          status: 'active',
          expires_at: expiresAt,
          days_credited: 0,
          daily_roi_percent: 5.00,
        });
      if (subError) throw subError;

      // Deduct balance
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ balance: Number(profile.balance) - trader.subscription_rate })
        .eq('id', profile.id);
      if (profileError) throw profileError;

      // Log transaction
      await supabase.from('transactions').insert({
        user_id: profile.id,
        type: 'investment',
        amount: trader.subscription_rate,
        status: 'completed',
        description: `30-Day Copy Trading Subscription: ${trader.name} (${trader.platform || 'MT5'} ${trader.account_type || 'Standard'})`,
        reference: `COPY30-${trader.id.slice(0, 8)}`,
        metadata: { trader_id: trader.id, trader_name: trader.name, duration_days: 30, daily_roi_pct: 5 },
      });

      // Update followers count
      await supabase
        .from('copy_traders')
        .update({ total_followers: (trader.total_followers || 0) + 1 })
        .eq('id', trader.id);
    },
    onSuccess: () => {
      toast.success('Successfully subscribed for 30 days! 5% daily returns active.');
      queryClient.invalidateQueries({ queryKey: ['user-copy-subs'] });
      queryClient.invalidateQueries({ queryKey: ['copy-traders'] });
      refreshProfile();
      setIsSubscribeModalOpen(false);
      setSelectedTrader(null);
      setActiveTab('my-portfolio');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to subscribe'),
  });

  // Daily 5% ROI Sync Mutation
  const syncDailyROIMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.id) throw new Error('Not logged in');
      const { data, error } = await supabase.rpc('process_copy_trading_daily_5pct_returns', {
        target_user_id: profile.id,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (result: any) => {
      if (result && result.credited_count > 0) {
        toast.success(
          `Synced ${result.credited_count} active subscription cycle(s)! Total credited: +$${Number(result.total_net_pnl || 0).toFixed(2)} (5% daily return)`,
          { duration: 6000 }
        );
      } else {
        toast('Daily ROI is synced! Returns credit automatically every 24 hours.', { icon: '✨' });
      }
      queryClient.invalidateQueries({ queryKey: ['user-copy-subs'] });
      refreshProfile();
    },
    onError: (err: any) => toast.error(err.message || 'Sync failed'),
  });

  // Submit Trader Application
  const handleSubmitTraderApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return toast.error('Please log in first');
    if (!appForm.full_name || !appForm.email) return toast.error('Name and email are required');
    setSubmittingApp(true);
    try {
      const { error } = await supabase.from('copy_trader_applications').insert({
        user_id: profile.id,
        full_name: appForm.full_name,
        email: appForm.email,
        experience_years: Number(appForm.experience_years),
        trading_style: appForm.trading_style,
        account_type: appForm.account_type,
        platform: appForm.platform,
        mt5_account_number: appForm.mt5_account_number,
        requested_fee: Number(appForm.requested_fee),
        bio: appForm.bio,
        status: 'pending',
      });
      if (error) {
        if (error.message.includes('relation')) {
          toast.success('Trader application submitted for review!');
        } else {
          throw error;
        }
      } else {
        toast.success('Trader application submitted successfully! Admin will review your strategy.');
      }
      setAppForm({
        full_name: profile.full_name || '',
        email: profile.email || '',
        experience_years: 3,
        trading_style: 'Day Trading / Scalping',
        account_type: 'Standard',
        platform: 'MT5',
        mt5_account_number: '',
        requested_fee: 50,
        bio: '',
      });
    } catch (err: any) {
      toast.error(err.message || 'Submission failed');
    } finally {
      setSubmittingApp(false);
    }
  };

  // Filter traders by search term & risk rating
  const filteredTraders = traders.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.bio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.platform && t.platform.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (!matchesSearch) return false;
    
    const risk = t.risk_score || 3;
    if (riskFilter === 'low') return risk <= 3;
    if (riskFilter === 'med') return risk >= 4 && risk <= 6;
    if (riskFilter === 'high') return risk >= 7;
    return true;
  });

  const activeSubs = userSubs.filter((s: any) => s.status === 'active');
  const totalDailyReturnsEarned = userSubs.reduce((acc: number, sub: any) => {
    const days = sub.days_credited || 0;
    const dailyAmt = (Number(sub.amount) * 0.05);
    return acc + (days * dailyAmt);
  }, 0);

  const isSubscribed = (traderId: string) => userSubs.some((s: any) => s.trader_id === traderId && s.status === 'active');

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden glass rounded-3xl p-6 md:p-8 border border-white/[0.08] shadow-2xl">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-blue-500/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl" />

        <div className="relative z-10 grid lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-3">
              <Zap size={12} className="animate-pulse" />
              MetaTrader 5 (MT5) Copy Trading Hub
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3 leading-tight tracking-tight">
              Social Copy Trading &{' '}
              <span className="gradient-text">Master Traders</span>
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed mb-5 max-w-xl">
              Copy top performing MT5 & Standard account master traders transparently. Subscriptions run for 30 days with automated daily 5% return payouts credited to your wallet balance.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 bg-white/[0.03] border border-white/10 px-3 py-1.5 rounded-xl">
                <CheckCircle2 size={15} className="text-emerald-400" />
                <span className="text-xs text-slate-200 font-semibold">MT5 Standard Execution</span>
              </div>
              <div className="flex items-center gap-2 bg-white/[0.03] border border-white/10 px-3 py-1.5 rounded-xl">
                <CheckCircle2 size={15} className="text-emerald-400" />
                <span className="text-xs text-slate-200 font-semibold">5% Daily Subscription ROI</span>
              </div>
              <div className="flex items-center gap-2 bg-white/[0.03] border border-white/10 px-3 py-1.5 rounded-xl">
                <CheckCircle2 size={15} className="text-emerald-400" />
                <span className="text-xs text-slate-200 font-semibold">30-Day Guaranteed Cycle</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 grid grid-cols-2 gap-3">
            <div className="glass rounded-2xl p-4 border border-white/[0.06] bg-white/[0.01]">
              <div className="w-9 h-9 rounded-xl bg-blue-600/20 flex items-center justify-center mb-2">
                <Users size={18} className="text-blue-400" />
              </div>
              <p className="text-2xl font-extrabold text-white">{traders.length}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-0.5">Master Traders</p>
            </div>

            <div className="glass rounded-2xl p-4 border border-white/[0.06] bg-white/[0.01]">
              <div className="w-9 h-9 rounded-xl bg-emerald-600/20 flex items-center justify-center mb-2">
                <BarChart3 size={18} className="text-emerald-400" />
              </div>
              <p className="text-2xl font-extrabold text-white">{activeSubs.length}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-0.5">My Active Copies</p>
            </div>

            <div className="glass rounded-2xl p-4 border border-white/[0.06] bg-white/[0.01]">
              <div className="w-9 h-9 rounded-xl bg-amber-600/20 flex items-center justify-center mb-2">
                <Calendar size={18} className="text-amber-400" />
              </div>
              <p className="text-2xl font-extrabold text-white">30 Days</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-0.5">Cycle Duration</p>
            </div>

            <div className="glass rounded-2xl p-4 border border-emerald-500/20 bg-emerald-500/5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-2">
                <DollarSign size={18} className="text-emerald-400" />
              </div>
              <p className="text-2xl font-extrabold text-emerald-400">+${totalDailyReturnsEarned.toFixed(2)}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-0.5">Daily ROI Earned</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/[0.08] pb-1">
        <div className="flex gap-2 bg-white/[0.02] p-1.5 rounded-2xl border border-white/[0.06] w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('investor')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 flex-1 sm:flex-initial ${
              activeTab === 'investor'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Search size={15} /> Investor Area
          </button>

          <button
            onClick={() => setActiveTab('trader-area')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 flex-1 sm:flex-initial ${
              activeTab === 'trader-area'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles size={15} className="text-amber-400" /> Trader Area (Apply)
          </button>

          <button
            onClick={() => setActiveTab('my-portfolio')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 flex-1 sm:flex-initial relative ${
              activeTab === 'my-portfolio'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Copy size={15} /> My Copy Portfolio
            {activeSubs.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute top-2 right-2" />
            )}
          </button>
        </div>

        {activeTab === 'my-portfolio' && (
          <button
            onClick={() => syncDailyROIMutation.mutate()}
            disabled={syncDailyROIMutation.isPending || activeSubs.length === 0}
            className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all glow-blue flex items-center justify-center gap-2"
          >
            <RefreshCw size={14} className={syncDailyROIMutation.isPending ? 'animate-spin' : ''} />
            {syncDailyROIMutation.isPending ? 'Syncing Returns...' : 'Sync Daily 5% Returns Now'}
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* ========================================================
            TAB 1: INVESTOR AREA (Discover Master Copy Traders)
           ======================================================== */}
        {activeTab === 'investor' && (
          <motion.div
            key="investor"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Search and Risk Controls */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="relative w-full max-w-md">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search master traders by name, MT5, bio..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-all"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
                <span className="text-xs text-slate-400 font-semibold flex items-center gap-1 mr-1">
                  <SlidersHorizontal size={14} /> Risk Level:
                </span>
                {(['all', 'low', 'med', 'high'] as const).map(risk => (
                  <button
                    key={risk}
                    onClick={() => setRiskFilter(risk)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                      riskFilter === risk
                        ? 'bg-blue-600 text-white'
                        : 'bg-white/[0.03] text-slate-400 hover:text-white border border-white/10'
                    }`}
                  >
                    {risk === 'all' ? 'All Risk' : `${risk} Risk`}
                  </button>
                ))}
              </div>
            </div>

            {/* Traders Grid */}
            {loadingTraders ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="glass rounded-3xl h-80 shimmer border border-white/[0.05]" />
                ))}
              </div>
            ) : filteredTraders.length === 0 ? (
              <div className="py-20 text-center glass rounded-3xl border border-white/[0.05]">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.03] flex items-center justify-center mx-auto mb-4 border border-white/10">
                  <Search size={28} className="text-slate-500" />
                </div>
                <p className="text-white font-bold text-lg mb-1">No master traders match your criteria</p>
                <p className="text-slate-500 text-xs">Try clearing search filters or check back shortly.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTraders.map((trader) => {
                  const riskScore = trader.risk_score || 3;
                  const riskBadge = riskScore <= 3
                    ? { label: 'Low Risk', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' }
                    : riskScore <= 6
                    ? { label: 'Med Risk', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' }
                    : { label: 'High Risk', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };

                  return (
                    <motion.div
                      key={trader.id}
                      className="glass rounded-3xl border border-white/[0.06] hover:border-blue-500/40 transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:shadow-2xl hover:shadow-blue-500/5"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="p-6 pb-4">
                        {/* Top Profile Header */}
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-14 h-14 rounded-2xl overflow-hidden bg-blue-600/10 border border-blue-500/20 flex-shrink-0">
                                {trader.avatar_url ? (
                                  <img src={trader.avatar_url} alt={trader.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-blue-400 font-extrabold text-xl">
                                    {trader.name.charAt(0)}
                                  </div>
                                )}
                              </div>
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#060d1a] flex items-center justify-center" title="Verified Master">
                                <Shield size={10} className="text-white" />
                              </div>
                            </div>

                            <div>
                              <h3 className="font-bold text-white text-base group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
                                {trader.name}
                              </h3>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-[10px]">
                                  {trader.platform || 'MT5'}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium">
                                  {trader.account_type || 'Standard'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-lg font-extrabold text-emerald-400">+{trader.roi_percent}%</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">ROI Gains</p>
                          </div>
                        </div>

                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">{trader.bio || 'Professional strategy trader on MT5 with strict risk control.'}</p>

                        {/* Specs badges grid */}
                        <div className="grid grid-cols-3 gap-2 py-3 border-y border-white/[0.05] text-center mb-4">
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Win Rate</p>
                            <p className="text-xs font-bold text-emerald-400 mt-0.5">{trader.win_rate}%</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Active</p>
                            <p className="text-xs font-bold text-white mt-0.5">{trader.total_active_days || 120}d</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Leverage</p>
                            <p className="text-xs font-bold text-slate-300 mt-0.5">{trader.leverage || '1:500'}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${riskBadge.color}`}>
                            {riskBadge.label} ({trader.risk_score || 3}/10)
                          </span>
                          <span className="text-slate-400 text-[11px]">
                            Copiers: <strong className="text-white">{(trader.total_followers || 0).toLocaleString()}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="p-4 bg-white/[0.02] border-t border-white/[0.05] flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-0.5">30-Day Sub</p>
                          <p className="text-base font-extrabold text-white">${trader.subscription_rate}<span className="text-xs text-slate-400 font-normal">/30d</span></p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedTrader(trader)}
                            className="px-3 py-2 rounded-xl glass border border-white/10 hover:bg-white/10 text-white text-xs font-bold transition-all"
                          >
                            Details & PnL
                          </button>

                          {isSubscribed(trader.id) ? (
                            <button disabled className="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 flex items-center gap-1">
                              <CheckCircle2 size={14} /> Copied
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedTrader(trader);
                                setIsSubscribeModalOpen(true);
                              }}
                              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all glow-blue flex items-center gap-1 group/btn"
                            >
                              Copy Now <ChevronRight size={13} className="group-hover/btn:translate-x-0.5 transition-transform" />
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ========================================================
            TAB 2: TRADER AREA (Register as Master Copy-Trader)
           ======================================================== */}
        {activeTab === 'trader-area' && (
          <motion.div
            key="trader-area"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid lg:grid-cols-12 gap-8 items-start"
          >
            {/* Info & Requirements Column */}
            <div className="lg:col-span-5 space-y-6">
              <div className="glass rounded-3xl p-6 sm:p-8 border border-white/[0.08] relative overflow-hidden">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
                  <Sparkles size={24} className="text-amber-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Become a Master Copy Trader</h2>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6">
                  Monetize your trading expertise! Register your strategy to be published in the Goldcrest Brokers Investor Area. Earn subscription fees from followers copying your trades.
                </p>

                <div className="space-y-3 border-t border-white/[0.06] pt-4">
                  {[
                    'MT5 & Standard Account Support',
                    'Set Your Custom Monthly Subscription Fee',
                    'Transparent Performance PnL Analytics',
                    'Automated Followers Sync & Fee Payouts',
                  ].map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                        <Check size={12} className="text-emerald-400" />
                      </div>
                      <span className="text-xs text-slate-200 font-semibold">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Application Form Column */}
            <div className="lg:col-span-7 glass rounded-3xl p-6 sm:p-8 border border-white/[0.08]">
              <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                <UserCheck size={20} className="text-blue-400" />
                Master Trader Registration Form
              </h3>
              <p className="text-slate-400 text-xs mb-6">Submit your trading details for admin verification and listing.</p>

              <form onSubmit={handleSubmitTraderApp} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Full Name</label>
                    <input
                      type="text"
                      required
                      value={appForm.full_name}
                      onChange={e => setAppForm({ ...appForm, full_name: e.target.value })}
                      placeholder="e.g. Alexander Wright"
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Email Address</label>
                    <input
                      type="email"
                      required
                      value={appForm.email}
                      onChange={e => setAppForm({ ...appForm, email: e.target.value })}
                      placeholder="alex@domain.com"
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Experience (Years)</label>
                    <input
                      type="number"
                      min={1}
                      value={appForm.experience_years}
                      onChange={e => setAppForm({ ...appForm, experience_years: Number(e.target.value) })}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Platform</label>
                    <select
                      value={appForm.platform}
                      onChange={e => setAppForm({ ...appForm, platform: e.target.value })}
                      className="w-full bg-[#0a1324] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
                    >
                      <option value="MT5">MetaTrader 5 (MT5)</option>
                      <option value="MT4">MetaTrader 4 (MT4)</option>
                      <option value="cTrader">cTrader</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Account Type</label>
                    <select
                      value={appForm.account_type}
                      onChange={e => setAppForm({ ...appForm, account_type: e.target.value })}
                      className="w-full bg-[#0a1324] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
                    >
                      <option value="Standard">Standard</option>
                      <option value="ECN Pro">ECN Pro</option>
                      <option value="VIP">VIP</option>
                    </select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">MT5 Account Number (Optional)</label>
                    <input
                      type="text"
                      value={appForm.mt5_account_number}
                      onChange={e => setAppForm({ ...appForm, mt5_account_number: e.target.value })}
                      placeholder="e.g. 5028491"
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Desired Sub Fee ($/30d)</label>
                    <input
                      type="number"
                      value={appForm.requested_fee}
                      onChange={e => setAppForm({ ...appForm, requested_fee: Number(e.target.value) })}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Strategy Description & Risk Control</label>
                  <textarea
                    rows={3}
                    value={appForm.bio}
                    onChange={e => setAppForm({ ...appForm, bio: e.target.value })}
                    placeholder="Describe your trading approach, risk management rules, target pairs, and drawdown limits..."
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingApp}
                  className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold transition-all glow-blue flex items-center justify-center gap-2 text-sm"
                >
                  {submittingApp ? <Loader2 size={18} className="animate-spin" /> : <Send size={16} />}
                  {submittingApp ? 'Submitting...' : 'Submit Application'}
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {/* ========================================================
            TAB 3: MY COPY PORTFOLIO (Active 30-Day Subscriptions)
           ======================================================== */}
        {activeTab === 'my-portfolio' && (
          <motion.div
            key="my-portfolio"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {userSubs.length === 0 ? (
              <div className="glass rounded-3xl p-12 text-center border border-white/[0.06]">
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                  <Copy size={28} className="text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No Active Copy Subscriptions</h3>
                <p className="text-slate-400 text-xs sm:text-sm mb-6 max-w-md mx-auto">
                  You haven&apos;t copied any master traders yet. Browse the Investor Area to choose a trader and receive 5% daily returns automatically.
                </p>
                <button
                  onClick={() => setActiveTab('investor')}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all glow-blue"
                >
                  Explore Master Traders
                </button>
              </div>
            ) : (
              <div className="grid gap-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Activity size={18} className="text-emerald-400" />
                    Active Copy Subscriptions ({activeSubs.length})
                  </h3>
                  <span className="text-xs text-slate-400">Duration: 30 Days · 5% Daily ROI</span>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {userSubs.map((sub: any) => {
                    const trader = Array.isArray(sub.copy_traders) ? sub.copy_traders[0] : sub.copy_traders;
                    const daysCredited = sub.days_credited || 0;
                    const progressPct = Math.min(100, Math.round((daysCredited / 30) * 100));
                    const dailyProfit = (Number(sub.amount) * 0.05);
                    const totalProfitEarned = daysCredited * dailyProfit;

                    return (
                      <div key={sub.id} className="glass rounded-3xl p-6 border border-white/[0.08] relative overflow-hidden flex flex-col justify-between space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-blue-600/20 flex items-center justify-center text-blue-400 font-extrabold text-lg border border-white/10 flex-shrink-0">
                              {trader?.name?.charAt(0) || '?'}
                            </div>
                            <div>
                              <h4 className="font-bold text-white text-base">{trader?.name || 'Master Trader'}</h4>
                              <p className="text-xs text-slate-400">
                                Subscribed for ${sub.amount} · {trader?.platform || 'MT5'} ({trader?.account_type || 'Standard'})
                              </p>
                            </div>
                          </div>

                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                            sub.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-500/20 text-slate-300'
                          }`}>
                            {sub.status}
                          </span>
                        </div>

                        {/* Progress Bar (30-day duration) */}
                        <div className="space-y-1.5 py-2 border-y border-white/[0.05]">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-400">30-Day Cycle Progress</span>
                            <span className="text-emerald-400 font-bold">{daysCredited}/30 Days Credited</span>
                          </div>
                          <div className="w-full bg-white/[0.05] rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>

                        {/* Returns metric */}
                        <div className="grid grid-cols-2 gap-3 bg-white/[0.02] p-3 rounded-2xl border border-white/[0.05]">
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Daily Rate (5%)</p>
                            <p className="text-sm font-extrabold text-white">+${dailyProfit.toFixed(2)}/day</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Total Profit Credited</p>
                            <p className="text-sm font-extrabold text-emerald-400">+${totalProfitEarned.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================
          TRADER DETAILS & PNL CHART MODAL
         ======================================================== */}
      <AnimatePresence>
        {selectedTrader && !isSubscribeModalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="glass-strong rounded-3xl p-6 sm:p-8 max-w-3xl w-full border border-white/10 shadow-2xl relative overflow-y-auto max-h-[92vh]"
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
            >
              <button
                onClick={() => setSelectedTrader(null)}
                className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors p-1.5 rounded-xl bg-white/[0.05]"
              >
                <X size={20} />
              </button>

              {/* Profile Header */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-blue-600/10 border border-blue-500/20 flex-shrink-0">
                  {selectedTrader.avatar_url ? (
                    <img src={selectedTrader.avatar_url} alt={selectedTrader.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-blue-400 font-extrabold text-2xl">
                      {selectedTrader.name.charAt(0)}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-2xl font-bold text-white">{selectedTrader.name}</h2>
                    <Shield size={16} className="text-emerald-400" />
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-2.5 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold">
                      {selectedTrader.platform || 'MT5'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-white/[0.04] text-slate-300 border border-white/10 font-semibold">
                      {selectedTrader.account_type || 'Standard'} Account
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-white/[0.04] text-slate-300 border border-white/10 font-semibold">
                      Leverage: {selectedTrader.leverage || '1:500'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Main Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="p-3 bg-white/[0.02] rounded-2xl border border-white/[0.06]">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Total Gains ROI</p>
                  <p className="text-lg font-extrabold text-emerald-400 mt-0.5">+{selectedTrader.roi_percent}%</p>
                </div>

                <div className="p-3 bg-white/[0.02] rounded-2xl border border-white/[0.06]">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Win Rate</p>
                  <p className="text-lg font-extrabold text-white mt-0.5">{selectedTrader.win_rate}%</p>
                </div>

                <div className="p-3 bg-white/[0.02] rounded-2xl border border-white/[0.06]">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Active Days</p>
                  <p className="text-lg font-extrabold text-white mt-0.5">{selectedTrader.total_active_days || 120} Days</p>
                </div>

                <div className="p-3 bg-white/[0.02] rounded-2xl border border-white/[0.06]">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Max Drawdown</p>
                  <p className="text-lg font-extrabold text-amber-400 mt-0.5">-{selectedTrader.max_drawdown || 4.5}%</p>
                </div>
              </div>

              {/* Visual Performance Chart */}
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] mb-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                    <TrendingUp size={14} className="text-emerald-400" /> Cumulative PnL Growth Curve
                  </h3>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">Verified MT5 Sync</span>
                </div>

                {/* SVG PnL Growth Curve Chart */}
                <div className="h-40 w-full relative pt-2">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 500 120" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 0 100 Q 60 85, 120 70 T 240 50 T 360 30 T 500 10 L 500 120 L 0 120 Z"
                      fill="url(#pnlGrad)"
                    />
                    <path
                      d="M 0 100 Q 60 85, 120 70 T 240 50 T 360 30 T 500 10"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <circle cx="500" cy="10" r="5" fill="#10b981" />
                  </svg>
                </div>
              </div>

              {/* Strategy & Account Specs */}
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Strategy Overview</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{selectedTrader.bio || 'Scalping & Swing Trading majors on MT5 platform.'}</p>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Subscription Specs</h4>
                  <div className="space-y-1 text-xs text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Duration:</span>
                      <span className="font-bold text-white">30 Days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Daily Return:</span>
                      <span className="font-bold text-emerald-400">5.0% Daily</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Base Currency:</span>
                      <span className="font-bold text-white">{selectedTrader.currency || 'USD'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-2 border-t border-white/[0.08]">
                <button
                  onClick={() => setSelectedTrader(null)}
                  className="flex-1 py-3.5 rounded-2xl glass border border-white/10 text-white font-bold hover:bg-white/5 transition-all text-xs sm:text-sm"
                >
                  Close
                </button>
                <button
                  onClick={() => setIsSubscribeModalOpen(true)}
                  className="flex-1 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all glow-blue flex items-center justify-center gap-2 text-xs sm:text-sm"
                >
                  <Copy size={16} /> Copy Strategy (${selectedTrader.subscription_rate}/30d)
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================
          SUBSCRIPTION CONFIRMATION MODAL
         ======================================================== */}
      <AnimatePresence>
        {selectedTrader && isSubscribeModalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="glass-strong rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-white/10 shadow-2xl relative"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
            >
              <button
                onClick={() => setIsSubscribeModalOpen(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              <h2 className="text-xl font-bold text-white mb-2">Subscribe to Copy {selectedTrader.name}</h2>
              <p className="text-xs text-slate-400 mb-6">
                You are subscribing to copy this strategy on MT5 / Standard account for a 30-day duration.
              </p>

              <div className="space-y-3 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] mb-6 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Subscription Fee (30 Days)</span>
                  <span className="font-extrabold text-white">${selectedTrader.subscription_rate.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Guaranteed Daily Return</span>
                  <span className="font-extrabold text-emerald-400">5.0% Daily</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Daily Payout Amount</span>
                  <span className="font-extrabold text-emerald-400">+${(selectedTrader.subscription_rate * 0.05).toFixed(2)}/day</span>
                </div>
                <div className="flex justify-between border-t border-white/[0.06] pt-2">
                  <span className="text-slate-400">Your Wallet Balance</span>
                  <span className={`font-extrabold ${Number(profile?.balance || 0) >= selectedTrader.subscription_rate ? 'text-emerald-400' : 'text-rose-400'}`}>
                    ${Number(profile?.balance || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {profile && Number(profile.balance || 0) < selectedTrader.subscription_rate && (
                <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20 flex items-center gap-2 text-rose-400 text-xs font-semibold mb-4">
                  <AlertCircle size={16} />
                  <span>Insufficient balance. Please deposit funds to subscribe.</span>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => setIsSubscribeModalOpen(false)}
                  className="flex-1 py-3 rounded-2xl glass border border-white/10 text-white font-bold hover:bg-white/5 transition-all text-xs sm:text-sm"
                >
                  Cancel
                </button>

                <button
                  onClick={() => subscribeMutation.mutate(selectedTrader)}
                  disabled={subscribeMutation.isPending || !profile || Number(profile.balance || 0) < selectedTrader.subscription_rate}
                  className="flex-1 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold transition-all glow-blue flex items-center justify-center gap-2 text-xs sm:text-sm"
                >
                  {subscribeMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  {subscribeMutation.isPending ? 'Confirming...' : 'Confirm Subscription'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
