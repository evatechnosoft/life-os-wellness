# Handoff: 30 Eyl kapanış — gün kayıtları tam, ZimaOS taşıma hazırlıkta (ZimaOS kapalı)

> 2026-09-30 akşam · `dev` @ `21449c9`+devir commit · test 419/419 · fit.evaitec.com health 200 (PC'de)
> Ayrıntı ve geçmiş: `.claude/handoffs/latest.md` (en yeni bölüm en altta)

## Goal
1. Dean'in günlük öğün/seans/ölçümü sohbetten API'ye — kabul = telefonda görünür.
2. Sunucuyu PC/Docker Desktop'tan ZimaOS'a taşı (Dean kararı 30 Eyl; cutover yalnız Dean "geç" deyince).
3. Sıradaki kod işi `feature/protokol` (`docs/PLAN-PROTOKOL.md`, hedef Pzt 5 Eki).

## State (API GET kanıtlı)
- **30 Eyl öğünler (5 kayıt, 158 g P / 2320 kcal, hepsi tahmini porsiyon):** 08:45 kahvaltı 34/520 ·
  10:45 whey suyla 24/120 (Dean: 24 g) · 11:50 öğle T-bone 62/720 · 17:00 akşam kıymalı nohut+karnabahar+yeşil 35/710 ·
  19:00 meyve şeftali/armut/ananas/üzüm 3/250 (miktar varsayım). Gece shake YOK (Dean sordu, içmedi — yazma).
- Daily 30 Eyl: 107.4 kg, 127/77, adım 6361 (Samsung zip 17:35, elle PUT). Seanslar 3 (B 59 dk, bisiklet 12, havuz 10), Samsung seansları yazılmadı.
- `ops/import_samsung.mjs`: kilo CSV opsiyonel + `--no-workouts` (dev `b8b1e08`).
- Docker watchdog zamanlanmış görev KURULU (5 dk, Last Result 0).
- ZimaOS: `chore/zimaos-tasima` `c822673` (lokal, push yok) — compose `POSTGRES_PASSWORD`/`DB_BIND` .env'den.
  **ZimaOS kapalı:** WOL 240 sn + SSH yoklaması 2 saat cevapsız → Dean elle açacak. Kapalıyken Eva'nın yz-litellm'i de yok.

## Next
1. Dean "zima açık" deyince: `ssh zima` → git/compose/port (3011, 5434) yokla → repo `/DATA/AppData/life-os-wellness`
   (public repo, clone kimliksiz) → `.env` scp chmod 600 (yeni hex parola, `DB_BIND=127.0.0.1:5434`, API_TOKEN, LLM key, CF creds)
   → `ota/` (4.9 GB) scp → `docker compose up -d --build db api` tünelsiz → `curl 192.168.1.186:3011/health`. "Hazır" de, bekle.
2. Cutover yalnız "geç" ile: PC tünel stop → `pg_dump -Fc` → restore → satır sayıları → ZimaOS tünel → health/ota/plan → PC api stop (silme).
3. `feature/protokol` TDD (`apps/api/src/protocol.ts`). Açık teyit: başlangıç 107.5 / bel 117 / %34.8.

## Don't repeat
- "Yedim/içtim" = aynı turda POST + GET; "yapalım mı" = yazma (hafıza `yendi-dendi-an-yaz`). Gün toplamında kayıt listesini göster.
- Samsung zip: `--from <gün> --no-workouts`, adımı elle PUT (daily yalnız boş alanı doldurur). Zip'i PowerShell `Expand-Archive` ile aç.
- Cutover öncesi iki tünel aynı anda açılmaz (veri iki DB'ye bölünür).
- Docker 530'da süreç anlatma; watchdog zaten 5 dk'da bir düzeltiyor.

## Verify
git log --oneline -1                                   # devir commit
curl -s -o /dev/null -w "%{http_code}" https://fit.evaitec.com/health   # 200
ssh -o ConnectTimeout=5 zima true && echo zima-up      # açık mı
