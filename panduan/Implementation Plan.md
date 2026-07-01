# Tahapan implementasi — Gym Tracker

Bukan timeline dengan tanggal — ini urutan berdasarkan **dependency teknis**: apa yang harus berdiri dulu sebelum hal lain bisa dibangun di atasnya. Tiap fase punya target keluaran yang jelas ("selesai" = bisa dicek, bukan "kira-kira udah"), dan dipecah jadi checklist supaya tiap sesi development (sendiri atau lewat AI agent) tahu persis mulai dari mana dan kapan berhenti.

Acuan teknis detail (skema tabel, RLS policy, token desain, animasi) ada di `README.md` dan `FRONTEND_DESIGN.md` — dokumen ini cuma urutan & status, bukan duplikat isi.

## Cara pakai dokumen ini

Centang tiap item setelah selesai **dan teruji**, bukan setelah ditulis kodenya doang. Kalau mulai sesi baru (terutama lewat AI agent kayak Antigravity), tempel bagian "Fase yang sedang berjalan" ke prompt awal supaya AI tahu konteks dan nggak lompat ke fase yang belum siap fondasinya.

---

## Fase 0 — Fondasi proyek

Tujuan: project bisa di-`npm run dev`, terhubung ke Supabase, environment variable lengkap. Belum ada fitur apa pun.

- [x] `create-next-app` dengan TypeScript + Tailwind + App Router
- [x] Install dependencies inti (lihat daftar di `FRONTEND_DESIGN.md`)
- [x] Buat project Supabase, catat `project-ref`
- [x] `.env.local` terisi: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- [x] `lib/supabase/client.ts` dan `lib/supabase/server.ts` jalan (test: render 1 query dummy di Server Component)
- [x] Struktur folder dasar dibuat sesuai `FRONTEND_DESIGN.md` (route groups, `components/`, `lib/`)
- [x] Font (Oswald, JetBrains Mono, Inter) ke-load, `globals.css` berisi CSS variable token warna

**Selesai kalau:** halaman kosong tampil dengan font & warna dasar benar, dan satu query test ke Supabase berhasil tanpa error.

---

## Fase 1 — Database & security

Tujuan: semua tabel ada di Supabase, RLS aktif dan **terverifikasi bocor/tidaknya**, bukan cuma ditulis.

- [x] Jalankan DDL 9 tabel dari `README.md` lewat SQL Editor atau Supabase CLI migration
- [x] Aktifkan RLS + semua policy per tabel
- [x] Trigger `handle_new_user` terpasang (cek: daftar user baru → otomatis ada row di `profiles`)
- [x] **Test RLS pakai anon key**, bukan service_role: buat 2 user dummy, pastikan user A tidak bisa `select`/`update` data milik user B di `plans`, `sessions`, `workout_logs`
- [x] Index (`idx_workout_logs_exercise`, `idx_sessions_user_date`, `idx_workout_logs_session`) terpasang

**Selesai kalau:** ada catatan/screenshot hasil test RLS dengan 2 akun berbeda yang membuktikan isolasi data bekerja — bukan asumsi "kayaknya udah bener".

---

## Fase 2 — Autentikasi

Tujuan: user bisa daftar, login, logout — termasuk Google OAuth.

- [x] Setup Google OAuth credentials di Google Cloud Console
- [x] Aktifkan provider Google di Supabase Dashboard
- [x] Halaman login (`(auth)/login`) dengan tombol "Masuk dengan Google"
- [x] Middleware/`layout.tsx` di route group `(app)` — redirect ke login kalau belum ada session
- [x] Logout berfungsi, session ke-clear

**Selesai kalau:** bisa login pakai akun Google sendiri, otomatis masuk dashboard (meski dashboard masih kosong), dan refresh halaman tidak logout sendiri.

---

## Fase 3 — Sinkronisasi data exercise

Tujuan: tabel `exercises` terisi data asli dari WorkoutX, bisa ditampilkan.

- [x] Daftar API key WorkoutX, simpan di `.env.local`
- [x] `lib/workoutx/client.ts` — wrapper fetch dengan header `X-WorkoutX-Key`
- [x] `lib/workoutx/sync.ts` — logic pagination (`limit`/`offset`) loop sampai habis
- [x] `app/api/sync-exercises/route.ts` — endpoint yang dipanggil manual dulu (cron belum perlu di tahap ini)
- [x] Jalankan sync sekali, verifikasi `exercises` di Supabase terisi (~1.400 row)
- [x] Halaman katalog sederhana (`exercises/page.tsx`) — list nama + thumbnail, belum perlu styling final

**Selesai kalau:** tabel `exercises` di Supabase terisi data asli, dan halaman katalog menampilkan datanya (boleh masih polos, fokus data benar dulu).

---

## Fase 4 — Inti: Plan (template) & flow bikin paket latihan

Tujuan: user bisa bikin plan, isi kategori per hari, pilih exercise — ini fondasi sebelum logging bisa jalan.

- [x] Halaman `workout/plans` — list plan milik user
- [x] Form bikin plan baru (nama plan)
- [x] Form tambah `plan_categories` (nama kategori + hari)
- [x] Form tambah `plan_exercises` ke tiap kategori — search/pilih dari tabel `exercises`
- [x] Edit & hapus kategori/exercise dalam plan tanpa merusak data lain (belum ada log yang perlu dijaga di fase ini, tapi struktur CRUD-nya harus benar dari awal)

**Selesai kalau:** user bisa bikin 1 plan lengkap (misal "Split 3 hari") dengan kategori dan exercise terisi, tersimpan dan muncul lagi setelah refresh.

---

## Fase 5 — Inti: Catat workout (logging)

Tujuan: fitur paling sering dipakai sehari-hari — ini prioritas tertinggi dari sisi UX (lihat pola "isi per-exercise saat istirahat" di `FRONTEND_DESIGN.md`).

- [x] Halaman `workout/page.tsx` — deteksi hari ini, pre-fill exercise dari plan yang sesuai
- [x] Bikin `sessions` baru otomatis saat user mulai catat hari itu
- [x] Komponen `exercise-card.tsx` — state "belum dimulai" vs "aktif" (animasi rack pull masuk di sini)
- [x] Input set (kg, reps) dengan `inputmode="decimal"`, pre-fill dari `workout_logs` terakhir untuk exercise yang sama
- [x] Simpan ke `workout_logs` per exercise saat user konfirmasi (bukan per-keystroke)
- [x] Animasi plate slide saat satu exercise ditandai selesai
- [ ] Opsi "Ganti exercise hari ini" (swap dadakan, di luar flow utama)

**Selesai kalau:** kamu bisa benar-benar pakai app ini buat sesi gym beneran dari HP, dari buka app sampai semua exercise tercatat — ini milestone paling penting di seluruh project (mulai Tahap 1: personal use).

---

## Fase 6 — Dashboard & feedback visual

Tujuan: ringkasan aktivitas dan elemen "reward" (PR, streak) yang bikin app terasa hidup.

- [x] Halaman dashboard — streak, shortcut ke catat workout, aktivitas terbaru
- [x] Logic deteksi PR (bandingkan `weight_kg` baru vs max sebelumnya per `exercise_id` + user)
- [x] Komponen `pr-badge.tsx` dengan animasi chalk burst
- [x] Count-up untuk angka ringkasan (streak, total volume minggu ini)
- [x] Tap feedback global di semua tombol/badge interaktif

**Selesai kalau:** habis catat workout, dashboard reflect data terbaru, dan PR baru benar-benar memicu animasi chalk burst (bukan cuma badge statis).

---

## Fase 7 — Riwayat & flashback

Tujuan: fitur yang jadi alasan awal bikin app ini — bandingkan progress lintas waktu.

- [x] Halaman riwayat — pilih exercise, lihat grafik progress (Recharts)
- [x] Query agregat per sesi: max weight, total volume (set × reps × kg)
- [x] Toggle perbandingan periode (minggu ini vs minggu lalu, bulan ini vs tahun lalu) pakai `date-fns`
- [x] Tandai titik PR di grafik dengan warna `--intensity`
- [x] Tampilan kalender kecil — hari mana saja ada sesi gym

**Selesai kalau:** bisa lihat progress bench press (atau exercise lain) dari minggu lalu vs sekarang dengan angka selisih yang benar, sesuai data asli yang udah masuk dari Fase 5.

---

## Fase 8 — Polish & exercise library lengkap

Tujuan: halaman publik (landing, katalog) dan detail exercise jadi rapi — ini yang dilihat orang baru (Tahap 2: dibagikan ke teman).

- [x] Landing page (boleh lebih ekspresif sesuai catatan di `FRONTEND_DESIGN.md`)
- [x] Halaman detail exercise — GIF, instruksi, riwayat personal user untuk exercise itu
- [x] Halaman settings — satuan berat (kg/lbs), info akun
- [x] Cron job otomatis untuk sync ulang `exercises` (bukan manual lagi seperti Fase 3)
- [x] Review checklist anti-"kelihatan AI" di `FRONTEND_DESIGN.md` — cek border-radius, shadow, spacing tiap halaman

**Selesai kalau:** siap dibagikan link ke teman tanpa rasa malu soal tampilan atau bug dasar.

---

## Fase 9 — Payment & publish (Tahap 3)

Tujuan: monetisasi, baru dikerjakan setelah Fase 0–8 stabil dan benar-benar dipakai (bukan dikerjakan duluan karena "penting").

- [ ] Daftar Midtrans, dapatkan server key & client key
- [ ] `app/api/webhooks/midtrans/route.ts` — terima notifikasi pembayaran
- [ ] Insert ke `subscriptions`, update `profiles.plan_tier` & `pro_expires_at` dalam satu transaction
- [ ] Halaman upgrade/pricing
- [ ] Gating fitur pro (tentukan dulu fitur apa yang di-lock — belum diputuskan di dokumen manapun, perlu didiskusikan sebelum fase ini mulai)
- [ ] Setup domain custom + deploy production di Vercel

**Selesai kalau:** ada satu transaksi sungguhan (boleh nominal kecil/testing) yang berhasil mengubah status user jadi `pro` lewat webhook, bukan diubah manual lewat dashboard Supabase.

---

## Status saat ini

| Fase | Status |
|---|---|
| 0 — Fondasi proyek | selesai |
| 1 — Database & security | selesai |
| 2 — Autentikasi | selesai |
| 3 — Sync exercise | selesai |
| 4 — Plan/template | selesai |
| 5 — Catat workout | selesai |
| 6 — Dashboard & feedback | selesai |
| 7 — Riwayat & flashback | selesai |
| 8 — Polish & library | selesai |
| 9 — Payment & publish | belum mulai |

Update tabel ini manual tiap kali satu fase selesai — ini yang jadi penanda paling cepat buat tahu "lagi di mana" tanpa baca ulang seluruh dokumen.
