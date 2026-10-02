# Handoff: 2 Eki akşam — gün kapandı (177 g), sistem denetimi bitti, prod düzeltmeleri onay bekliyor

> 2026-10-02 akşam · `dev` @ `66e35ea` (+ bu commit) · dirty: `ops/cloudflared/config.yml` (CRM tüneli, commit ETME) + untracked `.claude/plan-backup-2026-09-29.json`
> Ayrıntı ve geçmiş: `.claude/handoffs/latest.md` (en yeni bölüm en altta)

## Goal
1. Dean'in günlük öğün/seans/ölçümü sohbetten API'ye — kabul = telefonda görünür.
2. Denetimde çıkan prod açıklarını kapat (yedek, restart, migration kaydı, /health) — **Dean onayı bekliyor**.
3. Sıradaki özellik `feature/protokol` (`docs/PLAN-PROTOKOL.md`, hedef Pzt 5 Eki).
4. Health Connect senkronunu geri getir (25 Eyl'den beri `health_connect` kaynaklı kayıt yok).

## State (kanıtlı, 2 Eki)
- **Gün 2 Eki kapandı (GET):** 08:15 kahvaltı 45/600 · 11:45 whey 24/120 (`...9c00-...0004`) · 11:56 öğle 58/610 · 16:21 akşam 50/400 (`...9c00-...0003`) → **177 g / 1730 kcal**.
  Akşam: airfryer palamut, bütün balık ~350 g çiğ, 6 ince dilim, genç/az yağlı → yenilebilir ~230 g + yeşil salata. İlk yazımda 350 g yenilebilir sanıp 75/730 yazmıştım, Dean düzeltti.
- daily 2 Eki 107.9 kg (OKOK). Seans A′ `1002a0e2-1002-4a11-9d00-000000000001` `needs_review` (press 35 = leg press VARSAYIM, calf kg yok). Havuz 10 dk `...0002`.
- **Sistem denetimi (2 Eki öğlen):** typecheck exit 0 · test web 419/419, api 71/71 (geçici yerel PG18 ile; PC'de Docker yok), ops 6/6 · web build exit 0 (ana chunk 693 kB uyarısı) · canlı health 200, token'sız 401, tüm GET'ler 200 · canlı paket `b2e5b0c8` = bildirim fix'li sürüm · ZimaOS kodu = `origin/dev` · 24 saatte 5xx 0 · disk %27 · DB 8.4 MB.
- **Açık prod bulguları (ZimaOS):**
  1. Yedek YOK (pg_dump/cron/backups yok; volume `/var/lib/docker` aynı disk). `pg_dump` 78 KB.
  2. api/db/tunnel konteynerleri `restart=no` (30 Eyl 18:10Z yaratılmış; compose `unless-stopped` diyor ama işlenmemiş) → `docker compose up -d` gerekir (~5 sn kesinti).
  3. `schema_migrations`'ta `009_measurement.sql` yok; tablo elle yaratılmış, kolonlar doğru. `migrate.js` idempotent → koşunca yalnız kayıt eklenir.
  4. `/health` (`routes.ts:266`) DB'ye bakmıyor.
- **Kod/hijyen bulguları:** fastify <5.12.5 audit (orta), brace-expansion high ama extraneous (bayat node_modules → `npm ci`) · `/api/wearable` `source` filtresi yok (`routes.ts:510`) · `Settings.tsx:451` dışa aktarma adı `toISOString().slice(0,10)` (UTC kayması, AGENTS.md ihlali) · lint config yok · `.env.example`'da `GEMINI_API_KEY` eksik.

## Next
1. Dean onay verirse: (a) ZimaOS `cd /DATA/AppData/life-os-wellness && docker compose up -d` + `docker inspect` ile restart=unless-stopped kanıtı + `npm run db:migrate` (009 kaydı) + günlük pg_dump cron → `/DATA/AppData/life-os-wellness/backups/` (7 gün tut). (b) `fix/health-db` tek PR: `/health` `select 1`, wearable `source` filtresi, Settings tarih `date.ts`'ten, `npm audit fix`, `.env.example`.
2. Bu gece 00:00 kapanıştan sonra kablo takılıyken WOL testi (`python ~/.ai/scripts/home-net/zima_wol.py`).
3. Dean'den bekleyen: "press 35" teyidi, calf kg; Samsung Health → Health Connect paylaşımı + Fit Ayarlar → Saat senkron.
4. `feature/protokol` TDD. Açık teyit: başlangıç 107.5 / bel 117 / %34.8.

## Don't repeat
- **Öğün POST'unda id'yi GET'teki mevcut id'lerle çakıştırma** — bugün yeni akşamı `...0003` ile yazınca whey'i ezdim (POST id ile upsert). Önce GET, sonra boş sıra.
- Balık/et porsiyonu: Dean çiğ bütün ağırlık söylerse yenilebilir ≈ %65 (kılçık/deri/kafa). Fotoğraftan gram biçme, sor.
- "Yedim/içtim" = aynı turda POST + GET; "yapalım mı/var" = yazma (hafıza `yendi-dendi-an-yaz`).
- `/api/wearable` `source` query filtresini YOK SAYIYOR — istemcide grupla.
- Ton balığı bu hafta 2 kez — hafta sonuna kadar ton yok. Palamut bu haftanın ilk balığı.
- Yerel API testi: PC'de Docker yok; `C:/Program Files/PostgreSQL/18` initdb `--locale=C` şart (Türkçe locale adı non-ASCII → initdb düşer), port 5433, user/pass `wellness`. ZimaOS prod DB'ye test BAĞLAMA.
- ZimaOS kapalıyken bekleme; sunucu isteyen işte WOL'u hemen arka planda yolla.

## Verify
```
git rev-parse --short HEAD
curl -s -o /dev/null -w "%{http_code}" https://fit.evaitec.com/health   # 200 (00:00–10:00 arası 530 normal)
set -a; . ~/.ai/vg.env; set +a; curl -s -H "Authorization: Bearer $WELLNESS_API_TOKEN" "$WELLNESS_API_BASE/api/meals?start=2026-10-02&end=2026-10-02"   # 4 kayıt, 177 g / 1730 kcal
ssh zima "docker inspect life-os-wellness-api-1 --format '{{.HostConfig.RestartPolicy.Name}}'"   # şu an "no" → düzeltme sonrası unless-stopped
```

## <yeniden başlangıç> promptu (yapıştır)
```
life-os-wellness, dev dalı. 2 Eki günü kapandı (177 g P / 1730 kcal, API'de). Öğlen tam sistem denetimi yapıldı: testler yeşil, ama ZimaOS'ta yedek yok, konteynerler restart=no, 009 migration kaydı eksik, /health DB'ye bakmıyor.
Önce HANDOFF.md oku, Verify bloğunu çalıştır.
Öncelik: (1) Dean onayıyla prod düzeltmeleri (Next 1a) + fix/health-db PR (Next 1b) (2) gece WOL testi (3) Dean'den press/calf/Health Connect cevapları (4) feature/protokol.
ops/cloudflared/config.yml commit etme. Öğün POST'unda id çakıştırma.
```
