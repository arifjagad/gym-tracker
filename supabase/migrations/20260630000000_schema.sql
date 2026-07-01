-- ============================================================
-- GYM TRACKER DATABASE SCHEMA (DDL + RLS + TRIGGERS + INDEXES)
-- ============================================================

-- ============================================================
-- 1. EXERCISES — local mirror dari WorkoutX API (Public Read-Only)
-- ============================================================
create table public.exercises (
  id text primary key,              -- pakai ID asli dari WorkoutX, bukan uuid
  name text not null,
  body_part text,
  target text,
  equipment text,
  gif_url text,
  instructions text[],
  created_at timestamptz default now()
);

-- ============================================================
-- 2. PROFILES — extend auth.users, simpan status plan
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  plan_tier text not null default 'free' check (plan_tier in ('free', 'pro')),
  pro_expires_at timestamptz,
  created_at timestamptz default now()
);

-- ============================================================
-- 3. SUBSCRIPTIONS — riwayat transaksi pembayaran (tahap 3)
-- ============================================================
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('active', 'expired', 'cancelled')),
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  payment_ref text,
  created_at timestamptz default now()
);

-- ============================================================
-- 4. PLANS — template paket latihan milik user
-- ============================================================
create table public.plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);

-- ============================================================
-- 5. PLAN_CATEGORIES — kategori otot per hari dalam satu plan
-- ============================================================
create table public.plan_categories (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  category_name text not null,      -- contoh: 'Dada', 'Back', 'Bicep'
  day_of_week text,                 -- contoh: 'senin'
  created_at timestamptz default now()
);

-- ============================================================
-- 6. PLAN_EXERCISES — daftar exercise dalam satu kategori
-- ============================================================
create table public.plan_exercises (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.plan_categories(id) on delete cascade,
  exercise_id text not null references public.exercises(id) on delete cascade,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- ============================================================
-- 7. SESSIONS — satu sesi gym pada tanggal tertentu
-- ============================================================
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid references public.plans(id) on delete set null,
  workout_date date not null default current_date,
  created_at timestamptz default now()
);

-- ============================================================
-- 8. WORKOUT_LOGS — catatan aktual tiap set (inti fitur flashback)
-- ============================================================
create table public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  exercise_id text not null references public.exercises(id) on delete cascade,
  set_number int not null,
  reps int,
  weight_kg numeric(6,2),
  created_at timestamptz default now()
);

-- ============================================================
-- INDEXES — untuk performa query flashback & relasi
-- ============================================================
create index idx_workout_logs_exercise on public.workout_logs(exercise_id);
create index idx_sessions_user_date on public.sessions(user_id, workout_date);
create index idx_workout_logs_session on public.workout_logs(session_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) — AKTIFKAN
-- ============================================================
alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.plans enable row level security;
alter table public.plan_categories enable row level security;
alter table public.plan_exercises enable row level security;
alter table public.sessions enable row level security;
alter table public.workout_logs enable row level security;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- PROFILES — user hanya bisa lihat & update profil sendiri
create policy "view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "update own profile" on public.profiles
  for update using (auth.uid() = id);

-- SUBSCRIPTIONS — user hanya bisa lihat riwayat sendiri (insert/update lewat service_role di webhook)
create policy "view own subscriptions" on public.subscriptions
  for select using (auth.uid() = user_id);

-- PLANS
create policy "manage own plans" on public.plans
  for all using (auth.uid() = user_id);

-- PLAN_CATEGORIES — akses lewat relasi ke plans
create policy "manage own plan categories" on public.plan_categories
  for all using (
    auth.uid() = (select user_id from public.plans where plans.id = plan_categories.plan_id)
  );

-- PLAN_EXERCISES — akses lewat relasi ke plan_categories -> plans
create policy "manage own plan exercises" on public.plan_exercises
  for all using (
    auth.uid() = (
      select p.user_id from public.plans p
      join public.plan_categories pc on pc.plan_id = p.id
      where pc.id = plan_exercises.category_id
    )
  );

-- SESSIONS
create policy "manage own sessions" on public.sessions
  for all using (auth.uid() = user_id);

-- WORKOUT_LOGS — akses lewat relasi ke sessions
create policy "manage own workout logs" on public.workout_logs
  for all using (
    auth.uid() = (select user_id from public.sessions where sessions.id = workout_logs.session_id)
  );

-- ============================================================
-- TRIGGER: BUAT PROFILE OTOMATIS SAAT USER BARU TERDAFTAR
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, plan_tier)
  values (new.id, 'free');
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
