'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Play, TrendingUp, Shield, Zap, Globe } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

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
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl opacity-5"
          style={{ background: 'radial-gradient(circle, #1d6ef5, transparent)' }}
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
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
          transition={{ duration: 0.7, delay: 0.1 }}
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
            Trade crypto & stocks with institutional-grade tools.
          </p>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <Link
            href={user ? '/dashboard' : '/auth/register'}
            className="flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-2xl text-base transition-all duration-200 glow-blue hover:scale-105 group"
          >
            {user ? 'Go to Dashboard' : 'Start Trading'}
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <a
            href="#plans"
            className="flex items-center gap-2 px-8 py-4 glass-strong rounded-2xl text-base font-semibold text-slate-200 hover:text-white hover:bg-white/[0.08] transition-all duration-200"
          >
            <Play size={16} className="text-blue-400" />
            View Plans
          </a>
        </motion.div>

        {/* Stats grid */}
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="glass rounded-2xl p-5 text-center card-hover"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
            >
              <div className="text-2xl sm:text-3xl font-bold gradient-text mb-1">{stat.value}</div>
              <div className="text-xs sm:text-sm text-slate-400">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Trust badges */}
        <motion.div
          className="flex flex-wrap justify-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.5 }}
        >
          {trustBadges.map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="flex items-center gap-2 px-4 py-2 glass rounded-full text-sm text-slate-300"
            >
              <Icon size={14} className="text-blue-400" />
              {text}
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center pt-2">
          <div className="w-1 h-3 rounded-full bg-blue-400 opacity-60" />
        </div>
      </motion.div>
    </section>
  );
}
