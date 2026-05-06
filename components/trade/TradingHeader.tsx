'use client';

import React from 'react';
import { useTradeStore } from '@/hooks/use-trade-store';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function TradingHeader() {
  const { selectedMarket } = useTradeStore();
  const isPositive = selectedMarket.change24h >= 0;

  return (
    <header className="h-16 bg-[#161a1e] border-b border-[#1e2329] flex items-center px-4 gap-8">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-bold text-white">{selectedMarket.symbol}</h1>
        <div className={cn(
          "px-2 py-0.5 rounded text-xs font-medium",
          isPositive ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
        )}>
          {isPositive ? '+' : ''}{selectedMarket.change24h}%
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div>
          <p className="text-xs text-gray-400">Price</p>
          <p className={cn(
            "text-sm font-semibold",
            isPositive ? "text-green-500" : "text-red-500"
          )}>
            {selectedMarket.price.toLocaleString()} <span className="text-[10px] text-gray-500">{selectedMarket.quoteAsset}</span>
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-400">24h High</p>
          <p className="text-sm font-medium text-white">{selectedMarket.high24h.toLocaleString()}</p>
        </div>

        <div>
          <p className="text-xs text-gray-400">24h Low</p>
          <p className="text-sm font-medium text-white">{selectedMarket.low24h.toLocaleString()}</p>
        </div>

        <div>
          <p className="text-xs text-gray-400">24h Volume({selectedMarket.baseAsset})</p>
          <p className="text-sm font-medium text-white">{selectedMarket.volume24h.toLocaleString()}</p>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-4">
        {/* Placeholder for user balance or other info */}
        <div className="text-xs text-gray-400">
          Spot Wallet: <span className="text-white">12,450.00 USDT</span>
        </div>
      </div>
    </header>
  );
}
