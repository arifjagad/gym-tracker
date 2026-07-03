import { getSharedPlanAction } from '@/lib/actions/plans'
import { createClient } from '@/lib/supabase/server'
import { SharePreviewClient } from './share-preview-client'
import { Dumbbell, Calendar, ArrowLeft, ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import { Metadata } from 'next'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: {
    planId: string
  }
}

// 1. Metadata Generator untuk Dynamic SEO & Link Preview
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const data = await getSharedPlanAction(params.planId)
    return {
      title: `Rencana Latihan: ${data.plan.name} | GymTracker`,
      description: `Lihat dan impor template rencana latihan "${data.plan.name}" ke akun GymTracker Anda.`,
    }
  } catch {
    return {
      title: 'Rencana Latihan Tidak Ditemukan | GymTracker',
    }
  }
}

// 2. Server Component Page
export default async function SharedPlanPage({ params }: PageProps) {
  const { planId } = params

  // Cek status autentikasi user
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isLoggedIn = !!user

  let sharedData = null
  let errorMsg = null

  try {
    sharedData = await getSharedPlanAction(planId)
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : 'Gagal memuat rencana latihan.'
  }

  // Tampilan jika rencana latihan tidak valid/dihapus
  if (errorMsg || !sharedData) {
    return (
      <main className="p-6 max-w-lg mx-auto min-h-screen flex flex-col items-center justify-center text-center space-y-6">
        <div className="p-4 rounded-full bg-[rgba(232,67,44,0.08)] border border-[rgba(232,67,44,0.2)] animate-pulse">
          <ShieldAlert className="w-10 h-10 text-[var(--intensity)]" />
        </div>
        <div className="space-y-2">
          <h2 className="font-display font-extrabold uppercase text-xl" style={{ color: 'var(--chalk)' }}>
            Rencana Latihan Tidak Ditemukan
          </h2>
          <p className="font-body text-xs text-[var(--chalk-muted)] max-w-sm">
            Tautan berbagi ini tidak valid atau template telah dihapus oleh pemiliknya.
          </p>
        </div>
        <Link
          href="/workout"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold font-display uppercase tracking-wider bg-[--surface-raised] border border-[--border] text-[--chalk]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke Workout
        </Link>
      </main>
    )
  }

  const { plan, categories } = sharedData

  return (
    <main className="p-6 max-w-lg mx-auto space-y-6 pb-24 min-h-screen">
      {/* Header Halaman */}
      <div className="space-y-4">
        <Link
          href="/workout"
          className="p-2 rounded-xl border hover:bg-[--surface-raised] transition-colors flex-shrink-0 inline-flex"
          style={{ borderColor: 'var(--border)', color: 'var(--chalk-muted)' }}
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] font-display mb-1 animate-pulse" style={{ color: 'var(--intensity)' }}>
            Bagikan Rencana
          </p>
          <h1 className="font-display font-extrabold uppercase tracking-wide text-3xl break-words" style={{ color: 'var(--chalk)' }}>
            {plan.name}
          </h1>
          <p className="font-body text-xs mt-1" style={{ color: 'var(--chalk-muted)' }}>
            Pratinjau template rencana latihan dari teman Anda. Anda dapat mengimpornya untuk langsung digunakan di GymTracker!
          </p>
        </div>
      </div>

      {/* Rincian Kategori Latihan (Hari & List Gerakan) */}
      <div className="space-y-4">
        <h3 className="font-display font-bold uppercase tracking-wider text-xs" style={{ color: 'var(--chalk)' }}>
          Hari & Gerakan Latihan ({categories.length})
        </h3>

        {categories.length === 0 ? (
          <div className="p-8 text-center text-xs font-body rounded-2xl border" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--chalk-muted)' }}>
            Rencana latihan ini kosong (tidak ada gerakan).
          </div>
        ) : (
          <div className="space-y-3">
            {categories.map((cat: any) => (
              <div
                key={cat.id}
                className="p-5 rounded-2xl border space-y-3"
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-extrabold uppercase text-sm" style={{ color: 'var(--chalk)' }}>
                    {cat.category_name}
                  </h4>
                  {cat.day_of_week && (
                    <span className="px-2 py-0.5 rounded text-[8px] font-bold font-display uppercase tracking-widest" style={{ backgroundColor: 'rgba(232, 67, 44, 0.1)', color: 'var(--intensity)' }}>
                      {cat.day_of_week}
                    </span>
                  )}
                </div>

                {cat.plan_exercises.length === 0 ? (
                  <p className="text-[10px] font-body" style={{ color: 'var(--chalk-muted)' }}>
                    Belum ada gerakan latihan di hari ini.
                  </p>
                ) : (
                  <div className="space-y-2 pt-2 border-t animate-fade-in" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    {cat.plan_exercises.map((pe: any) => (
                      <div
                        key={pe.sort_order}
                        className="flex items-center justify-between text-xs font-body py-1.5"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: 'var(--surface-raised)', color: 'var(--chalk-muted)' }}>
                            {pe.sort_order}
                          </span>
                          <span className="font-medium" style={{ color: 'var(--chalk)' }}>
                            {pe.exercises?.name}
                          </span>
                        </div>
                        {pe.exercises?.target && (
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-[rgba(255,255,255,0.03)] text-[--chalk-muted] border" style={{ borderColor: 'var(--border)' }}>
                            {pe.exercises.target}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CTA Box (Impor Rencana) */}
      <div className="p-5 rounded-2xl border space-y-4" style={{ backgroundColor: 'var(--surface-raised)', borderColor: 'var(--border)' }}>
        <div className="space-y-1">
          <h4 className="font-display font-extrabold uppercase text-xs" style={{ color: 'var(--chalk)' }}>
            Impor Rencana Latihan Ini?
          </h4>
          <p className="font-body text-[11px]" style={{ color: 'var(--chalk-muted)' }}>
            Setelah diimpor, template ini akan tersimpan ke dalam tab "Template Latihan" Anda dan dapat dimodifikasi kapan saja.
          </p>
        </div>
        <SharePreviewClient planId={planId} isLoggedIn={isLoggedIn} />
      </div>
    </main>
  )
}
