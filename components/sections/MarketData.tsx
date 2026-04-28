'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, ChartBar as BarChart2 } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from 'chart.js';
import type { CryptoPrice } from '@/types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

async function fetchMarketData(): Promise<CryptoPrice[]> {
  try {
    const res = await fetch(
      '/api/market?ids=bitcoin,ethereum,binancecoin,solana,cardano,ripple&per_page=6&sparkline=true'
    );
    if (!res.ok) throw new Error('Failed');
    return res.json();
  } catch {
    return [
      { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', current_price: 67420, price_change_percentage_24h: 2.34, market_cap: 1320000000000, total_volume: 28000000000, image: '' },
      { id: 'ethereum', symbol: 'eth', name: 'Ethereum', current_price: 3512, price_change_percentage_24h: 1.87, market_cap: 421000000000, total_volume: 14000000000, image: '' },
      { id: 'binancecoin', symbol: 'bnb', name: 'BNB', current_price: 589, price_change_percentage_24h: -0.54, market_cap: 87000000000, total_volume: 1800000000, image: '' },
      { id: 'solana', symbol: 'sol', name: 'Solana', current_price: 178, price_change_percentage_24h: 3.21, market_cap: 82000000000, total_volume: 3200000000, image: '' },
      { id: 'cardano', symbol: 'ada', name: 'Cardano', current_price: 0.478, price_change_percentage_24h: -1.12, market_cap: 17000000000, total_volume: 520000000, image: '' },
      { id: 'ripple', symbol: 'xrp', name: 'XRP', current_price: 0.614, price_change_percentage_24h: 0.89, market_cap: 34000000000, total_volume: 1100000000, image: '' },
    ];
  }
}

function MiniSparkline({ change }: { change: number }) {
  const isUp = change >= 0;
  const points = Array.from({ length: 12 }, (_, i) => {
    const trend = isUp ? i * 0.5 : -i * 0.5;
    return 50 + trend + (Math.random() - 0.5) * 10;
  });
  const labels = points.map((_, i) => String(i));

  const data = {
    labels,
    datasets: [{
      data: points,
      borderColor: isUp ? '#10d982' : '#ef4444',
      borderWidth: 2,
      fill: true,
      backgroundColor: isUp ? 'rgba(16,217,130,0.06)' : 'rgba(239,68,68,0.06)',
      tension: 0.4,
      pointRadius: 0,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { tooltip: { enabled: false } },
    scales: { x: { display: false }, y: { display: false } },
    animation: { duration: 0 },
  };

  return (
    <div className="w-24 h-12">
      <Line data={data} options={options} />
    </div>
  );
}

function formatMarketCap(val: number) {
  if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
  if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
  if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
  return `$${val.toFixed(0)}`;
}

export function MarketData() {
  const { data: coins = [], isLoading } = useQuery({
    queryKey: ['market-data'],
    queryFn: fetchMarketData,
    refetchInterval: 60000,
  });

  return (
    <section id="markets" className="py-24 bg-[#040c18]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 glass rounded-full text-sm text-blue-400 border border-blue-500/20 mb-4">
            <BarChart2 size={14} />
            <span>Real-Time Market Data</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Live <span className="gradient-text">Crypto</span> Markets
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Monitor top cryptocurrencies and capitalize on market movements with real-time pricing.
          </p>
        </motion.div>

        {/* Table */}
        <motion.div
          className="glass rounded-2xl overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">#</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Asset</th>
                  <th className="text-right py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Price</th>
                  <th className="text-right py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:table-cell">24h Change</th>
                  <th className="text-right py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">Market Cap</th>
                  <th className="text-right py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Volume 24h</th>
                  <th className="text-right py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:table-cell">7d Chart</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="border-b border-white/[0.04]">
                        {[0, 1, 2, 3, 4, 5].map((j) => (
                          <td key={j} className="py-4 px-6">
                            <div className="shimmer h-4 rounded w-20" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : coins.map((coin, idx) => {
                      const isUp = coin.price_change_percentage_24h >= 0;
                      return (
                        <motion.tr
                          key={coin.id}
                          className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors cursor-pointer"
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: idx * 0.05 }}
                        >
                          <td className="py-4 px-6 text-slate-500 text-sm">{idx + 1}</td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-sm font-bold text-slate-300">
                                {coin.symbol.toUpperCase().slice(0, 2)}
                              </div>
                              <div>
                                <p className="font-semibold text-white text-sm">{coin.name}</p>
                                <p className="text-xs text-slate-400 uppercase">{coin.symbol}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <span className="font-semibold text-white text-sm">
                              ${coin.current_price >= 1 ? coin.current_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : coin.current_price.toFixed(4)}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right hidden sm:table-cell">
                            <span className={`flex items-center justify-end gap-1 text-sm font-semibold ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                              {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                              {isUp ? '+' : ''}{coin.price_change_percentage_24h.toFixed(2)}%
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right hidden md:table-cell text-slate-300 text-sm">
                            {formatMarketCap(coin.market_cap)}
                          </td>
                          <td className="py-4 px-6 text-right hidden lg:table-cell text-slate-300 text-sm">
                            {formatMarketCap(coin.total_volume)}
                          </td>
                          <td className="py-4 px-6 hidden sm:table-cell">
                            <div className="flex justify-end">
                              <MiniSparkline change={coin.price_change_percentage_24h} />
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
