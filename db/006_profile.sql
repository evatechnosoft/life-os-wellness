-- Profil: Eva kullaniciyi tanisin (docs/PLAN-COACH.md S1).
--
-- Bugune kadar modele yalniz son 7 gunun sayilari gidiyordu; kim oldugu gitmiyordu.
-- Bu yuzden "bana uygun mu" sorularina genel cevap cikti. Tani/ilac alanlari
-- COACH-PERSONA S2 kirmizi bayraklarinin calismasi icin zorunlu.
--
-- Tek kullanicili uygulama: tablo tek satir tutar (id sabit 1). Ayri bir kullanici
-- tablosu acmak auth'suz bir uygulamada bos yere jointir.
create table if not exists profile (
  id                integer primary key default 1 check (id = 1),
  -- Yas protein/kalori araliklari ve kirmizi bayrak esikleri icin; dogum yili
  -- saklanir ki kayit her yil bayatlamasin.
  birth_year        integer check (birth_year is null or (birth_year between 1900 and 2100)),
  height_cm         integer check (height_cm is null or (height_cm between 80 and 250)),
  sex               text check (sex is null or sex in ('male','female')),
  goal              text check (goal is null or goal in ('cut','maintain','gain')),
  target_weight_kg  numeric(5,2) check (target_weight_kg is null or (target_weight_kg > 20 and target_weight_kg < 400)),
  training_years    numeric(4,1) check (training_years is null or (training_years >= 0 and training_years <= 80)),
  -- Serbest metin listeleri: sabit bir tani/ilac sozlugu tutmak tek kullanicili
  -- bir uygulamada bakim yuku, degeri yok. Model metni okuyor.
  conditions        text[] not null default '{}',
  medications       text[] not null default '{}',
  injuries          text[] not null default '{}',
  dislikes          text[] not null default '{}',
  allergies         text[] not null default '{}',
  cuisine           text,
  -- S2 hareket filtresi bunu okuyacak; degerler PLAN-COACH S1 tablosundan.
  equipment         text[] not null default '{}',
  days_per_week     integer check (days_per_week is null or (days_per_week between 0 and 7)),
  session_min       integer check (session_min is null or (session_min between 10 and 240)),
  updated_at        timestamptz not null default now()
);
