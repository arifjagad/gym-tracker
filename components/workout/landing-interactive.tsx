'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Dumbbell, Trophy, Calendar, Target, HelpCircle, Check, Play, Pause, ChevronDown, X, Zap, BarChart2, Database, TrendingUp, Users, Flame } from 'lucide-react'
import anime from 'animejs'

/**
 * Mengkonversi URL gif dari WorkoutX API ke URL raw GitHub yang bersih dan bebas watermark.
 * Contoh: https://api.workoutxapp.com/v1/gifs/0001.gif → https://raw.githubusercontent.com/.../0001.gif
 * Ini menghilangkan kebutuhan proxy server-side sehingga GIF langsung dari CDN GitHub.
 */
function getCleanGifUrl(workoutxGifUrl: string): string {
  if (!workoutxGifUrl) return ''
  const parts = workoutxGifUrl.split('/')
  const lastPart = parts[parts.length - 1]
  const id = lastPart.replace('.gif', '').padStart(4, '0')
  return `https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/${id}.gif`
}

// ============================================================
// POPULAR EXERCISES SAMPLE FOR LANDING EXPLORER (Client-side)
// ============================================================
type SampleExercise = {
  name: string
  target: string
  bodyPart: string
  equipment: string
  secondaryMuscles: string[]
  description: string
  instructions: string[]
  gifUrl?: string
}

// ============================================================
// WIDGET 1: DEMO LOGGER INTERAKTIF
// ============================================================
export function DemoLoggerWidget() {
  const [sets, setSets] = useState([
    { id: 1, weight: 100, reps: 8, completed: false },
    { id: 2, weight: 100, reps: 8, completed: false },
    { id: 3, weight: 100, reps: 8, completed: false },
  ])
  const [isRunning, setIsRunning] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Stopwatch effect
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isRunning])

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60)
    const remainingSecs = secs % 60
    return `${String(mins).padStart(2, '0')}:${String(remainingSecs).padStart(2, '0')}`
  }

  const toggleSet = (id: number) => {
    setSets((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const nextCompleted = !s.completed
          // Trigger stopwatch on first complete set if not running
          if (nextCompleted && !isRunning) {
            setIsRunning(true)
          }
          return { ...s, completed: nextCompleted }
        }
        return s
      })
    )
  }

  const resetDemo = () => {
    setSets([
      { id: 1, weight: 100, reps: 8, completed: false },
      { id: 2, weight: 100, reps: 8, completed: false },
      { id: 3, weight: 100, reps: 8, completed: false },
    ])
    setIsRunning(false)
    setSeconds(0)
  }

  return (
    <div
      className="p-5 rounded-xl border space-y-4 max-w-sm w-full text-left"
      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      {/* Header Widget */}
      <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border)' }}>
        <div>
          <h4 className="font-display text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--chalk)' }}>
            DEMO LOGGER: BENCH PRESS
          </h4>
          <span className="text-[10px] font-body" style={{ color: 'var(--chalk-muted)' }}>
            Latihan Hari Ini • Chest Day
          </span>
        </div>

        {/* Mini Stopwatch */}
        <div className="flex items-center gap-2">
          <span className="font-numeric text-xs font-bold" style={{ color: 'var(--progress)' }}>
            {formatTime(seconds)}
          </span>
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="p-1 rounded bg-[--surface-raised] hover:bg-neutral-700 cursor-pointer"
          >
            {isRunning ? <Pause className="w-3 h-3 text-[--chalk]" /> : <Play className="w-3 h-3 text-[--chalk]" />}
          </button>
        </div>
      </div>

      {/* Set List */}
      <div className="space-y-2">
        {sets.map((set) => (
          <div
            key={set.id}
            onClick={() => toggleSet(set.id)}
            className="p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-all duration-150"
            style={{
              backgroundColor: set.completed ? 'rgba(124, 154, 92, 0.06)' : 'var(--surface-raised)',
              borderColor: set.completed ? 'var(--progress)' : 'var(--border)',
            }}
          >
            <div className="flex items-center gap-3 font-numeric text-xs">
              <span className="opacity-45 font-bold">SET {set.id}</span>
              <span className="font-bold" style={{ color: 'var(--chalk)' }}>
                {set.weight} kg × {set.reps} reps
              </span>
            </div>

            {/* Checkbox */}
            <div
              className="w-5 h-5 rounded flex items-center justify-center border transition-all duration-150"
              style={{
                backgroundColor: set.completed ? 'var(--progress)' : 'transparent',
                borderColor: set.completed ? 'var(--progress)' : 'var(--border)',
              }}
            >
              {set.completed && <Check className="w-3 h-3 text-[--bg-base]" strokeWidth={3} />}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Reset */}
      <div className="flex items-center justify-between text-[10px] pt-1">
        <span style={{ color: 'var(--chalk-muted)' }}>*Tap set untuk menandai selesai.</span>
        <button
          onClick={resetDemo}
          className="underline font-bold hover:text-[--intensity]"
          style={{ color: 'var(--chalk-muted)' }}
        >
          Reset Demo
        </button>
      </div>
    </div>
  )
}

// ============================================================
// WIDGET 2: CHALK BURST SHOWCASE
// ============================================================
export function ChalkBurstWidget() {
  const badgeRef = useRef<HTMLButtonElement>(null)

  const triggerChalkBurst = () => {
    if (!badgeRef.current) return
    const rect = badgeRef.current.getBoundingClientRect()

    // 1. Buat partikel kapur di sekeliling tombol
    const particles = Array.from({ length: 15 }, () => {
      const p = document.createElement('span')
      p.className = 'fixed w-1.5 h-1.5 rounded-full pointer-events-none z-50'
      p.style.backgroundColor = 'var(--chalk)'
      p.style.left = `${rect.left + rect.width / 2}px`
      p.style.top = `${rect.top + rect.height / 2}px`
      p.style.opacity = '0.9'
      document.body.appendChild(p)
      return p
    })

    // 2. Animasikan partikel meletup (Chalk Burst)
    anime({
      targets: particles,
      translateX: () => anime.random(-60, 60),
      translateY: () => anime.random(-70, 20),
      opacity: [1, 0],
      scale: [1.2, 0.2],
      duration: () => anime.random(600, 1000),
      easing: 'easeOutExpo',
      complete: () => particles.forEach((p) => p.remove()),
    })

    // 3. Flash warna merah intensitas di tombol PR
    anime({
      targets: badgeRef.current,
      backgroundColor: ['rgba(232,67,44,0)', 'rgba(232,67,44,0.4)', 'rgba(232,67,44,0)'],
      duration: 800,
      easing: 'linear',
    })
  }

  return (
    <div
      className="p-6 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-6 max-w-4xl w-full h-full"
      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="space-y-2 flex-1 text-left">
        <h4 className="font-display text-xl font-bold uppercase tracking-wider" style={{ color: 'var(--chalk)' }}>
          CHALK BURST: PERSONAL RECORD
        </h4>
        <p className="font-body text-xs" style={{ color: 'var(--chalk-muted)' }}>
          Deteksi otomatis rekor angkatan terberat (PR) untuk setiap gerakan. Rayakan kerja keras Anda dengan efek letupan kapur dramatis di layar setiap kali rekor pecah.
        </p>
      </div>

      {/* Interaksi Box */}
      <div
        className="p-4 rounded-xl border flex flex-col items-center justify-center gap-3 w-56 text-center"
        style={{ backgroundColor: 'var(--surface-raised)', borderColor: 'var(--border)' }}
      >
        <span className="text-[10px] font-bold uppercase tracking-wider opacity-60" style={{ color: 'var(--chalk-muted)' }}>
          Simulasi Rekor Baru
        </span>

        {/* PR Badge Button */}
        <button
          ref={badgeRef}
          onClick={triggerChalkBurst}
          className="relative py-2.5 px-6 rounded border font-display text-sm font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-transform hover:scale-105 active:scale-95"
          style={{ borderColor: 'var(--intensity)', color: 'var(--intensity)' }}
        >
          <Trophy className="w-4 h-4" />
          NEW RECORD PR!
        </button>

        <span className="text-[9px] font-body" style={{ color: 'var(--chalk-muted)' }}>
          *Klik tombol untuk meledakkan kapur!
        </span>
      </div>
    </div>
  )
}

// ============================================================
// WIDGET 3: MINI CATALOG EXPLORER  
// ============================================================



/**
 * Komponen GIF preview dengan skeleton shimmer saat loading.
 * Langsung menggunakan raw.githubusercontent.com (GitHub CDN publik) — tanpa proxy server —
 * sehingga gambar muncul secepatnya dengan 1 hop jaringan saja.
 */
function GifPreview({ gifUrl, name }: { gifUrl: string; name: string }) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const cleanUrl = getCleanGifUrl(gifUrl)

  return (
    <div
      className="w-full rounded-xl overflow-hidden relative"
      style={{ aspectRatio: '1 / 1' }}
    >
      {/* Skeleton shimmer — tampil selama GIF belum dimuat */}
      {!loaded && !error && (
        <div className="absolute inset-0">
          <div
            className="w-full h-full"
            style={{
              background: 'linear-gradient(90deg, #111 25%, #1c1c1c 50%, #111 75%)',
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

      {/* GIF — mengisi penuh container persegi, tanpa ruang hitam sisa */}
      {!error && (
        <img
          src={cleanUrl}
          alt={name}
          loading="eager"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className="w-full h-full object-cover transition-opacity duration-500"
          style={{
            opacity: loaded ? 1 : 0,
            filter: 'invert(0.88) hue-rotate(180deg) brightness(1.15) contrast(1.05)',
          }}
        />
      )}

      {/* Fallback jika GitHub CDN tidak tersedia */}
      {error && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-2"
          style={{ backgroundColor: 'var(--surface-raised)' }}
        >
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(232,67,44,0.1)', border: '1px solid rgba(232,67,44,0.2)' }}>
            <span className="text-xl">🏋️</span>
          </div>
          <span className="text-[10px] font-body" style={{ color: 'var(--chalk-muted)' }}>Preview tidak tersedia</span>
        </div>
      )}
    </div>
  )
}

function ExerciseModal({ exercise, onClose }: { exercise: SampleExercise; onClose: () => void }) {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Animate in
    if (modalRef.current) {
      anime({
        targets: modalRef.current,
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 280,
        easing: 'easeOutCubic',
      })
    }
    // Lock body scroll
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(10,10,10,0.82)', backdropFilter: 'blur(8px)' }}
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-[390px] rounded-2xl border overflow-hidden flex flex-col"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)',
          maxHeight: '88vh',
          opacity: 0,
        }}
      >
        {/* Header stripe */}
        <div className="h-1 w-full" style={{ background: 'linear-gradient(to right, var(--intensity), #ff6b4a)' }} />

        {/* Modal Header */}
        <div className="flex items-start justify-between p-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="space-y-2 flex-1 pr-4">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className="text-[9px] font-body uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{ backgroundColor: 'rgba(232,67,44,0.12)', color: 'var(--intensity)', border: '1px solid rgba(232,67,44,0.2)' }}
              >
                {exercise.bodyPart}
              </span>
              <span className="text-[9px] font-body uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--surface-raised)', color: 'var(--chalk-muted)' }}>
                {exercise.equipment}
              </span>
            </div>
            <h3 className="font-display text-base font-extrabold uppercase tracking-wide leading-tight" style={{ color: 'var(--chalk)' }}>
              {exercise.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors cursor-pointer flex-shrink-0"
            style={{ color: 'var(--chalk-muted)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* GIF Preview */}
          {exercise.gifUrl && (
            <GifPreview gifUrl={exercise.gifUrl} name={exercise.name} />
          )}

          {/* Target muscle info row */}
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ backgroundColor: 'var(--surface-raised)' }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(232,67,44,0.15)' }}>
              <Target className="w-3.5 h-3.5" style={{ color: 'var(--intensity)' }} />
            </div>
            <div>
              <p className="text-[9px] font-body uppercase tracking-wider mb-0.5" style={{ color: 'var(--chalk-muted)' }}>Otot Target</p>
              <p className="text-xs font-bold font-display uppercase tracking-wide" style={{ color: 'var(--chalk)' }}>{exercise.target}</p>
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-3.5 h-3.5" style={{ color: 'var(--intensity)' }} />
              <span className="text-[10px] font-bold font-display uppercase tracking-wider" style={{ color: 'var(--chalk)' }}>Cara Melakukan</span>
            </div>
            <ol className="space-y-2">
              {exercise.instructions.map((step, i) => (
                <li key={i} className="flex gap-3 text-xs font-body leading-relaxed" style={{ color: 'var(--chalk-muted)' }}>
                  <span
                    className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold font-numeric mt-0.5"
                    style={{ backgroundColor: 'rgba(232,67,44,0.12)', color: 'var(--intensity)' }}
                  >
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="p-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <a
            href="/login"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-display font-bold text-xs uppercase tracking-wider transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, var(--intensity), #ff6b4a)', color: '#fff' }}
          >
            <Zap className="w-3.5 h-3.5" />
            Catat Latihan Ini — Gratis
          </a>
        </div>
      </div>
    </div>
  )
}

export function MiniCatalogWidget() {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Semua')
  const [categories, setCategories] = useState<string[]>(['Semua'])
  const [exercises, setExercises] = useState<any[]>([])
  const [activeExercise, setActiveExercise] = useState<SampleExercise | null>(null)
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Click and drag horizontal scroll handler for desktop mouse users
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
      const walk = (x - startX) * 1.5 // Scroll multiplier
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

  // 1. Fetch categories from database
  useEffect(() => {
    async function loadCategories() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('exercises')
          .select('body_part')

        if (error) throw error
        if (data) {
          const unique = Array.from(
            new Set(data.map((d: any) => d.body_part).filter(Boolean))
          ) as string[]

          // Sort alphabetically
          unique.sort()

          // Capitalize first letter of each category
          const capitalized = unique.map(
            (c) => c.charAt(0).toUpperCase() + c.slice(1)
          )

          setCategories(['Semua', ...capitalized])
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err)
      }
    }
    loadCategories()
  }, [])

  // 2. Fetch exercises dynamically on category or search change
  useEffect(() => {
    async function loadExercises() {
      setLoading(true)
      try {
        const supabase = createClient()
        let query = supabase.from('exercises').select('*')

        if (selectedCategory !== 'Semua') {
          query = query.ilike('body_part', selectedCategory)
        }
        if (search) {
          query = query.ilike('name', `%${search}%`)
        }

        const { data, error } = await query.order('name').limit(8)
        if (error) throw error
        setExercises(data || [])
      } catch (err) {
        console.error('Failed to load exercises:', err)
      } finally {
        setLoading(false)
      }
    }

    const timer = setTimeout(() => {
      loadExercises()
    }, 200)

    return () => clearTimeout(timer)
  }, [search, selectedCategory])

  // Helper to map DB exercise schema to UI schema
  const getMappedExercise = (dbEx: any): SampleExercise => {
    return {
      name: dbEx.name,
      bodyPart: dbEx.body_part || 'Other',
      target: dbEx.target || 'N/A',
      equipment: dbEx.equipment || 'Body Weight',
      instructions: dbEx.instructions || [],
      secondaryMuscles: [],
      description: '',
      gifUrl: dbEx.gif_url || ''
    }
  }

  return (
    <>
      <div
        className="p-6 rounded-xl border space-y-6 w-full text-left"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="space-y-1">
          <h4 className="font-display text-xl font-bold uppercase tracking-wider" style={{ color: 'var(--chalk)' }}>
            Telusuri 1.300+ Gerakan Olahraga
          </h4>
          <p className="font-body text-xs" style={{ color: 'var(--chalk-muted)' }}>
            Klik kartu gerakan untuk melihat deskripsi, otot target, & panduan langkah demi langkah.
          </p>
        </div>

        {/* Filters & Search Row */}
        <div className="space-y-4 w-full">
          {/* Search Input */}
          <div className="w-full">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari gerakan (contoh: Bench, Squat)..."
              className="block w-full py-3 px-4 border rounded-xl focus:outline-none focus:ring-1 focus:ring-[--intensity] text-xs font-body transition-colors"
              style={{
                backgroundColor: 'var(--surface-raised)',
                borderColor: 'var(--border)',
                color: 'var(--chalk)',
              }}
            />
          </div>

          {/* Categories Tab selector (horizontal scrollable) */}
          <div 
            ref={scrollRef}
            className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-none select-none"
            style={{ 
              scrollbarWidth: 'none', 
              WebkitOverflowScrolling: 'touch',
              cursor: 'grab'
            }}
          >
            {categories.map((cat) => {
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
        </div>

        {/* Search Result - Clean 2-column Grid for Mobile */}
        <div className="grid grid-cols-2 gap-3 w-full">
          {loading ? (
            <div className="col-span-full text-center py-12 text-xs font-body" style={{ color: 'var(--chalk-muted)' }}>
              Memuat data gerakan...
            </div>
          ) : exercises.length === 0 ? (
            <div className="col-span-full text-center py-12 text-xs font-body" style={{ color: 'var(--chalk-muted)' }}>
              Gerakan tidak ditemukan.
            </div>
          ) : (
            exercises.map((ex, idx) => {
              const mappedEx = getMappedExercise(ex)
              return (
                <button
                  key={idx}
                  onClick={() => setActiveExercise(mappedEx)}
                  className="p-4 rounded-lg border space-y-2.5 flex flex-col justify-between text-left cursor-pointer transition-all duration-200 group h-full"
                  style={{
                    backgroundColor: 'var(--surface-raised)',
                    borderColor: 'var(--border)',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(232,67,44,0.45)'
                    ;(e.currentTarget as HTMLElement).style.boxShadow = '0 0 16px rgba(232,67,44,0.08)'
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
                    ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
                  }}
                >
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h5 className="font-display text-sm font-bold uppercase tracking-wide group-hover:text-white transition-colors" style={{ color: 'var(--chalk)' }}>
                        {mappedEx.name}
                      </h5>
                    </div>
                  </div>

                  <div className="space-y-2 w-full">
                    <div className="flex flex-col items-start gap-1.5 w-full">
                      <span 
                        className="px-2 py-1 rounded text-[7.5px] uppercase font-bold tracking-wider font-body flex items-center gap-1 bg-[rgba(232,67,44,0.06)] text-[--intensity] w-auto max-w-full truncate"
                        title={mappedEx.target}
                      >
                        <Target className="w-2.5 h-2.5 flex-shrink-0" />
                        <span className="truncate">{mappedEx.target}</span>
                      </span>
                      <span 
                        className="px-2 py-1 rounded text-[7.5px] uppercase font-bold tracking-wider font-body bg-[rgba(237,233,221,0.06)] text-[--chalk-muted] w-auto max-w-full truncate"
                        title={mappedEx.equipment}
                      >
                        {mappedEx.equipment}
                      </span>
                    </div>

                    <span className="text-[9px] font-body block" style={{ color: 'var(--intensity)', opacity: 0.7 }}>
                      Klik untuk detail →
                    </span>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Exercise Detail Modal */}
      {activeExercise && (
        <ExerciseModal exercise={activeExercise} onClose={() => setActiveExercise(null)} />
      )}
    </>
  )
}


// ============================================================
// WIDGET 4: VISUALISASI KONSISTENSI BESI
// ============================================================
export function ConsistencyShowcaseWidget() {
  // Mock data 28 hari terakhir, beberapa hari latihan aktif (true)
  const mockDays = [
    { date: '1', active: false }, { date: '2', active: true }, { date: '3', active: false }, { date: '4', active: true }, { date: '5', active: false }, { date: '6', active: false }, { date: '7', active: false },
    { date: '8', active: true }, { date: '9', active: false }, { date: '10', active: true }, { date: '11', active: false }, { date: '12', active: true }, { date: '13', active: false }, { date: '14', active: false },
    { date: '15', active: true }, { date: '16', active: false }, { date: '17', active: true }, { date: '18', active: false }, { date: '19', active: true }, { date: '20', active: false }, { date: '21', active: false },
    { date: '22', active: true }, { date: '23', active: false }, { date: '24', active: true }, { date: '25', active: false }, { date: '26', active: true }, { date: '27', active: false }, { date: '28', active: true },
  ]

  return (
    <div
      className="p-5 rounded-xl border flex flex-col gap-4 w-full"
      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="space-y-1 text-left">
        <h4 className="font-display text-xl font-bold uppercase tracking-wider" style={{ color: 'var(--chalk)' }}>
          STREAK & CONSISTENCY
        </h4>
        <p className="font-body text-xs" style={{ color: 'var(--chalk-muted)' }}>
          Lihat jejak latihan Anda dalam kontribusi grid 4 minggu. Keep going! Konsistensi adalah kunci hasil terbaik.
        </p>
      </div>

      {/* Grid Display */}
      <div className="flex flex-col items-center gap-2.5 p-4 rounded-xl border" style={{ backgroundColor: 'var(--surface-raised)', borderColor: 'var(--border)' }}>
        <span className="text-[10px] font-bold uppercase tracking-wider opacity-60" style={{ color: 'var(--chalk-muted)' }}>
          CONSISTENCY GRID
        </span>

        {/* Grid Blocks */}
        <div className="grid grid-cols-7 gap-2.5" style={{ width: '196px' }}>
          {mockDays.map((day, idx) => (
            <div
              key={idx}
              className="w-4.5 h-4.5 rounded transition-all duration-150 relative group cursor-pointer hover:scale-110"
              style={{
                backgroundColor: day.active ? 'var(--progress)' : 'rgba(237,233,221,0.04)',
                border: day.active ? '1px solid var(--progress)' : '1px solid var(--border)',
              }}
              title={day.active ? 'Sesi Latihan Gym Selesai' : 'Istirahat'}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// WIDGET 5: SISTEM FAQ PREMIUM (Accordion)
// ============================================================
interface FAQItem {
  q: string
  a: string
}

const FAQ_ITEMS: FAQItem[] = [
  { q: 'Bagaimana aplikasi ini mendeteksi rekor angkatan PR?', a: 'Sistem server-side database akan mencatat setiap set logs latihan Anda. Ketika Anda menyimpan set dengan berat yang melebihi angkatan terberat Anda sebelumnya pada exercise_id tersebut, sistem secara otomatis menandainya sebagai Personal Record (PR) baru.' },
  { q: 'Apakah database 1.300+ gerakan olahraga lengkap dengan deskripsi?', a: 'Ya, database disinkronkan dari data luar yang berisi 1.327 nama latihan lengkap dengan deskripsi instruksi langkah-demi-langkah, badge peralatan, otot target utama, dan GIF demonstrasi gerakan.' },
  { q: 'Berapa kapasitas plan/template yang bisa saya buat?', a: 'Pada versi keanggotaan Free Tier, Anda bisa membuat hingga 3 template rencana latihan (contoh: PPL). Sementara keanggotaan Pro Tier memberikan kebebasan membuat template tak terbatas.' },
  { q: 'Apakah aplikasi ini mendukung mode offline?', a: 'Gym Tracker dirancang dengan Next.js Server Actions yang tersinkron secara real-time ke database Supabase. Versi saat ini membutuhkan koneksi internet agar pencatatan tersimpan aman di cloud.' }
]

export function PremiumFAQWidget() {
  const [openIdx, setOpenIdx] = useState<number | null>(null)
  const answerRefs = useRef<(HTMLDivElement | null)[]>([])

  const toggleFAQ = (idx: number) => {
    const prevIdx = openIdx
    const nextIdx = openIdx === idx ? null : idx
    setOpenIdx(nextIdx)

    // Tutup item yang sebelumnya terbuka
    if (prevIdx !== null) {
      const prevEl = answerRefs.current[prevIdx]
      if (prevEl) {
        // Ambil tinggi pixel aktual sebelum animasi, agar anime punya titik awal yang valid
        const currentHeight = prevEl.offsetHeight
        prevEl.style.height = currentHeight + 'px'
        anime({
          targets: prevEl,
          height: [currentHeight, 0],
          opacity: [1, 0],
          duration: 220,
          easing: 'easeInOutQuad',
        })
      }
    }

    // Buka item baru jika ada
    if (nextIdx !== null) {
      const nextEl = answerRefs.current[nextIdx]
      if (nextEl) {
        // Baca tinggi alami SEBELUM mengubah style apapun
        const naturalHeight = nextEl.scrollHeight
        nextEl.style.height = '0px'
        anime({
          targets: nextEl,
          height: [0, naturalHeight],
          opacity: [0, 1],
          duration: 280,
          easing: 'easeOutQuad',
          complete: () => {
            if (nextEl) nextEl.style.height = 'auto'
          }
        })
      }
    }
  }

  return (
    <div className="max-w-4xl w-full space-y-4 text-left">
      <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
        <HelpCircle className="w-5 h-5 opacity-60" style={{ color: 'var(--chalk-muted)' }} />
        <h4 className="font-display text-xl font-bold uppercase tracking-wider" style={{ color: 'var(--chalk)' }}>
          Pertanyaan Umum (FAQ)
        </h4>
      </div>

      <div className="space-y-3">
        {FAQ_ITEMS.map((item, idx) => {
          const isOpen = openIdx === idx
          return (
            <div
              key={idx}
              className="rounded-xl border overflow-hidden transition-all duration-200"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: isOpen ? 'var(--chalk-muted)' : 'var(--border)',
              }}
            >
              {/* Question Header */}
              <div
                onClick={() => toggleFAQ(idx)}
                className="p-5 flex items-center justify-between cursor-pointer select-none font-display font-bold text-sm tracking-wide"
                style={{ color: 'var(--chalk)' }}
              >
                <span>{item.q}</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  style={{ color: 'var(--chalk-muted)' }}
                />
              </div>

              {/* Answer Content */}
              <div
                ref={(el) => {
                  answerRefs.current[idx] = el
                }}
                className="overflow-hidden opacity-0"
                style={{ height: 0 }}
              >
                <div
                  className="px-5 pb-5 pt-0 text-xs font-body leading-relaxed border-t"
                  style={{ borderColor: 'var(--border)', color: 'var(--chalk-muted)' }}
                >
                  <p className="pt-3">{item.a}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================
// WIDGET 6: STATS COUNT-UP STRIP
// ============================================================
const STATS = [
  { value: 1300, suffix: '+', label: 'Exercise Database', icon: 'database' },
  { value: 50000, suffix: '+', label: 'Workout Logged', icon: 'trending' },
  { value: 97, suffix: '%', label: 'Users beat their PR', icon: 'users' },
  { value: 14, suffix: ' DAYS', label: 'Average Streak', icon: 'flame' },
]

export function StatsCounterWidget() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [started, setStarted] = useState(false)
  const countRefs = useRef<(HTMLSpanElement | null)[]>([])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started) {
          setStarted(true)
          STATS.forEach((stat, i) => {
            const el = countRefs.current[i]
            if (!el) return
            const obj = { val: 0 }
            anime({
              targets: obj,
              val: stat.value,
              duration: 2000,
              easing: 'easeOutExpo',
              update: () => {
                if (stat.icon === 'flame') {
                  el.textContent = Math.floor(obj.val) + stat.suffix;
                } else {
                  el.textContent = Math.floor(obj.val).toLocaleString('id-ID') + stat.suffix;
                }
              },
            })
          })
        }
      },
      { threshold: 0.2 }
    )
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [started])

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'database':
        return <Database className="w-5 h-5" style={{ color: 'var(--intensity)' }} />
      case 'trending':
        return <TrendingUp className="w-5 h-5" style={{ color: 'var(--intensity)' }} />
      case 'users':
        return <Users className="w-5 h-5" style={{ color: 'var(--intensity)' }} />
      case 'flame':
        return <Flame className="w-5 h-5" style={{ color: 'var(--intensity)' }} />
      default:
        return null
    }
  }

  return (
    <div
      ref={containerRef}
      className="w-full border-y py-6"
      style={{ backgroundColor: '#0F0F0F', borderColor: 'var(--border)' }}
    >
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-y-6 md:gap-y-0 divide-x" style={{ borderColor: 'var(--border)' }}>
        {STATS.map((stat, i) => (
          <div key={i} className="flex flex-col items-center gap-2 px-6">
            <div>{renderIcon(stat.icon)}</div>
            <span
              ref={(el) => { countRefs.current[i] = el }}
              className="font-display font-extrabold text-3xl md:text-4xl tracking-wider"
              style={{ color: 'var(--chalk)' }}
            >
              0{stat.suffix}
            </span>
            <span className="font-display text-[10px] text-center uppercase tracking-widest" style={{ color: 'var(--chalk-muted)' }}>
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================
// WIDGET 7: HOW IT WORKS — 3-step flow
// ============================================================
const HOW_STEPS = [
  {
    num: '01',
    title: 'Bikin Paket Latihan',
    desc: 'Rancang template program Anda — PPL, Full Body, Upper/Lower. Pilih gerakan dari database 1.300+ dan susun set & rep target.',
    icon: '📋',
  },
  {
    num: '02',
    title: 'Catat Saat Istirahat',
    desc: 'Tap set saat di gym untuk menandai selesai. Stopwatch rest timer otomatis jalan. Semua tersimpan instan ke cloud.',
    icon: '⚡',
  },
  {
    num: '03',
    title: 'Lihat Progress Nyata',
    desc: 'Dashboard menghitung total volume mingguan, konsistensi harian, dan mendeteksi PR otomatis setiap kali rekor beban ditembus.',
    icon: '📈',
  },
]

export function HowItWorksWidget() {
  return (
    <div className="max-w-4xl w-full space-y-8">
      <div className="space-y-1">
        <h2 className="font-display text-3xl font-extrabold uppercase tracking-wider" style={{ color: 'var(--chalk)' }}>
          Cara Kerjanya
        </h2>
        <p className="font-body text-xs" style={{ color: 'var(--chalk-muted)' }}>
          3 langkah simpel. Tidak perlu tutorial panjang.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {HOW_STEPS.map((step, i) => (
          <div
            key={i}
            className="p-6 rounded-xl border flex flex-col gap-4 relative overflow-hidden group"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            {/* Big number watermark */}
            <span
              className="absolute -top-2 -right-1 font-display font-extrabold text-7xl opacity-[0.04] select-none pointer-events-none"
              style={{ color: 'var(--chalk)' }}
            >
              {step.num}
            </span>

            {/* Icon */}
            <span className="text-3xl">{step.icon}</span>

            {/* Step badge */}
            <div className="space-y-1.5">
              <span
                className="text-[9px] font-bold font-display uppercase tracking-widest"
                style={{ color: 'var(--intensity)' }}
              >
                Langkah {step.num}
              </span>
              <h3 className="font-display text-base font-extrabold uppercase tracking-wide leading-tight" style={{ color: 'var(--chalk)' }}>
                {step.title}
              </h3>
            </div>

            <p className="font-body text-xs leading-relaxed" style={{ color: 'var(--chalk-muted)' }}>
              {step.desc}
            </p>

            {/* Connector line for non-last */}
            {i < HOW_STEPS.length - 1 && (
              <div className="hidden md:block absolute top-1/2 -right-2 w-4 h-px z-10" style={{ backgroundColor: 'var(--border)' }} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================
// WIDGET 8: CLOSING CTA SECTION
// ============================================================
export function ClosingCTAWidget({ href, isLoggedIn }: { href: string; isLoggedIn: boolean }) {
  return (
    <div
      className="w-full rounded-2xl border relative overflow-hidden"
      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      {/* Accent glow blob */}
      <div
        className="absolute -top-16 -right-16 w-64 h-64 rounded-full blur-[80px] opacity-20 pointer-events-none"
        style={{ backgroundColor: 'var(--intensity)' }}
      />
      {/* Top stripe */}
      <div className="h-0.5 w-full" style={{ background: 'linear-gradient(to right, var(--intensity), transparent)' }} />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 p-8 md:p-12">
        <div className="space-y-3 text-left">
          <h2 className="font-display text-3xl md:text-4xl font-extrabold uppercase tracking-wider leading-tight" style={{ color: 'var(--chalk)' }}>
            Sudah siap tembus<br />
            <span style={{ color: 'var(--intensity)' }}>rekor berikutnya?</span>
          </h2>
          <p className="font-body text-xs max-w-sm" style={{ color: 'var(--chalk-muted)' }}>
            {isLoggedIn
              ? 'Dashboard latihan Anda sudah menunggu. Catat sesi berikutnya sekarang.'
              : 'Gratis untuk mulai. Tidak perlu kartu kredit. Mulai catat latihan pertama Anda hari ini.'}
          </p>
        </div>

        <a
          href={href}
          className="flex-shrink-0 inline-flex items-center gap-2 py-4 px-10 rounded-lg text-sm font-bold tracking-wider font-display uppercase transition-transform hover:scale-[1.03] active:scale-[0.98]"
          style={{ backgroundColor: 'var(--intensity)', color: 'var(--chalk)' }}
        >
          {isLoggedIn ? 'Buka Dashboard' : 'Daftar Sekarang'}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </a>
      </div>
    </div>
  )
}
