import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Market {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
}

export interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
}

export interface OrderBook {
  asks: OrderBookEntry[];
  bids: OrderBookEntry[];
}

export interface Trade {
  id: string;
  price: number;
  amount: number;
  time: string;
  side: 'buy' | 'sell';
}

export type ChartInterval = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

export const DEFAULT_MARKETS: Market[] = [
  { symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT', price: 64250.50, change24h: 2.45, high24h: 65100, low24h: 62800, volume24h: 12500 },
  { symbol: 'ETHUSDT', baseAsset: 'ETH', quoteAsset: 'USDT', price: 3450.75, change24h: -1.20, high24h: 3520, low24h: 3380, volume24h: 85000 },
  { symbol: 'SOLUSDT', baseAsset: 'SOL', quoteAsset: 'USDT', price: 145.30, change24h: 5.60, high24h: 148.5, low24h: 135, volume24h: 1200000 },
  { symbol: 'BNBUSDT', baseAsset: 'BNB', quoteAsset: 'USDT', price: 580.20, change24h: 0.15, high24h: 590, low24h: 575, volume24h: 45000 },
  { symbol: 'XRPUSDT', baseAsset: 'XRP', quoteAsset: 'USDT', price: 0.52, change24h: 1.80, high24h: 0.54, low24h: 0.50, volume24h: 5000000 },
  { symbol: 'ADAUSDT', baseAsset: 'ADA', quoteAsset: 'USDT', price: 0.45, change24h: -2.30, high24h: 0.47, low24h: 0.44, volume24h: 5000000 },
  { symbol: 'DOTUSDT', baseAsset: 'DOT', quoteAsset: 'USDT', price: 7.20, change24h: 1.10, high24h: 7.35, low24h: 7.05, volume24h: 800000 },
  { symbol: 'LINKUSDT', baseAsset: 'LINK', quoteAsset: 'USDT', price: 14.50, change24h: 3.20, high24h: 15.10, low24h: 13.80, volume24h: 300000 },
  { symbol: 'AVAXUSDT', baseAsset: 'AVAX', quoteAsset: 'USDT', price: 36.80, change24h: -0.90, high24h: 38.50, low24h: 35.20, volume24h: 200000 },
  { symbol: 'MATICUSDT', baseAsset: 'MATIC', quoteAsset: 'USDT', price: 0.85, change24h: 4.10, high24h: 0.90, low24h: 0.80, volume24h: 8000000 },
];

// ── WebSocket manager (lives outside React, shared globally) ─────────────────
// Manages a single combined Binance stream for ticker + depth + trades
// Format: wss://stream.binance.com:9443/stream?streams=<a>/<b>/<c>
class BinanceStreamManager {
  private ws: WebSocket | null = null;
  private symbol: string = '';
  private callbacks: {
    onTicker?: (ticker: any) => void;
    onDepth?: (depth: any) => void;
    onTrade?: (trade: any) => void;
  } = {};
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private attempts = 0;
  private closed = false;

  connect(symbol: string, callbacks: typeof this.callbacks) {
    this.closed = false;
    this.symbol = symbol.toLowerCase();
    this.callbacks = callbacks;
    this.attempts = 0;
    this._open();
  }

  disconnect() {
    this.closed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
  }

  private _open() {
    if (this.closed) return;
    // Combined stream: mini-ticker (price/change) + depth20 (order book) + aggTrade (trades)
    const streams = [
      `${this.symbol}@miniTicker`,
      `${this.symbol}@depth20@100ms`,
      `${this.symbol}@aggTrade`,
    ].join('/');

    const url = `wss://stream.binance.com:9443/stream?streams=${streams}`;
    try {
      this.ws = new WebSocket(url);
    } catch {
      this._scheduleReconnect();
      return;
    }

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        const stream: string = msg.stream || '';
        const data = msg.data;

        if (stream.includes('miniTicker') && this.callbacks.onTicker) {
          this.callbacks.onTicker(data);
        } else if (stream.includes('depth') && this.callbacks.onDepth) {
          this.callbacks.onDepth(data);
        } else if (stream.includes('aggTrade') && this.callbacks.onTrade) {
          this.callbacks.onTrade(data);
        }
      } catch { /* ignore */ }
    };

    this.ws.onopen = () => { this.attempts = 0; };
    this.ws.onerror = () => {};
    this.ws.onclose = () => { if (!this.closed) this._scheduleReconnect(); };
  }

  private _scheduleReconnect() {
    const delay = Math.min(1000 * Math.pow(2, this.attempts), 30000);
    this.attempts += 1;
    this.reconnectTimer = setTimeout(() => this._open(), delay);
  }
}

const streamManager = new BinanceStreamManager();

// ── Zustand store ────────────────────────────────────────────────────────────
interface TradeState {
  selectedMarket: Market;
  markets: Market[];
  orderBook: OrderBook;
  recentTrades: Trade[];
  orderPrice: string;
  orderAmount: string;
  chartInterval: ChartInterval;
  favoriteSymbols: string[];
  isLoadingMarket: boolean;
  lastUpdated: number;

  // Actions
  setSelectedMarket: (market: Market) => void;
  setOrderPrice: (price: string) => void;
  setOrderAmount: (amount: string) => void;
  setChartInterval: (interval: ChartInterval) => void;
  toggleFavorite: (symbol: string) => void;
  updateMarketData: () => Promise<void>;
  updateAllMarketPrices: () => Promise<void>;
  connectLiveStream: () => void;
  disconnectLiveStream: () => void;
}

// Safe order book builder
function parseDepth(data: any, currentPrice: number): OrderBook {
  try {
    const asks: OrderBookEntry[] = (data.asks || []).slice(0, 15).map((a: string[]) => ({
      price: parseFloat(a[0]),
      amount: parseFloat(a[1]),
      total: parseFloat(a[0]) * parseFloat(a[1]),
    })).filter((e: OrderBookEntry) => e.amount > 0);

    const bids: OrderBookEntry[] = (data.bids || []).slice(0, 15).map((b: string[]) => ({
      price: parseFloat(b[0]),
      amount: parseFloat(b[1]),
      total: parseFloat(b[0]) * parseFloat(b[1]),
    })).filter((e: OrderBookEntry) => e.amount > 0);

    return { asks, bids };
  } catch {
    return { asks: [], bids: [] };
  }
}

export const useTradeStore = create<TradeState>()(
  persist(
    (set, get) => ({
      selectedMarket: DEFAULT_MARKETS[0],
      markets: DEFAULT_MARKETS,
      orderBook: { asks: [], bids: [] },
      recentTrades: [],
      orderPrice: DEFAULT_MARKETS[0].price.toString(),
      orderAmount: '',
      chartInterval: '1h',
      favoriteSymbols: ['BTCUSDT', 'ETHUSDT'],
      isLoadingMarket: false,
      lastUpdated: 0,

      setSelectedMarket: (market) => {
        set({
          selectedMarket: market,
          orderPrice: market.price.toString(),
          orderAmount: '',
          isLoadingMarket: true,
          orderBook: { asks: [], bids: [] },
          recentTrades: [],
        });
        // Reconnect stream for new symbol
        get().connectLiveStream();
      },

      setOrderPrice: (price) => set({ orderPrice: price }),
      setOrderAmount: (amount) => set({ orderAmount: amount }),
      setChartInterval: (interval) => set({ chartInterval: interval }),

      toggleFavorite: (symbol) => {
        const { favoriteSymbols } = get();
        const isFav = favoriteSymbols.includes(symbol);
        set({
          favoriteSymbols: isFav
            ? favoriteSymbols.filter((s) => s !== symbol)
            : [...favoriteSymbols, symbol],
        });
      },

      // ── WebSocket live stream ────────────────────────────────────────────
      connectLiveStream: () => {
        const { selectedMarket } = get();

        streamManager.connect(selectedMarket.symbol, {
          // miniTicker: real-time price, 24h change, high, low, vol
          onTicker: (data: any) => {
            const price = parseFloat(data.c);
            const change24h = parseFloat(data.P);
            const high24h = parseFloat(data.h);
            const low24h = parseFloat(data.l);
            const volume24h = parseFloat(data.v);

            set((state) => ({
              selectedMarket: {
                ...state.selectedMarket,
                price,
                change24h,
                high24h,
                low24h,
                volume24h,
              },
              orderPrice: state.orderAmount === '' ? price.toFixed(2) : state.orderPrice,
              lastUpdated: Date.now(),
              isLoadingMarket: false,
              // Update in the markets list too
              markets: state.markets.map((m) =>
                m.symbol === state.selectedMarket.symbol
                  ? { ...m, price, change24h, high24h, low24h, volume24h }
                  : m
              ),
            }));
          },

          // depth20: full order book snapshot every 100ms
          onDepth: (data: any) => {
            const { selectedMarket } = get();
            set({ orderBook: parseDepth(data, selectedMarket.price) });
          },

          // aggTrade: every single trade execution
          onTrade: (data: any) => {
            const newTrade: Trade = {
              id: data.a.toString(),
              price: parseFloat(data.p),
              amount: parseFloat(data.q),
              time: new Date(data.T).toTimeString().slice(0, 8),
              side: data.m ? 'sell' : 'buy', // m=true means buyer is maker → taker is seller
            };
            set((state) => ({
              recentTrades: [newTrade, ...state.recentTrades.slice(0, 49)],
            }));
          },
        });
      },

      disconnectLiveStream: () => {
        streamManager.disconnect();
      },

      // ── REST fallback (used on first load + all-markets ticker update) ───
      updateMarketData: async () => {
        const { selectedMarket } = get();
        const symbol = selectedMarket.symbol;

        try {
          const [tickerRes, depthRes, tradesRes] = await Promise.all([
            fetch(`/api/trade/ticker?symbol=${symbol}`),
            fetch(`/api/trade/depth?symbol=${symbol}&limit=20`),
            fetch(`/api/trade/trades?symbol=${symbol}&limit=30`),
          ]);

          const [ticker, depth, trades] = await Promise.all([
            tickerRes.ok ? tickerRes.json() : null,
            depthRes.ok ? depthRes.json() : null,
            tradesRes.ok ? tradesRes.json() : null,
          ]);

          const updates: Partial<TradeState> = { isLoadingMarket: false, lastUpdated: Date.now() };

          if (ticker && !ticker.error) {
            const price = parseFloat(ticker.lastPrice);
            updates.selectedMarket = {
              ...selectedMarket,
              price,
              change24h: parseFloat(ticker.priceChangePercent),
              high24h: parseFloat(ticker.highPrice),
              low24h: parseFloat(ticker.lowPrice),
              volume24h: parseFloat(ticker.volume),
            };
            updates.markets = get().markets.map((m) =>
              m.symbol === symbol
                ? { ...m, price, change24h: parseFloat(ticker.priceChangePercent) }
                : m
            );
          }

          if (depth && depth.asks && depth.bids) {
            updates.orderBook = parseDepth(depth, selectedMarket.price);
          }

          if (Array.isArray(trades) && trades.length > 0) {
            updates.recentTrades = trades.slice(0, 30).map((t: any) => ({
              id: t.id.toString(),
              price: parseFloat(t.price),
              amount: parseFloat(t.qty),
              time: new Date(t.time).toTimeString().slice(0, 8),
              side: t.isBuyerMaker ? 'sell' : 'buy',
            }));
          }

          set(updates as TradeState);
        } catch (error) {
          console.error('[useTradeStore] updateMarketData failed:', error);
          set({ isLoadingMarket: false });
        }
      },

      // Lightweight update for all watchlist prices
      updateAllMarketPrices: async () => {
        const { markets } = get();
        try {
          const res = await fetch(`/api/trade/all-tickers`);
          if (!res.ok) throw new Error('Failed');
          const tickers = await res.json();

          const tickerMap: Record<string, any> = {};
          tickers.forEach((t: any) => { tickerMap[t.symbol] = t; });

          const updatedMarkets = markets.map((m) => {
            const t = tickerMap[m.symbol];
            if (!t) return m;
            return {
              ...m,
              price: parseFloat(t.lastPrice),
              change24h: parseFloat(t.priceChangePercent),
              high24h: parseFloat(t.highPrice),
              low24h: parseFloat(t.lowPrice),
            };
          });

          set({ markets: updatedMarkets });
        } catch {
          // Silently fail; prices update on next WS message
        }
      },
    }),
    {
      name: 'goldcrest-trade-store',
      partialize: (state) => ({
        favoriteSymbols: state.favoriteSymbols,
        chartInterval: state.chartInterval,
        selectedMarket: state.selectedMarket,
      }),
    }
  )
);
