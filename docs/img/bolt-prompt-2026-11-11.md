# Bolt / v0 promptu — 3 sayfa × 2 varyasyon (2026-11-11)

Ek görsel: `varyasyon-2026-11-11.png`. Bolt.new, v0.dev veya Lovable'a görselle birlikte yapıştır.

Build a single-page React + Vite + Tailwind prototype (no backend, mock data only) for a personal fitness/wellness mobile app. Use the attached screenshot as the visual reference: dark "aurora glass" style, bg #0b0d12, glass cards rgba(255,255,255,.06) with 1px rgba(255,255,255,.07) border, radius 18px, accents teal #2dd4bf, indigo #6366f1, pink #ec4899, green #4ade80 for good trend, red #f87171 for bad. All UI text in Turkish. Mobile frame 390px wide, pill bottom nav + round teal "+" FAB like the screenshot.

The app has 3 pages, and I want 2 design variants of EACH page (6 screens total). Put a top switcher on the canvas: "1A 1B | 2A 2B | 3A 3B" so I can flip between them, and also a "Yan yana" mode that shows all 6 phones side by side.

PAGE 1 - "Özet" (summary): tabs Gün / Hafta / Ay. Shows protein (92/150 g), kalori (1020/2120), adım (5760/8000), kilo 7-gün ort. trendi (-0.4 kg/hf), uyku 6:48, dinlenme nabzı 61, antrenman günleri.
 - 1A: concentric RINGS (like screenshot variant A). Hafta = 7 small daily rings in a row; Ay = calendar grid where each day is a mini ring.
 - 1B: BARS instead of rings. Gün = horizontal progress bars; Hafta = 7-day vertical bar chart per metric; Ay = 30-day bar chart + weekly averages.

PAGE 2 - "Takip" (tracking/logging today):
 - 2A: vertical day TIMELINE (like screenshot variant B): sabah tartısı, kahvaltı, yürüyüş (Health Connect), "Şimdi: Öğle 43 g açık", 18:30 Sırt + Biceps seansı, akşam yemeği, akşam retrosu. Done items with teal dots, current item highlighted.
 - 2B: "NEXT UP" focus card (like screenshot variant C): big hero card "Sırada 18:30 · Sırt + Biceps" with exercise list (Lat pulldown 3x10 45 kg, Seated row 3x10 40 kg, Biceps curl 2x12 10 kg) and "Seansı başlat" button, below it quick log rows for öğün/kilo/su with + buttons.

PAGE 3 - "Diğer" (other actions): Hedefler, Hareket kütüphanesi, Seans ve Tabak, Shake ve Dondurma tarifleri, Hatırlatmalar, Saat/Health Connect, Veri dışa aktar, Ayarlar.
 - 3A: 2-column tile grid with icons, grouped (Her hafta / Ara sıra / Kurulum).
 - 3B: iOS-style grouped list with collapsible sections and right chevrons, most-used on top, "Veri sil" at the bottom in red.

Keep the 4-tab bottom nav labels: Bugün · Plan · Ölçüm · Koç. Use inline SVG for charts (no chart library). Make it clean, readable, AA contrast.
