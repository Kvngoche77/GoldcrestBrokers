'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useTradeStore } from '@/hooks/use-trade-store';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Info, AlertTriangle, CheckCircle2, X, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

const PLATFORM_FEE = 0.001; // 0.1%

type OrderType = 'market' | 'limit' | 'stop-limit';
type OrderSide = 'buy' | 'sell';

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatVolUSD(volume: number, price: number): string {
  const val = volume * price;
  if (val >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(1)}B`;
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
  return `$${val.toFixed(0)}`;
}

// ── Confirm Modal ──────────────────────────────────────────────────────────────
interface ConfirmModalProps {
  side: OrderSide;
  symbol: string;
  amount: number;
  price: number;
  total: number;
  fee: number;
  orderType: OrderType;
  stopPrice?: number;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

function ConfirmModal({ side, symbol, amount, price, total, fee, orderType, stopPrice, onConfirm, onCancel, isSubmitting }: ConfirmModalProps) {
  const isBuy = side === 'buy';
  const rows = [
    { label: 'Pair', value: symbol.replace('USDT', '') + '/USDT', className: 'font-bold text-[#eaecef]' },
    { label: 'Type', value: orderType === 'stop-limit' ? 'Stop-Limit Order' : `${orderType.charAt(0).toUpperCase() + orderType.slice(1)} Order`, className: 'text-[#eaecef]' },
    { label: 'Side', value: isBuy ? 'BUY' : 'SELL', className: isBuy ? 'text-[#0ecb81] font-bold' : 'text-[#f6465d] font-bold' },
    ...(orderType === 'stop-limit' && stopPrice ? [{ label: 'Stop Price', value: `$${stopPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, className: 'text-[#f0b90b] font-mono' }] : []),
    { label: 'Limit Price', value: `$${price.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, className: 'text-[#eaecef] font-mono' },
    { label: 'Amount', value: `${amount.toFixed(6)} ${symbol.replace('USDT', '')}`, className: 'text-[#eaecef] font-mono' },
    { label: 'Subtotal', value: `$${total.toFixed(2)}`, className: 'text-[#eaecef] font-mono' },
    { label: 'Fee (0.1%)', value: `-$${fee.toFixed(4)}`, className: 'text-[#848e9c] font-mono' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="bg-[#1e2329] border border-[#2b3139] rounded-xl w-full max-w-sm shadow-2xl"
      >
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

        <div className="p-5 space-y-3">
          {rows.map(({ label, value, className }) => (
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
      </motion.div>
    </div>
  );
}

// ── Order Fill Flash Overlay ───────────────────────────────────────────────────
function OrderFillFlash({ side, baseAsset, amount, received, onDone }: {
  side: OrderSide; baseAsset: string; amount: number; received: number; onDone: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDone, 1800);
    return () => clearTimeout(t);
  }, [onDone]);

  const isBuy = side === 'buy';
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 rounded',
        isBuy ? 'bg-[#0ecb81]/10' : 'bg-[#f6465d]/10'
      )}
    >
      <motion.div
        initial={{ scale: 0.6 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300 }}
        className={cn(
          'w-12 h-12 rounded-full flex items-center justify-center',
          isBuy ? 'bg-[#0ecb81]/20' : 'bg-[#f6465d]/20'
        )}
      >
        {isBuy ? <TrendingUp size={24} className="text-[#0ecb81]" /> : <TrendingDown size={24} className="text-[#f6465d]" />}
      </motion.div>
      <p className={cn('font-bold text-sm', isBuy ? 'text-[#0ecb81]' : 'text-[#f6465d]')}>
        Order Filled ✓
      </p>
      <p className="text-[11px] text-[#848e9c] font-mono">
        {isBuy
          ? `Bought ${amount.toFixed(6)} ${baseAsset}`
          : `+$${received.toFixed(2)} USDT received`
        }
      </p>
    </motion.div>
  );
}

// ── Amount Slider ──────────────────────────────────────────────────────────────
function AmountSlider({ value, onChange }: { value: number; onChange: (pct: number) => void }) {
  return (
    <div className="relative py-1">
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1 appearance-none rounded-full outline-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, #f0b90b ${value}%, #2b3139 ${value}%)`,
        }}
      />
      <style>{`
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px; height: 14px;
          border-radius: 50%;
          background: #f0b90b;
          border: 2px solid #161a1e;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}

// ── Main TradePanel ────────────────────────────────────────────────────────────
export function TradePanel() {
  const { selectedMarket, orderPrice, orderAmount, setOrderPrice, setOrderAmount } = useTradeStore();
  const { profile, refreshProfile } = useAuth();
  const [orderType, setOrderType] = useState<OrderType>('limit');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<OrderSide>('buy');
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingSide, setPendingSide] = useState<OrderSide>('buy');
  const [heldCrypto, setHeldCrypto] = useState(0);
  const [stopPrice, setStopPrice] = useState('');
  const [sliderPct, setSliderPct] = useState(0);
  const [fillFlash, setFillFlash] = useState<{ side: OrderSide; amount: number; received: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const currentPrice = orderType === 'market' ? selectedMarket.price : (parseFloat(orderPrice) || 0);
  const orderAmountNum = parseFloat(orderAmount) || 0;
  const subtotal = orderAmountNum * currentPrice;
  const fee = subtotal * PLATFORM_FEE;
  const totalCost = subtotal + fee;
  const netReceived = subtotal - fee;

  // Balance checks
  const balance = Number(profile?.balance ?? 0);
  const isOverBalance = activeTab === 'buy' && orderAmountNum > 0 && totalCost > balance;
  const isOverHoldings = activeTab === 'sell' && orderAmountNum > heldCrypto;

  // Fetch holdings
  useEffect(() => {
    if (!profile) return;
    const fetchHoldings = async () => {
      const { data, error } = await supabase
        .from('trade_positions')
        .select('quantity')
        .eq('user_id', profile.id)
        .eq('symbol', selectedMarket.symbol)
        .single();
      setHeldCrypto(!error && data ? Number(data.quantity) : 0);
    };
    fetchHoldings();
  }, [profile, selectedMarket.symbol]);

  // Sync limit price when market changes
  useEffect(() => {
    if (orderType !== 'market') {
      setOrderPrice(selectedMarket.price.toFixed(2));
      if (orderType === 'stop-limit') {
        setStopPrice((selectedMarket.price * 0.99).toFixed(2));
      }
    }
  }, [selectedMarket.symbol]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'b' || e.key === 'B') setActiveTab('buy');
      if (e.key === 's' || e.key === 'S') setActiveTab('sell');
      if (e.key === 'm' || e.key === 'M') setOrderType('market');
      if (e.key === 'l' || e.key === 'L') setOrderType('limit');
      if (e.key === 'Escape') setShowConfirm(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Slider → amount
  const handleSliderChange = useCallback((pct: number) => {
    setSliderPct(pct);
    if (!profile || currentPrice <= 0) return;
    if (activeTab === 'buy') {
      const affordableAmount = (balance * (pct / 100)) / (currentPrice * (1 + PLATFORM_FEE));
      setOrderAmount(affordableAmount.toFixed(6));
    } else {
      setOrderAmount((heldCrypto * (pct / 100)).toFixed(6));
    }
  }, [profile, currentPrice, balance, heldCrypto, activeTab, setOrderAmount]);

  // % button click
  const handlePercentClick = (pct: number) => {
    handleSliderChange(pct);
  };

  const handleSubmit = (side: OrderSide) => {
    if (!profile) { toast.error('Please log in to trade'); return; }
    if (!orderAmountNum || orderAmountNum <= 0) { toast.error('Please enter a valid amount'); return; }
    if (currentPrice <= 0) { toast.error('Invalid price'); return; }
    if (side === 'buy' && totalCost > balance) {
      toast.error(`Insufficient balance. Need $${totalCost.toFixed(2)}, have $${balance.toFixed(2)}`);
      return;
    }
    if (side === 'sell' && orderAmountNum > heldCrypto) {
      toast.error(`Insufficient ${selectedMarket.baseAsset}. You hold ${heldCrypto.toFixed(6)}`);
      return;
    }
    if (orderType === 'stop-limit' && (!stopPrice || parseFloat(stopPrice) <= 0)) {
      toast.error('Please enter a valid Stop Price');
      return;
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
      const newBalance = isBuy ? balance - totalCost : balance + netReceived;
      const { error: balErr } = await supabase
        .from('profiles')
        .update({ balance: parseFloat(newBalance.toFixed(8)) })
        .eq('id', profile.id);
      if (balErr) throw balErr;

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
          stop_price: orderType === 'stop-limit' ? parseFloat(stopPrice) : null,
        },
      });
      if (txErr) throw txErr;

      // Upsert position
      const newQuantity = isBuy ? heldCrypto + orderAmountNum : heldCrypto - orderAmountNum;
      if (newQuantity > 0.000001) {
        const newAvgEntry = isBuy
          ? (heldCrypto * (parseFloat(orderPrice) || selectedMarket.price) + orderAmountNum * currentPrice) / (heldCrypto + orderAmountNum)
          : parseFloat(orderPrice) || selectedMarket.price;
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
          ...(orderType === 'stop-limit' && {
            stop_loss: parseFloat(stopPrice) || null,
          }),
        }, { onConflict: 'user_id,symbol' });
      } else {
        await supabase.from('trade_positions').delete()
          .eq('user_id', profile.id).eq('symbol', selectedMarket.symbol);
      }

      // Show fill flash
      setFillFlash({ side, amount: orderAmountNum, received: netReceived });
      setHeldCrypto(Math.max(0, newQuantity));
      setOrderAmount('');
      setSliderPct(0);
      setShowConfirm(false);
      await refreshProfile();
    } catch (err: any) {
      console.error('[TradePanel] executeOrder failed:', err);
      toast.error(err.message || 'Order failed. Please try again.');
      await refreshProfile();
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableDisplay = activeTab === 'buy'
    ? `$${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`
    : `${heldCrypto.toFixed(6)} ${selectedMarket.baseAsset}`;

  const ORDER_TYPES: { key: OrderType; label: string }[] = [
    { key: 'limit', label: 'Limit' },
    { key: 'market', label: 'Market' },
    { key: 'stop-limit', label: 'Stop-Limit' },
  ];

  return (
    <>
      <AnimatePresence>
        {showConfirm && (
          <ConfirmModal
            side={pendingSide}
            symbol={selectedMarket.symbol}
            amount={orderAmountNum}
            price={currentPrice}
            total={subtotal}
            fee={fee}
            orderType={orderType}
            stopPrice={parseFloat(stopPrice) || undefined}
            onConfirm={executeOrder}
            onCancel={() => setShowConfirm(false)}
            isSubmitting={isSubmitting}
          />
        )}
      </AnimatePresence>

      <div ref={panelRef} className="flex flex-col h-full bg-[#161a1e] border-t border-[#1e2329] select-none relative">

        {/* Post-trade flash overlay */}
        <AnimatePresence>
          {fillFlash && (
            <OrderFillFlash
              side={fillFlash.side}
              baseAsset={selectedMarket.baseAsset}
              amount={fillFlash.amount}
              received={fillFlash.received}
              onDone={() => setFillFlash(null)}
            />
          )}
        </AnimatePresence>

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
            Buy <span className="text-[9px] opacity-60 ml-0.5">[B]</span>
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
            Sell <span className="text-[9px] opacity-60 ml-0.5">[S]</span>
          </button>
        </div>

        <div className="p-3 space-y-3 flex-1 flex flex-col overflow-y-auto">
          {/* Order Types */}
          <div className="flex gap-4">
            {ORDER_TYPES.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setOrderType(key)}
                className={cn(
                  'text-[11px] font-bold transition-colors',
                  orderType === key ? 'text-[#f0b90b]' : 'text-[#848e9c] hover:text-[#eaecef]'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Market order slippage warning */}
          {orderType === 'market' && (
            <div className="flex items-start gap-2 px-2.5 py-2 rounded bg-[#f0b90b]/10 border border-[#f0b90b]/20">
              <AlertCircle size={12} className="text-[#f0b90b] flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-[#f0b90b] leading-relaxed">
                Market orders fill at the best available price. Actual execution may differ slightly.
              </p>
            </div>
          )}

          {/* Available */}
          <div className="flex justify-between text-[11px] font-medium text-[#848e9c] bg-[#1e2329] rounded px-3 py-2">
            <span>Available</span>
            <span className="text-[#eaecef] font-mono font-bold">{availableDisplay}</span>
          </div>

          <div className="space-y-2.5 flex-1">
            {/* Stop Price (Stop-Limit only) */}
            {orderType === 'stop-limit' && (
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-[#848e9c] font-medium z-10">Stop</span>
                <input
                  type="number"
                  value={stopPrice}
                  onChange={(e) => setStopPrice(e.target.value)}
                  placeholder="Trigger price"
                  min="0"
                  className="w-full bg-[#1e2329] hover:bg-[#2b3139] border border-[#f0b90b]/30 focus:border-[#f0b90b] rounded h-9 pl-14 pr-16 text-right text-[13px] font-mono outline-none text-[#f0b90b] transition-all tabular-nums"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[#848e9c] font-bold">
                  {selectedMarket.quoteAsset}
                </span>
              </div>
            )}

            {/* Price Input */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-[#848e9c] font-medium z-10">
                {orderType === 'stop-limit' ? 'Limit' : 'Price'}
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
            <div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-[#848e9c] font-medium z-10">Amount</span>
                <input
                  type="number"
                  value={orderAmount}
                  onChange={(e) => { setOrderAmount(e.target.value); setSliderPct(0); }}
                  placeholder="0.00"
                  min="0"
                  className={cn(
                    'w-full bg-[#1e2329] hover:bg-[#2b3139] border rounded h-9 pl-16 pr-16 text-right text-[13px] font-mono outline-none transition-all tabular-nums',
                    isOverBalance || isOverHoldings
                      ? 'border-[#f6465d]/60 text-[#f6465d] focus:border-[#f6465d]'
                      : 'border-transparent focus:border-[#f0b90b] text-[#eaecef]'
                  )}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[#eaecef] font-bold">
                  {selectedMarket.baseAsset}
                </span>
              </div>

              {/* Real-time cost preview */}
              {orderAmountNum > 0 && currentPrice > 0 && (
                <div className={cn(
                  'flex justify-between items-center px-1 mt-1.5 text-[10px]',
                  isOverBalance || isOverHoldings ? 'text-[#f6465d]' : 'text-[#848e9c]'
                )}>
                  {isOverBalance && <span className="flex items-center gap-1"><AlertCircle size={10} />Exceeds balance</span>}
                  {isOverHoldings && <span className="flex items-center gap-1"><AlertCircle size={10} />Exceeds holdings</span>}
                  {!isOverBalance && !isOverHoldings && (
                    <span>
                      {activeTab === 'buy'
                        ? `≈ $${totalCost.toFixed(2)} USDT total cost`
                        : `≈ $${netReceived.toFixed(2)} USDT received`
                      }
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Amount Slider */}
            <AmountSlider value={sliderPct} onChange={handleSliderChange} />

            {/* % Quick Buttons */}
            <div className="flex gap-1">
              {[25, 50, 75, 100].map((p) => (
                <button
                  key={p}
                  onClick={() => handlePercentClick(p)}
                  className={cn(
                    'flex-1 h-6 rounded-sm text-[10px] font-bold transition-colors',
                    sliderPct === p
                      ? 'bg-[#f0b90b]/20 text-[#f0b90b]'
                      : 'bg-[#2b3139] text-[#848e9c] hover:bg-[#474d57] hover:text-[#eaecef]'
                  )}
                >
                  {p}%
                </button>
              ))}
            </div>

            {/* Total */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-[#848e9c] font-medium z-10">Total</span>
              <div className="w-full bg-[#1e2329]/50 border border-[#1e2329] rounded h-9 flex items-center justify-end pr-16 text-[13px] font-mono text-[#eaecef] tabular-nums">
                {subtotal > 0 ? subtotal.toFixed(2) : '0.00'}
              </div>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[#eaecef] font-bold">
                {selectedMarket.quoteAsset}
              </span>
            </div>

            {/* Fee */}
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
