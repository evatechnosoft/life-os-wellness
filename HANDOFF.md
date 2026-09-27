# Handoff: Eva yedek zinciri telefonda doğrulanacak

> 2026-09-27 gece · `dev` @ `b19721a` (+ bu devir commit'i) · test 416/416 · fit.evaitec.com health 200

## Goal
Sunucu (bu PC) kapalıyken Eva susmasın. Zincir: sunucu → Firebase AI Logic bulut yedeği →
Gemini Nano (telefon) → Gemma 3n E4B (telefon) → kural motoru. Kod bitti ve canlıda;
kalan iş **telefonda görmek** (kabul = Dean uygulamada görür). Ayrıntı: `.claude/handoffs/latest.md` § "27 Eyl".

## State
- APK **0.39.0** OTA katalogunda (Gemini Nano önce, ML Kit `genai-prompt:1.0.0-beta4`, Kotlin 2.3.21).
- PR #26 `7a29d56`: `apps/web/src/lib/cloudAi.ts` + `chat.ts` offline() başı. Canlı paket `05107bd05ae6ea40`
  (APK'sız iner). Firebase projesi `evaitec-wellness` (deancjx@gmail.com, Spark — veriyle gönderim Dean onaylı).
- App Check reCAPTCHA Enterprise kayıtlı, **ENFORCED değil**.
- Dean'in telefonu **Galaxy Z Fold 7** (ML Kit GenAI resmi listesinde); S24 Ultra ikinci telefon. Cihaz koşulu kodda yok,
  `checkStatus()` çalışma anında karar verir.
- Gemma dosyası sunucuda `ota/gemma-3n-E4B-it-int4.task` (git dışı), telefona indirmek tünelden 3–8 saat sürdü — öncelik değil.
- unverified: WebView'de reCAPTCHA puanı / AI Logic cevabı; Fold 7'de Nano durumu.

## Next
1. Dean'den iki ekran bilgisi al: (a) Ayar > Cihaz-içi Eva kartı "Gemini Nano hazır" mı; (b) sunucu kapalıyken
   (`docker compose stop api`) Eva cevabı "Sunucu kapalı, bulut yedeği yanıtlıyor" ile mi başlıyor. Sonra `docker compose start api`.
2. (b) yerel model notuyla geldiyse: telefonda WebView konsolu (`chrome://inspect`) → `askCloud` uyarısı. 403 → Firebase
   konsol AI Logic → Get started (Gemini Developer API); App Check düşük puan → Android Play Integrity sağlayıcısı.
3. (b) çalıştıysa: `python <scratchpad sarmalayıcı> --project evaitec-wellness --account deancjx@gmail.com --domains fit.evaitec.com,localhost,evaitec-wellness.web.app --enforce`
   (sarmalayıcı yoksa `~/.claude/skills/firebase-gemini/setup_ai.py`, firebase-tools yerine gcloud token + `x-goog-user-project` başlığı).

## Don't repeat
- Uygulama içi thread indirmesi (0.38.0) — arka planda ölür, hata olunca `.part` silinirdi → DownloadManager.
- GitHub release'e model koymak — 2 GB sınırı.
- Bash heredoc içinde python'a `\\n` yazmak — gerçek satır sonuna dönüşüp TS'yi bozdu; TS/Kotlin düzenlemede Edit tool.
- `firebase-tools` oturumu deancjxvr'de; deancjx için gcloud kullan, login isteme.

## Read first
1. `.claude/handoffs/latest.md` — son iki bölüm (27 Eyl akşam/gece)
2. `apps/web/src/lib/cloudAi.ts` — bulut yedeği
3. `apps/web/android/app/src/main/java/com/evaitec/wellness/LocalLlmPlugin.kt` — Nano/Gemma

## Verify
git rev-parse --short HEAD               # b19721a'dan sonraki devir commit'i
git status --porcelain | grep -v worktrees  # boş
npm test                                  # 416 passed
curl -s https://fit.evaitec.com/bundle/bundle.json | head -3   # version 05107bd05ae6ea40, min_native 3900

## <yeniden başlangıç> promptu (yapıştır)
```
Durum: life-os-wellness dev'de. Eva yedek zinciri (sunucu → Firebase AI Logic → Gemini Nano → Gemma → kural) kodu bitti,
canlıda (APK 0.39.0, canlı paket 05107bd0), telefonda (Galaxy Z Fold 7) doğrulanmadı. App Check enforce kapalı.
Ortam: D:\projects\evaitec\lifeOS\life-os-wellness, sunucu docker compose (api), fit.evaitec.com tünel.
Önce HANDOFF.md oku, Verify bloğunu çalıştır. Öncelik: Next 1 (Dean'den Nano kartı + sunucu kapalı cevap),
sonra 2 veya 3. Öğün/ölçüm kayıtları dean-pt skill'iyle. Yeni iş açma.
```
