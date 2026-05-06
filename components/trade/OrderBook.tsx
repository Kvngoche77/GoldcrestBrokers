'use client';

import React from 'react';
import { useTradeStore } from '@/hooks/use-trade-store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export function OrderBook() {
  const { orderBook, selectedMarket, setOrderPrice } = useTradeStore();

  return (
    <div className="flex flex-col h-full overflow-hidden select-none">
      <div className="px-3 h-9 flex items-center border-b border-[#1e2329] bg-[#161a1e]">
        <span className="text-[12px] font-bold text-[#eaecef]">Order Book</span>
      </div>
      
      <div className="px-3 py-1 flex items-center text-[11px] text-[#848e9c] font-medium border-b border-[#1e2329]">
        <span className="flex-1">Price({selectedMarket.quoteAsset})</span>
        <span className="w-20 text-right">Amount({selectedMarket.baseAsset})</span>
        <span className="w-20 text-right">Total</span>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col min-h-0">
          {/* Asks (Sell) */}
          <div className="flex flex-col-reverse">
            {orderBook.asks.map((ask, i) => (
              <div 
                key={`ask-${i}`} 
                className="relative h-5 flex items-center px-3 cursor-pointer hover:bg-[#1e2329] transition-colors group"
                onClick={() => setOrderPrice(ask.price.toString())}
              >
                <div 
                  className="absolute right-0 top-0 bottom-0 bg-[#f6465d]/10 transition-all duration-300" 
                  style={{ width: `${Math.min((ask.amount / 2) * 100, 100)}%` }}
                />
                <span className="flex-1 text-[12px] text-[#f6465d] font-mono z-10 tracking-tighter">{ask.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                <span className="w-20 text-right text-[12px] text-[#eaecef] font-mono z-10">{ask.amount.toFixed(4)}</span>
                <span className="w-20 text-right text-[12px] text-[#848e9c] font-mono z-10">{ask.total.toFixed(4)}</span>
              </div>
            ))}
          </div>

          {/* Current Market Price */}
          <div className="py-2 px-3 bg-[#1e2329]/30 flex items-center gap-2 border-y border-[#1e2329]">
            <span className={cn(
              "text-[18px] font-bold font-mono tracking-tighter",
              selectedMarket.change24h >= 0 ? "text-[#0ecb81]" : "text-[#f6465d]"
            )}>
              {selectedMarket.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-[#848e9c] font-mono mt-0.5 tracking-tight">${selectedMarket.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>

          {/* Bids (Buy) */}
          <div className="flex flex-col">
            {orderBook.bids.map((bid, i) => (
              <div 
                key={`bid-${i}`} 
                className="relative h-5 flex items-center px-3 cursor-pointer hover:bg-[#1e2329] transition-colors group"
                onClick={() => setOrderPrice(bid.price.toString())}
              >
                <div 
                  className="absolute right-0 top-0 bottom-0 bg-[#0ecb81]/10 transition-all duration-300" 
                  style={{ width: `${Math.min((bid.amount / 2) * 100, 100)}%` }}
                />
                <span className="flex-1 text-[12px] text-[#0ecb81] font-mono z-10 tracking-tighter">{bid.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                <span className="w-20 text-right text-[12px] text-[#eaecef] font-mono z-10">{bid.amount.toFixed(4)}</span>
                <span className="w-20 text-right text-[12px] text-[#848e9c] font-mono z-10">{bid.total.toFixed(4)}</span>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
