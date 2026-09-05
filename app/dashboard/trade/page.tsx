'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTradeStore } from '@/hooks/use-trade-store';

// Dynamically import all trade components with SSR disabled
const TradingHeader = dynamic(() => import('@/components/trade/TradingHeader').then(m => ({ default: m.TradingHeader })), { ssr: false });
const MarketWatch = dynamic(() => import('@/components/trade/MarketWatch').then(m => ({ default: m.MarketWatch })), { ssr: false });
const TradingChart = dynamic(() => import('@/components/trade/TradingChart').then(m => ({ default: m.TradingChart })), { ssr: false });
const OrderBook = dynamic(() => import('@/components/trade/OrderBook').then(m => ({ default: m.OrderBook })), { ssr: false });
const RecentTrades = dynamic(() => import('@/components/trade/RecentTrades').then(m => ({ default: m.RecentTrades })), { ssr: false });
const TradePanel = dynamic(() => import('@/components/trade/TradePanel').then(m => ({ default: m.TradePanel })), { ssr: false });
const UserOrders = dynamic(() => import('@/components/trade/UserOrders').then(m => ({ default: m.UserOrders })), { ssr: false });

type MobileTab = 'watchlist' | 'chart' | 'book' | 'trade' | 'orders';

const MOBILE_TABS: { id: MobileTab; label: string }[] = [
  { id: 'watchlist', label: 'Markets' },
  { id: 'chart', label: 'Chart' },
  { id: 'book', label: 'Book' },
  { id: 'trade', label: 'Trade' },
  { id: 'orders', label: 'Orders' },
];

export default function DashboardTradePage() {
  const { updateMarketData } = useTradeStore();
  const [mounted, setMounted] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<MobileTab>('chart');

  useEffect(() => {
    setMounted(true);
    // Initial fetch
    updateMarketData();
    // Poll every 4 seconds via our server-side proxy
    const interval = setInterval(() => {
      updateMarketData();
    }, 4000);
    return () => clearInterval(interval);
  }, [updateMarketData]);

  if (!mounted) {
    return (
      <div className="flex h-[calc(100vh-120px)] items-center justify-center bg-[#0b0e11]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-2 border-[#f0b90b] border-t-transparent animate-spin" />
          <p className="text-slate-400 text-sm font-medium tracking-wide">Initializing Trading Terminal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] -m-4 sm:-m-6 lg:-m-8 bg-[#0b0e11] text-[#eaecef] overflow-hidden selection:bg-[#f0b90b]/30">
      <TradingHeader />

      {/* Mobile Tab Bar */}
      <div className="lg:hidden flex border-b border-[#1e2329] bg-[#0b0e11] text-[11px] sm:text-xs font-semibold px-2 py-1.5 gap-1 overflow-x-auto scrollbar-none flex-shrink-0">
        {MOBILE_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveMobileTab(t.id)}
            className={`flex-1 min-w-[64px] text-center py-2 px-2 rounded-lg transition-all ${
              activeMobileTab === t.id
                ? 'bg-[#f0b90b]/15 text-[#f0b90b] font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.02]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Main Layout */}
      <main className="flex-1 lg:grid lg:grid-cols-[280px_1fr_320px] gap-[1px] bg-[#1e2329] overflow-hidden">

        {/* Left: Market Watchlist */}
        <div className={`bg-[#0b0e11] flex-col min-h-0 overflow-hidden ${activeMobileTab === 'watchlist' ? 'flex h-full' : 'hidden lg:flex'}`}>
          <MarketWatch />
        </div>

        {/* Center: Chart + Orders */}
        <div className={`flex-col min-h-0 overflow-hidden gap-[1px] lg:col-start-2 lg:col-end-3 ${activeMobileTab === 'chart' || activeMobileTab === 'orders' ? 'flex h-full' : 'hidden lg:flex'}`}>
          {/* Chart */}
          <div className={`flex-[2.5] bg-[#0b0e11] min-h-0 relative overflow-hidden ${activeMobileTab === 'chart' ? 'flex h-full' : 'hidden lg:flex'}`}>
            <TradingChart />
          </div>
          {/* Orders / Funds */}
          <div className={`flex-1 bg-[#0b0e11] min-h-0 overflow-hidden ${activeMobileTab === 'orders' ? 'flex h-full' : 'hidden lg:flex'}`}>
            <UserOrders />
          </div>
        </div>

        {/* Right: Order Book + Recent Trades + Trade Panel */}
        <div className={`flex-col min-h-0 overflow-hidden gap-[1px] lg:col-start-3 lg:col-end-4 ${activeMobileTab === 'book' || activeMobileTab === 'trade' ? 'flex h-full' : 'hidden lg:flex'}`}>
          {/* Order Book */}
          <div className={`flex-[2] bg-[#0b0e11] min-h-0 overflow-hidden ${activeMobileTab === 'book' ? 'flex h-full' : 'hidden lg:flex'}`}>
            <OrderBook />
          </div>
          {/* Recent Trades */}
          <div className={`h-[160px] bg-[#0b0e11] overflow-hidden flex-shrink-0 ${activeMobileTab === 'book' ? 'block' : 'hidden lg:block'}`}>
            <RecentTrades />
          </div>
          {/* Trade Panel */}
          <div className={`bg-[#0b0e11] overflow-hidden flex-shrink-0 ${activeMobileTab === 'trade' ? 'flex flex-col h-full' : 'h-[380px] hidden lg:flex lg:flex-col'}`}>
            <TradePanel />
          </div>
        </div>

      </main>
    </div>
  );
}
