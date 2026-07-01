'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'

export interface SelectOption {
  value: string
  label: string
  sublabel?: string
}

interface SearchableSelectProps {
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  disabled?: boolean
  id?: string
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Pilih...',
  searchPlaceholder = 'Cari...',
  disabled = false,
  id,
}: SearchableSelectProps) {
  const [open, setOpen]     = useState(false)
  const [query, setQuery]   = useState('')
  const containerRef        = useRef<HTMLDivElement>(null)
  const inputRef            = useRef<HTMLInputElement>(null)

  const selected = options.find((o) => o.value === value)

  const filtered = query.trim()
    ? options.filter((o) =>
        o.label.toLowerCase().includes(query.toLowerCase()) ||
        o.sublabel?.toLowerCase().includes(query.toLowerCase())
      )
    : options

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Focus search input when opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 60)
    }
  }, [open])

  const handleSelect = useCallback((val: string) => {
    onChange(val)
    setOpen(false)
    setQuery('')
  }, [onChange])

  const handleToggle = () => {
    if (!disabled) setOpen((prev) => !prev)
  }

  return (
    <div ref={containerRef} className="relative w-full" id={id}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl text-sm font-body text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          backgroundColor: 'var(--surface-raised)',
          border: open ? '1px solid var(--chalk-muted)' : '1px solid var(--border)',
          color: selected ? 'var(--chalk)' : 'var(--chalk-muted)',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        <span className="flex-1 min-w-0">
          {selected ? (
            <span className="flex flex-col min-w-0">
              <span className="truncate font-medium">{selected.label}</span>
              {selected.sublabel && (
                <span className="truncate text-[10px]" style={{ color: 'var(--chalk-muted)' }}>
                  {selected.sublabel}
                </span>
              )}
            </span>
          ) : (
            <span>{placeholder}</span>
          )}
        </span>
        <ChevronDown
          className="w-4 h-4 flex-shrink-0 transition-transform duration-200"
          style={{
            color: 'var(--chalk-muted)',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {/* Bottom Sheet Picker */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50"
            style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
            onClick={() => { setOpen(false); setQuery('') }}
          />

          {/* Sheet */}
          <div
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50 rounded-t-3xl overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-200"
            style={{
              backgroundColor: 'var(--surface)',
              borderTop: '1px solid var(--border-strong)',
              maxHeight: '65dvh',
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full" style={{ backgroundColor: 'var(--border-strong)' }} />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
              <p className="font-display font-bold uppercase tracking-wider text-sm" style={{ color: 'var(--chalk)' }}>
                {placeholder}
              </p>
              <button
                type="button"
                onClick={() => { setOpen(false); setQuery('') }}
                className="p-1.5 rounded-lg active:opacity-70 cursor-pointer"
                style={{ color: 'var(--chalk-muted)', backgroundColor: 'var(--surface-raised)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="px-4 py-3">
              <div
                className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl"
                style={{ backgroundColor: 'var(--surface-raised)', border: '1px solid var(--border)' }}
              >
                <Search className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--chalk-muted)' }} />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="flex-1 bg-transparent text-xs font-body focus:outline-none"
                  style={{ color: 'var(--chalk)' }}
                />
                {query && (
                  <button type="button" onClick={() => setQuery('')} className="active:opacity-70 cursor-pointer" style={{ color: 'var(--chalk-muted)' }}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Options List */}
            <ul className="overflow-y-auto px-3 pb-4 flex-1 max-h-[40dvh]">
              {filtered.length === 0 ? (
                <li className="py-8 text-center text-xs font-body" style={{ color: 'var(--chalk-muted)' }}>
                  Tidak ada hasil untuk &quot;{query}&quot;
                </li>
              ) : (
                filtered.map((opt) => {
                  const isSelected = opt.value === value
                  return (
                    <li key={opt.value}>
                      <button
                        type="button"
                        onClick={() => handleSelect(opt.value)}
                        className="w-full flex flex-col justify-center px-4 py-3 rounded-2xl mb-1 text-left transition-colors cursor-pointer"
                        style={{
                          backgroundColor: isSelected ? 'rgba(232,67,44,0.1)' : 'var(--surface-raised)',
                          border: isSelected ? '1px solid rgba(232,67,44,0.3)' : '1px solid transparent',
                        }}
                      >
                        <span className="font-medium text-sm truncate block" style={{ color: isSelected ? 'var(--intensity)' : 'var(--chalk)' }}>
                          {opt.label}
                        </span>
                        {opt.sublabel && (
                          <span className="text-[10px] truncate block mt-0.5" style={{ color: 'var(--chalk-muted)' }}>
                            {opt.sublabel}
                          </span>
                        )}
                      </button>
                    </li>
                  )
                })
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}
