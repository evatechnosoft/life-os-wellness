# SENSORS-FEASIBILITY — "Telefon her şeyi ölçebilir mi?"

> Durum: **araştırma**, kod yok. Tarih: 2026-09-14.
> Soru: *"Cihaz sensörleri açıktır bence bir dinleyen uygulama ile EKG'ye kadar basınç,
> nabız hepsi ölçülebilir; ne hareket yaptı, hangi harekette bilinebilir."*
>
> Mimarimiz: Capacitor + kendi Kotlin plugin'lerimiz (`HealthExtraPlugin`, `SleepPlugin`),
> tek kullanıcı, sideload APK, Play Store'a çıkılmıyor. Bu kısıtlar cevapları değiştiriyor —
> bazılarını kolaylaştırıyor (Play politikası yok), bazılarını imkânsız kılıyor
> (Samsung partner onayı yok, Wear OS uygulamamız yok).

---

## Özet tablo

| Ölçüm | Durum | Tek cümlelik gerekçe |
|---|---|---|
| **EKG (telefonda)** | ❌ Mümkün değil | Hiçbir tüketici Android telefonunda EKG elektrodu yok; EKG vücut üzerinde iki nokta arasından gerilim ister, kamera/mikrofon bunu üretemez. |
| **EKG (Galaxy Watch'tan okuma)** | ❌ Mümkün değil | Health Connect'in 42 kayıt tipinin hiçbiri EKG değil; ham EKG yalnız Samsung Privileged Health SDK ile ve yalnız **Wear OS uygulamasından**, partner onayıyla alınıyor. |
| **EKG (iOS/Apple Watch)** | ⚠️ Bizde geçersiz | HealthKit `HKElectrocardiogram` ile üçüncü taraf **okuyabiliyor** (iOS 14+) — ama bizim hedefimiz Android. |
| **Kan basıncı (telefon sensörüyle)** | ❌ Mümkün değil | Manşonsuz KB hiçbir standarda göre doğrulanmadı (ISO 81060-3:2022 / ESH 2023); kamera-PPG'den KB üretmek doğrulanmamış araştırma. |
| **Kan basıncı (Galaxy Watch'tan)** | ⚠️ Sınırlı | Samsung Health Monitor KB ölçer ama 28 günde bir manşonlu cihazla kalibrasyon ister, ülke kısıtlı ve Health Connect'e yazdığı **doğrulanmadı**. |
| **Kan basıncı (elle giriş)** | ✅ Mümkün | Health Connect `BloodPressureRecord` var; ayrıca elle giriş bizim zaten kalıcı katmanımız (AGENTS kilidi). |
| **Nabız (kamera + flaş, parmak ucu)** | ✅ Mümkün | Hakemli doğrulama var: r=.997, RMSE 1.03 bpm (dinlenme). Ama **anlık tek ölçüm**, sürekli değil; native kod ister. |
| **Nabız (saatten, geçmiş)** | ✅ Zaten var | `HealthExtraPlugin` Health Connect'ten `HeartRateRecord` okuyor. |
| **Nabız (canlı/sürekli)** | ❌ Mümkün değil | HANDOFF'taki karar geçerli: Health Connect geçmiş verir, canlılık Wear OS uygulaması ya da BLE band ister. |
| **Adım** | ✅ Zaten var | `capacitor-health` → `StepsRecord`. |
| **Egzersiz tipi (yürüme/koşu/bisiklet/araç/hareketsiz)** | ✅ Mümkün | Activity Recognition Transition API (Play Services) tam bu beş sınıfı veriyor, telefon cepteyken çalışır. |
| **Egzersiz tipi (bench, squat, deadlift gibi direnç)** | ❌ Mümkün değil (telefonla) | Telefon cepteyken üst gövde hareketini görmez; ivmeölçer sinyali yok denecek kadar küçük. |
| **Tekrar sayısı (rep counting)** | ❌ Mümkün değil (telefonla) | Sensörün hareket eden uzva bağlı olması gerekiyor; cepteki telefon bench press'te hareket etmiyor. |
| **Nefes hızı (mikrofonla, gece, uzaktan)** | ❌ Mümkün değil | Yayınlardaki doğruluk **yakın mesafe + sessiz ortam + kasıtlı nefes** koşullarında; bizim 30 sn'de 4 sn duty cycle'ımız zaten periyodik bir sinyali örnekleyemiyor. |
| **Nefes hızı (mikrofonla, uyanık, telefon boğazda/burna 30 cm)** | ⚠️ Sınırlı | MAE <1–2 nefes/dk bildiriliyor ama bu ayrı bir ürün akışı (elle başlatılan 60 sn ölçüm), gece takibi değil. |
| **Horlama** | ✅ Zaten var | `SnoreAnalyzer`, eşik tabanlı (HANDOFF'ta sınırı yazılı). |
| **Stres** | ❌ Mümkün değil | Health Connect'te stres kaydı yok; en yakın ham ölçü HRV — zaten alıyoruz. |

---

## 1. EKG

### 1.1 Telefonda EKG sensörü var mı? — Hayır

EKG, vücut üzerinde en az iki nokta arasındaki elektriksel potansiyel farkını ölçer;
bu fiziksel olarak **elektrot** ister. Tüketici Android telefonlarında böyle bir donanım
yok. Piyasadaki telefon-EKG çözümlerinin tamamı harici donanım: AliveCor KardiaMobile gibi
cihazlar telefona bağlanır, parmakların metal elektrotlara değmesini ister
([Dove Medical Press, *Smartphone electrocardiogram monitoring: current perspectives*](https://www.dovepress.com/smartphone-electrocardiogram-monitoring-current-perspectives-peer-reviewed-fulltext-article-AHCT)).

Kamera + flaşla ölçülen şey EKG değil **PPG**'dir (optik nabız dalgası) — nabız verir,
kalbin elektriksel iletimini vermez. Aritmi taraması için kullanılabilir ama EKG değildir
ve EKG yerine geçtiği iddiası hem yanlış hem regülatif olarak riskli (§7).

**Kesinlik: yüksek.** (Fizik + pazar taraması; "hiçbir telefonda yok" negatif bir iddia
olduğu için tek bir birincil kaynağa dayanmıyor, ama aksini gösteren tek bir cihaz da bulamadım.)

### 1.2 Health Connect'te EKG kayıt tipi var mı? — Hayır

HANDOFF "43 tip" diyor; **gradle önbelleğindeki gerçek AAR'dan sayım 42**
(`connect-client-1.2.0-alpha01`; `Record`, `InstantaneousRecord`, `IntervalRecord`,
`SeriesRecord` taban arayüzleri hariç). Tam liste:

```
ActiveCaloriesBurned · ActivityIntensity · BasalBodyTemperature · BasalMetabolicRate
BloodGlucose · BloodPressure · BodyFat · BodyTemperature · BodyWaterMass · BoneMass
CervicalMucus · CyclingPedalingCadence · Distance · ElevationGained · ExerciseSession
FloorsClimbed · HeartRate · HeartRateVariabilityRmssd · Height · Hydration
IntermenstrualBleeding · LeanBodyMass · MenstruationFlow · MenstruationPeriod
MindfulnessSession · Nutrition · OvulationTest · OxygenSaturation
PlannedExerciseSession · Power · RespiratoryRate · RestingHeartRate · SexualActivity
SkinTemperature · SleepSession · Speed · StepsCadence · Steps · TotalCaloriesBurned
Vo2Max · Weight · WheelchairPushes
```

Doğrulama komutu (tekrarlanabilir):

```bash
unzip -o -q ~/.gradle/caches/modules-2/files-2.1/androidx.health.connect/connect-client/1.2.0-alpha01/*/connect-client-1.2.0-alpha01.aar -d /tmp/cc
unzip -o -q /tmp/cc/classes.jar -d /tmp/cc/cls
ls /tmp/cc/cls/androidx/health/connect/client/records/ | grep -E 'Record\.class$' | grep -v '\$'
```

EKG **yok**, stres **yok** (HANDOFF'un stres tespiti doğru). Resmî doküman da aynı listeyi
veriyor, EKG geçmiyor
([Health Connect data types, Android Developers](https://developer.android.com/health-and-fitness/guides/health-connect/plan/data-types)).

Yani: Galaxy Watch EKG çekse bile o veri Health Connect'e **hiç girmiyor** — şema yok.

**Kesinlik: yüksek** (yerel AAR + resmî doküman, iki bağımsız kanıt).

### 1.3 Samsung Privileged Health SDK — bize kapalı

Samsung ham EKG'yi **Samsung Privileged Health SDK** ile açıyor. Samsung'un kendi SSS
sayfasına göre ([Samsung Developer — Privileged Health SDK FAQ](https://developer.samsung.com/health/privileged/faq.html)):

- Yalnız **Galaxy Watch4 ve sonrası, Wear OS powered by Samsung** üzerinde çalışıyor —
  **telefonda değil.**
- Sürekli tracker'lar: ivmeölçer, nabız, PPG, cilt sıcaklığı. **On-demand**: EKG, BIA
  (aynı anda tek on-demand tracker).
- Dağıtım için **Samsung Partner Program onayı** şart; uygulamanın paket adı ve SHA-256
  imzası Samsung'a kaydediliyor, kayıtsız imza `SDK_POLICY_ERROR` veriyor. Developer mode
  "yalnız test/hata ayıklama için, kullanıcılar için değil".

Bizim için maliyet: **yeni bir Wear OS uygulaması** (ayrı modül, ayrı yaşam döngüsü, ayrı
derleme, saate ayrı kurulum) **+ Samsung partner başvurusu**. Tek kullanıcılı bir kişisel
proje için bu ikisi de gerçekçi değil. Sideload olmamız burada yardımcı olmuyor —
kısıt Play Store değil, Samsung'un imza kaydı.

**Kesinlik: yüksek.**

### 1.4 Apple tarafı — fark

iOS 14'ten beri üçüncü taraf uygulamalar `HKElectrocardiogram` örneklerini
`HKElectrocardiogramQuery` ile okuyabiliyor; örnek ortalama nabız, örnekleme frekansı ve
tek tek gerilim ölçümlerini taşıyor
([Apple Developer — HKElectrocardiogram](https://developer.apple.com/documentation/healthkit/hkelectrocardiogram),
[WWDC20 — What's new in HealthKit](https://developer.apple.com/videos/play/wwdc2020/10182/)).

Yani **Apple platformunda EKG üçüncü tarafa açık, Android'de değil.** Bu bizim için
uygulanabilir bir yol değil (hedef Android), sadece farkın nerede olduğunu gösteriyor:
engel "EKG özel veri" değil, Google'ın Health Connect şemasında EKG'yi hiç tanımlamamış olması.

**Kesinlik: yüksek.**

---

## 2. Kan basıncı

### 2.1 Manşonsuz KB'nin bilimsel durumu — doğrulanmadı

Avrupa Hipertansiyon Derneği (ESH) 2023'te manşonsuz KB cihazları için ayrı bir doğrulama
protokolü yayımladı; protokol altı ayrı test öngörüyor (mutlak doğruluk, hidrostatik basınca
dayanıklılık, tedavi sırasında doğruluk, uyanık/uykuda, egzersizde, manşon kalibrasyonu)
([Stergiou et al., *European Society of Hypertension recommendations for the validation of
cuffless blood pressure measuring devices*, J Hypertens, 2023](https://pubmed.ncbi.nlm.nih.gov/37303198/)).

Kritik nokta: **bugüne kadar hiçbir manşonsuz cihaz ne ISO 81060-3:2022'ye ne de ESH 2023
önerilerine göre doğrulanmadı**, ve manşonsuz cihazlar kılavuzlarda tanı ya da tedavi
değerlendirmesi için **önerilmiyor**
([*Cuffless Blood Pressure in clinical practice: challenges, opportunities and current limits*,
Blood Pressure, 2024](https://www.tandfonline.com/doi/full/10.1080/08037051.2024.2304190);
[*Recommendations for evaluating photoplethysmography-based algorithms for blood pressure
assessment*, Communications Medicine, 2024](https://www.nature.com/articles/s43856-024-00555-2)).

Telefonun kamerası/mikrofonuyla KB ölçmek bunun da bir alt kümesi: PPG'den KB tahmini
aktif bir araştırma alanı, ürün değil. **Bunu yapan kod yazmamalıyız** — üretilen sayı
ölçüm değil tahmin olur, kullanıcı onu ölçüm sanır.

**Kesinlik: yüksek.**

### 2.2 Health Connect `BloodPressureRecord`'a kim yazabilir

Tip var: `READ_BLOOD_PRESSURE` / `WRITE_BLOOD_PRESSURE`. Play Store'a çıkan uygulamalar
için veri kullanımı beyanı ve hassas tipler için ek onay gerekiyor
([Health Connect data types](https://developer.android.com/health-and-fitness/guides/health-connect/plan/data-types)).
**Biz sideload olduğumuz için bu kapı bizi bağlamıyor** — ama yazacak veri de yok:
kaynağımız elle giriş olur, ki onu zaten kendi Dexie'mize yazıyoruz. Health Connect'e
yazmanın bize somut faydası yok.

Arka planda okuma ayrı bir izin ister: `READ_HEALTH_DATA_IN_BACKGROUND` (aynı kaynak).
Bu, HANDOFF'taki "arka plan senkronu yok" sınırının resmî çözümü — §6'ya bakın.

**Kesinlik: orta-yüksek** (izin adları doğrulandı; "hassas tip ek onayı"nın tam kapsamı
Play Console politikası, sideload'da uygulanmadığını **test etmedim**).

### 2.3 Samsung Watch KB

Samsung Health Monitor, Galaxy Watch'ta KB ölçüyor ama:
- **28 günde bir üst kol manşonlu cihazla kalibrasyon** zorunlu (3 gün içinde 3 ölçüm)
- Kullanılabilirlik **ülkeye göre değişiyor**

([Samsung — Monitor your heart rate and blood pressure with the Galaxy Watch series](https://www.samsung.com/latin_en/support/mobile-devices/measure-your-ecg-with-the-galaxy-watch-series/),
[Samsung Newsroom — Blood Pressure Monitoring Feature Now Available to U.S. Users](https://news.samsung.com/us/samsung-blood-pressure-monitoring-feature-available/))

Samsung Health Monitor'ün ölçümü Health Connect'e yazıp yazmadığını **doğrulayamadım**
— muhtemelen yazmıyor (Samsung Health uykuyu bile yazmıyor, HANDOFF §Uyku). Zaten manşon
gerekiyorsa manşondan okunan değeri elle girmek daha az adım.

**Kesinlik: kalibrasyon ve ülke kısıtı yüksek; Health Connect'e yazma durumu doğrulanmadı.**

---

## 3. Nabız — kamera PPG

### 3.1 Doğruluk

En sağlam kaynak 40 sağlıklı genç yetişkinle yapılmış doğrulama çalışması
([Yan BP, Chan CKY, Li CKH, To OTL, Lai WHS, Tse G, Poh YC, Poh MZ. *Resting and Postexercise
Heart Rate Detection From Fingertip and Facial Photoplethysmography Using a Smartphone Camera:
A Validation Study.* JMIR Mhealth Uhealth 2017; DOI 10.2196/mhealth.7275](https://mhealth.jmir.org/2017/3/e33/)):

| Koşul | Parmak ucu PPG | Yüz (temassız) PPG |
|---|---|---|
| Dinlenme | r=.997, RMSE 1.03 bpm (%1.40) | r=.997, RMSE 1.02 bpm (%1.44) |
| Orta şiddet egzersiz sonrası | r=.994, RMSE 2.15 bpm (%2.53) | r=.982, RMSE 3.68 bpm (%4.11) |
| Yüksek şiddet egzersiz sonrası | r=.995, RMSE 2.01 bpm (%1.93) | r=.980, RMSE 3.84 bpm (%3.73) |

Yani **parmak ucu + arka kamera + flaş, dinlenme nabzı için EKG'ye çok yakın.** Hareket
artefaktı yüz yönteminde belirgin, parmak ucunda değil. Atriyal fibrilasyonlu hastalarda
gerçek dünya doğrulaması da var
([*Real-world validation of smartphone-based photoplethysmography for rate and rhythm
monitoring in atrial fibrillation*, EP Europace 2024](https://academic.oup.com/europace/article/26/4/euae065/7648812)).

⚠️ Bu çalışma **iPhone 6S + Cardiio** ile yapıldı. Kendi yazacağımız algoritmanın bu
doğruluğu tutacağının garantisi yok — RMSE, yöntemin tavanıdır, bizim kodumuzun değil.

### 3.2 Web (`getUserMedia`) mi, native mi?

Web tarafında yapılamaz, iki sebeple:
1. **Flaş (torch) kontrolü.** `MediaStreamTrack.applyConstraints({advanced:[{torch:true}]})`
   Chromium'da var ama standart dışı ve cihaza göre değişiyor; parmak ucu PPG'de flaş
   opsiyonel değil, ışık kaynağı o.
2. **Ham kare erişimi.** Canvas'a çizip piksel ortalaması almak 30 fps'de JS'te yapılabilir
   ama pil ve kare düşmesi ciddi; native `ImageAnalysis` (CameraX) çok daha ucuz.

Bizim mimaride doğru yol: **kendi Kotlin plugin'imiz** — `SleepPlugin.kt`/`SleepService.kt`
deseni. Zaten `CAMERA` izni manifest'te var.

**Kesinlik: doğruluk verisi yüksek; "web'de yapılamaz" iddiası orta** — torch API'sinin
bu cihazda çalışıp çalışmadığını **test etmedim**, prensipte denenebilir.

### 3.3 Bize maliyeti

Orta. `HeartRatePlugin.kt` + CameraX `ImageAnalysis` + kırmızı kanal ortalamasının zaman
serisi + bant geçiren filtre (0.7–3.5 Hz ≈ 42–210 bpm) + tepe sayımı ya da FFT. 30 saniyelik
ölçüm. Yeni bağımlılık: `androidx.camera:camera-camera2` + `camera-lifecycle`
(`@capacitor/camera` bunu vermiyor, o foto çekiyor).

**Ama ana soru şu: buna ihtiyacımız var mı?** Saat zaten dinlenme nabzını veriyor ve
`hr_lag_min` metriğimiz var. Kamera PPG'nin kattığı tek şey **anlık, saat takılı değilken**
ölçüm. Öncelik listesinde düşük (§8).

---

## 4. Hareket / egzersiz tanıma

### 4.1 Hazırda ne var

**a) Activity Recognition Transition API** (Google Play services). Kullanıcının aktivitesi
değiştiğinde bildirim veriyor; sınıflar `IN_VEHICLE`, `ON_BICYCLE`, `ON_FOOT`, `RUNNING`,
`STILL`, `WALKING`. Google'ın kendi eğitim verisi ve filtrelemesini kullanıyor; Google
önceki çözüme göre **daha yüksek doğruluk ve daha düşük pil tüketimi** ölçtüğünü bildiriyor
([Android Developers Blog — *Activity Recognition's new Transition API*, 2018](https://android-developers.googleblog.com/2018/03/activity-recognitions-new-transition.html),
[Detect when users start or end an activity](https://developer.android.com/develop/sensors-and-location/location/transitions)).
İzin: `com.google.android.gms.permission.ACTIVITY_RECOGNITION` (Android 10+ runtime izni).

**b) Health Connect `ExerciseSessionRecord`.** Zaten okuyoruz (`watchExercise.ts`, 35 tip
eşlemesi). Saat seansı tanıdıysa buradan geliyor.

**c) Ham ivmeölçer/jiroskop.** `SensorManager`. Her şeyi verir, hiçbir şeyi yorumlamaz —
sınıflandırıcıyı biz yazarız.

### 4.2 Telefon cepteyken ne güvenilir tanınır

**Güvenilir:** yürüme, koşma, bisiklet, araçta olma, hareketsizlik. Bunlar tüm gövdeyi
hareket ettiren, periyodik ve yüksek genlikli hareketler; Transition API'nin sınıf listesi
zaten tam olarak bu beşi.

**Tanınmaz:** bench press, squat, deadlift, lat pulldown gibi direnç hareketleri.
Sebep sınıflandırıcı değil, **sinyal yokluğu**: bench press'te kalça neredeyse hiç
hareket etmiyor, cepteki telefon sabit duruyor. Transition API'nin sınıf listesinde
"direnç antrenmanı" diye bir şey de yok.

Sayısal kanıt: direnç egzersizi sırasında aktivite sayımları bilekte 61.282 ± 8.358, belde
6.565 ± 2.445 — **yaklaşık 10 kat fark**
([Rawson & Walsh, *Estimation of resistance exercise energy expenditure using accelerometry*,
Med Sci Sports Exerc, 2010](https://pubmed.ncbi.nlm.nih.gov/19952824/)).
Cepteki telefon "bel"e bile değil, uyluk konumunda — sinyal daha da zayıf.

**Kesinlik: yüksek.**

### 4.3 Tekrar sayma (rep counting) — sensör nereye bağlı olmalı

Sensör **hareket eden uzva** bağlı olmalı. Bilekten yapılan çalışmada 12 egzersizin
8'inde tekrar tahmini referanstan anlamlı farklı değil, farklı çıkan 4'ünde fark %10'un
altında ve bilek ivmeölçeriyle direnç egzersizi **sınıflandırması** da yapılabiliyor
([Pernek et al. / *Objective Assessment of Strength Training Exercises using a Wrist-Worn
Accelerometer*, Med Sci Sports Exerc, 2016](https://pubmed.ncbi.nlm.nih.gov/27054678/)).

Yani tekrar sayma **bilekte mümkün, cepte değil.** Ayrıca bacak egzersizlerinde (squat,
leg press) bilek de zayıf kalır — sensörün yükü taşıyan uzva yakın olması gerekiyor.

**Not — Health Connect şeması tekrarı taşıyor:** `ExerciseSegment` sınıfının
`getRepetitions()` alanı var ve segment tipleri arasında `EXERCISE_SEGMENT_TYPE_BENCH_PRESS`,
`_DEADLIFT`, `_ARM_CURL`, `_HIP_THRUST` gibi direnç hareketleri bulunuyor (yerel AAR'dan
`javap` ile doğrulandı). Yani **şema hazır, üretici yok**: bu segmentleri kimin yazdığı
**doğrulanmadı**. Saat verisi dökümünde segment olup olmadığına bakmak ucuz bir kontrol
(§8'de madde).

**Kesinlik: bilek/cep farkı yüksek; şemanın dolu olup olmadığı doğrulanmadı.**

### 4.4 Wear OS yazmadan bileğe erişim var mı? — Hayır

Bilekteki ham ivmeölçere erişmenin tek yolu saatte çalışan bir uygulamadır. Telefondaki
uygulama saatin sensörlerini okuyamaz; Health Connect üzerinden gelen şey saat
uygulamasının **zaten işlemiş** olduğu özet (adım, seans, nabız örnekleri) — ham sinyal değil.
Samsung'un ham sensör yolu da (§1.3) Wear OS uygulaması + partner onayı istiyor.

Alternatif: doğrudan BLE band (`docs/PLAN-BAND.md` §2). Orada da standart `0x180D`
profilinin yayınlandığı **doğrulanmadı** ve çoğu tüketici bandı tescilli protokol kullanıyor.

**Kesinlik: yüksek.**

---

## 5. Mikrofonla ne ölçülebilir

### 5.1 Nefes hızı — HANDOFF'un iddiası kısmen düzeltilmeli

HANDOFF diyor ki: *"Nefes hızı ölçülmüyor; mikrofonla güvenilir değil."*
**Bu, bizim kurulumumuz için doğru ama genel olarak eksik.** Literatür mikrofonla nefes
hızının ölçülebildiğini gösteriyor — belirli koşullarda:

- Laboratuvarda, respiratuar indüktans pletismografiye karşı: **MAE 0.2 ± 0.27 nefes/dk**,
  kayıtların %96'sı 1 nefes/dk içinde (r=0.99). Uzaktan kayıtlarda **MAE 0.79 ± 2.44**,
  %87.5'i 1 nefes/dk içinde (r=0.92)
  ([*Estimation of respiratory rate and exhale duration using audio signals recorded by
  smartphone microphones*, Biomed Signal Process Control, 2023](https://www.sciencedirect.com/science/article/abs/pii/S1746809422007728)).
- Trakeal solunum sesiyle, telefon **paralaringeal bölgeye** konarak 6–90 nefes/dk aralığı
  ölçülebiliyor ([*Estimation of Respiratory Rates Using the Built-in Microphone of a
  Smartphone or Headset*, 2015](https://pubmed.ncbi.nlm.nih.gov/26415194/)).
- Burun sesinden ölçüm mikrofon **30 cm'e kadar** uzakken çalışıyor; küçük kafa hareketleri
  ve arka plan gürültüsü doğruluğu bozuyor (aynı kaynak grubu).

Bizim kurulumumuzda çalışmaz, **üç ayrı sebeple**:
1. **Mesafe.** Gece telefon komodinde, 30 cm değil. Solunum sesinin genliği mesafeyle
   hızla düşüyor.
2. **Duty cycle.** `SleepService.PERIOD_MS = 30000`, `LISTEN_MS = 4000`. 4 saniyelik
   pencere 12–20 nefes/dk'da ancak 0.8–1.3 nefes görür — periyodu ölçmek için yeterli değil.
   Bu tasarım gereği: pencere uzatmak pil bütçesini bozar.
3. **Örnekleme.** `SAMPLE_RATE = 8000` nefes için sorun değil (düşük frekans), ama
   eşik tabanlı `SnoreAnalyzer` genlik bakıyor, periyodiklik değil.

**Sonuç: HANDOFF'un cümlesi bizim bağlamımızda doğru; "mikrofonla nefes hızı ölçülemez"
diye genelleştirilmemeli.** Elle başlatılan, telefonu göğse/boğaza koyan 60 saniyelik ayrı
bir ölçüm akışı teknik olarak mümkün — ama bu yeni bir ürün akışı, gece takibinin uzantısı
değil, ve Health Connect'te `RespiratoryRateRecord` zaten var (yazacak veri olsa yeri hazır).

**Kesinlik: yüksek** (kaynaklar + kendi kodumuzun sabitleri).

### 5.2 Öksürük

Öksürük tespiti mikrofonla yapılabilen bir sınıflandırma problemi, ama eşik tabanlı bir
analizle değil — eğitilmiş model ister. `SnoreAnalyzer`'ımız eşik tabanlı ve HANDOFF'ta
zaten yazılı olduğu gibi fan/trafik gürültüsünde epizot saymıyor. **Öksürük için güvenilir
bir eşik yöntemi bulamadım**; model eğitmek bu projenin kapsamı dışında.

**Kesinlik: düşük — net kanıt bulamadım.** Ne "yapılabilir" ne "yapılamaz" diyorum.

### 5.3 Egzersiz temposu

Mikrofonla set/tekrar temposu ölçümüne dair **hakemli kaynak bulamadım**. Spor salonu
ortamı (müzik, başka kişiler, demir sesleri) sinyal-gürültü açısından gece odasından çok
daha kötü. Denemeye değer bir fikir olarak bile öncelik listesinin dışında.

**Kesinlik: net kanıt bulamadım.**

---

## 6. Sürekli dinleyen uygulama — gerçek maliyet

"Bir dinleyen uygulama" fikri en çok burada tökezliyor. Android 8'den beri arka planda
serbestçe çalışmak yok; her sürümde biraz daha daraldı.

### 6.1 Foreground service tipleri (Android 14 / API 34+)

Android 14'ten itibaren her foreground service manifest'te **tip** bildirmek ve o tipe
karşılık gelen izni istemek zorunda
([Foreground service types, Android Developers](https://developer.android.com/develop/background-work/services/fgs/service-types)):

| İhtiyaç | Tip | İzin | Ön koşul |
|---|---|---|---|
| Mikrofon dinleme | `microphone` | `FOREGROUND_SERVICE_MICROPHONE` | `RECORD_AUDIO` runtime; **while-in-use kısıtlı**, arka plandan ya da `BOOT_COMPLETED`'dan başlatılamaz |
| Kamera PPG | `camera` | `FOREGROUND_SERVICE_CAMERA` | `CAMERA` runtime; while-in-use kısıtlı |
| Nabız/sensör takibi | `health` | `FOREGROUND_SERVICE_HEALTH` | `BODY_SENSORS` (API ≤35) veya `READ_HEART_RATE`/`ACTIVITY_RECOGNITION`; arka plan için `BODY_SENSORS_BACKGROUND` (33–35) ya da `READ_HEALTH_DATA_IN_BACKGROUND` (36+) |
| Arka plan senkronu | `dataSync` | `FOREGROUND_SERVICE_DATA_SYNC` | Android 15+: `BOOT_COMPLETED`'dan başlatılamaz; sistem süreyi sınırlıyor |

Bizim `SleepService`'imiz `android:foregroundServiceType="microphone"` ile zaten doğru
bildirilmiş (manifest'te görünüyor). **Play Store'a çıkmadığımız için Play Console tip
beyanı bizi bağlamıyor** — sideload olmanın somut avantajı bu.

**"while-in-use kısıtlı" bizim için ne demek:** servis ancak uygulama ön plandayken
başlatılabilir. `SleepService` elle başlatıldığı için sorun değil. Ama "uygulama kapalıyken
kendiliğinden dinlemeye başlasın" **yapılamaz.**

### 6.2 Doze ve OEM pil optimizasyonu

Foreground service Doze'dan muaf (bildirim gösterdiği sürece), ama Samsung/Xiaomi/Huawei
gibi OEM'lerin kendi agresif "uygulama uyutma" katmanları AOSP'nin ötesinde iş öldürüyor.
Pratik çözüm kullanıcının uygulamayı elle "kısıtlanmamış" listesine alması
(`REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`). Tek kullanıcılı bir projede bu kabul edilebilir —
kullanıcıya bir kez söylenir. **Bunu cihazda test etmedik**; duman testi listesine girmeli.

### 6.3 Pil

`SleepService` tasarımı referans: 30 saniyede 4 saniye mikrofon = **%13 duty cycle**,
`AudioRecord` her pencerede açılıp kapanıyor, ses diske yazılmıyor. Gerçek tüketim
**henüz ölçülmedi** — HANDOFF'un duman testi listesinde 5. madde tam olarak bu.

Sürekli (duty cycle'sız) dinleme bunun ~8 katı mikrofon süresi demek; buna ek olarak
sınıflandırma yapılacaksa CPU da sürekli uyanık kalır. **Kamera PPG daha pahalı:** kamera
+ flaş + 30 fps görüntü işleme, dakikalarca değil saniyelerce çalıştırılacak bir şey.

**Sonuç: "sürekli dinleyen uygulama" mimarisi teknik olarak kurulabilir ama pil bütçesi
onu duty cycle'a zorlar, duty cycle da ölçülebilecek şeyleri daraltır.** Bizim
`SleepService` deneyimimiz zaten bu dengenin kanıtı.

---

## 7. ⚠️ Regülasyon uyarısı

**Bu hukuki tavsiye değil.** Dikkat edilmesi gereken sınırı gösterir; ciddi bir adım
atılacaksa hukuk danışmanı gerekir.

### 7.1 AB / Türkiye

- MDR (AB) 2017/745 kapsamı **piyasaya arz** (*placing on the market*) ve **hizmete sunma**
  (*putting into service*) üzerinden tanımlı (Madde 1(1),
  [EUR-Lex 32017R0745](https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX%3A32017R0745)).
- MDCG 2019-11, **yalnızca idari, yaşam tarzı (lifestyle) veya iyi-oluş (wellness) amacı
  güden yazılımın** tıbbi cihaz yazılımı sayılmadığını söylüyor; sağlık bilgisini işleyen
  yazılım **doğrudan tıbbi bir amaca hizmet ediyorsa** MDR/IVDR kapsamına giriyor
  ([MDCG 2019-11, European Commission](https://health.ec.europa.eu/system/files/2020-09/md_mdcg_2019_11_guidance_en_0.pdf)).
- **Kural 11**: tanı veya tedavi kararlarını bilgilendiren yazılım en az **Sınıf IIa**;
  yanlış karar ciddi zarara yol açabilecekse **IIb** (aynı kaynak). Bu, onaylanmış kuruluş
  denetimi demek — bir hafta sonu projesinin kaldıracağı yük değil.
- **Türkiye:** MDR hükümleri Tıbbi Cihaz Yönetmeliği ile yerel düzlemde yürürlükte, denetim
  TİTCK'de ([Qalico — Medical Device Regulation in Türkiye](https://www.qalico.com/resources/regulatory-map/turkey)).
  Yani AB'deki sınır Türkiye'de de geçerli.

**Yayınlanmayan, yalnız kendi kullanımı için yazılmış yazılımın durumu:** MDR'ın kapsamı
piyasaya arza bağlı olduğu için bu tür yazılımın kapsam dışı kaldığı yorumu yaygın, ama
**bunu doğrudan söyleyen birincil bir kaynak bulamadım.** Kesin bilgi olarak yazmıyorum.
Kesin olan şu: **APK'yı başka birine verdiğiniz an** "piyasaya arz" tartışması başlar.

### 7.2 ABD

FDA'nın *General Wellness: Policy for Low Risk Devices* yaklaşımı, yalnız iyi-oluş amacı
güden ve hastalık tanı/tedavi/önlemesiyle ilişkisiz düşük riskli ürünleri denetim dışı
bırakıyor. FDA, kan basıncı, nabız veya glukoz gibi fizyolojik parametreleri **tahmin eden**
non-invaziv ürünleri, yalnız wellness amaçlı ve minimum riskliyse wellness ürünü sayabiliyor
— **ama iddialar, işlevsellik veya çıktılar tıbbi kullanım ima ediyor, klinik karara
yön veriyor ya da FDA onaylı bir cihazın yerine geçiyorsa bu koruma kalkıyor**
([FDA — General Wellness: Policy for Low Risk Devices](https://www.fda.gov/regulatory-information/search-fda-guidance-documents/general-wellness-policy-low-risk-devices);
2026 revizyonunun analizi: [Troutman Pepper Locke](https://www.troutman.com/insights/fdas-2026-guidance-on-general-wellness-devices-policy-for-low-risk-devices/)).

### 7.3 Bizim için pratik sınır

Sınır **cümlede**, sensörde değil:

| Yazarsak | Ne olur |
|---|---|
| "Dinlenme nabzın son 7 günde 62" | Wellness. Sorun yok. |
| "Nabzın düzensiz, aritmi olabilir" | **Tanı.** Kural 11 bölgesi. |
| "Tansiyonun 128/82" (tahminden) | **Ölçüm iddiası.** Doğrulanmamış yöntemle sayı vermek en kötüsü. |
| "EKG'n normal" | **Tanı + güvence.** `COACH-PERSONA.md` §2.1 zaten yasaklıyor. |
| "Bu belirti hekim ister" | Yönlendirme. `COACH-PERSONA.md` §2.2'nin tam olarak yaptığı şey. |

`docs/COACH-PERSONA.md`'deki sağlık sınırı bu regülatif sınırla **zaten hizalı**:
Eva teşhis koymuyor, güvence vermiyor, hekime yönlendiriyor. Yeni bir sensör eklenirse
o sınırın da o sensör için yazılması gerekir.

---

## 8. Bugün yapılabilir — öncelik sırasında

### 1. Activity Recognition Transition API ile hareket bağlamı — **küçük-orta iş**

**Ne verir:** Kullanıcı yürüdü/koştu/bisiklete bindi/araçtaydı/hareketsizdi geçişleri,
telefon cepteyken güvenilir. Bu, HANDOFF'taki **yüksek nabız penceresi** mantığının
eksik yarısı: bugün 120+ bpm penceresi görünce "spor mu yaptın?" diye soruyoruz ama
kullanıcının o sırada koştuğunu mu yoksa otobüste mi olduğunu bilmiyoruz. Transition API
bunu ayırır → **soru sayısı düşer, doğruluk artar** (`MAX_HR_QUESTIONS_PER_DAY` baskısı azalır).

**Nerede:**
- Yeni `apps/web/android/app/src/main/java/com/evaitec/wellness/ActivityPlugin.kt`
  (şablon: `SleepPlugin.kt`), `ActivityRecognitionClient.requestActivityTransitionUpdates`
  + `BroadcastReceiver`.
- Manifest: `com.google.android.gms.permission.ACTIVITY_RECOGNITION` (+ runtime izni).
- Yeni bağımlılık: `com.google.android.gms:play-services-location` (AGENTS.md §Sınırlar
  gereği PR'da gerekçesi yazılır — ham ivmeölçerden sınıflandırıcı yazmanın alternatifi bu).
- JS: `recordMetrics('phone_activity', date, {...})` → `WearableRecord`, **şema değişikliği
  yok** (`PLAN-BAND.md` §Mevcut düzen: yeni bir `source` string'i yeter).
- Tüketici: `apps/web/src/lib/watchExercise.ts` yüksek nabız penceresi mantığı.

**Riski:** Play Services bağımlılığı APK'yı büyütür. Transition API'nin bu cihazdaki
gerçek doğruluğu **test edilmedi**.

---

### 2. Health Connect `ExerciseSegment` dökümü — **çok küçük iş, önce bu**

**Ne verir:** Cevap: "saat bench press'i segment olarak yazıyor mu, tekrar sayısı geliyor mu?"
Şema hazır (`getRepetitions()`, `EXERCISE_SEGMENT_TYPE_BENCH_PRESS` vb. — §4.3), üretici
belirsiz. **Dolu çıkarsa tekrar sayma sorununun bir kısmı bedava çözülür**
(`WorkoutForm`'daki `reps_total` alanı otomatik dolar → koç katmanının double progression'ı
çalışmaya başlar, HANDOFF: *"`reps_total` girilmeye başlanmadan ilerleme önerisi çıkmaz"*).
Boş çıkarsa konu kapanır ve bir daha açılmaz.

**Nerede:** `HealthExtraPlugin.kt` içinde zaten `ExerciseSessionRecord` okunuyorsa
`record.segments` alanını loglamak yeterli — ya da `ops/import_health.mjs`'e tek seferlik
bir döküm. Yeni izin yok (`READ_EXERCISE` zaten var), yeni bağımlılık yok.

**Bu listede 1'den önce yapılmalı** çünkü sonucu 1'in de kapsamını değiştirebilir.

---

### 3. Kan basıncı için elle giriş + `BloodPressureRecord` okuma — **küçük iş**

**Ne verir:** Kullanıcı manşonlu cihazla ölçüyorsa (Samsung Watch KB'si zaten 28 günde bir
manşon istiyor, §2.3) o sayının uygulamaya girmesi. `COACH-PERSONA.md` §2.2 "kalıcı yüksek
ya da düşük tansiyon ölçümleri"ni randevu kırmızı bayrağı olarak sayıyor — **bugün Eva'nın
bakabileceği bir tansiyon verisi yok.** Bu, var olan bir personel kuralını çalışır hale getirir.

**Nerede:**
- Manifest: `android.permission.health.READ_BLOOD_PRESSURE`.
- `HealthExtraPlugin.kt`'ye `BloodPressureRecord` okuma (mevcut SpO2/HRV deseni birebir).
- Elle giriş: mevcut manuel giriş formu deseni; `recordMetrics` ile
  `{bp_systolic, bp_diastolic}`.
- Yeni bağımlılık yok.

**Not:** Ölçümü biz **üretmiyoruz**, kullanıcının manşonlu cihazından geleni kaydediyoruz.
Regülatif olarak temiz taraf burası (§7.3).

---

### 4. Kamera PPG ile anlık nabız — **orta iş, düşük öncelik**

Doğruluk kanıtlı (§3.1), maliyet orta (`HeartRatePlugin.kt` + CameraX), ama **eklediği
değer düşük**: saat zaten dinlenme nabzını veriyor. Saat takılı değilken ölçüm isteniyorsa
yapılır; önce 1–3 bitsin.

---

## 9. Yapılamaz / yapılmamalı

Kullanıcının umduğu şeylerin bir kısmı gerçekten mümkün değil. Sebepleriyle:

**EKG — hiçbir yoldan.** Telefonda elektrot yok; Health Connect'in 42 kayıt tipinde EKG yok;
Samsung'un ham EKG'si yalnız Wear OS uygulamasından ve partner onayıyla. Üç kapı da kapalı,
üçü de bizim kod yazarak açabileceğimiz kapılar değil. *Apple tarafında açık olması
(§1.4) bunu Android'de yapılabilir kılmıyor.*

**Kan basıncı — telefon sensörüyle ölçmek.** Yapılamaz değil, **yapılmamalı**. Manşonsuz
KB'nin hiçbir doğrulama standardını geçmiş bir örneği yok (§2.1). Kod yazmak mümkün, çıkan
sayı ölçüm olmaz — ve kullanıcı onu ölçüm sanar. Bu, bu projedeki tek gerçek zarar verme
yolu: yanlış bir tansiyon sayısı, doğru bir hekim ziyaretini geciktirir. `COACH-PERSONA.md`
§2'nin ruhu buna kapalı.

**Bench press / squat gibi hareketlerin telefonla tanınması ve tekrar sayılması.**
Sınıflandırıcı sorunu değil, **sinyal yokluğu**: direnç egzersizinde bilekteki hareket
sayımı beldekinin ~10 katı (§4.2), cepteki telefon ondan da az görür. Bunu çözmenin yolu
daha iyi kod değil, **sensörü hareket eden uzva taşımak** — yani Wear OS uygulaması ya da
BLE band. İkisi de `PLAN-BAND.md`'de duruyor ve ikisi de cihaz eline geçmeden başlamıyor.

**Gece mikrofonla nefes hızı.** Mesafe + %13 duty cycle + eşik tabanlı analiz üçlüsü
periyodik bir sinyali ölçmeye elverişli değil (§5.1). Duty cycle'ı büyütmek pil bütçesini
bozar — `SleepService`'in tüm tasarımı o kısıt üzerine kurulu. *Elle başlatılan, telefonu
göğse koyan ayrı bir 60 sn ölçümü mümkün; ama o gece takibi değil, başka bir özellik.*

**"Sürekli dinleyen, her şeyi gören bir servis."** Android 14+ her foreground service'in
tip bildirmesini istiyor ve mikrofon/kamera tipleri **while-in-use kısıtlı** — uygulama
kapalıyken kendiliğinden başlayamaz (§6.1). Tek kullanıcı ve sideload olmak Play
politikasından kurtarıyor, işletim sistemi kısıtından kurtarmıyor.

**Stres.** Health Connect'te kayıt tipi yok (§1.2). HANDOFF'taki tespit doğru: en yakın
ham ölçü HRV ve onu zaten alıyoruz.

---

## 10. Kaynak bulamadıklarım (açıkça işaretli)

- **Mikrofonla öksürük tespitinin** eşik tabanlı (model eğitmeden) güvenilirliği — net kanıt bulamadım.
- **Mikrofonla egzersiz temposu/set tespiti** — hakemli kaynak bulamadım.
- **Samsung Health Monitor'ün KB ölçümünü Health Connect'e yazıp yazmadığı** — doğrulayamadım.
- **Yayınlanmayan, kişisel kullanımlık yazılımın MDR kapsamı dışında olduğunu** doğrudan
  söyleyen birincil kaynak — bulamadım; §7.1'de bu yüzden yorum olarak işaretlendi.
- **`MediaStreamTrack` torch kısıtının** bu cihazda çalışıp çalışmadığı — test etmedim (§3.2).
- **`ExerciseSegment`'i dolduran gerçek bir üretici uygulama** — doğrulanmadı (§4.3, iş kalemi 2).
- **Transition API'nin bu cihazdaki gerçek doğruluğu ve pil maliyeti** — test edilmedi.
- **`SleepService`'in gerçek pil tüketimi** — hâlâ ölçülmedi (HANDOFF duman testi §5).

---

## İlgili dosyalar

`AGENTS.md` (kilitli kararlar) · `HANDOFF.md` §"Saatten ne alınıyor, ne alınamıyor" ·
`docs/PLAN-BAND.md` (BLE band, Wear OS alternatifi) · `docs/COACH-PERSONA.md` §2 (sağlık
sınırı — §7.3'ün dayanağı) · `apps/web/android/app/src/main/java/com/evaitec/wellness/SleepService.kt`
(foreground service + duty cycle deseni).
