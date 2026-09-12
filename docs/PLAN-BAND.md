# PLAN — Health Connect köprüsü + doğrudan BLE band

> Durum: **plan**, kod yok. Kaynak: 2026-09-12 keşfi (`apps/web/src/lib/{health,sleep,db,store}.ts`,
> `apps/web/android/.../SleepPlugin.kt`, `AndroidManifest.xml`).
> Kardeş karar: evaglass'ta sağlık verisi yasağı (kural 5) kaldırıldı, yerine dört koşul geldi —
> açık izin · veri cihazda kalır · tek dokunuşla silinir · ne okunduğu ekranda yazar.

## Neden

Bugün saat verisi `capacitor-health` üzerinden geliyor ve plugin `queryAggregated`'ı
`steps | active-calories | mindfulness` ile sınırlıyor: **nabız, toplam kalori, uyku ve
beslenme okunamıyor**. Ayrıca band verisi ancak bandın kendi uygulaması Health Connect'e
yazıyorsa geliyor — doğrudan bir yol yok.

## Mevcut düzen — nereye bağlanacağız

- `db.ts` — Dexie. `WearableRecord {id:"${date}:${metric}", date, metric, value, source, synced_at}`
  tek tablo; `source` kaynağı ayırt ediyor (`health_connect`, `phone_mic`, …).
  **Yeni kaynak şema değişikliği istemiyor** — yeni bir `source` string'i yeter.
- `health.ts` — `capacitor-health` sarmalayıcısı: `PERMISSIONS`, `BUCKETS`, `syncHealth()`
  (oku → `bulkPut` → adım için `daily_log` kuralı → `hasServer()` ise `POST /api/wearable`).
- `store.ts` — `recordMetrics(source, date, {...})`, tek-günlük kaynakların genel yazma yolu.
- `sleep.ts` + `SleepPlugin.kt`/`SleepService.kt` — **izlenecek kalıp**: npm paketi değil,
  `registerPlugin<SleepPlugin>('Sleep')` ile kendi native plugin'i, foreground service'li.
- `Watch.tsx` / `Sleep.tsx` — izin akışı ve kart içi gizlilik metni deseni.

## 1. Health Connect köprüsü — kendi plugin'imiz, fork değil

`capacitor-health`'in tip sınırı sabit kodlu; fork upstream'le sürekli çakışma demek.
Health Connect'in kendi SDK'sı (`androidx.health.connect.client`) `TotalCaloriesBurnedRecord`,
`HeartRateRecord`, `SleepSessionRecord`, `NutritionRecord` tiplerini zaten veriyor.

- Yeni `com.evaitec.wellness.HealthBridgePlugin.kt` — `SleepPlugin.kt` şablon.
- Manifest izinleri: `READ_HEART_RATE`, `READ_TOTAL_CALORIES_BURNED`, `READ_SLEEP`, `READ_NUTRITION`.
- `health.ts`'e yeni metric'ler; `source` yine `health_connect`.
- `capacitor-health`'i **tamamen** bu plugin'le değiştirmek daha temiz: tek izin kaynağı,
  tek okuma yolu. İki Health Connect istemcisinin yan yana izin istemesi **test edilmedi**.
- `androidx.health.connect:connect-client`'ın gradle grafında zaten olup olmadığı **doğrulanmadı**.

## 2. Doğrudan BLE band — cihaz-agnostik adapter

Hedef bandın markası/modeli **belirsiz**, bu yüzden tek bir banda özel kod yazılmaz.

- Arayüz: `BleAdapter { connect(); readHeartRate(): Observable<number>; readBattery(): Promise<number>; disconnect() }`.
- `GenericGattAdapter` — standart profiller: Heart Rate `0x180D`, Battery `0x180F`,
  Device Information `0x180A`. Hangi adapter'ın kullanılacağı taramadaki service UUID'lerinden seçilir.
- ⚠️ Çoğu tüketici bandı (Xiaomi/Huami, Huawei) adım/uyku/SpO2'yi **tescilli, şifreli
  handshake'li** protokolle veriyor; standart `0x180D` yayınladıkları **doğrulanmadı**.
  Marka-özel adapter ancak model netleşince yazılır. (Protokol bilgisi için açık kaynak
  projeler okunabilir; **kod kopyalanmaz** — lisans.)
- Native BLE yığınını sıfırdan yazmak yerine `@capacitor-community/bluetooth-le` (MIT):
  scan/connect/notify JS tarafından gelir. Yeni bağımlılık olduğu için PR'da gerekçelendirilir;
  alternatifi (elde Kotlin GATT + foreground service) çok daha büyük bakım yüzeyi.
- Yazma: `recordMetrics('ble:<band-id>', date, {heart_rate_bpm, battery_pct})` → aynı
  `WearableRecord`. Metric adları Health Connect tarafıyla **aynı** olmalı, yoksa iki isim şeması doğar.

## 3. Gizlilik — dördü de mevcut desenle karşılanıyor

- **Cihazda kalır**: Dexie + opsiyonel sunucu senkronu; `hasServer()` false ise hiçbir şey gitmiyor. Ek kod yok.
- **Açık izin**: `Watch.tsx` izin akışı tekrarlanır; Android 12+ `BLUETOOTH_SCAN`/`BLUETOOTH_CONNECT` ayrı runtime izni.
- **Tek dokunuşla silme**: `Settings.tsx`'e buton → `db.wearable.where('source').startsWith('ble:').delete()`.
- **Ne okunuyor neden**: `Sleep.tsx`'teki kart içi düz metin kalıbı yeni `Band.tsx`'te tekrarlanır.
  Ayrı gizlilik ekranı gereksiz.

## 4. Sıra — küçük adımlar, her biri doğrulanabilir

1. **Health Connect genişletme** — `HealthBridgePlugin.kt`, manifest izinleri, `health.ts` metric'leri.
   Doğrulama: `npm test` · `apps/web`: `npm run typecheck`, `npm run build` · `npm run apk` ile
   gerçek cihazda izin ekranında yeni kalemleri gör.
2. **BLE arayüzü + generic adapter** — `apps/web/src/lib/ble.ts`, `@capacitor-community/bluetooth-le`.
   Doğrulama: `npm run typecheck`; adapter mantığı vitest + mock GATT, gerçek I/O elle.
3. **`Band.tsx`** — tarama/bağlan/oku + gizlilik metni; `Settings.tsx` silme butonu.
4. **Veri yazımı** — `recordMetrics('ble:<id>', …)`, `App.tsx`'e bileşen.
   Doğrulama: DevTools'ta `source` alanı + `npm test`.
5. **Marka-özel protokol** — yalnız model netleşirse; ayrı dosya, mevcut mimariye dokunmaz.

## 5. Riskler

- Hedef band bilinmiyor → tescilli protokol tasarlanamaz, yalnız arayüz hazırlanır. **Doğrulanmadı.**
- Bandın `0x180D` yayınladığı **doğrulanmadı**.
- `androidx.health.connect` gradle grafında var mı **doğrulanmadı**.
- `NutritionRecord`'u dolduran kaynak app telefonda kurulu mu **doğrulanmadı** — yoksa sorun
  plugin değil, veri kaynağı.
- BLE arka plan bağlantısı Doze/OEM pil optimizasyonuna takılabilir; `Sleep`'teki foreground
  service deneyimi gerekebilir. Pil tüketimi **ölçülmedi**.
