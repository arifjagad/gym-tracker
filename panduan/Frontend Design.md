# Frontend design — Gym Tracker

## Filosofi

Aplikasi ini dipakai di gym, bukan di meja kerja: tangan berkeringat, ruangan kadang redup, mata fokus ke beban bukan ke layar, dan user lagi capek di antara set. Maka prioritas desain bukan "indah dan tenang" seperti landing page SaaS pada umumnya, melainkan **cepat dibaca dalam sepersekian detik** dan **gampang ditekan tanpa salah pencet**.

Referensi dunia nyata yang jadi acuan: plat beban besi, kapur (chalk) di tangan powerlifter, papan skor gym, angka digital di mesin cable. Bukan studio yoga yang tenang, bukan dashboard finansial yang rapi.

Dua hal yang sengaja dihindari karena jadi default generik AI saat ini: palet krem hangat + serif kontras + aksen terracotta, dan palet hitam pekat + satu aksen neon hijau/vermillion. Arah desain di bawah ini dipilih dari karakter gym itu sendiri, bukan dari template.

## Checklist anti-"kelihatan AI"

Beberapa hal konkret yang membedakan implementasi nanti dari output AI generik, di luar soal warna (sudah dibahas di bagian filosofi):

- **Jangan pakai border-radius seragam di semua elemen.** Card pakai 12px, tapi badge kecil (PR, kategori) pakai radius lebih kecil (6–8px) atau malah pill penuh — variasi kecil ini yang sering hilang kalau asal generate.
- **Hindari shadow generic `shadow-md`/`shadow-lg` Tailwind default.** Karena background gelap, elevasi dibangun dari kontras `--surface` vs `--surface-raised`, bukan drop shadow — drop shadow di dark mode justru sering terlihat "AI-made" karena nggak natural.
- **Spacing tidak harus simetris sempurna.** Hierarki angka besar (signature element) butuh ruang lebih lega di atas-bawah dibanding label di sekitarnya — jangan paksa semua padding pakai skala 4/8/16 yang sama rata tanpa pertimbangan.
- **Satu detail "ganjil" yang disengaja per halaman** — misalnya garis tipis di bawah heading kategori yang nggak full-width (cuma sepanjang teksnya), atau angka set yang sedikit lebih besar dari reps meski sama-sama penting. Detail kecil yang nggak simetris/predictable ini yang bikin UI terasa dirancang, bukan digenerate dari template.
- **Ikon: pilih satu set (misal Lucide) dan stroke-width konsisten (1.5 atau 2, jangan campur).** Campur-campur ketebalan ikon dari berbagai sumber adalah tanda paling gampang ketauan kalau komponennya digenerate terpisah-pisah tanpa direview ulang.

## Struktur folder (Next.js App Router)

```
gym-tracker/
├── app/
│   ├── (public)/                    # area sebelum login, layout terpisah
│   │   ├── page.tsx                 # landing page
│   │   ├── exercises/
│   │   │   └── page.tsx             # katalog exercise publik
│   │   └── layout.tsx
│   │
│   ├── (auth)/                      # halaman login/daftar, layout minim
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   │
│   ├── (app)/                       # area setelah login, perlu auth
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── workout/
│   │   │   ├── page.tsx             # catat workout (hari ini)
│   │   │   └── plans/
│   │   │       ├── page.tsx         # daftar paket latihan
│   │   │       └── [planId]/
│   │   │           └── edit/
│   │   │               └── page.tsx # edit plan_categories/plan_exercises
│   │   ├── history/
│   │   │   └── page.tsx             # riwayat & flashback
│   │   ├── exercises/
│   │   │   ├── page.tsx             # daftar exercise (logged-in version)
│   │   │   └── [exerciseId]/
│   │   │       └── page.tsx         # detail + riwayat personal
│   │   ├── settings/
│   │   │   └── page.tsx             # profil, satuan berat, subscription
│   │   └── layout.tsx               # cek session, sidebar/bottom-nav
│   │
│   ├── api/
│   │   ├── sync-exercises/
│   │   │   └── route.ts             # dipanggil cron job, narik dari WorkoutX
│   │   ├── webhooks/
│   │   │   └── midtrans/
│   │   │       └── route.ts         # update profiles.plan_tier (tahap 3)
│   │   └── auth/
│   │       └── callback/
│   │           └── route.ts         # OAuth callback Supabase
│   │
│   ├── layout.tsx                   # root layout, font loading
│   └── globals.css                  # design tokens (CSS variables), Tailwind base
│
├── components/
│   ├── ui/                          # primitive yang dipakai berulang
│   │   ├── button.tsx
│   │   ├── input-numeric.tsx        # input kg/reps, inputmode="decimal"
│   │   ├── badge.tsx
│   │   └── card.tsx
│   ├── workout/                     # komponen spesifik fitur
│   │   ├── exercise-card.tsx        # pola card exercise (rack pull, plate slide)
│   │   ├── set-row.tsx
│   │   └── pr-badge.tsx             # chalk burst trigger
│   ├── history/
│   │   ├── progress-chart.tsx
│   │   └── period-toggle.tsx
│   └── layout/
│       ├── bottom-nav.tsx           # navigasi utama, sticky bottom
│       └── header.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                # browser client (anon key)
│   │   ├── server.ts                # server client (cookies, untuk Server Components)
│   │   └── admin.ts                 # service_role client — hanya dipanggil dari app/api/**
│   ├── workoutx/
│   │   ├── client.ts                # wrapper fetch ke WorkoutX API
│   │   └── sync.ts                  # logic pagination sync
│   ├── animations.ts                # EASE presets + fungsi anime.js (rack pull, dst)
│   └── utils.ts                     # format angka, tanggal, dll
│
├── types/
│   └── database.ts                  # tipe hasil generate dari Supabase CLI
│
├── hooks/
│   ├── use-tap-feedback.ts
│   └── use-workout-session.ts
│
├── public/
│   └── fonts/                       # kalau self-host font, alternatif Google Fonts CDN
│
├── .env.local
├── tailwind.config.ts
├── next.config.js
└── package.json
```

Catatan struktur:
- Route groups `(public)`, `(auth)`, `(app)` dipakai biar tiap area punya layout sendiri (nav beda, proteksi auth beda) tanpa memengaruhi URL — Next.js otomatis "menyembunyikan" nama folder dalam tanda kurung dari path.
- `lib/supabase/admin.ts` (pakai `service_role` key) **hanya** boleh di-import dari file di dalam `app/api/**` — jangan pernah di-import ke Client Component, karena bisa ke-bundle ke browser.
- `components/workout/` dipisah dari `components/ui/` supaya primitive generik (button, card) tetap reusable, sementara komponen yang nempel ke domain gym (exercise-card, pr-badge) nggak nyampur jadi satu folder besar.

## Dependencies yang perlu di-install

### Inti

```bash
npx create-next-app@latest gym-tracker --typescript --tailwind --app
cd gym-tracker
```

### Supabase

```bash
npm install @supabase/supabase-js @supabase/ssr
```

`@supabase/ssr` dipakai (bukan auth-helpers lama) untuk handle session di Server Component & middleware Next.js App Router.

### Animasi

```bash
npm install animejs
npm install -D @types/animejs
```

### Chart untuk halaman Riwayat & flashback

```bash
npm install recharts
```

Recharts dipilih karena ringan, gampang dikustom warnanya pakai CSS variable (`--chalk`, `--intensity`), dan cukup buat line chart progress — nggak butuh library berat seperti D3 langsung untuk kebutuhan ini.

### Ikon

```bash
npm install lucide-react
```

Sesuai catatan di checklist anti-AI — satu set ikon, stroke-width konsisten.

### Form & validasi

```bash
npm install react-hook-form zod @hookform/resolvers
```

Dipakai untuk form bikin/edit plan (nama plan, kategori, pilih exercise) dan validasi input angka set (reps/kg tidak boleh negatif, dll).

### Utilitas tanggal (untuk flashback minggu/bulan/tahun lalu)

```bash
npm install date-fns
```

`date-fns` dipilih dibanding `moment` (sudah deprecated maintenance-nya) atau `dayjs` — cukup lengkap untuk operasi `subWeeks`, `subYears`, `isSameWeek`, dan tree-shakeable jadi tidak membengkakkan bundle.

### Midtrans (tahap 3, belum perlu sekarang)

```bash
npm install midtrans-client
```

### Supabase CLI (dev dependency, untuk generate tipe & migration lokal)

```bash
npm install -D supabase
npx supabase init
npx supabase gen types typescript --project-id <project-ref> > types/database.ts
```

### Ringkasan package.json (production deps)

```json
{
  "dependencies": {
    "next": "^15",
    "react": "^19",
    "react-dom": "^19",
    "@supabase/supabase-js": "^2",
    "@supabase/ssr": "^0.5",
    "animejs": "^3",
    "recharts": "^2",
    "lucide-react": "^0.4",
    "react-hook-form": "^7",
    "zod": "^3",
    "@hookform/resolvers": "^3",
    "date-fns": "^4"
  },
  "devDependencies": {
    "typescript": "^5",
    "tailwindcss": "^3",
    "@types/animejs": "^3",
    "supabase": "^1"
  }
}
```

Tidak perlu state management tambahan (Zustand/Redux) di tahap ini — kebutuhan state-nya masih cukup ditangani Server Component + `useState` lokal per halaman. Kalau nanti fitur makin kompleks (misal optimistic update lintas halaman), baru pertimbangkan Zustand secukupnya.

## Color tokens

| Token | Hex | Pemakaian |
|---|---|---|
| `--bg-base` | `#16181B` | Background utama, charcoal gelap seperti plat besi |
| `--surface` | `#1F2226` | Card, input field, elemen yang sedikit terangkat dari background |
| `--surface-raised` | `#272B30` | Elemen interaktif aktif (tombol ditekan, card terpilih) |
| `--chalk` | `#EDE9DD` | Teks utama, garis, ikon — warna kapur gym, bukan putih murni |
| `--chalk-muted` | `#9C988C` | Teks sekunder, label, placeholder |
| `--intensity` | `#E8432C` | Aksen tunggal — PR baru, peringatan, tombol utama. Dipakai sangat terbatas |
| `--progress` | `#7C9A5C` | Indikator selesai/naik progress — hijau lumut redup, bukan neon |
| `--border` | `rgba(237, 233, 221, 0.12)` | Garis pemisah, border card |

Aturan pemakaian `--intensity`: hanya untuk hal yang benar-benar perlu perhatian penuh user — badge PR (personal record) baru, tombol simpan utama, atau notifikasi penting. Kalau dipakai di mana-mana, kehilangan makna "ini penting".

Mode terang tidak diprioritaskan di versi awal — gym pada dasarnya dipakai dalam kondisi cahaya rendah hingga sedang, dan high contrast dark mode lebih nyaman dibaca saat capai/berkeringat. Mode terang bisa ditambahkan belakangan sebagai opsi sekunder.

## Tipografi

Dua peran font yang sengaja dibedakan karena perannya beda secara fungsi:

**Display/heading** — `Oswald` (Google Fonts), condensed bold. Dipakai untuk nama hari, judul kategori, nama exercise. Bentuknya tegas dan padat, mengingatkan pada huruf di papan skor atau plat beban — bukan serif elegan yang terasa editorial.

**Angka (berat, reps, set)** — `JetBrains Mono`, tabular figures. Ini font khusus untuk semua angka yang berubah-ubah saat input (kg, reps, jumlah set). Karena lebar tiap karakter sama, angka tidak "bergeser" saat user mengetik atau saat angka berubah dari 1 ke 2 digit — penting untuk UI yang sering di-tap cepat sambil istirahat antar set.

**Body text** — `Inter`. Untuk instruksi exercise, deskripsi, teks panjang lainnya yang perlu keterbacaan tinggi di ukuran kecil.

```css
--font-display: 'Oswald', sans-serif;
--font-numeric: 'JetBrains Mono', monospace;
--font-body: 'Inter', sans-serif;
```

## Signature element: angka besar sebagai fokus visual

Bukan ilustrasi, bukan ikon dekoratif — elemen yang paling diingat dari aplikasi ini adalah **angka berat/reps dalam ukuran besar dengan font tabular**, persis seperti mata user yang fokus ke plat beban saat gym, bukan ke dekorasi di sekitarnya. Setiap halaman yang menampilkan data angka (dashboard, riwayat, catat workout) memprioritaskan angka itu sebagai elemen tervisual besar, dengan label kecil di sekitarnya — bukan sebaliknya.

## Layout & ukuran sentuh

Karena dipakai satu tangan di gym (tangan lain pegang dumbbell atau sedang istirahat), semua target sentuh mengikuti ukuran minimum yang nyaman ditekan tanpa harus presisi:

- Tombol utama: tinggi minimum 44px, idealnya 48–52px untuk aksi penting (simpan set, mulai exercise)
- Input angka (kg/reps): lebar cukup lega, idealnya pakai `inputmode="decimal"` / `inputmode="numeric"` agar keyboard angka langsung muncul
- Tombol aksi utama per halaman (misal "Selesai sesi") menempel di bagian bawah layar (sticky bottom), bukan di scroll paling akhir — supaya selalu terjangkau ibu jari tanpa scroll

## Pola komponen

**Card exercise** — surface (`--surface`), radius 12px, border tipis (`--border`). Header: nama exercise (font display) + badge kecil "minggu lalu: Xkg" (chalk-muted). Body: baris-baris set dengan input kg dan reps bersebelahan, font numerik.

**Badge kategori** (Dada, Back, Bicep) — pill kecil, background `--surface-raised`, teks `--chalk-muted`, tanpa warna mencolok karena ini cuma label kategori, bukan status.

**Indikator selesai** — bukan centang hijau terang, tapi `--progress` (hijau lumut redup) supaya tidak bersaing visual dengan `--intensity` yang direservasi untuk hal benar-benar penting seperti PR baru.

**Badge PR (personal record)** — satu-satunya tempat warna `--intensity` muncul mencolok. Saat user mencatat berat baru yang melebihi rekor sebelumnya, badge kecil "PR" muncul di sebelah angka tersebut.

## Motion

Prinsip dasarnya satu: animasi harus menerjemahkan **sensasi fisik gym** — berat, presisi, tertahan-lalu-lepas — bukan animasi generik "fade-in/slide-up" yang dipakai hampir semua web buatan AI sekarang. Kalau dilihat sepintas, animasi di sini harus terasa seperti reaksi mekanis (plat, rak, kapur), bukan reaksi "playful" ala app konsumer biasa.

Pembagian kerja: **Tailwind** menangani transisi kecil yang stateless (hover, focus, basic enter/exit opacity), **anime.js** direservasi khusus untuk 6 momen *signature* di bawah ini. Prinsipnya: satu momen yang digarap detail jauh lebih berkesan daripada microinteraction bertebaran di semua elemen — jangan tambah animasi di luar daftar ini tanpa alasan kuat.

### Setup

```bash
npm install animejs
```

```ts
// lib/animations.ts
import anime from 'animejs'
```

Easing kustom yang dipakai berulang — definisikan sekali, pakai di mana-mana:

```ts
export const EASE = {
  settle: 'cubicBezier(0.22, 1, 0.36, 1)',   // berhenti "berat", tanpa overshoot
  pullTension: 'cubicBezier(0.65, 0, 0.35, 1)', // tertahan lalu lepas
  outExpo: 'easeOutExpo',                     // melambat tajam di akhir
}
```

### 1. Rack pull — expand card exercise

Saat exercise berpindah dari "belum dimulai" ke "aktif", card tidak langsung expand mulus — ada jeda kecil seperti menarik barbell dari rack (tertahan sesaat, lalu lepas).

```tsx
function expandExerciseCard(el: HTMLElement) {
  anime({
    targets: el,
    height: [0, el.scrollHeight],
    opacity: [0, 1],
    duration: 420,
    easing: EASE.pullTension,
  })
}
```

```html
<!-- Tailwind: state dasar sebelum JS ambil alih -->
<div class="overflow-hidden" data-exercise-card>
  <!-- isi card -->
</div>
```

### 2. Plate slide — tanda set selesai

Bukan centang fade biasa — elemen kecil meluncur dari kiri (seperti memasang plat di barbell) lalu *settle* tanpa bounce ceria.

```tsx
function markSetComplete(el: HTMLElement) {
  anime({
    targets: el,
    translateX: [-24, 0],
    opacity: [0, 1],
    duration: 320,
    easing: EASE.settle,
  })
}
```

```html
<span class="inline-flex items-center text-[--progress]" data-set-complete>
  <!-- icon plat / centang -->
</span>
```

### 3. Odometer roll — angka berat berubah

Saat angka kg berubah (misal 65 → 67.5), digit nge-roll vertikal seperti counter mekanik, bukan cross-fade angka lama ke baru. Diterapkan di elemen angka besar (signature element).

```tsx
function rollNumber(el: HTMLElement, from: number, to: number) {
  const obj = { value: from }
  anime({
    targets: obj,
    value: to,
    duration: 500,
    easing: EASE.outExpo,
    round: 1,
    update: () => {
      el.textContent = obj.value.toFixed(
        Number.isInteger(to) ? 0 : 1
      )
    },
  })
}
```

```html
<span class="font-mono tabular-nums text-5xl text-[--chalk]" data-weight-display>
  65
</span>
```

### 4. Chalk burst — PR (personal record) baru

Satu-satunya momen yang sengaja "merayakan" sesuatu — partikel kecil menyebar dari badge PR, mengingatkan kapur yang mengepul. Dipakai sangat jarang (hanya saat PR pecah), supaya tetap terasa spesial.

```tsx
function chalkBurst(originEl: HTMLElement) {
  const rect = originEl.getBoundingClientRect()
  const particles = Array.from({ length: 10 }, () => {
    const p = document.createElement('span')
    p.className = 'fixed w-1 h-1 rounded-full bg-[--chalk] pointer-events-none z-50'
    p.style.left = `${rect.left + rect.width / 2}px`
    p.style.top = `${rect.top + rect.height / 2}px`
    document.body.appendChild(p)
    return p
  })

  anime({
    targets: particles,
    translateX: () => anime.random(-40, 40),
    translateY: () => anime.random(-50, -10),
    opacity: [1, 0],
    scale: [1, 0.3],
    duration: () => anime.random(500, 800),
    easing: EASE.outExpo,
    complete: () => particles.forEach((p) => p.remove()),
  })

  // flash warna --intensity di badge itu sendiri
  anime({
    targets: originEl,
    backgroundColor: ['rgba(232,67,44,0)', 'rgba(232,67,44,0.25)', 'rgba(232,67,44,0)'],
    duration: 900,
    easing: 'linear',
  })
}
```

### 5. Count-up — angka ringkasan di dashboard

Streak, total volume, atau angka progress lain nge-itung naik dari 0 saat halaman dibuka, melambat tajam di akhir — reinforce signature element angka besar.

```tsx
function countUp(el: HTMLElement, target: number) {
  const obj = { value: 0 }
  anime({
    targets: obj,
    value: target,
    duration: 900,
    easing: EASE.outExpo,
    round: 1,
    update: () => { el.textContent = String(obj.value) },
  })
}
```

```tsx
// React: jalankan sekali saat elemen masuk viewport
useEffect(() => {
  if (ref.current) countUp(ref.current, streakDays)
}, [])
```

### 6. Tap feedback — semua tombol & badge interaktif

Bukan springy/bouncy — tekan terasa "padat" seperti menekan logam: scale turun tajam lalu balik cepat tanpa overshoot. Ini satu-satunya animasi yang dipasang global, karena frekuensinya tinggi dan harus konsisten di semua tombol.

```tsx
function tapFeedback(el: HTMLElement) {
  anime({
    targets: el,
    scale: [1, 0.96, 1],
    duration: 180,
    easing: EASE.settle,
  })
}
```

```tsx
// Hook reusable
function useTapFeedback() {
  const ref = useRef<HTMLButtonElement>(null)
  const onPointerDown = () => ref.current && tapFeedback(ref.current)
  return { ref, onPointerDown }
}
```

Sebagai fallback ringan tanpa JS (state hover/focus biasa), Tailwind tetap dipakai langsung di className:

```html
<button class="transition-transform active:scale-[0.97] duration-100">
  Simpan set
</button>
```

### Yang sengaja dihindari

Tidak ada hover effect di semua elemen, tidak ada parallax, tidak ada animasi page-transition dekoratif, tidak ada microinteraction acak di tiap ikon. Kalau sebuah animasi tidak masuk ke 6 daftar di atas dan tidak punya alasan fungsional yang jelas (menandai progress, hasil, atau feedback aksi), jangan ditambahkan — ini yang paling sering bikin UI buatan AI terasa "ramai tapi kosong".

## Per-halaman

**Landing page** (publik) — satu-satunya halaman yang boleh sedikit lebih ekspresif secara visual karena fungsinya meyakinkan orang baru, bukan dipakai cepat di gym. Tetap pakai palet yang sama, tapi bisa pakai ukuran tipografi display lebih besar dan ruang napas lebih lega.

**Dashboard** — ringkasan angka (streak, progress terakhir) jadi elemen besar di atas, daftar aktivitas terbaru di bawah dalam list padat.

**Catat workout** — paling padat fungsinya, prioritas ukuran sentuh dan kecepatan input di atas segalanya. Lihat pola card exercise di atas.

**Riwayat & flashback** — di sinilah grafik/chart dipakai (garis progress dari waktu ke waktu), dengan toggle perbandingan periode. Warna grafik pakai `--chalk` untuk garis utama, `--intensity` hanya untuk titik PR di grafik.

**Library exercise** — grid card dengan thumbnail GIF, lebih visual dibanding halaman lain karena fungsinya browsing/eksplorasi, bukan input cepat.

## Font loading

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700&family=Inter:wght@400;500&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
```
