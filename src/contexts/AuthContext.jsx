import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, signOut, sendMagicLink } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false) // Start with false for instant UI
  const [session, setSession] = useState(null)


  // Optimized domain validation - local check first, then RPC fallback
  const validateUserDomain = async (email) => {
    try {
      // Fast local validation first
      const isAdfdDomain = email.endsWith('@adfd.ae');

      // Test emails for development/testing
      const testEmails = {
        'mamadouourydiallo819@gmail.com': 'admin',
        'Mamadouourydiallo819@gmail.com': 'admin', // Case variation
        'alomran303@gmail.com': 'admin', // Omran full access (existing)
        'aiglimcard@gmail.com': 'archive_team',
        'rabbitronlab@gmail.com': 'loan_administrator',
        'hafssatou280@gmail.com': 'operations_team',
        'infoquandrox@gmail.com': 'core_banking'
      };

      const testRole = testEmails[email];

      if (isAdfdDomain || testRole) {
        return {
          allowed: true,
          user_role: testRole || 'archive_team' // Default to archive_team for @adfd.ae emails
        };
      }

      // Fallback to RPC for other cases
      const { data, error } = await supabase.rpc('validate_user_login', {
        user_email: email
      });

      if (error) {
        console.error('Domain validation error:', error);
        return {
          allowed: false,
          error: 'System validation error. Please contact your administrator.'
        };
      }

      return data;
    } catch (error) {
      console.error('Domain validation error:', error);
      return {
        allowed: false,
        error: 'Unable to validate user access. Please try again.'
      };
    }
  }

  useEffect(() => {
    // Fast initial session check - non-blocking
    const getInitialSession = async () => {
      try {
        const sessionStart = performance.now();
        console.log('🚀 Getting initial session...');

        // Simplified auth callback handling - let Supabase handle URL processing automatically

        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.warn('Session error (non-blocking):', error.message);
        } else {
          setSession(session);
          setUser(session?.user ?? null);

          const sessionTime = performance.now() - sessionStart;
          console.log(`✅ Session loaded in ${sessionTime.toFixed(2)}ms`, {
            hasSession: !!session
          });
        }
      } catch (error) {
        console.warn('Session check failed (non-blocking):', error.message);
      } finally {
        setLoading(false); // Always set loading to false when done
      }
    }

    getInitialSession();

    // Listen for auth changes - simplified for performance
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

        // Handle sign in with domain validation
        if (event === 'SIGNED_IN' && session?.user?.email) {
          try {
            const validation = await validateUserDomain(session.user.email);
            if (!validation.allowed) {
              console.warn('❌ User failed domain validation:', validation.error);
              await supabase.auth.signOut();
              return;
            }
            console.log('✅ User authenticated successfully:', session.user.email);
          } catch (error) {
            console.error('❌ Domain validation error:', error);
            await supabase.auth.signOut();
            return;
          }
        }
      }
    )

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  // Sign in with magic link
  const signInWithMagicLink = async (email) => {
    try {
      setLoading(true)
      console.log('🔄 Starting magic link process for:', email);

      // First validate the user domain
      const validation = await validateUserDomain(email)
      if (!validation.allowed) {
        console.warn('❌ Domain validation failed:', validation.error);
        return { data: null, error: validation.error }
      }

      console.log('✅ Domain validation passed');

      // Send magic link
      const data = await sendMagicLink(email)
      console.log('✅ Magic link sent successfully');
      return { data, error: null }

    } catch (error) {
      console.error('❌ Error in signInWithMagicLink:', error)

      // Provide user-friendly error messages
      let userMessage = 'Failed to send login link. Please try again.';

      if (error.message?.includes('Invalid login credentials')) {
        userMessage = 'Email not found. Please contact your administrator for access.';
      } else if (error.message?.includes('Email not confirmed')) {
        userMessage = 'Please check your email and confirm your account first.';
      } else if (error.message?.includes('Too many requests')) {
        userMessage = 'Too many login attempts. Please wait a few minutes before trying again.';
      } else if (error.message?.includes('Network')) {
        userMessage = 'Network error. Please check your connection and try again.';
      }

      return { data: null, error: userMessage }
    } finally {
      setLoading(false)
    }
  }

  // Sign out with complete session cleanup
  const handleSignOut = async () => {
    try {
      console.log('🔄 Starting logout process...');
      setLoading(true);

      // Clear user state immediately
      setUser(null);
      setSession(null);

      // Sign out from Supabase
      await signOut();
      console.log('✅ User signed out from Supabase successfully');

      // Clear any localStorage/sessionStorage data
      try {
        localStorage.removeItem('supabase.auth.token');
        sessionStorage.clear();
        console.log('✅ Local storage cleared');
      } catch (storageError) {
        console.warn('Warning: Could not clear storage:', storageError);
      }

      console.log('✅ Logout process completed');
      return { success: true };

    } catch (error) {
      console.error('Error signing out:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }

  // Get user profile from our custom user_profiles table
  const getUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in getUserProfile:', error)
      return null
    }
  }

  // Get user profile by email from our custom user_profiles table with test user fallback
  const getUserProfileByEmail = async (email) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching user profile by email:', error)
        return null
      }

      // If user exists in database, return it
      if (data) {
        return data
      }

      // Fallback: Create virtual profile for test emails
      const testEmails = {
        'aiglimcard@gmail.com': {
          full_name: 'Archive Team Test User',
          role: 'archive_team',
          department: 'Archive Department',
          regional_assignment: 'Global',
          can_create_requests: true,
          can_approve_reject: false,
          can_disburse: false,
          can_access_admin_dashboard: false,
          can_override_workflow: false
        },
        'rabbitronlab@gmail.com': {
          full_name: 'Loan Administrator Test User',
          role: 'loan_administrator',
          department: 'Loan Administration',
          regional_assignment: 'Global',
          can_create_requests: true,
          can_approve_reject: true,
          can_disburse: false,
          can_access_admin_dashboard: true,
          can_override_workflow: true
        },
        'hafssatou280@gmail.com': {
          full_name: 'Operations Team Africa Test User',
          role: 'operations_team',
          department: 'Operations Department',
          regional_assignment: 'Africa',
          can_create_requests: false,
          can_approve_reject: true,
          can_disburse: false,
          can_access_admin_dashboard: false,
          can_override_workflow: false
        },
        'infoquandrox@gmail.com': {
          full_name: 'Core Banking Test User',
          role: 'core_banking',
          department: 'Core Banking Department',
          regional_assignment: 'Global',
          can_create_requests: false,
          can_approve_reject: false,
          can_disburse: true,
          can_access_admin_dashboard: false,
          can_override_workflow: false
        }
      };

      const testProfile = testEmails[email];
      if (testProfile) {
        console.log(`🧪 Using test profile for ${email}:`, testProfile.role);
        return {
          id: `test-${email.split('@')[0]}`, // Generate test ID
          email: email,
          ...testProfile,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }

      return null
    } catch (error) {
      console.error('Error in getUserProfileByEmail:', error)
      return null
    }
  }

  // Add a function to validate user domain outside of auth flow
  const validateUserDomainExternal = async (email) => {
    return await validateUserDomain(email)
  }

  const value = {
    user,
    session,
    loading,
    signInWithMagicLink,
    signOut: handleSignOut,
    getUserProfile,
    getUserProfileByEmail,
    validateUserDomain: validateUserDomainExternal
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
