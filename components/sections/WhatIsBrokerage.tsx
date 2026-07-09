'use client';

import { motion } from 'framer-motion';
import { Key, ShieldCheck, BarChart3, Zap, Globe2, Users } from 'lucide-react';

const cards = [
  {
    icon: Key,
    emoji: '🔑',
    title: 'Your VIP Pass to Markets',
    body: "Think of us as your backstage pass to Wall Street. We unlock the doors to global financial markets that were once reserved only for the ultra-wealthy.",
    gradient: 'from-blue-600 to-indigo-700',
    glow: 'shadow-blue-500/30',
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-300',
  },
  {
    icon: ShieldCheck,
    emoji: '🛡️',
    title: 'A Trusted Middleman',
    body: "A broker sits between you and the market — executing your trades, safeguarding your funds, and ensuring every transaction is handled with precision and compliance.",
    gradient: 'from-emerald-600 to-teal-700',
    glow: 'shadow-emerald-500/30',
    iconBg: 'bg-emerald-500/20',
    iconColor: 'text-emerald-300',
  },
  {
    icon: BarChart3,
    emoji: '📈',
    title: 'We Grow Your Money',
    body: "We don't just hold your assets — we actively work them. Our expert-managed investment plans generate returns daily, so your money never sleeps.",
    gradient: 'from-violet-600 to-purple-700',
    glow: 'shadow-violet-500/30',
    iconBg: 'bg-violet-500/20',
    iconColor: 'text-violet-300',
  },
  {
    icon: Globe2,
    emoji: '🌍',
    title: 'Global Market Access',
    body: "From Bitcoin to blue-chip stocks, we give you exposure to diverse asset classes across 150+ countries — all from a single intelligent dashboard.",
    gradient: 'from-amber-600 to-orange-700',
    glow: 'shadow-amber-500/30',
    iconBg: 'bg-amber-500/20',
    iconColor: 'text-amber-300',
  },
  {
    icon: Zap,
    emoji: '⚡',
    title: 'Instant Execution',
    body: "No lag, no delays. Trades are executed in milliseconds using institutional-grade infrastructure that major banks rely on. Speed is your competitive edge.",
    gradient: 'from-cyan-600 to-sky-700',
    glow: 'shadow-cyan-500/30',
    iconBg: 'bg-cyan-500/20',
    iconColor: 'text-cyan-300',
  },
  {
    icon: Users,
    emoji: '🤝',
    title: 'Built for Every Investor',
    body: "First-time saver or seasoned portfolio manager — our platform adapts to your level. We make sophisticated investing simple, intuitive, and genuinely exciting.",
    gradient: 'from-rose-600 to-pink-700',
    glow: 'shadow-rose-500/30',
    iconBg: 'bg-rose-500/20',
    iconColor: 'text-rose-300',
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export function WhatIsBrokerage() {
  return (
    <section id="what-is-brokerage" className="py-28 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-3xl opacity-[0.06]"
          style={{ background: 'radial-gradient(circle, #1d6ef5, transparent)' }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section header */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 glass rounded-full text-sm text-blue-400 border border-blue-500/20 mb-5">
            <span className="text-base">💡</span>
            <span>Understanding Brokerage</span>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-5 leading-tight">
            What is a{' '}
            <span className="gradient-text">Brokerage?</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Demystifying the financial world — one concept at a time. No jargon, no confusion.
            Just clear explanations of how we help your money work harder.
          </p>
        </motion.div>

        {/* Cards grid */}
        <motion.div
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
        >
          {cards.map((card) => (
            <motion.div
              key={card.title}
              variants={cardVariants}
              className={`relative rounded-3xl p-7 overflow-hidden group cursor-default
                bg-gradient-to-br ${card.gradient} shadow-2xl ${card.glow}
                hover:scale-[1.03] hover:shadow-2xl transition-all duration-300`}
              style={{ boxShadow: 'none' }}
              whileHover={{ y: -6 }}
            >
              {/* Noise texture overlay */}
              <div className="absolute inset-0 opacity-[0.08] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuNjUiIG51bU9jdGF2ZXM9IjMiIHN0aXRjaFRpbGVzPSJzdGl0Y2giLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsdGVyPSJ1cmwoI25vaXNlKSIgb3BhY2l0eT0iMSIvPjwvc3ZnPg==')]" />

              {/* Glow orb */}
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-2xl opacity-30 bg-white/30 group-hover:opacity-50 transition-opacity" />

              <div className="relative z-10">
                {/* Icon + emoji */}
                <div className="flex items-center gap-3 mb-5">
                  <div className={`w-12 h-12 rounded-2xl ${card.iconBg} flex items-center justify-center`}>
                    <card.icon size={22} className={card.iconColor} />
                  </div>
                  <span className="text-3xl">{card.emoji}</span>
                </div>

                <h3 className="text-xl font-bold text-white mb-3 leading-snug">{card.title}</h3>
                <p className="text-white/70 text-sm leading-relaxed">{card.body}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA strip */}
        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-slate-500 text-sm">
            Ready to experience brokerage done right?{' '}
            <a href="/auth/register" className="text-blue-400 hover:text-blue-300 font-medium underline underline-offset-4 transition-colors">
              Open a free account in 2 minutes →
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
