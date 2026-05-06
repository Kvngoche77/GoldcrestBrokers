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
    const mockBalance = 10000;
    if (val > 0) {
      const calculatedAmount = (mockBalance * (val / 100)) / parseFloat(orderPrice);
      setOrderAmount(calculatedAmount.toFixed(4));
    } else {
      setOrderAmount('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#161a1e] p-3 select-none">
      <div className="flex gap-1 mb-4">
        <button 
          onClick={() => setOrderType('limit')}
          className={cn(
            "text-[12px] font-bold px-2 py-1 rounded transition-colors",
            orderType === 'limit' ? "bg-[#1e2329] text-[#f0b90b]" : "text-[#848e9c] hover:text-[#eaecef]"
          )}
        >
          Limit
        </button>
        <button 
          onClick={() => setOrderType('market')}
          className={cn(
            "text-[12px] font-bold px-2 py-1 rounded transition-colors",
            orderType === 'market' ? "bg-[#1e2329] text-[#f0b90b]" : "text-[#848e9c] hover:text-[#eaecef]"
          )}
        >
          Market
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Buy Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#848e9c] uppercase">Avbl</span>
            <span className="text-[10px] font-bold text-[#eaecef] font-mono">10,000.00 USDT</span>
          </div>
          
          <div className="relative group">
            <span className="absolute left-3 top-2 text-[11px] text-[#848e9c]">Price</span>
            <input 
              type="number"
              value={orderPrice}
              onChange={(e) => setOrderPrice(e.target.value)}
              disabled={orderType === 'market'}
              className="w-full pl-12 pr-12 text-right bg-[#1e2329] border border-transparent focus:border-[#f0b90b] text-[#eaecef] text-[13px] font-mono h-8 rounded outline-none"
            />
            <span className="absolute right-3 top-2 text-[11px] text-[#eaecef]">{selectedMarket.quoteAsset}</span>
          </div>

          <div className="relative group">
            <span className="absolute left-3 top-2 text-[11px] text-[#848e9c]">Amount</span>
            <input 
              type="number"
              value={orderAmount}
              onChange={(e) => setOrderAmount(e.target.value)}
              className="w-full pl-14 pr-12 text-right bg-[#1e2329] border border-transparent focus:border-[#f0b90b] text-[#eaecef] text-[13px] font-mono h-8 rounded outline-none"
            />
            <span className="absolute right-3 top-2 text-[11px] text-[#eaecef]">{selectedMarket.baseAsset}</span>
          </div>

          <div className="flex justify-between gap-1">
            {[25, 50, 75, 100].map((p) => (
              <button
                key={p}
                onClick={() => handlePercentClick(p)}
                className={cn(
                  "flex-1 h-5 text-[9px] font-bold rounded transition-colors",
                  percent === p ? "bg-[#f0b90b]/20 text-[#f0b90b] border border-[#f0b90b]/40" : "bg-[#1e2329] text-[#848e9c] hover:bg-[#2b3139]"
                )}
              >
                {p}%
              </button>
            ))}
          </div>

          <Button 
            className="w-full bg-[#0ecb81] hover:bg-[#0bc079] text-[#161a1e] font-bold h-9 text-[13px] rounded"
            onClick={() => handlePlaceOrder('buy')}
          >
            Buy {selectedMarket.baseAsset}
          </Button>
        </div>

        {/* Sell Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#848e9c] uppercase">Avbl</span>
            <span className="text-[10px] font-bold text-[#eaecef] font-mono">0.00 {selectedMarket.baseAsset}</span>
          </div>
          
          <div className="relative group">
            <span className="absolute left-3 top-2 text-[11px] text-[#848e9c]">Price</span>
            <input 
              type="number"
              value={orderPrice}
              onChange={(e) => setOrderPrice(e.target.value)}
              disabled={orderType === 'market'}
              className="w-full pl-12 pr-12 text-right bg-[#1e2329] border border-transparent focus:border-[#f0b90b] text-[#eaecef] text-[13px] font-mono h-8 rounded outline-none"
            />
            <span className="absolute right-3 top-2 text-[11px] text-[#eaecef]">{selectedMarket.quoteAsset}</span>
          </div>

          <div className="relative group">
            <span className="absolute left-3 top-2 text-[11px] text-[#848e9c]">Amount</span>
            <input 
              type="number"
              value={orderAmount}
              onChange={(e) => setOrderAmount(e.target.value)}
              className="w-full pl-14 pr-12 text-right bg-[#1e2329] border border-transparent focus:border-[#f0b90b] text-[#eaecef] text-[13px] font-mono h-8 rounded outline-none"
            />
            <span className="absolute right-3 top-2 text-[11px] text-[#eaecef]">{selectedMarket.baseAsset}</span>
          </div>

          <div className="flex justify-between gap-1">
            {[25, 50, 75, 100].map((p) => (
              <button
                key={p}
                onClick={() => handlePercentClick(p)}
                className={cn(
                  "flex-1 h-5 text-[9px] font-bold rounded transition-colors",
                  percent === p ? "bg-[#f0b90b]/20 text-[#f0b90b] border border-[#f0b90b]/40" : "bg-[#1e2329] text-[#848e9c] hover:bg-[#2b3139]"
                )}
              >
                {p}%
              </button>
            ))}
          </div>

          <Button 
            className="w-full bg-[#f6465d] hover:bg-[#e03f53] text-[#eaecef] font-bold h-9 text-[13px] rounded"
            onClick={() => handlePlaceOrder('sell')}
          >
            Sell {selectedMarket.baseAsset}
          </Button>
        </div>
      </div>
    </div>
  );
}
