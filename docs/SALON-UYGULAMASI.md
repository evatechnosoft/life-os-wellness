# Salon uygulaması (Club Aydınoğlu APK) — ne var, ne alınır

> 2026-09-24 · Kaynak: `Club_Aydınoğlu.apk` statik analizi (JS bundle düz metin, Hermes değil).
> Canlı API yanıtı **doğrulanmadı** — üye girişi yapılmadı. Alan adları koddan okundu.
> Bağlı plan: `PLAN-GERCEKCI.md` (persona §1 aynen geçerli), makine listesi `SALON-MAKINELERI.md`.

## 1. Persona — Saha uzmanı, salon-entegrasyon şapkası

`PLAN-GERCEKCI.md` §1'deki uzman (diyetisyen-egzersiz fizyoloğu + sağlık ürün yöneticisi), bu işte
bir soru daha sorar: **"Salonun zaten ürettiği veriyi Dean'e ikinci kez elle yazdırıyor muyuz?"**

1. Salonun cihazı (segmental analiz) ev tartısından (OKOK) daha güvenilir referanstır → kalibrasyon kaynağı.
2. Set/ağırlık kaydında kaynak **bizim uygulama** kalır; salon uygulaması yalnız "hareket bitti" tiki tutuyor.
3. Salonun API'si yalnız **okunur**; rezervasyon/ödeme/mesaj uçlarına dokunulmaz.
4. Güvenlik önlemini aşmak yok. Dean'in kendi hesabıyla, resmi uygulamanın yaptığı çağrının aynısı sınırdır.

## 2. APK'dan çıkanlar

**Platform:** GymPro / fitnessonline.net beyaz-etiket (Argedan). React Native, axios,
`Authorization: Bearer <access_token>`. Temel URL `https://api.fitnessonline.net/v1`.
Uygulama kodu `privateAppCode: "smash"` — başka bir kulübün şablonundan kopyalanmış görünüyor.

| Alan | Uç | İçerik (koddan) | Bizim için değer |
|---|---|---|---|
| Vücut analizi | `GET Mobile/Measurements` | tarih, `fatPercent`, `fatKG`, `muscleKG`, `bmi`, `bodyTypeName`, referans aralıkları (`fatPercentLow/High`, `bmiLow/High`) | **Yüksek** — OKOK'u kalibre eder |
| Segmental | `GET Mobile/Measurements/SegmentalGraphic/{n}`, `SpecialMeasurements/{id}` | kol/bacak/gövde kas-yağ | Orta — kas kaybı kontrolü (açıkta) |
| Karşılaştırma | `GET Mobile/Measurements/Comparison/{1,2,3}` | ilk / önceki / son ölçüm | Düşük — kendimiz hesaplarız |
| Hoca programı | `GET Mobile/Workouts`, `Workouts/Details/{programID}/{gün}/{kardiyo}` | hoca adı, hafta günlerine workout/cardio, hareket başına `repeat`, `weight`, `imageLink`, `videoLink` | Orta — program atanmışsa bizimkiyle kıyas |
| Hoca notu | `GET Mobile/Workouts/WorkoutNotes` | not + okundu | Düşük |
| Set tiki | `POST Workouts/Details/Set/{trackID}/{workoutID}/{bool}` | yalnız tamamlandı işareti, ağırlık/tekrar YOK | Yok — kaynak biziz |
| Üyelik | `GET Mobile/MemberSummaryInformation`, `PackagesUse/`, `Memberships/` | kalan gün/kredi (`remainingCredit`, `endDateFormatted`) | Düşük — bitiş hatırlatması |
| Grup dersleri | `GET Mobile/Lessons` | ders adı + detay | Dean katılmıyorsa YAGNI |
| Giriş QR | `GET Mobile/QrCodeGenerate` | **dinamik**: sunucu üretir, 5 sn'de bir yenilenir; turnike sonucu socket.io `qrResult` (`http://85.99.230.93:6194`) | Aşağıda §3 |

Giriş geçmişi (hangi gün salona girildi) için ayrı uç **görünmüyor** — otomatik "salona gitti" kanıtı buradan çıkmaz.

**Güvenlik notları (salonun sorunu, bizim tasarımı etkiler):** turnike soketi şifresiz HTTP ve çıplak IP;
token cihazda AsyncStorage'da düz saklanıyor. Bu yüzden salon token'ı bizim sunucuda da yalnız `.env`'de durur, loglanmaz.

## 3. Giriş barkodu saate — handoff'taki soru cevaplandı

Barkod statik değil. `QrCodeGenerate` her 5 saniyede yeni kod döndürüyor, çevrimdışı üretilemez.
Seçenekler:

- **A — Saat kendi hesabıyla çağırır:** Wear uygulaması Bearer token ile `QrCodeGenerate`'i çağırıp kodu çizer.
  Resmi uygulamanın yaptığının aynısı; güvenlik önlemi aşılmıyor. Maliyet: token'ı saate taşımak + süre dolunca
  yeniden giriş. Risk: kulüp ToS'u (**doğrulanmadı**), token süresi (**doğrulanmadı**).
- **B — Telefon kalır:** turnikede telefon zaten cepte; değişiklik yok.

Öneri: **önce B**, canlı token süresi görülünce A'ya karar. Günde 1 kez 5 saniyelik iş için saat uygulamasına
kimlik taşımak şu an kazancından büyük.

## 4. Plan (öncelik sırasıyla)

| # | İş | Neden | Ölçüt | Boyut |
|---|---|---|---|---|
| S1 | **Canlı keşif:** Dean'in salon hesabıyla salt-okunur `Login` → `Measurements`, `Workouts`, `MemberSummaryInformation` yanıtlarını kaydet (`scratchpad`, repo'ya değil) | Alan adları koddan; gerçek şema + token süresi bilinmeden kod yazılmaz | 3 yanıt JSON'u elde | XS |
| S2 | **Salon ölçümü içe aktarma:** `Measurements` → `measurement` tablosu, `source='gym'` (yeni migration gerekirse `db/010_*.sql`) | Profesyonel cihaz, OKOK yağ %'sini kalibre eder; 12 hafta sonu kompozisyon kararı bununla | Son salon ölçümü uygulamada, OKOK ile fark gösterilir | S |
| S3 | **OKOK ↔ salon farkı:** aynı haftadaki iki kaynağın yağ %/kas kg farkını haftalık kartta göster | Ev tartısı tek başına yanıltır; fark sabitse OKOK trendi güvenilir | Fark satırı; TDD (hesap katmanı) | S |
| S4 | **Hoca programı kıyası:** `Workouts` doluysa hareketleri `SALON-MAKINELERI.md` id'lerine eşle, bizim plandan sapmayı listele | Hoca başka şey yazdıysa Dean iki programla kalmasın | Tek liste: ortak / yalnız hoca / yalnız biz | S — **Workouts boşsa iptal** |
| S5 | Üyelik bitiş hatırlatması | Üyelik düşerse seri kopar | Bitişten 7 gün önce tek hatırlatma | XS — düşük öncelik |
| — | QR saate (§3-A) | — | — | S1 sonrası karar |

Kapsam dışı: rezervasyon, ödeme, mesaj, grup dersleri, set tiki senkronu.

## 5. Dean'den gereken

1. Salon hesabı kullanıcı adı/şifre → `.env` (`GYM_USER`, `GYM_PASS`), sohbete yazılmaz.
2. Salonda en son ne zaman vücut analizine girdin? (Liste boşsa S2/S3 bir ölçüme bağlanır.)
3. Hoca sana program atadı mı? (Hayırsa S4 düşer.)
