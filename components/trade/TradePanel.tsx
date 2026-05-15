'use client';

import React, { useState } from 'react';
import { useTradeStore } from '@/hooks/use-trade-store';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { Loader2, Info } from 'lucide-react';

export function TradePanel() {
  const { selectedMarket, orderPrice, orderAmount, setOrderPrice, setOrderAmount } = useTradeStore();
  const { profile, refreshProfile } = useAuth();
  const [orderType, setOrderType] = useState('limit');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  
  const handlePlaceOrder = async (side: 'buy' | 'sell') => {
    if (!orderAmount || parseFloat(orderAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!profile) return;

    const currentPrice = orderType === 'market' ? selectedMarket.price : parseFloat(orderPrice);
    const totalCost = parseFloat(orderAmount) * currentPrice;
    
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
        metadata: { side, symbol: selectedMarket.symbol, price: currentPrice }
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
      setOrderAmount(calculatedAmount.toFixed(6));
    }
  };

  const currentPrice = orderType === 'market' ? selectedMarket.price : parseFloat(orderPrice);
  const totalValue = (parseFloat(orderAmount || '0') * (currentPrice || 0)).toFixed(2);

  return (
    <div className="flex flex-col h-full bg-[#161a1e] border-t border-[#1e2329] select-none">
      {/* Tabs */}
      <div className="flex h-10 border-b border-[#1e2329]">
        <button 
          onClick={() => setActiveTab('buy')}
          className={cn(
            "flex-1 text-[12px] font-bold transition-all border-b-2",
            activeTab === 'buy' ? "text-[#0ecb81] border-[#0ecb81]" : "text-[#848e9c] border-transparent hover:text-[#eaecef]"
          )}
        >
          Buy
        </button>
        <button 
          onClick={() => setActiveTab('sell')}
          className={cn(
            "flex-1 text-[12px] font-bold transition-all border-b-2",
            activeTab === 'sell' ? "text-[#f6465d] border-[#f6465d]" : "text-[#848e9c] border-transparent hover:text-[#eaecef]"
          )}
        >
          Sell
        </button>
      </div>

      <div className="p-3 space-y-4 flex-1 flex flex-col">
        {/* Order Types */}
        <div className="flex gap-4">
          {['Limit', 'Market'].map((type) => (
            <button 
              key={type}
              onClick={() => setOrderType(type.toLowerCase())}
              className={cn(
                "text-[11px] font-bold transition-colors",
                orderType === type.toLowerCase() ? "text-[#f0b90b]" : "text-[#848e9c] hover:text-[#eaecef]"
              )}
            >
              {type}
            </button>
          ))}
          <button className="text-[11px] font-bold text-[#848e9c] cursor-not-allowed opacity-50 flex items-center gap-1">
            Stop-Limit <Info size={10} />
          </button>
        </div>

        <div className="space-y-3.5 flex-1">
          <div className="flex justify-between text-[11px] font-medium text-[#848e9c]">
            <span>Available</span>
            <span className="text-[#eaecef] font-mono">${profile?.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="space-y-3">
            {/* Price Input */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-[#848e9c] font-medium">Price</span>
              <input 
                type="number"
                value={orderType === 'market' ? selectedMarket.price : orderPrice}
                onChange={(e) => setOrderPrice(e.target.value)}
                disabled={orderType === 'market'}
                className="w-full bg-[#1e2329] hover:bg-[#2b3139] border border-transparent focus:border-[#f0b90b] rounded h-9 pl-14 pr-14 text-right text-[13px] font-mono outline-none text-[#eaecef] disabled:opacity-50 transition-all tabular-nums"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[#eaecef] font-bold">{selectedMarket.quoteAsset}</span>
            </div>

            {/* Amount Input */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-[#848e9c] font-medium">Amount</span>
              <input 
                type="number"
                value={orderAmount}
                onChange={(e) => setOrderAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-[#1e2329] hover:bg-[#2b3139] border border-transparent focus:border-[#f0b90b] rounded h-9 pl-16 pr-14 text-right text-[13px] font-mono outline-none text-[#eaecef] transition-all tabular-nums"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[#eaecef] font-bold">{selectedMarket.baseAsset}</span>
            </div>

            {/* Percent slider replacement buttons */}
            <div className="flex gap-1.5">
              {[25, 50, 75, 100].map((p) => (
                <button
                  key={p}
                  onClick={() => handlePercentClick(p)}
                  className="flex-1 h-5 rounded-sm bg-[#2b3139] text-[10px] font-bold text-[#848e9c] hover:bg-[#474d57] hover:text-[#eaecef] transition-colors"
                >
                  {p}%
                </button>
              ))}
            </div>

            {/* Total Value */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-[#848e9c] font-medium">Total</span>
              <div className="w-full bg-[#1e2329] border border-transparent rounded h-9 flex items-center justify-end pr-14 text-[13px] font-mono text-[#eaecef] opacity-80 tabular-nums">
                {totalValue}
              </div>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[#eaecef] font-bold">{selectedMarket.quoteAsset}</span>
            </div>
          </div>
        </div>

        <button 
          onClick={() => handlePlaceOrder(activeTab)}
          disabled={isSubmitting}
          className={cn(
            "w-full h-10 text-[#161a1e] font-bold text-[14px] rounded transition-all flex items-center justify-center gap-2 shadow-lg",
            activeTab === 'buy' 
              ? "bg-[#0ecb81] hover:bg-[#0bc079] shadow-[#0ecb81]/10" 
              : "bg-[#f6465d] hover:bg-[#e03f53] text-white shadow-[#f6465d]/10"
          )}
        >
          {isSubmitting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            `${activeTab === 'buy' ? 'Buy' : 'Sell'} ${selectedMarket.baseAsset}`
          )}
        </button>
      </div>
    </div>
  );
}

