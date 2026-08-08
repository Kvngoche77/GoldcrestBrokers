'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Plus, Search, Edit2, Trash2, X, Save, 
  Loader2, CheckCircle2, TrendingUp,
  User, UploadCloud, Link, Shield, Activity,
  BarChart2, Award, Calendar, DollarSign, Cpu, Check, AlertCircle, FileText
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { Trader, CopyTraderApplication } from '@/types';

export default function AdminCopyTradingPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'traders' | 'applications'>('traders');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrader, setEditingTrader] = useState<Trader | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [urlMode, setUrlMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Default Performance history
  const defaultPerformance = [
    { month: 'Jan', roi: 12.4 },
    { month: 'Feb', roi: 14.8 },
    { month: 'Mar', roi: 18.2 },
    { month: 'Apr', roi: 15.6 },
    { month: 'May', roi: 21.0 },
    { month: 'Jun', roi: 19.5 },
    { month: 'Jul', roi: 24.3 }
  ];

  // Default Strategy history
  const defaultStrategyHistory: Array<{
    id: string;
    symbol: string;
    type: 'BUY' | 'SELL';
    entry_price: number;
    exit_price: number;
    pnl_percent: number;
    date: string;
  }> = [
    { id: '1', symbol: 'BTC/USDT', type: 'BUY', entry_price: 64200, exit_price: 67500, pnl_percent: 5.14, date: '2026-08-01' },
    { id: '2', symbol: 'ETH/USDT', type: 'BUY', entry_price: 3450, exit_price: 3680, pnl_percent: 6.67, date: '2026-08-03' },
    { id: '3', symbol: 'SOL/USDT', type: 'SELL', entry_price: 154, exit_price: 142, pnl_percent: 7.79, date: '2026-08-05' },
    { id: '4', symbol: 'EUR/USD', type: 'BUY', entry_price: 1.0850, exit_price: 1.0920, pnl_percent: 0.65, date: '2026-08-06' },
  ];

  // Form state
  const [formData, setFormData] = useState<Partial<Trader>>({
    name: '',
    bio: '',
    roi_percent: 145,
    win_rate: 88,
    total_followers: 245,
    subscription_rate: 50,
    is_active: true,
    avatar_url: '',
    trades_won: 48,
    trades_lost: 6,
    total_active_days: 120,
    currency: 'USD',
    leverage: '1:500',
    platform: 'MT5',
    account_type: 'Standard',
    risk_score: 3,
    max_drawdown: 4.5,
    equity: 75000,
    performance_history: defaultPerformance,
    strategy_history: defaultStrategyHistory,
  });

  // Upload image to Supabase Storage
  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `trader-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      setFormData(prev => ({ ...prev, avatar_url: data.publicUrl }));
      setImagePreview(data.publicUrl);
      toast.success('Image uploaded!');
    } catch (err: any) {
      console.error('Upload fallback preview:', err);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
        setFormData(prev => ({ ...prev, avatar_url: result }));
      };
      reader.readAsDataURL(file);
      toast.error('Storage bucket unavailable. Using preview image.');
    } finally {
      setUploading(false);
    }
  };

  // Fetch traders
  const { data: traders = [], isLoading } = useQuery({
    queryKey: ['admin-copy-traders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('copy_traders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Trader[];
    },
  });

  // Fetch applications
  const { data: applications = [], isLoading: loadingApps } = useQuery({
    queryKey: ['admin-copy-applications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('copy_trader_applications')
        .select('*')
        .order('created_at', { ascending: false });
      if (error && !error.message.includes('relation')) throw error;
      return (data || []) as CopyTraderApplication[];
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (data: Partial<Trader>) => {
      const { id, ...rest } = data;
      if (id) {
        const { error } = await supabase
          .from('copy_traders')
          .update(rest)
          .eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('copy_traders')
          .insert(rest);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingTrader ? 'Trader details updated!' : 'Master Trader created successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-copy-traders'] });
      setIsModalOpen(false);
      setEditingTrader(null);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Action failed');
    },
    onSettled: () => setSaving(false)
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('copy_traders')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Trader deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-copy-traders'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete');
    }
  });

  // Application decision mutation
  const appStatusMutation = useMutation({
    mutationFn: async ({ id, status, app }: { id: string; status: 'approved' | 'rejected'; app: CopyTraderApplication }) => {
      const { error } = await supabase
        .from('copy_trader_applications')
        .update({ status })
        .eq('id', id);
      if (error) throw error;

      if (status === 'approved') {
        // Automatically create a new copy trader from the approved application
        const newTrader: Partial<Trader> = {
          name: app.full_name,
          bio: app.bio || `${app.experience_years} years trading experience. Strategy: ${app.trading_style}.`,
          roi_percent: 110,
          win_rate: 85,
          total_followers: 12,
          subscription_rate: app.requested_fee || 50,
          is_active: true,
          trades_won: 34,
          trades_lost: 6,
          total_active_days: 60,
          currency: 'USD',
          leverage: '1:500',
          platform: app.platform || 'MT5',
          account_type: app.account_type || 'Standard',
          risk_score: 3,
          max_drawdown: 3.8,
          equity: 25000,
          performance_history: defaultPerformance,
          strategy_history: defaultStrategyHistory,
        };
        await supabase.from('copy_traders').insert(newTrader);
      }
    },
    onSuccess: (_, variables) => {
      toast.success(`Application ${variables.status}`);
      queryClient.invalidateQueries({ queryKey: ['admin-copy-applications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-copy-traders'] });
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update status'),
  });

  const handleEdit = (trader: Trader) => {
    setEditingTrader(trader);
    setFormData({
      ...trader,
      total_active_days: trader.total_active_days ?? 120,
      currency: trader.currency ?? 'USD',
      leverage: trader.leverage ?? '1:500',
      platform: trader.platform ?? 'MT5',
      account_type: trader.account_type ?? 'Standard',
      risk_score: trader.risk_score ?? 3,
      max_drawdown: trader.max_drawdown ?? 4.5,
      equity: trader.equity ?? 75000,
      performance_history: trader.performance_history && trader.performance_history.length > 0 ? trader.performance_history : defaultPerformance,
      strategy_history: trader.strategy_history && trader.strategy_history.length > 0 ? trader.strategy_history : defaultStrategyHistory,
    });
    setImagePreview(trader.avatar_url || null);
    setUrlMode(false);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      bio: '',
      roi_percent: 145,
      win_rate: 88,
      total_followers: 150,
      subscription_rate: 50,
      is_active: true,
      avatar_url: '',
      trades_won: 48,
      trades_lost: 6,
      total_active_days: 120,
      currency: 'USD',
      leverage: '1:500',
      platform: 'MT5',
      account_type: 'Standard',
      risk_score: 3,
      max_drawdown: 4.5,
      equity: 75000,
      performance_history: defaultPerformance,
      strategy_history: defaultStrategyHistory,
    });
    setImagePreview(null);
    setUrlMode(false);
  };

  const handleOpenCreate = () => {
    setEditingTrader(null);
    resetForm();
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return toast.error('Trader Name is required');
    setSaving(true);
    upsertMutation.mutate(formData);
  };

  const filteredTraders = traders.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.platform && t.platform.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const pendingApps = applications.filter(a => a.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
              MT5 Copy Trade Suite
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
            <Users size={28} className="text-blue-400" />
            Copy Trading Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Configure Master Traders (Platform, MT5, Standard account, Leverage, Active Days, PnL Tables) and review Trader Applications.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleOpenCreate}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 glow-blue text-sm"
          >
            <Plus size={18} /> Add Master Trader
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-1">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('traders')}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'traders'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-400 hover:text-white bg-white/[0.02]'
            }`}
          >
            <Users size={16} /> Master Traders ({traders.length})
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 relative ${
              activeTab === 'applications'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-400 hover:text-white bg-white/[0.02]'
            }`}
          >
            <FileText size={16} /> Trader Applications
            {pendingApps.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-xs font-extrabold">
                {pendingApps.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Traders', value: traders.length, icon: User, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Active Copy Traders', value: traders.filter(t => t.is_active).length, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Avg. ROI Gains', value: `+${(traders.reduce((s,t) => s + Number(t.roi_percent || 0), 0) / (traders.length || 1)).toFixed(1)}%`, icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Pending Applications', value: pendingApps.length, icon: FileText, color: 'text-rose-400', bg: 'bg-rose-500/10' },
        ].map((stat, i) => (
          <div key={i} className="glass rounded-2xl p-4 border border-white/[0.05]">
            <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
              <stat.icon size={18} className={stat.color} />
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {activeTab === 'traders' ? (
        /* Master Traders Section */
        <div className="glass rounded-3xl overflow-hidden border border-white/[0.05]">
          <div className="p-4 border-b border-white/[0.05] bg-white/[0.02] flex items-center justify-between gap-4">
            <div className="relative w-full max-w-sm">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type="text"
                placeholder="Search master traders by name, platform..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-all"
              />
            </div>
            <span className="text-xs text-slate-400 font-semibold">Showing {filteredTraders.length} traders</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.05] bg-white/[0.01]">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trader Profile</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Platform / Account</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">ROI Gains / Win Rate</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Active Days</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Leverage & Risk</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Sub Fee</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {isLoading ? (
                  <tr><td colSpan={8} className="px-6 py-12 text-center text-slate-500">Loading traders...</td></tr>
                ) : filteredTraders.length === 0 ? (
                  <tr><td colSpan={8} className="px-6 py-12 text-center text-slate-500">No master traders configured yet. Click &quot;Add Master Trader&quot; above.</td></tr>
                ) : (
                  filteredTraders.map((trader) => (
                    <tr key={trader.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-blue-600/20 flex items-center justify-center overflow-hidden border border-white/10 flex-shrink-0">
                            {trader.avatar_url ? (
                              <img src={trader.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <User size={22} className="text-blue-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white flex items-center gap-1.5">
                              {trader.name}
                              <Shield size={12} className="text-emerald-400" />
                            </p>
                            <p className="text-[10px] text-slate-500 truncate max-w-[160px]">{trader.bio || 'Professional strategy provider'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-[11px]">
                            {trader.platform || 'MT5'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold">{trader.account_type || 'Standard'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <p className="text-sm font-bold text-emerald-400">+{trader.roi_percent}%</p>
                        <p className="text-[10px] text-slate-400 font-semibold">{trader.win_rate}% ({trader.trades_won || 0}W / {trader.trades_lost || 0}L)</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <p className="text-xs font-bold text-white">{trader.total_active_days || 120} days</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <p className="text-xs font-semibold text-slate-300">{trader.leverage || '1:500'}</p>
                        <span className="text-[10px] text-amber-400 font-bold bg-amber-400/10 px-1.5 py-0.5 rounded">
                          Risk {trader.risk_score || 3}/10
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <p className="text-sm font-bold text-blue-400">${trader.subscription_rate}/mo</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${trader.is_active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400'}`}>
                          {trader.is_active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleEdit(trader)}
                            className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white transition-colors"
                            title="Edit Master Trader"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            onClick={() => { if(confirm('Delete this trader?')) deleteMutation.mutate(trader.id) }}
                            className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                            title="Delete Trader"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Applications Review Section */
        <div className="glass rounded-3xl p-6 border border-white/[0.05] space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText size={20} className="text-blue-400" />
            Copy-Trader Registration Applications
          </h2>
          <p className="text-slate-400 text-xs">
            Review user applications from the Trader Area. Approving an application will automatically create an active Master Trader profile.
          </p>

          {loadingApps ? (
            <div className="py-12 text-center text-slate-500">Loading applications...</div>
          ) : applications.length === 0 ? (
            <div className="py-12 text-center text-slate-500 glass rounded-2xl">
              No trader applications submitted yet.
            </div>
          ) : (
            <div className="grid gap-4">
              {applications.map((app) => (
                <div key={app.id} className="glass rounded-2xl p-5 border border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-white text-base">{app.full_name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        app.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        app.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        'bg-red-500/10 text-red-400'
                      }`}>
                        {app.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{app.email} · {app.experience_years} Years Experience · Style: {app.trading_style}</p>
                    <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-slate-300">
                      <span className="bg-white/[0.04] px-2 py-0.5 rounded border border-white/10">Platform: <strong>{app.platform}</strong></span>
                      <span className="bg-white/[0.04] px-2 py-0.5 rounded border border-white/10">Account: <strong>{app.account_type}</strong></span>
                      {app.mt5_account_number && (
                        <span className="bg-white/[0.04] px-2 py-0.5 rounded border border-white/10">MT5 Acc#: <strong>{app.mt5_account_number}</strong></span>
                      )}
                      <span className="bg-white/[0.04] px-2 py-0.5 rounded border border-white/10">Target Fee: <strong>${app.requested_fee}/mo</strong></span>
                    </div>
                    {app.bio && <p className="text-xs text-slate-400 italic pt-1">&quot;{app.bio}&quot;</p>}
                  </div>

                  {app.status === 'pending' && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => appStatusMutation.mutate({ id: app.id, status: 'rejected', app })}
                        disabled={appStatusMutation.isPending}
                        className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold transition-all border border-red-500/20"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => appStatusMutation.mutate({ id: app.id, status: 'approved', app })}
                        disabled={appStatusMutation.isPending}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all glow-blue flex items-center gap-1.5"
                      >
                        <Check size={14} /> Approve & Create Trader
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Comprehensive Create/Edit Master Trader Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="glass-strong rounded-3xl p-6 md:p-8 max-w-3xl w-full border border-white/10 shadow-2xl relative overflow-y-auto max-h-[92vh]"
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors p-1 rounded-xl bg-white/[0.05]"
              >
                <X size={20} />
              </button>

              <div className="mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase mb-2">
                  <Cpu size={12} /> Master Trader Configuration
                </div>
                <h2 className="text-2xl font-bold text-white">
                  {editingTrader ? `Edit ${formData.name}` : 'Configure New Master Trader'}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 1. Basic Trader Details */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-4">
                  <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                    <User size={14} /> Profile & Strategy Info
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Trader Name</label>
                      <input 
                        type="text"
                        value={formData.name || ''}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        placeholder="e.g. Satoshi Trading Master"
                        className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Subscription Rate ($/mo)</label>
                      <input 
                        type="number"
                        value={formData.subscription_rate || 50}
                        onChange={e => setFormData({...formData, subscription_rate: Number(e.target.value)})}
                        className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Bio / Strategy Overview</label>
                    <textarea 
                      value={formData.bio || ''}
                      onChange={e => setFormData({...formData, bio: e.target.value})}
                      rows={2}
                      placeholder="e.g. Specializing in MT5 high-frequency swing trading on BTC and Majors with tight risk control."
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 resize-none"
                    />
                  </div>

                  {/* Image input */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Trader Avatar Image</label>
                      <button
                        type="button"
                        onClick={() => setUrlMode(!urlMode)}
                        className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        {urlMode ? <UploadCloud size={12} /> : <Link size={12} />}
                        {urlMode ? 'Upload File' : 'Use Image URL'}
                      </button>
                    </div>

                    {urlMode ? (
                      <input
                        type="text"
                        value={formData.avatar_url || ''}
                        onChange={e => {
                          setFormData({ ...formData, avatar_url: e.target.value });
                          setImagePreview(e.target.value);
                        }}
                        placeholder="https://images.unsplash.com/photo-..."
                        className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
                      />
                    ) : (
                      <div
                        className="relative border border-dashed border-white/20 rounded-xl overflow-hidden cursor-pointer hover:border-blue-500/50 transition-colors group p-4 flex items-center gap-4"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }}
                        />
                        {imagePreview ? (
                          <div className="w-14 h-14 rounded-2xl overflow-hidden bg-blue-600/10 border border-white/10 flex-shrink-0">
                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center text-slate-500 flex-shrink-0">
                            <UploadCloud size={24} />
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-semibold text-white">{uploading ? 'Uploading...' : 'Click to select profile picture'}</p>
                          <p className="text-[10px] text-slate-500">PNG, JPG, WEBP - max 5MB</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Platform, Account Type, Leverage & Market Metrics */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-4">
                  <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Cpu size={14} /> Account Specifications (MT5 / Platform)
                  </h3>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Platform</label>
                      <select 
                        value={formData.platform || 'MT5'}
                        onChange={e => setFormData({...formData, platform: e.target.value})}
                        className="w-full bg-[#0a1324] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
                      >
                        <option value="MT5">MT5 (MetaTrader 5)</option>
                        <option value="MT4">MT4 (MetaTrader 4)</option>
                        <option value="cTrader">cTrader</option>
                        <option value="Goldcrest Web">Goldcrest Web</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Account Type</label>
                      <select 
                        value={formData.account_type || 'Standard'}
                        onChange={e => setFormData({...formData, account_type: e.target.value})}
                        className="w-full bg-[#0a1324] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
                      >
                        <option value="Standard">Standard</option>
                        <option value="ECN Pro">ECN Pro</option>
                        <option value="VIP Prime">VIP Prime</option>
                        <option value="Cent">Cent</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Leverage</label>
                      <select 
                        value={formData.leverage || '1:500'}
                        onChange={e => setFormData({...formData, leverage: e.target.value})}
                        className="w-full bg-[#0a1324] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
                      >
                        <option value="1:100">1:100</option>
                        <option value="1:200">1:200</option>
                        <option value="1:500">1:500</option>
                        <option value="1:1000">1:1000</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Base Currency</label>
                      <select 
                        value={formData.currency || 'USD'}
                        onChange={e => setFormData({...formData, currency: e.target.value})}
                        className="w-full bg-[#0a1324] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="USDT">USDT</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Total Active Days</label>
                      <input 
                        type="number"
                        value={formData.total_active_days || 120}
                        onChange={e => setFormData({...formData, total_active_days: Number(e.target.value)})}
                        className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Risk Score (1 - 10)</label>
                      <input 
                        type="number"
                        min={1}
                        max={10}
                        value={formData.risk_score || 3}
                        onChange={e => setFormData({...formData, risk_score: Number(e.target.value)})}
                        className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Max Drawdown %</label>
                      <input 
                        type="number"
                        step="0.1"
                        value={formData.max_drawdown || 4.5}
                        onChange={e => setFormData({...formData, max_drawdown: Number(e.target.value)})}
                        className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Equity / AUM ($)</label>
                      <input 
                        type="number"
                        value={formData.equity || 75000}
                        onChange={e => setFormData({...formData, equity: Number(e.target.value)})}
                        className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Performance ROI & Trade Stats */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-4">
                  <h3 className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                    <TrendingUp size={14} /> Performance ROI & Win/Loss Ratios
                  </h3>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Total ROI Gains %</label>
                      <input 
                        type="number"
                        step="0.1"
                        value={formData.roi_percent || 0}
                        onChange={e => setFormData({...formData, roi_percent: Number(e.target.value)})}
                        className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50 font-bold text-emerald-400"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Win Rate %</label>
                      <input 
                        type="number"
                        step="0.1"
                        value={formData.win_rate || 0}
                        onChange={e => setFormData({...formData, win_rate: Number(e.target.value)})}
                        className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Trades Won</label>
                      <input 
                        type="number"
                        value={formData.trades_won || 0}
                        onChange={e => {
                          const won = Number(e.target.value);
                          const lost = formData.trades_lost || 0;
                          const total = won + lost;
                          const newWinRate = total > 0 ? Number(((won / total) * 100).toFixed(1)) : formData.win_rate;
                          setFormData({...formData, trades_won: won, win_rate: newWinRate});
                        }}
                        className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Trades Lost</label>
                      <input 
                        type="number"
                        value={formData.trades_lost || 0}
                        onChange={e => {
                          const lost = Number(e.target.value);
                          const won = formData.trades_won || 0;
                          const total = won + lost;
                          const newWinRate = total > 0 ? Number(((won / total) * 100).toFixed(1)) : formData.win_rate;
                          setFormData({...formData, trades_lost: lost, win_rate: newWinRate});
                        }}
                        className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Total Followers/Copiers</label>
                      <input 
                        type="number"
                        value={formData.total_followers || 0}
                        onChange={e => setFormData({...formData, total_followers: Number(e.target.value)})}
                        className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
                      />
                    </div>

                    <div className="flex items-center pt-5">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                          <input 
                            type="checkbox"
                            checked={formData.is_active}
                            onChange={e => setFormData({...formData, is_active: e.target.checked})}
                            className="sr-only"
                          />
                          <div className={`w-10 h-6 rounded-full transition-colors ${formData.is_active ? 'bg-blue-600' : 'bg-slate-700'}`} />
                          <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${formData.is_active ? 'translate-x-4' : ''}`} />
                        </div>
                        <span className="text-xs font-bold text-white">Publish Active to Investor Area</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Submit button bar */}
                <div className="pt-4 border-t border-white/[0.08] flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 rounded-xl glass border border-white/10 text-white font-bold hover:bg-white/5 transition-all text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold transition-all glow-blue flex items-center justify-center gap-2 text-sm"
                  >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    {saving ? 'Saving...' : 'Save Master Trader'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
