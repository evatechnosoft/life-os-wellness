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

## Sunucu henüz hiçbir yerde çalışmıyor

`/api/estimate` (foto → protein/kalori) ve `/api/note` (konuşma → kayıt taslağı)
Claude API kullanıyor; `ANTHROPIC_API_KEY` yoksa 503 döner ve uygulama elle girişe
düşer. Yani **bu iki özellik ancak API bir yere deploy edilince açılır** (ACA veya
ZimaOS). Pages sürümü sunucusuz: veriler telefonda, yedek JSON export.

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

## Çalıştırma

```bash
npm start        # docker postgres + migration + api + web, LAN linki basar
npm test         # api + web
npm run apk      # yerel APK (JDK 21+ otomatik bulunur)
```

Kurallar `AGENTS.md`, ürün `docs/SPEC.md`, plan `docs/PLAN.md`.
