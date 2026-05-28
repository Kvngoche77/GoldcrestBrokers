'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, ShieldCheck, User, MapPin, FileText, Check,
  ArrowRight, ArrowLeft, Loader2, UploadCloud, CreditCard, Car, BookOpen, Mail, RefreshCw, LogOut
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { countries } from './countries';

const STEPS = [
  { label: 'Personal', icon: User },
  { label: 'Demographic', icon: MapPin },
  { label: 'Identification', icon: FileText },
];

const ID_TYPES = [
  { value: 'passport', label: 'Passport', icon: BookOpen },
  { value: 'national_id', label: 'National ID', icon: CreditCard },
  { value: 'drivers_license', label: "Driver's License", icon: Car },
];

export default function KYCOnboardingPage() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [cooldown, setCooldown] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleCheckVerification = async () => {
    setVerifying(true);
    try {
      const { data: { user: updatedUser }, error } = await supabase.auth.getUser();
      if (error) throw error;
      
      if (updatedUser?.email_confirmed_at) {
        toast.success('Email verified successfully! Loading onboarding...');
        window.location.reload();
      } else {
        toast.error('Email not verified yet. Please check your inbox and spam folder.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to check verification status.');
    } finally {
      setVerifying(false);
    }
  };

  const handleResendVerification = async () => {
    if (cooldown > 0) return;
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user?.email ?? '',
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Verification email resent! Please check your spam folder.');
        setCooldown(60);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to resend verification email.');
    } finally {
      setResending(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
    router.push('/');
  };

  if (user && !user.email_confirmed_at) {
    return (
      <div className="min-h-screen bg-[#040c18] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background ambient lighting */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full blur-[120px] opacity-10 bg-gradient-to-br from-blue-600 to-indigo-600 animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full blur-[120px] opacity-10 bg-gradient-to-tr from-amber-500 to-emerald-500 animate-pulse delay-700" />
        </div>

        <motion.div 
          className="w-full max-w-lg relative z-10"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {/* Main Card */}
          <div className="glass-strong rounded-[2.5rem] p-8 md:p-10 border border-white/[0.08] bg-[#060e1d]/85 backdrop-blur-2xl text-center relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            {/* Ambient inner glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/[0.02] to-transparent pointer-events-none" />

            {/* Icon header */}
            <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 flex items-center justify-center mx-auto mb-8 shadow-[0_8px_30px_rgba(59,130,246,0.15)] relative">
              <div className="absolute inset-0 rounded-[2rem] bg-blue-500/10 animate-ping opacity-60 pointer-events-none" />
              <Mail size={40} className="text-blue-400 relative z-10 animate-pulse" />
            </div>

            {/* Titles */}
            <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-3 tracking-tight">
              Verify Your Email Address
            </h1>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed mb-6">
              Thank you for registering! We've sent a verification link to your registered email address:
            </p>

            {/* Glowing Email Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-500/[0.03] border border-blue-500/20 text-blue-400 font-semibold text-sm md:text-base mb-8 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              {user.email}
            </div>

            <p className="text-xs text-slate-500 leading-relaxed mb-8 max-w-sm mx-auto">
              Please click the link in that email to confirm your identity, activate your account, and unlock access to the onboarding forms.
            </p>

            {/* Primary Action: I've Verified */}
            <button
              onClick={handleCheckVerification}
              disabled={verifying}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-2xl transition-all shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:shadow-[0_0_40px_rgba(59,130,246,0.55)] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 text-base"
            >
              {verifying ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  Verifying Status...
                </>
              ) : (
                <>
                  <RefreshCw size={18} />
                  I've Verified My Email
                </>
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center my-6">
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className="px-3 text-[10px] uppercase font-bold text-slate-600 tracking-widest">or</span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>

            {/* Secondary Actions */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleResendVerification}
                disabled={resending || cooldown > 0}
                className="py-3 px-4 bg-white/[0.03] hover:bg-white/[0.06] active:scale-[0.98] text-white text-xs md:text-sm font-bold rounded-xl transition-all border border-white/10 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
              >
                {resending ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  'Resend Link'
                )}
                {cooldown > 0 && ` (${cooldown}s)`}
              </button>

              <button
                onClick={handleSignOut}
                className="py-3 px-4 bg-red-500/[0.04] hover:bg-red-500/[0.08] active:scale-[0.98] text-red-400 text-xs md:text-sm font-bold rounded-xl transition-all border border-red-500/10 flex items-center justify-center gap-2 hover:border-red-500/20"
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Effect to react to changes in user auth status
  useEffect(() => {
    if (user && user.email_confirmed_at) {
      // Allow onboarded/verified user
    }
  }, [user]);

  const [formData, setFormData] = useState({
    dob: '',
    email: '',
    gender: '',
    country: profile?.country || '',
    city: '',
    street: '',
    zip: '',
    idType: 'passport',
    idNumber: '',
    issueDate: '',
    expiryDate: '',
  });

  const progressWidth = ((step - 1) / (STEPS.length - 1)) * 100;

  const handleImageSelect = (file: File) => {
    if (!file.type.startsWith('image/')) return toast.error('Please upload an image');
    if (file.size > 5 * 1024 * 1024) return toast.error('Max 5MB');
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!formData.idNumber || !formData.dob || !formData.country || !formData.city) {
      return toast.error('Please fill in all required fields');
    }
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          kyc_status: 'pending',
          country: formData.country,
          address: `${formData.street}, ${formData.city}, ${formData.zip}`,
        })
        .eq('id', profile?.id);
      if (error) throw error;
      await refreshProfile();
      toast.success('Verification submitted! Redirecting...');
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch {
      toast.error('Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    toast.success('Redirecting to dashboard...');
    router.push('/dashboard');
  };

  const inputClass = "w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder-slate-600";
  const labelClass = "text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block";
  const readonlyClass = "w-full bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-3 text-sm text-slate-500 cursor-not-allowed";

  return (
    <div className="min-h-screen bg-[#040c18] flex items-center justify-center p-4 md:p-6">
      <motion.div className="w-full max-w-3xl" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(37,99,235,0.3)]">
            <Shield size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Complete Your Verification</h1>
          <p className="text-slate-400 text-sm">Verify your identity to unlock full trading features</p>
        </div>

        {/* Main Card */}
        <div className="glass-strong rounded-3xl overflow-hidden border border-white/[0.05]">

          {/* Progress Stepper */}
          <div className="relative flex items-center justify-between px-8 md:px-16 py-8 bg-white/[0.02] border-b border-white/[0.05]">
            <div className="absolute top-1/2 left-[15%] right-[15%] h-[2px] bg-white/[0.08] -translate-y-1/2 z-0">
              <motion.div
                className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                animate={{ width: `${progressWidth}%` }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
              />
            </div>
            {STEPS.map((s, i) => {
              const stepNum = i + 1;
              const isActive = stepNum === step;
              const isCompleted = stepNum < step;
              const Icon = isCompleted ? Check : s.icon;
              return (
                <button
                  key={s.label}
                  onClick={() => setStep(stepNum)}
                  className="relative z-10 flex flex-col items-center gap-2 group"
                >
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    isActive ? 'bg-blue-600 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]' :
                    isCompleted ? 'bg-emerald-500 border-emerald-400' :
                    'bg-[#0f172a] border-white/10 group-hover:border-white/20'
                  }`}>
                    <Icon size={18} className={isActive || isCompleted ? 'text-white' : 'text-slate-500'} />
                  </div>
                  <span className={`text-[11px] font-semibold transition-colors ${
                    isActive ? 'text-white' : isCompleted ? 'text-emerald-400' : 'text-slate-500'
                  }`}>{s.label}</span>
                </button>
              );
            })}
          </div>

          {/* Form Body */}
          <div className="p-6 md:p-8 min-h-[320px]">
            <AnimatePresence mode="wait">

              {/* Step 1: Personal */}
              {step === 1 && (
                <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Full Name</label>
                      <input value={profile?.full_name || ''} readOnly className={readonlyClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Username</label>
                      <input value={profile?.username || ''} readOnly className={readonlyClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Phone Number</label>
                      <input value={profile?.phone || ''} readOnly className={readonlyClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Date of Birth</label>
                      <input type="date" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} className={`${inputClass} [color-scheme:dark]`} />
                    </div>
                    <div>
                      <label className={labelClass}>Email Address</label>
                      <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="email@example.com" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Gender</label>
                      <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className={inputClass}>
                        <option value="" className="bg-[#0a1628]">Select Gender</option>
                        <option value="male" className="bg-[#0a1628]">Male</option>
                        <option value="female" className="bg-[#0a1628]">Female</option>
                        <option value="other" className="bg-[#0a1628]">Other</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Demographic */}
              {step === 2 && (
                <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Country of Residence</label>
                      <select value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} className={inputClass}>
                        <option value="" className="bg-[#0a1628]">Select Country</option>
                        {countries.map(c => <option key={c} value={c} className="bg-[#0a1628]">{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>City</label>
                      <input type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} placeholder="e.g. New York" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Zip / Postal Code</label>
                      <input type="text" value={formData.zip} onChange={e => setFormData({...formData, zip: e.target.value})} placeholder="e.g. 10001" className={inputClass} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Street Address</label>
                      <input type="text" value={formData.street} onChange={e => setFormData({...formData, street: e.target.value})} placeholder="e.g. 123 Main St, Apt 4B" className={inputClass} />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Identification */}
              {step === 3 && (
                <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <div>
                    <label className={labelClass}>Select Means of Identification</label>
                    <div className="grid grid-cols-3 gap-3 mt-2">
                      {ID_TYPES.map(t => (
                        <button key={t.value} type="button" onClick={() => setFormData({...formData, idType: t.value})}
                          className={`p-3 rounded-xl border text-center transition-all ${
                            formData.idType === t.value
                              ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_0_1px_rgba(59,130,246,0.5)]'
                              : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                          }`}>
                          <t.icon size={20} className={formData.idType === t.value ? 'text-blue-400 mx-auto mb-1' : 'text-slate-500 mx-auto mb-1'} />
                          <span className={`text-xs font-semibold ${formData.idType === t.value ? 'text-white' : 'text-slate-400'}`}>{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className={labelClass}>{ID_TYPES.find(t => t.value === formData.idType)?.label} Number</label>
                      <input type="text" value={formData.idNumber} onChange={e => setFormData({...formData, idNumber: e.target.value})} placeholder="Enter number" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Issue Date</label>
                      <input type="date" value={formData.issueDate} onChange={e => setFormData({...formData, issueDate: e.target.value})} className={`${inputClass} [color-scheme:dark]`} />
                    </div>
                    <div>
                      <label className={labelClass}>Expiry Date</label>
                      <input type="date" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} className={`${inputClass} [color-scheme:dark]`} />
                    </div>
                  </div>

                  {/* Upload */}
                  <div>
                    <label className={labelClass}>Upload ID Document</label>
                    <div
                      className="mt-2 border-2 border-dashed border-white/10 rounded-xl p-6 text-center cursor-pointer hover:border-blue-500/40 transition-colors group"
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleImageSelect(f); }}
                    >
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImageSelect(f); }} />
                      {imagePreview ? (
                        <div className="relative">
                          <img src={imagePreview} alt="Preview" className="max-h-40 mx-auto rounded-lg object-cover" />
                          <p className="text-xs text-slate-500 mt-2">Click to change</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-slate-500 group-hover:text-slate-400 transition-colors">
                          <UploadCloud size={28} />
                          <p className="text-sm font-medium">Click to upload or drag and drop</p>
                          <p className="text-[10px] text-slate-600">JPG, PNG — max 5MB</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-6 md:px-8 py-5 border-t border-white/[0.05] bg-white/[0.01] flex items-center justify-between gap-3">
            <button type="button" onClick={handleSkip} className="text-sm text-slate-500 hover:text-white transition-colors">
              Skip for later
            </button>
            <div className="flex gap-3">
              {step > 1 && (
                <button onClick={() => setStep(step - 1)} className="px-5 py-2.5 rounded-xl border border-white/10 text-white text-sm font-semibold hover:bg-white/5 transition-all flex items-center gap-2">
                  <ArrowLeft size={16} /> Back
                </button>
              )}
              {step < 3 ? (
                <button onClick={() => setStep(step + 1)} className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all flex items-center gap-2 glow-blue">
                  Next <ArrowRight size={16} />
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={submitting} className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold transition-all flex items-center gap-2 glow-blue">
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                  {submitting ? 'Submitting...' : 'Submit Verification'}
                </button>
              )}
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
