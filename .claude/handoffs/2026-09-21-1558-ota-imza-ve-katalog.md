# Handoff: OTA imza kök nedeni · katalog sunucudan · gün notu bug'ı

> 2026-09-21 15:58 · `dev` @ `0b94768` · çalışma ağacı temiz · önceki: `2026-09-21-1240-...`

## Hedef

Handoff'taki açık iş listesi: (1) egzersiz kataloğu sunucudan, (2) APK yayını,
(4) `training_split.note` bug'ı. Arada Dean "saat için OTA indirmiyor" dedi → kök neden avı.

## Kanıtlanmış durum

### OTA hiç çalışmıyordu — indirme değil, imza (`3b4d958`, `f26156a`)
`apksigner verify --print-certs`: `wellness-wear-0.23.0` → `6bb4b5f0…`,
`0.24.0` → `f656b912…`. **Her CI koşusu kendi debug keystore'unu üretiyordu**;
farklı sertifika = `INSTALL_FAILED_UPDATE_INCOMPATIBLE`, APK inse de kurulmaz.
- Keystore yerelde üretildi, `gh secret set DEBUG_KEYSTORE_B64` ile repoya kondu
  (fingerprint `B7:22:AB:AA:…`, parola `android`, alias `androiddebugkey`).
  **Yerel kopya: `%TEMP%/wellness-debug.keystore` — kalıcı bir yere alınmalı, kaybolursa
  zincir yeniden kırılır.**
- İlk deneme (`3b4d958`) keystore'u `~/.android/debug.keystore`'a yazdı; **yetmedi**,
  0.25.0 yine farklı sertifikayla çıktı (`d782675…`). AGP orayı kullanmadı.
- Çalışan çözüm (`f26156a`): `app/` ve `wear/build.gradle` içinde
  `signingConfigs.debug` → `rootProject.file('debug.keystore')`, dosya yoksa eski davranış.
  Workflow secret'ı `apps/web/android/debug.keystore`'a yazıyor (.gitignore'da).
- **0.26.0 telefon + saat: ikisi de `b722abaade53bc…`** — beklenen keystore'un sertifikası.

Sağlam olduğu ölçülenler (sorun bunlarda değildi): manifest
`releases/latest/download/latest.json` → 200 ve 0.26.0 gösteriyor; `fit.evaitec.com/ota/`
APK 200, 2.3 MB/s; `Range: bytes=100-` → **206** (Cloudflare tüneli resume'u bozmuyor).

### Katalog sunucudan (`c266021`)
`GET /api/exercises` → `EXERCISES_FILE` (compose mount `./apps/web/src/data/exercises.json`).
Kanıt: `curl :3011/api/exercises` → 200, 43 hareket. İstemci sırası: Dexie önbelleği →
sunucu (3 sn tavan) → gömülü JSON. `applyCatalog` boş/bozuk veriyi reddediyor.
`EXERCISES` artık `let`; ES canlı bağlantı sayesinde import edenler günceli görüyor.
`main.tsx` top-level await kullanamıyor (build target es2020) → `loadCatalog().finally(render)`.

### Gün notu bug'ı (`6af913b`)
Sanılan: `queueSplit` notu null'luyor. **Gerçek: `PUT /api/split` iki alanı da koşulsuz
yazıyordu** — çip değiştirmek notu, not yazmak çipleri siliyordu. Artık `'note' in day` /
`'muscle_groups' in day` ile yalnız gönderilen alan yazılıyor.
Kanıt (canlı :3011): not yazıldı → gruplar durdu; grup yazıldı → not durdu.
UI: `pullSplit` notu çekiyor, DayHeader gösteriyor, Ayarlar > Haftalık program > Gün notu.

### Liste alternatifleri + çekim rehberi (`0b94768`)
Liste satırında "yerine: X · Y" (aynı kas, farklı alet, ilk iki). `build-exercises.mjs`
artık `exercise-tr.json`'daki `media` alanını upstream karelerine tercih ediyor.
`docs/CEKIM-REHBERI.md`: açı/kadraj/tempo, 12 hareketlik öncelik, ffmpeg GIF komutu,
`fit.evaitec.com/media/` servis yolu.

`npm test` 347/347, `typecheck` temiz, `vite build` başarılı, APK koşusu `success`.

## Doğrulanmadı

- Saatte/telefonda 0.26.0'ın kurulduğu — cihaz kanıtı yok. Eski sürüm eski sertifikayla
  imzalı olduğu için **önce kaldırılması** gerekiyor; Dean'e söylendi, yaptığı bilinmiyor.
- Sunucudaki haftalık ajanda A/B programına hizalandı (Pzt/Çar/Cum, notlara A/B/A′).
  Dean'in onayı alınmadı, söylendi.
- `publish_ota.mjs` her koşuda stderr'e "release not found" yazıyor — `gh release view`
  başarısız olup `create` yoluna giriyor, normal akış. Gürültü, hata değil.

## Tekrarlanmayacaklar

- Keystore'u `~/.android/debug.keystore`'a yazıp AGP'nin alacağını varsayma — almadı.
- OTA "indirmiyor" şikâyetinde önce ağı suçlama: manifest/hız/Range üçü de sağlamdı,
  sorun imzaydı. **İlk bakılacak yer `apksigner verify --print-certs`.**
- Canlı veriye test PUT'u atma. Pazartesi satırı bu yüzden bir kez bozuldu
  (ilk PUT `muscle_groups`'u boşalttı) — aynı bug'ın aynasıydı, öyle yakalandı ama şanstı.
- `main.tsx`'e top-level await koyma (vite target es2020, build kırılır).
- APK'nın web varlıkları gömülü (`webDir: dist`, capacitor `server` yok): web tarafı
  düzeltmesi yeni APK olmadan telefona inmez.

## Açık işler

1. Cihaz kanıtı: saatten Wellness kaldır → evaitecOTA'dan 0.26.0 kur → çalıştığını gör.
   Linkler: `fit.evaitec.com/ota/wellness-wear-0.26.0.apk`, `…/wellness-0.26.0.apk`.
2. Çekim: Dean'e sorulan ve cevapsız — çekimi kim yapıyor (Dean/dummy), ilk tur 12 hareket
   mi yoksa Pazartesi A gününün 6'sı mı. Öneri: A günü 6 hareket.
3. Liste alternatifleri + çekim rehberi henüz APK'da yok (0.26.0 sonrası commit) → bir
   sonraki sürüme girer.
4. Kalan 12 makine kullanım kartı (`docs/KULLANIM-KARTLARI.md`).
5. `%TEMP%/wellness-debug.keystore` kalıcı yere alınmalı (yedeksiz kalırsa imza zinciri kırılır).

## Sıradaki tek adım

Dean 0.26.0'ı saate kurup sonucu bildirsin; imza zinciri cihazda doğrulanana kadar
başka APK turu atma.
