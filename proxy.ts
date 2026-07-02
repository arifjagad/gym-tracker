import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Pastikan URL dan Key ada untuk inisialisasi client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Membaca user session secara aman dari server-side
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // Definisikan path yang bebas diakses tanpa login
  // - Halaman Landing Page (/)
  // - Endpoint API (/api/*)
  // - Halaman Login (/login)
  // - File PWA & Assets (/manifest.webmanifest, /manifest.json, /sw.js, /icon.svg)
  const isPublicPath =
    path === '/' ||
    path === '/login' ||
    path.startsWith('/api/') ||
    path === '/manifest.webmanifest' ||
    path === '/manifest.json' ||
    path === '/sw.js' ||
    path === '/icon.svg'

  // Kasus 1: User belum login & mencoba mengakses halaman terproteksi (dashboard, workout, dll)
  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Kasus 2: User sudah login & mencoba masuk ke halaman login kembali
  if (user && path === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Cocokkan semua request path kecuali untuk static files dan images:
     * - _next/static (static files Next.js)
     * - _next/image (image optimization)
     * - favicon.ico (favicon file)
     * - File gambar (svg, png, jpg, webp, dll)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
