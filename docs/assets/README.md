# docs/assets — paylaşılan görseller (repoya GİRMEZ)

Bu klasördeki dosyalar **commit edilmez** (`.gitignore`). Sebep: repo herkese
açık; buraya düşen şeyler etiket fotoğrafı, uygulama ekranı, banka ekranı,
sağlık verisi oluyor. Bir kez git geçmişine girerse silmesi zor.

## Nasıl kullanılır

Telefondan gönderdiğin fotoğrafı ajan buraya tarih klasörüyle koyar:

```
docs/assets/2026-09-17/destek-kreatin.jpg
docs/assets/2026-09-17/ogle-haslanmis-tavuk.jpg
```

Sonraki oturumlarda "şu fotoğrafa bak" demek için yol yeter; dosya yerinde durur,
ajan okur, konuşuruz. Kaybolmaması için yedek senin makinende — repo taşımıyor.

## Yayınlanacak görsel nereye

README'ye ya da dokümana konacak, **kişisel veri içermeyen** görsel (UI ekran
görüntüsü, diyagram) `docs/img/` altına konur; orası izlenir ve commit edilir.

| Klasör | Git'e girer mi | Ne için |
|---|---|---|
| `docs/assets/` | Hayır | Konuşma malzemesi: etiket, tabak, ekran, fatura |
| `docs/img/` | Evet | Dokümanda yayınlanan görsel, kişisel veri yok |
