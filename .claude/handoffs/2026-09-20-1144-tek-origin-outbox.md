# Handoff: fit.evaitec.com tek origin oldu, outbox kilidi açıldı

> 2026-09-20 · `dev` @ `3850d47` (origin/dev ile aynı) · çalışma ağacı temiz

## Goal

Kıdemli developer denetimi istendi, üç bulgu çıktı. Dean ikisini onayladı ve bir iş
daha ekledi: **fit.evaitec.com giriş alan adı olsun** ("API de ne alaka"). Üçü de
`feature/tek-origin` dalında yapıldı, `dev`'e merge edildi ve push'landı.

## State

Üç commit + merge, `dev`'de:

- `8852a69` feat(server): tek origin — imaj PWA'yı da servis ediyor, hız sınırı `cf-connecting-ip`
- `72008c1` fix(outbox): reddedilen yazma kuyruğu kilitlemesin + `recordMetrics` outbox'tan geçiyor
- `74a7239` docs(readme): giriş adresi fit.evaitec.com, Pages ayna
- `3850d47` merge

### Doğrulandı (komut çıktısı var)

- `npm test`: **401 yeşil** — web 345 (`vitest`, 21 dosya), api 56 (`node --test`, 9 suite)
- `npm run typecheck --workspaces`: iki workspace de çıktısız
- `npm run build -w @wellness/web`: `✓ built in 6.66s`, PWA precache 10 entry / 561 KiB
- `docker build -f apps/api/Dockerfile`: başarılı (çok aşamalı imaj)
- Gerçek konteynerin içinden `fetch` ile:
  ```
  /                     -> 200 text/html   <!doctype html> <html lang="tr">
  /manifest.webmanifest -> 200 application/manifest+json
  /sw.js                -> 200 application/javascript
  /health               -> 200 {"ok":true}
  /api/daily?...        -> 401 {"error":"unauthorized"}   (tokensiz ve yanlış tokenla)
  ```
- Hız sınırı regresyon testi kırmızı→yeşil kanıtlandı: `server.ts`'te `clientKey(req)`
  geçici olarak `req.ip`'ye çevrilince
  `✖ one caller burning the guess window does not lock another one out`,
  geri alınınca `✔`.

### Canlı — yayında ve doğrulandı

`docker compose build api` + `docker compose --profile tunnel up -d api cloudflared`
çalıştırıldı (Dean onayıyla). `https://fit.evaitec.com` üzerinden:

```
/health               200 application/json
/                     200 text/html
/manifest.webmanifest 200 application/manifest+json
/sw.js                200 application/javascript
/api/daily tokensiz   401 {"error":"unauthorized"}
/api/daily tokenli    200, 19 Eylül satırı geldi (107.6 kg, 145 g protein, 138/87)
```

Servis edilen bundle yeni kodu taşıyor: `/assets/index-D4wxUmFj.js` içinde
`outbox: sunucu reddetti` dizgesi var (yalnız bu commit'te eklendi).

**Rollback:** `life-os-wellness-api:rollback-20260920` (imaj `de4b8114c45d`) —
`docker tag life-os-wellness-api:rollback-20260920 life-os-wellness-api:latest` sonra
`docker compose --profile tunnel up -d api cloudflared`. Şema değişmedi.

### Doğrulanmadı (açıkça)

- Telefonda/APK'da denenmedi. APK ve Pages aynası `DEFAULT_BASE` mutlak URL yoluna
  düşüyor — kodda öyle, cihazda görülmedi.
- Hız sınırının canlıda çağıran başına ayrıştığı tek IP'den yoklanamadı; kanıt
  `api.test.ts`'teki kırmızı→yeşil regresyon testi.

## Decisions ve gerekçe

- **`@fastify/static` eklendi** (tek yeni bağımlılık, AGENTS gereği gerekçe burada):
  path traversal koruması + cache/mime başlıkları elle yazılacak şey değil. Resmî
  Fastify eklentisi.
- **`trustProxy` KULLANILMADI.** Cloudflare `x-forwarded-for`'un en soluna çağıranın
  yazdığı değeri bırakıyor → sahtelenebilir. `cf-connecting-ip` her istekte CF
  tarafından üzerine yazılıyor, güvenilen tek başlık o.
- **Kabuk açıktan yükleniyor**, token yalnız `/api/*`'ı kapatıyor: aksi hâlde token'ı
  yazacak sayfa da açılmıyor. Statik kabuk veri taşımıyor.
- **401/403 outbox'ta "retry"**, "rejected" değil: token yanlışken kuyruğu boşaltmak
  Dean'in yazdıklarını yer. Yalnız diğer 4xx düşürülüyor.
- **Pages aynası silinmedi** — çalışan dağıtım, `dev`'e her push ile tazeleniyor.
  Sürüm kayması riski var, Dean karar verecek.
- **`health.ts`'teki toplu wearable push'u outbox'a alınmadı**: `syncHealth` 7 günlük
  pencereyi 15 dakikada bir yeniden itiyor, kendi kendini onarıyor; 500 kayıtlık
  batch kuyruğu şişirirdi. Sorun tek atışlık kaynaklardaydı (`recordMetrics`).
- **`fake-indexeddb` eklenmedi**: kuyruk kararı saf fonksiyona (`verdictFor`)
  çıkarıldı ve öyle test edildi. Yeni bağımlılık gerekmedi.

## Don't repeat

- **Dockerfile'ın web aşaması `apps/api`'yi de kopyalamak zorunda.** `localLlm.ts`
  `../../../api/src/persona`'dan import ediyor; yalnız `apps/web` kopyalanınca
  `TS2307: Cannot find module` ile patlıyor. Bu bir kez yaşandı, çözümü commit'te.
- **Imajın `API_PORT`'u 3011'e sabitlendi.** Eskiden default 3001'di ve `EXPOSE 3011`
  ile çelişiyordu; compose üzerine yazdığı için görünmüyordu. `docker run` ile elle
  denerken bu tuzağa düşüldü.
- **Windows'ta `-p 13011:3011` + `curl` exit 52 verdi** (boş yanıt), konteyner
  sağlıklıyken. Uç yoklaması için `docker exec ... node -e 'fetch(...)'` kullan,
  host port publish'iyle uğraşma.
- Önceki devrin "tekrar etme" listesi hâlâ geçerli: yüzmede nabız yok (MET yolu),
  Health Connect Wear OS'ta çalışmıyor, Fitness Index Watch6'da açılmıyor, Reddit
  erişilemiyor.

## Next — tek bir iş

`apps/web/src/lib/cardioLoad.ts`'i TDD ile yaz (sözleşme `docs/PLAN-WEAR.md` §8.3,
çıktı `{ load, source: 'hr' | 'met' | 'rpe' }`).

Beklemedeki küçük işler (acil değil, sırayla): reddedilen outbox kayıtlarını
(`db.settings` → `outbox_rejected`) Ayar ekranında göster; `fake-indexeddb` ile
`store.ts` kuyruk döngüsünü de test et; `Settings.tsx` 550 satır, bölünmeyi hak ediyor.

## Verify

```bash
git rev-parse --short HEAD          # 3850d47
git status --porcelain | wc -l      # 0
npm test                            # web 345 + api 56
npm run typecheck --workspaces      # çıktısız
curl -s https://fit.evaitec.com/health          # deploy sonrası {"ok":true}
curl -s -o /dev/null -w '%{http_code}\n' https://fit.evaitec.com/   # deploy sonrası 200
```

## Yeniden başlangıç promptu (yapıştır)

```
life-os-wellness (D:\projects\evaitec\lifeOS\life-os-wellness), dal dev @ 3850d47, ağaç temiz.
fit.evaitec.com artık giriş alan adı ve YAYINDA: aynı konteyner hem PWA'yı hem API'yi
servis ediyor, /api/* token'la kapalı. Outbox'ın kalıcı kilitlenme hatası ve hız
sınırının tek-kova hatası düzeltildi. 401 test yeşil, canlı uçlar yoklandı.
Rollback imajı: life-os-wellness-api:rollback-20260920.

Önce .claude/handoffs/latest.md'yi oku ve Verify bloğunu çalıştır.
Sıradaki iş: apps/web/src/lib/cardioLoad.ts'i TDD ile yaz, sözleşme docs/PLAN-WEAR.md §8.3.
Yeni araştırma açma — Fitness Index ve Reddit konuları kapalı.
```
