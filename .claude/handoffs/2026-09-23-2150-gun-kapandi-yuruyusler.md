# Handoff: 0.31.0 yayında (SW kendini siler) · 23 Eyl günü kapandı · Pazartesi karar günü

> 2026-09-23 21:50 · `dev` @ `3cf982f` (tag `v0.31.0`) · kod değişikliği yok, yalnız API verisi yazıldı

## Goal
APK'de "güncelledim ama eski ekran" sorununu kökten bitirmek (bitti), sonra Dean'in günlük
koçluk akışı: öğün/yürüyüş kaydı, kalori açığı, PT+diyetisyen değerlendirmesi.

## State — doğrulanmış (tool çıktısı var)
- `3cf982f` fix(apk): native derlemede `WELLNESS_NATIVE=1` → vite-plugin-pwa `selfDestroying`
  (`apps/web/vite.config.ts`, `ops/build_apk.mjs`, `.github/workflows/apk.yml`). PWA SW'si değişmedi.
  typecheck temiz, 355/355 test. CI run 35862822422 yeşil; OTA katalog 0.31.0 (3100);
  `fit.evaitec.com/ota/wellness-0.31.0.apk` 200, içindeki `sw.js` self-destroying.
- fit.evaitec.com: Docker Desktop bir ara 500 → 530; Dean düzeltti. Sonra `/health` 200, token'lı API 200.
- 23 Eyl API verisi (hepsi GET ile doğrulandı):
  - Öğün 5 satır, toplam **2423 kcal / 175 g**: 09:00 omlet 480/33 · 13:00 mücver+pirzola+pilav 1020/49 ·
    16:00 Mis süzme 217 g 228/17 (etiket) · 18:00 tavuk but+göğüs ~200 g + ıspanak + 2 yumurta 650/75 (tahmin) ·
    19:55 2 erik + 2 limonlu çay 45/1.
  - Daily: adım **9388** (Samsung ekranıyla birebir), kilo 107.8, TA 122/82, `waist_cm=117` (göbek), not: kemer yeri 113.
  - 22 Eyl adım 9089'a düzeltildi. 7-gün adım ort **7376**.
  - Antrenman 4: salon 52 dk · yüzme 11 dk · yürüyüş 15:41 20 dk 1653 adım 220 kcal HR 103 ·
    **akşam yürüyüşü 18:30–20:00 90 dk, 2235 adım, 1.69 km, 137 kcal** (19:00–19:30 durup konuşma, adım yok — Dean teyit).
- Plan: Perşembe (weekday 4) swim → rest (yürüyüş günü). Salı (2) hâlâ swim — Dean'e soruldu, cevap yok.

## Believed / doğrulanmadı
- Telefonda 0.31.0 kurulumu, token girişi, Health Connect izni, Hafta sekmesinde kilo/nabız görünmesi — cihazda görülmedi.
  Telefon sunucuya hâlâ yazmıyor olabilir: 23 Eyl adımı sunucuda 4306'ydı, elle düzeltildi.

## Decisions
- **Tansiyon:** hiçbir kayıt silinmedi. Pazartesi 28 Eyl: kalibre sabah ort. <130/85 → 18–21 Eyl yüksekleri seriden çıkar,
  değilse kalır. 23 Eyl: importer 128/78 hesapladı, daily'de 122/82 — karara kadar dokunma.
- **Bel:** her **Pazartesi** sabahı, aç, göbek + kemer yeri. İlk tekrar 28 Eyl.
- **Kalori:** günlük hedef yok (kilit). Sohbette: harcama ~2780/gün, 0.6 kg/hafta için ~700 açık →
  haftalık ort. ~2000–2200 kcal. Pazartesi 7-gün kilo ort 107.3 altına inmediyse dinlenme günü akşam karbonhidratı çıkar.
- **Hareket:** yüzme bırakıldı (hep 10–16 dk, HR ~112, uyaran değil). Yemek sonrası 3 yürüyüş, günde ~9000 adım.
- **Meyve:** ≤2 porsiyon/gün, gündüz, proteinle; 20:00 sonrası yok.
- PT değerlendirmesi: set kaydı yok (seanslarda sets=0), kızartma/hamur işi kiloyu durduruyor; değişim listesi sohbette
  verildi, uygulamaya kalıcı ekleme teklif edildi — cevap yok.

## Don't repeat
- Samsung egzersiz kartındaki kronometre değeri (19:54) **süre**, saat değil; başlangıç sağ üstte.
- Egzersiz olarak görünmeyen yürüyüş saatlik adım grafiğinde olabilir — Dean'in ekranından topla, tahmin yazma
  (Dean: "tahmine gerek yok, topla").
- `import_samsung.mjs` dolu günü EZMEZ ve uyku okumaz; uyku için `com.samsung.shealth.sleep.*.csv` ham (UTC + time_offset),
  skorlu satır (saat, deviceuuid h2tno0sG32) esas. Adım farkı varsa `PUT /api/daily/:date {"steps":N}` (kısmi upsert).
- `/api/meals|wearable|measurements|workouts` `start`/`end` ister; `POST /api/workouts` aynı id ile günceller.
- Tansiyonu Pazartesi kararı olmadan silme.
- `.claude/` altında `rm`/`cp` hook'a takılıyor — dosyaları Write ile yaz.

## Next (tek adım)
24 Eyl sabah: iki tansiyon ölçümü + tartıyı al/kaydet; Dean'e telefonda token/Health Connect durumu ve Salı yüzme sorusunu sor.
Pazartesi 28 Eyl: tansiyon kararı + bel + 7-gün kilo ortalaması değerlendirmesi.

Bekleyenler: değişim listesini uygulamaya ekleme · salon set kaydı alışkanlığı · Faz 2 UI (`ui/DayStrip.tsx`,
`ui/SessionCard.tsx`) · seans sonu mobility hareketinin adı · `docs/PLAN-WEAR.md` §9.
