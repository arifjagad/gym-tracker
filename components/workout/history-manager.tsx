'use client'

import { useState } from 'react'
import { Calendar, TrendingUp, Dumbbell, Play } from 'lucide-react'
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

  const selectedExercise = exercisesList.find((ex) => ex.id === selectedExerciseId)

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

              {/* Visual Guide & Progress Chart Container */}
              {selectedExerciseId && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Top: Visual Guide */}
                  {selectedExercise?.gif_url && (
                    <div 
                      className="p-5 rounded-xl border flex flex-col items-center gap-3 w-full"
                      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                    >
                      <div className="w-full text-left flex items-center gap-2">
                        <Play className="w-5 h-5" style={{ color: 'var(--intensity)' }} />
                        <h3 className="font-display text-lg font-bold uppercase tracking-wider animate-in fade-in duration-100" style={{ color: 'var(--chalk)' }}>
                          Visual Gerakan
                        </h3>
                      </div>
                      <GifPreview gifUrl={selectedExercise.gif_url} name={selectedExercise.name} />
                    </div>
                  )}

                  {/* Bottom: Progress Chart */}
                  <div className="w-full">
                    <ExerciseProgressChart exerciseId={selectedExerciseId} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function getCleanGifUrl(workoutxGifUrl: string | null): string {
  if (!workoutxGifUrl) return ''
  const parts = workoutxGifUrl.split('/')
  const lastPart = parts[parts.length - 1]
  const id = lastPart.replace('.gif', '').padStart(4, '0')
  return `https://cdn.jsdelivr.net/gh/omercotkd/exercises-gifs@main/assets/${id}.gif`
}

function GifPreview({ gifUrl, name }: { gifUrl: string; name: string }) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const cleanUrl = getCleanGifUrl(gifUrl)

  return (
    <div
      className="w-full rounded-xl overflow-hidden relative border bg-white mx-auto max-w-[280px]"
      style={{ aspectRatio: '1 / 1', borderColor: 'var(--border)' }}
    >
      {/* Skeleton shimmer */}
      {!loaded && !error && (
        <div className="absolute inset-0">
          <div
            className="w-full h-full"
            style={{
              background: 'linear-gradient(90deg, #f5f5f5 25%, #e9e9e9 50%, #f5f5f5 75%)',
              backgroundSize: '200% 100%',
              animation: 'skeleton-shimmer 1.4s infinite linear',
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-8 h-8 rounded-full border-2 animate-spin"
              style={{ borderColor: 'rgba(232,67,44,0.3)', borderTopColor: 'var(--intensity)' }}
            />
          </div>
        </div>
      )}

      {/* GIF */}
      {!error && (
        <img
          src={cleanUrl}
          alt={name}
          loading="eager"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className="w-full h-full object-cover transition-opacity duration-500 bg-white"
          style={{
            opacity: loaded ? 1 : 0,
          }}
        />
      )}

      {/* Fallback */}
      {error && (
        <div
          className="w-full h-full flex flex-col items-center justify-center text-center p-4"
          style={{ backgroundColor: 'var(--surface-raised)' }}
        >
          <span className="text-xl">📺</span>
          <p className="text-[10px] font-body mt-1" style={{ color: 'var(--chalk-muted)' }}>
            Gagal memuat visual
          </p>
        </div>
      )}
    </div>
  )
}
