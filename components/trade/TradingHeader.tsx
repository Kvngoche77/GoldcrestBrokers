'use client';

import React from 'react';
import { useTradeStore } from '@/hooks/use-trade-store';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function TradingHeader() {
  const { selectedMarket } = useTradeStore();
  const isPositive = selectedMarket.change24h >= 0;

  return (
    <header className="h-[64px] bg-[#161a1e] flex items-center px-4 gap-6 select-none border-b border-[#1e2329]">
      <div className="flex items-center gap-3 pr-6 border-r border-[#1e2329] h-8">
        <div className="flex items-center gap-1.5">
          <span className="text-xl font-bold text-[#eaecef]">{selectedMarket.baseAsset}</span>
          <span className="text-xl font-bold text-[#848e9c]">/{selectedMarket.quoteAsset}</span>
        </div>
      </div>

      <div className="flex items-center gap-8">
        <div className="flex flex-col">
          <span className={cn(
            "text-lg font-bold font-mono tracking-tight",
            isPositive ? "text-[#0ecb81]" : "text-[#f6465d]"
          )}>
            {selectedMarket.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
          <span className="text-xs text-[#eaecef] font-medium leading-none">
            ${selectedMarket.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-[11px] text-[#848e9c] font-medium uppercase leading-tight">24h Change</span>
          <span className={cn(
            "text-xs font-bold font-mono mt-0.5",
            isPositive ? "text-[#0ecb81]" : "text-[#f6465d]"
          )}>
            {isPositive ? '+' : ''}{selectedMarket.change24h.toFixed(2)}%
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-[11px] text-[#848e9c] font-medium uppercase leading-tight">24h High</span>
          <span className="text-xs font-bold font-mono text-[#eaecef] mt-0.5">{selectedMarket.high24h.toLocaleString()}</span>
        </div>

        <div className="flex flex-col">
          <span className="text-[11px] text-[#848e9c] font-medium uppercase leading-tight">24h Low</span>
          <span className="text-xs font-bold font-mono text-[#eaecef] mt-0.5">{selectedMarket.low24h.toLocaleString()}</span>
        </div>

        <div className="flex flex-col">
          <span className="text-[11px] text-[#848e9c] font-medium uppercase leading-tight">24h Volume({selectedMarket.baseAsset})</span>
          <span className="text-xs font-bold font-mono text-[#eaecef] mt-0.5">{selectedMarket.volume24h.toLocaleString()}</span>
        </div>

        <div className="flex flex-col">
          <span className="text-[11px] text-[#848e9c] font-medium uppercase leading-tight">24h Volume({selectedMarket.quoteAsset})</span>
          <span className="text-xs font-bold font-mono text-[#eaecef] mt-0.5">{(selectedMarket.volume24h * selectedMarket.price / 1000000).toFixed(2)}M</span>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-4">
        <div className="h-8 w-px bg-[#1e2329]" />
        <div className="flex flex-col items-end">
          <span className="text-[11px] text-[#848e9c] uppercase font-bold tracking-wider">Spot Wallet</span>
          <span className="text-sm font-bold text-[#f0b90b] font-mono">12,450.00 USDT</span>
        </div>
      </div>
    </header>
  );
}
