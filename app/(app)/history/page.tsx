import { createClient } from '@/lib/supabase/server'
import { HistoryManager } from '@/components/workout/history-manager'
import { getUserSessionsHistory, getUserExercisesList } from '@/lib/actions/history'

export const dynamic = 'force-dynamic'

export default async function HistoryPage() {
  const supabase = await createClient()

  // Ambil data user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main className="p-6 text-center" style={{ color: 'var(--chalk-muted)' }}>
        Memuat data autentikasi...
      </main>
    )
  }

  // Load Data Riwayat Latihan di Server
  const [sessions, exercisesList] = await Promise.all([
    getUserSessionsHistory(),
    getUserExercisesList(),
  ])

  return (
    <main className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header Halaman */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] font-display mb-1" style={{ color: 'var(--intensity)' }}>
          Riwayat
        </p>
        <h1 className="font-display font-extrabold uppercase tracking-wide text-3xl" style={{ color: 'var(--chalk)' }}>
          Riwayat Latihan
        </h1>
        <p className="font-body text-xs mt-1" style={{ color: 'var(--chalk-muted)' }}>
          Lihat kembali sesi latihan terdahulu dan telusuri kemajuan volume angkatan gym Anda.
        </p>
      </div>

      {/* History Manager Container */}
      <HistoryManager sessions={sessions} exercisesList={exercisesList} />
    </main>
  )
}
