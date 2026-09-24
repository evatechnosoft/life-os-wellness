# Handoff: uygulama uzaktan yüklensin (GymPro Manager modeli) · salon verisi uygulamaya

> 2026-09-24 23:30 · `dev` @ `145d230` · plan: bu dosya + `docs/SALON-UYGULAMASI.md`

## Goal
Dean'in şikâyeti: "Yaptık diyoruz, uygulamada ne kendi verimi ne eklenenleri görüyorum."
Hedef: yapılan her şey **telefondaki uygulamada** görünsün; sonra salon verisi uygulamaya girsin.

## State — doğrulanmış
- **Kök neden:** `apps/web/capacitor.config.ts` → `webDir: 'dist'`, `server.url` yok. APK web'i kendi içinde taşıyor;
  her web değişikliği yeni APK + OTA kurulumu istemeden telefona gelmiyor.
- `https://fit.evaitec.com/` zaten canlı web'i sunuyor (200, `<title>Wellness Tracker</title>`, `assets/index-BFb1uyHB.js`).
  `/plan/preset.html` 200. Service worker var (`vite-plugin-pwa`, `vite.config.ts`).
- GymPro Manager aynı sorunu `screensBaseUrl: https://manager-app.gympro.online/` ile çözmüş: kabuk uygulama, ekranlar sunucudan.
- Salon: Manager'dan alınacak veri yok (WebView kabuğu). Üye API'si: misafir token alınıyor, kişisel veri 401 → Dean'in girişi şart.
- Bu oturumda **uygulamaya kod eklenmedi**; yalnız doküman (`docs/SALON-UYGULAMASI.md`, 3 commit).

## Next — yarın, sırayla (her adımın kanıtı Dean'in telefonundan ekran görüntüsü)
1. **Uzaktan kabuk:** `capacitor.config.ts` → `server: { url: 'https://fit.evaitec.com', cleartext: false }`.
   Ayarlar'a görünür sürüm/derleme etiketi ekle. Son APK (0.36.0) OTA ile → sonra yalnız web deploy yeter.
   Kanıt: web'e deploy edilen etiket APK'da görünür. Uçak modunda açılış: SW önbellekten açılıyor mu (offline-first kilidi).
   Kamera / yerel bildirim eklentileri uzak sayfada çalışıyor mu — test et (doğrulanmadı).
2. **Görünürlük turu:** preset/karşılaştır, rampa setleri, 24 Eyl kayıtları uygulamada nerede — Dean ile tek tek ekranda göster.
3. **Salon S1:** Dean `.env`'e `GYM_USER/GYM_PASS/GYM_COMPANY` + SMS kodu → sunucu cihaz kaydı → `Measurements`, `Workouts`, `MemberSummaryInformation` ham JSON.
4. **Salon S1b + S2:** "Giriş" QR sayfası (`GET /api/gym/qr`) + salon ölçümü `measurement` tablosuna `source='gym'`. Uygulamada görünür.

## Don't repeat
- Doküman yazıp "yaptık" deme; kabul ölçütü telefondaki ekran.
- Telefonun DeviceID'sini kopyalama / QR'ı yerelde üretme (tek-cihaz korumasını atlatmak).
- hbctool HBC 96'yı açmıyor → `hbc-decompiler` (hermes-dec) + `hbc-file-parser` string tablosu.
