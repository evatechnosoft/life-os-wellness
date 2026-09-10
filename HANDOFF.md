# HANDOFF — life-os-wellness

Son oturum: 2026-09-10. Dal `dev`, her push Pages'e, `v*` tag'i APK release'e gider.

## Nerede duruyor

Canlı PWA: https://evatechnosoft.github.io/life-os-wellness/
APK: https://github.com/evatechnosoft/life-os-wellness/releases/latest

Biten: F0 Sprint 1-4 (şema, CRUD API, Bugün/Hafta/Ayar, offline kuyruk, metrics,
JSON export) + Aurora Glass teması + Health Connect (saat) + gece horlama ölçümü
(kendi Kotlin eklentimiz) + kamerayla öğün + sesli not (Eva avatarı).

Testler: API 25, web 16, Kotlin 6. Hepsi yeşil.

## Cihazda hiç denenmedi — ilk iş bu

APK derleniyor ve izinleri doğru (aapt2 dump), ama **hiçbir özellik gerçek telefonda
çalıştırılmadı**. Sırayla denenecek:

1. Health Connect izin ekranı açılıyor mu, adım/kalori geliyor mu
2. Gece ölçümü: sabah özet çıkıyor mu, **pil kaç puan düştü** (tasarım 30 sn'de 4 sn
   dinlemek üzere; yüksekse `SleepService.PERIOD_MS` artırılır)
3. Kamera + tahmin: sunucu gerekiyor (aşağıya bak)
4. Sesli not: `SpeechRecognition` Türkçe tanıma, taslak doğru mu

## Eva (sohbet) nasıl kurulu

Tek uç: `POST /api/chat` — resmi `@anthropic-ai/sdk`, model `claude-opus-5`, adaptive
thinking, `effort: low`. Web araması server tool olarak açık (`web_search_20260209`,
`max_uses: 3`); kaynak başlıkları yanıtla birlikte dönüp sohbette link olarak görünür.
Fotoğraf aynı uca base64 gider. Yanıtın sonundaki `<kayit>{...}</kayit>` bloğu ayrıştırılıp
"Günlüğe kaydet" düğmesine dönüşür — onaylanmadan hiçbir şey yazılmaz.

Öğrenme: model eğitimi yok. Her istekte son 7 günün özeti (`buildContext`) system'e
ekleniyor — cevaplar kullanıcının kendi sayılarına dayanıyor.

## Model erişimi: LiteLLM proxy (karar verildi, key bekliyor)

Uygulama hiçbir sağlayıcıya doğrudan bağlanmaz. `apps/api/src/llm.ts` yalnız iki şey bilir:
OpenAI-uyumlu bir base URL ve bir alias (`wellness-chat`, `wellness-vision`). Gerçek model
ve tüm sağlayıcı key'leri `config/litellm.yaml` + litellm container'ında. Sağlayıcı
değiştirmek = tek satır YAML, uygulamada sıfır değişiklik. RAG katmanı da oraya gelecek.

**Tek eksik: `GEMINI_API_KEY`.** `.env`'e koyunca sohbet, fotoğraf okuma ve sesli notun
anlama kısmı açılır. Anthropic key kullanılmıyor (Dean istemedi).

Doğrulanan zincir (2026-09-10):
- `docker compose up -d db api litellm` → üçü de ayakta
- `GET :3011/health` → `200 {"ok":true}`
- `GET :4000/v1/models` → `wellness-chat`, `wellness-vision` alias'ları listeleniyor
- `POST :3011/api/chat` → 502 (beklenen: Gemini key yok, zincir çalışıyor)

Sırada: key → ZimaOS'a taşı → telefon ev dışındayken erişim için Tailscale/Cloudflare
Tunnel (bu çözülmeden Eva sadece ev ağında konuşur).

**Web araması kayboldu.** Anthropic'in `web_search_20260209` server tool'uydu; Gemini/
LiteLLM yolunda karşılığı yok. Sohbetteki `sources` alanı duruyor ama boş dönüyor —
proxy'ye RAG/arama eklenince oradan doldurulacak.

## Bilinen sınırlar (kanıtlı)

- `capacitor-health` → `queryAggregated` yalnız `steps | active-calories | mindfulness`.
  **Toplam kalori, nabız, uyku, beslenme (Nutrition) yok.** Samsung Health'ten alınan
  kaloriyi çekmek için kendi Health Connect eklentimizi yazmak gerekiyor.
- Horlama tespiti eşik tabanlı (`SnoreAnalyzer`), eğitilmiş model değil. Fan/trafik
  gürültüsü tabanı yükselttiği için epizot saymıyor (test var), ama sınırı bu.
- Nefes hızı ölçülmüyor; mikrofonla güvenilir değil.
- Gece süreleri duty cycle'dan ölçeklenmiş tahmin (`estimated: true`).

## Sıradaki iş (öncelik sırası)

1. Cihazda duman testi + pil ölçümü
2. API'yi bir yere deploy et → foto tahmini ve sesli not açılır
3. Kendi Health Connect eklentimiz: uyku + Nutrition + toplam kalori
4. Hatırlatmalar (sabah tartı, akşam retro)
5. Gözlük (evaglass) köprüsü — aşağıya bak

## Gözlük entegrasyonu: köprü hazır, bağlantı yapılmadı

`evaglass` ayrı bir repo (ADO: `dev.azure.com/evaitec/evaitec/_git/evaglasses`) ve bu
oturumda ona hiç dokunulmadı. Gereken bağlantı küçük: gözlük çektiği fotoğrafı
`POST /api/chat` (veya `/api/estimate`) ucuna bearer token ile göndersin, yanıtı
kullanıcıya okusun. Yani API tarafı hazır, iş evaglass tarafında bir istemci yazmak.

## Çalıştırma

```bash
npm start        # docker postgres + migration + api + web, LAN linki basar
npm test         # api + web
npm run apk      # yerel APK (JDK 21+ otomatik bulunur)
```

Kurallar `AGENTS.md`, ürün `docs/SPEC.md`, plan `docs/PLAN.md`.
