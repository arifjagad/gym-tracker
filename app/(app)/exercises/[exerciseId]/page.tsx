import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Dumbbell, Target, HelpCircle, ArrowLeft, Calendar, Award } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ exerciseId: string }>
}

interface GroupedSessionLogs {
  dateStr: string
  formattedDate: string
  sets: {
    set_number: number
    reps: number | null
    weight_kg: number | null
  }[]
}

export default async function ExerciseDetailPage({ params }: PageProps) {
  const resolvedParams = await params
  const exerciseId = resolvedParams.exerciseId

  const supabase = await createClient()

  // Ambil data user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 1. Ambil detail exercise
  const { data: exercise, error: exError } = await supabase
    .from('exercises')
    .select('*')
    .eq('id', exerciseId)
    .single()

  if (exError || !exercise) {
    redirect('/exercises')
  }

  // 2. Ambil riwayat angkatan personal user untuk exercise ini
  const { data: logs, error: logsError } = await supabase
    .from('workout_logs')
    .select(`
      id,
      set_number,
      reps,
      weight_kg,
      created_at,
      sessions!inner (
        workout_date,
        user_id
      )
    `)
    .eq('exercise_id', exerciseId)
    .eq('sessions.user_id', user.id)
    .order('created_at', { ascending: false })

  // Kelompokkan logs berdasarkan tanggal latihan
  const groupedSessionsMap = new Map<string, GroupedSessionLogs>()
  let maxWeightKg = 0

  if (logs) {
    logs.forEach((log: any) => {
      const dateStr = log.sessions.workout_date
      const weight = log.weight_kg ? parseFloat(log.weight_kg) : 0
      
      if (weight > maxWeightKg) {
        maxWeightKg = weight
      }

      const existingGroup = groupedSessionsMap.get(dateStr)
      const setItem = {
        set_number: log.set_number,
        reps: log.reps,
        weight_kg: log.weight_kg ? parseFloat(log.weight_kg) : null,
      }

      if (existingGroup) {
        existingGroup.sets.push(setItem)
      } else {
        const dateObj = new Date(dateStr)
        const formattedDate = dateObj.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })
        groupedSessionsMap.set(dateStr, {
          dateStr,
          formattedDate,
          sets: [setItem]
        })
      }
    })
  }

  const groupedSessionsList = Array.from(groupedSessionsMap.values())
  // Sort sets inside each grouped session by set_number ascending
  groupedSessionsList.forEach((group) => {
    group.sets.sort((a, b) => a.set_number - b.set_number)
  })

  return (
    <main className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header Back Button */}
      <div className="flex items-center gap-3">
        <Link
          href="/exercises"
          className="p-2 rounded-lg border hover:bg-[--surface-raised] transition-colors"
          style={{ borderColor: 'var(--border)', color: 'var(--chalk-muted)' }}
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--chalk-muted)' }}>
          Kembali ke Katalog
        </span>
      </div>

      {/* Detail Latihan & GIF Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Info detail (col-span-8) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="space-y-3">
            <h1 className="font-display text-4xl md:text-5xl font-extrabold uppercase tracking-wide leading-none" style={{ color: 'var(--chalk)' }}>
              {exercise.name}
            </h1>
            
            {/* Badges */}
            <div className="flex flex-wrap gap-2 pt-1">
              {exercise.body_part && (
                <span className="px-2.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider font-body bg-[--surface-raised] text-[--chalk-muted]">
                  {exercise.body_part}
                </span>
              )}
              {exercise.target && (
                <span className="px-2.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider font-body flex items-center gap-1 bg-[rgba(232,67,44,0.1)] text-[--intensity]">
                  <Target className="w-3 h-3" />
                  {exercise.target}
                </span>
              )}
              {exercise.equipment && (
                <span className="px-2.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider font-body flex items-center gap-1 bg-[--surface-raised] text-[--chalk-muted]">
                  <Dumbbell className="w-3 h-3" />
                  Alat: {exercise.equipment}
                </span>
              )}
            </div>
          </div>

          {/* Instruksi Latihan */}
          {exercise.instructions && exercise.instructions.length > 0 && (
            <div className="p-6 rounded-xl border space-y-4" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
              <h3 className="font-display text-lg font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--chalk)' }}>
                <HelpCircle className="w-4 h-4" />
                Instruksi Langkah-demi-Langkah
              </h3>
              <ol className="list-decimal pl-5 space-y-2 text-xs font-body leading-relaxed" style={{ color: 'var(--chalk-muted)' }}>
                {exercise.instructions.map((inst: string, idx: number) => (
                  <li key={idx} className="pl-1">
                    {inst}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {/* GIF Demonstasi (col-span-4) */}
        {exercise.gif_url && (
          <div className="lg:col-span-4 p-5 rounded-xl border space-y-3 flex flex-col items-center text-center" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-60" style={{ color: 'var(--chalk-muted)' }}>
              Demonstrasi Gerakan
            </span>
            <img
              src={exercise.gif_url}
              alt={exercise.name}
              className="w-full max-w-xs rounded-lg border bg-[--surface-raised]"
              style={{ borderColor: 'var(--border)' }}
            />
          </div>
        )}
      </div>

      {/* RIWAYAT ANGKATAN PERSONAL */}
      <div className="p-6 rounded-xl border space-y-4" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 opacity-65" style={{ color: 'var(--chalk-muted)' }} />
            <h3 className="font-display text-xl font-bold uppercase tracking-wider" style={{ color: 'var(--chalk)' }}>
              Riwayat Angkatan Personal Anda
            </h3>
          </div>
          
          {maxWeightKg > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-numeric font-extrabold text-xs" style={{ backgroundColor: 'var(--surface-raised)', borderColor: 'var(--border)', color: 'var(--progress)' }}>
              <Award className="w-4 h-4" />
              PR TERBAIK: {maxWeightKg} KG
            </div>
          )}
        </div>

        {groupedSessionsList.length === 0 ? (
          <div className="py-8 text-center text-xs font-body" style={{ color: 'var(--chalk-muted)' }}>
            Anda belum pernah mencatatkan logs untuk gerakan latihan ini. Mulailah latihan untuk melihat riwayat personal Anda!
          </div>
        ) : (
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
            {groupedSessionsList.map((session) => (
              <div
                key={session.dateStr}
                className="p-4 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                style={{ backgroundColor: 'var(--surface-raised)', borderColor: 'var(--border)' }}
              >
                <div className="space-y-1">
                  <p className="font-display text-sm font-bold uppercase tracking-wide" style={{ color: 'var(--chalk)' }}>
                    Sesi Latihan
                  </p>
                  <p className="text-[10px] font-body" style={{ color: 'var(--chalk-muted)' }}>
                    Tanggal: {session.formattedDate}
                  </p>
                </div>

                {/* Sets Grid */}
                <div className="flex flex-wrap gap-2">
                  {session.sets.map((set) => (
                    <div
                      key={set.set_number}
                      className="py-1.5 px-2.5 rounded border text-[10px] font-body"
                      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--chalk-muted)' }}
                    >
                      Set {set.set_number}: <span className="font-numeric font-bold" style={{ color: 'var(--chalk)' }}>{set.weight_kg}kg × {set.reps}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
