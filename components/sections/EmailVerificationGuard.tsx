'use client';

import { useState } from 'react';
import { EmailVerificationModal } from './EmailVerificationBanner';
import type { Profile } from '@/types';

interface EmailVerificationGuardProps {
  profile: Profile | null;
  children: React.ReactNode;
  featureName: string;
}

export function EmailVerificationGuard({ profile, children, featureName }: EmailVerificationGuardProps) {
  const [showModal, setShowModal] = useState(false);

  const handleRequireVerification = () => {
    setShowModal(true);
  };

  if (!profile?.email_verified) {
    return (
      <>
        <div className="glass rounded-2xl p-8 border border-white/[0.05]">
          <div className="text-center py-10">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Email Verification Required</h3>
            <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">
              You need to verify your email address before you can {featureName}. 
              Please verify your email to continue.
            </p>
            <button
              onClick={handleRequireVerification}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-xl transition-colors"
            >
              Verify Email Now
            </button>
          </div>
        </div>
        <EmailVerificationModal isOpen={showModal} onClose={() => setShowModal(false)} />
      </>
    );
  }

  return <>{children}</>;
}

export function useEmailVerificationCheck(
  profile: Profile | null,
  onRequireVerification: () => void
): boolean {
  if (!profile?.email_verified) {
    onRequireVerification();
    return false;
  }
  return true;
}
