# Saatteki rutin — hareket + tekrar verisi nasıl gelir

> 2026-09-22 · Kaynak: Samsung Health arşivi (22 Kas 2024 `Full body` rutin kaydı) +
> [Samsung ExerciseType kod listesi](https://developer.samsung.com/health/android/data/api-reference/EXERCISE_TYPE.html).

## Neden

Saat serbest "Ağırlık makinesi" (kod 15002) ile başlatılan seansta **yalnız süre ve kalori**
kaydeder — hangi hareketi yaptığın kaybolur. 21 Eyl 2026 seansı böyle: `Weight machine 55 dk`,
hareket yok.

Seans **rutinden** başlatılırsa saat her hareketi ayrı kayıt olarak yazar. 22 Kas 2024 arşiv
kaydı bunu gösteriyor:

```
exercise_type 10014 (Leg press)      count 48   164 sn   nabız ort 93 / max 104
exercise_type 0     (dinlenme)                   26 sn
exercise_type 10015 (Leg extension)  count 36   134 sn   nabız ort 94 / max 103
```

`count` = toplam tekrar. **Ağırlık (kg) Samsung'da hiç yok** — o uygulamada girilir.

Bu yüzden ne makine öğrenmesi ne sensör SDK'sı gerekiyor: veri zaten üretiliyor, yalnız
seansın rutinden başlatılması gerek.

## Mevcut rutin ve iki sorunu

Saatte `Full body` rutini duruyor (son düzenleme 23 Şub 2026): elliptical 8 dk → bike 5 dk →
leg press / leg ext / leg curl / lat pulldown / *özel* / shoulder press / lateral raise /
bench press / *özel* / arm curl / arm ext (hepsi 3×12) → crunch 3×20 → leg raise 3×20 →
yüzme 30 dk → koşu bandı 10 dk.

1. **Dinlenme 20 sn.** Program RIR 2 ve 8–15 tekrar istiyor; hipertansiyon kurallarıyla
   (`PROGRAM-2026-09.md` §5) 20 saniye toparlanma yetersiz → **90 sn**.
2. **Tek rutin var, program A/B/A′ istiyor.** Aşağıdaki üç rutin kurulur.

## Kurulacak rutinler

Samsung Health → Egzersiz → Rutin ekle. Hareket adları Samsung'un kendi listesinden seçilir;
karşılığı olmayanlar **özel egzersiz** olarak eklenir (adı aynen yazılır, saat kaydı
`exercise_type 0` + rutin bağı ile gelir).

Isınma her rutinde: **Egzersiz bisikleti 5–8 dk** (kod 15003). Soğuma: **hafif yüzme 10–15 dk**
(kod 14001) ya da yürüyüş. Tüm direnç hareketlerinde dinlenme **90 sn**, tekrar **12**.

| Rutin | Samsung hareketi (kod) | Set | Uygulamadaki karşılığı |
|---|---|---|---|
| **A — Pzt** | Bench press (10011) | 3 | `Machine_Bench_Press` |
| | Lat pull-down (10018) | 3 | `Close-Grip_Front_Lat_Pulldown` |
| | Leg press (10014) | 3 | `Leg_Press` |
| | Shoulder press (10020) | 2 | `Leverage_Shoulder_Press` |
| | Arm curl (10026) | 2 | `Machine_Bicep_Curl` |
| | *özel:* Dead bug | 2 | `Dead_Bug` |
| **B — Çar** | *özel:* Butterfly | 3 | `Butterfly` |
| | *özel:* Row-Pull | 3 | `Leverage_Iso_Row` |
| | *özel:* Hip thrust | 3 | `Barbell_Hip_Thrust` |
| | Leg curl (10016) | 2 | `Seated_Leg_Curl` |
| | Arm extension (10027) | 2 | `Machine_Triceps_Extension` |
| | *özel:* Pallof press | 2 | `Pallof_Press` |
| **A′ — Cum** | Bench press (10011) | 3 | `Machine_Bench_Press` |
| | Lat pull-down (10018) | 3 | `Close-Grip_Front_Lat_Pulldown` |
| | Leg press (10014) | 3 | `Leg_Press` |
| | *özel:* Calf press | 2 | `Calf_Press_On_The_Leg_Press_Machine` |
| | Lateral raise (10022) | 2 | `Side_Lateral_Raise` |
| | Arm curl (10026) | 1 | `Machine_Bicep_Curl` |
| | Arm extension (10027) | 1 | `Machine_Triceps_Extension` |
| | *özel:* Dead bug | 2 | `Dead_Bug` |

`Butterfly`, `Row-Pull`, `Lateral Row` özel egzersizleri saatte **zaten tanımlı** (Kasım 2024);
yeniden oluşturmaya gerek yok.

## Samsung kodu → uygulama hareketi

`ops/import_samsung.mjs` bu eşlemeyi kullanır; yeni bir kod çıkarsa oraya eklenir.

| Kod | Samsung | Uygulama |
|---|---|---|
| 10011 | Bench press | `Machine_Bench_Press` |
| 10012 | Squats | `Hack_Squat` |
| 10014 | Leg presses | `Leg_Press` |
| 10015 | Leg extensions | `Leg_Extensions` |
| 10016 | Leg curls | `Seated_Leg_Curl` |
| 10018 | Lat pull-downs | `Close-Grip_Front_Lat_Pulldown` |
| 10019 | Deadlifts | `Romanian_Deadlift` |
| 10020 | Shoulder presses | `Leverage_Shoulder_Press` |
| 10022 | Lateral raises | `Side_Lateral_Raise` |
| 10023 | Crunches | `Ab_Crunch_Machine` |
| 10025 | Plank | `Plank` |
| 10026 | Arm curls | `Machine_Bicep_Curl` |
| 10027 | Arm extensions | `Machine_Triceps_Extension` |
| 15002 | Weight machine | (hareketsiz salon seansı) |
| 15003 | Exercise bike | `Recumbent_Bike` |
| 14001 | Swimming | (kardiyo seansı) |

## Sınır

- Samsung **ağırlık (kg) tutmuyor.** Rutinden gelen kayıt `reps` verir, `weight_kg` boş gelir;
  ağırlık uygulamada girilir (`exercise_set.weight_kg`).
- Set kırılımı da yok: `count` toplam tekrar. İçe aktarımda tek satır (`set_no = 1`) yazılır.
- Rutin JSON'ı dışarıdan yazılamaz; rutin Samsung Health uygulamasında elle kurulur.

## Süre nasıl okunur (Dean kuralı, 22 Eyl)

**Kaydedilen süre saatin süresidir** — seans kaydı doğru kabul edilir. Nabız penceresi
(≥100 bpm kesintisiz aralık) toplam eforu gösterir ve seans süresinden uzundur: soyunma,
giyinme, salondan havuza geçiş sırasında nabız zaten yüksek kalır.

Bir günü çözerken sıra şu:

1. Nabız penceresini çıkar (`com.samsung.shealth.tracker.heart_rate`, 10 dk aralıklı örnekler).
2. O günün **yüzme kaydını** pencereden düş — yüzme süresi saatte doğru ölçülüyor.
3. Kalanın ~10 dakikası geçiş/hazırlıktır; gerisi direnç seansıdır.

17 Eyl 2026 örneği: pencere 06:30–07:50 (80 dk) · saat 06:29–07:29 salon (60 dk) +
07:37–07:52 yüzme (16 dk) · arada 8 dk geçiş. Kayıtlı süreler değiştirilmez, nabız penceresi
antrenman notuna yazılır.

**Yokluk kanıt değil:** yüzerken saat çıkarılmış olabilir. Saatte yüzme kaydı olmayan bir gün,
yüzülmedi demek değildir — elle girilen kayıt silinmez, "saat doğrulamadı" notuyla kalır.
