# PLAN — Sunucuları PC'den ZimaOS'a taşıma

> 2026-09-25 · Durum: **keşif bitti, cutover Dean onayı bekliyor** · Keşif yalnız okuma komutlarıyla yapıldı
> (PC: `docker ps/inspect/volume/system df`, `du`; ZimaOS: `ssh zima` okuma). Hiçbir şey durdurulmadı/kurulmadı.

## Envanter (PC)

| Proje | Konteyner | Port | Veri | Taşınır mı |
|---|---|---|---|---|
| life-os-wellness | db (postgres:16-alpine) | 5433 | volume `life-os-wellness_wellness_pgdata`, DB 9 MB / 12 tablo | evet |
| | api (yerel build 314 MB) | 3011 | bind `ota/` (~500 MB APK), `exercises.json`, `tools/secici` | evet |
| | litellm (main-stable 1.65 GB) | 4000 | bind `config/litellm.yaml` | evet |
| | wellness-tunnel (cloudflared) | – | `ops/cloudflared/config.yml` + credentials json (tünel `59988d1b-…`) | evet (en son) |
| life-os-finance | radar | 8770 | `finance-radar/data` 32 MB | karar 1 |
| | api / web | 8000 / 80 | 5 KB | karar 2 (tünelde yok) |
| netmovies | tunnel, stream, engine, warp, doh | 3310 | 2.8 GB | karar 3 (ZimaOS'ta zaten koşuyor, tünel PC'de) |
| claude-otel | grafana/prometheus/loki/otel | 127.0.0.1 | ~78 MB | hayır (geliştirme aracı) |

## ZimaOS (192.168.1.186, `ssh zima`, anahtar `~/.ssh/deanos`)

- ZimaOS 1.6.0, x86_64, Docker 27.5.1 amd64 → PC imajları doğrudan uyumlu. `sudo -n` çalışıyor.
- `/DATA` 457 G (289 G boş), RAM 30 GB, 12 çekirdek. ghcr.io erişilebilir.
- **`docker compose` yok.** `/DATA/.docker/config.json` izin hatası; `DOCKER_CONFIG` boş.
- Dolu portlar: 5433 (modularcrm_postgres), 8000 (2fauth), 80 (doğrulanmadı, muhtemelen CasaOS), 3310 (netmovies-stream). Boş: 3011, 4000, 8770.
- `ssh dean@192.168.1.186` BatchMode'da reddediliyor (id_rsa deniyor) → `zima` takma adı kullanılır.

## Riskler

1. **İki konnektör aynı tünelle aynı anda açık = veri iki DB'ye bölünür.** PC tüneli durmadan ZimaOS tüneli açılmaz.
2. Outbox (`store.ts` `verdictFor`) ağ hatası/5xx/401/403/408/429'da yeniden dener → kesintide 530/502 kayıpsız.
   **Ama ingress eşleşmezse catch-all 404 döner ve yazmalar kuyruktan düşer** → ingress, cutover öncesi doğrulanır.
3. `host.docker.internal` Linux'ta yok → cloudflared'e `extra_hosts: ["host.docker.internal:host-gateway"]`.
4. OTA: `ops/publish_ota.mjs` PC'deki `./ota`'ya kopyalıyor → taşımadan sonra ZimaOS'a rsync etmeli.
5. `docker-compose.yml`'de `POSTGRES_PASSWORD: wellness` düz yazılı → `.env`'e alınmalı.

## Adımlar (doğrulanmadı)

**Hazırlık (kesintisiz):** compose'u `/DATA` altına kur → repoyu `/DATA/AppData/life-os-wellness/` → `.env` + credentials scp (chmod 600, heredoc yok)
→ ZimaOS override (db portu yayınlanmaz, `extra_hosts`) → imajlar (build ya da `docker save | ssh zima docker load`)
→ tünelsiz `db litellm api` up → `curl http://192.168.1.186:3011/health`.

**Cutover (~5–10 dk):** PC `docker stop wellness-tunnel` → PC `pg_dump -Fc` → scp → ZimaOS `pg_restore --clean --if-exists`
→ tablo satır sayıları karşılaştır → ZimaOS tünel up → `https://fit.evaitec.com/health` 200 + `/ota/` + `/plan/`
→ **kabul: Dean telefonda outbox boşaldı, kayıtlar görünüyor** → PC api `docker update --restart=no` + stop (silinmez).

**Geri dönüş:** ZimaOS tünelini durdur → (ZimaOS'a yazılan varsa ters dump/restore) → PC tünel + api start → sağlık.
PC volume en az 1 hafta silinmez.

## Kararlar (Dean)

1. finance-radar taşınsın mı? (taşınmazsa ingress PC LAN IP'sine) — diğer oturumun `chore/finans-tunel-ingress` dalıyla koordine.
2. finance api/web taşınsın mı? (80/8000 ZimaOS'ta dolu)
3. netmovies PC kopyası + PC tüneli ZimaOS'a mı, kapsam dışı mı?
4. api imajı ZimaOS'ta mı build edilsin, PC'den save/load mı?
5. Compose kurulumu: plugin binary (`/DATA/.docker/cli-plugins`) mı, wrapper konteyner mi?
6. `publish_ota.mjs` ZimaOS'a rsync yapacak şekilde değişsin mi?
7. Postgres parolası `.env`'e alınsın mı?
8. Cutover zamanı.
