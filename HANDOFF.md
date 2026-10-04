# Handoff: 4 Eki — keto yok, ② liste devam; Pzt A seansı

> 2026-10-04 16:30 · `dev` · dirty: `ops/cloudflared/config.yml` (CRM tüneli, commit ETME) + untracked `.claude/plan-backup-2026-09-29.json`, `.claude/worktrees/`
> Ayrıntı ve geçmiş: `.claude/handoffs/latest.md` (en yeni bölüm en altta)

## Goal
1. Dean'in günlük öğün/seans/ölçümünü sohbetten API'ye yaz; uygulamayla aynı veri.
2. 2–3 Eki canlıya çıkan PR'ların telefonda doğrulanması hâlâ açık (önceki devir, `latest.md` 3 Eki bölümleri).

## State (API GET kanıtlı)
- 4 Eki kapandı: 148 g protein / 1990 kcal, kilo 107.05. Öğün id'leri `1004a0e2-1004-4a11-9c00-00000000000{1..4}`.
- 7-gün ort 107.53 (önceki 107.64): plato ikinci hafta. Neden kalori, karb türü değil.
- Keto kararı verildi: ② dengeli liste devam, ① 5 gün keto YOK. Dean diyetisyene soracak, cevap bekleniyor.
- Plan: Pzt A · Sal kardiyo · Çar B · Per kardiyo · Cum A′ · Cmt/Paz dinlenme (GET /api/workout-plan, 2 set + ısınma).
- Kod/test: bu oturumda dokunulmadı; son yeşil 3 Eki (web 423, api 71).

## Next
1. Pzt 5 Eki "bugün ne var": `GET /api/workout-plan` weekday 1 + her hareket için `GET /api/exercise-sets?exercise_id=&limit=5`; salon öncesi süzme + yarım muz (dün ertelendi).
2. Diyetisyen cevabı gelirse: ① zorunluysa hafif haftaya koy, sonrası 2 kg su düşüşünü yağ sayma; PROGRAM-2026-09.md §4'e tarihli not.
3. Gelecek hafta 7-gün ort hâlâ 107.5 ise PROGRAM §6: adım, serbest gün taşması, tuz, uyku kontrolü — kalori hedefi 1900–1950'nin altına inme.
4. Önceki devirden açık: telefonda doğrulama + retro 2 Eki + "Haftayı kur" Plan sekmesi (Dean "yap" demedi).

## Don't repeat
- Keto/VLCKD önerme; karar verildi ve gerekçesi `latest.md` 4 Eki.
- Öğün POST'unda id çakıştırma; aynı id güncellemedir, önce GET.
- Porsiyon: Dean "tabak tabanına kadar" derse ~130 g, tahmini önce yaz sonra sor değil, sor sonra yaz.
- Dinlenme günü akşamı nişasta/muz önerme (§4 takas dili).
- `ops/cloudflared/config.yml` commit etme.

## Verify
```
git rev-parse --short HEAD
curl -s -o /dev/null -w "%{http_code}" https://fit.evaitec.com/health      # 200 (00:00–10:00 ZimaOS kapalı olabilir)
set -a; . ~/.ai/vg.env; set +a; curl -s -H "Authorization: Bearer $WELLNESS_API_TOKEN" "$WELLNESS_API_BASE/api/meals?start=2026-10-04&end=2026-10-04"   # 4 kayıt, 148 g
```

## <yeniden başlangıç> promptu (yapıştır)
```
life-os-wellness, dev dalı. 4 Eki koçluk günü kapandı (148 g / 1990 kcal, 107.05 kg); keto reddedildi, ② dengeli liste devam. Kod değişikliği yok.
Önce HANDOFF.md oku, Verify bloğunu çalıştır, dean-pt skill'i yükle.
Sıra: (1) Pzt A seansı "bugün ne var" + geçen sefer değerleri (2) diyetisyen cevabı gelirse PROGRAM §4'e not (3) önceki devirdeki telefon doğrulaması.
Yeni iş açma. ops/cloudflared/config.yml commit etme.
```
