-- Haftalik antrenman ajandasi: pazartesi gogus, sali sirt... Tek kullanici
-- oldugu icin tablo en fazla yedi satir; weekday birincil anahtar, 0 = pazar
-- (JavaScript getDay() ile ayni sayilar, cevrim yapilmasin diye).
create table if not exists training_split (
  weekday       integer primary key check (weekday between 0 and 6),
  muscle_groups text[] not null default '{}',
  note          text,
  updated_at    timestamptz not null default now()
);
