'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, TrendingUp, Loader as Loader2, Mail, Lock, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') ?? '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (error) {
        toast.error(error.message === 'Invalid login credentials' ? 'Invalid email or password' : error.message);
        return;
      }
      toast.success('Welcome back!');
      router.push(redirectTo);
      router.refresh();
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error(err.message || 'Google Sign-in failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#040c18] hero-gradient grid-pattern flex items-center justify-center p-4">
      {/* Background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl opacity-10" style={{ background: 'radial-gradient(circle, #1d6ef5, transparent)' }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-3xl opacity-10" style={{ background: 'radial-gradient(circle, #10d982, transparent)' }} />
      </div>

      <motion.div
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 justify-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center glow-blue">
            <TrendingUp size={22} className="text-white" />
          </div>
          <span className="font-bold text-2xl">
            <span className="text-white">Goldcrest</span>
            <span className="gradient-text">Broker</span>
          </span>
        </Link>

        <div className="glass-strong rounded-3xl p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
            <p className="text-slate-400 text-sm">Sign in to your investment account</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label className="text-xs font-medium text-slate-300 mb-1.5 block">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="you@example.com"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 focus:bg-white/[0.06] transition-all"
                />
              </div>
              {errors.email && <p className="mt-1.5 text-xs text-red-400">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300">Password</label>
                <Link href="/auth/forgot-password" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 focus:bg-white/[0.06] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-red-400">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 glow-blue group mt-2"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#060d1a] px-2 text-slate-500">Or continue with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-3 border border-white/10"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
              Sign in with Google
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-400">
              Don&apos;t have an account?{' '}
              <Link href="/auth/register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                Create account
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          By signing in, you agree to our{' '}
          <Link href="/legal/terms" className="text-slate-400 hover:text-slate-300">Terms</Link>
          {' '}and{' '}
          <Link href="/legal/privacy" className="text-slate-400 hover:text-slate-300">Privacy Policy</Link>
        </p>
      </motion.div>
    </div>
  );
}
