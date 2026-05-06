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
    <div className="flex flex-col h-full">
      <div className="p-3 space-y-3">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input 
            placeholder="Search" 
            className="pl-8 bg-[#1e2329] border-none text-xs h-9 focus-visible:ring-1 focus-visible:ring-yellow-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-transparent border-b border-[#1e2329] w-full justify-start h-8 p-0 gap-4">
            <TabsTrigger value="all" className="data-[state=active]:bg-transparent data-[state=active]:text-yellow-500 border-b-2 border-transparent data-[state=active]:border-yellow-500 rounded-none h-8 text-xs p-0">All</TabsTrigger>
            <TabsTrigger value="usdt" className="data-[state=active]:bg-transparent data-[state=active]:text-yellow-500 border-b-2 border-transparent data-[state=active]:border-yellow-500 rounded-none h-8 text-xs p-0">USDT</TabsTrigger>
            <TabsTrigger value="favorites" className="data-[state=active]:bg-transparent data-[state=active]:text-yellow-500 border-b-2 border-transparent data-[state=active]:border-yellow-500 rounded-none h-8 text-xs p-0">Favorites</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="px-3 py-1 flex items-center text-[10px] text-gray-500 font-medium border-b border-[#1e2329]">
        <span className="flex-1">Pair</span>
        <span className="w-20 text-right">Price</span>
        <span className="w-16 text-right">Change</span>
      </div>

      <ScrollArea className="flex-1">
        <div className="divide-y divide-[#1e2329]/50">
          {filteredMarkets.map((market) => (
            <button
              key={market.symbol}
              onClick={() => setSelectedMarket(market)}
              className={cn(
                "w-full px-3 py-2 flex items-center hover:bg-[#1e2329] transition-colors group",
                selectedMarket.symbol === market.symbol && "bg-[#1e2329]"
              )}
            >
              <div className="flex-1 flex items-center gap-2">
                <Star className="h-3 w-3 text-gray-600 group-hover:text-yellow-500" />
                <div className="text-left">
                  <span className="text-xs font-semibold text-gray-200">{market.baseAsset}</span>
                  <span className="text-[10px] text-gray-500">/{market.quoteAsset}</span>
                </div>
              </div>
              <div className="w-20 text-right text-xs text-gray-300 font-medium">
                {market.price.toLocaleString()}
              </div>
              <div className={cn(
                "w-16 text-right text-xs font-medium",
                market.change24h >= 0 ? "text-green-500" : "text-red-500"
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
