# Life OS — Wellness Tracker

Kişisel (tek kullanıcı) günlük sağlık takibi: kilo, protein, antrenman, adım, tansiyon
ve akşam retrosu. `life-os-finance` ile kardeş repo; ortak düzen `REPO-STANDARD.md`.

Tam gereksinim: [`docs/SPEC.md`](docs/SPEC.md) · Faz/sprint planı: [`docs/PLAN.md`](docs/PLAN.md)
Saat verisini genislet + dogrudan BLE band plani: [`docs/PLAN-BAND.md`](docs/PLAN-BAND.md)

## Canlı

**https://fit.evaitec.com** — giriş adresi. Telefonda aç, menüden "Ana ekrana ekle".
Tam ekran açılır, uçak modunda da çalışır.

Uygulamayı da API'yi de aynı konteyner servis eder, yani aynı origin: tarayıcı için
CORS yok, token siteler arası gitmiyor. Kabuk açıktan yüklenir (token'ı yazacak sayfa
o), veri taşıyan her uç `/api/*` altında ve token'la kapalı. Yayın: `docker compose
build api && docker compose up -d api`.

**https://evatechnosoft.github.io/life-os-wellness/** — aynı uygulamanın Pages aynası,
`dev`'e her push ile tazelenir. **Sunucusuz** çalışır: veriler telefonun IndexedDB'sinde
durur, Ayar ekranından JSON olarak dışa aktarılır. Ayar ekranına bir API token girersen
`fit.evaitec.com`'a senkronlamaya başlar (token girilmeden önce yazılanlar geride kalır).

## Android (saat verisi)

Telefonda **evaitecOTA**'yı aç, Wellness kartından kur/güncelle. Katalog kaydı ayrı bir
depoda (`evatechnosoft/evaglass-releases` → `apps.json`) ve elle güncellenmiyor:
sürüm tag'ini push ettikten, `Build APK` koşusu bittikten sonra

```bash
node ops/publish_ota.mjs        # variables.gradle'daki sürüm
```

APK'ları katalog deposuna yükler ve `apps.json`'daki telefon + saat kayıtlarını tazeler.
İdempotent, iki kez çalıştırmak zarar vermez. **Bu adım atlanırsa telefonda eski sürüm
görünür** — katalog bir kez 0.7.1'de kaldı ve arada on iki sürüm yayınlandı.

Doğrudan APK: **https://github.com/evatechnosoft/life-os-wellness/releases/latest** — telefona kur,
Health Connect izinlerini ver. Saatten okunanlar: **adım, aktif kalori, kilo ve saatin
kendi algıladığı antrenmanlar**. Uygulama açıkken 15 dakikada bir okur.

Plugin sınırı (`capacitor-health` type tanımlarından doğrulandı): `queryAggregated` yalnız
`steps | active-calories | mindfulness` kabul ediyor → **toplam kalori ve nabız günlük
okunamıyor**; **uyku ve beslenme (Nutrition) plugin kapsamında hiç yok**. Alınan kaloriyi
Samsung Health'ten çekmek için kendi Health Connect eklentimizi yazmak gerekir.

### Gece ölçümü (saat yokken)

Saat takmadığın gecelerde telefon başucuna konur, "Gece ölçümünü başlat" denir. Mikrofon
**30 saniyede bir 4 saniye** dinler (duty cycle), pencereyi anında işler ve mikrofonu kapatır.
**Ses ne diske yazılır ne de bir yere gönderilir** — geriye yalnız sayılar kalır: izlenen süre,
tahmini horlama dakikası, horlama epizodu, horlamadan sonraki en uzun sessizlik.

Ölçülemeyenler, açıkça: **nefes hızı ölçülmüyor** — mikrofonla güvenilir şekilde çıkarılamaz.
Horlama sonrası uzun duraklama bir *işaret* olarak gösterilir, **tanı değildir**.
Süreler duty cycle'dan ölçeklenmiş **tahmindir** (`estimated: true`), tam ölçüm değil.
Pil tüketimi cihazda ölçülmedi — **doğrulanmadı**; ilk gecede sabah pil yüzdesine bak.

Yerel APK: `npm run apk` (JDK 21+ otomatik seçilir). CI: `v*` tag'i push edilince
APK build edilip release'e eklenir.

## Durum

F0 Sprint 1-3 bitti: şema + CRUD API, Bugün/Hafta/Ayar ekranları, offline kuyruk,
7-gün ortalama · uyum yüzdesi · streak · kas grubu set toplamı, JSON export.
Kalan: hatırlatmalar (Sprint 4), sonra F1 (Capacitor + Health Connect).

## Hızlı başlangıç

```bash
cp .env.example .env          # API_TOKEN'i degistir
npm install
npm run db:up                 # postgres:16 -> localhost:5433
npm run db:migrate
npm start                     # hepsini birden ayaga kaldirir, LAN linkini yazar
npm run dev:api               # ya da tek tek: http://localhost:3011
npm run dev:web               # https://localhost:5174 (/api -> 3011 proxy)
npm test                      # api entegrasyon + web birim testleri
```

`npm start` linki `?token=...` ile verir; token ilk açılışta kaydedilir ve adresten silinir.
LAN üzerinden HTTPS self-signed sertifikayla sunulur (service worker secure context ister),
telefonda bir kez "yine de devam et" demen gerekir.

## Yapı

```
apps/api/     Fastify + pg, tek statik bearer token, JSON schema doğrulama
apps/web/     Vite + React + TS + Tailwind + Dexie + vite-plugin-pwa
db/           numaralı .sql migration'lar + migrate.js
ops/          yardımcı scriptler (gen_icons.mjs)
docs/         SPEC, PLAN, ARCHITECTURE, TDD-GUIDELINE
```

## Neden PWA, neden Kotlin/Flutter değil

F1'de aynı React kodu Capacitor ile native kabuğa sarılıp Health Connect'e bağlanır.
Kotlin/Flutter seçmek F0'ı sıfırdan yazmak ve "2 hafta gerçek kullanım verisi"
hedefini geciktirmek demekti. Gerekçenin tamamı `docs/SPEC.md` §5'te.
