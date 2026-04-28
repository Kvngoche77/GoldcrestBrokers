'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Copy, Share2, Users, DollarSign, Gift } from 'lucide-react';
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Referral Program</h1>
        <p className="text-slate-400 text-sm mt-1">Earn commissions by inviting friends to invest</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div className="glass rounded-2xl p-5 border border-white/[0.05]" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center"><Users size={18} className="text-blue-400" /></div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Referrals</span>
          </div>
          <p className="text-3xl font-bold text-white">{referrals.length}</p>
        </motion.div>
        <motion.div className="glass rounded-2xl p-5 border border-white/[0.05]" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center"><DollarSign size={18} className="text-emerald-400" /></div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Earned</span>
          </div>
          <p className="text-3xl font-bold text-emerald-400">${Number(profile?.referral_earnings ?? 0).toFixed(2)}</p>
        </motion.div>
        <motion.div className="glass rounded-2xl p-5 border border-white/[0.05]" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center"><Gift size={18} className="text-amber-400" /></div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Your Code</span>
          </div>
          <p className="text-2xl font-bold text-amber-400 tracking-widest">{profile?.referral_code ?? '—'}</p>
        </motion.div>
      </div>

      {/* Referral link */}
      <div className="glass rounded-2xl p-5">
        <h2 className="font-semibold text-white mb-4">Your Referral Link</h2>
        <div className="flex items-center gap-3 bg-white/[0.03] rounded-xl p-3 border border-white/[0.05]">
          <p className="text-sm text-slate-300 flex-1 truncate font-mono">{referralLink || '—'}</p>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={copyLink} className="p-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 transition-colors">
              <Copy size={14} />
            </button>
            <button onClick={shareLink} className="p-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 transition-colors">
              <Share2 size={14} />
            </button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            { level: '1st', commission: '5–12%', desc: 'Direct referrals' },
            { level: '2nd', commission: '3%', desc: 'Level 2' },
            { level: '3rd', commission: '1%', desc: 'Level 3' },
          ].map((l) => (
            <div key={l.level} className="bg-white/[0.02] rounded-xl p-3 text-center border border-white/[0.04]">
              <p className="text-lg font-bold text-emerald-400">{l.commission}</p>
              <p className="text-xs text-slate-400">{l.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Referral list */}
      {referrals.length > 0 && (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.05]">
            <h2 className="font-semibold text-white">Referred Users</h2>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {referrals.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-xs font-bold text-white">
                    {(r.referred_profile?.username?.[0] ?? r.referred_profile?.full_name?.[0] ?? 'U').toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{r.referred_profile?.username ?? r.referred_profile?.full_name ?? 'User'}</p>
                    <p className="text-xs text-slate-500">{new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-emerald-400">+${r.commission_earned.toFixed(2)}</p>
                  <p className="text-xs text-slate-500">Level {r.level}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
