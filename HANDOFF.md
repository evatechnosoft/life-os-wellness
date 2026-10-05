# Handoff: saat Seans/Özet/Teknik kodlandı — sıradaki toplu teslim (0.41.0)

> 2026-10-05 akşam (gün kaydı kapandı) · `dev` @ bu devir commit'i · kod dalı `feature/wear-seans` @ `d1ee0b6` (push edildi, PR AÇILMADI) · dirty: `ops/cloudflared/config.yml` (CRM tüneli, COMMIT ETME) + untracked `.claude/plan-backup-2026-09-29.json`, `.claude/worktrees/`
> Geçmiş: `.claude/handoffs/latest.md` (en yeni bölüm en altta)

## Goal
Uygulamayı gerçek kullanıma çekmek. Giriş kanalı **sohbet**, uygulama + saat izleme/ayna. Plan: `docs/PLAN-GERCEKCI.md` §7.6, saat: `docs/PLAN-WEAR.md` son bölüm. Persona: `wellness-pi`. Çalışma biçimi: oturum boyunca biriktir, sonda tek test + tek deploy.

## State (kanıtlı)
- `feature/wear-seans` (3 commit, deploy YOK, cihazda DOĞRULANMADI):
  - Saat: `Session.kt`, `Summary.kt`, `MainActivity.kt` ViewFlipper 3 sayfa (yatay fling). Seans: hareket · set n/2 · hedef kg×12 · nabız, "Set bitti" → titreşim + `/wellness/sets/<ts>` + 90 sn dinlenme. Özet: protein, 7-gün kcal (1900 üstü kırmızı), 7-gün kilo farkı, adım (`/wellness/summary`). Teknik: eski 6 satır + gönder/güncelle. Yedek plan sabit (`// ponytail:`), 5 Eki Pzt/Çar takası işli.
  - Telefon: `WearBridgeService` set kuyruğu (`kind:"set"`), `WearBridgePlugin.pushSummary`.
  - Web: `watchSummary.ts` (pullRange sonunda saate özet), `watch.ts` saat setleri günün saat seansına TAM liste upsert (id `yyyymmdd-5a61-4a11-9d00-000000000000`).
  - Ayar: token doluysa alan gizli → "Bağlı · Değiştir" (`Settings.tsx`).
  - `ops/import_samsung.mjs` `dailyPatch`: adım mevcut değerden büyükse yazılır.
  - Kanıt: tsc 0 · web vitest 444/444 · wear unit 30/30 · app unit 49/49 · `:wear:lintDebug` 0 hata · `:wear:assembleDebug :app:assembleDebug` exit 0 · import test 7/7. Wear emülatör görüntüsü ALINMADI.
- **Plan (PUT 200 + GET):** Pzt A = Leg_Press, Seated_Leg_Curl, Leverage_Incline_Chest_Press, Close-Grip_Front_Lat_Pulldown, Side_Lateral_Raise, Leverage_Shoulder_Press, Machine_Triceps_Extension, Dead_Bug · Çar B = Barbell_Hip_Thrust, Romanian_Deadlift, Leverage_Iso_Row, Smith_Machine_Bench_Press, Pallof_Press · Cum A′ değişmedi. Hepsi 2 set.
- **5 Eki API (GET kanıtlı):** öğünler id `1005a0e2-1005-4a11-9c00-00000000000{1..5}`: kahvaltı 09:30 23/380 · whey 10:16 24/120 · öğle 12:25 55/760 (sulu köfte ~18 + patates + yoğurt ~150 g + yağsız salata, fotoğraf) · akşam 18:06 35/350 (zeytinyağlı taze fasulye ~250 g + ton 1 kutu, porsiyon varsayım) · tavuklu çorba 19:00 12/180 (Dean saati). **Gün 149 g / 1790 kcal.** Salon `1005a0e2-1005-4a11-9d00-000000000001` 36 dk 22 set; yüzme `...0002` 12 dk 175 m.
- Protein hedefi 150 her yerde: bayat 180 dokümanlardan silindi (`e3d9c9c`; yalnız tarihli `GUNLUK-2026-09-21.md` bırakıldı). `dean-pt` skill hedefi artık `GET /api/goals`'tan okur.
- Samsung 5 Eki 10:06 zip: adım 2 Eki 7543, 4 Eki 8117, 5 Eki 2881 (PUT + GET). Saat TA ve seansları yazılmadı (bilerek).

## Next (sırayla)
1. **Toplu teslim:** `feature/wear-seans` PR → squash-merge dev → `variables.gradle` wellnessVersion 0.41.0 + tag v0.41.0 → CI APK yeşil → `node ops/publish_ota.mjs 0.41.0` → ZimaOS deploy (aşağıdaki sıra) → bundle version değişti mi. Native değişti: min_native artar, 0.40 eski paketi tutar.
2. Dean'e kontrol listesi: telefona 0.41 kur (üstüne) → Ayar'da token "Bağlı" → saat OTA güncelle → saatte Özet görünüyor mu, Seans'ta bir "Set bitti" → telefonu aç → GET `/api/workouts` bugün saat seansı.
3. Kataloğa `Bird_Dog` (kuş) ekle — Dean bugün yaptı, yok.
4. İzleme sayfası adayı (§7.6 madde 3) — Dean "yap" demedi.
Gün içi: Dean öğün söyledikçe önce GET, sonra POST. Hedef 150 g (`/api/goals`). 5 Eki gün kaydı kapandı.

## Don't repeat
- Öğünü/seansı Dean "yedim/yaptım" demeden yazma; önce günü GET.
- `POST /api/workouts` `sets` verilirse TAM liste (eksik silinir); süre/not düzeltmesinde `sets`'i hiç gönderme.
- Samsung zip: PowerShell `Expand-Archive`; importer daily'ye saat TA'sı yazar → tansiyon ölçülmüyor, adımı elle PUT et ya da `--dry-run` sonrası bp alanlarını ayıkla. `--no-workouts`.
- Hareket adında tahmin etme: "dar tutuş" Dean için lat pulldown (row değil); belirsizse sor.
- `git commit -a` ile yol verme (git reddeder); config.yml'i asla stage etme.
- ZimaOS deploy: önce `docker exec life-os-wellness-db-1 pg_dump -U wellness wellness | gzip > backups/…-predeploy.sql.gz`, sonra `git pull --ff-only` + `DOCKER_CONFIG=$(mktemp -d /tmp/dc.XXXX) /usr/lib/docker/cli-plugins/docker-compose up -d --build api`.
- Gradle yerelde: `JAVA_HOME="/c/Program Files/Android/openjdk/jdk-21.0.8"`, `--offline` çalışmıyor (önbellek eksik).

## Verify
```
git log --oneline -1 origin/feature/wear-seans   # d1ee0b6
curl -s -o /dev/null -w "%{http_code}" https://fit.evaitec.com/health      # 200
cd apps/web && npx vitest run                  # (dalda) 444 pass
cd apps/web/android && ./gradlew :wear:testDebugUnitTest :app:testDebugUnitTest
```

## <yeniden başlangıç> promptu (yapıştır)
```
life-os-wellness. Saat uygulaması Seans/Özet/Teknik + token gizleme + Samsung adım max feature/wear-seans dalında hazır, testler yeşil, deploy yok.
Önce HANDOFF.md oku. Sıra: (1) toplu teslim — PR/merge, 0.41.0 tag + CI APK + publish_ota + ZimaOS deploy (2) Dean'e telefon/saat kontrol listesi (3) kataloğa Bird_Dog.
Gün içi öğün: önce GET, sonra POST. ops/cloudflared/config.yml commit etme.
```
