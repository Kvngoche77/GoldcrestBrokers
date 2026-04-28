'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Users, ArrowRight, Gift, Copy, Share2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

const levels = [
  { level: 1, label: 'Direct Referral', commission: '5–12%', icon: '1st', desc: 'Earn when your direct referrals invest' },
  { level: 2, label: 'Level 2', commission: '3%', icon: '2nd', desc: 'Earn from referrals of your referrals' },
  { level: 3, label: 'Level 3', commission: '1%', icon: '3rd', desc: 'Three-tier passive income stream' },
];

export function ReferralSection() {
  const { user, profile } = useAuth();

  const referralLink = profile?.referral_code
    ? `${typeof window !== 'undefined' ? window.location.origin : 'https://goldcrestbroker.com'}/auth/register?ref=${profile.referral_code}`
    : '';

  const copyLink = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      toast.success('Referral link copied!');
    }
  };

  return (
    <section id="referral" className="py-24 bg-[#040b15]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left side */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 glass rounded-full text-sm text-emerald-400 border border-emerald-500/20 mb-5">
              <Users size={14} />
              <span>Referral Program</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-5">
              Earn While Your <span className="gradient-text">Network Grows</span>
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed mb-8">
              Share your unique referral link and earn commissions on up to 3 levels of investments.
              The more you share, the more you earn — completely passively.
            </p>

            {/* Commission levels */}
            <div className="space-y-4 mb-8">
              {levels.map((l, i) => (
                <motion.div
                  key={l.level}
                  className="flex items-center gap-4 p-4 glass rounded-xl border border-white/[0.05] hover:border-emerald-500/20 transition-all"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-sm font-bold text-emerald-400 flex-shrink-0">
                    {l.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">{l.label}</p>
                    <p className="text-xs text-slate-400">{l.desc}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-emerald-400">{l.commission}</p>
                    <p className="text-xs text-slate-500">commission</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {!user && (
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all glow-blue group"
              >
                Join & Start Earning
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
          </motion.div>

          {/* Right side — referral card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="glass-strong rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-600/20 flex items-center justify-center">
                  <Gift size={24} className="text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">Your Referral Hub</h3>
                  <p className="text-sm text-slate-400">Share and earn commissions</p>
                </div>
              </div>

              {user && profile ? (
                <>
                  <div className="bg-white/[0.03] rounded-xl p-4 mb-4 border border-white/[0.05]">
                    <p className="text-xs text-slate-400 mb-1">Your Referral Code</p>
                    <p className="text-2xl font-bold text-white tracking-widest">{profile.referral_code}</p>
                  </div>
                  <div className="flex items-center gap-2 bg-white/[0.03] rounded-xl p-3 mb-5 border border-white/[0.05]">
                    <p className="text-xs text-slate-400 flex-1 truncate">{referralLink}</p>
                    <button onClick={copyLink} className="p-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 transition-colors flex-shrink-0">
                      <Copy size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="bg-white/[0.03] rounded-xl p-4 text-center border border-white/[0.05]">
                      <p className="text-2xl font-bold text-white">0</p>
                      <p className="text-xs text-slate-400">Total Referrals</p>
                    </div>
                    <div className="bg-white/[0.03] rounded-xl p-4 text-center border border-white/[0.05]">
                      <p className="text-2xl font-bold text-emerald-400">${Number(profile.referral_earnings).toFixed(2)}</p>
                      <p className="text-xs text-slate-400">Earnings</p>
                    </div>
                  </div>
                  <button
                    onClick={copyLink}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 glow-blue"
                  >
                    <Share2 size={16} /> Share Referral Link
                  </button>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="bg-white/[0.03] rounded-xl p-5 text-center border border-white/[0.05]">
                    <p className="text-5xl font-bold gradient-text mb-1">$500+</p>
                    <p className="text-sm text-slate-400">Average monthly referral earnings</p>
                  </div>
                  <p className="text-sm text-slate-400 text-center">
                    Register to get your unique referral code and start earning commissions instantly.
                  </p>
                  <Link
                    href="/auth/register"
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 glow-blue"
                  >
                    <Gift size={16} /> Get Your Referral Link
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
