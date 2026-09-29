# PLAN — Protokol takibi sunucuda (30 Eyl 2026)

Kaynak: `docs/PROTOKOL-12-HAFTA.md`. Amaç: 12 haftalık protokolün durumunu **tek yerde** (API) hesaplamak;
uygulama, `fit.evaitec.com/plan/` ve koç sohbeti aynı sonucu okusun. Dean'in isteği: "gelişimi takip edeceğim,
scriptler uygulamaya entegre, bildirimler buradan ve uygulamadan, server side, uygulama ve site direkt göreyim".

## Scope Lock

Değişir: `apps/api` (+1 endpoint, +1 migration), `tools/secici/secici.html` Hafta (+1 kart, İLK teslim), `apps/web` Hafta sekmesi (+1 kart, +1 bildirim). Sıra: API → site kartı (Dean hemen görür) → uygulama kartı → Dean "tamam" deyince site kartı kalkar (Dean, 30 Eyl gece).
Değişmez: öğün/seans/ölçüm akışı, persona, offline-first (kart sunucu yokken "veri yok" der, uygulama çalışmaya devam eder).

## Veri

`db/00X_protocol.sql` — tek satır `protocol`:
`start_date 2026-09-30 · start_weight 107.5 · start_waist 117 · start_fat_pct 34.8 · kcal_lo 1900 · kcal_hi 1950 · protein_lo 150 · protein_hi 165 · weeks 12`.
Ayar `PUT /api/protocol` (Dean/koç), silme yok.

## Hesap — `GET /api/protocol/status` (saf fonksiyon `apps/api/src/protocol.ts`, TDD)

Girdi: protocol satırı + daily_log (kilo, bel, adım) + meal (kcal, protein) + workout setleri, son 28 gün.
Çıktı:
- `week` (1–12), `phase` (`deficit` | `maintenance_break` | `done`)
- `weight_avg7`, `weight_delta_total`, `rate_per_week` (son 14 günün 7-gün ortalamaları farkı)
- `expected_band` haftaya göre (hafta 4: −2.5…−4; 8: ~−6.5; 12: −8…−10)
- `kcal_avg7`, `protein_avg7`, `steps_avg7`, `waist_last`, `strength_trend` (aynı hareket son 3 seans ağırlık×tekrar)
- `verdict`: `on_track` | `too_slow` (<0.4 kg/hafta, kayıt tam) | `too_fast` (>1.1 ya da kuvvet düşüyor) | `plateau` (3 hafta yatay) | `no_data`
- `action`: kural metni (`−100 kcal`, `+100–150 kcal`, `1 hafta bakım 2500`, `bakım hesabı 2400'e`) — ayar OTOMATİK UYGULANMAZ, önerilir.
- `checkpoint`: bir sonraki kontrol tarihi (27 Eki / 24 Kas / 22 Ara) ve o gün istenenler (foto, bel, BIA, tahlil).

## Görünürlük

- **Uygulama** Hafta sekmesi: "Protokol · hafta N" kartı (mevcut `ui/Body.tsx` yanına `ui/Protocol.tsx`): 7-gün ort, beklenen bant, verdict rengi, action, checkpoint. Sunucu yoksa son başarılı yanıt IndexedDB `settings.protocol_status`'tan.
- **Site** `secici.html` Hafta: `GET /api/protocol/status/public` (token'sız, salt-okunur, yalnız özet: hafta, 7-gün ort, delta, verdict, action, checkpoint — öğün/seans yok) fetch eden kart. Geçici: uygulama kartı kabul edilince kaldırılır.
- **Koç sohbeti**: `dean-pt` skill'i her oturum başında `GET /api/protocol/status` okur, verdict'i söyler.

## Bildirim

- Uygulama: `reminders.ts`'e `protocol` id 4 — checkpoint sabahı 09:00 (foto/bel/BIA hatırlat) + verdict `too_slow/too_fast/plateau` olduğunda haftada 1 (Pazartesi 09:00). "Geç" desteği aynen.
- Sunucu tarafı push YOK (kilitli karar: tek kullanıcı, push altyapısı yok); uygulama açılışta endpoint'i okur, bildirim yerelde kurulur.

## Self-Test

`apps/api/test/protocol.test.ts`: hafta hesabı, verdict eşikleri (0.39/0.4/1.1/1.2 kg), plato 3 hafta, no_data, checkpoint tarihleri. Web: `Protocol.tsx` render + reminders id 4 testi. `npm test` + typecheck yeşil, canlı `GET /api/protocol/status` 200 + JSON.

## Adversarial

- Kilo kaydı eksik hafta → rate hesabı `null`, verdict `no_data`; asla "too_slow" deme.
- Su düşüşü (ilk 2 hafta) → hafta ≤2'de `too_fast` verilmez.
- Kuvvet trendi: yalnız aynı hareket ve aynı tekrar aralığı kıyaslanır.
- Diyetisyen değişikliği → protocol satırı PUT ile güncellenir, eski değer notes'ta.

## Kararlar

1. Site kartı VAR ve ilk teslim; token'sız salt-okunur özet endpoint kabul (Dean, 30 Eyl gece: "kaldırma, koymadan uygulamaya görebiliyorum").
2. Açık: başlangıç 30 Eyl 107.5 kg / bel 117 / %34.8 doğru mu? (Dean teyidi)
