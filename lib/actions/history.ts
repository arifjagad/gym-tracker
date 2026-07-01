'use server'

import { createClient } from '@/lib/supabase/server'

export interface HistoryExerciseLog {
  id: string
  set_number: number
  reps: number | null
  weight_kg: number | null
  exerciseName: string
  bodyPart: string | null
}

export interface GroupedExerciseLogs {
  exerciseId: string
  exerciseName: string
  bodyPart: string | null
  sets: {
    set_number: number
    reps: number | null
    weight_kg: number | null
  }[]
}

export interface HistorySession {
  id: string
  workout_date: string
  planName: string | null
  totalVolumeKg: number
  exercises: GroupedExerciseLogs[]
}

export interface SimpleExerciseItem {
  id: string
  name: string
  body_part: string | null
}

export interface ProgressDataPoint {
  dateStr: string
  formattedDate: string
  maxWeightKg: number
  totalVolumeKg: number
}

/**
 * Mengambil seluruh riwayat sesi workout milik user beserta detail angkatan
 * yang dikelompokkan berdasarkan gerakan latihan (exercises).
 */
export async function getUserSessionsHistory(): Promise<HistorySession[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  const { data: sessions, error } = await supabase
    .from('sessions')
    .select(`
      id,
      workout_date,
      plans (
        name
      ),
      workout_logs (
        id,
        set_number,
        reps,
        weight_kg,
        exercises (
          id,
          name,
          body_part
        )
      )
    `)
    .eq('user_id', user.id)
    .order('workout_date', { ascending: false })

  if (error || !sessions) {
    return []
  }

  return sessions.map((s: any) => {
    const logs = s.workout_logs || []
    
    // Hitung total volume tonase untuk sesi ini
    let totalVolumeKg = 0
    
    // Kelompokkan logs berdasarkan exercise_id
    const exGroupsMap = new Map<string, GroupedExerciseLogs>()

    logs.forEach((log: any) => {
      const exId = log.exercises?.id
      if (!exId) return

      const reps = log.reps || 0
      const weight = log.weight_kg ? parseFloat(log.weight_kg) : 0
      totalVolumeKg += reps * weight

      const existingGroup = exGroupsMap.get(exId)
      const setItem = {
        set_number: log.set_number,
        reps: log.reps,
        weight_kg: log.weight_kg ? parseFloat(log.weight_kg) : null,
      }

      if (existingGroup) {
        existingGroup.sets.push(setItem)
      } else {
        exGroupsMap.set(exId, {
          exerciseId: exId,
          exerciseName: log.exercises.name,
          bodyPart: log.exercises.body_part,
          sets: [setItem],
        })
      }
    })

    // Urutkan set di setiap kelompok exercises
    const groupedExercises = Array.from(exGroupsMap.values()).map((group) => {
      group.sets.sort((a, b) => a.set_number - b.set_number)
      return group
    })

    return {
      id: s.id,
      workout_date: s.workout_date,
      planName: s.plans?.name || 'Latihan Bebas',
      totalVolumeKg: Math.round(totalVolumeKg),
      exercises: groupedExercises,
    }
  })
}

/**
 * Mengambil daftar gerakan latihan unik yang pernah di-log oleh user
 * untuk dijadikan opsi pilihan dropdown filter analitik.
 */
export async function getUserExercisesList(): Promise<SimpleExerciseItem[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  const { data: logs, error } = await supabase
    .from('workout_logs')
    .select(`
      exercise_id,
      exercises (
        name,
        body_part
      ),
      sessions!inner (
        user_id
      )
    `)
    .eq('sessions.user_id', user.id)

  if (error || !logs || logs.length === 0) {
    return []
  }

  const exMap = new Map<string, SimpleExerciseItem>()

  logs.forEach((log: any) => {
    const exId = log.exercise_id
    if (!exId) return
    const exName = log.exercises?.name || 'Gerakan Latihan'
    const bodyPart = log.exercises?.body_part || null

    if (!exMap.has(exId)) {
      exMap.set(exId, {
        id: exId,
        name: exName,
        body_part: bodyPart,
      })
    }
  })

  // Urutkan alfabetis nama gerakan
  return Array.from(exMap.values()).sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Mengambil data perkembangan kekuatan (Max Weight) dan volume harian
 * untuk gerakan tertentu dari waktu ke waktu (diurutkan kronologis).
 */
export async function getExerciseHistoryProgress(exerciseId: string): Promise<ProgressDataPoint[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  const { data: logs, error } = await supabase
    .from('workout_logs')
    .select(`
      reps,
      weight_kg,
      sessions!inner (
        workout_date,
        user_id
      )
    `)
    .eq('exercise_id', exerciseId)
    .eq('sessions.user_id', user.id)

  if (error || !logs || logs.length === 0) {
    return []
  }

  // Agregasi logs berdasarkan tanggal sesi
  const dateGroupsMap = new Map<string, { maxWeight: number; volume: number }>()

  logs.forEach((log: any) => {
    const dateStr = log.sessions.workout_date
    const weight = log.weight_kg ? parseFloat(log.weight_kg) : 0
    const reps = log.reps || 0
    const volume = weight * reps

    const existing = dateGroupsMap.get(dateStr)

    if (existing) {
      dateGroupsMap.set(dateStr, {
        maxWeight: Math.max(existing.maxWeight, weight),
        volume: existing.volume + volume,
      })
    } else {
      dateGroupsMap.set(dateStr, {
        maxWeight: weight,
        volume: volume,
      })
    }
  })

  // Format ke bentuk data points chart & urutkan naik (kronologis)
  return Array.from(dateGroupsMap.entries())
    .map(([dateStr, stats]) => {
      // Ubah format tanggal (contoh: 2026-06-30 -> 30 Jun)
      const dateObj = new Date(dateStr)
      const formattedDate = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })

      return {
        dateStr,
        formattedDate,
        maxWeightKg: stats.maxWeight,
        totalVolumeKg: Math.round(stats.volume),
      }
    })
    .sort((a, b) => a.dateStr.localeCompare(b.dateStr))
}
