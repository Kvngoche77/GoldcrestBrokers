'use client';

import React, { useState } from 'react';
import { useTradeStore } from '@/hooks/use-trade-store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function TradePanel() {
  const { selectedMarket, orderPrice, orderAmount, setOrderPrice, setOrderAmount } = useTradeStore();
  const [orderType, setOrderType] = useState('limit');
  
  const handlePlaceOrder = (side: 'buy' | 'sell') => {
    if (!orderAmount || parseFloat(orderAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    toast.success(`${side.toUpperCase()} order placed successfully`, {
      description: `${orderAmount} ${selectedMarket.baseAsset} at ${orderPrice} ${selectedMarket.quoteAsset}`,
    });
    setOrderAmount('');
  };

  const handlePercentClick = (val: number) => {
    const mockBalance = 10000;
    const calculatedAmount = (mockBalance * (val / 100)) / parseFloat(orderPrice);
    setOrderAmount(calculatedAmount.toFixed(4));
  };

  return (
    <div className="flex flex-col h-full bg-[#161a1e] p-3 border-t border-[#1e2329] select-none">
      <div className="flex gap-4 mb-4">
        {['Limit', 'Market', 'Stop-Limit'].map((type) => (
          <button 
            key={type}
            onClick={() => setOrderType(type.toLowerCase())}
            className={cn(
              "text-[12px] font-bold transition-colors",
              orderType === type.toLowerCase() ? "text-[#f0b90b]" : "text-[#848e9c] hover:text-[#eaecef]"
            )}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Buy Side */}
        <div className="space-y-3">
          <div className="flex justify-between text-[11px] font-medium text-[#848e9c]">
            <span>Avbl</span>
            <span className="text-[#eaecef] font-mono">10,000.00 USDT</span>
          </div>

          <div className="relative group">
            <span className="absolute left-3 top-2 text-[11px] text-[#848e9c]">Price</span>
            <input 
              type="number"
              value={orderPrice}
              onChange={(e) => setOrderPrice(e.target.value)}
              disabled={orderType === 'market'}
              className="w-full bg-[#1e2329] border border-transparent focus:border-[#f0b90b] rounded h-8 pl-12 pr-12 text-right text-[13px] font-mono outline-none text-[#eaecef]"
            />
            <span className="absolute right-3 top-2 text-[11px] text-[#eaecef]">{selectedMarket.quoteAsset}</span>
          </div>

          <div className="relative group">
            <span className="absolute left-3 top-2 text-[11px] text-[#848e9c]">Amount</span>
            <input 
              type="number"
              value={orderAmount}
              onChange={(e) => setOrderAmount(e.target.value)}
              className="w-full bg-[#1e2329] border border-transparent focus:border-[#f0b90b] rounded h-8 pl-16 pr-12 text-right text-[13px] font-mono outline-none text-[#eaecef]"
            />
            <span className="absolute right-3 top-2 text-[11px] text-[#eaecef]">{selectedMarket.baseAsset}</span>
          </div>

          <div className="flex gap-1 justify-between">
            {[25, 50, 75, 100].map((p) => (
              <button
                key={p}
                onClick={() => handlePercentClick(p)}
                className="flex-1 h-5 rounded bg-[#1e2329] text-[10px] font-bold text-[#848e9c] hover:bg-[#2b3139] hover:text-[#eaecef] transition-colors"
              >
                {p}%
              </button>
            ))}
          </div>

          <button 
            onClick={() => handlePlaceOrder('buy')}
            className="w-full h-9 bg-[#0ecb81] hover:bg-[#0bc079] text-[#161a1e] font-bold text-[14px] rounded transition-colors"
          >
            Buy {selectedMarket.baseAsset}
          </button>
        </div>

        {/* Sell Side */}
        <div className="space-y-3">
          <div className="flex justify-between text-[11px] font-medium text-[#848e9c]">
            <span>Avbl</span>
            <span className="text-[#eaecef] font-mono">0.00 {selectedMarket.baseAsset}</span>
          </div>

          <div className="relative group">
            <span className="absolute left-3 top-2 text-[11px] text-[#848e9c]">Price</span>
            <input 
              type="number"
              value={orderPrice}
              onChange={(e) => setOrderPrice(e.target.value)}
              disabled={orderType === 'market'}
              className="w-full bg-[#1e2329] border border-transparent focus:border-[#f0b90b] rounded h-8 pl-12 pr-12 text-right text-[13px] font-mono outline-none text-[#eaecef]"
            />
            <span className="absolute right-3 top-2 text-[11px] text-[#eaecef]">{selectedMarket.quoteAsset}</span>
          </div>

          <div className="relative group">
            <span className="absolute left-3 top-2 text-[11px] text-[#848e9c]">Amount</span>
            <input 
              type="number"
              value={orderAmount}
              onChange={(e) => setOrderAmount(e.target.value)}
              className="w-full bg-[#1e2329] border border-transparent focus:border-[#f0b90b] rounded h-8 pl-16 pr-12 text-right text-[13px] font-mono outline-none text-[#eaecef]"
            />
            <span className="absolute right-3 top-2 text-[11px] text-[#eaecef]">{selectedMarket.baseAsset}</span>
          </div>

          <div className="flex gap-1 justify-between">
            {[25, 50, 75, 100].map((p) => (
              <button
                key={p}
                onClick={() => handlePercentClick(p)}
                className="flex-1 h-5 rounded bg-[#1e2329] text-[10px] font-bold text-[#848e9c] hover:bg-[#2b3139] hover:text-[#eaecef] transition-colors"
              >
                {p}%
              </button>
            ))}
          </div>

          <button 
            onClick={() => handlePlaceOrder('sell')}
            className="w-full h-9 bg-[#f6465d] hover:bg-[#e03f53] text-white font-bold text-[14px] rounded transition-colors"
          >
            Sell {selectedMarket.baseAsset}
          </button>
        </div>
      </div>
    </div>
  );
}
