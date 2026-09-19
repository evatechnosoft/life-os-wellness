# PLAN-WEAR — Saatin kendisinde çalışan uygulama

> Durum: **araştırma + plan**, kod yok. Tarih: 2026-09-14.
> Soru: telefon tarafı bitti (`docs/SENSORS-FEASIBILITY.md`); **saatte ne yapılabilir?**
> Cihaz: Samsung Galaxy Watch (Wear OS powered by Samsung).
> Reçete: `~/.ai/guides/wear-app-bootstrap-ota.md` · şablon repo: `D:\projects\evaglass\wear\`.
>
> Bu dosyadaki her "mümkün / değil" satırı resmî dokümana ya da AndroidX kaynağına
> dayanıyor; **cihazda doğrulanmamış** olanlar ayrıca işaretli.

---

## 1. Özet tablo

| İstek | Saatte mümkün mü | Hangi API | Kesinlik |
|---|---|---|---|
| **Canlı nabız (ekran açık, uygulama önde)** | ✅ Evet | `MeasureClient.registerMeasureCallback(DataType.HEART_RATE_BPM, …)` | Yüksek — `HEART_RATE_BPM` Wear OS 3+ **zorunlu** tiplerden |
| **Sürekli nabız (arka plan, gün boyu)** | ✅ Evet, **toplu (batched)** | `PassiveMonitoringClient` + `PassiveListenerService` | Yüksek — "saatler, günler süren kullanım için" |
| **Egzersiz sırasında sürekli nabız (ekran kapalı)** | ✅ Evet | `ExerciseClient` + `foregroundServiceType="health"` | Yüksek |
| **Tekrar sayısı (rep count)** | ⚠️ API var, **cihaz desteği opsiyonel** | `DataType.REP_COUNT` / `REP_COUNT_TOTAL` (yalnız `ExerciseClient` içinde) | API kesin; **Galaxy Watch'ta destekleniyor mu doğrulanmadı** |
| **Egzersiz tipi (bench/squat/deadlift ayrımı)** | ⚠️ **Kullanıcı seçer**, saat tanımaz | `ExerciseType.BENCH_PRESS/SQUAT/DEADLIFT/…` (83 tip) | Yüksek — bunlar *bildirilen* tip, otomatik sınıflandırıcı değil |
| **Kalori / adım / mesafe / tırmanış** | ✅ Evet | `DataType.CALORIES(_TOTAL)`, `STEPS(_DAILY)`, `DISTANCE`, `ELEVATION_GAIN` | Yüksek — hepsi zorunlu tip |
| **EKG** | ❌ Health Services'te **yok** | — (yalnız Samsung Privileged Health SDK, partner onayı) | Yüksek — `DataType.kt`'de EKG sabiti yok |
| **Kan basıncı** | ❌ Health Services'te **yok** | — | Yüksek — aynı kaynak |
| **SpO2 / kan oksijeni (canlı)** | ❌ Health Services'te **yok** | — (geçmiş veri Health Connect'ten zaten geliyor) | Yüksek — `DataType.kt`'de SpO2 sabiti yok |
| **Cilt sıcaklığı (canlı)** | ❌ Health Services'te yok | — (Samsung Privileged SDK'da var) | Yüksek |
| **Veriyi telefona yollamak** | ✅ Evet | `MessageClient` (<100 KB, teslim garantisiz), `DataClient` (kalıcı, çevrimdışı), `ChannelClient` (stream) | Yüksek |

**Bir cümlede:** saat, **nabzı canlı** ve **egzersizi oturum olarak** verir; tekrar sayısı
donanıma bağlı bir kumar; EKG/tansiyon/SpO2 Health Services'in veri sözlüğünde hiç yok.

### Kaynaklar (§1)

- [Health Services on Wear OS](https://developer.android.com/health-and-fitness/health-services) —
  "Wear OS 3 and higher includes a service called Health Services"; "Conserves battery by
  using sensor configurations from Health Services that are optimized for power efficiency."
- [Take spot health measurements with MeasureClient](https://developer.android.com/health-and-fitness/health-services/active-data/measure-client) —
  "MeasureClient is not suitable for workout tracking. Instead, record an exercise using ExerciseClient."
- [Monitor data in the background](https://developer.android.com/health-and-fitness/health-services/monitor-background) —
  "Passive data updates … are intended for use cases that span hours, days, or even longer";
  "When you receive data in the background, it is delivered in batches."
- [Record an exercise with ExerciseClient](https://developer.android.com/training/wearables/health-services/active)
- [Enhance app compatibility across Wear OS devices](https://developer.android.com/health-and-fitness/health-services/compatibility)
- [`DataType.kt` (AndroidX kaynağı)](https://android.googlesource.com/platform/frameworks/support/+/refs/heads/androidx-main/health/health-services-client/src/main/java/androidx/health/services/client/data/DataType.kt)
- [`ExerciseType.kt` (AndroidX kaynağı)](https://android.googlesource.com/platform/frameworks/support/+/refs/heads/androidx-main/health/health-services-client/src/main/java/androidx/health/services/client/data/ExerciseType.kt)
- [Send and receive messages (MessageClient)](https://developer.android.com/training/wearables/data/messages)
- [Samsung Health Sensor (Privileged Health) SDK FAQ](https://developer.samsung.com/health/privileged/faq.html)

---

## 2. Bulgular — sorulan yedi soru

### 2.1 `MeasureClient` mi, `ExerciseClient` mi, `PassiveMonitoringClient` mi

Üç istemci, üç ayrı ömür:

| İstemci | Ne için | Veri ritmi |
|---|---|---|
| `MeasureClient` | **Anlık ölçüm**, kullanıcı ekrana bakarken | Hızlı, saniyelik |
| `ExerciseClient` | **Egzersiz oturumu** — başlat/duraklat/bitir, hedef koy | Hızlı, oturum boyunca |
| `PassiveMonitoringClient` | **Gün boyu arka plan** | Seyrek ve **toplu** |

Resmî cümleler: MeasureClient "your app registers listeners to receive rapid data updates.
This is suited for short-lived experiences, such as while the user looks at your app UI" ve
"This API is not intended for background capture or workout tracking". ExerciseClient
"your app can manage a user's workout, set exercise goals … receive rapid data updates
through this API, as long as the exercise belongs to your app". PassiveMonitoringClient
"suited for long-lived experiences where data updates are relatively infrequent".

**`REP_COUNT` yalnız egzersiz oturumu içinde anlamlı** — `MeasureClient`'ın desteklediği
tipler `supportedDataTypesMeasure` ile sorulur ve pratikte nabızla sınırlıdır; tekrar
sayımı `ExerciseTypeCapabilities.supportedDataTypes` üzerinden gelir.

### 2.2 Canlı nabız gerçekten sürekli mi

Evet, ama **bedeli var ve doküman bunu açıkça yazıyor**: "It's important to minimize the
amount of time that your callback is registered, as callbacks cause an increase in sensor
sampling rates, which in turn increases power consumption."

- **Örnekleme sıklığı sabit değil.** "Different sensors generate data at different
  frequencies that vary per device based on the underlying hardware and sensor platform."
  Gerçek aralık **cihazda ölçülür** (bizde doğrulanmadı).
- **Kol dışındayken veri yok.** `onAvailabilityChanged` bunun için var: "heart rate data
  might not be available when the device is not properly attached to the wrist."
- **Ekran kapalıyken:** `MeasureClient` için doğru cevap "kullanma" — arka plan için
  tasarlanmamış. Ekran kapalı sürekli ölçüm isteniyorsa `ExerciseClient` +
  `foregroundServiceType="health"` (Wear OS 5+ bunu **zorunlu** kılıyor), gün boyu isteniyorsa
  `PassiveMonitoringClient`.

### 2.3 EKG ve kan basıncı

**Health Services'te ikisi de yok.** AndroidX kaynağındaki `DataType.kt` sabit listesinin
tamamı mesafe/hız/adım/kalori/kürek/golf/koşu-formu/nabız ailesi; EKG, kan basıncı, SpO2
ve cilt sıcaklığı **hiç tanımlı değil**. Yani saatte bir Wear OS uygulaması yazmak bu üç
ölçümü tek başına açmıyor.

**Samsung Privileged Health SDK** (eski adıyla Samsung Health Sensor SDK) hâlâ tek kapı ve
şartlar `SENSORS-FEASIBILITY.md` §1.3'te yazıldığı gibi duruyor — bugün tekrar doğrulandı:

- Yalnız "Galaxy Watch4 and later models running Wear OS powered by Samsung"; telefon yok.
- Sürekli tracker: ivmeölçer, nabız, PPG, cilt sıcaklığı. On-demand: **BIA ve EKG**,
  aynı anda yalnız bir on-demand tracker.
- Dağıtım için **Samsung Partner App Program** başvurusu şart; paket adı + SHA-256 imza
  kayıtlı değilse `SDK_POLICY_ERROR`. Developer mode "intended only for testing or
  debugging your app. It is not intended for app users."
- **Kan basıncı SSS'de hiç geçmiyor** — SDK'nın tracker listesinde yok. Yani "saatte
  uygulama yazarsak tansiyon alırız" **yanlış**; KB yalnız Samsung'un kendi Health Monitor
  uygulamasında ve manşonla kalibre edilerek var.

**Düzeltme/doğrulama:** fizibilite raporunun "partner onayı" tespiti **doğru**. Eklenen
bilgi: developer mode ile *test* mümkün (kişisel, tek cihaz), ama bu kalıcı bir çözüm değil
ve Samsung açıkça kullanıcıya dönük kullanımı yasaklıyor.

### 2.4 Galaxy Watch uyumu

- Health Services **Wear OS 3+ için zorunlu bileşen**: "The Wear Health Services API (WHS)
  is a mandatory component for all devices running Wear OS 3 and higher". Galaxy Watch 4
  Wear OS 3 ile çıktı → **Watch 4/5/6/7 hepsi kapsamda**.
- **Zorunlu (her cihazda var) tipler:** nabız (BPM), adım, mesafe, hız, tempo, tırmanış
  kazancı, toplam kalori.
- **Opsiyonel (cihaza bağlı) tipler:** mutlak yükseklik, yükseklik kaybı, dakikada adım,
  tekerlekli sandalye itişi, **rep count**, yüzme metrikleri. Doküman "If a `DataType` is
  not in the preceding 'required/guaranteed' list, then it is optional" diyor.
- Bu yüzden **kod kabiliyeti çalışma anında sormalı** (`getCapabilitiesAsync`), derleme
  anında varsaymamalı: "Take care not to request a `DataType` that isn't supported, or your
  request might fail."
- Samsung'a özel bilinen kısıt: **yok** (Health Services standart). Ham EKG/BIA için Samsung
  SDK'sı ayrı bir dünya (§2.3).

### 2.5 İzinler — Wear OS 6 kırılması

| Hedef | Nabız izni |
|---|---|
| API ≤ 35 (Wear OS 5.1 ve altı) | `android.permission.BODY_SENSORS` |
| API 36+ (Wear OS 6) | `android.permission.health.READ_HEART_RATE` |
| Arka plan | `BODY_SENSORS_BACKGROUND` → `READ_HEALTH_DATA_IN_BACKGROUND` |

Android 16'dan itibaren `BODY_SENSORS` isteyen her API yerine `android.permission.health.*`
granular izni istiyor. Wear OS 6'da eski izinler kullanıcıda geçerli kalıyor ve sistem 5.1
hedefleyen uygulamalar için `READ_HEART_RATE`'i otomatik istiyor; ama biz yeni yazdığımız
için **ikisini birden** bildirmek doğrusu (`BODY_SENSORS` + `maxSdkVersion="35"`, yanına
`health.READ_HEART_RATE`). Ayrıca `ACTIVITY_RECOGNITION` (adım/egzersiz), `FOREGROUND_SERVICE`
ve `FOREGROUND_SERVICE_HEALTH`.
Kaynak: [Wear OS 6 behavior changes](https://developer.android.com/training/wearables/versions/6/changes),
[Declare appropriate permissions](https://developer.android.com/health-and-fitness/health-services/permissions).

> Not: burada `foregroundServiceType` **`health`**, evaglass'taki `specialUse` değil —
> egzersiz kaydı için resmî tip bu ve Wear OS 5+ onu şart koşuyor. Rehber §1'deki
> `specialUse` reçetesi jest servisi içindi; kopyalarken değiştir.

### 2.6 Veri saatten telefona

| İstemci | Ne için | Sınır |
|---|---|---|
| `MessageClient` | RPC / tek yönlü olay ("ölçüm bitti, şu değerler") | **>100 KB taşımaz**, teslim **garantisiz** ("best effort … doesn't contain any built-in retry"), telefon bağlı değilse `TARGET_NODE_NOT_CONNECTED` |
| `DataClient` | Durum senkronu; **kalıcı**, çevrimdışı çalışır, bağlantı gelince ulaşır | Son durum senkronu, olay akışı değil |
| `ChannelClient` | Büyük dosya/stream (APK, ham kayıt) | Kalıcı değil, çevrimdışı çalışmaz |

Rehber §0/§7'deki tablo **doğrulandı**, tek ekleme: `MessageClient`'ın teslim garantisi
yok. Bizim veri kaybetmemesi gereken akışımız için bu belirleyici → **ölçüm özetini
`DataClient` ile yolla** (telefon kapalı/uzaktayken bile birikir, bağlanınca düşer),
`MessageClient`'ı yalnız "şimdi ölç" gibi anlık komutlar için kullan.

**Bizim akışa bağlanışı:**

```
[SAAT]  MeasureClient / ExerciseClient
          → WearSender  (DataClient.putDataItem "/wellness/session")
[TELEFON] WearBridgeService : WearableListenerService  (onDataChanged)
          → SharedPreferences kuyruğu (JSON satırları)
[TELEFON] WearBridgePlugin.drain()   ← Capacitor, JS uygulama öne gelince
          → src/lib/wear.ts → recordMetrics('watch_app', date, {...})
          → db.wearable  +  POST /api/wearable
```

`recordMetrics` (`apps/web/src/lib/store.ts:149`) zaten "Single path for every sensor source
(watch, phone mic, camera)" olarak yazılmış; `id = ${date}:${metric}` olduğu için tekrar
okuma satır yığmıyor. **Yeni tablo/şema gerekmiyor** — saat de sadece yeni bir `source`.

Neden JS'e doğrudan push değil de kuyruk + drain: WebView uygulama kapalıyken yok;
telefon servisi her koşulda çalışır, JS açılınca kuyruğu boşaltır. Mevcut senkron deseni
de bu (açılışta + 15 dk, `App.tsx:51`).

### 2.7 Pil gerçeği

Kanıtlı olan: Health Services "conserves battery by using sensor configurations … optimized
for power efficiency" ve `PassiveMonitoringClient` verisi **toplu** geliyor — yani radyo ve
uygulama işlemcisi her örnekte uyanmıyor. Ham `SensorManager` ile sürekli örnekleme tam
tersini yapar (rehber §2, evaglass deneyimi).

**Sayı vermiyorum:** Google resmî bir "%/saat" rakamı yayımlamıyor, bulduğum üçüncü taraf
ölçümler bizim cihazımızı temsil etmiyor. Bu yüzden plan §4'te pil ölçümü **kabul kriteri**
olarak duruyor: gece/seans öncesi-sonrası pil yüzdesi yazılacak, tıpkı `SleepService` için
HANDOFF'ta yapıldığı gibi.

Tasarım kuralı: **`MeasureClient` yalnız ekran açık ve kullanıcı bakarken kayıtlı kalsın**
(doküman birebir bunu söylüyor), sürekli ihtiyaç `ExerciseClient` ya da
`PassiveMonitoringClient` ile karşılansın.

---

## 3. Mimari

### 3.1 Modül

Yeni Gradle modülü: **`apps/web/android/wear/`**, `settings.gradle`'a tek satır `include ':wear'`.
(`npx cap sync android` yalnız `capacitor.settings.gradle`'ı yeniden üretir, elle eklenen
satır korunur — **doğrulanmadı, ilk adımda sync sonrası kontrol edilecek**.)

- `namespace = "com.evaitec.wellness.wear"`
- `applicationId = "com.evaitec.wellness"` — **telefonla aynı**. Data Layer eşleşmesi paket
  adı + imza üzerinden; evaglass `wear/build.gradle.kts` aynı şeyi yapıyor.
- `minSdk = 30` (Wear OS 3 / Galaxy Watch 4), `targetSdk` telefonla aynı.
- `versionCode`/`versionName` telefondaki `appVersion` ile aynı kaynaktan.

### 3.2 Sınıflar ve şablonları

| Yeni dosya | Görevi | Şablon |
|---|---|---|
| `wear/…/MainActivity.kt` | Tek ekran: bpm, "Ölç" / "Seans başlat" | evaglass `ShortcutsActivity.kt` + `DaisyLayout.kt` |
| `wear/…/WearMetrics.kt` | Yol ve alan adları sözleşmesi (`/wellness/session`, `hr_avg` …) | evaglass **`WearMessages.kt`** (birebir desen) |
| `wear/…/HeartRateMeasure.kt` | `MeasureClient` sarmalayıcı; capability → register → unregister | yeni (evaglass `GestureSensorService.kt` yaşam döngüsü deseni) |
| `wear/…/ExerciseService.kt` | `ExerciseClient` oturumu, `foregroundServiceType="health"` | evaglass **`GestureSensorService.kt`** (foreground servis + bildirim iskeleti) |
| `wear/…/WearSender.kt` | `DataClient.putDataItem`, node yoksa hata döndür | evaglass **`GestureSender.kt`** (birebir desen, MessageClient→DataClient değişir) |
| `app/…/WearBridgeService.kt` (telefon) | `WearableListenerService.onDataChanged` → kuyruk | evaglass **`WearConfigListenerService.kt`** |
| `app/…/WearBridgePlugin.kt` (telefon) | Capacitor: `drain()`, `available()` | repodaki **`SleepPlugin.kt`** (77 satır, en küçük plugin örneği) |
| `src/lib/wear.ts` | `drain()` → `recordMetrics('watch_app', …)` | repodaki **`src/lib/sleep.ts`** |

Yeni bağımlılıklar (yalnız `wear` modülü + telefonda Data Layer):
`androidx.health:health-services-client`, `com.google.android.gms:play-services-wearable`,
`kotlinx-coroutines-play-services`, `androidx.wear:wear` (+ `activity`, `core-ktx`).
Telefon APK'sına eklenen tek şey `play-services-wearable` (~birkaç yüz KB).

---

## 4. Adım adım plan

Her adımın kabul kriteri **cihazda görülebilir** bir şey. "`assembleDebug` yeşil" hiçbir
adımın kabulü değil (rehber §6).

**Adım 0 — İlk kurulum yolunu seç (yarım saat).**
İlk APK saate **kablosuz ADB** ile atılır (`adb pair`, eşleştirme kodu saatte gösterilir).
`ChannelClient` bootstrap'i (rehber §0/§4) **şimdilik yapılmıyor** — tek kullanıcı, tek saat;
eşleştirme bir kez yapılır. Kabul: `adb devices` saati listeliyor.

**Adım 1 — Boş saat uygulaması, saatte açılıyor (yarım gün).**
`wear` modülü + manifest (`hardware.type.watch`, `uses-library`, `standalone` meta-data) +
tek ekranda uygulama adı. Kabul: **saatte uygulama listesinde görünüyor ve açılıyor**;
`./gradlew :wear:assembleDebug` ve `:wear:lintDebug` yeşil. Telefon APK'sı bozulmadı
(`assembleDebug` + 49 Kotlin testi hâlâ geçiyor).

**Adım 2 — Canlı nabız ekranda (yarım gün).**
`health-services-client`, `MeasureClient`, izinler (§2.5), `onAvailabilityChanged` ekranda
görünür. Ekrana **ham bpm + kabul edilebilirlik durumu** yazılır (rehber §2: eşikleri
tahminle sabitleme, ölçümü göster). Kabul: **saatte bpm sayısı akıyor**, bileği kaldırınca
`AVAILABLE`, çıkarınca `UNAVAILABLE` görünüyor. Aynı ekranda **örnek aralığı (ms)** de yazsın
— §2.2'deki bilinmeyen böyle kapanır.

**Adım 3 — Saat → telefon tek kayıt (yarım gün).**
`WearSender` + telefonda `WearBridgeService` + kuyruk. Kabul: saatte "Gönder"e basınca
**telefon logcat'inde kayıt görünüyor**; telefon Bluetooth kapalıyken basılan kayıt,
telefon açılınca düşüyor (DataClient'in kalıcılığı — bu aynı zamanda imza eşleşmesinin
kanıtı).

**Adım 4 — Telefonda veriye dönüşüyor (yarım gün).**
`WearBridgePlugin.drain()` + `src/lib/wear.ts` → `recordMetrics('watch_app', …)`. Kabul:
Bugün ekranında saatten gelen değer görünüyor; `db.wearable`'da `source='watch_app'` satırı
var; `/api/wearable`'a düştü.

— *Buraya kadarı "saatte uygulamamız var ve veri akıyor"un en küçük hâli. Devamı ayrı karar.* —

**Adım 5 — Egzersiz oturumu (1-2 gün).**
`ExerciseService` (`foregroundServiceType="health"`), `getCapabilitiesAsync` ile
`supportedExerciseTypes` ve `supportedDataTypes` **ekranda listelenir**. Kabul: Galaxy
Watch'ın gerçekte hangi `ExerciseType`'ları ve **`REP_COUNT`'u destekleyip desteklemediği**
ekrandan okunur — §5'teki en büyük bilinmeyen bu adımda kapanır. Seans başlat/bitir, sonuç
telefona düşer, mevcut `workout` akışına taslak olarak girer.

**Adım 6 — Pil ölçümü (bir gece + bir seans).**
Adım 5'in seansı öncesi/sonrası pil yüzdesi; ayrıca `PassiveMonitoringClient` ile 24 saat.
Kabul: iki sayı HANDOFF'a yazılır. Kötüyse örnekleme/kapsam kısılır.

**Adım 7 — Dağıtım/OTA (1 gün).**
`.github/workflows/apk.yml`'ye `:wear:assembleDebug` + ikinci artefakt.
**Kritik:** iki APK **aynı workflow koşusunda** üretilmeli — CI'da debug keystore her koşuda
yeniden üretilebilir ve imzalar tutmazsa Data Layer sessizce çalışmaz. İleride imzalı
release istenirse telefonla **aynı keystore** (evaglass `wear/build.gradle.kts` deseni).
Kendi kendine güncelleme (`UpdateChecker` + FileProvider + `REQUEST_INSTALL_PACKAGES`,
rehber §1/§4) **bu plana dahil değil** — tek saat, elle kurulum yeter; sürüm sayısı
artınca eklenir.

---

## 5. Riskler ve bilinmeyenler

Cihazda doğrulanana kadar **açık**:

1. **`REP_COUNT` Galaxy Watch'ta var mı — bilinmiyor.** Doküman rep count'u açıkça
   *opsiyonel* listeye koyuyor. Adım 5 ekranı cevabı verecek. Yoksa: tekrar sayısı elle
   girilmeye devam eder (AGENTS kilidi "manuel giriş kalıcı katmandır" zaten bunu karşılıyor).
2. **Egzersiz tipi otomatik tanınmıyor.** `ExerciseType.BENCH_PRESS` bir *sınıflandırma
   çıktısı* değil, bizim bildirdiğimiz tip. Saat "bench yapıyorsun" demez; kullanıcı seçer.
   Otomatik ayrım isteniyorsa o ayrı bir ML işi ve **saate ML konmaz** (rehber §3).
3. **Örnekleme sıklığı ve gecikme cihaza bağlı**, doküman sayı vermiyor (§2.2). Adım 2 ölçer.
4. **Pil maliyeti ölçülmedi** (§2.7). Adım 6 ölçer.
5. **İmza eşleşmesi.** Debug imzalı iki APK farklı koşulardan gelirse Data Layer *hata
   vermeden* çalışmaz; belirti "mesaj gidiyor ama gelmiyor". Adım 3 bunu erken yakalar.
6. **`npx cap sync android` elle eklenen `include ':wear'` satırını koruyor mu** —
   doğrulanmadı, Adım 1'de sync sonrası `settings.gradle` kontrol edilecek.
7. **Wear OS 6 izin geçişi.** Saat Wear OS 6'ya güncellenirse `BODY_SENSORS` tek başına
   yetmez (§2.5). İki izni birden bildirerek riski şimdiden kapatıyoruz.
8. **Samsung Privileged SDK developer mode**'un tek kullanıcılık kişisel kullanımda
   pratikte ne kadar sürdüğü **denenmedi** — Samsung "kullanıcılar için değil" diyor,
   plana dahil edilmedi.

---

## 6. Maliyet

| Adım | Kaba büyüklük | Yeni bağımlılık | APK etkisi |
|---|---|---|---|
| 0 kablosuz ADB | 0.5 sa | — | — |
| 1 boş modül | 0.5 gün | wear, activity, core-ktx | yeni ~1-2 MB saat APK'sı |
| 2 canlı nabız | 0.5 gün | `health-services-client` | +~0.5 MB |
| 3 saat→telefon | 0.5 gün | `play-services-wearable`, `coroutines-play-services` (iki tarafta) | saat +~1 MB, **telefon +~0.3 MB** |
| 4 telefonda veri | 0.5 gün | — | — |
| 5 egzersiz oturumu | 1-2 gün | — | — |
| 6 pil ölçümü | takvim işi | — | — |
| 7 CI | 1 gün | — | ikinci artefakt |

Saat APK'sı için `isMinifyEnabled = true` **baştan açık** olsun (rehber §3: evaglass'ta
kapalı kalınca 14 MB oldu). Saate ONNX/ML konmaz.

---

## 7. Yapılmayacaklar

- **EKG.** Health Services'in veri sözlüğünde yok; tek yol Samsung Privileged Health SDK ve
  o da partner onayı istiyor (§2.3). Saatte uygulama yazmak bunu değiştirmiyor.
- **Kan basıncı.** Ne Health Services'te ne Samsung SDK tracker listesinde var; Samsung'un
  kendi Health Monitor'ü manşonla kalibrasyon istiyor (`SENSORS-FEASIBILITY.md` §2.3).
- **Canlı SpO2 / cilt sıcaklığı.** `DataType.kt`'de yok. SpO2 geçmiş verisi Health
  Connect'ten zaten geliyor (`HealthExtraPlugin`), saat uygulaması bunu iyileştirmez.
- **Stres.** Ne Health Connect'te ne Health Services'te kayıt tipi var; ham ölçü HRV,
  o da zaten alınıyor.
- **Egzersiz otomatik sınıflandırma (bench/squat ayrımı).** Saat bunu vermiyor; kendi
  modelimizi saatte koşturmak APK ve pil maliyetiyle geri tepiyor.
- **`ChannelClient` ile APK bootstrap ve kendi kendine OTA.** Tek saat için fazla; elle
  kurulum yeterli. Sürüm trafiği artarsa rehber §4 hazır duruyor.
- **Watch face.** Bu ürünün işi değil; ayrıca Wear OS 6 + Watch Face Push + validator
  token istiyor (rehber §7).

---

## 8. Kardiyo yükü — kendi hesabımız (19 Eylül 2026, Dean)

Samsung'un "Daily Cardio Load" ve "Fitness Index" özellikleri Watch7+ ile One UI 9 Watch
istiyor; Watch6 Classic'te açılmıyor ve bu bir bölge kilidi değil, model listesi kilidi.
Metriğin kendisi lisanslı bir şey değil: nabız zaman serisinden bölge süresi çıkarılıp
TRIMP benzeri bir yük hesaplanır. Yani **hesabı biz yapabiliriz** — sorun formül değil,
girdi.

### 8.1 Girdi gerçeği (Health Connect dışa aktarımı, 19 Eyl 2026 · kanıtlandı)

`heart_rate_record_series_table` içinde 4.237 örnek var ama **14 güne** yayılmış
(14 Tem – 18 Eyl). Örnekleme düzensiz:

| Gün | Örnek | Medyan aralık | Kapsam | Maks |
|---|---|---|---|---|
| 8 Eyl | 1391 | 1 sn | 14,8 saat | 116 |
| 12 Eyl | 562 | 1 sn | 10,5 saat | 117 |
| 15 Eyl (yüzme) | 48 | 600 sn | 13,3 saat | 114 |
| 17 Eyl (yüzme) | **3** | 1200 sn | 0,5 saat | 99 |
| 18 Eyl | 302 | 1 sn | 0,1 saat | 118 |

İki ayrı kip görünüyor: egzersiz kaydı açıkken saniyede bir örnek, normal günde on
dakikada bir. **Yüzme seanslarının ikisinde de nabız yok** — 17 Eylül'ün üç örneği
15:11–15:40 arasında, seans ise 21:00 sonrası. Bölge 3 ve üstü hiçbir günde görünmüyor;
43 yaş için eşik ~154 bpm, kayıtlı en yüksek değer 138.

Sonuç: Health Connect'ten gelen nabızla kardiyo yükü hesaplamak bugün **mümkün değil**.
Veri yoksa formül boş çıkar.

### 8.2 Üç katmanlı çözüm

1. **Saatten doğrudan topla** (asıl çözüm). `com.evatechnosoft.sport_app_mobile` zaten
   saatte koşuyor ve Health Services'ten `HEART_RATE_BPM` okuyabiliyor (§2). Seans
   sırasında 1 Hz örnekleyip kuyruğa yazsın, telefon `drainWatch` ile alsın. Böylece
   Samsung Health'in yazıp yazmamasına bağlı kalmayız.
2. **Nabız yoksa süre + tip ile tahmin.** Egzersiz kaydında süre ve tür var; MET
   katsayısıyla (yüzme ~7, tempolu yürüyüş ~4,3, direnç ~5) yük tahmini üretilir ve
   `estimated: true` işaretlenir. Bugünkü 90 dk ve 60 dk yüzme böyle sayılabilir.
3. **Elle eşik girişi.** Dean seansta algıladığı zorluğu (RPE 1–10) girerse, nabız
   olmadan da Banister TRIMP'in RPE karşılığı (session-RPE = süre × RPE) hesaplanır.

### 8.2b Yüzmede nabız neden hiç gelmeyecek (19 Eyl araştırması)

- **Fizik:** su PPG sinyalini bozar; su altında optik nabız güvenilmez. Galaxy Watch'un
  yüzerken PPG'yi bilinçli kapattığı iddiası dolaşıyor ama Samsung belgesinde karşılığı
  yok — **doğrulanmadı**. Sonuç değişmiyor: havuzda nabız ya gelmiyor ya absürt yüksek.
- **Zincir:** Health Connect Wear OS'ta çalışmıyor. Saat verisi önce telefondaki Samsung
  Health'e iner, oradan Health Connect'e geçer ([Samsung Developer, Health Connect FAQ](https://developer.samsung.com/health/health-connect-faq.html)).
  İki kopma noktası var ve sahada ikincisi kopuyor: bir güncellemeden sonra uyku akmaya
  devam ederken egzersiz hiç yazılmıyor ([Samsung Community](https://us.community.samsung.com/t5/Samsung-Apps-and-Services/Samsung-Health-won-t-sync-exercise-since-update/td-p/3607275)).
- **Bize etkisi:** §8.2'deki 2. katman (süre + MET) yüzme için **yedek değil, asıl yol**.
  1. katman (saatten doğrudan Health Services) karadaki seanslar için geçerli; o yol
  Samsung Health zincirini tamamen atladığı için yukarıdaki kopmadan etkilenmez.
- Su altı nabzı gerçekten istenirse tek yol Bluetooth göğüs bandı. Bu ürünün kapsamında
  değil, kullanıcı isterse ayrı karar.

### 8.3 Hesaplama katmanı

Yeni dosya `apps/web/src/lib/cardioLoad.ts`, saf fonksiyonlar, TDD (AGENTS.md kuralı):

- `zoneOf(bpm, restingHr, maxHr)` → 1–5
- `trimpFromSeries(samples, profile)` → gün yükü (Banister, cinsiyet katsayılı)
- `trimpFromSession(minutes, met, profile)` → nabızsız tahmin
- `acuteChronicRatio(daily, 7, 28)` → yüklenme/dinlenme dengesi; Samsung'un
  "önerilen hedef" karşılığı buradan çıkar
- Girdi kaynağı ne olursa olsun çıktı tek tip: `{ load, source: 'hr' | 'met' | 'rpe' }`

Gösterim: Hafta ekranında mevcut sparkline'ın yanına ikinci bir seri; Bugün ekranına
kart eklenmez (60 sn kuralı).

### 8.4 Yapılmayacak

- Samsung'un skorunu birebir taklit etmek. Onların katsayıları açık değil; kendi
  yükümüzü kendi eşiğimize göre raporlarız, "Samsung'unkiyle aynı sayı" iddia etmeyiz.
- Fitness Index benzeri akran kıyaslaması. Referans veri kümemiz yok, uydurma olur.
