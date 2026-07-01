/**
 * restore_exercises.js
 *
 * Mengembalikan kolom name, body_part, target, dan equipment ke nilai asli
 * bahasa Inggris dari WorkoutX API, tanpa menyentuh kolom instructions
 * yang sudah diterjemahkan ke Bahasa Indonesia.
 *
 * Jalankan dengan: node components/workout/restore_exercises.js
 */

const fs = require('fs');
const path = require('path');

// 1. Load environment variables dari .env
const envPath = path.join(__dirname, '../../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] ? match[2].trim() : '';
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[match[1]] = value;
  }
});

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const WORKOUTX_API_KEY = env.WORKOUTX_API_KEY;
const BASE_URL = 'https://api.workoutxapp.com/v1';
const LIMIT = 10;

// 2. Fungsi fetch dengan retry saat rate limit
async function fetchExercises(limit, offset) {
  const url = `${BASE_URL}/exercises?limit=${limit}&offset=${offset}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-WorkoutX-Key': WORKOUTX_API_KEY,
      'Accept': 'application/json',
    },
  });

  if (response.status === 429) {
    const errorData = await response.json().catch(() => ({}));
    const resetAt = errorData.resetAt ? new Date(errorData.resetAt).getTime() : Date.now() + 60000;
    const delayMs = Math.max(1000, resetAt - Date.now() + 2000);
    console.warn(`Rate limit! Menunggu ${Math.round(delayMs / 1000)} detik...`);
    await new Promise(resolve => setTimeout(resolve, delayMs));
    return fetchExercises(limit, offset);
  }

  if (!response.ok) {
    throw new Error(`WorkoutX API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
}

// 3. Main restore loop
async function run() {
  if (!WORKOUTX_API_KEY) {
    console.error('WORKOUTX_API_KEY tidak ditemukan di .env!');
    process.exit(1);
  }

  console.log('Memulai restore name, body_part, target, equipment ke bahasa Inggris...');
  console.log('CATATAN: Kolom instructions TIDAK akan diubah.\n');

  let offset = 0;
  let totalRestored = 0;

  while (true) {
    console.log(`Mengambil data dari WorkoutX API: offset=${offset}...`);
    const exercises = await fetchExercises(LIMIT, offset);

    if (exercises.length === 0) {
      console.log('Tidak ada data lagi dari API. Selesai.');
      break;
    }

    // Update hanya 4 kolom — instructions dibiarkan
    for (const ex of exercises) {
      const { error } = await supabase
        .from('exercises')
        .update({
          name:       ex.name                         ?? null,
          body_part:  ex.body_part ?? ex.bodyPart     ?? null,
          target:     ex.target                       ?? null,
          equipment:  ex.equipment                    ?? null,
        })
        .eq('id', ex.id);

      if (error) {
        console.error(`  Gagal restore ID ${ex.id}: ${error.message}`);
      } else {
        totalRestored++;
      }
    }

    console.log(`  ✓ Sudah restore ${totalRestored} gerakan...`);

    if (exercises.length < LIMIT) break;

    offset += LIMIT;

    // Jeda 600ms antar halaman agar tidak kena rate limit
    await new Promise(resolve => setTimeout(resolve, 600));
  }

  console.log(`\nSelesai! Total ${totalRestored} gerakan dikembalikan ke bahasa Inggris.`);
}

run().catch(err => {
  console.error('Error fatal:', err.message);
  process.exit(1);
});
