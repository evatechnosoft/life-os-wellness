# Wellness Tracker — MVP Spec

**Sahip:** Dean · **Hedef:** kişisel kullanım (tek kullanıcı) · **Durum:** F0 başlangıç

---

## 0. Kritik kısıt — önce bunu oku

**PWA, Health Connect'i okuyamaz.** Health Connect bir Android native API'dir; web katmanına açık değildir. Dolayısıyla:

- **F0 (PWA):** %100 manuel giriş. Saat verisi yok.
- **F1 (Capacitor wrapper):** aynı kod tabanı native kabuğa sarılır, Health Connect plugin'i eklenir. Otomatik sync burada başlar.

Bu yüzden F0'ı "geçici çözüm" değil, **kalıcı manuel giriş katmanı** olarak tasarla. Kanıt bunu destekliyor: günlük kayıt tutmak, kilo kaybının en güçlü davranışsal yordayıcısı — diyetin türünden bile daha belirleyici. Otomatik sync bunu tamamlar, yerine geçmez.

**Tasarım kuralı:** kayıt girişi 60 saniyeden kısa sürmeli. Uzun form = terk edilen uygulama.

---

## 1. Kapsam

### İçeride (F0)
- Günlük giriş: kilo, protein (g), antrenman, adım, tansiyon
- Akşam retro: 3 soru
- Bugün ekranı (tek ekranda giriş + durum)
- Hafta ekranı (7-gün hareketli ortalama + uyum yüzdesi)
- Offline-first (PWA, IndexedDB → sync)

### Dışarıda (bilinçli olarak)
- Kalori sayımı / besin veritabanı → protein gramı yeterli, kalori tahmini gürültü üretir
- Sosyal / paylaşım özellikleri
- Çoklu kullanıcı, auth sistemi (tek kullanıcı — basit token yeterli)
- Grafik kütüphanesi cambazlığı → F0'da tek sparkline yeter

---

## 2. Faz planı

| Faz | Kapsam | Çıktı |
|---|---|---|
| **F0** | PWA, manuel giriş, local + backend sync | Kullanılabilir günlük takip |
| **F1** | Capacitor + Health Connect plugin | Adım/uyku/nabız otomatik |
| **F2** | MCP server (ATLAS üzerinde) | Claude verileri okur, haftalık analiz |
| **F3** | `PERMISSION_READ_HEALTH_DATA_HISTORY` + background sync | Geçmiş backfill |

**F0'ı bitirmeden F1'e geçme.** 2 haftalık gerçek kullanım verisi olmadan şema kararları körlemesine olur.

---

## 3. Veri modeli

```sql
-- Günlük kayıt (bir gün = bir satır)
daily_log (
  id            uuid pk,
  date          date unique not null,   -- kullanıcının local tarihi
  weight_kg     numeric(5,2),           -- sabah, aç karnına
  protein_g     integer,
  steps         integer,
  bp_systolic   integer,
  bp_diastolic  integer,
  notes         text,
  created_at    timestamptz,
  updated_at    timestamptz
)

-- Antrenman (bir günde birden fazla olabilir)
workout (
  id            uuid pk,
  date          date not null,
  type          text not null,          -- 'resistance' | 'cardio' | 'walk' | 'rest'
  duration_min  integer,
  sets_total    integer,                -- direnç günlerinde
  muscle_groups text[],                 -- ['chest','back','legs']
  notes         text
)

-- Akşam retro
retro (
  id            uuid pk,
  date          date unique not null,
  went_well     text,                   -- bugün ne iyi gitti?
  resistance    text,                   -- nerede zorlandım?
  experiment    text                    -- yarın küçük deney?
)

-- F1'de dolar, F0'da boş kalır
wearable_sync (
  id            uuid pk,
  date          date not null,
  source        text,                   -- 'health_connect'
  metric        text,                   -- 'steps' | 'sleep_min' | 'resting_hr'
  value         numeric,
  synced_at     timestamptz,
  unique (date, source, metric)
)
```

**Not:** `wearable_sync` ayrı tablo — manuel girilen `steps` ile otomatik geleni karıştırma. Çakışmada otomatik veri kazanır ama manuel giriş silinmez.

---

## 4. Ekranlar

### 4.1 Bugün (ana ekran)
- Üstte: bugünün tarihi + streak sayacı
- Hızlı giriş kartları (her biri tek dokunuş + sayı):
  - Kilo (sabah hatırlatması)
  - Protein — **artımlı buton**: +30g / +35g / +40g (öğün pulsu mantığı), gün içinde birikir
  - Antrenman (tip seç → süre/set)
  - Adım (F1'de otomatik dolar, F0'da manuel)
- Altta: akşam retro kartı (saat 20:00 sonrası öne çıkar)

**Protein girişi kritik:** öğün başına 25-40 g'lık pulslar halinde girilmeli, gün sonunda toplu değil. UI bunu zorlamalı.

### 4.2 Hafta
- 7-gün hareketli kilo ortalaması (tek çizgi, günlük noktalar soluk)
- Uyum yüzdesi: protein hedefine ulaşılan gün / 7
- Haftalık set toplamı, kas grubu bazında (hedef: grup başına 8-12)
- Toplam adım, antrenman günü sayısı

**Karar birimi 7-gün ortalamasıdır.** Günlük kilo rakamını büyük punto ile gösterme, dalgalanma yanıltır.

### 4.3 Ayar
- Hedefler: günlük protein (140g), haftalık kilo kaybı (0.5-0.75 kg), set aralığı
- Hatırlatma saatleri (sabah tartı, akşam retro)
- Veri dışa aktarma (JSON)

---

## 5. Teknik stack

```
Frontend:  React + Vite + TypeScript
           Tailwind (mevcut konvansiyon)
           vite-plugin-pwa (service worker, offline)
           Dexie.js (IndexedDB wrapper)

Backend:   Node + Fastify (veya mevcut ATLAS servisi)
           PostgreSQL
           Tek kullanıcı → static bearer token, auth sistemi kurma

F1:        Capacitor + Health Connect plugin
F2:        MCP server (TypeScript SDK)
```

**Neden Capacitor, Flutter değil:** F0'daki React kodunu aynen taşır. Flutter seçersen F0'ı çöpe atıp baştan yazarsın.

**Offline-first zorunlu:** giriş her zaman önce IndexedDB'ye yazılır, sync arka planda kuyruklanır. Ağ yokken kayıt kaybolmamalı — bu uygulamanın tek gerçek başarısızlık modu.

---

## 6. Health Connect notları (F1 için)

- Varsayılan okuma penceresi: izin verildiği andan **30 gün öncesi**. Daha eskisi hata döndürür.
- Aşmak için `PERMISSION_READ_HEALTH_DATA_HISTORY` gerekir — ve bu izin **hem senin app'inde hem Samsung Health tarafında** açık olmalı.
- Android 14+: kendi yazdığın veride limit yok, başka app'in verisinde 30 gün limiti var.
- `getSdkStatus()` mutlaka kontrol edilmeli — `SDK_UNAVAILABLE` gerçek ve sık bir durum.
- Background read ayrı izin ister.
- Play Store'a yayınlanmayacak (internal test / sideload) → Google sağlık verisi politika incelemesi devre dışı, ciddi zaman tasarrufu.
- **Health Connect kalıcı arşiv değil, köprüdür.** Kendi DB'ne yazmazsan veri kalıcı kaybolur.

---

## 7. MCP tool imzaları (F2)

```typescript
get_daily_logs(start: string, end: string)
  → { date, weight_kg, protein_g, steps, workouts[], retro }[]

get_weekly_summary(week_start: string)
  → { avg_weight_7d, weight_delta, protein_adherence_pct,
      total_sets_by_muscle, workout_days, total_steps }

get_streak()
  → { current_days, longest_days, last_logged_date }

add_daily_log(date, fields)      // yazma — onay akışı gerekir
```

**Yazma izni ayrı scope olmalı.** Okuma serbest, yazma açık onay ister.

---

## 8. Kabul kriterleri (F0 Definition of Done)

- [ ] Günlük giriş 60 saniyede tamamlanıyor (gerçek ölçüm, tahmin değil)
- [ ] Uçak modunda giriş yapılabiliyor, ağ gelince sync oluyor
- [ ] 7-gün hareketli ortalama doğru hesaplanıyor (eksik günler ortalamayı bozmuyor)
- [ ] Ana ekrana kısayol eklenebiliyor, tam ekran açılıyor
- [ ] JSON export çalışıyor
- [ ] Protein artımlı butonu gün içinde birikiyor, gece yarısı sıfırlanıyor
- [ ] Test coverage: hesaplama katmanı %100 (ortalama, uyum yüzdesi, streak)

---

## 9. Sprint bölümü

**Sprint 1 — iskelet**
`feature/db-schema` · `feature/api-crud` · `feature/pwa-shell`
Migration + CRUD endpoint + offline shell. Test: schema + endpoint.

**Sprint 2 — giriş akışı**
`feature/today-screen` · `feature/offline-queue`
Bugün ekranı + IndexedDB kuyruğu + sync. **Buradan sonra günlük kullanmaya başla.**

**Sprint 3 — analiz**
`feature/week-screen` · `feature/metrics-engine`
Hareketli ortalama, uyum yüzdesi, set toplamı. TDD zorunlu — hesaplama hatası tüm kararları bozar.

**Sprint 4 — tamamlama**
`feature/settings` · `feature/export` · `feature/reminders`

**Branch akışı:** dev → test → prod. Test branch merge öncesi TDD şart. Tüm terfiler PR ile, doğrudan push yok.

---

## 10. İlk komut

```
/cto-brief wellness-tracker F0 Sprint 1
```
