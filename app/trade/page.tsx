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
    <div className="flex flex-col h-screen bg-[#0b0e11] text-[#eaecef] overflow-hidden selection:bg-[#f0b90b]/30">
      {/* Top Navbar */}
      <TradingHeader />
      
      <main className="flex-1 grid grid-cols-[280px_1fr_320px] gap-[1px] bg-[#1e2329] overflow-hidden border-t border-[#1e2329]">
        {/* Left Sidebar: Market Watchlist */}
        <div className="bg-[#0b0e11] flex flex-col min-h-0">
          <MarketWatch />
        </div>

        {/* Center Section: Chart & Orders */}
        <div className="flex flex-col min-h-0 gap-[1px]">
          <div className="flex-[2] bg-[#0b0e11] min-h-0">
            <TradingChart />
          </div>
          <div className="h-[320px] bg-[#0b0e11] min-h-0">
            <UserOrders />
          </div>
        </div>

        {/* Right Sidebar: Order Book, Recent Trades & Trade Panel */}
        <div className="flex flex-col min-h-0 gap-[1px]">
          <div className="flex-1 bg-[#0b0e11] min-h-0">
            <OrderBook />
          </div>
          <div className="h-[200px] bg-[#0b0e11] min-h-0">
            <RecentTrades />
          </div>
          <div className="h-[380px] bg-[#0b0e11] min-h-0">
            <TradePanel />
          </div>
        </div>
      </main>
    </div>
  );
}
