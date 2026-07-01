import { createClient } from '@/lib/supabase/server'
import { ExercisesManager } from '@/components/workout/exercises-manager'

export const dynamic = 'force-dynamic'

export default async function ExercisesPage() {
  const supabase = await createClient()

  // Ambil data user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="p-6 text-center text-sm font-body" style={{ color: 'var(--chalk-muted)' }}>
        Memuat...
      </div>
    )
  }

  // Fetch unique categories, targets, and equipment in a single optimized query
  const { data: rawData } = await supabase
    .from('exercises')
    .select('body_part, target, equipment')

  const uniqueCategories = Array.from(new Set((rawData || []).map(r => r.body_part).filter(Boolean))) as string[]
  const uniqueTargets = Array.from(new Set((rawData || []).map(r => r.target).filter(Boolean))) as string[]
  const uniqueEquipments = Array.from(new Set((rawData || []).map(r => r.equipment).filter(Boolean))) as string[]

  uniqueCategories.sort()
  uniqueTargets.sort()
  uniqueEquipments.sort()

  // Format categories (capitalized)
  const categories = [
    'Semua',
    ...uniqueCategories.map(c => c.charAt(0).toUpperCase() + c.slice(1))
  ]

  return (
    <div className="px-4 py-5 space-y-6">
      {/* ── HEADER ── */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] font-display mb-1" style={{ color: 'var(--intensity)' }}>
          Katalog
          </p>
        <h1 className="font-display text-3xl font-bold tracking-wider" style={{ color: 'var(--chalk)' }}>
          KATALOG GERAKAN
        </h1>
        <p className="font-body text-xs mt-1" style={{ color: 'var(--chalk-muted)' }}>
          Cari gerakan, saring target otot, dan tonton video demonstrasi latihan.
        </p>
      </div>

      {/* Exercises Catalog Manager */}
      <ExercisesManager
        initialCategories={categories}
        initialTargets={uniqueTargets}
        initialEquipments={uniqueEquipments}
      />
    </div>
  )
}
