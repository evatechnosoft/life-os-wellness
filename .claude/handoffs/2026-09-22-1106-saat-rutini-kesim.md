# Handoff: saat rutini çözüldü · günlük 12 Eylül'den başlıyor

> 2026-09-22 11:06 · `dev` @ `b1d3049` · çalışma ağacı temiz · önceki: `2026-09-22-0942-faz1-plan-api.md`

## Hedef

Faz 1 dün kapandı (plan/set uçları + `dean-pt` skill + Samsung arşivi). Bu oturumda Dean
üç şey istedi: günlüğün başlangıcını temizlemek, saatin hareket verisini çözmek, süre
yorumunu kurala bağlamak. Üçü de bitti. Sırada **Faz 2** var, başlanmadı.

## Yapılan — kanıtlı

- **Günlük 2026-09-12'den başlıyor** (Dean kararı). Silinen: `daily_log` 649 satır,
  `wearable_sync` 1082 satır, 8 onaylanmamış Health Connect antrenmanı (`DELETE 649/1082/8`).
  Elle girilmiş veri yoktu — silmeden önce doğrulandı (protein/not/sebze/bel: 0 satır).
  Korundu: 2026-09-10 onaylı direnç kaydı. Yedek: scratchpad `backup-before-cutoff.sql` (212 KB).
  DB şimdi: `2026-09-12 → 2026-09-21, 10 gün, kilo 4, TA 4, adım ort 5634`.
- **`ops/import_samsung.mjs`** genişledi: `--from <tarih>` bayrağı · egzersiz seansları
  (yüzme 14001, salon 15002, 30 dk üstü tanımsız 0; yürüyüş 1001 **alınmaz**) · **saat rutini**
  → tek antrenman + `exercise_set` kayıtları. `6 ops testi` + `61 API testi` geçti,
  `typecheck --workspaces` EXIT=0.
- **Saat rutini çözümü kanıtlı:** gerçek arşivde 11 rutin seansı ayrıştı, örnek 22 Kas 2024 →
  `Leg_Press:48 · Leg_Extensions:36 · … · Ab_Crunch_Machine:60` (36 = 3×12). `count` = tekrar,
  `routine_datauuid` seansı bağlıyor, dinlenme satırları (tip 0, count yok) set üretmiyor.
- **`docs/SAAT-RUTIN.md`** yazıldı: neden serbest "Weight machine" seansında hareket kaybolduğu,
  program A/B/A′ için kurulacak üç rutin tablosu, Samsung kodu → `exercises.json` eşlemesi,
  süre okuma kuralı.
- **17 Eyl düzeltildi:** elle girilen "yüzme 60 dk, 21:00 sonrası" kaydı silindi (nabız
  06:30–07:50 arası yüksek, akşam veri yok); saatin iki kaydı kaldı (salon 60 dk + yüzme 16 dk).
- **19 Eyl adımı 7261 → 7486:** Health Connect dışa aktarımı gün bitmeden alınmıştı. Diğer
  günlerde iki kaynak birebir aynı (HC zaten Samsung'tan besleniyor).

## Kararlar

- **Sensör SDK / TensorFlow Lite yolu reddedildi.** Dean bir LLM cevabı getirdi (jest takibi,
  LSTM/1D-CNN, DTW). Gerek yok: Samsung rutin üzerinden hareket + tekrar **zaten** veriyor
  (2024 arşiv kanıtı). Wear OS uygulaması F0 = PWA kilidini kırardı. Ağırlık (kg) Samsung'da
  hiç yok — o Faz 3'te uygulamada girilecek.
- **Süre = saatin süresi.** Nabız penceresi (≥100 bpm) toplam eforu gösterir, seanstan uzundur.
  Sıra: pencereyi çıkar → yüzme kaydını düş → kalanın ~10 dk'sı geçiş, gerisi direnç.
  Tablo: 14 Eyl 63 dk / ~99 dk · 17 Eyl 76 / 80 · 21 Eyl 63 / ~70.
- **Yokluk kanıt değil.** 15 Eyl'de saatte yüzme kaydı yok ama yüzerken saat çıkarılmış olabilir;
  elle girilen 90 dk kaydı silinmedi, "saat doğrulamadı" notu eklendi.
- **`daily_log`'a yalnız boş alan yazılır** (önceki devirden geçerli).

## Tekrarlanmayacaklar

- **Bash/python heredoc'tan JS'e `\n` yazma.** İki kez sözdizimi kırdı (`process.stdout.write`
  ve test fixture'ı): `\\n` gerçek satır sonuna dönüşüyor. Çok satırlı JS → Write/Edit tool.
- **Regex'i template literal içine heredoc'tan yazma:** `\\.` → `.` oldu, `readTable` hiçbir
  dosyayı bulamadı.
- `readTable` prefix eşleşmesi: `com.samsung.shealth.exercise` `…exercise.custom_exercise`
  dosyasını da yakalıyordu. Artık `^<ad>\.\d+\.csv$` regex'i.
- `POST /api/wearable` mükerrer `(date,source,metric)` → Postgres 21000/500. Uçta tekilleştirildi
  (dün), testi var.
- Testleri ekledikten sonra **typecheck'i tekrar koş** (`npm test` yeşil olması yetmiyor).

## Dean'in elindeki iş (yapılmadı)

Samsung Health → Egzersiz → Rutin: `Full body` rutininin dinlenmesi 20 sn → **90 sn**, ve
program A/B/A′ için üç ayrı rutin (tablo `docs/SAAT-RUTIN.md`). Bir seans rutinden başlatılıp
yeni arşiv alınınca `npm run import:samsung -- <zip> --from 2026-09-12` hareketleri tekrar
sayılarıyla içeri alır.

## Sıradaki tek adım

Dean'e "Faz 2'ye başlayayım mı, yoksa önce rutini kurup veriyi mi görelim?" soruldu, cevap
gelmedi. Cevap yoksa **Faz 2**: `feature/ia-4-sekme` dalında önce `Drawer.tsx` + `App.tsx`
TABS dörde indirme (drawer olmadan sekme kaldırmak Hareket/Ayar'ı kör noktaya düşürür).
Detay: spec `docs/superpowers/specs/2026-09-21-tek-uygulama-ia-design.md` §9 Faz 2.
