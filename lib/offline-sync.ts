import { startWorkoutSession, saveWorkoutLogAction } from '@/lib/actions/workout'

export interface SyncItem {
  id: string
  type: 'START_SESSION' | 'SAVE_LOGS' | 'FINISH_SESSION' | 'DELETE_SESSION'
  tempSessionId: string
  payload: any
  timestamp: number
}

// 1. Deteksi Koneksi Browser
export function isBrowserOffline(): boolean {
  if (typeof window === 'undefined') return false
  return !navigator.onLine
}

// 2. Ambil Antrean Lokal dari localStorage
export function getSyncQueue(): SyncItem[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem('workout_sync_queue')
  return data ? JSON.parse(data) : []
}

// 3. Simpan Antrean Lokal ke localStorage
export function saveSyncQueue(queue: SyncItem[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('workout_sync_queue', JSON.stringify(queue))
}

// 4. Tambahkan/Kelola Antrean Operasi Offline
export function addToSyncQueue(
  type: SyncItem['type'],
  tempSessionId: string,
  payload: any
): void {
  if (typeof window === 'undefined') return
  const queue = getSyncQueue()

  // --- OPTIMASI KELAS 1: DELETE SESSION ---
  // Jika sesi latihan dihapus/restart secara offline, seluruh antrean aktivitas sesi tersebut bisa langsung dihapus dari HP
  if (type === 'DELETE_SESSION') {
    const filtered = queue.filter((item) => item.tempSessionId !== tempSessionId)
    saveSyncQueue(filtered)
    return
  }

  // --- OPTIMASI KELAS 2: COALESCING SAVE LOGS ---
  // Jika user mengubah set log pada gerakan yang sama berulang kali secara offline, cukup simpan logs teranyar saja
  if (type === 'SAVE_LOGS') {
    const existingIndex = queue.findIndex(
      (item) =>
        item.type === 'SAVE_LOGS' &&
        item.tempSessionId === tempSessionId &&
        item.payload.exerciseId === payload.exerciseId
    )
    if (existingIndex !== -1) {
      queue[existingIndex].payload.logs = payload.logs
      queue[existingIndex].timestamp = Date.now()
      saveSyncQueue(queue)
      return
    }
  }

  // Tambahkan item baru ke antrean
  const newItem: SyncItem = {
    id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    tempSessionId,
    payload,
    timestamp: Date.now()
  }

  queue.push(newItem)
  saveSyncQueue(queue)
}

// 5. Eksekusi Sinkronisasi Antrean ke Database Supabase (FIFO)
export async function syncOfflineQueueToSupabase(
  onProgress?: (status: string) => void
): Promise<{ success: boolean; count: number; error?: string }> {
  const queue = getSyncQueue()
  if (queue.length === 0) return { success: true, count: 0 }

  onProgress?.('Menyinkronkan data offline Anda...')
  const idMapping: { [tempId: string]: string } = {}
  let processedCount = 0

  try {
    for (const item of queue) {
      const { type, tempSessionId, payload } = item

      if (type === 'START_SESSION') {
        onProgress?.('Menyinkronkan sesi latihan ke server...')
        const realSession = await startWorkoutSession(payload.planId, true)
        idMapping[tempSessionId] = realSession.id

        // Update active_session_id di localStorage jika masih aktif
        if (localStorage.getItem('active_session_id') === tempSessionId) {
          localStorage.setItem('active_session_id', realSession.id)
        }

        // Pindahkan metadata completed_session & completed_duration ke ID asli
        const completed = localStorage.getItem(`completed_session_${tempSessionId}`)
        if (completed) {
          localStorage.setItem(`completed_session_${realSession.id}`, completed)
          localStorage.removeItem(`completed_session_${tempSessionId}`)
        }
        const duration = localStorage.getItem(`completed_duration_${tempSessionId}`)
        if (duration) {
          localStorage.setItem(`completed_duration_${realSession.id}`, duration)
          localStorage.removeItem(`completed_duration_${tempSessionId}`)
        }
      }

      else if (type === 'SAVE_LOGS') {
        const resolvedSessionId = idMapping[tempSessionId] || tempSessionId

        // Jika ID sesi masih temp_session, lewati (START_SESSION kemungkinan gagal)
        if (resolvedSessionId.startsWith('temp_session_')) {
          console.warn(`Skipping SAVE_LOGS for ${payload.exerciseId} - session not synced yet.`)
          continue
        }

        onProgress?.('Mengunggah log set latihan...')
        await saveWorkoutLogAction(resolvedSessionId, payload.exerciseId, payload.logs)

        // Pindahkan data cache lokal log set ke ID asli
        const cachedLogs = localStorage.getItem(`cached_logs_${tempSessionId}_${payload.exerciseId}`)
        if (cachedLogs) {
          localStorage.setItem(`cached_logs_${resolvedSessionId}_${payload.exerciseId}`, cachedLogs)
          localStorage.removeItem(`cached_logs_${tempSessionId}_${payload.exerciseId}`)
        }
      }

      else if (type === 'FINISH_SESSION') {
        const resolvedSessionId = idMapping[tempSessionId] || tempSessionId
        if (!resolvedSessionId.startsWith('temp_session_')) {
          const completed = localStorage.getItem(`completed_session_${tempSessionId}`)
          if (completed) {
            localStorage.setItem(`completed_session_${resolvedSessionId}`, completed)
            localStorage.removeItem(`completed_session_${tempSessionId}`)
          }
          const duration = localStorage.getItem(`completed_duration_${tempSessionId}`)
          if (duration) {
            localStorage.setItem(`completed_duration_${resolvedSessionId}`, duration)
            localStorage.removeItem(`completed_duration_${tempSessionId}`)
          }
        }
      }

      processedCount++
    }

    // Bersihkan antrean karena seluruh proses berhasil disinkronkan
    localStorage.removeItem('workout_sync_queue')
    return { success: true, count: processedCount }
  } catch (err) {
    console.error('Offline sync failed at item index:', processedCount, err)
    // Simpan antrean yang tersisa (belum terproses) kembali ke localStorage
    const remaining = queue.slice(processedCount)
    saveSyncQueue(remaining)
    return {
      success: false,
      count: processedCount,
      error: err instanceof Error ? err.message : String(err)
    }
  }
}
