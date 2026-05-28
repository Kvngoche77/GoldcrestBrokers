'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

interface FeatureGuardProps {
  children: ReactNode;
  allowedFeatures?: string[]; // Features allowed even if unverified
}

// List of features that require email verification
const VERIFICATION_REQUIRED_FEATURES = [
  'invest',
  'spot-trading',
  'copy-trading',
  'withdraw',
  'transfer',
  'staking'
];

export default function FeatureGuard({ children, allowedFeatures = [] }: FeatureGuardProps) {
  const { user, profile, refreshProfile } = useAuth();

  // Check if user is verified or if the current feature is allowed without verification
  const isVerified = profile?.email_verified === true;
  
  // Determine if we should block access
  // We block if: not verified AND (no allowedFeatures provided OR current path not in allowedFeatures)
  // Note: This component is used as a wrapper, so we check if children should be shown
  
  const shouldBlock = !isVerified;

  if (!shouldBlock) {
    return <>{children}</>;
  }

  const handleResendEmail = async () => {
    if (!user?.email) {
      toast.error('User email not found. Please log in again.');
      return;
    }

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      });

      if (error) throw error;

      toast.success('Verification email sent! Please check your inbox and spam folder.');
    } catch (err: any) {
      console.error('Error resending email:', err);
      toast.error(err.message || 'Failed to send verification email');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
        <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-amber-500" />
        </div>
        
        <h2 className="text-xl font-bold text-white mb-2">Email Verification Required</h2>
        <p className="text-slate-400 text-sm mb-6">
          You must verify your email address to access this feature. This helps ensure the security of your account and transactions.
        </p>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3 text-left">
            <Mail className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-300 font-medium">What you can do now:</p>
              <ul className="text-xs text-blue-400 mt-1 space-y-1">
                <li>• View your dashboard and portfolio</li>
                <li>• Make deposits to fund your account</li>
                <li>• Browse investment opportunities</li>
              </ul>
              <p className="text-xs text-blue-400 mt-2 font-medium">After verification:</p>
              <ul className="text-xs text-blue-400 mt-1 space-y-1">
                <li>• Start investing and trading</li>
                <li>• Request withdrawals</li>
                <li>• Access all premium features</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleResendEmail}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all glow-blue flex items-center justify-center gap-2"
          >
            <Mail size={18} />
            Resend Verification Email
          </button>
          
          <button
            onClick={() => window.history.back()}
            className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl transition-all"
          >
            Go Back
          </button>
        </div>

        <p className="text-xs text-slate-600 mt-4">
          Didn't receive the email? Check your spam folder or{' '}
          <button onClick={handleResendEmail} className="text-blue-400 hover:underline">
            click here to resend
          </button>
        </p>
      </div>
    </div>
  );
}
