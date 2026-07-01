import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  // Support both naming conventions:
  // - NEXT_PUBLIC_SUPABASE_ANON_KEY (classic Supabase)
  // - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (newer Supabase dashboard)
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

  return createBrowserClient(supabaseUrl, supabaseKey)
}
