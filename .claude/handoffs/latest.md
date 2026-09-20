# Handoff: program onaylandı, admin kanalı kuruldu, APK 0.21.0 OTA bekliyor

> 2026-09-20 21:05 · `dev` @ ad40b13 · ağaç temiz · APK 0.22.0 OTA'da (afiş dahil)

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

## Don't repeat
- Profil PUT'unu curl inline JSON ile gönderme (Content-Length hatası, UTF-8); dosyadan
  `--data-binary @file` ya da `ops/admin.mjs` kullan.
- `proteinTarget` kesimde 2.2×gerçek kilo (238 g) öneriyor — bilinen bulgu, ayrı PR
  (`fix/protein-target-obese`, hedef kiloya tavan). Dean "yap" demedi, açma.
- Tek günlük kiloya tepki verme; karar 7-gün ortalaması.

## Next (tek adım)
APK OTA'da. Dean uygulamayı açınca Ayarlar'da protein 180 görünmeli; görünmezse pullGoals'u cihazda doğrula.

## Verify
```bash
git rev-parse --short HEAD                       # 138c47b
node --env-file=.env ops/admin.mjs get goals     # protein_g 180
ls apps/web/android/app/build/outputs/apk/debug/ # wellness-0.21.0.apk
```
