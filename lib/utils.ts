/**
 * Utilitas umum — format angka, tanggal, dll.
 */

/**
 * Format angka berat: hilangkan desimal kalau bulat, satu desimal kalau tidak.
 * 65.0 → "65"  |  67.5 → "67.5"
 */
export function formatWeight(kg: number): string {
  return Number.isInteger(kg) ? String(kg) : kg.toFixed(1)
}

/**
 * Format tanggal ke format Indonesia pendek.
 * 2026-06-30 → "30 Jun 2026"
 */
export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Clamp angka ke range [min, max].
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * cn() — utility untuk menggabungkan className secara conditional.
 * Ringan, tanpa dependency clsx/tailwind-merge di tahap ini.
 */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}
