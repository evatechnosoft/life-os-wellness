# Hareket görselleri — çekim rehberi

Kütüphanedeki kareler şu an `free-exercise-db`'den geliyor: yabancı salon, yabancı
makine, iki durağan kare. Dean'in kullandığı makineyle birebir aynı değil, bu yüzden
"benim makinem bu mu" sorusunu cevaplamıyor. Bu dosya kendi görsellerimizi nasıl
çekeceğimizi tarif eder.

## Neden GIF

İki kare hareketi anlatmıyor; çaprazlama geçiş hareketin ortasını atlıyor
(chest press'te dirseğin nereye kadar indiği tam orada). Tek bir 2-3 saniyelik
GIF hem başlangıcı hem ortayı hem bitişi gösterir, video oynatıcı gerektirmez,
`<img>` içinde çalışır — kart kodu değişmez.

## Çekim kuralları (hepsi için aynı)

| Konu | Kural |
|---|---|
| Açı | Hareket düzlemine **dik**. İtme/çekme yanda, squat/press önde, kalça menteşesi yanda. |
| Yükseklik | Kamera göğüs hizasında, yere paralel. Yukarıdan bakış eklem açısını yalan gösterir. |
| Mesafe | Makine + model tam kadrajda, üstte ve altta bir karış boşluk. Yakın plan yok. |
| Kadraj | **Dikey değil, yatay (16:9)**. Kart görseli yatay kırpıyor. |
| Tekrar | 2 tam tekrar çek, GIF'e **tek tekrar** girer — en temiz olanı. |
| Tempo | 2 saniye pozitif, 1 saniye tepe, 2 saniye negatif. Normalden yavaş. |
| Kıyafet | Koyu düz üst, açık zemin (ya da tersi). Desenli tişört GIF'te titriyor. |
| Işık | Makinenin üstündeki lamba arkada kalmasın; model ile kamera arasına gölge düşmesin. |
| Sabitlik | Telefon sabit — tripod, yoksa bank/makine üstüne dayanmış. Elde çekim GIF'te sarhoş gibi. |
| Ağırlık | Gerçek çalışma ağırlığı gerekmez; **form doğru** olsun yeter. |

Model: Dean ya da dummy (manken/asistan) — kim olduğu değişmez, kadraj ve açı değişmez.

## Öncelik sırası

Program hareketleri önce; kütüphanenin tamamı değil (43 hareket = 43 çekim, gerek yok).

1. Chest press (makine) · 2. Pec deck · 3. Lat pulldown (geniş) · 4. Row (makine)
5. Leg press · 6. Hip thrust · 7. Seated leg curl · 8. Biceps curl (makine no 7)
9. Triceps press (makine no 8) · 10. Omuz presi · 11. Kablo çekiş · 12. Calf press

İkinci tur: dead bug, Pallof, split squat, kablo crossover, preacher curl, thigh abductor.

## Çekimden GIF'e

Telefondan çıkan mp4 → tek tekrar kırp → GIF:

```bash
# 1) Tek tekrarı kes (00:03'ten 5 saniye), 2) 480px genişlik, 12 fps, palet ile renk
ffmpeg -ss 00:00:03 -t 5 -i cekim.mp4 -vf "fps=12,scale=480:-1:flags=lanczos,palettegen" palet.png
ffmpeg -ss 00:00:03 -t 5 -i cekim.mp4 -i palet.png \
  -lavfi "fps=12,scale=480:-1:flags=lanczos[x];[x][1:v]paletteuse" chest-press.gif
```

Hedef: **1 MB altı**. Aşarsa önce fps'i 10'a, sonra genişliği 400'e düşür.

## Kataloğa koyma

GIF'ler sunucudan servis edilir (APK'ya gömülmez, GitHub CDN'e konmaz — 120 KB/s dersi):
`ota/` gibi bir `media/` dizini ve `https://fit.evaitec.com/media/<dosya>.gif`.

`data/exercise-tr.json` içinde o harekete `media` alanı eklenir; `build-exercises.mjs`
bu alan varsa upstream karelerini kullanmaz:

```json
"Chest_Press_Machine": {
  "name": "Chest press (makine)",
  "media": [{ "type": "gif", "url": "https://fit.evaitec.com/media/chest-press.gif" }]
}
```

Kart tarafında değişiklik yok: tek kare gelince geçiş döngüsü kendiliğinden durur,
`<img>` GIF'i oynatır, ilk gösterimde IndexedDB'ye inip çevrimdışı çalışır.
