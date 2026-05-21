'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, TrendingUp, Wallet, ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight,
  Users, Bell, Settings, LogOut, TrendingDown, Menu, X, Shield, ShieldCheck,
  LineChart, Newspaper, BarChart3, Headphones, Copy
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

        {/* Email Verification Warning */}
        {user && !user.email_confirmed_at && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="px-4 sm:px-6 py-4 bg-gradient-to-r from-amber-500/20 via-amber-600/10 to-amber-500/20 border-b border-amber-500/30 relative overflow-hidden"
          >
            {/* Animated background glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(245,158,11,0.1),transparent_70%)] animate-pulse" />
            
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center flex-shrink-0 border border-amber-500/30 shadow-lg shadow-amber-500/10">
                  <Shield size={24} className="text-amber-500 animate-bounce-slow" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm sm:text-base font-bold text-amber-100 flex items-center gap-2">
                    Action Required: Verify Your Identity
                    <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                  </h4>
                  <p className="text-xs text-amber-200/70 mt-1 leading-relaxed">
                    A verification link was sent to <span className="text-amber-400 font-bold underline underline-offset-2">{user?.email}</span>. 
                    Please confirm your email to unlock all trading features and secure your account.
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button 
                  onClick={async () => {
                    const { error } = await supabase.auth.resend({
                      type: 'signup',
                      email: user?.email ?? '',
                    });
                    if (error) toast.error(error.message);
                    else toast.success('Verification email resent! Please check your spam folder.');
                  }}
                  className="flex-1 sm:flex-none px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-amber-900/20 uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  Resend Email
                </button>
                <button 
                  onClick={() => window.location.reload()}
                  className="flex-1 sm:flex-none px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl transition-all border border-white/10 uppercase tracking-widest"
                >
                  I've Verified
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
