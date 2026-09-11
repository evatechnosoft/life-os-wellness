-- Saatin tanidigi antrenman seanslari gunluge dusuyor ama ne yapildigini bilmiyor:
-- Health Connect yalnizca sure ve sayisal bir tip veriyor, kas grubu ve agirlik yok.
-- needs_review = kullanici onaylayana kadar "bu neydi?" diye sorulacak kayit.
alter table workout add column if not exists needs_review boolean not null default false;

-- Kaldirilan agirlik: kalori tahmini ve ilerleme takibi icin kullanici girer.
alter table workout add column if not exists weight_kg numeric(5,1)
  check (weight_kg is null or (weight_kg >= 0 and weight_kg <= 500));
