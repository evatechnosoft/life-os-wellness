# Life OS — Wellness Tracker

Kişisel (tek kullanıcı) günlük sağlık takibi: kilo, protein, antrenman, adım, tansiyon
ve akşam retrosu. `life-os-finance` ile kardeş repo; ortak düzen `REPO-STANDARD.md`.

Tam gereksinim: [`docs/SPEC.md`](docs/SPEC.md) · Faz/sprint planı: [`docs/PLAN.md`](docs/PLAN.md)

## Canlı

**https://evatechnosoft.github.io/life-os-wellness/** — telefonda aç, menüden
"Ana ekrana ekle". Tam ekran açılır, uçak modunda da çalışır.

Pages sürümü **sunucusuz** çalışır: veriler telefonun IndexedDB'sinde durur, Ayar
ekranından JSON olarak dışa aktarılır. Ayar ekranına bir API token girersen uygulama
kendi sunucuna senkronlamaya başlar (token girilmeden önce yazılan kayıtlar geride kalır).
`dev` dalına her push Pages'e yeniden dağıtır.

## Durum

F0 Sprint 1-3 bitti: şema + CRUD API, Bugün/Hafta/Ayar ekranları, offline kuyruk,
7-gün ortalama · uyum yüzdesi · streak · kas grubu set toplamı, JSON export.
Kalan: hatırlatmalar (Sprint 4), sonra F1 (Capacitor + Health Connect).

## Hızlı başlangıç

```bash
cp .env.example .env          # API_TOKEN'i degistir
npm install
npm run db:up                 # postgres:16 -> localhost:5433
npm run db:migrate
npm start                     # hepsini birden ayaga kaldirir, LAN linkini yazar
npm run dev:api               # ya da tek tek: http://localhost:3011
npm run dev:web               # https://localhost:5174 (/api -> 3011 proxy)
npm test                      # api entegrasyon + web birim testleri
```

`npm start` linki `?token=...` ile verir; token ilk açılışta kaydedilir ve adresten silinir.
LAN üzerinden HTTPS self-signed sertifikayla sunulur (service worker secure context ister),
telefonda bir kez "yine de devam et" demen gerekir.

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
