# Handoff: gün içi çoklu ölçüm yayında · telefon eski sürümde kilitli · OTA indirme kopuyor

> 2026-09-23 15:15 · `dev` @ `32f8e6a` · çalışma ağacı temiz, uzakla eşit
> Yayın: **0.30.0** (katalogda, sha doğrulandı). Dean'in telefonunda **kurulu değil**.

## Bu turda biten: gün içi çoklu ölçüm (0.30.0)

`daily_log` günde tek değer tutuyordu; aynı gün alınan ikinci tansiyon birincinin
üstüne yazılıyordu. 23 Eyl'de 07:51 → 122/82, 13:52 → 134/90, 13:58 → 128/78 ölçüldü,
yalnız sonuncusu kaldı.

- `db/009_measurement.sql` — her ölçüm kendi satırında (saat, büyük/küçük, nabız, kilo, not).
  **Migration konteyner içinden uygulandı** (`docker exec -i ... psql < db/009...`),
  host'tan bağlantı kopuyordu. Tablo yerinde, `\d measurement` doğruladı.
- `lib/measurements.ts` — günün değeri **11:00'e kadarki ölçümlerin ortalaması**; sabah
  ölçümü yoksa günün tümü. Kilo muaf (akşam tartısı da sayılır). Testler Dean'in gerçek
  verisiyle yazıldı, 355/355 web testi yeşil.
- `/api/measurements` GET/POST/DELETE · `ui/Measurements.tsx` Bugün > Ölçüm kartında.
- `daily_log` yine yazılıyor: trend, 7-gün ortalaması ve koç metinleri değişmedi.

## Kapanmayan iki sorun (Dean'de, cihaz tarafında)

### 1. Telefon eski sürümde — 0.30.0 hiç inmedi

Ekran görüntüsünde alt çubuk **beş sekme** (Bugün·Eva·Hareket·Hafta·Ayar). v0.30.0'da
alt çubuk **dört** sekme (Bugün·Plan·Ölçüm·Koç) ve Ayarlar drawer'da — beş sekmeli düzen
drawer'ı getiren `f685c5a`'dan (v0.27.0) **önceki** IA. "Ayar bara geri döndü" değil,
o sürüme hiç çıkılmamış.

**Çözülmemiş çelişki:** 13:12'deki ekran görüntüsünde dört sekme + "Ölçümleri çek"
vardı (= 0.29.1 kuruluydu), 15:00'te beş sekme. Ya ikinci bir cihaz ya araya eski bir
APK kurulumu girdi. Ayarlar > "Telefon uygulaması" kartındaki sürüm numarası soruldu,
cevap gelmedi.

### 2. OTA indirme kopuyor — sunucu değil, hat

Sunucu tarafı **sağlam, kanıtlı**: `fit.evaitec.com/ota/wellness-0.30.0.apk` indi,
24.596.490 bayt, sha256 `ceaf0fc27f540f9d243cf649579d92dcf3e4ff0f169ff1ec963a9cdadaac536c`
— katalogdaki değerle birebir; `aapt2 dump badging` → `versionName='0.30.0'`.
Telefonda hem uygulama içinden hem evaitecOTA'dan "indirilemedi", Dean'in son mesajı
**"Connection closed"**. 24 MB'lık indirme Cloudflare tünelinde kopuyor.

**Dean'e verilen geçici yol (sonucu bilinmiyor):** telefon tarayıcısından
`http://192.168.1.185:3011/ota/wellness-0.30.0.apk` — aynı dosya, tünelsiz.

**Kalıcı çözüm adayı (yapılmadı):** katalogdaki `downloadUrl` tek adres veriyor.
`ops/publish_ota.mjs` içindeki `base` sabitinin yanına yerel adres eklenip istemcinin
önce yereli deneyip tünele düşmesi — evaitecOTA'da bu desen zaten var
("önce ev sunucusu, sonra tünel" notu `evaitec-ota-tv` sürüm notunda).

## Hâlâ doğrulanmadı

- Telefonda API token ve Health Connect izinleri **hâlâ verilmedi** (ekranda token alanı
  placeholder). Token yoksa sunucuya yazılamaz **ve arka plan işi kurulmaz**. Bugünün
  uykusu bu yüzden sunucuda yok (23 Eyl'de yalnız 4 satır, hepsi Samsung arşivinden).
- 8 saatlik WorkManager'ın cihazda çalıştığı.
- Modelin `/sdcard/evaitec/llm` yolundan açıldığı.

## Tekrarlanmayacaklar

- **Host → Docker bağlantısı bugün kopuk**: `localhost:3011` ve `localhost:5433` host'tan
  ölü, `docker exec` sağlam, tünel (`fit.evaitec.com`) sağlam. Migration ve API testleri
  bu yüzden host'tan koşmuyor. `apps/api` testlerinden biri (`one caller burning the
  guess window`) bu nedenle 500 veriyor — **kod hatası değil**, Docker düzelince tekrar koş.
- `gh api --output` yok · `gh release download` tag ucu boş varlık listesi önbellekliyor
  (id ucundan indir) · `ifEmpty { continue }` Kotlin 2.2 öncesi derlenmiyor ·
  `curl -d` Türkçe karakteri bozuyor (`--data-binary @dosya`).
- Dexie `transaction('rw', ...)` tek tek tablo imzası **beş tabloda bitiyor**; altıncıda
  dizi biçimine geç.

## Koçluk durumu

- **Tansiyon eşiğe çok yaklaştı.** Sabah serisi 134→141→128→128→122; 7-gün ortalaması
  132.2/86.7. Kalibrasyon referansları 125/75 ve 129/79 (manşetli cihaz) — yani bugünkü
  128/78 gerçek, kalibrasyon kayması değil. **Dinlenme 90 sn'de kalıyor**, 3 gün daha
  aynı bantta gelirse 75 sn.
- Ölçüm protokolü değişti: **sabah, kalkınca, kahveden önce, iki ölçüm** — günün değeri
  bunların ortalaması. Gün içi ölçümler kaydedilir ama trende girmez.
- Kalori: gerçek salon seansları ort. 473 kcal/55 dk; programın beklentisi A/B 470–520,
  A′ 560–650. Saatin direnç kalorisi nabız temelli olduğu için **%15–25 şişik**.
- Seans kaydı: rutin kurulmayacak (Dean kararı), süre+nabız+kalori yeterli.
- `docs/PLAN-WEAR.md` §9: saatten doğrudan okuma kararı yazıldı (Samsung zinciri
  atlanacak), sıra Faz 2 UI'dan sonra.

## Sıradaki tek adım

**0.30.0'ı telefona kurdur** (yerel adresten indirme yolu verildi), sonra token +
Health Connect izinleri. İkisi tamamlanınca `/api/wearable`'da 23 Eyl uyku satırının
düştüğünü doğrula — arka plan senkronunun ilk gerçek kanıtı o olacak.

Bekleyenler: Faz 2 UI (`feature/bugun-kartlari`, `ui/DayStrip.tsx` + `ui/SessionCard.tsx`) ·
OTA'ya yerel adres yedeği · seans kartında hâlâ "özel aç" diyen Hip thrust (B) ve
Calf press (A′) · Dean'in seans sonuna eklediği mobility hareketinin adı (üç kez soruldu).
