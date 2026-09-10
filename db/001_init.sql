-- Wellness Tracker F0 schema. One row per day for daily_log/retro; workouts are many-per-day.
create extension if not exists "pgcrypto";

create table if not exists daily_log (
  id            uuid primary key default gen_random_uuid(),
  date          date unique not null,
  weight_kg     numeric(5,2),
  protein_g     integer,
  steps         integer,
  bp_systolic   integer,
  bp_diastolic  integer,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint daily_log_weight_sane check (weight_kg is null or (weight_kg > 20 and weight_kg < 400)),
  constraint daily_log_protein_sane check (protein_g is null or (protein_g >= 0 and protein_g <= 1000)),
  constraint daily_log_steps_sane check (steps is null or (steps >= 0 and steps <= 200000)),
  constraint daily_log_bp_sane check (
    (bp_systolic is null or (bp_systolic between 50 and 300)) and
    (bp_diastolic is null or (bp_diastolic between 30 and 200))
  )
);

create table if not exists workout (
  id            uuid primary key default gen_random_uuid(),
  date          date not null,
  type          text not null check (type in ('resistance','cardio','walk','rest')),
  duration_min  integer check (duration_min is null or (duration_min >= 0 and duration_min <= 600)),
  sets_total    integer check (sets_total is null or (sets_total >= 0 and sets_total <= 100)),
  muscle_groups text[] not null default '{}',
  notes         text,
  created_at    timestamptz not null default now()
);
create index if not exists workout_date_idx on workout (date);

create table if not exists retro (
  id            uuid primary key default gen_random_uuid(),
  date          date unique not null,
  went_well     text,
  resistance    text,
  experiment    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Filled from F1 (Health Connect). Kept apart from manual daily_log.steps on purpose.
create table if not exists wearable_sync (
  id            uuid primary key default gen_random_uuid(),
  date          date not null,
  source        text not null,
  metric        text not null,
  value         numeric not null,
  synced_at     timestamptz not null default now(),
  unique (date, source, metric)
);
