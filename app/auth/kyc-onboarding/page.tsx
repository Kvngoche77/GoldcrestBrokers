'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShieldCheck, FileText, CheckCircle2, ArrowRight, Loader2, Shield } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

export default function KYCOnboardingPage() {
  const { profile, refreshProfile } = useAuth();
  const router = useRouter();
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
      const { error } = await supabase
        .from('profiles')
        .update({ 
          kyc_status: 'pending',
          address: formData.address 
        })
        .eq('id', profile?.id);

      if (error) throw error;
      
      await refreshProfile();
      toast.success('Verification submitted! Redirecting to dashboard...');
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (error: any) {
      toast.error('Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    toast.success('Redirecting to dashboard...');
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#040c18] flex items-center justify-center p-6">
      <motion.div 
        className="w-full max-w-2xl"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(37,99,235,0.3)]">
            <Shield size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Secure Your Account</h1>
          <p className="text-slate-400">Step 3 of 3: Verify your identity to unlock full trading limits</p>
        </div>

        <div className="glass-strong rounded-3xl p-8 overflow-hidden relative">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1 space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 size={14} className="text-emerald-400" />
                  </div>
                  <p className="text-sm text-slate-300">Unrestricted withdrawals up to $50,000 daily</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 size={14} className="text-emerald-400" />
                  </div>
                  <p className="text-sm text-slate-300">Priority customer support access</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 size={14} className="text-emerald-400" />
                  </div>
                  <p className="text-sm text-slate-300">Eligible for high-yield investment plans</p>
                </div>
              </div>

              <div className="h-px bg-white/5" />

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block">ID Type</label>
                    <select
                      value={formData.idType}
                      onChange={(e) => setFormData({ ...formData, idType: e.target.value })}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/60 transition-all appearance-none"
                    >
                      <option value="passport" className="bg-[#060d1a]">Passport</option>
                      <option value="national_id" className="bg-[#060d1a]">National ID</option>
                      <option value="drivers_license" className="bg-[#060d1a]">Driver&apos;s License</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block">ID Number</label>
                    <input
                      type="text"
                      value={formData.idNumber}
                      onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                      placeholder="e.g. A12345678"
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/60 transition-all"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs text-slate-400 mb-1.5 block">Date of Birth</label>
                    <input
                      type="date"
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/60 transition-all [color-scheme:dark]"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 glow-blue"
                  >
                    {submitting ? <Loader2 size={18} className="animate-spin" /> : 'Submit for Review'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    Skip for later <ArrowRight size={16} />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
