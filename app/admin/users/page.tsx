'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Shield, DollarSign, CreditCard as Edit2, X,
  TrendingUp, ArrowDownToLine, Wallet, ChevronDown, RefreshCw,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import type { Profile } from '@/types';

type UpdateField = 'balance' | 'total_deposited' | 'total_profit';
type UpdateMode = 'add' | 'set';

interface CreditModalState {
  user: Profile;
  field: UpdateField;
  mode: UpdateMode;
  amount: string;
  description: string;
}

async function fetchUsers(): Promise<Profile[]> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  return (data as Profile[]) ?? [];
}

const fieldConfig: Record<UpdateField, { label: string; icon: React.ElementType; color: string; bg: string; description: string }> = {
  balance: {
    label: 'Wallet Balance',
    icon: Wallet,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    description: 'The user\'s liquid account balance (used for trades, withdrawals, etc.)',
  },
  total_deposited: {
    label: 'Total Deposited',
    icon: ArrowDownToLine,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    description: 'Cumulative deposit amount tracked on the user\'s account.',
  },
  total_profit: {
    label: 'Total Profit',
    icon: TrendingUp,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    description: 'Total earnings from investments and trading displayed on the dashboard.',
  },
};

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [modalState, setModalState] = useState<CreditModalState | null>(null);

  const { data: users = [], isLoading } = useQuery({ queryKey: ['admin-users'], queryFn: fetchUsers });

  const toggleAdminMutation = useMutation({
    mutationFn: async ({ id, is_admin }: { id: string; is_admin: boolean }) => {
      const { error } = await supabase.from('profiles').update({ is_admin: !is_admin }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Admin status updated');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update'),
  });

  const updateFieldMutation = useMutation({
    mutationFn: async ({ user, field, amount, mode, description }: {
      user: Profile;
      field: UpdateField;
      amount: number;
      mode: UpdateMode;
      description: string;
    }) => {
      const currentValue = Number(user[field] ?? 0);
      const newValue = mode === 'add' ? currentValue + amount : amount;
      const diff = newValue - currentValue;

      // 1. Update the specific profile field
      const updatePayload: Partial<Profile> = { [field]: newValue };

      // If updating balance, also update total_deposited for 'add' mode deposits
      // (so they're consistent). We keep it simple - only update what was requested.

      const { error: profileError } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', user.id);
      if (profileError) throw profileError;

      // 2. Create a transaction record for audit trail
      const txType = field === 'balance'
        ? (diff >= 0 ? 'deposit' : 'withdrawal')
        : field === 'total_profit'
          ? 'profit'
          : 'deposit';

      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: txType,
          amount: Math.abs(diff),
          status: 'completed',
          description: description || `Admin manual ${fieldConfig[field].label} update`,
          reference: `ADMIN-${Date.now()}`,
          metadata: {
            is_manual: true,
            field_updated: field,
            update_mode: mode,
            prev_value: currentValue,
            new_value: newValue,
          },
        });
      if (txError) throw txError;

      // 3. If we updated balance, also send a notification
      if (field === 'balance' && Math.abs(diff) > 0) {
        await supabase.from('notifications').insert({
          user_id: user.id,
          title: diff >= 0 ? 'Balance Credited' : 'Balance Adjusted',
          message: diff >= 0
            ? `$${Math.abs(diff).toFixed(2)} has been added to your account balance.`
            : `Your account balance has been adjusted by -$${Math.abs(diff).toFixed(2)}.`,
          type: diff >= 0 ? 'success' : 'warning',
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setModalState(null);
      toast.success('User account updated successfully');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update user account'),
  });

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.username?.toLowerCase().includes(q) ||
      u.full_name?.toLowerCase().includes(q) ||
      u.referral_code?.toLowerCase().includes(q)
    );
  });

  const openModal = (user: Profile, field: UpdateField) => {
    setModalState({
      user,
      field,
      mode: 'add',
      amount: '',
      description: `Manual ${fieldConfig[field].label} update by admin`,
    });
  };

  const handleSubmit = () => {
    if (!modalState) return;
    const amount = parseFloat(modalState.amount);
    if (isNaN(amount) || amount < 0) return toast.error('Enter a valid positive amount');
    if (modalState.mode === 'add' && amount === 0) return toast.error('Amount must be greater than zero');

    updateFieldMutation.mutate({
      user: modalState.user,
      field: modalState.field,
      amount,
      mode: modalState.mode,
      description: modalState.description,
    });
  };

  const currentFieldValue = modalState
    ? Number(modalState.user[modalState.field] ?? 0)
    : 0;

  const previewNewValue = modalState
    ? modalState.mode === 'add'
      ? currentFieldValue + (parseFloat(modalState.amount) || 0)
      : parseFloat(modalState.amount) || 0
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-slate-400 text-sm mt-1">{users.length} registered users</p>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="bg-white/[0.04] border border-white/10 rounded-xl pl-8 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 w-64"
          />
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
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-white/[0.04]">
                      {[0, 1, 2, 3, 4, 5].map((j) => (
                        <td key={j} className="py-4 px-5">
                          <div className="shimmer h-4 rounded w-20" />
                        </td>
                      ))}
                    </tr>
                  ))
                : filtered.length === 0
                  ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-slate-400 text-sm">
                        No users found
                      </td>
                    </tr>
                  )
                  : filtered.map((user, i) => (
                    <motion.tr
                      key={user.id}
                      className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                    >
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

                      {/* Balance - clickable to edit */}
                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => openModal(user, 'balance')}
                          className="text-sm font-semibold text-white hover:text-blue-400 transition-colors group flex items-center justify-end gap-1 ml-auto"
                          title="Click to update balance"
                        >
                          ${Number(user.balance).toFixed(2)}
                          <Edit2 size={11} className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-400" />
                        </button>
                      </td>

                      {/* Deposited - clickable to edit */}
                      <td className="py-3.5 px-5 text-right hidden md:table-cell">
                        <button
                          onClick={() => openModal(user, 'total_deposited')}
                          className="text-sm text-slate-300 hover:text-emerald-400 transition-colors group flex items-center justify-end gap-1 ml-auto"
                          title="Click to update deposit amount"
                        >
                          ${Number(user.total_deposited).toFixed(2)}
                          <Edit2 size={11} className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-400" />
                        </button>
                      </td>

                      {/* Profit - clickable to edit */}
                      <td className="py-3.5 px-5 text-right hidden lg:table-cell">
                        <button
                          onClick={() => openModal(user, 'total_profit')}
                          className="text-sm text-emerald-400 hover:text-amber-400 transition-colors group flex items-center justify-end gap-1 ml-auto"
                          title="Click to update profit amount"
                        >
                          ${Number(user.total_profit).toFixed(2)}
                          <Edit2 size={11} className="opacity-0 group-hover:opacity-100 transition-opacity text-amber-400" />
                        </button>
                      </td>

                      <td className="py-3.5 px-5 text-center hidden sm:table-cell">
                        <span
                          className={
                            user.kyc_status === 'verified'
                              ? 'badge-success'
                              : user.kyc_status === 'rejected'
                                ? 'badge-danger'
                                : 'badge-pending'
                          }
                        >
                          {user.kyc_status}
                        </span>
                      </td>

                      <td className="py-3.5 px-5 text-center">
                        <button
                          onClick={() => toggleAdminMutation.mutate({ id: user.id, is_admin: user.is_admin })}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all mx-auto ${
                            user.is_admin
                              ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                              : 'bg-slate-500/10 text-slate-400 hover:bg-blue-500/10 hover:text-blue-400'
                          }`}
                        >
                          {user.is_admin ? (
                            <>
                              <Shield size={10} /> Admin
                            </>
                          ) : (
                            'User'
                          )}
                        </button>
                      </td>

                      <td className="py-3.5 px-5 text-right hidden sm:table-cell">
                        <span className="text-xs text-slate-400">
                          {new Date(user.created_at).toLocaleDateString()}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Field Modal */}
      <AnimatePresence>
        {modalState && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-[#060d1a] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${fieldConfig[modalState.field].bg} flex items-center justify-center`}>
                    {(() => {
                      const Icon = fieldConfig[modalState.field].icon;
                      return <Icon size={18} className={fieldConfig[modalState.field].color} />;
                    })()}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Update {fieldConfig[modalState.field].label}
                    </h3>
                    <p className="text-xs text-slate-500">
                      @{modalState.user.username || modalState.user.full_name}
                    </p>
                  </div>
                </div>
                <button onClick={() => setModalState(null)} className="text-slate-400 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-500 mb-5 p-3 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                {fieldConfig[modalState.field].description}
              </p>

              <div className="space-y-4">
                {/* Current Value Display */}
                <div className="flex items-center justify-between p-3 bg-white/[0.03] rounded-xl border border-white/[0.05]">
                  <span className="text-sm text-slate-400">Current {fieldConfig[modalState.field].label}</span>
                  <span className="text-sm font-bold text-white">${currentFieldValue.toFixed(2)}</span>
                </div>

                {/* Mode Toggle */}
                <div className="flex p-1 bg-white/[0.03] rounded-xl border border-white/10">
                  <button
                    onClick={() => setModalState({ ...modalState, mode: 'add' })}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                      modalState.mode === 'add'
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Add / Subtract
                  </button>
                  <button
                    onClick={() => setModalState({ ...modalState, mode: 'set' })}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                      modalState.mode === 'set'
                        ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Set Exact Value
                  </button>
                </div>

                {/* Amount Input */}
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">
                    {modalState.mode === 'add'
                      ? 'Amount to Add (use negative to subtract)'
                      : `New ${fieldConfig[modalState.field].label} (USD)`}
                  </label>
                  <div className="relative">
                    <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="number"
                      value={modalState.amount}
                      onChange={(e) => setModalState({ ...modalState, amount: e.target.value })}
                      placeholder={modalState.mode === 'add' ? '100.00' : currentFieldValue.toString()}
                      step="0.01"
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-8 pr-4 py-3 text-sm text-white focus:border-blue-500/50 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Preview */}
                {modalState.amount && (
                  <div className={`flex items-center justify-between p-3 rounded-xl border ${
                    previewNewValue >= currentFieldValue
                      ? 'bg-emerald-500/5 border-emerald-500/20'
                      : 'bg-red-500/5 border-red-500/20'
                  }`}>
                    <span className="text-xs text-slate-400">New {fieldConfig[modalState.field].label}</span>
                    <span className={`text-sm font-bold ${previewNewValue >= currentFieldValue ? 'text-emerald-400' : 'text-red-400'}`}>
                      ${previewNewValue.toFixed(2)}
                    </span>
                  </div>
                )}

                {/* Description */}
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Description / Reason</label>
                  <input
                    type="text"
                    value={modalState.description}
                    onChange={(e) => setModalState({ ...modalState, description: e.target.value })}
                    placeholder="e.g. Manual correction, Bonus credit..."
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500/50 focus:outline-none"
                  />
                </div>

                {/* Warning note */}
                <div className="flex items-start gap-2 p-3 bg-amber-500/5 rounded-xl border border-amber-500/10">
                  <AlertCircle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-400/80">
                    This change will be recorded in the transaction log and reflected immediately in the user's dashboard.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setModalState(null)}
                    className="flex-1 py-3 bg-white/[0.05] hover:bg-white/[0.1] text-white rounded-xl transition-colors font-medium text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!modalState.amount || updateFieldMutation.isPending}
                    className={`flex-1 py-3 disabled:opacity-50 text-white rounded-xl transition-colors font-medium text-sm flex items-center justify-center gap-2 ${
                      modalState.mode === 'add' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-amber-600 hover:bg-amber-500'
                    }`}
                  >
                    {updateFieldMutation.isPending ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : null}
                    {updateFieldMutation.isPending ? 'Saving...' : 'Confirm Update'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
