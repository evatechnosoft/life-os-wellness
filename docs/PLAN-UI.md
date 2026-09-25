# PLAN-UI — Ekran düzeni: Ayar'ı toparla, Bugün'ü seyrelt

> 2026-09-17 · Kaynak: `apps/web/src/ui/*` · Kilitler: giriş 60 sn altı, offline-first,
> tek kullanıcı, PWA + APK aynı kod. Bu plan **görünüm** planıdır; veri katmanına dokunmaz.

## 0. Şikâyet ve ölçülen karşılığı

Dean: "Ayarda hiç iyi durmuyor, her şey açıkta."

Ölçüm (`grep -n "Card title=" apps/web/src/ui/Settings.tsx`), ekrandaki sırayla:

| # | Kart | Ne sıklıkta lazım |
|---|---|---|
| 1 | Saat uygulaması | yılda birkaç kez |
| 2 | Telefon uygulaması | yılda birkaç kez |
| 3 | Cihaz-içi Eva (model indirme) | bir kez |
| 4 | Sunucu | kurulumda, sonra arıza anında |
| 5 | **Hedefler** | **haftalık** |
| 6 | **Beslenme itmesi** | aylık |
| 7 | Haftalık program | aylık |
| 8 | **Hatırlatmalar** | aylık |
| 9 | Notlar (geçmiş) | ara sıra okunur |
| 10 | Veri (dışa aktar / sil) | nadiren, biri geri alınamaz |

İki somut kusur:

1. **Sıra ters.** En nadir kullanılan üç kart (APK ve model kurulumu) en üstte;
   haftalık dokunulan "Hedefler" beşinci sırada, 300+ piksel aşağıda.
2. **Hiçbiri katlanmıyor.** 396 satırlık bileşen tek dikey akış olarak açılıyor;
   telefonda yaklaşık altı ekran boyu kaydırma. Ekranda "ne var" bilgisi yok,
   yalnız "ne kadar çok şey var" hissi var.

Bugün ekranı da aynı yönde büyüyor: dört kart + Koç + Eva + retro + Saat + Uyku +
antrenman formu, hepsi her gün açık — oysa hepsi her gün gerekmiyor.

## 1. Scope Lock

**Değişir:** `apps/web/src/ui/Settings.tsx`, `Today.tsx`, `Field.tsx` (ortak
bileşenler), `index.css` (token eklemesi). Yeni dosya: `ui/Section.tsx`, `ui/Row.tsx`.

**Değişmez:** veri katmanı (`lib/*`), sync protokolü, Dexie şeması, kural motorları,
renk paleti ve evaglass dili, alt navigasyon dörtlüsü (Bugün · Eva · Hafta · Ayar).

## 2. Karar: hazır kit mi, kendi iskeletimiz mi

| Seçenek | Lisans | Getirisi | Bedeli | Karar |
|---|---|---|---|---|
| **Radix Primitives** | MIT | Accordion / Select / Switch / Dialog davranışı ve WAI-ARIA'sı; **stil getirmez** — her rengi, yüzeyi ve yazıyı biz veririz | İki-üç paket, bundle artışı | **Seçildi (Dean, 17 Eyl: "kit al ama renkler bizden")** |
| Native `<details>` / `<summary>` | — | Sıfır bağımlılık katlama | Select/Switch/Dialog'u çözmez; çoklu-açık ve animasyon elle | Radix'in olmadığı yerde kalır |
| shadcn/ui | MIT | Hazır bileşen seti, Tailwind ile | Kendi tema katmanını getirir, evaglass tokenlarıyla çakışır; CLI kod kopyalar | Hayır |
| DaisyUI | MIT | Hazır sınıflar | Tasarım dilini ezer, cam/blur dili gider | Hayır |
| Ionic React | MIT | Tam mobil kabuk, Capacitor ile birinci sınıf | Uygulamanın görünümünü domine eder, 1 MB üstü | Hayır |

**Gerekçe (karar 17 Eylül, Dean):** kit alınır ama **görünüm bizden**. Radix tam
olarak bunu veriyor: yalnız davranış ve erişilebilirlik; tek bir renk, gölge ya da
yazı tipi getirmiyor. Böylece klavye gezinmesi, odak tuzağı, `aria-expanded`,
ekran okuyucu duyurusu hazır gelir; yüzeyler `evaglass.tokens.json`'daki aurora ·
wash · graffiti değerleriyle çizilir.

Stil **getiren** kitler (shadcn/ui, Preline, FlyonUI, TailGrids, Ionic) bu yüzden
elendi: hepsi kendi tema katmanını dayatıyor, evaglass'ın cam/glow dili gidiyor.
shadcn/ui zaten Radix'in üstüne kendi temasını koyan bir katman — o katmanı atıp
doğrudan Radix kullanmak aynı erişilebilirliği tema çakışması olmadan veriyor.

**Kural:** Radix'ten gelen hiçbir bileşen kendi rengiyle kullanılmaz; her biri
`index.css` tokenlarıyla sarılır. Bağımlılık listesine giren her paket PR'da
gerekçesiyle yazılır (AGENTS.md sınırı).

## 3. Bilgi mimarisi — Ayar

Üç bölge, sırası kullanım sıklığına göre; her bölge katlanır, ilki açık gelir:

```
Ayar
├─ Günlük ayarlar            (açık)
│  ├─ Hedefler               protein, haftalık kayıp %, set/grup
│  ├─ Beslenme itmesi        nudge, serbest öğün günü
│  ├─ Hatırlatmalar          tartı saati, retro saati, bel günü
│  └─ Haftalık program       antrenman bölgeleri
├─ Cihazlar                  (kapalı, yalnız APK)
│  ├─ Saat uygulaması        saate APK gönder
│  ├─ Telefon uygulaması     güncelleme kontrolü
│  └─ Cihaz-içi Eva          model indir / sil
└─ Veri ve sunucu            (kapalı)
   ├─ Sunucu                 adres, token, bağlantı durumu
   ├─ Notlar                 geçmiş kayıt defteri
   └─ Dışa aktar / Sil       geri alınamaz olan en altta, ayrı uyarı ile
```

Kurallar:

- **Web'de cihaz bölgesi hiç çizilmez.** Bugün tarayıcıda "Saate gönder" düğmesi
  görünüyor ve basınca "Yalnız Android uygulamasında çalışır" diyor; var olup
  çalışmayan düğme, olmayan düğmeden kötüdür (`isNative()` zaten mevcut).
- Katlama durumu `db.settings` içinde saklanır (`ui_sections`), yeniden açılışta korunur.
- Her bölüm başlığında tek satırlık özet: "protein 140 g · kayıp %0,7" gibi —
  açmadan ne olduğu görünür.
- Yıkıcı işlem (veri sil) tek başına ve en altta; onay iki adımda alınır.

## 4. Bileşen sözleşmesi

| Bileşen | Sorumluluk | Durum |
|---|---|---|
| `Section` | Radix Accordion.Item sarmalayıcısı: başlık, özet satırı, kalıcı açık/kapalı durumu; görünümün tamamı evaglass tokenlarından | Yeni |
| `Row` | Etiket + kontrol, tek satır, en az 44 px dokunma hedefi | Yeni; `NumberField` bunun üstüne oturur |
| `Card` | Var olan cam kart; bundan sonra bölüm değil, içerik grubu | Mevcut |
| `Segmented` | 2–4 seçenekli tercih (nudge gibi), `select` yerine | Yeni, küçük |

`select` öğeleri kalabilir: Android'de yerel açılır liste tek dokunuş, kendi
menümüzü yazmak kazanç getirmiyor.

## 5. Bugün ekranı (P2)

Aynı ilke: her gün gereken üstte, gerisi katlanır.

- Üstte değişmeyen üçlü: protein halkası, hatırlatmalar, Koç.
- "Ölçüm" (kilo, adım, tansiyon, bel) tek katlanır bölüm; girildiyse kapalı gelir,
  özet satırında değerler görünür.
- Saat ve Uyku kartları katlanır; veri yoksa hiç çizilmez — "veri yok" kartı
  göstermek yerine hiçbir şey göstermek daha sakin.
- Akşam retrosu saat 20'den önce katlanır (sıra değişimi zaten var).

## 6. Kabul kriterleri

- [ ] Ayar ilk açılışta tek ekrana sığar: üç bölüm başlığı + açık ilk bölüm, kaydırmasız.
- [ ] Tarayıcıda cihaz bölümü DOM'da yok (`isNative()` false).
- [ ] Açık/kapalı durumu uygulama kapanıp açılınca korunuyor.
- [ ] Hedef değiştirme akışı (Ayar'ı aç → protein hedefini değiştir → kaydet)
      **10 saniyenin altında**, gerçek telefonda kronometreyle.
- [ ] 60 sn kuralı bozulmadı: Bugün ekranında protein ve öğün girişi hâlâ ilk
      ekranda, kaydırmasız erişilebilir.
- [ ] Yeni bağımlılık yalnız Radix paketleri; her biri PR'da gerekçeli. Stil getiren kit yok.
- [ ] Radix bileşenlerinin hiçbiri kendi rengiyle görünmüyor: tüm yüzeyler evaglass tokenlarından.
- [ ] `npm test` + `npm run typecheck --workspaces` yeşil, `npm run build` başarılı.

## 7. Uygulama sırası

| Faz | İş | Dal |
|---|---|---|
| P1 | `@radix-ui/react-accordion` kurulumu + evaglass sarmalayıcısı (`Section`/`Row`), Ayar'ın üç bölgeye ayrılması, web'de cihaz bölümünün gizlenmesi | `feature/ui-settings` |
| P2 | Bugün ekranı katlama, boş kartların çizilmemesi | `feature/ui-today` |
| P3 | Animasyon ve ince ayar (Radix `data-state` geçişleri) | — |

## 8. Riskler

- **Katlama veriyi gizler.** Girilmemiş bir alan kapalı bölümde kalırsa unutulur;
  bu yüzden bölüm özetinde eksik alan görünür ("bel: —") ve hatırlatma kartı
  Bugün ekranında kalır.
- **Durum kalıcılığı** yeni bir `settings` anahtarı demek; şema değişmiyor, eski
  kurulumda anahtar yoksa varsayılan uygulanır (ilk bölüm açık).
- Radix Accordion'da `position: sticky` ve blur birlikte bazı Android WebView
  sürümlerinde titreyebilir; P1 sonunda gerçek cihazda bakılır, sorun çıkarsa
  başlık sticky olmaktan çıkar.
- **Bağımlılık sızması:** Radix bir bileşeni çözerken ikinci, üçüncü paketi davet
  eder. Kural: her paket ayrı gerekçeyle girer; Accordion ile başlanır, Select ve
  Switch ancak yerli öğe yetmediğinde eklenir.

## 9. Düzen referansı kararları (19 Eylül, Dean)

Referans sayfası: üç açık kaynak aday ekran görüntüleriyle karşılaştırıldı
(OpenNutriTracker · wger Flutter · Waistline; workout.cool yalnız link).
Alınan yalnız **düzen**; renk, cam ve yazı dili evaglass'ta kalır (§1 kilidi).

| Bizim ekran | Referans | Ne alındı |
|---|---|---|
| Bugün üst bloğu | OpenNutriTracker ana ekran | iki hızlı giriş kartı (kilo · adım) → tek halka (protein) + yanında 7-gün ortalama ve haftalık değişim → üç eşit bilgi kartı (sebze · uyku · nabız). "Kalan kcal" ve oruç sayacı **alınmadı**. |
| Öğün ekle | OpenNutriTracker öğün ekranı | arama + barkod tek satır, altında filtre çipleri; `ProductPicker` buraya taşınır (yapılmadı) |
| Öğün listesi | Waistline günlük | öğün başına katlanır bölüm, fotoğraflı satır, altta gün toplamı (yapılmadı) |
| Ayar → Haftalık program | wger pano kartı | gün satırları + sağda ok (yapılmadı) |

Uygulanan: `ui/DayHeader.tsx` yeniden yazıldı, `Today.tsx › Ölçüm` kartından kilo/adım
çıkarıldı (üst şeride taşındı). Kalanlar §7 sırasına eklenir.

## 10. Ana ekran widget'ı (istek: 19 Eylül)

Dean: "hoş bir görsel saat uygulaması widget'ı ana ekrana, kolay kullanım için."

- **Ne:** Android ana ekran widget'ı — saat + günün özeti (protein x/y, 7-gün ortalama,
  bugünün programı) ve tek dokunuşla uygulamayı ilgili karta açan kısayollar.
- **Nerede:** `apps/web/android/app` içinde `AppWidgetProvider` (Kotlin) + `RemoteViews`
  düzeni. Veri kaynağı: telefondaki Dexie'ye native'den erişim yok → uygulama her
  kayıt/senkron sonrası küçük bir özet JSON'u `SharedPreferences`'a yazar (Capacitor
  plugin köprüsü, `WearBridge` deseni); widget onu okur, 15 dk'da bir ve kayıt
  olayında yenilenir.
- **Sınır:** PWA/web'de widget yoktur; yalnız APK. Cam/blur RemoteViews'ta yok — düz
  koyu zemin + aksan, evaglass tonunda ama sade.
- **Durum:** planlandı, yapılmadı. Sıra: Bugün düzeni (§9) bitince.

## 11. Yoğunluk planı — "kocaman bölgeler, kocaman yazılar" (19 Eylül, Dean)

Ekran görüntüsü kanıtı (Pages, telefon): Haftalık program 7 gün × 6 pill = 42 koca
çip, tek başına bir ekran boyu; Antrenman kartı 4 tip + 6 kas çipi + 3 giriş + Ekle;
web'de "Saat" ve "Uyku" kartları yalnız "Android'de çalışır" metni; Retro üç textarea
hep açık. Sorun düzen değil **ölçek**: 26 px kart köşesi, `p-5`, `py-3` çipler,
`text-lg` girişler telefonda 1,5× büyük duruyor.

Sıra, her adım ayrı dal + PR, merge sorulmaz (hafıza: `pr-otomatik-merge`):

1. **Ölçek tokenları — tek yerden** (`index.css`, `ui/Field.tsx`)
   `--radius-card 26→18`, `--radius-field 16→12`; `Card` `p-5→p-4`, başlık 11 px;
   `NumberField` girişi `text-lg→text-base`, genişlik `w-24→w-20`. Ortak `ui/Chip.tsx`:
   `px-3 py-1.5 text-xs`, seçili = `bg-a1/90 text-solid`, seçili değil = `bg-glass-inset`.
   WorkoutForm, SplitEditor, Profile ekipmanı, Meals filtreleri bu Chip'i kullanır.
   **Kabul:** aynı ekranlar yeniden çekildiğinde Bugün ≤ 3 ekran boyu (şimdi ~6).

2. **Web'de cihaz kartı çizilmez** (`Today.tsx`, `Settings.tsx`)
   `isNative()` false ise Saat, Uyku (telefon), Saat uygulaması, Telefon uygulaması,
   Cihaz-içi Eva kartları hiç render edilmez (§3 kuralı, hâlâ uygulanmamış).

3. **Haftalık program → matris** (`Settings.tsx › SplitEditor`)
   7 satır (Pzt…Paz) × 6 sütun (göğüs sırt bacak omuz kol karın), hücre 32 px kare
   toggle, sütun başlıkları kısaltma (gö · sı · ba · om · ko · ka). Tek ekranda biter.

4. **Katlanır kartlar** (`ui/Field.tsx › Card` + `details/summary`, Radix eklenmez)
   `Card` `collapsible` alır; başlıkta tek satır özet (§3: "protein 140 g · kayıp %0,7").
   Varsayılan kapalı: Antrenman ("bugün 0 kayıt"), Ölçüm (bel · tansiyon), Retro
   (20:00 öncesi), Koç. Katlama durumu `db.settings['ui_sections']`.

5. **Ayar üç bölge** (§3 ağacı) — Günlük ayarlar açık, Cihazlar (yalnız APK), Veri ve
   sunucu kapalı. Profil kartı "Günlük ayarlar"ın başına.

6. **Bugün sırası:** üst blok → Öğünler → Protein ekle → Antrenman (katlı) → Koç
   (katlı) → Eva compact → Ölçüm (katlı) → Retro (katlı).

Yapılmayacak: yeni kit/bağımlılık; renk/cam dili değişimi; günlük akışa alan ekleme.

## 12. Gezinme ve bölüm atlama (19 Eylül, Dean)

- Alt gezinme: daire butonlar, 24'lük stroke ikon + 9 px etiket, kenardan ortaya
  büyüyen ritim (`SCALE`, App.tsx). Seçili olan `scale-110` + `bg-glass-strong` + a1 rengi,
  geçiş 300 ms. Metin sekme yerine ikon = dar telefonda beş sekme sığar.
- Bugün ekranının başında "bölüme git" çip satırı (`#protein`, `#ogunler`, `#olcum`,
  `#antrenman`, `#retro`); `Card` artık `id` alır, `scroll-mt-2` ile başlık gizlenmez.
  Uzun sayfayı kaydırmadan hedefe gitmek için; sekme bölmeye gerek kalmadı.
- Koç kartı Bugün'den çıkıp Eva sekmesinin başına taşındı — öneri sohbetle aynı yerde.
- Kas grubu seçimi çip yerine vücut figürü (`ui/BodyPicker.tsx`): tek gövde konturu
  `clipPath`, uzuvlar yuvarlak uçlu çizgi; Ön/Arka görünüm, sırt yalnız arkada.
  Bölge seçilince a1 ile dolar. Yeni bağımlılık yok, tek inline SVG.

## 13. Hareket sekmesi listesi (19 Eylül, Dean)

- Bölge filtresi yatay çip yerine solda sabit dikey liste (`w-20`, `sticky`): on bölge
  kaydırmadan görünür, seçim tek dokunuş.
- Sağ sütun: arama, alet için tek `select` (çip satırı değil), ardından dik liste.
  Her satır 44 px küçük resim + hareket adı + `alet · bölge` alt satırı.
- Görsel `loading="lazy"` ile doğrudan katalog URL'inden; detay ekranı görseli
  IndexedDB'ye zaten yazıyor, liste için ikinci bir önbellek katmanı eklenmedi.
- `?tab=<id>` sorgu parametresi doğrudan sekme açar (kısayol ve ekran doğrulaması).

## 14. Düzen önerisi — modern, sakin, tek elle (19 Eylül, UX turu)

Amaç: §11 yoğunluk işini bitirirken uygulamaya bütüncül bir düzen dili vermek.
Kilitler aynen: 60 sn giriş, offline-first, evaglass renk/cam dili, yeni kit yok.
Alınan çağdaş desenler ve **neden**:

| Desen | Nerede | Neden bu uygulama |
|---|---|---|
| **Glance şeridi** (tek satır karar özeti) | Bugün üstü, sticky | Karar birimi 7-gün ortalama; günlük kilo gösterilmez, ortalama + Δ hafta ilk bakışta |
| **Alt sayfa (bottom sheet) ile hızlı ekle** | Her sekmede sağ altta `+` | Giriş 60 sn kuralı: Öğün · Protein · Kilo · Antrenman tek dokunuşla, sayfa değişmeden. Native `<dialog>` + `translateY` geçişi, bağımlılık yok |
| **Aşamalı açılım** (`details/summary`) | Bugün alt kartlar, Ayar bölgeleri | §11-4/§11-5 ile aynı; özet satırı başlıkta, açmadan bilgi görünür |
| **Segmented control** | 2–4 seçenek (Ön/Arka, nudge, tip) | `select` yerine tek bakışta seçenekler; §4'teki `Segmented` |
| **Sticky bölüm başlığı** | Öğün listesi, Hareket listesi | Uzun listede bağlam kaybolmaz |
| **Bilgiyi renkle değil biçimle kodla** | Protein halkası, streak, uyum yüzdesi | a1/a2/a3 aksan; iyi/uyarı yalnız `work/assist/load` rolleriyle |
| **44 px dokunma, `tabular-nums`, 8'lik ritim** | Her yer | Tek el, sayılar hizalı, boşluk sistemli |
| **Boş durum çizilmez** | Saat/Uyku web'de, veri yoksa | "veri yok" kartı yerine hiçbir şey (§5) |

### 14.1 Ekran iskeletleri

```
BUGÜN                              EVA                          HAFTA
┌ 19 Eyl · çevrimiçi ┐            ┌ Koç kartı (öneri) ┐        ┌ Pzt…Paz şerit ┐
│ glance: 82,4 ort · ▼0,3 kg │    │ sohbet akışı       │        │ ort. sparkline │
│ ● protein 96/140  · bacak  │    │                    │        │ uyum %  streak │
├────────────────────────────┤    │                    │        │ gün satırları  │
│ atlama çipleri              │    └ giriş satırı ─────┘        └────────────────┘
│ Öğünler   (katlı özet)     │
│ Antrenman (katlı, bugün 0) │
│ Ölçüm     (katlı: bel —)   │
│ Retro     (20:00 sonrası)  │
└── [+] ─── ○ ○ ● ○ ○ ───────┘
```

- **Glance şeridi** = `DayHeader`'ın sadeleşmiş hâli: sol 7-gün ortalama + Δ, orta protein
  halkası (tek görsel vurgu), sağ günün bölgesi. Kilo/adım girişi şeritten çıkar,
  `+` sayfasına taşınır — şerit yalnız **okunur**, girilmez.
- **`+` düğmesi** nav pill'inin sağında, 56 px daire, a1 dolgu. Açılan sayfa dört
  büyük satır; seçilince ilgili form aynı sayfada açılır, kaydedince kapanır.
- **Kartlar** başlık + özet + ok; açık kart yalnız bir tane (`name="today"` ile native
  tek-açık davranışı). Kapalı kart 52 px yüksek → Bugün ≤ 1,5 ekran.
- **Hafta**: 7 günlük şerit üstte, altında tek sparkline (7-gün ortalama, uç nokta
  vurgulu), uyum yüzdesi ve streak iki küçük tile, gün satırları en altta.
- **Eva**: değişmez; Koç kartı başta (§12).
- **Hareket**: §13 aynen.
- **Ayar**: §3 üç bölge, native `details`.

### 14.2 Token eklemeleri (`index.css`)

```
--space-1..6: 4 8 12 16 24 32   (8'lik ritim, p-5 → p-4)
--tap: 44px                      (min-height her etkileşim)
--sheet: rgba(13,16,23,.92) blur 30 — alt sayfa yüzeyi
--ring: conic-gradient(a1 pct, glass-inset 0) — protein halkası
```

### 14.3 Sıra (her adım ayrı dal, PR sorulmadan merge)

| # | İş | Dosya | Kabul |
|---|---|---|---|
| 1 | `ui/Sheet.tsx` (native dialog) + `+` düğmesi + 4 hızlı giriş | `App.tsx`, `Sheet.tsx`, `Today.tsx` | Öğün kaydı: 3 dokunuş, sayfa değişmez |
| 2 | Glance şeridi (DayHeader sadeleşir, giriş alanları çıkar) | `DayHeader.tsx` | Şerit ≤ 96 px yüksek |
| 3 | Bugün kartları `details` ile katlı, özet satırlı (§11-4) | `Field.tsx`, `Today.tsx` | Bugün ≤ 1,5 ekran |
| 4 | Hafta: şerit + sparkline + iki tile | `Week.tsx` | tek ekran |
| 5 | Ayar üç bölge (§11-5) + matris (§11-3) | `Settings.tsx` | ilk açılış kaydırmasız |

Yapılmayacak: yeni kit (Radix dahil — native `details`/`dialog` yetiyor), açık tema,
kalori sayacı, günlük kilo vurgusu. Maket: `docs/img/layout-2026-09-19.html`.

### 14.4 Sonuç (19 Eylül, PR #16 → `dev` @ `6d09010`)

Beş adımın hepsi tek dalda (`feature/ui-layout`) uygulandı, dört paralel ajan + ortak
`Card collapsible` sözleşmesi. Kanıt: `npm test` 339 pass · `tsc --noEmit` temiz ·
`npm run build` başarılı · Pages koşusu `35456426733` completed success.

Headless ölçüm (448 px genişlik, boş veritabanı, sabit gezinme hariç):

| Ekran | Önce | Sonra | Hedef |
|---|---|---|---|
| Bugün | 2020 px (~2,4 ekran) | **1416 px (1,86 ekran)** | ≤ 1,5 — tutmadı |
| Ayar | ~6 ekran | **922 px (1,21 ekran)** | ilk ekran kaydırmasız — yaklaştı |
| Hafta | — | **701 px (0,92 ekran)** | tek ekran — tuttu |

Bugün hedefi tutmadı: kalan yüksekliğin büyük kısmı Eva compact kartı, Diet önerisi ve
`Meals` kartının kendi giriş alanları. Öğün ekleme artık `+` alt sayfasında da olduğu
için `Meals` içindeki giriş satırları sadeleştirilebilir — ayrı iş, bu PR'a alınmadı.

Doğrulanmadı: alt sayfanın açık hâli, 7×6 matris dokunuşu ve katlama durumunun
yeniden açılışta korunması gerçek cihazda denenmedi (headless tıklayamıyor).

## Dean geri bildirimi — 25 Eyl 2026 (telefonda, sırayla yapılacak)

1. **Ayar/hamburger menü durum çubuğunun altında kalıyor.** Uygulama web sayfası gibi davranıyor, telefonun
   durum çubuğu (saat, pil) menüyü eziyor. `safe-area-inset` yalnız `App.tsx` + `Sheet.tsx`'te var; üst bar/menü
   `padding-top: env(safe-area-inset-top)` almıyor olabilir (doğrulanmadı). Kabul: menü durum çubuğunun altında, tıklanabilir.
2. **Uzun basınca "Hepsini seç" bütün sayfayı seçiyor.** Kök düzeyde `user-select: none` + `-webkit-touch-callout: none`
   (`index.css`'te yok); metin girişi (`input`, `textarea`) ve kopyalanması gereken alanlar hariç. Kabul: uzun basış seçim menüsü açmıyor.
3. **Kayıt satırlarında yalnız "sil" var, düzenleme yok.** Liste satırında jest: **sağa kaydır → düzenle, sola kaydır → sil**
   (sil geri alınabilir: 5 sn "geri al" şeridi). Düzenle, kaydın ekleme formunu dolu açar. Yeni kayıt girişi de aynı formu kullanır
   (sabit alan sırası). Yeni bağımlılık yok — pointer event'leriyle. Kabul: öğün/ölçüm/seans satırında iki yön çalışıyor, telefonda.
