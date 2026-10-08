# Handoff: 8 Eki Perşembe — hız 1 kg/hafta, kayıtlar

> 2026-10-08 ~13:30 · `dev` @ bu devir commit'i (öncesi `78af5e7`) · kod değişikliği yok · untracked `.claude/plan-backup-2026-09-29.json`, `.claude/worktrees/` (dokunma)
> Geçmiş: `.claude/handoffs/latest.md`

## Goal
Dean'in günlük öğün/seans/ölçümünü sohbetten `fit.evaitec.com` API'sine yazmak (skill `dean-pt`); kabul = uygulamada görünmesi.

## State (API GET kanıtlı, 8 Eki)
- **Hedef değişti (Dean onayı):** `/api/goals` → `weekly_loss_pct` 0.9 (≈0.96 kg/hafta), `kcal_week_max` 1700. Kural + fren listesi: `docs/PROGRAM-2026-09.md` § "Hız artışı — 8 Eki" (commit `78af5e7`). Adım tabanı 8.500. İlk değerlendirme **19 Eki Pazar**.
- daily 8 Eki: 106.6 kg; notes = BIA (yağ 36.7 kg, iskelet 35.0) + "bulantı bitti, 19:00 sonrası yemek yok, yalnız çay" + 7→8 Eki uyku parçalı ~5 sa (skor 19–36). OKOK `/api/wearable` source `okok` **yazılmadı** (7 Eki'de yazılmıştı).
- daily 7 Eki: adım 5377 (Samsung zip 8 Eki 09:17'den).
- Öğün 8 Eki: kahvaltı `1008a0e2-1008-4a11-9c00-000000000001` 08:19 42 g/700 (sucuklu yumurta) · öğle `…000000000002` 12:58 82 g/780 (tavuk ~180 g, kıymalı mercimek, ıspanak, yoğurt). akşam `…000000000003` 16:43 45 g/430 (palamut 5 halka, bütün balık <350 g → yenen ~180 g; + salata). Gün toplamı **169 g / 1910**.
- 7-gün kilo ort 2–8 Eki **107.16** (en düşük); son hafta −0.4 kg.

## Next
1. 9 Eki öğünleri: her kayıttan önce günü GET et; id deseni `1009a0e2-1009-4a11-9c00-00000000000N`. Hedef gün ~1.700 kcal, protein 150.
2. Cuma 9 Eki salon A: şablon 2×12 RIR 1–2 (3. set yalnız 2. set 15'i geçince) — **son sette RIR kaydı iste** (fren kuralı buna bağlı).
3. 8 Eki OKOK metriklerini `/api/wearable` source `okok`'a yaz (7 Eki örneğini GET edip kopyala).
4. Açık (7 Eki devrinden, doğrulanmadı): kataloğa `Jackknife_Sit-Up` (çakı) + `Bird_Dog`.

## Don't repeat
- İşlenmiş et (sucuk, pastırma) **≤1/hafta** (PROGRAM §3) — bu hafta 7+8 Eki ile aşıldı; Pazar'a kadar yok. "2/hafta" deme.
- "3. set ekle" deme — 2 Eki kanıta dayalı şablon 2×12; eksik yalnız RIR kaydı.
- `PUT /api/daily` gövdesinde `·` (U+00B7) Git Bash'te sessizce yazılmadı → ASCII ayraç `|` kullan, sonra GET ile doğrula.
- `PUT /api/goals` jsonb merge — yalnız değişen alanı gönder.
- Samsung importer dolu günü ezmez, seansları ikiler → `--dry-run` bak, eksik alanı elle PUT; uyku `com.samsung.shealth.sleep.*.csv` (başlık 2. satır, saat UTC +3).

- Balık porsiyonu: halka sayısından gram uydurma; palamut bu sezon bütün <350 g (Dean) → 5 halka ≈ 180 g yenen. Emin değilsen bütün balık ağırlığını sor.

## Verify
```
set -a; . ~/.ai/vg.env; set +a
curl -s -H "Authorization: Bearer $WELLNESS_API_TOKEN" "$WELLNESS_API_BASE/api/goals"   # kcal_week_max 1700, weekly_loss_pct 0.9
curl -s -H "Authorization: Bearer $WELLNESS_API_TOKEN" "$WELLNESS_API_BASE/api/meals?start=2026-10-08&end=2026-10-08"   # 42/700 + 82/780 + 45/430
```

## <yeniden başlangıç> promptu (yapıştır)
```
life-os-wellness, 8 Eki Perşembe. Kod yok; dean-pt ile API kayıtları. Dean hızı ~1 kg/hafta'ya çıkardı: goals kcal_week_max 1700, weekly_loss_pct 0.9, adım tabanı 8.500, fren kuralları PROGRAM-2026-09.md "Hız artışı — 8 Eki"; değerlendirme 19 Eki. Bugün tartı 106.6 (7-gün ort 107.16), üç öğün yazıldı, gün 169 g / 1910 kcal.
Önce HANDOFF.md oku, Verify'ı koş. Sıra: (1) 9 Eki öğünleri — önce GET (2) Cuma salon A, son sette RIR iste (3) 8 Eki OKOK wearable.
Yeni iş açma. İşlenmiş et bu hafta doldu.
```
