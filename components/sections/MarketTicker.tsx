'use client';

import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown } from 'lucide-react';

type TickerItem = {
  symbol: string;
  name: string;
  price: number;
  change: number;
};

async function fetchTickerData(): Promise<TickerItem[]> {
  try {
    const res = await fetch(
      '/api/market?ids=bitcoin,ethereum,binancecoin,solana,cardano,ripple,dogecoin,polkadot&per_page=8'
    );
    if (!res.ok) throw new Error('Failed');
    const data = await res.json();
    return data.map((c: { symbol: string; name: string; current_price: number; price_change_percentage_24h: number }) => ({
      symbol: c.symbol.toUpperCase(),
      name: c.name,
      price: c.current_price,
      change: c.price_change_percentage_24h,
    }));
  } catch {
    return [
      { symbol: 'BTC', name: 'Bitcoin', price: 67420.15, change: 2.34 },
      { symbol: 'ETH', name: 'Ethereum', price: 3512.88, change: 1.87 },
      { symbol: 'BNB', name: 'BNB', price: 589.42, change: -0.54 },
      { symbol: 'SOL', name: 'Solana', price: 178.32, change: 3.21 },
      { symbol: 'ADA', name: 'Cardano', price: 0.478, change: -1.12 },
      { symbol: 'XRP', name: 'XRP', price: 0.614, change: 0.89 },
      { symbol: 'DOGE', name: 'Dogecoin', price: 0.143, change: 5.67 },
      { symbol: 'DOT', name: 'Polkadot', price: 8.92, change: -2.11 },
    ];
  }
}

function TickerItem({ item }: { item: TickerItem }) {
  const isUp = item.change >= 0;
  return (
    <div className="flex items-center gap-3 px-5 py-2 flex-shrink-0">
      <span className="font-bold text-sm text-white">{item.symbol}</span>
      <span className="text-sm text-slate-300">${item.price >= 1000 ? item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : item.price.toFixed(4)}</span>
      <span className={`flex items-center gap-0.5 text-xs font-semibold ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
        {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {isUp ? '+' : ''}{item.change.toFixed(2)}%
      </span>
      <div className="w-px h-4 bg-white/10" />
    </div>
  );
}

export function MarketTicker() {
  const { data: items = [] } = useQuery({
    queryKey: ['ticker'],
    queryFn: fetchTickerData,
    refetchInterval: 30000,
  });

  const doubled = [...items, ...items];

  return (
    <div className="bg-[#060d1a] border-y border-white/[0.05] py-1 overflow-hidden">
      <div className="flex items-center">
        <div className="flex-shrink-0 flex items-center gap-2 px-4 border-r border-white/[0.08] mr-4 h-10">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot" />
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">Live Markets</span>
        </div>
        <div className="overflow-hidden flex-1">
          <div className="ticker-animation flex">
            {doubled.map((item, i) => (
              <TickerItem key={`${item.symbol}-${i}`} item={item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
