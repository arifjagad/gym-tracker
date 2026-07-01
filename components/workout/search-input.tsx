'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition, useEffect, useState } from 'react'
import { Search } from 'lucide-react'

export function SearchInput() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [value, setValue] = useState(searchParams.get('search') ?? '')

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      startTransition(() => {
        const params = new URLSearchParams(window.location.search)
        if (value) {
          params.set('search', value)
        } else {
          params.delete('search')
        }
        router.push(`/exercises?${params.toString()}`)
      })
    }, 300) // 300ms debounce

    return () => clearTimeout(delayDebounceFn)
  }, [value, router])

  return (
    <div className="relative w-full max-w-md">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-4 w-4" style={{ color: 'var(--chalk-muted)' }} />
      </div>
      <input
        type="text"
        placeholder="Cari gerakan olahraga... (misal: Bench Press)"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="block w-full pl-10 pr-3 py-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[--chalk-muted] text-sm font-body"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)',
          color: 'var(--chalk)',
        }}
      />
      {isPending && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-transparent" style={{ borderColor: 'var(--chalk-muted)' }}></div>
        </div>
      )}
    </div>
  )
}
