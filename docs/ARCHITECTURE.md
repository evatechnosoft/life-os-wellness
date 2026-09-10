# Mimari

## Katmanlar

```
apps/web (PWA)                     apps/api (Fastify)          PostgreSQL
┌──────────────────────┐           ┌──────────────────┐        ┌──────────────┐
│ UI (React)           │           │ routes.ts        │        │ daily_log    │
│  ↓ yazma             │  fetch    │  JSON schema     │  pg    │ workout      │
│ Dexie (IndexedDB)    │ ────────► │  doğrulama       │ ─────► │ retro        │
│  ├ daily_log/workout │  bearer   │ server.ts        │        │ wearable_sync│
│  └ outbox (kuyruk)   │  token    │  auth hook       │        └──────────────┘
└──────────────────────┘           └──────────────────┘
```

**Yazma yönü tektir:** UI → Dexie → outbox → API → Postgres. UI hiçbir zaman ağı
bekleyip bloklanmaz; ağ hatası "henüz senkronlanmadı" demektir, veri kaybı değil.

**Okuma:** ekranlar Dexie'den okur. Sunucu, cihazlar arası ve F2 (MCP) için
kalıcı kaynaktır, ekranların anlık bağımlılığı değil.

## Kararların gerekçesi

- **Ayrı `wearable_sync` tablosu:** F1'de gelen otomatik adım verisi manuel
  `daily_log.steps` ile karışmaz. Çakışmada otomatik kazanır, manuel silinmez.
- **Kısmi upsert:** `PUT /api/daily/:date` yalnız gönderilen alanları yazar; gün içinde
  protein pulsu göndermek sabahki kiloyu ezmez (test: `apps/api/test/api.test.ts`).
- **`date` kolonu string olarak okunur** (`pg.types` parser). JS `Date`'e çevirmek
  saat dilimine göre günü kaydırır.
- **Migration aracı yok:** numaralı `.sql` + 40 satırlık runner, tek kullanıcılı proje
  için ORM/migration framework'ünden daha az bakım demek.
- **ORM yok, `pg` + düz SQL.** Şema küçük ve sabit.
- **Sağlık kontrolleri hem DB constraint hem API schema'sında.** DB son savunma:
  ileride MCP (F2) yazma yaptığında API'yi baypas etse bile saçma değer giremez.

## F1/F2 kancaları

- Capacitor aynı `apps/web` build'ini sarar; Health Connect plugin'i `wearable_sync`
  satırları üretip API'ye yazar.
- MCP server (F2) `/api/*` üzerinden okur; yazma ayrı scope ister (SPEC §7).
