# Handoff: 7 Eki Çarşamba koçluk — seans + ölçüm yazıldı

> 2026-10-07 14:10 · `dev` @ bu devir commit'i (öncesi `def1924`) · kod değişikliği yok, yalnız API kayıtları · untracked `.claude/plan-backup-2026-09-29.json`, `.claude/worktrees/` (dokunma)
> Geçmiş: `.claude/handoffs/latest.md` (en yeni bölüm en altta)

## Goal
Dean'in günlük öğün/seans/ölçümünü sohbetten `fit.evaitec.com` API'sine yazmak (skill `dean-pt`); kabul = uygulamada görünmesi. Ürün planı: `docs/PLAN-GERCEKCI.md` §7.6, persona `wellness-pi`.

## State (API GET kanıtlı, 7 Eki)
- ZimaOS sabah kapalıydı (CF 1033) → `zima_wol.py` ile açıldı, API 200.
- daily 7 Eki: 107.35 kg + OKOK 10 metrik (`/api/wearable` source `okok`: yağ %34.6 / 37.2 kg, iskelet 35.1, visseral 25.5, bmr 2017.6).
- Kahvaltı `1007a0e2-1007-4a11-9c00-000000000001` 08:35 32 g / 520 kcal (lorlu yumurta + sucuk/pastırma + kaşar + domates; fotoğraf tahmini). Kalan ~118 g P (hedef 150).
- Salon B `1007a0e2-1007-4a11-9d00-000000000001` (12 set, 2×12): hip thrust 20 kg (**ayak platformu daha dik ayar** — 30 Eyl 30 kg ile kıyaslanmaz; sonraki 22.5), `Hyperextensions_Back_Extensions` vücut ağırlığı (RDL yerine 45° sırt uzatma), Leverage_Iso_Row 45, Smith bench hafif eğimli 25 (iki taraf plaka, bar hariç), Pallof 15 kg her yöne 2×12. Süre `duration_min` null — Dean'den bekleniyor.
- Samsung zip (6 Eki 21:43 dışa aktarım): yürüyüş 6 Eki 08:43 30 dk 2.54 km + 19:37 26 dk 1.86 km, 5 Eki 17:39 17 dk → `type: walk` POST. Uyku 6 Eki (gece 23:00–07:56): `sleep_min` 428, awake 108, deep 85, rem 122 (`sleep_stage` csv'den; importer uyku/yürüyüş OKUMUYOR). 6→7 Eki uykusu zip'te yok.

## Next
1. Dean seans süresini söyleyince: GET seans → aynı id ile `duration_min` güncelle (`sets` alanını GÖNDERME).
2. Akşam öğünü: önce `GET /api/meals?start=2026-10-07&end=2026-10-07`, sonra POST id `1007a0e2-1007-4a11-9c00-000000000003`, `time` 19:00 (öğle yazıldı).
3. Kataloğa `Hyperextensions_Back_Extensions` (Türkçe: 45° sırt uzatma) ve `Bird_Dog` ekle — katalog 47 hareket, ikisi yok.
4. Açık (önceki devirden): Dean telefon/saat 0.41 kontrol listesi; ota.evaitec.com hız teyidi.

## Don't repeat
- Dean'in kısa mesajında sayıyı harekete bağla: "row 2 rampa ve 45 2x12" = row 45 kg (45° hareketi değil). Ağırlık söylemediyse önerilen değeri yazma, sor.
- Smith/plakalı aletlerde kg = iki taraf plaka toplamı, bar hariç (notta belirt).
- `POST /api/workouts` `sets` verilirse TAM liste; GET → değiştir → aynı id POST.
- Samsung importer yalnız adım/kilo/TA okur; yürüyüş `exercise` csv (type 1001, saatler UTC, +3), uyku `sleep_stage` (40001 uyanık, 40002 hafif, 40003 derin, 40004 REM; tarih = uyanma günü).
- ZimaOS kapalı (1033/530) → WOL arka planda, sonra health poll.

## Verify
```
set -a; . ~/.ai/vg.env; set +a
curl -s -H "Authorization: Bearer $WELLNESS_API_TOKEN" "$WELLNESS_API_BASE/api/workouts?start=2026-10-07&end=2026-10-07"  # 1 resistance, 12 set
curl -s -H "Authorization: Bearer $WELLNESS_API_TOKEN" "$WELLNESS_API_BASE/api/meals?start=2026-10-07&end=2026-10-07"     # kahvaltı 32/520 + öğle 58/770
```

## <yeniden başlangıç> promptu (yapıştır)
```
life-os-wellness, 7 Eki Çarşamba. Bugün kod yok; dean-pt ile API kayıtları: tartı 107.35 + OKOK, kahvaltı 32 g/520, öğle bonfile 58 g/770, Salon B 12 set (hip thrust 20 dik ayar, sırt uzatma, row 45, Smith 25 plaka, Pallof 15), 5-6 Eki yürüyüşler + 6 Eki uyku Samsung zip'ten yazıldı.
Önce HANDOFF.md oku, Verify'ı koş. Sıra: (1) seans süresi gelince duration_min (sets gönderme) (2) akşam öğünü 19:00 — önce GET (3) kataloğa Hyperextensions_Back_Extensions + Bird_Dog.
Yeni iş açma. Dean'in ağırlığını sormadan önerilen değeri yazma.
```
