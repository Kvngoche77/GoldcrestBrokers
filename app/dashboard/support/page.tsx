'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Headphones, Plus, X, Send, Clock, CheckCircle, AlertCircle,
  ChevronRight, MessageSquare, Loader2, Tag, ChevronDown
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

type Ticket = {
  id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  admin_note: string;
  created_at: string;
  updated_at: string;
};

type Message = {
  id: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  is_admin_reply: boolean;
  created_at: string;
};

const STATUS_STYLES: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  open: { label: 'Open', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: Clock },
  in_progress: { label: 'In Progress', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: AlertCircle },
  resolved: { label: 'Resolved', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle },
  closed: { label: 'Closed', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20', icon: X },
};

const PRIORITY_STYLES: Record<string, string> = {
  low: 'text-slate-400',
  normal: 'text-blue-400',
  high: 'text-amber-400',
  urgent: 'text-red-400',
};

const CATEGORIES = ['general', 'deposit', 'withdrawal', 'investment', 'technical', 'kyc', 'other'];

function timeAgo(dateStr: string): string {
  const secs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function SupportPage() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [newMessage, setNewMessage] = useState('');
  const [replyText, setReplyText] = useState('');

  // Fetch tickets
  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['support-tickets', user?.id],
    queryFn: async (): Promise<Ticket[]> => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user?.id,
  });

  // Fetch messages for selected ticket
  const { data: messages = [] } = useQuery({
    queryKey: ['support-messages', selectedTicket?.id],
    queryFn: async (): Promise<Message[]> => {
      if (!selectedTicket?.id) return [];
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('ticket_id', selectedTicket.id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!selectedTicket?.id,
    refetchInterval: 15000,
  });

  // Create ticket mutation
  const createTicket = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');
      if (!newSubject.trim()) throw new Error('Subject is required');
      if (!newMessage.trim()) throw new Error('Message is required');
      
      const response = await fetch('/api/support/create-ticket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: newSubject.trim(),
          category: newCategory,
          priority: 'normal',
          message: newMessage.trim(),
          userId: user.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create ticket');
      }

      const data = await response.json();
      return data.ticket;
    },
    onSuccess: () => {
      toast.success('Support ticket created!');
      queryClient.invalidateQueries({ queryKey: ['support-tickets', user?.id] });
      setShowNew(false);
      setNewSubject('');
      setNewMessage('');
      setNewCategory('general');
    },
    onError: (err: any) => {
      console.error('Failed to create support ticket:', err);
      toast.error(err.message || 'Failed to create ticket. Please try again.');
    },
  });

  // Send reply mutation
  const sendReply = useMutation({
    mutationFn: async () => {
      if (!user?.id || !selectedTicket?.id) throw new Error('Missing data');
      if (!replyText.trim()) throw new Error('Message cannot be empty');

      const response = await fetch('/api/support/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          senderId: user.id,
          message: replyText.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      const data = await response.json();
      return data.message;
    },
    onSuccess: () => {
      toast.success('Message sent!');
      setReplyText('');
      queryClient.invalidateQueries({ queryKey: ['support-messages', selectedTicket?.id] });
    },
    onError: (err: any) => {
      console.error('Failed to send reply:', err);
      toast.error(err.message || 'Failed to send message. Please try again.');
    },

  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Headphones size={24} className="text-blue-400" />
            Support Center
          </h1>
          <p className="text-slate-400 text-sm mt-1">Our team typically responds within 24 hours</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all glow-blue"
        >
          <Plus size={16} />
          New Ticket
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: tickets.length, color: 'text-white' },
          { label: 'Open', value: tickets.filter(t => t.status === 'open').length, color: 'text-blue-400' },
          { label: 'In Progress', value: tickets.filter(t => t.status === 'in_progress').length, color: 'text-amber-400' },
          { label: 'Resolved', value: tickets.filter(t => t.status === 'resolved').length, color: 'text-emerald-400' },
        ].map(s => (
          <div key={s.label} className="glass rounded-2xl p-4 border border-white/[0.05] text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-4">
        {/* Ticket List */}
        <div className="lg:col-span-2 glass rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.05]">
            <p className="text-sm font-semibold text-white">Your Tickets</p>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="animate-spin text-blue-400" size={24} />
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <MessageSquare size={32} className="text-slate-600 mb-3" />
              <p className="text-slate-400 text-sm">No tickets yet</p>
              <p className="text-slate-600 text-xs mt-1">Click &quot;New Ticket&quot; to get help</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {tickets.map(ticket => {
                const s = STATUS_STYLES[ticket.status] ?? STATUS_STYLES.open;
                const StatusIcon = s.icon;
                return (
                  <button
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className={`w-full px-4 py-3 text-left hover:bg-white/[0.03] transition-colors ${selectedTicket?.id === ticket.id ? 'bg-blue-600/10 border-l-2 border-blue-500' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-white truncate flex-1">{ticket.subject}</p>
                      <ChevronRight size={14} className="text-slate-600 flex-shrink-0 mt-0.5" />
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${s.color}`}>
                        <StatusIcon size={9} />
                        {s.label}
                      </span>
                      <span className="text-[10px] text-slate-500 capitalize bg-white/[0.04] px-2 py-0.5 rounded-full">
                        {ticket.category}
                      </span>
                      <span className="text-[10px] text-slate-600 ml-auto">{timeAgo(ticket.created_at)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Ticket Detail / Thread */}
        <div className="lg:col-span-3 glass rounded-2xl overflow-hidden flex flex-col" style={{ minHeight: '420px' }}>
          {!selectedTicket ? (
            <div className="flex flex-col items-center justify-center flex-1 py-20 px-6 text-center">
              <Headphones size={40} className="text-slate-700 mb-4" />
              <p className="text-slate-400 text-sm">Select a ticket to view the conversation</p>
            </div>
          ) : (
            <>
              {/* Ticket header */}
              <div className="px-5 py-4 border-b border-white/[0.05]">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-white">{selectedTicket.subject}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${STATUS_STYLES[selectedTicket.status]?.color}`}>
                        {STATUS_STYLES[selectedTicket.status]?.label}
                      </span>
                      <span className="text-[10px] text-slate-500 capitalize">{selectedTicket.category}</span>
                      <span className={`text-[10px] capitalize font-semibold ${PRIORITY_STYLES[selectedTicket.priority]}`}>
                        {selectedTicket.priority} priority
                      </span>
                    </div>
                  </div>
                  <button onClick={() => setSelectedTicket(null)} className="text-slate-600 hover:text-white transition-colors">
                    <X size={16} />
                  </button>
                </div>
                {selectedTicket.admin_note && (
                  <div className="mt-3 p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                    <p className="text-xs text-amber-400 font-medium mb-1">Admin Note:</p>
                    <p className="text-xs text-amber-300">{selectedTicket.admin_note}</p>
                  </div>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: '380px' }}>
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.is_admin_reply ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.is_admin_reply
                        ? 'bg-white/[0.05] rounded-tl-none'
                        : 'bg-blue-600/20 border border-blue-500/20 rounded-tr-none'
                    }`}>
                      {msg.is_admin_reply && (
                        <p className="text-[10px] text-blue-400 font-semibold mb-1">Support Team</p>
                      )}
                      <p className="text-sm text-slate-200 leading-relaxed">{msg.message}</p>
                      <p className="text-[10px] text-slate-600 mt-1">{timeAgo(msg.created_at)}</p>
                    </div>
                  </div>
                ))}
                {messages.length === 0 && (
                  <p className="text-center text-slate-600 text-sm py-6">No messages yet</p>
                )}
              </div>

              {/* Reply input */}
              {selectedTicket.status !== 'closed' && (
                <div className="px-4 py-3 border-t border-white/[0.05]">
                  <div className="flex gap-2">
                    <textarea
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder="Type your message..."
                      rows={2}
                      className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 transition-all resize-none"
                    />
                    <button
                      onClick={() => sendReply.mutate()}
                      disabled={!replyText.trim() || sendReply.isPending}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl transition-all flex items-center justify-center self-end"
                    >
                      {sendReply.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* New Ticket Modal */}
      <AnimatePresence>
        {showNew && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowNew(false)}
          >
            <motion.div
              className="glass-strong rounded-2xl p-6 w-full max-w-lg border border-white/10 shadow-2xl"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Plus size={18} className="text-blue-400" />
                  New Support Ticket
                </h2>
                <button onClick={() => setShowNew(false)} className="text-slate-500 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Subject *</label>
                  <input
                    type="text"
                    value={newSubject}
                    onChange={e => setNewSubject(e.target.value)}
                    placeholder="Briefly describe your issue"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Category</label>
                  <div className="relative">
                    <select
                      value={newCategory}
                      onChange={e => setNewCategory(e.target.value)}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/60 transition-all appearance-none cursor-pointer"
                    >
                      {CATEGORIES.map(c => (
                        <option key={c} value={c} className="bg-[#0a1628] capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Message *</label>
                  <textarea
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Describe your issue in detail..."
                    rows={5}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 transition-all resize-none"
                  />
                </div>

                <button
                  onClick={() => createTicket.mutate()}
                  disabled={!newSubject.trim() || !newMessage.trim() || createTicket.isPending}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 glow-blue"
                >
                  {createTicket.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  Submit Ticket
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
