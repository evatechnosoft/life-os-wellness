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

Tek uç: `POST /api/chat` — OpenAI-uyumlu istemci, LiteLLM proxy'de `wellness-chat`
alias'ı, arkasında `gemini/gemini-2.5-flash`. Anthropic SDK `f8d3fa9`'da kaldırıldı.
Fotoğraf aynı uca base64 gider (`wellness-vision`). Yanıtın sonundaki `<kayit>{...}</kayit>` bloğu ayrıştırılıp
"Günlüğe kaydet" düğmesine dönüşür — onaylanmadan hiçbir şey yazılmaz.

Öğrenme: model eğitimi yok. Her istekte son 7 günün özeti (`buildContext`) system'e
ekleniyor — cevaplar kullanıcının kendi sayılarına dayanıyor.

## Model erişimi: LiteLLM proxy (kuruldu, çalışıyor)

Uygulama hiçbir sağlayıcıya doğrudan bağlanmaz. `apps/api/src/llm.ts` yalnız iki şey bilir:
OpenAI-uyumlu bir base URL ve bir alias (`wellness-chat`, `wellness-vision`). Gerçek model
ve tüm sağlayıcı key'leri `config/litellm.yaml` + litellm container'ında. Sağlayıcı
değiştirmek = tek satır YAML, uygulamada sıfır değişiklik. RAG katmanı da oraya gelecek.

`GEMINI_API_KEY` `.env`'e kondu, sohbet ve fotoğraf okuma açıldı. Anthropic key
kullanılmıyor (Dean istemedi).

**Key'in tek kopyası NetMovies yönetim panelinde:** `netmovies/data/admin.json` →
`gemini_api_key`. Azure Key Vault kopyası ölü (`~/.ai/vg.env` notu). Bu dosya kaybolursa
key kurtarılamaz, AI Studio'dan yenisi alınır.

Doğrulanan zincir (2026-09-10, key sonrası):
- `GET :3011/health` → `200 {"ok":true}`
- `GET :4000/v1/models` (Bearer proxy) → `wellness-chat`, `wellness-vision`
- `POST :3011/api/chat` → `200 {"text":"Merhaba, ben Eva, Dean'in sağlık günlüğünde
  sana yardımcı oluyorum.","draft":null,"sources":[]}`
- `POST :3011/api/estimate` (2x2 düz kırmızı PNG) → `200 {"items":[],"kcal":0,
  "confidence":"low","note":"Fotoğrafta herhangi bir yiyecek görünmüyor..."}`

Sırada: ZimaOS'a taşı → telefon ev dışındayken erişim için Tailscale/Cloudflare
Tunnel (bu çözülmeden Eva sadece ev ağında konuşur). ZimaOS 2026-09-10'da ping'e
yanıt vermiyordu, önce onu ayağa kaldır.

**Web araması geri geldi — Gemini'nin kendi Google Search'ü.** İstek gövdesine
OpenAI-standardı `web_search_options: {}` konuyor, LiteLLM bunu sağlayıcının grounding
özelliğine eşliyor; yani arama da alias gibi proxy'nin işi, `apps/api` sağlayıcı bilmiyor.
Atıflar `annotations[].url_citation` olarak dönüyor, `collectSources` bunları tekilleştirip
`sources` alanını dolduruyor (web tarafı zaten çiziyordu). Fotoğraflı istekte arama kapalı.

Canlı kanıt: "100 gram haşlanmış mercimekte kaç gram protein var?" → 3 kaynak
(wikifarmer.com, medicalpark.com.tr, yemek.com). ⚠️ Gemini atıf URL'lerini
`vertexaisearch.cloud.google.com/grounding-api-redirect/...` yönlendirmesi olarak veriyor,
gerçek alan adı değil; bu bağlantıların ömrü sınırlı.

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
2. API'yi bir yere deploy et (ZimaOS) → ev dışından erişim
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
