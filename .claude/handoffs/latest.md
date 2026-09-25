# Handoff: kompozisyon/protein düzeltmesi önerildi · 25 Eyl koçluk günü kayıtları · (dünkü: uzaktan kabuk + salon)

> 2026-09-25 11:40 · `dev` @ `2f8cc36` · plan: bu dosya + `docs/SALON-UYGULAMASI.md` + `docs/PLAN-GERCEKCI.md`

## Goal
1. (dünden, hâlâ açık) Yapılan her şey **telefondaki uygulamada** görünsün; sonra salon verisi uygulamaya girsin.
2. (bugün) Uygulamayı "gerçekçi" yap: tartı (OKOK BIA) verisini doğru kullan, protein hedefini obez vücuda göre düzelt.

## State — doğrulanmış (API GET / git kanıtı)
- **25 Eyl API'ye yazıldı** (hepsi GET ile geri okundu; telefonda görüldüğü DOĞRULANMADI):
  - Öğün `77733ad1` 09:45 kahvaltı ~32 g protein / 570 kcal (fotoğraftan tahmin).
  - Tansiyon: 2 kolluk ölçümü `/api/measurements` 10:15 → 123/75, 125/75; `daily` 25 Eyl = 124/75.
    Saat aynı anda ~138/78 → **saat sistolik ~+13–15 mmHg sapıyor**; kolluk esas.
  - Samsung zip (`--from 2026-09-24`, `--api https://fit.evaitec.com`): 18 wearable kaydı, 25 Eyl adım 2637 + kilo 107.8 dolduruldu.
    Seans aktarılmadı (23 Eyl seansları aynı datauuid ile var; POST set/notu ezebilirdi).
  - Seans `bb2dd00f` 25 Eyl resistance, 12 set ×12 tekrar: Machine_Bench_Press / Wide-Grip_Lat_Pulldown / Leverage_Iso_Row 25-30-35,
    Machine_Triceps_Extension 20-25-30. Plan A′ yerine arkadaşla çalışıldı. Yapılmadı: leg press, calf press, dead bug, biceps, yan omuz
    (ev alternatifleri önerildi: otur-kalk, merdiven baldır, dead bug, bidon/havlu curl, şişe yana açış).
- `docs/TAKVIYELER.md` → "Ek — 25 Eylül: BCAA/whey sepeti" (commit `2f8cc36`, origin/dev ile senkron). Karar: BCAA'ların hepsi hayır/gereksiz,
  BigJoy Ripped (kafein) hayır, High Nutrition whey al (arka etiket okunmadı), kreatin tek kanıtlı ek.
- Dean ~10 Eyl'den beri **3 g/gün kreatin** (Dean'in ifadesi "3 gr suda"; kreatin olduğu varsayıldı, teyit bekleniyor). Profil `medications` boş.
- Kod bulguları (koddan, cihazda doğrulanmadı):
  - `apps/web/src/lib/nutrition.ts:24` `G_PER_KG` + `proteinTarget()` toplam kiloyla hesaplıyor → kesimde 107.85×2.2 ≈ **237 g** öneriyor.
    Doğrusu yağsız kütle (70.4 kg) × 2.3–2.6 ≈ 162–183 g; BIA yoksa referans kilo (BMI 25 × boy²=76.6) × 2.0 ≈ 153 g.
    `COACH-EVIDENCE.md:293`'teki "Yeterli" hükmü bu yüzden yanlış.
  - OKOK wearable metrikleri (`body_fat_pct/kg`, `skeletal_muscle_kg`, `muscle_kg`, `body_water_kg`, source `okok`) **hiçbir hesapta okunmuyor**;
    visceral hiç içe aktarılmıyor.
- Dünkü durum değişmedi: uzaktan kabuk (`server.url`) yapılmadı, salon S1 başlamadı.

## Decisions & why
- Tartıdan yalnız kilo, yağ kg, yağsız kütle, iskelet kası takip edilir; su%/protein%/vücut yaşı/obezite derecesi gürültü (BIA ±%3–5).
  Kompozisyon karar birimi **28 gün**; kilo 7 gün kalır. "Yağ kaybı payı" hedefi >%75.
- Gerçekçi hedef: 100 kg (0.55–0.8 kg/hf, 10–14 hf); yağ 37.5→~30 kg, iskelet kası ≥35 kg; bel/boy <0.6.

## Next — tek adım
Dean onay verirse: `fix/protein-lbm` dalı → TDD ile `proteinTarget` son OKOK yağ %'sinden yağsız kütle, yoksa referans kilo; COACH-EVIDENCE:293 düzelt;
deploy → kabul: telefondaki koç kartında ~160 g aralığı. Sonra P0 ölçüm protokolü kartı, P1 kompozisyon kartı + visceral importu.
Bekleyen Dean cevapları: kreatin teyidi (profile eklensin mi), ev seansı yapıldı mı (ayrı seans kaydı), yumurta/ara öğün yenince kaydet,
kahvaltıdaki bardak çay mı meyve suyu mu.
Açık kontrol: 22–24 Eyl `daily` tansiyonu saatten mi geldi (7-gün ortalamasını şişiriyor olabilir) — doğrulanmadı.

## Don't repeat
- Doküman yazıp "yaptık" deme; kabul ölçütü telefondaki ekran.
- Samsung importunda seansları körlemesine POST etme — aynı id var olan setleri/notu ezer; `--from` ile seans aralığını dışarıda bırak.
- Bash'te `tar` Windows zip'ini açamıyor ("Cannot connect to C:") → PowerShell `Expand-Archive`. Windows python `/d/...` yolunu görmez → göreli yol.
- `/api/workouts` POST setleri id ile upsert eder, silmez; yanlış hareket yazıldıysa seansı DELETE + aynı id ile yeniden POST.
- Telefonun DeviceID'sini kopyalama / QR'ı yerelde üretme. hbctool HBC 96 açmıyor → hermes-dec.
