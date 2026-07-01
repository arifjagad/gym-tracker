import { createClient } from '@/lib/supabase/server'
import { SearchInput } from '@/components/workout/search-input'
import { Dumbbell, Target } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ search?: string }>
}

export default async function ExercisesPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams
  const search = resolvedSearchParams.search ?? ''

  const supabase = await createClient()
  let query = supabase.from('exercises').select('*').order('name')

  if (search) {
    query = query.ilike('name', `%${search}%`)
  }

  // Batasi 50 hasil untuk performa loading cepat
  const { data: exercises, error } = await query.limit(50)

  return (
    <main className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-wider" style={{ color: 'var(--chalk)' }}>
            KATALOG GERAKAN
          </h1>
          <p className="font-body text-xs" style={{ color: 'var(--chalk-muted)' }}>
            Cari tutorial gerakan olahraga dan latih otot target Anda secara presisi.
          </p>
        </div>
        <SearchInput />
      </div>

      {/* Grid Katalog */}
      {error ? (
        <div className="p-4 rounded-lg text-center" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--intensity)' }}>
          Gagal mengambil data katalog: {error.message}
        </div>
      ) : !exercises || exercises.length === 0 ? (
        <div className="p-12 rounded-lg text-center border space-y-3" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
          <p className="font-body text-sm" style={{ color: 'var(--chalk-muted)' }}>
            {search ? `Tidak menemukan hasil untuk "${search}"` : 'Katalog data exercises kosong.'}
          </p>
          {!search && (
            <p className="text-xs font-body" style={{ color: 'var(--chalk-muted)' }}>
              Pastikan Anda sudah memicu POST ke `/api/sync-exercises` untuk menyinkronkan data API awal.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exercises.map((ex) => (
            <div
              key={ex.id}
              className="p-5 rounded-xl border flex flex-col justify-between transition-transform hover:scale-[1.01] duration-150"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border)',
              }}
            >
              <div className="space-y-3">
                {/* Judul Exercise */}
                <h3 className="font-display text-xl font-bold uppercase tracking-wide leading-tight" style={{ color: 'var(--chalk)' }}>
                  <Link href={`/exercises/${ex.id}`} className="hover:text-[--intensity] transition-colors">
                    {ex.name}
                  </Link>
                </h3>
                
                {/* Badges */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {ex.body_part && (
                    <span
                      className="px-2.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider font-body"
                      style={{
                        backgroundColor: 'var(--surface-raised)',
                        color: 'var(--chalk-muted)',
                      }}
                    >
                      {ex.body_part}
                    </span>
                  )}
                  {ex.target && (
                    <span
                      className="px-2.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider font-body flex items-center gap-1"
                      style={{
                        backgroundColor: 'rgba(232, 67, 44, 0.1)',
                        color: 'var(--intensity)',
                      }}
                    >
                      <Target className="w-3 h-3" />
                      {ex.target}
                    </span>
                  )}
                </div>
              </div>

              {/* Detail Peralatan & Deskripsi Awal */}
              <div className="pt-4 mt-4 border-t space-y-2" style={{ borderColor: 'var(--border)' }}>
                {ex.equipment && (
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--chalk-muted)' }}>
                    <Dumbbell className="w-3.5 h-3.5" />
                    <span className="font-body capitalize">Alat: {ex.equipment}</span>
                  </div>
                )}
                {ex.instructions && ex.instructions.length > 0 && (
                  <p className="text-[11px] font-body line-clamp-2" style={{ color: 'var(--chalk-muted)' }}>
                    {ex.instructions[0]}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Info Limit Data */}
      {exercises && exercises.length > 0 && (
        <div className="text-center text-[10px] font-body" style={{ color: 'var(--chalk-muted)' }}>
          Menampilkan maksimal 50 gerakan teratas. Gunakan bilah pencarian untuk menyaring lebih banyak gerakan.
        </div>
      )}
    </main>
  )
}
