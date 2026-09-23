# Handoff: arka plan ölçüm senkronu · model kalıcı klasörde · 0.29.1 yayında

> 2026-09-23 13:06 · `dev` @ `0.29.1` etiketi · çalışma ağacı temiz, uzakla eşit
> Dean gün içinde aktif: sabah B seansını yaptı, öğün fotoğrafları geldi.

## Bu turda biten iki iş

### 1. Cihaz-içi model kaldır-kur'da siliniyordu (0.28.0)

Model (`gemma3-1b-it-int4.task`, ~530 MB) `filesDir` altındaydı. Kullanıcı izin verirse
artık `/sdcard/evaitec/llm` altına taşınıyor ve kurulumdan bağımsız kalıyor.
`MANAGE_EXTERNAL_STORAGE` gerekti: MediaPipe gerçek dosya yolu istiyor, `content://`
Uri kabul etmiyor, o yüzden MediaStore yolu kapalı. İzin yoksa davranış eskisi gibi.
Ayarlar > Cihaz-içi Eva'da **"Kalıcı klasöre taşı"** düğmesi — izin yoksa sistem ayar
ekranını açar, izin varsa mevcut dosyayı kopyalar (yeniden indirme yok).

**Kök neden ayrı ve Dean'e söylendi:** kaldırıp kurma zorunluluğu aslında 0.26.0'daki
sertifika geçişiydi. İmza artık sabit keystore'a bağlı → 0.27 üstüne 0.28 kaldırmadan
kurulabilmeli. Bu henüz cihazda doğrulanmadı.

### 2. Ölçüm senkronu uygulama kapalıyken durmuştu (0.29.1)

`App.tsx:82` senkronu uygulama **açıkken** 15 dk'da bir koşuyordu. `HealthSyncWorker`
(WorkManager, **8 saat**, ağ şartlı) kapalıyken de Health Connect'i okuyup
`/api/wearable`'a yazıyor. Dean "bir 12'de bir 8 gibi yeter" dedi; 8 saatlik periyot
günde üç çekim veriyor, Android sabit saate izin vermiyor.

- Okuma **tek yerde**: `HealthExtraPlugin.readDaily`'nin gövdesi companion'daki
  `collect()`'e alındı; worker da onu çağırıyor.
- **Adım artık Kotlin tarafında da** okunuyor (`HealthMath.dailySteps`, en yüksek tek
  kaynak — üç uygulama aynı günü yazıyor).
- Sunucu adresi + token web katmanında (`localStorage`); worker göremediği için
  `SharedPreferences`'a kopyalanıyor, her açılışta ve ayar değişiminde tazeleniyor.
- Ayarlar > Sunucu: **"Ölçümleri çek"** düğmesi (elle tetikleme).

## Doğrulanmadı — cihaz kanıtı bekliyor

- 0.29.1'in telefonda koştuğu, arka plan işinin gerçekten yazdığı. CI derledi, cihazda
  çalışmadı. **Samsung pil optimizasyonu** bu işi kısarsa 8 saat 20 saate çıkar:
  Ayarlar → Pil → Wellness → Kısıtlama yok.
- Modelin `/sdcard/evaitec/llm` yolundan MediaPipe tarafından açıldığı.
- Yerelde Java 21 yok, Kotlin derlemesi yalnız CI'da doğrulanıyor.

## Tekrarlanmayacaklar

- `ifEmpty { continue }` → Kotlin 2.2 öncesinde derlenmiyor ("break continue in inline
  lambdas"). 0.29.0 bu yüzden kırıldı, 0.29.1 düzeltmesi.
- `gh release download` tag ucunu okuyor; GitHub o ucu bir süre **boş varlık listesiyle**
  önbellekte tutuyor ("no assets to download") — aynı an release **id**'siyle sorunca üç
  varlık da görünüyordu. `ops/publish_ota.mjs` artık id üzerinden indiriyor (`c0799c1`).
- `gh api --output` diye bir bayrak yok; ikili indirme `execFileSync` + `writeFileSync`.
- Docker konteynerleri gün içinde bir kez yeniden başladı; `localhost:3011` 000 verdi ama
  **tünel (`fit.evaitec.com`) çalışıyordu** — yerel port ölüyse tünelden dene, sunucu ayakta.
- Önceki devirlerden: artifact'e gömülü görsel önce küçültülür · uzun Python'u bash
  heredoc'una gömme · `curl -d` Türkçe karakteri bozuyor (`--data-binary @dosya` kullan).

## Koçluk tarafı (bugün konuşulanlar)

- **BIA kompozisyonu karar verisi değil.** Dean kanıtladı: girilen kilo 107.8 → 107.9
  olunca saat "kas aldın/verdin"i ters çeviriyor. Samsung kompozisyon import'u bu yüzden
  **yapılmadı** (YAGNI); 4 hafta sonra trend istenirse 10 dakikalık iş.
  Karar üçlüsü: kilo 7-gün ortalaması + bel çevresi + salonda kalkan ağırlık.
- Dinlenme **90 sn**'de duruyor (7-gün tansiyon 134/86, eşik 130/80).
- Öğünler sunucuda: 22 Eyl 2140 kcal/140 g protein (3 öğün), 23 Eyl öğlene kadar
  1500 kcal/82 g (2 öğün). Hepsi `estimated`, göz kararı.
- Seans kartı: Dead bug + Pallof artık saatte hazır, "özel aç" notu kalktı (`d92d5d3`).
  Hâlâ özel açılacaklar: **Hip thrust** (B), **Calf press** (A′).

## Sıradaki tek adım

**Samsung arşivini alıp içe aktarmak** — bugünkü B seansı ve yüzme sunucuda yok
(`/api/workouts` 22–23 Eyl aralığında 0 kayıt). Dean zip'i attığında:

    npm run import:samsung -- <zip> --from 2026-09-12

Bu aynı zamanda handoff'tan beri bekleyen doğrulama: hareket/tekrar akışının saatten
doğru geldiği ilk kez bu arşivle test edilecek.

Bekleyen diğerleri: 0.29.1 cihaz kanıtı · Faz 2 UI (`feature/bugun-kartlari`,
`ui/DayStrip.tsx` + `ui/SessionCard.tsx`, spec §3.1/§3.3 — Dean "haftaya" dedi) ·
saatte A/B/A′ rutinlerinin kurulması · Dean'in seans sonuna eklediği mobility
hareketinin adı (sorulmuş, cevap gelmedi — kartta "Bitiriş" bloğu olarak eklenecek).
