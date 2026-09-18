# Handoff: Egzersiz kütüphanesi tohumu hazır · sıradaki iş görselli kart + geçiş

> 2026-09-18 21:30 · `dev` @ `eda4e5a` · **commit edilmemiş** yeni dosyalar:
> `docs/PLAN-COACH.md` · `data/exercise-tr.json` · `data/exercises.json` · `scripts/build-exercises.mjs`
> Önceki devir: `2026-09-18-1918-antrenman-programi-verildi.md` — ölçüm protokolü, sirke,
> 7 günlük plan, tansiyon uyarısı orada. Hepsi geçerli, tekrarlanmıyor.

## Bu turda yapılan (doğrulanmış, tool çıktısı var)

**Kütüphane tohumu kuruldu ve çalışıyor.**
`node scripts/build-exercises.mjs` → `25 hareket yazildi -> data/exercises.json`.
Upstream `yuhonas/free-exercise-db` — 876 hareket, **Unlicense (kamu malı)**.
Kayıt yapısı doğrulandı: `id` = alt tireli ad (`Machine_Bench_Press`), `images` = `<id>/0.jpg`
ve `<id>/1.jpg` — **başlangıç ve bitiş karesi**, planın "iki kare + CSS geçiş" kararının
veri karşılığı hazır geliyor.
Görsel erişimi doğrulandı: `Leg_Press/0.jpg` → **HTTP 200, 84.753 bayt**.

Şema (`scripts/build-exercises.mjs › shape`): `id · name (TR) · name_en · equipment ·
equipment_tr · level · mechanic · primary · primary_tr · secondary_tr · instructions ·
media[]`. `media` kasten dizi — yarın GIF/video eklenirse kart değil kaynak değişir.
`category`/`force` taşınmıyor, kullanan yok.

`data/exercise-tr.json` elle bakımlı: kas adları, ekipman adları ve 22 hareketin Türkçesi.
**Buraya bir id eklenmezse kütüphaneye girmez** — 850+ hareket kasten dışarıda, Dean'in
salonundaki makineler kadarı var. Betik eksik id'de hata verip durur (sessiz düşmez).

## Dean'in programı → kütüphane id'leri

Program kararı değişmedi (Pzt/Çrş/Cum, tüm vücut, hareketler döner — gerekçe:
3 günde bölünmüş program her kası haftada 1 kez uyarır, tüm vücut 3 kez).

| Gün | Sıra | id |
|---|---|---|
| A Pzt | 1-6 | `Machine_Bench_Press` · `Wide-Grip_Lat_Pulldown` · `Leg_Press` · `Lying_Leg_Curls` · `Leverage_Shoulder_Press` · `Triceps_Pushdown` |
| B Çrş | 1-6 | `Leverage_Iso_Row` · `Butterfly` · `Leg_Extensions` · `Barbell_Hip_Thrust` · `Side_Lateral_Raise` · `Machine_Bicep_Curl` |
| C Cum | 1-6 | `Hack_Squat` · `Close-Grip_Front_Lat_Pulldown` · `Incline_Dumbbell_Press` · `Lying_Leg_Curls` · `Face_Pull` · `Plank` |

Yedekler kütüphanede hazır: `Goblet_Squat` (hack squat yoksa), `Romanian_Deadlift`
(hip thrust yoksa), `Seated_Cable_Rows`, `Leverage_Incline_Chest_Press`,
`Machine_Triceps_Extension` · `Arnold_Dumbbell_Press` · `Reverse_Flyes` · `Dumbbell_Shrug`.

## Düzeltme — Dean omuz çalışıyormuş

İlk beyanda omuz hareketi yoktu, "omuz sıfır" tespiti ona dayanıyordu. Dean sonradan
**face pull, yan kaldırış ve Arnold press** yaptığını söyledi. Doğru tablo: **tek gerçek
boşluk bacaktı**, omuz zaten kapalıydı. Program değişmiyor; omuz işi "eklenen" değil
"korunan" olarak okunmalı. Bir sonraki oturum Dean'in deneyimini sıfır varsaymasın —
hareket adlarını biliyor, teknik anlatımı o seviyeden kurulmalı.

`Arnold_Dumbbell_Press` kütüphaneye eklendi (Gün A omuz presinin muadili olarak kullanılabilir).

## Sıradaki oturumun işi — Dean'in isteği

"Hareketleri listeye koyalım, **görsellerle geçişlerle**." Yani:
1. `apps/web/src/lib/exercises.ts` — saf filtreler: `byEquipment`, `byMuscle`, `alternatives(id)`.
2. `apps/web/src/ui/Exercise.tsx` — kart: Türkçe ad · ekipman rozeti · çalıştırdığı bölge ·
   **iki kare çapraz geçiş (~900 ms CSS)** · talimat maddeleri · muadil listesi.
3. Görsel önbelleği: ilk gösterimde `fetch` → `db.exercise_media` (Blob), sonra offline.
   Ağ yoksa görsel yerine `instructions`.
4. `data/exercises.json` web'e nasıl gidecek (import mu, public asset mi) — karar verilmedi.

## Bekleyen (Dean'den)

- **Makine fotoğrafları.** İstenen çerçeve: makine tamamı yan açıdan · ayar kolları yakın ·
  kullanım şeması · pinin durduğu kademe. Karşılığı: oturuş/ayar, hareket başlangıç-bitiş,
  nefes anı, sık hata. Bunlar `instructions`'ın Türkçe/yerelleştirilmiş halini besleyecek.
- Salı seansının ağırlıkları → 2. hafta artış planı.
- **Ayar → Güncelleme denetle** (telefon hâlâ eski sürüm, senkron akmıyor).
- Ayardaki protein hedefi hâlâ 140 g; olması gereken 175–240, başlangıç 190.

## Tekrarlama

- Başlangıç ağırlığını fotoğraftan tahmin etme — test yöntemi verildi (10 tekrar → kaç kaldı).
- wger'i yeniden gündeme getirme; gerekçe CC-BY-SA (AGPL değil). Türkçe isim sorusu artık
  **anlamsız**: TR eşlemesi `data/exercise-tr.json` ile elle kuruldu ve çalışıyor.
- `scripts/build-exercises.mjs` bazen `UND_ERR_CONNECT_TIMEOUT` ile düşüyor (raw.githubusercontent, geçici) — ikinci çalıştırmada geçiyor, koda retry ekleme.
- Dean'in antrenman bilgisini sıfır varsayma.
- Görselleri repoya commit etme — `data/exercises.json` yalnız URL taşıyor, 35 KB.
- 3 günde bölünmüş (bro split) program önerme.
- Senkronu "düzeldi" sayma: `docker logs life-os-wellness-api-1 | grep fit.evaitec.com`.

## Next (tek adım)

`feature/exercise-library` dalı: `lib/exercises.ts` (TDD) + `ui/Exercise.tsx` iki kare geçişli kart.
Doğrulama: `npm test`, ve kartın uçak modunda ikinci açılışta aynı görselle çizilmesi.
