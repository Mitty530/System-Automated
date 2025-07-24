import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://dxrqbjuckrhkzrsdbenp.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4cnFianVja3Joa3pyc2RiZW5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwODYwOTMsImV4cCI6MjA2ODY2MjA5M30.awjOetr7d9oMnhTCShz3ilWFLwOB0DAhrIwa7xJV7v4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'adfd-auth-token'
  }
});
