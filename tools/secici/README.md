# Seans ve Tabak — seçici artifact

Salonda "bu makine dolu, yerine ne?" ve mutfakta "bu tabak yeter mi?" sorularını cevaplayan
tek sayfa. Uygulamanın (PWA) parçası **değil**; claude.ai üzerinde yayınlanan bağımsız bir sayfa.

**Canlı:** https://claude.ai/code/artifact/3b8b7694-4807-4ae2-8bd3-0af0447a345c

## Dosyalar

| Dosya | Ne |
|---|---|
| `secici.html` | Sayfanın kendisi. Katalog verisi içine gömülü, `plan.js`'i script olarak yükler. |
| `plan.js` | Seans üreteci + kural denetçisi. Saf; sayfada da Node testinde de aynı dosya koşar. |
| `plan.test.mjs` | Zar 9000+ tur atılır, her turda denetçi çalışır. Kural bozan 0 olmalı. |
| `rows.json` | Kütüphanenin sayfaya taşınan alanları. `build.mjs` üretir. |
| `build.mjs` | `rows.json`'u üretir, hareket görsellerini `img/` altına indirir. |
| `img/` | 43 hareket görseli. **Repoda yok** (2.8 MB), `build.mjs` indirir. |

## Kurallar nereden geliyor

`plan.js` içindeki şemalar `docs/PROGRAM-2026-09.md`'den okunur — set sayıları, haftalık
kas başına hedef (§80), hipertansiyon kısıtları (§67-68). Program değişirse `plan.js` ve
`plan.test.mjs`'deki `HEDEF` birlikte değişir; test ikisinin ayrışmasını yakalar.

## Test

```bash
node tools/secici/plan.test.mjs
```

## Yayın

```bash
node tools/secici/build.mjs      # görseller + rows.json
node tools/secici/plan.test.mjs  # yeşil olmadan yayınlama
```

Sonra Artifact aracıyla, **mevcut URL'yi koruyarak**: `url` parametresine yukarıdaki adres,
`file_path` olarak `tools/secici/secici.html`, `files` içinde `plan.js` ve `img/*.jpg`.

> `url` geçilmezse yeni bir artifact açılır ve Dean'in kayıtlı verisi (db) eski adreste kalır.
> Dosya yolu bir kez değiştiği için bundan sonra `url` **her yayında** gerekli.
