# Handoff: seans sırası bacak→göğüs→sırt · preset sayfası · salon APK'sı sıradaki oturum

> 2026-09-24 21:54 · `dev` @ `bcbd8ae` · tag `v0.35.0` · plan: `docs/PLAN-GERCEKCI.md`

## Goal
Dean'in salon akışını netleştirmek (sıra, rampa, makine, mobilite) ve karşılaştırılabilir kayıt;
sıradaki iş: salon uygulamasının APK'sından giriş barkodunu saate taşımak + kişisel veriyi çekmek.

## State — doğrulanmış
- Canlı plan (GET /api/workout-plan), her gün bacak → göğüs → sırt → omuz → kol → core:
  A: Leg_Press +2R, Machine_Bench_Press +1R, Wide-Grip_Lat_Pulldown +1R, Leverage_Shoulder_Press +1R, Machine_Bicep_Curl, Dead_Bug
  B: Barbell_Hip_Thrust +2R, Seated_Leg_Curl, Butterfly +1R, Leverage_Iso_Row +1R, Machine_Triceps_Extension, Pallof_Press
  A′: Leg_Press +2R, Calf_Press…, Leverage_Incline_Chest_Press +1R, Close-Grip_Front_Lat_Pulldown +1R, Side_Lateral_Raise, Biceps, Triceps, Dead_Bug
- `fit.evaitec.com/plan/preset.html` (`tools/secici/preset.html`): 3 gün sekmesi + "Karşılaştır" (B/İ, hedef bölge),
  resimler, metin kopyala, sıra/mobilite kutusu. Secici başlığından link. Ekran görüntüsüyle kontrol edildi (480 px).
  Kopyala butonu denenmedi. Kaynak eşi: `docs/seans/PRESET-HAFTA.md`.
- 24 Eyl kayıt: akşam TA 132/82 (measurement 21:16), adım 10.291 (saat fotosu), 105 dk aktif + 811 kcal notta.
  Sabah OKOK kompozisyonu var. Akşam yemeği GELMEDİ (gün: 2 öğün, 1460 kcal / 88 g protein).
- Önceki işler (0.34.0 menü linkleri, 0.35.0 rampa satırları, 21 Eyl 19 set geriye yazıldı) önceki handoff'ta.

## Decisions
- Sıra büyükten küçüğe, dönüşümlü (bacak-göğüs-bacak-sırt) DEĞİL: nabız/tansiyon ve makine yürüyüşü.
- Chest press makine (Life Fitness), bar değil; biseps no 7, triceps no 8; plakalı eğimli preste iki taraf toplamı.
- Mobilite: bisiklet sonrası kedi-deve, kalça çemberi, göğüs açma; soğumada hip flexor + ayak bileği. Gün notuna sığmadı (200 kr).
- Yoğurt tatlandırıcı önerisi: sıvı stevia (yalnız steviol glikozitleri), eritritol dondurmaya.
- Salon APK işi yeni oturuma ertelendi (Dean onayı: "şimdi ya da yeni oturum" → yeni oturum önerildi).

## Don't repeat
- Gün notu (`/api/split` note) max 200 karakter.
- Headless Edge ekran görüntüsü: `--window-size=480,H --virtual-time-budget=4000`; file:// kopyada img yolunu mutlak yap.
- `PUT /api/workout-plan` gün başına `day_type` ister; jq'da tireli anahtarlar tırnaklı.

## Next (tek adım)
Yeni oturum — salon APK'sı: Dean APK + barkod ekranının farklı saatlerde 2–3 ekran görüntüsü + ölçüm/hareket ekranları + salon/uygulama adı getirecek.
Önce kod statik mi dinamik mi (ekran görüntüleri) → statikse Wear uygulamasında tek dokunuş barkod; dinamikse APK'dan üretim
mantığı, güvenlik önlemini aşmak gerekiyorsa DUR. Kişisel veri: uygulamanın kendi hesabıyla konuştuğu API.
Ayrıca 25 Eyl A′ sonrası: diğer uygulama kaydı ↔ `GET /api/workouts?start=2026-09-25&end=2026-09-25` karşılaştırması; akşam yemeği kaydı.
