export interface OrderBookLevel {
  price: number;
  amount: number;
  total: number;
}

export interface OrderBook {
  asks: OrderBookLevel[];
  bids: OrderBookLevel[];
}

const generateLevels = (startPrice: number, step: number, count: number, isBid: boolean): OrderBookLevel[] => {
  const levels: OrderBookLevel[] = [];
  let currentTotal = 0;
  for (let i = 0; i < count; i++) {
    const price = isBid ? startPrice - i * step : startPrice + i * step;
    const amount = Math.random() * 2 + 0.1;
    currentTotal += amount;
    levels.push({
      price: parseFloat(price.toFixed(2)),
      amount: parseFloat(amount.toFixed(4)),
      total: parseFloat(currentTotal.toFixed(4)),
    });
  }
  return isBid ? levels : levels.reverse();
};

export const getMockOrderBook = (price: number): OrderBook => {
  return {
    asks: generateLevels(price + 0.5, 0.5, 15, false),
    bids: generateLevels(price - 0.5, 0.5, 15, true),
  };
};
