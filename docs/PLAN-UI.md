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
