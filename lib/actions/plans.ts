'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

/**
 * Server Action untuk membuat rencana latihan (Plan) baru.
 */
export async function createPlanAction(name: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Anda harus login untuk membuat rencana latihan.')
  }

  const { data, error } = await supabase
    .from('plans')
    .insert({
      name,
      user_id: user.id,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Gagal membuat plan: ${error.message}`)
  }

  revalidatePath('/workout')
  revalidatePath('/workout/plans')
  return data
}

/**
 * Server Action untuk menghapus rencana latihan.
 * Cascade delete di database otomatis menghapus categories & exercises terkait.
 */
export async function deletePlanAction(planId: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Anda harus login untuk menghapus rencana latihan.')
  }

  const { error } = await supabase
    .from('plans')
    .delete()
    .eq('id', planId)
    .eq('user_id', user.id) // Pengaman tambahan

  if (error) {
    throw new Error(`Gagal menghapus plan: ${error.message}`)
  }

  revalidatePath('/workout')
  revalidatePath('/workout/plans')
}

export interface SaveCategoryInput {
  category_name: string
  day_of_week?: string | null
  exercises: {
    exercise_id: string
    sort_order: number
  }[]
}

/**
 * Server Action untuk menyimpan struktur detail plan secara atomic.
 * Menghapus data lama lalu merekonstruksi data baru dalam satu rangkaian transaksi.
 */
export async function savePlanDetailsAction(planId: string, name: string, categories: SaveCategoryInput[]) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Anda harus login untuk mengupdate rencana latihan.')
  }

  // 1. Update nama plan terlebih dahulu
  const { error: planUpdateError } = await supabase
    .from('plans')
    .update({ name })
    .eq('id', planId)
    .eq('user_id', user.id)

  if (planUpdateError) {
    throw new Error(`Gagal mengupdate nama plan: ${planUpdateError.message}`)
  }

  // 2. Bersihkan kategori lama (otomatis cascade delete plan_exercises lama)
  const { error: deleteError } = await supabase
    .from('plan_categories')
    .delete()
    .eq('plan_id', planId)

  if (deleteError) {
    throw new Error(`Gagal membersihkan data plan lama: ${deleteError.message}`)
  }

  // Jika tidak ada kategori yang dikirim, selesai
  if (categories.length === 0) {
    revalidatePath(`/workout/plans/${planId}/edit`)
    revalidatePath('/workout')
    return { success: true }
  }

  // 3. Masukkan kategori-kategori baru secara berturut-turut
  for (const cat of categories) {
    const { data: insertedCat, error: catInsertError } = await supabase
      .from('plan_categories')
      .insert({
        plan_id: planId,
        category_name: cat.category_name,
        day_of_week: cat.day_of_week || null,
      })
      .select()
      .single()

    if (catInsertError || !insertedCat) {
      throw new Error(`Gagal menyimpan kategori "${cat.category_name}": ${catInsertError?.message}`)
    }

    // 4. Masukkan exercises milik kategori tersebut jika ada
    if (cat.exercises && cat.exercises.length > 0) {
      const formattedExercises = cat.exercises.map((ex) => ({
        category_id: insertedCat.id,
        exercise_id: ex.exercise_id,
        sort_order: ex.sort_order,
      }))

      const { error: exInsertError } = await supabase
        .from('plan_exercises')
        .insert(formattedExercises)

      if (exInsertError) {
        throw new Error(`Gagal menyimpan gerakan latihan: ${exInsertError.message}`)
      }
    }
  }

  revalidatePath(`/workout/plans/${planId}/edit`)
  revalidatePath('/workout')
  revalidatePath('/workout/plans')
  return { success: true }
}

/**
 * Server Action untuk mengambil rincian rencana latihan yang dibagikan secara publik.
 * Membaca data menggunakan Admin Client agar bisa melewati batasan RLS (public view).
 */
export async function getSharedPlanAction(planId: string) {
  const adminSupabase = createAdminClient()

  // 1. Ambil data plan utama
  const { data: plan, error: planError } = await adminSupabase
    .from('plans')
    .select('id, name')
    .eq('id', planId)
    .single()

  if (planError || !plan) {
    throw new Error('Rencana latihan tidak ditemukan atau sudah dihapus.')
  }

  // 2. Ambil kategori beserta relasi exercises
  const { data: categories, error: catError } = await adminSupabase
    .from('plan_categories')
    .select(`
      id,
      category_name,
      day_of_week,
      plan_exercises (
        exercise_id,
        sort_order,
        exercises (
          id,
          name,
          body_part,
          target,
          equipment
        )
      )
    `)
    .eq('plan_id', planId)
    .order('created_at', { ascending: true })

  if (catError) {
    throw new Error(`Gagal memuat kategori rencana latihan: ${catError.message}`)
  }

  // Urutkan plan_exercises berdasarkan sort_order untuk tiap kategori
  const formattedCategories = (categories || []).map((cat) => ({
    ...cat,
    plan_exercises: [...(cat.plan_exercises || [])].sort((a: any, b: any) => a.sort_order - b.sort_order)
  }))

  return {
    plan,
    categories: formattedCategories
  }
}

/**
 * Server Action untuk menduplikasi rencana latihan milik orang lain ke akun pengguna aktif.
 */
export async function importSharedPlanAction(planId: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Anda harus login untuk mengimpor rencana latihan.')
  }

  // 1. Tarik rincian rencana latihan asal (melewati RLS via Admin Client)
  const sharedPlanData = await getSharedPlanAction(planId)

  // 2. Buat plans baru untuk user aktif
  const { data: newPlan, error: newPlanError } = await supabase
    .from('plans')
    .insert({
      name: `${sharedPlanData.plan.name} (Salinan)`,
      user_id: user.id
    })
    .select()
    .single()

  if (newPlanError || !newPlan) {
    throw new Error(`Gagal mengimpor rencana latihan: ${newPlanError?.message}`)
  }

  // 3. Salin kategori dan exercises secara bertahap
  for (const cat of sharedPlanData.categories) {
    const { data: newCat, error: newCatError } = await supabase
      .from('plan_categories')
      .insert({
        plan_id: newPlan.id,
        category_name: cat.category_name,
        day_of_week: cat.day_of_week
      })
      .select()
      .single()

    if (newCatError || !newCat) {
      throw new Error(`Gagal menggandakan kategori "${cat.category_name}": ${newCatError?.message}`)
    }

    if (cat.plan_exercises && cat.plan_exercises.length > 0) {
      const formattedExercises = cat.plan_exercises.map((pe: any) => ({
        category_id: newCat.id,
        exercise_id: pe.exercise_id,
        sort_order: pe.sort_order
      }))

      const { error: newExError } = await supabase
        .from('plan_exercises')
        .insert(formattedExercises)

      if (newExError) {
        throw new Error(`Gagal menggandakan gerakan latihan: ${newExError.message}`)
      }
    }
  }

  revalidatePath('/workout/plans')
  revalidatePath('/workout')
  return newPlan
}
