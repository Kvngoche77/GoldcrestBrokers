'use client';

import React from 'react';
import { useTradeStore } from '@/hooks/use-trade-store';
import { ArrowUp, ArrowDown, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export function TradingHeader() {
  const { selectedMarket } = useTradeStore();
  const isPositive = selectedMarket.change24h >= 0;

  return (
    <header className="h-[64px] bg-[#161a1e] flex items-center px-3 sm:px-4 gap-3 sm:gap-6 select-none border-b border-[#1e2329] relative overflow-hidden flex-shrink-0">
      <div className="flex items-center gap-1.5 sm:gap-3 pr-3 sm:pr-6 border-r border-[#1e2329] h-8 flex-shrink-0">
        <div className="flex items-center gap-1">
          <span className="text-sm sm:text-lg lg:text-xl font-black text-[#eaecef] tracking-tight">{selectedMarket.baseAsset}</span>
          <span className="text-xs sm:text-base lg:text-xl font-bold text-[#848e9c]">/{selectedMarket.quoteAsset}</span>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-10 flex-shrink-0">
        <div className="flex flex-col justify-center">
          <span className={cn(
            "text-sm sm:text-lg lg:text-xl font-bold font-mono tracking-tighter tabular-nums leading-none",
            isPositive ? "text-[#0ecb81]" : "text-[#f6465d]"
          )}>
            {selectedMarket.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[9px] sm:text-[11px] text-[#848e9c] font-bold mt-1.5 tracking-tight">
            ${selectedMarket.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-4 md:gap-10">
          <div className="flex flex-col">
            <span className="text-[9px] sm:text-[10px] text-[#848e9c] font-bold uppercase tracking-widest leading-none">24h Change</span>
            <span className={cn(
              "text-[11px] sm:text-[12px] font-bold font-mono mt-1.5",
              isPositive ? "text-[#0ecb81]" : "text-[#f6465d]"
            )}>
              {isPositive ? '+' : ''}{selectedMarket.change24h.toFixed(2)}%
            </span>
          </div>

          <div className="hidden md:flex flex-col">
            <span className="text-[10px] text-[#848e9c] font-bold uppercase tracking-widest leading-none">24h High</span>
            <span className="text-[12px] font-bold font-mono text-[#eaecef] mt-1.5">{selectedMarket.high24h?.toLocaleString()}</span>
          </div>

          <div className="hidden md:flex flex-col">
            <span className="text-[10px] text-[#848e9c] font-bold uppercase tracking-widest leading-none">24h Low</span>
            <span className="text-[12px] font-bold font-mono text-[#eaecef] mt-1.5">{selectedMarket.low24h?.toLocaleString()}</span>
          </div>

          <div className="hidden lg:flex flex-col">
            <span className="text-[10px] text-[#848e9c] font-bold uppercase tracking-widest leading-none">24h Volume({selectedMarket.baseAsset})</span>
            <span className="text-[12px] font-bold font-mono text-[#eaecef] mt-1.5 tabular-nums">{selectedMarket.volume24h?.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-3 sm:gap-6 flex-shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-2 bg-black/20 px-2 sm:px-3 py-1.5 rounded-lg border border-white/5 flex-shrink-0">
          <div className="relative flex items-center justify-center">
            <div className="absolute w-2 h-2 bg-emerald-500 rounded-full animate-ping opacity-75" />
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full relative" />
          </div>
          <span className="text-[9px] sm:text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Live</span>
        </div>
        
        <div className="hidden sm:block h-8 w-px bg-[#1e2329]" />
        
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-[10px] text-[#848e9c] uppercase font-bold tracking-widest leading-none">Network Status</span>
          <span className="text-[12px] font-bold text-blue-400 font-mono mt-1.5">CONNECTED</span>
        </div>
      </div>
    </header>
  );
}

