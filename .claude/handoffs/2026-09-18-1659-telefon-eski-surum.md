# Handoff: Senkron kök nedeni = telefondaki eski APK · koçluk katmanı planı onayda

> 2026-09-18 16:59 · `dev` @ `eda4e5a` · kod değişmedi
> Commit EDİLMEMİŞ yeni dosya: `docs/PLAN-COACH.md` (onay bekliyor)
> Önceki devir: `2026-09-18-1518-kocluk-katmani-plani.md` — oradaki her şey geçerli, bu dosya üstüne yazar.

## Bu turda kapanan: senkronun kök nedeni bulundu

Telefon **eski derlemeyi** çalıştırıyor. Kanıt: ekran görüntüsünde görünen
"Sunucu bağlı değil, sorunu yanıtlayamıyorum. Söylediğini not olarak sakladım."
metni `apps/web/src/` içinde **yok** (grep boş döndü). Tüneli açmanın bir şey
değiştirmemesinin sebebi bu — sorun tünelde değildi, istemcideydi.

Yan bulgu: ekranın üstündeki "çevrimiçi" yanıltıcı. `App.tsx:98`'de o etiket
`online` değişkeninden geliyor ve **internet var mı**'yı söylüyor, sunucuya
ulaşılıyor mu'yu değil. Aynı ekranda "çevrimiçi" ile "sunucu bağlı değil" yan yana
duruyor. `pending > 0` olsa "N kayıt senkronda" yazardı — düz "çevrimiçi" yazıyor,
yani **kuyruk boş**. **Doğrulanmadı ama olası:** eski sürüm söylenenleri kuyruğa
almayıp "not" olarak bir kenara yazıyor; 15–18 Eylül girdileri senkronla gitmeyecek.

## Sunucuya yazılan veri (doğrulanmış, PUT yanıtı alındı)

- `2026-09-09` (Çarşamba) → `weight_kg: 109.1` · mevcut `steps: 5514` korundu
- `2026-09-14` (Pazartesi) → `weight_kg: 108.4` · mevcut `steps: 2195` korundu

Dean sözlü verdi, ben API'den yazdım. `upsert` yalnız gönderilen sütunu ezer
(`routes.ts:131`), o yüzden adım kayıtları bozulmadı. **Bunlar sunucuda, telefonda
değil** — eski sürüm aynı tarihe boş kayıt yazarsa üstüne binebilir.

## Koçluk tarafı: düzeltilen okuma hatası

Dean "21 g protein" diye aktarmıştı; ekranda `30 / 140 g` ve "Protein hedefinin
**%21'i**" yazıyor — 21 yüzde, gram değil. Ayrıca öğle yemeği girilmemiş
(~50 g tahmin edilmişti), bugünün gerçeği 30 değil ~85 g.

**Ayardaki protein hedefi yanlış: 140 g.** Bu ~78 kg'a denk geliyor, Dean 109 kg.
Kanıt aralığı 1.6–2.2 g/kg → **175–240 g**; başlangıç için 190 g önerildi.
Dean henüz değiştirmedi.

**Kilo hızı:** 5 günde 0.7 kg ≈ haftalık 0.98 kg. 109 kg için %0.5–1 aralığı
0.55–1.09 kg → üst uçta. İki ölçüm trend değil; karar 7 günlük ortalamadan çıkacak.

Önceki turlarda verilen ve hâlâ geçerli olanlar: takviye önerilmedi (garsinya+yeşil
çay DILIN karaciğer vakaları), 140/90 tek ölçüm için 7 günlük ölçüm protokolü,
tartıda sıralı dara ile bileşen ayırma + "bir hafta tart, gözünü kalibre et, bırak".

## Tekrarlama

- Tüneli suçlama: tünel 18 Eyl 07:18'den beri ayakta (`Registered tunnel connection` ×4),
  `https://fit.evaitec.com/health` → `{"ok":true}`. Sorun istemcide.
- "çevrimiçi" etiketini sunucu erişimi sanma (`App.tsx:98`).
- `/api/daily` query parametreleri `start`/`end` — `from`/`to` 400 döner.
- wger'i "AGPL yüzünden elendi" diye anlatma; gerekçe CC-BY-SA 3.0 (veri/görsel).
  Açık ve **doğrulanmamış** soru: wger'de hazır Türkçe isim var mı — varsa
  `data/exercise-tr.json` elle eşleme yükünden kurtarır ve kararı yeniden tarttırır.

## Next (tek adım)

Dean telefona **v0.18.0 APK**'yı kursun (release'de `wellness-0.18.0.apk`), açıp
ekranı aşağı çeksin. Sonra doğrula:
`docker logs life-os-wellness-api-1 | grep fit.evaitec.com`
Telefondan gelen istek görünürse senkron kapanmış olur; ondan sonra S1 (profil:
`db/006_profile.sql` + `lib/profile.ts` + `gather`'a profil satırı) başlar.
