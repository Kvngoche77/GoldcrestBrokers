'use client';

import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { format, subDays, isSameDay } from 'date-fns';
import type { Transaction } from '@/types';

export function PortfolioChart({ transactions }: { transactions: Transaction[] }) {
  const data = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), 29 - i);
      return { date, profit: 0 };
    });

    let cumulativeProfit = 0;
    
    // Sort transactions oldest first
    const sortedTx = [...transactions].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    last30Days.forEach(day => {
      const dayTxs = sortedTx.filter(tx => 
        tx.status === 'completed' && 
        (tx.type === 'profit' || tx.type === 'referral_bonus') &&
        isSameDay(new Date(tx.created_at), day.date)
      );
      
      const dayProfit = dayTxs.reduce((sum, tx) => sum + tx.amount, 0);
      cumulativeProfit += dayProfit;
      
      day.profit = cumulativeProfit;
    });

    return last30Days.map(day => ({
      date: format(day.date, 'MMM dd'),
      Profit: day.profit
    }));
  }, [transactions]);

  return (
    <div className="glass rounded-2xl p-5 border border-white/[0.05] h-[320px]">
      <div className="mb-6">
        <h3 className="font-semibold text-white">Profit Growth (30 Days)</h3>
        <p className="text-xs text-slate-400">Cumulative earnings from investments and referrals</p>
      </div>
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="#64748b" 
              fontSize={10} 
              tickLine={false}
              axisLine={false}
              minTickGap={20}
            />
            <YAxis 
              stroke="#64748b" 
              fontSize={10} 
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#060d1a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
              itemStyle={{ color: '#10d982', fontWeight: 600 }}
              labelStyle={{ color: '#94a3b8', marginBottom: '4px', fontSize: '12px' }}
            />
            <Line 
              type="monotone" 
              dataKey="Profit" 
              stroke="#10d982" 
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 5, fill: '#10d982', stroke: '#060d1a', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
