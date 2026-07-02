'use client'

import { useEffect } from 'react'

export function PwaRegister() {
  useEffect(() => {
    // 1. Registrasi Service Worker PWA
    if ('serviceWorker' in navigator) {
      // Registrasi sw.js baik di localhost (dev) maupun di https (prod)
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('PWA Service Worker registered on scope:', reg.scope)
        })
        .catch((err) => {
          console.error('PWA Service Worker failed:', err)
        })
    }

    // 2. Minta Ijin Notifikasi Lokal
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
        .then((permission) => {
          console.log('Notification permission status:', permission)
        })
    }

    // 3. Tangkap event beforeinstallprompt untuk kustom banner
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      ;(window as any).deferredPrompt = e
      window.dispatchEvent(new CustomEvent('pwa-prompt-available'))
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  return null
}

export function sendLocalNotification(title: string, body: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/icon.svg',
      })
    } catch (e) {
      // Fallback untuk mobile browser yang mengharuskan pemanggilan melalui Service Worker
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification(title, {
            body,
            icon: '/icon.svg',
          })
        }).catch((err) => console.error(err))
      }
    }
  }
}
