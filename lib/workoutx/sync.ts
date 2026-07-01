import { fetchExercises, WorkoutXExercise } from './client'
import { createAdminClient } from '../supabase/admin'

export interface SyncResult {
  success: boolean
  totalSynced: number
  message: string
}

/**
 * Fungsi utama untuk melakukan sinkronisasi data exercise dari WorkoutX API 
 * ke tabel `exercises` di Supabase.
 * Menggunakan admin client (service_role) untuk mengizinkan insert/upsert data publik.
 */
export async function syncExercises(): Promise<SyncResult> {
  const supabase = createAdminClient()
  let offset = 0
  const limit = 10
  let totalSynced = 0
  let continueSync = true

  console.log('Memulai sinkronisasi data exercises dari WorkoutX...');

  try {
    while (continueSync) {
      console.log(`Mengambil data exercises: limit=${limit}, offset=${offset}...`);
      const exercisesPage: WorkoutXExercise[] = await fetchExercises(limit, offset)
      
      if (exercisesPage.length === 0) {
        console.log('Tidak ada data lagi dari API. Sinkronisasi selesai.');
        break
      }

      // Format data untuk dicocokkan dengan skema database
      const formattedExercises = exercisesPage.map((ex) => ({
        id: ex.id,
        name: ex.name,
        // Mendukung penamaan camelCase dari API maupun snake_case dari database
        body_part: ex.body_part ?? ex.bodyPart ?? null,
        target: ex.target ?? null,
        equipment: ex.equipment ?? null,
        gif_url: ex.gif_url ?? ex.gifUrl ?? null,
        instructions: Array.isArray(ex.instructions) ? ex.instructions : null,
      }))

      // Bulk upsert ke Supabase
      const { error } = await supabase
        .from('exercises')
        .upsert(formattedExercises, { onConflict: 'id' })

      if (error) {
        throw new Error(`Gagal upsert ke Supabase di offset ${offset}: ${error.message}`)
      }

      totalSynced += exercisesPage.length
      console.log(`Berhasil sync ${exercisesPage.length} data. Total saat ini: ${totalSynced}`);

      // Jika data yang dikembalikan kurang dari limit, berarti ini halaman terakhir
      if (exercisesPage.length < limit) {
        console.log('Mencapai halaman terakhir dari API.');
        break
      }

      // Naikkan offset untuk halaman berikutnya
      offset += limit
      
      // Delay (500ms) untuk mencegah rate limiting atau overload
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    return {
      success: true,
      totalSynced,
      message: `Sukses menyinkronkan total ${totalSynced} data exercises.`,
    }

  } catch (error) {
    const errMessage = error instanceof Error ? error.message : String(error)
    console.error('Terjadi error saat sinkronisasi:', errMessage)
    return {
      success: false,
      totalSynced,
      message: `Sinkronisasi terhenti karena error: ${errMessage}`,
    }
  }
}
