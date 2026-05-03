'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, Menu, X, ChevronDown, User, LayoutDashboard,
  LogOut, Bell, Shield, Wallet
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { GoogleTranslate } from '@/components/GoogleTranslate';

const navLinks = [
  { href: '/#markets', label: 'Markets' },
  { href: '/dashboard/trade', label: 'Trade' },
  { href: '/#plans', label: 'Investment Plans' },
  { href: '/#referral', label: 'Referral' },
  { href: '/#about', label: 'About' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, profile, signOut, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
    router.push('/');
  };

  const initials = profile?.full_name
    ? profile.full_name.slice(0, 2).toUpperCase()
    : profile?.username?.slice(0, 2).toUpperCase() ?? 'U';

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-[#060d1a]/95 backdrop-blur-xl border-b border-white/[0.06] shadow-2xl' : 'bg-transparent'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-18">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center glow-blue group-hover:scale-110 transition-transform duration-300">
                <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <div className="absolute -inset-1 bg-blue-500/20 blur-md rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl tracking-tight leading-none text-white">
                GOLDCREST
              </span>
              <span className="text-[10px] font-bold tracking-[0.2em] text-blue-400 uppercase mt-0.5">
                Brokerage Group
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden lg:flex items-center gap-3">
            <GoogleTranslate />
            {loading ? (
              <div className="w-8 h-8 rounded-full shimmer" />
            ) : user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl glass hover:bg-white/[0.06] transition-all duration-200"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-xs font-bold text-white">
                    {initials}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-white leading-none">
                      {profile?.username ?? 'User'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      ${Number(profile?.balance ?? 0).toFixed(2)}
                    </p>
                  </div>
                  <ChevronDown size={14} className={`text-slate-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-52 glass-strong rounded-2xl overflow-hidden shadow-2xl"
                      onMouseLeave={() => setUserMenuOpen(false)}
                    >
                      <div className="p-1">
                        <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.06] text-sm text-slate-300 hover:text-white transition-all">
                          <LayoutDashboard size={16} className="text-blue-400" />
                          Dashboard
                        </Link>
                        <Link href="/dashboard/deposit" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.06] text-sm text-slate-300 hover:text-white transition-all">
                          <Wallet size={16} className="text-emerald-400" />
                          Deposit
                        </Link>
                        <Link href="/dashboard/notifications" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.06] text-sm text-slate-300 hover:text-white transition-all">
                          <Bell size={16} className="text-amber-400" />
                          Notifications
                        </Link>
                        {profile?.is_admin && (
                          <Link href="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.06] text-sm text-slate-300 hover:text-white transition-all">
                            <Shield size={16} className="text-red-400" />
                            Admin Panel
                          </Link>
                        )}
                        <div className="h-px bg-white/[0.06] my-1" />
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-500/10 text-sm text-red-400 hover:text-red-300 transition-all"
                        >
                          <LogOut size={16} />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all duration-200 glow-blue"
                >
                  Get Started
                </Link>
              </>
            )}
            <div className="lg:hidden">
              <GoogleTranslate />
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-lg glass text-slate-300 hover:text-white transition-colors"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden bg-[#060d1a]/98 backdrop-blur-xl border-b border-white/[0.06]"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center px-4 py-3 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/[0.05] transition-all"
                >
                  {link.label}
                </Link>
              ))}
              <div className="h-px bg-white/[0.06] my-3" />
              {user ? (
                <>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-sm font-bold text-white">
                      {initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{profile?.username}</p>
                      <p className="text-xs text-slate-400">Balance: ${Number(profile?.balance ?? 0).toFixed(2)}</p>
                    </div>
                  </div>
                  <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-white/[0.05] transition-all">
                    <LayoutDashboard size={16} className="text-blue-400" /> Dashboard
                  </Link>
                  {profile?.is_admin && (
                    <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-white/[0.05] transition-all">
                      <Shield size={16} className="text-red-400" /> Admin Panel
                    </Link>
                  )}
                  <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all">
                    <LogOut size={16} /> Sign Out
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2 pt-2">
                  <Link href="/auth/login" className="px-4 py-3 text-center text-sm font-medium text-slate-300 hover:text-white glass rounded-xl transition-all">
                    Sign In
                  </Link>
                  <Link href="/auth/register" className="px-4 py-3 text-center text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all">
                    Get Started Free
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
