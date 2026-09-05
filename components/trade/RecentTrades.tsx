'use client';

import React from 'react';
import { useTradeStore } from '@/hooks/use-trade-store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export function RecentTrades() {
  const { recentTrades, selectedMarket } = useTradeStore();

  const formatPrice = (price: number) => {
    if (price >= 1000) return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (price >= 1) return price.toFixed(4);
    return price.toFixed(6);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden select-none bg-[#0b0e11]">
      {/* Header */}
      <div className="px-3 h-9 flex items-center border-b border-[#1e2329] bg-[#161a1e] flex-shrink-0">
        <span className="text-[12px] font-bold text-[#eaecef]">Market Trades</span>
      </div>

      {/* Column headers */}
      <div className="px-3 py-1 flex items-center text-[10px] text-[#848e9c] font-bold uppercase tracking-wider border-b border-[#1e2329] flex-shrink-0">
        <span className="flex-1">Price ({selectedMarket.quoteAsset})</span>
        <span className="w-16 text-right">Amount</span>
        <span className="w-16 text-right">Time</span>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col">
          {recentTrades.map((trade) => (
            <div
              key={trade.id}
              className="h-[18px] flex items-center px-3 hover:bg-[#1e2329]/50 transition-colors"
            >
              <span
                className={cn(
                  'flex-1 text-[11px] font-mono tabular-nums',
                  trade.side === 'buy' ? 'text-[#0ecb81]' : 'text-[#f6465d]'
                )}
              >
                {formatPrice(trade.price)}
              </span>
              <span className="w-16 text-right text-[11px] text-[#eaecef] font-mono tabular-nums">
                {trade.amount.toFixed(4)}
              </span>
              <span className="w-16 text-right text-[11px] text-[#848e9c] font-mono">
                {trade.time}
              </span>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
