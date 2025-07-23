import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://dxrqbjuckrhkzrsdbenp.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4cnFianVja3Joa3pyc2RiZW5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NjE4NzQsImV4cCI6MjA1MDUzNzg3NH0.Ej6qJGGKZOJOGKOJOGKOJOGKOJOGKOJOGKOJOGKOJOG';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
