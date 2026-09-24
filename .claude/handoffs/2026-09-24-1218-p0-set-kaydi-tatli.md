# Handoff: P0 yayında (0.32.0) · set kaydı · shake/dondurma sayfası

> 2026-09-24 12:18 · `dev` @ `f3d497b` · tag `v0.32.0` · plan: `docs/PLAN-GERCEKCI.md`

## Goal
Uygulamayı gerçek kullanımda işe yarar yapmak (uzman persona + P0–P3 planı, Dean onayladı 24 Eyl:
"seans ezme hatası ve diğer işlemlere onaylısın") + Dean'in günlük koçluk akışı.

## State — doğrulanmış
- `docs/PLAN-GERCEKCI.md` (persona, canlı veri teşhisi, P0–P3, §5b durum).
- P0.0 `be86afe`: `isAnswered()` (`lib/watchExercise.ts`) — onaylı seansı `syncHealth` artık ezmiyor.
- P0.2 `00382ce`: başlık rozeti `lib/syncStatus.ts` (saat verisi >24 sa / outbox reddi; dokununca neden).
- P0.1 `989c135`: `lib/sessionLog.ts` + `ui/SessionLog.tsx` — plan `lift` günü Bugün'de hareket bazlı set kartı,
  son seanstan önden dolu, ✓ ile `sets[]` POST; saatin aynı gün direnç seansı varsa ona yazar.
- 372/372 test, typecheck, web build temiz. CI 35973276444 success; OTA katalog 0.32.0 (3200);
  `fit.evaitec.com/ota/wellness-0.32.0.apk` 200. Wear APK 0.32.0 sertifikası 0.31 ile aynı (`b722…`); ≤0.25 `d782…`.
- `tools/secici/tatli.html` (`f3d497b`) canlı: fit.evaitec.com/plan/tatli.html — 18 tarif, arama, kur, stevia/eritritol.
- Barilla tam buğday penne barkodu `8690579975032` katalogda (`0581d9a`).
- 24 Eyl API: kilo 107.5 · TA 132/80 (07:40 128/78 + 08:30 135/82 ort.) · adım 3726 (arşiv, 10:36) ·
  uyku 354 dk (manual) · yürüyüş 22 dk 2189 adım · öğün 2: kahvaltı 580/30, öğle 880/58 → 1460 kcal / 88 g.
  OKOK 8 gün kompozisyon yazıldı (yağ 37.2 kg, iskelet kası 35.2). 23 Eyl düzeltildi: kilo 107.9, adım 9579.

## Believed / doğrulanmadı
- 0.32.0 telefonda kurulu (Dean "güncelleme düzgün" dedi); rozet ve set kartı cihazda görülmedi.
- Saate bağlı ikinci telefona sunucu+token girildi mi — bilinmiyor. Health Connect 23 Eyl'den beri sunucuya yazmıyor.
- Saat uygulaması kurulmuyor: muhtemel neden eski sertifikalı sürüm (kaldır → evaitecOTA'dan kur) — Dean denemedi/bildirmedi.

## Decisions
- P0.3 (tek kaynak) ertelendi: adımda kural var; asıl sorun HC'nin yazmaması, rozet gösteriyor.
- Menemen/kabak tabağındaki sıvı yağ değil yemek suyu (Dean) — kahvaltı zeytinyağı 1 yk sayıldı.
- Tatlandırıcı: shake'te sıvı stevia, dondurmada pudra eritritol; bal/pekmez yok (TG 302, HbA1c 5.9).

## Don't repeat
- Python urllib → fit.evaitec.com 403 (Cloudflare); JSON'u dosyaya yaz, `curl --data-binary @` ile gönder.
- `npx vitest run` kökte ops/tools testlerini de alır ve düşer — `npm test` kullan.
- Edge headless dar pencerede sayfayı taşıyor gösteriyor (secici.html'de de) — araç kusuru, sayfa değil.
- `import_samsung.mjs` dolu günü ezmez, uyku okumaz.

## Next (tek adım)
25 Eyl Cum A′: Dean salonda Seans kartını kullansın; sonra `GET /api/workouts?start=2026-09-25&end=2026-09-25`
ile `sets` dolu mu bak (P0.1'in cihaz kanıtı). Öncesinde sabah tartı + 2 tansiyon kaydı.
Bekleyen: saate bağlı telefonda sunucu/token + HC senkronu kanıtı · saat uygulaması (kaldır-kur) ·
Pazartesi 28 Eyl karar kartı (7-gün kilo, bel, protokollü TA) · P1 (sohbet→onay kartı, retro kararı).
