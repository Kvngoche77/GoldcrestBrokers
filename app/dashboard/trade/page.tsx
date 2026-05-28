'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTradeStore } from '@/hooks/use-trade-store';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

// Dynamically import all trade components with SSR disabled
const TradingHeader = dynamic(() => import('@/components/trade/TradingHeader').then(m => ({ default: m.TradingHeader })), { ssr: false });
const MarketWatch = dynamic(() => import('@/components/trade/MarketWatch').then(m => ({ default: m.MarketWatch })), { ssr: false });
const TradingChart = dynamic(() => import('@/components/trade/TradingChart').then(m => ({ default: m.TradingChart })), { ssr: false });
const OrderBook = dynamic(() => import('@/components/trade/OrderBook').then(m => ({ default: m.OrderBook })), { ssr: false });
const RecentTrades = dynamic(() => import('@/components/trade/RecentTrades').then(m => ({ default: m.RecentTrades })), { ssr: false });
const TradePanel = dynamic(() => import('@/components/trade/TradePanel').then(m => ({ default: m.TradePanel })), { ssr: false });
const UserOrders = dynamic(() => import('@/components/trade/UserOrders').then(m => ({ default: m.UserOrders })), { ssr: false });

export default function DashboardTradePage() {
  const { updateMarketData } = useTradeStore();
  const { profile, refreshProfile } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<'watchlist' | 'chart' | 'book' | 'trade' | 'orders'>('chart');

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      updateMarketData();
    }, 3000);
    return () => clearInterval(interval);
  }, [updateMarketData]);

  if (!mounted) {
    return (
      <div className="flex h-[calc(100vh-120px)] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Initializing Trading Terminal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] -m-4 sm:-m-6 lg:-m-8 bg-[#0b0e11] text-[#eaecef] overflow-hidden selection:bg-[#f0b90b]/30">
      <TradingHeader />

      {/* Mobile Tab Selector */}
      <div className="lg:hidden flex border-b border-[#1e2329] bg-[#0b0e11] text-[11px] sm:text-xs font-semibold px-2 py-1.5 gap-1.5 overflow-x-auto scrollbar-none flex-shrink-0">
        {[
          { id: 'watchlist', label: 'Watchlist' },
          { id: 'chart', label: 'Chart' },
          { id: 'book', label: 'Order Book' },
          { id: 'trade', label: 'Trade Panel' },
          { id: 'orders', label: 'Orders & Funds' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveMobileTab(t.id as any)}
            className={`flex-1 min-w-[75px] sm:min-w-[85px] text-center py-2 px-2.5 rounded-xl transition-all border ${
              activeMobileTab === t.id
                ? 'bg-blue-600/15 text-blue-400 border-blue-500/25 shadow-[0_0_12px_rgba(59,130,246,0.15)] font-bold'
                : 'text-slate-400 hover:text-white border-transparent hover:bg-white/[0.02]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      
      <main className="flex-1 lg:grid lg:grid-cols-[280px_1fr_320px] gap-[1px] bg-[#1e2329] overflow-hidden relative">
        {/* Left column: Market Watchlist */}
        <div className={`bg-[#0b0e11] flex-col min-h-0 overflow-hidden ${
          activeMobileTab === 'watchlist' ? 'flex h-full' : 'hidden lg:flex'
        }`}>
          <MarketWatch />
        </div>

        {/* Center column: Trading Chart and User Orders */}
        <div className={`flex-col min-h-0 overflow-hidden gap-[1px] lg:col-start-2 lg:col-end-3 ${
          activeMobileTab === 'chart' || activeMobileTab === 'orders' ? 'flex h-full' : 'hidden lg:flex'
        }`}>
          {/* Trading Chart */}
          <div className={`flex-[2.5] bg-[#0b0e11] min-h-0 relative overflow-hidden ${
            activeMobileTab === 'chart' ? 'flex h-full' : 'hidden lg:flex'
          }`}>
            <TradingChart />
          </div>
          {/* User Orders / Funds */}
          <div className={`flex-1 bg-[#0b0e11] min-h-0 overflow-hidden ${
            activeMobileTab === 'orders' ? 'flex h-full' : 'hidden lg:flex'
          }`}>
            <UserOrders />
          </div>
        </div>

        {/* Right column: Order book, recent trades, and action panel */}
        <div className={`flex-col min-h-0 overflow-hidden gap-[1px] lg:col-start-3 lg:col-end-4 ${
          activeMobileTab === 'book' || activeMobileTab === 'trade' ? 'flex h-full' : 'hidden lg:flex'
        }`}>
          {/* Order Book */}
          <div className={`flex-[2] bg-[#0b0e11] min-h-0 overflow-hidden ${
            activeMobileTab === 'book' ? 'flex h-full' : 'hidden lg:flex'
          }`}>
            <OrderBook />
          </div>
          {/* Recent Trades */}
          <div className={`h-[180px] bg-[#0b0e11] overflow-hidden flex-shrink-0 ${
            activeMobileTab === 'book' ? 'block' : 'hidden lg:block'
          }`}>
            <RecentTrades />
          </div>
          {/* Trade Panel */}
          <div className={`bg-[#0b0e11] overflow-hidden flex-shrink-0 ${
            activeMobileTab === 'trade' ? 'block h-full p-4' : 'h-[340px] hidden lg:block'
          }`}>
            <TradePanel />
          </div>
        </div>
      </main>
    </div>
  );
}
