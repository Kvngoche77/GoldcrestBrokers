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
      
      <main className="flex-1 grid grid-cols-[280px_1fr_320px] gap-[1px] bg-[#1e2329] overflow-hidden">
        {/* Left sidebar: Market watchlist */}
        <div className="bg-[#0b0e11] flex flex-col min-h-0 overflow-hidden">
          <MarketWatch />
        </div>

        {/* Center: Main chart + Bottom orders section */}
        <div className="flex flex-col min-h-0 overflow-hidden gap-[1px]">
          <div className="flex-[2.5] bg-[#0b0e11] min-h-0 relative overflow-hidden">
            <TradingChart />
          </div>
          <div className="flex-1 bg-[#0b0e11] min-h-0 overflow-hidden">
            <UserOrders />
          </div>
        </div>

        {/* Right sidebar: Order Book, Recent Trades, Trade Panel */}
        <div className="flex flex-col min-h-0 overflow-hidden gap-[1px]">
          <div className="flex-[2] bg-[#0b0e11] min-h-0 overflow-hidden">
            <OrderBook />
          </div>
          <div className="h-[180px] bg-[#0b0e11] overflow-hidden flex-shrink-0">
            <RecentTrades />
          </div>
          <div className="h-[340px] bg-[#0b0e11] overflow-hidden flex-shrink-0">
            <TradePanel />
          </div>
        </div>
      </main>
    </div>
  );
}
