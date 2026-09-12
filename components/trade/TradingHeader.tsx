'use client';

import React from 'react';
import { useTradeStore } from '@/hooks/use-trade-store';
import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';

// Format large numbers as $1.2B, $456M, $12.3K
function formatVolUSD(volume: number, price: number): string {
  const val = volume * price;
  if (val >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(2)}B`;
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
  return `$${val.toFixed(0)}`;
}

export function TradingHeader() {
  const { selectedMarket, favoriteSymbols, toggleFavorite } = useTradeStore();
  const isPositive = selectedMarket.change24h >= 0;
  const isFav = favoriteSymbols.includes(selectedMarket.symbol);

  const formatPrice = (price: number) => {
    if (price >= 1000) return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (price >= 1) return price.toFixed(4);
    return price.toFixed(6);
  };

  return (
    <header className="h-[60px] bg-[#161a1e] flex items-center px-3 sm:px-4 gap-3 sm:gap-6 select-none border-b border-[#1e2329] relative overflow-hidden flex-shrink-0">

      {/* Symbol + Favorite Star */}
      <div className="flex items-center gap-1.5 pr-3 sm:pr-6 border-r border-[#1e2329] h-8 flex-shrink-0">
        {/* Favorite star */}
        <button
          onClick={() => toggleFavorite(selectedMarket.symbol)}
          title={isFav ? 'Remove from favorites' : 'Add to favorites'}
          className="mr-1 flex-shrink-0 transition-transform hover:scale-110 active:scale-95"
        >
          <Star
            size={14}
            className={cn(
              'transition-colors duration-200',
              isFav ? 'text-[#f0b90b] fill-[#f0b90b]' : 'text-[#5e6673] hover:text-[#848e9c]'
            )}
          />
        </button>

        <div className="flex items-center gap-1">
          <span className="text-sm sm:text-lg font-black text-[#eaecef] tracking-tight">
            {selectedMarket.baseAsset}
          </span>
          <span className="text-xs sm:text-base font-bold text-[#848e9c]">
            /{selectedMarket.quoteAsset}
          </span>
        </div>
      </div>

      {/* Price & Stats */}
      <div className="flex items-center gap-4 sm:gap-8 flex-shrink-0">
        {/* Price */}
        <div className="flex flex-col justify-center">
          <span className={cn(
            'text-base sm:text-xl font-black font-mono tracking-tighter tabular-nums leading-none',
            isPositive ? 'text-[#0ecb81]' : 'text-[#f6465d]'
          )}>
            {formatPrice(selectedMarket.price)}
          </span>
          <span className="text-[9px] sm:text-[11px] text-[#848e9c] font-bold mt-1 tracking-tight">
            ≈${selectedMarket.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* 24h Change */}
        <div className="hidden sm:flex flex-col">
          <span className="text-[9px] text-[#848e9c] font-bold uppercase tracking-widest leading-none">
            24h Change
          </span>
          <span className={cn(
            'text-[12px] font-bold font-mono mt-1.5 tabular-nums',
            isPositive ? 'text-[#0ecb81]' : 'text-[#f6465d]'
          )}>
            {isPositive ? '+' : ''}{selectedMarket.change24h.toFixed(2)}%
          </span>
        </div>

        {/* 24h High */}
        <div className="hidden md:flex flex-col">
          <span className="text-[9px] text-[#848e9c] font-bold uppercase tracking-widest leading-none">24h High</span>
          <span className="text-[12px] font-bold font-mono text-[#eaecef] mt-1.5 tabular-nums">
            {selectedMarket.high24h?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* 24h Low */}
        <div className="hidden md:flex flex-col">
          <span className="text-[9px] text-[#848e9c] font-bold uppercase tracking-widest leading-none">24h Low</span>
          <span className="text-[12px] font-bold font-mono text-[#eaecef] mt-1.5 tabular-nums">
            {selectedMarket.low24h?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* Volume (USDT) — replaces base asset volume for clarity */}
        <div className="hidden lg:flex flex-col">
          <span className="text-[9px] text-[#848e9c] font-bold uppercase tracking-widest leading-none">
            Vol (USDT)
          </span>
          <span className="text-[12px] font-bold font-mono text-[#eaecef] mt-1.5 tabular-nums">
            {selectedMarket.volume24h && selectedMarket.price
              ? formatVolUSD(selectedMarket.volume24h, selectedMarket.price)
              : '—'
            }
          </span>
        </div>

        {/* Volume (base asset) — secondary */}
        <div className="hidden xl:flex flex-col">
          <span className="text-[9px] text-[#848e9c] font-bold uppercase tracking-widest leading-none">
            Vol ({selectedMarket.baseAsset})
          </span>
          <span className="text-[12px] font-bold font-mono text-[#eaecef] mt-1.5 tabular-nums">
            {selectedMarket.volume24h?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>

      {/* Live status */}
      <div className="ml-auto flex items-center gap-2 flex-shrink-0">
        <div className="flex items-center gap-1.5 bg-black/20 px-2.5 py-1.5 rounded-lg border border-white/5">
          <div className="relative flex items-center justify-center">
            <div className="absolute w-2 h-2 bg-emerald-500 rounded-full animate-ping opacity-75" />
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full relative" />
          </div>
          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Live</span>
        </div>
      </div>
    </header>
  );
}
