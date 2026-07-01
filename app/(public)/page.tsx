import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Check, ArrowRight, Flame, Database, TrendingUp, Users, Dumbbell, ChevronRight } from 'lucide-react'
import {
  DemoLoggerWidget,
  PremiumFAQWidget,
  StatsCounterWidget,
  HowItWorksWidget,
  ClosingCTAWidget,
  ChalkBurstWidget,
  ConsistencyShowcaseWidget,
  MiniCatalogWidget,
} from '@/components/workout/landing-interactive'

export const dynamic = 'force-dynamic'

const NAV_LINKS = [
  { label: 'Fitur', href: '#features' },
  { label: 'Exercise Library', href: '#library' },
  { label: 'Progress', href: '#progress' },
  { label: 'FAQ', href: '#faq' },
]

const HERO_BULLETS = [
  'Catat setiap set secara taktil',
  'Analisis progress otomatis',
  'Deteksi Personal Record',
  'Database 1.300+ latihan',
]

const COMPARISON = [
  { feature: 'Auto PR Detection', notebook: false, excel: 'warn', us: true },
  { feature: 'Progress Chart', notebook: false, excel: 'warn', us: true },
  { feature: 'Workout Template', notebook: false, excel: 'warn', us: true },
  { feature: 'Exercise Database', notebook: false, excel: false, us: true },
  { feature: 'Statistics & Insights', notebook: false, excel: false, us: true },
  { feature: 'Cloud Sync', notebook: false, excel: false, us: true },
]

export default async function PublicLandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const ctaHref = user ? '/dashboard' : '/login'

  return (
    <main className="min-h-dvh flex flex-col" style={{ backgroundColor: 'var(--bg-base)' }}>

      {/* ══════════════════════════════════════════
          NAVBAR
      ══════════════════════════════════════════ */}
      <header
        className="sticky top-0 z-50 w-full"
        style={{
          backgroundColor: 'rgba(8,8,8,0.92)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          {/* Logo */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-7 h-7 rounded flex items-center justify-center" style={{ backgroundColor: 'var(--intensity)' }}>
              <Dumbbell className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold tracking-widest uppercase text-sm" style={{ color: 'var(--chalk)' }}>
              GYMTRACKER
            </span>
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map(link => (
              <a
                key={link.href}
                href={link.href}
                className="text-[11px] font-semibold uppercase tracking-widest transition-colors duration-150 hover:text-white"
                style={{ color: 'var(--chalk-muted)', fontFamily: 'var(--font-display)' }}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Nav CTAs */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:block text-[11px] font-bold uppercase tracking-widest px-4 py-2 rounded border transition-all hover:border-white/20"
              style={{ borderColor: 'var(--border)', color: 'var(--chalk-muted)', fontFamily: 'var(--font-display)' }}
            >
              Login
            </Link>
            <Link
              href={ctaHref}
              className="text-[11px] font-extrabold uppercase tracking-widest px-5 py-2.5 rounded transition-all hover:brightness-110 active:scale-[0.97]"
              style={{ backgroundColor: 'var(--intensity)', color: '#fff', fontFamily: 'var(--font-display)' }}
            >
              {user ? 'Dashboard' : 'Mulai Gratis'}
            </Link>
          </div>
        </nav>
      </header>

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden bg-cover bg-center"
        style={{
          minHeight: '92vh',
          backgroundImage: 'linear-gradient(to bottom, rgba(8,8,8,0.9) 0%, rgba(8,8,8,0.3) 50%, rgba(8,8,8,0.95) 100%), linear-gradient(to right, rgba(8,8,8,1) 20%, rgba(8,8,8,0.85) 50%, rgba(8,8,8,0.35) 100%), url("/hero_gym_bg.png")',
        }}
      >
        {/* Background: radial red glow top-right */}
        <div
          className="absolute top-0 right-0 w-[700px] h-[700px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 70% 30%, rgba(232,67,44,0.18) 0%, transparent 65%)',
          }}
        />
        {/* Subtle grid lines */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[92vh]">
          {/* ── LEFT: Copy ── */}
          <div className="space-y-8">
            {/* Eyebrow */}
            <div className="flex items-center gap-2">
              <span
                className="text-[10px] font-bold uppercase tracking-[0.25em]"
                style={{ color: 'var(--intensity)', fontFamily: 'var(--font-display)' }}
              >
                ● Built for lifters. Made for progress.
              </span>
            </div>

            {/* H1 */}
            <div className="space-y-0">
              <h1
                className="font-display font-extrabold uppercase leading-[0.9] tracking-tight"
                style={{ fontSize: 'clamp(3.2rem, 7vw, 6rem)', color: 'var(--chalk)' }}
              >
                TRAIN SMART.
              </h1>
              <h1
                className="font-display font-extrabold uppercase leading-[0.9] tracking-tight"
                style={{ fontSize: 'clamp(3.2rem, 7vw, 6rem)', color: 'var(--intensity)' }}
              >
                BREAK EVERY PR.
              </h1>
            </div>

            <p className="text-sm leading-relaxed max-w-md" style={{ color: 'var(--chalk-muted)', fontFamily: 'var(--font-body)' }}>
              Aplikasi workout tracker yang dibuat khusus untuk lifter serius. Catat beban, analisis progres, dan pecahkan rekor Anda sendiri setiap sesi.
            </p>

            {/* Feature bullets */}
            <ul className="space-y-2.5">
              {HERO_BULLETS.map((b, i) => (
                <li key={i} className="flex items-center gap-3 text-sm" style={{ color: 'var(--chalk-muted)', fontFamily: 'var(--font-body)' }}>
                  <span className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(232,67,44,0.15)' }}>
                    <Check className="w-2.5 h-2.5" style={{ color: 'var(--intensity)' }} />
                  </span>
                  {b}
                </li>
              ))}
            </ul>

            {/* CTAs */}
            <div className="flex items-center gap-4 flex-wrap pt-2">
              <Link
                href={ctaHref}
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded font-extrabold uppercase tracking-widest text-sm transition-all hover:brightness-110 active:scale-[0.97]"
                style={{ backgroundColor: 'var(--intensity)', color: '#fff', fontFamily: 'var(--font-display)' }}
              >
                {user ? 'Buka Dashboard' : 'Mulai Gratis'}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                className="inline-flex items-center gap-2 px-6 py-4 rounded border font-bold uppercase tracking-widest text-sm transition-all hover:border-white/30 hover:text-white"
                style={{ borderColor: 'var(--border-strong)', color: 'var(--chalk-muted)', fontFamily: 'var(--font-display)', backgroundColor: 'transparent' }}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--intensity)' }} />
                Lihat Demo
              </button>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-3 pt-1">
              <div className="flex -space-x-2">
                {['#E8432C', '#FF8C5A', '#FF5C3D', '#C43220'].map((color, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-[9px] font-bold"
                    style={{ backgroundColor: color, borderColor: 'var(--bg-base)', color: '#fff' }}
                  >
                    {['JB', 'AR', 'SK', 'DW'][i]}
                  </div>
                ))}
              </div>
              <p className="text-xs" style={{ color: 'var(--chalk-muted)', fontFamily: 'var(--font-body)' }}>
                Dipercaya oleh <span className="font-bold" style={{ color: 'var(--chalk)' }}>50.000+</span> lifter Indonesia
              </p>
            </div>
          </div>

          {/* ── RIGHT: Phone Mockup ── */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative">
              {/* Phone Mockup Image (Generated via Gemini) */}
              <img
                src="/phone_mockup.png"
                alt="GymTracker Phone Mockup"
                className="w-[310px] h-auto object-contain relative z-10 transition-transform duration-300 hover:scale-[1.03]"
                style={{
                  filter: 'drop-shadow(0 25px 50px rgba(0,0,0,0.80)) drop-shadow(0 0 60px rgba(232,67,44,0.18))',
                }}
              />

              {/* Floating badge */}
              <div
                className="absolute -top-3 -right-3 z-20 px-3.5 py-1.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest"
                style={{
                  backgroundColor: 'var(--intensity)',
                  color: '#fff',
                  fontFamily: 'var(--font-display)',
                  boxShadow: '0 4px 15px rgba(232, 67, 44, 0.4)',
                }}
              >
                🔥 PR BARU!
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          STATS STRIP (Animated count-up)
      ══════════════════════════════════════════ */}
      <StatsCounterWidget />

      {/* ══════════════════════════════════════════
          HOW IT WORKS — SIMPLE. POWERFUL.
      ══════════════════════════════════════════ */}
      <section id="features" className="max-w-7xl w-full mx-auto px-6 py-24 space-y-16">
        <div className="text-center space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: 'var(--intensity)', fontFamily: 'var(--font-display)' }}>
            CARA KERJA
          </p>
          <h2 className="font-display font-extrabold uppercase text-4xl md:text-5xl tracking-wider" style={{ color: 'var(--chalk)' }}>
            SIMPLE. <span style={{ color: 'var(--intensity)' }}>POWERFUL.</span>
          </h2>
        </div>

        {/* 5-step flow */}
        <div className="relative">
          {/* Dashed connector line */}
          <div
            className="hidden md:block absolute top-12 left-[10%] right-[10%] h-px"
            style={{ borderTop: '2px dashed rgba(232,67,44,0.2)' }}
          />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-4 relative z-10">
            {[
              { n: '01', title: 'Buat Program', desc: 'Rancang template latihan kamu sendiri', icon: '📋' },
              { n: '02', title: 'Mulai Sesi', desc: 'Buka program lalu mulai catat', icon: '🏋️' },
              { n: '03', title: 'Catat Setiap Set', desc: 'Tap set, timer istirahat otomatis jalan', icon: '✅' },
              { n: '04', title: 'Lihat Progress', desc: 'Grafik volume dan kekuatan mingguan', icon: '📈' },
              { n: '05', title: 'Tembus PR', desc: 'Sistem otomatis deteksi rekor baru', icon: '🏆' },
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-3">
                {/* Circle */}
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center font-extrabold text-sm relative z-10"
                  style={{
                    backgroundColor: 'var(--intensity)',
                    color: '#fff',
                    fontFamily: 'var(--font-display)',
                    boxShadow: '0 0 20px rgba(232,67,44,0.35)',
                  }}
                >
                  {step.n}
                </div>
                <div className="text-2xl">{step.icon}</div>
                <h3 className="font-display font-extrabold uppercase tracking-wide text-sm" style={{ color: 'var(--chalk)' }}>
                  {step.title}
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--chalk-muted)', fontFamily: 'var(--font-body)' }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          PR SECTION + EXERCISE LIBRARY (asymmetric)
      ══════════════════════════════════════════ */}
      <section id="progress" className="w-full" style={{ backgroundColor: '#0D0D0D', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-7xl mx-auto px-6 py-20 space-y-8">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: 'var(--intensity)', fontFamily: 'var(--font-display)' }}>FITUR UNGGULAN</p>
            <h2 className="font-display font-extrabold uppercase text-4xl tracking-wider" style={{ color: 'var(--chalk)' }}>
              YANG KAMU <span style={{ color: 'var(--intensity)' }}>DAPATKAN</span>
            </h2>
          </div>

          {/* Row 1: PR (big) + Consistency (small) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            <div className="lg:col-span-7 w-full flex flex-col items-stretch"><ChalkBurstWidget /></div>
            <div className="lg:col-span-5 w-full flex flex-col items-stretch"><ConsistencyShowcaseWidget /></div>
          </div>

          {/* Row 2: Catalog full-width */}
          <div id="library">
            <MiniCatalogWidget />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          COMPARISON TABLE
      ══════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-6 py-20 w-full space-y-10">
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: 'var(--intensity)', fontFamily: 'var(--font-display)' }}>LEBIH DARI SEKADAR CATATAN</p>
          <h2 className="font-display font-extrabold uppercase text-4xl tracking-wider" style={{ color: 'var(--chalk)' }}>
            KENAPA <span style={{ color: 'var(--intensity)' }}>GYMTRACKER?</span>
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr>
                <th className="text-left py-4 px-5 text-xs uppercase tracking-widest" style={{ color: 'var(--chalk-muted)', fontFamily: 'var(--font-display)', width: '40%' }}>Fitur</th>
                {[
                  { label: 'Notebook', color: 'var(--chalk-muted)' },
                  { label: 'Excel', color: 'var(--chalk-muted)' },
                  { label: 'GymTracker', color: 'var(--intensity)', highlight: true },
                ].map((col, ci) => (
                  <th
                    key={ci}
                    className="py-4 px-5 text-center text-xs uppercase tracking-widest"
                    style={{
                      color: col.color,
                      fontFamily: 'var(--font-display)',
                      backgroundColor: col.highlight ? 'rgba(232,67,44,0.06)' : 'transparent',
                      borderRadius: ci === 2 ? '8px 8px 0 0' : undefined,
                    }}
                  >
                    {col.label}
                    {col.highlight && (
                      <span className="block text-[8px] mt-0.5 opacity-60">Rekomendasi</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row, ri) => (
                <tr
                  key={ri}
                  style={{ borderTop: '1px solid var(--border)' }}
                >
                  <td className="py-3.5 px-5 text-sm" style={{ color: 'var(--chalk)', fontFamily: 'var(--font-body)' }}>{row.feature}</td>
                  {[row.notebook, row.excel, row.us].map((val, ci) => (
                    <td
                      key={ci}
                      className="py-3.5 px-5 text-center"
                      style={{ backgroundColor: ci === 2 ? 'rgba(232,67,44,0.04)' : 'transparent' }}
                    >
                      {val === true && <Check className="w-4 h-4 mx-auto" style={{ color: 'var(--intensity)' }} />}
                      {val === false && <span className="text-lg leading-none" style={{ color: 'rgba(255,255,255,0.12)' }}>—</span>}
                      {val === 'warn' && <span className="text-sm" style={{ color: '#F59E0B' }}>△</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CLOSING CTA
      ══════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden py-24"
        style={{ backgroundColor: '#0A0A0A', borderTop: '1px solid var(--border)' }}
      >
        {/* Dramatic red glow bg */}
        <div
          className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle at 80% 80%, rgba(232,67,44,0.2) 0%, transparent 60%)' }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="space-y-4">
            <h2
              className="font-display font-extrabold uppercase leading-tight"
              style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', color: 'var(--chalk)' }}
            >
              READY TO LIFT<br />
              <span style={{ color: 'var(--intensity)' }}>SMARTER?</span>
            </h2>
            <p className="text-sm max-w-md" style={{ color: 'var(--chalk-muted)', fontFamily: 'var(--font-body)' }}>
              Stop menebak-nebak progresmu. Mulai catat latihan hari ini.
            </p>
          </div>
          <Link
            href={ctaHref}
            className="flex-shrink-0 inline-flex items-center gap-3 px-10 py-5 rounded font-extrabold uppercase tracking-widest text-sm transition-all hover:brightness-110 active:scale-[0.97]"
            style={{ backgroundColor: 'var(--intensity)', color: '#fff', fontFamily: 'var(--font-display)' }}
          >
            {user ? 'Buka Dashboard' : 'Mulai Gratis Sekarang'}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FAQ
      ══════════════════════════════════════════ */}
      <section id="faq" className="max-w-4xl w-full mx-auto px-6 py-20">
        <PremiumFAQWidget />
      </section>

      {/* ══════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════ */}
      <footer style={{ backgroundColor: '#050505', borderTop: '1px solid var(--border)' }}>
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: 'var(--intensity)' }}>
              <Dumbbell className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-display font-bold tracking-widest uppercase text-sm" style={{ color: 'var(--chalk)' }}>GYMTRACKER</span>
          </div>

          {/* Footer links */}
          <div className="flex flex-wrap items-center gap-6">
            {[['Produk', ['Fitur', 'Exercise Library', 'Progress']], ['Perusahaan', ['Tentang', 'Blog', 'Kontak']], ['Dukungan', ['FAQ', 'Help Center', 'Privacy Policy']]].map(([group, links]) => (
              <div key={group as string} className="flex flex-col gap-1.5">
                <span className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--chalk-muted)', fontFamily: 'var(--font-display)' }}>{group as string}</span>
                {(links as string[]).map(l => (
                  <a key={l} href="#" className="text-[10px] hover:text-white transition-colors" style={{ color: 'var(--chalk-muted)', fontFamily: 'var(--font-body)' }}>{l}</a>
                ))}
              </div>
            ))}
          </div>

          <p className="text-[10px]" style={{ color: 'var(--chalk-muted)', fontFamily: 'var(--font-body)' }}>
            © {new Date().getFullYear()} GymTracker
          </p>
        </div>
      </footer>
    </main>
  )
}
