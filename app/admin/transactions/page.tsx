'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, Edit2, Trash2, X, DollarSign, Calendar,
  ArrowDownLeft, ArrowUpRight, TrendingUp, Gift, BarChart2,
  ChevronDown, AlertCircle, RefreshCw, ClipboardList, User,
  CheckCircle, Clock, XCircle, Ban
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import type { Profile, Transaction } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────
type TxType = 'deposit' | 'withdrawal' | 'profit' | 'referral_bonus' | 'investment';
type TxStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

interface TxWithProfile extends Transaction {
  profile?: { username: string | null; full_name: string } | null;
}

interface TxModalState {
  mode: 'create' | 'edit';
  tx?: TxWithProfile;
  type: TxType;
  amount: string;
  status: TxStatus;
  description: string;
  customDate: string;
  adjustBalance: boolean;
}

// ─── Config ───────────────────────────────────────────────────────────────────
const TX_TYPES: { value: TxType; label: string; icon: React.ElementType; color: string; bg: string }[] = [
  { value: 'deposit',       label: 'Deposit',       icon: ArrowDownLeft, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { value: 'withdrawal',    label: 'Withdrawal',    icon: ArrowUpRight,  color: 'text-red-400',     bg: 'bg-red-500/10'     },
  { value: 'profit',        label: 'Profit',        icon: TrendingUp,    color: 'text-blue-400',    bg: 'bg-blue-500/10'    },
  { value: 'referral_bonus',label: 'Referral Bonus',icon: Gift,          color: 'text-amber-400',   bg: 'bg-amber-500/10'   },
  { value: 'investment',    label: 'Investment',    icon: BarChart2,     color: 'text-rose-400',    bg: 'bg-rose-500/10'    },
];

const STATUS_CONFIG: Record<TxStatus, { label: string; icon: React.ElementType; cls: string }> = {
  completed: { label: 'Completed', icon: CheckCircle, cls: 'badge-success' },
  pending:   { label: 'Pending',   icon: Clock,       cls: 'badge-pending' },
  failed:    { label: 'Failed',    icon: XCircle,     cls: 'badge-danger'  },
  cancelled: { label: 'Cancelled', icon: Ban,         cls: 'badge-grey'    },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const isCreditType = (t: TxType) => ['deposit', 'profit', 'referral_bonus'].includes(t);

function toLocalDatetimeValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function nowLocalDatetime() {
  return toLocalDatetimeValue(new Date().toISOString());
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminTransactionsPage() {
  const { profile: adminProfile } = useAuth();
  const qc = useQueryClient();

  // ── State ──────────────────────────────────────────────────────────────────
  const [userSearch, setUserSearch]           = useState('');
  const [isUserDropOpen, setIsUserDropOpen]   = useState(false);
  const [selectedUser, setSelectedUser]       = useState<Profile | null>(null);
  const [typeFilter, setTypeFilter]           = useState<'all' | TxType>('all');
  const [statusFilter, setStatusFilter]       = useState<'all' | TxStatus>('all');
  const [txSearch, setTxSearch]               = useState('');
  const [modal, setModal]                     = useState<TxModalState | null>(null);
  const [deleteTarget, setDeleteTarget]       = useState<TxWithProfile | null>(null);

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: users = [] } = useQuery<Profile[]>({
    queryKey: ['admin-all-users'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      return (data as Profile[]) ?? [];
    },
  });

  const { data: transactions = [], isLoading: txLoading } = useQuery<TxWithProfile[]>({
    queryKey: ['admin-user-transactions', selectedUser?.id],
    queryFn: async () => {
      if (!selectedUser?.id) return [];
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', selectedUser.id)
        .order('created_at', { ascending: false });
      return (data as TxWithProfile[]) ?? [];
    },
    enabled: !!selectedUser?.id,
  });

  // ── Filtered Transactions ──────────────────────────────────────────────────
  const filtered = useMemo(() => transactions.filter(tx => {
    if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
    if (statusFilter !== 'all' && tx.status !== statusFilter) return false;
    if (txSearch) {
      const q = txSearch.toLowerCase();
      return tx.description?.toLowerCase().includes(q) || tx.reference?.toLowerCase().includes(q) || tx.amount.toString().includes(q);
    }
    return true;
  }), [transactions, typeFilter, statusFilter, txSearch]);

  const filteredUsers = useMemo(() =>
    users.filter(u =>
      !userSearch ||
      u.username?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(userSearch.toLowerCase())
    ), [users, userSearch]);

  // ── Create / Edit Mutation ─────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async (m: TxModalState) => {
      const amount = parseFloat(m.amount);
      if (isNaN(amount) || amount <= 0) throw new Error('Enter a valid positive amount');
      if (!selectedUser) throw new Error('No user selected');

      const dateISO = m.customDate
        ? new Date(m.customDate).toISOString()
        : new Date().toISOString();

      if (m.mode === 'create') {
        // Insert new transaction
        const { error } = await supabase.from('transactions').insert({
          user_id:     selectedUser.id,
          type:        m.type,
          amount,
          status:      m.status,
          description: m.description || `Admin manual ${m.type}`,
          reference:   `ADMIN-${Date.now()}`,
          created_at:  dateISO,
          metadata: { is_manual: true, admin_id: adminProfile?.id },
        });
        if (error) throw error;

        // Optionally adjust balance
        if (m.adjustBalance && m.status === 'completed') {
          const { data: prof } = await supabase.from('profiles').select('balance, total_deposited, total_withdrawn').eq('id', selectedUser.id).single();
          if (prof) {
            const isCredit = isCreditType(m.type);
            await supabase.from('profiles').update({
              balance: isCredit
                ? Number(prof.balance) + amount
                : Math.max(0, Number(prof.balance) - amount),
              ...(m.type === 'deposit' ? { total_deposited: Number(prof.total_deposited) + amount } : {}),
              ...(m.type === 'withdrawal' ? { total_withdrawn: Number(prof.total_withdrawn || 0) + amount } : {}),
            }).eq('id', selectedUser.id);
          }
        }
      } else if (m.mode === 'edit' && m.tx) {
        // Compute balance delta for edit
        const oldAmount = m.tx.amount;
        const oldStatus = m.tx.status;
        const { error } = await supabase.from('transactions').update({
          type:        m.type,
          amount,
          status:      m.status,
          description: m.description,
          created_at:  dateISO,
          metadata: { ...((m.tx.metadata as any) || {}), last_edited_by: adminProfile?.id, last_edited_at: new Date().toISOString() },
        }).eq('id', m.tx.id);
        if (error) throw error;

        // Adjust balance if amount or status changed and adjustBalance is checked
        if (m.adjustBalance) {
          const { data: prof } = await supabase.from('profiles').select('balance').eq('id', selectedUser.id).single();
          if (prof) {
            const wasCredit = isCreditType(m.tx.type);
            const isCredit  = isCreditType(m.type);
            let delta = 0;
            // Reverse old effect
            if (oldStatus === 'completed') delta += wasCredit ? -oldAmount : +oldAmount;
            // Apply new effect
            if (m.status === 'completed') delta += isCredit ? +amount : -amount;
            if (delta !== 0) {
              await supabase.from('profiles').update({
                balance: Math.max(0, Number(prof.balance) + delta),
              }).eq('id', selectedUser.id);
            }
          }
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-user-transactions', selectedUser?.id] });
      qc.invalidateQueries({ queryKey: ['admin-all-users'] });
      setModal(null);
      toast.success(modal?.mode === 'create' ? 'Transaction created!' : 'Transaction updated!');
    },
    onError: (e: any) => toast.error(e.message || 'Failed to save transaction'),
  });

  // ── Delete Mutation ────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: async (tx: TxWithProfile) => {
      const { error } = await supabase.from('transactions').delete().eq('id', tx.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-user-transactions', selectedUser?.id] });
      setDeleteTarget(null);
      toast.success('Transaction deleted');
    },
    onError: (e: any) => toast.error(e.message || 'Failed to delete'),
  });

  // ── Open Modals ────────────────────────────────────────────────────────────
  const openCreate = () => setModal({
    mode: 'create', type: 'deposit', amount: '', status: 'completed',
    description: '', customDate: nowLocalDatetime(), adjustBalance: true,
  });

  const openEdit = (tx: TxWithProfile) => setModal({
    mode: 'edit', tx,
    type: tx.type as TxType,
    amount: tx.amount.toString(),
    status: tx.status as TxStatus,
    description: tx.description || '',
    customDate: toLocalDatetimeValue(tx.created_at),
    adjustBalance: false,
  });

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ClipboardList className="text-blue-400" size={26} />
            Transaction Manager
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manually create, edit, backdate, or delete user transactions</p>
        </div>
        {selectedUser && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all glow-blue active:scale-[0.98] text-sm"
          >
            <Plus size={16} /> Add Transaction
          </button>
        )}
      </div>

      {/* User Selector */}
      <div className={`glass rounded-2xl p-5 border border-white/[0.05] relative ${isUserDropOpen ? 'z-20' : 'z-10'}`}>
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 block">Select User</label>
        <div className="relative">
          <button
            onClick={() => setIsUserDropOpen(!isUserDropOpen)}
            className="w-full flex items-center justify-between px-4 py-3 bg-white/[0.04] border border-white/10 rounded-xl text-sm text-white hover:bg-white/[0.06] transition-all"
          >
            {selectedUser ? (
              <span className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  {(selectedUser.username?.[0] ?? selectedUser.full_name?.[0] ?? 'U').toUpperCase()}
                </span>
                <span>
                  <span className="font-semibold">{selectedUser.username ?? 'No username'}</span>
                  <span className="text-slate-400 ml-2">—</span>
                  <span className="text-slate-400 ml-2">{selectedUser.full_name}</span>
                  <span className="ml-3 text-emerald-400 font-semibold">${Number(selectedUser.balance).toFixed(2)}</span>
                </span>
              </span>
            ) : (
              <span className="flex items-center gap-2 text-slate-400"><User size={16} /> Search and select a user...</span>
            )}
            <ChevronDown size={16} className={`text-slate-400 transition-transform ${isUserDropOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {isUserDropOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="absolute z-50 w-full mt-2 bg-[#0c1626]/98 border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl"
              >
                <div className="p-3 border-b border-white/[0.06]">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      autoFocus
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                      placeholder="Search by username or name..."
                      className="w-full pl-9 pr-4 py-2.5 bg-white/[0.04] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
                    />
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {filteredUsers.map(u => (
                    <button
                      key={u.id}
                      onClick={() => { setSelectedUser(u); setIsUserDropOpen(false); setUserSearch(''); }}
                      className={`w-full px-4 py-3 text-left hover:bg-white/[0.05] transition-all flex items-center gap-3 ${selectedUser?.id === u.id ? 'bg-blue-600/10' : ''}`}
                    >
                      <span className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                        {(u.username?.[0] ?? u.full_name?.[0] ?? 'U').toUpperCase()}
                      </span>
                      <span className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">{u.username ?? '(no username)'}</p>
                        <p className="text-xs text-slate-500 truncate">{u.full_name}</p>
                      </span>
                      <span className="text-xs text-emerald-400 font-semibold flex-shrink-0">${Number(u.balance).toFixed(2)}</span>
                    </button>
                  ))}
                  {filteredUsers.length === 0 && (
                    <p className="text-center text-slate-500 text-sm py-6">No users found</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User stats strip */}
        {selectedUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            {[
              { label: 'Balance', value: `$${Number(selectedUser.balance).toFixed(2)}`, color: 'text-white' },
              { label: 'Deposited', value: `$${Number(selectedUser.total_deposited).toFixed(2)}`, color: 'text-emerald-400' },
              { label: 'Withdrawn', value: `$${Number(selectedUser.total_withdrawn || 0).toFixed(2)}`, color: 'text-red-400' },
              { label: 'Total Profit', value: `$${Number(selectedUser.total_profit || 0).toFixed(2)}`, color: 'text-blue-400' },
            ].map(stat => (
              <div key={stat.label} className="bg-white/[0.03] rounded-xl px-4 py-3 border border-white/[0.04]">
                <p className="text-xs text-slate-500 mb-0.5">{stat.label}</p>
                <p className={`text-sm font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Transactions Table */}
      {selectedUser ? (
        <div className="glass rounded-2xl border border-white/[0.05] overflow-hidden">
          {/* Table Toolbar */}
          <div className="flex flex-wrap gap-3 items-center p-4 border-b border-white/[0.05]">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={txSearch}
                onChange={e => setTxSearch(e.target.value)}
                placeholder="Search transactions..."
                className="w-full pl-9 pr-4 py-2 bg-white/[0.04] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as any)}
              className="bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
            >
              <option value="all">All Types</option>
              {TX_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
            >
              <option value="all">All Statuses</option>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <span className="text-xs text-slate-500 ml-auto">{filtered.length} records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.05]">
                  {['Type', 'Amount', 'Status', 'Date', 'Description', 'Actions'].map(h => (
                    <th key={h} className={`py-3.5 px-5 text-xs text-slate-400 uppercase tracking-wider font-semibold ${h === 'Amount' || h === 'Actions' ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {txLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-white/[0.04]">
                      {[0,1,2,3,4,5].map(j => <td key={j} className="py-4 px-5"><div className="shimmer h-4 rounded w-20" /></td>)}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-400 text-sm">
                      <ClipboardList size={32} className="text-slate-600 mx-auto mb-3" />
                      No transactions found
                    </td>
                  </tr>
                ) : filtered.map((tx, i) => {
                  const txType = TX_TYPES.find(t => t.value === tx.type) ?? TX_TYPES[0];
                  const TxIcon = txType.icon;
                  const isCredit = isCreditType(tx.type as TxType);
                  return (
                    <motion.tr
                      key={tx.id}
                      className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                    >
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${txType.bg}`}>
                            <TxIcon size={14} className={txType.color} />
                          </div>
                          <span className={`text-sm font-medium ${txType.color}`}>{txType.label}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <span className={`text-sm font-bold ${isCredit ? 'text-emerald-400' : 'text-red-400'}`}>
                          {isCredit ? '+' : '-'}${tx.amount.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={STATUS_CONFIG[tx.status as TxStatus]?.cls ?? 'badge-grey'}>{tx.status}</span>
                      </td>
                      <td className="py-3.5 px-5 text-xs text-slate-400 whitespace-nowrap">
                        {new Date(tx.created_at).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-5 text-xs text-slate-400 max-w-[180px] truncate">
                        {tx.description || '—'}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEdit(tx)}
                            className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(tx)}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="glass rounded-2xl border border-white/[0.05] py-20 text-center">
          <User size={40} className="text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-base font-medium">Select a user to manage their transactions</p>
          <p className="text-slate-600 text-sm mt-1">Use the user selector above to get started</p>
        </div>
      )}

      {/* ── Create / Edit Modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {modal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={e => { if (e.target === e.currentTarget) setModal(null); }}
          >
            <motion.div
              className="bg-[#060d1a] border border-white/10 rounded-2xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {modal.mode === 'create' ? '+ New Transaction' : 'Edit Transaction'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    for <span className="text-blue-400 font-semibold">@{selectedUser?.username ?? selectedUser?.full_name}</span>
                  </p>
                </div>
                <button onClick={() => setModal(null)} className="text-slate-400 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Type */}
                <div>
                  <label className="text-xs text-slate-400 mb-2 block font-medium">Transaction Type</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {TX_TYPES.map(t => {
                      const TIcon = t.icon;
                      return (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => setModal({ ...modal, type: t.value })}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                            modal.type === t.value
                              ? `${t.bg} border-current ${t.color}`
                              : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-white'
                          }`}
                        >
                          <TIcon size={13} />
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-medium">Amount (USD)</label>
                  <div className="relative">
                    <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={modal.amount}
                      onChange={e => setModal({ ...modal, amount: e.target.value })}
                      placeholder="0.00"
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-9 pr-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-medium">Status</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(STATUS_CONFIG) as TxStatus[]).map(s => {
                      const SIcon = STATUS_CONFIG[s].icon;
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setModal({ ...modal, status: s })}
                          className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                            modal.status === s
                              ? s === 'completed' ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                                : s === 'pending'   ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                                : s === 'failed'    ? 'bg-red-500/10 border-red-500/40 text-red-400'
                                : 'bg-slate-500/10 border-slate-500/40 text-slate-400'
                              : 'bg-white/[0.03] border-white/10 text-slate-500 hover:text-white'
                          }`}
                        >
                          <SIcon size={12} />
                          {STATUS_CONFIG[s].label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Date / Backdate */}
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 flex items-center gap-1.5 font-medium">
                    <Calendar size={12} />
                    Transaction Date (Backdating)
                  </label>
                  <input
                    type="datetime-local"
                    value={modal.customDate}
                    onChange={e => setModal({ ...modal, customDate: e.target.value })}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 transition-all [color-scheme:dark]"
                  />
                  <p className="text-xs text-slate-600 mt-1">Leave at current time or pick a past date to backdate</p>
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-medium">Description</label>
                  <input
                    type="text"
                    value={modal.description}
                    onChange={e => setModal({ ...modal, description: e.target.value })}
                    placeholder="e.g. Manual deposit credit, Bonus, Correction..."
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>

                {/* Adjust Balance Toggle */}
                <label className="flex items-center gap-3 cursor-pointer p-3 bg-white/[0.02] rounded-xl border border-white/[0.06] hover:bg-white/[0.04] transition-all">
                  <div
                    className={`w-10 h-5 rounded-full transition-all flex-shrink-0 ${modal.adjustBalance ? 'bg-blue-600' : 'bg-white/10'}`}
                    onClick={() => setModal({ ...modal, adjustBalance: !modal.adjustBalance })}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white shadow mt-0.5 transition-all ${modal.adjustBalance ? 'ml-5' : 'ml-0.5'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Adjust User Balance</p>
                    <p className="text-xs text-slate-500">
                      {modal.adjustBalance
                        ? 'Balance will be updated when status is Completed'
                        : 'Balance will NOT be changed — ledger only'}
                    </p>
                  </div>
                </label>

                {/* Warning */}
                <div className="flex items-start gap-2 p-3 bg-amber-500/5 rounded-xl border border-amber-500/10">
                  <AlertCircle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-400/80">
                    Manual transactions are recorded with an admin audit marker. The user will see this in their transaction history.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setModal(null)}
                    className="flex-1 py-3 bg-white/[0.05] hover:bg-white/[0.1] text-white rounded-xl transition-colors font-medium text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!modal.amount || saveMutation.isPending}
                    onClick={() => saveMutation.mutate(modal)}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl transition-colors font-semibold text-sm flex items-center justify-center gap-2"
                  >
                    {saveMutation.isPending ? <RefreshCw size={15} className="animate-spin" /> : null}
                    {saveMutation.isPending ? 'Saving...' : modal.mode === 'create' ? 'Create Transaction' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Delete Confirm Modal ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={e => { if (e.target === e.currentTarget) setDeleteTarget(null); }}
          >
            <motion.div
              className="bg-[#060d1a] border border-red-500/20 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={22} className="text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-white text-center mb-1">Delete Transaction?</h3>
              <p className="text-slate-400 text-sm text-center mb-1">
                ${deleteTarget.amount.toFixed(2)} · {deleteTarget.type} · {deleteTarget.status}
              </p>
              <p className="text-slate-600 text-xs text-center mb-5">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 bg-white/[0.05] hover:bg-white/[0.1] text-white rounded-xl text-sm font-medium transition-all">Cancel</button>
                <button
                  onClick={() => deleteMutation.mutate(deleteTarget)}
                  disabled={deleteMutation.isPending}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
                >
                  {deleteMutation.isPending ? <RefreshCw size={14} className="animate-spin" /> : null}
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
