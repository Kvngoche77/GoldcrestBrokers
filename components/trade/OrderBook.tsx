'use client';

import React from 'react';
import { useTradeStore } from '@/hooks/use-trade-store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function OrderBook() {
  const { orderBook, selectedMarket, setOrderPrice } = useTradeStore();

  const maxTotal = Math.max(
    ...orderBook.asks.map((a) => a.total),
    ...orderBook.bids.map((b) => b.total),
    1
  );

  const formatPrice = (price: number) => {
    if (price >= 1000) return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (price >= 1) return price.toFixed(4);
    return price.toFixed(6);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden select-none bg-[#0b0e11]">
      {/* Header */}
      <div className="px-3 h-9 flex items-center border-b border-[#1e2329] bg-[#161a1e] flex-shrink-0">
        <span className="text-[12px] font-bold text-[#eaecef]">Order Book</span>
      </div>

      {/* Column headers */}
      <div className="px-3 py-1.5 flex items-center text-[10px] text-[#848e9c] font-bold uppercase tracking-wider border-b border-[#1e2329] flex-shrink-0">
        <span className="flex-1">Price ({selectedMarket.quoteAsset})</span>
        <span className="w-20 text-right">Amount</span>
        <span className="w-20 text-right">Total</span>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col min-h-0">
          {/* Asks (Sell orders) — reversed so lowest ask is at bottom */}
          <div className="flex flex-col-reverse">
            <AnimatePresence initial={false}>
              {orderBook.asks.map((ask, i) => (
                <motion.div
                  initial={{ opacity: 0.6 }}
                  animate={{ opacity: 1 }}
                  key={`ask-${ask.price.toFixed(6)}-${i}`}
                  className="relative h-[22px] flex items-center px-3 cursor-pointer hover:bg-[#2b3139]/60 transition-colors"
                  onClick={() => setOrderPrice(ask.price.toString())}
                >
                  <div
                    className="absolute right-0 top-[1px] bottom-[1px] bg-[#f6465d]/12 transition-all duration-500 ease-out"
                    style={{ width: `${(ask.total / maxTotal) * 100}%` }}
                  />
                  <span className="flex-1 text-[12px] text-[#f6465d] font-mono z-10 tracking-tighter tabular-nums">
                    {formatPrice(ask.price)}
                  </span>
                  <span className="w-20 text-right text-[12px] text-[#eaecef] font-mono z-10 tabular-nums">
                    {ask.amount.toFixed(4)}
                  </span>
                  <span className="w-20 text-right text-[12px] text-[#848e9c] font-mono z-10 tabular-nums">
                    {ask.total.toFixed(2)}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Spread / Current Price */}
          <div className="py-2 px-3 bg-[#1e2329]/40 flex items-center justify-between border-y border-[#1e2329]">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'text-[18px] font-black font-mono tracking-tighter tabular-nums leading-none',
                  selectedMarket.change24h >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'
                )}
              >
                {formatPrice(selectedMarket.price)}
              </span>
              <span className="text-[10px] text-[#848e9c] font-mono mt-0.5">
                ≈${selectedMarket.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div
              className={cn(
                'text-[11px] font-bold px-1.5 py-0.5 rounded',
                selectedMarket.change24h >= 0
                  ? 'text-[#0ecb81] bg-[#0ecb81]/10'
                  : 'text-[#f6465d] bg-[#f6465d]/10'
              )}
            >
              {selectedMarket.change24h >= 0 ? '+' : ''}
              {selectedMarket.change24h.toFixed(2)}%
            </div>
          </div>

          {/* Bids (Buy orders) */}
          <div className="flex flex-col">
            <AnimatePresence initial={false}>
              {orderBook.bids.map((bid, i) => (
                <motion.div
                  initial={{ opacity: 0.6 }}
                  animate={{ opacity: 1 }}
                  key={`bid-${bid.price.toFixed(6)}-${i}`}
                  className="relative h-[22px] flex items-center px-3 cursor-pointer hover:bg-[#2b3139]/60 transition-colors"
                  onClick={() => setOrderPrice(bid.price.toString())}
                >
                  <div
                    className="absolute right-0 top-[1px] bottom-[1px] bg-[#0ecb81]/12 transition-all duration-500 ease-out"
                    style={{ width: `${(bid.total / maxTotal) * 100}%` }}
                  />
                  <span className="flex-1 text-[12px] text-[#0ecb81] font-mono z-10 tracking-tighter tabular-nums">
                    {formatPrice(bid.price)}
                  </span>
                  <span className="w-20 text-right text-[12px] text-[#eaecef] font-mono z-10 tabular-nums">
                    {bid.amount.toFixed(4)}
                  </span>
                  <span className="w-20 text-right text-[12px] text-[#848e9c] font-mono z-10 tabular-nums">
                    {bid.total.toFixed(2)}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
