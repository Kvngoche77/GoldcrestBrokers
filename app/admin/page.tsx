'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Users, DollarSign, TrendingUp, Clock, ArrowRight, ArrowDownToLine, ArrowUpFromLine, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type AdminStats = {
  totalUsers: number;
  totalDeposited: number;
  totalWithdrawn: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  activeInvestments: number;
  totalProfit: number;
};

async function fetchAdminStats(): Promise<AdminStats> {
  const [usersRes, depositRes, withdrawRes, invRes] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact' }),
    supabase.from('transactions').select('amount, status').eq('type', 'deposit'),
    supabase.from('withdrawal_requests').select('amount, status'),
    supabase.from('investments').select('amount, status').eq('status', 'active'),
  ]);

  const deposits = (depositRes.data ?? []) as { amount: number; status: string }[];
  const withdrawals = (withdrawRes.data ?? []) as { amount: number; status: string }[];
  const investments = (invRes.data ?? []) as { amount: number; status: string }[];

  return {
    totalUsers: usersRes.count ?? 0,
    totalDeposited: deposits.filter((d) => d.status === 'completed').reduce((s, d) => s + d.amount, 0),
    totalWithdrawn: withdrawals.filter((w) => w.status === 'completed').reduce((s, w) => s + w.amount, 0),
    pendingDeposits: deposits.filter((d) => d.status === 'pending').length,
    pendingWithdrawals: withdrawals.filter((w) => w.status === 'pending').length,
    activeInvestments: investments.length,
    totalProfit: investments.reduce((s, i) => s + i.amount, 0),
  };
}

export default function AdminPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: fetchAdminStats,
    refetchInterval: 30000,
  });

  const statCards = [
    { title: 'Total Users', value: stats?.totalUsers ?? 0, format: (v: number) => v.toLocaleString(), icon: Users, color: 'bg-blue-500/10 text-blue-400' },
    { title: 'Total Deposited', value: stats?.totalDeposited ?? 0, format: (v: number) => `$${v.toFixed(2)}`, icon: ArrowDownToLine, color: 'bg-emerald-500/10 text-emerald-400' },
    { title: 'Total Withdrawn', value: stats?.totalWithdrawn ?? 0, format: (v: number) => `$${v.toFixed(2)}`, icon: ArrowUpFromLine, color: 'bg-amber-500/10 text-amber-400' },
    { title: 'Active Investments', value: stats?.activeInvestments ?? 0, format: (v: number) => v.toLocaleString(), icon: TrendingUp, color: 'bg-rose-500/10 text-rose-400' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Overview</h1>
        <p className="text-slate-400 text-sm mt-1">Platform-wide statistics and pending actions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.title}
            className="glass rounded-2xl p-5 border border-white/[0.05]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">{card.title}</p>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.color}`}>
                <card.icon size={17} />
              </div>
            </div>
            {isLoading ? (
              <div className="shimmer h-8 w-20 rounded" />
            ) : (
              <p className="text-2xl font-bold text-white">{card.format(card.value)}</p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Pending actions */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Link href="/admin/deposits" className="glass rounded-2xl p-5 border border-white/[0.05] card-hover group flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
              <ArrowDownToLine size={22} className="text-amber-400" />
            </div>
            <div>
              <p className="font-semibold text-white">Pending Deposits</p>
              <p className="text-sm text-slate-400">{isLoading ? '...' : `${stats?.pendingDeposits ?? 0} awaiting review`}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(stats?.pendingDeposits ?? 0) > 0 && (
              <span className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-xs font-bold text-white">
                {stats?.pendingDeposits}
              </span>
            )}
            <ArrowRight size={16} className="text-slate-500 group-hover:text-white transition-colors" />
          </div>
        </Link>

        <Link href="/admin/withdrawals" className="glass rounded-2xl p-5 border border-white/[0.05] card-hover group flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
              <ArrowUpFromLine size={22} className="text-blue-400" />
            </div>
            <div>
              <p className="font-semibold text-white">Pending Withdrawals</p>
              <p className="text-sm text-slate-400">{isLoading ? '...' : `${stats?.pendingWithdrawals ?? 0} awaiting approval`}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(stats?.pendingWithdrawals ?? 0) > 0 && (
              <span className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white">
                {stats?.pendingWithdrawals}
              </span>
            )}
            <ArrowRight size={16} className="text-slate-500 group-hover:text-white transition-colors" />
          </div>
        </Link>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {[
          { href: '/admin/users', label: 'Manage Users', icon: Users },
          { href: '/admin/deposits', label: 'Review Deposits', icon: ArrowDownToLine },
          { href: '/admin/withdrawals', label: 'Process Withdrawals', icon: ArrowUpFromLine },
          { href: '/admin/investments', label: 'View Investments', icon: TrendingUp },
          { href: '/admin/emails', label: 'Send Emails', icon: Mail },
        ].map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-2 p-4 glass rounded-2xl border border-white/[0.05] hover:border-white/20 transition-all text-center group"
          >
            <Icon size={20} className="text-slate-400 group-hover:text-white transition-colors" />
            <span className="text-xs text-slate-400 group-hover:text-white transition-colors">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
