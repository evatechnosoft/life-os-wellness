# Handoff: 25 Eyl koçluk günü (kayıtlar tamam, akşam öğünü açık) · protein/BIA kod düzeltmesi onay bekliyor

> 2026-09-25 ~13:30 · koç worktree `_wt-pt` · dal `coach/dean-pt` (→ `dev`'e push) · plan: bu dosya + `docs/PLAN-GERCEKCI.md` + `docs/SALON-UYGULAMASI.md`

## Goal
1. (açık) Yapılan her şey **telefondaki uygulamada** görünsün; sonra salon verisi uygulamaya girsin (uzaktan kabuk `server.url`, salon S1 — başlanmadı).
2. (açık) Uygulamayı "gerçekçi" yap: tartı (OKOK BIA) verisini doğru kullan, protein hedefini obez vücuda göre düzelt.
3. (her gün) Dean'in öğün/seans/ölçümünü sohbetten API'ye yaz — kabul: uygulamada görünmesi.

## State — doğrulanmış (API GET / git kanıtı; telefonda görüldüğü DOĞRULANMADI)
- **25 Eyl öğünler** (`/api/meals`, toplam protein **108 g**, hedef 180):
  09:45 kahvaltı 32 g/570 · 11:00 shake 31 g/505 (süzme 210 g + laktozsuz süt ~215 ml + muz ~100 g, terazi 210→524; + 1 haşlanmış yumurta) ·
  12:09 öğle 45 g/850 (havuçlu yumurta + etli kuru fasulye 238 g + tam buğday penne ~150 g + süzme ~100 g; patates salatası yenmedi).
- **Tansiyon:** kolluk 10:15 123/75, 125/75 → `daily` 124/75. Saat aynı anda ~138/78 → saat sistolik ~+13–15 mmHg sapıyor; kolluk esas.
- **Seanslar:** `bb2dd00f` resistance 12 set ×12: Machine_Bench_Press / Wide-Grip_Lat_Pulldown / Leverage_Iso_Row 25-30-35, Machine_Triceps_Extension 20-25-30
  (arkadaşla, A′ yerine). `68c7021b` walk 13 dk (**öğle ÖNCESİ**; 0.96 km, ort. nabız 102). Bacak/dead bug/biceps/yan omuz yapılmadı — ev (lastik) ve park alternatifleri verildi.
- **Samsung zip** `--from 2026-09-24` içe aktarıldı (18 wearable; 25 Eyl adım 2637, kilo 107.8). Seanslar bilerek aktarılmadı.
- **Profil:** `equipment` += `band` (heavy/medium direnç lastiği). `medications` boş — kreatin 3 g/gün (~10 Eyl'den) Dean teyidi bekliyor.
- **Dokümanlar (dev):** `docs/TAKVIYELER.md` BCAA/whey eki · `docs/SALON-MAKINELERI.md` park aletleri (İBB Globalpark) tablosu.
- **Kod bulguları (koddan, cihazda doğrulanmadı):** `apps/web/src/lib/nutrition.ts:24` `proteinTarget()` toplam kiloyla → kesimde ≈237 g öneriyor;
  doğrusu yağsız kütle 70.4 × 2.3–2.6 ≈ 162–183 g (BIA yoksa referans kilo 76.6 × 2.0 ≈ 153 g). `COACH-EVIDENCE.md:293` "Yeterli" hükmü yanlış.
  OKOK metrikleri (`body_fat_*`, `skeletal_muscle_kg`) hiçbir hesapta okunmuyor; visceral içe aktarılmıyor.

## Decisions & why (bugün verilen koç kararları)
- BIA'dan yalnız kilo, yağ kg, yağsız kütle, iskelet kası; kompozisyon karar birimi 28 gün. Hedef 100 kg, yağ ~30 kg, iskelet kası ≥35 kg.
- Takviye: BCAA hayır, BigJoy Ripped (kafein) hayır, whey al (gelecek hafta), kreatin devam. Çoban çantası hayır; kiraz sapı serbest ama su kaybı → tartı notu.
- Kahve: **kâğıt filtre** (French press değil — kafestol/LDL, TG 302), ≤2 fincan, 15:00'e kadar, ölçümden 30 dk önce yok.
- Yemek sonrası: önce limonlu su (fasulye demiri + C), çay 1 saat sonra (tanen). Yemek sonrası 10–15 dk yürüyüş asıl kaldıraç.
- Tatlandırıcı: stevia/eritritol; muz tercih. Hoşaf suyu içilmez (şekersiz de sınırlı), erik/incir yoğurtla ara öğünde, incir bugün ≤1.

## Next — tek adım
Akşam öğününü kaydet (hedef ~45–70 g protein: tavuk/hindi/balık 150–200 g + salata, nişasta yok; açık kalırsa 100 g lor).
Sonra Dean onay verirse: `fix/protein-lbm` → TDD `proteinTarget` yağsız kütle/referans kilo; deploy; kabul = telefondaki koç kartında ~160 g aralığı.
Bekleyen Dean cevapları: kreatin teyidi → profile; ev/park seansı yapıldı mı; kahvaltıdaki bardak çay mı meyve suyu mu.
Açık kontrol: 22–24 Eyl `daily` tansiyonu saatten mi geldi (7-gün ortalamasını şişiriyor olabilir) — doğrulanmadı.

## Don't repeat
- Koç commit'leri ana checkout'a değil `_wt-pt` worktree'sine (paralel oturum ana checkout'un dalını değiştiriyor). Push: `coach/dean-pt` + `HEAD:dev`.
- Kap darası: beyaz tabak 210 g, mavi kase 197 g (hafıza `kap-daralari`); bilinmeyen kapta sor.
- Samsung importunda seansları körlemesine POST etme — aynı id setleri/notu ezer; `--from` ile dışarıda bırak.
- `/api/workouts` POST setleri id ile upsert eder, silmez → yanlış hareket: DELETE + aynı id ile yeniden POST.
- Bash `tar` Windows zip'ini açamıyor → PowerShell `Expand-Archive`. Windows python `/d/...` yolunu görmez → göreli yol.
- Doküman yazıp "yaptık" deme; kabul ölçütü telefondaki ekran.

## Sonradan eklenenler (25 Eyl öğleden sonra)
- **Kreatin** profile yazıldı (`medications`: kreatin monohidrat 3 g/gün, ~10 Eyl). Kahvaltıdaki bardak = çay.
- **ZimaOS taşıma:** keşif bitti → `docs/PLAN-ZIMAOS-TASIMA.md` (dev `54d8f0a`). Hiçbir şey durdurulmadı/kurulmadı.
  Dean'e önerilen varsayılanlar (ONAY BEKLİYOR): kapsam yalnız wellness (db+api+litellm+tünel), api ZimaOS'ta build,
  compose `/DATA` altına, `publish_ota.mjs` ZimaOS'a rsync, kesinti saatini Dean seçer. En büyük risk: aynı tünel iki makinede açık = veri bölünür.
- **Ekmek araştırması** (uno.com.tr + market sayfaları; OFF verisi eski/tutarsız): en iyi UNO Fırından Tam Buğday 450 g
  (lif 7.9, şeker 0.6, tuz 0.9), UNO Fırından Çavdar 450 g (lif 6.3, şeker 1.7), UNO Premium Çok Tahıllı ve Siyez 400 g.
  Kaçın: UNO Anadolu Çavdarlı (ilk madde beyaz un, şeker 5.6, lif 4.8) ve Çok Tahıllı, Süper Tost, X2, tüm Untad (tuz 1.2–1.4).
  UNO Anadolu Tam Buğday Tava (Şok) içindekiler iyi (%60 tam buğday) ama besin tablosu doğrulanmadı.
- Dean park + ev seansına çıktı (bacak itme + baldır aletinde, sırt uzatma; evde kısa lastikle tek kol curl, bilek-lastik yana açış, pull-apart, dead bug) — dönünce kaydedilecek.
- **Samsung import hatası:** `ops/import_samsung.mjs` günlükte yalnız BOŞ alanı dolduruyor → gün içi ikinci importta adım güncellenmiyor (25 Eyl 2637 kaldı, elle 7449 yazıldı). Düzeltme adayı: `steps` için max al. Dean'e: Samsung Health → Health Connect paylaşımı + uygulamada Ayar → senkron + APK güncelle (cihazda doğrulanmadı).
- **UI geri bildirimi (Dean, telefonda):** `docs/PLAN-UI.md` sonu — (1) üst bar/menü durum çubuğu altında (safe-area-inset-top yok), (2) uzun basış tüm sayfayı seçiyor (user-select), (3) satırda sağa kaydır=düzenle / sola=sil + geri al. **Yeni oturumun ilk kod işi bu 3'ü** (sonra protein-lbm, sonra ZimaOS onayı).
- Not: bu devir notunun güncel kopyası `dev` dalında / `_wt-pt`; ana checkout başka oturumun dalında (`chore/finans-tunel-ingress`) eski kopyayı gösterir.
- **Akşam (kapandı):** öğün 4 akşam 62 g/840 kcal (ton salata ~130 g + kıymalı kabak ~250 g + süzme 100 g + tam buğday penne ~150 g). **25 Eyl toplam: 170 g protein, ~2765 kcal** (API GET). Ton bu hafta 2. kez → hafta içi tekrar yok. Günlük adım 7449 (Samsung, elle). Park/ev seansı henüz kaydedilmedi — Dean tekrar sayılarını yazınca ayrı seans.

## 25 Eyl akşam — UI geri bildirimi kodlandı, 0.36.0 OTA'da (telefonda DOĞRULANMADI)
- `d7952f1` (dev): üst bar ve menü `--safe-top` ile durum çubuğunun altında (Capacitor SystemBars `--safe-area-inset-*` enjekte ediyor, yoksa `env()`);
  kökte `user-select: none` (input/textarea/Eva yanıtı hariç); öğün, ölçüm ve seans satırlarında `ui/SwipeRow.tsx`: sağa kaydır = aynı form dolu, sola kaydır = 5 sn "Geri al", silme şerit bitince.
  Kanıt: typecheck temiz, 379 test; headless Chrome 390 px'te (fare ile) düzenle/güncelle/geri al/sil akışı geçti. Gerçek dokunmatik jest → telefonda doğrulanacak.
- **0.36.0** tag + Build APK yeşil + `publish_ota.mjs` → katalog 0.36.0, `fit.evaitec.com/ota/wellness-0.36.0.apk` 206. (0.36.0 önceki notta yanlışlıkla "son APK" yazıyordu; son 0.35.0'dı.)
- **`server.url` yapılmadı — veri kaybı:** APK origin'i `https://localhost`; fit.evaitec.com'a geçince IndexedDB+localStorage (token, öğün fotoğrafları, gönderilmemiş outbox) eski origin'de kalır.
  Dean kararı: şimdilik yalnız APK. Önerilen yol: canlı paket (zip indir + `WebView.setServerBasePath`/`persistServerBasePath`, Capacitor çekirdeğinde; origin aynı kalır).
- Sıradaki: Dean 0.36.0'ı kurup üç maddeyi telefonda denesin → sonra `fix/protein-lbm` → ZimaOS kararları.
