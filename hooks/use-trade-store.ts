import { create } from 'zustand';
import { Market, markets } from '@/lib/mock-data/markets';
import { OrderBook, getMockOrderBook } from '@/lib/mock-data/orderbook';
import { Trade, getMockTrades } from '@/lib/mock-data/trades';

interface TradeState {
  selectedMarket: Market;
  orderBook: OrderBook;
  recentTrades: Trade[];
  orderPrice: string;
  orderAmount: string;
  
  // Actions
  setSelectedMarket: (market: Market) => void;
  setOrderPrice: (price: string) => void;
  setOrderAmount: (amount: string) => void;
  updateMarketData: () => Promise<void>;
}

export const useTradeStore = create<TradeState>((set, get) => ({
  selectedMarket: markets[0],
  orderBook: getMockOrderBook(markets[0].price),
  recentTrades: getMockTrades(markets[0].price),
  orderPrice: markets[0].price.toString(),
  orderAmount: '',

  setSelectedMarket: async (market) => {
    set({ 
      selectedMarket: market,
      orderPrice: market.price.toString()
    });
    // Immediately fetch real data for the new market
    const { updateMarketData } = get();
    await updateMarketData();
  },

  setOrderPrice: (price) => set({ orderPrice: price }),
  setOrderAmount: (amount) => set({ orderAmount: amount }),

  updateMarketData: async () => {
    const { selectedMarket } = get();
    const symbol = selectedMarket.symbol;

    try {
      // Fetch real ticker data from Binance
      const tickerRes = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
      const ticker = await tickerRes.json();

      // Fetch real order book data
      const depthRes = await fetch(`https://api.binance.com/api/v3/depth?symbol=${symbol}&limit=20`);
      const depth = await depthRes.json();

      // Fetch real recent trades
      const tradesRes = await fetch(`https://api.binance.com/api/v3/trades?symbol=${symbol}&limit=20`);
      const trades = await tradesRes.json();

      if (ticker && depth && trades) {
        set({
          selectedMarket: {
            ...selectedMarket,
            price: parseFloat(ticker.lastPrice),
            change24h: parseFloat(ticker.priceChangePercent),
            high24h: parseFloat(ticker.highPrice),
            low24h: parseFloat(ticker.lowPrice),
            volume24h: parseFloat(ticker.volume),
          },
          orderBook: {
            asks: depth.asks.map((a: any) => ({
              price: parseFloat(a[0]),
              amount: parseFloat(a[1]),
              total: parseFloat(a[0]) * parseFloat(a[1])
            })),
            bids: depth.bids.map((b: any) => ({
              price: parseFloat(b[0]),
              amount: parseFloat(b[1]),
              total: parseFloat(b[0]) * parseFloat(b[1])
            }))
          },
          recentTrades: trades.map((t: any) => ({
            id: t.id.toString(),
            price: parseFloat(t.price),
            amount: parseFloat(t.qty),
            time: new Date(t.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
            side: t.isBuyerMaker ? 'sell' : 'buy' // in Binance API isBuyerMaker=true means sell order hit bid
          }))
        });
      }
    } catch (error) {
      console.error('Failed to fetch real-time market data:', error);
      // Fallback to mock data if API fails
      const newPrice = selectedMarket.price + (Math.random() - 0.5) * 2;
      set({
        selectedMarket: { ...selectedMarket, price: parseFloat(newPrice.toFixed(2)) },
        orderBook: getMockOrderBook(newPrice),
      });
    }
  },
}));
