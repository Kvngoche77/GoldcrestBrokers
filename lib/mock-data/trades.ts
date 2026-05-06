export interface Trade {
  id: string;
  price: number;
  amount: number;
  time: string;
  side: 'buy' | 'sell';
}

export const getMockTrades = (price: number): Trade[] => {
  const trades: Trade[] = [];
  const now = new Date();
  for (let i = 0; i < 20; i++) {
    const time = new Date(now.getTime() - i * 5000);
    trades.push({
      id: Math.random().toString(36).substring(7),
      price: parseFloat((price + (Math.random() - 0.5) * 5).toFixed(2)),
      amount: parseFloat((Math.random() * 0.5).toFixed(4)),
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
      side: Math.random() > 0.5 ? 'buy' : 'sell',
    });
  }
  return trades;
};
