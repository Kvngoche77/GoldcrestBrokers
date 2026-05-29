'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (currentUser: User, retries = 3): Promise<void> => {
    const userId = currentUser.id;
    console.log(`AuthContext: Fetching profile for ID: ${userId} (Attempt: ${4 - retries})`);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('AuthContext: Supabase error fetching profile:', error);
      }

      // Check if profile exists and has basic required data
      if (data && data.username) {
        console.log('AuthContext: Profile loaded successfully:', data);
        
        // Sync email verification if confirmed in auth but not in profile
        let emailVerified = data.email_verified;
        if (currentUser.email_confirmed_at && !data.email_verified) {
          console.log('AuthContext: Email confirmed in Auth, updating profile...');
          const { error: updateErr } = await supabase
            .from('profiles')
            .update({ email_verified: true })
            .eq('id', userId);
          
          if (!updateErr) {
            emailVerified = true;
            console.log('AuthContext: Profile email_verified set to true');
            
            // Trigger API Route welcome email
            fetch('/api/send-email', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                type: 'email_verified',
                user_email: currentUser.email,
                user_name: data.full_name || data.username || 'Trader',
              }),
            }).catch((err) => console.error('AuthContext: Error triggering welcome email:', err));
          } else {
            console.error('AuthContext: Error syncing email verification:', updateErr);
          }
        }

        // Add email from user metadata to profile
        const profileWithEmail = {
          ...data,
          email: data.email || currentUser.email || currentUser.user_metadata?.email,
          email_verified: emailVerified,
        } as Profile;
        setProfile(profileWithEmail);
        setLoading(false);
      } else {
        // Profile is missing or incomplete (e.g. missing username)
        const fallbackUsername = currentUser.user_metadata?.username || currentUser.email?.split('@')[0] || 'user';
        const fallbackFullName = currentUser.user_metadata?.full_name || '';
        
        console.log(`AuthContext: Profile ${data ? 'incomplete' : 'not found'}, attempting to fix/create...`);
        
        const { data: fixedProfile, error: fixError } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            username: data?.username || fallbackUsername,
            full_name: data?.full_name || fallbackFullName,
            referral_code: data?.referral_code || Math.random().toString(36).substring(2, 10).toUpperCase()
          })
          .select()
          .maybeSingle();

        if (fixError) {
          console.error('AuthContext: Error fixing profile:', fixError);
          if (data) {
            const profileWithEmail = {
              ...data,
              email: data.email || currentUser.email || currentUser.user_metadata?.email
            } as Profile;
            setProfile(profileWithEmail);
          }
        } else if (fixedProfile) {
          console.log('AuthContext: Profile fixed/created successfully:', fixedProfile);
          const profileWithEmail = {
            ...fixedProfile,
            email: fixedProfile.email || currentUser.email || currentUser.user_metadata?.email
          } as Profile;
          setProfile(profileWithEmail);
        }
        setLoading(false);
      }
    } catch (err) {
      console.error('AuthContext: Unexpected error in fetchProfile:', err);
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user);
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
