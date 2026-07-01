'use client'

interface ConsistencyGridProps {
  data: { dateStr: string; hasWorkout: boolean }[]
}

const DAY_LABELS = ['S', 'S', 'R', 'K', 'J', 'S', 'M'] // Senin sampai Minggu

export function ConsistencyGrid({ data }: ConsistencyGridProps) {
  const activeDaysCount = data.filter((d) => d.hasWorkout).length

  return (
    <div
      className="p-5 rounded-xl border space-y-4"
      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div>
        <h3 className="font-display text-lg font-bold uppercase tracking-wider" style={{ color: 'var(--chalk)' }}>
          Kepatuhan Latihan
        </h3>
        <p className="text-[10px] font-body" style={{ color: 'var(--chalk-muted)' }}>
          Konsistensi workout harian dalam 4 minggu terakhir (28 hari).
        </p>
      </div>

      <div className="flex flex-col items-center justify-center py-2 space-y-3">
        {/* Label Hari */}
        <div className="grid grid-cols-7 gap-3 text-center text-[10px] font-bold font-body" style={{ color: 'var(--chalk-muted)', width: '224px' }}>
          {DAY_LABELS.map((lbl, idx) => (
            <span key={idx}>{lbl}</span>
          ))}
        </div>

        {/* Grid Blocks */}
        <div className="grid grid-cols-7 gap-3" style={{ width: '224px' }}>
          {data.map((day) => (
            <div
              key={day.dateStr}
              className="w-5 h-5 rounded transition-all duration-150 relative group"
              style={{
                backgroundColor: day.hasWorkout ? 'var(--progress)' : 'var(--surface-raised)',
                border: day.hasWorkout ? '1px solid var(--progress)' : '1px solid var(--border)',
              }}
              title={`${new Date(day.dateStr).toLocaleDateString('id-ID')}: ${day.hasWorkout ? 'Ada Latihan' : 'Tidak Ada Latihan'}`}
            >
              {/* Tooltip Hover Sederhana */}
              <div
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block p-1.5 rounded text-[8px] font-body whitespace-nowrap z-10"
                style={{
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--chalk)',
                }}
              >
                {new Date(day.dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}: {day.hasWorkout ? 'Latihan' : 'Rest'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info Ringkasan Kepatuhan */}
      <div className="pt-2 border-t text-center text-xs font-body" style={{ borderColor: 'var(--border)', color: 'var(--chalk-muted)' }}>
        Hari Latihan: <span className="font-bold" style={{ color: 'var(--progress)' }}>{activeDaysCount} hari</span> dalam 28 hari terakhir.
      </div>
    </div>
  )
}
