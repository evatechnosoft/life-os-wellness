# Handoff: Seans/Tabak seçici artifact · takviye değerlendirmesi · sistem kararı

> 2026-09-21 17:38 · `dev` @ `387d58c` · çalışma ağacı temiz · önceki: `2026-09-21-1558-ota-imza-ve-katalog.md`

## Hedef

15:58 devrinden sonra Dean art arda istekler verdi: 16:00 ara öğün kaydı, salon/mutfak için
HTML seçici, kural denetimli zar, haftalık makro düzeni, üç güne bölünmüş sistem, haftalık zar,
full-body vs split kanıtı, ve 16 fotoğraflık takviye değerlendirmesi. Hepsi karşılandı.

## Artifact — canlı ve kayıtlı

**https://claude.ai/code/artifact/3b8b7694-4807-4ae2-8bd3-0af0447a345c** (`db` capability, contract 0.2.52)

Kaynak repoda **değil**: `.artifact-build/` (gitignore'lu). İçinde `secici.html`, `plan.js`,
`plan.test.mjs`, `rows.json`, `img/` (43 jpg, 2.7 MB), `patch*.py`. **Bu dizin silinirse
artifact güncellenemez** — yeniden üretmek için `apps/web/src/data/exercises.json`'dan
rows.json + görselleri CDN'den indirmek gerekir.

Güncelleme: bu oturumda `file_path: secici.html` ile yeniden yayınla (cwd `.artifact-build`).
Başka oturumdan: `url` parametresiyle.

Üç sekme: Seans kur (kas grubu × alet, resimli kartlar, "yerine: X · Y"), Tabak kur
(30 kalem Türk mutfağı + makro çubukları), Hafta (7 gün × Ağırlık/Yüzme/Dinlenme → makro hedefi).
db koleksiyonları: `sessions/<tarih>`, `plates/<tarih>`, `weeks/current` (gün tipleri),
`weeks/plan` (zarla kurulan üç seans).

## Kanıtlanmış

### Zar kural bozmuyor (`plan.js` + `plan.test.mjs`, aynı dosya sayfada da koşuyor)
```
8000 tek seans turu, kural bozan 0, havuz dışı hareket 0
haftalık zar · Tüm vücut A/B: 1000 hafta, kural bozan 0
haftalık zar · Üç güne bölünmüş: 1000 hafta, kural bozan 0
makine crunch 1000 turda 0 kez seçildi
bölünmüş haftalık set dağılımı: {"gogus":9,"omuz":6,"sirt":9,"kol":6,"quad":6,"arka":5,"baldir":3}
```
Son satır PROGRAM §80 hedefiyle birebir ve testte `deepEqual` ile zorunlu.

### Sistem kararı (PROGRAM-2026-09'a yazıldı)
Hacim eşitken bölünme şekli fark yaratmıyor (PMID 30558493 frekans meta-analizi,
PMID 41343037 dose-response, 2024 split-vs-fullbody meta-analizi). 3 gün için **tüm vücut kalır**;
bölünmüş sistem uygulamada seçenek, varsayılan değil. Tek istisna: seans başı 15+ set olunca
bölmek lehte — bizim seans 15-16, tam sınırda.

### Takviyeler (`docs/TAKVIYELER.md`)
9 ürün, Dean'in profiline göre: Harmana Mg 200 mg **kullan** (dördünü birlikte alma, üst sınır
350 mg elementel), Berberis **hekime** (etikette berberin miktarı yok, CYP3A4 etkileşimi),
Selfit bromelain isteğe bağlı / KoreaVit dolgu, **Ribera BURN ve ginseng shot kırmızı**
(kafein yığını hipertansiyonda; 50 ml'de 8 g şeker prediyabette).

## Doğrulanmadı

- Artifact'in tarayıcıda görünüşü — hiç açılmadı, yalnız `new Function` ile sözdizimi
  doğrulandı. `window.claude.use('db')` çağrıları hiç çalıştırılmadı.
- 0.26.0 APK'nın saate/telefona kurulduğu (önceki devirden devam eden açık iş).
- Takviye etiketleri yalnız fotoğraftan okundu.

## Tekrarlanmayacaklar

- **"Geçen hafta farklı olsun" ile "hafta içinde tekrar olmasın" aynı listeye yazılmaz.**
  İlk denemede 977/1000 hafta kırmızı çıktı; `roll()` artık `forbid` (sert) ve `avoid` (tercih)
  ayrı alıyor.
- `require()` ile `plan.js` yüklenmez — kök `package.json` `"type": "module"`. Test
  `await import('./plan.js')` + `globalThis.Plan` yolunu kullanıyor.
- Artifact `root`/`files` yolları çalışma dizini dışını kabul etmiyor; scratchpad'den
  yayınlamaya çalışma, `.artifact-build/` bunun için var.
- `main.tsx`'e top-level await konmaz (vite target es2020).
- Bash heredoc içine uzun JS gömme — tırnak yüzünden parse hatası verdi; `Write` ile
  `patch*.py` dosyası yazıp çalıştırmak çalışıyor.

## Açık işler

1. Artifact'i Dean gerçekten açtı mı, db kaydı çalışıyor mu — cihaz kanıtı yok.
2. Kütüphane havuzu dar: baldır 1 seçenek, sırt 4, arka zincir 3. Bölünmüş sistemde
   çekiş/bacak günlerinde haftadan haftaya tekrar kaçınılmaz. Dean'e salondaki calf raise,
   T-bar row, tek kol dambıl row soruldu, cevap gelmedi.
3. Sık yenen kombinasyonları isimle kaydetme (fasulye+pilav+salata = tek dokunuş) — önerildi,
   Dean bir hafta kullansın diye bekletiliyor.
4. 0.26.0 cihaz kanıtı + `%TEMP%/wellness-debug.keystore` kalıcı yere alınmalı (önceki devir).
5. Çekim rehberi (`docs/CEKIM-REHBERI.md`) hazır, çekim başlamadı.

## Sıradaki tek adım

Dean artifact'i açıp zarı denesin; db kaydı ve görseller gerçekten çalışıyor mu görülsün.
Ondan önce yeni özellik eklenmesin.
