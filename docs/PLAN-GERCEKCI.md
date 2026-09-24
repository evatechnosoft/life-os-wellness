# PLAN-GERÇEKÇİ — Uzman gözüyle: uygulamayı gerçek hayatta işe yarar hale getirmek

> 2026-09-24 · Yazan: ürün uzmanı personası (§1) · Kaynak: canlı API (`fit.evaitec.com`, 10–24 Eyl GET),
> `docs/SPEC.md`, `docs/PROGRAM-2026-09.md`, `docs/GUNLUK-2026-09-21.md`, son devir (`.claude/handoffs/latest.md`), kod envanteri.
> Kilitli kararlar (`AGENTS.md`) aynen geçerli: PWA+Capacitor, offline-first, kalori hedefi yok, 7-gün ortalama, tek kullanıcı.

---

## 1. Persona — "Saha uzmanı"

**Kim:** 15 yıl klinik obezite/prediyabet programlarında çalışmış bir diyetisyen-egzersiz fizyoloğu +
sağlık uygulaması ürün yöneticisi. Onlarca takip uygulamasının 3. haftada terk edildiğini görmüş.

**Tek sorusu:** "Bu özellik Dean'in 12 haftanın sonunda bel çevresini, HbA1c'sini ve tansiyonunu
düşürme olasılığını artırıyor mu — yoksa sadece uygulamayı zenginleştiriyor mu?"

**Çalışma kuralları**
1. **Önce veri, sonra fikir.** Öneri canlı veriden bir boşluğa bağlanmadan yazılmaz (§2 tablosu).
2. **Özellik değil davranış.** Başarı = kayıt sürekliliği + haftalık karar. Yeni ekran başarı değildir.
3. **Kaydı Dean değil sistem taşır.** Otomatik gelebilen veri elle istenmez; elle istenecekse ≤ 2 dokunuş.
4. **Plan stabilitesi.** Program 4 haftadan önce değiştirilmez; değişiklik ancak veriyle (set/tekrar, 7-gün ortalama).
5. **Klinik sınır.** Teşhis/ilaç yok (`COACH-PERSONA.md` §2); ölçüm protokolü ve hekime götürülecek özet var.
6. **Silme > ekleme.** Kullanılmayan her yüzey bakım yükü ve dikkat dağıtıcıdır.

**Ton:** kısa, doğrudan, sayıyla. "Güzel olur" değil, "bu boşluğu kapatır, şu metrikle ölçülür".

---

## 2. Teşhis — canlı veri ne söylüyor (10–23 Eyl, 14 gün)

| Alan | Kayıt | Yorum |
|---|---|---|
| Kilo | 7/14 gün (tamamı 19 Eyl sonrası düzenli) | 109.1 → 107.8. Trend doğru yönde; ilk hafta boşluklu. |
| Adım | 12/12 gün | 3.642 → 9.388. **En büyük başarı.** Ama 22–23 Eyl elle düzeltildi. |
| Tansiyon | 6/14 gün | Tek ölçüm/gün; 2'li sabah protokolü yok, kalibrasyon belirsiz → 28 Eyl kararı bu yüzden askıda. |
| Öğün | **4/14 gün** (19, 21, 22, 23 Eyl) | Protein hedefi (180 g) çoğu gün ölçülmüyor. |
| Antrenman seti | **0 / 3 direnç seansı** (`sets_total` hep null) | 21 Eyl'de 18 asıl set yapıldı — sohbette var, uygulamada yok. İlerleme kuralı veri bekliyor. |
| Retro | **0 kayıt** | Akşam retro kartı hiç kullanılmamış. |
| Bel | 1 kayıt | Protokol yeni (Pazartesi). |
| Saat verisi | 4 kaynak: `health_connect`, `samsung_csv`, `shm`, `okok` | **Health Connect 22 Eyl'den sonra susmuş**; 23 Eyl yalnız CSV importu. Kullanıcıya uyarı gösterilmiyor (doğrulanmadı: cihazda). |

**Ana bulgu:** Gerçek arayüz **uygulama değil, sohbet**. Dean yemeği, seti, tansiyonu sohbette söylüyor;
ajan API'ye yazıyor ya da hiç yazmıyor. Uygulama bir "ayna" ve ayna yarım.

**İkincil bulgular**
- **Yapım temposu > kullanım temposu:** 14 günde 247 commit, 31 sürüm; aynı sürede 4 günlük öğün kaydı.
- **Program çalkantısı:** 4 günde split iki kez (bölge → A/B/A′), yüzme eklendi-kalktı. Adaptasyon için 4–6 hafta sabit uyaran gerekir.
- **Klinik tablo net:** HbA1c 5.9, TG 302, bel/boy 0.67, tansiyon ort. ~130/85. En güçlü kaldıraçlar: bel çevresi, yemek sonrası yürüyüş, direnç antrenmanı sürekliliği, tuz. Uygulamanın öncelik sırası bununla hizalı olmalı.

---

## 3. Öneriler — öncelik sırasıyla

### P0 — Kayıt boşluklarını kapat (bu hafta)

**P0.0 Hata: saat senkronu onaylanmış seansı eziyor** (`apps/web/src/lib/health.ts:285-304`)
- Her 15 dk'lık `syncHealth`, Health Connect seansını aynı `stableId` ile yeniden yazıyor:
  `type` saat tipine, `sets_total` null'a dönüyor, `notes` eziliyor, `weight_kg` düşüyor
  (yalnız `muscle_groups`, `reps_total`, `needs_review` korunuyor). `upsertWorkout` farkı görüp outbox'a atıyor,
  sunucu `ON CONFLICT` ile üzerine yazıyor. Onay kartında girilen set bir sonraki senkronda kaybolur.
- Canlı veride iz: 21 ve 23 Eyl direnç seansları hâlâ `needs_review: true`, `sets_total: null`.
- Düzeltme: `existing` varsa ve `needs_review !== true` ise seansı atla (nabız penceresi yolu bunu zaten yapıyor, `health.ts:326`);
  onaysızsa yalnız `duration_min` güncellenir. Regresyon testi: onaylı seans + tekrar senkron → `sets_total` korunur.
- Bu düzelmeden P0.1 anlamsız: girilen set silinir.

**P0.1 Set kaydı: "Geçen seferki gibi" tek dokunuş**
- Sorun: 3 direnç seansında 0 set. İlerleme kuralı (3 sette 12+ → +%5) çalışamıyor.
  `ui/WorkoutForm.tsx` seansa tek toplam `sets/reps/kg` yazıyor; hareket bazlı giriş yok.
- Sunucu hazır, istemci kullanmıyor: `exercise_set` tablosu (`db/008_plan.sql`), `POST /api/workouts` `sets[]` alıyor,
  `GET /api/exercise-sets` "geçen sefer" değerini döndürüyor. Yeni şema gerekmez.
- Çözüm: seans ekranında plandaki her hareket için **son seansın ağırlık×tekrarı önceden dolu**; set başına tek dokunuş ✓,
  sapma varsa ±2.5 kg / ±1 tekrar. Kaydet → `sets[]` gönderilir, `sets_total` türetilir.
- Ölçüt: sonraki 3 direnç seansında `sets_total > 0`; set girişi hareket başına ≤ 10 sn.

**P0.2 Sync sağlık rozeti + sessiz hataları görünür kıl**
- Sorun: Health Connect 22 Eyl'den beri yazmıyor, kimse fark etmedi; adım elle düzeltiliyor.
  Kodda nedeni görünmez: `syncHealth` her aşamada boş `catch {}` (`health.ts` 7 yer), `/api/wearable` POST'u
  outbox'ı atlıyor (yeniden deneme yok), `scheduleBackgroundSync` false dönse de bir şey gösterilmiyor,
  `outbox_rejected` (`store.ts:162`) hiçbir ekranda okunmuyor, yanlış token kuyruğu sonsuza dek durduruyor.
- Çözüm: her aşama son başarı zamanını + son hatayı tek bir `sync_status` kaydına yazar; Bugün başlığında tek rozet:
  `Saat: 3 sa önce` / `Saat: 2 gün yok — izin/yeniden bağla` / `2 kayıt reddedildi — gör`.
  Wearable POST'u outbox'a alınır.
- Ölçüt: veri 24 saatten eski olunca rozet kırmızı; red edilen kayıt ekranda görülür.

**P0.3 Tek kaynak kuralı (adım/nabız/uyku)**
- Sorun: 4 kaynak aynı metriği yazıyor; hangisinin geçerli olduğu ajan hafızasında.
- Çözüm: metrik başına öncelik sırası sabit ve kodda (`health_connect` > `samsung_csv` > `shm` > `manual`),
  `daily.steps` bu kurala göre türetilir; elle düzeltme yalnız "override" olarak işaretlenir.
- Ölçüt: aynı gün için tek sayı; override sayısı rozette görünür.

### P1 — Sohbeti birinci sınıf giriş kanalı yap (1–2 hafta)

**P1.1 Sohbet → kayıt köprüsü (onaylı)**
- Gerçek davranış bu; ona karşı savaşma. Sohbette söylenen "chest press 35×12, 40×12, 45×10" veya
  "öğlen mücver + pirzola" → ajan yapılandırılmış kayıt önerir, uygulamada **"Onay bekleyen 3 kayıt"** kartı çıkar, tek dokunuşla kabul.
- `needs_review` alanı zaten var (12/12 antrenmanda dolu) — bu akış onu kullanır. Yeni tablo gerekmez.
- Ölçüt: sohbette bahsedilen her öğün/set 24 saat içinde kayıtta.

**P1.2 Fotoğraf öğün = varsayılan giriş**
- 23 Eyl'de 5 öğünün çoğu `photo`. Tahmin (`estimated`) zaten var; eksik olan **güven aralığı**
  ("480 kcal ±150") ve hızlı düzeltme (porsiyon ½ / 1 / 1½). Haftalık ortalamada tahmin payı gösterilir.

**P1.3 Retro'yu kaldır ya da tek soruya indir**
- 0 kullanım. 3 soruluk form yerine akşam bildirimi: "Yarın için tek deney?" — cevapsız kalırsa hiçbir şey olmaz.
  2 hafta daha 0 ise kartı sil.

### P2 — Klinik değer üreten görünümler (2–4 hafta)

**P2.1 Tansiyon protokolü**
- Bugün `lib/measurements.ts` 11:00 öncesi ölçümlerin ortalamasını alıyor; protokol ve kalibrasyon yok.
- Sabah 2 ölçüm (1 dk ara) → uygulama ortalamasını kaydeder; tek ölçüm "eksik protokol" işaretli.
- Haftalık ortalama yalnız protokollü günlerden. 28 Eyl kararı gibi tartışmalar bir daha çıkmaz.

**P2.2 Haftalık "Pazartesi kartı" — tek ekran karar**
- 7-gün kilo ortalaması farkı · bel (Pzt) · tansiyon haftalık ort. · adım ort. · direnç seans/set sayısı · kayıt günleri.
- Altında **tek karar** (`PROGRAM-2026-09.md` §6 kurallarından): "devam" / "dinlenme günü akşam karbonhidratı çıkar" / "hekim notu".
- Bu kart hem uygulamada hem sohbette (dean-pt skill) aynı kaynaktan okunur.

**P2.3 Hekim özeti (12. hafta ve kontrol muayenesi için)**
- Tek sayfa PDF/HTML: kilo-bel eğrisi, tansiyon protokollü ortalamaları, adım, antrenman sıklığı, beslenme uyumu.
  Teşhis/yorum yok, sadece veri. Kontrol muayenesinde HbA1c/TG ile yan yana konacak.

**P2.4 Yemek sonrası yürüyüş sayacı**
- Prediyabet için en ucuz kaldıraç (yemek sonrası 10–15 dk). Öğün kaydı + saatlik adım verisi zaten var →
  "öğünden sonraki 60 dk'da ≥1.000 adım" otomatik işaretlenir. Yeni giriş yok.

### P3 — Sadeleştirme (sürekli)

- Son 14 günde hiç dokunulmayan ekran/alan listesini çıkar (ölçüt: sunucuda boş kalan alanlar — bugün retro 0,
  `protein_g` 1/12, `muscle_groups` 1/12; `ui/Plan.tsx`'teki "sıradaki adımda" yazan yarım yüzeyler) → 2 hafta daha boşsa arayüzden kaldır, kod kalabilir.
- **Özellik dondurma kuralı:** 2 hafta boyunca yeni özellik yok; yalnız P0/P1 ve hata. Başarı ölçütü commit değil kayıt günü.
- Program değişikliği yalnız Pazartesi kartından çıkan kararla.

---

## 4. Bilinçli olarak önerilmeyenler

| Öneri | Neden hayır |
|---|---|
| Günlük kalori hedefi / "kalan kalori" | Kilitli karar; haftalık ortalama yeterli. |
| Yeni cihaz/sensör entegrasyonu | Mevcut Health Connect bile sessizce kopuyor; önce onu güvenilir yap. |
| Gamification (rozet, seri kutlaması) | Streak zaten var; kayıt sürekliliğini sohbet köprüsü daha çok artırır. |
| Glukoz takip alanı | Hekim konusu (`PROGRAM` §6); CGM yoksa gürültü. |
| Program çeşitlendirme | Adaptasyon sabit uyaran ister; 4 hafta kilitli. |

---

## 5. Uygulama sırası ve başarı ölçütü

| Hafta | İş | "Bitti" kanıtı |
|---|---|---|
| 24–25 Eyl | P0.0 seans ezme hatası (TDD, `fix/watch-session-overwrite`) | Regresyon testi yeşil; 25 Eyl A′ seansı setleri senkron sonrası duruyor |
| 25–27 Eyl | P0.2 sync rozeti · P0.3 kaynak önceliği (TDD) | Rozet cihazda görüldü; `daily.steps` = Samsung ekranı, elle düzeltme yok |
| 28 Eyl – 4 Eki | P0.1 set kaydı · P2.2 Pazartesi kartı | 3 seansta `sets_total > 0`; 5 Eki Pazartesi kararı karttan |
| 5–11 Eki | P1.1 sohbet köprüsü · P2.1 tansiyon protokolü | Öğün kaydı ≥ 5/7 gün; tansiyon 7/7 protokollü |
| 12–18 Eki | P1.2 fotoğraf güven aralığı · P3 sadeleştirme | Kullanılmayan yüzeyler listesi Dean onayında |
| 12. hafta (13 Ara) | P2.3 hekim özeti | Kontrol muayenesine götürülecek tek sayfa |

**Kuzey yıldızı metrikleri (haftalık, Pazartesi kartında):**
kayıt günü (kilo+öğün) ≥ 6/7 · direnç seansı 3/3 set kayıtlı · protokollü tansiyon günü ≥ 5/7 ·
7-gün kilo ort. −0.4…−0.8 kg · bel ayda −2 cm.

---

## 5b. Durum (24 Eyl)

- Onay: Dean 24 Eyl "seans ezme hatası ve diğer işlemlere onaylısın".
- P0.0 `be86afe` · P0.2 `00382ce` · P0.1 `989c135` → `v0.32.0`. 372/372 test, typecheck + web build temiz.
  Cihazda görülmedi: rozet, set kartı (ilk gerçek kullanım 25 Eyl Cum A′).
- P0.2 kapsamı: rozet sonuca bakıyor (saatten son veri > 24 sa, reddedilen outbox kaydı);
  `syncHealth` içindeki boş `catch`'ler kaldı — rozet nedeni değil belirtiyi gösterir.
- P0.3 ertelendi: günlük adımda kural zaten var (saat yalnız büyükse ezer, arşiv yalnız boşu doldurur);
  asıl sorun Health Connect'in hiç yazmaması, rozet onu görünür kılıyor.

## 6. Dean onay masası

1. P0 sırası (seans ezme hatası → sync rozeti → set kaydı) uygun mu? P0.0 onaysız başlatılabilir (hata düzeltmesi).
2. 2 haftalık özellik dondurma kabul mü?
3. Retro kartı: tek soruya indir mi, direkt kaldır mı?
4. Sohbet köprüsünde ajan kaydı **onaysız** mı yazsın (şimdiki gibi), **onay kartıyla** mı?
