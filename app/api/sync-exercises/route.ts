import { NextResponse } from 'next/server'
import { syncExercises } from '@/lib/workoutx/sync'

/**
 * Endpoint API POST /api/sync-exercises untuk memicu sinkronisasi data 
 * exercise dari WorkoutX API ke database Supabase.
 */
export async function POST(request: Request) {
  try {
    // Opsional: Cek key pengaman jika didefinisikan (misal untuk cron Vercel di masa depan)
    const authHeader = request.headers.get('Authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await syncExercises()
    
    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(result, { status: 500 })
    }

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        totalSynced: 0,
        message: `Terjadi error tak terduga: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 }
    )
  }
}
