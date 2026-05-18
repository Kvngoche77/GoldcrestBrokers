'use client';

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowUpRight, ArrowDownLeft, TrendingUp, Wallet, Users, Clock, ArrowRight, Plus, Newspaper, Headphones, LineChart, Copy } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { PortfolioChart } from '@/components/sections/PortfolioChart';
import type { Transaction, Investment, InvestmentPlan } from '@/types';
import toast from 'react-hot-toast';

function StatCard({
  title, value, change, icon: Icon, color, href,
}: {
  title: string;
  value: string;
  change?: string;
  icon: React.ElementType;
  color: string;
  href?: string;
}) {
  const content = (
    <div className={`glass rounded-2xl p-5 border border-white/[0.05] card-hover ${href ? 'cursor-pointer' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={18} />
        </div>
      </div>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      {change && <p className="text-xs text-slate-400">{change}</p>}
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const { user, profile, refreshProfile } = useAuth();

  // Auto-credit daily profits on load
  useEffect(() => {
    const profileId = profile?.id;
    if (!profileId) return;

    let isMounted = true;

    async function autoCreditProfits() {
      try {
        const { data, error } = await supabase.rpc('process_user_profits', {
          target_user_id: profileId,
        });

        if (error) {
          console.error('Error auto-crediting profits:', error);
          return;
        }

        const result = data as { success: boolean; credited_count: number; total_credited_amount: number };
        
        if (isMounted && result && result.success && result.credited_count > 0) {
          toast.success(
            `Daily profit credited! +$${Number(result.total_credited_amount).toFixed(2)} added to your balance.`,
            { duration: 5000 }
          );
          // Refresh user profile details
          await refreshProfile();
          // Invalidate React Query cache for investments and transactions to refresh UI lists
          queryClient.invalidateQueries({ queryKey: ['investments', profileId] });
          queryClient.invalidateQueries({ queryKey: ['transactions', profileId] });
        }
      } catch (err) {
        console.error('Failed to run auto-credit:', err);
      }
    }

    autoCreditProfits();

    return () => {
      isMounted = false;
    };
  }, [profile?.id, queryClient]);

  const { data: investments = [] } = useQuery({
    queryKey: ['investments', profile?.id],
    queryFn: async (): Promise<(Investment & { plan: InvestmentPlan })[]> => {
      if (!profile?.id) return [];
      const { data } = await supabase
        .from('investments')
        .select('*, plan:investment_plans(*)')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(5);
      return (data as (Investment & { plan: InvestmentPlan })[]) ?? [];
    },
    enabled: !!profile?.id,
    refetchInterval: 30000,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions', profile?.id],
    queryFn: async (): Promise<Transaction[]> => {
      if (!profile?.id) return [];
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(8);
      return (data as Transaction[]) ?? [];
    },
    enabled: !!profile?.id,
  });

  const activeInvestments = investments.filter((i) => i.status === 'active');
  const totalInvested = investments.filter((i) => i.status !== 'cancelled').reduce((s, i) => s + i.amount, 0);

  const stats = [
    {
      title: 'Total Balance',
      value: `$${Number(profile?.balance ?? 0).toFixed(2)}`,
      icon: Wallet,
      color: 'bg-blue-500/10 text-blue-400',
      href: '/dashboard/deposit',
    },
    {
      title: 'Total Deposited',
      value: `$${Number(profile?.total_deposited ?? 0).toFixed(2)}`,
      icon: ArrowDownLeft,
      color: 'bg-emerald-500/10 text-emerald-400',
    },
    {
      title: 'Total Profit',
      value: `$${Number(profile?.total_profit ?? 0).toFixed(2)}`,
      icon: TrendingUp,
      color: 'bg-amber-500/10 text-amber-400',
    },
    {
      title: 'Referral Earnings',
      value: `$${Number(profile?.referral_earnings ?? 0).toFixed(2)}`,
      icon: Users,
      color: 'bg-rose-500/10 text-rose-400',
      href: '/dashboard/referrals',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Welcome back, {profile?.username || user?.user_metadata?.username || user?.email?.split('@')[0] || 'Investor'}!
        </h1>
        <p className="text-slate-400 text-sm mt-1">Here&apos;s what&apos;s happening with your portfolio today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <StatCard {...stat} />
          </motion.div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { href: '/dashboard/deposit', label: 'Deposit', icon: ArrowDownLeft, color: 'text-emerald-400', bg: 'bg-emerald-500/10 hover:bg-emerald-500/20' },
          { href: '/dashboard/trade', label: 'Spot', icon: LineChart, color: 'text-blue-400', bg: 'bg-blue-500/10 hover:bg-blue-500/20' },
          { href: '/dashboard/trade/copy', label: 'Copy Trade', icon: Copy, color: 'text-indigo-400', bg: 'bg-indigo-500/10 hover:bg-indigo-500/20' },
          { href: '/dashboard/withdraw', label: 'Withdraw', icon: ArrowUpRight, color: 'text-amber-400', bg: 'bg-amber-500/10 hover:bg-amber-500/20' },
          { href: '/dashboard/referrals', label: 'Referrals', icon: Users, color: 'text-rose-400', bg: 'bg-rose-500/10 hover:bg-rose-500/20' },
        ].map(({ href, label, icon: Icon, color, bg }) => (
          <Link key={href} href={href} className={`flex flex-col items-center gap-2 p-4 rounded-2xl glass border border-white/[0.05] transition-all ${bg}`}>
            <Icon size={22} className={color} />
            <span className="text-xs font-medium text-slate-300">{label}</span>
          </Link>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <PortfolioChart transactions={transactions} />
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Active Investments */}
        <motion.div
          className="glass rounded-2xl overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
            <h2 className="font-semibold text-white">Active Investments</h2>
            <Link href="/dashboard/invest" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
              New <Plus size={12} />
            </Link>
          </div>
          <div className="p-4">
            {activeInvestments.length === 0 ? (
              <div className="text-center py-10">
                <TrendingUp size={32} className="text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No active investments</p>
                <Link href="/dashboard/invest" className="mt-3 inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
                  Start investing <ArrowRight size={12} />
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {activeInvestments.map((inv) => {
                  const progress = inv.started_at && inv.expires_at
                    ? ((Date.now() - new Date(inv.started_at).getTime()) / (new Date(inv.expires_at).getTime() - new Date(inv.started_at).getTime())) * 100
                    : 0;
                  return (
                    <div key={inv.id} className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-semibold text-white">{inv.plan?.name ?? 'Plan'}</p>
                          <p className="text-xs text-slate-400">${inv.amount.toFixed(2)} invested</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-emerald-400">+{inv.daily_roi_percent}%/day</p>
                          <p className="text-xs text-slate-400">Earned: ${inv.total_profit_earned.toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="w-full bg-white/[0.05] rounded-full h-1.5">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-emerald-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${Math.min(progress, 100).toFixed(1)}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-slate-500">{Math.min(progress, 100).toFixed(1)}% complete</span>
                        {inv.expires_at && (
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Clock size={10} />
                            {new Date(inv.expires_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* Market News Widget */}
        <motion.div
          className="glass rounded-2xl overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <Newspaper size={18} className="text-blue-400" />
              Market Insights
            </h2>
            <Link href="/dashboard/news" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
              Read all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="p-4 space-y-4">
            {[
              { title: 'Bitcoin Breaks $75k Resistance', source: 'CoinDesk', time: '18m ago', sentiment: 'Bullish' },
              { title: 'Ethereum ETF Inflows Hit Record', source: 'The Block', time: '45m ago', sentiment: 'Bullish' },
              { title: 'Fed Signals Rate Stability', source: 'Reuters', time: '1h ago', sentiment: 'Neutral' },
            ].map((news, i) => (
              <div key={i} className="flex flex-col gap-1.5 py-2 border-b border-white/[0.04] last:border-0">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">{news.source}</span>
                  <span className="text-[10px] text-slate-500">{news.time}</span>
                </div>
                <p className="text-sm font-medium text-white line-clamp-1">{news.title}</p>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full w-fit ${
                  news.sentiment === 'Bullish' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                }`}>
                  {news.sentiment}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <motion.div
          className="glass rounded-2xl overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
            <h2 className="font-semibold text-white">Recent Transactions</h2>
            <Link href="/dashboard/transactions" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="p-4">
            {transactions.length === 0 ? (
              <div className="text-center py-10">
                <Wallet size={32} className="text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No transactions yet</p>
                <Link href="/dashboard/deposit" className="mt-3 inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
                  Make a deposit <ArrowRight size={12} />
                </Link>
              </div>
            ) : (
              <div className="space-y-1">
                {transactions.map((tx) => {
                  const isCredit = ['deposit', 'profit', 'referral_bonus'].includes(tx.type);
                  const typeLabels: Record<string, string> = {
                    deposit: 'Deposit',
                    withdrawal: 'Withdrawal',
                    profit: 'Daily Profit',
                    referral_bonus: 'Referral Bonus',
                    investment: 'Investment',
                  };
                  const statusColors: Record<string, string> = {
                    completed: 'badge-success',
                    pending: 'badge-pending',
                    failed: 'badge-danger',
                    cancelled: 'badge-grey',
                  };
                  return (
                    <div key={tx.id} className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${isCredit ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                          {isCredit ? (
                            <ArrowDownLeft size={14} className="text-emerald-400" />
                          ) : (
                            <ArrowUpRight size={14} className="text-red-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{typeLabels[tx.type] ?? tx.type}</p>
                          <p className="text-xs text-slate-500">{new Date(tx.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-semibold ${isCredit ? 'text-emerald-400' : 'text-red-400'}`}>
                          {isCredit ? '+' : '-'}${tx.amount.toFixed(2)}
                        </p>
                        <span className={statusColors[tx.status] ?? 'badge-grey'}>{tx.status}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* Support & Security Widget */}
        <motion.div
          className="glass rounded-2xl overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
            <h2 className="font-semibold text-white">Support & Security</h2>
            <Link href="/dashboard/support" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
              Help Center <ArrowRight size={12} />
            </Link>
          </div>
          <div className="p-5 space-y-5">
            <div className="flex items-start gap-4 p-4 bg-blue-600/10 rounded-2xl border border-blue-500/20">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
                <Headphones size={20} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Need Assistance?</p>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">Our support team is available 24/7 to help you with your investments.</p>
                <Link href="/dashboard/support" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                  Open Support Ticket <ArrowRight size={12} />
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/dashboard/settings" className="p-3 bg-white/[0.03] rounded-xl border border-white/[0.05] hover:bg-white/[0.06] transition-all text-center">
                <p className="text-xs font-semibold text-white mb-1">Security Settings</p>
                <p className="text-[10px] text-slate-500">Enable 2FA</p>
              </Link>
              <Link href="/dashboard/kyc" className="p-3 bg-white/[0.03] rounded-xl border border-white/[0.05] hover:bg-white/[0.06] transition-all text-center">
                <p className="text-xs font-semibold text-white mb-1">KYC Status</p>
                <p className={`text-[10px] ${profile?.kyc_status === 'verified' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {profile?.kyc_status?.toUpperCase() ?? 'PENDING'}
                </p>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
