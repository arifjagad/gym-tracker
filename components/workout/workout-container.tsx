'use client'

import { useState, useEffect } from 'react'
import { StartWorkoutSelector } from './start-workout-selector'
import { WorkoutLogger } from './workout-logger'

interface WorkoutContainerProps {
  todaySessions: any[]
  plans: any[]
}

export function WorkoutContainer({ todaySessions, plans }: WorkoutContainerProps) {
  const [activeSession, setActiveSession] = useState<any>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined') {
      const activeSessionId = localStorage.getItem('active_session_id')
      if (activeSessionId) {
        const match = todaySessions.find((s) => s.id === activeSessionId)
        if (match) {
          setActiveSession(match)
        } else {
          // Jika id sesi aktif hari ini tidak ada di DB, hapus dari tracker
          localStorage.removeItem('active_session_id')
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

  if (activeSession) {
    const planDetails = plans.find((p) => p.id === activeSession.plan_id) || null
    return (
      <WorkoutLogger 
        session={activeSession} 
        planDetails={planDetails} 
      />
    )
  }

  return <StartWorkoutSelector plans={plans} />
}
