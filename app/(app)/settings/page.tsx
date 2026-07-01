import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { User, Dumbbell, Shield, Award } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const supabase = await createClient()

  // Ambil data user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Ambil detail profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const userEmail = user.email || 'User'
  const planTier = profile?.plan_tier || 'free'

  return (
    <main className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header Halaman */}
      <div>
        <h1 className="font-display text-4xl font-bold tracking-wider" style={{ color: 'var(--chalk)' }}>
          PENGATURAN
        </h1>
        <p className="font-body text-xs" style={{ color: 'var(--chalk-muted)' }}>
          Kelola preferensi akun, satuan berat latihan, dan status keanggotaan Anda.
        </p>
      </div>

      <div className="space-y-6">
        {/* SECTION 1: PROFIL */}
        <div
          className="p-6 rounded-xl border space-y-4"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-2 pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <User className="w-5 h-5 opacity-65" style={{ color: 'var(--chalk-muted)' }} />
            <h3 className="font-display text-lg font-bold uppercase tracking-wider" style={{ color: 'var(--chalk)' }}>
              Profil Akun
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4 text-xs font-body">
            <div className="space-y-1">
              <span className="opacity-55" style={{ color: 'var(--chalk-muted)' }}>Email Terdaftar</span>
              <p className="font-semibold text-sm" style={{ color: 'var(--chalk)' }}>{userEmail}</p>
            </div>
            <div className="space-y-1">
              <span className="opacity-55" style={{ color: 'var(--chalk-muted)' }}>Metode Login</span>
              <p className="font-semibold text-sm capitalize" style={{ color: 'var(--chalk)' }}>
                Google Social Auth
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 2: PREFERENSI UNIT */}
        <div
          className="p-6 rounded-xl border space-y-4"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-2 pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <Dumbbell className="w-5 h-5 opacity-65" style={{ color: 'var(--chalk-muted)' }} />
            <h3 className="font-display text-lg font-bold uppercase tracking-wider" style={{ color: 'var(--chalk)' }}>
              Preferensi Unit Latihan
            </h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-xs font-bold" style={{ color: 'var(--chalk)' }}>Satuan Berat Latihan</p>
                <p className="text-[10px]" style={{ color: 'var(--chalk-muted)' }}>Menentukan format input beban di logger dan visualisasi chart.</p>
              </div>

              {/* Toggle Selector Satuan */}
              <div className="flex p-1 rounded-lg border bg-[--surface-raised]" style={{ borderColor: 'var(--border)' }}>
                <span
                  className="py-1 px-3 rounded text-[10px] font-bold font-display uppercase tracking-wider bg-[--surface] cursor-default"
                  style={{ color: 'var(--chalk)' }}
                >
                  KG (Kilogram)
                </span>
                <span
                  className="py-1 px-3 rounded text-[10px] font-bold font-display uppercase tracking-wider opacity-35 cursor-not-allowed"
                  style={{ color: 'var(--chalk-muted)' }}
                  title="Fitur Pro: LBS menyusul"
                >
                  LBS (Pounds)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: SUBSCRIPTION STATUS */}
        <div
          className="p-6 rounded-xl border space-y-4"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-2 pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <Shield className="w-5 h-5 opacity-65" style={{ color: 'var(--chalk-muted)' }} />
            <h3 className="font-display text-lg font-bold uppercase tracking-wider" style={{ color: 'var(--chalk)' }}>
              Status Keanggotaan
            </h3>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-bold" style={{ color: 'var(--chalk)' }}>Paket Saat Ini</p>
              <p className="text-[10px]" style={{ color: 'var(--chalk-muted)' }}>
                {planTier === 'free'
                  ? 'Keanggotaan gratis (Free Tier). Anda memiliki akses ke seluruh fitur utama pencatatan gym.'
                  : 'Keanggotaan Pro Tier aktif. Terima kasih atas dukungan Anda!'}
              </p>
            </div>

            {/* Badge Tier */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-numeric font-extrabold text-xs capitalize" style={{
              backgroundColor: planTier === 'free' ? 'var(--surface-raised)' : 'rgba(124, 154, 92, 0.1)',
              borderColor: 'var(--border)',
              color: planTier === 'free' ? 'var(--chalk-muted)' : 'var(--progress)'
            }}>
              <Award className="w-4 h-4" />
              {planTier} Account
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
