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
| Öğün | **4/14 gün** (19, 21, 22, 23 Eyl) | Protein hedefi (150 g) çoğu gün ölçülmüyor. |
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

---

## 7. 2. tur — 4 Eki (persona artık skill: `~/.claude/skills/wellness-pi`)

> Kaynak: canlı API GET 24 Eyl–4 Eki (11 gün), git log (130 commit, PR #22–#51), son devir.
> Persona §1 aynen geçerli; kurallara iki ek: **telefonda görülmeyen = yok**, **karara girmeyen metrik = kirlilik**.

### 7.1 Teşhis — ne değişti

| Alan | 10–23 Eyl | 24 Eyl–4 Eki | Yorum |
|---|---|---|---|
| Öğün kaydı | 4/14 gün | **11/11 gün** | Sohbet köprüsü fiilen çalışıyor (ajan yazıyor). Çözüldü. |
| Protein | çoğu gün ölçülmüyor | ort. **167 g/gün**, en düşük 143 | Hedef 150 (3 Eki). Çözüldü — artık kaldıraç değil. |
| Kalori (öğün toplamı) | — | ort. 2437; 24–27 Eyl **2867**, 28 Eyl–4 Eki **2191** | 29 Eyl menüsünden sonra düştü. Haftalık ortalama **hiçbir ekranda yok** (`Week.tsx` yalnız saat kcal'ı, `Meals.tsx:189` yalnız bugün). Kilitli karar birimi görünmüyor. |
| Kilo 7-gün ort. | 109.1 → 107.8 | 107.63 → 107.41 (**−0.22 kg/hafta**) | Hedef %0.6 ≈ −0.64 kg/hafta. Plato başlangıcı; 3–4 Eki aynı 107.05 (taşınmış değer olabilir, doğrulanmadı). |
| Bel | 1 kayıt | 23 Eyl 117 · 28 Eyl 117 | Değişim yok; 5 Eki Pzt ölçümü kritik. |
| Direnç seansı | 0/3 set kayıtlı | 4 seans, hepsinde set satırı (12–18) | Çözüldü. Ama `sets_total` 3/4 seansta null — türetilmiyor. |
| Adım | 12/12 gün | 9/11 gün, ort. ~8.000, düşüş eğilimi | 3–4 Eki boş: otomatik kaynak yok. Health Connect **12 gündür** sessiz. |
| Tansiyon | 6/14 | daily 8/11 dolu, ama kolluk ölçümü 27 Eyl sonrası yalnız 30 Eyl | 27 Eyl sonrası daily TA büyük olasılıkla `import_samsung.mjs:177-187` (Samsung TA tablosu) — saat ≈ +13 sistolik saptığı için 7-gün TA ortalaması kirli. Kaynak doğrulanmadı. |
| Retro | 0 | 1/11 ("Yürüyüş") | Kart ölü. |
| Uyku | — | 2 kayıt | Kart ölü. |
| Telefon | — | 3 Eki 14:00 telefon eski 0.39 paketinde, token boş olabilir | Son 11 günün neredeyse her teslimi "telefonda DOĞRULANMADI". |

**Ana bulgu:** 1. turun darboğazı (kayıt) çözüldü — ama kayıt sohbetten geldiği için. Yeni darboğaz üç tane:
1. **Teslim zinciri körleşti.** 30 PR çıktı, telefonda hangisinin göründüğünü kimse bilmiyor. Ajan "telefon hangi paketle, en son ne zaman bağlandı" sorusunu tek komutla cevaplayamıyor.
2. **Karar yok.** Veri var, haftalık karar yok: kilo hedefin üçte biri hızında iniyor ve bunu gösteren ekran yok (kcal 7-gün ort. yok, Pazartesi kartı yok).
3. **Yapım temposu yine kullanımı geçti.** 2 haftalık dondurma tutulmadı; cihaz-içi LLM üç katman (Gemma → Nano → Firebase) yapıldı, kullanımı ölçülmedi.

### 7.2 Plan — öncelik sırasıyla

**G0 — Bugün/yarın, kod gerektirmez**
- **G0.1 İlk haftalık karar 5 Eki Pzt (ajan, sohbetten).** Bel + 7-gün kilo + 7-gün kcal + seans sayısı → `PROGRAM-2026-09.md` §6 kuralı.
  Mevcut veriyle beklenen: kilo −0.22 kg/hafta < hedef → **kalori tarafı**: son 7 gün 2191 kcal; menü 29 Eyl'den beri ~2000 hedefliyor, sapma akşam (bulantı izlemiyle aynı yer: 19:00 sonrası yeme yok denemesi zaten başladı).
  Karar: program değişmez, 7 gün daha 19:00 kuralı + akşam nişastasız; 12 Eki'de kilo 7-gün farkı < −0.4 değilse kcal hedefi ~1850'ye.
  Kabul: daily_log 5 Eki notes'ta karar satırı.
- **G0.2 Telefon zinciri.** Dean 0.40 + token durumu (devirde açık). Kabul: api logunda telefondan `/api/*` 200 + bundle `6cb423a3` (ya da yenisi).

**G1 — Görünürlük (1 hafta, TDD hesaplama katmanı)**
- **G1.1 İstemci izi.** İstemci her isteğe `X-Bundle: <sürüm>` başlığı ekler; api son yetkili isteğin zamanı + sürümünü bellekte tutar, `/health` döner.
  Ajan tek `curl /health` ile "telefon şu paketle, X dk önce bağlandı" der. Yeni tablo yok.
  Kabul: `/health` çıktısında `client: { bundle, last_seen }`.
- **G1.2 Pazartesi kartı (eski P2.2).** Hafta sekmesinin en üstü: 7-gün kilo farkı · **7-gün kcal ort. (öğünlerden)** · kayıtlı gün sayısı · bel · TA (yalnız kolluk) · seans/set.
  Altında tek kural cümlesi (`PROGRAM` §6). Hesap `lib/metrics.ts`'e saf fonksiyon, test önce.
  Kabul: telefonda 12 Eki Pazartesi kararı karttan okunur.
- **G1.3 `sets_total` türet.** Sunucu `POST /api/workouts` set listesi geldiyse `sets_total = sets.length` (tamamlanan). Kabul: 4 seansın hepsinde dolu.

**G2 — Veri temizliği (2. hafta)**
- **G2.1 Tansiyon kaynağı.** `import_samsung.mjs` TA'yı `wearable`'a yazmaya devam eder ama `daily`'ye **yazmaz**; daily TA yalnız kolluk (`measurements` sabah ortalaması).
  Önce 27 Eyl–4 Eki daily TA'nın kaynağı doğrulanır (Samsung TA tablosu saat mi elle giriş mi). Kabul: 7-gün TA yalnız kolluk günlerinden; protokollü gün sayısı kartta.
- **G2.2 Adım: hangi telefon asıl?** Saat diğer telefona eşli (HANDOFF 2 Eki #6). Karar Dean'in: (a) o telefona APK + token, (b) saati bu telefona eşle, (c) haftalık Samsung CSV kabul.
  Karar gelene kadar eksik gün kartta "veri yok" yazar, ortalamaya 0 girmez.

**G3 — Dondur ve sadeleştir (sürekli)**
- **2 hafta yeni özellik yok (5–19 Eki).** Yalnız G0–G2 ve hata. Ölçüt: kayıt günü + karar, commit değil.
- **Retro kartı → kaldır**, yerine zaten var olan "Günün notu" kalır (1/11 kullanım). **Uyku kartı** veri yoksa gizli.
- **Cihaz-içi LLM:** 2 hafta `/api/chat` + yerel model kullanımını say (api logu). Dean uygulama içi Eva'yı haftada < 2 kez açıyorsa Nano/Gemma indirmesi rafa, yalnız sunucu + Firebase yedeği kalır.
- Saat uygulaması OTA'sı (appkit) G2.2 kararı çıkmadan büyütülmez.

**G4 — Klinik çıktı (12. hafta)**
- Hekim özeti (eski P2.3) 13 Ara'ya: kilo-bel eğrisi, kolluk TA ortalamaları, adım, seans sıklığı, haftalık kcal/protein. Yorum yok.
- Bulantı denemesi ~10 Eki sorulur; sürüyorsa hekime giden listeye.

### 7.3 Kuzey yıldızı (Pazartesi kartında, haftalık)
kilo 7-gün farkı −0.4…−0.8 kg · bel ayda −2 cm · 7-gün kcal ort. ≤ 2100 · protein ≥ 150 g gün 6/7 ·
direnç 3/3 set kayıtlı · kolluk TA günü ≥ 5/7 · telefon son bağlantı < 24 sa.

### 7.4 Dean onay masası
1. G0.1 kararı: program sabit + 19:00 kuralı 7 gün, 12 Eki'de gerekirse ~1850 kcal — uygun mu?
2. 5–19 Eki özellik dondurma — bu sefer bağlayıcı mı?
3. Retro kartı kaldırılsın mı?
4. Adım için hangi telefon asıl (G2.2 a/b/c)?
5. Cihaz-içi LLM kullanım ölçümüne göre rafa kaldırma — kabul mü?

### 7.5 Kararlar (Dean, 4 Eki)
- **Kalori:** 12 Eki beklenmeden şimdiden 7-gün ort. ≤ 1900 kcal; aşınca Hafta ekranında uyarı (`feature/kcal-uyari`). 1850 değil 1900: programın kendi ≤500 kcal açık kuralı.
- **Program sabit:** A/B/A′ split, her hareket 2×12 RIR 1–2, haftada 3 direnç + yürüyüş; 4 hafta değişmez.
- **Retro kartı kaldırıldı:** yerine "Günün notu" kartı; 22:00 retro bildirimi kalktı (akşam yemeği hatırlatması aynı saatte kalır); sesle söylenen retro günün notuna eklenir.
- **Tansiyon:** normale döndü, ölçülmüyor. G2.1 iptal; TA kuzey yıldızından ve Pazartesi kartından çıktı.
- **Adım (G2.2):** Dean karar veremedi → öneri (a) diğer telefona APK + token: saat yeniden eşleşmez (Galaxy Watch telefon değiştirince sıfırlanır), tek kurulum. Dean "olur" derse uygulanır.
- **19:00 kuralı ve bulantı izlemi kalktı** (bulantı geçici). `meal.time` çoğu zaman giriş saati: "akşam geç yeme" çıkarımı geçersiz, saat bazlı analiz yapılmaz.
- **27 Eyl (serbest gün) düzeltildi:** pasta/börek kaydı 1220 → 620 kcal (Dean: gün ~2800). Gün 3417 → 2817 kcal.
- **Dondurma:** 5–19 Eki yeni özellik yok, yalnız hata + G1 görünürlük. **Cihaz-içi LLM (5):** duruma göre, kullanım sayılır.

### 7.6 Çalışma biçimi değişti + sonraki oturum (Dean, 4 Eki gece)
- **Giriş kanalı sohbet.** Uygulama izleme/ayna. Akşam yemeği hatırlatması ve Günün notu kartı kaldırıldı (`feature/sade-bildirim`); tek bildirim sabah tartısı. Notlar sohbetten `daily_log.notes`'a yazılmaya devam eder.
- **Dondurma yerine toplu teslim:** yeni özellik (izleme sayfası gibi) eklenebilir ama oturum boyunca biriktirilir, oturum sonunda **tek toplu test** (vitest + headless 390 px tur + canlı API) ve **tek deploy**; Dean telefonda tek listeyle kontrol eder. PR başına deploy yok.
- **Sonraki oturum işleri:**
  1. Ayar > Veri ve sunucu > **API token alanı**: hiç kaldırılmadı (10 Eyl'den beri); #37 yalnız elle sunucu adresini kaldırdı. Token doluysa alanı gizle → "Bağlı · değiştir" satırı; boşsa alan görünür (yeni telefon kurulumu için gerekli).
  2. **Wear OS saat uygulaması — görsel + kullanım** (Dean: "birkaç yazıdan ibaret"): Seans / Özet / Teknik ekranları, tasarım `docs/PLAN-WEAR.md` S-next. Ön koşul G2.2 (a).
  3. İzleme sayfası (aday): tek ekranda 7-gün kilo/kcal/protein/seans — Pazartesi kartı (G1.2) ile birleşir.
  4. Toplu test + deploy + telefon kontrol listesi.
