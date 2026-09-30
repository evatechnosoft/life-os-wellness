# Handoff: 30 Eyl kapanış — sunucu ZimaOS'ta canlı, gün kayıtları tam

> 2026-09-30 akşam · `dev` @ `6b277d2`+ · test 419/419 · fit.evaitec.com health 200 (ZimaOS'tan)
> Ayrıntı ve geçmiş: `.claude/handoffs/latest.md` (en yeni bölüm en altta)

## Goal
1. Dean'in günlük öğün/seans/ölçümü sohbetten API'ye — kabul = telefonda görünür.
2. Sunucu ZimaOS'ta — kalan: OTA kopyası + publish_ota ZimaOS'a.
3. Sıradaki kod işi `feature/protokol` (`docs/PLAN-PROTOKOL.md`, hedef Pzt 5 Eki).

## State (API GET kanıtlı)
- **30 Eyl öğünler (5 kayıt, 158 g P / 2320 kcal, hepsi tahmini porsiyon):** 08:45 kahvaltı 34/520 ·
  10:45 whey suyla 24/120 (Dean: 24 g) · 11:50 öğle T-bone 62/720 · 17:00 akşam kıymalı nohut+karnabahar+yeşil 35/710 ·
  19:00 meyve şeftali/armut/ananas/üzüm 3/250 (miktar varsayım). Gece shake YOK (Dean sordu, içmedi — yazma).
- Daily 30 Eyl: 107.4 kg, 127/77, adım 6361 (Samsung zip 17:35, elle PUT). Seanslar 3 (B 59 dk, bisiklet 12, havuz 10), Samsung seansları yazılmadı.
- `ops/import_samsung.mjs`: kilo CSV opsiyonel + `--no-workouts` (dev `b8b1e08`).
- compose: `POSTGRES_PASSWORD`/`DB_BIND`/`NET_SUBNET` .env'den (dev). ZimaOS'ta api LLM (yz-litellm) erişimi 200.

## Next
1. **Sunucu ZimaOS'ta canlı** (30 Eyl ~21:10; hafıza `sunucu-zimaos`): satır sayıları eşit, fit.evaitec.com health/plan/bundle 200.
   PC api/db/tunnel durdu (restart=no, volume yedek, 7 Eki'ye kadar silme); PC watchdog DISABLED.
   Açık: `ota/` kopyası arka planda sürüyordu (4.9 GB, ~2 MB/s) → `ssh zima du -sh .../ota` 4.9G mi bak; eksikse `tar -cf - ota | ssh zima tar -xf - -C /DATA/AppData/life-os-wellness`.
   Açık: `ops/publish_ota.mjs` hâlâ PC `./ota`'ya yazıyor → ZimaOS'a scp eklenmeli. Deploy = PC build + docker save/load (ZimaOS npm ETIMEDOUT).
2. Meyve 19:00 düzeltildi (2 g / 160 kcal) → gün 157 g / 2230 kcal.
3. `feature/protokol` TDD (`apps/api/src/protocol.ts`). Açık teyit: başlangıç 107.5 / bel 117 / %34.8.

## Don't repeat
- "Yedim/içtim" = aynı turda POST + GET; "yapalım mı" = yazma (hafıza `yendi-dendi-an-yaz`). Gün toplamında kayıt listesini göster.
- Samsung zip: `--from <gün> --no-workouts`, adımı elle PUT (daily yalnız boş alanı doldurur). Zip'i PowerShell `Expand-Archive` ile aç.
- PC tünelini/watchdog'u AÇMA — iki tünel = veri iki DB'ye bölünür. API artık yalnız https://fit.evaitec.com (PC 127.0.0.1:3011 kapalı).
- 530'da süreç anlatma: `ssh zima` → `docker compose ps` / tünel logu; tünel kimliği sahibi 65532 olmalı.

## Verify
git log --oneline -1                                   # devir commit
curl -s -o /dev/null -w "%{http_code}" https://fit.evaitec.com/health   # 200
ssh -o ConnectTimeout=5 zima true && echo zima-up      # açık mı
