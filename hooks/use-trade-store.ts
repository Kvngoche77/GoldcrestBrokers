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

function generateMockOrderBook(price: number): OrderBook {
  const asks: OrderBookEntry[] = [];
  const bids: OrderBookEntry[] = [];
  for (let i = 0; i < 15; i++) {
    const askPrice = price * (1 + (i + 1) * 0.0005);
    const askAmount = Math.random() * 2 + 0.01;
    asks.push({ price: parseFloat(askPrice.toFixed(2)), amount: parseFloat(askAmount.toFixed(4)), total: parseFloat((askPrice * askAmount).toFixed(2)) });
  }
  for (let i = 0; i < 15; i++) {
    const bidPrice = price * (1 - (i + 1) * 0.0005);
    const bidAmount = Math.random() * 2 + 0.01;
    bids.push({ price: parseFloat(bidPrice.toFixed(2)), amount: parseFloat(bidAmount.toFixed(4)), total: parseFloat((bidPrice * bidAmount).toFixed(2)) });
  }
  return { asks, bids };
}

function generateMockTrades(price: number): Trade[] {
  return Array.from({ length: 20 }, (_, i) => {
    const side = Math.random() > 0.5 ? 'buy' : 'sell';
    const tradePrice = price * (1 + (Math.random() - 0.5) * 0.002);
    const amount = Math.random() * 1.5 + 0.001;
    const now = new Date();
    now.setSeconds(now.getSeconds() - i * 3);
    return {
      id: `mock-${i}`,
      price: parseFloat(tradePrice.toFixed(2)),
      amount: parseFloat(amount.toFixed(4)),
      time: now.toTimeString().slice(0, 8),
      side,
    };
  });
}

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
}

export const useTradeStore = create<TradeState>()(
  persist(
    (set, get) => ({
      selectedMarket: DEFAULT_MARKETS[0],
      markets: DEFAULT_MARKETS,
      orderBook: generateMockOrderBook(DEFAULT_MARKETS[0].price),
      recentTrades: generateMockTrades(DEFAULT_MARKETS[0].price),
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
        });
        // Trigger market data update for the new symbol
        get().updateMarketData();
      },

      setOrderPrice: (price) => set({ orderPrice: price }),
      setOrderAmount: (amount) => set({ orderAmount: amount }),

      setChartInterval: (interval) => {
        set({ chartInterval: interval });
      },

      toggleFavorite: (symbol) => {
        const { favoriteSymbols } = get();
        const isFav = favoriteSymbols.includes(symbol);
        set({
          favoriteSymbols: isFav
            ? favoriteSymbols.filter((s) => s !== symbol)
            : [...favoriteSymbols, symbol],
        });
      },

      updateMarketData: async () => {
        const { selectedMarket } = get();
        const symbol = selectedMarket.symbol;

        try {
          // Use our server-side proxy to avoid CORS
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
            updates.selectedMarket = {
              ...selectedMarket,
              price: parseFloat(ticker.lastPrice),
              change24h: parseFloat(ticker.priceChangePercent),
              high24h: parseFloat(ticker.highPrice),
              low24h: parseFloat(ticker.lowPrice),
              volume24h: parseFloat(ticker.volume),
            };
            updates.orderPrice = parseFloat(ticker.lastPrice).toString();
            // Also update this market in the markets list
            updates.markets = get().markets.map((m) =>
              m.symbol === symbol
                ? { ...m, price: parseFloat(ticker.lastPrice), change24h: parseFloat(ticker.priceChangePercent) }
                : m
            );
          }

          if (depth && depth.asks && depth.bids) {
            updates.orderBook = {
              asks: depth.asks.slice(0, 15).map((a: string[]) => ({
                price: parseFloat(a[0]),
                amount: parseFloat(a[1]),
                total: parseFloat(a[0]) * parseFloat(a[1]),
              })),
              bids: depth.bids.slice(0, 15).map((b: string[]) => ({
                price: parseFloat(b[0]),
                amount: parseFloat(b[1]),
                total: parseFloat(b[0]) * parseFloat(b[1]),
              })),
            };
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
          // Fallback: slight price variation with mock data
          const newPrice = selectedMarket.price * (1 + (Math.random() - 0.5) * 0.001);
          set({
            selectedMarket: { ...selectedMarket, price: parseFloat(newPrice.toFixed(2)) },
            orderBook: generateMockOrderBook(newPrice),
            isLoadingMarket: false,
          });
        }
      },

      // Lightweight update of all market prices (for watchlist) 
      updateAllMarketPrices: async () => {
        const { markets } = get();
        try {
          const symbols = markets.map((m) => m.symbol).join(',');
          // Fetch all tickers from Binance at once  
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
          // Silently fail; prices update on next full updateMarketData call
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
