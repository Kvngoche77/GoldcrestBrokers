'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, 
  BarChart3, Activity, Clock, Wallet, ArrowRightLeft,
  ChevronDown, Search, Loader2, Info
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

// TradingView Widget Script Loader
const TradingViewWidget = () => {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      "autosize": true,
      "symbol": "BINANCE:BTCUSDT",
      "interval": "D",
      "timezone": "Etc/UTC",
      "theme": "dark",
      "style": "1",
      "locale": "en",
      "enable_publishing": false,
      "allow_symbol_change": true,
      "calendar": false,
      "support_host": "https://www.tradingview.com"
    });
    
    if (container.current) {
      container.current.innerHTML = '';
      container.current.appendChild(script);
    }
  }, []);

  return (
    <div className="tradingview-widget-container h-full w-full" ref={container}>
      <div className="tradingview-widget-container__widget h-full w-full"></div>
    </div>
  );
};

export default function TradePage() {
  const { profile, refreshProfile } = useAuth();
  const [amount, setAmount] = useState('');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [marketPrice, setMarketPrice] = useState(65432.10);
  const [priceChange, setPriceChange] = useState(2.45);

  // Simulate market price fluctuations
  useEffect(() => {
    const interval = setInterval(() => {
      const fluctuation = (Math.random() - 0.5) * 50;
      setMarketPrice(prev => prev + fluctuation);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleTrade = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      return toast.error('Please enter a valid amount');
    }
    
    if (!profile) return;

    if (side === 'buy' && parseFloat(amount) > profile.balance) {
      return toast.error('Insufficient balance');
    }

    setIsSubmitting(true);
    try {
      // Simulate trade execution
      const newBalance = side === 'buy' 
        ? profile.balance - parseFloat(amount)
        : profile.balance + parseFloat(amount);

      const { error } = await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', profile.id);

      if (error) throw error;

      await supabase.from('transactions').insert({
        user_id: profile.id,
        type: 'investment',
        amount: parseFloat(amount),
        status: 'completed',
        description: `${side.toUpperCase()} BTC Market Order`,
        reference: `TRADE-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        metadata: { side, asset: 'BTC', price: marketPrice }
      });

      toast.success(`${side === 'buy' ? 'Purchased' : 'Sold'} successfully!`);
      await refreshProfile();
      setAmount('');
    } catch (error) {
      toast.error('Trade execution failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] gap-3">
      {/* Sleek Ticker Bar */}
      <div className="glass rounded-2xl p-2 px-4 border border-white/5 flex items-center justify-between overflow-x-auto no-scrollbar whitespace-nowrap gap-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#F7931A] flex items-center justify-center text-white font-bold text-[10px]">
              BTC
            </div>
            <span className="font-bold text-white text-sm">BTC/USDT</span>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-emerald-400 font-mono">
              ${marketPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className={`text-[10px] ${priceChange >= 0 ? 'text-emerald-400' : 'text-rose-400'} flex items-center gap-1`}>
              {priceChange >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
              {Math.abs(priceChange)}%
            </span>
          </div>
        </div>

        <div className="h-8 w-px bg-white/10 hidden md:block" />

        <div className="hidden md:flex flex-col">
          <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">24h High</p>
          <p className="text-sm font-bold text-white font-mono">$67,890.00</p>
        </div>

        <div className="hidden md:flex flex-col">
          <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">24h Low</p>
          <p className="text-sm font-bold text-white font-mono">$63,120.50</p>
        </div>

        <div className="hidden lg:flex flex-col">
          <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">24h Volume(BTC)</p>
          <p className="text-sm font-bold text-white font-mono">18,234.50</p>
        </div>

        <div className="hidden lg:flex flex-col">
          <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">24h Volume(USDT)</p>
          <p className="text-sm font-bold text-white font-mono">1.2B</p>
        </div>

        <div className="ml-auto flex items-center gap-3 bg-blue-600/10 border border-blue-500/20 px-4 py-2 rounded-xl">
          <div className="text-right">
            <p className="text-[9px] text-blue-400 uppercase tracking-widest font-bold">Balance</p>
            <p className="text-sm font-bold text-white font-mono">${profile?.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center text-blue-400">
            <Wallet size={16} />
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-3 flex-1 min-h-0">
        {/* Main Chart Area */}
        <div className="flex-[3.5] glass rounded-2xl border border-white/5 overflow-hidden flex flex-col relative group">
          <div className="flex-1 bg-black/40">
            <TradingViewWidget />
          </div>
          
          {/* Overlay for sleek look */}
          <div className="absolute top-4 left-4 pointer-events-none">
            <div className="glass-dark px-3 py-1.5 rounded-lg border border-white/5 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">Live Market</span>
            </div>
          </div>
        </div>

        {/* Trading Panel */}
        <div className="flex-1 glass rounded-2xl border border-white/5 flex flex-col min-w-[320px]">
          <div className="p-4 space-y-5 h-full flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex bg-black/20 rounded-xl p-1 border border-white/5">
                <button 
                  onClick={() => setSide('buy')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${side === 'buy' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-500 hover:text-white'}`}
                >
                  Buy
                </button>
                <button 
                  onClick={() => setSide('sell')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${side === 'sell' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'text-slate-500 hover:text-white'}`}
                >
                  Sell
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Order Type</label>
                  </div>
                  <div className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-slate-300 flex items-center justify-between">
                    <span>Market Order</span>
                    <Info size={12} className="text-slate-600" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Amount (USD)</label>
                    <span className="text-[10px] text-slate-600 font-mono">Bal: ${profile?.balance.toFixed(2)}</span>
                  </div>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                    <input 
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-8 pr-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/60 transition-all font-bold placeholder:text-slate-700"
                    />
                  </div>
                  
                  {/* Quick Percentage Buttons */}
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {[25, 50, 75, 100].map((pct) => (
                      <button
                        key={pct}
                        onClick={() => profile && setAmount(((profile.balance * pct) / 100).toFixed(2))}
                        className="py-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-[9px] font-bold text-slate-500 hover:bg-blue-600/10 hover:text-blue-400 hover:border-blue-500/20 transition-all"
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-black/20 border border-white/5 space-y-2.5">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500 uppercase tracking-wider">Est. Execution</span>
                    <span className="text-white font-mono">{(parseFloat(amount || '0') / marketPrice).toFixed(8)} BTC</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500 uppercase tracking-wider">Fee (0.1%)</span>
                    <span className="text-white font-mono">${(parseFloat(amount || '0') * 0.001).toFixed(2)}</span>
                  </div>
                  <div className="h-px bg-white/5 my-1" />
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400 font-bold uppercase tracking-wider">Total</span>
                    <span className="text-emerald-400 font-bold font-mono">${parseFloat(amount || '0').toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <button 
              onClick={handleTrade}
              disabled={isSubmitting}
              className={`w-full py-4 text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-2xl ${
                side === 'buy' 
                  ? 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/10' 
                  : 'bg-rose-500 hover:bg-rose-400 shadow-rose-500/10'
              }`}
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : (
                <>
                  <ArrowRightLeft size={16} />
                  Place {side === 'buy' ? 'Buy' : 'Sell'} Order
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
