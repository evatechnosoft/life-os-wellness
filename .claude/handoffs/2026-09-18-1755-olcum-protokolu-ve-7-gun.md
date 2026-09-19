# Handoff: Ölçüm protokolü + 7 günlük plan verildi · senkron hâlâ telefonda bekliyor

> 2026-09-18 17:55 · `dev` @ `eda4e5a` · kod değişmedi
> Commit EDİLMEMİŞ: `docs/PLAN-COACH.md` (onay bekliyor)
> Önceki devir: `2026-09-18-1659-telefon-eski-surum.md` — kök neden analizi orada, tekrarlanmıyor.

## Hedef

Eva'yı danışılabilir PT + diyetisyen yapmak (plan `docs/PLAN-COACH.md`, S1→S5).
Bu oturumun ikinci yarısı ağırlıkla **canlı koçluk** oldu: Dean gerçek verisiyle
sordu, cevaplar verildi. Kod tarafında ilerleme yok.

## Bu turda doğrulanan (tool çıktısı var)

- **Uygulama içi OTA var.** `Settings.tsx › PhoneAppUpdate` — "Kurulu sürüm X",
  "Güncelleme denetle" / "İndir ve kur". Commit `c613bdc` (14 Eylül),
  `git tag --contains` → v0.16.0, v0.17.0, v0.18.0 hepsinde mevcut.
  Yani Dean'in sürümü 14 Eylül sonrasıysa Ayar'dan tek düğmeyle güncellenir,
  elle APK gerekmez. **Telefondaki sürümün hangisi olduğu doğrulanmadı.**

## Verilen koçluk kararları (gerekçeleriyle)

- **Tartı:** her sabah, uyan → tuvalet → soyun → tart, kahvaltı/su öncesi,
  aynı tartı + sert zemin (halı 1–2 kg yanıltır). Tek güne bakma, 7 gün ortalama.
- **Bel:** haftada bir, pazartesi sabahı, tartıdan sonra. En alt kaburga ile iliak
  krest arasının **tam ortası**, normal ekspiryum sonu, mezura değsin gömülmesin.
  Yöntem bir kez seçilir, değiştirilmez. Gerekçe: kilo dururken bel düşebilir,
  `dietBreak` bunu kullanıyor.
- **Gerekli ölçümler üç tane:** tansiyon (sabah+akşam, 7 gün — bu hafta sonu başlar),
  adım (otomatik), antrenman kaydı (kas korunuyor mu'nun tek göstergesi).
  **Gerekmeyen:** biyoimpedans yağ ölçümü (gün içi 3–4 puan gürültü), çevre ölçümleri.
- **Sirke: kaldıraç değil.** 2025 meta-analizi (10 RKÇ, 789 kişi) kilo/bel düşüşü
  buluyor AMA alanın vitrini olan 2024 BMJ çalışması **Eylül 2025'te geri çekildi**
  (istatistik, ham veri, önceden kayıt yok). Görece sağlam tek etki: yüksek
  karbonhidratlı öğün öncesi postprandiyal glisemi. **Gerçek risk diş** — pH 2–3,
  mine 5.5'te çözünür, kalıcı. Kullanılacaksa: 15 ml, büyük bardakta seyreltilmiş,
  öğünle, pipetle, ardından su ile çalkala ama 30 dk fırçalama.
  Ayrıca idrar söktürücü/şeker düşürücü ilaçlarla etkileşir → hekim sorusu.
- **Hafta sonu 19–20 Eylül: kısıtlama YOK, sadece ölçüm.** Gerekçe: hafta sonu plan
  başlatmak uyumu kırar, "nasılsa bozuldu" kararını getirir (COACH-EVIDENCE §9.1).
  Tek kural: tuzluğa dokunma + her öğüne sebze ekle. Cmt 45 dk yürüyüş, Paz alışveriş.
- **Pazartesi 21 Eylül'den 7 gün:** protein 190 g (4×45), sebze 5 porsiyon,
  adım 6.000 (şu an ~4.000, sıçrama yok — 7.000 hedefi Lancet 2025), tuzluk yok,
  tek yemek değişikliği **pilav → bulgur** (lif→tansiyon: SKB −4.3 / DKB −3.1 mmHg).
  Haftada 3 gün direnç, 45 dk. **Program yazılmadı — ekipman bilgisi bekleniyor
  (salon / ev dambıl / vücut ağırlığı). Dean'e soruldu, cevap gelmedi.**
- 27 Eylül akşamı bakılacak: 7 gün kilo ortalaması, 14 gün tansiyon ortalaması,
  190 g'ı kaç gün tutturdu, bel farkı.

## Açık / bekleyen

- **Telefon güncellenmedi, senkron akmıyor** (bu turda yeni kanıt aranmadı).
- Ayardaki protein hedefi hâlâ **140 g**; 109 kg için olması gereken 175–240,
  başlangıç 190. Dean değiştirmedi.
- Ekipman sorusu cevapsız → S3 program üretimi başlayamaz.
- Dean'e tek sayfalık takip çizelgesi (artifact) önerildi, yanıt gelmedi.
- wger'de hazır Türkçe isim var mı — hâlâ **doğrulanmadı**.

## Tekrarlama

- Hafta sonu için kısıtlama/kalori planı verme — karar bilinçli, gerekçesi yukarıda.
- Sirkeyi "işe yarıyor" diye anlatma; geri çekilen çalışmayı kanıt sayma.
- Telefon senkronunu "düzeldi" sayma — API logunda telefondan gelen istek görülmedikçe kanıt yok.
- `/api/daily` parametreleri `start`/`end`.
- wger gerekçesi CC-BY-SA, AGPL değil.

## Next (tek adım)

Dean **Ayar → "Güncelleme denetle"**ye bassın (sürümü 14 Eylül sonrasıysa orada çıkar,
değilse release'den `wellness-0.18.0.apk`). Kurup ekranı aşağı çektikten sonra doğrula:
`docker logs life-os-wellness-api-1 | grep fit.evaitec.com`
Telefondan istek görünürse senkron kapanır; sonra S1 (profil) başlar.
