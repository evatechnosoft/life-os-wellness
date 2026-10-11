# Handoff: 11 Eki Pazar akşam — saat verisi akıyor, kopyalar geri döndü, BIA iki cihaz

> 2026-10-11 ~22:45 · `dev` @ bu devir commit'i (öncesi `b38efd4`) · untracked `.claude/plan-backup-2026-09-29.json`, `.claude/worktrees/` (dokunma)
> Öğleden önceki kök neden + kanıt zinciri: `.claude/handoffs/latest.md` § "11 Eki sabah" ve sonrası. Kod: PR #55/#56/#57, 0.42.0, bundle `4aa1a381` (sunucuda doğrulandı).

## Goal
Saat (Galaxy Watch6, **Fold 8**'e eşli) verisi Health Connect → Wellness → `fit.evaitec.com`'a kendiliğinden aksın; günlük öğün/seans/ölçüm kaydı (skill `dean-pt`).

## State (kanıtlı, API GET)
- **HC senkronu çalışıyor:** 15:28 ve 22:36'da iki senkron geldi. 11 Eki: adım 8060 (HC) → Samsung zip ile daily 9905, dinlenik nabız 64, uyku 436, 4 kısa yürüyüş (13–16 dk, ~20 kcal; `700fc872`/`0fc32cd4` ikisi 16 dk/22 kcal — kopya mı ayrı mı doğrulanmadı, start saati şemada yok).
- **Saat OTHER kopyaları 22:36 senkronunda GERİ GELDİ** (`24cb5fd6`, `cb751db6`) → yeniden DELETE 204, 5–7 Eki'de OTHER 0. Sunucu bundle'ı `4aa1a381` ama Fold'daki uygulama muhtemelen eski bundle'la senkron yaptı (doğrulanmadı) — ya da PR #57 kuralı bu iki kaydı tutmuyor. Kök neden açık.
- `total_kcal` (HC) 11 Eki 477 — diğer günler ~2500; gün içi kısmi mi HC eksik mi doğrulanmadı.
- **Öğün 11 Eki (5 kayıt): 120 g protein / 1615 kcal.** Akşam 19:00 kıymalı enginar + mantar + süzme dibi + az salata 27/535 (`…000000000002`), 20:56 whey + 200 ml süt 31/230 (`…0000000000e2`).
- **BIA — OKOK** 11 Eki 11 metrik yazıldı (107.0, yağ 36.9 kg/%34.5, iskelet 35.0, yağsız 70.06, visseral 25.5). **8/9/10 Eki OKOK değerleri birebir aynı = tek tartım** (Samsung zip'te 9–10 Eki tartım yok); daily kayıtları silinmedi.
- **BIA — saat (source `samsung`)** 8 Eki 07:59 ve 11 Eki 07:36: yağ 36.9→35.3 kg, iskelet 37.1→38.4, su 51.1→52.6, BMR 1876→1918. Zip `com.samsung.health.weight` CSV ile birebir teyitli. 3 günde +1.3 kg kas = su; iki cihaz zıt yön → gürültü. **Karar: gidişat yalnız OKOK, aylık.**
- **Gidişat (haftalık ort. kilo):** 107.87 → 107.69 → 107.41 → 106.86. Yağ (OKOK) 12 Eyl 38.2 → 36.9 kg, iskelet 35.3 → 35.0 (korunuyor). Son hafta protein 169 g (hedef 150), kcal 1878 (hedef 1700), adım ~6200 (hedef 8500).
- Samsung zip 22:35 `--from 2026-10-08 --no-workouts` içe aktarıldı (scratchpad `sh1011b/`).

## Next
1. **Kopya kök nedeni:** Fold'da Wellness kapat-aç → sonraki senkrondan sonra `GET /api/workouts?start=2026-10-05&end=2026-10-07`; OTHER yine gelirse bundle değil kural sorunu → `watchSessionType`/elle-salon eşleşmesini test et (5 ve 7 Eki elle salon `1005a0e2`, `1007a0e2` var).
2. **12 Eki sabah:** OKOK tartım (aç, tuvalet sonrası) + **bel ölçüsü** (son 28 Eyl 117) + yeni OKOK satırı oluştu mu.
3. Dean onaylarsa: (a) `ops/import_samsung.mjs` weight CSV'den `body_fat_mass`, `skeletal_muscle_mass`, `total_body_water`, `basal_metabolic_rate` → source `samsung`; (b) HC'den BodyFat/LeanBodyMass okuma (native → APK).
4. Bekleyen: evaitecOTA 0.1.23 denemesi → release; ZimaOS `ops/cloudflared/config.yml` canlı edit commit edilmeli.

## Don't repeat
- Gidişatı iki BIA cihazını karıştırarak okuma; saat ölçümü ek bilgi.
- OKOK'ta Samsung'a düşmeyen tartım = önceki ölçümün tekrarı olabilir; ondalığa kadar aynıysa kopya say.
- Uygulama vücut kompozisyonunu yalnız `source==='okok'` gösterir (`apps/web/src/lib/body.ts:46`); HC senkronu BodyFat okumaz.
- Sunucudan silinen saat seansı yeni senkronda geri gelir; kalıcı düşürme telefonda `dismissed_workouts` ya da kodda kural.
- Git Bash POST gövdesinde Türkçe karakter → 400; ASCII not. Zip açmak için PowerShell `Expand-Archive`; import'a göreli yol ver.
- Fold adb'de görünmüyorsa (`adb mdns services` yalnız Mi Box) senkronu buradan tetikleme; Dean uygulamayı açsın.

## Verify
```
set -a; . ~/.ai/vg.env; set +a; H="Authorization: Bearer $WELLNESS_API_TOKEN"; B=$WELLNESS_API_BASE
curl -s -H "$H" "$B/api/workouts?start=2026-10-05&end=2026-10-07" | grep -c OTHER   # 0 olmalı
curl -s -H "$H" "$B/api/wearable?start=2026-10-11&end=2026-10-11" | grep -o '"source":"[a-z_]*"' | sort | uniq -c
curl -s https://fit.evaitec.com/bundle/bundle.json | grep version   # 4aa1a3812e4ae51c
```

## <yeniden başlangıç> promptu (yapıştır)
```
life-os-wellness, 12 Eki Pzt. Önce HANDOFF.md oku, Verify'ı koş.
Sıra: (1) 5–7 Eki saat OTHER kopyası döndü mü — döndüyse kök neden (bundle mı kural mı) (2) sabah OKOK + bel ölçüsü kaydı, dean-pt (3) Dean onayıyla import_samsung BIA alanları.
```
