'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Mail, Send, Users, Search, Loader2, CheckCircle, Sparkles, Globe } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';
import toast from 'react-hot-toast';

interface UserWithProfile extends Profile {
  email?: string;
}

const OCCASION_TEMPLATES: { label: string; subject: string; html: (name: string) => string }[] = [
  {
    label: '🎉 Welcome / Onboarding',
    subject: 'Welcome to Goldcrest Brokers — Your Journey Starts Here!',
    html: (name) => `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px;">
        <h1 style="color:#3b82f6;margin-bottom:16px;">Welcome, ${name}! 🎉</h1>
        <p style="color:#334155;font-size:16px;line-height:1.6;">We're thrilled to have you on board at <strong>Goldcrest Brokers</strong>. Your account is all set and ready to go.</p>
        <p style="color:#334155;font-size:16px;line-height:1.6;">Start by depositing funds and exploring our investment plans, copy trading, and spot trading features.</p>
        <p style="margin:30px 0;text-align:center;">
          <a href="https://goldcrestbroker.com/dashboard" style="background-color:#3b82f6;color:white;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;">Go to Dashboard</a>
        </p>
        <hr style="border:0;border-top:1px solid #e2e8f0;margin:30px 0;"/>
        <p style="color:#64748b;font-size:14px;">Goldcrest Brokers Team</p>
      </div>`,
  },
  {
    label: '📢 Special Promotion',
    subject: 'Exclusive Offer Just for You — Don\'t Miss Out!',
    html: (name) => `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #f59e0b;border-radius:12px;background:#fffbeb;">
        <h1 style="color:#d97706;margin-bottom:16px;">🔥 Special Offer for You, ${name}!</h1>
        <p style="color:#334155;font-size:16px;line-height:1.6;">We have an exclusive promotion available just for our valued users. For a limited time, enjoy <strong>boosted ROI</strong> on selected investment plans.</p>
        <p style="color:#334155;font-size:16px;line-height:1.6;">Log in now to take advantage of this limited-time opportunity before it expires.</p>
        <p style="margin:30px 0;text-align:center;">
          <a href="https://goldcrestbroker.com/dashboard/invest" style="background-color:#f59e0b;color:white;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;">View Investment Plans</a>
        </p>
        <hr style="border:0;border-top:1px solid #fde68a;margin:30px 0;"/>
        <p style="color:#92400e;font-size:14px;">Goldcrest Brokers Team</p>
      </div>`,
  },
  {
    label: '⚠️ KYC Reminder',
    subject: 'Action Required: Complete Your KYC Verification',
    html: (name) => `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px;">
        <h1 style="color:#f59e0b;margin-bottom:16px;">KYC Verification Required</h1>
        <p style="color:#334155;font-size:16px;line-height:1.6;">Hi ${name},</p>
        <p style="color:#334155;font-size:16px;line-height:1.6;">Your account is almost ready! To unlock all features including withdrawals and higher investment limits, please complete your <strong>KYC verification</strong>.</p>
        <p style="color:#334155;font-size:16px;line-height:1.6;">It only takes a few minutes. Have your government-issued ID ready.</p>
        <p style="margin:30px 0;text-align:center;">
          <a href="https://goldcrestbroker.com/dashboard/kyc" style="background-color:#f59e0b;color:white;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;">Complete KYC Now</a>
        </p>
        <hr style="border:0;border-top:1px solid #e2e8f0;margin:30px 0;"/>
        <p style="color:#64748b;font-size:14px;">Goldcrest Brokers Team</p>
      </div>`,
  },
  {
    label: '💰 Deposit Reminder',
    subject: 'Fund Your Account and Start Growing Your Wealth',
    html: (name) => `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px;">
        <h1 style="color:#10b981;margin-bottom:16px;">Ready to Grow Your Wealth?</h1>
        <p style="color:#334155;font-size:16px;line-height:1.6;">Hi ${name},</p>
        <p style="color:#334155;font-size:16px;line-height:1.6;">Your Goldcrest Brokers account is ready and waiting. Make your first deposit today and start earning through our high-yield investment plans.</p>
        <p style="color:#334155;font-size:16px;line-height:1.6;">We accept <strong>USDT (TRC20 / ERC20), Bitcoin, Ethereum</strong> and more.</p>
        <p style="margin:30px 0;text-align:center;">
          <a href="https://goldcrestbroker.com/dashboard/deposit" style="background-color:#10b981;color:white;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;">Deposit Now</a>
        </p>
        <hr style="border:0;border-top:1px solid #e2e8f0;margin:30px 0;"/>
        <p style="color:#64748b;font-size:14px;">Goldcrest Brokers Team</p>
      </div>`,
  },
  {
    label: '🔔 Account Update',
    subject: 'Important Update Regarding Your Account',
    html: (name) => `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px;">
        <h1 style="color:#0f172a;margin-bottom:16px;">Account Notice</h1>
        <p style="color:#334155;font-size:16px;line-height:1.6;">Hi ${name},</p>
        <p style="color:#334155;font-size:16px;line-height:1.6;">We're reaching out with an important update regarding your Goldcrest Brokers account. Please log in to your dashboard to review the latest activity and updates.</p>
        <p style="margin:30px 0;text-align:center;">
          <a href="https://goldcrestbroker.com/dashboard" style="background-color:#3b82f6;color:white;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;">View My Account</a>
        </p>
        <hr style="border:0;border-top:1px solid #e2e8f0;margin:30px 0;"/>
        <p style="color:#64748b;font-size:14px;">Goldcrest Brokers Team</p>
      </div>`,
  },
];

export default function AdminEmailsPage() {
  const [recipientMode, setRecipientMode] = useState<'single' | 'all'>('single');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [subject, setSubject] = useState('');
  const [htmlBody, setHtmlBody] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(-1);
  const [sentLog, setSentLog] = useState<{ to: string; subject: string; time: string }[]>([]);

  const { data: users = [] } = useQuery({
    queryKey: ['all-users-emails'],
    queryFn: async (): Promise<UserWithProfile[]> => {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      return (data as UserWithProfile[]) ?? [];
    },
  });

  const filteredUsers = users.filter(u =>
    u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedUser = users.find(u => u.id === selectedUserId);

  const applyTemplate = (idx: number) => {
    const tpl = OCCASION_TEMPLATES[idx];
    if (!tpl) return;
    setSelectedTemplate(idx);
    setSubject(tpl.subject);
    const recipientName = recipientMode === 'single' ? (selectedUser?.full_name || selectedUser?.username || 'Trader') : 'Trader';
    setHtmlBody(tpl.html(recipientName).trim());
  };

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!subject.trim() || !htmlBody.trim()) throw new Error('Subject and message body are required');

      const targets: { id: string; name: string }[] =
        recipientMode === 'all'
          ? users.map(u => ({ id: u.id, name: u.full_name || u.username || 'Trader' }))
          : selectedUserId
          ? [{ id: selectedUserId, name: selectedUser?.full_name || selectedUser?.username || 'Trader' }]
          : [];

      if (targets.length === 0) throw new Error('Please select at least one recipient');

      const results = await Promise.allSettled(
        targets.map(t =>
          fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'followup_email',
              user_id: t.id,
              custom_subject: subject.trim(),
              custom_html: htmlBody.trim(),
            }),
          })
        )
      );

      const failed = results.filter(r => r.status === 'rejected').length;
      if (failed === targets.length) throw new Error('All email sends failed');
      return { sent: targets.length - failed, failed, targets };
    },
    onSuccess: ({ sent, failed, targets }) => {
      const now = new Date().toLocaleString();
      setSentLog(prev => [
        { to: recipientMode === 'all' ? `All Users (${targets.length})` : (selectedUser?.username || 'User'), subject, time: now },
        ...prev.slice(0, 19),
      ]);
      if (failed > 0) {
        toast.success(`Sent to ${sent} user(s). ${failed} failed.`);
      } else {
        toast.success(`Email sent successfully to ${sent} user(s)!`);
      }
      setSubject('');
      setHtmlBody('');
      setSelectedUserId('');
      setSelectedTemplate(-1);
    },
    onError: (err: any) => toast.error(err.message || 'Failed to send email'),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Mail className="text-blue-400" size={28} />
          Send Follow-Up Emails
        </h1>
        <p className="text-slate-400 text-sm mt-1">Send transactional or occasion-based emails directly to users via Resend</p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Compose */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-3 glass rounded-2xl p-6 border border-white/[0.05] space-y-5"
        >
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Send size={18} className="text-blue-400" /> Compose Email
          </h2>

          {/* Recipient Mode */}
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Send To</label>
            <div className="flex gap-2">
              <button
                onClick={() => setRecipientMode('single')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${recipientMode === 'single' ? 'bg-blue-600 text-white' : 'glass text-slate-400 hover:text-white border border-white/10'}`}
              >
                <Users size={14} /> Single User
              </button>
              <button
                onClick={() => setRecipientMode('all')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${recipientMode === 'all' ? 'bg-amber-600 text-white' : 'glass text-slate-400 hover:text-white border border-white/10'}`}
              >
                <Globe size={14} /> All Users ({users.length})
              </button>
            </div>
          </div>

          {/* User selector */}
          {recipientMode === 'single' && (
            <div className="relative">
              <label className="text-xs text-slate-400 mb-2 block">Recipient *</label>
              <button
                onClick={() => setShowUserSelector(!showUserSelector)}
                className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl text-left text-sm text-white hover:bg-white/[0.08] transition-colors flex items-center justify-between"
              >
                {selectedUser ? (
                  <span className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-400">
                      {selectedUser.username?.[0]?.toUpperCase()}
                    </span>
                    {selectedUser.username} — {selectedUser.full_name}
                  </span>
                ) : (
                  <span className="text-slate-400">Select a user...</span>
                )}
                <Users size={14} className="text-slate-400 flex-shrink-0" />
              </button>
              {showUserSelector && (
                <div className="absolute z-50 w-full mt-2 glass rounded-xl border border-white/[0.1] max-h-64 overflow-hidden shadow-2xl">
                  <div className="p-3 border-b border-white/[0.05]">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50"
                      />
                    </div>
                  </div>
                  <div className="overflow-y-auto max-h-48 divide-y divide-white/[0.03]">
                    {filteredUsers.map(user => (
                      <button
                        key={user.id}
                        onClick={() => { setSelectedUserId(user.id); setShowUserSelector(false); }}
                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/[0.06] transition-colors"
                      >
                        <p className="text-white font-medium">{user.username}</p>
                        <p className="text-slate-500 text-xs">{user.full_name}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Occasion Templates */}
          <div>
            <label className="text-xs text-slate-400 mb-2 flex items-center gap-1 block">
              <Sparkles size={12} /> Quick Templates
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {OCCASION_TEMPLATES.map((tpl, idx) => (
                <button
                  key={idx}
                  onClick={() => applyTemplate(idx)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium text-left transition-all border ${
                    selectedTemplate === idx
                      ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
                      : 'border-white/10 bg-white/[0.02] text-slate-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  {tpl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Subject *</label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Enter email subject"
              className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 transition-all"
            />
          </div>

          {/* HTML Body */}
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Email Body (HTML) *</label>
            <textarea
              value={htmlBody}
              onChange={e => setHtmlBody(e.target.value)}
              placeholder="Write plain text or paste HTML content here..."
              rows={8}
              className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 resize-none font-mono transition-all"
            />
            <p className="text-xs text-slate-600 mt-1">Tip: You can paste plain text or full HTML. Templates above auto-fill this field.</p>
          </div>

          <button
            onClick={() => sendMutation.mutate()}
            disabled={sendMutation.isPending || !subject || !htmlBody || (recipientMode === 'single' && !selectedUserId)}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-slate-700 disabled:to-slate-600 disabled:opacity-60 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 glow-blue"
          >
            {sendMutation.isPending ? (
              <><Loader2 className="animate-spin" size={18} /> Sending...</>
            ) : (
              <><Send size={18} /> {recipientMode === 'all' ? `Send to All ${users.length} Users` : 'Send Email'}</>
            )}
          </button>
        </motion.div>

        {/* Sent Log */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 glass rounded-2xl p-6 border border-white/[0.05]"
        >
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <CheckCircle size={18} className="text-emerald-400" /> Session Sent Log
          </h2>

          {sentLog.length === 0 ? (
            <div className="text-center py-12">
              <Mail size={32} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No emails sent this session</p>
              <p className="text-slate-600 text-xs mt-1">Your sent emails will appear here</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {sentLog.map((log, i) => (
                <div key={i} className="p-3 bg-white/[0.03] rounded-xl border border-white/[0.05]">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-semibold text-white truncate flex-1">{log.subject}</p>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex-shrink-0">Sent</span>
                  </div>
                  <p className="text-xs text-slate-400">To: {log.to}</p>
                  <p className="text-[10px] text-slate-600 mt-1">{log.time}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
