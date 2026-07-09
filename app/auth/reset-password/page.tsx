'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Lock, ArrowLeft, TrendingUp, Loader as Loader2, AlertTriangle } from 'lucide-react';

const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Exchange auth code (for PKCE flow) when landing from email redirect
  useEffect(() => {
    const handleRecoveryCode = async () => {
      const code = searchParams.get('code');
      if (code) {
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          setIsSessionReady(true);
        } catch (err: any) {
          console.error('Error exchanging code for session:', err);
          toast.error('Recovery link invalid or expired: ' + err.message);
        } finally {
          setIsChecking(false);
        }
      } else {
        // In case of implicit flow, check if session is already present or being parsed
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            setIsSessionReady(true);
            setIsChecking(false);
          } else {
            // Give a small delay for hash parsing if any
            setTimeout(async () => {
              const { data: { session: delayedSession } } = await supabase.auth.getSession();
              if (delayedSession) {
                setIsSessionReady(true);
              }
              setIsChecking(false);
            }, 1500);
          }
        } catch (err) {
          console.error('Error getting session:', err);
          setIsChecking(false);
        }
      }
    };

    handleRecoveryCode();
  }, [searchParams]);

  const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordForm) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: data.password });
      if (error) throw error;

      toast.success('Password reset successfully!');
      router.push('/auth/login');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#040c18] hero-gradient grid-pattern flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl opacity-10" style={{ background: 'radial-gradient(circle, #1d6ef5, transparent)' }} />
      </div>

      <motion.div
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
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
          {isChecking ? (
            <div className="py-10 text-center flex flex-col items-center justify-center gap-4">
              <Loader2 className="animate-spin text-blue-500" size={40} />
              <p className="text-slate-300 text-sm font-medium">Verifying your recovery link...</p>
            </div>
          ) : !isSessionReady ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-5 border border-red-500/20">
                <AlertTriangle size={32} className="text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Invalid or Expired Link</h2>
              <p className="text-slate-400 text-sm mb-6 font-normal line-height-1.5">
                Your password reset link is invalid, has expired, or has already been used. Please request a new password reset link.
              </p>
              <div className="space-y-4">
                <Link
                  href="/auth/forgot-password"
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 glow-blue"
                >
                  Request New Link
                </Link>
                <div className="pt-2">
                  <Link href="/auth/login" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-300 transition-colors">
                    <ArrowLeft size={14} /> Back to login
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
                  <Lock size={20} className="text-blue-400" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-1">Reset Password</h1>
                <p className="text-slate-400 text-sm">Create a new password for your account</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mb-6">
                <div>
                  <label className="text-xs font-medium text-slate-300 mb-1.5 block">New Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      {...register('password')}
                      type={showPassword ? 'text' : 'password'}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 transition-all"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 mb-1.5 block">Confirm Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      {...register('confirmPassword')}
                      type={showConfirm ? 'text' : 'password'}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 transition-all"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    >
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 glow-blue mt-6"
                >
                  {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Reset Password'}
                </button>
              </form>

              <div className="text-center">
                <Link href="/auth/login" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-300 transition-colors">
                  <ArrowLeft size={14} /> Back to login
                </Link>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
