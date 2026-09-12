'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, ColorType, ISeriesApi, CandlestickSeries, IChartApi } from 'lightweight-charts';
import { useTradeStore, ChartInterval } from '@/hooks/use-trade-store';
import { Loader2, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

const INTERVALS: { label: string; value: ChartInterval }[] = [
  { label: '1m', value: '1m' },
  { label: '5m', value: '5m' },
  { label: '15m', value: '15m' },
  { label: '1H', value: '1h' },
  { label: '4H', value: '4h' },
  { label: '1D', value: '1d' },
];

// Binance WS stream name — maps our interval key to Binance kline stream interval
const intervalStreamMap: Record<ChartInterval, string> = {
  '1m': '1m', '5m': '5m', '15m': '15m', '1h': '1h', '4h': '4h', '1d': '1d',
};

export function TradingChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const { selectedMarket, chartInterval, setChartInterval } = useTradeStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wsStatus, setWsStatus] = useState<'connecting' | 'live' | 'reconnecting' | 'error'>('connecting');
  const [lastCandleTime, setLastCandleTime] = useState<string>('');

  // ── 1. Init lightweight-charts once ─────────────────────────────────────────
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
        secondsVisible: chartInterval === '1m' || chartInterval === '5m',
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
  }, []); // eslint-disable-line

  // ── 2. Load historical klines from Binance REST via our proxy ───────────────
  const loadHistoricalData = useCallback(async () => {
    if (!seriesRef.current) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/trade/klines?symbol=${selectedMarket.symbol}&interval=${chartInterval}&limit=500`,
        { cache: 'no-store' } // Always fresh — no stale cache
      );
      if (!res.ok) throw new Error('Failed to load chart data');
      const candles = await res.json();
      if (!Array.isArray(candles) || candles.length === 0) throw new Error('No data');

      seriesRef.current.setData(candles);
      chartRef.current?.timeScale().fitContent();
      chartRef.current?.applyOptions({
        timeScale: {
          secondsVisible: chartInterval === '1m' || chartInterval === '5m',
        },
      });
    } catch (err: any) {
      setError('Chart data unavailable');
    } finally {
      setIsLoading(false);
    }
  }, [selectedMarket.symbol, chartInterval]);

  useEffect(() => {
    loadHistoricalData();
  }, [loadHistoricalData]);

  // ── 3. Binance WebSocket — real-time kline stream ────────────────────────────
  const connectWebSocket = useCallback(() => {
    // Close existing connection
    if (wsRef.current) {
      wsRef.current.onclose = null; // prevent reconnect loop
      wsRef.current.close();
      wsRef.current = null;
    }
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
    }

    const streamInterval = intervalStreamMap[chartInterval];
    const streamName = `${selectedMarket.symbol.toLowerCase()}@kline_${streamInterval}`;
    const wsUrl = `wss://stream.binance.com:9443/ws/${streamName}`;

    setWsStatus('connecting');

    let ws: WebSocket;
    try {
      ws = new WebSocket(wsUrl);
    } catch {
      setWsStatus('error');
      return;
    }

    ws.onopen = () => {
      setWsStatus('live');
      reconnectAttemptsRef.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.e !== 'kline') return;

        const k = msg.k;
        const candle = {
          time: Math.floor(k.t / 1000) as any,
          open: parseFloat(k.o),
          high: parseFloat(k.h),
          low: parseFloat(k.l),
          close: parseFloat(k.c),
        };

        if (seriesRef.current) {
          try {
            seriesRef.current.update(candle);
            // Update the last candle timestamp display (HH:MM:SS)
            const d = new Date(k.t);
            setLastCandleTime(d.toTimeString().slice(0, 8));
          } catch {
            // lightweight-charts throws if time goes backwards — safe to ignore
          }
        }
      } catch {
        // JSON parse error — ignore
      }
    };

    ws.onerror = () => {
      setWsStatus('reconnecting');
    };

    ws.onclose = () => {
      // Auto-reconnect with exponential backoff (max 16s)
      const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 16000);
      reconnectAttemptsRef.current += 1;
      setWsStatus('reconnecting');
      reconnectTimerRef.current = setTimeout(() => {
        connectWebSocket();
      }, delay);
    };

    wsRef.current = ws;
  }, [selectedMarket.symbol, chartInterval]);

  // Reconnect whenever symbol or interval changes
  useEffect(() => {
    // Wait until historical data is loaded before connecting WS
    if (!isLoading) {
      connectWebSocket();
    }
    return () => {
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
    };
  }, [connectWebSocket, isLoading]);

  // ── Status indicator ─────────────────────────────────────────────────────────
  const statusConfig = {
    connecting: { label: 'Connecting...', color: 'text-amber-400', dot: 'bg-amber-400' },
    live: { label: 'Live', color: 'text-emerald-400', dot: 'bg-emerald-400' },
    reconnecting: { label: 'Reconnecting', color: 'text-amber-400', dot: 'bg-amber-400' },
    error: { label: 'Offline', color: 'text-[#f6465d]', dot: 'bg-[#f6465d]' },
  };
  const status = statusConfig[wsStatus];

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
            <span className="text-[#0ecb81] font-mono font-bold">
              {selectedMarket.high24h?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[#848e9c]">Low</span>
            <span className="text-[#f6465d] font-mono font-bold">
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

        {/* WebSocket live status — pushed right */}
        <div className="ml-auto flex items-center gap-2">
          {lastCandleTime && wsStatus === 'live' && (
            <span className="text-[9px] text-[#848e9c] font-mono hidden sm:block">
              {lastCandleTime}
            </span>
          )}
          <div className="flex items-center gap-1.5 bg-black/20 px-2 py-1 rounded-md border border-white/5">
            <div className="relative flex items-center justify-center">
              {wsStatus === 'live' ? (
                <>
                  <div className={`absolute w-2 h-2 ${status.dot} rounded-full animate-ping opacity-60`} />
                  <div className={`w-1.5 h-1.5 ${status.dot} rounded-full relative`} />
                </>
              ) : (
                <div className={`w-1.5 h-1.5 ${status.dot} rounded-full`} />
              )}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${status.color}`}>
              {status.label}
            </span>
          </div>
        </div>
      </div>

      {/* Chart container */}
      <div className="flex-1 w-full relative min-h-0">
        <div ref={chartContainerRef} className="w-full h-full" />

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0b0e11]/90 z-10">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 text-[#f0b90b] animate-spin" />
              <span className="text-[#848e9c] text-xs font-medium">
                Loading {selectedMarket.baseAsset}/{selectedMarket.quoteAsset} {chartInterval} chart...
              </span>
            </div>
          </div>
        )}

        {/* Error overlay */}
        {error && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0b0e11]/50 z-10">
            <div className="text-center">
              <WifiOff className="h-8 w-8 text-[#848e9c] mx-auto mb-2" />
              <p className="text-[#848e9c] text-sm">{error}</p>
              <button
                onClick={loadHistoricalData}
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
