-- Ilerleme onerisi (double progression) tekrar sayisi olmadan calismaz: ayni
-- agirlikta tekrarin arttigini gormeden "yuku artir" denemez. Seans basina
-- toplam tekrar yeterli - set basina dagilimi kullanicidan istemek giris
-- suresini uzatir, oran set sayisindan zaten turetilir.
alter table workout add column if not exists reps_total integer
  check (reps_total is null or (reps_total >= 0 and reps_total <= 1000));
