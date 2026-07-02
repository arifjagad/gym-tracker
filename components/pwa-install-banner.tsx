'use client'

import { useState, useEffect } from 'react'
import { Dumbbell, X, Download } from 'lucide-react'

interface PwaInstallBannerProps {
  pageKey: 'main' | 'dashboard'
}

export function PwaInstallBanner({ pageKey }: PwaInstallBannerProps) {
  const [showBanner, setShowBanner] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showIOSGuide, setShowIOSGuide] = useState(false)
  const [promptReady, setPromptReady] = useState(false)

  useEffect(() => {
    // 1. Cek jika sudah standalone (di-install)
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true

    if (isStandalone) return

    // 2. Cek frekuensi tampil (1x sehari)
    const lastPrompt = localStorage.getItem(`last_pwa_prompt_${pageKey}`)
    if (lastPrompt) {
      const diff = Date.now() - parseInt(lastPrompt, 10)
      const oneDay = 24 * 60 * 60 * 1000
      if (diff < oneDay) return
    }

    // 3. Deteksi OS
    const userAgent = window.navigator.userAgent.toLowerCase()
    const ios = /iphone|ipad|ipod/.test(userAgent)
    setIsIOS(ios)

    // Jika iOS, kita bisa tampilkan langsung karena iOS tidak memicu beforeinstallprompt
    if (ios) {
      setShowBanner(true)
    } else {
      // Jika Android, cek jika prompt sudah tersedia atau pasang listener
      if ((window as any).deferredPrompt) {
        setPromptReady(true)
        setShowBanner(true)
      } else {
        const handlePromptAvailable = () => {
          setPromptReady(true)
          setShowBanner(true)
        }
        window.addEventListener('pwa-prompt-available', handlePromptAvailable)
        return () => {
          window.removeEventListener('pwa-prompt-available', handlePromptAvailable)
        }
      }
    }
  }, [pageKey])

  const handleInstall = async () => {
    if (isIOS) {
      // Tampilkan panduan iOS Safari
      setShowIOSGuide(true)
    } else {
      // Jalankan prompt bawaan untuk Android Chrome
      const promptEvent = (window as any).deferredPrompt
      if (!promptEvent) {
        alert('Silakan ketuk menu titik tiga di browser Anda dan pilih "Instal Aplikasi" atau "Tambahkan ke Layar Utama".')
        return
      }

      promptEvent.prompt()
      const { outcome } = await promptEvent.userChoice
      console.log(`PWA install prompt outcome: ${outcome}`)
      
      // Bersihkan deferredPrompt setelah digunakan
      ;(window as any).deferredPrompt = null
      setPromptReady(false)
      
      // Tutup banner
      setShowBanner(false)
      localStorage.setItem(`last_pwa_prompt_${pageKey}`, String(Date.now()))
    }
  }

  const handleClose = () => {
    setShowBanner(false)
    // Simpan waktu penutupan agar tersembunyi selama 24 jam ke depan
    localStorage.setItem(`last_pwa_prompt_${pageKey}`, String(Date.now()))
  }

  if (!showBanner) return null

  return (
    <>
      <div 
        className="p-4 border-b flex items-center justify-between gap-3 animate-fade-in relative z-30"
        style={{ 
          backgroundColor: 'var(--surface-raised)', 
          borderColor: 'var(--border)',
          background: 'linear-gradient(to right, var(--surface), var(--surface-raised))'
        }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ 
              background: 'linear-gradient(135deg, var(--intensity), #ff6b4a)',
              boxShadow: '0 4px 10px rgba(232,67,44,0.2)' 
            }}
          >
            <Dumbbell className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider font-display animate-pulse" style={{ color: 'var(--chalk)' }}>
              Pasang GymTracker
            </h4>
            <p className="text-[10px] font-body mt-0.5" style={{ color: 'var(--chalk-muted)' }}>
              Akses instan di layar HP Anda & notifikasi latihan.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleInstall}
            className="flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl text-[10px] font-bold uppercase tracking-wider font-display text-white cursor-pointer active:scale-95 transition-transform"
            style={{ backgroundColor: 'var(--intensity)' }}
          >
            <Download className="w-3 h-3" />
            Pasang
          </button>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl active:scale-95 transition-transform"
            style={{ color: 'var(--chalk-muted)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* iOS Installation Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div 
            className="w-full max-w-[400px] rounded-2xl p-6 space-y-4 animate-slide-up border"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display font-extrabold uppercase tracking-wide text-base" style={{ color: 'var(--chalk)' }}>
                Pasang di iOS (iPhone/iPad)
              </h3>
              <button 
                onClick={() => setShowIOSGuide(false)}
                className="p-1 rounded-lg"
                style={{ color: 'var(--chalk-muted)' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="font-body text-xs leading-relaxed space-y-3" style={{ color: 'var(--chalk-muted)' }}>
              <p>Untuk menginstal GymTracker di iPhone atau iPad Anda, ikuti langkah mudah berikut:</p>
              
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px]" style={{ backgroundColor: 'var(--surface-raised)', color: 'var(--intensity)' }}>1</span>
                  <p>Ketuk tombol <strong>Share</strong> (ikon kotak dengan panah atas) di bagian bawah browser Safari Anda.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px]" style={{ backgroundColor: 'var(--surface-raised)', color: 'var(--intensity)' }}>2</span>
                  <p>Scroll ke bawah dan ketuk opsi <strong>"Tambahkan ke Layar Utama"</strong> (Add to Home Screen).</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px]" style={{ backgroundColor: 'var(--surface-raised)', color: 'var(--intensity)' }}>3</span>
                  <p>Ketuk <strong>"Tambah"</strong> (Add) di pojok kanan atas untuk menyelesaikan.</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setShowIOSGuide(false)
                handleClose()
              }}
              className="w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider font-display text-white text-center cursor-pointer active:scale-98 transition-transform"
              style={{ backgroundColor: 'var(--intensity)' }}
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  )
}
