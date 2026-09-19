# Handoff: profil (S1) + ürün kataloğu — v0.19.0 yayında

> 2026-09-19 10:11 · `dev` @ `e86dfee` · çalışma ağacı temiz

## Hedef

PLAN-COACH S1 (Eva kullanıcıyı tanısın) ve PLAN-DIET S6'nın yerel katmanı
(ambalajlı ürünün kcal'i uydurulmasın) yayına alındı.

## Durum — kanıtlı

- PR #11 (egzersiz kütüphanesi) ve PR #12 (profil + ürün kataloğu + ürün arama)
  `dev`'e squash merge edildi. `dev` başı `e86dfee`.
- `npm test` → **339 test / 21 dosya geçti**. `tsc --noEmit` iki workspace'te de
  çıktısız. `npm run build -w @wellness/web` derlendi.
- Canlı API (imaj yeniden kuruldu, `docker compose up -d --build api`):
  `/health` 200 · `GET /api/profile` → `null` · örnek `PUT` satır döndürdü ·
  `sex:"x"` → 400 · `/api/export` anahtarlarında `profile` var.
  Konteynerde `grep 'ambalajlı ürünler' → ./apps/api/src/persona.ts` (yeni persona içeride).
- **Deploy PWA to Pages** koşusu `dev` push'unda success.
- **Build APK** koşusu `35427323862` exit 0; release `v0.19.0` varlıkları:
  `latest.json`, `wellness-0.19.0.apk`, `wellness-wear-0.19.0.apk`. OTA manifesti
  `versionCode 1900 / versionName 0.19.0` gösteriyor.
- Bugünün kaydı: `2026-09-19` → 107.6 kg, 134/81. Açlık şekeri 109 mg/dL
  `daily_log.notes` içinde metin olarak + `data/olcumler.md` tablosunda.

## Durum — doğrulanmadı (iddia etme)

- Profil kartı ve Öğünler'deki ürün arama **ekranda gözle görülmedi**; yalnız
  derleme ve test kanıtı var.
- S1 kabul kriterinin model tarafı denenmedi: profil dolu iken "16:8 bana uygun mu"
  → cevabın tanı/ilaç alanına değmesi. Profil **boş** (test satırı silindi).
- Telefonun v0.19.0'ı kurup kurmadığı bilinmiyor.

## Kararlar ve nedenleri

- Profil sunucuda **tek satırlık tablo** (`id=1` check): auth yok, kullanıcı tablosu
  açmak boş yere join. Dexie tarafında `settings['profile']`, outbox ile gider.
- Girilmemiş alan modele **hiç gitmez** — `profileLines` eksik alanı atlar ve
  "profilde eksik: …" satırı yazar. Amaç: model uydurmak yerine sorsun.
- Protein aralığı 1.6–2.2 g/kg; başlangıç kesimde 2.0, korumada 1.8, almada 1.6
  (yağsız kütle koruması). Ayar'daki 140 g hedefi **hâlâ eski** — Dean'in kararı.
- Ürün kataloğu `apps/web/src/data/products.json` (tek kaynak, dönüşüm betiği yok).
  Değerler paket etiketinden okundu, tahmin değil. Barkodlar fotoğrafta kesikti,
  girilmedi. İlk iki ürünün adı etikette görünmüyordu; "Servet tahin helvası
  (fıstıklı / kakaolu)" varsayımıyla kaydedildi — Dean onaylamadı.
- `findProduct` en az **iki kelime** eşleşmesi ister ("helva" tek başına yanlış
  ürünü fiyatlandırır); `searchProducts` tek kelimeyle çalışır çünkü seçim insanda.
- Ürün kaydı `estimated=false`, `source='manual'`: `MealSource`'a 'catalog' eklemek
  db check constraint değişikliği isterdi, değmez.

## Tekrarlama

- `db/006_profile.sql` uygulandı; eski migration'ı düzenleme, yeni numara aç.
- API'de route ekleyince **imajı yeniden kur** — bind mount yok, `docker compose
  up -d --build api` olmadan 404 alırsın.
- Test verisini canlı DB'de bırakma: örnek profil `delete from profile` ile silindi.
- Sürüm bump'ını doğrudan `dev`'e push ettim — **kural ihlali**, bir daha
  `feature/` dalı + PR.
- Şeker için şemaya alan açma: Dean "alanı ben açarım ya da bildiririm" dedi,
  `data/olcumler.md` o iş için var.

## Next (tek adım)

Dean profili Ayar → Profil'den doldurduktan sonra S1 kabul testini koştur:
Eva'ya "16:8 bana uygun mu" sor, cevabın tanı/ilaç alanına değdiğini çıktıyla göster.
Sonrası: PLAN-COACH **S2** (profil ekipmanı → egzersiz kütüphanesi filtresi).
