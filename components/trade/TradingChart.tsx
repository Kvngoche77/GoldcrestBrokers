'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, ColorType, ISeriesApi, CandlestickSeries, IChartApi } from 'lightweight-charts';
import { useTradeStore, ChartInterval } from '@/hooks/use-trade-store';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const INTERVALS: { label: string; value: ChartInterval }[] = [
  { label: '1m', value: '1m' },
  { label: '5m', value: '5m' },
  { label: '15m', value: '15m' },
  { label: '1H', value: '1h' },
  { label: '4H', value: '4h' },
  { label: '1D', value: '1d' },
];

export function TradingChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const { selectedMarket, chartInterval, setChartInterval, lastUpdated } = useTradeStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Init chart once
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0b0e11' },
        textColor: '#848e9c',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: '#1e2329' },
        horzLines: { color: '#1e2329' },
      },
      crosshair: {
        mode: 0,
        vertLine: { labelBackgroundColor: '#2b3139' },
        horzLine: { labelBackgroundColor: '#2b3139' },
      },
      timeScale: {
        borderColor: '#1e2329',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: { borderColor: '#1e2329' },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#0ecb81',
      downColor: '#f6465d',
      borderVisible: false,
      wickUpColor: '#0ecb81',
      wickDownColor: '#f6465d',
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    const ro = new ResizeObserver(handleResize);
    ro.observe(chartContainerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  // Load chart data when symbol or interval changes
  const loadChartData = useCallback(async () => {
    if (!seriesRef.current) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/trade/klines?symbol=${selectedMarket.symbol}&interval=${chartInterval}&limit=200`
      );
      if (!res.ok) throw new Error('Failed to load chart data');
      const candles = await res.json();

      if (!Array.isArray(candles) || candles.length === 0) throw new Error('No data');

      seriesRef.current.setData(candles);
      chartRef.current?.timeScale().fitContent();
    } catch (err: any) {
      setError('Chart data unavailable');
    } finally {
      setIsLoading(false);
    }
  }, [selectedMarket.symbol, chartInterval]);

  useEffect(() => {
    loadChartData();
  }, [loadChartData]);

  // Live update: update the last candle every time market updates
  useEffect(() => {
    if (!seriesRef.current || !selectedMarket.price || isLoading) return;
    try {
      const now = Math.floor(Date.now() / 1000);
      // Lightweight-charts requires time to be latest — just update current bar
      seriesRef.current.update({
        time: now as any,
        open: selectedMarket.price * 0.9999,
        high: selectedMarket.high24h || selectedMarket.price * 1.001,
        low: selectedMarket.low24h || selectedMarket.price * 0.999,
        close: selectedMarket.price,
      });
    } catch {
      // Ignore if update fails (e.g. time out of order)
    }
  }, [selectedMarket.price, isLoading, lastUpdated]);

  return (
    <div className="flex flex-col h-full bg-[#0b0e11] overflow-hidden">
      {/* Chart Controls Bar */}
      <div className="h-10 border-b border-[#1e2329] flex items-center px-3 gap-1 bg-[#161a1e] flex-shrink-0">
        {/* Interval switcher */}
        <div className="flex items-center gap-0.5 mr-4">
          {INTERVALS.map((iv) => (
            <button
              key={iv.value}
              onClick={() => setChartInterval(iv.value)}
              className={cn(
                'px-2 py-1 text-[11px] font-bold rounded transition-all',
                chartInterval === iv.value
                  ? 'text-[#f0b90b] bg-[#f0b90b]/10'
                  : 'text-[#848e9c] hover:text-[#eaecef] hover:bg-white/[0.03]'
              )}
            >
              {iv.label}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-[#1e2329] mx-2" />

        {/* 24h stats */}
        <div className="hidden sm:flex items-center gap-5 text-[10px]">
          <div className="flex items-center gap-1.5">
            <span className="text-[#848e9c]">High</span>
            <span className="text-[#eaecef] font-mono font-bold">
              {selectedMarket.high24h?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[#848e9c]">Low</span>
            <span className="text-[#eaecef] font-mono font-bold">
              {selectedMarket.low24h?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[#848e9c]">Vol ({selectedMarket.baseAsset})</span>
            <span className="text-[#eaecef] font-mono font-bold">
              {selectedMarket.volume24h?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>
      </div>

      {/* Chart container */}
      <div className="flex-1 w-full relative min-h-0">
        <div ref={chartContainerRef} className="w-full h-full" />

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0b0e11]/80 z-10">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 text-[#f0b90b] animate-spin" />
              <span className="text-[#848e9c] text-xs font-medium">Loading chart...</span>
            </div>
          </div>
        )}

        {/* Error overlay */}
        {error && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0b0e11]/50 z-10">
            <div className="text-center">
              <p className="text-[#848e9c] text-sm">{error}</p>
              <button
                onClick={loadChartData}
                className="mt-2 px-4 py-1 bg-[#f0b90b]/20 text-[#f0b90b] text-xs rounded hover:bg-[#f0b90b]/30 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
