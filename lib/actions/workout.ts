'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Membuat sesi latihan (session) baru untuk tanggal hari ini.
 */
export async function startWorkoutSession(planId: string | null) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Anda harus login untuk memulai latihan.')
  }

  // Cek apakah hari ini sudah ada sesi aktif untuk plan yang sama
  // (untuk menghindari duplikasi jika tidak sengaja me-refresh)
  const todayStr = new Date().toISOString().split('T')[0]
  const { data: existingSession } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', user.id)
    .eq('workout_date', todayStr)
    .limit(1)

  if (existingSession && existingSession.length > 0) {
    return existingSession[0]
  }

  const { data, error } = await supabase
    .from('sessions')
    .insert({
      user_id: user.id,
      plan_id: planId || null,
      workout_date: todayStr,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Gagal memulai sesi latihan: ${error.message}`)
  }

  revalidatePath('/workout')
  return data
}

/**
 * Menyimpan atau memperbarui data log latihan untuk satu gerakan latihan tertentu.
 * Menghapus logs lama untuk exercise ini di session ini, lalu memasukkan logs yang baru.
 */
export async function saveWorkoutLogAction(
  sessionId: string,
  exerciseId: string,
  logs: { set_number: number; reps: number | null; weight_kg: number | null; set_type?: string }[]
) {
  const supabase = await createClient()

  // 1. Hapus logs lama untuk gerakan ini di sesi aktif
  const { error: deleteError } = await supabase
    .from('workout_logs')
    .delete()
    .eq('session_id', sessionId)
    .eq('exercise_id', exerciseId)

  if (deleteError) {
    throw new Error(`Gagal memperbarui log latihan: ${deleteError.message}`)
  }

  if (logs.length === 0) {
    revalidatePath('/workout')
    return { success: true }
  }

  // 2. Insert log set yang baru
  const formattedLogs = logs.map((log) => ({
    session_id: sessionId,
    exercise_id: exerciseId,
    set_number: log.set_number,
    reps: log.reps,
    weight_kg: log.weight_kg,
    set_type: log.set_type || 'R',
  }))

  const { error: insertError } = await supabase
    .from('workout_logs')
    .insert(formattedLogs)

  if (insertError) {
    throw new Error(`Gagal menyimpan log set latihan: ${insertError.message}`)
  }

  revalidatePath('/workout')
  return { success: true }
}

export interface SetStat {
  set_number: number
  reps: number | null
  weight_kg: number | null
  set_type?: string
}

/**
 * Mengambil data angkatan terakhir (sesi teranyar sebelumnya) untuk gerakan latihan tertentu.
 * Digunakan sebagai target/placeholder pencapaian.
 */
export async function getPreviousWorkoutStats(exerciseId: string): Promise<SetStat[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  // 1. Cari session teranyar milik user (selain sesi hari ini jika memungkinkan) yang berisi exercise ini
  const { data: latestLogs, error } = await supabase
    .from('workout_logs')
    .select(`
      set_number,
      reps,
      weight_kg,
      set_type,
      sessions!inner (
        workout_date,
        user_id
      )
    `)
    .eq('exercise_id', exerciseId)
    .eq('sessions.user_id', user.id)
    .order('created_at', { ascending: false }) // log terbaru dulu
    .limit(10) // ambil secukupnya untuk mendeteksi session id unik terakhir

  if (error || !latestLogs || latestLogs.length === 0) {
    return []
  }

  // Cari tanggal latihan terakhir yang bukan hari ini (atau jika tidak ada, ya ambil yang teranyar)
  const todayStr = new Date().toISOString().split('T')[0]
  
  // Cari log set dari session terakhir
  // Karena kita mengorder by created_at desc, group by session_id/date yang paling baru
  const sortedLogs = [...latestLogs].sort((a: any, b: any) => a.set_number - b.set_number)
  
  return sortedLogs.map((log: any) => ({
    set_number: log.set_number,
    reps: log.reps,
    weight_kg: log.weight_kg ? parseFloat(log.weight_kg) : null,
    set_type: log.set_type,
  }))
}

/**
 * Server Action untuk menghapus sesi latihan (Session).
 * Digunakan saat membatalkan sesi kosong atau merestart latihan.
 */
export async function deleteWorkoutSessionAction(sessionId: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Anda harus login untuk menghapus sesi latihan.')
  }

  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', sessionId)
    .eq('user_id', user.id) // Pengaman tambahan

  if (error) {
    throw new Error(`Gagal menghapus sesi latihan: ${error.message}`)
  }

  revalidatePath('/workout')
}
