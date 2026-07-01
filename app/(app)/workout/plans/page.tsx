import { createClient } from '@/lib/supabase/server'
import { CreatePlanDialog } from '@/components/workout/create-plan-dialog'
import { PlanCard } from '@/components/workout/plan-card'
import { Dumbbell } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function PlansPage() {
  const supabase = await createClient()

  // Ambil data user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let plans: any[] = []
  let errorMsg: string | null = null

  if (user) {
    // Ambil list plans dari Supabase
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      errorMsg = error.message
    } else {
      plans = data || []
    }
  }

  return (
    <main className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-wider" style={{ color: 'var(--chalk)' }}>
            TEMPLATE LATIHAN
          </h1>
          <p className="font-body text-xs" style={{ color: 'var(--chalk-muted)' }}>
            Susun, edit, dan gunakan template latihan mingguan Anda secara terstruktur.
          </p>
        </div>
        <CreatePlanDialog />
      </div>

      {errorMsg ? (
        <div className="p-4 rounded-lg text-center" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--intensity)' }}>
          Gagal mengambil rencana latihan: {errorMsg}
        </div>
      ) : plans.length === 0 ? (
        /* Empty State */
        <div
          className="p-16 rounded-xl border flex flex-col items-center justify-center text-center space-y-4"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
          }}
        >
          <div
            className="p-4 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'var(--surface-raised)' }}
          >
            <Dumbbell className="w-8 h-8" style={{ color: 'var(--chalk-muted)' }} />
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-xl font-bold uppercase tracking-wider" style={{ color: 'var(--chalk)' }}>
              Belum Ada Template
            </h3>
            <p className="font-body text-xs max-w-sm" style={{ color: 'var(--chalk-muted)' }}>
              Mulai dengan membuat template latihan baru untuk menyusun jadwal angkat beban mingguan Anda.
            </p>
          </div>
        </div>
      ) : (
        /* Grid Layout */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      )}
    </main>
  )
}
