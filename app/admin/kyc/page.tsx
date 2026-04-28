'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Check, X, ShieldCheck, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Profile } from '@/types';

async function fetchKYCProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .not('kyc_status', 'is', null)
    .order('updated_at', { ascending: false });
  
  if (error) throw error;
  return data as Profile[];
}

export default function AdminKYCPage() {
  const { data: profiles = [], refetch, isLoading } = useQuery({
    queryKey: ['admin-kyc-profiles'],
    queryFn: fetchKYCProfiles,
  });

  const updateStatus = async (id: string, status: 'verified' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ kyc_status: status })
        .eq('id', id);
        
      if (error) throw error;
      toast.success(`KYC status updated to ${status}`);
      refetch();
    } catch (error) {
      toast.error('Failed to update KYC status');
    }
  };

  const pendingCount = profiles.filter(p => p.kyc_status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="text-blue-500" /> KYC Verification
          </h1>
          <p className="text-slate-400 text-sm mt-1">Review and approve user identity documents</p>
        </div>
        <div className="glass px-4 py-2 rounded-xl border border-white/5 flex items-center gap-3">
          <Clock className="text-amber-400" size={18} />
          <span className="text-sm font-medium text-white">{pendingCount} Pending Reviews</span>
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden border border-white/[0.05]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.05] bg-white/[0.02]">
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase">User</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Country</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Phone</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Submitted</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Status</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">Loading...</td>
                </tr>
              ) : profiles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">No KYC applications found</td>
                </tr>
              ) : (
                profiles.map((profile) => (
                  <tr key={profile.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-white">{profile.full_name}</div>
                      <div className="text-xs text-slate-400">{profile.username}</div>
                    </td>
                    <td className="p-4 text-sm text-slate-300">{profile.country || '-'}</td>
                    <td className="p-4 text-sm text-slate-300">{profile.phone || '-'}</td>
                    <td className="p-4 text-sm text-slate-400">
                      {new Date(profile.updated_at).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        profile.kyc_status === 'verified' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        profile.kyc_status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {profile.kyc_status ? profile.kyc_status.charAt(0).toUpperCase() + profile.kyc_status.slice(1) : 'Unknown'}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {profile.kyc_status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateStatus(profile.id, 'verified')}
                            className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                            title="Approve"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() => updateStatus(profile.id, 'rejected')}
                            className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                            title="Reject"
                          >
                            <X size={16} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
