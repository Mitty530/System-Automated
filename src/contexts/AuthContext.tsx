import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { getAuthorizedUser, isAuthorizedUser } from '../config/authorizedUsers';
import { AuditTrailService } from '../lib/auditTrail';
import { DatabaseService } from '../lib/database';

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
    // Development mode: Create a mock user for dashboard testing
    if (process.env.NODE_ENV === 'development') {
      console.log('🧪 Development mode: Creating mock user for dashboard testing...');
      const mockUser: UserProfile = {
        id: 'dev-user-id',
        name: 'Mamadou Oury Diallo',
        email: 'Mamadouourydiallo819@gmail.com',
        role: 'admin',
        can_create_requests: true,
        can_approve_reject: true,
        can_disburse: true,
        view_only_access: false,
        is_active: true
      };
      setUser(mockUser);
      setLoading(false);
      return;
    }

    // Handle magic link authentication on page load
    const handleAuthCallback = async () => {
      console.log('🔍 Checking for authentication callback...');

      // Check if this is a magic link callback (has auth tokens in URL)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      if (accessToken && refreshToken) {
        console.log('🔗 Magic link authentication detected, processing tokens...');

        try {
          // Set the session with the tokens from the magic link
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (error) {
            console.error('❌ Error setting session from magic link:', error);
            setLoading(false);
            return;
          }

          if (data.session?.user) {
            console.log('✅ Magic link authentication successful');
            await fetchUserProfile(data.session.user);

            // Clean up the URL by removing the hash parameters
            window.history.replaceState({}, document.title, window.location.pathname);
            return;
          }
        } catch (error) {
          console.error('❌ Magic link processing error:', error);
        }
      }

      // Get initial session (normal flow)
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🔍 Getting initial session...', session ? 'Found' : 'Not found');
      setSession(session);
      if (session?.user) {
        await fetchUserProfile(session.user);
      } else {
        setLoading(false);
      }
    };

    handleAuthCallback();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state change:', event, session ? 'Session exists' : 'No session');
      setSession(session);
      if (session?.user) {
        console.log('👤 User found in session, fetching profile...');
        await fetchUserProfile(session.user);
      } else {
        // Log session end if user was previously logged in
        if (event === 'SIGNED_OUT') {
          await AuditTrailService.logSessionEnd('logout');
        }
        console.log('❌ No user in session, clearing state...');
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (authUser: User) => {
    try {
      console.log('🔍 Fetching user profile for:', authUser.email);

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

      console.log('📝 Created basic profile:', basicProfile);

      // Set the basic profile immediately to allow login
      setUser(basicProfile);
      setLoading(false);

      // Try to get authorized user profile first
      const authorizedUser = getAuthorizedUser(authUser.email || '');
      console.log('🔍 Authorized user lookup result:', authorizedUser ? 'Found' : 'Not found');

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

        // Initialize audit trail for this session
        const sessionId = `session_${Date.now()}_${authUser.id}`;
        localStorage.setItem('adfd-session-start', Date.now().toString());
        localStorage.setItem('adfd-session-id', sessionId);

        AuditTrailService.initialize(authUser.id, sessionId);

        // Create user session record
        await DatabaseService.createUserSession({
          id: sessionId,
          user_id: authUser.id,
          session_token: session?.access_token || '',
          ip_address: undefined, // Will be populated by audit service
          user_agent: navigator.userAgent,
          login_at: new Date().toISOString(),
          is_active: true,
          remember_me: localStorage.getItem('adfd-remember-me') === 'true'
        });

        // Log successful login
        await AuditTrailService.logUserActivity('login', `User ${userProfile.name} logged in successfully`, {
          user_role: userProfile.role,
          user_department: authorizedUser.department,
          login_method: 'magic_link',
          session_id: sessionId
        });

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
      // Log unauthorized access attempt
      await AuditTrailService.logSecurityEvent(
        'unauthorized_access',
        `Unauthorized login attempt by ${email}`,
        {
          user_email: email,
          attempt_timestamp: new Date().toISOString()
        }
      );

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
        emailRedirectTo: `${window.location.origin}/dashboard`,
        shouldCreateUser: false, // Don't create new users, only allow existing authorized users
      }
    });

    console.log('🔐 Supabase magic link result:', { error: error?.message || 'No error' });
    return { error };
  };



  const signOut = async () => {
    console.log('🔐 AuthContext: Signing out user...');

    try {
      // Log session end before signing out
      if (user) {
        await AuditTrailService.logSessionEnd('logout');

        // End user session in database
        const sessionId = localStorage.getItem('adfd-session-id');
        if (sessionId) {
          await DatabaseService.endUserSession(sessionId);
        }
      }

      // Clear session storage
      localStorage.removeItem('adfd-session-start');
      localStorage.removeItem('adfd-session-id');
      localStorage.removeItem('adfd-remember-me');
      localStorage.removeItem('adfd-saved-email');

      // Sign out from Supabase
      await supabase.auth.signOut();

      // Clear local state
      setUser(null);
      setSession(null);

      console.log('✅ AuthContext: User signed out successfully');
    } catch (error) {
      console.error('❌ AuthContext: Error during signOut:', error);

      // Log the error
      await AuditTrailService.logError('signout_error', 'Failed to sign out properly', error instanceof Error ? error.stack : undefined);

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
