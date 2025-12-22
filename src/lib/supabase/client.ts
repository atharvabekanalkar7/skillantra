import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  // Check if variables are missing or empty
  if (!supabaseUrl || supabaseUrl === '' || !supabaseAnonKey || supabaseAnonKey === '') {
    const missingVars = [];
    if (!supabaseUrl || supabaseUrl === '') missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
    if (!supabaseAnonKey || supabaseAnonKey === '') missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    
    throw new Error(
      `Missing Supabase environment variables: ${missingVars.join(', ')}. ` +
      `Please ensure these are set in your .env.local file and restart your development server.`
    );
  }

  try {
    return createBrowserClient(supabaseUrl, supabaseAnonKey);
  } catch (error: any) {
    // If createBrowserClient throws its own error, wrap it with more context
    if (error.message?.includes('supabaseKey') || error.message?.includes('key')) {
      throw new Error(
        `Supabase configuration error: ${error.message}. ` +
        `Please check that NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are correctly set in .env.local and restart your dev server.`
      );
    }
    throw error;
  }
}

