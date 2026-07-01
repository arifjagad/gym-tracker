'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Search,
  Target,
  Dumbbell,
  HelpCircle,
  X,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  ChevronRight,
  Flame,
  BarChart2,
} from 'lucide-react'
import { SearchableSelect } from '@/components/ui/searchable-select'
import type { SelectOption } from '@/components/ui/searchable-select'

interface Exercise {
  id: string
  name: string
  body_part: string | null
  target: string | null
  equipment: string | null
  instructions: string[] | null
  gif_url: string | null
}

interface ExercisesManagerProps {
  initialCategories: string[]
  initialTargets: string[]
  initialEquipments: string[]
}

function getCleanGifUrl(workoutxGifUrl: string | null): string {
  if (!workoutxGifUrl) return ''
  const parts = workoutxGifUrl.split('/')
  const lastPart = parts[parts.length - 1]
  const id = lastPart.replace('.gif', '').padStart(4, '0')
  return `https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/${id}.gif`
}

function GifPreview({ gifUrl, name }: { gifUrl: string; name: string }) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const cleanUrl = getCleanGifUrl(gifUrl)

  return (
    <div
      className="w-full rounded-xl overflow-hidden relative border bg-white"
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

      {/* GIF - Keep white background for exercises list details */}
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

export function ExercisesManager({
  initialCategories,
  initialTargets,
  initialEquipments,
}: ExercisesManagerProps) {
  // Build options for search inputs
  const targetOptions: SelectOption[] = [
    { value: 'Semua', label: 'Semua Otot Target' },
    ...initialTargets.map((t) => ({ value: t, label: t })),
  ]

  const equipmentOptions: SelectOption[] = [
    { value: 'Semua', label: 'Semua Alat' },
    ...initialEquipments.map((eq) => ({ value: eq, label: eq })),
  ]
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Semua')
  const [selectedTarget, setSelectedTarget] = useState('Semua')
  const [selectedEquipment, setSelectedEquipment] = useState('Semua')
  const [showFilters, setShowFilters] = useState(false)

  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const limit = 20

  // Click and drag horizontal scroll handler
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    let isDown = false
    let startX: number
    let scrollLeft: number

    const handleMouseDown = (e: MouseEvent) => {
      isDown = true
      startX = e.pageX - el.offsetLeft
      scrollLeft = el.scrollLeft
    }

    const handleMouseLeave = () => {
      isDown = false
    }

    const handleMouseUp = () => {
      isDown = false
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDown) return
      e.preventDefault()
      const x = e.pageX - el.offsetLeft
      const walk = (x - startX) * 1.5
      el.scrollLeft = scrollLeft - walk
    }

    el.addEventListener('mousedown', handleMouseDown)
    el.addEventListener('mouseleave', handleMouseLeave)
    el.addEventListener('mouseup', handleMouseUp)
    el.addEventListener('mousemove', handleMouseMove)

    return () => {
      el.removeEventListener('mousedown', handleMouseDown)
      el.removeEventListener('mouseleave', handleMouseLeave)
      el.removeEventListener('mouseup', handleMouseUp)
      el.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  // Load exercises on page, search, or filters change
  useEffect(() => {
    async function loadExercises() {
      setLoading(true)
      try {
        let query = supabase.from('exercises').select('*')

        if (selectedCategory !== 'Semua') {
          query = query.ilike('body_part', selectedCategory)
        }
        if (selectedTarget !== 'Semua') {
          query = query.ilike('target', selectedTarget)
        }
        if (selectedEquipment !== 'Semua') {
          query = query.ilike('equipment', selectedEquipment)
        }
        if (search.trim()) {
          query = query.ilike('name', `%${search}%`)
        }

        const from = (page - 1) * limit
        const to = from + limit - 1

        const { data, error } = await query
          .order('name')
          .range(from, to)

        if (error) throw error

        if (data) {
          if (page === 1) {
            setExercises(data)
          } else {
            setExercises((prev) => [...prev, ...data])
          }
          setHasMore(data.length === limit)
        }
      } catch (err) {
        console.error('Error fetching exercises:', err)
      } finally {
        setLoading(false)
      }
    }

    const timer = setTimeout(() => {
      loadExercises()
    }, 200)

    return () => clearTimeout(timer)
  }, [search, selectedCategory, selectedTarget, selectedEquipment, page])

  // Reset page to 1 when filters or search changes
  useEffect(() => {
    setPage(1)
  }, [search, selectedCategory, selectedTarget, selectedEquipment])

  return (
    <div className="space-y-5">
      {/* Search and Filters Toggle Row */}
      <div className="flex gap-2">
        <div
          className="flex-1 flex items-center gap-2.5 px-3.5 py-3 rounded-xl border"
          style={{ backgroundColor: 'var(--surface-raised)', borderColor: 'var(--border)' }}
        >
          <Search className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--chalk-muted)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama gerakan..."
            className="flex-1 bg-transparent text-xs font-body focus:outline-none"
            style={{ color: 'var(--chalk)' }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ color: 'var(--chalk-muted)' }}>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="px-3.5 rounded-xl border flex items-center justify-center cursor-pointer transition-colors"
          style={{
            backgroundColor: showFilters ? 'rgba(232,67,44,0.1)' : 'var(--surface-raised)',
            borderColor: showFilters ? 'var(--intensity)' : 'var(--border)',
            color: showFilters ? 'var(--intensity)' : 'var(--chalk-muted)',
          }}
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Advanced Filter Panel */}
      {showFilters && (
        <div
          className="p-4 rounded-xl border space-y-4 animate-in fade-in slide-in-from-top-2 duration-150"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          {/* Target Muscle Dropdown */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold uppercase tracking-wider font-display" style={{ color: 'var(--chalk-muted)' }}>
              Target Otot Utama
            </label>
            <SearchableSelect
              options={targetOptions}
              value={selectedTarget}
              onChange={setSelectedTarget}
              placeholder="Cari target otot..."
            />
          </div>

          {/* Equipment Dropdown */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold uppercase tracking-wider font-display" style={{ color: 'var(--chalk-muted)' }}>
              Alat yang Digunakan
            </label>
            <SearchableSelect
              options={equipmentOptions}
              value={selectedEquipment}
              onChange={setSelectedEquipment}
              placeholder="Cari alat..."
            />
          </div>
        </div>
      )}

      {/* Categories Horizontal Scroll Row */}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-none select-none"
        style={{
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
          cursor: 'grab',
        }}
      >
        {initialCategories.map((cat) => {
          const isActive = selectedCategory === cat
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className="px-3.5 py-1.5 rounded-lg text-[9px] uppercase font-bold tracking-widest font-display transition-all cursor-pointer border flex-shrink-0"
              style={{
                backgroundColor: isActive ? 'var(--intensity)' : 'var(--surface-raised)',
                borderColor: isActive ? 'var(--intensity)' : 'var(--border)',
                color: isActive ? '#fff' : 'var(--chalk-muted)',
              }}
            >
              {cat}
            </button>
          )
        })}
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-2 gap-3 w-full">
        {exercises.map((ex) => (
          <button
            key={ex.id}
            onClick={() => setActiveExercise(ex)}
            className="p-4 rounded-2xl border flex flex-col justify-between gap-3 text-left cursor-pointer transition-all duration-200 active:scale-[0.97]"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)',
            }}
          >
            <div className="space-y-2.5 w-full">
              <h3 className="font-display text-xs font-bold uppercase tracking-wide leading-tight truncate" style={{ color: 'var(--chalk)' }}>
                {ex.name}
              </h3>

              {/* Badges */}
              <div className="flex flex-col items-start gap-1.5 w-full">
                {ex.target && (
                  <span
                    className="px-2 py-1 rounded text-[7.5px] uppercase font-bold tracking-wider font-body flex items-center gap-1 bg-[rgba(232,67,44,0.06)] text-[--intensity] w-auto max-w-full truncate"
                    title={ex.target}
                  >
                    <Target className="w-2.5 h-2.5 flex-shrink-0" />
                    <span className="truncate">{ex.target}</span>
                  </span>
                )}
                {ex.body_part && (
                  <span
                    className="px-2 py-1 rounded text-[7.5px] uppercase font-bold tracking-wider font-body bg-[rgba(237,233,221,0.06)] text-[--chalk-muted] w-auto max-w-full truncate"
                    title={ex.body_part}
                  >
                    {ex.body_part}
                  </span>
                )}
                {ex.equipment && (
                  <span
                    className="px-2 py-1 rounded text-[7.5px] uppercase font-bold tracking-wider font-body bg-[--surface-raised] text-[--chalk-muted] w-auto max-w-full truncate"
                    title={ex.equipment}
                  >
                    {ex.equipment}
                  </span>
                )}
              </div>
            </div>

            <div className="pt-2 border-t w-full" style={{ borderColor: 'var(--border)' }}>
              <span className="text-[9px] font-body block" style={{ color: 'var(--intensity)', opacity: 0.85 }}>
                Lihat Detail →
              </span>
            </div>
          </button>
        ))}

        {/* Loading and Empty State */}
        {loading && exercises.length === 0 && (
          <div className="col-span-full text-center py-12 text-xs font-body" style={{ color: 'var(--chalk-muted)' }}>
            Memuat data catalog...
          </div>
        )}
        {!loading && exercises.length === 0 && (
          <div className="col-span-full text-center py-12 text-xs font-body" style={{ color: 'var(--chalk-muted)' }}>
            Tidak ditemukan gerakan olahraga yang cocok.
          </div>
        )}
      </div>

      {/* Pagination: Load More Button */}
      {hasMore && exercises.length > 0 && (
        <div className="pt-2">
          <button
            onClick={() => setPage((prev) => prev + 1)}
            disabled={loading}
            className="w-full py-3.5 rounded-2xl border text-xs font-display font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 active:scale-[0.98]"
            style={{
              backgroundColor: 'var(--surface-raised)',
              borderColor: 'var(--border)',
              color: 'var(--chalk)',
            }}
          >
            {loading ? 'Memuat data...' : 'Muat Lebih Banyak'}
          </button>
        </div>
      )}

      {/* ── DETAIL MODAL (matches homepage design) ── */}
      {activeExercise && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[70]"
            style={{ backgroundColor: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(8px)' }}
            onClick={() => setActiveExercise(null)}
          />

          {/* Modal Card wrapper */}
          <div
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-[70] rounded-t-3xl overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-200"
            style={{
              backgroundColor: 'var(--surface)',
              borderTop: '1px solid var(--border-strong)',
              maxHeight: '85dvh',
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
          >
            {/* Top orange/red gradient stripe */}
            <div className="h-1 w-full flex-shrink-0" style={{ background: 'linear-gradient(to right, var(--intensity), #ff6b4a)' }} />

            {/* Handle stripe */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full" style={{ backgroundColor: 'var(--border-strong)' }} />
            </div>

            {/* Header */}
            <div className="flex items-start justify-between px-5 pb-4 border-b flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
              <div className="space-y-2 flex-1 pr-4">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {activeExercise.body_part && (
                    <span
                      className="text-[9px] font-body uppercase tracking-wider px-2.5 py-0.5 rounded-full font-bold"
                      style={{ backgroundColor: 'rgba(232,67,44,0.12)', color: 'var(--intensity)', border: '1px solid rgba(232,67,44,0.2)' }}
                    >
                      {activeExercise.body_part}
                    </span>
                  )}
                  {activeExercise.equipment && (
                    <span
                      className="text-[9px] font-body uppercase tracking-wider px-2.5 py-0.5 rounded-full font-bold"
                      style={{ backgroundColor: 'var(--surface-raised)', color: 'var(--chalk-muted)' }}
                    >
                      {activeExercise.equipment}
                    </span>
                  )}
                </div>
                <h3 className="font-display text-base font-extrabold uppercase tracking-wide leading-tight" style={{ color: 'var(--chalk)' }}>
                  {activeExercise.name}
                </h3>
              </div>
              <button
                onClick={() => setActiveExercise(null)}
                className="p-1.5 rounded-lg active:opacity-75 cursor-pointer flex-shrink-0"
                style={{ color: 'var(--chalk-muted)', backgroundColor: 'var(--surface-raised)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 pb-12 space-y-5">
              {/* GIF Preview */}
              {activeExercise.gif_url && (
                <GifPreview gifUrl={activeExercise.gif_url} name={activeExercise.name} />
              )}

              {/* Target muscle info row */}
              {activeExercise.target && (
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ backgroundColor: 'var(--surface-raised)' }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(232,67,44,0.15)' }}>
                    <Target className="w-3.5 h-3.5" style={{ color: 'var(--intensity)' }} />
                  </div>
                  <div>
                    <p className="text-[9px] font-body uppercase tracking-wider mb-0.5" style={{ color: 'var(--chalk-muted)' }}>Otot Target</p>
                    <p className="text-xs font-bold font-display uppercase tracking-wide" style={{ color: 'var(--chalk)' }}>{activeExercise.target}</p>
                  </div>
                </div>
              )}

              {/* Instructions steps list */}
              {activeExercise.instructions && activeExercise.instructions.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <BarChart2 className="w-3.5 h-3.5" style={{ color: 'var(--intensity)' }} />
                    <span className="text-[10px] font-bold font-display uppercase tracking-wider" style={{ color: 'var(--chalk)' }}>
                      Cara Melakukan
                    </span>
                  </div>
                  <ol className="space-y-2">
                    {activeExercise.instructions.map((inst, idx) => (
                      <li key={idx} className="flex gap-3 text-xs leading-relaxed" style={{ color: 'var(--chalk-muted)' }}>
                        <span
                          className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold font-numeric mt-0.5"
                          style={{ backgroundColor: 'rgba(232,67,44,0.12)', color: 'var(--intensity)' }}
                        >
                          {idx + 1}
                        </span>
                        <span className="font-body">{inst}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
