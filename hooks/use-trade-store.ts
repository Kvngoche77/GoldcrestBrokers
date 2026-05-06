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
  updateMarketData: () => void;
}

export const useTradeStore = create<TradeState>((set, get) => ({
  selectedMarket: markets[0],
  orderBook: getMockOrderBook(markets[0].price),
  recentTrades: getMockTrades(markets[0].price),
  orderPrice: markets[0].price.toString(),
  orderAmount: '',

  setSelectedMarket: (market) => {
    set({ 
      selectedMarket: market,
      orderBook: getMockOrderBook(market.price),
      recentTrades: getMockTrades(market.price),
      orderPrice: market.price.toString()
    });
  },

  setOrderPrice: (price) => set({ orderPrice: price }),
  setOrderAmount: (amount) => set({ orderAmount: amount }),

  updateMarketData: () => {
    const { selectedMarket } = get();
    // Simulate real-time updates
    const newPrice = selectedMarket.price + (Math.random() - 0.5) * 2;
    const updatedMarket = { ...selectedMarket, price: parseFloat(newPrice.toFixed(2)) };
    
    set({
      selectedMarket: updatedMarket,
      orderBook: getMockOrderBook(newPrice),
      recentTrades: [
        {
          id: Math.random().toString(36).substring(7),
          price: parseFloat(newPrice.toFixed(2)),
          amount: parseFloat((Math.random() * 0.1).toFixed(4)),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
          side: Math.random() > 0.5 ? 'buy' : 'sell',
        },
        ...get().recentTrades.slice(0, 19),
      ],
    });
  },
}));
