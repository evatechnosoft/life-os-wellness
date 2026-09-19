# Handoff: Antrenman programı Dean'in mevcut düzenine oturtuldu · makine fotoğrafları bekleniyor

> 2026-09-18 19:18 · `dev` @ `eda4e5a` · kod değişmedi
> Commit EDİLMEMİŞ: `docs/PLAN-COACH.md` (onay bekliyor)
> Önceki devir: `2026-09-18-1755-olcum-protokolu-ve-7-gun.md` — ölçüm protokolü, sirke kararı,
> hafta sonu/7 gün planı orada. Tekrarlanmıyor, hepsi geçerli.

## Bu turda öğrenilen (Dean'in beyanı, doğrulanmadı — sunucuda antrenman kaydı yok)

Dean **zaten haftada 2 gün salona gidiyor: Salı ve Perşembe**, ~1 saat.
Yaptıkları: oturarak bench makine · butterfly · lat pulldown makine · row makine ·
biceps makine · triceps makine. Ardından **10–15 dk yüzme**, 20–25 m kulvarda
6–8 gidiş-dönüş (≈270–360 m).
Salon tam donanımlı: her türlü makine + her ağırlıkta dambıl.

## Verilen karar ve gerekçesi

Önceki turda Pzt/Çrş/Cum 3 günlük A-B-C programı yazılmıştı. **O program iptal edilmedi
ama uygulanmadı** — Dean'in kendi düzeni ortaya çıkınca onun üstüne kuruldu.
Gerekçe: var olan alışkanlığı bozmak uyumu kırar; en küçük düzeltme en iyi düzeltmedir.

**Tespit: mevcut programda bacak ve omuz sıfır.** İki göğüs, iki sırt, iki kol var.
Kalori açığında en büyük kas kütlesini uyarmamak kaybın oradan gitmesi demek.

**Düzeltme — gün sayısı değişmedi, her güne 2 bacak hareketi eklendi, bir kol çıkarıldı:**

- **Salı:** bench makine 3×8-12 · lat pulldown 3×8-12 · **leg press 3×10-15** ·
  **yatarak leg curl 3×10-15** · butterfly 3×12-15 · triceps 3×10-15
- **Perşembe:** row makine 3×8-12 · göğüs makine 3×8-12 · **leg extension 3×12-15** ·
  **hip thrust / dambıl RDL 3×10-15** · **makine omuz presi 3×8-12** · biceps 3×10-15

Üçüncü gün (Cumartesi) önerildi ama **dayatılmadı**: "iki günü düzenli yapmak,
üç günü aksatmaktan iyidir; dört hafta kaçırmadan yap, sonra konuşuruz."

Efor: 1.-2. hafta 3-4 tekrar kala, 3. haftadan sonra 0-2 RIR (COACH-EVIDENCE §4.2).
İlerleme: double progression, üst +2.5 / alt +5 kg — **kanıt değil, salon uygulaması**
diye açıkça etiketlendi (§4.5).
Yüzme: ağırlıktan sonra yapılması doğru sıra; "kardiyo planı sayma, adım hedefinin
yerine geçmez" denildi.

Tansiyon uyarısı programa işlendi: nefes tutma/Valsalva yok, ilk 3 hafta maksimal set yok,
baş dönmesi/göğüs baskısı → seti bırak, hekime söyle.

## Bekleyen — Dean'in göndereceği

1. **Her makinenin fotoğrafı.** İstenen çerçeve: makinenin tamamı yan açıdan (ağırlık
   kulesi dahil) · koltuk/kulp ayar kolları yakın · üstündeki kullanım şeması ·
   ağırlık pininin durduğu kademe. Karşılığında verilecek: oturuş/ayar, hareketin
   başlangıç-bitiş noktası, nefes anı, sık hata, uygulamada hangi kasa yazılacağı.
   Bu doğrudan `PLAN-COACH.md` S2'nin Türkçe tarafını besleyecek.
2. **Salı seansının ağırlıkları** → ikinci hafta artış planı.

Başlangıç ağırlığı **fotoğraftan verilemez**, verilmemeli. Test yöntemi bildirildi:
10 tekrar yap, "kaç tekrar daha yapabilirdim" sorusuna göre 5+ artır / 3-4 kal /
0-2 düşür / form bozuluyorsa düşür.

## Hâlâ açık (önceki turlardan)

- **Telefon güncellenmedi, senkron akmıyor.** Ayar'da OTA var (`c613bdc`, v0.16+).
- Ayardaki protein hedefi hâlâ 140 g; olması gereken 175-240, başlangıç 190.
- Tek sayfalık takip çizelgesi (artifact) önerildi, yanıt gelmedi.
- wger'de hazır Türkçe isim var mı — doğrulanmadı.

## Tekrarlama

- Pzt/Çrş/Cum programını yeniden dayatma; Dean Salı/Perşembe gidiyor, plan ona oturdu.
- Fotoğraftan kilo tahmin etme.
- Kol hacmini artırma önerisi getirme — bilinçli olarak azaltıldı, öncelik bacak.
- Yüzmeyi adım hedefinin yerine sayma.
- Senkronu "düzeldi" sayma; `docker logs life-os-wellness-api-1 | grep fit.evaitec.com`
  telefondan istek göstermedikçe kanıt yok.

## Next (tek adım)

Dean makine fotoğraflarını gönderecek → her makine için kullanım kartı yazılacak
(S2 Türkçe verisinin tohumu). Paralelde hâlâ bekleyen: Ayar → Güncelleme denetle.
