'use client'

import { useState } from 'react'
import { Calendar, TrendingUp, Dumbbell } from 'lucide-react'
import { SessionHistoryCard } from './session-history-card'
import { ExerciseProgressChart } from './exercise-progress-chart'
import { HistorySession, SimpleExerciseItem } from '@/lib/actions/history'
import { SearchableSelect } from '@/components/ui/searchable-select'

interface HistoryManagerProps {
  sessions: HistorySession[]
  exercisesList: SimpleExerciseItem[]
}

export function HistoryManager({ sessions, exercisesList }: HistoryManagerProps) {
  const [activeTab, setActiveTab] = useState<'sessions' | 'exercises'>('sessions')
  
  // State Pilihan Gerakan untuk Tab Analitik
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>(
    exercisesList[0]?.id || ''
  )

  const exerciseOptions = exercisesList.map((ex) => ({
    value: ex.id,
    label: ex.name,
    sublabel: ex.body_part ? `Kategori: ${ex.body_part}` : undefined
  }))

  return (
    <div className="space-y-6">
      {/* Tab Navigation Menu */}
      <div className="flex gap-2 p-1.5 rounded-lg border bg-[--surface]" style={{ borderColor: 'var(--border)' }}>
        {/* Tab 1: Riwayat Sesi */}
        <button
          onClick={() => setActiveTab('sessions')}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md text-xs font-bold font-display uppercase tracking-wider cursor-pointer transition-colors"
          style={{
            backgroundColor: activeTab === 'sessions' ? 'var(--surface-raised)' : 'transparent',
            color: activeTab === 'sessions' ? 'var(--chalk)' : 'var(--chalk-muted)',
            border: activeTab === 'sessions' ? '1px solid var(--border)' : '1px solid transparent',
          }}
        >
          <Calendar className="w-4 h-4" />
          Riwayat Sesi
        </button>

        {/* Tab 2: Progres Gerakan */}
        <button
          onClick={() => setActiveTab('exercises')}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md text-xs font-bold font-display uppercase tracking-wider cursor-pointer transition-colors"
          style={{
            backgroundColor: activeTab === 'exercises' ? 'var(--surface-raised)' : 'transparent',
            color: activeTab === 'exercises' ? 'var(--chalk)' : 'var(--chalk-muted)',
            border: activeTab === 'exercises' ? '1px solid var(--border)' : '1px solid transparent',
          }}
        >
          <TrendingUp className="w-4 h-4" />
          Progres Gerakan
        </button>
      </div>

      {/* TAB CONTENT: RIWAYAT SESI */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          {sessions.length === 0 ? (
            /* Empty State */
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
                  Belum Ada Riwayat Latihan
                </h3>
                <p className="font-body text-xs max-w-sm mx-auto" style={{ color: 'var(--chalk-muted)' }}>
                  Anda belum pernah mencatatkan sesi latihan angkat beban. Mulailah berlatih untuk mengumpulkan riwayat latihan.
                </p>
              </div>
            </div>
          ) : (
            /* List of Session History Cards */
            <div className="space-y-4">
              {sessions.map((session) => (
                <SessionHistoryCard key={session.id} session={session} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: PROGRES GERAKAN */}
      {activeTab === 'exercises' && (
        <div className="space-y-6">
          {exercisesList.length === 0 ? (
            /* Empty State */
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
                <TrendingUp className="w-8 h-8" style={{ color: 'var(--chalk-muted)' }} />
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-xl font-bold uppercase tracking-wider" style={{ color: 'var(--chalk)' }}>
                  Belum Ada Data Grafik
                </h3>
                <p className="font-body text-xs max-w-sm mx-auto" style={{ color: 'var(--chalk-muted)' }}>
                  Grafik perkembangan membutuhkan pencatatan log latihan set beban di menu catat workout terlebih dahulu.
                </p>
              </div>
            </div>
          ) : (
            /* Dropdown Selector & Chart rendering */
            <div className="space-y-6">
              {/* Dropdown Select Exercise */}
              <div
                className="p-5 rounded-xl border space-y-3"
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
              >
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--chalk-muted)' }}>
                    Pilih Gerakan Latihan
                  </label>
                  <p className="text-[10px] font-body" style={{ color: 'var(--chalk-muted)' }}>
                    Pilih salah satu gerakan gym Anda untuk menganalisis kenaikan beban maksimal.
                  </p>
                </div>
                
                <SearchableSelect
                  options={exerciseOptions}
                  value={selectedExerciseId}
                  onChange={setSelectedExerciseId}
                  placeholder="Pilih Gerakan Latihan"
                  searchPlaceholder="Cari gerakan gym..."
                />
              </div>

              {/* Progress Line Chart */}
              {selectedExerciseId && (
                <div className="animate-in fade-in duration-200">
                  <ExerciseProgressChart exerciseId={selectedExerciseId} />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
