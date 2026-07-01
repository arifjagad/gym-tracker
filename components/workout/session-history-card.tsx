'use client'

import { useState, useRef } from 'react'
import { Calendar, ChevronDown, Trophy, Dumbbell } from 'lucide-react'
import anime from 'animejs'
import { HistorySession } from '@/lib/actions/history'

interface SessionHistoryCardProps {
  session: HistorySession
}

export function SessionHistoryCard({ session }: SessionHistoryCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const toggleAccordion = () => {
    if (!contentRef.current) return
    const nextState = !isOpen
    setIsOpen(nextState)

    contentRef.current.style.height = 'auto'
    const fullHeight = contentRef.current.scrollHeight

    anime({
      targets: contentRef.current,
      height: nextState ? [0, fullHeight] : [fullHeight, 0],
      opacity: nextState ? [0, 1] : [1, 0],
      duration: 300,
      easing: 'easeInOutQuad',
      complete: () => {
        if (nextState && contentRef.current) {
          contentRef.current.style.height = 'auto'
        }
      }
    })
  }

  // Format tanggal lengkap
  const formattedDate = new Date(session.workout_date).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  return (
    <div
      className="rounded-xl border transition-all duration-200"
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: isOpen ? 'var(--chalk-muted)' : 'var(--border)',
      }}
    >
      {/* Header Kartu */}
      <div
        onClick={toggleAccordion}
        className="p-5 flex items-center justify-between cursor-pointer select-none"
      >
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 opacity-50" style={{ color: 'var(--chalk-muted)' }} />
            <span className="font-display text-sm font-bold opacity-60" style={{ color: 'var(--chalk-muted)' }}>
              {formattedDate}
            </span>
          </div>
          <h3 className="font-display text-2xl font-bold uppercase tracking-wider" style={{ color: 'var(--chalk)' }}>
            {session.planName}
          </h3>
          <p className="font-numeric text-[10px] tracking-wider font-bold" style={{ color: 'var(--progress)' }}>
            VOLUME TONASE: {session.totalVolumeKg.toLocaleString('id-ID')} KG
          </p>
        </div>

        <ChevronDown
          className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          style={{ color: 'var(--chalk-muted)' }}
        />
      </div>

      {/* Accordion Detail (Rack Pull) */}
      <div
        ref={contentRef}
        className="overflow-hidden opacity-0"
        style={{ height: 0 }}
      >
        <div className="px-5 pb-5 pt-0 border-t space-y-4" style={{ borderColor: 'var(--border)' }}>
          {session.exercises.length === 0 ? (
            <p className="text-xs font-body text-center py-4" style={{ color: 'var(--chalk-muted)' }}>
              Tidak ada gerakan latihan dicatat pada sesi ini.
            </p>
          ) : (
            <div className="space-y-4 pt-3">
              {session.exercises.map((group) => (
                <div key={group.exerciseId} className="space-y-2">
                  {/* Judul Latihan */}
                  <div className="flex items-center gap-1.5">
                    <Dumbbell className="w-3.5 h-3.5" style={{ color: 'var(--chalk-muted)' }} />
                    <h4 className="font-display text-base font-bold uppercase tracking-wide" style={{ color: 'var(--chalk)' }}>
                      {group.exerciseName}
                    </h4>
                    {group.bodyPart && (
                      <span
                        className="px-1.5 py-0.5 rounded text-[8px] uppercase font-bold tracking-wider font-body ml-2"
                        style={{ backgroundColor: 'var(--surface-raised)', color: 'var(--chalk-muted)' }}
                      >
                        {group.bodyPart}
                      </span>
                    )}
                  </div>

                  {/* Grid Sets */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {group.sets.map((set) => (
                      <div
                        key={set.set_number}
                        className="p-2.5 rounded-lg border flex items-center justify-between text-xs font-body"
                        style={{
                          backgroundColor: 'var(--surface-raised)',
                          borderColor: 'var(--border)'
                        }}
                      >
                        <span className="opacity-45 font-bold">Set {set.set_number}</span>
                        <span className="font-numeric font-semibold" style={{ color: 'var(--chalk)' }}>
                          {set.weight_kg ?? '—'}kg × {set.reps ?? '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
