# HANDOFF — life-os-wellness

> 2026-09-13 · dev @ ef13034 · 0 kirli dosya · origin/dev ile eşit · yayınlanan sürüm v0.10.0

## Doğrula (önce bunu çalıştır)

```bash
git fetch -q && git status -sb           # dev, origin/dev ile eşit (ef13034 veya sonrası)
git status --porcelain | wc -l           # 0 bekleniyor
npm test                                 # api 37 pass / 0 fail, web 40 pass / 0 fail
docker compose ps                        # db, litellm, api, cloudflared dördü de Up
curl -s https://fit.evaitec.com/health   # {"ok":true}
```

API testleri postgres ister: kapalıysa `ECONNREFUSED 127.0.0.1:5433` görürsün, kod
hatası değil — `npm run db:up` yeter. Kotlin testleri ayrı:
`cd apps/web/android && JAVA_HOME="/c/Program Files/Android/openjdk/jdk-21.0.8" ./gradlew testDebugUnitTest`
(17 test: HealthMath 10, SnoreAnalyzer 6, Example 1).

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
3. Nutrition okuma (`NutritionRecord`) — HealthExtra'ya eklenir, uyku ile aynı desen
4. Gözlük (evaglass) köprüsü — API hazır, iş karşı repoda bir istemci yazmak
   (ADO: `dev.azure.com/evaitec/evaitec/_git/evaglasses`)

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
- **Stres alınamaz.** Health Connect'in 43 kayıt tipinin hiçbiri stres değil. Samsung
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
seans onayı + yiyecek hafızası + hatırlatmalar + HealthExtra (kalori/nabız/SpO2/HRV/uyku).

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
- Hatırlatma bildirimi her gün aynı saatte tekrarlar, o gün kilo girilmiş olsa da
  (`ponytail:` notu `apps/web/src/lib/reminders.ts`).
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
