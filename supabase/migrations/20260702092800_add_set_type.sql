-- Migration: Add set_type to workout_logs
alter table public.workout_logs 
add column set_type text not null default 'R' 
check (set_type in ('W', 'D', 'F', 'R'));
