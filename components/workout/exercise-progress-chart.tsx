'use client'

import { useState, useEffect } from 'react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { getExerciseHistoryProgress, ProgressDataPoint } from '@/lib/actions/history'
import { Trophy, TrendingUp } from 'lucide-react'

interface ExerciseProgressChartProps {
  exerciseId: string
}

export function ExerciseProgressChart({ exerciseId }: ExerciseProgressChartProps) {
  const [data, setData] = useState<ProgressDataPoint[]>([])
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

  const maxWeightVal = Math.max(...data.map((d) => d.maxWeightKg))

  // Custom Dot renderer untuk menandai PR titik tertinggi
  const RenderCustomDot = (props: any) => {
    const { cx, cy, payload } = props
    if (!cx || !cy) return null
    const val = payload.maxWeightKg

    // Jika ini adalah titik tertinggi (rekor)
    if (val === maxWeightVal && val > 0) {
      const color = 'var(--progress)'
      return (
        <g key={props.key}>
          <circle cx={cx} cy={cy} r={5} fill={color} stroke="var(--surface)" strokeWidth={2} />
          <circle 
            cx={cx} 
            cy={cy} 
            r={9} 
            fill="none" 
            stroke={color} 
            strokeWidth={1} 
            className="animate-ping" 
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          />
        </g>
      )
    }

    return <circle key={props.key} cx={cx} cy={cy} r={3.5} fill="var(--border-strong)" stroke="var(--surface)" strokeWidth={1.5} />
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
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" style={{ color: 'var(--progress)' }} />
          <h3 className="font-display text-lg font-bold uppercase tracking-wider" style={{ color: 'var(--chalk)' }}>
            Grafik Perkembangan
          </h3>
        </div>
      </div>

      {/* Chart Box */}
      <div className="w-full h-[250px] font-numeric text-[10px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 15, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="colorHistoryMetric" x1="0" y1="0" x2="0" y2="1">
                <stop 
                  offset="5%" 
                  stopColor="var(--progress)" 
                  stopOpacity={0.2}
                />
                <stop 
                  offset="95%" 
                  stopColor="var(--progress)" 
                  stopOpacity={0.0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.03)" vertical={false} />
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
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255, 255, 255, 0.04)', strokeWidth: 1 }} />
            <Area
              type="monotone"
              dataKey="maxWeightKg"
              stroke="var(--progress)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorHistoryMetric)"
              dot={<RenderCustomDot />}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Peak Stat Summary Footer */}
      <div className="flex items-center gap-3 p-3 rounded-lg border text-xs font-body animate-in fade-in duration-200" style={{ backgroundColor: 'var(--surface-raised)', borderColor: 'var(--border)' }}>
        <Trophy className="w-4 h-4" style={{ color: 'var(--intensity)' }} />
        <div style={{ color: 'var(--chalk-muted)' }}>
          Rekor Pribadi Tertinggi (PR All-Time):{' '}
          <span className="font-bold font-numeric text-[--chalk]">
            {maxWeightVal} kg
          </span>
        </div>
      </div>
    </div>
  )
}
