# Handoff: seans preset paylaşıldı · rampa setleri · menüde tatlı/tabak

> 2026-09-24 20:13 · `dev` @ `6bf53d9` · tag `v0.35.0` · plan: `docs/PLAN-GERCEKCI.md`

## Goal
Dean'in günlük kullanımı: yarın (25 Eyl Cum A′) ve gelecek hafta seanslarında ısınma + rampa
uygulamada otomatik görünsün; tatlı/tabak sayfalarına menüden ulaşılsın.

## State — doğrulanmış
- `1910544` menü: `/plan/tabak`, `/plan/tatli` kısa adresleri + `/plan/secici.html` iskeletle sarılı
  (`apps/api/src/server.ts`); Drawer'da `href`'li dış linkler (`ui/Drawer.tsx`, `App.tsx` TOOLS).
  Canlı 4 adres 200. Test: `apps/api/test/api.test.ts` "plan araclari" (DB'siz koşar).
- `6d83130` rampa: `PlanExercise.warmup` (0–3), `prefill()` R satırları üretir (2 → %50×8 + %75×5,
  1 → %60×8, 2.5'e yuvarlı, ilk çalışma setinin ağırlığından); `buildWorkout` warmup satırlarını atar.
  API şeması `warmup` kabul ediyor (`routes.ts` PLAN_BODY). 375/375 web test, typecheck 0.
- Canlı plan (GET /api/workout-plan): A bench 1R, lat 1R, leg press 2R, omuz presi 1R · B butterfly 1R,
  iso row 1R, hip thrust 2R · A′ eğik chest 1R, pulldown 1R, leg press 2R. Tümü 3 set.
- Gün notları (GET /api/split, weekday 1/3/5) ısınma/rampa/soğuma metniyle değişti (200 karakter sınırı);
  eski hareket listesi notları silindi.
- 21 Eyl seansı `e8157969…` GUNLUK-2026-09-21'den 19 setle yazıldı, needs_review false; exercise-sets doğrulandı.
- 0.34.0 ve 0.35.0 APK OTA katalogda, `fit.evaitec.com/ota/wellness-0.35.0.apk` 200.

## Believed / doğrulanmadı
- Telefonda set kartı R satırları ve menü linkleri görülmedi; Capacitor'da `target=_blank` dış tarayıcı açar varsayımı.
- A′'nin eğik chest/pulldown/leg press/calf/omuz yan için geçmiş yok → yarın ağırlıklar boş gelir.

## Decisions
- Rampa kuralı seans kartı (ilk hareket 2, sonraki 1) değil GUNLUK-2026-09-21 §5 ("bacak 2, üst gövde 1") — daha yeni ve açık.
- Rampa satırları sunucuya gitmez: şema değişikliği yok, "geçen sefer" ve sets_total kirlenmez.
- İlerleme (+%5) otomatik uygulanmıyor; kart geçen seferin değerini gösterir.

## Don't repeat
- `git commit -am ... -- <path>` hata verir; tag atmadan önce bump commit'inin varlığını kontrol et (0.34.0 yanlış commit'e etiketlendi, iptal+yeniden etiket).
- `PUT /api/workout-plan` her günde `day_type` ister; gönderilmeyen label/system korunur.
- jq'da tire içeren anahtarlar tırnaklı olmalı.
- `publish_ota.mjs` "release not found" satırı zararsız; katalog yine güncelleniyor.

## Ek (20:13) — preset karşılaştırma
- `6bf53d9` `docs/seans/PRESET-HAFTA.md`: 25 Eyl A′, 28 Eyl A, 30 Eyl B — hareket, rampa, hedef kg×tekrar
  (GUNLUK-2026-09-21 §4 +%5 hedefleri). Dean'e SendUserFile ile gönderildi.
- Dean amacı: aynı seansı başka bir uygulamaya da kaydedip bizimkiyle karşılaştırmak.
- Bilinçli fark: set kartı geçen seferin değerini doldurur (ör. Pzt chest 35-40-45), preset hedefi gösterir (40-45-50).
- Tahmin (doğrulanmadı): eğimli chest 30 kg, yan kaldırış 5 kg — kayıt yok.

## Next (tek adım)
25 Eyl A′ sonrası: Dean'in diğer uygulama kaydını al → `GET /api/workouts?start=2026-09-25&end=2026-09-25` → `sets` dolu ve R satırı yok mu (sets_total = çalışma setleri); iki kaydı set/kg/tekrar/süre/nabız bazında yan yana koy.
Bekleyen: 23 Eyl B setleri kayıtta yok · 28 Eyl Pazartesi karar kartı (P2.2) · özellik dondurma (PLAN-GERCEKCI P3) tekrar gündeme.
