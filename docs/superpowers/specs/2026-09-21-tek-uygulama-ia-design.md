# Tek uygulama, dört sekme — seçici + PWA birleşmesi ve PT skill'i

> 2026-09-21 · Onay: Dean ("2 + skill, Faz 3 de şimdi") · Kaynak araştırma: UX (MuscleMap/Hevy/Strong/MFP/Yazio/Fitbod) + kod incelemesi (`App.tsx`, `store.ts`, `routes.ts`, `tools/secici`).
> Kilitler aynen: PWA, offline-first, 60 sn giriş, kalori hedefi yok, karar birimi 7-gün ortalaması, tek kullanıcı.

## 0. Sorun

İki ayrı yüzey var: PWA (`fit.evaitec.com`, 5 sekme, "ne yaptım" kaydı) ve seçici (`/plan/`, 3 sekme, "ne yapayım" planlayıcı, Postgres'e yazmıyor). Dean iki yerde geziyor, seçici kayıt tutmuyor, Claude sohbeti uygulamanın haftasını görmüyor. "Gym map" isteği = kas haritasından hareket seçme kalıbı (MuscleMap/MuscleWiki), PWA'da `BodyPicker.tsx` zaten var ama seçiciye bağlı değil.

## 1. Scope Lock

**Değişir:** `apps/web/src/App.tsx` (sekmeler), `ui/Today.tsx` (yeniden kurulur), `ui/Week.tsx` → Ölçüm, yeni `ui/Plan.tsx`, `ui/DayStrip.tsx`, `ui/SessionCard.tsx`, `ui/PlateCard.tsx`, `ui/SetRow.tsx`, `ui/Drawer.tsx`, `ui/DocPage.tsx`; `lib/plan.ts` (+test), `lib/plate.ts` (+test), `lib/sets.ts` (+test), `lib/db.ts` (v+1: `exercise_set`, `workout_plan` settings), `lib/store.ts` (üç `queue*`), `data/foods.json`; `apps/api/src/routes.ts` (iki uç + workouts genişletme), `db/008_plan.sql`; `~/.claude/skills/dean-pt/`.
**Değişmez:** `plan.js` kuralları ve testleri (aynen taşınır), Eva/Coach, Meals fotoğraf/barkod akışı, `training_split` tablosu (okunmaya devam eder), artifact sürümü, saat uygulaması.
**Kapatılır:** `tools/secici/secici.html` bağımsız sayfa olarak Faz 2 sonunda; `/plan/` → `/?tab=plan` yönlendirmesi. Kaynak `tools/secici/` repoda kalır (plan.js'in tarihçesi), README'ye "PWA'ya taşındı" notu.

## 2. Bilgi mimarisi — 4 alt sekme

| Sekme | İçerik | Neden |
|---|---|---|
| **Bugün** (varsayılan) | Üstte `DayStrip` (Pzt–Paz, gün tipi ikonu lift/swim/rest, bitmiş günler dolu nokta, bugün vurgulu, dokununca o güne gider). Altta iki kart: **Antrenman** (`SessionCard`) ve **Tabak** (`PlateCard`). En altta mevcut kilo/adım hızlı satırı (tek alan, Ölçüm'e bağ). | Günlük iki iş tek ekranda, aksiyonlar alt 2/3'te (tek başparmak). |
| **Plan** | Hafta şablonu (gün → lift/swim/rest + sistem tümVücut/bölünmüş), **Zar** (`plan.ts` roll/rollWeek), **kas haritası × alet** seçici (`BodyPicker` + `equipment_tr` filtresi → hareket listesi, her satırda "yerine: X · Y"). Seçilen seans bugünün/o günün rutinine yazılır. | Nadir ama derin işlem, Bugün'ü kirletmez. Seçicinin üç sekmesi burada erir. |
| **Ölçüm** | Bugünkü `Week.tsx` + `Today`'deki DailyLog formu (kilo, TA, adım, bel, sebze). 7/28 gün ortalama, uyum, streak, protein haftalık ort. | Karar birimi hafta; trend ekranı sade ve ayrı. |
| **Koç** | `Eva.tsx` olduğu gibi. Bağlam: bugünün planı + haftanın özeti sistem istemine eklenir. | Sohbet tam ekran ister. |

**Drawer (sol üst menü, Dean 21 Eyl: "minimal değil, bölüm/sayfa/drawer ekleyebilirsin"):** alt çubuk dört sekmede kalır (günlük iş), ikincil sayfalar drawer'a gider, her biri tam sayfa `?page=` ile açılır:
Hareket kütüphanesi (`Exercises.tsx`, kas haritası + arama) · Kullanım kartları (`KULLANIM-KARTLARI.md` içeriği, makine başına) · Program (PROGRAM-2026-09 hedefleri ve kuralları, salt okunur) · Takviyeler (`TAKVIYELER.md`) · Notlar (`NoteEntry` geçmişi) · Saat/Telefon kurulumu · Veri (dışa aktar/sil) · Ayarlar (`Settings.tsx`, PLAN-UI sırasıyla).
Drawer sayfalarının markdown içeriği build'de `docs/*.md`'den `apps/web/src/data/pages/*.md` olarak kopyalanır (Vite `?raw` import), ayrı CMS yok. `?tab=moves` → drawer "Hareket kütüphanesi".

## 3. Bugün — kartlar

### 3.1 SessionCard (Hevy/Strong kalıbı)
- Gün tipi `rest` → "Yürüyüş 6.000+ adım" satırı, kart kapalı. `swim` → süre alanı + kaydet. `lift` → rutin.
- Rutin = `workout_plan[weekday].exercises` (Plan sekmesinde zarla ya da elle kurulmuş). Boşsa "Zar at" düğmesi (Plan'a gitmeden, `plan.ts` çağrısı).
- Her hareket satırı: ad, hedef set sayısı, **"yerine"** (aynı kas × aynı/başka alet, `plan.ts alternatives()`), ve set satırları.
- **SetRow:** `kg` · `tekrar` · tik. Soluk gri "geçen sefer 45×12" (aynı `exercise_id`'nin son `exercise_set` kaydı); dokununca kopyalanır. Tik → set `done_at` alır, **dinlenme sayacı** 90 sn altta bar (ayar `rest_sec`, varsayılan 90). Tansiyon kuralı: tekrar >15 girilirse uyarı çipi ("PROGRAM: 8–15"), engel değil.
- Başlık: geçen süre · biten/toplam set. "Bitir" → `workout` satırı (`sets_total`, `reps_total`, `weight_kg` toplamları setlerden türetilir, `muscle_groups` hareketlerden) + `exercise_set` satırları outbox'a.
- Kütüphane kartları (`KULLANIM-KARTLARI.md` beş başlık) hareket adına dokununca sheet olarak açılır; Faz 3 sonunda `exercises.json`'a `card` alanı.

### 3.2 PlateCard (MFP/Yazio kalıbı)
- Slotlar PROGRAM §4'ten: Sabah · Öğle · Ara · Akşam · Antrenman sonrası (son slot yalnız lift/swim günü görünür).
- Her slot: "+" → **sık yenenler** ızgarası: `foods.json` (seçicideki 30 kalem, grup çipleri) + son 14 günün `meal.note` kalemleri önde. Dokun = ekle, adet ± . Altta "sadece gram" Quick Add (protein g, isteğe kcal).
- Kaydet → tek `meal` satırı: `note` = "Kuru fasulye ×1 · Bulgur ×1 · Salata", `protein_g`/`kcal` toplam, `source: 'manual'`, `time` slot saatinden. Mevcut `queueMeal` kullanılır, yeni tablo yok.
- Protein çubuğu: gün toplamı / 180 g (ayar `protein_target`). Kalori yalnız bilgi, hedef çubuğu yok (kilit).
- Fotoğraf/barkod girişi `Meals.tsx`'te kalır, slot "+" menüsünden ulaşılır.

### 3.3 DayStrip
- Yerel tarihle (`lib/date.ts`, `lastDates`/`toLocalDate`), Pazartesi başlangıç. Gün tipi `workout_plan`, doluluk: o gün `workout` ya da `meal` varsa nokta. Geçmiş güne dokunma = o günü göster (mevcut `date` state'i), gelecek gün = planı göster, kayıt kapalı.

## 4. Plan sekmesi

- **Hafta şablonu:** 7 satır, tip seçici (lift/swim/rest) + lift günlerinde sistem/gün etiketi (A/B/A′ ya da itiş/çekiş/bacak). `training_split.muscle_groups` şablondan türetilip yazılmaya devam eder (Week/Coach bunu okuyor).
- **Zar:** "Haftayı kur" → `rollWeek(system, avoid=geçen hafta)` üç seansı doldurur; "Bu günü at" tek seans. Kural motoru ve testleri `plan.js`'ten birebir (`forbid`/`avoid` ayrımı, PROGRAM §80 dağılımı `deepEqual`).
- **Kas haritası × alet:** `BodyPicker` (6 bölge) → `exercises.json` filtresi (`primary_tr` ∈ bölge, `equipment_tr` çipleri: makine/kablo/dambıl/vücut). Liste satırı: görsel (mevcut `exercise_media` IndexedDB deseni, bundle'a gömülmez), ad, "seansa ekle". Seçicideki `rows.json` atılır; tek kaynak `exercises.json` (+ `card` alanı, `alternatives` türetilir: aynı primary, farklı id, YASAK dışı).

## 5. Veri

### 5.1 Şema — `db/008_plan.sql`
```sql
create table if not exists workout_plan (
  weekday smallint primary key check (weekday between 0 and 6),
  day_type text not null check (day_type in ('lift','swim','rest')),
  system text,                 -- 'tumVucut' | 'bolunmus' | null
  label text,                  -- 'A', 'B', 'itis' ...
  exercises jsonb not null default '[]',  -- [{id, sets, slot}]
  updated_at timestamptz not null default now()
);
create table if not exists exercise_set (
  id uuid primary key,
  workout_id uuid not null references workout(id) on delete cascade,
  exercise_id text not null,
  set_no smallint not null check (set_no between 1 and 20),
  weight_kg numeric(5,1) check (weight_kg is null or weight_kg between 0 and 500),
  reps smallint check (reps is null or reps between 0 and 100),
  done_at timestamptz,
  unique (workout_id, exercise_id, set_no)
);
create index if not exists exercise_set_exercise_idx on exercise_set (exercise_id, done_at desc);
```

### 5.2 Uçlar (`routes.ts`, hepsi bearer)
- `GET /api/workout-plan` → 7 satır. `PUT /api/workout-plan` gövde `{ days: [{weekday, day_type, system?, label?, exercises?}] }`, `/api/split` ile aynı "gönderilmeyen alana dokunma" upsert deseni; dönüş 7 satır.
- `POST /api/workouts` gövdeye isteğe bağlı `sets: [{id, exercise_id, set_no, weight_kg, reps, done_at}]`; aynı transaction'da `exercise_set` upsert (idempotent, id istemciden).
- `GET /api/exercise-sets?exercise_id=&limit=` → son setler (geçen sefer değeri için; çevrimdışıyken Dexie'den).
- `GET /api/workouts?start&end` yanıtına `sets` dizisi eklenir.

### 5.3 İstemci
- Dexie v+1: `exercise_set` tablosu (`id, workout_id, exercise_id, done_at`), `settings.workout_plan`. Pull: `pullWorkoutPlan()` `pullSplit` deseninde.
- `store.ts`: `queueWorkoutPlan(days)`, `addWorkout` genişler (`sets`), hepsi outbox. Ağ yokken kayıt kaybı yok (kilit).
- `lib/plan.ts`: `plan.js`'in TS'i, `roll`, `rollWeek`, `alternatives`, `SISTEMLER`; testler `plan.test.ts` (8000 tur, 1000 hafta, dağılım deepEqual).
- `lib/sets.ts`: `previousSet(exerciseId)`, `sessionTotals(sets)`, `restTimer` saf yardımcılar; `lib/plate.ts`: `plateTotals(items)`, `plateNote(items)`, `frequentFoods(meals, foods)`.

## 6. Sohbet ↔ uygulama — `dean-pt` skill'i

`~/.claude/skills/dean-pt/SKILL.md` (+ `references/degerler.md`). Tetik: "pt", "koç", "hafta", "seans", "tabak", "bu hafta", "bugün ne var".
- **Persona:** kıdemli PT + diyetisyen. Değerler tek yerden: `docs/PROGRAM-2026-09.md` (§3 hedefler, §4 beslenme, §5 antrenman kuralları) — skill kopyalamaz, yolunu okur. Sınırlar `docs/COACH-PERSONA.md` §2 aynen (teşhis/ilaç yok, kırmızı bayrak → hekim). Ton: kısa, kendi verisine dayanır, 7-gün ortalaması, emoji yok.
- **Araç:** `curl` ile `https://fit.evaitec.com/api/*`. Token `~/.ai/vg.env` → `WELLNESS_API_TOKEN` (repo `.env`'deki `API_TOKEN` ile aynı değer; skill'de değer yok, pointer var). Okur: `workout-plan`, `workouts?start&end`, `meals`, `daily`, `exercise-sets`. Yazar: `PUT workout-plan` (gün tipi/seans değişimi), `POST workouts` (sohbette bildirilen seans), `POST meals` (sohbette bildirilen öğün). Her yazma öncesi tek satır teyit ("Çarşamba → yüzme, yazıyorum"), yazdıktan sonra GET ile kanıt.
- **Hafta ritmi:** Pazar akşamı "hafta kur" → zar + Dean onayı → PUT; her gün "bugün ne var" → plan + geçen sefer değerleri + tabak önerisi (PROGRAM §4 slotları). Hafta özeti Ölçüm ile aynı sayıları verir (`metrics.ts` mantığı sunucudan değil, ham veriden yerelde hesaplanır; sapma olursa uygulama doğru sayılır).

## 7. Hata ve sınırlar

- Ağ yok: tüm kayıt Dexie + outbox; DayStrip/rutin yerelden. "Geçen sefer" yerel `exercise_set`'ten.
- `workout_plan` boş: Bugün "Plan yok → Zar at". Skill de aynı boşluğu görür ve haftayı kurmayı önerir.
- Çift kayıt: `workout.id`/`exercise_set.id` istemciden, upsert.
- Tarih: yalnız `lib/date.ts`; seçicideki `toISOString` kalıntıları taşınmaz.
- Zar kuralı bozulursa test kırmızı; PROGRAM §80 dağılımı `deepEqual`.

## 8. Test

- TDD: `plan.test.ts`, `sets.test.ts`, `plate.test.ts`, `date` yardımcıları (`DayStrip` hafta başlangıcı). API: `routes.test` (node test runner) — plan PUT→GET, workouts+sets idempotent, exercise-sets sıralama.
- Kabul: `npm test` + `npm run typecheck --workspaces` yeşil; `curl` ile PUT→GET aynı veri; telefonda Bugün'de bir set tik + tabak kaydı 60 sn altında (Dean onayı); skill'den "Çarşamba yüzme" → uygulamada DayStrip değişir.

## 9. Fazlar

1. **Şema + uçlar + skill** — `008_plan.sql`, `workout-plan`/`exercise-sets` uçları, `workouts` sets desteği, `dean-pt` skill. Kanıt: curl tur + skill'den hafta okuma.
2. **IA + Plan + Tabak** — 4 sekme, DayStrip, Plan sekmesi (şablon + zar + kas haritası), PlateCard, `foods.json`, `/plan/` yönlendirme. Kanıt: telefon ekran görüntüsü + 60 sn ölçümü.
3. **Set kaydı** — SetRow, geçen sefer, dinlenme sayacı, Bitir → workout+sets, kütüphane kartı sheet'i. Kanıt: bir seans uçtan uca, `exercise-sets` GET'te görünür.

Sıra bağımlılık: 1 → 2 → 3. Her faz ayrı `feature/` dalı ve PR (squash-merge).
