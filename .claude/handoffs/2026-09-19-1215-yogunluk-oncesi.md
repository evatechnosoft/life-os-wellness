# Handoff: yoğunluk planı bekliyor — bugünün verisi kayıtlı

> 2026-09-19 12:15 · `dev` @ `181d1a4` · çalışma ağacı temiz

## Hedef
Dean Pages'teki ekranı "hâlâ çok çirkin — kocaman bölgeler, yazılar, kartlar" buldu.
Düzen onaylı (PLAN-UI §9), şikâyet **ölçek**. Plan `docs/PLAN-UI.md §11`, altı adım.
Yeni oturum bunu uygular.

## Durum — kanıtlı
- `dev`: #11 egzersiz kütüphanesi · #12 profil + ürün kataloğu + ürün arama ·
  #13 Bugün üst bloğu · #14 §11 planı · #15 devir · `181d1a4` AGENTS akış güncellemesi.
- Yayın: v0.19.0 release + OTA (`versionCode 1900`); Bugün üst bloğu APK'ya girmedi
  (etiket atılmadı). Pages canlı: https://evatechnosoft.github.io/life-os-wellness/
  ("7 gün ort." ve "Ürün ara" yayındaki JS'te doğrulandı).
- API imajı yeni persona ile ayakta (`/health` 200).
- Bugün (`2026-09-19`): 107.6 kg · 134/81 · açlık şekeri 109 (`notes` + `data/olcumler.md`)
  · öğün 08:30 kahvaltı 23 g/400 kcal · 11:45 etli patates+pilav+salata 38 g/690 kcal
  · `daily_log.protein_g = 61`. Akşam kaydı YOK (silindi, henüz yenmedi).
- Kurallar: `AGENTS.md § Akış` — küçük iş doğrudan `dev`'e, PR sorulmadan merge;
  hafıza `pr-otomatik-merge`. `test`/`prod`'a doğrudan push hâlâ yok.

## Doğrulanmadı
- §11'in hiçbir adımı uygulanmadı.
- S1 kabul testi (profil dolu → "16:8 bana uygun mu") — profil boş.
- Referans artifact: https://claude.ai/code/artifact/e2811588-3b17-44b8-a27b-001c767de007

## Tekrarlama
- **Henüz olmamış şeyi kaydetme.** "sabah ve akşam helva" cümlesinden akşam kaydı
  yazdım, saat 12'ydi; Dean haklı olarak kızdı. Öğün saati = şu anki saat, gelecek yok.
- Düzeni yeniden tasarlama; şikâyet ölçek. Önce §11-1 tokenlar + ortak `Chip`.
- Yeni kit/bağımlılık ekleme (Radix dâhil); `details/summary` yeter.
- Repo köküne görsel düşürme (curl cwd tuzağı; public repo kilidi).
- Dean'in profilini uydurma; canlı DB'de test satırı bırakma.
- API route ekleyince `docker compose up -d --build api` şart (bind mount yok).

## Next (tek adım)
`feature/ui-density`: PLAN-UI §11-1 (`--radius-card 18`, `--radius-field 12`, `Card p-4`,
başlık 11 px, `ui/Chip.tsx` `px-3 py-1.5 text-xs`; WorkoutForm/SplitEditor/Profile/Meals
çipleri buna geçer) + §11-2 (`isNative()` yoksa Saat/Uyku/APK/model kartları çizilmez).
Test + typecheck + build → merge → Pages'te ekran boyu ölç (hedef Bugün ≤ 3 ekran) →
Dean'e URL ile göster. Sonra §11-3 matris split, §11-4 katlanır kart, §11-5 Ayar bölgeleri.
