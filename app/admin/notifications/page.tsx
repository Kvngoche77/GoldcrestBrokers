'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { BellRing, Send, Loader2, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Profile } from '@/types';

export default function AdminNotificationsPage() {
  const [submitting, setSubmitting] = useState(false);
  const [targetType, setTargetType] = useState<'all' | 'specific'>('all');
  const [selectedUserId, setSelectedUserId] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'success' | 'warning' | 'error',
    link: '',
  });

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users-list'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('id, username, full_name').order('username');
      return (data as Profile[]) || [];
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.message) {
      return toast.error('Title and message are required');
    }
    if (targetType === 'specific' && !selectedUserId) {
      return toast.error('Please select a user');
    }

    setSubmitting(true);
    try {
      if (targetType === 'specific') {
        const { error } = await supabase.from('notifications').insert({
          user_id: selectedUserId,
          title: formData.title,
          message: formData.message,
          type: formData.type,
          link: formData.link,
          is_read: false
        });
        if (error) throw error;
      } else {
        // Send to all users
        const notifications = users.map(user => ({
          user_id: user.id,
          title: formData.title,
          message: formData.message,
          type: formData.type,
          link: formData.link,
          is_read: false
        }));
        
        // Supabase has a limit of 1000 rows per insert, but let's assume < 1000 users for this demo
        const { error } = await supabase.from('notifications').insert(notifications);
        if (error) throw error;
      }

      toast.success(`Notification sent to ${targetType === 'all' ? 'all users' : 'selected user'}`);
      setFormData({ title: '', message: '', type: 'info', link: '' });
      setSelectedUserId('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send notification');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BellRing className="text-blue-500" /> Push Notifications
        </h1>
        <p className="text-slate-400 text-sm mt-1">Send alerts and messages to user dashboards</p>
      </div>

      <div className="glass rounded-2xl p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Target Audience */}
          <div className="space-y-4">
            <h2 className="font-semibold text-white">Target Audience</h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setTargetType('all')}
                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                  targetType === 'all' 
                    ? 'bg-blue-500/10 border-blue-500/40 text-blue-400' 
                    : 'bg-white/[0.02] border-white/10 text-slate-400 hover:bg-white/[0.04]'
                }`}
              >
                <Users size={24} />
                <span className="font-medium text-sm">All Users</span>
              </button>
              <button
                type="button"
                onClick={() => setTargetType('specific')}
                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                  targetType === 'specific' 
                    ? 'bg-blue-500/10 border-blue-500/40 text-blue-400' 
                    : 'bg-white/[0.02] border-white/10 text-slate-400 hover:bg-white/[0.04]'
                }`}
              >
                <BellRing size={24} />
                <span className="font-medium text-sm">Specific User</span>
              </button>
            </div>

            {targetType === 'specific' && (
              <div className="mt-4">
                <label className="text-xs text-slate-400 mb-1.5 block">Select User</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/60 appearance-none"
                >
                  <option value="" className="bg-[#060d1a]">-- Choose a user --</option>
                  {usersLoading ? (
                    <option disabled className="bg-[#060d1a]">Loading users...</option>
                  ) : (
                    users.map(user => (
                      <option key={user.id} value={user.id} className="bg-[#060d1a]">
                        {user.username} {user.full_name ? `(${user.full_name})` : ''}
                      </option>
                    ))
                  )}
                </select>
              </div>
            )}
          </div>

          <div className="h-px bg-white/5" />

          {/* Message Details */}
          <div className="space-y-4">
            <h2 className="font-semibold text-white">Message Details</h2>
            
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Notification Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/60 appearance-none"
              >
                <option value="info" className="bg-[#060d1a]">Information (Blue)</option>
                <option value="success" className="bg-[#060d1a]">Success (Green)</option>
                <option value="warning" className="bg-[#060d1a]">Warning (Yellow)</option>
                <option value="error" className="bg-[#060d1a]">Alert/Error (Red)</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Special Holiday Bonus!"
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Message Body</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Write your notification message here..."
                rows={4}
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 resize-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Action Link (Optional)</label>
              <input
                type="text"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                placeholder="e.g. /dashboard/invest"
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 font-mono"
              />
              <p className="text-xs text-slate-500 mt-1">If provided, the notification will be clickable</p>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={submitting || !formData.title || !formData.message || (targetType === 'specific' && !selectedUserId)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold rounded-xl transition-all flex items-center gap-2 glow-blue"
            >
              {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              Send Notification
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
