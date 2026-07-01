'use client'

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { ChartDayData } from '@/lib/actions/stats'

interface WeeklyVolumeChartProps {
  data: ChartDayData[]
}

export function WeeklyVolumeChart({ data }: WeeklyVolumeChartProps) {
  // Cek apakah ada data latihan terisi
  const hasData = data.some((d) => d.volume > 0)

  if (!hasData) {
    return (
      <div
        className="w-full h-[250px] rounded-xl border flex flex-col items-center justify-center text-center p-6 space-y-2"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <p className="text-xs font-body" style={{ color: 'var(--chalk-muted)' }}>
          Belum ada data angkatan untuk grafik volume mingguan.
        </p>
        <p className="text-[10px] font-body" style={{ color: 'var(--chalk-muted)' }}>
          Mulailah mencatat set latihan Anda hari ini di menu catat latihan.
        </p>
      </div>
    )
  }

  // Custom Tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="p-3 border rounded-lg text-xs space-y-1 font-body"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
            color: 'var(--chalk)',
          }}
        >
          <p className="font-bold opacity-65">{payload[0].payload.dayLabel}</p>
          <p className="font-numeric text-sm" style={{ color: 'var(--intensity)' }}>
            Volume: {payload[0].value.toLocaleString('id-ID')} kg
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div
      className="p-5 rounded-xl border space-y-4"
      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div>
        <h3 className="font-display text-lg font-bold uppercase tracking-wider" style={{ color: 'var(--chalk)' }}>
          Tren Volume Latihan
        </h3>
        <p className="text-[10px] font-body" style={{ color: 'var(--chalk-muted)' }}>
          Total beban dipindahkan per hari (Beban × Reps) dalam 7 hari terakhir.
        </p>
      </div>

      <div className="w-full h-[230px] font-numeric text-[10px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--intensity)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="var(--intensity)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(237, 233, 221, 0.05)" vertical={false} />
            <XAxis
              dataKey="dayLabel"
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
            <Area
              type="monotone"
              dataKey="volume"
              stroke="var(--intensity)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorVolume)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
