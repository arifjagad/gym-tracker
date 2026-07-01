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
import { Activity, Dumbbell, Award, Trophy, ArrowRight, Flame } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Ambil data user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main className="p-6 text-center" style={{ color: 'var(--chalk-muted)' }}>
        Memuat data autentikasi...
      </main>
    )
  }

  // Load Data Analitik Paralel
  const [weeklySummary, dailyChartData, personalRecords, consistencyGridData] = await Promise.all([
    getWeeklyWorkoutSummary(),
    getDailyVolumeChartData(),
    getPersonalRecords(),
    getMonthlyConsistencyData(),
  ])

  const hasLogs = weeklySummary.sessionCount > 0 || personalRecords.length > 0

  return (
    <main className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-wider" style={{ color: 'var(--chalk)' }}>
            DASHBOARD UTAMA
          </h1>
          <p className="font-body text-xs" style={{ color: 'var(--chalk-muted)' }}>
            Pantau performa, grafik volume angkatan, dan pencapaian rekor gym Anda.
          </p>
        </div>

        {/* Cepat Masuk Logging */}
        <Link
          href="/workout"
          className="flex items-center gap-2 py-3 px-5 rounded-lg text-xs font-bold tracking-wider font-display uppercase cursor-pointer transition-transform hover:scale-[1.01]"
          style={{
            backgroundColor: 'var(--intensity)',
            color: 'var(--chalk)',
          }}
        >
          <Dumbbell className="w-4 h-4" />
          Mulai Latihan Baru
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* METRIC SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Jumlah Sesi */}
        <div
          className="p-5 rounded-xl border flex items-center justify-between"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--chalk-muted)' }}>
              Sesi Latihan (Minggu Ini)
            </p>
            <h2 className="font-numeric text-3xl font-bold" style={{ color: 'var(--chalk)' }}>
              {weeklySummary.sessionCount}
            </h2>
            <p className="text-[9px] font-body" style={{ color: 'var(--chalk-muted)' }}>
              Target: 3 sesi seminggu
            </p>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--surface-raised)' }}>
            <Activity className="w-6 h-6" style={{ color: 'var(--progress)' }} />
          </div>
        </div>

        {/* Card 2: Volume Angkatan */}
        <div
          className="p-5 rounded-xl border flex items-center justify-between"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--chalk-muted)' }}>
              Tonase Volume (Minggu Ini)
            </p>
            <h2 className="font-numeric text-3xl font-bold" style={{ color: 'var(--chalk)' }}>
              {weeklySummary.totalVolumeKg.toLocaleString('id-ID')} <span className="text-xs font-body font-normal opacity-60">kg</span>
            </h2>
            <p className="text-[9px] font-body" style={{ color: 'var(--chalk-muted)' }}>
              Total beban yang dipindahkan
            </p>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--surface-raised)' }}>
            <Flame className="w-6 h-6" style={{ color: 'var(--intensity)' }} />
          </div>
        </div>

        {/* Card 3: Konsistensi */}
        <div
          className="p-5 rounded-xl border flex items-center justify-between"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--chalk-muted)' }}>
              Kepatuhan Jadwal
            </p>
            <h2 className="font-numeric text-3xl font-bold" style={{ color: 'var(--chalk)' }}>
              {weeklySummary.consistencyPercent}%
            </h2>
            <p className="text-[9px] font-body" style={{ color: 'var(--chalk-muted)' }}>
              Kepatuhan terhadap rencana latihan
            </p>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--surface-raised)' }}>
            <Award className="w-6 h-6" style={{ color: 'var(--chalk-muted)' }} />
          </div>
        </div>
      </div>

      {/* DASHBOARD CHARTS & ACTIVITY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Column (Span 2) */}
        <div className="lg:col-span-2">
          <WeeklyVolumeChart data={dailyChartData} />
        </div>

        {/* Consistency Grid Column (Span 1) */}
        <div>
          <ConsistencyGrid data={consistencyGridData} />
        </div>
      </div>

      {/* PERSONAL RECORDS (PR) ROW */}
      <div
        className="p-6 rounded-xl border space-y-4"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5" style={{ color: 'var(--progress)' }} />
          <h3 className="font-display text-xl font-bold uppercase tracking-wider" style={{ color: 'var(--chalk)' }}>
            Rekor Pribadi Tertinggi (PR)
          </h3>
        </div>

        {!hasLogs || personalRecords.length === 0 ? (
          <div className="py-8 text-center text-xs font-body" style={{ color: 'var(--chalk-muted)' }}>
            Belum ada rekor pribadi terdeteksi. Selesaikan sesi latihan Anda untuk mencatat PR pertama!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {personalRecords.map((pr) => (
              <div
                key={pr.exerciseId}
                className="p-4 rounded-lg border flex flex-col justify-between space-y-3"
                style={{ backgroundColor: 'var(--surface-raised)', borderColor: 'var(--border)' }}
              >
                <div>
                  <h4 className="font-display text-sm font-bold uppercase tracking-wider truncate" style={{ color: 'var(--chalk)' }}>
                    {pr.name}
                  </h4>
                  <p className="text-[9px] uppercase font-bold tracking-widest opacity-60" style={{ color: 'var(--chalk-muted)' }}>
                    {pr.bodyPart}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="font-numeric text-xl font-extrabold" style={{ color: 'var(--progress)' }}>
                    {pr.maxWeightKg} <span className="text-xs font-normal">kg</span>
                  </p>
                  <p className="text-[10px] font-body" style={{ color: 'var(--chalk-muted)' }}>
                    Reps: {pr.repsAtMax}x
                  </p>
                  <p className="text-[9px] font-body opacity-55" style={{ color: 'var(--chalk-muted)' }}>
                    {new Date(pr.dateAchieved).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
