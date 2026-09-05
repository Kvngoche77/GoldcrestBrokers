'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTradeStore, DEFAULT_MARKETS, Market } from '@/hooks/use-trade-store';
import { Search, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

export function MarketWatch() {
  const { selectedMarket, markets, setSelectedMarket, favoriteSymbols, toggleFavorite } = useTradeStore();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'favorites' | 'usdt'>('all');
  const prevPricesRef = useRef<Record<string, number>>({});
  const [flashMap, setFlashMap] = useState<Record<string, 'up' | 'down' | null>>({});

  // Detect price changes and flash green/red
  useEffect(() => {
    const newFlash: Record<string, 'up' | 'down' | null> = {};
    markets.forEach((m) => {
      const prev = prevPricesRef.current[m.symbol];
      if (prev !== undefined && prev !== m.price) {
        newFlash[m.symbol] = m.price > prev ? 'up' : 'down';
      }
      prevPricesRef.current[m.symbol] = m.price;
    });
    if (Object.keys(newFlash).length > 0) {
      setFlashMap(newFlash);
      const timer = setTimeout(() => setFlashMap({}), 600);
      return () => clearTimeout(timer);
    }
  }, [markets]);

  const filteredMarkets = markets.filter((m) => {
    const matchSearch = m.symbol.toLowerCase().includes(search.toLowerCase()) ||
      m.baseAsset.toLowerCase().includes(search.toLowerCase());
    if (activeTab === 'favorites') return matchSearch && favoriteSymbols.includes(m.symbol);
    if (activeTab === 'usdt') return matchSearch && m.quoteAsset === 'USDT';
    return matchSearch;
  });

  return (
    <div className="flex flex-col h-full select-none bg-[#0b0e11]">
      {/* Search */}
      <div className="p-2 space-y-2 border-b border-[#1e2329]">
        <div className="relative group">
          <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-[#848e9c] group-focus-within:text-[#f0b90b]" />
          <input
            placeholder="Search markets..."
            className="w-full pl-8 pr-2 bg-[#1e2329] text-[12px] text-[#eaecef] h-8 rounded focus:ring-1 focus:ring-[#f0b90b] outline-none placeholder:text-[#5e6673] border-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-4 h-7">
          {(['all', 'favorites', 'usdt'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'text-[11px] font-bold h-full border-b-2 transition-all capitalize',
                activeTab === tab
                  ? 'text-[#f0b90b] border-[#f0b90b]'
                  : 'text-[#848e9c] border-transparent hover:text-[#eaecef]'
              )}
            >
              {tab === 'favorites' ? '★ Favs' : tab === 'usdt' ? 'USDT' : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Column headers */}
      <div className="px-2 py-1 flex items-center text-[10px] text-[#848e9c] font-bold uppercase tracking-wider border-b border-[#1e2329] flex-shrink-0">
        <span className="flex-1">Pair</span>
        <span className="w-20 text-right">Price</span>
        <span className="w-14 text-right">24h%</span>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col">
          {filteredMarkets.length === 0 ? (
            <div className="text-center text-[#848e9c] text-xs py-8">No markets found</div>
          ) : (
            filteredMarkets.map((market) => {
              const isFav = favoriteSymbols.includes(market.symbol);
              const flash = flashMap[market.symbol];
              const isSelected = selectedMarket.symbol === market.symbol;

              return (
                <div
                  key={market.symbol}
                  className={cn(
                    'w-full px-2 py-1.5 flex items-center hover:bg-[#1e2329]/80 transition-colors cursor-pointer group',
                    isSelected && 'bg-[#1e2329]'
                  )}
                  onClick={() => setSelectedMarket(market)}
                >
                  {/* Favorite star */}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(market.symbol); }}
                    className="mr-1.5 flex-shrink-0"
                  >
                    <Star
                      className={cn('h-3 w-3 transition-colors', isFav ? 'text-[#f0b90b] fill-[#f0b90b]' : 'text-[#5e6673] group-hover:text-[#848e9c]')}
                    />
                  </button>

                  {/* Name */}
                  <div className="flex-1 flex items-center gap-1 min-w-0">
                    <div className="text-left leading-tight">
                      <span className="text-[12px] font-bold text-[#eaecef]">{market.baseAsset}</span>
                      <span className="text-[10px] text-[#848e9c]">/{market.quoteAsset}</span>
                    </div>
                  </div>

                  {/* Price with flash */}
                  <div className={cn(
                    'w-20 text-right text-[11px] font-mono font-bold tabular-nums transition-colors duration-300',
                    flash === 'up' ? 'text-[#0ecb81]' : flash === 'down' ? 'text-[#f6465d]' : 'text-[#eaecef]'
                  )}>
                    {market.price >= 100
                      ? market.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      : market.price.toFixed(4)}
                  </div>

                  {/* Change */}
                  <div className={cn(
                    'w-14 text-right text-[11px] font-mono',
                    market.change24h >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'
                  )}>
                    {market.change24h >= 0 ? '+' : ''}{market.change24h.toFixed(2)}%
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
