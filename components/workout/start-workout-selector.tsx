'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Play, Calendar, Zap, ChevronRight, Search, X, Check, ChevronDown, Layers, Plus, Edit2 } from 'lucide-react'
import { startWorkoutSession } from '@/lib/actions/workout'
import Link from 'next/link'

interface CategoryItem {
  id: string
  category_name: string
  day_of_week: string | null
}

interface PlanItem {
  id: string
  name: string
  plan_categories: CategoryItem[]
}

interface StartWorkoutSelectorProps {
  plans: PlanItem[]
}

export function StartWorkoutSelector({ plans }: StartWorkoutSelectorProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  // Deteksi hari ini
  const daysMapping = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu']
  const todayDay   = daysMapping[new Date().getDay()]
  const todayLabel = new Date().toLocaleDateString('id-ID', { weekday: 'long' })

  // Rekomendasi hari ini
  let suggestedPlan: PlanItem | null = null
  let suggestedCategory: CategoryItem | null = null
  for (const plan of plans) {
    const matchedCat = plan.plan_categories.find((c) => c.day_of_week === todayDay)
    if (matchedCat) { suggestedPlan = plan; suggestedCategory = matchedCat; break }
  }

  const [selectedPlan, setSelectedPlan] = useState<PlanItem>(
    suggestedPlan || plans[0]
  )

  const filtered = query.trim()
    ? plans.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
    : plans

  useEffect(() => {
    if (sheetOpen) setTimeout(() => searchRef.current?.focus(), 100)
  }, [sheetOpen])

  // Prevent body scroll when sheet open
  useEffect(() => {
    document.body.style.overflow = sheetOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [sheetOpen])

  const handleStart = async (planId: string) => {
    if (!planId) return
    setLoading(true)
    setError(null)
    try {
      const session = await startWorkoutSession(planId, true)
      if (session && typeof window !== 'undefined') {
        localStorage.setItem('active_session_id', session.id)
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memulai latihan.')
      setLoading(false)
    }
  }

  const selectPlan = (plan: PlanItem) => {
    setSelectedPlan(plan)
    setSheetOpen(false)
    setQuery('')
  }

  return (
    <>
      <div className="space-y-4">

        {/* ── REKOMENDASI HARI INI ── */}
        {suggestedPlan && suggestedCategory && (
          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: '1px solid rgba(232,67,44,0.3)', backgroundColor: 'var(--surface)' }}
          >
            <div className="h-1" style={{ background: 'linear-gradient(90deg, var(--intensity), #ff6b4a)' }} />
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span
                  className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest font-display"
                  style={{ color: 'var(--intensity)' }}
                >
                  <Calendar className="w-3 h-3" />
                  Jadwal Hari {todayLabel}
                </span>
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(232,67,44,0.1)' }}
                >
                  <Zap className="w-4 h-4" style={{ color: 'var(--intensity)' }} />
                </div>
              </div>

              <div>
                <h2
                  className="font-display font-extrabold uppercase tracking-wide text-2xl"
                  style={{ color: 'var(--chalk)' }}
                >
                  {suggestedCategory.category_name}
                </h2>
                <p className="text-[10px] font-body mt-0.5" style={{ color: 'var(--chalk-muted)' }}>
                  {suggestedPlan.name}
                </p>
              </div>

              {error && (
                <div
                  className="p-3 rounded-xl text-xs font-body"
                  style={{ backgroundColor: 'rgba(232,67,44,0.08)', color: 'var(--intensity)', border: '1px solid rgba(232,67,44,0.15)' }}
                >
                  {error}
                </div>
              )}

              <button
                disabled={loading}
                onClick={() => handleStart(suggestedPlan!.id)}
                className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-display font-bold uppercase tracking-wider text-sm disabled:opacity-50 active:scale-[0.98] transition-transform"
                style={{
                  background: 'linear-gradient(135deg, var(--intensity), #ff6b4a)',
                  color: '#fff',
                  boxShadow: '0 6px 24px rgba(232,67,44,0.35)',
                }}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                    Mempersiapkan...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    Mulai Sekarang
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── PILIH TEMPLATE LAIN ── */}
        <div
          className="rounded-2xl p-5 space-y-4"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--surface-raised)' }}>
              <Layers className="w-4 h-4" style={{ color: 'var(--chalk-muted)' }} />
            </div>
            <div>
              <p className="text-xs font-display font-bold uppercase tracking-wider" style={{ color: 'var(--chalk)' }}>
                Template Lain
              </p>
              <p className="text-[10px] font-body" style={{ color: 'var(--chalk-muted)' }}>
                Pilih rencana latihan
              </p>
            </div>
          </div>

          {/* Trigger button — buka bottom sheet */}
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            disabled={loading}
            className="w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl active:opacity-70 transition-opacity"
            style={{
              backgroundColor: 'var(--surface-raised)',
              border: '1px solid var(--border-strong)',
              color: 'var(--chalk)',
            }}
          >
            <div className="text-left min-w-0">
              <p className="text-sm font-medium font-body truncate">{selectedPlan.name}</p>
              <p className="text-[10px] font-body mt-0.5" style={{ color: 'var(--chalk-muted)' }}>
                {selectedPlan.plan_categories.length} kategori
              </p>
            </div>
            <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--chalk-muted)' }} />
          </button>

          {/* Category pills */}
          {selectedPlan.plan_categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedPlan.plan_categories.map((cat) => (
                <span
                  key={cat.id}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-body"
                  style={{ backgroundColor: 'var(--surface-raised)', color: 'var(--chalk-muted)', border: '1px solid var(--border)' }}
                >
                  {cat.category_name}
                  {cat.day_of_week && <span className="opacity-40">· {cat.day_of_week}</span>}
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-2.5 w-full pt-1">
            {/* Edit Template */}
            <Link
              href={`/workout/plans/${selectedPlan.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}-${selectedPlan.id.substring(0, 8)}/edit`}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-display font-bold uppercase tracking-wider text-xs active:scale-[0.98] transition-all cursor-pointer border"
              style={{
                backgroundColor: 'var(--surface-raised)',
                borderColor: 'var(--border)',
                color: 'var(--chalk-muted)',
              }}
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit
            </Link>

            {/* Mulai Latihan */}
            <button
              disabled={loading || selectedPlan.plan_categories.length === 0}
              onClick={() => handleStart(selectedPlan.id)}
              className="flex-[2] flex items-center justify-center gap-2 py-3.5 rounded-2xl font-display font-bold uppercase tracking-wider text-xs disabled:opacity-40 active:scale-[0.98] transition-all cursor-pointer text-white"
              style={{
                backgroundColor: 'var(--intensity)',
                backgroundImage: 'linear-gradient(135deg, var(--intensity), #ff5a3d)',
              }}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {loading ? 'Mempersiapkan...' : 'Mulai'}
            </button>
          </div>
        </div>

        {/* Link ke plans */}
        <Link
          href="/workout/plans"
          className="flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-display font-bold uppercase tracking-wider active:opacity-70 transition-opacity"
          style={{ color: 'var(--chalk-muted)', border: '1px dashed var(--border-strong)' }}
        >
          <Plus className="w-3.5 h-3.5" />
          Buat Template Baru
        </Link>
      </div>

      {/* ═══════════════════════════════════════
          BOTTOM SHEET — Plan Picker
      ═══════════════════════════════════════ */}
      {sheetOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[70]"
            style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
            onClick={() => { setSheetOpen(false); setQuery('') }}
          />

          {/* Sheet */}
          <div
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-[70] rounded-t-3xl overflow-hidden"
            style={{
              backgroundColor: 'var(--surface)',
              borderTop: '1px solid var(--border-strong)',
              maxHeight: '75dvh',
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full" style={{ backgroundColor: 'var(--border-strong)' }} />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3">
              <p className="font-display font-bold uppercase tracking-wider text-sm" style={{ color: 'var(--chalk)' }}>
                Pilih Template
              </p>
              <button
                onClick={() => { setSheetOpen(false); setQuery('') }}
                className="p-1.5 rounded-lg active:opacity-70 cursor-pointer"
                style={{ color: 'var(--chalk-muted)', backgroundColor: 'var(--surface-raised)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search bar */}
            <div className="px-4 pb-3">
              <div
                className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl"
                style={{ backgroundColor: 'var(--surface-raised)', border: '1px solid var(--border-strong)' }}
              >
                <Search className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--chalk-muted)' }} />
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari nama template..."
                  className="flex-1 bg-transparent text-sm font-body focus:outline-none"
                  style={{ color: 'var(--chalk)' }}
                />
                {query && (
                  <button onClick={() => setQuery('')} className="active:opacity-70 cursor-pointer" style={{ color: 'var(--chalk-muted)' }}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <ul className="overflow-y-auto px-3 pb-12" style={{ maxHeight: '45dvh' }}>
              {filtered.length === 0 ? (
                <li className="py-8 text-center text-xs font-body" style={{ color: 'var(--chalk-muted)' }}>
                  Tidak ditemukan &ldquo;{query}&rdquo;
                </li>
              ) : (
                filtered.map((plan) => {
                  const isSelected = plan.id === selectedPlan?.id
                  return (
                    <li key={plan.id}>
                      <button
                        type="button"
                        onClick={() => selectPlan(plan)}
                        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl mb-1.5 active:opacity-70 transition-opacity text-left cursor-pointer"
                        style={{
                          backgroundColor: isSelected ? 'rgba(232,67,44,0.1)' : 'var(--surface-raised)',
                          border: isSelected ? '1px solid rgba(232,67,44,0.3)' : '1px solid transparent',
                        }}
                      >
                        <div className="min-w-0">
                          <p
                            className="text-sm font-medium font-body truncate"
                            style={{ color: isSelected ? 'var(--intensity)' : 'var(--chalk)' }}
                          >
                            {plan.name}
                          </p>
                          <p className="text-[10px] font-body mt-0.5" style={{ color: 'var(--chalk-muted)' }}>
                            {plan.plan_categories.length} kategori
                          </p>
                        </div>
                        {isSelected && <Check className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--intensity)' }} />}
                      </button>
                    </li>
                  )
                })
              )}
            </ul>
          </div>
        </>
      )}
    </>
  )
}
