# TDD Kılavuzu

## Nerede zorunlu

- **Hesaplama katmanı (Sprint 3): %100.** 7-gün ortalama, uyum yüzdesi, streak,
  set toplamı. Buradaki hata tüm kararları sessizce bozar — önce test yazılır.
- **Tarih yardımcıları:** yerel gün üretimi, ay/yıl sınırı, gece yarısı sıfırlama.
- **Offline kuyruk (Sprint 2):** drain idempotent mi, aynı kayıt iki kez gitse ne olur.

## Nerede gereksiz

Placeholder UI, tek satırlık binding, tip tanımı. Test de YAGNI'ye tabidir.

## Nasıl

- API: `node --test` + `fastify.inject()`, gerçek Postgres'e karşı. `DATABASE_URL`
  yoksa test bloğu skip olur — CI'da set edilir, lokalde `npm run db:up` yeter.
  Test verisi `2099-*` tarihlerinde tutulur, gerçek kayıtla karışmaz.
- Web: `vitest`, saf fonksiyon testleri. React bileşeni için test yalnız davranış
  gerçekten kırılabilirse yazılır.
- Mock yerine gerçek bağımlılık tercih edilir (gerçek DB, gerçek Dexie); mümkün
  değilse fake implementasyon, davranış stub'ı değil.

## Kabul

`npm test` yeşil olmadan commit yok. "Geçti" demek için çıktı gösterilir.
