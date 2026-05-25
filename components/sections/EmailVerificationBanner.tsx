'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2, X, Mail, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

interface EmailVerificationBannerProps {
  onVerify?: () => void;
}

export function EmailVerificationBanner({ onVerify }: EmailVerificationBannerProps) {
  const { profile, refreshProfile } = useAuth();
  const [isSending, setIsSending] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't show if already verified or dismissed
  if (profile?.email_verified || isDismissed) {
    return null;
  }

  const handleResendVerification = async () => {
    setIsSending(true);
    try {
      // Use Supabase's built-in resend functionality
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: profile?.email || '',
      });

      if (error) throw error;

      // Update the verification sent timestamp
      await supabase.rpc('request_email_verification');
      
      toast.success('Verification email sent! Please check your inbox.');
      await refreshProfile();
      onVerify?.();
    } catch (err: unknown) {
      console.error('Error sending verification:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to send verification email';
      toast.error(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -20, height: 0 }}
        className="mb-6"
      >
        <div className="glass rounded-xl p-4 border border-amber-500/30 bg-amber-500/10">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-amber-400 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-amber-200 mb-1">
                Verify Your Email Address
              </h3>
              <p className="text-xs text-slate-300 mb-3">
                Please verify your email to unlock all features including deposits, withdrawals, and trading.
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleResendVerification}
                  disabled={isSending}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-white rounded-lg transition-colors"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="animate-spin" size={14} />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail size={14} />
                      Resend Verification Email
                    </>
                  )}
                </button>
                <button
                  onClick={() => setIsDismissed(true)}
                  className="text-slate-400 hover:text-slate-300 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
              {profile?.email_verification_sent_at && (
                <p className="text-[10px] text-slate-400 mt-2">
                  Last sent: {new Date(profile.email_verification_sent_at).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export function EmailVerificationModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { profile, refreshProfile } = useAuth();
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const handleResendVerification = async () => {
    setIsSending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: profile?.email || '',
      });

      if (error) throw error;

      await supabase.rpc('request_email_verification');
      
      toast.success('Verification email sent! Please check your inbox.');
      await refreshProfile();
    } catch (err: unknown) {
      console.error('Error sending verification:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to send verification email';
      toast.error(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="glass rounded-2xl p-6 max-w-md w-full border border-white/[0.1]">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
            <Mail className="text-amber-400" size={32} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Verify Your Email</h2>
          <p className="text-sm text-slate-300 mb-6">
            You need to verify your email address before you can access this feature. 
            Please check your inbox for a verification link.
          </p>
          
          <div className="space-y-3">
            <button
              onClick={handleResendVerification}
              disabled={isSending}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-white rounded-xl transition-colors"
            >
              {isSending ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Sending...
                </>
              ) : (
                <>
                  <Mail size={18} />
                  Resend Verification Email
                </>
              )}
            </button>
            
            <button
              onClick={onClose}
              className="w-full px-4 py-3 text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              I&apos;ll do it later
            </button>
          </div>

          {profile?.email_verification_sent_at && (
            <p className="text-[10px] text-slate-400 mt-4">
              Last sent: {new Date(profile.email_verification_sent_at).toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function checkEmailVerification(
  profile: { email_verified?: boolean } | null,
  onRequireVerification: () => void
): boolean {
  if (!profile?.email_verified) {
    onRequireVerification();
    return false;
  }
  return true;
}
