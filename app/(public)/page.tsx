import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Check, ArrowRight, Flame, Database, TrendingUp, Users, Dumbbell } from 'lucide-react'
import {
  PremiumFAQWidget,
  ConsistencyShowcaseWidget,
  MiniCatalogWidget,
} from '@/components/workout/landing-interactive'

export const dynamic = 'force-dynamic'

const HERO_BULLETS = [
  'Catat setiap set secara taktil',
  'Analisis progress otomatis',
  'Database 1.300+ gerakan interaktif',
]

const COMPARISON = [
  { feature: 'Auto PR Detection', notebook: false, excel: 'warn', us: true },
  { feature: 'Progress Chart', notebook: false, excel: 'warn', us: true },
  { feature: 'Workout Template', notebook: false, excel: 'warn', us: true },
  { feature: 'Exercise Database', notebook: false, excel: false, us: true },
  { feature: 'Statistics & Insights', notebook: false, excel: false, us: true },
  { feature: 'Cloud Sync', notebook: false, excel: false, us: true },
]

export default async function LandingPage() {
  const supabase = await createClient()

  // Ambil user auth state
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const ctaHref = user ? '/dashboard' : '/login'

  return (
    <main className="w-full flex-1 flex flex-col bg-base" style={{ backgroundColor: 'var(--bg-base)' }}>
      {/* ── TOP HEADER ── */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-4 h-14 border-b"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'var(--intensity)', boxShadow: '0 0 14px rgba(232,67,44,0.35)' }}
          >
            <Dumbbell className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-display font-extrabold uppercase tracking-widest text-[13px]" style={{ color: 'var(--chalk)' }}>
            GymTracker
          </span>
        </div>
        <Link
          href={ctaHref}
          className="px-4 py-1.5 rounded-lg text-[10px] font-bold font-display uppercase tracking-wider"
          style={{ backgroundColor: 'var(--intensity)', color: '#fff' }}
        >
          {user ? 'Dashboard' : 'Masuk'}
        </Link>
      </header>

      {/* ── HERO ── */}
      <section
        className="relative overflow-hidden bg-cover bg-center px-5 pt-12 pb-16 space-y-6"
        style={{
          backgroundImage: 'linear-gradient(to bottom, rgba(8,8,8,0.9) 0%, rgba(8,8,8,0.95) 100%), url("/hero_gym_bg.png")',
        }}
      >
        {/* Glow */}
        <div
          className="absolute top-0 right-0 w-[250px] h-[250px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(232,67,44,0.15) 0%, transparent 65%)' }}
        />

        <div className="space-y-4 relative z-10">
          <span
            className="text-[9px] font-bold uppercase tracking-[0.2em]"
            style={{ color: 'var(--intensity)', fontFamily: 'var(--font-display)' }}
          >
            ● Built for lifters. Made for progress.
          </span>
          <h1
            className="font-display font-extrabold uppercase leading-[0.95] tracking-tight text-4xl"
            style={{ color: 'var(--chalk)' }}
          >
            TRAIN SMART.<br />
            <span style={{ color: 'var(--intensity)' }}>BREAK EVERY PR.</span>
          </h1>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--chalk-muted)', fontFamily: 'var(--font-body)' }}>
            Aplikasi workout tracker khusus lifter serius. Catat beban, analisis progres, dan pecahkan rekor Anda sendiri setiap sesi.
          </p>
        </div>

        {/* Feature bullets */}
        <ul className="space-y-2 relative z-10">
          {HERO_BULLETS.map((b, i) => (
            <li key={i} className="flex items-center gap-2.5 text-xs" style={{ color: 'var(--chalk-muted)', fontFamily: 'var(--font-body)' }}>
              <span className="w-3.5 h-3.5 rounded-full flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(232,67,44,0.15)' }}>
                <Check className="w-2 h-2" style={{ color: 'var(--intensity)' }} />
              </span>
              {b}
            </li>
          ))}
        </ul>

        {/* Action Button */}
        <div className="pt-2 relative z-10">
          <Link
            href={ctaHref}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-extrabold uppercase tracking-widest text-xs transition-transform active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, var(--intensity), #ff6b4a)',
              color: '#fff',
              fontFamily: 'var(--font-display)',
              boxShadow: '0 6px 20px rgba(232,67,44,0.3)',
            }}
          >
            {user ? 'Buka Dashboard' : 'Daftar Sekarang'}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="px-5 py-12 space-y-8" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="space-y-1">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--intensity)', fontFamily: 'var(--font-display)' }}>
            CARA KERJA
          </p>
          <h2 className="font-display font-extrabold uppercase text-2xl tracking-wide" style={{ color: 'var(--chalk)' }}>
            SIMPLE. <span style={{ color: 'var(--intensity)' }}>POWERFUL.</span>
          </h2>
        </div>

        <div className="space-y-4">
          {[
            { n: '01', title: 'Buat Program', desc: 'Rancang template latihan kamu sendiri', icon: '📋' },
            { n: '02', title: 'Mulai Sesi', desc: 'Buka program lalu mulai catat', icon: '🏋️' },
            { n: '03', title: 'Catat Setiap Set', desc: 'Tap set, timer istirahat otomatis jalan', icon: '✅' },
            { n: '04', title: 'Lihat Progress', desc: 'Grafik volume dan kekuatan mingguan', icon: '📈' },
            { n: '05', title: 'Tembus PR', desc: 'Sistem otomatis deteksi rekor baru', icon: '🏆' },
          ].map((step, i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-4 rounded-xl border"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center font-extrabold text-xs flex-shrink-0"
                style={{
                  backgroundColor: 'var(--intensity)',
                  color: '#fff',
                  fontFamily: 'var(--font-display)',
                  boxShadow: '0 0 12px rgba(232,67,44,0.3)',
                }}
              >
                {step.n}
              </div>
              <div className="min-w-0">
                <h3 className="font-display font-extrabold uppercase tracking-wide text-xs" style={{ color: 'var(--chalk)' }}>
                  {step.title}
                </h3>
                <p className="text-[10px] leading-relaxed mt-0.5" style={{ color: 'var(--chalk-muted)', fontFamily: 'var(--font-body)' }}>
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CONSISTENCY & LIBRARY ── */}
      <section className="px-5 py-12 space-y-10" style={{ backgroundColor: '#0D0D0D', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="space-y-1">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--intensity)', fontFamily: 'var(--font-display)' }}>FITUR UNGGULAN</p>
          <h2 className="font-display font-extrabold uppercase text-2xl tracking-wide" style={{ color: 'var(--chalk)' }}>
            YANG KAMU <span style={{ color: 'var(--intensity)' }}>DAPATKAN</span>
          </h2>
        </div>

        <div className="space-y-6">
          <ConsistencyShowcaseWidget />
          <MiniCatalogWidget />
        </div>
      </section>

      {/* ── COMPARISON TABLE ── */}
      <section className="px-5 py-12 space-y-6">
        <div className="space-y-1">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--intensity)', fontFamily: 'var(--font-display)' }}>LEBIH DARI SEKADAR CATATAN</p>
          <h2 className="font-display font-extrabold uppercase text-2xl tracking-wide" style={{ color: 'var(--chalk)' }}>
            KENAPA <span style={{ color: 'var(--intensity)' }}>GYMTRACKER?</span>
          </h2>
        </div>

        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--surface)' }}>
                <th className="text-left py-3 px-4 text-[9px] uppercase tracking-wider" style={{ color: 'var(--chalk-muted)', fontFamily: 'var(--font-display)', width: '45%' }}>Fitur</th>
                <th className="py-3 px-2 text-center text-[9px] uppercase tracking-wider" style={{ color: 'var(--chalk-muted)', fontFamily: 'var(--font-display)' }}>Excel</th>
                <th className="py-3 px-2 text-center text-[9px] uppercase tracking-wider" style={{ color: 'var(--intensity)', backgroundColor: 'rgba(232,67,44,0.06)' }}>GymTracker</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row, ri) => (
                <tr
                  key={ri}
                  style={{ borderTop: '1px solid var(--border)' }}
                >
                  <td className="py-3 px-4 text-xs" style={{ color: 'var(--chalk)', fontFamily: 'var(--font-body)', borderTop: '1px solid var(--border)' }}>{row.feature}</td>
                  <td className="py-3 px-2 text-center" style={{ borderTop: '1px solid var(--border)' }}>
                    {row.excel === true && <Check className="w-3.5 h-3.5 mx-auto" style={{ color: 'var(--intensity)' }} />}
                    {row.excel === false && <span className="text-base leading-none" style={{ color: 'rgba(255,255,255,0.12)' }}>—</span>}
                    {row.excel === 'warn' && <span className="text-xs" style={{ color: '#F59E0B' }}>△</span>}
                  </td>
                  <td className="py-3 px-2 text-center" style={{ backgroundColor: 'rgba(232,67,44,0.04)', borderTop: '1px solid var(--border)' }}>
                    {row.us === true && <Check className="w-3.5 h-3.5 mx-auto" style={{ color: 'var(--intensity)' }} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── CLOSING CTA ── */}
      <section
        className="relative overflow-hidden py-16 px-5"
        style={{ backgroundColor: '#0A0A0A', borderTop: '1px solid var(--border)' }}
      >
        <div
          className="absolute bottom-0 right-0 w-[200px] h-[200px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(232,67,44,0.15) 0%, transparent 60%)' }}
        />
        <div className="relative z-10 space-y-6">
          <div className="space-y-2">
            <h2
              className="font-display font-extrabold uppercase leading-none tracking-tight text-3xl"
              style={{ color: 'var(--chalk)' }}
            >
              READY TO LIFT<br />
              <span style={{ color: 'var(--intensity)' }}>SMARTER?</span>
            </h2>
            <p className="text-xs leading-relaxed max-w-xs" style={{ color: 'var(--chalk-muted)', fontFamily: 'var(--font-body)' }}>
              Stop menebak-nebak progresmu. Mulai catat latihan hari ini.
            </p>
          </div>
          <Link
            href={ctaHref}
            className="w-full inline-flex items-center justify-center gap-2 py-4 rounded-xl font-extrabold uppercase tracking-widest text-xs transition-transform active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, var(--intensity), #ff6b4a)',
              color: '#fff',
              fontFamily: 'var(--font-display)',
              boxShadow: '0 6px 20px rgba(232,67,44,0.3)',
            }}
          >
            {user ? 'Buka Dashboard' : 'Daftar Sekarang'}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="px-5 py-12" style={{ borderTop: '1px solid var(--border)' }}>
        <PremiumFAQWidget />
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ backgroundColor: '#050505', borderTop: '1px solid var(--border)' }}>
        <div className="px-5 py-8 space-y-6 text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: 'var(--intensity)' }}>
              <Dumbbell className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-display font-bold tracking-widest uppercase text-xs" style={{ color: 'var(--chalk)' }}>GYMTRACKER</span>
          </div>
          <p className="text-[10px]" style={{ color: 'var(--chalk-muted)', fontFamily: 'var(--font-body)' }}>
            © {new Date().getFullYear()} GymTracker. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  )
}
