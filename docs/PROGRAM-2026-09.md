# PROGRAM 2026-09 — Dean: Beslenme + Antrenman (12 hafta, 20 Eyl – 13 Ara)

> Onay: Dean, 2026-09-20. Yazan: diyetisyen + PT personası; 3 bağımsız değerlendirici (diyetisyen, PT, uygunluk/kod) sonrası.
> Kaynak veri: canlı `daily_log`/`workout`/`meal` + e-Nabız tahlil raporu 04.09.2026. Sınırlar: `COACH-PERSONA.md` §2/§4.

Persona: uzman diyetisyen + kıdemli PT, Eva sınırları (COACH-PERSONA §2/§4) aynen. Ekleme dili, kısıtlama dili yok.

## 1. Veri (canlı DB) ve varsayımlar
Kilo 7-gün ort 108.0 kg (12 günde −1.5 kg, ~0.9 kg/hafta). Tansiyon 138/87 ort (8–19 Eyl 134–142 / 84–93).
**Güncelleme 21 Eyl (Dean beyanı, tekil ölçüm):** 128/84 ve 130/77 — 8–19 Eyl bandının belirgin altında.
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
| Sal | **Yüzme 45 dk** zone 2 | — |
| Çar (B) | Pec deck 3 · Row 3 · **Hip thrust 3 + seated leg curl 2** · Triceps press 2 · Pallof 2 | 2 |
| Per | **Yüzme 45 dk** (havuz varsa) + 10 dk mobilite; yoksa yürüyüş 6.000+ | — |
| Cum (A′) | Chest press/eğik dambıl 3 · Kablo çekiş/pulldown nötr 3 · **Leg press 3 + calf 2** · Omuz yan 2 · Biceps/triceps 1+1 · Dead bug 2 | 2 |
| Cmt | **Yürüyüş 6.000+ adım** (serbest öğün günü) | — |
| Paz | **Yürüyüş 6.000+ adım**, tempolu 30–40 dk | — |
Seans başı ~15–16 set, 50–60 dk. Haftalık: göğüs 9, sırt 9, quad 6+, hamstring-kalça 5, omuz 6, kol 6 — bacak **her seansta**, ihmal edilmez.
Bölünmüş (göğüs/sırt/bacak günleri) şablon iptal değil, Dean isterse geri dönülür; tüm vücut ilk 4 hafta denenir.
Hafta sonu havuz kapalı (Dean, 21 Eyl) — yüzme Salı/Perşembe'ye alındı, hafta sonu yürüyüşle karşılanıyor.
Haftalık: quad 9, hamstring-kalça 9, göğüs 9, sırt 9, omuz 6, kol 12. Kardiyo 150–200 dk zone 2.
Mobilite (Per, 10 dk, uygulamadaki kartlarıyla): kedi-deve · diz çökerek kalça öne itme ·
ayakta kalça çemberi · dinamik göğüs açma · ayak bileği çemberi.
İlerleme: 3 sette 12+ tekrar → ağırlık +%5. Deload: **7. hafta** hacim −%40, ağırlık sabit; reaktif tetik: 2 hafta ilerleme yok / eklem ağrısı / uyku bozuk / sabah tansiyonu yükseldi.
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
