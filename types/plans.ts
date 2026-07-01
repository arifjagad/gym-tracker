import { z } from 'zod'

/**
 * Schema Zod untuk validasi data Rencana Latihan (Plan).
 */
export const PlanSchema = z.object({
  name: z.string().min(1, 'Nama rencana latihan wajib diisi.').max(100, 'Nama terlalu panjang (maks. 100 karakter).'),
})

export type PlanInput = z.infer<typeof PlanSchema>

/**
 * Schema Zod untuk validasi Kategori Latihan Harian (Plan Category).
 */
export const CategorySchema = z.object({
  category_name: z.string().min(1, 'Nama kategori wajib diisi.').max(50, 'Nama kategori terlalu panjang.'),
  day_of_week: z.string().nullable().optional(),
})

export type CategoryInput = z.infer<typeof CategorySchema>

/**
 * Schema Zod untuk validasi Gerakan di Kategori (Plan Exercise).
 */
export const PlanExerciseSchema = z.object({
  exercise_id: z.string().min(1, 'ID gerakan wajib ditentukan.'),
  sort_order: z.number().int().nonnegative().default(0),
})

export type PlanExerciseInput = z.infer<typeof PlanExerciseSchema>
