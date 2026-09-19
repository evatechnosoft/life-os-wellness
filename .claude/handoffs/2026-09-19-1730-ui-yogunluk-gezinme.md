# Handoff: UI yoğunluk + gezinme turu bitti, Dean'in cihaz doğrulaması bekliyor

> 2026-09-19 17:30 · `dev` @ `e0ba135` · çalışma ağacı temiz · Pages yayında

## Hedef
Dean'in "çok çirkin, kocaman bölgeler" şikâyeti (PLAN-UI §11) + bugün gelen dört ek istek:
alt gezinmeyi daire/ikon yap, bağlantı hatasını çöz, öneriyi ayrı sayfaya al,
hareket seçimini vücut üzerinden yaptır, hareket listesini resimli dik listeye çevir.

## Durum — kanıtlı
- `dev` üzerine dört merge: `82b6712` BodyPicker · `4770da3` nav ölçek · `e0ba135`
  hareket listesi (+ `186a7df` nav ikon, `8c5855c` §11-1/§11-2). Hepsi Pages'e deploy
  oldu, `gh run list --workflow=pages.yml` son koşu `completed success`.
- Her merge öncesi `npm test` 339 pass, `typecheck` ve `build` temiz.
- Canlı ekran görüntüsüyle doğrulanan: alt gezinme (ikon + kademeli boyut),
  hareket sekmesi (`?tab=moves`, sol dikey bölge sütunu + resimli satırlar).
- Bugün ekranı yüksekliği 2020 px ≈ 2,4 ekran (headless 448 px genişlik, hedef ≤ 3).
- **Eva "Yanıt alamadım" kök nedeni Eva değil, cloudflared tüneliydi**:
  `dial tcp ...:7844: connect: network is unreachable` + DNS resolver reddi.
  `docker compose --profile tunnel up -d --force-recreate cloudflared` sonrası
  `https://fit.evaitec.com/health` 200, `POST /api/chat` 200 (4,3 s, gerçek yanıt).

## Doğrulanmadı
- BodyPicker'ın **seçili** hâli (a1 dolgusu, oranlar) yalnız kodda; headless tıklayamıyor.
- Fotoğraftan öğün tahmini (`/api/estimate`) tünel sonrası denenmedi.
- Hareket listesi çevrimdışı ilk açılışta (resimler tembel yüklenir, önbellek yok).
- PLAN-UI §11-3 matris split, §11-4 katlanır kart, §11-5 Ayar bölgeleri hâlâ yapılmadı.

## Kararlar ve gerekçe
- Kas seçimi çip yerine `ui/BodyPicker.tsx`: tek gövde konturu `clipPath`, uzuvlar
  yuvarlak uçlu çizgi. Yeni bağımlılık yok. Sırt yalnız "Arka" görünümünde — önden
  boyamak anatomik yalan olurdu.
- Hareket listesinde alet filtresi çip satırı yerine native `select`; ikinci yatay
  kaydırma satırı kalktı.
- Liste görselleri `loading="lazy"` ile doğrudan katalog URL'inden. Detay ekranı zaten
  IndexedDB'ye yazıyor, liste için ikinci önbellek katmanı eklenmedi (YAGNI).
- Koç kartı Bugün'den Eva sekmesinin başına taşındı; Bugün'e `#protein`, `#ogunler`,
  `#olcum`, `#antrenman`, `#retro` atlama çipleri kondu (`Card` artık `id` alıyor).
- `?tab=<id>` sorgu parametresi: hem kısayol hem headless ekran doğrulaması için.

## Tekrarlama
- **API konteynerini yeniden kurunca tüneli de yenile** — bugün ikinci kez ısırdı,
  HANDOFF.md'de uyarı zaten vardı.
- Siluet SVG'sini tur tur elle ovalamaya kalkma; üç turda ancak kabul edilebilir oldu.
  Oran değişikliği gerekirse tek seferde omuz/kalça genişliğini ayarla.
- Henüz olmamış öğünü/ölçümü kaydetme (19 Eylül sabahı yaşandı).
- Windows headless Chrome 390 px'e inmiyor; ölçümler 448 px genişlikte.

## Next (tek adım)
Dean telefondan bakıp BodyPicker seçili görünümünü ve gezinme ritmini onaylayınca,
PLAN-UI §11-3 (SplitEditor 7×6 matris, 32 px hücre) ile devam. Onay gelmezse önce
figürün oranlarını düzelt.
