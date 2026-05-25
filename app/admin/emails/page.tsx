'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Mail, Send, Users, Search, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { AdminEmail, Profile } from '@/types';
import toast from 'react-hot-toast';

interface UserWithProfile extends Profile {
  email?: string;
}

export default function AdminEmailsPage() {
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserSelector, setShowUserSelector] = useState(false);

  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: async (): Promise<UserWithProfile[]> => {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!profilesData) return [];
      return profilesData as UserWithProfile[];
    },
  });

  const { data: sentEmails = [] } = useQuery({
    queryKey: ['admin-sent-emails'],
    queryFn: async (): Promise<(AdminEmail & { recipient: Profile | null })[]> => {
      const { data } = await supabase
        .from('admin_emails')
        .select('*, recipient:profiles(*)')
        .order('created_at', { ascending: false })
        .limit(50);
      return (data as any[]) || [];
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUserId || !subject || !message) {
        throw new Error('Please fill in all fields');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('admin_emails')
        .insert({
          admin_id: user.id,
          recipient_user_id: selectedUserId,
          subject,
          message,
          status: 'sent',
        });

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      toast.success('Email sent successfully!');
      setSubject('');
      setMessage('');
      setSelectedUserId('');
      queryClient.invalidateQueries({ queryKey: ['admin-sent-emails'] });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send email';
      toast.error(errorMessage);
    },
  });

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.username?.toLowerCase().includes(searchLower) ||
      user.full_name?.toLowerCase().includes(searchLower)
    );
  });

  const selectedUser = users.find(u => u.id === selectedUserId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Mail className="text-blue-400" size={28} />
          Send Emails to Users
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Send customized emails to individual users
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 border border-white/[0.05]"
        >
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Send size={18} className="text-blue-400" />
            Compose Email
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Recipient *
              </label>
              <div className="relative">
                <button
                  onClick={() => setShowUserSelector(!showUserSelector)}
                  className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl text-left text-sm text-white hover:bg-white/[0.08] transition-colors flex items-center justify-between"
                >
                  {selectedUser ? (
                    <span>{selectedUser.username}</span>
                  ) : (
                    <span className="text-slate-400">Select a user...</span>
                  )}
                  <Users size={16} className="text-slate-400" />
                </button>

                {showUserSelector && (
                  <div className="absolute z-50 w-full mt-2 glass rounded-xl border border-white/[0.1] max-h-64 overflow-hidden">
                    <div className="p-3 border-b border-white/[0.05]">
                      <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search users..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50"
                        />
                      </div>
                    </div>
                    <div className="overflow-y-auto max-h-48">
                      {filteredUsers.map(user => (
                        <button
                          key={user.id}
                          onClick={() => {
                            setSelectedUserId(user.id);
                            setShowUserSelector(false);
                          }}
                          className="w-full px-4 py-3 text-left text-sm hover:bg-white/[0.05] transition-colors border-b border-white/[0.02] last:border-0"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                              <span className="text-xs font-semibold text-blue-400">
                                {user.username?.[0]?.toUpperCase() || 'U'}
                              </span>
                            </div>
                            <div>
                              <p className="text-white font-medium">{user.username}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Subject *
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter email subject"
                className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Message *
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your message here..."
                rows={6}
                className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 resize-none"
              />
            </div>

            <button
              onClick={() => sendEmailMutation.mutate()}
              disabled={sendEmailMutation.isPending || !selectedUserId || !subject || !message}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {sendEmailMutation.isPending ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Send Email
                </>
              )}
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-6 border border-white/[0.05]"
        >
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Mail size={18} className="text-emerald-400" />
            Recently Sent Emails
          </h2>

          {sentEmails.length === 0 ? (
            <div className="text-center py-10">
              <Mail size={32} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No emails sent yet</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {sentEmails.map((email) => (
                <div
                  key={email.id}
                  className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.04]"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white">{email.subject}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        To: {email.recipient?.username || 'Unknown'}
                      </p>
                    </div>
                    <span className={`text-[10px] font-medium px-2 py-1 rounded-full ${
                      email.status === 'sent' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}>
                      {email.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-2">{email.message}</p>
                  <p className="text-[10px] text-slate-500">
                    {new Date(email.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-xl p-4 border border-blue-500/30 bg-blue-500/10"
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="text-blue-400 flex-shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-200 mb-1">
              Email Service Integration Required
            </h3>
            <p className="text-xs text-slate-300">
              Currently, emails are recorded in the database but not actually sent. 
              To enable real email delivery, integrate with an email service provider like:
              SendGrid, Resend, AWS SES, or Postmark.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
