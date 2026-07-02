'use client'

import { useState, useEffect, useRef } from 'react'
import { Check, Plus, Trash2, Dumbbell, ChevronDown, Award, Eye, EyeOff, TrendingUp, Info } from 'lucide-react'
import anime from 'animejs'
import { getPreviousWorkoutStats, saveWorkoutLogAction, SetStat } from '@/lib/actions/workout'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'
import { isBrowserOffline, addToSyncQueue } from '@/lib/offline-sync'

interface ExerciseDetail {
  id: string
  name: string
  body_part: string | null
  target: string | null
  equipment: string | null
  gif_url: string | null
}

interface ExerciseLoggerCardProps {
  exercise: ExerciseDetail
  sessionId: string
}

function getCleanGifUrl(workoutxGifUrl: string | null): string {
  if (!workoutxGifUrl) return ''
  const parts = workoutxGifUrl.split('/')
  const lastPart = parts[parts.length - 1]
  const id = lastPart.replace('.gif', '').padStart(4, '0')
  return `https://cdn.jsdelivr.net/gh/omercotkd/exercises-gifs@main/assets/${id}.gif`
}

function calculate1RM(weightStr: string, repsStr: string, fallbackWeight: number | null, fallbackReps: number | null): number | null {
  const weight = weightStr !== '' ? parseFloat(weightStr) : fallbackWeight
  const reps = repsStr !== '' ? parseInt(repsStr) : fallbackReps

  if (!weight || !reps || weight <= 0 || reps <= 0) return null
  
  if (reps === 1) return weight
  // Epley formula: 1RM = w * (1 + r / 30)
  return Math.round(weight * (1 + reps / 30) * 10) / 10
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
          className="absolute inset-0 flex flex-col items-center justify-center gap-2"
          style={{ backgroundColor: 'var(--surface-raised)' }}
        >
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(232,67,44,0.1)' }}>
            <span className="text-xl">🏋️</span>
          </div>
          <span className="text-[10px] font-body" style={{ color: 'var(--chalk-muted)' }}>Preview tidak tersedia</span>
        </div>
      )}
    </div>
  )
}

interface LocalSet {
  set_number: number
  weight_kg: string
  reps: string
  completed: boolean
  set_type: 'W' | 'D' | 'F' | 'R'
}

export function ExerciseLoggerCard({ exercise, sessionId }: ExerciseLoggerCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showGif, setShowGif] = useState(false)
  const [sets, setSets] = useState<LocalSet[]>([
    { set_number: 1, weight_kg: '', reps: '', completed: false, set_type: 'R' }
  ])
  const [prevStats, setPrevStats] = useState<SetStat[]>([])
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const contentRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  const toggleGif = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowGif(!showGif)
  }

  // Fetch previous logs for placeholder AND load current session logs if any
  useEffect(() => {
    async function loadStatsAndCurrentLogs() {
      try {
        let currentLogs: any[] = []
        const offline = isBrowserOffline() || sessionId.startsWith('temp_session_')

        if (offline) {
          const cached = localStorage.getItem(`cached_logs_${sessionId}_${exercise.id}`)
          if (cached) {
            currentLogs = JSON.parse(cached)
          }
        } else {
          const supabase = createClient()
          const { data } = await supabase
            .from('workout_logs')
            .select('set_number, weight_kg, reps, set_type')
            .eq('session_id', sessionId)
            .eq('exercise_id', exercise.id)
            .order('set_number', { ascending: true })
          if (data) {
            currentLogs = data
          }
        }

        // Ambil target/placeholder sesi sebelumnya (aman dengan try-catch)
        let stats: SetStat[] = []
        try {
          stats = await getPreviousWorkoutStats(exercise.id)
          if (stats && stats.length > 0) {
            setPrevStats(stats)
          }
        } catch (err) {
          console.warn('Failed to fetch previous stats (offline mode):', err)
        }

        // 3. Tentukan state awal sets
        const currentLogsMap = new Map<number, { set_number: number; weight_kg: any; reps: any; set_type?: string }>()
        if (currentLogs) {
          currentLogs.forEach((log) => {
            currentLogsMap.set(log.set_number, log)
          })
        }

        const maxPrevSetNumber = stats ? stats.length : 0
        const maxCurrentSetNumber = currentLogs && currentLogs.length > 0 
          ? Math.max(...currentLogs.map(l => l.set_number)) 
          : 0
        const totalSetsToRender = Math.max(1, maxPrevSetNumber, maxCurrentSetNumber)

        const initialSets: LocalSet[] = []
        for (let i = 1; i <= totalSetsToRender; i++) {
          const loggedSet = currentLogsMap.get(i)
          if (loggedSet) {
            initialSets.push({
              set_number: i,
              weight_kg: loggedSet.weight_kg !== null && loggedSet.weight_kg !== undefined ? String(loggedSet.weight_kg) : '',
              reps: loggedSet.reps !== null && loggedSet.reps !== undefined ? String(loggedSet.reps) : '',
              completed: true,
              set_type: (loggedSet.set_type as any) || 'R'
            })
          } else {
            initialSets.push({
              set_number: i,
              weight_kg: '',
              reps: '',
              completed: false,
              set_type: (stats?.[i - 1]?.set_type as any) || 'R'
            })
          }
        }
        setSets(initialSets)
      } catch (err) {
        console.error('Gagal memuat log latihan:', err)
      }
    }
    loadStatsAndCurrentLogs()
  }, [exercise.id, sessionId])

  // --- ANIMATION: RACK PULL (ACCORDION EXPANSION) ---
  const toggleAccordion = () => {
    if (!contentRef.current) return
    const nextState = !isOpen
    setIsOpen(nextState)

    // Dapatkan scrollHeight asli
    contentRef.current.style.height = 'auto'
    const fullHeight = contentRef.current.scrollHeight
    
    anime({
      targets: contentRef.current,
      height: nextState ? [0, fullHeight] : [fullHeight, 0],
      opacity: nextState ? [0, 1] : [1, 0],
      duration: 350,
      easing: 'easeInOutQuad',
      complete: () => {
        if (nextState && contentRef.current) {
          contentRef.current.style.height = 'auto'
        }
      }
    })
  }

  // --- SAVE ACTIONS TO DATABASE ---
  const saveLogsToDB = async (updatedSets: LocalSet[]) => {
    setSaving(true)
    try {
      // Hanya kirim set yang diselesaikan (completed === true) ke database
      const completedSets = updatedSets.filter(set => set.completed)
      
      const logsToSend = completedSets.map((set) => {
        // Fallback ke placeholder jika user mencentang tanpa mengisi nilai
        const prev = prevStats[set.set_number - 1]
        const finalWeight = set.weight_kg !== '' 
          ? parseFloat(set.weight_kg) 
          : (prev?.weight_kg ?? null)
        const finalReps = set.reps !== '' 
          ? parseInt(set.reps) 
          : (prev?.reps ?? null)

        return {
          set_number: set.set_number,
          weight_kg: finalWeight,
          reps: finalReps,
          set_type: set.set_type
        }
      })

      const offline = isBrowserOffline() || sessionId.startsWith('temp_session_')

      if (offline) {
        // Simpan ke Cache Lokal HP
        localStorage.setItem(`cached_logs_${sessionId}_${exercise.id}`, JSON.stringify(logsToSend))
        // Antrekan sinkronisasi ke server
        addToSyncQueue('SAVE_LOGS', sessionId, { exerciseId: exercise.id, logs: logsToSend })
      } else {
        await saveWorkoutLogAction(sessionId, exercise.id, logsToSend)
      }
    } catch (err) {
      console.error('Gagal autosave log set:', err)
    } finally {
      setSaving(false)
    }
  }

  // --- KELOLA SETS ---
  const addSet = () => {
    const nextSetNumber = sets.length + 1
    const newSets: LocalSet[] = [
      ...sets,
      { set_number: nextSetNumber, weight_kg: '', reps: '', completed: false, set_type: 'R' }
    ]
    setSets(newSets)
    saveLogsToDB(newSets)
  }

  const deleteLastSet = () => {
    if (sets.length <= 1) return
    const newSets: LocalSet[] = sets.slice(0, -1)
    setSets(newSets)
    saveLogsToDB(newSets)
  }

  const cycleSetType = (index: number) => {
    if (sets[index].completed) {
      toast('Set ini sudah tersimpan. Batalkan centang terlebih dahulu untuk mengubah tipe set.', 'warning')
      return
    }
    const types: ('R' | 'W' | 'D' | 'F')[] = ['R', 'W', 'D', 'F']
    const currentType = sets[index].set_type || 'R'
    const nextIndex = (types.indexOf(currentType) + 1) % types.length
    const nextType = types[nextIndex]

    const updated: LocalSet[] = sets.map((set, i) =>
      i === index ? { ...set, set_type: nextType } : set
    )
    setSets(updated)
    saveLogsToDB(updated)
  }

  const updateSetInput = (index: number, field: 'weight_kg' | 'reps', value: string) => {
    const updated = sets.map((set, i) =>
      i === index ? { ...set, [field]: value } : set
    )
    setSets(updated)
  }

  // --- ANIMATION: PLATE SLIDE (TICK ROW EFFECT) ---
  const toggleSetComplete = (index: number, rowEl: HTMLDivElement | null) => {
    const nextCompleteState = !sets[index].completed
    
    // Terapkan state lokal
    const updated = sets.map((set, i) =>
      i === index ? { ...set, completed: nextCompleteState } : set
    )
    setSets(updated)

    // Trigger simpan ke DB
    saveLogsToDB(updated)

    // Jalankan animasi slide jika diselesaikan (checked)
    if (nextCompleteState && rowEl) {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(40)
      }
      anime({
        targets: rowEl,
        translateX: [0, 8, -4, 0],
        backgroundColor: [
          'transparent', 
          'rgba(124, 154, 92, 0.2)', // --progress warna lumut pudar
          'rgba(124, 154, 92, 0.08)'
        ],
        duration: 350,
        easing: 'easeOutQuad'
      })
    } else if (rowEl) {
      // Jika di-uncheck, hilangkan background highlight hijau
      anime({
        targets: rowEl,
        backgroundColor: 'transparent',
        duration: 200,
        easing: 'linear'
      })
    }
  }

  const completedSetsCount = sets.filter((s) => s.completed).length

  return (
    <div
      ref={cardRef}
      className="rounded-xl border transition-all duration-200"
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: isOpen ? 'var(--chalk-muted)' : 'var(--border)',
      }}
    >
      {/* Header Kartu */}
      <div
        onClick={toggleAccordion}
        className="p-4 flex items-center justify-between cursor-pointer select-none"
      >
        <div className="space-y-1">
          <h3 className="font-display text-lg font-bold uppercase tracking-wide leading-tight" style={{ color: 'var(--chalk)' }}>
            {exercise.name}
          </h3>
          <div className="flex gap-2 text-[9px] uppercase font-bold tracking-wider" style={{ color: 'var(--chalk-muted)' }}>
            <span>{exercise.body_part || 'Gerakan'}</span>
            <span>•</span>
            <span style={{ color: completedSetsCount === sets.length ? 'var(--progress)' : 'var(--chalk-muted)' }}>
              {completedSetsCount} / {sets.length} Set Selesai
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {completedSetsCount === sets.length && (
            <span className="p-1 rounded bg-[rgba(124,154,92,0.1)] text-[--progress]">
              <Check className="w-4 h-4" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            style={{ color: 'var(--chalk-muted)' }}
          />
        </div>
      </div>

      {/* Detail Input Sets (Rack Pull Accordion) */}
      <div
        ref={contentRef}
        className="overflow-hidden opacity-0"
        style={{ height: 0 }}
      >
        <div className="p-4 pt-0 border-t space-y-4" style={{ borderColor: 'var(--border)' }}>
          {/* Visual Form Latihan Toggle & GIF */}
          {exercise.gif_url && (
            <div className="pt-3.5 border-b pb-3.5 flex flex-col gap-3" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--chalk-muted)' }}>
                  Visual Gerakan Latihan
                </span>
                <button
                  type="button"
                  onClick={toggleGif}
                  className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg border text-[9px] font-bold uppercase tracking-wider hover:bg-[--surface-raised] transition-colors cursor-pointer"
                  style={{ borderColor: 'var(--border)', color: 'var(--chalk-muted)' }}
                >
                  {showGif ? (
                    <>
                      <EyeOff className="w-3 h-3" />
                      Sembunyikan
                    </>
                  ) : (
                    <>
                      <Eye className="w-3 h-3" />
                      Lihat Gerakan
                    </>
                  )}
                </button>
              </div>

              {showGif && (
                <div className="w-full flex justify-center animate-in fade-in slide-in-from-top-1 duration-200">
                  <GifPreview gifUrl={exercise.gif_url} name={exercise.name} />
                </div>
              )}
            </div>
          )}

          {/* Header Tabel Set */}
          <div className="grid grid-cols-12 gap-2 text-[10px] font-bold uppercase tracking-wider text-center pt-3" style={{ color: 'var(--chalk-muted)' }}>
            <span className="col-span-2 text-left">Set</span>
            <span className="col-span-4">Sebelumnya</span>
            <span className="col-span-3">Beban (kg)</span>
            <span className="col-span-2">Reps</span>
            <span className="col-span-1"></span>
          </div>

          {/* List Set Rows */}
          <div className="space-y-2">
            {sets.map((set, index) => {
              const prev = prevStats[index]
              let rowRef: HTMLDivElement | null = null

              // Hitung 1RM
              const current1RM = calculate1RM(set.weight_kg, set.reps, null, null)
              const prevWeight = prev?.weight_kg ?? null
              const prevReps = prev?.reps ?? null
              const active1RM = calculate1RM(set.weight_kg, set.reps, prevWeight, prevReps)
              const display1RM = current1RM || (set.completed ? active1RM : null)

              return (
                <div
                  key={set.set_number}
                  ref={(el) => { rowRef = el }}
                  className="p-1.5 rounded-lg transition-colors duration-150 flex flex-col gap-1"
                  style={{
                    backgroundColor: set.completed ? 'rgba(124, 154, 92, 0.08)' : 'transparent'
                  }}
                >
                  <div className="grid grid-cols-12 gap-2 items-center text-center">
                    {/* Badge/Nomor Set - Klik untuk cycle tipe set */}
                    <div className="col-span-2 text-left flex items-center justify-start">
                      <button
                        type="button"
                        onClick={() => cycleSetType(index)}
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-display text-[10px] font-bold tracking-tight transition-all active:scale-90 border shadow-sm cursor-pointer ${
                          set.set_type === 'W'
                            ? 'bg-gradient-to-br from-amber-500/20 to-amber-500/5 border-amber-500/40 text-amber-400 hover:border-amber-500/60 shadow-[0_0_8px_rgba(245,158,11,0.15)] font-extrabold'
                            : set.set_type === 'D'
                            ? 'bg-gradient-to-br from-purple-500/20 to-purple-500/5 border-purple-500/40 text-purple-400 hover:border-purple-500/60 shadow-[0_0_8px_rgba(168,85,247,0.15)] font-extrabold'
                            : set.set_type === 'F'
                            ? 'bg-gradient-to-br from-red-500/20 to-red-500/5 border-red-500/40 text-red-400 hover:border-red-500/60 shadow-[0_0_8px_rgba(239,68,68,0.15)] font-extrabold'
                            : 'bg-white/[0.02] border-white/10 text-[var(--chalk)] hover:bg-white/[0.06] hover:border-white/20'
                        }`}
                        style={{ borderColor: 'var(--border)' }}
                        title={
                          set.completed
                            ? `Set ke-${set.set_number} — sudah tersimpan`
                            : 'Klik untuk ubah tipe set (W/D/F/Regular)'
                        }
                      >
                        {set.set_type === 'R' ? set.set_number : set.set_type}
                      </button>
                    </div>

                    {/* Statistik Sebelumnya */}
                    <span className="col-span-4 font-numeric text-xs flex items-center justify-center gap-1" style={{ color: 'var(--chalk-muted)' }}>
                      {prev ? (
                        <>
                          <Award className="w-3.5 h-3.5" style={{ color: 'var(--progress)' }} />
                          {prev.weight_kg}kg × {prev.reps}
                        </>
                      ) : (
                        '—'
                      )}
                    </span>

                    {/* Input Beban (KG) */}
                    <div className="col-span-3">
                      <input
                        type="text"
                        inputMode="decimal"
                        disabled={set.completed}
                        value={set.weight_kg}
                        onChange={(e) => updateSetInput(index, 'weight_kg', e.target.value)}
                        placeholder={prev?.weight_kg ? String(prev.weight_kg) : '0'}
                        className="block w-full text-center py-1.5 border rounded focus:outline-none focus:ring-1 focus:ring-[--chalk-muted] font-numeric text-xs disabled:opacity-50"
                        style={{
                          backgroundColor: 'var(--surface-raised)',
                          borderColor: 'var(--border)',
                          color: 'var(--chalk)',
                        }}
                      />
                    </div>

                    {/* Input Reps */}
                    <div className="col-span-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        disabled={set.completed}
                        value={set.reps}
                        onChange={(e) => updateSetInput(index, 'reps', e.target.value)}
                        placeholder={prev?.reps ? String(prev.reps) : '0'}
                        className="block w-full text-center py-1.5 border rounded focus:outline-none focus:ring-1 focus:ring-[--chalk-muted] font-numeric text-xs disabled:opacity-50"
                        style={{
                          backgroundColor: 'var(--surface-raised)',
                          borderColor: 'var(--border)',
                          color: 'var(--chalk)',
                        }}
                      />
                    </div>

                    {/* Tombol Check-off (Plate Slide) */}
                    <div className="col-span-1 flex items-center justify-end">
                      <button
                        onClick={() => toggleSetComplete(index, rowRef)}
                        className="p-1.5 rounded cursor-pointer transition-colors border"
                        style={{
                          borderColor: set.completed ? 'var(--progress)' : 'var(--border)',
                          backgroundColor: set.completed ? 'var(--progress)' : 'transparent',
                          color: set.completed ? 'var(--surface)' : 'var(--chalk-muted)'
                        }}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3px]" />
                      </button>
                    </div>
                  </div>

                  {/* Estimasi 1RM sub-row */}
                  {display1RM !== null && (
                    <div className="flex justify-end pr-9 text-[9px] font-body animate-in fade-in duration-150" style={{ color: 'var(--chalk-muted)' }}>
                      <span>Estimasi 1RM: <strong style={{ color: 'var(--intensity)' }}>{display1RM} kg</strong></span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Buttons Kelola Set */}
          <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
            <button
              onClick={addSet}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 border rounded-lg text-[10px] font-bold font-display uppercase tracking-wider cursor-pointer hover:bg-[--surface-raised] transition-colors"
              style={{ borderColor: 'var(--border)', color: 'var(--chalk-muted)' }}
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Set
            </button>
            <button
              disabled={sets.length <= 1}
              onClick={deleteLastSet}
              className="p-2 border rounded-lg hover:bg-[--surface-raised] transition-colors disabled:opacity-30 cursor-pointer"
              style={{ borderColor: 'var(--border)', color: 'var(--intensity)' }}
              title="Hapus Set Terakhir"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Legend Tipe Set (Compact Single Row) */}
          <div
            className="flex items-center justify-center gap-1.5 pt-3.5 border-t"
            style={{ borderColor: 'var(--border)' }}
          >
            <Info className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--intensity)' }} />
            <span className="text-[9px] font-body whitespace-nowrap" style={{ color: 'var(--chalk-muted)' }}>
              Ketuk nomor set:
            </span>
            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded border bg-amber-500/10 text-amber-500 border-amber-500/20 whitespace-nowrap">W</span>
            <span className="text-[9px]" style={{ color: 'var(--chalk-muted)' }}>Warm-up</span>
            <span className="text-[9px]" style={{ color: 'var(--border)' }}>•</span>
            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded border bg-purple-500/10 text-purple-500 border-purple-500/20 whitespace-nowrap">D</span>
            <span className="text-[9px]" style={{ color: 'var(--chalk-muted)' }}>Drop set</span>
            <span className="text-[9px]" style={{ color: 'var(--border)' }}>•</span>
            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded border bg-red-500/10 text-red-500 border-red-500/20 whitespace-nowrap">F</span>
            <span className="text-[9px]" style={{ color: 'var(--chalk-muted)' }}>Failure</span>
          </div>
        </div>
      </div>
    </div>
  )
}
