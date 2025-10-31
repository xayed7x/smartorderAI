// lib/supabase.ts

import { createClient } from '@supabase/supabase-js';

// Get the environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if the variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be defined in .env.local');
}

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);