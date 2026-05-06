'use client';

import React, { useEffect } from 'react';
import { TradingHeader } from '@/components/trade/TradingHeader';
import { MarketWatch } from '@/components/trade/MarketWatch';
import { TradingChart } from '@/components/trade/TradingChart';
import { OrderBook } from '@/components/trade/OrderBook';
import { RecentTrades } from '@/components/trade/RecentTrades';
import { TradePanel } from '@/components/trade/TradePanel';
import { UserOrders } from '@/components/trade/UserOrders';
import { useTradeStore } from '@/hooks/use-trade-store';

export default function TradePage() {
  const { updateMarketData } = useTradeStore();

  useEffect(() => {
    const interval = setInterval(() => {
      updateMarketData();
    }, 3000);
    return () => clearInterval(interval);
  }, [updateMarketData]);

  return (
    <div className="flex flex-col h-screen bg-[#0b0e11] text-gray-200 overflow-hidden font-sans">
      <TradingHeader />
      
      <main className="flex-1 grid grid-cols-[280px_1fr_320px] grid-rows-[1fr_300px] gap-[1px] bg-[#1e2329] overflow-hidden">
        {/* Left Sidebar: Market Watch */}
        <div className="bg-[#0b0e11] row-span-2 flex flex-col min-h-0">
          <MarketWatch />
        </div>

        {/* Center Top: Chart */}
        <div className="bg-[#0b0e11] flex flex-col min-h-0 border-r border-[#1e2329]">
          <TradingChart />
        </div>

        {/* Right Sidebar: Order Book & Recent Trades */}
        <div className="bg-[#0b0e11] flex flex-col min-h-0 border-l border-[#1e2329] overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden">
             <OrderBook />
             <div className="h-[1px] bg-[#1e2329]" />
             <RecentTrades />
          </div>
        </div>

        {/* Center Bottom: User Orders */}
        <div className="bg-[#0b0e11] border-r border-t border-[#1e2329] overflow-hidden">
          <UserOrders />
        </div>

        {/* Right Bottom: Trade Panel */}
        <div className="bg-[#0b0e11] border-t border-[#1e2329] overflow-hidden">
          <TradePanel />
        </div>
      </main>
    </div>
  );
}
