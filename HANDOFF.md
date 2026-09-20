# Handoff: hareket listesi mobilleşti, cihazda doğrulanmadı

> 2026-09-20 16:10 · `dev` @ `f273952` (origin/dev ile aynı) · çalışma ağacı temiz

## Goal
Dean "hareket bölümü mavili masaüstü web gibi duruyor" dedi. Liste görünümündeki iki
masaüstü kalıbı (sol sabit bölge sütunu, native `<select>`) mobil çip şeridine çevrildi.
Sıradaki büyük iş değişmedi: kardiyo yükü hesabı — `docs/PLAN-WEAR.md` §8.

## State
- `f273952` feat(ui): `apps/web/src/ui/Exercises.tsx` liste görünümü yeniden yazıldı —
  tam genişlik pill arama, yatay kaydırılan bölge + alet çip şeritleri (mevcut `Chip`),
  56 px küpür, chevron. Detay kartı (`Exercise.tsx`) **dokunulmadı**.
- `npm run typecheck --workspaces` çıktısız · `npm test` 345 pass / 21 dosya.
- **Doğrulanmadı:** Dean'in gördüğü ekran görüntüsü hâlâ ESKİ sürümü gösteriyordu
  (sol sütun + açılır menü). Hangi istemciye baktığı sorulmuştu, cevap gelmeden oturum
  bitti: telefondaki APK mı (v0.20.0, bu değişiklik içinde yok) yoksa dev sunucusu mu.
- APK sürümü `apps/web/android/variables.gradle` → `0.20.0`; bu UI değişikliği hiçbir
  APK'de değil.

## Next
1. Dean'e sor: hareket ekranına **telefondaki APK'den mi** yoksa **dev sunucusundan mı**
   bakıyor. APK ise → `variables.gradle` 0.21.0, `node ops/build_apk.mjs`,
   sonra `node ops/publish_ota.mjs` (Dean "ekle" derse sorma, yayınla).
   Dev sunucusu ise → hard-refresh / service worker temizliği yeter.
2. Cihazda göründükten sonra UX geri bildirimini al; `Exercise.tsx` detay kartında da
   masaüstü duran bir şey varsa oraya geç.
3. Asıl kuyruk: `apps/web/src/lib/cardioLoad.ts` TDD ile (`zoneOf`, `trimpFromSeries`,
   `trimpFromSession`, `acuteChronicRatio`) — sözleşme `docs/PLAN-WEAR.md` §8.3.

## Don't repeat
- Native `<select>` hareket filtresinde kullanma — masaüstü açılır menüsü açıyor,
  Dean'in "mavili masaüstü" şikâyetinin kaynağı buydu.
- Ekran görüntüsü eski çıktığında önce istemciyi sor: kod doğruysa sorun önbellek/derleme,
  kodu tekrar değiştirme.
- Önceki oturumların ölü yolları (yüzmede nabız, Watch6 Fitness Index, Reddit erişimi,
  `vite preview` https, aurora glow yükseklik ölçümü) → `.claude/handoffs/latest.md`
  ve `2026-09-19-2230-kardiyo-yuku-sirada.md`. Yeniden araştırma açma.

## Read first
1. `apps/web/src/ui/Exercises.tsx` — değişen dosya
2. `~/.ai/guides/evaitec-ota-catalog.md` — APK yayını gerekirse tek kaynak
3. `docs/PLAN-WEAR.md` §8 — Next #3'ün sözleşmesi
4. `AGENTS.md` — kilitli kararlar

## Verify
```bash
git rev-parse --short HEAD              # f273952
git status --porcelain | wc -l          # 0
grep -c "overflow-x-auto" apps/web/src/ui/Exercises.tsx   # 2 (çip şeritleri)
npm test                                # 345 pass
```

## Yeniden başlangıç promptu (yapıştır)

```
life-os-wellness (D:\projects\evaitec\lifeOS\life-os-wellness), dal dev @ f273952, ağaç temiz,
origin ile aynı. Dün akşam hareket (Exercises) liste görünümü masaüstü kalıplarından
temizlendi: sol sabit bölge sütunu ve native select gitti, yerine yatay çip şeritleri +
pill arama + 56px küpürlü satırlar geldi. typecheck temiz, 345 test yeşil. AMA Dean'in
baktığı ekran hâlâ eski sürümü gösteriyordu — telefondaki APK (v0.20.0, değişiklik içinde
yok) mi dev sunucusu mu olduğu sorulmuştu, cevap gelmedi.

Önce HANDOFF.md'yi oku ve Verify bloğunu çalıştır.
Next #1: Dean'e hangi istemciye baktığını sor. APK ise sürümü 0.21.0'a çek,
ops/build_apk.mjs + ops/publish_ota.mjs ile OTA'ya koy.
Yeni iş açma — kardiyo yükü (PLAN-WEAR §8) sırada ama önce bu ekran cihazda görünsün.
```
