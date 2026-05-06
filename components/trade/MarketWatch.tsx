'use client';

import React, { useState } from 'react';
import { useTradeStore } from '@/hooks/use-trade-store';
import { markets } from '@/lib/mock-data/markets';
import { Search, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function MarketWatch() {
  const { selectedMarket, setSelectedMarket } = useTradeStore();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const filteredMarkets = markets.filter(m => 
    m.symbol.toLowerCase().includes(search.toLowerCase()) &&
    (activeTab === 'all' || m.quoteAsset === activeTab.toUpperCase())
  );

  return (
    <div className="flex flex-col h-full select-none">
      <div className="p-2 space-y-2">
        <div className="relative group">
          <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-[#848e9c] group-focus-within:text-[#f0b90b]" />
          <input 
            placeholder="Search" 
            className="w-full pl-8 pr-2 bg-[#1e2329] border-none text-[12px] text-[#eaecef] h-8 rounded focus:ring-1 focus:ring-[#f0b90b] outline-none placeholder:text-[#5e6673]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-4 h-6 border-b border-[#1e2329]">
          {['All', 'Favorites', 'USDT'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className={cn(
                "text-[11px] font-bold h-full border-b-2 transition-all",
                activeTab === tab.toLowerCase() 
                  ? "text-[#f0b90b] border-[#f0b90b]" 
                  : "text-[#848e9c] border-transparent hover:text-[#eaecef]"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="px-2 py-1 flex items-center text-[10px] text-[#848e9c] font-medium border-b border-[#1e2329]">
        <span className="flex-1">Pair</span>
        <span className="w-16 text-right">Price</span>
        <span className="w-14 text-right">Change</span>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col">
          {filteredMarkets.map((market) => (
            <button
              key={market.symbol}
              onClick={() => setSelectedMarket(market)}
              className={cn(
                "w-full px-2 py-1.5 flex items-center hover:bg-[#1e2329] transition-colors group",
                selectedMarket.symbol === market.symbol && "bg-[#1e2329]"
              )}
            >
              <div className="flex-1 flex items-center gap-1.5">
                <Star className="h-3 w-3 text-[#5e6673] group-hover:text-[#f0b90b]" />
                <div className="text-left leading-tight">
                  <span className="text-[12px] font-bold text-[#eaecef]">{market.baseAsset}</span>
                  <span className="text-[10px] text-[#848e9c]">/{market.quoteAsset}</span>
                </div>
              </div>
              <div className="w-16 text-right text-[11px] text-[#eaecef] font-mono">
                {market.price.toLocaleString()}
              </div>
              <div className={cn(
                "w-14 text-right text-[11px] font-mono",
                market.change24h >= 0 ? "text-[#0ecb81]" : "text-[#f6465d]"
              )}>
                {market.change24h >= 0 ? '+' : ''}{market.change24h}%
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
