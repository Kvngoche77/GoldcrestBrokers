'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Headphones, Send, Clock, CheckCircle, AlertCircle, X, Loader2,
  ChevronRight, MessageSquare, Filter
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

type Ticket = {
  id: string;
  user_id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  admin_note: string;
  created_at: string;
  updated_at: string;
  user_profile?: { username: string | null; full_name: string | null } | null;
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

function timeAgo(dateStr: string): string {
  const secs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function AdminSupportPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [replyText, setReplyText] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [newStatus, setNewStatus] = useState('');

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['admin-support-tickets', filterStatus],
    queryFn: async (): Promise<Ticket[]> => {
      let query = supabase
        .from('support_tickets')
        .select('*, user_profile:profiles!user_id(username, full_name)')
        .order('created_at', { ascending: false });
      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Ticket[];
    },
    refetchInterval: 30000,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['admin-support-messages', selectedTicket?.id],
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

  const sendReply = useMutation({
    mutationFn: async () => {
      if (!user?.id || !selectedTicket?.id) throw new Error('Missing data');
      if (!replyText.trim()) throw new Error('Message is required');
      
      const { error } = await supabase.from('support_messages').insert({
        ticket_id: selectedTicket.id,
        sender_id: user.id,
        message: replyText.trim(),
        is_admin_reply: true,
      });
      
      if (error) {
        console.error('Error sending reply:', error);
        throw error;
      }
      
      // Auto-set to in_progress if still open
      if (selectedTicket.status === 'open') {
        await supabase.from('support_tickets').update({ status: 'in_progress', updated_at: new Date().toISOString() }).eq('id', selectedTicket.id);
        setSelectedTicket(prev => prev ? { ...prev, status: 'in_progress' } : null);
      }
    },
    onSuccess: () => {
      setReplyText('');
      queryClient.invalidateQueries({ queryKey: ['admin-support-messages', selectedTicket?.id] });
      queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] });
      toast.success('Reply sent!');
    },
    onError: (error) => {
      console.error('Failed to send reply:', error);
      toast.error('Failed to send reply. Please try again.');
    },
  });

  const updateTicket = useMutation({
    mutationFn: async ({ status, note }: { status?: string; note?: string }) => {
      if (!selectedTicket?.id) throw new Error('No ticket selected');
      const updates: Record<string, string> = { updated_at: new Date().toISOString() };
      if (status) updates.status = status;
      if (note !== undefined) updates.admin_note = note;
      const { error } = await supabase.from('support_tickets').update(updates).eq('id', selectedTicket.id);
      if (error) {
        console.error('Error updating ticket:', error);
        throw error;
      }
    },
    onSuccess: (_, vars) => {
      toast.success('Ticket updated');
      setSelectedTicket(prev => prev ? {
        ...prev,
        ...(vars.status ? { status: vars.status } : {}),
        ...(vars.note !== undefined ? { admin_note: vars.note } : {}),
      } : null);
      queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] });
    },
    onError: (error) => {
      console.error('Failed to update ticket:', error);
      toast.error('Failed to update ticket. Please try again.');
    },
  });

  const counts = {
    all: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    in_progress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Headphones size={24} className="text-blue-400" />
            Support Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage and respond to user support tickets</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'all', label: 'All' },
          { key: 'open', label: 'Open' },
          { key: 'in_progress', label: 'In Progress' },
          { key: 'resolved', label: 'Resolved' },
          { key: 'closed', label: 'Closed' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilterStatus(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
              filterStatus === tab.key
                ? 'bg-blue-600/20 text-blue-400 border-blue-500/30'
                : 'glass text-slate-400 hover:text-white border-white/[0.05]'
            }`}
          >
            {tab.label}
            {tab.key !== 'closed' && (
              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-md ${filterStatus === tab.key ? 'bg-blue-500/20' : 'bg-white/[0.05]'}`}>
                {counts[tab.key as keyof typeof counts] ?? 0}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-4">
        {/* Ticket list */}
        <div className="lg:col-span-2 glass rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.05]">
            <p className="text-sm font-semibold text-white">All Tickets</p>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="animate-spin text-blue-400" size={24} />
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <MessageSquare size={32} className="text-slate-600 mb-3" />
              <p className="text-slate-400 text-sm">No tickets found</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04] overflow-y-auto" style={{ maxHeight: '600px' }}>
              {tickets.map(ticket => {
                const s = STATUS_STYLES[ticket.status] ?? STATUS_STYLES.open;
                const StatusIcon = s.icon;
                const username = ticket.user_profile?.username ?? ticket.user_profile?.full_name ?? 'User';
                return (
                  <button
                    key={ticket.id}
                    onClick={() => { setSelectedTicket(ticket); setAdminNote(ticket.admin_note || ''); setNewStatus(ticket.status); }}
                    className={`w-full px-4 py-3 text-left hover:bg-white/[0.03] transition-colors ${selectedTicket?.id === ticket.id ? 'bg-blue-600/10 border-l-2 border-blue-500' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-blue-400 font-medium mb-0.5">@{username}</p>
                        <p className="text-sm font-medium text-white truncate">{ticket.subject}</p>
                      </div>
                      <ChevronRight size={14} className="text-slate-600 flex-shrink-0 mt-1" />
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${s.color}`}>
                        <StatusIcon size={9} />
                        {s.label}
                      </span>
                      <span className="text-[10px] text-slate-500 capitalize">{ticket.category}</span>
                      <span className="text-[10px] text-slate-600 ml-auto">{timeAgo(ticket.created_at)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Ticket detail */}
        <div className="lg:col-span-3 glass rounded-2xl overflow-hidden flex flex-col" style={{ minHeight: '500px' }}>
          {!selectedTicket ? (
            <div className="flex flex-col items-center justify-center flex-1 py-20 px-6 text-center">
              <Headphones size={40} className="text-slate-700 mb-4" />
              <p className="text-slate-400 text-sm">Select a ticket to manage it</p>
            </div>
          ) : (
            <>
              {/* Ticket header */}
              <div className="px-5 py-4 border-b border-white/[0.05]">
                <p className="font-semibold text-white">{selectedTicket.subject}</p>
                <p className="text-xs text-blue-400 mt-0.5">@{selectedTicket.user_profile?.username ?? 'User'} · {selectedTicket.category} · {timeAgo(selectedTicket.created_at)}</p>

                {/* Admin controls */}
                <div className="flex gap-2 mt-3 flex-wrap">
                  {(['open', 'in_progress', 'resolved', 'closed'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => updateTicket.mutate({ status: s })}
                      disabled={selectedTicket.status === s || updateTicket.isPending}
                      className={`text-[10px] font-medium px-3 py-1.5 rounded-lg border transition-all ${
                        selectedTicket.status === s
                          ? STATUS_STYLES[s].color
                          : 'text-slate-500 border-white/10 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      {STATUS_STYLES[s].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: '320px' }}>
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.is_admin_reply ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.is_admin_reply
                        ? 'bg-blue-600/20 border border-blue-500/20 rounded-tl-none'
                        : 'bg-white/[0.05] rounded-tr-none'
                    }`}>
                      {msg.is_admin_reply && (
                        <p className="text-[10px] text-blue-400 font-semibold mb-1">You (Admin)</p>
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

              {/* Admin note */}
              <div className="px-4 pt-3 border-t border-white/[0.05]">
                <label className="text-[10px] text-slate-500 mb-1 block">Internal Admin Note</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={adminNote}
                    onChange={e => setAdminNote(e.target.value)}
                    placeholder="Add internal note (visible to user)..."
                    className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/40 transition-all"
                  />
                  <button
                    onClick={() => updateTicket.mutate({ note: adminNote })}
                    disabled={updateTicket.isPending}
                    className="px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-xl transition-all text-xs font-medium"
                  >
                    Save
                  </button>
                </div>
              </div>

              {/* Reply input */}
              {selectedTicket.status !== 'closed' && (
                <div className="px-4 py-3">
                  <label className="text-[10px] text-slate-500 mb-1 block">Reply to User</label>
                  <div className="flex gap-2">
                    <textarea
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder="Type your reply..."
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
    </div>
  );
}
