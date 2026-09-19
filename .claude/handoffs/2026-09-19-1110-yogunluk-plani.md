# Handoff: yoğunluk planı yazıldı — uygulama yeni oturumda

> 2026-09-19 11:10 · `dev` · çalışma ağacı temiz (handoff hariç)

## Hedef
Dean Pages'teki ekranı telefonda gördü: "hâlâ çok çirkin — kocaman bölgeler, yazılar,
kartlar." Sorun düzen değil **ölçek/yoğunluk**. Plan `docs/PLAN-UI.md §11`, altı adım.

## Durum — kanıtlı
- PR #13 (Bugün üst bloğu) ve #14 (§11 planı) `dev`'e merge. Pages canlı:
  https://evatechnosoft.github.io/life-os-wellness/ — yayındaki JS'te "7 gün ort." ve
  "Ürün ara" doğrulandı. Telefon APK'sı v0.19.0 (üst blok APK'ya girmedi, etiket yok).
- Hafıza: `pr-otomatik-merge` — PR'ı sormadan squash-merge et, sonucu göster.

## Doğrulanmadı
- §11'in hiçbir adımı uygulanmadı. S1 kabul testi (profil dolu → "16:8") bekliyor.

## Tekrarlama
- Düzeni yeniden tasarlama: Dean düzeni onayladı, şikâyet ölçek. Önce §11-1 tokenlar.
- Yeni kit/bağımlılık ekleme (Radix dâhil); `details/summary` yeter.
- Repo köküne görsel düşürme (public repo kilidi).

## Next (tek adım)
`feature/ui-density` dalı: §11-1 (tokenlar + ortak `Chip`) ve §11-2 (web'de cihaz
kartı yok) tek PR'da; merge; Pages'te ekran boyu ölçülüp Dean'e ekran görüntüsüyle
gösterilir. Sonra §11-3 matris split, §11-4 katlanır kart, §11-5 Ayar bölgeleri.
