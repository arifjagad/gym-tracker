'use client'

import { useState, useCallback, useRef } from 'react'
import Model, { IExerciseData, IMuscleStats, MuscleType } from 'react-body-highlighter'
import { MusclePR } from '@/lib/actions/history'

type HeatData = Record<string, number>

// ─── Mapping: database body_part → MuscleType values ────────────────────────
type Muscle = (typeof MuscleType)[keyof typeof MuscleType]

const BODY_PART_TO_MUSCLES: Record<string, Muscle[]> = {
  chest:          [MuscleType.CHEST],
  back:           [MuscleType.UPPER_BACK, MuscleType.LOWER_BACK, MuscleType.TRAPEZIUS],
  shoulders:      [MuscleType.FRONT_DELTOIDS, MuscleType.BACK_DELTOIDS],
  'upper arms':   [MuscleType.BICEPS, MuscleType.TRICEPS],
  'lower arms':   [MuscleType.FOREARM],
  'upper legs':   [MuscleType.QUADRICEPS, MuscleType.HAMSTRING, MuscleType.ABDUCTOR, MuscleType.ABDUCTORS, MuscleType.GLUTEAL],
  'lower legs':   [MuscleType.CALVES],
  waist:          [MuscleType.ABS, MuscleType.OBLIQUES],
  neck:           [MuscleType.TRAPEZIUS, MuscleType.NECK],
}

// ─── Display label untuk tiap body_part ──────────────────────────────────────
const BODY_PART_LABEL: Record<string, string> = {
  chest:          'Dada (Chest)',
  back:           'Punggung (Back)',
  shoulders:      'Bahu (Shoulders)',
  'upper arms':   'Lengan Atas (Bicep/Tricep)',
  'lower arms':   'Lengan Bawah (Forearm)',
  'upper legs':   'Paha (Quads/Hamstring)',
  'lower legs':   'Betis (Calves)',
  waist:          'Perut / Core (Abs)',
  neck:           'Leher / Trapezius',
  cardio:         'Kardiovaskular',
}

// ─── Warna berdasarkan jumlah sesi ───────────────────────────────────────────
function getColor(sessions: number): string {
  if (sessions === 1) return '#60a5fa' // blue-400
  if (sessions === 2) return '#facc15' // yellow-400
  if (sessions === 3) return '#f97316' // orange-500
  return '#e8432c'                     // intensity red (4+)
}

// ─── Convert HeatData → IExerciseData[] for the library ──────────────────────
function buildModelData(data: HeatData): IExerciseData[] {
  const exercises: IExerciseData[] = []

  for (const [bodyPart, sessionCount] of Object.entries(data)) {
    if (sessionCount === 0) continue
    const muscles = BODY_PART_TO_MUSCLES[bodyPart.toLowerCase()]
    if (!muscles) continue

    // Masukkan satu entry per sesi agar library bisa hitung frekuensi
    for (let i = 0; i < sessionCount; i++) {
      exercises.push({
        name: BODY_PART_LABEL[bodyPart] ?? bodyPart,
        muscles,
      })
    }
  }

  return exercises
}

// ─── Reverse map: muscle name → body_part key ─────────────────────────────────
function muscleToBodyPart(muscle: string): string | null {
  for (const [bodyPart, muscles] of Object.entries(BODY_PART_TO_MUSCLES)) {
    if ((muscles as string[]).includes(muscle)) return bodyPart
  }
  return null
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function MuscleHeatmap({ data, prs }: { data: HeatData; prs: Record<string, MusclePR[]> }) {
  const [active, setActive] = useState<{ label: string; sessions: number; bodyPart: string } | null>(null)
  const lastClickRef = useRef<{ label: string; time: number } | null>(null)

  const modelData = buildModelData(data)

  const handleClick = useCallback(({ muscle, data: muscleData }: IMuscleStats) => {
    const bodyPart = muscleToBodyPart(muscle)
    if (!bodyPart) return
    const sessions = data[bodyPart] ?? 0
    const label = BODY_PART_LABEL[bodyPart] ?? bodyPart
    setActive({ label, sessions, bodyPart })
  }, [data])

  const activePRs = active ? prs[active.bodyPart] : []

  const totalGroups = Object.values(data).filter(n => n > 0).length
  const modelDataForDisplay = modelData.length > 0 ? modelData : []

  // Build highlightedColors: map frequency (1,2,3,4+) to colors
  const highlightedColors = ['#60a5fa', '#facc15', '#f97316', '#e8432c']

  return (
    <div
      className="p-5 rounded-2xl border space-y-4"
      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3
            className="font-display text-sm font-bold uppercase tracking-wider"
            style={{ color: 'var(--chalk)' }}
          >
            🔥 Muscle Heatmap
          </h3>
          <p className="text-[9px] font-body mt-0.5" style={{ color: 'var(--chalk-muted)' }}>
            Area otot yang dilatih minggu ini
          </p>
        </div>
        <div
          className="px-2.5 py-1 rounded-full text-[9px] font-bold font-display"
          style={{
            backgroundColor: totalGroups > 0 ? 'rgba(232,67,44,0.1)' : 'rgba(255,255,255,0.05)',
            color: totalGroups > 0 ? 'var(--intensity)' : 'var(--chalk-muted)',
            border: `1px solid ${totalGroups > 0 ? 'rgba(232,67,44,0.2)' : 'var(--border)'}`,
          }}
        >
          {totalGroups} grup otot
        </div>
      </div>

      {/* Model SVG */}
      {modelDataForDisplay.length === 0 ? (
        // Empty state
        <div
          className="py-10 flex flex-col items-center justify-center rounded-xl gap-3"
          style={{ backgroundColor: 'var(--surface-raised)' }}
        >
          <span className="text-3xl">🧍</span>
          <p className="text-xs font-body text-center" style={{ color: 'var(--chalk-muted)' }}>
            Belum ada latihan minggu ini
          </p>
          <p className="text-[9px] font-body text-center" style={{ color: 'rgba(255,255,255,0.2)' }}>
            Selesaikan sesi latihan untuk melihat heatmap otot
          </p>
        </div>
      ) : (
        <div className="flex justify-center gap-0">
          {/* Front view */}
          <div className="flex flex-col items-center gap-1 flex-1">
            <span className="text-[8px] font-bold uppercase tracking-widest" style={{ color: 'var(--chalk-muted)' }}>
              Depan
            </span>
            <Model
              data={modelDataForDisplay}
              style={{ width: '100%', maxWidth: '160px' }}
              highlightedColors={highlightedColors}
              onClick={handleClick}
            />
          </div>

          {/* Vertical divider */}
          <div className="self-stretch w-px mx-1" style={{ backgroundColor: 'var(--border)' }} />

          {/* Back view */}
          <div className="flex flex-col items-center gap-1 flex-1">
            <span className="text-[8px] font-bold uppercase tracking-widest" style={{ color: 'var(--chalk-muted)' }}>
              Belakang
            </span>
            <Model
              data={modelDataForDisplay}
              type="posterior"
              style={{ width: '100%', maxWidth: '160px' }}
              highlightedColors={highlightedColors}
              onClick={handleClick}
            />
          </div>
        </div>
      )}

      {/* Active Tooltip / Muscle Details */}
      <div
        className="rounded-xl px-4 py-3 transition-all duration-150 space-y-2.5"
        style={{ backgroundColor: 'var(--surface-raised)' }}
      >
        {active ? (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: getColor(active.sessions) }}
                />
                <span className="text-xs font-bold font-display" style={{ color: 'var(--chalk)' }}>
                  {active.label}
                </span>
                <span className="text-[10px] font-medium" style={{ color: getColor(active.sessions) }}>
                  • {active.sessions}× minggu ini
                </span>
              </div>
              <button
                onClick={() => setActive(null)}
                className="text-[10px] font-bold font-display ml-2 hover:opacity-85 cursor-pointer opacity-40 hover:opacity-100 transition-opacity"
                style={{ color: 'var(--chalk-muted)' }}
                title="Tutup detail"
              >
                ✕
              </button>
            </div>

            {/* List 3 Gerakan Terfavorit & PR */}
            {activePRs && activePRs.length > 0 ? (
              <div className="space-y-1.5 pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <p className="text-[8px] font-bold uppercase tracking-wider text-left" style={{ color: 'var(--chalk-muted)' }}>
                  🏆 Gerakan Terfavorit & PR:
                </p>
                <div className="space-y-1">
                  {activePRs.map((pr, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[10px]">
                      <span className="truncate max-w-[200px]" style={{ color: 'var(--chalk-muted)' }}>
                        {idx + 1}. {pr.name}
                      </span>
                      <span className="font-numeric font-bold" style={{ color: 'var(--progress)' }}>
                        {pr.maxWeightKg}kg <span className="text-[8px] font-normal text-[var(--chalk-muted)]">× {pr.repsAtMax} reps</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-[9px] text-center pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.2)' }}>
                Belum ada riwayat gerakan untuk grup otot ini
              </div>
            )}
          </>
        ) : (
          <p className="w-full text-center text-[10px] font-body py-1.5" style={{ color: 'rgba(255,255,255,0.2)' }}>
            Sentuh area otot untuk melihat detail
          </p>
        )}
      </div>

      {/* Color Legend */}
      <div className="flex items-center justify-center gap-3 flex-wrap">
        {[
          { label: 'Belum', fill: 'rgba(255,255,255,0.14)' },
          { label: '1×', fill: '#60a5fa' },
          { label: '2×', fill: '#facc15' },
          { label: '3×', fill: '#f97316' },
          { label: '4×+', fill: '#e8432c' },
        ].map(({ label, fill }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm border border-white/10" style={{ backgroundColor: fill }} />
            <span className="text-[9px] font-body" style={{ color: 'var(--chalk-muted)' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
