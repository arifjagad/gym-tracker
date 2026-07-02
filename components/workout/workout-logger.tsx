'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Timer, Dumbbell, Award, ArrowRight, AlertTriangle } from 'lucide-react'
import { useTapFeedback } from '@/hooks/use-tap-feedback'
import { ExerciseLoggerCard } from './exercise-logger-card'
import { createClient } from '@/lib/supabase/client'
import { deleteWorkoutSessionAction } from '@/lib/actions/workout'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

interface ExerciseDetail {
  id: string
  name: string
  body_part: string | null
  target: string | null
  equipment: string | null
  gif_url: string | null
}

interface PlanExercise {
  exercise_id: string
  exercises: ExerciseDetail
}

interface PlanCategory {
  id: string
  category_name: string
  day_of_week: string | null
  plan_exercises: PlanExercise[]
}

interface WorkoutLoggerProps {
  session: {
    id: string
    plan_id: string | null
    workout_date: string
    created_at: string
  }
  planDetails: {
    id: string
    name: string
    plan_categories: PlanCategory[]
  } | null
}

export function WorkoutLogger({ session, planDetails }: WorkoutLoggerProps) {
  const router = useRouter()
  const supabase = createClient()
  
  // Deteksi kategori default berdasarkan hari aktif
  const daysMapping = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu']
  const todayDay = daysMapping[new Date().getDay()]
  
  const categories = planDetails?.plan_categories || []
  
  // Set tab aktif ke kategori yang sesuai dengan hari ini, atau fallback ke kategori pertama
  const initialTab = categories.find((c) => c.day_of_week === todayDay)?.id || categories[0]?.id || null
  const [activeTabId, setActiveTabId] = useState<string | null>(initialTab)

  const [seconds, setSeconds] = useState(0)
  const [isSessionCompleted, setIsSessionCompleted] = useState(false)
  const [showFinishConfirm, setShowFinishConfirm] = useState(false)
  const [showRestartConfirm, setShowRestartConfirm] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const completed = localStorage.getItem(`completed_session_${session.id}`) === 'true'
      setIsSessionCompleted(completed)
    }
  }, [session.id])

  useEffect(() => {
    // Hitung durasi awal berdasarkan selisih waktu dibuat
    const startMs = new Date(session.created_at).getTime()
    const updateTimer = () => {
      const nowMs = Date.now()
      const diffSec = Math.max(0, Math.floor((nowMs - startMs) / 1000))
      setSeconds(diffSec)
    }
    
    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [session.created_at])

  // Formatter Waktu: HH:MM:SS
  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600)
    const mins = Math.floor((totalSeconds % 3600) / 60)
    const secs = totalSeconds % 60
    return [
      hrs > 0 ? String(hrs).padStart(2, '0') : null,
      String(mins).padStart(2, '0'),
      String(secs).padStart(2, '0'),
    ].filter(Boolean).join(':')
  }

  const { ref: finishRef, onPointerDown: finishDown } = useTapFeedback()

  // Selesaikan Sesi Latihan - pemicu dialog konfirmasi kustom
  const handleFinishSession = () => {
    setShowFinishConfirm(true)
  }

  // Aksi eksekusi penyelesaian sesi setelah dikonfirmasi di modal kustom
  const confirmFinishSession = async () => {
    setShowFinishConfirm(false)
    
    // Cek apakah ada logs yang terisi di session ini
    const { count, error } = await supabase
      .from('workout_logs')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', session.id)

    if (!error && (count === null || count === 0)) {
      // Jika 0 logs, hapus sesi agar user tidak terkunci pada logger kosong
      try {
        await deleteWorkoutSessionAction(session.id)
        router.push('/workout')
        router.refresh()
      } catch (err) {
        console.error(err)
      }
    } else {
      // Jika ada logs, simpan status selesai
      localStorage.setItem(`completed_session_${session.id}`, 'true')
      setIsSessionCompleted(true)
    }
  }

  // Aksi eksekusi restart sesi latihan setelah dikonfirmasi
  const confirmRestartSession = async () => {
    setShowRestartConfirm(false)
    try {
      await deleteWorkoutSessionAction(session.id)
      localStorage.removeItem(`completed_session_${session.id}`)
      setIsSessionCompleted(false)
      router.push('/workout')
      router.refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal merestart latihan.')
    }
  }

  if (isSessionCompleted) {
    return (
      <div className="py-12 px-4 max-w-md mx-auto text-center space-y-8 animate-in fade-in zoom-in-95 duration-300">
        {/* Trophy Animation / Banner */}
        <div className="relative py-10 px-6 rounded-3xl border shadow-xl overflow-hidden"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border-strong)',
          }}
        >
          <div className="absolute inset-0 bg-radial-gradient from-[rgba(76,175,80,0.15)] to-transparent opacity-60 pointer-events-none" />
          
          <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center bg-[rgba(76,175,80,0.12)] border border-[rgba(76,175,80,0.2)] mb-4">
            <Award className="w-10 h-10" style={{ color: 'var(--progress)' }} />
          </div>

          <h2 className="font-display text-3xl font-extrabold uppercase tracking-wider text-white">
            LATIHAN SELESAI!
          </h2>
          <p className="font-body text-xs mt-1.5 max-w-xs mx-auto animate-pulse" style={{ color: 'var(--chalk-muted)' }}>
            Luar biasa! Sesi latihan Anda hari ini telah berhasil direkam ke dalam database.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl border text-center" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
            <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--chalk-muted)' }}>Durasi</p>
            <p className="font-numeric text-xl font-extrabold text-white mt-1">{formatTime(seconds)}</p>
          </div>
          <div className="p-4 rounded-2xl border text-center" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
            <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--chalk-muted)' }}>Template</p>
            <p className="font-display text-xs font-bold uppercase truncate text-white mt-1.5">{planDetails?.name || 'Latihan Bebas'}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-display font-bold uppercase tracking-wider text-xs text-white active:scale-[0.98] transition-all cursor-pointer"
            style={{
              backgroundColor: 'var(--intensity)',
              backgroundImage: 'linear-gradient(135deg, var(--intensity), #ff5a3d)',
            }}
          >
            Kembali ke Beranda
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setShowRestartConfirm(true)}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-display font-bold uppercase tracking-wider text-xs active:scale-[0.98] transition-all cursor-pointer"
            style={{
              backgroundColor: 'var(--surface-raised)',
              color: 'var(--chalk-muted)',
              border: '1px solid var(--border)',
            }}
          >
            Mulai Latihan Baru Hari Ini
          </button>
        </div>

        {/* Reusable Restart Confirmation Modal inside summary */}
        <ConfirmDialog
          isOpen={showRestartConfirm}
          onClose={() => setShowRestartConfirm(false)}
          onConfirm={confirmRestartSession}
          title="Mulai Ulang Sesi?"
          description="Ini akan menghapus seluruh catatan latihan hari ini dan memulai sesi baru. Tindakan ini bersifat permanen."
          type="danger"
          confirmText="Ya, Mulai Baru"
          cancelText="Batal"
        />
      </div>
    )
  }

  const activeCategory = categories.find((c) => c.id === activeTabId)

  return (
    <div className="space-y-6">
      {/* Logger Header & Timer */}
      <div className="p-6 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--intensity)' }}>
            SESI LATIHAN AKTIF
          </span>
          <h2 className="font-display text-3xl font-bold uppercase tracking-wider" style={{ color: 'var(--chalk)' }}>
            {planDetails?.name || 'Latihan Bebas'}
          </h2>
          <p className="font-body text-xs" style={{ color: 'var(--chalk-muted)' }}>
            Tanggal: {new Date(session.workout_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Stopwatch */}
        <div className="flex items-center gap-3 py-2 px-4 rounded-lg border font-numeric text-2xl font-bold tracking-wider" style={{ backgroundColor: 'var(--surface-raised)', borderColor: 'var(--border)', color: 'var(--chalk)' }}>
          <Timer className="w-5 h-5" style={{ color: 'var(--chalk-muted)' }} />
          {formatTime(seconds)}
        </div>
      </div>

      {/* Tabs Kategori Otot / Hari */}
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2 p-1.5 rounded-lg border overflow-x-auto" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveTabId(cat.id)}
              className="py-2 px-4 rounded-md text-xs font-bold font-display uppercase tracking-wider cursor-pointer transition-colors"
              style={{
                backgroundColor: activeTabId === cat.id ? 'var(--surface-raised)' : 'transparent',
                color: activeTabId === cat.id ? 'var(--chalk)' : 'var(--chalk-muted)',
                border: activeTabId === cat.id ? '1px solid var(--border)' : '1px solid transparent',
              }}
            >
              {cat.category_name} {cat.day_of_week ? `(${cat.day_of_week})` : ''}
            </button>
          ))}
        </div>
      )}

      {/* Daftar Gerakan dalam Kategori Aktif */}
      {!activeCategory || activeCategory.plan_exercises.length === 0 ? (
        <div className="p-16 rounded-xl border text-center space-y-4" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="p-4 rounded-full flex items-center justify-center inline-flex" style={{ backgroundColor: 'var(--surface-raised)' }}>
            <Dumbbell className="w-8 h-8" style={{ color: 'var(--chalk-muted)' }} />
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-xl font-bold uppercase tracking-wider" style={{ color: 'var(--chalk)' }}>
              Tidak Ada Gerakan
            </h3>
            <p className="font-body text-xs max-w-sm mx-auto" style={{ color: 'var(--chalk-muted)' }}>
              Silakan isi gerakan latihan untuk kategori harian ini terlebih dahulu di modul editor template.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {activeCategory.plan_exercises.map((pe) => (
            <ExerciseLoggerCard
              key={pe.exercise_id}
              exercise={pe.exercises}
              sessionId={session.id}
            />
          ))}
        </div>
      )}

      {/* Tombol Selesaikan Sesi Latihan */}
      <div className="pt-4 flex justify-end">
        <button
          ref={finishRef}
          onPointerDown={finishDown}
          onClick={handleFinishSession}
          className="flex items-center gap-2 py-3.5 px-8 rounded-lg text-xs font-bold tracking-wider font-display uppercase cursor-pointer transition-colors hover:opacity-90"
          style={{
            backgroundColor: 'var(--progress)', // Warna lumut progress
            color: 'var(--surface)',
          }}
        >
          <Award className="w-4 h-4" />
          Selesaikan Sesi Latihan
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Reusable Finish Confirmation Modal */}
      <ConfirmDialog
        isOpen={showFinishConfirm}
        onClose={() => setShowFinishConfirm(false)}
        onConfirm={confirmFinishSession}
        title="Selesaikan Latihan?"
        description="Apakah Anda yakin ingin menyelesaikan sesi latihan hari ini?"
        type="success"
        confirmText="Ya, Selesai!"
        cancelText="Batal"
      />

      {/* Reusable Restart Confirmation Modal */}
      <ConfirmDialog
        isOpen={showRestartConfirm}
        onClose={() => setShowRestartConfirm(false)}
        onConfirm={confirmRestartSession}
        title="Mulai Ulang Sesi?"
        description="Ini akan menghapus seluruh catatan latihan hari ini dan memulai sesi baru. Tindakan ini bersifat permanen."
        type="danger"
        confirmText="Ya, Mulai Baru"
        cancelText="Batal"
      />
    </div>
  )
}
