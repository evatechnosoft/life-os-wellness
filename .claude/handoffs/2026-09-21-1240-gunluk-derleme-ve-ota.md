# Handoff: Salon envanteri + ilk seans kaydı · OTA indirme kök nedeni çözüldü

> 2026-09-21 12:40 · `dev` @ `5e36ab3` · çalışma ağacı temiz · önceki: `2026-09-21-1137-salon-envanteri-ve-ota.md`
> Önceki devir: `2026-09-20-2225-telefon-sunucu-dogrulama.md`

## Bu oturumda yapılanlar (hepsi commit'li, push'lu)

### 1. Saat OTA indirmesi — kök neden bulundu ve kapatıldı (`c1ad8a4`)
**Kanıtlanmış:** manifest APK'yı GitHub CDN'den indirtiyordu — ölçüm 120 KB/s, 13 MB ≈ 2 dk;
saat ekranı sönünce bağlantı düşüp indirme baştan başlıyordu. `curl` ile fit.evaitec.com'dan
aynı dosya **10.7 s / 1.2 MB/s** indi.
- v0.22.0 release'indeki `latest.json` fit.evaitec.com/ota adreslerine çevrildi ve
  `curl` ile doğrulandı → kurulu 0.22 saat de artık hızlı iner.
- `.github/workflows/apk.yml` base url'i fit.evaitec.com/ota (sonraki tag'de regresyon olmasın).
- `OtaUpdater.fetchTo`: yarım dosya varsa `Range` ile kaldığı yerden sürer (206), 200'de baştan.
  Yeni test `OtaResumeTest` (`:wear:testDebugUnitTest` yeşil, JBR 21 ile).
- APK önbellek adına versionCode eklendi; kurulum hatasında dosya siliniyor.
- Wear MainActivity: indirme boyunca `FLAG_KEEP_SCREEN_ON`, ikinci dokunuş yok sayılıyor.
- `:app:assembleDebug :wear:assembleDebug` BUILD SUCCESSFUL.

**Doğrulanmadı:** Dean saatte "Güncelle"ye basıp 0.22'yi kurdu mu — cihaz kanıtı yok.

### 2. Egzersiz kütüphanesi 28 → 43 hareket (`781fbdd`, `ea111fe`, `4e027e0`, `9eddf6a`)
Mobilite 5 (kedi-deve, hip flexor, kalça çemberi, dinamik göğüs açma, ayak bileği çemberi) +
salon makineleri (recumbent bike, seated leg curl, calf press, split squat, cable crossover,
EZ bar curl, dumbbell bench, preacher curl, ab crunch, thigh abductor).
`build-exercises.mjs` artık null `equipment`/`mechanic`'i normalize ediyor (kartta "null" yazıyordu).
`npm test` 345/345, `typecheck` temiz.

### 3. Salon envanteri — 40+ fotoğraf, `docs/SALON-MAKINELERI.md`
Her makine → program karşılığı → kütüphane id → fotoğraf. Ağırlık kademeleri fotoğrafla
doğrulandı (kablo 5'er, chest press 10'ar + 2.5 mikro, pec deck 5'er, dambıl 5–30).
Fotoğraflar `docs/assets/gym/` (1280px, ~74-78 kalite, klasör ~6.3 MB).

### 4. `docs/KULLANIM-KARTLARI.md` (`c11b081`)
7 makine için Ayar/Başlangıç/Hareket/Nefes/Sık hata kartı. Kalan 12 makine listede.

### 5. Program güncellendi (`781fbdd`, `68b3459`, `cce13cc`)
- Hafta sonu havuz kapalı → yüzme Sal/Per, Cmt/Paz yürüyüş 6.000+ adım.
- Tansiyon 21 Eyl: 128/84 ve 130/77 (Dean beyanı, tekil) — kısıtlar **değişmiyor**.
- Soğuma seçeneği: 10–15 dk hafif yüzme (Dean önerisi), kardiyo hacmine sayılmaz.

### 6. İlk seans kaydı (21 Eyl, Pazartesi — göğüs+kol)
| Hareket | Setler | Çalışma | Gelecek hafta |
|---|---|---|---|
| Chest press | 35×12, 40×12, 45×10 | 45 kg | 40-45-50 |
| Pec deck | 25×15, 30×12, 35×12 | 35 kg | 35-40-40 |
| Lat pulldown (geniş) | 30×12, 35×12, 40×12 | 40 kg | 40-45-45 |
| Row (makine, plan dışı) | 20/25/30 ×12 | 30 kg | 30-35-35 |
| Biceps curl (no 7) | 15×12, 17.5×12, 20×12 | 20 kg | 20-22.5-22.5 |
| Triceps press (no 8) | 15×15, 25×12, 30×12 | 30 kg | 30-32.5-35 |
Nabız 114 sabit. Isınma 700R 7 dk @ 98 W / 67 rpm. Setler arası 40 sn → 90–120 sn'ye çıkarılacak.

## Tekrarlanmayacaklar

- Saatin indirmesini GitHub CDN'e geri bağlama — ölçülmüş 10× fark var.
- Ağırlığı fotoğraftan tahmin etme; 10 tekrar + RIR testi ile bulunur.
- "Chest press 15 kg" — o test setiydi, çalışma ağırlığı 45 kg (bir kez yanlış yazıldı, düzeltildi).
- Geniş tutuş lat pulldown'ı yasaklama: Dean'e rahat geliyor, ağrı yok → devam, nötr bar ikinci çekiş.
- Pzt'ye row eklenirse Çarşamba sırt setini 9 → 6'ya indir (haftalık hacim taşmasın).

## Açık işler (Dean'in listelediği sırayla)

1. **Egzersiz kataloğu sunucudan gelsin** — yeni hareket için APK gerekmesin. Dean'in itirazı haklı.
   Tasarım hazır: `GET /api/exercises` + compose'a `./apps/web/src/data:/app/data:ro` mount,
   istemcide `EXERCISES` sabitini `applyCatalog()` ile değiştirilebilir yap, Dexie'ye önbellekle,
   gömülü JSON fallback kalsın. Kullanım dar: `exercises.ts` içi + `Exercises.tsx` sayacı.
2. **0.23.0 APK yayını** — OTA düzeltmeleri + 43 hareketlik kütüphane telefona insin.
   Sürüm `apps/web/android/variables.gradle` → `wellnessVersion`. Yayın: tag `v0.23.0` + `ops/publish_ota.mjs`.
3. Saatte 0.22 kurulumunun cihaz kanıtı.
4. Günlük program notunun (`training_split.note`) uygulamada görünmesi/düzenlenmesi —
   sunucuda alan var, `pullSplit` okumuyor, `queueSplit` **not'u null'layıp siliyor** (bug).
5. Kalan 12 makine kullanım kartı.

## Sıradaki tek adım

Madde 1'i bitir (katalog sunucudan), ardından 2'yi yayınla — ikisi tek APK turunda telefona iner.

## 11:37 sonrası eklenenler

- `docs/GUNLUK-2026-09-21.md` (`5e36ab3`): günün tam derlemesi — seans tablosu, ölçümler, öğle
  yemeği analizi, haftanın kalan günleri gün gün yapılandırılmış, 10 sabit kural, doğrulanmamışlar.
  Dean "Fable olarak derle, günleri yapılandır" dedi; adversarial verify Dean'de (henüz okumadı).
- Bahar Fit hindi göğüs konservesi ürün kataloğunda (`5d27b0b`; 30 g protein / 0.2 g tuz per 100 g).
- Dean'e sorulan ve cevapsız: patates kızartma mı fırın mı; günlük için artifact isteyip istemediği.

## Sıradaki tek adım (değişmedi)

Dean günlüğü onaylayınca → açık iş 1 (katalog sunucudan, APK'sız) → 2 (0.23.0 yayını).
