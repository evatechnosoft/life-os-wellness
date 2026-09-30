# Handoff: bildirim fix canlıda, protokol Pzt 5 Eki, Docker watchdog kurulacak

> 2026-09-30 öğle · `dev` @ `03be176` · 0 kirli dosya · test 419/419 · fit.evaitec.com health 200, canlı paket `b2e5b0c8`

## Goal
Dean'in günlük seans/öğün/ölçümü sohbetten API'ye (kabul = telefonda görünür); sırada `feature/protokol`
(`docs/PLAN-PROTOKOL.md`, hedef Pzt 5 Eki) ve saat UX'i ayrı ajan (`docs/PLAN-WEAR.md` §S-next).
Günün ayrıntısı: `.claude/handoffs/latest.md` § "30 Eyl sabah".

## State
- Bildirim BUG kapandı: PR #31 `da025eb` (bildirim `pullRange` sonrası kurulur) + saatler 10:00/22:00
  (`reminders_v2` anahtarı). Canlıda; **telefonda DOĞRULANMADI**. Açık: eklentinin geçmiş `at`'i anında
  ateşlemesi (stale catch-up) — APK gerekebilir, Dean cevap vermedi.
- 30 Eyl API'de (GET kanıtlı): daily 107.4 / 127-77 / nabız 56; OKOK 11 metrik; kahvaltı 34 g/520;
  B seansı 59 dk 7 hareket (hip thrust 30 = plaka toplamı) + bisiklet 12 dk + havuz 10 dk 150 m;
  öğle 62 g/720 (T-bone + karnabahar); uyku wearable `sleep_*` 377 dk (derin 30). Akşam öğünü YOK (gün 96 g P).
- Adım tabanı 6.000 (hedef değil): PROGRAM/PROTOKOL/secici.html, canlıda.
- Docker Desktop bugün 3× sessiz öldü (09:55, 10:12, 11:45; neden bilinmiyor; 3311'deki `netmovies/atv_power.py`
  ilgisiz — api host portu yok). Yalnız Start-Process yetmedi (motor 500), kill + `wsl --shutdown` + start çalıştı.
  Watchdog betiği bu yolu izliyor (`~/.ai/scripts/home-net/docker_watchdog.ps1`); AutoStart=true; zamanlanmış görev
  **kuruldu** (30 Eyl 13:04, 5 dk, ilk koşu Last Result 0). PC kapanıyor: sunucu kapalıyken telefon outbox'ta biriktirir.
- Samsung zip 29–30 Eyl aktarıldı; 28 Eyl adım 7068.

## Next
1. Dean öğle/akşam öğününü yazınca `POST /api/meals` (dean-pt skill; hedef 150–165 g, kahvaltı 34 g).
   Pallof/dead bug/plank tekrarları boş — Dean söylerse `POST /api/workouts` id `30b0e2c1-0930-4a11-9d00-000000000001` ile upsert.
2. Dean'e sor: 0.39.0'da bildirimler 10:00/22:00 göründü mü; 22:52 gibi topluca düşme tekrarladı mı → tekrarlarsa
   `apps/web/src/lib/reminders.ts` `notificationsFor`: `at` yerine `on:{hour,minute}` + APK.
3. `feature/protokol`: `apps/api/src/protocol.ts` TDD (PLAN-PROTOKOL §Hesap) → endpoint → site kartı → Hafta kartı.

## Don't repeat
- Samsung importu seansları körlemesine POST etmez (`--from`); daily'de yalnız boş alanı doldurur → adımı elle `PUT`.
- Hip thrust makinesinin kol ağırlığı bilinmiyor → kg = plaka toplamı, nota "kol hariç".
- Docker 530'da süreç anlatma; watchdog betiğini çalıştır, kaydı yaz, GET göster (memory `docker-watchdog`).

## Read first
1. `.claude/handoffs/latest.md` — son bölüm (30 Eyl sabah)
2. `docs/MENU-30EYL-2EKI.md` — bugün Çar, yarın Per menüsü
3. `docs/PLAN-PROTOKOL.md` — sıradaki kod işi

## Verify
git rev-parse --short HEAD                       # 03be176 (değilse git log 03be176..HEAD)
git status --porcelain | grep -v worktrees        # boş
npm test 2>&1 | grep Tests                        # 419 passed
curl -s -o /dev/null -w "%{http_code}" https://fit.evaitec.com/health   # 200 (530 → docker_watchdog.ps1)

## <yeniden başlangıç> promptu (yapıştır)
```
Durum: life-os-wellness dev @ 03be176 temiz. Bildirim fix (#31, 10:00/22:00) canlıda ama telefonda doğrulanmadı.
30 Eyl kahvaltı+B seansı+havuz API'de; öğle/akşam öğünü yok. Docker Desktop sabah 2× düştü; watchdog betiği hazır,
zamanlanmış görevi Dean kuracak. Sıradaki kod işi feature/protokol (Pzt 5 Eki).
Ortam: D:\projects\evaitec\lifeOS\life-os-wellness, docker compose --profile tunnel, fit.evaitec.com.
Önce HANDOFF.md oku, Verify çalıştır. Öncelik: Next 1 (öğün kaydı, dean-pt), 2, sonra 3. Yeni iş açma.
```
