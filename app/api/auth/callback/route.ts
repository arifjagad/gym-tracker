import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * OAuth callback handler — Supabase auth redirect.
 * Menerima auth code, menukarkannya dengan session cookie,
 * lalu mengarahkan user ke area aplikasi terproteksi (/dashboard).
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
  // Jika ada parameter redirect default, kita bisa tangkap di sini
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Login sukses, redirect ke halaman dashboard/tujuan
      return NextResponse.redirect(new URL(next, request.url))
    }
    
    // Log error jika ada masalah pertukaran token
    console.error('Callback OAuth error:', error.message)
  }

  // Jika gagal atau tidak ada code, lempar balik ke login page dengan status error
  return NextResponse.redirect(new URL('/login?error=auth-callback-failed', request.url))
}
