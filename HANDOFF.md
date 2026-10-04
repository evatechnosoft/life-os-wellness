# Handoff: gerçekçilik 2. tur sonrası — sonraki oturum toplu teslim

> 2026-10-04 akşam · `dev` @ `affab37` (+ bu devir commit'i) · dirty: `ops/cloudflared/config.yml` (CRM tüneli, COMMIT ETME) + untracked `.claude/plan-backup-2026-09-29.json`, `.claude/worktrees/`
> Geçmiş: `.claude/handoffs/latest.md` (en yeni bölüm en altta)

## Goal
Uygulamayı gerçek kullanıma çekmek. Giriş kanalı **sohbet**, uygulama izleme/ayna. Plan ve kararlar: `docs/PLAN-GERCEKCI.md` §7 (§7.5 kararlar, §7.6 sonraki oturum). Persona: `wellness-pi` skill'i (`~/.claude/skills/wellness-pi`).

## State (kanıtlı)
- Canlı: PR #52 (Hafta'da 7-gün kcal ort. kartı, `goals.kcal_week_max=1900`, retro kartı yok) + PR #53 (akşam yemeği hatırlatması ve Günün notu kartı yok, tek bildirim sabah tartısı). Bundle `2c8723e19e07902e`, health 200. **Telefonda DOĞRULANMADI.**
- Testler (#53 anı): web 440/440, `npm run typecheck --workspaces` temiz, web build temiz.
- Veri: 27 Eyl pasta/börek `515be6b6…` 1220→620 kcal. 4 Eki: 4 öğün 154 g / 2020 kcal (16:07 içilmeden yazılmış shake silindi; 18:30 kahveli whey shake 200 g süzmeyle 44 g / 250).
- Kararlar (Dean 4 Eki): kalori 7-gün ort. ≤1900 · program sabit (A/B/A′, 2×12 RIR 1–2) · 19:00 kuralı ve bulantı izlemi YOK · tansiyon ölçülmüyor · dondurma yerine **toplu teslim** (oturum sonu tek test + tek deploy).
- Bekleyen Dean cevabı: adım/saat için diğer telefona APK + token (G2.2 a) — "olur" denmedi. Telefondaki LLM (madde 5) duruma göre.

## Next (sonraki oturum, sırayla — §7.6)
1. Ayar > Veri ve sunucu > API token: token doluysa alanı gizle, "Bağlı · değiştir" satırı (`apps/web/src/ui/Settings.tsx:573-583`). Alan hiç kaldırılmamıştı; #37 yalnız elle sunucu adresini kaldırdı.
2. Wear OS saat uygulaması — Seans / Özet / Teknik ekranları: tasarım `docs/PLAN-WEAR.md` en alt "S-next tasarımı (4 Eki)". Kod `apps/web/android/wear/src/main/java/com/evaitec/wellness/wear/MainActivity.kt` (bugün 6 TextView). Özet ekranı G2.2'ye bağlı.
3. İzleme sayfası adayı: 7-gün kilo/kcal/protein/seans tek ekran (Pazartesi kartı G1.2).
4. Toplu test (vitest + headless 390 px + Kotlin unit + Wear emülatör görüntüsü) → tek ZimaOS deploy + tek saat OTA → Dean'e tek telefon/saat kontrol listesi.
Gün içi: Dean öğün söyledikçe POST + GET.

## Don't repeat
- Öğünü Dean "yedim/içiyorum" demeden yazma; yazmadan önce günü GET et (16:07 shake çift sayıldı). Toplu verilen listede `created_at` < öğün saati normal.
- `meal.time` çoğu zaman giriş saati — yeme saati çıkarımı yapma (19:00 kuralı bu yüzden yanlış kuruldu).
- Bash'te Türkçe JSON'u `curl -d` ile POST etme → 400; node `fetch` kullan.
- `git reset --hard` dirty ağaçta: `ops/cloudflared/config.yml` (CRM ingress) silindi, ZimaOS kopyasındaki `git diff`'ten geri yüklendi. Dal senkronunda `git pull --ff-only` / rebase kullan.
- Ana checkout'u paralel oturumlar da kullanıyor (finans/koç devir commit'leri); dal değiştirmeden önce `git status`.
- Windows dosyaları CRLF: Python düzenlemede `\r\n` normalize et ya da Edit aracı.
- ZimaOS deploy: önce `docker exec life-os-wellness-db-1 pg_dump -U wellness wellness | gzip > backups/…-predeploy.sql.gz`, sonra `git pull --ff-only` + `DOCKER_CONFIG=$(mktemp -d /tmp/dc.XXXX) /usr/lib/docker/cli-plugins/docker-compose up -d --build api`.

## Read first
1. `docs/PLAN-GERCEKCI.md` §7.5–7.6
2. `docs/PLAN-WEAR.md` son bölüm
3. `apps/web/src/ui/Settings.tsx` (Sunucu kartı)

## Verify
```
git rev-parse --short HEAD                     # affab37 ya da bu devir commit'i
git status --porcelain | wc -l                 # 4 (config.yml + 2 untracked + yoksa 3)
curl -s -o /dev/null -w "%{http_code}" https://fit.evaitec.com/health      # 200 (00:00–10:00 ZimaOS kapalı olabilir)
curl -s https://fit.evaitec.com/bundle/bundle.json | grep version          # 2c8723e19e07902e ya da yenisi
set -a; . ~/.ai/vg.env; set +a; curl -s -H "Authorization: Bearer $WELLNESS_API_TOKEN" "$WELLNESS_API_BASE/api/goals"   # kcal_week_max 1900
npx vitest run --root apps/web                 # 440 pass
```

## <yeniden başlangıç> promptu (yapıştır)
```
life-os-wellness, dev dalı. 4 Eki'de gerçekçilik 2. turu yapıldı: Hafta'da 7-gün kcal kartı (sınır 1900), retro/akşam yemeği hatırlatması/Günün notu kaldırıldı — canlı, telefonda doğrulanmadı. Giriş kanalı sohbet; uygulama izleme. Çalışma biçimi: oturum boyunca biriktir, sonda tek toplu test + tek deploy.
Önce HANDOFF.md oku, Verify bloğunu çalıştır. wellness-pi skill'i personadır.
Sıra: (1) Ayar'da token doluysa alanı gizle (2) Wear OS saat uygulaması Seans/Özet/Teknik — docs/PLAN-WEAR.md S-next (3) izleme sayfası adayı (4) toplu test + deploy + Dean'e kontrol listesi.
Gün içinde Dean öğün söylerse: önce günü GET, sonra POST (node fetch). Yeni iş açma; diğer telefona APK kararı Dean'den bekleniyor.
ops/cloudflared/config.yml commit etme.
```
