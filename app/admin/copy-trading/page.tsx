'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Plus, Search, Edit2, Trash2, X, Save, 
  Loader2, CheckCircle2, TrendingUp,
  User, UploadCloud, ImageIcon, Link
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

type Trader = {
  id: string;
  name: string;
  avatar_url: string;
  bio: string;
  roi_percent: number;
  win_rate: number;
  total_followers: number;
  subscription_rate: number;
  is_active: boolean;
};

export default function AdminCopyTradingPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrader, setEditingTrader] = useState<Trader | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [urlMode, setUrlMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<Trader>>({
    name: '',
    bio: '',
    roi_percent: 0,
    win_rate: 0,
    total_followers: 0,
    subscription_rate: 50,
    is_active: true,
    avatar_url: ''
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
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      setFormData(prev => ({ ...prev, avatar_url: data.publicUrl }));
      setImagePreview(data.publicUrl);
      toast.success('Image uploaded!');
    } catch (err: any) {
      // Fallback: show preview locally even if bucket isn't configured
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
        toast.error('Storage bucket not configured. Using local preview only.');
      };
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleImageUpload(file);
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
      toast.success(editingTrader ? 'Trader updated' : 'Trader created');
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

  const handleEdit = (trader: Trader) => {
    setEditingTrader(trader);
    setFormData(trader);
    setImagePreview(trader.avatar_url || null);
    setUrlMode(false);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      bio: '',
      roi_percent: 0,
      win_rate: 0,
      total_followers: 0,
      subscription_rate: 50,
      is_active: true,
      avatar_url: ''
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
    if (!formData.name) return toast.error('Name is required');
    setSaving(true);
    upsertMutation.mutate(formData);
  };

  const filteredTraders = traders.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users size={24} className="text-blue-400" />
            Copy Trading Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage master traders and their performance metrics.</p>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 glow-blue"
        >
          <Plus size={18} /> Add New Trader
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Traders', value: traders.length, icon: User, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Active', value: traders.filter(t => t.is_active).length, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Avg. ROI', value: `${(traders.reduce((s,t) => s + Number(t.roi_percent), 0) / (traders.length || 1)).toFixed(1)}%`, icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Total Followers', value: traders.reduce((s,t) => s + t.total_followers, 0).toLocaleString(), icon: Users, color: 'text-rose-400', bg: 'bg-rose-500/10' },
        ].map((stat, i) => (
          <div key={i} className="glass rounded-2xl p-4 border border-white/[0.05]">
            <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
              <stat.icon size={16} className={stat.color} />
            </div>
            <p className="text-xl font-bold text-white">{stat.value}</p>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Search & List */}
      <div className="glass rounded-3xl overflow-hidden border border-white/[0.05]">
        <div className="p-4 border-b border-white/[0.05] bg-white/[0.02]">
          <div className="relative max-w-sm">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text"
              placeholder="Search traders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/[0.05] bg-white/[0.01]">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Trader</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">ROI / Win Rate</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Followers</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Rate</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {isLoading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">Loading traders...</td></tr>
              ) : filteredTraders.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">No traders found</td></tr>
              ) : (
                filteredTraders.map((trader) => (
                  <tr key={trader.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center overflow-hidden border border-white/10">
                          {trader.avatar_url ? (
                            <img src={trader.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User size={20} className="text-blue-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{trader.name}</p>
                          <p className="text-[10px] text-slate-500 truncate max-w-[150px]">{trader.bio}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <p className="text-sm font-bold text-emerald-400">+{trader.roi_percent}%</p>
                      <p className="text-[10px] text-slate-500">{trader.win_rate}% Win Rate</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <p className="text-sm font-bold text-white">{trader.total_followers.toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <p className="text-sm font-bold text-blue-400">${trader.subscription_rate}/mo</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${trader.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {trader.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleEdit(trader)}
                          className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => { if(confirm('Delete this trader?')) deleteMutation.mutate(trader.id) }}
                          className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
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

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="glass-strong rounded-3xl p-8 max-w-2xl w-full border border-white/10 shadow-2xl relative overflow-y-auto max-h-[90vh]"
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>

              <h2 className="text-2xl font-bold text-white mb-6">
                {editingTrader ? 'Edit Master Trader' : 'Create New Master Trader'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Trader Name</label>
                      <input 
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        placeholder="e.g. Satoshi Trades"
                        className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Trader Image</label>
                        <button
                          type="button"
                          onClick={() => setUrlMode(!urlMode)}
                          className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          {urlMode ? <UploadCloud size={12} /> : <Link size={12} />}
                          {urlMode ? 'Upload file' : 'Use URL instead'}
                        </button>
                      </div>

                      {urlMode ? (
                        <input
                          type="text"
                          value={formData.avatar_url}
                          onChange={e => {
                            setFormData({ ...formData, avatar_url: e.target.value });
                            setImagePreview(e.target.value);
                          }}
                          placeholder="https://example.com/avatar.jpg"
                          className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
                        />
                      ) : (
                        <div
                          className="relative border-2 border-dashed border-white/10 rounded-xl overflow-hidden cursor-pointer hover:border-blue-500/40 transition-colors group"
                          style={{ minHeight: '130px' }}
                          onClick={() => fileInputRef.current?.click()}
                          onDragOver={e => e.preventDefault()}
                          onDrop={handleFileDrop}
                        >
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }}
                          />
                          {imagePreview ? (
                            <div className="relative w-full h-32">
                              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <p className="text-xs text-white font-semibold">Click to change</p>
                              </div>
                              {uploading && (
                                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                                  <Loader2 size={24} className="animate-spin text-blue-400" />
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-8 gap-2 text-slate-500 group-hover:text-slate-400 transition-colors">
                              {uploading ? (
                                <Loader2 size={24} className="animate-spin text-blue-400" />
                              ) : (
                                <UploadCloud size={24} />
                              )}
                              <p className="text-xs font-medium">{uploading ? 'Uploading...' : 'Click or drag image here'}</p>
                              <p className="text-[10px] text-slate-600">PNG, JPG, WEBP — max 5MB</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Bio / Strategy</label>
                      <textarea 
                        value={formData.bio}
                        onChange={e => setFormData({...formData, bio: e.target.value})}
                        rows={3}
                        placeholder="Brief description of the trading strategy..."
                        className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 resize-none"
                      />
                    </div>
                  </div>

                  {/* Stats & Settings */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">ROI %</label>
                        <input 
                          type="number"
                          step="0.1"
                          value={formData.roi_percent}
                          onChange={e => setFormData({...formData, roi_percent: Number(e.target.value)})}
                          className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Win Rate %</label>
                        <input 
                          type="number"
                          step="0.1"
                          value={formData.win_rate}
                          onChange={e => setFormData({...formData, win_rate: Number(e.target.value)})}
                          className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Followers</label>
                        <input 
                          type="number"
                          value={formData.total_followers}
                          onChange={e => setFormData({...formData, total_followers: Number(e.target.value)})}
                          className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Sub Rate ($/mo)</label>
                        <input 
                          type="number"
                          value={formData.subscription_rate}
                          onChange={e => setFormData({...formData, subscription_rate: Number(e.target.value)})}
                          className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
                        />
                      </div>
                    </div>
                    <div className="pt-2">
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
                        <span className="text-sm font-semibold text-white">Visible to users</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/[0.05] flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 rounded-xl glass border border-white/10 text-white font-bold hover:bg-white/5 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold transition-all glow-blue flex items-center justify-center gap-2"
                  >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    {saving ? 'Saving...' : 'Save Trader'}
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
