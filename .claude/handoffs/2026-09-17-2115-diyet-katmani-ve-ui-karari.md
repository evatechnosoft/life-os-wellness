# Handoff: Diyet katmanı yayında (v0.18.0), sırada Ayar ekranı yeniden düzeni

> 2026-09-17 21:15 · `dev` @ `216c9d3`, origin ile eşit · kirli: yalnız izlenmeyen `.claude/handoffs/*`
> Önceki devir: `2026-09-17-1956-diyet-katmani-cekirdek.md` (PR #4/#5 detayı orada).

## Bugün kapananlar (doğrulanmış)

- PR #4 `74b2ce6` — üç diyet kararı plana + AGENTS.md'ye.
- PR #5 `f07b8e4` — diyet katmanı çekirdeği (db/005, /api/meals, lapse.ts, dietBreak.ts, suggestMenus).
- PR #6 `b475548` — ekranlar (Diet.tsx, Meals/Today/Week/Settings, persona kuralları, COACH-EVIDENCE §9).
- PR #7 `107f6d9` — `docs/assets/` (gitignore'lu; repo PUBLIC, fotoğraflar git'e girmiyor). `docs/img/` izlenir.
- PR #8 `9beecd1` + tag `v0.18.0` — APK koşusu success; release'de `wellness-0.18.0.apk`,
  `wellness-wear-0.18.0.apk`, `latest.json` (evaitecOTA kataloğu, versionCode 1800).
- PR #9 `216c9d3` — `docs/PLAN-UI.md`: Ayar ekranı yeniden düzeni planı.
- API Docker'da yeniden derlendi: `docker compose up -d --build api` → `/api/meals` artık 200 (önce 404).

`npm test` → api 53/53, web 282/282 · `typecheck` temiz · `npm run build -w @wellness/web` başarılı.

## Açık kararlar ve kilitler

- **Kit kararı (Dean, 17 Eyl): "kit al ama renkler bizden" → Radix Primitives.**
  Davranış + erişilebilirlik kitten, görünüm `evaglass.tokens.json` (aurora · wash · graffiti).
  Stil getiren kitler (shadcn/Preline/FlyonUI/TailGrids/Ionic) elendi. Her paket PR'da ayrı gerekçeli.
- Mock (önce/sonra, üç tema geçişli): https://claude.ai/code/artifact/d8da63cc-81d5-4013-a21c-a079b9fc7158
  Kaynağı: `<scratchpad>/ayar-mock.html`. İlk sürümü "çirkin" bulundu — sebep: evaglass dışı palet.
  Kural: mock da uygulama da evaglass tokenlarından çizilir.

## Çözülmemiş — telefon senkronu

Telefon "çevrimiçi" gösteriyor ama sunucuda **16–17 Eylül kaydı yok** (`/api/daily` boş,
`/api/meals` boş; son kayıt 2026-09-15). Kuyruk boşsa yazmalar 2xx almış demektir → başka
bir uca yazıyor olabilir (tünel adresi değişmiş olabilir; `wellness-tunnel` konteyneri ayakta).
**Sonraki adım:** Dean'den Ayar → Sunucu adresini al, oradan devam.

Telefondaki sürüm de eski: ekranda görünen "Sunucu bağlı değil, sorunu yanıtlayamıyorum"
metni dev kodunda yok. v0.18.0 kurulumu bunu da çözmeli.

## Next (tek adım)

`feature/ui-settings`: `npm i @radix-ui/react-accordion` + evaglass sarmalayıcısı
(`ui/Section.tsx`, `ui/Row.tsx`), Ayar'ın üç bölgeye ayrılması (Günlük ayarlar açık,
Cihazlar ve Veri kapalı), web'de cihaz bölgesinin hiç çizilmemesi (`isNative()`),
katlama durumunun `db.settings.ui_sections`'ta saklanması. Kabul kriterleri PLAN-UI §6.

## Don't repeat

- Mock/UI'da evaglass dışı palet kullanma; tokenlar `D:/projects/evaglass/design/tokens/evaglass.tokens.json`.
- Public repoya fotoğraf/banka/sağlık ekranı commit etme — `docs/assets/` gitignore'lu, sebebi bu.
- API bu makinede **Docker'da** koşuyor; kod değişince restart yetmez, `--build` gerekir.
- Bash tool'a giden python heredoc'ta `\b` gibi kaçışlar bozuluyor → raw string (`r"..."`) kullan.

## Verify

```bash
git log --oneline -1                 # 216c9d3 docs(ui): ... (#9)
curl -s localhost:3011/health        # {"ok":true}
gh release view v0.18.0 --json assets -q '.assets[].name'
```
