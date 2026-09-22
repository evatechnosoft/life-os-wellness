# Handoff: ölçüm kaynakları ayrıldı · vücut kompozisyonu girdi

> 2026-09-22 21:22 · `dev` @ `a526934` · çalışma ağacı temiz, uzakla eşit
> önceki: `2026-09-22-1815-apk-027-ota.md` (0.27.0 APK/OTA — orada kalsın)

## Bu turda olan

- **Tansiyon 22 Eyl: 126/80, nabız 83** kaydedildi (`daily_log` + `wearable_sync` `bp_pulse`).
  7 gün ortalaması **134/86** (5 ölçüm). Seri: 141/88 → 138/87 → 132/89 → 132/88 → 126/80.
  Eğilim iyi ama **ortalama hâlâ 130/80 üstünde → antrenman kısıtları gevşemedi.**
- **Health Connect zip'i içe alındı** (`--from 2026-09-12`): 11 gün, ölçümler yazıldı.
- **Kök neden düzeltmesi (`a526934`):** HC ve Samsung aynı seansı farklı uuid ile getirdiği için
  her seans iki satır olmuştu (17 Eyl salon 60 dk iki kez, yüzmeler çift, tip 53'ler zaten
  adım sayacında olan yürüyüşler). **25 mükerrer satır silindi**, 12 Eyl sonrası 7 seans kaldı.
  `import_health.mjs` artık seans yazmıyor — `--workouts` bayrağı gerekiyor; `--from` da eklendi.
  Kural: **ölçüm Health Connect'ten, seans/hareket Samsung'dan.**
- **OKOK tartısı (.xls) okundu ve kaydedildi:** 6 ölçüm × 5 metrik = 30 kayıt
  (`source: okok` · `body_fat_pct`, `body_fat_kg`, `muscle_kg`, `skeletal_muscle_kg`, `body_water_kg`).
  Kilo düzeltmeleri: 20 Eyl 107.6, **22 Eyl 107.9** (Dean önce 107.6 demişti, xls sabah 08:03
  ölçümünü 107.9 gösterdi). Kilo 7 gün ortalaması **107.65**.

## Vücut kompozisyonu — 12 → 22 Eylül

Kilo 109.1 → 107.9 (−1.2) · yağ 38.2 → 37.5 (−0.7) · kas 67.7 → 67.2 (−0.5) ·
**iskelet kası 35.3 → 35.2 (−0.1)** · su 53.2 → 52.8 (−0.4).

Yorum: "kas" kalemindeki 0.5 kg'ın 0.4 kg'ı su. İskelet kası neredeyse sabit — BIA hata payı
içinde, ölçülebilir kas kaybı yok. Dean'e verilen limit: **kaybın en fazla %25'i yağsız kütleden**;
kırmızı çizgi iskelet kasının 3 hafta üst üste düşmesi ya da antrenmanda ağırlıkların gerilemesi.

## Tekrarlanmayacaklar

- **İki kaynağı aynı tabloya yazdırma.** Health Connect + Samsung aynı seansı çoğaltıyor;
  ayrım artık script'lerde ama elle içe aktarırken de aynı kural geçerli.
- Bu makinede `pdftoppm` yok → **görüntü tabanlı PDF okunamıyor**. OKOK'un `.xls` çıktısı
  `xlrd` ile sorunsuz okunuyor (pandas ve Excel COM da mevcut). PDF yerine xls iste.
- Python heredoc içinde `re` deseni yazarken kaçışlara dikkat (`[^()\\]` parse hatası verdi).
- Önceki devirlerden: Docker dist hash'i yerelden farklı · `curl -d` Türkçe karakteri bozuyor ·
  heredoc'tan JS'e `\n` yazma.

## Açık işler

1. **Faz 2** (asıl iş, hiç başlanmadı): `ui/DayStrip.tsx`, `ui/SessionCard.tsx`, `ui/PlateCard.tsx`,
   Plan'da zar + kas haritası, `DocPage.tsx`. Spec §3–§4.
2. Dean'den bekleyen: 0.27.0 cihaz kanıtı ve görsel yön onayı · saatte A/B/A′ rutinleri
   (dinlenme 90 sn, her harekete **Set target**) · 19 Eylül'de eksik dediği öğün ·
   Samsung'da karşılığı olmayan 11 kod kararı.
3. Tansiyon serisi: 126/80 gibi 3–4 gün daha gelirse 7 gün ortalaması banda iner,
   `PROGRAM-2026-09.md` §1 ve `SAAT-RUTIN.md`'deki 90 sn gerekçesi yeniden değerlendirilir.

## Sıradaki tek adım

Faz 2'ye başla: `feature/bugun-kartlari` dalında `ui/DayStrip.tsx` + `ui/SessionCard.tsx`
(spec §3.1, §3.3). Ölçüm tarafında bekleyen iş yok — veri güncel.
