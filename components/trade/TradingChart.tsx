'use client';

import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, ISeriesApi, UTCTimestamp, CrosshairMode, LineStyle } from 'lightweight-charts';
import { useTradeStore } from '@/hooks/use-trade-store';

export function TradingChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const { selectedMarket } = useTradeStore();

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chartOptions: any = {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#848e9c',
        fontSize: 10,
      },
      grid: {
        vertLines: { color: '#1e2329' },
        horzLines: { color: '#1e2329' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          width: 1 as any,
          color: '#5d6673',
          style: LineStyle.LargeDashed,
        },
        horzLine: {
          width: 1 as any,
          color: '#5d6673',
          style: LineStyle.LargeDashed,
        },
      },
      rightPriceScale: {
        borderColor: '#1e2329',
      },
      timeScale: {
        borderColor: '#1e2329',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    };

    const chart = createChart(chartContainerRef.current, {
      ...chartOptions,
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
    });
    
    chartRef.current = chart;

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#2ebd85',
      downColor: '#f6465d',
      borderVisible: false,
      wickUpColor: '#2ebd85',
      wickDownColor: '#f6465d',
    });
    
    candlestickSeriesRef.current = candlestickSeries;

    // Generate mock data for the selected symbol
    const data = generateMockChartData();
    candlestickSeries.setData(data);

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [selectedMarket]);

  const generateMockChartData = () => {
    const data = [];
    const now = Math.floor(Date.now() / 1000);
    let lastClose = selectedMarket.price;

    for (let i = 100; i >= 0; i--) {
      const time = (now - i * 60) as UTCTimestamp;
      const open = lastClose + (Math.random() - 0.5) * 10;
      const close = open + (Math.random() - 0.5) * 10;
      const high = Math.max(open, close) + Math.random() * 5;
      const low = Math.min(open, close) - Math.random() * 5;
      
      data.push({ time, open, high, low, close });
      lastClose = close;
    }
    return data;
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="h-10 border-b border-[#1e2329] flex items-center px-4 gap-4 bg-[#161a1e]">
        <span className="text-[10px] font-bold text-yellow-500 border-b-2 border-yellow-500 h-full flex items-center px-2">Time</span>
        <span className="text-[10px] text-gray-500 hover:text-gray-300 cursor-pointer">1m</span>
        <span className="text-[10px] text-gray-300 hover:text-white cursor-pointer font-medium">15m</span>
        <span className="text-[10px] text-gray-500 hover:text-gray-300 cursor-pointer">1h</span>
        <span className="text-[10px] text-gray-500 hover:text-gray-300 cursor-pointer">4h</span>
        <span className="text-[10px] text-gray-500 hover:text-gray-300 cursor-pointer">1d</span>
      </div>
      <div ref={chartContainerRef} className="flex-1 w-full" />
    </div>
  );
}
