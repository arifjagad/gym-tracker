import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { WorkoutContainer } from '@/components/workout/workout-container'
import { Dumbbell, Plus } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function WorkoutLoggerPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="p-6 text-center text-sm font-body" style={{ color: 'var(--chalk-muted)' }}>
        Memuat...
      </div>
    )
  }

  const todayStr = new Date().toISOString().split('T')[0]

  // 1. Cek sesi hari ini
  const { data: todaySessions } = await supabase
    .from('sessions')
    .select('id, plan_id, workout_date, created_at')
    .eq('user_id', user.id)
    .eq('workout_date', todayStr)
    .order('created_at', { ascending: false })

  // 2. Muat rencana latihan terperinci
  const { data: plans } = await supabase
    .from('plans')
    .select(`
      id, name,
      plan_categories (
        id, category_name, day_of_week,
        plan_exercises (
          exercise_id,
          exercises ( id, name, body_part, target, equipment, gif_url )
        )
      )
    `)
    .order('created_at', { ascending: false })

  const availablePlans = plans || []

  if (availablePlans.length === 0) {
    return (
      <div className="px-4 py-5 space-y-6">
        {/* ── HEADER ── */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] font-display mb-1" style={{ color: 'var(--intensity)' }}>
            Sesi Latihan
          </p>
          <h1 className="font-display font-extrabold uppercase tracking-wide text-3xl" style={{ color: 'var(--chalk)' }}>
            Catat Workout
          </h1>
          <p className="font-body text-xs mt-1" style={{ color: 'var(--chalk-muted)' }}>
            Pilih template dan mulai catat setiap set hari ini.
          </p>
        </div>

        {/* ── EMPTY STATE ── */}
        <div
          className="rounded-2xl p-10 flex flex-col items-center text-center gap-5"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: 'var(--surface-raised)' }}
          >
            <Dumbbell className="w-7 h-7" style={{ color: 'var(--chalk-muted)' }} />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-display font-bold uppercase tracking-wide text-base" style={{ color: 'var(--chalk)' }}>
              Belum Ada Template
            </h3>
            <p className="font-body text-xs max-w-xs leading-relaxed" style={{ color: 'var(--chalk-muted)' }}>
              Buat template rencana latihan terlebih dahulu sebelum mulai mencatat sesi gym Anda.
            </p>
          </div>
          <Link
            href="/workout/plans"
            className="inline-flex items-center gap-2 py-3.5 px-6 rounded-2xl text-xs font-display font-bold uppercase tracking-wider active:scale-[0.97] transition-transform"
            style={{
              background: 'linear-gradient(135deg, var(--intensity), #ff6b4a)',
              color: '#fff',
              boxShadow: '0 4px 20px rgba(232,67,44,0.3)',
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            Buat Template
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-5">
      <WorkoutContainer todaySessions={todaySessions || []} plans={availablePlans} />
    </div>
  )
}
