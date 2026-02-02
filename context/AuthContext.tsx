import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, userData: any) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔍 AuthContext: Initializing auth state...');

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔍 AuthContext: Initial session check:', session ? 'Session found' : 'No session');
      console.log('🔍 AuthContext: User:', session?.user?.email || 'No user');
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔍 AuthContext: Auth state changed:', event);
        console.log('🔍 AuthContext: Session after change:', session ? 'Active' : 'None');
        console.log('🔍 AuthContext: User after change:', session?.user?.email || 'No user');

        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('🔍 AuthContext: Attempting sign in for:', email);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.log('🔍 AuthContext: Sign in failed:', error.message);
    } else {
      console.log('🔍 AuthContext: Sign in successful');
    }

    return { error };
  };

  const signUp = async (email: string, password: string, userData: any) => {
    console.log('🔍 AuthContext: Attempting sign up for:', email);

    try {
      // First, create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        console.log('🔍 AuthContext: Sign up failed:', authError.message);
        return { error: authError };
      }

      if (!authData.user?.id) {
        console.log('🔍 AuthContext: No user ID returned from auth');
        return { error: { message: 'Failed to create user account' } };
      }

      console.log('🔍 AuthContext: Auth user created, creating user profile...');

      // Create user profile using the database function
      const { data: profileResult, error: profileError } = await supabase.rpc('create_user_with_profile', {
        p_user_id: authData.user.id,
        p_email: email,
        p_full_name: userData.full_name,
        p_dob: userData.dob,
        p_avatar_url: userData.avatar_url || null
      });

      if (profileError || !profileResult) {
        console.log('🔍 AuthContext: Profile creation failed:', profileError?.message || 'Unknown error');
        console.log('🔍 AuthContext: Rolling back - deleting auth user...');

        // Rollback: delete the auth user since profile creation failed
        await supabase.auth.signOut();

        return {
          error: {
            message: profileError?.message || 'Failed to create user profile. Please ensure the database is properly configured.'
          }
        };
      } else {
        console.log('🔍 AuthContext: Profile created successfully');
        return { error: null };
      }
    } catch (error) {
      console.log('🔍 AuthContext: Unexpected error during signup:', error);
      return { error: { message: 'An unexpected error occurred during signup' } };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
