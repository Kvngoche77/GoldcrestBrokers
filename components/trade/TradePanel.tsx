'use client';

import React, { useState } from 'react';
import { useTradeStore } from '@/hooks/use-trade-store';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export function TradePanel() {
  const { selectedMarket, orderPrice, orderAmount, setOrderPrice, setOrderAmount } = useTradeStore();
  const { profile, refreshProfile } = useAuth();
  const [orderType, setOrderType] = useState('limit');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handlePlaceOrder = async (side: 'buy' | 'sell') => {
    if (!orderAmount || parseFloat(orderAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!profile) return;

    const totalCost = parseFloat(orderAmount) * (orderType === 'market' ? selectedMarket.price : parseFloat(orderPrice));
    
    if (side === 'buy' && totalCost > profile.balance) {
      toast.error('Insufficient balance');
      return;
    }

    setIsSubmitting(true);
    try {
      const newBalance = side === 'buy' 
        ? profile.balance - totalCost
        : profile.balance + totalCost;

      const { error } = await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', profile.id);

      if (error) throw error;

      await supabase.from('transactions').insert({
        user_id: profile.id,
        type: 'investment',
        amount: totalCost,
        status: 'completed',
        description: `${side.toUpperCase()} ${selectedMarket.symbol} ${orderType.toUpperCase()} Order`,
        reference: `TRADE-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        metadata: { side, symbol: selectedMarket.symbol, price: orderType === 'market' ? selectedMarket.price : parseFloat(orderPrice) }
      });

      toast.success(`${side === 'buy' ? 'Purchased' : 'Sold'} successfully!`);
      await refreshProfile();
      setOrderAmount('');
    } catch (error) {
      toast.error('Order placement failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePercentClick = (val: number) => {
    if (!profile) return;
    const available = profile.balance;
    const currentPrice = orderType === 'market' ? selectedMarket.price : parseFloat(orderPrice);
    if (currentPrice > 0) {
      const calculatedAmount = (available * (val / 100)) / currentPrice;
      setOrderAmount(calculatedAmount.toFixed(4));
    }
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
            <span className="text-[#eaecef] font-mono">${profile?.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="relative group">
            <span className="absolute left-3 top-2 text-[11px] text-[#848e9c]">Price</span>
            <input 
              type="number"
              value={orderType === 'market' ? selectedMarket.price : orderPrice}
              onChange={(e) => setOrderPrice(e.target.value)}
              disabled={orderType === 'market'}
              className="w-full bg-[#1e2329] border border-transparent focus:border-[#f0b90b] rounded h-8 pl-12 pr-12 text-right text-[13px] font-mono outline-none text-[#eaecef] disabled:opacity-50"
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
            disabled={isSubmitting}
            className="w-full h-9 bg-[#0ecb81] hover:bg-[#0bc079] text-[#161a1e] font-bold text-[14px] rounded transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : `Buy ${selectedMarket.baseAsset}`}
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
              value={orderType === 'market' ? selectedMarket.price : orderPrice}
              onChange={(e) => setOrderPrice(e.target.value)}
              disabled={orderType === 'market'}
              className="w-full bg-[#1e2329] border border-transparent focus:border-[#f0b90b] rounded h-8 pl-12 pr-12 text-right text-[13px] font-mono outline-none text-[#eaecef] disabled:opacity-50"
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
            disabled={isSubmitting}
            className="w-full h-9 bg-[#f6465d] hover:bg-[#e03f53] text-white font-bold text-[14px] rounded transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : `Sell ${selectedMarket.baseAsset}`}
          </button>
        </div>
      </div>
    </div>
  );
}
