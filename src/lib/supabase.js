import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

// Optimized Supabase configuration for fast authentication
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storageKey: 'adfd-auth-token',
    debug: false // Disable debug for production performance
  },
  global: {
    headers: {
      'X-Client-Info': 'adfd-tracking-system'
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10 // Limit realtime events for better performance
    }
  }
})

// Helper function to get current user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) {
    console.error('Error getting current user:', error)
    return null
  }
  return user
}

// Helper function to sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Error signing out:', error)
    throw error
  }
}

// Optimized magic link function for fast authentication
export const sendMagicLink = async (email) => {
  try {
    console.log('🚀 Sending magic link to:', email);

    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        shouldCreateUser: true, // Allow user creation for magic links
        data: {
          timestamp: Date.now() // Add timestamp for tracking
        }
      }
    });

    if (error) {
      console.error('❌ Error sending magic link:', error);
      throw error;
    }

    console.log('✅ Magic link sent successfully');
    return data;
  } catch (error) {
    console.error('❌ Magic link error:', error);
    throw error;
  }
}
