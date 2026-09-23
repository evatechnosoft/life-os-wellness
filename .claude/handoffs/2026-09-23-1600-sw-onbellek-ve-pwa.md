# Handoff: 0.30.0 kurulu ama eski arayüz çiziliyor (service worker) · PWA tazelendi

> 2026-09-23 16:00 · `dev` @ `5c38dd5` · çalışma ağacı temiz, uzakla eşit
> Yayın 0.30.0, Dean'in telefonunda **kurulu** ("Kurulu sürüm 0.30.0 (3000)" ekranla doğrulandı).

## Düzeltme — önceki devirdeki tespit yanlıştı

15:15 devrinde "telefon eski sürümde, 0.30.0 inmedi" yazmıştım. **Yanlış.** Dean'in
ekran görüntüsü kurulu sürümün 0.30.0 olduğunu gösterdi. Beş sekmeli eski düzeni
görmesinin sebebi sürüm değil, **service worker önbelleği**.

Kanıt zinciri:
- İndirilen APK: 24.596.490 bayt, sha256 `ceaf0fc2…c536c` = katalogla birebir,
  `aapt2 dump badging` → `versionName='0.30.0'`.
- APK içindeki derlenmiş arayüzde (`assets/public/assets/*.js`) "Ölçümü ekle",
  "Ölçümleri çek", "Hareket kütüphanesi" üçü de **var**.
- `vite.config.ts:19` → `VitePWA({ registerType: 'autoUpdate' })`: açılışta önce
  önbellekteki sayfa gösterilir, yeni sürüm arkada indirilir. Güncellemeden sonraki
  **ilk açılışta eski arayüz** görünür.

**Dean'e verilen yol:** uygulamayı görev listesinden tamamen kapat → yeniden aç;
düzelmezse Android > Uygulamalar > Wellness > Depolama > **Önbelleği temizle**
(uygulamadaki "Bu cihazdaki veriyi sil" düğmesine dokunma, senkronlanmamış kayıt gider).
Dean "APK yüzünü ben hallederim" dedi, sonucu bilinmiyor.

**Kalıcı çözüm (yapılmadı, sıradaki iş):** APK derlemesinde service worker kaydı
kapatılmalı — varlıklar zaten cihazda, SW'nin orada işi yok. PWA (tarayıcı) için kalacak.

## Yapıldı: fit.evaitec.com tazelendi

Sunucudaki PWA 22 Eyl imajındaydı (arayüzde "Ölçümleri çek"/"Ölçümü ekle" yoktu).
`docker compose build api` + `up -d api` → yeni asset `index-CNx17ZAA.js`, üç metin de
içinde. `/api/meals`, `/api/measurements`, `/api/wearable` → 200.
**Not: `db/009` migration'ı bu rebuild'den önce elle uygulanmıştı** (konteyner içinden
psql), yeni imaj onu tekrar uygulamıyor - şema yerinde.

## Hâlâ Dean'de bekleyen

- **API token + Health Connect izinleri** telefonda verilmedi. Token yoksa sunucuya
  yazılamaz ve arka plan işi kurulmaz. 23 Eyl uykusu bu yüzden sunucuda yok
  (wearable'da yalnız 4 satır, hepsi Samsung arşivinden).
- Uygulamayı kapat-aç sonucu (SW önbelleği).

## Tekrarlanmayacaklar

- **"Eski sürüm" demeden önce kurulu sürümü sor.** APK doğru olup arayüz eski
  olabiliyor - SW önbelleği bu sınıf hatanın kaynağı.
- Host → Docker bağlantısı bugün flaky: `localhost:3011`/`5433` host'tan ölü,
  `docker exec` ve tünel sağlam. Migration ve API testleri bu yüzden host'tan koşmuyor;
  `apps/api` testlerinden `one caller burning the guess window` bu nedenle 500 veriyor -
  **kod hatası değil.**
- OTA indirme tünelde koptu ("Connection closed", 24 MB). Yerel yol:
  `http://192.168.1.185:3011/ota/wellness-0.30.0.apk` (aynı dosya, tünelsiz).
- `gh api --output` yok · `gh release download` tag ucu boş varlık listesi önbellekliyor
  (id ucundan indir) · `ifEmpty { continue }` Kotlin 2.2 öncesi derlenmiyor ·
  Dexie `transaction('rw', ...)` tek tek tablo imzası beş tabloda bitiyor ·
  `curl -d` Türkçe karakteri bozuyor.

## Koçluk durumu (değişmedi, özet)

Tansiyon 7-gün ortalaması 132.2/86.7, sabah serisi 134→141→128→128→122. Kalibrasyon
referansları 125/75 ve 129/79 (manşet) → bugünkü 128/78 gerçek. **Dinlenme 90 sn'de**,
3 gün daha aynı bantta gelirse 75 sn. Ölçüm protokolü: sabah, kahveden önce, iki ölçüm.
23 Eyl beslenme: 1500 kcal / 82 g protein (2 öğün), akşam proteinli öğün gerekiyor.
Uludağ sıfır kalori tonik soruldu: 0 kcal / 0 şeker / 0,02 g tuz — günde 1 şişe serbest.

## Sıradaki tek adım

**APK'da service worker kaydını kapat** (`apps/web/vite.config.ts` + Capacitor derlemesi
ayrımı), sürüm çıkar. Bu, "güncelledim ama eski ekran" sorununu kökten bitirir.

Bekleyenler: OTA kataloğuna yerel adres yedeği · Faz 2 UI (`feature/bugun-kartlari`,
`ui/DayStrip.tsx` + `ui/SessionCard.tsx`) · seans kartında hâlâ "özel aç" diyen
Hip thrust (B) ve Calf press (A′) · Dean'in seans sonuna eklediği mobility hareketinin
adı (üç kez soruldu, cevap gelmedi) · `docs/PLAN-WEAR.md` §9 saatten doğrudan okuma.
