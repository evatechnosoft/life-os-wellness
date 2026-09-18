# Handoff: Egzersiz kartı tasarımı yayında, onay bekliyor · kütüphane 28 hareket

> 2026-09-18 22:27 · `dev` @ `eda4e5a` · **hiçbir şey commit edilmedi**
> Çalışma ağacındaki yeni dosyalar: `docs/PLAN-COACH.md` · `data/exercise-tr.json` ·
> `data/exercises.json` · `scripts/build-exercises.mjs` · `docs/assets/exercise-preview/*` (gitignore'lu)
> Önceki devir: `2026-09-18-2130-egzersiz-kutuphanesi-tohumu.md` — kütüphane kurulumu orada.

## Bu turda yapılan (doğrulanmış)

**Kart tasarımı yayınlandı ve onay bekliyor:**
https://claude.ai/code/artifact/2a22fd4b-1b43-4587-b1f7-4b364f57c14f
Kaynağı `docs/assets/exercise-preview/card.html`, görseller `img/*.jpg` olarak yanında yayınlandı.
`git check-ignore` ile doğrulandı: `.gitignore:30 docs/assets/*` — dizin repoya girmiyor.

**Kütüphane 28 hareket.** Bu turda eklenenler: `Arnold_Dumbbell_Press`, `Reverse_Flyes`,
`Dumbbell_Shrug` (omuz düzeltmesi), `Pallof_Press`, `Dead_Bug`, `Cable_Crunch` (karın).

## Tasarım kararları — Dean'in "renklerle işaretleme" isteğine karşılık

Dean'in önerisi: "çok çalışan doğru yeşil, yük binen kırmızı, izole olan sarı".
Uygulanan ayrım (ve nedeni):

- **Yeşil = asıl çalışan** (dolgu) — `exercises.json › primary`
- **Sarı = destekleyen** (dolgu) — `secondary`
- **Kırmızı = yük binen nokta** — **dolgu değil, kesikli kontur.** Neden: aynı bölge hem
  destek hem yük noktası olabiliyor (pallof'ta omuz). Kontur olunca sarı dolgu kalıyor,
  ikisi birden okunuyor. Dean'e soruldu: dolgu isterse bu bilgi kaybolur.
- Renk tek başına bilgi taşımıyor — her kartta renkli metin etiketleri + "Dikkat" satırı var.
- **Ön ve arka iki figür** — bel ve kalça önden görünmez, tek figür yanıltırdı.
- `load` ve `cues`/`watch` alanları **elle** giriliyor; upstream'de karşılığı yok.

**Palet evaglass aurora tokenlarından**, `D:/projects/evaglass/design/tokens/evaglass.tokens.json`:
`#0B0D12` bg · glass `rgba(255,255,255,.06)` · ink `#F4F6FB` · edge `.14` · Space Grotesk + Inter ·
card radius 26 · pad 22. **Tek bilinçli sapma:** UI aksanı teal `a1 #2DD4BF` yerine
indigo `a2 #6366F1` — teal, "yeşil = çalışan" koduyla karışıyordu.
Kas renkleri aksandan ayrı: `#4ADE80` / `#FBBF24` / `#F87171`.
Karanlık tema bilinçli tek yön (uygulama da aurora'da koyu).

Geçiş: 900 ms çapraz geçiş, 1.9 sn'de bir; duraklat + elle kare değiştir düğmeleri;
`prefers-reduced-motion` açıksa otomatik oynatma yok.

## Koçluk tarafında bu turda düzeltilen iki tespit

Dean'in ilk listesi eksikmiş. **Her iki boşluk tespitim de yanlıştı:**
omuz çalışıyormuş (face pull, yan kaldırış, Arnold press) ve **bacak da çalışıyormuş**
(her gün full body: press, ön bacak, arka bacak). Doğru tablo: **programı zaten tüm
vücuttu ve doğruydu.** Bundan sonraki katkı hareket seçimi değil: sıra, set sayısı,
efor ve ilerleme. Dean antrenman terimlerini biliyor — anlatımı sıfırdan kurma.

Karın kararı: haftada 2 gün, seans sonunda 2 hareket (Pzt plank + pallof, Cum kablo crunch +
dead bug, Çrş yok). Her gün gerekmiyor — karın da bir kas, biseps gibi toparlanır.
Spot reduction: 2023 RKÇ (n=16) gövde yağında %7 fark buluyor ama toplam yağ aynı;
**sınırlı kanıt**, meta-analizler desteklemiyor. Mekik göbek eritmez denildi.

## Bekleyen

- **Kart onayı:** figür sadeliği yeterli mi, kırmızı kontur mu dolgu mu.
- Makine fotoğrafları (Dean gönderecek) → Türkçe kullanım anlatımları.
- Salı seansının ağırlıkları ve set sayıları → gerçek hacim tablosu, 2. hafta artışı.
- **Ayar → Güncelleme denetle** (telefon eski sürüm, senkron akmıyor).
- Ayardaki protein hedefi hâlâ 140 g; 109 kg için 175–240, başlangıç 190.

## Tekrarlama

- Dean'in antrenman bilgisini sıfır varsayma; bacak/omuz "eksik" deme.
- `scripts/build-exercises.mjs` bazen `UND_ERR_CONNECT_TIMEOUT` veriyor (geçici,
  raw.githubusercontent) — ikincide geçiyor, koda retry ekleme.
- Artifact'ta uzak görsel kullanma: CSP raw.githubusercontent'i **bloklar**. Görseller
  `files` parametresiyle yanında yayınlandı; kaynakları çalışma dizini altında olmalı.
- Evaglass dışı palet kullanma.
- Senkronu "düzeldi" sayma: `docker logs life-os-wellness-api-1 | grep fit.evaitec.com`.

## Next (tek adım)

Dean kartı onaylayınca `feature/exercise-library` dalı: `lib/exercises.ts` (TDD:
`byEquipment`, `byMuscle`, `alternatives`) + `ui/Exercise.tsx` — kart HTML'i prototipten
taşınır, görsel `db.exercise_media`'ya cache'lenir. Karar verilmemiş: `data/exercises.json`
web'e import olarak mı public asset olarak mı gidecek.
Onaya kadar hiçbir şey commit edilmedi; dal açılırken topluca alınacak.
