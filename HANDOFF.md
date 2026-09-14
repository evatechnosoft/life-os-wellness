# HANDOFF — life-os-wellness

> 2026-09-14 · dev @ v0.12.0 · 0 kirli dosya · origin/dev ile eşit · yayınlanan sürüm v0.12.0

## Doğrula (önce bunu çalıştır)

```bash
git fetch -q && git status -sb           # dev, origin/dev ile eşit (ef13034 veya sonrası)
git status --porcelain | wc -l           # 0 bekleniyor
npm test                                 # api 46 pass / 0 fail, web 169 pass / 0 fail
docker compose ps                        # db, litellm, api, cloudflared dördü de Up
curl -s https://fit.evaitec.com/health   # {"ok":true}
```

API testleri postgres ister: kapalıysa `ECONNREFUSED 127.0.0.1:5433` görürsün, kod
hatası değil — `npm run db:up` yeter. Kotlin testleri ayrı:
`cd apps/web/android && JAVA_HOME="/c/Program Files/Android/openjdk/jdk-21.0.8" ./gradlew testDebugUnitTest`
(31 test: HealthMath 14, HighBpmWindow 10, SnoreAnalyzer 6, Example 1).

## Sıradaki iş — 1. adım

**Telefonda duman testi.** Kod tarafında bekleyen iş yok; 13 Eylül'ün beş özelliğinin
hiçbiri gerçek cihazda çalıştırılmadı. Sırayla:

1. **Samsung Health → Ayarlar → Health Connect → Uyku'yu paylaşıma aç.** Bu yapılmadan
   uyku verisi gelmez (aşağıda "Uyku" başlığı).
2. APK'yı kur (`releases/latest`, v0.10.0), `npm run link` → QR → token cihaza gider.
3. Saat kartı → "İzin ver". **İki onay ekranı** çıkar; ikincisinde kan oksijeni, HRV ve
   uyku var — atlanırsa o üç ölçüm boş kalır.
4. Bugün ekranında kontrol: toplam kalori, dinlenme nabzı, SpO2, HRV, uyku dolu mu.
5. Gece ölçümünde **pil kaç puan düştü** (tasarım 30 sn'de 4 sn dinlemek üzere; yüksekse
   `SleepService.PERIOD_MS` artırılır).
6. Hatırlatma bildirimi saatinde düşüyor mu (Ayar → Hatırlatmalar, varsayılan 09:00/21:00).
7. Kamerayla öğün, sesli not (Türkçe tanıma).

## Sıradaki iş (öncelik sırası)

1. Cihazda duman testi (yukarıda)
2. API'yi ZimaOS'a taşı → PC kapalıyken de çalışsın. **Bloke:** 192.168.1.186 ping'e
   yanıt vermiyor (13 Eylül'de de denendi).
3. Gözlük (evaglass) köprüsü — API hazır, iş karşı repoda bir istemci yazmak
   (ADO: `dev.azure.com/evaitec/evaitec/_git/evaglasses`)
4. Doğrudan BLE band (`docs/PLAN-BAND.md` §2) — band modeli belirsiz, `0x180D`
   yayınladığı doğrulanmadı; cihaz eline geçmeden kod yazılmaz

## Koç katmanı — öneriler hesaplanır, model uydurmaz

Üç saf modül, hiçbiri LLM çağırmaz; Eva yalnız hesaplanmış sonucu cümleye döker.

- `apps/web/src/lib/coach.ts` — haftalık set hacmi (alt sınır `Goals.sets_per_group`,
  üst sınır `max(hedef, 20)`), double progression (aynı ağırlıkta set başına tekrar 12'yi
  geçtiyse ağırlık: üst gövde %2.5 / alt gövde %5; geçmediyse tekrar; ikisi de yoksa set),
  deload (haftalık tonaj 7 günlük kovalarda, 5 hafta artış veya 3 hafta düşüş), `todayFocus`.
- `apps/web/src/lib/nutrition.ts` — protein hedefi 7-gün ortalama kilodan 1.6-2.2 g/kg,
  öğün slotu açığı (slot hedefi 0.4 g/kg), `suggestFoods` sevilen yiyeceklerden somut
  porsiyon, kilo trendi. `SEED_FOODS` yalnız 10 kalem **protein gramı** — kalori/besin
  veritabanı değil (AGENTS kilidi), geçmişten öğrenilen değer tohumu her zaman bastırır.
- `apps/web/src/lib/coachText.ts` — ekrandaki Türkçe cümleler. Eva'nın gördüğü kısa
  biçim ayrı (`chat.ts` `coachLines`, ~35 karakter/öneri); örtüşme bilinçli.

**Veri yoksa öneri üretilmez** (`no_data`) — tahmin, veri yokluğunu gizler. `reps_total`
girilmeye başlanmadan ilerleme önerisi çıkmaz; alan `WorkoutForm`'da, zorunlu değil.

İsim eşleştirme `foldTr` üzerinden (Türkçe harf + büyük/küçük katlanır), yoksa
"yumurta beyazı" ile "yumurta beyazi" iki ayrı kalem sayılıp aynı şey iki kez önerilir.

## Nabız, seans tanıma ve doğal giriş

**Canlı nabız yok ve bu mimaride olamaz.** Health Connect geçmiş kayıt verir; üstüne
kendi senkronumuz uygulama açıkken 15 dakikada bir çalışır, yani gecikmenin tabanı 15 dk.
Gerçek canlılık Wear OS uygulaması ya da BLE bandı ister. Ölçüm cihaza taşındı: en taze
nabız örneğinin yaşı `hr_lag_min` metriği olarak Saat kartında görünür — duman testinde
gerçek sayı çıkacak.

Kurulan şey son okunan **yüksek nabız penceresi**: 120 bpm üstü (`HIGH_BPM_THRESHOLD`,
JS'ten ezilebilir), en az 5 dk, 10 dk'dan kısa düşüş pencereyi bölmez (set arası dinlenme
ve saatin örnek seyreltmesi). Saat seansı zaten tanıyorsa sorulmaz, onaya gider;
tanımıyorsa günde en fazla 2 soru sorulur (`MAX_HR_QUESTIONS_PER_DAY`).

`watchExercise.ts` Health Connect egzersiz adını `WorkoutType`'a eşler (35 tip);
eşlenemeyen `null` döner, `needs_review` kalır. "Ben değildim" reddi artık kalıcı
(`settings.dismissed_workouts`) — eskiden sonraki senkron aynı id ile geri yazıyordu.

`workoutText.ts` doğal cümleyi antrenman taslağına çevirir ("bench 60 kg 3 set 10 tekrar").
Onay kapısı aynı: kullanıcı onaylamadan hiçbir şey yazılmaz. Model kaldırılan ağırlığı
vücut kilosu olarak da yazıyordu — `fillWorkout` bunu ayırıyor, yoksa 7-gün ortalaması
sessizce bozulurdu.

## Koç sabitleri kanıta bağlı

`docs/COACH-EVIDENCE.md` kaynaklı temel, `docs/COACH-PERSONA.md` ton ve sağlık sınırı.
Sabit değiştirmeden önce o dosyaya bak; kod ona uyar, tersi değil. Kilo hedefi artık
yüzde (`Goals.weekly_loss_pct`, varsayılan %0.7); eski `weekly_weight_loss_kg` kayıtlıysa
korunur ve kullanılır, kullanıcı yeni alanı kaydedince yüzde devralır.

## Uyku — kod hazır, veri Samsung'da kilitli

`SleepSessionRecord` okunuyor, seans uyanılan güne yazılıyor (`sleep_min`). Ama 11 Eylül
dökümünde `sleep_session_record_table` sıfır satırdı: Samsung Health uykuyu kendi içinde
tutuyor, Health Connect'e yazmıyor. Açılması gereken ayar Samsung Health tarafında.
Mikrofon ölçümü (`sleep_monitored_min`, `snore_min`) ayrı bir şey — uyku süresini değil,
mikrofonun dinlediği pencereyi sayar ve elle başlatılır.

## Saatten ne alınıyor, ne alınamıyor (kanıt: connect-client-1.2.0-alpha01 sınıf listesi)

- **capacitor-health:** adım, aktif kalori, kilo, antrenman. `queryAggregated` yalnız
  `steps | active-calories | mindfulness` kabul ediyor, `queryRecords` adım + vücut
  kompozisyonu — sınırı bu.
- **Kendi eklentimiz** (`HealthExtraPlugin.kt`): toplam kalori, nabız, kan oksijeni, HRV,
  uyku. Telefonda aktif kalori boş, dolu olan toplam kalori (Fitbit) ve nabız (Samsung).
- **Stres alınamaz.** Health Connect'in 42 kayıt tipinin hiçbiri stres değil. Samsung
  skoru HRV'den türetip kendi uygulamasında tutuyor; ham ölçü olarak HRV (RMSSD) alınıyor.
- **İzin ikiye bölündü.** capacitor-health'in izin listesinde SpO2, HRV ve uyku yok; bu
  üçünün onay ekranını `HealthExtraPlugin.requestExtraPermissions` kendisi açıyor.
- **Çoklu kaynak toplanmaz.** Samsung + Fitbit + HC aynı günü ayrı yazıyor; toplamak üç
  kat sayardı. Gün başına en yüksek tek kaynak alınır (`HealthMath.dailyCalories`,
  `dailySleepMinutes`, `ops/import_health.mjs` — üçü de aynı kural).
- **Senkron aralığı:** uygulama açıkken açılışta + 15 dk (`App.tsx:51`). Kapalıyken arka
  plan senkronu yok; veri HC'de birikir, uygulama açılınca son 7 gün toplu gelir.

## Tekrarlama (denendi, ölü)

- Cloudflare'de WAF kuralı: `~/.ai/vg.env`'deki iki evaitec token'ının ikisinde de yazma
  yetkisi yok (`POST /zones/<id>/rulesets` → `10000 Authentication error`). Koruma bu
  yüzden kodda. Kural isteniyorsa token'a `Zone / WAF / Edit` izni eklenmeli.
- `Docker Desktop.exe -Restart`: engine 500 verirken işe yaramıyor, `wsl --shutdown` +
  temiz açılış gerekiyor. Port dinliyor olması ayakta demek değil.
- Eva'nın sistem isteminde "porsiyonu sorma, varsay" demek yetmiyor — model "zaten
  hallettim" moduna girip `<kayit>` taslağını hiç yazmıyordu. Kural taslağı açıkça
  istemeli (`apps/api/src/chat.ts` SYSTEM).
- Kendi Kotlin eklentimizde metod adı `checkPermissions`/`requestPermissions` olamaz —
  Capacitor `Plugin` sınıfındakileri gölgeler, derleme hatası.
- `capacitor-health` ile uyku/SpO2/HRV okumaya çalışmak: kütüphanede yolu yok, kendi
  eklentimiz bu yüzden var.

## Nerede duruyor

Canlı PWA: https://evatechnosoft.github.io/life-os-wellness/
APK: https://github.com/evatechnosoft/life-os-wellness/releases/latest (v0.10.0)

Biten: F0 Sprint 1-4 + Aurora Glass teması + Health Connect + gece horlama ölçümü +
kamerayla öğün + sesli not + geçmiş veri aktarımı (153 gün) + haftalık program +
seans onayı + yiyecek hafızası + hatırlatmalar + HealthExtra (kalori/nabız/SpO2/HRV/uyku/protein) + koç katmanı.

Sürüm tek kaynak: `apps/web/android/app/build.gradle` → `appVersion`. Git etiketiyle aynı
tutulur, `versionCode` ondan türer. Yayın: `appVersion` güncelle → commit → `v*` tag push
→ Actions APK derleyip release'e ekler. Her `dev` push'u Pages'e gider.

## Eva ve model erişimi

Tek uç: `POST /api/chat` — OpenAI-uyumlu istemci, LiteLLM proxy'de `wellness-chat` /
`wellness-vision` alias'ı, arkasında `gemini/gemini-2.5-flash`. Uygulama hiçbir
sağlayıcıya doğrudan bağlanmaz; sağlayıcı değiştirmek `config/litellm.yaml`'da tek satır.

Her istekte son 7 günün özeti + sık yenen yiyeceklerin geçmiş değerleri system'e ekleniyor
(`apps/web/src/lib/chat.ts` `buildContext`). Model eğitimi yok. Yanıttaki
`<kayit>{...}</kayit>` bloğu "Günlüğe kaydet" düğmesine dönüşür — onaylanmadan hiçbir şey
yazılmaz.

Web araması Gemini'nin kendi grounding'i (`web_search_options: {}`), atıflar
`annotations[].url_citation`. ⚠️ Atıf URL'leri `vertexaisearch.cloud.google.com`
yönlendirmesi, gerçek alan adı değil; ömürleri sınırlı.

**`GEMINI_API_KEY`'in tek kopyası NetMovies yönetim panelinde:** `netmovies/data/admin.json`
→ `gemini_api_key`. Azure Key Vault kopyası ölü. Bu dosya kaybolursa key kurtarılamaz.

## Ev dışından erişim

Wellness'in kendi Cloudflare tüneli var (`wellness`, `59988d1b-…`). Ayarlar panelde değil
repoda: `ops/cloudflared/config.yml` → `fit.evaitec.com` → `http://localhost:3011`.
Kimlik dosyası `~/.cloudflared/<id>.json`, repoda değil; compose `.env`'deki
`CF_TUNNEL_CREDENTIALS` yolundan salt-okunur bağlanıyor.

⚠️ **`api` konteynerini yeniden kurarsan tüneli de yeniden başlat** — cloudflared
`network_mode: service:api` ile api'nin ağ namespace'ini paylaşıyor, api yeniden
yaratılınca tünel 502 veriyor: `docker compose --profile tunnel up -d cloudflared`.

⚠️ Tarayıcıda `https://fit.evaitec.com` açmak `{"error":"unauthorized"}` verir — orası
web sitesi değil API.

**Telefonu bağlamak: `npm run link`.** Token elle yazılmaz; komut `.env`'deki `API_TOKEN`'ı
linke koyup QR basar, telefon okutunca token'ı kaydedip adres çubuğundan siler. `--lan`
eklersen link LAN adresi taşır, telefon tünele çıkmaz.

## Bilinen sınırlar (kanıtlı)

- Horlama tespiti eşik tabanlı (`SnoreAnalyzer`), eğitilmiş model değil. Fan/trafik
  gürültüsü tabanı yükselttiği için epizot saymıyor (testi var).
- Nefes hızı ölçülmüyor; mikrofonla güvenilir değil.
- Gece süreleri duty cycle'dan ölçeklenmiş tahmin (`estimated: true`).
- Hatırlatma, uygulama günlerce hiç açılmazsa o günler yine çalar; zamanlama yalnız
  uygulama açıkken yeniden kuruluyor (arka plan görevi yok).
- Eva'nın modeli Gemini free tier: dakikada 5 istek. Kotaya takılınca 429 döner,
  kullanıcı "Eva şu an yoğun" mesajını görür. Otomatik retry bilerek kapalı
  (`llm.ts` `maxRetries: 0`) — kotayı iki kat yiyordu. Kalıcı çözüm ücretli anahtar.
- `API_TOKEN` 10 Eylül'de bir kez terminale basıldı; döndürülmesi öneriliyor, acil değil.

## Çalıştırma

```bash
npm start        # docker postgres + migration + api + web, LAN linki basar
npm test         # api + web
npm run apk      # yerel APK (JDK 21+ otomatik bulunur)
```

Kurallar `AGENTS.md`, ürün `docs/SPEC.md`, plan `docs/PLAN-F1.md`, mimari
`docs/ARCHITECTURE.md`. Günlük değişiklik geçmişi commit mesajlarında — bu dosya onları
tekrarlamaz.
