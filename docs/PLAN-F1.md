# PLAN — F1: Eva hatırlasın, takip etsin, saatten okusun

Kaynak: 2026-09-10 akşamı Dean'in telefonda ilk gerçek kullanımı. F0 bitti, uygulama
telefonda çalışıyor, Eva konuşuyor. Bu plan dört isteği sıraya koyuyor. Her madde
"yapılabilir mi" sorusuna dürüst cevap veriyor; maliyeti yüksek olanlar ayrı işaretli.

---

## 0. Zaten yapıldı (10 Eylül akşamı)

Sohbet akışı WhatsApp gibi çalışıyor: yeni mesaj alta gelir, eskiler yukarı kayar,
kaydedilen şey "Kaydedildi · …" satırı olarak akışta kalır. Aynı taslak iki kez
kaydedilemez. Konuşmanın son 12 turu modele gidiyor, yani takip sorusu çalışıyor.

Telefonda hâlâ eski ekranı görüyorsan Pages yayını gecikmiştir; sayfayı yenile.

---

## 1. Eva geçmişi bilsin — "yazdıkça eksiği bilsin"

**İstek:** Dün doğru yazdıysam bugün onu benden istesin. Bugün ne girdiğimi bilsin,
girilmiş şeyi tekrar sormasın.

**Durum:** API'de bunun yeri hazır. `POST /api/chat` bir `context` alanı kabul ediyor ve
sistem mesajına ekliyor, ama web tarafı hiç doldurmuyor. Yani Eva şu an her sohbete
sıfırdan başlıyor.

**Yapılacak:**
- `apps/web/src/lib/store.ts` içine `buildContext(date)`: bugünün `daily_log` satırı,
  bugünün antrenmanları ve son 7 günün özeti (ortalama protein, adım, kilo eğilimi,
  hangi gün hangi bölge çalışıldı).
- `understand()` bu metni `context` olarak göndersin.
- Sistem mesajına kural: "Bugün için girilmiş alanı tekrar sorma. Kullanıcının her gün
  girdiği ama bugün eksik olan alan varsa bir kere hatırlat, ısrar etme."

**Maliyet:** küçük. Yeni tablo yok, yeni uç yok. Yarım gün.

**Ölçüt:** Sabah "70 kilo" yazdıktan sonra Eva bir daha kilo sormuyor; akşam "protein
girmedin" diye bir kez hatırlatıyor.

---

## 2. Antrenman ajandası — "göğüs günü, bacak günü"

**İstek:** Haftalık program tanımlayayım (Pazartesi göğüs, Salı sırt…), Eva bugünün
hangi gün olduğunu bilsin, o güne ait girdiğimi takip etsin.

**Durum:** `workout` tablosu `muscle_groups` tutuyor, yani geçmiş var; program yok.

**Yapılacak:**
- `db/002_split.sql`: `training_split` (weekday 0-6, muscle_groups text[], note).
  Tek kullanıcı olduğu için satır sayısı 7.
- API: `GET/PUT /api/split`.
- Ayarlar ekranına haftanın yedi günü için bölge seçici.
- Bugünün bölgesi `context`e girsin. Eva "bugün bacak günü, kaç set yaptın?" diyebilsin.
- Bugün ekranında küçük bir satır: "Bugün: bacak · henüz kayıt yok".

**Maliyet:** orta. Bir migration, bir uç, bir ayar ekranı. Bir gün.

**Ölçüt:** Salı günü hiçbir şey yazmadan Eva'ya "ne yapıyorum bugün" dediğimde doğru
bölgeyi söylüyor; o gün girdiğim setleri o bölgeye yazıyor.

---

## 3. Saatten okusun

**İstek:** Adım, nabız, uyku saatten gelsin, ben yazmayayım.

**Durum — burası dürüst konuşulacak yer.** `capacitor-health` eklentisinin
`queryAggregated` çağrısı yalnız üç şey veriyor: `steps`, `active-calories`,
`mindfulness`. **Nabız, uyku, toplam kalori ve beslenme yok.** Bu kütüphanenin sınırı,
bizim eksiğimiz değil. Ayrıca bu yalnız APK'da çalışır, PWA'da Health Connect yok.

**İki aşama:**

**3a. Bugün alınabilen:** adım ve aktif kalori otomatik çekilsin, günde birkaç kez
`daily_log`a yazılsın, Eva bunları sormasın. Bu zaten kısmen var, düzenli hale gelecek.
*Maliyet: küçük.*

**3b. Nabız ve uyku:** kendi Health Connect eklentimizi yazmak gerekiyor — Kotlin
tarafında `HealthConnectClient` ile `HeartRateRecord`, `SleepSessionRecord`,
`NutritionRecord` okumak. Gece horlama ölçümü için zaten kendi Kotlin eklentimizi
yazmıştık, yani yol biliniyor.
*Maliyet: yüksek. İki-üç gün, ve yalnız APK'ya yarar.*

**Karar gereken:** 3b'ye girmeden önce Samsung Health'in bu verileri Health Connect'e
gerçekten yazdığını telefonda doğrulamak lazım. Yazmıyorsa emek boşa gider.

---

## 4. Öğrenme — ne olduğu ve ne olmadığı

**İstek:** "Öğrenir olsun."

**Olmayacak olan:** model eğitimi. Kendi modelimizi eğitmiyoruz, buna gerek de yok.

**Olacak olan:** Eva'nın senin verinle konuşması. Madde 1 ve 2 tam olarak bu. Üstüne
ucuz bir katman daha eklenebilir: sık kullandığın kalıpların hatırlanması. Örneğin
"tavuk" dediğinde her seferinde aynı protein değerini varsayması. Bunun için
`food_memory` diye küçük bir tablo yeter: isim, protein, kcal, kaç kez onaylandığı.

**Maliyet:** küçük-orta. Madde 1 bittikten sonra bakılır, önce o.

---

## Sıra

1. **Madde 1** — en çok faydayı en az işle veren bu. Önce bu.
2. **Madde 3a** — adım otomatik gelsin, elle giriş azalsın.
3. **Madde 2** — ajanda, program takibi.
4. **Madde 3b** — telefonda doğrulama yapıldıktan sonra karar.
5. **Madde 4** — en sona.

## Açık kalan altyapı işleri (bu plandan bağımsız)

- API hâlâ Dean'in PC'sinde. PC kapalıyken Eva susuyor. ZimaOS'a taşımak duruyor,
  ZimaOS 10 Eylül'de ping'e yanıt vermiyordu.
- `API_TOKEN` 10 Eylül'de bir kez terminale basıldı. Döndürülmesi öneriliyor, acil değil.
