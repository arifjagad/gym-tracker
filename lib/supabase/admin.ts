import { createClient } from '@supabase/supabase-js'

/**
 * Admin client — menggunakan service_role key yang BYPASS semua RLS.
 *
 * ⚠️  HANYA boleh di-import dari app/api/** (Route Handlers).
 *     Jangan pernah import dari Client Component atau Server Component biasa —
 *     service_role key akan ter-bundle ke browser.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
