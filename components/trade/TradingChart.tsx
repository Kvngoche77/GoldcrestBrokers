'use client';

import React, { useEffect, useRef } from 'react';
import { useTradeStore } from '@/hooks/use-trade-store';

declare global {
  interface Window {
    TradingView: any;
  }
}

export function TradingChart() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { selectedMarket } = useTradeStore();
  const chartId = `tradingview_${selectedMarket.symbol.toLowerCase()}`;

  useEffect(() => {
    // Clear previous widget
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      "autosize": true,
      "symbol": `BINANCE:${selectedMarket.symbol}`,
      "interval": "D",
      "timezone": "Etc/UTC",
      "theme": "dark",
      "style": "1",
      "locale": "en",
      "enable_publishing": false,
      "allow_symbol_change": false,
      "calendar": false,
      "support_host": "https://www.tradingview.com",
      "backgroundColor": "rgba(11, 14, 17, 1)",
      "gridColor": "rgba(30, 35, 41, 1)",
      "hide_top_toolbar": false,
      "hide_side_toolbar": false,
      "save_image": false,
      "container_id": chartId
    });
    
    const widgetContainer = document.createElement('div');
    widgetContainer.id = chartId;
    widgetContainer.className = "h-full w-full";
    
    if (containerRef.current) {
      containerRef.current.appendChild(widgetContainer);
      containerRef.current.appendChild(script);
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [selectedMarket, chartId]);

  return (
    <div className="flex flex-col h-full bg-[#0b0e11] overflow-hidden">
      <div className="h-10 border-b border-[#1e2329] flex items-center px-4 gap-4 bg-[#161a1e]">
        <div className="flex items-center gap-6 h-full">
          <span className="text-[12px] font-bold text-[#f0b90b] border-b-2 border-[#f0b90b] h-full flex items-center cursor-pointer">Chart</span>
          <span className="text-[12px] text-[#848e9c] hover:text-[#eaecef] cursor-pointer font-medium h-full flex items-center">Depth</span>
        </div>
      </div>
      <div ref={containerRef} className="flex-1 w-full tradingview-widget-container" />
    </div>
  );
}
