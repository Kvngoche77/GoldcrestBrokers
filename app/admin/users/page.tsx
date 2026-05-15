'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, Shield, UserX, DollarSign, CreditCard as Edit2, Check, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import type { Profile } from '@/types';

async function fetchUsers(): Promise<Profile[]> {
  const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
  return (data as Profile[]) ?? [];
}

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [creditModalUser, setCreditModalUser] = useState<Profile | null>(null);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditDescription, setCreditDescription] = useState('Manual balance update');
  const [updateMode, setUpdateMode] = useState<'add' | 'set'>('add');

  const { data: users = [], isLoading } = useQuery({ queryKey: ['admin-users'], queryFn: fetchUsers });

  const toggleAdminMutation = useMutation({
    mutationFn: async ({ id, is_admin }: { id: string; is_admin: boolean }) => {
      await supabase.from('profiles').update({ is_admin: !is_admin }).eq('id', id);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-users'] }); toast.success('Admin status updated'); },
  });

  const updateBalanceMutation = useMutation({
    mutationFn: async ({ user, amount, description, mode }: { user: Profile; amount: number; description: string; mode: 'add' | 'set' }) => {
      const newBalance = mode === 'add' ? user.balance + amount : amount;
      const diff = mode === 'add' ? amount : amount - user.balance;
      
      // Update balance
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', user.id);
        
      if (profileError) throw profileError;
      
      // Create transaction record
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: diff >= 0 ? 'deposit' : 'withdrawal',
          amount: Math.abs(diff),
          status: 'completed',
          description: description || `Manual balance ${mode === 'add' ? 'credit' : 'update'} by admin`,
          reference: `ADMN-${Date.now()}`,
          metadata: { is_manual: true, update_mode: mode, prev_balance: user.balance, new_balance: newBalance }
        });
        
      if (txError) throw txError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setCreditModalUser(null);
      setCreditAmount('');
      toast.success('Balance updated successfully');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update balance');
    }
  });

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.username?.toLowerCase().includes(q) || u.full_name?.toLowerCase().includes(q) || u.referral_code?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-slate-400 text-sm mt-1">{users.length} registered users</p>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." className="bg-white/[0.04] border border-white/10 rounded-xl pl-8 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 w-64" />
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.05]">
                <th className="text-left py-4 px-5 text-xs text-slate-400 uppercase tracking-wider font-semibold">User</th>
                <th className="text-right py-4 px-5 text-xs text-slate-400 uppercase tracking-wider font-semibold">Balance</th>
                <th className="text-right py-4 px-5 text-xs text-slate-400 uppercase tracking-wider font-semibold hidden md:table-cell">Deposited</th>
                <th className="text-right py-4 px-5 text-xs text-slate-400 uppercase tracking-wider font-semibold hidden lg:table-cell">Profit</th>
                <th className="text-center py-4 px-5 text-xs text-slate-400 uppercase tracking-wider font-semibold hidden sm:table-cell">KYC</th>
                <th className="text-center py-4 px-5 text-xs text-slate-400 uppercase tracking-wider font-semibold">Role</th>
                <th className="text-right py-4 px-5 text-xs text-slate-400 uppercase tracking-wider font-semibold hidden sm:table-cell">Joined</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/[0.04]">
                    {[0,1,2,3,4,5].map(j => <td key={j} className="py-4 px-5"><div className="shimmer h-4 rounded w-20" /></td>)}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-16 text-center text-slate-400 text-sm">No users found</td></tr>
              ) : filtered.map((user, i) => (
                <motion.tr key={user.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                        {(user.username?.[0] ?? user.full_name?.[0] ?? 'U').toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{user.username ?? 'No username'}</p>
                        <p className="text-xs text-slate-500">{user.full_name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <button
                      onClick={() => { setCreditModalUser(user); setCreditAmount(''); setCreditDescription('Manual balance update'); setUpdateMode('add'); }}
                      className="text-sm font-semibold text-white hover:text-blue-400 transition-colors group flex items-center justify-end gap-1 ml-auto"
                    >
                      ${Number(user.balance).toFixed(2)}
                      <Edit2 size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </td>
                  <td className="py-3.5 px-5 text-right hidden md:table-cell">
                    <span className="text-sm text-slate-300">${Number(user.total_deposited).toFixed(2)}</span>
                  </td>
                  <td className="py-3.5 px-5 text-right hidden lg:table-cell">
                    <span className="text-sm text-emerald-400">${Number(user.total_profit).toFixed(2)}</span>
                  </td>
                  <td className="py-3.5 px-5 text-center hidden sm:table-cell">
                    <span className={user.kyc_status === 'verified' ? 'badge-success' : user.kyc_status === 'rejected' ? 'badge-danger' : 'badge-pending'}>
                      {user.kyc_status}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-center">
                    <button
                      onClick={() => toggleAdminMutation.mutate({ id: user.id, is_admin: user.is_admin })}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all mx-auto ${user.is_admin ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-slate-500/10 text-slate-400 hover:bg-blue-500/10 hover:text-blue-400'}`}
                    >
                      {user.is_admin ? <><Shield size={10} /> Admin</> : 'User'}
                    </button>
                  </td>
                  <td className="py-3.5 px-5 text-right hidden sm:table-cell">
                    <span className="text-xs text-slate-400">{new Date(user.created_at).toLocaleDateString()}</span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Credit Modal */}
      {creditModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#060d1a] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl"
          >
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-white">Credit Balance</h3>
              <button onClick={() => setCreditModalUser(null)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-slate-300">Crediting user: <span className="font-semibold text-white">{creditModalUser.username || creditModalUser.full_name}</span></p>
              <p className="text-sm text-slate-300">Current balance: <span className="font-semibold text-white">${Number(creditModalUser.balance).toFixed(2)}</span></p>
            </div>

            <div className="space-y-4">
              <div className="flex p-1 bg-white/[0.03] rounded-xl border border-white/10">
                <button
                  onClick={() => setUpdateMode('add')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${updateMode === 'add' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white'}`}
                >
                  Add to Balance
                </button>
                <button
                  onClick={() => setUpdateMode('set')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${updateMode === 'set' ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20' : 'text-slate-400 hover:text-white'}`}
                >
                  Set Absolute Balance
                </button>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">
                  {updateMode === 'add' ? 'Amount to Add (USD)' : 'New Total Balance (USD)'}
                </label>
                <div className="relative">
                  <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="number"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    placeholder={updateMode === 'add' ? "100.00" : creditModalUser.balance.toString()}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-8 pr-4 py-3 text-sm text-white focus:border-blue-500/50 focus:outline-none"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Description</label>
                <input
                  type="text"
                  value={creditDescription}
                  onChange={(e) => setCreditDescription(e.target.value)}
                  placeholder="e.g. Manual correction"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500/50 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  onClick={() => setCreditModalUser(null)}
                  className="flex-1 py-3 bg-white/[0.05] hover:bg-white/[0.1] text-white rounded-xl transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => updateBalanceMutation.mutate({ user: creditModalUser, amount: Number(creditAmount), description: creditDescription, mode: updateMode })}
                  disabled={!creditAmount || (updateMode === 'add' && Number(creditAmount) <= 0) || updateBalanceMutation.isPending}
                  className={`flex-1 py-3 ${updateMode === 'add' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-amber-600 hover:bg-amber-500'} disabled:opacity-50 text-white rounded-xl transition-colors font-medium text-sm glow-blue`}
                >
                  {updateBalanceMutation.isPending ? 'Processing...' : 'Confirm Update'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
