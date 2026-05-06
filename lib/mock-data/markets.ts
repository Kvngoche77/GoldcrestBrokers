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

export const markets: Market[] = [
  {
    symbol: 'BTCUSDT',
    baseAsset: 'BTC',
    quoteAsset: 'USDT',
    price: 64250.50,
    change24h: 2.45,
    high24h: 65100.00,
    low24h: 62800.00,
    volume24h: 12500.45,
  },
  {
    symbol: 'ETHUSDT',
    baseAsset: 'ETH',
    quoteAsset: 'USDT',
    price: 3450.75,
    change24h: -1.20,
    high24h: 3520.00,
    low24h: 3380.00,
    volume24h: 85000.20,
  },
  {
    symbol: 'SOLUSDT',
    baseAsset: 'SOL',
    quoteAsset: 'USDT',
    price: 145.30,
    change24h: 5.60,
    high24h: 148.50,
    low24h: 135.00,
    volume24h: 1200000.00,
  },
  {
    symbol: 'BNBUSDT',
    baseAsset: 'BNB',
    quoteAsset: 'USDT',
    price: 580.20,
    change24h: 0.15,
    high24h: 590.00,
    low24h: 575.00,
    volume24h: 45000.00,
  },
  {
    symbol: 'ADAUSDT',
    baseAsset: 'ADA',
    quoteAsset: 'USDT',
    price: 0.45,
    change24h: -2.30,
    high24h: 0.47,
    low24h: 0.44,
    volume24h: 5000000.00,
  },
  {
    symbol: 'DOTUSDT',
    baseAsset: 'DOT',
    quoteAsset: 'USDT',
    price: 7.20,
    change24h: 1.10,
    high24h: 7.35,
    low24h: 7.05,
    volume24h: 800000.00,
  }
];
