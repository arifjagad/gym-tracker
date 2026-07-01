'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Play, Calendar, Dumbbell, ArrowRight } from 'lucide-react'
import { useTapFeedback } from '@/hooks/use-tap-feedback'
import { startWorkoutSession } from '@/lib/actions/workout'

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

  // Deteksi Hari Ini
  const daysMapping = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu']
  const todayDay = daysMapping[new Date().getDay()]
  const todayLabel = new Date().toLocaleDateString('id-ID', { weekday: 'long' })

  // Cari rekomendasi jadwal latihan hari ini
  let suggestedPlan: PlanItem | null = null
  let suggestedCategory: CategoryItem | null = null

  for (const plan of plans) {
    const matchedCat = plan.plan_categories.find((c) => c.day_of_week === todayDay)
    if (matchedCat) {
      suggestedPlan = plan
      suggestedCategory = matchedCat
      break
    }
  }

  // State Pilihan Latihan Manual
  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    suggestedPlan?.id || plans[0]?.id || ''
  )

  const { ref: startRef, onPointerDown: startDown } = useTapFeedback()
  const { ref: quickRef, onPointerDown: quickDown } = useTapFeedback()

  const handleStart = async (planId: string) => {
    if (!planId) return
    setLoading(true)
    setError(null)
    try {
      await startWorkoutSession(planId)
      // Refresh router untuk memuat state sesi aktif
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memulai latihan.')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* 1. KOTAK REKOMENDASI HARI INI */}
      {suggestedPlan && suggestedCategory ? (
        <div
          className="p-6 rounded-xl border space-y-4 relative overflow-hidden"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--intensity)', // Highlight aksen merah
          }}
        >
          {/* Tag Rekomendasi */}
          <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase font-body" style={{ color: 'var(--intensity)' }}>
            <Calendar className="w-3.5 h-3.5" />
            Rekomendasi Latihan Hari {todayLabel}
          </div>

          <div className="space-y-1">
            <h3 className="font-display text-2xl font-bold uppercase tracking-wider" style={{ color: 'var(--chalk)' }}>
              {suggestedCategory.category_name}
            </h3>
            <p className="font-body text-xs" style={{ color: 'var(--chalk-muted)' }}>
              Template: {suggestedPlan.name}
            </p>
          </div>

          {error && (
            <div className="p-3 rounded text-xs font-body" style={{ backgroundColor: 'rgba(232, 67, 44, 0.1)', color: 'var(--intensity)' }}>
              {error}
            </div>
          )}

          <button
            ref={quickRef}
            onPointerDown={quickDown}
            disabled={loading}
            onClick={() => handleStart(suggestedPlan!.id)}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-lg text-xs font-bold tracking-wider font-display uppercase cursor-pointer disabled:opacity-50"
            style={{
              backgroundColor: 'var(--intensity)',
              color: 'var(--chalk)',
            }}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            {loading ? 'Mempersiapkan...' : 'Mulai Latihan Sekarang'}
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>
      ) : null}

      {/* 2. KELOLA MANUAL PILIHAN TEMPLATE */}
      <div
        className="p-6 rounded-xl border space-y-4"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="space-y-1">
          <h3 className="font-display text-xl font-bold uppercase tracking-wider" style={{ color: 'var(--chalk)' }}>
            Pilih Template Latihan
          </h3>
          <p className="font-body text-xs" style={{ color: 'var(--chalk-muted)' }}>
            Mulai latihan secara manual menggunakan salah satu template yang telah Anda buat.
          </p>
        </div>

        {error && !suggestedPlan && (
          <div className="p-3 rounded text-xs font-body" style={{ backgroundColor: 'rgba(232, 67, 44, 0.1)', color: 'var(--intensity)' }}>
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--chalk-muted)' }}>
              Pilih Rencana Latihan
            </label>
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="block w-full py-2.5 px-3 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[--chalk-muted] text-sm font-body"
              style={{
                backgroundColor: 'var(--surface-raised)',
                borderColor: 'var(--border)',
                color: 'var(--chalk)',
              }}
            >
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} ({plan.plan_categories.length} Kategori)
                </option>
              ))}
            </select>
          </div>

          <button
            ref={startRef}
            onPointerDown={startDown}
            disabled={loading || !selectedPlanId}
            onClick={() => handleStart(selectedPlanId)}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-lg text-xs font-bold tracking-wider font-display uppercase cursor-pointer disabled:opacity-50"
            style={{
              backgroundColor: 'var(--surface-raised)',
              borderColor: 'var(--border)',
              color: 'var(--chalk)',
            }}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            {loading ? 'Mempersiapkan...' : 'Mulai Latihan Pilihan'}
          </button>
        </div>
      </div>
    </div>
  )
}
