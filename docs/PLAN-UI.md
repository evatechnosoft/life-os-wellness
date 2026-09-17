# PLAN-UI — Ekran düzeni: Ayar'ı toparla, Bugün'ü seyrelt

> 2026-09-17 · Kaynak: `apps/web/src/ui/*` · Kilitler: giriş 60 sn altı, offline-first,
> tek kullanıcı, PWA + APK aynı kod. Bu plan **görünüm** planıdır; veri katmanına dokunmaz.

## 0. Şikâyet ve ölçülen karşılığı

Dean: "Ayarda hiç iyi durmuyor, her şey açıkta."

Ölçüm (`grep -n "Card title=" apps/web/src/ui/Settings.tsx`), ekrandaki sırayla:

| # | Kart | Ne sıklıkta lazım |
|---|---|---|
| 1 | Saat uygulaması | yılda birkaç kez |
| 2 | Telefon uygulaması | yılda birkaç kez |
| 3 | Cihaz-içi Eva (model indirme) | bir kez |
| 4 | Sunucu | kurulumda, sonra arıza anında |
| 5 | **Hedefler** | **haftalık** |
| 6 | **Beslenme itmesi** | aylık |
| 7 | Haftalık program | aylık |
| 8 | **Hatırlatmalar** | aylık |
| 9 | Notlar (geçmiş) | ara sıra okunur |
| 10 | Veri (dışa aktar / sil) | nadiren, biri geri alınamaz |

İki somut kusur:

1. **Sıra ters.** En nadir kullanılan üç kart (APK ve model kurulumu) en üstte;
   haftalık dokunulan "Hedefler" beşinci sırada, 300+ piksel aşağıda.
2. **Hiçbiri katlanmıyor.** 396 satırlık bileşen tek dikey akış olarak açılıyor;
   telefonda yaklaşık altı ekran boyu kaydırma. Ekranda "ne var" bilgisi yok,
   yalnız "ne kadar çok şey var" hissi var.

Bugün ekranı da aynı yönde büyüyor: dört kart + Koç + Eva + retro + Saat + Uyku +
antrenman formu, hepsi her gün açık — oysa hepsi her gün gerekmiyor.

## 1. Scope Lock

**Değişir:** `apps/web/src/ui/Settings.tsx`, `Today.tsx`, `Field.tsx` (ortak
bileşenler), `index.css` (token eklemesi). Yeni dosya: `ui/Section.tsx`, `ui/Row.tsx`.

**Değişmez:** veri katmanı (`lib/*`), sync protokolü, Dexie şeması, kural motorları,
renk paleti ve evaglass dili, alt navigasyon dörtlüsü (Bugün · Eva · Hafta · Ayar).

## 2. Karar: hazır kit mi, kendi iskeletimiz mi

| Seçenek | Lisans | Getirisi | Bedeli | Karar |
|---|---|---|---|---|
| **Native `<details>` / `<summary>`** | — | Sıfır bağımlılık; klavye ve ekran okuyucu desteği tarayıcıdan gelir; açık durumu CSS ile stillenir | Animasyon elle yazılır; çoklu-açık davranışı elle | **Seçildi (P1)** |
| Radix Primitives | MIT | Accordion/Select/Switch davranışı, WAI-ARIA; stil getirmez, evaglass korunur | Üç paket daha, bundle artışı | Yedek (P3, gerekirse) |
| shadcn/ui | MIT | Hazır bileşen seti, Tailwind ile | Kendi tema katmanını getirir, evaglass tokenlarıyla çakışır; CLI kod kopyalar | Hayır |
| DaisyUI | MIT | Hazır sınıflar | Tasarım dilini ezer, cam/blur dili gider | Hayır |
| Ionic React | MIT | Tam mobil kabuk, Capacitor ile birinci sınıf | Uygulamanın görünümünü domine eder, 1 MB üstü | Hayır |

**Gerekçe:** burada eksik olan bileşen değil **düzen**. Kit getirmek 10 kartı
sıralamaz, aynı 10 kartı başka bir temayla çizer. Katlama işini `<details>`
bağımlılıksız çözüyor; gerçek ihtiyaç (Select/Switch erişilebilirliği) çıkarsa
Radix sonradan eklenir, o kapı kapanmıyor.

## 3. Bilgi mimarisi — Ayar

Üç bölge, sırası kullanım sıklığına göre; her bölge katlanır, ilki açık gelir:

```
Ayar
├─ Günlük ayarlar            (açık)
│  ├─ Hedefler               protein, haftalık kayıp %, set/grup
│  ├─ Beslenme itmesi        nudge, serbest öğün günü
│  ├─ Hatırlatmalar          tartı saati, retro saati, bel günü
│  └─ Haftalık program       antrenman bölgeleri
├─ Cihazlar                  (kapalı, yalnız APK)
│  ├─ Saat uygulaması        saate APK gönder
│  ├─ Telefon uygulaması     güncelleme kontrolü
│  └─ Cihaz-içi Eva          model indir / sil
└─ Veri ve sunucu            (kapalı)
   ├─ Sunucu                 adres, token, bağlantı durumu
   ├─ Notlar                 geçmiş kayıt defteri
   └─ Dışa aktar / Sil       geri alınamaz olan en altta, ayrı uyarı ile
```

Kurallar:

- **Web'de cihaz bölgesi hiç çizilmez.** Bugün tarayıcıda "Saate gönder" düğmesi
  görünüyor ve basınca "Yalnız Android uygulamasında çalışır" diyor; var olup
  çalışmayan düğme, olmayan düğmeden kötüdür (`isNative()` zaten mevcut).
- Katlama durumu `db.settings` içinde saklanır (`ui_sections`), yeniden açılışta korunur.
- Her bölüm başlığında tek satırlık özet: "protein 140 g · kayıp %0,7" gibi —
  açmadan ne olduğu görünür.
- Yıkıcı işlem (veri sil) tek başına ve en altta; onay iki adımda alınır.

## 4. Bileşen sözleşmesi

| Bileşen | Sorumluluk | Durum |
|---|---|---|
| `Section` | `<details>` sarmalayıcı: başlık, özet satırı, kalıcı açık/kapalı durumu | Yeni |
| `Row` | Etiket + kontrol, tek satır, en az 44 px dokunma hedefi | Yeni; `NumberField` bunun üstüne oturur |
| `Card` | Var olan cam kart; bundan sonra bölüm değil, içerik grubu | Mevcut |
| `Segmented` | 2–4 seçenekli tercih (nudge gibi), `select` yerine | Yeni, küçük |

`select` öğeleri kalabilir: Android'de yerel açılır liste tek dokunuş, kendi
menümüzü yazmak kazanç getirmiyor.

## 5. Bugün ekranı (P2)

Aynı ilke: her gün gereken üstte, gerisi katlanır.

- Üstte değişmeyen üçlü: protein halkası, hatırlatmalar, Koç.
- "Ölçüm" (kilo, adım, tansiyon, bel) tek katlanır bölüm; girildiyse kapalı gelir,
  özet satırında değerler görünür.
- Saat ve Uyku kartları katlanır; veri yoksa hiç çizilmez — "veri yok" kartı
  göstermek yerine hiçbir şey göstermek daha sakin.
- Akşam retrosu saat 20'den önce katlanır (sıra değişimi zaten var).

## 6. Kabul kriterleri

- [ ] Ayar ilk açılışta tek ekrana sığar: üç bölüm başlığı + açık ilk bölüm, kaydırmasız.
- [ ] Tarayıcıda cihaz bölümü DOM'da yok (`isNative()` false).
- [ ] Açık/kapalı durumu uygulama kapanıp açılınca korunuyor.
- [ ] Hedef değiştirme akışı (Ayar'ı aç → protein hedefini değiştir → kaydet)
      **10 saniyenin altında**, gerçek telefonda kronometreyle.
- [ ] 60 sn kuralı bozulmadı: Bugün ekranında protein ve öğün girişi hâlâ ilk
      ekranda, kaydırmasız erişilebilir.
- [ ] Yeni npm bağımlılığı yok.
- [ ] `npm test` + `npm run typecheck --workspaces` yeşil, `npm run build` başarılı.

## 7. Uygulama sırası

| Faz | İş | Dal |
|---|---|---|
| P1 | `Section` / `Row`, Ayar'ın üç bölgeye ayrılması, web'de cihaz bölümünün gizlenmesi | `feature/ui-settings` |
| P2 | Bugün ekranı katlama, boş kartların çizilmemesi | `feature/ui-today` |
| P3 | Gerekirse Radix ile Select/Switch erişilebilirliği ve animasyon | — |

## 8. Riskler

- **Katlama veriyi gizler.** Girilmemiş bir alan kapalı bölümde kalırsa unutulur;
  bu yüzden bölüm özetinde eksik alan görünür ("bel: —") ve hatırlatma kartı
  Bugün ekranında kalır.
- **Durum kalıcılığı** yeni bir `settings` anahtarı demek; şema değişmiyor, eski
  kurulumda anahtar yoksa varsayılan uygulanır (ilk bölüm açık).
- `<details>` içinde `position: sticky` ve blur birlikte bazı Android WebView
  sürümlerinde titreyebilir; P1 sonunda gerçek cihazda bakılır, sorun çıkarsa
  başlık sticky olmaktan çıkar.
