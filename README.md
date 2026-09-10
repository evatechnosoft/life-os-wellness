# Life OS — Wellness Tracker

Kişisel (tek kullanıcı) günlük sağlık takibi: kilo, protein, antrenman, adım, tansiyon
ve akşam retrosu. `life-os-finance` ile kardeş repo; ortak düzen `REPO-STANDARD.md`.

Tam gereksinim: [`docs/SPEC.md`](docs/SPEC.md) · Faz/sprint planı: [`docs/PLAN.md`](docs/PLAN.md)

## Durum

F0 / Sprint 1 (iskelet): şema + CRUD API + offline PWA kabuğu. Ekranlar Sprint 2-4'te dolar.

## Hızlı başlangıç

```bash
cp .env.example .env          # API_TOKEN'i degistir
npm install
npm run db:up                 # postgres:16 -> localhost:5433
npm run db:migrate
npm run dev:api               # http://localhost:3001
npm run dev:web               # http://localhost:5174 (/api -> 3001 proxy)
npm test                      # api entegrasyon + web birim testleri
```

Web ilk açılışta `localStorage.wellness.api_token` değerini `.env` içindeki `API_TOKEN`
ile aynı yapmalısın (Ayar ekranı Sprint 4'te gelir).

## Yapı

```
apps/api/     Fastify + pg, tek statik bearer token, JSON schema doğrulama
apps/web/     Vite + React + TS + Tailwind + Dexie + vite-plugin-pwa
db/           numaralı .sql migration'lar + migrate.js
ops/          yardımcı scriptler (gen_icons.mjs)
docs/         SPEC, PLAN, ARCHITECTURE, TDD-GUIDELINE
```

## Neden PWA, neden Kotlin/Flutter değil

F1'de aynı React kodu Capacitor ile native kabuğa sarılıp Health Connect'e bağlanır.
Kotlin/Flutter seçmek F0'ı sıfırdan yazmak ve "2 hafta gerçek kullanım verisi"
hedefini geciktirmek demekti. Gerekçenin tamamı `docs/SPEC.md` §5'te.
