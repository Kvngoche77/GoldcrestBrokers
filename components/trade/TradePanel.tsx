'use client';

import React, { useState } from 'react';
import { useTradeStore } from '@/hooks/use-trade-store';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';

export function TradePanel() {
  const { selectedMarket, orderPrice, orderAmount, setOrderPrice, setOrderAmount } = useTradeStore();
  const [orderType, setOrderType] = useState('limit');
  const [percent, setPercent] = useState(0);

  const handlePlaceOrder = (side: 'buy' | 'sell') => {
    if (!orderAmount || parseFloat(orderAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    toast.success(`${side === 'buy' ? 'Buy' : 'Sell'} order placed successfully`, {
      description: `${orderAmount} ${selectedMarket.baseAsset} at ${orderPrice} ${selectedMarket.quoteAsset}`,
    });
    setOrderAmount('');
    setPercent(0);
  };

  const handlePercentClick = (val: number) => {
    setPercent(val);
    // In a real app, this would calculate based on user balance
    const mockBalance = 10000; // 10k USDT
    if (val > 0) {
      const calculatedAmount = (mockBalance * (val / 100)) / parseFloat(orderPrice);
      setOrderAmount(calculatedAmount.toFixed(4));
    } else {
      setOrderAmount('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#161a1e] p-4">
      <Tabs defaultValue="buy" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-[#1e2329] p-1 h-10">
          <TabsTrigger 
            value="buy" 
            className="data-[state=active]:bg-[#2ebd85] data-[state=active]:text-white text-gray-400 text-xs font-bold"
          >
            Buy
          </TabsTrigger>
          <TabsTrigger 
            value="sell" 
            className="data-[state=active]:bg-[#f6465d] data-[state=active]:text-white text-gray-400 text-xs font-bold"
          >
            Sell
          </TabsTrigger>
        </TabsList>

        <div className="flex gap-4 mt-4 mb-4">
          <button 
            onClick={() => setOrderType('limit')}
            className={`text-xs font-medium ${orderType === 'limit' ? 'text-yellow-500' : 'text-gray-500'}`}
          >
            Limit
          </button>
          <button 
            onClick={() => setOrderType('market')}
            className={`text-xs font-medium ${orderType === 'market' ? 'text-yellow-500' : 'text-gray-500'}`}
          >
            Market
          </button>
        </div>

        <TabsContent value="buy" className="space-y-4 m-0">
          <div className="space-y-3">
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-gray-500">Price</span>
              <Input 
                type="number"
                value={orderPrice}
                onChange={(e) => setOrderPrice(e.target.value)}
                disabled={orderType === 'market'}
                className="pl-14 text-right bg-[#1e2329] border-none text-white h-10 focus-visible:ring-1 focus-visible:ring-yellow-500"
              />
              <span className="absolute right-3 top-2.5 text-xs text-gray-400">{selectedMarket.quoteAsset}</span>
            </div>

            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-gray-500">Amount</span>
              <Input 
                type="number"
                value={orderAmount}
                onChange={(e) => setOrderAmount(e.target.value)}
                className="pl-16 text-right bg-[#1e2329] border-none text-white h-10 focus-visible:ring-1 focus-visible:ring-yellow-500"
              />
              <span className="absolute right-3 top-2.5 text-xs text-gray-400">{selectedMarket.baseAsset}</span>
            </div>

            <div className="flex justify-between gap-2">
              {[25, 50, 75, 100].map((p) => (
                <button
                  key={p}
                  onClick={() => handlePercentClick(p)}
                  className={`flex-1 py-1 text-[10px] font-medium rounded bg-[#1e2329] hover:bg-gray-700 transition-colors ${percent === p ? 'text-yellow-500 border border-yellow-500/50' : 'text-gray-400'}`}
                >
                  {p}%
                </button>
              ))}
            </div>

            <div className="flex justify-between text-xs text-gray-500">
              <span>Total</span>
              <span className="text-gray-200">
                {(parseFloat(orderPrice) * (parseFloat(orderAmount) || 0)).toFixed(2)} {selectedMarket.quoteAsset}
              </span>
            </div>

            <Button 
              className="w-full bg-[#2ebd85] hover:bg-[#2ebd85]/90 text-white font-bold h-10"
              onClick={() => handlePlaceOrder('buy')}
            >
              Buy {selectedMarket.baseAsset}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="sell" className="space-y-4 m-0">
          <div className="space-y-3">
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-gray-500">Price</span>
              <Input 
                type="number"
                value={orderPrice}
                onChange={(e) => setOrderPrice(e.target.value)}
                disabled={orderType === 'market'}
                className="pl-14 text-right bg-[#1e2329] border-none text-white h-10 focus-visible:ring-1 focus-visible:ring-yellow-500"
              />
              <span className="absolute right-3 top-2.5 text-xs text-gray-400">{selectedMarket.quoteAsset}</span>
            </div>

            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-gray-500">Amount</span>
              <Input 
                type="number"
                value={orderAmount}
                onChange={(e) => setOrderAmount(e.target.value)}
                className="pl-16 text-right bg-[#1e2329] border-none text-white h-10 focus-visible:ring-1 focus-visible:ring-yellow-500"
              />
              <span className="absolute right-3 top-2.5 text-xs text-gray-400">{selectedMarket.baseAsset}</span>
            </div>

            <div className="flex justify-between gap-2">
              {[25, 50, 75, 100].map((p) => (
                <button
                  key={p}
                  onClick={() => handlePercentClick(p)}
                  className={`flex-1 py-1 text-[10px] font-medium rounded bg-[#1e2329] hover:bg-gray-700 transition-colors ${percent === p ? 'text-yellow-500 border border-yellow-500/50' : 'text-gray-400'}`}
                >
                  {p}%
                </button>
              ))}
            </div>

            <div className="flex justify-between text-xs text-gray-500">
              <span>Total</span>
              <span className="text-gray-200">
                {(parseFloat(orderPrice) * (parseFloat(orderAmount) || 0)).toFixed(2)} {selectedMarket.quoteAsset}
              </span>
            </div>

            <Button 
              className="w-full bg-[#f6465d] hover:bg-[#f6465d]/90 text-white font-bold h-10"
              onClick={() => handlePlaceOrder('sell')}
            >
              Sell {selectedMarket.baseAsset}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
