# Handoff: beslenme kuralları PROGRAM'da · tansiyon verisi bekleniyor

> 2026-09-22 15:44 · dal `feature/ia-4-sekme` @ `d9c39a4` · çalışma ağacı temiz
> önceki: `2026-09-22-1222-ia-sekme-ve-katalog.md` (4 sekme + drawer + ürün kataloğu — orada kalsın)

## Bu turda olan

- **`PROGRAM-2026-09.md` §4'e beş kural yazıldı** (`d9c39a4`), Dean "gaz" dedi:
  kabuklular haftada ≤2 ve yağlı balık kotasından sayılmaz · konserve ton yağlı balık yerine
  geçmez · protein barı günde ≤1 (maltitol) · detoks/bitkisel karışım programa dahil değil,
  miktarı yazmayan kafein yok · tam yağlı yoğurt protein kaynağı sayılmaz, laktozsuz %1 süt
  300 ml = 9 g protein antrenman sonrası slotuna uygun.
- RIR 2 ve 8–15 tekrar kavramı Dean'e açıklandı (soru buydu, kod değişmedi).

## Açık ve kritik: tansiyon

Dean: "son değerler yanlış olduğunu gösteriyor, yeni değerler hayli düşük tansiyonda."
**O değerler sistemde yok.** Kayıtlı en yeni ölçüm `2026-09-21 132/88`; son 7 gün ortalaması
`136/88` (DB sorgusu). 22 Eylül'e ait hiçbir tansiyon kaydı yok.

Dean değerleri iletince:
1. `PUT /api/daily/<tarih>` ile `bp_systolic`/`bp_diastolic` yaz (sabah aç karnına, 2 ölçüm ort —
   program §5; antrenman sonrası ölçüm sayılmaz).
2. Ortalamayı yeniden hesapla.
3. **Antrenman kısıtları (RIR 2, 8–15, Valsalva yok) tek iyi ölçümle gevşemez** — program
   "7-gün ortalaması birikmeden gevşetme yok" diyor. Ortalama gerçekten banda inerse
   `PROGRAM-2026-09.md` §1 cümlesi ve `SAAT-RUTIN.md`'deki 90 sn dinlenme gerekçesi güncellenir.

## Hâlâ bekleyen (önceki devirden taşındı)

1. Görsel yön onayı (düz koyu + tek aksan; canlıda `fit.evaitec.com`).
2. 19 Eylül'de "eksik" dediği öğün — o günde zaten 5 öğün / 145 g protein kayıtlı.
3. Samsung'da karşılığı olmayan 11 exercise kodu için karar (`docs/SAAT-RUTIN.md`).
4. Saatte A/B/A′ rutinlerinin kurulması — Dean'in elindeki iş.
5. Faz 2 kalanı: DayStrip + SessionCard + PlateCard, Plan'da zar + kas haritası, `DocPage.tsx`.
6. Dal `feature/ia-4-sekme` → `dev` merge'i Faz 2 bitince.

## Tekrarlanmayacaklar

- Önceki devirdeki üç tuzak geçerli: Docker dist hash'i yerelden farklı (içeriği grep'le
  doğrula), `curl -d` Türkçe karakteri bozuyor (ASCII yaz), heredoc'tan JS'e `\n` yazma.
- Tansiyon yorumunu **kayıtlı veriye** dayandır; Dean'in sözlü beyanı henüz kayıt değil.

## Sıradaki tek adım

Dean yeni tansiyon değerlerini verdiğinde `PUT /api/daily/<tarih>` ile kaydet ve 7-gün
ortalamasını yeniden hesapla. Değer gelmezse Faz 2'ye devam: `ui/DayStrip.tsx` +
`ui/SessionCard.tsx` (spec §3).
