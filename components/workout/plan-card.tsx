'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Play, Edit2, Trash2 } from 'lucide-react'
import { useTapFeedback } from '@/hooks/use-tap-feedback'
import { deletePlanAction } from '@/lib/actions/plans'

interface PlanCardProps {
  plan: {
    id: string
    name: string
    created_at: string
  }
}

export function PlanCard({ plan }: PlanCardProps) {
  const [deleting, setDeleting] = useState(false)

  const { ref: playRef, onPointerDown: playDown } = useTapFeedback()
  const { ref: editRef, onPointerDown: editDown } = useTapFeedback()
  const { ref: deleteRef, onPointerDown: deleteDown } = useTapFeedback()

  const handleDelete = async () => {
    if (!confirm(`Apakah Anda yakin ingin menghapus template "${plan.name}"?`)) return
    setDeleting(true)
    try {
      await deletePlanAction(plan.id)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus template.')
      setDeleting(false)
    }
  }

  return (
    <div
      className="p-6 rounded-xl border flex flex-col justify-between gap-4 transition-transform hover:scale-[1.01] duration-150 relative overflow-hidden"
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--border)',
        opacity: deleting ? 0.6 : 1,
      }}
    >
      <div className="space-y-1">
        <h3 className="font-display text-2xl font-bold uppercase tracking-wide leading-tight" style={{ color: 'var(--chalk)' }}>
          {plan.name}
        </h3>
        <p className="font-body text-[10px]" style={{ color: 'var(--chalk-muted)' }}>
          Dibuat: {new Date(plan.created_at).toLocaleDateString('id-ID')}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
        {/* Mulai Latihan */}
        <button
          ref={playRef}
          onPointerDown={playDown}
          disabled={deleting}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold font-display uppercase tracking-wider cursor-pointer disabled:opacity-50"
          style={{
            backgroundColor: 'var(--surface-raised)',
            color: 'var(--chalk)',
            border: '1px solid var(--border)',
          }}
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          Mulai Latihan
        </button>

        {/* Edit */}
        <Link
          href={`/workout/plans/${plan.id}/edit`}
          ref={editRef}
          onPointerDown={editDown}
          className="p-2 rounded-lg border cursor-pointer hover:bg-[--surface-raised] transition-colors"
          style={{
            borderColor: 'var(--border)',
            color: 'var(--chalk-muted)',
          }}
          title="Edit Template"
        >
          <Edit2 className="w-4 h-4" />
        </Link>

        {/* Hapus */}
        <button
          ref={deleteRef}
          onPointerDown={deleteDown}
          onClick={handleDelete}
          disabled={deleting}
          className="p-2 rounded-lg border cursor-pointer hover:bg-[--surface-raised] transition-colors disabled:opacity-50"
          style={{
            borderColor: 'var(--border)',
            color: 'var(--intensity)',
          }}
          title="Hapus Template"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
