# PROGRAM 2026-09 — Dean: Beslenme + Antrenman (12 hafta, 20 Eyl – 13 Ara)

> Onay: Dean, 2026-09-20. Yazan: diyetisyen + PT personası; 3 bağımsız değerlendirici (diyetisyen, PT, uygunluk/kod) sonrası.
> Kaynak veri: canlı `daily_log`/`workout`/`meal` + e-Nabız tahlil raporu 04.09.2026. Sınırlar: `COACH-PERSONA.md` §2/§4.

Persona: uzman diyetisyen + kıdemli PT, Eva sınırları (COACH-PERSONA §2/§4) aynen. Ekleme dili, kısıtlama dili yok.

## 1. Veri (canlı DB) ve varsayımlar
Kilo 7-gün ort 108.0 kg (12 günde −1.5 kg, ~0.9 kg/hafta). Tansiyon 138/87 ort (8–19 Eyl 134–142 / 84–93).
**Güncelleme 21 Eyl (Samsung Health arşivi, 65 CSV):** Eylül 2026'da 18 ölçüm, bant **128–147 / 84–96**. Dean'in bildirdiği 128/84 ve 130/77 bandın alt ucu; **ortalama hâlâ 130/80 üstünde**, tekil iyi ölçüm kuralı gevşetmez.
Antrenman kısıtları (RIR 2, 8–15 tekrar, Valsalva yok) **değişmiyor**; 7-gün ortalaması birikmeden gevşetme yok.
**Ölçü 21 Eyl:** 107.5 kg · bel 117 cm (göbek hizası, takip noktası) · 113 cm (kemer hizası). Bel/boy 0.67.
Açlık glukozu 109 (tek ölçüm). EKG normal. Adım ort 5.250. Split Pzt/Çar/Cum. Yüzme 60–90 dk ×2.
Profil: **erkek, 23.07.1983 (43 yaş), 175 cm → BMI 35.3**, ilaç yok, salon (makine ağırlıklı). Hedef kilo 100 kg (BMI 32.7); 12 hafta sonrası ikinci blok kararı.

## 1b. Tahlil (04.09.2026, aile hekimliği) — planı değiştiren değerler
| Test | Sonuç | Lab karar sınırı | Plana etkisi |
|---|---|---|---|
| HbA1c | **5.9 %** | prediyabet 5.7–6.4 | karbonhidrat kalitesi + antrenman gününe kaydırma artık tek ölçüme değil laboratuvara dayanıyor |
| Açlık glukozu | 112 | 74–100 | aynı |
| Trigliserid | **302** | <150 | şeker/rafine karbonhidrat/alkol azalt, balık 2×/hafta (omega-3), zone 2 kardiyo dozu korunur |
| Total kolesterol / LDL / HDL | 253 / 126 / **67** | >200 / >130 / 35–55 | HDL iyi; doymuş yağ (yağlı et, tereyağı) yerine zeytinyağı; TG/HDL 4.5 → insülin direnci yönü, kilo kaybı ana tedavi |
| Kreatinin / K / Na | 0.91 / 4.3 / 143 | normal | **böbrek normal → potasyum hedefi (3.500–4.700 mg) güvenli** |
| ALT/AST/GGT | 28/25/30 | normal | karaciğer normal |
| Ürik asit | 6.0 | 3.5–7.2 | üst yarı; yüksek proteinde su 3 L, kırmızı et ≤2/hafta |
| CRP, hemogram, ferritin, B12, PSA | normal | | demir/B12 takviyesi gereksiz |
Bu değerler hekim tarafından alınmış; yorum ve ilaç kararı ona ait. Plan bu tabloyu "diyet + egzersiz" tarafından okur.

## 2. Hekim notu (bir kez)
Tansiyon 7-gün ort ısrarlı 130/80 üstü + glukoz 100–125 bandı → teşhis değil, kontrol muayenesi + HbA1c/lipid.
Böbrek sorunu veya potasyum tutan ilaç varsa §3 potasyum hedefi hekime sorulur. Plan bekletilmez.

## 3. Hedefler (12 hafta, 20 Eyl – 13 Ara)
| Hedef | Değer | Not |
|---|---|---|
| Haftalık kayıp | **0.6 kg/hafta** (ayar `weekly_loss_pct` 0.6) | on_track bandı 0.33–0.98; mevcut hız zaten içinde |
| Protein | **180 g/gün** (1.67 g/kg; yağsız kütle ~75 kg × 2.4 ile de aynı) | uygulama min 173 → uyarı yok. Slot 43/43/43 + ara ≈51 (`slotGaps` 0.4 g/kg sabit) |
| Sodyum | **<2.000 mg** (~5 g tuz) | peynir suda bekletilir, salça/bulyon yerine domates+baharat, işlenmiş et ≤1/hafta |
| Potasyum | 3.500–4.700 mg | çapa: muz, 200 g yoğurt, 1 kase baklagil, 150 g yeşil yapraklı, 20 g fındık |
| Lif | 30 g/gün, 2 haftada kademeli | baklagil 1 kase ~12, bulgur 100 g ~5, yulaf ~4, 5 porsiyon sebze ~10 |
| Sebze/baklagil | 5 porsiyon (Bugün +1 sayacı) | |
| Adım | 7-gün ort 5.250 → 4. hafta 6.500 → 8. hafta 7.500 | haftalık +%7–8 |
| Su | 2.5–3 L, çay/kahve şekersiz | |
| Serbest gün | **Cumartesi** (ayar `free_meal_day=6`) — tatlı/helva kotası buraya bağlı | telafi planı o gün çıkmaz |
Kalori hedefi yok (kilit). Karar birimi 7-gün kilo ortalaması.

## 4. Beslenme — mevcut alışkanlığın üstüne ekleme
Her öğün: 1 protein + 1–2 sebze/baklagil + bulgur/baklagil/tam tahıl (beyaz ekmek/pilav yerine) + zeytinyağı.
TG 302 + HbA1c 5.9 kuralları: meyve suyu/şekerli içecek yok, tatlı yalnız serbest günde, alkol ≤2 birim/hafta, balık haftada 2 (somon/sardalya/uskumru), kırmızı et ≤2/hafta, tereyağı/kaymak yerine zeytinyağı.
Karbonhidrat kesilmez; kalitesi değişir ve büyük kısmı antrenman gününe kayar. Et dışı seçimde **+20 g protein eki** kuralı.

| Slot | Şablon (Dean'in kayıtlı yemeği korunur) | Gerçek protein |
|---|---|---|
| Sabah | **3 tam yumurta** + suda bekletilmiş beyaz peynir 40 g + 3–5 zeytin + domates-salatalık-biber + **100 g lor/süzme yoğurt**; helva serbest günde | ~42 g |
| Öğle | pişmiş tavuk/hindi/dana 150 g **veya** balık 200 g **veya** baklagil 1 kase + 2 yumurta/100 g lor; salata + bulgur 100 g | ~45 g |
| Ara | 200 g süzme yoğurt + 1 muz **veya** kabaklı yoğurt mezesi 250 g + 20 g fındık | ~20–25 g |
| Akşam | öğle ile aynı kural; antrenman gününde bulgur/patates 100 g, dinlenme gününde sebze yemeği + yoğurt | ~45 g |
| Antrenman sonrası | süt 300 ml + muz **veya** 200 g süzme yoğurt (ayran yalnız tuzsuzsa) | ~10–20 g |
Toplam ~165–180 g; hedef tutmuyorsa akşama 100 g lor.

**Deniz ürünü, bar ve takviye kuralları (22 Eyl, etiketlerden doğrulandı):**
- **Kabuklular** (karides, midye, kalamar): haftada ≤2 porsiyon (150–200 g). Ürik asit 6.0 üst
  yarıda olduğu için kabuklu yenen gün kırmızı et/sakatat yok, su 3 L. Omega-3'ü düşük →
  **"balık haftada 2" kotasından sayılmaz**, o kota yağlı balığa (somon, sardalya, uskumru, hamsi) ait.
- **Konserve ton (yağda):** 50 g süzmede ~340 mg sodyum, omega-3 ~100 mg. Yağlı balık yerine
  geçmez; suda olanı tercih, süz-yıka, haftada 1.
- **Protein barı:** günde ≤1, ara öğünün yerine geçmez (200 g süzme yoğurt 20 g protein / 120 kcal
  verirken bar 8–9 g / 131–140 kcal). Tatlandırıcısı **maltitol** — "şeker ilavesiz" kan şekerine
  etkisiz demek değil (HbA1c 5.9). Serbest günde tatlı yerine iyi takas.
- **Detoks/bitkisel karışım programa dahil değil.** Besin değeri ~sıfır (100 g'da 6–8 kcal) ve
  ticari detoks ürünlerinin toksin attığına dair klinik kanıt yok; 4 Eyl tahlilinde kreatinin 0.91,
  ALT/AST/GGT normal. **Miktarı etikette yazmayan kafein içeren ürün (mate, yeşil kahve) tansiyon
  nedeniyle kullanılmaz.**
- **Tam yağlı yoğurt protein kaynağı sayılmaz** (100 g'da 4 g). Ara öğünde süzme yoğurt kullanılır.
  Laktozsuz %1 süt 300 ml = 9 g protein, antrenman sonrası slotuna uygun.

Rotasyon (3 set, PLAN-DIET S2): **Alışık** — haşlanmış tavuk + salata, etli sebze + yoğurt, tavuk çorbası+tavuk, menemen.
**Değişiklik** — fırın somon/levrek 200 g, mercimek köftesi + cacık, kuru fasulye + bulgur, hindi güveç.
**Hızlı** — 3 yumurta + peynir, ton 160 g + salata, süzme yoğurt 250 g + yulaf.
Yüzme günü: 1.5 saat önce ara öğün + meyve; sonrası 1 saat içinde 40 g protein. Alkol: tansiyon değişkeni, haftada ≤2 birim, varsa kayda not.

## 5. Antrenman — split korunur, alt gövde ve nefes kuralı eklenir
Hipertansiyon kuralları: tekrar 8–15, yetmezlik yok, itiş fazında nefes ver (Valsalva yok), baş gövde altında pozisyon yok,
plank yerine dead bug / Pallof press. Seans öncesi tansiyon ≥160/100 → o gün yürüyüş. Isınma 5–8 dk bisiklet + 2 rampa seti; soğuma **10–15 dk hafif yüzme** (Dean önerisi, 21 Eyl — yatay pozisyon venöz dönüşü kolaylaştırır) ya da 3–5 dk yürüyüş/bisiklet 50–60 W. Soğuma yüzmesi hafif tempodadır ve haftalık kardiyo hacmine sayılmaz.
Rampa: 1–2. hafta 2 set / RIR 3, yüzme 30–45 dk; 3. haftadan 3 set / RIR 2.

| Gün | İş — **tüm vücut A/B** (Dean kararı 21 Eyl: her kas grubu her seansta, hacim 3 güne yayılır) | RIR |
|---|---|---|
| Pzt (A) | Chest press 3 · Lat pulldown geniş 3 · **Leg press 3** · Omuz presi 2 · Biceps curl 2 · Dead bug 2 | 2 |
| Sal | **Yürüyüş** — yemek sonrası 3 yürüyüş, ~9.000 adım, biri tempolu (zone 2) | — |
| Çar (B) | Pec deck 3 · Row 3 · **Hip thrust 3 + seated leg curl 2** · Triceps press 2 · Pallof 2 | 2 |
| Per | **Yürüyüş** (Sal ile aynı) + 10 dk mobilite | — |
| Cum (A′) | Chest press/eğik dambıl 3 · Kablo çekiş/pulldown nötr 3 · **Leg press 3 + calf 2** · Omuz yan 1 · **Biceps 2 + triceps 2** · Dead bug 1 | 2 |
| Cmt | **Yürüyüş 6.000+ adım** (serbest öğün günü) | — |
| Paz | **Yürüyüş 6.000+ adım**, tempolu 30–40 dk | — |
Seans başı 15–17 set, 50–60 dk.
**Kol hacmi düzeltmesi (22 Eyl):** A′'de biceps ve triceps 1'er setti; haftalık doğrudan kol
hacmi 3 sete düşüyordu. Doz-yanıt meta-regresyonu (Sports Medicine 2024) hipertrofi için
10–20 set/kas/hafta veriyor, dolaylı setler yarım sayılıyor — eski hâl ~7 sete denk geliyordu.
Kol 2+2'ye çıkarıldı, denge için omuz yan ve dead bug 1'e indirildi; seans süresi değişmedi.
Kalori açığında hedef kas **korumak**, büyütmek değil — 3 set de koruyabilirdi, 4 daha güvenli. Haftalık: göğüs 9, sırt 9, quad 6+, hamstring-kalça 5, omuz 6, kol 6 — bacak **her seansta**, ihmal edilmez.
Bölünmüş (göğüs/sırt/bacak günleri) şablon iptal değil, Dean isterse geri dönülür; tüm vücut ilk 4 hafta denenir.
Yüzme günleri kaldırıldı (Dean, 23 Eyl): Salı/Perşembe yürüyüş günü. Yüzme hep 10–16 dk, ort. nabız ~112 kalıyordu (kardiyo uyaranı değil); salon sonrası soğuma olarak isteğe bağlı. Zone 2 hacmi tempolu yürüyüşten gelir.
Haftalık: quad 9, hamstring-kalça 9, göğüs 9, sırt 9, omuz 6, kol 12. Kardiyo 150–200 dk zone 2.
Mobilite (Per, 10 dk, uygulamadaki kartlarıyla): kedi-deve · diz çökerek kalça öne itme ·
ayakta kalça çemberi · dinamik göğüs açma · ayak bileği çemberi.
İlerleme (çift ilerleme, 22 Eyl): 3 sette de 12 çıkıyorsa ağırlık artmaz, **tekrar tırmanır**
(12→13→14→15); üç sette de 15'e ulaşınca ağırlık +%5 ve 8–10 tekrara dönülür. Kalori açığında
kuvvet artışı yavaşlar, tekrar artışı da ilerlemedir. **İki hafta üst üste hiçbir yönde ilerleme
yoksa** o hareketin ağırlığı −%10, 8 tekrardan yeniden tırmanılır. Yaş 43: kas yapma kapasitesi
değil toparlanma ve eklem toleransı sınırlayıcı — makine ağırlıklı seçim, 48 saat aralık ve RIR 2
bunu zaten karşılıyor. Eksik kaldıraç **uyku**: 2026'da tek kayıt yok (son veri Mayıs 2025).
Eski kural: 3 sette 12+ tekrar → ağırlık +%5. Deload: **7. hafta** hacim −%40, ağırlık sabit; reaktif tetik: 2 hafta ilerleme yok / eklem ağrısı / uyku bozuk / sabah tansiyonu yükseldi.
Tansiyon ölçümü sabah aç karnına, 2 ölçüm ortalaması; antrenman sonrası ölçüm yok.

## 6. Karar kuralları
- `weightTrend` too_fast → antrenman günü karbonhidrat porsiyonunu artır; too_slow 3 hafta → adım + tuz/serbest gün kontrolü; 8+ hafta → diyet molası (S5).
- Leg press / lat pulldown / göğüs press toplam tekrar 2 hafta üst üste düşerse → kayıp 0.5 kg/haftaya, protein ve uyku kontrol.
- "Abarttım" → ertesi gün rutine dönüş, öğün atlama yok (S1).
- Tansiyon 7-gün ort 4 hafta sonra ≥135/85 → hekim notu tekrar. Glukoz: takip alanı yok, hekim konusu (haftada 2 ölçüm, notes'a).
- Kayıt yükü: ilk 4 hafta zorunlu = kilo + protein + sebze sayacı; öğün detayı isteğe bağlı, "Alışık" seti tek dokunuş.

## 7. Uygulamaya yazılanlar (20 Eyl)
1. Profil (Ayar ekranı → `profile`): birth_year, height_cm, sex, goal=cut, target_weight_kg=100, days_per_week=3, session_min=50,
   cuisine='türk ev yemeği', birth_year=1983, sex=male, height_cm=175, equipment=[gym,machine,cable,dumbbell,barbell], medications=[] — sunucu `profile` satırı API ile yazıldı, telefon `pullProfile` ile alır.
   conditions: ['prediyabet bandı (HbA1c 5.9, 04.09.2026)', 'hipertrigliseridemi (302)', 'tansiyon izlemi'] — Eva kırmızı bayrak kuralları buradan okur.
2. Ayarlar → goals: protein_g **180**, weekly_loss_pct **0.6**, free_meal_day 6 — bu ayar telefonda (IndexedDB) yaşar, **Dean Ayarlar ekranından girer**.
3. Bu dosya. `training_split` Çarşamba → sırt, omuz, bacak (leg press + hip thrust).
4. Eva sistem istemi (`persona.ts`): profilde tansiyon/glukoz/trigliserid izlemi varsa tuz-potasyum-lif önceliği satırı.
5. **Kod bulgusu (ayrı PR, `fix/protein-target-obese`):** `proteinTarget` kesimde 2.2 g/kg × gerçek kilo = 238 g öneriyor; obezde referans hedef/yağsız kütle olmalı. Öneri: `min(avgWeight, target_weight_kg)` üzerinden hesap → 220 tavan. Bu PR onay sonrası.

## Sistem kararı — tüm vücut mu, itiş/çekiş mi (21 Eyl, kanıtla)

Haftada **3 direnç günü** için tüm vücut kalır. Gerekçe, tercih değil kanıt:

- Hacim eşitlendiğinde bölünme şekli hipertrofi ve güç farkı yaratmıyor — 14 çalışmalık
  meta-analiz, split ile full-body arasında anlamlı fark bulmuyor.
- Frekans da hacim eşitken 1–6 gün arasında fark yaratmıyor. Fark **hacimden** geliyor.
- Tek istisna: **seans başı 15+ set** olunca hacmi daha çok güne bölmek lehte. Bizim seans
  15–16 set — tam bu sınırda, yani bölmek isteniyorsa gerekçesi burası, "daha çok kas" değil.
- Pratikte full-body aynı takvimde daha çok toplam hacim getiriyor.

Sonuç: 3 gün → tüm vücut (her kas haftada 3 kez uyarılır). İtiş/çekiş/bacak bölünmesi ancak
haftada 5–6 güne çıkılırsa eşitlenir; 3 günde her kas haftada **1 kez** uyarıldığı için
aynı hacim daha az sıklıkla dağılır. Bölünmüş sistem uygulamada **değişiklik seçeneği** olarak
duruyor, varsayılan değil.

PT'lerin farklı fazlandırması bu tabloyu değiştirmiyor: değişen hacmin dağılımı, toplamı değil.

Kaynaklar: Schoenfeld ve ark. frekans meta-analizi (PMID 30558493); dose-response
meta-regresyon (PMID 41343037); split vs full-body meta-analizi (2024).

## Karın hareketi — makine crunch değil (21 Eyl)

Ab crunch makinesi havuzda kalır ama **son sırada**: omurga fleksiyonu + göğüs önünde yük,
tansiyonda ıkınmaya davet. Dead bug, Pallof press ve kablo crunch aynı işi omurgayı bükmeden
yapar; zar bu üçünü tüketmeden makineye gitmez (`plan.js` → `IKINCIL`).
