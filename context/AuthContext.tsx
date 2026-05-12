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

  const fetchProfile = async (userId: string, retries = 3) => {
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
      } else if (retries > 0) {
        console.log('AuthContext: Profile incomplete or not found, retrying in 1s...');
        await new Promise(resolve => setTimeout(resolve, 1500));
        return fetchProfile(userId, retries - 1);
      } else if (data) {
        // We have data but it's still missing username after retries
        console.warn('AuthContext: Profile found but incomplete after retries:', data);
        setProfile(data as Profile);
        setLoading(false);
      } else {
        console.warn('AuthContext: No profile found for this ID after retries');
        if (!error) {
          console.log('AuthContext: Attempting fallback creation...');
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .upsert({
              id: userId,
              username: user?.user_metadata?.username || user?.email?.split('@')[0],
              full_name: user?.user_metadata?.full_name || '',
              referral_code: Math.random().toString(36).substring(2, 10).toUpperCase()
            })
            .select()
            .maybeSingle();
          
          if (createError) console.error('AuthContext: Fallback creation error:', createError);
          if (newProfile) {
            console.log('AuthContext: Fallback profile created:', newProfile);
            setProfile(newProfile as Profile);
          }
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
