-- Hedefler (protein, haftalik kayip, serbest gun...) sunucuda da yasar.
--
-- Bugune kadar yalniz telefonun IndexedDB'sindeydi; ikinci cihaz ve ajan (admin
-- kanali, ops/admin.mjs) yazamiyordu. Sekil TS'e ait (apps/web/src/lib/settings.ts
-- > Goals), alan bazli sutun acmak tek satirlik ayar icin bakim yuku: jsonb.
create table if not exists goals (
  id          integer primary key default 1 check (id = 1),
  value       jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);
