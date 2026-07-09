'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { UserPlus, Wallet, TrendingUp, BarChart2, DollarSign, Repeat } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: UserPlus,
    title: 'Create Your Account',
    body: 'Sign up in under 2 minutes. No paperwork mountains, no confusing forms — just your email and you\'re in.',
    detail: 'KYC verification in 24h · Free to join',
    color: 'from-blue-600 to-blue-800',
    dotColor: 'bg-blue-500',
    textAccent: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    bgLight: 'bg-blue-500/10',
    emoji: '👤',
  },
  {
    number: '02',
    icon: Wallet,
    title: 'Fund Your Wallet',
    body: 'Deposit using crypto, bank transfer, or card. Funds are credited instantly so you can start immediately.',
    detail: 'BTC · ETH · USDT · Bank Wire',
    color: 'from-violet-600 to-purple-800',
    dotColor: 'bg-violet-500',
    textAccent: 'text-violet-400',
    borderColor: 'border-violet-500/30',
    bgLight: 'bg-violet-500/10',
    emoji: '💰',
  },
  {
    number: '03',
    icon: TrendingUp,
    title: 'Choose an Investment Plan',
    body: 'Pick a plan that matches your goals — from beginner-friendly Starter plans to high-yield VIP tiers for serious capital.',
    detail: 'From $500 · Up to 960% total ROI',
    color: 'from-emerald-600 to-green-800',
    dotColor: 'bg-emerald-500',
    textAccent: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    bgLight: 'bg-emerald-500/10',
    emoji: '🚀',
  },
  {
    number: '04',
    icon: BarChart2,
    title: 'Track Performance Live',
    body: 'Watch your portfolio grow in real-time. Advanced charts, live P&L, and market signals keep you always in the know.',
    detail: 'Real-time charts · Professional analytics',
    color: 'from-amber-600 to-orange-800',
    dotColor: 'bg-amber-500',
    textAccent: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    bgLight: 'bg-amber-500/10',
    emoji: '📊',
  },
  {
    number: '05',
    icon: DollarSign,
    title: 'Profits Land Daily',
    body: 'Your returns hit your account every 24 hours, automatically. No manual claiming, no lock-up period surprises.',
    detail: 'Daily credits · Compounding available',
    color: 'from-cyan-600 to-sky-800',
    dotColor: 'bg-cyan-500',
    textAccent: 'text-cyan-400',
    borderColor: 'border-cyan-500/30',
    bgLight: 'bg-cyan-500/10',
    emoji: '💸',
  },
  {
    number: '06',
    icon: Repeat,
    title: 'Withdraw or Reinvest',
    body: 'Cash out to your wallet any time, or reinvest your profits to compound your gains and reach your financial goals faster.',
    detail: 'Instant withdrawals · Auto-compounding',
    color: 'from-rose-600 to-red-800',
    dotColor: 'bg-rose-500',
    textAccent: 'text-rose-400',
    borderColor: 'border-rose-500/30',
    bgLight: 'bg-rose-500/10',
    emoji: '🔄',
  },
];

function StepCard({ step, index }: { step: (typeof steps)[0]; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: index % 2 === 0 ? -40 : 40, y: 20 }}
      animate={inView ? { opacity: 1, x: 0, y: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.08, ease: 'easeOut' }}
      className={`relative flex gap-5 group`}
    >
      {/* Number block */}
      <div className="flex-shrink-0 flex flex-col items-center">
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg text-white font-black text-lg`}>
          {step.number}
        </div>
        {/* Vertical connector */}
        {index < steps.length - 1 && (
          <motion.div
            className={`w-0.5 flex-1 mt-3 ${step.dotColor} opacity-30`}
            initial={{ scaleY: 0 }}
            animate={inView ? { scaleY: 1 } : {}}
            transition={{ duration: 0.6, delay: index * 0.08 + 0.3, ease: 'easeOut' }}
            style={{ transformOrigin: 'top' }}
          />
        )}
      </div>

      {/* Card content */}
      <div className={`flex-1 glass rounded-3xl p-6 border ${step.borderColor} mb-6 
        hover:border-opacity-80 hover:translate-y-[-4px] transition-all duration-300 group-hover:shadow-xl`}>
        <div className="flex items-start gap-4">
          <div className={`w-11 h-11 rounded-xl ${step.bgLight} flex items-center justify-center flex-shrink-0`}>
            <step.icon size={20} className={step.textAccent} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
              <h3 className="text-white font-bold text-base">{step.title}</h3>
              <span className="text-2xl">{step.emoji}</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-3">{step.body}</p>
            <div className={`inline-flex items-center gap-1.5 text-xs font-medium ${step.textAccent} ${step.bgLight} px-3 py-1.5 rounded-full`}>
              {step.detail}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function HowInvestingWorks() {
  return (
    <section id="how-it-works" className="py-28 bg-[#040b15] relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute right-0 top-1/3 w-[500px] h-[500px] rounded-full blur-3xl opacity-[0.05]"
          style={{ background: 'radial-gradient(circle, #10d982, transparent)' }}
        />
        <div
          className="absolute left-0 bottom-1/4 w-[400px] h-[400px] rounded-full blur-3xl opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, #1d6ef5, transparent)' }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 glass rounded-full text-sm text-emerald-400 border border-emerald-500/20 mb-5">
            <span className="text-base">🗺️</span>
            <span>Your Investment Journey</span>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-5 leading-tight">
            How{' '}
            <span style={{
              background: 'linear-gradient(135deg, #10d982, #34d399)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>Investing Works</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Six simple steps from zero to growing — we've removed all the complexity so you can focus on what matters: watching your wealth grow.
          </p>
        </motion.div>

        {/* Two-column step layout */}
        <div className="grid lg:grid-cols-2 gap-x-12 gap-y-0">
          {/* Left column (steps 1, 3, 5) */}
          <div>
            {steps.filter((_, i) => i % 2 === 0).map((step, i) => (
              <StepCard key={step.number} step={step} index={i * 2} />
            ))}
          </div>
          {/* Right column (steps 2, 4, 6) — offset on desktop */}
          <div className="lg:mt-12">
            {steps.filter((_, i) => i % 2 !== 0).map((step, i) => (
              <StepCard key={step.number} step={step} index={i * 2 + 1} />
            ))}
          </div>
        </div>

        {/* Bottom motivational strip */}
        <motion.div
          className="mt-16 glass rounded-3xl p-8 border border-emerald-500/20 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className="text-4xl mb-4">🎯</div>
          <h3 className="text-xl font-bold text-white mb-2">Your first profit in 24 hours. Guaranteed.</h3>
          <p className="text-slate-400 text-sm max-w-lg mx-auto mb-6">
            Once your investment plan activates, your first daily return is credited within 24 hours. No minimum lock-up, no vague timelines — just reliable, transparent returns.
          </p>
          <a
            href="/auth/register"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-2xl transition-all duration-200 hover:scale-105"
            style={{ boxShadow: '0 0 24px rgba(16,217,130,0.25)' }}
          >
            Start Earning Today →
          </a>
        </motion.div>
      </div>
    </section>
  );
}
