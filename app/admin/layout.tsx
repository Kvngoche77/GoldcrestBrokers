'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, ArrowDownToLine, ArrowUpFromLine,
  TrendingUp, Settings, LogOut, Shield, ChevronRight, ShieldCheck, Bell, Box, Headphones, Copy, Megaphone
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

const adminNav = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/deposits', label: 'Deposits', icon: ArrowDownToLine },
  { href: '/admin/withdrawals', label: 'Withdrawals', icon: ArrowUpFromLine },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/kyc', label: 'KYC Verifications', icon: ShieldCheck },
  { href: '/admin/investments', label: 'Investments', icon: TrendingUp },
  { href: '/admin/plans', label: 'Investment Plans', icon: Box },
  { href: '/admin/notifications', label: 'Notifications', icon: Bell },
  { href: '/admin/support', label: 'Support Tickets', icon: Headphones },
  { href: '/admin/copy-trading', label: 'Copy Traders', icon: Copy },
  { href: '/admin/withdrawal-popups', label: 'Withdrawal Popups', icon: Megaphone },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user) { router.push('/auth/login'); return; }
      if (profile && !profile.is_admin) { router.push('/dashboard'); toast.error('Admin access required'); }
    }
  }, [user, profile, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#040c18] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <div className="text-slate-400 text-sm animate-pulse">Verifying admin credentials...</div>
        </div>
      </div>
    );
  }

  if (!profile?.is_admin) {
    return (
      <div className="min-h-screen bg-[#040c18] flex items-center justify-center p-6">
        <div className="glass rounded-3xl p-8 max-w-sm w-full text-center border border-red-500/20">
          <Shield size={48} className="text-red-500 mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-slate-400 text-sm mb-6">
            You do not have the required administrator privileges to view this page.
          </p>
          <Link 
            href="/dashboard"
            className="block w-full py-3 bg-white/[0.05] hover:bg-white/[0.1] text-white rounded-xl transition-all font-medium text-sm"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-[#040c18] flex">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 w-60 bg-[#060d1a] border-r border-white/[0.05] flex flex-col">
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-white/[0.05]">
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center">
            <Shield size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Admin Panel</p>
            <p className="text-xs text-slate-500">Goldcrest Broker</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {adminNav.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive ? 'bg-red-600/10 text-red-400 border border-red-500/20' : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Icon size={16} />
                {label}
                {isActive && <ChevronRight size={12} className="ml-auto" />}
              </Link>
            );
          })}
          <div className="h-px bg-white/[0.05] my-2" />
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/[0.04] transition-all">
            <LayoutDashboard size={16} />
            User Dashboard
          </Link>
        </nav>

        <div className="px-3 py-4 border-t border-white/[0.05]">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-xs font-bold text-white">
              A
            </div>
            <div>
              <p className="text-xs font-semibold text-white">{profile.username ?? 'Admin'}</p>
              <p className="text-[10px] text-red-400">Administrator</p>
            </div>
          </div>
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all">
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 ml-60">
        <header className="sticky top-0 z-30 bg-[#040c18]/90 backdrop-blur-xl border-b border-white/[0.05] px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Shield size={14} className="text-red-400" />
            <span>Admin</span>
            <span>/</span>
            <span className="text-white">{adminNav.find((n) => n.href === pathname)?.label ?? 'Panel'}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 rounded-full border border-red-500/20 text-xs text-red-400">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400 pulse-dot" />
            Admin Mode
          </div>
        </header>
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
