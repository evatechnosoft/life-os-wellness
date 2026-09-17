-- Diyetisyen katmani cekirdegi (docs/PLAN-DIET.md S1/S3/S4/S6).
--
-- Ogunler bugune kadar yalniz telefonda (Dexie) duruyordu: telefon degisince
-- aclik skoru, kcal gecmisi ve "bugun abarttim" tetiginin dayandigi 14 gunluk
-- ortanca gidiyordu. Fotograf cihazda kalir, yalniz sayilar senkronlanir.
create table if not exists meal (
  -- Id istemciden gelir: cevrimdisi kuyruk yeniden oynatilinca satir cogalmasin.
  id            uuid primary key,
  date          date not null,
  -- Yerel HH:MM. Slot (sabah/ogle/aksam) bu saatten turetilir, sunucuda saklanmaz.
  time          text not null check (time ~ '^[0-2][0-9]:[0-5][0-9]$'),
  protein_g     integer check (protein_g is null or (protein_g >= 0 and protein_g <= 500)),
  kcal          integer check (kcal is null or (kcal >= 0 and kcal <= 10000)),
  -- S3 aclik skoru: opsiyonel, varsayilan bos. Zorunlu tutmak 60 sn kuralini bozar.
  hunger        integer check (hunger is null or (hunger between 1 and 10)),
  note          text,
  -- Sayinin nereden geldigi: elle, fotograf tahmini, barkod (S6 hibrit katmanlari).
  source        text check (source is null or source in ('manual','photo','barcode','usda','turkomp')),
  barcode       text check (barcode is null or barcode ~ '^[0-9]{8,14}$'),
  estimated     boolean not null default false,
  created_at    timestamptz not null default now()
);
create index if not exists meal_date_idx on meal (date);

-- S1: gun icin tek dokunusluk "abarttim" isareti. Tetik 2 (kcal ortancasi) bunu
-- dogrulamaz, tamamlar; kullanicinin kendi isareti her zaman gecerlidir.
alter table daily_log add column if not exists overate boolean not null default false;

-- S4: sebze/baklagil porsiyonu (hedef 5) ve haftalik bel olcusu. Lif grami
-- sayilmaz - besin DB'si porsiyon kadar ucuz degil, porsiyon ayni ise yarar.
alter table daily_log add column if not exists veg_servings integer
  check (veg_servings is null or (veg_servings >= 0 and veg_servings <= 30));
alter table daily_log add column if not exists waist_cm numeric(4,1)
  check (waist_cm is null or (waist_cm > 40 and waist_cm < 200));
