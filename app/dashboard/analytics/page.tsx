'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Target, Calendar, ArrowUpRight, DollarSign, Clock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Investment, InvestmentPlan, Transaction } from '@/types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#06b6d4'];

function StatCard({ title, value, sub, icon: Icon, color }: {
  title: string; value: string; sub?: string; icon: React.ElementType; color: string;
}) {
  return (
    <div className="glass rounded-2xl p-5 border border-white/[0.05]">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={17} />
        </div>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong border border-white/10 rounded-xl px-3 py-2 text-xs">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-semibold">{p.name}: ${Number(p.value).toFixed(2)}</p>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const { profile } = useAuth();

  const { data: investments = [] } = useQuery({
    queryKey: ['analytics-investments', profile?.id],
    queryFn: async (): Promise<(Investment & { plan: InvestmentPlan })[]> => {
      if (!profile?.id) return [];
      const { data } = await supabase
        .from('investments')
        .select('*, plan:investment_plans(*)')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });
      return (data as (Investment & { plan: InvestmentPlan })[]) ?? [];
    },
    enabled: !!profile?.id,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['analytics-transactions', profile?.id],
    queryFn: async (): Promise<Transaction[]> => {
      if (!profile?.id) return [];
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: true });
      return (data as Transaction[]) ?? [];
    },
    enabled: !!profile?.id,
  });

  // --- Compute analytics ---
  const activeInvestments = investments.filter(i => i.status === 'active');
  const completedInvestments = investments.filter(i => i.status === 'completed');
  const totalInvested = investments.filter(i => i.status !== 'cancelled').reduce((s, i) => s + Number(i.amount), 0);
  const totalProfitEarned = investments.reduce((s, i) => s + Number(i.total_profit_earned), 0);
  const dailyROI = activeInvestments.reduce((s, i) => s + (Number(i.amount) * Number(i.daily_roi_percent)) / 100, 0);

  // Monthly profit data from transactions
  const profitByMonth: Record<string, number> = {};
  const depositByMonth: Record<string, number> = {};
  transactions.forEach(tx => {
    const month = new Date(tx.created_at).toLocaleString('default', { month: 'short', year: '2-digit' });
    if (tx.type === 'profit' && tx.status === 'completed') {
      profitByMonth[month] = (profitByMonth[month] ?? 0) + Number(tx.amount);
    }
    if (tx.type === 'deposit' && tx.status === 'completed') {
      depositByMonth[month] = (depositByMonth[month] ?? 0) + Number(tx.amount);
    }
  });

  // Monthly chart data
  const monthlyData = Object.keys({ ...profitByMonth, ...depositByMonth })
    .slice(-6)
    .map(month => ({
      month,
      profit: profitByMonth[month] ?? 0,
      deposits: depositByMonth[month] ?? 0,
    }));

  // Portfolio composition (pie chart)
  const planComposition = activeInvestments.reduce((acc, inv) => {
    const name = inv.plan?.name ?? 'Unknown';
    acc[name] = (acc[name] ?? 0) + Number(inv.amount);
    return acc;
  }, {} as Record<string, number>);
  const pieData = Object.entries(planComposition).map(([name, value]) => ({ name, value }));

  // Cumulative profit over time
  let cumulative = 0;
  const cumulativeData = transactions
    .filter(tx => tx.type === 'profit' && tx.status === 'completed')
    .slice(-30)
    .map(tx => {
      cumulative += Number(tx.amount);
      return {
        date: new Date(tx.created_at).toLocaleDateString('default', { month: 'short', day: 'numeric' }),
        profit: cumulative,
      };
    });

  // Projections (30/60/90 days based on active investments)
  const projections = [30, 60, 90].map(days => ({
    days,
    projected: activeInvestments.reduce((s, inv) => {
      const daysLeft = inv.expires_at
        ? Math.max(0, Math.ceil((new Date(inv.expires_at).getTime() - Date.now()) / 86400000))
        : inv.duration_days ?? 0;
      const effectiveDays = Math.min(days, daysLeft);
      return s + (Number(inv.amount) * Number(inv.daily_roi_percent) / 100) * effectiveDays;
    }, 0),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BarChart3 size={24} className="text-blue-400" />
          Portfolio Analytics
        </h1>
        <p className="text-slate-400 text-sm mt-1">Deep insights into your investment performance</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <StatCard title="Total Balance" value={`$${Number(profile?.balance ?? 0).toFixed(2)}`} icon={DollarSign} color="bg-blue-500/10 text-blue-400" sub="Available funds" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <StatCard title="Total Invested" value={`$${totalInvested.toFixed(2)}`} icon={TrendingUp} color="bg-emerald-500/10 text-emerald-400" sub={`${investments.length} investment(s)`} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
          <StatCard title="Total Profit" value={`$${totalProfitEarned.toFixed(2)}`} icon={ArrowUpRight} color="bg-amber-500/10 text-amber-400" sub={`${completedInvestments.length} completed`} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
          <StatCard title="Daily ROI" value={`$${dailyROI.toFixed(2)}`} icon={Clock} color="bg-rose-500/10 text-rose-400" sub={`${activeInvestments.length} active plan(s)`} />
        </motion.div>
      </div>

      {/* Projected Earnings */}
      <motion.div className="glass rounded-2xl p-5 border border-white/[0.05]" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="flex items-center gap-2 mb-4">
          <Target size={18} className="text-blue-400" />
          <h2 className="font-semibold text-white">Projected Earnings (Based on Active Plans)</h2>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {projections.map(({ days, projected }) => (
            <div key={days} className="text-center bg-white/[0.03] rounded-xl p-4 border border-white/[0.04]">
              <p className="text-xs text-slate-500 mb-1">Next {days} Days</p>
              <p className="text-2xl font-bold text-emerald-400">${projected.toFixed(2)}</p>
              <p className="text-[10px] text-slate-600 mt-1">Estimated ROI</p>
            </div>
          ))}
        </div>
        {activeInvestments.length === 0 && (
          <p className="text-center text-slate-600 text-sm mt-2">No active investments. Start investing to see projections.</p>
        )}
      </motion.div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Cumulative Profit */}
        <motion.div className="glass rounded-2xl p-5 border border-white/[0.05]" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h3 className="font-semibold text-white mb-4">Cumulative Profit Over Time</h3>
          {cumulativeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={cumulativeData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="profit" name="Cumulative Profit" stroke="#10b981" strokeWidth={2} fill="url(#profitGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-slate-600 text-sm">No profit data yet</div>
          )}
        </motion.div>

        {/* Monthly comparison */}
        <motion.div className="glass rounded-2xl p-5 border border-white/[0.05]" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <h3 className="font-semibold text-white mb-4">Monthly Deposits vs Profits</h3>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="deposits" name="Deposits" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" name="Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-slate-600 text-sm">No data yet</div>
          )}
        </motion.div>
      </div>

      {/* Portfolio Composition + Active Plans */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pie chart */}
        <motion.div className="glass rounded-2xl p-5 border border-white/[0.05]" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <h3 className="font-semibold text-white mb-4">Portfolio Composition</h3>
          {pieData.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => `$${v.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {pieData.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-300 truncate">{item.name}</p>
                      <p className="text-xs text-slate-500">${item.value.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-slate-600 text-sm">No active investments</div>
          )}
        </motion.div>

        {/* Active Plans Performance */}
        <motion.div className="glass rounded-2xl p-5 border border-white/[0.05]" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <h3 className="font-semibold text-white mb-4">Active Plan Performance</h3>
          {activeInvestments.length > 0 ? (
            <div className="space-y-3">
              {activeInvestments.map(inv => {
                const progress = inv.started_at && inv.expires_at
                  ? Math.min(100, ((Date.now() - new Date(inv.started_at).getTime()) / (new Date(inv.expires_at).getTime() - new Date(inv.started_at).getTime())) * 100)
                  : 0;
                const totalExpected = Number(inv.total_profit_expected);
                const earned = Number(inv.total_profit_earned);
                const earnedPct = totalExpected > 0 ? (earned / totalExpected) * 100 : 0;
                return (
                  <div key={inv.id} className="bg-white/[0.02] rounded-xl p-3 border border-white/[0.04]">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-sm font-medium text-white">{inv.plan?.name ?? 'Plan'}</p>
                      <p className="text-xs font-bold text-emerald-400">+{inv.daily_roi_percent}%/day</p>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                      <span>Invested: ${Number(inv.amount).toFixed(2)}</span>
                      <span>Earned: ${earned.toFixed(2)} / ${totalExpected.toFixed(2)}</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${earnedPct}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-600 mt-1">{earnedPct.toFixed(1)}% of expected profit earned · {progress.toFixed(0)}% time elapsed</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-slate-600 text-sm">No active investments</div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
