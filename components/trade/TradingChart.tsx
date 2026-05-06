'use client';

import React, { useEffect, useRef } from 'react';
import { useTradeStore } from '@/hooks/use-trade-store';

export function TradingChart() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { selectedMarket } = useTradeStore();

  useEffect(() => {
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
      "container_id": "tradingview_advanced_chart"
    });
    
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
      const widgetContainer = document.createElement('div');
      widgetContainer.id = 'tradingview_advanced_chart';
      widgetContainer.style.height = '100%';
      widgetContainer.style.width = '100%';
      containerRef.current.appendChild(widgetContainer);
      containerRef.current.appendChild(script);
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [selectedMarket]);

  return (
    <div className="flex flex-col h-full bg-[#0b0e11] overflow-hidden">
      <div className="h-10 border-b border-[#1e2329] flex items-center px-4 gap-4 bg-[#161a1e]">
        <span className="text-[12px] font-bold text-[#f0b90b] border-b-2 border-[#f0b90b] h-full flex items-center">Chart</span>
        <span className="text-[12px] text-[#848e9c] hover:text-[#eaecef] cursor-pointer font-medium">Depth</span>
      </div>
      <div ref={containerRef} className="flex-1 w-full" />
    </div>
  );
}
