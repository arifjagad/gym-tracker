'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Dumbbell, ArrowLeft } from 'lucide-react'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const handleGoogleLogin = async () => {
    console.log('DEBUG: handleGoogleLogin triggered!')
    setLoading(true)
    setError(null)
    try {
      const searchParams = new URLSearchParams(window.location.search)
      const nextPath = searchParams.get('redirect')
      const redirectUrl = `${window.location.origin}/api/auth/callback${
        nextPath ? `?next=${encodeURIComponent(nextPath)}` : ''
      }`
      console.log('DEBUG: Attempting signInWithOAuth with redirectUrl:', redirectUrl)
      
      const res = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      })
      
      console.log('DEBUG: Supabase auth signInWithOAuth resolved response:', res)
      
      if (res.error) {
        console.error('DEBUG: Supabase returned error:', res.error)
        setError(res.error.message)
        setLoading(false)
      } else {
        console.log('DEBUG: Redirection should happen now to URL:', res.data?.url)
      }
    } catch (err) {
      console.error('DEBUG: Caught exception in handleGoogleLogin:', err)
      setError('Terjadi kesalahan koneksi. Coba lagi.')
      setLoading(false)
    }
  }

  return (
    <div
      className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative min-h-dvh"
      style={{ backgroundColor: 'var(--bg-base)' }}
    >
      {/* Background red glow blob */}
      <div
        className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(232,67,44,0.12) 0%, transparent 65%)' }}
      />
      <div
        className="absolute bottom-[-10%] right-[-10%] w-[250px] h-[250px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(232,67,44,0.08) 0%, transparent 65%)' }}
      />

      {/* Back to home */}
      <Link
        href="/"
        className="absolute top-6 left-6 flex items-center gap-1.5 text-[10px] font-body uppercase tracking-wider transition-opacity hover:opacity-70"
        style={{ color: 'var(--chalk-muted)' }}
      >
        <ArrowLeft className="w-3 h-3" />
        Beranda
      </Link>

      {/* Logo */}
      <div className="flex items-center gap-2 mb-10 relative z-10">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: 'var(--intensity)', boxShadow: '0 0 16px rgba(232,67,44,0.4)' }}
        >
          <Dumbbell className="w-4 h-4 text-white" />
        </div>
        <span className="font-display font-extrabold uppercase tracking-widest text-sm" style={{ color: 'var(--chalk)' }}>
          GymTracker
        </span>
      </div>

      {/* Form card */}
      <div className="w-full max-w-sm space-y-8 relative z-10">
        {/* Header */}
        <div className="space-y-2 text-center">
          <h2
            className="font-display font-extrabold uppercase tracking-wide text-2xl"
            style={{ color: 'var(--chalk)' }}
          >
            Selamat Datang
          </h2>
          <p className="font-body text-xs leading-relaxed" style={{ color: 'var(--chalk-muted)' }}>
            Masuk untuk mulai mencatat latihan dan memantau progres Anda.
          </p>
        </div>

        {/* Divider */}
        <div className="h-px" style={{ backgroundColor: 'var(--border)' }} />

        {/* Error message */}
        {error && (
          <div
            className="p-3 rounded-lg text-xs font-body border flex items-start gap-2"
            style={{
              backgroundColor: 'rgba(232, 67, 44, 0.08)',
              borderColor: 'rgba(232, 67, 44, 0.3)',
              color: 'var(--intensity)',
            }}
          >
            <span className="flex-shrink-0 mt-0.5">⚠</span>
            <span>{error}</span>
          </div>
        )}

        {/* Google Sign In Button */}
        <div className="space-y-3">
          <button
            id="btn-google-login"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-5 rounded-xl font-body font-semibold text-sm transition-all disabled:opacity-50 cursor-pointer active:scale-[0.98]"
            style={{
              backgroundColor: 'var(--surface-raised)',
              color: 'var(--chalk)',
              border: '1px solid var(--border-strong)',
            }}
          >
            {loading ? (
              <>
                <div
                  className="w-4 h-4 rounded-full border-2 animate-spin flex-shrink-0"
                  style={{ borderColor: 'rgba(255,255,255,0.2)', borderTopColor: 'var(--chalk)' }}
                />
                <span>Menghubungkan...</span>
              </>
            ) : (
              <>
                {/* Google icon */}
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z"/>
                  <path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.823l-4.04 3.067A11.965 11.965 0 0 0 12 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987Z"/>
                  <path fill="#4A90E2" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21Z"/>
                  <path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 0 1 4.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 0 0 0 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067Z"/>
                </svg>
                <span>Lanjutkan dengan Google</span>
              </>
            )}
          </button>
        </div>

        {/* Terms */}
        <p className="text-center text-[10px] font-body leading-relaxed" style={{ color: 'rgba(255,255,255,0.25)' }}>
          Dengan masuk, Anda menyetujui{' '}
          <a href="#" className="underline underline-offset-2 hover:opacity-70 transition-opacity" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Ketentuan Layanan
          </a>{' '}
          dan{' '}
          <a href="#" className="underline underline-offset-2 hover:opacity-70 transition-opacity" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Kebijakan Privasi
          </a>{' '}
          kami.
        </p>
      </div>
    </div>
  )
}
