'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowUpRight, ArrowDownLeft, TrendingUp, Wallet, Users, Clock, ArrowRight, Plus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { PortfolioChart } from '@/components/sections/PortfolioChart';
import type { Transaction, Investment, InvestmentPlan } from '@/types';

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
  const { profile, refreshProfile } = useAuth();

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
        <h1 className="text-2xl font-bold text-white">Welcome back, {profile?.username ?? 'Investor'}!</h1>
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: '/dashboard/deposit', label: 'Deposit', icon: ArrowDownLeft, color: 'text-emerald-400', bg: 'bg-emerald-500/10 hover:bg-emerald-500/20' },
          { href: '/dashboard/invest', label: 'Invest', icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/10 hover:bg-blue-500/20' },
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

        {/* Recent Transactions */}
        <motion.div
          className="glass rounded-2xl overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
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
      </div>
    </div>
  );
}
