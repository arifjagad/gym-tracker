import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  getWeeklyWorkoutSummary,
  getDailyVolumeChartData,
  getPersonalRecords,
  getMonthlyConsistencyData,
} from '@/lib/actions/stats'
import { WeeklyVolumeChart } from '@/components/workout/weekly-volume-chart'
import { ConsistencyGrid } from '@/components/workout/consistency-grid'
import { Activity, Dumbbell, Trophy, ArrowRight, Flame, TrendingUp, Zap } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="p-6 text-center" style={{ color: 'var(--chalk-muted)' }}>
        Memuat data autentikasi...
      </div>
    )
  }

  const [weeklySummary, dailyChartData, personalRecords, consistencyGridData] = await Promise.all([
    getWeeklyWorkoutSummary(),
    getDailyVolumeChartData(),
    getPersonalRecords(),
    getMonthlyConsistencyData(),
  ])

  const firstName = user.user_metadata?.full_name?.split(' ')[0]
    ?? user.email?.split('@')[0]
    ?? 'Atlet'

  const hour = new Date().getHours()
  const greeting = hour < 11 ? 'Selamat Pagi' : hour < 15 ? 'Selamat Siang' : hour < 18 ? 'Selamat Sore' : 'Selamat Malam'

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">

      {/* ── PAGE HEADER ── */}
      <div className="flex flex-col gap-4 text-left">
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] font-display" style={{ color: 'var(--intensity)' }}>
            {greeting}
          </p>
          <h1
            className="font-display font-extrabold uppercase tracking-wide leading-tight text-3xl"
            style={{ color: 'var(--chalk)' }}
          >
            {firstName} 💪
          </h1>
          <p className="font-body text-xs leading-relaxed" style={{ color: 'var(--chalk-muted)' }}>
            Pantau performa, grafik volume angkatan, dan pencapaian rekor gym Anda.
          </p>
        </div>

        <Link
          href="/workout"
          className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl text-xs font-bold tracking-wider font-display uppercase cursor-pointer transition-all hover:brightness-110 active:scale-[0.98]"
          style={{
            background: 'linear-gradient(135deg, var(--intensity), #ff6b4a)',
            color: '#fff',
            boxShadow: '0 4px 20px rgba(232,67,44,0.3)',
          }}
        >
          <Zap className="w-3.5 h-3.5" />
          Mulai Latihan Baru
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* ── METRIC SUMMARY CARDS ── */}
      <div className="grid grid-cols-1 gap-4">

        {/* Card 1: Sesi Latihan */}
        <div
          className="p-5 rounded-2xl border relative overflow-hidden"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          {/* Accent glow */}
          <div
            className="absolute top-0 right-0 w-24 h-24 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(76,175,80,0.12) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }}
          />
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-[9px] font-bold uppercase tracking-wider font-display" style={{ color: 'var(--chalk-muted)' }}>
                Sesi Latihan
              </p>
              <p className="text-[9px] font-body" style={{ color: 'rgba(255,255,255,0.3)' }}>Minggu ini</p>
            </div>
            <div className="p-2.5 rounded-xl" style={{ backgroundColor: 'rgba(76,175,80,0.1)' }}>
              <Activity className="w-4 h-4" style={{ color: 'var(--progress)' }} />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="font-numeric text-4xl font-bold" style={{ color: 'var(--chalk)' }}>
              {weeklySummary.sessionCount}
            </h2>
            <p className="text-[9px] font-body mt-1" style={{ color: 'var(--chalk-muted)' }}>
              Target: 3 sesi / minggu
            </p>
          </div>
        </div>

        {/* Card 2: Volume */}
        <div
          className="p-5 rounded-2xl border relative overflow-hidden"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div
            className="absolute top-0 right-0 w-24 h-24 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(232,67,44,0.15) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }}
          />
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-[9px] font-bold uppercase tracking-wider font-display" style={{ color: 'var(--chalk-muted)' }}>
                Tonase Volume
              </p>
              <p className="text-[9px] font-body" style={{ color: 'rgba(255,255,255,0.3)' }}>Minggu ini</p>
            </div>
            <div className="p-2.5 rounded-xl" style={{ backgroundColor: 'rgba(232,67,44,0.1)' }}>
              <Flame className="w-4 h-4" style={{ color: 'var(--intensity)' }} />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="font-numeric text-4xl font-bold" style={{ color: 'var(--chalk)' }}>
              {weeklySummary.totalVolumeKg.toLocaleString('id-ID')}
              <span className="text-sm font-body font-normal ml-1" style={{ color: 'var(--chalk-muted)' }}>kg</span>
            </h2>
            <p className="text-[9px] font-body mt-1" style={{ color: 'var(--chalk-muted)' }}>
              Total beban yang dipindahkan
            </p>
          </div>
        </div>

        {/* Card 3: Konsistensi */}
        <div
          className="p-5 rounded-2xl border relative overflow-hidden"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div
            className="absolute top-0 right-0 w-24 h-24 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(99,179,237,0.12) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }}
          />
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-[9px] font-bold uppercase tracking-wider font-display" style={{ color: 'var(--chalk-muted)' }}>
                Konsistensi
              </p>
              <p className="text-[9px] font-body" style={{ color: 'rgba(255,255,255,0.3)' }}>Jadwal latihan</p>
            </div>
            <div className="p-2.5 rounded-xl" style={{ backgroundColor: 'rgba(99,179,237,0.1)' }}>
              <TrendingUp className="w-4 h-4" style={{ color: '#63B3ED' }} />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="font-numeric text-4xl font-bold" style={{ color: 'var(--chalk)' }}>
              {weeklySummary.consistencyPercent}
              <span className="text-sm font-body font-normal ml-0.5" style={{ color: 'var(--chalk-muted)' }}>%</span>
            </h2>
            <p className="text-[9px] font-body mt-1" style={{ color: 'var(--chalk-muted)' }}>
              Kepatuhan terhadap rencana
            </p>
          </div>
        </div>
      </div>

      {/* ── CHARTS ROW ── */}
      <div className="grid grid-cols-1 gap-5">
        <div>
          <WeeklyVolumeChart data={dailyChartData} />
        </div>
        <div>
          <ConsistencyGrid data={consistencyGridData} />
        </div>
      </div>

      {/* ── PERSONAL RECORDS ── */}
      <div
        className="p-6 rounded-2xl border space-y-5"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(76,175,80,0.12)' }}>
              <Trophy className="w-4 h-4" style={{ color: 'var(--progress)' }} />
            </div>
            <div>
              <h3 className="font-display text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--chalk)' }}>
                Rekor Pribadi (PR)
              </h3>
              <p className="text-[9px] font-body" style={{ color: 'var(--chalk-muted)' }}>
                Pencapaian tertinggi per gerakan
              </p>
            </div>
          </div>
          {personalRecords.length > 0 && (
            <Link
              href="/history"
              className="text-[9px] font-body uppercase tracking-wider hover:opacity-70 transition-opacity"
              style={{ color: 'var(--chalk-muted)' }}
            >
              Lihat Semua →
            </Link>
          )}
        </div>

        {personalRecords.length === 0 ? (
          <div
            className="py-10 text-center rounded-xl"
            style={{ backgroundColor: 'var(--surface-raised)' }}
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: 'rgba(76,175,80,0.08)' }}>
              <Trophy className="w-5 h-5" style={{ color: 'rgba(76,175,80,0.4)' }} />
            </div>
            <p className="text-xs font-body" style={{ color: 'var(--chalk-muted)' }}>
              Belum ada rekor tercatat
            </p>
            <p className="text-[10px] font-body mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>
              Selesaikan sesi latihan pertama untuk mulai melacak PR
            </p>
            <Link
              href="/workout"
              className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-lg text-[10px] font-display font-bold uppercase tracking-wider"
              style={{ backgroundColor: 'rgba(232,67,44,0.1)', color: 'var(--intensity)', border: '1px solid rgba(232,67,44,0.2)' }}
            >
              <Zap className="w-3 h-3" />
              Catat Latihan Sekarang
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {personalRecords.map((pr) => (
              <div
                key={pr.exerciseId}
                className="p-4 rounded-xl border flex flex-col justify-between gap-3 relative overflow-hidden"
                style={{ backgroundColor: 'var(--surface-raised)', borderColor: 'var(--border)' }}
              >
                <div
                  className="absolute top-0 right-0 w-16 h-16 rounded-full pointer-events-none"
                  style={{ background: 'radial-gradient(circle, rgba(76,175,80,0.1) 0%, transparent 70%)', transform: 'translate(40%, -40%)' }}
                />
                <div>
                  <h4 className="font-display text-[10px] font-bold uppercase tracking-wide truncate" style={{ color: 'var(--chalk)' }}>
                    {pr.name}
                  </h4>
                  <p className="text-[8px] uppercase font-body tracking-widest mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    {pr.bodyPart}
                  </p>
                </div>
                <div>
                  <p className="font-numeric text-xl font-extrabold" style={{ color: 'var(--progress)' }}>
                    {pr.maxWeightKg}
                    <span className="text-xs font-normal font-body ml-0.5" style={{ color: 'var(--chalk-muted)' }}>kg</span>
                  </p>
                  <p className="text-[9px] font-body" style={{ color: 'var(--chalk-muted)' }}>
                    {pr.repsAtMax} reps
                  </p>
                  <p className="text-[8px] font-body mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
                    {new Date(pr.dateAchieved).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
