'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTapFeedback } from '@/hooks/use-tap-feedback'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  
  const supabase = createClient()
  const { ref: buttonRef, onPointerDown } = useTapFeedback()

  const handleGoogleLogin = async () => {
    setLoading(true)
    setErrorMessage(null)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // Arahkan ke endpoint callback API untuk pertukaran token
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      })
      if (error) {
        setErrorMessage(error.message)
        setLoading(false)
      }
    } catch (err) {
      setErrorMessage('Terjadi kesalahan koneksi.')
      setLoading(false)
    }
  }

  return (
    <div
      className="w-full max-w-sm p-8 rounded-xl border space-y-6"
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--border)',
      }}
    >
      <div className="text-center space-y-2">
        <h1 className="font-display text-4xl font-bold tracking-tight" style={{ color: 'var(--chalk)' }}>
          Gym Tracker
        </h1>
        <p className="font-body text-xs" style={{ color: 'var(--chalk-muted)' }}>
          Masuk untuk mencatat rekor dan memantau progres Anda.
        </p>
      </div>

      {errorMessage && (
        <div
          className="p-3 rounded text-xs font-body border"
          style={{
            backgroundColor: 'rgba(232, 67, 44, 0.1)',
            borderColor: 'var(--intensity)',
            color: 'var(--intensity)',
          }}
        >
          {errorMessage}
        </div>
      )}

      <button
        ref={buttonRef}
        onPointerDown={onPointerDown}
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg font-body text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 cursor-pointer"
        style={{
          backgroundColor: 'var(--surface-raised)',
          color: 'var(--chalk)',
          border: '1px solid var(--border)',
        }}
      >
        {/* SVG Google Icon */}
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#EA4335"
            d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.555 0-6.435-2.88-6.435-6.435s2.88-6.435 6.435-6.435c1.637 0 3.136.614 4.29 1.625l3.095-3.09C19.167 2.152 15.93 1 12.24 1 6.032 1 1 6.032 1 12.24s5.032 11.24 11.24 11.24c5.897 0 10.866-4.223 10.866-11.24 0-.668-.057-1.336-.17-1.955H12.24Z"
          />
        </svg>
        <span>{loading ? 'Menghubungkan...' : 'Masuk dengan Google'}</span>
      </button>

      <div className="text-center pt-2">
        <p className="text-[10px]" style={{ color: 'var(--chalk-muted)' }}>
          Dengan masuk, Anda menyetujui ketentuan layanan personal use kami.
        </p>
      </div>
    </div>
  )
}
