# Handoff: 0.31.0 yayında · Samsung arşivi işlendi · Perşembe yürüyüş günü

> 2026-09-23 21:09 · `dev` @ `3cf982f` (tag `v0.31.0` push edildi) · kod ağacı temiz

## Goal
APK'de "güncelledim ama eski ekran" sorununu kökten bitirmek (yapıldı), sonra Dean'in
günlük koçluk isteklerini (öğün kaydı, kalori açığı, PT/diyetisyen değerlendirmesi) karşılamak.

## State — doğrulanmış (tool çıktısı var)
- `3cf982f` fix(apk): native derlemede `WELLNESS_NATIVE=1` → vite-plugin-pwa `selfDestroying`.
  Dosyalar: `apps/web/vite.config.ts`, `ops/build_apk.mjs`, `.github/workflows/apk.yml` (CI'a da env eklendi).
  Normal PWA derlemesi workbox SW'yi koruyor. typecheck temiz, 355/355 test.
- CI `Build APK` run 35862822422 başarılı; `publish_ota.mjs` → katalog 0.31.0 (versionCode 3100);
  `fit.evaitec.com/ota/wellness-0.31.0.apk` 200, APK içindeki `sw.js` self-destroying.
- Docker Desktop bir ara 500 verdi, fit.evaitec.com 530 oldu; Dean düzeltti. Sonrasında `/health` 200,
  token'la measurements/wearable/meals 200, token'sız 401.
- 23 Eyl öğünleri API'de: 09:00 480/33 · 13:00 1020/49 · 16:00 süzme 217 g 228/17 · 18:00 tavuk but+göğüs
  ~200 g + ıspanak + 2 yumurta 650/75 (tahmin, id /tmp'deydi — GET ile bul). Toplam 2378 kcal / 174 g.
- 23 Eyl daily: `waist_cm=117` (göbek hizası), notes'ta kemer yeri 113 cm.
- API token Dean'e sohbette verildi (Dean istedi). Telefonda girildiği **doğrulanmadı**.

## Believed / doğrulanmadı
- Telefonda 0.31.0 kurulumu ve SW temizliği cihazda denenmedi.
- Uygulama açılışta/pull-to-refresh'te 30 günü çekiyor (`App.tsx` refresh → `pullRange`), token girilince
  Hafta sekmesinde kilo ortalaması + dinlenme nabzı görünmeli — cihazda görülmedi.
- 20:00 tavuk suyu çorbası (parça tavuklu) planlandı, kaydedilmedi.

## Decisions
- Tansiyon: Dean "140/85 üzeri sil" dedi, seçenek sorulunca **silme, Pazar'a kadar kalibre ölçümle bak,
  Pazartesi karar** dedi. Kural: kalibrasyon sonrası sabah ort. <130/85 → 18–21 Eyl yüksekleri seriden çıkar;
  değilse kalır. Hiçbir şey silinmedi.
- Kalori: günlük hedef yok (kilit); sohbette haftalık ortalama bandı verildi: harcama ~2.780/gün (Mifflin tahmini),
  0.6 kg/hafta için ~700 açık → yemek haftalık ort. ~2.000–2.200. Pazartesi 7-gün ort 107.3 altına inmezse
  dinlenme günü akşam karbonhidratı çıkar.
- Koç değerlendirmesi: set kaydı yok (seanslarda sets=0), yüzme 10–16 dk (plan 30–40), kızartma/hamur işi
  kiloyu durduruyor. Değişim listesi sohbette verildi; uygulamaya kalıcı eklemek teklif edildi, cevap yok.

## 18:50 sonrası (sohbet, API'ye yazılan yok)
- Bel ölçümü artık **Pazartesi sabahı** (Pazar değil) — tansiyon/kilo değerlendirmesiyle aynı gün. İlk: 28 Eyl.
- 20:00 çorbası: Dean acıkmadıysa içmemesi önerildi; içerse ~150 kcal/12 g ile kaydedilecek. Kayıt yok.
- Meyve kuralı verildi: günde ≤2 porsiyon, gündüz, proteinle (süzme yanı / antrenman sonrası), 20:00 sonrası yok.
  Porsiyon: erik 3-4 (~90) · şeftali 1 (~60) · ananas 2 dilim (~75) · üzüm ~15 tane (~55). Bu gece en çok 2 erik.

## 19:20 sonrası
- 19:55 öğünü API'ye yazıldı: 2 mürdüm erik + 2 limonlu çay (şekersiz varsayıldı) 45 kcal / 1 g (POST 201, GET ile doğrulandı).
  23 Eyl toplam **2423 kcal / 175 g protein**, 5 satır. Çorba içilmedi (kayıt yok). Mutfak kapandı denildi.

## 20:20 sonrası
- Plan: `PUT /api/workout-plan` weekday 4 (Perşembe) swim → **rest** (Dean: "yüzme yok, yürüyorum"). GET ile doğrulandı.
  Salı (2) hâlâ swim — Dean'e soruldu, cevap yok.
- Dean günde 3 ayrı yürüyüş yapıyor (sabah/öğle/akşam); yemek sonrası 10–20 dk önerildi, plan değişmedi.
- Samsung arşivi (`~/.claude/uploads/8e0a978e-.../7ba657c5-samsunghealth_deancjx_20260923200302.zip`):
  `import:samsung --from 2026-09-23` koştu → 2 antrenman yazıldı, günlük "zaten doluydu" (importer dolu günü EZMEZ).
  Adım elle PUT: 22 Eyl 9089, 23 Eyl 9388 (200). 7-gün adım ort 7376.
- Arşivden okunan (yazılmadı): uyku saatle yalnız 2 gece — 21→22 00:53–07:35 402 dk verim 84 skor 56;
  22→23 00:00–07:50 470 dk verim 79 skor 56. Öneri: 23:30 yatak, saat her gece takılı.
  Yüzme hep salon sonrası 10–16 dk, 150–300 m, HR 111–114 (kondisyon uyaranı değil).
  Salon 21/23 Eyl ~52–55 dk, set kaydı yok.
- 23 Eyl tansiyonu: importer 128/78 hesapladı, daily'de 122/82 kaldı — Pazartesi kararına kadar dokunulmadı.

## Don't repeat
- `import_samsung.mjs` sleep okumuyor; uyku için `com.samsung.shealth.sleep.*.csv` ham oku (start/end UTC, +time_offset).
  Aynı gece iki cihaz satırı olabiliyor: skoru olan (saat, deviceuuid h2tno0sG32) esas.
- "Eski sürüm" demeden kurulu sürümü sor (SW önbelleği). 0.31.0 sonrası bu sınıf bitmeli.
- `/api/meals|wearable|measurements` `start`/`end` ister (from/to değil) — yoksa 400.
- `PUT /api/daily/:date` kısmi upsert: yalnız gönderilen alan güncellenir, güvenli.
- Tansiyon kayıtlarını Dean'in Pazartesi kararı olmadan silme.
- Host→Docker flaky olabiliyor; 530 görünce önce `docker ps`, Docker Desktop 500 veriyorsa Dean'e söyle.

## Next (tek adım)
Dean'e: telefonda 0.31.0 + token + Health Connect izni tamam mı, Hafta sekmesinde kilo/nabız geldi mi? Sonra
24 Eyl sabah tansiyon (kalibre, 2 ölçüm) + kilo; Perşembe yürüyüş günü (3 yemek sonrası yürüyüş, ~9.000 adım). Pazartesi 28 Eyl: tansiyon serisi kararı + haftalık 7-gün ortalama değerlendirmesi.

Bekleyenler: değişim listesini uygulamaya ekleme teklifi · Faz 2 UI (`ui/DayStrip.tsx`, `ui/SessionCard.tsx`) ·
seans sonu mobility hareketinin adı · `docs/PLAN-WEAR.md` §9.
