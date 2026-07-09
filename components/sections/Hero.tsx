'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Play, TrendingUp, Shield, Zap, Globe, ChevronDown, BarChart2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';

const stats = [
  { value: '$2.4B+', label: 'Assets Under Management' },
  { value: '180K+', label: 'Active Investors' },
  { value: '99.9%', label: 'Uptime SLA' },
  { value: '150%', label: 'Max ROI / Month' },
];

const trustBadges = [
  { icon: Shield, text: 'Asset-Backed' },
  { icon: Zap, text: 'Instant Payouts' },
  { icon: Globe, text: '150+ Countries' },
  { icon: TrendingUp, text: 'Daily Returns' },
];

const LIVE_TICKERS = [
  { symbol: 'BTC', base: 68420, change: 2.34 },
  { symbol: 'ETH', base: 3820, change: 1.87 },
  { symbol: 'SOL', base: 172, change: 3.42 },
  { symbol: 'BNB', base: 608, change: -0.56 },
];

function LivePricePill({ symbol, base, change }: { symbol: string; base: number; change: number }) {
  const [price, setPrice] = useState(base);
  const [dir, setDir] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const delta = (Math.random() - 0.48) * base * 0.0008;
      setPrice(prev => {
        const next = +(prev + delta).toFixed(2);
        setDir(next > prev ? 'up' : 'down');
        return next;
      });
    }, 2000 + Math.random() * 1000);
    return () => clearInterval(interval);
  }, [base]);

  const isPos = change >= 0;

  return (
    <div className="flex items-center gap-2.5 px-4 py-2 glass rounded-full border border-white/[0.08] text-sm">
      <div className={`w-2 h-2 rounded-full ${dir === 'up' ? 'bg-emerald-400' : dir === 'down' ? 'bg-red-400' : 'bg-slate-500'} pulse-dot`} />
      <span className="text-slate-300 font-medium">{symbol}</span>
      <span className="text-white font-bold">${price >= 1000 ? price.toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : price.toFixed(2)}</span>
      <span className={`text-xs font-semibold ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>
        {isPos ? '+' : ''}{change}%
      </span>
    </div>
  );
}

export function Hero() {
  const { user } = useAuth();

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden hero-gradient grid-pattern">
      {/* Animated orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle, #1d6ef5, transparent)' }}
          animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.3, 0.2] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-3xl opacity-15"
          style={{ background: 'radial-gradient(circle, #10d982, transparent)' }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-3xl opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, #1d6ef5, transparent)' }}
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        />
        {/* Floating grid lines */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(29,110,245,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(29,110,245,0.5) 1px, transparent 1px)',
            backgroundSize: '80px 80px',
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 w-full">

        {/* Live market pills */}
        <motion.div
          className="flex flex-wrap justify-center gap-2 mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {LIVE_TICKERS.map(t => (
            <LivePricePill key={t.symbol} {...t} />
          ))}
        </motion.div>

        {/* Status badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex justify-center mb-8"
        >
          <div className="flex items-center gap-2 px-4 py-2 glass rounded-full border border-blue-500/20 text-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot" />
            <span className="text-slate-300">Live markets — platform is fully operational</span>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
        >
          <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight leading-[1.05] mb-6">
            <span className="text-white">Invest Smarter.</span>
            <br />
            <span className="gradient-text">Earn More.</span>
            <br />
            <span className="text-white">Every Day.</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Asset-backed investment plans delivering up to{' '}
            <span className="text-emerald-400 font-semibold">150% ROI</span> monthly.
            Trade crypto &amp; stocks with institutional-grade tools trusted by{' '}
            <span className="text-white font-medium">180,000+ investors</span>.
          </p>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.22 }}
        >
          <Link
            href={user ? '/dashboard' : '/auth/register'}
            className="flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-2xl text-base transition-all duration-200 glow-blue hover:scale-105 group"
          >
            {user ? 'Go to Dashboard' : 'Start Trading Free'}
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <a
            href="#plans"
            className="flex items-center gap-2 px-8 py-4 glass-strong rounded-2xl text-base font-semibold text-slate-200 hover:text-white hover:bg-white/[0.08] transition-all duration-200"
          >
            <Play size={16} className="text-blue-400" />
            View Investment Plans
          </a>
        </motion.div>

        {/* Stats grid */}
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="glass rounded-2xl p-5 text-center card-hover border border-white/[0.06] relative overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              whileHover={{ scale: 1.03 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
              <div className="text-2xl sm:text-3xl font-bold gradient-text mb-1 relative">{stat.value}</div>
              <div className="text-xs sm:text-sm text-slate-400 relative">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Trust badges */}
        <motion.div
          className="flex flex-wrap justify-center gap-3 mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.5 }}
        >
          {trustBadges.map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="flex items-center gap-2 px-4 py-2 glass rounded-full text-sm text-slate-300 border border-white/[0.06] hover:border-blue-500/30 hover:text-white transition-all"
            >
              <Icon size={14} className="text-blue-400" />
              {text}
            </div>
          ))}
        </motion.div>

        {/* Scroll to discover */}
        <motion.div
          className="flex flex-col items-center gap-2 text-slate-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <span className="text-xs uppercase tracking-widest">Discover How It Works</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ChevronDown size={20} />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
