# Handoff: 30 Eyl kapanış — bildirim BUG'ı öncelikli, protokol takibi Pzt 5 Eki'ye tasarlanıyor, saat UX ayrı ajan

> 2026-09-30 son güncelleme · dal `dev` temiz (`c4e1c06`), untracked yalnız `.claude/plan-backup-2026-09-29.json` + `.claude/worktrees/` · en yeni bölümler EN ALTTA (29 Eyl akşam → 30 Eyl)
> Sıra: (1) BUG bildirim senkron (aşağıda) → (2) Dean'in 30 Eyl seans/öğün rakamları API'ye → (3) `feature/protokol` (PLAN-PROTOKOL.md) → (4) `feature/wear-ux` ayrı ajan

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

## 25 Eyl gece — canlı paket + Plan düzenleme, 0.37.0 OTA'da (telefonda DOĞRULANMADI)
- **Canlı paket** (`2c7bd2a`): sunucu `/bundle/` altında native derlemeyi sunar (Dockerfile), APK açılışta `bundle.json` karşılaştırır,
  `WebBundlePlugin.kt` `files/web/<sürüm>`e indirir + Capacitor `serverBasePath` tercihine yazar; "Yeni ekranlar indi · Yenile" şeridi.
  Origin `https://localhost` kalır. `min_native` = variables.gradle versionCode → sürüm bump'ından sonra eski APK paketi almaz.
  **Artık web değişikliği = `docker compose up -d --build api` (+ health 200 kontrolü).** APK yalnız native değişince.
  Paket hash'i makineye göre değişiyor (Windows/Docker/CI) → 0.37.0 kurulunca ilk açılışta bir kez iner; zararsız.
- **Plan** (`00651ed`, `4558abe`): direnç günlerinde hareket listesi; satıra dokun → alt sayfa: set −/+, Kaldır, kütüphanede ara/yerine koy, hareket kartı; "+ Hareket ekle".
- Sunucu d48901f ile yeniden kuruldu: health 200, `/bundle/bundle.json` min_native 3700, CORS https://localhost. 0.37.0 katalogda, APK 206.
- **Açık: Koç "düşünürken patladı".** Sunucu loglarında telefondan hiç `/api/chat` yok. Tahmin (doğrulanmadı): Ayar'da LAN sunucu adresi → 25 sn timeout → cihaz-içi Gemma çöküyor.
  Dean'e soruldu: Ayar sunucu adresi ne, uygulama kapandı mı, "Modeli sil" görünüyor mu.

## 26 Eyl — Koç çökmesi
- `39ba0d4` (dev): cihaz-içi Gemma istemi 1280 token penceresini aşıyordu (sunucu personası 6886 karakter) → kısa yerel persona, istem ≤2400 karakter. Canlı paketle yayında.
- Dean telefonda doğruladı: Koç sunucudan cevap veriyor (`POST /api/chat` 200, 7.3 sn). Uçak modunda yerel model testi YAPILMADI.
- Sıradaki: `fix/protein-lbm`.
- `55915d3`: sohbet sırası (UUID → zaman sıralı id) + çevrimdışı önce kural motoru, serbest soruda model ek yorum. Uçakta yerel model çökmedi (Dean), cevap kalitesi zayıftı.
- `6b568e8`: 21:00'de 17:00 sonrası öğün yoksa "Akşam yemeği" kartı + yerel bildirim (id 3). Telefonda doğrulanmadı.
- 26 Eyl kayıtlar: 107.4 kg, TA 114/74, öğünler 157 g / 2500 kcal; 24 Eyl akşam TAHMİN 55 g/800 eklendi; 25 Eyl adım 12.026.
- Samsung BIA (yağ %32.5, iskelet 39.0) source=samsung ayrı; OKOK ile karıştırma.
- `d8674c6`: protein hedefi yağsız kütleden (son 28 gün BIA ortancası, `recentLeanMass` chat.ts) → 2.3–2.6 g/kg LBM; Dean verisiyle LBM 70.3 → 162–183, kesimde ~172 g (eski ~237). Paket `e466c6e5`, health 200. Telefonda DOĞRULANMADI.
- Deploy tuzağı: `docker compose up -d --build api` bir kez "Started" deyip konteyneri YENİLEMEDİ (eski paket kaldı). Her deploy sonrası `bundle.json` version değişti mi bak; değişmediyse tekrar çalıştır.
- Sıradaki tek adım: Dean telefon modeli/RAM'i söyleyince Gemma 3n E2B (~3 GB, fit.evaitec.com'dan sunulur; GitHub release 2 GB sınırı) kararı. Açık: COACH-EVIDENCE.md:293 "Yeterli" hükmü bayat.


## 26 Eyl gece — telefon bağlantı/güncelleme zinciri (hepsi dev + canlı; telefonda DOĞRULANMADI)
- Kök neden: telefonda Ayar "Sunucu adresi" = `http://192.168.1.185:3011` (eski LAN; sunucu artık 192.168.0.4). Telefon kendini sunucusuz sanıp eski yerel veriyle kaldı (yalnız 22 Eyl kilo), Koç "Sunucu kapalı". Dean'e: alanı boş bırak.
- `e016ec2` api: elle adres 5 sn'de ulaşılamazsa DEFAULT_BASE (fit.evaitec.com); 4xx'te ikinci deneme yok. + antrenman set/tekrar/kg/dk etiketleri üstte sabit.
- `1a56db5` canlı paket: `bundle.json` da iniyor (yoksa "Yeni ekranlar indi·Yenile" döngüsü). Eski kod çalıştığı için 2 kez daha Yenile gerekebilir.
- `c507906` telefon güncelleme önbelleği kurulu sürüme bağlı ("0.37.0 hazır" bandı kurduktan sonra kalıyordu) + PWA SW `/api|plan|ota|bundle` gezinmesini yutmuyor.
- `0ef1c85` "Makine doluysa": mobility (mechanic other + Kneeling_Hip_Flexor) kuvvet hareketinin yerine önerilmez.
- `ffe8383` Hafta sekmesi "Vücut kompozisyonu" kartı (OKOK, 28 gün, lib/body.ts, ui/Body.tsx, ui/Sparkline.tsx).
- Son canlı paket `5e41b4a2`, health 200.
- Çalışan alt ajan: `fix/hareket-turkce` (43 hareketin Türkçe talimatları + alternatif kural denetimi) — worktree'de, push/deploy YOK; bitince merge + deploy + bundle version kontrolü.
- Açık: saat uygulaması tuşları (Dean: "gönder/güncelle çalışmıyor"; sunucuda 24/26 Eyl nabız geldi) → ekran fotoğrafı istendi, sonra 0.38.0 (titreşim+mesaj geri bildirimi). Telefon sürümü sorusu cevapsız. Gemma 3n kararı (telefon modeli/RAM). ZimaOS taşıma onayı (bilgisayar kapanınca sunucu yok).
- 26 Eyl kayıt: 107.4 kg, TA 114/74 + akşam 119/71 (measurement), 159 g / ~2795 kcal (+tekila-tonik 140), adım 7.601, OKOK yağ 37.2 kg / iskelet 35.1 / viseral 25.5 / BMR 2018. 12→26 Eyl yağ −1.0 kg, kas sabit. Bakım ~2500 kcal; hedef ort. 2000–2100.

## 27 Eyl sabah
- `9c65559` hareket Türkçe talimatları + alternatif aynı tür/yön (alt ajan işi bitirildi). `ffa1fc2` Plan: alternatif şeridi aynı sırada değiştirir, Kaldır sonrası yeni hareket o sıraya girer, ↑/↓; Kütüphane Liste/Kart (2'li kare) görünümü. 415 test. Canlı paket `fa7fed1e`. Telefonda DOĞRULANMADI.
- Samsung zip 26–27 Eyl içe aktarıldı; 27 Eyl daily'deki saat TA 131/80 silindi (nota yazıldı), 26 Eyl adım 7621.
- Telefon S24 Ultra (12 GB) → hedef Gemma 3n E4B int4 `.task` (4.4 GB, google/gemma-3n-E4B-it-litert-preview). HF indirme 403: lisans Dean'in HF hesabında kabul edilmemiş. Kabul sonrası: indir → fit.evaitec.com'dan sun → LocalLlmPlugin URL/SHA/MAX_TOKENS + localLlm.ts istem sınırları → APK 0.38.0.

## 27 Eyl akşam — Gemma 3n E4B
- PR #22 (`48491cd`) + tag v0.38.0: cihaz-içi model Gemma 3n E4B int4, `https://fit.evaitec.com/ota/gemma-3n-E4B-it-int4.task` (4405655031 B, sha 2b8e9d04…ac4f = HF LFS oid). MAX_TOKENS 4096, istem 7200 karakter, eski `.task` indirmede silinir. `ota/*.task*` gitignore.
- Canlı paket `ed4544475525cac8` min_native 3800 (eski APK yeni istem sınırını almaz). OTA katalog 0.38.0, APK 200.
- Telefonda DOĞRULANMADI: Ayar > Cihaz-içi Eva > indir (Wi-Fi, 4.4 GB) → uçak modunda soru. RAM/çökme ve cevap süresi bakılacak.
- 27 Eyl öğünler: 151 g P / 3215 kcal (sabah+akşam fotoğrafla düzeltildi).

## 27 Eyl gece — Nano + bulut yedeği
- 0.38.1 DownloadManager, 0.38.2 tarayıcı indirmesi (/sdcard/Download, tam boyut), 0.39.0 Gemini Nano (ML Kit genai-prompt beta4, Kotlin 2.3.21) önce, Gemma yedek. Dean'in telefonu **Galaxy Z Fold 7** (ML Kit GenAI resmi listesinde; cihaz kontrolü yok, `checkStatus()` çalışma anında karar verir); S24 Ultra ikinci telefon.
- PR #26 (`7a29d56`): sunucu kapalıyken Firebase AI Logic (gemini-2.5-flash) + App Check reCAPTCHA Enterprise. Proje `evaitec-wellness` (deancjx@gmail.com, Spark — veriyle gönderim Dean onaylı). Domainler fit.evaitec.com, localhost, evaitec-wellness.web.app. Canlı paket `05107bd05ae6ea40`, health 200.
- DOĞRULANMADI: WebView'de reCAPTCHA puanı / AI Logic çağrısı (403 olursa konsol AI Logic → Get started; düşük puanda Play Integrity). App Check henüz ENFORCED değil — çalıştığı görülünce `setup_ai.py --enforce`.
- Kaçış tuzağı: Bash heredoc içinde python'a `\n` yazınca gerçek satır sonuna dönüşüyor → TS dosyalarında Edit tool kullan.


## 28 Eyl — koçluk (hepsi API'de, GET ile doğrulandı; telefonda görüldüğü DOĞRULANMADI)
- **Öğünler** (3 kayıt, 131 g P / 1575 kcal): 08:11 `eb5b0228-...0357` kahvaltı 42/520 (Dean payı 3 yumurta + lor 100 g, yağsız menemen, kaşar, UNO Denge 1 dilim) ·
  10:39 `...0358` shake 24/400 (Eker süzme 214 g + laktozsuz süt 200 ml + muz + tarçın) · 12:08 `...0359` öğle 65/655 (bonfile ~200 g + pilav 2-3 yk + Mis light 100 g + parmak patates ~80 g + ketçap).
  Akşam `...0360` 65/790 (bonfile ~100 g kızla paylaşıldı + parmak patates ~60 g + ton-patates salatası + pirinçli ıspanak ~250 g + süzme 100 g; paylar tahmin).
  **Gün: 4 kayıt 196 g P / 2365 kcal** (GET doğrulandı). Haftalık ton hakkı (1) kullanıldı. Gün kapandı: daily steps 6287 (saat ekranı, yürüyüş dahil, 113 dk aktif, 844 kcal) PUT+GET doğrulandı. Dean hafif yorgun; uyku 23:30 + su önerildi.
- **Seanslar:** `5d1f0c2e-...0001` resistance 38 dk 18 set (Leg ext 35/40/45, Bench 30/35/40, Close-grip pulldown 30/35/40, Arnold 5/7.5/10, EZ curl 10/15/20, Dead bug 3×10; tekrar 12 VARSAYIM) · `...0002` cardio yüzme 11 dk 275 m HR 116.
- **Plan:** Pzt → Close-Grip_Front_Lat_Pulldown + Arnold_Dumbbell_Press + EZ-Bar_Curl; Cum → Wide-Grip_Lat_Pulldown. GET doğrulandı.
- **Ölçüm:** 28 Eyl kilo 107.9, bel 117/113 (23 Eyl ile aynı), OKOK 10 metrik wearable'a (yağ %34.8, iskelet 35.2). Adım düzeltme: 24→10451, 26→7684, 27→9745 (Samsung arşivi `6bd60b8a-...zip`).
  Importer ÇALIŞTIRILMADI: arşivdeki 2 seans bugünkü elle kayıtların kopyası olurdu (farklı id), saat TA'sı daily'ye girmemeli.
- **Haftalık:** 7-gün kilo ort 107.74 (önceki 107.78) → 23 Eyl kuralı tetiklendi: **dinlenme günü akşam karbonhidratı yok** (Dean'e bildirildi). Adım ort 9762. Kolluk TA ort 121/78.
- **TA serisi:** Dean onayıyla 18–21 Eyl bp null'landı, eski değerler notes'ta; yedek `$TEMP/bp_backup_18_21.json` (scratch, kalıcı değil — değerler notes'ta zaten).
- ZimaOS WOL: `~/.ai/scripts/home-net/zima_wol.py` (LAN NIC bind); hafıza `zima-ac-wol`. Kapalıyken betikle uyandırma henüz denenmedi.

## Don't repeat (28 Eyl)
- Servis tabağı/tepsi fotoğrafı = aile ortak; Dean'in payını sor/yaz (hafıza `menemen-yagsiz-paylasimli`).
- Bash `curl -d` ile Türkçe/`·` içeren gövde → Content-Length 400; gövdeyi dosyaya yaz, `--data @file`.
- `POST /api/workouts` cardio için `sets: []` zorunlu.

## 29 Eyl — sunucu kapalı, iki PR, diyetisyen listesi
- **Sunucu KAPALI:** `fit.evaitec.com/health` 530, bu PC'de Docker Desktop çalışmıyor, ZimaOS 192.168.1.186 ping yok. Bugünkü hiçbir veri API'ye YAZILMADI.
- **PR #29** (`acaecea`): persona — kısıtlama kilidi yalnız ilaç/tedavi alan tanıda; izlem bandı + takviye kilidi açmaz; plato/kreatin kuralı; PROGRAM §8. API testleri 41 pass, 1 fail = Postgres :5433 kapalı (değişiklik öncesi de aynı). Deploy EDİLMEDİ.
- **PR #30** (`56190b7`): bildirim seli kök nedeni — `@capacitor/local-notifications` `at`+`repeats` → `setRepeating(at, at-now)` (LocalNotificationManager.kt:320), `every` yok sayılıyor → 21:00 bildirimi 10 dk'da bir / akşam bildirimi sabah. Artık tek seferlik `at`; Bugün kartında "Geç" (settings `reminders_skipped` {date, ids}). Web 419 test, typecheck temiz. Deploy EDİLMEDİ, telefonda DOĞRULANMADI.
- **Bugün (Dean, sohbet — API'ye girilmedi; Dean uygulamaya kendisi girecek):** kilo 107.5, TA 114/79, kahvaltı 2 haşlanmış yumurta + dünden lorlu yumurta + domates/biber/yeşillik ≈25–28 g P / ~380 kcal. Mide bulantısı + yorgunluk (protein tamamlamak için fazla yeme).
- **Diyetisyen belgeleri geldi (fotoğraf):** ① "Ketojenik" 5 gün (~1000–1200 kcal, yumurta beyazı, 100 g kıyma/150 g tavuk, kuruyemiş, günlük 1 L yeşil çay+limon+maden suyu) · ② dengeli liste (2 dilim tam buğday, köfte/tavuk 120 g, akşam çorba + sebze/baklagil + yoğurt, spor sonrası whey 24 g, kreatin, 2.5–3 L su; ~1700–1900 kcal, ~110–130 g P). Tahlil: AKŞ, HOMA-IR, lipid, ALT/AST, TSH, T4, hemogram, demir, ferritin, Mg, B12, folik asit.

## Decisions (29 Eyl)
- 180 g protein hedefi bırakıldı; diyetisyen süreç sahibi, esas liste ②. Koç ona çelişmemeli. (Önerilen 140–160 g bandı, ② listeyle ~110–130 g — diyetisyenin hedefi geçerli.)
- ① keto: itiraz yok; Dean diyetisyene süresini ve antrenman günlerinde ne yeneceğini soracak.
- Tahlil: hekime kreatinin/eGFR + HbA1c eklemesini sor; kreatin kullanımını söyle (kreatinini yükseltir). 10–12 saat açlık, öncesinde kahve/kreatin/ağır antrenman yok.

## 29 Eyl öğleden sonra
- **Sunucu tekrar açık:** Docker (başka biri/oturum başlatmış) → `fit.evaitec.com/health` 200, `/api/meals|daily` 200 (query `start`/`end`). PR #29/#30 içeren api imajıyla mı çalışıyor DOĞRULANMADI → `bundle.json` version kontrol + gerekirse `docker compose up -d --build api`.
- **Gerçek bakım ≈ 2600 kcal:** 22–28 Eyl tam kayıtlı 7 gün ort 2630 kcal, kilo 107.4–107.9 sabit (API GET). Hedef 2000–2100 kcal, protein 130–150 g (Dean'e söylendi; 180 g hatasını kabul ettim — kalori fazlasının ve bulantının kaynağı).
- **Dews Life (@bthnkuru) araştırması** (alt ajan, web): yöntem kamuya açık değil; paket 2/4/6 ay 2.899/5.199/7.299 TL; Şikayetvar'da aynı liste/monoton/geç program şikâyetleri; "2 ayda −46 kg" fizyolojik olarak su/glikojen. Dean'e çerçeve verildi: 0.5–1 kg/hafta, adaptif TDEE, keto şart değil.
- **Tansiyon normal** (Dean itiraz etti, haklı): kolluk ort 121/78, bugün 114/79 → artık tansiyon gerekçesiyle kısıtlama yok, crunch serbest. Kardiyo/yemek sonrası yürüyüş gerekçesi TG + HbA1c.
- Tahlil 4 Eyl özeti `docs/PROGRAM-2026-09.md` §1b'de; TSH/T4, HOMA-IR, Mg, folik, demir sayısı yok (orijinal PDF bizde değil).
- Hafıza: `telefonda-kisa-cevap` — Dean telefondan okuyor, uzun liste/tablo kayıyor → kısa paragraf.

## 29 Eyl akşamüstü — kayıtlar API'de (POST 201 + GET doğrulandı)
- daily 29 Eyl: 107.5 kg, TA 114/79. Öğünler id `29a0e2c1-0929-4a11-9c00-00000000000{1,2,3}`: kahvaltı 27/380 · öğle 62/700 (tavuk ~150 g + bulgur ~150 g + yoğurtlu karnabahar) · shake 15:20 52/600 (süzme 200 + light yoğurt 200 + süt 200 + muz + whey 24). akşam `...0004` 25/490 (kıymalı karnabahar ~300 g + salata payı ~150 g + yoğurt ~150 g). **Gün kapandı: 4 öğün 166 g P / 2170 kcal** (GET doğrulandı; bakım 2600'ün ~430 altı, shake yüzünden hedefin biraz üstü).
- Etiket yorumu (kaydedilmedi, yenmedi): vegan fıstık/fındık ezmesi 587 kcal/100 g → 1 yk/gün; kırma yeşil zeytin tuz 5.5 g/100 g → 5 adet; Akmaz tam yağlı süzme peynir 218 kcal, doymuş 12 g → ~30 g, light'a geç.

## 29 Eyl akşam — antrenman denetimi + yeni plan + deploy (kanıtlı)
- Alt ajan web denetimi: hata piramit setler (ilk setler ısınma → 28 Eyl 18 setin ~6–8'i etkili; Robinson 2024, Refalo 2023) + bacak/arka zincir hacmi düşük. Makine ≈ serbest ağırlık (Haugen 2023). Düzeltme: ısınma sonrası düz set, RIR 1–3, gerçek tekrar kaydı.
- **Yeni plan** (Dean "oluşturucuda yap, göreyim"; PUT 200 + GET): Pzt A Leg_Press, Seated_Leg_Curl, Machine_Bench_Press, Close-Grip_Front_Lat_Pulldown, Side_Lateral_Raise×3, Dead_Bug×2 · Çar B Barbell_Hip_Thrust, Romanian_Deadlift, Leverage_Iso_Row, Leverage_Incline_Chest_Press, Machine_Triceps_Extension, Pallof×2 · Cum A′ Leg_Press, Leg_Extensions×2, Wide-Grip_Lat_Pulldown, Butterfly×2, Machine_Bicep_Curl, Calf_Press×2, Arnold×2 · Sal/Per swim kardiyo. Hepsi exercises.json'da (eksik id yok), gün başı 17 set.
- Haftalık kesirli set (primary 1, secondary 0.5): omuz 12, arka bacak 10.5, göğüs 9, lat 9, ön bacak 8, baldır 8, triseps 8, kalça 7.5, biseps 7.5, **orta sırt 4.5 (zayıf)**. Süre tahmini 2 dk dinlenmeyle ~58 dk → 90/60 sn ile ~48 dk (hesap, doğrulanmadı). RDL kütüphanede barbell/intermediate → ilk hafta dambıl/boş bar.
- Eski plan yedeği: `.claude/plan-backup-2026-09-29.json` (untracked; hook .claude taşımayı engelledi).
- **Deploy:** `docker compose up -d --build api` → health 200, `bundle.json` version `05107bd…` → `e5d4b8fa85b1a612`; HEAD a0facea PR #29 + #30 içeriyor. Telefonda "Yenile" DOĞRULANMADI.
- Kuru meyve kararı: günde 1 porsiyon (1 incir / 4 kayısı / 1 yk üzüm), taze meyve yerine, yoğurt/cevizle; kuruyemiş bir avuç çiğ tuzsuz, ceviz öncelik.

## 30 Eyl sabah — 12 haftalık protokol + tabak/preset düzeltmeleri
- **`docs/PROTOKOL-12-HAFTA.md`** (alt ajan web kanıtı; Dean'e dosya gönderildi): 1900–1950 kcal, protein 150–165 g, yağ 55–65, karb ~200, lif 30–40; Pzt/Çar/Cum salon + Sal/Per zone 2 40–45 dk + Cmt 60 dk yürüyüş; 10k adım; uyku 7–8; hafta 4/8/12 kontrol + ayar kuralları; 12 haftada −8–10 kg, %34.8→~%29–30. Hekim: reçeteli omega-3 4 g, 25-OH D testi, 12. hafta tahlil.
  **Çelişki:** dün Dean'e protein 130–150 dedim, protokol 150–165 (Helms LBM×2.0–2.4). Menü dosyası ve tabak hedefleri 130–150'de → Dean'e söylenmeli, `MENU`/`secici.html` KINDS güncellenmeli (yapılmadı).
- `tools/secici/preset.html` yeni plana çekildi (Çar B: hip thrust, RDL/back extension, row, eğimli pres, triceps, Pallof; Cum A′; Pzt A), düz set notu. `secici.html` tabak satırları kırpılmıyor, porsiyon+kcal alt satır. Canlıda (fit.evaitec.com/plan/) doğrulandı (curl), telefonda DOĞRULANMADI.
- Dean bugün salonda (B). Sözlü kararlar: bugün RDL yerine back extension (yoksa hip abduction); salon sonrası whey suyla (+az çözünebilir kahve); kahve günde 2, filtre/çözünebilir, 15:00'e kadar; salon öncesi süzme+muz atlandı (kahvaltıdan hemen çıktı).
- Kayıt: 30 Eyl daily/öğün henüz API'ye YAZILMADI.

## 30 Eyl — protokol sitede + PLAN-PROTOKOL
- `secici.html` Hafta sekmesine 7 protokol kartı eklendi; KINDS protein 150–165; `MENU` notu hizalandı; canlı (curl) doğrulandı, telefonda DOĞRULANMADI. Commit `dev`.
- **Dean isteği:** protokol takibi sunucuda, uygulama + site + koç aynı hesabı okusun, bildirimler. Tasarım: `docs/PLAN-PROTOKOL.md` (Scope Lock, migration `protocol`, `GET /api/protocol/status` saf fonksiyon TDD, Hafta kartı, reminders id 4, site kartı). Kod YAZILMADI.

## Not — saat uygulaması (Dean, 30 Eyl)
"Saat uygulamasında güzel yapalım" → ayrı ajan, `ux-pi` personası, dal `feature/wear-ux`. Giriş `docs/PLAN-WEAR.md` §S-next. Protokol işinden bağımsız, paralel açılabilir.

## BUG — 29 Eyl 22:52 üç bildirim aynı anda, içerik yanlış (Dean ekran görüntüsü)
- "Akşam yemeği / Akşam retrosu / Sabah tartısı" 22:52'de birlikte düştü; akşam öğünü ve kilo o gün API'de VARDI (ben yazdım). Dean: "yalandan bildirim atıyorsun, olmaz".
- Tahmin (doğrulanmadı): `refreshNotifications` App mount'ta IndexedDB'yi sunucu senkronu bitmeden okuyor → `done` yanlış. Aynı anda düşme: yeni paket "Yenile" sonrası mı, eski repeats alarmının stale catch-up'ı mı (LocalNotificationManager.kt: geçmiş `at` anında ateşlenir) — telefon logu gerek (`adb logcat -s LN` ya da Capacitor Logger).
- **Kural (Dean):** sunucu tek gerçek; uygulama açılışta önce pull, bildirim ancak senkron sonrası ve senkronlu veriye göre kurulur. Sohbetten API'ye yazılan kayıt telefona ulaşmadan bildirim atılmaz.
- Düzeltme adayı: `refreshNotifications` mount'tan kaldır → sync tamamlanınca (`store` pull sonrası) çağır; `scheduleNotifications` içinde `at` geçmişe düşemez garantisi için `nextFireAt` sonucu `<= now` ise +1 gün (savunma) + test. Öncelik: protokol işinden ÖNCE (güven kaybı).

## Next — tek adım
**Takvim (Dean, 30 Eyl):** protokol takibi Pazartesi 5 Eki'ye tasarlanır, sıkıştırılmaz; erken biterse Cuma 2 Eki aktif. Dean 30 Eyl seans + ölçümleri yarın (1 Eki) iletecek → API'ye yaz.
Kod: `feature/protokol` dalında `apps/api/src/protocol.ts` TDD (PLAN-PROTOKOL §Hesap) → endpoint → site kartı (`secici.html` Hafta) → web Hafta kartı + reminders id 4 (Dean son karar 30 Eyl gece: site kartı VAR, ilk teslim, token'sız salt-okunur özet endpoint; uygulama kartı kabul edilince site kartı kalkar. Açık: başlangıç 107.5/117/34.8 teyidi). Deploy: `docker compose up -d --build api` + bundle version kontrol. Kabul: telefonda Hafta sekmesinde kart.

## 30 Eyl sabah — bildirim fix canlıda, B seansı + ölçümler API'de, Docker iki kez düştü
- **Bildirim BUG kapatıldı:** PR #31 (`da025eb`) — `pullRange` sonunda `refreshReminders()`, mount'ta yalnız sunucusuz kurulumda. Saatler 10:00/22:00 (`reminders_v2` anahtarı, eski 09:00/21:00 kaydını ezer). 419 test, canlı paket `b2e5b0c8`. Telefonda DOĞRULANMADI. Açık: eklentinin geçmiş `at` → anında ateşleme davranışı (stale catch-up) için APK gerekebilir, Dean'e soruldu, cevap yok.
- **Adım 6.000 taban** (hedef değil) — PROGRAM §"Adım standardı", PROTOKOL, secici.html; canlıda.
- **30 Eyl API'de (GET kanıtlı):** daily 107.4 kg, kolluk 127/77 nabız 56; OKOK 11 metrik + Samsung 29–30 Eyl adım/tansiyon (28 Eyl adım 7068'e düzeltildi); kahvaltı 34 g/520; B seansı 59 dk 7 hareket (hip thrust 30 plaka toplamı, row 25, eğimli göğüs 30, kablo triceps 25, pallof 15, dead bug, plank; pallof/dead bug/plank tekrar boş) + bisiklet 12 dk; saat 1:11:11, 583 kcal, ort 111/maks 155. Yüzme bekleniyor.
- **Docker Desktop 2× sessiz öldü** (~09:55 ve ~10:12; backend logunda kapanma yok). Çözüm: tam yeniden başlatma (`Stop-Process` + `wsl --shutdown` + başlat). AutoStart=true yapıldı; watchdog betiği `~/.ai/scripts/home-net/docker_watchdog.ps1` (zamanlanmış görev kurulmadı — izin, Dean kuracak). Şüphe: paralel Claude oturumu (ZimaOS taşıma?) — doğrulanmadı.
- Hafıza: `salon-b-kayit-kurali`, `docker-watchdog`.

## 30 Eyl öğleden sonra — Docker watchdog kuruldu, ZimaOS taşıma hazırlığı, Samsung 30 Eyl
- **Watchdog** zamanlanmış görev `wellness-docker-watchdog` (5 dk) KURULDU (Dean "Kur"); ilk koşu Last Result 0, health 200. HANDOFF `fb8385e`.
- **Karar (Dean):** Docker Desktop bağımlılığı → kök çözüm ZimaOS'a taşıma. OS değişmiyor (Debian+Dockge ileride aday).
  Kapsam yalnız wellness (db+api+tünel); LiteLLM zaten ZimaOS'ta (yz-litellm), plan envanteri bu açıdan bayat.
  Dean: "zima açılacak, o ara düzenle, geçişi ben haber veririm" → hazırlık serbest, **cutover Dean'in "geç"iyle**.
- Dal `chore/zimaos-tasima` `c822673` (push EDİLMEDİ): compose `POSTGRES_PASSWORD`/`DB_BIND` .env'den (varsayılan eski PC değeri; ZimaOS'ta hex parola + `DB_BIND=127.0.0.1:5434`). `docker compose config -q` ok.
- **ZimaOS KAPALI:** WOL (`zima_wol.py`) 240 sn cevapsız; SSH yoklaması 30+90 dk. Dean elle açmalı. ZimaOS kapalıyken Eva'nın sunucu LLM'i (yz-litellm) de yok.
- Repo public → ZimaOS'ta `git clone` kimliksiz olur; ZimaOS'ta git/compose var mı DOĞRULANMADI. ota/ 4.9 GB scp gerekecek.
- **Samsung 30 Eyl zip:** kilo CSV yoktu → `import_samsung.mjs` kilo tablosu opsiyonel + `--no-workouts` (dev `b8b1e08`, 419 test). Adım 6361 PUT 200 + GET; seanslar yazılmadı (3 seans, çift yok).
- Dean soruları cevaplandı: Mayi Tuz (Delice kaynak tuzu, beyan %31,2 Na vs %39,3 → ~%20 az; mineraller eser; iyotlu mu bak).

## Next — tek adım
ZimaOS açılınca (ssh zima): git/compose/port 3011-5434 yokla → repo `/DATA/AppData/life-os-wellness` clone + dalı merge edip çek → `.env` (yeni parola, DB_BIND, API_TOKEN, LLM key, CF creds) scp chmod 600 → ota/ scp → `docker compose up -d --build db api` (tünelsiz) → `curl 192.168.1.186:3011/health`. Sonra Dean'e "hazır" de; cutover (PC tünel stop → pg_dump/restore → satır sayısı → ZimaOS tünel) yalnız "geç" ile. Akşam öğünü bekleniyor (gün 96 g P).

## 30 Eyl akşam — öğün düzeltmeleri
- Sabah oturumu whey'i "yendi" dedi ama POST etmemişti; akşam shake Dean sormadan (içilmeden) yazıldı → silindi. Kural hafızada: `yendi-dendi-an-yaz`.
- Son hal (GET): 08:45 kahvaltı 34/520 · 10:45 whey 24/120 · 11:50 öğle 62/720 · 17:00 akşam 35/710 · 19:00 meyve 3/250 → **158 g / 2320 kcal**.
- Samsung 17:35 zip: adım 6361. Next değişmedi: ZimaOS açılınca hazırlık (HANDOFF.md Next 1).

## 1 Eki — gün kaydı, publish_ota ZimaOS, ZimaOS kesintisi (en yeni)
- **Kayıtlı (API GET kanıtlı):** daily 1 Eki 107.05 kg, 114/77 (nabız alanı yok; Dean "nabız o verdiğim" dedi — 114/77 tansiyon kabul).
  OKOK 10 metrik (`/api/wearable` source=okok): yağ %34.5 / 37.0 kg, iskelet kası 35.0, visseral 25.5, bmr 2013.6.
  Öğünler (id `1001a0e2-1001-4a11-9c00-00000000000{1,2,3}`): 08:30 kahvaltı 37/480 · 12:30 öğle tavuk+bulgur+yoğurt 72/720 ·
  13:45 kapalı kır pidesi + ayran 32/560 (Dean düzeltti: kır pidesi, küçük) · 16:31 kumpirden azıcık 6/300 (id ...004, tahmin). Gün şu an 147 g / 2060 kcal.
- **Akşam:** Dean kumpirden azıcık yedi (yazıldı). Akşama "belki" çorba + ton balıklı salata — planlanan, YAZILMADI; yediğini söyleyince POST (ton ~150 g ≈35 g P, bu hafta ilk ton).
- **Trend:** 7-gün ort 22 Eyl 107.63 → 1 Eki 107.56 (≈0.1 kg / 10 gün, hedef 0.6/hafta) → plato sınırı. Adaylar: 27 Eyl serbest gün 3417 kcal, 29–30 Eyl adım 3330/6361, kreatin su. Dean'e bel ölçümü istendi (son 117, 21 Eyl).
- **Kod:** `f5b28cc` (dev, push) `ops/publish_ota.mjs` APK'ları `scp` ile `zima:/DATA/AppData/life-os-wellness/ota/` (env `OTA_REMOTE`). scp + sha256 doğrulandı; betiğin tamamı yeni sürümle koşulmadı.
  ZimaOS ota/: yalnız 0.39.0 APK'lar + Gemma (hepsi 206); eski APK'lar PC arşivinde, bilerek kopyalanmadı.
- **Test kırmızı (biliniyor):** `@wellness/api` testi `127.0.0.1:5433` Postgres istiyor; PC db durdu → ECONNREFUSED. Web 419/419 yeşil. Çözüm adayı: test için geçici Postgres. ZimaOS prod DB'ye test BAĞLAMA (veri silebilir).
- **ZimaOS kesintisi ~13:50:** fit.evaitec.com 530, ssh/ports zaman aşımı, WOL 240 sn cevapsız; ~14:38 kendiliğinden geri geldi (health 200). Kök neden araştırılmadı.
- **CRM tüneli (Dean: "atla", ertelendi):** `crm.evaitec.com` wellness tünelinin config'inde (ZimaOS canlı; PC'de `ops/cloudflared/config.yml` uncommitted diff — commit ETME). Hedef: CRM kendi tüneli → `D:/projects/evaitec/crm/docker-compose.zima.yml`. Engel: PC `~/.cloudflared/cert.pem` 30 Eyl'de süresi dolmuş → Dean `cloudflared tunnel login`. ZimaOS'ta ayrıca CasaOS `cloudflared` (token/dashboard yönetimli) var.
- **Bekleyen:** Dean'in "bayat/yanlış verileri süz" isteği kapsamı teyit edilmedi (öneri: bu dosyadaki 25 Eyl PC/LAN bölümleri).

### Next — tek adım
Dean akşam yemeğini söyleyince POST + GET, gün toplamını kayıt listesiyle ver. Sonra `feature/protokol` (başlangıç 107.5 / bel 117 / %34.8 teyidi bekliyor).

## 2 Eki sabah — ZimaOS kapalı, API'ye YAZILMADI (bekleyen)
- WOL sonrası ping geldi, ssh/health 530 (açılış sürüyor ya da servisler kalkmadı).
- Bekleyen POST: OKOK 2 Eki kilo ~107.9 (üst satır kırpık), yağ %34.8 / 37.5 kg, iskelet 35.2 kg %32.6, kas 67.3, su %48.9, visseral 26.0, kemik 3.14, bmr 2025.5, protein %13.4, yağsız 70.42.
- Bekleyen öğün: kahvaltı sucuklu menemen (yumurta + beyaz peynir/lor + sucuk, yağlı) + kase sucuk + domates/salatalık/maydanoz. Dean payı SORULDU.
- 1 Eki akşam (çorba + ton salata) hâlâ teyitsiz.
- 2 Eki A′ seansı (Dean, salonda, 2 set kuralı): lat pulldown MAKİNE 35 kg, "press" 35 kg (hangi press belirsiz — leg press mi butterfly mi, tekrar sayısı yok). OKOK 2 Eki kilo 107.9 (70.42+37.5). Saat BIA kaydedilmeyecek.
- 2 Eki A′ devam: leg extension 35 kg; buraya kadar tüm setler 12 tekrar (2 set/hareket). "press 35" hâlâ belirsiz (leg press?).
- 2 Eki: salon sonrası havuz 10 dk (cardio swim, sets: []) — ZimaOS açılınca POST. Mesafe/nabız Dean iletirse ekle.
- 2 Eki A′: biseps makine yerine EZ-Bar_Curl 15 (ısınma) → 25 kg çalışma (Dean), tekrar bekleniyor.
- 2 Eki A′ BİTTİ, tüm setler 2×12: leg press 35? ("press 35" belirsiz), leg extension 35, lat pulldown makine 35, butterfly 40 (varsayım), EZ curl 25, calf ?, Arnold 10 (varsayım). Saat süre/kcal yok. Sonra havuz 10 dk. ZimaOS açılınca POST.

## 2 Eki ~10:30 — ZimaOS geri geldi (tünel 07:06Z), bekleyenler API'de (PUT/POST 200/201 + GET)
- daily 2 Eki 107.9 · daily 1 Eki steps 7946 · okok 2 Eki 10 metrik · workout A′ `1002a0e2-...9d00-...0001` (14 set, needs_review: press 35=leg press VARSAYIM, butterfly 40/Arnold 10 plan değeri, calf kg yok) · havuz 10 dk `...0002` · kahvaltı `...9c00-...0001` 55/1000 TÜM TABAK VARSAYIM.
- 1 Eki akşam 20:46 27/450 zaten API'de (Dean girmiş). Gün 1 Eki: 174 g / 2510 kcal.
- **Health Connect senkron ÇALIŞMIYOR:** `/api/wearable` `source` filtresini yok sayıyor; gruplayınca `health_connect` kaynaklı kayıt 25 Eyl'den beri YOK. Kaynaklar: okok/samsung_csv/samsung/watch_app/cuff. Dean'e telefonda Samsung Health→Health Connect paylaşımı + uygulama Ayarlar→Saat senkron soruldu.
- **ZimaOS WiFi (düzeltildi):** Dell BIOS LAN/WLAN Switching — kablo takılınca WiFi radyosu donanımdan kapanır, çıkınca açılır. Kanıt dmesg: eth0 Link Up 1585 s → RF_KILL 1590 s; tünel 10:06'da (kablo 10:26'dan önce) WiFi ile kayıtlıydı. Fallback zaten var, BIOS değişikliği GEREKMEZ. Sabahki kesinti ağ değil, makine kapalıydı. Not: eth0 100 Mbps (gigabit değil) → kablo/port kontrol.

## 2 Eki akşam — sistem denetimi + gün kapandı (en yeni)
- Gün 2 Eki (GET): kahvaltı 45/600 · whey 24/120 (`...9c00-...0004`, akşam POST'unda id çakışıp ezilince yeniden yazıldı) · öğle 58/610 · akşam airfryer palamut 350 g çiğ bütün balık + salata 50/400 (`...0003`) → 177 g / 1730 kcal.
- Denetim: typecheck 0, test 419+71+6 yeşil (api yerel PG18 `--locale=C` ile), build 0, canlı GET'ler 200, 5xx 0.
- Prod açıkları (onay bekliyor): yedek yok · konteynerler restart=no · 009 migration kaydı yok · /health DB'siz. Kod: wearable source filtresi, Settings.tsx:451 toISOString, fastify audit, lint yok.
- Ayrıntı ve Next: HANDOFF.md.
