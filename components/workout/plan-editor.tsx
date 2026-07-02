'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronUp, ChevronDown, Trash2, Plus, X, Search, Dumbbell, Target, Save, ArrowLeft, Loader2 } from 'lucide-react'
import { useTapFeedback } from '@/hooks/use-tap-feedback'
import { savePlanDetailsAction, SaveCategoryInput } from '@/lib/actions/plans'
import { createClient } from '@/lib/supabase/client'
import { SearchableSelect, SelectOption } from '@/components/ui/searchable-select'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

interface ExerciseDetail {
  id: string
  name: string
  body_part: string | null
  target: string | null
  equipment: string | null
  gif_url: string | null
}

interface LocalPlanExercise {
  id: string // Client-side unique temporary ID or database ID
  exercise_id: string
  sort_order: number
  exercises: ExerciseDetail
}

interface LocalCategory {
  id: string // Client-side unique temporary ID or database ID
  category_name: string
  day_of_week: string | null
  plan_exercises: LocalPlanExercise[]
}

function getCleanGifUrl(workoutxGifUrl: string | null): string {
  if (!workoutxGifUrl) return ''
  const parts = workoutxGifUrl.split('/')
  const lastPart = parts[parts.length - 1]
  const id = lastPart.replace('.gif', '').padStart(4, '0')
  return `https://cdn.jsdelivr.net/gh/omercotkd/exercises-gifs@main/assets/${id}.gif`
}

function SafeThumbnail({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-[rgba(255,255,255,0.03)]">
      {/* Spinner/Pulse Loader */}
      {!loaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-[rgba(255,255,255,0.05)] animate-pulse">
          <Loader2 className="w-4 h-4 text-[var(--chalk-muted)] animate-spin" />
        </div>
      )}

      {error ? (
        <Dumbbell className="w-5 h-5 text-gray-500" />
      ) : (
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`w-full h-full object-contain transition-opacity duration-300 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
          loading="lazy"
        />
      )}
    </div>
  )
}
const MUSCLE_TRANSLATIONS: Record<string, string> = {
  'abductors': 'Paha Luar',
  'abs': 'Perut',
  'adductors': 'Paha Dalam',
  'biceps': 'Bisep',
  'calves': 'Betis',
  'cardiovascular system': 'Kardio (Jantung)',
  'delts': 'Bahu (Deltoids)',
  'forearms': 'Lengan Bawah',
  'glutes': 'Pantat (Glutes)',
  'hamstrings': 'Paha Belakang',
  'lats': 'Punggung Samping (Lats)',
  'levator scapulae': 'Leher Atas',
  'pectorals': 'Dada (Chest)',
  'quads': 'Paha Depan (Quads)',
  'quadriceps': 'Paha Depan (Quads)',
  'serratus anterior': 'Dada Samping',
  'spine': 'Tulang Belakang',
  'trapezius': 'Pundak Atas (Traps)',
  'traps': 'Pundak Atas (Traps)',
  'triceps': 'Trisep',
  'upper back': 'Punggung Atas'
}

const EQUIPMENT_TRANSLATIONS: Record<string, string> = {
  'assisted': 'Dibantu Alat',
  'assisted (towel)': 'Dibantu Alat (Handuk)',
  'band': 'Tali Resistance',
  'barbell': 'Barbell',
  'body weight': 'Berat Badan',
  'body weight (with resistance band)': 'Berat Badan & Tali',
  'bosu ball': 'Bola Bosu',
  'cable': 'Katrol (Cable)',
  'dumbbell': 'Dumbbell',
  'dumbbell (used as handles for deeper range)': 'Dumbbell (Pegang)',
  'dumbbell, exercise ball': 'Dumbbell & Bola',
  'dumbbell, exercise ball, tennis ball': 'Dumbbell, Bola & Tenis',
  'elliptical machine': 'Mesin Eliptikal',
  'ez barbell': 'Barbell EZ',
  'ez barbell, exercise ball': 'Barbell EZ & Bola',
  'hammer': 'Palu (Hammer)',
  'kettlebell': 'Kettlebell',
  'leverage machine': 'Mesin Leverage',
  'medicine ball': 'Bola Medicine',
  'olympic barbell': 'Barbell Olimpiade',
  'resistance band': 'Karet Resistance',
  'roller': 'Roller Busa',
  'rope': 'Tali (Rope)',
  'skierg machine': 'Mesin SkiErg',
  'sled machine': 'Mesin Sled',
  'smith machine': 'Smith Machine',
  'stability ball': 'Bola Stabilitas',
  'stationary bike': 'Sepeda Statis',
  'stepmill machine': 'Mesin Stepmill',
  'tire': 'Ban (Tire)',
  'trap bar': 'Trap Bar',
  'upper body ergometer': 'Ergometer Tubuh Atas',
  'weighted': 'Beban Tambahan',
  'wheel roller': 'Roda Ab Roller'
}

function getMuscleIndoName(eng: string | null): string {
  if (!eng) return ''
  const clean = eng.toLowerCase().trim()
  return MUSCLE_TRANSLATIONS[clean] ? `${eng} (${MUSCLE_TRANSLATIONS[clean]})` : eng
}

function getEquipmentIndoName(eng: string | null): string {
  if (!eng) return ''
  const clean = eng.toLowerCase().trim()
  return EQUIPMENT_TRANSLATIONS[clean] ? `${eng} (${EQUIPMENT_TRANSLATIONS[clean]})` : eng
}

function getMuscleBadgeLabel(eng: string | null): string {
  if (!eng) return ''
  const clean = eng.toLowerCase().trim()
  return MUSCLE_TRANSLATIONS[clean] || eng
}

function getEquipmentBadgeLabel(eng: string | null): string {
  if (!eng) return ''
  const clean = eng.toLowerCase().trim()
  return EQUIPMENT_TRANSLATIONS[clean] || eng
}
interface SearchFilters {
  bodyPart?: string
  target?: string
  equipment?: string
  nameText?: string
}

function parseIndonesianQuery(query: string): SearchFilters {
  const normalized = query.toLowerCase().trim()
  const filters: SearchFilters = {}
  let remainingText = normalized

  // 1. Map Muscle Groups / Body Parts
  const muscleMap: { keys: string[]; bodyPart?: string; target?: string }[] = [
    { keys: ['dada', 'pectoral', 'pecs', 'chest'], bodyPart: 'chest', target: 'pectorals' },
    { keys: ['bahu', 'shoulder', 'deltoid', 'delts'], bodyPart: 'shoulders', target: 'delts' },
    { keys: ['lengan', 'tangan', 'arm', 'arms'], bodyPart: 'upper arms' },
    { keys: ['bicep', 'bisep'], bodyPart: 'upper arms', target: 'biceps' },
    { keys: ['tricep', 'trisep'], bodyPart: 'upper arms', target: 'triceps' },
    { keys: ['punggung', 'sayap', 'back', 'lat', 'lats'], bodyPart: 'back' },
    { keys: ['paha depan', 'quads', 'quad', 'quadriceps'], bodyPart: 'upper legs', target: 'quads' },
    { keys: ['paha belakang', 'hamstring', 'hamstrings'], bodyPart: 'upper legs', target: 'hamstrings' },
    { keys: ['paha', 'kaki', 'leg', 'legs'], bodyPart: 'upper legs' },
    { keys: ['pantat', 'pantad', 'bokong', 'glute', 'glutes'], bodyPart: 'upper legs', target: 'glutes' },
    { keys: ['betis', 'calf', 'calves'], bodyPart: 'lower legs', target: 'calves' },
    { keys: ['perut', 'abs', 'abdominals'], bodyPart: 'waist', target: 'abs' },
    { keys: ['cardio', 'kardio', 'jantung', 'lari'], bodyPart: 'cardio', target: 'cardiovascular system' },
    { keys: ['pundak', 'traps', 'trap', 'trapezius'], bodyPart: 'back', target: 'traps' },
  ]

  for (const item of muscleMap) {
    for (const key of item.keys) {
      if (normalized.includes(key)) {
        if (item.bodyPart) filters.bodyPart = item.bodyPart
        if (item.target) filters.target = item.target
        remainingText = remainingText.replace(key, '').trim()
        break
      }
    }
  }

  // 2. Map Equipment
  const equipmentMap: { keys: string[]; value: string }[] = [
    { keys: ['dumbbell', 'dumbel', 'dombel', 'db'], value: 'dumbbell' },
    { keys: ['barbell', 'barbel', 'bb'], value: 'barbell' },
    { keys: ['cable', 'kabel', 'katrol'], value: 'cable' },
    { keys: ['machine', 'mesin', 'alat'], value: 'machine' },
    { keys: ['bodyweight', 'berat badan', 'tanpa alat', 'lantai', 'push up', 'sit up', 'pull up'], value: 'body weight' },
    { keys: ['band', 'karet', 'resistance'], value: 'band' },
    { keys: ['kettlebell', 'ketel'], value: 'kettlebell' },
    { keys: ['plate', 'lempengan'], value: 'plate' },
  ]

  for (const item of equipmentMap) {
    for (const key of item.keys) {
      if (normalized.includes(key)) {
        filters.equipment = item.value
        remainingText = remainingText.replace(key, '').trim()
        break
      }
    }
  }

  filters.nameText = remainingText.replace(/\s+/g, ' ').trim()
  return filters
}

interface PlanEditorProps {
  plan: {
    id: string
    name: string
  }
  initialCategories: LocalCategory[]
}

const DAYS_OF_WEEK_OPTIONS: SelectOption[] = [
  { value: 'none', label: '(Tanpa Hari)' },
  { value: 'senin', label: 'Senin' },
  { value: 'selasa', label: 'Selasa' },
  { value: 'rabu', label: 'Rabu' },
  { value: 'kamis', label: 'Kamis' },
  { value: 'jumat', label: 'Jumat' },
  { value: 'sabtu', label: 'Sabtu' },
  { value: 'minggu', label: 'Minggu' },
]

export function PlanEditor({ plan, initialCategories }: PlanEditorProps) {
  const router = useRouter()
  const supabase = createClient()

  // State Utama
  const [planName, setPlanName] = useState(plan.name)
  const [categories, setCategories] = useState<LocalCategory[]>(initialCategories)
  
  // State Modal Cari Exercise
  const [isCatalogOpen, setIsCatalogOpen] = useState(false)
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ExerciseDetail[]>([])
  const [searching, setSearching] = useState(false)
  const [expandedGifId, setExpandedGifId] = useState<string | null>(null)
  const [selectedMuscle, setSelectedMuscle] = useState('all')
  const [selectedEquipment, setSelectedEquipment] = useState('all')
  const [zoomExercise, setZoomExercise] = useState<ExerciseDetail | null>(null)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [catIdToDelete, setCatIdToDelete] = useState<string | null>(null)
  
  // State Dynamic Filter Metadata from DB
  const [availableTargets, setAvailableTargets] = useState<string[]>([])
  const [availableEquipments, setAvailableEquipments] = useState<string[]>([])

  useEffect(() => {
    async function loadFilterMetadata() {
      try {
        const { data, error } = await supabase
          .from('exercises')
          .select('target, equipment')

        if (!error && data) {
          const targets = Array.from(new Set(data.map(r => r.target).filter(Boolean))) as string[]
          const equipments = Array.from(new Set(data.map(r => r.equipment).filter(Boolean))) as string[]

          targets.sort()
          equipments.sort()

          setAvailableTargets(targets)
          setAvailableEquipments(equipments)
        }
      } catch (err) {
        console.error('Error loading dynamic filters:', err)
      }
    }
    loadFilterMetadata()
  }, [])

  const { ref: saveBtnRef, onPointerDown: saveBtnDown } = useTapFeedback()

  // --- KELOLA KATEGORI ---
  const addCategory = () => {
    const tempId = `temp-cat-${Date.now()}`
    const newCat: LocalCategory = {
      id: tempId,
      category_name: 'Kategori Latihan Baru',
      day_of_week: null,
      plan_exercises: [],
    }
    setCategories([...categories, newCat])
  }

  const deleteCategory = (catId: string) => {
    setCatIdToDelete(catId)
  }

  const confirmDeleteCategory = () => {
    if (!catIdToDelete) return
    setCategories(categories.filter((cat) => cat.id !== catIdToDelete))
    setCatIdToDelete(null)
  }

  const updateCategoryName = (catId: string, name: string) => {
    setCategories(
      categories.map((cat) =>
        cat.id === catId ? { ...cat, category_name: name } : cat
      )
    )
  }

  const updateCategoryDay = (catId: string, day: string | null) => {
    setCategories(
      categories.map((cat) =>
        cat.id === catId ? { ...cat, day_of_week: day } : cat
      )
    )
  }

  // --- KELOLA EXERCISES / SORTING ---
  const removeExercise = (catId: string, exerciseId: string) => {
    setCategories(
      categories.map((cat) => {
        if (cat.id !== catId) return cat
        const updated = cat.plan_exercises.filter((ex) => ex.id !== exerciseId)
        // Re-index sort order
        return {
          ...cat,
          plan_exercises: updated.map((ex, index) => ({ ...ex, sort_order: index })),
        }
      })
    )
  }

  const moveExercise = (catId: string, index: number, direction: 'up' | 'down') => {
    setCategories(
      categories.map((cat) => {
        if (cat.id !== catId) return cat
        
        const list = [...cat.plan_exercises]
        const targetIndex = direction === 'up' ? index - 1 : index + 1
        
        // Cek boundary
        if (targetIndex < 0 || targetIndex >= list.length) return cat
        
        // Swap elements
        const temp = list[index]
        list[index] = list[targetIndex]
        list[targetIndex] = temp
        
        // Reassign sort orders
        const updated = list.map((item, idx) => ({
          ...item,
          sort_order: idx,
        }))
        
        return {
          ...cat,
          plan_exercises: updated,
        }
      })
    )
  }

  // --- MODAL CARI EXERCISE ---
  const openCatalog = (catId: string) => {
    setActiveCategoryId(catId)
    setSearchQuery('')
    setSelectedMuscle('all')
    setSelectedEquipment('all')
    setSearchResults([])
    setExpandedGifId(null)
    setIsCatalogOpen(true)
    
    // Load initial popular exercises immediately
    searchExercises('', 'all', 'all')
  }

  const searchExercises = async (query: string, muscle: string = 'all', eq: string = 'all') => {
    setSearching(true)
    try {
      let q = supabase
        .from('exercises')
        .select('id, name, body_part, target, equipment, gif_url')

      const conditions: string[] = []

      // 1. Text Search (if provided)
      if (query.trim().length >= 2) {
        const searchFilters = parseIndonesianQuery(query)
        const orConditions: string[] = []
        
        // Match query string in name
        orConditions.push(`name.ilike.%${query.trim()}%`)

        // Match translated Indonesian query terms
        if (searchFilters.target) {
          orConditions.push(`target.ilike.%${searchFilters.target}%`)
        } else if (searchFilters.bodyPart) {
          orConditions.push(`body_part.ilike.%${searchFilters.bodyPart}%`)
        }

        q = q.or(orConditions.join(','))

        // If Indonesian query maps to equipment
        if (searchFilters.equipment) {
          q = q.ilike('equipment', searchFilters.equipment)
        }
      }

      // 2. Select2 Muscle Filter
      if (muscle !== 'all') {
        q = q.ilike('target', muscle)
      }

      // 3. Select2 Equipment Filter
      if (eq !== 'all') {
        q = q.ilike('equipment', eq)
      }

      const { data, error } = await q.limit(30)

      if (!error && data) {
        setSearchResults(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSearching(false)
    }
  }

  const addExerciseToCategory = (exercise: ExerciseDetail) => {
    if (!activeCategoryId) return

    setCategories(
      categories.map((cat) => {
        if (cat.id !== activeCategoryId) return cat

        // Cek duplikasi gerakan di kategori yang sama
        if (cat.plan_exercises.some((ex) => ex.exercise_id === exercise.id)) {
          alert('Gerakan ini sudah ada di kategori ini.')
          return cat
        }

        const newEx: LocalPlanExercise = {
          id: `temp-ex-${Date.now()}`,
          exercise_id: exercise.id,
          sort_order: cat.plan_exercises.length,
          exercises: exercise,
        }

        return {
          ...cat,
          plan_exercises: [...cat.plan_exercises, newEx],
        }
      })
    )

    // Tutup katalog setelah menambahkan
    setIsCatalogOpen(false)
  }

  // --- SAVE ACTION ---
  const handleSave = async () => {
    if (!planName.trim()) return

    setSaving(true)
    setError(null)

    // Format data ke format server action
    const formattedCategories: SaveCategoryInput[] = categories.map((cat) => ({
      category_name: cat.category_name,
      day_of_week: cat.day_of_week,
      exercises: cat.plan_exercises.map((ex) => ({
        exercise_id: ex.exercise_id,
        sort_order: ex.sort_order,
      })),
    }))

    try {
      await savePlanDetailsAction(plan.id, planName, formattedCategories)
      router.push('/workout')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan perubahan.')
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Navigation & Action Buttons */}
      <div className="space-y-4 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <Link
            href="/workout"
            className="p-2 rounded-xl border hover:bg-[--surface-raised] transition-colors flex-shrink-0"
            style={{ borderColor: 'var(--border)', color: 'var(--chalk-muted)' }}
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              className="text-2xl font-display font-extrabold uppercase tracking-wide bg-transparent border-b border-transparent hover:border-[--border] focus:border-[--chalk-muted] focus:outline-none py-1 px-2 transition-colors rounded w-full"
              style={{ color: 'var(--chalk)' }}
              placeholder="NAMA TEMPLATE"
            />
          </div>
        </div>

        <button
          ref={saveBtnRef}
          onPointerDown={saveBtnDown}
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-xs font-bold tracking-wider font-display uppercase cursor-pointer disabled:opacity-50 transition-all active:scale-[0.98]"
          style={{
            backgroundColor: 'var(--intensity)',
            backgroundImage: 'linear-gradient(135deg, var(--intensity), #ff5a3d)',
            color: 'var(--chalk)',
          }}
        >
          <Save className="w-3.5 h-3.5" />
          {saving ? 'Menyimpan...' : 'Simpan Rencana'}
        </button>
      </div>

      {error && (
        <div
          className="p-4 rounded-lg text-sm border font-body"
          style={{
            backgroundColor: 'rgba(232, 67, 44, 0.1)',
            borderColor: 'var(--intensity)',
            color: 'var(--intensity)',
          }}
        >
          {error}
        </div>
      )}

      {/* Editor Body */}
      <div className="space-y-6">
        {categories.map((cat, catIdx) => (
          <div
            key={cat.id}
            className="p-6 rounded-xl border space-y-4"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)',
            }}
          >
            {/* Category Header */}
            <div className="space-y-3.5 pb-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
              {/* Row 1: Number Badge, Input Name, and Delete Button */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="font-display text-xs font-extrabold px-2.5 py-1 rounded-lg flex-shrink-0 text-white/50" style={{ backgroundColor: 'var(--surface-raised)', border: '1px solid var(--border)' }}>
                    #{catIdx + 1}
                  </span>
                  <input
                    type="text"
                    value={cat.category_name}
                    onChange={(e) => updateCategoryName(cat.id, e.target.value)}
                    className="font-display text-lg font-bold uppercase tracking-wide bg-transparent border-b border-transparent hover:border-[--border] focus:border-[--chalk-muted] focus:outline-none py-0.5 px-1.5 transition-colors rounded w-full text-white min-w-0"
                    placeholder="Nama Kategori (misal: Chest & Triceps)"
                  />
                </div>
                
                {/* Delete Category Button */}
                <button
                  onClick={() => deleteCategory(cat.id)}
                  className="p-2 rounded-xl border cursor-pointer hover:bg-[--surface-raised] transition-colors flex-shrink-0"
                  style={{ borderColor: 'var(--border)', color: 'var(--intensity)' }}
                  title="Hapus Kategori"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Row 2: Day of Week Selection - Premium Interactive Pills */}
              <div className="flex flex-col gap-1.5 pt-0.5">
                <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--chalk-muted)' }}>
                  Jadwal Latihan
                </span>
                <div className="flex flex-wrap gap-1">
                  {[
                    { value: 'senin', label: 'Sen' },
                    { value: 'selasa', label: 'Sel' },
                    { value: 'rabu', label: 'Rab' },
                    { value: 'kamis', label: 'Kam' },
                    { value: 'jumat', label: 'Jum' },
                    { value: 'sabtu', label: 'Sab' },
                    { value: 'minggu', label: 'Min' },
                  ].map((d) => {
                    const isSelected = cat.day_of_week === d.value
                    return (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => updateCategoryDay(cat.id, isSelected ? null : d.value)}
                        className={`px-2 py-1 rounded-lg text-[9px] font-extrabold font-display uppercase tracking-wider cursor-pointer transition-all active:scale-95 ${
                          isSelected
                            ? 'text-white'
                            : 'text-[var(--chalk-muted)] border border-[var(--border)] hover:bg-[var(--surface-raised)]'
                        }`}
                        style={{
                          backgroundColor: isSelected ? 'var(--intensity)' : 'var(--surface-raised)',
                          backgroundImage: isSelected ? 'linear-gradient(135deg, var(--intensity), #ff5a3d)' : 'none',
                        }}
                      >
                        {d.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Exercises List inside Category */}
            {cat.plan_exercises.length === 0 ? (
              <div className="py-8 text-center border-2 border-dashed rounded-lg" style={{ borderColor: 'var(--border)' }}>
                <p className="text-xs font-body" style={{ color: 'var(--chalk-muted)' }}>
                  Belum ada gerakan latihan ditambahkan.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {cat.plan_exercises.map((ex, exIdx) => (
                  <div
                    key={ex.id}
                    className="p-3 rounded-lg border flex items-center justify-between gap-3"
                    style={{
                      backgroundColor: 'var(--surface-raised)',
                      borderColor: 'var(--border)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-numeric text-xs font-semibold opacity-40">{exIdx + 1}</span>
                      <div>
                        <p className="text-sm font-semibold font-body" style={{ color: 'var(--chalk)' }}>
                          {ex.exercises.name}
                        </p>
                        <div className="flex gap-1.5 pt-0.5">
                          {ex.exercises.body_part && (
                            <span className="text-[9px] uppercase font-bold tracking-wider" style={{ color: 'var(--chalk-muted)' }}>
                              {ex.exercises.body_part}
                            </span>
                          )}
                          {ex.exercises.equipment && (
                            <span className="text-[9px] uppercase font-bold tracking-wider opacity-60" style={{ color: 'var(--chalk-muted)' }}>
                              • {ex.exercises.equipment}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Sorting & Delete Actions */}
                    <div className="flex items-center gap-1.5">
                      {/* Arrow Up */}
                      <button
                        disabled={exIdx === 0}
                        onClick={() => moveExercise(cat.id, exIdx, 'up')}
                        className="p-1 rounded hover:bg-[--surface] transition-colors disabled:opacity-30 cursor-pointer"
                        style={{ color: 'var(--chalk-muted)' }}
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      
                      {/* Arrow Down */}
                      <button
                        disabled={exIdx === cat.plan_exercises.length - 1}
                        onClick={() => moveExercise(cat.id, exIdx, 'down')}
                        className="p-1 rounded hover:bg-[--surface] transition-colors disabled:opacity-30 cursor-pointer"
                        style={{ color: 'var(--chalk-muted)' }}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>

                      {/* Remove Exercise */}
                      <button
                        onClick={() => removeExercise(cat.id, ex.id)}
                        className="p-1 rounded hover:bg-[--surface] transition-colors cursor-pointer ml-1"
                        style={{ color: 'var(--intensity)' }}
                        title="Hapus Gerakan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Exercise Trigger Button */}
            <button
              onClick={() => openCatalog(cat.id)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 border-dashed text-xs font-bold font-display uppercase tracking-wider cursor-pointer hover:bg-[--surface-raised] transition-colors"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--chalk-muted)',
              }}
            >
              <Plus className="w-4 h-4" />
              Tambah Gerakan Latihan
            </button>
          </div>
        ))}

        {/* Add Category Trigger Button */}
        <button
          onClick={addCategory}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-lg border-2 border-dashed text-xs font-bold font-display uppercase tracking-wider cursor-pointer hover:bg-[--surface] transition-colors"
          style={{
            borderColor: 'var(--border)',
            color: 'var(--chalk)',
          }}
        >
          <Plus className="w-4 h-4" />
          Tambah Hari / Kategori Latihan
        </button>
      </div>

      {/* EXERCISE CATALOG MODAL */}
      {isCatalogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div
            className="w-full max-w-[390px] p-6 rounded-xl border space-y-4 relative animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85dvh]"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)',
            }}
          >
            {/* Close */}
            <button
              onClick={() => setIsCatalogOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-xs cursor-pointer hover:bg-[--surface-raised]"
              style={{ color: 'var(--chalk-muted)' }}
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div>
              <h3 className="font-display text-2xl font-bold uppercase tracking-wider" style={{ color: 'var(--chalk)' }}>
                Katalog Gerakan Latihan
              </h3>
              <p className="font-body text-[11px]" style={{ color: 'var(--chalk-muted)' }}>
                Cari dan tambahkan gerakan dari 1.327 database catalog WorkoutX.
              </p>
            </div>

            {/* Search Box */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4" style={{ color: 'var(--chalk-muted)' }} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  searchExercises(e.target.value, selectedMuscle, selectedEquipment)
                }}
                placeholder="Cari gerakan... (min 2 karakter)"
                className="block w-full pl-10 pr-3 py-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[--chalk-muted] text-sm font-body"
                style={{
                  backgroundColor: 'var(--surface-raised)',
                  borderColor: 'var(--border)',
                  color: 'var(--chalk)',
                }}
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('')
                    searchExercises('', selectedMuscle, selectedEquipment)
                    setExpandedGifId(null)
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-[var(--chalk-muted)] hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Select2 Muscle and Equipment Dropdowns */}
            <div className="grid grid-cols-2 gap-2 pb-1">
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-wider text-[var(--chalk-muted)]">
                  Target Otot
                </label>
                <SearchableSelect
                  options={[
                    { value: 'all', label: 'Semua Otot' },
                    ...availableTargets.map((t) => ({
                      value: t,
                      label: getMuscleIndoName(t),
                    }))
                  ]}
                  value={selectedMuscle}
                  onChange={(val) => {
                    setSelectedMuscle(val)
                    searchExercises(searchQuery, val, selectedEquipment)
                  }}
                  placeholder="Semua Otot"
                  searchPlaceholder="Cari otot..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-wider text-[var(--chalk-muted)]">
                  Peralatan
                </label>
                <SearchableSelect
                  options={[
                    { value: 'all', label: 'Semua Alat' },
                    ...availableEquipments.map((eq) => ({
                      value: eq,
                      label: getEquipmentIndoName(eq),
                    }))
                  ]}
                  value={selectedEquipment}
                  onChange={(val) => {
                    setSelectedEquipment(val)
                    searchExercises(searchQuery, selectedMuscle, val)
                  }}
                  placeholder="Semua Alat"
                  searchPlaceholder="Cari alat..."
                />
              </div>
            </div>

            {/* Results Container */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-2 min-h-[250px] max-h-[350px]">
              {searching ? (
                <div className="py-8 text-center text-xs font-body" style={{ color: 'var(--chalk-muted)' }}>
                  Mencari gerakan...
                </div>
              ) : searchResults.length === 0 ? (
                <div className="py-8 text-center text-xs font-body animate-pulse" style={{ color: 'var(--chalk-muted)' }}>
                  Tidak ada hasil gerakan yang cocok. Cari nama gerakan lain, atau ubah filter kategori di atas.
                </div>
              ) : (
                searchResults.map((ex) => (
                  <div
                    key={ex.id}
                    className="p-2.5 rounded-xl border flex items-center gap-3 hover:bg-[--surface-raised] transition-colors"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    {/* Left: Tiny GIF Thumbnail Preview directly visible (Click to Zoom) */}
                    <button 
                      type="button"
                      onClick={() => setZoomExercise(ex)}
                      title="Ketuk untuk perbesar"
                      className="w-12 h-12 rounded-lg overflow-hidden bg-white flex items-center justify-center flex-shrink-0 border cursor-pointer hover:scale-105 active:scale-95 transition-all"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      <SafeThumbnail src={getCleanGifUrl(ex.gif_url)} alt={ex.name} />
                    </button>

                    {/* Middle: Name and Badges */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold font-body text-white truncate leading-snug" title={ex.name}>
                        {ex.name}
                      </p>
                      <div className="flex flex-wrap gap-1 pt-1.5">
                        {ex.body_part && (
                          <span
                            className="px-1.5 py-0.5 rounded text-[7px] uppercase font-bold tracking-wider font-body"
                            style={{ backgroundColor: 'var(--surface-raised)', color: 'var(--chalk-muted)' }}
                          >
                            {ex.body_part}
                          </span>
                        )}
                        {ex.target && (
                          <span
                            className="px-1.5 py-0.5 rounded text-[7px] uppercase font-bold tracking-wider font-body flex items-center gap-0.5"
                            style={{ backgroundColor: 'rgba(232, 67, 44, 0.08)', color: 'var(--intensity)' }}
                          >
                            <Target className="w-2 h-2" />
                            {getMuscleBadgeLabel(ex.target)}
                          </span>
                        )}
                        {ex.equipment && (
                          <span className="text-[8px] font-body opacity-60 flex items-center gap-0.5 text-[var(--chalk-muted)]">
                            <Dumbbell className="w-2.5 h-2.5" />
                            {getEquipmentBadgeLabel(ex.equipment)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Pilih Button */}
                    <button
                      onClick={() => addExerciseToCategory(ex)}
                      className="py-1.5 px-3 rounded-lg text-[9px] font-bold font-display uppercase tracking-wider cursor-pointer flex-shrink-0 text-white"
                      style={{
                        backgroundColor: 'var(--intensity)',
                        backgroundImage: 'linear-gradient(135deg, var(--intensity), #ff5a3d)',
                      }}
                    >
                      Pilih
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end border-t pt-2" style={{ borderColor: 'var(--border)' }}>
              <button
                type="button"
                onClick={() => setIsCatalogOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold font-body cursor-pointer"
                style={{ color: 'var(--chalk-muted)' }}
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reusable Category Delete Dialog */}
      <ConfirmDialog
        isOpen={catIdToDelete !== null}
        onClose={() => setCatIdToDelete(null)}
        onConfirm={confirmDeleteCategory}
        title="Hapus Kategori?"
        description="Apakah Anda yakin ingin menghapus kategori ini beserta seluruh gerakan latihan di dalamnya?"
        type="danger"
        confirmText="Ya, Hapus"
        cancelText="Batal"
      />

      {/* Lightbox / Zoom Exercise GIF Preview Modal */}
      {zoomExercise && (
        <>
          <div
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setZoomExercise(null)}
          />
          <div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-[90%] max-w-[340px] rounded-3xl p-5 flex flex-col items-center gap-4 animate-in zoom-in-95 duration-200"
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border-strong)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            }}
          >
            <div className="w-full flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--intensity)] font-display">
                Preview Gerakan
              </span>
              <button
                type="button"
                onClick={() => setZoomExercise(null)}
                className="p-1 rounded-full hover:bg-[--surface-raised] text-[var(--chalk-muted)] hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div
              className="w-full aspect-square rounded-2xl bg-white overflow-hidden border flex items-center justify-center p-2"
              style={{ borderColor: 'var(--border)' }}
            >
              <img
                src={getCleanGifUrl(zoomExercise.gif_url)}
                alt={zoomExercise.name}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="w-full text-center space-y-1">
              <h4 className="font-display font-bold text-sm text-white leading-snug">
                {zoomExercise.name}
              </h4>
              <div className="flex flex-wrap justify-center gap-1.5 pt-1">
                {zoomExercise.body_part && (
                  <span className="px-1.5 py-0.5 rounded text-[8px] uppercase font-bold tracking-wider font-body bg-[--surface-raised] text-[--chalk-muted]">
                    {zoomExercise.body_part}
                  </span>
                )}
                {zoomExercise.target && (
                  <span className="px-1.5 py-0.5 rounded text-[8px] uppercase font-bold tracking-wider font-body bg-[rgba(232,67,44,0.08)] text-[--intensity]">
                    {getMuscleBadgeLabel(zoomExercise.target)}
                  </span>
                )}
                {zoomExercise.equipment && (
                  <span className="px-1.5 py-0.5 rounded text-[8px] uppercase font-bold tracking-wider font-body bg-[--surface-raised] text-[--chalk-muted]">
                    {getEquipmentBadgeLabel(zoomExercise.equipment)}
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setZoomExercise(null)}
              className="w-full py-2.5 rounded-xl text-xs font-bold font-display uppercase tracking-wider cursor-pointer transition-all active:scale-[0.98] text-white"
              style={{
                backgroundColor: 'var(--surface-raised)',
                border: '1px solid var(--border)',
              }}
            >
              Tutup
            </button>
          </div>
        </>
      )}
    </div>
  )
}
