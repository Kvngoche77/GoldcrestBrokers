'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { ShieldCheck, FileText, CheckCircle2, Clock, XCircle, Loader2 } from 'lucide-react';

export default function KYCPage() {
  const { profile, refreshProfile } = useAuth();
  
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    idType: 'passport',
    idNumber: '',
    dob: '',
    address: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.idNumber || !formData.dob || !formData.address) {
      return toast.error('Please fill in all fields');
    }
    
    setSubmitting(true);
    try {
      // In a real app, we'd save the form data to a kyc_submissions table
      // For now, we'll just update the profile status to pending
      const { error } = await supabase
        .from('profiles')
        .update({ kyc_status: 'pending' })
        .eq('id', profile?.id);

      if (error) throw error;
      
      await refreshProfile();
      toast.success('KYC application submitted successfully');
    } catch (error: any) {
      toast.error('Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ShieldCheck className="text-blue-500" /> Identity Verification
        </h1>
        <p className="text-slate-400 text-sm mt-1">Complete your KYC verification to unlock all platform features.</p>
      </div>

      {profile.kyc_status === 'verified' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-8 text-center border border-emerald-500/20 bg-emerald-500/[0.02]">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Account Verified</h2>
          <p className="text-slate-400 text-sm">Your identity has been successfully verified. You have full access to all features including unrestricted withdrawals.</p>
        </motion.div>
      )}

      {profile.kyc_status === 'pending' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-8 text-center border border-amber-500/20 bg-amber-500/[0.02]">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
            <Clock size={32} className="text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Verification Pending</h2>
          <p className="text-slate-400 text-sm">Your documents are currently under review by our compliance team. This process typically takes 1-2 business days.</p>
        </motion.div>
      )}

      {(profile.kyc_status === 'rejected' || !profile.kyc_status) && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6 md:p-8">
          {profile.kyc_status === 'rejected' && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex gap-3 items-start">
              <XCircle className="text-red-400 shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="text-sm font-semibold text-red-400">Previous Application Rejected</h3>
                <p className="text-xs text-red-400/80 mt-1">Please ensure your details are accurate and your ID number is valid before submitting again.</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/[0.05]">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-white">Submit Details</h2>
              <p className="text-xs text-slate-400">Provide your official identification details</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Document Type</label>
                <select
                  value={formData.idType}
                  onChange={(e) => setFormData({ ...formData, idType: e.target.value })}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/60 transition-all appearance-none"
                >
                  <option value="passport" className="bg-[#060d1a]">Passport</option>
                  <option value="national_id" className="bg-[#060d1a]">National ID Card</option>
                  <option value="drivers_license" className="bg-[#060d1a]">Driver's License</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Document Number</label>
                <input
                  type="text"
                  value={formData.idNumber}
                  onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                  placeholder="e.g. A12345678"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 transition-all"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Date of Birth</label>
                <input
                  type="date"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 transition-all [color-scheme:dark]"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-slate-400 mb-1.5 block">Residential Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Full street address, city, and postal code"
                  rows={3}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 transition-all resize-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-white/[0.05] flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 glow-blue"
              >
                {submitting ? <Loader2 size={18} className="animate-spin" /> : 'Submit Application'}
              </button>
            </div>
          </form>
        </motion.div>
      )}
    </div>
  );
}
