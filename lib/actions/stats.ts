'use server'

import { createClient } from '@/lib/supabase/server'

export interface WeeklySummary {
  sessionCount: number
  totalVolumeKg: number
  consistencyPercent: number
}

export interface ChartDayData {
  dayLabel: string
  dateStr: string
  volume: number
}

export interface PersonalRecord {
  exerciseId: string
  name: string
  bodyPart: string | null
  maxWeightKg: number
  repsAtMax: number | null
  dateAchieved: string
}

const DAYS_IN_INDONESIAN = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

/**
 * Mengambil ringkasan statistik latihan user dalam 7 hari terakhir.
 */
export async function getWeeklyWorkoutSummary(): Promise<WeeklySummary> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { sessionCount: 0, totalVolumeKg: 0, consistencyPercent: 0 }
  }

  // Ambil tanggal 7 hari yang lalu
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]

  // Fetch semua sesi latihan dalam 7 hari terakhir
  const { data: sessions, error: sessionError } = await supabase
    .from('sessions')
    .select(`
      id,
      workout_date,
      workout_logs (
        reps,
        weight_kg
      )
    `)
    .eq('user_id', user.id)
    .gte('workout_date', sevenDaysAgoStr)

  if (sessionError || !sessions) {
    return { sessionCount: 0, totalVolumeKg: 0, consistencyPercent: 0 }
  }

  const sessionCount = sessions.length

  // Hitung total volume angkatan
  let totalVolumeKg = 0
  sessions.forEach((s) => {
    const logs = s.workout_logs || []
    logs.forEach((l: any) => {
      const reps = l.reps || 0
      const weight = l.weight_kg ? parseFloat(l.weight_kg) : 0
      totalVolumeKg += reps * weight
    })
  })

  // Hitung persentase konsistensi (misal target latihan 3x seminggu = 100%)
  const targetSessionsPerWeek = 3
  const consistencyPercent = Math.min(100, Math.round((sessionCount / targetSessionsPerWeek) * 100))

  return {
    sessionCount,
    totalVolumeKg: Math.round(totalVolumeKg),
    consistencyPercent,
  }
}

/**
 * Mengambil data volume harian selama 7 hari terakhir untuk di-plot ke grafik Recharts.
 */
export async function getDailyVolumeChartData(): Promise<ChartDayData[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  const chartData: ChartDayData[] = []
  
  // Inisialisasi daftar 7 hari terakhir
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    const dayLabel = DAYS_IN_INDONESIAN[date.getDay()]

    chartData.push({
      dayLabel,
      dateStr,
      volume: 0,
    })
  }

  const startDateStr = chartData[0].dateStr

  // Query sesi & logs
  const { data: sessions } = await supabase
    .from('sessions')
    .select(`
      workout_date,
      workout_logs (
        reps,
        weight_kg
      )
    `)
    .eq('user_id', user.id)
    .gte('workout_date', startDateStr)

  if (sessions) {
    sessions.forEach((session) => {
      const matchedDay = chartData.find((d) => d.dateStr === session.workout_date)
      if (matchedDay) {
        const logs = session.workout_logs || []
        let dailyVolume = 0
        logs.forEach((log: any) => {
          const reps = log.reps || 0
          const weight = log.weight_kg ? parseFloat(log.weight_kg) : 0
          dailyVolume += reps * weight
        })
        matchedDay.volume += Math.round(dailyVolume)
      }
    })
  }

  return chartData
}

/**
 * Mengambil rekor pribadi (PR) angkatan maksimal untuk setiap jenis gerakan latihan unik milik user.
 */
export async function getPersonalRecords(): Promise<PersonalRecord[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  // Fetch seluruh logs workout milik user
  const { data: logs, error } = await supabase
    .from('workout_logs')
    .select(`
      reps,
      weight_kg,
      exercise_id,
      created_at,
      exercises (
        name,
        body_part
      ),
      sessions!inner (
        user_id,
        workout_date
      )
    `)
    .eq('sessions.user_id', user.id)

  if (error || !logs || logs.length === 0) {
    return []
  }

  // Kelompokkan dan cari berat maksimal per exercise
  const prMap = new Map<string, PersonalRecord>()

  logs.forEach((log: any) => {
    const exId = log.exercise_id
    const exName = log.exercises?.name || 'Gerakan Latihan'
    const bodyPart = log.exercises?.body_part || 'Umum'
    const weight = log.weight_kg ? parseFloat(log.weight_kg) : 0
    const reps = log.reps || 0
    const dateStr = log.sessions?.workout_date || new Date(log.created_at).toISOString().split('T')[0]

    const existingPr = prMap.get(exId)

    if (!existingPr || weight > existingPr.maxWeightKg) {
      prMap.set(exId, {
        exerciseId: exId,
        name: exName,
        bodyPart,
        maxWeightKg: weight,
        repsAtMax: reps,
        dateAchieved: dateStr,
      })
    }
  })

  // Urutkan berdasarkan berat maksimal, ambil top 5 PR
  const prList = Array.from(prMap.values())
    .sort((a, b) => b.maxWeightKg - a.maxWeightKg)
    .slice(0, 5)

  return prList
}

/**
 * Mengambil riwayat latihan dalam 4 minggu terakhir untuk melacak konsistensi (Consistency Grid).
 */
export async function getMonthlyConsistencyData(): Promise<{ dateStr: string; hasWorkout: boolean }[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  const dataGrid: { dateStr: string; hasWorkout: boolean }[] = []

  // Ambil daftar tanggal selama 28 hari terakhir (4 minggu)
  for (let i = 27; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    dataGrid.push({
      dateStr,
      hasWorkout: false,
    })
  }

  const startDateStr = dataGrid[0].dateStr

  // Query database sessions
  const { data: sessions } = await supabase
    .from('sessions')
    .select('workout_date')
    .eq('user_id', user.id)
    .gte('workout_date', startDateStr)

  if (sessions) {
    sessions.forEach((s) => {
      const match = dataGrid.find((g) => g.dateStr === s.workout_date)
      if (match) {
        match.hasWorkout = true
      }
    })
  }

  return dataGrid
}
