# PLAN-COACH — Kişisel antrenör + diyetisyen katmanı

Eva'nın koç şapkası bugün **reaktif**: kaydedilene bakıp "şu kas eksik" der. Bu plan
onu **danışılabilir** hale getirir — kim olduğunu bilir, hareketi gösterir, plan kurar.

Persona ve sınırlar `COACH-PERSONA.md`, kanıt `COACH-EVIDENCE.md`. Bu dosya yalnız
**ne inşa edileceğini** tarif eder; sağlık sınırı orada, tartışmaya kapalı.

## 0. Kilitler (bu planda değişmez)

- Offline-first: egzersiz kütüphanesi ve profil IndexedDB'de; ağ yokken de açılır.
- Giriş akışı 60 sn sınırı: profil **tek seferlik**, günlük akışa hiçbir alan eklenmez.
- Public repo: **hiçbir görsel/video repoya commit edilmez** (`docs/assets` dersi).
- Kalori hedefi yok (AGENTS.md kilidi). PT katmanı bunu değiştirmez.

---

## S1 — Profil: Eva seni tanısın

Bugün Eva'ya yalnız son 7 günün sayıları gidiyor (`lib/chat.ts › gather`). Kim olduğun
gitmiyor; bu yüzden "bana uygun mu" sorularına genel cevap veriyor.

**Veri** — `db/006_profile.sql` + `db.settings['profile']` (tek satır, sunucuya outbox ile):

| Alan | Neden |
|---|---|
| `birth_year`, `height_cm`, `sex` | protein/kalori aralıkları ve kırmızı bayrak eşikleri |
| `goal` (`cut`/`maintain`/`gain`), `target_weight_kg` | `nutrition.ts` hedef seçimi |
| `training_years` | başlangıç/orta/ileri → hacim ve ilerleme hızı |
| `conditions[]`, `medications[]`, `injuries[]` | **COACH-PERSONA §2** kırmızı bayraklarının çalışması için zorunlu |
| `dislikes[]`, `allergies[]`, `cuisine` | `suggestMenus` bunlara göre daralır |
| `equipment[]` (`gym`/`dumbbell`/`barbell`/`machine`/`bodyweight`/`cable`/`band`) | S2'nin hareket filtresi |
| `days_per_week`, `session_min` | S3'ün plan hacmi |

**Kod:** `lib/profile.ts` (saf: profil → türetilmiş hedefler), `ui/Profile.tsx` (Ayar →
Günlük ayarlar bölgesi, PLAN-UI §3), `lib/chat.ts › gather` profil satırını bağlama ekler,
`persona.ts › SYSTEM` "kullanıcının tanısı/ilacı varsa protokol kurma" kuralını profilden okur.

**Kabul:** profil dolu iken Eva'ya "16:8 bana uygun mu" → cevap tanı/ilaç alanına değiyor.
Profil boş iken → Eva rakam uydurmaz, eksik alanı ister.

---

## S2 — Egzersiz kütüphanesi: cihaz ayrımı + görsel

**Kaynak: `yuhonas/free-exercise-db` — Unlicense (kamu malı), 800+ hareket.**
Alanlar: `name, force, level, mechanic, equipment, primaryMuscles, secondaryMuscles,
instructions, category, images` (hareket başına iki kare: başlangıç ve bitiş).
Görseller repoda değil, `raw.githubusercontent.com/.../exercises/` altında.
(wger alternatifti — CC-BY-SA 3.0 + AGPL, atıf zinciri taşımak gerekirdi; kamu malı olan
kazandı.)

**Neden video değil, iki kare:** hareketin kritik bilgisi başlangıç ve bitiş pozisyonu.
İki kareyi 900 ms'de CSS ile geçirmek animasyonu verir — video altyapısı, codec, boyut
ve lisans derdi olmadan. Gerçek video gerekirse S2 sonrası ayrı karar.

**Yapı:**
- `data/exercises.json` — repoya **girer** (metin, ~1 MB, kamu malı), görsel **girmez**.
  Üretim betiği `scripts/build-exercises.mjs`: upstream'i çeker, alanları kırpar,
  Türkçe isim ve kas adı eşlemesini (`data/exercise-tr.json`, elle bakımlı) uygular.
- `lib/exercises.ts` — saf filtreler: `byEquipment`, `byMuscle`, `alternatives(id)`
  ("makinem yok, dambılla ne yaparım" bunun üstünde çalışır).
- Görsel önbelleği: ilk gösterimde `fetch` → `db.exercise_media` (Blob). İkinci açılışta
  offline. Ağ yoksa görsel yerine `instructions` metni.
- `ui/Exercise.tsx` — kart: Türkçe ad · ekipman rozeti (makine / dambıl / barbell /
  vücut ağırlığı / kablo / bant) · çalıştırdığı bölge (birincil kaslar vurgulu) ·
  iki kare çapraz geçiş · talimat maddeleri · "bunu şununla değiştir" listesi.
- Eva'dan çağrı: cevabında hareket adı geçince `splitReply` bir `exercise` referansı
  döndürür, sohbet kartı basar. Model hareket **uydurmaz** — id kütüphanede yoksa kart yok.

**Genişleme yeri (baştan açık bırakılır):** `exercises.json` şemasında `media` dizisi —
bugün iki resim, yarın GIF/video/3B eklenirse kart değişmez, kaynak değişir.

**Kabul:** "göğüs için makinede ne var" → yalnız `equipment=machine` hareketler, her biri
görselli. Uçak modunda ikinci açılışta aynı kart çiziliyor.

---

## S3 — PT: program kurma

Bugün `coach.ts` yalnız kaydedilmişe bakıyor. Eksik olan: **ileriye dönük program**.

- `lib/program.ts` (saf, TDD): profil (gün sayısı, süre, ekipman, seviye) → haftalık split
  + kas başına hedef set. Hacim ve efor kuralları `COACH-EVIDENCE §4`'ten gelir
  (set sayısı azalan verim, 0–2 RIR, deload reaktif).
- Hareket seçimi S2 kütüphanesinden, `equipment` filtresiyle.
- `db.settings['program']` — mevcut `split` ayarının yerine geçer, geriye uyumlu.
- Eva "programımı 4 güne çıkar" dediğinde `draft` olarak program önerir; **onay Dean'de**
  (mevcut draft akışı, yeni mekanizma yok).

**Kabul:** 3 gün/45 dk/yalnız dambıl profiliyle üretilen programda barbell hareketi yok,
kas başına haftalık set kanıt aralığında.

---

## S4 — Diyetisyen: haftalık öğün iskeleti

`suggestMenus` tek öğün öneriyor; eksik olan haftalık iskelet.
- `nutrition.ts › weekPlan`: protein hedefi + `dislikes/allergies/cuisine` + geçmiş
  öğün hafızası → 7 günlük slot iskeleti. Kalori hedefi **yok** (kilit).
- Serbest öğün günü (`free_meal_planned`, COACH-EVIDENCE §9.12) iskelete işlenir.

---

## S5 — Senkron (bitti sayılmaz, doğrulama Dean'de)

`wellness-tunnel` 17 Eyl 19:57'den beri ölüydü (`network is unreachable`); 18 Eyl 07:18'de
yeniden ayağa kaldırıldı, `https://fit.evaitec.com/health` → `{"ok":true}`.
Sunucudaki son kayıt 14 Eylül ve tümü 16 Eylül'deki ZIP aktarımından — telefon hiç
doğrudan yazmamış. **Açık:** telefonun Ayar → Sunucu adresi `https://fit.evaitec.com` mi.
Kalıcı çözüm: tünel `restart: unless-stopped` ile ayakta ama `--profile tunnel` kapalıysa
hiç başlamıyor; Ayar ekranında "sunucuya en son ne zaman yazıldı" satırı eklenecek —
sessiz kopukluk bir daha üç gün sürmesin.

---

## Sıra

S5 doğrulama → S1 → S2 → S3 → S4. Her biri ayrı `feature/` dalı ve PR'ı.
Hesaplama katmanı (`profile.ts`, `exercises.ts`, `program.ts`) TDD.
