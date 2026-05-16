'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, ISeriesApi, CandlestickData, CandlestickSeries } from 'lightweight-charts';
import { useTradeStore } from '@/hooks/use-trade-store';

export function TradingChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const { selectedMarket } = useTradeStore();
  const [chart, setChart] = useState<any>(null);
  const [series, setSeries] = useState<ISeriesApi<"Candlestick"> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chartOptions = {
      layout: {
        background: { type: ColorType.Solid, color: '#0b0e11' },
        textColor: '#848e9c',
      },
      grid: {
        vertLines: { color: '#1e2329' },
        horzLines: { color: '#1e2329' },
      },
      crosshair: {
        mode: 0,
        vertLine: {
          labelBackgroundColor: '#2b3139',
        },
        horzLine: {
          labelBackgroundColor: '#2b3139',
        },
      },
      timeScale: {
        borderColor: '#1e2329',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: '#1e2329',
      },
    };

    const newChart = createChart(chartContainerRef.current, {
      ...chartOptions,
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
    });

    const newSeries = newChart.addSeries(CandlestickSeries, {
      upColor: '#0ecb81',
      downColor: '#f6465d',
      borderVisible: false,
      wickUpColor: '#0ecb81',
      wickDownColor: '#f6465d',
    });

    setChart(newChart);
    setSeries(newSeries as any);

    const handleResize = () => {
      if (chartContainerRef.current) {
        newChart.applyOptions({ 
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight 
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      newChart.remove();
    };
  }, []);

  useEffect(() => {
    if (!series || !selectedMarket.symbol) return;

    const fetchKlines = async () => {
      try {
        const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${selectedMarket.symbol}&interval=1h&limit=100`);
        const data = await response.json();
        
        const candlestickData: CandlestickData[] = data.map((d: any) => ({
          time: d[0] / 1000 as any,
          open: parseFloat(d[1]),
          high: parseFloat(d[2]),
          low: parseFloat(d[3]),
          close: parseFloat(d[4]),
        }));

        series.setData(candlestickData);
      } catch (error) {
        console.error('Error fetching klines:', error);
      }
    };

    fetchKlines();
  }, [series, selectedMarket.symbol]);

  return (
    <div className="flex flex-col h-full bg-[#0b0e11] overflow-hidden">
      <div className="h-10 border-b border-[#1e2329] flex items-center px-4 justify-between bg-[#161a1e]">
        <div className="flex items-center gap-6 h-full">
          <span className="text-[12px] font-bold text-[#f0b90b] border-b-2 border-[#f0b90b] h-full flex items-center cursor-pointer">Chart</span>
          <span className="text-[12px] text-[#848e9c] hover:text-[#eaecef] cursor-pointer font-medium h-full flex items-center">Depth</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#848e9c]">24h High</span>
            <span className="text-[10px] text-[#eaecef] font-mono">{selectedMarket.high24h?.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#848e9c]">24h Low</span>
            <span className="text-[10px] text-[#eaecef] font-mono">{selectedMarket.low24h?.toLocaleString()}</span>
          </div>
        </div>
      </div>
      <div className="flex-1 w-full relative" ref={chartContainerRef} />
    </div>
  );
}

