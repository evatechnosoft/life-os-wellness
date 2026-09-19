# Handoff: UI düzeni yayında, sıradaki iş kardiyo yükü

> 2026-09-19 · `dev` @ `7c38f3f` · çalışma ağacı temiz · Pages koşusu `35463916225` success

## Goal
İki koldan ilerledi: (1) PLAN-UI §14 düzen dili uygulandı ve yayına çıktı, (2) Dean'in
günlük sağlık verisi (öğün, tartı, tansiyon, EKG, Health Connect) sunucuya girildi.
Sıradaki iş `docs/PLAN-WEAR.md` §8: kendi kardiyo yükü hesabımız.

## State
- Sekiz commit `dev`'de. UI tarafı: PR #16 + üç düzeltme (`9edf7e8` kilo girişi,
  `c9f41fc` silme etiketi, `a9c3604` saat kartı web'de görünür).
- `npm test` 339 pass · `tsc --noEmit` çıktısız · `npm run build` başarılı (son koşu `31790cd` öncesi).
- **Sunucudaki veri** (`https://fit.evaitec.com`, token `.env: API_TOKEN`):
  - 19 Eyl öğünler: 5 kayıt, 145 g protein / 1830 kcal, `daily_log.protein_g` = 145
  - Kilo: 12 Eyl 109,1 · 15 Eyl 108,4 · 19 Eyl 107,6 (OKOK tartı PDF'i). 14 Eyl'in
    çakışan kaydı temizlendi; 8 ve 9 Eyl'deki 109,1 raporun kapsamı dışında, **dokunulmadı**.
  - Vücut kompozisyonu üç gün için `wearable` içinde, kaynak `okok` (bmi, body_fat_pct,
    muscle_kg, water_pct, bone_kg).
  - Tansiyon: 8 Eyl 137/93 · 10 Eyl 136/92 · 18 Eyl 141/88 · 19 Eyl 138/87 (gün ort).
    EKG 19 Eyl 21:52 sinüs ritmi normal, 79 bpm. Kaynak `shm`.
  - Health Connect aktarımı: 162 gün (11 Nis – 19 Eyl), 308 ölçüm, 10 antrenman.
  - Antrenman: 15 Eyl 90 dk yüzme+gezinti · 17 Eyl 60 dk yüzme (580 kcal) · 18 Eyl 11 dk.

## Doğrulanmadı
- `ui/Sheet.tsx` alt sayfasının açık hâli, 7×6 matris dokunuşu, katlama hafızası —
  hiçbiri gerçek cihazda denenmedi (headless tıklayamıyor).
- Dean'in telefonunun sunucudan çekip çekmediği. Öğünler sunucuda, telefonda görüldüğü
  teyit edilmedi.

## Next
1. `apps/web/src/lib/cardioLoad.ts` yaz (TDD, AGENTS.md hesaplama kuralı): `zoneOf`,
   `trimpFromSeries`, `trimpFromSession`, `acuteChronicRatio`. Sözleşme ve gerekçe
   `docs/PLAN-WEAR.md` §8.3'te; çıktı her zaman `{ load, source: 'hr' | 'met' | 'rpe' }`.
2. Aktarıma bölge süreleri ekle (`ops/import_health.mjs`): nabız serisinden gün başına
   bölge 1-5 dakikaları, `wearable` metriği olarak.
3. Hafta ekranındaki sparkline'ın yanına yük serisi. Bugün ekranına kart **eklenmez**.

## Don't repeat
- **Yüzmede nabız beklemeyi bırak.** Su PPG'yi bozar; 17 Eyl'de tüm gün 3 örnek var,
  seans saatinde hiç yok. Yüzme için süre + MET yolu asıldır (`PLAN-WEAR` §8.2b).
- **Health Connect Wear OS'ta çalışmıyor.** Saat → telefondaki Samsung Health → Health
  Connect zinciri var ve ikinci halka kopuyor. Kendi saat uygulamamız Health Services
  kullandığı için bu zinciri atlıyor.
- Fitness Index / Daily Cardio Load **Watch7+ ve One UI 9 Watch** istiyor; Watch6
  Classic'te açan yöntem yok (modded APK, bölge, ADB — hiçbiri). Bölge kilidi değil,
  model beyaz listesi. Bir daha araştırma açma.
- **Türkiye EKG ve tansiyon için resmî destekli.** Kilit aşmaya gerek yok.
- **Reddit bu ortamdan erişilemiyor** (arama alan adını reddediyor, aynalar bloklu).
  Eşdeğer kaynak: Samsung Community + XDA.
- Haşlanmış tavuk 30-31 g/100g (göğüs), but 26-28. 34 g/100g kullanma.
- 448 px headless ekran görüntüsünde sağ kenarın kesik görünmesi artefakt, gerçek taşma
  değil (600 px'te temiz).
- Sayfa yüksekliği ölçümünde `body::before` aurora glow sayfayı doldurur; doğru yöntem
  `x=200` ile `x=2` parlaklık farkı, `y < 2850` sınırı.
- `vite preview` https açıyor: `curl -k` / `--ignore-certificate-errors` şart.
- PDF okumak için `pymupdf` kurulu (`python -c "import fitz"`); `pdftoppm` yok.

## Read first
1. `docs/PLAN-WEAR.md` §8 — kardiyo yükü planı, girdi gerçeği, sözleşme
2. `ops/import_health.mjs` — aktarım deseni, `dailyMax` ve `heartRate`
3. `apps/web/src/lib/metrics.ts` — mevcut hesaplama deseni ve test stili
4. `AGENTS.md` — kilitli kararlar

## Verify
```bash
git rev-parse --short HEAD          # 7c38f3f
git status --porcelain | wc -l      # 0
npm test                            # 339 pass
curl -s -H "Authorization: Bearer $(grep '^API_TOKEN=' .env | cut -d= -f2-)" \
  "https://fit.evaitec.com/api/daily?start=2026-09-19&end=2026-09-19"
```

## Yeniden başlangıç promptu (yapıştır)

```
life-os-wellness (D:\projects\evaitec\lifeOS\life-os-wellness), dal dev @ 7c38f3f, ağaç temiz.
Dün iki iş bitti: PLAN-UI §14 düzeni yayına çıktı (glance şeridi, + ile hızlı ekle,
katlı kartlar, Ayar üç bölge) ve Dean'in 19 Eylül verisi sunucuya girildi (öğün, tartı,
tansiyon, EKG, 162 günlük Health Connect aktarımı). Sıradaki iş kendi kardiyo yükü
hesabımız: Samsung'un Daily Cardio Load'u Watch7+ istiyor, Watch6 Classic'te açılmıyor,
metriği kendimiz hesaplayacağız.

Önce HANDOFF.md'yi oku ve Verify bloğunu çalıştır, sonra docs/PLAN-WEAR.md §8'i oku.
Next #1: apps/web/src/lib/cardioLoad.ts'i TDD ile yaz (sözleşme §8.3'te).
Yeni araştırma açma — Fitness Index ve Reddit konuları kapandı, gerekçe HANDOFF'ta.
```
