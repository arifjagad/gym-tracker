'use client'

import { useRef } from 'react'
import { tapFeedback } from '@/lib/animations'

/**
 * Hook reusable untuk tap feedback di semua tombol & badge interaktif.
 * Ref: Frontend Design.md § Motion > 6. Tap feedback
 *
 * Usage:
 * ```tsx
 * const { ref, onPointerDown } = useTapFeedback()
 * <button ref={ref} onPointerDown={onPointerDown}>Simpan</button>
 * ```
 */
export function useTapFeedback() {
  const ref = useRef<HTMLButtonElement>(null)
  const onPointerDown = () => ref.current && tapFeedback(ref.current)
  return { ref, onPointerDown }
}
