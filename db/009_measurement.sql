-- Gun ici coklu olcum. daily_log gunde tek deger tutuyor (22 Eyl'e kadar yeterliydi);
-- 23 Eyl'de Dean ayni gun uc tansiyon olcup hepsini saklamak istedi - ust uste
-- yaziliyordu. Karar birimi artik "sabah olcumlerinin ortalamasi", o hesap icin
-- her olcumun kendi satiri ve saati gerekiyor.
--
-- daily_log silinmiyor: gunun ozeti (7-gun ortalamasi, trend) hala oradan okunuyor.
-- Istemci olcum ekleyince gunun sabah ortalamasini daily_log'a da yaziyor - tek
-- kaynak degil ama tek OKUMA yolu: trend kodu degismedi.
create table if not exists measurement (
  id            uuid primary key,
  date          date not null,
  -- Yerel saat HH:MM. Sabah/aksam ayrimi buna bakiyor, zaman dilimi tasimiyoruz
  -- (uygulama tek kullanici, tek cihaz - UTC'ye cevirmek gunu kaydirirdi).
  time          text not null check (time ~ '^[0-2][0-9]:[0-5][0-9]$'),
  bp_systolic   smallint check (bp_systolic is null or bp_systolic between 50 and 260),
  bp_diastolic  smallint check (bp_diastolic is null or bp_diastolic between 30 and 160),
  pulse         smallint check (pulse is null or pulse between 30 and 220),
  weight_kg     numeric(5,1) check (weight_kg is null or weight_kg between 20 and 400),
  note          text,
  created_at    timestamptz not null default now(),
  -- Bos satir yazilmasin: en az bir olcum degeri olmali.
  check (bp_systolic is not null or bp_diastolic is not null
         or pulse is not null or weight_kg is not null)
);

create index if not exists measurement_date_idx on measurement (date, time);
