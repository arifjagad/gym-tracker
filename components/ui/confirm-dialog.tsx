'use client'

import { AlertTriangle, Award, Info, CheckCircle } from 'lucide-react'
import { useTapFeedback } from '@/hooks/use-tap-feedback'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'success' | 'info'
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Ya',
  cancelText = 'Batal',
  type = 'info',
}: ConfirmDialogProps) {
  const { ref: cancelRef, onPointerDown: cancelDown } = useTapFeedback()
  const { ref: confirmRef, onPointerDown: confirmDown } = useTapFeedback()

  if (!isOpen) return null

  // Konfigurasi visual berdasarkan type
  let accentColor = 'var(--chalk-muted)'
  let iconBg = 'rgba(255, 255, 255, 0.05)'
  let iconColor = 'var(--chalk-muted)'
  let Icon = Info
  let confirmBg = 'var(--surface-raised)'
  let confirmBgGradient = 'none'

  if (type === 'danger' || type === 'warning') {
    accentColor = 'var(--intensity)'
    iconBg = 'rgba(232, 67, 44, 0.12)'
    iconColor = 'var(--intensity)'
    Icon = AlertTriangle
    confirmBg = 'var(--intensity)'
    confirmBgGradient = 'linear-gradient(135deg, var(--intensity), #ff5a3d)'
  } else if (type === 'success') {
    accentColor = 'var(--progress)'
    iconBg = 'rgba(76, 175, 80, 0.12)'
    iconColor = 'var(--progress)'
    Icon = Award
    confirmBg = 'var(--progress)'
    confirmBgGradient = 'linear-gradient(135deg, var(--progress), #5eb862)'
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[340px] p-5 rounded-2xl border text-center space-y-4 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border-strong)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Accent border top */}
        <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: accentColor }} />

        {/* Icon */}
        <div
          className="mx-auto w-12 h-12 rounded-full flex items-center justify-center border"
          style={{
            backgroundColor: iconBg,
            borderColor: 'rgba(255, 255, 255, 0.05)',
          }}
        >
          <Icon className="w-6 h-6" style={{ color: iconColor }} />
        </div>

        {/* Text Details */}
        <div className="space-y-1.5">
          <h4 className="font-display text-lg font-bold uppercase tracking-wider text-white">
            {title}
          </h4>
          <p className="font-body text-xs leading-relaxed" style={{ color: 'var(--chalk-muted)' }}>
            {description}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2.5 pt-2">
          <button
            ref={cancelRef}
            onPointerDown={cancelDown}
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl font-display font-bold uppercase text-[10px] tracking-wider cursor-pointer border active:scale-[0.98] transition-transform"
            style={{
              backgroundColor: 'var(--surface-raised)',
              borderColor: 'var(--border)',
              color: 'var(--chalk-muted)',
            }}
          >
            {cancelText}
          </button>
          <button
            ref={confirmRef}
            onPointerDown={confirmDown}
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl font-display font-bold uppercase text-[10px] tracking-wider cursor-pointer text-white active:scale-[0.98] transition-transform"
            style={{
              backgroundColor: confirmBg,
              backgroundImage: confirmBgGradient,
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
