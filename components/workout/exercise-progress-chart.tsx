'use client'

import { useState, useEffect } from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Dot } from 'recharts'
import { getExerciseHistoryProgress, ProgressDataPoint } from '@/lib/actions/history'
import { Trophy, TrendingUp } from 'lucide-react'

interface ExerciseProgressChartProps {
  exerciseId: string
}

export function ExerciseProgressChart({ exerciseId }: ExerciseProgressChartProps) {
  const [data, setData] = useState<ProgressDataPoint[]>([])
  const [metric, setMetric] = useState<'maxWeight' | 'volume'>('maxWeight')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function loadProgress() {
      if (!exerciseId) return
      setLoading(true)
      try {
        const res = await getExerciseHistoryProgress(exerciseId)
        setData(res)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadProgress()
  }, [exerciseId])

  if (loading) {
    return (
      <div className="py-16 text-center text-xs font-body" style={{ color: 'var(--chalk-muted)' }}>
        Memuat data perkembangan...
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="py-16 text-center text-xs font-body border-2 border-dashed rounded-xl" style={{ borderColor: 'var(--border)', color: 'var(--chalk-muted)' }}>
        Tidak ada data latihan historis untuk gerakan terpilih.
      </div>
    )
  }

  // Tentukan nilai maksimum untuk menandai rekor PR
  const maxWeightVal = Math.max(...data.map((d) => d.maxWeightKg))
  const maxVolumeVal = Math.max(...data.map((d) => d.totalVolumeKg))

  const peakVal = metric === 'maxWeight' ? maxWeightVal : maxVolumeVal

  // Custom Dot renderer untuk menandai PR titik tertinggi
  const RenderCustomDot = (props: any) => {
    const { cx, cy, payload } = props
    const val = metric === 'maxWeight' ? payload.maxWeightKg : payload.totalVolumeKg

    // Jika ini adalah titik tertinggi (rekor)
    if (val === peakVal && val > 0) {
      return (
        <g key={props.key}>
          <circle cx={cx} cy={cy} r={6} fill="var(--intensity)" stroke="var(--surface)" strokeWidth={2} />
          <circle cx={cx} cy={cy} r={10} fill="none" stroke="var(--intensity)" strokeWidth={1} className="animate-ping" />
        </g>
      )
    }

    return <circle key={props.key} cx={cx} cy={cy} r={4} fill="var(--chalk-muted)" stroke="var(--surface)" strokeWidth={1} />
  }

  // Custom Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload
      return (
        <div
          className="p-3 border rounded-lg text-xs space-y-1 font-body"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
            color: 'var(--chalk)',
          }}
        >
          <p className="font-bold opacity-60">{dataPoint.dateStr}</p>
          <p className="font-numeric text-sm" style={{ color: 'var(--progress)' }}>
            Max Weight: {dataPoint.maxWeightKg} kg
          </p>
          <p className="font-numeric text-xs opacity-80" style={{ color: 'var(--chalk-muted)' }}>
            Volume: {dataPoint.totalVolumeKg.toLocaleString('id-ID')} kg
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div
      className="p-6 rounded-xl border space-y-5"
      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      {/* Toggles & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" style={{ color: 'var(--progress)' }} />
          <h3 className="font-display text-lg font-bold uppercase tracking-wider" style={{ color: 'var(--chalk)' }}>
            Grafik Perkembangan
          </h3>
        </div>

        {/* Tab Metric Toggles */}
        <div className="flex gap-1.5 p-1 rounded-lg border bg-[--surface-raised]" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={() => setMetric('maxWeight')}
            className="py-1 px-3 rounded text-[10px] font-bold font-display uppercase tracking-wider cursor-pointer"
            style={{
              backgroundColor: metric === 'maxWeight' ? 'var(--surface)' : 'transparent',
              color: metric === 'maxWeight' ? 'var(--chalk)' : 'var(--chalk-muted)',
            }}
          >
            Max Weight (1RM)
          </button>
          <button
            onClick={() => setMetric('volume')}
            className="py-1 px-3 rounded text-[10px] font-bold font-display uppercase tracking-wider cursor-pointer"
            style={{
              backgroundColor: metric === 'volume' ? 'var(--surface)' : 'transparent',
              color: metric === 'volume' ? 'var(--chalk)' : 'var(--chalk-muted)',
            }}
          >
            Volume Total
          </button>
        </div>
      </div>

      {/* Chart Box */}
      <div className="w-full h-[250px] font-numeric text-[10px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 15, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(237, 233, 221, 0.05)" vertical={false} />
            <XAxis
              dataKey="formattedDate"
              stroke="var(--chalk-muted)"
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              stroke="var(--chalk-muted)"
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(237, 233, 221, 0.1)', strokeWidth: 1 }} />
            <Line
              type="monotone"
              dataKey={metric === 'maxWeight' ? 'maxWeightKg' : 'totalVolumeKg'}
              stroke={metric === 'maxWeight' ? 'var(--progress)' : 'var(--intensity)'}
              strokeWidth={2}
              dot={<RenderCustomDot />}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Peak Stat Summary Footer */}
      <div className="flex items-center gap-3 p-3 rounded-lg border text-xs font-body" style={{ backgroundColor: 'var(--surface-raised)', borderColor: 'var(--border)' }}>
        <Trophy className="w-4 h-4" style={{ color: 'var(--intensity)' }} />
        <div style={{ color: 'var(--chalk-muted)' }}>
          Rekor Pribadi Tertinggi (PR All-Time):{' '}
          <span className="font-bold font-numeric text-[--chalk]">
            {metric === 'maxWeight'
              ? `${maxWeightVal} kg`
              : `${maxVolumeVal.toLocaleString('id-ID')} kg`}
          </span>
        </div>
      </div>
    </div>
  )
}
