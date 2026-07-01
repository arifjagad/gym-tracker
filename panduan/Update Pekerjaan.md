# Catatan Pengembangan: Yang Sudah Dilakukan (Fase 0)

Berikut adalah riwayat pekerjaan yang telah selesai dilakukan pada **Fase 0 — Fondasi proyek**:

## 1. Pembuatan Struktur Proyek
- Men-scaffold aplikasi Next.js baru menggunakan template standard dengan konfigurasi:
  - TypeScript
  - Tailwind CSS (v4)
  - App Router
  - ESLint
- Membuat struktur folder modular berdasarkan spesifikasi desain:
  - `(public)` route group: landing page & katalog publik.
  - `(auth)` route group: login.
  - `(app)` route group: dashboard, workout log, plans editor, history/flashback, settings.
  - `components/` terbagi menjadi `ui/` (primitive), `workout/` (fitur), dan `layout/` (struktur page).
  - `lib/` terbagi menjadi `supabase/`, `workoutx/`, and helper libraries.

## 2. Dependensi Proyek
Semua libraries utama telah di-install:
- **Database & Auth:** `@supabase/supabase-js`, `@supabase/ssr`
- **Animasi:** `animejs`, `@types/animejs` (dev)
- **Visualisasi & Charts:** `recharts`
- **Ikon:** `lucide-react`
- **Forms & Validasi:** `react-hook-form`, `zod`, `@hookform/resolvers`
- **Utilitas Tanggal:** `date-fns`
- **Dev-tooling:** `supabase` CLI

## 3. Integrasi Supabase Client
Telah dibangun boilerplate client Supabase yang aman secara arsitektur:
- [client.ts (browser)](file:///c:/Personal/Project/Website/GymApps/gym-tracker/lib/supabase/client.ts): client non-blocking untuk browser.
- [server.ts (server)](file:///c:/Personal/Project/Website/GymApps/gym-tracker/lib/supabase/server.ts): client server-side terintegrasi dengan Cookies Next.js.
- [admin.ts (admin)](file:///c:/Personal/Project/Website/GymApps/gym-tracker/lib/supabase/admin.ts): client dengan `service_role` (bypass RLS) untuk API routes / sync saja.
- *Fitur khusus:* Otomatis fallback ke variabel env `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (sesuai format dashboard Supabase terbaru) jika `NEXT_PUBLIC_SUPABASE_ANON_KEY` kosong.

## 4. Design Tokens & Styling Dasar
- [globals.css](file:///c:/Personal/Project/Website/GymApps/gym-tracker/app/globals.css) diisi dengan utility CSS variables warna dan tipografi sesuai dengan `Frontend Design.md`:
  - Plat besi charcoal (`--bg-base` / `#16181B`)
  - Kapur gym (`--chalk` / `#EDE9DD`)
  - Intensitas aksen (`--intensity` / `#E8432C`)
  - Lumut redup progress (`--progress` / `#7C9A5C`)
- Konfigurasi font google via `next/font/google` di [layout.tsx](file:///c:/Personal/Project/Website/GymApps/gym-tracker/app/layout.tsx):
  - **Oswald** (Display & Headings)
  - **JetBrains Mono** (Angka/Tabular metrics)
  - **Inter** (Body text)

## 5. Motion Presets
- [animations.ts](file:///c:/Personal/Project/Website/GymApps/gym-tracker/lib/animations.ts) disiapkan dengan preset `animejs` untuk 6 signature animations:
  1. *Rack pull* (expand card exercise)
  2. *Plate slide* (tanda set selesai)
  3. *Odometer roll* (perubahan angka berat)
  4. *Chalk burst* (perayaan PR baru)
  5. *Count-up* (ringkasan dashboard)
  6. *Tap feedback* (efek klik tombol)
- Reusable React Hook di [use-tap-feedback.ts](file:///c:/Personal/Project/Website/GymApps/gym-tracker/hooks/use-tap-feedback.ts).

## 6. Verifikasi & Tes Koneksi
- Environment variables dimuat dari `.env`.
- Dev server `npm run dev` dapat berjalan lancar.
- Query test database berhasil menghubungi Supabase API.

---

# Catatan Pengembangan: Yang Sudah Dilakukan (Fase 1)

Berikut adalah riwayat pekerjaan yang telah selesai dilakukan pada **Fase 1 — Database & security**:

## 1. Skema Tabel Database (DDL)
- Membuat berkas skema komprehensif [schema.sql](file:///c:/Personal/Project/Website/GymApps/gym-tracker/panduan/schema.sql) dan migrasi lokal [20260630000000_schema.sql](file:///c:/Personal/Project/Website/GymApps/gym-tracker/supabase/migrations/20260630000000_schema.sql).
- Men-deploy 8 tabel ke remote database Supabase:
  - `exercises`, `profiles`, `subscriptions`, `plans`, `plan_categories`, `plan_exercises`, `sessions`, and `workout_logs`.

## 2. Row Level Security (RLS) & Kebijakan (Policies)
- Mengaktifkan RLS pada 7 tabel personal user.
- Membiarkan tabel `exercises` tanpa RLS (`UNRESTRICTED`) agar katalog latihan dapat diakses secara publik.
- Mengatur policies keamanan per tabel agar data hanya dapat diakses/diubah oleh user pemilik data (`auth.uid() = user_id`).

## 3. Otomatisasi Registrasi (Trigger)
- Membuat trigger `on_auth_user_created` di tabel `auth.users`.
- Trigger ini memicu function `public.handle_new_user()` untuk meng-insert baris profil baru secara otomatis ke `public.profiles` dengan `plan_tier` default `'free'` saat user baru terdaftar.

## 4. Indeks Optimasi Query
- Menambahkan indexing custom:
  - `idx_sessions_user_date` pada tabel `sessions` untuk optimasi query berdasarkan user dan tanggal workout.
  - `idx_workout_logs_exercise` dan `idx_workout_logs_session` pada tabel `workout_logs` untuk query detail workout log dan flashback.

## 5. Pengujian Integrasi Database (RLS & Trigger Test)
- Membuat automated node.js script untuk memverifikasi keamanan dan fungsionalitas database:
  - **Uji Trigger:** Berhasil memverifikasi pembuatan baris baru di `profiles` secara otomatis saat user baru masuk ke `auth.users`, serta cascade deletion bekerja menghapus profil jika auth user dihapus.
  - **Uji RLS:** Mensimulasikan JWT Session untuk membuktikan User A tidak memiliki hak akses membaca/menulis ke data profil maupun data plan latihan milik User B.

---

# Catatan Pengembangan: Yang Sudah Dilakukan (Fase 2)

Berikut adalah riwayat pekerjaan yang telah selesai dilakukan pada **Fase 2 — Autentikasi**:

## 1. Proteksi Route & Session Refreshing
- Menambahkan berkas [proxy.ts](file:///c:/Personal/Project/Website/GymApps/gym-tracker/proxy.ts) di root project (pengganti `middleware.ts` sesuai dengan konvensi baru di Next.js 16).
- Mengintegrasikan `@supabase/ssr` untuk mengupdate session cookie otomatis pada setiap request.
- Proteksi route: Otomatis me-redirect user unauthenticated dari area `(app)/*` ke `/login`, serta user logged-in dari `/login` kembali ke `/dashboard`.

## 2. Halaman Login Premium
- Membangun UI halaman login premium di [page.tsx (Login)](file:///c:/Personal/Project/Website/GymApps/gym-tracker/app/(auth)/login/page.tsx) dengan styling dark theme (`--surface` background, `--border` lines, `--chalk` text) sesuai design tokens.
- Menambahkan tombol login Google dengan integrasi `supabase.auth.signInWithOAuth` dan micro-animation tap feedback via `useTapFeedback`.
- Menangani state login loading dan visualisasi box error auth.

## 3. Server-side OAuth Callback Route
- Mengimplementasikan callback handler di [route.ts (Callback)](file:///c:/Personal/Project/Website/GymApps/gym-tracker/app/api/auth/callback/route.ts) untuk menangkap auth code, menukarkannya dengan session cookie secara aman di backend, lalu mengarahkan user ke `/dashboard`.

## 4. App Layout & Logout
- Memperbarui layout area otentikasi di [layout.tsx (App Layout)](file:///c:/Personal/Project/Website/GymApps/gym-tracker/app/(app)/layout.tsx) dengan header standard dan tombol **Logout** yang membersihkan session via `supabase.auth.signOut()` dan men-trigger redirect balik ke `/login`.

## 5. Perbaikan Kompatibilitas Dependensi
- Men-downgrade package `animejs` ke versi `3.2.2` (dari versi 4.x yang default install) agar sintaks import default (`import anime from 'animejs'`) bekerja dengan benar pada kompilasi Turbopack Next.js 16 tanpa runtime crash.

---

# Catatan Pengembangan: Yang Sudah Dilakukan (Fase 3)

Berikut adalah riwayat pekerjaan yang telah selesai dilakukan pada **Fase 3 — Sinkronisasi data exercise**:
- **Status:** *Selesai (100% Complete)*
- **Pekerjaan yang Dilakukan:**
  1. **Client API WorkoutX (`lib/workoutx/client.ts`):** Mengimplementasikan fetch data gerakan dengan header otentikasi `X-WorkoutX-Key` dan fitur auto-retry tangguh jika mendeteksi status code `429 Too Many Requests` (menghitung reset time `resetAt` secara otomatis).
  2. **Logika Sync Paginasi (`lib/workoutx/sync.ts`):** Loop sinkronisasi dari offset 0 hingga habis dengan sleep delay 500ms dan dynamic upsert bulk ke Supabase menggunakan Admin client.
  3. **Trigger Route Sync (`app/api/sync-exercises/route.ts`):** Endpoint POST fungsional untuk pemicu sinkronisasi manual.
  4. **Katalog Latihan (`app/(app)/exercises/page.tsx`):** Membuat antarmuka katalog olahraga modern dengan layout grid responsif, card exercises detail, filter pencarian server-side debounced cepat melalui [components/workout/search-input.tsx](file:///c:/Personal/Project/Website/GymApps/gym-tracker/components/workout/search-input.tsx).
  5. **Data Terisi:** Berhasil menyinkronkan total **1.327 exercises** ke database remote Supabase.

---

# Catatan Pengembangan: Yang Sudah Dilakukan (Fase 4)

Berikut adalah riwayat pekerjaan yang telah selesai dilakukan pada **Fase 4 — Plan/template**:
- **Status:** *Selesai (100% Complete)*
- **Pekerjaan yang Dilakukan:**
  1. **Zod Validation (`types/plans.ts`):** Mengimplementasikan data schemas untuk plan, category, dan plan exercise.
  2. **Daftar Template Latihan (`app/(app)/workout/plans/page.tsx`):** Memindahkan daftar plans utama ke `/workout/plans` lengkap dengan modal input `CreatePlanDialog` dan `PlanCard` terintegrasi.
  3. **Editor Plan Interaktif (`components/workout/plan-editor.tsx`):** Form editor plan detail. User bisa mengedit judul plan, CRUD kategori otot harian, memilih gerakan dari 1.327 database exercises (Fase 3), dan mengurutkan posisi latihan secara real-time via tombol panah `🔼` / `🔽`.
  4. **Server Actions Transaksional (`lib/actions/plans.ts`):** Operasi atomic untuk bulk save dan delete cascade plan.

---

# Catatan Pengembangan: Yang Sudah Dilakukan (Fase 5)

Berikut adalah riwayat pekerjaan yang telah selesai dilakukan pada **Fase 5 — Catat workout (logging)**:
- **Status:** *Selesai (100% Complete)*
- **Pekerjaan yang Dilakukan:**
  1. **Server Actions Workout (`lib/actions/workout.ts`):** Mengimplementasikan inisialisasi sesi (`sessions`) harian, autosave bulk set logs ke `workout_logs`, dan penarikan statistik historis angkatan terakhir (`getPreviousWorkoutStats`) untuk placeholder/target.
  2. **Pemilih Sesi Cerdas (`components/workout/start-workout-selector.tsx`):** Menyarankan latihan otomatis berdasarkan jadwal hari aktif saat ini (contoh: "Senin - Chest Day"), dengan opsi pemilih template manual alternatif.
  3. **Komponen Kartu Set Latihan (`components/workout/exercise-logger-card.tsx`):** Form pencatatan reps/berat badan per set secara dinamis. Mendukung penambahan set baru, hapus set terakhir, visualisasi rekor sebelumnya, serta micro-animations (Accordion expansion Rack Pull dan slide highlight row Plate Slide menggunakan animejs).
  4. **Logger & Stopwatch Sesi (`components/workout/workout-logger.tsx`):** Tampilan pencatatan latihan aktif lengkap dengan widget stopwatch berjalan, pembagian kategori otot berbasis tab, dan tombol penyelesaian sesi latihan.
  5. **Orkestrasi Logging Route (`app/(app)/workout/page.tsx`):** Entry-point `/workout` mendeteksi sesi aktif hari ini. Jika belum mulai, menampilkan selector; jika sesi aktif terdeteksi, menampilkan antarmuka logger.

---

# Catatan Pengembangan: Yang Sudah Dilakukan (Fase 6)

Berikut adalah riwayat pekerjaan yang telah selesai dilakukan pada **Fase 6 — Dashboard & feedback**:
- **Status:** *Selesai (100% Complete)*
- **Pekerjaan yang Dilakukan:**
  1. **Analytics Data Aggregator (`lib/actions/stats.ts`):** Mengimplementasikan kueri server-side untuk menghitung jumlah sesi latihan mingguan, volume tonase angkatan mingguan, menghitung kontribusi konsistensi grid 28 hari terakhir, dan pencarian berat angkatan maksimal (*Personal Record / PR*).
  2. **Dashboard Overview UI (`app/(app)/dashboard/page.tsx`):** Grid layout dashboard yang dinamis dengan metrik ringkasan (Sesi Latihan, Tonase Angkatan, Persentase Konsistensi) terintegrasi shortcut akses catat latihan.
  3. **Visualisasi Grafik Volume (`components/workout/weekly-volume-chart.tsx`):** Komponen diagram area (`recharts`) interaktif dengan pewarnaan gradien intensitas merah arang untuk melihat perkembangan volume latihan harian secara instan.
  4. **Streak Kepatuhan (`components/workout/consistency-grid.tsx`):** Grid visual kepatuhan latihan 28 hari terakhir (4 minggu) bergaya dot-grid kontribusi GitHub (hijau lumut untuk hari latihan aktif).
  5. **Tabel Rekor PR Teratas:** Menampilkan ringkasan top 5 PR berat maksimal angkatan gym user beserta detail tanggal pencapaiannya.

---

# Catatan Pengembangan: Yang Sudah Dilakukan (Fase 7)

Berikut adalah riwayat pekerjaan yang telah selesai dilakukan pada **Fase 7 — Riwayat & flashback**:
- **Status:** *Selesai (100% Complete)*
- **Pekerjaan yang Dilakukan:**
  1. **Server Actions Riwayat (`lib/actions/history.ts`):** Mengimplementasikan server-side helpers untuk penarikan riwayat sesi lengkap dengan nested exercises, penarikan daftar nama exercise unik yang pernah dilatih, dan penarikan progres angkatan per gerakan untuk Recharts.
  2. **Accordion Flashback (`components/workout/session-history-card.tsx`):** Komponen kartu detail riwayat sesi latihan gym. Klik untuk ber-ekspansi elastis (*Rack Pull*) guna memvisualisasikan data beban/reps per set historis secara detail.
  3. **Grafik Progres Line Chart (`components/workout/exercise-progress-chart.tsx`):** Grafik perkembangan kekuatan (1RM / Max Weight) dan total volume harian lintas waktu menggunakan diagram garis (`recharts`). Menandai titik tertinggi pencapaian Rekor Pribadi (PR) dengan warna merah intensitas dan efek berdenyut (*pulsing ping*).
  4. **Manajer Riwayat Tabbed (`components/workout/history-manager.tsx`):** Kontainer navigasi tab yang mengoordinasikan daftar kartu flashback latihan dan halaman analitik dropdown pencarian progres gerakan.
  5. **Integrasi Halaman Riwayat (`app/(app)/history/page.tsx`):** Halaman riwayat utama fungsional memuat seluruh data server analitik.

---

# Catatan Pengembangan: Yang Sudah Dilakukan (Fase 8)

Berikut adalah riwayat pekerjaan yang telah selesai dilakukan pada **Fase 8 — Polish & library**:
- **Status:** *Selesai (100% Complete)*
- **Pekerjaan yang Dilakukan:**
  1. **Visual Landing Page Premium (`app/(public)/page.tsx`):** Membangun total landing page publik premium dengan gradien visual, navigasi adaptif login, Oswald condensed display font, dan grid keunggulan fitur utama.
  2. **Halaman Detail Gerakan (`app/(app)/exercises/[exerciseId]/page.tsx`):** Rute halaman detail dinamis yang menyajikan visualisasi demonstrasi GIF, daftar petunjuk instruksi bernomor terstruktur, dan panel riwayat personal log latihan user khusus untuk gerakan tersebut.
  3. **Halaman Pengaturan (`app/(app)/settings/page.tsx`):** Menyediakan halaman pengaturan user untuk mengontrol preferensi akun, pilihan satuan berat latihan (KG/LBS), dan verifikasi status paket langganan (Free vs Pro).
  4. **Koneksi Link Katalog:** Menghubungkan nama gerakan latihan di katalog (/exercises) agar dapat diklik langsung mengarah ke halaman detail masing-masing.
  5. **Pembersihan Route Slug Conflict:** Menyelesaikan error compile route slug Next.js (`exerciseId` !== `id`) dengan menghapus folder duplikat `[id]` secara bersih di sistem.

---

# Catatan Pengembangan: Fase Saat Ini (Fase 9)

Saat ini kita masuk ke **Fase 9 — Payment & publish**:
- **Status:** *Belum Mulai (Siap Dikerjakan)*
- **Target Pekerjaan:**
  1. Menghubungkan sistem billing pembayaran Stripe / Midtrans untuk memicu pergantian keanggotaan user (`plan_tier` free menjadi pro).
  2. Mengimplementasikan batasan fitur khusus Pro (seperti analisis tren lanjutan / custom metrics).
  3. Mempersiapkan production build final dan deployment hosting Vercel.








