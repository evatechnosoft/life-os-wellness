# PLAN — F0 icra adımları

Kaynak: `docs/SPEC.md` §9. Sprint bitmeden sonrakine geçilmez.

## Sprint 1 — iskelet (bu commit)

- [x] `db/001_init.sql`: daily_log, workout, retro, wearable_sync + sağlık kontrolleri
- [x] `db/migrate.js`: numaralı migration çalıştırıcı, `schema_migrations` takibi
- [x] `apps/api`: Fastify CRUD (daily upsert, retro upsert, workout, export) + bearer token
- [x] `apps/api/test`: endpoint + doğrulama testleri (DATABASE_URL yoksa skip)
- [x] `apps/web`: Vite + React + Tailwind + Dexie şeması + PWA manifest/service worker
- [x] `apps/web/src/lib/date.ts` + testleri (yerel gün, UTC kayması yok)

## Sprint 2 — giriş akışı

- `feature/today-screen`: kilo, protein artımlı buton (+30/+35/+40, gün içinde birikir,
  gece yarısı sıfırlanır), antrenman, adım, tansiyon; 20:00 sonrası retro kartı öne çıkar
- `feature/offline-queue`: yazma → Dexie → `outbox` → çevrimiçi olunca drain, idempotent
- Çıktı: **buradan sonra günlük kullanmaya başla** (2 hafta gerçek veri)

## Sprint 3 — analiz (TDD zorunlu)

- `feature/metrics-engine`: 7-gün hareketli ortalama (eksik gün ortalamayı bozmaz),
  protein uyum yüzdesi, streak, kas grubu bazında haftalık set toplamı
- `feature/week-screen`: tek sparkline + uyum yüzdesi + set/adım özeti

## Sprint 4 — tamamlama

- `feature/settings`: hedefler (protein 140 g, haftalık 0.5-0.75 kg, set aralığı), token alanı
- `feature/export`: JSON dışa aktarma (API `/api/export` hazır, UI eksik)
- `feature/reminders`: sabah tartı / akşam retro bildirimi

## F1 kapısı

F0 kabul kriterleri (SPEC §8) yeşil + 2 hafta kesintisiz kullanım verisi olmadan
Capacitor/Health Connect işine başlanmaz.
