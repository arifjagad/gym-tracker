'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useTapFeedback } from '@/hooks/use-tap-feedback'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const router = useRouter()
  const { ref: logoutRef, onPointerDown } = useTapFeedback()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh() // Memicu middleware untuk mengarahkan kembali ke /login
  }

  return (
    <div className="flex flex-col min-h-dvh">
      {/* Header Utama Sementara */}
      <header
        className="border-b px-6 py-4 flex items-center justify-between"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)',
        }}
      >
        <span className="font-display text-xl font-bold tracking-wider" style={{ color: 'var(--chalk)' }}>
          Gym Tracker
        </span>
        <button
          ref={logoutRef}
          onPointerDown={onPointerDown}
          onClick={handleLogout}
          className="px-3 py-1.5 rounded text-xs font-semibold font-body cursor-pointer transition-colors hover:text-[--chalk]"
          style={{
            backgroundColor: 'var(--surface-raised)',
            color: 'var(--chalk-muted)',
            border: '1px solid var(--border)',
          }}
        >
          Logout
        </button>
      </header>

      {/* Konten Halaman */}
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  )
}
