'use client';

import React from 'react';
import { useTradeStore } from '@/hooks/use-trade-store';
import { ScrollArea } from '@/components/ui/scroll-area';

export function RecentTrades() {
  const { recentTrades, selectedMarket } = useTradeStore();

  return (
    <div className="flex flex-col h-full overflow-hidden select-none">
      <div className="px-2 py-1.5 text-[12px] font-bold text-[#eaecef] border-b border-[#1e2329]">Market Trades</div>
      
      <div className="px-2 py-1 flex items-center text-[10px] text-[#848e9c] font-medium border-b border-[#1e2329]">
        <span className="flex-1">Price({selectedMarket.quoteAsset})</span>
        <span className="w-16 text-right">Amount</span>
        <span className="w-16 text-right">Time</span>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col">
          {recentTrades.map((trade) => (
            <div key={trade.id} className="h-[18px] flex items-center px-2 hover:bg-[#1e2329] transition-colors">
              <span className={`flex-1 text-[11px] font-mono ${trade.side === 'buy' ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                {trade.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span className="w-16 text-right text-[11px] text-[#eaecef] font-mono">{trade.amount.toFixed(4)}</span>
              <span className="w-16 text-right text-[11px] text-[#848e9c] font-mono">{trade.time}</span>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
