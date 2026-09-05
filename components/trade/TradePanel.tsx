'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useTradeStore } from '@/hooks/use-trade-store';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { Loader2, Info, AlertTriangle, CheckCircle2, X } from 'lucide-react';

const PLATFORM_FEE = 0.001; // 0.1%

type OrderType = 'market' | 'limit';
type OrderSide = 'buy' | 'sell';

interface ConfirmModalProps {
  side: OrderSide;
  symbol: string;
  amount: number;
  price: number;
  total: number;
  fee: number;
  orderType: OrderType;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

function ConfirmModal({ side, symbol, amount, price, total, fee, orderType, onConfirm, onCancel, isSubmitting }: ConfirmModalProps) {
  const isBuy = side === 'buy';
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#1e2329] border border-[#2b3139] rounded-xl w-full max-w-sm shadow-2xl">
        {/* Header */}
        <div className={cn(
          'flex items-center justify-between px-5 py-4 rounded-t-xl',
          isBuy ? 'bg-[#0ecb81]/10 border-b border-[#0ecb81]/20' : 'bg-[#f6465d]/10 border-b border-[#f6465d]/20'
        )}>
          <div className="flex items-center gap-2">
            <AlertTriangle className={cn('h-4 w-4', isBuy ? 'text-[#0ecb81]' : 'text-[#f6465d]')} />
            <span className="font-bold text-[#eaecef] text-sm">
              Confirm {isBuy ? 'Buy' : 'Sell'} Order
            </span>
          </div>
          <button onClick={onCancel} className="text-[#848e9c] hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Details */}
        <div className="p-5 space-y-3">
          {[
            { label: 'Pair', value: symbol.replace('USDT', '') + '/USDT', className: 'font-bold text-[#eaecef]' },
            { label: 'Type', value: `${orderType.charAt(0).toUpperCase() + orderType.slice(1)} Order`, className: 'text-[#eaecef]' },
            { label: 'Side', value: isBuy ? 'BUY' : 'SELL', className: isBuy ? 'text-[#0ecb81] font-bold' : 'text-[#f6465d] font-bold' },
            { label: 'Price', value: `$${price.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, className: 'text-[#eaecef] font-mono' },
            { label: 'Amount', value: `${amount.toFixed(6)} ${symbol.replace('USDT', '')}`, className: 'text-[#eaecef] font-mono' },
            { label: 'Subtotal', value: `$${total.toFixed(2)}`, className: 'text-[#eaecef] font-mono' },
            { label: 'Fee (0.1%)', value: `-$${fee.toFixed(4)}`, className: 'text-[#848e9c] font-mono' },
          ].map(({ label, value, className }) => (
            <div key={label} className="flex justify-between items-center text-sm">
              <span className="text-[#848e9c]">{label}</span>
              <span className={className}>{value}</span>
            </div>
          ))}

          <div className="border-t border-[#2b3139] pt-3 flex justify-between items-center">
            <span className="text-[#eaecef] font-bold text-sm">
              {isBuy ? 'Total Cost' : 'You Receive'}
            </span>
            <span className={cn('font-bold text-base font-mono', isBuy ? 'text-[#f6465d]' : 'text-[#0ecb81]')}>
              ${(total + fee).toFixed(2)} USDT
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 flex gap-3">
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 h-10 border border-[#2b3139] text-[#848e9c] hover:text-white hover:border-[#474d57] rounded font-bold text-sm transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className={cn(
              'flex-1 h-10 rounded font-bold text-sm transition-all flex items-center justify-center gap-2',
              isBuy
                ? 'bg-[#0ecb81] hover:bg-[#0bc079] text-[#161a1e]'
                : 'bg-[#f6465d] hover:bg-[#e03f53] text-white'
            )}
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : `Confirm ${isBuy ? 'Buy' : 'Sell'}`}
          </button>
        </div>
      </div>
    </div>
  );
}

export function TradePanel() {
  const { selectedMarket, orderPrice, orderAmount, setOrderPrice, setOrderAmount } = useTradeStore();
  const { profile, refreshProfile } = useAuth();
  const [orderType, setOrderType] = useState<OrderType>('limit');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<OrderSide>('buy');
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingSide, setPendingSide] = useState<OrderSide>('buy');
  const [heldCrypto, setHeldCrypto] = useState(0);

  const currentPrice = orderType === 'market' ? selectedMarket.price : (parseFloat(orderPrice) || 0);
  const orderAmountNum = parseFloat(orderAmount) || 0;
  const subtotal = orderAmountNum * currentPrice;
  const fee = subtotal * PLATFORM_FEE;
  const totalCost = subtotal + fee; // what is deducted for buys
  const netReceived = subtotal - fee; // what is added for sells

  // Fetch user's held crypto for the selected market
  useEffect(() => {
    if (!profile) return;
    const fetchHoldings = async () => {
      const { data, error } = await supabase
        .from('trade_positions')
        .select('quantity')
        .eq('user_id', profile.id)
        .eq('symbol', selectedMarket.symbol)
        .single();

      if (!error && data) {
        setHeldCrypto(Number(data.quantity));
      } else {
        setHeldCrypto(0);
      }
    };
    fetchHoldings();
  }, [profile, selectedMarket.symbol]);

  // Sync limit price with market price when switching markets
  useEffect(() => {
    if (orderType === 'limit') {
      setOrderPrice(selectedMarket.price.toFixed(2));
    }
  }, [selectedMarket.symbol]);

  const handlePercentClick = (pct: number) => {
    if (!profile) return;
    if (activeTab === 'buy') {
      const available = profile.balance;
      if (currentPrice > 0) {
        const affordableAmount = (available * (pct / 100)) / (currentPrice * (1 + PLATFORM_FEE));
        setOrderAmount(affordableAmount.toFixed(6));
      }
    } else {
      // Sell: pct of held crypto
      const sellAmount = heldCrypto * (pct / 100);
      setOrderAmount(sellAmount.toFixed(6));
    }
  };

  const handleSubmit = (side: OrderSide) => {
    if (!profile) { toast.error('Please log in to trade'); return; }
    if (!orderAmountNum || orderAmountNum <= 0) { toast.error('Please enter a valid amount'); return; }
    if (currentPrice <= 0) { toast.error('Invalid price'); return; }

    if (side === 'buy') {
      if (totalCost > profile.balance) {
        toast.error(`Insufficient USDT balance. Need $${totalCost.toFixed(2)}, have $${profile.balance.toFixed(2)}`);
        return;
      }
    } else {
      if (orderAmountNum > heldCrypto) {
        toast.error(`Insufficient ${selectedMarket.baseAsset}. You hold ${heldCrypto.toFixed(6)}`);
        return;
      }
    }

    setPendingSide(side);
    setShowConfirm(true);
  };

  const executeOrder = async () => {
    if (!profile) return;
    const side = pendingSide;
    const isBuy = side === 'buy';

    setIsSubmitting(true);
    try {
      // 1. Update user balance
      const newBalance = isBuy
        ? profile.balance - totalCost
        : profile.balance + netReceived;

      const { error: balErr } = await supabase
        .from('profiles')
        .update({ balance: parseFloat(newBalance.toFixed(8)) })
        .eq('id', profile.id);

      if (balErr) throw balErr;

      // 2. Record the trade transaction
      const reference = `TRADE-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      const { error: txErr } = await supabase.from('transactions').insert({
        user_id: profile.id,
        type: 'trade',
        amount: parseFloat(subtotal.toFixed(8)),
        status: 'completed',
        description: `${side.toUpperCase()} ${orderAmountNum.toFixed(6)} ${selectedMarket.baseAsset} @ $${currentPrice.toFixed(2)}`,
        reference,
        metadata: {
          side,
          symbol: selectedMarket.symbol,
          base_asset: selectedMarket.baseAsset,
          quote_asset: selectedMarket.quoteAsset,
          price: currentPrice,
          quantity: orderAmountNum,
          fee: parseFloat(fee.toFixed(8)),
          order_type: orderType,
        },
      });

      if (txErr) throw txErr;

      // 3. Upsert trade position (update holdings)
      const newQuantity = isBuy
        ? heldCrypto + orderAmountNum
        : heldCrypto - orderAmountNum;

      if (newQuantity > 0.000001) {
        const newAvgEntry = isBuy
          ? (heldCrypto * (parseFloat(orderPrice) || selectedMarket.price) + orderAmountNum * currentPrice) / (heldCrypto + orderAmountNum)
          : (parseFloat(orderPrice) || selectedMarket.price);

        await supabase.from('trade_positions').upsert({
          user_id: profile.id,
          symbol: selectedMarket.symbol,
          base_asset: selectedMarket.baseAsset,
          quote_asset: selectedMarket.quoteAsset,
          quantity: parseFloat(newQuantity.toFixed(10)),
          avg_entry_price: parseFloat(newAvgEntry.toFixed(8)),
          total_invested: isBuy
            ? (heldCrypto * newAvgEntry) + totalCost
            : Math.max(0, (heldCrypto - orderAmountNum) * newAvgEntry),
        }, { onConflict: 'user_id,symbol' });
      } else {
        // Position fully closed — remove it
        await supabase.from('trade_positions')
          .delete()
          .eq('user_id', profile.id)
          .eq('symbol', selectedMarket.symbol);
      }

      const successMsg = isBuy
        ? `✅ Bought ${orderAmountNum.toFixed(6)} ${selectedMarket.baseAsset} for $${totalCost.toFixed(2)}`
        : `✅ Sold ${orderAmountNum.toFixed(6)} ${selectedMarket.baseAsset} for $${netReceived.toFixed(2)}`;
      toast.success(successMsg, { duration: 4000 });

      setHeldCrypto(Math.max(0, newQuantity));
      setOrderAmount('');
      setShowConfirm(false);
      await refreshProfile();
    } catch (err: any) {
      console.error('[TradePanel] executeOrder failed:', err);
      toast.error(err.message || 'Order failed. Please try again.');
      // Rollback balance if transaction failed mid-way
      await refreshProfile();
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableDisplay = activeTab === 'buy'
    ? `$${(profile?.balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`
    : `${heldCrypto.toFixed(6)} ${selectedMarket.baseAsset}`;

  return (
    <>
      {showConfirm && (
        <ConfirmModal
          side={pendingSide}
          symbol={selectedMarket.symbol}
          amount={orderAmountNum}
          price={currentPrice}
          total={subtotal}
          fee={fee}
          orderType={orderType}
          onConfirm={executeOrder}
          onCancel={() => setShowConfirm(false)}
          isSubmitting={isSubmitting}
        />
      )}

      <div className="flex flex-col h-full bg-[#161a1e] border-t border-[#1e2329] select-none">
        {/* Buy / Sell Tabs */}
        <div className="flex h-10 border-b border-[#1e2329]">
          <button
            onClick={() => setActiveTab('buy')}
            className={cn(
              'flex-1 text-[12px] font-bold transition-all border-b-2',
              activeTab === 'buy'
                ? 'text-[#0ecb81] border-[#0ecb81] bg-[#0ecb81]/5'
                : 'text-[#848e9c] border-transparent hover:text-[#eaecef]'
            )}
          >
            Buy
          </button>
          <button
            onClick={() => setActiveTab('sell')}
            className={cn(
              'flex-1 text-[12px] font-bold transition-all border-b-2',
              activeTab === 'sell'
                ? 'text-[#f6465d] border-[#f6465d] bg-[#f6465d]/5'
                : 'text-[#848e9c] border-transparent hover:text-[#eaecef]'
            )}
          >
            Sell
          </button>
        </div>

        <div className="p-3 space-y-3 flex-1 flex flex-col overflow-y-auto">
          {/* Order Types */}
          <div className="flex gap-4">
            {(['Limit', 'Market'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setOrderType(type.toLowerCase() as OrderType)}
                className={cn(
                  'text-[11px] font-bold transition-colors',
                  orderType === type.toLowerCase()
                    ? 'text-[#f0b90b]'
                    : 'text-[#848e9c] hover:text-[#eaecef]'
                )}
              >
                {type}
              </button>
            ))}
            <div className="flex items-center gap-1 text-[11px] text-[#848e9c] opacity-50 cursor-not-allowed">
              Stop-Limit <Info size={9} />
            </div>
          </div>

          {/* Available balance / holdings */}
          <div className="flex justify-between text-[11px] font-medium text-[#848e9c] bg-[#1e2329] rounded px-3 py-2">
            <span>Available</span>
            <span className="text-[#eaecef] font-mono font-bold">{availableDisplay}</span>
          </div>

          <div className="space-y-2.5 flex-1">
            {/* Price Input */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-[#848e9c] font-medium z-10">
                Price
              </span>
              <input
                type="number"
                value={orderType === 'market' ? selectedMarket.price.toFixed(2) : orderPrice}
                onChange={(e) => setOrderPrice(e.target.value)}
                disabled={orderType === 'market'}
                min="0"
                className="w-full bg-[#1e2329] hover:bg-[#2b3139] border border-transparent focus:border-[#f0b90b] rounded h-9 pl-14 pr-16 text-right text-[13px] font-mono outline-none text-[#eaecef] disabled:opacity-60 transition-all tabular-nums"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[#f0b90b] font-bold">
                {selectedMarket.quoteAsset}
              </span>
            </div>

            {/* Amount Input */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-[#848e9c] font-medium z-10">
                Amount
              </span>
              <input
                type="number"
                value={orderAmount}
                onChange={(e) => setOrderAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                className="w-full bg-[#1e2329] hover:bg-[#2b3139] border border-transparent focus:border-[#f0b90b] rounded h-9 pl-16 pr-16 text-right text-[13px] font-mono outline-none text-[#eaecef] transition-all tabular-nums"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[#eaecef] font-bold">
                {selectedMarket.baseAsset}
              </span>
            </div>

            {/* % Buttons */}
            <div className="flex gap-1">
              {[25, 50, 75, 100].map((p) => (
                <button
                  key={p}
                  onClick={() => handlePercentClick(p)}
                  className="flex-1 h-6 rounded-sm bg-[#2b3139] text-[10px] font-bold text-[#848e9c] hover:bg-[#474d57] hover:text-[#eaecef] transition-colors"
                >
                  {p}%
                </button>
              ))}
            </div>

            {/* Total */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-[#848e9c] font-medium z-10">
                Total
              </span>
              <div className="w-full bg-[#1e2329]/50 border border-[#1e2329] rounded h-9 flex items-center justify-end pr-16 text-[13px] font-mono text-[#eaecef] tabular-nums">
                {subtotal > 0 ? subtotal.toFixed(2) : '0.00'}
              </div>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[#eaecef] font-bold">
                {selectedMarket.quoteAsset}
              </span>
            </div>

            {/* Fee Info */}
            {orderAmountNum > 0 && (
              <div className="flex justify-between text-[10px] text-[#848e9c] px-1">
                <span>Fee (0.1%)</span>
                <span className="font-mono">${fee.toFixed(4)} USDT</span>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            onClick={() => handleSubmit(activeTab)}
            disabled={isSubmitting || !profile}
            className={cn(
              'w-full h-10 font-bold text-[14px] rounded transition-all flex items-center justify-center gap-2 shadow-lg mt-auto',
              activeTab === 'buy'
                ? 'bg-[#0ecb81] hover:bg-[#0bc079] text-[#161a1e] shadow-[#0ecb81]/10'
                : 'bg-[#f6465d] hover:bg-[#e03f53] text-white shadow-[#f6465d]/10',
              (isSubmitting || !profile) && 'opacity-60 cursor-not-allowed'
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
    </>
  );
}
