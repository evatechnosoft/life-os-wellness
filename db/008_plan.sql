-- Haftalik seans plani ve set kayitlari (docs/superpowers/specs/2026-09-21-tek-uygulama-ia-design.md S5.1).
--
-- weekday = JS getDay: 0 = pazar, training_split (db/003) ve plan.js rollWeek ile
-- ayni sayilar. DayStrip yalniz goruntude pazartesiden baslar.
--
-- exercises jsonb: [{id, sets, slot}]. Hareket katalogu sunucuda dosya (EXERCISES_FILE),
-- tabloda degil - foreign key yok, id metin olarak tutulur.
create table if not exists workout_plan (
  weekday    smallint primary key check (weekday between 0 and 6),
  day_type   text not null check (day_type in ('lift','swim','rest')),
  system     text,   -- 'tumVucut' | 'bolunmus' | null
  label      text,   -- 'A', 'B', 'itis' ...
  exercises  jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- Set-set kayit. id istemciden gelir: cevrimdisi kuyrugun yeniden oynatilmasi
-- satiri cogaltmasin. Seans silinince setleri de gider.
create table if not exists exercise_set (
  id          uuid primary key,
  workout_id  uuid not null references workout(id) on delete cascade,
  exercise_id text not null,
  set_no      smallint not null check (set_no between 1 and 20),
  weight_kg   numeric(5,1) check (weight_kg is null or weight_kg between 0 and 500),
  reps        smallint check (reps is null or reps between 0 and 100),
  done_at     timestamptz,
  unique (workout_id, exercise_id, set_no)
);

-- "Gecen sefer 45x12": ayni hareketin son setleri.
create index if not exists exercise_set_exercise_idx on exercise_set (exercise_id, done_at desc);
