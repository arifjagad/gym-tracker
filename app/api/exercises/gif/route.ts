import { NextResponse } from 'next/server'

/**
 * API GET /api/exercises/gif?url=<gif_url>
 * Digunakan sebagai proxy server-side untuk mengambil GIF gerakan bebas watermark dari repositori GitHub
 * publik (sebagai mirror bersih). Jika tidak ditemukan, otomatis fallback kembali ke API berbayar.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const gifUrl = searchParams.get('url')

  if (!gifUrl) {
    return new Response('Missing url parameter', { status: 400 })
  }

  try {
    // Ekstrak ID gerakan dari URL aslinya (contoh: https://api.workoutxapp.com/v1/gifs/0001.gif -> "0001")
    const urlParts = gifUrl.split('/')
    const lastPart = urlParts[urlParts.length - 1]
    const cleanId = lastPart.replace('.gif', '').padStart(4, '0')

    // Gunakan mirror GitHub bebas watermark dari omercotkd/exercises-gifs
    const cleanGithubUrl = `https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/${cleanId}.gif`

    const res = await fetch(cleanGithubUrl, {
      method: 'GET',
    })

    // Jika mirror GitHub gagal/tidak ditemukan (404), fallback ke API WorkoutX berbayar (dengan watermark)
    if (!res.ok) {
      console.warn(`[GIF Proxy] Gagal mengambil GIF bebas watermark untuk ID ${cleanId} dari GitHub. Menggunakan API utama...`)
      
      const apiKey = process.env.WORKOUTX_API_KEY
      if (!apiKey) {
        return new Response('WORKOUTX_API_KEY is not configured', { status: 500 })
      }

      const backupRes = await fetch(gifUrl, {
        method: 'GET',
        headers: {
          'X-WorkoutX-Key': apiKey,
          'Accept': 'image/gif, image/*',
        },
      })

      if (!backupRes.ok) {
        return new Response(`Failed to fetch GIF from all sources: ${backupRes.status}`, { status: backupRes.status })
      }

      const contentType = backupRes.headers.get('Content-Type') || 'image/gif'
      const arrayBuffer = await backupRes.arrayBuffer()
      return new Response(Buffer.from(arrayBuffer), {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      })
    }

    const contentType = res.headers.get('Content-Type') || 'image/gif'
    const arrayBuffer = await res.arrayBuffer()
    
    return new Response(Buffer.from(arrayBuffer), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error: any) {
    return new Response(`Internal server error: ${error.message}`, { status: 500 })
  }
}
