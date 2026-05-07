'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, Save, Loader2, ShieldCheck, X, QrCode, Copy, CheckCircle, AlertTriangle } from 'lucide-react';

// Simulated TOTP secret and QR code for demo
const DEMO_SECRET = 'JBSWY3DPEHPK3PXP';
const DEMO_QR_URL = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=otpauth://totp/GoldcrestBroker?secret=${DEMO_SECRET}&issuer=GoldcrestBroker&color=ffffff&bgcolor=060d1a`;

export default function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | '2fa'>('profile');

  // Profile state
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [country, setCountry] = useState(profile?.country || '');
  const [profileSaving, setProfileSaving] = useState(false);

  // Security state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securitySaving, setSecuritySaving] = useState(false);

  // 2FA state
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [secretCopied, setSecretCopied] = useState(false);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setProfileSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName, phone, country })
        .eq('id', profile.id);
      if (error) throw error;
      await refreshProfile();
      toast.success('Profile updated successfully');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSecuritySave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match');
    if (newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    setSecuritySaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Password updated successfully');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setSecuritySaving(false);
    }
  };

  const handleVerify2FA = async () => {
    if (verifyCode.length !== 6) return toast.error('Enter the 6-digit code from your authenticator app');
    setVerifying(true);
    // Simulate verification (in production, validate TOTP against server)
    await new Promise(r => setTimeout(r, 1200));
    setVerifying(false);
    if (verifyCode === '123456' || verifyCode.length === 6) { // Demo: accept any 6-digit code
      setTwoFAEnabled(true);
      setShowSetup(false);
      setVerifyCode('');
      toast.success('Two-Factor Authentication enabled!');
    } else {
      toast.error('Invalid code. Please try again.');
    }
  };

  const handleDisable2FA = () => {
    setTwoFAEnabled(false);
    toast.success('Two-Factor Authentication disabled');
  };

  const copySecret = () => {
    navigator.clipboard.writeText(DEMO_SECRET);
    setSecretCopied(true);
    setTimeout(() => setSecretCopied(false), 2000);
    toast.success('Secret copied!');
  };

  if (!profile) return null;

  const initials = profile.full_name?.slice(0, 2).toUpperCase() || profile.username?.slice(0, 2).toUpperCase() || 'U';

  const tabs = [
    { key: 'profile' as const, label: 'Profile', icon: User },
    { key: 'security' as const, label: 'Security', icon: Lock },
    { key: '2fa' as const, label: '2FA', icon: ShieldCheck },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your account settings and preferences.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/[0.05] mb-6">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-3 text-sm font-medium transition-colors relative ${
              activeTab === key ? 'text-blue-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Icon size={16} />
              {label}
              {key === '2fa' && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${twoFAEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-500'}`}>
                  {twoFAEnabled ? 'ON' : 'OFF'}
                </span>
              )}
            </div>
            {activeTab === key && (
              <motion.div layoutId="activeSettingsTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
            )}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-3xl font-bold text-white shadow-xl border-4 border-[#060d1a]">
                {initials}
              </div>
              <div className="text-center">
                <p className="font-semibold text-white">{profile.username}</p>
                <p className="text-xs text-slate-400">Joined {new Date(profile.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            <form onSubmit={handleProfileSave} className="flex-1 space-y-4 w-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Username (Immutable)</label>
                  <input
                    type="text"
                    value={profile.username || ''}
                    disabled
                    className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 text-sm text-slate-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Email (Immutable)</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 text-sm text-slate-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+1 234 567 8900"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 transition-all"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-slate-400 mb-1.5 block">Country</label>
                  <input
                    type="text"
                    value={country}
                    onChange={e => setCountry(e.target.value)}
                    placeholder="United States"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 transition-all"
                  />
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 glow-blue"
                >
                  {profileSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6 md:p-8">
          <div className="max-w-md">
            <h2 className="text-lg font-semibold text-white mb-6">Change Password</h2>
            <form onSubmit={handleSecuritySave} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 transition-all"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 transition-all"
                />
              </div>
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={securitySaving || !newPassword || !confirmPassword}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 glow-blue"
                >
                  {securitySaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      )}

      {/* 2FA Tab */}
      {activeTab === '2fa' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Status Card */}
          <div className={`glass rounded-2xl p-6 border ${twoFAEnabled ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/[0.05]'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${twoFAEnabled ? 'bg-emerald-500/20' : 'bg-slate-500/10'}`}>
                  <ShieldCheck size={28} className={twoFAEnabled ? 'text-emerald-400' : 'text-slate-500'} />
                </div>
                <div>
                  <h2 className="font-semibold text-white text-lg">Two-Factor Authentication</h2>
                  <p className="text-sm text-slate-400 mt-0.5">
                    {twoFAEnabled
                      ? 'Your account is protected with 2FA via Authenticator App'
                      : 'Add an extra layer of security to your account'}
                  </p>
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold mt-2 px-2.5 py-1 rounded-full ${twoFAEnabled ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-500/15 text-slate-400'}`}>
                    {twoFAEnabled ? <CheckCircle size={11} /> : <AlertTriangle size={11} />}
                    {twoFAEnabled ? 'Enabled & Active' : 'Not Enabled'}
                  </span>
                </div>
              </div>
              {twoFAEnabled ? (
                <button
                  onClick={handleDisable2FA}
                  className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-semibold rounded-xl transition-all border border-red-500/20"
                >
                  Disable 2FA
                </button>
              ) : (
                <button
                  onClick={() => setShowSetup(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all glow-blue"
                >
                  Enable 2FA
                </button>
              )}
            </div>
          </div>

          {/* How it works */}
          <div className="glass rounded-2xl p-6 border border-white/[0.05]">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <QrCode size={16} className="text-blue-400" />
              How Two-Factor Authentication Works
            </h3>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { step: '1', title: 'Install App', desc: 'Download Google Authenticator or Authy on your phone' },
                { step: '2', title: 'Scan QR Code', desc: 'Scan the QR code we provide to add Goldcrest Broker to your app' },
                { step: '3', title: 'Verify Code', desc: 'Enter the 6-digit code from your app to complete setup' },
              ].map(s => (
                <div key={s.step} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-sm font-bold text-blue-400 flex-shrink-0">
                    {s.step}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{s.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Setup Modal */}
          <AnimatePresence>
            {showSetup && (
              <motion.div
                className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="glass-strong rounded-2xl p-6 w-full max-w-md border border-white/10 shadow-2xl"
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                >
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-bold text-white">Setup 2FA</h2>
                    <button onClick={() => setShowSetup(false)} className="text-slate-500 hover:text-white transition-colors">
                      <X size={20} />
                    </button>
                  </div>

                  {/* Step 1: QR Code */}
                  <div className="text-center mb-5">
                    <p className="text-sm text-slate-400 mb-4">
                      Scan this QR code with <strong className="text-white">Google Authenticator</strong> or <strong className="text-white">Authy</strong>
                    </p>
                    <div className="inline-block p-3 bg-white rounded-2xl shadow-2xl">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={DEMO_QR_URL} alt="2FA QR Code" width={160} height={160} className="rounded-xl" />
                    </div>
                  </div>

                  {/* Manual Key */}
                  <div className="mb-5">
                    <p className="text-xs text-slate-500 mb-2 text-center">Or enter this secret key manually:</p>
                    <div className="flex items-center gap-2 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3">
                      <code className="flex-1 text-sm font-mono text-blue-400 tracking-widest">{DEMO_SECRET}</code>
                      <button onClick={copySecret} className="text-slate-500 hover:text-blue-400 transition-colors flex-shrink-0">
                        {secretCopied ? <CheckCircle size={16} className="text-emerald-400" /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Verify Code */}
                  <div className="mb-5">
                    <label className="text-xs text-slate-400 mb-1.5 block">Enter the 6-digit code from your app</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={verifyCode}
                      onChange={e => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-lg text-white text-center font-mono placeholder-slate-600 focus:outline-none focus:border-blue-500/60 tracking-[0.5em] transition-all"
                    />
                  </div>

                  <button
                    onClick={handleVerify2FA}
                    disabled={verifyCode.length !== 6 || verifying}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 glow-blue"
                  >
                    {verifying ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                    Verify & Enable 2FA
                  </button>

                  <p className="text-[10px] text-slate-600 text-center mt-3">
                    For demo purposes, any 6-digit code will be accepted.
                  </p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
