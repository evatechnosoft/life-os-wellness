# Life OS — Wellness Tracker

Kişisel (tek kullanıcı) günlük sağlık takibi: kilo, protein, antrenman, adım, tansiyon
ve akşam retrosu. `life-os-finance` ile kardeş repo; ortak düzen `REPO-STANDARD.md`.

Tam gereksinim: [`docs/SPEC.md`](docs/SPEC.md) · Faz/sprint planı: [`docs/PLAN.md`](docs/PLAN.md)

## Canlı

**https://evatechnosoft.github.io/life-os-wellness/** — telefonda aç, menüden
"Ana ekrana ekle". Tam ekran açılır, uçak modunda da çalışır.

Pages sürümü **sunucusuz** çalışır: veriler telefonun IndexedDB'sinde durur, Ayar
ekranından JSON olarak dışa aktarılır. Ayar ekranına bir API token girersen uygulama
kendi sunucuna senkronlamaya başlar (token girilmeden önce yazılan kayıtlar geride kalır).
`dev` dalına her push Pages'e yeniden dağıtır.

## Android (saat verisi)

APK: **https://github.com/evatechnosoft/life-os-wellness/releases/latest** — telefona kur,
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
