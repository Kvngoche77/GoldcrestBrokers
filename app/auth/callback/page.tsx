'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        router.push('/auth/reset-password');
      } else if (event === 'SIGNED_IN' && session) {
        router.push('/dashboard');
      } else if (event === 'INITIAL_SESSION' && session) {
         router.push('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#040c18] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center animate-spin">
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
        </div>
        <p className="text-slate-400 text-sm">Completing sign in...</p>
      </div>
    </div>
  );
}
