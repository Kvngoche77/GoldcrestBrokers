'use client';

import React from 'react';
import { useTradeStore } from '@/hooks/use-trade-store';
import { ScrollArea } from '@/components/ui/scroll-area';

export function RecentTrades() {
  const { recentTrades, selectedMarket } = useTradeStore();

  return (
    <div className="flex flex-col h-1/2 overflow-hidden">
      <div className="p-2 text-xs font-bold text-gray-400">Market Trades</div>
      
      <div className="px-2 py-1 flex items-center text-[10px] text-gray-500 font-medium border-b border-[#1e2329]">
        <span className="flex-1">Price({selectedMarket.quoteAsset})</span>
        <span className="w-20 text-right">Amount({selectedMarket.baseAsset})</span>
        <span className="w-20 text-right">Time</span>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col">
          {recentTrades.map((trade) => (
            <div key={trade.id} className="h-5 flex items-center px-2 hover:bg-gray-800 transition-colors">
              <span className={`flex-1 text-xs font-medium ${trade.side === 'buy' ? 'text-green-500' : 'text-red-500'}`}>
                {trade.price.toLocaleString()}
              </span>
              <span className="w-20 text-right text-xs text-gray-300">{trade.amount.toFixed(4)}</span>
              <span className="w-20 text-right text-xs text-gray-500">{trade.time}</span>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
