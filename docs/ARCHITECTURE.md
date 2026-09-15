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

## Eva — üç kademeli yanıt

Konuşmanın tek girişi `apps/web/src/lib/chat.ts` → `ask()`. Bağlam bir kez toplanır
(`gather`): modele metin olarak, kural motoruna yapılandırılmış olarak gider.

```
ask(soru)
  │ bağlam: son 7 gün + yiyecek hafızası + hesaplanmış öneriler
  ├─ sunucu var ──► POST /api/chat ──► LiteLLM ──► Gemini 2.5 Flash   (en iyi yanıt, web araması)
  │                    │ 429 → "Eva yoğun" (offline'a düşmez: sunucu ayakta)
  │                    └ ağ hatası ↓
  └─ sunucu yok/düştü
       ├─ model indirilmiş (yalnız APK) ──► Gemma 3 1B int4, telefonda   (serbest konuşma)
       └─ değilse ──────────────────────► offline.ts kural motoru        (PWA dahil, 0 MB)
```

Persona tek dosyada: `apps/api/src/persona.ts`. Sunucu ve telefondaki model **aynı**
`SYSTEM` metnini ve aynı `splitReply` ayrıştırmasını kullanır; iki kopya persona iki
farklı Eva demekti. Gemma'nın sistem rolü olmadığı için `gemmaPrompt` personayı ilk
kullanıcı turuna gömer (`localLlm.ts`).

Üç kademede de değişmeyen iki şey: `<kayit>` bloğu onaysız yazılmaz, ve hesaplanmamış
rakam yazılmaz. Kural motoru zaten yalnız `coach.ts`/`nutrition.ts` çıktısını cümleye
döker, uydurma imkânı yok. Fotoğraf yalnız sunucuyla okunur — cihaz-içi model görme
yeteneği taşımıyor, bunu söylemeden metin yanıtı vermek tabağa bakılmış gibi görünürdü.

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
- **Cihaz-içi model APK'ya gömülmez, indirilir.** Dosya ~530 MB; APK'ya koymak her
  sürüm güncellemesini yarım gigabayta çıkarırdı. İndirme kullanıcının düğmesiyle,
  `OtaUpdater.fetchTo` ile — APK güncellemesiyle aynı indirme döngüsü, iki kopya ağ
  kodu iki farklı hata davranışı demekti.
- **MediaPipe `tasks-genai`, llama.cpp değil.** Hazır `.task` dosyasını çalıştırıyor;
  alternatifi NDK ile kendi JNI köprümüzü derlemek ve bakmaktı.

## F1/F2 kancaları

- Capacitor aynı `apps/web` build'ini sarar; Health Connect plugin'i `wearable_sync`
  satırları üretip API'ye yazar.
- MCP server (F2) `/api/*` üzerinden okur; yazma ayrı scope ister (SPEC §7).
