# Handoff: 28 Eyl koçluk günü (salon A + yüzme, 3 öğün, haftalık değerlendirme, TA serisi temizlendi) · eski açıklar aşağıda

> 2026-09-28 ~13:00 son güncelleme · koçluk yalnız API üzerinden (kod/commit yok bugün) · eski bölümler 25–27 Eyl

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

## Next — tek adım
Dean onay bekliyor: plana Pzt `Leg_Extensions` → `Leg_Press` (ana; extension sona opsiyonel) + Salı/Perşembe 25–30 dk zone 2 kardiyo (`/api/workout-plan` PUT, sonra GET). Ayrıca deploy doğrulaması (bundle version) ve 29 Eyl kilo 107.5 / TA 114/79 / kahvaltı API'de mi kontrol.
