'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Megaphone, Plus, Trash2, Globe, DollarSign, Coins, User, Loader2 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { WithdrawalAlert } from '@/types';
import toast from 'react-hot-toast';

const ASSETS_LIST = ['USDT', 'BTC', 'ETH', 'SOL', 'BNB', 'USDC'];

export default function AdminWithdrawalPopupsPage() {
  const [alerts, setAlerts] = useState<WithdrawalAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    amount: '',
    asset: 'USDT',
    location: '',
  });

  // Fetch custom alerts from the database
  async function fetchAlerts() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('withdrawal_alerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }
      setAlerts(data || []);
    } catch (error: any) {
      console.error('Failed to load withdrawal alerts:', error);
      toast.error(error.message || 'Failed to fetch withdrawal alerts');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAlerts();
  }, []);

  // Handle Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username.trim()) {
      toast.error('Please enter a username or name');
      return;
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      setSubmitting(true);
      const { error } = await supabase.from('withdrawal_alerts').insert([
        {
          username: formData.username.trim(),
          amount: parseFloat(formData.amount),
          asset: formData.asset,
          location: formData.location.trim() || 'Global client',
        },
      ]);

      if (error) throw error;

      toast.success('Withdrawal popup created and broadcasted successfully!');
      setShowAddModal(false);
      setFormData({
        username: '',
        amount: '',
        asset: 'USDT',
        location: '',
      });
      fetchAlerts();
    } catch (error: any) {
      console.error('Failed to insert withdrawal alert:', error);
      toast.error(error.message || 'Failed to create popup alert');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this custom withdrawal popup?')) return;

    try {
      const { error } = await supabase
        .from('withdrawal_alerts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Withdrawal popup deleted successfully');
      setAlerts(alerts.filter((a) => a.id !== id));
    } catch (error: any) {
      console.error('Failed to delete alert:', error);
      toast.error(error.message || 'Failed to delete alert');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Megaphone className="text-red-400" size={24} />
            Withdrawal Popups
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Create custom withdrawal alerts that appear randomly on the website homepage to all visitors as social proof/testimony.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all font-semibold text-sm shadow-lg shadow-red-600/20"
        >
          <Plus size={16} />
          Create Alert Popup
        </button>
      </div>

      {/* Main List */}
      <div className="glass rounded-2xl border border-white/[0.05] overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.05]">
          <h2 className="text-lg font-bold text-white">Custom Alerts Broadcast History</h2>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="text-red-400 animate-spin" size={32} />
            <p className="text-slate-400 text-sm font-medium">Fetching alert popups...</p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-20 px-6">
            <Megaphone size={40} className="text-slate-600 mx-auto mb-4 opacity-40" />
            <p className="text-slate-400 text-sm">No custom withdrawal alerts found</p>
            <p className="text-slate-500 text-xs mt-1">Click the button above to add your first custom testimony!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.01]">
                  <th className="text-left py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Username</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Amount ($)</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Asset</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Location</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Created At</th>
                  <th className="text-center py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((alert) => (
                  <tr key={alert.id} className="border-b border-white/[0.04] hover:bg-white/[0.01] transition-colors">
                    <td className="py-4 px-6 text-sm font-semibold text-white">{alert.username}</td>
                    <td className="py-4 px-6 text-sm font-bold text-emerald-400">
                      ${Number(alert.amount).toFixed(2)}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1 rounded bg-white/[0.04] px-2 py-0.5 text-xs font-semibold text-slate-300 border border-white/5">
                        {alert.asset}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <Globe size={13} className="text-slate-500" />
                        {alert.location || 'Global'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-400">
                      {alert.created_at ? new Date(alert.created_at).toLocaleString() : 'N/A'}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => alert.id && handleDelete(alert.id)}
                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                        title="Delete popup alert"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Alert Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-3xl border border-white/10 max-w-md w-full overflow-hidden shadow-2xl"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/[0.05] bg-white/[0.01] flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Megaphone size={18} className="text-red-400" />
                Add Withdrawal Popup
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white transition-colors text-sm font-semibold px-2 py-1 rounded-lg hover:bg-white/5"
              >
                Close
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Username Input */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block flex items-center gap-1.5">
                  <User size={13} /> Username / Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Michael T. or Sophia"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Amount Input */}
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block flex items-center gap-1.5">
                    <DollarSign size={13} /> Amount ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 2500"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500/50"
                  />
                </div>

                {/* Asset Choice */}
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block flex items-center gap-1.5">
                    <Coins size={13} /> Asset
                  </label>
                  <select
                    value={formData.asset}
                    onChange={(e) => setFormData({ ...formData, asset: e.target.value })}
                    className="w-full bg-[#0b101c] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500/50"
                  >
                    {ASSETS_LIST.map((asset) => (
                      <option key={asset} value={asset}>
                        {asset}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Location Input */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block flex items-center gap-1.5">
                  <Globe size={13} /> Location / Country
                </label>
                <input
                  type="text"
                  placeholder="e.g. London, UK or Berlin, Germany"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500/50"
                />
                <p className="text-[10px] text-slate-500 mt-1">If blank, defaults to &apos;Global client&apos;.</p>
              </div>

              {/* Submit Button */}
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 border border-white/10 hover:bg-white/5 text-slate-300 rounded-xl transition-all font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin" size={16} /> Creating...
                    </>
                  ) : (
                    'Add Payout Alert'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
