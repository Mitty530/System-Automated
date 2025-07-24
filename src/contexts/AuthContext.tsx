import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { getAuthorizedUser, isAuthorizedUser } from '../config/authorizedUsers';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  region?: string;
  regional_countries?: string[];
  can_create_requests: boolean;
  can_approve_reject: boolean;
  can_disburse: boolean;
  view_only_access: boolean;
  is_active: boolean;
  avatar_url?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signInWithMagicLink: (email: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        await fetchUserProfile(session.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (authUser: User) => {
    try {
      // Create a basic profile from auth user data first
      const basicProfile: UserProfile = {
        id: authUser.id,
        name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
        email: authUser.email || '',
        role: authUser.user_metadata?.role || 'admin',
        region: 'global',
        can_create_requests: true,
        can_approve_reject: true,
        can_disburse: true,
        view_only_access: false,
        is_active: true
      };

      // Set the basic profile immediately to allow login
      setUser(basicProfile);
      setLoading(false);

      // Try to get authorized user profile first
      const authorizedUser = getAuthorizedUser(authUser.email || '');

      if (authorizedUser) {
        // Use authorized user profile
        const userProfile: UserProfile = {
          id: authUser.id,
          name: authorizedUser.name,
          email: authUser.email || '',
          role: authorizedUser.role,
          region: undefined,
          regional_countries: undefined,
          can_create_requests: authorizedUser.can_create_requests,
          can_approve_reject: authorizedUser.can_approve_reject,
          can_disburse: authorizedUser.can_disburse,
          view_only_access: authorizedUser.view_only_access,
          is_active: true,
          avatar_url: undefined
        };
        setUser(userProfile);
        console.log('✅ Using authorized user profile:', userProfile);
      } else {
        // Try to fetch the full profile from database (fallback)
        try {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', authUser.id)
            .single();

          if (!error && data) {
            // Update with database profile if available
            const userProfile: UserProfile = {
              id: data.id,
              name: data.full_name,
              email: authUser.email || '',
              role: data.role,
              region: data.region,
              regional_countries: data.regional_countries,
              can_create_requests: data.can_create_requests,
              can_approve_reject: data.can_approve_reject,
              can_disburse: data.can_disburse,
              view_only_access: data.view_only_access,
              is_active: data.is_active,
              avatar_url: data.avatar_url
            };
            setUser(userProfile);
          }
        } catch (dbError) {
          console.log('Could not fetch database profile, using basic profile:', dbError);
          // Keep the basic profile - this is not a critical error
        }
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      setLoading(false);
    }
  };

  const signInWithMagicLink = async (email: string) => {
    console.log('🔐 AuthContext signInWithMagicLink called with:', { email });

    // Check if user is authorized
    if (!isAuthorizedUser(email)) {
      return {
        error: {
          message: 'You are not authorized to access this system. Contact admin for assistance.',
          name: 'AuthorizationError'
        } as AuthError
      };
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`
      }
    });

    console.log('🔐 Supabase magic link result:', { error: error?.message || 'No error' });
    return { error };
  };



  const signOut = async () => {
    console.log('🔐 AuthContext: Signing out user...');

    try {
      // Sign out from Supabase
      await supabase.auth.signOut();

      // Clear local state
      setUser(null);
      setSession(null);

      console.log('✅ AuthContext: User signed out successfully');
    } catch (error) {
      console.error('❌ AuthContext: Error during signOut:', error);

      // Even if Supabase signOut fails, clear local state
      setUser(null);
      setSession(null);
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error };
  };

  const value = {
    user,
    session,
    loading,
    signInWithMagicLink,
    signOut,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
