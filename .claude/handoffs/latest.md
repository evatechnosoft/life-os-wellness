# Handoff: Diyetisyen katmanı planı (PLAN-DIET)

> 2026-09-16 23:05 (güncellendi) · life-os-wellness `dev` @ 5284e0f · kirli: `docs/PLAN-DIET.md` (yeni, commit YOK), `?? .claude/`
> Önceki devir (HC zip manuel akış) ayrı konu, `2026-09-16-*-hc-zip-*.md`.

## Hedef

Dean "uzman diyetisyen gözüyle eksik sistemler + plan" istedi; web araştırması yapıldı,
plan `docs/PLAN-DIET.md` olarak yazıldı. Kod yazılmadı, sadece plan.

## Durum

Doğrulanmış:
- `docs/PLAN-DIET.md`: 10 sistem bölümü (S1–S5, S2b, S6–S9) + §5 kanıt (5.1–5.15) + §6 karar masası.
- OFF Türk kapsamı kısmen doğrulandı: `8691316520027` ve `8695077041067` (ayran) `status:1`, tuz 0.7–0.8 g/100 ml.
- Mevcut kod okundu: `nutrition.ts` (proteinTarget, slotGaps, suggestFoods, weightTrend),
  `meals.ts` (fotoğraf kcal/protein tahmini, `calories_in` metriği), `coach.ts`, `db.ts`.
  Sunucuda `meal` tablosu YOK (`db/*.sql`'de yalnız daily_log, workout, retro,
  wearable_sync, training_split); fotoğraf ve öğünler cihazda.
- OFF `search` uç noktası o an kapalıydı; kapsam ORANI ölçülmedi (10 gerçek barkod gerek).

Dean'in kapattığı kararlar (sohbette, sırayla):
1. kcal tahmini telafi tetiği KALIR (günün `calories_in` > 14-gün ortancasının %140'ı).
2. `meal` sunucuya çekilir; besin DB kilidi AÇILDI (OFF barkod → USDA → TürKomp CSV).
   AGENTS.md'deki "kalori/besin veritabanı kapsam dışı" satırı henüz güncellenmedi.
3. Öneri itici olsun: varsayılan seçili kart + gerekçe + meydan okuma + `nudge soft|push` (S2b).
5. S8 profil: mutfak ekipmanı (düdüklü, airfryer, mikro, fırın), yumuşak et kesimleri,
   basmati/bulgur/chia, zeytinyağı varsayılan, hindistan cevizi yağı önerilmez, fıstık
   ezmesi içerik kontrolü, sıvılarda sodyum etiketi, mikro besin %70 RDA uyarısı, `/api/lookup`.
6. S9 destekler: kreatin/L-karnitin/bromelain/pre-workout/protein tozu; etiket → mg/servis,
   alım kaydı → mg ve mg/kg, `nextDose` zamanlama; kafein için tansiyon kapısı (140/90),
   protein tozu `saveMeal` üzerinden (çift sayım yok).
4. Kiler + haftalık/aylık liste + eşdeğer değişim (±8 g) + zar (tohumlu) + haftada bir
   planlı "serbest öğün" (S7). "Cheat" kelimesi kullanılmaz, tam gün cheat day yok.

Açık kararlar (§6): `nudge` varsayılanı; serbest öğün slotu (varsayılan Cmt akşam) ve plan
üretim günü (varsayılan Paz akşam); OFF isabet testi (10 gerçek barkod, <%70 → TürKomp öne).

## Don't repeat

- Kalori HEDEFİ / "kalan kalori" sayacı önerme — rijit takip bedeli (§5.8), Dean da istemedi.
- Telafi = kısıtlama değil; "yarın az ye / öğün atla" üretme (persona §2.2 YB bayrağı).
- OFF `search` uç noktasına tekrar vurma, barkod `product/{ean}.json` çalışıyor.
- Bash heredoc içinde Python ile md yamalamak işe yaradı; JS için Write tool (önceki devir notu).

## Next (tek adım)

Dean onaylarsa `feature/diet-layer-core` dalı: `db/005_diet_layer.sql` (daily_log.overate,
veg_servings, waist_cm + `meal` tablosu + `/api/meals`), Dexie alanları, `lib/lapse.ts` +
`lib/dietBreak.ts` + `nutrition.ts › suggestMenus` TDD %100. Önce PLAN-DIET.md'yi commit'le
(dev'e doğrudan değil, dalda).

## Verify

```bash
git status --porcelain            # docs/PLAN-DIET.md ?? bekleniyor
grep -c "^### S" docs/PLAN-DIET.md   # 10
```
