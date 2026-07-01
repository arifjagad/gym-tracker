const BASE_URL = 'https://api.workoutxapp.com/v1'

export interface WorkoutXExercise {
  id: string
  name: string
  bodyPart?: string
  body_part?: string // fallback
  target?: string
  equipment?: string
  gifUrl?: string
  gif_url?: string // fallback
  instructions?: string[]
}

/**
 * WorkoutX API Client Wrapper.
 * Digunakan untuk melakukan fetch catalog gerakan dari WorkoutX.
 */
export async function fetchExercises(
  limit: number = 10,
  offset: number = 0
): Promise<WorkoutXExercise[]> {
  const apiKey = process.env.WORKOUTX_API_KEY
  if (!apiKey) {
    throw new Error('WORKOUTX_API_KEY tidak dikonfigurasi di environment variables.')
  }

  const url = `${BASE_URL}/exercises?limit=${limit}&offset=${offset}`
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-WorkoutX-Key': apiKey,
      'Accept': 'application/json',
    },
    // Menghindari cache berlebih saat sync sedang dikembangkan
    cache: 'no-store',
  })

  if (response.status === 429) {
    const errorData = await response.json().catch(() => ({}))
    const resetAt = errorData.resetAt ? new Date(errorData.resetAt).getTime() : Date.now() + 60000
    const delayMs = Math.max(1000, resetAt - Date.now() + 2000) // tambahkan 2 detik buffer
    console.warn(`[WorkoutX Client] Rate limit tercapai. Menunggu ${Math.round(delayMs / 1000)} detik sebelum mencoba kembali...`)
    await new Promise((resolve) => setTimeout(resolve, delayMs))
    return fetchExercises(limit, offset) // Coba lagi secara rekursif
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new Error(
      `Gagal memanggil WorkoutX API: ${response.status} ${response.statusText} - ${errorText}`
    )
  }

  const data = await response.json()
  
  // Pastikan mengembalikan array data exercise
  if (Array.isArray(data)) {
    return data
  }
  
  if (data && typeof data === 'object' && Array.isArray(data.data)) {
    return data.data
  }
  
  return []
}
