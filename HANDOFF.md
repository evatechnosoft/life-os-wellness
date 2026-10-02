# Handoff: 2 Eki gece — 8 PR canlıda, telefonda doğrulama ve yarının işleri

> 2026-10-02 23:00 · `dev` @ `5bce4ce` (+ bu commit) · dirty: `ops/cloudflared/config.yml` (CRM tüneli, commit ETME) + untracked `.claude/plan-backup-2026-09-29.json`
> Ayrıntı ve geçmiş: `.claude/handoffs/latest.md` (en yeni bölüm en altta)

## Goal
1. Bugün canlıya çıkanları **telefonda** doğrula (hiçbiri cihazda görülmedi).
2. Kalan prod açıkları: günlük yedek cron, 009 migration kaydı, `/health` DB kontrolü.
3. "Haftayı kur"u uygulamanın Plan sekmesine taşı (Dean önerdi, "yap" demedi — yarın sor).
4. Gün kayıtları (öğün/seans/ölçüm) sohbetten API'ye — her gün.

## State (kanıtlı, 2 Eki)
- **Canlı paket `c0f0c90c`**, health 200, api/db/tunnel `restart=unless-stopped` (docker inspect). PR'lar dev'e squash-merge:
  #34 baldır alternatifleri · #35 Smith bench · #36 protein = öğün toplamı (`withMealProtein`) + Eva timeout · #37 elle sunucu adresi SİLİNDİ, "Yenile" şeridi yok — paket açılışta/dönüşte kendiliğinden · #38 akşam yemeği eşiği 16:00 · #39 `/plan/` seçici tüm vücut 2×12 · #40 bildirimde Cevapla / Geç.
- Headless Chrome (canlı, gerçek token): halka 0/180 → **177/180**; Eva sunucudan cevap veriyor. Telefonda DOĞRULANMADI.
- **Gün 2 Eki (GET):** 4 öğün 177 g / 1730 kcal (akşam airfryer palamut 16:21, 350 g çiğ bütün balık → 50 g/400 kcal); A′ seansı Dean teyitli, needs_review=false (leg press 35, leg ext 35, pulldown 35, butterfly 35, EZ 25, Arnold 10, hepsi 2×12; calf ayakta vücut ağırlığı 12+10); Samsung: adım 7374, TA 131/80.
- **Plan (workout-plan):** A/B/A′ tüm hareketler 2 set; A göğüs = `Smith_Machine_Bench_Press` (salonda tek göğüs makinesi eğik itiyor); A′ calf = `Standing_Dumbbell_Calf_Raise`. Split notları "2×12 RIR 1–2".
- **Yedek:** yalnız elle 3 adet `ZimaOS:/DATA/AppData/life-os-wellness/backups/*-predeploy.sql.gz`. Cron YOK.
- **Testler:** web 423/423, tsc temiz; api 71/71 (yerel PG18 ile, öğlen).

## Next (yarın, sırayla)
1. Dean telefonu açınca: uygulamayı tamamen kapat-aç → halka 177/180 mi, Eva cevap veriyor mu, Ayar'da sunucu adresi yok mu, 22:00 bildiriminde Cevapla/Geç var mı ve Geç kapatıyor mu. Sunucu logundan eşzamanlı izle (`docker logs life-os-wellness-api-1 | grep /api/chat`).
2. Retro 2 Eki: Dean'e 3 soru soruldu (iyi giden: öneri "A′ tam, 177 g, akşam nişastasız"; zorlanılan; yarın denenecek) → `PUT /api/retro/2026-10-02`.
3. Prod açıkları (onaylı sayılır, Dean "bitir" dedi): günlük pg_dump cron (7 gün tut) · `npm run db:migrate` ZimaOS'ta (009 kaydı) · `fix/health-db` (`/health` `select 1`, wearable `source` filtresi, `Settings.tsx` dışa aktarma tarihi `date.ts`, `npm audit fix`, `.env.example` GEMINI_API_KEY).
4. "Haftayı kur" → Plan sekmesi: `tools/secici/plan.js` ortak kullanılsın, önizleme + "yerine koy" + Kaydet = `PUT /api/workout-plan`. Önce Dean "yap" desin.
5. Kalıcı bildirim tekrar ederse: mekanizma bulunamadı. Aday: `SleepService` START_STICKY + otomatik durmama (APK işi).
6. "Saat verisi 9 gündür yok": saat Dean'in diğer telefonuna eşli → o telefona APK + aynı token. Envanterde chest press / plakalı makine iki satır, Dean "tek makine" — teyit.

## Don't repeat
- Sohbetten yazılan öğün `daily_log.protein_g`'yi doldurmaz; uygulama artık öğün toplamını alıyor — elle daily protein PUT etme.
- Öğün POST'unda id'yi mevcutlarla çakıştırma (bugün whey ezildi). Önce GET.
- Balık: Dean çiğ bütün ağırlık söyler, yenilebilir ≈ %65; fotoğraftan gram biçme, sor.
- Katalogda hareket yoksa tek seçenekle geçiştirme — söyle, kataloğa ekle (`data/exercise-tr.json` + `node scripts/build-exercises.mjs`).
- Dean'e "şunu boşalt / şuna bas" diye iş bırakma; gereksizse kaldır.
- ZimaOS compose: düz `docker compose` çalışmaz → `DOCKER_CONFIG=$(mktemp -d /tmp/dc.XXXX) /usr/lib/docker/cli-plugins/docker-compose up -d --build api`. Deploy öncesi `pg_dump` yedeği.
- Windows dosyaları CRLF: node ile string-replace düzenleme sessizce eşleşmiyor → Edit aracı kullan.
- Split `note` max 200 karakter.

## Verify
```
git rev-parse --short HEAD
curl -s -o /dev/null -w "%{http_code}" https://fit.evaitec.com/health      # 200 (00:00–10:00 arası ZimaOS kapalı)
curl -s https://fit.evaitec.com/bundle/bundle.json | grep version             # c0f0c90c885e4ab2 (ya da daha yeni)
set -a; . ~/.ai/vg.env; set +a; curl -s -H "Authorization: Bearer $WELLNESS_API_TOKEN" "$WELLNESS_API_BASE/api/meals?start=2026-10-02&end=2026-10-02"   # 4 kayıt, 177 g
ssh zima "docker inspect life-os-wellness-api-1 life-os-wellness-db-1 wellness-tunnel --format '{{.Name}} {{.HostConfig.RestartPolicy.Name}}'"   # 3× unless-stopped
```

## <yeniden başlangıç> promptu (yapıştır)
```
life-os-wellness, dev dalı. 2 Eki gece 8 PR canlıya çıktı (protein halkası, Eva, elle adres kaldırıldı, paket kendiliğinden, bildirim Cevapla/Geç, Smith/calf, seçici 2 set) — hiçbiri telefonda doğrulanmadı.
Önce HANDOFF.md oku, Verify bloğunu çalıştır.
Sıra: (1) Dean'le telefonda doğrula, logdan izle (2) retro 2 Eki (3) yedek cron + 009 + fix/health-db (4) "Haftayı kur" Plan sekmesine — Dean'e sor.
ops/cloudflared/config.yml commit etme.
```
