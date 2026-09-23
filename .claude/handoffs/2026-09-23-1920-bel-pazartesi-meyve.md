# Handoff: 0.31.0 yayında · bel ölçümü Pazartesiye · meyve kuralı verildi

> 2026-09-23 19:20 · `dev` @ `3cf982f` (tag `v0.31.0` push edildi) · kod ağacı temiz

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

## Don't repeat
- "Eski sürüm" demeden kurulu sürümü sor (SW önbelleği). 0.31.0 sonrası bu sınıf bitmeli.
- `/api/meals|wearable|measurements` `start`/`end` ister (from/to değil) — yoksa 400.
- `PUT /api/daily/:date` kısmi upsert: yalnız gönderilen alan güncellenir, güvenli.
- Tansiyon kayıtlarını Dean'in Pazartesi kararı olmadan silme.
- Host→Docker flaky olabiliyor; 530 görünce önce `docker ps`, Docker Desktop 500 veriyorsa Dean'e söyle.

## Next (tek adım)
Dean'e: telefonda 0.31.0 + token + Health Connect izni tamam mı, Hafta sekmesinde kilo/nabız geldi mi? Sonra
20:00 çorbasını kaydet. Pazartesi 28 Eyl: tansiyon serisi kararı + haftalık 7-gün ortalama değerlendirmesi.

Bekleyenler: değişim listesini uygulamaya ekleme teklifi · Faz 2 UI (`ui/DayStrip.tsx`, `ui/SessionCard.tsx`) ·
seans sonu mobility hareketinin adı · `docs/PLAN-WEAR.md` §9.
