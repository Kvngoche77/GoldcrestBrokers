'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Plus, Edit2, Check, X, Box, TrendingUp, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { InvestmentPlan } from '@/types';

export default function AdminPlansPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<InvestmentPlan | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    min_amount: 100,
    max_amount: 10000,
    daily_roi_percent: 1.5,
    duration_days: 30,
    total_roi_percent: 145,
    referral_bonus_percent: 5,
    features: '',
    is_active: true,
    sort_order: 1,
  });

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['admin-plans'],
    queryFn: async () => {
      const { data } = await supabase.from('investment_plans').select('*').order('sort_order');
      return (data as InvestmentPlan[]) || [];
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        ...data,
        features: data.features.split('\n').filter(f => f.trim()),
      };

      if (editingPlan) {
        const { error } = await supabase.from('investment_plans').update(payload).eq('id', editingPlan.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('investment_plans').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-plans'] });
      setIsModalOpen(false);
      setEditingPlan(null);
      toast.success(editingPlan ? 'Plan updated' : 'Plan created');
    },
    onError: (error: any) => toast.error(error.message || 'Failed to save plan')
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('investment_plans').update({ is_active: !is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-plans'] });
      toast.success('Plan status updated');
    }
  });

  const handleOpenModal = (plan?: InvestmentPlan) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name,
        description: plan.description,
        min_amount: plan.min_amount,
        max_amount: plan.max_amount || 0,
        daily_roi_percent: plan.daily_roi_percent,
        duration_days: plan.duration_days,
        total_roi_percent: plan.total_roi_percent,
        referral_bonus_percent: plan.referral_bonus_percent,
        features: plan.features.join('\n'),
        is_active: plan.is_active,
        sort_order: plan.sort_order,
      });
    } else {
      setEditingPlan(null);
      setFormData({
        name: '', description: '', min_amount: 100, max_amount: 10000,
        daily_roi_percent: 1.5, duration_days: 30, total_roi_percent: 145,
        referral_bonus_percent: 5, features: '', is_active: true, sort_order: plans.length + 1,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Box className="text-blue-500" /> Investment Plans
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage platform investment tiers</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all flex items-center gap-2 glow-blue"
        >
          <Plus size={16} /> New Plan
        </button>
      </div>

      <div className="glass rounded-2xl overflow-hidden border border-white/[0.05]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.05] bg-white/[0.02]">
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Plan Name</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Range</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Daily ROI</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Duration</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase text-center">Status</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">Loading plans...</td>
                </tr>
              ) : plans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">No investment plans found</td>
                </tr>
              ) : (
                plans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-white">{plan.name}</div>
                      <div className="text-xs text-slate-400 line-clamp-1 max-w-[200px]">{plan.description}</div>
                    </td>
                    <td className="p-4 text-sm text-slate-300">
                      ${plan.min_amount.toLocaleString()} - {plan.max_amount ? `$${plan.max_amount.toLocaleString()}` : '∞'}
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-bold text-emerald-400">{plan.daily_roi_percent}%</span>
                    </td>
                    <td className="p-4 text-sm text-slate-300">{plan.duration_days} Days</td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => toggleActiveMutation.mutate({ id: plan.id, is_active: plan.is_active })}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors ${
                          plan.is_active 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' 
                            : 'bg-slate-500/10 text-slate-400 border-slate-500/20 hover:bg-slate-500/20'
                        }`}
                      >
                        {plan.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleOpenModal(plan)}
                        className="p-2 rounded-lg bg-white/[0.05] text-slate-300 hover:text-white hover:bg-white/[0.1] transition-colors"
                        title="Edit Plan"
                      >
                        <Edit2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Plan Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-[#060d1a] border border-white/10 rounded-2xl p-6 max-w-2xl w-full shadow-2xl my-8"
          >
            <div className="flex justify-between items-center mb-5 pb-4 border-b border-white/[0.05]">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp size={18} className="text-blue-500" />
                {editingPlan ? 'Edit Investment Plan' : 'Create New Plan'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs text-slate-400 mb-1.5 block">Plan Name</label>
                  <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500/50 focus:outline-none" />
                </div>
                
                <div className="sm:col-span-2">
                  <label className="text-xs text-slate-400 mb-1.5 block">Description</label>
                  <textarea required rows={2} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500/50 focus:outline-none resize-none" />
                </div>

                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Min Amount ($)</label>
                  <input required type="number" min="0" step="1" value={formData.min_amount} onChange={(e) => setFormData({...formData, min_amount: Number(e.target.value)})} className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500/50 focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Max Amount ($) (0 for no limit)</label>
                  <input required type="number" min="0" step="1" value={formData.max_amount} onChange={(e) => setFormData({...formData, max_amount: Number(e.target.value)})} className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500/50 focus:outline-none" />
                </div>

                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Daily ROI (%)</label>
                  <input required type="number" min="0" step="0.01" value={formData.daily_roi_percent} onChange={(e) => setFormData({...formData, daily_roi_percent: Number(e.target.value)})} className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500/50 focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Duration (Days)</label>
                  <input required type="number" min="1" step="1" value={formData.duration_days} onChange={(e) => setFormData({...formData, duration_days: Number(e.target.value)})} className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500/50 focus:outline-none" />
                </div>

                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Total ROI (%)</label>
                  <input required type="number" min="0" step="0.1" value={formData.total_roi_percent} onChange={(e) => setFormData({...formData, total_roi_percent: Number(e.target.value)})} className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500/50 focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Referral Bonus (%)</label>
                  <input required type="number" min="0" step="0.1" value={formData.referral_bonus_percent} onChange={(e) => setFormData({...formData, referral_bonus_percent: Number(e.target.value)})} className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500/50 focus:outline-none" />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs text-slate-400 mb-1.5 block">Features (One per line)</label>
                  <textarea required rows={4} value={formData.features} onChange={(e) => setFormData({...formData, features: e.target.value})} placeholder="Daily Profit Payouts&#10;24/7 Premium Support" className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500/50 focus:outline-none resize-none" />
                </div>
              </div>

              <div className="pt-4 mt-6 border-t border-white/[0.05] flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-white/[0.05] hover:bg-white/[0.1] text-white rounded-xl transition-colors font-medium text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={saveMutation.isPending} className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl transition-colors font-medium text-sm flex items-center justify-center gap-2 glow-blue">
                  {saveMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  Save Plan
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
