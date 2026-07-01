'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  Dumbbell,
  History,
  Library,
  Settings,
  LogOut,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard',  label: 'Beranda',  icon: LayoutDashboard },
  { href: '/history',    label: 'Riwayat',  icon: History          },
  { href: '/workout',    label: 'Catat',    icon: Dumbbell,  cta: true },
  { href: '/exercises',  label: 'Gerakan',  icon: Library          },
  { href: '/settings',   label: 'Setelan',  icon: Settings         },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div
      className="flex flex-col min-h-dvh"
      style={{ backgroundColor: 'var(--bg-base)' }}
    >
      {/* ── TOP HEADER (mobile) ── */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-4 h-14 border-b"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'var(--intensity)', boxShadow: '0 0 14px rgba(232,67,44,0.35)' }}
          >
            <Dumbbell className="w-3.5 h-3.5 text-white" />
          </div>
          <span
            className="font-display font-extrabold uppercase tracking-widest text-[13px]"
            style={{ color: 'var(--chalk)' }}
          >
            GymTracker
          </span>
        </div>

        {/* Actions Row */}
        <div className="flex items-center gap-1">
          <Link href="/settings" className="p-2" style={{ color: 'var(--chalk-muted)' }} title="Setelan">
            <Settings className="w-4.5 h-4.5" />
          </Link>
          <button
            onClick={handleLogout}
            className="p-2 cursor-pointer transition-opacity hover:opacity-85"
            style={{ color: 'var(--chalk-muted)' }}
            title="Keluar"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </header>

      {/* ── SCROLLABLE PAGE CONTENT ── */}
      <main className="flex-1 overflow-y-auto pb-24">
        {children}
      </main>

      {/* ── BOTTOM NAVIGATION BAR ── */}
      <nav
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50 border-t"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="flex items-center justify-around px-2 h-16">
          {NAV_ITEMS.map(({ href, label, icon: Icon, cta }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))

            if (cta) {
              return (
                <Link
                  key={href}
                  href={href}
                  className="flex flex-col items-center justify-center -mt-5"
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform active:scale-95"
                    style={{
                      background: 'linear-gradient(135deg, var(--intensity), #ff6b4a)',
                      boxShadow: '0 4px 24px rgba(232,67,44,0.45)',
                    }}
                  >
                    <Icon className="w-6 h-6 text-white" strokeWidth={2.5} />
                  </div>
                  <span
                    className="text-[9px] font-bold font-display uppercase tracking-wider mt-1.5"
                    style={{ color: active ? 'var(--intensity)' : 'var(--chalk-muted)' }}
                  >
                    {label}
                  </span>
                </Link>
              )
            }

            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-xl transition-colors"
              >
                <Icon
                  className="w-5 h-5 transition-all"
                  strokeWidth={active ? 2.5 : 1.8}
                  style={{ color: active ? 'var(--intensity)' : 'var(--chalk-muted)' }}
                />
                <span
                  className="text-[9px] font-bold font-display uppercase tracking-wider"
                  style={{ color: active ? 'var(--intensity)' : 'var(--chalk-muted)' }}
                >
                  {label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
