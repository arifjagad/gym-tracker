'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Download, LogIn, Loader2, CheckCircle2 } from 'lucide-react'
import { importSharedPlanAction } from '@/lib/actions/plans'
import { useTapFeedback } from '@/hooks/use-tap-feedback'

interface SharePreviewClientProps {
  planId: string
  isLoggedIn: boolean
}

export function SharePreviewClient({ planId, isLoggedIn }: SharePreviewClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { ref: btnRef, onPointerDown: btnDown } = useTapFeedback()

  const handleImport = async () => {
    setLoading(true)
    setError(null)
    try {
      await importSharedPlanAction(planId)
      setSuccess(true)

      // Haptic feedback (getar ganda)
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([100, 50, 100])
      }

      setTimeout(() => {
        router.push('/workout/plans')
        router.refresh()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengimpor rencana latihan.')
      setLoading(false)
    }
  }

  const handleLoginRedirect = () => {
    router.push(`/login?redirect=/plans/share/${planId}`)
  }

  if (success) {
    return (
      <div
        className="p-5 rounded-2xl border text-center flex flex-col items-center gap-3 animate-pulse"
        style={{
          backgroundColor: 'rgba(76, 175, 80, 0.08)',
          borderColor: 'rgba(76, 175, 80, 0.3)',
          color: 'var(--progress)'
        }}
      >
        <CheckCircle2 className="w-8 h-8 text-[var(--progress)]" />
        <div>
          <h4 className="font-display font-bold uppercase tracking-wider text-sm">Berhasil Diimpor!</h4>
          <p className="font-body text-xs mt-1 text-[var(--progress)] opacity-90">
            Mengalihkan ke daftar template rencana latihan Anda...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {isLoggedIn ? (
        <button
          ref={btnRef as any}
          onPointerDown={btnDown}
          onClick={handleImport}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl text-sm font-bold tracking-wider font-display uppercase cursor-pointer disabled:opacity-50 transition-all active:scale-[0.98]"
          style={{
            backgroundColor: 'var(--intensity)',
            backgroundImage: 'linear-gradient(135deg, var(--intensity), #ff5a3d)',
            color: 'var(--chalk)',
          }}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {loading ? 'Mengimpor...' : 'Impor Rencana Latihan'}
        </button>
      ) : (
        <button
          ref={btnRef as any}
          onPointerDown={btnDown}
          onClick={handleLoginRedirect}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl text-sm font-bold tracking-wider font-display uppercase cursor-pointer transition-all active:scale-[0.98]"
          style={{
            backgroundColor: 'var(--surface-raised)',
            border: '1px solid var(--border)',
            color: 'var(--chalk)',
          }}
        >
          <LogIn className="w-4 h-4" style={{ color: 'var(--intensity)' }} />
          Masuk untuk Mengimpor
        </button>
      )}

      {error && (
        <div
          className="p-3.5 rounded-xl border text-xs font-body text-center"
          style={{
            backgroundColor: 'rgba(232, 67, 44, 0.08)',
            borderColor: 'rgba(232, 67, 44, 0.3)',
            color: 'var(--intensity)'
          }}
        >
          {error}
        </div>
      )}
    </div>
  )
}
