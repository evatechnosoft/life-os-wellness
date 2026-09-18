# Handoff: Diyet katmanı çekirdeği dev'de (PLAN-DIET adım 1–5)

> 2026-09-17 20:45 · `dev` @ `b475548`, origin ile eşit · kirli: yalnız izlenmeyen `.claude/handoffs/*`

## Hedef

Dean "proje kontrolü + PM durumu" istedi, ardından PLAN-DIET §6'daki üç açık kararı
kapattı ve "nasıl uygunsa yap bitir" dedi. İki PR kapandı; sırada UI PR'ı var.

## Durum (doğrulanmış — komut çıktısıyla)

- PR #4 (`74b2ce6`): üç karar plana + AGENTS.md'ye işlendi.
  - `nudge` **adaptif**: taban `soft`, telafi günü `push`, ertesi gün `soft`; elle seçim adaptifi kapatır.
  - Serbest öğün Cmt akşam, plan üretim günü Paz akşam.
  - Besin kaynağı **hibrit**: barkod→OFF, Türk yemeği→TürKomp, jenerik→USDA, kalanı LLM. 10 barkodluk isabet testi artık kapı değil.
  - AGENTS.md'deki "kalori/besin veritabanı kapsam dışı" satırı S6 ile değişti; kalori **hedefi** yok kuralı korundu.
- PR #5 (`f07b8e4`): plan §3 adım 1–5.
  - `db/005_diet_layer.sql` (meal tablosu + `overate`/`veg_servings`/`waist_cm`) — `npm run db:migrate` → `applied 005_diet_layer.sql`.
  - `/api/meals` GET+POST(idempotent)+DELETE, export'a `meal`.
  - Dexie v6, `queueMeal`/`queueMealDelete`, `pullRange` öğün çeker (yerel fotoğrafı ezmez).
  - `lib/lapse.ts` (3 tetik + `nudgeFor`), `lib/dietBreak.ts`, `nutrition.ts › suggestMenus`.
  - `npm test` → api 50/50, web 257/257. `npm run typecheck --workspaces` temiz.
  - coverage: lapse/dietBreak/nutrition stmt+line+func %100, branch %93 (kalan: savunmacı `??` dalları).
- `@vitest/coverage-v8` devDependency eklendi (apps/web), `coverage/` gitignore'da.
- Postgres `life-os-wellness-db-1` ayakta, 5433; API testleri DATABASE_URL olmadan atlanıyor.

## Don't repeat

- API testine yeni test eklerken **`describe('api')` bloğunun içine** koy: dosyanın
  sonuna eklemek `rate limit` bloğuna düşürür, oradaki tükenmiş pencere 429 döndürür.
- `wipeFixtures` listesine yeni tablo eklemeden önce migration'ı koştur; tablo yoksa
  `before` hook'u patlar ve TÜM api testleri "cancelled" görünür (asıl neden gizlenir).
- Tohum listesi her slotu doldurduğu için `suggestMenus` "veri yoksa boş döner" testi
  yazılamaz — boş dönüş yalnız aday listesi boşken olur, o da pratikte olmuyor.
- Kalori hedefi / "kalan kalori" sayacı önerme (kilit). Telafi = kısıtlama değil.

- PR #6 (`b475548`): plan §3 adım 6–9 — ekranlar. Yeni `ui/Diet.tsx` (telafi + mola kartı),
  Meals (abarttım / açlık / 3 set), Today (+1 sebze, bel), Week (bel, sebze ort., 8+ açlık),
  Settings (nudge, serbest öğün günü, bel günü), persona iki kural, offline "abarttım" dalı,
  COACH-EVIDENCE §9 + COACH-PERSONA §5.10.
  `npm test` → api 53/53, web 282/282; `npm run build -w @wellness/web` başarılı.

## Next (tek adım)

PLAN-DIET'te kod bekleyen: **S7** (kiler + haftalık plan + zar + serbest öğün,
`feature/diet-layer-plan` + `db/006_pantry.sql`), **S6 katman 2–4** (OFF barkod, USDA
proxy, TürKomp CSV), **S8** (profil/mutfak, `/api/lookup`), **S9** (destekler, `db/007`).

**Doğrulanmadı / Dean'e kalan:** 60 sn ölçümü gerçek telefonda kronometreyle; ekranların
görsel doğrulaması (derleniyor, cihazda bakılmadı); bel için haftalık yerel bildirim
(Capacitor `on: { weekday }` gün numaralandırması cihazda doğrulanmalı).

## Verify

```bash
git log --oneline -1                    # f07b8e4 feat(diet): ... (#5)
npm test                                # api 50/50, web 257/257
ls db/005_diet_layer.sql apps/web/src/lib/lapse.ts apps/web/src/lib/dietBreak.ts
```
