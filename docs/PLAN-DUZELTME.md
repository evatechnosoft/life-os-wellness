# PLAN — Uygulamadan düzeltme ve geçmiş güne ekleme

> 2026-10-03 · Durum: D1–D4 CANLIDA (PR #43 #44 #46 #47 #48, paket `8d8e326a`), telefonda DOĞRULANMADI · Sahip: Dean
> Tetik: Dean, 3 Eki — "Uygulama sadece server ve buradan değişimlerle şekilleniyor. Düzeltme ve günlük ekleme uygulamadan da yapılabilsin."

## Sorun

Bugün veri iki yoldan giriyor: telefondaki uygulama ve sohbet (Claude → API). Sohbet her tarihe her şeyi yazabiliyor; uygulama yalnız **bugüne** ve yalnız bazı alanlara yazabiliyor. Sonuç: yanlış bir kaydı (ör. 3 Eki sucuk dilimi, 2 Eki "press 35") düzeltmek ya da unutulan bir ölçümü eklemek için Dean'in sohbete yazması gerekiyor.

Envanter (kod, 3 Eki — `App.tsx:66`, `store.ts:251`):

| Boşluk | Etki |
|---|---|
| Uygulama yalnız bugünü açıyor; tarih seçici yok | Dünkü öğün/seans/ölçüm düzeltilemiyor, eklenemiyor |
| Tartı/BIA (OKOK) için elle giriş ekranı yok | Yağ %, iskelet kası, visseral yalnız sohbetten giriyor |
| Sunucuda silinen kayıt telefondan silinmiyor | Sohbetten silinen öğün uygulamada sonsuza dek kalıyor |
| Sunucudan gelen ölçüm `daily_log` kilo/TA'yı güncellemiyor | Sohbetten yazılan ölçüm trende girmiyor |
| SessionLog sunucudaki setleri göstermiyor | Sohbetten düzeltilen seans uygulamada eski görünüyor |
| Set silinemiyor (POST upsert, silmez) | Yanlış hareket kalıcı |
| Wearable yerel anahtarı `date:metric` | İki kaynak (okok + samsung) aynı metriği yazınca biri kayboluyor |
| `daily_log.notes` için UI yok, retro kutusu sonradan gelen veriyi göstermiyor | Sohbetten yazılan not/retro görünmüyor |
| Pull yalnız son 30 gün | Daha eski düzeltme telefona inmiyor |

## Kural (değişmez)

1. **Sunucu tek gerçek.** Uygulama ve sohbet iki eşit yazar; ikisi de aynı API'yi kullanır.
2. Sohbetin yazabildiği her kayıt türü uygulamadan da **eklenebilir, düzeltilebilir, silinebilir** — her tarih için.
3. Çakışmada son yazan kazanır; ama telefonda henüz gönderilmemiş (outbox'ta bekleyen) kayıt pull ile ezilmez.
4. Bugün için giriş akışı uzamaz (60 sn kuralı). Geçmiş gün ek bir dokunuşla açılır.
5. Hepsi web değişikliği → canlı paketle gider, **APK gerekmez.**

## Adımlar (her biri ayrı PR, sırayla)

### D1 — Gün seçici (en büyük kazanç)
- `App.tsx` `date` state'i zaten Today'e iniyor; tüm editörler (`Meals`, `Measurements`, `SessionLog`, retro, QuickAdd) `date` prop'u alıyor.
- `DayHeader`: ‹ › okları + Hafta sekmesinde güne dokun → o gün açılır. Üstte şerit: "2 Eki Perşembe · Bugüne dön".
- Ölçüm saati düzenlenebilir (bugün = şimdi, geçmiş gün = 08:00 varsayılan).
- 30 günden eski güne gidilirse o haftanın `pullRange`'i çekilir.
- Gece yarısı / aşağı çekme yalnız kullanıcı bugündeyse bugüne döndürür.
- Kabul: telefonda 2 Eki'yi açıp öğün düzenle → API GET'te değişmiş.

### D2 — Sunucudaki silme telefona iner
- Saf fonksiyon (TDD): `reconcile(localIds, serverIds, pendingIds) → silinecekIds`. Aralıktaki yerel satır sunucuda yoksa ve outbox'ta beklemiyorsa silinir.
- `pullRange` her tablo için bunu uygular; bekleyen outbox kaydı olan satırı ezmez (kural 3).
- Kabul: sohbetten bir öğün silinir → telefonda aşağı çek → kaybolur.

### D3 — Tartı ekranı (OKOK elle)
- Hafta → "Vücut kompozisyonu" kartında "Tartı gir": kilo, yağ %, yağ kg, iskelet kası, kas, su %, visseral, kemik, BMR (sayısal klavye, boş bırakılan yazılmaz).
- Yazma: `recordMetrics` source=`okok` + kilo `saveDaily`. Kartta satıra kaydır = düzenle/sil.
- Wearable yerel anahtarı `date:source:metric` (Dexie sürüm yükseltmesi, eski satırlar yeniden çekilir).
- API: `DELETE /api/wearable?date=&source=` (yanlış tartı girişini silmek için).
- Sonraya: OKOK ekran görüntüsünden okuma (mevcut fotoğraf → LLM yolu). Elle yazmak can sıkarsa eklenir.

### D4 — Tutarlılık
- Ölçüm → `daily_log` sabah ortalaması hesabı **sunucuya** taşınır (`POST/DELETE /api/measurements` sonrası). Böylece sohbet ve uygulama aynı sonucu üretir; istemcideki kopya kalkar.
- SessionLog durumunu `workout.sets`'ten okur (yerel `session_log:<date>` yalnız taslak).
- `POST /api/workouts` set listesini **değiştirir**: gövdede olmayan set silinir. (Sohbet tarafındaki "DELETE + yeniden POST" kuralı da kalkar.)
- Retro kutuları sonradan gelen veriyi gösterir (kontrollü alan ya da `key`).
- "Günün notu" alanı → `daily_log.notes` (senkronlu). `note_log` yerel kalır.

### D5 — Hafta kartından düzeltme (isteğe bağlı)
- Hafta sekmesindeki her gün satırı dokununca D1'deki gün görünümünü açar; ayrı ekran yazılmaz.

## Bilerek yapılmayanlar
- Kayıt bazında "kim yazdı" izi ve çakışma birleştirme: tek kullanıcı, son yazan kazanır yeterli.
- Yeni "düzeltme" ekranı: mevcut kartlar + gün seçici aynı işi görür.
- Sohbetin yazmasını kısıtlamak: sohbet hızlı yol olarak kalır.

## Doğrulama (her PR)
- `npm test` + `npm run typecheck --workspaces` yeşil; D2 ve D4 hesapları TDD.
- API testi: ZimaOS geçici postgres + `ssh -L 5433:127.0.0.1:5440 zima`.
- Deploy: predeploy yedek → `git pull` → compose `up -d --build api` → `bundle.json` sürümü değişti.
- Kabul telefonda: (1) 2 Eki öğününü düzelt, (2) bugüne tartı gir, (3) sohbetten silinen öğün telefonda kaybolur, (4) sohbetten yazılan ölçüm haftalık kilo trendine girer.

## Tahmini sıra
D1 → D2 → D3 → D4. D1 tek başına sorunun çoğunu çözer; D2 olmadan sohbet + uygulama birlikte kullanılınca hayalet kayıt kalır, o yüzden hemen arkasından.
