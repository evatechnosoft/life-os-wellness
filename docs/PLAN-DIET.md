# PLAN-DIET — Diyetisyen katmanı: eksik sistemler ve icra planı

> 2026-09-16 · Kaynak kod: `apps/web/src/lib/nutrition.ts`, `coach.ts`, `meals.ts` ·
> Kanıt temeli: `docs/COACH-EVIDENCE.md` (§1–6) + bu dosyanın §5'i.
> Kilitler: kalori HEDEFİ yok (besin DB kilidi 16 Eyl açıldı, S6), karar birimi 7-gün ortalaması,
> giriş 60 sn altı, offline-first, tek kullanıcı.

## 0. Bugün ne var (tekrar yazılmaz)

| Var | Nerede |
|---|---|
| Protein hedefi 1.6–2.2 g/kg, 7-gün ortalama kilodan | `nutrition.ts › proteinTarget` |
| Slot açığı (sabah/öğle/akşam + 4. öğün) | `nutrition.ts › slotGaps` |
| Öğün önerisi: geçmişten 3 yiyecek + tohum listesi, tekrar cezası | `nutrition.ts › suggestFoods` |
| Kilo trendi: too_fast / too_slow / on_track, haftalık %1 tavanı | `nutrition.ts › weightTrend` |
| Fotoğraftan tahmini protein + kcal (onaylı), gün toplamı `calories_in` metriği | `meals.ts`, `store.ts › recordMetrics` |
| Antrenman hacmi, ilerleme, deload | `coach.ts` |
| Tansiyon, adım, uyku, nabız (saat) | `daily_log`, `wearable_sync` |
| Sağlık sınırı + yeme bozukluğu kırmızı bayrakları | `COACH-PERSONA.md` §2 |

Eksik olan, bir diyetisyenin haftalık görüşmede yaptığı üç şey: **(a)** "dün kaçtı,
bugün ne yapacağız" konuşması, **(b)** tek liste yerine seçenek setleri, **(c)** kilo
dışı göstergeler (bel, lif/sebze, açlık farkındalığı) ve uzun açıkta **diyet molası**.

## 1. Scope Lock

**Değişir:** `apps/web/src/lib/` altına 2 yeni saf modül (`lapse.ts`, `dietBreak.ts`),
`nutrition.ts`'e seçenek seti, `db.ts` + `db/005_*.sql`'e 3 alan, `Meals.tsx` / `Coach.tsx` /
`Today.tsx`'e dokunuş, `COACH-EVIDENCE.md`'ye §9, `persona.ts` sistem istemine 2 kural.

**Değişmez:** kalori hedefi (S6 DB getirir, hedef getirmez), auth, sync protokolü, Health Connect,
Eva model katmanı, `date.ts`, eski migration'lar.

## 2. Eklenen sistemler (öncelik sırası)

### S1 — Telafi günü: "aşırıya kaçınca ertesi gün" (`lib/lapse.ts`)

**Tetik (üçü de mevcut veri; S6 gelince tetik 2 keskinleşir):**
1. Kullanıcı tek dokunuşla "bugün abarttım" der (Meals ekranında düğme) ya da Eva'ya
   yazar ("dün kaçırdım", "düğün vardı") → `daily_log.overate = true`.
2. Fotoğraf tahmini varsa: günün `calories_in` toplamı son 14 günün ortancasının
   **%140** üstündeyse aday (yalnız `kcal` girilmiş günlerde; girilmemişse sessiz).
3. Öğün notunda açlık skoru 8+ ile yenmiş 2+ öğün (S3'e bağlı, opsiyonel).

**Çıktı (`recoveryPlan(...)`, saf fonksiyon, veri döner, cümleyi UI/Eva kurar):**

```ts
interface RecoveryPlan {
  kind: 'recovery'
  /** Hafta bazında bakış: bir gün haftanın ne kadarını götürdü. */
  week_status: 'on_track' | 'slight' | 'reset'
  protein_g: number            // hedef DEĞİŞMEZ, tam alınır
  steps_add: number            // 7-gün ortalamanın +%15'i, tavan +3000
  fiber_servings: number       // 5 (sebze/baklagil porsiyonu)
  no_skip_meals: true          // öğün atlamak yasak — literal, UI bunu vurgular
  next_weigh_in: 'skip_tomorrow'  // yarınki tartı bilgi vermez: su/glikojen
  severity: 'info'
}
```

**Kural (kanıt §5.1–5.3):**
- **Asla** "yarın az ye / öğün atla / oruç tut" üretmez. Bu örüntü persona §2.2'de
  yeme bozukluğu bayrağıdır; telafi = kısıtlama değil, **rutine dönüş**.
- Ana mesaj hafta bazlı: tek gün fazlası dengeli bir haftanın %40'ından azını götürür;
  gerçek risk lapse değil, lapse sonrası "nasılsa bozuldu" kararıdır (AVE).
- Aynı gün içinde bir sonraki öğünü hafifletmek, ertesi güne yaymaktan daha doğal ve
  daha olası (uygulama günlüğü verisi §5.2) → plan, henüz gün bitmediyse **bugünün
  kalan öğününe**, bittiyse **yarına** yazılır.
- Yarınki tartı 7-gün ortalamasına girer ama ekranda "bugün +1.2 kg" gösterilmez
  (zaten kilit); `next_weigh_in` UI'da "yarın tartıya bakma" notu.
- Ayda 4+ `overate` işareti → Eva sadece bir kez, yumuşak dille uzman önerisi
  (persona §2.2 "uzman desteği" bloğu). Rakam/kısıtlama önermez.

### S2 — Seçenek setleri: tek liste yerine 3 menü (`nutrition.ts › suggestMenus`)

`suggestFoods` üç yiyecek veriyor; diyetisyen üç **senaryo** verir. Mevcut fonksiyonun
üstüne ince katman, yeni veri kaynağı yok:

| Set | Kaynak | Kural |
|---|---|---|
| **Alışık** | `source: 'history'`, en sık onaylanan | bugünkü davranış |
| **Değişiklik** | son 7 günde hiç geçmemiş history + tohum | `recentMeals` cezası zaten var; ters çevir |
| **Hızlı** | `grams`/`count` bilinen, ≤2 kalem | slot açığını tek kalemle kapatan |

Her set: slot açığını (`gap_g`) kapatan en küçük kombinasyon; kullanıcı birine dokunur →
`saveMeal` (mevcut). Set boşsa gösterilmez, 3 yerine 2 olur; uydurma yok.

### S3 — Açlık skoru (`meal.hunger` 1–10, tek kaydırma)

Öğün kaydında opsiyonel kaydırıcı, varsayılan boş. Ne için: S1 tetik 3 + haftalık
"8+ ile yenen öğün sayısı" (Week ekranı, tek satır). Kanıt orta (§5.5); maliyet
sıfıra yakın olduğu için giriyor. **60 sn kuralı:** varsayılan boş, zorunlu değil.

### S4 — Lif/sebze porsiyon sayacı + bel çevresi (`daily_log.veg_servings`, `waist_cm`)

- **Sebze/baklagil porsiyonu**: Bugün ekranında +1 düğmesi (protein artımlıyla aynı
  desen), hedef 5. Lif gramı sayılmaz (DB yok); porsiyon yeter. Neden: tansiyon
  takibi zaten var, lif artışı hipertansiflerde SKB −4.3 / DKB −3.1 mmHg (§5.4, **güçlü**).
  `Week` ekranı tansiyon 7-gün ortalaması yanına "sebze ort." koyar; Eva ikisini birlikte okur.
- **Bel çevresi**: haftada bir, Pazartesi sabah hatırlatmasında sorulur (mevcut
  `reminders.ts`). 7-gün kilo ortalaması durduğunda bel düşüyorsa "recomposition",
  ikisi de durduysa S5 tetiği. Kilo dışı ilerleme göstergesi (§5.6).

### S5 — Diyet molası (`lib/dietBreak.ts`)

`weightTrend` geçmişi (haftalık) üzerinden:
- 8+ ardışık hafta `target_kg > 0` (açık) **ve** son 3 hafta `too_slow` **ve** bel
  düşmüyor → "1–2 hafta bakım kilosunda kal" önerisi (`kind: 'diet_break'`).
- Uygulaması: `goals.weekly_loss_pct` geçici 0 (S5 UI'da "molayı başlat" → 14 gün
  sonra hatırlatma ile eski hedefe dön). Kalori hesabı yok; bakım = protein aynı,
  kilo sabit, antrenman aynı.
- Kanıt: MATADOR (§5.7) **sınırlı** — tek RCT, 51 obez erkek; "mucize değil, araç"
  diye yazılır. Eva "metabolizmanı sıfırlar" demez.

### S2b — Öneri itici olsun: varsayılan seçim + gerekçe + meydan okuma

Üç set yan yana "menü" gibi durmaz; biri **önceden seçili** gelir, altında tek satır
gerekçe ("akşam 34 g açık, en sık onayladığın bu"), tek dokunuşla kaydolur. Diğer
ikisi katlanır. Üçüncü set her zaman **meydan okuma**: bu hafta hiç yenmemiş, protein
yoğunluğu en yüksek kalem ("bu hafta ilk kez: 160 g ton"). Kabul edilirse haftalık
"deneme" sayacına yazılır (Week ekranı, retro `experiment` alanıyla aynı mantık).
Kaynak: choice architecture — varsayılan ve sıralama tercihi değiştirir (§5.10).
İtme dozu ayardan: `nudge: 'soft' | 'push'` (push: akşam slotu boşsa 19:00'da
hatırlatma, mevcut `reminders.ts`). **Varsayılan adaptif (Dean, 17 Eyl):** taban
`soft`; S1 telafi tetiği o gün ateşlendiyse gün `push` olur, ertesi gün `soft`a döner.
Ayardan elle sabitlenebilir (`soft`/`push` seçimi adaptifi kapatır). Kısıtlama diline hiç girmez; itme = protein/
sebze **ekletmek**, hiçbir zaman **çıkartmak** değil (S1 kuralı aynen).

### S6 — Besin veritabanı (kilit spec sahibince açıldı, 2026-09-16)

Katman sırası, ucuzdan pahalıya; her biri bir öncekinin üstüne gelir, hiçbiri
zorunlu değil:

| Katman | Kaynak | Bedel |
|---|---|---|
| 1 | Mevcut LLM tahmini (fotoğraf + serbest metin, `estimate.ts`) — zaten kcal/protein veriyor | 0 |
| 2 | **Open Food Facts** barkod: `GET world.openfoodfacts.org/api/v2/product/{ean}.json` — key yok, kota yok, ODbL | Kamera barkod okuma (Capacitor `@capacitor-mlkit/barcode-scanning`, yeni bağımlılık) |
| 3 | **USDA FoodData Central** jenerik gıda arama (`api.nal.usda.gov/fdc/v1/foods/search`) — ücretsiz data.gov key, 1000 istek/saat/IP; key `.env`'e | Sunucu proxy (`/api/food?q=`), Türkçe→İngilizce çeviri LLM ile |
| 4 | TürKomp (Türkiye Ulusal Gıda Kompozisyon VT) | Resmî API yok; CSV dışa aktarım + `db/006_food.sql` yerel tablo. Türk yemekleri (mercimek çorbası, menemen) için tek doğru kaynak |

**Kısmen doğrulandı (16 Eyl):** OFF'ta gerçek Türk barkodları var — `8691316520027`
(Yağlı Ayran, `countries_tags: en:turkey`, tuz 0.8 g/100 ml, protein 2 g) ve
`8695077041067` (Ayran, tuz 0.7 g) `status:1` döndü. `search` uç noktası o an kapalıydı.
Kapsam oranı hâlâ ölçülmedi. **Karar (Dean, 17 Eyl): hibrit — isabet testi kapı
olmaktan çıktı.** Sorgu türü kaynağı seçer: barkodlu paket ürün → OFF (katman 2),
Türk ev yemeği / jenerik pişmiş yemek → TürKomp (katman 4), ikisi de tutmazsa USDA
(katman 3), o da yoksa LLM tahmini (katman 1). TürKomp CSV ilk sürümde gelir, OFF
kapsamının ölçülmesi beklenmez.

**`meal` sunucuya çekilir** (`db/005`: `meal(id, date, time, protein_g, kcal, hunger,
note, source, barcode)`; fotoğraf cihazda kalır, `routes.ts`'e `/api/meals` upsert +
outbox). Bu olmadan S3 açlık skoru ve kcal geçmişi telefon değişince gider.

Kalori **hedefi** hâlâ yok: veritabanı tahmini iyileştirir, S1 tetiğini keskinleştirir
ve Week ekranında 7-gün kcal ortalamasını gösterir; günlük "kalan kalori" sayacı
konmaz (§5.8 rijit takip bedeli). Günlük değil haftalık ortalama, karar birimi kilidiyle aynı.

### S7 — Kiler + haftalık/aylık öğün listesi + zar + serbest öğün (Dean, 16 Eyl)

S2/S2b "o an ne yiyeyim" sorusuna cevaptır; S7 **önceden bilme** ihtiyacıdır. S2'nin
üstüne oturur, `suggestFoods` skorlaması aynen kullanılır.

**Kiler (`pantry`)** — evde duran, pişirmesiz yenen kalemler; üç giriş yolu:
barkod (S6 katman 2 → OFF), fotoğraf (mevcut `/api/estimate`, ambalaj etiketi de
okur), metin ("160 g ton"). Her kalem: `name, portion_g, protein_g, kcal, tags
('konserve'|'sebze'|'hazır'|'pişmiş'), slots, stock (adet, opsiyonel), source`.
`SEED_FOODS` bu tablonun ilk tohumudur; ayrı liste kalmaz, kilere göçer.

**Eşdeğer değişim (`equivalents`)** — aynı slotta protein farkı ±8 g olan kalemler
birbirinin yerine geçer: "160 g ton (42 g)" ↔ "120 g hindi fileto (~34 g, doğrulanmadı,
S6 ile ölçülür)" ↔ "200 g tavuk (62 g)" değil (fark büyük). Listedeki her satırın
sağında "değiştir" → yalnız eşdeğerler gelir, açığı korur.

**Haftalık liste (`mealPlan`)** — Pazar akşamı (ayar) 7 gün × 4 slot üretilir:
- Her gün `proteinTarget.recommended_g` tutar; slot dağılımı `slotGaps` ile aynı.
- Çeşitlilik kısıtı: aynı kalem aynı slotta ardışık iki gün gelmez; haftada en fazla 3 kez.
- Stok varsa stok biter bitmez o kalem sonraki günlere girmez; alışveriş listesi =
  plan − stok (tek ekran, kopyalanabilir metin).
- Antrenman günü (`split.ts › groupsFor`) akşam slotuna en yüksek proteinli kalem.
- **Ay görünümü** = 4 haftalık kaydırmalı liste; her hafta başı yeniden derlenir,
  geçen hafta onaylanan öğünler `foodMemory`'ye yazılır, sonraki hafta buna göre
  değişir. Ay için ayrı algoritma yok.

**Zar (`reroll`)** — tek slot, tek gün ya da tüm hafta için: aynı kısıtlarla, tohumlu
rastgele (`seed` kaydedilir, aynı zar aynı sonucu verir → test edilebilir). Zar
eşdeğer havuzundan çeker; açığı bozan sonuç üretmez.

**Serbest öğün (`free_meal`)** — haftada **bir öğün**, gün ayardan (varsayılan
Cumartesi akşam). Listede protein hedefi o slot için düşer, gün toplamı kalan
üç slotla korunur. Kurallar (§5.12):
- Planlıdır, kendiliğinden değil: hafta başında listede görünür, "kazanılmaz".
- "Cheat" kelimesi UI'da ve Eva'da geçmez; "serbest öğün". Ödül/ceza dili yok.
- O hafta S1 `overate` işareti 2+ ise serbest öğün **yine kalır**; iptal = ceza.
- Ertesi gün telafi planı çıkmaz (planlıydı); tartı notu çıkar.
- Ayda 4+ `overate` (S1 bayrağı) aktifken serbest öğün önerisi bir hafta durur, Eva
  bir kez yumuşak yönlendirir. Tam gün "cheat day" hiçbir zaman önerilmez.

**Dosyalar:** `lib/pantry.ts` (CRUD + equivalents, saf), `lib/mealPlan.ts` (generate,
reroll, shoppingList; saf, `seed` ve `now` parametre) + testler; `db/006_pantry.sql`
(`pantry`, `meal_plan`); `ui/Plan.tsx` (hafta/ay sekmesi, zar, değiştir, alışveriş);
`Settings.tsx` (plan günü, serbest öğün slotu). `SEED_FOODS` → kiler göçü tek seferlik.

**Kabul:** 7 gün × 4 slot dolu, her gün hedef ±5 g; aynı seed aynı plan; stok 0 olan
kalem planda yok; serbest öğün slotu haftada tam 1; `overate` 2+ haftada serbest öğün
silinmiyor (test).

**Sıra:** S7 üçüncü PR (`feature/diet-layer-plan`), S6 katman 2 (barkod) ile birlikte;
kiler barkodsuz da (fotoğraf/metin) çalışır, barkod yalnız hızlandırır.

### S8 — Profil: mutfak, et/tahıl tercihi, yağ kalitesi, mikro besin kontrolü, link/resim araştırma (Dean, 16 Eyl)

**Mutfak ekipmanı (`profile.kitchen`)**: elektrikli düdüklü tencere (30–35 dk et),
airfryer (çevirme/ızgara), mikrodalga, büyük fırın. Plan (S7) her kaleme pişirme yolu
yazar: "antrikot → airfryer 200° 8+6 dk" gibi. Ekipmanda olmayan yöntem önerilmez.
Yeni bağımlılık yok; `settings` altına `kitchen: string[]`.

**Et tercihi**: bonfile, antrikot, dana/kuzu "lokum" (yumuşak, sinirsiz) kesimler;
lifli/sinirli et yok. Kiler etiketi `cut: 'tender' | 'stew'`; düdüklüde 30–35 dk
kural: `stew` kesimler oraya, `tender` airfryer/ızgara. Sinirli kesim önerilmez.

**Tahıl**: basmati > jasmin (GI ~50–58 vs 68–80, §5.13), bulgur basmatiye yakın ve
lif fazla, chia tohumu lif + ALA. Plan tahıl slotunu bu üçlü arasında döndürür; beyaz
kısa taneli pirinç önerilmez.

**Yağ kalitesi (§5.14)**: sızma zeytinyağı varsayılan pişirme/sos yağı. Hindistan cevizi
yağı **önerilmez** (LDL'yi nontropikal yağlara göre yükseltir; zeytinyağına karşı fark
net değil, ama üstünlüğü de yok). Fıstık ezmesi: içerik yalnız "yer fıstığı" (şeker,
palm yağı yok) ise kilere girer; barkod/etiket fotoğrafı bunu kontrol eder, uygun
değilse "eşdeğer: tahin / badem ezmesi" der.

**Sıvılar**: su, maden suyu, ayran kilerde. Tansiyon takibi olduğu için sodyum
etiketlenir: maden suyu markaya göre değişir (Beypazarı ~138 mg/L sodyum, satıcı
sayfası, **doğrulanmadı**); ayran markaya göre 100 ml'de 0.3–0.8 g tuz (OFF etiketi).
Günlük toplam tuz > 5 g'a yaklaşınca Eva bilgi verir, yasaklamaz.

**Mikro besin kontrolü**: haftalık plan üretilince S6 verisi olan kalemlerden lif,
kalsiyum, magnezyum, potasyum, demir, B12, D, omega-3 toplanır; RDA'nın %70 altında
kalan besin için "eksik: potasyum → muz/patates/yoğurt" tek satır. Sayısal hedef
kartı yok, yalnız eksik uyarısı. Kaynak: USDA FDC mikro alanları (katman 3); OFF
etiketleri mikro vermez, TürKomp verir. Kalori hedefi hâlâ yok.

**Link/resim araştırma (`/api/lookup`)**: Dean bir ürün linki, tarif linki ya da
etiket/tabak fotoğrafı gönderir → sunucu (mevcut `llm.ts` + WebFetch benzeri fetch)
içeriği çıkarır, makro/mikro tahmini + kalite notu (şeker, palm yağı, tuz) + kiler
kaydı taslağı döner; onaylanmadan yazılmaz (`estimate.ts` deseni aynen). Offline'da
çalışmaz, kuyruklanır.

**Dosyalar:** `settings.ts` (`kitchen`, `meat_pref`, `grain_pref`), `lib/pantry.ts`
(`cut`, `quality_flags`), `apps/api/src/lookup.ts` (+ test), `lib/micros.ts` (saf,
RDA tablosu sabit) + test, `COACH-EVIDENCE.md` §9'a yağ/tahıl maddeleri.

### S9 — Destekler: kreatin, L-karnitin, bromelain, pre-workout, protein tozu (Dean, 16 Eyl)

**Kayıt (`supplement` tablosu, `db/007`)**: ürün etiketi fotoğrafı ya da linki →
`/api/lookup` (S8) içerik listesini çıkarır: her etken madde için **servis başına mg**
(`ingredients: {name, mg_per_serving}[]`), servis boyutu (g/kaşık/kapsül), tavsiye edilen
zamanlama. Onaylanınca kilere `type: 'supplement'` ile girer. Pre-workout gibi karışım
ürünlerde her madde ayrı satır; "proprietary blend" ise mg bilinmiyor diye işaretlenir,
uydurulmaz.

**Alım kaydı (`supplement_intake`)**: tek dokunuş "aldım" → tarih, saat, servis sayısı.
mg hesabı = servis × `mg_per_serving`, gün toplamı ve kg başına doz (`mg/kg`, 7-gün
ortalama kilodan) otomatik. Protein tozu alımı **`saveMeal` üzerinden** protein gramına
yazılır, ayrı sayılmaz (çift sayım yok).

**Doz ve zamanlama kuralları (`lib/supplements.ts`, saf; §5.15)**:

| Destek | Etkili doz | Zaman | Uyarı eşiği |
|---|---|---|---|
| Kreatin monohidrat | 3–5 g/gün, her gün (yükleme gerekmez) | Fark etmez; antrenman günü sonrası pratik | >10 g/gün → "fazlası atılır"; su 2+ L hatırlat |
| Protein tozu (whey/kazein) | Slot açığı kadar, 20–40 g/servis | Açık olan slot; kazein uyku öncesi 30–40 g | Günlük protein üst sınırı (2.2 g/kg) aşılırsa bilgi |
| Kafein (pre-workout) | 3 mg/kg (6 mg/kg üst) | Antrenmandan 45–60 dk önce; 14:00 sonrası uyku uyarısı | **Tansiyon takibi var:** akut +3–15 mmHg. Günün BP ölçümü 140/90 üstündeyse "bugün alma, hekime sor"; toplam kafein >400 mg/gün uyarı |
| Beta-alanin (pre-workout içinde) | 4–6 g/gün, bölünmüş | Kronik, zaman önemsiz | Karıncalanma normal, bilgi |
| Sitrülin malat (pre-workout içinde) | 6–8 g | 60 dk önce | — |
| L-karnitin | 2 g/gün (dozda plato) | Yemekle | Etki küçük (−1.2 kg, kilolu bireyde, yaşam tarzı ile birlikte); "yağ yakıcı" dili yok |
| Bromelain | 200–500 mg (çalışmalarda) | Yemek arası | Kanıt yetersiz/karışık; kan sulandırıcı ile etkileşim → persona §2.2 "her koşulda hekim" |

**Ne zaman alınacağı**: `nextDose(now, intakes, trainingToday)` → bugünün listesi
("kreatin 5 g: alınmadı", "pre-workout: antrenman 18:00 → 17:00–17:15", "kazein: 22:30").
Bugün ekranında tek satır; `reminders.ts` ile isteğe bağlı bildirim. Antrenman saati
`split.ts` + Ayar'daki antrenman saatinden.

**Sınırlar**: Eva doz artırmaz, ilaç etkileşimi yorumlamaz; etiket dozunun üstünü
önermez. Tansiyon ilacı / kan sulandırıcı kayıtlıysa (profil alanı `medications`,
yalnız evet/hayır) kafein ve bromelain önerisi kapatılır, hekime yönlendirir.

**Dosyalar:** `db/007_supplements.sql`, `lib/db.ts` (`Supplement`, `SupplementIntake`),
`lib/supplements.ts` + test (%100: mg hesabı, mg/kg, kafein toplamı, BP kapısı,
protein tozu → `saveMeal`), `ui/Supplements.tsx`, `Today.tsx` tek satır, `persona.ts`
kural, `COACH-EVIDENCE.md` §9.

### Bilinçli olarak dışarıda

| Trend | Neden yok |
|---|---|
| Kalori **hedefi** / "kalan kalori" sayacı | Rijit takip → beden imgesi/işlev bozukluğu ilişkisi (§5.8, n=5902). kcal ölçülür, hedeflenmez. |
| Su/hidrasyon sayacı | Tansiyon ve kilo için kanıt zayıf; ekstra dokunuş = 60 sn kuralına yük. |
| Sodyum sayacı | Etiket okuma ister, DB ister. Lif porsiyonu aynı hedefe daha ucuz varır. |
| Tarif / pişirme adımları | Kiler pişirmesiz kalemlerden kurulu (S7); tarif motoru YAGNI. |
| CGM / glikoz | Cihaz yok. |
| "Kalori bankası" (hafta sonu için biriktirme) | Açlık sinyali + tıkınma riski; S1'in tam tersi mesaj. |

## 3. Plan & Risk — dosya yolları

| Adım | Dosya | Risk |
|---|---|---|
| 1 | `db/005_diet_layer.sql`: `daily_log.overate bool`, `veg_servings int`, `waist_cm numeric(4,1)`; yeni `meal` tablosu (S6) + `routes.ts` `/api/meals` | Şema kilidi: eski migration'a dokunma |
| 2 | `apps/web/src/lib/db.ts`: `DailyLog` + `Meal` alanları; Dexie `version(n+1)` | Upgrade yolu; mevcut veri bozulmasın |
| 3 | `apps/web/src/lib/lapse.ts` + `lapse.test.ts` (TDD, %100) | Saat okumaz, `now` parametre |
| 4 | `nutrition.ts › suggestMenus` + test | `suggestFoods` bozulmaz, üstüne katman |
| 5 | `apps/web/src/lib/dietBreak.ts` + test | Haftalık trend serisi gerekir → `metrics.ts`'te yardımcı |
| 6 | UI: `Meals.tsx` (abarttım düğmesi, açlık kaydırıcı, 3 set), `Today.tsx` (+1 sebze), `Coach.tsx` (recovery / diet_break kartı), `Week.tsx` (bel, sebze ort., 8+ öğün sayısı), `Settings.tsx` (bel hatırlatma günü) | 60 sn ölçümü tekrar yapılır |
| 7 | `apps/api/src/persona.ts`: iki kural — "telafi = kısıtlama değil", "diyet molası mucize değil"; `<kayit>` bloğuna `overate`, `veg_servings`, `waist_cm` | Eva rakam uydurmasın: yalnız hesaplanmış plan |
| 8 | `docs/COACH-EVIDENCE.md` §9 (bu dosyanın §5'i taşınır), `COACH-PERSONA.md` §5.10 örnek diyalog "dün abarttım" | — |
| 9 | Offline Eva kural motoru (`localLlm.ts`/`chat.ts` kural dalı): "abarttım" → `overate` taslağı | Sunucusuz da çalışsın |

Sıra: 1–5 tek PR (`feature/diet-layer-core`, saf katman + test), 6–9 ikinci PR
(`feature/diet-layer-ui`). Her PR: `npm test` + `npm run typecheck --workspaces` yeşil.

## 4. Self-Test / Kabul

- [ ] `lapse.test.ts`: (a) gün bitmeden → bugünün kalan öğünü, bitince → yarın;
  (b) çıktıda hiçbir alan protein hedefinin altına inmez; (c) `kcal` yok → tetik 2 sessiz;
  (d) ayda 4. işaret → `refer_support: true` yalnız bir kez.
- [ ] `suggestMenus`: üç set birbirinden en az bir kalem farklı; boş set atılır; her set `gap_g`'yi kapatır.
- [ ] `dietBreak`: 7 hafta → yok, 8 hafta + 3 too_slow + bel sabit → var; bel düşüyorsa yok.
- [ ] 60 sn ölçümü: abarttım + sebze +1 + açlık kaydırıcı eklenmiş akış, gerçek telefonda kronometre.
- [ ] Uçak modunda "dün abarttım" → kural motoru taslak üretir.
- [ ] Coverage: `lapse.ts`, `dietBreak.ts`, `suggestMenus` %100 (`vitest --coverage`).

## 5. Kanıt notları (COACH-EVIDENCE §9'a taşınacak)

### 5.1 Lapse ≠ relapse; tehlike "nasılsa bozuldu" kararı — **Güçlü kanıt**
Başarısız kilo kaybı, lapse'in kendisinden çok sonrasındaki öz-kontrol çöküşü ve
abstinence-violation etkisi (AVE) ile ilişkili; hepsi-ya-hiç hedefi en yüksek risk.
Roordink ve ark., concept mapping, *Int J Behav Nutr Phys Act* 2021: https://pmc.ncbi.nlm.nih.gov/articles/PMC8725894/ ·
EMA sistematik derlemesi (iştah/duygu → lapse), 2024: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10909537/ ·
Momentary predictors, *Ann Behav Med* 2021: https://pubmed.ncbi.nlm.nih.gov/34807334/

### 5.2 Telafi öğünde olur, günde daha az — **Sınırlı kanıt**
Uygulama tabanlı yemek günlüğü verisinde öğün telafisi gün telafisinden, akşam
yemeği telafisi öğle telafisinden daha olası. (Tek gözlemsel veri seti; makale
metnine erişilemedi, özet arama sonucundan.)
https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10536014/

### 5.3 Tek günün "hasarı" sınırlı — **Sınırlı kanıt**
8 hafta günde +1000 kcal aşırı beslemede fazlanın ~%43'ü depolandı, ~%53'ü NEAT ile
yakıldı (Levine 1999, popüler özet: https://fitchef.com/shorts/weekend-overeating-undo-dieting-week/).
Egzersizin "boşa gittiği" iddiası 2025 verisiyle çürüdü: https://sciencedaily.com/releases/2025/12/251228020012.htm

### 5.4 Lif ve tansiyon — **Güçlü kanıt**
Hipertansiflerde lif artışı SKB −4.3 / DKB −3.1 mmHg (yüksek kesinlik); tüm nedenli
ölüm azalması (orta kesinlik). Reynolds ve ark., *BMC Medicine* 2022:
https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9027105/ · AHA lif önerisi:
https://www.ahajournals.org/doi/pdf/10.1161/HYPERTENSIONAHA.123.22575 ·
Dijital DASH müdahaleleri (24 çalışma, ~7000 kişi) tansiyon/tuz/kiloda olumlu, 2025:
https://pmc.ncbi.nlm.nih.gov/articles/PMC12413951/

### 5.5 Açlık-tokluk skalası — **Sınırlı/Tartışmalı**
Mindful eating uygulamaları derlemesi: skor yazdırmak tek başına yetmez, yine de
farkındalık için ucuz araç. JMIR Mental Health 2019: https://pmc.ncbi.nlm.nih.gov/articles/PMC6727629/

### 5.6 Bel çevresi ve kilo dışı göstergeler — **Güçlü kanıt (uygulama etkisi), Sınırlı (NSV)**
Mobil/web müdahale şemsiye meta-analizi: kilo −1.32 kg, bel çevresi ve tansiyonda
anlamlı iyileşme; katılım arttıkça sonuç iyileşiyor. *IJERPH* 2025: https://doi.org/10.3390/ijerph22071152 ·
JITAI scoping (35 çalışma): tartı + diyet davranışı tetikli anlık müdahaleler, 2025:
https://www.sciencedirect.com/org/science/article/pii/S1438887125016279

### 5.7 Diyet molası (MATADOR) — **Sınırlı kanıt**
2 hafta açık / 2 hafta bakım, sürekli açığa göre daha fazla kayıp (14.1 vs 9.1 kg) ve
daha az REE düşüşü; 51 obez erkek, tek RCT. Byrne ve ark., *Int J Obes* 2018:
https://www.nature.com/articles/ijo2017206 · BREAK protokolü (devam ediyor):
https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0294131

### 5.8 Kalori takibinin bedeli — **Sınırlı kanıt (kesitsel)**
5902 fitness odaklı bireyde kalori takibi zayıflık/kas dürtüsü ve egzersiz kaçırınca
duygusal sıkıntı ile ilişkili; rijit takip uyarısı. *PMC* 2025/26:
https://pmc.ncbi.nlm.nih.gov/articles/PMC12909219/

### 5.10 Choice architecture: varsayılan + sıralama seçimi değiştirir — **Güçlü kanıt (bağlam farklı)**
Menüde sıralama/varsayılan değişimi kalori ve besin kalitesini iyileştirip memnuniyeti
artırdı (online sipariş, RCT). https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11450623/ ·
Okul kantini küme-RCT uzun dönem: https://pmc.ncbi.nlm.nih.gov/articles/PMC10988364/ ·
Sağlık ortamlarında tipoloji (varsayılan, konum, boyut), 2025: https://pmc.ncbi.nlm.nih.gov/articles/PMC12379066/
Uygulamada karşılığı S2b. Tek kullanıcıda etki büyüklüğü ölçülmedi.

### 5.11 Besin veritabanı API'leri (kanıt değil, teknik)
OFF v2: https://freeapihub.com/apis/open-food-facts-api · USDA FDC: https://fdc.nal.usda.gov/api-guide
(1000 istek/saat, ücretsiz key).

### 5.12 Serbest öğün — **Sınırlı kanıt**, planlı olursa
Haftada bir planlı sapma (6 gün 1300 kcal + 1 gün 2700) öz-düzenleme ve motivasyonu
korudu, plansız sapma korumadı; n=36, 14 gün. Coelho do Vale ve ark., *J Consumer
Psychol* 2016: https://www.sciencedirect.com/science/article/abs/pii/S1057740815000443
Scoping derleme (8 çalışma): cheat meal'li gruplarda kilo kaybı korunuyor, yıpranma
%15.7 vs %36.8; ama "ödül / kural bozma" diye çerçevelenince tıkınma-telafi döngüsüne
benziyor; yeme bozukluğuna yatkın kişide önerilmez. *Nutrition Reviews* 2025:
https://academic.oup.com/nutritionreviews/article/83/11/2240/8162961
Uygulamada karşılığı: S7 "serbest öğün" (tek öğün, planlı, ödül dili yok, S1 bayrağında durur).

### 5.13 Basmati vs jasmin — **Sınırlı kanıt** (GI tek sayı değildir)
Basmati GI ~50–58, jasmin 68–80; amiloz oranı belirleyici; pişirme ve çeşit değiştirir.
https://www.glycemic-index.org/glycemic-index-of-rice.html · https://glycemicsnap.com/blog/rice-glycemic-index-comparison

### 5.14 Hindistan cevizi yağı — **Güçlü kanıt** (LDL yükseltir)
16 çalışma meta-analizi: nontropikal bitkisel yağlara göre toplam ve LDL kolesterolü
anlamlı yükseltir; zeytinyağına karşı alt grupta fark anlamsız. Neelakantan ve ark.,
*Circulation* 2020: https://www.ahajournals.org/doi/10.1161/CIRCULATIONAHA.119.043052 ·
Ağ meta-analizi (yağlar/katı yağlar): https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6121943/ ·
VCO meta-analizi 2025: https://link.springer.com/article/10.1186/s13098-025-02019-6
Uygulamada: zeytinyağı varsayılan, hindistan cevizi yağı önerilmez, yasaklanmaz.

### 5.15 Destekler
- **Kreatin 3–5 g/gün — Güçlü kanıt** (zaten §5.3, ISSN 2017).
- **Kafein 3–6 mg/kg performans — Güçlü kanıt**; aynı doz dinlenme SKB'yi +3–15, DKB'yi
  +4–13 mmHg yükseltir — hipertansif takipte kapı şart. ISSN Position Stand 2021:
  https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7777221/ · Kardiyometabolik derleme 2026:
  https://pmc.ncbi.nlm.nih.gov/articles/PMC13414015/
- **L-karnitin — Sınırlı kanıt**: 37 RCT meta-analizi, kilo −1.21 kg, 2 g/gün'de plato,
  yalnız kilolu/obez + yaşam tarzı değişikliğiyle; bel çevresi ve yağ yüzdesinde etki yok.
  Talenezhad ve ark., *Clin Nutr ESPEN* 2020: https://pubmed.ncbi.nlm.nih.gov/32359762/
- **Bromelain (DOMS) — Tartışmalı/yetersiz**: 40 kişilik çift kör RCT plaseboya fark yok;
  küçük çalışmalarda ağrı skoru −%30. https://www.researchgate.net/publication/11004190_Preliminary_Comparison_of_Bromelain_and_Ibuprofen_for_Delayed_Onset_Muscle_Soreness_Management
- **Protein tozu**: besin, destek değil; §1.1–1.4 geçerli (kazein uyku öncesi 30–40 g, §1.4).

### 5.9 Sektör trendi (kanıt değil, bağlam)
2026 diyetisyen platformları: AI fotoğraf analizi, koçlu/işbirlikçi/manuel üç mod,
uzun vadeli davranış vurgusu. https://brocoders.com/blog/diet-apps-nutrition-trackers/ ·
https://blog.everfit.io/top-nutrition-coaching-platforms · https://fortune.com/article/best-nutrition-apps
Bu uygulamada karşılığı: S2 (seçenek setleri) + mevcut fotoğraf tahmini; koç
platformu özellikleri (meal plan builder, mesajlaşma) tek kullanıcıda YAGNI.

## 6. Adversarial Verify — Dean onay masası

Kapananlar (Dean, 2026-09-16): kcal tetiği KALIR; `meal` sunucuya çekilir; besin DB
kilidi açıldı (S6).

Kapananlar (Dean, 2026-09-17):
1. **`nudge` varsayılanı adaptif** — taban `soft`, S1 telafi tetiği ateşlenen gün
   `push`, ertesi gün `soft`. Elle sabitleme adaptifi kapatır. (S2b)
2. **Serbest öğün varsayılan slotu Cumartesi akşam, plan üretim günü Pazar akşam.** (S7)
3. **Besin kaynağı hibrit** — barkod OFF, Türk yemeği TürKomp, jenerik USDA, kalanı
   LLM tahmini. 10 barkodluk isabet testi kapı değil. (S6)
4. AGENTS.md "kalori/besin veritabanı kapsam dışı" satırı S6 ile güncellendi.

Açık kalan:
- **Diyet molası otomatik hedef değiştirmesin**, yalnız önersin (bu planın varsayımı).
  Onaylıyorsan S5 UI'daki "molayı başlat" düğmesi hedefi 14 gün 0'a çeker.
