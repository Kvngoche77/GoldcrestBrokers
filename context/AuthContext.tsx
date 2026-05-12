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

  const fetchProfile = async (userId: string, retries = 3): Promise<void> => {
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
        setProfile(data as Profile);
        setLoading(false);
      } else {
        // Profile is missing or incomplete (e.g. missing username)
        const fallbackUsername = user?.user_metadata?.username || user?.email?.split('@')[0] || 'user';
        const fallbackFullName = user?.user_metadata?.full_name || '';
        
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
          if (data) setProfile(data as Profile); // Use what we have if fix fails
        } else if (fixedProfile) {
          console.log('AuthContext: Profile fixed/created successfully:', fixedProfile);
          setProfile(fixedProfile as Profile);
        }
        setLoading(false);
      }
    } catch (err) {
      console.error('AuthContext: Unexpected error in fetchProfile:', err);
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
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
        fetchProfile(session.user.id);
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
