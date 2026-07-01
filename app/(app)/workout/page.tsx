import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { StartWorkoutSelector } from '@/components/workout/start-workout-selector'
import { WorkoutLogger } from '@/components/workout/workout-logger'
import { Dumbbell, Plus } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function WorkoutLoggerPage() {
  const supabase = await createClient()

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

  const todayStr = new Date().toISOString().split('T')[0]

  // 1. Cek sesi aktif hari ini
  const { data: activeSession } = await supabase
    .from('sessions')
    .select('id, plan_id, workout_date, created_at')
    .eq('user_id', user.id)
    .eq('workout_date', todayStr)
    .limit(1)
    .maybeSingle()

  // 2. Jika ada sesi aktif, muat exercises dari plan
  if (activeSession) {
    let planDetails = null
    if (activeSession.plan_id) {
      const { data } = await supabase
        .from('plans')
        .select(`
          id,
          name,
          plan_categories (
            id,
            category_name,
            day_of_week,
            plan_exercises (
              exercise_id,
              exercises (
                id,
                name,
                body_part,
                target,
                equipment
              )
            )
          )
        `)
        .eq('id', activeSession.plan_id)
        .single()
      planDetails = data
    }

    return (
      <main className="p-6 max-w-4xl mx-auto">
        <WorkoutLogger session={activeSession} planDetails={planDetails as any} />
      </main>
    )
  }

  // 3. Jika belum ada sesi aktif, muat plans untuk pemilihan awal
  const { data: plans } = await supabase
    .from('plans')
    .select(`
      id,
      name,
      plan_categories (
        id,
        category_name,
        day_of_week
      )
    `)
    .order('created_at', { ascending: false })

  const availablePlans = plans || []

  return (
    <main className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header Halaman */}
      <div>
        <h1 className="font-display text-4xl font-bold tracking-wider" style={{ color: 'var(--chalk)' }}>
          CATAT WORKOUT
        </h1>
        <p className="font-body text-xs" style={{ color: 'var(--chalk-muted)' }}>
          Mulai dan catat beban serta repetisi latihan Anda hari ini secara presisi.
        </p>
      </div>

      {availablePlans.length === 0 ? (
        /* Empty State: Belum buat template plans */
        <div
          className="p-16 rounded-xl border flex flex-col items-center justify-center text-center space-y-4"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
          }}
        >
          <div
            className="p-4 rounded-full flex items-center justify-center inline-flex"
            style={{ backgroundColor: 'var(--surface-raised)' }}
          >
            <Dumbbell className="w-8 h-8" style={{ color: 'var(--chalk-muted)' }} />
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-xl font-bold uppercase tracking-wider" style={{ color: 'var(--chalk)' }}>
              Belum Ada Template Latihan
            </h3>
            <p className="font-body text-xs max-w-sm mx-auto" style={{ color: 'var(--chalk-muted)' }}>
              Anda harus membuat template rencana latihan (*workout plans*) terlebih dahulu sebelum mulai mencatat latihan.
            </p>
          </div>
          <Link
            href="/workout/plans"
            className="flex items-center gap-2 py-3 px-5 rounded-lg text-xs font-bold tracking-wider font-display uppercase cursor-pointer"
            style={{
              backgroundColor: 'var(--intensity)',
              color: 'var(--chalk)',
            }}
          >
            <Plus className="w-4 h-4" />
            Buat Template Latihan
          </Link>
        </div>
      ) : (
        /* Pemilih Plan Untuk Memulai Sesi */
        <StartWorkoutSelector plans={availablePlans as any[]} />
      )}
    </main>
  )
}
