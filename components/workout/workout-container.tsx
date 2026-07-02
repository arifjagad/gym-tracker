'use client'

import { useState, useEffect } from 'react'
import { StartWorkoutSelector } from './start-workout-selector'
import { WorkoutLogger } from './workout-logger'
import { syncOfflineQueueToSupabase, getSyncQueue } from '@/lib/offline-sync'

interface WorkoutContainerProps {
  todaySessions: any[]
  plans: any[]
}

export function WorkoutContainer({ todaySessions, plans }: WorkoutContainerProps) {
  const [activeSession, setActiveSession] = useState<any>(null)
  const [mounted, setMounted] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState('')

  // 1. Sinkronisasi Koneksi & Pemicu Auto-Sync
  useEffect(() => {
    if (typeof window === 'undefined') return

    setIsOffline(!navigator.onLine)

    const handleOnline = async () => {
      setIsOffline(false)
      const queue = getSyncQueue()
      if (queue.length === 0) return

      setSyncing(true)
      try {
        const result = await syncOfflineQueueToSupabase((status) => {
          setSyncStatus(status)
        })
        if (result.success && result.count > 0) {
          // Reload page untuk memuat ulang data terbaru dari Supabase
          window.location.reload()
        }
      } catch (err) {
        console.error('Auto sync failed:', err)
      } finally {
        setSyncing(false)
        setSyncStatus('')
      }
    }

    const handleOffline = () => {
      setIsOffline(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Trigger sync saat pertama load jika posisi online dan ada antrean
    if (navigator.onLine) {
      handleOnline()
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // 2. Deteksi Sesi Aktif (Online / Offline Cache)
  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined') {
      const activeSessionId = localStorage.getItem('active_session_id')
      if (activeSessionId) {
        if (activeSessionId.startsWith('temp_session_')) {
          // Sesi Offline: Load mock data sesi dari cache
          const cachedPlanId = localStorage.getItem(`temp_plan_id_${activeSessionId}`)
          setActiveSession({
            id: activeSessionId,
            plan_id: cachedPlanId || null,
            workout_date: new Date().toISOString().split('T')[0],
            created_at: new Date().toISOString()
          })
        } else {
          // Sesi Online: Cari kecocokan di data DB hari ini
          const match = todaySessions.find((s) => s.id === activeSessionId)
          if (match) {
            setActiveSession(match)
          } else {
            localStorage.removeItem('active_session_id')
          }
        }
      }
    }
  }, [todaySessions])

  if (!mounted) {
    return (
      <div className="p-6 text-center text-sm font-body animate-pulse" style={{ color: 'var(--chalk-muted)' }}>
        Memuat sesi latihan...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Banner Status Koneksi Offline */}
      {isOffline && (
        <div
          className="p-4 rounded-xl border flex items-start gap-3 text-xs font-body animate-pulse"
          style={{
            backgroundColor: 'rgba(232, 67, 44, 0.08)',
            borderColor: 'rgba(232, 67, 44, 0.3)',
            color: 'var(--intensity)',
          }}
        >
          <span className="text-sm mt-0.5">⚠️</span>
          <div>
            <strong className="font-display font-bold uppercase tracking-wider block mb-0.5">MODE OFFLINE</strong>
            Koneksi internet terputus. Seluruh latihan Anda dicatat secara lokal di HP dan akan disinkronkan otomatis begitu sinyal kembali.
          </div>
        </div>
      )}

      {/* Banner Sinkronisasi Data */}
      {syncing && (
        <div
          className="p-4 rounded-xl border flex items-center gap-3 text-xs font-body"
          style={{
            backgroundColor: 'rgba(76, 175, 80, 0.08)',
            borderColor: 'rgba(76, 175, 80, 0.3)',
            color: 'var(--progress)',
          }}
        >
          <div
            className="w-4 h-4 rounded-full border-2 animate-spin flex-shrink-0"
            style={{ borderColor: 'rgba(76,175,80,0.2)', borderTopColor: 'var(--progress)' }}
          />
          <div>
            <strong className="font-display font-bold uppercase tracking-wider block mb-0.5">MENYINKRONKAN DATA</strong>
            {syncStatus || 'Menyinkronkan data sesi latihan offline Anda ke cloud...'}
          </div>
        </div>
      )}

      {activeSession ? (
        <WorkoutLogger
          session={activeSession}
          planDetails={plans.find((p) => p.id === activeSession.plan_id) || null}
        />
      ) : (
        <StartWorkoutSelector plans={plans} />
      )}
    </div>
  )
}
