'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronUp, ChevronDown, Trash2, Plus, X, Search, Dumbbell, Target, Save, ArrowLeft } from 'lucide-react'
import { useTapFeedback } from '@/hooks/use-tap-feedback'
import { savePlanDetailsAction, SaveCategoryInput } from '@/lib/actions/plans'
import { createClient } from '@/lib/supabase/client'

interface ExerciseDetail {
  id: string
  name: string
  body_part: string | null
  target: string | null
  equipment: string | null
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

interface PlanEditorProps {
  plan: {
    id: string
    name: string
  }
  initialCategories: LocalCategory[]
}

const DAYS_OF_WEEK = [
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

  // State Save
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    if (!confirm('Hapus kategori ini beserta semua latihan di dalamnya?')) return
    setCategories(categories.filter((cat) => cat.id !== catId))
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
    setSearchResults([])
    setIsCatalogOpen(true)
  }

  const searchExercises = async (query: string) => {
    setSearchQuery(query)
    if (query.trim().length < 2) {
      setSearchResults([])
      return
    }
    
    setSearching(true)
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('id, name, body_part, target, equipment')
        .ilike('name', `%${query}%`)
        .limit(15)

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <Link
            href="/workout"
            className="p-2 rounded-lg border hover:bg-[--surface-raised] transition-colors"
            style={{ borderColor: 'var(--border)', color: 'var(--chalk-muted)' }}
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex-1">
            <input
              type="text"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              className="text-3xl font-display font-bold uppercase tracking-wider bg-transparent border-b border-transparent hover:border-[--border] focus:border-[--chalk-muted] focus:outline-none py-1 px-2 transition-colors rounded max-w-md w-full"
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
          className="flex items-center justify-center gap-2 py-3 px-6 rounded-lg text-xs font-bold tracking-wider font-display uppercase cursor-pointer disabled:opacity-50"
          style={{
            backgroundColor: 'var(--intensity)',
            color: 'var(--chalk)',
          }}
        >
          <Save className="w-4 h-4" />
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-3 flex-1">
                <span className="font-display text-sm font-bold opacity-30">#{catIdx + 1}</span>
                <input
                  type="text"
                  value={cat.category_name}
                  onChange={(e) => updateCategoryName(cat.id, e.target.value)}
                  className="font-display text-xl font-bold uppercase tracking-wide bg-transparent border-b border-transparent hover:border-[--border] focus:border-[--chalk-muted] focus:outline-none py-0.5 px-1.5 transition-colors rounded w-full max-w-xs"
                  style={{ color: 'var(--chalk)' }}
                  placeholder="Kategori Otot"
                />
                
                {/* Select Day */}
                <select
                  value={cat.day_of_week || ''}
                  onChange={(e) => updateCategoryDay(cat.id, e.target.value || null)}
                  className="py-1 px-2 text-xs border rounded-lg focus:outline-none font-body"
                  style={{
                    backgroundColor: 'var(--surface-raised)',
                    borderColor: 'var(--border)',
                    color: 'var(--chalk-muted)',
                  }}
                >
                  <option value="">(Tanpa Hari)</option>
                  {DAYS_OF_WEEK.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Delete Category Button */}
              <button
                onClick={() => deleteCategory(cat.id)}
                className="p-1.5 rounded-lg border cursor-pointer hover:bg-[--surface-raised] transition-colors"
                style={{ borderColor: 'var(--border)', color: 'var(--intensity)' }}
                title="Hapus Kategori"
              >
                <Trash2 className="w-4 h-4" />
              </button>
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
                onChange={(e) => searchExercises(e.target.value)}
                placeholder="Cari gerakan... (min 2 karakter)"
                className="block w-full pl-10 pr-3 py-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[--chalk-muted] text-sm font-body"
                style={{
                  backgroundColor: 'var(--surface-raised)',
                  borderColor: 'var(--border)',
                  color: 'var(--chalk)',
                }}
                autoFocus
              />
            </div>

            {/* Results Container */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-2 min-h-[250px] max-h-[350px]">
              {searching ? (
                <div className="py-8 text-center text-xs font-body" style={{ color: 'var(--chalk-muted)' }}>
                  Mencari gerakan...
                </div>
              ) : searchResults.length === 0 ? (
                <div className="py-8 text-center text-xs font-body" style={{ color: 'var(--chalk-muted)' }}>
                  {searchQuery.trim().length < 2
                    ? 'Ketik minimal 2 karakter untuk memulai pencarian.'
                    : 'Tidak ada hasil gerakan yang cocok.'}
                </div>
              ) : (
                searchResults.map((ex) => (
                  <div
                    key={ex.id}
                    className="p-3 rounded-lg border flex items-center justify-between gap-3 hover:bg-[--surface-raised] transition-colors"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <div>
                      <p className="text-sm font-bold font-body" style={{ color: 'var(--chalk)' }}>
                        {ex.name}
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {ex.body_part && (
                          <span
                            className="px-2 py-0.5 rounded text-[8px] uppercase font-bold tracking-wider font-body"
                            style={{ backgroundColor: 'var(--surface-raised)', color: 'var(--chalk-muted)' }}
                          >
                            {ex.body_part}
                          </span>
                        )}
                        {ex.target && (
                          <span
                            className="px-2 py-0.5 rounded text-[8px] uppercase font-bold tracking-wider font-body flex items-center gap-0.5"
                            style={{ backgroundColor: 'rgba(232, 67, 44, 0.1)', color: 'var(--intensity)' }}
                          >
                            <Target className="w-2.5 h-2.5" />
                            {ex.target}
                          </span>
                        )}
                        {ex.equipment && (
                          <span className="text-[9px] font-body opacity-60 flex items-center gap-1" style={{ color: 'var(--chalk-muted)' }}>
                            <Dumbbell className="w-3 h-3" />
                            {ex.equipment}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => addExerciseToCategory(ex)}
                      className="py-1.5 px-3 rounded-lg text-[10px] font-bold font-display uppercase tracking-wider cursor-pointer"
                      style={{
                        backgroundColor: 'var(--intensity)',
                        color: 'var(--chalk)',
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
    </div>
  )
}
