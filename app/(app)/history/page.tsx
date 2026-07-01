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
        <h1 className="font-display text-4xl font-bold tracking-wider" style={{ color: 'var(--chalk)' }}>
          RIWAYAT LATIHAN
        </h1>
        <p className="font-body text-xs" style={{ color: 'var(--chalk-muted)' }}>
          Lihat kembali sesi latihan terdahulu dan telusuri kemajuan volume angkatan gym Anda.
        </p>
      </div>

      {/* History Manager Container */}
      <HistoryManager sessions={sessions} exercisesList={exercisesList} />
    </main>
  )
}
