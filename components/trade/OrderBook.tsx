'use client';

import React from 'react';
import { useTradeStore } from '@/hooks/use-trade-store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export function OrderBook() {
  const { orderBook, selectedMarket, setOrderPrice } = useTradeStore();

  return (
    <div className="flex flex-col h-1/2 overflow-hidden border-b border-[#1e2329]">
      <div className="p-2 text-xs font-bold text-gray-400">Order Book</div>
      
      <div className="px-2 py-1 flex items-center text-[10px] text-gray-500 font-medium">
        <span className="flex-1">Price({selectedMarket.quoteAsset})</span>
        <span className="w-20 text-right">Amount({selectedMarket.baseAsset})</span>
        <span className="w-20 text-right">Total</span>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col">
          {/* Asks (Sell) */}
          <div className="flex flex-col-reverse">
            {orderBook.asks.map((ask, i) => (
              <div 
                key={`ask-${i}`} 
                className="relative h-5 flex items-center px-2 cursor-pointer hover:bg-gray-800 transition-colors group"
                onClick={() => setOrderPrice(ask.price.toString())}
              >
                <div 
                  className="absolute right-0 top-0 bottom-0 bg-red-500/10 transition-all duration-300" 
                  style={{ width: `${(ask.amount / 2) * 100}%` }}
                />
                <span className="flex-1 text-xs text-red-500 z-10">{ask.price.toLocaleString()}</span>
                <span className="w-20 text-right text-xs text-gray-300 z-10">{ask.amount.toFixed(4)}</span>
                <span className="w-20 text-right text-xs text-gray-300 z-10">{ask.total.toFixed(4)}</span>
              </div>
            ))}
          </div>

          {/* Current Price */}
          <div className="py-2 px-2 bg-gray-900/50 flex items-center gap-2 border-y border-[#1e2329]">
            <span className={cn(
              "text-lg font-bold",
              selectedMarket.change24h >= 0 ? "text-green-500" : "text-red-500"
            )}>
              {selectedMarket.price.toLocaleString()}
            </span>
            <span className="text-[10px] text-gray-500">${selectedMarket.price.toLocaleString()}</span>
          </div>

          {/* Bids (Buy) */}
          <div className="flex flex-col">
            {orderBook.bids.map((bid, i) => (
              <div 
                key={`bid-${i}`} 
                className="relative h-5 flex items-center px-2 cursor-pointer hover:bg-gray-800 transition-colors group"
                onClick={() => setOrderPrice(bid.price.toString())}
              >
                <div 
                  className="absolute right-0 top-0 bottom-0 bg-green-500/10 transition-all duration-300" 
                  style={{ width: `${(bid.amount / 2) * 100}%` }}
                />
                <span className="flex-1 text-xs text-green-500 z-10">{bid.price.toLocaleString()}</span>
                <span className="w-20 text-right text-xs text-gray-300 z-10">{bid.amount.toFixed(4)}</span>
                <span className="w-20 text-right text-xs text-gray-300 z-10">{bid.total.toFixed(4)}</span>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
