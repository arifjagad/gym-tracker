'use client'

import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react'

// ──────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────
export type ToastVariant = 'info' | 'success' | 'warning' | 'error'

export interface Toast {
  id: string
  message: string
  variant: ToastVariant
  duration?: number
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant, duration?: number) => void
}

// ──────────────────────────────────────────────────────────
// Context
// ──────────────────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue | null>(null)

// ──────────────────────────────────────────────────────────
// Config
// ──────────────────────────────────────────────────────────
const VARIANT_CONFIG: Record<ToastVariant, {
  icon: React.ElementType
  bg: string
  border: string
  iconColor: string
  textColor: string
}> = {
  info: {
    icon: Info,
    bg: 'rgba(30, 30, 40, 0.95)',
    border: 'rgba(255,255,255,0.08)',
    iconColor: 'var(--intensity)',
    textColor: 'var(--chalk)',
  },
  success: {
    icon: CheckCircle2,
    bg: 'rgba(20, 40, 25, 0.95)',
    border: 'rgba(124, 154, 92, 0.3)',
    iconColor: 'var(--progress)',
    textColor: 'var(--chalk)',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'rgba(40, 32, 10, 0.95)',
    border: 'rgba(245, 158, 11, 0.3)',
    iconColor: '#f59e0b',
    textColor: 'var(--chalk)',
  },
  error: {
    icon: AlertCircle,
    bg: 'rgba(40, 15, 15, 0.95)',
    border: 'rgba(239, 68, 68, 0.3)',
    iconColor: '#ef4444',
    textColor: 'var(--chalk)',
  },
}

// ──────────────────────────────────────────────────────────
// Single Toast Item
// ──────────────────────────────────────────────────────────
function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const config = VARIANT_CONFIG[toast.variant]
  const Icon = config.icon

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl animate-in slide-in-from-top-4 fade-in duration-300 max-w-[360px] w-full pointer-events-auto"
      style={{
        backgroundColor: config.bg,
        border: `1px solid ${config.border}`,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}
    >
      <Icon
        className="w-4 h-4 flex-shrink-0"
        style={{ color: config.iconColor }}
        strokeWidth={2.5}
      />
      <p
        className="flex-1 text-[12px] font-body leading-snug"
        style={{ color: config.textColor }}
      >
        {toast.message}
      </p>
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 p-0.5 rounded-full opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
        style={{ color: 'var(--chalk-muted)' }}
        aria-label="Tutup notifikasi"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

// ──────────────────────────────────────────────────────────
// Provider (wrap this around your app/layout)
// ──────────────────────────────────────────────────────────
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const MAX_TOASTS = 3

  const toast = useCallback(
    (message: string, variant: ToastVariant = 'info', duration = 3000) => {
      setToasts((prev) => {
        // Limit: jangan tambah jika sudah mencapai maksimal
        if (prev.length >= MAX_TOASTS) return prev
        // Dedup: jangan tambah jika pesan yang sama sudah tampil
        if (prev.some((t) => t.message === message && t.variant === variant)) return prev

        const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
        const timer = setTimeout(() => removeToast(id), duration)
        timers.current.set(id, timer)

        return [...prev, { id, message, variant, duration }]
      })
    },
    [removeToast]
  )

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Toast Portal - fixed top center */}
      <div
        className="fixed top-16 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 items-center pointer-events-none w-full px-4"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// ──────────────────────────────────────────────────────────
// Hook
// ──────────────────────────────────────────────────────────
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a <ToastProvider>')
  return ctx
}
