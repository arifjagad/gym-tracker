'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'
import { useTapFeedback } from '@/hooks/use-tap-feedback'
import { createPlanAction } from '@/lib/actions/plans'

export function CreatePlanDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const { ref: triggerRef, onPointerDown: triggerDown } = useTapFeedback()
  const { ref: submitRef, onPointerDown: submitDown } = useTapFeedback()

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    setError(null)

    try {
      const newPlan = await createPlanAction(name)
      setName('')
      setIsOpen(false)
      const cleanSlug = newPlan.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
      const shortId = newPlan.id.substring(0, 8)
      router.push(`/workout/plans/${cleanSlug}-${shortId}/edit`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat template.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        onPointerDown={triggerDown}
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-xs font-bold tracking-wider font-display uppercase cursor-pointer transition-all active:scale-[0.98] hover:opacity-95"
        style={{
          backgroundColor: 'var(--intensity)',
          color: 'var(--chalk)',
        }}
      >
        <Plus className="w-4 h-4" />
        Buat Template Baru
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div
            className="w-full max-w-[390px] p-6 rounded-xl border space-y-4 relative animate-in fade-in zoom-in-95 duration-150"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)',
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-xs cursor-pointer hover:bg-[--surface-raised]"
              style={{ color: 'var(--chalk-muted)' }}
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div>
              <h3 className="font-display text-2xl font-bold uppercase tracking-wider" style={{ color: 'var(--chalk)' }}>
                Template Latihan Baru
              </h3>
              <p className="font-body text-[11px]" style={{ color: 'var(--chalk-muted)' }}>
                Tentukan nama rencana latihan Anda (misal: Push Day, PPL, Upper Body).
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleCreate} className="space-y-4">
              {error && (
                <div
                  className="p-3 rounded text-xs font-body border"
                  style={{
                    backgroundColor: 'rgba(232, 67, 44, 0.1)',
                    borderColor: 'var(--intensity)',
                    color: 'var(--intensity)',
                  }}
                >
                  {error}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--chalk-muted)' }}>
                  Nama Template
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Split 3 Hari Seminggu"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full py-2.5 px-3 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[--chalk-muted] text-sm font-body"
                  style={{
                    backgroundColor: 'var(--surface-raised)',
                    borderColor: 'var(--border)',
                    color: 'var(--chalk)',
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold font-body cursor-pointer"
                  style={{ color: 'var(--chalk-muted)' }}
                >
                  Batal
                </button>
                <button
                  ref={submitRef}
                  onPointerDown={submitDown}
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-lg text-xs font-bold font-display uppercase tracking-wider cursor-pointer"
                  style={{
                    backgroundColor: 'var(--intensity)',
                    color: 'var(--chalk)',
                  }}
                >
                  {loading ? 'Membuat...' : 'Buat & Susun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
