'use client';

import React from 'react';
import { useTradeStore } from '@/hooks/use-trade-store';

export function TradingChart() {
  const { selectedMarket } = useTradeStore();
  
  // Using an iframe for the Advanced Chart is more reliable in Next.js/React
  // than script injection, as it avoids hydration and script execution issues.
  const chartUrl = `https://s.tradingview.com/widgetembed/?frameElementId=tradingview_762c4&symbol=BINANCE:${selectedMarket.symbol}&interval=D&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=[]&theme=dark&style=1&timezone=Etc%2FUTC&studies_overrides={}&overrides={}&enabled_features=[]&disabled_features=[]&locale=en&utm_source=localhost&utm_medium=widget&utm_campaign=chart&utm_term=BINANCE:${selectedMarket.symbol}`;

  return (
    <div className="flex flex-col h-full bg-[#0b0e11] overflow-hidden">
      <div className="h-10 border-b border-[#1e2329] flex items-center px-4 gap-4 bg-[#161a1e]">
        <div className="flex items-center gap-6 h-full">
          <span className="text-[12px] font-bold text-[#f0b90b] border-b-2 border-[#f0b90b] h-full flex items-center cursor-pointer">Chart</span>
          <span className="text-[12px] text-[#848e9c] hover:text-[#eaecef] cursor-pointer font-medium h-full flex items-center">Depth</span>
        </div>
      </div>
      <div className="flex-1 w-full relative">
        <iframe
          key={selectedMarket.symbol}
          src={chartUrl}
          className="w-full h-full border-none"
          allowFullScreen
        />
      </div>
    </div>
  );
}
