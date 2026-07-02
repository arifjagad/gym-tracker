import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'GymTracker',
    short_name: 'GymTracker',
    description: 'Catat sesi latihan gym harian Anda secara terstruktur.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#020202',
    theme_color: '#e8432c',
    icons: [
      {
        src: '/icon.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icon.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  }
}
