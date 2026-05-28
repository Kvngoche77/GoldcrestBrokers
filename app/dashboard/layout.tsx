'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, TrendingUp, Wallet, ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight,
  Users, Bell, Settings, LogOut, TrendingDown, Menu, X, Shield, ShieldCheck,
  LineChart, Newspaper, BarChart3, Headphones, Copy, Mail, RefreshCw
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { GoogleTranslate } from '@/components/GoogleTranslate';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/trade', label: 'Spot Trading', icon: LineChart },
  { href: '/dashboard/trade/copy', label: 'Copy Trading', icon: Copy },
  { href: '/dashboard/invest', label: 'Investments', icon: TrendingUp },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/deposit', label: 'Deposit', icon: ArrowDownToLine },
  { href: '/dashboard/withdraw', label: 'Withdraw', icon: ArrowUpFromLine },
  { href: '/dashboard/transfer', label: 'Transfer', icon: ArrowLeftRight },
  { href: '/dashboard/transactions', label: 'Transactions', icon: Wallet },
  { href: '/dashboard/referrals', label: 'Referrals', icon: Users },
  { href: '/dashboard/news', label: 'Market News', icon: Newspaper },
  { href: '/dashboard/kyc', label: 'KYC Verification', icon: ShieldCheck },
  { href: '/dashboard/support', label: 'Support', icon: Headphones },
  { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
        toast.success('Email verified successfully! Loading your dashboard...');
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

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unread-notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login?redirect=' + pathname);
    }
  }, [user, loading, router, pathname]);

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#040c18] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <TrendingDown size={20} className="text-white animate-pulse" />
          </div>
          <p className="text-slate-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

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
              Please click the link in that email to confirm your identity, activate your account, and unlock access to the trading terminal.
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

  const displayUsername = profile?.username || user?.user_metadata?.username || user?.email?.split('@')[0] || 'Investor';
  const displayFullName = profile?.full_name || user?.user_metadata?.full_name || 'Investor';
  const initials = displayUsername.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-[#040c18] flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#060d1a] border-r border-white/[0.05] flex flex-col transform transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-6 py-5 border-b border-white/[0.05]">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <TrendingUp size={16} className="text-white" />
          </div>
          <Link href="/" className="font-bold text-lg">
            <span className="text-white">Goldcrest</span>
            <span className="gradient-text">Broker</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Icon size={17} />
                {label}
              </Link>
            );
          })}

          {profile?.is_admin && (
            <>
              <div className="h-px bg-white/[0.05] my-2" />
              <Link
                href="/admin"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/[0.06] transition-all"
              >
                <Shield size={17} />
                Admin Panel
              </Link>
            </>
          )}
        </nav>

        {/* User footer */}
        <div className="px-3 py-4 border-t border-white/[0.05]">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">@{displayUsername}</p>
              <p className="text-xs text-slate-400">${Number(profile?.balance ?? 0).toFixed(2)}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="mt-2 w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-[#040c18]/90 backdrop-blur-xl border-b border-white/[0.05] px-4 sm:px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl glass text-slate-400 hover:text-white transition-colors"
          >
            <Menu size={20} />
          </button>
          <div className="hidden sm:block">
            <p className="text-sm text-slate-400">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
              <span className="text-white font-medium">{displayUsername}</span>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:block">
              <GoogleTranslate />
            </div>
            <Link href="/dashboard/notifications" className="relative p-2 rounded-xl glass text-slate-400 hover:text-white transition-colors">
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1.5 w-2 h-2 bg-red-500 border-2 border-[#040c18] rounded-full box-content" />
              )}
            </Link>
            <Link href="/dashboard/deposit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-all">
              + Deposit
            </Link>
          </div>
        </header>


        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
