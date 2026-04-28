'use client';

import { motion } from 'framer-motion';
import { Shield, Zap, ChartBar as BarChart2, Headphones, Globe, Lock } from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: 'Asset-Backed Security',
    desc: 'Every investment is backed by real assets — real estate, commodities, and blue-chip stocks.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    icon: Zap,
    title: 'Daily Profit Payouts',
    desc: 'Receive your returns every 24 hours. No waiting, no delays — profits credited automatically.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: BarChart2,
    title: 'Real-Time Analytics',
    desc: 'Advanced charts and portfolio tracking tools give you full visibility into performance.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
  {
    icon: Headphones,
    title: '24/7 Expert Support',
    desc: 'Round-the-clock support from investment professionals. Always available when you need help.',
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
  },
  {
    icon: Globe,
    title: 'Global Reach',
    desc: 'Operating in 150+ countries with multi-currency support and global payment networks.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
  },
  {
    icon: Lock,
    title: 'Bank-Grade Security',
    desc: '256-bit SSL encryption, two-factor authentication, and cold wallet storage for all assets.',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
  },
];

export function WhyUsSection() {
  return (
    <section id="about" className="py-24 bg-[#040b15]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 glass rounded-full text-sm text-blue-400 border border-blue-500/20 mb-4">
            <Shield size={14} />
            <span>Why Goldcrest Broker</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Built for <span className="gradient-text">Serious Investors</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Industry-leading infrastructure, security, and returns — all in one platform.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className="glass rounded-2xl p-6 card-hover border border-white/[0.05]"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <div className={`w-12 h-12 rounded-2xl ${f.bg} flex items-center justify-center mb-4`}>
                <f.icon size={22} className={f.color} />
              </div>
              <h3 className="font-bold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
