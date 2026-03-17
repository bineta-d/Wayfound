import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { uploadProfilePicture } from '../lib/storage';
import * as Linking from 'expo-linking';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, userData: any) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  checkProfileComplete: (userId: string) => Promise<{ isComplete: boolean; profile?: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔍 AuthContext: Initializing auth state...');
    console.log('🔍 AuthContext: Checking for existing session...');

    // Handle deep links for OAuth
    const handleDeepLink = async (url: string) => {
      console.log('🔍 AuthContext: Handling deep link:', url);
      const { queryParams } = Linking.parse(url as string);

      if (!queryParams) {
        console.log('🔍 AuthContext: Deep link has no params, skipping');
        return;
      }

      const access_token = typeof queryParams.access_token === 'string' ? queryParams.access_token : undefined;
      const refresh_token = typeof queryParams.refresh_token === 'string' ? queryParams.refresh_token : undefined;

      if (access_token && refresh_token) {
        console.log('🔍 AuthContext: Found tokens in deep link, setting session');
        await supabase.auth.setSession({
          access_token,
          refresh_token,
        });
      }
    };

    const linkingSubscription = Linking.addEventListener('url', (event: { url: string }) => {
      if (event.url) {
        handleDeepLink(event.url);
      }
    });

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('🔍 AuthContext: Session check completed');
      console.log('🔍 AuthContext: Session exists:', !!session);
      console.log('🔍 AuthContext: Session error:', error);
      console.log('🔍 AuthContext: User email:', session?.user?.email || 'No user');
      console.log('🔍 AuthContext: Session expires at:', session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'No expiry');

      if (session) {
        const now = Math.floor(Date.now() / 1000);
        const isExpired = session.expires_at && session.expires_at < now;
        console.log('🔍 AuthContext: Current timestamp:', now);
        console.log('🔍 AuthContext: Session expired:', isExpired);
      }

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
        console.log('🔍 AuthContext: Event type:', event);

        if (event === 'TOKEN_REFRESHED') {
          console.log('🔍 AuthContext: Token was refreshed');
        }

        if (event === 'SIGNED_OUT') {
          console.log('🔍 AuthContext: User was signed out');
        }

        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      console.log('🔍 AuthContext: Cleaning up auth subscription');
      subscription.unsubscribe();
      linkingSubscription.remove();
    };
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
      // Check if this is a Google sign-up
      if (userData.google_id_token) {
        console.log('🔍 AuthContext: Google sign up detected');

        // Sign in with Google ID token
        const { data: authData, error: authError } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: userData.google_id_token,
        });

        if (authError) {
          console.log('🔍 AuthContext: Google sign up failed:', authError.message);
          return { error: authError };
        }

        if (!authData.user?.id) {
          console.log('🔍 AuthContext: No user ID returned from Google auth');
          return { error: { message: 'Failed to create Google account' } };
        }

        // Check if user profile exists in users table
        const { data: existingProfile, error: profileCheckError } = await supabase
          .from('users')
          .select('id, full_name, dob, avatar_url')
          .eq('id', authData.user.id)
          .single();

        if (profileCheckError) {
          console.log('🔍 AuthContext: Profile check failed:', profileCheckError.message);
          return { error: { message: 'Failed to check user profile' } };
        }

        if (existingProfile) {
          console.log('🔍 AuthContext: User profile already exists, redirecting to home');
          return { error: null };
        }

        console.log('🔍 AuthContext: Google auth successful, creating profile...');

        // Create user profile using database function
        const { data: profileResult, error: profileError } = await supabase.rpc('create_user_with_profile', {
          p_user_id: authData.user.id,
          p_email: email,
          p_full_name: authData.user.user_metadata?.full_name || email.split('@')[0],
          p_dob: null, // Google sign up doesn't require DOB initially
          p_avatar_url: authData.user.user_metadata?.avatar_url
        });

        if (profileError || !profileResult) {
          console.log('🔍 AuthContext: Profile creation failed:', profileError?.message || 'Unknown error');
          return {
            error: {
              message: profileError?.message || 'Failed to create user profile. Please ensure database is properly configured.'
            }
          };
        } else {
          console.log('🔍 AuthContext: Google profile created successfully');
          return { error: null };
        }
      } else {
        // Regular email/password sign up
        console.log('🔍 AuthContext: Regular email sign up detected');

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

        console.log('🔍 AuthContext: Auth user created, uploading profile picture...');

        // Upload profile picture if provided
        let avatarUrl = null;
        if (userData.avatar_url && userData.avatar_url.startsWith('file://')) {
          avatarUrl = await uploadProfilePicture(authData.user.id, userData.avatar_url);
          if (!avatarUrl) {
            console.log('🔍 AuthContext: Profile picture upload failed, continuing without it');
          } else {
            console.log('🔍 AuthContext: Profile picture uploaded successfully');
          }
        } else {
          avatarUrl = userData.avatar_url;
        }

        // Create user profile using the database function
        const { data: profileResult, error: profileError } = await supabase.rpc('create_user_with_profile', {
          p_user_id: authData.user.id,
          p_email: email,
          p_full_name: userData.full_name,
          p_dob: userData.dob,
          p_avatar_url: avatarUrl
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
      }
    } catch (error) {
      console.log('🔍 AuthContext: Unexpected error during signup:', error);
      return { error: { message: 'An unexpected error occurred during signup' } };
    }
  };

  const checkProfileComplete = async (userId: string) => {
    console.log('🔍 AuthContext: Checking profile completeness for user:', userId);

    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('id, full_name, dob, avatar_url, email')
        .eq('id', userId)
        .single();

      if (error) {
        console.log('🔍 AuthContext: Profile check failed:', error.message);
        return { isComplete: false };
      }

      if (!profile) {
        console.log('🔍 AuthContext: No profile found for user');
        return { isComplete: false };
      }

      // Check if mandatory fields are complete
      const isComplete = !!(profile.full_name && profile.dob && profile.email);

      console.log('🔍 AuthContext: Profile completeness check result:', {
        hasFullName: !!profile.full_name,
        hasDOB: !!profile.dob,
        hasEmail: !!profile.email,
        isComplete
      });

      return { isComplete, profile };
    } catch (error) {
      console.log('🔍 AuthContext: Unexpected error checking profile:', error);
      return { isComplete: false };
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
    checkProfileComplete,
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
