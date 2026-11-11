# Bolt promptları: 3 tema ailesi × 2 yön (2026-11-11)

Araştırma: `C:\projects\tools\docs\research\fitness-ui-trend-2027.md`. Graffiti değerleri:
`evaglass/design/tokens/evaglass.tokens.json` → `themes.graffiti`.

İlk tur çıktılar birbirine benzedi çünkü aynı görsel, aynı renkler ve aynı yerleşim verildi. Bu turda:
görsel yok, her yönün yapısı da farklı (yalnız renk değil), yasaklar listesi var ve her aile ayrı Bolt sohbeti.

Her sohbet iki adımda gönderilir (Bolt 8k çıktı sınırı): önce ORTAK + 1. yön, sonra "Step 2" + 2. yön.

---

## ORTAK (her sohbetin başına)

Build a React + Vite + Tailwind prototype of a personal fitness tracking app, mock data only, all UI text in Turkish.
Do NOT reuse any earlier design: no dark glass cards, no teal/indigo/pink palette, no purple/indigo gradients,
no glassmorphism on content, no "three equal rounded cards with soft shadow", no generic thin outline icon set.
Load the named Google Fonts in index.html. Use tabular numbers for all metrics.

Canvas: a top switcher with the two direction names of this chat. For the selected direction show, side by side,
three phones (390x844) plus a "Butonlar" panel:
- **Özet**: segmented Gün / Hafta / Ay. Data: protein 92/150 g, kalori 1020/2120, adım 5760/8000,
  7 gün kilo trendi -0,4 kg/hf, uyku 6:48, dinlenme nabzı 61, bu hafta 4/5 antrenman.
- **Takip**: today's flow (07:10 sabah tartısı ✓, 08:00 kahvaltı 31 g ✓, 10:30 yürüyüş ✓,
  ŞİMDİ öğle 43 g açık, 18:30 Sırt + Biceps, 22:30 akşam retrosu) and the next session card
  (Lat pulldown 3×10 45 kg, Seated row 3×10 40 kg, Biceps curl 2×12 10 kg, button "Seansı başlat").
- **Diğer**: Hedefler, Hareket kütüphanesi, Seans ve Tabak, Shake ve Dondurma, Hatırlatmalar,
  Saat / Health Connect, Veri dışa aktar, Ayarlar, and destructive "Veri sil".
- Bottom nav on every phone: Bugün · Plan · Ölçüm · Koç, plus the direction's own "add" button.
- **Butonlar panel**: primary, secondary, ghost/text, destructive, icon button, FAB, chip (on/off),
  toggle, segmented control; each in default / pressed / disabled state. Buttons must look different per direction.

Write files directly, each under 200 lines, minimal chat text. Step 1 = shell + direction 1. I will send direction 2 next.

---

## SOHBET 1 — BEYAZ / AÇIK

**Yön L1 · "Kâğıt" (warm editorial)**
Palette: bg #F0EEE9 (Pantone 2026 Cloud Dancer), ink #1C1A17, terracotta #E85D3F (primary), deep teal #1F5C63,
olive #5F6F52, mustard #E9C46A. Fonts: Fraunces (display numbers, headings), Instrument Sans (body).
Structure: NO cards. Magazine layout: huge serif numbers (protein "92" at 96px), hairline 1px #1C1A17/15% dividers,
asymmetric two-column rows, subtle paper grain (SVG noise 4%). Progress as thin underline rules, not rings.
Takip = numbered editorial list with times in the margin. Buttons: solid terracotta pill primary,
outlined ink secondary, underlined text ghost, no shadows.

**Yön L2 · "Pop" (expressive sport, Material 3 Expressive spirit)**
Palette: bg #FFFBF2, ink #121212, sport lime #C6F432, coral #FF6B4A, cobalt #3A2E8F, peach #FFD9CC.
Fonts: Roboto Flex (variable: heavy condensed for numbers, regular for body).
Structure: purposeful asymmetric bento: one big tile (2×2) for today's main number, small tiles around it;
shapes vary (squircle, scalloped "cookie" badge for streak, capsule). Spring-like press animation (scale .96).
Progress = thick capsule bars, readiness as a big scalloped badge. Buttons: chunky 56px, ink fill with lime text primary,
coral destructive, shape morphs from capsule to rounded-square when pressed.

---

## SOHBET 2 — KOYU / KARBON

**Yön D1 · "Karbon" (mono + single safety accent)**
Palette: bg #0E0F10, surfaces #17181A / #1F2023 / #2A2B2F (4 levels, depth by border + luminance, no shadow, no blur),
text #E8E8E6, muted #8A8C90, ONE accent safety orange #FF5A1F, success #3DDC97 only for positive trend.
Fonts: Space Grotesk (headings, numbers), IBM Plex Sans (body), IBM Plex Mono (units, times).
Structure: "One Big Thing" hero at top (today's single most important action), everything else as dense
instrument-panel rows with mono labels, carbon-fiber subtle diagonal pattern only on the hero. Takip opens a bottom sheet.
Buttons: rectangular 8px radius, orange fill primary, 1px border secondary, mono uppercase ghost.

**Yön D2 · "Toprak Gecesi" (warm dark)**
Palette: bg #14110F, surface #2A2420, raised #3A322C, text #EDE6DC, amber #D9A066 (primary), sage #7FA88A, rust #C4553A.
Fonts: DM Serif Display (titles), Manrope (body).
Structure: radial gauge/dial for daily progress (one dial, three concentric arcs as tick marks, not rings),
weekly heatmap strip (7 squares), readiness shown as color + word + number together. Calm, generous spacing, rounded 20px.
Buttons: amber pill primary with dark text, sage outline secondary, rust destructive with icon.

---

## SOHBET 3 — NEON / GRAFFITI (evaglass graffiti tokens)

**Yön N1 · "Graffiti Sokak" (our evaglass graffiti theme, dark)**
Tokens exactly: bg #0A0A0A, soft #131313, paper #F4F4F0, ink #F4F4F0, ink-dim rgba(244,244,240,.74),
edge rgba(255,255,255,.14), accents a1 lime #C6FF3D, a2 hot pink #FF2D9B, a3 cyan #17E1F2,
signature gradient linear-gradient(120deg,#17E1F2,#C6FF3D 50%,#FF2D9B).
Fonts: Bangers (display, uppercase, hero 78px; must render Turkish ĞŞİÇÖÜ), Anybody (kinetic numbers), Inter (body),
Space Mono (labels). Effects: gradient-wash only on ONE hero card, corner-spot glow, scrolling marquee band
("BUGÜN · 92 G PROTEİN · 5760 ADIM ·"), sticker-like rotated labels (-3°), spray-dot texture, cta-sheen on primary button,
accent cycles lime → pink → cyan per section. Buttons: Bangers uppercase, lime fill + 3px black offset shadow (sticker),
pink destructive, cyan outline secondary.

**Yön N2 · "Neon Afiş" (graffiti on paper, light poster)**
Same graffiti tokens but inverted: bg paper #F4F4F0, ink #0A0A0A, accents lime #C6FF3D, pink #FF2D9B, cyan #17E1F2
used as flat poster blocks (no glow). Fonts: Anybody (wide, heavy, kinetic headings), Space Mono (data), Bangers only for
one stamp per screen. Structure: poster grid with thick 3px black borders, overlapping blocks, giant numbers that bleed
off the edge, halftone dot pattern, tape-strip labels. Takip as a ticket stub list; Diğer as a sticker sheet.
Buttons: hard black border 3px, flat neon fill, press = translate(2px,2px) and shadow disappears.
