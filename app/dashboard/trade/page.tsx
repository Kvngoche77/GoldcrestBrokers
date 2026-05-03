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
    <div className="flex flex-col h-[calc(100vh-140px)] gap-4">
      {/* Top Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="glass rounded-2xl p-4 border border-white/5">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">BTC/USDT</p>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-white">${marketPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className={`text-xs ${priceChange >= 0 ? 'text-emerald-400' : 'text-rose-400'} flex items-center`}>
              {priceChange >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {Math.abs(priceChange)}%
            </span>
          </div>
        </div>
        
        <div className="glass rounded-2xl p-4 border border-white/5 hidden md:block">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">24h High</p>
          <p className="text-lg font-bold text-white">$67,890.00</p>
        </div>

        <div className="glass rounded-2xl p-4 border border-white/5 hidden md:block">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">24h Low</p>
          <p className="text-lg font-bold text-white">$63,120.50</p>
        </div>

        <div className="glass rounded-2xl p-4 border border-white/5 hidden lg:block">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">24h Volume</p>
          <p className="text-lg font-bold text-white">1.2B USDT</p>
        </div>

        <div className="glass rounded-2xl p-4 border border-white/5 flex-1 lg:col-span-2 bg-blue-600/5 border-blue-500/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-blue-400/70 uppercase tracking-widest font-bold mb-1">Available Balance</p>
              <p className="text-lg font-bold text-white">${profile?.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-400">
              <Wallet size={20} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
        {/* Main Chart Area */}
        <div className="flex-[3] glass rounded-3xl border border-white/5 overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#F7931A] flex items-center justify-center text-white font-bold text-xs shadow-[0_0_15px_rgba(247,147,26,0.3)]">
                  BTC
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Bitcoin</h3>
                  <p className="text-[10px] text-slate-500">Market Price</p>
                </div>
              </div>
              <div className="h-8 w-px bg-white/5 mx-2" />
              <div className="flex items-center gap-3">
                <button className="text-xs font-medium text-blue-400 border-b-2 border-blue-500 pb-1 px-1">Chart</button>
                <button className="text-xs font-medium text-slate-500 hover:text-white transition-colors pb-1 px-1">Order Book</button>
                <button className="text-xs font-medium text-slate-500 hover:text-white transition-colors pb-1 px-1">History</button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                <Activity size={16} />
              </button>
              <button className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                <BarChart3 size={16} />
              </button>
            </div>
          </div>
          <div className="flex-1 bg-black/20">
            <TradingViewWidget />
          </div>
        </div>

        {/* Trading Panel */}
        <div className="flex-1 glass rounded-3xl border border-white/5 flex flex-col">
          <div className="p-6 space-y-6">
            <div className="flex bg-white/[0.03] rounded-2xl p-1.5 border border-white/5">
              <button 
                onClick={() => setSide('buy')}
                className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${side === 'buy' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >
                Buy
              </button>
              <button 
                onClick={() => setSide('sell')}
                className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${side === 'sell' ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >
                Sell
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-xs font-medium text-slate-400">Order Type</label>
                  <span className="text-[10px] text-blue-400 flex items-center gap-1"><Info size={10} /> Market Price</span>
                </div>
                <button className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white flex items-center justify-between group">
                  <span>Market Execution</span>
                  <ChevronDown size={16} className="text-slate-500 group-hover:text-white transition-colors" />
                </button>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-xs font-medium text-slate-400">Amount (USD)</label>
                  <span className="text-[10px] text-slate-500">Min $10.00</span>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                  <input 
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-8 pr-16 py-3 text-sm text-white focus:outline-none focus:border-blue-500/60 transition-all font-bold"
                  />
                  <button 
                    onClick={() => profile && setAmount(profile.balance.toString())}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-blue-400 hover:text-blue-300 px-2 py-1 bg-blue-500/10 rounded-md"
                  >
                    MAX
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Expected BTC</span>
                  <span className="text-white font-bold">{(parseFloat(amount || '0') / marketPrice).toFixed(8)} BTC</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Transaction Fee</span>
                  <span className="text-white font-bold">$0.00</span>
                </div>
              </div>

              <button 
                onClick={handleTrade}
                disabled={isSubmitting}
                className={`w-full py-4 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xl ${
                  side === 'buy' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : (
                  <>
                    <ArrowRightLeft size={18} />
                    Place {side === 'buy' ? 'Buy' : 'Sell'} Order
                  </>
                )}
              </button>
            </div>

            <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 flex gap-3">
              <Info size={20} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-500/90 leading-relaxed">
                Please note: This is a simulated trading environment. Orders are executed instantly at market price for practice purposes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
