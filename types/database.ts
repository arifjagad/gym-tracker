/**
 * Tipe database — akan di-generate otomatis dari Supabase CLI.
 * Jalankan: npx supabase gen types typescript --project-id <project-ref> > types/database.ts
 *
 * Placeholder ini akan ditimpa setelah Fase 1 (tabel sudah dibuat di Supabase).
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// TODO: Generate dari Supabase CLI setelah Fase 1 selesai
export interface Database {
  public: {
    Tables: Record<string, never>
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
