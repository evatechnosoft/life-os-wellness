# Handoff: program onaylandı, admin kanalı kuruldu, APK 0.21.0 OTA bekliyor

> 2026-09-20 22:25 · `dev` @ 7550bbc · ağaç temiz · origin ile aynı

## Goal
Dean için 12 haftalık beslenme+antrenman programı (diyetisyen+PT personası, 3 değerlendirici)
ve "admin kanalı": ajanın telefona dokunmadan hedef/profil/kilo yazabilmesi.

## State (doğrulandı — tool çıktısı var)
- `docs/PROGRAM-2026-09.md` onaylı program (d272dd3). Okunur sayfa:
  https://claude.ai/code/artifact/0dedd076-7a3a-4330-9cae-98587da2260c
- Sunucu `profile` satırı dolu (1983, 175 cm, erkek, cut, hedef 100 kg, salon ekipmanı,
  conditions: HbA1c 5.9 / TG 302 / tansiyon izlemi). `training_split` Çar → sırt,omuz,bacak.
- `persona.ts` SYSTEM'e izlem önceliği satırı (tuz-potasyum-lif).
- PR #17 squash-merge: `db/007_goals.sql` (tek jsonb satır), `GET/PUT /api/goals` (PUT
  birleştirir), web `pullGoals` (App.tsx açılış+refresh), `saveGoals` → outbox, `ops/admin.mjs`.
- API konteyneri yeniden kuruldu; `node --env-file=.env ops/admin.mjs get goals` →
  `{"protein_g":180,"free_meal_day":6,"sets_per_group":10,"weekly_loss_pct":0.6}`.
- API test 57 pass, web 345 pass, typecheck temiz.
- `apps/web/android/variables.gradle` 0.21.0; `wellness-0.21.0.apk` derlendi
  (`apps/web/android/app/build/outputs/apk/debug/`). OTA kataloğunda (versionCode 2100).
- `build_apk.mjs` yanlış "APK üretilmedi" mesajı düzeltildi (138c47b).

## Doğrulanmadı
- Telefonda pullGoals'un gerçekten 180/0.6 getirdiği (APK yayınlanmadı, cihazda açılmadı).
- Tahlil PDF'i e-Nabız, 04.09.2026; değerler DB'ye değil dokümana/profil conditions'a yazıldı.

## Kararlar
- Hedefler jsonb tek satır, alan bazlı sütun yok (TS `Goals` şekil sahibi). Fastify AJV
  `removeAdditional`: bilinmeyen alan 400 değil, düşürülür — test buna göre.
- Protein 180 g (1.67 g/kg), haftalık kayıp 0.6; kalori hedefi yok (kilit).
- Serbest gün Cumartesi; tatlı kotası oraya bağlı.

## OTA indirme + tünel (21:45)
- APK indirme adresi artık `https://fit.evaitec.com/ota/wellness-<v>.apk` (PR #19): sunucu `./ota`
  dizinini token'sız servis eder, `publish_ota.mjs` kopyalar. Ölçüm: GitHub CDN 118 KB/s
  (24 MB = 205 s) → fit.evaitec.com 2.3 MB/s (10.5 s). Katalog 0.22.0 yeni adresle güncel.
- Tünel `network_mode: service:api` idi; api'yi yeniden kurunca ölü namespace'e bağlı kalıp
  530 veriyordu (bugün iki kez). Şimdi compose ağında, origin `http://api:3011`.

## Depo kararı (22:10)
- **APK deposu = bu makine** (fit.evaitec.com/ota, `./ota` bind mount). Dean: "sen bilgisayarı ayarla,
  R2/bulut sonra". `fit.evaitec.com/ota/` JSON liste veriyor (PR #20). Ölçüm: 24 MB APK 8 MB/s.
- R2 için gereken tek şey: `EVAITEC_CF_API_TOKEN_R2` (Workers R2 Edit + DNS Edit) → `~/.ai/vg.env`.
  Mevcut iki token salt okuma, R2 uçları 10000 Authentication error veriyor.

## Don't repeat
- **api'yi yeniden kurunca tüneli kontrol et:** `curl -s -o /dev/null -w "%{http_code}" https://fit.evaitec.com/health`
  200 değilse `docker compose --profile tunnel up -d --force-recreate cloudflared`.
- Profil PUT'unu curl inline JSON ile gönderme (Content-Length hatası, UTF-8); dosyadan
  `--data-binary @file` ya da `ops/admin.mjs` kullan.
- `proteinTarget` kesimde 2.2×gerçek kilo (238 g) öneriyor — bilinen bulgu, ayrı PR
  (`fix/protein-target-obese`, hedef kiloya tavan). Dean "yap" demedi, açma.
- Tek günlük kiloya tepki verme; karar 7-gün ortalaması.

## Son durum (22:25) — telefon doğrulaması açık
- Dean'in telefonunda Eva "Sunucu kapalı, kendi kayıtlarından yanıtlıyorum" dedi ve mesajlar dondu.
  O sırada api yeniden kuruluyordu (bir dakikalık boşluk). Sonrasında dışarıdan doğrulandı:
  `fit.evaitec.com/health` 200, `/api/chat` "selam" → 200 gerçek Eva cevabı.
- **Ama** api loglarında son 15 dk telefondan hiç `/api/*` isteği yok → telefon sunucuya
  ulaşmıyor olabilir (token/adres) ya da Dean o aralıkta denemedi. Cihazda doğrulanmadı.

## Next (tek adım)
Dean'den: aşağı çek → başlık "çevrimiçi" mi, "selam" tekrar. Yine "sunucu kapalı" ise
Ayarlar → Sunucu token; sonra `docker logs --since 10m life-os-wellness-api-1 | grep api/` ile
telefonun isteği geliyor mu bak (401 = token, hiç yok = adres/ağ). Donma tekrarlarsa
`apps/web/src/lib/chat.ts` çevrimdışı dalını incele.
Eski Next (OTA yayını) bitti: 0.22.0 katalogda, fit.evaitec.com/ota'dan iniyor.

## Verify
```bash
git rev-parse --short HEAD                       # 138c47b
node --env-file=.env ops/admin.mjs get goals     # protein_g 180
ls apps/web/android/app/build/outputs/apk/debug/ # wellness-0.21.0.apk
```
