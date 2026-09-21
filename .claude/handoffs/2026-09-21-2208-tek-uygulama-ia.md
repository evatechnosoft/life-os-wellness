# Handoff: tek uygulama IA tasarımı · seçici birleşmesi · Samsung Health arşivi

> 2026-09-21 22:08 · `dev` @ `106acd2` · çalışma ağacı temiz · önceki: `2026-09-21-1738-secici-artifact.md`

## Hedef

Dean: "uzman developer + kıdemli UX olarak araştır, kullanım çok zor, hazır yapıya en yakın
düzenle; seçici ile uygulama birleşsin; buradan (sohbet) ve uygulamadan hafta/gün koordine
edilebilsin; bana PT personası skill'i yap, değerlerime göre." Sonra: "gym map diye bir şey
varmış, onu da araştır", "minimal değil, bölüm/sayfa/drawer ekleyebilirsin", "görsel için site
bağlantısı ver", ve Samsung Health dışa aktarımını paralelde incele.

## Yapılan — kanıtlı

- **Spec yazıldı ve commit'lendi:** `docs/superpowers/specs/2026-09-21-tek-uygulama-ia-design.md`
  — `105d632` (ilk), `106acd2` (inceleme düzeltmeleri). `git log --oneline -1` doğruladı.
- **Görsel taslak yayında:** https://claude.ai/code/artifact/d94aafee-57dd-4784-a8e6-53362c1aa1dc
  Kaynak: scratchpad `eva-ia.html` (repoda değil). Dört sekme + drawer tıklanabilir.
  **Doğrulanmadı:** tarayıcıda açılmadı, yalnız yayın çıktısı var.
- **Üç paralel ajan raporu** (ux-research, dev-review, shealth-zip) + spec incelemesi (spec-review).

## Kararlar

- **IA: 4 alt sekme** — Bugün (7 gün şeridi + Antrenman kartı + Tabak kartı) · Plan (hafta
  şablonu + zar + kas haritası × alet) · Ölçüm (7/28 gün ort + günlük form) · Koç (Eva).
  İkincil her şey **drawer**'da tam sayfa (hareket kütüphanesi, makine kartları, program metni,
  takviyeler, notlar, saat kurulumu, veri, ayarlar). Dean "minimal değil" dedi; drawer bu yüzden.
- **"Gym map" = kas haritası kalıbı** (MuscleMap/MuscleWiki), salon bulucu GymMaps değil.
  PWA'da `BodyPicker.tsx` zaten var, Plan sekmesinde egzersiz seçiciye bağlanacak.
- **Seçici PWA'ya taşınır**, `/plan/` meta refresh ile `/?tab=plan`'a yönlenir. `plan.js` saf
  modül olarak `lib/plan.ts`'e geçer, kuralları ve testleri değişmez. `rows.json` atılır,
  tek kaynak `exercises.json`.
- **Tabak yeni tablo istemez** — tek `meal` satırına yazılır (`note` kalem listesi, protein/kcal
  toplam). Yeni şema yalnız `workout_plan` ve `exercise_set` (`db/008_plan.sql`).
- **Faz 3 de kapsamda** (Dean seçti): Hevy tarzı set-set kayıt, geçen sefer değeri, dinlenme sayacı.
- **Koordinasyon = `~/.claude/skills/dean-pt/`**: persona PROGRAM-2026-09 değerlerini *okur*,
  kopyalamaz; sınırlar COACH-PERSONA §2; `curl` ile `/api/*`; token `~/.ai/vg.env` pointer'ı.

## Spec incelemesinde çıkan ve düzeltilen dört hata

weekday=JS getDay (0=Pazar) yazılmamıştı · day_type↔WorkoutType eşlemesi yoktu (lift→resistance,
swim→cardio, rest+yürüyüş→walk) · `protein_target` mükerrerdi, mevcut `goals.protein_g` kullanılacak ·
drawer hiçbir faza atanmamıştı, Faz 2'ye bağlandı (5→4 sekmede Ayar/Hareket erişimi kör kalırdı).

## Samsung Health arşivi — Dean'in gönderdiği zip

`C:\Users\Deacjx\.claude\uploads\aec52af0-.../fb2ffee0-samsunghealth_deancjx_20260921212993.zip`
(144 MB, 65 CSV, 2024-08 → 2026-09-21). Açıldığı yer: scratchpad `shealth/`.

**Programı ilgilendiren iki bulgu:**
1. **`PROGRAM-2026-09.md` §1'deki tansiyon cümlesi yanıltıcı.** "21 Eyl 128/84 ve 130/77 —
   bandın belirgin altında" yazıyor; arşivde 2026-09'da **18 ölçüm var, bandı 128–147 / 84–96**.
   Tekil iki ölçüm iyi, ortalama iyi değil. Program kısıtları zaten gevşemiyor ama cümle düzeltilmeli.
2. Mart 2026'da 101.0 kg → Eylül 109.1 → 107.5. Arada kayıt yok (6 ay boşluk).

Son 14 gün adım 3 965–8 166; son üç gün 7 486 / 7 445 / 8 166 (program 4. hafta hedefi 6 500 zaten tutuyor).
Uyku 2026'da hiç yok (son gece 2025-05-17). HRV/SpO2 değerleri CSV'de değil, `jsons/` binning içinde.

**İçe aktarma yolu (şema değişmez):** tek script, 4 CSV (step_daily_trend `source_type=-2`,
weight, blood_pressure, exercise) → `source='samsung_csv'` ile mevcut `POST /api/wearable` +
workout upsert. Health Connect satırlarıyla çakışmaz (unique date+source+metric).

## Tekrarlanmayacaklar

- Günlük adım üç kez yazılmış (telefon, saat, birleşik). Yalnız `source_type=-2` / `Combined`
  alınır, yoksa adımlar üçe katlanır.
- Samsung zaman damgaları UTC, ofset ayrı kolonda (UTC+0300). `day_time` kolonlu tablolarda değer
  zaten yerel gün. `toISOString()` ile gün türetme yasağı burada da geçerli (`lib/date.ts`).
- 2026-09-20 nabız min 30 bpm artefakt, dinlenme nabzı proxy'sine katma.
- Spec'te yeni ayar açmadan önce `settings.ts Goals` bak — `protein_g` zaten vardı.

## Açık işler

1. Faz 1: `db/008_plan.sql` + `GET/PUT /api/workout-plan` + `GET /api/exercise-sets` +
   `POST /api/workouts` sets desteği + `~/.claude/skills/dean-pt/`.
2. Samsung içe aktarma scripti (Faz 1 şeması yazıldıktan sonra, aynı dal).
3. `PROGRAM-2026-09.md` §1 tansiyon cümlesinin düzeltilmesi (18 ölçümlük gerçek bant).
4. Önceki devirden devam: 0.26.0 APK cihaz kanıtı, keystore kalıcı yere, çekim rehberi.
5. Artifact'in (seçici, `3b8b7694`) Dean tarafından açıldığı hâlâ doğrulanmadı.

## Sıradaki tek adım

Dean'e hangisiyle başlanacağı soruldu (Faz 1 mi, Samsung içe aktarma mı), cevap gelmedi.
Cevap yoksa **Faz 1** ile başla: içe aktarmanın yazacağı antrenman kayıtları o şemayı bekliyor.
Dal: `feature/plan-api`.
