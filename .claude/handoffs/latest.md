# Handoff: UI düzen yayında, cihaz doğrulaması bekliyor

> 2026-09-19 · `dev` @ `9edf7e8` · çalışma ağacı temiz · Pages koşusu `35458720827` success

## Goal
PLAN-UI §14 düzen dili uygulandı: okunan üstte (glance şeridi), girilen alt sayfada
(`+`), gerisi katlı. Detay `docs/PLAN-UI.md` §14 ve §14.4; ölçümler orada.

## State
- Altı commit `dev`'de, PR #16 squash-merge edildi. Son üçü bu oturumun düzeltmeleri:
  `c9f41fc` silme etiketi, `38b91ee` devir, `9edf7e8` kilo girişi geri.
- `npm test` 339 pass · `npx tsc --noEmit -p apps/web` çıktısız · `npm run build` başarılı.
- **Gerileme bulundu ve kapatıldı:** glance şeridi salt-okunur olunca kilo girişi yalnız
  `+` alt sayfasında kaldı, Dean kilosunu yazacak yeri bulamadı. `Today.tsx › Ölçüm`
  kartına kilo alanı geri kondu, kilo boşsa kart açık geliyor.
- **Bugünün öğün kaydı sunucuda** (`https://fit.evaitec.com`, token `.env: API_TOKEN`):
  08:30 23 g · 11:45 38 g · 16:30 tavuk 207 g → 60 g · 16:30 kabaklı meze 10 g ·
  19:00 tavuk çorba 14 g. Toplam 145 g protein / 1830 kcal, `daily_log.protein_g` = 145.
  Tansiyon: ana alanda akşam 134/87, sabah 140/91 `notes` içinde (şema günde tek ölçüm tutuyor).

## Doğrulanmadı
- `ui/Sheet.tsx` alt sayfasının açık hâli **hiç görülmedi** — headless tıklayamıyor.
- 7×6 program matrisinin dokunuşu, katlama durumunun (`db.settings['ui_sections']`)
  yeniden açılışta korunması gerçek cihazda denenmedi.
- Dean'in telefonunun sunucudan çekip çekmediği: "yediklerim ekli değil" dedi, öğünler
  sunucuda duruyor. Token telefonda girili mi bilinmiyor (`hasServer()` boş token'da false).

## Next
1. Dean telefonda Bugün ekranını aşağı çekip bıraksın; öğünler görünüyor mu, kilo alanı
   Ölçüm kartında çıkıyor mu bak. Görünmüyorsa Ayar → Veri ve sunucu → token girilecek.
2. `+` alt sayfası ve 7×6 matris cihazda denensin.
3. Onay gelirse: `apps/web/src/ui/Meals.tsx` içindeki giriş satırlarını sadeleştir
   (öğün ekleme artık `+` sayfasında da var). Bugün ekranı 1416 px, hedef ≤ 1140 px
   (1,5 ekran); kalan tek kaldıraç bu.

## Don't repeat
- **448 px headless ekran görüntüsünde sağ kenarın kesik görünmesi artefakt**, gerçek
  taşma değil — 600 px'te temiz. CSS'e dokunma.
- Sayfa yüksekliği ölçerken `body::before` aurora glow tüm sayfayı doldurur; "dolu piksel"
  taraması yanıltır. Doğrusu: `x=200` (kart içi) ile `x=2` (kart dışı) parlaklık farkı,
  sabit gezinmeyi dışlamak için `y < 2850`.
- `vite preview` **https** açıyor (mkcert): `curl -k` / `--ignore-certificate-errors` şart.
- Radix eklenmedi ve gerekmiyor — native `<details>` ve `<dialog>` katlama, ESC, scrim ve
  odak tuzağını zaten veriyor. PLAN-UI §2'deki Radix kararı bu yüzden uygulanmadı.
- Haşlanmış tavuk için 34 g/100g kullanma: göğüs 30-31, but 26-28. Daha önce 200 g'a
  68 g protein denmişti, fazlaydı.
- `db.delete()` sunucudaki kaydı silmiyor; açılışta `pullRange` geri çekiyor. Düğme etiketi
  bu yüzden "Bu cihazdaki veriyi sil".

## Read first
1. `docs/PLAN-UI.md` §14 ve §14.4 — düzen kararları ve ölçümler
2. `apps/web/src/ui/Field.tsx` — `Card collapsible` sözleşmesi, `lib/ui.ts` kalıcılığı
3. `apps/web/src/ui/QuickAdd.tsx` + `Sheet.tsx` — cihazda denenecek olan
4. `AGENTS.md` — kilitli kararlar

## Verify
```bash
git rev-parse --short HEAD          # 9edf7e8 bekleniyor
git status --porcelain | wc -l      # 0
npm test                            # 339 pass
gh run list --workflow=pages.yml --limit 1
```

## Yeniden başlangıç promptu (yapıştır)

```
life-os-wellness (D:\projects\evaitec\lifeOS\life-os-wellness), dal dev @ 9edf7e8, ağaç temiz.
Dün PLAN-UI §14 düzeni uygulandı ve Pages'e çıktı: Bugün ekranında salt-okunur glance
şeridi, sağ altta + ile açılan hızlı ekle alt sayfası, katlı kartlar, Ayar üç bölge,
haftalık program 7×6 matris. Kod tarafı yeşil (339 test, tsc temiz, build başarılı) ama
alt sayfanın açık hâli ve matris dokunuşu gerçek cihazda hiç denenmedi.

Önce HANDOFF.md'yi oku ve Verify bloğunu çalıştır.
Öncelik sırası: (1) Dean'in cihaz geri bildirimini al ve çıkan kusuru düzelt,
(2) onay gelirse Meals.tsx giriş satırlarını sadeleştir.
Yeni iş açma, PLAN-UI §14.3 sırasının dışına çıkma.
```
