'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Copy, Share2, Users, DollarSign, Gift, Trophy, Star, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

type Referral = {
  id: string;
  referred_id: string;
  commission_earned: number;
  level: number;
  created_at: string;
  referred_profile: { username: string | null; full_name: string; created_at: string };
};

type LeaderEntry = {
  username: string | null;
  full_name: string;
  referral_earnings: number;
  rank: number;
};

const TIERS = [
  {
    level: '1st',
    label: 'Direct Referral',
    commission: '5–12%',
    desc: 'Earn when your direct invitee invests',
    icon: '🥇',
    color: 'from-amber-500/20 to-amber-600/10',
    border: 'border-amber-500/30',
    textColor: 'text-amber-400',
  },
  {
    level: '2nd',
    label: 'Level 2',
    commission: '3%',
    desc: 'Earn from your referrals\' referrals',
    icon: '🥈',
    color: 'from-slate-500/20 to-slate-600/10',
    border: 'border-slate-500/30',
    textColor: 'text-slate-300',
  },
  {
    level: '3rd',
    label: 'Level 3',
    commission: '1%',
    desc: 'Deep network passive income',
    icon: '🥉',
    color: 'from-orange-700/20 to-orange-800/10',
    border: 'border-orange-700/30',
    textColor: 'text-orange-400',
  },
];

export default function ReferralsPage() {
  const { profile } = useAuth();

  const referralLink = profile?.referral_code
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/register?ref=${profile.referral_code}`
    : '';

  const { data: referrals = [] } = useQuery({
    queryKey: ['referrals', profile?.id],
    queryFn: async (): Promise<Referral[]> => {
      if (!profile?.id) return [];
      const { data } = await supabase
        .from('referrals')
        .select('*, referred_profile:profiles!referred_id(username, full_name, created_at)')
        .eq('referrer_id', profile.id)
        .order('created_at', { ascending: false });
      return (data as Referral[]) ?? [];
    },
    enabled: !!profile?.id,
  });

  const { data: leaderboard = [] } = useQuery({
    queryKey: ['referral-leaderboard'],
    queryFn: async (): Promise<LeaderEntry[]> => {
      const { data } = await supabase
        .from('profiles')
        .select('username, full_name, referral_earnings')
        .gt('referral_earnings', 0)
        .order('referral_earnings', { ascending: false })
        .limit(10);
      return ((data ?? []) as LeaderEntry[]).map((e, i) => ({ ...e, rank: i + 1 }));
    },
  });

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success('Referral link copied!');
  };

  const shareLink = () => {
    if (navigator.share) {
      navigator.share({ title: 'Join Goldcrest Broker', text: 'Invest and earn with me on Goldcrest Broker!', url: referralLink });
    } else {
      copyLink();
    }
  };

  const totalCommission = referrals.reduce((s, r) => s + Number(r.commission_earned), 0);
  const activeReferrals = referrals.length;
  const myRank = leaderboard.findIndex(e => e.username === profile?.username) + 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Users size={24} className="text-blue-400" />
          Referral Program
        </h1>
        <p className="text-slate-400 text-sm mt-1">Earn commissions by inviting friends to invest</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Referrals', value: activeReferrals, icon: Users, color: 'bg-blue-500/10 text-blue-400', display: String(activeReferrals) },
          { label: 'Total Earned', value: Number(profile?.referral_earnings ?? 0), icon: DollarSign, color: 'bg-emerald-500/10 text-emerald-400', display: `$${Number(profile?.referral_earnings ?? 0).toFixed(2)}` },
          { label: 'Your Code', value: 0, icon: Gift, color: 'bg-amber-500/10 text-amber-400', display: profile?.referral_code ?? '—' },
          { label: 'Leaderboard Rank', value: myRank, icon: Trophy, color: 'bg-rose-500/10 text-rose-400', display: myRank > 0 ? `#${myRank}` : '—' },
        ].map((s, i) => (
          <motion.div key={s.label} className="glass rounded-2xl p-5 border border-white/[0.05]" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.color}`}>
                <s.icon size={18} />
              </div>
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">{s.label}</span>
            </div>
            <p className="text-2xl font-bold text-white tracking-wide">{s.display}</p>
          </motion.div>
        ))}
      </div>

      {/* Referral Link */}
      <motion.div className="glass rounded-2xl p-5 border border-white/[0.05]" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Gift size={16} className="text-blue-400" />
          Your Referral Link
        </h2>
        <div className="flex items-center gap-3 bg-white/[0.03] rounded-xl p-3 border border-white/[0.05]">
          <p className="text-sm text-slate-300 flex-1 truncate font-mono">{referralLink || '—'}</p>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={copyLink} className="p-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 transition-colors" title="Copy Link">
              <Copy size={14} />
            </button>
            <button onClick={shareLink} className="p-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 transition-colors" title="Share Link">
              <Share2 size={14} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Commission Tiers */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Star size={16} className="text-amber-400" />
          Commission Structure
        </h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {TIERS.map((tier, i) => (
            <motion.div
              key={tier.level}
              className={`bg-gradient-to-br ${tier.color} rounded-2xl p-5 border ${tier.border} relative overflow-hidden`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 + 0.3 }}
            >
              <div className="text-3xl mb-3">{tier.icon}</div>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">{tier.label}</p>
                  <p className={`text-3xl font-bold ${tier.textColor} mt-1`}>{tier.commission}</p>
                </div>
                <div className={`text-4xl font-black opacity-10 ${tier.textColor}`}>{tier.level}</div>
              </div>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">{tier.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Leaderboard + Referred Users */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Leaderboard */}
        <motion.div className="glass rounded-2xl overflow-hidden border border-white/[0.05]" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <div className="flex items-center gap-2 px-5 py-4 border-b border-white/[0.05]">
            <Trophy size={16} className="text-amber-400" />
            <h2 className="font-semibold text-white">Top Referrers</h2>
          </div>
          {leaderboard.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <Trophy size={32} className="text-slate-700 mb-3" />
              <p className="text-slate-500 text-sm">No leaderboard data yet</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {leaderboard.slice(0, 7).map((entry, i) => {
                const rankColors = ['text-amber-400', 'text-slate-300', 'text-orange-400'];
                const rankEmoji = ['🥇', '🥈', '🥉'];
                const isMe = entry.username === profile?.username;
                return (
                  <div key={i} className={`flex items-center justify-between px-5 py-3 ${isMe ? 'bg-blue-600/10 border-l-2 border-blue-500' : ''}`}>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-bold w-6 text-center ${rankColors[i] ?? 'text-slate-500'}`}>
                        {i < 3 ? rankEmoji[i] : `#${i + 1}`}
                      </span>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-xs font-bold text-white">
                        {(entry.username?.[0] ?? entry.full_name?.[0] ?? 'U').toUpperCase()}
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${isMe ? 'text-blue-400' : 'text-white'}`}>
                          {entry.username ?? entry.full_name ?? 'User'}
                          {isMe && <span className="ml-2 text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded-full">You</span>}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-emerald-400">${Number(entry.referral_earnings).toFixed(2)}</p>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Referred Users */}
        <motion.div className="glass rounded-2xl overflow-hidden border border-white/[0.05]" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="flex items-center gap-2 px-5 py-4 border-b border-white/[0.05]">
            <Users size={16} className="text-blue-400" />
            <h2 className="font-semibold text-white">Your Referred Users</h2>
          </div>
          {referrals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <Users size={32} className="text-slate-700 mb-3" />
              <p className="text-slate-500 text-sm">No referrals yet</p>
              <p className="text-slate-600 text-xs mt-1">Share your link to start earning</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04] overflow-y-auto" style={{ maxHeight: '320px' }}>
              {referrals.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-xs font-bold text-white">
                      {(r.referred_profile?.username?.[0] ?? r.referred_profile?.full_name?.[0] ?? 'U').toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{r.referred_profile?.username ?? r.referred_profile?.full_name ?? 'User'}</p>
                      <p className="text-xs text-slate-500">{new Date(r.created_at).toLocaleDateString()} · Level {r.level}</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-emerald-400">+${Number(r.commission_earned).toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
