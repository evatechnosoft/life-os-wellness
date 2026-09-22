# Handoff: 4 sekme + drawer yayında · evdeki ürünler katalogda

> 2026-09-22 12:22 · dal `feature/ia-4-sekme` @ `1b86ccf` · çalışma ağacı temiz
> önceki: `2026-09-22-1106-saat-rutini-kesim.md` (Faz 1, Samsung, saat rutini — orada kalsın)

## Hedef

Dean: "sen yapıyı kur, serverdan göndeririz, güzel bir şekle sokalım; şu bot tasarımı
genellemesini geç, trend bir şey bulalım." Faz 2'nin ilk adımı yapıldı ve canlıya verildi.
Arada beslenme soruları geldi (karides, öğün fotoğrafı, evdeki ürünler).

## Yapılan — kanıtlı

- **4 sekme + drawer** (`c858c04`): Bugün · Plan · Ölçüm · Koç. Hareket kütüphanesi ve
  Ayarlar drawer'a taşındı (`?page=moves` / `?page=settings` ile de açılır).
  `ui/Drawer.tsx`, `ui/Plan.tsx`, `lib/workoutPlan.ts`, `store.queueWorkoutPlan` yeni.
- **Plan sekmesi çalışıyor:** gün tipine dokunmak `PUT /api/workout-plan`'a gidiyor
  (çevrimdışıysa outbox). Faz 1 ucunu kullanıyor.
- **Görsel dil değişti:** aurora gradient glow + başlıktaki gradyan yazı + değişken boyutlu
  nav pill kaldırıldı; düz koyu yüzey, tek aksan (teal), tabular rakam (`stat-number`),
  `--color-surface: #11141b`. Yön: Whoop/Oura hattı — **Dean henüz onaylamadı.**
- **Canlıda:** `fit.evaitec.com` JS'inde `Hareket kütüphanesi` ve `Ölçüm` string'leri var
  (curl ile doğrulandı). `docker compose build api` + `up -d api` ile yayına girdi.
- **9 ürün katalogda** (`1b86ccf`): Fellas/Waspco barlar, Gönük yoğurt, Danone laktozsuz süt,
  Dardanel ton, RED/GREEN DE7OX, Mina maden suyu. Değerler Dean'in etiket fotoğraflarından.
- **İki öğün kaydedildi:** `2026-09-22 11:41` (tavuk+bulgur+salata+yoğurt, 57 g protein,
  `source: photo`) ve `2026-09-21 20:00` (şehriye çorba + parçalı tavuk, 32 g, tahmin).
- Testler: `347 web + 61 API + 6 ops` yeşil, `typecheck --workspaces` EXIT=0.

## Beslenme kararları (Dean'e iletildi, PROGRAM'a **yazılmadı**)

- **Kabuklular** (karides/midye/kalamar): haftada ≤2 porsiyon, ürik asit 6.0 nedeniyle aynı
  gün kırmızı et yok, su 3 L. **Yağlı balık kotasından sayılmaz** (omega-3'ü düşük).
- **Protein barı:** günde ≤1, ara öğün yerine geçmez. Tatlandırıcı maltitol — "şeker ilavesiz"
  kan şekerine etkisiz demek değil (HbA1c 5.9).
- **Gönük tam yağlı yoğurt:** 100 g'da yalnız 4 g protein → protein kaynağı sayılmaz.
- **Danone laktozsuz %1 süt:** 300 ml = 9 g protein, program §4 antrenman sonrası satırına uyuyor.
- **DE7OX:** besin değeri ~sıfır, detoks iddiasının klinik dayanağı yok; Dean'in 4 Eyl tahlilinde
  karaciğer/böbrek normal. Green'de miktarı yazmayan kafein (mate + yeşil kahve) → tansiyon
  nedeniyle atlanacak. Programa girmiyor.
- **Dardanel ton (yağda):** 50 g süzmede 340 mg sodyum, omega-3 ~100 mg → yağlı balık yerine geçmez.

## Tekrarlanmayacaklar

- **Docker imajındaki dist hash'i yerel `npm run build` ile aynı olmuyor.** "Canlı eski" diye
  panik yapma; içeriği doğrula (`curl .../assets/index-*.js | grep <yeni string>`).
- `curl -d` ile Türkçe karakter gönderme: kabuk bozuyor, ASCII yaz (öğün notu ilk denemede
  `KeyError: 'date'` ile döndü).
- Heredoc'tan JS'e `\n` yazma (üçüncü kez ısırdı) ve regex kaçışı — çok satırlı JS → Write/Edit.
- `exercises.json` bir **dict**; liste `d['exercises']` altında (43 kalem).

## Açık işler

1. **Dean'in cevabı bekleniyor:** (a) görsel yön onayı, (b) yukarıdaki üç beslenme kuralının
   `PROGRAM-2026-09.md` §4'e yazılması, (c) 19 Eylül'de eksik dediği öğün (o günde zaten
   5 öğün / 145 g kayıtlı), (d) Samsung'da karşılığı olmayan 11 kod için karar.
2. Faz 2 kalanı: Bugün sekmesinde DayStrip + SessionCard + PlateCard, Plan'da zar (`lib/plan.ts`,
   seçiciden taşınacak) + kas haritası, drawer'ın doküman sayfaları (`DocPage.tsx`).
3. Faz 3: SetRow, geçen sefer, dinlenme sayacı (uçlar hazır).
4. Dal `feature/ia-4-sekme` henüz `dev`'e merge edilmedi — Faz 2 bitince squash-merge.
5. Önceki devirden: saatte A/B/A′ rutinlerinin kurulması (Dean'in işi), 0.26.0 APK cihaz kanıtı.

## Sıradaki tek adım

Dean görsel yönü onaylarsa Faz 2'ye devam: `ui/DayStrip.tsx` + `ui/SessionCard.tsx` ile Bugün
sekmesini kur (spec `docs/superpowers/specs/2026-09-21-tek-uygulama-ia-design.md` §3).
Onaylamazsa önce `index.css` yönünü değiştir — kod değil, token işi.
