# Handoff: Egzersiz kütüphanesi uygulamada çalışıyor · commit `a9d7438`

> 2026-09-18 23:45 · dal **`feature/exercise-library`** @ `a9d7438` (dev'den ayrıldı, `eda4e5a`)
> Önceki devir: `2026-09-18-2227-kart-tasarimi-onayda.md` — tasarım kararları ve koçluk
> geçmişi orada, tekrarlanmıyor.

## Hedef

Eva'yı danışılabilir PT + diyetisyen yapmak (`docs/PLAN-COACH.md`, S1→S5).
Bu oturumda **S2 (egzersiz kütüphanesi) uçtan uca bitti ve uygulamada çalışıyor.**

## Durum — doğrulanmış

`npm test` → **310/310** (21'i yeni: `exercises.test.ts`) · `npm run typecheck --workspaces`
temiz · `npm run build -w @wellness/web` → `✓ built in 3.55s`.
Vite dev sunucusu **arka planda hâlâ açık**: `https://192.168.0.29:5174/` (task `b1sdm18nf`).
Kapatmak gerekirse o görevi durdur.

Commit `a9d7438` içeriği: `lib/exercises.ts` + testi · `ui/Exercise.tsx` · `ui/Exercises.tsx` ·
`App.tsx` (5. sekme "Hareket") · `lib/db.ts` (Dexie v7 `exercise_media`) · `index.css`
(semantik renkler) · `data/exercise-tr.json` · `scripts/build-exercises.mjs` ·
`apps/web/src/data/exercises.json` · `docs/PLAN-COACH.md`.

## Mimari kararlar ve nedenleri

- **Katalog derlemeye gömülü** (`apps/web/src/data/exercises.json`, betiğin çıktısı oraya
  yazıyor — tek kaynak). Ağ olmadan açılsın diye. **Görseller gömülü değil**, URL olarak
  duruyor; ilk gösterimde `fetch` → `db.exercise_media` (Blob) → ikinci açılış çevrimdışı.
- **Lisans doğrulandı:** GitHub API `{"spdx_id":"Unlicense"}` — kamu malı, atıf zorunlu değil.
  wger'in elenme gerekçesi CC-BY-SA'ydı (AGPL değil).
- **Elle bakımlı dört alan** `data/exercise-tr.json`'da, upstream'de karşılığı yok:
  `name` (Türkçe) · `load` (yük binen nokta) · `cue` (tek cümlelik uyarı) · `focus`
  (fotoğraf üzeri vurgu koordinatları, kare başına).
- **Vurgu fotoğrafın üstünde**, figürün üstünde değil — vücut zaten karede. `far: true`
  olan bölge (önden çekilmiş karede bel) %30 opaklık, öndekiler %62.
- **Renk tek başına bilgi taşımıyor:** her bölgenin yazılı etiketi de basılıyor.
  Kas renkleri aksandan ayrı (`--color-work/assist/load`) — a1 teal "yeşil = çalışan"la
  karışıyordu.
- **Kare geçişi N kareyi destekliyor**, ileri-geri akıyor (4 karede `0-1-2-3-2-1`).
  FADE 1400ms / HOLD 2200ms.

## Bilinen eksikler (borç, gizlenmiş değil)

1. **`focus` yalnız 2 harekette dolu** (`Dead_Bug`, `Pallof_Press`). Kalan 26 hareket ×
   2 kare = 52 fotoğrafa **tek tek bakmak** gerekiyor; uydurma koordinat girilmedi.
   Vurgusu olmayan harekette yalnız figür görünüyor.
2. **Figür kaba.** Dean: "olmadı, sonra iyileştiririz". Kodda `ponytail:` notu var
   (`ui/Exercise.tsx › BodyMap`) — yükseltme yolu orada yazılı.
3. **Kaynakta 3+ kare yok.** Sayıldı: 876 hareketin 873'ünde tam 2 kare, 3'ünde hiç
   görsel yok, 2'den fazlası olan **yok**. Mekanizma hazır, besleyecek veri yok.
   Dean'e önerilen: salonda kendi karelerini çeksin.
4. `data/exercises.json` kaldırıldı, çıktı artık `apps/web/src/data/` altında. Kök
   `data/` yalnız elle bakımlı `exercise-tr.json` tutuyor.

## Bekleyen — Dean'den

- Kart onayı (leke yoğunluğu, `far` yeterince silik mi).
- **Makine fotoğrafları** → her makinenin Türkçe kullanım anlatımı + `focus` koordinatları.
- Salı seansının ağırlık ve set sayıları → gerçek hacim tablosu, 2. hafta artışı.
- **Ayar → Güncelleme denetle** — telefon hâlâ eski sürüm, senkron akmıyor.
- Ayardaki protein hedefi hâlâ 140 g; 109 kg için 175–240, başlangıç 190.

## Tekrarlama

- `focus` koordinatını fotoğrafa bakmadan yazma. Test sınır kontrolü yapıyor ama
  yanlış yeri işaretlemeyi yakalayamaz.
- Figürü cilalamaya girişme; Dean sonraya bıraktı.
- Dean'in antrenman bilgisini sıfır varsayma — programı zaten tüm vücuttu ve doğruydu.
- `scripts/build-exercises.mjs` bazen `UND_ERR_CONNECT_TIMEOUT` veriyor (geçici) —
  ikincide geçiyor, retry ekleme.
- Artifact'ta uzak görsel kullanma; CSP raw.githubusercontent'i bloklar.
- Senkronu "düzeldi" sayma: `docker logs life-os-wellness-api-1 | grep fit.evaitec.com`.

## Next (tek adım)

Dean onaylayınca `feature/exercise-library` → PR → `dev`. Ardından **S1 (profil)**:
`db/006_profile.sql` + `lib/profile.ts` + `lib/chat.ts › gather`'a profil satırı —
Eva'nın tanı/ilaç bilgisiyle konuşabilmesi buna bağlı.
